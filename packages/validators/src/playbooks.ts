/**
 * Zod schemas for playbook validation (Sprint S7)
 */

import { z } from 'zod';

// ========================================
// SPRINT S19: EXECUTION VIEWER SCHEMAS
// ========================================

/**
 * Schema for GET /playbook-runs/:id
 */
export const getRunSchema = z.object({
  id: z.string().uuid('Invalid run ID format'),
});

/**
 * Schema for GET /playbook-runs/:id/steps/:stepKey
 */
export const getStepSchema = z.object({
  id: z.string().uuid('Invalid run ID format'),
  stepKey: z.string().min(1, 'Step key is required'),
});

// ========================================
// ENUMS & CONSTANTS
// ========================================

export const playbookStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED', 'DEPRECATED']);

export const playbookRunStatusSchema = z.enum(['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED']);

export const playbookStepRunStatusSchema = z.enum(['PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED', 'SKIPPED']);

export const playbookStepTypeSchema = z.enum(['AGENT', 'DATA', 'BRANCH', 'API']);

// ========================================
// PLAYBOOK STEP CONFIG SCHEMAS
// ========================================

/**
 * Agent step config
 */
export const agentStepConfigSchema = z.object({
  agentId: z.string().min(1),
  prompt: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().positive().optional(),
  systemMessage: z.string().optional(),
});

/**
 * Data step config (transformations)
 */
export const dataStepConfigSchema = z.object({
  operation: z.enum(['pluck', 'map', 'merge', 'filter', 'transform']),
  sourceKey: z.string().optional(), // source step key for input
  fields: z.array(z.string()).optional(), // for pluck operation
  mapping: z.record(z.string(), z.unknown()).optional(), // for map operation
  condition: z.unknown().optional(), // for filter operation
  transform: z.string().optional(), // JS expression for transform
});

/**
 * Branch step config (conditional logic)
 */
export const branchStepConfigSchema = z.object({
  sourceKey: z.string(), // step key to evaluate
  conditions: z.array(
    z.object({
      operator: z.enum(['equals', 'notEquals', 'contains', 'greaterThan', 'lessThan', 'exists']),
      value: z.unknown().optional(),
      nextStepKey: z.string(),
    })
  ),
  defaultStepKey: z.string().optional(), // fallback if no condition matches
});

/**
 * API step config (external API calls)
 */
export const apiStepConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.unknown().optional(),
  timeout: z.number().positive().optional(),
});

/**
 * Generic step config (union of all step types)
 */
export const stepConfigSchema = z.union([
  agentStepConfigSchema,
  dataStepConfigSchema,
  branchStepConfigSchema,
  apiStepConfigSchema,
  z.record(z.string(), z.unknown()), // fallback for custom step types
]);

// ========================================
// PLAYBOOK STEP SCHEMA
// ========================================

export const playbookStepSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  type: playbookStepTypeSchema,
  config: stepConfigSchema,
  position: z.number().int().nonnegative(),
  nextStepKey: z.string().optional().nullable(),
});

export type PlaybookStepInput = z.infer<typeof playbookStepSchema>;

// ========================================
// PLAYBOOK CRUD SCHEMAS
// ========================================

/**
 * Create playbook schema
 */
export const createPlaybookSchema = z.object({
  name: z.string().min(1).max(255),
  version: z.number().int().positive().optional().default(1),
  status: playbookStatusSchema.optional().default('DRAFT'),
  inputSchema: z.unknown().optional().nullable(),
  outputSchema: z.unknown().optional().nullable(),
  timeoutSeconds: z.number().int().positive().optional().nullable(),
  maxRetries: z.number().int().nonnegative().optional().default(0),
  tags: z.array(z.string()).optional().nullable(),
  steps: z.array(playbookStepSchema).min(1), // at least one step
});

export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>;

/**
 * Update playbook schema
 */
export const updatePlaybookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: playbookStatusSchema.optional(),
  inputSchema: z.unknown().optional().nullable(),
  outputSchema: z.unknown().optional().nullable(),
  timeoutSeconds: z.number().int().positive().optional().nullable(),
  maxRetries: z.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional().nullable(),
  steps: z.array(playbookStepSchema).optional(),
});

export type UpdatePlaybookInput = z.infer<typeof updatePlaybookSchema>;

/**
 * Execute playbook schema
 */
export const executePlaybookSchema = z.object({
  input: z.unknown(), // any JSON input
});

export type ExecutePlaybookInput = z.infer<typeof executePlaybookSchema>;

/**
 * List playbooks query schema
 */
export const listPlaybooksQuerySchema = z.object({
  status: playbookStatusSchema.optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  tags: z.array(z.string()).optional(),
});

