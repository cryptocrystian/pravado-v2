/**
 * Executive Board Report Types (Sprint S63)
 * Board Reporting & Quarterly Executive Pack Generator V1
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

export type ExecBoardReportFormat =
  | 'quarterly'
  | 'annual'
  | 'monthly'
  | 'board_meeting'
  | 'investor_update'
  | 'custom';

export type ExecBoardReportStatus =
  | 'draft'
  | 'generating'
  | 'review'
  | 'approved'
  | 'published'
  | 'archived';

export type ExecBoardReportSectionType =
  | 'executive_summary'
  | 'strategic_highlights'
  | 'kpi_dashboard'
  | 'financial_overview'
  | 'market_analysis'
  | 'risk_assessment'
  | 'brand_health'
  | 'media_coverage'
  | 'operational_updates'
  | 'talent_updates'
  | 'technology_updates'
  | 'sustainability'
  | 'forward_outlook'
  | 'action_items'
  | 'appendix';

export type ExecBoardReportSectionStatus =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'edited'
  | 'approved'
  | 'error';

export type ExecBoardReportAccessLevel = 'view' | 'comment' | 'approve';

export type ExecBoardReportTone = 'professional' | 'formal' | 'executive';

export type ExecBoardReportTargetLength = 'brief' | 'standard' | 'comprehensive';

// Label constants
export const EXEC_BOARD_REPORT_FORMAT_LABELS: Record<ExecBoardReportFormat, string> = {
  quarterly: 'Quarterly Report',
  annual: 'Annual Report',
  monthly: 'Monthly Summary',
  board_meeting: 'Board Meeting Pack',
  investor_update: 'Investor Update',
  custom: 'Custom Report',
};

export const EXEC_BOARD_REPORT_STATUS_LABELS: Record<ExecBoardReportStatus, string> = {
  draft: 'Draft',
  generating: 'Generating',
  review: 'In Review',
  approved: 'Approved',
  published: 'Published',
  archived: 'Archived',
};

export const EXEC_BOARD_REPORT_SECTION_TYPE_LABELS: Record<ExecBoardReportSectionType, string> = {
  executive_summary: 'Executive Summary',
  strategic_highlights: 'Strategic Highlights',
  kpi_dashboard: 'KPI Dashboard',
  financial_overview: 'Financial Overview',
  market_analysis: 'Market Analysis',
  risk_assessment: 'Risk Assessment',
  brand_health: 'Brand Health',
  media_coverage: 'Media Coverage',
  operational_updates: 'Operational Updates',
  talent_updates: 'Talent Updates',
  technology_updates: 'Technology Updates',
  sustainability: 'Sustainability & ESG',
  forward_outlook: 'Forward Outlook',
  action_items: 'Action Items',
  appendix: 'Appendix',
};

export const EXEC_BOARD_REPORT_SECTION_STATUS_LABELS: Record<ExecBoardReportSectionStatus, string> = {
  pending: 'Pending',
  generating: 'Generating',
  generated: 'Generated',
  edited: 'Edited',
  approved: 'Approved',
  error: 'Error',
};

export const EXEC_BOARD_REPORT_ACCESS_LEVEL_LABELS: Record<ExecBoardReportAccessLevel, string> = {
  view: 'View Only',
  comment: 'Can Comment',
  approve: 'Can Approve',
};

// Default section order for new reports
export const EXEC_BOARD_REPORT_SECTION_DEFAULT_ORDER: ExecBoardReportSectionType[] = [
  'executive_summary',
  'strategic_highlights',
  'kpi_dashboard',
  'financial_overview',
  'market_analysis',
  'risk_assessment',
  'brand_health',
  'forward_outlook',
  'action_items',
];

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * Executive Board Report - main report entity
 */
export interface ExecBoardReport {
  id: string;
  orgId: string;

  // Metadata
  title: string;
  description: string | null;
  format: ExecBoardReportFormat;
  status: ExecBoardReportStatus;

  // Time period
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  fiscalQuarter: string | null;
  fiscalYear: number | null;

  // Configuration
  templateConfig: Record<string, unknown>;
  sectionTypes: ExecBoardReportSectionType[];

  // Generation settings
  llmModel: string;
  tone: ExecBoardReportTone;
  targetLength: ExecBoardReportTargetLength;

  // Output artifacts
  pdfStoragePath: string | null;
  pptxStoragePath: string | null;
  htmlContent: string | null;

  // Approval workflow
  createdBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;

  // Generation metadata
  generationStartedAt: string | null;
  generationCompletedAt: string | null;
  generationDurationMs: number | null;
  totalTokensUsed: number;
  generationError: string | null;

  // Data sources
  dataSourcesUsed: Record<string, unknown>;

