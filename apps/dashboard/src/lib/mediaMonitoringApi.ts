/**
 * Media Monitoring API Helper (Sprint S40)
 * Client-side API functions for media monitoring and earned coverage
 */

import type {
  ArticleIngestionResult,
  ArticleListResponse,
  ArticleWithMentions,
  CreateSourceInput,
  DetectMentionsResult,
  ListArticlesQuery,
  ListMentionsQuery,
  ListSourcesQuery,
  MediaMonitoringSource,
  MediaMonitoringStats,
  MentionListResponse,
  SourceListResponse,
  UpdateSourceInput,
} from '@pravado/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============================================================================
// API Error Handling
// ============================================================================

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  const result: ApiResponse<T> = await response.json();

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'API request failed');
  }

  return result.data;
}

// ============================================================================
// Source API Functions
// ============================================================================

export async function createSource(input: CreateSourceInput): Promise<MediaMonitoringSource> {
  const data = await fetchApi<{ source: MediaMonitoringSource }>('/api/v1/media-monitoring/sources', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return data.source;
}

export async function listSources(params?: ListSourcesQuery): Promise<SourceListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.active !== undefined) queryParams.set('active', String(params.active));
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params?.offset !== undefined) queryParams.set('offset', String(params.offset));

  const endpoint = `/api/v1/media-monitoring/sources${queryParams.toString() ? `?${queryParams}` : ''}`;
  return fetchApi<SourceListResponse>(endpoint);
}

export async function getSource(id: string): Promise<MediaMonitoringSource> {
  const data = await fetchApi<{ source: MediaMonitoringSource }>(`/api/v1/media-monitoring/sources/${id}`);
  return data.source;
}

export async function updateSource(id: string, input: UpdateSourceInput): Promise<MediaMonitoringSource> {
  const data = await fetchApi<{ source: MediaMonitoringSource }>(`/api/v1/media-monitoring/sources/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return data.source;
}

export async function deactivateSource(id: string): Promise<void> {
  await fetchApi<{ message: string }>(`/api/v1/media-monitoring/sources/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Article API Functions
// ============================================================================

export async function ingestArticle(
  url: string,
  options?: { sourceId?: string; title?: string; author?: string; content?: string }
): Promise<ArticleIngestionResult> {
  return fetchApi<ArticleIngestionResult>('/api/v1/media-monitoring/ingest', {
    method: 'POST',
    body: JSON.stringify({ url, ...options }),
  });
}

export async function listArticles(params?: ListArticlesQuery): Promise<ArticleListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.sourceId) queryParams.set('sourceId', params.sourceId);
  if (params?.minRelevance !== undefined) queryParams.set('minRelevance', String(params.minRelevance));
  if (params?.keyword) queryParams.set('keyword', params.keyword);
  if (params?.author) queryParams.set('author', params.author);
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params?.offset !== undefined) queryParams.set('offset', String(params.offset));
  if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  const endpoint = `/api/v1/media-monitoring/articles${queryParams.toString() ? `?${queryParams}` : ''}`;
  return fetchApi<ArticleListResponse>(endpoint);
}

export async function getArticleDetails(id: string): Promise<ArticleWithMentions> {
  const data = await fetchApi<{ article: ArticleWithMentions }>(`/api/v1/media-monitoring/articles/${id}`);
  return data.article;
}

// ============================================================================
// Mention API Functions
// ============================================================================

export async function detectMentions(
  articleId: string,
  entities: string[],
  detectCompetitors: boolean = false
): Promise<DetectMentionsResult> {
  return fetchApi<DetectMentionsResult>('/api/v1/media-monitoring/detect-mentions', {
    method: 'POST',
    body: JSON.stringify({ articleId, entities, detectCompetitors }),
  });
}

export async function listMentions(params?: ListMentionsQuery): Promise<MentionListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.articleId) queryParams.set('articleId', params.articleId);
  if (params?.entity) queryParams.set('entity', params.entity);
  if (params?.entityType) queryParams.set('entityType', params.entityType);
  if (params?.sentiment) queryParams.set('sentiment', params.sentiment);
  if (params?.minConfidence !== undefined) queryParams.set('minConfidence', String(params.minConfidence));
  if (params?.startDate) queryParams.set('startDate', params.startDate);
  if (params?.endDate) queryParams.set('endDate', params.endDate);
  if (params?.limit !== undefined) queryParams.set('limit', String(params.limit));
  if (params?.offset !== undefined) queryParams.set('offset', String(params.offset));
  if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

  const endpoint = `/api/v1/media-monitoring/mentions${queryParams.toString() ? `?${queryParams}` : ''}`;
  return fetchApi<MentionListResponse>(endpoint);
}

// ============================================================================
// Stats API Functions
// ============================================================================

export async function getStats(): Promise<MediaMonitoringStats> {
  const data = await fetchApi<{ stats: MediaMonitoringStats }>('/api/v1/media-monitoring/stats');
  return data.stats;
}
