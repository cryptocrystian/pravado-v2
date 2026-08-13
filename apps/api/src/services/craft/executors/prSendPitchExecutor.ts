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
 * PITCH COMPOSITION (Wave-2 refinement): a `pr.send_pitch` proposal usually carries
 * a journalist + a signal/title but NO pitch body. Rather than self-refuse
 * (`needs_content`) and send nothing, the executor invokes the LLM-backed
 * `composePitch` service to draft a PERSONALIZED subject/body grounded in the
 * journalist's beat/outlet, THEN routes it through the SAME chokepoint. The composer
 * NEVER sends; the chokepoint still re-computes the personalization score from the
 * ACTUAL composed body, so a generic draft is refused there — never force-sent.
 *
 * SAFETY: composing-then-sending is only safe today because prod egress is a STUB
 * (EMAIL_PROVIDER unset). A human-review-of-the-composed-pitch step is REQUIRED
 * before SendGrid is ever provisioned — this executor deliberately does NOT enable
 * autonomous real sending; it stays human-initiated inside the CRAFT lifecycle.
 *
 * OUTCOME SEMANTICS — distinct, honest cases (no lying):
 *   - Guarded send ACCEPTED by the provider          → `success`      (real send;
 *     prod EMAIL_PROVIDER is the stub, so egress is a stub but governance still ran).
 *   - A governor / suppression / eligibility / personalization gate REFUSED the send
 *     → `governed_complete` carrying the block reason. NOT `success` (nothing sent)
 *     and NOT `failure` (nothing errored) — the system worked as designed. A composed
 *     pitch that still reads generic lands here (personalization refusal), NOT success.
 *   - Provider attempted the send and reported failure, or an exception is thrown
 *     (caught by the runner) → `failure`.
 *   - The composer could not produce a pitch (LLM unavailable/errored)
 *     → `failure` (kind `pr_pitch_compose_failed`). We NEVER fabricate a pitch body.
 *   - No resolvable recipient (missing ids / unresolved email)
 *     → `governed_complete` (kind `pr_pitch_needs_recipient`). Nothing sent.
 */

import { FLAGS } from '@pravado/feature-flags';
import type { ProviderConfig } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { ActionExecutor, ExecutorContext, ExecutorResult } from './types';
import { createSupabaseGovernanceGateways } from '../../governanceGateways';
import {
  createOutreachDeliverabilityService,
  type OutreachDeliverabilityService,
} from '../../outreachDeliverabilityService';
import {
  composePitch as defaultComposePitch,
  type ComposePitchInput,
  type ComposedPitch,
} from '../../pr/pitchComposer';
import { createReplyToken } from '../../pr/replyCapture';
import { resolveSenderIdentity } from '../../pr/senderIdentity';
import {
  deliverabilityRawSend,
  sendGuardedEmail,
  type GovernanceGateways,
  type RawSend,
} from '../../sendGuardedEmail';
import {
  computeComposedHash,
  createSupabaseOutreachReviewGateway,
  requireOutreachReview,
  resolveEgressMode,
  type OutreachReviewContext,
  type OutreachReviewGateway,
} from '../outreachReviewGate';

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
  // ---- optional signal/brand context the composer grounds a pitch in ----
  angle?: unknown;
  summary?: unknown;
  topic?: unknown;
  org_name?: unknown;
  brand_name?: unknown;
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

