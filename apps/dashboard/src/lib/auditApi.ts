/**
 * Audit API Client (Sprint S35 + S36)
 * Frontend API layer for audit log viewing, querying, and exports
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Client-side API request (for use in client components)
 * Uses credentials: 'include' to automatically send cookies
 */
async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Automatically sends cookies
  });

  return response.json();
}

// Type definitions matching backend
export type ActorType = 'user' | 'system' | 'agent';
export type AuditSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AuditEventType = string; // Using string for flexibility

export interface AuditLogEntry {
  id: string;
  orgId: string;
  userId: string | null;
  actorType: ActorType;
  eventType: AuditEventType;
  severity: AuditSeverity;
  context: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditQueryResult {
  entries: AuditLogEntry[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface AuditQueryFilters {
  eventType?: string | string[];
  severity?: AuditSeverity | AuditSeverity[];
  actorType?: ActorType | ActorType[];
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface AuditEventTypeMetadata {
  type: string;
  category: string;
  description: string;
  defaultSeverity: AuditSeverity;
  requiresUserContext: boolean;
}

export interface AuditEventTypesResponse {
  eventTypes: AuditEventTypeMetadata[];
  categories: string[];
}

export interface AuditStats {
  totalEvents: number;
  bySeverity: Record<AuditSeverity, number>;
  byCategory: Record<string, number>;
  recentCritical: AuditLogEntry[];
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(
  filters: AuditQueryFilters = {}
): Promise<AuditQueryResult> {
  const params = new URLSearchParams();

  if (filters.eventType) {
    params.set('eventType', Array.isArray(filters.eventType)
      ? filters.eventType.join(',')
      : filters.eventType);
  }
  if (filters.severity) {
    params.set('severity', Array.isArray(filters.severity)
      ? filters.severity.join(',')
      : filters.severity);
  }
  if (filters.actorType) {
    params.set('actorType', Array.isArray(filters.actorType)
      ? filters.actorType.join(',')
      : filters.actorType);
  }
  if (filters.userId) params.set('userId', filters.userId);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.search) params.set('search', filters.search);
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.offset) params.set('offset', String(filters.offset));
  if (filters.cursor) params.set('cursor', filters.cursor);

  const queryString = params.toString();
  const path = `/api/v1/audit${queryString ? `?${queryString}` : ''}`;

  const response = await apiRequest<AuditQueryResult>(path);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch audit logs');
  }

  return response.data;
}

/**
 * Get a single audit log entry
 */
export async function getAuditEntry(id: string): Promise<AuditLogEntry> {
  const response = await apiRequest<AuditLogEntry>(`/api/v1/audit/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch audit entry');
  }

  return response.data;
}

/**
 * Get available event types and categories
 */
export async function getAuditEventTypes(
  category?: string
): Promise<AuditEventTypesResponse> {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  const response = await apiRequest<AuditEventTypesResponse>(
    `/api/v1/audit/events${params}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch event types');
  }

  return response.data;
}

/**
 * Get audit statistics
 */
export async function getAuditStats(days: number = 30): Promise<AuditStats> {
  const response = await apiRequest<AuditStats>(
    `/api/v1/audit/stats?days=${days}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to fetch audit stats');
  }

  return response.data;
}

/**
 * Helper function to format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Helper function to get severity color
 */
export function getSeverityColor(severity: AuditSeverity): string {
  switch (severity) {
    case 'info': return 'blue';
    case 'warning': return 'yellow';
    case 'error': return 'red';
    case 'critical': return 'purple';
    default: return 'gray';
  }
}

/**
 * Helper function to get category icon
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    auth: 'key',
    user: 'user',
    billing: 'credit-card',
    llm: 'cpu',
    playbook: 'play',
    pr: 'newspaper',
    seo: 'search',
    content: 'file-text',
    system: 'server',
    admin: 'shield',
  };

  return icons[category] || 'circle';
}

/**
 * Helper function to format event type for display
 */
export function formatEventType(eventType: string): string {
  const [_category, action] = eventType.split('.');
  const formattedAction = action
    ?.replace(/_/g, ' ')
    ?.replace(/\b\w/g, (c) => c.toUpperCase());

  return formattedAction || eventType;
}

/**
 * Helper function to get actor type display name
 */
export function getActorTypeDisplay(actorType: ActorType): string {
  switch (actorType) {
    case 'user': return 'User';
    case 'system': return 'System';
    case 'agent': return 'AI Agent';
    default: return actorType;
  }
}

// ===== Sprint S36: Export API =====

export type AuditExportStatus = 'queued' | 'processing' | 'success' | 'failed';

export interface AuditExportJob {
  id: string;
  orgId: string;
  userId: string;
  status: AuditExportStatus;
  filters: AuditQueryFilters;
  filePath?: string | null;
  fileSizeBytes?: number | null;
  rowCount?: number | null;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export interface CreateExportResponse {
  jobId: string;
  status: AuditExportStatus;
}

export interface ExportStatusResponse {
  job: AuditExportJob;
  downloadUrl: string | null;
}

export interface ListExportsResponse {
  exports: AuditExportJob[];
}

/**
 * Create an audit export job
 */
export async function createAuditExport(
  filters: AuditQueryFilters = {}
): Promise<CreateExportResponse> {
  const response = await apiRequest<CreateExportResponse>('/api/v1/audit/export', {
    method: 'POST',
    body: JSON.stringify({ filters }),
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to create export job');
  }

  return response.data;
}

/**
 * Get export job status
 */
export async function getExportStatus(jobId: string): Promise<ExportStatusResponse> {
  const response = await apiRequest<ExportStatusResponse>(
    `/api/v1/audit/export/${jobId}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to get export status');
  }

  return response.data;
}

/**
 * List export jobs
 */
export async function listAuditExports(limit: number = 20): Promise<AuditExportJob[]> {
  const response = await apiRequest<ListExportsResponse>(
    `/api/v1/audit/exports?limit=${limit}`
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Failed to list exports');
  }

  return response.data.exports;
}

/**
 * Get export download URL
 */
export function getExportDownloadUrl(jobId: string): string {
  return `${API_URL}/api/v1/audit/export/${jobId}/download`;
}

/**
 * Helper function to get export status color
 */
export function getExportStatusColor(status: AuditExportStatus): string {
  switch (status) {
    case 'queued': return 'gray';
    case 'processing': return 'blue';
    case 'success': return 'green';
    case 'failed': return 'red';
    default: return 'gray';
  }
}

/**
 * Helper function to format file size
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '-';

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
