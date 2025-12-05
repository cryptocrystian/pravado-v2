/**
 * Media Briefing API Client (Sprint S54)
 *
 * Type-safe client functions for media briefing API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  MediaBriefing,
  BriefingSection,
  SourceReference,
  TalkingPoint,
  BriefingSectionType,
  TalkingPointCategory,
  InsightStrength,
  BriefFormatType,
  BriefingStatus,
  BriefingSourceType,
  CreateBriefingRequest,
  UpdateBriefingRequest,
  GenerateBriefingRequest,
  CreateTalkingPointRequest,
  UpdateTalkingPointRequest,
  GenerateTalkingPointsRequest,
  UpdateSectionRequest,
  BriefingFilters,
  TalkingPointFilters,
  GetBriefingsResponse,
  GetTalkingPointsResponse,
  BriefingGenerationResponse,
  SectionRegenerationResponse,
  TalkingPointsGenerationResponse,
} from '@pravado/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/media-briefings';

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
    'x-org-id': localStorage.getItem('orgId') || '',
    'x-user-id': localStorage.getItem('userId') || '',
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

function buildQueryString(params: Record<string, any>): string {
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
// BRIEFING MANAGEMENT API
// ============================================================================

export async function createBriefing(data: CreateBriefingRequest): Promise<MediaBriefing> {
  const result = await apiClient<MediaBriefing>('/briefings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function getBriefings(
  filters?: BriefingFilters,
  limit: number = 20,
  offset: number = 0
): Promise<GetBriefingsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<GetBriefingsResponse>(`/briefings?${query}`);
  return result.data!;
}

export async function getBriefing(id: string): Promise<MediaBriefing> {
  const result = await apiClient<MediaBriefing>(`/briefings/${id}`);
  return result.data!;
}

export async function updateBriefing(
  id: string,
  data: UpdateBriefingRequest
): Promise<MediaBriefing> {
  const result = await apiClient<MediaBriefing>(`/briefings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function deleteBriefing(id: string): Promise<void> {
  await apiClient(`/briefings/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// BRIEFING WORKFLOW API
// ============================================================================

export async function reviewBriefing(id: string): Promise<MediaBriefing> {
  const result = await apiClient<MediaBriefing>(`/briefings/${id}/review`, {
    method: 'POST',
  });
  return result.data!;
}

export async function approveBriefing(id: string): Promise<MediaBriefing> {
  const result = await apiClient<MediaBriefing>(`/briefings/${id}/approve`, {
    method: 'POST',
  });
  return result.data!;
}

export async function archiveBriefing(id: string): Promise<MediaBriefing> {
  const result = await apiClient<MediaBriefing>(`/briefings/${id}/archive`, {
    method: 'POST',
  });
  return result.data!;
}

// ============================================================================
// GENERATION API
// ============================================================================

export async function generateBriefing(
  briefingId: string,
  options?: Partial<GenerateBriefingRequest>
): Promise<BriefingGenerationResponse> {
  const result = await apiClient<BriefingGenerationResponse>(`/briefings/${briefingId}/generate`, {
    method: 'POST',
    body: JSON.stringify(options || {}),
  });
  return result.data!;
}

export async function generateTalkingPoints(
  briefingId: string,
  options?: Partial<GenerateTalkingPointsRequest>
): Promise<TalkingPointsGenerationResponse> {
  const result = await apiClient<TalkingPointsGenerationResponse>(
    `/briefings/${briefingId}/generate-talking-points`,
    {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }
  );
  return result.data!;
}

// ============================================================================
// SECTION API
// ============================================================================

export async function getSection(
  briefingId: string,
  sectionId: string
): Promise<BriefingSection> {
  const result = await apiClient<BriefingSection>(
    `/briefings/${briefingId}/sections/${sectionId}`
  );
  return result.data!;
}

export async function updateSection(
  briefingId: string,
  sectionId: string,
  data: UpdateSectionRequest
): Promise<BriefingSection> {
  const result = await apiClient<BriefingSection>(
    `/briefings/${briefingId}/sections/${sectionId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    }
  );
  return result.data!;
}

export async function regenerateSection(
  briefingId: string,
  sectionId: string,
  options?: { customInstructions?: string; preserveManualEdits?: boolean }
): Promise<SectionRegenerationResponse> {
  const result = await apiClient<SectionRegenerationResponse>(
    `/briefings/${briefingId}/sections/${sectionId}/regenerate`,
    {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }
  );
  return result.data!;
}

export async function reorderSections(
  briefingId: string,
  sectionIds: string[]
): Promise<BriefingSection[]> {
  const result = await apiClient<BriefingSection[]>(
    `/briefings/${briefingId}/sections/reorder`,
    {
      method: 'PUT',
      body: JSON.stringify({ sectionIds }),
    }
  );
  return result.data!;
}

// ============================================================================
// TALKING POINT API
// ============================================================================

export async function createTalkingPoint(
  data: CreateTalkingPointRequest
): Promise<TalkingPoint> {
  const result = await apiClient<TalkingPoint>('/talking-points', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function getTalkingPoints(
  filters?: TalkingPointFilters,
  limit: number = 20,
  offset: number = 0
): Promise<GetTalkingPointsResponse> {
  const query = buildQueryString({ ...filters, limit, offset });
  const result = await apiClient<GetTalkingPointsResponse>(`/talking-points?${query}`);
  return result.data!;
}

export async function getTalkingPoint(id: string): Promise<TalkingPoint> {
  const result = await apiClient<TalkingPoint>(`/talking-points/${id}`);
  return result.data!;
}

export async function updateTalkingPoint(
  id: string,
  data: UpdateTalkingPointRequest
): Promise<TalkingPoint> {
  const result = await apiClient<TalkingPoint>(`/talking-points/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data!;
}

export async function deleteTalkingPoint(id: string): Promise<void> {
  await apiClient(`/talking-points/${id}`, {
    method: 'DELETE',
  });
}

export async function approveTalkingPoint(id: string): Promise<TalkingPoint> {
  const result = await apiClient<TalkingPoint>(`/talking-points/${id}/approve`, {
    method: 'POST',
  });
  return result.data!;
}

// ============================================================================
// SOURCE API
// ============================================================================

export async function getBriefingSources(
  briefingId: string,
  sourceType?: BriefingSourceType
): Promise<SourceReference[]> {
  const query = sourceType ? `?sourceType=${sourceType}` : '';
  const result = await apiClient<SourceReference[]>(`/briefings/${briefingId}/sources${query}`);
  return result.data!;
}

// ============================================================================
// HELPER FUNCTIONS - FORMAT
// ============================================================================

/**
 * Get label for briefing format
 */
