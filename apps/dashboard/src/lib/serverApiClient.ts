/**
 * Server-side API Client for RSC and server components
 * Sprint S99.1: Wraps fetch with auth token injection
 *
 * Use this for ALL server-side API calls instead of direct fetch.
 */

import { API_BASE_URL } from './apiConfig';
import { getServerAccessToken } from './serverSupabaseClient';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Server-side authenticated fetch wrapper.
 * Automatically injects Bearer token from server session.
 */
export async function serverFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getServerAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    console.warn('[serverFetch] No auth token available for:', endpoint);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    // Don't use credentials on server-side, we're using Authorization header
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody?.error?.message ||
      `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error?.message || 'API request failed');
  }

  return result.data as T;
}

/**
 * Server-side GET request helper
 */
export async function serverGet<T>(endpoint: string): Promise<T> {
  return serverFetch<T>(endpoint, { method: 'GET' });
}

/**
 * Server-side POST request helper
 */
export async function serverPost<T>(endpoint: string, body: unknown): Promise<T> {
  return serverFetch<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Convenience functions for specific API endpoints
// ============================================================================

// Journalist Graph
export async function getJournalistProfiles(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const queryString = query.toString();
  return serverGet(`/api/v1/journalist-graph/profiles${queryString ? `?${queryString}` : ''}`);
}

export async function getJournalistProfile(id: string) {
  return serverGet(`/api/v1/journalist-graph/profiles/${id}`);
}

// PR Pitches
export async function getPitches(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const queryString = query.toString();
  return serverGet(`/api/v1/pr/pitches${queryString ? `?${queryString}` : ''}`);
}

// PR Releases
export async function getReleases(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const queryString = query.toString();
  return serverGet(`/api/v1/pr/releases${queryString ? `?${queryString}` : ''}`);
}

// PR Outreach
export async function getOutreachSequences(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const queryString = query.toString();
  return serverGet(`/api/v1/pr-outreach/sequences${queryString ? `?${queryString}` : ''}`);
}

export async function getOutreachStats(sequenceId?: string) {
  const query = new URLSearchParams();
  if (sequenceId) query.set('sequenceId', sequenceId);
  const queryString = query.toString();
  return serverGet(`/api/v1/pr-outreach/stats${queryString ? `?${queryString}` : ''}`);
}

// Media Monitoring
export async function getMediaMonitoringStats() {
  return serverGet('/api/v1/media-monitoring/stats');
}

export async function getMediaArticles(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const queryString = query.toString();
  return serverGet(`/api/v1/media-monitoring/articles${queryString ? `?${queryString}` : ''}`);
}

// Deliverability
export async function getDeliverabilitySummary() {
  return serverGet('/api/v1/pr-outreach-deliverability/stats/deliverability');
}
