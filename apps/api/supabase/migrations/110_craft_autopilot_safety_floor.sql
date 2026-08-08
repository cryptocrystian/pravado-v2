-- Migration 110: CRAFT Autopilot prerequisites — the SAFETY FLOOR (Wave-2)
--
-- This migration ships the trust-ladder + execution-guardrail substrate that canon
-- (CRAFT_EXECUTION_MODEL §2.2/§2.3 trust ladder, §6 plan-tier guardrails) REQUIRES to
-- exist BEFORE autonomous Autopilot execution can ever be enabled.
--
-- CRITICAL: this migration does NOT enable autonomous execution. `AUTONOMOUS_AUTOPILOT_ENABLED`
-- stays `false` (craftExecutionService.ts). Execution stays human-initiated. These tables
-- gate/annotate a SIMULATED autonomous path so the safety infrastructure is proven correct
-- while autonomy is still off. They are the switches a LATER slice depends on before it may
-- flip the flag.
--
--   1. craft_pillar_trust     — per-(org, pillar) trust ladder state (New→Established→
--                               Proven→Veteran), graduated from earned signal
--                               (successful governed executions, human approvals vs
--                               dismissals) per CRAFT_EXECUTION_MODEL §2.3. Trust is an
--                               INPUT to computeExecutionMode: a low-trust pillar can
--                               never reach Autopilot eligibility even at high confidence.
--   2. craft_kill_switch      — per-org kill-switch. A single engaged flag halts ALL
--                               autonomous execution instantly (CRAFT §11.2 "Cost Overrun /
--                               Trust Regression → halt"; SAGE "Automation Overreach").
--   3. craft_governance_audit — IMMUTABLE, append-only audit for trust-level changes and
--                               kill-switch toggles (CRAFT §7.1 "No Silent Automation").
--                               UPDATE/DELETE blocked by trigger.
--   4. sage_executions annotations — guardrail_decision / trust_ceiling / kill_switch_engaged
--                               recorded at intake so the (currently inert) autonomous-gate
--                               decision is auditable and reproducible.
--
-- WRITE MODEL (SECURITY): all new tables are written ONLY by the server-side execution
-- engine via the Supabase SERVICE ROLE (RLS bypass). RLS stays ENABLED with org-scoped
-- SELECT only — an authenticated client reads its own org's rows but can NEVER
-- insert/update/delete (which would let a user forge a trust level, disengage a kill
-- switch, or forge governance audit rows). Mirrors migration 107.
--
-- PER-PILLAR TRUST DESIGN NOTE: canon §2.3 defines the trust ladder at the ORGANIZATION
-- level ("Trust is earned through successful execution without incident"). This slice
-- refines it to per-(org, pillar) — canon's thresholds are applied INDEPENDENTLY to each
-- pillar's own counters. This is a refinement (a pillar with a bad track record cannot
-- lend its trust to a different pillar), NOT a divergence: every threshold value is taken
-- verbatim from canon §2.3. The pillar vocabulary ('PR','Content','SEO') matches
-- sage_executions (migration 107) since trust is earned from execution outcomes.

-- ============================================================================
-- 1. craft_pillar_trust — per-(org, pillar) trust ladder (CRAFT §2.3)
-- ============================================================================

CREATE TABLE craft_pillar_trust (
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  pillar text NOT NULL CHECK (pillar IN ('PR', 'Content', 'SEO')),

  -- Graduated trust level (CRAFT §2.3). 'new' → Manual only; 'established' → Copilot
  -- eligible; 'proven' → Autopilot eligible; 'veteran' → extended Autopilot scope.
  trust_level text NOT NULL DEFAULT 'new'
    CHECK (trust_level IN ('new', 'established', 'proven', 'veteran')),

  -- Earned signal (CRAFT §2.3 graduation requirements).
  --   successful_executions: completed-without-incident governed executions.
  --   failed_executions:     executions that terminated in 'failed'.
  --   critical_failures:     failures on a critical-risk-class execution (§2.3
  --                          "0 critical failures" for Established; drops a tier on decay).
  --   human_approvals / human_dismissals: the human-in-the-loop trust signal — a pillar
  --                          whose proposals humans keep dismissing does not earn trust.
  successful_executions integer NOT NULL DEFAULT 0,
  failed_executions integer NOT NULL DEFAULT 0,
  critical_failures integer NOT NULL DEFAULT 0,
  human_approvals integer NOT NULL DEFAULT 0,
  human_dismissals integer NOT NULL DEFAULT 0,

  -- Trust score in [0,1] for the DECAY rules (§2.3): moderate failure −10%, inactivity
  -- >60 days −20%. The discrete trust_level is the graduation gate; trust_score is the
  -- continuous decay accumulator a later slice folds back into level regression.
  trust_score numeric(4,3) NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 1),

  -- '90+ days active' / '180+ days' (§2.3) measured from first_active_at; inactivity
  -- decay (§2.3 ">60 days −20%") measured from last_activity_at.
  first_active_at timestamptz,
  last_activity_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (org_id, pillar)
);

