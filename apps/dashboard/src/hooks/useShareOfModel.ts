/**
 * useShareOfModel — real CiteMind Engine 3 Share of Model for the active org.
 *
 * HONEST DATA: reads /api/seo/share-of-model → /api/v1/citemind/share-of-model.
 * `available` is false until the citation monitor has sampled the org's topic
 * queries; `shareOfModel` is null when there are no brand+competitor citations
 * to compute a share from. No fabricated fallback.
 */

import useSWR from 'swr';

export interface ShareOfModelTopic {
  topic: string;
  shareOfModel: number;
  brandCitations: number;
  competitorCitations: number;
}

export interface ShareOfModelData {
  available: boolean;
  shareOfModel: number | null;
  trendDelta: number | null;
  periodDays: number;
  brandCitations: number;
  competitorCitations: number;
  sampledQueries: number;
  topics: ShareOfModelTopic[];
}

async function fetcher(url: string): Promise<ShareOfModelData> {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
  return json.data as ShareOfModelData;
}

export interface UseShareOfModel {
  data: ShareOfModelData | undefined;
  isLoading: boolean;
  error: Error | undefined;
}

export function useShareOfModel(): UseShareOfModel {
  const { data, error, isLoading } = useSWR<ShareOfModelData>(
    '/api/seo/share-of-model',
    fetcher,
    { revalidateOnFocus: false }
  );
  return { data, isLoading, error };
}