export function getFormatLabel(format: BriefFormatType): string {
  const labels: Record<BriefFormatType, string> = {
    full_brief: 'Full Brief',
    executive_summary: 'Executive Summary',
    talking_points_only: 'Talking Points',
    media_prep: 'Media Prep',
    crisis_brief: 'Crisis Brief',
    interview_prep: 'Interview Prep',
  };
  return labels[format] || format;
}

/**
 * Get icon for briefing format
 */
export function getFormatIcon(format: BriefFormatType): string {
  const icons: Record<BriefFormatType, string> = {
    full_brief: '📋',
    executive_summary: '📝',
    talking_points_only: '💬',
    media_prep: '🎤',
    crisis_brief: '🚨',
    interview_prep: '🎯',
  };
  return icons[format] || '📄';
}

// ============================================================================
// HELPER FUNCTIONS - STATUS
// ============================================================================

/**
 * Get color for briefing status
 */
export function getStatusColor(status: BriefingStatus): string {
  const colors: Record<BriefingStatus, string> = {
    draft: 'text-gray-600',
    generating: 'text-blue-600',
    generated: 'text-purple-600',
    reviewed: 'text-yellow-600',
    approved: 'text-green-600',
    archived: 'text-gray-400',
  };
  return colors[status] || 'text-gray-600';
}

