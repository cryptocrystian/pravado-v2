-- Migration 45: Media Monitoring & Earned Coverage Schema (Sprint S40)
-- Creates tables for media monitoring, article tracking, and earned mention detection

-- ========================================
-- ENUMS
-- ========================================

-- Sentiment enum for mention analysis
DO $$ BEGIN
  CREATE TYPE public.mention_sentiment AS ENUM ('positive', 'neutral', 'negative');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ========================================
-- MEDIA MONITORING SOURCES TABLE
-- ========================================
-- Tracks monitored domains/publications

CREATE TABLE IF NOT EXISTS public.media_monitoring_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  source_type TEXT DEFAULT 'website', -- 'website', 'rss', 'api'
  crawl_frequency_hours INT DEFAULT 24,
  last_crawled_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for media_monitoring_sources
CREATE INDEX IF NOT EXISTS idx_media_monitoring_sources_org
  ON public.media_monitoring_sources(org_id);

CREATE INDEX IF NOT EXISTS idx_media_monitoring_sources_org_active
  ON public.media_monitoring_sources(org_id, active);

CREATE INDEX IF NOT EXISTS idx_media_monitoring_sources_url
  ON public.media_monitoring_sources(url);

-- Enable RLS
ALTER TABLE public.media_monitoring_sources ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_monitoring_sources
CREATE POLICY "Users can view sources in their org"
  ON public.media_monitoring_sources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_monitoring_sources.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sources in their org"
  ON public.media_monitoring_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_monitoring_sources.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sources in their org"
  ON public.media_monitoring_sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_monitoring_sources.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sources in their org"
  ON public.media_monitoring_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_monitoring_sources.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ========================================
-- MEDIA MONITORING ARTICLES TABLE
-- ========================================
-- Stores ingested articles with embeddings for semantic search

CREATE TABLE IF NOT EXISTS public.media_monitoring_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_id UUID REFERENCES public.media_monitoring_sources(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  published_at TIMESTAMPTZ,
  content TEXT,
  summary TEXT,
  embeddings vector(1536), -- OpenAI text-embedding-3-small dimension
  relevance_score FLOAT DEFAULT 0,
  keywords TEXT[] DEFAULT '{}',
  domain_authority FLOAT DEFAULT 0, -- 0-100 score
  word_count INT DEFAULT 0,
  language TEXT DEFAULT 'en',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_article_url_per_org UNIQUE (org_id, url)
);

-- Indexes for media_monitoring_articles
CREATE INDEX IF NOT EXISTS idx_media_monitoring_articles_org
  ON public.media_monitoring_articles(org_id);

CREATE INDEX IF NOT EXISTS idx_media_monitoring_articles_source
  ON public.media_monitoring_articles(source_id);

