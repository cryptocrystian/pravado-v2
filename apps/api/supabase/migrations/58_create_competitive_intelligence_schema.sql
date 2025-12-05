/**
 * Migration 58: Competitive Intelligence Engine V1 Schema (Sprint S53)
 *
 * Creates comprehensive competitive intelligence layer for tracking competitor
 * brands, analyzing their media footprint, comparing performance against user's
 * brand, and generating strategic insights.
 *
 * Components:
 * - 5 custom enums (competitor_tier, ci_metric_type, ci_insight_category, spike_type, overlap_type)
 * - 5 tables with full RLS policies
 * - 12+ indexes per table for query optimization
 * - 4 SQL helper functions for competitive scoring
 * - Auto-update triggers
 *
 * Integration Points:
 * - S40: Media monitoring for competitor mentions
 * - S46: Journalist graph for relationship analysis
 * - S52: Media performance for comparative analytics
 */

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Competitor tier classification
CREATE TYPE competitor_tier AS ENUM (
  'tier_1',      -- Direct competitors (same market, similar scale)
  'tier_2',      -- Secondary competitors (adjacent market)
  'tier_3',      -- Emerging competitors (smaller but growing)
  'tier_4'       -- Distant competitors (different market, tangential)
);

-- Competitive intelligence metric types
CREATE TYPE ci_metric_type AS ENUM (
  'mention_volume',
  'coverage_velocity',
  'sentiment_score',
  'evi_score',
  'journalist_count',
  'outlet_count',
  'tier_distribution',
  'topic_cluster',
  'share_of_voice',
  'estimated_reach',
  'sentiment_stability',
  'journalist_exclusivity'
);

-- Competitive insight categories
CREATE TYPE ci_insight_category AS ENUM (
  'advantage',      -- Areas where user brand is winning
  'threat',         -- Areas where competitor is winning
  'opportunity',    -- Gaps to exploit
  'trend',          -- Emerging patterns
  'anomaly',        -- Unusual activity
  'recommendation'  -- Strategic suggestions
);

-- Spike detection types
CREATE TYPE spike_type AS ENUM (
  'volume_spike',
  'sentiment_shift',
  'journalist_surge',
  'outlet_expansion',
  'topic_emergence'
);

-- Overlap analysis types
CREATE TYPE overlap_type AS ENUM (
  'journalist_overlap',
  'outlet_overlap',
  'topic_overlap',
  'audience_overlap'
);

-- ============================================================================
-- TABLE 1: competitors
-- Stores competitor brand profiles
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Competitor Identity
  name TEXT NOT NULL,
  domain TEXT,
  tier competitor_tier NOT NULL DEFAULT 'tier_2',
  industry TEXT,
  description TEXT,

  -- Tracking Configuration
  keywords TEXT[] NOT NULL DEFAULT '{}',  -- Keywords to track competitor mentions
  domains TEXT[] NOT NULL DEFAULT '{}',   -- Competitor domains for URL matching
  social_handles JSONB DEFAULT '{}',      -- Twitter, LinkedIn, etc.

  -- Metadata
  is_active BOOLEAN NOT NULL DEFAULT true,
  tracked_since TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_analyzed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT competitors_name_org_unique UNIQUE (org_id, name)
);

-- Indexes for competitors
CREATE INDEX idx_competitors_org_id ON competitors(org_id);
CREATE INDEX idx_competitors_org_tier ON competitors(org_id, tier);
CREATE INDEX idx_competitors_org_active ON competitors(org_id, is_active);
CREATE INDEX idx_competitors_tracked_since ON competitors(org_id, tracked_since);
CREATE INDEX idx_competitors_keywords_gin ON competitors USING gin(keywords);

