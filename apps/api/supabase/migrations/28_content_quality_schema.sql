/**
 * Migration 28: Content Quality Scoring Schema (Sprint S14)
 *
 * Creates tables for content quality scoring and semantic analysis:
 * - content_quality_scores: Quality metrics per content item
 */

-- =====================================================
-- TABLE: content_quality_scores
-- =====================================================

CREATE TABLE IF NOT EXISTS public.content_quality_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,

  -- Quality metrics
  score NUMERIC NOT NULL,
  readability NUMERIC,
  topic_alignment NUMERIC,
  keyword_alignment NUMERIC,

  -- Flags
  thin_content BOOLEAN DEFAULT false,
  duplicate_flag BOOLEAN DEFAULT false,

  -- Warnings and recommendations
  warnings JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one score per content item
  UNIQUE(content_item_id)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Org-level queries
CREATE INDEX IF NOT EXISTS idx_content_quality_scores_org
  ON public.content_quality_scores(org_id);

-- Content item lookup
CREATE INDEX IF NOT EXISTS idx_content_quality_scores_content_item
  ON public.content_quality_scores(content_item_id);

-- Composite index for org + content item
CREATE INDEX IF NOT EXISTS idx_content_quality_scores_org_content
  ON public.content_quality_scores(org_id, content_item_id);

-- Score-based queries
CREATE INDEX IF NOT EXISTS idx_content_quality_scores_score
  ON public.content_quality_scores(org_id, score DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.content_quality_scores ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view quality scores for their org
CREATE POLICY content_quality_scores_select_policy
  ON public.content_quality_scores
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create quality scores for their org
CREATE POLICY content_quality_scores_insert_policy
  ON public.content_quality_scores
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update quality scores for their org
CREATE POLICY content_quality_scores_update_policy
  ON public.content_quality_scores
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete quality scores for their org
CREATE POLICY content_quality_scores_delete_policy
  ON public.content_quality_scores
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_content_quality_scores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_quality_scores_updated_at
  BEFORE UPDATE ON public.content_quality_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_content_quality_scores_updated_at();

-- =====================================================
-- FUNCTIONS: Semantic Similarity
-- =====================================================

/**
 * Find similar content using vector similarity
 * Uses cosine distance to find semantically similar content items
 */
CREATE OR REPLACE FUNCTION public.find_similar_content(
  p_org_id UUID,
  p_content_item_id UUID,
  p_embedding vector(1536),
  p_threshold FLOAT DEFAULT 0.15,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  title TEXT,
  slug TEXT,
  content_type TEXT,
  status TEXT,
  body TEXT,
  url TEXT,
  published_at TIMESTAMPTZ,
  word_count INT,
  reading_time_minutes INT,
  performance_score NUMERIC,
  primary_topic_id UUID,
  embeddings vector(1536),
  performance JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.org_id,
    ci.title,
    ci.slug,
    ci.content_type,
    ci.status,
    ci.body,
    ci.url,
    ci.published_at,
    ci.word_count,
    ci.reading_time_minutes,
    ci.performance_score,
    ci.primary_topic_id,
    ci.embeddings,
    ci.performance,
    ci.metadata,
    ci.created_at,
    ci.updated_at,
    (1 - (ci.embeddings <-> p_embedding))::FLOAT AS similarity
  FROM public.content_items ci
  WHERE
    ci.org_id = p_org_id
    AND ci.id != p_content_item_id
    AND ci.embeddings IS NOT NULL
    AND (ci.embeddings <-> p_embedding) < p_threshold
  ORDER BY ci.embeddings <-> p_embedding
  LIMIT p_limit;
END;
$$;
