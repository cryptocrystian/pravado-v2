-- PR-C (#76) — billing_plans value reconciliation. SUPERSEDES migration 100.
--
-- Migration 100 (a0d4368) reconciled prices but carried interpolated Pro values
-- (seats 15, overage 13/450, runs 999999) that were wrong per the ratified
-- contract. Neither 100 nor this file has been applied to the DB yet; this file
-- is self-contained and produces the correct FINAL state regardless of whether
-- 100 ran first. Architect applies on merge (D028).
--
-- Ratified tier order: Starter < Pro < Growth < Enterprise (D030). All quota
-- columns are monotonic by tier rank.
--
-- Value sources (nothing invented):
--   prices          — D029 / bootstrapStripeBilling.ts (19900/59900/119900)
--   seats 1/5/15    — live pricing page (architect-designated contract)
--   tokens          — code PLAN_LIMITS.llmTokensPerMonth (2.5M/5M/50M), which this
--                     DB row now MATCHES (billingService reads plan.includedTokensMonthly)
--   pro runs 250    — PROVISIONAL monotonic (100 < 250 < 500); no canon source →
--                     ticketed for the guardrail workstream. Flagged, not asserted.
--   overage         — DORMANT. Set to 0; ENABLE_OVERAGE_BILLING is set to false in
--                     the same PR (flags.ts) so the 0s are inert, not "free overage".
--                     Real overage rates have no canon → deferred with the flag.

-- ── Starter ($199) ──────────────────────────────────────────────────────────
UPDATE public.billing_plans SET
  monthly_price_cents              = 19900,
  included_tokens_monthly          = 2500000,   -- PLAN_LIMITS.starter.llmTokensPerMonth
  included_seats                   = 1,         -- live page
  included_playbook_runs_monthly   = 100,       -- unchanged (mig-35)
  overage_token_price_milli_cents  = 0,         -- dormant
  overage_playbook_run_price_cents = 0,         -- dormant
  is_active = true, updated_at = now()
WHERE slug = 'starter';

-- ── Pro ($599) — ADD the missing row ────────────────────────────────────────
INSERT INTO public.billing_plans (
  slug, name, description, monthly_price_cents,
  included_tokens_monthly, included_playbook_runs_monthly, included_seats,
  overage_token_price_milli_cents, overage_playbook_run_price_cents, is_active
) VALUES (
  'pro', 'Pro',
  'For professional teams with full SAGE + CiteMind + CRAFT',
  59900,
  5000000,   -- PLAN_LIMITS.pro.llmTokensPerMonth
  250,       -- PROVISIONAL monotonic (100<250<500) — no canon; ticketed
  5,         -- live page
  0, 0,      -- overage dormant (flag off)
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  monthly_price_cents = EXCLUDED.monthly_price_cents,
  included_tokens_monthly = EXCLUDED.included_tokens_monthly,
  included_playbook_runs_monthly = EXCLUDED.included_playbook_runs_monthly,
  included_seats = EXCLUDED.included_seats,
  overage_token_price_milli_cents = EXCLUDED.overage_token_price_milli_cents,
  overage_playbook_run_price_cents = EXCLUDED.overage_playbook_run_price_cents,
  is_active = true, updated_at = now();

-- ── Growth ($1,199) ─────────────────────────────────────────────────────────
UPDATE public.billing_plans SET
  monthly_price_cents              = 119900,
  included_tokens_monthly          = 50000000,  -- PLAN_LIMITS.growth.llmTokensPerMonth
  included_seats                   = 15,        -- live page
  included_playbook_runs_monthly   = 500,       -- unchanged (mig-35)
  overage_token_price_milli_cents  = 0,         -- dormant
  overage_playbook_run_price_cents = 0,         -- dormant
  is_active = true, updated_at = now()
WHERE slug = 'growth';

-- ── Enterprise (Custom / sales-led) ─────────────────────────────────────────
-- Keep the row for entitlement limits; no self-serve price. Tokens set to a
-- custom/unlimited sentinel to preserve monotonicity (>= Growth 50M). Seats stay
-- at the mig-35 custom baseline (50).
UPDATE public.billing_plans SET
  monthly_price_cents              = 0,          -- Custom, not self-serve (not 29900)
  included_tokens_monthly          = 999999999,  -- custom/unlimited (monotonic >= growth)
  overage_token_price_milli_cents  = 0,          -- dormant
  overage_playbook_run_price_cents = 0,          -- dormant
  is_active = true, updated_at = now()
WHERE slug = 'enterprise';
