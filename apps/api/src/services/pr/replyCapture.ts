/**
 * PR outreach reply capture (provider-agnostic).
 *
 * An outbound pitch's reply-to becomes `<token>@reply.pravado.io`. The token
 * (a 128-bit random, unguessable local-part) maps to the org / journalist / run
 * and the customer inbox to forward to. When the journalist replies, the inbound
 * provider hands us the message; we resolve the token, dedupe, store the reply,
 * score it, and forward it to the customer.
 *
 * Two inbound transports feed the same {@link processInboundReply} core:
 *   - Resend inbound (primary): an `email.received` Svix webhook carries only
 *     metadata; the body is fetched from the Received-emails API by `email_id`.
 *   - SendGrid Inbound Parse (legacy): a multipart POST carries the full body.
 *     Retained only through the reply.pravado.io MX cutover to Resend.
 *
 * The token doubles as the capability: a reply can only be attributed to a
 * thread by someone who received the address, so an unsigned inbound POST cannot
 * forge a reply for a token it does not know.
 *
 * All helpers are best-effort where they touch a send path — reply-capture must
 * never block or fail an outbound pitch.
 */

import { randomBytes } from 'node:crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

export const REPLY_DOMAIN =
  process.env.PR_OUTREACH_REPLY_DOMAIN || 'reply.pravado.io';

export interface ReplyTokenContext {
  orgId: string;
  journalistId?: string | null;
  runId?: string | null;
  messageId?: string | null;
  proposalId?: string | null;
  /** Customer inbox to forward the journalist's reply to (was the reply-to). */
  forwardTo?: string | null;
  subject?: string | null;
}

export interface ReplyTokenRow {
  id: string;
  org_id: string;
  token: string;
  journalist_id: string | null;
  run_id: string | null;
  message_id: string | null;
  proposal_id: string | null;
  forward_to: string | null;
  subject: string | null;
}

/** Random, case-insensitive (hex) token — safe as an email local-part. */
export function generateReplyToken(): string {
  return randomBytes(16).toString('hex'); // 32 hex chars, well under the 64 limit
}

/** The reply-to address a journalist sees for a given token. */
export function replyAddressFor(token: string): string {
  return `${token}@${REPLY_DOMAIN}`;
}

/**
 * Create a reply-token row and return the tokenized reply-to address.
 * Best-effort: returns null on any failure so a send is never blocked.
 */
export async function createReplyToken(
  supabase: SupabaseClient,
  ctx: ReplyTokenContext
): Promise<string | null> {
  try {
    const token = generateReplyToken();
    const { error } = await supabase.from('pr_outreach_reply_tokens').insert({
      org_id: ctx.orgId,
      token,
      journalist_id: ctx.journalistId ?? null,
      run_id: ctx.runId ?? null,
      message_id: ctx.messageId ?? null,
      proposal_id: ctx.proposalId ?? null,
      forward_to: ctx.forwardTo ?? null,
      subject: ctx.subject ?? null,
    });
    if (error) return null;
    return replyAddressFor(token);
  } catch {
    return null;
  }
}

/**
 * Pull the reply.pravado.io token out of an inbound `to` field (which may hold
 * multiple addresses and display names).
 */
export function parseTokenFromRecipients(
  toField: string | undefined
): string | null {
  if (!toField) return null;
  const domain = REPLY_DOMAIN.replace(/\./g, '\\.');
  const re = new RegExp(`([a-f0-9]{16,64})@${domain}`, 'i');
  const m = re.exec(toField);
  return m?.[1]?.toLowerCase() ?? null;
}

