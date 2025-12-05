/**
 * Brand Reputation Intelligence Service (Sprint S56)
 *
 * Service for computing brand reputation scores, aggregating signals
 * from multiple source systems, and providing executive radar data.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BrandReputationSnapshot,
  BrandReputationEvent,
  BrandReputationConfig,
  BrandReputationAlert,
  ReputationDriver,
  CompetitorReputationComparison,
  ReputationTrendPoint,
  ExecutiveRadarSummary,
  ComponentScore,
  GetReputationDashboardResponse,
  GetReputationTrendResponse,
  RecalculateReputationResponse,
  UpdateReputationConfigRequest,
  GetReputationEventsResponse,
  GetReputationAlertsResponse,
  ReputationTimeWindow,
  ReputationComponent,
  ReputationTrendDirection,
  ReputationSourceSystem,
  ReputationSignalType,
  ReputationEventSeverity,
  ScoreCalculationInput,
  ScoreCalculationOutput,
  TimeWindowBoundaries,
} from '@pravado/types';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_WEIGHTS = {
  sentiment: 25,
  coverage: 20,
  crisisImpact: 25,
  competitivePosition: 15,
  engagement: 15,
};

const DEFAULT_BASELINE_SCORE = 70;

const TIME_WINDOW_HOURS: Record<ReputationTimeWindow, number> = {
  '24h': 24,
  '7d': 168,
  '30d': 720,
  '90d': 2160,
  all: 8760, // 1 year
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class BrandReputationService {
  constructor(private supabase: SupabaseClient) {}

  // ==========================================================================
  // DASHBOARD & SNAPSHOT METHODS
  // ==========================================================================

  /**
   * Get the dashboard snapshot with executive summary
   */
  async getDashboardSnapshot(
    orgId: string,
    window: ReputationTimeWindow = '30d'
  ): Promise<GetReputationDashboardResponse> {
    // Get or create config
    const config = await this.getOrCreateConfig(orgId);

    // Get latest snapshot or calculate new one
    let snapshot = await this.getLatestSnapshot(orgId);
    const windowBoundaries = this.getWindowBoundaries(window);

    // Check if we need a fresh calculation
    const needsRecalculation =
      !snapshot ||
      new Date(snapshot.windowEnd) < windowBoundaries.start ||
      (config.autoRecalculate &&
        snapshot.calculationCompletedAt &&
        Date.now() - new Date(snapshot.calculationCompletedAt).getTime() >
          config.recalculateIntervalHours * 60 * 60 * 1000);

    if (needsRecalculation) {
      const result = await this.calculateSnapshotForWindow(
        orgId,
        windowBoundaries.start,
        windowBoundaries.end
      );
      snapshot = result;
    }

    // Build executive summary
    const executiveSummary = await this.buildExecutiveRadarSummary(orgId, window, snapshot!);

    return {
      snapshot: snapshot!,
      executiveSummary,
      config,
      hasData: !!snapshot,
      lastCalculatedAt: snapshot?.calculationCompletedAt,
    };
  }

  /**
   * Get the latest snapshot for an org
   */
  async getLatestSnapshot(orgId: string): Promise<BrandReputationSnapshot | null> {
    const { data, error } = await this.supabase
      .from('brand_reputation_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get latest snapshot: ${error.message}`);
    }

    return data ? this.mapSnapshotFromDb(data) : null;
  }

  /**
   * Get a specific snapshot by ID
   */
  async getSnapshotById(orgId: string, snapshotId: string): Promise<BrandReputationSnapshot | null> {
    const { data, error } = await this.supabase
      .from('brand_reputation_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', snapshotId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get snapshot: ${error.message}`);
    }

    return data ? this.mapSnapshotFromDb(data) : null;
  }

  /**
   * Get a specific event by ID
   */
  async getEventById(orgId: string, eventId: string): Promise<BrandReputationEvent | null> {
    const { data, error } = await this.supabase
      .from('brand_reputation_events')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', eventId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get event: ${error.message}`);
    }

    return data ? this.mapEventFromDb(data) : null;
  }

  /**
   * Get a specific alert by ID
   */
  async getAlertById(orgId: string, alertId: string): Promise<BrandReputationAlert | null> {
    const { data, error } = await this.supabase
      .from('brand_reputation_alerts')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', alertId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get alert: ${error.message}`);
    }

    return data ? this.mapAlertFromDb(data) : null;
  }

  /**
   * Get reputation trend over time
   */
  async getTrend(
    orgId: string,
    window: ReputationTimeWindow = '30d',
    _granularity: 'hourly' | 'daily' | 'weekly' = 'daily'
  ): Promise<GetReputationTrendResponse> {
    const boundaries = this.getWindowBoundaries(window);

    // Get all snapshots in the window
    const { data: snapshots, error } = await this.supabase
      .from('brand_reputation_snapshots')
      .select('*')
      .eq('org_id', orgId)
      .gte('created_at', boundaries.start.toISOString())
      .lte('created_at', boundaries.end.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to get trend data: ${error.message}`);
    }

    // Map to trend points
    const trendPoints: ReputationTrendPoint[] = (snapshots || []).map((s) => ({
      timestamp: s.created_at,
      overallScore: parseFloat(s.overall_score),
      components: {
        sentiment: parseFloat(s.sentiment_score),
        coverage: parseFloat(s.coverage_score),
        crisisImpact: parseFloat(s.crisis_impact_score),
        competitivePosition: parseFloat(s.competitive_position_score),
        engagement: parseFloat(s.engagement_score),
      },
      events: s.events_processed,
      crisisActive: s.active_crisis_count > 0,
    }));

    // Calculate aggregate statistics
    const scores = trendPoints.map((p) => p.overallScore);
    const startScore = scores[0] || 50;
    const endScore = scores[scores.length - 1] || 50;

    return {
      trendPoints,
      overallTrend: this.determineTrend(endScore - startScore),
      startScore,
      endScore,
      highScore: scores.length ? Math.max(...scores) : 50,
      lowScore: scores.length ? Math.min(...scores) : 50,
      averageScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 50,
      volatility: this.calculateVolatility(scores),
      window,
      windowStart: boundaries.start.toISOString(),
      windowEnd: boundaries.end.toISOString(),
    };
  }

  // ==========================================================================
  // SCORING ENGINE
  // ==========================================================================

  /**
   * Calculate a reputation snapshot for a time window
   */
  async calculateSnapshotForWindow(
    orgId: string,
    windowStart: Date,
    windowEnd: Date
  ): Promise<BrandReputationSnapshot> {
    const startTime = Date.now();
    const config = await this.getOrCreateConfig(orgId);

    // Get previous snapshot for comparison
    const previousSnapshot = await this.getLatestSnapshot(orgId);

    // Collect data from source systems
    const sourceData = await this.collectSourceData(orgId, windowStart, windowEnd);

    // Calculate component scores
    const scores = this.calculateComponentScores(sourceData, config);

    // Calculate overall score
    const overallScore = this.calculateWeightedScore(scores, config);

    // Determine trend
    const previousScore = previousSnapshot?.overallScore ?? config.baselineScore ?? DEFAULT_BASELINE_SCORE;
    const scoreDelta = overallScore - previousScore;
    const trendDirection = this.determineTrend(scoreDelta);

    // Get drivers
    const drivers = await this.identifyDrivers(orgId, windowStart, windowEnd, sourceData);

    // Get competitor comparison
    const competitorComparison = await this.getCompetitorComparison(orgId, config, overallScore);

    // Build executive summary
    const executiveSummary = this.generateExecutiveSummary(
      overallScore,
      trendDirection,
      drivers,
      sourceData
    );

    // Create snapshot
    const snapshot: Omit<BrandReputationSnapshot, 'id'> = {
      orgId,
      createdAt: new Date().toISOString(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      overallScore,
      previousScore,
      scoreDelta,
      trendDirection,
      sentimentScore: scores.sentiment,
      coverageScore: scores.coverage,
      crisisImpactScore: scores.crisisImpact,
      competitivePositionScore: scores.competitivePosition,
      engagementScore: scores.engagement,
      totalMentions: sourceData.totalMentions,
      positiveMentions: sourceData.positiveMentions,
      negativeMentions: sourceData.negativeMentions,
      neutralMentions: sourceData.neutralMentions,
      activeCrisisCount: sourceData.activeCrises,
      resolvedCrisisCount: sourceData.recentCrisisResolutions,
      crisisSeverityAvg: sourceData.crisisSeveritySum / Math.max(sourceData.activeCrises, 1),
      totalOutreachSent: sourceData.outreachSent,
      outreachResponseRate:
        sourceData.outreachSent > 0
          ? (sourceData.outreachResponses / sourceData.outreachSent) * 100
          : undefined,
      journalistEngagementCount: sourceData.journalistMeetings,
      competitiveRank: competitorComparison[0]?.rank,
      competitorsTracked: competitorComparison.length,
      topPositiveDrivers: drivers.filter((d) => d.type === 'positive').slice(0, 5),
      topNegativeDrivers: drivers.filter((d) => d.type === 'negative').slice(0, 5),
      competitorComparison,
      executiveSummary,
      keyRisks: this.identifyRisks(sourceData, scores),
      keyOpportunities: this.identifyOpportunities(sourceData, scores),
      metadata: {},
      calculationStartedAt: new Date(startTime).toISOString(),
      calculationCompletedAt: new Date().toISOString(),
      eventsProcessed: sourceData.eventCount,
    };

    // Save snapshot
    const { data, error } = await this.supabase
      .from('brand_reputation_snapshots')
      .insert(this.mapSnapshotToDb(snapshot))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save snapshot: ${error.message}`);
    }

    // Check for alerts
    await this.checkAndCreateAlerts(orgId, overallScore, previousScore, config, data.id);

    return this.mapSnapshotFromDb(data);
  }

  /**
   * Collect data from all source systems
   */
  private async collectSourceData(
    orgId: string,
    windowStart: Date,
    windowEnd: Date
  ): Promise<ScoreCalculationInput & { eventCount: number }> {
    // Initialize with defaults
    const data: ScoreCalculationInput & { eventCount: number } = {
      positiveMentions: 0,
      negativeMentions: 0,
      neutralMentions: 0,
      averageSentiment: 0,
      totalMentions: 0,
      tier1Mentions: 0,
      tier2Mentions: 0,
      tier3Mentions: 0,
      mentionVelocity: 0,
      activeCrises: 0,
      criticalCrises: 0,
      crisisSeveritySum: 0,
      recentCrisisResolutions: 0,
      competitorAvgScore: 50,
      competitorCount: 0,
      rankAmongCompetitors: 1,
      outreachSent: 0,
      outreachResponses: 0,
      journalistMeetings: 0,
      mediaHits: 0,
      eventCount: 0,
    };

    // Try to get media monitoring data (S40)
    try {
      const { data: mentions, error } = await this.supabase
        .from('media_mentions')
        .select('sentiment_score, outlet_tier')
        .eq('org_id', orgId)
        .gte('published_at', windowStart.toISOString())
        .lte('published_at', windowEnd.toISOString());

      if (!error && mentions) {
        data.totalMentions = mentions.length;
        mentions.forEach((m) => {
          const sentiment = m.sentiment_score || 0;
          if (sentiment > 0.2) data.positiveMentions++;
          else if (sentiment < -0.2) data.negativeMentions++;
          else data.neutralMentions++;

          if (m.outlet_tier === 1) data.tier1Mentions++;
          else if (m.outlet_tier === 2) data.tier2Mentions++;
          else data.tier3Mentions++;

          data.averageSentiment += sentiment;
        });
        data.averageSentiment = mentions.length ? data.averageSentiment / mentions.length : 0;

        const daysInWindow =
          (windowEnd.getTime() - windowStart.getTime()) / (1000 * 60 * 60 * 24);
        data.mentionVelocity = mentions.length / Math.max(daysInWindow, 1);
      }
    } catch (err) {
      console.error('Error fetching media mentions:', err);
    }

    // Try to get crisis data (S55)
    try {
      const { data: crises, error } = await this.supabase
        .from('crisis_incidents')
        .select('status, severity')
        .eq('org_id', orgId)
        .or(
          `status.eq.active,and(status.eq.resolved,resolved_at.gte.${windowStart.toISOString()})`
        );

      if (!error && crises) {
        crises.forEach((c) => {
          if (c.status === 'active') {
            data.activeCrises++;
            if (c.severity === 'critical' || c.severity === 'severe') {
              data.criticalCrises++;
            }
            // Map severity to numeric value
            const severityMap: Record<string, number> = {
              low: 1,
              medium: 2,
              high: 3,
              critical: 4,
              severe: 5,
            };
            data.crisisSeveritySum += severityMap[c.severity] || 2;
          } else if (c.status === 'resolved') {
            data.recentCrisisResolutions++;
          }
        });
      }
    } catch (err) {
      console.error('Error fetching crisis data:', err);
    }

    // Try to get outreach data (S44)
    try {
      const { data: outreach, error } = await this.supabase
        .from('pr_outreach_campaigns')
        .select('emails_sent, emails_opened, emails_replied')
        .eq('org_id', orgId)
        .gte('created_at', windowStart.toISOString())
        .lte('created_at', windowEnd.toISOString());

      if (!error && outreach) {
        outreach.forEach((o) => {
          data.outreachSent += o.emails_sent || 0;
          data.outreachResponses += o.emails_replied || 0;
        });
      }
    } catch (err) {
      console.error('Error fetching outreach data:', err);
    }

    // Try to get competitive intelligence data (S53)
    try {
      const { data: competitors, error } = await this.supabase
        .from('competitor_profiles')
        .select('reputation_score')
        .eq('org_id', orgId);

      if (!error && competitors) {
        data.competitorCount = competitors.length;
        if (competitors.length > 0) {
          const avgScore =
            competitors.reduce((sum, c) => sum + (c.reputation_score || 50), 0) /
            competitors.length;
          data.competitorAvgScore = avgScore;
        }
      }
    } catch (err) {
      console.error('Error fetching competitor data:', err);
    }

    // Count reputation events in window
    try {
      const { count, error } = await this.supabase
        .from('brand_reputation_events')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('event_timestamp', windowStart.toISOString())
        .lte('event_timestamp', windowEnd.toISOString());

      if (!error) {
        data.eventCount = count || 0;
      }
    } catch (err) {
      console.error('Error counting reputation events:', err);
    }

    return data;
  }

  /**
   * Calculate component scores from source data
   */
  private calculateComponentScores(
    data: ScoreCalculationInput,
    _config: BrandReputationConfig
  ): ScoreCalculationOutput['components'] {
    // Sentiment score (0-100)
    // Based on ratio of positive to negative mentions and average sentiment
    let sentimentScore = 50;
    if (data.totalMentions > 0) {
      const positiveRatio = data.positiveMentions / data.totalMentions;
      const negativeRatio = data.negativeMentions / data.totalMentions;
      // Convert sentiment (-1 to 1) to (0 to 100)
      const sentimentComponent = (data.averageSentiment + 1) * 50;
      // Combine ratios and sentiment
      sentimentScore = Math.min(
        100,
        Math.max(0, sentimentComponent * 0.5 + (positiveRatio - negativeRatio) * 100 * 0.5 + 50)
      );
    }

    // Coverage score (0-100)
    // Based on volume and tier of coverage
    const baselineMentions = 10; // Expected mentions per period
    const volumeScore = Math.min(100, (data.totalMentions / baselineMentions) * 50);
    const tierScore =
      data.tier1Mentions * 3 + data.tier2Mentions * 2 + data.tier3Mentions > 0
        ? Math.min(
            100,
            ((data.tier1Mentions * 3 + data.tier2Mentions * 2 + data.tier3Mentions) /
              data.totalMentions) *
              50
          )
        : 50;
    const coverageScore = volumeScore * 0.6 + tierScore * 0.4;

    // Crisis impact score (0-100)
    // Higher score = less crisis impact (good)
    let crisisImpactScore = 100;
    if (data.activeCrises > 0) {
      const severityPenalty = data.crisisSeveritySum * 5;
      const criticalPenalty = data.criticalCrises * 15;
      crisisImpactScore = Math.max(0, 100 - severityPenalty - criticalPenalty);
    }
    // Boost for resolved crises
    crisisImpactScore = Math.min(100, crisisImpactScore + data.recentCrisisResolutions * 2);

    // Competitive position score (0-100)
    // Based on how we compare to competitors
    let competitivePositionScore = 50;
    if (data.competitorCount > 0) {
      // If we're above average, score higher
      const ourScore = sentimentScore * 0.4 + coverageScore * 0.3 + crisisImpactScore * 0.3;
      competitivePositionScore = Math.min(
        100,
        Math.max(0, 50 + (ourScore - data.competitorAvgScore))
      );
    }

    // Engagement score (0-100)
    // Based on outreach success and journalist engagement
    let engagementScore = 50;
    if (data.outreachSent > 0) {
      const responseRate = data.outreachResponses / data.outreachSent;
      engagementScore = Math.min(100, responseRate * 200 + 30); // 30% base, up to 100 at 35% response rate
    }
    engagementScore = Math.min(100, engagementScore + data.journalistMeetings * 5);
    engagementScore = Math.min(100, engagementScore + data.mediaHits * 3);

    return {
      sentiment: Math.round(sentimentScore * 100) / 100,
      coverage: Math.round(coverageScore * 100) / 100,
      crisisImpact: Math.round(crisisImpactScore * 100) / 100,
      competitivePosition: Math.round(competitivePositionScore * 100) / 100,
      engagement: Math.round(engagementScore * 100) / 100,
    };
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(
    components: ScoreCalculationOutput['components'],
    config: BrandReputationConfig
  ): number {
    const totalWeight =
      config.weightSentiment +
      config.weightCoverage +
      config.weightCrisis +
      config.weightCompetitive +
      config.weightEngagement;

    const weightedSum =
      components.sentiment * config.weightSentiment +
      components.coverage * config.weightCoverage +
      components.crisisImpact * config.weightCrisis +
      components.competitivePosition * config.weightCompetitive +
      components.engagement * config.weightEngagement;

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  /**
   * Identify reputation drivers
   */
  private async identifyDrivers(
    orgId: string,
    windowStart: Date,
    windowEnd: Date,
    sourceData: ScoreCalculationInput
  ): Promise<ReputationDriver[]> {
    const drivers: ReputationDriver[] = [];

    // Get recent reputation events
    const { data: events, error } = await this.supabase
      .from('brand_reputation_events')
      .select('*')
      .eq('org_id', orgId)
      .gte('event_timestamp', windowStart.toISOString())
      .lte('event_timestamp', windowEnd.toISOString())
      .order('delta', { ascending: false })
      .limit(20);

    if (!error && events) {
      events.forEach((e) => {
        drivers.push({
          id: e.id,
          type: e.delta >= 0 ? 'positive' : 'negative',
          title: e.title,
          description: e.description || '',
          impact: e.delta,
          impactPercentage: Math.abs(e.delta),
          component: e.affected_component as ReputationComponent,
          sourceSystem: e.source_system as ReputationSourceSystem,
          sourceEntityType: e.source_entity_type,
          sourceEntityId: e.source_entity_id,
          occurredAt: e.event_timestamp,
          metadata: e.context,
        });
      });
    }

    // Add inferred drivers from source data
    if (sourceData.positiveMentions > sourceData.negativeMentions * 2) {
      drivers.push({
        id: `inferred-positive-sentiment-${Date.now()}`,
        type: 'positive',
        title: 'Strong positive media sentiment',
        description: `${sourceData.positiveMentions} positive mentions vs ${sourceData.negativeMentions} negative`,
        impact: 5,
        impactPercentage: 5,
        component: 'sentiment',
        sourceSystem: 'media_monitoring',
        occurredAt: new Date().toISOString(),
      });
    }

    if (sourceData.activeCrises > 0) {
      drivers.push({
        id: `inferred-crisis-${Date.now()}`,
        type: 'negative',
        title: `${sourceData.activeCrises} active crisis incident(s)`,
        description: `${sourceData.criticalCrises} critical, impacting reputation`,
        impact: -10 * sourceData.criticalCrises - 5 * (sourceData.activeCrises - sourceData.criticalCrises),
        impactPercentage: 15,
        component: 'crisis_impact',
        sourceSystem: 'crisis_incident',
        occurredAt: new Date().toISOString(),
      });
    }

    // Sort by absolute impact
    return drivers.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  }

  /**
   * Get competitor comparison data
   */
  private async getCompetitorComparison(
    orgId: string,
    config: BrandReputationConfig,
    brandScore: number
  ): Promise<CompetitorReputationComparison[]> {
    const comparisons: CompetitorReputationComparison[] = [];

    try {
      const { data: competitors, error } = await this.supabase
        .from('competitor_profiles')
        .select('id, name, reputation_score')
        .eq('org_id', orgId)
        .in('id', config.trackedCompetitorIds.length > 0 ? config.trackedCompetitorIds : ['none']);

      if (!error && competitors) {
        // Sort by score to get rankings
        const sorted = [...competitors].sort(
          (a, b) => (b.reputation_score || 50) - (a.reputation_score || 50)
        );

        // Find brand's rank
        const allScores = [...sorted.map((c) => c.reputation_score || 50), brandScore].sort(
          (a, b) => b - a
        );
        const brandRank = allScores.indexOf(brandScore) + 1;

        competitors.forEach((c) => {
          const compScore = c.reputation_score || 50;

          comparisons.push({
            competitorId: c.id,
            competitorName: c.name,
            competitorScore: compScore,
            competitorTrend: 'flat',
            brandScore,
            scoreDelta: brandScore - compScore,
            rank: brandRank,
            rankChange: 0,
            strengths: brandScore > compScore ? ['Overall reputation'] : [],
            weaknesses: brandScore < compScore ? ['Overall reputation'] : [],
            componentComparison: [],
          });
        });
      }
    } catch (err) {
      console.error('Error fetching competitor comparison:', err);
    }

    return comparisons;
  }

  // ==========================================================================
  // EXECUTIVE RADAR
  // ==========================================================================

  /**
   * Build executive radar summary
   */
  async buildExecutiveRadarSummary(
    orgId: string,
    window: ReputationTimeWindow,
    snapshot: BrandReputationSnapshot
  ): Promise<ExecutiveRadarSummary> {
    const config = await this.getOrCreateConfig(orgId);

    // Get component scores with details
    const componentScores = this.buildComponentScores(snapshot, config);

    // Find strongest and weakest
    const sortedComponents = [...componentScores].sort((a, b) => b.score - a.score);
    const strongestComponent = sortedComponents[0].component;
    const weakestComponent = sortedComponents[sortedComponents.length - 1].component;

    // Get recent events
    const boundaries = this.getWindowBoundaries(window);
    const { data: recentEvents } = await this.supabase
      .from('brand_reputation_events')
      .select('*')
      .eq('org_id', orgId)
      .gte('event_timestamp', boundaries.start.toISOString())
      .order('event_timestamp', { ascending: false })
      .limit(10);

    // Get active alerts
    const { data: alerts } = await this.supabase
      .from('brand_reputation_alerts')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get trend data
    const trendData = await this.getTrend(orgId, window);

    // Calculate crisis impact on score
    let crisisImpactOnScore = 0;
    if (snapshot.activeCrisisCount > 0) {
      crisisImpactOnScore = Math.max(
        0,
        100 - snapshot.crisisImpactScore
      );
    }

    return {
      currentScore: snapshot.overallScore,
      previousScore: snapshot.previousScore ?? config.baselineScore ?? DEFAULT_BASELINE_SCORE,
      scoreDelta: snapshot.scoreDelta ?? 0,
      trendDirection: snapshot.trendDirection,
      scoreBreakdown: {
        overall: snapshot.overallScore,
        sentiment: snapshot.sentimentScore,
        coverage: snapshot.coverageScore,
        crisisImpact: snapshot.crisisImpactScore,
        competitivePosition: snapshot.competitivePositionScore,
        engagement: snapshot.engagementScore,
      },
      componentScores,
      strongestComponent,
      weakestComponent,
      topPositiveDrivers: snapshot.topPositiveDrivers,
      topNegativeDrivers: snapshot.topNegativeDrivers,
      recentEvents: (recentEvents || []).map((e) => this.mapEventFromDb(e)),
      competitorComparison: snapshot.competitorComparison,
      competitiveRank: snapshot.competitiveRank || 1,
      competitorCount: snapshot.competitorsTracked,
      activeCrises: snapshot.activeCrisisCount,
      crisisImpactOnScore,
      crisisNotes:
        snapshot.activeCrisisCount > 0
          ? `${snapshot.activeCrisisCount} active incident(s) affecting reputation`
          : undefined,
      trendPoints: trendData.trendPoints,
      summary: snapshot.executiveSummary || this.generateDefaultSummary(snapshot),
      keyRisks: snapshot.keyRisks,
      keyOpportunities: snapshot.keyOpportunities,
      recommendedActions: this.generateRecommendedActions(snapshot),
      activeAlerts: (alerts || []).map((a) => this.mapAlertFromDb(a)),
      alertCount: alerts?.length || 0,
      calculatedAt: snapshot.calculationCompletedAt || snapshot.createdAt,
      windowStart: snapshot.windowStart,
      windowEnd: snapshot.windowEnd,
      timeWindow: window,
    };
  }

  /**
   * Build component scores with factors
   */
  private buildComponentScores(
    snapshot: BrandReputationSnapshot,
    config: BrandReputationConfig
  ): ComponentScore[] {
    const components: ReputationComponent[] = [
      'sentiment',
      'coverage',
      'crisis_impact',
      'competitive_position',
      'engagement',
    ];

    const scoreMap: Record<ReputationComponent, number> = {
      sentiment: snapshot.sentimentScore,
      coverage: snapshot.coverageScore,
      crisis_impact: snapshot.crisisImpactScore,
      competitive_position: snapshot.competitivePositionScore,
      engagement: snapshot.engagementScore,
    };

    const weightMap: Record<ReputationComponent, number> = {
      sentiment: config.weightSentiment,
      coverage: config.weightCoverage,
      crisis_impact: config.weightCrisis,
      competitive_position: config.weightCompetitive,
      engagement: config.weightEngagement,
    };

    const totalWeight = Object.values(weightMap).reduce((a, b) => a + b, 0);

    return components.map((component) => ({
      component,
      score: scoreMap[component],
      weight: weightMap[component],
      contribution: (scoreMap[component] * weightMap[component]) / totalWeight,
      trend: 'flat' as ReputationTrendDirection,
      factors: [],
    }));
  }

  /**
   * Generate executive summary text
   */
  private generateExecutiveSummary(
    score: number,
    trend: ReputationTrendDirection,
    drivers: ReputationDriver[],
    data: ScoreCalculationInput
  ): string {
    const trendText = trend === 'up' ? 'improving' : trend === 'down' ? 'declining' : 'stable';
    const scoreLevel =
      score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : 'concerning';

    let summary = `Brand reputation is ${scoreLevel} at ${score.toFixed(1)} and ${trendText}. `;

    if (data.activeCrises > 0) {
      summary += `${data.activeCrises} active crisis incident(s) require attention. `;
    }

    const topPositive = drivers.find((d) => d.type === 'positive');
    const topNegative = drivers.find((d) => d.type === 'negative');

    if (topPositive) {
      summary += `Key strength: ${topPositive.title}. `;
    }
    if (topNegative) {
      summary += `Key concern: ${topNegative.title}. `;
    }

    return summary;
  }

  /**
   * Generate default summary when no custom one exists
   */
  private generateDefaultSummary(snapshot: BrandReputationSnapshot): string {
    const level =
      snapshot.overallScore >= 80
        ? 'strong'
        : snapshot.overallScore >= 60
          ? 'healthy'
          : snapshot.overallScore >= 40
            ? 'moderate'
            : 'at risk';

    return `Brand reputation is ${level} with an overall score of ${snapshot.overallScore.toFixed(1)}. ${snapshot.totalMentions} media mentions tracked in this period.`;
  }

  /**
   * Identify key risks
   */
  private identifyRisks(
    data: ScoreCalculationInput,
    scores: ScoreCalculationOutput['components']
  ): string[] {
    const risks: string[] = [];

    if (data.activeCrises > 0) {
      risks.push(`${data.activeCrises} active crisis incident(s) affecting reputation`);
    }
    if (data.criticalCrises > 0) {
      risks.push(`${data.criticalCrises} critical severity crisis requiring immediate attention`);
    }
    if (scores.sentiment < 40) {
      risks.push('Negative media sentiment trend');
    }
    if (data.negativeMentions > data.positiveMentions) {
      risks.push('More negative than positive media coverage');
    }
    if (scores.competitivePosition < 40) {
      risks.push('Falling behind competitors in reputation');
    }

    return risks;
  }

  /**
   * Identify key opportunities
   */
  private identifyOpportunities(
    data: ScoreCalculationInput,
    scores: ScoreCalculationOutput['components']
  ): string[] {
    const opportunities: string[] = [];

    if (data.tier1Mentions > 0) {
      opportunities.push(`${data.tier1Mentions} tier-1 media placements`);
    }
    if (data.recentCrisisResolutions > 0) {
      opportunities.push(
        `${data.recentCrisisResolutions} crisis successfully resolved - potential recovery narrative`
      );
    }
    if (scores.sentiment > 70) {
      opportunities.push('Strong positive sentiment - leverage for thought leadership');
    }
    if (data.outreachResponses > 0) {
      opportunities.push(
        `${data.outreachResponses} journalist responses - nurture these relationships`
      );
    }
    if (scores.engagement > 70) {
      opportunities.push('High engagement rates - expand outreach program');
    }

    return opportunities;
  }

  /**
   * Generate recommended actions
   */
  private generateRecommendedActions(snapshot: BrandReputationSnapshot): string[] {
    const actions: string[] = [];

    if (snapshot.activeCrisisCount > 0) {
      actions.push('Address active crisis incidents with coordinated response');
    }
    if (snapshot.sentimentScore < 50) {
      actions.push('Implement positive narrative campaign to improve sentiment');
    }
    if (snapshot.coverageScore < 50) {
      actions.push('Increase media outreach to improve coverage volume');
    }
    if (snapshot.engagementScore < 50) {
      actions.push('Enhance journalist relationship building efforts');
    }
    if (snapshot.competitivePositionScore < 50) {
      actions.push('Analyze competitor strategies and differentiate positioning');
    }

    return actions;
  }

  // ==========================================================================
  // CONFIG MANAGEMENT
  // ==========================================================================

  /**
   * Get config for an org
   */
  async getConfig(orgId: string): Promise<BrandReputationConfig | null> {
    const { data, error } = await this.supabase
      .from('brand_reputation_config')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get config: ${error.message}`);
    }

    return data ? this.mapConfigFromDb(data) : null;
  }

  /**
   * Get or create config for an org
   */
  async getOrCreateConfig(orgId: string): Promise<BrandReputationConfig> {
    let config = await this.getConfig(orgId);

    if (!config) {
      const { data, error } = await this.supabase
        .from('brand_reputation_config')
        .insert({
          org_id: orgId,
          weight_sentiment: DEFAULT_WEIGHTS.sentiment,
          weight_coverage: DEFAULT_WEIGHTS.coverage,
          weight_crisis: DEFAULT_WEIGHTS.crisisImpact,
          weight_competitive: DEFAULT_WEIGHTS.competitivePosition,
          weight_engagement: DEFAULT_WEIGHTS.engagement,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create config: ${error.message}`);
      }

      config = this.mapConfigFromDb(data);
    }

    return config;
  }

  /**
   * Update config for an org
   */
  async updateConfig(
    orgId: string,
    input: UpdateReputationConfigRequest,
    userId?: string
  ): Promise<BrandReputationConfig> {
    const updates: Record<string, unknown> = {};

    if (input.weightSentiment !== undefined) updates.weight_sentiment = input.weightSentiment;
    if (input.weightCoverage !== undefined) updates.weight_coverage = input.weightCoverage;
    if (input.weightCrisis !== undefined) updates.weight_crisis = input.weightCrisis;
    if (input.weightCompetitive !== undefined) updates.weight_competitive = input.weightCompetitive;
    if (input.weightEngagement !== undefined) updates.weight_engagement = input.weightEngagement;
    if (input.thresholdAlertScoreDrop !== undefined)
      updates.threshold_alert_score_drop = input.thresholdAlertScoreDrop;
    if (input.thresholdCriticalScore !== undefined)
      updates.threshold_critical_score = input.thresholdCriticalScore;
    if (input.thresholdWarningScore !== undefined)
      updates.threshold_warning_score = input.thresholdWarningScore;
    if (input.baselineScore !== undefined) updates.baseline_score = input.baselineScore;
    if (input.defaultTimeWindow !== undefined)
      updates.default_time_window = input.defaultTimeWindow;
    if (input.autoRecalculate !== undefined) updates.auto_recalculate = input.autoRecalculate;
    if (input.recalculateIntervalHours !== undefined)
      updates.recalculate_interval_hours = input.recalculateIntervalHours;
    if (input.trackedCompetitorIds !== undefined)
      updates.tracked_competitor_ids = input.trackedCompetitorIds;
    if (input.enableScoreAlerts !== undefined)
      updates.enable_score_alerts = input.enableScoreAlerts;
    if (input.alertRecipients !== undefined) updates.alert_recipients = input.alertRecipients;
    if (input.settings !== undefined) updates.settings = input.settings;
    if (userId) updates.updated_by = userId;

    const { data, error } = await this.supabase
      .from('brand_reputation_config')
      .update(updates)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update config: ${error.message}`);
    }

    return this.mapConfigFromDb(data);
  }

  // ==========================================================================
  // RECALCULATION
  // ==========================================================================

  /**
   * Recalculate reputation for a time window
   */
  async recalculate(
    orgId: string,
    window: ReputationTimeWindow = '30d'
  ): Promise<RecalculateReputationResponse> {
    const startTime = Date.now();
    const boundaries = this.getWindowBoundaries(window);

    // Get previous snapshot
    const previousSnapshot = await this.getLatestSnapshot(orgId);
    const previousScore = previousSnapshot?.overallScore;

    // Calculate new snapshot
    const snapshot = await this.calculateSnapshotForWindow(
      orgId,
      boundaries.start,
      boundaries.end
    );

    return {
      snapshot,
      eventsProcessed: snapshot.eventsProcessed,
      calculationTimeMs: Date.now() - startTime,
      previousScore,
      newScore: snapshot.overallScore,
      scoreDelta: previousScore ? snapshot.overallScore - previousScore : undefined,
    };
  }

  // ==========================================================================
  // EVENTS
  // ==========================================================================

  /**
   * Record a reputation event
   */
  async recordEvent(
    orgId: string,
    event: {
      sourceSystem: ReputationSourceSystem;
      signalType: ReputationSignalType;
      delta: number;
      affectedComponent: ReputationComponent;
      severity: ReputationEventSeverity;
      title: string;
      description?: string;
      sourceEntityType?: string;
      sourceEntityId?: string;
      context?: Record<string, unknown>;
    },
    userId?: string
  ): Promise<BrandReputationEvent> {
    const { data, error } = await this.supabase
      .from('brand_reputation_events')
      .insert({
        org_id: orgId,
        source_system: event.sourceSystem,
        signal_type: event.signalType,
        delta: event.delta,
        affected_component: event.affectedComponent,
        severity: event.severity,
        title: event.title,
        description: event.description,
        source_entity_type: event.sourceEntityType,
        source_entity_id: event.sourceEntityId,
        context: event.context || {},
        created_by: userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to record event: ${error.message}`);
    }

    return this.mapEventFromDb(data);
  }

  /**
   * Get reputation events
   */
  async getEvents(
    orgId: string,
    filters: {
      window?: ReputationTimeWindow;
      sourceSystem?: ReputationSourceSystem;
      component?: ReputationComponent;
      severity?: ReputationEventSeverity;
    } = {},
    limit = 20,
    offset = 0
  ): Promise<GetReputationEventsResponse> {
    let query = this.supabase
      .from('brand_reputation_events')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.window) {
      const boundaries = this.getWindowBoundaries(filters.window);
      query = query
        .gte('event_timestamp', boundaries.start.toISOString())
        .lte('event_timestamp', boundaries.end.toISOString());
    }

    if (filters.sourceSystem) {
      query = query.eq('source_system', filters.sourceSystem);
    }

    if (filters.component) {
      query = query.eq('affected_component', filters.component);
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    const { data, error, count } = await query
      .order('event_timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get events: ${error.message}`);
    }

    return {
      events: (data || []).map((e) => this.mapEventFromDb(e)),
      total: count || 0,
      limit,
      offset,
    };
  }

  // ==========================================================================
  // ALERTS
  // ==========================================================================

  /**
   * Check and create alerts based on score changes
   */
  private async checkAndCreateAlerts(
    orgId: string,
    newScore: number,
    previousScore: number,
    config: BrandReputationConfig,
    snapshotId: string
  ): Promise<void> {
    if (!config.enableScoreAlerts) return;

    const scoreDrop = previousScore - newScore;

    // Check for significant score drop
    if (scoreDrop >= config.thresholdAlertScoreDrop) {
      await this.createAlert(orgId, {
        severity: scoreDrop >= config.thresholdAlertScoreDrop * 2 ? 'critical' : 'warning',
        title: `Reputation score dropped by ${scoreDrop.toFixed(1)} points`,
        message: `Your brand reputation score has dropped from ${previousScore.toFixed(1)} to ${newScore.toFixed(1)}.`,
        snapshotId,
        triggerType: 'score_drop',
        triggerValue: scoreDrop,
        thresholdValue: config.thresholdAlertScoreDrop,
      });
    }

    // Check for critical threshold breach
    if (newScore <= config.thresholdCriticalScore && previousScore > config.thresholdCriticalScore) {
      await this.createAlert(orgId, {
        severity: 'critical',
        title: 'Reputation score reached critical level',
        message: `Your brand reputation score (${newScore.toFixed(1)}) has fallen below the critical threshold (${config.thresholdCriticalScore}).`,
        snapshotId,
        triggerType: 'threshold_breach',
        triggerValue: newScore,
        thresholdValue: config.thresholdCriticalScore,
      });
    }
  }

  /**
   * Create a reputation alert
   */
  private async createAlert(
    orgId: string,
    alert: {
      severity: 'info' | 'warning' | 'critical';
      title: string;
      message: string;
      snapshotId?: string;
      triggerType: string;
      triggerValue?: number;
      thresholdValue?: number;
      relatedEventIds?: string[];
    }
  ): Promise<BrandReputationAlert> {
    const { data, error } = await this.supabase
      .from('brand_reputation_alerts')
      .insert({
        org_id: orgId,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        snapshot_id: alert.snapshotId,
        trigger_type: alert.triggerType,
        trigger_value: alert.triggerValue,
        threshold_value: alert.thresholdValue,
        related_event_ids: alert.relatedEventIds || [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }

    return this.mapAlertFromDb(data);
  }

  /**
   * Get reputation alerts
   */
  async getAlerts(
    orgId: string,
    filters: {
      severity?: 'info' | 'warning' | 'critical';
      isAcknowledged?: boolean;
      isResolved?: boolean;
    } = {},
    limit = 20,
    offset = 0
  ): Promise<GetReputationAlertsResponse> {
    let query = this.supabase
      .from('brand_reputation_alerts')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters.isAcknowledged !== undefined) {
      query = query.eq('is_acknowledged', filters.isAcknowledged);
    }

    if (filters.isResolved !== undefined) {
      query = query.eq('is_resolved', filters.isResolved);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to get alerts: ${error.message}`);
    }

    // Get counts
    const { count: unacknowledgedCount } = await this.supabase
      .from('brand_reputation_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_acknowledged', false);

    const { count: criticalCount } = await this.supabase
      .from('brand_reputation_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('severity', 'critical')
      .eq('is_resolved', false);

    return {
      alerts: (data || []).map((a) => this.mapAlertFromDb(a)),
      total: count || 0,
      unacknowledgedCount: unacknowledgedCount || 0,
      criticalCount: criticalCount || 0,
    };
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    orgId: string,
    alertId: string,
    userId: string,
    notes?: string
  ): Promise<BrandReputationAlert> {
    const { data, error } = await this.supabase
      .from('brand_reputation_alerts')
      .update({
        is_acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
        metadata: notes ? { acknowledgement_notes: notes } : undefined,
      })
      .eq('id', alertId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }

    return this.mapAlertFromDb(data);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    orgId: string,
    alertId: string,
    userId: string,
    resolutionNotes: string
  ): Promise<BrandReputationAlert> {
    const { data, error } = await this.supabase
      .from('brand_reputation_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: userId,
        resolution_notes: resolutionNotes,
      })
      .eq('id', alertId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }

    return this.mapAlertFromDb(data);
  }

  // ==========================================================================
  // SYSTEM HEALTH
  // ==========================================================================

  /**
   * Get system health status
   */
  async getSystemHealth(orgId: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastSnapshotAt: string | null;
    configExists: boolean;
    eventCount24h: number;
    alertCount: number;
    details: Record<string, unknown>;
  }> {
    const config = await this.getConfig(orgId);
    const latestSnapshot = await this.getLatestSnapshot(orgId);

    // Count events in last 24h
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { count: eventCount } = await this.supabase
      .from('brand_reputation_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('event_timestamp', yesterday.toISOString());

    // Count unresolved alerts
    const { count: alertCount } = await this.supabase
      .from('brand_reputation_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_resolved', false);

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!config) {
      status = 'degraded';
    }
    if (!latestSnapshot) {
      status = 'degraded';
    }
    if ((alertCount || 0) > 5) {
      status = 'degraded';
    }

    return {
      status,
      lastSnapshotAt: latestSnapshot?.createdAt || null,
      configExists: !!config,
      eventCount24h: eventCount || 0,
      alertCount: alertCount || 0,
      details: {
        hasSnapshot: !!latestSnapshot,
        hasConfig: !!config,
        snapshotAge: latestSnapshot
          ? Date.now() - new Date(latestSnapshot.createdAt).getTime()
          : null,
      },
    };
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get time window boundaries
   */
  private getWindowBoundaries(window: ReputationTimeWindow): TimeWindowBoundaries {
    const end = new Date();
    const hours = TIME_WINDOW_HOURS[window];
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);

    const labels: Record<ReputationTimeWindow, string> = {
      '24h': 'Last 24 Hours',
      '7d': 'Last 7 Days',
      '30d': 'Last 30 Days',
      '90d': 'Last 90 Days',
      all: 'All Time',
    };

    return {
      start,
      end,
      durationHours: hours,
      label: labels[window],
    };
  }

  /**
   * Determine trend direction from score delta
   */
  private determineTrend(delta: number): ReputationTrendDirection {
    if (delta >= 2) return 'up';
    if (delta <= -2) return 'down';
    return 'flat';
  }

  /**
   * Calculate volatility (standard deviation)
   */
  private calculateVolatility(scores: number[]): number {
    if (scores.length < 2) return 0;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const squaredDiffs = scores.map((s) => Math.pow(s - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length;

    return Math.sqrt(variance);
  }

  // ==========================================================================
  // DB MAPPERS
  // ==========================================================================

  private mapSnapshotFromDb(row: Record<string, unknown>): BrandReputationSnapshot {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      createdAt: row.created_at as string,
      windowStart: row.window_start as string,
      windowEnd: row.window_end as string,
      overallScore: parseFloat(row.overall_score as string),
      previousScore: row.previous_score ? parseFloat(row.previous_score as string) : undefined,
      scoreDelta: row.score_delta ? parseFloat(row.score_delta as string) : undefined,
      trendDirection: row.trend_direction as ReputationTrendDirection,
      sentimentScore: parseFloat(row.sentiment_score as string),
      coverageScore: parseFloat(row.coverage_score as string),
      crisisImpactScore: parseFloat(row.crisis_impact_score as string),
      competitivePositionScore: parseFloat(row.competitive_position_score as string),
      engagementScore: parseFloat(row.engagement_score as string),
      totalMentions: row.total_mentions as number,
      positiveMentions: row.positive_mentions as number,
      negativeMentions: row.negative_mentions as number,
      neutralMentions: row.neutral_mentions as number,
      activeCrisisCount: row.active_crisis_count as number,
      resolvedCrisisCount: row.resolved_crisis_count as number,
      crisisSeverityAvg: row.crisis_severity_avg
        ? parseFloat(row.crisis_severity_avg as string)
        : undefined,
      totalOutreachSent: row.total_outreach_sent as number,
      outreachResponseRate: row.outreach_response_rate
        ? parseFloat(row.outreach_response_rate as string)
        : undefined,
      journalistEngagementCount: row.journalist_engagement_count as number,
      competitiveRank: row.competitive_rank as number | undefined,
      competitorsTracked: row.competitors_tracked as number,
      topPositiveDrivers: row.top_positive_drivers as ReputationDriver[],
      topNegativeDrivers: row.top_negative_drivers as ReputationDriver[],
      competitorComparison: row.competitor_comparison as CompetitorReputationComparison[],
      executiveSummary: row.executive_summary as string | undefined,
      keyRisks: row.key_risks as string[],
      keyOpportunities: row.key_opportunities as string[],
      metadata: row.metadata as Record<string, unknown>,
      calculationStartedAt: row.calculation_started_at as string | undefined,
      calculationCompletedAt: row.calculation_completed_at as string | undefined,
      eventsProcessed: row.events_processed as number,
    };
  }

  private mapSnapshotToDb(
    snapshot: Omit<BrandReputationSnapshot, 'id'>
  ): Record<string, unknown> {
    return {
      org_id: snapshot.orgId,
      window_start: snapshot.windowStart,
      window_end: snapshot.windowEnd,
      overall_score: snapshot.overallScore,
      previous_score: snapshot.previousScore,
      score_delta: snapshot.scoreDelta,
      trend_direction: snapshot.trendDirection,
      sentiment_score: snapshot.sentimentScore,
      coverage_score: snapshot.coverageScore,
      crisis_impact_score: snapshot.crisisImpactScore,
      competitive_position_score: snapshot.competitivePositionScore,
      engagement_score: snapshot.engagementScore,
      total_mentions: snapshot.totalMentions,
      positive_mentions: snapshot.positiveMentions,
      negative_mentions: snapshot.negativeMentions,
      neutral_mentions: snapshot.neutralMentions,
      active_crisis_count: snapshot.activeCrisisCount,
      resolved_crisis_count: snapshot.resolvedCrisisCount,
      crisis_severity_avg: snapshot.crisisSeverityAvg,
      total_outreach_sent: snapshot.totalOutreachSent,
      outreach_response_rate: snapshot.outreachResponseRate,
      journalist_engagement_count: snapshot.journalistEngagementCount,
      competitive_rank: snapshot.competitiveRank,
      competitors_tracked: snapshot.competitorsTracked,
      top_positive_drivers: snapshot.topPositiveDrivers,
      top_negative_drivers: snapshot.topNegativeDrivers,
      competitor_comparison: snapshot.competitorComparison,
      executive_summary: snapshot.executiveSummary,
      key_risks: snapshot.keyRisks,
      key_opportunities: snapshot.keyOpportunities,
      metadata: snapshot.metadata,
      calculation_started_at: snapshot.calculationStartedAt,
      calculation_completed_at: snapshot.calculationCompletedAt,
      events_processed: snapshot.eventsProcessed,
    };
  }

  private mapEventFromDb(row: Record<string, unknown>): BrandReputationEvent {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      createdAt: row.created_at as string,
      eventTimestamp: row.event_timestamp as string,
      sourceSystem: row.source_system as ReputationSourceSystem,
      signalType: row.signal_type as ReputationSignalType,
      delta: parseFloat(row.delta as string),
      affectedComponent: row.affected_component as ReputationComponent,
      severity: row.severity as ReputationEventSeverity,
      title: row.title as string,
      description: row.description as string | undefined,
      sourceEntityType: row.source_entity_type as string | undefined,
      sourceEntityId: row.source_entity_id as string | undefined,
      context: row.context as Record<string, unknown>,
      isProcessed: row.is_processed as boolean,
      processedAt: row.processed_at as string | undefined,
      processedSnapshotId: row.processed_snapshot_id as string | undefined,
      createdBy: row.created_by as string | undefined,
    };
  }

  private mapConfigFromDb(row: Record<string, unknown>): BrandReputationConfig {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      weightSentiment: parseFloat(row.weight_sentiment as string),
      weightCoverage: parseFloat(row.weight_coverage as string),
      weightCrisis: parseFloat(row.weight_crisis as string),
      weightCompetitive: parseFloat(row.weight_competitive as string),
      weightEngagement: parseFloat(row.weight_engagement as string),
      thresholdAlertScoreDrop: parseFloat(row.threshold_alert_score_drop as string),
      thresholdCriticalScore: parseFloat(row.threshold_critical_score as string),
      thresholdWarningScore: parseFloat(row.threshold_warning_score as string),
      baselineScore: row.baseline_score ? parseFloat(row.baseline_score as string) : undefined,
      defaultTimeWindow: row.default_time_window as ReputationTimeWindow,
      autoRecalculate: row.auto_recalculate as boolean,
      recalculateIntervalHours: row.recalculate_interval_hours as number,
      trackedCompetitorIds: row.tracked_competitor_ids as string[],
      enableScoreAlerts: row.enable_score_alerts as boolean,
      alertRecipients: row.alert_recipients as BrandReputationConfig['alertRecipients'],
      settings: row.settings as Record<string, unknown>,
      updatedBy: row.updated_by as string | undefined,
    };
  }

  private mapAlertFromDb(row: Record<string, unknown>): BrandReputationAlert {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      createdAt: row.created_at as string,
      severity: row.severity as 'info' | 'warning' | 'critical',
      title: row.title as string,
      message: row.message as string,
      snapshotId: row.snapshot_id as string | undefined,
      triggerType: row.trigger_type as string,
      triggerValue: row.trigger_value ? parseFloat(row.trigger_value as string) : undefined,
      thresholdValue: row.threshold_value
        ? parseFloat(row.threshold_value as string)
        : undefined,
      relatedEventIds: row.related_event_ids as string[],
      isAcknowledged: row.is_acknowledged as boolean,
      acknowledgedAt: row.acknowledged_at as string | undefined,
      acknowledgedBy: row.acknowledged_by as string | undefined,
      isResolved: row.is_resolved as boolean,
      resolvedAt: row.resolved_at as string | undefined,
      resolvedBy: row.resolved_by as string | undefined,
      resolutionNotes: row.resolution_notes as string | undefined,
      notificationsSent: row.notifications_sent as BrandReputationAlert['notificationsSent'],
      metadata: row.metadata as Record<string, unknown>,
    };
  }
}
