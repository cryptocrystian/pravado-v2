'use client';

/**
 * useSeoTopics — real SERP-overlap keyword clusters for the SEO Topics surface.
 *
 * HONEST DATA: reads /api/seo/topics, which proxies /api/v1/seo/topics. Clusters
 * are formed from the org's CACHED DataForSEO SERP data (no new paid calls). Every
 * field maps to a genuine derived value:
 *   - score        → visibility score from the cluster's real avg owned SERP position
 *   - avgPosition  → mean of our own best organic rank across ranking members
 *   - totalVolume  → sum of members' real search volume
 *   - trend        → sign of the cluster's snapshot position delta
 * Any field is `null` when its real source is absent (org doesn't rank, no volume,
 * < 2 snapshots) — nothing is fabricated. A new org with no cached SERP data
 * resolves to an empty cluster list (honest empty state).
 */

import useSWR from 'swr';

// ============================================================================
// Real backend shape (SeoKeywordCluster)
// ============================================================================

export type ClusterTrend = 'up' | 'down' | 'stable';

export interface SeoTopicCluster {
  id: string;
  name: string;
  /** The keyword strings that make up this SERP-overlap cluster. */
  memberKeywords: string[];
  /** Visibility score 0-100 from the real avg owned position, or null. */
  score: number | null;
  /** Mean of our own best organic rank across ranking members, or null. */
  avgPosition: number | null;
  /** Sum of members' real search volume, or null. */
  totalVolume: number | null;
  /** Position trend from snapshots, or null when < 2 snapshots exist. */
  trend: ClusterTrend | null;
  computedAt: string;
}

interface TopicsData {
  clusters: SeoTopicCluster[];
}

// ============================================================================
// Fetcher
// ============================================================================

async function jsonFetcher(url: string): Promise<TopicsData> {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data as TopicsData;
}

// ============================================================================
// Hook
// ============================================================================

export interface UseSeoTopics {
  clusters: SeoTopicCluster[];
  isLoading: boolean;
  error: Error | undefined;
}

export function useSeoTopics(): UseSeoTopics {
  const { data, error, isLoading } = useSWR<TopicsData>(
    '/api/seo/topics',
    jsonFetcher,
    { revalidateOnFocus: false }
  );

  return {
    clusters: data?.clusters ?? [],
    isLoading,
    error: error as Error | undefined,
  };
}
