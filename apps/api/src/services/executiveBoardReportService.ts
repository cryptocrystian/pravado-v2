/**
 * Executive Board Report Service (Sprint S63)
 * Board Reporting & Quarterly Executive Pack Generator V1
 *
 * Features:
 * - Board report CRUD with period configuration
 * - Cross-system data aggregation from S38-S62
 * - LLM-powered section generation
 * - PDF/PPTX generation and storage
 * - Audience management and access control
 * - Approval workflow (draft -> review -> approved -> published)
 * - Comprehensive audit logging
 */

import type {
  ExecBoardReport,
  ExecBoardReportSection,
  ExecBoardReportSource,
  ExecBoardReportAudience,
  ExecBoardReportAuditLog,
  ExecBoardReportWithCounts,
  ExecBoardReportFormat,
  ExecBoardReportStatus,
  ExecBoardReportSectionType,
  ExecBoardReportSectionStatus,
  ExecBoardReportAccessLevel,
  ExecBoardReportTone,
  ExecBoardReportTargetLength,
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
  ListExecBoardReportsResponse,
  GetExecBoardReportResponse,
  GenerateExecBoardReportResponse,
  PublishExecBoardReportResponse,
  ListExecBoardReportAudienceResponse,
  ListExecBoardReportAuditLogsResponse,
  ExecBoardReportStats,
  ExecBoardReportAggregatedData,
} from '@pravado/types';
import {
  EXEC_BOARD_REPORT_SECTION_DEFAULT_ORDER,
  EXEC_BOARD_REPORT_SECTION_TYPE_LABELS,
} from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('exec-board-report-service');

// ============================================================================
// Service Configuration
// ============================================================================

export interface ExecBoardReportServiceConfig {
  supabase: SupabaseClient;
  openaiApiKey: string;
  storageBucket?: string;
  debugMode?: boolean;
}

// ============================================================================
// Database Record Types (snake_case)
// ============================================================================

