/**
 * Investor Relations API Client (Sprint S64)
 * Investor Relations Pack & Earnings Narrative Engine V1
 *
 * Type-safe client functions for investor relations API endpoints
 * plus helper utilities for formatting and display.
 */

import type {
  InvestorPack,
  InvestorPackSection,
  InvestorPackSource,
  InvestorQnA,
  InvestorPackAuditLog,
  InvestorPackFormat,
  InvestorPackStatus,
  InvestorSectionType,
  InvestorSectionStatus,
  InvestorPrimaryAudience,
  InvestorQnACategory,
  InvestorPackWithSections,
  InvestorPackStats,
  ListInvestorPacksResponse,
  GenerateInvestorPackResponse,
  PublishInvestorPackResponse,
  ListInvestorQnAResponse,
  GenerateInvestorQnAResponse,
  ListInvestorAuditLogResponse,
} from '@pravado/types';
import {
  INVESTOR_FORMAT_LABELS,
  INVESTOR_STATUS_LABELS,
  INVESTOR_SECTION_TYPE_LABELS,
  INVESTOR_AUDIENCE_LABELS,
  INVESTOR_QNA_CATEGORY_LABELS,
} from '@pravado/types';
import type {
  CreateInvestorPack,
  UpdateInvestorPack,
  ListInvestorPacksQuery,
  GenerateInvestorPack,
  UpdateInvestorSection,
  RegenerateInvestorSection,
  ReorderInvestorSections,
  CreateInvestorQnA,
  UpdateInvestorQnA,
  GenerateInvestorQnA,
  ListInvestorQnAQuery,
  ApproveInvestorPack,
  PublishInvestorPack,
  ArchiveInvestorPack,
  ListInvestorAuditLogQuery,
} from '@pravado/validators';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_PREFIX = '/api/v1/investor-relations';

