/**
 * AI Media List Builder API Helper (Sprint S47)
 * Frontend API client for media list operations
 */

import type {
  MediaListGenerationInput,
  MediaListCreateInput,
  MediaListUpdateInput,
  MediaListQuery,
  MediaListEntryQuery,
  MediaListGenerationResult,
  MediaList,
  MediaListWithEntries,
  MediaListSummary,
  MediaListEntryWithJournalist,
} from '@pravado/types';

const API_BASE = '/api/v1/media-lists';

async function apiFetch(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Generate AI-powered media list
 */
export async function generateMediaList(
  input: MediaListGenerationInput
): Promise<MediaListGenerationResult> {
  return apiFetch('/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Create and save a new media list
 */
export async function createMediaList(
  input: MediaListCreateInput & {
    entries: Array<{
      journalistId: string;
      fitScore: number;
      tier: 'A' | 'B' | 'C' | 'D';
      reason: string;
      fitBreakdown: any;
      position?: number;
    }>;
  }
): Promise<MediaListWithEntries> {
  return apiFetch('/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * List all media lists with pagination
 */
export async function listMediaLists(
  query?: MediaListQuery
): Promise<{
  lists: MediaListSummary[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}> {
  const params = new URLSearchParams();
  if (query?.q) params.append('q', query.q);
  if (query?.topic) params.append('topic', query.topic);
  if (query?.market) params.append('market', query.market);
  if (query?.createdBy) params.append('createdBy', query.createdBy);
  if (query?.sortBy) params.append('sortBy', query.sortBy);
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
  if (query?.limit !== undefined) params.append('limit', query.limit.toString());
  if (query?.offset !== undefined) params.append('offset', query.offset.toString());

  const queryString = params.toString();
  return apiFetch(`/${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get a single media list with entries
 */
export async function getMediaList(id: string): Promise<MediaListWithEntries> {
  return apiFetch(`/${id}`);
}

/**
 * Update media list metadata
 */
export async function updateMediaList(
  id: string,
  input: MediaListUpdateInput
): Promise<MediaList> {
  return apiFetch(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/**
 * Delete a media list
 */
export async function deleteMediaList(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Get media list entries with filtering
 */
export async function getMediaListEntries(
  listId: string,
  query?: Omit<MediaListEntryQuery, 'listId'>
): Promise<{
  entries: MediaListEntryWithJournalist[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}> {
  const params = new URLSearchParams();
  if (query?.tier) {
    if (Array.isArray(query.tier)) {
      query.tier.forEach(tier => params.append('tier', tier));
    } else {
      params.append('tier', query.tier);
    }
  }
  if (query?.minFitScore !== undefined) params.append('minFitScore', query.minFitScore.toString());
  if (query?.sortBy) params.append('sortBy', query.sortBy);
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
  if (query?.limit !== undefined) params.append('limit', query.limit.toString());
  if (query?.offset !== undefined) params.append('offset', query.offset.toString());

  const queryString = params.toString();
  return apiFetch(`/${listId}/entries${queryString ? `?${queryString}` : ''}`);
}
