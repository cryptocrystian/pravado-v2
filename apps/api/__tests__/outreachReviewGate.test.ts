/**
 * Wave-2 — DB-backed outreach review gate (fail-closed human gate before real sends).
 *
 * Exercised THROUGH the pitch executor (runPrSendPitch) because that is where the gate
 * decides whether a REAL send may proceed. Load-bearing claims:
 *   1. Real egress + an `approved` review whose composed_hash MATCHES the text about to
 *      send → the send proceeds through the chokepoint (rawSend called once).
 *   2. Real egress + approval for DIFFERENT text (re-composed → different hash) → BLOCKED,
 *      a pending review is queued, rawSend NEVER called. Re-composition voids approval.
 *   3. Real egress + pending / rejected / missing approval → BLOCKED (fail-closed),
 *      a pending review is queued, rawSend NEVER called.
 *   4. Fail-closed default: real egress with no matching approval never sends.
 *   5. Stub egress (prod default, EMAIL_PROVIDER unset) → gate is INERT: no DB approval
 *      lookup, no pending row, the send routes through the chokepoint unchanged.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import {
  runPrSendPitch,
  type ResolvedRecipient,
} from '../src/services/craft/executors/prSendPitchExecutor';
import {
  computeComposedHash,
  type OutreachApprovalQuery,
  type OutreachReviewGateway,
  type PendingReviewRow,
} from '../src/services/craft/outreachReviewGate';
import type {
  ContactGovernanceState,
  GovernanceGateways,
  RawSend,
} from '../src/services/sendGuardedEmail';

const CTX = {
  supabase: {} as SupabaseClient,
  orgId: 'org-1',
  proposalId: 'prop-1',
  executionId: 'exec-1',
};

const RECIPIENT: ResolvedRecipient = {
  email: 'alex@freightwaves.com',
  name: 'Alex Rivera',
  outlet: 'FreightWaves',
  beats: ['logistics'],
  journalistId: 'j-1',
  contactId: null,
};

// Well-personalized so the personalization governor at the chokepoint does not refuse.
const SUBJECT = 'Story idea for Alex at FreightWaves';
const BODY_HTML =
  '<p>Hi Alex, I follow your logistics coverage at FreightWaves and have a ' +
  'resilient-freight-networks story with data your readers would value.</p>';
const GOOD_CONTENT = { subject: SUBJECT, body_html: BODY_HTML };

// The exact hash the executor computes for the text above (subject + bodyHtml).
const MATCHING_HASH = computeComposedHash(SUBJECT, BODY_HTML);

function makeGateways(): GovernanceGateways {
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

function makeRawSend() {
  const calls: unknown[] = [];
  const rawSend: RawSend = async (request) => {
    calls.push(request);
    return { success: true, messageId: 'stub-msg-1', provider: 'stub' };
  };
  return { rawSend, calls };
}

/**
 * Fake review gateway. `approvedHash` (when set) is the ONE hash it considers approved —
 * mimicking an `approved` pr_pitch_reviews row bound to that exact text. Records the
 * pending rows the executor UPSERTs so we can assert queue population.
 */
function makeReviewGateway(opts: { approvedHash?: string | null } = {}) {
  const isApprovedCalls: OutreachApprovalQuery[] = [];
  const pending: PendingReviewRow[] = [];
  const gateway: OutreachReviewGateway = {
    async isApproved(query) {
      isApprovedCalls.push(query);
      return (
        opts.approvedHash != null && query.composedHash === opts.approvedHash
      );
    },
    async upsertPending(row) {
      pending.push(row);
    },
  };
  return { gateway, isApprovedCalls, pending };
}

const REAL = { egress: 'real' as const };

const proposal = {
  action_type: 'pr.send_pitch',
  action_params: { journalist_id: 'j-1', ...GOOD_CONTENT },
};

describe('DB-backed outreach review gate', () => {
  it('approved + MATCHING hash → proceeds through the chokepoint (send happens)', async () => {
    const { rawSend, calls } = makeRawSend();
    const { gateway, pending } = makeReviewGateway({
      approvedHash: MATCHING_HASH,
    });

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
      reviewGateway: gateway,
      reviewContext: REAL,
    });

    expect(outcome.result).toBe('success');
    expect(outcome.detail).toMatchObject({ kind: 'pr_pitch_sent' });
    expect(calls).toHaveLength(1); // reached provider ONLY via the chokepoint
    expect(pending).toHaveLength(0); // approved → no pending row queued
  });

  it('approved for DIFFERENT text (re-composed → different hash) → BLOCKED, pending queued, nothing sent', async () => {
    const { rawSend, calls } = makeRawSend();
    // Approval exists, but bound to an OLD/other hash — not the current text's hash.
    const staleHash = computeComposedHash('OLD subject', '<p>OLD body</p>');
    const { gateway, pending } = makeReviewGateway({ approvedHash: staleHash });

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
      reviewGateway: gateway,
      reviewContext: REAL,
    });

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_review_required',
      composed_hash: MATCHING_HASH,
    });
    expect(calls).toHaveLength(0); // fail-closed: never reached the provider
    // A fresh pending row for the CURRENT text was queued (the stale approval is void).
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      composedSubject: SUBJECT,
      composedBody: BODY_HTML,
      composedHash: MATCHING_HASH,
    });
    expect(pending[0].composedHash).not.toBe(staleHash);
  });

  it('no matching approval (pending/rejected/missing) → BLOCKED, pending queued, nothing sent', async () => {
    const { rawSend, calls } = makeRawSend();
    const { gateway, pending } = makeReviewGateway({ approvedHash: null });

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
      reviewGateway: gateway,
      reviewContext: REAL,
    });

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({ kind: 'pr_pitch_review_required' });
    expect(calls).toHaveLength(0);
    expect(pending).toHaveLength(1);
  });

  it('fail-closed default: a DB read error (gateway returns false) never sends', async () => {
    const { rawSend, calls } = makeRawSend();
    // isApproved always false models the fail-closed read-error path.
    const gateway: OutreachReviewGateway = {
      isApproved: async () => false,
      upsertPending: async () => {},
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
      reviewGateway: gateway,
      reviewContext: REAL,
    });

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({ kind: 'pr_pitch_review_required' });
    expect(calls).toHaveLength(0);
  });

  it('stub egress (prod default) → gate INERT: no approval lookup, no pending row, send routes through chokepoint', async () => {
    const { rawSend, calls } = makeRawSend();
    const { gateway, isApprovedCalls, pending } = makeReviewGateway({
      approvedHash: null,
    });

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
      reviewGateway: gateway,
      reviewContext: { egress: 'stub' },
    });

    expect(outcome.result).toBe('success');
    expect(calls).toHaveLength(1); // still routes through the chokepoint
    expect(isApprovedCalls).toHaveLength(0); // no DB approval lookup while stub
    expect(pending).toHaveLength(0); // nothing queued while stub
  });
});