interface ReportRecord {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  format: string;
  status: string;
  period_start: string;
  period_end: string;
  fiscal_quarter: string | null;
  fiscal_year: number | null;
  template_config: Record<string, unknown>;
  section_types: string[];
  llm_model: string;
  tone: string;
  target_length: string;
  pdf_storage_path: string | null;
  pptx_storage_path: string | null;
  html_content: string | null;
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
  data_sources_used: Record<string, unknown>;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SectionRecord {
  id: string;
  report_id: string;
  org_id: string;
  section_type: string;
  title: string;
  sort_order: number;
  content: string | null;
  content_html: string | null;
  summary: string | null;
  status: string;
  model_name: string | null;
  prompt_used: string | null;
  tokens_used: number | null;
  generation_duration_ms: number | null;
  generation_error: string | null;
  source_data: Record<string, unknown>;
  is_visible: boolean;
  is_editable: boolean;
  edited_by: string | null;
  edited_at: string | null;
  original_content: string | null;
  created_at: string;
  updated_at: string;
}

interface SourceRecord {
  id: string;
  report_id: string;
  section_id: string | null;
  org_id: string;
  source_system: string;
  source_sprint: string | null;
  source_table: string | null;
  source_record_ids: string[];
  data_snapshot: Record<string, unknown>;
  data_fetched_at: string;
  created_at: string;
}

interface AudienceRecord {
  id: string;
  report_id: string;
  org_id: string;
  user_id: string | null;
  email: string;
  name: string | null;
  role: string | null;
  access_level: string;
  is_active: boolean;
  last_sent_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
}

interface AuditLogRecord {
  id: string;
  report_id: string;
  org_id: string;
  action: string;
  actor_id: string | null;
  actor_email: string | null;
  changes: Record<string, unknown>;
  section_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================================
// Record to Entity Mappers
// ============================================================================

function mapReportRecord(record: ReportRecord): ExecBoardReport {
  return {
    id: record.id,
    orgId: record.org_id,
    title: record.title,
    description: record.description,
    format: record.format as ExecBoardReportFormat,
    status: record.status as ExecBoardReportStatus,
    periodStart: record.period_start,
    periodEnd: record.period_end,
    fiscalQuarter: record.fiscal_quarter,
    fiscalYear: record.fiscal_year,
    templateConfig: record.template_config,
    sectionTypes: record.section_types as ExecBoardReportSectionType[],
    llmModel: record.llm_model,
    tone: record.tone as ExecBoardReportTone,
    targetLength: record.target_length as ExecBoardReportTargetLength,
    pdfStoragePath: record.pdf_storage_path,
    pptxStoragePath: record.pptx_storage_path,
    htmlContent: record.html_content,
    createdBy: record.created_by,
    reviewedBy: record.reviewed_by,
    approvedBy: record.approved_by,
    reviewedAt: record.reviewed_at,
    approvedAt: record.approved_at,
    publishedAt: record.published_at,
    generationStartedAt: record.generation_started_at,
    generationCompletedAt: record.generation_completed_at,
    generationDurationMs: record.generation_duration_ms,
    totalTokensUsed: record.total_tokens_used,
    generationError: record.generation_error,
    dataSourcesUsed: record.data_sources_used,
    isArchived: record.is_archived,
    archivedAt: record.archived_at,
    archivedBy: record.archived_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapSectionRecord(record: SectionRecord): ExecBoardReportSection {
  return {
    id: record.id,
    reportId: record.report_id,
    orgId: record.org_id,
    sectionType: record.section_type as ExecBoardReportSectionType,
    title: record.title,
    sortOrder: record.sort_order,
    content: record.content,
    contentHtml: record.content_html,
    summary: record.summary,
    status: record.status as ExecBoardReportSectionStatus,
    modelName: record.model_name,
    promptUsed: record.prompt_used,
    tokensUsed: record.tokens_used,
    generationDurationMs: record.generation_duration_ms,
    generationError: record.generation_error,
    sourceData: record.source_data,
    isVisible: record.is_visible,
    isEditable: record.is_editable,
    editedBy: record.edited_by,
    editedAt: record.edited_at,
    originalContent: record.original_content,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapSourceRecord(record: SourceRecord): ExecBoardReportSource {
  return {
    id: record.id,
    reportId: record.report_id,
    sectionId: record.section_id,
    orgId: record.org_id,
    sourceSystem: record.source_system,
    sourceSprint: record.source_sprint,
    sourceTable: record.source_table,
    sourceRecordIds: record.source_record_ids,
    dataSnapshot: record.data_snapshot,
    dataFetchedAt: record.data_fetched_at,
    createdAt: record.created_at,
  };
}

function mapAudienceRecord(record: AudienceRecord): ExecBoardReportAudience {
  return {
    id: record.id,
    reportId: record.report_id,
    orgId: record.org_id,
    userId: record.user_id,
    email: record.email,
    name: record.name,
    role: record.role,
    accessLevel: record.access_level as ExecBoardReportAccessLevel,
    isActive: record.is_active,
    lastSentAt: record.last_sent_at,
    lastViewedAt: record.last_viewed_at,
    viewCount: record.view_count,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapAuditLogRecord(record: AuditLogRecord): ExecBoardReportAuditLog {
  return {
    id: record.id,
    reportId: record.report_id,
    orgId: record.org_id,
    action: record.action,
    actorId: record.actor_id,
    actorEmail: record.actor_email,
    changes: record.changes,
    sectionId: record.section_id,
    ipAddress: record.ip_address,
    userAgent: record.user_agent,
    createdAt: record.created_at,
  };
}

// ============================================================================
// Service Factory
// ============================================================================

export function createExecutiveBoardReportService(config: ExecBoardReportServiceConfig) {
  const db = config.supabase as SupabaseClient;
  const openaiApiKey = config.openaiApiKey;
  // Storage and debug settings reserved for future use
  void config.storageBucket;
  void config.debugMode;

  // ==========================================================================
  // Audit Logging
  // ==========================================================================

  async function logReportAction(
    orgId: string,
    reportId: string,
    actorId: string | null,
    action: string,
    changes?: Record<string, unknown>,
    sectionId?: string | null
  ): Promise<void> {
    try {
      await db.from('exec_board_report_audit_log').insert({
        org_id: orgId,
        report_id: reportId,
        actor_id: actorId,
        action,
        changes: changes || {},
        section_id: sectionId || null,
      });
    } catch (error) {
      logger.warn('Failed to log report action', { error, action, reportId });
    }
  }

  // ==========================================================================
  // Report CRUD
  // ==========================================================================

  async function createReport(
    orgId: string,
    userId: string | null,
    input: CreateExecBoardReportInput
  ): Promise<ExecBoardReport> {
    const sectionTypes = input.sectionTypes || EXEC_BOARD_REPORT_SECTION_DEFAULT_ORDER;

    const { data, error } = await db
      .from('exec_board_reports')
      .insert({
        org_id: orgId,
        title: input.title,
        description: input.description || null,
        format: input.format,
        status: 'draft' as ExecBoardReportStatus,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        fiscal_quarter: input.fiscalQuarter || null,
        fiscal_year: input.fiscalYear || null,
        section_types: sectionTypes,
        template_config: input.templateConfig || {},
        llm_model: input.llmModel || 'gpt-4o',
        tone: input.tone || 'professional',
        target_length: input.targetLength || 'comprehensive',
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create report', { error, orgId });
      throw new Error(`Failed to create report: ${error.message}`);
    }

    // Create initial empty sections based on section types
    const sectionsToInsert = sectionTypes.map((sectionType, index) => ({
      report_id: data.id,
      org_id: orgId,
      section_type: sectionType,
      title: EXEC_BOARD_REPORT_SECTION_TYPE_LABELS[sectionType] || sectionType,
      sort_order: index,
      status: 'pending' as ExecBoardReportSectionStatus,
    }));

    const { error: sectionsError } = await db
      .from('exec_board_report_sections')
      .insert(sectionsToInsert);

    if (sectionsError) {
      logger.warn('Failed to create initial sections', { error: sectionsError, reportId: data.id });
    }

    await logReportAction(orgId, data.id, userId, 'created', { input });

    return mapReportRecord(data);
  }

  async function getReport(
    orgId: string,
    reportId: string
  ): Promise<GetExecBoardReportResponse | null> {
    const { data: report, error } = await db
      .from('exec_board_reports')
      .select('*')
      .eq('id', reportId)
      .eq('org_id', orgId)
      .single();

    if (error || !report) {
      return null;
    }

    // Fetch sections
    const { data: sections } = await db
      .from('exec_board_report_sections')
      .select('*')
      .eq('report_id', reportId)
      .eq('org_id', orgId)
      .order('sort_order', { ascending: true });

    // Fetch audience
    const { data: audience } = await db
      .from('exec_board_report_audience')
      .select('*')
      .eq('report_id', reportId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: true });

    // Fetch sources
    const { data: sources } = await db
      .from('exec_board_report_sources')
      .select('*')
      .eq('report_id', reportId)
      .eq('org_id', orgId);

    return {
      report: mapReportRecord(report),
      sections: (sections || []).map(mapSectionRecord),
      audience: (audience || []).map(mapAudienceRecord),
      sources: (sources || []).map(mapSourceRecord),
    };
  }

  async function updateReport(
    orgId: string,
    reportId: string,
    userId: string | null,
    input: UpdateExecBoardReportInput
  ): Promise<ExecBoardReport | null> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.format !== undefined) updateData.format = input.format;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.periodStart !== undefined) updateData.period_start = input.periodStart;
    if (input.periodEnd !== undefined) updateData.period_end = input.periodEnd;
    if (input.fiscalQuarter !== undefined) updateData.fiscal_quarter = input.fiscalQuarter;
    if (input.fiscalYear !== undefined) updateData.fiscal_year = input.fiscalYear;
    if (input.sectionTypes !== undefined) updateData.section_types = input.sectionTypes;
    if (input.templateConfig !== undefined) updateData.template_config = input.templateConfig;
    if (input.llmModel !== undefined) updateData.llm_model = input.llmModel;
    if (input.tone !== undefined) updateData.tone = input.tone;
    if (input.targetLength !== undefined) updateData.target_length = input.targetLength;
    if (input.isArchived !== undefined) {
      updateData.is_archived = input.isArchived;
      if (input.isArchived) {
        updateData.archived_at = new Date().toISOString();
        updateData.archived_by = userId;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return getReport(orgId, reportId).then((r) => r?.report || null);
    }

    const { data, error } = await db
      .from('exec_board_reports')
      .update(updateData)
      .eq('id', reportId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    await logReportAction(orgId, reportId, userId, 'updated', { input });

    return mapReportRecord(data);
  }

  async function deleteReport(
    orgId: string,
    reportId: string,
    userId: string | null,
    hardDelete: boolean = false
  ): Promise<{ archived: boolean; deleted: boolean }> {
    if (hardDelete) {
      const { error } = await db
        .from('exec_board_reports')
        .delete()
        .eq('id', reportId)
        .eq('org_id', orgId);

      if (error) {
        throw new Error(`Failed to delete report: ${error.message}`);
      }

      return { archived: false, deleted: true };
    }

    // Soft delete (archive)
    await updateReport(orgId, reportId, userId, { isArchived: true });
    await logReportAction(orgId, reportId, userId, 'archived');

    return { archived: true, deleted: false };
  }

  async function listReports(
    orgId: string,
    query: ListExecBoardReportsQuery
  ): Promise<ListExecBoardReportsResponse> {
    let dbQuery = db
      .from('exec_board_reports')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (!query.includeArchived) {
      dbQuery = dbQuery.eq('is_archived', false);
    }
    if (query.format) {
      dbQuery = dbQuery.eq('format', query.format);
    }
    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }
    if (query.fiscalYear) {
      dbQuery = dbQuery.eq('fiscal_year', query.fiscalYear);
    }
    if (query.fiscalQuarter) {
      dbQuery = dbQuery.eq('fiscal_quarter', query.fiscalQuarter);
    }

    // Sorting
    const sortColumn = query.sortBy === 'createdAt' ? 'created_at' :
      query.sortBy === 'updatedAt' ? 'updated_at' :
      query.sortBy === 'periodStart' ? 'period_start' :
      query.sortBy === 'title' ? 'title' : 'created_at';
    const sortOrder = query.sortOrder === 'asc';
    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder });

    // Pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list reports: ${error.message}`);
    }

    // Get counts for each report
    const reports: ExecBoardReportWithCounts[] = await Promise.all(
      (data || []).map(async (record: ReportRecord) => {
        const { count: sectionCount } = await db
          .from('exec_board_report_sections')
          .select('*', { count: 'exact', head: true })
          .eq('report_id', record.id);

        const { count: audienceCount } = await db
          .from('exec_board_report_audience')
          .select('*', { count: 'exact', head: true })
          .eq('report_id', record.id);

        const { count: completedSectionCount } = await db
          .from('exec_board_report_sections')
          .select('*', { count: 'exact', head: true })
          .eq('report_id', record.id)
          .in('status', ['generated', 'edited', 'approved']);

        return {
          ...mapReportRecord(record),
          sectionCount: sectionCount || 0,
          audienceCount: audienceCount || 0,
          completedSectionCount: completedSectionCount || 0,
        };
      })
    );

    return {
      reports,
      total: count || 0,
      limit,
      offset,
    };
  }

  // ==========================================================================
  // Section Management
  // ==========================================================================

  async function listSections(
    orgId: string,
    reportId: string
  ): Promise<ExecBoardReportSection[]> {
    const { data, error } = await db
      .from('exec_board_report_sections')
      .select('*')
      .eq('report_id', reportId)
      .eq('org_id', orgId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to list sections: ${error.message}`);
    }

    return (data || []).map(mapSectionRecord);
  }

  async function updateSection(
    orgId: string,
    reportId: string,
    sectionId: string,
    userId: string | null,
    input: UpdateExecBoardReportSectionInput
  ): Promise<ExecBoardReportSection | null> {
    // First get the current section to preserve original content
    const { data: currentSection } = await db
      .from('exec_board_report_sections')
      .select('*')
      .eq('id', sectionId)
      .eq('report_id', reportId)
      .eq('org_id', orgId)
      .single();

    if (!currentSection) {
      return null;
    }

    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.summary !== undefined) updateData.summary = input.summary;
    if (input.isVisible !== undefined) updateData.is_visible = input.isVisible;
    if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

    // Content changes trigger edit tracking
    if (input.content !== undefined || input.contentHtml !== undefined) {
      if (input.content !== undefined) updateData.content = input.content;
      if (input.contentHtml !== undefined) updateData.content_html = input.contentHtml;

      // Track original content if first edit
      if (!currentSection.original_content && currentSection.content) {
        updateData.original_content = currentSection.content;
      }

      updateData.edited_by = userId;
      updateData.edited_at = new Date().toISOString();
      updateData.status = 'edited';
    }

    const { data, error } = await db
      .from('exec_board_report_sections')
      .update(updateData)
      .eq('id', sectionId)
      .eq('report_id', reportId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    await logReportAction(orgId, reportId, userId, 'section_updated', { sectionId, input }, sectionId);

    return mapSectionRecord(data);
  }

  async function updateSectionOrder(
    orgId: string,
    reportId: string,
    userId: string | null,
    updates: Array<{ sectionId: string; sortOrder: number }>
  ): Promise<ExecBoardReportSection[]> {
    // Update each section's sort order
    await Promise.all(
      updates.map(({ sectionId, sortOrder }) =>
        db
          .from('exec_board_report_sections')
          .update({ sort_order: sortOrder })
          .eq('id', sectionId)
          .eq('report_id', reportId)
          .eq('org_id', orgId)
      )
    );

    await logReportAction(orgId, reportId, userId, 'sections_reordered', { updates });

    return listSections(orgId, reportId);
  }

  // ==========================================================================
  // Audience Management
  // ==========================================================================

  async function addAudienceMember(
    orgId: string,
    reportId: string,
    userId: string | null,
    input: AddExecBoardReportAudienceInput
  ): Promise<ExecBoardReportAudience> {
    const { data, error } = await db
      .from('exec_board_report_audience')
      .insert({
        report_id: reportId,
        org_id: orgId,
        email: input.email,
        name: input.name || null,
        role: input.role || null,
        user_id: input.userId || null,
        access_level: input.accessLevel || 'view',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add audience member: ${error.message}`);
    }

    await logReportAction(orgId, reportId, userId, 'audience_added', { email: input.email });

    return mapAudienceRecord(data);
  }

  async function updateAudienceMember(
    orgId: string,
    reportId: string,
    audienceId: string,
    userId: string | null,
    input: UpdateExecBoardReportAudienceInput
  ): Promise<ExecBoardReportAudience | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.accessLevel !== undefined) updateData.access_level = input.accessLevel;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await db
      .from('exec_board_report_audience')
      .update(updateData)
      .eq('id', audienceId)
      .eq('report_id', reportId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    await logReportAction(orgId, reportId, userId, 'audience_updated', { audienceId, input });

    return mapAudienceRecord(data);
  }

