/**
 * Crisis Response API Client (Sprint S55)
 *
 * Type-safe client functions for crisis detection, incident management,
 * escalation rules, action recommendations, and crisis briefings.
 */

import type {
  CrisisIncident,
  CrisisSignal,
  CrisisAction,
  CrisisBrief,
  CrisisBriefSection,
  CrisisEscalationRule,
  CrisisDashboardStats,
  CrisisSeverity,
  CrisisTrajectory,
  CrisisPropagationLevel,
  CrisisBriefFormat,
  CrisisActionType,
  CrisisActionStatus,
  IncidentStatus,
  CrisisUrgency,
  CreateIncidentRequest,
  UpdateIncidentRequest,
  CreateActionRequest,
  UpdateActionRequest,
  CreateEscalationRuleRequest,
  UpdateEscalationRuleRequest,
  GenerateCrisisBriefRequest,
  RegenerateSectionRequest,
  UpdateSectionRequest,
  TriggerDetectionRequest,
  IncidentFilters,
  SignalFilters,
  ActionFilters,
  BriefFilters,
  GetIncidentsResponse,
  GetSignalsResponse,
  GetActionsResponse,
  GetBriefsResponse,
  DetectionResultResponse,
  BriefGenerationResponse,
  SectionRegenerationResponse,
} from '@pravado/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/crisis';

// ============================================================================
// GENERIC API CLIENT
// ============================================================================

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'x-org-id': typeof window !== 'undefined' ? localStorage.getItem('orgId') || '' : '',
    'x-user-id': typeof window !== 'undefined' ? localStorage.getItem('userId') || '' : '',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `API error: ${response.status}`);
  }

  return result;
}

function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        query.append(key, value.join(','));
      } else if (value instanceof Date) {
        query.append(key, value.toISOString());
      } else {
        query.append(key, String(value));
      }
    }
  });

  return query.toString();
}

// ============================================================================
// DASHBOARD API
// ============================================================================

export async function getDashboardStats(): Promise<CrisisDashboardStats> {
  const result = await apiClient<CrisisDashboardStats>('/dashboard');
  return result.data!;
}

// ============================================================================
// INCIDENT API
// ============================================================================

export async function createIncident(data: CreateIncidentRequest): Promise<CrisisIncident> {
  const result = await apiClient<CrisisIncident>('/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function getIncidents(
  filters?: IncidentFilters,
  limit: number = 20,
  offset: number = 0
): Promise<GetIncidentsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<GetIncidentsResponse>(`/incidents?${query}`);
  return result.data!;
}

export async function getIncident(id: string): Promise<CrisisIncident> {
  const result = await apiClient<CrisisIncident>(`/incidents/${id}`);
  return result.data!;
}

export async function updateIncident(
  id: string,
  data: UpdateIncidentRequest
): Promise<CrisisIncident> {
  const result = await apiClient<CrisisIncident>(`/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function closeIncident(
  id: string,
  resolutionNotes?: string
): Promise<CrisisIncident> {
  const result = await apiClient<CrisisIncident>(`/incidents/${id}/close`, {
    method: 'POST',
    body: JSON.stringify({ resolutionNotes }),
  });
  return result.data!;
}

export async function escalateIncident(
  id: string,
  level: number
): Promise<CrisisIncident> {
  const result = await apiClient<CrisisIncident>(`/incidents/${id}/escalate`, {
    method: 'POST',
    body: JSON.stringify({ level }),
  });
  return result.data!;
}

export async function generateRecommendations(
  incidentId: string
): Promise<CrisisAction[]> {
  const result = await apiClient<CrisisAction[]>(`/incidents/${incidentId}/recommendations`, {
    method: 'POST',
  });
  return result.data!;
}

// ============================================================================
// SIGNAL API
// ============================================================================

export async function getSignals(
  filters?: SignalFilters,
  limit: number = 20,
  offset: number = 0
): Promise<GetSignalsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<GetSignalsResponse>(`/signals?${query}`);
  return result.data!;
}

export async function acknowledgeSignal(
  id: string,
  linkedIncidentId?: string,
  resolutionNotes?: string
): Promise<CrisisSignal> {
  const result = await apiClient<CrisisSignal>(`/signals/${id}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify({ linkedIncidentId, resolutionNotes }),
  });
  return result.data!;
}

