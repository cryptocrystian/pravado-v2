/**
 * Migration 27: Add Content Generated Briefs (Sprint S13)
 * Stores AI-generated content briefs from the Brief Generator V1
 */

-- ========================================
-- CREATE content_generated_briefs TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS public.content_generated_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  playbook_run_id UUID REFERENCES public.playbook_runs(id) ON DELETE SET NULL,
  brief JSONB NOT NULL,
  outline JSONB,
  seo_context JSONB,
  personality_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================

-- Index for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_content_generated_briefs_org
  ON public.content_generated_briefs(org_id);

-- Index for content item relationship
CREATE INDEX IF NOT EXISTS idx_content_generated_briefs_content_item
  ON public.content_generated_briefs(content_item_id);

-- Index for chronological listing
CREATE INDEX IF NOT EXISTS idx_content_generated_briefs_created_at
  ON public.content_generated_briefs(org_id, created_at DESC);

-- ========================================
-- RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE public.content_generated_briefs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view briefs for their orgs
CREATE POLICY content_generated_briefs_select_policy
  ON public.content_generated_briefs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert briefs for their orgs
CREATE POLICY content_generated_briefs_insert_policy
  ON public.content_generated_briefs
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can update briefs for their orgs
CREATE POLICY content_generated_briefs_update_policy
  ON public.content_generated_briefs
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete briefs for their orgs
CREATE POLICY content_generated_briefs_delete_policy
  ON public.content_generated_briefs
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );
