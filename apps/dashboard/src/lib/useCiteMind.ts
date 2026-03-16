/**
 * useCiteMind — SWR hooks for CiteMind scoring (Sprint S-INT-04)
 *
 * Provides real-time CiteMind scores and gate status from the backend.
 */

import useSWR, { mutate } from 'swr';
import { useCallback, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CiteMindScoreData {
  overall_score: number;
  entity_density_score: number;
  claim_verifiability_score: number;
  structural_clarity_score: number;
  topical_authority_score: number;
  schema_markup_score: number;
  citation_pattern_score: number;
  factor_breakdown: Record<string, unknown>;
  gate_status: 'pending' | 'analyzing' | 'passed' | 'warning' | 'blocked';
  gate_threshold: number;
  recommendations: string[];
  word_count: number;
  scored_at: string;
}

// ============================================================================
// Fetcher
// ============================================================================

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CiteMind fetch failed: ${res.status}`);
  const json = await res.json();
  // Handle both wrapped { success, data } and direct response
  return json.data || json;
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Fetch the latest CiteMind score for a content item.
 */
export function useCiteMindScore(contentItemId: string | null | undefined) {
  const { data, error, isLoading } = useSWR<CiteMindScoreData>(
    contentItemId ? `/api/citemind/score/${contentItemId}` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 0 }
  );

  return {
    score: data || null,
    isLoading,
    error,
    gateStatus: data?.gate_status || 'pending',
    overallScore: data?.overall_score ?? null,
    recommendations: data?.recommendations || [],
  };
}

/**
 * Trigger CiteMind scoring for a content item.
 * Returns the new score result.
 */
export function useCiteMindTrigger() {
  const [isScoring, setIsScoring] = useState(false);

  const triggerScore = useCallback(async (contentItemId: string): Promise<CiteMindScoreData | null> => {
    setIsScoring(true);
    try {
      const res = await fetch(`/api/citemind/score/${contentItemId}`, { method: 'POST' });
      if (!res.ok) throw new Error(`Scoring failed: ${res.status}`);
      const json = await res.json();
      const result = json.data || json;

      // Revalidate the SWR cache for this item
      await mutate(`/api/citemind/score/${contentItemId}`);

      return result as CiteMindScoreData;
    } catch {
      return null;
    } finally {
      setIsScoring(false);
    }
  }, []);

  return { triggerScore, isScoring };
}

/**
 * Acknowledge a warning gate to allow publishing.
 */
// ============================================================================
// Citation Monitor Hooks (S-INT-05)
// ============================================================================

export interface CitationResult {
  id: string;
  engine: string;
  query_prompt: string;
  query_topic: string;
  response_excerpt: string | null;
  brand_mentioned: boolean;
  mention_type: string | null;
  citation_url: string | null;
  monitored_at: string;
}

export interface CitationSummary {
  total_queries: number;
  total_mentions: number;
  mention_rate: number;
  by_engine: Record<string, { queries: number; mentions: number; rate: number }>;
  top_cited_topics: Array<{ topic: string; mentions: number; engines: string[] }>;
  updated_at: string;
}

/**
 * Fetch citation monitoring results (brand mentions from AI engines).
 */
export function useCitationResults(options?: { mentionedOnly?: boolean; days?: number; limit?: number }) {
  const params = new URLSearchParams();
  if (options?.mentionedOnly) params.set('mentioned_only', 'true');
  if (options?.days) params.set('days', String(options.days));
  if (options?.limit) params.set('limit', String(options.limit));

  const qs = params.toString();
  const url = `/api/citemind/monitor/results${qs ? `?${qs}` : ''}`;

  const { data, error, isLoading } = useSWR<{ items: CitationResult[] }>(
    url,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 300000 } // 5 min refresh
  );

  return {
    results: data?.items || [],
    isLoading,
    error,
  };
}

/**
 * Fetch the citation summary for the org.
 */
export function useCitationSummary() {
  const { data, error, isLoading } = useSWR<CitationSummary>(
    '/api/citemind/monitor/summary',
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 300000 }
  );

  return {
    summary: data || null,
    isLoading,
    error,
  };
}

export function useCiteMindGateAcknowledge() {
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const acknowledge = useCallback(async (contentItemId: string): Promise<boolean> => {
    setIsAcknowledging(true);
    try {
      const res = await fetch(`/api/citemind/gate/${contentItemId}/acknowledge`, { method: 'POST' });
      return res.ok;
    } catch {
      return false;
    } finally {
      setIsAcknowledging(false);
    }
  }, []);

  return { acknowledge, isAcknowledging };
}
