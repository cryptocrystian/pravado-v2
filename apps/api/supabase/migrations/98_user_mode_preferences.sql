-- Migration 98: user_mode_preferences — per-(user, org, pillar) automation mode
--
-- Context (PR-1 Keystone): automation mode is a PER-PILLAR policy per canon
-- (PRODUCT_CONSTITUTION, AUTOMATION_MODES_UX, MODE_UX_ARCHITECTURE §2A/§3), not a
-- single platform-wide toggle. Until now mode lived only client-side (localStorage
-- in ModeContext, in-memory in five per-pillar contexts) with no server
-- persistence and no plan-tier awareness. This table is the server source of
-- truth for a user's explicit per-pillar mode preference.
--
-- Resolution (in app code, not here): user preference row → plan-tier default
-- (D026: all tiers Copilot except Enterprise = Manual) → 'copilot' fallback.
-- A NULL/absent row means "unset → fall back", so we simply store no row.
--
-- Floor/ceiling governance (MODE_UX_ARCHITECTURE §2A) is computed from the plan
-- at read time; server-side ENFORCEMENT lands in PR-4. This migration only
-- persists the user's chosen mode.

CREATE TABLE IF NOT EXISTS public.user_mode_preferences (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     UUID        NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  pillar     TEXT        NOT NULL CHECK (pillar IN ('pr', 'content', 'seo')),
  mode       TEXT        NOT NULL CHECK (mode IN ('manual', 'copilot', 'autopilot')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id, pillar)
);

COMMENT ON TABLE public.user_mode_preferences IS
  'Per-(user, org, pillar) explicit automation-mode preference (PR-1). Absent row = unset → app falls back to plan-tier default (D026) then copilot.';

-- =====================================================
-- RLS: a user may read/write only their own preference rows.
-- The API uses the service-role client (bypasses RLS); these policies protect
-- any anon/authenticated client-side access.
-- =====================================================

ALTER TABLE public.user_mode_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_mode_preferences_self_select ON public.user_mode_preferences;
CREATE POLICY user_mode_preferences_self_select
  ON public.user_mode_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_mode_preferences_self_upsert ON public.user_mode_preferences;
CREATE POLICY user_mode_preferences_self_upsert
  ON public.user_mode_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_mode_preferences_self_update ON public.user_mode_preferences;
CREATE POLICY user_mode_preferences_self_update
  ON public.user_mode_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_mode_preferences_self_delete ON public.user_mode_preferences;
CREATE POLICY user_mode_preferences_self_delete
  ON public.user_mode_preferences FOR DELETE
  USING (auth.uid() = user_id);
