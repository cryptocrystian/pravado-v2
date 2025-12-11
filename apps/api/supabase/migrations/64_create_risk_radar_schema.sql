-- Migration 64: Executive Risk Radar & Predictive Crisis Forecasting Engine Schema (Sprint S60)
-- Creates tables for predictive crisis likelihood, leading indicators, and executive risk dashboards

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Risk level classification
CREATE TYPE risk_radar_level AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Indicator type classification
CREATE TYPE risk_radar_indicator_type AS ENUM (
  'sentiment',
  'velocity',
  'alerts',
  'competitive',
  'governance',
  'persona',
  'media_coverage',
  'crisis_history',
  'reputation'
);

-- Forecast time horizon
CREATE TYPE risk_radar_forecast_horizon AS ENUM (
  '24h',
  '72h',
  '7d',
  '14d',
  '30d'
);

-- Driver category classification
CREATE TYPE risk_radar_driver_category AS ENUM (
  'sentiment_shift',
  'velocity_spike',
  'competitive_pressure',
  'governance_violation',
  'media_surge',
  'crisis_pattern',
  'persona_sensitivity',
  'external_event',
  'reputation_decline'
);

-- Note type classification
CREATE TYPE risk_radar_note_type AS ENUM (
  'observation',
  'action_taken',
  'escalation',
  'resolution',
  'context',
  'executive_comment'
);

-- ============================================================================
-- RISK RADAR SNAPSHOTS TABLE (Point-in-time risk assessment)
-- ============================================================================

CREATE TABLE risk_radar_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Snapshot identification
  snapshot_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  title VARCHAR(255),
  description TEXT,

  -- Risk scoring
  overall_risk_index DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (overall_risk_index >= 0 AND overall_risk_index <= 100),
  risk_level risk_radar_level NOT NULL DEFAULT 'low',
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Component scores (0-100)
  sentiment_score DECIMAL(5,2) CHECK (sentiment_score >= 0 AND sentiment_score <= 100),
  velocity_score DECIMAL(5,2) CHECK (velocity_score >= 0 AND velocity_score <= 100),
  alert_score DECIMAL(5,2) CHECK (alert_score >= 0 AND alert_score <= 100),
  competitive_score DECIMAL(5,2) CHECK (competitive_score >= 0 AND competitive_score <= 100),
  governance_score DECIMAL(5,2) CHECK (governance_score >= 0 AND governance_score <= 100),
  persona_score DECIMAL(5,2) CHECK (persona_score >= 0 AND persona_score <= 100),

  -- Signal matrix (raw signals from S40-S59)
  signal_matrix JSONB NOT NULL DEFAULT '{}',

  -- Computed insights
  key_concerns JSONB DEFAULT '[]',
  emerging_risks JSONB DEFAULT '[]',
  positive_factors JSONB DEFAULT '[]',

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,

  -- Computation metadata
  computation_method VARCHAR(50) DEFAULT 'weighted_aggregate',
  model_version VARCHAR(50),
  computation_duration_ms INT,

  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RISK RADAR INDICATORS TABLE (Individual risk signals)
-- ============================================================================

CREATE TABLE risk_radar_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES risk_radar_snapshots(id) ON DELETE CASCADE,

  -- Indicator identification
  indicator_type risk_radar_indicator_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Scoring
  score DECIMAL(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  weight DECIMAL(3,2) DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 1),
  normalized_score DECIMAL(5,2) CHECK (normalized_score >= 0 AND normalized_score <= 100),

  -- Trend analysis
  previous_score DECIMAL(5,2),
  score_delta DECIMAL(5,2),
  trend_direction VARCHAR(20), -- improving, stable, worsening, volatile
  velocity DECIMAL(8,4), -- rate of change

  -- Source data
  source_system VARCHAR(100) NOT NULL,
  source_reference_id VARCHAR(255),
  source_data JSONB DEFAULT '{}',

  -- Time window
  measurement_start TIMESTAMPTZ,
  measurement_end TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[],

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RISK RADAR FORECASTS TABLE (Predictive projections)
-- ============================================================================

