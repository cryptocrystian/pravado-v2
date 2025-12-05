-- Migration 46: Media Crawling & RSS Ingestion (Sprint S41)
-- Automated media ingestion pipeline with RSS feeds and crawl jobs

-- ========================================
-- ENUMS
-- ========================================

-- Crawl job status enum
DO $$ BEGIN
  CREATE TYPE public.crawl_job_status AS ENUM ('queued', 'running', 'success', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- MEDIA RSS FEEDS TABLE
-- ========================================
-- Tracks RSS feed sources for automated article ingestion

CREATE TABLE IF NOT EXISTS public.media_rss_feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.media_monitoring_sources(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  fetch_frequency_hours INT DEFAULT 6, -- How often to fetch (default every 6 hours)
  last_fetched_at TIMESTAMPTZ,
  last_fetch_error TEXT,
  articles_found INT DEFAULT 0, -- Total articles discovered from this feed
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_rss_feed_url_per_org UNIQUE (org_id, url)
);

-- Indexes for media_rss_feeds
CREATE INDEX IF NOT EXISTS idx_media_rss_feeds_org
  ON public.media_rss_feeds(org_id);

CREATE INDEX IF NOT EXISTS idx_media_rss_feeds_source
  ON public.media_rss_feeds(source_id);

CREATE INDEX IF NOT EXISTS idx_media_rss_feeds_org_active
  ON public.media_rss_feeds(org_id, active);

CREATE INDEX IF NOT EXISTS idx_media_rss_feeds_last_fetched
  ON public.media_rss_feeds(last_fetched_at) WHERE active = true;

-- Enable RLS
ALTER TABLE public.media_rss_feeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_rss_feeds
CREATE POLICY "Users can view RSS feeds in their org"
  ON public.media_rss_feeds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_rss_feeds.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert RSS feeds in their org"
  ON public.media_rss_feeds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_rss_feeds.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update RSS feeds in their org"
  ON public.media_rss_feeds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_rss_feeds.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete RSS feeds in their org"
  ON public.media_rss_feeds FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_rss_feeds.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ========================================
-- MEDIA CRAWL JOBS TABLE
-- ========================================
-- Queue for article URLs to be crawled and ingested

CREATE TABLE IF NOT EXISTS public.media_crawl_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.media_monitoring_sources(id) ON DELETE SET NULL,
  feed_id UUID REFERENCES public.media_rss_feeds(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT, -- Hint from RSS feed
  published_at TIMESTAMPTZ, -- Hint from RSS feed
  status public.crawl_job_status NOT NULL DEFAULT 'queued',
  run_count INT DEFAULT 0,
  error TEXT,
  result_article_id UUID REFERENCES public.media_monitoring_articles(id) ON DELETE SET NULL,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_crawl_job_url_per_org UNIQUE (org_id, url)
);

-- Indexes for media_crawl_jobs
CREATE INDEX IF NOT EXISTS idx_media_crawl_jobs_org
  ON public.media_crawl_jobs(org_id);

CREATE INDEX IF NOT EXISTS idx_media_crawl_jobs_source
  ON public.media_crawl_jobs(source_id);

CREATE INDEX IF NOT EXISTS idx_media_crawl_jobs_feed
  ON public.media_crawl_jobs(feed_id);

CREATE INDEX IF NOT EXISTS idx_media_crawl_jobs_status
  ON public.media_crawl_jobs(status);

CREATE INDEX IF NOT EXISTS idx_media_crawl_jobs_org_status
  ON public.media_crawl_jobs(org_id, status);

CREATE INDEX IF NOT EXISTS idx_media_crawl_jobs_queued
  ON public.media_crawl_jobs(created_at) WHERE status = 'queued';

CREATE INDEX IF NOT EXISTS idx_media_crawl_jobs_created
  ON public.media_crawl_jobs(org_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.media_crawl_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_crawl_jobs
CREATE POLICY "Users can view crawl jobs in their org"
  ON public.media_crawl_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_crawl_jobs.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert crawl jobs in their org"
  ON public.media_crawl_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_crawl_jobs.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update crawl jobs in their org"
  ON public.media_crawl_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_crawl_jobs.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete crawl jobs in their org"
  ON public.media_crawl_jobs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_crawl_jobs.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get RSS feed statistics
CREATE OR REPLACE FUNCTION get_rss_feed_stats(p_org_id UUID)
RETURNS TABLE (
  total_feeds BIGINT,
  active_feeds BIGINT,
  total_jobs BIGINT,
  queued_jobs BIGINT,
  running_jobs BIGINT,
  success_jobs BIGINT,
  failed_jobs BIGINT,
  articles_discovered BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.media_rss_feeds WHERE org_id = p_org_id)::BIGINT,
    (SELECT COUNT(*) FROM public.media_rss_feeds WHERE org_id = p_org_id AND active = true)::BIGINT,
    (SELECT COUNT(*) FROM public.media_crawl_jobs WHERE org_id = p_org_id)::BIGINT,
    (SELECT COUNT(*) FROM public.media_crawl_jobs WHERE org_id = p_org_id AND status = 'queued')::BIGINT,
    (SELECT COUNT(*) FROM public.media_crawl_jobs WHERE org_id = p_org_id AND status = 'running')::BIGINT,
    (SELECT COUNT(*) FROM public.media_crawl_jobs WHERE org_id = p_org_id AND status = 'success')::BIGINT,
    (SELECT COUNT(*) FROM public.media_crawl_jobs WHERE org_id = p_org_id AND status = 'failed')::BIGINT,
    (SELECT COALESCE(SUM(articles_found), 0) FROM public.media_rss_feeds WHERE org_id = p_org_id)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending crawl jobs (for worker processing)
CREATE OR REPLACE FUNCTION get_pending_crawl_jobs(p_limit INT DEFAULT 10)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  source_id UUID,
  feed_id UUID,
  url TEXT,
  title TEXT,
  published_at TIMESTAMPTZ,
  run_count INT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.org_id,
    j.source_id,
    j.feed_id,
    j.url,
    j.title,
    j.published_at,
    j.run_count,
    j.created_at
  FROM public.media_crawl_jobs j
  WHERE j.status = 'queued'
    AND j.run_count < 3 -- Max retry attempts
  ORDER BY j.created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS
-- ========================================

-- Updated at trigger for RSS feeds
CREATE OR REPLACE FUNCTION update_media_rss_feeds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_rss_feeds_updated_at ON public.media_rss_feeds;
CREATE TRIGGER trigger_media_rss_feeds_updated_at
  BEFORE UPDATE ON public.media_rss_feeds
  FOR EACH ROW
  EXECUTE FUNCTION update_media_rss_feeds_updated_at();

-- Updated at trigger for crawl jobs
CREATE OR REPLACE FUNCTION update_media_crawl_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_crawl_jobs_updated_at ON public.media_crawl_jobs;
CREATE TRIGGER trigger_media_crawl_jobs_updated_at
  BEFORE UPDATE ON public.media_crawl_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_media_crawl_jobs_updated_at();

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE public.media_rss_feeds IS 'RSS feed sources for automated article discovery (Sprint S41)';
COMMENT ON TABLE public.media_crawl_jobs IS 'Queue of article URLs to be crawled and ingested (Sprint S41)';
COMMENT ON FUNCTION get_rss_feed_stats IS 'Returns aggregated statistics for RSS feeds and crawl jobs (Sprint S41)';
COMMENT ON FUNCTION get_pending_crawl_jobs IS 'Returns pending crawl jobs for worker processing (Sprint S41)';
