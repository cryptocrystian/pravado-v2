/**
 * Migration 56: Audience Persona Builder Schema
 * Sprint S51: Create tables for persona building, traits extraction, and multi-source insights
 *
 * Tables:
 * - audience_personas: Core persona records with demographics and scoring
 * - audience_persona_traits: Extracted traits (skills, demographics, psychographics)
 * - audience_persona_insights: Multi-source insights from S38-S50 systems
 * - audience_persona_history: Historical snapshots for trend tracking
 */

-- ========================================
-- Table: audience_personas
-- Core persona records with identity, demographics, and scoring
-- ========================================

CREATE TABLE IF NOT EXISTS audience_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  persona_type TEXT NOT NULL DEFAULT 'primary_audience', -- 'primary_audience', 'secondary_audience', 'stakeholder', 'influencer'

  -- Demographics
  role TEXT, -- Job title
  industry TEXT,
  company_size TEXT, -- 'startup', 'smb', 'enterprise'
  seniority_level TEXT, -- 'individual_contributor', 'manager', 'director', 'executive', 'c_level'
  location TEXT,

  -- Metadata
  tags JSONB DEFAULT '[]'::JSONB, -- Array of tag strings
  custom_fields JSONB DEFAULT '{}'::JSONB, -- Flexible custom data

  -- Scoring
  relevance_score FLOAT DEFAULT 0.0, -- 0-100, how relevant to org's messaging
  engagement_score FLOAT DEFAULT 0.0, -- 0-100, predicted engagement level
  alignment_score FLOAT DEFAULT 0.0, -- 0-100, alignment with brand values
  overall_score FLOAT DEFAULT 0.0, -- 0-100, weighted composite score

  -- Source Tracking
  generation_method TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'llm_assisted', 'auto_extracted'
  llm_model TEXT, -- e.g., 'gpt-4', 'claude-3-opus'
  source_count INTEGER DEFAULT 0, -- Number of insights aggregated
  last_enriched_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived', 'merged'
  is_validated BOOLEAN DEFAULT FALSE,
  merged_into_id UUID REFERENCES audience_personas(id) ON DELETE SET NULL,

  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audience_personas
CREATE INDEX idx_personas_org ON audience_personas(org_id);
CREATE INDEX idx_personas_org_updated ON audience_personas(org_id, updated_at DESC);
CREATE INDEX idx_personas_type ON audience_personas(persona_type);
CREATE INDEX idx_personas_role ON audience_personas(role);
CREATE INDEX idx_personas_industry ON audience_personas(industry);
CREATE INDEX idx_personas_seniority ON audience_personas(seniority_level);
CREATE INDEX idx_personas_status ON audience_personas(status);
CREATE INDEX idx_personas_overall_score ON audience_personas(overall_score DESC);
CREATE INDEX idx_personas_relevance_score ON audience_personas(relevance_score DESC);
CREATE INDEX idx_personas_tags ON audience_personas USING GIN(tags);
CREATE INDEX idx_personas_created ON audience_personas(created_at DESC);
CREATE INDEX idx_personas_updated ON audience_personas(updated_at DESC);

-- Full-text search index
CREATE INDEX idx_personas_search ON audience_personas
  USING GIN(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(role, '') || ' ' || coalesce(industry, '')));

-- ========================================
-- Table: audience_persona_traits
-- Extracted traits: skills, demographics, psychographics
-- ========================================

CREATE TABLE IF NOT EXISTS audience_persona_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES audience_personas(id) ON DELETE CASCADE,

  -- Trait Classification
  trait_category TEXT NOT NULL, -- 'skill', 'demographic', 'psychographic', 'behavioral', 'interest'
  trait_type TEXT NOT NULL, -- 'hard_skill', 'soft_skill', 'goal', 'pain_point', 'motivation', 'value', 'preference'

  -- Trait Data
  trait_name TEXT NOT NULL,
  trait_value TEXT, -- The actual trait value or description
  trait_strength FLOAT DEFAULT 0.5, -- 0-1, confidence/importance of this trait

  -- Source Attribution
  source_type TEXT, -- 'press_release', 'pitch', 'media_mention', 'content', 'journalist_interaction', 'manual'
  source_id UUID, -- ID of source entity
  extraction_method TEXT DEFAULT 'manual', -- 'manual', 'llm', 'deterministic'
  extraction_confidence FLOAT, -- 0-1, LLM extraction confidence

  -- Context
  context_snippet TEXT, -- Supporting text/evidence
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE, -- Is this a primary/defining trait?

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audience_persona_traits
CREATE INDEX idx_traits_org ON audience_persona_traits(org_id);
CREATE INDEX idx_traits_persona ON audience_persona_traits(persona_id);
CREATE INDEX idx_traits_category ON audience_persona_traits(trait_category);
CREATE INDEX idx_traits_type ON audience_persona_traits(trait_type);
CREATE INDEX idx_traits_strength ON audience_persona_traits(trait_strength DESC);
CREATE INDEX idx_traits_verified ON audience_persona_traits(is_verified);
CREATE INDEX idx_traits_primary ON audience_persona_traits(is_primary);
CREATE INDEX idx_traits_created ON audience_persona_traits(created_at DESC);

