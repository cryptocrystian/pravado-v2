-- Migration 23: Extend playbook_step_runs for Agent Collaboration (Sprint S9)
-- Adds collaboration context and escalation tracking for multi-agent workflows

-- Add collaboration context column (stores inter-agent messages, context handoffs)
ALTER TABLE public.playbook_step_runs
ADD COLUMN IF NOT EXISTS collaboration_context JSONB DEFAULT '{}'::JSONB;

-- Add escalation level column (tracks escalation ladder: none, agent, supervisor, human)
ALTER TABLE public.playbook_step_runs
ADD COLUMN IF NOT EXISTS escalation_level TEXT DEFAULT 'none';

-- Create index for collaboration queries (org-scoped, run-scoped lookups)
CREATE INDEX IF NOT EXISTS idx_playbook_step_runs_collab
ON public.playbook_step_runs (org_id, run_id, step_id);

-- Add column comments for documentation
COMMENT ON COLUMN public.playbook_step_runs.collaboration_context IS 'Stores inter-agent messages, shared state, and context handoffs for multi-agent collaboration';
COMMENT ON COLUMN public.playbook_step_runs.escalation_level IS 'Escalation level: none (default), agent (peer delegation), supervisor (escalated to supervisor agent), human (requires human intervention)';

-- Add check constraint for valid escalation levels
ALTER TABLE public.playbook_step_runs
ADD CONSTRAINT playbook_step_runs_escalation_level_check
CHECK (escalation_level IN ('none', 'agent', 'supervisor', 'human'));