// Re-export types for components
export type {
  InvestorPack,
  InvestorPackSection,
  InvestorPackSource,
  InvestorQnA,
  InvestorPackAuditLog,
  InvestorPackFormat,
  InvestorPackStatus,
  InvestorSectionType,
  InvestorSectionStatus,
  InvestorPrimaryAudience,
  InvestorQnACategory,
  InvestorPackWithSections,
  InvestorPackStats,
  ListInvestorPacksResponse,
  GenerateInvestorPackResponse,
  PublishInvestorPackResponse,
  ListInvestorQnAResponse,
  GenerateInvestorQnAResponse,
  ListInvestorAuditLogResponse,
  CreateInvestorPack,
  UpdateInvestorPack,
  ListInvestorPacksQuery,
  GenerateInvestorPack,
  UpdateInvestorSection,
  RegenerateInvestorSection,
  ReorderInvestorSections,
  CreateInvestorQnA,
  UpdateInvestorQnA,
  GenerateInvestorQnA,
  ListInvestorQnAQuery,
  ApproveInvestorPack,
  PublishInvestorPack,
  ArchiveInvestorPack,
  ListInvestorAuditLogQuery,
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
// PACK CRUD API
// ============================================================================

/**
 * List investor packs with optional filters
 */
export async function listPacks(
  query: Partial<ListInvestorPacksQuery> = {}
): Promise<ListInvestorPacksResponse> {
  const qs = buildQueryString(query as Record<string, unknown>);
  const endpoint = qs ? `?${qs}` : '';
  const result = await apiClient<ListInvestorPacksResponse>(endpoint);
  return result.data!;
}

/**
 * Get a single investor pack with sections
 */
export async function getPack(packId: string): Promise<InvestorPackWithSections> {
  const result = await apiClient<InvestorPackWithSections>(`/${packId}`);
  return result.data!;
}

/**
 * Create a new investor pack
 */
export async function createPack(input: CreateInvestorPack): Promise<InvestorPack> {
  const result = await apiClient<InvestorPack>('', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Update an investor pack
 */
export async function updatePack(
  packId: string,
  input: UpdateInvestorPack
): Promise<InvestorPack> {
  const result = await apiClient<InvestorPack>(`/${packId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Delete an investor pack
 */
export async function deletePack(packId: string): Promise<void> {
  await apiClient(`/${packId}`, { method: 'DELETE' });
}

/**
 * Archive an investor pack
 */
export async function archivePack(
  packId: string,
  input: ArchiveInvestorPack = {}
): Promise<InvestorPack> {
  const result = await apiClient<InvestorPack>(`/${packId}/archive`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Get pack statistics for the organization
 */
export async function getStats(): Promise<InvestorPackStats> {
  const result = await apiClient<InvestorPackStats>('/stats');
  return result.data!;
}

// ============================================================================
// PACK WORKFLOW API
// ============================================================================

/**
 * Generate or regenerate pack content
 */
export async function generatePack(
  packId: string,
  input: GenerateInvestorPack = {}
): Promise<GenerateInvestorPackResponse> {
  const result = await apiClient<GenerateInvestorPackResponse>(`/${packId}/generate`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Approve an investor pack
 */
export async function approvePack(
  packId: string,
  input: ApproveInvestorPack = {}
): Promise<InvestorPack> {
  const result = await apiClient<InvestorPack>(`/${packId}/approve`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Publish an investor pack
 */
export async function publishPack(
  packId: string,
  input: Partial<PublishInvestorPack> = {}
): Promise<PublishInvestorPackResponse> {
  const result = await apiClient<PublishInvestorPackResponse>(`/${packId}/publish`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

// ============================================================================
// SECTION MANAGEMENT API
// ============================================================================

/**
 * Update a pack section
 */
export async function updateSection(
  packId: string,
  sectionId: string,
  input: UpdateInvestorSection
): Promise<InvestorPackSection> {
  const result = await apiClient<InvestorPackSection>(`/${packId}/sections/${sectionId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Regenerate a specific section
 */
export async function regenerateSection(
  packId: string,
  sectionId: string,
  input: RegenerateInvestorSection = {}
): Promise<InvestorPackSection> {
  const result = await apiClient<InvestorPackSection>(
    `/${packId}/sections/${sectionId}/regenerate`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    }
  );
  return result.data!;
}

/**
 * Reorder pack sections
 */
export async function reorderSections(
  packId: string,
  input: ReorderInvestorSections
): Promise<InvestorPackSection[]> {
  const result = await apiClient<InvestorPackSection[]>(`/${packId}/sections/reorder`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

// ============================================================================
// Q&A MANAGEMENT API
// ============================================================================

/**
 * List Q&A entries with optional filters
 */
export async function listQnAs(
  query: Partial<ListInvestorQnAQuery> = {}
): Promise<ListInvestorQnAResponse> {
  const qs = buildQueryString(query as Record<string, unknown>);
  const endpoint = `/qna${qs ? `?${qs}` : ''}`;
  const result = await apiClient<ListInvestorQnAResponse>(endpoint);
  return result.data!;
}

/**
 * Create a Q&A entry manually
 */
export async function createQnA(input: CreateInvestorQnA): Promise<InvestorQnA> {
  const result = await apiClient<InvestorQnA>('/qna', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Generate Q&A entries using AI
 */
export async function generateQnAs(
  input: GenerateInvestorQnA
): Promise<GenerateInvestorQnAResponse> {
  const result = await apiClient<GenerateInvestorQnAResponse>('/qna/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Update a Q&A entry
 */
export async function updateQnA(
  qnaId: string,
  input: UpdateInvestorQnA
): Promise<InvestorQnA> {
  const result = await apiClient<InvestorQnA>(`/qna/${qnaId}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  return result.data!;
}

/**
 * Delete a Q&A entry
 */
export async function deleteQnA(qnaId: string): Promise<void> {
  await apiClient(`/qna/${qnaId}`, { method: 'DELETE' });
}

/**
 * Approve a Q&A entry
 */
export async function approveQnA(qnaId: string): Promise<InvestorQnA> {
  const result = await apiClient<InvestorQnA>(`/qna/${qnaId}/approve`, {
    method: 'POST',
  });
  return result.data!;
}

// ============================================================================
// AUDIT LOG API
// ============================================================================

/**
 * List audit log entries
 */
export async function listAuditLogs(
  query: Partial<ListInvestorAuditLogQuery> = {}
): Promise<ListInvestorAuditLogResponse> {
  const qs = buildQueryString(query as Record<string, unknown>);
  const endpoint = `/audit${qs ? `?${qs}` : ''}`;
  const result = await apiClient<ListInvestorAuditLogResponse>(endpoint);
  return result.data!;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get display label for pack format
 */
export function getFormatLabel(format: InvestorPackFormat): string {
  return INVESTOR_FORMAT_LABELS[format] || format;
}

/**
 * Get display label for pack status
 */
export function getStatusLabel(status: InvestorPackStatus): string {
  return INVESTOR_STATUS_LABELS[status] || status;
}

/**
 * Get status color for UI styling
 */
export function getStatusColor(status: InvestorPackStatus): string {
  const colors: Record<InvestorPackStatus, string> = {
    draft: 'yellow',
    generating: 'blue',
    review: 'indigo',
    approved: 'green',
    published: 'green',
    archived: 'gray',
  };
  return colors[status] || 'gray';
}

/**
 * Get display label for section type
 */
export function getSectionTypeLabel(sectionType: InvestorSectionType): string {
  return INVESTOR_SECTION_TYPE_LABELS[sectionType] || sectionType;
}

/**
 * Get display label for audience type
 */
export function getAudienceLabel(audience: InvestorPrimaryAudience): string {
  return INVESTOR_AUDIENCE_LABELS[audience] || audience;
}

/**
 * Get display label for Q&A category
 */
export function getQnACategoryLabel(category: InvestorQnACategory): string {
  return INVESTOR_QNA_CATEGORY_LABELS[category] || category;
}

/**
 * Format period range for display
 */
export function formatPeriodRange(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
}

/**
 * Format fiscal quarter for display
 */
export function formatFiscalQuarter(quarter?: string | null, year?: number | null): string {
  if (!quarter) return '';
  if (!year) return quarter;
  return `${quarter} ${year}`;
}

/**
 * Format relative time for display
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format duration in milliseconds to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format token count for display
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return tokens.toString();
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(2)}M`;
}

/**
 * Get section icon name for UI
 */
export function getSectionIcon(sectionType: InvestorSectionType): string {
  const icons: Record<InvestorSectionType, string> = {
    executive_summary: 'FileText',
    highlights: 'Star',
    lowlights: 'AlertTriangle',
    kpi_overview: 'BarChart',
    market_context: 'Globe',
    competition: 'Users',
    product_updates: 'Package',
    go_to_market: 'Target',
    customer_stories: 'MessageCircle',
    risk_and_mitigations: 'Shield',
    governance: 'Scale',
    esg: 'Leaf',
    outlook: 'TrendingUp',
    appendix: 'Paperclip',
  };
  return icons[sectionType] || 'FileText';
}

/**
 * Get Q&A category icon name for UI
 */
export function getQnACategoryIcon(category: InvestorQnACategory): string {
  const icons: Record<InvestorQnACategory, string> = {
    financials: 'DollarSign',
    strategy: 'Target',
    competition: 'Users',
    product: 'Package',
    risk: 'AlertTriangle',
    governance: 'Scale',
    operations: 'Settings',
    other: 'HelpCircle',
  };
  return icons[category] || 'HelpCircle';
}

/**
 * Check if a pack can be generated
 */
export function canGenerate(pack: InvestorPack): boolean {
  return pack.status === 'draft' || pack.status === 'review';
}

/**
 * Check if a pack can be approved
 */
export function canApprove(pack: InvestorPack): boolean {
  return pack.status === 'review';
}

/**
 * Check if a pack can be published
 */
export function canPublish(pack: InvestorPack): boolean {
  return pack.status === 'approved';
}
