/**
 * F46 — resolveUserEmails unit tests.
 *
 * Covers the new email-resolution logic that backs GET /orgs/:id/members after
 * the `users!inner(...email)` embed was removed (email is on auth.users, not
 * public.users). Verifies: populated emails, missing → null, admin-API
 * error/throw → null (no crash), and per-unique-id dedup.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi } from 'vitest';

import { resolveUserEmails } from '../src/lib/resolveUserEmails';

function mockSupabase(
  impl: (id: string) => Promise<{ data: { user: unknown }; error: unknown }>
) {
  const getUserById = vi.fn((id: string) => impl(id));
  return {
    client: { auth: { admin: { getUserById } } } as unknown as SupabaseClient,
    getUserById,
  };
}

describe('resolveUserEmails', () => {
  it('populates emails from auth.users', async () => {
    const { client, getUserById } = mockSupabase(async (id) => ({
      data: { user: { id, email: `${id}@example.com` } },
      error: null,
    }));

    const map = await resolveUserEmails(client, ['a', 'b']);

    expect(map.get('a')).toBe('a@example.com');
    expect(map.get('b')).toBe('b@example.com');
    expect(getUserById).toHaveBeenCalledTimes(2);
  });

  it('returns null when the user has no email or is not found', async () => {
    const { client } = mockSupabase(async (id) => ({
      data: { user: id === 'a' ? { id, email: null } : null },
      error: null,
    }));

    const map = await resolveUserEmails(client, ['a', 'b']);

    expect(map.get('a')).toBeNull();
    expect(map.get('b')).toBeNull();
  });

  it('returns null (no crash) when the admin API errors or throws', async () => {
    const { client } = mockSupabase(async (id) => {
      if (id === 'a')
        return { data: { user: null }, error: { message: 'boom' } };
      throw new Error('network down');
    });

    const map = await resolveUserEmails(client, ['a', 'b']);

    expect(map.get('a')).toBeNull();
    expect(map.get('b')).toBeNull();
  });

  it('dedupes repeated ids (one admin call per unique id)', async () => {
    const { client, getUserById } = mockSupabase(async (id) => ({
      data: { user: { id, email: `${id}@example.com` } },
      error: null,
    }));

    const map = await resolveUserEmails(client, ['a', 'a', 'a']);

    expect(getUserById).toHaveBeenCalledTimes(1);
    expect(map.get('a')).toBe('a@example.com');
  });
});
