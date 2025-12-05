/**
 * AI Scenario Simulation Engine Validators (Sprint S71)
 *
 * Zod schemas for validating AI scenario simulation requests and data.
 */

import { z } from 'zod';

// ============================================================================
// ENUM SCHEMAS
// ============================================================================

export const aiSimulationModeSchema = z.enum([
  'single_run',
  'multi_run',
  'what_if',
]);

export const aiSimulationStatusSchema = z.enum([
  'draft',
  'configured',
  'running',
  'paused',
  'completed',
  'failed',
  'archived',
]);

export const aiRunStatusSchema = z.enum([
  'starting',
  'in_progress',
  'completed',
  'failed',
  'aborted',
]);

export const aiAgentRoleTypeSchema = z.enum([
  'internal_exec',
  'journalist',
  'investor',
  'customer',
  'employee',
  'regulator',
  'market_analyst',
  'system',
  'critic',
]);

export const aiScenarioChannelSchema = z.enum([
  'press',
  'email',
  'social',
  'internal_meeting',
  'board',
  'investor_call',
  'public_statement',
  'private_message',
  'analyst_report',
]);

export const aiScenarioObjectiveSchema = z.enum([
  'crisis_comms',
  'investor_relations',
  'reputation',
  'go_to_market',
  'regulatory',
  'competitive',
  'earnings',
  'leadership_change',
  'm_and_a',
  'custom',
]);

export const aiScenarioRiskLevelSchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

export const aiScenarioOutcomeTypeSchema = z.enum([
  'risk',
  'opportunity',
  'neutral',
]);

export const aiSimResponseLengthSchema = z.enum([
  'brief',
  'moderate',
  'detailed',
]);

export const aiSimFeedbackTypeSchema = z.enum([
  'constraint',
  'guidance',
  'correction',
  'preference',
]);

export const aiSimTargetAudienceSchema = z.enum([
  'executive',
  'technical',
  'board',
]);

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

export const aiAgentConfigSchema = z.object({
  style: z.string().optional(),
  tone: z.string().optional(),
  priorities: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  responseLength: aiSimResponseLengthSchema.optional(),
  aggressiveness: z.number().min(0).max(1).optional(),
  customInstructions: z.string().optional(),
}).strict();

export const aiSimulationConfigSchema = z.object({
  timeHorizonHours: z.number().positive().optional(),
  maxStepsPerRun: z.number().int().positive().max(100).optional(),
  constraints: z.array(z.string()).optional(),
  focusAreas: z.array(z.string()).optional(),
  excludeTopics: z.array(z.string()).optional(),
  temperature: z.number().min(0).max(2).optional(),
  agentConfigs: z.record(z.string(), aiAgentConfigSchema).optional(),
  enableAutoProgress: z.boolean().optional(),
  convergenceCriteria: z.array(z.string()).optional(),
}).strict();

export const aiAgentPersonaRefSchema = z.object({
  personaId: z.string().uuid().optional(),
  personaSnapshot: z.object({
    name: z.string().optional(),
    demographics: z.record(z.unknown()).optional(),
    psychographics: z.record(z.unknown()).optional(),
    behaviors: z.array(z.string()).optional(),
  }).optional(),
}).strict();

export const aiScenarioTurnMetadataSchema = z.object({
  toolsUsed: z.array(z.string()).optional(),
  sourcesReferenced: z.array(z.string()).optional(),
  sentimentScore: z.number().min(-1).max(1).optional(),
  keyTopics: z.array(z.string()).optional(),
  llmModel: z.string().optional(),
  tokenCount: z.number().int().nonnegative().optional(),
  promptTokens: z.number().int().nonnegative().optional(),
  completionTokens: z.number().int().nonnegative().optional(),
  generationTimeMs: z.number().nonnegative().optional(),
}).strict();

export const aiScenarioRecommendedActionSchema = z.object({
  action: z.string().min(1),
  priority: z.enum(['high', 'medium', 'low']),
  rationale: z.string().optional(),
  assignee: z.string().optional(),
  timeline: z.string().optional(),
}).strict();

// ============================================================================
// CONTEXT SCHEMAS
// ============================================================================

export const aiSimRiskRadarSnapshotSchema = z.object({
  overallRiskScore: z.number().optional(),
  topRisks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    severity: z.string(),
    category: z.string(),
  })).optional(),
  trendDirection: z.enum(['improving', 'stable', 'worsening']).optional(),
}).strict();

export const unifiedGraphContextSchema = z.object({
  relevantNodes: z.array(z.object({
    id: z.string(),
    nodeType: z.string(),
    label: z.string(),
    importance: z.number().optional(),
  })).optional(),
  keyRelationships: z.array(z.object({
    sourceId: z.string(),
    targetId: z.string(),
    edgeType: z.string(),
  })).optional(),
  clusterSummary: z.string().optional(),
}).strict();

