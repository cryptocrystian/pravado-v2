/**
 * sendGuardedEmail — the single governed chokepoint in front of provider.send.
 *
 * Lane B (send governance). Canon: JOURNALIST_DATABASE_GOVERNANCE.md §4
 * (state machine / suppression), §10.3 (sending guardrails / tier caps),
 * §16 (CAN-SPAM); PR_WORK_SURFACE_CONTRACT.md §7 (guardrails/gates);
 * PR_PILLAR_MODEL.md:135-136 (personalization 40 block / 60 warn).
 *
 * NON-NEGOTIABLE: every outbound pitch/email MUST pass through this function.
 * All three send sites (outreachService.advanceRun, prOutreach /send-pitch,
 * prOutreachDeliverability /test-send) route through here. A CI guardrail
 * (scripts/check-api-send-chokepoint.mjs) fails the build if any other send
 * site calls the provider directly.
 *
 * Governors enforced IN ORDER before the raw send:
 *   1. CAN-SPAM suppression hard block  (contact_state ∈ {suppressed,bounced}
 *      globally, or org do_not_contact)  -> refuse + audit any opt-out/bounce.
 *   2. Pitch-eligibility                 (contact_state must be pitch_eligible).
 *   3. Daily pitch cap                   (tier dependent).
 *   4. Active-sequence cap               (tier dependent).
 *   5. Follow-up cap                     (max 2 per contact per 7 days).
 *   6. Personalization gate              (server-computed; block < 40, warn < 60).
 *
 * On any hard-fail the function REFUSES (does not call the provider) and
 * returns a structured refusal that the caller surfaces + logs.
 */

import type { SendEmailRequest, SendEmailResponse } from '@pravado/types';

import {
  PERSONALIZATION_WARN_THRESHOLD,
  scorePersonalization,
  type PersonalizationInput,
  type PersonalizationResult,
} from './personalizationScore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ContactState =
  | 'identity_only'
  | 'enrichment_queued'
  | 'enriched'
  | 'pitch_eligible'
  | 'stale'
  | 'suppressed'
  | 'bounced'
  | 'do_not_contact';

export type PlanTier = 'starter' | 'pro' | 'enterprise';

/** Per-tier sending caps (canon §10.3). */
export const TIER_CAPS: Record<PlanTier, { dailyPitches: number; activeSequences: number }> = {
  starter: { dailyPitches: 5, activeSequences: 2 },
  pro: { dailyPitches: 25, activeSequences: 10 },
  enterprise: { dailyPitches: 100, activeSequences: Number.POSITIVE_INFINITY },
};

/** Max follow-ups to a single contact per 7 days (canon §10.3, PR contract §7.1). */
export const FOLLOWUP_CAP_PER_7D = 2;

export type GovernorCode =
  | 'suppression'
  | 'pitch_eligibility'
  | 'daily_pitch_cap'
  | 'active_sequence_cap'
  | 'followup_cap'
  | 'personalization';

export interface GuardedSendContext {
  orgId: string;
  /** media_contacts.id when known (dual-read: may be resolved from email). */
  contactId?: string | null;
  /** Legacy journalists.id — used to resolve the contact when contactId absent. */
  journalistId?: string | null;
  /** Recipient email — always required; used for suppression + follow-up lookups. */
  recipientEmail: string;
  /** Acting user id for audit. */
  actorId?: string | null;
  /** True when this send is a follow-up in an existing sequence/thread. */
  isFollowUp?: boolean;
  /** Personalization recipient context (server recomputes the score from this). */
  personalization: PersonalizationInput['recipient'];
  /** What kind of send this is — governs which governors apply. */
  purpose: 'pitch' | 'sequence' | 'test';
}

export interface GuardedSendRefusal {
  governor: GovernorCode;
  reason: string;
  /** Extra structured context for logs / UI improvement suggestions. */
  details?: Record<string, unknown>;
}

export interface GuardedSendResult {
  /** True only when the provider was actually invoked and returned success. */
  sent: boolean;
  /** Present when a governor refused the send (provider NOT called). */
  refusal?: GuardedSendRefusal;
  /** The provider response, when a send was attempted. */
  providerResponse?: SendEmailResponse;
  /** Non-blocking warnings (e.g. personalization 40-60). */
  warnings: string[];
  /** The server-computed personalization result (always populated). */
  personalization: PersonalizationResult;
}

