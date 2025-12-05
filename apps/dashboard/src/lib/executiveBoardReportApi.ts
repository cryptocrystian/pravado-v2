/**
 * Executive Board Report API Client (Sprint S63)
 * Board Reporting & Quarterly Executive Pack Generator V1
 *
 * Type-safe client functions for executive board report API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  ExecBoardReport,
  ExecBoardReportWithCounts,
  ExecBoardReportSection,
  ExecBoardReportAudience,
  ExecBoardReportAuditLog,
  ExecBoardReportFormat,
  ExecBoardReportStatus,
  ExecBoardReportSectionType,
  ExecBoardReportSectionStatus,
  ExecBoardReportAccessLevel,
  GetExecBoardReportResponse,
  ListExecBoardReportsResponse,
  GenerateExecBoardReportResponse,
  PublishExecBoardReportResponse,
  ListExecBoardReportAudienceResponse,
  ListExecBoardReportAuditLogsResponse,
  ExecBoardReportStats,
} from '@pravado/types';
import {
  EXEC_BOARD_REPORT_FORMAT_LABELS,
  EXEC_BOARD_REPORT_STATUS_LABELS,
  EXEC_BOARD_REPORT_SECTION_TYPE_LABELS,
  EXEC_BOARD_REPORT_SECTION_STATUS_LABELS,
  EXEC_BOARD_REPORT_ACCESS_LEVEL_LABELS,
} from '@pravado/types';
import type {
  CreateExecBoardReportInput,
  UpdateExecBoardReportInput,
  GenerateExecBoardReportInput,
  PublishExecBoardReportInput,
  ApproveExecBoardReportInput,
  AddExecBoardReportAudienceInput,
  UpdateExecBoardReportAudienceInput,
  UpdateExecBoardReportSectionInput,
  ListExecBoardReportsQuery,
  ListExecBoardReportAudienceQuery,
  ListExecBoardReportAuditLogsQuery,
} from '@pravado/validators';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/executive-board-reports';

// Re-export types for components
export type {
  ExecBoardReport,
  ExecBoardReportWithCounts,
  ExecBoardReportSection,
  ExecBoardReportAudience,
  ExecBoardReportAuditLog,
  ExecBoardReportFormat,
  ExecBoardReportStatus,
  ExecBoardReportSectionType,
  ExecBoardReportSectionStatus,
  ExecBoardReportAccessLevel,
  GetExecBoardReportResponse,
  ListExecBoardReportsResponse,
  GenerateExecBoardReportResponse,
  PublishExecBoardReportResponse,
  ListExecBoardReportAudienceResponse,
  ListExecBoardReportAuditLogsResponse,
  ExecBoardReportStats,
  CreateExecBoardReportInput,
  UpdateExecBoardReportInput,
  GenerateExecBoardReportInput,
  PublishExecBoardReportInput,
  ApproveExecBoardReportInput,
  AddExecBoardReportAudienceInput,
  UpdateExecBoardReportAudienceInput,
  UpdateExecBoardReportSectionInput,
  ListExecBoardReportsQuery,
};

// ============================================================================
// GENERIC API CLIENT
// ============================================================================

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'x-org-id': typeof window !== 'undefined' ? localStorage.getItem('orgId') || '' : '',
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
        value.forEach((v) => query.append(key, String(v)));
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
// REPORT CRUD API
// ============================================================================

/**
 * List board reports with optional filters
 */
export async function listReports(
  query: ListExecBoardReportsQuery = {}
): Promise<ListExecBoardReportsResponse> {
  const qs = buildQueryString(query as Record<string, unknown>);
  const endpoint = qs ? `?${qs}` : '';
  const result = await apiClient<ListExecBoardReportsResponse>(endpoint);
  return result.data!;
}

/**
 * Get a single board report with all related data
 */
export async function getReport(reportId: string): Promise<GetExecBoardReportResponse> {
  const result = await apiClient<GetExecBoardReportResponse>(`/${reportId}`);
  return result.data!;
}

/**
 * Create a new board report
 */
