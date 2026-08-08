-- Migration 109: SAGE cross-pillar reinforcement (Wave-2 — SAGE mesh)
--
-- Turns the linear scorer into a feedback MESH. When an action completes in one
-- pillar, its OUTPUT becomes an INPUT to the other pillars: it reinforces their
-- signals by a canon coefficient. Canon SAGE_OPERATING_MODEL §3 (Cross-Pillar
-- Reinforcement Matrix), §3.1 (L169): "Every action in one pillar reinforces outcomes
-- in other pillars. This is not metaphorical—it is causal and measurable."
--
-- The coefficients are canon-verbatim from §3.3 "Reinforcement Coefficients"
-- (L190-195): PR→Content 0.50, PR→SEO 0.35, Content→PR 0.45, Content→SEO 0.70,
-- SEO→PR 0.25, SEO→Content 0.35. Persisted here (not hardcoded into a snapshot) so
-- each reinforcement is org-scoped, additive, and auditable back to its source
-- outcome. The scorer sums a signal's recipient-pillar reinforcements and adds them
-- to the (decayed) signal strength.
--
-- WRITE MODEL (SECURITY): mirrors migrations 107's service-role-only substrate. Rows
-- are written ONLY by the server-side execution engine via the Supabase SERVICE ROLE
-- (which BYPASSES RLS). No authenticated-user write policy is granted — that would let
-- a user forge cross-org reinforcement and inflate their own scoring. RLS stays
-- ENABLED with org-scoped SELECT only.
--
-- SCOPE NOTE (this slice): base §3.3 coefficients only. The CiteMind-enhanced
-- coefficients (§8.7), reinforcement decay/latency modelling, causal tracing and the
-- authority multiplier are LATER slices.

-- ============================================================================
-- sage_signal_reinforcements — cross-pillar reinforcement ledger (additive)
-- ============================================================================

CREATE TABLE sage_signal_reinforcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Provenance: the completed action (outcome) this reinforcement flowed from.
  source_outcome_id uuid REFERENCES sage_outcomes(id) ON DELETE CASCADE,
  source_pillar text NOT NULL CHECK (source_pillar IN ('PR', 'Content', 'SEO')),
  source_signal_type text NOT NULL,

  -- The pillar whose signals this row reinforces.
  recipient_pillar text NOT NULL CHECK (recipient_pillar IN ('PR', 'Content', 'SEO')),

  -- Canon §3.3 coefficient used (0.25–0.70). Persisted for audit/reproducibility.
  coefficient numeric(4,3) NOT NULL CHECK (coefficient >= 0 AND coefficient <= 1),

  -- Additive strength boost applied to recipient-pillar signals =
  -- coefficient × source action impact (EVI points).
  strength_delta numeric(10,4) NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE sage_signal_reinforcements IS
  'Cross-pillar reinforcement ledger. Canon SAGE_OPERATING_MODEL §3.3 coefficients. '
  'Additive, org-scoped; summed by the opportunity scorer per recipient_pillar. '
  'Service-role write only (RLS bypass); authenticated users read own org only.';

ALTER TABLE sage_signal_reinforcements ENABLE ROW LEVEL SECURITY;

-- Read: org members. Write: NONE for authenticated users — the execution engine
-- writes via the service role (RLS bypass). No `WITH CHECK (true)` INSERT policy:
-- that would let any authenticated user forge cross-org reinforcement.
CREATE POLICY "org members can read signal reinforcements" ON sage_signal_reinforcements
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
  );

-- Scorer hot path: sum strength_delta per (org, recipient_pillar).
CREATE INDEX idx_sage_reinf_org_recipient
  ON sage_signal_reinforcements(org_id, recipient_pillar, created_at DESC);
CREATE INDEX idx_sage_reinf_source_outcome
  ON sage_signal_reinforcements(source_outcome_id);