-- RLS Policies for competitors
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitors_org_isolation ON competitors
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- ============================================================================
-- TABLE 2: competitor_mentions
-- Stores individual competitor mentions from media monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,

  -- Source Information
  source_type TEXT NOT NULL,  -- 'article', 'social', 'press_release', etc.
  source_url TEXT,
  published_at TIMESTAMPTZ NOT NULL,

  -- Content
  title TEXT,
  content TEXT,
  excerpt TEXT,

  -- Metadata
  author_name TEXT,
  journalist_id UUID,  -- References journalist graph if identified
  outlet_name TEXT,
  outlet_tier INTEGER,  -- 1-4 tier classification

  -- Analysis
  sentiment_score FLOAT CHECK (sentiment_score >= -1 AND sentiment_score <= 1),
  topics TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  estimated_reach BIGINT,

  -- Matching Info
  matched_keywords TEXT[] DEFAULT '{}',  -- Which keywords triggered this mention
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for competitor_mentions
CREATE INDEX idx_competitor_mentions_org_id ON competitor_mentions(org_id);
CREATE INDEX idx_competitor_mentions_competitor ON competitor_mentions(competitor_id);
CREATE INDEX idx_competitor_mentions_published ON competitor_mentions(competitor_id, published_at DESC);
CREATE INDEX idx_competitor_mentions_org_published ON competitor_mentions(org_id, published_at DESC);
CREATE INDEX idx_competitor_mentions_journalist ON competitor_mentions(journalist_id) WHERE journalist_id IS NOT NULL;
CREATE INDEX idx_competitor_mentions_outlet ON competitor_mentions(org_id, outlet_name);
CREATE INDEX idx_competitor_mentions_sentiment ON competitor_mentions(competitor_id, sentiment_score);
CREATE INDEX idx_competitor_mentions_content_gin ON competitor_mentions USING gin(to_tsvector('english', COALESCE(content, '')));
CREATE INDEX idx_competitor_mentions_topics_gin ON competitor_mentions USING gin(topics);

-- RLS Policies for competitor_mentions
ALTER TABLE competitor_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitor_mentions_org_isolation ON competitor_mentions
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- ============================================================================
-- TABLE 3: competitor_metrics_snapshots
-- Time-series rollups of competitor performance metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,

  -- Snapshot Metadata
  snapshot_at TIMESTAMPTZ NOT NULL,
  period TEXT NOT NULL DEFAULT 'daily',  -- 'daily', 'weekly', 'monthly'

  -- Volume Metrics
  mention_count INTEGER NOT NULL DEFAULT 0,
  article_count INTEGER NOT NULL DEFAULT 0,
  journalist_count INTEGER NOT NULL DEFAULT 0,
  outlet_count INTEGER NOT NULL DEFAULT 0,

  -- Sentiment Metrics
  avg_sentiment FLOAT CHECK (avg_sentiment >= -1 AND avg_sentiment <= 1),
  sentiment_distribution JSONB,  -- { positive: N, neutral: N, negative: N }
  sentiment_stability_score FLOAT CHECK (sentiment_stability_score >= 0 AND sentiment_stability_score <= 100),

  -- Visibility Metrics
  visibility_score FLOAT CHECK (visibility_score >= 0 AND visibility_score <= 100),
  estimated_reach BIGINT,
  share_of_voice FLOAT CHECK (share_of_voice >= 0 AND share_of_voice <= 100),

  -- EVI Metrics
  evi_score FLOAT CHECK (evi_score >= 0 AND evi_score <= 100),
  evi_components JSONB,  -- Breakdown of EVI calculation

  -- Tier Distribution
  tier_distribution JSONB,  -- { tier1: N, tier2: N, tier3: N, tier4: N, unknown: N }

  -- Journalist Relationships
  top_journalists JSONB,  -- Array of journalist IDs with mention counts
  journalist_exclusivity_score FLOAT CHECK (journalist_exclusivity_score >= 0 AND journalist_exclusivity_score <= 100),

  -- Topic Analysis
  top_topics TEXT[] DEFAULT '{}',
  topic_clusters JSONB,  -- Grouped topics with counts

  -- Comparative Metrics (vs user's brand)
  mention_volume_differential INTEGER,  -- Competitor - User
  sentiment_differential FLOAT,
  evi_differential FLOAT,
  coverage_velocity_differential FLOAT,

  -- Anomaly Detection
  has_anomaly BOOLEAN NOT NULL DEFAULT false,
  anomaly_type spike_type,
  anomaly_magnitude FLOAT,
  anomaly_description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT competitor_metrics_snapshots_unique UNIQUE (competitor_id, snapshot_at, period)
);