export async function createReport(input: CreateExecBoardReportInput): Promise<ExecBoardReport> {
  const result = await apiClient<ExecBoardReport>('', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Update a board report
 */
export async function updateReport(
  reportId: string,
  input: UpdateExecBoardReportInput
): Promise<ExecBoardReport> {
  const result = await apiClient<ExecBoardReport>(`/${reportId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Delete (archive) a board report
 */
export async function deleteReport(
  reportId: string,
  hardDelete: boolean = false
): Promise<{ archived: boolean; deleted: boolean }> {
  const endpoint = hardDelete ? `/${reportId}?hard=true` : `/${reportId}`;
  const result = await apiClient<{ archived: boolean; deleted: boolean }>(endpoint, {
    method: 'DELETE',
  });
  return result.data!;
}

/**
 * Get board report statistics
 */
export async function getReportStats(): Promise<ExecBoardReportStats> {
  const result = await apiClient<ExecBoardReportStats>('/stats');
  return result.data!;
}

// ============================================================================
// GENERATION & WORKFLOW API
// ============================================================================

/**
 * Generate board report content from aggregated data
 */
export async function generateReport(
  reportId: string,
  input: GenerateExecBoardReportInput = {}
): Promise<GenerateExecBoardReportResponse> {
  const result = await apiClient<GenerateExecBoardReportResponse>(`/${reportId}/generate`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Approve a board report
 */
export async function approveReport(
  reportId: string,
  input: ApproveExecBoardReportInput = {}
): Promise<ExecBoardReport> {
  const result = await apiClient<ExecBoardReport>(`/${reportId}/approve`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Publish a board report to audience
 */
export async function publishReport(
  reportId: string,
  input: PublishExecBoardReportInput = {}
): Promise<PublishExecBoardReportResponse> {
  const result = await apiClient<PublishExecBoardReportResponse>(`/${reportId}/publish`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

// ============================================================================
// SECTION MANAGEMENT API
// ============================================================================

/**
 * List sections for a report
 */
export async function listSections(reportId: string): Promise<ExecBoardReportSection[]> {
  const result = await apiClient<{ sections: ExecBoardReportSection[] }>(`/${reportId}/sections`);
  return result.data?.sections || [];
}

/**
 * Update a section
 */
export async function updateSection(
  reportId: string,
  sectionId: string,
  input: UpdateExecBoardReportSectionInput
): Promise<ExecBoardReportSection> {
  const result = await apiClient<ExecBoardReportSection>(
    `/${reportId}/sections/${sectionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    }
  );
  return result.data!;
}

/**
 * Update section order
 */
export async function updateSectionOrder(
  reportId: string,
  updates: Array<{ sectionId: string; sortOrder: number }>
): Promise<ExecBoardReportSection[]> {
  const result = await apiClient<{ sections: ExecBoardReportSection[] }>(
    `/${reportId}/sections/order`,
    {
      method: 'POST',
      body: JSON.stringify({ sections: updates }),
    }
  );
  return result.data?.sections || [];
}

// ============================================================================
// AUDIENCE MANAGEMENT API
// ============================================================================

/**
 * List audience members for a report
 */
export async function listAudienceMembers(
  reportId: string,
  query: Omit<ListExecBoardReportAudienceQuery, 'reportId'> = {}
): Promise<ListExecBoardReportAudienceResponse> {
  const qs = buildQueryString(query as Record<string, unknown>);
  const endpoint = qs ? `/${reportId}/audience?${qs}` : `/${reportId}/audience`;
  const result = await apiClient<ListExecBoardReportAudienceResponse>(endpoint);
  return result.data!;
}

/**
 * Add an audience member to a report
 */
export async function addAudienceMember(
  reportId: string,
  input: AddExecBoardReportAudienceInput
): Promise<ExecBoardReportAudience> {
  const result = await apiClient<ExecBoardReportAudience>(`/${reportId}/audience`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Update an audience member
 */
export async function updateAudienceMember(
  reportId: string,
  audienceId: string,
  input: UpdateExecBoardReportAudienceInput
): Promise<ExecBoardReportAudience> {
  const result = await apiClient<ExecBoardReportAudience>(
    `/${reportId}/audience/${audienceId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    }
  );
  return result.data!;
}

/**
 * Remove an audience member from a report
 */
export async function removeAudienceMember(reportId: string, audienceId: string): Promise<void> {
  await apiClient(`/${reportId}/audience/${audienceId}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// AUDIT LOG API
// ============================================================================

/**
 * List audit logs for a report
 */
export async function listAuditLogs(
  reportId: string,
  query: Omit<ListExecBoardReportAuditLogsQuery, 'reportId'> = {}
): Promise<ListExecBoardReportAuditLogsResponse> {
  const qs = buildQueryString(query as Record<string, unknown>);
  const endpoint = qs ? `/${reportId}/audit-logs?${qs}` : `/${reportId}/audit-logs`;
  const result = await apiClient<ListExecBoardReportAuditLogsResponse>(endpoint);
  return result.data!;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get human-readable label for report format
 */
export function getFormatLabel(format: ExecBoardReportFormat): string {
  return EXEC_BOARD_REPORT_FORMAT_LABELS[format] || format;
}

/**
 * Get human-readable label for report status
 */
export function getStatusLabel(status: ExecBoardReportStatus): string {
  return EXEC_BOARD_REPORT_STATUS_LABELS[status] || status;
}

/**
 * Get human-readable label for section type
 */
export function getSectionTypeLabel(sectionType: ExecBoardReportSectionType): string {
  return EXEC_BOARD_REPORT_SECTION_TYPE_LABELS[sectionType] || sectionType;
}

/**
 * Get human-readable label for section status
 */
export function getSectionStatusLabel(status: ExecBoardReportSectionStatus): string {
  return EXEC_BOARD_REPORT_SECTION_STATUS_LABELS[status] || status;
}

/**
 * Get human-readable label for access level
 */
export function getAccessLevelLabel(accessLevel: ExecBoardReportAccessLevel): string {
  return EXEC_BOARD_REPORT_ACCESS_LEVEL_LABELS[accessLevel] || accessLevel;
}

/**
 * Get status color for badges
 */
export function getStatusColor(status: ExecBoardReportStatus): string {
  switch (status) {
    case 'draft':
      return 'gray';
    case 'generating':
      return 'blue';
    case 'review':
      return 'yellow';
    case 'approved':
      return 'green';
    case 'published':
      return 'indigo';
    case 'archived':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Get section status color
 */
export function getSectionStatusColor(status: ExecBoardReportSectionStatus): string {
  switch (status) {
    case 'pending':
      return 'gray';
    case 'generating':
      return 'blue';
    case 'generated':
      return 'green';
    case 'edited':
      return 'yellow';
    case 'approved':
      return 'indigo';
    case 'error':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get icon name for section type
 */
export function getSectionTypeIcon(sectionType: ExecBoardReportSectionType): string {
  const iconMap: Record<ExecBoardReportSectionType, string> = {
    executive_summary: 'file-text',
    strategic_highlights: 'star',
    kpi_dashboard: 'bar-chart-2',
    financial_overview: 'dollar-sign',
    market_analysis: 'trending-up',
    risk_assessment: 'alert-triangle',
    brand_health: 'heart',
    media_coverage: 'newspaper',
    operational_updates: 'settings',
    talent_updates: 'users',
    technology_updates: 'cpu',
    sustainability: 'leaf',
    forward_outlook: 'compass',
    action_items: 'check-square',
    appendix: 'folder',
  };
  return iconMap[sectionType] || 'file';
}

/**
 * Format relative time from ISO date string
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Format date range for period display
 */
export function formatPeriodRange(periodStart: string, periodEnd: string): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear === endYear && startMonth === endMonth) {
    return `${startMonth} ${startYear}`;
  } else if (startYear === endYear) {
    return `${startMonth} - ${endMonth} ${startYear}`;
  } else {
    return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
  }
}

/**
 * Format fiscal quarter display
 */
export function formatFiscalQuarter(fiscalQuarter: string | null, fiscalYear: number | null): string {
  if (fiscalQuarter && fiscalYear) {
    return `${fiscalQuarter} ${fiscalYear}`;
  } else if (fiscalQuarter) {
    return fiscalQuarter;
  } else if (fiscalYear) {
    return `FY${fiscalYear}`;
  }
  return '';
}

/**
 * Get report progress percentage
 */
export function getReportProgress(report: ExecBoardReportWithCounts): number {
  if (report.sectionCount === 0) return 0;
  return Math.round((report.completedSectionCount / report.sectionCount) * 100);
}

/**
 * Get report health status based on progress and status
 */
export function getReportHealthStatus(
  report: ExecBoardReportWithCounts
): 'healthy' | 'warning' | 'critical' {
  if (report.status === 'published' || report.status === 'approved') {
    return 'healthy';
  }

  const progress = getReportProgress(report);

  if (progress === 0) {
    return 'critical';
  }

  if (progress < 50) {
    return 'warning';
  }

  return 'healthy';
}

/**
 * Get health status color
 */
export function getHealthStatusColor(status: 'healthy' | 'warning' | 'critical'): string {
  switch (status) {
    case 'healthy':
      return 'green';
    case 'warning':
      return 'yellow';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
}
