/**
 * F36 — applyCheckoutCompletion unit tests.
 *
 * Covers the checkout.session.completed → org_billing_state plan update:
 * happy path (plan_id written), idempotency (no double-write on redelivery),
 * missing metadata, plan-not-found, and update failure.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { describe, it, expect, vi } from 'vitest';

import { applyCheckoutCompletion } from '../src/services/billing/applyCheckoutCompletion';

function makeSupabase(opts: {
  plan?: { data: unknown; error: unknown };
  current?: { data: unknown };
  updateError?: unknown;
}) {
  const updateSpy = vi.fn();
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
        update: (payload: unknown) => {
          updateSpy(payload);
          return { eq: async () => ({ error: opts.updateError ?? null }) };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, updateSpy };
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
  it('writes plan_id + stripe ids when the org is not already on the plan', async () => {
    const { client, updateSpy } = makeSupabase({
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
    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        plan_id: 'plan-growth',
        stripe_subscription_id: 'sub_1',
        stripe_customer_id: 'cus_1',
        subscription_status: 'active',
        billing_status: 'active',
      })
    );
  });

  it('is idempotent — no write when already on this plan + subscription', async () => {
    const { client, updateSpy } = makeSupabase({
      plan: { data: { id: 'plan-growth' }, error: null },
      current: {
        data: { plan_id: 'plan-growth', stripe_subscription_id: 'sub_1' },
      },
    });

    const result = await applyCheckoutCompletion(client, session());

    expect(result).toMatchObject({ updated: false, reason: 'already_applied' });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('no-ops on missing metadata (no plan/org lookup)', async () => {
    const { client, updateSpy } = makeSupabase({});
    const result = await applyCheckoutCompletion(
      client,
      session({ metadata: {} })
    );
    expect(result).toEqual({ updated: false, reason: 'missing_metadata' });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('returns plan_not_found when the slug does not resolve', async () => {
    const { client, updateSpy } = makeSupabase({
      plan: { data: null, error: { message: 'no rows' } },
    });
    const result = await applyCheckoutCompletion(client, session());
    expect(result).toMatchObject({ updated: false, reason: 'plan_not_found' });
    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('returns update_failed when the org_billing_state write errors', async () => {
    const { client } = makeSupabase({
      plan: { data: { id: 'plan-growth' }, error: null },
      current: {
        data: { plan_id: 'plan-starter', stripe_subscription_id: null },
      },
      updateError: { message: 'db down' },
    });
    const result = await applyCheckoutCompletion(client, session());
    expect(result).toMatchObject({ updated: false, reason: 'update_failed' });
  });
});
