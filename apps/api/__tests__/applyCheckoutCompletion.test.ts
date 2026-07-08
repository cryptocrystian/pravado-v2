/**
 * F36 / Finding A — applyCheckoutCompletion unit tests.
 *
 * Covers the checkout.session.completed → org_billing_state plan write:
 * happy path (plan_id written), the Finding A regression (a row is CREATED via
 * upsert when the org has none — the old `.update().eq()` silently no-op'd),
 * idempotency (no double-write on redelivery), missing metadata, plan-not-found,
 * and upsert failure.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { describe, it, expect, vi } from 'vitest';

import { applyCheckoutCompletion } from '../src/services/billing/applyCheckoutCompletion';

function makeSupabase(opts: {
  plan?: { data: unknown; error: unknown };
  current?: { data: unknown };
  upsertError?: unknown;
}) {
  const upsertSpy = vi.fn();
  const client = {
    from(table: string) {
      if (table === 'billing_plans') {
        return {
          select: () => ({
            eq: () => ({
              single: async () =>
                opts.plan ?? { data: null, error: { message: 'not found' } },
            }),
          }),
        };
      }
      // org_billing_state
      return {
        select: () => ({
          eq: () => ({ single: async () => opts.current ?? { data: null } }),
        }),
        upsert: (payload: unknown, options: unknown) => {
          upsertSpy(payload, options);
          return Promise.resolve({ error: opts.upsertError ?? null });
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, upsertSpy };
}

function session(
  overrides: Record<string, unknown> = {}
): Stripe.Checkout.Session {
  return {
    id: 'cs_test_1',
    metadata: { orgId: 'org-1', planSlug: 'growth' },
    subscription: 'sub_1',
    customer: 'cus_1',
    ...overrides,
  } as unknown as Stripe.Checkout.Session;
}

describe('applyCheckoutCompletion', () => {
  it('upserts plan_id + stripe ids when the org is on a different plan', async () => {
    const { client, upsertSpy } = makeSupabase({
      plan: { data: { id: 'plan-growth' }, error: null },
      current: {
        data: { plan_id: 'plan-starter', stripe_subscription_id: 'sub_0' },
      },
    });

    const result = await applyCheckoutCompletion(client, session());

    expect(result).toEqual({
      updated: true,
      orgId: 'org-1',
      planSlug: 'growth',
    });
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        plan_id: 'plan-growth',
        stripe_subscription_id: 'sub_1',
        stripe_customer_id: 'cus_1',
        subscription_status: 'active',
        billing_status: 'active',
      }),
      { onConflict: 'org_id' }
    );
  });

  it('CREATES the row when the org has no billing_state row (Finding A regression)', async () => {
    // current.data === null → the org has never had an org_billing_state row.
    // The old code did `.update().eq('org_id')`, which affects 0 rows and
    // returns error=null → reported success, wrote nothing. Upsert must create.
    const { client, upsertSpy } = makeSupabase({
      plan: { data: { id: 'plan-growth' }, error: null },
      current: { data: null },
    });

    const result = await applyCheckoutCompletion(client, session());

    expect(result).toEqual({
      updated: true,
      orgId: 'org-1',
      planSlug: 'growth',
    });
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ org_id: 'org-1', plan_id: 'plan-growth' }),
      { onConflict: 'org_id' }
    );
  });

  it('is idempotent — no write when already on this plan + subscription', async () => {
    const { client, upsertSpy } = makeSupabase({
      plan: { data: { id: 'plan-growth' }, error: null },
      current: {
        data: { plan_id: 'plan-growth', stripe_subscription_id: 'sub_1' },
      },
    });

    const result = await applyCheckoutCompletion(client, session());

    expect(result).toMatchObject({ updated: false, reason: 'already_applied' });
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('no-ops on missing metadata (no plan/org lookup)', async () => {
    const { client, upsertSpy } = makeSupabase({});
    const result = await applyCheckoutCompletion(
      client,
      session({ metadata: {} })
    );
    expect(result).toEqual({ updated: false, reason: 'missing_metadata' });
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('returns plan_not_found when the slug does not resolve', async () => {
    const { client, upsertSpy } = makeSupabase({
      plan: { data: null, error: { message: 'no rows' } },
    });
    const result = await applyCheckoutCompletion(client, session());
    expect(result).toMatchObject({ updated: false, reason: 'plan_not_found' });
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it('returns update_failed when the org_billing_state upsert errors', async () => {
    const { client } = makeSupabase({
      plan: { data: { id: 'plan-growth' }, error: null },
      current: {
        data: { plan_id: 'plan-starter', stripe_subscription_id: null },
      },
      upsertError: { message: 'db down' },
    });
    const result = await applyCheckoutCompletion(client, session());
    expect(result).toMatchObject({ updated: false, reason: 'update_failed' });
  });
});
