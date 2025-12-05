/**
 * Sprint S64: Investor Relations Pack & Earnings Narrative Engine Types
 * Comprehensive type system for investor-ready content generation
 */

// ============================================================================
// ENUMS (mirror database enums)
// ============================================================================

/**
 * Investor pack format types
 */
export type InvestorPackFormat =
  | 'quarterly_earnings'
  | 'annual_review'
  | 'investor_day'
  | 'board_update'
  | 'fundraising_round'
  | 'custom';

/**
 * Investor pack status workflow
 */
export type InvestorPackStatus =
  | 'draft'
  | 'generating'
  | 'review'
  | 'approved'
  | 'published'
  | 'archived';

/**
 * Primary audience for investor pack
 */
export type InvestorPrimaryAudience =
  | 'board'
  | 'investors'
  | 'analysts'
  | 'internal_execs';

/**
 * Section types available in investor packs
 */
export type InvestorSectionType =
  | 'executive_summary'
  | 'highlights'
  | 'lowlights'
  | 'kpi_overview'
  | 'market_context'
  | 'competition'
  | 'product_updates'
  | 'go_to_market'
  | 'customer_stories'
  | 'risk_and_mitigations'
  | 'governance'
  | 'esg'
  | 'outlook'
  | 'appendix';

/**
 * Section content status
 */
export type InvestorSectionStatus =
  | 'draft'
  | 'generated'
  | 'edited'
  | 'approved';

/**
 * Source systems for data aggregation
 */
export type InvestorSourceSystem =
  | 'media_performance'
  | 'board_reports'
  | 'exec_digest'
  | 'exec_command_center'
  | 'risk_radar'
  | 'governance'
  | 'brand_reputation'
  | 'crisis'
  | 'media_briefings'
  | 'competitive_intel'
  | 'persona'
  | 'journalist_enrichment'
  | 'journalist_timeline'
  | 'media_lists'
  | 'journalist_graph'
  | 'pr_outreach'
  | 'media_monitoring'
  | 'pitch_engine'
  | 'pr_generator'
  | 'custom';

/**
 * Q&A categories for investor inquiries
 */
export type InvestorQnACategory =
  | 'financials'
  | 'strategy'
  | 'competition'
  | 'product'
  | 'risk'
  | 'governance'
  | 'operations'
  | 'other';

/**
 * Audit event types for investor packs
 */
export type InvestorEventType =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'section_generated'
  | 'section_regenerated'
  | 'section_edited'
  | 'qna_generated'
  | 'qna_created'
  | 'published'
  | 'archived';

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Summary JSON structure for investor pack
 */
export interface InvestorPackSummaryJson {
  revenue?: number;
  revenueGrowth?: number;
  ebitda?: number;
  sentimentScore?: number;
  riskScore?: number;
  keyMetrics?: Array<{
    name: string;
    value: number | string;
    change?: number;
    trend?: 'up' | 'down' | 'stable';
  }>;
  highlightsCount?: number;
  lowlightsCount?: number;
}

/**
 * Investor Pack - Main entity
 */
export interface InvestorPack {
  id: string;
  orgId: string;

  // Pack metadata
  title: string;
  description?: string | null;
  format: InvestorPackFormat;
  status: InvestorPackStatus;
  primaryAudience: InvestorPrimaryAudience;

  // Time period coverage
  periodStart: string;
  periodEnd: string;
  fiscalQuarter?: string | null;
  fiscalYear?: number | null;

  // Summary data
  summaryJson: InvestorPackSummaryJson;

  // Configuration
  sectionTypes: InvestorSectionType[];

  // Generation settings
  llmModel: string;
  tone: string;
  targetLength: string;

  // Output artifacts
  pdfStoragePath?: string | null;
  pptxStoragePath?: string | null;

  // Workflow tracking
  createdBy?: string | null;
  reviewedBy?: string | null;
  approvedBy?: string | null;
  reviewedAt?: string | null;
  approvedAt?: string | null;
  publishedAt?: string | null;

  // Generation metadata
  generationStartedAt?: string | null;
  generationCompletedAt?: string | null;
  generationDurationMs?: number | null;
  totalTokensUsed: number;
  generationError?: string | null;

  // Additional metadata
  meta: Record<string, unknown>;

