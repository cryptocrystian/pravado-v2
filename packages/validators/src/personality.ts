/**
 * Personality validators (Sprint S11)
 * Zod schemas for agent personality profiles
 */

import { z } from 'zod';

// ========================================
// PERSONALITY PROFILE SCHEMAS
// ========================================

/**
 * Risk tolerance schema
 */
export const riskToleranceSchema = z.enum(['low', 'medium', 'high']);

export type RiskTolerance = z.infer<typeof riskToleranceSchema>;

/**
 * Collaboration style schema
 */
export const collaborationStyleSchema = z.enum(['assertive', 'supportive', 'balanced']);

export type CollaborationStyle = z.infer<typeof collaborationStyleSchema>;

/**
 * Personality profile schema
 */
export const personalityProfileSchema = z.object({
  tone: z.string().min(1).max(100),
  style: z.string().min(1).max(100),
  riskTolerance: riskToleranceSchema,
  domainSpecialty: z.array(z.string()).default([]),
  biasModifiers: z.record(z.string(), z.number()).default({}),
  memoryWeight: z.number().min(0).max(1).default(0.5),
  escalationSensitivity: z.number().min(0).max(1).default(0.5),
  collaborationStyle: collaborationStyleSchema,
  constraints: z
    .object({
      forbid: z.array(z.string()).optional(),
      require: z.array(z.string()).optional(),
    })
    .default({}),
});

export type PersonalityProfile = z.infer<typeof personalityProfileSchema>;

/**
 * Agent personality schema
 */
export const agentPersonalitySchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  description: z.string().default(''),
  configuration: personalityProfileSchema,
  createdBy: z.string().uuid().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AgentPersonality = z.infer<typeof agentPersonalitySchema>;

// ========================================
// CREATE/UPDATE SCHEMAS
// ========================================

/**
 * Create personality schema
 */
export const createPersonalitySchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, {
    message: 'Slug must be lowercase letters, numbers, and hyphens only',
  }),
  name: z.string().min(1).max(255),
  description: z.string().optional().default(''),
  configuration: personalityProfileSchema,
});

export type CreatePersonality = z.infer<typeof createPersonalitySchema>;

/**
 * Update personality schema
 */
export const updatePersonalitySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  configuration: personalityProfileSchema.optional(),
});

export type UpdatePersonality = z.infer<typeof updatePersonalitySchema>;

/**
 * Assign personality schema
 */
export const assignPersonalitySchema = z.object({
  agentId: z.string().min(1),
  personalityId: z.string().uuid(),
});

export type AssignPersonality = z.infer<typeof assignPersonalitySchema>;

/**
 * List personalities query schema
 */
export const listPersonalitiesQuerySchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(50),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type ListPersonalitiesQuery = z.infer<typeof listPersonalitiesQuerySchema>;
