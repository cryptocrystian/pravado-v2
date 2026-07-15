-- PR-A (#76) — reconcile billing_plans to canonical pricing.
--
-- Executes the "Plans Reconciliation work order" queued in e929dc2 (2026-04-25)
-- but never run. The billing_plans price rows were seeded by migration 35
-- (5698a96, 2025-12-04, RC1) at PLACEHOLDER values ($29/$99/$299, no `pro`) that
-- never matched the researched pricing.
--
-- Canonical prices (source-of-truth): Starter $199 / Pro $599 / Growth $1,199 /
-- Enterprise Custom. Cited: DECISIONS_LOG.md:334 + bootstrapStripeBilling.ts
-- (19900 / 59900 / 119900). Amounts mirror bootstrapStripeBilling.ts exactly.
--
-- Clean window: zero customers / zero live subscriptions at time of writing, so
-- no existing subscriber is repriced by this change.

-- Starter: $29 (2900, placeholder) → $199 (19900). bootstrapStripeBilling.ts:26.
UPDATE public.billing_plans
   SET monthly_price_cents = 19900, updated_at = now()
 WHERE slug = 'starter';

-- Growth: $99 (9900, placeholder) → $1,199 (119900). bootstrapStripeBilling.ts:56.
UPDATE public.billing_plans
   SET monthly_price_cents = 119900, updated_at = now()
 WHERE slug = 'growth';

-- Enterprise: Custom / sales-led. Keep the row for entitlement limits, but it is
-- NOT a self-serve tier — clear the placeholder $299 (29900) to 0 (custom sentinel).
-- No Stripe self-serve price ID is configured for enterprise.
UPDATE public.billing_plans
   SET monthly_price_cents = 0, updated_at = now()
 WHERE slug = 'enterprise';

-- Pro: ADD the missing row ($599 = 59900). bootstrapStripeBilling.ts:40.
--   Price is canonical. Entitlement quota columns: `included_seats` (15) and
--   `included_tokens_monthly` (5,000,000) mirror code PLAN_LIMITS.pro; the
--   remaining quota columns (playbook runs, overage rates) are INTERPOLATED
--   between the starter and growth rows and should be confirmed by the quota half
--   of the reconciliation (the non-price dimensions e929dc2 also flagged).
INSERT INTO public.billing_plans (
  slug, name, description, monthly_price_cents,
  included_tokens_monthly, included_playbook_runs_monthly, included_seats,
  overage_token_price_milli_cents, overage_playbook_run_price_cents, is_active
) VALUES (
  'pro', 'Pro',
  'For professional teams with full SAGE + CiteMind + CRAFT',
  59900,
  5000000,   -- PLAN_LIMITS.pro.llmTokensPerMonth
  999999,    -- "Unlimited CRAFT" (bootstrap features) — interpolated, confirm
  15,        -- PLAN_LIMITS.pro.seats
  13,        -- interpolated between starter(15) and growth(12), confirm
  450,       -- interpolated between starter(500) and growth(400), confirm
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name                   = EXCLUDED.name,
  description            = EXCLUDED.description,
  monthly_price_cents    = EXCLUDED.monthly_price_cents,
  included_tokens_monthly = EXCLUDED.included_tokens_monthly,
  included_seats         = EXCLUDED.included_seats,
  is_active              = true,
  updated_at             = now();
