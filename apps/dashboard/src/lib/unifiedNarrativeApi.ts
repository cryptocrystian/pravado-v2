/**
 * Unified Narrative API Client (Sprint S70)
 * Cross-domain Synthesis Engine for Multi-layer Narrative Documents
 *
 * Type-safe client functions for unified narrative API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  UnifiedNarrative,
  UnifiedNarrativeSection,
  UnifiedNarrativeSource,
  UnifiedNarrativeDiff,
  UnifiedNarrativeAuditLog,
  NarrativeType,
  NarrativeSectionType,
  NarrativeSourceSystem,
  NarrativeStatus,
  NarrativeFormatType,
  NarrativeEventType,
  NarrativeInsightStrength,
  DeltaType,
  NarrativeInsight,
  CrossSystemPattern,
  ContradictionDetected,
  RiskCluster,
  DataCorrelation,
  NarrativeWithSections,
  ListNarrativesResponse,
  GenerateNarrativeResponse,
  ComputeDeltaResponse,
  ListInsightsResponse,
  NarrativeStats,
} from '@pravado/types';
import {
  NARRATIVE_TYPE_LABELS,
  NARRATIVE_SECTION_TYPE_LABELS,
  NARRATIVE_SOURCE_SYSTEM_LABELS,
  NARRATIVE_STATUS_LABELS,
  NARRATIVE_FORMAT_LABELS,
  NARRATIVE_EVENT_TYPE_LABELS,
  NARRATIVE_INSIGHT_STRENGTH_LABELS,
  DELTA_TYPE_LABELS,
} from '@pravado/types';
import type {
  CreateNarrative,
  UpdateNarrative,
  GenerateNarrative,
  ListNarrativesQuery,
  UpdateNarrativeSection,
  RegenerateNarrativeSection,
  ComputeDelta,
  GetNarrativeInsightsQuery,
  ApproveNarrative,
  PublishNarrative,
  ExportNarrative,
} from '@pravado/validators';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/unified-narratives';

// Re-export types for components
export type {
  UnifiedNarrative,
  UnifiedNarrativeSection,
  UnifiedNarrativeSource,
  UnifiedNarrativeDiff,
  UnifiedNarrativeAuditLog,
  NarrativeType,
  NarrativeSectionType,
  NarrativeSourceSystem,
  NarrativeStatus,
  NarrativeFormatType,
  NarrativeEventType,
  NarrativeInsightStrength,
  DeltaType,
  NarrativeInsight,
  CrossSystemPattern,
  ContradictionDetected,
  RiskCluster,
  DataCorrelation,
  NarrativeWithSections,
  ListNarrativesResponse,
  GenerateNarrativeResponse,
  ComputeDeltaResponse,
  ListInsightsResponse,
  NarrativeStats,
  CreateNarrative,
  UpdateNarrative,
  GenerateNarrative,
  ListNarrativesQuery,
  UpdateNarrativeSection,
  RegenerateNarrativeSection,
  ComputeDelta,
  GetNarrativeInsightsQuery,
  ApproveNarrative,
  PublishNarrative,
  ExportNarrative,
};

// ============================================================================
// NARRATIVE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new unified narrative
 */
export async function createNarrative(
  input: CreateNarrative
): Promise<UnifiedNarrative> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to create narrative: ${response.statusText}`);
  const data = await response.json();
  return data.narrative;
}

/**
 * Get a unified narrative by ID with sections and sources
 */
export async function getNarrative(narrativeId: string): Promise<NarrativeWithSections> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/${narrativeId}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error(`Failed to fetch narrative: ${response.statusText}`);
  return response.json();
}

/**
 * Update a unified narrative
 */
export async function updateNarrative(
  narrativeId: string,
  updates: UpdateNarrative
): Promise<UnifiedNarrative> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/${narrativeId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error(`Failed to update narrative: ${response.statusText}`);
  const data = await response.json();
  return data.narrative;
}

/**
 * Delete a unified narrative
 */
export async function deleteNarrative(narrativeId: string): Promise<void> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/${narrativeId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) throw new Error(`Failed to delete narrative: ${response.statusText}`);
}

/**
 * List unified narratives with optional filters
 */
export async function listNarratives(
  query: Partial<ListNarrativesQuery> = {}
): Promise<ListNarrativesResponse> {
  const params = new URLSearchParams();
  if (query.narrativeType) params.set('narrativeType', query.narrativeType);
  if (query.status) params.set('status', query.status);
  if (query.format) params.set('format', query.format);
  if (query.periodStart) params.set('periodStart', query.periodStart);
  if (query.periodEnd) params.set('periodEnd', query.periodEnd);
  if (query.fiscalYear) params.set('fiscalYear', String(query.fiscalYear));
  if (query.fiscalQuarter) params.set('fiscalQuarter', query.fiscalQuarter);
  if (query.search) params.set('search', query.search);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.offset) params.set('offset', String(query.offset));
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortOrder) params.set('sortOrder', query.sortOrder);
  if (query.tags?.length) params.set('tags', query.tags.join(','));
  if (query.sourceSystems?.length) params.set('sourceSystems', query.sourceSystems.join(','));

  const response = await fetch(`${BASE_URL}${API_PREFIX}?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error(`Failed to list narratives: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// NARRATIVE GENERATION OPERATIONS
// ============================================================================

/**
 * Generate or regenerate narrative content
 */
export async function generateNarrative(
  narrativeId: string,
  input: Partial<GenerateNarrative> = {}
): Promise<GenerateNarrativeResponse> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/${narrativeId}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to generate narrative: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// SECTION MANAGEMENT OPERATIONS
// ============================================================================

/**
 * Update a section
 */
export async function updateSection(
  narrativeId: string,
  sectionId: string,
  updates: UpdateNarrativeSection
): Promise<UnifiedNarrativeSection> {
  const response = await fetch(
    `${BASE_URL}${API_PREFIX}/${narrativeId}/sections/${sectionId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) throw new Error(`Failed to update section: ${response.statusText}`);
  const data = await response.json();
  return data.section;
}

