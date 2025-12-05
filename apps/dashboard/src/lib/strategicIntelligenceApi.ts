/**
 * Strategic Intelligence API Client (Sprint S65)
 * CEO-level Strategic Intelligence Narrative Engine V1
 *
 * Type-safe client functions for strategic intelligence API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  StrategicIntelligenceReport,
  StrategicSection,
  StrategicSource,
  StrategicAuditLogEntry,
  StrategicReportFormat,
  StrategicReportStatus,
  StrategicSectionType,
  StrategicSectionStatus,
  StrategicAudience,
  StrategicSourceSystem,
  StrategicEventType,
  StrategicReportWithSections,
  StrategicReportListItem,
  StrategicReportStats,
  AggregatedStrategicInsights,
  ListStrategicReportsResponse,
  GenerateStrategicReportResponse,
  PublishStrategicReportResponse,
  RefreshInsightsResponse,
  ListStrategicSourcesResponse,
  ListStrategicAuditLogsResponse,
  PeriodComparison,
} from '@pravado/types';
import {
  STRATEGIC_FORMAT_LABELS,
  STRATEGIC_STATUS_LABELS,
  STRATEGIC_SECTION_TYPE_LABELS,
  STRATEGIC_AUDIENCE_LABELS,
  STRATEGIC_SOURCE_LABELS,
  STRATEGIC_EVENT_LABELS,
} from '@pravado/types';
import type {
  CreateStrategicReport,
  UpdateStrategicReport,
  UpdateStrategicSection,
  ListStrategicReportsQuery,
  ListStrategicSourcesQuery,
  ListStrategicAuditLogsQuery,
  GenerateStrategicReport,
  RegenerateStrategicSection,
  RefreshInsights,
  ReorderStrategicSections,
  AddStrategicSource,
  UpdateStrategicSource,
  ApproveStrategicReport,
  PublishStrategicReport,
  ArchiveStrategicReport,
  ExportStrategicReport,
  ComparePeriods,
} from '@pravado/validators';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/strategic-intelligence';

// Re-export types for components
export type {
  StrategicIntelligenceReport,
  StrategicSection,
  StrategicSource,
  StrategicAuditLogEntry,
  StrategicReportFormat,
  StrategicReportStatus,
  StrategicSectionType,
  StrategicSectionStatus,
  StrategicAudience,
  StrategicSourceSystem,
  StrategicEventType,
  StrategicReportWithSections,
  StrategicReportListItem,
  StrategicReportStats,
  AggregatedStrategicInsights,
  ListStrategicReportsResponse,
  GenerateStrategicReportResponse,
  PublishStrategicReportResponse,
  RefreshInsightsResponse,
  ListStrategicSourcesResponse,
  ListStrategicAuditLogsResponse,
  PeriodComparison,
  CreateStrategicReport,
  UpdateStrategicReport,
  UpdateStrategicSection,
  ListStrategicReportsQuery,
  ListStrategicSourcesQuery,
  ListStrategicAuditLogsQuery,
  GenerateStrategicReport,
  RegenerateStrategicSection,
  RefreshInsights,
  ReorderStrategicSections,
  AddStrategicSource,
  UpdateStrategicSource,
  ApproveStrategicReport,
  PublishStrategicReport,
  ArchiveStrategicReport,
  ExportStrategicReport,
  ComparePeriods,
};

// ============================================================================
// REPORT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new strategic intelligence report
 */
export async function createStrategicReport(
  input: CreateStrategicReport
): Promise<StrategicIntelligenceReport> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to create report: ${response.statusText}`);
  return response.json();
}

/**
 * Get a strategic intelligence report by ID
 */
export async function getStrategicReport(reportId: string): Promise<StrategicReportWithSections> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}`);

  if (!response.ok) throw new Error(`Failed to fetch report: ${response.statusText}`);
  return response.json();
}

/**
 * Update a strategic intelligence report
 */
export async function updateStrategicReport(
  reportId: string,
  updates: UpdateStrategicReport
): Promise<StrategicIntelligenceReport> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error(`Failed to update report: ${response.statusText}`);
  return response.json();
}

/**
 * Delete a strategic intelligence report
 */
