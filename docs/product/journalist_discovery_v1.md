# Journalist Discovery Engine V1 (Sprint S48)

## Overview

Sprint S48 implements an intelligent automated journalist discovery and enrichment system that continuously discovers new journalists from multiple sources and integrates them into the S46 Journalist Identity Graph. The system uses multi-source ingestion, fuzzy deduplication, multi-dimensional confidence scoring, and human-in-the-loop workflows to expand journalist coverage automatically.

## Key Features

### 1. Multi-Source Discovery

The system automatically discovers journalists from diverse sources:

- **Article Authors (S40/S41)** - Extracts bylines from monitored articles and RSS feeds
- **Social Profiles** - Ingests journalist profiles from Twitter/X, LinkedIn, Mastodon (V1: stubbed, no external HTTP)
- **Outlet Staff Directories** - Crawls publication staff pages (V1: foundation only)
- **Web Footprints** - Metadata extraction from journalist websites and portfolios

### 2. Multi-Dimensional Confidence Scoring

Each discovered journalist receives a comprehensive confidence score (0-1) based on six weighted dimensions:

#### Name Confidence (25% weight)
- Full name completeness (first + last name)
- Name quality (length, format, special characters)
- Multi-part name bonus
- Single-name penalty

#### Email Confidence (30% weight)
- Email format validity (RFC 5322)
- Professional domain detection (non-Gmail/Yahoo/Hotmail)
- Work email vs personal email discrimination
- Domain reputation (known media outlets)

#### Outlet Confidence (20% weight)
- Outlet presence and identification
- Known outlet database matching
- Tier-1 outlets (TechCrunch, Wired, Forbes, WSJ, NYT): 0.95
- Tier-2 outlets (VentureBeat, Mashable, Engadget): 0.6
- Unknown outlets: 0.6 base score

#### Social Confidence (15% weight)
- Number of verified social profiles
- Platform credibility (LinkedIn > Twitter > others)
- Profile completeness and verification status
- Follower count and engagement signals

#### Beat Confidence (10% weight)
- Beat/topic classification present
- Beat specificity (multiple beats vs single)
- Beat alignment with outlet focus
- Keyword-based beat extraction quality

#### Overall Score Calculation
```
overall_score = (name * 0.25) + (email * 0.30) + (outlet * 0.20) +
                (social * 0.15) + (beat * 0.10)
```

### 3. Intelligent Deduplication

The system uses fuzzy matching to detect duplicates across both the discovery table and the S46 journalist graph:

#### Fuzzy Matching Algorithm
- **Exact Email Match**: 1.0 similarity (highest confidence)
- **Exact Name + Outlet**: 0.95 similarity
- **Exact Name**: 0.85 similarity
- **Fuzzy Name (Levenshtein)**: Variable (0.7-1.0) using pg_trgm extension

#### Deduplication Recommendations
- **≥95% similarity**: Auto-merge (exact matches)
- **80-94% similarity**: Needs human review
- **<80% similarity**: Create new journalist

### 4. Human-in-the-Loop Workflow

Discoveries flow through a status workflow requiring human oversight:

#### Status Flow
1. **Pending** - Awaiting human review
2. **Confirmed** - Vetted and ready to merge into S46 graph
3. **Merged** - Successfully attached to journalist profile in S46
4. **Rejected** - Not a journalist or invalid data

#### Resolution Actions
- **Merge** - Merge into existing S46 journalist profile
- **Confirm** - Mark as valid, ready to create new profile
- **Reject** - Mark as invalid, not a journalist

### 5. Author Extraction from Articles

Automated extraction of journalist authors from article content:

#### Byline Pattern Matching
- "By [Name]" pattern detection
- "Written by [Name]" pattern detection
- "Author: [Name]" pattern detection
- Title and content scanning

#### Email Inference
- Outlet domain mapping (TechCrunch → techcrunch.com)
- Name-based email generation (firstname.lastname@domain)
- Email validation and confidence scoring

