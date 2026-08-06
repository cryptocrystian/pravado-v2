/**
 * Migration 104: AEO Ingestion Gate + Indexation Pings (Lane D / CiteMind Engine 1)
 *
 * Tables:
 * - aeo_gate_results: Per-asset Pre-Publish AEO ingestion-readiness gate results
 *   (SEO_AEO_PILLAR_CANON §3C/§3E). Score 0-100 + 4 canonical component scores.
 * - indexation_pings: Audit log of IndexNow / Google Indexing pings on publish
 *   (CITEMIND_SYSTEM §2.5).
 *
 * STAGED ONLY — not applied to production. Apply via the normal migration path.
 */

-- =====================================================
-- TABLE: aeo_gate_results
-- =====================================================

CREATE TABLE IF NOT EXISTS public.aeo_gate_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,

  aeo_score numeric(5,2) NOT NULL CHECK (aeo_score BETWEEN 0 AND 100),
  band text NOT NULL
    CHECK (band IN ('not_eligible', 'partially_eligible', 'citation_ready', 'citation_dominant')),
  passed boolean NOT NULL,
  blocked boolean NOT NULL,

  -- Canonical component scores (§3C), each 0-100
  entity_clarity_score numeric(5,2) NOT NULL,
  schema_coverage_score numeric(5,2) NOT NULL,
  semantic_depth_score numeric(5,2) NOT NULL,
  authority_signal_score numeric(5,2) NOT NULL,

  detected_schema_type text,
  gaps jsonb,
  explanation text,
  gate_version text NOT NULL DEFAULT '1.0',
  evaluated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aeo_gate_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read aeo gate results" ON public.aeo_gate_results
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "org members can insert aeo gate results" ON public.aeo_gate_results
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE INDEX idx_aeo_gate_content ON public.aeo_gate_results(content_item_id, evaluated_at DESC);
CREATE INDEX idx_aeo_gate_org ON public.aeo_gate_results(org_id, band);

-- =====================================================
-- TABLE: indexation_pings
-- =====================================================

CREATE TABLE IF NOT EXISTS public.indexation_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  content_item_id uuid REFERENCES public.content_items(id) ON DELETE CASCADE,
  url text NOT NULL,

  indexnow_submitted boolean NOT NULL DEFAULT false,
  indexnow_status integer,
  google_submitted boolean NOT NULL DEFAULT false,
  google_status integer,

  response jsonb,
  pinged_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.indexation_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read indexation pings" ON public.indexation_pings
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "org members can insert indexation pings" ON public.indexation_pings
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE INDEX idx_indexation_pings_content ON public.indexation_pings(content_item_id, pinged_at DESC);
CREATE INDEX idx_indexation_pings_org ON public.indexation_pings(org_id, pinged_at DESC);
