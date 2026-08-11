/**
 * CRAFT Outreach Human-Review Gate (Wave-2 — Autopilot prerequisites / SAFETY FLOOR).
 *
 * Scaffolds the REQUIRED human review/approval state a `pr.send_pitch` must pass before
 * real external egress. Outreach is IRREVERSIBLE (CRAFT §4.2/§5.4 "Email/Outreach →
 * Irreversible → Manual") — a sent pitch cannot be un-sent — so canon's "No Silent
 * Automation" (§1.2) means a pitch must never reach the provider without a human having
 * reviewed the ACTUAL composed subject/body.
 *
 * TWO GATES BEFORE REAL SENDS (documented invariant):
 *   1. THIS review gate — a human must review-and-approve the composed pitch. Inert today
 *      because there is no approver UI wired yet; `requireOutreachReview` returns
 *      `review_required` for a real egress path so nothing can silently send.
 *   2. SendGrid provisioning — prod egress is a STUB (`EMAIL_PROVIDER` unset →
 *      resolveProviderConfig() returns the stub). Real sends are impossible until
 *      SendGrid is provisioned AND this gate is satisfied.
 *
 * While egress is a stub, this gate is INERT (a stub send is not real egress, so no review
 * is required to keep the current human-initiated stub flow working). The gate ACTIVATES —
 * blocking sends that lack an approval — the instant a real provider is configured. That
 * ordering guarantees the review requirement lands BEFORE the first real send is possible.
 *
 * CRITICAL: this does NOT enable autonomous sending. `AUTONOMOUS_AUTOPILOT_ENABLED` stays
 * false; the pitch executor remains human-initiated inside the CRAFT lifecycle.
 *
 * DB-BACKED APPROVAL (Wave-2 build): the "approved" decision is no longer a passed-in
 * boolean — it is READ from an `approved` `pr_pitch_reviews` row whose `composed_hash`
 * MATCHES the current composed subject/body (migration 112). This makes the gate
 * fail-closed BY CONSTRUCTION: unknown / mismatched-hash / pending / rejected / missing
 * / DB-error all resolve to NOT approved → blocked. Re-composing a pitch changes the
 * hash, so a stale approval (bound to the old text) can never apply. The in-context
 * `humanReviewApproved` boolean is retained for the internal approved-send path (which
 * sends the EXACT already-approved text) and for deterministic unit tests.
 */

import { createHash } from 'crypto';

import type { SupabaseClient } from '@supabase/supabase-js';

export type EmailEgressMode = 'stub' | 'real';

/**
 * Resolve whether prod egress is real (a provider is provisioned) or a stub. Mirrors
 * prSendPitchExecutor.resolveProviderConfig: anything other than an explicit real
 * provider is the stub.
 */
export function resolveEgressMode(
  provider: string | undefined = process.env.EMAIL_PROVIDER
): EmailEgressMode {
  return provider === 'sendgrid' || provider === 'mailgun' ? 'real' : 'stub';
}

export type OutreachReviewDecision =
  | {
      proceed: true;
      egress: EmailEgressMode;
      reason: 'stub_egress_no_review_required';
    }
  | { proceed: true; egress: 'real'; reason: 'review_approved' }
  | { proceed: false; egress: 'real'; reason: 'review_required' };

export interface OutreachReviewContext {
  /** Real vs stub egress. Defaults to the env-resolved mode. */
  egress?: EmailEgressMode;
  /**
   * Whether a human has recorded an approval of THIS composed pitch. Wired to a future
   * approver surface; while that surface does not exist this is always false, so any real
   * egress path is blocked pending review — fail-closed.
   */
  humanReviewApproved?: boolean;
}

/**
 * The gate. For a STUB egress path it is a no-op (proceed) — the current human-initiated
 * stub flow is preserved. For a REAL egress path it REQUIRES a recorded human approval;
 * without one it returns `review_required` and the caller must NOT send. Fail-closed by
 * construction: the only way to send for real is `egress: 'real' && humanReviewApproved`.
 */
