/**
 * Stripe price ID ↔ plan slug map (PR-A / #76 / #75).
 *
 * SINGLE SOURCE OF TRUTH for the slug↔Stripe-price-ID mapping. Backed by env
 * (STRIPE_PRICE_<TIER>) — deliberately NOT the DB: #77 / D025 has staging and
 * prod sharing one Supabase, so environment-specific Stripe price IDs must not
 * live in the shared `billing_plans` table. This replaces the dead
 * `billing_plans.stripe_price_id` read (the column never existed).
 *
 * Sellable self-serve tiers: starter, pro, growth. Enterprise is sales-led
 * (custom) — it may carry a price ID for negotiated self-serve, but usually
 * resolves undefined (no self-serve checkout).
 *
 * Canonical prices (for reference; the amounts live in Stripe, keyed by these
 * IDs): Starter $199 / Pro $599 / Growth $1,199 — DECISIONS_LOG.md:334 +
 * bootstrapStripeBilling.ts:26/40/56.
 */

/** The env fields this module reads (subset of the validated api env). */
export interface PriceIdEnv {
  STRIPE_PRICE_STARTER?: string;
  STRIPE_PRICE_PRO?: string;
  STRIPE_PRICE_GROWTH?: string;
  STRIPE_PRICE_ENTERPRISE?: string;
}

/**
 * Read the four price-ID env vars straight from `process.env`. Used on the hot
 * webhook path so we don't run the full `validateEnv(apiEnvSchema)` (which would
 * throw on any unrelated missing env) per Stripe event.
 */
export function priceIdEnvFromProcess(): PriceIdEnv {
  return {
    STRIPE_PRICE_STARTER: process.env.STRIPE_PRICE_STARTER,
    STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
    STRIPE_PRICE_GROWTH: process.env.STRIPE_PRICE_GROWTH,
    STRIPE_PRICE_ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
  };
}

/** Forward map: plan slug → Stripe price ID (undefined when not configured). */
export function buildPriceIdMap(
  env: PriceIdEnv
): Record<string, string | undefined> {
  return {
    starter: env.STRIPE_PRICE_STARTER,
    pro: env.STRIPE_PRICE_PRO, // PR-A: was missing → Pro checkout returned NO_PRICE_ID (#76)
    growth: env.STRIPE_PRICE_GROWTH,
    enterprise: env.STRIPE_PRICE_ENTERPRISE,
  };
}

/** Resolve a plan slug → its configured Stripe price ID (or undefined). */
export function priceIdForSlug(
  env: PriceIdEnv,
  slug: string
): string | undefined {
  return buildPriceIdMap(env)[slug];
}

/**
 * Reverse index: Stripe price ID → plan slug. Used by the subscription webhook
 * to reconcile `plan_id` from the live subscription's price on
 * created/updated/renewal (#75). Returns null when the price is not mapped —
 * the caller must fail loud, not silently fall back to a tier.
 */
export function slugForPriceId(
  env: PriceIdEnv,
  priceId: string | null | undefined
): string | null {
  if (!priceId) return null;
  const entries = Object.entries(buildPriceIdMap(env));
  const hit = entries.find(([, id]) => !!id && id === priceId);
  return hit ? hit[0] : null;
}