export const narrativeContextSchema = z.object({
  latestNarrativeId: z.string().uuid().optional(),
  keyThemes: z.array(z.string()).optional(),
  strategicPriorities: z.array(z.string()).optional(),
  currentPositioning: z.string().optional(),
}).strict();

export const strategicIntelContextSchema = z.object({
  marketTrends: z.array(z.string()).optional(),
  competitivePositioning: z.string().optional(),
  opportunities: z.array(z.string()).optional(),
  threats: z.array(z.string()).optional(),
}).strict();

export const competitiveContextSchema = z.object({
  topCompetitors: z.array(z.object({
    id: z.string(),
    name: z.string(),
    threatLevel: z.string().optional(),
  })).optional(),
  recentCompetitorMoves: z.array(z.string()).optional(),
}).strict();

export const reputationContextSchema = z.object({
  overallSentiment: z.number().optional(),
  sentimentTrend: z.enum(['improving', 'stable', 'declining']).optional(),
  keyIssues: z.array(z.string()).optional(),
  positiveDrivers: z.array(z.string()).optional(),
}).strict();

export const crisisContextSchema = z.object({
  activeIncidents: z.array(z.object({
    id: z.string(),
    title: z.string(),
    severity: z.string(),
  })).optional(),
  escalationRisk: z.string().optional(),
}).strict();

export const aiContextSnapshotSchema = z.object({
  capturedAt: z.coerce.date().optional().default(() => new Date()),
  riskRadarSnapshot: aiSimRiskRadarSnapshotSchema.optional(),
  unifiedGraphContext: unifiedGraphContextSchema.optional(),
  narrativeContext: narrativeContextSchema.optional(),
  strategicIntelContext: strategicIntelContextSchema.optional(),
  competitiveContext: competitiveContextSchema.optional(),
  reputationContext: reputationContextSchema.optional(),
  crisisContext: crisisContextSchema.optional(),
}).strict();

export const aiScenarioSeedSourceSchema = z.object({
  sourceType: z.enum(['playbook', 'narrative', 'risk_snapshot', 'crisis_incident', 'custom']),
  sourceId: z.string().uuid().optional(),
  sourceName: z.string().optional(),
  snapshotData: z.record(z.unknown()).optional(),
}).strict();

// ============================================================================
// SIMULATION CRUD SCHEMAS
// ============================================================================

export const createAISimulationSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  linkedPlaybookId: z.string().uuid().optional(),
  simulationMode: aiSimulationModeSchema.optional().default('single_run'),
  objectiveType: aiScenarioObjectiveSchema.optional().default('custom'),
  config: aiSimulationConfigSchema.optional().default({}),
}).strict();

export type CreateAISimulation = z.infer<typeof createAISimulationSchema>;

export const updateAISimulationSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  linkedPlaybookId: z.string().uuid().optional().nullable(),
  simulationMode: aiSimulationModeSchema.optional(),
  objectiveType: aiScenarioObjectiveSchema.optional(),
  status: aiSimulationStatusSchema.optional(),
  config: aiSimulationConfigSchema.optional(),
}).strict();

export type UpdateAISimulation = z.infer<typeof updateAISimulationSchema>;

