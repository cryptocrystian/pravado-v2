/**
 * Migration: SEO Page Audits
 * Sprint: S5
 * Description: Create table for storing on-page optimization audit results
 */

-- Create seo_page_audits table
CREATE TABLE IF NOT EXISTS public.seo_page_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL, -- 'onpage', 'technical', 'content', etc.
  score NUMERIC(5,2) CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  issues_count INTEGER NOT NULL DEFAULT 0,
  warnings_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org_id consistency between audit and page
  CONSTRAINT fk_audit_page_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.seo_pages WHERE id = page_id)
  )
);

-- Indexes for performance
CREATE INDEX idx_seo_page_audits_org_page_snapshot ON public.seo_page_audits(org_id, page_id, snapshot_at DESC);
CREATE INDEX idx_seo_page_audits_org_page_status ON public.seo_page_audits(org_id, page_id, status);
CREATE INDEX idx_seo_page_audits_org_score ON public.seo_page_audits(org_id, score DESC NULLS LAST);

-- Enable RLS
ALTER TABLE public.seo_page_audits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view page audits in their org"
  ON public.seo_page_audits FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert page audits in their org"
  ON public.seo_page_audits FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update page audits in their org"
  ON public.seo_page_audits FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete page audits in their org"
  ON public.seo_page_audits FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_seo_page_audits_updated_at
  BEFORE UPDATE ON public.seo_page_audits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
