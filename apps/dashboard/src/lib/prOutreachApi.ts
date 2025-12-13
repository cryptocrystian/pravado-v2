/**
 * PR Outreach API Client (Sprint S44)
 * Frontend helper for automated journalist outreach
 *
 * S99 Fix: Use centralized API config with auth
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
import { API_BASE_URL } from './apiConfig';
import { supabase } from '@/lib/supabaseClient';

// Helper for authenticated fetch
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });
}

// =============================================
// Sequences
// =============================================

export async function createOutreachSequence(
  input: CreateOutreachSequenceInput
): Promise<OutreachSequence> {
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/sequences`, {
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

  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/sequences?${query.toString()}`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/sequences/${id}`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/sequences/${id}/with-steps`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/sequences/${id}`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/sequences/${id}`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/sequences/${sequenceId}/steps`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/steps/${id}`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/steps/${id}`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/sequences/${sequenceId}/start`, {
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

  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/runs?${query.toString()}`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/runs/${id}`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/runs/${id}`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/runs/${id}/stop`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/runs/${id}/advance`, {
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
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/events`, {
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

  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/events?${query.toString()}`, {
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
  const response = await authFetch(
    `${API_BASE_URL}/api/v1/pr-outreach/sequences/${sequenceId}/preview-targeting`,
    {
      method: 'GET',
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

  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/stats?${query.toString()}`, {
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

// =============================================
// S98: Direct Email Sending
// =============================================

export interface SendPitchInput {
  journalistId: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  pitchId?: string;
  articleId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendPitchResponse {
  success: boolean;
  messageId: string | null;
  provider: string;
  sentAt: Date | null;
  error?: string;
  journalist: {
    id: string;
    name: string;
    email: string;
    outlet: string | null;
  };
}

export async function sendPitch(input: SendPitchInput): Promise<SendPitchResponse> {
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/send-pitch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to send pitch');
  }

  const result = await response.json();
  return result.data;
}

export interface JournalistOutreachHistory {
  messages: Array<{
    id: string;
    subject: string;
    sentAt: Date | null;
    openedAt: Date | null;
    clickedAt: Date | null;
    repliedAt: Date | null;
    sendStatus: string;
  }>;
  total: number;
  engagement: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalReplied: number;
    engagementScore: number;
  } | null;
}

export async function getJournalistOutreachHistory(
  journalistId: string
): Promise<JournalistOutreachHistory> {
  const response = await authFetch(
    `${API_BASE_URL}/api/v1/pr-outreach/journalist/${journalistId}/history`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to get journalist history');
  }

  const result = await response.json();
  return result.data;
}

// =============================================
// S98: AI Draft Generation
// =============================================

export interface GenerateDraftInput {
  journalistId: string;
  action: 'pitch' | 'respond' | 'follow-up';
  topic?: string;
  angle?: string;
  coverageTitle?: string;
  coverageSummary?: string;
}

export interface GeneratedDraft {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  reasoning: string;
  generatedAt: Date;
  journalist: {
    id: string;
    name: string;
    email: string;
    outlet: string | null;
  };
}

export async function generateDraft(input: GenerateDraftInput): Promise<GeneratedDraft> {
  const response = await authFetch(`${API_BASE_URL}/api/v1/pr-outreach/generate-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.error?.message || 'Failed to generate draft');
  }

  const result = await response.json();
  return result.data;
}
