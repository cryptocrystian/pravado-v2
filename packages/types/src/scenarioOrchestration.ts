/**
 * Scenario Orchestration Engine Types (Sprint S72)
 *
 * Multi-scenario orchestration for combined crisis/investor/strategic
 * scenario suites with conditional triggers and branching outcomes.
 * Extends S71 AI Scenario Simulation Engine.
 */

import type { AIScenarioRiskLevel, AIScenarioSimulation, AIScenarioRun } from './aiScenarioSimulation';

// ============================================================================
// ENUMS / LITERAL TYPES
// ============================================================================

/**
 * Suite lifecycle status
 */
export type ScenarioSuiteStatus =
  | 'draft'
  | 'configured'
  | 'running'
  | 'completed'
  | 'failed'
  | 'archived';

export const SCENARIO_SUITE_STATUSES: ScenarioSuiteStatus[] = [
  'draft',
  'configured',
  'running',
  'completed',
  'failed',
  'archived',
];

export const SCENARIO_SUITE_STATUS_LABELS: Record<ScenarioSuiteStatus, string> = {
  draft: 'Draft',
  configured: 'Configured',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  archived: 'Archived',
};

export const SCENARIO_SUITE_STATUS_COLORS: Record<ScenarioSuiteStatus, string> = {
  draft: 'gray',
  configured: 'blue',
  running: 'yellow',
  completed: 'green',
  failed: 'red',
  archived: 'gray',
};

/**
 * Suite run status
 */
export type ScenarioSuiteRunStatus =
  | 'starting'
  | 'in_progress'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'aborted';

export const SCENARIO_SUITE_RUN_STATUSES: ScenarioSuiteRunStatus[] = [
  'starting',
  'in_progress',
  'running',
  'paused',
  'completed',
  'failed',
  'aborted',
];

export const SCENARIO_SUITE_RUN_STATUS_LABELS: Record<ScenarioSuiteRunStatus, string> = {
  starting: 'Starting',
  in_progress: 'In Progress',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  aborted: 'Aborted',
};

export const SCENARIO_SUITE_RUN_STATUS_COLORS: Record<ScenarioSuiteRunStatus, string> = {
  starting: 'gray',
  in_progress: 'blue',
  running: 'blue',
  paused: 'yellow',
  completed: 'green',
  failed: 'red',
  aborted: 'orange',
};

/**
 * Suite item execution status
 */
export type ScenarioSuiteItemStatus =
  | 'pending'
  | 'condition_met'
  | 'condition_unmet'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export const SCENARIO_SUITE_ITEM_STATUSES: ScenarioSuiteItemStatus[] = [
  'pending',
  'condition_met',
  'condition_unmet',
  'running',
  'completed',
  'failed',
  'skipped',
];

export const SCENARIO_SUITE_ITEM_STATUS_LABELS: Record<ScenarioSuiteItemStatus, string> = {
  pending: 'Pending',
  condition_met: 'Condition Met',
  condition_unmet: 'Condition Not Met',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  skipped: 'Skipped',
};

export const SCENARIO_SUITE_ITEM_STATUS_COLORS: Record<ScenarioSuiteItemStatus, string> = {
  pending: 'gray',
  condition_met: 'blue',
  condition_unmet: 'yellow',
  running: 'indigo',
  completed: 'green',
  failed: 'red',
  skipped: 'gray',
};

/**
 * Trigger condition types
 */
export type TriggerConditionType =
  | 'always'
  | 'risk_threshold'
  | 'sentiment_shift'
  | 'keyword_match'
  | 'agent_response'
  | 'outcome_match'
  | 'custom_expression';

export const TRIGGER_CONDITION_TYPES: TriggerConditionType[] = [
  'always',
  'risk_threshold',
  'sentiment_shift',
  'keyword_match',
  'agent_response',
  'outcome_match',
  'custom_expression',
];

export const TRIGGER_CONDITION_TYPE_LABELS: Record<TriggerConditionType, string> = {
  always: 'Always Execute',
  risk_threshold: 'Risk Threshold',
  sentiment_shift: 'Sentiment Shift',
  keyword_match: 'Keyword Match',
  agent_response: 'Agent Response',
  outcome_match: 'Outcome Match',
  custom_expression: 'Custom Expression',
};

