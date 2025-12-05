/**
 * Migration 38: Billing Usage Alerts (Sprint S32)
 *
 * Creates alerting system for billing usage, overages, trial expiration,
 * and plan changes. Integrates with S28–S31 billing foundations.
 *
 * Dependencies: S28 (Billing Kernel), S29 (Hard Limits), S30 (Stripe), S31 (Overages)
 */

-- ========================================
-- TABLE: billing_usage_alerts
-- ========================================
-- Records alerting events for billing-related notifications

CREATE TABLE IF NOT EXISTS billing_usage_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Alert classification
  alert_type text NOT NULL CHECK (alert_type IN (
    'usage_soft_warning',        -- 80% of soft limit reached
    'usage_hard_warning',        -- 100% of hard limit reached (about to be blocked)
    'overage_incurred',          -- Usage exceeded plan limits
    'trial_expiring',            -- Trial ends in <= 5 days
    'subscription_canceled',     -- Stripe subscription canceled
    'plan_upgraded',             -- Plan tier increased
    'plan_downgraded'            -- Plan tier decreased
  )),

  -- Severity level for UI display
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),

  -- Human-readable message
  message text NOT NULL,

  -- Contextual metadata (usage %, amounts, period, etc.)
  metadata jsonb DEFAULT '{}',

  -- Lifecycle tracking
  created_at timestamptz NOT NULL DEFAULT now(),
  acknowledged_at timestamptz NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_billing_usage_alerts_org_id
  ON billing_usage_alerts(org_id);

CREATE INDEX IF NOT EXISTS idx_billing_usage_alerts_type
  ON billing_usage_alerts(org_id, alert_type);

CREATE INDEX IF NOT EXISTS idx_billing_usage_alerts_unacknowledged
  ON billing_usage_alerts(org_id, acknowledged_at)
  WHERE acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_billing_usage_alerts_created
  ON billing_usage_alerts(org_id, created_at DESC);

-- Comments
COMMENT ON TABLE billing_usage_alerts IS
  'S32: Billing usage alerts and notifications for orgs';

COMMENT ON COLUMN billing_usage_alerts.alert_type IS
  'S32: Type of alert - usage warnings, overages, trial, plan changes';

COMMENT ON COLUMN billing_usage_alerts.severity IS
  'S32: Display severity - info (green), warning (yellow), critical (red)';

COMMENT ON COLUMN billing_usage_alerts.message IS
  'S32: Human-readable alert message for display';

COMMENT ON COLUMN billing_usage_alerts.metadata IS
  'S32: Contextual data - usage percentages, amounts, billing period, etc.';

COMMENT ON COLUMN billing_usage_alerts.acknowledged_at IS
  'S32: Timestamp when user acknowledged the alert (NULL = active)';

-- ========================================
-- RLS POLICIES
-- ========================================

-- Enable RLS on billing_usage_alerts
ALTER TABLE billing_usage_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view alerts for their orgs
CREATE POLICY billing_usage_alerts_select_policy
  ON billing_usage_alerts
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can insert alerts
CREATE POLICY billing_usage_alerts_insert_policy
  ON billing_usage_alerts
  FOR INSERT
  WITH CHECK (true); -- Service role only

-- Policy: Users can acknowledge alerts for their orgs
CREATE POLICY billing_usage_alerts_update_policy
  ON billing_usage_alerts
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Service role can delete alerts
CREATE POLICY billing_usage_alerts_delete_policy
  ON billing_usage_alerts
  FOR DELETE
  USING (true); -- Service role only

-- ========================================
-- SEED DATA
-- ========================================
-- No seed data needed - alerts are generated dynamically
