/**
 * Migration 57: Media Performance Insights Schema (Sprint S52)
 *
 * Creates unified performance intelligence layer across PR systems (S38-S50)
 * Tracks visibility, sentiment, impact, engagement, and momentum
 *
 * Dependencies: S38-S50 schemas (press releases, pitches, media monitoring, journalists)
 */

-- ========================================
-- Enums
-- ========================================

CREATE TYPE metric_type AS ENUM (
  'mention_volume',
  'sentiment_score',
  'visibility_index',
  'journalist_impact',
  'outlet_tier_distribution',
  'campaign_velocity',
  'deliverability_rate',
  'engagement_score',
  'evi_score',
  'resonance_metric'
);

CREATE TYPE dimension_type AS ENUM (
  'brand',
  'campaign',
  'journalist',
  'outlet_tier',
  'topic_cluster',
  'time_window',
  'geography',
  'sentiment_category'
);

CREATE TYPE score_type AS ENUM (
  'visibility',
  'sentiment_stability',
  'momentum',
  'journalist_impact',
  'evi',
  'resonance',
  'overall_performance'
);

CREATE TYPE insight_category AS ENUM (
  'achievement',
  'anomaly',
  'recommendation',
  'trend',
  'risk',
  'opportunity'
);

CREATE TYPE aggregation_period AS ENUM (
  'hourly',
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'yearly'
);

CREATE TYPE sentiment_category AS ENUM (
  'very_negative',
  'negative',
  'neutral',
  'positive',
  'very_positive'
);

-- ========================================
-- Table: media_performance_snapshots
-- Daily/hourly rollups of performance metrics
-- ========================================

CREATE TABLE media_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Temporal
  snapshot_at TIMESTAMPTZ NOT NULL,
  aggregation_period aggregation_period NOT NULL DEFAULT 'daily',

  -- Dimensions
  brand_id UUID, -- nullable: org-wide snapshot if null
  campaign_id UUID,
  journalist_id UUID,
  outlet_tier TEXT, -- 'tier_1', 'tier_2', 'tier_3', 'niche'
  topic_cluster TEXT,

  -- Volume Metrics
  mention_count INTEGER DEFAULT 0,
  article_count INTEGER DEFAULT 0,
  journalist_count INTEGER DEFAULT 0,
  outlet_count INTEGER DEFAULT 0,

  -- Sentiment Metrics
  avg_sentiment FLOAT, -- -1 to 1
  sentiment_distribution JSONB DEFAULT '{"very_negative": 0, "negative": 0, "neutral": 0, "positive": 0, "very_positive": 0}',
  sentiment_stability_score FLOAT, -- 0-100

  -- Visibility Metrics
  visibility_score FLOAT, -- 0-100
  estimated_reach BIGINT, -- sum of outlet reaches
  share_of_voice FLOAT, -- 0-100 % vs competitors

  -- Engagement Metrics
  engagement_score FLOAT, -- 0-100
  pitch_success_rate FLOAT, -- 0-100 %
  deliverability_rate FLOAT, -- 0-100 %
  open_rate FLOAT, -- 0-100 %
  click_rate FLOAT, -- 0-100 %

  -- Velocity Metrics
  coverage_velocity FLOAT, -- mentions per day
  momentum_score FLOAT, -- 0-100, trend direction + speed

  -- EVI (Earned Visibility Index)
  evi_score FLOAT, -- 0-100
  evi_components JSONB DEFAULT '{"reach": 0, "sentiment": 0, "tier": 0, "frequency": 0}',

  -- Journalist Impact
  journalist_impact_score FLOAT, -- 0-100
  top_journalists JSONB DEFAULT '[]', -- [{id, name, score, mentions}]

  -- Tier Distribution
  tier_distribution JSONB DEFAULT '{"tier_1": 0, "tier_2": 0, "tier_3": 0, "niche": 0}',

  -- Keywords & Topics
  top_keywords JSONB DEFAULT '[]', -- [{keyword, count, sentiment}]
  topic_clusters JSONB DEFAULT '[]', -- [{topic, count, sentiment}]
  entities_mentioned JSONB DEFAULT '[]', -- [{entity, type, count}]

  -- Anomalies
  has_anomaly BOOLEAN DEFAULT false,
  anomaly_type TEXT, -- 'spike', 'drop', 'sentiment_shift', 'unusual_source'
  anomaly_magnitude FLOAT, -- 0-1

  -- Metadata
  raw_data_sources JSONB DEFAULT '[]', -- [{source: 'S38', ids: [...]}]
  calculation_metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_media_perf_snapshots_org_time ON media_performance_snapshots(org_id, snapshot_at DESC);
