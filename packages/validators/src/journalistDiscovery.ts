/**
 * Journalist Discovery Engine Validators (Sprint S48)
 * Zod schemas for validating journalist discovery inputs and queries
 */

import { z } from 'zod';

// ===================================
// Enum Schemas
// ===================================

export const discoverySourceTypeSchema = z.enum([
  'article_author',
  'rss_feed',
  'social_profile',
  'staff_directory',
]);

export const discoveryStatusSchema = z.enum([
  'pending',
  'confirmed',
  'merged',
  'rejected',
]);

export const socialPlatformSchema = z.enum([
  'twitter',
  'linkedin',
  'mastodon',
  'bluesky',
]);

// ===================================
// Core Schemas
// ===================================

export const socialProfileLinksSchema = z.object({
  twitter: z.string().optional(),
  linkedin: z.string().url().optional(),
  mastodon: z.string().optional(),
  bluesky: z.string().optional(),
}).passthrough();

export const discoveryConfidenceBreakdownSchema = z.object({
  nameConfidence: z.number().min(0).max(1),
  emailConfidence: z.number().min(0).max(1),
  outletConfidence: z.number().min(0).max(1),
  socialConfidence: z.number().min(0).max(1),
  beatConfidence: z.number().min(0).max(1),
  overallScore: z.number().min(0).max(1),
});

export const suggestedMatchSchema = z.object({
  journalistId: z.string().uuid(),
  journalistName: z.string(),
  similarityScore: z.number().min(0).max(1),
  matchReason: z.string(),
  confidence: z.number().min(0).max(1),
});

export const discoveredJournalistSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  outlet: z.string().optional(),
  socialLinks: socialProfileLinksSchema,
  beats: z.array(z.string()),
  bio: z.string().optional(),
  confidenceScore: z.number().min(0).max(1),
  confidenceBreakdown: discoveryConfidenceBreakdownSchema,
  sourceType: discoverySourceTypeSchema,
  sourceUrl: z.string().url().optional(),
  rawPayload: z.record(z.any()),
  status: discoveryStatusSchema,
  mergedInto: z.string().uuid().optional(),
  resolvedBy: z.string().uuid().optional(),
  resolvedAt: z.date().optional(),
  resolutionNotes: z.string().optional(),
  suggestedMatches: z.array(suggestedMatchSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ===================================
// Input Schemas
// ===================================

export const discoveredJournalistInputSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format').optional(),
  outlet: z.string().optional(),
  socialLinks: socialProfileLinksSchema.optional(),
  beats: z.array(z.string()).optional(),
  bio: z.string().optional(),
  sourceType: discoverySourceTypeSchema,
  sourceUrl: z.string().url('Invalid source URL').optional(),
  rawPayload: z.record(z.any()).optional(),
});

export const resolveDiscoveryInputSchema = z.object({
  action: z.enum(['merge', 'confirm', 'reject']),
  targetJournalistId: z.string().uuid('Invalid journalist ID').optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // If action is 'merge', targetJournalistId is required
    if (data.action === 'merge') {
      return !!data.targetJournalistId;
    }
    return true;
  },
  {
    message: 'targetJournalistId is required when action is "merge"',
    path: ['targetJournalistId'],
  }
);

export const authorExtractionInputSchema = z.object({
  articleTitle: z.string().min(1, 'Article title is required'),
  articleContent: z.string().min(1, 'Article content is required'),
  articleUrl: z.string().url('Invalid article URL'),
  outlet: z.string().optional(),
  publishedDate: z.date().optional(),
  metadata: z.record(z.any()).optional(),
});

export const socialProfileInputSchema = z.object({
  platform: socialPlatformSchema,
  handle: z.string().min(1, 'Handle is required'),
  profileUrl: z.string().url('Invalid profile URL'),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  followers: z.number().int().nonnegative().optional(),
  metadata: z.record(z.any()).optional(),
});

// ===================================
// Query Schemas
// ===================================

