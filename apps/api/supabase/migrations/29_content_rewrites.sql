/**
 * Migration 29: Content Rewrites Schema (Sprint S15)
 *
 * Creates tables for semantic content rewriting:
 * - content_rewrites: Rewrite versions with diffs, improvements, and quality metrics
 */

-- =====================================================
-- TABLE: content_rewrites
-- =====================================================

CREATE TABLE IF NOT EXISTS public.content_rewrites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  playbook_run_id UUID REFERENCES public.playbook_runs(id) ON DELETE SET NULL,

  -- Content versions
  original_text TEXT NOT NULL,
  rewritten_text TEXT NOT NULL,

  -- Rewrite metadata
  diff JSONB,             -- Semantic diff representation
  improvements JSONB,     -- List of improvements applied
  reasoning JSONB,        -- Why changes were applied

  -- Quality metrics
  readability_before NUMERIC,
  readability_after NUMERIC,

  quality_before NUMERIC,
  quality_after NUMERIC,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Org-level queries with content item lookup
CREATE INDEX IF NOT EXISTS idx_content_rewrites_org_content
  ON public.content_rewrites(org_id, content_item_id);

-- Recent rewrites
CREATE INDEX IF NOT EXISTS idx_content_rewrites_created
  ON public.content_rewrites(org_id, created_at DESC);

-- Playbook run association
CREATE INDEX IF NOT EXISTS idx_content_rewrites_playbook
  ON public.content_rewrites(playbook_run_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.content_rewrites ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view rewrites for their org
CREATE POLICY content_rewrites_select_policy
  ON public.content_rewrites
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create rewrites for their org
CREATE POLICY content_rewrites_insert_policy
  ON public.content_rewrites
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update rewrites for their org
CREATE POLICY content_rewrites_update_policy
  ON public.content_rewrites
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete rewrites for their org
CREATE POLICY content_rewrites_delete_policy
  ON public.content_rewrites
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id
      FROM public.user_orgs
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_content_rewrites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_rewrites_updated_at
  BEFORE UPDATE ON public.content_rewrites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_content_rewrites_updated_at();
