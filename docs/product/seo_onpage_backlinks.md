# SEO On-Page Optimization & Backlink Intelligence - Implementation Guide

**Sprint**: S5
**Status**: Foundation Complete
**Last Updated**: 2025-01-15

---

## Overview

Sprint S5 extends Pravado's SEO Intelligence pillar with two critical foundations: **On-Page Optimization** and **Backlink Intelligence**. These systems provide automated page quality auditing and comprehensive backlink profile analysis.

### Key Features

1. **On-Page Optimization Engine**: Automated page audits with issue detection and scoring
2. **Backlink Intelligence System**: Backlink tracking, domain authority analysis, and link profile monitoring
3. **Stub Implementation**: S5 delivers the data models, services, and API layer - no external providers or crawlers yet
4. **Extensible Architecture**: Ready for S6+ integration with crawlers and third-party backlink APIs

---

## Architecture

### Data Model

#### On-Page Optimization Tables

**seo_page_audits** (new in S5)
- Purpose: Store page audit results with quality scores
- Fields:
  - `id`, `org_id`, `page_id` (FK to seo_pages)
  - `audit_type` - 'onpage', 'technical', 'content', etc.
  - `score` (NUMERIC 0-100) - Overall page quality score
  - `status` - 'pending', 'completed', 'failed'
  - `issues_count`, `warnings_count` - Issue severity counts
  - `notes` - Audit notes
  - `snapshot_at` - When audit was run
- Indexes: `(org_id, page_id, snapshot_at DESC)`, `(org_id, page_id, status)`, `(org_id, score DESC)`
- RLS: Org-scoped

**seo_page_issues** (new in S5)
- Purpose: Store individual issues found during audits
- Fields:
  - `id`, `org_id`, `audit_id` (FK to seo_page_audits), `page_id`
  - `issue_type` - 'missing_title', 'thin_content', 'slow_performance', etc.
  - `severity` - 'low', 'medium', 'high'
  - `field` - 'title', 'meta_description', 'h1', 'content', etc.
  - `message` - Human-readable issue description
  - `hint` - Actionable fix recommendation
- Indexes: `(org_id, page_id)`, `(org_id, severity)`
- RLS: Org-scoped

#### Backlink Intelligence Tables

**seo_backlinks** (new in S5)
- Purpose: Track backlinks to our pages
- Fields:
  - `id`, `org_id`, `page_id` (FK to seo_pages, nullable)
  - `source_url` - URL that links to us
  - `anchor_text` - Link anchor text
  - `link_type` - 'dofollow', 'nofollow', 'ugc', 'sponsored'
  - `discovered_at`, `last_seen_at`, `lost_at` - Link lifecycle tracking
  - `referring_domain_id` (FK to seo_referring_domains)
- Indexes: `(org_id, page_id, last_seen_at DESC)`, `(org_id, link_type)`, `(referring_domain_id)`, `(org_id, lost_at) WHERE lost_at IS NULL`
- RLS: Org-scoped

**seo_referring_domains** (new in S5)
- Purpose: Track domain-level metrics for referring domains
- Fields:
  - `id`, `org_id`, `domain`
  - `domain_authority` (0-100) - Domain authority score
  - `spam_score` (0-100) - Spam risk score
  - `total_backlinks` - Count of backlinks from this domain
  - `first_seen_at`, `last_seen_at`
- Unique: `(org_id, domain)`
- Indexes: `(org_id, domain_authority DESC)`, `(org_id, total_backlinks DESC)`, `(domain)`
- RLS: Org-scoped

---

## Service Architecture

### 1. SEOOnPageService (`seoOnPageService.ts`)

**Responsibilities**:
- Get latest audit for a page with issues
- List page audits with filtering
- Generate audits using heuristics (stub implementation)
- Compute on-page scores from page metadata
- Detect issues based on SEO best practices

**Heuristic Scoring** (S5 Stub Implementation):

Starts at 100, deducts points for issues:

