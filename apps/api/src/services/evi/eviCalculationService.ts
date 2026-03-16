/**
 * EVI Calculation Service (Sprint S-INT-01)
 *
 * Core formula executor:
 *   EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)
 *
 * Each sub-score is normalized to 0–100.
 * Returns full signal_breakdown object for audit trail.
 * Saves snapshot to evi_snapshots table.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import {
  aggregateSignals,
  type AggregatedSignals,
  type VisibilitySignals,
  type AuthoritySignals,
} from './eviSignalAggregator';

// ============================================================================
// Types
// ============================================================================

export interface EVIBreakdown {
  evi_score: number;
  visibility_score: number;
  authority_score: number;
  momentum_score: number;
  signal_breakdown: SignalBreakdown;
  calculated_at: string;
  period_days: number;
}

export interface SignalBreakdown {
  visibility: {
    raw: VisibilitySignals;
    normalized_score: number;
    weight: 0.40;
    components: {
      pitch_activity_score: number;
      engagement_rate_score: number;
      journalist_quality_score: number;
      citation_rate_score: number;
    };
  };
  authority: {
    raw: AuthoritySignals;
    normalized_score: number;
    weight: 0.35;
    components: {
      content_quality_score: number;
      backlink_authority_score: number;
    };
  };
  momentum: {
    normalized_score: number;
    weight: 0.25;
    components: {
      visibility_delta_pct: number;
      authority_delta_pct: number;
    };
    prior_period: {
      visibility_score: number;
      authority_score: number;
    };
  };
  metadata: {
    period_start: string;
    period_end: string;
    period_days: number;
    formula: string;
  };
}

// ============================================================================
// Sub-score Calculators
// ============================================================================

/** Clamp a value between 0 and 100 */
function clamp(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)) * 100) / 100;
}

/**
 * Calculate Visibility sub-score (0–100)
 *
 * Components:
 * - Pitch activity (30%): based on volume of pitches sent (0 pitches = 0, 20+ = 100)
 * - Engagement rate (25%): reply rate on pitches (0% = 0, 30%+ = 100)
 * - Journalist quality (20%): avg DA of journalist contacts (0 DA = 0, 90+ = 100)
 * - Citation rate (25%): AI engine mention rate (0% = 0, 20%+ = 100) [S-INT-05]
 */
function calculateVisibilityScore(signals: VisibilitySignals): {
  score: number;
  components: { pitch_activity_score: number; engagement_rate_score: number; journalist_quality_score: number; citation_rate_score: number };
} {
  // Pitch activity: linear scale, 0–20 pitches maps to 0–100
  const pitchActivityScore = clamp((signals.pitchesSent / 20) * 100);

  // Engagement rate: reply rate, 30%+ = 100
  const engagementRate = signals.pitchesSent > 0
    ? signals.pitchesReplied / signals.pitchesSent
    : 0;
  const engagementRateScore = clamp((engagementRate / 0.30) * 100);

  // Journalist quality: avg DA, 90+ = 100
  const journalistQualityScore = clamp((signals.avgJournalistDA / 90) * 100);

  // S-INT-05: Citation rate: mention_rate 20%+ = 100
  const citationRateScore = clamp((signals.citationMentionRate / 0.20) * 100);

  const score = clamp(
    pitchActivityScore * 0.30 +
    engagementRateScore * 0.25 +
    journalistQualityScore * 0.20 +
    citationRateScore * 0.25
  );

  return {
    score,
    components: {
      pitch_activity_score: pitchActivityScore,
      engagement_rate_score: engagementRateScore,
      journalist_quality_score: journalistQualityScore,
      citation_rate_score: citationRateScore,
    },
  };
}

/**
 * Calculate Authority sub-score (0–100)
 *
 * Components:
 * - Content quality (60%): avg quality score (already 0–100 from content_quality_scores)
 * - Backlink authority (40%): ratio of high-DA backlinks (DA>40) to total, scaled
 */
