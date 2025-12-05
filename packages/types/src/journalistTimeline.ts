/**
 * Journalist Relationship Timeline Types (Sprint S49)
 * Unified timeline aggregating all journalist interactions from S38-S48
 */

// ===================================
// Enums and Constants
// ===================================

export type TimelineEventType =
  // S38 Press Releases
  | 'press_release_generated'
  | 'press_release_sent'
  // S39 Pitch Engine
  | 'pitch_sent'
  | 'pitch_opened'
  | 'pitch_clicked'
  | 'pitch_replied'
  | 'pitch_bounced'
  // S40 Media Monitoring
  | 'media_mention'
  | 'coverage_published'
  | 'brand_mention'
  // S41 RSS Crawling
  | 'article_published'
  // S43 Media Alerts
  | 'alert_triggered'
  | 'signal_detected'
  // S44 PR Outreach
  | 'outreach_sent'
  | 'outreach_opened'
  | 'outreach_clicked'
  | 'outreach_replied'
  | 'outreach_bounced'
  | 'outreach_unsubscribed'
  | 'outreach_followup'
  // S45 Engagement Analytics
  | 'email_engagement'
  | 'link_clicked'
  | 'attachment_downloaded'
  // S46 Identity Graph
  | 'profile_created'
  | 'profile_updated'
  | 'profile_merged'
  | 'profile_enriched'
  // S47 Media Lists
  | 'added_to_media_list'
  | 'removed_from_media_list'
  // S48 Discovery
  | 'journalist_discovered'
  | 'discovery_merged'
  // Custom events
  | 'manual_note'
  | 'tag_added'
  | 'tag_removed'
  | 'custom_interaction';

export type TimelineSourceSystem =
  | 'press_releases'
  | 'pitch_engine'
  | 'media_monitoring'
  | 'rss_crawling'
  | 'media_alerts'
  | 'pr_outreach'
  | 'engagement_analytics'
  | 'identity_graph'
  | 'media_lists'
  | 'discovery_engine'
  | 'manual';

export type TimelineSentiment = 'positive' | 'neutral' | 'negative' | 'unknown';

export type TimelineClusterType =
  | 'outreach_sequence'
  | 'coverage_thread'
  | 'pitch_followup'
  | 'discovery_flow'
  | 'engagement_burst'
  | 'alert_series'
  | 'custom';

// ===================================
// Core Timeline Event
// ===================================

export interface JournalistTimelineEvent {
  id: string;
  orgId: string;
  journalistId: string;

  // Event classification
  eventType: TimelineEventType;
  title: string;
  description?: string;
  eventTimestamp: Date;

  // Source tracking
  sourceSystem: TimelineSourceSystem;
  sourceId?: string;  // ID in source system

  // Event data
  payload: Record<string, any>;  // Heterogeneous data from different systems
  metadata: Record<string, any>;

  // Scoring & relevance
  relevanceScore: number;  // 0-1
  relationshipImpact: number;  // -1 to 1
  sentiment: TimelineSentiment;

  // Clustering
  clusterId?: string;
  clusterType?: TimelineClusterType;

  // User tracking
  createdBy?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ===================================
// Input Types
// ===================================

export interface CreateTimelineEventInput {
  journalistId: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  eventTimestamp?: Date;  // Defaults to now
  sourceSystem: TimelineSourceSystem;
  sourceId?: string;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
  relevanceScore?: number;  // Default 0.5
  relationshipImpact?: number;  // Default 0
  sentiment?: TimelineSentiment;  // Default 'unknown'
  clusterId?: string;
  clusterType?: TimelineClusterType;
}

export interface UpdateTimelineEventInput {
  title?: string;
  description?: string;
  relevanceScore?: number;
  relationshipImpact?: number;
  sentiment?: TimelineSentiment;
  clusterId?: string;
  clusterType?: TimelineClusterType;
  payload?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateManualNoteInput {
  journalistId: string;
  title: string;
  description: string;
  sentiment?: TimelineSentiment;
  relationshipImpact?: number;
  metadata?: Record<string, any>;
}

// ===================================
// Query Types
// ===================================

export interface TimelineQuery {
  journalistId?: string;  // Required for most queries
  eventTypes?: TimelineEventType[];
  sourceSystems?: TimelineSourceSystem[];
  sentiments?: TimelineSentiment[];
  clusterIds?: string[];

  // Time range
  startDate?: Date;
  endDate?: Date;
  last30Days?: boolean;
  last90Days?: boolean;

  // Filtering
  minRelevanceScore?: number;
  hasCluster?: boolean;
  searchQuery?: string;  // Full-text search in title/description

  // Sorting
  sortBy?: 'event_timestamp' | 'relevance_score' | 'relationship_impact' | 'created_at';
  sortOrder?: 'asc' | 'desc';

