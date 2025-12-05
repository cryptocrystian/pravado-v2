-- Migration 61: Brand Reputation Intelligence Schema (Sprint S56)
-- Real-time brand reputation scoring, event tracking, and executive radar

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Reputation component types
CREATE TYPE reputation_component AS ENUM (
  'sentiment',
  'coverage',
  'crisis_impact',
  'competitive_position',
  'engagement'
);

-- Reputation trend direction
CREATE TYPE reputation_trend_direction AS ENUM (
  'up',
  'down',
  'flat'
);

-- Reputation alert severity levels
CREATE TYPE reputation_alert_severity AS ENUM (
  'info',
  'warning',
  'critical'
);

-- Source systems for reputation events
CREATE TYPE reputation_source_system AS ENUM (
  'media_monitoring',
  'media_alert',
  'media_performance',
  'crisis_incident',
  'competitive_intel',
  'pr_outreach',
  'pr_generator',
  'pr_pitch',
  'journalist_engagement',
  'social_listening',
  'manual_adjustment'
);

-- Event signal types
CREATE TYPE reputation_signal_type AS ENUM (
  'sentiment_shift',
  'coverage_spike',
  'coverage_drop',
  'crisis_detected',
  'crisis_resolved',
  'competitor_gain',
  'competitor_loss',
  'engagement_increase',
  'engagement_decrease',
  'media_mention',
  'journalist_response',
  'outreach_success',
  'outreach_failure',
  'alert_triggered',
  'performance_change'
);

-- Event severity levels
CREATE TYPE reputation_event_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Brand Reputation Snapshots
-- Point-in-time reputation scores with component breakdown
CREATE TABLE brand_reputation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Time window for this snapshot
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  -- Overall reputation score (0-100)
  overall_score NUMERIC(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),

  -- Previous period score for comparison
  previous_score NUMERIC(5,2) CHECK (previous_score >= 0 AND previous_score <= 100),
  score_delta NUMERIC(5,2),

  -- Trend direction
  trend_direction reputation_trend_direction NOT NULL DEFAULT 'flat',

  -- Component scores (0-100 each)
  sentiment_score NUMERIC(5,2) NOT NULL CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  coverage_score NUMERIC(5,2) NOT NULL CHECK (coverage_score >= 0 AND coverage_score <= 100),
  crisis_impact_score NUMERIC(5,2) NOT NULL CHECK (crisis_impact_score >= 0 AND crisis_impact_score <= 100),
  competitive_position_score NUMERIC(5,2) NOT NULL CHECK (competitive_position_score >= 0 AND competitive_position_score <= 100),
  engagement_score NUMERIC(5,2) NOT NULL CHECK (engagement_score >= 0 AND engagement_score <= 100),

  -- Aggregated metrics
  total_mentions INTEGER NOT NULL DEFAULT 0,
  positive_mentions INTEGER NOT NULL DEFAULT 0,
  negative_mentions INTEGER NOT NULL DEFAULT 0,
  neutral_mentions INTEGER NOT NULL DEFAULT 0,

  -- Crisis metrics
  active_crisis_count INTEGER NOT NULL DEFAULT 0,
  resolved_crisis_count INTEGER NOT NULL DEFAULT 0,
  crisis_severity_avg NUMERIC(5,2),

  -- Engagement metrics
  total_outreach_sent INTEGER NOT NULL DEFAULT 0,
  outreach_response_rate NUMERIC(5,2),
  journalist_engagement_count INTEGER NOT NULL DEFAULT 0,

  -- Competitive metrics
  competitive_rank INTEGER,
  competitors_tracked INTEGER NOT NULL DEFAULT 0,

  -- Driver analysis (JSONB for flexibility)
  top_positive_drivers JSONB NOT NULL DEFAULT '[]'::jsonb,
  top_negative_drivers JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Competitor comparison data
  competitor_comparison JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Executive summary (AI-generated or calculated)
  executive_summary TEXT,
  key_risks JSONB NOT NULL DEFAULT '[]'::jsonb,
  key_opportunities JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Additional metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Calculation metadata
  calculation_started_at TIMESTAMPTZ,
  calculation_completed_at TIMESTAMPTZ,
  events_processed INTEGER NOT NULL DEFAULT 0,

  CONSTRAINT valid_window CHECK (window_end > window_start)
);

