/**
 * SAGE Opportunity Scorer (Sprint S-INT-02)
 *
 * Ranks sage_signals by opportunity value for a given org.
 * Produces a sorted list of the top signals that Sprint S-INT-03
 * will use to generate SAGE proposals.
 *
 * Scoring formula:
 *   opportunity_score = (evi_impact_estimate × 0.50) + (confidence × 0.30 × 100) + (priority_weight × 0.20)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@pravado/utils';

const logger = createLogger('sage:scorer');

export interface ScoredOpportunity {
  signal_id: string;
  signal_type: string;
  pillar: string;
  priority: string;
  evi_impact_estimate: number;
  confidence: number;
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
 * Returns the top N opportunities sorted by score descending.
 */
export async function scoreOpportunities(
  supabase: SupabaseClient,
  orgId: string,
  limit: number = 20
): Promise<ScoredOpportunity[]> {
  // Fetch active signals (not expired)
  const now = new Date().toISOString();

  const { data: signals, error } = await supabase
    .from('sage_signals')
    .select('id, signal_type, pillar, priority, evi_impact_estimate, confidence, signal_data, scored_at, expires_at')
    .eq('org_id', orgId)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('scored_at', { ascending: false })
    .limit(200);

  if (error) {
    logger.error(`Failed to fetch signals for scoring (org ${orgId}): ${error.message}`);
    return [];
  }

  if (!signals?.length) {
    logger.info(`No active signals to score for org ${orgId}`);
    return [];
  }

  // Score each signal
  const scored: ScoredOpportunity[] = signals.map((s) => {
    const priorityWeight = PRIORITY_WEIGHTS[s.priority] ?? 50;
    const opportunityScore =
      (s.evi_impact_estimate ?? 0) * 0.50 +
      (s.confidence ?? 0) * 0.30 * 100 +
      priorityWeight * 0.20;

    return {
      signal_id: s.id,
      signal_type: s.signal_type,
      pillar: s.pillar,
      priority: s.priority,
      evi_impact_estimate: s.evi_impact_estimate ?? 0,
      confidence: s.confidence ?? 0,
      opportunity_score: Math.round(opportunityScore * 100) / 100,
      signal_data: s.signal_data as Record<string, unknown>,
      scored_at: s.scored_at,
      expires_at: s.expires_at,
    };
  });

  // Sort by opportunity score descending
  scored.sort((a, b) => b.opportunity_score - a.opportunity_score);

  const topOpportunities = scored.slice(0, limit);
  logger.info(
    `Scored ${signals.length} signals for org ${orgId}, returning top ${topOpportunities.length}`
  );

  return topOpportunities;
}
