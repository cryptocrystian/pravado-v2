/**
 * Migration 22: Extend playbook_runs for simulation mode (Sprint S8)
 * Add is_simulation flag and index for simulation queries
 */

-- Add is_simulation column to playbook_runs
ALTER TABLE public.playbook_runs
ADD COLUMN IF NOT EXISTS is_simulation BOOLEAN NOT NULL DEFAULT false;

-- Add index for simulation queries (org_id, playbook_id, is_simulation, created_at)
CREATE INDEX IF NOT EXISTS idx_playbook_runs_simulation
ON public.playbook_runs (org_id, playbook_id, is_simulation, created_at DESC);

-- Comment for documentation
COMMENT ON COLUMN public.playbook_runs.is_simulation IS 'Indicates if this run is a simulation/dry-run (true) or actual execution (false)';
