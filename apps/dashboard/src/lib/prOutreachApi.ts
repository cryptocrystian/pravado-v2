/**
 * PR Outreach API Client (Sprint S44)
 * Frontend helper for automated journalist outreach
 */

import type {
  CreateOutreachEventInput,
  CreateOutreachSequenceInput,
  CreateOutreachStepInput,
  ListOutreachEventsQuery,
  ListOutreachRunsQuery,
  ListOutreachSequencesQuery,
  OutreachEvent,
  OutreachEventListResponse,
  OutreachRun,
  OutreachRunListResponse,
  OutreachRunWithDetails,
  OutreachSequence,
  OutreachSequenceListResponse,
  OutreachSequenceStep,
  OutreachSequenceWithSteps,
  OutreachStats,
  OutreachStopReason,
  StartSequenceRunsInput,
  TargetingPreview,
  UpdateOutreachRunInput,
  UpdateOutreachSequenceInput,
  UpdateOutreachStepInput,
} from '@pravado/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// =============================================
// Sequences
// =============================================

export async function createOutreachSequence(
  input: CreateOutreachSequenceInput
): Promise<OutreachSequence> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/sequences`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to create sequence');
  }

  const result = await response.json();
  return result.data;
}

export async function listOutreachSequences(
  params?: ListOutreachSequencesQuery
): Promise<OutreachSequenceListResponse> {
  const query = new URLSearchParams();

  if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
  if (params?.pitchId) query.append('pitchId', params.pitchId);
  if (params?.pressReleaseId) query.append('pressReleaseId', params.pressReleaseId);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));

  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/sequences?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to list sequences');
  }

  const result = await response.json();
  return result.data;
}

export async function getOutreachSequence(id: string): Promise<OutreachSequence> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/sequences/${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to get sequence');
  }

  const result = await response.json();
  return result.data;
}

export async function getOutreachSequenceWithSteps(id: string): Promise<OutreachSequenceWithSteps> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/sequences/${id}/with-steps`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to get sequence with steps');
  }

  const result = await response.json();
  return result.data;
}

export async function updateOutreachSequence(
  id: string,
  input: UpdateOutreachSequenceInput
): Promise<OutreachSequence> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/sequences/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to update sequence');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteOutreachSequence(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/sequences/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to delete sequence');
  }
}

// =============================================
// Steps
// =============================================

export async function createOutreachStep(
  sequenceId: string,
  input: CreateOutreachStepInput
): Promise<OutreachSequenceStep> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/sequences/${sequenceId}/steps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to create step');
  }

  const result = await response.json();
  return result.data;
}

export async function updateOutreachStep(
  id: string,
  input: UpdateOutreachStepInput
): Promise<OutreachSequenceStep> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/steps/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to update step');
  }

  const result = await response.json();
  return result.data;
}

export async function deleteOutreachStep(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/steps/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to delete step');
  }
}

// =============================================
// Runs
// =============================================

export async function startSequenceRuns(
  sequenceId: string,
  input: Omit<StartSequenceRunsInput, 'sequenceId'>
): Promise<{ runsCreated: number; runs: OutreachRun[]; skippedJournalists: string[] }> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/sequences/${sequenceId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to start sequence runs');
  }

  const result = await response.json();
  return result.data;
}

export async function listOutreachRuns(
  params?: ListOutreachRunsQuery
): Promise<OutreachRunListResponse> {
  const query = new URLSearchParams();

  if (params?.sequenceId) query.append('sequenceId', params.sequenceId);
  if (params?.journalistId) query.append('journalistId', params.journalistId);
  if (params?.status) query.append('status', params.status);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));

  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/runs?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to list runs');
  }

  const result = await response.json();
  return result.data;
}

export async function getOutreachRun(id: string): Promise<OutreachRunWithDetails> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/runs/${id}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to get run');
  }

  const result = await response.json();
  return result.data;
}

export async function updateOutreachRun(
  id: string,
  input: UpdateOutreachRunInput
): Promise<OutreachRun> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/runs/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to update run');
  }

  const result = await response.json();
  return result.data;
}

export async function stopOutreachRun(
  id: string,
  reason: OutreachStopReason
): Promise<OutreachRun> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/runs/${id}/stop`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to stop run');
  }

  const result = await response.json();
  return result.data;
}

export async function advanceOutreachRun(
  id: string,
  forceAdvance: boolean = false
): Promise<OutreachRun> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/runs/${id}/advance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ forceAdvance }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to advance run');
  }

  const result = await response.json();
  return result.data;
}

// =============================================
// Events
// =============================================

export async function createOutreachEvent(input: CreateOutreachEventInput): Promise<OutreachEvent> {
  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to create event');
  }

  const result = await response.json();
  return result.data;
}

export async function listOutreachEvents(
  params?: ListOutreachEventsQuery
): Promise<OutreachEventListResponse> {
  const query = new URLSearchParams();

  if (params?.runId) query.append('runId', params.runId);
  if (params?.sequenceId) query.append('sequenceId', params.sequenceId);
  if (params?.eventType) query.append('eventType', params.eventType);
  if (params?.startDate) query.append('startDate', params.startDate.toISOString());
  if (params?.endDate) query.append('endDate', params.endDate.toISOString());
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.offset) query.append('offset', String(params.offset));

  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/events?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to list events');
  }

  const result = await response.json();
  return result.data;
}

// =============================================
// Targeting & Stats
// =============================================

export async function previewTargeting(sequenceId: string): Promise<TargetingPreview> {
  const response = await fetch(
    `${API_BASE}/api/v1/pr-outreach/sequences/${sequenceId}/preview-targeting`,
    {
      method: 'GET',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to preview targeting');
  }

  const result = await response.json();
  return result.data;
}

export async function getOutreachStats(sequenceId?: string): Promise<OutreachStats> {
  const query = new URLSearchParams();
  if (sequenceId) query.append('sequenceId', sequenceId);

  const response = await fetch(`${API_BASE}/api/v1/pr-outreach/stats?${query.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to get stats');
  }

  const result = await response.json();
  return result.data;
}
