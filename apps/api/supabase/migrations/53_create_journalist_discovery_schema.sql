/**
 * Migration 53: Journalist Discovery Engine Schema (Sprint S48)
 *
 * Automatically discovers new journalists from:
 * - Article authors (S40/S41)
 * - Social profiles (Twitter/X, LinkedIn, Mastodon)
 * - Outlet staff directories
 * - Web footprints
 *
 * Integrates with S46 Journalist Identity Graph for deduplication
 * and enrichment.
 */

-- =====================================================
-- Table: discovered_journalists
-- =====================================================

CREATE TABLE IF NOT EXISTS discovered_journalists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Basic journalist info
  full_name TEXT NOT NULL,
  email TEXT,
  outlet TEXT,

  -- Discovery metadata
  social_links JSONB DEFAULT '{}',
  beats TEXT[] DEFAULT '{}',
  bio TEXT,

  -- Confidence & scoring
  confidence_score FLOAT NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  confidence_breakdown JSONB DEFAULT '{}',

  -- Source tracking
  source_type TEXT NOT NULL CHECK (source_type IN ('article_author', 'rss_feed', 'social_profile', 'staff_directory')),
  source_url TEXT,
  raw_payload JSONB DEFAULT '{}',

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'merged', 'rejected')),
  merged_into UUID REFERENCES journalist_profiles(id) ON DELETE SET NULL,

  -- Resolution tracking
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Suggested matches (for deduplication)
  suggested_matches JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

-- Org-level isolation for RLS
CREATE INDEX idx_discovered_journalists_org_id
  ON discovered_journalists(org_id);

-- Status filtering (most common query)
CREATE INDEX idx_discovered_journalists_status
  ON discovered_journalists(status);

-- Composite for common queries
CREATE INDEX idx_discovered_journalists_org_status
  ON discovered_journalists(org_id, status);

-- Source type filtering
CREATE INDEX idx_discovered_journalists_source_type
  ON discovered_journalists(source_type);

-- Email lookups for deduplication
CREATE INDEX idx_discovered_journalists_email
  ON discovered_journalists(email) WHERE email IS NOT NULL;

-- Full-text search on name
CREATE INDEX idx_discovered_journalists_name
  ON discovered_journalists USING gin(to_tsvector('english', full_name));

-- Beats array search
CREATE INDEX idx_discovered_journalists_beats
  ON discovered_journalists USING gin(beats);

-- Social links JSON search
CREATE INDEX idx_discovered_journalists_social_links
  ON discovered_journalists USING gin(social_links);

-- Suggested matches JSON search
CREATE INDEX idx_discovered_journalists_suggested_matches
  ON discovered_journalists USING gin(suggested_matches);

-- Created date for sorting
CREATE INDEX idx_discovered_journalists_created_at_desc
  ON discovered_journalists(created_at DESC);

-- Merged journalist lookups
CREATE INDEX idx_discovered_journalists_merged_into
  ON discovered_journalists(merged_into) WHERE merged_into IS NOT NULL;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE discovered_journalists ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view discoveries for their org
CREATE POLICY discovered_journalists_select_policy ON discovered_journalists
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can create discoveries for their org
CREATE POLICY discovered_journalists_insert_policy ON discovered_journalists
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update discoveries in their org
CREATE POLICY discovered_journalists_update_policy ON discovered_journalists
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete discoveries in their org
CREATE POLICY discovered_journalists_delete_policy ON discovered_journalists
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Helper Functions
-- =====================================================

/**
 * Auto-update updated_at timestamp
 */
CREATE OR REPLACE FUNCTION update_discovered_journalists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER discovered_journalists_updated_at_trigger
  BEFORE UPDATE ON discovered_journalists
  FOR EACH ROW
  EXECUTE FUNCTION update_discovered_journalists_updated_at();

/**
 * Get discovery statistics for an org
 */
