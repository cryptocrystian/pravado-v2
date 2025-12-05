/**
 * Migration 52: Media Lists Schema (Sprint S47)
 * AI-powered media list builder with fit scoring
 */

-- ===================================
-- Media Lists Table
-- ===================================

CREATE TABLE IF NOT EXISTS media_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  
  -- List metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- Generation input
  input_topic TEXT NOT NULL,
  input_keywords TEXT[] DEFAULT '{}',
  input_market TEXT,
  input_geography TEXT,
  input_product TEXT,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_media_lists_org ON media_lists(org_id, created_at DESC);
CREATE INDEX idx_media_lists_topic ON media_lists(org_id, input_topic);
CREATE INDEX idx_media_lists_created_by ON media_lists(org_id, created_by);

-- RLS Policies
ALTER TABLE media_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_lists_org_isolation ON media_lists
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
  ));

-- ===================================
-- Media List Entries Table
-- ===================================

CREATE TABLE IF NOT EXISTS media_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES media_lists(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,
  
  -- Scoring
  fit_score FLOAT NOT NULL CHECK (fit_score BETWEEN 0 AND 1),
  tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C', 'D')),
  
  -- Explanation
  reason TEXT NOT NULL,
  fit_breakdown JSONB DEFAULT '{}',
  
  -- Metadata
  position INTEGER, -- for manual reordering
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_media_list_entries_list ON media_list_entries(list_id, fit_score DESC);
CREATE INDEX idx_media_list_entries_journalist ON media_list_entries(journalist_id);
CREATE INDEX idx_media_list_entries_tier ON media_list_entries(list_id, tier, fit_score DESC);

-- RLS Policies
ALTER TABLE media_list_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_list_entries_org_isolation ON media_list_entries
  FOR ALL
  USING (list_id IN (
    SELECT id FROM media_lists WHERE org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  ));

-- ===================================
-- Helper Functions
-- ===================================

/**
 * Get media list with entry counts
 */
CREATE OR REPLACE FUNCTION get_media_list_summary(
  p_list_id UUID
)
RETURNS TABLE(
  id UUID,
  org_id UUID,
  name TEXT,
  description TEXT,
  input_topic TEXT,
  input_keywords TEXT[],
  input_market TEXT,
  input_geography TEXT,
  input_product TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_entries INTEGER,
  tier_a_count INTEGER,
  tier_b_count INTEGER,
  tier_c_count INTEGER,
  tier_d_count INTEGER,
  avg_fit_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ml.id,
    ml.org_id,
    ml.name,
    ml.description,
    ml.input_topic,
    ml.input_keywords,
    ml.input_market,
    ml.input_geography,
    ml.input_product,
    ml.created_by,
    ml.created_at,
    ml.updated_at,
    COUNT(mle.id)::INTEGER as total_entries,
    COUNT(mle.id) FILTER (WHERE mle.tier = 'A')::INTEGER as tier_a_count,
    COUNT(mle.id) FILTER (WHERE mle.tier = 'B')::INTEGER as tier_b_count,
    COUNT(mle.id) FILTER (WHERE mle.tier = 'C')::INTEGER as tier_c_count,
    COUNT(mle.id) FILTER (WHERE mle.tier = 'D')::INTEGER as tier_d_count,
    COALESCE(AVG(mle.fit_score), 0.0)::FLOAT as avg_fit_score
  FROM media_lists ml
  LEFT JOIN media_list_entries mle ON ml.id = mle.list_id
  WHERE ml.id = p_list_id
  GROUP BY ml.id;
END;
$$;

/**
 * Get top journalists for a topic using fit scoring
 * This is a simplified version - full logic in mediaListService
 */
CREATE OR REPLACE FUNCTION find_journalists_for_topic(
  p_org_id UUID,
  p_topic TEXT,
  p_keywords TEXT[],
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  journalist_id UUID,
  full_name TEXT,
  primary_email TEXT,
  primary_outlet TEXT,
  beat TEXT,
  engagement_score FLOAT,
  relevance_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jp.id as journalist_id,
    jp.full_name,
    jp.primary_email,
    jp.primary_outlet,
    jp.beat,
    jp.engagement_score,
    jp.relevance_score
  FROM journalist_profiles jp
  WHERE jp.org_id = p_org_id
    AND (
      jp.beat ILIKE '%' || p_topic || '%'
      OR jp.bio ILIKE '%' || p_topic || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(p_keywords) kw
        WHERE jp.beat ILIKE '%' || kw || '%'
          OR jp.bio ILIKE '%' || kw || '%'
      )
    )
  ORDER BY jp.engagement_score DESC, jp.relevance_score DESC
  LIMIT p_limit;
END;
$$;

-- ===================================
-- Triggers
-- ===================================

-- Update updated_at on media_lists
CREATE OR REPLACE FUNCTION update_media_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_lists_updated_at
  BEFORE UPDATE ON media_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_media_lists_updated_at();