-- Composite index for persona trait queries
CREATE INDEX idx_traits_persona_category ON audience_persona_traits(persona_id, trait_category);

-- ========================================
-- Table: audience_persona_insights
-- Multi-source insights aggregated from S38-S50 systems
-- ========================================

CREATE TABLE IF NOT EXISTS audience_persona_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES audience_personas(id) ON DELETE CASCADE,

  -- Insight Classification
  insight_type TEXT NOT NULL, -- 'content_preference', 'media_consumption', 'engagement_pattern', 'pain_point', 'opportunity'
  insight_category TEXT, -- 'behavioral', 'attitudinal', 'contextual'

  -- Insight Data
  insight_title TEXT NOT NULL,
  insight_description TEXT,
  insight_data JSONB DEFAULT '{}'::JSONB, -- Structured insight data

  -- Source Attribution (Multi-source aggregation)
  source_system TEXT NOT NULL, -- 'press_release_gen', 'pr_pitch', 'media_monitoring', 'journalist_discovery', 'content_analysis'
  source_id UUID, -- ID from source system
  source_reference TEXT, -- URL or reference

  -- Confidence & Impact
  confidence_score FLOAT DEFAULT 0.5, -- 0-1, confidence in this insight
  impact_score FLOAT DEFAULT 0.5, -- 0-1, predicted impact on persona understanding
  freshness_score FLOAT DEFAULT 1.0, -- 0-1, how recent/relevant this insight is

  -- Temporal Context
  observed_at TIMESTAMPTZ, -- When this insight was observed
  valid_until TIMESTAMPTZ, -- When this insight expires (if temporal)

  -- Evidence
  supporting_evidence JSONB DEFAULT '[]'::JSONB, -- Array of evidence objects
  evidence_count INTEGER DEFAULT 0,

  -- Status
  is_validated BOOLEAN DEFAULT FALSE,
  is_actionable BOOLEAN DEFAULT FALSE, -- Can this insight drive actions?

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audience_persona_insights
CREATE INDEX idx_insights_org ON audience_persona_insights(org_id);
CREATE INDEX idx_insights_persona ON audience_persona_insights(persona_id);
CREATE INDEX idx_insights_type ON audience_persona_insights(insight_type);
CREATE INDEX idx_insights_category ON audience_persona_insights(insight_category);
CREATE INDEX idx_insights_source_system ON audience_persona_insights(source_system);
CREATE INDEX idx_insights_confidence ON audience_persona_insights(confidence_score DESC);
CREATE INDEX idx_insights_impact ON audience_persona_insights(impact_score DESC);
CREATE INDEX idx_insights_freshness ON audience_persona_insights(freshness_score DESC);
CREATE INDEX idx_insights_actionable ON audience_persona_insights(is_actionable);
CREATE INDEX idx_insights_observed ON audience_persona_insights(observed_at DESC);
CREATE INDEX idx_insights_created ON audience_persona_insights(created_at DESC);

-- Composite index for persona insight queries
CREATE INDEX idx_insights_persona_type ON audience_persona_insights(persona_id, insight_type);

-- ========================================
-- Table: audience_persona_history
-- Historical snapshots for tracking persona evolution
-- ========================================

