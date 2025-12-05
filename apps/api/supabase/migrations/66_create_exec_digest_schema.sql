-- Migration 66: Executive Digest Schema (Sprint S62)
-- Automated Strategic Briefs & Exec Weekly Digest Generator V1
--
-- Creates tables for:
-- - exec_digests: Main digest configurations
-- - exec_digest_sections: LLM-generated sections
-- - exec_digest_recipients: Email recipients
-- - exec_digest_delivery_log: Delivery tracking
-- - exec_digest_audit_log: Audit trail

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Delivery period for digests
CREATE TYPE exec_digest_delivery_period AS ENUM (
  'weekly',
  'monthly'
);

-- Time window for digest data
CREATE TYPE exec_digest_time_window AS ENUM (
  '7d',
  '30d'
);

-- Section types in a digest
CREATE TYPE exec_digest_section_type AS ENUM (
  'executive_summary',
  'key_kpis',
  'key_insights',
  'risk_summary',
  'reputation_summary',
  'competitive_summary',
  'media_performance',
  'crisis_status',
  'governance_highlights',
  'action_recommendations',
  'custom'
);

-- Delivery status
CREATE TYPE exec_digest_delivery_status AS ENUM (
  'pending',
  'sending',
  'success',
  'partial_success',
  'error'
);

-- Audit action types
CREATE TYPE exec_digest_action_type AS ENUM (
  'created',
  'updated',
  'deleted',
  'generated',
  'delivered',
  'recipient_added',
  'recipient_removed',
  'sections_reordered',
  'pdf_generated',
  'scheduled'
);

-- ============================================================================
-- MAIN TABLES
-- ============================================================================

-- exec_digests: Main digest configurations
CREATE TABLE IF NOT EXISTS exec_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Basic info
  title TEXT NOT NULL DEFAULT 'Executive Weekly Digest',
  description TEXT,

  -- Scheduling
  delivery_period exec_digest_delivery_period NOT NULL DEFAULT 'weekly',
  time_window exec_digest_time_window NOT NULL DEFAULT '7d',
  schedule_day_of_week INTEGER DEFAULT 1, -- 0=Sunday, 1=Monday, etc.
  schedule_hour INTEGER DEFAULT 8, -- Hour of day (0-23)
  schedule_timezone TEXT DEFAULT 'UTC',
  next_delivery_at TIMESTAMPTZ,
  last_delivered_at TIMESTAMPTZ,

  -- Configuration
  include_recommendations BOOLEAN NOT NULL DEFAULT true,
  include_kpis BOOLEAN NOT NULL DEFAULT true,
  include_insights BOOLEAN NOT NULL DEFAULT true,
  include_risk_summary BOOLEAN NOT NULL DEFAULT true,
  include_reputation_summary BOOLEAN NOT NULL DEFAULT true,
  include_competitive_summary BOOLEAN NOT NULL DEFAULT true,
  include_media_performance BOOLEAN NOT NULL DEFAULT true,
  include_crisis_status BOOLEAN NOT NULL DEFAULT true,
  include_governance BOOLEAN NOT NULL DEFAULT true,

  -- Data snapshot (last generated)
  summary JSONB DEFAULT '{}'::jsonb,
  kpi_snapshot JSONB DEFAULT '[]'::jsonb,
  insights_snapshot JSONB DEFAULT '[]'::jsonb,

  -- PDF storage
  pdf_storage_path TEXT,
  pdf_generated_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,

  -- Ownership
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- exec_digest_sections: LLM-generated sections
CREATE TABLE IF NOT EXISTS exec_digest_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  digest_id UUID NOT NULL REFERENCES exec_digests(id) ON DELETE CASCADE,

  -- Section details
  section_type exec_digest_section_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,

  -- LLM metadata
  model_name TEXT,
  tokens_used INTEGER,
  generation_duration_ms INTEGER,

  -- Configuration
  is_visible BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  meta JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- exec_digest_recipients: Email recipients
CREATE TABLE IF NOT EXISTS exec_digest_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  digest_id UUID NOT NULL REFERENCES exec_digests(id) ON DELETE CASCADE,

  -- Recipient info
  email TEXT NOT NULL,
  name TEXT,
  role TEXT, -- e.g., 'CEO', 'CMO', 'VP Marketing'

  -- Validation
  is_validated BOOLEAN NOT NULL DEFAULT false,
  validated_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Delivery preferences
  include_pdf BOOLEAN NOT NULL DEFAULT true,
  include_inline_summary BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  meta JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Unique constraint
  CONSTRAINT exec_digest_recipients_unique_email UNIQUE (digest_id, email)
);