export const discoveryQuerySchema = z.object({
  q: z.string().optional(),
  status: z.union([
    discoveryStatusSchema,
    z.array(discoveryStatusSchema),
  ]).optional(),
  sourceType: z.union([
    discoverySourceTypeSchema,
    z.array(discoverySourceTypeSchema),
  ]).optional(),
  minConfidenceScore: z.number().min(0).max(1).optional(),
  beats: z.array(z.string()).optional(),
  hasEmail: z.boolean().optional(),
  hasSocialLinks: z.boolean().optional(),
  sortBy: z.enum(['created_at', 'confidence_score', 'full_name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});

export const discoveryStatsSchema = z.object({
  totalDiscoveries: z.number().int().nonnegative(),
  pendingCount: z.number().int().nonnegative(),
  confirmedCount: z.number().int().nonnegative(),
  mergedCount: z.number().int().nonnegative(),
  rejectedCount: z.number().int().nonnegative(),
  avgConfidenceScore: z.number().min(0).max(1),
  sourceTypeDistribution: z.record(discoverySourceTypeSchema, z.number().int().nonnegative()),
});

// ===================================
// Result Schemas
// ===================================

export const authorExtractionResultSchema = z.object({
  authors: z.array(discoveredJournalistInputSchema),
  confidence: z.number().min(0).max(1),
  extractionMethod: z.string(),
  metadata: z.object({
    articleTitle: z.string(),
    articleUrl: z.string().url(),
    outlet: z.string().optional(),
    extractedBeats: z.array(z.string()),
  }),
});

export const discoveryEnrichmentResultSchema = z.object({
  discovery: discoveredJournalistSchema,
  enrichments: z.object({
    additionalEmails: z.array(z.string().email()),
    verifiedSocialLinks: socialProfileLinksSchema,
    estimatedBeats: z.array(z.string()),
    outletVerification: z.object({
      verified: z.boolean(),
      tier: z.string().optional(),
      confidence: z.number().min(0).max(1),
    }),
  }),
});

export const mergePreviewSchema = z.object({
  discoveryId: z.string().uuid(),
  targetJournalistId: z.string().uuid(),
  conflicts: z.array(z.object({
    field: z.string(),
    discoveryValue: z.any(),
    existingValue: z.any(),
    recommendation: z.enum(['keep_existing', 'use_discovery', 'merge_both']),
  })),
  autoResolvable: z.boolean(),
});

export const discoveryListResponseSchema = z.object({
  discoveries: z.array(discoveredJournalistSchema),
  pagination: z.object({
    total: z.number().int().nonnegative(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
  }),
  stats: discoveryStatsSchema.optional(),
});

// ===================================
// Social Profile Analysis Schemas
// ===================================

export const socialProfileAnalysisSchema = z.object({
  platform: socialPlatformSchema,
  handle: z.string(),
  verified: z.boolean(),
  followerCount: z.number().int().nonnegative().optional(),
  engagement: z.object({
    avgLikes: z.number().nonnegative().optional(),
    avgComments: z.number().nonnegative().optional(),
    avgRetweets: z.number().nonnegative().optional(),
  }),
  topics: z.array(z.string()),
  isJournalist: z.boolean(),
  confidence: z.number().min(0).max(1),
  bio: z.string().optional(),
});

// ===================================
// Deduplication Schemas
// ===================================

export const deduplicationResultSchema = z.object({
  isDuplicate: z.boolean(),
  matchedJournalistId: z.string().uuid().optional(),
  similarityScore: z.number().min(0).max(1),
  matchedFields: z.array(z.string()),
  recommendation: z.enum(['merge', 'create_new', 'needs_review']),
});

export const fuzzyMatchOptionsSchema = z.object({
  nameThreshold: z.number().min(0).max(1),
  emailWeight: z.number().min(0).max(1),
  outletWeight: z.number().min(0).max(1),
  socialWeight: z.number().min(0).max(1),
});

// ===================================
// Batch Processing Schemas
// ===================================

export const batchDiscoveryInputSchema = z.object({
  discoveries: z.array(discoveredJournalistInputSchema).min(1, 'At least one discovery is required'),
  autoMergeThreshold: z.number().min(0).max(1).optional().default(0.95),
  skipDuplicates: z.boolean().optional().default(true),
});

export const batchDiscoveryResultSchema = z.object({
  created: z.number().int().nonnegative(),
  merged: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.array(z.object({
    index: z.number().int().nonnegative(),
    error: z.string(),
    input: discoveredJournalistInputSchema,
  })),
});

// ===================================
// Discovery Pipeline Schemas
// ===================================

export const discoveryPipelineConfigSchema = z.object({
  autoMergeEnabled: z.boolean(),
  minimumConfidenceScore: z.number().min(0).max(1),
  deduplicationStrategy: z.enum(['strict', 'moderate', 'lenient']),
});

export const discoveryPipelineStatsSchema = z.object({
  lastRun: z.date().optional(),
  totalProcessed: z.number().int().nonnegative(),
  totalDiscovered: z.number().int().nonnegative(),
  totalMerged: z.number().int().nonnegative(),
});

export const discoveryPipelineSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  sourceType: discoverySourceTypeSchema,
  enabled: z.boolean(),
  schedule: z.string().optional(), // Cron expression
  config: discoveryPipelineConfigSchema,
  stats: discoveryPipelineStatsSchema,
});

// ===================================
// Outlet Staff Directory Schemas
// ===================================

export const staffDirectorySourceSchema = z.object({
  outletName: z.string().min(1),
  directoryUrl: z.string().url(),
  parseStrategy: z.string(),
  lastCrawled: z.date().optional(),
});

export const staffDirectoryEntrySchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  role: z.string().optional(),
  beat: z.string().optional(),
  socialLinks: socialProfileLinksSchema.optional(),
});

// ===================================
// Validation Schemas
// ===================================

export const discoveryValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
});

