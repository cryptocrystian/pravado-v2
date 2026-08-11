'use client';

/**
 * useAnalyticsSeo — real Analytics-SEO panels for the /app/analytics/seo surface.
 *
 * HONEST DATA: reads /api/analytics/seo, which proxies /api/v1/analytics/seo. All
 * four panels come from stored sources (no new paid calls) and each is
 * independently honest-empty:
 *   - engineBreakdown → CiteMind (citation_summaries.by_engine + citation_monitor_results)
 *   - summary         → GSC own-rank (seo_keywords.current_position + seo_keyword_metrics)
 *   - competitiveMovement → seo_snapshots.position over captured_at (empty until >= 2 snapshots)
 *   - topicPerformance    → persisted seo_keyword_clusters (real fields, null when absent)
 * Nothing is fabricated: a field is null / a panel is `hasData:false` when its
 * real source is absent. A brand-new org resolves to all-empty panels.
 */

import useSWR from 'swr';

// ============================================================================
// Real backend shapes (mirror AnalyticsSeoData in seoAnalyticsService.ts)
// ============================================================================

export type ClusterTrend = 'up' | 'down' | 'stable';

export interface EngineStat {
  engine: string;
  queries: number;
  mentions: number;
  rate: number | null;
}

export interface EngineVelocityPoint {
  period: string;
  [engine: string]: number | string;
}

export interface EngineBreakdownPanel {
  engines: EngineStat[];
  velocity: EngineVelocityPoint[];
  velocityEngines: string[];
  totalVelocity: Array<{ period: string; citations: number }>;
  hasData: boolean;
}

export interface OwnRankSummaryPanel {
  trackedKeywords: number;
  rankedKeywords: number;
  avgPosition: number | null;
  totalVolume: number | null;
  gscKeywords: number;
  hasData: boolean;
}

export interface CompetitiveMover {
  keyword: string;
  earliestPosition: number;
  latestPosition: number;
  delta: number;
  snapshotCount: number;
}

export interface CompetitiveMovementPanel {
  movers: CompetitiveMover[];
  totalSnapshots: number;
  hasData: boolean;
}

export interface TopicCluster {
  id: string;
  name: string;
  memberKeywords: string[];
  score: number | null;
  avgPosition: number | null;
  totalVolume: number | null;
  trend: ClusterTrend | null;
  computedAt: string;
}

export interface TopicPerformancePanel {
  clusters: TopicCluster[];
  hasData: boolean;
}

export interface AnalyticsSeoData {
  engineBreakdown: EngineBreakdownPanel;
  summary: OwnRankSummaryPanel;
  competitiveMovement: CompetitiveMovementPanel;
  topicPerformance: TopicPerformancePanel;
}

// ============================================================================
// Fetcher
// ============================================================================

async function jsonFetcher(url: string): Promise<AnalyticsSeoData> {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data as AnalyticsSeoData;
}

// ============================================================================
// Hook
// ============================================================================

export interface UseAnalyticsSeo {
  data: AnalyticsSeoData | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

export function useAnalyticsSeo(): UseAnalyticsSeo {
  const { data, error, isLoading } = useSWR<AnalyticsSeoData>(
    '/api/analytics/seo',
    jsonFetcher,
    { revalidateOnFocus: false }
  );

  return {
    data,
    isLoading,
    error: error as Error | undefined,
  };
}