-- exec_digest_delivery_log: Delivery tracking
CREATE TABLE IF NOT EXISTS exec_digest_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  digest_id UUID NOT NULL REFERENCES exec_digests(id) ON DELETE CASCADE,

  -- Delivery details
  delivery_period exec_digest_delivery_period NOT NULL,
  time_window exec_digest_time_window NOT NULL,

  -- Timing
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Status
  status exec_digest_delivery_status NOT NULL DEFAULT 'pending',
  error_message TEXT,

  -- Statistics
  recipients_count INTEGER NOT NULL DEFAULT 0,
  successful_deliveries INTEGER NOT NULL DEFAULT 0,
  failed_deliveries INTEGER NOT NULL DEFAULT 0,

  -- PDF info
  pdf_storage_path TEXT,
  pdf_size_bytes INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  recipient_results JSONB DEFAULT '[]'::jsonb, -- Per-recipient delivery status

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- exec_digest_audit_log: Audit trail
CREATE TABLE IF NOT EXISTS exec_digest_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  digest_id UUID REFERENCES exec_digests(id) ON DELETE SET NULL,

  -- Action details
  action_type exec_digest_action_type NOT NULL,
  description TEXT NOT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- exec_digests indexes
CREATE INDEX idx_exec_digests_org_id ON exec_digests(org_id);
CREATE INDEX idx_exec_digests_org_active ON exec_digests(org_id, is_active) WHERE NOT is_archived;
CREATE INDEX idx_exec_digests_next_delivery ON exec_digests(next_delivery_at) WHERE is_active AND NOT is_archived;
CREATE INDEX idx_exec_digests_delivery_period ON exec_digests(org_id, delivery_period);

-- exec_digest_sections indexes
CREATE INDEX idx_exec_digest_sections_org_id ON exec_digest_sections(org_id);
CREATE INDEX idx_exec_digest_sections_digest_id ON exec_digest_sections(digest_id);
CREATE INDEX idx_exec_digest_sections_order ON exec_digest_sections(digest_id, sort_order);
CREATE INDEX idx_exec_digest_sections_type ON exec_digest_sections(digest_id, section_type);

-- exec_digest_recipients indexes
CREATE INDEX idx_exec_digest_recipients_org_id ON exec_digest_recipients(org_id);
CREATE INDEX idx_exec_digest_recipients_digest_id ON exec_digest_recipients(digest_id);
CREATE INDEX idx_exec_digest_recipients_active ON exec_digest_recipients(digest_id, is_active);
CREATE INDEX idx_exec_digest_recipients_email ON exec_digest_recipients(email);

-- exec_digest_delivery_log indexes
CREATE INDEX idx_exec_digest_delivery_log_org_id ON exec_digest_delivery_log(org_id);
CREATE INDEX idx_exec_digest_delivery_log_digest_id ON exec_digest_delivery_log(digest_id);
CREATE INDEX idx_exec_digest_delivery_log_status ON exec_digest_delivery_log(status);
CREATE INDEX idx_exec_digest_delivery_log_created ON exec_digest_delivery_log(org_id, created_at DESC);

