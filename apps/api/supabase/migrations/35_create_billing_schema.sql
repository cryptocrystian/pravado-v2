/**
 * Migration 35: Create Billing Schema (Sprint S28)
 * Billing & Quota Kernel V1 - Internal billing primitives and usage tracking
 */

-- =====================================================
-- 1. billing_plans Table
-- =====================================================
-- Catalog of available billing plans (SaaS plan catalog)

CREATE TABLE IF NOT EXISTS public.billing_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  included_tokens_monthly BIGINT NOT NULL DEFAULT 0,
  included_playbook_runs_monthly INTEGER NOT NULL DEFAULT 0,
  included_seats INTEGER NOT NULL DEFAULT 0,
  overage_token_price_milli_cents INTEGER NOT NULL DEFAULT 0,
  overage_playbook_run_price_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for active plans lookup
CREATE INDEX IF NOT EXISTS idx_billing_plans_active
  ON public.billing_plans(is_active, slug)
  WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active plans (global catalog)
CREATE POLICY billing_plans_select_policy
  ON public.billing_plans FOR SELECT
  TO authenticated
  USING (is_active = true);

-- =====================================================
-- 2. org_billing_state Table
-- =====================================================
-- Per-org billing status and soft limits

CREATE TABLE IF NOT EXISTS public.org_billing_state (
  org_id UUID PRIMARY KEY REFERENCES public.orgs(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.billing_plans(id) ON DELETE SET NULL,
  billing_status TEXT NOT NULL DEFAULT 'trial'
    CHECK (billing_status IN ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  -- Soft limits (override plan defaults if set)
  soft_token_limit_monthly BIGINT,
  soft_playbook_run_limit_monthly INTEGER,
  soft_seat_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for status lookups
CREATE INDEX IF NOT EXISTS idx_org_billing_state_status
  ON public.org_billing_state(billing_status);

-- Enable RLS
ALTER TABLE public.org_billing_state ENABLE ROW LEVEL SECURITY;

-- Allow org members to read their org's billing state
CREATE POLICY org_billing_state_select_policy
  ON public.org_billing_state FOR SELECT
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- Allow org members to update their org's billing state
CREATE POLICY org_billing_state_update_policy
  ON public.org_billing_state FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- Allow system to insert (for initial seeding)
CREATE POLICY org_billing_state_insert_policy
  ON public.org_billing_state FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 3. org_billing_usage_monthly Table
-- =====================================================
-- Usage tracking per org per billing period

CREATE TABLE IF NOT EXISTS public.org_billing_usage_monthly (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  playbook_runs INTEGER NOT NULL DEFAULT 0,
  seats INTEGER NOT NULL DEFAULT 0,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (org_id, period_start, period_end)
);

-- Index for current period lookups
CREATE INDEX IF NOT EXISTS idx_org_billing_usage_monthly_org_period
  ON public.org_billing_usage_monthly(org_id, period_start DESC, period_end DESC);

-- Enable RLS
ALTER TABLE public.org_billing_usage_monthly ENABLE ROW LEVEL SECURITY;

-- Allow org members to read their org's usage
CREATE POLICY org_billing_usage_monthly_select_policy
  ON public.org_billing_usage_monthly FOR SELECT
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- Allow system to insert/update usage records
CREATE POLICY org_billing_usage_monthly_insert_policy
  ON public.org_billing_usage_monthly FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY org_billing_usage_monthly_update_policy
  ON public.org_billing_usage_monthly FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. Updated At Trigger
-- =====================================================

-- Reuse existing updated_at trigger function from migration 01
CREATE TRIGGER set_updated_at_billing_plans
  BEFORE UPDATE ON public.billing_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_org_billing_state
  BEFORE UPDATE ON public.org_billing_state
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- 5. Seed Default Plans
-- =====================================================

-- Insert default plans for internal use and SaaS tiers
INSERT INTO public.billing_plans (slug, name, description, monthly_price_cents, included_tokens_monthly, included_playbook_runs_monthly, included_seats, overage_token_price_milli_cents, overage_playbook_run_price_cents, is_active)
VALUES
  -- Internal dev plan (free, unlimited for internal testing)
  ('internal-dev', 'Internal Development', 'Unlimited plan for internal development and testing', 0, 999999999, 999999, 999, 0, 0, true),

  -- Starter tier
  ('starter', 'Starter', 'Perfect for individuals and small teams getting started', 2900, 1000000, 100, 3, 15, 500, true),

  -- Growth tier
  ('growth', 'Growth', 'For growing teams with higher usage needs', 9900, 5000000, 500, 10, 12, 400, true),

  -- Enterprise tier
  ('enterprise', 'Enterprise', 'Custom solutions for large organizations', 29900, 20000000, 2000, 50, 10, 300, true)
ON CONFLICT (slug) DO NOTHING;
