/**
 * Migration: SEO SERP Results
 * Sprint: S4
 * Description: Create table for storing SERP position data and competitor tracking
 */

-- Create seo_serp_results table
CREATE TABLE IF NOT EXISTS public.seo_serp_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  snippet TEXT,
  rank INTEGER NOT NULL CHECK (rank > 0),
  is_competitor BOOLEAN DEFAULT true,
  competitor_id UUID REFERENCES public.seo_competitors(id) ON DELETE SET NULL,
  snapshot_id UUID REFERENCES public.seo_snapshots(id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org_id consistency
  CONSTRAINT fk_serp_keyword_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.seo_keywords WHERE id = keyword_id)
  )
);

-- Indexes for performance
CREATE INDEX idx_seo_serp_results_org_id ON public.seo_serp_results(org_id);
CREATE INDEX idx_seo_serp_results_keyword_id ON public.seo_serp_results(keyword_id);
CREATE INDEX idx_seo_serp_results_snapshot_id ON public.seo_serp_results(snapshot_id);
CREATE INDEX idx_seo_serp_results_competitor_id ON public.seo_serp_results(competitor_id);
CREATE INDEX idx_seo_serp_results_rank ON public.seo_serp_results(rank);
CREATE INDEX idx_seo_serp_results_url ON public.seo_serp_results(url);

-- Enable RLS
ALTER TABLE public.seo_serp_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view SERP results in their org"
  ON public.seo_serp_results FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SERP results in their org"
  ON public.seo_serp_results FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update SERP results in their org"
  ON public.seo_serp_results FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete SERP results in their org"
  ON public.seo_serp_results FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_seo_serp_results_updated_at
  BEFORE UPDATE ON public.seo_serp_results
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