// ============================================================================
// DETECTION API
// ============================================================================

export async function runDetection(
  options?: TriggerDetectionRequest
): Promise<DetectionResultResponse> {
  const result = await apiClient<DetectionResultResponse>('/detection/run', {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
  return result.data!;
}

// ============================================================================
// ACTION API
// ============================================================================

export async function createAction(data: CreateActionRequest): Promise<CrisisAction> {
  const result = await apiClient<CrisisAction>('/actions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function getActions(
  filters?: ActionFilters,
  limit: number = 20,
  offset: number = 0
): Promise<GetActionsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<GetActionsResponse>(`/actions?${query}`);
  return result.data!;
}

export async function updateAction(
  id: string,
  data: UpdateActionRequest
): Promise<CrisisAction> {
  const result = await apiClient<CrisisAction>(`/actions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function approveAction(id: string): Promise<CrisisAction> {
  return updateAction(id, { status: 'approved' as CrisisActionStatus });
}

export async function startAction(id: string): Promise<CrisisAction> {
  return updateAction(id, { status: 'in_progress' as CrisisActionStatus });
}

export async function completeAction(
  id: string,
  completionNotes?: string,
  outcome?: 'success' | 'partial' | 'failed'
): Promise<CrisisAction> {
  return updateAction(id, {
    status: 'completed' as CrisisActionStatus,
    completionNotes,
    outcome,
  });
}

// ============================================================================
// BRIEF API
// ============================================================================

export async function generateBrief(
  incidentId: string,
  options?: GenerateCrisisBriefRequest
): Promise<BriefGenerationResponse> {
  const result = await apiClient<BriefGenerationResponse>(`/incidents/${incidentId}/briefs`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
  return result.data!;
}

export async function getCurrentBrief(incidentId: string): Promise<CrisisBrief | null> {
  try {
    const result = await apiClient<CrisisBrief>(`/incidents/${incidentId}/briefs/current`);
    return result.data || null;
  } catch {
    return null;
  }
}

export async function getBriefs(
  filters?: BriefFilters,
  limit: number = 20,
  offset: number = 0
): Promise<GetBriefsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<GetBriefsResponse>(`/briefs?${query}`);
  return result.data!;
}

export async function regenerateSection(
  briefId: string,
  sectionId: string,
  options?: RegenerateSectionRequest
): Promise<SectionRegenerationResponse> {
  const result = await apiClient<SectionRegenerationResponse>(
    `/briefs/${briefId}/sections/${sectionId}/regenerate`,
    {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }
  );
  return result.data!;
}

export async function updateSection(
  briefId: string,
  sectionId: string,
  data: UpdateSectionRequest
): Promise<CrisisBriefSection> {
  const result = await apiClient<CrisisBriefSection>(
    `/briefs/${briefId}/sections/${sectionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
  return result.data!;
}

// ============================================================================
// ESCALATION RULE API
// ============================================================================

export async function createRule(data: CreateEscalationRuleRequest): Promise<CrisisEscalationRule> {
  const result = await apiClient<CrisisEscalationRule>('/rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function getRules(
  isActive?: boolean,
  limit: number = 50,
  offset: number = 0
): Promise<{ rules: CrisisEscalationRule[]; total: number }> {
  const query = buildQueryString({ isActive, limit, offset });
  const result = await apiClient<{ rules: CrisisEscalationRule[]; total: number }>(`/rules?${query}`);
  return result.data!;
}

export async function updateRule(
  id: string,
  data: UpdateEscalationRuleRequest
): Promise<CrisisEscalationRule> {
  const result = await apiClient<CrisisEscalationRule>(`/rules/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function toggleRule(id: string, isActive: boolean): Promise<CrisisEscalationRule> {
  return updateRule(id, { isActive });
}

export async function deleteRule(id: string): Promise<void> {
  await apiClient(`/rules/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

export const SEVERITY_COLORS: Record<CrisisSeverity, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  severe: { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-500' },
};

export const TRAJECTORY_COLORS: Record<CrisisTrajectory, { bg: string; text: string }> = {
  improving: { bg: 'bg-green-100', text: 'text-green-800' },
  stable: { bg: 'bg-blue-100', text: 'text-blue-800' },
  worsening: { bg: 'bg-orange-100', text: 'text-orange-800' },
  critical: { bg: 'bg-red-100', text: 'text-red-800' },
  resolved: { bg: 'bg-gray-100', text: 'text-gray-700' },
  unknown: { bg: 'bg-gray-100', text: 'text-gray-500' },
};

export const PROPAGATION_COLORS: Record<CrisisPropagationLevel, { bg: string; text: string }> = {
  contained: { bg: 'bg-green-100', text: 'text-green-800' },
  spreading: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  viral: { bg: 'bg-orange-100', text: 'text-orange-800' },
  mainstream: { bg: 'bg-red-100', text: 'text-red-800' },
  saturated: { bg: 'bg-red-200', text: 'text-red-900' },
};

export const STATUS_COLORS: Record<IncidentStatus, { bg: string; text: string }> = {
  active: { bg: 'bg-red-100', text: 'text-red-800' },
  contained: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export const ACTION_STATUS_COLORS: Record<CrisisActionStatus, { bg: string; text: string }> = {
  recommended: { bg: 'bg-blue-100', text: 'text-blue-800' },
  approved: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  completed: { bg: 'bg-green-100', text: 'text-green-800' },
  deferred: { bg: 'bg-gray-100', text: 'text-gray-600' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  failed: { bg: 'bg-red-200', text: 'text-red-900' },
};

export const URGENCY_LABELS: Record<CrisisUrgency, string> = {
  immediate: 'Immediate',
  urgent: 'Urgent',
  normal: 'Normal',
  low: 'Low Priority',
};

export const BRIEF_FORMAT_LABELS: Record<CrisisBriefFormat, string> = {
  executive_summary: 'Executive Summary',
  full_brief: 'Full Brief',
  situation_report: 'Situation Report',
  stakeholder_brief: 'Stakeholder Brief',
  media_response: 'Media Response',
  legal_brief: 'Legal Brief',
};

export const ACTION_TYPE_LABELS: Record<CrisisActionType, string> = {
  statement_release: 'Issue Statement',
  media_outreach: 'Media Outreach',
  social_response: 'Social Response',
  internal_comms: 'Internal Comms',
  stakeholder_briefing: 'Stakeholder Briefing',
  legal_review: 'Legal Review',
  executive_escalation: 'Executive Escalation',
  monitoring_increase: 'Increase Monitoring',
  content_creation: 'Content Creation',
  press_conference: 'Press Conference',
  interview_prep: 'Interview Prep',
  fact_check: 'Fact Check',
  third_party_outreach: '3rd Party Outreach',
  no_comment: 'No Comment',
  other: 'Other',
};

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

export function getSeverityIcon(severity: CrisisSeverity): string {
  switch (severity) {
    case 'severe':
      return '!!';
    case 'critical':
      return '!';
    case 'high':
      return '3';
    case 'medium':
      return '2';
    case 'low':
      return '1';
    default:
      return '-';
  }
}

export function getTrajectoryIcon(trajectory: CrisisTrajectory): string {
  switch (trajectory) {
    case 'improving':
      return 'arrow-down';
    case 'stable':
      return 'minus';
    case 'worsening':
      return 'arrow-up';
    case 'critical':
      return 'alert-triangle';
    case 'resolved':
      return 'check';
    default:
      return 'help-circle';
  }
}

export function calculateUrgencyFromDue(dueAt: Date | string | undefined): CrisisUrgency {
  if (!dueAt) return 'normal';

  const now = new Date();
  const due = typeof dueAt === 'string' ? new Date(dueAt) : dueAt;
  const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilDue < 0) return 'immediate'; // Past due
  if (hoursUntilDue < 4) return 'immediate';
  if (hoursUntilDue < 24) return 'urgent';
  if (hoursUntilDue < 72) return 'normal';
  return 'low';
}
