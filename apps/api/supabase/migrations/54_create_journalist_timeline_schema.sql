/**
 * Migration 54: Journalist Relationship Timeline Schema (Sprint S49)
 *
 * Aggregates all journalist interactions and signals from S38-S48 into
 * a unified chronological relationship timeline. This becomes the core
 * of the Journalist Relationship CRM.
 *
 * Event Sources:
 * - S38: Press Releases
 * - S39: Pitch Engine
 * - S40: Media Monitoring & Coverage
 * - S41: RSS Crawling
 * - S43: Media Alerts
 * - S44: PR Outreach
 * - S45: Engagement Analytics
 * - S46: Identity Graph
 * - S47: Media Lists
 * - S48: Discovery Engine
 * - Custom: Manual notes and tags
 */

-- =====================================================
-- Table: journalist_relationship_events
-- =====================================================

CREATE TABLE IF NOT EXISTS journalist_relationship_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,

  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    -- S38 Press Releases
    'press_release_generated', 'press_release_sent',
    -- S39 Pitch Engine
    'pitch_sent', 'pitch_opened', 'pitch_clicked', 'pitch_replied', 'pitch_bounced',
    -- S40 Media Monitoring
    'media_mention', 'coverage_published', 'brand_mention',
    -- S41 RSS Crawling
    'article_published',
    -- S43 Media Alerts
    'alert_triggered', 'signal_detected',
    -- S44 PR Outreach
    'outreach_sent', 'outreach_opened', 'outreach_clicked', 'outreach_replied',
    'outreach_bounced', 'outreach_unsubscribed', 'outreach_followup',
    -- S45 Engagement Analytics
    'email_engagement', 'link_clicked', 'attachment_downloaded',
    -- S46 Identity Graph
    'profile_created', 'profile_updated', 'profile_merged', 'profile_enriched',
    -- S47 Media Lists
    'added_to_media_list', 'removed_from_media_list',
    -- S48 Discovery
    'journalist_discovered', 'discovery_merged',
    -- Custom events
    'manual_note', 'tag_added', 'tag_removed', 'custom_interaction'
  )),

  -- Event details
  title TEXT NOT NULL,
  description TEXT,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Source tracking
  source_system TEXT NOT NULL CHECK (source_system IN (
    'press_releases', 'pitch_engine', 'media_monitoring', 'rss_crawling',
    'media_alerts', 'pr_outreach', 'engagement_analytics', 'identity_graph',
    'media_lists', 'discovery_engine', 'manual'
  )),
  source_id TEXT,  -- ID in source system (press_release_id, pitch_id, etc.)

  -- Event payload (heterogeneous data from different systems)
  payload JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Scoring & relevance
  relevance_score FLOAT DEFAULT 0.5 CHECK (relevance_score BETWEEN 0 AND 1),
  relationship_impact FLOAT DEFAULT 0 CHECK (relationship_impact BETWEEN -1 AND 1),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'unknown')),

  -- Clustering (group related events)
  cluster_id UUID,
  cluster_type TEXT,  -- 'outreach_sequence', 'coverage_thread', 'pitch_followup', etc.

  -- User tracking
  created_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================

-- Primary timeline query: all events for a journalist, sorted by time
CREATE INDEX idx_journalist_timeline_journalist_time
  ON journalist_relationship_events(journalist_id, event_timestamp DESC);

-- Org-level isolation for RLS
CREATE INDEX idx_journalist_timeline_org_id
  ON journalist_relationship_events(org_id);

-- Event type filtering
CREATE INDEX idx_journalist_timeline_event_type
  ON journalist_relationship_events(event_type);

-- Source system filtering
CREATE INDEX idx_journalist_timeline_source_system
  ON journalist_relationship_events(source_system);

-- Composite for common queries
CREATE INDEX idx_journalist_timeline_org_journalist
  ON journalist_relationship_events(org_id, journalist_id);

-- Relevance-based queries
CREATE INDEX idx_journalist_timeline_relevance
  ON journalist_relationship_events(journalist_id, relevance_score DESC);

-- Sentiment analysis queries
CREATE INDEX idx_journalist_timeline_sentiment
  ON journalist_relationship_events(journalist_id, sentiment) WHERE sentiment != 'unknown';

-- Cluster queries (find all events in a cluster)
CREATE INDEX idx_journalist_timeline_cluster
  ON journalist_relationship_events(cluster_id) WHERE cluster_id IS NOT NULL;

