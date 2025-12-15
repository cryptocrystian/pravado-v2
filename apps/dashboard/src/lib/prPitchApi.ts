/**
 * PR Pitch API Helper (Sprint S100.1)
 * Client-side API functions for PR pitch and outreach sequences
 *
 * S100.1 Fix: ALL calls go through internal /api/pr/* routes only
 * NO direct calls to external APIs from client components
 */

import type {
  AttachContactsInput,
  CreatePRPitchSequenceInput,
  GeneratedPitchPreview,
  GeneratePitchPreviewInput,
  ListPRPitchContactsQuery,
  ListPRPitchSequencesQuery,
  PRPitchContact,
  PRPitchContactListResponse,
  PRPitchContactWithJournalist,
  PRPitchSequenceListResponse,
  PRPitchSequenceWithSteps,
  UpdatePRPitchSequenceInput,
} from '@pravado/types';

// ============================================================================
// API Error Handling
// ============================================================================

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Fetch via internal route handlers ONLY
 * S100.1 invariant: NO direct calls to staging API
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // S100.1: Use internal route handlers only (same-origin)
  const url = endpoint;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'API request failed');
  }

  return json.data as T;
}

// ============================================================================
// Sequence Management
// ============================================================================

/**
 * Create a new pitch sequence
 */
export async function createPitchSequence(
  input: CreatePRPitchSequenceInput
): Promise<PRPitchSequenceWithSteps> {
  const data = await fetchApi<{ sequence: PRPitchSequenceWithSteps }>(
    '/api/pr/pitches/sequences',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return data.sequence;
}

/**
 * List pitch sequences
 */
export async function listPitchSequences(
  params?: ListPRPitchSequencesQuery
): Promise<PRPitchSequenceListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    if (Array.isArray(params.status)) {
      params.status.forEach((s) => searchParams.append('status', s));
    } else {
      searchParams.append('status', params.status);
    }
  }
  if (params?.pressReleaseId) searchParams.append('pressReleaseId', params.pressReleaseId);
  if (params?.search) searchParams.append('search', params.search);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  const endpoint = `/api/pr/pitches/sequences${query ? `?${query}` : ''}`;

  return fetchApi<PRPitchSequenceListResponse>(endpoint);
}

/**
 * Get a pitch sequence with steps and stats
 */
export async function getPitchSequence(id: string): Promise<PRPitchSequenceWithSteps> {
  const data = await fetchApi<{ sequence: PRPitchSequenceWithSteps }>(
    `/api/pr/pitches/sequences/${id}`
  );
  return data.sequence;
}

/**
 * Update a pitch sequence
 */
export async function updatePitchSequence(
  id: string,
  input: UpdatePRPitchSequenceInput
): Promise<PRPitchSequenceWithSteps> {
  const data = await fetchApi<{ sequence: PRPitchSequenceWithSteps }>(
    `/api/pr/pitches/sequences/${id}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    }
  );
  return data.sequence;
}

/**
 * Delete (archive) a pitch sequence
 */
export async function deletePitchSequence(id: string): Promise<void> {
  await fetchApi<{ message: string }>(`/api/pr/pitches/sequences/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Contact Management
// ============================================================================

/**
 * Attach journalists to a sequence
 */
export async function attachContactsToSequence(
  sequenceId: string,
  journalistIds: string[]
): Promise<{ contacts: PRPitchContact[]; added: number }> {
  return fetchApi<{ contacts: PRPitchContact[]; added: number }>(
    `/api/pr/pitches/sequences/${sequenceId}/contacts`,
    {
      method: 'POST',
      body: JSON.stringify({ journalistIds } as AttachContactsInput),
    }
  );
}

/**
 * List contacts in a sequence
 */
export async function listSequenceContacts(
  sequenceId: string,
  params?: ListPRPitchContactsQuery
): Promise<PRPitchContactListResponse> {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    if (Array.isArray(params.status)) {
      params.status.forEach((s) => searchParams.append('status', s));
    } else {
      searchParams.append('status', params.status);
    }
  }
  if (params?.search) searchParams.append('search', params.search);
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.offset) searchParams.append('offset', params.offset.toString());
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);

  const query = searchParams.toString();
  const endpoint = `/api/pr/pitches/sequences/${sequenceId}/contacts${query ? `?${query}` : ''}`;

  return fetchApi<PRPitchContactListResponse>(endpoint);
}

/**
 * Get a contact with events
 */
export async function getContact(contactId: string): Promise<PRPitchContactWithJournalist> {
  const data = await fetchApi<{ contact: PRPitchContactWithJournalist }>(
    `/api/pr/pitches/contacts/${contactId}`
  );
  return data.contact;
}

// ============================================================================
// Pitch Generation
// ============================================================================

/**
 * Generate a pitch preview
 */
export async function generatePitchPreview(
  input: GeneratePitchPreviewInput
): Promise<GeneratedPitchPreview> {
  const data = await fetchApi<{ preview: GeneratedPitchPreview }>(
    '/api/pr/pitches/preview',
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return data.preview;
}

/**
 * Queue a pitch for a contact
 */
export async function queuePitchForContact(contactId: string): Promise<PRPitchContact> {
  const data = await fetchApi<{ contact: PRPitchContact }>(
    `/api/pr/pitches/contacts/${contactId}/queue`,
    {
      method: 'POST',
    }
  );
  return data.contact;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format contact status for display
 */
export function formatContactStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    queued: 'Queued',
    sending: 'Sending',
    sent: 'Sent',
    opened: 'Opened',
    replied: 'Replied',
    bounced: 'Bounced',
    opted_out: 'Opted Out',
    failed: 'Failed',
  };
  return statusLabels[status] || status;
}

/**
 * Format sequence status for display
 */
export function formatSequenceStatus(status: string): string {
  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    archived: 'Archived',
  };
  return statusLabels[status] || status;
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    queued: 'bg-gray-100 text-gray-800',
    sending: 'bg-blue-100 text-blue-800',
    sent: 'bg-green-100 text-green-800',
    opened: 'bg-purple-100 text-purple-800',
    replied: 'bg-emerald-100 text-emerald-800',
    bounced: 'bg-orange-100 text-orange-800',
    opted_out: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    archived: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}
