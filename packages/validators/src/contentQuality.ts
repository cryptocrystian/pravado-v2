/**
 * Content Quality Scoring Validators (Sprint S14)
 * Zod schemas for content quality analysis
 */

import { z } from 'zod';

/**
 * Input schema for analyzing content quality
 */
export const analyzeContentQualitySchema = z.object({
  contentItemId: z.string().uuid(),
});

/**
 * Content quality score schema
 */
export const contentQualityScoreSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  contentItemId: z.string().uuid(),
  score: z.number().min(0).max(100),
  readability: z.number().min(0).max(100).nullable(),
  topicAlignment: z.number().min(0).max(100).nullable(),
  keywordAlignment: z.number().min(0).max(100).nullable(),
  thinContent: z.boolean(),
  duplicateFlag: z.boolean(),
  warnings: z.record(z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Content quality analysis result schema
 */
export const contentQualityAnalysisResultSchema = z.object({
  item: z.object({
    id: z.string().uuid(),
    title: z.string(),
    contentType: z.string(),
    status: z.string(),
    wordCount: z.number().nullable(),
    // ... other content item fields
  }),
  score: contentQualityScoreSchema,
  similarItems: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      contentType: z.string(),
      similarity: z.number().optional(),
    })
  ),
  suggestedImprovements: z.array(z.string()),
});
