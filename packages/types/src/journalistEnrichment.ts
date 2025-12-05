/**
 * Journalist Enrichment Types (Sprint S50)
 * Type definitions for Smart Media Contact Enrichment Engine
 */

// ========================================
// Enums
// ========================================

export type EnrichmentSourceType =
  | 'email_verification'
  | 'social_scraping'
  | 'outlet_authority'
  | 'manual_entry'
  | 'api_integration'
  | 'web_scraping'
  | 'media_database'
  | 'contact_import';

export type EnrichmentRecordStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'merged'
  | 'archived';

export type EnrichmentJobType =
  | 'single_enrichment'
  | 'batch_enrichment'
  | 'email_verification_batch'
  | 'social_scraping_batch'
  | 'outlet_scoring_batch'
  | 'deduplication_scan'
  | 'auto_merge';

export type EnrichmentJobStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying';

export type EnrichmentLinkType =
  | 'primary'
  | 'alternate'
  | 'historical'
  | 'suggested'
  | 'rejected';

export type MergeStrategy =
  | 'overwrite'
  | 'append'
  | 'keep_existing';

export type QualityFlag =
  | 'stale_data'
  | 'low_confidence'
  | 'missing_critical_fields'
  | 'unverified_email'
  | 'unverified_phone'
  | 'low_outlet_authority'
  | 'missing_social_profiles'
  | 'duplicate_detected'
  | 'data_conflict';

// ========================================
// Core Interfaces
// ========================================

export interface SocialProfiles {
  twitter?: string;
  linkedin?: string;
  mastodon?: string;
  bluesky?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  tiktok?: string;
  threads?: string;
  [key: string]: string | undefined;
}

export interface OutletMetadata {
  alexaRank?: number;
  mozDomainAuthority?: number;
  monthlyVisitors?: number;
  similarWebRank?: number;
  backlinks?: number;
  referringDomains?: number;
  category?: string;
  subcategory?: string;
  geography?: string;
  language?: string;
  [key: string]: any;
}

export interface MergeSuggestion {
  targetId: string; // journalist_profile ID to merge with
  confidence: number; // 0-1
  reason: string; // Human-readable explanation
  fieldsToMerge: string[]; // ['email', 'social_profiles', 'outlet']
  matchScore: number; // 0-1
  matchFields: string[]; // Fields that matched
  potentialConflicts?: {
    field: string;
    currentValue: any;
    newValue: any;
  }[];
}

export interface EnrichmentMetadata {
  sourceApiVersion?: string;
  requestId?: string;
  processingTime?: number; // ms
  dataProvider?: string;
  costCredits?: number;
  rawResponse?: Record<string, any>;
  [key: string]: any;
}

// ========================================
// Enrichment Record
// ========================================

export interface JournalistEnrichmentRecord {
  id: string;
  orgId: string;

  // Source Information
  sourceType: EnrichmentSourceType;
  sourceId?: string;
  sourceUrl?: string;

  // Enriched Contact Data
  email?: string;
  emailVerified: boolean;
  emailConfidence?: number; // 0-1
  emailVerificationDate?: Date;
  emailVerificationMethod?: string;

  phone?: string;
  phoneVerified: boolean;
  phoneConfidence?: number; // 0-1

  // Social Profiles
  socialProfiles: SocialProfiles;
  socialProfilesVerified: boolean;
  socialProfilesConfidence?: number; // 0-1

  // Professional Information
  outlet?: string;
  outletVerified: boolean;
  outletAuthorityScore?: number; // 0-100
  outletDomain?: string;
  outletMetadata: OutletMetadata;

  jobTitle?: string;
  beat?: string[];
  beatConfidence?: number; // 0-1

  location?: string;
  locationVerified: boolean;
  timezone?: string;

  bio?: string;
  profileImageUrl?: string;

  // Enrichment Quality Metrics
  overallConfidenceScore: number; // 0-100
  dataFreshnessScore: number; // 0-100
  completenessScore: number; // 0-100

  // Deduplication
  potentialDuplicates?: string[]; // Array of journalist_profile IDs
  mergeSuggestions: MergeSuggestion[];

  // Metadata
  enrichmentMetadata: EnrichmentMetadata;
  qualityFlags: QualityFlag[];

  // Status
  status: EnrichmentRecordStatus;

  // Audit
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  enrichedAt?: Date;
  lastVerifiedAt?: Date;
}

// ========================================
// Enrichment Job
// ========================================

export interface EnrichmentJobInputData {
  journalistIds?: string[];
  emails?: string[];
  outlets?: string[];
  sourceUrls?: string[];
  csvData?: Record<string, any>[];
  [key: string]: any;
}

