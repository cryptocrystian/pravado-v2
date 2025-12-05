/**
 * Journalist Discovery Engine API Helper (Sprint S48)
 * Frontend API client for journalist discovery operations
 */

import type {
  DiscoveredJournalist,
  DiscoveredJournalistInput,
  ResolveDiscoveryInput,
  AuthorExtractionInput,
  AuthorExtractionResult,
  SocialProfileInput,
  DiscoveryQuery,
  DiscoveryListResponse,
  DiscoveryStats,
  MergePreview,
  DeduplicationResult,
  BatchDiscoveryInput,
  BatchDiscoveryResult,
} from '@pravado/types';

const API_BASE = '/api/v1/journalist-discovery';

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
 * Extract authors from article content
 */
export async function extractAuthorsFromArticle(
  input: AuthorExtractionInput
): Promise<AuthorExtractionResult> {
  return apiFetch('/extract', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Create a new discovered journalist
 */
export async function createDiscovery(
  input: DiscoveredJournalistInput
): Promise<DiscoveredJournalist> {
  return apiFetch('/', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * List discovered journalists with filters
 */
export async function listDiscoveries(
  query?: DiscoveryQuery
): Promise<DiscoveryListResponse> {
  const params = new URLSearchParams();

  if (query?.q) params.append('q', query.q);

  if (query?.status) {
    if (Array.isArray(query.status)) {
      query.status.forEach(s => params.append('status', s));
    } else {
      params.append('status', query.status);
    }
  }

  if (query?.sourceType) {
    if (Array.isArray(query.sourceType)) {
      query.sourceType.forEach(st => params.append('sourceType', st));
    } else {
      params.append('sourceType', query.sourceType);
    }
  }

  if (query?.minConfidenceScore !== undefined) {
    params.append('minConfidenceScore', query.minConfidenceScore.toString());
  }

  if (query?.beats && query.beats.length > 0) {
    query.beats.forEach(beat => params.append('beats', beat));
  }

  if (query?.hasEmail !== undefined) {
    params.append('hasEmail', query.hasEmail.toString());
  }

  if (query?.hasSocialLinks !== undefined) {
    params.append('hasSocialLinks', query.hasSocialLinks.toString());
  }

  if (query?.sortBy) params.append('sortBy', query.sortBy);
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
  if (query?.limit !== undefined) params.append('limit', query.limit.toString());
  if (query?.offset !== undefined) params.append('offset', query.offset.toString());

  const queryString = params.toString();
  return apiFetch(`/${queryString ? `?${queryString}` : ''}`);
}

/**
 * Get discovery statistics
 */
export async function getDiscoveryStats(): Promise<DiscoveryStats> {
  return apiFetch('/stats');
}

/**
 * Get a single discovered journalist by ID
 */
export async function getDiscovery(id: string): Promise<DiscoveredJournalist> {
  return apiFetch(`/${id}`);
}

/**
 * Update a discovered journalist
 */
export async function updateDiscovery(
  id: string,
  updates: Partial<DiscoveredJournalistInput>
): Promise<DiscoveredJournalist> {
  return apiFetch(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Delete a discovered journalist
 */
export async function deleteDiscovery(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Resolve a discovery (merge, confirm, or reject)
 */
export async function resolveDiscovery(
  id: string,
  input: ResolveDiscoveryInput
): Promise<DiscoveredJournalist> {
  return apiFetch(`/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Generate merge preview showing conflicts
 */
export async function generateMergePreview(
  discoveryId: string,
  targetJournalistId: string
): Promise<MergePreview> {
  return apiFetch(`/${discoveryId}/merge-preview`, {
    method: 'POST',
    body: JSON.stringify({ targetJournalistId }),
  });
}

/**
 * Check if a discovery is a duplicate
 */
export async function checkDuplication(
  input: DiscoveredJournalistInput
): Promise<DeduplicationResult> {
  return apiFetch('/check-duplication', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Create discoveries in batch
 */
export async function batchCreateDiscoveries(
  input: BatchDiscoveryInput
): Promise<BatchDiscoveryResult> {
  return apiFetch('/batch', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Ingest a social profile as a discovery
 */
export async function ingestSocialProfile(
  input: SocialProfileInput
): Promise<DiscoveredJournalist> {
  return apiFetch('/social-profile', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
