/**
 * Narrative Generator Service (Sprint S49)
 * LLM-powered generation of journalist relationship narratives
 *
 * Generates AI-powered summaries of journalist relationships including:
 * - Executive summaries
 * - Relationship insights
 * - Sentiment analysis
 * - Activity patterns
 * - Actionable recommendations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  GenerateNarrativeInput,
  JournalistNarrative,
  JournalistTimelineEvent,
  NarrativeHighlight,
  NarrativeRecommendation,
  TimelineStats,
} from '@pravado/types';
import { LlmRouter, createLogger } from '@pravado/utils';
import { BillingService } from './billingService';
import { JournalistTimelineService } from './journalistTimelineService';

const logger = createLogger('narrative-generator-service');

// =============================================
// LLM Prompt Templates
// =============================================

const NARRATIVE_SYSTEM_PROMPT = `You are an expert PR and media relations analyst. Your task is to analyze journalist relationship data and generate insightful, actionable narratives that help PR professionals understand their relationships and optimize their outreach strategies.

Focus on:
- Relationship health and trends
- Engagement patterns
- Coverage opportunities
- Sentiment analysis
- Actionable recommendations

Be concise, professional, and data-driven. Avoid speculation or assumptions not supported by the data.`;

const EXECUTIVE_SUMMARY_PROMPT = `Based on the following journalist interaction data, generate a 2-3 sentence executive summary of the relationship:

Journalist: {journalistName}
Total Interactions: {totalEvents}
Last Interaction: {lastInteractionDays} days ago
Coverage Achieved: {coverageCount}
Sentiment Distribution: {sentimentDistribution}
Recent Activity: {recentActivity}

Generate a concise executive summary that captures the current state of this relationship:`;

const SENTIMENT_EXPLANATION_PROMPT = `Analyze the sentiment of this journalist relationship based on the following data:

Positive Events: {positiveCount}
Neutral Events: {neutralCount}
Negative Events: {negativeCount}
Overall Sentiment: {overallSentiment}

Recent Events:
{recentEvents}

Provide a 1-2 sentence explanation of the sentiment trend and what it means for the relationship:`;

const RECOMMENDATIONS_PROMPT = `Based on the following journalist relationship data, generate 3-5 specific, actionable recommendations:

Relationship Health Score: {healthScore}/100
Last Interaction: {lastInteractionDays} days ago
Total Interactions: {totalEvents}
Recent Activity (30 days): {recent30Days}
Coverage Achieved: {coverageCount}
Reply Rate: {replyRate}%
Open Rate: {openRate}%
Sentiment: {sentiment}

Key Issues:
{keyIssues}

Generate specific, prioritized recommendations to improve this journalist relationship:`;

const COVERAGE_SUMMARY_PROMPT = `Summarize the coverage history with this journalist:

Total Coverage Events: {coverageCount}
Last Coverage: {lastCoverageDate}

Coverage Events:
{coverageEvents}

Generate a brief summary (1-2 sentences) of the coverage relationship:`;

// =============================================
// NarrativeGeneratorService Class
// =============================================

export class NarrativeGeneratorService {
  private llmRouter: LlmRouter | null = null;
  private timelineService: JournalistTimelineService;

  constructor(
    private supabase: SupabaseClient,
    private billingService: BillingService,
    llmRouter?: LlmRouter
  ) {
    this.llmRouter = llmRouter || null;
    this.timelineService = new JournalistTimelineService(supabase);
  }

  /**
   * Generates a comprehensive AI-powered narrative for a journalist relationship
   */
  async generateNarrative(
    orgId: string,
    input: GenerateNarrativeInput
  ): Promise<JournalistNarrative> {
    // Enforce billing quota (estimated ~8,000 tokens for narrative generation)
    await this.billingService.enforceOrgQuotaOrThrow(orgId, {
      tokensToConsume: 8000,
    });

    logger.info('Generating narrative for journalist', {
      orgId,
      journalistId: input.journalistId,
      timeframe: input.timeframe,
    });

    // Get timeline data
    const timelineData = await this.gatherTimelineData(orgId, input);

    // Get journalist info
    const journalist = await this.getJournalistInfo(orgId, input.journalistId);
    const journalistName = journalist?.name || 'Unknown Journalist';

    // Generate narrative components
    const narrative: JournalistNarrative = {
      journalistId: input.journalistId,
      journalistName,
      generatedAt: new Date(),
      timeframe: input.timeframe || 'all_time',
      executiveSummary: '',
      highlights: [],
      overallSentiment: 'neutral',
      sentimentTrend: 'stable',
      sentimentExplanation: '',
      activityLevel: 'inactive',
      lastInteractionDays: 0,
      totalInteractions: timelineData.stats.totalEvents,
      coverageCount: 0,
      lastCoverageDate: undefined,
      coverageSummary: undefined,
      replyRate: 0,
      openRate: 0,
      clickRate: 0,
      recommendations: [],
      healthScore: 0,
    };

    // Generate each component
    if (this.llmRouter) {
      // LLM-powered generation
      narrative.executiveSummary = await this.generateExecutiveSummary(
        journalistName,
        timelineData.stats,
        timelineData.events
      );

      narrative.sentimentExplanation = await this.generateSentimentExplanation(
        timelineData.stats,
        timelineData.events
      );

      if (input.includeRecommendations) {
        narrative.recommendations = await this.generateRecommendations(
          timelineData.stats,
          timelineData.healthScore,
          timelineData.engagementMetrics
        );
      }

      const coverageEvents = timelineData.events.filter(
        (e) => e.eventType === 'media_mention' || e.eventType === 'coverage_published'
      );
      if (coverageEvents.length > 0) {
        narrative.coverageSummary = await this.generateCoverageSummary(coverageEvents);
      }
    } else {
      // Fallback to rule-based generation
      narrative.executiveSummary = this.generateFallbackExecutiveSummary(
        timelineData.stats,
        timelineData.events
      );
      narrative.sentimentExplanation = this.generateFallbackSentimentExplanation(timelineData.stats);
      if (input.includeRecommendations) {
        narrative.recommendations = this.generateFallbackRecommendations(
          timelineData.stats,
          timelineData.healthScore
        );
      }
    }

    // Calculate other metrics
    narrative.highlights = this.extractHighlights(timelineData.events, input.focusAreas);
    narrative.overallSentiment = this.calculateOverallSentiment(timelineData.stats);
    narrative.sentimentTrend = this.calculateSentimentTrend(timelineData.stats);
    narrative.activityLevel = this.calculateActivityLevel(timelineData.stats);
    narrative.lastInteractionDays = timelineData.stats.lastInteraction
      ? Math.floor((Date.now() - timelineData.stats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    narrative.coverageCount = timelineData.coverageCount;
    narrative.lastCoverageDate = timelineData.lastCoverageDate;

    narrative.replyRate = timelineData.engagementMetrics.replyRate;
    narrative.openRate = timelineData.engagementMetrics.openRate;
    narrative.clickRate = timelineData.engagementMetrics.clickRate;

    narrative.healthScore = timelineData.healthScore;

    return narrative;
  }

  // =============================================
  // Data Gathering
  // =============================================

  /**
   * Gathers all timeline data needed for narrative generation
   */
  private async gatherTimelineData(orgId: string, input: GenerateNarrativeInput) {
    // Get timeline events
    const timelineQuery: any = {
      journalistId: input.journalistId,
      limit: 100, // Get recent 100 events for analysis
    };

    if (input.timeframe === 'last_30_days') {
      timelineQuery.last30Days = true;
    } else if (input.timeframe === 'last_90_days') {
      timelineQuery.last90Days = true;
    }

    const timeline = await this.timelineService.listEvents(orgId, timelineQuery);
    const stats = timeline.stats!;

    // Calculate health score
    const healthScoreData = await this.timelineService.calculateHealthScore(orgId, input.journalistId);
    const healthScore = healthScoreData.score;

    // Calculate engagement metrics
    const sentEvents = (stats.eventTypeCounts['pitch_sent'] || 0) + (stats.eventTypeCounts['outreach_sent'] || 0);
    const replyEvents =
      (stats.eventTypeCounts['pitch_replied'] || 0) + (stats.eventTypeCounts['outreach_replied'] || 0);
    const openEvents =
      (stats.eventTypeCounts['pitch_opened'] || 0) + (stats.eventTypeCounts['outreach_opened'] || 0);
    const clickEvents =
      (stats.eventTypeCounts['pitch_clicked'] || 0) + (stats.eventTypeCounts['outreach_clicked'] || 0);

    const engagementMetrics = {
      replyRate: sentEvents > 0 ? (replyEvents / sentEvents) * 100 : 0,
      openRate: sentEvents > 0 ? (openEvents / sentEvents) * 100 : 0,
      clickRate: sentEvents > 0 ? (clickEvents / sentEvents) * 100 : 0,
    };

    // Coverage data
    const coverageEvents = timeline.events.filter(
      (e) => e.eventType === 'media_mention' || e.eventType === 'coverage_published'
    );
    const coverageCount = coverageEvents.length;
    const lastCoverageDate = coverageEvents.length > 0 ? coverageEvents[0].eventTimestamp : undefined;

    return {
      events: timeline.events,
      stats,
      healthScore,
      engagementMetrics,
      coverageCount,
      lastCoverageDate,
      coverageEvents,
    };
  }

  /**
   * Gets journalist profile information
   */
  private async getJournalistInfo(orgId: string, journalistId: string): Promise<{ name: string } | null> {
    const { data } = await this.supabase
      .from('journalist_profiles')
      .select('name')
      .eq('org_id', orgId)
      .eq('id', journalistId)
      .single();

    return data ? { name: data.name } : null;
  }

  // =============================================
  // LLM-Powered Generation
  // =============================================

  /**
   * Generates executive summary using LLM
   */
  private async generateExecutiveSummary(
    journalistName: string,
    stats: TimelineStats,
    events: JournalistTimelineEvent[]
  ): Promise<string> {
    if (!this.llmRouter) {
      return this.generateFallbackExecutiveSummary(stats, events);
    }

    const lastInteractionDays = stats.lastInteraction
      ? Math.floor((Date.now() - stats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const coverageCount =
      (stats.eventTypeCounts['media_mention'] || 0) + (stats.eventTypeCounts['coverage_published'] || 0);

    const sentimentDist = `${stats.sentimentDistribution.positive} positive, ${stats.sentimentDistribution.neutral} neutral, ${stats.sentimentDistribution.negative} negative`;

    const recentActivity = stats.recent30Days > 0 ? `${stats.recent30Days} events in last 30 days` : 'No recent activity';

    const prompt = EXECUTIVE_SUMMARY_PROMPT.replace('{journalistName}', journalistName)
      .replace('{totalEvents}', stats.totalEvents.toString())
      .replace('{lastInteractionDays}', lastInteractionDays.toString())
      .replace('{coverageCount}', coverageCount.toString())
      .replace('{sentimentDistribution}', sentimentDist)
      .replace('{recentActivity}', recentActivity);

    try {
      const response = await this.llmRouter.generate({
        systemPrompt: NARRATIVE_SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 200,
      });

      return response.completion.trim();
    } catch (error) {
      logger.error('Failed to generate executive summary with LLM', { error });
      return this.generateFallbackExecutiveSummary(stats, events);
    }
  }

  /**
   * Generates sentiment explanation using LLM
   */
  private async generateSentimentExplanation(
    stats: TimelineStats,
    events: JournalistTimelineEvent[]
  ): Promise<string> {
    if (!this.llmRouter) {
      return this.generateFallbackSentimentExplanation(stats);
    }

    const overallSentiment = this.calculateOverallSentiment(stats);
    const recentEvents = events
      .slice(0, 5)
      .map((e) => `- ${e.eventType}: ${e.title} (${e.sentiment})`)
      .join('\n');

    const prompt = SENTIMENT_EXPLANATION_PROMPT.replace('{positiveCount}', stats.sentimentDistribution.positive.toString())
      .replace('{neutralCount}', stats.sentimentDistribution.neutral.toString())
      .replace('{negativeCount}', stats.sentimentDistribution.negative.toString())
      .replace('{overallSentiment}', overallSentiment)
      .replace('{recentEvents}', recentEvents || 'No recent events');

    try {
      const response = await this.llmRouter.generate({
        systemPrompt: NARRATIVE_SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 150,
      });

      return response.completion.trim();
    } catch (error) {
      logger.error('Failed to generate sentiment explanation with LLM', { error });
      return this.generateFallbackSentimentExplanation(stats);
    }
  }

  /**
   * Generates recommendations using LLM
   */
  private async generateRecommendations(
    stats: TimelineStats,
    healthScore: number,
    engagementMetrics: { replyRate: number; openRate: number; clickRate: number }
  ): Promise<NarrativeRecommendation[]> {
    if (!this.llmRouter) {
      return this.generateFallbackRecommendations(stats, healthScore);
    }

    const lastInteractionDays = stats.lastInteraction
      ? Math.floor((Date.now() - stats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const coverageCount =
      (stats.eventTypeCounts['media_mention'] || 0) + (stats.eventTypeCounts['coverage_published'] || 0);

    const overallSentiment = this.calculateOverallSentiment(stats);

    // Identify key issues
    const keyIssues: string[] = [];
    if (lastInteractionDays > 30) keyIssues.push('- No recent interactions');
    if (coverageCount === 0) keyIssues.push('- No coverage achieved');
    if (engagementMetrics.replyRate < 10) keyIssues.push('- Low reply rate');
    if (overallSentiment === 'negative') keyIssues.push('- Negative sentiment trend');

    const prompt = RECOMMENDATIONS_PROMPT.replace('{healthScore}', healthScore.toFixed(0))
      .replace('{lastInteractionDays}', lastInteractionDays.toString())
      .replace('{totalEvents}', stats.totalEvents.toString())
      .replace('{recent30Days}', stats.recent30Days.toString())
      .replace('{coverageCount}', coverageCount.toString())
      .replace('{replyRate}', engagementMetrics.replyRate.toFixed(1))
      .replace('{openRate}', engagementMetrics.openRate.toFixed(1))
      .replace('{sentiment}', overallSentiment)
      .replace('{keyIssues}', keyIssues.join('\n') || 'None');

    try {
      const response = await this.llmRouter.generate({
        systemPrompt: NARRATIVE_SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 400,
      });

      // Parse recommendations from response
      const recommendations: NarrativeRecommendation[] = [];
      const lines = response.completion.split('\n').filter((line: string) => line.trim());

      for (const line of lines) {
        if (line.match(/^[\d\-\*]/)) {
          // Likely a recommendation line
          const cleanLine = line.replace(/^[\d\-\*\.\)]+\s*/, '').trim();
          if (cleanLine.length > 10) {
            recommendations.push({
              type: 'action',
              priority: healthScore < 30 ? 'high' : healthScore > 70 ? 'low' : 'medium',
              title: cleanLine.substring(0, 50),
              description: cleanLine,
            });
          }
        }
      }

      return recommendations.slice(0, 5); // Max 5 recommendations
    } catch (error) {
      logger.error('Failed to generate recommendations with LLM', { error });
      return this.generateFallbackRecommendations(stats, healthScore);
    }
  }

  /**
   * Generates coverage summary using LLM
   */
  private async generateCoverageSummary(coverageEvents: JournalistTimelineEvent[]): Promise<string> {
    if (!this.llmRouter || coverageEvents.length === 0) {
      return `${coverageEvents.length} coverage mention${coverageEvents.length > 1 ? 's' : ''} tracked.`;
    }

    const lastCoverageDate = coverageEvents[0].eventTimestamp.toLocaleDateString();
    const eventsList = coverageEvents
      .slice(0, 5)
      .map((e) => `- ${e.title} (${e.eventTimestamp.toLocaleDateString()})`)
      .join('\n');

    const prompt = COVERAGE_SUMMARY_PROMPT.replace('{coverageCount}', coverageEvents.length.toString())
      .replace('{lastCoverageDate}', lastCoverageDate)
      .replace('{coverageEvents}', eventsList);

    try {
      const response = await this.llmRouter.generate({
        systemPrompt: NARRATIVE_SYSTEM_PROMPT,
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 150,
      });

      return response.completion.trim();
    } catch (error) {
      logger.error('Failed to generate coverage summary with LLM', { error });
      return `${coverageEvents.length} coverage mention${coverageEvents.length > 1 ? 's' : ''} tracked.`;
    }
  }

  // =============================================
  // Fallback Generation (Rule-Based)
  // =============================================

  /**
   * Fallback executive summary without LLM
   */
  private generateFallbackExecutiveSummary(stats: TimelineStats, _events: JournalistTimelineEvent[]): string {
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
   * Fallback sentiment explanation without LLM
   */
  private generateFallbackSentimentExplanation(stats: TimelineStats): string {
    const { positive, neutral, negative } = stats.sentimentDistribution;
    const total = positive + neutral + negative;

    if (total === 0) return 'No sentiment data available.';

    const overallSentiment = this.calculateOverallSentiment(stats);
    return `${positive} positive, ${neutral} neutral, ${negative} negative interactions. Overall sentiment: ${overallSentiment}.`;
  }

  /**
   * Fallback recommendations without LLM
   */
  private generateFallbackRecommendations(stats: TimelineStats, healthScore: number): NarrativeRecommendation[] {
    const recommendations: NarrativeRecommendation[] = [];

    const lastInteractionDays = stats.lastInteraction
      ? Math.floor((Date.now() - stats.lastInteraction.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    // Recency recommendations
    if (lastInteractionDays > 30) {
      recommendations.push({
        type: 'action',
        priority: 'high',
        title: 'Re-engage',
        description: 'No recent interactions. Consider reaching out with a personalized pitch.',
      });
    }

    // Activity recommendations
    if (stats.recent30Days === 0) {
      recommendations.push({
        type: 'action',
        priority: 'medium',
        title: 'Follow Up',
        description: 'No activity in the last 30 days. Schedule a follow-up or share relevant content.',
      });
    }

    // Coverage recommendations
    const coverageCount =
      (stats.eventTypeCounts['media_mention'] || 0) + (stats.eventTypeCounts['coverage_published'] || 0);
    if (coverageCount === 0 && stats.totalEvents > 5) {
      recommendations.push({
        type: 'insight',
        priority: 'medium',
        title: 'Review Strategy',
        description: 'No coverage achieved yet. Review pitch angles and journalist beat alignment.',
      });
    }

    // Overall health
    if (healthScore < 30) {
      recommendations.push({
        type: 'warning',
        priority: 'high',
        title: 'Relationship Health Low',
        description: 'Low relationship health. Focus on rebuilding rapport with value-first communication.',
      });
    } else if (healthScore > 70) {
      recommendations.push({
        type: 'insight',
        priority: 'low',
        title: 'Strong Relationship',
        description: 'Strong relationship. Good time to pitch premium stories or request introductions.',
      });
    }

    return recommendations;
  }

  // =============================================
  // Analysis Utilities
  // =============================================

  /**
   * Extracts narrative highlights from events
   */
  private extractHighlights(
    events: JournalistTimelineEvent[],
    focusAreas?: ('coverage' | 'engagement' | 'outreach' | 'sentiment')[]
  ): NarrativeHighlight[] {
    let filteredEvents = events;

    // Filter by focus areas if specified
    if (focusAreas && focusAreas.length > 0) {
      filteredEvents = events.filter((e) => {
        if (focusAreas.includes('coverage') && (e.eventType === 'media_mention' || e.eventType === 'coverage_published')) {
          return true;
        }
        if (focusAreas.includes('engagement') && (e.eventType === 'pitch_replied' || e.eventType === 'outreach_replied')) {
          return true;
        }
        if (focusAreas.includes('outreach') && (e.eventType === 'pitch_sent' || e.eventType === 'outreach_sent')) {
          return true;
        }
        if (focusAreas.includes('sentiment') && e.sentiment === 'positive') {
          return true;
        }
        return false;
      });
    }

    // Get high-relevance events
    const importantEvents = filteredEvents
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
  private calculateOverallSentiment(stats: TimelineStats): 'positive' | 'neutral' | 'negative' | 'unknown' {
    const { positive, neutral, negative } = stats.sentimentDistribution;
    const total = positive + neutral + negative;

    if (total === 0) return 'unknown';

    if (positive / total > 0.5) return 'positive';
    if (negative / total > 0.3) return 'negative';
    return 'neutral';
  }

  /**
   * Calculates sentiment trend
   */
  private calculateSentimentTrend(stats: TimelineStats): 'improving' | 'stable' | 'declining' {
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
   * Calculates activity level
   */
  private calculateActivityLevel(stats: TimelineStats): 'very_active' | 'active' | 'moderate' | 'low' | 'inactive' {
    const recent30 = stats.recent30Days;

    if (recent30 >= 10) return 'very_active';
    if (recent30 >= 5) return 'active';
    if (recent30 >= 2) return 'moderate';
    if (recent30 >= 1) return 'low';
    return 'inactive';
  }
}
