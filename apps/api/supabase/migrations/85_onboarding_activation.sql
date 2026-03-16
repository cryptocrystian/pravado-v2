/**
 * Migration: Onboarding Activation (Sprint S-INT-07)
 * - Competitor tracking table
 * - Onboarding progress columns on orgs
 */

-- Competitor tracking
CREATE TABLE IF NOT EXISTS public.org_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  name TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, domain)
);

ALTER TABLE public.org_competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage competitors" ON public.org_competitors
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

CREATE INDEX idx_org_competitors_org_id ON public.org_competitors(org_id);

-- Onboarding tracking columns on orgs
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS company_size TEXT;
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS completed_onboarding_at TIMESTAMPTZ;
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS onboarding_skips JSONB DEFAULT '{}';
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
