/**
 * Agent system types for Pravado's multi-agent runtime
 * This is a foundation layer - full runtime implementation happens in S4+
 */

import type { UUID } from './common';

/**
 * Agent capabilities and metadata
 */
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  category: 'pr' | 'content' | 'seo' | 'general';
  capabilities: string[]; // e.g., ['research', 'writing', 'analysis']
  requiredInputs: string[]; // required fields in task input
  outputSchema: Record<string, unknown>; // JSON schema for output
  estimatedDuration?: string; // e.g., '2-5 minutes'
  metadata?: Record<string, unknown>;
}

/**
 * Task input for agent execution
 */
export interface AgentTask<TInput = Record<string, unknown>> {
  id: UUID;
  agentId: string;
  input: TInput;
  context?: {
    orgId: UUID;
    userId: UUID;
    playbookId?: UUID;
    [key: string]: unknown;
  };
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
}

/**
 * Agent execution result
 */
export interface AgentResult<TOutput = Record<string, unknown>> {
  taskId: UUID;
  agentId: string;
  status: 'success' | 'failure' | 'partial';
  output?: TOutput;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metrics?: {
    startedAt: string;
    completedAt: string;
    durationMs: number;
    tokensUsed?: number;
    cost?: number;
  };
  artifacts?: {
    type: string; // 'document', 'report', 'data', 'analysis'
    url?: string;
    data?: unknown;
  }[];
}

/**
 * Playbook node in workflow DAG
 */
