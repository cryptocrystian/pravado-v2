/**
 * Journalist Discovery Service (Sprint S48)
 * Automated discovery and enrichment of journalists from multiple sources
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AuthorExtractionInput,
  AuthorExtractionResult,
  BatchDiscoveryResult,
  DeduplicationResult,
  DiscoveredJournalist,
  DiscoveredJournalistInput,
  DiscoveryConfidenceBreakdown,
  DiscoveryListResponse,
  DiscoveryQuery,
  DiscoveryStats,
  FuzzyMatchOptions,
  MergePreview,
  ResolveDiscoveryInput,
  SocialProfileInput,
  SuggestedMatch,
} from '@pravado/types';
import { JournalistGraphService } from './journalistGraphService';

// =============================================
// String Similarity Utilities
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

/**
 * Validates email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Extracts domain from email
 */
function extractEmailDomain(email: string): string | null {
  const match = email.match(/@([^\s@]+)$/);
  return match ? match[1].toLowerCase() : null;
}

// =============================================
// Service Class
// =============================================

export class JournalistDiscoveryService {
  private graphService: JournalistGraphService;

  constructor(private supabase: SupabaseClient) {
    this.graphService = new JournalistGraphService(supabase);
  }

  // =============================================
  // Discovery Creation
  // =============================================