/**
 * Get background color for briefing status
 */
export function getStatusBgColor(status: BriefingStatus): string {
  const colors: Record<BriefingStatus, string> = {
    draft: 'bg-gray-100',
    generating: 'bg-blue-100',
    generated: 'bg-purple-100',
    reviewed: 'bg-yellow-100',
    approved: 'bg-green-100',
    archived: 'bg-gray-50',
  };
  return colors[status] || 'bg-gray-100';
}

/**
 * Get label for briefing status
 */
export function getStatusLabel(status: BriefingStatus): string {
  const labels: Record<BriefingStatus, string> = {
    draft: 'Draft',
    generating: 'Generating...',
    generated: 'Generated',
    reviewed: 'Reviewed',
    approved: 'Approved',
    archived: 'Archived',
  };
  return labels[status] || status;
}

// ============================================================================
// HELPER FUNCTIONS - SECTION TYPE
// ============================================================================

/**
 * Get label for section type
 */
export function getSectionTypeLabel(type: BriefingSectionType): string {
  const labels: Record<BriefingSectionType, string> = {
    executive_summary: 'Executive Summary',
    key_messages: 'Key Messages',
    media_landscape: 'Media Landscape',
    competitive_analysis: 'Competitive Analysis',
    journalist_intelligence: 'Journalist Intelligence',
    audience_insights: 'Audience Insights',
    performance_metrics: 'Performance Metrics',
    recommended_actions: 'Recommended Actions',
    qa_preparation: 'Q&A Preparation',
    appendix: 'Appendix',
  };
  return labels[type] || type;
}

/**
 * Get icon for section type
 */
export function getSectionTypeIcon(type: BriefingSectionType): string {
  const icons: Record<BriefingSectionType, string> = {
    executive_summary: '📊',
    key_messages: '🎯',
    media_landscape: '🌐',
    competitive_analysis: '⚔️',
    journalist_intelligence: '👤',
    audience_insights: '👥',
    performance_metrics: '📈',
    recommended_actions: '✅',
    qa_preparation: '❓',
    appendix: '📎',
  };
  return icons[type] || '📄';
}

// ============================================================================
// HELPER FUNCTIONS - TALKING POINT CATEGORY
// ============================================================================

/**
 * Get label for talking point category
 */
export function getTalkingPointCategoryLabel(category: TalkingPointCategory): string {
  const labels: Record<TalkingPointCategory, string> = {
    primary_message: 'Primary Message',
    supporting_point: 'Supporting Point',
    defensive_point: 'Defensive Point',
    bridging_statement: 'Bridge Statement',
    call_to_action: 'Call to Action',
    stat_highlight: 'Stat Highlight',
    quote_suggestion: 'Quote Suggestion',
    pivot_phrase: 'Pivot Phrase',
  };
  return labels[category] || category;
}

/**
 * Get color for talking point category
 */
export function getTalkingPointCategoryColor(category: TalkingPointCategory): string {
  const colors: Record<TalkingPointCategory, string> = {
    primary_message: 'text-blue-600',
    supporting_point: 'text-green-600',
    defensive_point: 'text-red-600',
    bridging_statement: 'text-purple-600',
    call_to_action: 'text-orange-600',
    stat_highlight: 'text-indigo-600',
    quote_suggestion: 'text-pink-600',
    pivot_phrase: 'text-yellow-600',
  };
  return colors[category] || 'text-gray-600';
}

/**
 * Get background color for talking point category
 */