CREATE TABLE risk_radar_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES risk_radar_snapshots(id) ON DELETE CASCADE,

  -- Forecast identification
  horizon risk_radar_forecast_horizon NOT NULL,
  forecast_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  target_date TIMESTAMPTZ NOT NULL,

  -- Predicted values
  predicted_risk_index DECIMAL(5,2) NOT NULL CHECK (predicted_risk_index >= 0 AND predicted_risk_index <= 100),
  predicted_risk_level risk_radar_level NOT NULL,
  confidence_interval_low DECIMAL(5,2),
  confidence_interval_high DECIMAL(5,2),
  probability_of_crisis DECIMAL(3,2) CHECK (probability_of_crisis >= 0 AND probability_of_crisis <= 1),

  -- Projection curves (JSONB array of {timestamp, value, confidence})
  projection_curve JSONB DEFAULT '[]',

  -- Narrative synthesis
  executive_summary TEXT,
  detailed_analysis TEXT,
  key_assumptions JSONB DEFAULT '[]',
  recommended_actions JSONB DEFAULT '[]',
  watch_items JSONB DEFAULT '[]',

  -- Model metadata
  model_name VARCHAR(100),
  model_version VARCHAR(50),
  llm_model VARCHAR(100),
  tokens_used INT,
  generation_duration_ms INT,

  -- Validation
  is_current BOOLEAN NOT NULL DEFAULT true,
  superseded_by UUID REFERENCES risk_radar_forecasts(id),
  accuracy_score DECIMAL(3,2), -- Retrospective accuracy if validated

  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RISK RADAR DRIVERS TABLE (Key risk drivers)
-- ============================================================================

CREATE TABLE risk_radar_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES risk_radar_snapshots(id) ON DELETE CASCADE,

  -- Driver identification
  category risk_radar_driver_category NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Impact assessment
  impact_score DECIMAL(5,2) NOT NULL CHECK (impact_score >= 0 AND impact_score <= 100),
  contribution_percentage DECIMAL(5,2) CHECK (contribution_percentage >= 0 AND contribution_percentage <= 100),
  urgency risk_radar_level DEFAULT 'medium',

  -- Source attribution
  source_system VARCHAR(100),
  source_reference_id VARCHAR(255),
  source_data JSONB DEFAULT '{}',

  -- Trend
  is_emerging BOOLEAN DEFAULT false,
  is_turning_point BOOLEAN DEFAULT false,
  first_detected_at TIMESTAMPTZ,
  trend_velocity DECIMAL(8,4),

  -- Related entities
  affected_entities JSONB DEFAULT '[]',
  related_indicator_ids UUID[] DEFAULT '{}',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[],

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RISK RADAR NOTES TABLE (Collaboration & annotations)
-- ============================================================================

CREATE TABLE risk_radar_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  snapshot_id UUID NOT NULL REFERENCES risk_radar_snapshots(id) ON DELETE CASCADE,

  -- Note content
  note_type risk_radar_note_type NOT NULL DEFAULT 'observation',
  title VARCHAR(255),
  content TEXT NOT NULL,

  -- Context
  related_indicator_id UUID REFERENCES risk_radar_indicators(id),
  related_driver_id UUID REFERENCES risk_radar_drivers(id),
  related_forecast_id UUID REFERENCES risk_radar_forecasts(id),

  -- Visibility
  is_executive_visible BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[],

  -- Audit
  created_by UUID NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RISK RADAR AUDIT LOG TABLE (LLM usage & operations tracking)
-- ============================================================================

CREATE TABLE risk_radar_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Operation details
  operation VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  request_id VARCHAR(100),

  -- User context
  user_id UUID,
  user_email VARCHAR(255),

  -- LLM details
  llm_model VARCHAR(100),
  tokens_input INT,
  tokens_output INT,
  tokens_total INT,
  duration_ms INT,

  -- Request/response (truncated for storage)
  prompt_preview TEXT, -- First 500 chars
  response_preview TEXT, -- First 500 chars

  -- Status
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Compute weighted risk index from component scores
CREATE OR REPLACE FUNCTION compute_risk_index(
  p_sentiment DECIMAL,
  p_velocity DECIMAL,
  p_alerts DECIMAL,
  p_competitive DECIMAL,
  p_governance DECIMAL,
  p_persona DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_weights JSONB := '{
    "sentiment": 0.20,
    "velocity": 0.15,
    "alerts": 0.25,
    "competitive": 0.15,
    "governance": 0.15,
    "persona": 0.10
  }';
  v_result DECIMAL := 0;
  v_total_weight DECIMAL := 0;