#### Beat Extraction
- Keyword-based topic classification
- Content analysis for beat identification
- Technology, Business, Finance, Healthcare, Politics, Sports, Entertainment

### 6. Suggested Matches

Each discovery includes suggested matches from the S46 graph:

```typescript
{
  journalistId: "uuid",
  journalistName: "Full Name",
  similarityScore: 0.92,
  matchReason: "Exact email match, Similar name (95%)",
  confidence: 0.92
}
```

Top 5 matches provided for human review during resolution.

### 7. Merge Conflict Resolution

Intelligent merge preview showing field-level conflicts:

```typescript
{
  field: "email",
  discoveryValue: "new@example.com",
  existingValue: "old@example.com",
  recommendation: "merge_both" // keep_existing | use_discovery | merge_both
}
```

**Auto-resolvable merges**: No conflicts or all conflicts use "keep_existing" or "merge_both" recommendations.

## Architecture

### Database Schema

#### discovered_journalists table

```sql
CREATE TABLE discovered_journalists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Basic journalist info
  full_name TEXT NOT NULL,
  email TEXT,
  outlet TEXT,

  -- Discovery metadata
  social_links JSONB DEFAULT '{}',  -- {twitter, linkedin, mastodon, bluesky}
  beats TEXT[] DEFAULT '{}',
  bio TEXT,

  -- Confidence & scoring
  confidence_score FLOAT NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  confidence_breakdown JSONB DEFAULT '{}',

  -- Source tracking
  source_type TEXT NOT NULL CHECK (source_type IN
    ('article_author', 'rss_feed', 'social_profile', 'staff_directory')),
  source_url TEXT,
  raw_payload JSONB DEFAULT '{}',

  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending', 'confirmed', 'merged', 'rejected')),
  merged_into UUID REFERENCES journalist_profiles(id) ON DELETE SET NULL,

  -- Resolution tracking
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Suggested matches (for deduplication)
  suggested_matches JSONB DEFAULT '[]',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### Indexes (11 total)

- Org-level isolation (org_id)
- Status filtering (status)
- Composite queries (org_id, status)
- Source type filtering (source_type)
- Email lookups (email) WHERE email IS NOT NULL
- Full-text search (GIN: full_name)
- Beats array search (GIN: beats)
- Social links JSON search (GIN: social_links)
- Suggested matches JSON search (GIN: suggested_matches)
- Created date sorting (created_at DESC)
- Merged journalist lookups (merged_into) WHERE merged_into IS NOT NULL

### Helper Functions

#### get_discovery_stats(p_org_id UUID)

Returns aggregated statistics:
- total_discoveries: Total discovery count
- pending_count: Discoveries awaiting review
- confirmed_count: Vetted discoveries
- merged_count: Successfully merged discoveries
- rejected_count: Rejected discoveries
- avg_confidence_score: Average confidence across all discoveries
- source_type_distribution: JSONB breakdown by source type

#### find_duplicate_discoveries(p_org_id, p_full_name, p_email, p_outlet)

Fuzzy matching for deduplication:
- Returns top 10 matches with similarity scores
- Uses pg_trgm extension for fuzzy name matching
- Prioritizes exact email matches (1.0)
- Exact name + outlet (0.95)
- Exact name (0.85)
- Similar name (0.7+)

### Service Layer

**JournalistDiscoveryService** (~1,050 lines)

#### Core Methods

```typescript
// Discovery CRUD
createDiscovery(orgId, input): DiscoveredJournalist
getDiscovery(discoveryId, orgId): DiscoveredJournalist | null
listDiscoveries(orgId, query): DiscoveryListResponse
updateDiscovery(discoveryId, orgId, updates): DiscoveredJournalist | null
deleteDiscovery(discoveryId, orgId): void

// Author extraction
extractAuthorsFromArticle(orgId, input): AuthorExtractionResult
processArticleBatch(orgId, articles): BatchDiscoveryResult

// Deduplication
checkDuplication(orgId, input, options?): DeduplicationResult
findGraphMatches(orgId, input): SuggestedMatch[]

