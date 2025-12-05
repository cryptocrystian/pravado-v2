-- Migration 62: Brand Reputation Alerts & Executive Reporting Schema (Sprint S57)
-- Builds on S56 Brand Reputation Intelligence to add alerts, events, and executive reports

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Alert delivery channels
CREATE TYPE reputation_alert_channel AS ENUM (
  'in_app',
  'email',
  'slack',
  'webhook'
);

-- Alert event status
CREATE TYPE reputation_alert_status AS ENUM (
  'new',
  'acknowledged',
  'muted',
  'resolved'
);

-- Report frequency
CREATE TYPE reputation_report_frequency AS ENUM (
  'ad_hoc',
  'weekly',
  'monthly',
  'quarterly'
);

-- Report format
CREATE TYPE reputation_report_format AS ENUM (
  'executive_summary',
  'detailed'
);

-- Report status
CREATE TYPE reputation_report_status AS ENUM (
  'draft',
  'generating',
  'generated',
  'published'
);

-- Report section types
CREATE TYPE reputation_report_section_type AS ENUM (
  'overview',
  'highlights',
  'risks',
  'opportunities',
  'competitors',
  'recommendations',
  'events_timeline'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Brand Reputation Alert Rules
-- Defines conditions that trigger alerts when brand reputation metrics cross thresholds
CREATE TABLE brand_reputation_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Rule metadata
  name VARCHAR(200) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  channel reputation_alert_channel NOT NULL DEFAULT 'in_app',

  -- Overall score thresholds
  min_overall_score NUMERIC(5,2) CHECK (min_overall_score IS NULL OR (min_overall_score >= 0 AND min_overall_score <= 100)),
  max_overall_score NUMERIC(5,2) CHECK (max_overall_score IS NULL OR (max_overall_score >= 0 AND max_overall_score <= 100)),

  -- Delta thresholds (score change triggers)
  min_delta_overall_score NUMERIC(5,2),
  max_delta_overall_score NUMERIC(5,2),

  -- Component score thresholds
  component_key VARCHAR(50), -- e.g., 'sentiment', 'coverage', 'crisis_impact', 'competitive_position', 'engagement'
  min_component_score NUMERIC(5,2) CHECK (min_component_score IS NULL OR (min_component_score >= 0 AND min_component_score <= 100)),

  -- Competitor gap thresholds
  competitor_slug VARCHAR(100),
  min_competitor_gap NUMERIC(5,2),
  max_competitor_gap NUMERIC(5,2),

  -- Crisis incident integration
  min_incident_severity INTEGER CHECK (min_incident_severity IS NULL OR (min_incident_severity >= 1 AND min_incident_severity <= 5)),
  link_crisis_incidents BOOLEAN NOT NULL DEFAULT false,

  -- Timing controls
  time_window_minutes INTEGER NOT NULL DEFAULT 60 CHECK (time_window_minutes > 0),
  cooldown_minutes INTEGER NOT NULL DEFAULT 60 CHECK (cooldown_minutes >= 0),
  last_triggered_at TIMESTAMPTZ,

  -- Notification settings
  notification_config JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT valid_overall_score_range CHECK (
    min_overall_score IS NULL OR max_overall_score IS NULL OR min_overall_score <= max_overall_score
  ),
  CONSTRAINT valid_delta_range CHECK (
    min_delta_overall_score IS NULL OR max_delta_overall_score IS NULL OR min_delta_overall_score <= max_delta_overall_score
  ),
  CONSTRAINT valid_competitor_gap_range CHECK (
    min_competitor_gap IS NULL OR max_competitor_gap IS NULL OR min_competitor_gap <= max_competitor_gap
  )
);

-- Brand Reputation Alert Events
-- Records triggered alerts with snapshot data
CREATE TABLE brand_reputation_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES brand_reputation_alert_rules(id) ON DELETE CASCADE,

  -- Event status
  status reputation_alert_status NOT NULL DEFAULT 'new',

  -- Score snapshots at trigger time
  overall_score_before NUMERIC(5,2),
  overall_score_after NUMERIC(5,2),
  component_scores_before JSONB DEFAULT '{}',
  component_scores_after JSONB DEFAULT '{}',

  -- Competitor gap snapshots
  competitor_gap_before NUMERIC(5,2),
  competitor_gap_after NUMERIC(5,2),
  competitor_slug VARCHAR(100),

  -- Related crisis incidents
  incident_ids UUID[] DEFAULT '{}',

  -- Event context and metadata
  trigger_reason TEXT,
  context JSONB DEFAULT '{}',

  -- Timestamps
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand Reputation Reports
-- Executive reports summarizing brand reputation over a period
CREATE TABLE brand_reputation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Report metadata
  title VARCHAR(300) NOT NULL,
  description TEXT,

  -- Period covered
  report_period_start TIMESTAMPTZ NOT NULL,
  report_period_end TIMESTAMPTZ NOT NULL,

  -- Report configuration
  frequency reputation_report_frequency NOT NULL DEFAULT 'ad_hoc',
  format reputation_report_format NOT NULL DEFAULT 'executive_summary',
  status reputation_report_status NOT NULL DEFAULT 'draft',

  -- Score snapshots
  overall_score_snapshot JSONB DEFAULT '{}',
  component_scores_snapshot JSONB DEFAULT '{}',
  competitor_snapshot JSONB DEFAULT '{}',

  -- Key metrics
  key_metrics JSONB DEFAULT '{}',
  trend_data JSONB DEFAULT '{}',

  -- Generation metadata
  generation_started_at TIMESTAMPTZ,
  generation_completed_at TIMESTAMPTZ,
  generation_error TEXT,

  -- Ownership
  created_by_user_id UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,

  CONSTRAINT valid_report_period CHECK (report_period_start < report_period_end)
);

-- Brand Reputation Report Sections
-- Individual sections within a report
CREATE TABLE brand_reputation_report_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES brand_reputation_reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Section configuration
  section_type reputation_report_section_type NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  title VARCHAR(200) NOT NULL,

  -- Content
  content TEXT, -- LLM-generated or edited markdown/plain text

  -- Structured metadata for the section
  metadata JSONB DEFAULT '{}',

  -- Generation tracking
  generated_at TIMESTAMPTZ,
  generation_model VARCHAR(100),
  generation_prompt_tokens INTEGER,
  generation_completion_tokens INTEGER,

  -- Edit tracking
  last_edited_at TIMESTAMPTZ,
  last_edited_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand Reputation Report Recipients
