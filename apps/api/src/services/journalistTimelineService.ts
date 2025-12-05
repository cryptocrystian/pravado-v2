/**
 * Journalist Relationship Timeline Service (Sprint S49)
 * Aggregates all journalist interactions from S38-S48 into a unified timeline
 *
 * This service is the core of the Journalist Relationship CRM, providing:
 * - Event ingestion from 11 upstream systems
 * - Normalization of heterogeneous payloads
 * - Scoring and relevance ranking
 * - Event clustering
 * - Relationship health score calculation
 * - Timeline query and aggregation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BatchCreateTimelineEventsInput,
  BatchCreateTimelineEventsResult,
  CreateManualNoteInput,
  CreateTimelineEventInput,
  GenerateNarrativeInput,
  JournalistNarrative,
  JournalistTimelineEvent,
  NarrativeHighlight,
  NarrativeRecommendation,
  RelationshipHealthScore,
  SystemEventPush,
  TimelineAggregation,
  TimelineAggregationDataPoint,
  TimelineCluster,
  TimelineEventType,
  TimelineListResponse,
  TimelineQuery,
  TimelineSentiment,
  TimelineStats,
  UpdateTimelineEventInput,
} from '@pravado/types';

// =============================================
// Utility Functions
// =============================================

/**
 * Calculates a default relevance score based on event type
 */
function getDefaultRelevanceScore(eventType: TimelineEventType): number {
  const highRelevanceEvents: TimelineEventType[] = [
    'pitch_replied',
    'outreach_replied',
    'coverage_published',
    'media_mention',
  ];

  const mediumRelevanceEvents: TimelineEventType[] = [
    'pitch_opened',
    'pitch_clicked',
    'outreach_opened',
    'outreach_clicked',
    'press_release_sent',
  ];

  if (highRelevanceEvents.includes(eventType)) return 0.8;
  if (mediumRelevanceEvents.includes(eventType)) return 0.6;
  return 0.5;
}

/**
 * Calculates a default relationship impact based on event type
 */
function getDefaultRelationshipImpact(eventType: TimelineEventType): number {
  const positiveImpactEvents: TimelineEventType[] = [
    'pitch_replied',
    'outreach_replied',
    'coverage_published',
    'media_mention',
  ];

  const negativeImpactEvents: TimelineEventType[] = [
    'pitch_bounced',
    'outreach_bounced',
    'outreach_unsubscribed',
  ];

  if (positiveImpactEvents.includes(eventType)) return 0.3;
  if (negativeImpactEvents.includes(eventType)) return -0.3;
  return 0;
}

/**
 * Calculates a default sentiment based on event type
 */
function getDefaultSentiment(eventType: TimelineEventType): TimelineSentiment {
  const positiveEvents: TimelineEventType[] = [
    'pitch_replied',
    'outreach_replied',
    'coverage_published',
    'media_mention',
    'brand_mention',
  ];

  const negativeEvents: TimelineEventType[] = [
    'pitch_bounced',
    'outreach_bounced',
    'outreach_unsubscribed',
  ];

  if (positiveEvents.includes(eventType)) return 'positive';
  if (negativeEvents.includes(eventType)) return 'negative';
  return 'neutral';
}

/**
 * Formats date range for SQL queries
 */
function formatDateForSQL(date: Date): string {
  return date.toISOString();
}

/**
 * Builds a search query for full-text search
 */
function buildSearchQuery(query: string): string {
  // Simple full-text search using ILIKE
  return `%${query.toLowerCase()}%`;
}

// =============================================
// JournalistTimelineService Class
// =============================================

export class JournalistTimelineService {
  constructor(private supabase: SupabaseClient) {}

  // =============================================
  // Core Event Management
  // =============================================

