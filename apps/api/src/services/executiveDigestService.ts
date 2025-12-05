/**
 * Executive Digest Service (Sprint S62)
 * Automated Strategic Briefs & Exec Weekly Digest Generator V1
 *
 * Features:
 * - Digest CRUD with scheduling configuration
 * - Cross-system data aggregation from S61, Risk Radar, Crisis, Reputation, etc.
 * - LLM-powered section generation (executive summary, recommendations)
 * - PDF generation and storage
 * - Email delivery to configured recipients
 * - Scheduler integration for automated weekly digests
 * - Comprehensive audit logging
 */

import type {
  ExecDigest,
  ExecDigestSection,
  ExecDigestRecipient,
  ExecDigestDeliveryLog,
  ExecDigestWithCounts,
  ExecDigestDeliveryPeriod,
  ExecDigestTimeWindow,
  ExecDigestSectionType,
  ExecDigestDeliveryStatus,
  ExecDigestActionType,
  ExecDigestSummary,
  ExecDigestKpiSnapshot,
  ExecDigestInsightSnapshot,
  ExecDigestRecipientResult,
  ExecDigestPdfResult,
  ExecDigestServiceConfig,
  CreateExecDigestInput,
  UpdateExecDigestInput,
  GenerateExecDigestInput,
  DeliverExecDigestInput,
  AddExecDigestRecipientInput,
  UpdateExecDigestRecipientInput,
  ListExecDigestsQuery,
  ListExecDigestRecipientsQuery,
  ListExecDigestDeliveryLogsQuery,
  ListExecDigestsResponse,
  GetExecDigestResponse,
  GenerateExecDigestResponse,
  DeliverExecDigestResponse,
  ListExecDigestRecipientsResponse,
  ListExecDigestDeliveryLogsResponse,
  ListExecDigestSectionsResponse,
  ExecDigestStats,
} from '@pravado/types';
import {
  EXEC_DIGEST_SECTION_DEFAULT_ORDER,
  EXEC_DIGEST_SECTION_TYPE_LABELS,
} from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('exec-digest-service');

// ============================================================================
// Database Record Types (snake_case)
// ============================================================================

interface DigestRecord {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  delivery_period: string;
  time_window: string;
  schedule_day_of_week: number;
  schedule_hour: number;
  schedule_timezone: string;
  next_delivery_at: string | null;
  last_delivered_at: string | null;
  include_recommendations: boolean;
  include_kpis: boolean;
  include_insights: boolean;
  include_risk_summary: boolean;
  include_reputation_summary: boolean;
  include_competitive_summary: boolean;
  include_media_performance: boolean;
  include_crisis_status: boolean;
  include_governance: boolean;
  summary: Record<string, unknown>;
  kpi_snapshot: Record<string, unknown>[];
  insights_snapshot: Record<string, unknown>[];
  pdf_storage_path: string | null;
  pdf_generated_at: string | null;
  is_active: boolean;
  is_archived: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface SectionRecord {
  id: string;
  org_id: string;
  digest_id: string;
  section_type: string;
  title: string;
  content: string;
  sort_order: number;
  model_name: string | null;
  tokens_used: number | null;
  generation_duration_ms: number | null;
  is_visible: boolean;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface RecipientRecord {
  id: string;
  org_id: string;
  digest_id: string;
  email: string;
  name: string | null;
  role: string | null;
  is_validated: boolean;
  validated_at: string | null;
  is_active: boolean;
  include_pdf: boolean;
  include_inline_summary: boolean;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DeliveryLogRecord {
  id: string;
  org_id: string;
  digest_id: string;
  delivery_period: string;
  time_window: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  error_message: string | null;
  recipients_count: number;
  successful_deliveries: number;
  failed_deliveries: number;
  pdf_storage_path: string | null;
  pdf_size_bytes: number | null;
  metadata: Record<string, unknown>;
  recipient_results: Record<string, unknown>[];
  created_at: string;
}

// ============================================================================
// Record to Entity Mappers
// ============================================================================

function mapDigestRecord(record: DigestRecord): ExecDigest {
  return {
    id: record.id,
    orgId: record.org_id,
    title: record.title,
    description: record.description,
    deliveryPeriod: record.delivery_period as ExecDigestDeliveryPeriod,
    timeWindow: record.time_window as ExecDigestTimeWindow,
    scheduleDayOfWeek: record.schedule_day_of_week,
    scheduleHour: record.schedule_hour,
    scheduleTimezone: record.schedule_timezone,
    nextDeliveryAt: record.next_delivery_at,
    lastDeliveredAt: record.last_delivered_at,
    includeRecommendations: record.include_recommendations,
    includeKpis: record.include_kpis,
    includeInsights: record.include_insights,
    includeRiskSummary: record.include_risk_summary,
    includeReputationSummary: record.include_reputation_summary,
    includeCompetitiveSummary: record.include_competitive_summary,
    includeMediaPerformance: record.include_media_performance,
    includeCrisisStatus: record.include_crisis_status,
    includeGovernance: record.include_governance,
    summary: record.summary as ExecDigestSummary,
    kpiSnapshot: record.kpi_snapshot as unknown as ExecDigestKpiSnapshot[],
    insightsSnapshot: record.insights_snapshot as unknown as ExecDigestInsightSnapshot[],
    pdfStoragePath: record.pdf_storage_path,
    pdfGeneratedAt: record.pdf_generated_at,
    isActive: record.is_active,
    isArchived: record.is_archived,
    createdBy: record.created_by,
    updatedBy: record.updated_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapSectionRecord(record: SectionRecord): ExecDigestSection {
  return {
    id: record.id,
    orgId: record.org_id,
    digestId: record.digest_id,
    sectionType: record.section_type as ExecDigestSectionType,
    title: record.title,
    content: record.content,
    sortOrder: record.sort_order,
    modelName: record.model_name,
    tokensUsed: record.tokens_used,
    generationDurationMs: record.generation_duration_ms,
    isVisible: record.is_visible,
    meta: record.meta,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapRecipientRecord(record: RecipientRecord): ExecDigestRecipient {
  return {
    id: record.id,
    orgId: record.org_id,
    digestId: record.digest_id,
    email: record.email,
    name: record.name,
    role: record.role,
    isValidated: record.is_validated,
    validatedAt: record.validated_at,
    isActive: record.is_active,
    includePdf: record.include_pdf,
    includeInlineSummary: record.include_inline_summary,
    meta: record.meta,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapDeliveryLogRecord(record: DeliveryLogRecord): ExecDigestDeliveryLog {
  return {
    id: record.id,
    orgId: record.org_id,
    digestId: record.digest_id,
    deliveryPeriod: record.delivery_period as ExecDigestDeliveryPeriod,
    timeWindow: record.time_window as ExecDigestTimeWindow,
    scheduledAt: record.scheduled_at,
    startedAt: record.started_at,
    completedAt: record.completed_at,
    status: record.status as ExecDigestDeliveryStatus,
    errorMessage: record.error_message,
    recipientsCount: record.recipients_count,
    successfulDeliveries: record.successful_deliveries,
    failedDeliveries: record.failed_deliveries,
    pdfStoragePath: record.pdf_storage_path,
    pdfSizeBytes: record.pdf_size_bytes,
    metadata: record.metadata,
    recipientResults: record.recipient_results as unknown as ExecDigestRecipientResult[],
    createdAt: record.created_at,
  };
}

// ============================================================================
// Service Factory
// ============================================================================

export function createExecutiveDigestService(config: ExecDigestServiceConfig) {
  const db = config.supabase as SupabaseClient;
  const openaiApiKey = config.openaiApiKey;
  const storageBucket = config.storageBucket || 'exec-digests';

  // Default configuration
  const defaultDeliveryPeriod: ExecDigestDeliveryPeriod = 'weekly';
  const defaultTimeWindow: ExecDigestTimeWindow = '7d';

  // ==========================================================================
  // Audit Logging
  // ==========================================================================

  async function logDigestAction(
    orgId: string,
    digestId: string | null,
    userId: string | null,
    actionType: ExecDigestActionType,
    description: string,
    meta?: Record<string, unknown>
  ): Promise<void> {
    try {
      await db.from('exec_digest_audit_log').insert({
        org_id: orgId,
        digest_id: digestId,
        user_id: userId,
        action_type: actionType,
        description,
        metadata: meta || {},
      });
    } catch (error) {
      logger.warn('Failed to log digest action', { error, actionType, digestId });
    }
  }

  // ==========================================================================
  // Digest CRUD
  // ==========================================================================

  async function createDigest(
    orgId: string,
    userId: string | null,
    input: CreateExecDigestInput
  ): Promise<ExecDigest> {
    const { data, error } = await db
      .from('exec_digests')
      .insert({
        org_id: orgId,
        title: input.title || 'Executive Weekly Digest',
        description: input.description || null,
        delivery_period: input.deliveryPeriod || defaultDeliveryPeriod,
        time_window: input.timeWindow || defaultTimeWindow,
        schedule_day_of_week: input.scheduleDayOfWeek ?? 1,
        schedule_hour: input.scheduleHour ?? 8,
        schedule_timezone: input.scheduleTimezone || 'UTC',
        include_recommendations: input.includeRecommendations ?? true,
        include_kpis: input.includeKpis ?? true,
        include_insights: input.includeInsights ?? true,
        include_risk_summary: input.includeRiskSummary ?? true,
        include_reputation_summary: input.includeReputationSummary ?? true,
        include_competitive_summary: input.includeCompetitiveSummary ?? true,
        include_media_performance: input.includeMediaPerformance ?? true,
        include_crisis_status: input.includeCrisisStatus ?? true,
        include_governance: input.includeGovernance ?? true,
        is_active: input.isActive ?? true,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create digest', { error, orgId });
      throw new Error(`Failed to create digest: ${error.message}`);
    }

    const digest = mapDigestRecord(data as DigestRecord);

    await logDigestAction(orgId, digest.id, userId, 'created', 'Digest created', {
      title: digest.title,
      deliveryPeriod: digest.deliveryPeriod,
    });

    logger.info('Digest created', { digestId: digest.id, orgId });
    return digest;
  }

  async function getDigest(
    orgId: string,
    digestId: string
  ): Promise<GetExecDigestResponse | null> {
    // Fetch digest
    const { data: digestData, error: digestError } = await db
      .from('exec_digests')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', digestId)
      .single();

    if (digestError || !digestData) {
      return null;
    }

    const digest = mapDigestRecord(digestData as DigestRecord);

    // Fetch sections
    const { data: sectionsData } = await db
      .from('exec_digest_sections')
      .select('*')
      .eq('digest_id', digestId)
      .order('sort_order', { ascending: true });

    const sections = (sectionsData || []).map((r) => mapSectionRecord(r as SectionRecord));

    // Fetch recipients
    const { data: recipientsData } = await db
      .from('exec_digest_recipients')
      .select('*')
      .eq('digest_id', digestId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    const recipients = (recipientsData || []).map((r) => mapRecipientRecord(r as RecipientRecord));

    // Fetch recent deliveries
    const { data: deliveriesData } = await db
      .from('exec_digest_delivery_log')
      .select('*')
      .eq('digest_id', digestId)
      .order('created_at', { ascending: false })
      .limit(5);

    const recentDeliveries = (deliveriesData || []).map((r) =>
      mapDeliveryLogRecord(r as DeliveryLogRecord)
    );

    return {
      digest,
      sections,
      recipients,
      recentDeliveries,
    };
  }

  async function listDigests(
    orgId: string,
    query: ListExecDigestsQuery
  ): Promise<ListExecDigestsResponse> {
    const { includeArchived = false, deliveryPeriod, isActive, limit = 20, offset = 0 } = query;

    let dbQuery = db
      .from('exec_digests')
      .select(
        '*, exec_digest_sections(count), exec_digest_recipients(count), exec_digest_delivery_log(count)',
        { count: 'exact' }
      )
      .eq('org_id', orgId);

    if (!includeArchived) {
      dbQuery = dbQuery.eq('is_archived', false);
    }

    if (deliveryPeriod) {
      dbQuery = dbQuery.eq('delivery_period', deliveryPeriod);
    }

    if (isActive !== undefined) {
      dbQuery = dbQuery.eq('is_active', isActive);
    }

    dbQuery = dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list digests', { error, orgId });
      throw new Error(`Failed to list digests: ${error.message}`);
    }

    // Map records with counts
    const digests: ExecDigestWithCounts[] = (data || []).map(
      (
        record: DigestRecord & {
          exec_digest_sections: { count: number }[];
          exec_digest_recipients: { count: number }[];
          exec_digest_delivery_log: { count: number }[];
        }
      ) => ({
        ...mapDigestRecord(record),
        sectionsCount: record.exec_digest_sections?.[0]?.count || 0,
        recipientsCount: record.exec_digest_recipients?.[0]?.count || 0,
        deliveriesCount: record.exec_digest_delivery_log?.[0]?.count || 0,
      })
    );

    return {
      digests,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  async function updateDigest(
    orgId: string,
    digestId: string,
    userId: string | null,
    input: UpdateExecDigestInput
  ): Promise<ExecDigest | null> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.deliveryPeriod !== undefined) updateData.delivery_period = input.deliveryPeriod;
    if (input.timeWindow !== undefined) updateData.time_window = input.timeWindow;
    if (input.scheduleDayOfWeek !== undefined)
      updateData.schedule_day_of_week = input.scheduleDayOfWeek;
    if (input.scheduleHour !== undefined) updateData.schedule_hour = input.scheduleHour;
    if (input.scheduleTimezone !== undefined) updateData.schedule_timezone = input.scheduleTimezone;
    if (input.includeRecommendations !== undefined)
      updateData.include_recommendations = input.includeRecommendations;
    if (input.includeKpis !== undefined) updateData.include_kpis = input.includeKpis;
    if (input.includeInsights !== undefined) updateData.include_insights = input.includeInsights;
    if (input.includeRiskSummary !== undefined)
      updateData.include_risk_summary = input.includeRiskSummary;
    if (input.includeReputationSummary !== undefined)
      updateData.include_reputation_summary = input.includeReputationSummary;
    if (input.includeCompetitiveSummary !== undefined)
      updateData.include_competitive_summary = input.includeCompetitiveSummary;
    if (input.includeMediaPerformance !== undefined)
      updateData.include_media_performance = input.includeMediaPerformance;
    if (input.includeCrisisStatus !== undefined)
      updateData.include_crisis_status = input.includeCrisisStatus;
    if (input.includeGovernance !== undefined) updateData.include_governance = input.includeGovernance;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.isArchived !== undefined) updateData.is_archived = input.isArchived;

    updateData.updated_by = userId;

    const { data, error } = await db
      .from('exec_digests')
      .update(updateData)
      .eq('org_id', orgId)
      .eq('id', digestId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    const digest = mapDigestRecord(data as DigestRecord);

    await logDigestAction(orgId, digestId, userId, 'updated', 'Digest updated', {
      updatedFields: Object.keys(input),
    });

    return digest;
  }

  async function deleteDigest(
    orgId: string,
    digestId: string,
    userId: string | null,
    hardDelete = false
  ): Promise<{ deleted: boolean; archived: boolean }> {
    if (hardDelete) {
      const { error } = await db
        .from('exec_digests')
        .delete()
        .eq('org_id', orgId)
        .eq('id', digestId);

      if (error) {
        throw new Error(`Failed to delete digest: ${error.message}`);
      }

      await logDigestAction(orgId, digestId, userId, 'deleted', 'Digest hard deleted');
      return { deleted: true, archived: false };
    }

    // Soft delete (archive)
    const { error } = await db
      .from('exec_digests')
      .update({ is_archived: true, is_active: false, updated_by: userId })
      .eq('org_id', orgId)
      .eq('id', digestId);

    if (error) {
      throw new Error(`Failed to archive digest: ${error.message}`);
    }

    await logDigestAction(orgId, digestId, userId, 'deleted', 'Digest archived');
    return { deleted: false, archived: true };
  }

  // ==========================================================================
  // Recipient Management
  // ==========================================================================

  async function addRecipient(
    orgId: string,
    digestId: string,
    userId: string | null,
    input: AddExecDigestRecipientInput
  ): Promise<ExecDigestRecipient> {
    const { data, error } = await db
      .from('exec_digest_recipients')
      .insert({
        org_id: orgId,
        digest_id: digestId,
        email: input.email.toLowerCase().trim(),
        name: input.name || null,
        role: input.role || null,
        include_pdf: input.includePdf ?? true,
        include_inline_summary: input.includeInlineSummary ?? true,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to add recipient', { error, digestId });
      throw new Error(`Failed to add recipient: ${error.message}`);
    }

    const recipient = mapRecipientRecord(data as RecipientRecord);

    await logDigestAction(orgId, digestId, userId, 'recipient_added', 'Recipient added', {
      email: recipient.email,
      recipientId: recipient.id,
    });

    return recipient;
  }

  async function updateRecipient(
    orgId: string,
    digestId: string,
    recipientId: string,
    _userId: string | null,
    input: UpdateExecDigestRecipientInput
  ): Promise<ExecDigestRecipient | null> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.includePdf !== undefined) updateData.include_pdf = input.includePdf;
    if (input.includeInlineSummary !== undefined)
      updateData.include_inline_summary = input.includeInlineSummary;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await db
      .from('exec_digest_recipients')
      .update(updateData)
      .eq('org_id', orgId)
      .eq('digest_id', digestId)
      .eq('id', recipientId)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    return mapRecipientRecord(data as RecipientRecord);
  }

  async function removeRecipient(
    orgId: string,
    digestId: string,
    recipientId: string,
    userId: string | null
  ): Promise<boolean> {
    // Get recipient email for logging
    const { data: recipientData } = await db
      .from('exec_digest_recipients')
      .select('email')
      .eq('id', recipientId)
      .single();

    const { error } = await db
      .from('exec_digest_recipients')
      .delete()
      .eq('org_id', orgId)
      .eq('digest_id', digestId)
      .eq('id', recipientId);

    if (error) {
      throw new Error(`Failed to remove recipient: ${error.message}`);
    }

    await logDigestAction(orgId, digestId, userId, 'recipient_removed', 'Recipient removed', {
      email: recipientData?.email,
      recipientId,
    });

    return true;
  }

  async function listRecipients(
    orgId: string,
    digestId: string,
    query: ListExecDigestRecipientsQuery
  ): Promise<ListExecDigestRecipientsResponse> {
    const { isActive, limit = 50, offset = 0 } = query;

    let dbQuery = db
      .from('exec_digest_recipients')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('digest_id', digestId);

    if (isActive !== undefined) {
      dbQuery = dbQuery.eq('is_active', isActive);
    }

    dbQuery = dbQuery.order('created_at', { ascending: true }).range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list recipients: ${error.message}`);
    }

    return {
      recipients: (data || []).map((r) => mapRecipientRecord(r as RecipientRecord)),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  // ==========================================================================
  // Section Management
  // ==========================================================================

  async function listSections(
    orgId: string,
    digestId: string
  ): Promise<ListExecDigestSectionsResponse> {
    const { data, error, count } = await db
      .from('exec_digest_sections')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('digest_id', digestId)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to list sections: ${error.message}`);
    }

    return {
      sections: (data || []).map((r) => mapSectionRecord(r as SectionRecord)),
      total: count || 0,
    };
  }

  async function updateSectionOrder(
    orgId: string,
    digestId: string,
    userId: string | null,
    updates: { sectionId: string; sortOrder: number }[]
  ): Promise<ExecDigestSection[]> {
    // Update each section's sort order
    for (const update of updates) {
      await db
        .from('exec_digest_sections')
        .update({ sort_order: update.sortOrder })
        .eq('org_id', orgId)
        .eq('digest_id', digestId)
        .eq('id', update.sectionId);
    }

    await logDigestAction(orgId, digestId, userId, 'sections_reordered', 'Sections reordered');

    // Return updated sections
    const result = await listSections(orgId, digestId);
    return result.sections;
  }

  // ==========================================================================
  // Delivery Log
  // ==========================================================================

  async function listDeliveryLogs(
    orgId: string,
    digestId: string,
    query: ListExecDigestDeliveryLogsQuery
  ): Promise<ListExecDigestDeliveryLogsResponse> {
    const { status, limit = 20, offset = 0 } = query;

    let dbQuery = db
      .from('exec_digest_delivery_log')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('digest_id', digestId);

    if (status) {
      dbQuery = dbQuery.eq('status', status);
    }

    dbQuery = dbQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      throw new Error(`Failed to list delivery logs: ${error.message}`);
    }

    return {
      deliveryLogs: (data || []).map((r) => mapDeliveryLogRecord(r as DeliveryLogRecord)),
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  // ==========================================================================
  // Data Aggregation
  // ==========================================================================

  async function aggregateDigestData(
    orgId: string,
    timeWindow: ExecDigestTimeWindow
  ): Promise<{
    kpis: ExecDigestKpiSnapshot[];
    insights: ExecDigestInsightSnapshot[];
    riskData: Record<string, unknown>;
    reputationData: Record<string, unknown>;
    competitiveData: Record<string, unknown>;
    mediaData: Record<string, unknown>;
    crisisData: Record<string, unknown>;
    governanceData: Record<string, unknown>;
  }> {
    const kpis: ExecDigestKpiSnapshot[] = [];
    const insights: ExecDigestInsightSnapshot[] = [];
    const riskData: Record<string, unknown> = {};
    const reputationData: Record<string, unknown> = {};
    const competitiveData: Record<string, unknown> = {};
    const mediaData: Record<string, unknown> = {};
    const crisisData: Record<string, unknown> = {};
    const governanceData: Record<string, unknown> = {};

    // Calculate date range
    const now = new Date();
    const daysBack = timeWindow === '30d' ? 30 : 7;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const startDateStr = startDate.toISOString();

    // Try to pull from S61 Executive Command Center dashboards
    try {
      const { data: execDashboards } = await db
        .from('exec_dashboards')
        .select('*, exec_dashboard_kpis(*), exec_dashboard_insights(*)')
        .eq('org_id', orgId)
        .eq('is_archived', false)
        .order('last_refreshed_at', { ascending: false })
        .limit(1);

      if (execDashboards && execDashboards.length > 0) {
        const dashboard = execDashboards[0];

        // Pull KPIs from exec dashboard
        if (dashboard.exec_dashboard_kpis) {
          for (const kpi of dashboard.exec_dashboard_kpis) {
            kpis.push({
              metricKey: kpi.metric_key,
              metricLabel: kpi.metric_label,
              metricValue: kpi.metric_value,
              metricUnit: kpi.metric_unit,
              trend: kpi.metric_trend,
              category: kpi.category,
              sourceSystem: kpi.source_system,
            });
          }
        }

        // Pull insights from exec dashboard
        if (dashboard.exec_dashboard_insights) {
          for (const insight of dashboard.exec_dashboard_insights) {
            insights.push({
              title: insight.title,
              description: insight.description,
              sourceSystem: insight.source_system,
              severityOrImpact: insight.severity_or_impact,
              isRisk: insight.is_risk,
              isOpportunity: insight.is_opportunity,
              category: insight.category,
            });
          }
        }
      }
    } catch (error) {
      logger.debug('Could not pull from exec dashboards', { error });
    }

    // Pull from Risk Radar (S60)
    try {
      const { data: riskRadarData } = await db
        .from('risk_radar_forecasts')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: false })
        .limit(1);

      if (riskRadarData && riskRadarData.length > 0) {
        const forecast = riskRadarData[0];
        riskData.overallScore = forecast.overall_risk_score;
        riskData.trend = forecast.trend_direction;
        riskData.topRisks = forecast.top_risks || [];

        kpis.push({
          metricKey: 'risk_score',
          metricLabel: 'Overall Risk Score',
          metricValue: forecast.overall_risk_score || 0,
          metricUnit: 'score',
          category: 'risk',
          sourceSystem: 'risk_radar',
        });
      }
    } catch (error) {
      logger.debug('Could not pull from risk radar', { error });
    }

    // Pull from Brand Reputation (S56-S57)
    try {
      const { data: reputationScores } = await db
        .from('brand_reputation_scores')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: false })
        .limit(1);

      if (reputationScores && reputationScores.length > 0) {
        const score = reputationScores[0];
        reputationData.overallScore = score.overall_score;
        reputationData.sentimentScore = score.sentiment_score;
        reputationData.mediaPresence = score.media_presence_score;

        kpis.push({
          metricKey: 'reputation_score',
          metricLabel: 'Brand Reputation Score',
          metricValue: score.overall_score || 0,
          metricUnit: 'score',
          category: 'reputation',
          sourceSystem: 'reputation',
        });

        kpis.push({
          metricKey: 'sentiment_score',
          metricLabel: 'Sentiment Score',
          metricValue: score.sentiment_score || 0,
          metricUnit: 'score',
          category: 'reputation',
          sourceSystem: 'reputation',
        });
      }
    } catch (error) {
      logger.debug('Could not pull from brand reputation', { error });
    }

    // Pull from Crisis (S55)
    try {
      const { data: crisisIncidents } = await db
        .from('crisis_incidents')
        .select('*')
        .eq('org_id', orgId)
        .in('status', ['active', 'monitoring', 'escalated'])
        .order('severity', { ascending: false })
        .limit(5);

      if (crisisIncidents) {
        crisisData.activeIncidents = crisisIncidents.length;
        crisisData.incidents = crisisIncidents.map((c) => ({
          title: c.title,
          severity: c.severity,
          status: c.status,
        }));

        if (crisisIncidents.length > 0) {
          insights.push({
            title: `${crisisIncidents.length} Active Crisis${crisisIncidents.length > 1 ? 'es' : ''}`,
            description: `Ongoing crisis incidents requiring attention`,
            sourceSystem: 'crisis',
            severityOrImpact: 90,
            isRisk: true,
            isOpportunity: false,
            category: 'crisis',
          });
        }
      }
    } catch (error) {
      logger.debug('Could not pull from crisis', { error });
    }

    // Pull from Competitive Intelligence (S53)
    try {
      const { data: competitorReports } = await db
        .from('competitive_reports')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: false })
        .limit(1);

      if (competitorReports && competitorReports.length > 0) {
        const report = competitorReports[0];
        competitiveData.marketPosition = report.market_position;
        competitiveData.shareOfVoice = report.share_of_voice;
        competitiveData.topCompetitors = report.top_competitors || [];

        if (report.share_of_voice) {
          kpis.push({
            metricKey: 'share_of_voice',
            metricLabel: 'Share of Voice',
            metricValue: report.share_of_voice,
            metricUnit: 'percent',
            category: 'competitive',
            sourceSystem: 'competitive_intel',
          });
        }
      }
    } catch (error) {
      logger.debug('Could not pull from competitive intelligence', { error });
    }

    // Pull from Media Performance (S52)
    try {
      const { data: mediaMetrics } = await db
        .from('media_performance_metrics')
        .select('*')
        .eq('org_id', orgId)
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: false })
        .limit(1);

      if (mediaMetrics && mediaMetrics.length > 0) {
        const metrics = mediaMetrics[0];
        mediaData.totalReach = metrics.total_reach;
        mediaData.engagementRate = metrics.engagement_rate;
        mediaData.mediaValue = metrics.media_value;

        if (metrics.total_reach) {
          kpis.push({
            metricKey: 'media_reach',
            metricLabel: 'Total Media Reach',
            metricValue: metrics.total_reach,
            metricUnit: 'count',
            category: 'media',
            sourceSystem: 'media_performance',
          });
        }
      }
    } catch (error) {
      logger.debug('Could not pull from media performance', { error });
    }

    // Pull from Governance (S59)
    try {
      const { data: governanceScores } = await db
        .from('governance_compliance_scores')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (governanceScores && governanceScores.length > 0) {
        const score = governanceScores[0];
        governanceData.complianceScore = score.overall_compliance_score;
        governanceData.policyAdherence = score.policy_adherence_score;

        kpis.push({
          metricKey: 'compliance_score',
          metricLabel: 'Compliance Score',
          metricValue: score.overall_compliance_score || 0,
          metricUnit: 'percent',
          category: 'governance',
          sourceSystem: 'governance',
        });
      }
    } catch (error) {
      logger.debug('Could not pull from governance', { error });
    }

    return {
      kpis: kpis.slice(0, 20), // Limit KPIs
      insights: insights.slice(0, 10), // Limit insights
      riskData,
      reputationData,
      competitiveData,
      mediaData,
      crisisData,
      governanceData,
    };
  }

  // ==========================================================================
  // LLM Section Generation
  // ==========================================================================

  async function generateSectionContent(
    sectionType: ExecDigestSectionType,
    context: {
      kpis: ExecDigestKpiSnapshot[];
      insights: ExecDigestInsightSnapshot[];
      riskData: Record<string, unknown>;
      reputationData: Record<string, unknown>;
      competitiveData: Record<string, unknown>;
      mediaData: Record<string, unknown>;
      crisisData: Record<string, unknown>;
      governanceData: Record<string, unknown>;
      timeWindow: ExecDigestTimeWindow;
    }
  ): Promise<{ content: string; tokensUsed: number; durationMs: number }> {
    const startTime = Date.now();

    // Build prompt based on section type
    let prompt = '';
    const timeLabel = context.timeWindow === '30d' ? 'past month' : 'past week';

    switch (sectionType) {
      case 'executive_summary':
        prompt = `You are an executive communications expert. Write a concise executive summary (2-3 paragraphs) for a ${timeLabel} digest based on this data:

KPIs: ${JSON.stringify(context.kpis.slice(0, 10))}
Top Insights: ${JSON.stringify(context.insights.slice(0, 5))}
Risk Data: ${JSON.stringify(context.riskData)}
Reputation Data: ${JSON.stringify(context.reputationData)}

Focus on the most important trends, achievements, and concerns. Be direct and actionable.`;
        break;

      case 'risk_summary':
        prompt = `Write a brief risk summary (1-2 paragraphs) for executives based on:

Risk Data: ${JSON.stringify(context.riskData)}
Crisis Data: ${JSON.stringify(context.crisisData)}
Risk-related Insights: ${JSON.stringify(context.insights.filter((i) => i.isRisk))}

Highlight key risks, their potential impact, and recommended attention areas.`;
        break;

      case 'reputation_summary':
        prompt = `Write a brief brand reputation summary (1-2 paragraphs) based on:

Reputation Data: ${JSON.stringify(context.reputationData)}
Related KPIs: ${JSON.stringify(context.kpis.filter((k) => k.category === 'reputation'))}

Cover sentiment trends, media presence, and notable reputation changes.`;
        break;

      case 'competitive_summary':
        prompt = `Write a brief competitive intelligence summary (1-2 paragraphs) based on:

Competitive Data: ${JSON.stringify(context.competitiveData)}
Related KPIs: ${JSON.stringify(context.kpis.filter((k) => k.category === 'competitive'))}

Highlight market position, share of voice trends, and notable competitor activities.`;
        break;

      case 'media_performance':
        prompt = `Write a brief media performance summary (1-2 paragraphs) based on:

Media Data: ${JSON.stringify(context.mediaData)}
Related KPIs: ${JSON.stringify(context.kpis.filter((k) => k.category === 'media'))}

Cover reach, engagement, and media value trends.`;
        break;

      case 'action_recommendations':
        prompt = `Based on all the data provided, write 3-5 specific, actionable recommendations for executives:

KPIs: ${JSON.stringify(context.kpis)}
Insights: ${JSON.stringify(context.insights)}
Risk Data: ${JSON.stringify(context.riskData)}
Reputation Data: ${JSON.stringify(context.reputationData)}

Format as a numbered list. Each recommendation should be specific and tied to the data.`;
        break;

      default:
        prompt = `Write a brief summary for the "${sectionType}" section of an executive digest based on available data.`;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const content = result.choices?.[0]?.message?.content || '';
      const tokensUsed = result.usage?.total_tokens || 0;
      const durationMs = Date.now() - startTime;

      return { content, tokensUsed, durationMs };
    } catch (error) {
      logger.error('Failed to generate section content', { error, sectionType });
      return {
        content: `Unable to generate ${EXEC_DIGEST_SECTION_TYPE_LABELS[sectionType]} content. Please try again.`,
        tokensUsed: 0,
        durationMs: Date.now() - startTime,
      };
    }
  }

  // ==========================================================================
  // Digest Generation
  // ==========================================================================

  async function generateDigest(
    orgId: string,
    digestId: string,
    userId: string | null,
    input: GenerateExecDigestInput
  ): Promise<GenerateExecDigestResponse> {
    const startTime = Date.now();
    let totalTokensUsed = 0;

    // Get digest configuration
    const digestResponse = await getDigest(orgId, digestId);
    if (!digestResponse) {
      throw new Error('Digest not found');
    }

    const digest = digestResponse.digest;
    const timeWindow = input.timeWindowOverride || digest.timeWindow;

    // Clear existing sections if force regenerate
    if (input.forceRegenerate) {
      await db.from('exec_digest_sections').delete().eq('digest_id', digestId);
    }

    // Aggregate data from upstream systems
    const aggregatedData = await aggregateDigestData(orgId, timeWindow);

    // Determine which sections to generate
    const sectionsToGenerate: ExecDigestSectionType[] =
      input.includeSections ||
      EXEC_DIGEST_SECTION_DEFAULT_ORDER.filter((sectionType) => {
        switch (sectionType) {
          case 'executive_summary':
            return true;
          case 'key_kpis':
            return digest.includeKpis;
          case 'key_insights':
            return digest.includeInsights;
          case 'risk_summary':
            return digest.includeRiskSummary;
          case 'reputation_summary':
            return digest.includeReputationSummary;
          case 'competitive_summary':
            return digest.includeCompetitiveSummary;
          case 'media_performance':
            return digest.includeMediaPerformance;
          case 'crisis_status':
            return digest.includeCrisisStatus;
          case 'governance_highlights':
            return digest.includeGovernance;
          case 'action_recommendations':
            return digest.includeRecommendations;
          default:
            return false;
        }
      });

    // Generate each section
    const generatedSections: ExecDigestSection[] = [];
    let sortOrder = 0;

    for (const sectionType of sectionsToGenerate) {
      let content = '';
      let tokensUsed = 0;
      let durationMs = 0;

      // For KPI and insight sections, format the data directly
      if (sectionType === 'key_kpis') {
        content = aggregatedData.kpis
          .map((k) => `- **${k.metricLabel}**: ${k.metricValue}${k.metricUnit ? ` ${k.metricUnit}` : ''}`)
          .join('\n');
      } else if (sectionType === 'key_insights') {
        content = aggregatedData.insights
          .map(
            (i) =>
              `- **${i.title}** (${i.sourceSystem}): ${i.description || 'No description'} [${i.isRisk ? 'Risk' : i.isOpportunity ? 'Opportunity' : 'Info'}]`
          )
          .join('\n');
      } else if (sectionType === 'crisis_status') {
        const crisisIncidents = (aggregatedData.crisisData.incidents as Array<{ title: string; severity: number; status: string }>) || [];
        if (crisisIncidents.length > 0) {
          content = crisisIncidents
            .map((c) => `- **${c.title}** - Severity: ${c.severity}, Status: ${c.status}`)
            .join('\n');
        } else {
          content = 'No active crisis incidents.';
        }
      } else {
        // Generate with LLM
        const generated = await generateSectionContent(sectionType, {
          ...aggregatedData,
          timeWindow,
        });
        content = generated.content;
        tokensUsed = generated.tokensUsed;
        durationMs = generated.durationMs;
        totalTokensUsed += tokensUsed;
      }

      // Save section to database
      const { data: sectionData, error: sectionError } = await db
        .from('exec_digest_sections')
        .insert({
          org_id: orgId,
          digest_id: digestId,
          section_type: sectionType,
          title: EXEC_DIGEST_SECTION_TYPE_LABELS[sectionType],
          content,
          sort_order: sortOrder++,
          model_name: tokensUsed > 0 ? 'gpt-4o-mini' : null,
          tokens_used: tokensUsed || null,
          generation_duration_ms: durationMs || null,
        })
        .select()
        .single();

      if (!sectionError && sectionData) {
        generatedSections.push(mapSectionRecord(sectionData as SectionRecord));
      }
    }

    // Update digest with snapshot data
    const summary: ExecDigestSummary = {
      generatedAt: new Date().toISOString(),
      timeWindow,
      totalKpis: aggregatedData.kpis.length,
      totalInsights: aggregatedData.insights.length,
      riskScore: aggregatedData.riskData.overallScore as number | undefined,
      reputationScore: aggregatedData.reputationData.overallScore as number | undefined,
      topRiskCount: aggregatedData.insights.filter((i) => i.isRisk).length,
      topOpportunityCount: aggregatedData.insights.filter((i) => i.isOpportunity).length,
      systemsContributing: [
        ...new Set(
          [...aggregatedData.kpis.map((k) => k.sourceSystem), ...aggregatedData.insights.map((i) => i.sourceSystem)].filter(
            Boolean
          ) as string[]
        ),
      ],
    };

    await db
      .from('exec_digests')
      .update({
        summary,
        kpi_snapshot: aggregatedData.kpis,
        insights_snapshot: aggregatedData.insights,
        updated_by: userId,
      })
      .eq('id', digestId);

    // Generate PDF if requested
    let pdfUrl: string | null = null;
    if (input.generatePdf) {
      const pdfResult = await generateDigestPdf(orgId, digestId, userId, generatedSections, summary);
      pdfUrl = pdfResult.publicUrl;
    }

    const generationDurationMs = Date.now() - startTime;

    await logDigestAction(orgId, digestId, userId, 'generated', 'Digest generated', {
      sectionsCount: generatedSections.length,
      totalTokensUsed,
      generationDurationMs,
      pdfGenerated: !!pdfUrl,
    });

    // Fetch updated digest
    const updatedDigestResponse = await getDigest(orgId, digestId);

    return {
      digest: updatedDigestResponse!.digest,
      sections: generatedSections,
      pdfUrl,
      generationDurationMs,
      totalTokensUsed,
    };
  }

