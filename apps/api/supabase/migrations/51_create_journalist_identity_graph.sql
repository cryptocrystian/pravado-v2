/**
 * Migration 51: Journalist Identity Graph Schema (Sprint S46)
 *
 * Unifies journalist data across S38-S45:
 * - Identity resolution & deduplication
 * - Activity tracking across all PR systems
 * - Engagement & relevance scoring
 * - Graph-based intelligence layer
 */

-- =============================================
-- Table: journalist_profiles
-- Primary identity record for journalists
-- =============================================

CREATE TABLE IF NOT EXISTS journalist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Identity fields
  full_name TEXT NOT NULL,
  primary_email TEXT NOT NULL,
  secondary_emails TEXT[] DEFAULT '{}',

  -- Professional info
  primary_outlet TEXT,
  beat TEXT,
  twitter_handle TEXT,
  linkedin_url TEXT,
  website_url TEXT,

  -- Activity tracking
  last_activity_at TIMESTAMPTZ,

  -- Scoring (V1 stubs, calculated by service)
  engagement_score FLOAT DEFAULT 0.0,
  responsiveness_score FLOAT DEFAULT 0.0,
  relevance_score FLOAT DEFAULT 0.0,

  -- Flexible metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT journalist_profiles_org_email_unique UNIQUE (org_id, primary_email)
);

-- Indexes for journalist_profiles
CREATE INDEX idx_journalist_profiles_org_id ON journalist_profiles(org_id);
CREATE INDEX idx_journalist_profiles_primary_email ON journalist_profiles(primary_email);
CREATE INDEX idx_journalist_profiles_primary_outlet ON journalist_profiles(primary_outlet);
CREATE INDEX idx_journalist_profiles_beat ON journalist_profiles(beat);
CREATE INDEX idx_journalist_profiles_engagement_score ON journalist_profiles(engagement_score DESC);
CREATE INDEX idx_journalist_profiles_relevance_score ON journalist_profiles(relevance_score DESC);
CREATE INDEX idx_journalist_profiles_last_activity_at ON journalist_profiles(last_activity_at DESC);

-- =============================================
-- Table: journalist_merge_map
-- Tracks merged/deduplicated profiles
-- =============================================

CREATE TABLE IF NOT EXISTS journalist_merge_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Merge relationship
  surviving_journalist_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,
  merged_journalist_id UUID NOT NULL,

  -- Merge metadata
  merge_reason TEXT NOT NULL,
  merged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  merged_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Store original data before merge
  original_data JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT journalist_merge_map_unique_merge UNIQUE (org_id, merged_journalist_id)
);

-- Indexes for journalist_merge_map
CREATE INDEX idx_journalist_merge_map_org_id ON journalist_merge_map(org_id);
CREATE INDEX idx_journalist_merge_map_surviving ON journalist_merge_map(surviving_journalist_id);
CREATE INDEX idx_journalist_merge_map_merged ON journalist_merge_map(merged_journalist_id);

-- =============================================
-- Table: journalist_activity_log
-- Cross-system activity tracking
-- =============================================

CREATE TABLE IF NOT EXISTS journalist_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,

  -- Activity metadata
  activity_type TEXT NOT NULL, -- 'press_release_sent' | 'pitch_sent' | 'outreach_email' | 'coverage_published' | 'mention_detected' | 'email_opened' | 'email_clicked' | 'email_replied'
  source_system TEXT NOT NULL, -- 's38_press_release' | 's39_pitch' | 's40_media_monitoring' | 's44_outreach' | 's45_deliverability'
  source_id UUID, -- Reference to the source record (e.g., press_release_id, pitch_id, etc.)

  -- Activity details
  activity_data JSONB DEFAULT '{}', -- Flexible data specific to activity type
  sentiment TEXT, -- 'positive' | 'neutral' | 'negative' | null

  -- Timestamps
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for journalist_activity_log
CREATE INDEX idx_journalist_activity_log_org_id ON journalist_activity_log(org_id);
CREATE INDEX idx_journalist_activity_log_journalist_id ON journalist_activity_log(journalist_id);
CREATE INDEX idx_journalist_activity_log_activity_type ON journalist_activity_log(activity_type);
CREATE INDEX idx_journalist_activity_log_source_system ON journalist_activity_log(source_system);
CREATE INDEX idx_journalist_activity_log_occurred_at ON journalist_activity_log(occurred_at DESC);
CREATE INDEX idx_journalist_activity_log_sentiment ON journalist_activity_log(sentiment);