CREATE OR REPLACE FUNCTION get_discovery_stats(p_org_id UUID)
RETURNS TABLE (
  total_discoveries BIGINT,
  pending_count BIGINT,
  confirmed_count BIGINT,
  merged_count BIGINT,
  rejected_count BIGINT,
  avg_confidence_score FLOAT,
  source_type_distribution JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_discoveries,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_count,
    COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT AS confirmed_count,
    COUNT(*) FILTER (WHERE status = 'merged')::BIGINT AS merged_count,
    COUNT(*) FILTER (WHERE status = 'rejected')::BIGINT AS rejected_count,
    AVG(confidence_score)::FLOAT AS avg_confidence_score,
    (
      SELECT jsonb_object_agg(source_type, cnt)
      FROM (
        SELECT source_type, COUNT(*) AS cnt
        FROM discovered_journalists
        WHERE org_id = p_org_id
        GROUP BY source_type
      ) source_counts
    ) AS source_type_distribution
  FROM discovered_journalists
  WHERE org_id = p_org_id;
END;
$$ LANGUAGE plpgsql;

/**
 * Find potential duplicate discoveries
 * Uses email, name similarity, and outlet matching
 */
CREATE OR REPLACE FUNCTION find_duplicate_discoveries(
  p_org_id UUID,
  p_full_name TEXT,
  p_email TEXT DEFAULT NULL,
  p_outlet TEXT DEFAULT NULL
)
RETURNS TABLE (
  discovery_id UUID,
  similarity_score FLOAT,
  match_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id AS discovery_id,
    CASE
      -- Exact email match (highest confidence)
      WHEN p_email IS NOT NULL AND d.email = p_email THEN 1.0
      -- Exact name + outlet match
      WHEN LOWER(d.full_name) = LOWER(p_full_name) AND
           p_outlet IS NOT NULL AND LOWER(d.outlet) = LOWER(p_outlet) THEN 0.95
      -- Exact name match
      WHEN LOWER(d.full_name) = LOWER(p_full_name) THEN 0.85
      -- Similar name (using similarity function)
      WHEN similarity(LOWER(d.full_name), LOWER(p_full_name)) > 0.7 THEN
        similarity(LOWER(d.full_name), LOWER(p_full_name))
      ELSE 0.0
    END AS similarity_score,
    CASE
      WHEN p_email IS NOT NULL AND d.email = p_email THEN 'Exact email match'
      WHEN LOWER(d.full_name) = LOWER(p_full_name) AND
           p_outlet IS NOT NULL AND LOWER(d.outlet) = LOWER(p_outlet) THEN 'Exact name + outlet match'
      WHEN LOWER(d.full_name) = LOWER(p_full_name) THEN 'Exact name match'
      WHEN similarity(LOWER(d.full_name), LOWER(p_full_name)) > 0.7 THEN 'Similar name'
      ELSE 'Low similarity'
    END AS match_reason
  FROM discovered_journalists d
  WHERE d.org_id = p_org_id
    AND d.status IN ('pending', 'confirmed')
    AND (
      -- Email match
      (p_email IS NOT NULL AND d.email = p_email)
      OR
      -- Name similarity
      (similarity(LOWER(d.full_name), LOWER(p_full_name)) > 0.7)
    )
  ORDER BY similarity_score DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Enable pg_trgm extension for similarity function (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- Sample Data Comments
-- =====================================================

COMMENT ON TABLE discovered_journalists IS
  'Automatically discovered journalists awaiting confirmation or merge into the journalist graph (S46)';

COMMENT ON COLUMN discovered_journalists.confidence_score IS
  'Overall confidence score (0-1) based on data quality, source reliability, and match signals';

COMMENT ON COLUMN discovered_journalists.confidence_breakdown IS
  'JSONB containing scores for: nameConfidence, emailConfidence, outletConfidence, socialConfidence, beatConfidence';

COMMENT ON COLUMN discovered_journalists.social_links IS
  'JSONB containing: { "twitter": "handle", "linkedin": "url", "mastodon": "handle@instance" }';

COMMENT ON COLUMN discovered_journalists.suggested_matches IS
  'Array of potential duplicate journalist_profile matches with similarity scores';

COMMENT ON COLUMN discovered_journalists.raw_payload IS
  'Original data from discovery source (article metadata, social profile, etc.)';

COMMENT ON COLUMN discovered_journalists.status IS
  'Workflow status: pending (needs review), confirmed (vetted, ready to merge), merged (attached to graph), rejected (not a journalist)';

COMMENT ON COLUMN discovered_journalists.merged_into IS
  'If merged, references the journalist_profiles.id this discovery was merged into';

-- =====================================================
-- Completion
-- =====================================================

-- Migration complete
SELECT 'Migration 53: Journalist Discovery Engine Schema - COMPLETE' AS status;
