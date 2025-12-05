/**
 * AI Scenario Simulation Engine Types (Sprint S71)
 *
 * Autonomous multi-agent simulation engine for crisis, investor,
 * and strategic scenario planning with multi-role dialogues.
 */

// ============================================================================
// ENUMS / LITERAL TYPES
// ============================================================================

/**
 * Simulation execution modes
 */
export type AISimulationMode = 'single_run' | 'multi_run' | 'what_if';

export const AI_SIMULATION_MODES: AISimulationMode[] = [
  'single_run',
  'multi_run',
  'what_if',
];

export const AI_SIMULATION_MODE_LABELS: Record<AISimulationMode, string> = {
  single_run: 'Single Run',
  multi_run: 'Multi-Run Comparison',
  what_if: 'What-If Exploration',
};

export const AI_SIMULATION_MODE_DESCRIPTIONS: Record<AISimulationMode, string> = {
  single_run: 'Execute a single simulation run with defined parameters',
  multi_run: 'Run multiple parallel simulations for comparison analysis',
  what_if: 'Explore branching scenarios with user intervention points',
};

/**
 * Simulation lifecycle status
 */
export type AISimulationStatus =
  | 'draft'
  | 'configured'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'archived';

export const AI_SIMULATION_STATUSES: AISimulationStatus[] = [
  'draft',
  'configured',
  'running',
  'paused',
  'completed',
  'failed',
  'archived',
];

export const AI_SIMULATION_STATUS_LABELS: Record<AISimulationStatus, string> = {
  draft: 'Draft',
  configured: 'Configured',
  running: 'Running',
  paused: 'Paused',
  completed: 'Completed',
  failed: 'Failed',
  archived: 'Archived',
};

/**
 * Individual run status
 */
export type AIRunStatus =
  | 'starting'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'aborted';

export const AI_RUN_STATUSES: AIRunStatus[] = [
  'starting',
  'in_progress',
  'completed',
  'failed',
  'aborted',
];

export const AI_RUN_STATUS_LABELS: Record<AIRunStatus, string> = {
  starting: 'Starting',
  in_progress: 'In Progress',
  completed: 'Completed',
  failed: 'Failed',
  aborted: 'Aborted',
};

/**
 * Agent role types in simulations
 */
export type AIAgentRoleType =
  | 'internal_exec'
  | 'journalist'
  | 'investor'
  | 'customer'
  | 'employee'
  | 'regulator'
  | 'market_analyst'
  | 'system'
  | 'critic';

export const AI_AGENT_ROLE_TYPES: AIAgentRoleType[] = [
  'internal_exec',
  'journalist',
  'investor',
  'customer',
  'employee',
  'regulator',
  'market_analyst',
  'system',
  'critic',
];

export const AI_AGENT_ROLE_TYPE_LABELS: Record<AIAgentRoleType, string> = {
  internal_exec: 'Internal Executive',
  journalist: 'Journalist',
  investor: 'Investor',
  customer: 'Customer',
  employee: 'Employee',
  regulator: 'Regulator',
  market_analyst: 'Market Analyst',
  system: 'System Narrator',
  critic: 'Devil\'s Advocate',
};

export const AI_AGENT_ROLE_TYPE_ICONS: Record<AIAgentRoleType, string> = {
  internal_exec: 'briefcase',
  journalist: 'newspaper',
  investor: 'trending-up',
  customer: 'user',
  employee: 'users',
  regulator: 'shield',
  market_analyst: 'bar-chart',
  system: 'cpu',
  critic: 'message-circle',
};

/**
 * Communication channels for scenario turns
 */
export type AIScenarioChannelType =
  | 'press'
  | 'email'
  | 'social'
  | 'internal_meeting'
  | 'board'
  | 'investor_call'
  | 'public_statement'
  | 'private_message'
  | 'analyst_report';

export const AI_SCENARIO_CHANNELS: AIScenarioChannelType[] = [
  'press',
  'email',
  'social',
  'internal_meeting',
  'board',
  'investor_call',
  'public_statement',
  'private_message',
  'analyst_report',
];

