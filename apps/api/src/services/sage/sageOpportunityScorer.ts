/**
 * SAGE Opportunity Scorer (Sprint S-INT-02; Wave-2 mesh: decay + reinforcement)
 *
 * Ranks sage_signals by opportunity value for a given org and produces a sorted list
 * of the top signals that proposal generation consumes.
 *
 * SAGE is a Foundational Model (Charter D033): the score is no longer a static linear
 * formula. Two canon mesh mechanics now shape the effective signal strength:
 *
 *   1. DECAY  — signal strength fades continuously: `S(t) = S₀ × e^(-λt)`, λ per
 *               signal category (SAGE_OPERATING_MODEL §2.1). `expires_at` remains a
 *               hard floor, but signals FADE before they hard-cut.
 *   2. REINFORCEMENT — a completed action in one pillar boosts the signals of the
 *               other pillars by the canon coefficient (SAGE_OPERATING_MODEL §3.3).
 *               "Outputs become inputs across dimensions."
 *
 * Base score S₀ (unchanged composite):
 *   S₀ = (evi_impact_estimate × 0.50) + (confidence × 0.30 × 100) + (priority × 0.20)
 * Effective score:
 *   opportunity_score = S₀ × decayFactor(type, age) + reinforcementBoost(pillar)
 *
 * Deterministic + auditable: every signal carries base_score, decay_factor and
 * reinforcement_boost alongside the final score.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { computeAgeHours, decayFactor } from './sageDecay';
import { fetchReinforcementByPillar } from './sageReinforcement';
import { createLogger } from '../../lib/logger';

const logger = createLogger('sage:scorer');

export interface ScoredOpportunity {
  signal_id: string;
  signal_type: string;
  pillar: string;
  priority: string;
  evi_impact_estimate: number;
  confidence: number;
  /** Composite S₀ before decay/reinforcement (audit). */
  base_score: number;
  /** Canon decay multiplier e^(-λ·age) in (0,1] (audit). */
  decay_factor: number;
  /** Additive cross-pillar reinforcement applied for this signal's pillar (audit). */
  reinforcement_boost: number;
  opportunity_score: number;
  signal_data: Record<string, unknown>;
  scored_at: string;
  expires_at: string | null;
}

const PRIORITY_WEIGHTS: Record<string, number> = {
  critical: 100,
  high: 75,
  medium: 50,
  low: 25,
};

/**
 * Score and rank all active (non-expired) signals for an org.
 * Returns the top N opportunities sorted by (decayed + reinforced) score descending.
 */
export async function scoreOpportunities(
  supabase: SupabaseClient,
  orgId: string,
  limit: number = 20
): Promise<ScoredOpportunity[]> {
  // Hard floor: expired signals are excluded outright. Decay handles the continuous
  // fade for everything still inside its expiry window.
  const nowDate = new Date();
  const now = nowDate.toISOString();

  const { data: signals, error } = await supabase
    .from('sage_signals')
    .select(
      'id, signal_type, pillar, priority, evi_impact_estimate, confidence, signal_data, scored_at, expires_at'
    )
    .eq('org_id', orgId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('scored_at', { ascending: false })
    .limit(200);

  if (error) {
    logger.error(
      `Failed to fetch signals for scoring (org ${orgId}): ${error.message}`
    );
    return [];
  }

  if (!signals?.length) {
    logger.info(`No active signals to score for org ${orgId}`);
    return [];
  }

  // Cross-pillar reinforcement currently applied to each pillar for this org
  // (org-scoped: another org's reinforcement never leaks in).
  const reinforcementByPillar = await fetchReinforcementByPillar(
    supabase,
    orgId
  );

  // Score each signal: S₀ × decay + reinforcement(pillar).
  const scored: ScoredOpportunity[] = signals.map((s) => {
    const priorityWeight = PRIORITY_WEIGHTS[s.priority] ?? 50;
    const baseScore =
      (s.evi_impact_estimate ?? 0) * 0.5 +
      (s.confidence ?? 0) * 0.3 * 100 +
      priorityWeight * 0.2;

    const ageHours = computeAgeHours(s.scored_at, nowDate);
    const decay = decayFactor(s.signal_type, ageHours);
    const decayed = baseScore * decay;

    const reinforcement = reinforcementByPillar[s.pillar] ?? 0;
    const effective = decayed + reinforcement;

    return {
      signal_id: s.id,
      signal_type: s.signal_type,
      pillar: s.pillar,
      priority: s.priority,
      evi_impact_estimate: s.evi_impact_estimate ?? 0,
      confidence: s.confidence ?? 0,
      base_score: Math.round(baseScore * 100) / 100,
      decay_factor: Math.round(decay * 10000) / 10000,
      reinforcement_boost: Math.round(reinforcement * 100) / 100,
      opportunity_score: Math.round(effective * 100) / 100,
      signal_data: s.signal_data as Record<string, unknown>,
      scored_at: s.scored_at,
      expires_at: s.expires_at,
    };
  });

  // Sort by effective opportunity score descending.
  scored.sort((a, b) => b.opportunity_score - a.opportunity_score);

  const topOpportunities = scored.slice(0, limit);
  logger.info(
    `Scored ${signals.length} signals for org ${orgId} (decay+reinforcement applied), returning top ${topOpportunities.length}`
  );

  return topOpportunities;
}
