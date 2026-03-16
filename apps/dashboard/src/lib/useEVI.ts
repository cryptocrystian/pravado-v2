/**
 * useEVI — SWR hook for fetching EVI data (Sprint S-INT-01)
 *
 * Provides real-time EVI score, delta, and history from the backend.
 * Shows loading skeleton while fetching, stale indicator on error.
 */

import useSWR from 'swr';

// ============================================================================
// Types
// ============================================================================

export interface EVICurrentData {
  evi_score: number;
  visibility_score: number;
  authority_score: number;
  momentum_score: number;
  delta: number;
  delta_percent: number;
  direction: 'up' | 'down' | 'flat';
  signal_breakdown: Record<string, unknown>;
  calculated_at: string;
  period_days: number;
}

export interface EVIHistoryPoint {
  date: string;
  evi_score: number;
  visibility_score: number;
  authority_score: number;
  momentum_score: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; code?: string };
}

// ============================================================================
// Fetcher
// ============================================================================

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`EVI fetch failed: ${res.status}`);
  const json: ApiResponse<T> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message ?? 'EVI data unavailable');
  }
  return json.data;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch the current EVI score with delta information.
 * Revalidates every 5 minutes and on window focus.
 */
export function useEVICurrent() {
  const { data, error, isLoading, mutate } = useSWR<EVICurrentData>(
    '/api/evi/current',
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 5 * 60 * 1000, // 5 minutes
      dedupingInterval: 60 * 1000, // 1 minute dedup
    }
  );

  return {
    data,
    error,
    isLoading,
    isStale: !!error && !isLoading,
    mutate,
  };
}

/**
 * Fetch EVI history for chart rendering.
 * @param days - 30, 60, or 90 (default 90)
 */
export function useEVIHistory(days: number = 90) {
  const { data, error, isLoading } = useSWR<EVIHistoryPoint[]>(
    `/api/evi/history?days=${days}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    data: data ?? [],
    error,
    isLoading,
  };
}
