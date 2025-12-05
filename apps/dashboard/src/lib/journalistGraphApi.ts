/**
 * Journalist Identity Graph API Helper (Sprint S46)
 * Frontend API client for journalist graph operations
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

const API_BASE = '/api/v1/journalist-graph';

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
  return apiFetch(`/profiles${queryString ? `?${queryString}` : ''}`);
}

export async function getProfile(id: string) {
  return apiFetch(`/profiles/${id}`);
}

export async function getEnrichedProfile(id: string) {
  return apiFetch(`/profiles/${id}/enriched`);
}

export async function createProfile(input: CreateJournalistProfileInput) {
  return apiFetch('/profiles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateProfile(id: string, input: UpdateJournalistProfileInput) {
  return apiFetch(`/profiles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteProfile(id: string) {
  return apiFetch(`/profiles/${id}`, {
    method: 'DELETE',
  });
}

// Identity resolution
export async function resolveIdentity(input: IdentityResolutionInput) {
  return apiFetch('/resolve-identity', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function findDuplicates() {
  return apiFetch('/find-duplicates', {
    method: 'POST',
  });
}

export async function mergeProfiles(input: MergeProfilesInput) {
  return apiFetch('/merge-profiles', {
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
  return apiFetch(`/activities${queryString ? `?${queryString}` : ''}`);
}

export async function createActivity(input: CreateActivityInput) {
  return apiFetch('/activities', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// Scoring operations
export async function updateScores(id: string) {
  return apiFetch(`/profiles/${id}/update-scores`, {
    method: 'POST',
  });
}

export async function getTier(id: string) {
  return apiFetch(`/profiles/${id}/tier`);
}

// Graph operations
export async function buildGraph(query?: GraphQuery) {
  return apiFetch('/graph', {
    method: 'POST',
    body: JSON.stringify(query || {}),
  });
}