CREATE TABLE IF NOT EXISTS audience_persona_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  persona_id UUID NOT NULL REFERENCES audience_personas(id) ON DELETE CASCADE,

  -- Snapshot Data
  snapshot_type TEXT NOT NULL, -- 'manual_update', 'auto_enrichment', 'score_recalculation', 'trait_extraction', 'insight_aggregation'
  snapshot_data JSONB NOT NULL, -- Full persona state at this point

  -- Change Tracking
  changed_fields TEXT[], -- Array of field names that changed
  change_summary TEXT, -- Human-readable summary
  change_magnitude FLOAT, -- 0-1, how significant the change was

  -- Scores Snapshot
  previous_relevance_score FLOAT,
  new_relevance_score FLOAT,
  previous_engagement_score FLOAT,
  new_engagement_score FLOAT,
  previous_alignment_score FLOAT,
  new_alignment_score FLOAT,
  previous_overall_score FLOAT,
  new_overall_score FLOAT,

  -- Context
  trigger_event TEXT, -- What triggered this snapshot
  trigger_source TEXT, -- System or user that triggered it

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB,

  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audience_persona_history
CREATE INDEX idx_history_org ON audience_persona_history(org_id);
CREATE INDEX idx_history_persona ON audience_persona_history(persona_id);
CREATE INDEX idx_history_persona_created ON audience_persona_history(persona_id, created_at DESC);
CREATE INDEX idx_history_type ON audience_persona_history(snapshot_type);
CREATE INDEX idx_history_created ON audience_persona_history(created_at DESC);
CREATE INDEX idx_history_magnitude ON audience_persona_history(change_magnitude DESC);

-- ========================================
-- Helper Functions
-- ========================================

/**
 * Calculate overall persona score from component scores
 * Weights: Relevance 40%, Engagement 35%, Alignment 25%
 */
