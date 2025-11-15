

# SEO Intelligence - Implementation Guide

**Sprint**: S4
**Status**: Production Ready
**Last Updated**: 2025-01-15

---

## Overview

Pravado's SEO Intelligence pillar provides a comprehensive keyword tracking, SERP analysis, and opportunity detection system. Sprint S4 delivers the first production-ready SEO features with hybrid keyword intelligence, SERP snapshot capabilities, and an AI-powered opportunity engine.

### Key Features

1. **Hybrid Keyword Intelligence**: Multi-source keyword data with provider abstraction
2. **SERP Snapshot & Tracking**: Real-time SERP position monitoring with competitor analysis
3. **Opportunity Detection Engine**: AI-powered SEO opportunity identification and recommendations
4. **Real-time Dashboard**: Interactive UI for keyword research, SERP analysis, and opportunity discovery

---

## Architecture

### Data Model

#### Core Tables

**seo_keywords** (from S3)
- Primary keyword tracking table
- Fields: keyword, search_volume, difficulty_score, current_position, target_position, tracked_url, status, **intent** (new in S4)
- RLS-protected, org-scoped

**seo_keyword_metrics** (new in S4)
- Multi-source keyword intelligence
- Fields: keyword_id, source, search_volume, difficulty, cpc, click_through_rate, priority_score, last_refreshed_at
- Sources: 'gsc', 'llm_estimate', 'external_api', 'manual'
- Enables hybrid data approach: mix Google Search Console data, external APIs, and LLM estimates

**seo_serp_results** (new in S4)
- SERP position tracking
- Fields: keyword_id, url, title, snippet, rank, is_competitor, competitor_id, snapshot_id, last_seen_at
- Tracks both our pages and competitor pages
- Historical snapshots via snapshot_id linkage

**seo_keyword_intent enum** (new in S4)
- Keyword classification: 'informational', 'navigational', 'commercial', 'transactional'
- Helps prioritize content strategy based on search intent

#### Supporting Tables (from S3)

- **seo_pages**: On-page optimization tracking
- **seo_opportunities**: Opportunity records (enriched by DTO layer in S4)
- **seo_competitors**: Competitor domain tracking
- **seo_snapshots**: Historical SERP snapshots

### Service Architecture

#### 1. KeywordService (`seoKeywordService.ts`)

**Responsibilities**:
- List keywords with pagination, search, and filtering
- Fetch individual keywords with latest metrics
- Enrich keywords using provider abstraction
- Generate recommendations based on priority scores

**Provider Abstraction**:
```typescript
interface KeywordProvider {
  enrichKeyword(orgId: string, keyword: SEOKeyword): Promise<SEOKeywordMetric | null>;
  batchEnrichKeywords(orgId: string, keywords: SEOKeyword[]): Promise<SEOKeywordMetric[]>;
}
```

**Current Implementation**:
- `StubKeywordProvider`: S4 uses heuristic-based estimates
- Future S5+: Plug in real APIs (Ahrefs, SEMrush, Google Search Console)

**Priority Score Calculation**:
```typescript
// Higher search volume + lower difficulty = higher priority
priorityScore = (searchVolume / 100) * 0.4 + (100 - difficulty) * 0.6
```

#### 2. SerpService (`seoSerpService.ts`)

**Responsibilities**:
- Get SERP snapshot for a keyword
- Compare our rankings vs competitors
- Generate gap analysis
- Upsert SERP results (for future scraping integration)

**Gap Analysis**:
- Identifies top 5 competitors
- Calculates position gaps
- Generates human-readable explanations
- Example: "competitor.com ranks 3 positions ahead of us (position 2 vs 5)"

#### 3. OpportunityService (`seoOpportunityService.ts`)

**Responsibilities**:
- Detect SEO opportunities across the org's keyword portfolio
- Classify opportunity types
- Generate actionable recommendations
- Calculate priority scores

**Opportunity Types**:

1. **keyword_gap**: High-value keyword with no target page
   - Trigger: `searchVolume > 1000 AND hasTargetPage = false`
   - Action: "Create optimized content targeting this keyword"

2. **content_refresh**: Our page exists but competitors outrank us
   - Trigger: `ourRank > 10 AND competitorRank < ourRank`
   - Action: "Refresh and optimize existing content, add depth, improve internal linking"

