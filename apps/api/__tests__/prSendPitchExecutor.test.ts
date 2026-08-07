/**
 * Wave-2 — PR `pr.send_pitch` executor tests.
 *
 * Load-bearing claims:
 *   1. A pitch is sent EXCLUSIVELY through the governed chokepoint (sendGuardedEmail):
 *      the provider is only ever reached via the injected rawSend seam. A clean,
 *      eligible, well-personalized pitch → VERIFIED `success`.
 *   2. When a governor REFUSES (suppression/eligibility/etc.) the executor records a
 *      neutral `governed_complete` refusal outcome — NOT success (nothing sent) and
 *      NOT failure (nothing errored) — and rawSend is NEVER called.
 *   3. No pitch subject/body → the executor COMPOSES a personalized pitch via the
 *      injected composer, then sends it through the SAME chokepoint (provider still
 *      only reached via rawSend). A well-personalized composed pitch → `success`.
 *   4. A composed pitch that still reads GENERIC fails the server-side personalization
 *      gate AT THE CHOKEPOINT → `governed_complete` refusal (NOT success), rawSend
 *      NEVER called.
 *   5. Composer failure (LLM unavailable → null) → `failure` (kind
 *      pr_pitch_compose_failed); rawSend NEVER called (nothing fabricated/sent).
 *   6. Provider attempted the send and reported failure → `failure`.
 *   7. No resolvable recipient → neutral `governed_complete` needs_recipient.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import {
  runPrSendPitch,
  type ResolvedRecipient,
} from '../src/services/craft/executors/prSendPitchExecutor';
import type {
  ComposePitchInput,
  ComposedPitch,
} from '../src/services/pr/pitchComposer';
import type {
  GovernanceGateways,
  RawSend,
  ContactGovernanceState,
} from '../src/services/sendGuardedEmail';

const CTX = {
  supabase: {} as SupabaseClient, // never touched: gateways/rawSend/resolve/compose injected
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

// A well-personalized pitch (first name + outlet + beat → score well above 40).
const GOOD_CONTENT = {
  subject: 'Story idea for Alex at FreightWaves',
  body_html:
    '<p>Hi Alex, I have a logistics story idea for FreightWaves you may like.</p>',
};

function makeGateways(
  overrides: Partial<GovernanceGateways> & {
    governance?: Partial<ContactGovernanceState>;
  } = {}
): GovernanceGateways {
  return {
    getContactGovernanceState: async (): Promise<ContactGovernanceState> => ({
      contactId: 'j-1',
      state: 'pitch_eligible',
      orgDoNotContact: false,
      ...overrides.governance,
    }),
    getOrgTier: async () => 'pro',
    countPitchesSentToday: async () => 0,
    countActiveSequences: async () => 0,
    countFollowUpsLast7Days: async () => 0,
    recordStateTransition: async () => {},
    ...overrides,
  };
}

function makeRawSend(response?: {
  success: boolean;
  messageId?: string | null;
  error?: string;
}) {
  const calls: unknown[] = [];
  const rawSend: RawSend = async (request) => {
    calls.push(request);
    return {
      success: response?.success ?? true,
      messageId: response?.messageId ?? 'stub-msg-1',
      provider: 'stub',
      error: response?.error,
    };
  };
  return { rawSend, calls };
}

/** A composer that returns a well-personalized pitch (name + outlet + beat present). */
function makeGoodComposer() {
  const calls: ComposePitchInput[] = [];
  const composePitch = async (
    input: ComposePitchInput
  ): Promise<ComposedPitch | null> => {
    calls.push(input);
    const body =
      'Hi Alex, I follow your logistics coverage at FreightWaves and thought this ' +
      'story about resilient freight networks would fit your beat. Happy to share ' +
      'data and connect you with our operators for a quick interview this week.';
    return {
      subject: 'Logistics story for Alex at FreightWaves',
      bodyText: body,
      bodyHtml: `<p>${body}</p>`,
      recentWorkHook: null,
      model: 'test-haiku',
    };
  };
  return { composePitch, calls };
}

