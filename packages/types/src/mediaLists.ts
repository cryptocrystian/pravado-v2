/**
 * AI Media List Builder Types (Sprint S47)
 * Auto-generates intelligent, hyper-targeted media lists
 */

// ===================================
// Core Types
// ===================================

export type TierLevel = 'A' | 'B' | 'C' | 'D';

export interface MediaList {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  inputTopic: string;
  inputKeywords: string[];
  inputMarket?: string;
  inputGeography?: string;
  inputProduct?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaListEntry {
  id: string;
  listId: string;
  journalistId: string;
  fitScore: number;
  tier: TierLevel;
  reason: string;
  fitBreakdown: FitScoreBreakdown;
  position?: number;
  createdAt: Date;
}

export interface MediaListWithEntries extends MediaList {
  entries: MediaListEntryWithJournalist[];
  totalEntries: number;
  tierACount: number;
  tierBCount: number;
  tierCCount: number;
  tierDCount: number;
  avgFitScore: number;
}

export interface MediaListEntryWithJournalist extends MediaListEntry {
  journalist: {
    id: string;
    fullName: string;
    primaryEmail: string;
    primaryOutlet?: string;
    beat?: string;
    engagementScore: number;
    responsivenessScore: number;
    relevanceScore: number;
    tier?: string;
  };
}

export interface MediaListSummary extends MediaList {
  totalEntries: number;
  tierACount: number;
  tierBCount: number;
  tierCCount: number;
  tierDCount: number;
  avgFitScore: number;
}

// ===================================
// Fit Scoring Types
// ===================================

export interface FitScoreBreakdown {
  topicRelevance: number;      // 40% weight
  pastCoverage: number;          // 25% weight
  engagement: number;            // 15% weight
  responsiveness: number;        // 10% weight
  outletTier: number;            // 10% weight
  totalScore: number;
}

export interface FitScoringWeights {
  topicRelevance: number;
  pastCoverage: number;
  engagement: number;
  responsiveness: number;
  outletTier: number;
}

export const DEFAULT_FIT_WEIGHTS: FitScoringWeights = {
  topicRelevance: 0.40,
  pastCoverage: 0.25,
  engagement: 0.15,
  responsiveness: 0.10,
  outletTier: 0.10,
};

// ===================================
// Input Types
// ===================================

export interface MediaListGenerationInput {
  topic: string;
  keywords?: string[];
  market?: string;
  geography?: string;
  product?: string;
  targetCount?: number;
  minFitScore?: number;
  includeTiers?: TierLevel[];
}

export interface MediaListCreateInput {
  name: string;
  description?: string;
  inputTopic: string;
  inputKeywords?: string[];
  inputMarket?: string;
  inputGeography?: string;
  inputProduct?: string;
}

export interface MediaListUpdateInput {
  name?: string;
  description?: string;
}

// ===================================
// Generation Result Types
// ===================================

export interface MediaListGenerationResult {
  matches: JournalistMatch[];
  metadata: {
    totalCandidates: number;
    totalMatches: number;
    avgFitScore: number;
    tierDistribution: {
      A: number;
      B: number;
      C: number;
      D: number;
    };
    generatedAt: Date;
  };
}

export interface JournalistMatch {
  journalistId: string;
  journalist: {
    id: string;
    fullName: string;
    primaryEmail: string;
    primaryOutlet?: string;
    beat?: string;
    engagementScore: number;
    responsivenessScore: number;
    relevanceScore: number;
    tier?: string;
  };
  fitScore: number;
  tier: TierLevel;
  reason: string;
  fitBreakdown: FitScoreBreakdown;
}

// ===================================
// Query Types
// ===================================

export interface MediaListQuery {
  q?: string;
  topic?: string;
  market?: string;
  createdBy?: string;
  sortBy?: 'created_at' | 'updated_at' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MediaListEntryQuery {
  listId: string;
  tier?: TierLevel | TierLevel[];
  minFitScore?: number;
  sortBy?: 'fit_score' | 'position';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ===================================
// Analysis Types
// ===================================

export interface TopicRelevanceAnalysis {
  score: number;
  matchedKeywords: string[];
  beatAlignment: number;
  bioAlignment: number;
}

export interface PastCoverageAnalysis {
  score: number;
  totalCoverage: number;
  relevantCoverage: number;
  recentCoverage: number;
  coverageQuality: number;
}

export interface JournalistFitAnalysis {
  journalistId: string;
  fitScore: number;
  tier: TierLevel;
  breakdown: FitScoreBreakdown;
  topicRelevance: TopicRelevanceAnalysis;
  pastCoverage: PastCoverageAnalysis;
  engagement: {
    score: number;
    engagementScore: number;
  };
  responsiveness: {
    score: number;
    responsivenessScore: number;
    replyRate: number;
  };
  outletTier: {
    score: number;
    outlet?: string;
    tier: 'tier1' | 'tier2' | 'tier3' | 'unknown';
  };
}
