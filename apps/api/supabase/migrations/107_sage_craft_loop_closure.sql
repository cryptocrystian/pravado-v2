-- Migration 107: SAGE ↔ CRAFT loop closure (Wave-2)
--
-- Closes the SAGE → CRAFT → outcome → SAGE loop. Prior to this, CRAFT "execution"
-- of a SAGE proposal was a status flip on `sage_proposals` (terminal, no governance,
-- no audit, no outcome feedback). This migration introduces the governed-execution
-- substrate that the loop rides on:
--
--   1. sage_proposals.impact_pillars   — cross-pillar attribution (SAGE_v2 Outputs).
--   2. sage_executions                 — CRAFT governed execution + state machine
--                                        (CRAFT_EXECUTION_MODEL §8), linked to the
--                                        originating proposal + signal.
--   3. sage_execution_audit            — IMMUTABLE, append-only audit trail
--                                        (CRAFT_EXECUTION_MODEL §7.1, "No Silent
--                                        Automation"). UPDATE/DELETE are blocked by
--                                        trigger.
--   4. sage_outcomes                   — execution outcome persisted back to the
--                                        originating proposal + signal (loop closed).
--   5. sage_signal_outcome_tally       — minimum-viable per-signal-type outcome
--                                        rollup that feeds back into SAGE state.
--
-- Scope note (this slice): the full mesh mechanics (decay, reinforcement matrix,
-- causal tracing, trust ladder, autonomous Autopilot execution) are LATER slices.
-- This migration only wires the loop so it is closed and auditable.

-- ============================================================================
-- 1. impact_pillars on proposals (SAGE_v2 proposal contract)
-- ============================================================================

ALTER TABLE sage_proposals
  ADD COLUMN IF NOT EXISTS impact_pillars text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN sage_proposals.impact_pillars IS
  'All pillars impacted by this proposal (primary + cross-pillar), for attribution. SAGE_v2 Outputs.';

-- ============================================================================
-- 2. sage_executions — CRAFT governed execution + state machine
--    (CRAFT_EXECUTION_MODEL §8 Action State Machine)
-- ============================================================================

CREATE TABLE sage_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES sage_proposals(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES sage_signals(id) ON DELETE SET NULL,
  signal_type text NOT NULL,
  pillar text NOT NULL CHECK (pillar IN ('PR', 'Content', 'SEO')),

  -- CRAFT state machine (canon §8.1). Proposed→Queued→Approved→Executing→Completed,
  -- with Declined/Expired/Rejected/Failed terminals.
  state text NOT NULL DEFAULT 'queued' CHECK (state IN (
    'proposed', 'queued', 'approved', 'executing',
    'completed', 'declined', 'expired', 'rejected', 'failed'
  )),

  -- Computed governance envelope (CRAFT §2.2/§4/§5). Recorded at intake so the
  -- decision is auditable and reproducible.
  mode text NOT NULL CHECK (mode IN ('manual', 'copilot', 'autopilot')),
  risk_class text NOT NULL CHECK (risk_class IN ('low', 'medium', 'high', 'critical')),
  reversibility text NOT NULL CHECK (reversibility IN ('fully', 'partially', 'irreversible')),
  confidence numeric(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  plan_ceiling text NOT NULL CHECK (plan_ceiling IN ('manual', 'copilot', 'autopilot')),
  requires_approval boolean NOT NULL DEFAULT true,

  -- Actor that initiated the execution (user id, or 'system' for autonomous — not
  -- enabled in this slice).
  initiated_by text NOT NULL,

  outcome text CHECK (outcome IS NULL OR outcome IN ('success', 'failure')),
  outcome_detail jsonb,

  queued_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sage_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read sage executions" ON sage_executions
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "service role can manage sage executions" ON sage_executions
  FOR ALL WITH CHECK (true);

CREATE INDEX idx_sage_executions_org_state ON sage_executions(org_id, state, created_at DESC);
CREATE INDEX idx_sage_executions_proposal ON sage_executions(proposal_id);
CREATE INDEX idx_sage_executions_signal ON sage_executions(signal_id);

-- ============================================================================
-- 3. sage_execution_audit — IMMUTABLE append-only audit trail
--    (CRAFT_EXECUTION_MODEL §7.1: 11 canonical fields, permanent retention)
-- ============================================================================

CREATE TABLE sage_execution_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),           -- action_id
  execution_id uuid NOT NULL REFERENCES sage_executions(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL,                               -- link to originating proposal
  event text NOT NULL,                                     -- queued|executing|completed|failed|rejected|...
  actor text NOT NULL,                                     -- user id or 'system'
  mode text NOT NULL,
  risk_class text NOT NULL,
  confidence numeric(3,2),
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  approvals jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome text,                                            -- success|failure|null
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sage_execution_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read execution audit" ON sage_execution_audit
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Append-only: only INSERT is granted via RLS; UPDATE/DELETE have no policy and
-- are additionally hard-blocked by the trigger below (defence in depth — the
-- trigger fires even for the service role / table owner, which RLS does not gate).
CREATE POLICY "service role can insert execution audit" ON sage_execution_audit
  FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION sage_execution_audit_block_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'sage_execution_audit is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sage_execution_audit_immutable
  BEFORE UPDATE OR DELETE ON sage_execution_audit
  FOR EACH ROW EXECUTE FUNCTION sage_execution_audit_block_mutation();

CREATE INDEX idx_sage_execution_audit_execution ON sage_execution_audit(execution_id, created_at);
CREATE INDEX idx_sage_execution_audit_org ON sage_execution_audit(org_id, created_at DESC);

-- ============================================================================
-- 4. sage_outcomes — execution outcome fed back to proposal + signal (loop closed)
-- ============================================================================

CREATE TABLE sage_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  execution_id uuid NOT NULL REFERENCES sage_executions(id) ON DELETE CASCADE,
  proposal_id uuid NOT NULL REFERENCES sage_proposals(id) ON DELETE CASCADE,
  signal_id uuid REFERENCES sage_signals(id) ON DELETE SET NULL,
  signal_type text NOT NULL,
  pillar text NOT NULL CHECK (pillar IN ('PR', 'Content', 'SEO')),
  impact_pillars text[] NOT NULL DEFAULT '{}'::text[],
  result text NOT NULL CHECK (result IN ('success', 'failure')),
  evi_impact_estimate numeric(5,2),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sage_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read sage outcomes" ON sage_outcomes
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "service role can manage sage outcomes" ON sage_outcomes
  FOR ALL WITH CHECK (true);

CREATE INDEX idx_sage_outcomes_proposal ON sage_outcomes(proposal_id);
CREATE INDEX idx_sage_outcomes_signal ON sage_outcomes(signal_id);
CREATE INDEX idx_sage_outcomes_org_type ON sage_outcomes(org_id, signal_type, created_at DESC);

-- ============================================================================
-- 5. sage_signal_outcome_tally — minimum-viable feedback into SAGE state
--    (per-signal-type success/failure rollup; the seed of pattern reinforcement)
-- ============================================================================

CREATE TABLE sage_signal_outcome_tally (
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  signal_type text NOT NULL,
  success_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  last_outcome_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, signal_type)
);

ALTER TABLE sage_signal_outcome_tally ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read signal outcome tally" ON sage_signal_outcome_tally
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "service role can manage signal outcome tally" ON sage_signal_outcome_tally
  FOR ALL WITH CHECK (true);