  // Archival
  isArchived: boolean;
  archivedAt?: string | null;
  archivedBy?: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Investor Pack database record (snake_case)
 */
export interface InvestorPackRecord {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  format: InvestorPackFormat;
  status: InvestorPackStatus;
  primary_audience: InvestorPrimaryAudience;
  period_start: string;
  period_end: string;
  fiscal_quarter: string | null;
  fiscal_year: number | null;
  summary_json: InvestorPackSummaryJson;
  section_types: InvestorSectionType[];
  llm_model: string;
  tone: string;
  target_length: string;
  pdf_storage_path: string | null;
  pptx_storage_path: string | null;
  created_by: string | null;
  reviewed_by: string | null;
  approved_by: string | null;
  reviewed_at: string | null;
  approved_at: string | null;
  published_at: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  generation_duration_ms: number | null;
  total_tokens_used: number;
  generation_error: string | null;
  meta: Record<string, unknown>;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Raw LLM JSON structure for sections
 */
export interface InvestorSectionRawLlmJson {
  prompt?: string;
  response?: string;
  model?: string;
  tokensUsed?: number;
  durationMs?: number;
}

/**
 * Investor Pack Section
 */
export interface InvestorPackSection {
  id: string;
  packId: string;
  orgId: string;

  // Section metadata
  sectionType: InvestorSectionType;
  title: string;
  orderIndex: number;

  // Content
  contentMd?: string | null;
  contentHtml?: string | null;
  summary?: string | null;

  // Generation metadata
  status: InvestorSectionStatus;
  rawLlmJson: InvestorSectionRawLlmJson;

  // Source data used for generation
  sourceData: Record<string, unknown>;

  // Visibility and editing
  isVisible: boolean;
  editedBy?: string | null;
  editedAt?: string | null;
  originalContent?: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Investor Pack Section database record (snake_case)
 */
export interface InvestorPackSectionRecord {
  id: string;
  pack_id: string;
  org_id: string;
  section_type: InvestorSectionType;
  title: string;
  order_index: number;
  content_md: string | null;
  content_html: string | null;
  summary: string | null;
  status: InvestorSectionStatus;
  raw_llm_json: InvestorSectionRawLlmJson;
  source_data: Record<string, unknown>;
  is_visible: boolean;
  edited_by: string | null;
  edited_at: string | null;
  original_content: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Investor Pack Source
 */
export interface InvestorPackSource {
  id: string;
  packId: string;
  orgId: string;
  sectionId?: string | null;

  // Source identification
  sourceSystem: InvestorSourceSystem;
  sourceRefId?: string | null;
  sourceSprint?: string | null;

  // Weighting and relevance
  weight: number;
  relevanceScore?: number | null;

  // Data snapshot
  dataSnapshot: Record<string, unknown>;
  dataFetchedAt: string;

  // Additional metadata
  meta: Record<string, unknown>;

  // Timestamps
  createdAt: string;
}

/**
 * Investor Pack Source database record (snake_case)
 */
export interface InvestorPackSourceRecord {
  id: string;
  pack_id: string;
  org_id: string;
  section_id: string | null;
  source_system: InvestorSourceSystem;
  source_ref_id: string | null;
  source_sprint: string | null;
  weight: number;
  relevance_score: number | null;
  data_snapshot: Record<string, unknown>;
  data_fetched_at: string;
  meta: Record<string, unknown>;
  created_at: string;
}

/**
 * Source summary JSON structure for Q&A
 */
export interface InvestorQnASourceSummaryJson {
  sources?: Array<{
    system: InvestorSourceSystem;
    refId: string;
    relevance: number;
  }>;
  keyDataPoints?: string[];
}

/**
 * Investor Q&A Entry
 */
export interface InvestorQnA {
  id: string;
  orgId: string;
  packId?: string | null;

  // Q&A content
  question: string;
  answerMd: string;
  answerHtml?: string | null;

  // Classification
  category: InvestorQnACategory;
  tags: string[];

  // Confidence and source
  confidence: number;
  isLlmGenerated: boolean;
  sourceSummaryJson: InvestorQnASourceSummaryJson;

  // Usage tracking
  timesUsed: number;
  lastUsedAt?: string | null;

  // Workflow
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Investor Q&A database record (snake_case)
 */
export interface InvestorQnARecord {
  id: string;
  org_id: string;
  pack_id: string | null;
  question: string;
  answer_md: string;
  answer_html: string | null;
  category: InvestorQnACategory;
  tags: string[];
  confidence: number;
  is_llm_generated: boolean;
  source_summary_json: InvestorQnASourceSummaryJson;
  times_used: number;
  last_used_at: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Investor Pack Audit Log Entry
 */
export interface InvestorPackAuditLog {
  id: string;
  orgId: string;
  packId?: string | null;

