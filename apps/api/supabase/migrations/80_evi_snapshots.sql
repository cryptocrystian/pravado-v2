-- Migration 80: EVI Snapshots table
-- Sprint S-INT-01: EVI Calculation Pipeline
-- Stores point-in-time EVI score snapshots with full signal audit trail

CREATE TABLE evi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  evi_score numeric(5,2) NOT NULL,
  visibility_score numeric(5,2) NOT NULL,
  authority_score numeric(5,2) NOT NULL,
  momentum_score numeric(5,2) NOT NULL,
  signal_breakdown jsonb NOT NULL,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  period_days integer NOT NULL DEFAULT 30
);

ALTER TABLE evi_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read evi" ON evi_snapshots
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service role can insert evi" ON evi_snapshots
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_evi_snapshots_org_date ON evi_snapshots(org_id, calculated_at DESC);
