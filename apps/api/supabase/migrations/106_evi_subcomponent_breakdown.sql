/**
 * Migration 106: EVI sub-component breakdown + data-coverage indicators
 * (Wave-2: EVI real math)
 *
 * The EVI snapshot producer now computes the canonical 14 sub-metric formula
 * (EARNED_VISIBILITY_INDEX.md §3 / EVI_MATHEMATICS.md §2) instead of the prior
 * top-line-only proxy. Because several canonical sub-metrics have no real data
 * source yet (SERP, snippets, backlink domain authority, E-E-A-T, topic growth,
 * ranking trajectory), each component now carries a data-COVERAGE indicator so
 * the score is honest about how much of the canonical formula is observable
 * (Model Integrity Charter Art IV — honesty over proxy).
 *
 * Additive + idempotent. Existing rows keep NULL coverage/band/component_breakdown.
 * STAGED ONLY — NOT applied to production (kroexsdyyqmlxfpbwajv). Reserve #106.
 */

-- Per-component data-coverage: (real sub-metric weight) / (total component weight) ∈ [0,1]
ALTER TABLE public.evi_snapshots
  ADD COLUMN IF NOT EXISTS visibility_coverage numeric(6,4),
  ADD COLUMN IF NOT EXISTS authority_coverage  numeric(6,4),
  ADD COLUMN IF NOT EXISTS momentum_coverage   numeric(6,4),
  ADD COLUMN IF NOT EXISTS overall_coverage    numeric(6,4);

-- Scoring band (at_risk | emerging | competitive | dominant) — EVI_MATHEMATICS §9.3.
ALTER TABLE public.evi_snapshots
  ADD COLUMN IF NOT EXISTS band text
    CHECK (band IS NULL OR band IN ('at_risk', 'emerging', 'competitive', 'dominant'));

-- Full canonical sub-metric breakdown: the 14 sub-metrics with value/status/
-- weight/source per component, plus per-component score + coverage. This is the
-- auditable record of exactly which legs were REAL vs insufficient_data.
ALTER TABLE public.evi_snapshots
  ADD COLUMN IF NOT EXISTS component_breakdown jsonb;

COMMENT ON COLUMN public.evi_snapshots.component_breakdown IS
  'Canonical 14 sub-metric breakdown: {visibility,authority,momentum} each with '
  'score, weight, coverage, and sub_metrics[] {key,value,status,weight,source}.';
COMMENT ON COLUMN public.evi_snapshots.overall_coverage IS
  'Weighted fraction of the canonical EVI formula backed by real data (0..1).';