export const AI_SCENARIO_CHANNEL_LABELS: Record<AIScenarioChannelType, string> = {
  press: 'Press Release',
  email: 'Email',
  social: 'Social Media',
  internal_meeting: 'Internal Meeting',
  board: 'Board Communication',
  investor_call: 'Investor Call',
  public_statement: 'Public Statement',
  private_message: 'Private Message',
  analyst_report: 'Analyst Report',
};

/**
 * Simulation objective types
 */
export type AIScenarioObjectiveType =
  | 'crisis_comms'
  | 'investor_relations'
  | 'reputation'
  | 'go_to_market'
  | 'regulatory'
  | 'competitive'
  | 'earnings'
  | 'leadership_change'
  | 'm_and_a'
  | 'custom';

export const AI_SCENARIO_OBJECTIVES: AIScenarioObjectiveType[] = [
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
];

export const AI_SCENARIO_OBJECTIVE_LABELS: Record<AIScenarioObjectiveType, string> = {
  crisis_comms: 'Crisis Communications',
  investor_relations: 'Investor Relations',
  reputation: 'Reputation Management',
  go_to_market: 'Go-to-Market',
  regulatory: 'Regulatory Response',
  competitive: 'Competitive Response',
  earnings: 'Earnings Preparation',
  leadership_change: 'Leadership Change',
  m_and_a: 'M&A Communications',
  custom: 'Custom Objective',
};

export const AI_SCENARIO_OBJECTIVE_DESCRIPTIONS: Record<AIScenarioObjectiveType, string> = {
  crisis_comms: 'Simulate crisis scenarios and communication strategies',
  investor_relations: 'Prepare for investor Q&A and stakeholder communications',
  reputation: 'Model reputation impact and response strategies',
  go_to_market: 'Simulate product launch and market entry scenarios',
  regulatory: 'Plan responses to regulatory inquiries or changes',
  competitive: 'Analyze competitive threats and response options',
  earnings: 'Prepare for earnings calls and analyst questions',
  leadership_change: 'Navigate executive transitions and communications',
  m_and_a: 'Simulate merger/acquisition communication scenarios',
  custom: 'Define a custom simulation objective',
};

/**
 * Risk levels for outcomes and runs
 */
export type AIScenarioRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const AI_SCENARIO_RISK_LEVELS: AIScenarioRiskLevel[] = [
  'low',
  'medium',
  'high',
  'critical',
];

export const AI_SCENARIO_RISK_LEVEL_LABELS: Record<AIScenarioRiskLevel, string> = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  critical: 'Critical Risk',
};

export const AI_SCENARIO_RISK_LEVEL_COLORS: Record<AIScenarioRiskLevel, string> = {
  low: 'green',
  medium: 'yellow',
  high: 'orange',
  critical: 'red',
};

/**
 * Outcome types
 */
export type AIScenarioOutcomeType = 'risk' | 'opportunity' | 'neutral';

export const AI_SCENARIO_OUTCOME_TYPES: AIScenarioOutcomeType[] = [
  'risk',
  'opportunity',
  'neutral',
];

export const AI_SCENARIO_OUTCOME_TYPE_LABELS: Record<AIScenarioOutcomeType, string> = {
  risk: 'Risk',
  opportunity: 'Opportunity',
  neutral: 'Neutral',
};

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Agent configuration within a simulation
 */
export interface AIAgentConfig {
  style?: string;
  tone?: string;
  priorities?: string[];
  constraints?: string[];
  responseLength?: 'brief' | 'moderate' | 'detailed';
  aggressiveness?: number; // 0-1 scale
  customInstructions?: string;
}

/**
 * Simulation configuration
 */
export interface AISimulationConfig {
  timeHorizonHours?: number;
  maxStepsPerRun?: number;
  constraints?: string[];
  focusAreas?: string[];
  excludeTopics?: string[];
  temperature?: number;
  agentConfigs?: Record<string, AIAgentConfig>;
  enableAutoProgress?: boolean;
  convergenceCriteria?: string[];
}

/**
 * Persona reference for agents
 */
export interface AIAgentPersonaRef {
  personaId?: string;
  personaSnapshot?: {
    name?: string;
    demographics?: Record<string, unknown>;
    psychographics?: Record<string, unknown>;
    behaviors?: string[];
  };
}

