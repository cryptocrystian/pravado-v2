/**
 * Scenario Simulation & Autonomous Playbook Orchestration Types (Sprint S67)
 * Defines types for scenario-based playbook simulation, orchestration, and execution
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Types of simulation scenarios
 */
export enum ScenarioType {
  CRISIS_SIM = 'crisis_sim',
  CAMPAIGN_SIM = 'campaign_sim',
  REPUTATION_SIM = 'reputation_sim',
  STRATEGIC_SIM = 'strategic_sim',
  OUTREACH_SIM = 'outreach_sim',
  COMPETITIVE_SIM = 'competitive_sim',
  CUSTOM = 'custom',
}

/**
 * Status of a scenario playbook
 */
export enum ScenarioPlaybookStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DEPRECATED = 'deprecated',
}

/**
 * Trigger types for playbook execution
 */
export enum ScenarioTriggerType {
  MANUAL = 'manual',
  SIGNAL_BASED = 'signal_based',
  SCHEDULED = 'scheduled',
  THRESHOLD_BASED = 'threshold_based',
  EVENT_DRIVEN = 'event_driven',
}

/**
 * Action types for playbook steps
 */
export enum ScenarioStepActionType {
  OUTREACH = 'outreach',
  CRISIS_RESPONSE = 'crisis_response',
  GOVERNANCE = 'governance',
  REPORT_GENERATION = 'report_generation',
  MEDIA_ALERT = 'media_alert',
  REPUTATION_ACTION = 'reputation_action',
  COMPETITIVE_ANALYSIS = 'competitive_analysis',
  STAKEHOLDER_NOTIFY = 'stakeholder_notify',
  CONTENT_PUBLISH = 'content_publish',
  ESCALATION = 'escalation',
  APPROVAL_GATE = 'approval_gate',
  WAIT = 'wait',
  CONDITIONAL = 'conditional',
  CUSTOM = 'custom',
}

/**
 * Status of a scenario run
 */