export async function deleteStrategicReport(reportId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}`, {
    method: 'DELETE',
  });

  if (!response.ok) throw new Error(`Failed to delete report: ${response.statusText}`);
}

/**
 * List strategic intelligence reports
 */
export async function listStrategicReports(
  query?: Partial<ListStrategicReportsQuery> | Record<string, unknown>
): Promise<ListStrategicReportsResponse> {
  const params = new URLSearchParams();
  const q = query as Record<string, unknown> | undefined;
  if (q?.status) params.append('status', String(q.status));
  if (q?.format) params.append('format', String(q.format));
  if (q?.audience) params.append('audience', String(q.audience));
  if (q?.limit) params.append('limit', String(q.limit));
  if (q?.offset) params.append('offset', String(q.offset));
  if (q?.sortBy) params.append('sortBy', String(q.sortBy));
  if (q?.sortOrder) params.append('sortOrder', String(q.sortOrder));
  if (q?.search) params.append('search', String(q.search));

  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports?${params}`);

  if (!response.ok) throw new Error(`Failed to list reports: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// SECTION OPERATIONS
// ============================================================================

/**
 * Update a section within a report
 */
export async function updateStrategicSection(
  reportId: string,
  sectionId: string,
  updates: UpdateStrategicSection
): Promise<StrategicSection> {
  const response = await fetch(
    `${BASE_URL}${API_PREFIX}/reports/${reportId}/sections/${sectionId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) throw new Error(`Failed to update section: ${response.statusText}`);
  return response.json();
}

/**
 * Regenerate a section within a report
 */
export async function regenerateStrategicSection(
  reportId: string,
  sectionId: string,
  input: RegenerateStrategicSection = {}
): Promise<StrategicSection> {
  const response = await fetch(
    `${BASE_URL}${API_PREFIX}/reports/${reportId}/sections/${sectionId}/regenerate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) throw new Error(`Failed to regenerate section: ${response.statusText}`);
  return response.json();
}

/**
 * Reorder sections within a report
 */
export async function reorderStrategicSections(
  reportId: string,
  input: ReorderStrategicSections
): Promise<StrategicReportWithSections> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}/sections/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to reorder sections: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// GENERATION & PROCESSING
// ============================================================================

/**
 * Generate a new strategic intelligence report
 */
export async function generateStrategicReport(
  reportId: string,
  input: GenerateStrategicReport
): Promise<GenerateStrategicReportResponse> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to generate report: ${response.statusText}`);
  return response.json();
}

/**
 * Refresh insights for a report
 */
export async function refreshStrategicInsights(
  reportId: string,
  input: Partial<RefreshInsights> = {}
): Promise<RefreshInsightsResponse> {
  const fullInput = {
    forceRefresh: false,
    updateKpis: true,
    updateSummary: true,
    ...input,
  };
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}/refresh-insights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullInput),
  });

  if (!response.ok) throw new Error(`Failed to refresh insights: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// WORKFLOW OPERATIONS
// ============================================================================

/**
 * Approve a strategic intelligence report
 */
export async function approveStrategicReport(
  reportId: string,
  input: ApproveStrategicReport = {}
): Promise<StrategicIntelligenceReport> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to approve report: ${response.statusText}`);
  return response.json();
}

/**
 * Publish a strategic intelligence report
 */
export async function publishStrategicReport(
  reportId: string,
  input: Partial<PublishStrategicReport> = {}
): Promise<PublishStrategicReportResponse> {
  const fullInput = {
    generatePdf: true,
    generatePptx: false,
    ...input,
  };
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fullInput),
  });

  if (!response.ok) throw new Error(`Failed to publish report: ${response.statusText}`);
  return response.json();
}

/**
 * Archive a strategic intelligence report
 */
export async function archiveStrategicReport(
  reportId: string,
  input: ArchiveStrategicReport = {}
): Promise<StrategicIntelligenceReport> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to archive report: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// SOURCE MANAGEMENT
// ============================================================================

/**
 * Add a source to a report
 */
export async function addStrategicSource(
  reportId: string,
  input: AddStrategicSource
): Promise<StrategicSource> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to add source: ${response.statusText}`);
  return response.json();
}

/**
 * Update a source in a report
 */
export async function updateStrategicSource(
  reportId: string,
  sourceId: string,
  input: UpdateStrategicSource
): Promise<StrategicSource> {
  const response = await fetch(
    `${BASE_URL}${API_PREFIX}/reports/${reportId}/sources/${sourceId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) throw new Error(`Failed to update source: ${response.statusText}`);
  return response.json();
}

