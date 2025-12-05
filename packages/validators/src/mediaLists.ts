/**
 * AI Media List Builder Validators (Sprint S47)
 */

import { z } from 'zod';

// ===================================
// Enum Validators
// ===================================

export const tierLevelSchema = z.enum(['A', 'B', 'C', 'D']);

// ===================================
// Input Validators
// ===================================

export const mediaListGenerationInputSchema = z.object({
  topic: z.string().min(1).max(500),
  keywords: z.array(z.string().max(100)).optional().default([]),
  market: z.string().max(200).optional(),
  geography: z.string().max(200).optional(),
  product: z.string().max(200).optional(),
  targetCount: z.coerce.number().int().min(1).max(200).optional().default(50),
  minFitScore: z.coerce.number().min(0).max(1).optional().default(0.3),
  includeTiers: z.array(tierLevelSchema).optional().default(['A', 'B', 'C', 'D']),
});

export const mediaListCreateInputSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  inputTopic: z.string().min(1).max(500),
  inputKeywords: z.array(z.string().max(100)).optional().default([]),
  inputMarket: z.string().max(200).optional(),
  inputGeography: z.string().max(200).optional(),
  inputProduct: z.string().max(200).optional(),
});

export const mediaListUpdateInputSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional(),
});

// ===================================
// Query Validators
// ===================================

export const mediaListQuerySchema = z.object({
  q: z.string().optional(),
  topic: z.string().max(500).optional(),
  market: z.string().max(200).optional(),
  createdBy: z.string().uuid().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'name']).optional().default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const mediaListEntryQuerySchema = z.object({
  listId: z.string().uuid(),
  tier: z.union([tierLevelSchema, z.array(tierLevelSchema)]).optional(),
  minFitScore: z.coerce.number().min(0).max(1).optional(),
  sortBy: z.enum(['fit_score', 'position']).optional().default('fit_score'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// ===================================
// Type Exports
// ===================================

export type MediaListGenerationInput = z.infer<typeof mediaListGenerationInputSchema>;
export type MediaListCreateInput = z.infer<typeof mediaListCreateInputSchema>;
export type MediaListUpdateInput = z.infer<typeof mediaListUpdateInputSchema>;
export type MediaListQuery = z.infer<typeof mediaListQuerySchema>;
export type MediaListEntryQuery = z.infer<typeof mediaListEntryQuerySchema>;
