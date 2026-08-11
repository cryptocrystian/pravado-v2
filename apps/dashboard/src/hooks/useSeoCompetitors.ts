'use client';

/**
 * useSeoCompetitors — real DataForSEO-backed competitor analysis for the SEO pillar.
 *
 * HONEST DATA: reads /api/seo/competitors, which proxies the real backend
 * `/api/v1/seo/competitors`. Every field returned maps to a genuine SERP-derived
 * value (Share-of-Voice + per-keyword competitor positions). Nothing is fabricated —
 * a new org with no cached SERP data resolves to empty arrays (honest empty state).
 *
 * `refresh()` is a DELIBERATE, COSTED mutation: it POSTs to
 * /api/seo/competitors/refresh, which spends one DataForSEO SERP call per tracked
 * keyword (~$0.002 each). It is never fired automatically — only from an explicit,
 * admin-gated user action — and revalidates the read on success.
 */

import { useState } from 'react';
import useSWR from 'swr';

// ============================================================================
// Real backend shapes (SEOCompetitorAnalysis)
// ============================================================================

export interface ShareOfVoiceEntry {
  domain: string;
  /** True when this domain is one of the org's own (owned) domains. */
  isOwned: boolean;
  /** Sum of position weights (1/rank) across all tracked-keyword appearances. */
  score: number;
  /** score as a percentage of the total score across all domains (0-100). */
  sharePct: number;
  /** Number of tracked-keyword organic positions this domain occupies. */
  appearances: number;
}

export interface CompetitorPositionEntry {
  keywordId: string;
  keyword: string;
  /** The org's own ranking domain for this keyword, if it ranks. */
  ourDomain: string | null;
  /** The org's own best (lowest) organic rank, or null if not ranking. */
  ourRank: number | null;
  competitors: {
    domain: string;
    rank: number;
    /** ourRank - competitorRank; positive = competitor ranks ahead of us. */
    delta: number | null;
  }[];
}

export interface CompetitorAnalysis {
  shareOfVoice: ShareOfVoiceEntry[];
  competitorPositions: CompetitorPositionEntry[];
}

export interface RefreshResult {
  keywordsProcessed: number;
  positionsStored: number;
  competitorsUpserted: number;
  snapshotsCreated: number;
}

// ============================================================================
// Fetcher
// ============================================================================

async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data as T;
}

// ============================================================================
// Hook
// ============================================================================

export interface UseSeoCompetitors {
  shareOfVoice: ShareOfVoiceEntry[];
  competitorPositions: CompetitorPositionEntry[];
  isLoading: boolean;
  error: Error | undefined;
  /** True while a costed refresh is in flight. */
  isRefreshing: boolean;
  /** Real upstream message from the last failed refresh, if any. */
  refreshError: string | null;
  /** DELIBERATE, COSTED: fetch live SERPs and re-cache positions, then revalidate. */
  refresh: () => Promise<RefreshResult | null>;
}

export function useSeoCompetitors(): UseSeoCompetitors {
  const { data, error, isLoading, mutate } = useSWR<CompetitorAnalysis>(
    '/api/seo/competitors',
    jsonFetcher,
    { revalidateOnFocus: false }
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  async function refresh(): Promise<RefreshResult | null> {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch('/api/seo/competitors/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(
          json?.error?.message ?? `Refresh failed (${res.status})`
        );
      }
      // Re-read the now-updated cache from the backend.
      await mutate();
      return (json.data as RefreshResult) ?? null;
    } catch (err) {
      setRefreshError(
        err instanceof Error
          ? err.message
          : 'Refresh failed. Try again shortly.'
      );
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }

  return {
    shareOfVoice: data?.shareOfVoice ?? [],
    competitorPositions: data?.competitorPositions ?? [],
    isLoading,
    error: error as Error | undefined,
    isRefreshing,
    refreshError,
    refresh,
  };
}
