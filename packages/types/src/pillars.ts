/**
 * Pillar types for Pravado's three intelligence systems
 * PR Intelligence, Content Intelligence, SEO Intelligence
 */

import type { UUID, BaseEntity, ApiResponse } from './common';

// ========================================
// PR INTELLIGENCE TYPES
// ========================================

export interface MediaOutlet extends BaseEntity {
  orgId: UUID;
  name: string;
  domain: string | null;
  websiteUrl: string | null;
  country: string | null;
  language: string | null;
  outletType: 'newspaper' | 'magazine' | 'blog' | 'podcast' | 'tv' | 'radio' | null;
  tier: string | null; // 'top_tier', 'trade', 'niche', etc.
  distribution: string | null; // 'national', 'regional', 'local', 'global'
  reachEstimate: number | null;
  metadata: Record<string, unknown>;
}

export interface Journalist extends BaseEntity {
  orgId: UUID;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  name: string; // deprecated, kept for backward compatibility
  email: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  mediaOutletId: UUID | null; // deprecated, use primaryOutletId
  primaryOutletId: UUID | null;
  location: string | null;
  timezone: string | null;
  bio: string | null;
  isFreelancer: boolean;
  beat: string | null; // deprecated, use beats relationship
  metadata: Record<string, unknown>;
}

export interface PRSource extends BaseEntity {
  orgId: UUID;
  sourceType: 'press_release' | 'backlink' | 'mention' | 'earned_media';
  title: string | null;
  url: string | null;
  publishedAt: string | null;
  mediaOutletId: UUID | null;
  journalistId: UUID | null;
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  eviScore: number | null; // Earned Value Index score
  metadata: Record<string, unknown>;
}

export interface PREvent extends BaseEntity {
  orgId: UUID;
  eventType: 'campaign_launch' | 'pr_outreach' | 'media_alert' | 'pitch_sent';
  title: string;
  description: string | null;
  eventDate: string;
  prSourceId: UUID | null;
  metadata: Record<string, unknown>;
}

export interface PRTopic extends BaseEntity {
  orgId: UUID;
  topicName: string;
  embedding: number[] | null; // Vector embedding for semantic search
  prSourceId: UUID | null;
  relevanceScore: number | null;
  metadata: Record<string, unknown>;
}

export interface PRBeat extends BaseEntity {
  orgId: UUID;
  name: string;
  description: string | null;
}

export interface JournalistBeat extends BaseEntity {
  orgId: UUID;
  journalistId: UUID;
  beatId: UUID;
  isPrimary: boolean;
}

export interface PRList extends BaseEntity {
  orgId: UUID;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdBy: UUID | null;
}

export interface PRListMember extends BaseEntity {
  orgId: UUID;
  listId: UUID;
  journalistId: UUID;
  addedBy: UUID | null;
  addedAt: string;
}

// ========================================
// PR INTELLIGENCE DTOs
// ========================================

export interface JournalistWithContext {
  journalist: Journalist;
  outlet: MediaOutlet | null;
  beats: PRBeat[];
  topics: string[]; // topic names
}

export interface PRListWithMembers {
  list: PRList;
  members: JournalistWithContext[];
  memberCount: number;
}

// ========================================
// CONTENT INTELLIGENCE TYPES (S3 + S12)
// ========================================

export type ContentStatus = 'draft' | 'published' | 'archived';
export type ContentBriefStatus = 'draft' | 'in_progress' | 'completed';

export interface ContentItem extends BaseEntity {
  orgId: UUID;
  title: string;
  slug: string | null; // URL-friendly identifier
  contentType: 'blog_post' | 'social_post' | 'long_form' | 'video_script' | 'newsletter';
  status: ContentStatus; // S12: Enhanced with type
  body: string | null;
  url: string | null; // S12: Added
  publishedAt: string | null;
  wordCount: number | null; // S12: Enhanced
  readingTimeMinutes: number | null;
  performanceScore: number | null;
  primaryTopicId: UUID | null; // S12: Added for topic clustering
  embeddings?: number[] | null; // S12: Added for similarity
  performance: Record<string, unknown>; // S12: Added for analytics stub
  metadata: Record<string, unknown>;
}

