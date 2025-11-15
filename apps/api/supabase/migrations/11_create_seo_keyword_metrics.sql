/**
 * Migration: SEO Keyword Metrics
 * Sprint: S4
 * Description: Create table for storing keyword intelligence metrics from various sources
 */

-- Create seo_keyword_metrics table
CREATE TABLE IF NOT EXISTS public.seo_keyword_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  keyword_id UUID NOT NULL REFERENCES public.seo_keywords(id) ON DELETE CASCADE,
  source TEXT NOT NULL, -- 'gsc', 'llm_estimate', 'external_api', 'manual'
  search_volume INTEGER,
  difficulty INTEGER CHECK (difficulty >= 0 AND difficulty <= 100),
  cpc NUMERIC(10,2),
  click_through_rate NUMERIC(5,2) CHECK (click_through_rate >= 0 AND click_through_rate <= 100),
  priority_score NUMERIC(5,2) CHECK (priority_score >= 0 AND priority_score <= 100),
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org_id consistency between metric and keyword
  CONSTRAINT fk_keyword_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.seo_keywords WHERE id = keyword_id)
  )
);

-- Index for faster lookups
CREATE INDEX idx_seo_keyword_metrics_org_id ON public.seo_keyword_metrics(org_id);
CREATE INDEX idx_seo_keyword_metrics_keyword_id ON public.seo_keyword_metrics(keyword_id);
CREATE INDEX idx_seo_keyword_metrics_source ON public.seo_keyword_metrics(source);
CREATE INDEX idx_seo_keyword_metrics_priority_score ON public.seo_keyword_metrics(priority_score DESC NULLS LAST);

-- Enable RLS
ALTER TABLE public.seo_keyword_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view keyword metrics in their org"
  ON public.seo_keyword_metrics FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert keyword metrics in their org"
  ON public.seo_keyword_metrics FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update keyword metrics in their org"
  ON public.seo_keyword_metrics FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete keyword metrics in their org"
  ON public.seo_keyword_metrics FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_seo_keyword_metrics_updated_at
  BEFORE UPDATE ON public.seo_keyword_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
