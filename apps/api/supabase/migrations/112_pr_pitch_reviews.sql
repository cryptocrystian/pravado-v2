-- Migration 112: PR Pitch Reviews (Wave-2 — outreach human-review/approval gate)
--
-- The persisted state behind the FAIL-CLOSED human-in-the-loop gate that a
-- `pr.send_pitch` MUST pass before any REAL external email egress. Outreach is
-- IRREVERSIBLE (CRAFT §4.2/§5.4 "Email/Outreach → Irreversible → Manual") and
-- CAN-SPAM safety-critical — a sent pitch cannot be un-sent — so a pitch must
-- never reach the provider without a human having reviewed the ACTUAL composed
-- subject/body.
--
-- This gate is LAYERED ON TOP OF the `sendGuardedEmail` chokepoint; it never
-- bypasses it. Approval only decides whether the pitch may ENTER the chokepoint;
-- every existing governor (suppression, pitch-eligibility, tier caps, follow-up
-- cap, personalization) still runs before the raw provider send.
--
-- HASH BINDING (the safety property): `composed_hash` is the sha256 of the exact
-- subject+body a human reviewed. An approval is bound to THAT text. If the pitch
-- is re-composed (LLM redraft), the new subject/body produce a NEW `composed_hash`
-- and — via the unique index below — a NEW `pending` row. The stale approval no
-- longer matches, so the DB-backed gate blocks the re-composed pitch. Approval
-- can NEVER leak onto text a human did not see.
--
-- WRITE MODEL (SECURITY): mirrors migration 111 (sage_daily_briefs) and the
-- sage_signals / sage_proposals substrate. Rows are written ONLY by the
-- server-side executor + approve/reject routes via the Supabase SERVICE ROLE
-- (which BYPASSES RLS). RLS stays ENABLED with org-scoped SELECT for org members.
--
-- Additive / idempotent: safe to re-run.

-- ============================================================================
-- pr_pitch_reviews — the pending/approved/rejected review queue for real sends
-- ============================================================================

CREATE TABLE IF NOT EXISTS pr_pitch_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- The SAGE proposal / execution id this pitch originated from. Text (not uuid):
  -- proposal/execution ids in the CRAFT lifecycle are not always uuid-shaped.
  proposal_id text NOT NULL,

  -- Recipient linkage. Both nullable: a pitch may resolve via the contact
  -- firewall (recipient_contact_id) OR the legacy journalists table
  -- (journalist_id). At least one is present for a real send.
  recipient_contact_id uuid,
  journalist_id uuid,

  -- The EXACT composed pitch a human reviews/approves.
  composed_subject text NOT NULL,
  composed_body text NOT NULL,
  -- sha256(subject + body). NOT NULL. The approval is bound to this exact text;
  -- re-composition changes this hash → a new pending row → stale approval voided.
  composed_hash text NOT NULL,

  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Who reviewed + when (owner/admin only; enforced in the approve/reject route).
  reviewed_by uuid,
  reviewed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Re-composing the SAME proposal→recipient with DIFFERENT text (new hash) creates
-- a NEW pending row (the old approval, bound to the old hash, does not apply).
-- Re-hitting the gate with the SAME text is idempotent (UPSERT ON CONFLICT DO
-- NOTHING onto this key). Bare-column index so PostgREST/Supabase `onConflict` can
-- infer the arbiter. (For journalist-only pitches recipient_contact_id is NULL and
-- Postgres treats NULLs as distinct, so re-hits may insert a duplicate PENDING row —
-- harmless: all such rows are pending, none approved, and the hash-bound safety
-- property below is unaffected.)
CREATE UNIQUE INDEX IF NOT EXISTS uq_pr_pitch_reviews_proposal_recipient_hash
  ON pr_pitch_reviews (org_id, proposal_id, recipient_contact_id, composed_hash);

-- Pending-queue lookup (served by GET /api/v1/pr/reviews).
CREATE INDEX IF NOT EXISTS idx_pr_pitch_reviews_org_status_created
  ON pr_pitch_reviews (org_id, status, created_at DESC);

ALTER TABLE pr_pitch_reviews ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's reviews (mirrors sage_daily_briefs SELECT).
DROP POLICY IF EXISTS "org members can read pr pitch reviews" ON pr_pitch_reviews;
CREATE POLICY "org members can read pr pitch reviews" ON pr_pitch_reviews
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Writes are service-role only (the executor queue-population + approve/reject
-- routes). The `TO service_role` clause is LOAD-BEARING: WITHOUT it the policy
-- applies to ALL roles (incl. `authenticated`), and with WITH CHECK (true) any
-- authenticated user could forge/approve a review for any org via PostgREST —
-- a forgery hole that would defeat the entire human-review gate. Scoping to
-- `service_role` means authenticated/anon roles retain ONLY the org-scoped
-- SELECT policy above — no write path, no forgery.
DROP POLICY IF EXISTS "service role can manage pr pitch reviews" ON pr_pitch_reviews;
CREATE POLICY "service role can manage pr pitch reviews" ON pr_pitch_reviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);