CREATE INDEX idx_media_perf_snapshots_brand ON media_performance_snapshots(org_id, brand_id, snapshot_at DESC);
CREATE INDEX idx_media_perf_snapshots_campaign ON media_performance_snapshots(org_id, campaign_id, snapshot_at DESC);
CREATE INDEX idx_media_perf_snapshots_journalist ON media_performance_snapshots(org_id, journalist_id, snapshot_at DESC);
CREATE INDEX idx_media_perf_snapshots_period ON media_performance_snapshots(aggregation_period, snapshot_at DESC);
CREATE INDEX idx_media_perf_snapshots_anomaly ON media_performance_snapshots(org_id, has_anomaly) WHERE has_anomaly = true;
CREATE INDEX idx_media_perf_snapshots_evi ON media_performance_snapshots(org_id, evi_score DESC NULLS LAST);
CREATE INDEX idx_media_perf_snapshots_outlet_tier ON media_performance_snapshots(org_id, outlet_tier, snapshot_at DESC);
CREATE GIN INDEX idx_media_perf_snapshots_keywords ON media_performance_snapshots USING gin(top_keywords);
CREATE GIN INDEX idx_media_perf_snapshots_topics ON media_performance_snapshots USING gin(topic_clusters);

-- RLS
ALTER TABLE media_performance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_performance_snapshots_org_isolation ON media_performance_snapshots
  FOR ALL USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- ========================================
-- Table: media_performance_dimensions
-- Pre-aggregated dimension rollups for fast querying
-- ========================================

CREATE TABLE media_performance_dimensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Dimension Identity
  dimension_type dimension_type NOT NULL,
  dimension_key TEXT NOT NULL, -- brand_id, campaign_id, journalist_id, etc.
  dimension_value TEXT NOT NULL, -- actual ID or category value
  dimension_label TEXT, -- human-readable label

  -- Time Window
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,

  -- Aggregated Metrics
  total_mentions INTEGER DEFAULT 0,
  total_articles INTEGER DEFAULT 0,
  unique_journalists INTEGER DEFAULT 0,
  unique_outlets INTEGER DEFAULT 0,

  -- Scores
  avg_sentiment FLOAT,
  avg_visibility FLOAT,
  avg_evi FLOAT,
  avg_engagement FLOAT,

  -- Trends
  mention_trend FLOAT, -- % change vs previous period
  sentiment_trend FLOAT,
  visibility_trend FLOAT,

  -- Distribution
  metric_distribution JSONB DEFAULT '{}', -- histogram data

  -- Metadata
  sample_size INTEGER,
  confidence_score FLOAT, -- 0-1

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_media_perf_dimensions_unique ON media_performance_dimensions(
  org_id, dimension_type, dimension_key, dimension_value, window_start
);
CREATE INDEX idx_media_perf_dimensions_type ON media_performance_dimensions(org_id, dimension_type, window_start DESC);
CREATE INDEX idx_media_perf_dimensions_window ON media_performance_dimensions(window_start, window_end);
CREATE INDEX idx_media_perf_dimensions_key ON media_performance_dimensions(org_id, dimension_key, dimension_value);

-- RLS
ALTER TABLE media_performance_dimensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_performance_dimensions_org_isolation ON media_performance_dimensions
  FOR ALL USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- ========================================
-- Table: media_performance_scores
-- Computed performance scores by entity
-- ========================================

