/**
 * PR outreach reply capture (SendGrid Inbound Parse).
 *
 * Phase 1: an outbound pitch's reply-to becomes `<token>@reply.pravado.io`. The
 * token (a 128-bit random, unguessable local-part) maps to the org / journalist
 * / run and the customer inbox to forward to. When the journalist replies,
 * Inbound Parse POSTs the message; we resolve the token, dedupe, store the
 * reply, score it, and forward it to the customer.
 *
 * The token doubles as the capability: a reply can only be attributed to a
 * thread by someone who received the address, so an unsigned Inbound Parse POST
 * cannot forge a reply for a token it does not know.
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
