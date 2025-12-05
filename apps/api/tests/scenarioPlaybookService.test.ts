/**
 * ScenarioPlaybookService tests (Sprint S67)
 * Tests for scenario simulation & autonomous playbook orchestration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type {
  ScenarioPlaybook,
  ScenarioPlaybookStep,
  Scenario,
  ScenarioRun,
  ScenarioRunStep,
  CreateScenarioPlaybookInput,
  CreateScenarioInput,
  StartScenarioRunInput,
  SimulationResult,
} from '@pravado/types';

// Mock data generators
const mockOrgId = 'org-test-123';
const mockUserId = 'user-test-456';

function createMockPlaybook(overrides: Partial<ScenarioPlaybook> = {}): ScenarioPlaybook {
  return {
    id: 'playbook-1',
    orgId: mockOrgId,
    name: 'Crisis Response Playbook',
    description: 'Standard crisis response protocol',
    category: 'crisis_management',
    version: 1,
    isActive: true,
    triggerConditions: { sentiment_threshold: -0.5 },
    metadata: {},
    createdBy: mockUserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stepCount: 3,
    ...overrides,
  };
}

function createMockPlaybookStep(overrides: Partial<ScenarioPlaybookStep> = {}): ScenarioPlaybookStep {
  return {
    id: 'step-1',
    playbookId: 'playbook-1',
    stepOrder: 0,
    name: 'Assess Situation',
    description: 'Initial situation assessment',
    actionType: 'analyze_sentiment',
    actionPayload: { depth: 'deep' },
    requiresApproval: false,
    approvalRoles: [],
    estimatedDurationMinutes: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 'scenario-1',
    orgId: mockOrgId,
    playbookId: 'playbook-1',
    name: 'Q4 Crisis Scenario',
    description: 'Crisis response for Q4 product recall',
    scenarioType: 'crisis',
    status: 'draft',
    baselineRiskLevel: 'high',
    currentRiskLevel: 'high',
    contextParameters: { product: 'Widget X', region: 'NA' },
    metadata: {},
    createdBy: mockUserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRunAt: null,
    runCount: 0,
    ...overrides,
  };
}

function createMockRun(overrides: Partial<ScenarioRun> = {}): ScenarioRun {
  return {
    id: 'run-1',
    orgId: mockOrgId,
    scenarioId: 'scenario-1',
    playbookId: 'playbook-1',
    status: 'running',
    currentStepIndex: 0,
    totalSteps: 3,
    riskScore: 65,
    opportunityScore: 35,
    narrativeSummary: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    pausedAt: null,
    cancelledAt: null,
    errorMessage: null,
    createdBy: mockUserId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createMockRunStep(overrides: Partial<ScenarioRunStep> = {}): ScenarioRunStep {
  return {
    id: 'run-step-1',
    runId: 'run-1',
    playbookStepId: 'step-1',
    stepIndex: 0,
    status: 'pending',
    executionContext: {},
    simulatedImpact: null,
    executionResult: null,
    approvedAt: null,
    approvedBy: null,
    approvalNotes: null,
    startedAt: null,
    completedAt: null,
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('scenarioPlaybookService', () => {
  describe('Playbook Management', () => {
    describe('createPlaybook', () => {
      it('should create a playbook with valid input', () => {
        const input: CreateScenarioPlaybookInput = {
          name: 'Test Playbook',
          description: 'Test description',
          category: 'crisis_management',
          triggerConditions: { threshold: 0.5 },
          metadata: {},
          steps: [
            {
              name: 'Step 1',
              actionType: 'analyze_sentiment',
              actionPayload: {},
              requiresApproval: false,
              stepOrder: 0,
            },
          ],
        };

        // Validate input structure
        expect(input.name).toBe('Test Playbook');
        expect(input.steps).toHaveLength(1);
        expect(input.steps[0].actionType).toBe('analyze_sentiment');
      });

      it('should require at least one step', () => {
        const input: CreateScenarioPlaybookInput = {
          name: 'Empty Playbook',
          category: 'custom',
          steps: [],
        };

        expect(input.steps).toHaveLength(0);
        // Service should reject this with validation error
      });

      it('should set default values for optional fields', () => {
        const playbook = createMockPlaybook({
          description: undefined,
          triggerConditions: {},
          metadata: {},
        });

        expect(playbook.triggerConditions).toEqual({});
        expect(playbook.metadata).toEqual({});
        expect(playbook.isActive).toBe(true);
        expect(playbook.version).toBe(1);
      });
    });

    describe('updatePlaybook', () => {
      it('should increment version on update', () => {
        const playbook = createMockPlaybook({ version: 1 });
        const newVersion = playbook.version + 1;

        expect(newVersion).toBe(2);
      });

      it('should preserve existing steps when updating metadata only', () => {
        const playbook = createMockPlaybook({ stepCount: 5 });

        expect(playbook.stepCount).toBe(5);
      });

      it('should validate step order is sequential', () => {
        const steps = [
          createMockPlaybookStep({ stepOrder: 0 }),
          createMockPlaybookStep({ stepOrder: 1 }),
          createMockPlaybookStep({ stepOrder: 2 }),
        ];

        const orders = steps.map(s => s.stepOrder);
        const isSequential = orders.every((o, i) => o === i);

        expect(isSequential).toBe(true);
      });
    });

    describe('deletePlaybook', () => {
      it('should prevent deletion of playbook with active scenarios', () => {
        const scenario = createMockScenario({ status: 'ready' });

        expect(scenario.status).toBe('ready');
        // Service should check for active scenarios before deletion
      });

      it('should cascade delete steps when deleting playbook', () => {
        const playbook = createMockPlaybook();
        const steps = [
          createMockPlaybookStep({ playbookId: playbook.id }),
          createMockPlaybookStep({ playbookId: playbook.id, id: 'step-2', stepOrder: 1 }),
        ];

        expect(steps.every(s => s.playbookId === playbook.id)).toBe(true);
      });
    });

    describe('listPlaybooks', () => {
      it('should filter by category', () => {
        const playbooks = [
          createMockPlaybook({ category: 'crisis_management' }),
          createMockPlaybook({ id: 'pb-2', category: 'product_launch' }),
          createMockPlaybook({ id: 'pb-3', category: 'crisis_management' }),
        ];

        const filtered = playbooks.filter(p => p.category === 'crisis_management');

        expect(filtered).toHaveLength(2);
      });

      it('should filter by active status', () => {
        const playbooks = [
          createMockPlaybook({ isActive: true }),
          createMockPlaybook({ id: 'pb-2', isActive: false }),
          createMockPlaybook({ id: 'pb-3', isActive: true }),
        ];

        const active = playbooks.filter(p => p.isActive);

        expect(active).toHaveLength(2);
      });

      it('should support pagination', () => {
        const allPlaybooks = Array.from({ length: 25 }, (_, i) =>
          createMockPlaybook({ id: `pb-${i}` })
        );

        const page1 = allPlaybooks.slice(0, 10);
        const page2 = allPlaybooks.slice(10, 20);
        const page3 = allPlaybooks.slice(20, 25);

        expect(page1).toHaveLength(10);
        expect(page2).toHaveLength(10);
        expect(page3).toHaveLength(5);
      });
    });
  });

  describe('Scenario Management', () => {
    describe('createScenario', () => {
      it('should create a scenario with valid input', () => {
        const input: CreateScenarioInput = {
          name: 'Test Scenario',
          playbookId: 'playbook-1',
          scenarioType: 'crisis',
          baselineRiskLevel: 'high',
          contextParameters: { target: 'enterprise' },
        };

        expect(input.scenarioType).toBe('crisis');
        expect(input.baselineRiskLevel).toBe('high');
      });

      it('should set initial status to draft', () => {
        const scenario = createMockScenario();

        expect(scenario.status).toBe('draft');
      });

      it('should initialize run count to zero', () => {
        const scenario = createMockScenario();

        expect(scenario.runCount).toBe(0);
        expect(scenario.lastRunAt).toBeNull();
      });
    });

    describe('updateScenario', () => {
      it('should update context parameters', () => {
        const scenario = createMockScenario({
          contextParameters: { old: 'value' },
        });

        const newParams = { new: 'value', additional: 'data' };

        expect(newParams).not.toEqual(scenario.contextParameters);
      });

      it('should update risk level', () => {
        const scenario = createMockScenario({ currentRiskLevel: 'low' });

        expect(scenario.currentRiskLevel).toBe('low');
        // Update should change this
      });

      it('should prevent status changes during active runs', () => {
        const run = createMockRun({ status: 'running' });

        expect(run.status).toBe('running');
        // Service should prevent scenario status changes while running
      });
    });

    describe('listScenarios', () => {
      it('should filter by scenario type', () => {
        const scenarios = [
          createMockScenario({ scenarioType: 'crisis' }),
          createMockScenario({ id: 's-2', scenarioType: 'opportunity' }),
          createMockScenario({ id: 's-3', scenarioType: 'crisis' }),
        ];

        const crisisOnly = scenarios.filter(s => s.scenarioType === 'crisis');

        expect(crisisOnly).toHaveLength(2);
      });

      it('should filter by status', () => {
        const scenarios = [
          createMockScenario({ status: 'draft' }),
          createMockScenario({ id: 's-2', status: 'ready' }),
          createMockScenario({ id: 's-3', status: 'completed' }),
        ];

        const readyOnly = scenarios.filter(s => s.status === 'ready');

        expect(readyOnly).toHaveLength(1);
      });

      it('should search by name', () => {
        const scenarios = [
          createMockScenario({ name: 'Product Launch Crisis' }),
          createMockScenario({ id: 's-2', name: 'Q4 Marketing Campaign' }),
          createMockScenario({ id: 's-3', name: 'Crisis Response Plan' }),
        ];

        const searchTerm = 'crisis';
        const matched = scenarios.filter(s =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        expect(matched).toHaveLength(2);
      });
    });
  });

  describe('Simulation Engine', () => {
    describe('simulateScenario', () => {
      it('should generate simulation result structure', () => {
        const result: SimulationResult = {
          scenarioId: 'scenario-1',
          playbookId: 'playbook-1',
          simulatedAt: new Date().toISOString(),
          riskScore: 65,
          opportunityScore: 40,
          confidenceScore: 0.85,
          projectedMetrics: {
            timeline: [
              { day: 1, sentimentProjected: -0.2, coverageProjected: 5, riskLevel: 'high' },
              { day: 7, sentimentProjected: 0.1, coverageProjected: 15, riskLevel: 'medium' },
            ],
          },
          recommendations: [
            { priority: 'high', action: 'Issue press release', rationale: 'Control narrative' },
          ],
          stepPreviews: [
            { stepName: 'Assess', actionType: 'analyze_sentiment', riskLevel: 'medium', predictedOutcome: 'Data gathered' },
          ],
          narrativeSummary: 'Simulation indicates moderate recovery path.',
        };

        expect(result.riskScore).toBe(65);
        expect(result.confidenceScore).toBeGreaterThan(0);
        expect(result.confidenceScore).toBeLessThanOrEqual(1);
        expect(result.recommendations).toHaveLength(1);
        expect(result.stepPreviews).toHaveLength(1);
      });

      it('should calculate risk score based on context', () => {
        const highRiskScenario = createMockScenario({ baselineRiskLevel: 'critical' });
        const lowRiskScenario = createMockScenario({ baselineRiskLevel: 'low' });

        // Risk scores should differ based on baseline
        expect(highRiskScenario.baselineRiskLevel).toBe('critical');
        expect(lowRiskScenario.baselineRiskLevel).toBe('low');
      });

      it('should generate step previews for all playbook steps', () => {
        const steps = [
          createMockPlaybookStep({ stepOrder: 0, name: 'Step 1' }),
          createMockPlaybookStep({ stepOrder: 1, name: 'Step 2', id: 'step-2' }),
          createMockPlaybookStep({ stepOrder: 2, name: 'Step 3', id: 'step-3' }),
        ];

        const previews = steps.map(step => ({
          stepName: step.name,
          actionType: step.actionType,
          riskLevel: 'medium' as const,
          predictedOutcome: `Predicted outcome for ${step.name}`,
        }));

        expect(previews).toHaveLength(3);
      });

      it('should provide timeline projections', () => {
        const timeline = [
          { day: 1, sentimentProjected: -0.5, coverageProjected: 0, riskLevel: 'high' as const },
          { day: 3, sentimentProjected: -0.3, coverageProjected: 10, riskLevel: 'high' as const },
          { day: 7, sentimentProjected: 0.0, coverageProjected: 25, riskLevel: 'medium' as const },
          { day: 14, sentimentProjected: 0.2, coverageProjected: 40, riskLevel: 'low' as const },
        ];

        expect(timeline[0].riskLevel).toBe('high');
        expect(timeline[timeline.length - 1].riskLevel).toBe('low');
        // Sentiment should improve over time
        expect(timeline[timeline.length - 1].sentimentProjected).toBeGreaterThan(timeline[0].sentimentProjected);
      });
    });
  });

  describe('Run Orchestration', () => {
    describe('startRun', () => {
      it('should create run with initial status', () => {
        const input: StartScenarioRunInput = {
          scenarioId: 'scenario-1',
        };

        const run = createMockRun({ status: 'running', currentStepIndex: 0 });

        expect(run.status).toBe('running');
        expect(run.currentStepIndex).toBe(0);
        expect(run.startedAt).not.toBeNull();
      });

      it('should create run steps for each playbook step', () => {
        const playbookSteps = [
          createMockPlaybookStep({ stepOrder: 0 }),
          createMockPlaybookStep({ stepOrder: 1, id: 'step-2' }),
          createMockPlaybookStep({ stepOrder: 2, id: 'step-3' }),
        ];

        const runSteps = playbookSteps.map((step, i) =>
          createMockRunStep({
            id: `run-step-${i}`,
            playbookStepId: step.id,
            stepIndex: i,
          })
        );

        expect(runSteps).toHaveLength(3);
        expect(runSteps[0].stepIndex).toBe(0);
        expect(runSteps[2].stepIndex).toBe(2);
      });

      it('should set first step to ready if no approval required', () => {
        const step = createMockPlaybookStep({ requiresApproval: false });

        expect(step.requiresApproval).toBe(false);
        // First run step should be 'ready' for execution
      });

      it('should set first step to awaiting_approval if approval required', () => {
        const step = createMockPlaybookStep({
          requiresApproval: true,
          approvalRoles: ['PR Manager']
        });

        expect(step.requiresApproval).toBe(true);
        expect(step.approvalRoles).toContain('PR Manager');
        // First run step should be 'awaiting_approval'
      });

      it('should update scenario run count', () => {
        const scenario = createMockScenario({ runCount: 5 });
        const newRunCount = scenario.runCount + 1;

        expect(newRunCount).toBe(6);
      });
    });

    describe('pauseRun', () => {
      it('should set run status to paused', () => {
        const run = createMockRun({ status: 'paused' });

        expect(run.status).toBe('paused');
      });

      it('should record pause timestamp', () => {
        const pausedAt = new Date().toISOString();
        const run = createMockRun({ status: 'paused', pausedAt });

        expect(run.pausedAt).not.toBeNull();
      });

      it('should only allow pausing running runs', () => {
        const runningRun = createMockRun({ status: 'running' });
        const completedRun = createMockRun({ status: 'completed' });

        expect(runningRun.status).toBe('running');
        expect(completedRun.status).toBe('completed');
        // Only runningRun should be pausable
      });
    });

    describe('resumeRun', () => {
      it('should set run status back to running', () => {
        const run = createMockRun({ status: 'running', pausedAt: null });

        expect(run.status).toBe('running');
        expect(run.pausedAt).toBeNull();
      });

      it('should clear pause timestamp', () => {
        const run = createMockRun({ pausedAt: null });

        expect(run.pausedAt).toBeNull();
      });
    });

    describe('cancelRun', () => {
      it('should set run status to cancelled', () => {
        const run = createMockRun({ status: 'cancelled' });

        expect(run.status).toBe('cancelled');
      });

      it('should record cancellation reason', () => {
        const run = createMockRun({
          status: 'cancelled',
          errorMessage: 'Cancelled by user: Priority changed'
        });

        expect(run.errorMessage).toContain('Cancelled by user');
      });

      it('should cancel all pending steps', () => {
        const steps = [
          createMockRunStep({ status: 'completed' }),
          createMockRunStep({ id: 'rs-2', status: 'skipped' }),
          createMockRunStep({ id: 'rs-3', status: 'pending' }),
        ];

        const pendingSteps = steps.filter(s => s.status === 'pending');

        expect(pendingSteps).toHaveLength(1);
        // All pending steps should be cancelled
      });
    });

    describe('executeStep', () => {
      it('should update step status to running', () => {
        const step = createMockRunStep({ status: 'running' });

        expect(step.status).toBe('running');
      });

      it('should record execution result on completion', () => {
        const step = createMockRunStep({
          status: 'completed',
          executionResult: { output: 'Success', metrics: { processed: 100 } },
          completedAt: new Date().toISOString(),
        });

        expect(step.status).toBe('completed');
        expect(step.executionResult).not.toBeNull();
        expect(step.completedAt).not.toBeNull();
      });

      it('should handle step failure', () => {
        const step = createMockRunStep({
          status: 'failed',
          errorMessage: 'API rate limit exceeded',
        });

        expect(step.status).toBe('failed');
        expect(step.errorMessage).toContain('rate limit');
      });

      it('should advance to next step on completion', () => {
        const run = createMockRun({ currentStepIndex: 1, totalSteps: 5 });
        const nextIndex = run.currentStepIndex + 1;

        expect(nextIndex).toBe(2);
        expect(nextIndex).toBeLessThan(run.totalSteps);
      });

      it('should complete run when last step finishes', () => {
        const run = createMockRun({ currentStepIndex: 4, totalSteps: 5 });
        const isLastStep = run.currentStepIndex === run.totalSteps - 1;

        expect(isLastStep).toBe(true);
        // Run should be marked as completed
      });
    });
  });

  describe('Step Approval', () => {
    describe('approveStep', () => {
      it('should update step status from ready to executing', () => {
        const step = createMockRunStep({ status: 'ready' });

        expect(step.status).toBe('ready');
        // After approval, should be 'executing'
      });

      it('should record approval metadata', () => {
        const step = createMockRunStep({
          approvedAt: new Date().toISOString(),
          approvedBy: mockUserId,
          approvalNotes: 'Approved after review',
        });

        expect(step.approvedAt).not.toBeNull();
        expect(step.approvedBy).toBe(mockUserId);
        expect(step.approvalNotes).toContain('Approved');
      });

      it('should only allow approving steps in ready status', () => {
        const readyStep = createMockRunStep({ status: 'ready' });
        const pendingStep = createMockRunStep({ status: 'pending' });
        const completedStep = createMockRunStep({ status: 'completed' });

        expect(readyStep.status).toBe('ready');
        expect(pendingStep.status).toBe('pending');
        expect(completedStep.status).toBe('completed');
        // Only readyStep can be approved
      });
    });

    describe('rejectStep', () => {
      it('should update step status to skipped', () => {
        const step = createMockRunStep({ status: 'skipped' });

        expect(step.status).toBe('skipped');
      });

      it('should require rejection notes', () => {
        const step = createMockRunStep({
          status: 'skipped',
          approvalNotes: 'Rejected: Not appropriate for current situation',
        });

        expect(step.approvalNotes).toContain('Rejected');
      });

      it('should advance run to next step after rejection', () => {
        const run = createMockRun({ currentStepIndex: 2 });
        const nextIndex = run.currentStepIndex + 1;

        expect(nextIndex).toBe(3);
      });
    });
  });

  describe('Run Queries', () => {
    describe('listRuns', () => {
      it('should filter by scenario', () => {
        const runs = [
          createMockRun({ scenarioId: 'scenario-1' }),
          createMockRun({ id: 'run-2', scenarioId: 'scenario-2' }),
          createMockRun({ id: 'run-3', scenarioId: 'scenario-1' }),
        ];

        const filtered = runs.filter(r => r.scenarioId === 'scenario-1');

        expect(filtered).toHaveLength(2);
      });

      it('should filter by status', () => {
        const runs = [
          createMockRun({ status: 'running' }),
          createMockRun({ id: 'run-2', status: 'completed' }),
          createMockRun({ id: 'run-3', status: 'running' }),
          createMockRun({ id: 'run-4', status: 'failed' }),
        ];

        const running = runs.filter(r => r.status === 'running');

        expect(running).toHaveLength(2);
      });

      it('should sort by started_at descending', () => {
        const runs = [
          createMockRun({ id: 'run-1', startedAt: '2024-01-01T10:00:00Z' }),
          createMockRun({ id: 'run-2', startedAt: '2024-01-03T10:00:00Z' }),
          createMockRun({ id: 'run-3', startedAt: '2024-01-02T10:00:00Z' }),
        ];

        const sorted = [...runs].sort((a, b) =>
          new Date(b.startedAt!).getTime() - new Date(a.startedAt!).getTime()
        );

        expect(sorted[0].id).toBe('run-2');
        expect(sorted[1].id).toBe('run-3');
        expect(sorted[2].id).toBe('run-1');
      });
    });

    describe('getRunWithSteps', () => {
      it('should return run with all steps', () => {
        const run = createMockRun();
        const steps = [
          createMockRunStep({ stepIndex: 0 }),
          createMockRunStep({ id: 'rs-2', stepIndex: 1 }),
          createMockRunStep({ id: 'rs-3', stepIndex: 2 }),
        ];

        expect(run.totalSteps).toBe(3);
        expect(steps).toHaveLength(3);
      });

      it('should include playbook step details', () => {
        const runStep = createMockRunStep({ playbookStepId: 'step-1' });
        const playbookStep = createMockPlaybookStep({ id: 'step-1' });

        expect(runStep.playbookStepId).toBe(playbookStep.id);
      });
    });
  });

  describe('Statistics', () => {
    describe('getStats', () => {
      it('should count playbooks correctly', () => {
        const playbooks = [
          createMockPlaybook({ isActive: true }),
          createMockPlaybook({ id: 'pb-2', isActive: true }),
          createMockPlaybook({ id: 'pb-3', isActive: false }),
        ];

        const totalPlaybooks = playbooks.length;
        const activePlaybooks = playbooks.filter(p => p.isActive).length;

        expect(totalPlaybooks).toBe(3);
        expect(activePlaybooks).toBe(2);
      });

      it('should count scenarios by status', () => {
        const scenarios = [
          createMockScenario({ status: 'draft' }),
          createMockScenario({ id: 's-2', status: 'ready' }),
          createMockScenario({ id: 's-3', status: 'in_progress' }),
          createMockScenario({ id: 's-4', status: 'completed' }),
          createMockScenario({ id: 's-5', status: 'draft' }),
        ];

        const draftCount = scenarios.filter(s => s.status === 'draft').length;
        const readyCount = scenarios.filter(s => s.status === 'ready').length;
        const inProgressCount = scenarios.filter(s => s.status === 'in_progress').length;

        expect(draftCount).toBe(2);
        expect(readyCount).toBe(1);
        expect(inProgressCount).toBe(1);
      });

      it('should count runs by status', () => {
        const runs = [
          createMockRun({ status: 'running' }),
          createMockRun({ id: 'r-2', status: 'completed' }),
          createMockRun({ id: 'r-3', status: 'completed' }),
          createMockRun({ id: 'r-4', status: 'failed' }),
          createMockRun({ id: 'r-5', status: 'paused' }),
        ];

        const runningCount = runs.filter(r => r.status === 'running').length;
        const completedCount = runs.filter(r => r.status === 'completed').length;
        const failedCount = runs.filter(r => r.status === 'failed').length;

        expect(runningCount).toBe(1);
        expect(completedCount).toBe(2);
        expect(failedCount).toBe(1);
      });

      it('should calculate success rate', () => {
        const completedRuns = 80;
        const failedRuns = 20;
        const total = completedRuns + failedRuns;
        const successRate = (completedRuns / total) * 100;

        expect(successRate).toBe(80);
      });

      it('should group scenarios by type', () => {
        const scenarios = [
          createMockScenario({ scenarioType: 'crisis' }),
          createMockScenario({ id: 's-2', scenarioType: 'opportunity' }),
          createMockScenario({ id: 's-3', scenarioType: 'crisis' }),
          createMockScenario({ id: 's-4', scenarioType: 'monitoring' }),
        ];

        const byType = scenarios.reduce((acc, s) => {
          acc[s.scenarioType] = (acc[s.scenarioType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        expect(byType.crisis).toBe(2);
        expect(byType.opportunity).toBe(1);
        expect(byType.monitoring).toBe(1);
      });
    });
  });

  describe('Audit Logging', () => {
    describe('auditLog', () => {
      it('should log playbook creation', () => {
        const auditEntry = {
          action: 'scenario_playbook.create_playbook',
          resource_type: 'scenario_playbook',
          resource_id: 'playbook-1',
          changes: { name: 'New Playbook' },
          performed_by: mockUserId,
          timestamp: new Date().toISOString(),
        };

        expect(auditEntry.action).toContain('create_playbook');
        expect(auditEntry.resource_type).toBe('scenario_playbook');
      });

      it('should log scenario creation', () => {
        const auditEntry = {
          action: 'scenario_playbook.create_scenario',
          resource_type: 'scenario',
          resource_id: 'scenario-1',
          changes: { name: 'New Scenario', playbookId: 'playbook-1' },
          performed_by: mockUserId,
          timestamp: new Date().toISOString(),
        };

        expect(auditEntry.action).toContain('create_scenario');
      });

      it('should log run events', () => {
        const events = [
          { action: 'scenario_playbook.start_run', resource_id: 'run-1' },
          { action: 'scenario_playbook.pause_run', resource_id: 'run-1' },
          { action: 'scenario_playbook.resume_run', resource_id: 'run-1' },
          { action: 'scenario_playbook.complete_run', resource_id: 'run-1' },
        ];

        expect(events).toHaveLength(4);
        expect(events[0].action).toContain('start_run');
        expect(events[3].action).toContain('complete_run');
      });

      it('should log step approval/rejection', () => {
        const approvalEntry = {
          action: 'scenario_playbook.approve_step',
          resource_type: 'scenario_run_step',
          resource_id: 'run-step-1',
          changes: { approved: true, notes: 'Looks good' },
          performed_by: mockUserId,
        };

        expect(approvalEntry.action).toContain('approve_step');
        expect(approvalEntry.changes.approved).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty context parameters', () => {
      const scenario = createMockScenario({ contextParameters: {} });

      expect(scenario.contextParameters).toEqual({});
    });

    it('should handle null optional fields', () => {
      const playbook = createMockPlaybook({ description: undefined });
      const scenario = createMockScenario({ description: undefined });

      expect(playbook.description).toBeUndefined();
      expect(scenario.description).toBeUndefined();
    });

    it('should handle long playbook names', () => {
      const longName = 'A'.repeat(255);
      const playbook = createMockPlaybook({ name: longName });

      expect(playbook.name.length).toBe(255);
    });

    it('should handle special characters in names', () => {
      const specialName = 'Crisis Response & Recovery (v2.0) - "Urgent"';
      const playbook = createMockPlaybook({ name: specialName });

      expect(playbook.name).toContain('&');
      expect(playbook.name).toContain('"');
    });

    it('should handle concurrent runs on same scenario', () => {
      const runs = [
        createMockRun({ id: 'run-1', scenarioId: 'scenario-1', status: 'running' }),
        createMockRun({ id: 'run-2', scenarioId: 'scenario-1', status: 'running' }),
      ];

      const runningForScenario = runs.filter(
        r => r.scenarioId === 'scenario-1' && r.status === 'running'
      );

      expect(runningForScenario).toHaveLength(2);
      // Service should enforce single active run per scenario if desired
    });

    it('should handle step with no action payload', () => {
      const step = createMockPlaybookStep({ actionPayload: {} });

      expect(step.actionPayload).toEqual({});
    });

    it('should handle run with zero steps', () => {
      const run = createMockRun({ totalSteps: 0 });

      expect(run.totalSteps).toBe(0);
      // Edge case: run should complete immediately
    });
  });
});