-- Brand Reputation Events
-- Granular events that feed into reputation snapshots
CREATE TABLE brand_reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Event timestamp (when the event actually occurred)
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Source system that generated this event
  source_system reputation_source_system NOT NULL,

  -- Type of signal
  signal_type reputation_signal_type NOT NULL,

  -- Impact on reputation score (can be positive or negative)
  delta NUMERIC(5,2) NOT NULL,

  -- Affected component
  affected_component reputation_component NOT NULL,

  -- Severity of the event
  severity reputation_event_severity NOT NULL DEFAULT 'medium',

  -- Event title/description
  title TEXT NOT NULL,
  description TEXT,

  -- Reference to source entity
  source_entity_type TEXT, -- 'media_mention', 'crisis_incident', 'alert', etc.
  source_entity_id UUID,

  -- Context data
  context JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Whether this event has been processed into a snapshot
  is_processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processed_snapshot_id UUID REFERENCES brand_reputation_snapshots(id) ON DELETE SET NULL,

  -- For audit trail
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Brand Reputation Configuration
-- Per-org configuration for reputation scoring
CREATE TABLE brand_reputation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Component weights (should sum to 100)
  weight_sentiment NUMERIC(5,2) NOT NULL DEFAULT 25.00 CHECK (weight_sentiment >= 0 AND weight_sentiment <= 100),
  weight_coverage NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (weight_coverage >= 0 AND weight_coverage <= 100),
  weight_crisis NUMERIC(5,2) NOT NULL DEFAULT 25.00 CHECK (weight_crisis >= 0 AND weight_crisis <= 100),
  weight_competitive NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (weight_competitive >= 0 AND weight_competitive <= 100),
  weight_engagement NUMERIC(5,2) NOT NULL DEFAULT 15.00 CHECK (weight_engagement >= 0 AND weight_engagement <= 100),

  -- Alert thresholds
  threshold_alert_score_drop NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  threshold_critical_score NUMERIC(5,2) NOT NULL DEFAULT 30.00,
  threshold_warning_score NUMERIC(5,2) NOT NULL DEFAULT 50.00,

  -- Baseline score (for comparison)
  baseline_score NUMERIC(5,2) DEFAULT 70.00,

  -- Calculation settings
  default_time_window TEXT NOT NULL DEFAULT '30d',
  auto_recalculate BOOLEAN NOT NULL DEFAULT TRUE,
  recalculate_interval_hours INTEGER NOT NULL DEFAULT 24,

  -- Competitor tracking
  tracked_competitor_ids UUID[] NOT NULL DEFAULT '{}',

  -- Notification settings
  enable_score_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  alert_recipients JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Additional settings
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Audit
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT one_config_per_org UNIQUE (org_id),
  CONSTRAINT valid_weights CHECK (
    weight_sentiment + weight_coverage + weight_crisis +
    weight_competitive + weight_engagement <= 100.01 AND
    weight_sentiment + weight_coverage + weight_crisis +
    weight_competitive + weight_engagement >= 99.99
  )
);

-- Brand Reputation Alerts
-- Generated alerts based on score changes or thresholds
CREATE TABLE brand_reputation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Alert details
  severity reputation_alert_severity NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Related snapshot
  snapshot_id UUID REFERENCES brand_reputation_snapshots(id) ON DELETE SET NULL,

  -- Trigger details
  trigger_type TEXT NOT NULL, -- 'score_drop', 'threshold_breach', 'crisis_impact', etc.
  trigger_value NUMERIC(5,2),
  threshold_value NUMERIC(5,2),

  -- Related events
  related_event_ids UUID[] NOT NULL DEFAULT '{}',

  -- Alert status
  is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Resolution
  is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,

  -- Notifications sent
  notifications_sent JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Snapshots indexes