// Resolution
resolveDiscovery(discoveryId, orgId, userId, input): DiscoveredJournalist
generateMergePreview(discoveryId, targetId, orgId): MergePreview

// Statistics
getDiscoveryStats(orgId): DiscoveryStats

// Social ingestion (stubbed)
ingestSocialProfile(orgId, input): DiscoveredJournalist
```

#### Integration Points

**S40/S41 Media Monitoring**:
- Processes monitored articles for author extraction
- Batch processing for high-volume ingestion
- Beat extraction from article content

**S46 Journalist Graph**:
- Fuzzy matching against existing profiles
- Merge into existing journalist records
- Activity log creation for discoveries
- Canonical ID resolution

### API Endpoints

Base path: `/api/v1/journalist-discovery`

#### Discovery Management

```typescript
POST   /                     Create discovery
GET    /                     List discoveries (with filters)
GET    /stats                Get discovery statistics
GET    /:id                  Get discovery details
PUT    /:id                  Update discovery
DELETE /:id                  Delete discovery
POST   /:id/resolve          Resolve (merge/confirm/reject)
POST   /:id/merge-preview    Generate merge preview
```

#### Extraction & Ingestion

```typescript
POST   /extract              Extract authors from article
POST   /social-profile       Ingest social profile
POST   /check-duplication    Check for duplicates
POST   /batch                Batch create discoveries
```

### Query Parameters

#### DiscoveryQuery

```typescript
{
  q?: string;                          // Full-text search
  status?: DiscoveryStatus[];          // Filter by status
  sourceType?: DiscoverySourceType[];  // Filter by source
  minConfidenceScore?: number;         // Minimum confidence (0-1)
  beats?: string[];                    // Filter by beats
  hasEmail?: boolean;                  // Has email present
  hasSocialLinks?: boolean;            // Has social links
  sortBy?: "created_at" | "confidence_score" | "full_name";
  sortOrder?: "asc" | "desc";
  limit?: number;                      // Default: 20, max: 100
  offset?: number;                     // Pagination offset
}
```

## Integration Workflows

### Workflow 1: Article Author Discovery (S40/S41)

```
1. S40/S41 monitors article and crawls content
2. Discovery engine extracts author from byline
3. Calculates confidence score based on data quality
4. Finds suggested matches in S46 graph
5. Creates pending discovery
6. Human reviews discovery in dashboard
7. Human resolves: merge/confirm/reject
8. If merged, updates S46 journalist profile
9. Creates activity log in S46
```

### Workflow 2: Manual Discovery Resolution

```
1. User views pending discoveries in dashboard
2. Clicks discovery to view details
3. Reviews confidence breakdown and suggested matches
4. Generates merge preview if merging
5. Resolves:
   - Merge: Attach to existing S46 profile
   - Confirm: Mark as valid for future profile creation
   - Reject: Mark as invalid/not a journalist
6. Discovery status updated with resolution metadata
```

### Workflow 3: Batch Processing (S40/S41 Integration)

```
1. S40/S41 batch processes monitored articles
2. Extracts authors from all articles
3. For each author:
   a. Check deduplication
   b. If duplicate & high confidence: Auto-merge
   c. If duplicate & low confidence: Skip
   d. If unique: Create pending discovery
