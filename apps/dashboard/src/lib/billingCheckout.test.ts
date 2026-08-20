/**
 * F35 — startCheckout unit tests.
 *
 * Verifies the checkout call hits the correct proxy with `{ planSlug }`, reads
 * `data.data.url`, and on any failure captures to Sentry (tagged
 * phase=billing_checkout, tier) before rethrowing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const captureException = vi.hoisted(() => vi.fn());
vi.mock('@sentry/nextjs', () => ({ captureException }));

import { startCheckout } from './billingCheckout';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('startCheckout', () => {
  it('posts { planSlug } to the create-checkout proxy and returns data.data.url', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { url: 'https://checkout.stripe.com/c/pay/cs_test_1' },
      }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    const url = await startCheckout('scale');

    expect(url).toBe('https://checkout.stripe.com/c/pay/cs_test_1');
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/billing/org/create-checkout',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ planSlug: 'scale' }),
      })
    );
    expect(captureException).not.toHaveBeenCalled();
  });

  it('captures to Sentry (tagged) and rethrows on network failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );

    await expect(startCheckout('scale')).rejects.toThrow('network down');
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { phase: 'billing_checkout', tier: 'scale' },
    });
  });

  it('captures + throws the backend error message on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { message: "Plan 'pro' not found" },
        }),
      }))
    );

    await expect(startCheckout('pro')).rejects.toThrow("Plan 'pro' not found");
    expect(captureException).toHaveBeenCalledWith(expect.any(Error), {
      tags: { phase: 'billing_checkout', tier: 'pro' },
    });
  });
});
