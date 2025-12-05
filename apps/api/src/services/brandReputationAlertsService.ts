/**
 * Brand Reputation Alerts & Executive Reporting Service (Sprint S57)
 *
 * Service for managing alert rules, evaluating alerts, generating executive reports,
 * and providing reputation insights that build on S56 Brand Reputation Intelligence.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_REPORT_SECTION_ORDER,
  DEFAULT_SECTION_TITLES,
} from '@pravado/types';
import type {
  BrandReputationAlertRule,
  BrandReputationAlertEvent,
  BrandReputationReport,
  BrandReputationReportSection,
  BrandReputationReportRecipient,
  CreateReputationAlertRuleInput,
  UpdateReputationAlertRuleInput,
  ListReputationAlertRulesQuery,
  ListReputationAlertRulesResponse,
  ListReputationAlertEventsQuery,
  ListReputationAlertEventsResponse,
  CreateReputationReportInput,
  GenerateReputationReportInput,
  RegenerateReputationReportSectionInput,
  ListReputationReportsQuery,
  ListReputationReportsResponse,
  GetReputationReportInsightsResponse,
  GetReputationInsightsQuery,
  AlertEvaluationSnapshotContext,
  AlertEvaluationWindowContext,
  AlertEvaluationResult,
  AlertRuleEvaluationResult,
  BrandReputationScoreSnapshot,
  ComponentScoresMap,
  CompetitorReputationSnapshot,
  CrisisIncidentSummary,
  ReputationInsightDriver,
  ReputationAlertChannel,
  ReputationAlertStatus,
  ReputationReportFrequency,
  ReputationReportFormat,
  ReputationReportStatus,
  ReputationReportSectionType,
  ReputationComponentKey,
  GetReportResponse,
  CreateReportResponse,
  GenerateReportResponse,
  RegenerateSectionResponse,
} from '@pravado/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class BrandReputationAlertsService {
  constructor(private supabase: SupabaseClient) {}

  // ==========================================================================
  // ALERT RULES CRUD
  // ==========================================================================

  /**
   * Create a new alert rule
   */
  async createAlertRule(
    orgId: string,
    input: CreateReputationAlertRuleInput,
    userId?: string
  ): Promise<BrandReputationAlertRule> {
    const { data, error } = await this.supabase
      .from('brand_reputation_alert_rules')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description,
        is_active: input.isActive ?? true,
        channel: input.channel ?? 'in_app',
        min_overall_score: input.minOverallScore,
        max_overall_score: input.maxOverallScore,
        min_delta_overall_score: input.minDeltaOverallScore,
        max_delta_overall_score: input.maxDeltaOverallScore,
        component_key: input.componentKey,
        min_component_score: input.minComponentScore,
        competitor_slug: input.competitorSlug,
        min_competitor_gap: input.minCompetitorGap,
        max_competitor_gap: input.maxCompetitorGap,
        min_incident_severity: input.minIncidentSeverity,
        link_crisis_incidents: input.linkCrisisIncidents ?? false,
        time_window_minutes: input.timeWindowMinutes ?? 60,
        cooldown_minutes: input.cooldownMinutes ?? 60,
        notification_config: input.notificationConfig ?? {},
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create alert rule: ${error.message}`);
    }

    return this.mapRuleFromDb(data);
  }

  /**
   * Update an existing alert rule
   */
  async updateAlertRule(
    orgId: string,
    ruleId: string,
    input: UpdateReputationAlertRuleInput
  ): Promise<BrandReputationAlertRule> {
    const updates: Record<string, unknown> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.isActive !== undefined) updates.is_active = input.isActive;
    if (input.channel !== undefined) updates.channel = input.channel;
    if (input.minOverallScore !== undefined) updates.min_overall_score = input.minOverallScore;
    if (input.maxOverallScore !== undefined) updates.max_overall_score = input.maxOverallScore;
    if (input.minDeltaOverallScore !== undefined) updates.min_delta_overall_score = input.minDeltaOverallScore;
    if (input.maxDeltaOverallScore !== undefined) updates.max_delta_overall_score = input.maxDeltaOverallScore;
    if (input.componentKey !== undefined) updates.component_key = input.componentKey;
    if (input.minComponentScore !== undefined) updates.min_component_score = input.minComponentScore;
    if (input.competitorSlug !== undefined) updates.competitor_slug = input.competitorSlug;
    if (input.minCompetitorGap !== undefined) updates.min_competitor_gap = input.minCompetitorGap;
    if (input.maxCompetitorGap !== undefined) updates.max_competitor_gap = input.maxCompetitorGap;
    if (input.minIncidentSeverity !== undefined) updates.min_incident_severity = input.minIncidentSeverity;
    if (input.linkCrisisIncidents !== undefined) updates.link_crisis_incidents = input.linkCrisisIncidents;
    if (input.timeWindowMinutes !== undefined) updates.time_window_minutes = input.timeWindowMinutes;
    if (input.cooldownMinutes !== undefined) updates.cooldown_minutes = input.cooldownMinutes;
    if (input.notificationConfig !== undefined) updates.notification_config = input.notificationConfig;

    const { data, error } = await this.supabase
      .from('brand_reputation_alert_rules')
      .update(updates)
      .eq('id', ruleId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update alert rule: ${error.message}`);
    }

    return this.mapRuleFromDb(data);
  }

  /**
   * Get a single alert rule by ID
   */
  async getAlertRule(orgId: string, ruleId: string): Promise<BrandReputationAlertRule | null> {
    const { data, error } = await this.supabase
      .from('brand_reputation_alert_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get alert rule: ${error.message}`);
    }

    return data ? this.mapRuleFromDb(data) : null;
  }

  /**
   * List alert rules with pagination and filters
   */
  async listAlertRules(
    orgId: string,
    query: ListReputationAlertRulesQuery = {}
  ): Promise<ListReputationAlertRulesResponse> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = query.offset ?? DEFAULT_OFFSET;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    let dbQuery = this.supabase
      .from('brand_reputation_alert_rules')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (query.isActive !== undefined) {
      dbQuery = dbQuery.eq('is_active', query.isActive);
    }

    if (query.channel) {
      dbQuery = dbQuery.eq('channel', query.channel);
    }

    // Map sortBy to db column
    const sortColumn = sortBy === 'createdAt' ? 'created_at' :
                       sortBy === 'lastTriggeredAt' ? 'last_triggered_at' : 'name';

    const { data, error, count } = await dbQuery
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list alert rules: ${error.message}`);
    }

    return {
      rules: (data || []).map((r) => this.mapRuleFromDb(r)),
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(orgId: string, ruleId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('brand_reputation_alert_rules')
      .delete()
      .eq('id', ruleId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete alert rule: ${error.message}`);
    }

    return true;
  }

  // ==========================================================================
  // ALERT EVALUATION ENGINE
  // ==========================================================================

  /**
   * Evaluate all active alert rules for a snapshot context
   */
  async evaluateAlertRulesForSnapshot(
    orgId: string,
    context: AlertEvaluationSnapshotContext
  ): Promise<AlertEvaluationResult> {
    const evaluatedAt = new Date().toISOString();
    const results: AlertRuleEvaluationResult[] = [];
    const eventsCreated: BrandReputationAlertEvent[] = [];

    // Get all active rules
    const { data: rules, error } = await this.supabase
      .from('brand_reputation_alert_rules')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true);

    if (error) {
      throw new Error(`Failed to fetch alert rules: ${error.message}`);
    }

    let rulesTriggered = 0;
    let rulesCooledDown = 0;

    for (const ruleRow of rules || []) {
      const rule = this.mapRuleFromDb(ruleRow);
      const evaluation = await this.evaluateSingleRule(rule, context);
      results.push(evaluation);

      if (evaluation.cooldownActive) {
        rulesCooledDown++;
        continue;
      }

      if (evaluation.triggered) {
        rulesTriggered++;

        // Create alert event
        const event = await this.createAlertEvent(orgId, rule, evaluation, context);
        eventsCreated.push(event);

        // Update last_triggered_at
        await this.supabase
          .from('brand_reputation_alert_rules')
          .update({ last_triggered_at: evaluatedAt })
          .eq('id', rule.id);
      }
    }

    return {
      orgId,
      evaluatedAt,
      rulesEvaluated: rules?.length || 0,
      rulesTriggered,
      rulesCooledDown,
      results,
      eventsCreated,
    };
  }

  /**
   * Evaluate all active alert rules for a time window context
   */
  async evaluateAlertRulesForWindow(
    orgId: string,
    context: AlertEvaluationWindowContext
  ): Promise<AlertEvaluationResult> {
    // Convert window context to snapshot context for evaluation
    const snapshotContext: AlertEvaluationSnapshotContext = {
      currentSnapshot: context.endSnapshot || {
        overallScore: 0,
        sentimentScore: 0,
        coverageScore: 0,
        crisisImpactScore: 0,
        competitivePositionScore: 0,
        engagementScore: 0,
        snapshotAt: context.windowEnd,
      },
      previousSnapshot: context.startSnapshot,
      competitorGaps: context.competitorGaps,
      previousCompetitorGaps: context.previousCompetitorGaps,
      activeIncidents: context.activeIncidents,
      evaluatedAt: context.evaluatedAt,
    };

    return this.evaluateAlertRulesForSnapshot(orgId, snapshotContext);
  }

  /**
   * Evaluate a single rule against context
   */
  private async evaluateSingleRule(
    rule: BrandReputationAlertRule,
    context: AlertEvaluationSnapshotContext
  ): Promise<AlertRuleEvaluationResult> {
    const result: AlertRuleEvaluationResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      triggered: false,
      cooldownActive: false,
    };

    // Check cooldown
    if (rule.lastTriggeredAt) {
      const lastTriggered = new Date(rule.lastTriggeredAt).getTime();
      const cooldownEnds = lastTriggered + rule.cooldownMinutes * 60 * 1000;
      const now = Date.now();

      if (now < cooldownEnds) {
        result.cooldownActive = true;
        result.cooldownEndsAt = new Date(cooldownEnds).toISOString();
        return result;
      }
    }

    const current = context.currentSnapshot;
    const previous = context.previousSnapshot;
    const reasons: string[] = [];

    // Check overall score thresholds
    if (rule.minOverallScore !== undefined && current.overallScore < rule.minOverallScore) {
      reasons.push(`Overall score ${current.overallScore.toFixed(1)} below minimum ${rule.minOverallScore}`);
      result.scoreData = {
        overallBefore: previous?.overallScore,
        overallAfter: current.overallScore,
      };
    }

    if (rule.maxOverallScore !== undefined && current.overallScore > rule.maxOverallScore) {
      reasons.push(`Overall score ${current.overallScore.toFixed(1)} above maximum ${rule.maxOverallScore}`);
      result.scoreData = {
        overallBefore: previous?.overallScore,
        overallAfter: current.overallScore,
      };
    }

    // Check delta thresholds
    if (previous && rule.minDeltaOverallScore !== undefined) {
      const delta = current.overallScore - previous.overallScore;
      if (delta < rule.minDeltaOverallScore) {
        reasons.push(`Score dropped by ${Math.abs(delta).toFixed(1)} (threshold: ${rule.minDeltaOverallScore})`);
        result.scoreData = {
          overallBefore: previous.overallScore,
          overallAfter: current.overallScore,
        };
      }
    }

    if (previous && rule.maxDeltaOverallScore !== undefined) {
      const delta = current.overallScore - previous.overallScore;
      if (delta > rule.maxDeltaOverallScore) {
        reasons.push(`Score increased by ${delta.toFixed(1)} (threshold: ${rule.maxDeltaOverallScore})`);
        result.scoreData = {
          overallBefore: previous.overallScore,
          overallAfter: current.overallScore,
        };
      }
    }

    // Check component thresholds
    if (rule.componentKey && rule.minComponentScore !== undefined) {
      const componentScore = this.getComponentScore(current, rule.componentKey);
      if (componentScore !== undefined && componentScore < rule.minComponentScore) {
        reasons.push(`${rule.componentKey} score ${componentScore.toFixed(1)} below minimum ${rule.minComponentScore}`);
        result.scoreData = {
          ...result.scoreData,
          componentKey: rule.componentKey,
          componentBefore: previous ? this.getComponentScore(previous, rule.componentKey) : undefined,
          componentAfter: componentScore,
        };
      }
    }

    // Check competitor gap thresholds
    if (rule.competitorSlug && context.competitorGaps) {
      const currentGap = context.competitorGaps[rule.competitorSlug];
      const previousGap = context.previousCompetitorGaps?.[rule.competitorSlug];

      if (currentGap !== undefined) {
        if (rule.minCompetitorGap !== undefined && currentGap < rule.minCompetitorGap) {
          reasons.push(`Competitor gap ${currentGap.toFixed(1)} below minimum ${rule.minCompetitorGap}`);
          result.scoreData = {
            ...result.scoreData,
            competitorSlug: rule.competitorSlug,
            gapBefore: previousGap,
            gapAfter: currentGap,
          };
        }

        if (rule.maxCompetitorGap !== undefined && currentGap > rule.maxCompetitorGap) {
          reasons.push(`Competitor gap ${currentGap.toFixed(1)} above maximum ${rule.maxCompetitorGap}`);
          result.scoreData = {
            ...result.scoreData,
            competitorSlug: rule.competitorSlug,
            gapBefore: previousGap,
            gapAfter: currentGap,
          };
        }
      }
    }

    // Check crisis incident severity
    if (rule.linkCrisisIncidents && context.activeIncidents?.length) {
      const matchingIncidents = context.activeIncidents.filter(
        (inc) => !rule.minIncidentSeverity || inc.severity >= rule.minIncidentSeverity
      );

      if (matchingIncidents.length > 0) {
        reasons.push(`${matchingIncidents.length} crisis incident(s) with severity >= ${rule.minIncidentSeverity || 1}`);
        result.matchedIncidents = matchingIncidents;
      }
    }

    if (reasons.length > 0) {
      result.triggered = true;
      result.reason = reasons.join('; ');
    }

    return result;
  }

  /**
   * Get component score from snapshot
   */
  private getComponentScore(
    snapshot: BrandReputationScoreSnapshot,
    componentKey: ReputationComponentKey
  ): number | undefined {
    switch (componentKey) {
      case 'sentiment': return snapshot.sentimentScore;
      case 'coverage': return snapshot.coverageScore;
      case 'crisis_impact': return snapshot.crisisImpactScore;
      case 'competitive_position': return snapshot.competitivePositionScore;
      case 'engagement': return snapshot.engagementScore;
      default: return undefined;
    }
  }

  /**
   * Create an alert event from evaluation result
   */
  private async createAlertEvent(
    orgId: string,
    rule: BrandReputationAlertRule,
    evaluation: AlertRuleEvaluationResult,
    context: AlertEvaluationSnapshotContext
  ): Promise<BrandReputationAlertEvent> {
    const { data, error } = await this.supabase
      .from('brand_reputation_alert_events')
      .insert({
        org_id: orgId,
        rule_id: rule.id,
        status: 'new',
        overall_score_before: evaluation.scoreData?.overallBefore,
        overall_score_after: evaluation.scoreData?.overallAfter ?? context.currentSnapshot.overallScore,
        component_scores_before: context.previousSnapshot ? {
          sentiment: context.previousSnapshot.sentimentScore,
          coverage: context.previousSnapshot.coverageScore,
          crisis_impact: context.previousSnapshot.crisisImpactScore,
          competitive_position: context.previousSnapshot.competitivePositionScore,
          engagement: context.previousSnapshot.engagementScore,
        } : {},
        component_scores_after: {
          sentiment: context.currentSnapshot.sentimentScore,
          coverage: context.currentSnapshot.coverageScore,
          crisis_impact: context.currentSnapshot.crisisImpactScore,
          competitive_position: context.currentSnapshot.competitivePositionScore,
          engagement: context.currentSnapshot.engagementScore,
        },
        competitor_gap_before: evaluation.scoreData?.gapBefore,
        competitor_gap_after: evaluation.scoreData?.gapAfter,
        competitor_slug: evaluation.scoreData?.competitorSlug,
        incident_ids: evaluation.matchedIncidents?.map((i) => i.id) || [],
        trigger_reason: evaluation.reason,
        context: {
          ruleConditions: {
            minOverallScore: rule.minOverallScore,
            maxOverallScore: rule.maxOverallScore,
            minDeltaOverallScore: rule.minDeltaOverallScore,
            componentKey: rule.componentKey,
            minComponentScore: rule.minComponentScore,
          },
          evaluatedAt: context.evaluatedAt,
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create alert event: ${error.message}`);
    }

    return this.mapEventFromDb(data);
  }

  // ==========================================================================
  // ALERT EVENTS
  // ==========================================================================

  /**
   * List alert events with pagination and filters
   */
  async listAlertEvents(
    orgId: string,
    query: ListReputationAlertEventsQuery = {}
  ): Promise<ListReputationAlertEventsResponse> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = query.offset ?? DEFAULT_OFFSET;
    const sortBy = query.sortBy ?? 'triggeredAt';
    const sortOrder = query.sortOrder ?? 'desc';

    let dbQuery = this.supabase
      .from('brand_reputation_alert_events')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.ruleId) {
      dbQuery = dbQuery.eq('rule_id', query.ruleId);
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('triggered_at', query.startDate);
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('triggered_at', query.endDate);
    }

    // Map sortBy to db column
    const sortColumn = sortBy === 'triggeredAt' ? 'triggered_at' :
                       sortBy === 'overallScoreAfter' ? 'overall_score_after' : 'status';

    const { data, error, count } = await dbQuery
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list alert events: ${error.message}`);
    }

    // Get status counts
    const { data: countsData } = await this.supabase
      .from('brand_reputation_alert_events')
      .select('status')
      .eq('org_id', orgId);

    const counts = {
      new: 0,
      acknowledged: 0,
      muted: 0,
      resolved: 0,
    };

    (countsData || []).forEach((row) => {
      const status = row.status as ReputationAlertStatus;
      if (status in counts) {
        counts[status]++;
      }
    });

    return {
      events: (data || []).map((e) => this.mapEventFromDb(e)),
      total: count || 0,
      limit,
      offset,
      counts,
    };
  }

  /**
   * Get a single alert event by ID
   */
  async getAlertEvent(orgId: string, eventId: string): Promise<BrandReputationAlertEvent | null> {
    const { data, error } = await this.supabase
      .from('brand_reputation_alert_events')
      .select('*')
      .eq('id', eventId)
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get alert event: ${error.message}`);
    }

    return data ? this.mapEventFromDb(data) : null;
  }

  /**
   * Acknowledge an alert event
   */
  async acknowledgeAlertEvent(
    orgId: string,
    eventId: string,
    userId: string,
    notes?: string
  ): Promise<BrandReputationAlertEvent> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('brand_reputation_alert_events')
      .update({
        status: 'acknowledged',
        acknowledged_at: now,
        acknowledged_by: userId,
        context: notes ? this.supabase.rpc('jsonb_set_lax', {
          target: 'context',
          path: '{acknowledgmentNotes}',
          new_value: JSON.stringify(notes),
        }) : undefined,
      })
      .eq('id', eventId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to acknowledge alert event: ${error.message}`);
    }

    return this.mapEventFromDb(data);
  }

  /**
   * Resolve an alert event
   */
  async resolveAlertEvent(
    orgId: string,
    eventId: string,
    userId: string,
    resolutionNotes: string
  ): Promise<BrandReputationAlertEvent> {
    const now = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('brand_reputation_alert_events')
      .update({
        status: 'resolved',
        resolved_at: now,
        resolved_by: userId,
        resolution_notes: resolutionNotes,
      })
      .eq('id', eventId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve alert event: ${error.message}`);
    }

    return this.mapEventFromDb(data);
  }

  /**
   * Mute an alert event (sets rule to inactive temporarily)
   */
  async muteAlertEvent(
    orgId: string,
    eventId: string,
    _userId: string
  ): Promise<BrandReputationAlertEvent> {
    const { data, error } = await this.supabase
      .from('brand_reputation_alert_events')
      .update({
        status: 'muted',
      })
      .eq('id', eventId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to mute alert event: ${error.message}`);
    }

    return this.mapEventFromDb(data);
  }

  // ==========================================================================
  // REPORTS
  // ==========================================================================

  /**
   * Create a new report (draft)
   */
  async createReputationReport(
    orgId: string,
    input: CreateReputationReportInput,
    userId?: string
  ): Promise<CreateReportResponse> {
    const { data: report, error } = await this.supabase
      .from('brand_reputation_reports')
      .insert({
        org_id: orgId,
        title: input.title,
        description: input.description,
        report_period_start: input.reportPeriodStart,
        report_period_end: input.reportPeriodEnd,
        frequency: input.frequency ?? 'ad_hoc',
        format: input.format ?? 'executive_summary',
        status: 'draft',
        created_by_user_id: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }

    // Add recipients if provided
    if (input.recipients?.length) {
      for (const recipient of input.recipients) {
        await this.supabase
          .from('brand_reputation_report_recipients')
          .insert({
            report_id: report.id,
            org_id: orgId,
            channel: recipient.channel,
            target: recipient.target,
            recipient_name: recipient.recipientName,
            is_primary: recipient.isPrimary ?? false,
          });
      }
    }

    return {
      report: this.mapReportFromDb(report),
    };
  }

  /**
   * Generate a full report with sections (ad hoc or scheduled)
   */
  async generateReputationReport(
    orgId: string,
    input: GenerateReputationReportInput,
    userId?: string
  ): Promise<GenerateReportResponse> {
    const startTime = Date.now();

    // Create the report first
    const title = input.title || `Brand Reputation Report - ${new Date(input.reportPeriodStart).toLocaleDateString()} to ${new Date(input.reportPeriodEnd).toLocaleDateString()}`;

    const { data: report, error: reportError } = await this.supabase
      .from('brand_reputation_reports')
      .insert({
        org_id: orgId,
        title,
        description: input.description,
        report_period_start: input.reportPeriodStart,
        report_period_end: input.reportPeriodEnd,
        frequency: input.frequency ?? 'ad_hoc',
        format: input.format ?? 'executive_summary',
        status: 'generating',
        generation_started_at: new Date().toISOString(),
        created_by_user_id: userId,
      })
      .select()
      .single();

    if (reportError) {
      throw new Error(`Failed to create report: ${reportError.message}`);
    }

    try {
      // Fetch S56 reputation scores for the period
      const { data: scoresData } = await this.supabase.rpc('get_brand_reputation_scores_for_period', {
        p_org_id: orgId,
        p_start_date: input.reportPeriodStart,
        p_end_date: input.reportPeriodEnd,
      });

      const scores = scoresData?.[0] || {};

      // Fetch trend data
      const { data: trendData } = await this.supabase.rpc('get_brand_reputation_trend', {
        p_org_id: orgId,
        p_interval: 'day',
        p_limit: 30,
      });

      // Fetch competitor data if requested
      let competitorSnapshot: CompetitorReputationSnapshot[] = [];
      if (input.includeCompetitors !== false) {
        const { data: competitors } = await this.supabase
          .from('competitor_profiles')
          .select('id, name, slug, reputation_score')
          .eq('org_id', orgId)
          .limit(10);

        competitorSnapshot = (competitors || []).map((c) => ({
          competitorId: c.id,
          competitorName: c.name,
          competitorSlug: c.slug,
          score: c.reputation_score || 50,
          gap: (scores.avg_overall_score || 50) - (c.reputation_score || 50),
          trend: 'flat' as const,
        }));
      }

      // Fetch crisis data if requested
      let crisisIncidents: CrisisIncidentSummary[] = [];
      if (input.includeCrisisData !== false) {
        const { data: incidents } = await this.supabase
          .from('crisis_incidents')
          .select('id, title, severity, status, created_at, resolved_at')
          .eq('org_id', orgId)
          .gte('created_at', input.reportPeriodStart)
          .lte('created_at', input.reportPeriodEnd)
          .limit(20);

        crisisIncidents = (incidents || []).map((i) => ({
          id: i.id,
          title: i.title,
          severity: i.severity,
          status: i.status,
          createdAt: i.created_at,
          resolvedAt: i.resolved_at,
        }));
      }

      // Build key metrics
      const keyMetrics = {
        currentOverallScore: scores.avg_overall_score || 50,
        previousOverallScore: undefined,
        scoreDelta: undefined,
        trend: 'flat' as const,
        alertsTriggered: 0,
        crisisCount: crisisIncidents.length,
      };

      // Update report with snapshots
      const overallScoreSnapshot = {
        overallScore: scores.avg_overall_score || 50,
        sentimentScore: scores.avg_sentiment_score || 50,
        coverageScore: scores.avg_coverage_score || 50,
        crisisImpactScore: scores.avg_crisis_impact_score || 50,
        competitivePositionScore: scores.avg_competitive_position_score || 50,
        engagementScore: scores.avg_engagement_score || 50,
        snapshotAt: new Date().toISOString(),
      };

      const componentScoresSnapshot = {
        sentiment: scores.avg_sentiment_score || 50,
        coverage: scores.avg_coverage_score || 50,
        crisis_impact: scores.avg_crisis_impact_score || 50,
        competitive_position: scores.avg_competitive_position_score || 50,
        engagement: scores.avg_engagement_score || 50,
      };

      await this.supabase
        .from('brand_reputation_reports')
        .update({
          overall_score_snapshot: overallScoreSnapshot,
          component_scores_snapshot: componentScoresSnapshot,
          competitor_snapshot: competitorSnapshot,
          key_metrics: keyMetrics,
          trend_data: trendData || [],
        })
        .eq('id', report.id);

      // Generate sections
      const sections: BrandReputationReportSection[] = [];
      const sectionTypes = input.format === 'detailed'
        ? DEFAULT_REPORT_SECTION_ORDER
        : ['overview', 'highlights', 'recommendations'] as ReputationReportSectionType[];

      for (let i = 0; i < sectionTypes.length; i++) {
        const sectionType = sectionTypes[i];
        const sectionContent = await this.generateSectionContent(
          sectionType,
          {
            scores: overallScoreSnapshot,
            componentScores: componentScoresSnapshot,
            competitors: competitorSnapshot,
            crisisIncidents,
            keyMetrics,
            periodStart: input.reportPeriodStart,
            periodEnd: input.reportPeriodEnd,
          }
        );

        const { data: section, error: sectionError } = await this.supabase
          .from('brand_reputation_report_sections')
          .insert({
            report_id: report.id,
            org_id: orgId,
            section_type: sectionType,
            order_index: i,
            title: DEFAULT_SECTION_TITLES[sectionType],
            content: sectionContent,
            metadata: { scores: overallScoreSnapshot },
            generated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (!sectionError && section) {
          sections.push(this.mapSectionFromDb(section));
        }
      }

      // Add recipients if provided
      if (input.recipients?.length) {
        for (const recipient of input.recipients) {
          await this.supabase
            .from('brand_reputation_report_recipients')
            .insert({
              report_id: report.id,
              org_id: orgId,
              channel: recipient.channel,
              target: recipient.target,
              recipient_name: recipient.recipientName,
              is_primary: recipient.isPrimary ?? false,
            });
        }
      }

      // Mark report as generated
      const { data: updatedReport, error: updateError } = await this.supabase
        .from('brand_reputation_reports')
        .update({
          status: 'generated',
          generation_completed_at: new Date().toISOString(),
        })
        .eq('id', report.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update report status: ${updateError.message}`);
      }

      return {
        report: this.mapReportFromDb(updatedReport),
        sections,
        generationTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      // Mark report as failed
      await this.supabase
        .from('brand_reputation_reports')
        .update({
          status: 'draft',
          generation_error: err instanceof Error ? err.message : 'Unknown error',
        })
        .eq('id', report.id);

      throw err;
    }
  }

  /**
   * Generate content for a report section
   */
  private async generateSectionContent(
    sectionType: ReputationReportSectionType,
    context: {
      scores: BrandReputationScoreSnapshot;
      componentScores: ComponentScoresMap;
      competitors: CompetitorReputationSnapshot[];
      crisisIncidents: CrisisIncidentSummary[];
      keyMetrics: Record<string, unknown>;
      periodStart: string;
      periodEnd: string;
    }
  ): Promise<string> {
    // For now, generate template-based content
    // In production, this would call the LLM router
    const { scores, componentScores, competitors, crisisIncidents } = context;
    const periodLabel = `${new Date(context.periodStart).toLocaleDateString()} - ${new Date(context.periodEnd).toLocaleDateString()}`;

    switch (sectionType) {
      case 'overview':
        return `## Executive Overview\n\nDuring the period ${periodLabel}, your brand reputation score averaged **${scores.overallScore.toFixed(1)}** out of 100.\n\n**Component Breakdown:**\n- Sentiment: ${componentScores.sentiment?.toFixed(1) || 'N/A'}\n- Coverage: ${componentScores.coverage?.toFixed(1) || 'N/A'}\n- Crisis Impact: ${componentScores.crisis_impact?.toFixed(1) || 'N/A'}\n- Competitive Position: ${componentScores.competitive_position?.toFixed(1) || 'N/A'}\n- Engagement: ${componentScores.engagement?.toFixed(1) || 'N/A'}`;

      case 'highlights':
        return `## Key Highlights\n\n- Overall brand reputation remains stable at ${scores.overallScore.toFixed(1)}\n- Sentiment score is at ${componentScores.sentiment?.toFixed(1) || 'N/A'}\n- ${competitors.length} competitors tracked for benchmarking\n- ${crisisIncidents.length} crisis incidents during this period`;

      case 'risks':
        return `## Risks & Concerns\n\n${crisisIncidents.length > 0 ? `- ${crisisIncidents.length} crisis incident(s) require attention` : '- No major crisis incidents'}\n- Monitor competitive position (currently ${componentScores.competitive_position?.toFixed(1) || 'N/A'})\n- ${componentScores.crisis_impact && componentScores.crisis_impact < 70 ? '- Crisis impact score below target threshold' : ''}`;

      case 'opportunities':
        return `## Opportunities\n\n- Leverage positive sentiment (${componentScores.sentiment?.toFixed(1) || 'N/A'}) for thought leadership\n- Strong engagement score (${componentScores.engagement?.toFixed(1) || 'N/A'}) indicates healthy journalist relationships\n- Coverage opportunities identified in tier-1 outlets`;

      case 'competitors':
        return `## Competitive Landscape\n\n${competitors.length > 0 ? competitors.map((c) => `- **${c.competitorName}**: Score ${c.score.toFixed(1)} (Gap: ${c.gap >= 0 ? '+' : ''}${c.gap.toFixed(1)})`).join('\n') : 'No competitor data available for this period.'}`;

      case 'recommendations':
        return `## Recommended Actions\n\n1. ${crisisIncidents.length > 0 ? 'Address active crisis incidents with coordinated response' : 'Continue monitoring for potential crisis signals'}\n2. ${componentScores.sentiment && componentScores.sentiment < 60 ? 'Implement positive narrative campaign to improve sentiment' : 'Maintain current positive sentiment trajectory'}\n3. ${componentScores.coverage && componentScores.coverage < 60 ? 'Increase media outreach to improve coverage volume' : 'Continue effective media relations program'}\n4. Review competitor positioning and identify differentiation opportunities`;

      case 'events_timeline':
        return `## Events Timeline\n\n${crisisIncidents.length > 0 ? crisisIncidents.map((i) => `- **${new Date(i.createdAt).toLocaleDateString()}**: ${i.title} (Severity: ${i.severity})`).join('\n') : 'No significant events during this period.'}`;

      default:
        return '';
    }
  }

  /**
   * Regenerate a specific report section
   */
  async regenerateReputationReportSection(
    orgId: string,
    reportId: string,
    sectionId: string,
    input: RegenerateReputationReportSectionInput
  ): Promise<RegenerateSectionResponse> {
    const startTime = Date.now();

    // Get the report
    const { data: report } = await this.supabase
      .from('brand_reputation_reports')
      .select('*')
      .eq('id', reportId)
      .eq('org_id', orgId)
      .single();

    if (!report) {
      throw new Error('Report not found');
    }

    // Get the section
    const { data: section } = await this.supabase
      .from('brand_reputation_report_sections')
      .select('*')
      .eq('id', sectionId)
      .eq('report_id', reportId)
      .single();

    if (!section) {
      throw new Error('Section not found');
    }

    // Regenerate content
    const newContent = await this.generateSectionContent(
      section.section_type as ReputationReportSectionType,
      {
        scores: report.overall_score_snapshot || {},
        componentScores: report.component_scores_snapshot || {},
        competitors: report.competitor_snapshot || [],
        crisisIncidents: [],
        keyMetrics: report.key_metrics || {},
        periodStart: report.report_period_start,
        periodEnd: report.report_period_end,
      }
    );

    // Update section
    const { data: updatedSection, error } = await this.supabase
      .from('brand_reputation_report_sections')
      .update({
        content: newContent,
        generated_at: new Date().toISOString(),
        metadata: {
          ...section.metadata,
          regeneratedWith: input,
        },
      })
      .eq('id', sectionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to regenerate section: ${error.message}`);
    }

    return {
      section: this.mapSectionFromDb(updatedSection),
      regenerationTimeMs: Date.now() - startTime,
    };
  }

  /**
   * List reports with pagination and filters
   */
  async listReputationReports(
    orgId: string,
    query: ListReputationReportsQuery = {}
  ): Promise<ListReputationReportsResponse> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const offset = query.offset ?? DEFAULT_OFFSET;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    let dbQuery = this.supabase
      .from('brand_reputation_reports')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (query.status) {
      dbQuery = dbQuery.eq('status', query.status);
    }

    if (query.frequency) {
      dbQuery = dbQuery.eq('frequency', query.frequency);
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('report_period_start', query.startDate);
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('report_period_end', query.endDate);
    }

    // Map sortBy to db column
    const sortColumn = sortBy === 'createdAt' ? 'created_at' :
                       sortBy === 'reportPeriodStart' ? 'report_period_start' : 'status';

    const { data, error, count } = await dbQuery
      .order(sortColumn, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to list reports: ${error.message}`);
    }

    return {
      reports: (data || []).map((r) => this.mapReportFromDb(r)),
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Get a single report with sections and recipients
   */
  async getReputationReport(orgId: string, reportId: string): Promise<GetReportResponse | null> {
    const { data: report, error } = await this.supabase
      .from('brand_reputation_reports')
      .select('*')
      .eq('id', reportId)
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get report: ${error.message}`);
    }

    if (!report) {
      return null;
    }

    // Get sections
    const { data: sections } = await this.supabase
      .from('brand_reputation_report_sections')
      .select('*')
      .eq('report_id', reportId)
      .order('order_index', { ascending: true });

    // Get recipients
    const { data: recipients } = await this.supabase
      .from('brand_reputation_report_recipients')
      .select('*')
      .eq('report_id', reportId);

    return {
      report: this.mapReportFromDb(report),
      sections: (sections || []).map((s) => this.mapSectionFromDb(s)),
      recipients: (recipients || []).map((r) => this.mapRecipientFromDb(r)),
    };
  }

  // ==========================================================================
  // INSIGHTS
  // ==========================================================================

  /**
   * Get reputation insights for dashboards
   */
  async getReputationInsights(
    orgId: string,
    query: GetReputationInsightsQuery = {}
  ): Promise<GetReputationReportInsightsResponse> {
    const periodEnd = query.periodEnd || new Date().toISOString();
    const periodStart = query.periodStart || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const maxDrivers = query.maxDrivers ?? 3;

    // Get current scores from most recent snapshot
    const { data: latestSnapshot } = await this.supabase
      .from('brand_reputation_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const currentOverallScore = latestSnapshot?.overall_score ? parseFloat(latestSnapshot.overall_score) : 50;
    const componentScores: ComponentScoresMap = {
      sentiment: latestSnapshot?.sentiment_score ? parseFloat(latestSnapshot.sentiment_score) : 50,
      coverage: latestSnapshot?.coverage_score ? parseFloat(latestSnapshot.coverage_score) : 50,
      crisis_impact: latestSnapshot?.crisis_impact_score ? parseFloat(latestSnapshot.crisis_impact_score) : 50,
      competitive_position: latestSnapshot?.competitive_position_score ? parseFloat(latestSnapshot.competitive_position_score) : 50,
      engagement: latestSnapshot?.engagement_score ? parseFloat(latestSnapshot.engagement_score) : 50,
    };

    // Get previous period scores for comparison
    const prevPeriodEnd = periodStart;
    const periodLength = new Date(periodEnd).getTime() - new Date(periodStart).getTime();
    const prevPeriodStart = new Date(new Date(periodStart).getTime() - periodLength).toISOString();

    const { data: prevSnapshot } = await this.supabase
      .from('brand_reputation_snapshots')
      .select('overall_score')
      .eq('org_id', orgId)
      .gte('created_at', prevPeriodStart)
      .lte('created_at', prevPeriodEnd)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const previousOverallScore = prevSnapshot?.overall_score ? parseFloat(prevSnapshot.overall_score) : undefined;
    const scoreDelta = previousOverallScore !== undefined ? currentOverallScore - previousOverallScore : 0;
    const trend = scoreDelta > 2 ? 'up' : scoreDelta < -2 ? 'down' : 'flat';

    // Get top drivers from reputation events
    const { data: positiveEvents } = await this.supabase
      .from('brand_reputation_events')
      .select('*')
      .eq('org_id', orgId)
      .gt('delta', 0)
      .gte('event_timestamp', periodStart)
      .lte('event_timestamp', periodEnd)
      .order('delta', { ascending: false })
      .limit(maxDrivers);

    const { data: negativeEvents } = await this.supabase
      .from('brand_reputation_events')
      .select('*')
      .eq('org_id', orgId)
      .lt('delta', 0)
      .gte('event_timestamp', periodStart)
      .lte('event_timestamp', periodEnd)
      .order('delta', { ascending: true })
      .limit(maxDrivers);

    const topPositiveDrivers: ReputationInsightDriver[] = (positiveEvents || []).map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      impact: parseFloat(e.delta),
      component: e.affected_component as ReputationComponentKey,
      sourceSystem: e.source_system,
      occurredAt: e.event_timestamp,
    }));

    const topNegativeDrivers: ReputationInsightDriver[] = (negativeEvents || []).map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      impact: parseFloat(e.delta),
      component: e.affected_component as ReputationComponentKey,
      sourceSystem: e.source_system,
      occurredAt: e.event_timestamp,
    }));

    // Get competitor with biggest gap change
    let competitorWithBiggestGapChange = undefined;
    if (query.includeCompetitors !== false) {
      // Simplified - would need more complex logic for actual gap change tracking
      const { data: competitors } = await this.supabase
        .from('competitor_profiles')
        .select('id, name, reputation_score')
        .eq('org_id', orgId)
        .limit(1);

      if (competitors?.[0]) {
        const c = competitors[0];
        competitorWithBiggestGapChange = {
          competitorId: c.id,
          competitorName: c.name,
          gapBefore: currentOverallScore - (c.reputation_score || 50),
          gapAfter: currentOverallScore - (c.reputation_score || 50),
          gapDelta: 0,
        };
      }
    }

    // Get alert summary
    const { data: alertCounts } = await this.supabase.rpc('get_active_reputation_alert_count', {
      p_org_id: orgId,
    });

    const alertSummary = {
      newAlerts: alertCounts?.[0]?.new_count || 0,
      acknowledgedAlerts: alertCounts?.[0]?.acknowledged_count || 0,
      resolvedAlerts: 0,
      totalUnresolved: alertCounts?.[0]?.total_unresolved || 0,
    };

    // Get crisis summary if requested
    let crisisSummary = undefined;
    if (query.includeCrisisData !== false) {
      const { data: crisisData } = await this.supabase
        .from('crisis_incidents')
        .select('severity, status')
        .eq('org_id', orgId)
        .gte('created_at', periodStart);

      if (crisisData?.length) {
        const activeIncidents = crisisData.filter((i) => i.status === 'active').length;
        const resolvedThisPeriod = crisisData.filter((i) => i.status === 'resolved').length;
        const totalSeverity = crisisData.reduce((sum, i) => sum + (i.severity || 0), 0);

        crisisSummary = {
          activeIncidents,
          resolvedThisPeriod,
          averageSeverity: crisisData.length > 0 ? totalSeverity / crisisData.length : 0,
        };
      }
    }

    return {
      currentOverallScore,
      previousOverallScore,
      scoreDelta,
      trend,
      componentScores,
      topPositiveDrivers,
      topNegativeDrivers,
      competitorWithBiggestGapChange,
      alertSummary,
      crisisSummary,
      periodStart,
      periodEnd,
      calculatedAt: new Date().toISOString(),
    };
  }

  // ==========================================================================
  // DB MAPPERS
  // ==========================================================================

  private mapRuleFromDb(row: Record<string, unknown>): BrandReputationAlertRule {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      name: row.name as string,
      description: row.description as string | undefined,
      isActive: row.is_active as boolean,
      channel: row.channel as ReputationAlertChannel,
      minOverallScore: row.min_overall_score ? parseFloat(row.min_overall_score as string) : undefined,
      maxOverallScore: row.max_overall_score ? parseFloat(row.max_overall_score as string) : undefined,
      minDeltaOverallScore: row.min_delta_overall_score ? parseFloat(row.min_delta_overall_score as string) : undefined,
      maxDeltaOverallScore: row.max_delta_overall_score ? parseFloat(row.max_delta_overall_score as string) : undefined,
      componentKey: row.component_key as ReputationComponentKey | undefined,
      minComponentScore: row.min_component_score ? parseFloat(row.min_component_score as string) : undefined,
      competitorSlug: row.competitor_slug as string | undefined,
      minCompetitorGap: row.min_competitor_gap ? parseFloat(row.min_competitor_gap as string) : undefined,
      maxCompetitorGap: row.max_competitor_gap ? parseFloat(row.max_competitor_gap as string) : undefined,
      minIncidentSeverity: row.min_incident_severity as number | undefined,
      linkCrisisIncidents: row.link_crisis_incidents as boolean,
      timeWindowMinutes: row.time_window_minutes as number,
      cooldownMinutes: row.cooldown_minutes as number,
      lastTriggeredAt: row.last_triggered_at as string | undefined,
      notificationConfig: row.notification_config as BrandReputationAlertRule['notificationConfig'],
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      createdBy: row.created_by as string | undefined,
    };
  }

  private mapEventFromDb(row: Record<string, unknown>): BrandReputationAlertEvent {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      ruleId: row.rule_id as string,
      status: row.status as ReputationAlertStatus,
      overallScoreBefore: row.overall_score_before ? parseFloat(row.overall_score_before as string) : undefined,
      overallScoreAfter: row.overall_score_after ? parseFloat(row.overall_score_after as string) : undefined,
      componentScoresBefore: row.component_scores_before as ComponentScoresMap | undefined,
      componentScoresAfter: row.component_scores_after as ComponentScoresMap | undefined,
      competitorGapBefore: row.competitor_gap_before ? parseFloat(row.competitor_gap_before as string) : undefined,
      competitorGapAfter: row.competitor_gap_after ? parseFloat(row.competitor_gap_after as string) : undefined,
      competitorSlug: row.competitor_slug as string | undefined,
      incidentIds: (row.incident_ids as string[]) || [],
      triggerReason: row.trigger_reason as string | undefined,
      context: row.context as BrandReputationAlertEvent['context'],
      triggeredAt: row.triggered_at as string,
      acknowledgedAt: row.acknowledged_at as string | undefined,
      acknowledgedBy: row.acknowledged_by as string | undefined,
      resolvedAt: row.resolved_at as string | undefined,
      resolvedBy: row.resolved_by as string | undefined,
      resolutionNotes: row.resolution_notes as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapReportFromDb(row: Record<string, unknown>): BrandReputationReport {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      title: row.title as string,
      description: row.description as string | undefined,
      reportPeriodStart: row.report_period_start as string,
      reportPeriodEnd: row.report_period_end as string,
      frequency: row.frequency as ReputationReportFrequency,
      format: row.format as ReputationReportFormat,
      status: row.status as ReputationReportStatus,
      overallScoreSnapshot: row.overall_score_snapshot as BrandReputationScoreSnapshot | undefined,
      componentScoresSnapshot: row.component_scores_snapshot as ComponentScoresMap | undefined,
      competitorSnapshot: row.competitor_snapshot as CompetitorReputationSnapshot[] | undefined,
      keyMetrics: row.key_metrics as BrandReputationReport['keyMetrics'],
      trendData: row.trend_data as BrandReputationReport['trendData'],
      generationStartedAt: row.generation_started_at as string | undefined,
      generationCompletedAt: row.generation_completed_at as string | undefined,
      generationError: row.generation_error as string | undefined,
      createdByUserId: row.created_by_user_id as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      publishedAt: row.published_at as string | undefined,
    };
  }

  private mapSectionFromDb(row: Record<string, unknown>): BrandReputationReportSection {
    return {
      id: row.id as string,
      reportId: row.report_id as string,
      orgId: row.org_id as string,
      sectionType: row.section_type as ReputationReportSectionType,
      orderIndex: row.order_index as number,
      title: row.title as string,
      content: row.content as string | undefined,
      metadata: row.metadata as Record<string, unknown> | undefined,
      generatedAt: row.generated_at as string | undefined,
      generationModel: row.generation_model as string | undefined,
      generationPromptTokens: row.generation_prompt_tokens as number | undefined,
      generationCompletionTokens: row.generation_completion_tokens as number | undefined,
      lastEditedAt: row.last_edited_at as string | undefined,
      lastEditedBy: row.last_edited_by as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapRecipientFromDb(row: Record<string, unknown>): BrandReputationReportRecipient {
    return {
      id: row.id as string,
      reportId: row.report_id as string,
      orgId: row.org_id as string,
      channel: row.channel as ReputationAlertChannel,
      target: row.target as string,
      recipientName: row.recipient_name as string | undefined,
      isPrimary: row.is_primary as boolean,
      deliveryStatus: row.delivery_status as string,
      deliveredAt: row.delivered_at as string | undefined,
      deliveryError: row.delivery_error as string | undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