/**
 * Remove a source from a report
 */
export async function removeStrategicSource(reportId: string, sourceId: string): Promise<void> {
  const response = await fetch(
    `${BASE_URL}${API_PREFIX}/reports/${reportId}/sources/${sourceId}`,
    { method: 'DELETE' }
  );

  if (!response.ok) throw new Error(`Failed to remove source: ${response.statusText}`);
}

/**
 * List sources for a report
 */
export async function listStrategicSources(
  reportId: string,
  query?: ListStrategicSourcesQuery
): Promise<ListStrategicSourcesResponse> {
  const params = new URLSearchParams();
  if (query?.sourceSystem) params.append('sourceSystem', query.sourceSystem);
  if (query?.limit) params.append('limit', String(query.limit));

  const response = await fetch(
    `${BASE_URL}${API_PREFIX}/reports/${reportId}/sources?${params}`
  );

  if (!response.ok) throw new Error(`Failed to list sources: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// AUDIT & ANALYTICS
// ============================================================================

/**
 * Get audit log entries for a report
 */
export async function listStrategicAuditLogs(
  reportId: string,
  query?: Partial<ListStrategicAuditLogsQuery>
): Promise<ListStrategicAuditLogsResponse> {
  const params = new URLSearchParams();
  if (query?.eventType) params.append('eventType', query.eventType);
  if (query?.limit) params.append('limit', String(query.limit));
  if (query?.offset) params.append('offset', String(query.offset));

  const response = await fetch(
    `${BASE_URL}${API_PREFIX}/reports/${reportId}/audit-logs?${params}`
  );

  if (!response.ok) throw new Error(`Failed to list audit logs: ${response.statusText}`);
  return response.json();
}

/**
 * Get statistics for a report (or global stats if no reportId provided)
 */
export async function getStrategicReportStats(reportId?: string): Promise<StrategicReportStats> {
  const endpoint = reportId
    ? `${BASE_URL}${API_PREFIX}/reports/${reportId}/stats`
    : `${BASE_URL}${API_PREFIX}/stats`;

  const response = await fetch(endpoint);

  if (!response.ok) throw new Error(`Failed to fetch report stats: ${response.statusText}`);
  return response.json();
}

/**
 * Get aggregated insights across reports
 */
export async function getAggregatedStrategicInsights(): Promise<AggregatedStrategicInsights> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/insights/aggregated`);

  if (!response.ok) throw new Error(`Failed to fetch aggregated insights: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// EXPORT & COMPARISON
// ============================================================================

/**
 * Export a report in a specific format
 */
export async function exportStrategicReport(
  reportId: string,
  input: ExportStrategicReport
): Promise<Blob> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/reports/${reportId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to export report: ${response.statusText}`);
  return response.blob();
}

/**
 * Compare two periods
 */
export async function comparePeriods(input: ComparePeriods): Promise<PeriodComparison> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/insights/compare-periods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to compare periods: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get display label for report format
 */
export function getFormatLabel(format: StrategicReportFormat): string {
  return STRATEGIC_FORMAT_LABELS[format] || format;
}

/**
 * Get display label for report status
 */
export function getStatusLabel(status: StrategicReportStatus): string {
  return STRATEGIC_STATUS_LABELS[status] || status;
}

/**
 * Get status color for UI styling
 */
export function getStatusColor(status: StrategicReportStatus): string {
  const colors: Record<StrategicReportStatus, string> = {
    draft: 'yellow',
    generating: 'blue',
    review: 'indigo',
    approved: 'green',
    published: 'emerald',
    archived: 'gray',
  };
  return colors[status] || 'gray';
}

/**
 * Get display label for section type
 */
export function getSectionTypeLabel(sectionType: StrategicSectionType): string {
  return STRATEGIC_SECTION_TYPE_LABELS[sectionType] || sectionType;
}

/**
 * Get icon name for section type
 */
