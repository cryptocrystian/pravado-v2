/**
 * Outreach review/approval service (Wave-2 — the human-in-the-loop gate's control plane).
 *
 * Backs GET /api/v1/pr/reviews (pending queue) and the owner/admin-gated approve/reject
 * routes. It sits ON TOP OF the `sendGuardedEmail` chokepoint and NEVER bypasses it:
 * approving a review does not "send" directly — it re-invokes the SAME pitch executor
 * (`runPrSendPitch`) carrying the EXACT already-approved subject/body, which routes the
 * send through `sendGuardedEmail` so every existing CAN-SPAM governor still runs.
 *
 * SECURITY:
 *   - Every operation is ORG-SCOPED (rows are only ever read/written for the caller's org).
 *   - Approve/reject are ROLE-GATED to owner/admin (org_members.role); a non-privileged
 *     member gets FORBIDDEN and no state changes.
 *   - Writes go through the service role (RLS write policy is service-role only,
 *     migration 112); org membership + role are checked here in the application layer.
 *
 * APPROVAL BINDING: the approved-send re-sends the row's stored `composed_subject` /
 * `composed_body` — the exact text a human reviewed — so the approval cannot leak onto
 * different text. (The executor's DB gate is keyed on the hash of that same text.)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  runPrSendPitch,
  type PrSendPitchDeps,
} from '../craft/executors/prSendPitchExecutor';
import type { ExecutorResult } from '../craft/executors/types';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface PrPitchReviewRow {
  id: string;
  org_id: string;
  proposal_id: string;
  recipient_contact_id: string | null;
  journalist_id: string | null;
  composed_subject: string;
  composed_body: string;
  composed_hash: string;
  status: ReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

const REVIEW_TABLE = 'pr_pitch_reviews';
const PRIVILEGED_ROLES = new Set(['owner', 'admin']);

/**
 * Data seam for the review routes. Every method is org-scoped. Injectable so the route
 * logic (role-gating, org-scope, approved-send) is unit-testable without a live DB.
 */
export interface OutreachReviewStore {
  /** The caller's role in `orgId`, or null if they are not a member (org-scope guard). */
  getUserOrgRole(orgId: string, userId: string): Promise<string | null>;
  /** Pending reviews for the org, newest first. */
  listPending(orgId: string): Promise<PrPitchReviewRow[]>;
  /** A single review by id, scoped to the org (null if absent / other org). */
  getById(orgId: string, id: string): Promise<PrPitchReviewRow | null>;
  /**
   * Transition a PENDING review to approved/rejected, stamping reviewer + time. Returns
   * the updated row, or null if it was not found / not pending (org-scoped, guarded so a
   * double-approve cannot re-fire the send).
   */
  markReviewed(
    orgId: string,
    id: string,
    status: 'approved' | 'rejected',
    reviewedBy: string
  ): Promise<PrPitchReviewRow | null>;
}