/**
 * Turn metadata
 */
export interface AIScenarioTurnMetadata {
  toolsUsed?: string[];
  sourcesReferenced?: string[];
  sentimentScore?: number;
  keyTopics?: string[];
  llmModel?: string;
  tokenCount?: number;
  promptTokens?: number;
  completionTokens?: number;
  generationTimeMs?: number;
}

/**
 * Recommended action from outcome
 */
export interface AIScenarioRecommendedAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  rationale?: string;
  assignee?: string;
  timeline?: string;
}

/**
 * Run summary structure
 */
export interface AIScenarioRunSummary {
  keyInsights?: string[];
  criticalMoments?: Array<{
    stepIndex: number;
    description: string;
    impact: string;
  }>;
  agentSummaries?: Record<string, {
    turnCount: number;
    primaryThemes: string[];
    sentiment: string;
  }>;
  overallAssessment?: string;
  riskProgression?: Array<{
    stepIndex: number;
    riskLevel: AIScenarioRiskLevel;
  }>;
}

// ============================================================================
// CONTEXT INTEGRATION TYPES
// ============================================================================

/**
 * Snapshot of context from upstream intelligence systems
 */
export interface AIContextSnapshot {
  capturedAt: Date;

  // S60: Risk Radar
  riskRadarSnapshot?: {
    overallRiskScore?: number;
    topRisks?: Array<{
      id: string;
      title: string;
      severity: string;
      category: string;
    }>;
    trendDirection?: 'improving' | 'stable' | 'worsening';
  };

  // S66: Unified Intelligence Graph
  unifiedGraphContext?: {
    relevantNodes?: Array<{
      id: string;
      nodeType: string;
      label: string;
      importance?: number;
    }>;
    keyRelationships?: Array<{
      sourceId: string;
      targetId: string;
      edgeType: string;
    }>;
    clusterSummary?: string;
  };

  // S70: Unified Narrative
  narrativeContext?: {
    latestNarrativeId?: string;
    keyThemes?: string[];
    strategicPriorities?: string[];
    currentPositioning?: string;
  };

  // S65: Strategic Intelligence
  strategicIntelContext?: {
    marketTrends?: string[];
    competitivePositioning?: string;
    opportunities?: string[];
    threats?: string[];
  };

  // S53: Competitive Intelligence
  competitiveContext?: {
    topCompetitors?: Array<{
      id: string;
      name: string;
      threatLevel?: string;
    }>;
    recentCompetitorMoves?: string[];
  };

  // S56: Brand Reputation
  reputationContext?: {
    overallSentiment?: number;
    sentimentTrend?: 'improving' | 'stable' | 'declining';
    keyIssues?: string[];
    positiveDrivers?: string[];
  };

  // S55: Crisis Engine
  crisisContext?: {
    activeIncidents?: Array<{
      id: string;
      title: string;
      severity: string;
    }>;
    escalationRisk?: string;
  };
}

/**
 * Source references for simulation seeding
 */
export interface AIScenarioSeedSource {
  sourceType: 'playbook' | 'narrative' | 'risk_snapshot' | 'crisis_incident' | 'custom';
  sourceId?: string;
  sourceName?: string;
  snapshotData?: Record<string, unknown>;
}

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

/**
 * AI Scenario Simulation entity
 */
export interface AIScenarioSimulation {
  id: string;
  orgId: string;

  // Basic info
  name: string;
  description?: string;

  // Configuration
  linkedPlaybookId?: string;
  simulationMode: AISimulationMode;
  objectiveType: AIScenarioObjectiveType;
  status: AISimulationStatus;
  config: AISimulationConfig;

  // Tracking
  createdBy?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;

  // Computed/joined fields (optional)
  runCount?: number;
  lastRunAt?: Date;
  lastRunStatus?: AIRunStatus;
  linkedPlaybookName?: string;
}

/**
 * AI Scenario Run entity
 */
export interface AIScenarioRun {
  id: string;
  orgId: string;
  simulationId: string;

  // Run identification
  runLabel?: string;
  runNumber: number;

