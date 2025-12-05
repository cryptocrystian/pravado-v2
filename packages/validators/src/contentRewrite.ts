/**
 * Content Rewrite Validators (Sprint S15)
 * Zod schemas for semantic rewriting requests and responses
 */

import { z } from 'zod';

/**
 * Schema for rewrite request input
 */
export const rewriteRequestSchema = z.object({
  contentItemId: z.string().uuid('Content item ID must be a valid UUID'),
  personalityId: z.string().uuid('Personality ID must be a valid UUID').nullable().optional(),
  targetKeyword: z.string().min(1, 'Target keyword cannot be empty').nullable().optional(),
  targetIntent: z.enum(['informational', 'navigational', 'commercial', 'transactional']).nullable().optional(),
});

/**
 * Schema for rewrite result
 */
export const rewriteResultSchema = z.object({
  rewriteId: z.string().uuid('Rewrite ID must be a valid UUID'),
  rewrittenText: z.string().min(1, 'Rewritten text cannot be empty'),
  diff: z.record(z.unknown()),
  improvements: z.array(z.string()),
  reasoning: z.record(z.unknown()),
  readabilityBefore: z.number(),
  readabilityAfter: z.number(),
  qualityBefore: z.number(),
  qualityAfter: z.number(),
});

/**
 * Schema for content rewrite entity
 */
export const contentRewriteSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  contentItemId: z.string().uuid(),
  playbookRunId: z.string().uuid().nullable().optional(),

  originalText: z.string(),
  rewrittenText: z.string(),

  diff: z.record(z.unknown()),
  improvements: z.array(z.string()),
  reasoning: z.record(z.unknown()),

  readabilityBefore: z.number(),
  readabilityAfter: z.number(),

  qualityBefore: z.number(),
  qualityAfter: z.number(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Schema for listing rewrites with pagination
 */
export const listRewritesSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  pageSize: z.number().int().positive().max(100).optional().default(20),
  contentItemId: z.string().uuid().optional(),
});

/**
 * Type exports for TypeScript inference
 */
export type RewriteRequestInput = z.infer<typeof rewriteRequestSchema>;
export type RewriteResult = z.infer<typeof rewriteResultSchema>;
export type ContentRewrite = z.infer<typeof contentRewriteSchema>;
export type ListRewritesParams = z.infer<typeof listRewritesSchema>;