/**
 * Regenerate a section
 */
export async function regenerateSection(
  narrativeId: string,
  sectionId: string,
  input: Partial<RegenerateNarrativeSection> = {}
): Promise<UnifiedNarrativeSection> {
  const response = await fetch(
    `${BASE_URL}${API_PREFIX}/${narrativeId}/sections/${sectionId}/regenerate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(input),
    }
  );

  if (!response.ok) throw new Error(`Failed to regenerate section: ${response.statusText}`);
  const data = await response.json();
  return data.section;
}

// ============================================================================
// DELTA COMPUTATION OPERATIONS
// ============================================================================

/**
 * Compute delta between current and previous narrative
 */
export async function computeDelta(
  narrativeId: string,
  input: { previousNarrativeId: string } & Partial<Omit<ComputeDelta, 'previousNarrativeId'>>
): Promise<ComputeDeltaResponse> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/${narrativeId}/compute-delta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to compute delta: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// INSIGHTS OPERATIONS
// ============================================================================

/**
 * Get insights for a narrative
 */
export async function getInsights(
  narrativeId: string,
  query: Partial<GetNarrativeInsightsQuery> = {}
): Promise<ListInsightsResponse> {
  const params = new URLSearchParams();
  if (query.sourceSystem) params.set('sourceSystem', query.sourceSystem);
  if (query.strength) params.set('strength', query.strength);
  if (query.periodStart) params.set('periodStart', query.periodStart);
  if (query.periodEnd) params.set('periodEnd', query.periodEnd);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.offset) params.set('offset', String(query.offset));

  const response = await fetch(
    `${BASE_URL}${API_PREFIX}/${narrativeId}/insights?${params.toString()}`,
    {
      credentials: 'include',
    }
  );

  if (!response.ok) throw new Error(`Failed to fetch insights: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// WORKFLOW OPERATIONS
// ============================================================================

/**
 * Approve a narrative
 */
export async function approveNarrative(
  narrativeId: string,
  input: Partial<ApproveNarrative> = {}
): Promise<UnifiedNarrative> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/${narrativeId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to approve narrative: ${response.statusText}`);
  const data = await response.json();
  return data.narrative;
}

/**
 * Publish a narrative
 */
export async function publishNarrative(
  narrativeId: string,
  input: Partial<PublishNarrative> = {}
): Promise<UnifiedNarrative> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/${narrativeId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to publish narrative: ${response.statusText}`);
  const data = await response.json();
  return data.narrative;
}

/**
 * Archive a narrative
 */
export async function archiveNarrative(
  narrativeId: string,
  reason?: string
): Promise<UnifiedNarrative> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/${narrativeId}/archive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ archiveReason: reason }),
  });

  if (!response.ok) throw new Error(`Failed to archive narrative: ${response.statusText}`);
  const data = await response.json();
  return data.narrative;
}

// ============================================================================
// EXPORT OPERATIONS
// ============================================================================

/**
 * Export a narrative
 */