  // Archival
  isArchived: boolean;
  archivedAt: string | null;
  archivedBy: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Board Report Section - individual content section
 */
export interface ExecBoardReportSection {
  id: string;
  reportId: string;
  orgId: string;

  // Section metadata
  sectionType: ExecBoardReportSectionType;
  title: string;
  sortOrder: number;

  // Content
  content: string | null;
  contentHtml: string | null;
  summary: string | null;

  // Generation metadata
  status: ExecBoardReportSectionStatus;
  modelName: string | null;
  promptUsed: string | null;
  tokensUsed: number | null;
  generationDurationMs: number | null;
  generationError: string | null;

  // Source data
  sourceData: Record<string, unknown>;

  // Visibility and editing
  isVisible: boolean;
  isEditable: boolean;
  editedBy: string | null;
  editedAt: string | null;
  originalContent: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Board Report Data Source - tracks upstream data used
 */
export interface ExecBoardReportSource {
  id: string;
  reportId: string;
  sectionId: string | null;
  orgId: string;

  // Source identification
  sourceSystem: string;
  sourceSprint: string | null;
  sourceTable: string | null;
  sourceRecordIds: string[];

  // Data snapshot
  dataSnapshot: Record<string, unknown>;
  dataFetchedAt: string;

  // Timestamps
  createdAt: string;
}

/**
 * Board Report Audience - recipients and access control
 */
export interface ExecBoardReportAudience {
  id: string;
  reportId: string;
  orgId: string;

  // Recipient info
  userId: string | null;
  email: string;
  name: string | null;
  role: string | null;

  // Access control
  accessLevel: ExecBoardReportAccessLevel;
  isActive: boolean;

  // Delivery tracking
  lastSentAt: string | null;
  lastViewedAt: string | null;
  viewCount: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Board Report Audit Log - action trail
 */
export interface ExecBoardReportAuditLog {
  id: string;
  reportId: string;
  orgId: string;

  // Action info
  action: string;
  actorId: string | null;
  actorEmail: string | null;

  // Change details
  changes: Record<string, unknown>;
  sectionId: string | null;

  // Metadata
  ipAddress: string | null;
  userAgent: string | null;

