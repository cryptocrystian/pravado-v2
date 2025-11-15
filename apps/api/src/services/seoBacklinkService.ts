/**
 * SEO Backlink Intelligence Service
 * Sprint S5: Backlink analysis and referring domain tracking foundation
 */

import type {
  SEOBacklink,
  SEOReferringDomain,
  SEOBacklinkProfile,
} from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface ListBacklinksOptions {
  pageId?: string;
  linkType?: 'dofollow' | 'nofollow' | 'ugc' | 'sponsored';
  includeActive?: boolean;
  includeLost?: boolean;
  referringDomainId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'discoveredAt' | 'lastSeenAt' | 'lostAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ListReferringDomainsOptions {
  minDomainAuthority?: number;
  maxSpamScore?: number;
  minBacklinks?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'domainAuthority' | 'totalBacklinks' | 'firstSeenAt';
  sortOrder?: 'asc' | 'desc';
}

export class SEOBacklinkService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get backlink profile (org-wide or page-specific)
   */
  async getBacklinkProfile(
    orgId: string,
    pageId?: string
  ): Promise<SEOBacklinkProfile> {
    // Build base query
    let backlinksQuery = this.supabase
      .from('seo_backlinks')
      .select('*')
      .eq('org_id', orgId);

    if (pageId) {
      backlinksQuery = backlinksQuery.eq('page_id', pageId);
    }

    const { data: allBacklinks } = await backlinksQuery;

    const backlinks = allBacklinks || [];

    // Calculate metrics
    const totalBacklinks = backlinks.length;
    const activeBacklinks = backlinks.filter((b) => b.lost_at === null).length;
    const lostBacklinks = backlinks.filter((b) => b.lost_at !== null).length;
    const dofollowCount = backlinks.filter(
      (b) => b.link_type === 'dofollow' && b.lost_at === null
    ).length;
    const nofollowCount = backlinks.filter(
      (b) => b.link_type === 'nofollow' && b.lost_at === null
    ).length;

    // Get referring domains
    const domainsQuery = this.supabase
      .from('seo_referring_domains')
      .select('*')
      .eq('org_id', orgId)
      .order('domain_authority', { ascending: false, nullsFirst: false })
      .limit(10);

    const { data: domains } = await domainsQuery;
    const referringDomains = domains ? domains.map(this.mapReferringDomainFromDb) : [];

    // Get recent backlinks (last 30 days, active only)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBacklinks = backlinks
      .filter(
        (b) =>
          b.lost_at === null &&
          new Date(b.discovered_at) >= thirtyDaysAgo
      )
      .sort(
        (a, b) =>
          new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime()
      )
      .slice(0, 20)
      .map(this.mapBacklinkFromDb);

    // Calculate top anchor texts
    const anchorTextCounts = new Map<string, number>();
    backlinks
      .filter((b) => b.lost_at === null && b.anchor_text)
      .forEach((b) => {
        const text = b.anchor_text!.trim();
        if (text.length > 0) {
          anchorTextCounts.set(text, (anchorTextCounts.get(text) || 0) + 1);
        }
      });

    const topAnchorTexts = Array.from(anchorTextCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([text, count]) => ({ text, count }));

    return {
      totalBacklinks,
      activeBacklinks,
      lostBacklinks,
      dofollowCount,
      nofollowCount,
      referringDomains,
      recentBacklinks,
      topAnchorTexts,
    };
  }

  /**
   * List backlinks with filtering
   */
  async listBacklinks(
    orgId: string,
    options: ListBacklinksOptions = {}
  ): Promise<{ items: SEOBacklink[]; total: number }> {
    const {
      pageId,
      linkType,
      includeActive = true,
      includeLost = false,
      referringDomainId,
      limit = 20,
      offset = 0,
      sortBy = 'lastSeenAt',
      sortOrder = 'desc',
    } = options;

    // Build query for items
    let itemsQuery = this.supabase
      .from('seo_backlinks')
      .select('*')
      .eq('org_id', orgId);

    if (pageId) {
      itemsQuery = itemsQuery.eq('page_id', pageId);
    }

    if (linkType) {
      itemsQuery = itemsQuery.eq('link_type', linkType);
    }

    if (referringDomainId) {
      itemsQuery = itemsQuery.eq('referring_domain_id', referringDomainId);
    }

    // Filter by active/lost status
    if (includeActive && !includeLost) {
      itemsQuery = itemsQuery.is('lost_at', null);
    } else if (!includeActive && includeLost) {
      itemsQuery = itemsQuery.not('lost_at', 'is', null);
    }

    // Apply sorting
    const sortColumn =
      sortBy === 'discoveredAt'
        ? 'discovered_at'
        : sortBy === 'lastSeenAt'
        ? 'last_seen_at'
        : 'lost_at';

    itemsQuery = itemsQuery.order(sortColumn, {
      ascending: sortOrder === 'asc',
      nullsFirst: sortOrder === 'desc',
    });

    // Apply pagination
    itemsQuery = itemsQuery.range(offset, offset + limit - 1);

    const { data: items, error: itemsError } = await itemsQuery;

    if (itemsError) {
      throw new Error(`Failed to list backlinks: ${itemsError.message}`);
    }

    // Get total count (same filters but no pagination)
    let countQuery = this.supabase
      .from('seo_backlinks')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    if (pageId) {
      countQuery = countQuery.eq('page_id', pageId);
    }

    if (linkType) {
      countQuery = countQuery.eq('link_type', linkType);
    }

    if (referringDomainId) {
      countQuery = countQuery.eq('referring_domain_id', referringDomainId);
    }

    if (includeActive && !includeLost) {
      countQuery = countQuery.is('lost_at', null);
    } else if (!includeActive && includeLost) {
      countQuery = countQuery.not('lost_at', 'is', null);
    }

    const { count } = await countQuery;

    return {
      items: items ? items.map(this.mapBacklinkFromDb) : [],
      total: count || 0,
    };
  }

  /**
   * List referring domains with filtering
   */
  async listReferringDomains(
    orgId: string,
    options: ListReferringDomainsOptions = {}
  ): Promise<{ items: SEOReferringDomain[]; total: number }> {
    const {
      minDomainAuthority,
      maxSpamScore,
      minBacklinks,
      limit = 20,
      offset = 0,
      sortBy = 'domainAuthority',
      sortOrder = 'desc',
    } = options;

    // Build query for items
    let itemsQuery = this.supabase
      .from('seo_referring_domains')
      .select('*')
      .eq('org_id', orgId);

    if (minDomainAuthority !== undefined) {
      itemsQuery = itemsQuery.gte('domain_authority', minDomainAuthority);
    }

    if (maxSpamScore !== undefined) {
      itemsQuery = itemsQuery.lte('spam_score', maxSpamScore);
    }

    if (minBacklinks !== undefined) {
      itemsQuery = itemsQuery.gte('total_backlinks', minBacklinks);
    }

    // Apply sorting
    const sortColumn =
      sortBy === 'domainAuthority'
        ? 'domain_authority'
        : sortBy === 'totalBacklinks'
        ? 'total_backlinks'
        : 'first_seen_at';

    itemsQuery = itemsQuery.order(sortColumn, {
      ascending: sortOrder === 'asc',
      nullsFirst: sortOrder === 'desc',
    });

    // Apply pagination
    itemsQuery = itemsQuery.range(offset, offset + limit - 1);

    const { data: items, error: itemsError } = await itemsQuery;

    if (itemsError) {
      throw new Error(`Failed to list referring domains: ${itemsError.message}`);
    }

    // Get total count
    let countQuery = this.supabase
      .from('seo_referring_domains')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    if (minDomainAuthority !== undefined) {
      countQuery = countQuery.gte('domain_authority', minDomainAuthority);
    }

    if (maxSpamScore !== undefined) {
      countQuery = countQuery.lte('spam_score', maxSpamScore);
    }

    if (minBacklinks !== undefined) {
      countQuery = countQuery.gte('total_backlinks', minBacklinks);
    }

    const { count } = await countQuery;

    return {
      items: items ? items.map(this.mapReferringDomainFromDb) : [],
      total: count || 0,
    };
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private mapBacklinkFromDb(row: any): SEOBacklink {
    return {
      id: row.id,
      orgId: row.org_id,
      pageId: row.page_id,
      sourceUrl: row.source_url,
      anchorText: row.anchor_text,
      linkType: row.link_type,
      discoveredAt: row.discovered_at,
      lastSeenAt: row.last_seen_at,
      lostAt: row.lost_at,
      referringDomainId: row.referring_domain_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapReferringDomainFromDb(row: any): SEOReferringDomain {
    return {
      id: row.id,
      orgId: row.org_id,
      domain: row.domain,
      domainAuthority: row.domain_authority,
      spamScore: row.spam_score,
      totalBacklinks: row.total_backlinks,
      firstSeenAt: row.first_seen_at,
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
