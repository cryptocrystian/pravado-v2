/**
 * Governance Service Tests (Sprint S59)
 * Comprehensive tests for GovernanceService functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  rpc: vi.fn(),
};

// Create mock query builder
function createMockQueryBuilder(data: any, error: any = null, count: number | null = null) {
  const builder = {
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: any) => Promise.resolve({ data, error, count }).then(resolve),
  };
  return builder;
}

// Mock dependencies
vi.mock('@pravado/utils', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

// Import after mocking
import { createGovernanceService, GovernanceService } from '../src/services/governanceService';

describe('Governance Service (S59)', () => {
  let governanceService: ReturnType<typeof createGovernanceService>;
  const testOrgId = 'test-org-uuid';
  const testUserId = 'test-user-uuid';

  beforeEach(() => {
    vi.clearAllMocks();
    governanceService = createGovernanceService({
      supabase: mockSupabase as any,
      debugMode: true,
    });
  });

  describe('Policy Management', () => {
    const mockPolicy = {
      id: 'policy-uuid-1',
      org_id: testOrgId,
      key: 'crisis-escalation',
      name: 'Crisis Escalation Policy',
      description: 'Rules for escalating crisis situations',
      category: 'crisis',
      scope: 'global',
      severity: 'high',
      rule_config: {},
      is_active: true,
      is_archived: false,
      owner_user_id: testUserId,
      department: 'Communications',
      regulatory_reference: null,
      effective_date: null,
      review_date: null,
      created_by: testUserId,
      updated_by: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    describe('createPolicy()', () => {
      it('should successfully create a new policy', async () => {
        const mockBuilder = createMockQueryBuilder(mockPolicy);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.createPolicy(testOrgId, {
          key: 'crisis-escalation',
          name: 'Crisis Escalation Policy',
          description: 'Rules for escalating crisis situations',
          category: 'crisis',
          scope: 'global',
          severity: 'high',
        }, testUserId);

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_policies');
        expect(mockBuilder.insert).toHaveBeenCalled();
        expect(result).not.toBeNull();
        expect(result?.name).toBe('Crisis Escalation Policy');
        expect(result?.category).toBe('crisis');
      });

      it('should throw error if key is not provided', async () => {
        await expect(
          governanceService.createPolicy(testOrgId, {
            key: '',
            name: 'Test Policy',
            category: 'content',
          }, testUserId)
        ).rejects.toThrow();
      });
    });

    describe('listPolicies()', () => {
      it('should return list of policies', async () => {
        const mockBuilder = createMockQueryBuilder([mockPolicy], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.listPolicies(testOrgId, {});

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_policies');
        expect(result.policies).toHaveLength(1);
        expect(result.total).toBe(1);
      });

      it('should filter by category', async () => {
        const mockBuilder = createMockQueryBuilder([mockPolicy], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.listPolicies(testOrgId, { category: 'crisis' });

        expect(mockBuilder.eq).toHaveBeenCalled();
      });

      it('should filter by multiple categories', async () => {
        const mockBuilder = createMockQueryBuilder([mockPolicy], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.listPolicies(testOrgId, { category: ['crisis', 'reputation'] });

        expect(mockBuilder.in).toHaveBeenCalled();
      });

      it('should exclude archived by default', async () => {
        const mockBuilder = createMockQueryBuilder([], null, 0);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.listPolicies(testOrgId, {});

        expect(mockBuilder.eq).toHaveBeenCalledWith('is_archived', false);
      });
    });

    describe('getPolicy()', () => {
      it('should return policy with associated rules', async () => {
        const mockBuilder = createMockQueryBuilder(mockPolicy);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.getPolicy(testOrgId, mockPolicy.id);

        expect(result).not.toBeNull();
        expect(result?.id).toBe(mockPolicy.id);
      });

      it('should return null for non-existent policy', async () => {
        const mockBuilder = createMockQueryBuilder(null);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.getPolicy(testOrgId, 'non-existent-id');

        expect(result).toBeNull();
      });
    });

    describe('updatePolicy()', () => {
      it('should update policy and create version', async () => {
        // First call returns the original policy
        const originalPolicyBuilder = createMockQueryBuilder(mockPolicy);
        // Second call returns the updated policy
        const updatedPolicy = { ...mockPolicy, name: 'Updated Policy Name' };
        const updatedPolicyBuilder = createMockQueryBuilder(updatedPolicy);
        // Third call inserts the version
        const versionBuilder = createMockQueryBuilder({ id: 'version-1' });

        mockSupabase.from
          .mockReturnValueOnce(originalPolicyBuilder)
          .mockReturnValueOnce(updatedPolicyBuilder)
          .mockReturnValueOnce(versionBuilder);

        const result = await governanceService.updatePolicy(
          testOrgId,
          mockPolicy.id,
          { name: 'Updated Policy Name' },
          testUserId
        );

        expect(result).not.toBeNull();
        expect(mockSupabase.from).toHaveBeenCalledWith('governance_policies');
      });
    });

    describe('deletePolicy()', () => {
      it('should delete policy and associated rules', async () => {
        const mockBuilder = createMockQueryBuilder(null);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.deletePolicy(testOrgId, mockPolicy.id);

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_rules');
        expect(mockSupabase.from).toHaveBeenCalledWith('governance_policies');
        expect(mockBuilder.delete).toHaveBeenCalled();
      });
    });
  });

  describe('Rule Management', () => {
    const mockRule = {
      id: 'rule-uuid-1',
      org_id: testOrgId,
      policy_id: 'policy-uuid-1',
      name: 'Negative Sentiment Alert',
      description: 'Alert when sentiment drops below threshold',
      rule_type: 'threshold',
      target_system: 'media_monitoring',
      condition: { field: 'sentiment_score', operator: 'lt', value: -0.5 },
      action: { createFinding: true, sendNotification: true },
      priority: 80,
      is_active: true,
      evaluation_mode: 'on_event',
      schedule_cron: null,
      cooldown_minutes: 60,
      max_findings_per_day: 10,
      tags: ['sentiment', 'monitoring'],
      metadata: {},
      created_by: testUserId,
      updated_by: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    describe('createRule()', () => {
      it('should successfully create a new rule', async () => {
        const mockBuilder = createMockQueryBuilder(mockRule);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.createRule(testOrgId, {
          policyId: 'policy-uuid-1',
          name: 'Negative Sentiment Alert',
          ruleType: 'threshold',
          targetSystem: 'media_monitoring',
          condition: { field: 'sentiment_score', operator: 'lt', value: -0.5 },
          action: { createFinding: true },
        }, testUserId);

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_rules');
        expect(mockBuilder.insert).toHaveBeenCalled();
        expect(result).not.toBeNull();
        expect(result?.name).toBe('Negative Sentiment Alert');
      });
    });

    describe('listRules()', () => {
      it('should return list of rules', async () => {
        const mockBuilder = createMockQueryBuilder([mockRule], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.listRules(testOrgId, {});

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_rules');
        expect(result.rules).toHaveLength(1);
      });

      it('should filter by policyId', async () => {
        const mockBuilder = createMockQueryBuilder([mockRule], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.listRules(testOrgId, { policyId: 'policy-uuid-1' });

        expect(mockBuilder.eq).toHaveBeenCalledWith('policy_id', 'policy-uuid-1');
      });

      it('should filter by targetSystem', async () => {
        const mockBuilder = createMockQueryBuilder([mockRule], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.listRules(testOrgId, { targetSystem: 'media_monitoring' });

        expect(mockBuilder.eq).toHaveBeenCalled();
      });
    });
  });

  describe('Finding Management', () => {
    const mockFinding = {
      id: 'finding-uuid-1',
      org_id: testOrgId,
      policy_id: 'policy-uuid-1',
      rule_id: 'rule-uuid-1',
      source_system: 'media_monitoring',
      source_reference_id: 'mention-123',
      source_reference_type: 'mention',
      severity: 'high',
      status: 'open',
      summary: 'Negative sentiment detected in coverage',
      details: 'Sentiment score of -0.8 detected',
      impact_score: 75,
      affected_entities: [{ entityType: 'brand', entityId: 'brand-1', entityName: 'Test Brand' }],
      recommended_actions: [{ action: 'Review coverage', priority: 'high' }],
      mitigation_notes: null,
      assigned_to: null,
      resolved_by: null,
      resolution_notes: null,
      detected_at: '2024-01-15T10:00:00Z',
      acknowledged_at: null,
      resolved_at: null,
      dismissed_at: null,
      metadata: {},
      event_snapshot: {},
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    describe('createFinding()', () => {
      it('should successfully create a new finding', async () => {
        const mockBuilder = createMockQueryBuilder(mockFinding);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.createFinding(testOrgId, {
          policyId: 'policy-uuid-1',
          ruleId: 'rule-uuid-1',
          sourceSystem: 'media_monitoring',
          sourceReferenceId: 'mention-123',
          severity: 'high',
          summary: 'Negative sentiment detected',
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_findings');
        expect(mockBuilder.insert).toHaveBeenCalled();
        expect(result).not.toBeNull();
        expect(result?.status).toBe('open');
      });
    });

    describe('listFindings()', () => {
      it('should return list of findings', async () => {
        const mockBuilder = createMockQueryBuilder([mockFinding], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.listFindings(testOrgId, {});

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_findings');
        expect(result.findings).toHaveLength(1);
      });

      it('should filter by status', async () => {
        const mockBuilder = createMockQueryBuilder([mockFinding], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.listFindings(testOrgId, { status: 'open' });

        expect(mockBuilder.eq).toHaveBeenCalled();
      });

      it('should filter by severity', async () => {
        const mockBuilder = createMockQueryBuilder([mockFinding], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.listFindings(testOrgId, { severity: ['high', 'critical'] });

        expect(mockBuilder.in).toHaveBeenCalled();
      });
    });

    describe('acknowledgeFinding()', () => {
      it('should update finding status to acknowledged', async () => {
        const acknowledgedFinding = { ...mockFinding, status: 'acknowledged', acknowledged_at: '2024-01-15T11:00:00Z' };
        const mockBuilder = createMockQueryBuilder(acknowledgedFinding);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.acknowledgeFinding(testOrgId, mockFinding.id, testUserId);

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_findings');
        expect(mockBuilder.update).toHaveBeenCalled();
        expect(result?.status).toBe('acknowledged');
      });
    });

    describe('resolveFinding()', () => {
      it('should update finding status to resolved', async () => {
        const resolvedFinding = { ...mockFinding, status: 'resolved', resolved_at: '2024-01-15T12:00:00Z' };
        const mockBuilder = createMockQueryBuilder(resolvedFinding);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.resolveFinding(testOrgId, mockFinding.id, testUserId, 'Issue resolved');

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_findings');
        expect(result?.status).toBe('resolved');
      });
    });

    describe('dismissFinding()', () => {
      it('should update finding status to dismissed', async () => {
        const dismissedFinding = { ...mockFinding, status: 'dismissed', dismissed_at: '2024-01-15T12:00:00Z' };
        const mockBuilder = createMockQueryBuilder(dismissedFinding);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.dismissFinding(testOrgId, mockFinding.id, testUserId, 'False positive');

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_findings');
        expect(result?.status).toBe('dismissed');
      });
    });

    describe('escalateFinding()', () => {
      it('should update finding status to escalated', async () => {
        const escalatedFinding = { ...mockFinding, status: 'escalated', assigned_to: 'manager-uuid' };
        const mockBuilder = createMockQueryBuilder(escalatedFinding);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.escalateFinding(testOrgId, mockFinding.id, 'manager-uuid', testUserId);

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_findings');
        expect(result?.status).toBe('escalated');
      });
    });
  });

  describe('Risk Score Management', () => {
    const mockRiskScore = {
      id: 'risk-uuid-1',
      org_id: testOrgId,
      entity_type: 'brand',
      entity_id: 'brand-1',
      entity_name: 'Test Brand',
      overall_score: 65,
      risk_level: 'high',
      content_risk: 60,
      reputation_risk: 70,
      crisis_risk: 65,
      legal_risk: 40,
      relationship_risk: 50,
      competitive_risk: 55,
      previous_score: 55,
      score_trend: 'worsening',
      trend_period_days: 30,
      breakdown: {},
      contributing_factors: [{ source: 'media', factor: 'negative coverage', contribution: 15 }],
      active_findings_count: 3,
      linked_finding_ids: ['finding-1', 'finding-2', 'finding-3'],
      computed_at: '2024-01-15T10:00:00Z',
      computation_method: 'weighted_average',
      confidence_score: 0.85,
      valid_until: '2024-01-16T10:00:00Z',
      is_stale: false,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    describe('upsertRiskScore()', () => {
      it('should upsert a risk score', async () => {
        const mockBuilder = createMockQueryBuilder(mockRiskScore);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.upsertRiskScore(testOrgId, {
          entityType: 'brand',
          entityId: 'brand-1',
          entityName: 'Test Brand',
          overallScore: 65,
          riskLevel: 'high',
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_risk_scores');
        expect(result).not.toBeNull();
        expect(result?.overallScore).toBe(65);
      });
    });

    describe('listRiskScores()', () => {
      it('should return list of risk scores', async () => {
        const mockBuilder = createMockQueryBuilder([mockRiskScore], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.listRiskScores(testOrgId, {});

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_risk_scores');
        expect(result.riskScores).toHaveLength(1);
      });

      it('should filter by entityType', async () => {
        const mockBuilder = createMockQueryBuilder([mockRiskScore], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.listRiskScores(testOrgId, { entityType: 'brand' });

        expect(mockBuilder.eq).toHaveBeenCalled();
      });

      it('should filter by riskLevel', async () => {
        const mockBuilder = createMockQueryBuilder([mockRiskScore], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.listRiskScores(testOrgId, { riskLevel: ['high', 'critical'] });

        expect(mockBuilder.in).toHaveBeenCalled();
      });
    });
  });

  describe('Dashboard & Analytics', () => {
    describe('getDashboardSummary()', () => {
      it('should return dashboard summary', async () => {
        // Mock policy counts
        const policyBuilder = createMockQueryBuilder(
          [{ category: 'crisis', severity: 'high', is_active: true }],
          null,
          5
        );
        // Mock rule counts
        const ruleBuilder = createMockQueryBuilder(
          [{ rule_type: 'threshold', target_system: 'media_monitoring', is_active: true }],
          null,
          10
        );
        // Mock finding counts
        const findingBuilder = createMockQueryBuilder(
          [{ status: 'open', severity: 'high', detected_at: '2024-01-15T10:00:00Z' }],
          null,
          3
        );
        // Mock risk score counts
        const riskBuilder = createMockQueryBuilder(
          [{ risk_level: 'high', overall_score: 70 }],
          null,
          2
        );

        mockSupabase.from
          .mockReturnValueOnce(policyBuilder)
          .mockReturnValueOnce(ruleBuilder)
          .mockReturnValueOnce(findingBuilder)
          .mockReturnValueOnce(riskBuilder);

        const result = await governanceService.getDashboardSummary(testOrgId);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('totalPolicies');
        expect(result).toHaveProperty('totalRules');
        expect(result).toHaveProperty('totalFindings');
      });
    });

    describe('getComplianceMetrics()', () => {
      it('should return compliance metrics for last 30 days', async () => {
        const mockBuilder = createMockQueryBuilder([]);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.getComplianceMetrics(testOrgId, 30);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('complianceScore');
        expect(result).toHaveProperty('resolutionRate');
        expect(result).toHaveProperty('meanTimeToResolution');
      });
    });

    describe('getRiskHeatmap()', () => {
      it('should return risk heatmap data', async () => {
        const mockBuilder = createMockQueryBuilder([
          {
            entity_type: 'brand',
            content_risk: 60,
            reputation_risk: 70,
            crisis_risk: 50,
          },
        ]);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.getRiskHeatmap(testOrgId);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('cells');
        expect(result).toHaveProperty('entityTypes');
        expect(result).toHaveProperty('riskDimensions');
      });
    });
  });

  describe('Rule Evaluation', () => {
    const mockContext = {
      sourceSystem: 'media_monitoring' as const,
      eventType: 'mention.created',
      eventId: 'event-123',
      eventData: {
        sentiment_score: -0.8,
        outlet: 'Test Outlet',
        reach: 50000,
      },
      timestamp: '2024-01-15T10:00:00Z',
    };

    describe('evaluateRules()', () => {
      it('should evaluate rules and create findings for triggered rules', async () => {
        const mockRule = {
          id: 'rule-uuid-1',
          org_id: testOrgId,
          policy_id: 'policy-uuid-1',
          rule_type: 'threshold',
          target_system: 'media_monitoring',
          condition: { field: 'sentiment_score', operator: 'lt', value: -0.5 },
          action: { createFinding: true },
          priority: 80,
          is_active: true,
          evaluation_mode: 'on_event',
          cooldown_minutes: 60,
        };

        // Mock rule listing
        const ruleBuilder = createMockQueryBuilder([mockRule], null, 1);
        // Mock finding creation
        const findingBuilder = createMockQueryBuilder({ id: 'finding-new' });

        mockSupabase.from
          .mockReturnValueOnce(ruleBuilder)
          .mockReturnValueOnce(findingBuilder);

        const result = await governanceService.evaluateRules(testOrgId, mockContext);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('results');
        expect(result).toHaveProperty('totalRulesEvaluated');
      });

      it('should filter rules by targetSystem', async () => {
        const mockRule = {
          id: 'rule-uuid-1',
          org_id: testOrgId,
          policy_id: 'policy-uuid-1',
          rule_type: 'threshold',
          target_system: 'media_monitoring',
          condition: {},
          action: {},
          priority: 50,
          is_active: true,
          evaluation_mode: 'on_event',
          cooldown_minutes: 60,
        };

        const mockBuilder = createMockQueryBuilder([mockRule], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        await governanceService.evaluateRules(testOrgId, mockContext);

        expect(mockBuilder.eq).toHaveBeenCalledWith('target_system', 'media_monitoring');
      });
    });
  });

  describe('Insight Generation', () => {
    describe('generateInsight()', () => {
      it('should generate an insight based on findings', async () => {
        const mockInsight = {
          id: 'insight-uuid-1',
          org_id: testOrgId,
          time_window_start: '2024-01-01T00:00:00Z',
          time_window_end: '2024-01-15T23:59:59Z',
          insight_type: 'governance_summary',
          scope: 'global',
          title: 'Governance Summary - January 2024',
          summary: 'Overall compliance health is good with 3 open findings.',
          recommendations: [],
          action_items: [],
          top_risks: [],
          risk_distribution: {},
          metrics_snapshot: {},
          trend_analysis: {},
          linked_findings: [],
          findings_count: 10,
          resolved_findings_count: 7,
          generated_by: 'rule_based',
          created_at: '2024-01-15T12:00:00Z',
          updated_at: '2024-01-15T12:00:00Z',
        };

        const mockBuilder = createMockQueryBuilder(mockInsight);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.generateInsight(testOrgId, {
          timeWindowStart: '2024-01-01T00:00:00Z',
          timeWindowEnd: '2024-01-15T23:59:59Z',
        }, testUserId);

        expect(result).not.toBeNull();
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('summary');
      });
    });

    describe('listInsights()', () => {
      it('should return list of insights', async () => {
        const mockInsight = {
          id: 'insight-uuid-1',
          org_id: testOrgId,
          title: 'Test Insight',
          summary: 'Test summary',
        };

        const mockBuilder = createMockQueryBuilder([mockInsight], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.listInsights(testOrgId, {});

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_audit_insights');
        expect(result.insights).toHaveLength(1);
      });
    });
  });

  describe('Policy Versioning', () => {
    describe('getPolicyVersions()', () => {
      it('should return list of policy versions', async () => {
        const mockVersion = {
          id: 'version-uuid-1',
          org_id: testOrgId,
          policy_id: 'policy-uuid-1',
          version_number: 1,
          policy_snapshot: {},
          change_summary: 'Initial version',
          changed_fields: ['name', 'description'],
          created_by: testUserId,
          created_at: '2024-01-15T10:00:00Z',
        };

        const mockBuilder = createMockQueryBuilder([mockVersion], null, 1);
        mockSupabase.from.mockReturnValue(mockBuilder);

        const result = await governanceService.getPolicyVersions(testOrgId, 'policy-uuid-1');

        expect(mockSupabase.from).toHaveBeenCalledWith('governance_policy_versions');
        expect(result.versions).toHaveLength(1);
        expect(result.versions[0].versionNumber).toBe(1);
      });
    });
  });
});

describe('Governance Service Factory', () => {
  it('should create service with required dependencies', () => {
    const service = createGovernanceService({
      supabase: mockSupabase as any,
    });

    expect(service).not.toBeNull();
    expect(typeof service.createPolicy).toBe('function');
    expect(typeof service.listPolicies).toBe('function');
    expect(typeof service.evaluateRules).toBe('function');
    expect(typeof service.getDashboardSummary).toBe('function');
  });

  it('should create service with optional debugMode', () => {
    const service = createGovernanceService({
      supabase: mockSupabase as any,
      debugMode: true,
    });

    expect(service).not.toBeNull();
  });
});