CREATE INDEX idx_brand_reputation_snapshots_org_id
  ON brand_reputation_snapshots(org_id);
CREATE INDEX idx_brand_reputation_snapshots_created_at
  ON brand_reputation_snapshots(created_at DESC);
CREATE INDEX idx_brand_reputation_snapshots_window
  ON brand_reputation_snapshots(org_id, window_start, window_end);
CREATE INDEX idx_brand_reputation_snapshots_score
  ON brand_reputation_snapshots(org_id, overall_score);

-- Events indexes
CREATE INDEX idx_brand_reputation_events_org_id
  ON brand_reputation_events(org_id);
CREATE INDEX idx_brand_reputation_events_created_at
  ON brand_reputation_events(created_at DESC);
CREATE INDEX idx_brand_reputation_events_source_system
  ON brand_reputation_events(source_system);
CREATE INDEX idx_brand_reputation_events_severity
  ON brand_reputation_events(severity);
CREATE INDEX idx_brand_reputation_events_component
  ON brand_reputation_events(affected_component);
CREATE INDEX idx_brand_reputation_events_timestamp
  ON brand_reputation_events(org_id, event_timestamp DESC);
CREATE INDEX idx_brand_reputation_events_unprocessed
  ON brand_reputation_events(org_id, is_processed)
  WHERE is_processed = FALSE;
CREATE INDEX idx_brand_reputation_events_source_entity
  ON brand_reputation_events(source_entity_type, source_entity_id);

-- Config indexes
CREATE INDEX idx_brand_reputation_config_org_id
  ON brand_reputation_config(org_id);

-- Alerts indexes
CREATE INDEX idx_brand_reputation_alerts_org_id
  ON brand_reputation_alerts(org_id);
CREATE INDEX idx_brand_reputation_alerts_severity
  ON brand_reputation_alerts(severity);
CREATE INDEX idx_brand_reputation_alerts_unacknowledged
  ON brand_reputation_alerts(org_id, is_acknowledged)
  WHERE is_acknowledged = FALSE;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Calculate weighted reputation score from component scores
CREATE OR REPLACE FUNCTION calculate_brand_reputation_score(
  p_sentiment_score NUMERIC,
  p_coverage_score NUMERIC,
  p_crisis_impact_score NUMERIC,
  p_competitive_position_score NUMERIC,
  p_engagement_score NUMERIC,
  p_weight_sentiment NUMERIC DEFAULT 25.0,
  p_weight_coverage NUMERIC DEFAULT 20.0,
  p_weight_crisis NUMERIC DEFAULT 25.0,
  p_weight_competitive NUMERIC DEFAULT 15.0,
  p_weight_engagement NUMERIC DEFAULT 15.0
)
RETURNS NUMERIC AS $$
DECLARE
  total_weight NUMERIC;
  weighted_sum NUMERIC;
