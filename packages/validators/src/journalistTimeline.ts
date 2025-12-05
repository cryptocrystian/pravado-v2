/**
 * Journalist Timeline Validators (Sprint S49)
 * Zod schemas for journalist relationship timeline validation
 */

import { z } from 'zod';

// ===================================
// Enum Validators
// ===================================

export const TimelineEventTypeSchema = z.enum([
  // S38 Press Releases
  'press_release_generated', 'press_release_sent',
  // S39 Pitch Engine
  'pitch_sent', 'pitch_opened', 'pitch_clicked', 'pitch_replied', 'pitch_bounced',
  // S40 Media Monitoring
  'media_mention', 'coverage_published', 'brand_mention',
  // S41 RSS Crawling
  'article_published',
  // S43 Media Alerts
  'alert_triggered', 'signal_detected',
  // S44 PR Outreach
  'outreach_sent', 'outreach_opened', 'outreach_clicked', 'outreach_replied',
  'outreach_bounced', 'outreach_unsubscribed', 'outreach_followup',
  // S45 Engagement Analytics
  'email_engagement', 'link_clicked', 'attachment_downloaded',
  // S46 Identity Graph
  'profile_created', 'profile_updated', 'profile_merged', 'profile_enriched',
  // S47 Media Lists
  'added_to_media_list', 'removed_from_media_list',
  // S48 Discovery
  'journalist_discovered', 'discovery_merged',
  // Custom events
  'manual_note', 'tag_added', 'tag_removed', 'custom_interaction',
]);

export const TimelineSourceSystemSchema = z.enum([
  'press_releases', 'pitch_engine', 'media_monitoring', 'rss_crawling',
  'media_alerts', 'pr_outreach', 'engagement_analytics', 'identity_graph',
  'media_lists', 'discovery_engine', 'manual',
]);

export const TimelineSentimentSchema = z.enum(['positive', 'neutral', 'negative', 'unknown']);

export const TimelineClusterTypeSchema = z.enum([
  'outreach_sequence', 'coverage_thread', 'pitch_followup',
  'discovery_flow', 'engagement_burst', 'alert_series', 'custom',
]);

// ===================================
// Input Validators
// ===================================

export const CreateTimelineEventInputSchema = z.object({
  journalistId: z.string().uuid(),
  eventType: TimelineEventTypeSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  eventTimestamp: z.coerce.date().optional(),
  sourceSystem: TimelineSourceSystemSchema,
  sourceId: z.string().max(255).optional(),
  payload: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
  relationshipImpact: z.number().min(-1).max(1).optional(),
  sentiment: TimelineSentimentSchema.optional(),
  clusterId: z.string().uuid().optional(),
  clusterType: TimelineClusterTypeSchema.optional(),
});

export const UpdateTimelineEventInputSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
  relationshipImpact: z.number().min(-1).max(1).optional(),
  sentiment: TimelineSentimentSchema.optional(),
  clusterId: z.string().uuid().optional(),
  clusterType: TimelineClusterTypeSchema.optional(),
  payload: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const CreateManualNoteInputSchema = z.object({
  journalistId: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().min(1).max(5000),
  sentiment: TimelineSentimentSchema.optional(),
  relationshipImpact: z.number().min(-1).max(1).optional(),
  metadata: z.record(z.any()).optional(),
});

// ===================================
// Query Validators
// ===================================

export const TimelineQuerySchema = z.object({
  journalistId: z.string().uuid().optional(),
  eventTypes: z.array(TimelineEventTypeSchema).optional(),
  sourceSystems: z.array(TimelineSourceSystemSchema).optional(),
  sentiments: z.array(TimelineSentimentSchema).optional(),
  clusterIds: z.array(z.string().uuid()).optional(),

  // Time range
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  last30Days: z.boolean().optional(),
  last90Days: z.boolean().optional(),

  // Filtering
  minRelevanceScore: z.number().min(0).max(1).optional(),
  hasCluster: z.boolean().optional(),
  searchQuery: z.string().max(500).optional(),

  // Sorting
  sortBy: z.enum(['event_timestamp', 'relevance_score', 'relationship_impact', 'created_at']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),

  // Pagination
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
}).refine(
  (data) => {
    // Can't have both last30Days and last90Days
    if (data.last30Days && data.last90Days) return false;
    // Can't have both date range and last*Days
    if ((data.startDate || data.endDate) && (data.last30Days || data.last90Days)) return false;
    return true;
  },
  { message: 'Cannot combine date range with last30Days/last90Days filters' }
);

// ===================================
// Narrative Generation Validators
// ===================================

export const GenerateNarrativeInputSchema = z.object({
  journalistId: z.string().uuid(),
  timeframe: z.enum(['last_30_days', 'last_90_days', 'all_time']).optional(),
  focusAreas: z.array(z.enum(['coverage', 'engagement', 'outreach', 'sentiment'])).optional(),
  includeRecommendations: z.boolean().optional(),
});

// ===================================
// Batch Operation Validators
// ===================================

export const BatchCreateTimelineEventsInputSchema = z.object({
  events: z.array(CreateTimelineEventInputSchema).min(1).max(100),
  autoCluster: z.boolean().optional(),
  skipDuplicates: z.boolean().optional(),
});

// ===================================
// System Integration Validators
// ===================================

export const SystemEventPushSchema = z.object({
  sourceSystem: TimelineSourceSystemSchema,
  sourceId: z.string().max(255),
  journalistId: z.string().uuid(),
  eventType: TimelineEventTypeSchema,
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  payload: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
  relationshipImpact: z.number().min(-1).max(1).optional(),
  sentiment: TimelineSentimentSchema.optional(),
  eventTimestamp: z.coerce.date().optional(),
});

// ===================================
// Export Configuration Validators
// ===================================

export const TimelineExportConfigSchema = z.object({
  journalistId: z.string().uuid(),
  format: z.enum(['json', 'csv', 'pdf']),
  timeRange: z.object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  }).optional(),
  includePayloads: z.boolean().optional(),
  includeMetadata: z.boolean().optional(),
  includeNarrative: z.boolean().optional(),
});

// ===================================
// Type Inference
// ===================================

export type CreateTimelineEventInput = z.infer<typeof CreateTimelineEventInputSchema>;
export type UpdateTimelineEventInput = z.infer<typeof UpdateTimelineEventInputSchema>;
export type CreateManualNoteInput = z.infer<typeof CreateManualNoteInputSchema>;
export type TimelineQuery = z.infer<typeof TimelineQuerySchema>;
export type GenerateNarrativeInput = z.infer<typeof GenerateNarrativeInputSchema>;
export type BatchCreateTimelineEventsInput = z.infer<typeof BatchCreateTimelineEventsInputSchema>;
export type SystemEventPush = z.infer<typeof SystemEventPushSchema>;
export type TimelineExportConfig = z.infer<typeof TimelineExportConfigSchema>;
