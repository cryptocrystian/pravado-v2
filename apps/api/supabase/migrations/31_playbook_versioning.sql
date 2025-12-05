/**
 * Migration 31: Playbook Versioning (Sprint S20)
 * Adds versioning system for playbook graphs and execution history
 */

-- ========================================
-- TABLE: playbook_versions
-- ========================================

CREATE TABLE IF NOT EXISTS public.playbook_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  graph JSONB NOT NULL,
  playbook_json JSONB NOT NULL,
  commit_message TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org consistency
  CONSTRAINT fk_playbook_versions_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.playbooks WHERE id = playbook_id)
  ),

  -- Unique version per playbook
  UNIQUE(playbook_id, version)
);

-- Indexes for playbook_versions
CREATE INDEX IF NOT EXISTS idx_playbook_versions_playbook_id ON public.playbook_versions(playbook_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_playbook_versions_org_id ON public.playbook_versions(org_id);
CREATE INDEX IF NOT EXISTS idx_playbook_versions_created_at ON public.playbook_versions(created_at DESC);

-- RLS for playbook_versions
ALTER TABLE public.playbook_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_playbook_versions ON public.playbook_versions
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY insert_playbook_versions ON public.playbook_versions
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

-- Update playbooks table: add current_version if not exists
ALTER TABLE public.playbooks
  ADD COLUMN IF NOT EXISTS current_version INTEGER NOT NULL DEFAULT 1;

-- Comment the new columns
COMMENT ON TABLE public.playbook_versions IS 'Version history for playbook graphs and definitions (Sprint S20)';
COMMENT ON COLUMN public.playbook_versions.graph IS 'Visual editor graph representation (nodes, edges)';
COMMENT ON COLUMN public.playbook_versions.playbook_json IS 'Compiled playbook JSON from graph';
COMMENT ON COLUMN public.playbook_versions.commit_message IS 'User-provided description of changes';
COMMENT ON COLUMN public.playbooks.current_version IS 'Current active version number';