BEGIN
  total_weight := p_weight_sentiment + p_weight_coverage + p_weight_crisis +
                  p_weight_competitive + p_weight_engagement;

  IF total_weight = 0 THEN
    RETURN 0;
  END IF;

  weighted_sum := (
    (COALESCE(p_sentiment_score, 50) * p_weight_sentiment) +
    (COALESCE(p_coverage_score, 50) * p_weight_coverage) +
    (COALESCE(p_crisis_impact_score, 50) * p_weight_crisis) +
    (COALESCE(p_competitive_position_score, 50) * p_weight_competitive) +
    (COALESCE(p_engagement_score, 50) * p_weight_engagement)
  ) / total_weight;

  RETURN ROUND(weighted_sum, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Determine trend direction based on score delta
CREATE OR REPLACE FUNCTION determine_trend_direction(
  p_current_score NUMERIC,
  p_previous_score NUMERIC,
  p_threshold NUMERIC DEFAULT 2.0
)
RETURNS reputation_trend_direction AS $$
DECLARE
  delta NUMERIC;
BEGIN
  IF p_previous_score IS NULL THEN
    RETURN 'flat';
  END IF;

  delta := p_current_score - p_previous_score;

  IF delta >= p_threshold THEN
    RETURN 'up';
  ELSIF delta <= -p_threshold THEN
    RETURN 'down';
  ELSE
    RETURN 'flat';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get aggregated event stats for a time window
CREATE OR REPLACE FUNCTION get_reputation_event_stats(
  p_org_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
  source_system reputation_source_system,
  affected_component reputation_component,
  event_count BIGINT,
  total_delta NUMERIC,
  avg_delta NUMERIC,
  max_severity reputation_event_severity
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.source_system,
    e.affected_component,
    COUNT(*) as event_count,
    SUM(e.delta) as total_delta,
    AVG(e.delta) as avg_delta,
    MAX(e.severity) as max_severity
  FROM brand_reputation_events e
  WHERE e.org_id = p_org_id
    AND e.event_timestamp >= p_start_time
    AND e.event_timestamp <= p_end_time
  GROUP BY e.source_system, e.affected_component;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get latest snapshot for an org
CREATE OR REPLACE FUNCTION get_latest_reputation_snapshot(p_org_id UUID)
RETURNS brand_reputation_snapshots AS $$
DECLARE
  result brand_reputation_snapshots;
BEGIN
  SELECT * INTO result
  FROM brand_reputation_snapshots
  WHERE org_id = p_org_id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get or create config for an org
CREATE OR REPLACE FUNCTION get_or_create_reputation_config(p_org_id UUID)
RETURNS brand_reputation_config AS $$
DECLARE
  result brand_reputation_config;
BEGIN
  SELECT * INTO result
  FROM brand_reputation_config
  WHERE org_id = p_org_id;

  IF NOT FOUND THEN
    INSERT INTO brand_reputation_config (org_id)
    VALUES (p_org_id)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on config changes
CREATE OR REPLACE FUNCTION update_brand_reputation_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_brand_reputation_config_updated_at
  BEFORE UPDATE ON brand_reputation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_brand_reputation_config_timestamp();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE brand_reputation_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reputation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reputation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_reputation_alerts ENABLE ROW LEVEL SECURITY;

-- Snapshots policies
CREATE POLICY "Users can view their org's reputation snapshots"
  ON brand_reputation_snapshots FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert reputation snapshots for their org"
  ON brand_reputation_snapshots FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's reputation snapshots"
  ON brand_reputation_snapshots FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Events policies
CREATE POLICY "Users can view their org's reputation events"
  ON brand_reputation_events FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert reputation events for their org"
  ON brand_reputation_events FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's reputation events"
  ON brand_reputation_events FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Config policies
CREATE POLICY "Users can view their org's reputation config"
  ON brand_reputation_config FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert reputation config for their org"
  ON brand_reputation_config FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's reputation config"
  ON brand_reputation_config FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Alerts policies
CREATE POLICY "Users can view their org's reputation alerts"
  ON brand_reputation_alerts FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert reputation alerts for their org"
  ON brand_reputation_alerts FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update their org's reputation alerts"
  ON brand_reputation_alerts FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE brand_reputation_snapshots IS 'Point-in-time brand reputation scores with component breakdown (Sprint S56)';
COMMENT ON TABLE brand_reputation_events IS 'Granular events that feed into reputation score calculations (Sprint S56)';
COMMENT ON TABLE brand_reputation_config IS 'Per-org configuration for reputation scoring weights and thresholds (Sprint S56)';
COMMENT ON TABLE brand_reputation_alerts IS 'Generated alerts for significant reputation changes (Sprint S56)';

COMMENT ON FUNCTION calculate_brand_reputation_score IS 'Calculates weighted overall reputation score from component scores';
COMMENT ON FUNCTION determine_trend_direction IS 'Determines if reputation is trending up, down, or flat';
COMMENT ON FUNCTION get_reputation_event_stats IS 'Aggregates reputation events for a time window';
COMMENT ON FUNCTION get_latest_reputation_snapshot IS 'Gets the most recent reputation snapshot for an org';
COMMENT ON FUNCTION get_or_create_reputation_config IS 'Gets existing config or creates default config for an org';