export const TRIGGER_CONDITION_TYPE_DESCRIPTIONS: Record<TriggerConditionType, string> = {
  always: 'Execute this simulation sequentially without conditions',
  risk_threshold: 'Trigger when a previous run exceeds a risk level threshold',
  sentiment_shift: 'Trigger when sentiment shifts in a specific direction',
  keyword_match: 'Trigger when specific keywords appear in agent responses',
  agent_response: 'Trigger based on specific agent role responses',
  outcome_match: 'Trigger when a specific outcome type is detected',
  custom_expression: 'Trigger based on a custom boolean expression',
};

// ============================================================================
// TRIGGER CONDITION STRUCTURES
// ============================================================================

/**
 * Base trigger condition interface
 */
export interface BaseTriggerCondition {
  sourceItemId?: string;
}

/**
 * Risk threshold trigger condition
 */
export interface RiskThresholdCondition extends BaseTriggerCondition {
  type: 'risk_threshold';
  minRiskLevel: AIScenarioRiskLevel;
  comparison?: 'gte' | 'gt' | 'eq' | 'lte' | 'lt';
}

/**
 * Sentiment shift trigger condition
 */
export interface SentimentShiftCondition extends BaseTriggerCondition {
  type: 'sentiment_shift';
  direction: 'positive' | 'negative' | 'any';
  magnitude?: number; // 0-1 scale
}

/**
 * Keyword match trigger condition
 */
export interface KeywordMatchCondition extends BaseTriggerCondition {
  type: 'keyword_match';
  keywords: string[];
  matchMode?: 'any' | 'all';
  caseSensitive?: boolean;
}

/**
 * Agent response trigger condition
 */
export interface AgentResponseCondition extends BaseTriggerCondition {
  type: 'agent_response';
  agentRoleType?: string;
  containsKeywords?: string[];
  sentimentThreshold?: number;
}

/**
 * Outcome match trigger condition
 */
export interface OutcomeMatchCondition extends BaseTriggerCondition {
  type: 'outcome_match';
  outcomeType: 'risk' | 'opportunity' | 'neutral';
  minSeverity?: AIScenarioRiskLevel;
}

/**
 * Custom expression trigger condition
 */
export interface CustomExpressionCondition extends BaseTriggerCondition {
  type: 'custom_expression';
  expression: string;
  variables?: Record<string, unknown>;
}

/**
 * Always execute condition
 */
export interface AlwaysCondition {
  type: 'always';
}

/**
 * Union type for all trigger conditions
 */
export type TriggerCondition =
  | AlwaysCondition
  | RiskThresholdCondition
  | SentimentShiftCondition
  | KeywordMatchCondition
  | AgentResponseCondition
  | OutcomeMatchCondition
  | CustomExpressionCondition;

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

/**
 * Suite configuration options
 */
export interface ScenarioSuiteConfig {
  maxConcurrentSimulations?: number;
  stopOnFailure?: boolean;
  narrativeEnabled?: boolean;
  riskMapEnabled?: boolean;
  timeoutSeconds?: number;
  retryPolicy?: {
    maxRetries?: number;
    backoffMs?: number;
  };
  notificationSettings?: {
    onComplete?: boolean;
    onFailure?: boolean;
    onRiskThreshold?: AIScenarioRiskLevel;
  };
}

/**
 * Suite execution config overrides for individual items
 */
export interface SuiteItemExecutionConfig {
  maxStepsOverride?: number;
  seedContextOverride?: Record<string, unknown>;
  agentOverrides?: Record<string, unknown>;
  temperatureOverride?: number;
}

/**
 * Scenario Suite entity
 */
export interface ScenarioSuite {
  id: string;
  orgId: string;
  name: string;
  description?: string | null;
  status: ScenarioSuiteStatus;
  config: ScenarioSuiteConfig;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  archivedAt?: Date | string | null;
}

/**
 * Scenario Suite Item entity
 */
export interface ScenarioSuiteItem {
  id: string;
  suiteId: string;
  simulationId: string;
  orderIndex: number;
  dependsOnItemId?: string | null;
  triggerConditionType: TriggerConditionType;
  triggerCondition: TriggerCondition | Record<string, unknown>;
  executionConfig?: SuiteItemExecutionConfig;
  label?: string | null;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Joined data
  simulation?: AIScenarioSimulation;
  dependsOnItem?: ScenarioSuiteItem;
}

/**
 * Scenario Suite Run entity
 */