/** Supabase-backed store (service role). */
export function createSupabaseOutreachReviewStore(
  supabase: SupabaseClient
): OutreachReviewStore {
  return {
    async getUserOrgRole(orgId, userId) {
      const { data, error } = await supabase
        .from('org_members')
        .select('role')
        .eq('org_id', orgId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return (data.role as string) ?? null;
    },

    async listPending(orgId) {
      const { data, error } = await supabase
        .from(REVIEW_TABLE)
        .select('*')
        .eq('org_id', orgId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PrPitchReviewRow[];
    },

    async getById(orgId, id) {
      const { data, error } = await supabase
        .from(REVIEW_TABLE)
        .select('*')
        .eq('org_id', orgId)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data as PrPitchReviewRow) ?? null;
    },

    async markReviewed(orgId, id, status, reviewedBy) {
      // Guard on status='pending' so a concurrent/double approve cannot transition twice
      // (and cannot re-fire the send). Org-scoped update.
      const { data, error } = await supabase
        .from(REVIEW_TABLE)
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('org_id', orgId)
        .eq('id', id)
        .eq('status', 'pending')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      return (data as PrPitchReviewRow) ?? null;
    },
  };
}

/**
 * The APPROVED-SEND path. Given an approved review row, execute the send by re-invoking
 * the SAME pitch executor with the EXACT approved subject/body as proposal content (so
 * the executor does NOT re-compose) and an in-context approval (the row is already
 * approved). The executor routes the send through `sendGuardedEmail` — the ONE chokepoint
 * — so suppression, eligibility, tier caps, follow-up cap and personalization all still
 * run. This is the ONLY send path; there is no second/bypassing sender.
 */
export async function sendApprovedPitch(
  supabase: SupabaseClient,
  review: PrPitchReviewRow,
  deps: PrSendPitchDeps = {}
): Promise<ExecutorResult> {
  const proposal = {
    action_type: 'pr.send_pitch',
    action_params: {
      // Reuse whichever recipient linkage the review carries.
      journalist_id: review.journalist_id ?? undefined,
      contact_id: review.recipient_contact_id ?? undefined,
      // The EXACT approved text — presence of subject+body means the executor sends this
      // as-is (no re-compose), so approval stays bound to the reviewed content.
      subject: review.composed_subject,
      body_html: review.composed_body,
    },
  };

  return runPrSendPitch(
    proposal,
    {
      supabase,
      orgId: review.org_id,
      proposalId: review.proposal_id,
      executionId: `pr-review-${review.id}`,
    },
    {
      ...deps,
      // Human approval already recorded on the row → let the gate proceed. The executor
      // still routes through sendGuardedEmail (all governors run). Not a bypass: we send
      // the exact text a human approved.
      reviewContext: { humanReviewApproved: true, ...deps.reviewContext },
    }
  );
}

// ---------------------------------------------------------------------------
// Route-facing operations (org-scoped, role-gated) — return discriminated results
// the routes map to HTTP status codes (preserving real error statuses).
// ---------------------------------------------------------------------------

export type ReviewOpError =
  | { ok: false; code: 'FORBIDDEN'; message: string }
  | { ok: false; code: 'NOT_FOUND'; message: string };

export interface ApproveResult {
  ok: true;
  review: PrPitchReviewRow;
  send: ExecutorResult;
}
export interface RejectResult {
  ok: true;
  review: PrPitchReviewRow;
}

/** List the pending review queue for an org (any org member may read). */
export async function listPendingReviews(
  store: OutreachReviewStore,
  orgId: string
): Promise<PrPitchReviewRow[]> {
  return store.listPending(orgId);
}

/**
 * Approve a pending review (owner/admin only), then run the approved-send through the
 * chokepoint. Role + org-scope are enforced BEFORE any state change.
 */
export async function approveReview(args: {
  store: OutreachReviewStore;
  orgId: string;
  userId: string;
  reviewId: string;
  /** The approved-send seam; defaults to `sendApprovedPitch` bound to `supabase`. */
  send: (review: PrPitchReviewRow) => Promise<ExecutorResult>;
}): Promise<ApproveResult | ReviewOpError> {
  const { store, orgId, userId, reviewId } = args;

  const role = await store.getUserOrgRole(orgId, userId);
  if (!role) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Not a member of this organization.',
    };
  }
  if (!PRIVILEGED_ROLES.has(role)) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: `Approving outreach requires owner/admin (current role: ${role}).`,
    };
  }

  const existing = await store.getById(orgId, reviewId);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Review not found.' };
  }
  if (existing.status !== 'pending') {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: `Review is already ${existing.status}; only pending reviews can be approved.`,
    };
  }

  const updated = await store.markReviewed(orgId, reviewId, 'approved', userId);
  if (!updated) {
    // Lost a race (someone else transitioned it first) — nothing sent.
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: 'Review is no longer pending.',
    };
  }

  const send = await args.send(updated);
  return { ok: true, review: updated, send };
}

/** Reject a pending review (owner/admin only). No send. */
export async function rejectReview(args: {
  store: OutreachReviewStore;
  orgId: string;
  userId: string;
  reviewId: string;
}): Promise<RejectResult | ReviewOpError> {
  const { store, orgId, userId, reviewId } = args;

  const role = await store.getUserOrgRole(orgId, userId);
  if (!role) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: 'Not a member of this organization.',
    };
  }
  if (!PRIVILEGED_ROLES.has(role)) {
    return {
      ok: false,
      code: 'FORBIDDEN',
      message: `Rejecting outreach requires owner/admin (current role: ${role}).`,
    };
  }

  const existing = await store.getById(orgId, reviewId);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: 'Review not found.' };
  }
  if (existing.status !== 'pending') {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: `Review is already ${existing.status}; only pending reviews can be rejected.`,
    };
  }

  const updated = await store.markReviewed(orgId, reviewId, 'rejected', userId);
  if (!updated) {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message: 'Review is no longer pending.',
    };
  }
  return { ok: true, review: updated };
}