  // Pagination
  limit?: number;  // Default 20, max 100
  offset?: number;
}

export interface TimelineListResponse {
  events: JournalistTimelineEvent[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats?: TimelineStats;
}

// ===================================
// Statistics & Analytics
// ===================================

export interface TimelineStats {
  totalEvents: number;
  lastInteraction?: Date;
  firstInteraction?: Date;
  eventTypeCounts: Record<TimelineEventType, number>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
    unknown: number;
  };
  avgRelevanceScore: number;
  avgRelationshipImpact: number;
  totalClusters: number;
  recent30Days: number;
  recent90Days: number;
}

export interface RelationshipHealthScore {
  score: number;  // 0-100
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: Date;
  breakdown: {
    recency: number;  // 0-25 points
    activity: number;  // 0-15 points
    sentiment: number;  // 0-15 points
    engagement: number;  // 0-20 points (replies, clicks)
    coverage: number;  // 0-10 points
    impact: number;  // 0-10 points
    penalty: number;  // 0 to -10 points (negative sentiment)
  };
  recommendations: string[];
}

// ===================================
// Narrative Generation
// ===================================

export interface GenerateNarrativeInput {
  journalistId: string;
  timeframe?: 'last_30_days' | 'last_90_days' | 'all_time';
  focusAreas?: ('coverage' | 'engagement' | 'outreach' | 'sentiment')[];
  includeRecommendations?: boolean;
}

export interface JournalistNarrative {
  journalistId: string;
  journalistName: string;
  generatedAt: Date;
  timeframe: string;

  // Executive summary
  executiveSummary: string;  // LLM-generated 2-3 sentence overview

  // Key highlights
  highlights: NarrativeHighlight[];

  // Sentiment analysis
  overallSentiment: TimelineSentiment;
  sentimentTrend: 'improving' | 'stable' | 'declining';
  sentimentExplanation: string;

  // Activity summary
  activityLevel: 'very_active' | 'active' | 'moderate' | 'low' | 'inactive';
  lastInteractionDays: number;
  totalInteractions: number;

  // Coverage summary
  coverageCount: number;
  lastCoverageDate?: Date;
  coverageSummary?: string;

  // Engagement metrics
  replyRate: number;  // 0-1
  openRate: number;  // 0-1
  clickRate: number;  // 0-1

  // Recommendations
  recommendations: NarrativeRecommendation[];

  // Health score
  healthScore: number;  // 0-100
}

export interface NarrativeHighlight {
  date: Date;
  eventType: TimelineEventType;
  title: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
}

export interface NarrativeRecommendation {
  type: 'action' | 'insight' | 'warning';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggestedAction?: string;
}

// ===================================
// Clustering Types
// ===================================

export interface TimelineCluster {
  id: string;
  type: TimelineClusterType;
  title: string;
  description?: string;
  eventCount: number;
  events: JournalistTimelineEvent[];
  startDate: Date;
  endDate: Date;
  relevanceScore: number;
  relationshipImpact: number;
}

export interface AutoClusterResult {
  clustersCreated: number;
  clustersUpdated: number;
  eventsGrouped: number;
}

// ===================================
// Aggregation Types
// ===================================

export interface TimelineAggregation {
  period: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  dataPoints: TimelineAggregationDataPoint[];
}

export interface TimelineAggregationDataPoint {
  date: Date;
  eventCount: number;
  positiveSentiment: number;
  negativeSentiment: number;
  avgRelevanceScore: number;
  avgRelationshipImpact: number;
  eventTypes: Record<TimelineEventType, number>;
}

// ===================================
// Batch Operations
// ===================================

export interface BatchCreateTimelineEventsInput {
  events: CreateTimelineEventInput[];
  autoCluster?: boolean;
  skipDuplicates?: boolean;  // Check by source_system + source_id
}

export interface BatchCreateTimelineEventsResult {
  created: number;
  skipped: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
  clusterResult?: AutoClusterResult;
}

// ===================================
// Event Type Metadata
// ===================================

export interface TimelineEventTypeMetadata {
  eventType: TimelineEventType;
  sourceSystem: TimelineSourceSystem;
  displayName: string;
  description: string;
  icon: string;  // Icon identifier
  colorClass: string;  // Tailwind color class
  defaultRelevance: number;
  defaultImpact: number;
  defaultSentiment: TimelineSentiment;
}

// ===================================
// System Integration Types
// ===================================

/**
 * Used by upstream systems (S38-S48) to push events to timeline
 */
export interface SystemEventPush {
  sourceSystem: TimelineSourceSystem;
  sourceId: string;
  journalistId: string;
  eventType: TimelineEventType;
  title: string;
  description?: string;
  payload: Record<string, any>;
  metadata?: Record<string, any>;
  relevanceScore?: number;
  relationshipImpact?: number;
  sentiment?: TimelineSentiment;
  eventTimestamp?: Date;
}

// ===================================
// Export Configuration
// ===================================

export interface TimelineExportConfig {
  journalistId: string;
  format: 'json' | 'csv' | 'pdf';
  timeRange?: {
    startDate: Date;
    endDate: Date;
  };
  includePayloads?: boolean;
  includeMetadata?: boolean;
  includeNarrative?: boolean;
}

export interface TimelineExportResult {
  exportId: string;
  downloadUrl: string;
  expiresAt: Date;
  fileSize: number;
  format: 'json' | 'csv' | 'pdf';
}