  /**
   * Creates a new timeline event
   */
  async createEvent(
    orgId: string,
    input: CreateTimelineEventInput,
    userId?: string
  ): Promise<JournalistTimelineEvent> {
    const eventData = {
      org_id: orgId,
      journalist_id: input.journalistId,
      event_type: input.eventType,
      title: input.title,
      description: input.description,
      event_timestamp: input.eventTimestamp ? formatDateForSQL(input.eventTimestamp) : undefined,
      source_system: input.sourceSystem,
      source_id: input.sourceId,
      payload: input.payload || {},
      metadata: input.metadata || {},
      relevance_score: input.relevanceScore ?? getDefaultRelevanceScore(input.eventType),
      relationship_impact: input.relationshipImpact ?? getDefaultRelationshipImpact(input.eventType),
      sentiment: input.sentiment ?? getDefaultSentiment(input.eventType),
      cluster_id: input.clusterId,
      cluster_type: input.clusterType,
      created_by: userId,
    };

    const { data, error } = await this.supabase
      .from('journalist_relationship_events')
      .insert(eventData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create timeline event: ${error.message}`);

    return this.mapDatabaseEventToType(data);
  }

  /**
   * Gets a single timeline event by ID
   */
  async getEvent(orgId: string, eventId: string): Promise<JournalistTimelineEvent | null> {
    const { data, error } = await this.supabase
      .from('journalist_relationship_events')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', eventId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get timeline event: ${error.message}`);
    }

