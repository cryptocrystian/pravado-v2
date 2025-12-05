/**
 * Media Performance Analytics Service (Sprint S52)
 * Unified performance intelligence engine across S38-S50 PR systems
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { routeLLM } from '@pravado/utils';
import {
  TrendDirection,
  AnomalyType,
  MetricType,
  AggregationPeriod,
} from '@pravado/types';
import type {
  MediaPerformanceSnapshot,
  MediaPerformanceDimension,
  MediaPerformanceScore,
  MediaPerformanceInsight,
  CreateSnapshotRequest,
  CreateDimensionRequest,
  CreateScoreRequest,
  CreateInsightRequest,
  UpdateInsightRequest,
  MediaPerformanceFilters,
  DimensionFilters,
  ScoreFilters,
  InsightFilters,
  GetSnapshotsResponse,
  GetDimensionsResponse,
  GetScoresResponse,
  GetInsightsResponse,
  GetTrendResponse,
  GetAnomaliesResponse,
  GetOverviewResponse,
  AnomalyDetection,
  TierDistribution,
  DimensionType,
  InsightCategory,
  TopPerformer,
} from '@pravado/types';

export class MediaPerformanceService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  /**
   * ============================================================================
   * SNAPSHOT MANAGEMENT
   * ============================================================================
   */

  /**
   * Create a new performance snapshot
   */
  async createSnapshot(
    orgId: string,
    data: CreateSnapshotRequest
  ): Promise<MediaPerformanceSnapshot> {
    const { metrics, ...snapshotData } = data;

    // Calculate derived scores if not provided
    const visibilityScore =
      metrics.visibilityScore ??
      (await this.calculateVisibilityScore(
        metrics.estimatedReach || 0,
        metrics.tierDistribution || this.defaultTierDistribution(),
        metrics.mentionCount,
        metrics.shareOfVoice || 0
      ));

    const eviScore =
      metrics.eviScore ??
      (await this.calculateEVIScore(
        metrics.estimatedReach || 0,
        metrics.avgSentiment || 0,
        metrics.tierDistribution || this.defaultTierDistribution(),
        metrics.mentionCount
      ));

    // Detect anomalies if we have historical data
    let hasAnomaly = false;
    let anomalyType: string | null = null;
    let anomalyMagnitude: number | null = null;

    if (metrics.mentionCount > 0) {
      const anomaly = await this.detectAnomaly(
        orgId,
        'mention_count',
        metrics.mentionCount,
        snapshotData.brandId,
        snapshotData.campaignId
      );

      hasAnomaly = anomaly.hasAnomaly;
      anomalyType = anomaly.anomalyType || null;
      anomalyMagnitude = anomaly.magnitude;
    }

    const { data: snapshot, error } = await this.supabase
      .from('media_performance_snapshots')
      .insert({
        org_id: orgId,
        snapshot_at: snapshotData.snapshotAt,
        aggregation_period: snapshotData.aggregationPeriod,
        brand_id: snapshotData.brandId,
        campaign_id: snapshotData.campaignId,
        journalist_id: snapshotData.journalistId,
        outlet_tier: snapshotData.outletTier,
        topic_cluster: snapshotData.topicCluster,
        mention_count: metrics.mentionCount,
        article_count: metrics.articleCount,
        journalist_count: metrics.journalistCount,
        outlet_count: metrics.outletCount,
        avg_sentiment: metrics.avgSentiment,
        sentiment_distribution: metrics.sentimentDistribution,
        sentiment_stability_score: metrics.avgSentiment
          ? await this.calculateSentimentStability(
              orgId,
              snapshotData.brandId || '',
              30
            )
          : null,
        visibility_score: visibilityScore,
        estimated_reach: metrics.estimatedReach,
        share_of_voice: metrics.shareOfVoice,
        engagement_score: metrics.engagementScore,
        pitch_success_rate: metrics.pitchSuccessRate,
        deliverability_rate: metrics.deliverabilityRate,
        coverage_velocity: metrics.coverageVelocity,
        momentum_score: metrics.momentumScore,
        evi_score: eviScore,
        evi_components: metrics.eviComponents,
        journalist_impact_score: metrics.topJournalists?.[0]?.impactScore,
        top_journalists: metrics.topJournalists,
        tier_distribution: metrics.tierDistribution,
        top_keywords: metrics.topKeywords,
        topic_clusters: metrics.topicClusters,
        entities_mentioned: metrics.entitiesMentioned,
        has_anomaly: hasAnomaly,
        anomaly_type: anomalyType,
        anomaly_magnitude: anomalyMagnitude,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create snapshot: ${error.message}`);

    return this.mapSnapshotFromDb(snapshot);
  }

  /**
   * Get snapshots with filters
   */
  async getSnapshots(
    orgId: string,
    filters: MediaPerformanceFilters = {},
    limit = 100,
    offset = 0
  ): Promise<GetSnapshotsResponse> {
    let query = this.supabase
      .from('media_performance_snapshots')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('snapshot_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (filters.brandId) query = query.eq('brand_id', filters.brandId);
    if (filters.campaignId) query = query.eq('campaign_id', filters.campaignId);
    if (filters.journalistId) query = query.eq('journalist_id', filters.journalistId);
    if (filters.outletTier) query = query.eq('outlet_tier', filters.outletTier);
    if (filters.topicCluster) query = query.eq('topic_cluster', filters.topicCluster);
    if (filters.startDate) query = query.gte('snapshot_at', filters.startDate);
    if (filters.endDate) query = query.lte('snapshot_at', filters.endDate);
    if (filters.aggregationPeriod)
      query = query.eq('aggregation_period', filters.aggregationPeriod);
    if (filters.hasAnomaly !== undefined)
      query = query.eq('has_anomaly', filters.hasAnomaly);
    if (filters.minEviScore) query = query.gte('evi_score', filters.minEviScore);
    if (filters.minVisibilityScore)
      query = query.gte('visibility_score', filters.minVisibilityScore);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to get snapshots: ${error.message}`);

    return {
      snapshots: (data || []).map(this.mapSnapshotFromDb),
      total: count || 0,
    };
  }

  /**
   * Get snapshot by ID
   */
  async getSnapshot(orgId: string, snapshotId: string): Promise<MediaPerformanceSnapshot> {
    const { data, error } = await this.supabase
      .from('media_performance_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', snapshotId)
      .single();

    if (error) throw new Error(`Failed to get snapshot: ${error.message}`);
    if (!data) throw new Error('Snapshot not found');

    return this.mapSnapshotFromDb(data);
  }

  /**
   * ============================================================================
   * DIMENSION ROLLUPS
   * ============================================================================
   */

  /**
   * Create dimension rollup
   */
  async createDimension(
    orgId: string,
    data: CreateDimensionRequest
  ): Promise<MediaPerformanceDimension> {
    const { metrics, ...dimensionData } = data;

    const { data: dimension, error } = await this.supabase
      .from('media_performance_dimensions')
      .insert({
        org_id: orgId,
        dimension_type: dimensionData.dimensionType,
        dimension_value: dimensionData.dimensionValue,
        start_date: dimensionData.startDate,
        end_date: dimensionData.endDate,
        total_mentions: metrics.totalMentions,
        unique_journalists: metrics.uniqueJournalists,
        unique_outlets: metrics.uniqueOutlets,
        avg_sentiment: metrics.avgSentiment,
        total_reach: metrics.totalReach,
        avg_visibility_score: metrics.avgVisibilityScore,
        avg_engagement_score: metrics.avgEngagementScore,
        rollup_data: dimensionData.rollupData,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create dimension: ${error.message}`);

    return this.mapDimensionFromDb(dimension);
  }

  /**
   * Get dimensions with filters
   */
  async getDimensions(
    orgId: string,
    filters: DimensionFilters = {},
    limit = 100,
    offset = 0
  ): Promise<GetDimensionsResponse> {
    let query = this.supabase
      .from('media_performance_dimensions')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.dimensionType) query = query.eq('dimension_type', filters.dimensionType);
    if (filters.dimensionValue) query = query.eq('dimension_value', filters.dimensionValue);
    if (filters.startDate) query = query.gte('start_date', filters.startDate);
    if (filters.endDate) query = query.lte('end_date', filters.endDate);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to get dimensions: ${error.message}`);

    return {
      dimensions: (data || []).map(this.mapDimensionFromDb),
      total: count || 0,
    };
  }

  /**
   * ============================================================================
   * SCORE MANAGEMENT
   * ============================================================================
   */

  /**
   * Create or update score
   */
  async upsertScore(orgId: string, data: CreateScoreRequest): Promise<MediaPerformanceScore> {
    const { data: score, error } = await this.supabase
      .from('media_performance_scores')
      .upsert(
        {
          org_id: orgId,
          entity_type: data.entityType,
          entity_id: data.entityId,
          score_type: data.scoreType,
          score_value: data.scoreValue,
          score_components: data.scoreComponents,
          calculated_at: new Date().toISOString(),
          window_start_date: data.windowStartDate,
          window_end_date: data.windowEndDate,
          metadata: data.metadata,
        },
        {
          onConflict: 'org_id,entity_type,entity_id,score_type',
        }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to upsert score: ${error.message}`);

    return this.mapScoreFromDb(score);
  }

  /**
   * Get scores with filters
   */
  async getScores(
    orgId: string,
    filters: ScoreFilters = {},
    limit = 100,
    offset = 0
  ): Promise<GetScoresResponse> {
    let query = this.supabase
      .from('media_performance_scores')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('calculated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.entityType) query = query.eq('entity_type', filters.entityType);
    if (filters.entityId) query = query.eq('entity_id', filters.entityId);
    if (filters.scoreType) query = query.eq('score_type', filters.scoreType);
    if (filters.minScore) query = query.gte('score_value', filters.minScore);
    if (filters.maxScore) query = query.lte('score_value', filters.maxScore);
    if (filters.startDate) query = query.gte('calculated_at', filters.startDate);
    if (filters.endDate) query = query.lte('calculated_at', filters.endDate);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to get scores: ${error.message}`);

    return {
      scores: (data || []).map(this.mapScoreFromDb),
      total: count || 0,
    };
  }

  /**
   * ============================================================================
   * INSIGHT MANAGEMENT
   * ============================================================================
   */

  /**
   * Create insight
   */
  async createInsight(
    orgId: string,
    data: CreateInsightRequest
  ): Promise<MediaPerformanceInsight> {
    const { data: insight, error } = await this.supabase
      .from('media_performance_insights')
      .insert({
        org_id: orgId,
        category: data.category,
        title: data.title,
        summary: data.summary,
        recommendation: data.recommendation,
        generated_by_llm: data.generatedByLlm || false,
        llm_model: data.llmModel,
        llm_prompt_version: data.llmPromptVersion,
        related_entity_type: data.relatedEntityType,
        related_entity_id: data.relatedEntityId,
        time_window_start: data.timeWindowStart,
        time_window_end: data.timeWindowEnd,
        impact_score: data.impactScore,
        confidence_score: data.confidenceScore,
        supporting_data: data.supportingData,
        is_read: false,
        is_dismissed: false,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create insight: ${error.message}`);

    return this.mapInsightFromDb(insight);
  }

  /**
   * Update insight
   */
  async updateInsight(
    orgId: string,
    insightId: string,
    data: UpdateInsightRequest
  ): Promise<MediaPerformanceInsight> {
    const { data: insight, error } = await this.supabase
      .from('media_performance_insights')
      .update(data)
      .eq('org_id', orgId)
      .eq('id', insightId)
      .select()
      .single();

    if (error) throw new Error(`Failed to update insight: ${error.message}`);

    return this.mapInsightFromDb(insight);
  }

  /**
   * Get insights with filters
   */
  async getInsights(
    orgId: string,
    filters: InsightFilters = {},
    limit = 50,
    offset = 0
  ): Promise<GetInsightsResponse> {
    let query = this.supabase
      .from('media_performance_insights')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters.category) query = query.eq('category', filters.category);
    if (filters.isRead !== undefined) query = query.eq('is_read', filters.isRead);
    if (filters.isDismissed !== undefined) query = query.eq('is_dismissed', filters.isDismissed);
    if (filters.relatedEntityType)
      query = query.eq('related_entity_type', filters.relatedEntityType);
    if (filters.relatedEntityId) query = query.eq('related_entity_id', filters.relatedEntityId);
    if (filters.minImpactScore) query = query.gte('impact_score', filters.minImpactScore);
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    const { data, error, count } = await query;

    if (error) throw new Error(`Failed to get insights: ${error.message}`);

    // Get unread count
    const { count: unreadCount } = await this.supabase
      .from('media_performance_insights')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_read', false)
      .eq('is_dismissed', false);

    return {
      insights: (data || []).map(this.mapInsightFromDb),
      total: count || 0,
      unreadCount: unreadCount || 0,
    };
  }

  /**
   * Generate LLM insight from snapshot data
   */
  async generateInsight(
    orgId: string,
    snapshotId: string,
    category: InsightCategory
  ): Promise<MediaPerformanceInsight> {
    const snapshot = await this.getSnapshot(orgId, snapshotId);

    const prompt = this.buildInsightPrompt(snapshot, category);

    const response = await routeLLM({
      systemPrompt: 'You are a PR analytics expert. Generate actionable insights from media performance data.',
      userPrompt: prompt,
      responseFormat: 'json',
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          recommendation: { type: 'string' },
          impactScore: { type: 'number' },
        },
        required: ['title', 'summary', 'recommendation', 'impactScore'],
      },
    });

    const parsedResponse = JSON.parse(response.content);

    return this.createInsight(orgId, {
      category,
      title: parsedResponse.title,
      summary: parsedResponse.summary,
      recommendation: parsedResponse.recommendation,
      generatedByLlm: true,
      llmModel: response.model,
      llmPromptVersion: 'v1',
      relatedEntityType: 'snapshot',
      relatedEntityId: snapshotId,
      timeWindowStart: snapshot.snapshotAt,
      timeWindowEnd: snapshot.snapshotAt,
      impactScore: parsedResponse.impactScore,
      confidenceScore: 0.85,
      supportingData: {
        mentionCount: snapshot.mentionCount,
        avgSentiment: snapshot.avgSentiment,
        eviScore: snapshot.eviScore,
      },
    });
  }

  /**
   * ============================================================================
   * ANALYTICS & TRENDS
   * ============================================================================
   */

  /**
   * Get trend data for a specific metric
   */
  async getTrend(
    orgId: string,
    metric: MetricType,
    filters: MediaPerformanceFilters = {},
    limit = 100
  ): Promise<GetTrendResponse> {
    const { snapshots } = await this.getSnapshots(orgId, filters, limit);

    const metricMap: Record<MetricType, keyof MediaPerformanceSnapshot> = {
      [MetricType.MENTION_VOLUME]: 'mentionCount',
      [MetricType.SENTIMENT_SCORE]: 'avgSentiment',
      [MetricType.VISIBILITY_INDEX]: 'visibilityScore',
      [MetricType.JOURNALIST_IMPACT]: 'journalistImpactScore',
      [MetricType.OUTLET_TIER_DISTRIBUTION]: 'tierDistribution',
      [MetricType.CAMPAIGN_VELOCITY]: 'coverageVelocity',
      [MetricType.DELIVERABILITY_RATE]: 'deliverabilityRate',
      [MetricType.ENGAGEMENT_SCORE]: 'engagementScore',
      [MetricType.EVI_SCORE]: 'eviScore',
      [MetricType.RESONANCE_METRIC]: 'momentumScore',
    };

    const dataPoints = snapshots
      .map((s) => {
        const value = s[metricMap[metric]] as number | undefined;
        return value !== undefined && value !== null
          ? {
              timestamp: s.snapshotAt,
              value,
            }
          : null;
      })
      .filter((dp) => dp !== null);

    const values = dataPoints.map((dp) => dp.value);
    const currentValue = values[0] || 0;
    const previousValue = values[1] || 0;
    const changePct =
      previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

    const trendDirection: TrendDirection =
      Math.abs(changePct) < 5 ? TrendDirection.STABLE : changePct > 0 ? TrendDirection.UP : TrendDirection.DOWN;

    return {
      metric,
      dataPoints,
      summary: {
        currentValue,
        previousValue,
        changePct,
        trendDirection,
        avgValue: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
        maxValue: values.length > 0 ? Math.max(...values) : 0,
        minValue: values.length > 0 ? Math.min(...values) : 0,
      },
    };
  }

  /**
   * Get anomalies
   */
  async getAnomalies(
    orgId: string,
    filters: MediaPerformanceFilters = {},
    limit = 20
  ): Promise<GetAnomaliesResponse> {
    const anomalyFilters = { ...filters, hasAnomaly: true };
    const { snapshots, total } = await this.getSnapshots(orgId, anomalyFilters, limit);

    const anomalies = await Promise.all(
      snapshots.map(async (snapshot) => {
        // Get historical context
        const historicalData = await this.getHistoricalStats(
          orgId,
          'mention_count',
          snapshot.brandId ?? undefined,
          snapshot.campaignId ?? undefined,
          30
        );

        return {
          snapshot,
          anomalyDetails: {
            hasAnomaly: snapshot.hasAnomaly,
            anomalyType: (snapshot.anomalyType as AnomalyType) || undefined,
            magnitude: snapshot.anomalyMagnitude || 0,
            zScore: historicalData.stdDev
              ? (snapshot.mentionCount - historicalData.avg) / historicalData.stdDev
              : 0,
          },
          context: {
            historicalAvg: historicalData.avg,
            historicalStdDev: historicalData.stdDev,
            threshold: 2.0,
          },
        };
      })
    );

    return {
      anomalies,
      total,
    };
  }

  /**
   * Get performance overview
   */
  async getOverview(
    orgId: string,
    startDate: Date,
    endDate: Date,
    brandId?: string,
    campaignId?: string
  ): Promise<GetOverviewResponse> {
    const filters: MediaPerformanceFilters = {
      startDate,
      endDate,
      brandId,
      campaignId,
      aggregationPeriod: AggregationPeriod.DAILY,
    };

    const { snapshots } = await this.getSnapshots(orgId, filters, 1000);

    // Calculate summary
    const summary = {
      totalMentions: snapshots.reduce((sum, s) => sum + s.mentionCount, 0),
      totalArticles: snapshots.reduce((sum, s) => sum + s.articleCount, 0),
      totalJournalists: new Set(
        snapshots.flatMap((s) => s.topJournalists?.map((j) => j.journalistId) || [])
      ).size,
      totalOutlets: snapshots.reduce((sum, s) => sum + s.outletCount, 0),
      avgSentiment:
        snapshots.reduce((sum, s) => sum + (s.avgSentiment || 0), 0) / snapshots.length || 0,
      estimatedReach: snapshots.reduce((sum, s) => sum + (s.estimatedReach || 0), 0),
      avgVisibilityScore:
        snapshots.reduce((sum, s) => sum + (s.visibilityScore || 0), 0) / snapshots.length || 0,
      avgEviScore:
        snapshots.reduce((sum, s) => sum + (s.eviScore || 0), 0) / snapshots.length || 0,
    };

    // Calculate trends
    const midpoint = Math.floor(snapshots.length / 2);
    const firstHalf = snapshots.slice(0, midpoint);
    const secondHalf = snapshots.slice(midpoint);

    const calcTrend = (metric: (s: MediaPerformanceSnapshot) => number) => {
      const firstAvg = firstHalf.reduce((sum, s) => sum + metric(s), 0) / firstHalf.length || 0;
      const secondAvg =
        secondHalf.reduce((sum, s) => sum + metric(s), 0) / secondHalf.length || 0;
      return firstAvg !== 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    };

    const trends = {
      mentionsTrend: calcTrend((s) => s.mentionCount),
      sentimentTrend: calcTrend((s) => s.avgSentiment || 0),
      visibilityTrend: calcTrend((s) => s.visibilityScore || 0),
      eviTrend: calcTrend((s) => s.eviScore || 0),
    };

    // Get top performers
    const topPerformers = {
      campaigns: await this.getTopPerformers(orgId, 'campaign', startDate, endDate, 5),
      journalists: await this.getTopPerformers(orgId, 'journalist', startDate, endDate, 5),
      topics: await this.getTopPerformers(orgId, 'topic', startDate, endDate, 5),
    };

    // Get latest insights
    const { insights } = await this.getInsights(
      orgId,
      { startDate, endDate, isDismissed: false },
      5
    );

    return {
      period: { start: startDate, end: endDate },
      summary,
      trends,
      topPerformers,
      insights,
    };
  }

  /**
   * ============================================================================
   * SCORING ALGORITHMS
   * ============================================================================
   */

  /**
   * Calculate visibility score (0-100)
   * Weighted: reach (30%), tier (30%), frequency (20%), SOV (20%)
   */
  private async calculateVisibilityScore(
    estimatedReach: number,
    tierDistribution: TierDistribution,
    mentionCount: number,
    shareOfVoice: number
  ): Promise<number> {
    // Reach score (0-100, log scale)
    const reachScore = Math.min(100, Math.log10(estimatedReach + 1) * 10);

    // Tier score (weighted by tier quality)
    const tierScore =
      tierDistribution.tier1 * 1.0 +
      tierDistribution.tier2 * 0.7 +
      tierDistribution.tier3 * 0.4 +
      tierDistribution.tier4 * 0.2;
    const totalTier =
      tierDistribution.tier1 +
      tierDistribution.tier2 +
      tierDistribution.tier3 +
      tierDistribution.tier4 +
      tierDistribution.unknown;
    const normalizedTierScore = totalTier > 0 ? (tierScore / totalTier) * 100 : 0;

    // Frequency score (log scale)
    const frequencyScore = Math.min(100, Math.log10(mentionCount + 1) * 20);

    // Share of voice score (already 0-100)
    const sovScore = shareOfVoice;

    return reachScore * 0.3 + normalizedTierScore * 0.3 + frequencyScore * 0.2 + sovScore * 0.2;
  }

  /**
   * Calculate EVI (Earned Visibility Index) score (0-100)
   * Weighted: reach (30%), sentiment (25%), tier (30%), frequency (15%)
   */
  private async calculateEVIScore(
    estimatedReach: number,
    avgSentiment: number,
    tierDistribution: TierDistribution,
    mentionCount: number
  ): Promise<number> {
    const reachScore = Math.min(100, Math.log10(estimatedReach + 1) * 10);

    // Sentiment score (convert -1 to 1 → 0 to 100)
    const sentimentScore = (avgSentiment + 1) * 50;

    // Tier score
    const tierScore =
      tierDistribution.tier1 * 1.0 +
      tierDistribution.tier2 * 0.7 +
      tierDistribution.tier3 * 0.4 +
      tierDistribution.tier4 * 0.2;
    const totalTier =
      tierDistribution.tier1 +
      tierDistribution.tier2 +
      tierDistribution.tier3 +
      tierDistribution.tier4 +
      tierDistribution.unknown;
    const normalizedTierScore = totalTier > 0 ? (tierScore / totalTier) * 100 : 0;

    const frequencyScore = Math.min(100, Math.log10(mentionCount + 1) * 20);

    const eviScore =
      reachScore * 0.3 + sentimentScore * 0.25 + normalizedTierScore * 0.3 + frequencyScore * 0.15;

    return Math.max(0, Math.min(100, eviScore));
  }

  /**
   * Calculate journalist impact score (0-100)
   */
  async calculateJournalistImpact(
    orgId: string,
    journalistId: string,
    windowDays = 90
  ): Promise<number> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const { snapshots } = await this.getSnapshots(
      orgId,
      { journalistId, startDate, endDate },
      1000
    );

    if (snapshots.length === 0) return 0;

    // Frequency score (30%)
    const frequencyScore = Math.min(100, snapshots.length * 2);

    // Tier score (40%)
    const tierCounts = { tier1: 0, tier2: 0, tier3: 0, tier4: 0 };
    snapshots.forEach((s) => {
      if (s.outletTier?.startsWith('tier1')) tierCounts.tier1++;
      else if (s.outletTier?.startsWith('tier2')) tierCounts.tier2++;
      else if (s.outletTier?.startsWith('tier3')) tierCounts.tier3++;
      else if (s.outletTier?.startsWith('tier4')) tierCounts.tier4++;
    });
    const tierScore =
      (tierCounts.tier1 * 100 +
        tierCounts.tier2 * 70 +
        tierCounts.tier3 * 40 +
        tierCounts.tier4 * 20) /
      snapshots.length;

    // Sentiment bonus (30%)
    const avgSentiment =
      snapshots.reduce((sum, s) => sum + (s.avgSentiment || 0), 0) / snapshots.length;
    const sentimentBonus = (avgSentiment + 1) * 50 * 0.3;

    return frequencyScore * 0.3 + tierScore * 0.4 + sentimentBonus;
  }

  /**
   * Calculate sentiment stability (variance-based)
   */
  private async calculateSentimentStability(
    orgId: string,
    brandId: string,
    windowDays = 30
  ): Promise<number> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const { snapshots } = await this.getSnapshots(orgId, { brandId, startDate, endDate }, 1000);

    if (snapshots.length < 2) return 100;

    const sentiments = snapshots
      .map((s) => s.avgSentiment)
      .filter((s): s is number => s !== null && s !== undefined);

    if (sentiments.length < 2) return 100;

    const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
    const variance =
      sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / sentiments.length;
    const stdDev = Math.sqrt(variance);

    // Convert stdDev to stability score (lower variance = higher stability)
    return Math.max(0, 100 - stdDev * 100);
  }

  /**
   * Detect anomaly using z-score
   */
  private async detectAnomaly(
    orgId: string,
    metric: string,
    currentValue: number,
    brandId?: string,
    campaignId?: string,
    thresholdSigma = 2.0
  ): Promise<AnomalyDetection> {
    const stats = await this.getHistoricalStats(orgId, metric, brandId, campaignId);

    if (stats.count < 3 || stats.stdDev === 0) {
      return { hasAnomaly: false, magnitude: 0, zScore: 0 };
    }

    const zScore = (currentValue - stats.avg) / stats.stdDev;
    const hasAnomaly = Math.abs(zScore) > thresholdSigma;

    let anomalyType: AnomalyType | undefined;
    if (hasAnomaly) {
      anomalyType = zScore > 0 ? AnomalyType.SPIKE : AnomalyType.DROP;
    }

    return {
      hasAnomaly,
      anomalyType,
      magnitude: Math.abs(zScore),
      zScore,
    };
  }

  /**
   * ============================================================================
   * HELPER METHODS
   * ============================================================================
   */

  /**
   * Get historical statistics for a metric
   */
  private async getHistoricalStats(
    orgId: string,
    _metric: string,
    brandId?: string,
    campaignId?: string,
    windowDays = 30
  ): Promise<{ avg: number; stdDev: number; count: number }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const { snapshots } = await this.getSnapshots(
      orgId,
      { brandId, campaignId, startDate, endDate },
      1000
    );

    if (snapshots.length === 0) {
      return { avg: 0, stdDev: 0, count: 0 };
    }

    const values = snapshots.map((s) => s.mentionCount);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { avg, stdDev, count: values.length };
  }

  /**
   * Get top performers by dimension
   */
  private async getTopPerformers(
    orgId: string,
    dimensionType: string,
    startDate: Date,
    endDate: Date,
    limit = 5
  ): Promise<TopPerformer[]> {
    const { dimensions } = await this.getDimensions(
      orgId,
      {
        dimensionType: dimensionType as DimensionType,
        startDate,
        endDate,
      },
      limit
    );

    return dimensions
      .sort((a, b) => b.totalMentions - a.totalMentions)
      .slice(0, limit)
      .map((d) => ({
        id: d.id,
        name: d.dimensionValue,
        value: d.totalMentions,
        metric: 'mentions',
      }));
  }

  /**
   * Build insight prompt for LLM
   */
  private buildInsightPrompt(snapshot: MediaPerformanceSnapshot, category: InsightCategory): string {
    return `
Analyze the following media performance snapshot and generate a ${category} insight:

Period: ${snapshot.snapshotAt}
Mentions: ${snapshot.mentionCount}
Sentiment: ${snapshot.avgSentiment?.toFixed(2) || 'N/A'}
Visibility Score: ${snapshot.visibilityScore?.toFixed(0) || 'N/A'}
EVI Score: ${snapshot.eviScore?.toFixed(0) || 'N/A'}
Coverage Velocity: ${snapshot.coverageVelocity?.toFixed(2) || 'N/A'} mentions/day
Has Anomaly: ${snapshot.hasAnomaly}
${snapshot.hasAnomaly ? `Anomaly Type: ${snapshot.anomalyType}, Magnitude: ${snapshot.anomalyMagnitude?.toFixed(2)}` : ''}

Generate:
- Title: Short, actionable title
- Summary: 2-3 sentences explaining what happened
- Recommendation: Specific next steps
- Impact Score: 0-100 based on significance
    `.trim();
  }

  /**
   * Default tier distribution
   */
  private defaultTierDistribution(): TierDistribution {
    return { tier1: 0, tier2: 0, tier3: 0, tier4: 0, unknown: 0 };
  }

  /**
   * Map database row to domain model
   */
  private mapSnapshotFromDb(row: any): MediaPerformanceSnapshot {
    return {
      id: row.id,
      orgId: row.org_id,
      snapshotAt: new Date(row.snapshot_at),
      aggregationPeriod: row.aggregation_period,
      brandId: row.brand_id,
      campaignId: row.campaign_id,
      journalistId: row.journalist_id,
      outletTier: row.outlet_tier,
      topicCluster: row.topic_cluster,
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
      engagementScore: row.engagement_score,
      pitchSuccessRate: row.pitch_success_rate,
      deliverabilityRate: row.deliverability_rate,
      coverageVelocity: row.coverage_velocity,
      momentumScore: row.momentum_score,
      eviScore: row.evi_score,
      eviComponents: row.evi_components,
      journalistImpactScore: row.journalist_impact_score,
      topJournalists: row.top_journalists,
      tierDistribution: row.tier_distribution,
      topKeywords: row.top_keywords,
      topicClusters: row.topic_clusters,
      entitiesMentioned: row.entities_mentioned,
      hasAnomaly: row.has_anomaly,
      anomalyType: row.anomaly_type,
      anomalyMagnitude: row.anomaly_magnitude,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapDimensionFromDb(row: any): MediaPerformanceDimension {
    return {
      id: row.id,
      orgId: row.org_id,
      dimensionType: row.dimension_type,
      dimensionValue: row.dimension_value,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      totalMentions: row.total_mentions,
      uniqueJournalists: row.unique_journalists,
      uniqueOutlets: row.unique_outlets,
      avgSentiment: row.avg_sentiment,
      totalReach: row.total_reach,
      avgVisibilityScore: row.avg_visibility_score,
      avgEngagementScore: row.avg_engagement_score,
      rollupData: row.rollup_data,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapScoreFromDb(row: any): MediaPerformanceScore {
    return {
      id: row.id,
      orgId: row.org_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      scoreType: row.score_type,
      scoreValue: row.score_value,
      scoreComponents: row.score_components,
      calculatedAt: new Date(row.calculated_at),
      windowStartDate: new Date(row.window_start_date),
      windowEndDate: new Date(row.window_end_date),
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapInsightFromDb(row: any): MediaPerformanceInsight {
    return {
      id: row.id,
      orgId: row.org_id,
      category: row.category,
      title: row.title,
      summary: row.summary,
      recommendation: row.recommendation,
      generatedByLlm: row.generated_by_llm,
      llmModel: row.llm_model,
      llmPromptVersion: row.llm_prompt_version,
      relatedEntityType: row.related_entity_type,
      relatedEntityId: row.related_entity_id,
      timeWindowStart: row.time_window_start ? new Date(row.time_window_start) : undefined,
      timeWindowEnd: row.time_window_end ? new Date(row.time_window_end) : undefined,
      impactScore: row.impact_score,
      confidenceScore: row.confidence_score,
      supportingData: row.supporting_data,
      isRead: row.is_read,
      isDismissed: row.is_dismissed,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