export interface ContentBrief extends BaseEntity {
  orgId: UUID;
  title: string;
  targetAudience: string | null;
  targetKeywords: string[]; // S3 original
  targetKeyword: string | null; // S12: Primary keyword
  targetIntent: string | null; // S12: Added
  outline: Record<string, unknown> | null; // S12: Changed from string to JSONB
  tone: 'professional' | 'casual' | 'technical' | 'friendly' | null;
  minWordCount: number | null;
  maxWordCount: number | null;
  contentItemId: UUID | null;
  status: ContentBriefStatus; // S12: Enhanced with new status values
  metadata: Record<string, unknown>;
}

export interface ContentTopic extends BaseEntity {
  orgId: UUID;
  name: string; // Renamed from topicName for consistency
  topicName?: string; // Kept for backward compatibility
  description: string | null;
  embedding?: number[] | null; // S3 original (singular)
  embeddings?: number[] | null; // S12: Added (plural for consistency)
  contentItemId: UUID | null;
  relevanceScore: number | null;
  clusterId?: UUID | null; // S12: Added for clustering
  metadata: Record<string, unknown>;
}

export interface ContentTopicCluster extends BaseEntity {
  orgId: UUID;
  name: string;
  description?: string | null;
}

// ========================================
// CONTENT INTELLIGENCE DTOs (S12)
// ========================================