BEGIN
  -- Weighted sum with null handling
  IF p_sentiment IS NOT NULL THEN
    v_result := v_result + (p_sentiment * (v_weights->>'sentiment')::DECIMAL);
    v_total_weight := v_total_weight + (v_weights->>'sentiment')::DECIMAL;
  END IF;

  IF p_velocity IS NOT NULL THEN
    v_result := v_result + (p_velocity * (v_weights->>'velocity')::DECIMAL);
    v_total_weight := v_total_weight + (v_weights->>'velocity')::DECIMAL;
  END IF;

  IF p_alerts IS NOT NULL THEN
    v_result := v_result + (p_alerts * (v_weights->>'alerts')::DECIMAL);
    v_total_weight := v_total_weight + (v_weights->>'alerts')::DECIMAL;
  END IF;

  IF p_competitive IS NOT NULL THEN
    v_result := v_result + (p_competitive * (v_weights->>'competitive')::DECIMAL);
    v_total_weight := v_total_weight + (v_weights->>'competitive')::DECIMAL;
  END IF;

  IF p_governance IS NOT NULL THEN
    v_result := v_result + (p_governance * (v_weights->>'governance')::DECIMAL);
    v_total_weight := v_total_weight + (v_weights->>'governance')::DECIMAL;
  END IF;

  IF p_persona IS NOT NULL THEN
    v_result := v_result + (p_persona * (v_weights->>'persona')::DECIMAL);
    v_total_weight := v_total_weight + (v_weights->>'persona')::DECIMAL;
  END IF;

  -- Normalize by actual weight used
  IF v_total_weight > 0 THEN
    RETURN ROUND(v_result / v_total_weight, 2);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Compute individual indicator score with normalization
CREATE OR REPLACE FUNCTION compute_indicator_score(
  p_raw_value DECIMAL,
  p_min_value DECIMAL DEFAULT 0,
  p_max_value DECIMAL DEFAULT 100,
  p_invert BOOLEAN DEFAULT false
) RETURNS DECIMAL AS $$
DECLARE
  v_normalized DECIMAL;