export interface PlaybookNode {
  id: string;
  agentId: string;
  label?: string;
  input: Record<string, unknown> | string; // static input or reference to previous node output
  dependsOn?: string[]; // array of node IDs that must complete first
  condition?: {
    // conditional execution based on previous results
    nodeId: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value?: unknown;
  };
  retryPolicy?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

/**
 * Complete playbook definition
 */
export interface PlaybookTemplate {
  id: UUID;
  name: string;
  description: string;
  category: 'pr' | 'content' | 'seo' | 'general';
  nodes: PlaybookNode[];
  expectedOutputs: string[]; // what this playbook produces
  estimatedDuration?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  isPublic: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Playbook version for tracking changes
 */
export interface PlaybookVersion {
  id: UUID;
  playbookId: UUID;
  version: number;
  nodes: PlaybookNode[];
  changelog?: string;
  createdBy: UUID;
  createdAt: string;
  isActive: boolean;
}

/**
 * Playbook execution instance
 */
export interface PlaybookExecution {
  id: UUID;
  playbookId: UUID;
  orgId: UUID;
  userId: UUID;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  currentNodeId?: string;
  results: Record<string, AgentResult>; // nodeId -> result mapping
  startedAt?: string;
  completedAt?: string;
  error?: {
    code: string;
    message: string;
    nodeId?: string;
  };
}

/**
 * API response types for agents
 */
export interface ListAgentsResponse {
  success: boolean;
  data?: {
    agents: AgentDefinition[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ListPlaybooksLegacyResponse {
  success: boolean;
  data?: {
    playbooks: PlaybookTemplate[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ValidatePlaybookResponse {
  success: boolean;
  data?: {
    valid: boolean;
    errors?: Array<{
      nodeId?: string;
      field?: string;
      message: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ========================================
// PLAYBOOK RUNTIME TYPES (Sprint S7)
// ========================================

/**
 * Playbook status enum
 */
export type PlaybookStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'DEPRECATED';

/**
 * Playbook run status enum
 */
export type PlaybookRunStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';

/**
 * Playbook step run status enum
 */
export type PlaybookStepRunStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'SKIPPED';

/**
 * Playbook step type enum
 */
export type PlaybookStepType = 'AGENT' | 'DATA' | 'BRANCH' | 'API';

/**
 * Playbook entity (DB-backed)
 */
export interface Playbook {
  id: string;
  orgId: string;
  name: string;
  version: number;
  status: PlaybookStatus;
  inputSchema: unknown | null;
  outputSchema: unknown | null;
  timeoutSeconds: number | null;
  maxRetries: number;
  tags: string[] | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Playbook step entity (DB-backed)
 */
export interface PlaybookStep {
  id: string;
  orgId: string;
  playbookId: string;
  key: string;
  name: string;
  type: PlaybookStepType;
  config: Record<string, unknown>;
  position: number;
  nextStepKey: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Playbook run entity (DB-backed execution instance)
 */
export interface PlaybookRun {
  id: string;
  playbookId: string;
  orgId: string;
  status: PlaybookRunStatus;
  triggeredBy: string | null;
  input: unknown;
  output: unknown;
  error: unknown;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Playbook step run entity (DB-backed step execution instance)
 */
export interface PlaybookStepRun {
  id: string;
  runId: string;
  playbookId: string;
  orgId: string;
  stepId: string;
  stepKey: string;
  status: PlaybookStepRunStatus;
  input: unknown;
  output: unknown;
  error: unknown;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  collaborationContext?: unknown; // Sprint S9: inter-agent collaboration data
  escalationLevel?: string; // Sprint S9: escalation ladder level
}

/**
 * DTO: Playbook with its steps
 */
export interface PlaybookDefinitionDTO {
  playbook: Playbook;
  steps: PlaybookStep[];
}

/**
 * DTO: Playbook run with step runs
 */
export interface PlaybookRunWithStepsDTO {
  run: PlaybookRun;
  steps: PlaybookStepRun[];
}

/**
 * Step execution context passed to step handlers
 */
export interface StepExecutionContext {
  orgId: string;
  runId: string;
  stepRun: PlaybookStepRun;
  step: PlaybookStep;
  input: unknown;
  previousOutputs: Record<string, unknown>; // stepKey -> output mapping
}

/**
 * API Response Types for Playbook Runtime
 */
export interface ListPlaybooksRuntimeResponse {
  success: boolean;
  data?: {
    items: Playbook[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface GetPlaybookResponse {
  success: boolean;
  data?: {
    item: PlaybookDefinitionDTO;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface CreatePlaybookResponse {
  success: boolean;
  data?: {
    item: PlaybookDefinitionDTO;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface UpdatePlaybookResponse {
  success: boolean;
  data?: {
    item: PlaybookDefinitionDTO;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ExecutePlaybookResponse {
  success: boolean;
  data?: {
    run: PlaybookRunWithStepsDTO;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface GetPlaybookRunResponse {
  success: boolean;
  data?: {
    run: PlaybookRunWithStepsDTO;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ========================================
// SPRINT S18: EXECUTION ENGINE V2 TYPES
// ========================================

/**
 * Execution state for async playbook execution
 */
export type ExecutionState =
  | 'queued'
  | 'running'
  | 'success'
  | 'failed'
  | 'waiting_for_dependencies'
  | 'blocked'
  | 'canceled';

/**
 * Worker information for step execution
 */
export interface WorkerInfo {
  workerId: string;
  startedAt: string;
  finishedAt?: string;
}

/**
 * Step log entry for execution logging
 */
export interface StepLogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

// ========================================
// Sprint S8: Playbook System V1 Types
// ========================================

/**
 * Playbook list item for listing UI
 */
export interface PlaybookListItemDTO {
  id: string;
  name: string;
  version: number;
  status: PlaybookStatus;
  tags: string[] | null;
  updatedAt: string;
  createdAt: string;
}

/**
 * Version summary for version history
 */
export interface PlaybookVersionSummary {
  id: string;
  version: number;
  status: PlaybookStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

/**
 * Playbook runtime template (Sprint S8 - server-provided)
 */
export interface PlaybookRuntimeTemplate {
  id: string; // template id (not DB id)
  slug: string; // e.g. "seo-site-audit"
  name: string;
  description: string;
  category: string; // e.g. "seo", "pr", "content"
  templateTags: string[]; // renamed from tags to avoid conflict
  // A ready-to-instantiate PlaybookDefinitionDTO
  definition: PlaybookDefinitionDTO;
}

/**
 * Response for listing playbooks with pagination
 */
export interface ListPlaybooksResponse {
  success: boolean;
  data?: {
    items: PlaybookListItemDTO[];
    total: number;
    limit: number;
    offset: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Response for listing playbook versions
 */
export interface ListPlaybookVersionsResponse {
  success: boolean;
  data?: {
    items: PlaybookVersionSummary[];
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Response for playbook templates
 */
export interface ListPlaybookTemplatesResponse {
  success: boolean;
  data?: {
    items: PlaybookRuntimeTemplate[];
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Response for cloning a playbook version
 */
export interface ClonePlaybookResponse {
  success: boolean;
  data?: {
    item: PlaybookDefinitionDTO;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Response for updating playbook status
 */
export interface UpdatePlaybookStatusResponse {
  success: boolean;
  data?: {
    item: Playbook;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ========================================
// SPRINT S9: AGENT COLLABORATION & ESCALATION
// ========================================

/**
 * Escalation level for multi-agent workflows
 */
export type EscalationLevel = 'none' | 'agent' | 'supervisor' | 'human';

/**
 * Inter-agent collaboration message
 */
export interface AgentCollaborationMessage {
  fromStepKey: string;
  toStepKey: string;
  type: 'request' | 'response' | 'escalation' | 'delegation';
  payload: unknown;
  timestamp: string;
}

/**
 * Collaboration context for multi-agent workflows
 */
export interface CollaborationContext {
  messages: AgentCollaborationMessage[];
  sharedState: Record<string, unknown>;
  escalationLevel: EscalationLevel;
}

/**
 * Playbook execution context (runtime state)
 */
export interface PlaybookExecutionContext {
  orgId: string;
  playbook: Playbook;
  steps: PlaybookStep[];
  run: PlaybookRun;
  stepRuns: PlaybookStepRun[];
  sharedState: Record<string, unknown>;
  messages: AgentCollaborationMessage[];
}

// ========================================
// SPRINT S10: MEMORY SYSTEM V2
// ========================================

/**
 * Memory type: semantic (general knowledge) or episodic (specific events)
 */
export type MemoryType = 'semantic' | 'episodic';

/**
 * Memory source
 */
export type MemorySource = 'step' | 'user' | 'agent' | 'system';

/**
 * Agent memory entry
 */
export interface AgentMemory {
  id: string;
  orgId: string;
  type: MemoryType;
  content: Record<string, unknown>;
  embedding: number[];
  source: MemorySource;
  importance: number;
  createdAt: string;
  ttlSeconds?: number | null;
}

/**
 * Episodic trace for a single step execution
 */
export interface EpisodicTrace {
  id: string;
  runId: string;
  orgId: string;
  stepKey: string;
  content: Record<string, unknown>;
  embedding: number[];
  createdAt: string;
}

/**
 * Memory retrieval result with relevance scores
 */
export interface MemoryRetrievalResult {
  items: AgentMemory[];
  relevance: number[];
}

/**
 * Options for memory retrieval
 */
export interface MemoryRetrievalOptions {
  limit?: number;
  minRelevance?: number;
  memoryType?: MemoryType;
}

/**
 * Memory link to external entity
 */
export interface MemoryLink {
  id: string;
  memoryId: string;
  entityType: string;
  entityId: string;
  weight: number;
  createdAt: string;
}

/**
 * Assembled context for agent step execution
 */
export interface AssembledContext {
  memories: AgentMemory[];
  episodicTraces: EpisodicTrace[];
  sharedState: Record<string, unknown>;
  collaborationContext?: CollaborationContext;
  linkedEntities: Record<string, unknown[]>;
  tokenBudget: {
    total: number;
    used: number;
    remaining: number;
  };
  personality?: PersonalityProfile; // S11: Personality configuration
}

// ========================================
// SPRINT S11: AGENT PERSONALITY ENGINE V1
// ========================================

/**
 * Risk tolerance level
 */
export type RiskTolerance = 'low' | 'medium' | 'high';

/**
 * Collaboration style
 */
export type CollaborationStyle = 'assertive' | 'supportive' | 'balanced';

/**
 * Personality profile configuration
 */
export interface PersonalityProfile {
  tone: string; // "formal", "analytical", "friendly", etc.
  style: string; // "structured", "concise", "verbose", etc.
  riskTolerance: RiskTolerance;
  domainSpecialty: string[]; // ["pr", "seo", "content"]
  biasModifiers: Record<string, number>; // e.g. { "optimism": +0.2 }
  memoryWeight: number; // 0–1 scalar for semantic memory relevance
  escalationSensitivity: number; // 0–1 scalar modifying escalation decisions
  collaborationStyle: CollaborationStyle;
  constraints: {
    forbid?: string[];
    require?: string[];
  };
}

/**
 * Agent personality record
 */
export interface AgentPersonality {
  id: string;
  orgId: string;
  slug: string;
  name: string;
  description: string;
  configuration: PersonalityProfile;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Personality list item DTO
 */
export interface PersonalityListItemDTO {
  personality: AgentPersonality;
}

/**
 * Agent with assigned personality DTO
 */
export interface AgentWithPersonalityDTO {
  agentId: string;
  personality: AgentPersonality | null;
}

/**
 * Personality assignment
 */
export interface PersonalityAssignment {
  id: string;
  orgId: string;
  agentId: string;
  personalityId: string;
  createdAt: string;
}

// ========================================
// SPRINT S19: LIVE EXECUTION VIEWER TYPES
// ========================================

/**
 * Step run view for execution viewer (enriched with memory, collaboration, personality)
 */
export interface StepRunView {
  id: string;
  key: string;
  name: string;
  type: PlaybookStepType;
  state: ExecutionState;
  status: PlaybookStepRunStatus;
  attempt: number;
  maxAttempts: number;
  input: unknown;
  output: unknown;
  error: unknown;
  logs: string[];
  workerInfo: WorkerInfo | null;
  collaborationContext: unknown | null;
  episodicTraces: EpisodicTrace[];
  personality: AgentPersonality | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

/**
 * Playbook run view for execution viewer (aggregated with all steps)
 */
export interface PlaybookRunView {
  id: string;
  playbookId: string;
  playbookName: string;
  playbookVersion: number;
  orgId: string;
  state: ExecutionState;
  status: PlaybookRunStatus;
  triggeredBy: string | null;
  input: unknown;
  output: unknown;
  error: unknown;
  webhookUrl: string | null;
  workerInfo: WorkerInfo | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  steps: StepRunView[];
  progress: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
  };
}

// ========================================
// Sprint S20: Graph Validation & Versioning Types
// ========================================

/**
 * Graph node for visual editor
 */
export interface GraphNode {
  id: string;
  type: 'AGENT' | 'DATA' | 'BRANCH' | 'API';
  position: { x: number; y: number };
  data: {
    label: string;
    config: Record<string, unknown>;
  };
}

/**
 * Graph edge for visual editor
 */
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

/**
 * Complete graph representation
 */
export interface PlaybookGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Graph validation issue
 */
export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Graph validation result
 */
export interface GraphValidationResult {
  valid: boolean;
  errors: string[];
  issues: ValidationIssue[];
}

/**
 * Playbook version record (S20)
 */
export interface PlaybookVersionRecord {
  id: string;
  playbookId: string;
  orgId: string;
  version: number;
  graph: PlaybookGraph;
  playbookJson: Record<string, unknown>;
  commitMessage: string | null;
  createdBy: string | null;
  createdAt: string;
}

/**
 * Graph diff result
 */
export interface GraphDiff {
  addedNodes: Array<{ id: string; label: string; type: string }>;
  removedNodes: Array<{ id: string; label: string; type: string }>;
  modifiedNodes: Array<{
    id: string;
    label: string;
    changes: string[];
  }>;
  addedEdges: Array<{ source: string; target: string; label?: string }>;
  removedEdges: Array<{ source: string; target: string; label?: string }>;
  hasChanges: boolean;
}

// ========================================
// S23: Branching and Version Control
// ========================================

/**
 * Playbook branch (S23)
 */
export interface PlaybookBranch {
  id: string;
  playbookId: string;
  orgId: string;
  name: string;
  parentBranchId: string | null;
  isProtected: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Playbook commit (S23)
 */
export interface PlaybookCommit {
  id: string;
  playbookId: string;
  orgId: string;
  branchId: string;
  version: number;
  graph: PlaybookGraph;
  playbookJson: Record<string, unknown>;
  message: string;
  parentCommitId: string | null;
  mergeParentCommitId: string | null;
  createdBy: string | null;
  createdAt: string;
}

/**
 * Merge conflict (S23)
 */
export interface MergeConflict {
  nodeId?: string;
  edgeId?: string;
  type: 'modify' | 'delete' | 'add';
  ours?: Record<string, unknown>;
  theirs?: Record<string, unknown>;
}

/**
 * Merge result (S23)
 */
export interface MergeResult {
  success: boolean;
  conflicts: MergeConflict[];
  mergedGraph?: PlaybookGraph;
  mergeCommitId?: string;
}

/**
 * Branch with latest commit info (S23)
 */
export interface PlaybookBranchWithCommit extends PlaybookBranch {
  latestCommit: PlaybookCommit | null;
  commitCount: number;
}

/**
 * Commit with branch info (S23)
 */
export interface PlaybookCommitWithBranch extends PlaybookCommit {
  branch: PlaybookBranch;
}

/**
 * Commit DAG node for visualization (S23)
 */
export interface CommitDAGNode {
  id: string;
  message: string;
  version: number;
  branchName: string;
  branchId: string;
  parentIds: string[];
  createdBy: string | null;
  createdAt: string;
  isMerge: boolean;
}
