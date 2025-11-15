/**
 * Migration: SEO Page Issues
 * Sprint: S5
 * Description: Create table for storing on-page optimization issues and warnings
 */

-- Create seo_page_issues table
CREATE TABLE IF NOT EXISTS public.seo_page_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES public.seo_page_audits(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.seo_pages(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL, -- 'missing_title', 'thin_content', 'slow_performance', 'missing_meta', 'duplicate_h1', etc.
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  field TEXT, -- 'title', 'meta_description', 'h1', 'content', 'images', etc.
  message TEXT NOT NULL, -- Human-readable issue description
  hint TEXT, -- Optional recommendation for fixing the issue
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org_id consistency across audit, page, and issue
  CONSTRAINT fk_issue_audit_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.seo_page_audits WHERE id = audit_id)
  ),
  CONSTRAINT fk_issue_page_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.seo_pages WHERE id = page_id)
  )
);

-- Indexes for performance
CREATE INDEX idx_seo_page_issues_org_page ON public.seo_page_issues(org_id, page_id);
CREATE INDEX idx_seo_page_issues_org_severity ON public.seo_page_issues(org_id, severity);
CREATE INDEX idx_seo_page_issues_audit ON public.seo_page_issues(audit_id);

-- Enable RLS
ALTER TABLE public.seo_page_issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view page issues in their org"
  ON public.seo_page_issues FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert page issues in their org"
  ON public.seo_page_issues FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update page issues in their org"
  ON public.seo_page_issues FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete page issues in their org"
  ON public.seo_page_issues FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_seo_page_issues_updated_at
  BEFORE UPDATE ON public.seo_page_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
