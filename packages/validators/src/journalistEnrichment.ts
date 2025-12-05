/**
 * Journalist Enrichment Validators (Sprint S50)
 * Zod validation schemas for enrichment engine
 */

import { z } from 'zod';

// ========================================
// Enums
// ========================================

export const EnrichmentSourceTypeSchema = z.enum([
  'email_verification',
  'social_scraping',
  'outlet_authority',
  'manual_entry',
  'api_integration',
  'web_scraping',
  'media_database',
  'contact_import',
]);

export const EnrichmentRecordStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed',
  'merged',
  'archived',
]);

export const EnrichmentJobTypeSchema = z.enum([
  'single_enrichment',
  'batch_enrichment',
  'email_verification_batch',
  'social_scraping_batch',
  'outlet_scoring_batch',
  'deduplication_scan',
  'auto_merge',
]);

export const EnrichmentJobStatusSchema = z.enum([
  'pending',
  'queued',
  'processing',
  'completed',
  'failed',
  'cancelled',
  'retrying',
]);

export const EnrichmentLinkTypeSchema = z.enum([
  'primary',
  'alternate',
  'historical',
  'suggested',
  'rejected',
]);

export const MergeStrategySchema = z.enum([
  'overwrite',
  'append',
  'keep_existing',
]);

export const QualityFlagSchema = z.enum([
  'stale_data',
  'low_confidence',
  'missing_critical_fields',
  'unverified_email',
  'unverified_phone',
  'low_outlet_authority',
  'missing_social_profiles',
  'duplicate_detected',
  'data_conflict',
]);

// ========================================
// Common Schemas
// ========================================

export const SocialProfilesSchema = z.object({
  twitter: z.string().url().optional(),
  linkedin: z.string().url().optional(),
  mastodon: z.string().url().optional(),
  bluesky: z.string().url().optional(),
  instagram: z.string().url().optional(),
  facebook: z.string().url().optional(),
  youtube: z.string().url().optional(),
  tiktok: z.string().url().optional(),
  threads: z.string().url().optional(),
}).passthrough();