-- exec_digest_audit_log indexes
CREATE INDEX idx_exec_digest_audit_log_org_id ON exec_digest_audit_log(org_id);
CREATE INDEX idx_exec_digest_audit_log_digest_id ON exec_digest_audit_log(digest_id);
CREATE INDEX idx_exec_digest_audit_log_user_id ON exec_digest_audit_log(user_id);
CREATE INDEX idx_exec_digest_audit_log_action ON exec_digest_audit_log(org_id, action_type);
CREATE INDEX idx_exec_digest_audit_log_created ON exec_digest_audit_log(org_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE exec_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_digest_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_digest_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_digest_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE exec_digest_audit_log ENABLE ROW LEVEL SECURITY;

-- exec_digests policies
CREATE POLICY "Users can view their org's digests"
  ON exec_digests FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert digests for their org"
  ON exec_digests FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's digests"
  ON exec_digests FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their org's digests"
  ON exec_digests FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- exec_digest_sections policies
CREATE POLICY "Users can view their org's digest sections"
  ON exec_digest_sections FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert sections for their org"
  ON exec_digest_sections FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's sections"
  ON exec_digest_sections FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their org's sections"
  ON exec_digest_sections FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- exec_digest_recipients policies
CREATE POLICY "Users can view their org's recipients"
  ON exec_digest_recipients FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert recipients for their org"
  ON exec_digest_recipients FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's recipients"
  ON exec_digest_recipients FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their org's recipients"
  ON exec_digest_recipients FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- exec_digest_delivery_log policies
CREATE POLICY "Users can view their org's delivery logs"
  ON exec_digest_delivery_log FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert delivery logs for their org"
  ON exec_digest_delivery_log FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- exec_digest_audit_log policies
CREATE POLICY "Users can view their org's audit logs"
  ON exec_digest_audit_log FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert audit logs for their org"
  ON exec_digest_audit_log FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated at trigger for exec_digests
CREATE TRIGGER set_exec_digests_updated_at
  BEFORE UPDATE ON exec_digests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated at trigger for exec_digest_sections
CREATE TRIGGER set_exec_digest_sections_updated_at
  BEFORE UPDATE ON exec_digest_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated at trigger for exec_digest_recipients
CREATE TRIGGER set_exec_digest_recipients_updated_at
  BEFORE UPDATE ON exec_digest_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKET (for PDF storage)
-- ============================================================================

-- Note: The storage bucket should be created via Supabase Dashboard or API
-- Bucket name: 'exec-digests'
-- Public: false (private bucket)
-- File size limit: 10MB

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate next delivery time
CREATE OR REPLACE FUNCTION calculate_next_digest_delivery(
  p_delivery_period exec_digest_delivery_period,
  p_schedule_day INTEGER,
  p_schedule_hour INTEGER,
  p_timezone TEXT
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_next TIMESTAMPTZ;
  v_target_day INTEGER;
  v_days_until_target INTEGER;
BEGIN
  v_now := now() AT TIME ZONE p_timezone;

  IF p_delivery_period = 'weekly' THEN
    -- Calculate days until target day of week
    v_target_day := COALESCE(p_schedule_day, 1); -- Default Monday
    v_days_until_target := v_target_day - EXTRACT(DOW FROM v_now)::INTEGER;

    -- If target day is today but hour has passed, or target day is in the past, add 7 days
    IF v_days_until_target < 0 OR (v_days_until_target = 0 AND EXTRACT(HOUR FROM v_now) >= p_schedule_hour) THEN
      v_days_until_target := v_days_until_target + 7;
    END IF;

    v_next := (DATE(v_now) + v_days_until_target)::TIMESTAMPTZ + (p_schedule_hour || ' hours')::INTERVAL;

  ELSIF p_delivery_period = 'monthly' THEN
    -- First day of next month at scheduled hour
    v_next := date_trunc('month', v_now) + INTERVAL '1 month' + (p_schedule_hour || ' hours')::INTERVAL;

    -- If we're past the schedule time this month, use next month
    IF v_now >= (date_trunc('month', v_now) + (p_schedule_hour || ' hours')::INTERVAL) THEN
      v_next := date_trunc('month', v_now) + INTERVAL '1 month' + (p_schedule_hour || ' hours')::INTERVAL;
    ELSE
      v_next := date_trunc('month', v_now) + (p_schedule_hour || ' hours')::INTERVAL;
    END IF;
  END IF;

  RETURN v_next AT TIME ZONE p_timezone;
END;
$$ LANGUAGE plpgsql;

-- Function to get digest statistics
CREATE OR REPLACE FUNCTION get_exec_digest_stats(p_org_id UUID)
RETURNS TABLE (
  total_digests BIGINT,
  active_digests BIGINT,
  total_deliveries BIGINT,
  successful_deliveries BIGINT,
  total_recipients BIGINT,
  active_recipients BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM exec_digests WHERE org_id = p_org_id)::BIGINT AS total_digests,
    (SELECT COUNT(*) FROM exec_digests WHERE org_id = p_org_id AND is_active AND NOT is_archived)::BIGINT AS active_digests,
    (SELECT COUNT(*) FROM exec_digest_delivery_log WHERE org_id = p_org_id)::BIGINT AS total_deliveries,
    (SELECT COUNT(*) FROM exec_digest_delivery_log WHERE org_id = p_org_id AND status = 'success')::BIGINT AS successful_deliveries,
    (SELECT COUNT(*) FROM exec_digest_recipients WHERE org_id = p_org_id)::BIGINT AS total_recipients,
    (SELECT COUNT(*) FROM exec_digest_recipients WHERE org_id = p_org_id AND is_active)::BIGINT AS active_recipients;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE exec_digests IS 'Executive digest configurations for automated weekly/monthly reports';
COMMENT ON TABLE exec_digest_sections IS 'LLM-generated sections within each digest';
COMMENT ON TABLE exec_digest_recipients IS 'Email recipients for digest delivery';
COMMENT ON TABLE exec_digest_delivery_log IS 'Delivery history and status tracking';
COMMENT ON TABLE exec_digest_audit_log IS 'Audit trail for all digest operations';

COMMENT ON COLUMN exec_digests.summary IS 'JSONB snapshot of aggregate summary data';
COMMENT ON COLUMN exec_digests.kpi_snapshot IS 'JSONB array of KPI values at generation time';
COMMENT ON COLUMN exec_digests.insights_snapshot IS 'JSONB array of insights at generation time';
COMMENT ON COLUMN exec_digest_delivery_log.recipient_results IS 'Per-recipient delivery status array';
