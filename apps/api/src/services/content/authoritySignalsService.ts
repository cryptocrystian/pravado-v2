/**
 * Authority Signals Scorer (W2 — Content Insights)
 *
 * Implements the five content-level Authority Signals EXACTLY as ratified in
 * docs/canon/AUTHORITY_SIGNALS_MODEL.md (D038). Every formula is traced to its
 * canon anchor below and must match the canon doc line-for-line. No metric is
 * estimated or faked.
 *
 * HONESTY CONTRACT
 * ----------------
 * - Four signals are computed from real CiteMind scorer output
 *   (`citemind_scores`): citation_eligibility, ai_ingestion_likelihood,
 *   authority_contribution, cross_pillar_impact.
 * - competitive_authority_delta is DATA-GATED on DataForSEO (not provisioned):
 *   it is NEVER computed — always null. The read surface renders it as
 *   "Not available yet", never 0, never a fabricated number.
 *
 * CANON FORMULAS (AUTHORITY_SIGNALS_MODEL.md §2)
 *   §2.1 citation_eligibility     = citemind_scores.overall_score
 *   §2.2 ai_ingestion_likelihood  = mean(schema_markup_score,
 *                                        structural_clarity_score,
 *                                        entity_density_score)
 *   §2.3 authority_contribution   = overall_score × gate_factor
 *          gate_factor = 1.0 (passed) / 0.5 (warning) / 0.0 (blocked)
 *                        0.0 (pending | analyzing — not yet scored)
 *   §2.4 cross_pillar_impact_EVI  = (authority_contribution / 100) × 0.35
 *                                        × (1 + 0.45 + 0.70)
 *   §2.5 competitive_authority_delta = null (data-gated, DataForSEO)
 *
 * GATE-STATUS SOURCE
 * ------------------
 * gate_factor keys directly on the real `citemind_scores.gate_status` enum
 * {pending, analyzing, passed, warning, blocked} (migration 82 CHECK; the
 * scorer emits passed/warning/blocked — passed = overall ≥ 75, warning = ≥ 55,
 * blocked < 55). Not-yet-scored states (pending, analyzing) and any unrecognized
 * value contribute 0.0 (anti-gaming conservative, EVI_MATHEMATICS §8.3).
 * (Canon §2.3 was corrected from the drafting placeholder {approved, review,
 * blocked} to this real enum during implementation — see D038 Correction.)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { createLogger } from '../../lib/logger';

const logger = createLogger('content:authority-signals');

// ============================================================================
// Canon coefficients — VERBATIM. Do NOT alter (AUTHORITY_SIGNALS_MODEL.md §2.4)
// ============================================================================

/** EVI_MATHEMATICS §7.5 — EVI_points = authority_lift × 0.35. */
const EVI_AUTHORITY_WEIGHT = 0.35;
/** SAGE_OPERATING_MODEL §3.3 reinforcement matrix — Content → PR. */
const CONTENT_TO_PR_REINFORCEMENT = 0.45;
/** SAGE_OPERATING_MODEL §3.3 reinforcement matrix — Content → SEO. */
const CONTENT_TO_SEO_REINFORCEMENT = 0.7;

// ============================================================================
// Types
// ============================================================================

/**
 * The subset of a `citemind_scores` row the scorer needs. Matches the shape of
 * CiteMindScoreResult (citeMindQualityScorer.ts) so a fresh score result can be
 * passed straight through.
 */
export interface CiteMindScoreRow {
  overall_score: number | null;
  schema_markup_score: number | null;
  structural_clarity_score: number | null;
  entity_density_score: number | null;
  gate_status: string | null;
}

/** Output of the pure scorer. Ranges per AUTHORITY_SIGNALS_MODEL.md §1. */
export interface AuthoritySignals {
  /** §2.1 — 0–100, = overall_score. */
  citation_eligibility: number | null;
  /** §2.2 — 0–100, equal-weight mean of 3 ingestion factors. */
  ai_ingestion_likelihood: number | null;
  /** §2.3 — 0–100, overall_score × gate_factor. */
  authority_contribution: number | null;
  /** §2.4 — EVI points (NOT 0–100). */
  cross_pillar_impact: number | null;
  /** §2.5 — DATA-GATED (DataForSEO). Always null; never estimated. */
  competitive_authority_delta: null;
}

// ============================================================================
// gate_factor (AUTHORITY_SIGNALS_MODEL.md §2.3)
// ============================================================================

/**
 * gate_factor = 1.0 (passed) / 0.5 (warning) / 0.0 (blocked), keyed on the real
 * citemind_scores.gate_status enum. pending/analyzing/unknown → 0.0.
 */
function gateFactor(gateStatus: string | null): number {
  switch (gateStatus) {
    case 'passed':
      return 1.0;
    case 'warning':
      return 0.5;
    case 'blocked':
      return 0.0;
    default:
      // pending / analyzing / unknown — anti-gaming conservative.
      return 0.0;
  }
}