export const OutletMetadataSchema = z.object({
  alexaRank: z.number().int().positive().optional(),
  mozDomainAuthority: z.number().min(0).max(100).optional(),
  monthlyVisitors: z.number().int().nonnegative().optional(),
  similarWebRank: z.number().int().positive().optional(),
  backlinks: z.number().int().nonnegative().optional(),
  referringDomains: z.number().int().nonnegative().optional(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  geography: z.string().optional(),
  language: z.string().optional(),
}).passthrough();

export const MergeSuggestionSchema = z.object({
  targetId: z.string().uuid(),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
  fieldsToMerge: z.array(z.string()),
  matchScore: z.number().min(0).max(1),
  matchFields: z.array(z.string()),
  potentialConflicts: z.array(z.object({
    field: z.string(),
    currentValue: z.any(),
    newValue: z.any(),
  })).optional(),
});

export const EnrichmentMetadataSchema = z.object({
  sourceApiVersion: z.string().optional(),
  requestId: z.string().optional(),
  processingTime: z.number().nonnegative().optional(),
  dataProvider: z.string().optional(),
  costCredits: z.number().nonnegative().optional(),
  rawResponse: z.record(z.any()).optional(),
}).passthrough();

// ========================================
// Input Schemas
// ========================================

export const CreateEnrichmentRecordInputSchema = z.object({
  sourceType: EnrichmentSourceTypeSchema,
  sourceId: z.string().optional(),
  sourceUrl: z.string().url().optional(),

  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
  emailConfidence: z.number().min(0).max(1).optional(),
  emailVerificationMethod: z.string().optional(),

  phone: z.string().optional(),
  phoneVerified: z.boolean().optional(),
  phoneConfidence: z.number().min(0).max(1).optional(),

  socialProfiles: SocialProfilesSchema.optional(),
  socialProfilesVerified: z.boolean().optional(),
  socialProfilesConfidence: z.number().min(0).max(1).optional(),

  outlet: z.string().optional(),
  outletVerified: z.boolean().optional(),
  outletAuthorityScore: z.number().min(0).max(100).optional(),
  outletDomain: z.string().optional(),
  outletMetadata: OutletMetadataSchema.optional(),

  jobTitle: z.string().optional(),
  beat: z.array(z.string()).optional(),
  beatConfidence: z.number().min(0).max(1).optional(),

  location: z.string().optional(),
  locationVerified: z.boolean().optional(),
  timezone: z.string().optional(),

  bio: z.string().optional(),
  profileImageUrl: z.string().url().optional(),

  enrichmentMetadata: EnrichmentMetadataSchema.optional(),
});

export const UpdateEnrichmentRecordInputSchema = z.object({
  email: z.string().email().optional(),
  emailVerified: z.boolean().optional(),
  emailConfidence: z.number().min(0).max(1).optional(),

  phone: z.string().optional(),
  phoneVerified: z.boolean().optional(),
  phoneConfidence: z.number().min(0).max(1).optional(),

  socialProfiles: SocialProfilesSchema.optional(),
  socialProfilesVerified: z.boolean().optional(),
  socialProfilesConfidence: z.number().min(0).max(1).optional(),

  outlet: z.string().optional(),
  outletVerified: z.boolean().optional(),
  outletAuthorityScore: z.number().min(0).max(100).optional(),

  jobTitle: z.string().optional(),
  beat: z.array(z.string()).optional(),
  location: z.string().optional(),
  bio: z.string().optional(),

  status: EnrichmentRecordStatusSchema.optional(),
  qualityFlags: z.array(QualityFlagSchema).optional(),
});

export const EnrichmentJobInputDataSchema = z.object({
  journalistIds: z.array(z.string().uuid()).optional(),
  emails: z.array(z.string().email()).optional(),
  outlets: z.array(z.string()).optional(),
  sourceUrls: z.array(z.string().url()).optional(),
  csvData: z.array(z.record(z.any())).optional(),
}).passthrough();

export const CreateEnrichmentJobInputSchema = z.object({
  jobType: EnrichmentJobTypeSchema,
  inputData: EnrichmentJobInputDataSchema,
  enrichmentSources: z.array(EnrichmentSourceTypeSchema).optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
});

export const CreateEnrichmentLinkInputSchema = z.object({
  journalistId: z.string().uuid(),
  enrichmentRecordId: z.string().uuid(),
  linkType: EnrichmentLinkTypeSchema,
  linkConfidence: z.number().min(0).max(1).optional(),
  linkReason: z.string().optional(),
});

export const MergeEnrichmentInputSchema = z.object({
  journalistId: z.string().uuid(),
  enrichmentRecordId: z.string().uuid(),
  mergeStrategy: MergeStrategySchema,
  fieldsToMerge: z.array(z.string()).min(1),
});

// ========================================
// Query Schemas
// ========================================

export const EnrichmentRecordsQuerySchema = z.object({
  sourceTypes: z.array(EnrichmentSourceTypeSchema).optional(),
  status: z.array(EnrichmentRecordStatusSchema).optional(),
  minConfidenceScore: z.number().min(0).max(100).optional(),
  maxConfidenceScore: z.number().min(0).max(100).optional(),
  minCompletenessScore: z.number().min(0).max(100).optional(),
  emailVerified: z.boolean().optional(),
  hasEmail: z.boolean().optional(),
  hasPhone: z.boolean().optional(),
  hasSocialProfiles: z.boolean().optional(),
  outlet: z.string().optional(),
  qualityFlags: z.array(QualityFlagSchema).optional(),
  hasPotentialDuplicates: z.boolean().optional(),
  searchQuery: z.string().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'overall_confidence_score', 'data_freshness_score', 'completeness_score']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export const EnrichmentJobsQuerySchema = z.object({
  jobType: z.array(EnrichmentJobTypeSchema).optional(),
  status: z.array(EnrichmentJobStatusSchema).optional(),
  createdBy: z.string().uuid().optional(),
  minProgressPercentage: z.number().min(0).max(100).optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'started_at', 'completed_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export const EnrichmentLinksQuerySchema = z.object({
  journalistId: z.string().uuid().optional(),
  enrichmentRecordId: z.string().uuid().optional(),
  linkType: z.array(EnrichmentLinkTypeSchema).optional(),
  isMerged: z.boolean().optional(),
  sortBy: z.enum(['created_at', 'updated_at', 'merged_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

// ========================================
// Email Verification
// ========================================

export const EmailVerificationResultSchema = z.object({
  email: z.string().email(),
  isValid: z.boolean(),
  isDeliverable: z.boolean(),
  isDisposable: z.boolean(),
  isFreeEmail: z.boolean(),
  confidence: z.number().min(0).max(1),
  verificationMethod: z.enum(['smtp', 'syntax', 'dns', 'api']),
  provider: z.string().optional(),
  domain: z.string().optional(),
  mxRecords: z.array(z.string()).optional(),
  error: z.string().optional(),
});

// ========================================
// Social Scraping
// ========================================

export const SocialScrapingResultSchema = z.object({
  platform: z.string(),
  profileUrl: z.string().url(),
  username: z.string(),
  displayName: z.string().optional(),
  bio: z.string().optional(),
  followerCount: z.number().int().nonnegative().optional(),
  followingCount: z.number().int().nonnegative().optional(),
  postCount: z.number().int().nonnegative().optional(),
  verified: z.boolean().optional(),
  profileImageUrl: z.string().url().optional(),
  location: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  confidence: z.number().min(0).max(1),
  lastActive: z.date().optional(),
  error: z.string().optional(),
});

// ========================================
// Outlet Authority
// ========================================

export const OutletAuthorityResultSchema = z.object({
  outlet: z.string(),
  domain: z.string(),
  authorityScore: z.number().min(0).max(100),
  metrics: OutletMetadataSchema,
  confidence: z.number().min(0).max(1),
  dataSource: z.string(),
  lastUpdated: z.date(),
  error: z.string().optional(),
});

// ========================================
// Batch Enrichment
// ========================================

export const BatchEnrichmentRequestSchema = z.object({
  items: z.array(z.object({
    email: z.string().email().optional(),
    outlet: z.string().optional(),
    socialProfile: z.string().url().optional(),
    name: z.string().optional(),
  })).min(1).max(1000),
  sources: z.array(EnrichmentSourceTypeSchema).min(1),
  autoLink: z.boolean().optional(),
  autoMerge: z.boolean().optional(),
});

// ========================================
// Type Inference
// ========================================

export type CreateEnrichmentRecordInput = z.infer<typeof CreateEnrichmentRecordInputSchema>;
export type UpdateEnrichmentRecordInput = z.infer<typeof UpdateEnrichmentRecordInputSchema>;
export type CreateEnrichmentJobInput = z.infer<typeof CreateEnrichmentJobInputSchema>;
export type CreateEnrichmentLinkInput = z.infer<typeof CreateEnrichmentLinkInputSchema>;
export type MergeEnrichmentInput = z.infer<typeof MergeEnrichmentInputSchema>;
export type EnrichmentRecordsQuery = z.infer<typeof EnrichmentRecordsQuerySchema>;
export type EnrichmentJobsQuery = z.infer<typeof EnrichmentJobsQuerySchema>;
export type EnrichmentLinksQuery = z.infer<typeof EnrichmentLinksQuerySchema>;
export type EmailVerificationResult = z.infer<typeof EmailVerificationResultSchema>;
export type SocialScrapingResult = z.infer<typeof SocialScrapingResultSchema>;
export type OutletAuthorityResult = z.infer<typeof OutletAuthorityResultSchema>;
export type BatchEnrichmentRequest = z.infer<typeof BatchEnrichmentRequestSchema>;
