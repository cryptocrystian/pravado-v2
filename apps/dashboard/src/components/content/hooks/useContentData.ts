'use client';

/**
 * Content Data Hooks
 *
 * SWR-based hooks for fetching Content pillar data.
 * Follows Gate 1A network invariant (client → Next.js route handler → backend).
 *
 * Wiring contract (Lane H): the Next.js route handlers return the standard
 * `{ success, data }` envelope (backendProxy already unwrapped the API's own
 * envelope). So the client fetcher unwraps exactly ONE `{ success, data }` layer
 * and each hook reads the backend payload shape:
 *   - /items      → { items, total, page, pageSize }
 *   - /items/:id  → { item }
 *   - /briefs     → { items }
 *   - /clusters   → { items }
 *   - /gaps       → { items }
 * Previously the hooks read `data.items`/`data.gaps` off the OUTER envelope and
 * were never wired to any component — that mismatch is the bug this fixes.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import useSWR from 'swr';

import type {
  ContentAsset,
  ContentBrief,
  ContentGap,
  ContentClusterDTO,
  ContentSignalsResponse,
  ContentStatus,
  ContentType,
  CiteMindStatus,
} from '../types';

// ============================================
// FETCHER — unwraps one { success, data } envelope
// ============================================

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !json || json.success === false) {
    throw new Error(json?.error?.message ?? 'Failed to fetch content data');
  }
  return (json.data ?? (json as unknown as T)) as T;
}

// ============================================
// API → FE SHAPE ADAPTER
// ============================================

/**
 * The backend `content_items` payload (DB-shaped) is narrower than the FE
 * `ContentAsset`. Map the real fields and default the presentation-only fields
 * (citeMindStatus is derived from a separate CiteMind score fetch; until wired
 * it is honestly 'pending', never faked as 'passed').
 */
interface ApiContentItem {
  id: string;
  orgId?: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  body?: string | null;
  slug?: string | null;
  url?: string | null;
  wordCount?: number | null;
  readingTimeMinutes?: number | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function mapApiItemToAsset(item: ApiContentItem): ContentAsset {
  return {
    id: item.id,
    organizationId: item.orgId,
    title: item.title,
    contentType: item.contentType,
    status: item.status,
    citeMindStatus: 'pending' as CiteMindStatus,
    body: item.body ?? undefined,
    slug: item.slug ?? undefined,
    url: item.url ?? undefined,
    wordCount: item.wordCount ?? undefined,
    readingTimeMinutes: item.readingTimeMinutes ?? undefined,
    publishedAt: item.publishedAt ?? undefined,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
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

interface ContentItemsPayload {
  items: ApiContentItem[];
  total: number;
  page: number;
  pageSize: number;
}

export function useContentItems(params?: UseContentItemsParams) {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.set('status', params.status);
  if (params?.type) searchParams.set('contentType', params.type);
  if (params?.search) searchParams.set('q', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.limit) searchParams.set('pageSize', String(params.limit));

  const queryString = searchParams.toString();
  const url = `/api/content/items${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<ContentItemsPayload>(
    url,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  return {
    assets: (data?.items ?? []).map(mapApiItemToAsset),
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 24,
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

// ============================================
// CONTENT BRIEFS HOOK
// ============================================

interface UseContentBriefsParams {
  status?: 'draft' | 'in_progress' | 'completed';
  limit?: number;
}

export function useContentBriefs(params?: UseContentBriefsParams) {
  const searchParams = new URLSearchParams();

  if (params?.status) searchParams.set('status', params.status);
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const url = `/api/content/briefs${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ items: ContentBrief[] }>(
    url,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  return {
    briefs: data?.items ?? [],
    total: data?.items?.length ?? 0,
    isLoading,
    error: error as Error | undefined,
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

export function useContentGaps(params?: UseContentGapsParams) {
  const searchParams = new URLSearchParams();

  if (params?.minScore) searchParams.set('minScore', String(params.minScore));
  if (params?.limit) searchParams.set('limit', String(params.limit));

  const queryString = searchParams.toString();
  const url = `/api/content/gaps${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ items: ContentGap[] }>(
    url,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  return {
    gaps: data?.items ?? [],
    total: data?.items?.length ?? 0,
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

// ============================================
// CONTENT CLUSTERS HOOK
// ============================================

export function useContentClusters() {
  const { data, error, isLoading, mutate } = useSWR<{
    items: ContentClusterDTO[];
  }>('/api/content/clusters', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  return {
    clusters: data?.items ?? [],
    total: data?.items?.length ?? 0,
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

// ============================================
// AUTHORITY SIGNALS HOOK
// ============================================
// GET /api/content/signals returns authority signals DERIVED on-the-fly from
// the populated CiteMind scorer output (citemind_scores). Nothing reads or
// writes the empty content_authority_signals table. Only two metrics have a
// faithful producer (citationEligibilityScore, aiIngestionLikelihood); the
// rest come back `null` so the UI renders "Not available yet" — never 0.

export function useContentSignals() {
  const { data, error, isLoading, mutate } = useSWR<ContentSignalsResponse>(
    '/api/content/signals',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      shouldRetryOnError: false,
    }
  );

  return {
    signals: data?.signals ?? null,
    topAssets: data?.topAssets ?? [],
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}

// ============================================
// SINGLE ASSET HOOK
// ============================================

export function useContentAsset(assetId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ item: ApiContentItem }>(
    assetId ? `/api/content/items/${assetId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  return {
    asset: data?.item ? mapApiItemToAsset(data.item) : null,
    isLoading,
    error: error as Error | undefined,
    mutate,
  };
}
