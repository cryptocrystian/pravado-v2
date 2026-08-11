-- Migration 113: SEO Keyword Clusters (Wave-2 — SEO Topics surface)
--
-- The persisted output of SERP-OVERLAP keyword clustering. Two tracked keywords
-- belong to the same topic cluster when their top-N organic SERP result URLs
-- overlap above a threshold (see seoTopicClusterService.clusterByOverlap). The
-- clustering + every derived number is computed ONLY from data we already store:
--   - `seo_serp_results`   — the cached organic positions (populated by the #156
--                            competitor refresh; the ONLY paid DataForSEO path).
--   - `seo_keyword_metrics`/`seo_keywords` — real search volume.
--   - `seo_snapshots`      — our captured position over time (for trend).
--
-- HONEST DATA: clustering itself makes NO new API calls — it reads stored SERP
-- rows. A cluster is named after its highest-volume member keyword. `score`,
-- `avg_position`, `total_volume` and `trend` are ALL nullable: when the real
-- source for a given field does not exist (org does not rank, no volume data,
-- < 2 snapshots) the field is NULL rather than fabricated. An org with no cached
-- SERP data produces NO cluster rows (honest-empty).
--
-- WRITE MODEL (SECURITY): rows are written ONLY server-side by the topics compute
-- path via the Supabase SERVICE ROLE (which BYPASSES RLS). RLS stays ENABLED with
-- org-scoped SELECT for org members. Membership lives in the `member_keywords`
-- jsonb array (the keyword strings) — no separate members table needed.
--
-- Additive / idempotent: safe to re-run.

-- ============================================================================
-- seo_keyword_clusters — one row per computed topic cluster for an org
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.seo_keyword_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,

  -- Cluster display name = the highest-volume member keyword string.
  name text NOT NULL,

  -- The keyword STRINGS that make up this cluster (SERP-overlap connected
  -- component). Membership kept inline as jsonb — simpler than a join table.
  member_keywords jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Derived visibility score (0-100) from the cluster's average OWNED SERP
  -- position. NULL when the org does not rank for any member keyword (no owned
  -- position to score) — never fabricated.
  score numeric,

  -- Mean of the org's own best organic rank across ranking member keywords.
  -- NULL when the org does not rank for any member keyword.
  avg_position numeric,

  -- Sum of member keywords' real search volume. NULL when no volume data exists.
  total_volume integer,

  -- 'up' | 'down' | 'stable', derived from seo_snapshots.position deltas over
  -- captured_at. NULL when < 2 snapshots exist for the cluster's members
  -- (honest — a single capture cannot establish a trend).
  trend text CHECK (trend IN ('up', 'down', 'stable')),

  -- When this cluster was last computed.
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Read path: GET /api/v1/seo/topics lists an org's clusters.
CREATE INDEX IF NOT EXISTS idx_seo_keyword_clusters_org
  ON public.seo_keyword_clusters (org_id, computed_at DESC);

ALTER TABLE public.seo_keyword_clusters ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's clusters (mirrors migration 112 SELECT shape).
DROP POLICY IF EXISTS "org members can read seo keyword clusters"
  ON public.seo_keyword_clusters;
CREATE POLICY "org members can read seo keyword clusters"
  ON public.seo_keyword_clusters
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- Writes are service-role only (the topics compute path). The `TO service_role`
-- clause is LOAD-BEARING: WITHOUT it the FOR ALL ... WITH CHECK (true) policy
-- applies to ALL roles (incl. `authenticated`), letting any authenticated user
-- forge cluster rows (incl. fabricated scores) for any org via PostgREST. Scoping
-- to `service_role` means authenticated/anon roles retain ONLY the org-scoped
-- SELECT policy above — no write path, no forgery.
DROP POLICY IF EXISTS "service role can manage seo keyword clusters"
  ON public.seo_keyword_clusters;
CREATE POLICY "service role can manage seo keyword clusters"
  ON public.seo_keyword_clusters
  FOR ALL TO service_role USING (true) WITH CHECK (true);
