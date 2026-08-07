/**
 * PR `pr.send_pitch` executor (Wave-2 — the SECOND concrete per-pillar executor).
 *
 * Given a `pr.send_pitch` proposal, sends the pitch EXCLUSIVELY through the B+C
 * governed send chokepoint (`sendGuardedEmail`) — inheriting, in order: CAN-SPAM
 * suppression, pitch-eligibility, the tier caps, the follow-up cap, and the
 * server-computed personalization gate (sendGuardedEmail.ts:15-25). It NEVER calls
 * the email provider directly; the ONLY path to the provider is the tagged
 * `deliverabilityRawSend` wrapper, exactly as the three sanctioned route/service
 * send-sites do. The CI guardrail (scripts/check-api-send-chokepoint.mjs) statically
 * enforces this — a direct raw-provider call here would fail the build.
 *
 * Governance: this runs inside the already-audited, human-initiated CRAFT execution
 * (see executors/types.ts). It does not flip proposals or write audit rows — the
 * lifecycle owns that. It only produces the pillar effect + the outcome to record.
 *
 * OUTCOME SEMANTICS — three distinct, honest cases (no lying) + a needs-content path:
 *   - Guarded send ACCEPTED by the provider          → `success`      (real send;
 *     prod EMAIL_PROVIDER is the stub, so egress is a stub but governance still ran).
 *   - A governor / suppression / eligibility / personalization gate REFUSED the send
 *     → `governed_complete` carrying the block reason. NOT `success` (nothing sent)
 *     and NOT `failure` (nothing errored) — the system worked as designed.
 *   - Provider attempted the send and reported failure, or an exception is thrown
 *     (caught by the runner) → `failure`.
 *   - No pitch subject/body on the proposal           → `governed_complete`
 *     (kind `pr_pitch_needs_content`). We NEVER fabricate a pitch body or send empty.
 */

import type { ProviderConfig } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { ActionExecutor, ExecutorContext, ExecutorResult } from './types';
import { createSupabaseGovernanceGateways } from '../../governanceGateways';
import {
  createOutreachDeliverabilityService,
  type OutreachDeliverabilityService,
} from '../../outreachDeliverabilityService';
import {
  deliverabilityRawSend,
  sendGuardedEmail,
  type GovernanceGateways,
  type RawSend,
} from '../../sendGuardedEmail';

interface SendPitchParams {
  journalist_id?: unknown;
  journalistId?: unknown;
  contact_id?: unknown;
  contactId?: unknown;
  subject?: unknown;
  body_html?: unknown;
  bodyHtml?: unknown;
  body_text?: unknown;
  bodyText?: unknown;
  body?: unknown;
  is_follow_up?: unknown;
  isFollowUp?: unknown;
}

/** The recipient the pitch is addressed to, resolved through the governed path. */
export interface ResolvedRecipient {
  email: string;
  name: string | null;
  outlet: string | null;
  beats: string[];
  journalistId: string | null;
  contactId: string | null;
}

/** Injectable seams so the executor's logic is unit-testable without a DB/provider. */
export interface PrSendPitchDeps {
  gateways?: GovernanceGateways;
  rawSend?: RawSend;
  resolveRecipient?: (
    supabase: SupabaseClient,
    journalistId: string,
    contactId: string
  ) => Promise<ResolvedRecipient | null>;
}