// ===================================
// Enrichment Service Schemas
// ===================================

export const enrichmentSourceSchema = z.object({
  name: z.string(),
  type: z.enum(['social', 'email', 'outlet', 'web']),
  priority: z.number().int().positive(),
  enabled: z.boolean(),
});

export const enrichmentTaskSchema = z.object({
  discoveryId: z.string().uuid(),
  sources: z.array(enrichmentSourceSchema),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  results: z.record(z.any()),
});

// ===================================
// Type Exports (for TypeScript inference)
// ===================================

export type DiscoverySourceType = z.infer<typeof discoverySourceTypeSchema>;
export type DiscoveryStatus = z.infer<typeof discoveryStatusSchema>;
export type SocialPlatform = z.infer<typeof socialPlatformSchema>;
export type SocialProfileLinks = z.infer<typeof socialProfileLinksSchema>;
export type DiscoveryConfidenceBreakdown = z.infer<typeof discoveryConfidenceBreakdownSchema>;
export type SuggestedMatch = z.infer<typeof suggestedMatchSchema>;
export type DiscoveredJournalist = z.infer<typeof discoveredJournalistSchema>;
export type DiscoveredJournalistInput = z.infer<typeof discoveredJournalistInputSchema>;
export type ResolveDiscoveryInput = z.infer<typeof resolveDiscoveryInputSchema>;
export type AuthorExtractionInput = z.infer<typeof authorExtractionInputSchema>;
export type SocialProfileInput = z.infer<typeof socialProfileInputSchema>;
export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;
export type DiscoveryStats = z.infer<typeof discoveryStatsSchema>;
export type AuthorExtractionResult = z.infer<typeof authorExtractionResultSchema>;
export type DiscoveryEnrichmentResult = z.infer<typeof discoveryEnrichmentResultSchema>;
export type MergePreview = z.infer<typeof mergePreviewSchema>;
export type DiscoveryListResponse = z.infer<typeof discoveryListResponseSchema>;
export type SocialProfileAnalysis = z.infer<typeof socialProfileAnalysisSchema>;
export type DeduplicationResult = z.infer<typeof deduplicationResultSchema>;
export type FuzzyMatchOptions = z.infer<typeof fuzzyMatchOptionsSchema>;
export type BatchDiscoveryInput = z.infer<typeof batchDiscoveryInputSchema>;
export type BatchDiscoveryResult = z.infer<typeof batchDiscoveryResultSchema>;
export type DiscoveryPipeline = z.infer<typeof discoveryPipelineSchema>;
export type StaffDirectorySource = z.infer<typeof staffDirectorySourceSchema>;
export type StaffDirectoryEntry = z.infer<typeof staffDirectoryEntrySchema>;
export type DiscoveryValidationResult = z.infer<typeof discoveryValidationResultSchema>;
export type EnrichmentSource = z.infer<typeof enrichmentSourceSchema>;
export type EnrichmentTask = z.infer<typeof enrichmentTaskSchema>;
