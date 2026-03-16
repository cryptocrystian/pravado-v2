-- Migration 86: Beta Requests (Sprint S-INT-09)
-- Stores beta access requests and invite codes for gated signup.

-- ============================================================================
-- beta_requests table
-- ============================================================================

CREATE TABLE IF NOT EXISTS beta_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  company_name TEXT,
  company_size TEXT,          -- 'solo' | '2-10' | '11-50' | '51-200' | '200+'
  use_case TEXT,              -- What they want to use Pravado for
  referral_source TEXT,       -- How they heard about Pravado
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'invited')),
  invite_code TEXT UNIQUE,    -- Generated on approval, used to gate signup
  invited_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ,   -- Set when user completes signup with this invite
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_beta_requests_email ON beta_requests (email);
CREATE INDEX IF NOT EXISTS idx_beta_requests_status ON beta_requests (status);
CREATE INDEX IF NOT EXISTS idx_beta_requests_invite_code ON beta_requests (invite_code);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_beta_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_beta_requests_updated_at
  BEFORE UPDATE ON beta_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_beta_requests_updated_at();

-- No RLS on beta_requests — admin-only table accessed via service role key.
-- Public POST endpoint validates manually. Admin endpoints use requireAdmin.