export function requireOutreachReview(
  ctx: OutreachReviewContext = {}
): OutreachReviewDecision {
  const egress = ctx.egress ?? resolveEgressMode();

  if (egress === 'stub') {
    return {
      proceed: true,
      egress,
      reason: 'stub_egress_no_review_required',
    };
  }

  if (ctx.humanReviewApproved) {
    return { proceed: true, egress: 'real', reason: 'review_approved' };
  }

  return { proceed: false, egress: 'real', reason: 'review_required' };
}

// ---------------------------------------------------------------------------
// DB-backed approval (migration 112 — pr_pitch_reviews)
// ---------------------------------------------------------------------------

/**
 * The canonical composed-hash. The approval is bound to THIS exact text: sha256 over
 * the subject and the body that would actually send. Re-composing (LLM redraft) yields
 * a different body → a different hash → a NEW pending review row → the stale approval no
 * longer matches. Both the executor (queue-population) and the approve route derive the
 * hash the same way so a matching approval is comparable byte-for-byte.
 */
export function computeComposedHash(subject: string, body: string): string {
  return createHash('sha256')
    .update(`${subject}\n\n${body}`, 'utf8')
    .digest('hex');
}

/** The identity of a specific composed pitch, as stored on a `pr_pitch_reviews` row. */
export interface OutreachApprovalQuery {
  orgId: string;
  proposalId: string;
  /** Firewall contact id when known; null when the pitch resolves via journalist_id. */
  recipientContactId: string | null;
  composedHash: string;
}

/** A pending review row the executor UPSERTs so the pitch appears in the review queue. */
export interface PendingReviewRow {
  orgId: string;
  proposalId: string;
  recipientContactId: string | null;
  journalistId: string | null;
  composedSubject: string;
  composedBody: string;
  composedHash: string;
}

/**
 * The gate's DB seam. The executor uses this to (a) read whether THIS exact composed
 * pitch is approved and (b) enqueue a pending row when a real send lacks approval.
 * Injectable so the executor's gate logic is unit-testable without a live DB.
 */
export interface OutreachReviewGateway {
  /**
   * True IFF an `approved` `pr_pitch_reviews` row exists for this org+proposal+recipient
   * whose `composed_hash` MATCHES. Any read error resolves to false — FAIL CLOSED: an
   * uncertain approval read can never grant a real send.
   */
  isApproved(query: OutreachApprovalQuery): Promise<boolean>;
  /**
   * UPSERT a `pending` row for this composed pitch (idempotent on the unique
   * org+proposal+recipient+hash key — re-hitting the gate with the SAME text does not
   * duplicate; a re-composed pitch with a NEW hash creates a NEW pending row).
   */
  upsertPending(row: PendingReviewRow): Promise<void>;
}

const REVIEW_TABLE = 'pr_pitch_reviews';

/** Supabase-backed gateway (service role). Reads/writes `pr_pitch_reviews`. */
export function createSupabaseOutreachReviewGateway(
  supabase: SupabaseClient
): OutreachReviewGateway {
  return {
    async isApproved(query: OutreachApprovalQuery): Promise<boolean> {
      let q = supabase
        .from(REVIEW_TABLE)
        .select('id')
        .eq('org_id', query.orgId)
        .eq('proposal_id', query.proposalId)
        .eq('composed_hash', query.composedHash)
        .eq('status', 'approved');

      // recipient_contact_id is nullable; PostgREST needs `.is` for NULL matching.
      q =
        query.recipientContactId == null
          ? q.is('recipient_contact_id', null)
          : q.eq('recipient_contact_id', query.recipientContactId);

      const { data, error } = await q.limit(1).maybeSingle();
      // FAIL CLOSED: any error (or no row) → not approved.
      if (error) return false;
      return Boolean(data);
    },

    async upsertPending(row: PendingReviewRow): Promise<void> {
      // onConflict targets the unique index columns so a repeat of the SAME text is a
      // no-op update (never a duplicate) while a NEW hash inserts a fresh pending row.
      await supabase.from(REVIEW_TABLE).upsert(
        {
          org_id: row.orgId,
          proposal_id: row.proposalId,
          recipient_contact_id: row.recipientContactId,
          journalist_id: row.journalistId,
          composed_subject: row.composedSubject,
          composed_body: row.composedBody,
          composed_hash: row.composedHash,
          status: 'pending',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'org_id,proposal_id,recipient_contact_id,composed_hash',
          ignoreDuplicates: true,
        }
      );
    },
  };
}
