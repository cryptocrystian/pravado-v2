/**
 * EVI Calculation Service (Wave-2: EVI real math)
 *
 * Orchestrates the canonical North-Star EVI calculation:
 *   1. Aggregate REAL signals for the current + prior period (eviSignalAggregator)
 *   2. Compute the 14 canonical sub-metrics + 3 components (eviComponentMath)
 *   3. Persist an immutable snapshot with the full sub-component breakdown
 *      and per-component data-coverage indicators (migration 106)
 *
 * The elaborate top-line-only proxy (pitch volume / reply rate / naive %Δ) that
 * previously lived here has been REMOVED. All scoring now flows through the pure
 * canonical math in eviComponentMath.ts.
 *
 *   EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  computeEVI,
  type ComponentResult,
  type EVIComputation,
} from './eviComponentMath';
import { aggregatePeriodSignals } from './eviSignalAggregator';

// ============================================================================
// Types
// ============================================================================

export interface EVIBreakdown {
  evi_score: number;
  visibility_score: number;
  authority_score: number;
  momentum_score: number;
  /** Persisted audit trail (also written to evi_snapshots.signal_breakdown). */
  signal_breakdown: SignalBreakdown;
  calculated_at: string;
  period_days: number;
}

export interface SignalBreakdown {
  formula: string;
  band: EVIComputation['band'];
  overall_coverage: number;
  visibility: ComponentPersist;
  authority: ComponentPersist;
  momentum: ComponentPersist;
  metadata: {
    period_start: string;
    period_end: string;
    period_days: number;
    prior_period_start: string;
    prior_period_end: string;
  };
}

interface ComponentPersist {
  score: number;
  weight: number;
  coverage: number;
  sub_metrics: ComponentResult['sub_metrics'];
}

// ============================================================================
// Main calculator
// ============================================================================

export async function calculateEVI(
  supabase: SupabaseClient,
  orgId: string,
  periodDays: number = 30
): Promise<EVIBreakdown> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const currentStart = new Date(now - periodDays * dayMs).toISOString();
  const currentEnd = new Date(now).toISOString();
  const priorStart = new Date(now - 2 * periodDays * dayMs).toISOString();
  const priorEnd = currentStart;

  // Aggregate real signals for both windows (momentum needs prior).
  const [current, prior] = await Promise.all([
    aggregatePeriodSignals(supabase, orgId, currentStart, currentEnd),
    aggregatePeriodSignals(supabase, orgId, priorStart, priorEnd),
  ]);

  const evi = computeEVI(current, prior);
  const calculatedAt = new Date().toISOString();

  const signalBreakdown: SignalBreakdown = {
    formula:
      'EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)',
    band: evi.band,
    overall_coverage: evi.overall_coverage,
    visibility: {
      score: evi.visibility.score,
      weight: 0.4,
      coverage: evi.visibility.coverage,
      sub_metrics: evi.visibility.sub_metrics,
    },
    authority: {
      score: evi.authority.score,
      weight: 0.35,
      coverage: evi.authority.coverage,
      sub_metrics: evi.authority.sub_metrics,
    },
    momentum: {
      score: evi.momentum.score,
      weight: 0.25,
      coverage: evi.momentum.coverage,
      sub_metrics: evi.momentum.sub_metrics,
    },
    metadata: {
      period_start: currentStart,
      period_end: currentEnd,
      period_days: periodDays,
      prior_period_start: priorStart,
      prior_period_end: priorEnd,
    },
  };

  // Persist immutable snapshot (migration 106 adds the sub-component columns).
  const { error } = await supabase.from('evi_snapshots').insert({
    org_id: orgId,
    evi_score: evi.evi_score,
    visibility_score: evi.visibility.score,
    authority_score: evi.authority.score,
    momentum_score: evi.momentum.score,
    visibility_coverage: evi.visibility.coverage,
    authority_coverage: evi.authority.coverage,
    momentum_coverage: evi.momentum.coverage,
    overall_coverage: evi.overall_coverage,
    band: evi.band,
    component_breakdown: signalBreakdown,
    signal_breakdown: signalBreakdown,
    calculated_at: calculatedAt,
    period_days: periodDays,
  });

  if (error) {
    console.error('[EVI] Failed to save snapshot:', error.message);
    // Non-fatal: still return the computed score for the caller.
  }

  return {
    evi_score: evi.evi_score,
    visibility_score: evi.visibility.score,
    authority_score: evi.authority.score,
    momentum_score: evi.momentum.score,
    signal_breakdown: signalBreakdown,
    calculated_at: calculatedAt,
    period_days: periodDays,
  };
}