  // Context
  seedContext: AIContextSnapshot;
  seedSources?: AIScenarioSeedSource[];

  // Execution status
  status: AIRunStatus;
  stepCount: number;
  maxSteps: number;
  currentStep: number;

  // Risk assessment
  riskLevel?: AIScenarioRiskLevel;

  // Summary
  summary?: AIScenarioRunSummary;

  // Error tracking
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;

  // Timestamps
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Computed/joined fields
  agentCount?: number;
  turnCount?: number;
  simulationName?: string;
}

/**
 * AI Scenario Agent entity
 */
export interface AIScenarioAgent {
  id: string;
  orgId: string;
  simulationId: string;
  runId?: string;

  // Identity
  agentKey: string;
  displayName: string;
  roleType: AIAgentRoleType;

  // Persona
  personaRef?: AIAgentPersonaRef;

  // Configuration
  config: AIAgentConfig;
  isActive: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Computed fields
  turnCount?: number;
}

/**
 * AI Scenario Turn entity
 */
export interface AIScenarioTurn {
  id: string;
  orgId: string;
  runId: string;

  // Positioning
  stepIndex: number;
  turnOrder: number;

  // Participants
  speakerAgentId: string;
  targetAgentId?: string;

  // Communication
  channel: AIScenarioChannelType;
  content: string;

  // Metadata
  metadata?: AIScenarioTurnMetadata;

  // Timestamps
  createdAt: Date;

  // Joined fields
  speakerAgent?: AIScenarioAgent;
  targetAgent?: AIScenarioAgent;
}

/**
 * AI Scenario Metric entity
 */
export interface AIScenarioMetric {
  id: string;
  orgId: string;
  runId: string;

  // Identification
  metricKey: string;
  metricLabel: string;
  metricCategory?: string;

  // Values
  valueNumeric?: number;
  valueJson?: Record<string, unknown>;

  // Context
  stepIndex?: number;

  // Timestamps
  computedAt: Date;
}

/**
 * AI Scenario Outcome entity
 */
export interface AIScenarioOutcome {
  id: string;
  orgId: string;
  runId: string;

  // Classification
  outcomeType: AIScenarioOutcomeType;
  riskLevel: AIScenarioRiskLevel;

  // Content
  title: string;
  description?: string;

  // Recommendations
  recommendedActions?: AIScenarioRecommendedAction[];

  // Links
  linkedPlaybookStepIds?: string[];

  // Confidence
  confidenceScore?: number;

  // Timestamps
  createdAt: Date;
}

/**
 * AI Scenario Audit Log Entry
 */
export interface AIScenarioAuditLogEntry {
  id: string;
  orgId: string;
  simulationId?: string;
  runId?: string;

  // Event
  eventType: string;
  actorId?: string;

  // Details
  details?: {
    description?: string;
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
    llmModel?: string;
    tokenUsage?: {
      prompt: number;
      completion: number;
    };
    durationMs?: number;
    errorMessage?: string;
  };