CREATE INDEX IF NOT EXISTS idx_media_monitoring_articles_org_published
  ON public.media_monitoring_articles(org_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_monitoring_articles_org_relevance
  ON public.media_monitoring_articles(org_id, relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_media_monitoring_articles_url
  ON public.media_monitoring_articles(url);

CREATE INDEX IF NOT EXISTS idx_media_monitoring_articles_author
  ON public.media_monitoring_articles(author);

-- GIN index for keyword array search
CREATE INDEX IF NOT EXISTS idx_media_monitoring_articles_keywords
  ON public.media_monitoring_articles USING GIN (keywords);

-- IVFFlat index for vector similarity search (requires pgvector)
-- Note: Run after sufficient data exists for better index quality
-- CREATE INDEX IF NOT EXISTS idx_media_monitoring_articles_embeddings
--   ON public.media_monitoring_articles USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.media_monitoring_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for media_monitoring_articles
CREATE POLICY "Users can view articles in their org"
  ON public.media_monitoring_articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_monitoring_articles.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert articles in their org"
  ON public.media_monitoring_articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_monitoring_articles.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update articles in their org"
  ON public.media_monitoring_articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_monitoring_articles.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete articles in their org"
  ON public.media_monitoring_articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = media_monitoring_articles.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ========================================
-- EARNED MENTIONS TABLE
-- ========================================
-- Tracks brand/product mentions detected in articles

CREATE TABLE IF NOT EXISTS public.earned_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.media_monitoring_articles(id) ON DELETE CASCADE,
  journalist_id UUID REFERENCES public.journalists(id) ON DELETE SET NULL,
  entity TEXT NOT NULL, -- brand name, product name, executive name, etc.
  entity_type TEXT NOT NULL DEFAULT 'brand', -- 'brand', 'product', 'executive', 'competitor'
  snippet TEXT, -- text excerpt containing the mention
  context TEXT, -- surrounding context for the mention
  sentiment public.mention_sentiment NOT NULL DEFAULT 'neutral',
  confidence FLOAT NOT NULL DEFAULT 0.5, -- 0-1 confidence score
  is_primary_mention BOOLEAN DEFAULT false, -- is this the main subject of the article?
  position_in_article INT, -- character position of mention
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for earned_mentions
CREATE INDEX IF NOT EXISTS idx_earned_mentions_org
  ON public.earned_mentions(org_id);

CREATE INDEX IF NOT EXISTS idx_earned_mentions_article
  ON public.earned_mentions(article_id);

CREATE INDEX IF NOT EXISTS idx_earned_mentions_journalist
  ON public.earned_mentions(journalist_id);

CREATE INDEX IF NOT EXISTS idx_earned_mentions_org_entity
  ON public.earned_mentions(org_id, entity);

CREATE INDEX IF NOT EXISTS idx_earned_mentions_org_sentiment
  ON public.earned_mentions(org_id, sentiment);

CREATE INDEX IF NOT EXISTS idx_earned_mentions_org_created
  ON public.earned_mentions(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_earned_mentions_entity_type
  ON public.earned_mentions(entity_type);

-- Enable RLS
ALTER TABLE public.earned_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for earned_mentions
CREATE POLICY "Users can view mentions in their org"
  ON public.earned_mentions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = earned_mentions.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert mentions in their org"
  ON public.earned_mentions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = earned_mentions.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update mentions in their org"
  ON public.earned_mentions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = earned_mentions.org_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete mentions in their org"
  ON public.earned_mentions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members
      WHERE org_members.org_id = earned_mentions.org_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to get article statistics for an org
CREATE OR REPLACE FUNCTION get_media_monitoring_stats(p_org_id UUID)
RETURNS TABLE (
  total_sources BIGINT,
  active_sources BIGINT,
  total_articles BIGINT,
  articles_this_week BIGINT,
  total_mentions BIGINT,
  mentions_this_week BIGINT,
  positive_mentions BIGINT,
  neutral_mentions BIGINT,
  negative_mentions BIGINT,
  avg_relevance FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.media_monitoring_sources WHERE org_id = p_org_id)::BIGINT,
    (SELECT COUNT(*) FROM public.media_monitoring_sources WHERE org_id = p_org_id AND active = true)::BIGINT,
    (SELECT COUNT(*) FROM public.media_monitoring_articles WHERE org_id = p_org_id)::BIGINT,
    (SELECT COUNT(*) FROM public.media_monitoring_articles WHERE org_id = p_org_id AND created_at >= NOW() - INTERVAL '7 days')::BIGINT,
    (SELECT COUNT(*) FROM public.earned_mentions WHERE org_id = p_org_id)::BIGINT,
    (SELECT COUNT(*) FROM public.earned_mentions WHERE org_id = p_org_id AND created_at >= NOW() - INTERVAL '7 days')::BIGINT,
    (SELECT COUNT(*) FROM public.earned_mentions WHERE org_id = p_org_id AND sentiment = 'positive')::BIGINT,
    (SELECT COUNT(*) FROM public.earned_mentions WHERE org_id = p_org_id AND sentiment = 'neutral')::BIGINT,
    (SELECT COUNT(*) FROM public.earned_mentions WHERE org_id = p_org_id AND sentiment = 'negative')::BIGINT,
    (SELECT COALESCE(AVG(relevance_score), 0) FROM public.media_monitoring_articles WHERE org_id = p_org_id)::FLOAT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find similar articles by embeddings
CREATE OR REPLACE FUNCTION find_similar_articles(
  p_org_id UUID,
  p_embedding vector(1536),
  p_limit INT DEFAULT 10,
  p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  url TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.title,
    a.url,
    (1 - (a.embeddings <=> p_embedding))::FLOAT as similarity
  FROM public.media_monitoring_articles a
  WHERE a.org_id = p_org_id
    AND a.embeddings IS NOT NULL
    AND (1 - (a.embeddings <=> p_embedding)) >= p_threshold
  ORDER BY a.embeddings <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- TRIGGERS
-- ========================================

-- Updated at trigger for sources
CREATE OR REPLACE FUNCTION update_media_monitoring_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_monitoring_sources_updated_at ON public.media_monitoring_sources;
CREATE TRIGGER trigger_media_monitoring_sources_updated_at
  BEFORE UPDATE ON public.media_monitoring_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_media_monitoring_sources_updated_at();

-- Updated at trigger for articles
CREATE OR REPLACE FUNCTION update_media_monitoring_articles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_media_monitoring_articles_updated_at ON public.media_monitoring_articles;
CREATE TRIGGER trigger_media_monitoring_articles_updated_at
  BEFORE UPDATE ON public.media_monitoring_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_media_monitoring_articles_updated_at();

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE public.media_monitoring_sources IS 'Monitored publication sources for media coverage tracking (Sprint S40)';
COMMENT ON TABLE public.media_monitoring_articles IS 'Ingested articles from monitored sources with embeddings for semantic search (Sprint S40)';
COMMENT ON TABLE public.earned_mentions IS 'Detected brand/product mentions in monitored articles (Sprint S40)';
COMMENT ON FUNCTION get_media_monitoring_stats IS 'Returns aggregated statistics for media monitoring dashboard (Sprint S40)';
COMMENT ON FUNCTION find_similar_articles IS 'Finds semantically similar articles using vector embeddings (Sprint S40)';