-- =============================================
-- RLS Policies
-- =============================================

-- Enable RLS
ALTER TABLE journalist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_merge_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE journalist_activity_log ENABLE ROW LEVEL SECURITY;

-- journalist_profiles policies
CREATE POLICY journalist_profiles_org_isolation ON journalist_profiles
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
  ));

-- journalist_merge_map policies
CREATE POLICY journalist_merge_map_org_isolation ON journalist_merge_map
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
  ));

-- journalist_activity_log policies
CREATE POLICY journalist_activity_log_org_isolation ON journalist_activity_log
  FOR ALL
  USING (org_id IN (
    SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
  ));

-- =============================================
-- Triggers
-- =============================================

-- Trigger: update updated_at on journalist_profiles
CREATE TRIGGER update_journalist_profiles_updated_at
  BEFORE UPDATE ON journalist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Helper Functions
-- =============================================

/**
 * Function: get_canonical_journalist_id
 * Returns the canonical (surviving) journalist ID after following merge chain
 */
CREATE OR REPLACE FUNCTION get_canonical_journalist_id(p_journalist_id UUID, p_org_id UUID)
RETURNS UUID AS $$
DECLARE
  v_canonical_id UUID;
BEGIN
  -- Follow merge chain to find surviving profile
  SELECT COALESCE(
    (
      SELECT surviving_journalist_id
      FROM journalist_merge_map
      WHERE org_id = p_org_id
        AND merged_journalist_id = p_journalist_id
      LIMIT 1
    ),
    p_journalist_id
  ) INTO v_canonical_id;

  RETURN v_canonical_id;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Function: get_journalist_activity_summary
 * Returns aggregated activity statistics for a journalist
 */