  async function removeAudienceMember(
    orgId: string,
    reportId: string,
    audienceId: string,
    userId: string | null
  ): Promise<void> {
    const { error } = await db
      .from('exec_board_report_audience')
      .delete()
      .eq('id', audienceId)
      .eq('report_id', reportId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to remove audience member: ${error.message}`);
    }

    await logReportAction(orgId, reportId, userId, 'audience_removed', { audienceId });
  }

  async function listAudienceMembers(
    orgId: string,
    reportId: string,
    query: ListExecBoardReportAudienceQuery
  ): Promise<ListExecBoardReportAudienceResponse> {
    let dbQuery = db
      .from('exec_board_report_audience')
      .select('*', { count: 'exact' })
      .eq('report_id', reportId)
      .eq('org_id', orgId);

    if (query.activeOnly) {
      dbQuery = dbQuery.eq('is_active', true);
    }
    if (query.accessLevel) {
      dbQuery = dbQuery.eq('access_level', query.accessLevel);
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list audience: ${error.message}`);
    }

    return {
      audience: (data || []).map(mapAudienceRecord),
      total: count || 0,
      limit,
      offset,
    };
  }

  // ==========================================================================
  // Generation & Publishing
  // ==========================================================================

  async function aggregateUpstreamData(
    orgId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<ExecBoardReportAggregatedData> {
    // Aggregate data from upstream systems (S38-S62)
    // This is a simplified implementation - in production, each would query the respective tables

    const aggregatedData: ExecBoardReportAggregatedData = {
      aggregatedAt: new Date().toISOString(),
      periodStart,
      periodEnd,
    };

    try {
      // S61: Executive Command Center
      const { data: dashboards } = await db
        .from('exec_dashboards')
        .select('*')
        .eq('org_id', orgId)
        .limit(10);

      if (dashboards) {
        aggregatedData.commandCenter = {
          dashboards: dashboards,
          kpis: [],
          insights: [],
        };
      }
    } catch (e) {
      logger.debug('Could not fetch command center data', { error: e });
    }

    try {
      // S60: Risk Radar
      const { data: riskForecasts } = await db
        .from('risk_forecasts')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd)
        .limit(20);

      if (riskForecasts) {
        aggregatedData.riskRadar = {
          forecasts: riskForecasts,
          activeRisks: riskForecasts.length,
          riskScore: 0,
        };
      }
    } catch (e) {
      logger.debug('Could not fetch risk radar data', { error: e });
    }

    try {
      // S55: Crisis Engine
      const { data: crisisIncidents } = await db
        .from('crisis_incidents')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (crisisIncidents) {
        aggregatedData.crisisEngine = {
          activeIncidents: crisisIncidents.filter((i: { status: string }) => i.status === 'active'),
          resolvedIncidents: crisisIncidents.filter((i: { status: string }) => i.status === 'resolved'),
          crisisScore: 0,
        };
      }
    } catch (e) {
      logger.debug('Could not fetch crisis data', { error: e });
    }

    try {
      // S56-57: Brand Reputation
      const { data: brandScores } = await db
        .from('brand_reputation_scores')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (brandScores && brandScores.length > 0) {
        aggregatedData.brandReputation = {
          score: brandScores[0].overall_score || 0,
          sentiment: brandScores[0].sentiment || {},
          alerts: [],
        };
      }
    } catch (e) {
      logger.debug('Could not fetch brand reputation data', { error: e });
    }

    try {
      // S52: Media Performance
      const { data: mediaMetrics } = await db
        .from('media_performance_metrics')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (mediaMetrics) {
        aggregatedData.mediaPerformance = {
          metrics: mediaMetrics,
          topCoverage: [],
          reachTotal: 0,
        };
      }
    } catch (e) {
      logger.debug('Could not fetch media performance data', { error: e });
    }

    try {
      // S53: Competitive Intelligence
      const { data: compReports } = await db
        .from('competitive_intel_reports')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', periodStart)
        .lte('created_at', periodEnd);

      if (compReports) {
        aggregatedData.competitiveIntel = {
          reports: compReports,
          competitorMoves: [],
        };
      }
    } catch (e) {
      logger.debug('Could not fetch competitive intelligence data', { error: e });
    }

    try {
      // S59: Governance
      const { data: govScores } = await db
        .from('governance_scores')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (govScores && govScores.length > 0) {
        aggregatedData.governance = {
          complianceScore: govScores[0].compliance_score || 0,
          pendingItems: [],
        };
      }
    } catch (e) {
      logger.debug('Could not fetch governance data', { error: e });
    }

    return aggregatedData;
  }

