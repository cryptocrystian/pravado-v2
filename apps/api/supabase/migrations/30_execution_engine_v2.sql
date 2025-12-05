/**
 * Migration 30: Execution Engine V2 (Sprint S18)
 * Adds async execution states, worker info, webhooks, and logging
 */

-- Add new columns to playbook_runs
ALTER TABLE playbook_runs
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS worker_info jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS webhook_url text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Add check constraint for valid states
ALTER TABLE playbook_runs
  ADD CONSTRAINT playbook_runs_state_check
  CHECK (state IN ('queued', 'running', 'success', 'failed', 'waiting_for_dependencies', 'blocked', 'canceled'));

-- Add new columns to playbook_step_runs
ALTER TABLE playbook_step_runs
  ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'queued',
  ADD COLUMN IF NOT EXISTS attempt integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS logs text[],
  ADD COLUMN IF NOT EXISTS worker_info jsonb DEFAULT '{}'::jsonb;

-- Add check constraint for valid states
ALTER TABLE playbook_step_runs
  ADD CONSTRAINT playbook_step_runs_state_check
  CHECK (state IN ('queued', 'running', 'success', 'failed', 'waiting_for_dependencies', 'blocked', 'canceled'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_playbook_runs_state ON playbook_runs(state);
CREATE INDEX IF NOT EXISTS idx_playbook_runs_started_at ON playbook_runs(started_at);
CREATE INDEX IF NOT EXISTS idx_playbook_runs_completed_at ON playbook_runs(completed_at);

CREATE INDEX IF NOT EXISTS idx_playbook_step_runs_state ON playbook_step_runs(state);
CREATE INDEX IF NOT EXISTS idx_playbook_step_runs_run_id_state ON playbook_step_runs(run_id, state);
CREATE INDEX IF NOT EXISTS idx_playbook_step_runs_attempt ON playbook_step_runs(attempt);

-- Add index for querying queued/running jobs
CREATE INDEX IF NOT EXISTS idx_playbook_step_runs_executable
  ON playbook_step_runs(run_id, state)
  WHERE state IN ('queued', 'waiting_for_dependencies');

-- Comment the new columns
COMMENT ON COLUMN playbook_runs.state IS 'Current execution state of the playbook run';
COMMENT ON COLUMN playbook_runs.worker_info IS 'Worker metadata (workerId, timestamps, etc.)';
COMMENT ON COLUMN playbook_runs.webhook_url IS 'Optional webhook URL to call on completion';
COMMENT ON COLUMN playbook_runs.started_at IS 'When execution actually started';
COMMENT ON COLUMN playbook_runs.completed_at IS 'When execution completed (success or failure)';

COMMENT ON COLUMN playbook_step_runs.state IS 'Current execution state of the step';
COMMENT ON COLUMN playbook_step_runs.attempt IS 'Current attempt number (0-indexed)';
COMMENT ON COLUMN playbook_step_runs.max_attempts IS 'Maximum retry attempts allowed';
COMMENT ON COLUMN playbook_step_runs.logs IS 'Array of log entries for this step';
COMMENT ON COLUMN playbook_step_runs.worker_info IS 'Worker metadata for this step execution';