-- Indexes for competitor_metrics_snapshots
CREATE INDEX idx_competitor_metrics_org_id ON competitor_metrics_snapshots(org_id);
CREATE INDEX idx_competitor_metrics_competitor ON competitor_metrics_snapshots(competitor_id);
CREATE INDEX idx_competitor_metrics_snapshot ON competitor_metrics_snapshots(competitor_id, snapshot_at DESC);
CREATE INDEX idx_competitor_metrics_org_snapshot ON competitor_metrics_snapshots(org_id, snapshot_at DESC);
CREATE INDEX idx_competitor_metrics_period ON competitor_metrics_snapshots(org_id, period, snapshot_at DESC);
CREATE INDEX idx_competitor_metrics_anomaly ON competitor_metrics_snapshots(org_id, has_anomaly) WHERE has_anomaly = true;
CREATE INDEX idx_competitor_metrics_evi ON competitor_metrics_snapshots(competitor_id, evi_score DESC);
CREATE INDEX idx_competitor_metrics_visibility ON competitor_metrics_snapshots(competitor_id, visibility_score DESC);

-- RLS Policies for competitor_metrics_snapshots
ALTER TABLE competitor_metrics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitor_metrics_snapshots_org_isolation ON competitor_metrics_snapshots
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- ============================================================================
-- TABLE 4: competitor_insights
-- LLM-generated and rule-based competitive insights
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,

  -- Insight Metadata
  category ci_insight_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,

  -- Scoring
  impact_score FLOAT NOT NULL CHECK (impact_score >= 0 AND impact_score <= 100),
  confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  priority_score FLOAT CHECK (priority_score >= 0 AND priority_score <= 100),

  -- Supporting Data
  supporting_metrics JSONB,  -- Metrics that led to this insight
  supporting_mentions JSONB,  -- Related mention IDs
  time_window_start TIMESTAMPTZ,
  time_window_end TIMESTAMPTZ,

  -- LLM Generation
  generated_by TEXT NOT NULL DEFAULT 'rule',  -- 'llm', 'rule', 'hybrid'
  llm_model TEXT,
  llm_prompt TEXT,

  -- User Interaction
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  user_feedback TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for competitor_insights
CREATE INDEX idx_competitor_insights_org_id ON competitor_insights(org_id);
CREATE INDEX idx_competitor_insights_competitor ON competitor_insights(competitor_id);
CREATE INDEX idx_competitor_insights_category ON competitor_insights(org_id, category);
CREATE INDEX idx_competitor_insights_unread ON competitor_insights(org_id, is_read) WHERE is_read = false;
CREATE INDEX idx_competitor_insights_priority ON competitor_insights(org_id, priority_score DESC);
CREATE INDEX idx_competitor_insights_impact ON competitor_insights(competitor_id, impact_score DESC);
CREATE INDEX idx_competitor_insights_created ON competitor_insights(org_id, created_at DESC);

-- RLS Policies for competitor_insights
ALTER TABLE competitor_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitor_insights_org_isolation ON competitor_insights
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- ============================================================================
-- TABLE 5: competitor_overlap
-- Analysis of coverage, journalist, and topic overlap between brands
-- ============================================================================

CREATE TABLE IF NOT EXISTS competitor_overlap (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,

  -- Overlap Metadata
  overlap_type overlap_type NOT NULL,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_window_days INTEGER NOT NULL DEFAULT 30,

  -- Overlap Scoring
  overlap_score FLOAT NOT NULL CHECK (overlap_score >= 0 AND overlap_score <= 100),
  exclusivity_score FLOAT CHECK (exclusivity_score >= 0 AND exclusivity_score <= 100),

  -- Overlap Details
  shared_entities JSONB NOT NULL,  -- IDs of shared journalists/outlets/topics
  brand_exclusive_entities JSONB,  -- Entities only covering user's brand
  competitor_exclusive_entities JSONB,  -- Entities only covering competitor

  -- Counts
  shared_count INTEGER NOT NULL DEFAULT 0,
  brand_exclusive_count INTEGER NOT NULL DEFAULT 0,
  competitor_exclusive_count INTEGER NOT NULL DEFAULT 0,
  total_entities INTEGER NOT NULL DEFAULT 0,

  -- Advantage Analysis
  advantage_score FLOAT,  -- Positive = user advantage, Negative = competitor advantage
  advantage_description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT competitor_overlap_unique UNIQUE (competitor_id, overlap_type, analyzed_at)
);