/** Resolved governance snapshot for a contact. */
export interface ContactGovernanceState {
  contactId: string | null;
  state: ContactState | null;
  orgDoNotContact: boolean;
}

/**
 * Data-access seam for the governors. The default implementation reads from
 * Supabase; tests inject a fake so the governor LOGIC is tested deterministically.
 */
export interface GovernanceGateways {
  /** Resolve the platform contact_state + org-scoped do_not_contact. */
  getContactGovernanceState(ctx: GuardedSendContext): Promise<ContactGovernanceState>;
  /** Org plan tier (drives caps). */
  getOrgTier(orgId: string): Promise<PlanTier>;
  /** Pitches this org has sent since 00:00 today. */
  countPitchesSentToday(orgId: string): Promise<number>;
  /** Active (running) sequence runs for this org. */
  countActiveSequences(orgId: string): Promise<number>;
  /** Follow-ups this org has sent to this contact in the last 7 days. */
  countFollowUpsLast7Days(
    orgId: string,
    keys: { contactId: string | null; journalistId?: string | null; email: string }
  ): Promise<number>;
  /** Append a contact_state_transitions audit row + move the state. */
  recordStateTransition(input: {
    contactId: string;
    fromState: ContactState | null;
    toState: ContactState;
    trigger: string;
    actorType: 'user' | 'system' | 'journalist';
    actorId?: string | null;
    orgId?: string | null;
  }): Promise<void>;
}

/** Structured logger seam (defaults to console). */
export interface GuardLogger {
  warn(obj: unknown, msg?: string): void;
  info(obj: unknown, msg?: string): void;
}

const defaultLogger: GuardLogger = {
  warn: (obj, msg) => console.warn(msg ?? '', obj),
  info: (obj, msg) => console.info(msg ?? '', obj),
};

/** The raw provider send — the ONLY thing allowed to reach provider.send. */
export type RawSend = (request: SendEmailRequest) => Promise<SendEmailResponse>;

/**
 * The ONE permitted raw-send wrapper. This is the single line in the entire
 * apps/api tree allowed to invoke the provider-backed `sendEmail`. The CI
 * guardrail (scripts/check-api-send-chokepoint.mjs) enforces that the
 * `// chokepoint-rawsend` marker below is the only place `.sendEmail(` is
 * called outside the deliverability service itself. Every send site obtains
 * its RawSend from here, guaranteeing it cannot bypass the governors.
 */
export function deliverabilityRawSend(
  svc: { sendEmail: (request: SendEmailRequest) => Promise<SendEmailResponse> }
): RawSend {
  return (request) => svc.sendEmail(request); // chokepoint-rawsend
}

// ---------------------------------------------------------------------------
// The chokepoint
// ---------------------------------------------------------------------------

