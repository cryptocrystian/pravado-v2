-- Migration 114: SAGE RLS hardening — restrict write policies to service_role
--
-- Fixes a pre-existing forgery hole from migration 81: the `sage_signals` and
-- `sage_proposals` write policies were created WITHOUT a `TO service_role`
-- clause, so `FOR ALL / FOR INSERT ... WITH CHECK (true)` applied to ALL roles
-- (including `authenticated`). Any authenticated user could INSERT/UPDATE forged
-- SAGE signals/proposals for any org via PostgREST — corrupting the intelligence
-- substrate that drives EVI and every proposal.
--
-- The `TO service_role` clause is LOAD-BEARING. Service role BYPASSES RLS, so the
-- server-side SAGE writers (signal ingestor, proposal generator) are unaffected;
-- authenticated/anon roles retain ONLY the org-scoped SELECT policies (unchanged).
-- Same hardening applied to the newer sage_daily_briefs / pr_pitch_reviews /
-- seo_keyword_clusters tables (migrations 111/112/113).
--
-- Additive / idempotent (DROP POLICY IF EXISTS before CREATE). Already applied to
-- prod 2026-08-10; this file records it for repo/prod parity.

DROP POLICY IF EXISTS "service role can manage sage proposals" ON public.sage_proposals;
CREATE POLICY "service role can manage sage proposals" ON public.sage_proposals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service role can insert sage signals" ON public.sage_signals;
CREATE POLICY "service role can insert sage signals" ON public.sage_signals
  FOR INSERT TO service_role WITH CHECK (true);