export interface ScenarioSuiteRun {
  id: string;
  orgId: string;
  suiteId: string;
  runNumber: number;
  runLabel?: string | null;
  status: ScenarioSuiteRunStatus;

  // Progress tracking
  totalItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
  currentItemIndex: number;

  // Aggregate metrics
  aggregateRiskLevel?: AIScenarioRiskLevel | null;
  totalTokensUsed: number;
  totalStepsExecuted: number;
  totalDurationMs?: number | null;

  // Context and results
  seedContext?: Record<string, unknown>;
  suiteNarrative?: string | null;
  riskMap?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  aggregatedOutcomes?: Record<string, unknown> | null;

  // Error handling
  errorDetails?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  } | null;

  // Timing
  startedAt: Date | string;
  completedAt?: Date | string | null;
  startedBy?: string | null;

  createdAt: Date | string;
  updatedAt: Date | string;

  // Joined data
  suite?: ScenarioSuite;
  items?: ScenarioSuiteRunItem[];
}

/**
 * Scenario Suite Run Item entity
 */
export interface ScenarioSuiteRunItem {
  id: string;
  orgId: string;
  suiteRunId: string;
  suiteItemId: string;
  simulationRunId?: string | null;
  orderIndex: number;
  status: ScenarioSuiteItemStatus;

  // Condition evaluation
  conditionEvaluated: boolean;
  conditionResult?: boolean | null;
  conditionDetails?: Record<string, unknown>;

  // Execution metrics
  tokensUsed?: number | null;
  stepsExecuted?: number | null;
  durationMs?: number | null;

  // Results
  riskLevel?: AIScenarioRiskLevel | null;
  outcomeSummary?: Record<string, unknown>;
  keyFindings?: unknown[];

  // Error tracking
  errorMessage?: string | null;
  errorDetails?: Record<string, unknown>;

  // Timing
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;

  // Joined data
  suiteItem?: ScenarioSuiteItem;
  simulationRun?: AIScenarioRun;
}

/**
 * Audit log event
 */
