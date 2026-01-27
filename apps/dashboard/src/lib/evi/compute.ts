/**
 * EVI Operating System - Computation Module
 *
 * Deterministic computation of the Earned Visibility Index.
 * This is the SINGLE source of truth for EVI calculation.
 *
 * Formula: EVI = Visibility * 0.40 + Authority * 0.35 + Momentum * 0.25
 *
 * @see /docs/canon/EVI_SPEC.md
 */

import type { Trend } from '@/components/command-center/types';
import type { ComputedEVI, EVIInputSnapshot, EVIDriverSnapshot } from './types';
import { EVI_WEIGHTS, EVI_BANDS } from './types';

/**
 * Determine trend direction from delta
 */
function getTrend(delta: number): Trend {
  if (delta > 0.5) return 'up';
  if (delta < -0.5) return 'down';
  return 'flat';
}

/**
 * Determine EVI status band from score
 */
function getStatus(score: number): 'at_risk' | 'emerging' | 'competitive' | 'dominant' {
  if (score <= EVI_BANDS.at_risk.max) return 'at_risk';
  if (score <= EVI_BANDS.emerging.max) return 'emerging';
  if (score <= EVI_BANDS.competitive.max) return 'competitive';
  return 'dominant';
}

/**
 * Clamp a value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Round to specified decimal places
 */
function round(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Compute weighted driver contribution to EVI
 */
function computeDriverContribution(
  driver: EVIDriverSnapshot,
  weight: number
): { score: number; weighted: number; delta_7d: number; trend: Trend } {
  const score = clamp(driver.score, 0, 100);
  const weighted = round(score * weight, 2);
  const delta_7d = round(driver.delta_7d, 1);
  const trend = getTrend(driver.delta_7d);

  return { score, weighted, delta_7d, trend };
}

/**
 * Compute EVI from input snapshot
 *
 * This is the CANONICAL EVI computation function.
 * Any changes to this function require updating:
 * - docs/canon/EVI_SPEC.md
 * - CI guardrails
 *
 * @param snapshot - Input data from all providers
 * @returns Computed EVI result
 */
export function computeEVI(snapshot: EVIInputSnapshot): ComputedEVI {
  // Validate input
  if (!snapshot.visibility || !snapshot.authority || !snapshot.momentum) {
    throw new Error('Invalid snapshot: missing driver data');
  }

  // Compute driver contributions
  const visibility = computeDriverContribution(snapshot.visibility, EVI_WEIGHTS.visibility);
  const authority = computeDriverContribution(snapshot.authority, EVI_WEIGHTS.authority);
  const momentum = computeDriverContribution(snapshot.momentum, EVI_WEIGHTS.momentum);

  // Compute total EVI score
  const score = round(
    visibility.weighted + authority.weighted + momentum.weighted,
    1
  );

  // Compute deltas from historical data
  const historical = snapshot.historical_scores || [];
  let delta_7d = 0;
  let delta_30d = 0;
  let previous_score = score;

  if (historical.length >= 2) {
    // Previous score is the second-to-last point
    previous_score = historical[historical.length - 2]?.score ?? score;
    delta_7d = round(score - previous_score, 1);
  }

  if (historical.length >= 5) {
    // 30d delta approximation from available data
    const oldScore = historical[0]?.score ?? score;
    delta_30d = round(score - oldScore, 1);
  }

  // Generate sparkline from historical data
  const sparkline = historical.length >= 2
    ? historical.slice(-7).map(h => h.score)
    : [score];

  // Ensure sparkline has at least 7 points
  while (sparkline.length < 7) {
    sparkline.unshift(sparkline[0] ?? score);
  }

  // Compute overall confidence (weighted average of driver confidences)
  const confidence = round(
    snapshot.visibility.confidence * EVI_WEIGHTS.visibility +
    snapshot.authority.confidence * EVI_WEIGHTS.authority +
    snapshot.momentum.confidence * EVI_WEIGHTS.momentum,
    2
  );

  // Determine status and trend
  const status = getStatus(score);
  const trend = getTrend(delta_7d);

  return {
    score: clamp(score, 0, 100),
    previous_score: clamp(previous_score, 0, 100),
    delta_7d,
    delta_30d,
    status,
    trend,
    drivers: {
      visibility,
      authority,
      momentum,
    },
    sparkline,
    computed_at: new Date().toISOString(),
    confidence,
  };
}

/**
 * Validate EVI computation against canonical formula
 * Used by CI guardrails to ensure formula hasn't drifted
 */
export function validateEVIFormula(): {
  valid: boolean;
  formula: string;
  weights: typeof EVI_WEIGHTS;
  bands: typeof EVI_BANDS;
} {
  // Check weights sum to 1
  const weightSum = EVI_WEIGHTS.visibility + EVI_WEIGHTS.authority + EVI_WEIGHTS.momentum;
  const weightsValid = Math.abs(weightSum - 1.0) < 0.001;

  // Check bands are contiguous
  const bandsValid =
    EVI_BANDS.at_risk.max + 1 === EVI_BANDS.emerging.min &&
    EVI_BANDS.emerging.max + 1 === EVI_BANDS.competitive.min &&
    EVI_BANDS.competitive.max + 1 === EVI_BANDS.dominant.min;

  return {
    valid: weightsValid && bandsValid,
    formula: `EVI = Visibility * ${EVI_WEIGHTS.visibility} + Authority * ${EVI_WEIGHTS.authority} + Momentum * ${EVI_WEIGHTS.momentum}`,
    weights: EVI_WEIGHTS,
    bands: EVI_BANDS,
  };
}

/**
 * Compute EVI forecast with scenarios
 */
export function computeEVIForecast(
  currentEVI: ComputedEVI,
  activeScenarios: Array<{ delta_visibility?: number; delta_authority?: number; delta_momentum?: number }>
): { low: number; expected: number; high: number } {
  // Baseline forecast assumes current trajectory continues
  const baseExpected = currentEVI.score + (currentEVI.delta_7d * 4); // 4 weeks
  const baseVariance = 3; // +/- 3 points baseline variance

  // Apply scenario deltas
  let scenarioDelta = 0;
  for (const scenario of activeScenarios) {
    scenarioDelta += (scenario.delta_visibility ?? 0) * EVI_WEIGHTS.visibility;
    scenarioDelta += (scenario.delta_authority ?? 0) * EVI_WEIGHTS.authority;
    scenarioDelta += (scenario.delta_momentum ?? 0) * EVI_WEIGHTS.momentum;
  }

  const expected = clamp(baseExpected + scenarioDelta, 0, 100);

  return {
    low: clamp(expected - baseVariance - 1, 0, 100),
    expected: round(expected, 1),
    high: clamp(expected + baseVariance + 1, 0, 100),
  };
}