    return this.mapDatabaseEventToType(data);
  }

  /**
   * Updates a timeline event
   */
  async updateEvent(
    orgId: string,
    eventId: string,
    input: UpdateTimelineEventInput
  ): Promise<JournalistTimelineEvent> {
    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.relevanceScore !== undefined) updateData.relevance_score = input.relevanceScore;
    if (input.relationshipImpact !== undefined) updateData.relationship_impact = input.relationshipImpact;
    if (input.sentiment !== undefined) updateData.sentiment = input.sentiment;
    if (input.clusterId !== undefined) updateData.cluster_id = input.clusterId;
    if (input.clusterType !== undefined) updateData.cluster_type = input.clusterType;
    if (input.payload !== undefined) updateData.payload = input.payload;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await this.supabase
      .from('journalist_relationship_events')
      .update(updateData)
      .eq('org_id', orgId)
      .eq('id', eventId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update timeline event: ${error.message}`);

    return this.mapDatabaseEventToType(data);
  }

  /**
   * Deletes a timeline event
   */
  async deleteEvent(orgId: string, eventId: string): Promise<void> {
    const { error } = await this.supabase
      .from('journalist_relationship_events')
      .delete()
      .eq('org_id', orgId)
      .eq('id', eventId);

    if (error) throw new Error(`Failed to delete timeline event: ${error.message}`);
  }

  // =============================================
  // Timeline Querying
  // =============================================

  /**
   * Lists timeline events with filtering, sorting, and pagination
   */
  async listEvents(orgId: string, query: TimelineQuery): Promise<TimelineListResponse> {
    let supabaseQuery = this.supabase
      .from('journalist_relationship_events')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Journalist filter (required for most queries)
    if (query.journalistId) {
      supabaseQuery = supabaseQuery.eq('journalist_id', query.journalistId);
    }

    // Event type filter
    if (query.eventTypes && query.eventTypes.length > 0) {
      supabaseQuery = supabaseQuery.in('event_type', query.eventTypes);
    }

    // Source system filter
    if (query.sourceSystems && query.sourceSystems.length > 0) {
      supabaseQuery = supabaseQuery.in('source_system', query.sourceSystems);
    }

    // Sentiment filter
    if (query.sentiments && query.sentiments.length > 0) {
      supabaseQuery = supabaseQuery.in('sentiment', query.sentiments);
    }

    // Cluster filter
    if (query.clusterIds && query.clusterIds.length > 0) {
      supabaseQuery = supabaseQuery.in('cluster_id', query.clusterIds);
    }

    // Time range filters
    if (query.last30Days) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      supabaseQuery = supabaseQuery.gte('event_timestamp', formatDateForSQL(thirtyDaysAgo));
    } else if (query.last90Days) {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      supabaseQuery = supabaseQuery.gte('event_timestamp', formatDateForSQL(ninetyDaysAgo));
    } else if (query.startDate || query.endDate) {
      if (query.startDate) {
        supabaseQuery = supabaseQuery.gte('event_timestamp', formatDateForSQL(query.startDate));
      }
      if (query.endDate) {
        supabaseQuery = supabaseQuery.lte('event_timestamp', formatDateForSQL(query.endDate));
      }
    }

    // Relevance score filter
    if (query.minRelevanceScore !== undefined) {
      supabaseQuery = supabaseQuery.gte('relevance_score', query.minRelevanceScore);
    }

    // Has cluster filter
    if (query.hasCluster !== undefined) {
      if (query.hasCluster) {
        supabaseQuery = supabaseQuery.not('cluster_id', 'is', null);
      } else {
        supabaseQuery = supabaseQuery.is('cluster_id', null);
      }
    }

    // Search query (full-text search in title and description)
    if (query.searchQuery) {
      const searchPattern = buildSearchQuery(query.searchQuery);
      supabaseQuery = supabaseQuery.or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`);
    }

    // Sorting
    const sortBy = query.sortBy || 'event_timestamp';
    const sortOrder = query.sortOrder || 'desc';
    supabaseQuery = supabaseQuery.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await supabaseQuery;

    if (error) throw new Error(`Failed to list timeline events: ${error.message}`);

    const events = data.map((row) => this.mapDatabaseEventToType(row));
    const total = count || 0;

    // Get stats if journalist ID is provided
    let stats: TimelineStats | undefined;
    if (query.journalistId) {
      stats = await this.getStats(orgId, query.journalistId);
    }

    return {
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats,
    };
  }

  // =============================================
  // Statistics & Analytics
  // =============================================

  /**
   * Gets timeline statistics for a journalist
   */
  async getStats(orgId: string, journalistId: string): Promise<TimelineStats> {
    const { data, error } = await this.supabase.rpc('get_journalist_timeline_stats', {
      p_org_id: orgId,
      p_journalist_id: journalistId,
    });

    if (error) throw new Error(`Failed to get timeline stats: ${error.message}`);

    return {
      totalEvents: data.total_events,
      lastInteraction: data.last_interaction ? new Date(data.last_interaction) : undefined,
      firstInteraction: data.first_interaction ? new Date(data.first_interaction) : undefined,
      eventTypeCounts: data.event_type_counts || {},
      sentimentDistribution: data.sentiment_distribution || { positive: 0, neutral: 0, negative: 0, unknown: 0 },
      avgRelevanceScore: data.avg_relevance_score,
      avgRelationshipImpact: data.avg_relationship_impact,
      totalClusters: data.total_clusters,
      recent30Days: data.recent_30_days,
      recent90Days: data.recent_90_days,
    };
  }

  /**
   * Calculates relationship health score for a journalist
   */
  async calculateHealthScore(orgId: string, journalistId: string): Promise<RelationshipHealthScore> {
    // Get the base score from database function
    const { data: scoreData, error: scoreError } = await this.supabase.rpc(
      'calculate_relationship_health_score',
      {
        p_org_id: orgId,
        p_journalist_id: journalistId,
      }
    );

    if (scoreError) throw new Error(`Failed to calculate health score: ${scoreError.message}`);

    const score = scoreData as number;

    // Get stats for breakdown
    const stats = await this.getStats(orgId, journalistId);

    // Calculate breakdown components
    const breakdown = this.calculateHealthScoreBreakdown(stats);

    // Determine trend
    const trend = this.calculateHealthTrend(stats);

    // Generate recommendations
    const recommendations = this.generateHealthRecommendations(stats, score);

    return {
      score,
      trend,
      lastCalculated: new Date(),
      breakdown,
      recommendations,
    };
  }

  /**
   * Calculates detailed breakdown of health score
   */
  private calculateHealthScoreBreakdown(stats: TimelineStats): RelationshipHealthScore['breakdown'] {
    // Recency (0-25 points)
    let recency = 0;
    if (stats.lastInteraction) {
      const daysSinceLastInteraction = Math.floor(
        (Date.now() - stats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastInteraction <= 7) recency = 25;
      else if (daysSinceLastInteraction <= 30) recency = 15;
      else if (daysSinceLastInteraction <= 90) recency = 5;
    }

    // Activity (0-15 points)
    const activity = Math.min(stats.recent30Days * 1.5, 15);

    // Sentiment (0-15 points)
    const totalSentiment =
      stats.sentimentDistribution.positive +
      stats.sentimentDistribution.neutral +
      stats.sentimentDistribution.negative +
      stats.sentimentDistribution.unknown;
    const sentiment = totalSentiment > 0 ? (stats.sentimentDistribution.positive / totalSentiment) * 15 : 0;

    // Engagement (0-20 points) - based on reply events
    const replyEvents =
      (stats.eventTypeCounts['pitch_replied'] || 0) + (stats.eventTypeCounts['outreach_replied'] || 0);
    const engagement = Math.min(replyEvents * 2, 20);

    // Coverage (0-10 points)
    const coverageEvents =
      (stats.eventTypeCounts['media_mention'] || 0) + (stats.eventTypeCounts['coverage_published'] || 0);
    const coverage = Math.min(coverageEvents * 2, 10);

    // Impact (0-10 points)
    const impact = Math.max(0, stats.avgRelationshipImpact * 10);

    // Penalty (0 to -10 points)
    const penalty =
      totalSentiment > 0 ? (stats.sentimentDistribution.negative / totalSentiment) * -10 : 0;

    return {
      recency,
      activity,
      sentiment,
      engagement,
      coverage,
      impact,
      penalty,
    };
  }

  /**
   * Calculates health score trend
   */
  private calculateHealthTrend(stats: TimelineStats): 'improving' | 'stable' | 'declining' {
    const recent30 = stats.recent30Days;
    const recent90 = stats.recent90Days;
    const total = stats.totalEvents;

    if (total === 0) return 'stable';

    // If more than 50% of events are in last 30 days, improving
    if (recent30 / total > 0.5) return 'improving';

    // If less than 20% of events are in last 90 days, declining
    if (recent90 / total < 0.2) return 'declining';

    return 'stable';
  }

  /**
   * Generates health score recommendations
   */
  private generateHealthRecommendations(stats: TimelineStats, score: number): string[] {
    const recommendations: string[] = [];

    // Recency recommendations
    if (stats.lastInteraction) {
      const daysSinceLastInteraction = Math.floor(
        (Date.now() - stats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastInteraction > 30) {
        recommendations.push('No recent interactions. Consider reaching out with a personalized pitch.');
      }
    }

    // Activity recommendations
    if (stats.recent30Days === 0) {
      recommendations.push('No activity in the last 30 days. Schedule a follow-up or share relevant content.');
    }

    // Coverage recommendations
    const coverageEvents =
      (stats.eventTypeCounts['media_mention'] || 0) + (stats.eventTypeCounts['coverage_published'] || 0);
    if (coverageEvents === 0 && stats.totalEvents > 5) {
      recommendations.push('No coverage achieved yet. Review pitch angles and journalist beat alignment.');
    }

    // Sentiment recommendations
    const negativeRatio =
      stats.sentimentDistribution.negative /
      (stats.sentimentDistribution.positive + stats.sentimentDistribution.neutral + stats.sentimentDistribution.negative || 1);
    if (negativeRatio > 0.3) {
      recommendations.push('High negative sentiment detected. Review communication approach and relevance.');
    }

    // Engagement recommendations
    const replyEvents =
      (stats.eventTypeCounts['pitch_replied'] || 0) + (stats.eventTypeCounts['outreach_replied'] || 0);
    if (replyEvents === 0 && stats.totalEvents > 5) {
      recommendations.push('No replies received. Consider improving subject lines and personalization.');
    }

    // Overall score recommendations
    if (score < 30) {
      recommendations.push('Low relationship health. Focus on rebuilding rapport with value-first communication.');
    } else if (score > 70) {
      recommendations.push('Strong relationship. Good time to pitch premium stories or request introductions.');
    }

    return recommendations;
  }

  /**
   * Gets timeline aggregation data points for charting
   */
  async getAggregation(
    orgId: string,
    journalistId: string,
    period: 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date
  ): Promise<TimelineAggregation> {
    const { data, error } = await this.supabase
      .from('journalist_relationship_events')
      .select('*')
      .eq('org_id', orgId)
      .eq('journalist_id', journalistId)
      .gte('event_timestamp', formatDateForSQL(startDate))
      .lte('event_timestamp', formatDateForSQL(endDate))
      .order('event_timestamp', { ascending: true });

    if (error) throw new Error(`Failed to get timeline aggregation: ${error.message}`);

    // Group events by period
    const dataPoints = this.groupEventsByPeriod(data, period);

    return {
      period,
      startDate,
      endDate,
      dataPoints,
    };
  }

  /**
   * Groups events by time period for aggregation
   */
  private groupEventsByPeriod(events: any[], period: 'day' | 'week' | 'month'): TimelineAggregationDataPoint[] {
    const grouped = new Map<string, any[]>();

    for (const event of events) {
      const timestamp = new Date(event.event_timestamp);
      let key: string;

      if (period === 'day') {
        key = timestamp.toISOString().split('T')[0];
      } else if (period === 'week') {
        const weekStart = new Date(timestamp);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(event);
    }

    // Convert to data points
    const dataPoints: TimelineAggregationDataPoint[] = [];
    for (const [dateKey, periodEvents] of grouped.entries()) {
      const positiveSentiment = periodEvents.filter((e) => e.sentiment === 'positive').length;
      const negativeSentiment = periodEvents.filter((e) => e.sentiment === 'negative').length;
      const avgRelevanceScore =
        periodEvents.reduce((sum, e) => sum + e.relevance_score, 0) / periodEvents.length;
      const avgRelationshipImpact =
        periodEvents.reduce((sum, e) => sum + e.relationship_impact, 0) / periodEvents.length;

      const eventTypeCounts: Record<TimelineEventType, number> = {} as any;
      for (const event of periodEvents) {
        eventTypeCounts[event.event_type as TimelineEventType] =
          (eventTypeCounts[event.event_type as TimelineEventType] || 0) + 1;
      }

      dataPoints.push({
        date: new Date(dateKey),
        eventCount: periodEvents.length,
        positiveSentiment,
        negativeSentiment,
        avgRelevanceScore,
        avgRelationshipImpact,
        eventTypes: eventTypeCounts,
      });
    }

    return dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // =============================================
  // Event Clustering
  // =============================================

  /**
   * Auto-clusters related events for a journalist
   */
  async autoClusterEvents(orgId: string, journalistId: string): Promise<number> {
    const { data, error } = await this.supabase.rpc('auto_cluster_timeline_events', {
      p_org_id: orgId,
      p_journalist_id: journalistId,
    });

    if (error) throw new Error(`Failed to auto-cluster events: ${error.message}`);

    return data as number;
  }

  /**
   * Gets all events in a cluster
   */
  async getCluster(orgId: string, clusterId: string): Promise<TimelineCluster> {
    const { data, error } = await this.supabase
      .from('journalist_relationship_events')
      .select('*')
      .eq('org_id', orgId)
      .eq('cluster_id', clusterId)
      .order('event_timestamp', { ascending: true });

    if (error) throw new Error(`Failed to get cluster: ${error.message}`);

    if (data.length === 0) {
      throw new Error('Cluster not found');
    }

    const events = data.map((row) => this.mapDatabaseEventToType(row));
    const firstEvent = events[0];

    return {
      id: clusterId,
      type: firstEvent.clusterType || 'custom',
      title: this.generateClusterTitle(events),
      description: this.generateClusterDescription(events),
      eventCount: events.length,
      events,
      startDate: events[0].eventTimestamp,
      endDate: events[events.length - 1].eventTimestamp,
      relevanceScore: events.reduce((sum, e) => sum + e.relevanceScore, 0) / events.length,
      relationshipImpact: events.reduce((sum, e) => sum + e.relationshipImpact, 0) / events.length,
    };
  }

  /**
   * Generates a title for a cluster based on its events
   */
  private generateClusterTitle(events: JournalistTimelineEvent[]): string {
    if (events.length === 0) return 'Event Cluster';

    const firstEvent = events[0];
    if (firstEvent.clusterType === 'outreach_sequence') {
      return `Outreach Sequence (${events.length} events)`;
    }
    if (firstEvent.clusterType === 'coverage_thread') {
      return `Coverage Thread (${events.length} events)`;
    }
    if (firstEvent.clusterType === 'pitch_followup') {
      return `Pitch Follow-up (${events.length} events)`;
    }

    return `${firstEvent.clusterType || 'Event'} Cluster (${events.length} events)`;
  }

  /**
   * Generates a description for a cluster based on its events
   */
  private generateClusterDescription(events: JournalistTimelineEvent[]): string {
    if (events.length === 0) return '';

    const eventTypes = new Set(events.map((e) => e.eventType));
    const typesList = Array.from(eventTypes).join(', ');

    return `${events.length} events: ${typesList}`;
  }

  // =============================================
  // Batch Operations
  // =============================================

  /**
   * Creates multiple timeline events in a batch
   */
  async batchCreateEvents(
    orgId: string,
    input: BatchCreateTimelineEventsInput,
    userId?: string
  ): Promise<BatchCreateTimelineEventsResult> {
    let created = 0;
    let skipped = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < input.events.length; i++) {
      try {
        // Check for duplicates if requested
        if (input.skipDuplicates) {
          const event = input.events[i];
          if (event.sourceId && event.sourceSystem) {
            const { data: existing } = await this.supabase
              .from('journalist_relationship_events')
              .select('id')
              .eq('org_id', orgId)
              .eq('source_system', event.sourceSystem)
              .eq('source_id', event.sourceId)
              .single();

            if (existing) {
              skipped++;
              continue;
            }
          }
        }

        await this.createEvent(orgId, input.events[i], userId);
        created++;
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Auto-cluster if requested
    let clusterResult;
    if (input.autoCluster && created > 0) {
      // Get all unique journalist IDs
      const journalistIds = new Set(input.events.map((e) => e.journalistId));
      let clustersCreated = 0;
      for (const journalistId of journalistIds) {
        clustersCreated += await this.autoClusterEvents(orgId, journalistId);
      }
      clusterResult = {
        clustersCreated,
        clustersUpdated: 0,
        eventsGrouped: created,
      };
    }

    return {
      created,
      skipped,
      errors,
      clusterResult,
    };
  }

  // =============================================
  // Manual Notes & Custom Events
  // =============================================

  /**
   * Creates a manual note on the timeline
   */
  async createManualNote(
    orgId: string,
    input: CreateManualNoteInput,
    userId?: string
  ): Promise<JournalistTimelineEvent> {
    return this.createEvent(
      orgId,
      {
        journalistId: input.journalistId,
        eventType: 'manual_note',
        title: input.title,
        description: input.description,
        sourceSystem: 'manual',
        payload: {},
        metadata: input.metadata || {},
        sentiment: input.sentiment,
        relationshipImpact: input.relationshipImpact,
      },
      userId
    );
  }

  // =============================================
  // System Integration - Event Push from S38-S48
  // =============================================

  /**
   * Receives events pushed from upstream systems (S38-S48)
   * This is the primary ingestion method for automated event creation
   */
  async pushSystemEvent(orgId: string, event: SystemEventPush): Promise<JournalistTimelineEvent> {
    return this.createEvent(orgId, {
      journalistId: event.journalistId,
      eventType: event.eventType,
      title: event.title,
      description: event.description,
      eventTimestamp: event.eventTimestamp,
      sourceSystem: event.sourceSystem,
      sourceId: event.sourceId,
      payload: event.payload,
      metadata: event.metadata,
      relevanceScore: event.relevanceScore,
      relationshipImpact: event.relationshipImpact,
      sentiment: event.sentiment,
    });
  }

  // =============================================
  // Narrative Generation
  // =============================================

  /**
   * Generates an AI-powered narrative summary of journalist relationship
   * This will be enhanced with LLM integration in a separate method
   */
  async generateNarrative(orgId: string, input: GenerateNarrativeInput): Promise<JournalistNarrative> {
    // Get timeline events for the specified timeframe
    const query: TimelineQuery = {
      journalistId: input.journalistId,
    };

    if (input.timeframe === 'last_30_days') {
      query.last30Days = true;
    } else if (input.timeframe === 'last_90_days') {
      query.last90Days = true;
    }

    const timeline = await this.listEvents(orgId, query);
    const stats = timeline.stats!;

    // Get journalist name (would need to query journalist_profiles table)
    // For now, using placeholder
    const journalistName = 'Journalist'; // TODO: Query journalist_profiles

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(stats, timeline.events);

    // Generate highlights
    const highlights = this.generateHighlights(timeline.events);

    // Calculate sentiment
    const overallSentiment = this.calculateOverallSentiment(stats);
    const sentimentTrend = this.calculateHealthTrend(stats);
    const sentimentExplanation = this.generateSentimentExplanation(stats, overallSentiment);

    // Calculate activity level
    const activityLevel = this.calculateActivityLevel(stats);
    const lastInteractionDays = stats.lastInteraction
      ? Math.floor((Date.now() - stats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Coverage summary
    const coverageCount =
      (stats.eventTypeCounts['media_mention'] || 0) + (stats.eventTypeCounts['coverage_published'] || 0);
    const coverageEvents = timeline.events.filter(
      (e) => e.eventType === 'media_mention' || e.eventType === 'coverage_published'
    );
    const lastCoverageDate = coverageEvents.length > 0 ? coverageEvents[0].eventTimestamp : undefined;
    const coverageSummary = this.generateCoverageSummary(coverageEvents);

    // Engagement metrics
    const { replyRate, openRate, clickRate } = this.calculateEngagementMetrics(stats);

    // Recommendations
    const healthScore = await this.calculateHealthScore(orgId, input.journalistId);
    const recommendations = this.generateNarrativeRecommendations(
      stats,
      healthScore,
      input.includeRecommendations
    );

    return {
      journalistId: input.journalistId,
      journalistName,
      generatedAt: new Date(),
      timeframe: input.timeframe || 'all_time',
      executiveSummary,
      highlights,
      overallSentiment,
      sentimentTrend,
      sentimentExplanation,
      activityLevel,
      lastInteractionDays,
      totalInteractions: stats.totalEvents,
      coverageCount,
      lastCoverageDate,
      coverageSummary,
      replyRate,
      openRate,
      clickRate,
      recommendations,
      healthScore: healthScore.score,
    };
  }

  /**
   * Generates executive summary text
   */
  private generateExecutiveSummary(stats: TimelineStats, _events: JournalistTimelineEvent[]): string {
    const totalEvents = stats.totalEvents;
    const lastInteractionDays = stats.lastInteraction
      ? Math.floor((Date.now() - stats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const coverageCount =
      (stats.eventTypeCounts['media_mention'] || 0) + (stats.eventTypeCounts['coverage_published'] || 0);

    let summary = `${totalEvents} total interactions recorded. `;

    if (lastInteractionDays < 7) {
      summary += 'Recently active. ';
    } else if (lastInteractionDays > 90) {
      summary += 'No recent activity. ';
    }

    if (coverageCount > 0) {
      summary += `Achieved ${coverageCount} coverage mention${coverageCount > 1 ? 's' : ''}.`;
    } else {
      summary += 'No coverage achieved yet.';
    }

    return summary;
  }

  /**
   * Generates narrative highlights from events
   */
  private generateHighlights(events: JournalistTimelineEvent[]): NarrativeHighlight[] {
    // Get high-relevance events
    const importantEvents = events
      .filter((e) => e.relevanceScore >= 0.7)
      .slice(0, 5)
      .map((e) => ({
        date: e.eventTimestamp,
        eventType: e.eventType,
        title: e.title,
        description: e.description || '',
        importance: (e.relevanceScore >= 0.8 ? 'high' : e.relevanceScore >= 0.6 ? 'medium' : 'low') as
          | 'high'
          | 'medium'
          | 'low',
      }));

    return importantEvents;
  }

  /**
   * Calculates overall sentiment
   */
  private calculateOverallSentiment(stats: TimelineStats): TimelineSentiment {
    const { positive, neutral, negative } = stats.sentimentDistribution;
    const total = positive + neutral + negative;

    if (total === 0) return 'unknown';

    if (positive / total > 0.5) return 'positive';
    if (negative / total > 0.3) return 'negative';
    return 'neutral';
  }

  /**
   * Generates sentiment explanation
   */
  private generateSentimentExplanation(stats: TimelineStats, overall: TimelineSentiment): string {
    const { positive, neutral, negative } = stats.sentimentDistribution;
    const total = positive + neutral + negative;

    if (total === 0) return 'No sentiment data available.';

    return `${positive} positive, ${neutral} neutral, ${negative} negative interactions. Overall sentiment: ${overall}.`;
  }

  /**
   * Calculates activity level
   */
  private calculateActivityLevel(
    stats: TimelineStats
  ): 'very_active' | 'active' | 'moderate' | 'low' | 'inactive' {
    const recent30 = stats.recent30Days;

    if (recent30 >= 10) return 'very_active';
    if (recent30 >= 5) return 'active';
    if (recent30 >= 2) return 'moderate';
    if (recent30 >= 1) return 'low';
    return 'inactive';
  }

  /**
   * Generates coverage summary
   */
  private generateCoverageSummary(coverageEvents: JournalistTimelineEvent[]): string | undefined {
    if (coverageEvents.length === 0) return undefined;

    return `${coverageEvents.length} coverage mention${coverageEvents.length > 1 ? 's' : ''} tracked.`;
  }

  /**
   * Calculates engagement metrics
   */
  private calculateEngagementMetrics(stats: TimelineStats): {
    replyRate: number;
    openRate: number;
    clickRate: number;
  } {
    const sentEvents =
      (stats.eventTypeCounts['pitch_sent'] || 0) + (stats.eventTypeCounts['outreach_sent'] || 0);
    const replyEvents =
      (stats.eventTypeCounts['pitch_replied'] || 0) + (stats.eventTypeCounts['outreach_replied'] || 0);
    const openEvents =
      (stats.eventTypeCounts['pitch_opened'] || 0) + (stats.eventTypeCounts['outreach_opened'] || 0);
    const clickEvents =
      (stats.eventTypeCounts['pitch_clicked'] || 0) + (stats.eventTypeCounts['outreach_clicked'] || 0);

    return {
      replyRate: sentEvents > 0 ? replyEvents / sentEvents : 0,
      openRate: sentEvents > 0 ? openEvents / sentEvents : 0,
      clickRate: sentEvents > 0 ? clickEvents / sentEvents : 0,
    };
  }

  /**
   * Generates narrative recommendations
   */
  private generateNarrativeRecommendations(
    _stats: TimelineStats,
    healthScore: RelationshipHealthScore,
    includeRecommendations?: boolean
  ): NarrativeRecommendation[] {
    if (!includeRecommendations) return [];

    const recommendations: NarrativeRecommendation[] = [];

    // Convert health score recommendations to narrative format
    for (const rec of healthScore.recommendations) {
      recommendations.push({
        type: 'action',
        priority: healthScore.score < 30 ? 'high' : healthScore.score > 70 ? 'low' : 'medium',
        title: 'Health Score Recommendation',
        description: rec,
      });
    }

    return recommendations;
  }

  // =============================================
  // Database Mapping Utilities
  // =============================================

  /**
   * Maps database row to JournalistTimelineEvent type
   */
  private mapDatabaseEventToType(row: any): JournalistTimelineEvent {
    return {
      id: row.id,
      orgId: row.org_id,
      journalistId: row.journalist_id,
      eventType: row.event_type,
      title: row.title,
      description: row.description,
      eventTimestamp: new Date(row.event_timestamp),
      sourceSystem: row.source_system,
      sourceId: row.source_id,
      payload: row.payload,
      metadata: row.metadata,
      relevanceScore: row.relevance_score,
      relationshipImpact: row.relationship_impact,
      sentiment: row.sentiment,
      clusterId: row.cluster_id,
      clusterType: row.cluster_type,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