export interface ScenarioSuiteAuditEvent {
  id: string;
  orgId: string;
  suiteId?: string | null;
  suiteRunId?: string | null;
  suiteRunItemId?: string | null;
  eventType: string;
  details: Record<string, unknown>;
  userId?: string | null;
  createdAt: Date | string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES - SUITE CRUD
// ============================================================================

/**
 * Create suite input
 */
export interface CreateScenarioSuiteInput {
  name: string;
  description?: string | null;
  config?: ScenarioSuiteConfig;
  metadata?: Record<string, unknown>;
  items?: CreateSuiteItemInput[];
}

/**
 * Create suite item input
 */
export interface CreateSuiteItemInput {
  simulationId: string;
  orderIndex?: number;
  dependsOnItemId?: string | null;
  triggerConditionType?: TriggerConditionType;
  triggerCondition?: TriggerCondition | Record<string, unknown>;
  executionConfig?: SuiteItemExecutionConfig;
  label?: string | null;
  notes?: string | null;
}

/**
 * Update suite input
 */
export interface UpdateScenarioSuiteInput {
  name?: string;
  description?: string | null;
  status?: ScenarioSuiteStatus;
  config?: ScenarioSuiteConfig;
  metadata?: Record<string, unknown>;
}

/**
 * Update suite item input
 */
export interface UpdateSuiteItemInput {
  orderIndex?: number;
  dependsOnItemId?: string | null;
  triggerConditionType?: TriggerConditionType;
  triggerCondition?: TriggerCondition | Record<string, unknown>;
  executionConfig?: SuiteItemExecutionConfig;
  label?: string | null;
  notes?: string | null;
}

/**
 * Add item to suite input
 */
export interface AddSuiteItemInput extends CreateSuiteItemInput {
  suiteId: string;
}

/**
 * List suites query
 */
export interface ListScenarioSuitesQuery {
  status?: ScenarioSuiteStatus;
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'name';
  sortOrder?: 'asc' | 'desc';
  includeArchived?: boolean;
}

/**
 * List suite runs query
 */
export interface ListSuiteRunsQuery {
  status?: ScenarioSuiteRunStatus;
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
}

// ============================================================================
// REQUEST/RESPONSE TYPES - SUITE EXECUTION
// ============================================================================

/**
 * Start suite run input
 */
export interface StartScenarioSuiteRunInput {
  runLabel?: string | null;
  seedContext?: Record<string, unknown>;
  startImmediately?: boolean;
}

/**
 * Advance suite run input
 */
export interface AdvanceSuiteRunInput {
  maxItems?: number;
  skipConditionCheck?: boolean;
  skipCurrent?: boolean;
}

/**
 * Abort suite run input
 */
export interface AbortSuiteRunInput {
  reason?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Suite list response
 */
export interface ListScenarioSuitesResponse {
  success: boolean;
  suites: ScenarioSuite[];
  total: number;
}

/**
 * Suite detail response
 */
export interface GetScenarioSuiteResponse {
  success: boolean;
  suite: ScenarioSuite;
  items: ScenarioSuiteItem[];
}

/**
 * Suite run detail response
 */
export interface GetScenarioSuiteRunResponse {
  success: boolean;
  run: ScenarioSuiteRun;
  items: ScenarioSuiteRunItem[];
}

/**
 * Suite run list response
 */
export interface ListSuiteRunsResponse {
  success: boolean;
  runs: ScenarioSuiteRun[];
  total: number;
}

/**
 * Suite run items response
 */
export interface ListSuiteRunItemsResponse {
  success: boolean;
  items: ScenarioSuiteRunItem[];
  total: number;
}

/**
 * Create suite response
 */
export interface CreateScenarioSuiteResponse {
  success: boolean;
  suite: ScenarioSuite;
  items: ScenarioSuiteItem[];
}

/**
 * Update suite response
 */
export interface UpdateScenarioSuiteResponse {
  success: boolean;
  suite: ScenarioSuite;
}

/**
 * Archive suite response
 */
export interface ArchiveScenarioSuiteResponse {
  success: boolean;
  suite: ScenarioSuite;
}

/**
 * Start suite run response
 */
export interface StartScenarioSuiteRunResponse {
  success: boolean;
  run: ScenarioSuiteRun;
  items: ScenarioSuiteRunItem[];
}

/**
 * Advance suite run response
 */
export interface AdvanceSuiteRunResponse {
  success: boolean;
  run: ScenarioSuiteRun;
  advancedItems: ScenarioSuiteRunItem[];
  nextItem?: ScenarioSuiteRunItem | null;
  isComplete: boolean;
}

/**
 * Abort suite run response
 */
export interface AbortSuiteRunResponse {
  success: boolean;
  run: ScenarioSuiteRun;
}

// ============================================================================
// METRICS & ANALYTICS TYPES
// ============================================================================

/**
 * Suite run metrics
 */
export interface SuiteRunMetrics {
  runId: string;
  suiteId: string;

  // Execution metrics
  totalItems: number;
  completedItems: number;
  failedItems: number;
  skippedItems: number;
  conditionMetItems: number;
  conditionUnmetItems: number;

  // Performance metrics
  totalTokensUsed: number;
  totalStepsExecuted: number;
  totalDurationMs: number;
  averageItemDurationMs: number;

  // Risk metrics
  aggregateRiskLevel: AIScenarioRiskLevel;
  riskLevelDistribution: Record<AIScenarioRiskLevel, number>;

  // Condition metrics
  conditionEvaluations: {
    type: TriggerConditionType;
    evaluations: number;
    metCount: number;
    unmetCount: number;
  }[];

