/**
 * Migration 105: Content pillar canon tables + status enum reconciliation (Lane H)
 *
 * Adds the three canon-required "new" Content entities that had no backend table,
 * so the Calendar, Derivatives, and Insights/Authority surfaces can be fed real
 * data instead of mocks:
 *   - content_calendar            (CONTENT_WORK_SURFACE_CONTRACT §4.4)
 *   - content_derivatives         (CONTENT_WORK_SURFACE_CONTRACT §4.3, §7.3)
 *   - content_authority_signals   (CONTENT_WORK_SURFACE_CONTRACT §4.5, §6.1)
 *
 * Also reconciles the content_items.status CHECK constraint to the canon
 * lifecycle (§4.1): draft | review | approved | published | archived. The prior
 * constraint (migration 26) only permitted draft|published|archived, which the
 * FE/API canon statuses `review` and `approved` would violate.
 *
 * Additive + idempotent. RLS mirrors content_items (org_members membership).
 * NOT applied to prod — staged file only.
 */

-- =====================================================
-- 1. Reconcile content_items.status to canon lifecycle
-- =====================================================
-- Canon §4.1: draft | review | approved | published | archived.
ALTER TABLE public.content_items
  DROP CONSTRAINT IF EXISTS content_items_status_check;

ALTER TABLE public.content_items
  ADD CONSTRAINT content_items_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived'));

-- =====================================================
-- 2. TABLE: content_derivatives  (§4.3)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_derivatives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  parent_asset_id uuid NOT NULL
    REFERENCES public.content_items(id) ON DELETE CASCADE,
  surface_type text NOT NULL
    CHECK (surface_type IN (
      'pr_pitch_excerpt',
      'aeo_snippet',
      'ai_summary',
      'social_fragment'
    )),
  content text NOT NULL DEFAULT '',
  -- §7.3 invalidation: derivatives go stale (valid=false) on parent edit.
  valid boolean NOT NULL DEFAULT true,
  generated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_derivatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read content_derivatives"
  ON public.content_derivatives FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org members insert content_derivatives"
  ON public.content_derivatives FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org members update content_derivatives"
  ON public.content_derivatives FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org members delete content_derivatives"
  ON public.content_derivatives FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_content_derivatives_parent
  ON public.content_derivatives(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_content_derivatives_org
  ON public.content_derivatives(org_id, valid);

-- =====================================================
-- 3. TABLE: content_calendar  (§4.4)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL
    REFERENCES public.content_items(id) ON DELETE CASCADE,
  scheduled_at timestamptz NOT NULL,
  campaign text,
  theme text,
  -- V1 Required: cross-pillar dependency indicators (array of {pillar,type,...}).
  cross_pillar_deps jsonb NOT NULL DEFAULT '[]',
  automation_mode text NOT NULL DEFAULT 'manual'
    CHECK (automation_mode IN ('manual', 'copilot', 'autopilot')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read content_calendar"
  ON public.content_calendar FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org members insert content_calendar"
  ON public.content_calendar FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org members update content_calendar"
  ON public.content_calendar FOR UPDATE
  USING (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org members delete content_calendar"
  ON public.content_calendar FOR DELETE
  USING (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_content_calendar_org_scheduled
  ON public.content_calendar(org_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_content_calendar_asset
  ON public.content_calendar(asset_id);

-- =====================================================
-- 4. TABLE: content_authority_signals  (§4.5 / §6.1)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.content_authority_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL
    REFERENCES public.content_items(id) ON DELETE CASCADE,
  authority_contribution_score numeric(5,2) NOT NULL DEFAULT 0
    CHECK (authority_contribution_score BETWEEN 0 AND 100),
  citation_eligibility_score numeric(5,2) NOT NULL DEFAULT 0
    CHECK (citation_eligibility_score BETWEEN 0 AND 100),
  ai_ingestion_likelihood numeric(5,2) NOT NULL DEFAULT 0
    CHECK (ai_ingestion_likelihood BETWEEN 0 AND 100),
  cross_pillar_impact numeric(5,2) NOT NULL DEFAULT 0
    CHECK (cross_pillar_impact BETWEEN 0 AND 100),
  competitive_authority_delta numeric(5,2) NOT NULL DEFAULT 0
    CHECK (competitive_authority_delta BETWEEN -100 AND 100),
  measured_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.content_authority_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read content_authority_signals"
  ON public.content_authority_signals FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "org members insert content_authority_signals"
  ON public.content_authority_signals FOR INSERT
  WITH CHECK (org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  ));

CREATE INDEX IF NOT EXISTS idx_authority_signals_asset_measured
  ON public.content_authority_signals(asset_id, measured_at DESC);
CREATE INDEX IF NOT EXISTS idx_authority_signals_org
  ON public.content_authority_signals(org_id);