  // Actor info
  userId?: string | null;
  userEmail?: string | null;

  // Event details
  eventType: InvestorEventType;
  detailsJson: Record<string, unknown>;

  // LLM usage tracking
  model?: string | null;
  tokensUsed?: number | null;
  durationMs?: number | null;

  // Section reference
  sectionId?: string | null;
  qnaId?: string | null;

  // Metadata
  ipAddress?: string | null;
  userAgent?: string | null;

  // Timestamp
  createdAt: string;
}

/**
 * Investor Pack Audit Log database record (snake_case)
 */
export interface InvestorPackAuditLogRecord {
  id: string;
  org_id: string;
  pack_id: string | null;
  user_id: string | null;
  user_email: string | null;
  event_type: InvestorEventType;
  details_json: Record<string, unknown>;
  model: string | null;
  tokens_used: number | null;
  duration_ms: number | null;
  section_id: string | null;
  qna_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create investor pack request
 */
export interface CreateInvestorPackRequest {
  title: string;
  description?: string;
  format?: InvestorPackFormat;
  primaryAudience?: InvestorPrimaryAudience;
  periodStart: string;
  periodEnd: string;
  fiscalQuarter?: string;
  fiscalYear?: number;
  sectionTypes?: InvestorSectionType[];
  llmModel?: string;
  tone?: string;
  targetLength?: string;
  meta?: Record<string, unknown>;
}

/**
 * Update investor pack request
 */
export interface UpdateInvestorPackRequest {
  title?: string;
  description?: string;
  format?: InvestorPackFormat;
  primaryAudience?: InvestorPrimaryAudience;
  periodStart?: string;
  periodEnd?: string;
  fiscalQuarter?: string;
  fiscalYear?: number;
  sectionTypes?: InvestorSectionType[];
  llmModel?: string;
  tone?: string;
  targetLength?: string;
  meta?: Record<string, unknown>;
}

/**
 * List investor packs query parameters
 */
export interface ListInvestorPacksQuery {
  status?: InvestorPackStatus | InvestorPackStatus[];
  format?: InvestorPackFormat | InvestorPackFormat[];
  primaryAudience?: InvestorPrimaryAudience;
  fiscalYear?: number;
  fiscalQuarter?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * List investor packs response
 */
export interface ListInvestorPacksResponse {
  packs: InvestorPack[];
  total: number;
  hasMore: boolean;
}

/**
 * Generate pack content request
 */
export interface GenerateInvestorPackRequest {
  regenerateSections?: InvestorSectionType[];
  sourceOverrides?: Partial<Record<InvestorSourceSystem, boolean>>;
}

/**
 * Generate pack content response
 */
export interface GenerateInvestorPackResponse {
  pack: InvestorPack;
  sections: InvestorPackSection[];
  sources: InvestorPackSource[];
  generationDurationMs: number;
  tokensUsed: number;
}

/**
 * Update section request
 */
export interface UpdateInvestorSectionRequest {
  contentMd?: string;
  title?: string;
  isVisible?: boolean;
}

/**
 * Regenerate section request
 */
export interface RegenerateInvestorSectionRequest {
  customPrompt?: string;
  sourceOverrides?: Partial<Record<InvestorSourceSystem, boolean>>;
}

/**
 * Reorder sections request
 */
export interface ReorderInvestorSectionsRequest {
  sectionOrder: Array<{
    sectionId: string;
    orderIndex: number;
  }>;
}

/**
 * Create Q&A request
 */
export interface CreateInvestorQnARequest {
  packId?: string;
  question: string;
  answerMd: string;
  category?: InvestorQnACategory;
  tags?: string[];
  confidence?: number;
}

/**
 * Update Q&A request
 */
export interface UpdateInvestorQnARequest {
  question?: string;
  answerMd?: string;
  category?: InvestorQnACategory;
  tags?: string[];
  confidence?: number;
  status?: string;
}

/**
 * Generate Q&A request
 */
export interface GenerateInvestorQnARequest {
  packId: string;
  categories?: InvestorQnACategory[];
  count?: number;
  customContext?: string;
}

/**
 * Generate Q&A response
 */
export interface GenerateInvestorQnAResponse {
  qnas: InvestorQnA[];
  tokensUsed: number;
  durationMs: number;
}

/**
 * List Q&A query parameters
 */
export interface ListInvestorQnAQuery {
  packId?: string;
  category?: InvestorQnACategory | InvestorQnACategory[];
  status?: string;
  minConfidence?: number;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

/**
 * List Q&A response
 */
export interface ListInvestorQnAResponse {
  qnas: InvestorQnA[];
  total: number;
  hasMore: boolean;
}

/**
 * Approve pack request
 */
export interface ApproveInvestorPackRequest {
  notes?: string;
}

/**
 * Publish pack request
 */
export interface PublishInvestorPackRequest {
  generatePdf?: boolean;
  generatePptx?: boolean;
}

/**
 * Publish pack response
 */
export interface PublishInvestorPackResponse {
  pack: InvestorPack;
  pdfUrl?: string;
  pptxUrl?: string;
}

/**
 * Archive pack request
 */
export interface ArchiveInvestorPackRequest {
  reason?: string;
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

/**
 * Investor pack statistics
 */
export interface InvestorPackStats {
  totalPacks: number;
  draftPacks: number;
  generatingPacks: number;
  reviewPacks: number;
  approvedPacks: number;
  publishedPacks: number;
  archivedPacks: number;
  totalSections: number;
  totalQnAs: number;
  approvedQnAs: number;
  totalTokensUsed: number;
  averageGenerationTimeMs: number;
  packsThisQuarter: number;
  lastPublishedAt?: string | null;
  byStatus: Record<InvestorPackStatus, number>;
  packsByFormat: Record<InvestorPackFormat, number>;
  recentPacks: InvestorPack[];
}

/**
 * Section generation stats
 */
export interface InvestorSectionStats {
  sectionType: InvestorSectionType;
  totalGenerated: number;
  totalEdited: number;
  averageTokensUsed: number;
  averageGenerationTimeMs: number;
}

/**
 * Q&A usage stats
 */
export interface InvestorQnAStats {
  totalQnAs: number;
  byCategory: Record<InvestorQnACategory, number>;
  byStatus: Record<string, number>;
  averageConfidence: number;
  llmGenerated: number;
  manuallyCreated: number;
  mostUsed: Array<{
    id: string;
    question: string;
    timesUsed: number;
  }>;
}

/**
 * Source system usage stats
 */
export interface InvestorSourceStats {
  bySystem: Record<InvestorSourceSystem, {
    count: number;
    averageRelevance: number;
  }>;
  totalSources: number;
  averageSourcesPerPack: number;
}

// ============================================================================
// AUDIT LOG QUERIES
// ============================================================================

/**
 * List audit log query parameters
 */
export interface ListInvestorAuditLogQuery {
  packId?: string;
  eventType?: InvestorEventType | InvestorEventType[];
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * List audit log response
 */
export interface ListInvestorAuditLogResponse {
  logs: InvestorPackAuditLog[];
  total: number;
  hasMore: boolean;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for investor pack format
 */
export function isInvestorPackFormat(value: string): value is InvestorPackFormat {
  return [
    'quarterly_earnings',
    'annual_review',
    'investor_day',
    'board_update',
    'fundraising_round',
    'custom',
  ].includes(value);
}

/**
 * Type guard for investor pack status
 */
export function isInvestorPackStatus(value: string): value is InvestorPackStatus {
  return ['draft', 'generating', 'review', 'approved', 'published', 'archived'].includes(value);
}

/**
 * Type guard for investor primary audience
 */
export function isInvestorPrimaryAudience(value: string): value is InvestorPrimaryAudience {
  return ['board', 'investors', 'analysts', 'internal_execs'].includes(value);
}

/**
 * Type guard for investor section type
 */
export function isInvestorSectionType(value: string): value is InvestorSectionType {
  return [
    'executive_summary',
    'highlights',
    'lowlights',
    'kpi_overview',
    'market_context',
    'competition',
    'product_updates',
    'go_to_market',
    'customer_stories',
    'risk_and_mitigations',
    'governance',
    'esg',
    'outlook',
    'appendix',
  ].includes(value);
}

/**
 * Type guard for investor section status
 */
export function isInvestorSectionStatus(value: string): value is InvestorSectionStatus {
  return ['draft', 'generated', 'edited', 'approved'].includes(value);
}

/**
 * Type guard for investor source system
 */
export function isInvestorSourceSystem(value: string): value is InvestorSourceSystem {
  return [
    'media_performance',
    'board_reports',
    'exec_digest',
    'exec_command_center',
    'risk_radar',
    'governance',
    'brand_reputation',
    'crisis',
    'media_briefings',
    'competitive_intel',
    'persona',
    'journalist_enrichment',
    'journalist_timeline',
    'media_lists',
    'journalist_graph',
    'pr_outreach',
    'media_monitoring',
    'pitch_engine',
    'pr_generator',
    'custom',
  ].includes(value);
}

/**
 * Type guard for investor Q&A category
 */
export function isInvestorQnACategory(value: string): value is InvestorQnACategory {
  return [
    'financials',
    'strategy',
    'competition',
    'product',
    'risk',
    'governance',
    'operations',
    'other',
  ].includes(value);
}

/**
 * Type guard for investor event type
 */
export function isInvestorEventType(value: string): value is InvestorEventType {
  return [
    'created',
    'updated',
    'status_changed',
    'section_generated',
    'section_regenerated',
    'section_edited',
    'qna_generated',
    'qna_created',
    'published',
    'archived',
  ].includes(value);
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Pack with sections included
 */
export interface InvestorPackWithSections extends InvestorPack {
  sections: InvestorPackSection[];
  qnas?: InvestorQnA[];
}

/**
 * Pack with all related data
 */
export interface InvestorPackFull extends InvestorPack {
  sections: InvestorPackSection[];
  sources: InvestorPackSource[];
  qnas: InvestorQnA[];
}

/**
 * Section type metadata for UI
 */
export interface InvestorSectionTypeMetadata {
  type: InvestorSectionType;
  label: string;
  description: string;
  icon?: string;
  defaultOrder: number;
  requiredSources: InvestorSourceSystem[];
}

/**
 * Format metadata for UI
 */
export interface InvestorFormatMetadata {
  format: InvestorPackFormat;
  label: string;
  description: string;
  icon?: string;
  defaultSections: InvestorSectionType[];
}

/**
 * Audience metadata for UI
 */
export interface InvestorAudienceMetadata {
  audience: InvestorPrimaryAudience;
  label: string;
  description: string;
  icon?: string;
  toneRecommendation: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default sections for quarterly earnings format
 */
export const DEFAULT_QUARTERLY_EARNINGS_SECTIONS: InvestorSectionType[] = [
  'executive_summary',
  'highlights',
  'lowlights',
  'kpi_overview',
  'market_context',
  'competition',
  'risk_and_mitigations',
  'outlook',
];

/**
 * Default sections for annual review format
 */
export const DEFAULT_ANNUAL_REVIEW_SECTIONS: InvestorSectionType[] = [
  'executive_summary',
  'highlights',
  'lowlights',
  'kpi_overview',
  'market_context',
  'competition',
  'product_updates',
  'go_to_market',
  'customer_stories',
  'risk_and_mitigations',
  'governance',
  'esg',
  'outlook',
];

/**
 * Section type labels
 */
export const INVESTOR_SECTION_TYPE_LABELS: Record<InvestorSectionType, string> = {
  executive_summary: 'Executive Summary',
  highlights: 'Key Highlights',
  lowlights: 'Challenges & Learnings',
  kpi_overview: 'KPI Dashboard',
  market_context: 'Market Environment',
  competition: 'Competitive Landscape',
  product_updates: 'Product & Technology',
  go_to_market: 'Go-to-Market Strategy',
  customer_stories: 'Customer Success',
  risk_and_mitigations: 'Risk Analysis',
  governance: 'Governance & Compliance',
  esg: 'ESG & Sustainability',
  outlook: 'Forward Outlook',
  appendix: 'Appendix',
};

/**
 * Format labels
 */
export const INVESTOR_FORMAT_LABELS: Record<InvestorPackFormat, string> = {
  quarterly_earnings: 'Quarterly Earnings',
  annual_review: 'Annual Review',
  investor_day: 'Investor Day',
  board_update: 'Board Update',
  fundraising_round: 'Fundraising Materials',
  custom: 'Custom Format',
};

/**
 * Status labels
 */
export const INVESTOR_STATUS_LABELS: Record<InvestorPackStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  review: 'In Review',
  approved: 'Approved',
  published: 'Published',
  archived: 'Archived',
};

/**
 * Audience labels
 */
export const INVESTOR_AUDIENCE_LABELS: Record<InvestorPrimaryAudience, string> = {
  board: 'Board of Directors',
  investors: 'Institutional Investors',
  analysts: 'Financial Analysts',
  internal_execs: 'Internal Executives',
};

/**
 * Q&A category labels
 */
export const INVESTOR_QNA_CATEGORY_LABELS: Record<InvestorQnACategory, string> = {
  financials: 'Financial Questions',
  strategy: 'Strategic Direction',
  competition: 'Competitive Positioning',
  product: 'Product & Technology',
  risk: 'Risk Factors',
  governance: 'Governance & Compliance',
  operations: 'Operational Matters',
  other: 'Other Questions',
};