export type ListPlaybooksQuery = z.infer<typeof listPlaybooksQuerySchema>;

// ========================================
// VALIDATION HELPERS
// ========================================

/**
 * Validate playbook definition structure
 * Ensures:
 * - All step keys are unique
 * - All nextStepKey references exist
 * - No circular dependencies (basic check)
 */
export function validatePlaybookStructure(steps: PlaybookStepInput[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for unique keys
  const keys = steps.map((s) => s.key);
  const uniqueKeys = new Set(keys);
  if (keys.length !== uniqueKeys.size) {
    errors.push('Step keys must be unique');
  }

  // Check nextStepKey references
  const keySet = new Set(keys);
  for (const step of steps) {
    if (step.nextStepKey && !keySet.has(step.nextStepKey)) {
      errors.push(`Step "${step.key}" references non-existent nextStepKey "${step.nextStepKey}"`);
    }
  }

  // Check for branch step conditions
  for (const step of steps) {
    if (step.type === 'BRANCH') {
      const config = step.config as z.infer<typeof branchStepConfigSchema>;
      if (config.conditions) {
        for (const condition of config.conditions) {
          if (!keySet.has(condition.nextStepKey)) {
            errors.push(
              `Branch step "${step.key}" references non-existent nextStepKey "${condition.nextStepKey}" in conditions`
            );
          }
        }
      }
      if (config.defaultStepKey && !keySet.has(config.defaultStepKey)) {
        errors.push(
          `Branch step "${step.key}" references non-existent defaultStepKey "${config.defaultStepKey}"`
        );
      }
    }
  }

  // Basic cycle detection: ensure no step points to itself
  for (const step of steps) {
    if (step.nextStepKey === step.key) {
      errors.push(`Step "${step.key}" points to itself (circular dependency)`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ========================================
// Sprint S8: Extended Schemas
// ========================================

/**
 * Extended listing query with search and filtering
 */
export const listPlaybooksExtendedQuerySchema = z.object({
  status: playbookStatusSchema.optional(),
  q: z.string().optional(), // search query
  tag: z.string().optional(), // single tag filter
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type ListPlaybooksExtendedQuery = z.infer<typeof listPlaybooksExtendedQuerySchema>;

/**
 * Execute playbook with mode (normal or simulation)
 */
export const executePlaybookExtendedSchema = z.object({
  input: z.unknown(),
  mode: z.enum(['normal', 'simulation']).optional().default('normal'),
});

export type ExecutePlaybookExtended = z.infer<typeof executePlaybookExtendedSchema>;

/**
 * Update playbook status
 */
export const updatePlaybookStatusSchema = z.object({
  status: playbookStatusSchema,
});

export type UpdatePlaybookStatus = z.infer<typeof updatePlaybookStatusSchema>;

// ========================================
// SPRINT S9: COLLABORATION & ESCALATION
// ========================================

/**
 * Escalation level schema
 */
export const escalationLevelSchema = z.enum(['none', 'agent', 'supervisor', 'human']);

export type EscalationLevel = z.infer<typeof escalationLevelSchema>;

/**
 * Agent collaboration message schema
 */
export const collaborationMessageSchema = z.object({
  fromStepKey: z.string().min(1),
  toStepKey: z.string().min(1),
  type: z.enum(['request', 'response', 'escalation', 'delegation']),
  payload: z.unknown(),
  timestamp: z.string(),
});

export type CollaborationMessage = z.infer<typeof collaborationMessageSchema>;

/**
 * Collaboration context schema
 */
export const collaborationContextSchema = z.object({
  messages: z.array(collaborationMessageSchema),
  sharedState: z.record(z.string(), z.unknown()),
  escalationLevel: escalationLevelSchema,
});

export type CollaborationContext = z.infer<typeof collaborationContextSchema>;

/**
 * Shared state update schema
 */
export const sharedStateSchema = z.record(z.string(), z.unknown());

export type SharedState = z.infer<typeof sharedStateSchema>;

/**
 * Escalation event schema
 */
export const escalationEventSchema = z.object({
  level: escalationLevelSchema,
  reason: z.string(),
  fromStepKey: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type EscalationEvent = z.infer<typeof escalationEventSchema>;

/**
 * Execute playbook with collaboration options
 */
export const executePlaybookCollaborationSchema = z.object({
  input: z.unknown(),
  options: z
    .object({
      mode: z.enum(['normal', 'simulation']).optional().default('simulation'),
      collaborationDebug: z.boolean().optional().default(false),
    })
    .optional(),
});

export type ExecutePlaybookCollaboration = z.infer<typeof executePlaybookCollaborationSchema>;

// ========================================
// SPRINT S10: MEMORY SYSTEM V2
// ========================================

/**
 * Memory type schema
 */
export const memoryTypeSchema = z.enum(['semantic', 'episodic']);

export type MemoryType = z.infer<typeof memoryTypeSchema>;

/**
 * Memory source schema
 */
export const memorySourceSchema = z.enum(['step', 'user', 'agent', 'system']);

export type MemorySource = z.infer<typeof memorySourceSchema>;

/**
 * Agent memory schema
 */
export const agentMemorySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  type: memoryTypeSchema,
  content: z.record(z.string(), z.unknown()),
  embedding: z.array(z.number()),
  source: memorySourceSchema,
  importance: z.number().min(0).max(1),
  createdAt: z.string(),
  ttlSeconds: z.number().int().positive().optional().nullable(),
});

export type AgentMemory = z.infer<typeof agentMemorySchema>;

/**
 * Episodic trace schema
 */
export const episodicTraceSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  orgId: z.string().uuid(),
  stepKey: z.string().min(1),
  content: z.record(z.string(), z.unknown()),
  embedding: z.array(z.number()),
  createdAt: z.string(),
});

export type EpisodicTrace = z.infer<typeof episodicTraceSchema>;

/**
 * Memory retrieval options schema
 */
export const memoryRetrievalOptionsSchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(10),
  minRelevance: z.number().min(0).max(1).optional().default(0.5),
  memoryType: memoryTypeSchema.optional(),
});

export type MemoryRetrievalOptions = z.infer<typeof memoryRetrievalOptionsSchema>;

/**
 * Memory retrieval result schema
 */
export const memoryRetrievalResultSchema = z.object({
  items: z.array(agentMemorySchema),
  relevance: z.array(z.number()),
});

export type MemoryRetrievalResult = z.infer<typeof memoryRetrievalResultSchema>;

/**
 * Create memory schema
 */
export const createMemorySchema = z.object({
  type: memoryTypeSchema,
  content: z.record(z.string(), z.unknown()),
  embedding: z.array(z.number()).length(1536),
  source: memorySourceSchema,
  importance: z.number().min(0).max(1).optional().default(0.5),
  ttlSeconds: z.number().int().positive().optional().nullable(),
});

export type CreateMemory = z.infer<typeof createMemorySchema>;

/**
 * Memory link schema
 */
export const memoryLinkSchema = z.object({
  memoryId: z.string().uuid(),
  entityType: z.string().min(1),
  entityId: z.string().uuid(),
  weight: z.number().min(0).optional().default(1.0),
});

export type MemoryLink = z.infer<typeof memoryLinkSchema>;

/**
 * Memory search query schema
 */
export const memorySearchQuerySchema = z.object({
  q: z.string().optional(),
  embedding: z.array(z.number()).length(1536).optional(),
  limit: z.number().int().positive().max(100).optional().default(10),
  minRelevance: z.number().min(0).max(1).optional().default(0.5),
  memoryType: memoryTypeSchema.optional(),
});

export type MemorySearchQuery = z.infer<typeof memorySearchQuerySchema>;

// ========================================
// SPRINT S23: BRANCHING & VERSION CONTROL
// ========================================

/**
 * Create branch schema
 */
export const createBranchSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, 'Branch name must be alphanumeric with hyphens and underscores'),
  parentBranchId: z.string().uuid().optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

/**
 * Create commit schema
 */
export const createCommitSchema = z.object({
  message: z.string().min(1).max(500),
  graph: z.unknown(), // PlaybookGraph
  playbookJson: z.unknown(), // Record<string, unknown>
});

export type CreateCommitInput = z.infer<typeof createCommitSchema>;

/**
 * Merge branches schema
 */
export const mergeBranchesSchema = z.object({
  sourceBranchId: z.string().uuid(),
  targetBranchId: z.string().uuid(),
  message: z.string().min(1).max(500).optional(),
  resolveConflicts: z.array(z.object({
    nodeId: z.string().optional(),
    edgeId: z.string().optional(),
    resolution: z.enum(['ours', 'theirs']),
  })).optional(),
});

export type MergeBranchesInput = z.infer<typeof mergeBranchesSchema>;

/**
 * Switch branch schema
 */
export const switchBranchSchema = z.object({
  branchId: z.string().uuid(),
});

export type SwitchBranchInput = z.infer<typeof switchBranchSchema>;

/**
 * List branches query schema
 */
export const listBranchesQuerySchema = z.object({
  includeProtected: z.boolean().optional().default(true),
});

export type ListBranchesQuery = z.infer<typeof listBranchesQuerySchema>;

/**
 * List commits query schema
 */
export const listCommitsQuerySchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type ListCommitsQuery = z.infer<typeof listCommitsQuerySchema>;