CREATE OR REPLACE FUNCTION calculate_persona_overall_score(
  p_relevance FLOAT,
  p_engagement FLOAT,
  p_alignment FLOAT
)
RETURNS FLOAT AS $$
BEGIN
  RETURN (
    (COALESCE(p_relevance, 0) * 0.40) +
    (COALESCE(p_engagement, 0) * 0.35) +
    (COALESCE(p_alignment, 0) * 0.25)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

/**
 * Auto-update persona overall score
 */
CREATE OR REPLACE FUNCTION update_persona_overall_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.overall_score := calculate_persona_overall_score(
    NEW.relevance_score,
    NEW.engagement_score,
    NEW.alignment_score
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

/**
 * Get persona trait distribution by category
 */
CREATE OR REPLACE FUNCTION get_persona_trait_distribution(p_persona_id UUID)
RETURNS TABLE (
  trait_category TEXT,
  trait_count BIGINT,
  avg_strength FLOAT,
  verified_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.trait_category,
    COUNT(*)::BIGINT AS trait_count,
    AVG(t.trait_strength)::FLOAT AS avg_strength,
    COUNT(*) FILTER (WHERE t.is_verified)::BIGINT AS verified_count
  FROM audience_persona_traits t
  WHERE t.persona_id = p_persona_id
  GROUP BY t.trait_category
  ORDER BY trait_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get persona insights summary by source system
 */
CREATE OR REPLACE FUNCTION get_persona_insights_summary(p_persona_id UUID)
RETURNS TABLE (
  source_system TEXT,
  insight_count BIGINT,
  avg_confidence FLOAT,
  avg_impact FLOAT,
  actionable_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.source_system,
    COUNT(*)::BIGINT AS insight_count,
    AVG(i.confidence_score)::FLOAT AS avg_confidence,
    AVG(i.impact_score)::FLOAT AS avg_impact,
    COUNT(*) FILTER (WHERE i.is_actionable)::BIGINT AS actionable_count
  FROM audience_persona_insights i
  WHERE i.persona_id = p_persona_id
  GROUP BY i.source_system
  ORDER BY insight_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get persona trend data (6 dimensions: scores over time)
 */
CREATE OR REPLACE FUNCTION get_persona_trends(
  p_persona_id UUID,
  p_days_back INTEGER DEFAULT 90
)
RETURNS TABLE (
  snapshot_date DATE,
  relevance_score FLOAT,
  engagement_score FLOAT,
  alignment_score FLOAT,
  overall_score FLOAT,
  trait_count BIGINT,
  insight_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(h.created_at) AS snapshot_date,
    AVG(h.new_relevance_score)::FLOAT AS relevance_score,
    AVG(h.new_engagement_score)::FLOAT AS engagement_score,
    AVG(h.new_alignment_score)::FLOAT AS alignment_score,
    AVG(h.new_overall_score)::FLOAT AS overall_score,
    COUNT(DISTINCT t.id)::BIGINT AS trait_count,
    COUNT(DISTINCT i.id)::BIGINT AS insight_count
  FROM audience_persona_history h
  LEFT JOIN audience_persona_traits t ON t.persona_id = h.persona_id AND DATE(t.created_at) = DATE(h.created_at)
  LEFT JOIN audience_persona_insights i ON i.persona_id = h.persona_id AND DATE(i.created_at) = DATE(h.created_at)
  WHERE h.persona_id = p_persona_id
    AND h.created_at >= NOW() - INTERVAL '1 day' * p_days_back
  GROUP BY DATE(h.created_at)
  ORDER BY snapshot_date DESC;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Calculate persona comparison similarity score
 * Compares traits and scores to produce a 0-100 similarity score
 */
CREATE OR REPLACE FUNCTION calculate_persona_similarity(
  p_persona_id_1 UUID,
  p_persona_id_2 UUID
)
RETURNS FLOAT AS $$
DECLARE
  v_score_similarity FLOAT := 0;
  v_trait_similarity FLOAT := 0;
  v_overall_similarity FLOAT;
  v_common_traits BIGINT;
  v_total_traits BIGINT;
BEGIN
  -- Calculate score similarity (0-40 points)
  SELECT
    100 - (
      (ABS(COALESCE(p1.relevance_score, 0) - COALESCE(p2.relevance_score, 0)) * 0.4) +
      (ABS(COALESCE(p1.engagement_score, 0) - COALESCE(p2.engagement_score, 0)) * 0.35) +
      (ABS(COALESCE(p1.alignment_score, 0) - COALESCE(p2.alignment_score, 0)) * 0.25)
    )
  INTO v_score_similarity
  FROM audience_personas p1, audience_personas p2
  WHERE p1.id = p_persona_id_1 AND p2.id = p_persona_id_2;

  -- Calculate trait similarity (0-60 points)
  SELECT
    COUNT(DISTINCT t1.trait_name)
  INTO v_common_traits
  FROM audience_persona_traits t1
  JOIN audience_persona_traits t2 ON t1.trait_name = t2.trait_name AND t1.trait_category = t2.trait_category
  WHERE t1.persona_id = p_persona_id_1
    AND t2.persona_id = p_persona_id_2;

  SELECT
    COUNT(DISTINCT trait_name)
  INTO v_total_traits
  FROM audience_persona_traits
  WHERE persona_id IN (p_persona_id_1, p_persona_id_2);

  IF v_total_traits > 0 THEN
    v_trait_similarity := (v_common_traits::FLOAT / v_total_traits::FLOAT) * 60;
  END IF;

  v_overall_similarity := (v_score_similarity * 0.4) + (v_trait_similarity);

  RETURN v_overall_similarity;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Aggregate persona insights from multiple source systems
 * Updates persona scores and source count
 */
CREATE OR REPLACE FUNCTION aggregate_persona_insights(p_persona_id UUID)
RETURNS VOID AS $$
DECLARE
  v_source_count INTEGER;
  v_avg_confidence FLOAT;
  v_relevance_score FLOAT;
  v_engagement_score FLOAT;
BEGIN
  -- Count unique source systems
  SELECT COUNT(DISTINCT source_system)
  INTO v_source_count
  FROM audience_persona_insights
  WHERE persona_id = p_persona_id;

  -- Calculate weighted scores from insights
  SELECT
    AVG(confidence_score * impact_score * CASE WHEN is_actionable THEN 1.2 ELSE 1.0 END)
  INTO v_avg_confidence
  FROM audience_persona_insights
  WHERE persona_id = p_persona_id;

  -- Update persona
  UPDATE audience_personas
  SET
    source_count = v_source_count,
    last_enriched_at = NOW(),
    relevance_score = LEAST(100, COALESCE(v_avg_confidence, 0) * 100),
    engagement_score = LEAST(100, COALESCE(v_avg_confidence, 0) * 85)
  WHERE id = p_persona_id;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Triggers
-- ========================================

/**
 * Auto-update updated_at timestamp
 */
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personas_updated_at
  BEFORE UPDATE ON audience_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER traits_updated_at
  BEFORE UPDATE ON audience_persona_traits
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER insights_updated_at
  BEFORE UPDATE ON audience_persona_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

/**
 * Auto-calculate overall score on insert/update
 */
CREATE TRIGGER personas_overall_score
  BEFORE INSERT OR UPDATE OF relevance_score, engagement_score, alignment_score ON audience_personas
  FOR EACH ROW
  EXECUTE FUNCTION update_persona_overall_score();

/**
 * Create history snapshot on significant persona updates
 */
CREATE OR REPLACE FUNCTION create_persona_history_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_changed_fields TEXT[];
  v_change_magnitude FLOAT;
BEGIN
  -- Detect changed fields
  v_changed_fields := ARRAY[]::TEXT[];

  IF OLD.relevance_score IS DISTINCT FROM NEW.relevance_score THEN
    v_changed_fields := array_append(v_changed_fields, 'relevance_score');
  END IF;
  IF OLD.engagement_score IS DISTINCT FROM NEW.engagement_score THEN
    v_changed_fields := array_append(v_changed_fields, 'engagement_score');
  END IF;
  IF OLD.alignment_score IS DISTINCT FROM NEW.alignment_score THEN
    v_changed_fields := array_append(v_changed_fields, 'alignment_score');
  END IF;

  -- Calculate change magnitude
  v_change_magnitude := (
    ABS(COALESCE(NEW.relevance_score, 0) - COALESCE(OLD.relevance_score, 0)) +
    ABS(COALESCE(NEW.engagement_score, 0) - COALESCE(OLD.engagement_score, 0)) +
    ABS(COALESCE(NEW.alignment_score, 0) - COALESCE(OLD.alignment_score, 0))
  ) / 300.0; -- Normalize to 0-1

  -- Only create snapshot if significant change (>5% or field changes)
  IF v_change_magnitude > 0.05 OR array_length(v_changed_fields, 1) > 0 THEN
    INSERT INTO audience_persona_history (
      org_id,
      persona_id,
      snapshot_type,
      snapshot_data,
      changed_fields,
      change_magnitude,
      previous_relevance_score,
      new_relevance_score,
      previous_engagement_score,
      new_engagement_score,
      previous_alignment_score,
      new_alignment_score,
      previous_overall_score,
      new_overall_score,
      trigger_event,
      trigger_source
    ) VALUES (
      NEW.org_id,
      NEW.id,
      'auto_enrichment',
      row_to_json(NEW)::JSONB,
      v_changed_fields,
      v_change_magnitude,
      OLD.relevance_score,
      NEW.relevance_score,
      OLD.engagement_score,
      NEW.engagement_score,
      OLD.alignment_score,
      NEW.alignment_score,
      OLD.overall_score,
      NEW.overall_score,
      'persona_update',
      'system'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER personas_history_snapshot
  AFTER UPDATE ON audience_personas
  FOR EACH ROW
  EXECUTE FUNCTION create_persona_history_snapshot();

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE audience_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_persona_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_persona_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_persona_history ENABLE ROW LEVEL SECURITY;

-- Personas RLS
CREATE POLICY personas_org_isolation ON audience_personas
  FOR ALL USING (org_id = auth.uid());

-- Traits RLS
CREATE POLICY traits_org_isolation ON audience_persona_traits
  FOR ALL USING (org_id = auth.uid());

-- Insights RLS
CREATE POLICY insights_org_isolation ON audience_persona_insights
  FOR ALL USING (org_id = auth.uid());

-- History RLS
CREATE POLICY history_org_isolation ON audience_persona_history
  FOR ALL USING (org_id = auth.uid());

-- ========================================
-- Comments
-- ========================================

COMMENT ON TABLE audience_personas IS 'Core audience persona records with demographics, scoring, and multi-source enrichment';
COMMENT ON TABLE audience_persona_traits IS 'Extracted traits including skills, demographics, psychographics from various sources';
COMMENT ON TABLE audience_persona_insights IS 'Multi-source insights aggregated from press releases, pitches, media monitoring, and journalist interactions';
COMMENT ON TABLE audience_persona_history IS 'Historical snapshots tracking persona evolution and score changes over time';

COMMENT ON FUNCTION calculate_persona_overall_score IS 'Calculate weighted overall score from component scores (40% relevance, 35% engagement, 25% alignment)';
COMMENT ON FUNCTION get_persona_trait_distribution IS 'Get trait statistics grouped by category for a persona';
COMMENT ON FUNCTION get_persona_insights_summary IS 'Get insights summary grouped by source system for a persona';
COMMENT ON FUNCTION get_persona_trends IS 'Get historical trend data across 6 dimensions for a persona';
COMMENT ON FUNCTION calculate_persona_similarity IS 'Calculate similarity score (0-100) between two personas based on scores and traits';
COMMENT ON FUNCTION aggregate_persona_insights IS 'Aggregate insights from multiple sources to update persona scores';