-- Time-range queries
CREATE INDEX idx_journalist_timeline_timestamp
  ON journalist_relationship_events(event_timestamp DESC);

-- Source ID lookups (dedupe check)
CREATE INDEX idx_journalist_timeline_source_id
  ON journalist_relationship_events(source_system, source_id) WHERE source_id IS NOT NULL;

-- GIN indexes for JSONB fields
CREATE INDEX idx_journalist_timeline_payload_gin
  ON journalist_relationship_events USING GIN (payload);

CREATE INDEX idx_journalist_timeline_metadata_gin
  ON journalist_relationship_events USING GIN (metadata);

-- =====================================================
-- Helper Functions
-- =====================================================

/**
 * Get timeline statistics for a journalist
 */
CREATE OR REPLACE FUNCTION get_journalist_timeline_stats(
  p_org_id UUID,
  p_journalist_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_events', COUNT(*)::INT,
    'last_interaction', MAX(event_timestamp),
    'first_interaction', MIN(event_timestamp),
    'event_type_counts', (
      SELECT jsonb_object_agg(event_type, count)
      FROM (
        SELECT event_type, COUNT(*)::INT as count
        FROM journalist_relationship_events
        WHERE org_id = p_org_id
          AND journalist_id = p_journalist_id
        GROUP BY event_type
      ) counts
    ),
    'sentiment_distribution', (
      SELECT jsonb_build_object(
        'positive', COUNT(*) FILTER (WHERE sentiment = 'positive')::INT,
        'neutral', COUNT(*) FILTER (WHERE sentiment = 'neutral')::INT,
        'negative', COUNT(*) FILTER (WHERE sentiment = 'negative')::INT,
        'unknown', COUNT(*) FILTER (WHERE sentiment = 'unknown')::INT
      )
      FROM journalist_relationship_events
      WHERE org_id = p_org_id
        AND journalist_id = p_journalist_id
    ),
    'avg_relevance_score', COALESCE(AVG(relevance_score), 0),
    'avg_relationship_impact', COALESCE(AVG(relationship_impact), 0),
    'total_clusters', COUNT(DISTINCT cluster_id) FILTER (WHERE cluster_id IS NOT NULL)::INT,
    'recent_30_days', COUNT(*) FILTER (WHERE event_timestamp >= NOW() - INTERVAL '30 days')::INT,
    'recent_90_days', COUNT(*) FILTER (WHERE event_timestamp >= NOW() - INTERVAL '90 days')::INT
  ) INTO v_stats
  FROM journalist_relationship_events
  WHERE org_id = p_org_id
    AND journalist_id = p_journalist_id;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Calculate relationship health score for a journalist (0-100)
 *
 * Based on:
 * - Recency of interactions
 * - Frequency of positive events
 * - Reply rates
 * - Coverage achieved
 * - Sentiment trends
 */
CREATE OR REPLACE FUNCTION calculate_relationship_health_score(
  p_org_id UUID,
  p_journalist_id UUID
)
RETURNS FLOAT AS $$
DECLARE
  v_total_events INT;
  v_recent_events INT;
  v_positive_events INT;
  v_negative_events INT;
  v_reply_events INT;
  v_coverage_events INT;
  v_last_interaction_days INT;
  v_avg_impact FLOAT;
  v_score FLOAT := 0;
