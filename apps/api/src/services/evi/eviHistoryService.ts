/**
 * EVI History Service (Sprint S-INT-01)
 *
 * Fetches historical EVI snapshots for trend display.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface EVIHistoryPoint {
  date: string;
  evi_score: number;
  visibility_score: number;
  authority_score: number;
  momentum_score: number;
}

// ============================================================================
// Service
// ============================================================================

/**
 * Get EVI history for an org over a given number of days.
 * Returns snapshots ordered by date ascending for chart rendering.
 */
export async function getEVIHistory(
  supabase: SupabaseClient,
  orgId: string,
  days: number = 90
): Promise<EVIHistoryPoint[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('evi_snapshots')
    .select('evi_score, visibility_score, authority_score, momentum_score, calculated_at')
    .eq('org_id', orgId)
    .gte('calculated_at', since)
    .order('calculated_at', { ascending: true });

  if (error) {
    console.error('[EVI History] Query failed:', error.message);
    return [];
  }

  return (data ?? []).map((row: {
    calculated_at: string;
    evi_score: number;
    visibility_score: number;
    authority_score: number;
    momentum_score: number;
  }) => ({
    date: row.calculated_at,
    evi_score: Number(row.evi_score),
    visibility_score: Number(row.visibility_score),
    authority_score: Number(row.authority_score),
    momentum_score: Number(row.momentum_score),
  }));
}
