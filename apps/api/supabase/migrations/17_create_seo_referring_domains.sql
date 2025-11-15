/**
 * Migration: SEO Referring Domains
 * Sprint: S5
 * Description: Create table for storing referring domain metrics and authority scores
 */

-- Create seo_referring_domains table
CREATE TABLE IF NOT EXISTS public.seo_referring_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  domain TEXT NOT NULL, -- e.g. 'example.com'
  domain_authority INTEGER CHECK (domain_authority >= 0 AND domain_authority <= 100),
  spam_score INTEGER CHECK (spam_score >= 0 AND spam_score <= 100),
  total_backlinks INTEGER NOT NULL DEFAULT 0,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one domain record per org
  CONSTRAINT uq_seo_referring_domains_org_domain UNIQUE (org_id, domain)
);

-- Indexes for performance
CREATE INDEX idx_seo_referring_domains_org_authority ON public.seo_referring_domains(org_id, domain_authority DESC NULLS LAST);
CREATE INDEX idx_seo_referring_domains_org_backlinks ON public.seo_referring_domains(org_id, total_backlinks DESC);
CREATE INDEX idx_seo_referring_domains_domain ON public.seo_referring_domains(domain);

-- Enable RLS
ALTER TABLE public.seo_referring_domains ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view referring domains in their org"
  ON public.seo_referring_domains FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert referring domains in their org"
  ON public.seo_referring_domains FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update referring domains in their org"
  ON public.seo_referring_domains FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete referring domains in their org"
  ON public.seo_referring_domains FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_seo_referring_domains_updated_at
  BEFORE UPDATE ON public.seo_referring_domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
