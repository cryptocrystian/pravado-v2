/**
 * Competitor Intelligence Service (Sprint S53)
 *
 * Comprehensive service for competitive intelligence engine including:
 * - Competitor profile management
 * - Mention tracking and analysis
 * - Time-series metrics snapshots
 * - Comparative analytics (brand vs competitor)
 * - Coverage/journalist overlap analysis
 * - LLM-driven strategic insights
 * - Anomaly and spike detection
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  Competitor,
  CompetitorMention,
  CompetitorMetricsSnapshot,
  CompetitorInsight,
  CompetitorOverlap,
  CreateCompetitorRequest,
  UpdateCompetitorRequest,
  CreateCompetitorMentionRequest,
  CreateCompetitorInsightRequest,
  UpdateCompetitorInsightRequest,
  GenerateInsightRequest,
  CompetitorFilters,
  CompetitorMentionFilters,
  SnapshotFilters,
  CIInsightFilters,
  OverlapFilters,
  GetCompetitorsResponse,
  GetCompetitorMentionsResponse,
  CIGetSnapshotsResponse,
  CIGetInsightsResponse,
  GetOverlapResponse,
  CompetitorMetricsSummary,
  ComparativeAnalyticsResponse,
  OverlapAnalysisResponse,
  CompetitorTier,
  CIInsightCategory,
  OverlapType,
  SpikeType,
  SnapshotPeriod,
  CISentimentTrend,
} from '@pravado/types';
import { LlmRouter, createLogger } from '@pravado/utils';

const logger = createLogger('competitor-intelligence-service');

export class CompetitorIntelligenceService {
  private llmRouter: LlmRouter | null = null;

  constructor(
    private supabase: SupabaseClient,
    llmRouter?: LlmRouter
  ) {
    this.llmRouter = llmRouter || null;
  }

  // =========================================================================
  // COMPETITOR MANAGEMENT
  // =========================================================================

  /**
   * Create a new competitor profile
   */
  async createCompetitor(
    orgId: string,
    data: CreateCompetitorRequest
  ): Promise<Competitor> {
    const row = {
      org_id: orgId,
      name: data.name,
      domain: data.domain || null,
      tier: data.tier,
      industry: data.industry || null,
      description: data.description || null,
      keywords: data.keywords,
      domains: data.domains || [],
      social_handles: data.socialHandles || null,
      is_active: true,
      tracked_since: new Date(),
    };

    const { data: competitor, error } = await this.supabase
      .from('competitors')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create competitor: ${error.message}`);
    return this.mapCompetitorFromDb(competitor);
  }

  /**
   * Update existing competitor
   */
  async updateCompetitor(
    orgId: string,
    competitorId: string,
    data: UpdateCompetitorRequest
  ): Promise<Competitor> {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.domain !== undefined) updates.domain = data.domain;
    if (data.tier !== undefined) updates.tier = data.tier;
    if (data.industry !== undefined) updates.industry = data.industry;
    if (data.description !== undefined) updates.description = data.description;
    if (data.keywords !== undefined) updates.keywords = data.keywords;
    if (data.domains !== undefined) updates.domains = data.domains;
    if (data.socialHandles !== undefined) updates.social_handles = data.socialHandles;
    if (data.isActive !== undefined) updates.is_active = data.isActive;

    const { data: competitor, error } = await this.supabase
      .from('competitors')
      .update(updates)
      .eq('id', competitorId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update competitor: ${error.message}`);
    return this.mapCompetitorFromDb(competitor);
  }

  /**
   * Get single competitor by ID
   */
  async getCompetitor(orgId: string, competitorId: string): Promise<Competitor> {
    const { data: competitor, error } = await this.supabase
      .from('competitors')
      .select('*')
      .eq('id', competitorId)
      .eq('org_id', orgId)
      .single();

    if (error || !competitor) {
      throw new Error(`Competitor not found: ${competitorId}`);
    }

    return this.mapCompetitorFromDb(competitor);
  }

  /**
   * Get competitors with filters and pagination
   */
  async getCompetitors(
    orgId: string,
    filters: CompetitorFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<GetCompetitorsResponse> {
    let query = this.supabase.from('competitors').select('*', { count: 'exact' }).eq('org_id', orgId);

    // Apply filters
    if (filters.tier) query = query.eq('tier', filters.tier);
    if (filters.isActive !== undefined) query = query.eq('is_active', filters.isActive);
    if (filters.industry) query = query.ilike('industry', `%${filters.industry}%`);
    if (filters.trackedSinceStart) query = query.gte('tracked_since', filters.trackedSinceStart.toISOString());
    if (filters.trackedSinceEnd) query = query.lte('tracked_since', filters.trackedSinceEnd.toISOString());

    // Pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: competitors, count, error } = await query;

    if (error) throw new Error(`Failed to fetch competitors: ${error.message}`);

    return {
      competitors: competitors?.map((c) => this.mapCompetitorFromDb(c)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Delete a competitor (soft delete by setting is_active = false)
   */
  async deleteCompetitor(orgId: string, competitorId: string): Promise<void> {
    const { error } = await this.supabase
      .from('competitors')
      .update({ is_active: false })
      .eq('id', competitorId)
      .eq('org_id', orgId);

    if (error) throw new Error(`Failed to delete competitor: ${error.message}`);
  }

  // =========================================================================
  // MENTION TRACKING
  // =========================================================================

  /**
   * Create a competitor mention
   */
  async createMention(
    orgId: string,
    data: CreateCompetitorMentionRequest
  ): Promise<CompetitorMention> {
    const row = {
      org_id: orgId,
      competitor_id: data.competitorId,
      source_type: data.sourceType,
      source_url: data.sourceUrl || null,
      published_at: data.publishedAt,
      title: data.title || null,
      content: data.content || null,
      excerpt: data.excerpt || null,
      author_name: data.authorName || null,
      journalist_id: data.journalistId || null,
      outlet_name: data.outletName || null,
      outlet_tier: data.outletTier || null,
      sentiment_score: data.sentimentScore || null,
      topics: data.topics || [],
      keywords: data.keywords || [],
      estimated_reach: data.estimatedReach || null,
      matched_keywords: data.matchedKeywords,
      confidence_score: data.confidenceScore || null,
    };

    const { data: mention, error } = await this.supabase
      .from('competitor_mentions')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create mention: ${error.message}`);
    return this.mapMentionFromDb(mention);
  }

  /**
   * Get mentions with filters and pagination
   */
  async getMentions(
    orgId: string,
    filters: CompetitorMentionFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<GetCompetitorMentionsResponse> {
    let query = this.supabase
      .from('competitor_mentions')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (filters.competitorId) query = query.eq('competitor_id', filters.competitorId);
    if (filters.sourceType) query = query.eq('source_type', filters.sourceType);
    if (filters.publishedStart) query = query.gte('published_at', filters.publishedStart.toISOString());
    if (filters.publishedEnd) query = query.lte('published_at', filters.publishedEnd.toISOString());
    if (filters.journalistId) query = query.eq('journalist_id', filters.journalistId);
    if (filters.outletName) query = query.ilike('outlet_name', `%${filters.outletName}%`);
    if (filters.minSentiment !== undefined) query = query.gte('sentiment_score', filters.minSentiment);
    if (filters.maxSentiment !== undefined) query = query.lte('sentiment_score', filters.maxSentiment);
    if (filters.topics && filters.topics.length > 0) {
      query = query.contains('topics', filters.topics);
    }

    query = query.order('published_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: mentions, count, error } = await query;

    if (error) throw new Error(`Failed to fetch mentions: ${error.message}`);

    return {
      mentions: mentions?.map((m) => this.mapMentionFromDb(m)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  // =========================================================================
  // SNAPSHOT AGGREGATION
  // =========================================================================

  /**
   * Create a metrics snapshot (usually automated daily)
   */
  async createSnapshot(
    orgId: string,
    competitorId: string,
    period: SnapshotPeriod = SnapshotPeriod.DAILY
  ): Promise<CompetitorMetricsSnapshot> {
    const endDate = new Date();
    const startDate = new Date();

    // Calculate window based on period
    switch (period) {
      case SnapshotPeriod.DAILY:
        startDate.setDate(startDate.getDate() - 1);
        break;
      case SnapshotPeriod.WEEKLY:
        startDate.setDate(startDate.getDate() - 7);
        break;
      case SnapshotPeriod.MONTHLY:
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // Aggregate mentions in window
    const { data: mentions, error: mentionError } = await this.supabase
      .from('competitor_mentions')
      .select('*')
      .eq('competitor_id', competitorId)
      .eq('org_id', orgId)
      .gte('published_at', startDate.toISOString())
      .lte('published_at', endDate.toISOString());

    if (mentionError) throw new Error(`Failed to fetch mentions for snapshot: ${mentionError.message}`);

    const mentionList = mentions || [];

    // Calculate aggregated metrics
    const mentionCount = mentionList.length;
    const articleCount = mentionList.filter((m) => m.source_type === 'article').length;

    const uniqueJournalists = new Set(
      mentionList.filter((m) => m.journalist_id).map((m) => m.journalist_id)
    );
    const journalistCount = uniqueJournalists.size;

    const uniqueOutlets = new Set(mentionList.filter((m) => m.outlet_name).map((m) => m.outlet_name));
    const outletCount = uniqueOutlets.size;

    // Sentiment analysis
    const sentimentScores = mentionList.filter((m) => m.sentiment_score !== null).map((m) => m.sentiment_score!);
    const avgSentiment =
      sentimentScores.length > 0
        ? sentimentScores.reduce((sum, s) => sum + s, 0) / sentimentScores.length
        : null;

    const sentimentDistribution = {
      positive: mentionList.filter((m) => (m.sentiment_score || 0) > 0.1).length,
      neutral: mentionList.filter((m) => Math.abs(m.sentiment_score || 0) <= 0.1).length,
      negative: mentionList.filter((m) => (m.sentiment_score || 0) < -0.1).length,
    };

    // Tier distribution
    const tierDistribution = {
      tier1: mentionList.filter((m) => m.outlet_tier === 1).length,
      tier2: mentionList.filter((m) => m.outlet_tier === 2).length,
      tier3: mentionList.filter((m) => m.outlet_tier === 3).length,
      tier4: mentionList.filter((m) => m.outlet_tier === 4).length,
      unknown: mentionList.filter((m) => !m.outlet_tier).length,
    };

    // Estimated reach
    const estimatedReach = mentionList.reduce((sum, m) => sum + (m.estimated_reach || 0), 0);

    // Calculate EVI using SQL function
    const { data: eviData } = await this.supabase.rpc('calculate_competitor_evi', {
      p_estimated_reach: estimatedReach,
      p_avg_sentiment: avgSentiment || 0,
      p_tier_distribution: tierDistribution,
      p_mention_count: mentionCount,
    });

    const eviScore = eviData || 0;

    // Top journalists
    const journalistMentions = new Map<string, number>();
    mentionList.forEach((m) => {
      if (m.journalist_id) {
        journalistMentions.set(m.journalist_id, (journalistMentions.get(m.journalist_id) || 0) + 1);
      }
    });

    const topJournalists = Array.from(journalistMentions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([journalistId, count]) => ({
        journalistId,
        name: 'Unknown', // Would need to join with journalist graph
        mentionCount: count,
      }));

    // Detect anomalies (simplified - check for volume spike)
    const previousSnapshot = await this.getPreviousSnapshot(orgId, competitorId, period);
    let hasAnomaly = false;
    let anomalyType: SpikeType | null = null;
    let anomalyMagnitude: number | null = null;

    if (previousSnapshot && previousSnapshot.mentionCount > 0) {
      const volumeChange = (mentionCount - previousSnapshot.mentionCount) / previousSnapshot.mentionCount;
      if (Math.abs(volumeChange) > 0.5) {
        // 50% change threshold
        hasAnomaly = true;
        anomalyType = SpikeType.VOLUME_SPIKE;
        anomalyMagnitude = volumeChange;
      }
    }

    // Create snapshot row
    const snapshotRow = {
      org_id: orgId,
      competitor_id: competitorId,
      snapshot_at: endDate,
      period,
      mention_count: mentionCount,
      article_count: articleCount,
      journalist_count: journalistCount,
      outlet_count: outletCount,
      avg_sentiment: avgSentiment,
      sentiment_distribution: sentimentDistribution,
      visibility_score: null, // Would calculate visibility score
      estimated_reach: estimatedReach,
      share_of_voice: null, // Would calculate from total market mentions
      evi_score: eviScore,
      tier_distribution: tierDistribution,
      top_journalists: topJournalists,
      top_topics: [],
      has_anomaly: hasAnomaly,
      anomaly_type: anomalyType,
      anomaly_magnitude: anomalyMagnitude,
    };

    const { data: snapshot, error } = await this.supabase
      .from('competitor_metrics_snapshots')
      .insert(snapshotRow)
      .select()
      .single();

    if (error) throw new Error(`Failed to create snapshot: ${error.message}`);
    return this.mapSnapshotFromDb(snapshot);
  }

  /**
   * Get snapshots with filters and pagination
   */
  async getSnapshots(
    orgId: string,
    filters: SnapshotFilters = {},
    limit: number = 50,
    offset: number = 0
  ): Promise<CIGetSnapshotsResponse> {
    let query = this.supabase
      .from('competitor_metrics_snapshots')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (filters.competitorId) query = query.eq('competitor_id', filters.competitorId);
    if (filters.period) query = query.eq('period', filters.period);
    if (filters.snapshotStart) query = query.gte('snapshot_at', filters.snapshotStart.toISOString());
    if (filters.snapshotEnd) query = query.lte('snapshot_at', filters.snapshotEnd.toISOString());
    if (filters.hasAnomaly !== undefined) query = query.eq('has_anomaly', filters.hasAnomaly);

    query = query.order('snapshot_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: snapshots, count, error } = await query;

    if (error) throw new Error(`Failed to fetch snapshots: ${error.message}`);

    return {
      snapshots: snapshots?.map((s) => this.mapSnapshotFromDb(s)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  /**
   * Get competitor metrics summary for a time period
   */
  async getCompetitorMetrics(
    orgId: string,
    competitorId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CompetitorMetricsSummary> {
    // Get competitor info
    const competitor = await this.getCompetitor(orgId, competitorId);

    // Get latest snapshot
    const { data: latestSnapshot } = await this.supabase
      .from('competitor_metrics_snapshots')
      .select('*')
      .eq('competitor_id', competitorId)
      .eq('org_id', orgId)
      .order('snapshot_at', { ascending: false })
      .limit(1)
      .single();

    // Aggregate mentions in period
    const { data: mentions } = await this.supabase
      .from('competitor_mentions')
      .select('*')
      .eq('competitor_id', competitorId)
      .eq('org_id', orgId)
      .gte('published_at', startDate.toISOString())
      .lte('published_at', endDate.toISOString());

    const mentionList = mentions || [];
    const totalMentions = mentionList.length;

    const sentimentScores = mentionList.filter((m) => m.sentiment_score !== null).map((m) => m.sentiment_score!);
    const avgSentiment =
      sentimentScores.length > 0 ? sentimentScores.reduce((sum, s) => sum + s, 0) / sentimentScores.length : undefined;

    const totalReach = mentionList.reduce((sum, m) => sum + (m.estimated_reach || 0), 0);

    // Get sentiment trend
    const { data: sentimentTrendData } = await this.supabase.rpc('calculate_competitor_sentiment', {
      p_competitor_id: competitorId,
      p_org_id: orgId,
      p_window_days: Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    });

    const sentimentTrend: CISentimentTrend = sentimentTrendData || {
      current: avgSentiment || 0,
      previous: 0,
      change: 0,
      direction: 'unknown',
      stabilityScore: 0,
    };

    // Count recent anomalies
    const { count: anomalyCount } = await this.supabase
      .from('competitor_metrics_snapshots')
      .select('*', { count: 'exact', head: true })
      .eq('competitor_id', competitorId)
      .eq('org_id', orgId)
      .eq('has_anomaly', true)
      .gte('snapshot_at', startDate.toISOString());

    return {
      competitorId,
      competitorName: competitor.name,
      tier: competitor.tier,
      latestSnapshot: latestSnapshot ? this.mapSnapshotFromDb(latestSnapshot) : null,
      periodStart: startDate,
      periodEnd: endDate,
      totalMentions,
      avgSentiment,
      totalReach,
      sentimentTrend,
      recentAnomalies: anomalyCount || 0,
    };
  }

  // =========================================================================
  // COMPARATIVE ANALYTICS
  // =========================================================================

  /**
   * Get comparative analytics between brand and competitor
   */
  async getComparativeAnalytics(
    orgId: string,
    competitorId: string,
    startDate: Date,
    endDate: Date,
    _brandId?: string // Reserved for future brand metrics integration
  ): Promise<ComparativeAnalyticsResponse> {
    // Get competitor metrics
    const competitorMetrics = await this.getCompetitorMetrics(orgId, competitorId, startDate, endDate);
    const competitor = await this.getCompetitor(orgId, competitorId);

    // Get brand metrics (would integrate with media monitoring/performance services)
    // For now, using placeholder data
    const brandMetrics = {
      mentionVolume: 100, // Placeholder
      avgSentiment: 0.5,
      eviScore: 75,
      visibilityScore: 80,
      journalistCount: 50,
      outletCount: 30,
    };

    const competitorMetricsData = {
      competitorId,
      competitorName: competitor.name,
      mentionVolume: competitorMetrics.totalMentions,
      avgSentiment: competitorMetrics.avgSentiment || 0,
      eviScore: competitorMetrics.latestSnapshot?.eviScore || 0,
      visibilityScore: competitorMetrics.latestSnapshot?.visibilityScore || 0,
      journalistCount: competitorMetrics.latestSnapshot?.journalistCount || 0,
      outletCount: competitorMetrics.latestSnapshot?.outletCount || 0,
    };

    // Calculate differentials
    const differentials = {
      mentionVolume: brandMetrics.mentionVolume - competitorMetricsData.mentionVolume,
      sentiment: brandMetrics.avgSentiment - competitorMetricsData.avgSentiment,
      evi: brandMetrics.eviScore - competitorMetricsData.eviScore,
      visibility: brandMetrics.visibilityScore - competitorMetricsData.visibilityScore,
      journalists: brandMetrics.journalistCount - competitorMetricsData.journalistCount,
      outlets: brandMetrics.outletCount - competitorMetricsData.outletCount,
    };

    // Calculate advantage score
    const { data: advantageScore } = await this.supabase.rpc('calculate_advantage_score', {
      p_competitor_id: competitorId,
      p_org_id: orgId,
      p_window_days: Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    });

    // Identify advantage and threat areas
    const advantageAreas: string[] = [];
    const threatAreas: string[] = [];

    if (differentials.sentiment > 0.1) advantageAreas.push('Sentiment');
    else if (differentials.sentiment < -0.1) threatAreas.push('Sentiment');

    if (differentials.evi > 10) advantageAreas.push('EVI Score');
    else if (differentials.evi < -10) threatAreas.push('EVI Score');

    if (differentials.mentionVolume > 20) advantageAreas.push('Mention Volume');
    else if (differentials.mentionVolume < -20) threatAreas.push('Mention Volume');

    if (differentials.journalists > 10) advantageAreas.push('Journalist Relationships');
    else if (differentials.journalists < -10) threatAreas.push('Journalist Relationships');

    return {
      brandMetrics,
      competitorMetrics: competitorMetricsData,
      differentials,
      advantageScore: advantageScore || 0,
      advantageAreas,
      threatAreas,
    };
  }

  // =========================================================================
  // OVERLAP ANALYSIS
  // =========================================================================

  /**
   * Analyze overlap between brand and competitor
   */
  async analyzeOverlap(
    orgId: string,
    competitorId: string,
    overlapType: OverlapType,
    timeWindowDays: number = 30
  ): Promise<OverlapAnalysisResponse> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeWindowDays);

    // Calculate overlap score using SQL function
    const { data: overlapScore } = await this.supabase.rpc('calculate_overlap_score', {
      p_competitor_id: competitorId,
      p_org_id: orgId,
      p_overlap_type: overlapType,
      p_window_days: timeWindowDays,
    });

    // For journalist overlap, get shared vs exclusive journalists
    let shared: any[] = [];
    let brandExclusive: any[] = [];
    let competitorExclusive: any[] = [];

    if (overlapType === 'journalist_overlap') {
      // Get competitor journalists
      const { data: competitorMentions } = await this.supabase
        .from('competitor_mentions')
        .select('journalist_id')
        .eq('competitor_id', competitorId)
        .eq('org_id', orgId)
        .gte('published_at', startDate.toISOString())
        .not('journalist_id', 'is', null);

      const competitorJournalists = new Set(competitorMentions?.map((m) => m.journalist_id) || []);

      // Brand journalists would come from media monitoring
      const brandJournalists = new Set<string>(); // Placeholder

      // Calculate shared and exclusive
      shared = Array.from(competitorJournalists)
        .filter((id) => brandJournalists.has(id))
        .map((id) => ({ id, name: 'Unknown' }));

      competitorExclusive = Array.from(competitorJournalists)
        .filter((id) => !brandJournalists.has(id))
        .map((id) => ({ id, name: 'Unknown' }));
    }

    const sharedCount = shared.length;
    const brandExclusiveCount = brandExclusive.length;
    const competitorExclusiveCount = competitorExclusive.length;
    const totalEntities = sharedCount + brandExclusiveCount + competitorExclusiveCount;

    const exclusivityScore = totalEntities > 0 ? (brandExclusiveCount / totalEntities) * 100 : 0;

    // Store overlap analysis
    const overlapRow = {
      org_id: orgId,
      competitor_id: competitorId,
      overlap_type: overlapType,
      analyzed_at: endDate,
      time_window_days: timeWindowDays,
      overlap_score: overlapScore || 0,
      exclusivity_score: exclusivityScore,
      shared_entities: shared,
      brand_exclusive_entities: brandExclusive,
      competitor_exclusive_entities: competitorExclusive,
      shared_count: sharedCount,
      brand_exclusive_count: brandExclusiveCount,
      competitor_exclusive_count: competitorExclusiveCount,
      total_entities: totalEntities,
    };

    const { data: _overlap, error } = await this.supabase
      .from('competitor_overlap')
      .insert(overlapRow)
      .select()
      .single();

    if (error) throw new Error(`Failed to create overlap analysis: ${error.message}`);

    const advantageScore = exclusivityScore - 50; // Simple: >50% exclusive = advantage

    let recommendation = '';
    if (advantageScore > 20) {
      recommendation = `Strong exclusive ${overlapType.replace('_overlap', '')} relationships. Maintain these exclusive connections.`;
    } else if (advantageScore < -20) {
      recommendation = `High overlap with competitor. Focus on building exclusive relationships.`;
    } else {
      recommendation = `Moderate overlap. Opportunity to expand exclusive relationships.`;
    }

    return {
      overlapType,
      overlapScore: overlapScore || 0,
      exclusivityScore,
      shared,
      brandExclusive,
      competitorExclusive,
      sharedCount,
      brandExclusiveCount,
      competitorExclusiveCount,
      totalEntities,
      advantageScore,
      recommendation,
    };
  }

  /**
   * Get overlap analyses with filters
   */
  async getOverlap(
    orgId: string,
    filters: OverlapFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<GetOverlapResponse> {
    let query = this.supabase
      .from('competitor_overlap')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (filters.competitorId) query = query.eq('competitor_id', filters.competitorId);
    if (filters.overlapType) query = query.eq('overlap_type', filters.overlapType);
    if (filters.analyzedStart) query = query.gte('analyzed_at', filters.analyzedStart.toISOString());
    if (filters.analyzedEnd) query = query.lte('analyzed_at', filters.analyzedEnd.toISOString());
    if (filters.minOverlapScore !== undefined) query = query.gte('overlap_score', filters.minOverlapScore);

    query = query.order('analyzed_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: overlaps, count, error } = await query;

    if (error) throw new Error(`Failed to fetch overlaps: ${error.message}`);

    return {
      overlaps: overlaps?.map((o) => this.mapOverlapFromDb(o)) || [],
      total: count || 0,
      limit,
      offset,
    };
  }

  // =========================================================================
  // INSIGHTS GENERATION
  // =========================================================================

  /**
   * Create a competitor insight
   */
  async createInsight(
    orgId: string,
    data: CreateCompetitorInsightRequest
  ): Promise<CompetitorInsight> {
    const row = {
      org_id: orgId,
      competitor_id: data.competitorId,
      category: data.category,
      title: data.title,
      description: data.description,
      recommendation: data.recommendation || null,
      impact_score: data.impactScore,
      confidence_score: data.confidenceScore,
      priority_score: data.priorityScore || null,
      supporting_metrics: data.supportingMetrics || null,
      supporting_mentions: data.supportingMentions || null,
      time_window_start: data.timeWindowStart || null,
      time_window_end: data.timeWindowEnd || null,
      generated_by: data.generatedBy || 'rule',
      llm_model: data.llmModel || null,
      llm_prompt: data.llmPrompt || null,
      is_read: false,
      is_dismissed: false,
    };

    const { data: insight, error } = await this.supabase
      .from('competitor_insights')
      .insert(row)
      .select()
      .single();

    if (error) throw new Error(`Failed to create insight: ${error.message}`);
    return this.mapInsightFromDb(insight);
  }

  /**
   * Update competitor insight
   */
  async updateInsight(
    orgId: string,
    insightId: string,
    data: UpdateCompetitorInsightRequest
  ): Promise<CompetitorInsight> {
    const updates: any = {};
    if (data.isRead !== undefined) updates.is_read = data.isRead;
    if (data.isDismissed !== undefined) updates.is_dismissed = data.isDismissed;
    if (data.userFeedback !== undefined) updates.user_feedback = data.userFeedback;

    const { data: insight, error } = await this.supabase
      .from('competitor_insights')
      .update(updates)
      .eq('id', insightId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update insight: ${error.message}`);
    return this.mapInsightFromDb(insight);
  }

  /**
   * Get insights with filters and pagination
   */
  async getInsights(
    orgId: string,
    filters: CIInsightFilters = {},
    limit: number = 20,
    offset: number = 0
  ): Promise<CIGetInsightsResponse> {
    let query = this.supabase
      .from('competitor_insights')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (filters.competitorId) query = query.eq('competitor_id', filters.competitorId);
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.isRead !== undefined) query = query.eq('is_read', filters.isRead);
    if (filters.isDismissed !== undefined) query = query.eq('is_dismissed', filters.isDismissed);
    if (filters.minImpactScore !== undefined) query = query.gte('impact_score', filters.minImpactScore);
    if (filters.createdStart) query = query.gte('created_at', filters.createdStart.toISOString());
    if (filters.createdEnd) query = query.lte('created_at', filters.createdEnd.toISOString());

    // Count unread
    const { count: unreadCount } = await this.supabase
      .from('competitor_insights')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_read', false);

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: insights, count, error } = await query;

    if (error) throw new Error(`Failed to fetch insights: ${error.message}`);

    return {
      insights: insights?.map((i) => this.mapInsightFromDb(i)) || [],
      total: count || 0,
      unreadCount: unreadCount || 0,
      limit,
      offset,
    };
  }

  /**
   * Generate LLM-based competitive insight
   */
  async generateInsight(
    orgId: string,
    data: GenerateInsightRequest
  ): Promise<CompetitorInsight> {
    const timeWindowDays = data.timeWindowDays || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeWindowDays);

    // Get competitor info and metrics
    const competitor = await this.getCompetitor(orgId, data.competitorId);
    const metrics = await this.getCompetitorMetrics(orgId, data.competitorId, startDate, endDate);

    // Build prompt based on category
    let prompt = '';
    switch (data.category) {
      case 'advantage':
        prompt = `Analyze where our brand has competitive advantages over ${competitor.name}.

Metrics:
- Our mentions: ${metrics.totalMentions} mentions
- Sentiment: ${metrics.avgSentiment?.toFixed(2) || 'N/A'}
- Recent anomalies: ${metrics.recentAnomalies}

Provide 2-3 specific advantage areas and recommendations.`;
        break;

      case 'threat':
        prompt = `Identify competitive threats from ${competitor.name}.

Competitor Metrics:
- Mentions: ${metrics.totalMentions}
- Sentiment: ${metrics.avgSentiment?.toFixed(2) || 'N/A'}
- Recent anomalies: ${metrics.recentAnomalies}

What threats should we monitor?`;
        break;

      case 'opportunity':
        prompt = `Identify opportunities to gain advantage over ${competitor.name}.

Analysis window: ${timeWindowDays} days
Competitor tier: ${competitor.tier}

What strategic opportunities exist?`;
        break;

      default:
        prompt = `Provide strategic competitive insight for ${competitor.name} in category: ${data.category}.`;
    }

    // Generate insight using LLM
    let title = '';
    let description = '';
    let recommendation = '';
    let llmModel = '';

    try {
      if (this.llmRouter) {
        const llmResponse = await this.llmRouter.generate({
          userPrompt: prompt,
          maxTokens: 500,
          temperature: 0.7,
          systemPrompt: 'You are a competitive intelligence analyst. Provide concise, actionable insights.',
        });

        llmModel = llmResponse.model;
        const response = llmResponse.completion;

        // Parse response (simplified)
        const lines = response.split('\n').filter((l: string) => l.trim());
        title = lines[0] || `${data.category} insight for ${competitor.name}`;
        description = lines.slice(1, -1).join(' ') || response;
        recommendation = lines[lines.length - 1] || 'Monitor competitor activity.';
      } else {
        // Fallback to rule-based insight when LLM not available
        throw new Error('LLM router not configured');
      }
    } catch (error) {
      logger.warn('LLM insight generation failed, using rule-based fallback', { error });
      // Fallback to rule-based insight
      title = `${data.category.toUpperCase()}: ${competitor.name}`;
      description = `Competitive ${data.category} detected for ${competitor.name} over ${timeWindowDays}-day period.`;
      recommendation = `Continue monitoring ${competitor.name} for changes in competitive positioning.`;
    }

    // Calculate impact and confidence scores
    const impactScore = Math.min(100, (metrics.totalMentions / 10) * (metrics.recentAnomalies + 1));
    const confidenceScore = metrics.totalMentions > 20 ? 85 : 60;

    // Create insight
    return await this.createInsight(orgId, {
      competitorId: data.competitorId,
      category: data.category,
      title,
      description,
      recommendation,
      impactScore,
      confidenceScore,
      priorityScore: impactScore,
      supportingMetrics: {
        totalMentions: metrics.totalMentions,
        avgSentiment: metrics.avgSentiment,
        recentAnomalies: metrics.recentAnomalies,
      },
      timeWindowStart: startDate,
      timeWindowEnd: endDate,
      generatedBy: llmModel ? 'llm' : 'rule',
      llmModel: llmModel || undefined,
      llmPrompt: prompt,
    });
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Get previous snapshot for anomaly detection
   */
  private async getPreviousSnapshot(
    orgId: string,
    competitorId: string,
    period: SnapshotPeriod
  ): Promise<CompetitorMetricsSnapshot | null> {
    const { data: snapshot } = await this.supabase
      .from('competitor_metrics_snapshots')
      .select('*')
      .eq('competitor_id', competitorId)
      .eq('org_id', orgId)
      .eq('period', period)
      .order('snapshot_at', { ascending: false })
      .limit(2);

    if (!snapshot || snapshot.length < 2) return null;
    return this.mapSnapshotFromDb(snapshot[1]);
  }

  // =========================================================================
  // DATABASE MAPPERS
  // =========================================================================

  private mapCompetitorFromDb(row: any): Competitor {
    return {
      id: row.id,
      orgId: row.org_id,
      name: row.name,
      domain: row.domain,
      tier: row.tier as CompetitorTier,
      industry: row.industry,
      description: row.description,
      keywords: row.keywords,
      domains: row.domains,
      socialHandles: row.social_handles,
      isActive: row.is_active,
      trackedSince: new Date(row.tracked_since),
      lastAnalyzedAt: row.last_analyzed_at ? new Date(row.last_analyzed_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapMentionFromDb(row: any): CompetitorMention {
    return {
      id: row.id,
      orgId: row.org_id,
      competitorId: row.competitor_id,
      sourceType: row.source_type,
      sourceUrl: row.source_url,
      publishedAt: new Date(row.published_at),
      title: row.title,
      content: row.content,
      excerpt: row.excerpt,
      authorName: row.author_name,
      journalistId: row.journalist_id,
      outletName: row.outlet_name,
      outletTier: row.outlet_tier,
      sentimentScore: row.sentiment_score,
      topics: row.topics,
      keywords: row.keywords,
      estimatedReach: row.estimated_reach,
      matchedKeywords: row.matched_keywords,
      confidenceScore: row.confidence_score,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapSnapshotFromDb(row: any): CompetitorMetricsSnapshot {
    return {
      id: row.id,
      orgId: row.org_id,
      competitorId: row.competitor_id,
      snapshotAt: new Date(row.snapshot_at),
      period: row.period as SnapshotPeriod,
      mentionCount: row.mention_count,
      articleCount: row.article_count,
      journalistCount: row.journalist_count,
      outletCount: row.outlet_count,
      avgSentiment: row.avg_sentiment,
      sentimentDistribution: row.sentiment_distribution,
      sentimentStabilityScore: row.sentiment_stability_score,
      visibilityScore: row.visibility_score,
      estimatedReach: row.estimated_reach,
      shareOfVoice: row.share_of_voice,
      eviScore: row.evi_score,
      eviComponents: row.evi_components,
      tierDistribution: row.tier_distribution,
      topJournalists: row.top_journalists,
      journalistExclusivityScore: row.journalist_exclusivity_score,
      topTopics: row.top_topics,
      topicClusters: row.topic_clusters,
      mentionVolumeDifferential: row.mention_volume_differential,
      sentimentDifferential: row.sentiment_differential,
      eviDifferential: row.evi_differential,
      coverageVelocityDifferential: row.coverage_velocity_differential,
      hasAnomaly: row.has_anomaly,
      anomalyType: row.anomaly_type as SpikeType | null,
      anomalyMagnitude: row.anomaly_magnitude,
      anomalyDescription: row.anomaly_description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapInsightFromDb(row: any): CompetitorInsight {
    return {
      id: row.id,
      orgId: row.org_id,
      competitorId: row.competitor_id,
      category: row.category as CIInsightCategory,
      title: row.title,
      description: row.description,
      recommendation: row.recommendation,
      impactScore: row.impact_score,
      confidenceScore: row.confidence_score,
      priorityScore: row.priority_score,
      supportingMetrics: row.supporting_metrics,
      supportingMentions: row.supporting_mentions,
      timeWindowStart: row.time_window_start ? new Date(row.time_window_start) : null,
      timeWindowEnd: row.time_window_end ? new Date(row.time_window_end) : null,
      generatedBy: row.generated_by as 'llm' | 'rule' | 'hybrid',
      llmModel: row.llm_model,
      llmPrompt: row.llm_prompt,
      isRead: row.is_read,
      isDismissed: row.is_dismissed,
      userFeedback: row.user_feedback,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapOverlapFromDb(row: any): CompetitorOverlap {
    return {
      id: row.id,
      orgId: row.org_id,
      competitorId: row.competitor_id,
      overlapType: row.overlap_type as OverlapType,
      analyzedAt: new Date(row.analyzed_at),
      timeWindowDays: row.time_window_days,
      overlapScore: row.overlap_score,
      exclusivityScore: row.exclusivity_score,
      sharedEntities: row.shared_entities,
      brandExclusiveEntities: row.brand_exclusive_entities,
      competitorExclusiveEntities: row.competitor_exclusive_entities,
      sharedCount: row.shared_count,
      brandExclusiveCount: row.brand_exclusive_count,
      competitorExclusiveCount: row.competitor_exclusive_count,
      totalEntities: row.total_entities,
      advantageScore: row.advantage_score,
      advantageDescription: row.advantage_description,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