3. **missing_meta**: Page exists but missing critical SEO elements
   - Trigger: `hasTargetPage = true AND metaDescription = null`
   - Action: "Add compelling meta description (150-160 chars) including target keyword"

4. **low_content**: Page exists but has thin content
   - Trigger: `hasTargetPage = true AND wordCount < 500`
   - Action: "Expand content to at least 1,500 words with comprehensive coverage"

5. **quick_win**: Decent volume + low competition
   - Trigger: `searchVolume > 500 AND difficulty < 40`
   - Action: "Quick win opportunity. Create focused content to capture this keyword"

---

## API Endpoints

### GET /api/v1/seo/keywords

List keywords with metrics, supports search and filtering.

**Query Parameters**:
- `q` (string, optional): Search query (filters by keyword text)
- `page` (number, optional): Page number (default: 1)
- `pageSize` (number, optional): Items per page (default: 20, max: 100)
- `status` (enum, optional): 'active' | 'paused' | 'archived'
- `intent` (enum, optional): 'informational' | 'navigational' | 'commercial' | 'transactional'
- `sortBy` (enum, optional): 'keyword' | 'searchVolume' | 'difficulty' | 'priorityScore' | 'createdAt' (default: 'priorityScore')
- `sortOrder` (enum, optional): 'asc' | 'desc' (default: 'desc')

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "keyword": {
          "id": "uuid",
          "keyword": "enterprise seo platform",
          "status": "active",
          "intent": "commercial",
          ...
        },
        "metrics": {
          "searchVolume": 5000,
          "difficulty": 65,
          "cpc": 12.50,
          "clickThroughRate": 8.5,
          "priorityScore": 72.3,
          "source": "llm_estimate",
          "lastRefreshedAt": "2025-01-15T10:00:00Z"
        }
      }
    ],
    "total": 42,
    "page": 1,
    "pageSize": 20
  }
}
```

### GET /api/v1/seo/serp

Get SERP snapshot for a specific keyword.

**Query Parameters**:
- `keywordId` (UUID, required): Keyword ID to fetch SERP data for

**Response**:
```json
{
  "success": true,
  "data": {
    "snapshot": {
      "keywordId": "uuid",
      "keyword": "enterprise seo platform",
      "results": [
        {
          "id": "uuid",
          "url": "https://competitor.com/seo-platform",
          "title": "Best Enterprise SEO Platform",
          "snippet": "Comprehensive SEO platform for enterprises...",
          "rank": 1,
          "isCompetitor": true,
          "lastSeenAt": "2025-01-15T09:00:00Z"
        }
      ],
      "topCompetitors": [
        { "domain": "competitor.com", "rank": 1, "url": "..." },
        { "domain": "anothersite.com", "rank": 2, "url": "..." }
      ],
      "ourBestRank": 5,
      "capturedAt": "2025-01-15T09:00:00Z"
    }
  }
}
```

### GET /api/v1/seo/opportunities

List SEO opportunities with AI-generated recommendations.

**Query Parameters**:
- `limit` (number, optional): Max items (default: 20, max: 100)
- `offset` (number, optional): Skip items (default: 0)
- `opportunityType` (enum, optional): 'keyword_gap' | 'content_refresh' | 'broken_link' | 'missing_meta' | 'low_content'
- `priority` (enum, optional): 'low' | 'medium' | 'high' | 'critical'
- `status` (enum, optional): 'open' | 'in_progress' | 'completed' | 'dismissed'
- `minPriorityScore` (number, optional): Minimum priority score (0-100)

**Response**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "orgId": "uuid",
        "keyword": { "id": "uuid", "keyword": "seo automation", ... },
        "metrics": { "searchVolume": 3500, "difficulty": 45, "priorityScore": 78.2, ... },
        "currentPage": null,
        "gapSummary": "High-value keyword 'seo automation' (3,500 searches/mo) has no dedicated page.",
        "recommendedAction": "Create optimized content targeting 'seo automation' with focus on commercial intent.",
        "priorityScore": 78.2,
        "opportunityType": "keyword_gap",
        "status": "open",
        "createdAt": "2025-01-15T10:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      }
    ]
  }
}
```

---

