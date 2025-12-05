/**
 * Journalist Identity Graph & Contact Intelligence Types (Sprint S46)
 */

// ===================================
// Core Profile Types
// ===================================

export interface JournalistProfile {
  id: string;
  orgId: string;
  fullName: string;
  primaryEmail: string;
  secondaryEmails: string[];
  primaryOutlet?: string;
  secondaryOutlets: string[];
  beat?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  bio?: string;
  engagementScore: number;
  responsivenessScore: number;
  relevanceScore: number;
  tier?: JournalistTier;
  lastActivityAt?: Date;
  lastScoredAt?: Date;
  notes?: string;
  tags: string[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnrichedJournalistProfile extends JournalistProfile {
  recentActivities: JournalistActivity[];
  activitySummary: JournalistActivitySummary;
  coverageCount?: number;
  outreachCount?: number;
  responseRate?: number;
  engagementModel?: JournalistEngagementModel;
  responsivenessModel?: JournalistResponsivenessModel;
  relevanceModel?: JournalistRelevanceModel;
  mergeHistory?: JournalistMergeRecord[];
}

export type JournalistTier = 'A' | 'B' | 'C' | 'D';

// ===================================
// Activity Types
// ===================================

export type ActivityType =
  | 'press_release_sent'
  | 'pitch_sent'
  | 'mention_detected'
  | 'coverage_published'
  | 'outreach_email'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'discovered'
  | 'manual_log';

export type SourceSystem =
  | 's38_pr_generator'
  | 's39_pitch_engine'
  | 's40_media_monitoring'
  | 's44_outreach'
  | 's45_deliverability'
  | 'discovery_engine'
  | 'manual';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface JournalistActivity {
  id: string;
  orgId: string;
  journalistId: string;
  activityType: ActivityType;
  sourceSystem: SourceSystem;
  sourceId?: string;
  activityData: Record<string, unknown>;
  sentiment?: Sentiment;
  occurredAt: Date;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface JournalistActivitySummary {
  totalActivities: number;
  totalOutreach: number;
  totalCoverage: number;
  totalMentions?: number;
  totalEmailsSent: number;
  totalEmailsOpened: number;
  totalEmailsClicked: number;
  totalEmailsReplied: number;
  openRate?: number;
  clickRate?: number;
  replyRate?: number;
  coverageRate?: number;
  firstActivityAt?: Date | null;
  lastActivityAt?: Date | null;
  positiveSentimentCount?: number;
  negativeSentimentCount?: number;
  neutralSentimentCount?: number;
}

// ===================================
// Identity Resolution Types
// ===================================

export interface IdentityResolutionInput {
  fullName?: string;
  email?: string;
  secondaryEmails?: string[];
  outlet?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  matchThreshold?: number;
}

export interface IdentityMatch {
  journalistId: string;
  profile: JournalistProfile;
  matchScore: number;
  matchReasons: string[];
}

export interface FuzzyMatchResult {
  score: number;
  matches: IdentityMatch[];
  suggestedMerges: Array<{
    journalist1Id: string;
    journalist2Id: string;
    matchScore: number;
    reason: string;
  }>;
}

export interface DuplicateSet {
  profiles: JournalistProfile[];
  matchScore: number;
  suggestedCanonical: string;
}

// ===================================
// Merge Types
// ===================================

export interface JournalistMergeRecord {
  id: string;
  orgId: string;
  mergedId?: string;
  canonicalId?: string;
  survivingJournalistId?: string;
  mergedJournalistId?: string;
  mergedAt: Date;
  mergedBy?: string;
  mergeReason?: string;
  originalData?: Record<string, unknown>;
  createdAt?: Date;
}

export interface MergeProfilesInput {
  sourceId?: string;
  targetId?: string;
  survivingJournalistId?: string;
  mergedJournalistId?: string;
  mergeReason?: string;
  fieldResolution?: {
    primaryEmail?: 'source' | 'target';
    fullName?: 'source' | 'target';
    primaryOutlet?: 'source' | 'target';
    beat?: 'source' | 'target';
    twitterHandle?: 'source' | 'target';
    linkedinUrl?: 'source' | 'target';
    bio?: 'source' | 'target';
    notes?: 'source' | 'target';
  };
}

// ===================================
// Scoring Model Types
// ===================================

export interface JournalistEngagementModel {
  journalistId?: string;
  engagementScore: number;
  components: {
    responseRate: number;
    coverageRate: number;
    openRate: number;
    activityVolume: number;
  };
  tierEstimate?: JournalistTier;
  lastCalculatedAt?: Date;
  calculatedAt?: Date;
}

export interface JournalistResponsivenessModel {
  journalistId?: string;
  responsivenessScore: number;
  replyRate: number;
  avgResponseTimeHours?: number;
  averageResponseTime?: number;
  responseDistribution?: {
    immediate: number;
    fast: number;
    slow: number;
    none: number;
  };
  lastCalculatedAt?: Date;
  calculatedAt?: Date;
}

export interface JournalistRelevanceModel {
  journalistId?: string;
  relevanceScore: number;
  beatAlignment?: number;
  outletAlignment?: number;
  topicMatches?: string[];
  historicalCoverageRelevance?: number;
  lastCalculatedAt?: Date;
  calculatedAt?: Date;
}

export interface JournalistTierClassification {
  journalistId?: string;
  tier: JournalistTier;
  totalPoints?: number;
  breakdown?: {
    outletTierPoints: number;
    engagementPoints: number;
    coveragePoints: number;
    responsivenessPoints: number;
  };
  details?: {
    outletTier: 'tier1' | 'tier2' | 'tier3' | 'unknown';
    engagementLevel: 'high' | 'medium' | 'low';
    coverageFrequency: 'frequent' | 'occasional' | 'rare';
    responsivenessLevel: 'high' | 'medium' | 'low';
  };
  tierReason?: string;
  criteria?: {
    outletTier: string;
    engagementLevel: string;
    coverageFrequency: string;
    responsivenessLevel: string;
  };
  calculatedAt?: Date;
}

// ===================================
// Graph Types
// ===================================

export type JournalistGraphNodeType = 'journalist' | 'outlet' | 'topic' | 'coverage' | 'outreach';

export type JournalistGraphEdgeType =
  | 'works_for'
  | 'covers'
  | 'wrote_about'
  | 'received_outreach'
  | 'mentioned_in'
  | 'collaborated_with';

export interface JournalistGraphNode {
  id: string;
  type: JournalistGraphNodeType;
  data: Record<string, unknown>;
}

export interface JournalistGraphEdge {
  source: string;
  target: string;
  type: JournalistGraphEdgeType;
  weight?: number;
}

export interface JournalistGraph {
  nodes: JournalistGraphNode[];
  edges: JournalistGraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    generatedAt: Date;
    centerJournalistId?: string;
  };
}

// ===================================
// Input Types
// ===================================

export interface CreateJournalistProfileInput {
  fullName: string;
  primaryEmail: string;
  secondaryEmails?: string[];
  primaryOutlet?: string;
  secondaryOutlets?: string[];
  beat?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  bio?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UpdateJournalistProfileInput {
  fullName?: string;
  primaryEmail?: string;
  secondaryEmails?: string[];
  primaryOutlet?: string;
  secondaryOutlets?: string[];
  beat?: string;
  twitterHandle?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
  bio?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  engagementScore?: number;
  responsivenessScore?: number;
  relevanceScore?: number;
  tier?: JournalistTier;
}

export interface CreateActivityInput {
  journalistId: string;
  activityType: ActivityType;
  sourceSystem: SourceSystem;
  sourceId?: string;
  activityData?: Record<string, unknown>;
  sentiment?: Sentiment;
  occurredAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface BatchCreateActivitiesInput {
  activities: CreateActivityInput[];
}

export interface BatchUpdateScoresInput {
  journalistIds: string[];
}

// ===================================
// Query Types
// ===================================

export interface ListJournalistProfilesQuery {
  q?: string;
  outlet?: string;
  beat?: string;
  minEngagementScore?: number;
  minRelevanceScore?: number;
  sortBy?: 'engagement_score' | 'relevance_score' | 'last_activity_at' | 'full_name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ListActivitiesQuery {
  journalistId?: string;
  activityType?: ActivityType | ActivityType[];
  sourceSystem?: SourceSystem | SourceSystem[];
  sentiment?: Sentiment;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface GraphQuery {
  journalistIds?: string[];
  includeOutlets?: boolean;
  includeTopics?: boolean;
  includeCoverage?: boolean;
  includeOutreach?: boolean;
  minEngagementScore?: number;
  maxDepth?: number;
}
