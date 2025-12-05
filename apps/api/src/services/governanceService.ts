/**
 * Governance Service (Sprint S59)
 * Comprehensive governance, compliance & audit intelligence engine
 *
 * Features:
 * - Policy management with versioning
 * - Rule definition and evaluation
 * - Finding creation and lifecycle management
 * - Risk score computation and tracking
 * - Audit insights generation
 */

import type {
  GovernancePolicy,
  GovernanceRule,
  GovernanceFinding,
  GovernanceRiskScore,
  GovernanceAuditInsight,
  GovernancePolicyVersion,
  GovernancePoliciesListResponse,
  GovernancePolicyDetailResponse,
  GovernanceRulesListResponse,
  GovernanceFindingsListResponse,
  GovernanceFindingDetailResponse,
  GovernanceRiskScoresListResponse,
  GovernanceAuditInsightsListResponse,
  GovernancePolicyVersionsResponse,
  GovernanceDashboardSummary,
  GovernanceComplianceMetrics,
  GovernanceRiskHeatmapResponse,
  GovernanceRiskHeatmapCell,
  GovernanceBatchEvaluationResponse,
  GovernanceEvaluationContext,
  GovernanceEvaluationResult,
  CreateGovernancePolicyInput,
  UpdateGovernancePolicyInput,
  CreateGovernanceRuleInput,
  UpdateGovernanceRuleInput,
  CreateGovernanceFindingInput,
  UpdateGovernanceFindingInput,
  UpsertGovernanceRiskScoreInput,
  CreateGovernanceAuditInsightInput,
  GovernancePoliciesQuery,
  GovernanceRulesQuery,
  GovernanceFindingsQuery,
  GovernanceRiskScoresQuery,
  GovernanceAuditInsightsQuery,
  GovernanceSeverityLevel,
  GovernanceTargetSystem,
  GovernanceFindingStatus,
  GovernanceEntityType,
  GovernancePolicyCategory,
  GovernanceRuleType,
  GovernanceScoreTrend,
  GovernanceRuleCondition,
  GovernanceContributingFactor,
  GovernanceInsightTopRisk,
} from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('governance-service');

// ========================================
// Helper Types
// ========================================