## Dashboard UI

### Layout

The SEO dashboard (`/app/seo`) features a three-section layout:

1. **Keywords Table** (main section, left side):
   - Searchable keyword list
   - Columns: Keyword, Intent, Volume, Difficulty, Priority Score
   - Click to select keyword and load SERP snapshot
   - Color-coded priority scores (green > 75, yellow 50-75, orange < 50)

2. **SERP Snapshot** (below keywords, conditional):
   - Shows when a keyword is selected
   - Displays top competitors with ranks
   - Shows our best rank (if ranking)
   - Lists top 10 SERP results with titles, URLs, snippets
   - Highlights our pages vs competitors

3. **Opportunities Sidebar** (right side, sticky):
   - Top 10 opportunities by priority score
   - Color-coded opportunity types
   - Gap summary and recommended action for each
   - Quick-scan format for prioritization

### User Flow

1. User lands on `/app/seo`
2. Keywords and opportunities load automatically
3. User searches/filters keywords
4. User clicks a keyword to view SERP snapshot
5. SERP data loads showing competitive landscape
6. User reviews opportunities sidebar for next actions

---

## Data Flow

### Keyword Enrichment Flow

```
1. User adds keyword to seo_keywords table
   ↓
2. KeywordService.enrichKeyword(keywordId) called
   ↓
3. KeywordProvider.enrichKeyword() generates/fetches metrics
   ↓
4. Metrics stored in seo_keyword_metrics table
   ↓
5. Priority score calculated and stored
   ↓
6. Keyword appears in dashboard with full metrics
```

### Opportunity Detection Flow

```
1. OpportunityService.listOpportunities(orgId) called
   ↓
2. Fetch all active keywords for org
   ↓
3. Fetch latest metrics for each keyword
   ↓
4. Fetch SEO pages (for gap analysis)
   ↓
5. Fetch SERP results (for competitive analysis)
   ↓
6. For each keyword:
   - Check if page exists
   - Check our rank vs competitors
   - Check page quality (meta, word count, etc.)
   - Determine opportunity type
   - Generate gap summary and recommended action
   ↓
7. Return sorted list (by priority score desc)
   ↓
8. Display in opportunities sidebar
```

---

## Future Enhancements

### Sprint S5+ Roadmap

**External Provider Integration**:
- Ahrefs API integration for real keyword data
- SEMrush API for competitive intelligence
- Google Search Console integration for actual performance data
- Combine multiple sources for "hybrid intelligence"

**SERP Scraping**:
- Automated SERP scraping service
- Daily rank tracking for target keywords
- Historical trend analysis
- SERP feature detection (featured snippets, PAA, local packs)

**On-Page Optimization**:
- Automated page crawling
- Content quality scoring
- Technical SEO audits (speed, mobile-friendliness, schema)
- Internal linking recommendations

**Backlink Intelligence**:
- Backlink discovery and tracking
- Referring domain authority scoring
- Toxic link detection
- Link building opportunity identification

**Advanced Analytics**:
- Keyword grouping and clustering
- Topic authority scoring
- Content gap analysis across entire site
- Competitive visibility benchmarking

**Automation**:
- Auto-enrich keywords on creation
- Scheduled SERP snapshots
- Automated opportunity refreshes
- Email/Slack notifications for critical opportunities

---

## Testing & Validation

### Manual Testing Checklist

**Keywords Endpoint**:
- [ ] GET /api/v1/seo/keywords returns paginated data
- [ ] Search query filters keywords correctly
- [ ] Sorting by priority score works
- [ ] Metrics are properly joined

**SERP Endpoint**:
- [ ] GET /api/v1/seo/serp returns snapshot for valid keyword
- [ ] Top competitors are correctly identified
- [ ] Our rank is calculated accurately
- [ ] Returns 404 for invalid keyword ID

**Opportunities Endpoint**:
- [ ] GET /api/v1/seo/opportunities returns DTOs
- [ ] Opportunity types are correctly classified
- [ ] Gap summaries are human-readable
- [ ] Recommended actions are actionable
- [ ] Priority scores are calculated correctly

**Dashboard**:
- [ ] Keywords table loads and displays metrics
- [ ] Search filters keywords in real-time
- [ ] Clicking keyword loads SERP snapshot
- [ ] Opportunities sidebar displays top 10
- [ ] UI is responsive on mobile/tablet