/** Equal-weight mean of the provided values, ignoring nulls; null if empty. */
function meanOf(values: Array<number | null>): number | null {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (nums.length === 0) return null;
  return nums.reduce((sum, v) => sum + v, 0) / nums.length;
}

// ============================================================================
// PURE scorer — the single source of the canon math
// ============================================================================

/**
 * Compute the five Authority Signals from a CiteMind score row, EXACTLY per
 * AUTHORITY_SIGNALS_MODEL.md §2. Pure and unit-testable — no I/O, no rounding
 * (persistence layer clamps/rounds to the column ranges).
 */
export function computeAuthoritySignals(
  row: CiteMindScoreRow
): AuthoritySignals {
  // §2.1 Citation Eligibility = citemind_scores.overall_score
  const citation_eligibility = row.overall_score;

  // §2.2 AI Ingestion Likelihood
  //   = mean(schema_markup_score, structural_clarity_score, entity_density_score)
  const ai_ingestion_likelihood = meanOf([
    row.schema_markup_score,
    row.structural_clarity_score,
    row.entity_density_score,
  ]);

  // §2.3 Authority Contribution = overall_score × gate_factor
  const gate_factor = gateFactor(row.gate_status);
  const authority_contribution =
    row.overall_score == null ? null : row.overall_score * gate_factor;

  // §2.4 Cross-Pillar Impact (EVI points)
  //   = (authority_contribution / 100) × 0.35 × (1 + 0.45 + 0.70)
  const cross_pillar_impact =
    authority_contribution == null
      ? null
      : (authority_contribution / 100) *
        EVI_AUTHORITY_WEIGHT *
        (1 + CONTENT_TO_PR_REINFORCEMENT + CONTENT_TO_SEO_REINFORCEMENT);

  // §2.5 Competitive Authority Delta — DATA-GATED (DataForSEO). Never computed.
  const competitive_authority_delta = null;

  return {
    citation_eligibility,
    ai_ingestion_likelihood,
    authority_contribution,
    cross_pillar_impact,
    competitive_authority_delta,
  };
}

// ============================================================================
// Persistence → content_authority_signals (org-scoped, migration 105)
// ============================================================================

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Coerce a signal to the numeric(5,2) column contract (2 dp). Null → 0 only as
 * an unavoidable schema artifact: the columns are NOT NULL DEFAULT 0 in
 * migration 105 (which this Work Order must not alter). This affects storage
 * only; the read surface re-derives honest nulls for data-gated signals.
 */
function toColumn(value: number | null, min: number, max: number): number {
  if (value == null || Number.isNaN(value)) return 0;
  return clamp(round2(value), min, max);
}

export interface PersistAuthoritySignalsArgs {
  orgId: string;
  assetId: string;
  score: CiteMindScoreRow;
}

/**
 * Compute the Authority Signals for one asset and persist a fresh row to
 * content_authority_signals (org-scoped). Returns the persisted signals.
 *
 * competitive_authority_delta is NOT written a computed value — the column is
 * NOT NULL DEFAULT 0 (migration 105), so it takes the schema default 0 in
 * storage; it is data-gated and the read endpoint always surfaces null for it.
 */
export async function computeAndPersistAuthoritySignals(
  supabase: SupabaseClient,
  args: PersistAuthoritySignalsArgs
): Promise<AuthoritySignals> {
  const { orgId, assetId, score } = args;
  const signals = computeAuthoritySignals(score);

  const { error } = await supabase.from('content_authority_signals').insert({
    org_id: orgId,
    asset_id: assetId,
    authority_contribution_score: toColumn(
      signals.authority_contribution,
      0,
      100
    ),
    citation_eligibility_score: toColumn(signals.citation_eligibility, 0, 100),
    ai_ingestion_likelihood: toColumn(signals.ai_ingestion_likelihood, 0, 100),
    // EVI points (not 0–100); stored within the numeric(5,2) 0–100 CHECK range.
    cross_pillar_impact: toColumn(signals.cross_pillar_impact, 0, 100),
    // competitive_authority_delta omitted → schema default 0 (data-gated; the
    // read endpoint returns null so the UI shows "Not available yet").
    measured_at: new Date().toISOString(),
  });

  if (error) {
    throw new Error(`Failed to persist authority signals: ${error.message}`);
  }

  return signals;
}

/**
 * Fire-and-forget follow-on invoked after CiteMind scoring persists a score.
 * Fully isolated: it NEVER throws into the scoring path — failures are logged
 * and swallowed so authority-signal computation can never break scoring.
 */
export async function computeAndPersistAuthoritySignalsSafe(
  supabase: SupabaseClient,
  args: PersistAuthoritySignalsArgs
): Promise<void> {
  try {
    const signals = await computeAndPersistAuthoritySignals(supabase, args);
    logger.info(
      `Authority signals persisted for asset ${args.assetId}: ` +
        `citation=${signals.citation_eligibility}, ` +
        `authority=${signals.authority_contribution}, ` +
        `crossPillar=${signals.cross_pillar_impact}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(
      `Authority signals compute/persist failed for asset ${args.assetId} ` +
        `(isolated — scoring unaffected): ${message}`
    );
  }
}