export function getTalkingPointCategoryBgColor(category: TalkingPointCategory): string {
  const colors: Record<TalkingPointCategory, string> = {
    primary_message: 'bg-blue-50',
    supporting_point: 'bg-green-50',
    defensive_point: 'bg-red-50',
    bridging_statement: 'bg-purple-50',
    call_to_action: 'bg-orange-50',
    stat_highlight: 'bg-indigo-50',
    quote_suggestion: 'bg-pink-50',
    pivot_phrase: 'bg-yellow-50',
  };
  return colors[category] || 'bg-gray-50';
}

// ============================================================================
// HELPER FUNCTIONS - INSIGHT STRENGTH
// ============================================================================

/**
 * Get label for insight strength
 */
export function getInsightStrengthLabel(strength: InsightStrength): string {
  const labels: Record<InsightStrength, string> = {
    strong: 'Strong',
    moderate: 'Moderate',
    weak: 'Weak',
    speculative: 'Speculative',
  };
  return labels[strength] || strength;
}

/**
 * Get color for insight strength
 */
export function getInsightStrengthColor(strength: InsightStrength): string {
  const colors: Record<InsightStrength, string> = {
    strong: 'text-green-600',
    moderate: 'text-blue-600',
    weak: 'text-yellow-600',
    speculative: 'text-gray-600',
  };
  return colors[strength] || 'text-gray-600';
}

// ============================================================================
// HELPER FUNCTIONS - SOURCE TYPE
// ============================================================================

/**
 * Get label for source type
 */
export function getSourceTypeLabel(type: BriefingSourceType): string {
  const labels: Record<BriefingSourceType, string> = {
    press_release: 'Press Release',
    pitch: 'Pitch',
    media_mention: 'Media Mention',
    journalist_profile: 'Journalist Profile',
    media_list: 'Media List',
    audience_persona: 'Audience Persona',
    competitive_intel: 'Competitive Intel',
    performance_metric: 'Performance Metric',
    relationship_event: 'Relationship Event',
    enrichment_data: 'Enrichment Data',
    external_article: 'External Article',
    internal_note: 'Internal Note',
  };
  return labels[type] || type;
}

/**
 * Get icon for source type
 */
export function getSourceTypeIcon(type: BriefingSourceType): string {
  const icons: Record<BriefingSourceType, string> = {
    press_release: '📰',
    pitch: '✉️',
    media_mention: '📢',
    journalist_profile: '👤',
    media_list: '📋',
    audience_persona: '👥',
    competitive_intel: '🔍',
    performance_metric: '📊',
    relationship_event: '🤝',
    enrichment_data: '✨',
    external_article: '🔗',
    internal_note: '📝',
  };
  return icons[type] || '📄';
}

// ============================================================================
// HELPER FUNCTIONS - SCORES
// ============================================================================

/**
 * Format confidence score
 */
export function formatConfidenceScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'N/A';
  if (score >= 80) return `${score.toFixed(0)}% (High)`;
  if (score >= 60) return `${score.toFixed(0)}% (Good)`;
  if (score >= 40) return `${score.toFixed(0)}% (Fair)`;
  return `${score.toFixed(0)}% (Low)`;
}

/**
 * Get color for confidence score
 */
export function getConfidenceScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return 'text-gray-600';
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Format priority score
 */
export function formatPriorityScore(score: number): string {
  if (score >= 80) return 'High Priority';
  if (score >= 60) return 'Medium Priority';
  if (score >= 40) return 'Low Priority';
  return 'Very Low';
}

/**
 * Get color for priority score
 */
export function getPriorityScoreColor(score: number): string {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-gray-600';
}

// ============================================================================
// HELPER FUNCTIONS - DATES
// ============================================================================

/**
 * Format relative time
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ============================================================================
// HELPER FUNCTIONS - TOKENS & DURATION
// ============================================================================

/**
 * Format token count
 */
export function formatTokens(tokens: number | null | undefined): string {
  if (tokens === null || tokens === undefined) return 'N/A';
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toString();
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