  /**
   * Creates a new discovered journalist entry
   */
  async createDiscovery(
    orgId: string,
    input: DiscoveredJournalistInput
  ): Promise<DiscoveredJournalist> {
    // Calculate confidence breakdown
    const confidenceBreakdown = this.calculateConfidenceBreakdown(input);

    // Find potential duplicates in discovery table (side effect: populates cache)
    await this.findDuplicateDiscoveries(orgId, input);

    // Find potential matches in journalist graph (S46)
    const graphMatches = await this.findGraphMatches(orgId, input);

    // Combine all suggested matches
    const suggestedMatches = [...graphMatches];

    const { data, error } = await this.supabase
      .from('discovered_journalists')
      .insert({
        org_id: orgId,
        full_name: input.fullName,
        email: input.email || null,
        outlet: input.outlet || null,
        social_links: input.socialLinks || {},
        beats: input.beats || [],
        bio: input.bio || null,
        confidence_score: confidenceBreakdown.overallScore,
        confidence_breakdown: confidenceBreakdown,
        source_type: input.sourceType,
        source_url: input.sourceUrl || null,
        raw_payload: input.rawPayload || {},
        status: 'pending',
        suggested_matches: suggestedMatches,
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapDbDiscoveryToDiscovery(data);
  }

  /**
   * Gets a discovered journalist by ID
   */
  async getDiscovery(
    discoveryId: string,
    orgId: string
  ): Promise<DiscoveredJournalist | null> {
    const { data, error } = await this.supabase
      .from('discovered_journalists')
      .select()
      .eq('id', discoveryId)
      .eq('org_id', orgId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapDbDiscoveryToDiscovery(data);
  }

  /**
   * Lists discovered journalists with filters
   */
  async listDiscoveries(
    orgId: string,
    query: DiscoveryQuery
  ): Promise<DiscoveryListResponse> {
    let dbQuery = this.supabase
      .from('discovered_journalists')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.q) {
      dbQuery = dbQuery.or(
        `full_name.ilike.%${query.q}%,email.ilike.%${query.q}%,outlet.ilike.%${query.q}%`
      );
    }

    if (query.status) {
      if (Array.isArray(query.status)) {
        dbQuery = dbQuery.in('status', query.status);
      } else {
        dbQuery = dbQuery.eq('status', query.status);
      }
    }

    if (query.sourceType) {
      if (Array.isArray(query.sourceType)) {
        dbQuery = dbQuery.in('source_type', query.sourceType);
      } else {
        dbQuery = dbQuery.eq('source_type', query.sourceType);
      }
    }

    if (query.minConfidenceScore !== undefined) {
      dbQuery = dbQuery.gte('confidence_score', query.minConfidenceScore);
    }

    if (query.beats && query.beats.length > 0) {
      dbQuery = dbQuery.contains('beats', query.beats);
    }

    if (query.hasEmail !== undefined) {
      if (query.hasEmail) {
        dbQuery = dbQuery.not('email', 'is', null);
      } else {
        dbQuery = dbQuery.is('email', null);
      }
    }

    if (query.hasSocialLinks !== undefined) {
      if (query.hasSocialLinks) {
        dbQuery = dbQuery.not('social_links', 'eq', '{}');
      } else {
        dbQuery = dbQuery.eq('social_links', '{}');
      }
    }

    // Apply sorting
    const sortColumn = query.sortBy || 'created_at';
    const sortOrder = query.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    dbQuery = dbQuery.order(sortColumn, sortOrder);

    // Apply pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    dbQuery = dbQuery.range(offset, offset + limit - 1);

    const { data, error, count } = await dbQuery;

    if (error) throw error;

    const discoveries = (data || []).map((d) => this.mapDbDiscoveryToDiscovery(d));

    // Optionally include stats
    let stats: DiscoveryStats | undefined;
    if (query.offset === 0) {
      // Only fetch stats on first page
      stats = await this.getDiscoveryStats(orgId);
    }

    return {
      discoveries,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
      stats,
    };
  }

  /**
   * Updates a discovered journalist
   */
  async updateDiscovery(
    discoveryId: string,
    orgId: string,
    updates: Partial<DiscoveredJournalistInput>
  ): Promise<DiscoveredJournalist | null> {
    const updateData: any = {};

    if (updates.fullName !== undefined) updateData.full_name = updates.fullName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.outlet !== undefined) updateData.outlet = updates.outlet;
    if (updates.socialLinks !== undefined) updateData.social_links = updates.socialLinks;
    if (updates.beats !== undefined) updateData.beats = updates.beats;
    if (updates.bio !== undefined) updateData.bio = updates.bio;

    // Recalculate confidence if data changed
    if (Object.keys(updateData).length > 0) {
      const existing = await this.getDiscovery(discoveryId, orgId);
      if (!existing) return null;

      const updatedInput: DiscoveredJournalistInput = {
        fullName: updates.fullName ?? existing.fullName,
        email: updates.email ?? existing.email,
        outlet: updates.outlet ?? existing.outlet,
        socialLinks: updates.socialLinks ?? existing.socialLinks,
        beats: updates.beats ?? existing.beats,
        bio: updates.bio ?? existing.bio,
        sourceType: existing.sourceType,
        sourceUrl: existing.sourceUrl,
        rawPayload: existing.rawPayload,
      };

      const confidenceBreakdown = this.calculateConfidenceBreakdown(updatedInput);
      updateData.confidence_score = confidenceBreakdown.overallScore;
      updateData.confidence_breakdown = confidenceBreakdown;
    }

    const { data, error } = await this.supabase
      .from('discovered_journalists')
      .update(updateData)
      .eq('id', discoveryId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapDbDiscoveryToDiscovery(data);
  }

  /**
   * Deletes a discovered journalist
   */
  async deleteDiscovery(discoveryId: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('discovered_journalists')
      .delete()
      .eq('id', discoveryId)
      .eq('org_id', orgId);

    if (error) throw error;
  }

  // =============================================
  // Discovery Resolution (Merge/Confirm/Reject)
  // =============================================

  /**
   * Resolves a discovery by merging, confirming, or rejecting
   */
  async resolveDiscovery(
    discoveryId: string,
    orgId: string,
    userId: string,
    input: ResolveDiscoveryInput
  ): Promise<DiscoveredJournalist> {
    const discovery = await this.getDiscovery(discoveryId, orgId);
    if (!discovery) {
      throw new Error('Discovery not found');
    }

    if (discovery.status !== 'pending' && discovery.status !== 'confirmed') {
      throw new Error('Discovery already resolved');
    }

    const updateData: any = {
      resolved_by: userId,
      resolved_at: new Date(),
      resolution_notes: input.notes || null,
    };

    if (input.action === 'merge') {
      if (!input.targetJournalistId) {
        throw new Error('targetJournalistId is required for merge action');
      }

      // Merge into existing journalist profile (S46)
      await this.mergeIntoGraph(discovery, input.targetJournalistId, orgId, userId);

      updateData.status = 'merged';
      updateData.merged_into = input.targetJournalistId;
    } else if (input.action === 'confirm') {
      // Mark as confirmed (ready to create new journalist profile)
      updateData.status = 'confirmed';
    } else if (input.action === 'reject') {
      // Mark as rejected (not a journalist or invalid)
      updateData.status = 'rejected';
    }

    const { data, error } = await this.supabase
      .from('discovered_journalists')
      .update(updateData)
      .eq('id', discoveryId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;

    return this.mapDbDiscoveryToDiscovery(data);
  }

  /**
   * Generates a merge preview showing conflicts
   */
  async generateMergePreview(
    discoveryId: string,
    targetJournalistId: string,
    orgId: string
  ): Promise<MergePreview> {
    const discovery = await this.getDiscovery(discoveryId, orgId);
    if (!discovery) {
      throw new Error('Discovery not found');
    }

    const targetProfile = await this.graphService.getProfile(targetJournalistId, orgId);
    if (!targetProfile) {
      throw new Error('Target journalist not found');
    }

    const conflicts: Array<{
      field: string;
      discoveryValue: any;
      existingValue: any;
      recommendation: 'keep_existing' | 'use_discovery' | 'merge_both';
    }> = [];

    // Check email conflicts
    if (discovery.email && discovery.email !== targetProfile.primaryEmail) {
      const isNewSecondary = !targetProfile.secondaryEmails.includes(discovery.email);
      conflicts.push({
        field: 'email',
        discoveryValue: discovery.email,
        existingValue: targetProfile.primaryEmail,
        recommendation: isNewSecondary ? 'merge_both' : 'keep_existing',
      });
    }

    // Check outlet conflicts
    if (discovery.outlet && discovery.outlet !== targetProfile.primaryOutlet) {
      conflicts.push({
        field: 'outlet',
        discoveryValue: discovery.outlet,
        existingValue: targetProfile.primaryOutlet,
        recommendation: 'keep_existing',
      });
    }

    // Check beat conflicts
    if (discovery.beats.length > 0 && discovery.beats[0] !== targetProfile.beat) {
      conflicts.push({
        field: 'beat',
        discoveryValue: discovery.beats,
        existingValue: targetProfile.beat,
        recommendation: 'merge_both',
      });
    }

    // Check social links conflicts
    if (discovery.socialLinks.twitter && discovery.socialLinks.twitter !== targetProfile.twitterHandle) {
      conflicts.push({
        field: 'twitterHandle',
        discoveryValue: discovery.socialLinks.twitter,
        existingValue: targetProfile.twitterHandle,
        recommendation: targetProfile.twitterHandle ? 'keep_existing' : 'use_discovery',
      });
    }

    if (discovery.socialLinks.linkedin && discovery.socialLinks.linkedin !== targetProfile.linkedinUrl) {
      conflicts.push({
        field: 'linkedinUrl',
        discoveryValue: discovery.socialLinks.linkedin,
        existingValue: targetProfile.linkedinUrl,
        recommendation: targetProfile.linkedinUrl ? 'keep_existing' : 'use_discovery',
      });
    }

    const autoResolvable = conflicts.every(
      (c) => c.recommendation === 'keep_existing' || c.recommendation === 'merge_both'
    );

    return {
      discoveryId,
      targetJournalistId,
      conflicts,
      autoResolvable,
    };
  }

  // =============================================
  // Author Extraction (S40/S41 Integration)
  // =============================================

  /**
   * Extracts journalist authors from article content
   */
  async extractAuthorsFromArticle(
    _orgId: string,
    input: AuthorExtractionInput
  ): Promise<AuthorExtractionResult> {
    // V1: Simple heuristic extraction
    // V2: Could use LLM for better extraction

    const authors: DiscoveredJournalistInput[] = [];
    const extractedBeats: string[] = [];

    // Try to extract author from article metadata or content
    // This is a simplified implementation - production would use more sophisticated parsing

    // Common patterns for author attribution
    const bylinePatterns = [
      /By\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /Written by\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,
      /Author:\s+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    ];

    let authorName: string | null = null;

    // Try each pattern
    for (const pattern of bylinePatterns) {
      const match = input.articleContent.match(pattern);
      if (match && match[1]) {
        authorName = match[1];
        break;
      }
    }

    // Also check title for author mentions
    if (!authorName) {
      const titleMatch = input.articleTitle.match(/By\s+([A-Z][a-z]+ [A-Z][a-z]+)/i);
      if (titleMatch && titleMatch[1]) {
        authorName = titleMatch[1];
      }
    }

    if (authorName) {
      // Try to infer email from outlet domain
      let email: string | undefined;
      if (input.outlet) {
        const outletDomain = this.inferOutletDomain(input.outlet);
        if (outletDomain) {
          // Generate potential email (firstname.lastname@domain)
          const nameParts = authorName.toLowerCase().split(' ');
          if (nameParts.length >= 2) {
            email = `${nameParts[0]}.${nameParts[nameParts.length - 1]}@${outletDomain}`;
          }
        }
      }

      // Try to extract beats from article content
      const potentialBeats = this.extractBeatsFromContent(input.articleContent, input.articleTitle);
      extractedBeats.push(...potentialBeats);

      authors.push({
        fullName: authorName,
        email,
        outlet: input.outlet,
        beats: potentialBeats,
        sourceType: 'article_author',
        sourceUrl: input.articleUrl,
        rawPayload: {
          articleTitle: input.articleTitle,
          articleUrl: input.articleUrl,
          publishedDate: input.publishedDate,
          metadata: input.metadata,
        },
      });
    }

    // Calculate extraction confidence
    const confidence = authorName ? 0.75 : 0.0;
    const extractionMethod = authorName ? 'byline_pattern_match' : 'no_author_found';

    return {
      authors,
      confidence,
      extractionMethod,
      metadata: {
        articleTitle: input.articleTitle,
        articleUrl: input.articleUrl,
        outlet: input.outlet,
        extractedBeats,
      },
    };
  }

  /**
   * Processes authors from S40/S41 monitored articles (batch)
   */
  async processArticleBatch(
    orgId: string,
    articles: AuthorExtractionInput[]
  ): Promise<BatchDiscoveryResult> {
    const result: BatchDiscoveryResult = {
      created: 0,
      merged: 0,
      skipped: 0,
      errors: [],
    };

    for (let i = 0; i < articles.length; i++) {
      try {
        const extractionResult = await this.extractAuthorsFromArticle(orgId, articles[i]);

        for (const author of extractionResult.authors) {
          // Check for duplicates
          const dedup = await this.checkDuplication(orgId, author);

          if (dedup.isDuplicate && dedup.recommendation === 'merge') {
            // Auto-merge if high confidence
            if (dedup.matchedJournalistId) {
              await this.createDiscovery(orgId, author);
              result.merged++;
            } else {
              result.skipped++;
            }
          } else {
            // Create new discovery
            await this.createDiscovery(orgId, author);
            result.created++;
          }
        }
      } catch (error: any) {
        result.errors.push({
          index: i,
          error: error.message,
          input: articles[i] as any, // Type assertion for compatibility
        });
      }
    }

    return result;
  }

  // =============================================
  // Social Profile Ingestion (Stubbed)
  // =============================================

  /**
   * Ingests a social profile as a discovery candidate
   * Note: V1 is stubbed - no external HTTP requests
   */
  async ingestSocialProfile(
    orgId: string,
    input: SocialProfileInput
  ): Promise<DiscoveredJournalist> {
    // Extract journalist info from profile
    const discoveryInput: DiscoveredJournalistInput = {
      fullName: input.displayName || input.handle,
      socialLinks: {
        [input.platform]: input.profileUrl,
      },
      bio: input.bio,
      sourceType: 'social_profile',
      sourceUrl: input.profileUrl,
      rawPayload: {
        platform: input.platform,
        handle: input.handle,
        followers: input.followers,
        metadata: input.metadata,
      },
    };

    return this.createDiscovery(orgId, discoveryInput);
  }

  // =============================================
  // Deduplication & Matching
  // =============================================

  /**
   * Finds duplicate discoveries in the discovery table
   */
  private async findDuplicateDiscoveries(
    orgId: string,
    input: DiscoveredJournalistInput
  ): Promise<string[]> {
    // Use database function for fuzzy matching
    const { data, error } = await this.supabase.rpc('find_duplicate_discoveries', {
      p_org_id: orgId,
      p_full_name: input.fullName,
      p_email: input.email || null,
      p_outlet: input.outlet || null,
    });

    if (error) {
      console.error('Error finding duplicates:', error);
      return [];
    }

    return (data || [])
      .filter((d: any) => d.similarity_score > 0.7)
      .map((d: any) => d.discovery_id);
  }

  /**
   * Finds matching journalists in the S46 graph
   */
  private async findGraphMatches(
    orgId: string,
    input: DiscoveredJournalistInput
  ): Promise<SuggestedMatch[]> {
    const matches: SuggestedMatch[] = [];

    // Get all journalist profiles for this org
    const { data: profiles, error } = await this.supabase
      .from('journalist_profiles')
      .select('id, full_name, primary_email, primary_outlet')
      .eq('org_id', orgId);

    if (error || !profiles) return matches;

    for (const profile of profiles) {
      let similarityScore = 0;
      const reasons: string[] = [];

      // Email matching (highest confidence)
      if (input.email && profile.primary_email) {
        const email1 = normalizeEmail(input.email);
        const email2 = normalizeEmail(profile.primary_email);
        if (email1 === email2) {
          similarityScore += 0.5;
          reasons.push('Exact email match');
        }
      }

      // Name matching
      const name1 = normalizeName(input.fullName);
      const name2 = normalizeName(profile.full_name);
      const nameSim = stringSimilarity(name1, name2);
      if (nameSim > 0.8) {
        similarityScore += nameSim * 0.5;
        reasons.push(`Similar name (${(nameSim * 100).toFixed(0)}%)`);
      }

      // Outlet matching (bonus)
      if (input.outlet && profile.primary_outlet) {
        const outlet1 = input.outlet.toLowerCase();
        const outlet2 = profile.primary_outlet.toLowerCase();
        if (outlet1.includes(outlet2) || outlet2.includes(outlet1)) {
          similarityScore += 0.1;
          reasons.push('Same outlet');
        }
      }

      // Add to matches if score is significant
      if (similarityScore > 0.7) {
        matches.push({
          journalistId: profile.id,
          journalistName: profile.full_name,
          similarityScore,
          matchReason: reasons.join(', '),
          confidence: similarityScore,
        });
      }
    }

    // Sort by similarity score descending
    matches.sort((a, b) => b.similarityScore - a.similarityScore);

    return matches.slice(0, 5); // Return top 5 matches
  }

  /**
   * Checks if a discovery is a duplicate
   */
  async checkDuplication(
    orgId: string,
    input: DiscoveredJournalistInput,
    _options?: FuzzyMatchOptions
  ): Promise<DeduplicationResult> {
    const graphMatches = await this.findGraphMatches(orgId, input);

    if (graphMatches.length === 0) {
      return {
        isDuplicate: false,
        similarityScore: 0,
        matchedFields: [],
        recommendation: 'create_new',
      };
    }

    const topMatch = graphMatches[0];
    const matchedFields: string[] = [];

    if (topMatch.matchReason.includes('email')) matchedFields.push('email');
    if (topMatch.matchReason.includes('name')) matchedFields.push('name');
    if (topMatch.matchReason.includes('outlet')) matchedFields.push('outlet');

    let recommendation: 'merge' | 'create_new' | 'needs_review';
    if (topMatch.similarityScore >= 0.95) {
      recommendation = 'merge';
    } else if (topMatch.similarityScore >= 0.8) {
      recommendation = 'needs_review';
    } else {
      recommendation = 'create_new';
    }

    return {
      isDuplicate: topMatch.similarityScore >= 0.8,
      matchedJournalistId: topMatch.journalistId,
      similarityScore: topMatch.similarityScore,
      matchedFields,
      recommendation,
    };
  }

  // =============================================
  // Confidence Scoring
  // =============================================

  /**
   * Calculates multi-dimensional confidence breakdown
   */
  private calculateConfidenceBreakdown(
    input: DiscoveredJournalistInput
  ): DiscoveryConfidenceBreakdown {
    // Name confidence: based on length and completeness
    let nameConfidence = 0.5;
    if (input.fullName) {
      const nameParts = input.fullName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        nameConfidence = 0.9;
      } else if (nameParts.length === 1 && nameParts[0].length > 2) {
        nameConfidence = 0.6;
      }
    }

    // Email confidence: based on validity and professional domain
    let emailConfidence = 0.0;
    if (input.email) {
      if (isValidEmail(input.email)) {
        emailConfidence = 0.7;
        const domain = extractEmailDomain(input.email);
        if (domain && !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
          emailConfidence = 0.9; // Professional domain
        }
      }
    }

    // Outlet confidence: based on presence and known outlets
    let outletConfidence = 0.0;
    if (input.outlet) {
      outletConfidence = 0.6;
      const knownOutlets = [
        'techcrunch', 'verge', 'wired', 'forbes', 'wsj', 'nytimes',
        'venturebeat', 'mashable', 'engadget', 'bloomberg', 'reuters',
      ];
      const normalizedOutlet = input.outlet.toLowerCase();
      if (knownOutlets.some((o) => normalizedOutlet.includes(o))) {
        outletConfidence = 0.95;
      }
    }

    // Social confidence: based on number of social links
    let socialConfidence = 0.0;
    if (input.socialLinks) {
      const linkCount = Object.keys(input.socialLinks).filter(
        (k) => input.socialLinks![k]
      ).length;
      socialConfidence = Math.min(linkCount * 0.3, 1.0);
    }

    // Beat confidence: based on presence and specificity
    let beatConfidence = 0.0;
    if (input.beats && input.beats.length > 0) {
      beatConfidence = Math.min(0.5 + input.beats.length * 0.15, 1.0);
    }

    // Calculate weighted overall score
    const weights = {
      name: 0.25,
      email: 0.30,
      outlet: 0.20,
      social: 0.15,
      beat: 0.10,
    };

    const overallScore =
      nameConfidence * weights.name +
      emailConfidence * weights.email +
      outletConfidence * weights.outlet +
      socialConfidence * weights.social +
      beatConfidence * weights.beat;

    return {
      nameConfidence,
      emailConfidence,
      outletConfidence,
      socialConfidence,
      beatConfidence,
      overallScore,
    };
  }

  // =============================================
  // Statistics & Analytics
  // =============================================

  /**
   * Gets discovery statistics for an org
   */
  async getDiscoveryStats(orgId: string): Promise<DiscoveryStats> {
    const { data, error } = await this.supabase.rpc('get_discovery_stats', {
      p_org_id: orgId,
    });

    if (error) throw error;

    if (!data || data.length === 0) {
      return {
        totalDiscoveries: 0,
        pendingCount: 0,
        confirmedCount: 0,
        mergedCount: 0,
        rejectedCount: 0,
        avgConfidenceScore: 0,
        sourceTypeDistribution: {
          article_author: 0,
          rss_feed: 0,
          social_profile: 0,
          staff_directory: 0,
        },
      };
    }

    const stats = data[0];
    return {
      totalDiscoveries: Number(stats.total_discoveries),
      pendingCount: Number(stats.pending_count),
      confirmedCount: Number(stats.confirmed_count),
      mergedCount: Number(stats.merged_count),
      rejectedCount: Number(stats.rejected_count),
      avgConfidenceScore: Number(stats.avg_confidence_score) || 0,
      sourceTypeDistribution: stats.source_type_distribution || {
        article_author: 0,
        rss_feed: 0,
        social_profile: 0,
        staff_directory: 0,
      },
    };
  }

  // =============================================
  // Integration with S46 Journalist Graph
  // =============================================

  /**
   * Merges a discovery into an existing journalist profile
   */
  private async mergeIntoGraph(
    discovery: DiscoveredJournalist,
    targetJournalistId: string,
    orgId: string,
    _userId: string
  ): Promise<void> {
    // Get existing profile
    const profile = await this.graphService.getProfile(targetJournalistId, orgId);
    if (!profile) {
      throw new Error('Target journalist not found');
    }

    // Prepare updates
    const updates: any = {};

    // Add secondary email if new
    if (discovery.email && discovery.email !== profile.primaryEmail) {
      const newSecondaryEmails = Array.from(
        new Set([...profile.secondaryEmails, discovery.email])
      );
      updates.secondaryEmails = newSecondaryEmails;
    }

    // Update social links if missing
    if (discovery.socialLinks.twitter && !profile.twitterHandle) {
      updates.twitterHandle = discovery.socialLinks.twitter;
    }
    if (discovery.socialLinks.linkedin && !profile.linkedinUrl) {
      updates.linkedinUrl = discovery.socialLinks.linkedin;
    }

    // Update profile if there are changes
    if (Object.keys(updates).length > 0) {
      await this.graphService.updateProfile(targetJournalistId, orgId, updates);
    }

    // Create activity log for the discovery
    await this.graphService.createActivity(orgId, {
      journalistId: targetJournalistId,
      activityType: 'discovered',
      sourceSystem: 'discovery_engine',
      sourceId: discovery.id,
      activityData: {
        discoverySource: discovery.sourceType,
        confidenceScore: discovery.confidenceScore,
      },
      occurredAt: discovery.createdAt,
    });
  }

  // =============================================
  // Utility Methods
  // =============================================

  /**
   * Infers outlet domain from outlet name
   */
  private inferOutletDomain(outlet: string): string | null {
    const domainMap: Record<string, string> = {
      techcrunch: 'techcrunch.com',
      'the verge': 'theverge.com',
      wired: 'wired.com',
      forbes: 'forbes.com',
      'wall street journal': 'wsj.com',
      'new york times': 'nytimes.com',
      bloomberg: 'bloomberg.com',
      reuters: 'reuters.com',
      venturebeat: 'venturebeat.com',
      mashable: 'mashable.com',
      engadget: 'engadget.com',
    };

    const normalizedOutlet = outlet.toLowerCase();
    for (const [key, domain] of Object.entries(domainMap)) {
      if (normalizedOutlet.includes(key)) {
        return domain;
      }
    }

    return null;
  }

  /**
   * Extracts potential beats from article content
   */
  private extractBeatsFromContent(content: string, title: string): string[] {
    const beats: string[] = [];
    const beatKeywords: Record<string, string[]> = {
      technology: ['tech', 'software', 'hardware', 'ai', 'machine learning', 'cloud', 'saas'],
      business: ['business', 'enterprise', 'startup', 'funding', 'venture', 'ipo'],
      finance: ['finance', 'banking', 'fintech', 'payments', 'crypto', 'blockchain'],
      healthcare: ['health', 'medical', 'pharma', 'biotech', 'wellness'],
      politics: ['politics', 'government', 'policy', 'election', 'congress'],
      sports: ['sports', 'athletic', 'game', 'championship', 'league'],
      entertainment: ['entertainment', 'movie', 'music', 'celebrity', 'streaming'],
    };

    const combinedText = (title + ' ' + content).toLowerCase();

    for (const [beat, keywords] of Object.entries(beatKeywords)) {
      for (const keyword of keywords) {
        if (combinedText.includes(keyword)) {
          beats.push(beat);
          break;
        }
      }
    }

    return Array.from(new Set(beats)); // Remove duplicates
  }

  /**
   * Maps database record to DiscoveredJournalist type
   */
  private mapDbDiscoveryToDiscovery(data: any): DiscoveredJournalist {
    return {
      id: data.id,
      orgId: data.org_id,
      fullName: data.full_name,
      email: data.email || undefined,
      outlet: data.outlet || undefined,
      socialLinks: data.social_links || {},
      beats: data.beats || [],
      bio: data.bio || undefined,
      confidenceScore: data.confidence_score,
      confidenceBreakdown: data.confidence_breakdown || {
        nameConfidence: 0,
        emailConfidence: 0,
        outletConfidence: 0,
        socialConfidence: 0,
        beatConfidence: 0,
        overallScore: 0,
      },
      sourceType: data.source_type,
      sourceUrl: data.source_url || undefined,
      rawPayload: data.raw_payload || {},
      status: data.status,
      mergedInto: data.merged_into || undefined,
      resolvedBy: data.resolved_by || undefined,
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      resolutionNotes: data.resolution_notes || undefined,
      suggestedMatches: data.suggested_matches || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}

/**
 * Factory function to create service instance
 */
export function createJournalistDiscoveryService(supabase: SupabaseClient) {
  return new JournalistDiscoveryService(supabase);
}