/** Injectable seams so the executor's logic is unit-testable without a DB/provider/LLM. */
export interface PrSendPitchDeps {
  gateways?: GovernanceGateways;
  rawSend?: RawSend;
  resolveRecipient?: (
    supabase: SupabaseClient,
    journalistId: string,
    contactId: string
  ) => Promise<ResolvedRecipient | null>;
  /** LLM-backed pitch composer seam (tests inject a deterministic fake). */
  composePitch?: (input: ComposePitchInput) => Promise<ComposedPitch | null>;
  /**
   * Human-review gate context (Wave-2 safety floor). Lets a caller/test force the egress
   * mode + supply a recorded human approval. When absent, the gate resolves egress from
   * `EMAIL_PROVIDER` (stub in prod) and treats the pitch as un-reviewed — fail-closed for
   * any real-egress path.
   */
  reviewContext?: OutreachReviewContext;
  /**
   * DB-backed review gateway seam (migration 112). Reads whether THIS exact composed
   * pitch is approved (hash-matched) and UPSERTs a pending review row when a real send
   * lacks approval. Defaults to the Supabase gateway over ctx.supabase; tests inject a
   * fake to exercise the approved/mismatched/pending decisions without a live DB.
   */
  reviewGateway?: OutreachReviewGateway;
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
  if (provider === 'resend') {
    return {
      provider: 'resend',
      apiKey: process.env.RESEND_API_KEY,
      fromEmail:
        process.env.RESEND_OUTREACH_FROM_EMAIL || 'outreach@pravado.io',
      fromName: process.env.RESEND_FROM_NAME || 'Pravado',
      webhookKey: process.env.RESEND_WEBHOOK_SECRET,
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
 * production binding; tests call this with fake gateways/rawSend/composePitch to
 * assert the governors + the "chokepoint is the ONLY path to the provider" invariant.
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
  const subjectParam = asTrimmedString(params.subject);
  const bodyHtmlParam = asTrimmedString(
    params.body_html ?? params.bodyHtml ?? params.body
  );
  const bodyTextParamRaw = asTrimmedString(params.body_text ?? params.bodyText);
  const bodyTextParam =
    bodyTextParamRaw || (bodyHtmlParam ? stripHtml(bodyHtmlParam) : '');
  const isFollowUp = params.is_follow_up === true || params.isFollowUp === true;

  // Does the proposal already carry a usable pitch? If not, we COMPOSE one below
  // (grounded in the resolved journalist context) rather than self-refuse + send
  // nothing. Either way the send still routes through the chokepoint unchanged.
  const hasProposalContent = Boolean(
    subjectParam && (bodyHtmlParam || bodyTextParam)
  );

  // ---- resolve the recipient through the governed path ----
  // A recipient id is required BOTH to send AND to ground a composed pitch in real
  // journalist context. Without one we cannot proceed (neutral governed outcome).
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

  // ---- content: use the proposal's pitch if present, else COMPOSE one ----
  let subject = subjectParam;
  let bodyHtml = bodyHtmlParam;
  let bodyText = bodyTextParam;
  let recentWorkHook: string | null = null;
  let composed = false;
  let composeModel: string | null = null;

  if (!hasProposalContent) {
    const composePitch = deps.composePitch ?? defaultComposePitch;
    const proposalTitle = asTrimmedString(proposal.title);
    const draft = await composePitch({
      journalist: {
        name: recipient.name,
        outlet: recipient.outlet,
        beats: recipient.beats,
        recentWorkHook: null,
      },
      brand: {
        name:
          asTrimmedString(params.brand_name) ||
          asTrimmedString(params.org_name) ||
          asTrimmedString(proposal.org_name) ||
          null,
      },
      signal: {
        title:
          proposalTitle ||
          asTrimmedString(params.topic) ||
          subjectParam ||
          'Story pitch',
        summary: asTrimmedString(params.summary) || null,
        angle: asTrimmedString(params.angle) || null,
      },
      orgId: ctx.orgId,
      isFollowUp,
    });

    // HONEST DEGRADE: the composer returns null when the LLM is unavailable /
    // errored / produced unusable output. We NEVER fabricate a body or send the
    // router's generic stub text — record a failure and send nothing.
    if (!draft) {
      return {
        result: 'failure',
        detail: {
          kind: 'pr_pitch_compose_failed',
          action_type: 'pr.send_pitch',
          note: 'Pitch composer could not produce a personalized subject/body (LLM unavailable or unusable output). Nothing sent; no fabricated pitch.',
          journalist_id: recipient.journalistId,
          contact_id: recipient.contactId,
        },
      };
    }

    subject = draft.subject;
    bodyHtml = draft.bodyHtml;
    bodyText = draft.bodyText;
    recentWorkHook = draft.recentWorkHook;
    composed = true;
    composeModel = draft.model;
  }

  // ---- HUMAN-REVIEW GATE (Wave-2 safety floor — now DB-backed) ----
  // Outreach is IRREVERSIBLE (CRAFT §4.2/§5.4) → a real send requires a recorded human
  // review of the ACTUAL composed pitch. INERT while egress is the stub (the current
  // human-initiated stub flow proceeds unchanged); it ACTIVATES — blocking un-reviewed
  // sends — the instant a real provider (SendGrid/Mailgun) is provisioned. This gate +
  // SendGrid provisioning are the TWO gates before any real send. Autonomy stays OFF.
  //
  // The "approved" decision is DB-backed (pr_pitch_reviews, migration 112): a real send
  // proceeds ONLY when an `approved` row exists whose `composed_hash` MATCHES the hash of
  // the text about to send. Anything else (missing / pending / rejected / re-composed →
  // different hash / DB error) is NOT approved → we UPSERT a pending review row (so the
  // pitch surfaces in the review queue) and fail-closed. The in-context
  // `humanReviewApproved` boolean is honored FIRST — it is how the internal approved-send
  // path re-sends the EXACT already-approved text (and how unit tests inject a decision).
  const composedBodyForHash = bodyHtml || bodyText;
  const composedHash = computeComposedHash(subject, composedBodyForHash);
  const egress = deps.reviewContext?.egress ?? resolveEgressMode();

  let dbApproved = false;
  const needsDbApproval =
    egress === 'real' && deps.reviewContext?.humanReviewApproved !== true;
  const reviewGateway =
    deps.reviewGateway ?? createSupabaseOutreachReviewGateway(ctx.supabase);

  if (needsDbApproval) {
    dbApproved = await reviewGateway.isApproved({
      orgId: ctx.orgId,
      proposalId: ctx.proposalId,
      recipientContactId: recipient.contactId,
      composedHash,
    });
  }

  const review = requireOutreachReview({
    egress: deps.reviewContext?.egress,
    humanReviewApproved:
      deps.reviewContext?.humanReviewApproved === true || dbApproved,
  });
  if (!review.proceed) {
    // Queue population: enqueue a PENDING review carrying the composed subject/body +
    // hash + recipient so it appears in GET /api/v1/pr/reviews. Re-composition yields a
    // new hash → a new pending row (unique index); the stale approval no longer matches.
    await reviewGateway.upsertPending({
      orgId: ctx.orgId,
      proposalId: ctx.proposalId,
      recipientContactId: recipient.contactId,
      journalistId: recipient.journalistId,
      composedSubject: subject,
      composedBody: composedBodyForHash,
      composedHash,
    });
    return {
      result: 'governed_complete',
      detail: {
        kind: 'pr_pitch_review_required',
        action_type: 'pr.send_pitch',
        note: 'Real email egress is provisioned but this composed pitch has no matching human approval (fail-closed). A pending review was queued. Human review + SendGrid provisioning are the two gates before real sends.',
        egress: review.egress,
        composed,
        composed_hash: composedHash,
        journalist_id: recipient.journalistId,
        contact_id: recipient.contactId,
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

  // Per-customer sender identity (display name + reply-to). from-email stays the
  // authenticated platform address. Best-effort — never blocks the governed send.
  const senderIdentity = await resolveSenderIdentity(
    ctx.supabase,
    ctx.orgId,
    ctx.actingUser
  );

  // When reply capture is wired, intercept replies via a tokenized reply-to so
  // journalist responses route through SendGrid Inbound Parse (captured +
  // forwarded). Falls back to the customer's own address when off / on failure.
  let replyTo = senderIdentity.replyTo;
  if (FLAGS.PR_OUTREACH_INBOUND_WIRED) {
    const tokenAddress = await createReplyToken(ctx.supabase, {
      orgId: ctx.orgId,
      journalistId: recipient.journalistId,
      proposalId: ctx.proposalId,
      forwardTo: senderIdentity.replyTo?.email ?? null,
      subject,
    });
    if (tokenAddress) replyTo = { email: tokenAddress };
  }

  const guarded = await sendGuardedEmail({
    request: {
      to: recipient.email,
      subject,
      bodyHtml: bodyHtml || bodyText,
      bodyText,
      fromName: senderIdentity.fromName,
      replyTo,
      metadata: {
        orgId: ctx.orgId,
        journalistId: recipient.journalistId,
        contactId: recipient.contactId,
        proposalId: ctx.proposalId,
        executionId: ctx.executionId,
        source: 'sage_proposal',
        action_type: 'pr.send_pitch',
        composed,
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
        recentWorkHook,
      },
    },
    gateways,
    rawSend,
  });

  // ---- Case 2: a governor REFUSED — neutral governed outcome carrying the reason.
  // NOT success (nothing sent), NOT failure (nothing errored). A composed pitch that
  // still fails the personalization gate lands here (governor 'personalization').
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
        composed,
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
            composed,
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
        composed,
        compose_model: composeModel,
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
      composed,
      journalist_id: recipient.journalistId,
      contact_id: recipient.contactId,
    },
  };
}

export const prSendPitchExecutor: ActionExecutor = (proposal, ctx) =>
  runPrSendPitch(proposal, ctx);