  // Timestamp
  createdAt: string;
}

// ============================================================================
// EXTENDED TYPES
// ============================================================================

/**
 * Board report with counts for list views
 */
export interface ExecBoardReportWithCounts extends ExecBoardReport {
  sectionCount: number;
  audienceCount: number;
  completedSectionCount: number;
}

/**
 * Board report summary for cards/list items
 */
export interface ExecBoardReportSummary {
  id: string;
  title: string;
  format: ExecBoardReportFormat;
  status: ExecBoardReportStatus;
  periodStart: string;
  periodEnd: string;
  fiscalQuarter: string | null;
  sectionCount: number;
  audienceCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Full report with all relations
 */
export interface ExecBoardReportFull extends ExecBoardReport {
  sections: ExecBoardReportSection[];
  audience: ExecBoardReportAudience[];
  sources: ExecBoardReportSource[];
  recentAuditLogs: ExecBoardReportAuditLog[];
}

/**
 * KPI snapshot for board reports
 */
export interface ExecBoardReportKpiSnapshot {
  name: string;
  value: number | string;
  previousValue: number | string | null;
  change: number | null;
  changePercent: number | null;
  trend: 'up' | 'down' | 'stable';
  unit: string | null;
  source: string;
}

/**
 * Strategic insight for board reports
 */
export interface ExecBoardReportInsight {
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  source: string;
  recommendations: string[];
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Create board report input
 */
export interface CreateExecBoardReportInput {
  title: string;
  description?: string | null;
  format: ExecBoardReportFormat;
  periodStart: string;
  periodEnd: string;
  fiscalQuarter?: string | null;
  fiscalYear?: number | null;
  sectionTypes?: ExecBoardReportSectionType[];
  templateConfig?: Record<string, unknown>;
  llmModel?: string;
  tone?: ExecBoardReportTone;
  targetLength?: ExecBoardReportTargetLength;
}

/**
 * Update board report input
 */
export interface UpdateExecBoardReportInput {
  title?: string;
  description?: string | null;
  format?: ExecBoardReportFormat;
  status?: ExecBoardReportStatus;
  periodStart?: string;
  periodEnd?: string;
  fiscalQuarter?: string | null;
  fiscalYear?: number | null;
  sectionTypes?: ExecBoardReportSectionType[];
  templateConfig?: Record<string, unknown>;
  llmModel?: string;
  tone?: ExecBoardReportTone;
  targetLength?: ExecBoardReportTargetLength;
  isArchived?: boolean;
}

/**
 * Generate board report input
 */
export interface GenerateExecBoardReportInput {
  forceRegenerate?: boolean;
  sectionTypes?: ExecBoardReportSectionType[];
  generatePdf?: boolean;
  generatePptx?: boolean;
}

/**
 * Publish board report input
 */
export interface PublishExecBoardReportInput {
  notifyAudience?: boolean;
  regeneratePdf?: boolean;
  regeneratePptx?: boolean;
}

/**
 * Add audience member input
 */
export interface AddExecBoardReportAudienceInput {
  email: string;
  name?: string | null;
  role?: string | null;
  userId?: string | null;
  accessLevel?: ExecBoardReportAccessLevel;
}

/**
 * Update audience member input
 */
export interface UpdateExecBoardReportAudienceInput {
  name?: string | null;
  role?: string | null;
  accessLevel?: ExecBoardReportAccessLevel;
  isActive?: boolean;
}

/**
 * Update section input
 */
export interface UpdateExecBoardReportSectionInput {
  title?: string;
  content?: string | null;
  contentHtml?: string | null;
  summary?: string | null;
  isVisible?: boolean;
  sortOrder?: number;
}

/**
 * Update section order input
 */
export interface UpdateExecBoardReportSectionOrderInput {
  sections: Array<{ sectionId: string; sortOrder: number }>;
}

/**
 * Approve report input
 */
export interface ApproveExecBoardReportInput {
  comments?: string;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

/**
 * List board reports query params
 */
export interface ListExecBoardReportsQuery {
  format?: ExecBoardReportFormat;
  status?: ExecBoardReportStatus;
  fiscalYear?: number;
  fiscalQuarter?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'periodStart' | 'title';
  sortOrder?: 'asc' | 'desc';
}

/**
 * List audience query params
 */
export interface ListExecBoardReportAudienceQuery {
  reportId?: string;
  accessLevel?: ExecBoardReportAccessLevel;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * List audit logs query params
 */
export interface ListExecBoardReportAuditLogsQuery {
  reportId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * List board reports response
 */
export interface ListExecBoardReportsResponse {
  reports: ExecBoardReportWithCounts[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Get board report response
 */
export interface GetExecBoardReportResponse {
  report: ExecBoardReport;
  sections: ExecBoardReportSection[];
  audience: ExecBoardReportAudience[];
  sources: ExecBoardReportSource[];
}

/**
 * Generate board report response
 */
export interface GenerateExecBoardReportResponse {
  report: ExecBoardReport;
  sections: ExecBoardReportSection[];
  generationDurationMs: number;
  tokensUsed: number;
  pdfUrl: string | null;
  pptxUrl: string | null;
}

/**
 * Publish board report response
 */
export interface PublishExecBoardReportResponse {
  report: ExecBoardReport;
  notificationsSent: number;
  pdfUrl: string | null;
  pptxUrl: string | null;
}

/**
 * List audience response
 */
export interface ListExecBoardReportAudienceResponse {
  audience: ExecBoardReportAudience[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List audit logs response
 */
export interface ListExecBoardReportAuditLogsResponse {
  auditLogs: ExecBoardReportAuditLog[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Board report statistics
 */
export interface ExecBoardReportStats {
  totalReports: number;
  draftReports: number;
  publishedReports: number;
  archivedReports: number;
  reportsByFormat: Record<ExecBoardReportFormat, number>;
  reportsByStatus: Record<ExecBoardReportStatus, number>;
  totalAudienceMembers: number;
  totalSectionsGenerated: number;
  averageGenerationTimeMs: number;
  totalTokensUsed: number;
  reportsThisQuarter: number;
  lastPublishedAt: string | null;
}

// ============================================================================
// UPSTREAM DATA TYPES
// ============================================================================

/**
 * Aggregated data from upstream systems for report generation
 */
export interface ExecBoardReportAggregatedData {
  // From S61: Executive Command Center
  commandCenter?: {
    dashboards: unknown[];
    kpis: ExecBoardReportKpiSnapshot[];
    insights: ExecBoardReportInsight[];
  };

  // From S60: Risk Radar
  riskRadar?: {
    forecasts: unknown[];
    activeRisks: number;
    riskScore: number;
  };

  // From S55: Crisis Engine
  crisisEngine?: {
    activeIncidents: unknown[];
    resolvedIncidents: unknown[];
    crisisScore: number;
  };

  // From S56-57: Brand Reputation
  brandReputation?: {
    score: number;
    sentiment: unknown;
    alerts: unknown[];
  };

  // From S52: Media Performance
  mediaPerformance?: {
    metrics: unknown;
    topCoverage: unknown[];
    reachTotal: number;
  };

  // From S53: Competitive Intelligence
  competitiveIntel?: {
    reports: unknown[];
    competitorMoves: unknown[];
  };

  // From S59: Governance
  governance?: {
    complianceScore: number;
    pendingItems: unknown[];
  };

  // Metadata
  aggregatedAt: string;
  periodStart: string;
  periodEnd: string;
}