export enum ScenarioRunStatus {
  PENDING = 'pending',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  AWAITING_APPROVAL = 'awaiting_approval',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Status of an individual step within a run
 */
export enum ScenarioStepStatus {
  PENDING = 'pending',
  READY = 'ready',
  APPROVED = 'approved',
  EXECUTING = 'executing',
  EXECUTED = 'executed',
  SKIPPED = 'skipped',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Risk level for playbooks and scenarios
 */
export enum ScenarioRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Event types for audit logging
 */
export enum ScenarioEventType {
  PLAYBOOK_CREATED = 'playbook_created',
  PLAYBOOK_UPDATED = 'playbook_updated',
  PLAYBOOK_ARCHIVED = 'playbook_archived',
  PLAYBOOK_ACTIVATED = 'playbook_activated',
  SCENARIO_CREATED = 'scenario_created',
  SCENARIO_UPDATED = 'scenario_updated',
  SCENARIO_SIMULATED = 'scenario_simulated',
  RUN_STARTED = 'run_started',
  RUN_PAUSED = 'run_paused',
  RUN_RESUMED = 'run_resumed',
  RUN_COMPLETED = 'run_completed',
  RUN_FAILED = 'run_failed',
  RUN_CANCELLED = 'run_cancelled',
  STEP_READY = 'step_ready',
  STEP_APPROVED = 'step_approved',
  STEP_EXECUTED = 'step_executed',
  STEP_SKIPPED = 'step_skipped',
  STEP_FAILED = 'step_failed',
}

// ============================================================================
// LABEL MAPPINGS
// ============================================================================

export const SCENARIO_TYPE_LABELS: Record<ScenarioType, string> = {
  [ScenarioType.CRISIS_SIM]: 'Crisis Simulation',
  [ScenarioType.CAMPAIGN_SIM]: 'Campaign Simulation',
  [ScenarioType.REPUTATION_SIM]: 'Reputation Simulation',
  [ScenarioType.STRATEGIC_SIM]: 'Strategic Simulation',
  [ScenarioType.OUTREACH_SIM]: 'Outreach Simulation',
  [ScenarioType.COMPETITIVE_SIM]: 'Competitive Simulation',
  [ScenarioType.CUSTOM]: 'Custom Simulation',
};

export const SCENARIO_PLAYBOOK_STATUS_LABELS: Record<ScenarioPlaybookStatus, string> = {
  [ScenarioPlaybookStatus.DRAFT]: 'Draft',
  [ScenarioPlaybookStatus.ACTIVE]: 'Active',
  [ScenarioPlaybookStatus.ARCHIVED]: 'Archived',
  [ScenarioPlaybookStatus.DEPRECATED]: 'Deprecated',
};

export const SCENARIO_TRIGGER_TYPE_LABELS: Record<ScenarioTriggerType, string> = {
  [ScenarioTriggerType.MANUAL]: 'Manual',
  [ScenarioTriggerType.SIGNAL_BASED]: 'Signal-Based',
  [ScenarioTriggerType.SCHEDULED]: 'Scheduled',
  [ScenarioTriggerType.THRESHOLD_BASED]: 'Threshold-Based',
  [ScenarioTriggerType.EVENT_DRIVEN]: 'Event-Driven',
};

export const SCENARIO_STEP_ACTION_TYPE_LABELS: Record<ScenarioStepActionType, string> = {
  [ScenarioStepActionType.OUTREACH]: 'Outreach',
  [ScenarioStepActionType.CRISIS_RESPONSE]: 'Crisis Response',
  [ScenarioStepActionType.GOVERNANCE]: 'Governance',
  [ScenarioStepActionType.REPORT_GENERATION]: 'Report Generation',
  [ScenarioStepActionType.MEDIA_ALERT]: 'Media Alert',
  [ScenarioStepActionType.REPUTATION_ACTION]: 'Reputation Action',
  [ScenarioStepActionType.COMPETITIVE_ANALYSIS]: 'Competitive Analysis',
  [ScenarioStepActionType.STAKEHOLDER_NOTIFY]: 'Stakeholder Notification',
  [ScenarioStepActionType.CONTENT_PUBLISH]: 'Content Publication',
  [ScenarioStepActionType.ESCALATION]: 'Escalation',
  [ScenarioStepActionType.APPROVAL_GATE]: 'Approval Gate',
  [ScenarioStepActionType.WAIT]: 'Wait',
  [ScenarioStepActionType.CONDITIONAL]: 'Conditional',
  [ScenarioStepActionType.CUSTOM]: 'Custom',
};

export const SCENARIO_RUN_STATUS_LABELS: Record<ScenarioRunStatus, string> = {
  [ScenarioRunStatus.PENDING]: 'Pending',
  [ScenarioRunStatus.INITIALIZING]: 'Initializing',
  [ScenarioRunStatus.RUNNING]: 'Running',
  [ScenarioRunStatus.PAUSED]: 'Paused',
  [ScenarioRunStatus.AWAITING_APPROVAL]: 'Awaiting Approval',
  [ScenarioRunStatus.COMPLETED]: 'Completed',
  [ScenarioRunStatus.FAILED]: 'Failed',
  [ScenarioRunStatus.CANCELLED]: 'Cancelled',
};

export const SCENARIO_STEP_STATUS_LABELS: Record<ScenarioStepStatus, string> = {
  [ScenarioStepStatus.PENDING]: 'Pending',
  [ScenarioStepStatus.READY]: 'Ready',
  [ScenarioStepStatus.APPROVED]: 'Approved',
  [ScenarioStepStatus.EXECUTING]: 'Executing',
  [ScenarioStepStatus.EXECUTED]: 'Executed',
  [ScenarioStepStatus.SKIPPED]: 'Skipped',
  [ScenarioStepStatus.FAILED]: 'Failed',
  [ScenarioStepStatus.CANCELLED]: 'Cancelled',
};

export const SCENARIO_RISK_LEVEL_LABELS: Record<ScenarioRiskLevel, string> = {
  [ScenarioRiskLevel.LOW]: 'Low',
  [ScenarioRiskLevel.MEDIUM]: 'Medium',
  [ScenarioRiskLevel.HIGH]: 'High',
  [ScenarioRiskLevel.CRITICAL]: 'Critical',
};

// ============================================================================
// CORE ENTITIES
// ============================================================================

/**
 * A playbook template defining a sequence of actions
 */
export interface ScenarioPlaybook {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  category: string | null;
  status: ScenarioPlaybookStatus;
  triggerType: ScenarioTriggerType;
  targetSystems: string[];
  riskLevel: ScenarioRiskLevel;
  tags: string[];
  metadata: Record<string, unknown>;
  version: number;
  parentPlaybookId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * An individual step within a playbook
 */
export interface ScenarioPlaybookStep {
  id: string;
  orgId: string;
  playbookId: string;
  stepIndex: number;
  name: string;
  description: string | null;
  actionType: ScenarioStepActionType;
  actionPayload: Record<string, unknown>;
  requiresApproval: boolean;
  approvalRoles: string[];
  waitForSignals: boolean;
  signalConditions: Record<string, unknown>;
  waitDurationMinutes: number | null;
  timeoutMinutes: number | null;
  conditionExpression: string | null;
  skipOnFailure: boolean;
  dependsOnSteps: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * A simulation scenario definition
 */
export interface Scenario {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  scenarioType: ScenarioType;
  horizonDays: number;
  status: ScenarioRunStatus;
  parameters: ScenarioParameters;
  initialState: ScenarioInitialState;
  defaultPlaybookId: string | null;
  constraints: ScenarioConstraints;
  tags: string[];
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * An execution instance of a scenario
 */
export interface ScenarioRun {
  id: string;
  orgId: string;
  scenarioId: string;
  playbookId: string | null;
  status: ScenarioRunStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  initialState: ScenarioInitialState;
  currentState: Record<string, unknown>;
  resultSummary: ScenarioResultSummary;
  riskScore: number | null;
  opportunityScore: number | null;
  confidenceScore: number | null;
  projectedMetrics: ProjectedMetricsTimeline;
  narrativeSummary: string | null;
  recommendations: ScenarioRecommendation[];
  errorMessage: string | null;
  retryCount: number;
  startedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Execution state of an individual step within a run
 */
export interface ScenarioRunStep {
  id: string;
  orgId: string;
  scenarioRunId: string;
  playbookStepId: string;
  stepIndex: number;
  status: ScenarioStepStatus;
  scheduledAt: string | null;
  readyAt: string | null;
  approvedAt: string | null;
  executedAt: string | null;
  approvedBy: string | null;
  approvalNotes: string | null;
  executionContext: ScenarioActionContext;
  outcome: ScenarioStepOutcome;
  simulatedImpact: SimulatedImpact;
  errorMessage: string | null;
  retryCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Audit log entry for scenario operations
 */
export interface ScenarioAuditLogEntry {
  id: string;
  orgId: string;
  scenarioId: string | null;
  scenarioRunId: string | null;
  playbookId: string | null;
  stepId: string | null;
  eventType: ScenarioEventType;
  eventPayload: Record<string, unknown>;
  actorId: string | null;
  actorEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// ============================================================================
// SUPPORT TYPES
// ============================================================================

/**
 * Input parameters for a simulation scenario
 */
export interface ScenarioParameters {
  // Crisis parameters
  crisisSeverity?: 'low' | 'medium' | 'high' | 'critical';
  crisisType?: string;
  crisisSource?: string;

