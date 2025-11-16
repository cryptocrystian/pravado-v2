/**
 * Zod schemas for playbook validation (Sprint S7)
 */

import { z } from 'zod';

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
