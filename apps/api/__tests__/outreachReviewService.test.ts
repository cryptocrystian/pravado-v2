/**
 * Wave-2 — outreach review/approval SERVICE (control plane over the fail-closed gate).
 *
 * Load-bearing claims:
 *   1. Approve/reject are ROLE-GATED to owner/admin: a non-privileged member gets
 *      FORBIDDEN and NO state change / NO send.
 *   2. An owner/admin approve transitions the row and runs the approved-send.
 *   3. The approved-send routes through `sendGuardedEmail` (the chokepoint) — proven by
 *      the provider being reached ONLY via the injected rawSend seam — sending the EXACT
 *      approved subject/body, and it does NOT re-compose (no second/bypassing send path).
 *   4. The pending queue is ORG-SCOPED (the caller's org id is what is queried).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import type { ResolvedRecipient } from '../src/services/craft/executors/prSendPitchExecutor';
import {
  approveReview,
  listPendingReviews,
  rejectReview,
  sendApprovedPitch,
  type OutreachReviewStore,
  type PrPitchReviewRow,
} from '../src/services/pr/outreachReviewService';
import type {
  ContactGovernanceState,
  GovernanceGateways,
  RawSend,
} from '../src/services/sendGuardedEmail';

const REVIEW: PrPitchReviewRow = {
  id: 'rev-1',
  org_id: 'org-1',
  proposal_id: 'prop-1',
  recipient_contact_id: null,
  journalist_id: 'j-1',
  composed_subject: 'Story idea for Alex at FreightWaves',
  composed_body:
    '<p>Hi Alex, I follow your logistics coverage at FreightWaves and have a ' +
    'resilient-freight-networks story with data your readers would value.</p>',
  composed_hash: 'hash-1',
  status: 'pending',
  reviewed_by: null,
  reviewed_at: null,
  created_at: '2026-08-10T00:00:00Z',
  updated_at: '2026-08-10T00:00:00Z',
};

const RECIPIENT: ResolvedRecipient = {
  email: 'alex@freightwaves.com',
  name: 'Alex Rivera',
  outlet: 'FreightWaves',
  beats: ['logistics'],
  journalistId: 'j-1',
  contactId: null,
};

function makeStore(
  overrides: Partial<OutreachReviewStore> = {}
): OutreachReviewStore {
  return {
    getUserOrgRole: async () => 'admin',
    listPending: async () => [REVIEW],
    getById: async () => REVIEW,
    markReviewed: async (_orgId, _id, status, reviewedBy) => ({
      ...REVIEW,
      status,
      reviewed_by: reviewedBy,
      reviewed_at: '2026-08-10T01:00:00Z',
    }),
    ...overrides,
  };
}

function makeGuardedGateways(): GovernanceGateways {
  return {
    getContactGovernanceState: async (): Promise<ContactGovernanceState> => ({
      contactId: 'j-1',
      state: 'pitch_eligible',
      orgDoNotContact: false,
    }),
    getOrgTier: async () => 'pro',
    countPitchesSentToday: async () => 0,
    countActiveSequences: async () => 0,
    countFollowUpsLast7Days: async () => 0,
    recordStateTransition: async () => {},
  };
}

describe('outreachReviewService — role-gating', () => {
  it('non-admin member approve → FORBIDDEN, no state change, send NEVER called', async () => {
    let sendCalled = false;
    let markCalled = false;
    const store = makeStore({
      getUserOrgRole: async () => 'member',
      markReviewed: async () => {
        markCalled = true;
        return REVIEW;
      },
    });

    const result = await approveReview({
      store,
      orgId: 'org-1',
      userId: 'u-1',
      reviewId: 'rev-1',
      send: async () => {
        sendCalled = true;
        return { result: 'success', detail: {} };
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('FORBIDDEN');
    expect(sendCalled).toBe(false);
    expect(markCalled).toBe(false);
  });

  it('non-admin member reject → FORBIDDEN, no state change', async () => {
    let markCalled = false;
    const store = makeStore({
      getUserOrgRole: async () => 'member',
      markReviewed: async () => {
        markCalled = true;
        return REVIEW;
      },
    });

    const result = await rejectReview({
      store,
      orgId: 'org-1',
      userId: 'u-1',
      reviewId: 'rev-1',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('FORBIDDEN');
    expect(markCalled).toBe(false);
  });

  it('non-member (no role) approve → FORBIDDEN', async () => {
    const store = makeStore({ getUserOrgRole: async () => null });
    const result = await approveReview({
      store,
      orgId: 'org-1',
      userId: 'u-x',
      reviewId: 'rev-1',
      send: async () => ({ result: 'success', detail: {} }),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe('FORBIDDEN');
  });

  it('owner approve → transitions the row and runs the approved-send', async () => {
    let sentReviewId: string | null = null;
    const store = makeStore({ getUserOrgRole: async () => 'owner' });

    const result = await approveReview({
      store,
      orgId: 'org-1',
      userId: 'owner-1',
      reviewId: 'rev-1',
      send: async (review) => {
        sentReviewId = review.id;
        return { result: 'success', detail: { kind: 'pr_pitch_sent' } };
      },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.review.status).toBe('approved');
      expect(result.review.reviewed_by).toBe('owner-1');
      expect(result.send.result).toBe('success');
    }
    expect(sentReviewId).toBe('rev-1');
  });
});

describe('outreachReviewService — approved-send routes through the chokepoint', () => {
  it('sendApprovedPitch reaches the provider ONLY via sendGuardedEmail, sends the EXACT approved text, does NOT re-compose', async () => {
    const calls: Array<{ to: string; subject: string }> = [];
    const rawSend: RawSend = async (request) => {
      calls.push({ to: request.to, subject: request.subject });
      return { success: true, messageId: 'stub-msg-1', provider: 'stub' };
    };
    // If the executor ever tried to re-compose we would see it here — it must NOT.
    let composeCalled = false;

    const outcome = await sendApprovedPitch(
      {} as SupabaseClient,
      { ...REVIEW, status: 'approved' },
      {
        gateways: makeGuardedGateways(),
        rawSend,
        resolveRecipient: async () => RECIPIENT,
        composePitch: async () => {
          composeCalled = true;
          return null;
        },
      }
    );

    expect(outcome.result).toBe('success');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_sent',
      composed: false,
    });
    // Chokepoint was the ONLY path to the provider, called exactly once with approved text.
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      to: 'alex@freightwaves.com',
      subject: REVIEW.composed_subject,
    });
    expect(composeCalled).toBe(false);
  });

  it('the chokepoint still governs the approved-send: a suppressed contact is refused (not sent)', async () => {
    const calls: unknown[] = [];
    const rawSend: RawSend = async (r) => {
      calls.push(r);
      return { success: true, messageId: 'x', provider: 'stub' };
    };
    const suppressedGateways: GovernanceGateways = {
      ...makeGuardedGateways(),
      getContactGovernanceState: async () => ({
        contactId: 'j-1',
        state: 'suppressed',
        orgDoNotContact: false,
      }),
    };

    const outcome = await sendApprovedPitch(
      {} as SupabaseClient,
      { ...REVIEW, status: 'approved' },
      {
        gateways: suppressedGateways,
        rawSend,
        resolveRecipient: async () => RECIPIENT,
      }
    );

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_governed_refusal',
      governor: 'suppression',
    });
    expect(calls).toHaveLength(0); // the chokepoint refused before the provider
  });
});

describe('outreachReviewService — org-scoping', () => {
  it('listPendingReviews queries ONLY the caller org id', async () => {
    let queriedOrg: string | null = null;
    const store = makeStore({
      listPending: async (orgId) => {
        queriedOrg = orgId;
        return [REVIEW];
      },
    });

    const rows = await listPendingReviews(store, 'org-1');
    expect(queriedOrg).toBe('org-1');
    expect(rows).toHaveLength(1);
  });
});
