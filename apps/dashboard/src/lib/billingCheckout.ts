import * as Sentry from '@sentry/nextjs';

/**
 * F35 — start a Stripe Checkout for the given plan slug.
 *
 * Calls the dashboard proxy `/api/billing/org/create-checkout` (which forwards
 * to the backend and returns `{ success, data: { url } }`) and returns the
 * Stripe Checkout URL. On any failure the error is captured to Sentry (tagged
 * for grep-ability) and rethrown so the caller can surface an error state.
 *
 * The previous page wiring hit `/api/billing/checkout` (which does not exist),
 * sent `{ plan }` instead of `{ planSlug }`, read `data.url` instead of
 * `data.data.url`, and swallowed all errors — so the button was effectively dead.
 */
export async function startCheckout(planSlug: string): Promise<string> {
  try {
    const res = await fetch('/api/billing/org/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planSlug }),
    });

    const json = await res.json().catch(() => null);
    const url: string | undefined = json?.data?.url;

    if (!res.ok || !json?.success || !url) {
      throw new Error(
        json?.error?.message ?? `Checkout failed (HTTP ${res.status})`
      );
    }

    return url;
  } catch (err) {
    Sentry.captureException(err, {
      tags: { phase: 'billing_checkout', tier: planSlug },
    });
    throw err;
  }
}