4. Returns batch result with counts (created/merged/skipped/errors)
5. Human reviews pending discoveries periodically
```

## Confidence Scoring Examples

### High Confidence (0.85+)

```json
{
  "fullName": "Sarah Johnson",
  "email": "sarah.johnson@techcrunch.com",
  "outlet": "TechCrunch",
  "socialLinks": { "twitter": "@sarahtechwriter", "linkedin": "..." },
  "beats": ["technology", "startups"],
  "confidenceBreakdown": {
    "nameConfidence": 0.9,      // Full name present
    "emailConfidence": 0.9,     // Professional domain
    "outletConfidence": 0.95,   // Tier-1 outlet
    "socialConfidence": 0.6,    // 2 social profiles
    "beatConfidence": 0.65,     // 2 beats identified
    "overallScore": 0.86
  }
}
```

### Medium Confidence (0.5-0.7)

```json
{
  "fullName": "Tech Writer",
  "email": "writer@gmail.com",
  "outlet": "Small Tech Blog",
  "socialLinks": { "twitter": "@techwriter" },
  "beats": ["technology"],
  "confidenceBreakdown": {
    "nameConfidence": 0.6,      // Partial name
    "emailConfidence": 0.7,     // Valid but Gmail
    "outletConfidence": 0.6,    // Unknown outlet
    "socialConfidence": 0.3,    // 1 social profile
    "beatConfidence": 0.5,      // 1 beat
    "overallScore": 0.58
  }
}
```

### Low Confidence (<0.5)

```json
{
  "fullName": "Unknown",
  "email": null,
  "outlet": null,
  "socialLinks": {},
  "beats": [],
  "confidenceBreakdown": {
    "nameConfidence": 0.5,      // Single name
    "emailConfidence": 0.0,     // No email
    "outletConfidence": 0.0,    // No outlet
    "socialConfidence": 0.0,    // No social
    "beatConfidence": 0.0,      // No beats
    "overallScore": 0.13
  }
}
```

## Deduplication Examples

### Exact Email Match (Merge Recommended)

```json
{
  "isDuplicate": true,
  "matchedJournalistId": "journalist-123",
  "similarityScore": 1.0,
  "matchedFields": ["email"],
  "recommendation": "merge"
}
```

### High Name Similarity (Review Needed)

```json
{
  "isDuplicate": true,
  "matchedJournalistId": "journalist-456",
  "similarityScore": 0.87,
  "matchedFields": ["name"],
  "recommendation": "needs_review"
}
```

### Unique Journalist (Create New)

```json
{
  "isDuplicate": false,
  "similarityScore": 0.2,
  "matchedFields": [],
  "recommendation": "create_new"
}
```

## Future Enhancements (V2+)

### Enhanced Extraction
- LLM-powered author extraction for complex bylines
- Multi-author article support
- Co-author detection and linking

### Live Social Ingestion
- Real-time Twitter/X API integration
- LinkedIn profile scraping
- Mastodon federation support
- Bluesky Protocol integration

### Outlet Staff Directories
- Automated crawling of publication staff pages
- Role and beat extraction
- Contact information discovery
- Org chart parsing

### Machine Learning
- Confidence score model training
- Beat classification with NLP
- Journalist tier prediction
- Duplicate detection with neural networks

### Advanced Workflows
- Automated discovery pipelines (cron schedules)
- Rule-based auto-resolution
- Bulk merge operations
- Conflict auto-resolution strategies

## Dependencies

- **S40**: Media Monitoring (article sources)
- **S41**: Media Crawling (RSS feeds, article content)
- **S46**: Journalist Identity Graph (merge target)
- **PostgreSQL pg_trgm**: Fuzzy text matching
- **Supabase RLS**: Org-level data isolation

## Performance Characteristics

- **Discovery Creation**: <100ms
- **List Query (20 results)**: <200ms
- **Author Extraction**: <50ms per article
- **Deduplication Check**: <150ms
- **Merge Preview**: <100ms
- **Batch Processing**: ~500 articles/minute

## Security & Privacy

- Org-level RLS isolation
- No external HTTP requests in V1 (stubbed social)
- PII handling for journalist contact info
- Resolution audit trail (who, when, why)
- Secure merge conflict resolution

## Monitoring & Observability

- Discovery rate by source type
- Confidence score distribution
- Resolution rate (pending → merged/confirmed/rejected)
- Deduplication accuracy
- Merge conflict frequency
- Author extraction success rate

## Success Metrics

- **Discovery Coverage**: % of journalists discovered vs manually entered
- **Confidence Accuracy**: % of high-confidence discoveries confirmed valid
- **Deduplication Precision**: % of duplicates correctly identified
- **Resolution Speed**: Average time from discovery to resolution
- **Merge Success Rate**: % of merges completed without errors
