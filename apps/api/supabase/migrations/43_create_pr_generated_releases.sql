-- Migration 43: Press Release Generator Schema (Sprint S38)
-- Creates tables for AI-generated press releases

-- Create status enum for press releases
DO $$ BEGIN
  CREATE TYPE public.pr_release_status AS ENUM ('draft', 'generating', 'complete', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create pr_generated_releases table
CREATE TABLE IF NOT EXISTS public.pr_generated_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.pr_release_status NOT NULL DEFAULT 'draft',

  -- Input data
  input_json JSONB NOT NULL DEFAULT '{}',

  -- Generated content
  headline TEXT,
  subheadline TEXT,
  angle TEXT,
  angle_options JSONB DEFAULT '[]',
  body TEXT,
  dateline TEXT,
  quote_1 TEXT,
  quote_1_attribution TEXT,
  quote_2 TEXT,
  quote_2_attribution TEXT,
  boilerplate TEXT,

  -- SEO & optimization
  seo_summary_json JSONB DEFAULT '{}',
  optimization_history JSONB DEFAULT '[]',
  readability_score FLOAT,
  keyword_density JSONB DEFAULT '{}',

  -- Distribution prep
  distribution_notes TEXT,
  target_outlets JSONB DEFAULT '[]',

  -- Vector embeddings for similarity search
  embeddings vector(1536),

  -- Metadata
  generation_run_id UUID,
  personality_id UUID,
  word_count INTEGER DEFAULT 0,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pr_releases_org
  ON public.pr_generated_releases(org_id);

CREATE INDEX IF NOT EXISTS idx_pr_releases_org_status
  ON public.pr_generated_releases(org_id, status);

CREATE INDEX IF NOT EXISTS idx_pr_releases_org_created
  ON public.pr_generated_releases(org_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pr_releases_user
  ON public.pr_generated_releases(user_id);

-- Vector similarity index (using HNSW for fast approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_pr_releases_embeddings
  ON public.pr_generated_releases
  USING hnsw (embeddings vector_cosine_ops);

-- Enable Row Level Security
ALTER TABLE public.pr_generated_releases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY pr_releases_select_policy
  ON public.pr_generated_releases
  FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_releases_insert_policy
  ON public.pr_generated_releases
  FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_releases_update_policy
  ON public.pr_generated_releases
  FOR UPDATE
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

CREATE POLICY pr_releases_delete_policy
  ON public.pr_generated_releases
  FOR DELETE
  USING (org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()));

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_pr_releases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_pr_releases_updated_at ON public.pr_generated_releases;
CREATE TRIGGER tr_pr_releases_updated_at
  BEFORE UPDATE ON public.pr_generated_releases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pr_releases_updated_at();

-- Create function for finding similar press releases by vector similarity
CREATE OR REPLACE FUNCTION public.find_similar_pr_releases(
  p_org_id UUID,
  p_release_id UUID,
  p_embedding vector(1536),
  p_threshold FLOAT DEFAULT 0.3,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  headline TEXT,
  angle TEXT,
  status public.pr_release_status,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.id,
    pr.headline,
    pr.angle,
    pr.status,
    1 - (pr.embeddings <-> p_embedding) AS similarity,
    pr.created_at
  FROM public.pr_generated_releases pr
  WHERE pr.org_id = p_org_id
    AND pr.id != p_release_id
    AND pr.embeddings IS NOT NULL
    AND (pr.embeddings <-> p_embedding) < p_threshold
  ORDER BY pr.embeddings <-> p_embedding
  LIMIT p_limit;
END;
$$;

-- Create pr_headline_variants table for storing headline options
CREATE TABLE IF NOT EXISTS public.pr_headline_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES public.pr_generated_releases(id) ON DELETE CASCADE,
  headline TEXT NOT NULL,
  score FLOAT DEFAULT 0,
  seo_score FLOAT DEFAULT 0,
  virality_score FLOAT DEFAULT 0,
  readability_score FLOAT DEFAULT 0,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_headline_variants_release
  ON public.pr_headline_variants(release_id);

-- Enable RLS for headline variants
ALTER TABLE public.pr_headline_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY headline_variants_select_policy
  ON public.pr_headline_variants
  FOR SELECT
  USING (release_id IN (
    SELECT id FROM public.pr_generated_releases
    WHERE org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  ));

CREATE POLICY headline_variants_insert_policy
  ON public.pr_headline_variants
  FOR INSERT
  WITH CHECK (release_id IN (
    SELECT id FROM public.pr_generated_releases
    WHERE org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  ));

-- Create pr_angle_options table for storing narrative angle options
CREATE TABLE IF NOT EXISTS public.pr_angle_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id UUID NOT NULL REFERENCES public.pr_generated_releases(id) ON DELETE CASCADE,
  angle_title TEXT NOT NULL,
  angle_description TEXT,
  newsworthiness_score FLOAT DEFAULT 0,
  uniqueness_score FLOAT DEFAULT 0,
  relevance_score FLOAT DEFAULT 0,
  total_score FLOAT DEFAULT 0,
  is_selected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_angle_options_release
  ON public.pr_angle_options(release_id);

-- Enable RLS for angle options
ALTER TABLE public.pr_angle_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY angle_options_select_policy
  ON public.pr_angle_options
  FOR SELECT
  USING (release_id IN (
    SELECT id FROM public.pr_generated_releases
    WHERE org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  ));

CREATE POLICY angle_options_insert_policy
  ON public.pr_angle_options
  FOR INSERT
  WITH CHECK (release_id IN (
    SELECT id FROM public.pr_generated_releases
    WHERE org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  ));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_generated_releases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_headline_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_angle_options TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_similar_pr_releases TO authenticated;

-- Add comment
COMMENT ON TABLE public.pr_generated_releases IS 'AI-generated press releases with SEO optimization (Sprint S38)';
COMMENT ON TABLE public.pr_headline_variants IS 'Headline variations for press releases with scoring';
COMMENT ON TABLE public.pr_angle_options IS 'Narrative angle options for press releases with scoring';