export interface EnrichmentJobError {
  item: any;
  error: string;
  timestamp: Date;
  retryable: boolean;
}

export interface EnrichmentJobResultSummary {
  totalEnriched: number;
  avgConfidenceScore: number;
  sourcesUsed: string[];
  emailsVerified: number;
  socialProfilesFound: number;
  outletScoresCalculated: number;
  duplicatesDetected: number;
  mergesSuggested: number;
  [key: string]: any;
}

export interface JournalistEnrichmentJob {
  id: string;
  orgId: string;

  // Job Configuration
  jobType: EnrichmentJobType;

  // Input Data
  inputData: EnrichmentJobInputData;
  enrichmentSources: EnrichmentSourceType[];

  // Processing Status
  status: EnrichmentJobStatus;

  // Progress Tracking
  totalItems: number;
  processedItems: number;
  successfulItems: number;
  failedItems: number;
  progressPercentage: number;

  // Results
  enrichmentRecordIds: string[];
  errorLog: EnrichmentJobError[];
  resultSummary: EnrichmentJobResultSummary;

  // Retry Logic
  retryCount: number;
  maxRetries: number;
  lastRetryAt?: Date;
  nextRetryAt?: Date;

  // Performance Metrics
  startedAt?: Date;
  completedAt?: Date;
  processingTimeSeconds?: number;

  // Audit
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// Enrichment Link
// ========================================

export interface JournalistEnrichmentLink {
  id: string;
  orgId: string;

  journalistId: string;
  enrichmentRecordId: string;

  // Link Metadata
  linkType: EnrichmentLinkType;
  linkConfidence?: number; // 0-1
  linkReason?: string;

  // Merge Status
  isMerged: boolean;
  mergedAt?: Date;
  mergedFields?: string[];
  mergeStrategy?: MergeStrategy;

  // Audit
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// Input Types
// ========================================

export interface CreateEnrichmentRecordInput {
  sourceType: EnrichmentSourceType;
  sourceId?: string;
  sourceUrl?: string;

  email?: string;
  emailVerified?: boolean;
  emailConfidence?: number;
  emailVerificationMethod?: string;

  phone?: string;
  phoneVerified?: boolean;
  phoneConfidence?: number;

  socialProfiles?: SocialProfiles;
  socialProfilesVerified?: boolean;
  socialProfilesConfidence?: number;

  outlet?: string;
  outletVerified?: boolean;
  outletAuthorityScore?: number;
  outletDomain?: string;
  outletMetadata?: OutletMetadata;

  jobTitle?: string;
  beat?: string[];
  beatConfidence?: number;

  location?: string;
  locationVerified?: boolean;
  timezone?: string;

  bio?: string;
  profileImageUrl?: string;

  enrichmentMetadata?: EnrichmentMetadata;
}

export interface UpdateEnrichmentRecordInput {
  email?: string;
  emailVerified?: boolean;
  emailConfidence?: number;

  phone?: string;
  phoneVerified?: boolean;
  phoneConfidence?: number;

  socialProfiles?: SocialProfiles;
  socialProfilesVerified?: boolean;
  socialProfilesConfidence?: number;

  outlet?: string;
  outletVerified?: boolean;
  outletAuthorityScore?: number;

  jobTitle?: string;
  beat?: string[];
  location?: string;
  bio?: string;