  // Sentiment parameters
  sentimentChange?: number; // -100 to +100
  sentimentTarget?: 'brand' | 'product' | 'leadership' | 'all';

  // Coverage parameters
  coverageChange?: number; // percentage change
  mediaOutletTier?: 'tier1' | 'tier2' | 'tier3' | 'all';

  // Outreach parameters
  outreachMultiplier?: number;
  targetJournalistTier?: 'a' | 'b' | 'c' | 'all';

  // Competitive parameters
  competitorAction?: string;
  competitorIntensity?: 'low' | 'medium' | 'high';

  // Time parameters
  impactStartDay?: number;
  impactDurationDays?: number;

  // Custom parameters
  customInputs?: Record<string, unknown>;
}

/**
 * Initial state snapshot for simulation
 */
export interface ScenarioInitialState {
  // Graph metrics from S66
  graphMetrics?: {
    nodeCount: number;
    edgeCount: number;
    clusterCount: number;
    avgCentrality: number;
  };

  // Risk radar metrics from S60
  riskMetrics?: {
    overallRiskScore: number;
    reputationScore: number;
    crisisExposure: number;
    sentimentScore: number;
  };

  // Coverage metrics
  coverageMetrics?: {
    totalMentions: number;
    positiveMentions: number;
    negativeMentions: number;
    neutralMentions: number;
    shareOfVoice: number;
  };