CREATE OR REPLACE FUNCTION get_journalist_activity_summary(
  p_journalist_id UUID,
  p_org_id UUID
)
RETURNS TABLE (
  total_activities BIGINT,
  total_outreach BIGINT,
  total_coverage BIGINT,
  total_mentions BIGINT,
  total_emails_sent BIGINT,
  total_emails_opened BIGINT,
  total_emails_clicked BIGINT,
  total_emails_replied BIGINT,
  first_activity_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  positive_sentiment_count BIGINT,
  negative_sentiment_count BIGINT,
  neutral_sentiment_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_activities,
    COUNT(*) FILTER (WHERE activity_type IN ('pitch_sent', 'outreach_email'))::BIGINT AS total_outreach,
    COUNT(*) FILTER (WHERE activity_type = 'coverage_published')::BIGINT AS total_coverage,
    COUNT(*) FILTER (WHERE activity_type = 'mention_detected')::BIGINT AS total_mentions,
    COUNT(*) FILTER (WHERE activity_type = 'outreach_email')::BIGINT AS total_emails_sent,
    COUNT(*) FILTER (WHERE activity_type = 'email_opened')::BIGINT AS total_emails_opened,
    COUNT(*) FILTER (WHERE activity_type = 'email_clicked')::BIGINT AS total_emails_clicked,
    COUNT(*) FILTER (WHERE activity_type = 'email_replied')::BIGINT AS total_emails_replied,
    MIN(occurred_at) AS first_activity_at,
    MAX(occurred_at) AS last_activity_at,
    COUNT(*) FILTER (WHERE sentiment = 'positive')::BIGINT AS positive_sentiment_count,
    COUNT(*) FILTER (WHERE sentiment = 'negative')::BIGINT AS negative_sentiment_count,
    COUNT(*) FILTER (WHERE sentiment = 'neutral')::BIGINT AS neutral_sentiment_count
  FROM journalist_activity_log
  WHERE journalist_id = p_journalist_id
    AND org_id = p_org_id;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Function: calculate_journalist_engagement_score
 * Calculates engagement score based on activity data
 * Formula: weighted combination of outreach responses, coverage, and mentions
 */
CREATE OR REPLACE FUNCTION calculate_journalist_engagement_score(
  p_journalist_id UUID,
  p_org_id UUID
)
RETURNS FLOAT AS $$
DECLARE
  v_summary RECORD;
  v_engagement_score FLOAT;
  v_response_rate FLOAT;
  v_coverage_rate FLOAT;
  v_open_rate FLOAT;
BEGIN
  -- Get activity summary
  SELECT * INTO v_summary
  FROM get_journalist_activity_summary(p_journalist_id, p_org_id);

  -- Avoid division by zero
  IF v_summary.total_activities = 0 THEN
    RETURN 0.0;
  END IF;

  -- Calculate rates
  v_response_rate := CASE
    WHEN v_summary.total_emails_sent > 0
    THEN v_summary.total_emails_replied::FLOAT / v_summary.total_emails_sent::FLOAT
    ELSE 0.0
  END;

  v_coverage_rate := CASE
    WHEN v_summary.total_outreach > 0
    THEN v_summary.total_coverage::FLOAT / v_summary.total_outreach::FLOAT
    ELSE 0.0
  END;

  v_open_rate := CASE
    WHEN v_summary.total_emails_sent > 0
    THEN v_summary.total_emails_opened::FLOAT / v_summary.total_emails_sent::FLOAT
    ELSE 0.0
  END;

  -- Weighted engagement score
  -- Response rate (40%) + Coverage rate (30%) + Open rate (20%) + Activity volume (10%)
  v_engagement_score := (v_response_rate * 0.4) +
                        (v_coverage_rate * 0.3) +
                        (v_open_rate * 0.2) +
                        (LEAST(v_summary.total_activities::FLOAT / 100.0, 1.0) * 0.1);

  -- Clamp between 0 and 1
  RETURN GREATEST(0.0, LEAST(1.0, v_engagement_score));
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Function: update_journalist_scores
 * Recalculates and updates all scores for a journalist
 */
CREATE OR REPLACE FUNCTION update_journalist_scores(
  p_journalist_id UUID,
  p_org_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_engagement_score FLOAT;
  v_summary RECORD;
  v_responsiveness_score FLOAT;
BEGIN
  -- Calculate engagement score
  v_engagement_score := calculate_journalist_engagement_score(p_journalist_id, p_org_id);

  -- Get activity summary for responsiveness
  SELECT * INTO v_summary
  FROM get_journalist_activity_summary(p_journalist_id, p_org_id);

  -- Calculate responsiveness score (based on reply rate and time to respond)
  -- V1 stub: simplified to reply rate
  v_responsiveness_score := CASE
    WHEN v_summary.total_emails_sent > 0
    THEN v_summary.total_emails_replied::FLOAT / v_summary.total_emails_sent::FLOAT
    ELSE 0.0
  END;

  -- Update scores
  UPDATE journalist_profiles
  SET
    engagement_score = v_engagement_score,
    responsiveness_score = v_responsiveness_score,
    last_activity_at = v_summary.last_activity_at,
    updated_at = NOW()
  WHERE id = p_journalist_id
    AND org_id = p_org_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- Migration Complete
-- =============================================

COMMENT ON TABLE journalist_profiles IS 'Sprint S46: Primary journalist identity records';
COMMENT ON TABLE journalist_merge_map IS 'Sprint S46: Tracks merged/deduplicated journalist profiles';
COMMENT ON TABLE journalist_activity_log IS 'Sprint S46: Cross-system activity tracking for journalists';