function asTrimmedString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function redact(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Resolve the email provider config from env — mirrors the two route send-sites
 * (getProviderConfig in prOutreach/prOutreachDeliverability). Prod default is the
 * STUB provider (SendGrid unprovisioned): egress is a stub while all governance runs.
 */
function resolveProviderConfig(): ProviderConfig {
  const provider =
    (process.env.EMAIL_PROVIDER as ProviderConfig['provider']) || 'stub';
  if (provider === 'sendgrid') {
    return {
      provider: 'sendgrid',
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@pravado.com',
      fromName: process.env.SENDGRID_FROM_NAME || 'Pravado',
    };
  }
  if (provider === 'mailgun') {
    return {
      provider: 'mailgun',
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN,
      fromEmail: process.env.MAILGUN_FROM_EMAIL || 'noreply@pravado.com',
      fromName: 'Pravado',
    };
  }
  return {
    provider: 'stub',
    fromEmail: 'noreply@pravado.com',
    fromName: 'Pravado',
  };
}

/**
 * Default recipient resolution through the GOVERNED path (never a raw ad-hoc read):
 *   1. Firewall first — contact_emails + media_contacts (§2.3 Identity/Contact
 *      firewall; emails live only in contact_emails).
 *   2. Legacy journalists table — the same source the chokepoint's gateway
 *      dual-reads until the 784K backfill completes.
 * The chokepoint's own gateway independently re-reads suppression/eligibility from
 * these same tables; this only resolves the `to` address + personalization context.
 */
async function defaultResolveRecipient(
  supabase: SupabaseClient,
  journalistId: string,
  contactId: string
): Promise<ResolvedRecipient | null> {
  if (contactId) {
    const { data: emailRow } = await supabase
      .from('contact_emails')
      .select('email')
      .eq('contact_id', contactId)
      .limit(1)
      .maybeSingle();
    const email = asTrimmedString(emailRow?.email);
    if (email) {
      const { data: mc } = await supabase
        .from('media_contacts')
        .select('id, name')
        .eq('id', contactId)
        .maybeSingle();
      return {
        email,
        name: (mc?.name as string) ?? null,
        outlet: null,
        beats: [],
        journalistId: journalistId || null,
        contactId,
      };
    }
  }

  if (journalistId) {
    const { data: j } = await supabase
      .from('journalists')
      .select('id, name, email, outlet, beat')
      .eq('id', journalistId)
      .maybeSingle();
    const email = asTrimmedString(j?.email);
    if (email) {
      return {
        email,
        name: (j?.name as string) ?? null,
        outlet: (j?.outlet as string) ?? null,
        beats: j?.beat ? [j.beat as string] : [],
        journalistId,
        contactId: contactId || null,
      };
    }
  }

  return null;
}

/**
 * Core, dependency-injected implementation. `prSendPitchExecutor` is the thin
 * production binding; tests call this with fake gateways/rawSend to assert the
 * governors + the "chokepoint is the ONLY path to the provider" invariant.
 */
export async function runPrSendPitch(
  proposal: Record<string, unknown>,
  ctx: ExecutorContext,
  deps: PrSendPitchDeps = {}
): Promise<ExecutorResult> {
  const params = (proposal.action_params ?? {}) as SendPitchParams;

  const journalistId = asTrimmedString(
    params.journalist_id ?? params.journalistId
  );
  const contactId = asTrimmedString(params.contact_id ?? params.contactId);
  const subject = asTrimmedString(params.subject);
  const bodyHtml = asTrimmedString(
    params.body_html ?? params.bodyHtml ?? params.body
  );
  const bodyTextRaw = asTrimmedString(params.body_text ?? params.bodyText);
  const bodyText = bodyTextRaw || (bodyHtml ? stripHtml(bodyHtml) : '');
  const isFollowUp = params.is_follow_up === true || params.isFollowUp === true;

  // ---- needs_content: never send an empty pitch (neutral, governed) ----
  // Pitch bodies are composed elsewhere; at proposal time they are usually absent
  // (the PR signals carry a journalist + optional subject, never a body). We do NOT
  // fabricate one — we record an honest needs_content outcome and send nothing.
  if (!subject || !(bodyHtml || bodyText)) {
    return {
      result: 'governed_complete',
      detail: {
        kind: 'pr_pitch_needs_content',
        action_type: 'pr.send_pitch',
        note: 'Pitch subject/body not available on the proposal; nothing sent (no fabricated pitch).',
        has_subject: Boolean(subject),
        has_body: Boolean(bodyHtml || bodyText),
        journalist_id: journalistId || null,
        contact_id: contactId || null,
      },
    };
  }

  // ---- resolve the recipient through the governed path ----
  if (!journalistId && !contactId) {
    return {
      result: 'governed_complete',
      detail: {
        kind: 'pr_pitch_needs_recipient',
        action_type: 'pr.send_pitch',
        note: 'No journalist_id/contact_id on the proposal; cannot resolve a recipient. Nothing sent.',
      },
    };
  }

  const resolveRecipient = deps.resolveRecipient ?? defaultResolveRecipient;
  const recipient = await resolveRecipient(
    ctx.supabase,
    journalistId,
    contactId
  );
  if (!recipient) {
    return {
      result: 'governed_complete',
      detail: {
        kind: 'pr_pitch_needs_recipient',
        action_type: 'pr.send_pitch',
        note: 'Recipient email could not be resolved from the contact firewall or legacy journalist record. Nothing sent.',
        journalist_id: journalistId || null,
        contact_id: contactId || null,
      },
    };
  }

  // ---- send EXCLUSIVELY through the governed chokepoint ----
  // The deliverability service is built ONLY for the production default rawSend
  // (and the optional post-send tracking write). When tests inject deps.rawSend we
  // never touch the provider config at all.
  let deliverabilityService: OutreachDeliverabilityService | undefined;
  let rawSend = deps.rawSend;
  if (!rawSend) {
    deliverabilityService = createOutreachDeliverabilityService({
      supabase: ctx.supabase,
      providerConfig: resolveProviderConfig(),
    });
    rawSend = deliverabilityRawSend(deliverabilityService);
  }
  const gateways =
    deps.gateways ?? createSupabaseGovernanceGateways(ctx.supabase);

  const guarded = await sendGuardedEmail({
    request: {
      to: recipient.email,
      subject,
      bodyHtml: bodyHtml || bodyText,
      bodyText,
      metadata: {
        orgId: ctx.orgId,
        journalistId: recipient.journalistId,
        contactId: recipient.contactId,
        proposalId: ctx.proposalId,
        executionId: ctx.executionId,
        source: 'sage_proposal',
        action_type: 'pr.send_pitch',
      },
    },
    context: {
      orgId: ctx.orgId,
      contactId: recipient.contactId,
      journalistId: recipient.journalistId,
      recipientEmail: recipient.email,
      isFollowUp,
      purpose: 'pitch',
      personalization: {
        name: recipient.name,
        outlet: recipient.outlet,
        beats: recipient.beats,
      },
    },
    gateways,
    rawSend,
  });

  // ---- Case 2: a governor REFUSED — neutral governed outcome carrying the reason.
  // NOT success (nothing sent), NOT failure (nothing errored).
  if (guarded.refusal) {
    return {
      result: 'governed_complete',
      detail: {
        kind: 'pr_pitch_governed_refusal',
        action_type: 'pr.send_pitch',
        governor: guarded.refusal.governor,
        reason: guarded.refusal.reason,
        refusal_details: guarded.refusal.details ?? null,
        personalization_score: guarded.personalization.score,
        journalist_id: recipient.journalistId,
        contact_id: recipient.contactId,
      },
    };
  }

  const provider = guarded.providerResponse;

  // ---- Case 1: guarded send ACCEPTED by the provider → VERIFIED success.
  if (provider?.success) {
    // Best-effort tracking write so the daily-pitch-cap governor counts this
    // executor-originated send. Non-fatal: the send already happened + is audited.
    if (deliverabilityService && recipient.journalistId && provider.messageId) {
      try {
        await deliverabilityService.createEmailMessage(ctx.orgId, {
          journalistId: recipient.journalistId,
          subject,
          bodyHtml: bodyHtml || bodyText,
          bodyText,
          providerMessageId: provider.messageId,
          metadata: {
            source: 'sage_proposal',
            proposalId: ctx.proposalId,
            executionId: ctx.executionId,
            provider: provider.provider,
          },
        });
      } catch {
        /* tracking is best-effort; the send is already done + audited */
      }
    }
    return {
      result: 'success',
      detail: {
        kind: 'pr_pitch_sent',
        action_type: 'pr.send_pitch',
        provider: provider.provider,
        provider_message_id: provider.messageId,
        recipient_email_redacted: redact(recipient.email),
        personalization_score: guarded.personalization.score,
        warnings: guarded.warnings,
        journalist_id: recipient.journalistId,
        contact_id: recipient.contactId,
        is_follow_up: isFollowUp,
      },
    };
  }

  // ---- Case 3: provider attempted the send and reported failure → failure.
  return {
    result: 'failure',
    detail: {
      kind: 'pr_pitch_send_failed',
      action_type: 'pr.send_pitch',
      provider: provider?.provider ?? null,
      error: provider?.error ?? 'Provider send failed with no error detail.',
      journalist_id: recipient.journalistId,
      contact_id: recipient.contactId,
    },
  };
}

export const prSendPitchExecutor: ActionExecutor = (proposal, ctx) =>
  runPrSendPitch(proposal, ctx);