  // Timestamps
  createdAt: Date;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create simulation input
 */
export interface CreateAISimulationInput {
  name: string;
  description?: string;
  linkedPlaybookId?: string;
  simulationMode?: AISimulationMode;
  objectiveType?: AIScenarioObjectiveType;
  config?: AISimulationConfig;
}

/**
 * Update simulation input
 */
export interface UpdateAISimulationInput {
  name?: string;
  description?: string | null;
  linkedPlaybookId?: string | null;
  simulationMode?: AISimulationMode;
  objectiveType?: AIScenarioObjectiveType;
  status?: AISimulationStatus;
  config?: AISimulationConfig;
}

/**
 * List simulations query
 */
export interface ListAISimulationsQuery {
  search?: string;
  status?: AISimulationStatus;
  objectiveType?: AIScenarioObjectiveType;
  simulationMode?: AISimulationMode;
  linkedPlaybookId?: string;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * List simulations response
 */
export interface ListAISimulationsResponse {
  simulations: AIScenarioSimulation[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Agent definition input for simulation setup
 */
export interface AIAgentDefinitionInput {
  agentKey: string;
  displayName: string;
  roleType: AIAgentRoleType;
  personaRef?: AIAgentPersonaRef;
  config?: AIAgentConfig;
  isActive?: boolean;
}

/**
 * Start simulation run input
 */
export interface StartSimulationRunInput {
  runLabel?: string;
  maxSteps?: number;
  agents?: AIAgentDefinitionInput[];
  seedSources?: AIScenarioSeedSource[];
  customContext?: Partial<AIContextSnapshot>;
  startImmediately?: boolean;
}

/**
 * Simulation run detail response
 */
export interface AISimulationRunDetailResponse {
  run: AIScenarioRun;
  agents: AIScenarioAgent[];
  recentTurns: AIScenarioTurn[];
  metrics: AIScenarioMetric[];
  outcomes: AIScenarioOutcome[];
}

/**
 * Step run input
 */
export interface StepRunInput {
  agentId?: string; // Specific agent to act, or auto-select
  userGuidance?: string; // Optional guidance for this step
  skipAgent?: boolean; // Skip current agent
}

/**
 * Step run response
 */
export interface StepRunResponse {
  run: AIScenarioRun;
  newTurn?: AIScenarioTurn;
  newMetrics?: AIScenarioMetric[];
  isComplete: boolean;
  nextAgentId?: string;
}

/**
 * Post agent feedback input
 */
export interface PostAgentFeedbackInput {
  feedbackType: 'constraint' | 'guidance' | 'correction' | 'preference';
  content: string;
  targetAgentId?: string;
  applyToFutureSteps?: boolean;
}

/**
 * Post agent feedback response
 */
export interface PostAgentFeedbackResponse {
  success: boolean;
  appliedTo: string[]; // Agent IDs affected
  message: string;
}

/**
 * List run turns query
 */
export interface ListRunTurnsQuery {
  speakerAgentId?: string;
  channel?: AIScenarioChannelType;
  stepIndex?: number;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * List run turns response
 */
export interface ListRunTurnsResponse {
  turns: AIScenarioTurn[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List run metrics query
 */
export interface ListRunMetricsQuery {
  metricKey?: string;
  metricCategory?: string;
  stepIndex?: number;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * List run metrics response
 */
export interface ListRunMetricsResponse {
  metrics: AIScenarioMetric[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List run outcomes query
 */
export interface ListRunOutcomesQuery {
  outcomeType?: AIScenarioOutcomeType;
  riskLevel?: AIScenarioRiskLevel;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * List run outcomes response
 */
export interface ListRunOutcomesResponse {
  outcomes: AIScenarioOutcome[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List runs for simulation query
 */
export interface ListSimulationRunsQuery {
  status?: AIRunStatus;
  riskLevel?: AIScenarioRiskLevel;
  sortBy?: 'run_number' | 'created_at' | 'started_at' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * List runs for simulation response
 */
export interface ListSimulationRunsResponse {
  runs: AIScenarioRun[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Archive simulation response
 */
export interface ArchiveSimulationResponse {
  success: boolean;
  simulation: AIScenarioSimulation;
}

/**
 * Run until converged input
 */
export interface RunUntilConvergedInput {
  maxSteps?: number;
  convergenceCriteria?: string[];
  pauseOnHighRisk?: boolean;
}

/**
 * Run until converged response
 */
export interface RunUntilConvergedResponse {
  run: AIScenarioRun;
  stepsExecuted: number;
  converged: boolean;
  convergenceReason?: string;
  finalRiskLevel: AIScenarioRiskLevel;
}

/**
 * Compute run metrics input
 */
export interface ComputeRunMetricsInput {
  metricKeys?: string[];
  includeHistorical?: boolean;
}

/**
 * Summarize outcomes input
 */
export interface SummarizeOutcomesInput {
  generateNarrative?: boolean;
  includeRecommendations?: boolean;
  targetAudience?: 'executive' | 'technical' | 'board';
}

/**
 * Summarize outcomes response
 */
export interface SummarizeOutcomesResponse {
  outcomes: AIScenarioOutcome[];
  narrativeSummary?: string;
  overallRiskLevel: AIScenarioRiskLevel;
  topRecommendations: AIScenarioRecommendedAction[];
}

// ============================================================================
// STATISTICS TYPES
// ============================================================================

/**
 * Simulation statistics
 */
export interface AIScenarioSimulationStats {
  totalSimulations: number;
  byStatus: Record<AISimulationStatus, number>;
  byObjective: Record<AIScenarioObjectiveType, number>;
  byMode: Record<AISimulationMode, number>;
  totalRuns: number;
  completedRuns: number;
  averageStepsPerRun: number;
  riskDistribution: Record<AIScenarioRiskLevel, number>;
}

/**
 * Run statistics
 */
export interface AIScenarioRunStats {
  runId: string;
  totalTurns: number;
  agentParticipation: Record<string, number>;
  channelDistribution: Record<AIScenarioChannelType, number>;
  riskProgression: Array<{
    stepIndex: number;
    riskLevel: AIScenarioRiskLevel;
    timestamp: Date;
  }>;
  metricsSummary: Record<string, {
    min: number;
    max: number;
    avg: number;
    latest: number;
  }>;
  outcomesSummary: {
    risks: number;
    opportunities: number;
    neutral: number;
  };
}

// ============================================================================
// PRESET AGENT TEMPLATES
// ============================================================================

/**
 * Preset agent templates for common scenarios
 */
export interface AIAgentPreset {
  agentKey: string;
  displayName: string;
  roleType: AIAgentRoleType;
  defaultConfig: AIAgentConfig;
  description: string;
  suitableFor: AIScenarioObjectiveType[];
}

export const AI_AGENT_PRESETS: AIAgentPreset[] = [
  {
    agentKey: 'ceo',
    displayName: 'CEO',
    roleType: 'internal_exec',
    defaultConfig: {
      style: 'strategic',
      tone: 'confident',
      priorities: ['shareholder value', 'long-term vision', 'team morale'],
      responseLength: 'moderate',
    },
    description: 'Chief Executive Officer perspective',
    suitableFor: ['crisis_comms', 'investor_relations', 'earnings', 'leadership_change', 'm_and_a'],
  },
  {
    agentKey: 'cfo',
    displayName: 'CFO',
    roleType: 'internal_exec',
    defaultConfig: {
      style: 'analytical',
      tone: 'measured',
      priorities: ['financial performance', 'risk management', 'investor confidence'],
      responseLength: 'detailed',
    },
    description: 'Chief Financial Officer perspective',
    suitableFor: ['investor_relations', 'earnings', 'm_and_a'],
  },
  {
    agentKey: 'cmo',
    displayName: 'CMO',
    roleType: 'internal_exec',
    defaultConfig: {
      style: 'creative',
      tone: 'optimistic',
      priorities: ['brand perception', 'market positioning', 'customer engagement'],
      responseLength: 'moderate',
    },
    description: 'Chief Marketing Officer perspective',
    suitableFor: ['reputation', 'go_to_market', 'competitive'],
  },
  {
    agentKey: 'journalist_nyt',
    displayName: 'NYT Business Reporter',
    roleType: 'journalist',
    defaultConfig: {
      style: 'investigative',
      tone: 'skeptical',
      priorities: ['truth', 'public interest', 'story impact'],
      aggressiveness: 0.7,
      responseLength: 'detailed',
    },
    description: 'Major newspaper business reporter',
    suitableFor: ['crisis_comms', 'reputation', 'm_and_a'],
  },
  {
    agentKey: 'activist_investor',
    displayName: 'Activist Investor',
    roleType: 'investor',
    defaultConfig: {
      style: 'aggressive',
      tone: 'demanding',
      priorities: ['shareholder returns', 'governance', 'operational efficiency'],
      aggressiveness: 0.9,
      responseLength: 'moderate',
    },
    description: 'Activist shareholder seeking changes',
    suitableFor: ['investor_relations', 'm_and_a', 'leadership_change'],
  },
  {
    agentKey: 'institutional_investor',
    displayName: 'Institutional Investor',
    roleType: 'investor',
    defaultConfig: {
      style: 'analytical',
      tone: 'professional',
      priorities: ['long-term value', 'risk-adjusted returns', 'ESG'],
      aggressiveness: 0.3,
      responseLength: 'detailed',
    },
    description: 'Long-term institutional shareholder',
    suitableFor: ['investor_relations', 'earnings', 'm_and_a'],
  },
  {
    agentKey: 'regulator',
    displayName: 'Regulatory Official',
    roleType: 'regulator',
    defaultConfig: {
      style: 'formal',
      tone: 'neutral',
      priorities: ['compliance', 'public protection', 'fair markets'],
      responseLength: 'detailed',
    },
    description: 'Government regulatory agency representative',
    suitableFor: ['regulatory', 'crisis_comms', 'm_and_a'],
  },
  {
    agentKey: 'analyst',
    displayName: 'Wall Street Analyst',
    roleType: 'market_analyst',
    defaultConfig: {
      style: 'analytical',
      tone: 'neutral',
      priorities: ['financial metrics', 'market trends', 'competitive positioning'],
      responseLength: 'detailed',
    },
    description: 'Equity research analyst',
    suitableFor: ['earnings', 'investor_relations', 'competitive', 'm_and_a'],
  },
  {
    agentKey: 'customer_enterprise',
    displayName: 'Enterprise Customer',
    roleType: 'customer',
    defaultConfig: {
      style: 'pragmatic',
      tone: 'concerned',
      priorities: ['service continuity', 'partnership stability', 'value'],
      responseLength: 'brief',
    },
    description: 'Major B2B customer',
    suitableFor: ['crisis_comms', 'leadership_change', 'm_and_a'],
  },
  {
    agentKey: 'employee_senior',
    displayName: 'Senior Employee',
    roleType: 'employee',
    defaultConfig: {
      style: 'candid',
      tone: 'anxious',
      priorities: ['job security', 'company culture', 'career growth'],
      responseLength: 'moderate',
    },
    description: 'Long-tenured senior employee',
    suitableFor: ['leadership_change', 'm_and_a', 'crisis_comms'],
  },
  {
    agentKey: 'devils_advocate',
    displayName: 'Devil\'s Advocate',
    roleType: 'critic',
    defaultConfig: {
      style: 'contrarian',
      tone: 'challenging',
      priorities: ['stress testing', 'finding weaknesses', 'alternative perspectives'],
      aggressiveness: 0.8,
      responseLength: 'moderate',
    },
    description: 'Internal critic to stress-test strategies',
    suitableFor: ['crisis_comms', 'investor_relations', 'go_to_market', 'regulatory'],
  },
  {
    agentKey: 'narrator',
    displayName: 'Scenario Narrator',
    roleType: 'system',
    defaultConfig: {
      style: 'objective',
      tone: 'neutral',
      priorities: ['clarity', 'context', 'progression'],
      responseLength: 'brief',
    },
    description: 'System narrator providing context and transitions',
    suitableFor: ['crisis_comms', 'investor_relations', 'reputation', 'go_to_market', 'regulatory', 'competitive', 'earnings', 'leadership_change', 'm_and_a', 'custom'],
  },
];

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Agent selection for a step
 */
export interface AgentSelectionContext {
  runId: string;
  currentStep: number;
  availableAgents: AIScenarioAgent[];
  recentTurns: AIScenarioTurn[];
  preferredChannel?: AIScenarioChannelType;
}

/**
 * LLM generation context for agent turns
 */
export interface AgentTurnGenerationContext {
  agent: AIScenarioAgent;
  simulation: AIScenarioSimulation;
  run: AIScenarioRun;
  recentTurns: AIScenarioTurn[];
  contextSnapshot: AIContextSnapshot;
  targetAgent?: AIScenarioAgent;
  userGuidance?: string;
}

/**
 * Metric computation context
 */
export interface MetricComputationContext {
  run: AIScenarioRun;
  turns: AIScenarioTurn[];
  agents: AIScenarioAgent[];
  existingMetrics: AIScenarioMetric[];
}

/**
 * Outcome generation context
 */
export interface OutcomeGenerationContext {
  run: AIScenarioRun;
  turns: AIScenarioTurn[];
  metrics: AIScenarioMetric[];
  simulation: AIScenarioSimulation;
}
