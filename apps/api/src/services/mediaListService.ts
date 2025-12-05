/**
 * AI Media List Builder Service (Sprint S47)
 * Auto-generates intelligent, hyper-targeted media lists
 */

import type {
  FitScoreBreakdown,
  FitScoringWeights,
  JournalistFitAnalysis,
  JournalistMatch,
  MediaList,
  MediaListCreateInput,
  MediaListEntryQuery,
  MediaListEntryWithJournalist,
  MediaListGenerationInput,
  MediaListGenerationResult,
  MediaListQuery,
  MediaListSummary,
  MediaListUpdateInput,
  MediaListWithEntries,
  PastCoverageAnalysis,
  TierLevel,
  TopicRelevanceAnalysis,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// Sprint S47: AI Media List Builder Service
// Integrates S12 (topic clustering), S38-S45 (PR systems), S46 (journalist graph)

// =============================================
// Fit Scoring Engine Utilities
// =============================================

/**
 * Calculate Levenshtein distance between two strings
 * Reused from S46 journalist graph service
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[len1][len2];
}

function stringSimilarity(s1: string, s2: string): number {
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 1.0 : 1 - distance / maxLength;
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

function containsKeyword(text: string, keyword: string): boolean {
  const normalizedText = normalizeText(text);
  const normalizedKeyword = normalizeText(keyword);
  return normalizedText.includes(normalizedKeyword);
}

// =============================================
// Media List Service
// =============================================

export class MediaListService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Calculate topic relevance score (40% weight)
   * Measures how well journalist's beat/bio aligns with topic
   */
  async calculateTopicRelevance(
    journalist: any,
    topic: string,
    keywords: string[]
  ): Promise<TopicRelevanceAnalysis> {
    const beat = journalist.beat || '';
    const bio = journalist.bio || '';
    const normalizedTopic = normalizeText(topic);

    const matchedKeywords: string[] = [];
    for (const keyword of keywords) {
      if (containsKeyword(beat, keyword) || containsKeyword(bio, keyword)) {
        matchedKeywords.push(keyword);
      }
    }

    let beatAlignment = 0;
    if (beat) {
      const beatSimilarity = stringSimilarity(normalizeText(beat), normalizedTopic);
      beatAlignment = beatSimilarity;
      if (containsKeyword(beat, topic)) {
        beatAlignment = Math.min(1.0, beatAlignment + 0.3);
      }
    }

    let bioAlignment = 0;
    if (bio) {
      const bioSimilarity = stringSimilarity(normalizeText(bio), normalizedTopic);
      bioAlignment = bioSimilarity * 0.5;
      if (containsKeyword(bio, topic)) {
        bioAlignment = Math.min(1.0, bioAlignment + 0.2);
      }
    }

    const keywordScore = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
    const score = beatAlignment * 0.5 + bioAlignment * 0.3 + keywordScore * 0.2;

    return {
      score: Math.min(1.0, score),
      matchedKeywords,
      beatAlignment,
      bioAlignment,
    };
  }

  /**
   * Calculate past coverage score (25% weight)
   * Analyzes relevant coverage from S40-S43 media monitoring
   */
  async calculatePastCoverage(
    journalistId: string,
    orgId: string,
    topic: string,
    keywords: string[]
  ): Promise<PastCoverageAnalysis> {
    const { data: activities, error } = await this.supabase
      .from('journalist_activity_log')
      .select('*')
      .eq('journalist_id', journalistId)
      .eq('org_id', orgId)
      .in('activity_type', ['coverage_published', 'mention_detected'])
      .order('occurred_at', { ascending: false })
      .limit(100);

    if (error || !activities) {
      return {
        score: 0,
        totalCoverage: 0,
        relevantCoverage: 0,
        recentCoverage: 0,
        coverageQuality: 0,
      };
    }

    const totalCoverage = activities.length;
    let relevantCoverage = 0;
    let recentCoverage = 0;
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    for (const activity of activities) {
      const activityData = activity.activity_data || {};
      const title = activityData.title || '';
      const content = activityData.content || '';
      const combinedText = title + ' ' + content;

      let isRelevant = false;
      if (containsKeyword(combinedText, topic)) {
        isRelevant = true;
      } else {
        for (const keyword of keywords) {
          if (containsKeyword(combinedText, keyword)) {
            isRelevant = true;
            break;
          }
        }
      }

      if (isRelevant) {
        relevantCoverage++;
        const occurredAt = new Date(activity.occurred_at);
        if (occurredAt >= threeMonthsAgo) {
          recentCoverage++;
        }
      }
    }

    const positiveCoverage = activities.filter((a) => a.sentiment === 'positive').length;
    const coverageQuality = totalCoverage > 0 ? positiveCoverage / totalCoverage : 0;

    const relevanceRate = totalCoverage > 0 ? relevantCoverage / totalCoverage : 0;
    const recencyRate = totalCoverage > 0 ? recentCoverage / totalCoverage : 0;
    const volumeScore = Math.min(1.0, totalCoverage / 20);

    const score = relevanceRate * 0.5 + recencyRate * 0.3 + volumeScore * 0.2;

    return {
      score: Math.min(1.0, score),
      totalCoverage,
      relevantCoverage,
      recentCoverage,
      coverageQuality,
    };
  }

  /**
   * Calculate engagement score (15% weight)
   * From S44 outreach data and S46 journalist graph
   */
  calculateEngagementScore(journalist: any): number {
    const engagementScore = journalist.engagement_score || 0;
    return Math.min(1.0, Math.max(0, engagementScore));
  }

  /**
   * Calculate responsiveness score (10% weight)
   * From S45 deliverability data and S46 journalist graph
   */
  calculateResponsivenessScore(journalist: any): number {
    const responsivenessScore = journalist.responsiveness_score || 0;
    return Math.min(1.0, Math.max(0, responsivenessScore));
  }

  /**
   * Calculate outlet tier score (10% weight)
   * Based on outlet quality and reach
   */
  calculateOutletTierScore(journalist: any): {
    score: number;
    outlet?: string;
    tier: 'tier1' | 'tier2' | 'tier3' | 'unknown';
  } {
    const outlet = journalist.primary_outlet;

    if (!outlet) {
      return { score: 0, tier: 'unknown' };
    }

    const tier1Outlets = [
      'wall street journal',
      'new york times',
      'washington post',
      'bloomberg',
      'reuters',
      'associated press',
      'techcrunch',
      'wired',
      'forbes',
      'fortune',
      'business insider',
      'the verge',
      'engadget',
    ];

    const tier2Outlets = [
      'venturebeat',
      'mashable',
      'fast company',
      'inc',
      'entrepreneur',
      'zdnet',
      'cnet',
      'ars technica',
      'silicon valley business journal',
    ];

    const normalizedOutlet = normalizeText(outlet);

    for (const t1 of tier1Outlets) {
      if (normalizedOutlet.includes(t1)) {
        return { score: 1.0, outlet, tier: 'tier1' };
      }
    }

    for (const t2 of tier2Outlets) {
      if (normalizedOutlet.includes(t2)) {
        return { score: 0.6, outlet, tier: 'tier2' };
      }
    }

    return { score: 0.3, outlet, tier: 'tier3' };
  }

  /**
   * Calculate overall fit score
   * Combines 5 dimensions with weights
   */
  async calculateFitScore(
    journalist: any,
    input: MediaListGenerationInput,
    weights: FitScoringWeights = {
      topicRelevance: 0.40,
      pastCoverage: 0.25,
      engagement: 0.15,
      responsiveness: 0.10,
      outletTier: 0.10,
    }
  ): Promise<JournalistFitAnalysis> {
    const journalistId = journalist.id;
    const orgId = journalist.org_id;

    const topicRelevance = await this.calculateTopicRelevance(
      journalist,
      input.topic,
      input.keywords || []
    );

    const pastCoverage = await this.calculatePastCoverage(
      journalistId,
      orgId,
      input.topic,
      input.keywords || []
    );

    const engagement = {
      score: this.calculateEngagementScore(journalist),
      engagementScore: journalist.engagement_score || 0,
    };

    const responsiveness = {
      score: this.calculateResponsivenessScore(journalist),
      responsivenessScore: journalist.responsiveness_score || 0,
      replyRate: 0,
    };

    const outletTier = this.calculateOutletTierScore(journalist);

    const breakdown: FitScoreBreakdown = {
      topicRelevance: topicRelevance.score,
      pastCoverage: pastCoverage.score,
      engagement: engagement.score,
      responsiveness: responsiveness.score,
      outletTier: outletTier.score,
      totalScore: 0,
    };

    breakdown.totalScore =
      breakdown.topicRelevance * weights.topicRelevance +
      breakdown.pastCoverage * weights.pastCoverage +
      breakdown.engagement * weights.engagement +
      breakdown.responsiveness * weights.responsiveness +
      breakdown.outletTier * weights.outletTier;

    let tier: TierLevel;
    if (breakdown.totalScore >= 0.8) tier = 'A';
    else if (breakdown.totalScore >= 0.6) tier = 'B';
    else if (breakdown.totalScore >= 0.4) tier = 'C';
    else tier = 'D';

    return {
      journalistId,
      fitScore: breakdown.totalScore,
      tier,
      breakdown,
      topicRelevance,
      pastCoverage,
      engagement,
      responsiveness,
      outletTier,
    };
  }

  /**
   * Find candidate journalists for topic
   * Queries S46 journalist graph
   */
  async findCandidateJournalists(
    orgId: string,
    input: MediaListGenerationInput
  ): Promise<any[]> {
    const { topic, keywords = [] } = input;

    let query = this.supabase
      .from('journalist_profiles')
      .select('*')
      .eq('org_id', orgId);

    const searchTerms = [topic, ...keywords].filter(Boolean);
    if (searchTerms.length > 0) {
      const orConditions = searchTerms
        .map((term) => 'beat.ilike.%' + term + '%,bio.ilike.%' + term + '%')
        .join(',');
      query = query.or(orConditions);
    }

    query = query.order('engagement_score', { ascending: false }).limit(200);

    const { data: journalists, error } = await query;

    if (error || !journalists) {
      return [];
    }

    return journalists;
  }

  /**
   * Generate AI-powered media list
   * Main entry point for list generation
   */
  async generateMediaList(
    orgId: string,
    input: MediaListGenerationInput
  ): Promise<MediaListGenerationResult> {
    const {
      targetCount = 50,
      minFitScore = 0.3,
      includeTiers = ['A', 'B', 'C', 'D'],
    } = input;

    const candidates = await this.findCandidateJournalists(orgId, input);

    const scoredMatches: JournalistMatch[] = [];

    for (const journalist of candidates) {
      const analysis = await this.calculateFitScore(journalist, input);

      if (
        analysis.fitScore >= minFitScore &&
        includeTiers.includes(analysis.tier)
      ) {
        const reasons: string[] = [];
        if (analysis.topicRelevance.score > 0.5) {
          reasons.push(
            'Strong topic relevance (' + (analysis.topicRelevance.score * 100).toFixed(0) + '%)'
          );
        }
        if (analysis.pastCoverage.relevantCoverage > 0) {
          reasons.push(analysis.pastCoverage.relevantCoverage + ' relevant coverage articles');
        }
        if (analysis.engagement.engagementScore > 0.6) {
          reasons.push('High engagement history');
        }
        if (analysis.outletTier.tier === 'tier1') {
          reasons.push('Top-tier outlet: ' + analysis.outletTier.outlet);
        }

        const reason = reasons.length > 0 ? reasons.join('; ') : 'Matches search criteria';

        scoredMatches.push({
          journalistId: journalist.id,
          journalist: {
            id: journalist.id,
            fullName: journalist.full_name,
            primaryEmail: journalist.primary_email,
            primaryOutlet: journalist.primary_outlet,
            beat: journalist.beat,
            engagementScore: journalist.engagement_score || 0,
            responsivenessScore: journalist.responsiveness_score || 0,
            relevanceScore: journalist.relevance_score || 0,
            tier: journalist.tier,
          },
          fitScore: analysis.fitScore,
          tier: analysis.tier,
          reason,
          fitBreakdown: analysis.breakdown,
        });
      }
    }

    scoredMatches.sort((a, b) => b.fitScore - a.fitScore);

    const matches = scoredMatches.slice(0, targetCount);

    const tierDistribution = {
      A: matches.filter((m) => m.tier === 'A').length,
      B: matches.filter((m) => m.tier === 'B').length,
      C: matches.filter((m) => m.tier === 'C').length,
      D: matches.filter((m) => m.tier === 'D').length,
    };

    const avgFitScore =
      matches.length > 0
        ? matches.reduce((sum, m) => sum + m.fitScore, 0) / matches.length
        : 0;

    return {
      matches,
      metadata: {
        totalCandidates: candidates.length,
        totalMatches: matches.length,
        avgFitScore,
        tierDistribution,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Save generated list to database
   */
  async saveMediaList(
    orgId: string,
    userId: string,
    input: MediaListCreateInput,
    matches: JournalistMatch[]
  ): Promise<MediaListWithEntries> {
    const { data: list, error: listError } = await this.supabase
      .from('media_lists')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description,
        input_topic: input.inputTopic,
        input_keywords: input.inputKeywords || [],
        input_market: input.inputMarket,
        input_geography: input.inputGeography,
        input_product: input.inputProduct,
        created_by: userId,
      })
      .select()
      .single();

    if (listError || !list) {
      throw new Error('Failed to create media list: ' + listError?.message);
    }

    const entries = matches.map((match, index) => ({
      list_id: list.id,
      journalist_id: match.journalistId,
      fit_score: match.fitScore,
      tier: match.tier,
      reason: match.reason,
      fit_breakdown: match.fitBreakdown,
      position: index,
    }));

    const { error: entriesError } = await this.supabase
      .from('media_list_entries')
      .insert(entries)
      .select();

    if (entriesError) {
      throw new Error('Failed to create list entries: ' + entriesError.message);
    }

    return this.getMediaList(list.id, orgId);
  }

  /**
   * Get media list with entries
   */
  async getMediaList(listId: string, orgId: string): Promise<MediaListWithEntries> {
    const { data: list, error: listError } = await this.supabase
      .from('media_lists')
      .select('*')
      .eq('id', listId)
      .eq('org_id', orgId)
      .single();

    if (listError || !list) {
      throw new Error('Media list not found: ' + listError?.message);
    }

    const { data: entries, error: entriesError } = await this.supabase
      .from('media_list_entries')
      .select('*, journalist:journalist_profiles(*)')
      .eq('list_id', listId)
      .order('fit_score', { ascending: false });

    if (entriesError) {
      throw new Error('Failed to get list entries: ' + entriesError.message);
    }

    const entriesWithJournalist: MediaListEntryWithJournalist[] = (entries || []).map(
      (entry: any) => ({
        id: entry.id,
        listId: entry.list_id,
        journalistId: entry.journalist_id,
        fitScore: entry.fit_score,
        tier: entry.tier,
        reason: entry.reason,
        fitBreakdown: entry.fit_breakdown || {},
        position: entry.position,
        createdAt: new Date(entry.created_at),
        journalist: {
          id: entry.journalist.id,
          fullName: entry.journalist.full_name,
          primaryEmail: entry.journalist.primary_email,
          primaryOutlet: entry.journalist.primary_outlet,
          beat: entry.journalist.beat,
          engagementScore: entry.journalist.engagement_score || 0,
          responsivenessScore: entry.journalist.responsiveness_score || 0,
          relevanceScore: entry.journalist.relevance_score || 0,
          tier: entry.journalist.tier,
        },
      })
    );

    const tierACount = entriesWithJournalist.filter((e) => e.tier === 'A').length;
    const tierBCount = entriesWithJournalist.filter((e) => e.tier === 'B').length;
    const tierCCount = entriesWithJournalist.filter((e) => e.tier === 'C').length;
    const tierDCount = entriesWithJournalist.filter((e) => e.tier === 'D').length;

    const avgFitScore =
      entriesWithJournalist.length > 0
        ? entriesWithJournalist.reduce((sum, e) => sum + e.fitScore, 0) /
          entriesWithJournalist.length
        : 0;

    return {
      id: list.id,
      orgId: list.org_id,
      name: list.name,
      description: list.description,
      inputTopic: list.input_topic,
      inputKeywords: list.input_keywords || [],
      inputMarket: list.input_market,
      inputGeography: list.input_geography,
      inputProduct: list.input_product,
      createdBy: list.created_by,
      createdAt: new Date(list.created_at),
      updatedAt: new Date(list.updated_at),
      entries: entriesWithJournalist,
      totalEntries: entriesWithJournalist.length,
      tierACount,
      tierBCount,
      tierCCount,
      tierDCount,
      avgFitScore,
    };
  }

  /**
   * List media lists with summaries
   */
  async listMediaLists(
    orgId: string,
    query: MediaListQuery
  ): Promise<{ lists: MediaListSummary[]; total: number }> {
    const {
      q,
      topic,
      market,
      createdBy,
      sortBy = 'created_at',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('media_lists')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (q) {
      dbQuery = dbQuery.or('name.ilike.%' + q + '%,description.ilike.%' + q + '%');
    }
    if (topic) {
      dbQuery = dbQuery.ilike('input_topic', '%' + topic + '%');
    }
    if (market) {
      dbQuery = dbQuery.ilike('input_market', '%' + market + '%');
    }
    if (createdBy) {
      dbQuery = dbQuery.eq('created_by', createdBy);
    }

    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: lists, error, count } = await dbQuery;

    if (error) {
      throw new Error('Failed to list media lists: ' + error.message);
    }

    const listsWithCounts: MediaListSummary[] = await Promise.all(
      (lists || []).map(async (list) => {
        const { data: entryCounts } = await this.supabase
          .from('media_list_entries')
          .select('tier, fit_score')
          .eq('list_id', list.id);

        const entries = entryCounts || [];
        const tierACount = entries.filter((e) => e.tier === 'A').length;
        const tierBCount = entries.filter((e) => e.tier === 'B').length;
        const tierCCount = entries.filter((e) => e.tier === 'C').length;
        const tierDCount = entries.filter((e) => e.tier === 'D').length;
        const avgFitScore =
          entries.length > 0
            ? entries.reduce((sum, e) => sum + e.fit_score, 0) / entries.length
            : 0;

        return {
          id: list.id,
          orgId: list.org_id,
          name: list.name,
          description: list.description,
          inputTopic: list.input_topic,
          inputKeywords: list.input_keywords || [],
          inputMarket: list.input_market,
          inputGeography: list.input_geography,
          inputProduct: list.input_product,
          createdBy: list.created_by,
          createdAt: new Date(list.created_at),
          updatedAt: new Date(list.updated_at),
          totalEntries: entries.length,
          tierACount,
          tierBCount,
          tierCCount,
          tierDCount,
          avgFitScore,
        };
      })
    );

    return {
      lists: listsWithCounts,
      total: count || 0,
    };
  }

  /**
   * Update media list metadata
   */
  async updateMediaList(
    listId: string,
    orgId: string,
    input: MediaListUpdateInput
  ): Promise<MediaList> {
    const { data: list, error } = await this.supabase
      .from('media_lists')
      .update({
        name: input.name,
        description: input.description,
      })
      .eq('id', listId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !list) {
      throw new Error('Failed to update media list: ' + error?.message);
    }

    return {
      id: list.id,
      orgId: list.org_id,
      name: list.name,
      description: list.description,
      inputTopic: list.input_topic,
      inputKeywords: list.input_keywords || [],
      inputMarket: list.input_market,
      inputGeography: list.input_geography,
      inputProduct: list.input_product,
      createdBy: list.created_by,
      createdAt: new Date(list.created_at),
      updatedAt: new Date(list.updated_at),
    };
  }

  /**
   * Delete media list (cascades to entries)
   */
  async deleteMediaList(listId: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('media_lists')
      .delete()
      .eq('id', listId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error('Failed to delete media list: ' + error.message);
    }
  }

  /**
   * Get media list entries with filtering
   */
  async getMediaListEntries(
    query: MediaListEntryQuery
  ): Promise<MediaListEntryWithJournalist[]> {
    const {
      listId,
      tier,
      minFitScore,
      sortBy = 'fit_score',
      sortOrder = 'desc',
      limit = 50,
      offset = 0,
    } = query;

    let dbQuery = this.supabase
      .from('media_list_entries')
      .select('*, journalist:journalist_profiles(*)')
      .eq('list_id', listId);

    if (tier) {
      if (Array.isArray(tier)) {
        dbQuery = dbQuery.in('tier', tier);
      } else {
        dbQuery = dbQuery.eq('tier', tier);
      }
    }
    if (minFitScore !== undefined) {
      dbQuery = dbQuery.gte('fit_score', minFitScore);
    }

    dbQuery = dbQuery.order(sortBy, { ascending: sortOrder === 'asc' });
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data: entries, error } = await dbQuery;

    if (error) {
      throw new Error('Failed to get list entries: ' + error.message);
    }

    return (entries || []).map((entry: any) => ({
      id: entry.id,
      listId: entry.list_id,
      journalistId: entry.journalist_id,
      fitScore: entry.fit_score,
      tier: entry.tier,
      reason: entry.reason,
      fitBreakdown: entry.fit_breakdown || {},
      position: entry.position,
      createdAt: new Date(entry.created_at),
      journalist: {
        id: entry.journalist.id,
        fullName: entry.journalist.full_name,
        primaryEmail: entry.journalist.primary_email,
        primaryOutlet: entry.journalist.primary_outlet,
        beat: entry.journalist.beat,
        engagementScore: entry.journalist.engagement_score || 0,
        responsivenessScore: entry.journalist.responsiveness_score || 0,
        relevanceScore: entry.journalist.relevance_score || 0,
        tier: entry.journalist.tier,
      },
    }));
  }
}

export function createMediaListService(supabase: SupabaseClient): MediaListService {
  return new MediaListService(supabase);
}
