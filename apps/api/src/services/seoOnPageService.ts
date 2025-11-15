/**
 * SEO On-Page Optimization Service
 * Sprint S5: On-page audit engine foundation
 */

import type {
  SEOPageAudit,
  SEOPageIssue,
  SEOPage,
  SEOPageAuditWithIssues,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ListPageAuditsOptions {
  pageId?: string;
  auditType?: string;
  status?: 'pending' | 'completed' | 'failed';
  minScore?: number;
  maxScore?: number;
  limit?: number;
  offset?: number;
}

export class SEOOnPageService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get latest audit for a specific page with issues
   */
  async getPageAudit(
    orgId: string,
    pageId: string,
    auditType?: string
  ): Promise<SEOPageAuditWithIssues | null> {
    // Fetch page
    const { data: page, error: pageError } = await this.supabase
      .from('seo_pages')
      .select('*')
      .eq('id', pageId)
      .eq('org_id', orgId)
      .single();

    if (pageError || !page) {
      return null;
    }

    // Fetch latest audit for this page
    let auditQuery = this.supabase
      .from('seo_page_audits')
      .select('*')
      .eq('org_id', orgId)
      .eq('page_id', pageId)
      .order('snapshot_at', { ascending: false });

    if (auditType) {
      auditQuery = auditQuery.eq('audit_type', auditType);
    }

    const { data: audits } = await auditQuery.limit(1);

    // If no audit exists, generate one
    if (!audits || audits.length === 0) {
      return this.generateAudit(orgId, pageId, auditType || 'onpage', this.mapPageFromDb(page));
    }

    const audit = audits[0];

    // Fetch issues for this audit
    const { data: issues } = await this.supabase
      .from('seo_page_issues')
      .select('*')
      .eq('audit_id', audit.id)
      .eq('org_id', orgId)
      .order('severity', { ascending: false }); // high first

    const mappedAudit = this.mapAuditFromDb(audit);
    const mappedIssues = issues ? issues.map(this.mapIssueFromDb) : [];
    const recommendations = this.generateRecommendations(mappedIssues, this.mapPageFromDb(page));

    return {
      audit: mappedAudit,
      page: this.mapPageFromDb(page),
      issues: mappedIssues,
      recommendations,
    };
  }

  /**
   * List page audits with filtering
   */
  async listPageAudits(
    orgId: string,
    options: ListPageAuditsOptions = {}
  ): Promise<SEOPageAudit[]> {
    const {
      pageId,
      auditType,
      status,
      minScore,
      maxScore,
      limit = 20,
      offset = 0,
    } = options;

    let query = this.supabase
      .from('seo_page_audits')
      .select('*')
      .eq('org_id', orgId);

    if (pageId) {
      query = query.eq('page_id', pageId);
    }

    if (auditType) {
      query = query.eq('audit_type', auditType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (minScore !== undefined) {
      query = query.gte('score', minScore);
    }

    if (maxScore !== undefined) {
      query = query.lte('score', maxScore);
    }

    query = query
      .order('snapshot_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list page audits: ${error.message}`);
    }

    return data ? data.map(this.mapAuditFromDb) : [];
  }

  /**
   * Generate a fresh audit for a page (stub implementation using heuristics)
   */
  private async generateAudit(
    orgId: string,
    pageId: string,
    auditType: string,
    page: SEOPage
  ): Promise<SEOPageAuditWithIssues> {
    // Compute score from page data
    const { score, issues } = this.computeOnPageScore(page);

    // Create audit record
    const auditRecord = {
      org_id: orgId,
      page_id: pageId,
      audit_type: auditType,
      score,
      status: 'completed',
      issues_count: issues.filter((i) => i.severity === 'high').length,
      warnings_count: issues.filter((i) => i.severity === 'medium' || i.severity === 'low').length,
      notes: `Generated on-page audit for ${page.url}`,
      snapshot_at: new Date().toISOString(),
    };

    const { data: audit, error: auditError } = await this.supabase
      .from('seo_page_audits')
      .insert(auditRecord)
      .select()
      .single();

    if (auditError || !audit) {
      throw new Error(`Failed to create audit: ${auditError?.message}`);
    }

    // Insert issues
    const issueRecords = issues.map((issue) => ({
      org_id: orgId,
      audit_id: audit.id,
      page_id: pageId,
      issue_type: issue.issueType,
      severity: issue.severity,
      field: issue.field,
      message: issue.message,
      hint: issue.hint,
    }));

    let insertedIssues: SEOPageIssue[] = [];

    if (issueRecords.length > 0) {
      const { data: issuesData, error: issuesError } = await this.supabase
        .from('seo_page_issues')
        .insert(issueRecords)
        .select();

      if (issuesError) {
        console.error('Failed to insert issues:', issuesError);
      } else if (issuesData) {
        insertedIssues = issuesData.map(this.mapIssueFromDb);
      }
    }

    const recommendations = this.generateRecommendations(insertedIssues, page);

    return {
      audit: this.mapAuditFromDb(audit),
      page,
      issues: insertedIssues,
      recommendations,
    };
  }

  /**
   * Compute on-page score and identify issues (stub using heuristics)
   */
  private computeOnPageScore(page: SEOPage): {
    score: number;
    issues: Omit<SEOPageIssue, 'id' | 'orgId' | 'auditId' | 'pageId' | 'createdAt' | 'updatedAt'>[];
  } {
    let score = 100;
    const issues: Omit<
      SEOPageIssue,
      'id' | 'orgId' | 'auditId' | 'pageId' | 'createdAt' | 'updatedAt'
    >[] = [];

    // Check title
    if (!page.title || page.title.trim().length === 0) {
      score -= 15;
      issues.push({
        issueType: 'missing_title',
        severity: 'high',
        field: 'title',
        message: 'Page is missing a title tag',
        hint: 'Add a descriptive title tag (50-60 characters) including target keywords',
      });
    } else if (page.title.length < 30) {
      score -= 5;
      issues.push({
        issueType: 'title_too_short',
        severity: 'medium',
        field: 'title',
        message: `Title is too short (${page.title.length} characters)`,
        hint: 'Title should be 50-60 characters for optimal display in search results',
      });
    } else if (page.title.length > 70) {
      score -= 5;
      issues.push({
        issueType: 'title_too_long',
        severity: 'medium',
        field: 'title',
        message: `Title is too long (${page.title.length} characters)`,
        hint: 'Title may be truncated in search results. Keep it under 60 characters.',
      });
    }

    // Check meta description
    if (!page.metaDescription || page.metaDescription.trim().length === 0) {
      score -= 10;
      issues.push({
        issueType: 'missing_meta',
        severity: 'high',
        field: 'meta_description',
        message: 'Page is missing a meta description',
        hint: 'Add a compelling meta description (150-160 characters) to improve click-through rates',
      });
    } else if (page.metaDescription.length < 100) {
      score -= 3;
      issues.push({
        issueType: 'meta_too_short',
        severity: 'low',
        field: 'meta_description',
        message: `Meta description is too short (${page.metaDescription.length} characters)`,
        hint: 'Meta description should be 150-160 characters for best results',
      });
    } else if (page.metaDescription.length > 170) {
      score -= 3;
      issues.push({
        issueType: 'meta_too_long',
        severity: 'low',
        field: 'meta_description',
        message: `Meta description is too long (${page.metaDescription.length} characters)`,
        hint: 'Meta description may be truncated. Keep it under 160 characters.',
      });
    }

    // Check H1 tag
    if (!page.h1Tag || page.h1Tag.trim().length === 0) {
      score -= 10;
      issues.push({
        issueType: 'missing_h1',
        severity: 'high',
        field: 'h1',
        message: 'Page is missing an H1 tag',
        hint: 'Add a clear H1 heading that describes the main topic of the page',
      });
    }

    // Check word count (content depth)
    if (page.wordCount !== null) {
      if (page.wordCount < 300) {
        score -= 15;
        issues.push({
          issueType: 'thin_content',
          severity: 'high',
          field: 'content',
          message: `Page has thin content (${page.wordCount} words)`,
          hint: 'Aim for at least 1,000 words of high-quality content for better rankings',
        });
      } else if (page.wordCount < 800) {
        score -= 8;
        issues.push({
          issueType: 'low_content',
          severity: 'medium',
          field: 'content',
          message: `Page has limited content (${page.wordCount} words)`,
          hint: 'Consider expanding to 1,000+ words with comprehensive coverage of the topic',
        });
      }
    }

    // Check internal links
    if (page.internalLinksCount !== null && page.internalLinksCount < 3) {
      score -= 5;
      issues.push({
        issueType: 'low_internal_links',
        severity: 'medium',
        field: 'internal_links',
        message: `Page has few internal links (${page.internalLinksCount})`,
        hint: 'Add 3-5 relevant internal links to improve site structure and user navigation',
      });
    }

    // Check page speed
    if (page.pageSpeedScore !== null && page.pageSpeedScore < 50) {
      score -= 10;
      issues.push({
        issueType: 'slow_performance',
        severity: 'high',
        field: 'performance',
        message: `Page has poor performance score (${page.pageSpeedScore})`,
        hint: 'Optimize images, minify CSS/JS, enable caching, and use a CDN',
      });
    } else if (page.pageSpeedScore !== null && page.pageSpeedScore < 75) {
      score -= 5;
      issues.push({
        issueType: 'moderate_performance',
        severity: 'medium',
        field: 'performance',
        message: `Page performance could be improved (score: ${page.pageSpeedScore})`,
        hint: 'Consider further optimizations: compress images, reduce render-blocking resources',
      });
    }

    // Check mobile friendliness
    if (!page.mobileFriendly) {
      score -= 15;
      issues.push({
        issueType: 'not_mobile_friendly',
        severity: 'high',
        field: 'mobile',
        message: 'Page is not mobile-friendly',
        hint: 'Ensure responsive design with proper viewport meta tag and mobile-optimized layout',
      });
    }

    // Check indexability
    if (!page.indexed) {
      score -= 20;
      issues.push({
        issueType: 'not_indexed',
        severity: 'high',
        field: 'indexing',
        message: 'Page is not indexed by search engines',
        hint: 'Check for noindex tags, robots.txt blocks, or submit sitemap to Google Search Console',
      });
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return { score, issues };
  }

  /**
   * Generate actionable recommendations from issues
   */
  private generateRecommendations(
    issues: Pick<SEOPageIssue, 'severity' | 'issueType' | 'hint'>[],
    page: SEOPage
  ): string[] {
    const recommendations: string[] = [];

    // Prioritize high severity issues
    const highSeverityIssues = issues.filter((i) => i.severity === 'high');
    const mediumSeverityIssues = issues.filter((i) => i.severity === 'medium');

    if (highSeverityIssues.length > 0) {
      recommendations.push(
        `🔴 Critical: Address ${highSeverityIssues.length} high-priority issue(s) immediately`
      );

      // Add specific high-priority recommendations
      highSeverityIssues.slice(0, 3).forEach((issue) => {
        if (issue.hint) {
          recommendations.push(`• ${issue.hint}`);
        }
      });
    }

    if (mediumSeverityIssues.length > 0) {
      recommendations.push(
        `🟡 Medium: Fix ${mediumSeverityIssues.length} moderate issue(s) to improve rankings`
      );
    }

    // Add general best practice recommendations
    if (page.wordCount && page.wordCount < 1000) {
      recommendations.push(
        '📝 Content: Expand content to 1,000+ words with in-depth coverage and examples'
      );
    }

    if (!page.lastCrawledAt) {
      recommendations.push(
        '🔍 Crawlability: Submit page to Google Search Console for indexing'
      );
    }

    return recommendations;
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private mapAuditFromDb(row: any): SEOPageAudit {
    return {
      id: row.id,
      orgId: row.org_id,
      pageId: row.page_id,
      auditType: row.audit_type,
      score: row.score ? parseFloat(row.score) : null,
      status: row.status,
      issuesCount: row.issues_count,
      warningsCount: row.warnings_count,
      notes: row.notes,
      snapshotAt: row.snapshot_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapIssueFromDb(row: any): SEOPageIssue {
    return {
      id: row.id,
      orgId: row.org_id,
      auditId: row.audit_id,
      pageId: row.page_id,
      issueType: row.issue_type,
      severity: row.severity,
      field: row.field,
      message: row.message,
      hint: row.hint,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapPageFromDb(row: any): SEOPage {
    return {
      id: row.id,
      orgId: row.org_id,
      url: row.url,
      title: row.title,
      metaDescription: row.meta_description,
      h1Tag: row.h1_tag,
      wordCount: row.word_count,
      internalLinksCount: row.internal_links_count,
      externalLinksCount: row.external_links_count,
      pageSpeedScore: row.page_speed_score,
      mobileFriendly: row.mobile_friendly || false,
      indexed: row.indexed || false,
      lastCrawledAt: row.last_crawled_at,
      metadata: row.metadata || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
