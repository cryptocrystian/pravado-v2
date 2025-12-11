/**
 * Sprint S34: Billing History & Invoice Viewer
 * Migration 39: Create org_invoice_cache table
 *
 * Purpose: Cache Stripe invoice metadata for fast retrieval
 * Dependencies: Migration 28 (org_billing table)
 */

-- Create org_invoice_cache table
CREATE TABLE IF NOT EXISTS org_invoice_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Stripe invoice identifiers
  stripe_invoice_id text NOT NULL UNIQUE,
  invoice_number text,

  -- Financial amounts (in cents)
  amount_due integer NOT NULL DEFAULT 0,
  amount_paid integer NOT NULL DEFAULT 0,
  amount_remaining integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',

  -- Invoice status
  status text NOT NULL, -- draft, open, paid, uncollectible, void

  -- Stripe URLs
  hosted_invoice_url text,
  invoice_pdf text, -- Stripe PDF download URL

  -- Billing period
  period_start timestamptz NOT NULL,
  period_end timestamptz NOT NULL,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb, -- Store additional Stripe invoice data

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on org_id for fast org-scoped queries
CREATE INDEX IF NOT EXISTS idx_org_invoice_cache_org_id
  ON org_invoice_cache(org_id);

-- Create index on stripe_invoice_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_org_invoice_cache_stripe_id
  ON org_invoice_cache(stripe_invoice_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_org_invoice_cache_status
  ON org_invoice_cache(status);

-- Create index on period_start for chronological queries
CREATE INDEX IF NOT EXISTS idx_org_invoice_cache_period_start
  ON org_invoice_cache(period_start DESC);

-- Create composite index for org + period queries
CREATE INDEX IF NOT EXISTS idx_org_invoice_cache_org_period
  ON org_invoice_cache(org_id, period_start DESC);

-- Enable Row Level Security
ALTER TABLE org_invoice_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view invoices for their organization
CREATE POLICY org_invoice_cache_org_isolation
  ON org_invoice_cache
  FOR ALL
  USING (
    org_id IN (
      SELECT organization_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_org_invoice_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER org_invoice_cache_updated_at_trigger
  BEFORE UPDATE ON org_invoice_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_org_invoice_cache_updated_at();

-- Add comment for documentation
COMMENT ON TABLE org_invoice_cache IS
  'S34: Caches Stripe invoice metadata for fast billing history retrieval';

COMMENT ON COLUMN org_invoice_cache.stripe_invoice_id IS
  'Unique Stripe invoice ID (e.g., in_1ABC...)';

COMMENT ON COLUMN org_invoice_cache.status IS
  'Stripe invoice status: draft, open, paid, uncollectible, void';

COMMENT ON COLUMN org_invoice_cache.invoice_pdf IS
  'Stripe-hosted PDF download URL';

COMMENT ON COLUMN org_invoice_cache.metadata IS
  'Additional Stripe invoice data (line items, overages, etc.)';