ALTER TABLE craft_pillar_trust ENABLE ROW LEVEL SECURITY;

-- Read: org members. Write: service role only (RLS bypass); no authenticated-user write
-- policy — a user must never be able to forge their own trust level to unlock Autopilot.
CREATE POLICY "org members can read pillar trust" ON craft_pillar_trust
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

CREATE INDEX idx_craft_pillar_trust_org ON craft_pillar_trust(org_id);

-- ============================================================================
-- 2. craft_kill_switch — per-org emergency halt of all autonomous execution
--    (CRAFT §11.2 Trust Regression / Cost Overrun → halt)
-- ============================================================================

CREATE TABLE craft_kill_switch (
  org_id uuid PRIMARY KEY REFERENCES orgs(id) ON DELETE CASCADE,
  -- When engaged, NO autonomous execution may proceed for this org (checked in the
  -- autonomous-execution gate). Human-initiated execution is unaffected — the kill
  -- switch halts AUTONOMY, not the product.
  engaged boolean NOT NULL DEFAULT false,
  engaged_by text,                    -- user id or 'system' (automatic trust-regression halt)
  engaged_at timestamptz,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE craft_kill_switch ENABLE ROW LEVEL SECURITY;

-- Read: org members. Write: service role only. A user must not be able to silently
-- DISENGAGE the kill switch by forging a row — the toggle goes through the service.
CREATE POLICY "org members can read kill switch" ON craft_kill_switch
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- ============================================================================
-- 3. craft_governance_audit — IMMUTABLE audit of trust changes + kill-switch toggles
--    (CRAFT §7.1: "No Silent Automation" — every authority change is traceable)
-- ============================================================================

CREATE TABLE craft_governance_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  -- 'trust_level_change' | 'trust_counter_update' | 'kill_switch_engaged' |
  -- 'kill_switch_disengaged'
  event text NOT NULL,
  pillar text,                        -- set for trust events; null for kill-switch
  actor text NOT NULL,                -- user id or 'system'
  before_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  after_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE craft_governance_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read governance audit" ON craft_governance_audit
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Append-only: block UPDATE/DELETE for EVERY role (fires regardless of service role),
-- mirroring sage_execution_audit (migration 107).
CREATE OR REPLACE FUNCTION craft_governance_audit_block_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'craft_governance_audit is append-only: % is not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER craft_governance_audit_immutable
  BEFORE UPDATE OR DELETE ON craft_governance_audit
  FOR EACH ROW EXECUTE FUNCTION craft_governance_audit_block_mutation();

CREATE INDEX idx_craft_governance_audit_org ON craft_governance_audit(org_id, created_at DESC);

-- ============================================================================
-- 4. sage_executions guardrail annotations
--    Record the (currently inert) autonomous-gate decision at intake so it is
--    auditable and reproducible once autonomy is enabled.
-- ============================================================================

ALTER TABLE sage_executions
  ADD COLUMN IF NOT EXISTS trust_ceiling text
    CHECK (trust_ceiling IS NULL OR trust_ceiling IN ('manual', 'copilot', 'autopilot')),
  ADD COLUMN IF NOT EXISTS kill_switch_engaged boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guardrail_decision jsonb;

COMMENT ON COLUMN sage_executions.trust_ceiling IS
  'Trust-ladder mode ceiling for the (org,pillar) at intake (CRAFT §2.2/§2.3). One of the four ceilings folded into the computed mode.';
COMMENT ON COLUMN sage_executions.kill_switch_engaged IS
  'Whether the org kill-switch was engaged at intake. If true, an autonomous execution would be blocked (autonomy is off this slice, so this only annotates).';
COMMENT ON COLUMN sage_executions.guardrail_decision IS
  'Snapshot of the guardrail evaluation at intake (caps/kill-switch/cost). Would gate an autonomous execution; annotation-only while autonomy is off.';