  // Outreach metrics
  outreachMetrics?: {
    activeSequences: number;
    openRate: number;
    responseRate: number;
    conversionRate: number;
  };

  // Competitive metrics
  competitiveMetrics?: {
    marketPosition: number;
    competitorMentions: number;
    differentiationScore: number;
  };

  // Timestamp
  capturedAt?: string;

  // Raw data reference
  rawDataRef?: string;

  // Graph context from S66 (for simulation)
  graphContext?: Record<string, unknown>;

  // Metrics snapshot for simulation
  metricsSnapshot?: Record<string, unknown>;
}

/**
 * Constraints for scenario simulation
 */
export interface ScenarioConstraints {
  maxBudget?: number;
  maxTimeHours?: number;
  requiredApprovals?: string[];
  excludedActions?: ScenarioStepActionType[];
  priorityMetrics?: string[];
  riskTolerance?: ScenarioRiskLevel;
}

/**
 * Context data for action execution
 */
export interface ScenarioActionContext {
  // Current metrics at execution time
  currentMetrics?: Record<string, number>;

  // Upstream signals that triggered this step
  triggerSignals?: Array<{
    source: string;
    signal: string;
    value: unknown;
    timestamp: string;
  }>;

  // Related graph nodes from S66
  relatedNodes?: Array<{
    nodeId: string;
    nodeType: string;
    label: string;
    relevanceScore: number;
  }>;

  // Previous step outcomes
  previousOutcomes?: Record<string, unknown>;

  // Custom context
  custom?: Record<string, unknown>;
}

/**
 * Outcome of an executed step
 */
export interface ScenarioStepOutcome {
  success: boolean;
  actionTaken: string;
  affectedEntities?: Array<{
    entityType: string;
    entityId: string;
    change: string;
  }>;
  metricsImpact?: Record<string, number>;
  notes?: string;
  artifacts?: Array<{
    type: string;
    url: string;
    name: string;
  }>;
}

/**
 * Simulated impact metrics for a step or scenario
 */
export interface SimulatedImpact {
  // Risk impact
  riskScoreChange?: number;
  reputationScoreChange?: number;

  // Coverage impact
  expectedMentions?: number;
  expectedReach?: number;
  sentimentProjection?: number;

  // Outreach impact
  expectedResponses?: number;
  expectedConversions?: number;

  // Competitive impact
  shareOfVoiceChange?: number;
  positionChange?: number;

  // Timeline
  timeToImpactDays?: number;
  impactDurationDays?: number;

  // Confidence
  confidenceLevel?: number;
  assumptions?: string[];

