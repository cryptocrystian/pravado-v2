/**
 * Journalist Identity Graph Service (Sprint S46)
 * Unified journalist intelligence layer across S38-S45
 */

import type {
  ActivityType,
  CreateActivityInput,
  CreateJournalistProfileInput,
  EnrichedJournalistProfile,
  FuzzyMatchResult,
  JournalistGraphEdge,
  JournalistGraphNode,
  GraphQuery,
  IdentityMatch,
  IdentityResolutionInput,
  JournalistActivity,
  JournalistActivitySummary,
  JournalistEngagementModel,
  JournalistGraph,
  JournalistProfile,
  JournalistRelevanceModel,
  JournalistResponsivenessModel,
  JournalistTier,
  JournalistTierClassification,
  ListActivitiesQuery,
  ListJournalistProfilesQuery,
  MergeProfilesInput,
  Sentiment,
  SourceSystem,
  UpdateJournalistProfileInput,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

// =============================================
// String Similarity Utility
// =============================================

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculates similarity score between 0 and 1
 */
function stringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Normalizes email address for comparison
 */
function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Normalizes name for comparison
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// =============================================
// Service Class
// =============================================

export class JournalistGraphService {
  constructor(private supabase: SupabaseClient) {}

  // =============================================
  // Profile Management (CRUD)
  // =============================================

  /**
   * Creates a new journalist profile
   */
  async createProfile(
    orgId: string,
    input: CreateJournalistProfileInput
  ): Promise<JournalistProfile> {
    const { data, error } = await this.supabase
      .from('journalist_profiles')
      .insert({
        org_id: orgId,
        full_name: input.fullName,
        primary_email: input.primaryEmail,
        secondary_emails: input.secondaryEmails || [],
        primary_outlet: input.primaryOutlet || null,
        beat: input.beat || null,
        twitter_handle: input.twitterHandle || null,
        linkedin_url: input.linkedinUrl || null,
        website_url: input.websiteUrl || null,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapDbProfileToProfile(data);
  }

  /**
   * Gets a journalist profile by ID
   */
  async getProfile(
    profileId: string,
    orgId: string
  ): Promise<JournalistProfile | null> {
    // Get canonical ID (in case this is a merged profile)
    const { data: canonicalId } = await this.supabase.rpc(
      'get_canonical_journalist_id',
      {
        p_journalist_id: profileId,
        p_org_id: orgId,
      }
    );

    const { data, error } = await this.supabase
      .from('journalist_profiles')
      .select()
      .eq('id', canonicalId || profileId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapDbProfileToProfile(data);
  }

  /**
   * Lists journalist profiles with filters
   */
  async listProfiles(
    orgId: string,
    query: ListJournalistProfilesQuery
  ): Promise<{ profiles: JournalistProfile[]; total: number }> {
    let dbQuery = this.supabase
      .from('journalist_profiles')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.q) {
      dbQuery = dbQuery.or(
        `full_name.ilike.%${query.q}%,primary_email.ilike.%${query.q}%,primary_outlet.ilike.%${query.q}%`
      );
    }

    if (query.outlet) {
      dbQuery = dbQuery.eq('primary_outlet', query.outlet);
    }

    if (query.beat) {
      dbQuery = dbQuery.eq('beat', query.beat);
    }

    if (query.minEngagementScore !== undefined) {
      dbQuery = dbQuery.gte('engagement_score', query.minEngagementScore);
    }

    if (query.minRelevanceScore !== undefined) {
      dbQuery = dbQuery.gte('relevance_score', query.minRelevanceScore);
    }

    // Apply sorting
    const sortColumn = query.sortBy || 'engagement_score';
    const sortOrder = query.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    dbQuery = dbQuery.order(sortColumn, sortOrder);

    // Apply pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    const profiles = (data || []).map((p) => this.mapDbProfileToProfile(p));

    return {
      profiles,
      total: count || 0,
    };
  }

  /**
   * Updates a journalist profile
   */
  async updateProfile(
    profileId: string,
    orgId: string,
    input: UpdateJournalistProfileInput
  ): Promise<JournalistProfile> {
    const updateData: Record<string, unknown> = {};

    if (input.fullName !== undefined) updateData.full_name = input.fullName;
    if (input.primaryEmail !== undefined) updateData.primary_email = input.primaryEmail;
    if (input.secondaryEmails !== undefined)
      updateData.secondary_emails = input.secondaryEmails;
    if (input.primaryOutlet !== undefined) updateData.primary_outlet = input.primaryOutlet;
    if (input.beat !== undefined) updateData.beat = input.beat;
    if (input.twitterHandle !== undefined) updateData.twitter_handle = input.twitterHandle;
    if (input.linkedinUrl !== undefined) updateData.linkedin_url = input.linkedinUrl;
    if (input.websiteUrl !== undefined) updateData.website_url = input.websiteUrl;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    const { data, error } = await this.supabase
      .from('journalist_profiles')
      .update(updateData)
      .eq('id', profileId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;

    return this.mapDbProfileToProfile(data);
  }

  /**
   * Deletes a journalist profile
   */
  async deleteProfile(profileId: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('journalist_profiles')
      .delete()
      .eq('id', profileId)
      .eq('org_id', orgId);

    if (error) throw error;
  }

  // =============================================
  // Identity Resolution & Fuzzy Matching
  // =============================================

  /**
   * Finds matching journalists using fuzzy matching
   */
  async findMatches(
    orgId: string,
    input: IdentityResolutionInput
  ): Promise<IdentityMatch[]> {
    // Get all journalists from the org
    const { data: allProfiles, error } = await this.supabase
      .from('journalist_profiles')
      .select()
      .eq('org_id', orgId);

    if (error) throw error;
    if (!allProfiles || allProfiles.length === 0) return [];

    const normalizedInputEmail = normalizeEmail(input.email || '');
    const normalizedInputName = normalizeName(input.fullName || '');

    const matches: IdentityMatch[] = [];

    for (const dbProfile of allProfiles) {
      const profile = this.mapDbProfileToProfile(dbProfile);
      const matchReasons: string[] = [];
      let matchScore = 0;

      // Email exact match (highest priority)
      const normalizedPrimaryEmail = normalizeEmail(profile.primaryEmail);
      if (normalizedPrimaryEmail === normalizedInputEmail) {
        matchScore += 0.5;
        matchReasons.push('Primary email exact match');
      }

      // Secondary email match
      const normalizedSecondaryEmails = profile.secondaryEmails.map(normalizeEmail);
      if (normalizedSecondaryEmails.includes(normalizedInputEmail)) {
        matchScore += 0.4;
        matchReasons.push('Secondary email match');
      }

      // Name similarity
      const normalizedProfileName = normalizeName(profile.fullName);
      const nameSimilarity = stringSimilarity(normalizedProfileName, normalizedInputName);
      if (nameSimilarity > 0.7) {
        matchScore += nameSimilarity * 0.3;
        matchReasons.push(`Name similarity: ${(nameSimilarity * 100).toFixed(0)}%`);
      }

      // Outlet match (if provided)
      if (input.outlet && profile.primaryOutlet) {
        const outletSimilarity = stringSimilarity(
          input.outlet.toLowerCase(),
          profile.primaryOutlet.toLowerCase()
        );
        if (outletSimilarity > 0.8) {
          matchScore += 0.2;
          matchReasons.push('Outlet match');
        }
      }

      // Only include matches with score > 0.5
      if (matchScore >= 0.5) {
        matches.push({
          journalistId: profile.id,
          matchScore,
          matchReasons,
          profile,
        });
      }
    }

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  }

  /**
   * Performs identity resolution and suggests action
   */
  async resolveIdentity(
    orgId: string,
    input: IdentityResolutionInput
  ): Promise<{
    matches: IdentityMatch[];
    suggestedAction: 'create_new' | 'use_existing' | 'merge_duplicates';
    bestMatch?: IdentityMatch;
  }> {
    const matches = await this.findMatches(orgId, input);

    if (matches.length === 0) {
      return {
        matches: [],
        suggestedAction: 'create_new',
      };
    }

    const bestMatch = matches[0];

    if (bestMatch.matchScore >= 0.9) {
      // High confidence match - use existing
      return {
        matches,
        suggestedAction: 'use_existing',
        bestMatch,
      };
    } else if (matches.length > 1) {
      // Multiple matches - suggest merge
      return {
        matches,
        suggestedAction: 'merge_duplicates',
        bestMatch,
      };
    } else {
      // Single low-confidence match - create new but show potential duplicate
      return {
        matches,
        suggestedAction: 'create_new',
        bestMatch,
      };
    }
  }

  /**
   * Performs fuzzy matching across all profiles to find duplicates
   */
  async findDuplicates(orgId: string): Promise<FuzzyMatchResult> {
    const { data: allProfiles, error } = await this.supabase
      .from('journalist_profiles')
      .select()
      .eq('org_id', orgId);

    if (error) throw error;
    if (!allProfiles || allProfiles.length === 0) {
      return {
        score: 1.0,
        matches: [],
        suggestedMerges: [],
      };
    }

    const suggestedMerges: Array<{
      journalist1Id: string;
      journalist2Id: string;
      matchScore: number;
      reason: string;
    }> = [];

    // Compare each profile with every other profile
    for (let i = 0; i < allProfiles.length; i++) {
      for (let j = i + 1; j < allProfiles.length; j++) {
        const profile1 = allProfiles[i];
        const profile2 = allProfiles[j];

        let matchScore = 0;
        const reasons: string[] = [];

        // Email comparison
        const email1 = normalizeEmail(profile1.primary_email);
        const email2 = normalizeEmail(profile2.primary_email);
        if (email1 === email2) {
          matchScore += 0.5;
          reasons.push('Same email');
        }

        // Name comparison
        const name1 = normalizeName(profile1.full_name);
        const name2 = normalizeName(profile2.full_name);
        const nameSim = stringSimilarity(name1, name2);
        if (nameSim > 0.8) {
          matchScore += nameSim * 0.5;
          reasons.push(`Similar names (${(nameSim * 100).toFixed(0)}%)`);
        }

        // Suggest merge if score > 0.7
        if (matchScore > 0.7) {
          suggestedMerges.push({
            journalist1Id: profile1.id,
            journalist2Id: profile2.id,
            matchScore,
            reason: reasons.join(', '),
          });
        }
      }
    }

    // Calculate overall duplicate score
    const duplicateScore =
      suggestedMerges.length === 0
        ? 1.0
        : 1.0 - Math.min(suggestedMerges.length / allProfiles.length, 1.0);

    return {
      score: duplicateScore,
      matches: [],
      suggestedMerges,
    };
  }

  /**
   * Merges two journalist profiles
   */
  async mergeProfiles(orgId: string, input: MergeProfilesInput, userId?: string): Promise<{
    survivingProfile: JournalistProfile;
    mergeMapId: string;
  }> {
    if (!input.survivingJournalistId || !input.mergedJournalistId) {
      throw new Error('Both survivingJournalistId and mergedJournalistId are required');
    }

    // Get both profiles
    const surviving = await this.getProfile(input.survivingJournalistId, orgId);
    const merged = await this.getProfile(input.mergedJournalistId, orgId);

    if (!surviving || !merged) {
      throw new Error('One or both profiles not found');
    }

    // Create merge map record
    const { data: mergeMap, error: mergeError } = await this.supabase
      .from('journalist_merge_map')
      .insert({
        org_id: orgId,
        surviving_journalist_id: input.survivingJournalistId,
        merged_journalist_id: input.mergedJournalistId,
        merge_reason: input.mergeReason,
        merged_by: userId || null,
        original_data: merged,
      })
      .select()
      .single();

    if (mergeError) throw mergeError;

    // Merge secondary emails
    const combinedEmails = Array.from(
      new Set([...surviving.secondaryEmails, merged.primaryEmail, ...merged.secondaryEmails])
    ).filter((email) => email !== surviving.primaryEmail);

    // Update surviving profile with merged data
    await this.updateProfile(input.survivingJournalistId, orgId, {
      secondaryEmails: combinedEmails,
      // Preserve other fields from surviving profile
    });

    // Update all activities to point to surviving profile
    await this.supabase
      .from('journalist_activity_log')
      .update({ journalist_id: input.survivingJournalistId })
      .eq('journalist_id', input.mergedJournalistId)
      .eq('org_id', orgId);

    // Delete merged profile
    await this.deleteProfile(input.mergedJournalistId, orgId);

    // Recalculate scores for surviving profile
    await this.updateScores(input.survivingJournalistId, orgId);

    const updatedProfile = await this.getProfile(input.survivingJournalistId, orgId);

    return {
      survivingProfile: updatedProfile!,
      mergeMapId: mergeMap.id,
    };
  }

  // =============================================
  // Activity Management
  // =============================================

  /**
   * Creates an activity log entry
   */
  async createActivity(orgId: string, input: CreateActivityInput): Promise<JournalistActivity> {
    const { data, error } = await this.supabase
      .from('journalist_activity_log')
      .insert({
        org_id: orgId,
        journalist_id: input.journalistId,
        activity_type: input.activityType,
        source_system: input.sourceSystem,
        source_id: input.sourceId || null,
        activity_data: input.activityData || {},
        sentiment: input.sentiment || null,
        occurred_at: input.occurredAt || new Date(),
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) throw error;

    // Update journalist's last_activity_at
    await this.supabase
      .from('journalist_profiles')
      .update({ last_activity_at: data.occurred_at })
      .eq('id', input.journalistId)
      .eq('org_id', orgId);

    return this.mapDbActivityToActivity(data);
  }

  /**
   * Lists activities with filters
   */
  async listActivities(
    orgId: string,
    query: ListActivitiesQuery
  ): Promise<{ activities: JournalistActivity[]; total: number }> {
    let dbQuery = this.supabase
      .from('journalist_activity_log')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.journalistId) {
      dbQuery = dbQuery.eq('journalist_id', query.journalistId);
    }

    if (query.activityType) {
      if (Array.isArray(query.activityType)) {
        dbQuery = dbQuery.in('activity_type', query.activityType);
      } else {
        dbQuery = dbQuery.eq('activity_type', query.activityType);
      }
    }

    if (query.sourceSystem) {
      if (Array.isArray(query.sourceSystem)) {
        dbQuery = dbQuery.in('source_system', query.sourceSystem);
      } else {
        dbQuery = dbQuery.eq('source_system', query.sourceSystem);
      }
    }

    if (query.sentiment) {
      dbQuery = dbQuery.eq('sentiment', query.sentiment);
    }

    if (query.startDate) {
      dbQuery = dbQuery.gte('occurred_at', query.startDate.toISOString());
    }

    if (query.endDate) {
      dbQuery = dbQuery.lte('occurred_at', query.endDate.toISOString());
    }

    // Apply pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    dbQuery = dbQuery.order('occurred_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    const activities = (data || []).map((a) => this.mapDbActivityToActivity(a));

    return {
      activities,
      total: count || 0,
    };
  }

  /**
   * Gets activity summary for a journalist
   */
  async getActivitySummary(
    journalistId: string,
    orgId: string
  ): Promise<JournalistActivitySummary> {
    const { data, error } = await this.supabase.rpc('get_journalist_activity_summary', {
      p_journalist_id: journalistId,
      p_org_id: orgId,
    });

    if (error) throw error;

    // data is an array with single row
    const summary = data[0];

    return {
      totalActivities: Number(summary.total_activities),
      totalOutreach: Number(summary.total_outreach),
      totalCoverage: Number(summary.total_coverage),
      totalMentions: Number(summary.total_mentions),
      totalEmailsSent: Number(summary.total_emails_sent),
      totalEmailsOpened: Number(summary.total_emails_opened),
      totalEmailsClicked: Number(summary.total_emails_clicked),
      totalEmailsReplied: Number(summary.total_emails_replied),
      firstActivityAt: summary.first_activity_at ? new Date(summary.first_activity_at) : null,
      lastActivityAt: summary.last_activity_at ? new Date(summary.last_activity_at) : null,
      positiveSentimentCount: Number(summary.positive_sentiment_count),
      negativeSentimentCount: Number(summary.negative_sentiment_count),
      neutralSentimentCount: Number(summary.neutral_sentiment_count),
    };
  }

  // =============================================
  // Scoring Models
  // =============================================

  /**
   * Calculates engagement score for a journalist
   */
  async calculateEngagementScore(
    journalistId: string,
    orgId: string
  ): Promise<JournalistEngagementModel> {
    const summary = await this.getActivitySummary(journalistId, orgId);

    const responseRate =
      summary.totalEmailsSent > 0 ? summary.totalEmailsReplied / summary.totalEmailsSent : 0;
    const coverageRate =
      summary.totalOutreach > 0 ? summary.totalCoverage / summary.totalOutreach : 0;
    const openRate =
      summary.totalEmailsSent > 0 ? summary.totalEmailsOpened / summary.totalEmailsSent : 0;
    const activityVolume = Math.min(summary.totalActivities / 100, 1.0);

    // Weighted formula: response (40%) + coverage (30%) + open (20%) + volume (10%)
    const engagementScore = responseRate * 0.4 + coverageRate * 0.3 + openRate * 0.2 + activityVolume * 0.1;

    return {
      journalistId,
      engagementScore: Math.max(0, Math.min(1, engagementScore)),
      components: {
        responseRate,
        coverageRate,
        openRate,
        activityVolume,
      },
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculates responsiveness score for a journalist
   */
  async calculateResponsivenessScore(
    journalistId: string,
    orgId: string
  ): Promise<JournalistResponsivenessModel> {
    const summary = await this.getActivitySummary(journalistId, orgId);

    const replyRate =
      summary.totalEmailsSent > 0 ? summary.totalEmailsReplied / summary.totalEmailsSent : 0;
    // openRate available: summary.totalEmailsOpened / summary.totalEmailsSent (for V2)

    // V1 stub: simplified responsiveness (no time-to-respond data yet)
    const responsivenessScore = replyRate;

    return {
      journalistId,
      responsivenessScore: Math.max(0, Math.min(1, responsivenessScore)),
      averageResponseTime: undefined, // V1 stub
      replyRate,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculates relevance score for a journalist (V1 stub)
   */
  async calculateRelevanceScore(
    journalistId: string,
    _orgId: string
  ): Promise<JournalistRelevanceModel> {
    // V1 stub: returns default relevance score
    // Future: integrate with S12 content intelligence to match topics
    return {
      journalistId,
      relevanceScore: 0.5, // Default neutral score
      topicMatches: [],
      beatAlignment: 0.5,
      outletAlignment: 0.5,
      calculatedAt: new Date(),
    };
  }

  /**
   * Updates all scores for a journalist
   */
  async updateScores(
    journalistId: string,
    orgId: string
  ): Promise<{
    engagementScore: number;
    responsivenessScore: number;
    relevanceScore: number;
  }> {
    // Call database function to update scores
    const { error } = await this.supabase.rpc('update_journalist_scores', {
      p_journalist_id: journalistId,
      p_org_id: orgId,
    });

    if (error) throw error;

    // Get updated profile
    const profile = await this.getProfile(journalistId, orgId);

    return {
      engagementScore: profile?.engagementScore || 0,
      responsivenessScore: profile?.responsivenessScore || 0,
      relevanceScore: profile?.relevanceScore || 0,
    };
  }

  // =============================================
  // Tier Classification
  // =============================================

  /**
   * Classifies journalist into tier (A/B/C/D)
   */
  async classifyTier(
    journalistId: string,
    orgId: string
  ): Promise<JournalistTierClassification> {
    const profile = await this.getProfile(journalistId, orgId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const summary = await this.getActivitySummary(journalistId, orgId);

    // Determine outlet tier (simplified V1)
    const outletTier = this.determineOutletTier(profile.primaryOutlet ?? null);

    // Determine engagement level
    const engagementLevel = this.determineEngagementLevel(profile.engagementScore);

    // Determine coverage frequency
    const coverageFrequency = this.determineCoverageFrequency(summary.totalCoverage);

    // Determine responsiveness level
    const responsivenessLevel = this.determineResponsivenessLevel(profile.responsivenessScore);

    // Calculate overall tier
    const tier = this.calculateOverallTier(
      outletTier,
      engagementLevel,
      coverageFrequency,
      responsivenessLevel
    );

    const tierReason = `${outletTier} outlet, ${engagementLevel} engagement, ${coverageFrequency} coverage, ${responsivenessLevel} responsiveness`;

    return {
      journalistId,
      tier,
      tierReason,
      criteria: {
        outletTier,
        engagementLevel,
        coverageFrequency,
        responsivenessLevel,
      },
      calculatedAt: new Date(),
    };
  }

  private determineOutletTier(outlet: string | null): string {
    // V1 stub: simplified tier logic
    // Future: integrate with outlet database
    if (!outlet) return 'tier3';

    const tier1Outlets = ['techcrunch', 'verge', 'wired', 'forbes', 'wsj'];
    const tier2Outlets = ['venturebeat', 'mashable', 'engadget'];

    const normalizedOutlet = outlet.toLowerCase();

    if (tier1Outlets.some((t) => normalizedOutlet.includes(t))) return 'tier1';
    if (tier2Outlets.some((t) => normalizedOutlet.includes(t))) return 'tier2';

    return 'tier3';
  }

  private determineEngagementLevel(score: number): string {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private determineCoverageFrequency(coverage: number): string {
    if (coverage >= 10) return 'frequent';
    if (coverage >= 3) return 'occasional';
    return 'rare';
  }

  private determineResponsivenessLevel(score: number): string {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }

  private calculateOverallTier(
    outletTier: string,
    engagementLevel: string,
    coverageFrequency: string,
    responsivenessLevel: string
  ): JournalistTier {
    // Simple tier calculation logic
    let tierScore = 0;

    // Outlet tier weight: 40%
    if (outletTier === 'tier1') tierScore += 40;
    else if (outletTier === 'tier2') tierScore += 25;
    else tierScore += 10;

    // Engagement weight: 30%
    if (engagementLevel === 'high') tierScore += 30;
    else if (engagementLevel === 'medium') tierScore += 20;
    else tierScore += 10;

    // Coverage weight: 20%
    if (coverageFrequency === 'frequent') tierScore += 20;
    else if (coverageFrequency === 'occasional') tierScore += 12;
    else tierScore += 5;

    // Responsiveness weight: 10%
    if (responsivenessLevel === 'high') tierScore += 10;
    else if (responsivenessLevel === 'medium') tierScore += 6;
    else tierScore += 3;

    // Map score to tier
    if (tierScore >= 80) return 'A';
    if (tierScore >= 60) return 'B';
    if (tierScore >= 40) return 'C';
    return 'D';
  }

  // =============================================
  // Graph Builder
  // =============================================

  /**
   * Builds journalist graph with nodes and edges
   */
  async buildGraph(orgId: string, query: GraphQuery): Promise<JournalistGraph> {
    const nodes: JournalistGraphNode[] = [];
    const edges: JournalistGraphEdge[] = [];

    // Get journalists to include in graph
    const journalistIds = query.journalistIds || [];
    let journalists: JournalistProfile[] = [];

    if (journalistIds.length > 0) {
      // Get specific journalists
      const promises = journalistIds.map((id) => this.getProfile(id, orgId));
      const results = await Promise.all(promises);
      journalists = results.filter((p) => p !== null) as JournalistProfile[];
    } else {
      // Get top journalists by engagement
      const { profiles } = await this.listProfiles(orgId, {
        sortBy: 'engagement_score',
        sortOrder: 'desc',
        limit: 20,
      });
      journalists = profiles;
    }

    // Add journalist nodes
    for (const journalist of journalists) {
      nodes.push({
        id: journalist.id,
        type: 'journalist',
        data: {
          fullName: journalist.fullName,
          email: journalist.primaryEmail,
          outlet: journalist.primaryOutlet,
          beat: journalist.beat,
          engagementScore: journalist.engagementScore,
        },
      });

      // Add outlet nodes and edges
      if (query.includeOutlets && journalist.primaryOutlet) {
        const outletId = `outlet-${journalist.primaryOutlet.toLowerCase().replace(/\s+/g, '-')}`;

        // Add outlet node if not exists
        if (!nodes.find((n) => n.id === outletId)) {
          nodes.push({
            id: outletId,
            type: 'outlet',
            data: {
              name: journalist.primaryOutlet,
            },
          });
        }

        // Add edge from journalist to outlet
        edges.push({
          source: journalist.id,
          target: outletId,
          type: 'works_for',
          weight: 1.0,
        });
      }

      // Add coverage nodes and edges
      if (query.includeCoverage) {
        const summary = await this.getActivitySummary(journalist.id, orgId);
        if (summary.totalCoverage > 0) {
          const coverageNodeId = `coverage-${journalist.id}`;
          nodes.push({
            id: coverageNodeId,
            type: 'coverage',
            data: {
              count: summary.totalCoverage,
              label: `${summary.totalCoverage} articles`,
            },
          });

          edges.push({
            source: journalist.id,
            target: coverageNodeId,
            type: 'wrote_about',
            weight: Math.min(summary.totalCoverage / 10, 1.0),
          });
        }
      }

      // Add outreach nodes and edges
      if (query.includeOutreach) {
        const summary = await this.getActivitySummary(journalist.id, orgId);
        if (summary.totalOutreach > 0) {
          const outreachNodeId = `outreach-${journalist.id}`;
          nodes.push({
            id: outreachNodeId,
            type: 'outreach',
            data: {
              count: summary.totalOutreach,
              label: `${summary.totalOutreach} pitches`,
              responseRate:
                summary.totalEmailsSent > 0
                  ? summary.totalEmailsReplied / summary.totalEmailsSent
                  : 0,
            },
          });

          edges.push({
            source: journalist.id,
            target: outreachNodeId,
            type: 'received_outreach',
            weight: Math.min(summary.totalOutreach / 20, 1.0),
          });
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        centerJournalistId: journalists[0]?.id,
        generatedAt: new Date(),
      },
    };
  }

  /**
   * Gets enriched profile with all related data
   */
  async getEnrichedProfile(
    journalistId: string,
    orgId: string
  ): Promise<EnrichedJournalistProfile> {
    const profile = await this.getProfile(journalistId, orgId);
    if (!profile) {
      throw new Error('Profile not found');
    }

    const [activitySummary, recentActivities, engagementModel, responsivenessModel, relevanceModel] =
      await Promise.all([
        this.getActivitySummary(journalistId, orgId),
        this.listActivities(orgId, { journalistId, limit: 10 }).then((r) => r.activities),
        this.calculateEngagementScore(journalistId, orgId),
        this.calculateResponsivenessScore(journalistId, orgId),
        this.calculateRelevanceScore(journalistId, orgId),
      ]);

    // Get merge history
    const { data: mergeHistory } = await this.supabase
      .from('journalist_merge_map')
      .select()
      .eq('surviving_journalist_id', journalistId)
      .eq('org_id', orgId);

    return {
      ...profile,
      activitySummary,
      recentActivities,
      engagementModel,
      responsivenessModel,
      relevanceModel,
      mergeHistory: (mergeHistory || []).map((m) => ({
        id: m.id,
        orgId: m.org_id,
        survivingJournalistId: m.surviving_journalist_id,
        mergedJournalistId: m.merged_journalist_id,
        mergeReason: m.merge_reason,
        mergedAt: new Date(m.merged_at),
        mergedBy: m.merged_by,
        originalData: m.original_data,
        createdAt: new Date(m.created_at),
      })),
    };
  }

  // =============================================
  // Batch Operations
  // =============================================

  /**
   * Creates multiple activities in batch
   */
  async batchCreateActivities(
    orgId: string,
    activities: CreateActivityInput[]
  ): Promise<{ created: number; failed: number }> {
    let created = 0;
    let failed = 0;

    for (const activity of activities) {
      try {
        await this.createActivity(orgId, activity);
        created++;
      } catch {
        failed++;
      }
    }

    return { created, failed };
  }

  /**
   * Updates scores for multiple journalists in batch
   */
  async batchUpdateScores(
    orgId: string,
    journalistIds: string[]
  ): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;

    for (const journalistId of journalistIds) {
      try {
        await this.updateScores(journalistId, orgId);
        updated++;
      } catch {
        failed++;
      }
    }

    return { updated, failed };
  }

  // =============================================
  // Mapping Utilities
  // =============================================

  private mapDbProfileToProfile(dbProfile: any): JournalistProfile {
    return {
      id: dbProfile.id,
      orgId: dbProfile.org_id,
      fullName: dbProfile.full_name,
      primaryEmail: dbProfile.primary_email,
      secondaryEmails: dbProfile.secondary_emails || [],
      primaryOutlet: dbProfile.primary_outlet,
      secondaryOutlets: dbProfile.secondary_outlets || [],
      beat: dbProfile.beat,
      twitterHandle: dbProfile.twitter_handle,
      linkedinUrl: dbProfile.linkedin_url,
      websiteUrl: dbProfile.website_url,
      lastActivityAt: dbProfile.last_activity_at ? new Date(dbProfile.last_activity_at) : undefined,
      engagementScore: dbProfile.engagement_score || 0,
      responsivenessScore: dbProfile.responsiveness_score || 0,
      relevanceScore: dbProfile.relevance_score || 0,
      tags: dbProfile.tags || [],
      metadata: dbProfile.metadata || {},
      createdAt: new Date(dbProfile.created_at),
      updatedAt: new Date(dbProfile.updated_at),
    };
  }

  private mapDbActivityToActivity(dbActivity: any): JournalistActivity {
    return {
      id: dbActivity.id,
      orgId: dbActivity.org_id,
      journalistId: dbActivity.journalist_id,
      activityType: dbActivity.activity_type as ActivityType,
      sourceSystem: dbActivity.source_system as SourceSystem,
      sourceId: dbActivity.source_id,
      activityData: dbActivity.activity_data || {},
      sentiment: dbActivity.sentiment as Sentiment | undefined,
      occurredAt: new Date(dbActivity.occurred_at),
      createdAt: new Date(dbActivity.created_at),
      metadata: dbActivity.metadata || {},
    };
  }
}

/**
 * Factory function to create service instance
 */
export function createJournalistGraphService(supabase: SupabaseClient): JournalistGraphService {
  return new JournalistGraphService(supabase);
}