export async function sendGuardedEmail(args: {
  request: SendEmailRequest;
  context: GuardedSendContext;
  gateways: GovernanceGateways;
  rawSend: RawSend;
  logger?: GuardLogger;
}): Promise<GuardedSendResult> {
  const { request, context, gateways, rawSend } = args;
  const logger = args.logger ?? defaultLogger;
  const warnings: string[] = [];

  // Personalization is computed up-front (server-side) so it is always in the
  // result even when an earlier governor refuses.
  const personalization = scorePersonalization({
    subject: request.subject,
    bodyText: request.bodyText || stripHtml(request.bodyHtml),
    recipient: context.personalization,
  });

  const refuse = (refusal: GuardedSendRefusal): GuardedSendResult => {
    logger.warn(
      { orgId: context.orgId, email: redact(context.recipientEmail), refusal },
      'sendGuardedEmail: refused'
    );
    return { sent: false, refusal, warnings, personalization };
  };

  // ---- Governor 1: CAN-SPAM suppression hard block ----
  const gov = await gateways.getContactGovernanceState(context);
  if (gov.state === 'suppressed' || gov.state === 'bounced') {
    // The contact is already in a terminal suppression state. We still write
    // an audit trail of the *attempt* being blocked so provenance is complete.
    if (gov.contactId) {
      await gateways.recordStateTransition({
        contactId: gov.contactId,
        fromState: gov.state,
        toState: gov.state, // no state change; records the blocked attempt
        trigger: 'send_blocked_suppressed',
        actorType: 'system',
        actorId: context.actorId,
        orgId: context.orgId,
      });
    }
    return refuse({
      governor: 'suppression',
      reason: `Contact is ${gov.state} — global suppression is permanent and irreversible (CAN-SPAM).`,
      details: { contactState: gov.state },
    });
  }
  if (gov.orgDoNotContact) {
    return refuse({
      governor: 'suppression',
      reason: 'Contact is on this org’s do-not-contact list.',
      details: { orgDoNotContact: true },
    });
  }

  // ---- Governor 2: pitch-eligibility ----
  // Test sends bypass eligibility (they are dev/self-directed), but never
  // bypass suppression (governor 1 already ran). Real pitches/sequences must
  // target a pitch_eligible contact.
  if (context.purpose !== 'test') {
    if (gov.state !== 'pitch_eligible') {
      return refuse({
        governor: 'pitch_eligibility',
        reason: `Contact is not pitch-eligible (state: ${gov.state ?? 'unknown'}).`,
        details: { contactState: gov.state },
      });
    }
  }

  const tier = await gateways.getOrgTier(context.orgId);
  const caps = TIER_CAPS[tier];

  // ---- Governor 3: daily pitch cap ----
  if (context.purpose !== 'test') {
    const sentToday = await gateways.countPitchesSentToday(context.orgId);
    if (sentToday >= caps.dailyPitches) {
      return refuse({
        governor: 'daily_pitch_cap',
        reason: `Daily pitch cap reached for ${tier} tier (${caps.dailyPitches}).`,
        details: { tier, sentToday, cap: caps.dailyPitches },
      });
    }
  }

  // ---- Governor 4: active-sequence cap ----
  if (context.purpose === 'sequence' && Number.isFinite(caps.activeSequences)) {
    const active = await gateways.countActiveSequences(context.orgId);
    if (active > caps.activeSequences) {
      return refuse({
        governor: 'active_sequence_cap',
        reason: `Active-sequence cap reached for ${tier} tier (${caps.activeSequences}).`,
        details: { tier, active, cap: caps.activeSequences },
      });
    }
  }

  // ---- Governor 5: follow-up cap (2 per contact per 7 days) ----
  if (context.isFollowUp) {
    const followUps = await gateways.countFollowUpsLast7Days(context.orgId, {
      contactId: gov.contactId,
      journalistId: context.journalistId,
      email: context.recipientEmail,
    });
    if (followUps >= FOLLOWUP_CAP_PER_7D) {
      return refuse({
        governor: 'followup_cap',
        reason: `Follow-up cap reached (${FOLLOWUP_CAP_PER_7D} per contact per 7 days).`,
        details: { followUps, cap: FOLLOWUP_CAP_PER_7D },
      });
    }
  }

  // ---- Governor 6: personalization gate (server-computed) ----
  if (context.purpose !== 'test') {
    if (personalization.blocked) {
      return refuse({
        governor: 'personalization',
        reason: `Personalization score ${personalization.score} is below the 40 minimum — blocked.`,
        details: {
          score: personalization.score,
          signals: personalization.signals,
          penalties: personalization.penalties,
        },
      });
    }
    if (personalization.warned) {
      warnings.push(
        `Personalization score ${personalization.score} is below ${PERSONALIZATION_WARN_THRESHOLD} — proceeding with warning.`
      );
    }
  }

  // ---- All governors passed — the ONLY path to the provider ----
  const providerResponse = await rawSend(request);
  logger.info(
    {
      orgId: context.orgId,
      email: redact(context.recipientEmail),
      success: providerResponse.success,
      personalizationScore: personalization.score,
      warnings,
    },
    'sendGuardedEmail: sent'
  );

  return {
    sent: providerResponse.success,
    providerResponse,
    warnings,
    personalization,
  };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function stripHtml(html: string | undefined | null): string {
  return (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function redact(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 2)}***@${domain}`;
}