interface PolicyRecord {
  id: string;
  org_id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  scope: string;
  severity: string;
  rule_config: Record<string, unknown>;
  is_active: boolean;
  is_archived: boolean;
  owner_user_id: string | null;
  department: string | null;
  regulatory_reference: string | null;
  effective_date: string | null;
  review_date: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface RuleRecord {
  id: string;
  org_id: string;
  policy_id: string;
  name: string;
  description: string | null;
  rule_type: string;
  target_system: string;
  condition: Record<string, unknown>;
  action: Record<string, unknown>;
  priority: number;
  is_active: boolean;
  evaluation_mode: string | null;
  schedule_cron: string | null;
  cooldown_minutes: number | null;
  max_findings_per_day: number | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface FindingRecord {
  id: string;
  org_id: string;
  policy_id: string;
  rule_id: string;
  source_system: string;
  source_reference_id: string;
  source_reference_type: string | null;
  severity: string;
  status: string;
  summary: string;
  details: string | null;
  impact_score: number | null;
  affected_entities: unknown[];
  recommended_actions: unknown[];
  mitigation_notes: string | null;
  assigned_to: string | null;
  resolved_by: string | null;
  resolution_notes: string | null;
  detected_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  dismissed_at: string | null;
  metadata: Record<string, unknown>;
  event_snapshot: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface RiskScoreRecord {
  id: string;
  org_id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string | null;
  overall_score: number;
  risk_level: string;
  content_risk: number | null;
  reputation_risk: number | null;
  crisis_risk: number | null;
  legal_risk: number | null;
  relationship_risk: number | null;
  competitive_risk: number | null;
  previous_score: number | null;
  score_trend: string | null;
  trend_period_days: number | null;
  breakdown: Record<string, unknown>;
  contributing_factors: unknown[];
  active_findings_count: number | null;
  linked_finding_ids: string[] | null;
  computed_at: string;
  computation_method: string | null;
  confidence_score: number | null;
  valid_until: string | null;
  is_stale: boolean | null;
  created_at: string;
  updated_at: string;
}

interface AuditInsightRecord {
  id: string;
  org_id: string;
  time_window_start: string;
  time_window_end: string;
  insight_type: string | null;
  scope: string | null;
  title: string;
  summary: string;
  executive_summary: string | null;
  detailed_analysis: string | null;
  recommendations: unknown[];
  action_items: unknown[];
  top_risks: unknown[];
  risk_distribution: Record<string, number>;
  metrics_snapshot: Record<string, unknown>;
  trend_analysis: Record<string, unknown>;
  linked_findings: string[] | null;
  findings_count: number | null;
  resolved_findings_count: number | null;
  generated_by: string;
  llm_model: string | null;
  generation_prompt: string | null;
  tokens_used: number | null;
  recipients: unknown[];
  distributed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface PolicyVersionRecord {
  id: string;
  org_id: string;
  policy_id: string;
  version_number: number;
  policy_snapshot: Record<string, unknown>;
  change_summary: string | null;
  changed_fields: string[] | null;
  created_by: string | null;
  created_at: string;
}

// ========================================
// Governance Service Class
// ========================================

export class GovernanceService {
  constructor(private supabase: SupabaseClient) {}

  // ========================================
  // Policy Methods
  // ========================================

  async createPolicy(
    orgId: string,
    input: CreateGovernancePolicyInput,
    userId?: string
  ): Promise<GovernancePolicy> {
    const record = {
      org_id: orgId,
      key: input.key,
      name: input.name,
      description: input.description || null,
      category: input.category,
      scope: input.scope || 'global',
      severity: input.severity || 'medium',
      rule_config: input.ruleConfig || {},
      is_active: input.isActive ?? true,
      is_archived: false,
      owner_user_id: input.ownerUserId || null,
      department: input.department || null,
      regulatory_reference: input.regulatoryReference || null,
      effective_date: input.effectiveDate?.toISOString() || null,
      review_date: input.reviewDate?.toISOString() || null,
      created_by: userId || null,
      updated_by: userId || null,
    };

    const { data, error } = await this.supabase
      .from('governance_policies')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create policy', { error, orgId, key: input.key });
      throw new Error(`Failed to create policy: ${error.message}`);
    }

    // Create initial version
    await this.createPolicyVersion(orgId, data.id, data, 'Initial creation', userId);

    logger.info('Policy created', { orgId, policyId: data.id, key: input.key });
    return this.mapPolicyRecord(data);
  }

  async updatePolicy(
    orgId: string,
    policyId: string,
    input: UpdateGovernancePolicyInput,
    userId?: string
  ): Promise<GovernancePolicy> {
    // Get current policy for versioning
    const currentPolicy = await this.getPolicy(orgId, policyId);
    if (!currentPolicy) {
      throw new Error('Policy not found');
    }

    const updates: Record<string, unknown> = { updated_by: userId || null };
    const changedFields: string[] = [];

    if (input.name !== undefined) {
      updates.name = input.name;
      changedFields.push('name');
    }
    if (input.description !== undefined) {
      updates.description = input.description;
      changedFields.push('description');
    }
    if (input.category !== undefined) {
      updates.category = input.category;
      changedFields.push('category');
    }
    if (input.scope !== undefined) {
      updates.scope = input.scope;
      changedFields.push('scope');
    }
    if (input.severity !== undefined) {
      updates.severity = input.severity;
      changedFields.push('severity');
    }
    if (input.ruleConfig !== undefined) {
      updates.rule_config = input.ruleConfig;
      changedFields.push('ruleConfig');
    }
    if (input.isActive !== undefined) {
      updates.is_active = input.isActive;
      changedFields.push('isActive');
    }
    if (input.isArchived !== undefined) {
      updates.is_archived = input.isArchived;
      changedFields.push('isArchived');
    }
    if (input.ownerUserId !== undefined) {
      updates.owner_user_id = input.ownerUserId;
      changedFields.push('ownerUserId');
    }
    if (input.department !== undefined) {
      updates.department = input.department;
      changedFields.push('department');
    }
    if (input.regulatoryReference !== undefined) {
      updates.regulatory_reference = input.regulatoryReference;
      changedFields.push('regulatoryReference');
    }
    if (input.effectiveDate !== undefined) {
      updates.effective_date = input.effectiveDate?.toISOString() || null;
      changedFields.push('effectiveDate');
    }
    if (input.reviewDate !== undefined) {
      updates.review_date = input.reviewDate?.toISOString() || null;
      changedFields.push('reviewDate');
    }

    const { data, error } = await this.supabase
      .from('governance_policies')
      .update(updates)
      .eq('id', policyId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update policy', { error, orgId, policyId });
      throw new Error(`Failed to update policy: ${error.message}`);
    }

    // Create new version
    if (changedFields.length > 0) {
      await this.createPolicyVersion(
        orgId,
        policyId,
        data,
        `Updated: ${changedFields.join(', ')}`,
        userId,
        changedFields
      );
    }

    logger.info('Policy updated', { orgId, policyId, changedFields });
    return this.mapPolicyRecord(data);
  }

  async getPolicy(orgId: string, policyId: string): Promise<GovernancePolicy | null> {
    const { data, error } = await this.supabase
      .from('governance_policies')
      .select('*')
      .eq('id', policyId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get policy', { error, orgId, policyId });
      throw new Error(`Failed to get policy: ${error.message}`);
    }

    return this.mapPolicyRecord(data);
  }

  async getPolicyDetail(orgId: string, policyId: string): Promise<GovernancePolicyDetailResponse | null> {
    const policy = await this.getPolicy(orgId, policyId);
    if (!policy) return null;

    const [rulesResult, findingsResult] = await Promise.all([
      this.listRules(orgId, { policyId, limit: 100 }),
      this.listFindings(orgId, { policyId, status: ['open', 'acknowledged', 'in_progress'], limit: 10 }),
    ]);

    return {
      policy,
      rules: rulesResult.rules,
      rulesCount: rulesResult.total,
      activeFindingsCount: findingsResult.total,
      recentFindings: findingsResult.findings,
    };
  }

  async listPolicies(orgId: string, query: GovernancePoliciesQuery = {}): Promise<GovernancePoliciesListResponse> {
    const {
      category,
      scope,
      severity,
      isActive,
      isArchived,
      ownerUserId,
      department,
      searchQuery,
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('governance_policies')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (category) {
      if (Array.isArray(category)) {
        dbQuery = dbQuery.in('category', category);
      } else {
        dbQuery = dbQuery.eq('category', category);
      }
    }

    if (scope) {
      if (Array.isArray(scope)) {
        dbQuery = dbQuery.in('scope', scope);
      } else {
        dbQuery = dbQuery.eq('scope', scope);
      }
    }

    if (severity) {
      if (Array.isArray(severity)) {
        dbQuery = dbQuery.in('severity', severity);
      } else {
        dbQuery = dbQuery.eq('severity', severity);
      }
    }

    if (isActive !== undefined) {
      dbQuery = dbQuery.eq('is_active', isActive);
    }

    if (isArchived !== undefined) {
      dbQuery = dbQuery.eq('is_archived', isArchived);
    }

    if (ownerUserId) {
      dbQuery = dbQuery.eq('owner_user_id', ownerUserId);
    }

    if (department) {
      dbQuery = dbQuery.eq('department', department);
    }

    if (searchQuery) {
      dbQuery = dbQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,key.ilike.%${searchQuery}%`);
    }

    const sortColumn = sortBy === 'created_at' ? 'created_at' :
                       sortBy === 'updated_at' ? 'updated_at' :
                       sortBy === 'name' ? 'name' : 'severity';

    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list policies', { error, orgId });
      throw new Error(`Failed to list policies: ${error.message}`);
    }

    const policies = (data || []).map(this.mapPolicyRecord);
    const total = count || 0;

    return {
      policies,
      total,
      hasMore: offset + policies.length < total,
    };
  }

  async deletePolicy(orgId: string, policyId: string): Promise<void> {
    const { error } = await this.supabase
      .from('governance_policies')
      .delete()
      .eq('id', policyId)
      .eq('org_id', orgId);

    if (error) {
      logger.error('Failed to delete policy', { error, orgId, policyId });
      throw new Error(`Failed to delete policy: ${error.message}`);
    }

    logger.info('Policy deleted', { orgId, policyId });
  }

  private async createPolicyVersion(
    orgId: string,
    policyId: string,
    policyData: PolicyRecord,
    changeSummary: string,
    userId?: string,
    changedFields?: string[]
  ): Promise<void> {
    // Get current max version number
    const { data: versions } = await this.supabase
      .from('governance_policy_versions')
      .select('version_number')
      .eq('policy_id', policyId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;

    const { error } = await this.supabase
      .from('governance_policy_versions')
      .insert({
        org_id: orgId,
        policy_id: policyId,
        version_number: nextVersion,
        policy_snapshot: policyData,
        change_summary: changeSummary,
        changed_fields: changedFields || [],
        created_by: userId || null,
      });

    if (error) {
      logger.warn('Failed to create policy version', { error, policyId });
    }
  }

  async getPolicyVersions(orgId: string, policyId: string): Promise<GovernancePolicyVersionsResponse> {
    const { data, error, count } = await this.supabase
      .from('governance_policy_versions')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('policy_id', policyId)
      .order('version_number', { ascending: false });

    if (error) {
      logger.error('Failed to get policy versions', { error, orgId, policyId });
      throw new Error(`Failed to get policy versions: ${error.message}`);
    }

    const versions = (data || []).map(this.mapPolicyVersionRecord);

    return {
      versions,
      total: count || 0,
    };
  }

  // ========================================
  // Rule Methods
  // ========================================

  async createRule(
    orgId: string,
    input: CreateGovernanceRuleInput,
    userId?: string
  ): Promise<GovernanceRule> {
    const record = {
      org_id: orgId,
      policy_id: input.policyId,
      name: input.name,
      description: input.description || null,
      rule_type: input.ruleType,
      target_system: input.targetSystem,
      condition: input.condition,
      action: input.action,
      priority: input.priority ?? 100,
      is_active: input.isActive ?? true,
      evaluation_mode: input.evaluationMode || 'on_event',
      schedule_cron: input.scheduleCron || null,
      cooldown_minutes: input.cooldownMinutes ?? 0,
      max_findings_per_day: input.maxFindingsPerDay || null,
      tags: input.tags || [],
      metadata: input.metadata || {},
      created_by: userId || null,
      updated_by: userId || null,
    };

    const { data, error } = await this.supabase
      .from('governance_rules')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create rule', { error, orgId, policyId: input.policyId });
      throw new Error(`Failed to create rule: ${error.message}`);
    }

    logger.info('Rule created', { orgId, ruleId: data.id, policyId: input.policyId });
    return this.mapRuleRecord(data);
  }

  async updateRule(
    orgId: string,
    ruleId: string,
    input: UpdateGovernanceRuleInput,
    userId?: string
  ): Promise<GovernanceRule> {
    const updates: Record<string, unknown> = { updated_by: userId || null };

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.ruleType !== undefined) updates.rule_type = input.ruleType;
    if (input.targetSystem !== undefined) updates.target_system = input.targetSystem;
    if (input.condition !== undefined) updates.condition = input.condition;
    if (input.action !== undefined) updates.action = input.action;
    if (input.priority !== undefined) updates.priority = input.priority;
    if (input.isActive !== undefined) updates.is_active = input.isActive;
    if (input.evaluationMode !== undefined) updates.evaluation_mode = input.evaluationMode;
    if (input.scheduleCron !== undefined) updates.schedule_cron = input.scheduleCron;
    if (input.cooldownMinutes !== undefined) updates.cooldown_minutes = input.cooldownMinutes;
    if (input.maxFindingsPerDay !== undefined) updates.max_findings_per_day = input.maxFindingsPerDay;
    if (input.tags !== undefined) updates.tags = input.tags;
    if (input.metadata !== undefined) updates.metadata = input.metadata;

    const { data, error } = await this.supabase
      .from('governance_rules')
      .update(updates)
      .eq('id', ruleId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update rule', { error, orgId, ruleId });
      throw new Error(`Failed to update rule: ${error.message}`);
    }

    logger.info('Rule updated', { orgId, ruleId });
    return this.mapRuleRecord(data);
  }

  async getRule(orgId: string, ruleId: string): Promise<GovernanceRule | null> {
    const { data, error } = await this.supabase
      .from('governance_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get rule', { error, orgId, ruleId });
      throw new Error(`Failed to get rule: ${error.message}`);
    }

    return this.mapRuleRecord(data);
  }

  async listRules(orgId: string, query: GovernanceRulesQuery = {}): Promise<GovernanceRulesListResponse> {
    const {
      policyId,
      ruleType,
      targetSystem,
      isActive,
      evaluationMode,
      tags,
      searchQuery,
      sortBy = 'priority',
      sortOrder = 'asc',
      limit = 50,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('governance_rules')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (policyId) {
      dbQuery = dbQuery.eq('policy_id', policyId);
    }

    if (ruleType) {
      if (Array.isArray(ruleType)) {
        dbQuery = dbQuery.in('rule_type', ruleType);
      } else {
        dbQuery = dbQuery.eq('rule_type', ruleType);
      }
    }

    if (targetSystem) {
      if (Array.isArray(targetSystem)) {
        dbQuery = dbQuery.in('target_system', targetSystem);
      } else {
        dbQuery = dbQuery.eq('target_system', targetSystem);
      }
    }

    if (isActive !== undefined) {
      dbQuery = dbQuery.eq('is_active', isActive);
    }

    if (evaluationMode) {
      dbQuery = dbQuery.eq('evaluation_mode', evaluationMode);
    }

    if (tags && tags.length > 0) {
      dbQuery = dbQuery.overlaps('tags', tags);
    }

    if (searchQuery) {
      dbQuery = dbQuery.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const sortColumn = sortBy === 'created_at' ? 'created_at' :
                       sortBy === 'updated_at' ? 'updated_at' :
                       sortBy === 'name' ? 'name' : 'priority';

    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list rules', { error, orgId });
      throw new Error(`Failed to list rules: ${error.message}`);
    }

    const rules = (data || []).map(this.mapRuleRecord);
    const total = count || 0;

    return {
      rules,
      total,
      hasMore: offset + rules.length < total,
    };
  }

  async deleteRule(orgId: string, ruleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('governance_rules')
      .delete()
      .eq('id', ruleId)
      .eq('org_id', orgId);

    if (error) {
      logger.error('Failed to delete rule', { error, orgId, ruleId });
      throw new Error(`Failed to delete rule: ${error.message}`);
    }

    logger.info('Rule deleted', { orgId, ruleId });
  }

  // ========================================
  // Finding Methods
  // ========================================

  async createFinding(
    orgId: string,
    input: CreateGovernanceFindingInput
  ): Promise<GovernanceFinding> {
    const record = {
      org_id: orgId,
      policy_id: input.policyId,
      rule_id: input.ruleId,
      source_system: input.sourceSystem,
      source_reference_id: input.sourceReferenceId,
      source_reference_type: input.sourceReferenceType || null,
      severity: input.severity,
      status: 'open',
      summary: input.summary,
      details: input.details || null,
      impact_score: input.impactScore || null,
      affected_entities: input.affectedEntities || [],
      recommended_actions: input.recommendedActions || [],
      metadata: input.metadata || {},
      event_snapshot: input.eventSnapshot || {},
    };

    const { data, error } = await this.supabase
      .from('governance_findings')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create finding', { error, orgId, ruleId: input.ruleId });
      throw new Error(`Failed to create finding: ${error.message}`);
    }

    logger.info('Finding created', { orgId, findingId: data.id, severity: input.severity });
    return this.mapFindingRecord(data);
  }

  async updateFinding(
    orgId: string,
    findingId: string,
    input: UpdateGovernanceFindingInput,
    userId?: string
  ): Promise<GovernanceFinding> {
    const updates: Record<string, unknown> = {};

    if (input.status !== undefined) {
      updates.status = input.status;

      // Set timestamps based on status
      if (input.status === 'acknowledged') {
        updates.acknowledged_at = new Date().toISOString();
      } else if (input.status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = userId || null;
      } else if (input.status === 'dismissed') {
        updates.dismissed_at = new Date().toISOString();
      }
    }

    if (input.assignedTo !== undefined) updates.assigned_to = input.assignedTo;
    if (input.mitigationNotes !== undefined) updates.mitigation_notes = input.mitigationNotes;
    if (input.resolutionNotes !== undefined) updates.resolution_notes = input.resolutionNotes;
    if (input.recommendedActions !== undefined) updates.recommended_actions = input.recommendedActions;

    const { data, error } = await this.supabase
      .from('governance_findings')
      .update(updates)
      .eq('id', findingId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update finding', { error, orgId, findingId });
      throw new Error(`Failed to update finding: ${error.message}`);
    }

    logger.info('Finding updated', { orgId, findingId, status: input.status });
    return this.mapFindingRecord(data);
  }

  async getFinding(orgId: string, findingId: string): Promise<GovernanceFinding | null> {
    const { data, error } = await this.supabase
      .from('governance_findings')
      .select('*')
      .eq('id', findingId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get finding', { error, orgId, findingId });
      throw new Error(`Failed to get finding: ${error.message}`);
    }

    return this.mapFindingRecord(data);
  }

  async getFindingDetail(orgId: string, findingId: string): Promise<GovernanceFindingDetailResponse | null> {
    const finding = await this.getFinding(orgId, findingId);
    if (!finding) return null;

    const [policy, rule, relatedFindings] = await Promise.all([
      this.getPolicy(orgId, finding.policyId),
      this.getRule(orgId, finding.ruleId),
      this.listFindings(orgId, {
        ruleId: finding.ruleId,
        status: ['open', 'acknowledged', 'in_progress'],
        limit: 5,
      }),
    ]);

    if (!policy || !rule) {
      return null;
    }

    return {
      finding,
      policy,
      rule,
      relatedFindings: relatedFindings.findings.filter(f => f.id !== findingId),
    };
  }

  async listFindings(orgId: string, query: GovernanceFindingsQuery = {}): Promise<GovernanceFindingsListResponse> {
    const {
      policyId,
      ruleId,
      sourceSystem,
      severity,
      status,
      assignedTo,
      detectedAfter,
      detectedBefore,
      searchQuery,
      sortBy = 'detected_at',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('governance_findings')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (policyId) {
      dbQuery = dbQuery.eq('policy_id', policyId);
    }

    if (ruleId) {
      dbQuery = dbQuery.eq('rule_id', ruleId);
    }

    if (sourceSystem) {
      if (Array.isArray(sourceSystem)) {
        dbQuery = dbQuery.in('source_system', sourceSystem);
      } else {
        dbQuery = dbQuery.eq('source_system', sourceSystem);
      }
    }

    if (severity) {
      if (Array.isArray(severity)) {
        dbQuery = dbQuery.in('severity', severity);
      } else {
        dbQuery = dbQuery.eq('severity', severity);
      }
    }

    if (status) {
      if (Array.isArray(status)) {
        dbQuery = dbQuery.in('status', status);
      } else {
        dbQuery = dbQuery.eq('status', status);
      }
    }

    if (assignedTo) {
      dbQuery = dbQuery.eq('assigned_to', assignedTo);
    }

    if (detectedAfter) {
      dbQuery = dbQuery.gte('detected_at', detectedAfter.toISOString());
    }

    if (detectedBefore) {
      dbQuery = dbQuery.lte('detected_at', detectedBefore.toISOString());
    }

    if (searchQuery) {
      dbQuery = dbQuery.or(`summary.ilike.%${searchQuery}%,details.ilike.%${searchQuery}%`);
    }

    const sortColumn = sortBy === 'detected_at' ? 'detected_at' :
                       sortBy === 'severity' ? 'severity' :
                       sortBy === 'status' ? 'status' : 'impact_score';

    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list findings', { error, orgId });
      throw new Error(`Failed to list findings: ${error.message}`);
    }

    const findings = (data || []).map(this.mapFindingRecord);
    const total = count || 0;

    return {
      findings,
      total,
      hasMore: offset + findings.length < total,
    };
  }

  async acknowledgeFinding(orgId: string, findingId: string, notes?: string): Promise<GovernanceFinding> {
    return this.updateFinding(orgId, findingId, {
      status: 'acknowledged' as GovernanceFindingStatus,
      mitigationNotes: notes,
    });
  }

  async resolveFinding(
    orgId: string,
    findingId: string,
    resolutionNotes: string,
    userId?: string
  ): Promise<GovernanceFinding> {
    return this.updateFinding(orgId, findingId, {
      status: 'resolved' as GovernanceFindingStatus,
      resolutionNotes,
    }, userId);
  }

  async dismissFinding(orgId: string, findingId: string, reason: string): Promise<GovernanceFinding> {
    return this.updateFinding(orgId, findingId, {
      status: 'dismissed' as GovernanceFindingStatus,
      mitigationNotes: reason,
    });
  }

  async escalateFinding(
    orgId: string,
    findingId: string,
    escalateTo: string,
    notes?: string
  ): Promise<GovernanceFinding> {
    return this.updateFinding(orgId, findingId, {
      status: 'escalated' as GovernanceFindingStatus,
      assignedTo: escalateTo,
      mitigationNotes: notes,
    });
  }

  // ========================================
  // Risk Score Methods
  // ========================================

  async upsertRiskScore(
    orgId: string,
    input: UpsertGovernanceRiskScoreInput
  ): Promise<GovernanceRiskScore> {
    // Check for existing score
    const { data: existing } = await this.supabase
      .from('governance_risk_scores')
      .select('*')
      .eq('org_id', orgId)
      .eq('entity_type', input.entityType)
      .eq('entity_id', input.entityId)
      .single();

    const previousScore = existing?.overall_score;
    let scoreTrend: GovernanceScoreTrend | undefined;

    if (previousScore !== undefined) {
      const diff = input.overallScore - previousScore;
      if (diff < -5) scoreTrend = 'improving';
      else if (diff > 5) scoreTrend = 'worsening';
      else scoreTrend = 'stable';
    }

    // Get active findings count for this entity
    const { count: findingsCount } = await this.supabase
      .from('governance_findings')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', ['open', 'acknowledged', 'in_progress']);

    const record = {
      org_id: orgId,
      entity_type: input.entityType,
      entity_id: input.entityId,
      entity_name: input.entityName || null,
      overall_score: input.overallScore,
      risk_level: input.riskLevel,
      content_risk: input.contentRisk || null,
      reputation_risk: input.reputationRisk || null,
      crisis_risk: input.crisisRisk || null,
      legal_risk: input.legalRisk || null,
      relationship_risk: input.relationshipRisk || null,
      competitive_risk: input.competitiveRisk || null,
      previous_score: previousScore || null,
      score_trend: scoreTrend || null,
      trend_period_days: 30,
      breakdown: input.breakdown || {},
      contributing_factors: input.contributingFactors || [],
      active_findings_count: findingsCount || 0,
      linked_finding_ids: input.linkedFindingIds || [],
      computed_at: new Date().toISOString(),
      computation_method: input.computationMethod || 'weighted_average',
      confidence_score: input.confidenceScore || null,
      valid_until: input.validUntil?.toISOString() || null,
      is_stale: false,
    };

    let data: RiskScoreRecord;
    let error: { message: string } | null = null;

    if (existing) {
      const result = await this.supabase
        .from('governance_risk_scores')
        .update(record)
        .eq('id', existing.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await this.supabase
        .from('governance_risk_scores')
        .insert(record)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      logger.error('Failed to upsert risk score', { error, orgId, entityType: input.entityType, entityId: input.entityId });
      throw new Error(`Failed to upsert risk score: ${error.message}`);
    }

    logger.info('Risk score upserted', { orgId, entityType: input.entityType, entityId: input.entityId, score: input.overallScore });
    return this.mapRiskScoreRecord(data);
  }

  async getRiskScore(orgId: string, entityType: GovernanceEntityType, entityId: string): Promise<GovernanceRiskScore | null> {
    const { data, error } = await this.supabase
      .from('governance_risk_scores')
      .select('*')
      .eq('org_id', orgId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get risk score', { error, orgId, entityType, entityId });
      throw new Error(`Failed to get risk score: ${error.message}`);
    }

    return this.mapRiskScoreRecord(data);
  }

  async listRiskScores(orgId: string, query: GovernanceRiskScoresQuery = {}): Promise<GovernanceRiskScoresListResponse> {
    const {
      entityType,
      riskLevel,
      minOverallScore,
      maxOverallScore,
      scoreTrend,
      isStale,
      sortBy = 'overall_score',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('governance_risk_scores')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (entityType) {
      if (Array.isArray(entityType)) {
        dbQuery = dbQuery.in('entity_type', entityType);
      } else {
        dbQuery = dbQuery.eq('entity_type', entityType);
      }
    }

    if (riskLevel) {
      if (Array.isArray(riskLevel)) {
        dbQuery = dbQuery.in('risk_level', riskLevel);
      } else {
        dbQuery = dbQuery.eq('risk_level', riskLevel);
      }
    }

    if (minOverallScore !== undefined) {
      dbQuery = dbQuery.gte('overall_score', minOverallScore);
    }

    if (maxOverallScore !== undefined) {
      dbQuery = dbQuery.lte('overall_score', maxOverallScore);
    }

    if (scoreTrend) {
      dbQuery = dbQuery.eq('score_trend', scoreTrend);
    }

    if (isStale !== undefined) {
      dbQuery = dbQuery.eq('is_stale', isStale);
    }

    const sortColumn = sortBy === 'overall_score' ? 'overall_score' :
                       sortBy === 'computed_at' ? 'computed_at' : 'entity_name';

    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list risk scores', { error, orgId });
      throw new Error(`Failed to list risk scores: ${error.message}`);
    }

    const riskScores = (data || []).map(this.mapRiskScoreRecord);
    const total = count || 0;

    return {
      riskScores,
      total,
      hasMore: offset + riskScores.length < total,
    };
  }

  // ========================================
  // Audit Insight Methods
  // ========================================

  async createAuditInsight(
    orgId: string,
    input: CreateGovernanceAuditInsightInput,
    userId?: string
  ): Promise<GovernanceAuditInsight> {
    // Count findings in the time window
    const { count: findingsCount } = await this.supabase
      .from('governance_findings')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('detected_at', input.timeWindowStart.toISOString())
      .lte('detected_at', input.timeWindowEnd.toISOString());

    const { count: resolvedCount } = await this.supabase
      .from('governance_findings')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('status', 'resolved')
      .gte('resolved_at', input.timeWindowStart.toISOString())
      .lte('resolved_at', input.timeWindowEnd.toISOString());

    const record = {
      org_id: orgId,
      time_window_start: input.timeWindowStart.toISOString(),
      time_window_end: input.timeWindowEnd.toISOString(),
      insight_type: input.insightType || 'periodic_review',
      scope: input.scope || 'global',
      title: input.title,
      summary: input.summary,
      executive_summary: input.executiveSummary || null,
      detailed_analysis: input.detailedAnalysis || null,
      recommendations: input.recommendations || [],
      action_items: input.actionItems || [],
      top_risks: input.topRisks || [],
      risk_distribution: input.riskDistribution || {},
      metrics_snapshot: input.metricsSnapshot || {},
      trend_analysis: input.trendAnalysis || {},
      linked_findings: input.linkedFindings || [],
      findings_count: findingsCount || 0,
      resolved_findings_count: resolvedCount || 0,
      generated_by: input.generatedBy || 'rule_based',
      llm_model: input.llmModel || null,
      generation_prompt: input.generationPrompt || null,
      tokens_used: input.tokensUsed || null,
      recipients: [],
      created_by: userId || null,
    };

    const { data, error } = await this.supabase
      .from('governance_audit_insights')
      .insert(record)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create audit insight', { error, orgId });
      throw new Error(`Failed to create audit insight: ${error.message}`);
    }

    logger.info('Audit insight created', { orgId, insightId: data.id });
    return this.mapAuditInsightRecord(data);
  }

  async getAuditInsight(orgId: string, insightId: string): Promise<GovernanceAuditInsight | null> {
    const { data, error } = await this.supabase
      .from('governance_audit_insights')
      .select('*')
      .eq('id', insightId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      logger.error('Failed to get audit insight', { error, orgId, insightId });
      throw new Error(`Failed to get audit insight: ${error.message}`);
    }

    return this.mapAuditInsightRecord(data);
  }

  async listAuditInsights(orgId: string, query: GovernanceAuditInsightsQuery = {}): Promise<GovernanceAuditInsightsListResponse> {
    const {
      insightType,
      scope,
      timeWindowStart,
      timeWindowEnd,
      generatedBy,
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('governance_audit_insights')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (insightType) {
      dbQuery = dbQuery.eq('insight_type', insightType);
    }

    if (scope) {
      if (Array.isArray(scope)) {
        dbQuery = dbQuery.in('scope', scope);
      } else {
        dbQuery = dbQuery.eq('scope', scope);
      }
    }

    if (timeWindowStart) {
      dbQuery = dbQuery.gte('time_window_start', timeWindowStart.toISOString());
    }

    if (timeWindowEnd) {
      dbQuery = dbQuery.lte('time_window_end', timeWindowEnd.toISOString());
    }

    if (generatedBy) {
      dbQuery = dbQuery.eq('generated_by', generatedBy);
    }

    const sortColumn = sortBy === 'created_at' ? 'created_at' :
                       sortBy === 'time_window_start' ? 'time_window_start' : 'title';

    dbQuery = dbQuery.order(sortColumn, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) {
      logger.error('Failed to list audit insights', { error, orgId });
      throw new Error(`Failed to list audit insights: ${error.message}`);
    }

    const insights = (data || []).map(this.mapAuditInsightRecord);
    const total = count || 0;

    return {
      insights,
      total,
      hasMore: offset + insights.length < total,
    };
  }

  // ========================================
  // Rule Evaluation Engine
  // ========================================

  async evaluateRules(
    orgId: string,
    context: GovernanceEvaluationContext,
    ruleIds?: string[]
  ): Promise<GovernanceBatchEvaluationResponse> {
    const startTime = Date.now();
    const results: GovernanceEvaluationResult[] = [];
    let findingsCreated = 0;

    // Get applicable rules
    let rulesQuery = this.supabase
      .from('governance_rules')
      .select('*, governance_policies!inner(*)')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .eq('target_system', context.sourceSystem);

    if (ruleIds && ruleIds.length > 0) {
      rulesQuery = rulesQuery.in('id', ruleIds);
    }

    const { data: rules, error } = await rulesQuery;

    if (error) {
      logger.error('Failed to fetch rules for evaluation', { error, orgId });
      throw new Error(`Failed to fetch rules: ${error.message}`);
    }

    // Evaluate each rule
    for (const rule of rules || []) {
      const ruleStartTime = Date.now();
      let triggered = false;
      let conditionsMet = false;
      let findingId: string | undefined;
      const actionsTaken: string[] = [];
      let evalError: string | undefined;

      try {
        // Check cooldown
        if (rule.cooldown_minutes > 0) {
          const cooldownStart = new Date();
          cooldownStart.setMinutes(cooldownStart.getMinutes() - rule.cooldown_minutes);

          const { count } = await this.supabase
            .from('governance_findings')
            .select('*', { count: 'exact', head: true })
            .eq('rule_id', rule.id)
            .gte('detected_at', cooldownStart.toISOString());

          if (count && count > 0) {
            // Skip due to cooldown
            results.push({
              ruleId: rule.id,
              triggered: false,
              conditionsMet: false,
              actionsTaken: ['skipped_cooldown'],
              evaluationDuration: Date.now() - ruleStartTime,
            });
            continue;
          }
        }

        // Check max findings per day
        if (rule.max_findings_per_day) {
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);

          const { count } = await this.supabase
            .from('governance_findings')
            .select('*', { count: 'exact', head: true })
            .eq('rule_id', rule.id)
            .gte('detected_at', todayStart.toISOString());

          if (count && count >= rule.max_findings_per_day) {
            results.push({
              ruleId: rule.id,
              triggered: false,
              conditionsMet: false,
              actionsTaken: ['skipped_daily_limit'],
              evaluationDuration: Date.now() - ruleStartTime,
            });
            continue;
          }
        }

        // Evaluate condition
        conditionsMet = this.evaluateCondition(rule.condition, context.eventData);

        if (conditionsMet) {
          triggered = true;

          // Execute action
          const action = rule.action as Record<string, unknown>;
          if (action.type === 'create_finding') {
            const finding = await this.createFinding(orgId, {
              policyId: rule.policy_id,
              ruleId: rule.id,
              sourceSystem: context.sourceSystem,
              sourceReferenceId: context.eventId,
              sourceReferenceType: context.eventType,
              severity: (action.severity as GovernanceSeverityLevel) || rule.governance_policies.severity,
              summary: (action.message as string) || `Rule "${rule.name}" triggered`,
              details: `Event type: ${context.eventType}`,
              eventSnapshot: context.eventData,
              metadata: context.metadata || {},
            });
            findingId = finding.id;
            findingsCreated++;
            actionsTaken.push('finding_created');
          }

          if (action.type === 'log') {
            logger.info('Governance rule triggered', {
              orgId,
              ruleId: rule.id,
              ruleName: rule.name,
              eventType: context.eventType,
            });
            actionsTaken.push('logged');
          }

          // Additional action types can be added here
        }
      } catch (err) {
        evalError = err instanceof Error ? err.message : 'Unknown error';
        logger.error('Error evaluating rule', { error: err, ruleId: rule.id });
      }

      results.push({
        ruleId: rule.id,
        triggered,
        conditionsMet,
        findingCreated: findingId,
        actionsTaken,
        evaluationDuration: Date.now() - ruleStartTime,
        error: evalError,
      });
    }

    return {
      context,
      results,
      totalRulesEvaluated: results.length,
      findingsCreated,
      duration: Date.now() - startTime,
    };
  }

  private evaluateCondition(condition: GovernanceRuleCondition, eventData: Record<string, unknown>): boolean {
    // Handle compound conditions
    if (condition.conditions && condition.logic) {
      const subResults = condition.conditions.map(c => this.evaluateCondition(c, eventData));
      return condition.logic === 'and'
        ? subResults.every(r => r)
        : subResults.some(r => r);
    }

    // Handle simple conditions
    if (!condition.field || !condition.operator) {
      return true; // No condition = always match
    }

    const fieldValue = this.getNestedValue(eventData, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'eq':
        return fieldValue === conditionValue;
      case 'ne':
        return fieldValue !== conditionValue;
      case 'gt':
        return typeof fieldValue === 'number' && typeof conditionValue === 'number' && fieldValue > conditionValue;
      case 'gte':
        return typeof fieldValue === 'number' && typeof conditionValue === 'number' && fieldValue >= conditionValue;
      case 'lt':
        return typeof fieldValue === 'number' && typeof conditionValue === 'number' && fieldValue < conditionValue;
      case 'lte':
        return typeof fieldValue === 'number' && typeof conditionValue === 'number' && fieldValue <= conditionValue;
      case 'contains':
        return typeof fieldValue === 'string' && typeof conditionValue === 'string' && fieldValue.includes(conditionValue);
      case 'matches':
        if (typeof fieldValue === 'string' && condition.pattern) {
          try {
            return new RegExp(condition.pattern).test(fieldValue);
          } catch {
            return false;
          }
        }
        return false;
      case 'in':
        return Array.isArray(condition.items) && condition.items.includes(fieldValue as string);
      case 'not_in':
        return Array.isArray(condition.items) && !condition.items.includes(fieldValue as string);
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const keys = path.split('.');
    let current: unknown = obj;

    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      if (typeof current !== 'object') return undefined;
      current = (current as Record<string, unknown>)[key];
    }

    return current;
  }

  // ========================================
  // Dashboard & Analytics
  // ========================================

  async getDashboardSummary(orgId: string): Promise<GovernanceDashboardSummary> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries
    const [
      policiesResult,
      rulesResult,
      findingsResult,
      riskScoresResult,
      findingsTrendResult,
    ] = await Promise.all([
      this.supabase.from('governance_policies').select('category, severity, is_active').eq('org_id', orgId),
      this.supabase.from('governance_rules').select('rule_type, target_system, is_active').eq('org_id', orgId),
      this.supabase.from('governance_findings').select('status, severity').eq('org_id', orgId),
      this.supabase.from('governance_risk_scores').select('overall_score, risk_level, score_trend, entity_type, entity_id, entity_name')
        .eq('org_id', orgId)
        .gte('overall_score', 70)
        .order('overall_score', { ascending: false })
        .limit(5),
      this.supabase.from('governance_findings').select('detected_at, status')
        .eq('org_id', orgId)
        .gte('detected_at', thirtyDaysAgo.toISOString()),
    ]);

    const policies = policiesResult.data || [];
    const rules = rulesResult.data || [];
    const findings = findingsResult.data || [];
    const riskScores = riskScoresResult.data || [];
    const recentFindings = findingsTrendResult.data || [];

    // Calculate policy stats
    const policiesByCategory: Record<GovernancePolicyCategory, number> = {} as Record<GovernancePolicyCategory, number>;
    const policiesBySeverity: Record<GovernanceSeverityLevel, number> = {} as Record<GovernanceSeverityLevel, number>;
    let activePolicies = 0;

    for (const p of policies) {
      policiesByCategory[p.category as GovernancePolicyCategory] = (policiesByCategory[p.category as GovernancePolicyCategory] || 0) + 1;
      policiesBySeverity[p.severity as GovernanceSeverityLevel] = (policiesBySeverity[p.severity as GovernanceSeverityLevel] || 0) + 1;
      if (p.is_active) activePolicies++;
    }

    // Calculate rule stats
    const rulesByType: Record<GovernanceRuleType, number> = {} as Record<GovernanceRuleType, number>;
    const rulesByTargetSystem: Record<GovernanceTargetSystem, number> = {} as Record<GovernanceTargetSystem, number>;
    let activeRules = 0;

    for (const r of rules) {
      rulesByType[r.rule_type as GovernanceRuleType] = (rulesByType[r.rule_type as GovernanceRuleType] || 0) + 1;
      rulesByTargetSystem[r.target_system as GovernanceTargetSystem] = (rulesByTargetSystem[r.target_system as GovernanceTargetSystem] || 0) + 1;
      if (r.is_active) activeRules++;
    }

    // Calculate finding stats
    const findingsByStatus: Record<GovernanceFindingStatus, number> = {} as Record<GovernanceFindingStatus, number>;
    const findingsBySeverity: Record<GovernanceSeverityLevel, number> = {} as Record<GovernanceSeverityLevel, number>;
    let openFindings = 0;

    for (const f of findings) {
      findingsByStatus[f.status as GovernanceFindingStatus] = (findingsByStatus[f.status as GovernanceFindingStatus] || 0) + 1;
      findingsBySeverity[f.severity as GovernanceSeverityLevel] = (findingsBySeverity[f.severity as GovernanceSeverityLevel] || 0) + 1;
      if (['open', 'acknowledged', 'in_progress'].includes(f.status)) openFindings++;
    }

    // Calculate findings trend (by week)
    const findingsTrend: { period: string; count: number; resolved: number }[] = [];
    const weekMap = new Map<string, { count: number; resolved: number }>();

    for (const f of recentFindings) {
      const date = new Date(f.detected_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      const existing = weekMap.get(weekKey) || { count: 0, resolved: 0 };
      existing.count++;
      if (f.status === 'resolved') existing.resolved++;
      weekMap.set(weekKey, existing);
    }

    for (const [period, data] of weekMap) {
      findingsTrend.push({ period, ...data });
    }
    findingsTrend.sort((a, b) => a.period.localeCompare(b.period));

    // Calculate risk stats
    let totalRiskScore = 0;
    const topRisks: GovernanceInsightTopRisk[] = riskScores.map(rs => {
      totalRiskScore += rs.overall_score;
      return {
        entityType: rs.entity_type as GovernanceEntityType,
        entityId: rs.entity_id,
        entityName: rs.entity_name || undefined,
        riskScore: rs.overall_score,
        riskLevel: rs.risk_level as GovernanceSeverityLevel,
        primaryConcern: 'High risk score',
        trend: rs.score_trend as GovernanceScoreTrend || undefined,
      };
    });

    const avgRiskScore = riskScores.length > 0 ? totalRiskScore / riskScores.length : 0;
    const worseningCount = riskScores.filter(rs => rs.score_trend === 'worsening').length;
    const improvingCount = riskScores.filter(rs => rs.score_trend === 'improving').length;
    const riskTrend: GovernanceScoreTrend = worseningCount > improvingCount ? 'worsening' :
                                             improvingCount > worseningCount ? 'improving' : 'stable';

    return {
      totalPolicies: policies.length,
      activePolicies,
      policiesByCategory,
      policiesBySeverity,
      totalRules: rules.length,
      activeRules,
      rulesByType,
      rulesByTargetSystem,
      totalFindings: findings.length,
      openFindings,
      findingsByStatus,
      findingsBySeverity,
      findingsTrend,
      highRiskEntities: riskScores.length,
      avgRiskScore,
      riskTrend,
      topRisks,
      lastUpdated: new Date(),
    };
  }

  async getComplianceMetrics(orgId: string, days: number = 30): Promise<GovernanceComplianceMetrics> {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Get current period stats
    const [
      findingsResult,
      resolvedResult,
      previousFindingsResult,
      previousResolvedResult,
      rulesResult,
      triggeredRulesResult,
    ] = await Promise.all([
      this.supabase.from('governance_findings').select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('detected_at', startDate.toISOString()),
      this.supabase.from('governance_findings').select('resolved_at, detected_at')
        .eq('org_id', orgId)
        .eq('status', 'resolved')
        .gte('resolved_at', startDate.toISOString()),
      this.supabase.from('governance_findings').select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('detected_at', previousStartDate.toISOString())
        .lt('detected_at', startDate.toISOString()),
      this.supabase.from('governance_findings').select('resolved_at, detected_at')
        .eq('org_id', orgId)
        .eq('status', 'resolved')
        .gte('resolved_at', previousStartDate.toISOString())
        .lt('resolved_at', startDate.toISOString()),
      this.supabase.from('governance_rules').select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('is_active', true),
      this.supabase.from('governance_findings').select('rule_id')
        .eq('org_id', orgId)
        .gte('detected_at', startDate.toISOString()),
    ]);

    const currentFindings = findingsResult.count || 0;
    const previousFindings = previousFindingsResult.count || 0;
    const resolved = resolvedResult.data || [];
    const previousResolved = previousResolvedResult.data || [];
    const totalRules = rulesResult.count || 0;

    // Calculate resolution rate
    const resolutionRate = currentFindings > 0 ? (resolved.length / currentFindings) * 100 : 100;
    const previousResolutionRate = previousFindings > 0 ? (previousResolved.length / previousFindings) * 100 : 100;

    // Calculate mean time to resolution
    let totalResolutionTime = 0;
    for (const f of resolved) {
      if (f.resolved_at && f.detected_at) {
        totalResolutionTime += new Date(f.resolved_at).getTime() - new Date(f.detected_at).getTime();
      }
    }
    const meanTimeToResolution = resolved.length > 0 ? totalResolutionTime / resolved.length / (1000 * 60 * 60) : 0;

    // Calculate rule effectiveness
    const triggeredRuleIds = new Set((triggeredRulesResult.data || []).map(f => f.rule_id));
    const ruleEffectiveness = totalRules > 0 ? (triggeredRuleIds.size / totalRules) * 100 : 0;

    // Calculate compliance score (inverse of open findings ratio)
    const openFindingsResult = await this.supabase
      .from('governance_findings')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .in('status', ['open', 'acknowledged', 'in_progress']);
    const openFindings = openFindingsResult.count || 0;
    const complianceScore = Math.max(0, 100 - (openFindings * 5)); // Lose 5 points per open finding

    // Policy coverage - simplified for now
    const policyCoverage = 100; // TODO: Calculate based on actual system coverage

    return {
      complianceScore: Math.round(complianceScore),
      policyCoverage,
      ruleEffectiveness: Math.round(ruleEffectiveness),
      resolutionRate: Math.round(resolutionRate),
      meanTimeToResolution: Math.round(meanTimeToResolution * 10) / 10,
      findingsPerDay: Math.round((currentFindings / days) * 10) / 10,
      trendsVsPreviousPeriod: {
        complianceScoreChange: 0, // TODO: Calculate
        findingsChange: currentFindings - previousFindings,
        resolutionRateChange: Math.round(resolutionRate - previousResolutionRate),
      },
    };
  }

  async getRiskHeatmap(orgId: string): Promise<GovernanceRiskHeatmapResponse> {
    const { data: riskScores } = await this.supabase
      .from('governance_risk_scores')
      .select('*')
      .eq('org_id', orgId);

    const cells: GovernanceRiskHeatmapCell[] = [];
    const entityTypes = new Set<GovernanceEntityType>();
    const riskDimensions = ['content', 'reputation', 'crisis', 'legal', 'relationship', 'competitive'];

    for (const rs of riskScores || []) {
      entityTypes.add(rs.entity_type as GovernanceEntityType);

      // Add cells for each dimension
      const dimensions: Record<string, number | null> = {
        content: rs.content_risk,
        reputation: rs.reputation_risk,
        crisis: rs.crisis_risk,
        legal: rs.legal_risk,
        relationship: rs.relationship_risk,
        competitive: rs.competitive_risk,
      };

      for (const [dimension, score] of Object.entries(dimensions)) {
        if (score !== null) {
          cells.push({
            entityType: rs.entity_type as GovernanceEntityType,
            riskDimension: dimension,
            score,
            trend: (rs.score_trend as GovernanceScoreTrend) || 'stable',
            findingsCount: rs.active_findings_count || 0,
          });
        }
      }
    }

    return {
      cells,
      entityTypes: Array.from(entityTypes),
      riskDimensions,
    };
  }

  // ========================================
  // Mappers
  // ========================================

  private mapPolicyRecord(record: PolicyRecord): GovernancePolicy {
    return {
      id: record.id,
      orgId: record.org_id,
      key: record.key,
      name: record.name,
      description: record.description || undefined,
      category: record.category as GovernancePolicyCategory,
      scope: record.scope as GovernancePolicy['scope'],
      severity: record.severity as GovernanceSeverityLevel,
      ruleConfig: record.rule_config,
      isActive: record.is_active,
      isArchived: record.is_archived,
      ownerUserId: record.owner_user_id || undefined,
      department: record.department || undefined,
      regulatoryReference: record.regulatory_reference || undefined,
      effectiveDate: record.effective_date ? new Date(record.effective_date) : undefined,
      reviewDate: record.review_date ? new Date(record.review_date) : undefined,
      createdBy: record.created_by || undefined,
      updatedBy: record.updated_by || undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  private mapRuleRecord(record: RuleRecord): GovernanceRule {
    return {
      id: record.id,
      orgId: record.org_id,
      policyId: record.policy_id,
      name: record.name,
      description: record.description || undefined,
      ruleType: record.rule_type as GovernanceRuleType,
      targetSystem: record.target_system as GovernanceTargetSystem,
      condition: record.condition as GovernanceRuleCondition,
      action: record.action as GovernanceRule['action'],
      priority: record.priority,
      isActive: record.is_active,
      evaluationMode: (record.evaluation_mode || 'on_event') as GovernanceRule['evaluationMode'],
      scheduleCron: record.schedule_cron || undefined,
      cooldownMinutes: record.cooldown_minutes || 0,
      maxFindingsPerDay: record.max_findings_per_day || undefined,
      tags: record.tags || [],
      metadata: record.metadata || {},
      createdBy: record.created_by || undefined,
      updatedBy: record.updated_by || undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  private mapFindingRecord(record: FindingRecord): GovernanceFinding {
    return {
      id: record.id,
      orgId: record.org_id,
      policyId: record.policy_id,
      ruleId: record.rule_id,
      sourceSystem: record.source_system as GovernanceTargetSystem,
      sourceReferenceId: record.source_reference_id,
      sourceReferenceType: record.source_reference_type || undefined,
      severity: record.severity as GovernanceSeverityLevel,
      status: record.status as GovernanceFindingStatus,
      summary: record.summary,
      details: record.details || undefined,
      impactScore: record.impact_score || undefined,
      affectedEntities: (record.affected_entities || []) as GovernanceFinding['affectedEntities'],
      recommendedActions: (record.recommended_actions || []) as GovernanceFinding['recommendedActions'],
      mitigationNotes: record.mitigation_notes || undefined,
      assignedTo: record.assigned_to || undefined,
      resolvedBy: record.resolved_by || undefined,
      resolutionNotes: record.resolution_notes || undefined,
      detectedAt: new Date(record.detected_at),
      acknowledgedAt: record.acknowledged_at ? new Date(record.acknowledged_at) : undefined,
      resolvedAt: record.resolved_at ? new Date(record.resolved_at) : undefined,
      dismissedAt: record.dismissed_at ? new Date(record.dismissed_at) : undefined,
      metadata: record.metadata,
      eventSnapshot: record.event_snapshot,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  private mapRiskScoreRecord(record: RiskScoreRecord): GovernanceRiskScore {
    return {
      id: record.id,
      orgId: record.org_id,
      entityType: record.entity_type as GovernanceEntityType,
      entityId: record.entity_id,
      entityName: record.entity_name || undefined,
      overallScore: record.overall_score,
      riskLevel: record.risk_level as GovernanceSeverityLevel,
      contentRisk: record.content_risk || undefined,
      reputationRisk: record.reputation_risk || undefined,
      crisisRisk: record.crisis_risk || undefined,
      legalRisk: record.legal_risk || undefined,
      relationshipRisk: record.relationship_risk || undefined,
      competitiveRisk: record.competitive_risk || undefined,
      previousScore: record.previous_score || undefined,
      scoreTrend: record.score_trend as GovernanceScoreTrend || undefined,
      trendPeriodDays: record.trend_period_days || 30,
      breakdown: record.breakdown,
      contributingFactors: (record.contributing_factors || []) as GovernanceContributingFactor[],
      activeFindingsCount: record.active_findings_count || 0,
      linkedFindingIds: record.linked_finding_ids || [],
      computedAt: new Date(record.computed_at),
      computationMethod: record.computation_method || 'weighted_average',
      confidenceScore: record.confidence_score || undefined,
      validUntil: record.valid_until ? new Date(record.valid_until) : undefined,
      isStale: record.is_stale || false,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  private mapAuditInsightRecord(record: AuditInsightRecord): GovernanceAuditInsight {
    return {
      id: record.id,
      orgId: record.org_id,
      timeWindowStart: new Date(record.time_window_start),
      timeWindowEnd: new Date(record.time_window_end),
      insightType: record.insight_type || 'periodic_review',
      scope: (record.scope || 'global') as GovernanceAuditInsight['scope'],
      title: record.title,
      summary: record.summary,
      executiveSummary: record.executive_summary || undefined,
      detailedAnalysis: record.detailed_analysis || undefined,
      recommendations: (record.recommendations || []) as GovernanceAuditInsight['recommendations'],
      actionItems: (record.action_items || []) as GovernanceAuditInsight['actionItems'],
      topRisks: (record.top_risks || []) as GovernanceAuditInsight['topRisks'],
      riskDistribution: record.risk_distribution || {},
      metricsSnapshot: record.metrics_snapshot || {},
      trendAnalysis: record.trend_analysis || {},
      linkedFindings: record.linked_findings || [],
      findingsCount: record.findings_count || 0,
      resolvedFindingsCount: record.resolved_findings_count || 0,
      generatedBy: record.generated_by as GovernanceAuditInsight['generatedBy'],
      llmModel: record.llm_model || undefined,
      generationPrompt: record.generation_prompt || undefined,
      tokensUsed: record.tokens_used || undefined,
      recipients: (record.recipients || []) as GovernanceAuditInsight['recipients'],
      distributedAt: record.distributed_at ? new Date(record.distributed_at) : undefined,
      createdBy: record.created_by || undefined,
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  private mapPolicyVersionRecord(record: PolicyVersionRecord): GovernancePolicyVersion {
    return {
      id: record.id,
      orgId: record.org_id,
      policyId: record.policy_id,
      versionNumber: record.version_number,
      policySnapshot: record.policy_snapshot,
      changeSummary: record.change_summary || undefined,
      changedFields: record.changed_fields || [],
      createdBy: record.created_by || undefined,
      createdAt: new Date(record.created_at),
    };
  }
}

// ========================================
// Singleton Management
// ========================================

let governanceServiceInstance: GovernanceService | null = null;

export function initGovernanceService(supabase: SupabaseClient): GovernanceService {
  governanceServiceInstance = new GovernanceService(supabase);
  return governanceServiceInstance;
}

export function getGovernanceService(): GovernanceService {
  if (!governanceServiceInstance) {
    throw new Error('GovernanceService not initialized. Call initGovernanceService() first.');
  }
  return governanceServiceInstance;
}
