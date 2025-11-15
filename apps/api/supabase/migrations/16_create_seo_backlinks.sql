/**
 * Migration: SEO Backlinks
 * Sprint: S5
 * Description: Create table for storing backlink data and tracking link profiles
 */

-- Create seo_backlinks table
CREATE TABLE IF NOT EXISTS public.seo_backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  page_id UUID REFERENCES public.seo_pages(id) ON DELETE CASCADE, -- Our page receiving the link
  source_url TEXT NOT NULL, -- URL that links to us
  anchor_text TEXT,
  link_type TEXT NOT NULL CHECK (link_type IN ('dofollow', 'nofollow', 'ugc', 'sponsored')),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lost_at TIMESTAMPTZ, -- NULL if still active, set when link is no longer detected
  referring_domain_id UUID REFERENCES public.seo_referring_domains(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org_id consistency when page_id is set
  CONSTRAINT fk_backlink_page_org_consistency CHECK (
    page_id IS NULL OR org_id = (SELECT org_id FROM public.seo_pages WHERE id = page_id)
  )
);

-- Indexes for performance
CREATE INDEX idx_seo_backlinks_org_page_last_seen ON public.seo_backlinks(org_id, page_id, last_seen_at DESC);
CREATE INDEX idx_seo_backlinks_org_link_type ON public.seo_backlinks(org_id, link_type);
CREATE INDEX idx_seo_backlinks_referring_domain ON public.seo_backlinks(referring_domain_id);
CREATE INDEX idx_seo_backlinks_org_active ON public.seo_backlinks(org_id, lost_at) WHERE lost_at IS NULL;

-- Enable RLS
ALTER TABLE public.seo_backlinks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view backlinks in their org"
  ON public.seo_backlinks FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert backlinks in their org"
  ON public.seo_backlinks FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update backlinks in their org"
  ON public.seo_backlinks FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete backlinks in their org"
  ON public.seo_backlinks FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_seo_backlinks_updated_at
  BEFORE UPDATE ON public.seo_backlinks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
