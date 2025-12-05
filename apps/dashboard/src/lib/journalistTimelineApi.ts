/**
 * Journalist Timeline API Helper (Sprint S49)
 * Frontend API client for journalist relationship timeline operations
 */

import type {
  JournalistTimelineEvent,
  CreateTimelineEventInput,
  UpdateTimelineEventInput,
  CreateManualNoteInput,
  TimelineQuery,
  TimelineListResponse,
  TimelineStats,
  RelationshipHealthScore,
  TimelineAggregation,
  TimelineCluster,
  BatchCreateTimelineEventsInput,
  BatchCreateTimelineEventsResult,
  GenerateNarrativeInput,
  JournalistNarrative,
  SystemEventPush,
} from '@pravado/types';

const API_BASE = '/api/v1/journalist-timeline';

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

// ========================================
// Core Event Management
// ========================================

/**
 * Create a new timeline event
 */
export async function createEvent(
  input: CreateTimelineEventInput
): Promise<JournalistTimelineEvent> {
  return apiFetch('/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * Get a single timeline event by ID
 */
export async function getEvent(eventId: string): Promise<JournalistTimelineEvent> {
  return apiFetch(`/events/${eventId}`, {
    method: 'GET',
  });
}

/**
 * Update a timeline event
 */
export async function updateEvent(
  eventId: string,
  input: UpdateTimelineEventInput
): Promise<JournalistTimelineEvent> {
  return apiFetch(`/events/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

/**
 * Delete a timeline event
 */
export async function deleteEvent(eventId: string): Promise<{ success: boolean }> {
  return apiFetch(`/events/${eventId}`, {
    method: 'DELETE',
  });
}

/**
 * List timeline events with filtering, sorting, and pagination
 */
export async function listEvents(query?: TimelineQuery): Promise<TimelineListResponse> {
  const params = new URLSearchParams();

  if (query?.journalistId) params.append('journalistId', query.journalistId);

  if (query?.eventTypes && query.eventTypes.length > 0) {
    query.eventTypes.forEach((type) => params.append('eventTypes', type));
  }

  if (query?.sourceSystems && query.sourceSystems.length > 0) {
    query.sourceSystems.forEach((system) => params.append('sourceSystems', system));
  }

  if (query?.sentiments && query.sentiments.length > 0) {
    query.sentiments.forEach((sentiment) => params.append('sentiments', sentiment));
  }

  if (query?.clusterIds && query.clusterIds.length > 0) {
    query.clusterIds.forEach((id) => params.append('clusterIds', id));
  }

  if (query?.startDate) {
    params.append('startDate', query.startDate.toISOString());
  }

  if (query?.endDate) {
    params.append('endDate', query.endDate.toISOString());
  }

  if (query?.last30Days !== undefined) {
    params.append('last30Days', query.last30Days.toString());
  }

  if (query?.last90Days !== undefined) {
    params.append('last90Days', query.last90Days.toString());
  }

  if (query?.minRelevanceScore !== undefined) {
    params.append('minRelevanceScore', query.minRelevanceScore.toString());
  }

  if (query?.hasCluster !== undefined) {
    params.append('hasCluster', query.hasCluster.toString());
  }

  if (query?.searchQuery) {
    params.append('searchQuery', query.searchQuery);
  }

  if (query?.sortBy) {
    params.append('sortBy', query.sortBy);
  }

  if (query?.sortOrder) {
    params.append('sortOrder', query.sortOrder);
  }

  if (query?.limit !== undefined) {
    params.append('limit', query.limit.toString());
  }

  if (query?.offset !== undefined) {
    params.append('offset', query.offset.toString());
  }

  const queryString = params.toString();
  return apiFetch(`/events${queryString ? `?${queryString}` : ''}`, {
    method: 'GET',
  });
}

// ========================================
// Statistics & Analytics
// ========================================

/**
 * Get timeline statistics for a journalist
 */
export async function getStats(journalistId: string): Promise<TimelineStats> {
  return apiFetch(`/stats/${journalistId}`, {
    method: 'GET',
  });
}

/**
 * Calculate relationship health score for a journalist
 */
export async function calculateHealthScore(
  journalistId: string
): Promise<RelationshipHealthScore> {
  return apiFetch(`/health-score/${journalistId}`, {
    method: 'GET',
  });
}

/**
 * Get timeline aggregation data for charting
 */
export async function getAggregation(
  journalistId: string,
  period: 'day' | 'week' | 'month',
  startDate: Date,
  endDate: Date
): Promise<TimelineAggregation> {
  const params = new URLSearchParams({
    period,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  return apiFetch(`/aggregation/${journalistId}?${params.toString()}`, {
    method: 'GET',
  });
}

// ========================================
// Event Clustering
// ========================================

/**
 * Auto-cluster related events for a journalist
 */
export async function autoClusterEvents(
  journalistId: string
): Promise<{ clustersCreated: number }> {
  return apiFetch(`/auto-cluster/${journalistId}`, {
    method: 'POST',
  });
}

/**
 * Get all events in a cluster
 */
export async function getCluster(clusterId: string): Promise<TimelineCluster> {
  return apiFetch(`/clusters/${clusterId}`, {
    method: 'GET',
  });
}

// ========================================
// Batch Operations
// ========================================

/**
 * Create multiple timeline events in a batch
 */
export async function batchCreateEvents(
  input: BatchCreateTimelineEventsInput
): Promise<BatchCreateTimelineEventsResult> {
  return apiFetch('/batch', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ========================================
// Manual Notes
// ========================================

/**
 * Create a manual note on the timeline
 */
export async function createManualNote(
  input: CreateManualNoteInput
): Promise<JournalistTimelineEvent> {
  return apiFetch('/notes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ========================================
// Narrative Generation
// ========================================

/**
 * Generate an AI-powered narrative summary of journalist relationship
 */
export async function generateNarrative(
  input: GenerateNarrativeInput
): Promise<JournalistNarrative> {
  return apiFetch('/narrative', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// ========================================
// System Integration (S38-S48 Event Push)
// ========================================

/**
 * Push a system event to the timeline (internal use by S38-S48 systems)
 */
export async function pushSystemEvent(
  event: SystemEventPush
): Promise<JournalistTimelineEvent> {
  return apiFetch('/push-event', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}