function calculateAuthorityScore(signals: AuthoritySignals): {
  score: number;
  components: { content_quality_score: number; backlink_authority_score: number };
} {
  // Content quality: direct from content_quality_scores.overall_score (already 0–100)
  const contentQualityScore = clamp(signals.avgContentQuality);

  // Backlink authority: high-DA ratio * count factor
  // 10+ high-DA backlinks = 100; ratio also matters
  const backlinkCountFactor = clamp((signals.highDABacklinks / 10) * 100);
  const backlinkRatio = signals.totalBacklinks > 0
    ? signals.highDABacklinks / signals.totalBacklinks
    : 0;
  const backlinkRatioFactor = clamp(backlinkRatio * 100);
  const backlinkAuthorityScore = clamp(backlinkCountFactor * 0.6 + backlinkRatioFactor * 0.4);

  const score = clamp(
    contentQualityScore * 0.60 +
    backlinkAuthorityScore * 0.40
  );

  return {
    score,
    components: {
      content_quality_score: contentQualityScore,
      backlink_authority_score: backlinkAuthorityScore,
    },
  };
}

/**
 * Calculate Momentum sub-score (0–100)
 *
 * Compares current period visibility/authority to prior period (same length).
 * A positive delta maps to higher momentum; flat/negative maps to lower.
 * 50 = flat. +20% change = 70. -20% change = 30.
 */
function calculateMomentumScore(
  currentVisibility: number,
  currentAuthority: number,
  priorVisibility: number,
  priorAuthority: number
): {
  score: number;
  components: { visibility_delta_pct: number; authority_delta_pct: number };
} {
  const visDelta = priorVisibility > 0
    ? ((currentVisibility - priorVisibility) / priorVisibility) * 100
    : (currentVisibility > 0 ? 100 : 0);

  const authDelta = priorAuthority > 0
    ? ((currentAuthority - priorAuthority) / priorAuthority) * 100
    : (currentAuthority > 0 ? 100 : 0);

  // Weighted delta: visibility change weighted 60%, authority change 40%
  const weightedDelta = visDelta * 0.60 + authDelta * 0.40;

  // Map delta to 0–100 score: -50% → 0, 0% → 50, +50% → 100
  const score = clamp(50 + weightedDelta);

  return {
    score,
    components: {
      visibility_delta_pct: Math.round(visDelta * 100) / 100,
      authority_delta_pct: Math.round(authDelta * 100) / 100,
    },
  };
}

// ============================================================================
// Main Calculator
// ============================================================================

/**
 * Calculate the full EVI score for an org.
 * Aggregates signals from both current and prior periods to compute momentum.
 * Saves snapshot to DB and returns the full breakdown.
 */
