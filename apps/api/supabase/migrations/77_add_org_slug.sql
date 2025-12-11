-- Add slug column to orgs table for demo seed script (S89)
ALTER TABLE public.orgs ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create unique index on slug (allow nulls for existing orgs)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orgs_slug ON public.orgs(slug) WHERE slug IS NOT NULL;
