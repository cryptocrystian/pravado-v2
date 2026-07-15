/**
 * Finding B + C — subscription webhook processing under Stripe API
 * 2025-11-17.clover.
 *
 * B: current_period_start/end were removed from the Subscription root and live
 *    on items.data[]. handleSubscriptionChange must read them from the first
 *    item (falling back to the legacy root for older API versions) and throw a
 *    clear error when neither is present — instead of new Date(undefined*1000)
 *    → RangeError.
 * C: the processWebhookEvent catch must log errorName/errorMessage (a thrown
 *    Error previously serialized to `{}`, masking B for a full release).
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// stripeService.ts loads the pino logger at import time (transport crashes
// under vitest). Stub it with spyable methods so we can assert on error logs.
const h = vi.hoisted(() => {
  const l = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: () => l,
  };
  return { l };
});
vi.mock('../src/lib/logger', () => ({
  createLogger: () => h.l,
  serviceLogger: h.l,
  fastifyLoggerOptions: {},
}));

import { StripeService } from '../src/services/stripeService';

function makeSupabase() {
  const upsertSpy = vi.fn();
  const client = {
    from: () => ({
      upsert: (payload: unknown, options: unknown) => {
        upsertSpy(payload, options);
        return Promise.resolve({ error: null });
      },
    }),
  } as unknown as SupabaseClient;
  return { client, upsertSpy };
}

// 2026-07-08T00:00:00Z and +30d, in epoch seconds.
const PERIOD_START = 1751932800;
const PERIOD_END = 1754524800;

function subscriptionEvent(object: Record<string, unknown>): Stripe.Event {
  return {
    id: 'evt_sub_1',
    type: 'customer.subscription.created',
    data: { object },
  } as unknown as Stripe.Event;
}

const baseSub = {
  id: 'sub_1',
  status: 'active',
  metadata: { orgId: 'org-1' },
  cancel_at_period_end: false,
};

describe('handleSubscriptionChange — clover period fields (Finding B)', () => {
  it('reads current_period_start/end from items.data[0]', async () => {
    const { client, upsertSpy } = makeSupabase();
    const svc = new StripeService(client, 'sk_test_fake', 'whsec_x');

    await svc.processWebhookEvent(
      subscriptionEvent({
        ...baseSub,
        items: {
          data: [
            {
              id: 'si_1',
              current_period_start: PERIOD_START,
              current_period_end: PERIOD_END,
            },
          ],
        },
      })
    );

    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: 'org-1',
        stripe_subscription_id: 'sub_1',
        subscription_status: 'active',
        billing_status: 'active',
        current_period_start: new Date(PERIOD_START * 1000).toISOString(),
        current_period_end: new Date(PERIOD_END * 1000).toISOString(),
      }),
      { onConflict: 'org_id' }
    );
    expect(h.l.error).not.toHaveBeenCalled();
  });

  it('falls back to legacy root period fields for older API versions', async () => {
    const { client, upsertSpy } = makeSupabase();
    const svc = new StripeService(client, 'sk_test_fake', 'whsec_x');

    await svc.processWebhookEvent(
      subscriptionEvent({
        ...baseSub,
        current_period_start: PERIOD_START,
        current_period_end: PERIOD_END,
        items: { data: [{ id: 'si_1' }] }, // no period fields on the item
      })
    );

    expect(upsertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        current_period_start: new Date(PERIOD_START * 1000).toISOString(),
      }),
      { onConflict: 'org_id' }
    );
  });

  it('throws a clear error (not a RangeError) when no period is present, and the catch logs it (Finding B safety + C)', async () => {
    const { client, upsertSpy } = makeSupabase();
    const svc = new StripeService(client, 'sk_test_fake', 'whsec_x');

    // Empty items, no legacy root fields → periods undefined.
    await svc.processWebhookEvent(
      subscriptionEvent({ ...baseSub, items: { data: [] } })
    );

    // Did not write, did not blow up the caller (catch swallows).
    expect(upsertSpy).not.toHaveBeenCalled();

    // Finding C: the error is logged with a real name + message, not `{}`.
    expect(h.l.error).toHaveBeenCalledWith(
      'Failed to process webhook event',
      expect.objectContaining({
        phase: 'stripe_webhook_processing_error',
        eventType: 'customer.subscription.created',
        eventId: 'evt_sub_1',
        errorName: 'Error',
        errorMessage: expect.stringContaining(
          'missing current_period_start/end'
        ),
      })
    );
  });
});

describe('handleSubscriptionChange — plan_id reconciliation (PR-A / #75)', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // h.l is shared/hoisted — reset before asserting on it
    process.env.STRIPE_PRICE_STARTER = 'price_starter';
    process.env.STRIPE_PRICE_PRO = 'price_pro';
    process.env.STRIPE_PRICE_GROWTH = 'price_growth';
  });
  afterEach(() => {
    delete process.env.STRIPE_PRICE_STARTER;
    delete process.env.STRIPE_PRICE_PRO;
    delete process.env.STRIPE_PRICE_GROWTH;
    vi.clearAllMocks();
  });

  // Mock that serves billing_plans (slug → id) AND captures the upsert.
  function makeSupabaseWithPlans(planIdBySlug: Record<string, string>) {
    const upsertSpy = vi.fn();
    const client = {
      from: (table: string) => {
        if (table === 'billing_plans') {
          return {
            select: () => ({
              eq: (_col: string, slug: string) => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: planIdBySlug[slug]
                      ? { id: planIdBySlug[slug] }
                      : null,
                  }),
                }),
              }),
            }),
          };
        }
        return {
          upsert: (payload: unknown, options: unknown) => {
            upsertSpy(payload, options);
            return Promise.resolve({ error: null });
          },
        };
      },
    } as unknown as SupabaseClient;
    return { client, upsertSpy };
  }

  const liveSub = (priceId: string) =>
    subscriptionEvent({
      ...baseSub,
      items: {
        data: [
          {
            id: 'si_1',
            current_period_start: PERIOD_START,
            current_period_end: PERIOD_END,
            price: { id: priceId },
          },
        ],
      },
    });

  it.each([
    ['price_starter', 'plan-starter'],
    ['price_pro', 'plan-pro'],
    ['price_growth', 'plan-growth'],
  ])(
    'writes plan_id resolved from the live price (%s) — starter/pro/growth',
    async (priceId, planId) => {
      const { client, upsertSpy } = makeSupabaseWithPlans({
        starter: 'plan-starter',
        pro: 'plan-pro',
        growth: 'plan-growth',
      });
      const svc = new StripeService(client, 'sk_test_fake', 'whsec_x');
      await svc.processWebhookEvent(liveSub(priceId));

      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({ org_id: 'org-1', plan_id: planId }),
        { onConflict: 'org_id' }
      );
      expect(h.l.error).not.toHaveBeenCalled();
    }
  );

  it('fails loud + OMITS plan_id when a live sub price is unmapped (no silent under-entitle)', async () => {
    const { client, upsertSpy } = makeSupabaseWithPlans({});
    const svc = new StripeService(client, 'sk_test_fake', 'whsec_x');
    await svc.processWebhookEvent(liveSub('price_unknown'));

    const payload = upsertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('plan_id'); // preserves existing value
    expect(h.l.error).toHaveBeenCalledWith(
      'Subscription plan_id unresolved from price',
      expect.objectContaining({ reason: 'price_unmapped' })
    );
  });
});
