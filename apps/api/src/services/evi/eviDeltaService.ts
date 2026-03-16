/**
 * EVI Delta Service (Sprint S-INT-01)
 *
 * Calculates period-over-period change by comparing the latest
 * snapshot to the prior period snapshot.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface EVIDelta {
  delta: number;
  deltaPercent: number;
  direction: 'up' | 'down' | 'flat';
  current: number;
  prior: number | null;
}

// ============================================================================
// Service
// ============================================================================

/**
 * Get the EVI delta for an org by comparing the two most recent snapshots.
 */
export async function getEVIDelta(
  supabase: SupabaseClient,
  orgId: string
): Promise<EVIDelta> {
  const { data, error } = await supabase
    .from('evi_snapshots')
    .select('evi_score, calculated_at')
    .eq('org_id', orgId)
    .order('calculated_at', { ascending: false })
    .limit(2);

  if (error) {
    console.error('[EVI Delta] Query failed:', error.message);
    return { delta: 0, deltaPercent: 0, direction: 'flat', current: 0, prior: null };
  }

  if (!data || data.length === 0) {
    return { delta: 0, deltaPercent: 0, direction: 'flat', current: 0, prior: null };
  }

  const current = Number(data[0].evi_score);

  if (data.length < 2) {
    return { delta: 0, deltaPercent: 0, direction: 'flat', current, prior: null };
  }

  const prior = Number(data[1].evi_score);
  const delta = Math.round((current - prior) * 100) / 100;
  const deltaPercent = prior > 0
    ? Math.round(((current - prior) / prior) * 10000) / 100
    : 0;

  const direction: EVIDelta['direction'] =
    delta > 0.5 ? 'up' :
    delta < -0.5 ? 'down' :
    'flat';

  return { delta, deltaPercent, direction, current, prior };
}
