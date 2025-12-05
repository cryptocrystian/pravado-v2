/**
 * Media Crawler API Client (Sprint S41)
 * Client-side functions for RSS feeds and crawl jobs
 */

import type {
  CreateCrawlJobInput,
  CreateRSSFeedInput,
  CrawlJobListResponse,
  ListCrawlJobsQuery,
  ListRSSFeedsQuery,
  MediaCrawlJob,
  MediaRSSFeed,
  RSSFeedListResponse,
  RSSFeedStats,
  RSSIngestionResult,
  UpdateRSSFeedInput,
} from '@pravado/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Generic API request helper
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: any }> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  return response.json();
}

// ========================================
// RSS FEED API
// ========================================

export async function createRSSFeed(input: CreateRSSFeedInput): Promise<MediaRSSFeed> {
  const result = await apiRequest<{ feed: MediaRSSFeed }>(
    '/api/v1/media-monitoring/rss-feeds',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to create RSS feed');
  }

  return result.data.feed;
}

export async function listRSSFeeds(query?: ListRSSFeedsQuery): Promise<RSSFeedListResponse> {
  const params = new URLSearchParams();
  if (query?.sourceId) params.append('sourceId', query.sourceId);
  if (query?.active !== undefined) params.append('active', String(query.active));
  if (query?.limit) params.append('limit', String(query.limit));
  if (query?.offset) params.append('offset', String(query.offset));

  const queryString = params.toString();
  const result = await apiRequest<RSSFeedListResponse>(
    `/api/v1/media-monitoring/rss-feeds${queryString ? `?${queryString}` : ''}`
  );

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to list RSS feeds');
  }

  return result.data;
}

export async function getRSSFeed(feedId: string): Promise<MediaRSSFeed> {
  const result = await apiRequest<{ feed: MediaRSSFeed }>(
    `/api/v1/media-monitoring/rss-feeds/${feedId}`
  );

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get RSS feed');
  }

  return result.data.feed;
}

export async function updateRSSFeed(
  feedId: string,
  input: UpdateRSSFeedInput
): Promise<MediaRSSFeed> {
  const result = await apiRequest<{ feed: MediaRSSFeed }>(
    `/api/v1/media-monitoring/rss-feeds/${feedId}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  );

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to update RSS feed');
  }

  return result.data.feed;
}

export async function deactivateRSSFeed(feedId: string): Promise<void> {
  const result = await apiRequest(`/api/v1/media-monitoring/rss-feeds/${feedId}`, {
    method: 'DELETE',
  });

  if (!result.success) {
    throw new Error(result.error?.message || 'Failed to deactivate RSS feed');
  }
}

export async function triggerRSSFetch(feedIds?: string[]): Promise<{
  results: RSSIngestionResult[];
  totalFeeds: number;
  totalJobsCreated: number;
}> {
  const result = await apiRequest<{
    results: RSSIngestionResult[];
    totalFeeds: number;
    totalJobsCreated: number;
  }>('/api/v1/media-monitoring/rss/fetch', {
    method: 'POST',
    body: JSON.stringify({ feedIds }),
  });

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to trigger RSS fetch');
  }

  return result.data;
}

// ========================================
// CRAWL JOB API
// ========================================

export async function createCrawlJob(input: CreateCrawlJobInput): Promise<MediaCrawlJob> {
  const result = await apiRequest<{ job: MediaCrawlJob }>(
    '/api/v1/media-monitoring/crawl-jobs',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to create crawl job');
  }

  return result.data.job;
}

export async function listCrawlJobs(query?: ListCrawlJobsQuery): Promise<CrawlJobListResponse> {
  const params = new URLSearchParams();
  if (query?.feedId) params.append('feedId', query.feedId);
  if (query?.sourceId) params.append('sourceId', query.sourceId);
  if (query?.status) params.append('status', query.status);
  if (query?.startDate) params.append('startDate', query.startDate);
  if (query?.endDate) params.append('endDate', query.endDate);
  if (query?.limit) params.append('limit', String(query.limit));
  if (query?.offset) params.append('offset', String(query.offset));
  if (query?.sortBy) params.append('sortBy', query.sortBy);
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder);

  const queryString = params.toString();
  const result = await apiRequest<CrawlJobListResponse>(
    `/api/v1/media-monitoring/crawl-jobs${queryString ? `?${queryString}` : ''}`
  );

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to list crawl jobs');
  }

  return result.data;
}

export async function runCrawlJobs(): Promise<{
  totalProcessed: number;
  successful: number;
  failed: number;
}> {
  const result = await apiRequest<{
    totalProcessed: number;
    successful: number;
    failed: number;
  }>('/api/v1/media-monitoring/crawl-jobs/run', {
    method: 'POST',
  });

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to run crawl jobs');
  }

  return result.data;
}

// ========================================
// STATS API
// ========================================

export async function getRSSStats(): Promise<RSSFeedStats> {
  const result = await apiRequest<{ stats: RSSFeedStats }>('/api/v1/media-monitoring/rss/stats');

  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to get RSS stats');
  }

  return result.data.stats;
}
