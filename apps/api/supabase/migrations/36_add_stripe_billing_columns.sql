/**
 * Migration 36: Add Stripe Billing Columns (Sprint S30)
 *
 * Adds Stripe-specific columns to org_billing_state for subscription management:
 * - stripe_customer_id: Links org to Stripe Customer object
 * - stripe_subscription_id: Links org to active Stripe Subscription
 * - subscription_status: Tracks Stripe subscription status
 * - trial_ends_at: When trial period expires
 * - cancel_at_period_end: Whether subscription will cancel at end of billing period
 *
 * These columns enable full Stripe integration without modifying S28's core billing schema.
 */

-- Add Stripe billing columns to org_billing_state
ALTER TABLE org_billing_state
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'incomplete',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;

-- Add indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_org_billing_state_stripe_customer
  ON org_billing_state(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_org_billing_state_stripe_subscription
  ON org_billing_state(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_org_billing_state_subscription_status
  ON org_billing_state(subscription_status);

-- Add comments for documentation
COMMENT ON COLUMN org_billing_state.stripe_customer_id IS
  'S30: Stripe Customer ID (cus_xxx) for this organization';

COMMENT ON COLUMN org_billing_state.stripe_subscription_id IS
  'S30: Active Stripe Subscription ID (sub_xxx) for this organization';

COMMENT ON COLUMN org_billing_state.subscription_status IS
  'S30: Stripe subscription status - trialing|active|past_due|canceled|incomplete|unpaid';

COMMENT ON COLUMN org_billing_state.trial_ends_at IS
  'S30: When the trial period ends (if in trial)';

COMMENT ON COLUMN org_billing_state.cancel_at_period_end IS
  'S30: Whether subscription will cancel at end of current billing period';

-- RLS: No changes needed - existing policies apply to new columns
-- The org_billing_state table already has appropriate RLS policies from migration 35

-- Note: No seed data - Stripe IDs are created dynamically when orgs upgrade