  // Item-level breakdown
  itemMetrics: {
    itemId: string;
    simulationName: string;
    status: ScenarioSuiteItemStatus;
    tokensUsed: number;
    stepsExecuted: number;
    durationMs: number;
    riskLevel?: AIScenarioRiskLevel;
  }[];
}

/**
 * Suite statistics
 */
export interface ScenarioSuiteStats {
  totalSuites: number;
  byStatus: Record<ScenarioSuiteStatus, number>;
  totalRuns: number;
  runsByStatus: Record<ScenarioSuiteRunStatus, number>;
  averageItemsPerSuite: number;
  averageRunDurationMs: number;
  mostUsedConditionType: TriggerConditionType;
  riskDistribution: Record<AIScenarioRiskLevel, number>;
}

/**
 * Get suite run metrics response
 */
export interface GetSuiteRunMetricsResponse {
  success: boolean;
  metrics: SuiteRunMetrics;
}

/**
 * Get suite stats response
 */
export interface GetScenarioSuiteStatsResponse {
  success: boolean;
  stats: ScenarioSuiteStats;
}

// ============================================================================
// AUDIT LOG TYPES
// ============================================================================

/**
 * Audit event types
 */
export type ScenarioSuiteAuditEventType =
  | 'suite_created'
  | 'suite_updated'
  | 'suite_archived'
  | 'item_added'
  | 'item_updated'
  | 'item_removed'
  | 'run_started'
  | 'run_completed'
  | 'run_failed'
  | 'run_aborted'
  | 'item_condition_evaluated'
  | 'item_started'
  | 'item_completed'
  | 'item_failed'
  | 'item_skipped'
  | 'narrative_generated'
  | 'risk_map_generated';

export const SCENARIO_SUITE_AUDIT_EVENT_TYPES: ScenarioSuiteAuditEventType[] = [
  'suite_created',
  'suite_updated',
  'suite_archived',
  'item_added',
  'item_updated',
  'item_removed',
  'run_started',
  'run_completed',
  'run_failed',
  'run_aborted',
  'item_condition_evaluated',
  'item_started',
  'item_completed',
  'item_failed',
  'item_skipped',
  'narrative_generated',
  'risk_map_generated',
];

export const SCENARIO_SUITE_AUDIT_EVENT_TYPE_LABELS: Record<ScenarioSuiteAuditEventType, string> = {
  suite_created: 'Suite Created',
  suite_updated: 'Suite Updated',
  suite_archived: 'Suite Archived',
  item_added: 'Item Added',
  item_updated: 'Item Updated',
  item_removed: 'Item Removed',
  run_started: 'Run Started',
  run_completed: 'Run Completed',
  run_failed: 'Run Failed',
  run_aborted: 'Run Aborted',
  item_condition_evaluated: 'Condition Evaluated',
  item_started: 'Item Started',
  item_completed: 'Item Completed',
  item_failed: 'Item Failed',
  item_skipped: 'Item Skipped',
  narrative_generated: 'Narrative Generated',
  risk_map_generated: 'Risk Map Generated',
};

/**
 * List audit events query
 */
export interface ListSuiteAuditEventsQuery {
  suiteId?: string;
  suiteRunId?: string;
  eventType?: ScenarioSuiteAuditEventType;
  limit?: number;
  offset?: number;
  sortOrder?: 'asc' | 'desc';
}

/**
 * List audit events response
 */
export interface ListSuiteAuditEventsResponse {
  success: boolean;
  events: ScenarioSuiteAuditEvent[];
  total: number;
}

// ============================================================================
// NARRATIVE & RISK MAP TYPES
// ============================================================================

/**
 * Suite narrative request
 */
export interface GenerateSuiteNarrativeInput {
  runId: string;
  format?: 'summary' | 'detailed' | 'executive';
  includeRecommendations?: boolean;
}

/**
 * Suite narrative response
 */
export interface GenerateSuiteNarrativeResponse {
  success: boolean;
  narrative: string;
  metadata: {
    generatedAt: string;
    format: string;
    tokensUsed: number;
  };
}

/**
 * Risk map node
 */
export interface RiskMapNode {
  id: string;
  label: string;
  type: 'simulation' | 'outcome' | 'risk' | 'opportunity';
  riskLevel?: AIScenarioRiskLevel;
  details?: Record<string, unknown>;
}

/**
 * Risk map edge
 */
export interface RiskMapEdge {
  source: string;
  target: string;
  label?: string;
  weight?: number;
  conditionMet?: boolean;
}

/**
 * Suite risk map
 */
export interface SuiteRiskMap {
  runId: string;
  suiteId: string;
  nodes: RiskMapNode[];
  edges: RiskMapEdge[];
  aggregateRiskLevel: AIScenarioRiskLevel;
  riskFactors: {
    factor: string;
    severity: AIScenarioRiskLevel;
    source: string;
    mitigations?: string[];
  }[];
  opportunities: {
    opportunity: string;
    impact: 'low' | 'medium' | 'high';
    source: string;
  }[];
  generatedAt: string;
}

/**
 * Generate risk map response
 */
export interface GenerateSuiteRiskMapResponse {
  success: boolean;
  riskMap: SuiteRiskMap;
}

// ============================================================================
// CONTEXT TYPES
// ============================================================================

/**
 * Service context for scenario orchestration operations
 */
export interface ScenarioOrchestrationContext {
  supabase: unknown;
  orgId: string;
  userId: string;
}