export async function resolveReplyToken(
  supabase: SupabaseClient,
  token: string
): Promise<ReplyTokenRow | null> {
  const { data } = await supabase
    .from('pr_outreach_reply_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle();
  return (data as ReplyTokenRow | null) ?? null;
}

/** Message-ID header out of SendGrid's raw `headers` field (dedup key). */
export function extractMessageId(headers: string | undefined): string | null {
  if (!headers) return null;
  const m = /^message-id:\s*(.+)$/im.exec(headers);
  return m?.[1]?.trim() ?? null;
}

/**
 * Detect auto-responders / bounces / vacation replies — these must NOT be
 * treated as a genuine journalist reply (no engagement bump, no forward).
 */
export function isAutoResponder(fields: Record<string, string>): boolean {
  const from = (fields.from || '').toLowerCase();
  const headers = (fields.headers || '').toLowerCase();
  if (!from) return true;
  if (/mailer-daemon|postmaster|no-?reply|do-?not-?reply/.test(from))
    return true;
  if (
    /auto-submitted:\s*(auto-replied|auto-generated|auto-notified)/.test(
      headers
    )
  )
    return true;
  if (/precedence:\s*(bulk|auto_reply|junk|list)/.test(headers)) return true;
  if (/x-autorespond|x-autoreply:\s*yes|x-auto-response-suppress/.test(headers))
    return true;
  return false;
}

export interface RecordInboundResult {
  inserted: boolean;
}

/**
 * Insert an inbound reply, deduped on (org, inbound Message-ID). Returns
 * inserted=false when the Message-ID was already seen (SendGrid retry / race).
 */
export async function recordInboundReply(
  supabase: SupabaseClient,
  row: {
    orgId: string;
    tokenId?: string | null;
    journalistId?: string | null;
    runId?: string | null;
    fromEmail?: string | null;
    subject?: string | null;
    bodyText?: string | null;
    bodyHtml?: string | null;
    inboundMessageId?: string | null;
    forwardedAt?: string | null;
  }
): Promise<RecordInboundResult> {
  if (row.inboundMessageId) {
    const { data: existing } = await supabase
      .from('pr_outreach_inbound_replies')
      .select('id')
      .eq('org_id', row.orgId)
      .eq('inbound_message_id', row.inboundMessageId)
      .maybeSingle();
    if (existing) return { inserted: false };
  }

  const { error } = await supabase.from('pr_outreach_inbound_replies').insert({
    org_id: row.orgId,
    token_id: row.tokenId ?? null,
    journalist_id: row.journalistId ?? null,
    run_id: row.runId ?? null,
    from_email: row.fromEmail ?? null,
    subject: row.subject ?? null,
    body_text: row.bodyText ?? null,
    body_html: row.bodyHtml ?? null,
    inbound_message_id: row.inboundMessageId ?? null,
    forwarded_at: row.forwardedAt ?? null,
  });

  if (error) {
    // Unique-violation race on the Message-ID → duplicate, not a new reply.
    if ((error as { code?: string }).code === '23505')
      return { inserted: false };
    throw error;
  }
  return { inserted: true };
}

/**
 * A resolved inbound reply, normalized across transports (SendGrid multipart /
 * Resend JSON). The transport route resolves the token first, then hands the
 * normalized message here.
 */
export interface InboundReplyInput {
  tokenRow: ReplyTokenRow;
  fromEmail: string | null;
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  /** Raw header blob for auto-responder detection (may be empty). */
  headersRaw?: string | null;
  /** Provider/RFC Message-ID — the dedup key. */
  inboundMessageId: string | null;
}

export interface InboundReplyDeps {
  supabase: SupabaseClient;
  /**
   * Transactional mailer used to forward the reply to the customer. This is the
   * governance-clean channel (a forward is NOT a governed outreach pitch), so it
   * must NOT be the outreach email provider.
   */
  sendMail: (msg: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) => Promise<unknown>;
  /** Recompute journalist engagement after a reply (best-effort). */
  updateEngagement?: (journalistId: string, orgId: string) => Promise<void>;
  logWarn?: (obj: unknown, msg: string) => void;
}

export interface InboundReplyResult {
  processed: boolean;
  reason?: 'auto_responder' | 'duplicate';
  forwarded?: boolean;
}

/**
 * Provider-agnostic core: given a resolved token + a normalized message, dedupe,
 * store, score (mark the run replied → recompute engagement), and forward to the
 * customer. Both inbound transports call this after resolving the token so the
 * capture/score/forward semantics stay identical regardless of provider.
 *
 * Best-effort throughout: scoring and forwarding failures are swallowed (logged)
 * so a captured reply is never lost to a downstream hiccup. Callers ack 2xx on
 * every returned result; only an unexpected throw should surface as a 5xx retry.
 */
export async function processInboundReply(
  deps: InboundReplyDeps,
  input: InboundReplyInput
): Promise<InboundReplyResult> {
  const { supabase } = deps;
  const { tokenRow } = input;

  // Auto-responders / bounces / vacation replies are not genuine replies.
  if (
    isAutoResponder({
      from: input.fromEmail ?? '',
      headers: input.headersRaw ?? '',
    })
  ) {
    return { processed: false, reason: 'auto_responder' };
  }

  const rec = await recordInboundReply(supabase, {
    orgId: tokenRow.org_id,
    tokenId: tokenRow.id,
    journalistId: tokenRow.journalist_id,
    runId: tokenRow.run_id,
    fromEmail: input.fromEmail,
    subject: input.subject,
    bodyText: input.bodyText,
    bodyHtml: input.bodyHtml,
    inboundMessageId: input.inboundMessageId,
  });
  if (!rec.inserted) return { processed: false, reason: 'duplicate' };

  // Mark the run replied (feeds total_replied), then recompute the journalist
  // engagement score. The CRAFT single-pitch path has no run, so its reply is
  // captured + forwarded but not run-scored (Phase 1 limit).
  if (tokenRow.run_id) {
    await supabase
      .from('pr_outreach_runs')
      .update({
        replied_at: new Date().toISOString(),
        stop_reason: 'journalist_replied',
      })
      .eq('id', tokenRow.run_id)
      .eq('org_id', tokenRow.org_id)
      .is('replied_at', null);
  }
  if (tokenRow.journalist_id && deps.updateEngagement) {
    try {
      await deps.updateEngagement(tokenRow.journalist_id, tokenRow.org_id);
    } catch (err) {
      deps.logWarn?.({ err }, 'reply engagement update failed (non-fatal)');
    }
  }

  // Forward to the customer via the transactional mailer. Non-fatal — the reply
  // is already captured + scored even if the forward fails.
  let forwarded = false;
  if (tokenRow.forward_to) {
    try {
      const journalistFrom = input.fromEmail?.trim() || 'the journalist';
      const baseSubject =
        input.subject?.trim() ||
        (tokenRow.subject ? `Re: ${tokenRow.subject}` : 'Re: your pitch');
      const noticeHtml = `<p style="color:#667;font-size:12px;margin:0 0 8px">A journalist replied to your Pravado pitch — reply directly to <b>${journalistFrom}</b>.</p><hr style="border:none;border-top:1px solid #ddd"/>`;
      const noticeText = `A journalist replied to your Pravado pitch — reply directly to ${journalistFrom}.\n\n`;
      await deps.sendMail({
        to: tokenRow.forward_to,
        subject: baseSubject,
        html:
          noticeHtml + (input.bodyHtml || `<pre>${input.bodyText || ''}</pre>`),
        text: noticeText + (input.bodyText || ''),
      });
      forwarded = true;
      if (input.inboundMessageId) {
        await supabase
          .from('pr_outreach_inbound_replies')
          .update({ forwarded_at: new Date().toISOString() })
          .eq('org_id', tokenRow.org_id)
          .eq('inbound_message_id', input.inboundMessageId);
      }
    } catch (err) {
      deps.logWarn?.({ err }, 'reply forward failed (non-fatal)');
    }
  }

  return { processed: true, forwarded };
}