BEGIN
  -- Get event counts
  SELECT
    COUNT(*)::INT,
    COUNT(*) FILTER (WHERE event_timestamp >= NOW() - INTERVAL '30 days')::INT,
    COUNT(*) FILTER (WHERE sentiment = 'positive')::INT,
    COUNT(*) FILTER (WHERE sentiment = 'negative')::INT,
    COUNT(*) FILTER (WHERE event_type IN ('pitch_replied', 'outreach_replied'))::INT,
    COUNT(*) FILTER (WHERE event_type IN ('media_mention', 'coverage_published'))::INT,
    EXTRACT(DAYS FROM NOW() - MAX(event_timestamp))::INT,
    COALESCE(AVG(relationship_impact), 0)
  INTO
    v_total_events, v_recent_events, v_positive_events, v_negative_events,
    v_reply_events, v_coverage_events, v_last_interaction_days, v_avg_impact
  FROM journalist_relationship_events
  WHERE org_id = p_org_id
    AND journalist_id = p_journalist_id;

  -- No events = neutral score
  IF v_total_events = 0 THEN
    RETURN 50.0;
  END IF;

  -- Base score from event count (max 20 points)
  v_score := v_score + LEAST(v_total_events * 0.5, 20);

  -- Recency bonus (max 25 points)
  IF v_last_interaction_days <= 7 THEN
    v_score := v_score + 25;
  ELSIF v_last_interaction_days <= 30 THEN
    v_score := v_score + 15;
  ELSIF v_last_interaction_days <= 90 THEN
    v_score := v_score + 5;
  END IF;

  -- Activity in last 30 days (max 15 points)
  v_score := v_score + LEAST(v_recent_events * 1.5, 15);

  -- Positive sentiment bonus (max 15 points)
  IF v_total_events > 0 THEN
    v_score := v_score + ((v_positive_events::FLOAT / v_total_events) * 15);
  END IF;

  -- Reply rate bonus (max 10 points)
  v_score := v_score + LEAST(v_reply_events * 2, 10);

  -- Coverage achieved bonus (max 10 points)
  v_score := v_score + LEAST(v_coverage_events * 2, 10);

  -- Relationship impact (max 5 points, can be negative)
  v_score := v_score + (v_avg_impact * 5);

  -- Negative sentiment penalty
  IF v_total_events > 0 THEN
    v_score := v_score - ((v_negative_events::FLOAT / v_total_events) * 10);
  END IF;

  -- Clamp to 0-100 range
  v_score := GREATEST(0, LEAST(100, v_score));

  RETURN v_score;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Auto-cluster related events
 * Groups events by source_id and proximity in time
 */
CREATE OR REPLACE FUNCTION auto_cluster_timeline_events(
  p_org_id UUID,
  p_journalist_id UUID
)
RETURNS INT AS $$
DECLARE
  v_clusters_created INT := 0;
BEGIN
  -- Cluster outreach sequences (same source_id from pr_outreach)
  WITH outreach_sequences AS (
    SELECT
      source_id,
      gen_random_uuid() as new_cluster_id
    FROM journalist_relationship_events
    WHERE org_id = p_org_id
      AND journalist_id = p_journalist_id
      AND source_system = 'pr_outreach'
      AND source_id IS NOT NULL
      AND cluster_id IS NULL
    GROUP BY source_id
  )
  UPDATE journalist_relationship_events e
  SET
    cluster_id = os.new_cluster_id,
    cluster_type = 'outreach_sequence',
    updated_at = NOW()
  FROM outreach_sequences os
  WHERE e.source_id = os.source_id
    AND e.source_system = 'pr_outreach'
    AND e.org_id = p_org_id
    AND e.journalist_id = p_journalist_id;

  GET DIAGNOSTICS v_clusters_created = ROW_COUNT;

  RETURN v_clusters_created;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger: Auto-update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_journalist_timeline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_journalist_timeline_updated_at
  BEFORE UPDATE ON journalist_relationship_events
  FOR EACH ROW
  EXECUTE FUNCTION update_journalist_timeline_updated_at();

-- =====================================================
-- Row-Level Security (RLS)
-- =====================================================

ALTER TABLE journalist_relationship_events ENABLE ROW LEVEL SECURITY;

-- Org members can view their org's timeline events
CREATE POLICY journalist_timeline_select_policy
  ON journalist_relationship_events
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  );

-- Org members can insert timeline events for their org
CREATE POLICY journalist_timeline_insert_policy
  ON journalist_relationship_events
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  );

-- Org members can update their org's timeline events
CREATE POLICY journalist_timeline_update_policy
  ON journalist_relationship_events
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  );

-- Org members can delete their org's timeline events
CREATE POLICY journalist_timeline_delete_policy
  ON journalist_relationship_events
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM user_orgs WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE journalist_relationship_events IS 'Sprint S49: Unified timeline of all journalist interactions and signals from S38-S48';
COMMENT ON COLUMN journalist_relationship_events.event_type IS 'Type of event from source system';
COMMENT ON COLUMN journalist_relationship_events.relevance_score IS 'How relevant this event is (0-1), affects display priority';
COMMENT ON COLUMN journalist_relationship_events.relationship_impact IS 'Impact on relationship health (-1 to 1)';
COMMENT ON COLUMN journalist_relationship_events.cluster_id IS 'Groups related events (e.g., all events in an outreach sequence)';
COMMENT ON FUNCTION get_journalist_timeline_stats IS 'Returns aggregated statistics for a journalist timeline';
COMMENT ON FUNCTION calculate_relationship_health_score IS 'Calculates 0-100 health score based on interaction history';
COMMENT ON FUNCTION auto_cluster_timeline_events IS 'Automatically groups related events into clusters';
