/**
 * Journalist Discovery Engine Types (Sprint S48)
 * Automatic discovery and enrichment of journalists from multiple sources
 */

// ===================================
// Enums and Constants
// ===================================

export type DiscoverySourceType =
  | 'article_author'
  | 'rss_feed'
  | 'social_profile'
  | 'staff_directory';

export type DiscoveryStatus =
  | 'pending'      // Awaiting human review
  | 'confirmed'    // Vetted and ready to merge
  | 'merged'       // Attached to journalist graph
  | 'rejected';    // Not a journalist or duplicate

export type SocialPlatform = 'twitter' | 'linkedin' | 'mastodon' | 'bluesky';

// ===================================
// Core Types
// ===================================

export interface DiscoveredJournalist {
  id: string;
  orgId: string;

  // Basic info
  fullName: string;
  email?: string;
  outlet?: string;

  // Discovery metadata
  socialLinks: SocialProfileLinks;
  beats: string[];
  bio?: string;

  // Confidence & scoring
  confidenceScore: number;
  confidenceBreakdown: DiscoveryConfidenceBreakdown;

  // Source tracking
  sourceType: DiscoverySourceType;
  sourceUrl?: string;
  rawPayload: Record<string, any>;

  // Status workflow
  status: DiscoveryStatus;
  mergedInto?: string;

  // Resolution tracking
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNotes?: string;

  // Suggested matches
  suggestedMatches: SuggestedMatch[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialProfileLinks {
  twitter?: string;
  linkedin?: string;
  mastodon?: string;
  bluesky?: string;
  [key: string]: string | undefined;
}

export interface DiscoveryConfidenceBreakdown {
  nameConfidence: number;      // 0-1: Name quality and completeness
  emailConfidence: number;      // 0-1: Email validity and format
  outletConfidence: number;     // 0-1: Outlet identification strength
  socialConfidence: number;     // 0-1: Social profile verification
  beatConfidence: number;       // 0-1: Beat classification accuracy
  overallScore: number;         // Weighted combination
}

export interface SuggestedMatch {
  journalistId: string;
  journalistName: string;
  similarityScore: number;
  matchReason: string;
  confidence: number;
}

// ===================================
// Input Types
// ===================================

export interface DiscoveredJournalistInput {
  fullName: string;
  email?: string;
  outlet?: string;
  socialLinks?: Partial<SocialProfileLinks>;
  beats?: string[];
  bio?: string;
  sourceType: DiscoverySourceType;
  sourceUrl?: string;
  rawPayload?: Record<string, any>;
}

export interface ResolveDiscoveryInput {
  action: 'merge' | 'confirm' | 'reject';
  targetJournalistId?: string;  // For merge action
  notes?: string;
}

export interface AuthorExtractionInput {
  articleTitle: string;
  articleContent: string;
  articleUrl: string;
  outlet?: string;
  publishedDate?: Date;
  metadata?: Record<string, any>;
}

export interface SocialProfileInput {
  platform: SocialPlatform;
  handle: string;
  profileUrl: string;
  displayName?: string;
  bio?: string;
  followers?: number;
  metadata?: Record<string, any>;
}

// ===================================
// Result Types
// ===================================

export interface AuthorExtractionResult {
  authors: DiscoveredJournalistInput[];
  confidence: number;
  extractionMethod: string;
  metadata: {
    articleTitle: string;
    articleUrl: string;
    outlet?: string;
    extractedBeats: string[];
  };
}

export interface DiscoveryEnrichmentResult {
  discovery: DiscoveredJournalist;
  enrichments: {
    additionalEmails: string[];
    verifiedSocialLinks: SocialProfileLinks;
    estimatedBeats: string[];
    outletVerification: {
      verified: boolean;
      tier?: string;
      confidence: number;
    };
  };
}

export interface MergePreview {
  discoveryId: string;
  targetJournalistId: string;
  conflicts: Array<{
    field: string;
    discoveryValue: any;
    existingValue: any;
    recommendation: 'keep_existing' | 'use_discovery' | 'merge_both';
  }>;
  autoResolvable: boolean;
}

// ===================================
// Query Types
// ===================================

export interface DiscoveryQuery {
  q?: string;
  status?: DiscoveryStatus | DiscoveryStatus[];
  sourceType?: DiscoverySourceType | DiscoverySourceType[];
  minConfidenceScore?: number;
  beats?: string[];
  hasEmail?: boolean;
  hasSocialLinks?: boolean;
  sortBy?: 'created_at' | 'confidence_score' | 'full_name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DiscoveryStats {
  totalDiscoveries: number;
  pendingCount: number;
  confirmedCount: number;
  mergedCount: number;
  rejectedCount: number;
  avgConfidenceScore: number;
  sourceTypeDistribution: Record<DiscoverySourceType, number>;
}

// ===================================
// List Response Types
// ===================================

export interface DiscoveryListResponse {
  discoveries: DiscoveredJournalist[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  stats?: DiscoveryStats;
}

// ===================================
// Social Profile Analysis Types
// ===================================

export interface SocialProfileAnalysis {
  platform: SocialPlatform;
  handle: string;
  verified: boolean;
  followerCount?: number;
  engagement: {
    avgLikes?: number;
    avgComments?: number;
    avgRetweets?: number;
  };
  topics: string[];
  isJournalist: boolean;
  confidence: number;
  bio?: string;
}

// ===================================
// Deduplication Types
// ===================================

export interface DeduplicationResult {
  isDuplicate: boolean;
  matchedJournalistId?: string;
  similarityScore: number;
  matchedFields: string[];
  recommendation: 'merge' | 'create_new' | 'needs_review';
}

export interface FuzzyMatchOptions {
  nameThreshold: number;
  emailWeight: number;
  outletWeight: number;
  socialWeight: number;
}

// ===================================
// Batch Processing Types
// ===================================

export interface BatchDiscoveryInput {
  discoveries: DiscoveredJournalistInput[];
  autoMergeThreshold?: number;
  skipDuplicates?: boolean;
}

export interface BatchDiscoveryResult {
  created: number;
  merged: number;
  skipped: number;
  errors: Array<{
    index: number;
    error: string;
    input: DiscoveredJournalistInput;
  }>;
}

// ===================================
// Discovery Pipeline Types
// ===================================

export interface DiscoveryPipeline {
  id: string;
  name: string;
  sourceType: DiscoverySourceType;
  enabled: boolean;
  schedule?: string;  // Cron expression
  config: {
    autoMergeEnabled: boolean;
    minimumConfidenceScore: number;
    deduplicationStrategy: 'strict' | 'moderate' | 'lenient';
  };
  stats: {
    lastRun?: Date;
    totalProcessed: number;
    totalDiscovered: number;
    totalMerged: number;
  };
}

// ===================================
// Outlet Staff Directory Types
// ===================================

export interface StaffDirectorySource {
  outletName: string;
  directoryUrl: string;
  parseStrategy: string;
  lastCrawled?: Date;
}

export interface StaffDirectoryEntry {
  fullName: string;
  email?: string;
  role?: string;
  beat?: string;
  socialLinks?: Partial<SocialProfileLinks>;
}

// ===================================
// Validation Types
// ===================================

export interface DiscoveryValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

// ===================================
// Enrichment Service Types
// ===================================

export interface EnrichmentSource {
  name: string;
  type: 'social' | 'email' | 'outlet' | 'web';
  priority: number;
  enabled: boolean;
}

export interface EnrichmentTask {
  discoveryId: string;
  sources: EnrichmentSource[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  results: Record<string, any>;
}
