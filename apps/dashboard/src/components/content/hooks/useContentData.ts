'use client';

/**
 * Content Data Hooks
 *
 * SWR-based hooks for fetching Content pillar data.
 * Follows Gate 1A network invariant (client → Next.js route handler → backend).
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import useSWR from 'swr';
import type {
  ContentAsset,
  ContentBrief,
  ContentGap,
  ContentClusterDTO,
  AuthoritySignals,
  ContentStatus,
  ContentType,
} from '../types';

// ============================================
// FETCHER
// ============================================

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('Failed to fetch content data');
    throw error;
  }
  return res.json();
}

// ============================================
// CONTENT ITEMS HOOK
// ============================================

interface UseContentItemsParams {
  status?: ContentStatus;
  type?: ContentType;
  entity?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface ContentItemsResponse {
  items: ContentAsset[];
  total: number;
  page: number;
  pageSize: number;
}

export function useContentItems(params?: UseContentItemsParams) {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.set('status', params.status);
  if (params?.type) searchParams.set('type', params.type);
  if (params?.entity) searchParams.set('entity', params.entity);
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const url = `/api/content/items${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ContentItemsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 24,
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// CONTENT BRIEFS HOOK
// ============================================

interface UseContentBriefsParams {
  status?: 'draft' | 'review' | 'approved' | 'completed';
  limit?: number;
}

interface ContentBriefsResponse {
  briefs: ContentBrief[];
  total: number;
}

export function useContentBriefs(params?: UseContentBriefsParams) {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const url = `/api/content/briefs${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ContentBriefsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    briefs: data?.briefs ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// CONTENT GAPS HOOK
// ============================================

interface UseContentGapsParams {
  minScore?: number;
  limit?: number;
}

interface ContentGapsResponse {
  gaps: ContentGap[];
  total: number;
}

export function useContentGaps(params?: UseContentGapsParams) {
  const searchParams = new URLSearchParams();

  if (params?.minScore) searchParams.set('minScore', String(params.minScore));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const url = `/api/content/gaps${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ContentGapsResponse>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // Less frequent for gaps
    }
  );

  return {
    gaps: data?.gaps ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// CONTENT CLUSTERS HOOK
// ============================================

interface ContentClustersResponse {
  clusters: ContentClusterDTO[];
  total: number;
}

export function useContentClusters() {
  const { data, error, isLoading, mutate } = useSWR<ContentClustersResponse>(
    '/api/content/clusters',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  return {
    clusters: data?.clusters ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// AUTHORITY SIGNALS HOOK
// ============================================

interface AuthoritySignalsResponse {
  signals: AuthoritySignals;
}

export function useContentSignals() {
  const { data, error, isLoading, mutate } = useSWR<AuthoritySignalsResponse>(
    '/api/content/signals',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Less frequent for aggregate metrics
    }
  );

  return {
    signals: data?.signals ?? null,
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// SINGLE ASSET HOOK
// ============================================

interface AssetDetailResponse {
  asset: ContentAsset;
}

export function useContentAsset(assetId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<AssetDetailResponse>(
    assetId ? `/api/content/items/${assetId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    asset: data?.asset ?? null,
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// SINGLE BRIEF HOOK
// ============================================

interface BriefDetailResponse {
  brief: ContentBrief;
}

export function useContentBrief(briefId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<BriefDetailResponse>(
    briefId ? `/api/content/briefs/${briefId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    brief: data?.brief ?? null,
    isLoading,
    error,
    mutate,
  };
}

// ============================================
// QUALITY ANALYSIS HOOK
// ============================================

interface QualityAnalysisResponse {
  analysis: {
    assetId: string;
    authorityScore: number;
    citationEligibility: number;
    aiReadiness: number;
    issues: Array<{
      type: string;
      severity: 'warning' | 'error';
      message: string;
      section?: string;
    }>;
    suggestions: string[];
    analyzedAt: string;
  };
}

export function useContentQualityAnalysis(assetId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<QualityAnalysisResponse>(
    assetId ? `/api/content/items/${assetId}/quality` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  );

  return {
    analysis: data?.analysis ?? null,
    isLoading,
    error,
    mutate,
  };
}
