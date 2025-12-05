/**
 * Migration 32: Playbook Branching and Version Control (Sprint S23)
 * Adds Git-like branching system for playbooks with commits, merges, and version DAG
 */

-- ========================================
-- TABLE: playbook_branches
-- ========================================

CREATE TABLE IF NOT EXISTS public.playbook_branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_branch_id UUID REFERENCES public.playbook_branches(id) ON DELETE SET NULL,
  is_protected BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org consistency
  CONSTRAINT fk_playbook_branches_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.playbooks WHERE id = playbook_id)
  ),

  -- Unique branch name per playbook
  UNIQUE(playbook_id, name)
);

-- Indexes for playbook_branches
CREATE INDEX IF NOT EXISTS idx_playbook_branches_playbook_id ON public.playbook_branches(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_branches_org_id ON public.playbook_branches(org_id);
CREATE INDEX IF NOT EXISTS idx_playbook_branches_name ON public.playbook_branches(name);

-- Updated at trigger for playbook_branches
CREATE TRIGGER set_playbook_branches_updated_at
  BEFORE UPDATE ON public.playbook_branches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for playbook_branches
ALTER TABLE public.playbook_branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_playbook_branches ON public.playbook_branches
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY insert_playbook_branches ON public.playbook_branches
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY update_playbook_branches ON public.playbook_branches
  FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY delete_playbook_branches ON public.playbook_branches
  FOR DELETE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

-- ========================================
-- TABLE: playbook_commits
-- ========================================

CREATE TABLE IF NOT EXISTS public.playbook_commits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.playbook_branches(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  graph JSONB NOT NULL,
  playbook_json JSONB NOT NULL,
  message TEXT NOT NULL,
  parent_commit_id UUID REFERENCES public.playbook_commits(id) ON DELETE SET NULL,
  merge_parent_commit_id UUID REFERENCES public.playbook_commits(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org consistency
  CONSTRAINT fk_playbook_commits_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.playbooks WHERE id = playbook_id)
  ),

  -- Unique version per branch
  UNIQUE(branch_id, version)
);

-- Indexes for playbook_commits
CREATE INDEX IF NOT EXISTS idx_playbook_commits_playbook_id ON public.playbook_commits(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_commits_branch_id ON public.playbook_commits(branch_id, version DESC);
CREATE INDEX IF NOT EXISTS idx_playbook_commits_org_id ON public.playbook_commits(org_id);
CREATE INDEX IF NOT EXISTS idx_playbook_commits_parent ON public.playbook_commits(parent_commit_id);
CREATE INDEX IF NOT EXISTS idx_playbook_commits_created_at ON public.playbook_commits(created_at DESC);

-- RLS for playbook_commits
ALTER TABLE public.playbook_commits ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_playbook_commits ON public.playbook_commits
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY insert_playbook_commits ON public.playbook_commits
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

-- Add current_branch_id to playbooks table
ALTER TABLE public.playbooks
  ADD COLUMN IF NOT EXISTS current_branch_id UUID REFERENCES public.playbook_branches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_playbooks_current_branch_id ON public.playbooks(current_branch_id);

-- ========================================
-- SEED DATA: Create "main" branch for all existing playbooks
-- ========================================

-- Create main branch for each playbook
INSERT INTO public.playbook_branches (playbook_id, org_id, name, is_protected, created_by)
SELECT
  p.id,
  p.org_id,
  'main',
  TRUE,  -- main is protected by default
  p.created_by
FROM public.playbooks p
WHERE NOT EXISTS (
  SELECT 1 FROM public.playbook_branches pb
  WHERE pb.playbook_id = p.id AND pb.name = 'main'
);

-- Create initial commit for each main branch from playbook_versions
INSERT INTO public.playbook_commits (
  playbook_id,
  org_id,
  branch_id,
  version,
  graph,
  playbook_json,
  message,
  created_by,
  created_at
)
SELECT
  pv.playbook_id,
  pv.org_id,
  pb.id,  -- branch_id
  pv.version,
  pv.graph,
  pv.playbook_json,
  COALESCE(pv.commit_message, 'Initial commit'),
  pv.created_by,
  pv.created_at
FROM public.playbook_versions pv
JOIN public.playbook_branches pb ON pb.playbook_id = pv.playbook_id AND pb.name = 'main'
WHERE NOT EXISTS (
  SELECT 1 FROM public.playbook_commits pc
  WHERE pc.branch_id = pb.id AND pc.version = pv.version
)
ORDER BY pv.playbook_id, pv.version;

-- Set parent_commit_id for commits (link them in order)
UPDATE public.playbook_commits pc
SET parent_commit_id = (
  SELECT pc2.id
  FROM public.playbook_commits pc2
  WHERE pc2.branch_id = pc.branch_id
    AND pc2.version = pc.version - 1
  LIMIT 1
)
WHERE pc.version > 1 AND pc.parent_commit_id IS NULL;

-- Set current_branch_id for all playbooks to main
UPDATE public.playbooks p
SET current_branch_id = (
  SELECT pb.id
  FROM public.playbook_branches pb
  WHERE pb.playbook_id = p.id AND pb.name = 'main'
  LIMIT 1
)
WHERE p.current_branch_id IS NULL;

-- ========================================
-- COMMENTS
-- ========================================

COMMENT ON TABLE public.playbook_branches IS 'Git-like branches for playbooks (Sprint S23)';
COMMENT ON COLUMN public.playbook_branches.name IS 'Branch name (e.g., "main", "feature-x")';
COMMENT ON COLUMN public.playbook_branches.parent_branch_id IS 'Branch this was created from';
COMMENT ON COLUMN public.playbook_branches.is_protected IS 'Protected branches require special permissions to modify';

COMMENT ON TABLE public.playbook_commits IS 'Version control commits with DAG structure (Sprint S23)';
COMMENT ON COLUMN public.playbook_commits.version IS 'Auto-incremented version per branch';
COMMENT ON COLUMN public.playbook_commits.graph IS 'Visual editor graph snapshot';
COMMENT ON COLUMN public.playbook_commits.playbook_json IS 'Compiled playbook JSON';
COMMENT ON COLUMN public.playbook_commits.message IS 'Commit message describing changes';
COMMENT ON COLUMN public.playbook_commits.parent_commit_id IS 'Previous commit in branch history';
COMMENT ON COLUMN public.playbook_commits.merge_parent_commit_id IS 'Second parent for merge commits';

COMMENT ON COLUMN public.playbooks.current_branch_id IS 'Active branch for this playbook (Sprint S23)';