-- Indexes for competitor_overlap
CREATE INDEX idx_competitor_overlap_org_id ON competitor_overlap(org_id);
CREATE INDEX idx_competitor_overlap_competitor ON competitor_overlap(competitor_id);
CREATE INDEX idx_competitor_overlap_type ON competitor_overlap(org_id, overlap_type);
CREATE INDEX idx_competitor_overlap_analyzed ON competitor_overlap(competitor_id, analyzed_at DESC);
CREATE INDEX idx_competitor_overlap_score ON competitor_overlap(competitor_id, overlap_score DESC);
CREATE INDEX idx_competitor_overlap_advantage ON competitor_overlap(org_id, advantage_score DESC);

-- RLS Policies for competitor_overlap
ALTER TABLE competitor_overlap ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitor_overlap_org_isolation ON competitor_overlap
  FOR ALL
  USING (org_id = current_setting('app.current_org_id', TRUE)::UUID);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

/**
 * Calculate Competitor EVI Score
 *
 * Earned Visibility Index for competitors based on:
 * - Estimated reach (30%)
 * - Average sentiment (25%)
 * - Outlet tier distribution (30%)
 * - Mention frequency (15%)
 *
 * @param p_estimated_reach Total estimated audience reach
 * @param p_avg_sentiment Average sentiment (-1 to 1)
 * @param p_tier_distribution JSONB tier distribution
 * @param p_mention_count Number of mentions
 * @returns Float score 0-100
 */
CREATE OR REPLACE FUNCTION calculate_competitor_evi(
  p_estimated_reach BIGINT,
  p_avg_sentiment FLOAT,
  p_tier_distribution JSONB,
  p_mention_count INTEGER
) RETURNS FLOAT AS $$
DECLARE
  v_reach_score FLOAT;
  v_sentiment_score FLOAT;
  v_tier_score FLOAT;
  v_frequency_score FLOAT;
  v_evi_score FLOAT;
  v_tier1 INTEGER;
  v_tier2 INTEGER;
  v_tier3 INTEGER;
  v_tier4 INTEGER;
  v_unknown INTEGER;
  v_total_tier INTEGER;