| Issue Type | Severity | Deduction | Trigger |
|------------|----------|-----------|---------|
| Missing title | High | -15 | `title IS NULL OR title = ''` |
| Title too short | Medium | -5 | `LENGTH(title) < 30` |
| Title too long | Medium | -5 | `LENGTH(title) > 70` |
| Missing meta | High | -10 | `meta_description IS NULL OR meta_description = ''` |
| Meta too short | Low | -3 | `LENGTH(meta_description) < 100` |
| Meta too long | Low | -3 | `LENGTH(meta_description) > 170` |
| Missing H1 | High | -10 | `h1_tag IS NULL OR h1_tag = ''` |
| Thin content | High | -15 | `word_count < 300` |
| Low content | Medium | -8 | `word_count < 800` |
| Low internal links | Medium | -5 | `internal_links_count < 3` |
| Slow performance | High | -10 | `page_speed_score < 50` |
| Moderate performance | Medium | -5 | `page_speed_score < 75` |
| Not mobile friendly | High | -15 | `mobile_friendly = false` |
| Not indexed | High | -20 | `indexed = false` |

**Key Methods**:
```typescript
async getPageAudit(orgId: string, pageId: string, auditType?: string): Promise<SEOPageAuditWithIssues | null>
async listPageAudits(orgId: string, options: ListPageAuditsOptions): Promise<SEOPageAudit[]>
private computeOnPageScore(page: SEOPage): { score: number; issues: ... }
private generateRecommendations(issues: ..., page: SEOPage): string[]
```

**Recommendations Generator**:
- Prioritizes high-severity issues
- Provides 🔴 Critical / 🟡 Medium severity labels
- Generates up to 5 actionable recommendations
- Examples:
  - "Add compelling meta description (150-160 chars) including target keyword"
  - "Expand content to 1,000+ words with in-depth coverage and examples"
  - "Ensure responsive design with proper viewport meta tag"

### 2. SEOBacklinkService (`seoBacklinkService.ts`)

**Responsibilities**:
- Get backlink profile (org-wide or page-specific)
- List backlinks with filtering (active/lost, link type, referring domain)
- List referring domains with filtering (authority, spam score, backlink count)
- Calculate profile metrics (total, active, lost, dofollow/nofollow ratios)
- Extract top anchor texts

**Backlink Profile Structure**:
```typescript
{
  totalBacklinks: number;
  activeBacklinks: number;
  lostBacklinks: number;
  dofollowCount: number;
  nofollowCount: number;
  referringDomains: SEOReferringDomain[]; // Top 10 by authority
  recentBacklinks: SEOBacklink[]; // Last 30 days, up to 20
  topAnchorTexts: { text: string; count: number }[]; // Top 10
}
```

**Key Methods**:
```typescript
async getBacklinkProfile(orgId: string, pageId?: string): Promise<SEOBacklinkProfile>
async listBacklinks(orgId: string, options: ListBacklinksOptions): Promise<{ items: SEOBacklink[]; total: number }>
async listReferringDomains(orgId: string, options: ListReferringDomainsOptions): Promise<{ items: SEOReferringDomain[]; total: number }>
```

---

## API Endpoints

### GET /api/v1/seo/onpage

Get on-page audit for a specific page.

**Query Parameters**:
- `pageId` (UUID, required): Page to audit
- `auditType` (string, optional): 'onpage', 'technical', 'content', etc.

**Response**:
```json
{
  "success": true,
  "data": {
    "auditWithIssues": {
      "audit": {
        "id": "uuid",
        "orgId": "uuid",
        "pageId": "uuid",
        "auditType": "onpage",
        "score": 72.5,
        "status": "completed",
        "issuesCount": 3,
        "warningsCount": 5,
        "notes": "Generated on-page audit for https://example.com/page",
        "snapshotAt": "2025-01-15T10:00:00Z",
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      },
      "page": {
        "id": "uuid",
        "url": "https://example.com/page",
        "title": "Example Page",
        "metaDescription": "Example description...",
        "wordCount": 850,
        ...
      },
      "issues": [
        {
          "id": "uuid",
          "issueType": "low_content",
          "severity": "medium",
          "field": "content",
          "message": "Page has limited content (850 words)",
          "hint": "Consider expanding to 1,000+ words with comprehensive coverage of the topic",
          ...
        }
      ],
      "recommendations": [
        "🟡 Medium: Fix 5 moderate issue(s) to improve rankings",
        "• Consider expanding to 1,000+ words with comprehensive coverage of the topic",
        "📝 Content: Expand content to 1,000+ words with in-depth coverage and examples"
      ]
    }
  }
}
```

### GET /api/v1/seo/backlinks

Get backlink profile (org-wide or page-specific).

**Query Parameters**:
- `pageId` (UUID, optional): Filter to specific page. If omitted, returns org-wide profile.

**Response**:
```json
{
  "success": true,
  "data": {
    "profile": {
      "totalBacklinks": 1245,
      "activeBacklinks": 1189,
      "lostBacklinks": 56,
      "dofollowCount": 892,
      "nofollowCount": 297,
      "referringDomains": [
        {
          "id": "uuid",
          "domain": "highauthority.com",
          "domainAuthority": 85,
          "spamScore": 2,
          "totalBacklinks": 15,
          "firstSeenAt": "2024-12-01T00:00:00Z",
          "lastSeenAt": "2025-01-15T00:00:00Z",
          ...
        }
      ],
      "recentBacklinks": [
        {
          "id": "uuid",
          "sourceUrl": "https://example.com/blog/article",
          "anchorText": "best SEO tools",
          "linkType": "dofollow",
          "discoveredAt": "2025-01-14T08:00:00Z",
          "lastSeenAt": "2025-01-15T09:00:00Z",
          "lostAt": null,
          ...
        }
      ],
      "topAnchorTexts": [
        { "text": "SEO platform", "count": 45 },
        { "text": "keyword research tool", "count": 32 },
        { "text": "pravado", "count": 28 }
      ]
    }
  }
}
```

---

## Dashboard UI

### Tab Navigation (S5)

The SEO dashboard (`/app/seo`) now features a three-tab interface:

1. **Keywords & SERP** (S4 - Existing)
   - Keywords table with search, SERP snapshots, opportunities sidebar
   - Fully functional

2. **On-Page Optimization** (S5 - Placeholder)
   - Coming soon placeholder with feature highlights:
     - Page Audits: 0-100 quality scores
     - Issue Detection: Missing tags, thin content, slow performance
     - Recommendations: Actionable hints for fixes

3. **Backlink Intelligence** (S5 - Placeholder)
   - Coming soon placeholder with feature highlights:
     - Backlink Tracking: Active/lost with link type classification
     - Domain Authority: Authority and spam score analysis
     - Anchor Analysis: Top anchor texts and diversity

**Implementation Notes**:
- Tabs use Tailwind UI styling with active state indicators
- Each tab is conditionally rendered based on `activeTab` state
- S5 placeholders are visually appealing with emoji icons and feature cards
- Ready for S6+ to replace placeholders with live data

---

## Future Enhancements

### Sprint S6+ Roadmap

**On-Page Crawling**:
- Automated page crawling service
- Real-time page data extraction (title, meta, h1, word count, images, links)
- JavaScript rendering for SPAs
- Schema.org markup detection
- Mobile vs desktop comparison

**Advanced Page Audits**:
- Content quality scoring (readability, keyword density, LSI keywords)
- Image optimization checks (alt tags, file sizes, lazy loading)
- Structured data validation
- Core Web Vitals tracking (LCP, FID, CLS)
- Accessibility scoring (WCAG compliance)

**Backlink Discovery**:
- Integration with backlink APIs (Ahrefs, Moz, SEMrush)
- Automated backlink discovery and monitoring
- Historical backlink tracking with timeline graphs
- Link velocity analysis
- Competitor backlink gap analysis

**Link Quality Assessment**:
- Toxic link detection and disavow suggestions
- Link context analysis (surrounding text, page relevance)
- Editorial vs programmatic link classification
- Link placement scoring (footer, sidebar, content body)

**Automation**:
- Scheduled page audits (daily/weekly)
- Automated backlink monitoring
- Email/Slack alerts for lost backlinks or critical issues
- Bulk page audit operations

---

## Testing & Validation

### Manual Testing Checklist

**On-Page API**:
- [ ] GET /api/v1/seo/onpage returns audit for valid pageId
- [ ] Audit score computed correctly based on page metadata
- [ ] Issues detected with correct severity levels
- [ ] Recommendations are actionable and prioritized
- [ ] Returns 404 for invalid pageId

**Backlink API**:
- [ ] GET /api/v1/seo/backlinks returns org-wide profile
- [ ] GET /api/v1/seo/backlinks?pageId=X returns page-specific profile
- [ ] Profile metrics calculated correctly (total, active, lost, dofollow/nofollow)
- [ ] Top referring domains sorted by authority
- [ ] Recent backlinks limited to 30 days
- [ ] Top anchor texts sorted by count

