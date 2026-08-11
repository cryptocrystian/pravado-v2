-- Migration 111: SAGE Daily Briefs (D039 — SAGE_DAILY_BRIEF.md)
--
-- Persists the org-level, daily, cross-pillar SAGE narrative surfaced at the top
-- of the Command Center (Situation Brief card) and mirrored on the mobile Today
-- tab. Canon: docs/canon/SAGE_DAILY_BRIEF.md.
--
-- The brief is a GROUNDED summary of real SAGE signals (§2 inputs: prioritized
-- sage_proposals, the action-stream top action, evi_snapshots delta, citation
-- movement). It NEVER fabricates. A row is written only when real signals exist
-- (§4.3 honest-empty: no row → the card renders the existing empty state).
--
-- HONESTY / TRACEABILITY (§4.5): `source_signal_ids` records exactly which
-- proposal ids, evi snapshot ids, and citation summary the brief summarized, so
-- every generated brief is auditable back to its real inputs. `provider_used`
-- records whether the LLM ('anthropic') or the deterministic grounded stub
-- ('stub') produced the prose — both consume only real signals.
--
-- WRITE MODEL (SECURITY): mirrors the sage_signals / sage_proposals substrate
-- (migration 81). Rows are written ONLY by the server-side generator via the
-- Supabase SERVICE ROLE (which BYPASSES RLS). RLS stays ENABLED with org-scoped
-- SELECT for org members only.
--
-- Additive / idempotent: safe to re-run.

-- ============================================================================
-- sage_daily_briefs — persisted daily cross-pillar narrative (one+ per org/day)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sage_daily_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- The 2–4 sentence grounded narrative (§3 Phase 1). Present only when real
  -- signals existed at generation time — honest-empty writes NO row.
  brief_text text NOT NULL,

  -- The single surfaced top action (§3). Nullable: a brief can summarize EVI /
  -- citation movement even when there is no actionable proposal to surface.
  top_action jsonb,

  -- Traceability (§4.5): the signal/proposal ids + evi snapshot id + citation
  -- summary this brief summarized. Never empty for a written brief.
  source_signal_ids jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Which producer rendered the prose (§4.2): the LLM or the deterministic
  -- grounded stub. 'none' reserved; a written brief is always 'anthropic'|'stub'.
  provider_used text NOT NULL DEFAULT 'stub'
    CHECK (provider_used IN ('anthropic', 'stub', 'none')),

  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sage_daily_briefs ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's briefs (mirrors sage_proposals SELECT policy).
DROP POLICY IF EXISTS "org members can read sage daily briefs" ON sage_daily_briefs;
CREATE POLICY "org members can read sage daily briefs" ON sage_daily_briefs
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Writes are service-role only (the nightly generator). No authenticated-user
-- write policy — a user must not be able to forge a brief for their org.
DROP POLICY IF EXISTS "service role can manage sage daily briefs" ON sage_daily_briefs;
CREATE POLICY "service role can manage sage daily briefs" ON sage_daily_briefs
  FOR ALL WITH CHECK (true);

-- Latest-brief-per-org lookup (served all day by the action-stream endpoint).
CREATE INDEX IF NOT EXISTS idx_sage_daily_briefs_org_generated
  ON sage_daily_briefs(org_id, generated_at DESC);
