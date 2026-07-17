/**
 * #7 — resolveWebhookOrgId: attribute an inbound SendGrid deliverability event
 * to the real org (was hardcoded 'placeholder-org-id', which silently dropped
 * every event). Primary = custom_args orgId; fallback = provider_message_id
 * prefix lookup; else null (caller skips).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi } from 'vitest';

// The service loads the pino logger at import time (crashes under vitest).
vi.mock('../src/lib/logger', () => {
  const l = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    child: () => l,
  };
  return { createLogger: () => l, serviceLogger: l, fastifyLoggerOptions: {} };
});

import { resolveWebhookOrgId } from '../src/services/outreachDeliverabilityService';

/** Mock that serves pr_outreach_email_messages.org_id by provider_message_id. */
function makeSupabase(orgByProviderId: Record<string, string>) {
  const eqSpy = vi.fn();
  const client = {
    from: (_t: string) => ({
      select: () => ({
        eq: (_col: string, val: string) => {
          eqSpy(val);
          return {
            maybeSingle: async () => ({
              data: orgByProviderId[val]
                ? { org_id: orgByProviderId[val] }
                : null,
            }),
          };
        },
      }),
    }),
  } as unknown as SupabaseClient;
  return { client, eqSpy };
}

describe('resolveWebhookOrgId (#7)', () => {
  it('uses the top-level custom_args orgId (SendGrid flattens custom_args)', async () => {
    const { client, eqSpy } = makeSupabase({});
    expect(
      await resolveWebhookOrgId(client, { orgId: 'org-123', event: 'open' })
    ).toBe('org-123');
    expect(eqSpy).not.toHaveBeenCalled(); // no DB lookup needed
  });

  it('uses a nested custom_args.orgId', async () => {
    const { client } = makeSupabase({});
    expect(
      await resolveWebhookOrgId(client, { custom_args: { orgId: 'org-456' } })
    ).toBe('org-456');
  });

  it('falls back to provider_message_id prefix lookup (strips the .recvd suffix)', async () => {
    const { client, eqSpy } = makeSupabase({ MSGABC: 'org-789' });
    const orgId = await resolveWebhookOrgId(client, {
      sg_message_id: 'MSGABC.recvd-abcdef.filterdrecv',
      event: 'bounce',
    });
    expect(orgId).toBe('org-789');
    expect(eqSpy).toHaveBeenCalledWith('MSGABC'); // prefix, not the suffixed id
  });

  it('returns null when nothing resolves (caller must skip, never placeholder)', async () => {
    const { client } = makeSupabase({});
    expect(
      await resolveWebhookOrgId(client, {
        sg_message_id: 'UNKNOWN.recvd',
        event: 'open',
      })
    ).toBeNull();
    expect(await resolveWebhookOrgId(client, { event: 'open' })).toBeNull();
    expect(await resolveWebhookOrgId(client, null)).toBeNull();
  });

  it('prefers custom_args over the lookup', async () => {
    const { client, eqSpy } = makeSupabase({ MSG: 'org-from-db' });
    const orgId = await resolveWebhookOrgId(client, {
      orgId: 'org-from-args',
      sg_message_id: 'MSG.recvd',
    });
    expect(orgId).toBe('org-from-args');
    expect(eqSpy).not.toHaveBeenCalled();
  });
});
