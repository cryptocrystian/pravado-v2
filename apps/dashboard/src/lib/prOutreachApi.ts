/**
 * PR Outreach API Client (Sprint S44)
 * Frontend helper for automated journalist outreach
 *
 * S100.1 Fix: Use internal route handlers only (same-origin)
 * Browser calls ONLY /api/pr/* - NO direct staging API calls
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

// S100.1: Internal route helper - browser calls same-origin only
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error?.error?.message || error?.error || 'Request failed');
  }

  const result = await response.json();
  return result.data !== undefined ? result.data : result;
}

// =============================================
// Sequences
// =============================================

export async function createOutreachSequence(
  input: CreateOutreachSequenceInput
): Promise<OutreachSequence> {
  return fetchApi<OutreachSequence>('/api/pr/outreach/sequences', {
    method: 'POST',
    body: JSON.stringify(input),
  });
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

  const queryString = query.toString();
  return fetchApi<OutreachSequenceListResponse>(
    `/api/pr/outreach/sequences${queryString ? `?${queryString}` : ''}`
  );
}

export async function getOutreachSequence(id: string): Promise<OutreachSequence> {
  return fetchApi<OutreachSequence>(`/api/pr/outreach/sequences/${id}`);
}

export async function getOutreachSequenceWithSteps(id: string): Promise<OutreachSequenceWithSteps> {
  return fetchApi<OutreachSequenceWithSteps>(`/api/pr/outreach/sequences/${id}/with-steps`);
}

export async function updateOutreachSequence(
  id: string,
  input: UpdateOutreachSequenceInput
): Promise<OutreachSequence> {
  return fetchApi<OutreachSequence>(`/api/pr/outreach/sequences/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteOutreachSequence(id: string): Promise<void> {
  await fetchApi<void>(`/api/pr/outreach/sequences/${id}`, {
    method: 'DELETE',
  });
}

// =============================================
// Steps
// =============================================

export async function createOutreachStep(
  sequenceId: string,
  input: CreateOutreachStepInput
): Promise<OutreachSequenceStep> {
  return fetchApi<OutreachSequenceStep>(`/api/pr/outreach/sequences/${sequenceId}/steps`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateOutreachStep(
  id: string,
  input: UpdateOutreachStepInput
): Promise<OutreachSequenceStep> {
  return fetchApi<OutreachSequenceStep>(`/api/pr/outreach/steps/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteOutreachStep(id: string): Promise<void> {
  await fetchApi<void>(`/api/pr/outreach/steps/${id}`, {
    method: 'DELETE',
  });
}

// =============================================
// Runs
// =============================================

export async function startSequenceRuns(
  sequenceId: string,
  input: Omit<StartSequenceRunsInput, 'sequenceId'>
): Promise<{ runsCreated: number; runs: OutreachRun[]; skippedJournalists: string[] }> {
  return fetchApi<{ runsCreated: number; runs: OutreachRun[]; skippedJournalists: string[] }>(
    `/api/pr/outreach/sequences/${sequenceId}/start`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
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

  const queryString = query.toString();
  return fetchApi<OutreachRunListResponse>(
    `/api/pr/outreach/runs${queryString ? `?${queryString}` : ''}`
  );
}

export async function getOutreachRun(id: string): Promise<OutreachRunWithDetails> {
  return fetchApi<OutreachRunWithDetails>(`/api/pr/outreach/runs/${id}`);
}

export async function updateOutreachRun(
  id: string,
  input: UpdateOutreachRunInput
): Promise<OutreachRun> {
  return fetchApi<OutreachRun>(`/api/pr/outreach/runs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function stopOutreachRun(
  id: string,
  reason: OutreachStopReason
): Promise<OutreachRun> {
  return fetchApi<OutreachRun>(`/api/pr/outreach/runs/${id}/stop`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function advanceOutreachRun(
  id: string,
  forceAdvance: boolean = false
): Promise<OutreachRun> {
  return fetchApi<OutreachRun>(`/api/pr/outreach/runs/${id}/advance`, {
    method: 'POST',
    body: JSON.stringify({ forceAdvance }),
  });
}

// =============================================
// Events
// =============================================

export async function createOutreachEvent(input: CreateOutreachEventInput): Promise<OutreachEvent> {
  return fetchApi<OutreachEvent>('/api/pr/outreach/events', {
    method: 'POST',
    body: JSON.stringify(input),
  });
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

  const queryString = query.toString();
  return fetchApi<OutreachEventListResponse>(
    `/api/pr/outreach/events${queryString ? `?${queryString}` : ''}`
  );
}

// =============================================
// Targeting & Stats
// =============================================

export async function previewTargeting(sequenceId: string): Promise<TargetingPreview> {
  return fetchApi<TargetingPreview>(
    `/api/pr/outreach/sequences/${sequenceId}/preview-targeting`
  );
}

export async function getOutreachStats(sequenceId?: string): Promise<OutreachStats> {
  const query = new URLSearchParams();
  if (sequenceId) query.append('sequenceId', sequenceId);

  const queryString = query.toString();
  return fetchApi<OutreachStats>(
    `/api/pr/outreach/stats${queryString ? `?${queryString}` : ''}`
  );
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
  return fetchApi<SendPitchResponse>('/api/pr/outreach/send-pitch', {
    method: 'POST',
    body: JSON.stringify(input),
  });
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
  return fetchApi<JournalistOutreachHistory>(
    `/api/pr/outreach/journalist/${journalistId}/history`
  );
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
  return fetchApi<GeneratedDraft>('/api/pr/outreach/generate-draft', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
