/**
 * Journalist Identity Graph API Helper (Sprint S46)
 * Frontend API client for journalist graph operations
 *
 * S100.1 Fix: Use internal route handlers only (same-origin)
 * Browser calls ONLY /api/pr/* - NO direct staging API calls
 */

import type {
  CreateActivityInput,
  CreateJournalistProfileInput,
  GraphQuery,
  IdentityResolutionInput,
  ListActivitiesQuery,
  ListJournalistProfilesQuery,
  MergeProfilesInput,
  UpdateJournalistProfileInput,
} from '@pravado/types';

// S100.1: Internal route helper - browser calls same-origin only
async function apiFetch(endpoint: string, options?: RequestInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || error?.error?.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// Profile operations
export async function listProfiles(query?: ListJournalistProfilesQuery) {
  const params = new URLSearchParams();
  if (query?.q) params.append('q', query.q);
  if (query?.outlet) params.append('outlet', query.outlet);
  if (query?.beat) params.append('beat', query.beat);
  if (query?.minEngagementScore !== undefined) params.append('minEngagementScore', query.minEngagementScore.toString());
  if (query?.minRelevanceScore !== undefined) params.append('minRelevanceScore', query.minRelevanceScore.toString());
  if (query?.sortBy) params.append('sortBy', query.sortBy);
  if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
  if (query?.limit !== undefined) params.append('limit', query.limit.toString());
  if (query?.offset !== undefined) params.append('offset', query.offset.toString());

  const queryString = params.toString();
  return apiFetch(`/api/pr/journalists${queryString ? `?${queryString}` : ''}`);
}

export async function getProfile(id: string) {
  return apiFetch(`/api/pr/journalists/${id}`);
}

export async function getEnrichedProfile(id: string) {
  return apiFetch(`/api/pr/journalists/${id}/enriched`);
}

export async function createProfile(input: CreateJournalistProfileInput) {
  return apiFetch('/api/pr/journalists', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProfile(id: string, input: UpdateJournalistProfileInput) {
  return apiFetch(`/api/pr/journalists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteProfile(id: string) {
  return apiFetch(`/api/pr/journalists/${id}`, {
    method: 'DELETE',
  });
}

// Identity resolution
export async function resolveIdentity(input: IdentityResolutionInput) {
  return apiFetch('/api/pr/journalists/resolve-identity', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function findDuplicates() {
  return apiFetch('/api/pr/journalists/find-duplicates', {
    method: 'POST',
  });
}

export async function mergeProfiles(input: MergeProfilesInput) {
  return apiFetch('/api/pr/journalists/merge-profiles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// Activity operations
export async function listActivities(query?: ListActivitiesQuery) {
  const params = new URLSearchParams();
  if (query?.journalistId) params.append('journalistId', query.journalistId);
  if (query?.activityType) {
    if (Array.isArray(query.activityType)) {
      query.activityType.forEach(type => params.append('activityType', type));
    } else {
      params.append('activityType', query.activityType);
    }
  }
  if (query?.sourceSystem) {
    if (Array.isArray(query.sourceSystem)) {
      query.sourceSystem.forEach(system => params.append('sourceSystem', system));
    } else {
      params.append('sourceSystem', query.sourceSystem);
    }
  }
  if (query?.sentiment) params.append('sentiment', query.sentiment);
  if (query?.startDate) params.append('startDate', query.startDate.toISOString());
  if (query?.endDate) params.append('endDate', query.endDate.toISOString());
  if (query?.limit !== undefined) params.append('limit', query.limit.toString());
  if (query?.offset !== undefined) params.append('offset', query.offset.toString());

  const queryString = params.toString();
  return apiFetch(`/api/pr/journalists/activities${queryString ? `?${queryString}` : ''}`);
}

export async function createActivity(input: CreateActivityInput) {
  return apiFetch('/api/pr/journalists/activities', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// Scoring operations
export async function updateScores(id: string) {
  return apiFetch(`/api/pr/journalists/${id}/update-scores`, {
    method: 'POST',
  });
}

export async function getTier(id: string) {
  return apiFetch(`/api/pr/journalists/${id}/tier`);
}

// Graph operations
export async function buildGraph(query?: GraphQuery) {
  return apiFetch('/api/pr/journalists/graph', {
    method: 'POST',
    body: JSON.stringify(query || {}),
  });
}