  // Delta values for approval previews
  sentimentDelta?: number;
  coverageDelta?: number;
  engagementDelta?: number;
  riskLevelChange?: string;
}

/**
 * Timeline of projected metrics over simulation horizon
 */
export interface ProjectedMetricsTimeline {
  days: number[];
  metrics: {
    riskScore?: number[];
    reputationScore?: number[];
    sentimentScore?: number[];
    coverageVolume?: number[];
    shareOfVoice?: number[];
    engagementRate?: number[];
    custom?: Record<string, number[]>;
  };
  milestones?: Array<{
    day: number;
    event: string;
    impact: string;
  }>;
  // Additional timeline data for simulation
  timeline?: Array<{
    day: number;
    sentimentProjected: number;
    coverageProjected: number;
    riskLevel: ScenarioRiskLevel;
  }>;
  horizonDays?: number;
}

/**
 * Summary of scenario run results
 */
export interface ScenarioResultSummary {
  overallSuccess: boolean;
  stepsCompleted: number;
  stepsTotal: number;
  stepsFailed: number;
  stepsSkipped: number;
  totalDurationMinutes?: number;
  finalMetrics?: Record<string, number>;
  keyInsights?: string[];
  lessonsLearned?: string[];
}

/**
 * Recommendation from scenario simulation
 */
export interface ScenarioRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  suggestedAction: string;
  expectedImpact: SimulatedImpact | string;
  confidence: number;
  relatedPlaybookId?: string;
  relatedStepIds?: string[];
  /** Alias for suggestedAction - used by dashboard components */
  action?: string;
  /** Alias for description - used by dashboard components */
  rationale?: string;
}

// ============================================================================
// COMPOSITE TYPES
// ============================================================================

/**
 * Playbook with its steps
 */
export interface PlaybookWithSteps extends ScenarioPlaybook {
  steps: ScenarioPlaybookStep[];
}

/**
 * Scenario with its default playbook
 */
export interface ScenarioWithPlaybook extends Scenario {
  defaultPlaybook: ScenarioPlaybook | null;
}

/**
 * Run with full details including steps and scenario
 */
export interface ScenarioRunDetail extends ScenarioRun {
  scenario: Scenario;
  playbook: ScenarioPlaybook | null;
  steps: ScenarioRunStep[];
  playbookSteps: ScenarioPlaybookStep[];
}

/**
 * Step with its playbook step definition
 */
export interface RunStepWithDefinition extends ScenarioRunStep {
  playbookStep: ScenarioPlaybookStep;
}

// ============================================================================
// INPUT DTOs
// ============================================================================

/**
 * Input for creating a scenario playbook
 */
export interface CreateScenarioPlaybookInput {
  name: string;
  description?: string;
  category?: string;
  triggerType?: ScenarioTriggerType;
  targetSystems?: string[];
  riskLevel?: ScenarioRiskLevel;
  tags?: string[];
  metadata?: Record<string, unknown>;
  steps?: CreatePlaybookStepInput[];
}

/**
 * Input for creating a playbook step
 */
export interface CreatePlaybookStepInput {
  name: string;
  description?: string;
  actionType: ScenarioStepActionType;
  actionPayload?: Record<string, unknown>;
  requiresApproval?: boolean;
  approvalRoles?: string[];
  waitForSignals?: boolean;
  signalConditions?: Record<string, unknown>;
  waitDurationMinutes?: number;
  timeoutMinutes?: number;
  conditionExpression?: string;
  skipOnFailure?: boolean;
  dependsOnSteps?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating a scenario playbook
 */
export interface UpdateScenarioPlaybookInput {
  name?: string;
  description?: string | null;
  category?: string | null;
  status?: ScenarioPlaybookStatus;
  triggerType?: ScenarioTriggerType;
  targetSystems?: string[];
  riskLevel?: ScenarioRiskLevel;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating a playbook step
 */
export interface UpdatePlaybookStepInput {
  name?: string;
  description?: string | null;
  actionType?: ScenarioStepActionType;
  actionPayload?: Record<string, unknown>;
  requiresApproval?: boolean;
  approvalRoles?: string[];
  waitForSignals?: boolean;
  signalConditions?: Record<string, unknown>;
  waitDurationMinutes?: number | null;
  timeoutMinutes?: number | null;
  conditionExpression?: string | null;
  skipOnFailure?: boolean;
  dependsOnSteps?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Input for creating a scenario
 */
export interface CreateScenarioInput {
  name: string;
  description?: string;
  scenarioType: ScenarioType;
  horizonDays?: number;
  parameters?: ScenarioParameters;
  constraints?: ScenarioConstraints;
  defaultPlaybookId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Input for updating a scenario
 */
export interface UpdateScenarioInput {
  name?: string;
  description?: string | null;
  scenarioType?: ScenarioType;
  horizonDays?: number;
  parameters?: ScenarioParameters;
  constraints?: ScenarioConstraints;
  defaultPlaybookId?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Input for simulating a scenario
 */
export interface SimulateScenarioInput {
  scenarioId: string;
  playbookId?: string;
  overrideParameters?: ScenarioParameters;
  includeGraphContext?: boolean;
  includeMetricsContext?: boolean;
  generateNarrative?: boolean;
}

/**
 * Result of scenario simulation
 */
export interface SimulateScenarioResult {
  scenarioId: string;
  playbookId: string | null;
  simulationId: string;
  initialState: ScenarioInitialState;
  projectedMetrics: ProjectedMetricsTimeline;
  simulatedImpact: SimulatedImpact;
  recommendations: ScenarioRecommendation[];
  narrativeSummary: string | null;
  riskScore: number;
  opportunityScore: number;
  confidenceScore: number;
  warnings?: string[];
  simulatedAt: string;
  stepPreviews?: Array<{
    stepName: string;
    actionType: string;
    riskLevel: ScenarioRiskLevel;
    predictedOutcome: string;
  }>;
}

/**
 * Input for starting a scenario run
 */
export interface StartScenarioRunInput {
  scenarioId: string;
  playbookId?: string;
  scheduledAt?: string;
  overrideParameters?: ScenarioParameters;
  metadata?: Record<string, unknown>;
}

/**
 * Input for approving a step
 */
export interface ApproveScenarioStepInput {
  stepId: string;
  approved: boolean;
  notes?: string;
}

/**
 * Input for cancelling a run
 */
export interface CancelScenarioRunInput {
  runId: string;
  reason?: string;
}

// ============================================================================
// QUERY DTOs
// ============================================================================

/**
 * Query parameters for listing scenario playbooks
 */
export interface ScenarioListPlaybooksQuery {
  limit?: number;
  offset?: number;
  status?: ScenarioPlaybookStatus;
  triggerType?: ScenarioTriggerType;
  riskLevel?: ScenarioRiskLevel;
  category?: string;
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'risk_level';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query parameters for listing scenarios
 */
export interface ListScenariosQuery {
  limit?: number;
  offset?: number;
  scenarioType?: ScenarioType;
  status?: ScenarioRunStatus;
  search?: string;
  tags?: string[];
  playbookId?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'horizon_days';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query parameters for listing scenario runs
 */
export interface ListScenarioRunsQuery {
  limit?: number;
  offset?: number;
  scenarioId?: string;
  playbookId?: string;
  status?: ScenarioRunStatus;
  startedAfter?: string;
  startedBefore?: string;
  sortBy?: 'started_at' | 'completed_at' | 'risk_score' | 'opportunity_score';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Query parameters for listing audit logs
 */
export interface ListScenarioAuditLogsQuery {
  limit?: number;
  offset?: number;
  scenarioId?: string;
  scenarioRunId?: string;
  playbookId?: string;
  eventType?: ScenarioEventType;
  actorId?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

/**
 * Response for listing scenario playbooks
 */
export interface ScenarioListPlaybooksResponse {
  playbooks: ScenarioPlaybook[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Stats activity item for recent activity feed
 */
export interface ScenarioStatsActivityItem {
  type: 'run_completed' | 'run_started' | 'run_failed' | 'scenario_created' | 'playbook_created' | string;
  description: string;
  timestamp: string;
}

/**
 * Response for scenario playbook stats endpoint
 */
export interface ScenarioPlaybookStatsResponse {
  totalPlaybooks: number;
  activePlaybooks: number;
  totalScenarios: number;
  draftScenarios: number;
  readyScenarios: number;
  inProgressScenarios: number;
  totalRuns: number;
  runningRuns: number;
  completedRuns: number;
  failedRuns: number;
  pausedRuns: number;
  cancelledRuns: number;
  awaitingApprovalRuns: number;
  scenariosByType?: Record<string, number>;
  recentActivity?: ScenarioStatsActivityItem[];
}

/**
 * Response for listing scenarios
 */
export interface ListScenariosResponse {
  scenarios: Scenario[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response for listing scenario runs
 */
export interface ListScenarioRunsResponse {
  runs: ScenarioRun[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Response for getting scenario run detail
 */
export interface GetScenarioRunDetailResponse {
  run: ScenarioRunDetail;
  timeline: Array<{
    timestamp: string;
    event: string;
    stepId?: string;
    details?: Record<string, unknown>;
  }>;
}

/**
 * Response for listing audit logs
 */
export interface ListScenarioAuditLogsResponse {
  logs: ScenarioAuditLogEntry[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================================================
// STATS & ANALYTICS
// ============================================================================

/**
 * Scenario system statistics
 */
export interface ScenarioStats {
  totalPlaybooks: number;
  activePlaybooks: number;
  draftPlaybooks: number;
  totalScenarios: number;
  totalRuns: number;
  runsByStatus: Record<ScenarioRunStatus, number>;
  avgRunDurationMinutes: number;
  successRate: number;
  mostUsedPlaybooks: Array<{
    playbookId: string;
    playbookName: string;
    runCount: number;
  }>;
  recentRuns: ScenarioRun[];
}

/**
 * Playbook analytics
 */
export interface PlaybookAnalytics {
  playbookId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgDurationMinutes: number;
  avgStepsCompleted: number;
  mostCommonFailureStep?: string;
  avgRiskScoreReduction: number;
  avgOpportunityScoreIncrease: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Color mapping for risk levels
 */
export const RISK_LEVEL_COLORS: Record<ScenarioRiskLevel, string> = {
  [ScenarioRiskLevel.LOW]: 'green',
  [ScenarioRiskLevel.MEDIUM]: 'yellow',
  [ScenarioRiskLevel.HIGH]: 'orange',
  [ScenarioRiskLevel.CRITICAL]: 'red',
};

/**
 * Color mapping for run statuses
 */
export const RUN_STATUS_COLORS: Record<ScenarioRunStatus, string> = {
  [ScenarioRunStatus.PENDING]: 'gray',
  [ScenarioRunStatus.INITIALIZING]: 'blue',
  [ScenarioRunStatus.RUNNING]: 'blue',
  [ScenarioRunStatus.PAUSED]: 'yellow',
  [ScenarioRunStatus.AWAITING_APPROVAL]: 'orange',
  [ScenarioRunStatus.COMPLETED]: 'green',
  [ScenarioRunStatus.FAILED]: 'red',
  [ScenarioRunStatus.CANCELLED]: 'gray',
};

/**
 * Color mapping for step statuses
 */
export const STEP_STATUS_COLORS: Record<ScenarioStepStatus, string> = {
  [ScenarioStepStatus.PENDING]: 'gray',
  [ScenarioStepStatus.READY]: 'blue',
  [ScenarioStepStatus.APPROVED]: 'green',
  [ScenarioStepStatus.EXECUTING]: 'blue',
  [ScenarioStepStatus.EXECUTED]: 'green',
  [ScenarioStepStatus.SKIPPED]: 'yellow',
  [ScenarioStepStatus.FAILED]: 'red',
  [ScenarioStepStatus.CANCELLED]: 'gray',
};

/**
 * Icon mapping for action types
 */
export const ACTION_TYPE_ICONS: Record<ScenarioStepActionType, string> = {
  [ScenarioStepActionType.OUTREACH]: 'send',
  [ScenarioStepActionType.CRISIS_RESPONSE]: 'alert-triangle',
  [ScenarioStepActionType.GOVERNANCE]: 'shield',
  [ScenarioStepActionType.REPORT_GENERATION]: 'file-text',
  [ScenarioStepActionType.MEDIA_ALERT]: 'bell',
  [ScenarioStepActionType.REPUTATION_ACTION]: 'star',
  [ScenarioStepActionType.COMPETITIVE_ANALYSIS]: 'bar-chart-2',
  [ScenarioStepActionType.STAKEHOLDER_NOTIFY]: 'users',
  [ScenarioStepActionType.CONTENT_PUBLISH]: 'edit-3',
  [ScenarioStepActionType.ESCALATION]: 'arrow-up-circle',
  [ScenarioStepActionType.APPROVAL_GATE]: 'check-circle',
  [ScenarioStepActionType.WAIT]: 'clock',
  [ScenarioStepActionType.CONDITIONAL]: 'git-branch',
  [ScenarioStepActionType.CUSTOM]: 'settings',
};

/**
 * Predefined playbook categories
 */
export const PLAYBOOK_CATEGORIES = [
  'crisis-management',
  'reputation-recovery',
  'product-launch',
  'investor-relations',
  'media-outreach',
  'competitive-response',
  'stakeholder-engagement',
  'regulatory-compliance',
  'brand-building',
  'thought-leadership',
  'custom',
] as const;

export type PlaybookCategory = (typeof PLAYBOOK_CATEGORIES)[number];

/**
 * Predefined target systems
 */
export const TARGET_SYSTEMS = [
  'crisis',
  'reputation',
  'outreach',
  'media-monitoring',
  'competitive-intelligence',
  'content',
  'governance',
  'reporting',
  'alerts',
  'investor-relations',
] as const;

export type TargetSystem = (typeof TARGET_SYSTEMS)[number];

// ============================================================================
// TYPE ALIASES (for service compatibility)
// ============================================================================

/** Alias for ProjectedMetricsTimeline */
export type ProjectedMetrics = ProjectedMetricsTimeline;

/** Alias for SimulateScenarioResult */
export type SimulationResult = SimulateScenarioResult;

/** Alias for ScenarioRunDetail */
export type RunWithDetails = ScenarioRunDetail;