export const listAISimulationsSchema = z.object({
  search: z.string().optional(),
  status: aiSimulationStatusSchema.optional(),
  objectiveType: aiScenarioObjectiveSchema.optional(),
  simulationMode: aiSimulationModeSchema.optional(),
  linkedPlaybookId: z.string().uuid().optional(),
  sortBy: z.enum(['name', 'created_at', 'updated_at', 'status']).optional().default('updated_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
}).strict();

export type ListAISimulations = z.infer<typeof listAISimulationsSchema>;

// ============================================================================
// AGENT DEFINITION SCHEMAS
// ============================================================================

export const aiAgentDefinitionSchema = z.object({
  agentKey: z.string().min(1).max(50).regex(/^[a-z0-9_]+$/),
  displayName: z.string().min(1).max(100),
  roleType: aiAgentRoleTypeSchema,
  personaRef: aiAgentPersonaRefSchema.optional(),
  config: aiAgentConfigSchema.optional().default({}),
  isActive: z.boolean().optional().default(true),
}).strict();

export type AIAgentDefinition = z.infer<typeof aiAgentDefinitionSchema>;

// ============================================================================
// RUN MANAGEMENT SCHEMAS
// ============================================================================

export const startSimulationRunSchema = z.object({
  runLabel: z.string().max(100).optional(),
  maxSteps: z.number().int().positive().max(100).optional().default(20),
  agents: z.array(aiAgentDefinitionSchema).optional(),
  seedSources: z.array(aiScenarioSeedSourceSchema).optional(),
  customContext: aiContextSnapshotSchema.partial().optional(),
  startImmediately: z.boolean().optional().default(false),
}).strict();

export type StartSimulationRun = z.infer<typeof startSimulationRunSchema>;

export const listSimulationRunsSchema = z.object({
  status: aiRunStatusSchema.optional(),
  riskLevel: aiScenarioRiskLevelSchema.optional(),
  sortBy: z.enum(['run_number', 'created_at', 'started_at', 'status']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
}).strict();

export type ListSimulationRuns = z.infer<typeof listSimulationRunsSchema>;

export const stepRunSchema = z.object({
  agentId: z.string().uuid().optional(),
  userGuidance: z.string().max(1000).optional(),
  skipAgent: z.boolean().optional().default(false),
}).strict();

export type StepRun = z.infer<typeof stepRunSchema>;

export const runUntilConvergedSchema = z.object({
  maxSteps: z.number().int().positive().max(50).optional(),
  convergenceCriteria: z.array(z.string()).optional(),
  pauseOnHighRisk: z.boolean().optional().default(false),
}).strict();

export type RunUntilConverged = z.infer<typeof runUntilConvergedSchema>;

// ============================================================================
// FEEDBACK SCHEMAS
// ============================================================================

export const postAgentFeedbackSchema = z.object({
  feedbackType: aiSimFeedbackTypeSchema,
  content: z.string().min(1).max(2000),
  targetAgentId: z.string().uuid().optional(),
  applyToFutureSteps: z.boolean().optional().default(true),
}).strict();

export type PostAgentFeedback = z.infer<typeof postAgentFeedbackSchema>;

// ============================================================================
// OBSERVABILITY SCHEMAS
// ============================================================================

export const listRunTurnsSchema = z.object({
  speakerAgentId: z.string().uuid().optional(),
  channel: aiScenarioChannelSchema.optional(),
  stepIndex: z.coerce.number().int().nonnegative().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.coerce.number().int().positive().max(200).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
}).strict();

export type ListRunTurns = z.infer<typeof listRunTurnsSchema>;

export const listRunMetricsSchema = z.object({
  metricKey: z.string().optional(),
  metricCategory: z.string().optional(),
  stepIndex: z.coerce.number().int().nonnegative().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.coerce.number().int().positive().max(500).optional().default(100),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
}).strict();

export type ListRunMetrics = z.infer<typeof listRunMetricsSchema>;

export const listRunOutcomesSchema = z.object({
  outcomeType: aiScenarioOutcomeTypeSchema.optional(),
  riskLevel: aiScenarioRiskLevelSchema.optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
}).strict();

export type ListRunOutcomes = z.infer<typeof listRunOutcomesSchema>;

// ============================================================================
// METRICS & OUTCOMES SCHEMAS
// ============================================================================

export const computeRunMetricsSchema = z.object({
  metricKeys: z.array(z.string()).optional(),
  includeHistorical: z.boolean().optional().default(false),
}).strict();

export type ComputeRunMetrics = z.infer<typeof computeRunMetricsSchema>;

export const summarizeOutcomesSchema = z.object({
  generateNarrative: z.boolean().optional().default(true),
  includeRecommendations: z.boolean().optional().default(true),
  targetAudience: aiSimTargetAudienceSchema.optional().default('executive'),
}).strict();

export type SummarizeOutcomes = z.infer<typeof summarizeOutcomesSchema>;

// ============================================================================
// AUDIT LOG SCHEMA
// ============================================================================

export const aiSimListAuditLogsSchema = z.object({
  simulationId: z.string().uuid().optional(),
  runId: z.string().uuid().optional(),
  eventType: z.string().optional(),
  actorId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().positive().max(500).optional().default(100),
  offset: z.coerce.number().int().nonnegative().optional().default(0),
}).strict();

export type AISimListAuditLogs = z.infer<typeof aiSimListAuditLogsSchema>;

// ============================================================================
// ARCHIVE SCHEMA
// ============================================================================

export const archiveSimulationSchema = z.object({
  reason: z.string().max(500).optional(),
}).strict();

export type ArchiveSimulation = z.infer<typeof archiveSimulationSchema>;

export const archiveRunSchema = z.object({
  reason: z.string().max(500).optional(),
}).strict();

export type ArchiveRun = z.infer<typeof archiveRunSchema>;

// ============================================================================
// PATH PARAMETER SCHEMAS
// ============================================================================

export const simulationIdParamSchema = z.object({
  id: z.string().uuid(),
}).strict();

export const aiSimRunIdParamSchema = z.object({
  runId: z.string().uuid(),
}).strict();

export const simulationAndRunParamSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
}).strict();
