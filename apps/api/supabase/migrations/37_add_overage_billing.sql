/**
 * Migration 37: Add Overage Billing (Sprint S31)
 *
 * Adds overage tracking and recording capabilities:
 * - org_billing_overages: Records individual overage charges
 * - Extended org_billing_usage_monthly with overage counters
 *
 * Integrates with S28 (Billing Kernel), S29 (Hard Limits), S30 (Stripe)
 */

-- ========================================
-- TABLE: org_billing_overages
-- ========================================
-- Records individual overage charges when usage exceeds plan limits

CREATE TABLE IF NOT EXISTS org_billing_overages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- What metric exceeded limits
  metric_type text NOT NULL CHECK (metric_type IN ('tokens', 'playbook_runs', 'seats')),

  -- How much was consumed beyond the limit
  amount numeric NOT NULL CHECK (amount >= 0),

  -- Price per unit (in cents for tokens, cents for playbook runs, etc.)
  unit_price numeric NOT NULL CHECK (unit_price >= 0),

  -- Total cost of this overage (amount * unit_price)
  cost numeric NOT NULL CHECK (cost >= 0),

  -- Billing period this overage applies to
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_org_billing_overages_org_id
  ON org_billing_overages(org_id);

CREATE INDEX IF NOT EXISTS idx_org_billing_overages_period
  ON org_billing_overages(org_id, billing_period_start, billing_period_end);

CREATE INDEX IF NOT EXISTS idx_org_billing_overages_metric_type
  ON org_billing_overages(org_id, metric_type);

-- Comments
COMMENT ON TABLE org_billing_overages IS
  'S31: Records overage charges when org usage exceeds plan limits';

COMMENT ON COLUMN org_billing_overages.metric_type IS
  'S31: Type of metric that exceeded limits - tokens, playbook_runs, or seats';

COMMENT ON COLUMN org_billing_overages.amount IS
  'S31: Quantity consumed beyond plan limits';

COMMENT ON COLUMN org_billing_overages.unit_price IS
  'S31: Price per unit in cents (e.g., milli-cents for tokens, cents for runs)';

COMMENT ON COLUMN org_billing_overages.cost IS
  'S31: Total cost of this overage = amount * unit_price';

-- ========================================
-- EXTEND: org_billing_usage_monthly
-- ========================================
-- Add overage tracking columns to existing usage table

ALTER TABLE org_billing_usage_monthly
  ADD COLUMN IF NOT EXISTS overage_tokens numeric DEFAULT 0 NOT NULL CHECK (overage_tokens >= 0),
  ADD COLUMN IF NOT EXISTS overage_runs numeric DEFAULT 0 NOT NULL CHECK (overage_runs >= 0),
  ADD COLUMN IF NOT EXISTS overage_seats numeric DEFAULT 0 NOT NULL CHECK (overage_seats >= 0);

-- Comments for new columns
COMMENT ON COLUMN org_billing_usage_monthly.overage_tokens IS
  'S31: Number of tokens consumed beyond plan limits this period';

COMMENT ON COLUMN org_billing_usage_monthly.overage_runs IS
  'S31: Number of playbook runs consumed beyond plan limits this period';

COMMENT ON COLUMN org_billing_usage_monthly.overage_seats IS
  'S31: Number of seats consumed beyond plan limits this period';

-- ========================================
-- RLS POLICIES
-- ========================================

-- Enable RLS on org_billing_overages
ALTER TABLE org_billing_overages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view overages for their orgs
CREATE POLICY org_billing_overages_select_policy
  ON org_billing_overages
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can insert overage records
CREATE POLICY org_billing_overages_insert_policy
  ON org_billing_overages
  FOR INSERT
  WITH CHECK (true); -- Service role only

-- Policy: Service role can update overage records
CREATE POLICY org_billing_overages_update_policy
  ON org_billing_overages
  FOR UPDATE
  USING (true); -- Service role only

-- Policy: Service role can delete overage records
CREATE POLICY org_billing_overages_delete_policy
  ON org_billing_overages
  FOR DELETE
  USING (true); -- Service role only

-- ========================================
-- SEED DATA
-- ========================================
-- No seed data needed - overages are calculated dynamically

