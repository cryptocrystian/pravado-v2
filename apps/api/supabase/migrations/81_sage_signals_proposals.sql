-- Migration 81: SAGE Signals & Proposals tables
-- Sprint S-INT-02: SAGE Signal Ingestion Pipeline + Opportunity Scorer

-- ============================================================================
-- sage_signals: Raw scored signals from all three pillars
-- ============================================================================

CREATE TABLE sage_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  pillar text NOT NULL CHECK (pillar IN ('PR', 'Content', 'SEO')),
  source_table text NOT NULL,
  source_id uuid,
  signal_data jsonb NOT NULL,
  evi_impact_estimate numeric(5,2),
  confidence numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  expires_at timestamptz,
  scored_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sage_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read sage signals" ON sage_signals
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service role can insert sage signals" ON sage_signals
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_sage_signals_org_scored ON sage_signals(org_id, scored_at DESC);
CREATE INDEX idx_sage_signals_org_priority ON sage_signals(org_id, priority, scored_at DESC);
CREATE INDEX idx_sage_signals_source ON sage_signals(source_table, source_id);
CREATE INDEX idx_sage_signals_expiry ON sage_signals(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- sage_proposals: LLM-generated action proposals (Sprint S-INT-03 will populate)
-- ============================================================================

CREATE TABLE sage_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES sage_signals(id) ON DELETE SET NULL,
  signal_type text NOT NULL,
  pillar text NOT NULL CHECK (pillar IN ('PR', 'Content', 'SEO')),
  priority text NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  title text NOT NULL,
  rationale text NOT NULL,
  evi_impact_estimate numeric(5,2),
  confidence numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  mode text NOT NULL DEFAULT 'copilot' CHECK (mode IN ('manual', 'copilot', 'autopilot')),
  deep_link jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'executed', 'expired')),
  expires_at timestamptz,
  reasoning_trace jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sage_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read sage proposals" ON sage_proposals
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "service role can manage sage proposals" ON sage_proposals
  FOR ALL WITH CHECK (true);

CREATE INDEX idx_sage_proposals_org_status ON sage_proposals(org_id, status, created_at DESC);
CREATE INDEX idx_sage_proposals_org_priority ON sage_proposals(org_id, priority, created_at DESC);
