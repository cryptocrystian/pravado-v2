-- Migration 48: Media Monitoring Alerts & Smart Signals Schema (Sprint S43)
-- Creates tables for alert rules and alert events based on media monitoring data

-- ========================================
-- ENUMS
-- ========================================

-- Alert type enum
DO $$ BEGIN
  CREATE TYPE public.media_alert_type AS ENUM (
    'mention_match',
    'volume_spike',
    'sentiment_shift',
    'tier_coverage'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Alert severity enum
DO $$ BEGIN
  CREATE TYPE public.media_alert_severity AS ENUM ('info', 'warning', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- MEDIA ALERT RULES TABLE
-- ========================================
-- User-defined rules for generating alerts from media monitoring data

CREATE TABLE IF NOT EXISTS public.media_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  alert_type public.media_alert_type NOT NULL,

  -- Filter fields (nullable, used depending on alert_type)
  brand_terms TEXT[], -- Keywords to match (e.g., ["pravado", "saipien labs"])
  competitor_terms TEXT[], -- Competitor keywords
  journalist_ids UUID[], -- Specific journalists to track
  outlet_ids UUID[], -- Specific outlets/sources to track
  min_sentiment NUMERIC, -- -1 to +1 sentiment threshold
  max_sentiment NUMERIC, -- -1 to +1 sentiment threshold
  min_mentions INTEGER, -- Volume spike threshold
  time_window_minutes INTEGER, -- Time window for volume/sentiment analysis
  min_relevance NUMERIC, -- 0-100 relevance score threshold (matches S40)

  -- Operational fields
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Ensure uniqueness per org + name
  CONSTRAINT unique_alert_rule_name_per_org UNIQUE (org_id, name)
);

-- Indexes for media_alert_rules
CREATE INDEX IF NOT EXISTS idx_media_alert_rules_org
  ON public.media_alert_rules(org_id);

CREATE INDEX IF NOT EXISTS idx_media_alert_rules_org_active
  ON public.media_alert_rules(org_id, is_active, alert_type);

-- GIN indexes for array columns (efficient array searches)
CREATE INDEX IF NOT EXISTS idx_media_alert_rules_brand_terms
  ON public.media_alert_rules USING GIN (brand_terms);

CREATE INDEX IF NOT EXISTS idx_media_alert_rules_competitor_terms
  ON public.media_alert_rules USING GIN (competitor_terms);

CREATE INDEX IF NOT EXISTS idx_media_alert_rules_journalist_ids
  ON public.media_alert_rules USING GIN (journalist_ids);

CREATE INDEX IF NOT EXISTS idx_media_alert_rules_outlet_ids
  ON public.media_alert_rules USING GIN (outlet_ids);

-- Enable RLS
ALTER TABLE public.media_alert_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_alert_rules
CREATE POLICY "Users can view alert rules in their org"
  ON public.media_alert_rules FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert alert rules in their org"
  ON public.media_alert_rules FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update alert rules in their org"
  ON public.media_alert_rules FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete alert rules in their org"
  ON public.media_alert_rules FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- MEDIA ALERT EVENTS TABLE
-- ========================================
-- Generated alert events when rules are triggered

CREATE TABLE IF NOT EXISTS public.media_alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_id UUID NOT NULL REFERENCES public.media_alert_rules(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  alert_type public.media_alert_type NOT NULL, -- Denormalized from rule
  severity public.media_alert_severity NOT NULL,

  -- Context references (nullable depending on alert type)
  article_id UUID REFERENCES public.media_monitoring_articles(id) ON DELETE SET NULL,
  mention_id UUID REFERENCES public.media_monitoring_mentions(id) ON DELETE SET NULL,
  journalist_id UUID, -- From PR Intelligence graph (if available)
  outlet_id UUID REFERENCES public.media_monitoring_sources(id) ON DELETE SET NULL,

  -- Event details
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb, -- Metrics, counts, matched terms, etc.

  -- User interaction
  is_read BOOLEAN NOT NULL DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for media_alert_events
CREATE INDEX IF NOT EXISTS idx_media_alert_events_org_triggered
  ON public.media_alert_events(org_id, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_alert_events_org_is_read
  ON public.media_alert_events(org_id, is_read);

CREATE INDEX IF NOT EXISTS idx_media_alert_events_org_severity_triggered
  ON public.media_alert_events(org_id, severity, triggered_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_alert_events_rule
  ON public.media_alert_events(rule_id);

CREATE INDEX IF NOT EXISTS idx_media_alert_events_article
  ON public.media_alert_events(article_id) WHERE article_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_alert_events_mention
  ON public.media_alert_events(mention_id) WHERE mention_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.media_alert_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_alert_events
CREATE POLICY "Users can view alert events in their org"
  ON public.media_alert_events FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert alert events in their org"
  ON public.media_alert_events FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update alert events in their org"
  ON public.media_alert_events FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- ========================================
-- TRIGGERS
-- ========================================

-- Updated_at trigger for media_alert_rules
CREATE TRIGGER update_media_alert_rules_updated_at
  BEFORE UPDATE ON public.media_alert_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Updated_at trigger for media_alert_events
CREATE TRIGGER update_media_alert_events_updated_at
  BEFORE UPDATE ON public.media_alert_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Get alert statistics for an organization
CREATE OR REPLACE FUNCTION public.get_media_alert_stats(p_org_id UUID)
RETURNS TABLE (
  total_rules INT,
  active_rules INT,
  total_events INT,
  unread_events INT,
  critical_events_24h INT,
  warning_events_24h INT,
  info_events_24h INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT r.id)::INT AS total_rules,
    COUNT(DISTINCT r.id) FILTER (WHERE r.is_active = true)::INT AS active_rules,
    COUNT(e.id)::INT AS total_events,
    COUNT(e.id) FILTER (WHERE e.is_read = false)::INT AS unread_events,
    COUNT(e.id) FILTER (WHERE e.severity = 'critical' AND e.triggered_at >= NOW() - INTERVAL '24 hours')::INT AS critical_events_24h,
    COUNT(e.id) FILTER (WHERE e.severity = 'warning' AND e.triggered_at >= NOW() - INTERVAL '24 hours')::INT AS warning_events_24h,
    COUNT(e.id) FILTER (WHERE e.severity = 'info' AND e.triggered_at >= NOW() - INTERVAL '24 hours')::INT AS info_events_24h
  FROM public.media_alert_rules r
  LEFT JOIN public.media_alert_events e ON e.rule_id = r.id
  WHERE r.org_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent alert events with context (for signals overview)
CREATE OR REPLACE FUNCTION public.get_recent_alert_events_with_context(
  p_org_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  event_id UUID,
  rule_name TEXT,
  alert_type public.media_alert_type,
  severity public.media_alert_severity,
  summary TEXT,
  triggered_at TIMESTAMPTZ,
  is_read BOOLEAN,
  article_title TEXT,
  article_url TEXT,
  source_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS event_id,
    r.name AS rule_name,
    e.alert_type,
    e.severity,
    e.summary,
    e.triggered_at,
    e.is_read,
    a.title AS article_title,
    a.url AS article_url,
    s.name AS source_name
  FROM public.media_alert_events e
  INNER JOIN public.media_alert_rules r ON r.id = e.rule_id
  LEFT JOIN public.media_monitoring_articles a ON a.id = e.article_id
  LEFT JOIN public.media_monitoring_sources s ON s.id = e.outlet_id OR s.id = a.source_id
  WHERE e.org_id = p_org_id
  ORDER BY e.triggered_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
