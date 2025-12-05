/**
 * Journalist Identity Graph Validators (Sprint S46)
 */

import { z } from 'zod';

// ===================================
// Enum Validators
// ===================================

export const journalistTierSchema = z.enum(['A', 'B', 'C', 'D']);

export const activityTypeSchema = z.enum([
  'press_release_sent',
  'pitch_sent',
  'mention_detected',
  'coverage_published',
  'outreach_email',
  'email_opened',
  'email_clicked',
  'email_replied',
  'manual_log',
]);

export const sourceSystemSchema = z.enum([
  's38_pr_generator',
  's39_pitch_engine',
  's40_media_monitoring',
  's44_outreach',
  's45_deliverability',
  'manual',
]);

export const sentimentSchema = z.enum(['positive', 'neutral', 'negative']);

export const graphNodeTypeSchema = z.enum(['journalist', 'outlet', 'topic', 'coverage', 'outreach']);

export const graphEdgeTypeSchema = z.enum([
  'works_for',
  'covers',
  'wrote_about',
  'received_outreach',
  'mentioned_in',
  'collaborated_with',
]);

// ===================================
// Profile Input Validators
// ===================================

export const createJournalistProfileInputSchema = z.object({
  fullName: z.string().min(1).max(255),
  primaryEmail: z.string().email(),
  secondaryEmails: z.array(z.string().email()).optional().default([]),
  primaryOutlet: z.string().max(255).optional(),
  secondaryOutlets: z.array(z.string().max(255)).optional().default([]),
  beat: z.string().max(255).optional(),
  twitterHandle: z.string().max(100).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  bio: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(100)).optional().default([]),
});

export const updateJournalistProfileInputSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  primaryEmail: z.string().email().optional(),
  secondaryEmails: z.array(z.string().email()).optional(),
  primaryOutlet: z.string().max(255).optional(),
  secondaryOutlets: z.array(z.string().max(255)).optional(),
  beat: z.string().max(255).optional(),
  twitterHandle: z.string().max(100).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  bio: z.string().max(5000).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(100)).optional(),
  engagementScore: z.number().min(0).max(1).optional(),
  responsivenessScore: z.number().min(0).max(1).optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
  tier: journalistTierSchema.optional(),
});

// ===================================
// Activity Input Validators
// ===================================

export const createActivityInputSchema = z.object({
  journalistId: z.string().uuid(),
  activityType: activityTypeSchema,
  sourceSystem: sourceSystemSchema,
  sourceId: z.string().max(255).optional(),
  activityData: z.record(z.unknown()).optional().default({}),
  sentiment: sentimentSchema.optional(),
  occurredAt: z.coerce.date().optional(),
});

export const batchCreateActivitiesInputSchema = z.object({
  activities: z.array(createActivityInputSchema),
});

// ===================================
// Identity Resolution Validators
// ===================================

export const identityResolutionInputSchema = z.object({
  fullName: z.string().max(255).optional(),
  email: z.string().email().optional(),
  secondaryEmails: z.array(z.string().email()).optional(),
  outlet: z.string().max(255).optional(),
  twitterHandle: z.string().max(100).optional(),
  linkedinUrl: z.string().url().max(500).optional(),
  matchThreshold: z.number().min(0).max(1).optional().default(0.5),
});

export const mergeProfilesInputSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  fieldResolution: z
    .object({
      primaryEmail: z.enum(['source', 'target']).optional(),
      fullName: z.enum(['source', 'target']).optional(),
      primaryOutlet: z.enum(['source', 'target']).optional(),
      beat: z.enum(['source', 'target']).optional(),
      twitterHandle: z.enum(['source', 'target']).optional(),
      linkedinUrl: z.enum(['source', 'target']).optional(),
      bio: z.enum(['source', 'target']).optional(),
      notes: z.enum(['source', 'target']).optional(),
    })
    .optional(),
});

// ===================================
// Scoring Validators
// ===================================

export const batchUpdateScoresInputSchema = z.object({
  journalistIds: z.array(z.string().uuid()),
});

// ===================================
// Query Validators
// ===================================

export const listJournalistProfilesQuerySchema = z.object({
  q: z.string().optional(),
  outlet: z.string().max(255).optional(),
  beat: z.string().max(255).optional(),
  minEngagementScore: z.coerce.number().min(0).max(1).optional(),
  minRelevanceScore: z.coerce.number().min(0).max(1).optional(),
  sortBy: z.enum(['engagement_score', 'relevance_score', 'last_activity_at', 'full_name']).optional().default('engagement_score'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const listActivitiesQuerySchema = z.object({
  journalistId: z.string().uuid().optional(),
  activityType: z.union([activityTypeSchema, z.array(activityTypeSchema)]).optional(),
  sourceSystem: z.union([sourceSystemSchema, z.array(sourceSystemSchema)]).optional(),
  sentiment: sentimentSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const graphQuerySchema = z.object({
  journalistIds: z.array(z.string().uuid()).optional(),
  includeOutlets: z.coerce.boolean().optional().default(false),
  includeTopics: z.coerce.boolean().optional().default(false),
  includeCoverage: z.coerce.boolean().optional().default(false),
  includeOutreach: z.coerce.boolean().optional().default(false),
  minEngagementScore: z.coerce.number().min(0).max(1).optional(),
  maxDepth: z.coerce.number().int().min(1).max(5).optional().default(2),
});

// ===================================
// Type Exports
// ===================================

export type CreateJournalistProfileInput = z.infer<typeof createJournalistProfileInputSchema>;
export type UpdateJournalistProfileInput = z.infer<typeof updateJournalistProfileInputSchema>;
export type CreateActivityInput = z.infer<typeof createActivityInputSchema>;
export type BatchCreateActivitiesInput = z.infer<typeof batchCreateActivitiesInputSchema>;
export type IdentityResolutionInput = z.infer<typeof identityResolutionInputSchema>;
export type MergeProfilesInput = z.infer<typeof mergeProfilesInputSchema>;
export type BatchUpdateScoresInput = z.infer<typeof batchUpdateScoresInputSchema>;
export type ListJournalistProfilesQuery = z.infer<typeof listJournalistProfilesQuerySchema>;
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
export type GraphQuery = z.infer<typeof graphQuerySchema>;