CREATE TABLE media_performance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Entity
  entity_type TEXT NOT NULL, -- 'brand', 'campaign', 'journalist', 'org'
  entity_id TEXT NOT NULL, -- UUID or 'org-wide'

  -- Score Type
  score_type score_type NOT NULL,
  score_value FLOAT NOT NULL, -- 0-100

  -- Time Window
  calculated_at TIMESTAMPTZ NOT NULL,
  window_days INTEGER DEFAULT 30, -- lookback window

  -- Score Components (for transparency)
  score_components JSONB DEFAULT '{}',
  score_breakdown JSONB DEFAULT '{}',

  -- Context
  sample_size INTEGER,
  confidence_interval JSONB DEFAULT '{"lower": 0, "upper": 0}',

  -- Comparison
  percentile_rank FLOAT, -- 0-100, vs other entities
  vs_previous_period FLOAT, -- % change
  vs_org_average FLOAT, -- % difference

  -- Metadata
  calculation_method TEXT, -- 'llm', 'deterministic', 'hybrid'
  calculation_version TEXT DEFAULT '1.0',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_media_perf_scores_unique ON media_performance_scores(
  org_id, entity_type, entity_id, score_type, calculated_at DESC
);
CREATE INDEX idx_media_perf_scores_entity ON media_performance_scores(org_id, entity_type, entity_id, calculated_at DESC);
CREATE INDEX idx_media_perf_scores_type ON media_performance_scores(org_id, score_type, score_value DESC);
CREATE INDEX idx_media_perf_scores_time ON media_performance_scores(calculated_at DESC);

-- RLS
ALTER TABLE media_performance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_performance_scores_org_isolation ON media_performance_scores
  FOR ALL USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- ========================================
-- Table: media_performance_insights
-- LLM + rule-based narrative insights
-- ========================================

CREATE TABLE media_performance_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Context
  insight_category insight_category NOT NULL,
  priority INTEGER DEFAULT 5, -- 1 (critical) to 10 (low)

  -- Scope
  scope_type TEXT NOT NULL, -- 'org', 'brand', 'campaign', 'journalist'
  scope_id TEXT, -- UUID or null for org-wide

  -- Time Window
  insight_date TIMESTAMPTZ NOT NULL,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,

  -- Content
  insight_title TEXT NOT NULL,
  insight_summary TEXT NOT NULL,
  insight_details TEXT,

  -- Narrative Components
  what_happened TEXT, -- factual summary
  why_it_matters TEXT, -- analysis
  what_to_do_next TEXT, -- recommendations

  -- Evidence
  supporting_data JSONB DEFAULT '{}',
  data_points JSONB DEFAULT '[]',
  related_entities JSONB DEFAULT '[]', -- [{type, id, name}]

  -- Generation Method
  generation_method TEXT, -- 'llm', 'rule_based', 'hybrid'
  llm_model TEXT,
  confidence_score FLOAT, -- 0-1

  -- Actions
  is_actionable BOOLEAN DEFAULT false,
  recommended_actions JSONB DEFAULT '[]',
  action_taken BOOLEAN DEFAULT false,
  action_taken_at TIMESTAMPTZ,
  action_taken_by UUID,

  -- Visibility
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  dismissed_by UUID,

  -- Metadata
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}',

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_media_perf_insights_org_date ON media_performance_insights(org_id, insight_date DESC);
CREATE INDEX idx_media_perf_insights_category ON media_performance_insights(org_id, insight_category, priority);
CREATE INDEX idx_media_perf_insights_scope ON media_performance_insights(org_id, scope_type, scope_id, insight_date DESC);
CREATE INDEX idx_media_perf_insights_actionable ON media_performance_insights(org_id, is_actionable, action_taken) WHERE is_actionable = true;
CREATE INDEX idx_media_perf_insights_active ON media_performance_insights(org_id, is_dismissed, insight_date DESC) WHERE is_dismissed = false;
CREATE INDEX idx_media_perf_insights_priority ON media_performance_insights(org_id, priority, insight_date DESC);
CREATE GIN INDEX idx_media_perf_insights_tags ON media_performance_insights USING gin(tags);

-- RLS
ALTER TABLE media_performance_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_performance_insights_org_isolation ON media_performance_insights
  FOR ALL USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- ========================================
-- Helper Functions
-- ========================================

/**
 * Calculate Visibility Score (0-100)
 * Based on: reach, tier, frequency, share of voice
 */
CREATE OR REPLACE FUNCTION calculate_visibility_score(
  p_estimated_reach BIGINT,
  p_tier_distribution JSONB,
  p_mention_count INTEGER,
  p_share_of_voice FLOAT
)
RETURNS FLOAT AS $$
DECLARE
  v_reach_score FLOAT := 0;
  v_tier_score FLOAT := 0;
  v_frequency_score FLOAT := 0;
  v_sov_score FLOAT := 0;
  v_total_score FLOAT;
BEGIN
  -- Reach score (0-30 points): log scale
  IF p_estimated_reach > 0 THEN
    v_reach_score := LEAST(30, (LOG(p_estimated_reach + 1) / LOG(10000000)) * 30);
  END IF;

  -- Tier score (0-30 points): weighted by tier quality
  v_tier_score := (
    COALESCE((p_tier_distribution->>'tier_1')::FLOAT, 0) * 1.0 +
    COALESCE((p_tier_distribution->>'tier_2')::FLOAT, 0) * 0.7 +
    COALESCE((p_tier_distribution->>'tier_3')::FLOAT, 0) * 0.4 +
    COALESCE((p_tier_distribution->>'niche')::FLOAT, 0) * 0.2
  ) / GREATEST(p_mention_count, 1) * 30;

  -- Frequency score (0-20 points)
  v_frequency_score := LEAST(20, (p_mention_count / 10.0) * 20);

  -- Share of voice score (0-20 points)
  v_sov_score := COALESCE(p_share_of_voice, 0) * 0.2;

  v_total_score := v_reach_score + v_tier_score + v_frequency_score + v_sov_score;

  RETURN LEAST(100, GREATEST(0, v_total_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

/**
 * Calculate Sentiment Trend (% change + stability)
 * Returns: {change_pct, stability_score, trend_direction}
 */
CREATE OR REPLACE FUNCTION calculate_sentiment_trend(
  p_org_id UUID,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_window_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_current_sentiment FLOAT;
  v_previous_sentiment FLOAT;
  v_sentiment_variance FLOAT;
  v_change_pct FLOAT;
  v_stability_score FLOAT;
  v_trend_direction TEXT;
BEGIN
  -- Get current period sentiment
  SELECT AVG(avg_sentiment) INTO v_current_sentiment
  FROM media_performance_snapshots
  WHERE org_id = p_org_id
    AND snapshot_at >= NOW() - (p_window_days || ' days')::INTERVAL
    AND snapshot_at < NOW()
    AND CASE
      WHEN p_entity_type = 'brand' THEN brand_id::TEXT = p_entity_id
      WHEN p_entity_type = 'campaign' THEN campaign_id::TEXT = p_entity_id
      WHEN p_entity_type = 'journalist' THEN journalist_id::TEXT = p_entity_id
      ELSE true
    END;

  -- Get previous period sentiment
  SELECT AVG(avg_sentiment) INTO v_previous_sentiment
  FROM media_performance_snapshots
  WHERE org_id = p_org_id
    AND snapshot_at >= NOW() - (p_window_days * 2 || ' days')::INTERVAL
    AND snapshot_at < NOW() - (p_window_days || ' days')::INTERVAL
    AND CASE
      WHEN p_entity_type = 'brand' THEN brand_id::TEXT = p_entity_id
      WHEN p_entity_type = 'campaign' THEN campaign_id::TEXT = p_entity_id
      WHEN p_entity_type = 'journalist' THEN journalist_id::TEXT = p_entity_id
      ELSE true
    END;

  -- Calculate variance (stability)
  SELECT STDDEV(avg_sentiment) INTO v_sentiment_variance
  FROM media_performance_snapshots
  WHERE org_id = p_org_id
    AND snapshot_at >= NOW() - (p_window_days || ' days')::INTERVAL
    AND snapshot_at < NOW();

  -- Calculate change %
  IF v_previous_sentiment IS NOT NULL AND v_previous_sentiment != 0 THEN
    v_change_pct := ((v_current_sentiment - v_previous_sentiment) / ABS(v_previous_sentiment)) * 100;
  ELSE
    v_change_pct := 0;
  END IF;

  -- Stability score: lower variance = higher stability
  v_stability_score := LEAST(100, GREATEST(0, 100 - (COALESCE(v_sentiment_variance, 0) * 200)));

  -- Trend direction
  IF v_change_pct > 5 THEN
    v_trend_direction := 'improving';
  ELSIF v_change_pct < -5 THEN
    v_trend_direction := 'declining';
  ELSE
    v_trend_direction := 'stable';
  END IF;

  RETURN jsonb_build_object(
    'change_pct', COALESCE(v_change_pct, 0),
    'stability_score', COALESCE(v_stability_score, 0),
    'trend_direction', v_trend_direction,
    'current_sentiment', COALESCE(v_current_sentiment, 0),
    'previous_sentiment', COALESCE(v_previous_sentiment, 0)
  );
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Calculate Journalist Impact Score (0-100)
 * Based on: outlet tier, coverage frequency, sentiment, engagement
 */
CREATE OR REPLACE FUNCTION calculate_journalist_impact(
  p_journalist_id UUID,
  p_org_id UUID,
  p_window_days INTEGER DEFAULT 90
)
RETURNS FLOAT AS $$
DECLARE
  v_mention_count INTEGER;
  v_avg_sentiment FLOAT;
  v_tier_1_mentions INTEGER;
  v_tier_2_mentions INTEGER;
  v_engagement_rate FLOAT;
  v_impact_score FLOAT := 0;
BEGIN
  -- Get mention count
  SELECT COUNT(*) INTO v_mention_count
  FROM media_performance_snapshots
  WHERE org_id = p_org_id
    AND journalist_id = p_journalist_id
    AND snapshot_at >= NOW() - (p_window_days || ' days')::INTERVAL;

  -- Get average sentiment
  SELECT AVG(avg_sentiment) INTO v_avg_sentiment
  FROM media_performance_snapshots
  WHERE org_id = p_org_id
    AND journalist_id = p_journalist_id
    AND snapshot_at >= NOW() - (p_window_days || ' days')::INTERVAL;

  -- Get tier distribution
  SELECT
    SUM(CASE WHEN outlet_tier = 'tier_1' THEN mention_count ELSE 0 END),
    SUM(CASE WHEN outlet_tier = 'tier_2' THEN mention_count ELSE 0 END)
  INTO v_tier_1_mentions, v_tier_2_mentions
  FROM media_performance_snapshots
  WHERE org_id = p_org_id
    AND journalist_id = p_journalist_id
    AND snapshot_at >= NOW() - (p_window_days || ' days')::INTERVAL;

  -- Frequency score (0-30)
  v_impact_score := LEAST(30, (v_mention_count / 5.0) * 30);

  -- Tier score (0-40)
  v_impact_score := v_impact_score + (COALESCE(v_tier_1_mentions, 0) * 2 + COALESCE(v_tier_2_mentions, 0) * 1);
  v_impact_score := LEAST(v_impact_score, 70);

  -- Sentiment bonus (0-30)
  IF v_avg_sentiment > 0 THEN
    v_impact_score := v_impact_score + (v_avg_sentiment * 30);
  END IF;

  RETURN LEAST(100, GREATEST(0, v_impact_score));
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Calculate EVI Score (Earned Visibility Index) (0-100)
 * EVI = weighted sum of: reach, sentiment, tier, frequency
 */
CREATE OR REPLACE FUNCTION calculate_evi_score(
  p_estimated_reach BIGINT,
  p_avg_sentiment FLOAT,
  p_tier_distribution JSONB,
  p_mention_count INTEGER
)
RETURNS FLOAT AS $$
DECLARE
  v_reach_component FLOAT := 0;
  v_sentiment_component FLOAT := 0;
  v_tier_component FLOAT := 0;
  v_frequency_component FLOAT := 0;
  v_evi_score FLOAT;
BEGIN
  -- Reach component (0-30)
  IF p_estimated_reach > 0 THEN
    v_reach_component := LEAST(30, (LOG(p_estimated_reach + 1) / LOG(10000000)) * 30);
  END IF;

  -- Sentiment component (0-25): normalize -1 to 1 → 0 to 25
  v_sentiment_component := ((COALESCE(p_avg_sentiment, 0) + 1) / 2) * 25;

  -- Tier component (0-30): weighted avg of tier quality
  v_tier_component := (
    COALESCE((p_tier_distribution->>'tier_1')::FLOAT, 0) * 1.0 +
    COALESCE((p_tier_distribution->>'tier_2')::FLOAT, 0) * 0.7 +
    COALESCE((p_tier_distribution->>'tier_3')::FLOAT, 0) * 0.4 +
    COALESCE((p_tier_distribution->>'niche')::FLOAT, 0) * 0.2
  ) / GREATEST(p_mention_count, 1) * 30;

  -- Frequency component (0-15)
  v_frequency_component := LEAST(15, (p_mention_count / 20.0) * 15);

  v_evi_score := v_reach_component + v_sentiment_component + v_tier_component + v_frequency_component;

  RETURN LEAST(100, GREATEST(0, v_evi_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

/**
 * Detect anomalies in snapshots
 * Returns: {has_anomaly, type, magnitude}
 */
CREATE OR REPLACE FUNCTION detect_performance_anomaly(
  p_current_value FLOAT,
  p_historical_avg FLOAT,
  p_historical_stddev FLOAT,
  p_threshold_sigma FLOAT DEFAULT 2.0
)
RETURNS JSONB AS $$
DECLARE
  v_z_score FLOAT;
  v_has_anomaly BOOLEAN := false;
  v_anomaly_type TEXT;
  v_magnitude FLOAT := 0;
BEGIN
  -- Calculate z-score
  IF p_historical_stddev > 0 THEN
    v_z_score := ABS((p_current_value - p_historical_avg) / p_historical_stddev);

    IF v_z_score > p_threshold_sigma THEN
      v_has_anomaly := true;
      v_magnitude := LEAST(1.0, v_z_score / (p_threshold_sigma * 2));

      IF p_current_value > p_historical_avg THEN
        v_anomaly_type := 'spike';
      ELSE
        v_anomaly_type := 'drop';
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'has_anomaly', v_has_anomaly,
    'anomaly_type', v_anomaly_type,
    'magnitude', v_magnitude,
    'z_score', COALESCE(v_z_score, 0)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ========================================
-- Triggers
-- ========================================

/**
 * Auto-update updated_at timestamp
 */
CREATE OR REPLACE FUNCTION update_media_performance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_media_performance_snapshots_updated_at
  BEFORE UPDATE ON media_performance_snapshots
  FOR EACH ROW EXECUTE FUNCTION update_media_performance_updated_at();

CREATE TRIGGER update_media_performance_dimensions_updated_at
  BEFORE UPDATE ON media_performance_dimensions
  FOR EACH ROW EXECUTE FUNCTION update_media_performance_updated_at();

CREATE TRIGGER update_media_performance_scores_updated_at
  BEFORE UPDATE ON media_performance_scores
  FOR EACH ROW EXECUTE FUNCTION update_media_performance_updated_at();

CREATE TRIGGER update_media_performance_insights_updated_at
  BEFORE UPDATE ON media_performance_insights
  FOR EACH ROW EXECUTE FUNCTION update_media_performance_updated_at();

-- ========================================
-- Comments
-- ========================================

COMMENT ON TABLE media_performance_snapshots IS 'Time-series rollups of media performance metrics across all PR systems';
COMMENT ON TABLE media_performance_dimensions IS 'Pre-aggregated dimension rollups for fast querying (brand, campaign, journalist, etc.)';
COMMENT ON TABLE media_performance_scores IS 'Computed performance scores (visibility, sentiment, EVI, journalist impact) by entity';
COMMENT ON TABLE media_performance_insights IS 'LLM + rule-based narrative insights with recommendations';

COMMENT ON FUNCTION calculate_visibility_score IS 'Calculates visibility score (0-100) based on reach, tier, frequency, share of voice';
COMMENT ON FUNCTION calculate_sentiment_trend IS 'Calculates sentiment trend with change %, stability score, and direction';
COMMENT ON FUNCTION calculate_journalist_impact IS 'Calculates journalist impact score (0-100) based on tier, frequency, sentiment';
COMMENT ON FUNCTION calculate_evi_score IS 'Calculates Earned Visibility Index (0-100) weighted composite score';
COMMENT ON FUNCTION detect_performance_anomaly IS 'Detects statistical anomalies using z-score threshold';