export function getSectionIcon(sectionType: StrategicSectionType): string {
  const icons: Record<StrategicSectionType, string> = {
    executive_summary: 'FileText',
    strategic_outlook: 'TrendingUp',
    market_dynamics: 'Activity',
    competitive_positioning: 'Target',
    risk_opportunity_matrix: 'Grid',
    messaging_alignment: 'MessageSquare',
    ceo_talking_points: 'Mic',
    quarter_changes: 'Calendar',
    key_kpis_narrative: 'BarChart',
    prioritized_initiatives: 'ListOrdered',
    brand_health_overview: 'Heart',
    crisis_posture: 'AlertTriangle',
    governance_compliance: 'Shield',
    investor_sentiment: 'DollarSign',
    media_performance_summary: 'Radio',
    strategic_recommendations: 'Lightbulb',
    appendix: 'Paperclip',
    custom: 'FileEdit',
  };
  return icons[sectionType] || 'FileText';
}

/**
 * Get display label for audience type
 */
export function getAudienceLabel(audience: StrategicAudience): string {
  return STRATEGIC_AUDIENCE_LABELS[audience] || audience;
}

/**
 * Get display label for source system
 */
export function getSourceSystemLabel(system: StrategicSourceSystem): string {
  return STRATEGIC_SOURCE_LABELS[system] || system;
}

/**
 * Alias for getSourceSystemLabel (for shorter imports)
 */
export function getSourceLabel(system: StrategicSourceSystem): string {
  return getSourceSystemLabel(system);
}

/**
 * Get icon name for source system
 */
export function getSourceIcon(system: StrategicSourceSystem): string {
  const icons: Record<StrategicSourceSystem, string> = {
    pr_generator: 'FileText',
    media_monitoring: 'Radio',
    media_alerts: 'Bell',
    media_performance: 'BarChart',
    competitive_intel: 'Target',
    crisis_engine: 'AlertTriangle',
    brand_reputation: 'Heart',
    brand_alerts: 'BellRing',
    governance: 'Shield',
    risk_radar: 'Radar',
    exec_command_center: 'Command',
    exec_digest: 'Mail',
    board_reports: 'Briefcase',
    investor_relations: 'DollarSign',
    journalist_graph: 'Network',
    media_lists: 'List',
    outreach_engine: 'Send',
    custom: 'FileEdit',
  };
  return icons[system] || 'Database';
}

/**
 * Get display label for event type
 */
export function getEventLabel(eventType: StrategicEventType): string {
  return STRATEGIC_EVENT_LABELS[eventType] || eventType;
}

/**
 * Format a score as a percentage
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  return `${(score * 100).toFixed(0)}%`;
}

/**
 * Get color for a score
 */
export function getScoreColor(score: number | null | undefined): 'green' | 'blue' | 'yellow' | 'red' | 'gray' {
  if (score === null || score === undefined) return 'gray';
  if (score >= 0.8) return 'green';
  if (score >= 0.6) return 'blue';
  if (score >= 0.4) return 'yellow';
  if (score >= 0.2) return 'yellow';
  return 'red';
}

/**
 * Format a period range
 */
export function formatPeriodRange(startDate: string | Date, endDate: string | Date): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

/**
 * Format a fiscal quarter
 */
export function formatFiscalQuarter(year: number, quarter: number): string {
  return `Q${quarter} ${year}`;
}

/**
 * Format relative time
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Format token count
 */
export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return String(tokens);
}

/**
 * Check if a report can be generated
 */
export function canGenerate(status: StrategicReportStatus): boolean {
  return status === 'draft';
}

/**
 * Check if a report can be reviewed
 */
export function canReview(status: StrategicReportStatus): boolean {
  return status === 'generating';
}

/**
 * Check if a report can be approved
 */
export function canApprove(status: StrategicReportStatus): boolean {
  return status === 'review';
}

/**
 * Check if a report can be published
 */
export function canPublish(status: StrategicReportStatus): boolean {
  return status === 'approved';
}

/**
 * Check if a report can be archived
 */
export function canArchive(status: StrategicReportStatus): boolean {
  return status !== 'archived';
}

// ============================================================================
// CONVENIENCE ALIASES (for shorter imports in pages)
// ============================================================================
export {
  createStrategicReport as createReport,
  getStrategicReport as getReport,
  listStrategicReports as listReports,
  deleteStrategicReport as deleteReport,
  generateStrategicReport as generateReport,
  approveStrategicReport as approveReport,
  publishStrategicReport as publishReport,
  archiveStrategicReport as archiveReport,
  refreshStrategicInsights as refreshInsights,
  updateStrategicSection as updateSection,
  regenerateStrategicSection as regenerateSection,
  listStrategicAuditLogs as listReportAuditLogs,
  getStrategicReportStats as getStats,
};
