/**
 * Per-customer outreach sender-identity resolver tests.
 *
 * Load-bearing claims:
 *   1. Acting user (the human approver) wins for reply-to; org name supplies the
 *      display fromName.
 *   2. With no acting user, org metadata (outreach_reply_to / outreach_from_name)
 *      supplies reply-to + display name, and metadata overrides org.name.
 *   3. With neither an acting user nor a configured reply-to, there is NO reply-to
 *      (replies would fall to the platform from) — fromName still resolves to org.name.
 *   4. Resolution is best-effort: a DB error yields an empty identity and never throws
 *      (must not block a governed send).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi } from 'vitest';

import { resolveSenderIdentity } from '../src/services/pr/senderIdentity';

function mockSupabase(
  result: { data?: unknown } | { reject: true }
): SupabaseClient {
  const maybeSingle = vi.fn(() =>
    'reject' in result
      ? Promise.reject(new Error('db down'))
      : Promise.resolve({ data: result.data })
  );
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from } as unknown as SupabaseClient;
}

describe('resolveSenderIdentity', () => {
  it('uses the acting user email for reply-to and org name for display', async () => {
    const supabase = mockSupabase({
      data: { name: 'Acme Corp', metadata: {} },
    });

    const identity = await resolveSenderIdentity(supabase, 'org-1', {
      email: 'jane@acme.com',
    });

    expect(identity.fromName).toBe('Acme Corp');
    expect(identity.replyTo).toEqual({
      email: 'jane@acme.com',
      name: 'Acme Corp',
    });
  });

  it('falls back to org metadata for reply-to and display when no acting user', async () => {
    const supabase = mockSupabase({
      data: {
        name: 'Acme Corp',
        metadata: {
          outreach_from_name: 'Acme Newsroom',
          outreach_reply_to: 'press@acme.com',
        },
      },
    });

    const identity = await resolveSenderIdentity(supabase, 'org-1');

    // metadata display name overrides the raw org name
    expect(identity.fromName).toBe('Acme Newsroom');
    expect(identity.replyTo).toEqual({
      email: 'press@acme.com',
      name: 'Acme Newsroom',
    });
  });

  it('omits reply-to when neither acting user nor configured address exists', async () => {
    const supabase = mockSupabase({
      data: { name: 'Acme Corp', metadata: {} },
    });

    const identity = await resolveSenderIdentity(supabase, 'org-1');

    expect(identity.fromName).toBe('Acme Corp');
    expect(identity.replyTo).toBeUndefined();
  });

  it('is best-effort: returns an empty identity on DB error, never throws', async () => {
    const supabase = mockSupabase({ reject: true });

    const identity = await resolveSenderIdentity(supabase, 'org-1', {
      email: 'jane@acme.com',
    });

    expect(identity).toEqual({});
  });
});
