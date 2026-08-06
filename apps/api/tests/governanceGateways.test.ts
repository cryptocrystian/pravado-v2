/**
 * Supabase governance gateway tests (Lane B hardening).
 *
 * Locks in the two HIGH fixes:
 *   H1  — reads FAIL CLOSED: any DB read error yields readError=true (never
 *         a default pitch_eligible), so the chokepoint refuses the send.
 *   H1b — durable suppression: a hashed opt-out blocks the send even when NO
 *         media_contacts row exists yet (pre-backfill).
 */

import type { SendEmailResponse } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi } from 'vitest';

import { hashEmail } from '../src/services/emailSuppression';
import { createSupabaseGovernanceGateways } from '../src/services/governanceGateways';
import { sendGuardedEmail } from '../src/services/sendGuardedEmail';

const EMAIL = 'sarah@techcrunch.com';

/** Table+op-aware chainable mock. responders keyed by `${table}:${op}`. */
function createMock(
  responders: Record<string, () => { data: any; error: any }>
) {
  function builder(table: string) {
    let op = 'select';
    const b: any = {};
    for (const m of [
      'select',
      'eq',
      'ilike',
      'limit',
      'order',
      'gte',
      'lte',
      'neq',
      'in',
      'is',
    ]) {
      b[m] = vi.fn(() => {
        if (m === 'select') op = 'select';
        return b;
      });
    }
    b.insert = vi.fn(() => {
      op = 'insert';
      return b;
    });
    b.update = vi.fn(() => {
      op = 'update';
      return b;
    });
    b.upsert = vi.fn(() => {
      op = 'upsert';
      return b;
    });
    const term = () =>
      Promise.resolve(
        responders[`${table}:${op}`]?.() ?? { data: null, error: null }
      );
    b.single = vi.fn(term);
    b.maybeSingle = vi.fn(term);
    b.then = (resolve: any, reject: any) => term().then(resolve, reject);
    return b;
  }
  return {
    from: vi.fn((t: string) => builder(t)),
    rpc: vi.fn(async () => ({ data: null, error: null })),
  } as unknown as SupabaseClient;
}

const ctx = (overrides = {}) => ({
  orgId: 'org-1',
  contactId: 'contact-1',
  journalistId: 'journ-1',
  recipientEmail: EMAIL,
  isFollowUp: false,
  purpose: 'pitch' as const,
  personalization: {
    name: 'Sarah',
    outlet: 'TechCrunch',
    beats: [],
    recentWorkHook: null,
  },
  ...overrides,
});

describe('createSupabaseGovernanceGateways.getContactGovernanceState', () => {
  it('H1: FAILS CLOSED when media_contacts read returns an error', async () => {
    const supabase = createMock({
      'suppressed_email_hashes:select': () => ({ data: null, error: null }),
      'media_contacts:select': () => ({
        data: null,
        error: { message: 'boom', code: '500' },
      }),
    });
    const g = createSupabaseGovernanceGateways(supabase);
    const state = await g.getContactGovernanceState(ctx());
    expect(state.readError).toBe(true);
    expect(state.state).not.toBe('pitch_eligible');
  });

  it('H1: FAILS CLOSED when contact_emails read errors', async () => {
    const supabase = createMock({
      'suppressed_email_hashes:select': () => ({ data: null, error: null }),
      'contact_emails:select': () => ({
        data: null,
        error: { message: 'boom' },
      }),
    });
    const g = createSupabaseGovernanceGateways(supabase);
    // no contactId -> forces the contact_emails resolve path
    const state = await g.getContactGovernanceState(ctx({ contactId: null }));
    expect(state.readError).toBe(true);
  });

  it('H1: FAILS CLOSED when the suppression hash read errors', async () => {
    const supabase = createMock({
      'suppressed_email_hashes:select': () => ({
        data: null,
        error: { message: 'boom' },
      }),
    });
    const g = createSupabaseGovernanceGateways(supabase);
    const state = await g.getContactGovernanceState(ctx());
    expect(state.readError).toBe(true);
  });

  it('H1b: a hashed opt-out blocks even with NO contact row (pre-backfill)', async () => {
    const supabase = createMock({
      'suppressed_email_hashes:select': () => ({
        data: { email_hash: hashEmail(EMAIL), reason: 'opt_out' },
        error: null,
      }),
      // no contact anywhere
      'contact_emails:select': () => ({ data: null, error: null }),
      'media_contacts:select': () => ({ data: null, error: null }),
    });
    const g = createSupabaseGovernanceGateways(supabase);
    const state = await g.getContactGovernanceState(
      ctx({ contactId: null, journalistId: null })
    );
    expect(state.state).toBe('suppressed');
  });
});

describe('end-to-end: gateway + chokepoint', () => {
  const rawSend = vi.fn(
    async (): Promise<SendEmailResponse> => ({
      success: true,
      messageId: 'm',
      provider: 'stub',
    })
  );

  it('H1b: a pre-backfill opt-out (hash only) BLOCKS the actual send', async () => {
    rawSend.mockClear();
    const supabase = createMock({
      'suppressed_email_hashes:select': () => ({
        data: { email_hash: hashEmail(EMAIL), reason: 'opt_out' },
        error: null,
      }),
      'contact_emails:select': () => ({ data: null, error: null }),
      'media_contacts:select': () => ({ data: null, error: null }),
    });
    const gateways = createSupabaseGovernanceGateways(supabase);
    const res = await sendGuardedEmail({
      request: { to: EMAIL, subject: 's', bodyHtml: '<p>b</p>', bodyText: 'b' },
      context: ctx({ contactId: null, journalistId: null }),
      gateways,
      rawSend,
    });
    expect(res.sent).toBe(false);
    expect(res.refusal?.governor).toBe('suppression');
    expect(rawSend).not.toHaveBeenCalled();
  });

  it('H1: an errored governance read BLOCKS the actual send', async () => {
    rawSend.mockClear();
    const supabase = createMock({
      'suppressed_email_hashes:select': () => ({
        data: null,
        error: { message: 'boom' },
      }),
    });
    const gateways = createSupabaseGovernanceGateways(supabase);
    const res = await sendGuardedEmail({
      request: { to: EMAIL, subject: 's', bodyHtml: '<p>b</p>', bodyText: 'b' },
      context: ctx(),
      gateways,
      rawSend,
    });
    expect(res.sent).toBe(false);
    expect(res.refusal?.governor).toBe('suppression');
    expect(rawSend).not.toHaveBeenCalled();
  });
});