describe('prSendPitchExecutor', () => {
  it('clean eligible pitch → routes through the chokepoint and returns success', async () => {
    const { rawSend, calls } = makeRawSend();
    const proposal = {
      action_type: 'pr.send_pitch',
      action_params: { journalist_id: 'j-1', ...GOOD_CONTENT },
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
    });

    expect(outcome.result).toBe('success');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_sent',
      provider: 'stub',
      provider_message_id: 'stub-msg-1',
      composed: false,
      journalist_id: 'j-1',
    });
    // The ONLY path to the provider is the chokepoint's rawSend — called exactly once.
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ to: 'alex@freightwaves.com' });
  });

  it('suppressed recipient → governed refusal (not success, not failure), rawSend NEVER called', async () => {
    const { rawSend, calls } = makeRawSend();
    const proposal = {
      action_type: 'pr.send_pitch',
      action_params: { journalist_id: 'j-1', ...GOOD_CONTENT },
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways({ governance: { state: 'suppressed' } }),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
    });

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_governed_refusal',
      governor: 'suppression',
    });
    expect(outcome.detail.reason).toBeTruthy();
    // Provider was never reached — the governor refused before the send.
    expect(calls).toHaveLength(0);
  });

  it('ineligible recipient (not pitch_eligible) → governed refusal, rawSend NEVER called', async () => {
    const { rawSend, calls } = makeRawSend();
    const proposal = {
      action_type: 'pr.send_pitch',
      action_params: { journalist_id: 'j-1', ...GOOD_CONTENT },
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways({ governance: { state: 'enriched' } }),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
    });

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_governed_refusal',
      governor: 'pitch_eligibility',
    });
    expect(calls).toHaveLength(0);
  });

  it('missing pitch content → COMPOSES a personalized pitch and sends it via the chokepoint', async () => {
    const { rawSend, calls } = makeRawSend();
    const { composePitch, calls: composeCalls } = makeGoodComposer();
    const proposal = {
      action_type: 'pr.send_pitch',
      title: 'Resilient freight networks report',
      action_params: { journalist_id: 'j-1' }, // no subject/body
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
      composePitch,
    });

    expect(outcome.result).toBe('success');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_sent',
      composed: true,
      compose_model: 'test-haiku',
    });
    // Composer was grounded in the resolved journalist context.
    expect(composeCalls).toHaveLength(1);
    expect(composeCalls[0].journalist).toMatchObject({
      name: 'Alex Rivera',
      outlet: 'FreightWaves',
      beats: ['logistics'],
    });
    expect(composeCalls[0].signal.title).toBe(
      'Resilient freight networks report'
    );
    // The composed pitch reached the provider ONLY via the chokepoint's rawSend.
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      to: 'alex@freightwaves.com',
      subject: 'Logistics story for Alex at FreightWaves',
    });
  });

  it('composed pitch that reads GENERIC → personalization refusal at chokepoint (not success), rawSend NEVER called', async () => {
    const { rawSend, calls } = makeRawSend();
    const genericComposer = async (): Promise<ComposedPitch> => ({
      subject: 'A story for you',
      bodyText:
        'We have some news we think is worth covering. Let us know if interested.',
      bodyHtml:
        '<p>We have some news we think is worth covering. Let us know if interested.</p>',
      recentWorkHook: null,
      model: 'test-haiku',
    });
    const proposal = {
      action_type: 'pr.send_pitch',
      action_params: { journalist_id: 'j-1' },
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
      composePitch: genericComposer,
    });

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_governed_refusal',
      governor: 'personalization',
      composed: true,
    });
    // The gate refused BEFORE the provider was reached.
    expect(calls).toHaveLength(0);
  });

  it('composer failure (LLM unavailable → null) → failure, nothing sent', async () => {
    const { rawSend, calls } = makeRawSend();
    const failingComposer = async (): Promise<ComposedPitch | null> => null;
    const proposal = {
      action_type: 'pr.send_pitch',
      action_params: { journalist_id: 'j-1' },
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
      composePitch: failingComposer,
    });

    expect(outcome.result).toBe('failure');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_compose_failed',
      journalist_id: 'j-1',
    });
    expect(calls).toHaveLength(0);
  });

  it('provider reports a failed send → failure', async () => {
    const { rawSend } = makeRawSend({ success: false, error: 'provider boom' });
    const proposal = {
      action_type: 'pr.send_pitch',
      action_params: { journalist_id: 'j-1', ...GOOD_CONTENT },
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => RECIPIENT,
    });

    expect(outcome.result).toBe('failure');
    expect(outcome.detail).toMatchObject({
      kind: 'pr_pitch_send_failed',
      error: 'provider boom',
    });
  });

  it('no resolvable recipient → needs_recipient governed outcome, nothing sent', async () => {
    const { rawSend, calls } = makeRawSend();
    const proposal = {
      action_type: 'pr.send_pitch',
      action_params: { journalist_id: 'j-unknown', ...GOOD_CONTENT },
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => null,
    });

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({ kind: 'pr_pitch_needs_recipient' });
    expect(calls).toHaveLength(0);
  });

  it('no journalist_id/contact_id at all → needs_recipient, resolver never invoked', async () => {
    const { rawSend, calls } = makeRawSend();
    let resolveCalled = false;
    const proposal = {
      action_type: 'pr.send_pitch',
      action_params: { ...GOOD_CONTENT }, // content present, but no recipient id
    };

    const outcome = await runPrSendPitch(proposal, CTX, {
      gateways: makeGateways(),
      rawSend,
      resolveRecipient: async () => {
        resolveCalled = true;
        return RECIPIENT;
      },
    });

    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({ kind: 'pr_pitch_needs_recipient' });
    expect(resolveCalled).toBe(false);
    expect(calls).toHaveLength(0);
  });
});