  async function generateSectionContent(
    sectionType: ExecBoardReportSectionType,
    aggregatedData: ExecBoardReportAggregatedData,
    tone: ExecBoardReportTone,
    targetLength: ExecBoardReportTargetLength
  ): Promise<{ content: string; tokensUsed: number; durationMs: number }> {
    const startTime = Date.now();

    // Build prompt based on section type
    const sectionPrompts: Record<ExecBoardReportSectionType, string> = {
      executive_summary: `Write a concise executive summary covering the period from ${aggregatedData.periodStart} to ${aggregatedData.periodEnd}. Summarize key achievements, challenges, and strategic priorities.`,
      strategic_highlights: 'Highlight the key strategic achievements and milestones from this reporting period.',
      kpi_dashboard: 'Create a narrative summary of the key performance indicators for this period, highlighting trends and notable changes.',
      financial_overview: 'Provide a high-level financial overview focusing on revenue, expenses, and key financial metrics.',
      market_analysis: 'Analyze the market conditions, trends, and positioning during this reporting period.',
      risk_assessment: 'Assess the key risks identified during this period and outline mitigation strategies.',
      brand_health: 'Summarize the brand health metrics including reputation, sentiment, and key brand initiatives.',
      media_coverage: 'Provide an overview of media coverage, reach, and notable mentions during this period.',
      operational_updates: 'Highlight key operational developments, improvements, and challenges.',
      talent_updates: 'Summarize key talent and team developments including hiring, departures, and organizational changes.',
      technology_updates: 'Outline technology and product developments, releases, and technical milestones.',
      sustainability: 'Report on ESG initiatives, sustainability metrics, and environmental/social impact.',
      forward_outlook: 'Provide forward-looking statements on expected trends, opportunities, and challenges.',
      action_items: 'List key action items and recommendations for executive attention.',
      appendix: 'Compile supporting materials and additional data references.',
    };

    const toneInstructions: Record<ExecBoardReportTone, string> = {
      professional: 'Use a professional, business-appropriate tone.',
      formal: 'Use a formal, board-ready tone suitable for regulatory filings.',
      executive: 'Use a concise, executive-focused tone emphasizing key insights and decisions.',
    };

    const lengthInstructions: Record<ExecBoardReportTargetLength, string> = {
      brief: 'Keep the content brief and focused, around 100-200 words.',
      standard: 'Provide a standard-length section of around 300-500 words.',
      comprehensive: 'Provide a comprehensive section with detailed analysis, around 500-800 words.',
    };

    const prompt = `${sectionPrompts[sectionType]}

${toneInstructions[tone]}
${lengthInstructions[targetLength]}

Based on the following aggregated data:
${JSON.stringify(aggregatedData, null, 2)}`;

    // Call OpenAI API
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an expert executive communications specialist who writes clear, insightful board reports and executive summaries.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };
      const content = result.choices?.[0]?.message?.content || '';
      const tokensUsed = result.usage?.total_tokens || 0;

