/**
 * PR Data Server - Canonical Server Auth Execution Layer
 * Sprint S99.2: The ONE canonical path for PR pillar backend API calls
 *
 * RULES:
 * - This module is server-only (import 'server-only')
 * - All PR pages MUST use this module for backend API calls
 * - Never call backend API directly from components
 * - Token missing = hard error, not silent failure
 */

import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getApiBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    // In production, this is a critical misconfiguration
    console.error('[prDataServer] CRITICAL: NEXT_PUBLIC_API_URL is not set');
    throw new Error('API_URL_MISSING: NEXT_PUBLIC_API_URL environment variable is not configured');
  }
  return apiUrl;
}

const API_BASE_URL = getApiBaseUrl();

// ============================================================================
// Debug Logging
// ============================================================================

const DEBUG_AUTH = process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true';

function debugLog(message: string, data?: Record<string, unknown>) {
  if (DEBUG_AUTH) {
    console.log(`[prDataServer] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
}

// ============================================================================
// Server Supabase Client & Token Extraction
// ============================================================================

/**
 * Create a Supabase server client in the current request scope.
 * Reads auth cookies from the incoming request.
 */
async function createRequestScopedSupabaseClient() {
  const cookieStore = await cookies();

  debugLog('Creating request-scoped Supabase client', {
    cookieCount: cookieStore.getAll().length,
    hasSbCookies: cookieStore.getAll().some(c => c.name.includes('sb-')),
  });

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server components are read-only for cookies
      },
    },
  });
}

/**
 * Get the access token from the server-side Supabase session.
 * Throws AUTH_MISSING error if no token is available.
 */
export async function getServerAccessToken(): Promise<string> {
  const supabase = await createRequestScopedSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  debugLog('Session check', {
    hasSession: !!session,
    tokenPresent: !!session?.access_token,
    tokenLength: session?.access_token?.length || 0,
    error: error?.message,
  });

  if (error) {
    console.error('[prDataServer] Supabase session error:', error.message);
    throw new Error(`AUTH_SESSION_ERROR: ${error.message}`);
  }

  if (!session?.access_token) {
    console.error('[prDataServer] No access token in session');
    throw new Error('AUTH_MISSING: No Supabase access token available in server request context');
  }

  return session.access_token;
}

// ============================================================================
// Authenticated API Fetch
// ============================================================================

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
 * Make an authenticated fetch to the backend API.
 * This is the ONLY way PR data should be fetched from the backend.
 *
 * @param path - API endpoint path (e.g., '/api/v1/journalist-graph/profiles')
 * @param init - Optional fetch init options
 * @returns Parsed response data
 * @throws Error if auth is missing or request fails
 */
export async function authedApiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await getServerAccessToken();

  const url = `${API_BASE_URL}${path}`;

  debugLog('Making authenticated request', {
    url,
    method: init.method || 'GET',
    API_BASE_URL,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(init.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...init,
    headers,
    // No credentials needed - we're using Authorization header
  });

  debugLog('Response received', {
    status: response.status,
    ok: response.ok,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const errorMessage = errorBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    console.error('[prDataServer] API request failed:', { url, status: response.status, error: errorMessage });
    throw new Error(`API_ERROR: ${errorMessage}`);
  }

  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    const errorMessage = result.error?.message || 'Unknown API error';
    console.error('[prDataServer] API returned error:', { url, error: result.error });
    throw new Error(`API_ERROR: ${errorMessage}`);
  }

  return result.data as T;
}

// ============================================================================
// PR-Specific Data Fetchers
// ============================================================================

// --- Journalist Graph ---

export interface JournalistProfile {
  id: string;
  fullName: string;
  primaryEmail: string;
  secondaryEmails: string[];
  primaryOutlet: string | null;
  beat: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  engagementScore: number;
  responsivenessScore: number;
  relevanceScore: number;
  lastActivityAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface JournalistProfilesResponse {
  profiles: JournalistProfile[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListJournalistProfilesParams {
  q?: string;
  outlet?: string;
  beat?: string;
  minEngagementScore?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export async function fetchJournalistProfiles(
  params: ListJournalistProfilesParams = {}
): Promise<JournalistProfilesResponse> {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.outlet) query.set('outlet', params.outlet);
  if (params.beat) query.set('beat', params.beat);
  if (params.minEngagementScore !== undefined) query.set('minEngagementScore', String(params.minEngagementScore));
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));

  const queryString = query.toString();
  const path = `/api/v1/journalist-graph/profiles${queryString ? `?${queryString}` : ''}`;

  return authedApiFetch<JournalistProfilesResponse>(path);
}

export async function fetchJournalistProfile(id: string): Promise<JournalistProfile> {
  const response = await authedApiFetch<{ profile: JournalistProfile }>(
    `/api/v1/journalist-graph/profiles/${id}`
  );
  return response.profile;
}

// --- Press Releases ---

export interface PressRelease {
  id: string;
  headline: string;
  subHeadline: string | null;
  body: string;
  boilerplate: string | null;
  status: string;
  seoScore: number | null;
  readabilityScore: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PressReleasesResponse {
  releases: PressRelease[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchPressReleases(params: { limit?: number; offset?: number } = {}): Promise<PressReleasesResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));

  const queryString = query.toString();
  const path = `/api/v1/pr/releases${queryString ? `?${queryString}` : ''}`;

  return authedApiFetch<PressReleasesResponse>(path);
}

export async function fetchPressRelease(id: string): Promise<{ release: PressRelease }> {
  return authedApiFetch<{ release: PressRelease }>(`/api/v1/pr/releases/${id}`);
}

// --- Deliverability ---

export interface DeliverabilitySummary {
  totalMessages: number;
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalComplained: number;
  totalFailed: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export interface EmailMessage {
  id: string;
  subject: string;
  sendStatus: string;
  sentAt: string | null;
  openedAt: string | null;
  clickedAt: string | null;
}

export interface EmailMessagesResponse {
  messages: EmailMessage[];
  total: number;
}

export interface JournalistEngagement {
  id: string;
  journalistId: string;
  journalist: {
    name: string;
    email: string;
  };
  engagementScore: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  bounceRate: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  totalBounced: number;
}

export interface EngagementMetricsResponse {
  metrics: JournalistEngagement[];
  total: number;
}

export async function fetchDeliverabilitySummary(): Promise<DeliverabilitySummary> {
  return authedApiFetch<DeliverabilitySummary>('/api/v1/pr-outreach-deliverability/stats/deliverability');
}

export async function fetchEmailMessages(params: { limit?: number; offset?: number } = {}): Promise<EmailMessagesResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));

  const queryString = query.toString();
  return authedApiFetch<EmailMessagesResponse>(`/api/v1/pr-outreach-deliverability/messages${queryString ? `?${queryString}` : ''}`);
}

export async function fetchEngagementMetrics(params: { limit?: number; offset?: number } = {}): Promise<EngagementMetricsResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));

  const queryString = query.toString();
  return authedApiFetch<EngagementMetricsResponse>(`/api/v1/pr-outreach-deliverability/engagement${queryString ? `?${queryString}` : ''}`);
}

export async function fetchTopEngagedJournalists(limit: number = 10): Promise<JournalistEngagement[]> {
  const query = new URLSearchParams();
  query.set('limit', String(limit));

  return authedApiFetch<JournalistEngagement[]>(`/api/v1/pr-outreach-deliverability/stats/top-engaged?${query.toString()}`);
}

// --- Outreach Sequences ---

export interface OutreachSequence {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  stats?: {
    totalContacts: number;
    queuedCount: number;
    sentCount: number;
    openedCount: number;
    repliedCount: number;
    bouncedCount: number;
    failedCount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface OutreachSequencesResponse {
  sequences: OutreachSequence[];
  total: number;
}

export async function fetchOutreachSequences(params: { limit?: number; offset?: number } = {}): Promise<OutreachSequencesResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));

  const queryString = query.toString();
  return authedApiFetch<OutreachSequencesResponse>(`/api/v1/pr-outreach/sequences${queryString ? `?${queryString}` : ''}`);
}

export async function fetchOutreachStats(sequenceId?: string): Promise<Record<string, unknown>> {
  const query = new URLSearchParams();
  if (sequenceId) query.set('sequenceId', sequenceId);

  const queryString = query.toString();
  return authedApiFetch<Record<string, unknown>>(`/api/v1/pr-outreach/stats${queryString ? `?${queryString}` : ''}`);
}
