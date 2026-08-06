/**
 * Send-chokepoint governor tests (Lane B).
 *
 * Verifies each of the 6 governors, in order, plus the suppression audit
 * behavior. Uses injected fake gateways so the governor LOGIC is tested
 * deterministically without a database.
 *
 * Canon: JOURNALIST_DATABASE_GOVERNANCE.md §4 (suppression/eligibility),
 *        §10.3 (tier caps / follow-up cap), §16 (CAN-SPAM).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { SendEmailRequest, SendEmailResponse } from '@pravado/types';

import {
  sendGuardedEmail,
  type ContactGovernanceState,
  type GovernanceGateways,
  type GuardedSendContext,
} from '../src/services/sendGuardedEmail';

const PERSONALIZED_BODY =
  'Hi Sarah, I loved your recent piece on generative AI adoption in the enterprise for ' +
  'TechCrunch. Given your focus on enterprise ai and startups I thought you might want an ' +
  'exclusive look at how mid-market teams measure model citations. Happy to share data and a ' +
  'customer intro this week if useful — thanks for the consistently sharp coverage as always.';

function baseRequest(overrides: Partial<SendEmailRequest> = {}): SendEmailRequest {
  return {
    to: 'sarah@techcrunch.com',
    subject: 'Exclusive for Sarah on enterprise AI',
    bodyHtml: `<p>${PERSONALIZED_BODY}</p>`,
    bodyText: PERSONALIZED_BODY,
    ...overrides,
  };
}

function baseContext(overrides: Partial<GuardedSendContext> = {}): GuardedSendContext {
  return {
    orgId: 'org-1',
    contactId: 'contact-1',
    journalistId: 'journ-1',
    recipientEmail: 'sarah@techcrunch.com',
    actorId: 'user-1',
    isFollowUp: false,
    purpose: 'pitch',
    personalization: {
      name: 'Sarah Chen',
      outlet: 'TechCrunch',
      beats: ['enterprise ai', 'startups'],
      recentWorkHook: 'recent piece on generative AI adoption in the enterprise',
    },
    ...overrides,
  };
}

function makeGateways(
  overrides: Partial<GovernanceGateways> = {},
  govState: Partial<ContactGovernanceState> = {}
): GovernanceGateways {
  return {
    getContactGovernanceState: vi.fn(async () => ({
      contactId: 'contact-1',
      state: 'pitch_eligible',
      orgDoNotContact: false,
      ...govState,
    })),
    getOrgTier: vi.fn(async () => 'starter' as const),
    countPitchesSentToday: vi.fn(async () => 0),
    countActiveSequences: vi.fn(async () => 0),
    countFollowUpsLast7Days: vi.fn(async () => 0),
    recordStateTransition: vi.fn(async () => {}),
    ...overrides,
  };
}

let rawSend: ReturnType<typeof vi.fn>;
const okResponse: SendEmailResponse = { success: true, messageId: 'msg-1', provider: 'stub' };

beforeEach(() => {
  rawSend = vi.fn(async () => okResponse);
});

describe('sendGuardedEmail — governor 1: suppression (CAN-SPAM)', () => {
  it('hard-blocks a suppressed contact and never calls the provider', async () => {
    const gateways = makeGateways({}, { state: 'suppressed' });
    const res = await sendGuardedEmail({
      request: baseRequest(),
      context: baseContext(),
      gateways,
      rawSend,
    });
    expect(res.sent).toBe(false);
    expect(res.refusal?.governor).toBe('suppression');
    expect(rawSend).not.toHaveBeenCalled();
    // audit row for the blocked attempt
    expect(gateways.recordStateTransition).toHaveBeenCalledWith(
      expect.objectContaining({ toState: 'suppressed', trigger: 'send_blocked_suppressed' })
    );
  });

  it('hard-blocks a bounced contact', async () => {
    const gateways = makeGateways({}, { state: 'bounced' });
    const res = await sendGuardedEmail({ request: baseRequest(), context: baseContext(), gateways, rawSend });
    expect(res.refusal?.governor).toBe('suppression');
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('blocks an org do_not_contact even when state is pitch_eligible', async () => {
    const gateways = makeGateways({}, { state: 'pitch_eligible', orgDoNotContact: true });
    const res = await sendGuardedEmail({ request: baseRequest(), context: baseContext(), gateways, rawSend });
    expect(res.refusal?.governor).toBe('suppression');
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('still blocks suppression on a test-purpose send', async () => {
    const gateways = makeGateways({}, { state: 'suppressed' });
    const res = await sendGuardedEmail({
      request: baseRequest(),
      context: baseContext({ purpose: 'test' }),
      gateways,
      rawSend,
    });
    expect(res.refusal?.governor).toBe('suppression');
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('FAILS CLOSED: an errored/uncertain governance read blocks the send', async () => {
    // Simulates governanceGateways returning readError (any DB read error).
    const gateways = makeGateways({}, { state: null, readError: true } as any);
    const res = await sendGuardedEmail({ request: baseRequest(), context: baseContext(), gateways, rawSend });
    expect(res.sent).toBe(false);
    expect(res.refusal?.governor).toBe('suppression');
    expect(res.refusal?.details).toMatchObject({ readError: true });
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('FAILS CLOSED even on a test-purpose send', async () => {
    const gateways = makeGateways({}, { state: null, readError: true } as any);
    const res = await sendGuardedEmail({
      request: baseRequest(),
      context: baseContext({ purpose: 'test' }),
      gateways,
      rawSend,
    });
    expect(res.refusal?.governor).toBe('suppression');
    expect(rawSend).not.toHaveBeenCalled();
  });
});

describe('sendGuardedEmail — governor 2: pitch-eligibility', () => {
  it('blocks a non-pitch_eligible contact (enriched)', async () => {
    const gateways = makeGateways({}, { state: 'enriched' });
    const res = await sendGuardedEmail({ request: baseRequest(), context: baseContext(), gateways, rawSend });
    expect(res.refusal?.governor).toBe('pitch_eligibility');
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('bypasses eligibility for test sends (suppression already cleared)', async () => {
    const gateways = makeGateways({}, { state: 'identity_only' });
    const res = await sendGuardedEmail({
      request: baseRequest(),
      context: baseContext({ purpose: 'test' }),
      gateways,
      rawSend,
    });
    expect(res.sent).toBe(true);
    expect(rawSend).toHaveBeenCalledTimes(1);
  });
});

describe('sendGuardedEmail — governor 3: daily pitch cap', () => {
  it('blocks when the org has hit the tier daily cap', async () => {
    const gateways = makeGateways({ countPitchesSentToday: vi.fn(async () => 5) }); // starter cap = 5
    const res = await sendGuardedEmail({ request: baseRequest(), context: baseContext(), gateways, rawSend });
    expect(res.refusal?.governor).toBe('daily_pitch_cap');
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('allows under the cap', async () => {
    const gateways = makeGateways({ countPitchesSentToday: vi.fn(async () => 4) });
    const res = await sendGuardedEmail({ request: baseRequest(), context: baseContext(), gateways, rawSend });
    expect(res.sent).toBe(true);
  });
});

describe('sendGuardedEmail — governor 4: active-sequence cap', () => {
  it('blocks a sequence send over the tier active-sequence cap', async () => {
    const gateways = makeGateways({ countActiveSequences: vi.fn(async () => 3) }); // starter cap = 2
    const res = await sendGuardedEmail({
      request: baseRequest(),
      context: baseContext({ purpose: 'sequence' }),
      gateways,
      rawSend,
    });
    expect(res.refusal?.governor).toBe('active_sequence_cap');
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('blocks AT the cap (>= semantics, off-by-one fixed)', async () => {
    const gateways = makeGateways({ countActiveSequences: vi.fn(async () => 2) }); // starter cap = 2
    const res = await sendGuardedEmail({
      request: baseRequest(),
      context: baseContext({ purpose: 'sequence' }),
      gateways,
      rawSend,
    });
    expect(res.refusal?.governor).toBe('active_sequence_cap');
    expect(rawSend).not.toHaveBeenCalled();
  });
});

describe('sendGuardedEmail — governor 5: follow-up cap (2 / 7d)', () => {
  it('blocks a 3rd follow-up within 7 days', async () => {
    const gateways = makeGateways({ countFollowUpsLast7Days: vi.fn(async () => 2) });
    const res = await sendGuardedEmail({
      request: baseRequest(),
      context: baseContext({ isFollowUp: true }),
      gateways,
      rawSend,
    });
    expect(res.refusal?.governor).toBe('followup_cap');
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('does not apply the follow-up cap to an initial pitch', async () => {
    const gateways = makeGateways({ countFollowUpsLast7Days: vi.fn(async () => 99) });
    const res = await sendGuardedEmail({
      request: baseRequest(),
      context: baseContext({ isFollowUp: false }),
      gateways,
      rawSend,
    });
    expect(res.sent).toBe(true);
    expect(gateways.countFollowUpsLast7Days).not.toHaveBeenCalled();
  });
});

describe('sendGuardedEmail — governor 6: personalization gate', () => {
  it('blocks a pitch scoring below 40', async () => {
    const gateways = makeGateways();
    const res = await sendGuardedEmail({
      request: baseRequest({ subject: 'Story idea', bodyHtml: '<p>Dear Journalist, please cover us.</p>', bodyText: 'Dear Journalist, please cover us.' }),
      context: baseContext(),
      gateways,
      rawSend,
    });
    expect(res.refusal?.governor).toBe('personalization');
    expect(res.personalization.score).toBeLessThan(40);
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('warns (but sends) in the 40-60 band', async () => {
    const gateways = makeGateways();
    const res = await sendGuardedEmail({
      request: baseRequest({ subject: 'Quick note for Sarah', bodyHtml: '<p>Hi Sarah, I wanted to quickly reach out about TechCrunch and share a quick idea today.</p>', bodyText: 'Hi Sarah, I wanted to quickly reach out about TechCrunch and share a quick idea today.' }),
      context: baseContext(),
      gateways,
      rawSend,
    });
    expect(res.sent).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.personalization.warned).toBe(true);
    expect(rawSend).toHaveBeenCalledTimes(1);
  });
});

describe('sendGuardedEmail — happy path', () => {
  it('sends cleanly when every governor passes', async () => {
    const gateways = makeGateways();
    const res = await sendGuardedEmail({ request: baseRequest(), context: baseContext(), gateways, rawSend });
    expect(res.sent).toBe(true);
    expect(res.refusal).toBeUndefined();
    expect(res.warnings).toHaveLength(0);
    expect(rawSend).toHaveBeenCalledTimes(1);
  });

  it('enforces governors strictly in order (suppression before eligibility before caps)', async () => {
    // suppressed AND over cap AND unpersonalized -> suppression wins.
    const gateways = makeGateways(
      { countPitchesSentToday: vi.fn(async () => 999) },
      { state: 'suppressed' }
    );
    const res = await sendGuardedEmail({
      request: baseRequest({ bodyText: 'Dear Journalist', bodyHtml: '<p>Dear Journalist</p>' }),
      context: baseContext(),
      gateways,
      rawSend,
    });
    expect(res.refusal?.governor).toBe('suppression');
    expect(gateways.countPitchesSentToday).not.toHaveBeenCalled();
  });
});