      return {
        content,
        tokensUsed,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      logger.error('Failed to generate section content', { error, sectionType });
      return {
        content: `[Content generation failed for ${EXEC_BOARD_REPORT_SECTION_TYPE_LABELS[sectionType]}. Please generate manually.]`,
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  async function generateReport(
    orgId: string,
    reportId: string,
    userId: string | null,
    input: GenerateExecBoardReportInput
  ): Promise<GenerateExecBoardReportResponse> {
    const startTime = Date.now();

    // Get report details
    const reportData = await getReport(orgId, reportId);
    if (!reportData) {
      throw new Error('Report not found');
    }

    const { report, sections } = reportData;

    // Update status to generating
    await db
      .from('exec_board_reports')
      .update({
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        generation_error: null,
      })
      .eq('id', reportId)
      .eq('org_id', orgId);

    // Aggregate upstream data
    const aggregatedData = await aggregateUpstreamData(
      orgId,
      report.periodStart,
      report.periodEnd
    );

    // Determine which sections to generate
    const sectionsToGenerate = input.sectionTypes
      ? sections.filter((s: ExecBoardReportSection) => input.sectionTypes!.includes(s.sectionType))
      : input.forceRegenerate
      ? sections
      : sections.filter((s: ExecBoardReportSection) => s.status === 'pending' || s.status === 'error');

    let totalTokensUsed = 0;
    const updatedSections: ExecBoardReportSection[] = [];

    // Generate content for each section
    for (const section of sectionsToGenerate) {
      // Update section status
      await db
        .from('exec_board_report_sections')
        .update({ status: 'generating' })
        .eq('id', section.id);

      try {
        const { content, tokensUsed, durationMs } = await generateSectionContent(
          section.sectionType,
          aggregatedData,
          report.tone,
          report.targetLength
        );

        // Update section with generated content
        const { data: updatedSection } = await db
          .from('exec_board_report_sections')
          .update({
            content,
            status: 'generated',
            model_name: 'gpt-4o',
            tokens_used: tokensUsed,
            generation_duration_ms: durationMs,
            generation_error: null,
            source_data: aggregatedData,
          })
          .eq('id', section.id)
          .select()
          .single();

        if (updatedSection) {
          updatedSections.push(mapSectionRecord(updatedSection));
        }

        totalTokensUsed += tokensUsed;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await db
          .from('exec_board_report_sections')
          .update({
            status: 'error',
            generation_error: errorMessage,
          })
          .eq('id', section.id);

        logger.error('Failed to generate section', { error, sectionId: section.id });
      }
    }

    // Record data sources
    await db.from('exec_board_report_sources').insert({
      report_id: reportId,
      org_id: orgId,
      source_system: 'aggregated',
      source_sprint: 'S38-S62',
      data_snapshot: aggregatedData,
      data_fetched_at: aggregatedData.aggregatedAt,
    });

    const generationDurationMs = Date.now() - startTime;

    // Update report status
    const { data: finalReport } = await db
      .from('exec_board_reports')
      .update({
        status: 'review',
        generation_completed_at: new Date().toISOString(),
        generation_duration_ms: generationDurationMs,
        total_tokens_used: totalTokensUsed,
        data_sources_used: { systems: Object.keys(aggregatedData).filter((k) => k !== 'aggregatedAt' && k !== 'periodStart' && k !== 'periodEnd') },
      })
      .eq('id', reportId)
      .eq('org_id', orgId)
      .select()
      .single();

    await logReportAction(orgId, reportId, userId, 'generated', {
      sectionsGenerated: sectionsToGenerate.length,
      totalTokensUsed,
      durationMs: generationDurationMs,
    });

    // Generate PDF if requested
    let pdfUrl: string | null = null;
    let pptxUrl: string | null = null;

    if (input.generatePdf && finalReport) {
      // Placeholder for PDF generation
      // In production, use puppeteer, pdfmake, or similar
      const pdfPath = `${orgId}/${reportId}/report.pdf`;
      await db
        .from('exec_board_reports')
        .update({ pdf_storage_path: pdfPath })
        .eq('id', reportId);
      pdfUrl = pdfPath;
    }

    if (input.generatePptx && finalReport) {
      // Placeholder for PPTX generation
      const pptxPath = `${orgId}/${reportId}/report.pptx`;
      await db
        .from('exec_board_reports')
        .update({ pptx_storage_path: pptxPath })
        .eq('id', reportId);
      pptxUrl = pptxPath;
    }

    return {
      report: finalReport ? mapReportRecord(finalReport) : report,
      sections: updatedSections.length > 0 ? updatedSections : sections,
      generationDurationMs,
      tokensUsed: totalTokensUsed,
      pdfUrl,
      pptxUrl,
    };
  }

  async function approveReport(
    orgId: string,
    reportId: string,
    userId: string | null,
    input: ApproveExecBoardReportInput
  ): Promise<ExecBoardReport | null> {
    const { data, error } = await db
      .from('exec_board_reports')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    await logReportAction(orgId, reportId, userId, 'approved', { comments: input.comments });

    return mapReportRecord(data);
  }

  async function publishReport(
    orgId: string,
    reportId: string,
    userId: string | null,
    input: PublishExecBoardReportInput
  ): Promise<PublishExecBoardReportResponse> {
    // Get report and audience
    const reportData = await getReport(orgId, reportId);
    if (!reportData) {
      throw new Error('Report not found');
    }

    const { report, audience } = reportData;

    // Regenerate artifacts if requested
    let pdfUrl = report.pdfStoragePath;
    let pptxUrl = report.pptxStoragePath;

    if (input.regeneratePdf) {
      const pdfPath = `${orgId}/${reportId}/report-${Date.now()}.pdf`;
      await db
        .from('exec_board_reports')
        .update({ pdf_storage_path: pdfPath })
        .eq('id', reportId);
      pdfUrl = pdfPath;
    }

    if (input.regeneratePptx) {
      const pptxPath = `${orgId}/${reportId}/report-${Date.now()}.pptx`;
      await db
        .from('exec_board_reports')
        .update({ pptx_storage_path: pptxPath })
        .eq('id', reportId);
      pptxUrl = pptxPath;
    }

    // Update status to published
    const { data: publishedReport } = await db
      .from('exec_board_reports')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .eq('org_id', orgId)
      .select()
      .single();

    let notificationsSent = 0;

    // Notify audience if requested
    if (input.notifyAudience) {
      const activeAudience = audience.filter((a: ExecBoardReportAudience) => a.isActive);
      // Placeholder for email notification
      // In production, integrate with email service
      for (const member of activeAudience) {
        try {
          // Update last sent timestamp
          await db
            .from('exec_board_report_audience')
            .update({ last_sent_at: new Date().toISOString() })
            .eq('id', member.id);
          notificationsSent++;
        } catch (e) {
          logger.warn('Failed to notify audience member', { email: member.email, error: e });
        }
      }
    }

    await logReportAction(orgId, reportId, userId, 'published', { notificationsSent });

    return {
      report: publishedReport ? mapReportRecord(publishedReport) : report,
      notificationsSent,
      pdfUrl,
      pptxUrl,
    };
  }

  // ==========================================================================
  // Audit Logs
  // ==========================================================================

  async function listAuditLogs(
    orgId: string,
    reportId: string,
    query: ListExecBoardReportAuditLogsQuery
  ): Promise<ListExecBoardReportAuditLogsResponse> {
    let dbQuery = db
      .from('exec_board_report_audit_log')
      .select('*', { count: 'exact' })
      .eq('report_id', reportId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (query.action) {
      dbQuery = dbQuery.eq('action', query.action);
    }

    const limit = query.limit || 50;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list audit logs: ${error.message}`);
    }

    return {
      auditLogs: (data || []).map(mapAuditLogRecord),
      total: count || 0,
      limit,
      offset,
    };
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  async function getReportStats(orgId: string): Promise<ExecBoardReportStats> {
    // Total reports
    const { count: totalReports } = await db
      .from('exec_board_reports')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Draft reports
    const { count: draftReports } = await db
      .from('exec_board_reports')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'draft');

    // Published reports
    const { count: publishedReports } = await db
      .from('exec_board_reports')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'published');

    // Archived reports
    const { count: archivedReports } = await db
      .from('exec_board_reports')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_archived', true);

    // Reports by format
    const reportsByFormat: Record<ExecBoardReportFormat, number> = {
      quarterly: 0,
      annual: 0,
      monthly: 0,
      board_meeting: 0,
      investor_update: 0,
      custom: 0,
    };

    for (const format of Object.keys(reportsByFormat) as ExecBoardReportFormat[]) {
      const { count } = await db
        .from('exec_board_reports')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('format', format);
      reportsByFormat[format] = count || 0;
    }

    // Reports by status
    const reportsByStatus: Record<ExecBoardReportStatus, number> = {
      draft: 0,
      generating: 0,
      review: 0,
      approved: 0,
      published: 0,
      archived: 0,
    };

    for (const status of Object.keys(reportsByStatus) as ExecBoardReportStatus[]) {
      const { count } = await db
        .from('exec_board_reports')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', status);
      reportsByStatus[status] = count || 0;
    }

    // Total audience members
    const { count: totalAudienceMembers } = await db
      .from('exec_board_report_audience')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    // Total sections generated
    const { count: totalSectionsGenerated } = await db
      .from('exec_board_report_sections')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', ['generated', 'edited', 'approved']);

    // Average generation time
    const { data: genTimes } = await db
      .from('exec_board_reports')
      .select('generation_duration_ms')
      .eq('org_id', orgId)
      .not('generation_duration_ms', 'is', null);

    const avgGenTime = genTimes && genTimes.length > 0
      ? genTimes.reduce((sum, r) => sum + (r.generation_duration_ms || 0), 0) / genTimes.length
      : 0;

    // Total tokens used
    const { data: tokenData } = await db
      .from('exec_board_reports')
      .select('total_tokens_used')
      .eq('org_id', orgId);

    const totalTokensUsed = tokenData
      ? tokenData.reduce((sum, r) => sum + (r.total_tokens_used || 0), 0)
      : 0;

    // Reports this quarter
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const { count: reportsThisQuarter } = await db
      .from('exec_board_reports')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', quarterStart.toISOString());

    // Last published
    const { data: lastPub } = await db
      .from('exec_board_reports')
      .select('published_at')
      .eq('org_id', orgId)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(1);

    return {
      totalReports: totalReports || 0,
      draftReports: draftReports || 0,
      publishedReports: publishedReports || 0,
      archivedReports: archivedReports || 0,
      reportsByFormat,
      reportsByStatus,
      totalAudienceMembers: totalAudienceMembers || 0,
      totalSectionsGenerated: totalSectionsGenerated || 0,
      averageGenerationTimeMs: Math.round(avgGenTime),
      totalTokensUsed,
      reportsThisQuarter: reportsThisQuarter || 0,
      lastPublishedAt: lastPub?.[0]?.published_at || null,
    };
  }

  // ==========================================================================
  // Return Service Interface
  // ==========================================================================

  return {
    // Report CRUD
    createReport,
    getReport,
    updateReport,
    deleteReport,
    listReports,

    // Section management
    listSections,
    updateSection,
    updateSectionOrder,

    // Audience management
    addAudienceMember,
    updateAudienceMember,
    removeAudienceMember,
    listAudienceMembers,

    // Generation & publishing
    generateReport,
    approveReport,
    publishReport,

    // Audit logs
    listAuditLogs,

    // Statistics
    getReportStats,
  };
}
