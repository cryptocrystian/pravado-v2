/**
 * Migration 82: CiteMind Quality Scoring & Schema Tables (Sprint S-INT-04)
 *
 * Tables:
 * - citemind_scores: Quality scores per content item (6-factor breakdown)
 * - citemind_schemas: JSON-LD structured data generated for content items
 */

-- =====================================================
-- TABLE: citemind_scores
-- =====================================================

CREATE TABLE IF NOT EXISTS public.citemind_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  overall_score numeric(5,2) NOT NULL CHECK (overall_score BETWEEN 0 AND 100),

  -- Factor scores (each 0-100)
  entity_density_score numeric(5,2),
  claim_verifiability_score numeric(5,2),
  structural_clarity_score numeric(5,2),
  topical_authority_score numeric(5,2),
  schema_markup_score numeric(5,2),
  citation_pattern_score numeric(5,2),

  -- Metadata
  factor_breakdown jsonb NOT NULL,
  gate_status text NOT NULL DEFAULT 'pending'
    CHECK (gate_status IN ('pending', 'analyzing', 'passed', 'blocked', 'warning')),
  gate_threshold numeric(5,2) NOT NULL DEFAULT 65.0,
  recommendations jsonb,
  word_count integer,
  scored_at timestamptz NOT NULL DEFAULT now(),
  scorer_version text NOT NULL DEFAULT '1.0'
);

ALTER TABLE public.citemind_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read citemind scores" ON public.citemind_scores
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "org members can insert citemind scores" ON public.citemind_scores
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE UNIQUE INDEX idx_citemind_latest ON public.citemind_scores(content_item_id, scored_at DESC);
CREATE INDEX idx_citemind_org ON public.citemind_scores(org_id, gate_status);

-- =====================================================
-- TABLE: citemind_schemas
-- =====================================================

CREATE TABLE IF NOT EXISTS public.citemind_schemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
  schema_type text NOT NULL,  -- Article | HowTo | FAQPage | BlogPosting
  schema_json jsonb NOT NULL,
  injected_at timestamptz,
  generated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.citemind_schemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read schemas" ON public.citemind_schemas
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE POLICY "org members can insert schemas" ON public.citemind_schemas
  FOR INSERT WITH CHECK (
    org_id IN (SELECT org_id FROM public.org_members WHERE user_id = auth.uid())
  );

CREATE INDEX idx_citemind_schemas_content ON public.citemind_schemas(content_item_id);
CREATE INDEX idx_citemind_schemas_org ON public.citemind_schemas(org_id);
