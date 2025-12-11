-- Migration 42: Create audit_replay_runs table (Sprint S37)
-- Stores replay job metadata and results for the Audit Replay Engine

-- Create enum for replay status
CREATE TYPE audit_replay_status AS ENUM ('queued', 'running', 'success', 'failed');

-- Create audit_replay_runs table
CREATE TABLE IF NOT EXISTS audit_replay_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status audit_replay_status NOT NULL DEFAULT 'queued',
  filters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  result_json jsonb,
  event_count integer DEFAULT 0,
  snapshot_count integer DEFAULT 0,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_audit_replay_runs_org_id ON audit_replay_runs(org_id);
CREATE INDEX idx_audit_replay_runs_user_id ON audit_replay_runs(user_id);
CREATE INDEX idx_audit_replay_runs_status ON audit_replay_runs(status);
CREATE INDEX idx_audit_replay_runs_created_at ON audit_replay_runs(created_at DESC);

-- Enable Row Level Security
ALTER TABLE audit_replay_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view replay runs for their organization
CREATE POLICY "Users can view own org replay runs"
  ON audit_replay_runs
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: Only admins can create replay runs
CREATE POLICY "Admins can create replay runs"
  ON audit_replay_runs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = audit_replay_runs.org_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('admin', 'owner')
    )
  );

-- RLS Policy: System can update replay runs (for job processing)
CREATE POLICY "System can update replay runs"
  ON audit_replay_runs
  FOR UPDATE
  USING (true);

-- Create audit_replay_snapshots table for storing state snapshots
CREATE TABLE IF NOT EXISTS audit_replay_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  replay_run_id uuid NOT NULL REFERENCES audit_replay_runs(id) ON DELETE CASCADE,
  snapshot_index integer NOT NULL,
  event_id uuid,
  event_type text NOT NULL,
  timestamp timestamptz NOT NULL,
  state_before jsonb,
  state_after jsonb,
  diff_json jsonb,
  entity_type text,
  entity_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(replay_run_id, snapshot_index)
);

-- Create indexes for snapshot queries
CREATE INDEX idx_audit_replay_snapshots_run_id ON audit_replay_snapshots(replay_run_id);
CREATE INDEX idx_audit_replay_snapshots_event_type ON audit_replay_snapshots(event_type);
CREATE INDEX idx_audit_replay_snapshots_timestamp ON audit_replay_snapshots(timestamp);

-- Enable RLS on snapshots
ALTER TABLE audit_replay_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view snapshots for their org's replay runs
CREATE POLICY "Users can view own org replay snapshots"
  ON audit_replay_snapshots
  FOR SELECT
  USING (
    replay_run_id IN (
      SELECT id FROM audit_replay_runs
      WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: System can insert snapshots
CREATE POLICY "System can insert replay snapshots"
  ON audit_replay_snapshots
  FOR INSERT
  WITH CHECK (true);

-- Add comments
COMMENT ON TABLE audit_replay_runs IS 'Stores audit replay job runs and their results';
COMMENT ON TABLE audit_replay_snapshots IS 'Stores state snapshots for each event in a replay';
COMMENT ON COLUMN audit_replay_runs.filters_json IS 'Filters used for the replay (event types, date range, etc.)';
COMMENT ON COLUMN audit_replay_runs.result_json IS 'Summary of replay results including timeline and statistics';
COMMENT ON COLUMN audit_replay_snapshots.diff_json IS 'JSON diff between state_before and state_after';