export interface ContentItemListDTO {
  items: ContentItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContentBriefWithContextDTO {
  brief: ContentBrief;
  relatedTopics: ContentTopic[];
  suggestedKeywords: string[];
}

export interface ContentClusterDTO {
  cluster: ContentTopicCluster;
  topics: ContentTopic[];
  representativeContent: ContentItem[];
}

export interface ContentGapDTO {
  keyword: string;
  intent: string | null;
  existingContentCount: number;
  seoOpportunityScore: number;
}

// ========================================
// SEO INTELLIGENCE TYPES
// ========================================

export type SEOKeywordIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';

export interface SEOKeyword extends BaseEntity {
  orgId: UUID;
  keyword: string;
  searchVolume: number | null;
  difficultyScore: number | null;
  currentPosition: number | null;
  targetPosition: number | null;
  trackedUrl: string | null;
  status: 'active' | 'paused' | 'archived';
  intent: SEOKeywordIntent | null;
  metadata: Record<string, unknown>;
}

export interface SEOKeywordMetric extends BaseEntity {
  orgId: UUID;
  keywordId: UUID;
  source: string;
  searchVolume: number | null;
  difficulty: number | null;
  cpc: number | null;
  clickThroughRate: number | null;
  priorityScore: number | null;
  lastRefreshedAt: string;
}

export interface SEOSerpResult extends BaseEntity {
  orgId: UUID;
  keywordId: UUID;
  url: string;
  title: string | null;
  snippet: string | null;
  rank: number;
  isCompetitor: boolean;
  competitorId: UUID | null;
  snapshotId: UUID | null;
  lastSeenAt: string;
}

export interface SEOPage extends BaseEntity {
  orgId: UUID;
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1Tag: string | null;
  wordCount: number | null;
  internalLinksCount: number | null;
  externalLinksCount: number | null;
  pageSpeedScore: number | null;
  mobileFriendly: boolean;
  indexed: boolean;
  lastCrawledAt: string | null;
  metadata: Record<string, unknown>;
}

export interface SEOOpportunity extends BaseEntity {
  orgId: UUID;
  opportunityType:
    | 'keyword_gap'
    | 'content_refresh'
    | 'broken_link'
    | 'missing_meta'
    | 'low_content';
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedImpact: string | null;
  seoPageId: UUID | null;
  seoKeywordId: UUID | null;
  status: 'open' | 'in_progress' | 'completed' | 'dismissed';
  metadata: Record<string, unknown>;
}

export interface SEOCompetitor extends BaseEntity {
  orgId: UUID;
  domain: string;
  name: string | null;
  domainAuthority: number | null;
  organicTrafficEstimate: number | null;
  topKeywordsCount: number | null;
  metadata: Record<string, unknown>;
}

export interface SEOSnapshot {
  id: UUID;
  orgId: UUID;
  seoKeywordId: UUID;
  capturedAt: string;
  position: number | null;
  serpData: Record<string, unknown>;
  ourUrl: string | null;
  competitorUrls: string[];
  featuresPresent: string[]; // ['featured_snippet', 'people_also_ask', etc.]
  createdAt: string;
}

export interface SEOPageAudit extends BaseEntity {
  orgId: UUID;
  pageId: UUID;
  auditType: string; // 'onpage', 'technical', 'content', etc.
  score: number | null; // 0-100
  status: 'pending' | 'completed' | 'failed';
  issuesCount: number;
  warningsCount: number;
  notes: string | null;
  snapshotAt: string;
}

export interface SEOPageIssue extends BaseEntity {
  orgId: UUID;
  auditId: UUID;
  pageId: UUID;
  issueType: string; // 'missing_title', 'thin_content', 'slow_performance', etc.
  severity: 'low' | 'medium' | 'high';
  field: string | null; // 'title', 'meta_description', 'h1', 'content', etc.
  message: string;
  hint: string | null;
}

export interface SEOBacklink extends BaseEntity {
  orgId: UUID;
  pageId: UUID | null;
  sourceUrl: string;
  anchorText: string | null;
  linkType: 'dofollow' | 'nofollow' | 'ugc' | 'sponsored';
  discoveredAt: string;
  lastSeenAt: string;
  lostAt: string | null;
  referringDomainId: UUID | null;
}

export interface SEOReferringDomain extends BaseEntity {
  orgId: UUID;
  domain: string;
  domainAuthority: number | null; // 0-100
  spamScore: number | null; // 0-100
  totalBacklinks: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

// ========================================
// SEO DTOs (Data Transfer Objects)
// ========================================

export interface SEOKeywordWithMetrics {
  keyword: SEOKeyword;
  metrics: SEOKeywordMetric | null;
}

export interface SEOOpportunityDTO {
  id: UUID;
  orgId: UUID;
  keyword: SEOKeyword;
  metrics: SEOKeywordMetric | null;
  currentPage: SEOPage | null;
  gapSummary: string;
  recommendedAction: string;
  priorityScore: number;
  opportunityType: 'keyword_gap' | 'content_refresh' | 'broken_link' | 'missing_meta' | 'low_content';
  status: 'open' | 'in_progress' | 'completed' | 'dismissed';
  createdAt: string;
  updatedAt: string;
}

export interface SEOSerpSnapshot {
  keywordId: UUID;
  keyword: string;
  results: SEOSerpResult[];
  topCompetitors: {
    domain: string;
    rank: number;
    url: string;
  }[];
  ourBestRank: number | null;
  capturedAt: string;
}

export interface SEOPageAuditWithIssues {
  audit: SEOPageAudit;
  page: SEOPage;
  issues: SEOPageIssue[];
  recommendations: string[];
}

export interface SEOBacklinkProfile {
  totalBacklinks: number;
  activeBacklinks: number;
  lostBacklinks: number;
  dofollowCount: number;
  nofollowCount: number;
  referringDomains: SEOReferringDomain[];
  recentBacklinks: SEOBacklink[];
  topAnchorTexts: { text: string; count: number }[];
}

// ========================================
// SHARED TAG TYPES
// ========================================

export interface Tag extends BaseEntity {
  orgId: UUID;
  name: string;
  color: string | null; // hex color code
}

export interface TagAssignment {
  id: UUID;
  orgId: UUID;
  tagId: UUID;
  taggableType: string; // 'pr_source', 'content_item', 'seo_keyword', etc.
  taggableId: UUID;
  createdAt: string;
}

// ========================================
// API RESPONSE TYPES
// ========================================

// PR API Responses
export type ListPRSourcesResponse = ApiResponse<{ items: PRSource[] }>;
export type GetPRSourceResponse = ApiResponse<{ item: PRSource }>;
export type ListMediaOutletsResponse = ApiResponse<{ items: MediaOutlet[] }>;
export type ListJournalistsResponse = ApiResponse<{ items: Journalist[] }>;
export type ListJournalistsWithContextResponse = ApiResponse<{
  items: JournalistWithContext[];
  total: number;
  limit: number;
  offset: number;
}>;
export type ListPRBeatsResponse = ApiResponse<{ items: PRBeat[] }>;
export type ListPRListsResponse = ApiResponse<{ items: PRList[] }>;
export type GetPRListResponse = ApiResponse<{ item: PRList }>;
export type GetPRListWithMembersResponse = ApiResponse<{ item: PRListWithMembers }>;
export type CreatePRListResponse = ApiResponse<{ item: PRList }>;
export type UpdatePRListMembersResponse = ApiResponse<{ item: PRListWithMembers }>;

// Content API Responses (S3 + S12)
export type ListContentItemsResponse = ApiResponse<ContentItemListDTO>; // S12: Enhanced with pagination
export type GetContentItemResponse = ApiResponse<{ item: ContentItem }>;
export type CreateContentItemResponse = ApiResponse<{ item: ContentItem }>; // S12: Added
export type UpdateContentItemResponse = ApiResponse<{ item: ContentItem }>; // S12: Added
export type ListContentBriefsResponse = ApiResponse<{ items: ContentBrief[] }>;
export type GetContentBriefResponse = ApiResponse<{ item: ContentBrief }>;
export type GetContentBriefWithContextResponse = ApiResponse<ContentBriefWithContextDTO>; // S12: Added
export type CreateContentBriefResponse = ApiResponse<{ item: ContentBrief }>; // S12: Added
export type UpdateContentBriefResponse = ApiResponse<{ item: ContentBrief }>; // S12: Added
export type ListContentClustersResponse = ApiResponse<{ items: ContentClusterDTO[] }>; // S12: Added
export type ListContentGapsResponse = ApiResponse<{ items: ContentGapDTO[] }>; // S12: Added

// SEO API Responses
export type ListSEOKeywordsResponse = ApiResponse<{ items: SEOKeyword[]; total?: number }>;
export type ListSEOKeywordsWithMetricsResponse = ApiResponse<{
  items: SEOKeywordWithMetrics[];
  total?: number;
  page?: number;
  pageSize?: number;
}>;
export type GetSEOKeywordResponse = ApiResponse<{ item: SEOKeyword }>;
export type ListSEOPagesResponse = ApiResponse<{ items: SEOPage[] }>;
export type GetSEOPageResponse = ApiResponse<{ item: SEOPage }>;
export type ListSEOOpportunitiesResponse = ApiResponse<{ items: SEOOpportunity[] }>;
export type ListSEOOpportunityDTOsResponse = ApiResponse<{ items: SEOOpportunityDTO[] }>;
export type GetSEOOpportunityResponse = ApiResponse<{ item: SEOOpportunity }>;
export type ListSEOCompetitorsResponse = ApiResponse<{ items: SEOCompetitor[] }>;
export type ListSEOSnapshotsResponse = ApiResponse<{ items: SEOSnapshot[] }>;
export type GetSEOSerpSnapshotResponse = ApiResponse<{ snapshot: SEOSerpSnapshot }>;
export type GetSEOPageAuditResponse = ApiResponse<{ auditWithIssues: SEOPageAuditWithIssues }>;
export type ListSEOPageAuditsResponse = ApiResponse<{ items: SEOPageAudit[] }>;
export type GetSEOBacklinkProfileResponse = ApiResponse<{ profile: SEOBacklinkProfile }>;
export type ListSEOBacklinksResponse = ApiResponse<{ items: SEOBacklink[]; total: number }>;
export type ListSEOReferringDomainsResponse = ApiResponse<{ items: SEOReferringDomain[]; total: number }>;

// ========================================
// CONTENT BRIEF GENERATOR TYPES (S13)
// ========================================

export interface GeneratedBrief extends BaseEntity {
  orgId: UUID;
  contentItemId: UUID | null;
  playbookRunId: UUID | null;
  brief: Record<string, unknown>;
  outline: Record<string, unknown> | null;
  seoContext: Record<string, unknown> | null;
  personalityUsed: Record<string, unknown> | null;
}

export interface BriefGenerationInput {
  contentItemId?: UUID;
  targetKeyword?: string;
  targetIntent?: string;
  personalityId?: UUID; // optional override
}

export interface BriefGenerationResult {
  runId: UUID;
  generatedBriefId: UUID;
  brief: Record<string, unknown>;
  outline: Record<string, unknown>;
  seoContext: Record<string, unknown>;
}

// ========================================
// CONTENT BRIEF GENERATOR API RESPONSES (S13)
// ========================================

export type GenerateBriefResponse = ApiResponse<{ result: BriefGenerationResult }>;
export type GetGeneratedBriefResponse = ApiResponse<{ item: GeneratedBrief }>;
export type ListGeneratedBriefsResponse = ApiResponse<{ items: GeneratedBrief[] }>;

// ========================================
// CONTENT QUALITY SCORING TYPES (S14)
// ========================================

export interface ContentQualityScore extends BaseEntity {
  orgId: UUID;
  contentItemId: UUID;
  score: number;
  readability: number | null;
  topicAlignment: number | null;
  keywordAlignment: number | null;
  thinContent: boolean;
  duplicateFlag: boolean;
  warnings: Record<string, unknown>;
}

export interface ContentQualityAnalysisResult {
  item: ContentItem;
  score: ContentQualityScore;
  similarItems: ContentItem[];
  suggestedImprovements: string[];
}

// ========================================
// CONTENT QUALITY API RESPONSES (S14)
// ========================================

export type AnalyzeContentQualityResponse = ApiResponse<{
  result: ContentQualityAnalysisResult;
}>;
export type GetContentQualityResponse = ApiResponse<{
  result: ContentQualityAnalysisResult;
}>;

// ========================================
// CONTENT REWRITE TYPES (S15)
// ========================================

export interface ContentRewrite extends BaseEntity {
  orgId: UUID;
  contentItemId: UUID;
  playbookRunId?: UUID | null;

  originalText: string;
  rewrittenText: string;

  diff: Record<string, unknown>;
  improvements: string[];
  reasoning: Record<string, unknown>;

  readabilityBefore: number;
  readabilityAfter: number;

  qualityBefore: number;
  qualityAfter: number;
}

export interface RewriteRequestInput {
  contentItemId: string;
  personalityId?: string | null;
  targetKeyword?: string | null;
  targetIntent?: string | null;
}

export interface RewriteResult {
  rewriteId: string;
  rewrittenText: string;
  diff: Record<string, unknown>;
  improvements: string[];
  reasoning: Record<string, unknown>;
  readabilityBefore: number;
  readabilityAfter: number;
  qualityBefore: number;
  qualityAfter: number;
}

// ========================================
// CONTENT REWRITE API RESPONSES (S15)
// ========================================

export type CreateRewriteResponse = ApiResponse<{
  result: RewriteResult;
}>;

export type GetRewriteResponse = ApiResponse<{
  rewrite: ContentRewrite;
}>;

export type ListRewritesResponse = ApiResponse<{
  rewrites: ContentRewrite[];
  total: number;
}>;
