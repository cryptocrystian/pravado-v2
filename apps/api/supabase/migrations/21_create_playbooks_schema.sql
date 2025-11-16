/**
 * Migration 21: Create Playbooks & Execution Schema (Sprint S7)
 *
 * Creates tables for AI Playbook execution system:
 * - playbooks: Playbook definitions with versioning
 * - playbook_steps: Individual steps within playbooks (DAG nodes)
 * - playbook_runs: Execution instances of playbooks
 * - playbook_step_runs: Execution instances of individual steps
 */

-- ========================================
-- TABLE: playbooks
-- ========================================

CREATE TABLE IF NOT EXISTS public.playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED', 'DEPRECATED')),
  input_schema JSONB,
  output_schema JSONB,
  timeout_seconds INTEGER,
  max_retries INTEGER DEFAULT 0,
  tags TEXT[],
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for playbooks
CREATE INDEX IF NOT EXISTS idx_playbooks_org_name_version ON public.playbooks(org_id, name, version);
CREATE INDEX IF NOT EXISTS idx_playbooks_org_status ON public.playbooks(org_id, status);

-- Updated at trigger for playbooks
CREATE TRIGGER set_playbooks_updated_at
  BEFORE UPDATE ON public.playbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for playbooks
ALTER TABLE public.playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_playbooks ON public.playbooks
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY insert_playbooks ON public.playbooks
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY update_playbooks ON public.playbooks
  FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY delete_playbooks ON public.playbooks
  FOR DELETE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

-- ========================================
-- TABLE: playbook_steps
-- ========================================

CREATE TABLE IF NOT EXISTS public.playbook_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('AGENT', 'DATA', 'BRANCH', 'API')),
  config JSONB NOT NULL,
  position INTEGER NOT NULL,
  next_step_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org consistency
  CONSTRAINT fk_playbook_steps_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.playbooks WHERE id = playbook_id)
  ),

  -- Unique key within playbook
  UNIQUE(playbook_id, key)
);

-- Indexes for playbook_steps
CREATE INDEX IF NOT EXISTS idx_playbook_steps_playbook_id ON public.playbook_steps(playbook_id);
CREATE INDEX IF NOT EXISTS idx_playbook_steps_org_id ON public.playbook_steps(org_id);

-- Updated at trigger for playbook_steps
CREATE TRIGGER set_playbook_steps_updated_at
  BEFORE UPDATE ON public.playbook_steps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for playbook_steps
ALTER TABLE public.playbook_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_playbook_steps ON public.playbook_steps
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY insert_playbook_steps ON public.playbook_steps
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY update_playbook_steps ON public.playbook_steps
  FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY delete_playbook_steps ON public.playbook_steps
  FOR DELETE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

-- ========================================
-- TABLE: playbook_runs
-- ========================================

CREATE TABLE IF NOT EXISTS public.playbook_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED')),
  triggered_by UUID REFERENCES public.users(id),
  input JSONB,
  output JSONB,
  error JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org consistency
  CONSTRAINT fk_playbook_runs_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.playbooks WHERE id = playbook_id)
  )
);

-- Indexes for playbook_runs
CREATE INDEX IF NOT EXISTS idx_playbook_runs_org_playbook_created ON public.playbook_runs(org_id, playbook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playbook_runs_org_status ON public.playbook_runs(org_id, status);

-- Updated at trigger for playbook_runs
CREATE TRIGGER set_playbook_runs_updated_at
  BEFORE UPDATE ON public.playbook_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for playbook_runs
ALTER TABLE public.playbook_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_playbook_runs ON public.playbook_runs
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY insert_playbook_runs ON public.playbook_runs
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY update_playbook_runs ON public.playbook_runs
  FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY delete_playbook_runs ON public.playbook_runs
  FOR DELETE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

-- ========================================
-- TABLE: playbook_step_runs
-- ========================================

CREATE TABLE IF NOT EXISTS public.playbook_step_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.playbook_runs(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES public.playbooks(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.playbook_steps(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED')),
  input JSONB,
  output JSONB,
  error JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure org consistency
  CONSTRAINT fk_playbook_step_runs_org_consistency CHECK (
    org_id = (SELECT org_id FROM public.playbook_runs WHERE id = run_id)
  )
);

-- Indexes for playbook_step_runs
CREATE INDEX IF NOT EXISTS idx_playbook_step_runs_run_id_created ON public.playbook_step_runs(org_id, run_id, created_at);
CREATE INDEX IF NOT EXISTS idx_playbook_step_runs_playbook_step ON public.playbook_step_runs(org_id, playbook_id, step_key);

-- Updated at trigger for playbook_step_runs
CREATE TRIGGER set_playbook_step_runs_updated_at
  BEFORE UPDATE ON public.playbook_step_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS for playbook_step_runs
ALTER TABLE public.playbook_step_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_playbook_step_runs ON public.playbook_step_runs
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY insert_playbook_step_runs ON public.playbook_step_runs
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY update_playbook_step_runs ON public.playbook_step_runs
  FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

CREATE POLICY delete_playbook_step_runs ON public.playbook_step_runs
  FOR DELETE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );
