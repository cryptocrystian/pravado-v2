/**
 * Executive Command Center Service (Sprint S61)
 * Executive Command Center & Cross-System Insights V1
 *
 * Features:
 * - Dashboard CRUD with configurable time windows and focus areas
 * - Cross-system KPI aggregation from Risk Radar, Crisis, Reputation, Governance, etc.
 * - Insight collection from all integrated systems (S38-S60)
 * - LLM-powered narrative generation for executive summaries
 * - Comprehensive audit logging for dashboard actions
 */

import type {
  ExecDashboard,
  ExecDashboardInsight,
  ExecDashboardKpi,
  ExecDashboardNarrative,
  ExecDashboardTimeWindow,
  ExecDashboardPrimaryFocus,
  ExecInsightSourceSystem,
  ExecDashboardActionType,
  ExecDashboardSummary,
  ExecDashboardFilters,
  ExecKpiTrend,
  ExecNarrativeContext,
  ExecNarrativeRiskSummary,
  ExecNarrativeOpportunitySummary,
  ExecNarrativeKpiSnapshot,
  ExecDashboardWithCounts,
  CreateExecDashboardInput,
  UpdateExecDashboardInput,
  RefreshExecDashboardInput,
  ListExecDashboardsQuery,
  ListExecInsightsQuery,
  ListExecKpisQuery,
  ListExecNarrativesQuery,
  ListExecDashboardsResponse,
  GetExecDashboardResponse,
  RefreshExecDashboardResponse,
  ListExecInsightsResponse,
  ListExecKpisResponse,
  ListExecNarrativesResponse,
  GenerateExecNarrativeResponse,
  ExecCommandCenterServiceConfig,
} from '@pravado/types';
import { EXEC_SOURCE_SYSTEM_LABELS } from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('exec-command-center-service');

// ============================================================================
// Database Record Types (snake_case)
// ============================================================================

interface DashboardRecord {
  id: string;
  org_id: string;
  title: string;
  description: string | null;
  time_window: string;
  primary_focus: string;
  filters: Record<string, unknown>;
  summary: Record<string, unknown> | null;
  is_default: boolean;
  is_archived: boolean;
  last_refreshed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface InsightRecord {
  id: string;
  org_id: string;
  dashboard_id: string;
  source_system: string;
  insight_type: string;
  severity_or_impact: number;
  category: string | null;
  title: string;
  description: string | null;
  link_url: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  is_top_insight: boolean;
  is_opportunity: boolean;
  is_risk: boolean;
  sort_order: number;
  meta: Record<string, unknown>;
  created_at: string;
}

interface KpiRecord {
  id: string;
  org_id: string;
  dashboard_id: string;
  metric_key: string;
  metric_label: string;
  metric_value: number;
  metric_unit: string | null;
  metric_trend: Record<string, unknown>;
  display_order: number;
  category: string | null;
  source_system: string | null;
  meta: Record<string, unknown>;
  created_at: string;
}

interface NarrativeRecord {
  id: string;
  org_id: string;
  dashboard_id: string;
  model_name: string;
  tokens_used: number;
  duration_ms: number;
  narrative_text: string;
  risks_section: string | null;
  opportunities_section: string | null;
  storyline_section: string | null;
  context_snapshot: Record<string, unknown>;
  is_current: boolean;
  created_by: string | null;
  created_at: string;
}

// ============================================================================
// Record to Entity Mappers
// ============================================================================

function mapDashboardRecord(record: DashboardRecord): ExecDashboard {
  return {
    id: record.id,
    orgId: record.org_id,
    title: record.title,
    description: record.description,
    timeWindow: record.time_window as ExecDashboardTimeWindow,
    primaryFocus: record.primary_focus as ExecDashboardPrimaryFocus,
    filters: record.filters as ExecDashboardFilters,
    summary: record.summary as ExecDashboardSummary | null,
    isDefault: record.is_default,
    isArchived: record.is_archived,
    lastRefreshedAt: record.last_refreshed_at,
    createdBy: record.created_by,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function mapInsightRecord(record: InsightRecord): ExecDashboardInsight {
  return {
    id: record.id,
    orgId: record.org_id,
    dashboardId: record.dashboard_id,
    sourceSystem: record.source_system as ExecInsightSourceSystem,
    insightType: record.insight_type,
    severityOrImpact: record.severity_or_impact,
    category: record.category,
    title: record.title,
    description: record.description,
    linkUrl: record.link_url,
    linkedEntityType: record.linked_entity_type,
    linkedEntityId: record.linked_entity_id,
    isTopInsight: record.is_top_insight,
    isOpportunity: record.is_opportunity,
    isRisk: record.is_risk,
    sortOrder: record.sort_order,
    meta: record.meta,
    createdAt: record.created_at,
  };
}

function mapKpiRecord(record: KpiRecord): ExecDashboardKpi {
  return {
    id: record.id,
    orgId: record.org_id,
    dashboardId: record.dashboard_id,
    metricKey: record.metric_key,
    metricLabel: record.metric_label,
    metricValue: record.metric_value,
    metricUnit: record.metric_unit,
    metricTrend: record.metric_trend as unknown as ExecKpiTrend,
    displayOrder: record.display_order,
    category: record.category,
    sourceSystem: record.source_system as ExecInsightSourceSystem | null,
    meta: record.meta,
    createdAt: record.created_at,
  };
}

function mapNarrativeRecord(record: NarrativeRecord): ExecDashboardNarrative {
  return {
    id: record.id,
    orgId: record.org_id,
    dashboardId: record.dashboard_id,
    modelName: record.model_name,
    tokensUsed: record.tokens_used,
    durationMs: record.duration_ms,
    narrativeText: record.narrative_text,
    risksSection: record.risks_section,
    opportunitiesSection: record.opportunities_section,
    storylineSection: record.storyline_section,
    contextSnapshot: record.context_snapshot as unknown as ExecNarrativeContext,
    isCurrent: record.is_current,
    createdBy: record.created_by,
    createdAt: record.created_at,
  };
}


// ============================================================================
// Service Factory
// ============================================================================

export function createExecutiveCommandCenterService(config: ExecCommandCenterServiceConfig) {
  const {
    supabase,
    openaiApiKey,
    defaultTimeWindow = '7d',
    defaultPrimaryFocus = 'mixed',
    maxInsightsPerDashboard = 100,
    maxKpisPerDashboard = 30,
    narrativeModelName = 'gpt-4o-mini',
    debugMode: _debugMode = false,
  } = config;

  const db = supabase as SupabaseClient;

  // ==========================================================================
  // Audit Logging
  // ==========================================================================

  async function logDashboardAction(
    orgId: string,
    dashboardId: string | null,
    userId: string | null,
    actionType: ExecDashboardActionType,
    description?: string,
    meta?: Record<string, unknown>
  ): Promise<void> {
    try {
      await db.from('exec_dashboard_audit_log').insert({
        org_id: orgId,
        dashboard_id: dashboardId,
        user_id: userId,
        action_type: actionType,
        description,
        meta: meta || {},
      });
    } catch (error) {
      logger.warn('Failed to log dashboard action', { error, actionType, dashboardId });
    }
  }

  // ==========================================================================
  // Dashboard CRUD
  // ==========================================================================

  async function createDashboard(
    orgId: string,
    userId: string | null,
    input: CreateExecDashboardInput
  ): Promise<ExecDashboard> {
    const { data, error } = await db
      .from('exec_dashboards')
      .insert({
        org_id: orgId,
        title: input.title || 'Executive Dashboard',
        description: input.description || null,
        time_window: input.timeWindow || defaultTimeWindow,
        primary_focus: input.primaryFocus || defaultPrimaryFocus,
        filters: input.filters || {},
        is_default: input.isDefault || false,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create dashboard', { error, orgId });
      throw new Error(`Failed to create dashboard: ${error.message}`);
    }

    const dashboard = mapDashboardRecord(data as DashboardRecord);

    await logDashboardAction(orgId, dashboard.id, userId, 'created', 'Dashboard created', {
      title: dashboard.title,
      timeWindow: dashboard.timeWindow,
      primaryFocus: dashboard.primaryFocus,
    });

    logger.info('Dashboard created', { dashboardId: dashboard.id, orgId });
    return dashboard;
  }

  async function getDashboard(orgId: string, dashboardId: string): Promise<GetExecDashboardResponse | null> {
    const { data: dashboardData, error: dashboardError } = await db
      .from('exec_dashboards')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', dashboardId)
      .single();

    if (dashboardError || !dashboardData) {
      return null;
    }

    const dashboard = mapDashboardRecord(dashboardData as DashboardRecord);

    // Fetch KPIs
    const { data: kpisData } = await db
      .from('exec_dashboard_kpis')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .order('display_order', { ascending: true });

    const kpis = (kpisData || []).map((r) => mapKpiRecord(r as KpiRecord));

    // Fetch top insights
    const { data: insightsData } = await db
      .from('exec_dashboard_insights')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .eq('is_top_insight', true)
      .order('sort_order', { ascending: true })
      .limit(10);

    const topInsights = (insightsData || []).map((r) => mapInsightRecord(r as InsightRecord));

    // Fetch current narrative
    const { data: narrativeData } = await db
      .from('exec_dashboard_narratives')
      .select('*')
      .eq('dashboard_id', dashboardId)
      .eq('is_current', true)
      .single();

    const currentNarrative = narrativeData
      ? mapNarrativeRecord(narrativeData as NarrativeRecord)
      : null;

    return {
      dashboard,
      kpis,
      topInsights,
      currentNarrative,
    };
  }

  async function listDashboards(
    orgId: string,
    query: ListExecDashboardsQuery
  ): Promise<ListExecDashboardsResponse> {
    const { includeArchived = false, primaryFocus, limit = 20, offset = 0 } = query;

    let dbQuery = db
      .from('exec_dashboards')
      .select('*, exec_dashboard_insights(count), exec_dashboard_kpis(count), exec_dashboard_narratives(count)', {
        count: 'exact',
      })
      .eq('org_id', orgId);

    if (!includeArchived) {
      dbQuery = dbQuery.eq('is_archived', false);
    }

    if (primaryFocus) {
      dbQuery = dbQuery.eq('primary_focus', primaryFocus);
    }

    dbQuery = dbQuery
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list dashboards', { error, orgId });
      throw new Error(`Failed to list dashboards: ${error.message}`);
    }

    const dashboards: ExecDashboardWithCounts[] = (data || []).map((record: DashboardRecord & {
      exec_dashboard_insights: { count: number }[];
      exec_dashboard_kpis: { count: number }[];
      exec_dashboard_narratives: { count: number }[];
    }) => ({
      ...mapDashboardRecord(record),
      insightsCount: record.exec_dashboard_insights?.[0]?.count || 0,
      kpisCount: record.exec_dashboard_kpis?.[0]?.count || 0,
      hasNarrative: (record.exec_dashboard_narratives?.[0]?.count || 0) > 0,
    }));

    return {
      dashboards,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  async function updateDashboard(
    orgId: string,
    dashboardId: string,
    userId: string | null,
    input: UpdateExecDashboardInput
  ): Promise<ExecDashboard | null> {
    const updateData: Record<string, unknown> = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.timeWindow !== undefined) updateData.time_window = input.timeWindow;
    if (input.primaryFocus !== undefined) updateData.primary_focus = input.primaryFocus;
    if (input.filters !== undefined) updateData.filters = input.filters;
    if (input.isDefault !== undefined) updateData.is_default = input.isDefault;
    if (input.isArchived !== undefined) updateData.is_archived = input.isArchived;

    if (Object.keys(updateData).length === 0) {
      const existing = await getDashboard(orgId, dashboardId);
      return existing?.dashboard || null;
    }

    const { data, error } = await db
      .from('exec_dashboards')
      .update(updateData)
      .eq('org_id', orgId)
      .eq('id', dashboardId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update dashboard', { error, dashboardId, orgId });
      throw new Error(`Failed to update dashboard: ${error.message}`);
    }

    if (!data) return null;

    const dashboard = mapDashboardRecord(data as DashboardRecord);

    await logDashboardAction(orgId, dashboardId, userId, 'updated', 'Dashboard updated', {
      changes: Object.keys(updateData),
    });

    return dashboard;
  }

  async function deleteDashboard(
    orgId: string,
    dashboardId: string,
    userId: string | null,
    hardDelete = false
  ): Promise<boolean> {
    if (hardDelete) {
      const { error } = await db
        .from('exec_dashboards')
        .delete()
        .eq('org_id', orgId)
        .eq('id', dashboardId);

      if (error) {
        logger.error('Failed to delete dashboard', { error, dashboardId, orgId });
        return false;
      }
    } else {
      const { error } = await db
        .from('exec_dashboards')
        .update({ is_archived: true })
        .eq('org_id', orgId)
        .eq('id', dashboardId);

      if (error) {
        logger.error('Failed to archive dashboard', { error, dashboardId, orgId });
        return false;
      }
    }

    await logDashboardAction(orgId, dashboardId, userId, 'deleted', hardDelete ? 'Dashboard deleted' : 'Dashboard archived');

    return true;
  }

  // ==========================================================================
  // Insights Management
  // ==========================================================================

  async function listInsights(
    orgId: string,
    query: ListExecInsightsQuery
  ): Promise<ListExecInsightsResponse> {
    const {
      dashboardId,
      sourceSystem,
      category,
      isTopInsight,
      isRisk,
      isOpportunity,
      limit = 50,
      offset = 0,
    } = query;

    let dbQuery = db
      .from('exec_dashboard_insights')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('dashboard_id', dashboardId);

    if (sourceSystem) dbQuery = dbQuery.eq('source_system', sourceSystem);
    if (category) dbQuery = dbQuery.eq('category', category);
    if (isTopInsight !== undefined) dbQuery = dbQuery.eq('is_top_insight', isTopInsight);
    if (isRisk !== undefined) dbQuery = dbQuery.eq('is_risk', isRisk);
    if (isOpportunity !== undefined) dbQuery = dbQuery.eq('is_opportunity', isOpportunity);

    dbQuery = dbQuery
      .order('sort_order', { ascending: true })
      .order('severity_or_impact', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list insights', { error, dashboardId, orgId });
      throw new Error(`Failed to list insights: ${error.message}`);
    }

    const insights = (data || []).map((r) => mapInsightRecord(r as InsightRecord));

    return {
      insights,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  async function createInsight(
    orgId: string,
    dashboardId: string,
    input: {
      sourceSystem: ExecInsightSourceSystem;
      insightType: string;
      severityOrImpact: number;
      category?: string;
      title: string;
      description?: string;
      linkUrl?: string;
      linkedEntityType?: string;
      linkedEntityId?: string;
      isTopInsight?: boolean;
      isOpportunity?: boolean;
      isRisk?: boolean;
      sortOrder?: number;
      meta?: Record<string, unknown>;
    }
  ): Promise<ExecDashboardInsight> {
    const { data, error } = await db
      .from('exec_dashboard_insights')
      .insert({
        org_id: orgId,
        dashboard_id: dashboardId,
        source_system: input.sourceSystem,
        insight_type: input.insightType,
        severity_or_impact: input.severityOrImpact,
        category: input.category || null,
        title: input.title,
        description: input.description || null,
        link_url: input.linkUrl || null,
        linked_entity_type: input.linkedEntityType || null,
        linked_entity_id: input.linkedEntityId || null,
        is_top_insight: input.isTopInsight || false,
        is_opportunity: input.isOpportunity || false,
        is_risk: input.isRisk || false,
        sort_order: input.sortOrder || 0,
        meta: input.meta || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create insight', { error, dashboardId, orgId });
      throw new Error(`Failed to create insight: ${error.message}`);
    }

    return mapInsightRecord(data as InsightRecord);
  }

  async function clearDashboardInsights(orgId: string, dashboardId: string): Promise<number> {
    const { error, count } = await db
      .from('exec_dashboard_insights')
      .delete({ count: 'exact' })
      .eq('org_id', orgId)
      .eq('dashboard_id', dashboardId);

    if (error) {
      logger.error('Failed to clear insights', { error, dashboardId, orgId });
      throw new Error(`Failed to clear insights: ${error.message}`);
    }

    return count || 0;
  }

  // ==========================================================================
  // KPIs Management
  // ==========================================================================

  async function listKpis(
    orgId: string,
    query: ListExecKpisQuery
  ): Promise<ListExecKpisResponse> {
    const { dashboardId, category, sourceSystem, limit = 20, offset = 0 } = query;

    let dbQuery = db
      .from('exec_dashboard_kpis')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('dashboard_id', dashboardId);

    if (category) dbQuery = dbQuery.eq('category', category);
    if (sourceSystem) dbQuery = dbQuery.eq('source_system', sourceSystem);

    dbQuery = dbQuery
      .order('display_order', { ascending: true })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list KPIs', { error, dashboardId, orgId });
      throw new Error(`Failed to list KPIs: ${error.message}`);
    }

    const kpis = (data || []).map((r) => mapKpiRecord(r as KpiRecord));

    return {
      kpis,
      total: count || 0,
    };
  }

  async function createKpi(
    orgId: string,
    dashboardId: string,
    input: {
      metricKey: string;
      metricLabel: string;
      metricValue: number;
      metricUnit?: string;
      metricTrend?: ExecKpiTrend;
      displayOrder?: number;
      category?: string;
      sourceSystem?: ExecInsightSourceSystem;
      meta?: Record<string, unknown>;
    }
  ): Promise<ExecDashboardKpi> {
    const { data, error } = await db
      .from('exec_dashboard_kpis')
      .insert({
        org_id: orgId,
        dashboard_id: dashboardId,
        metric_key: input.metricKey,
        metric_label: input.metricLabel,
        metric_value: input.metricValue,
        metric_unit: input.metricUnit || null,
        metric_trend: input.metricTrend || { direction: 'flat', change: 0, previousValue: null },
        display_order: input.displayOrder || 0,
        category: input.category || null,
        source_system: input.sourceSystem || null,
        meta: input.meta || {},
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create KPI', { error, dashboardId, orgId });
      throw new Error(`Failed to create KPI: ${error.message}`);
    }

    return mapKpiRecord(data as KpiRecord);
  }

  async function clearDashboardKpis(orgId: string, dashboardId: string): Promise<number> {
    const { error, count } = await db
      .from('exec_dashboard_kpis')
      .delete({ count: 'exact' })
      .eq('org_id', orgId)
      .eq('dashboard_id', dashboardId);

    if (error) {
      logger.error('Failed to clear KPIs', { error, dashboardId, orgId });
      throw new Error(`Failed to clear KPIs: ${error.message}`);
    }

    return count || 0;
  }

  // ==========================================================================
  // Narratives Management
  // ==========================================================================

  async function listNarratives(
    orgId: string,
    query: ListExecNarrativesQuery
  ): Promise<ListExecNarrativesResponse> {
    const { dashboardId, limit = 10, offset = 0 } = query;

    const { data, error, count } = await db
      .from('exec_dashboard_narratives')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('dashboard_id', dashboardId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Failed to list narratives', { error, dashboardId, orgId });
      throw new Error(`Failed to list narratives: ${error.message}`);
    }

    const narratives = (data || []).map((r) => mapNarrativeRecord(r as NarrativeRecord));

    return {
      narratives,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  }

  async function generateNarrative(
    orgId: string,
    dashboardId: string,
    userId: string | null,
    contextSnapshot: ExecNarrativeContext
  ): Promise<GenerateExecNarrativeResponse> {
    const startTime = Date.now();

    // Build the prompt for narrative generation
    const topRisksText = contextSnapshot.topRisks
      .map((r, i) => `${i + 1}. ${r.title} (Severity: ${r.severity}, Source: ${EXEC_SOURCE_SYSTEM_LABELS[r.source]})`)
      .join('\n');

    const topOpportunitiesText = contextSnapshot.topOpportunities
      .map((o, i) => `${i + 1}. ${o.title} (Impact: ${o.impact}, Source: ${EXEC_SOURCE_SYSTEM_LABELS[o.source]})`)
      .join('\n');

    const kpiText = contextSnapshot.kpiSnapshot
      .map((k) => `- ${k.label}: ${k.value} (Trend: ${k.trend}${k.changePercent ? `, ${k.changePercent > 0 ? '+' : ''}${k.changePercent}%` : ''})`)
      .join('\n');

    const prompt = `You are an executive communications advisor generating a concise weekly briefing for C-suite leadership.

Time Period: ${contextSnapshot.timeWindow === '24h' ? 'Last 24 Hours' : contextSnapshot.timeWindow === '7d' ? 'This Week' : contextSnapshot.timeWindow === '30d' ? 'This Month' : 'This Quarter'}
Focus Area: ${contextSnapshot.primaryFocus}

TOP RISKS:
${topRisksText || 'No significant risks identified.'}

TOP OPPORTUNITIES:
${topOpportunitiesText || 'No notable opportunities identified.'}

KEY METRICS:
${kpiText || 'No metrics available.'}

Generate a brief executive summary with three sections:
1. RISKS: A 2-3 sentence summary of the most critical risks requiring attention.
2. OPPORTUNITIES: A 2-3 sentence summary of the best growth or improvement opportunities.
3. THIS WEEK'S STORYLINE: A 3-4 sentence narrative that ties together the key themes and provides strategic context.

Keep the tone professional, direct, and action-oriented. Focus on what matters most to leadership.`;

    // Simulate LLM call (in production, this would call OpenAI or similar)
    let narrativeText = '';
    let risksSection = '';
    let opportunitiesSection = '';
    let storylineSection = '';
    let tokensUsed = 0;

    if (openaiApiKey) {
      try {
        // Production: Use actual OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiApiKey}`,
          },
          body: JSON.stringify({
            model: narrativeModelName,
            messages: [
              { role: 'system', content: 'You are an executive communications advisor.' },
              { role: 'user', content: prompt },
            ],
            max_tokens: 800,
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const result = await response.json() as {
            choices?: Array<{ message?: { content?: string } }>;
            usage?: { total_tokens?: number };
          };
          narrativeText = result.choices?.[0]?.message?.content || '';
          tokensUsed = result.usage?.total_tokens || 0;

          // Parse sections from response
          const risksMatch = narrativeText.match(/RISKS?:?\s*([\s\S]*?)(?=OPPORTUNITIES?:|THIS WEEK|$)/i);
          const opportunitiesMatch = narrativeText.match(/OPPORTUNITIES?:?\s*([\s\S]*?)(?=THIS WEEK|STORYLINE|$)/i);
          const storylineMatch = narrativeText.match(/(?:THIS WEEK'?S?|STORYLINE):?\s*([\s\S]*?)$/i);

          risksSection = risksMatch?.[1]?.trim() || '';
          opportunitiesSection = opportunitiesMatch?.[1]?.trim() || '';
          storylineSection = storylineMatch?.[1]?.trim() || '';
        }
      } catch (error) {
        logger.error('LLM narrative generation failed', { error, dashboardId });
      }
    }

    // Fallback if no LLM or LLM failed
    if (!narrativeText) {
      risksSection = contextSnapshot.topRisks.length > 0
        ? `Key risks include ${contextSnapshot.topRisks.slice(0, 3).map((r) => r.title.toLowerCase()).join(', ')}. These require immediate attention from leadership.`
        : 'No significant risks identified during this period.';

      opportunitiesSection = contextSnapshot.topOpportunities.length > 0
        ? `Notable opportunities include ${contextSnapshot.topOpportunities.slice(0, 3).map((o) => o.title.toLowerCase()).join(', ')}. These present potential for growth.`
        : 'Continue monitoring for emerging opportunities.';

      storylineSection = `The overall risk posture remains ${contextSnapshot.kpiSnapshot.find((k) => k.key === 'overall_risk_index')?.value || 'moderate'}. Focus areas for the coming week should include addressing top risks while positioning for identified opportunities.`;

      narrativeText = `RISKS:\n${risksSection}\n\nOPPORTUNITIES:\n${opportunitiesSection}\n\nTHIS WEEK'S STORYLINE:\n${storylineSection}`;
      tokensUsed = 0;
    }

    const durationMs = Date.now() - startTime;

    // Save narrative
    const { data, error } = await db
      .from('exec_dashboard_narratives')
      .insert({
        org_id: orgId,
        dashboard_id: dashboardId,
        model_name: openaiApiKey ? narrativeModelName : 'template',
        tokens_used: tokensUsed,
        duration_ms: durationMs,
        narrative_text: narrativeText,
        risks_section: risksSection,
        opportunities_section: opportunitiesSection,
        storyline_section: storylineSection,
        context_snapshot: contextSnapshot as unknown as Record<string, unknown>,
        is_current: true,
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to save narrative', { error, dashboardId, orgId });
      throw new Error(`Failed to save narrative: ${error.message}`);
    }

    const narrative = mapNarrativeRecord(data as NarrativeRecord);

    await logDashboardAction(orgId, dashboardId, userId, 'narrative_generated', 'Narrative generated', {
      tokensUsed,
      durationMs,
      modelName: narrative.modelName,
    });

    return {
      narrative,
      tokensUsed,
      durationMs,
    };
  }

  // ==========================================================================
  // Data Aggregation from Upstream Services
  // ==========================================================================

  async function aggregateUpstreamData(
    orgId: string,
    timeWindow: ExecDashboardTimeWindow,
    primaryFocus: ExecDashboardPrimaryFocus
  ): Promise<{
    kpis: Array<{
      metricKey: string;
      metricLabel: string;
      metricValue: number;
      metricUnit?: string;
      metricTrend: ExecKpiTrend;
      category: string;
      sourceSystem: ExecInsightSourceSystem;
      displayOrder: number;
    }>;
    insights: Array<{
      sourceSystem: ExecInsightSourceSystem;
      insightType: string;
      severityOrImpact: number;
      category: string;
      title: string;
      description: string;
      isTopInsight: boolean;
      isRisk: boolean;
      isOpportunity: boolean;
      sortOrder: number;
    }>;
  }> {
    const kpis: Array<{
      metricKey: string;
      metricLabel: string;
      metricValue: number;
      metricUnit?: string;
      metricTrend: ExecKpiTrend;
      category: string;
      sourceSystem: ExecInsightSourceSystem;
      displayOrder: number;
    }> = [];
    const insights: Array<{
      sourceSystem: ExecInsightSourceSystem;
      insightType: string;
      severityOrImpact: number;
      category: string;
      title: string;
      description: string;
      isTopInsight: boolean;
      isRisk: boolean;
      isOpportunity: boolean;
      sortOrder: number;
    }> = [];

    let displayOrder = 0;
    let sortOrder = 0;

    // Calculate date range
    const startDate = new Date();
    switch (timeWindow) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    // 1. Risk Radar (S60)
    if (primaryFocus === 'risk' || primaryFocus === 'mixed') {
      try {
        const { data: riskSnapshot } = await db
          .from('risk_radar_snapshots')
          .select('*')
          .eq('org_id', orgId)
          .eq('is_active', true)
          .single();

        if (riskSnapshot) {
          kpis.push({
            metricKey: 'overall_risk_index',
            metricLabel: 'Overall Risk Index',
            metricValue: riskSnapshot.overall_risk_index || 0,
            metricUnit: 'score',
            metricTrend: { direction: 'flat', change: 0, previousValue: null },
            category: 'risk',
            sourceSystem: 'risk_radar',
            displayOrder: displayOrder++,
          });

          if (riskSnapshot.risk_level === 'critical' || riskSnapshot.risk_level === 'high') {
            insights.push({
              sourceSystem: 'risk_radar',
              insightType: 'risk_level_alert',
              severityOrImpact: riskSnapshot.overall_risk_index || 75,
              category: 'risk',
              title: `Risk Level: ${riskSnapshot.risk_level.toUpperCase()}`,
              description: `Overall risk index at ${riskSnapshot.overall_risk_index}. Immediate attention required.`,
              isTopInsight: true,
              isRisk: true,
              isOpportunity: false,
              sortOrder: sortOrder++,
            });
          }
        }
      } catch (error) {
        logger.debug('Risk radar data unavailable', { error });
      }
    }

    // 2. Crisis (S55)
    if (primaryFocus === 'risk' || primaryFocus === 'mixed') {
      try {
        const { data: crisisData, count } = await db
          .from('crisis_incidents')
          .select('*', { count: 'exact' })
          .eq('org_id', orgId)
          .in('status', ['active', 'escalated'])
          .gte('created_at', startDate.toISOString());

        const activeCrises = count || 0;
        kpis.push({
          metricKey: 'active_crises',
          metricLabel: 'Active Crises',
          metricValue: activeCrises,
          metricUnit: 'count',
          metricTrend: { direction: activeCrises > 0 ? 'up' : 'flat', change: 0, previousValue: null },
          category: 'risk',
          sourceSystem: 'crisis',
          displayOrder: displayOrder++,
        });

        if (crisisData && crisisData.length > 0) {
          const criticalCrises = crisisData.filter((c: { severity: string }) => c.severity === 'critical');
          if (criticalCrises.length > 0) {
            insights.push({
              sourceSystem: 'crisis',
              insightType: 'critical_crisis',
              severityOrImpact: 95,
              category: 'crisis',
              title: `${criticalCrises.length} Critical Crisis${criticalCrises.length > 1 ? 'es' : ''} Active`,
              description: `Critical crisis incidents require immediate executive attention.`,
              isTopInsight: true,
              isRisk: true,
              isOpportunity: false,
              sortOrder: sortOrder++,
            });
          }
        }
      } catch (error) {
        logger.debug('Crisis data unavailable', { error });
      }
    }

    // 3. Brand Reputation (S56)
    if (primaryFocus === 'reputation' || primaryFocus === 'mixed') {
      try {
        const { data: reputationData } = await db
          .from('brand_reputation_snapshots')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (reputationData) {
          kpis.push({
            metricKey: 'reputation_score',
            metricLabel: 'Reputation Score',
            metricValue: reputationData.overall_score || 0,
            metricUnit: 'score',
            metricTrend: { direction: 'flat', change: 0, previousValue: null },
            category: 'reputation',
            sourceSystem: 'reputation',
            displayOrder: displayOrder++,
          });

          if (reputationData.overall_score >= 80) {
            insights.push({
              sourceSystem: 'reputation',
              insightType: 'strong_reputation',
              severityOrImpact: reputationData.overall_score,
              category: 'reputation',
              title: 'Strong Brand Reputation',
              description: `Brand reputation score of ${reputationData.overall_score} indicates positive market perception.`,
              isTopInsight: true,
              isRisk: false,
              isOpportunity: true,
              sortOrder: sortOrder++,
            });
          } else if (reputationData.overall_score < 50) {
            insights.push({
              sourceSystem: 'reputation',
              insightType: 'reputation_concern',
              severityOrImpact: 100 - reputationData.overall_score,
              category: 'reputation',
              title: 'Reputation Needs Attention',
              description: `Brand reputation score of ${reputationData.overall_score} suggests improvement needed.`,
              isTopInsight: true,
              isRisk: true,
              isOpportunity: false,
              sortOrder: sortOrder++,
            });
          }
        }
      } catch (error) {
        logger.debug('Reputation data unavailable', { error });
      }
    }

    // 4. Governance (S59)
    if (primaryFocus === 'governance' || primaryFocus === 'mixed') {
      try {
        const { data: governanceData } = await db
          .from('governance_compliance_snapshots')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (governanceData) {
          kpis.push({
            metricKey: 'compliance_score',
            metricLabel: 'Compliance Score',
            metricValue: governanceData.compliance_score || 0,
            metricUnit: 'percent',
            metricTrend: { direction: 'flat', change: 0, previousValue: null },
            category: 'governance',
            sourceSystem: 'governance',
            displayOrder: displayOrder++,
          });

          if (governanceData.compliance_score < 70) {
            insights.push({
              sourceSystem: 'governance',
              insightType: 'compliance_gap',
              severityOrImpact: 100 - governanceData.compliance_score,
              category: 'governance',
              title: 'Compliance Gap Identified',
              description: `Compliance score of ${governanceData.compliance_score}% requires remediation.`,
              isTopInsight: true,
              isRisk: true,
              isOpportunity: false,
              sortOrder: sortOrder++,
            });
          }
        }
      } catch (error) {
        logger.debug('Governance data unavailable', { error });
      }
    }

    // 5. Media Performance (S52)
    if (primaryFocus === 'growth' || primaryFocus === 'mixed') {
      try {
        const { data: mediaData } = await db
          .from('media_performance_snapshots')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (mediaData) {
          kpis.push({
            metricKey: 'media_evi',
            metricLabel: 'Media EVI',
            metricValue: mediaData.evi_score || 0,
            metricUnit: 'score',
            metricTrend: { direction: 'flat', change: 0, previousValue: null },
            category: 'media',
            sourceSystem: 'media_performance',
            displayOrder: displayOrder++,
          });

          if (mediaData.evi_score >= 75) {
            insights.push({
              sourceSystem: 'media_performance',
              insightType: 'strong_media_performance',
              severityOrImpact: mediaData.evi_score,
              category: 'media',
              title: 'Strong Media Performance',
              description: `EVI score of ${mediaData.evi_score} indicates effective media coverage.`,
              isTopInsight: true,
              isRisk: false,
              isOpportunity: true,
              sortOrder: sortOrder++,
            });
          }
        }
      } catch (error) {
        logger.debug('Media performance data unavailable', { error });
      }
    }

    // 6. Competitive Intelligence (S53)
    if (primaryFocus === 'growth' || primaryFocus === 'mixed') {
      try {
        const { data: compData } = await db
          .from('competitive_intel_snapshots')
          .select('*')
          .eq('org_id', orgId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (compData) {
          kpis.push({
            metricKey: 'share_of_voice',
            metricLabel: 'Share of Voice',
            metricValue: compData.share_of_voice || 0,
            metricUnit: 'percent',
            metricTrend: { direction: 'flat', change: 0, previousValue: null },
            category: 'competitive',
            sourceSystem: 'competitive_intel',
            displayOrder: displayOrder++,
          });

          if (compData.share_of_voice >= 30) {
            insights.push({
              sourceSystem: 'competitive_intel',
              insightType: 'market_leadership',
              severityOrImpact: compData.share_of_voice,
              category: 'competitive',
              title: 'Strong Market Position',
              description: `Share of voice at ${compData.share_of_voice}% indicates market leadership.`,
              isTopInsight: true,
              isRisk: false,
              isOpportunity: true,
              sortOrder: sortOrder++,
            });
          }
        }
      } catch (error) {
        logger.debug('Competitive intel data unavailable', { error });
      }
    }

    // 7. PR Outreach (S44)
    if (primaryFocus === 'growth' || primaryFocus === 'mixed') {
      try {
        const { data: _outreachData, count } = await db
          .from('pr_outreach_campaigns')
          .select('*', { count: 'exact' })
          .eq('org_id', orgId)
          .eq('status', 'active')
          .gte('created_at', startDate.toISOString());

        const activeCampaigns = count || 0;
        if (activeCampaigns > 0) {
          kpis.push({
            metricKey: 'active_campaigns',
            metricLabel: 'Active Campaigns',
            metricValue: activeCampaigns,
            metricUnit: 'count',
            metricTrend: { direction: 'flat', change: 0, previousValue: null },
            category: 'outreach',
            sourceSystem: 'outreach',
            displayOrder: displayOrder++,
          });

          insights.push({
            sourceSystem: 'outreach',
            insightType: 'active_campaigns',
            severityOrImpact: Math.min(activeCampaigns * 10, 100),
            category: 'outreach',
            title: `${activeCampaigns} Active Outreach Campaign${activeCampaigns > 1 ? 's' : ''}`,
            description: 'PR outreach campaigns are in progress, driving media engagement.',
            isTopInsight: false,
            isRisk: false,
            isOpportunity: true,
            sortOrder: sortOrder++,
          });
        }
      } catch (error) {
        logger.debug('Outreach data unavailable', { error });
      }
    }

    // Sort and limit insights
    insights.sort((a, b) => {
      if (a.isTopInsight !== b.isTopInsight) return a.isTopInsight ? -1 : 1;
      return b.severityOrImpact - a.severityOrImpact;
    });

    return {
      kpis: kpis.slice(0, maxKpisPerDashboard),
      insights: insights.slice(0, maxInsightsPerDashboard),
    };
  }

  // ==========================================================================
  // Dashboard Refresh
  // ==========================================================================

  async function refreshDashboard(
    orgId: string,
    dashboardId: string,
    userId: string | null,
    input: RefreshExecDashboardInput
  ): Promise<RefreshExecDashboardResponse> {
    const startTime = Date.now();

    // Get current dashboard
    const dashboardResponse = await getDashboard(orgId, dashboardId);
    if (!dashboardResponse) {
      throw new Error('Dashboard not found');
    }

    const { dashboard } = dashboardResponse;
    const timeWindow = input.timeWindowOverride || dashboard.timeWindow;
    const primaryFocus = input.primaryFocusOverride || dashboard.primaryFocus;

    // Clear existing data if force refresh
    if (input.forceRefresh) {
      await clearDashboardKpis(orgId, dashboardId);
      await clearDashboardInsights(orgId, dashboardId);
    }

    // Aggregate upstream data
    const { kpis, insights } = await aggregateUpstreamData(orgId, timeWindow, primaryFocus);

    // Create KPIs
    let kpisCreated = 0;
    for (const kpi of kpis) {
      try {
        await createKpi(orgId, dashboardId, kpi);
        kpisCreated++;
      } catch (error) {
        logger.warn('Failed to create KPI', { error, kpi: kpi.metricKey });
      }
    }

    // Create insights
    let insightsCreated = 0;
    for (const insight of insights) {
      try {
        await createInsight(orgId, dashboardId, insight);
        insightsCreated++;
      } catch (error) {
        logger.warn('Failed to create insight', { error, insight: insight.title });
      }
    }

    // Generate narrative if requested
    let narrativeGenerated = false;
    if (input.regenerateNarrative !== false) {
      const topRisks: ExecNarrativeRiskSummary[] = insights
        .filter((i) => i.isRisk)
        .slice(0, 5)
        .map((i) => ({
          title: i.title,
          severity: i.severityOrImpact,
          source: i.sourceSystem,
          description: i.description,
        }));

      const topOpportunities: ExecNarrativeOpportunitySummary[] = insights
        .filter((i) => i.isOpportunity)
        .slice(0, 5)
        .map((i) => ({
          title: i.title,
          impact: i.severityOrImpact,
          source: i.sourceSystem,
          description: i.description,
        }));

      const kpiSnapshot: ExecNarrativeKpiSnapshot[] = kpis.map((k) => ({
        key: k.metricKey,
        label: k.metricLabel,
        value: k.metricValue,
        trend: k.metricTrend.direction,
        changePercent: k.metricTrend.changePercent,
      }));

      const sourceSystemStats: Record<ExecInsightSourceSystem, number> = {} as Record<ExecInsightSourceSystem, number>;
      for (const insight of insights) {
        sourceSystemStats[insight.sourceSystem] = (sourceSystemStats[insight.sourceSystem] || 0) + 1;
      }

      const context: ExecNarrativeContext = {
        timeWindow,
        primaryFocus,
        topRisks,
        topOpportunities,
        kpiSnapshot,
        sourceSystemStats,
        generatedAt: new Date().toISOString(),
      };

      try {
        await generateNarrative(orgId, dashboardId, userId, context);
        narrativeGenerated = true;
      } catch (error) {
        logger.error('Failed to generate narrative', { error, dashboardId });
      }
    }

    // Update dashboard summary and last_refreshed_at
    const summary: ExecDashboardSummary = {
      totalInsights: insightsCreated,
      topRisksCount: insights.filter((i) => i.isRisk).length,
      topOpportunitiesCount: insights.filter((i) => i.isOpportunity).length,
      activeKpis: kpisCreated,
      lastUpdated: new Date().toISOString(),
      sourceBreakdown: {} as Record<ExecInsightSourceSystem, number>,
    };

    for (const insight of insights) {
      summary.sourceBreakdown[insight.sourceSystem] = (summary.sourceBreakdown[insight.sourceSystem] || 0) + 1;
    }

    // Extract key scores from KPIs
    const riskKpi = kpis.find((k) => k.metricKey === 'overall_risk_index');
    const repKpi = kpis.find((k) => k.metricKey === 'reputation_score');
    const crisisKpi = kpis.find((k) => k.metricKey === 'active_crises');
    const govKpi = kpis.find((k) => k.metricKey === 'compliance_score');

    if (riskKpi) summary.overallRiskIndex = riskKpi.metricValue;
    if (repKpi) summary.reputationScore = repKpi.metricValue;
    if (crisisKpi) summary.crisisCount = crisisKpi.metricValue;
    if (govKpi) summary.governanceScore = govKpi.metricValue;

    await db
      .from('exec_dashboards')
      .update({
        summary,
        last_refreshed_at: new Date().toISOString(),
        time_window: timeWindow,
        primary_focus: primaryFocus,
      })
      .eq('org_id', orgId)
      .eq('id', dashboardId);

    const durationMs = Date.now() - startTime;

    await logDashboardAction(orgId, dashboardId, userId, 'refreshed', 'Dashboard refreshed', {
      kpisCreated,
      insightsCreated,
      narrativeGenerated,
      durationMs,
      timeWindow,
      primaryFocus,
    });

    // Get updated dashboard
    const updatedDashboard = await getDashboard(orgId, dashboardId);

    logger.info('Dashboard refreshed', { dashboardId, kpisCreated, insightsCreated, durationMs });

    return {
      dashboard: updatedDashboard!.dashboard,
      kpisCreated,
      insightsCreated,
      narrativeGenerated,
      durationMs,
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  return {
    // Dashboard CRUD
    createDashboard,
    getDashboard,
    listDashboards,
    updateDashboard,
    deleteDashboard,

    // Insights
    listInsights,
    createInsight,
    clearDashboardInsights,

    // KPIs
    listKpis,
    createKpi,
    clearDashboardKpis,

    // Narratives
    listNarratives,
    generateNarrative,

    // Refresh
    refreshDashboard,

    // Audit
    logDashboardAction,
  };
}

export type ExecutiveCommandCenterService = ReturnType<typeof createExecutiveCommandCenterService>;