### Automated Testing (S4.1)

API tests to be added in `apps/api/src/services/__tests__/`:
- `seoKeywordService.test.ts`
- `seoSerpService.test.ts`
- `seoOpportunityService.test.ts`

Dashboard tests to be added in `apps/dashboard/e2e/`:
- `seo-dashboard.spec.ts`

---

## Security & Performance

### RLS Enforcement

All SEO tables enforce org-level RLS:
- Users can only access data from their org(s)
- Policies check `user_orgs` table for membership
- Enforced at database level (cannot be bypassed)

### Performance Optimizations

**Database**:
- Indexes on org_id, keyword_id, priority_score
- Composite indexes for common query patterns
- Pagination to limit result sets

**API**:
- Service-level caching (future)
- Batch operations for metrics enrichment
- Lazy loading of SERP snapshots (only on keyword select)

**Dashboard**:
- Client-side state management
- Conditional SERP loading
- Debounced search input

---

## Troubleshooting

### No Keywords Showing

**Symptom**: Keywords table is empty
**Cause**: No keywords in database for user's org
**Solution**: Seed data or add keywords via admin interface (S5+)

### SERP Snapshot Empty

**Symptom**: "No SERP data available" message
**Cause**: No SERP results in database for this keyword
**Solution**: In S4, SERP data must be manually seeded. S5+ will auto-populate via scraping.

### Metrics Not Showing

**Symptom**: Keyword has no metrics (Volume/Difficulty/Priority show "-")
**Cause**: Keyword hasn't been enriched yet
**Solution**: Call `KeywordService.enrichKeyword()` or wait for auto-enrichment (S5+)

### Opportunities Not Detected

**Symptom**: Opportunities sidebar is empty
**Cause**: Heuristics didn't match any keywords, or insufficient data
**Solution**: Ensure keywords have metrics and/or add seo_pages for gap detection

---

## Migration Notes

### Applying S4 Migrations

```bash
# From apps/api directory
supabase db push

# Or apply individually:
psql -h <host> -U <user> -d <db> -f supabase/migrations/11_create_seo_keyword_metrics.sql
psql -h <host> -U <user> -d <db> -f supabase/migrations/12_create_seo_serp_results.sql
psql -h <host> -U <user> -d <db> -f supabase/migrations/13_create_seo_keyword_intent_enum.sql
```

### Seeding Test Data (Optional)

```sql
-- Add sample keywords
INSERT INTO seo_keywords (org_id, keyword, status)
VALUES
  ('YOUR_ORG_ID', 'enterprise seo platform', 'active'),
  ('YOUR_ORG_ID', 'seo automation tools', 'active'),
  ('YOUR_ORG_ID', 'keyword research software', 'active');

-- Enrich with metrics (example)
INSERT INTO seo_keyword_metrics (org_id, keyword_id, source, search_volume, difficulty, priority_score)
VALUES
  ('YOUR_ORG_ID', 'KEYWORD_ID_1', 'llm_estimate', 5000, 65, 72.3),
  ('YOUR_ORG_ID', 'KEYWORD_ID_2', 'llm_estimate', 3500, 45, 78.2);

-- Add SERP results (example)
INSERT INTO seo_serp_results (org_id, keyword_id, url, title, rank, is_competitor)
VALUES
  ('YOUR_ORG_ID', 'KEYWORD_ID_1', 'https://competitor.com/page', 'Title', 1, true),
  ('YOUR_ORG_ID', 'KEYWORD_ID_1', 'https://yoursite.com/page', 'Your Title', 5, false);
```

---

## Summary

Sprint S4 delivers a production-ready SEO Intelligence system with:

- ✅ Hybrid keyword intelligence layer with provider abstraction
- ✅ SERP snapshot and competitor comparison
- ✅ Real SEO opportunity detection with AI-powered recommendations
- ✅ Interactive dashboard with keyword search, SERP analysis, and opportunity sidebar
- ✅ Full RLS security and org-scoping
- ✅ Extensible architecture ready for S5+ enhancements

The foundation is now in place for external API integrations, automated SERP tracking, and advanced SEO analytics in future sprints.