  status?: EnrichmentRecordStatus;
  qualityFlags?: QualityFlag[];
}

export interface CreateEnrichmentJobInput {
  jobType: EnrichmentJobType;
  inputData: EnrichmentJobInputData;
  enrichmentSources?: EnrichmentSourceType[];
  maxRetries?: number;
}

export interface CreateEnrichmentLinkInput {
  journalistId: string;
  enrichmentRecordId: string;
  linkType: EnrichmentLinkType;
  linkConfidence?: number;
  linkReason?: string;
}

export interface MergeEnrichmentInput {
  journalistId: string;
  enrichmentRecordId: string;
  mergeStrategy: MergeStrategy;
  fieldsToMerge: string[];
}

// ========================================
// Query Types
// ========================================

export interface EnrichmentRecordsQuery {
  sourceTypes?: EnrichmentSourceType[];
  status?: EnrichmentRecordStatus[];
  minConfidenceScore?: number;
  maxConfidenceScore?: number;
  minCompletenessScore?: number;
  emailVerified?: boolean;
  hasEmail?: boolean;
  hasPhone?: boolean;
  hasSocialProfiles?: boolean;
  outlet?: string;
  qualityFlags?: QualityFlag[];
  hasPotentialDuplicates?: boolean;
  searchQuery?: string; // Full-text search
  sortBy?: 'created_at' | 'updated_at' | 'overall_confidence_score' | 'data_freshness_score' | 'completeness_score';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface EnrichmentJobsQuery {
  jobType?: EnrichmentJobType[];
  status?: EnrichmentJobStatus[];
  createdBy?: string;
  minProgressPercentage?: number;
  sortBy?: 'created_at' | 'updated_at' | 'started_at' | 'completed_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface EnrichmentLinksQuery {
  journalistId?: string;
  enrichmentRecordId?: string;
  linkType?: EnrichmentLinkType[];
  isMerged?: boolean;
  sortBy?: 'created_at' | 'updated_at' | 'merged_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ========================================
// Response Types
// ========================================

export interface EnrichmentRecordsListResponse {
  records: JournalistEnrichmentRecord[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  summary?: {
    totalRecords: number;
    avgConfidenceScore: number;
    avgCompletenessScore: number;
    avgFreshnessScore: number;
    sourceDistribution: Record<EnrichmentSourceType, number>;
    statusDistribution: Record<EnrichmentRecordStatus, number>;
  };
}

export interface EnrichmentJobsListResponse {
  jobs: JournalistEnrichmentJob[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
  summary?: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgProcessingTime: number; // seconds
  };
}

export interface EnrichmentLinksListResponse {
  links: JournalistEnrichmentLink[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface DuplicateMatch {
  enrichmentId: string;
  matchScore: number; // 0-1
  matchFields: string[];
  record: JournalistEnrichmentRecord;
}

export interface FindDuplicatesResponse {
  duplicates: DuplicateMatch[];
  totalDuplicates: number;
}

export interface MergeSuggestionsResponse {
  suggestions: MergeSuggestion[];
  totalSuggestions: number;
  recommendedAction: 'merge' | 'review' | 'ignore';
  confidence: number; // 0-1
}

export interface EnrichmentStats {
  totalRecords: number;
  totalJobs: number;
  totalLinks: number;

  // Record Stats
  avgConfidenceScore: number;
  avgCompletenessScore: number;
  avgFreshnessScore: number;

  // Source Distribution
  sourceDistribution: Record<EnrichmentSourceType, number>;
  statusDistribution: Record<EnrichmentRecordStatus, number>;

  // Quality Metrics
  emailVerifiedCount: number;
  phoneVerifiedCount: number;
  socialProfilesCount: number;
  outletsScoredCount: number;

  // Deduplication
  potentialDuplicatesCount: number;
  mergeSuggestionsCount: number;
  mergedRecordsCount: number;

  // Job Stats
  activeJobsCount: number;
  completedJobsCount: number;
  failedJobsCount: number;
  avgJobProcessingTime: number; // seconds
}

// ========================================
// Email Verification Types
// ========================================

export interface EmailVerificationResult {
  email: string;
  isValid: boolean;
  isDeliverable: boolean;
  isDisposable: boolean;
  isFreeEmail: boolean;
  confidence: number; // 0-1
  verificationMethod: 'smtp' | 'syntax' | 'dns' | 'api';
  provider?: string;
  domain?: string;
  mxRecords?: string[];
  error?: string;
}

// ========================================
// Social Scraping Types
// ========================================

export interface SocialScrapingResult {
  platform: keyof SocialProfiles;
  profileUrl: string;
  username: string;
  displayName?: string;
  bio?: string;
  followerCount?: number;
  followingCount?: number;
  postCount?: number;
  verified?: boolean;
  profileImageUrl?: string;
  location?: string;
  websiteUrl?: string;
  confidence: number; // 0-1
  lastActive?: Date;
  error?: string;
}

// ========================================
// Outlet Authority Types
// ========================================

export interface OutletAuthorityResult {
  outlet: string;
  domain: string;
  authorityScore: number; // 0-100
  metrics: OutletMetadata;
  confidence: number; // 0-1
  dataSource: string;
  lastUpdated: Date;
  error?: string;
}

// ========================================
// Batch Enrichment Types
// ========================================

export interface BatchEnrichmentRequest {
  items: Array<{
    email?: string;
    outlet?: string;
    socialProfile?: string;
    name?: string;
  }>;
  sources: EnrichmentSourceType[];
  autoLink?: boolean; // Auto-link to existing journalist profiles
  autoMerge?: boolean; // Auto-merge high-confidence matches
}

export interface BatchEnrichmentResponse {
  jobId: string;
  totalItems: number;
  estimatedCompletionTime?: number; // seconds
  status: EnrichmentJobStatus;
}
