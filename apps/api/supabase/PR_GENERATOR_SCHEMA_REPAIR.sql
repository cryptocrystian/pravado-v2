/**
 * PR Generator Schema Repair Script
 *
 * Creates the tables required for the Press Release Generator:
 * - pr_generated_releases
 * - pr_headline_variants
 * - pr_angle_options
 *
 * Based on migration 43 but with fixes:
 * - Uses 'orgs' instead of 'organizations'
 * - Uses 'org_members' instead of 'user_orgs'
 * - Skips vector/embeddings since pgvector may not be enabled
 */

-- Create status enum for press releases
DO $$ BEGIN
  CREATE TYPE public.pr_release_status AS ENUM ('draft', 'generating', 'complete', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create pr_generated_releases table
CREATE TABLE IF NOT EXISTS public.pr_generated_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
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

-- Enable Row Level Security
ALTER TABLE public.pr_generated_releases ENABLE ROW LEVEL SECURITY;

-- RLS Policies (using org_members instead of user_orgs)
DROP POLICY IF EXISTS pr_releases_select_policy ON public.pr_generated_releases;
CREATE POLICY pr_releases_select_policy
  ON public.pr_generated_releases
  FOR SELECT
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_releases_insert_policy ON public.pr_generated_releases;
CREATE POLICY pr_releases_insert_policy
  ON public.pr_generated_releases
  FOR INSERT
  WITH CHECK (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_releases_update_policy ON public.pr_generated_releases;
CREATE POLICY pr_releases_update_policy
  ON public.pr_generated_releases
  FOR UPDATE
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS pr_releases_delete_policy ON public.pr_generated_releases;
CREATE POLICY pr_releases_delete_policy
  ON public.pr_generated_releases
  FOR DELETE
  USING (org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid()));

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

DROP POLICY IF EXISTS headline_variants_select_policy ON public.pr_headline_variants;
CREATE POLICY headline_variants_select_policy
  ON public.pr_headline_variants
  FOR SELECT
  USING (release_id IN (
    SELECT id FROM public.pr_generated_releases
    WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS headline_variants_insert_policy ON public.pr_headline_variants;
CREATE POLICY headline_variants_insert_policy
  ON public.pr_headline_variants
  FOR INSERT
  WITH CHECK (release_id IN (
    SELECT id FROM public.pr_generated_releases
    WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
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

DROP POLICY IF EXISTS angle_options_select_policy ON public.pr_angle_options;
CREATE POLICY angle_options_select_policy
  ON public.pr_angle_options
  FOR SELECT
  USING (release_id IN (
    SELECT id FROM public.pr_generated_releases
    WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  ));

DROP POLICY IF EXISTS angle_options_insert_policy ON public.pr_angle_options;
CREATE POLICY angle_options_insert_policy
  ON public.pr_angle_options
  FOR INSERT
  WITH CHECK (release_id IN (
    SELECT id FROM public.pr_generated_releases
    WHERE org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  ));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_generated_releases TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_headline_variants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pr_angle_options TO authenticated;

-- Add comment
COMMENT ON TABLE public.pr_generated_releases IS 'AI-generated press releases with SEO optimization (Sprint S38)';
COMMENT ON TABLE public.pr_headline_variants IS 'Headline variations for press releases with scoring';
COMMENT ON TABLE public.pr_angle_options IS 'Narrative angle options for press releases with scoring';

-- Verification
SELECT 'PR Generator tables created:' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN (
  'pr_generated_releases', 'pr_headline_variants', 'pr_angle_options'
);