export async function exportNarrative(
  narrativeId: string,
  input: { format: 'pdf' | 'docx' | 'pptx' | 'html' | 'md' | 'json' } & Partial<Omit<ExportNarrative, 'format'>>
): Promise<{ url: string; format: string }> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/${narrativeId}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) throw new Error(`Failed to export narrative: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// STATISTICS OPERATIONS
// ============================================================================

/**
 * Get narrative statistics
 */
export async function getNarrativeStats(): Promise<NarrativeStats> {
  const response = await fetch(`${BASE_URL}${API_PREFIX}/stats`, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error(`Failed to fetch stats: ${response.statusText}`);
  const data = await response.json();
  return data.stats;
}

// ============================================================================
// AUDIT LOG OPERATIONS
// ============================================================================

/**
 * List audit logs for narratives
 */
export async function listAuditLogs(
  query: {
    narrativeId?: string;
    eventType?: NarrativeEventType;
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ logs: UnifiedNarrativeAuditLog[]; total: number }> {
  const params = new URLSearchParams();
  if (query.narrativeId) params.set('narrativeId', query.narrativeId);
  if (query.eventType) params.set('eventType', query.eventType);
  if (query.userId) params.set('userId', query.userId);
  if (query.startDate) params.set('startDate', query.startDate);
  if (query.endDate) params.set('endDate', query.endDate);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.offset) params.set('offset', String(query.offset));

  const endpoint = query.narrativeId
    ? `${BASE_URL}${API_PREFIX}/${query.narrativeId}/audit-logs?${params.toString()}`
    : `${BASE_URL}${API_PREFIX}/audit-logs?${params.toString()}`;

  const response = await fetch(endpoint, {
    credentials: 'include',
  });

  if (!response.ok) throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
  return response.json();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get display label for narrative type
 */
export function getNarrativeTypeLabel(type: NarrativeType): string {
  return NARRATIVE_TYPE_LABELS[type] || type;
}

/**
 * Get display label for section type
 */
export function getSectionTypeLabel(type: NarrativeSectionType): string {
  return NARRATIVE_SECTION_TYPE_LABELS[type] || type;
}

/**
 * Get display label for source system
 */
export function getSourceSystemLabel(system: NarrativeSourceSystem): string {
  return NARRATIVE_SOURCE_SYSTEM_LABELS[system] || system;
}

/**
 * Get display label for status
 */
export function getStatusLabel(status: NarrativeStatus): string {
  return NARRATIVE_STATUS_LABELS[status] || status;
}

/**
 * Get display label for format
 */
export function getFormatLabel(format: NarrativeFormatType): string {
  return NARRATIVE_FORMAT_LABELS[format] || format;
}

/**
 * Get display label for event type
 */
export function getEventLabel(event: NarrativeEventType): string {
  return NARRATIVE_EVENT_TYPE_LABELS[event] || event;
}

/**
 * Get display label for insight strength
 */
export function getInsightStrengthLabel(strength: NarrativeInsightStrength): string {
  return NARRATIVE_INSIGHT_STRENGTH_LABELS[strength] || strength;
}

/**
 * Get display label for delta type
 */
export function getDeltaTypeLabel(deltaType: DeltaType): string {
  return DELTA_TYPE_LABELS[deltaType] || deltaType;
}

/**
 * Get status color class
 */
export function getStatusColor(status: NarrativeStatus): string {
  const colors: Record<NarrativeStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    generating: 'bg-blue-100 text-blue-800',
    review: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    published: 'bg-purple-100 text-purple-800',
    archived: 'bg-gray-100 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Get insight strength color class
 */
export function getInsightStrengthColor(strength: NarrativeInsightStrength): string {
  const colors: Record<NarrativeInsightStrength, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800',
    informational: 'bg-gray-100 text-gray-800',
  };
  return colors[strength] || 'bg-gray-100 text-gray-800';
}

/**
 * Get delta type color class
 */
export function getDeltaTypeColor(deltaType: DeltaType): string {
  const colors: Record<DeltaType, string> = {
    improved: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    unchanged: 'bg-gray-100 text-gray-800',
    new_insight: 'bg-blue-100 text-blue-800',
    removed_insight: 'bg-orange-100 text-orange-800',
    context_shift: 'bg-purple-100 text-purple-800',
  };
  return colors[deltaType] || 'bg-gray-100 text-gray-800';
}

/**
 * Get narrative type icon
 */
export function getNarrativeTypeIcon(type: NarrativeType): string {
  const icons: Record<NarrativeType, string> = {
    executive: 'briefcase',
    strategy: 'target',
    investor: 'trending-up',
    crisis: 'alert-triangle',
    competitive_intelligence: 'eye',
    reputation: 'star',
    quarterly_context: 'calendar',
    talking_points: 'message-circle',
    analyst_brief: 'file-text',
    internal_alignment_memo: 'users',
    tldr_synthesis: 'zap',
    custom: 'edit-3',
  };
  return icons[type] || 'file';
}

/**
 * Get source system icon
 */
export function getSourceSystemIcon(system: NarrativeSourceSystem): string {
  const icons: Record<NarrativeSourceSystem, string> = {
    media_briefing: 'mic',
    crisis_engine: 'alert-triangle',
    brand_reputation: 'star',
    brand_alerts: 'bell',
    governance: 'shield',
    risk_radar: 'radio',
    exec_command_center: 'command',
    exec_digest: 'book-open',
    board_reports: 'clipboard',
    investor_relations: 'trending-up',
    strategic_intelligence: 'brain',
    unified_graph: 'git-branch',
    scenario_playbooks: 'play-circle',
    media_monitoring: 'monitor',
    media_performance: 'bar-chart-2',
    journalist_graph: 'users',
    audience_personas: 'user-check',
    competitive_intel: 'eye',
    content_quality: 'check-circle',
    pr_outreach: 'send',
    custom: 'settings',
  };
  return icons[system] || 'database';
}

/**
 * Format date for display
 */
export function formatNarrativeDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format period for display
 */
export function formatNarrativePeriod(start: Date | string, end: Date | string): string {
  const s = typeof start === 'string' ? new Date(start) : start;
  const e = typeof end === 'string' ? new Date(end) : end;

  const startStr = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return `${startStr} - ${endStr}`;
}

/**
 * Calculate reading time for content
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}