**Dashboard**:
- [ ] Tab navigation works correctly
- [ ] Keywords tab shows existing S4 functionality
- [ ] On-Page tab shows placeholder with feature highlights
- [ ] Backlinks tab shows placeholder with feature highlights
- [ ] Tab styling updates on selection

---

## Security & Performance

### RLS Enforcement

All S5 tables enforce org-level RLS:
- Users can only access data from their org(s)
- Policies check `user_orgs` table for membership
- Enforced at database level (cannot be bypassed)

### Performance Optimizations

**Database**:
- Indexes on org_id, page_id, audit_id, referring_domain_id
- Composite indexes for common query patterns
- Partial index on active backlinks (`WHERE lost_at IS NULL`)

**API**:
- Pagination for list endpoints
- Efficient aggregation queries for profile metrics
- Lazy loading approach (generate audit on-demand)

---

## Troubleshooting

### No Audit Available

**Symptom**: GET /api/v1/seo/onpage returns empty or generates new audit every time
**Cause**: No audit exists for the page, or audit_type filter excludes existing audits
**Solution**: S5 generates audits on-demand. To pre-generate, call endpoint once.

### Backlink Profile Empty

**Symptom**: GET /api/v1/seo/backlinks returns zeros for all metrics
**Cause**: No backlinks seeded in database
**Solution**: In S5, backlink data must be manually seeded. S6+ will auto-populate via APIs.

### Audit Score Always 100

**Symptom**: All pages show perfect 100 score
**Cause**: Page metadata is fully populated with ideal values
**Solution**: Test with pages missing title, meta, or with low word_count to see score deductions.

---

## Migration Notes

### Applying S5 Migrations

```bash
# From apps/api directory
supabase db push

# Or apply individually:
psql -h <host> -U <user> -d <db> -f supabase/migrations/14_create_seo_page_audits.sql
psql -h <host> -U <user> -d <db> -f supabase/migrations/15_create_seo_page_issues.sql
psql -h <host> -U <user> -d <db> -f supabase/migrations/16_create_seo_backlinks.sql
psql -h <host> -U <user> -d <db> -f supabase/migrations/17_create_seo_referring_domains.sql
```

### Seeding Test Data (Optional)

```sql
-- Add sample page
INSERT INTO seo_pages (org_id, url, title, meta_description, h1_tag, word_count, internal_links_count, page_speed_score, mobile_friendly, indexed)
VALUES ('YOUR_ORG_ID', 'https://example.com/page', 'Example Page Title', 'This is an example meta description.', 'Main Heading', 850, 5, 78, true, true);

-- Add sample backlinks
INSERT INTO seo_backlinks (org_id, page_id, source_url, anchor_text, link_type, discovered_at, last_seen_at)
VALUES
  ('YOUR_ORG_ID', 'PAGE_ID', 'https://referring-site.com/article', 'SEO tools', 'dofollow', NOW() - INTERVAL '10 days', NOW()),
  ('YOUR_ORG_ID', 'PAGE_ID', 'https://blog.example.com/post', 'best platform', 'dofollow', NOW() - INTERVAL '5 days', NOW());

-- Add sample referring domain
INSERT INTO seo_referring_domains (org_id, domain, domain_authority, spam_score, total_backlinks, first_seen_at, last_seen_at)
VALUES ('YOUR_ORG_ID', 'referring-site.com', 72, 5, 3, NOW() - INTERVAL '30 days', NOW());
```

---

## Summary

Sprint S5 delivers production-ready foundations for On-Page Optimization and Backlink Intelligence:

- ✅ Complete data models for page audits, issues, backlinks, and referring domains
- ✅ Fully functional services with heuristic-based audit generation
- ✅ RESTful API endpoints with Zod validation
- ✅ Dashboard tabs with placeholder UI (ready for S6+ live data)
- ✅ Full RLS security and org-scoping
- ✅ Comprehensive documentation and testing guidelines
- ✅ Extensible architecture ready for crawler integration and external APIs

The infrastructure is now in place for S6+ to add automated crawling, real-time monitoring, and third-party integrations for a complete SEO Intelligence suite.