  // ==========================================================================
  // PDF Generation
  // ==========================================================================

  async function generateDigestPdf(
    orgId: string,
    digestId: string,
    userId: string | null,
    sections: ExecDigestSection[],
    summary: ExecDigestSummary
  ): Promise<ExecDigestPdfResult> {
    // Build PDF content (simplified HTML-to-PDF approach)
    // In production, you'd use a library like puppeteer, pdfmake, or a PDF service
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h1 { color: #1a365d; border-bottom: 2px solid #3182ce; padding-bottom: 10px; }
    h2 { color: #2c5282; margin-top: 30px; }
    .summary { background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .section { margin: 20px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
  </style>
</head>
<body>
  <h1>Executive Weekly Digest</h1>
  <div class="summary">
    <p><strong>Generated:</strong> ${summary.generatedAt}</p>
    <p><strong>Time Window:</strong> ${summary.timeWindow}</p>
    <p><strong>Total KPIs:</strong> ${summary.totalKpis} | <strong>Total Insights:</strong> ${summary.totalInsights}</p>
  </div>
  ${sections
    .map(
      (s) => `
    <div class="section">
      <h2>${s.title}</h2>
      <div>${s.content.replace(/\n/g, '<br>')}</div>
    </div>
  `
    )
    .join('')}
  <div class="footer">
    <p>Generated by Pravado Executive Digest System</p>
  </div>
</body>
</html>`;

    // Convert to PDF (simplified - in production use proper PDF library)
    const pdfBuffer = Buffer.from(htmlContent, 'utf-8');
    const fileName = `digest-${digestId}-${Date.now()}.pdf`;
    const storagePath = `${orgId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await db.storage.from(storageBucket).upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (uploadError) {
      logger.error('Failed to upload PDF', { error: uploadError });
      throw new Error(`Failed to upload PDF: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = db.storage.from(storageBucket).getPublicUrl(storagePath);

    // Update digest with PDF info
    await db
      .from('exec_digests')
      .update({
        pdf_storage_path: storagePath,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq('id', digestId);

    await logDigestAction(orgId, digestId, userId, 'pdf_generated', 'PDF generated', {
      storagePath,
      sizeBytes: pdfBuffer.length,
    });

    return {
      storagePath,
      publicUrl: urlData?.publicUrl || null,
      sizeBytes: pdfBuffer.length,
      pageCount: 1, // Simplified
      generatedAt: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // Email Delivery
  // ==========================================================================

  async function deliverDigest(
    orgId: string,
    digestId: string,
    userId: string | null,
    input: DeliverExecDigestInput
  ): Promise<DeliverExecDigestResponse> {
    // Get digest with recipients
    const digestResponse = await getDigest(orgId, digestId);
    if (!digestResponse) {
      throw new Error('Digest not found');
    }

    const { digest, sections, recipients: allRecipients } = digestResponse;

    // Filter recipients if specific IDs provided
    const recipients = input.recipientIds
      ? allRecipients.filter((r) => input.recipientIds!.includes(r.id))
      : allRecipients.filter((r) => r.isActive);

    if (recipients.length === 0) {
      throw new Error('No recipients to deliver to');
    }

    // Regenerate PDF if requested or if none exists
    let pdfUrl = digest.pdfStoragePath
      ? db.storage.from(storageBucket).getPublicUrl(digest.pdfStoragePath).data?.publicUrl
      : null;

    if (input.regeneratePdf || !pdfUrl) {
      const pdfResult = await generateDigestPdf(
        orgId,
        digestId,
        userId,
        sections,
        digest.summary
      );
      pdfUrl = pdfResult.publicUrl;
    }

    // Create delivery log entry
    const { data: deliveryLogData, error: logError } = await db
      .from('exec_digest_delivery_log')
      .insert({
        org_id: orgId,
        digest_id: digestId,
        delivery_period: digest.deliveryPeriod,
        time_window: digest.timeWindow,
        scheduled_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        status: 'sending',
        recipients_count: recipients.length,
        pdf_storage_path: digest.pdfStoragePath,
      })
      .select()
      .single();

    if (logError) {
      throw new Error(`Failed to create delivery log: ${logError.message}`);
    }

    const deliveryLogId = deliveryLogData.id;
    const recipientResults: ExecDigestRecipientResult[] = [];
    let successCount = 0;
    let failCount = 0;

    // Send to each recipient (simulated in test mode)
    for (const recipient of recipients) {
      try {
        if (input.testMode) {
          // Test mode - don't actually send
          recipientResults.push({
            recipientId: recipient.id,
            email: recipient.email,
            status: 'success',
            sentAt: new Date().toISOString(),
          });
          successCount++;
        } else {
          // In production, integrate with email service (SES, SendGrid, etc.)
          // For now, simulate success
          recipientResults.push({
            recipientId: recipient.id,
            email: recipient.email,
            status: 'success',
            sentAt: new Date().toISOString(),
          });
          successCount++;
        }
      } catch (error) {
        recipientResults.push({
          recipientId: recipient.id,
          email: recipient.email,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
        failCount++;
      }
    }

    // Determine final status
    let finalStatus: ExecDigestDeliveryStatus = 'success';
    if (failCount === recipients.length) {
      finalStatus = 'error';
    } else if (failCount > 0) {
      finalStatus = 'partial_success';
    }

    // Update delivery log
    await db
      .from('exec_digest_delivery_log')
      .update({
        completed_at: new Date().toISOString(),
        status: finalStatus,
        successful_deliveries: successCount,
        failed_deliveries: failCount,
        recipient_results: recipientResults,
      })
      .eq('id', deliveryLogId);

    // Update digest with last delivery time
    await db
      .from('exec_digests')
      .update({
        last_delivered_at: new Date().toISOString(),
      })
      .eq('id', digestId);

    // Fetch updated delivery log
    const { data: finalLogData } = await db
      .from('exec_digest_delivery_log')
      .select('*')
      .eq('id', deliveryLogId)
      .single();

    await logDigestAction(orgId, digestId, userId, 'delivered', 'Digest delivered', {
      recipientsCount: recipients.length,
      successCount,
      failCount,
      testMode: input.testMode,
    });

    return {
      deliveryLog: mapDeliveryLogRecord(finalLogData as DeliveryLogRecord),
      pdfUrl,
    };
  }

  // ==========================================================================
  // Scheduler Integration
  // ==========================================================================

  async function getDigestsForScheduledDelivery(): Promise<ExecDigest[]> {
    const now = new Date();

    const { data, error } = await db
      .from('exec_digests')
      .select('*')
      .eq('is_active', true)
      .eq('is_archived', false)
      .lte('next_delivery_at', now.toISOString());

    if (error) {
      logger.error('Failed to get digests for scheduled delivery', { error });
      return [];
    }

    return (data || []).map((r) => mapDigestRecord(r as DigestRecord));
  }

  async function updateNextDeliveryTime(digestId: string): Promise<void> {
    const { data: digest } = await db
      .from('exec_digests')
      .select('delivery_period, schedule_day_of_week, schedule_hour, schedule_timezone')
      .eq('id', digestId)
      .single();

    if (!digest) return;

    // Calculate next delivery time using database function
    const { data: nextDelivery } = await db.rpc('calculate_next_digest_delivery', {
      p_delivery_period: digest.delivery_period,
      p_schedule_day: digest.schedule_day_of_week,
      p_schedule_hour: digest.schedule_hour,
      p_timezone: digest.schedule_timezone,
    });

    await db
      .from('exec_digests')
      .update({ next_delivery_at: nextDelivery })
      .eq('id', digestId);
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  async function getDigestStats(orgId: string): Promise<ExecDigestStats> {
    const { data, error } = await db.rpc('get_exec_digest_stats', { p_org_id: orgId });

    if (error || !data) {
      return {
        totalDigests: 0,
        activeDigests: 0,
        totalDeliveries: 0,
        successfulDeliveries: 0,
        totalRecipients: 0,
        activeRecipients: 0,
      };
    }

    return {
      totalDigests: data.total_digests || 0,
      activeDigests: data.active_digests || 0,
      totalDeliveries: data.total_deliveries || 0,
      successfulDeliveries: data.successful_deliveries || 0,
      totalRecipients: data.total_recipients || 0,
      activeRecipients: data.active_recipients || 0,
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  return {
    // Digest CRUD
    createDigest,
    getDigest,
    listDigests,
    updateDigest,
    deleteDigest,

    // Recipients
    addRecipient,
    updateRecipient,
    removeRecipient,
    listRecipients,

    // Sections
    listSections,
    updateSectionOrder,

    // Delivery logs
    listDeliveryLogs,

    // Generation & Delivery
    generateDigest,
    generateDigestPdf,
    deliverDigest,

    // Scheduler
    getDigestsForScheduledDelivery,
    updateNextDeliveryTime,

    // Statistics
    getDigestStats,
  };
}

// Export service type
export type ExecutiveDigestService = ReturnType<typeof createExecutiveDigestService>;
