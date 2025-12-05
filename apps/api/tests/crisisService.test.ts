/**
 * Crisis Response Service Tests (Sprint S55)
 * Comprehensive tests for crisis detection, incident management,
 * escalation rules, action recommendations, and crisis briefings
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CrisisService } from '../src/services/crisisService';
import type {
  CreateIncidentRequest,
  UpdateIncidentRequest,
  CreateActionRequest,
  CreateEscalationRuleRequest,
  GenerateCrisisBriefRequest,
  CrisisSeverity,
  CrisisTrajectory,
  CrisisPropagationLevel,
  IncidentStatus,
  CrisisActionType,
} from '@pravado/types';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),
  rpc: vi.fn(),
  or: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  contains: vi.fn().mockReturnThis(),
} as unknown as SupabaseClient;

// Mock LLM Router
vi.mock('@pravado/utils', async () => {
  const actual = await vi.importActual('@pravado/utils');
  return {
    ...actual,
    LlmRouter: {
      isAvailable: () => true,
      chat: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          recommendations: [
            {
              actionType: 'statement_release',
              title: 'Issue Public Statement',
              description: 'Release a statement addressing concerns',
              priority: 1,
              urgency: 'immediate',
              rationale: 'Quick response is crucial',
              expectedOutcome: 'Reduce negative sentiment',
            },
          ],
          summary: 'AI-generated crisis summary',
          riskAssessment: {
            overallRisk: 0.75,
            reputationRisk: 0.8,
            financialRisk: 0.5,
            operationalRisk: 0.3,
            legalRisk: 0.2,
            factors: [],
            mitigationStatus: 'partial',
          },
        }),
        usage: { total_tokens: 500 },
      }),
    },
  };
});

describe('CrisisService', () => {
  let service: CrisisService;
  const testOrgId = 'org-123';
  const testUserId = 'user-456';

  beforeEach(() => {
    service = new CrisisService(mockSupabase);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // 1. Incident Creation Tests
  // ========================================
  describe('createIncident', () => {
    it('should create an incident with all fields', async () => {
      const input: CreateIncidentRequest = {
        title: 'Product Recall Crisis',
        description: 'Critical product defect reported in multiple regions',
        severity: 'critical' as CrisisSeverity,
        crisisType: 'product_issue',
        affectedProducts: ['Widget Pro', 'Widget Plus'],
        affectedRegions: ['North America', 'Europe'],
        affectedStakeholders: ['customers', 'investors'],
        keywords: ['recall', 'defect', 'safety'],
        topics: ['product-safety', 'consumer-protection'],
      };

      const mockIncident = {
        id: 'incident-1',
        orgId: testOrgId,
        ...input,
        status: 'active',
        trajectory: 'unknown',
        propagationLevel: 'contained',
        escalationLevel: 0,
        isEscalated: false,
        mentionCount: 0,
        estimatedReach: 0,
        firstDetectedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockIncident],
        error: null,
      } as any);

      const result = await service.createIncident(testOrgId, input, testUserId);

      expect(mockSupabase.from).toHaveBeenCalledWith('crisis_incidents');
      expect(result.title).toBe('Product Recall Crisis');
      expect(result.severity).toBe('critical');
      expect(result.status).toBe('active');
    });

    it('should create a minimal incident with required fields only', async () => {
      const input: CreateIncidentRequest = {
        title: 'Minor Social Media Incident',
      };

      const mockIncident = {
        id: 'incident-2',
        orgId: testOrgId,
        title: input.title,
        severity: 'medium',
        status: 'active',
        trajectory: 'unknown',
        propagationLevel: 'contained',
        createdAt: new Date(),
      };

      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockIncident],
        error: null,
      } as any);

      const result = await service.createIncident(testOrgId, input, testUserId);

      expect(result.title).toBe('Minor Social Media Incident');
      expect(result.severity).toBe('medium');
    });

    it('should throw error if title is missing', async () => {
      const input = { description: 'No title' } as any;

      await expect(service.createIncident(testOrgId, input, testUserId)).rejects.toThrow();
    });

    it('should generate incident code on creation', async () => {
      const input: CreateIncidentRequest = { title: 'Test Incident' };

      const mockIncident = {
        id: 'incident-3',
        incidentCode: 'CRI-20240115-001',
        ...input,
      };

      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockIncident],
        error: null,
      } as any);

      const result = await service.createIncident(testOrgId, input, testUserId);

      expect(result.incidentCode).toBeDefined();
    });
  });

  // ========================================
  // 2. Incident Update Tests
  // ========================================
  describe('updateIncident', () => {
    it('should update incident fields', async () => {
      const updates: UpdateIncidentRequest = {
        title: 'Updated Title',
        severity: 'high' as CrisisSeverity,
        trajectory: 'worsening' as CrisisTrajectory,
        propagationLevel: 'spreading' as CrisisPropagationLevel,
      };

      const mockUpdated = {
        id: 'incident-1',
        ...updates,
        status: 'active',
        updatedAt: new Date(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      } as any);

      const result = await service.updateIncident(testOrgId, 'incident-1', updates, testUserId);

      expect(mockSupabase.from).toHaveBeenCalledWith('crisis_incidents');
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(result.severity).toBe('high');
      expect(result.trajectory).toBe('worsening');
    });

    it('should update status to contained', async () => {
      const updates: UpdateIncidentRequest = {
        status: 'contained' as IncidentStatus,
      };

      const mockUpdated = {
        id: 'incident-1',
        status: 'contained',
        containedAt: new Date(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      } as any);

      const result = await service.updateIncident(testOrgId, 'incident-1', updates, testUserId);

      expect(result.status).toBe('contained');
    });
  });

  // ========================================
  // 3. Incident Escalation Tests
  // ========================================
  describe('escalateIncident', () => {
    it('should escalate incident to next level', async () => {
      const mockEscalated = {
        id: 'incident-1',
        isEscalated: true,
        escalationLevel: 2,
        escalatedAt: new Date(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockEscalated,
        error: null,
      } as any);

      const result = await service.escalateIncident(testOrgId, 'incident-1', 2, testUserId);

      expect(result.isEscalated).toBe(true);
      expect(result.escalationLevel).toBe(2);
    });

    it('should not allow escalation below current level', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: { id: 'incident-1', escalationLevel: 3 },
        error: null,
      } as any);

      await expect(
        service.escalateIncident(testOrgId, 'incident-1', 1, testUserId)
      ).rejects.toThrow();
    });
  });

  // ========================================
  // 4. Incident Closure Tests
  // ========================================
  describe('closeIncident', () => {
    it('should close incident with resolution notes', async () => {
      const mockClosed = {
        id: 'incident-1',
        status: 'closed',
        resolvedAt: new Date(),
        closedAt: new Date(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockClosed,
        error: null,
      } as any);

      const result = await service.closeIncident(
        testOrgId,
        'incident-1',
        'Successfully resolved through public statement',
        testUserId
      );

      expect(result.status).toBe('closed');
    });

    it('should not close already closed incident', async () => {
      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: { id: 'incident-1', status: 'closed' },
        error: null,
      } as any);

      await expect(
        service.closeIncident(testOrgId, 'incident-1', 'Notes', testUserId)
      ).rejects.toThrow();
    });
  });

  // ========================================
  // 5. Incident Listing & Filtering Tests
  // ========================================
  describe('listIncidents', () => {
    it('should list all incidents for org', async () => {
      const mockIncidents = [
        { id: 'i1', title: 'Incident 1', status: 'active' },
        { id: 'i2', title: 'Incident 2', status: 'contained' },
      ];

      vi.mocked(mockSupabase.range).mockResolvedValueOnce({
        data: mockIncidents,
        error: null,
        count: 2,
      } as any);

      const result = await service.listIncidents(testOrgId, {});

      expect(result.incidents).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should filter by status', async () => {
      vi.mocked(mockSupabase.range).mockResolvedValueOnce({
        data: [{ id: 'i1', status: 'active' }],
        error: null,
        count: 1,
      } as any);

      const result = await service.listIncidents(testOrgId, {
        status: ['active' as IncidentStatus],
      });

      expect(mockSupabase.in).toHaveBeenCalledWith('status', ['active']);
    });

    it('should filter by severity', async () => {
      vi.mocked(mockSupabase.range).mockResolvedValueOnce({
        data: [{ id: 'i1', severity: 'critical' }],
        error: null,
        count: 1,
      } as any);

      const result = await service.listIncidents(testOrgId, {
        severity: ['critical' as CrisisSeverity, 'severe' as CrisisSeverity],
      });

      expect(mockSupabase.in).toHaveBeenCalledWith('severity', ['critical', 'severe']);
    });

    it('should filter escalated incidents', async () => {
      vi.mocked(mockSupabase.range).mockResolvedValueOnce({
        data: [{ id: 'i1', isEscalated: true }],
        error: null,
        count: 1,
      } as any);

      await service.listIncidents(testOrgId, { isEscalated: true });

      expect(mockSupabase.eq).toHaveBeenCalledWith('is_escalated', true);
    });

    it('should search by query', async () => {
      vi.mocked(mockSupabase.range).mockResolvedValueOnce({
        data: [{ id: 'i1', title: 'Product Recall' }],
        error: null,
        count: 1,
      } as any);

      await service.listIncidents(testOrgId, { searchQuery: 'recall' });

      expect(mockSupabase.ilike).toHaveBeenCalled();
    });
  });

  // ========================================
  // 6. Signal Tests
  // ========================================
  describe('signals', () => {
    it('should list active signals', async () => {
      const mockSignals = [
        { id: 's1', title: 'Signal 1', isActive: true },
        { id: 's2', title: 'Signal 2', isActive: true },
      ];

      vi.mocked(mockSupabase.range).mockResolvedValueOnce({
        data: mockSignals,
        error: null,
        count: 2,
      } as any);

      const result = await service.listSignals(testOrgId, { isActive: true });

      expect(result.signals).toHaveLength(2);
    });

    it('should acknowledge signal', async () => {
      const mockAcknowledged = {
        id: 's1',
        acknowledgedAt: new Date(),
        acknowledgedBy: testUserId,
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockAcknowledged,
        error: null,
      } as any);

      const result = await service.acknowledgeSignal(
        testOrgId,
        's1',
        testUserId,
        undefined,
        'False alarm'
      );

      expect(result.acknowledgedAt).toBeDefined();
    });
  });

  // ========================================
  // 7. Action Tests
  // ========================================
  describe('actions', () => {
    it('should create action', async () => {
      const input: CreateActionRequest = {
        incidentId: 'incident-1',
        title: 'Issue Statement',
        actionType: 'statement_release' as CrisisActionType,
        description: 'Prepare and release public statement',
        priorityScore: 90,
        urgency: 'immediate',
      };

      const mockAction = {
        id: 'action-1',
        ...input,
        status: 'recommended',
        isAiGenerated: false,
        createdAt: new Date(),
      };

      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockAction],
        error: null,
      } as any);

      const result = await service.createAction(testOrgId, input, testUserId);

      expect(result.title).toBe('Issue Statement');
      expect(result.status).toBe('recommended');
    });

    it('should update action status', async () => {
      const mockUpdated = {
        id: 'action-1',
        status: 'in_progress',
        startedAt: new Date(),
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      } as any);

      const result = await service.updateAction(testOrgId, 'action-1', {
        status: 'in_progress',
      });

      expect(result.status).toBe('in_progress');
    });

    it('should list actions by incident', async () => {
      const mockActions = [
        { id: 'a1', incidentId: 'i1', status: 'recommended' },
        { id: 'a2', incidentId: 'i1', status: 'approved' },
      ];

      vi.mocked(mockSupabase.range).mockResolvedValueOnce({
        data: mockActions,
        error: null,
        count: 2,
      } as any);

      const result = await service.listActions(testOrgId, { incidentId: 'i1' });

      expect(result.actions).toHaveLength(2);
    });

    it('should complete action with outcome', async () => {
      const mockCompleted = {
        id: 'action-1',
        status: 'completed',
        completedAt: new Date(),
        outcome: 'success',
        completionNotes: 'Statement well received',
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockCompleted,
        error: null,
      } as any);

      const result = await service.updateAction(testOrgId, 'action-1', {
        status: 'completed',
        outcome: 'success',
        completionNotes: 'Statement well received',
      });

      expect(result.status).toBe('completed');
      expect(result.outcome).toBe('success');
    });
  });

  // ========================================
  // 8. Escalation Rule Tests
  // ========================================
  describe('escalationRules', () => {
    it('should create escalation rule', async () => {
      const input: CreateEscalationRuleRequest = {
        name: 'Critical Severity Auto-Escalate',
        description: 'Automatically escalate critical severity incidents',
        ruleType: 'threshold',
        conditions: {
          severityGte: 'critical' as CrisisSeverity,
        },
        escalationActions: [
          { type: 'notify', channel: 'slack', recipients: ['#crisis-team'] },
        ],
        escalationLevel: 1,
        cooldownMinutes: 30,
      };

      const mockRule = {
        id: 'rule-1',
        ...input,
        isActive: true,
        isSystem: false,
        triggerCount: 0,
        createdAt: new Date(),
      };

      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockRule],
        error: null,
      } as any);

      const result = await service.createEscalationRule(testOrgId, input, testUserId);

      expect(result.name).toBe('Critical Severity Auto-Escalate');
      expect(result.isActive).toBe(true);
    });

    it('should toggle rule active status', async () => {
      const mockUpdated = {
        id: 'rule-1',
        isActive: false,
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockUpdated,
        error: null,
      } as any);

      const result = await service.updateEscalationRule(testOrgId, 'rule-1', {
        isActive: false,
      });

      expect(result.isActive).toBe(false);
    });

    it('should list active rules', async () => {
      const mockRules = [
        { id: 'r1', name: 'Rule 1', isActive: true },
        { id: 'r2', name: 'Rule 2', isActive: true },
      ];

      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: mockRules,
        error: null,
        count: 2,
      } as any);

      const result = await service.listEscalationRules(testOrgId, true);

      expect(result.rules).toHaveLength(2);
    });
  });

  // ========================================
  // 9. Crisis Brief Tests
  // ========================================
  describe('crisisBriefs', () => {
    it('should generate crisis brief', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'Test Incident',
        severity: 'high',
        status: 'active',
        trajectory: 'worsening',
        mentionCount: 150,
        estimatedReach: 500000,
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockIncident,
        error: null,
      } as any);

      const mockBrief = {
        id: 'brief-1',
        incidentId: 'incident-1',
        title: 'Crisis Brief: Test Incident',
        format: 'executive_summary',
        version: 1,
        status: 'generated',
        isCurrent: true,
        totalTokensUsed: 500,
        generatedAt: new Date(),
      };

      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [mockBrief],
        error: null,
      } as any);

      const result = await service.generateCrisisBrief(testOrgId, 'incident-1', {});

      expect(result.brief.format).toBe('executive_summary');
      expect(result.brief.isCurrent).toBe(true);
    });

    it('should get current brief for incident', async () => {
      const mockBrief = {
        id: 'brief-1',
        incidentId: 'incident-1',
        isCurrent: true,
        sections: [],
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockBrief,
        error: null,
      } as any);

      const result = await service.getCurrentBrief(testOrgId, 'incident-1');

      expect(result?.isCurrent).toBe(true);
    });

    it('should regenerate brief section', async () => {
      const mockSection = {
        id: 'section-1',
        briefId: 'brief-1',
        sectionType: 'situation_overview',
        content: 'Regenerated content',
        isGenerated: true,
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockSection,
        error: null,
      } as any);

      const result = await service.regenerateBriefSection(
        testOrgId,
        'brief-1',
        'section-1',
        {}
      );

      expect(result.section.isGenerated).toBe(true);
    });
  });

  // ========================================
  // 10. Dashboard Stats Tests
  // ========================================
  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const mockStats = {
        activeIncidents: 5,
        activeSignals: 12,
        pendingActions: 8,
        escalatedCount: 2,
        bySeverity: {
          severe: 1,
          critical: 2,
          high: 2,
          medium: 0,
          low: 0,
        },
        byTrajectory: {
          worsening: 2,
          stable: 2,
          improving: 1,
        },
        recentActivity: [],
        sentimentTrend: [],
      };

      vi.mocked(mockSupabase.rpc).mockResolvedValueOnce({
        data: mockStats,
        error: null,
      } as any);

      const result = await service.getDashboardStats(testOrgId);

      expect(result.activeIncidents).toBe(5);
      expect(result.escalatedCount).toBe(2);
    });
  });

  // ========================================
  // 11. Detection Engine Tests
  // ========================================
  describe('runDetection', () => {
    it('should run detection and return results', async () => {
      const mockEvents = [
        { id: 'e1', title: 'Negative Article', sentimentScore: -0.8 },
        { id: 'e2', title: 'Social Media Spike', mentionVelocity: 100 },
      ];

      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: mockEvents,
        error: null,
      } as any);

      vi.mocked(mockSupabase.insert).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      const result = await service.runDetection(testOrgId, {
        timeWindowMinutes: 60,
      });

      expect(result.eventsProcessed).toBeGreaterThanOrEqual(0);
    });

    it('should respect source system filters', async () => {
      vi.mocked(mockSupabase.order).mockResolvedValueOnce({
        data: [],
        error: null,
      } as any);

      await service.runDetection(testOrgId, {
        sourceSystems: ['media_monitoring', 'media_alerts'],
      });

      expect(mockSupabase.in).toHaveBeenCalled();
    });
  });

  // ========================================
  // 12. AI Recommendation Generation Tests
  // ========================================
  describe('generateActionRecommendations', () => {
    it('should generate AI recommendations for incident', async () => {
      const mockIncident = {
        id: 'incident-1',
        title: 'PR Crisis',
        severity: 'high',
        description: 'Negative press coverage',
        trajectory: 'worsening',
      };

      vi.mocked(mockSupabase.single).mockResolvedValueOnce({
        data: mockIncident,
        error: null,
      } as any);

      vi.mocked(mockSupabase.insert).mockResolvedValueOnce({
        data: [
          {
            id: 'action-1',
            title: 'Issue Public Statement',
            actionType: 'statement_release',
            isAiGenerated: true,
          },
        ],
        error: null,
      } as any);

      const result = await service.generateActionRecommendations(
        testOrgId,
        'incident-1',
        testUserId
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].isAiGenerated).toBe(true);
    });
  });
});