export async function calculateEVI(
  supabase: SupabaseClient,
  orgId: string,
  periodDays: number = 30
): Promise<EVIBreakdown> {
  // Aggregate signals for current period
  const currentSignals = await aggregateSignals(supabase, orgId, periodDays);

  // For the prior period, we need to shift the window back
  // Re-aggregate with shifted dates
  const priorPeriodEnd = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
  const priorPeriodStart = new Date(Date.now() - 2 * periodDays * 24 * 60 * 60 * 1000).toISOString();

  // We already have currentSignals; now get actual prior period
  const priorSignalsActual = await aggregateSignalsForPeriod(
    supabase, orgId, priorPeriodStart, priorPeriodEnd
  );

  // Calculate sub-scores
  const visResult = calculateVisibilityScore(currentSignals.visibility);
  const authResult = calculateAuthorityScore(currentSignals.authority);

  const priorVisResult = calculateVisibilityScore(priorSignalsActual.visibility);
  const priorAuthResult = calculateAuthorityScore(priorSignalsActual.authority);

  const momResult = calculateMomentumScore(
    visResult.score,
    authResult.score,
    priorVisResult.score,
    priorAuthResult.score
  );

  // Apply formula: EVI = (V × 0.40) + (A × 0.35) + (M × 0.25)
  const eviScore = clamp(
    visResult.score * 0.40 +
    authResult.score * 0.35 +
    momResult.score * 0.25
  );

  const calculatedAt = new Date().toISOString();

  const signalBreakdown: SignalBreakdown = {
    visibility: {
      raw: currentSignals.visibility,
      normalized_score: visResult.score,
      weight: 0.40,
      components: visResult.components,
    },
    authority: {
      raw: currentSignals.authority,
      normalized_score: authResult.score,
      weight: 0.35,
      components: authResult.components,
    },
    momentum: {
      normalized_score: momResult.score,
      weight: 0.25,
      components: momResult.components,
      prior_period: {
        visibility_score: priorVisResult.score,
        authority_score: priorAuthResult.score,
      },
    },
    metadata: {
      period_start: currentSignals.periodStart,
      period_end: currentSignals.periodEnd,
      period_days: periodDays,
      formula: 'EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)',
    },
  };

  // Save snapshot to DB
  const { error } = await supabase.from('evi_snapshots').insert({
    org_id: orgId,
    evi_score: eviScore,
    visibility_score: visResult.score,
    authority_score: authResult.score,
    momentum_score: momResult.score,
    signal_breakdown: signalBreakdown,
    calculated_at: calculatedAt,
    period_days: periodDays,
  });

  if (error) {
    console.error('[EVI] Failed to save snapshot:', error.message);
    // Don't throw — still return the calculated score
  }

  return {
    evi_score: eviScore,
    visibility_score: visResult.score,
    authority_score: authResult.score,
    momentum_score: momResult.score,
    signal_breakdown: signalBreakdown,
    calculated_at: calculatedAt,
    period_days: periodDays,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Aggregate signals for a specific date range (used for prior period).
 */
async function aggregateSignalsForPeriod(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<AggregatedSignals> {
  const { aggregateSignals: _ } = await import('./eviSignalAggregator');

  // Inline aggregation for specific period bounds
  const [visibility, authority] = await Promise.all([
    aggregateVisibilityForPeriod(supabase, orgId, periodStart, periodEnd),
    aggregateAuthorityForPeriod(supabase, orgId, periodStart, periodEnd),
  ]);

  return {
    visibility,
    authority,
    periodStart,
    periodEnd,
    periodDays: Math.round((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (24 * 60 * 60 * 1000)),
  };
}

async function aggregateVisibilityForPeriod(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<import('./eviSignalAggregator').VisibilitySignals> {
  const { data: pitches } = await supabase
    .from('pr_pitches')
    .select('id, status')
    .eq('org_id', orgId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  const pitchesSent = pitches?.length ?? 0;
  const pitchesOpened = pitches?.filter((p: { status: string }) =>
    ['opened', 'replied', 'interested'].includes(p.status)
  ).length ?? 0;
  const pitchesReplied = pitches?.filter((p: { status: string }) =>
    ['replied', 'interested'].includes(p.status)
  ).length ?? 0;

  const { data: journalists } = await supabase
    .from('journalist_profiles')
    .select('domain_authority')
    .eq('org_id', orgId);

  const journalistCount = journalists?.length ?? 0;
  const avgJournalistDA = journalistCount > 0
    ? journalists!.reduce((sum: number, j: { domain_authority: number | null }) =>
        sum + (j.domain_authority ?? 0), 0) / journalistCount
    : 0;

  return { pitchesSent, pitchesOpened, pitchesReplied, avgJournalistDA, journalistCount, citationMentionRate: 0 };
}

async function aggregateAuthorityForPeriod(
  supabase: SupabaseClient,
  orgId: string,
  periodStart: string,
  periodEnd: string
): Promise<import('./eviSignalAggregator').AuthoritySignals> {
  const { data: qualityScores } = await supabase
    .from('content_quality_scores')
    .select('overall_score')
    .eq('org_id', orgId)
    .gte('scored_at', periodStart)
    .lte('scored_at', periodEnd);

  const publishedContentCount = qualityScores?.length ?? 0;
  const avgContentQuality = publishedContentCount > 0
    ? qualityScores!.reduce((sum: number, q: { overall_score: number | null }) =>
        sum + (q.overall_score ?? 0), 0) / publishedContentCount
    : 0;

  const { count: highDABacklinks } = await supabase
    .from('seo_backlinks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gt('domain_authority', 40)
    .gte('discovered_at', periodStart)
    .lte('discovered_at', periodEnd);

  const { count: totalBacklinks } = await supabase
    .from('seo_backlinks')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('discovered_at', periodStart)
    .lte('discovered_at', periodEnd);

  return {
    avgContentQuality,
    publishedContentCount,
    highDABacklinks: highDABacklinks ?? 0,
    totalBacklinks: totalBacklinks ?? 0,
  };
}