BEGIN
  -- Clamp and normalize to 0-100
  IF p_max_value = p_min_value THEN
    RETURN 50; -- Default to middle if no range
  END IF;

  v_normalized := ((p_raw_value - p_min_value) / (p_max_value - p_min_value)) * 100;
  v_normalized := GREATEST(0, LEAST(100, v_normalized));

  -- Invert if needed (e.g., positive sentiment = low risk)
  IF p_invert THEN
    v_normalized := 100 - v_normalized;
  END IF;

  RETURN ROUND(v_normalized, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Normalize signal matrix values
CREATE OR REPLACE FUNCTION normalize_signal_matrix(
  p_matrix JSONB
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB := '{}';
  v_key TEXT;
  v_value JSONB;
  v_normalized DECIMAL;
BEGIN
  FOR v_key, v_value IN SELECT * FROM jsonb_each(p_matrix)
  LOOP
    IF jsonb_typeof(v_value) = 'number' THEN
      v_normalized := compute_indicator_score((v_value)::DECIMAL);
      v_result := v_result || jsonb_build_object(v_key, v_normalized);
    ELSE
      v_result := v_result || jsonb_build_object(v_key, v_value);
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Classify risk level from index
CREATE OR REPLACE FUNCTION classify_risk_level(
  p_risk_index DECIMAL
) RETURNS risk_radar_level AS $$
BEGIN
  IF p_risk_index >= 75 THEN
    RETURN 'critical';
  ELSIF p_risk_index >= 50 THEN
    RETURN 'high';
  ELSIF p_risk_index >= 25 THEN
    RETURN 'medium';
  ELSE
    RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Snapshots indexes
CREATE INDEX idx_risk_radar_snapshots_org ON risk_radar_snapshots(org_id);
CREATE INDEX idx_risk_radar_snapshots_date ON risk_radar_snapshots(org_id, snapshot_date DESC);
CREATE INDEX idx_risk_radar_snapshots_level ON risk_radar_snapshots(org_id, risk_level);
CREATE INDEX idx_risk_radar_snapshots_active ON risk_radar_snapshots(org_id, is_active) WHERE is_active = true;

-- Indicators indexes
CREATE INDEX idx_risk_radar_indicators_org ON risk_radar_indicators(org_id);
CREATE INDEX idx_risk_radar_indicators_snapshot ON risk_radar_indicators(snapshot_id);
CREATE INDEX idx_risk_radar_indicators_type ON risk_radar_indicators(org_id, indicator_type);
CREATE INDEX idx_risk_radar_indicators_source ON risk_radar_indicators(org_id, source_system);

-- Forecasts indexes
CREATE INDEX idx_risk_radar_forecasts_org ON risk_radar_forecasts(org_id);
CREATE INDEX idx_risk_radar_forecasts_snapshot ON risk_radar_forecasts(snapshot_id);
CREATE INDEX idx_risk_radar_forecasts_horizon ON risk_radar_forecasts(org_id, horizon);
CREATE INDEX idx_risk_radar_forecasts_current ON risk_radar_forecasts(snapshot_id, is_current) WHERE is_current = true;
CREATE INDEX idx_risk_radar_forecasts_date ON risk_radar_forecasts(org_id, forecast_date DESC);

-- Drivers indexes
CREATE INDEX idx_risk_radar_drivers_org ON risk_radar_drivers(org_id);
CREATE INDEX idx_risk_radar_drivers_snapshot ON risk_radar_drivers(snapshot_id);
CREATE INDEX idx_risk_radar_drivers_category ON risk_radar_drivers(org_id, category);
CREATE INDEX idx_risk_radar_drivers_emerging ON risk_radar_drivers(snapshot_id, is_emerging) WHERE is_emerging = true;

-- Notes indexes
CREATE INDEX idx_risk_radar_notes_org ON risk_radar_notes(org_id);
CREATE INDEX idx_risk_radar_notes_snapshot ON risk_radar_notes(snapshot_id);
CREATE INDEX idx_risk_radar_notes_type ON risk_radar_notes(org_id, note_type);
CREATE INDEX idx_risk_radar_notes_pinned ON risk_radar_notes(snapshot_id, is_pinned) WHERE is_pinned = true;

-- Audit log indexes
CREATE INDEX idx_risk_radar_audit_log_org ON risk_radar_audit_log(org_id);
CREATE INDEX idx_risk_radar_audit_log_operation ON risk_radar_audit_log(org_id, operation);
CREATE INDEX idx_risk_radar_audit_log_entity ON risk_radar_audit_log(entity_type, entity_id);
CREATE INDEX idx_risk_radar_audit_log_created ON risk_radar_audit_log(org_id, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE risk_radar_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_radar_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_radar_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_radar_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_radar_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_radar_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY risk_radar_snapshots_org_isolation ON risk_radar_snapshots
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY risk_radar_indicators_org_isolation ON risk_radar_indicators
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY risk_radar_forecasts_org_isolation ON risk_radar_forecasts
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY risk_radar_drivers_org_isolation ON risk_radar_drivers
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY risk_radar_notes_org_isolation ON risk_radar_notes
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

CREATE POLICY risk_radar_audit_log_org_isolation ON risk_radar_audit_log
  FOR ALL USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at for snapshots
CREATE OR REPLACE FUNCTION update_risk_radar_snapshots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_risk_radar_snapshots_updated_at
  BEFORE UPDATE ON risk_radar_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_radar_snapshots_updated_at();

-- Auto-update updated_at for indicators
CREATE OR REPLACE FUNCTION update_risk_radar_indicators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_risk_radar_indicators_updated_at
  BEFORE UPDATE ON risk_radar_indicators
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_radar_indicators_updated_at();

-- Auto-update updated_at for forecasts
CREATE OR REPLACE FUNCTION update_risk_radar_forecasts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_risk_radar_forecasts_updated_at
  BEFORE UPDATE ON risk_radar_forecasts
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_radar_forecasts_updated_at();

-- Auto-update updated_at for drivers
CREATE OR REPLACE FUNCTION update_risk_radar_drivers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_risk_radar_drivers_updated_at
  BEFORE UPDATE ON risk_radar_drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_radar_drivers_updated_at();

-- Auto-update updated_at for notes
CREATE OR REPLACE FUNCTION update_risk_radar_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_risk_radar_notes_updated_at
  BEFORE UPDATE ON risk_radar_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_risk_radar_notes_updated_at();

-- Auto-compute risk level on snapshot insert/update
CREATE OR REPLACE FUNCTION auto_classify_snapshot_risk_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.risk_level := classify_risk_level(NEW.overall_risk_index);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_classify_snapshot_risk_level
  BEFORE INSERT OR UPDATE OF overall_risk_index ON risk_radar_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION auto_classify_snapshot_risk_level();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE risk_radar_snapshots IS 'Point-in-time risk assessment snapshots aggregating signals from S40-S59 systems';
COMMENT ON TABLE risk_radar_indicators IS 'Individual risk indicators contributing to snapshot scores';
COMMENT ON TABLE risk_radar_forecasts IS 'Predictive crisis forecasts with narrative synthesis';
COMMENT ON TABLE risk_radar_drivers IS 'Key risk drivers identified from signal analysis';
COMMENT ON TABLE risk_radar_notes IS 'Collaborative notes and annotations on risk assessments';
COMMENT ON TABLE risk_radar_audit_log IS 'Audit trail for LLM usage and risk radar operations';

COMMENT ON FUNCTION compute_risk_index IS 'Computes weighted risk index from component scores';
COMMENT ON FUNCTION compute_indicator_score IS 'Normalizes raw values to 0-100 scale';
COMMENT ON FUNCTION normalize_signal_matrix IS 'Normalizes all numeric values in a signal matrix JSONB';
COMMENT ON FUNCTION classify_risk_level IS 'Classifies numeric risk index into low/medium/high/critical';