-- Distribution list for reports
CREATE TABLE brand_reputation_report_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES brand_reputation_reports(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Recipient configuration
  channel reputation_alert_channel NOT NULL DEFAULT 'email',
  target TEXT NOT NULL, -- email address, Slack webhook URL, etc.
  recipient_name VARCHAR(200),

  -- Delivery tracking
  is_primary BOOLEAN NOT NULL DEFAULT false,
  delivery_status VARCHAR(50) DEFAULT 'pending',
  delivered_at TIMESTAMPTZ,
  delivery_error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Alert Rules indexes
CREATE INDEX idx_brand_reputation_alert_rules_org_id ON brand_reputation_alert_rules(org_id);
CREATE INDEX idx_brand_reputation_alert_rules_is_active ON brand_reputation_alert_rules(is_active);
CREATE INDEX idx_brand_reputation_alert_rules_channel ON brand_reputation_alert_rules(channel);
CREATE INDEX idx_brand_reputation_alert_rules_last_triggered ON brand_reputation_alert_rules(last_triggered_at);

-- Alert Events indexes
CREATE INDEX idx_brand_reputation_alert_events_org_id ON brand_reputation_alert_events(org_id);
CREATE INDEX idx_brand_reputation_alert_events_rule_id ON brand_reputation_alert_events(rule_id);
CREATE INDEX idx_brand_reputation_alert_events_status ON brand_reputation_alert_events(status);
CREATE INDEX idx_brand_reputation_alert_events_triggered_at ON brand_reputation_alert_events(triggered_at DESC);
CREATE INDEX idx_brand_reputation_alert_events_status_triggered ON brand_reputation_alert_events(status, triggered_at DESC);

-- Reports indexes
CREATE INDEX idx_brand_reputation_reports_org_id ON brand_reputation_reports(org_id);
CREATE INDEX idx_brand_reputation_reports_frequency ON brand_reputation_reports(frequency);
CREATE INDEX idx_brand_reputation_reports_status ON brand_reputation_reports(status);
CREATE INDEX idx_brand_reputation_reports_period_start ON brand_reputation_reports(report_period_start);
CREATE INDEX idx_brand_reputation_reports_period_end ON brand_reputation_reports(report_period_end);
CREATE INDEX idx_brand_reputation_reports_created_at ON brand_reputation_reports(created_at DESC);

-- Report Sections indexes
CREATE INDEX idx_brand_reputation_report_sections_report_id ON brand_reputation_report_sections(report_id);
CREATE INDEX idx_brand_reputation_report_sections_org_id ON brand_reputation_report_sections(org_id);
CREATE INDEX idx_brand_reputation_report_sections_type ON brand_reputation_report_sections(section_type);
CREATE INDEX idx_brand_reputation_report_sections_order ON brand_reputation_report_sections(report_id, order_index);

-- Report Recipients indexes
CREATE INDEX idx_brand_reputation_report_recipients_report_id ON brand_reputation_report_recipients(report_id);
CREATE INDEX idx_brand_reputation_report_recipients_org_id ON brand_reputation_report_recipients(org_id);
CREATE INDEX idx_brand_reputation_report_recipients_channel ON brand_reputation_report_recipients(channel);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE brand_reputation_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reputation_alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reputation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reputation_report_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reputation_report_recipients ENABLE ROW LEVEL SECURITY;

-- Alert Rules policies
CREATE POLICY "Users can view their org's alert rules"
  ON brand_reputation_alert_rules FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create alert rules for their org"
  ON brand_reputation_alert_rules FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their org's alert rules"
  ON brand_reputation_alert_rules FOR UPDATE
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their org's alert rules"
  ON brand_reputation_alert_rules FOR DELETE
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Alert Events policies
CREATE POLICY "Users can view their org's alert events"
  ON brand_reputation_alert_events FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create alert events for their org"
  ON brand_reputation_alert_events FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their org's alert events"
  ON brand_reputation_alert_events FOR UPDATE
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Reports policies
CREATE POLICY "Users can view their org's reports"
  ON brand_reputation_reports FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create reports for their org"
  ON brand_reputation_reports FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their org's reports"
  ON brand_reputation_reports FOR UPDATE
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their org's reports"
  ON brand_reputation_reports FOR DELETE
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Report Sections policies
CREATE POLICY "Users can view their org's report sections"
  ON brand_reputation_report_sections FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create report sections for their org"
  ON brand_reputation_report_sections FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their org's report sections"
  ON brand_reputation_report_sections FOR UPDATE
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their org's report sections"
  ON brand_reputation_report_sections FOR DELETE
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- Report Recipients policies
CREATE POLICY "Users can view their org's report recipients"
  ON brand_reputation_report_recipients FOR SELECT
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create report recipients for their org"
  ON brand_reputation_report_recipients FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their org's report recipients"
  ON brand_reputation_report_recipients FOR UPDATE
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their org's report recipients"
  ON brand_reputation_report_recipients FOR DELETE
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on alert rules
CREATE TRIGGER update_brand_reputation_alert_rules_updated_at
  BEFORE UPDATE ON brand_reputation_alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on alert events
CREATE TRIGGER update_brand_reputation_alert_events_updated_at
  BEFORE UPDATE ON brand_reputation_alert_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on reports
CREATE TRIGGER update_brand_reputation_reports_updated_at
  BEFORE UPDATE ON brand_reputation_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on report sections
CREATE TRIGGER update_brand_reputation_report_sections_updated_at
  BEFORE UPDATE ON brand_reputation_report_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at on report recipients
CREATE TRIGGER update_brand_reputation_report_recipients_updated_at
  BEFORE UPDATE ON brand_reputation_report_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get brand reputation scores for a specific period
-- Aggregates snapshot data from S56's brand_reputation_snapshots table
CREATE OR REPLACE FUNCTION get_brand_reputation_scores_for_period(
  p_org_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  avg_overall_score NUMERIC,
  min_overall_score NUMERIC,
  max_overall_score NUMERIC,
  avg_sentiment_score NUMERIC,
  avg_coverage_score NUMERIC,
  avg_crisis_impact_score NUMERIC,
  avg_competitive_position_score NUMERIC,
  avg_engagement_score NUMERIC,
  snapshot_count BIGINT,
  first_snapshot_at TIMESTAMPTZ,
  last_snapshot_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(brs.overall_score)::NUMERIC, 2) as avg_overall_score,
    ROUND(MIN(brs.overall_score)::NUMERIC, 2) as min_overall_score,
    ROUND(MAX(brs.overall_score)::NUMERIC, 2) as max_overall_score,
    ROUND(AVG(brs.sentiment_score)::NUMERIC, 2) as avg_sentiment_score,
    ROUND(AVG(brs.coverage_score)::NUMERIC, 2) as avg_coverage_score,
    ROUND(AVG(brs.crisis_impact_score)::NUMERIC, 2) as avg_crisis_impact_score,
    ROUND(AVG(brs.competitive_position_score)::NUMERIC, 2) as avg_competitive_position_score,
    ROUND(AVG(brs.engagement_score)::NUMERIC, 2) as avg_engagement_score,
    COUNT(*) as snapshot_count,
    MIN(brs.created_at) as first_snapshot_at,
    MAX(brs.created_at) as last_snapshot_at
  FROM brand_reputation_snapshots brs
  WHERE brs.org_id = p_org_id
    AND brs.created_at >= p_start_date
    AND brs.created_at <= p_end_date;
END;
$$;

-- Get brand reputation trend data with configurable intervals
CREATE OR REPLACE FUNCTION get_brand_reputation_trend(
  p_org_id UUID,
  p_interval TEXT DEFAULT 'day', -- 'hour', 'day', 'week', 'month'
  p_limit INTEGER DEFAULT 30
)
RETURNS TABLE (
  period_start TIMESTAMPTZ,
  avg_overall_score NUMERIC,
  avg_sentiment_score NUMERIC,
  avg_coverage_score NUMERIC,
  avg_crisis_impact_score NUMERIC,
  avg_competitive_position_score NUMERIC,
  avg_engagement_score NUMERIC,
  snapshot_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc(p_interval, brs.created_at) as period_start,
    ROUND(AVG(brs.overall_score)::NUMERIC, 2) as avg_overall_score,
    ROUND(AVG(brs.sentiment_score)::NUMERIC, 2) as avg_sentiment_score,
    ROUND(AVG(brs.coverage_score)::NUMERIC, 2) as avg_coverage_score,
    ROUND(AVG(brs.crisis_impact_score)::NUMERIC, 2) as avg_crisis_impact_score,
    ROUND(AVG(brs.competitive_position_score)::NUMERIC, 2) as avg_competitive_position_score,
    ROUND(AVG(brs.engagement_score)::NUMERIC, 2) as avg_engagement_score,
    COUNT(*) as snapshot_count
  FROM brand_reputation_snapshots brs
  WHERE brs.org_id = p_org_id
  GROUP BY date_trunc(p_interval, brs.created_at)
  ORDER BY period_start DESC
  LIMIT p_limit;
END;
$$;

-- Get active alert count for an org (for dashboard widgets)
CREATE OR REPLACE FUNCTION get_active_reputation_alert_count(p_org_id UUID)
RETURNS TABLE (
  new_count BIGINT,
  acknowledged_count BIGINT,
  total_unresolved BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'new') as new_count,
    COUNT(*) FILTER (WHERE status = 'acknowledged') as acknowledged_count,
    COUNT(*) FILTER (WHERE status IN ('new', 'acknowledged')) as total_unresolved
  FROM brand_reputation_alert_events
  WHERE org_id = p_org_id;
END;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE brand_reputation_alert_rules IS 'Sprint S57: Alert rules defining conditions for brand reputation notifications';
COMMENT ON TABLE brand_reputation_alert_events IS 'Sprint S57: Triggered alert events with score snapshots and status tracking';
COMMENT ON TABLE brand_reputation_reports IS 'Sprint S57: Executive reports summarizing brand reputation over periods';
COMMENT ON TABLE brand_reputation_report_sections IS 'Sprint S57: Individual sections within executive reports';
COMMENT ON TABLE brand_reputation_report_recipients IS 'Sprint S57: Distribution list for executive reports';

COMMENT ON FUNCTION get_brand_reputation_scores_for_period IS 'Sprint S57: Aggregates S56 reputation scores for a given period';
COMMENT ON FUNCTION get_brand_reputation_trend IS 'Sprint S57: Returns trend data with configurable time intervals';
COMMENT ON FUNCTION get_active_reputation_alert_count IS 'Sprint S57: Returns counts of active/unresolved alerts for dashboard';
