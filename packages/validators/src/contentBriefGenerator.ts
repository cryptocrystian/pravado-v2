/**
 * Zod schemas for Content Brief Generator (Sprint S13)
 */

import { z } from 'zod';

// ========================================
// BRIEF GENERATION INPUT SCHEMA
// ========================================

export const briefGenerationInputSchema = z.object({
  contentItemId: z.string().uuid().optional(),
  targetKeyword: z.string().min(1).max(200).optional(),
  targetIntent: z.enum(['informational', 'navigational', 'commercial', 'transactional']).optional(),
  personalityId: z.string().uuid().optional(),
});

export type BriefGenerationInputParams = z.infer<typeof briefGenerationInputSchema>;

// ========================================
// GENERATED BRIEF OUTPUT SCHEMA
// ========================================

export const generatedBriefOutputSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  contentItemId: z.string().uuid().nullable(),
  playbookRunId: z.string().uuid().nullable(),
  brief: z.record(z.unknown()),
  outline: z.record(z.unknown()).nullable(),
  seoContext: z.record(z.unknown()).nullable(),
  personalityUsed: z.record(z.unknown()).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GeneratedBriefOutputParams = z.infer<typeof generatedBriefOutputSchema>;

// ========================================
// LIST GENERATED BRIEFS QUERY SCHEMA
// ========================================

export const listGeneratedBriefsQuerySchema = z.object({
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
  contentItemId: z.string().uuid().optional(),
});

export type ListGeneratedBriefsQueryParams = z.infer<typeof listGeneratedBriefsQuerySchema>;