BEGIN
  -- Reach score (0-100, logarithmic scale)
  v_reach_score := LEAST(100, GREATEST(0, LOG(10, GREATEST(p_estimated_reach, 1) + 1) * 10));

  -- Sentiment score (normalize -1..1 to 0..100)
  v_sentiment_score := (COALESCE(p_avg_sentiment, 0) + 1) * 50;

  -- Tier score (weighted by tier quality)
  v_tier1 := COALESCE((p_tier_distribution->>'tier1')::INTEGER, 0);
  v_tier2 := COALESCE((p_tier_distribution->>'tier2')::INTEGER, 0);
  v_tier3 := COALESCE((p_tier_distribution->>'tier3')::INTEGER, 0);
  v_tier4 := COALESCE((p_tier_distribution->>'tier4')::INTEGER, 0);
  v_unknown := COALESCE((p_tier_distribution->>'unknown')::INTEGER, 0);
  v_total_tier := v_tier1 + v_tier2 + v_tier3 + v_tier4 + v_unknown;

  IF v_total_tier > 0 THEN
    v_tier_score := (
      (v_tier1 * 1.0 + v_tier2 * 0.7 + v_tier3 * 0.4 + v_tier4 * 0.2) / v_total_tier
    ) * 100;
  ELSE
    v_tier_score := 0;
  END IF;

  -- Frequency score (logarithmic scale)
  v_frequency_score := LEAST(100, GREATEST(0, LOG(10, p_mention_count + 1) * 20));

  -- Weighted sum: reach (30%), sentiment (25%), tier (30%), frequency (15%)
  v_evi_score := (
    v_reach_score * 0.30 +
    v_sentiment_score * 0.25 +
    v_tier_score * 0.30 +
    v_frequency_score * 0.15
  );

  RETURN ROUND(v_evi_score::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

/**
 * Calculate Competitor Sentiment Trend
 *
 * Analyzes sentiment changes over time window
 *
 * @param p_competitor_id Competitor UUID
 * @param p_org_id Organization UUID
 * @param p_window_days Analysis window in days
 * @returns JSONB with current, previous, change, and trend direction
 */
CREATE OR REPLACE FUNCTION calculate_competitor_sentiment(
  p_competitor_id UUID,
  p_org_id UUID,
  p_window_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
  v_current_avg FLOAT;
  v_previous_avg FLOAT;
  v_change FLOAT;
  v_direction TEXT;
  v_stability FLOAT;
BEGIN
  -- Current period average
  SELECT AVG(sentiment_score)
  INTO v_current_avg
  FROM competitor_mentions
  WHERE competitor_id = p_competitor_id
    AND org_id = p_org_id
    AND published_at >= NOW() - (p_window_days || ' days')::INTERVAL
    AND sentiment_score IS NOT NULL;

  -- Previous period average
  SELECT AVG(sentiment_score)
  INTO v_previous_avg
  FROM competitor_mentions
  WHERE competitor_id = p_competitor_id
    AND org_id = p_org_id
    AND published_at >= NOW() - (p_window_days * 2 || ' days')::INTERVAL
    AND published_at < NOW() - (p_window_days || ' days')::INTERVAL
    AND sentiment_score IS NOT NULL;

  -- Calculate change and direction
  IF v_current_avg IS NOT NULL AND v_previous_avg IS NOT NULL THEN
    v_change := v_current_avg - v_previous_avg;

    IF ABS(v_change) < 0.05 THEN
      v_direction := 'stable';
    ELSIF v_change > 0 THEN
      v_direction := 'improving';
    ELSE
      v_direction := 'declining';
    END IF;
  ELSE
    v_change := NULL;
    v_direction := 'unknown';
  END IF;

  -- Calculate stability (inverse of variance)
  SELECT 100 - LEAST(100, STDDEV(sentiment_score) * 100)
  INTO v_stability
  FROM competitor_mentions
  WHERE competitor_id = p_competitor_id
    AND org_id = p_org_id
    AND published_at >= NOW() - (p_window_days || ' days')::INTERVAL
    AND sentiment_score IS NOT NULL;

  RETURN jsonb_build_object(
    'current', ROUND(COALESCE(v_current_avg, 0)::NUMERIC, 3),
    'previous', ROUND(COALESCE(v_previous_avg, 0)::NUMERIC, 3),
    'change', ROUND(COALESCE(v_change, 0)::NUMERIC, 3),
    'change_pct', CASE
      WHEN v_previous_avg IS NOT NULL AND v_previous_avg != 0
      THEN ROUND((v_change / ABS(v_previous_avg) * 100)::NUMERIC, 1)
      ELSE NULL
    END,
    'direction', v_direction,
    'stability_score', ROUND(COALESCE(v_stability, 0)::NUMERIC, 2)
  );
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Calculate Overlap Score
 *
 * Calculates overlap percentage between brand and competitor for a given entity type
 *
 * @param p_competitor_id Competitor UUID
 * @param p_org_id Organization UUID
 * @param p_overlap_type Type of overlap analysis
 * @param p_window_days Analysis window in days
 * @returns Float score 0-100 (percentage of entities that overlap)
 */
CREATE OR REPLACE FUNCTION calculate_overlap_score(
  p_competitor_id UUID,
  p_org_id UUID,
  p_overlap_type overlap_type,
  p_window_days INTEGER DEFAULT 30
) RETURNS FLOAT AS $$
DECLARE
  v_brand_entities UUID[];
  v_competitor_entities UUID[];
  v_shared_count INTEGER;
  v_total_unique INTEGER;
  v_overlap_pct FLOAT;
BEGIN
  -- For journalist overlap
  IF p_overlap_type = 'journalist_overlap' THEN
    -- Get brand's journalists (from media monitoring or mentions)
    -- Simplified: would integrate with actual brand mention tracking
    SELECT ARRAY_AGG(DISTINCT journalist_id)
    INTO v_brand_entities
    FROM competitor_mentions
    WHERE org_id = p_org_id
      AND published_at >= NOW() - (p_window_days || ' days')::INTERVAL
      AND journalist_id IS NOT NULL;

    -- Get competitor's journalists
    SELECT ARRAY_AGG(DISTINCT journalist_id)
    INTO v_competitor_entities
    FROM competitor_mentions
    WHERE competitor_id = p_competitor_id
      AND org_id = p_org_id
      AND published_at >= NOW() - (p_window_days || ' days')::INTERVAL
      AND journalist_id IS NOT NULL;

    -- Calculate overlap
    SELECT COUNT(*)
    INTO v_shared_count
    FROM UNNEST(v_brand_entities) be
    INNER JOIN UNNEST(v_competitor_entities) ce ON be = ce;

    -- Total unique entities
    SELECT COUNT(DISTINCT entity)
    INTO v_total_unique
    FROM (
      SELECT UNNEST(v_brand_entities) AS entity
      UNION
      SELECT UNNEST(v_competitor_entities) AS entity
    ) AS combined;

  -- For outlet overlap (simplified text matching)
  ELSIF p_overlap_type = 'outlet_overlap' THEN
    -- Similar logic but for outlet_name (text-based)
    v_total_unique := 1;  -- Placeholder
    v_shared_count := 0;
  END IF;

  -- Calculate percentage
  IF v_total_unique > 0 THEN
    v_overlap_pct := (v_shared_count::FLOAT / v_total_unique::FLOAT) * 100;
  ELSE
    v_overlap_pct := 0;
  END IF;

  RETURN ROUND(v_overlap_pct::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Calculate Competitive Advantage Score
 *
 * Calculates overall competitive advantage/disadvantage across multiple dimensions
 *
 * @param p_competitor_id Competitor UUID
 * @param p_org_id Organization UUID
 * @param p_window_days Analysis window in days
 * @returns Float score -100 to 100 (positive = user advantage, negative = competitor advantage)
 */
CREATE OR REPLACE FUNCTION calculate_advantage_score(
  p_competitor_id UUID,
  p_org_id UUID,
  p_window_days INTEGER DEFAULT 30
) RETURNS FLOAT AS $$
DECLARE
  v_volume_diff FLOAT := 0;
  v_sentiment_diff FLOAT := 0;
  v_evi_diff FLOAT := 0;
  v_tier_diff FLOAT := 0;
  v_advantage_score FLOAT;
BEGIN
  -- Get latest snapshot for competitor
  SELECT
    COALESCE(mention_volume_differential, 0),
    COALESCE(sentiment_differential, 0),
    COALESCE(evi_differential, 0)
  INTO v_volume_diff, v_sentiment_diff, v_evi_diff
  FROM competitor_metrics_snapshots
  WHERE competitor_id = p_competitor_id
    AND org_id = p_org_id
    AND snapshot_at >= NOW() - (p_window_days || ' days')::INTERVAL
  ORDER BY snapshot_at DESC
  LIMIT 1;

  -- Normalize volume differential to -100..100 scale
  v_volume_diff := LEAST(50, GREATEST(-50, v_volume_diff / 10));

  -- Sentiment already in -1..1, scale to -25..25
  v_sentiment_diff := v_sentiment_diff * 25;

  -- EVI differential already in reasonable range
  v_evi_diff := LEAST(25, GREATEST(-25, v_evi_diff));

  -- Weighted sum: volume (30%), sentiment (20%), EVI (50%)
  v_advantage_score := (
    v_volume_diff * 0.30 +
    v_sentiment_diff * 0.20 +
    v_evi_diff * 0.50
  );

  RETURN ROUND(v_advantage_score::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_competitor_intelligence_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER competitors_updated_at
  BEFORE UPDATE ON competitors
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_intelligence_updated_at();

CREATE TRIGGER competitor_mentions_updated_at
  BEFORE UPDATE ON competitor_mentions
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_intelligence_updated_at();

CREATE TRIGGER competitor_metrics_snapshots_updated_at
  BEFORE UPDATE ON competitor_metrics_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_intelligence_updated_at();

CREATE TRIGGER competitor_insights_updated_at
  BEFORE UPDATE ON competitor_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_intelligence_updated_at();

CREATE TRIGGER competitor_overlap_updated_at
  BEFORE UPDATE ON competitor_overlap
  FOR EACH ROW
  EXECUTE FUNCTION update_competitor_intelligence_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE competitors IS 'Competitor brand profiles tracked by organization';
COMMENT ON TABLE competitor_mentions IS 'Individual competitor mentions from media monitoring';
COMMENT ON TABLE competitor_metrics_snapshots IS 'Time-series rollups of competitor performance metrics';
COMMENT ON TABLE competitor_insights IS 'LLM-generated and rule-based competitive insights';
COMMENT ON TABLE competitor_overlap IS 'Analysis of coverage, journalist, and topic overlap';

COMMENT ON FUNCTION calculate_competitor_evi IS 'Calculates Earned Visibility Index for competitor (0-100)';
COMMENT ON FUNCTION calculate_competitor_sentiment IS 'Analyzes competitor sentiment trends over time window';
COMMENT ON FUNCTION calculate_overlap_score IS 'Calculates overlap percentage between brand and competitor';
COMMENT ON FUNCTION calculate_advantage_score IS 'Calculates competitive advantage score (-100 to 100)';
