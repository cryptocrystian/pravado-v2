# AI Media List Builder V1 (Sprint S47)

## Overview

Sprint S47 implements an intelligent AI-powered media list generation system that automatically creates hyper-targeted journalist lists using multi-dimensional fit scoring. The system analyzes the journalist identity graph from S46, historical coverage data from S40-S43, and outreach performance from S44-S45 to identify the best-fit journalists for any given topic or campaign.

## Key Features

### 1. AI-Powered List Generation

The system automatically generates targeted media lists based on:

- **Topic & Keywords** - Primary subject matter and related terms
- **Market Segmentation** - Industry or market focus (B2B SaaS, Consumer Tech, etc.)
- **Geographic Targeting** - Regional or global targeting
- **Product Context** - Specific product or company context
- **Tier Filtering** - Select A/B/C/D tier journalists
- **Fit Score Thresholds** - Minimum relevance requirements

### 2. Multi-Dimensional Fit Scoring

Each journalist receives a comprehensive fit score (0-1) based on five weighted dimensions:

#### Topic Relevance (40% weight)
- String similarity between topic and journalist beat/bio
- Keyword matching in beat and bio
- Fuzzy matching using Levenshtein distance
- Containment bonuses for exact matches

#### Past Coverage (25% weight)
- Historical coverage of related topics
- Recency of relevant articles (last 3 months weighted higher)
- Volume of coverage normalized to baseline
- Coverage quality based on sentiment

#### Engagement Score (15% weight)
- Historical engagement metrics from S46
- Email open rates, link clicks, responses
- Relationship strength indicators

#### Responsiveness Score (10% weight)
- Reply rates from S45 deliverability data
- Response time patterns
- Communication history quality

#### Outlet Tier (10% weight)
- **Tier 1**: WSJ, NYT, Bloomberg, Reuters, TechCrunch, Wired, Forbes, etc. (score: 1.0)
- **Tier 2**: VentureBeat, Mashable, Fast Company, Inc, ZDNet, CNET (score: 0.6)
- **Tier 3**: All other outlets (score: 0.3)

### 3. Intelligent Tiering System

Journalists are automatically classified into tiers based on fit scores:

- **A-Tier** (≥80%): High-value, highly relevant - top priority targets
- **B-Tier** (60-79%): Strong potential - excellent secondary targets
- **C-Tier** (40-59%): Moderate fit - consider for broader campaigns
- **D-Tier** (<40%): Low relevance - generally skip unless volume needed

### 4. Comprehensive List Management

- **Create & Save Lists** - Save generated results with custom names and descriptions
- **View Details** - Full journalist profiles with fit score breakdowns
- **Filter & Sort** - By tier, fit score, position
- **Update Metadata** - Edit list names and descriptions
- **Delete Lists** - Remove lists when no longer needed
- **Track Stats** - Tier distribution, average fit scores, total matches

### 5. Human-Readable Reasoning

Each journalist match includes natural language explanation:

```
Strong topic relevance (beat: 'Healthcare Technology');
Covered 5 relevant articles in last 3 months;
High engagement (85% score);
Tier-1 outlet (TechCrunch);
Strong responsiveness (70% reply rate)
```

## Architecture

### Database Schema

#### media_lists table

```sql
CREATE TABLE media_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  name TEXT NOT NULL,
  description TEXT,
  input_topic TEXT NOT NULL,
  input_keywords TEXT[] DEFAULT '{}',
  input_market TEXT,
  input_geography TEXT,
  input_product TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### media_list_entries table

```sql
CREATE TABLE media_list_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES media_lists(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,
  fit_score FLOAT NOT NULL CHECK (fit_score BETWEEN 0 AND 1),
  tier TEXT NOT NULL CHECK (tier IN ('A', 'B', 'C', 'D')),
  reason TEXT NOT NULL,
  fit_breakdown JSONB DEFAULT '{}',
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

- `idx_media_lists_org_id` - Organization isolation for RLS
- `idx_media_lists_topic` - Topic-based filtering
- `idx_media_lists_created_by` - User-based filtering
- `idx_media_list_entries_list_id` - Entry lookups
- `idx_media_list_entries_fit_score` - Fit score sorting
- `idx_media_list_entries_tier` - Tier filtering

### RLS Policies

All tables implement org-level Row Level Security:
- SELECT: Users can only view lists from their organization
- INSERT: Authenticated users can create lists in their organization
- UPDATE: Users can update their organization's lists
- DELETE: Users can delete their organization's lists

## Fit Scoring Algorithm

### String Similarity (Levenshtein Distance)

```typescript
function stringSimilarity(s1: string, s2: string): number {
  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 1.0 : 1 - distance / maxLength;
}
```

### Topic Relevance Calculation

```typescript
score = (beatAlignment × 0.5) + (bioAlignment × 0.3) + (keywordScore × 0.2)

where:
  beatAlignment = stringSimilarity(beat, topic) + containmentBonus
  bioAlignment = stringSimilarity(bio, topic) × 0.5 + containmentBonus
  keywordScore = matchedKeywords / totalKeywords
```

### Past Coverage Analysis

```typescript
score = (relevanceRate × 0.5) + (recencyRate × 0.3) + (volumeScore × 0.2)

where:
  relevanceRate = relevantArticles / totalArticles
  recencyRate = recentArticles / totalArticles  // last 3 months
  volumeScore = min(1.0, totalArticles / 20)    // normalized to 20 articles
```

### Overall Fit Score

```typescript
fitScore =
  (topicRelevance × 0.40) +
  (pastCoverage × 0.25) +
  (engagement × 0.15) +
  (responsiveness × 0.10) +
  (outletTier × 0.10)
```

### Tier Assignment

```typescript
if (fitScore >= 0.8) tier = 'A';
else if (fitScore >= 0.6) tier = 'B';
else if (fitScore >= 0.4) tier = 'C';
else tier = 'D';
```

## API Endpoints

### POST /api/v1/media-lists/generate
Generate AI-powered media list

**Request:**
```json
{
  "topic": "AI in healthcare",
  "keywords": ["machine learning", "medical diagnosis"],
  "market": "Healthcare Tech",
  "geography": "North America",
  "product": "MedAI Platform",
  "targetCount": 50,
  "minFitScore": 0.3,
  "includeTiers": ["A", "B", "C", "D"]
}
```

**Response:**
```json
{
  "matches": [
    {
      "journalistId": "uuid",
      "journalist": {
        "id": "uuid",
        "fullName": "Jane Smith",
        "primaryEmail": "jane@techcrunch.com",
        "primaryOutlet": "TechCrunch",
        "beat": "Healthcare Technology",
        "engagementScore": 0.85,
        "responsivenessScore": 0.70,
        "relevanceScore": 0.90,
        "tier": "tier1"
      },
      "fitScore": 0.87,
      "tier": "A",
      "reason": "Strong topic relevance (beat: 'Healthcare Technology'); Covered 5 relevant articles in last 3 months; High engagement (85% score); Tier-1 outlet; Strong responsiveness (70% reply rate)",
      "fitBreakdown": {
        "topicRelevance": 0.92,
        "pastCoverage": 0.85,
        "engagement": 0.85,
        "responsiveness": 0.70,
        "outletTier": 1.0,
        "totalScore": 0.87
      }
    }
  ],
  "metadata": {
    "totalCandidates": 150,
    "totalMatches": 45,
    "avgFitScore": 0.72,
    "tierDistribution": {
      "A": 12,
      "B": 18,
      "C": 15,
      "D": 0
    },
    "generatedAt": "2024-11-25T10:30:00Z"
  }
}
```

### POST /api/v1/media-lists
Create and save media list

**Request:**
```json
{
  "name": "Healthcare AI Campaign Q1 2024",
  "description": "Top journalists covering AI in healthcare",
  "inputTopic": "AI in healthcare",
  "inputKeywords": ["machine learning", "diagnosis"],
  "inputMarket": "Healthcare Tech",
  "inputGeography": "North America",
  "entries": [
    {
      "journalistId": "uuid",
      "fitScore": 0.87,
      "tier": "A",
      "reason": "...",
      "fitBreakdown": { ... },
      "position": 0
    }
  ]
}
```

### GET /api/v1/media-lists
List all media lists (paginated)

**Query Parameters:**
- `q` - Full-text search
- `topic` - Filter by topic
- `market` - Filter by market
- `createdBy` - Filter by creator
- `sortBy` - created_at | updated_at | name
- `sortOrder` - asc | desc
- `limit` - Results per page (1-100, default: 50)
- `offset` - Pagination offset

### GET /api/v1/media-lists/:id
Get single media list with entries

### PUT /api/v1/media-lists/:id
Update media list metadata

### DELETE /api/v1/media-lists/:id
Delete media list (cascades to entries)

### GET /api/v1/media-lists/:id/entries
Get media list entries with filtering

**Query Parameters:**
- `tier` - Filter by tier (A, B, C, D) - can be array
- `minFitScore` - Minimum fit score threshold
- `sortBy` - fit_score | position
- `sortOrder` - asc | desc
- `limit` - Results per page
- `offset` - Pagination offset

## Frontend Components

### Media List Generator Form
- Topic input (required)
- Keywords input (comma-separated)
- Market, geography, product inputs
- Target count slider (1-200)
- Min fit score slider (0-1)
- Tier checkboxes (A/B/C/D)
- Generate button with loading state

### Media List Result Preview
- Summary stats (total matches, tier distribution, avg fit score)
- Results table with journalist details
- Fit score badges with color coding
- Tier badges with color coding
- Reason explanations
- Save and Cancel actions

### Media List Card
- List name and description
- Topic, keywords, market, geography tags
- Tier distribution stats
- Average fit score
- View and Delete actions

### Media List Entry Table
- Sortable columns
- Journalist name and email
- Outlet and beat
- Tier badge
- Fit score badge
- Reason explanation
- Click to view journalist profile

### Supporting Components
- **TierBadge** - Colored badges for A/B/C/D tiers
- **FitScoreBadge** - Color-coded percentage badges
- **KeywordChips** - Rounded chips for keyword display

## Integration Points

### S12: Topic Clustering
- Uses topic analysis for keyword extraction
- Semantic similarity for topic matching

### S38-S43: PR Intelligence
- **S38**: Press release content for topic context
- **S39**: Pitch targeting insights
- **S40**: Media monitoring coverage data
- **S41**: RSS feed article tracking
- **S42**: Scheduled list regeneration
- **S43**: Media alerts for journalist activity

### S44: Journalist Outreach
- Outreach sequence targeting from media lists
- Batch outreach to list entries
- Performance tracking per list

### S45: Deliverability Analytics
- Responsiveness scores from email engagement
- Reply rate calculation
- Optimal send times per journalist

### S46: Journalist Identity Graph
- **Primary Integration** - Unified journalist profiles
- Engagement and relevance scores
- Activity log for coverage analysis
- Contact intelligence for targeting

## Use Cases

### 1. Product Launch Campaign
```typescript
// Generate list for new AI healthcare product launch
const input = {
  topic: "AI-powered medical diagnosis",
  keywords: ["machine learning", "radiology", "diagnosis"],
  market: "HealthTech",
  geography: "North America",
  product: "DiagnosisAI Platform",
  targetCount: 30,
  minFitScore: 0.6,
  includeTiers: ['A', 'B']  // Only top-tier journalists
};

const result = await generateMediaList(orgId, input);
// Returns 30 highly-relevant journalists with 60%+ fit scores
```

### 2. Thought Leadership Campaign
```typescript
// Broader list for thought leadership content
const input = {
  topic: "Future of AI in healthcare",
  keywords: ["AI ethics", "healthcare innovation", "patient care"],
  targetCount: 100,
  minFitScore: 0.3,  // Lower threshold for broader reach
  includeTiers: ['A', 'B', 'C']
};
```

### 3. Industry-Specific Targeting
```typescript
// Target specific market segment
const input = {
  topic: "Enterprise SaaS security",
  keywords: ["cybersecurity", "compliance", "data protection"],
  market: "B2B SaaS",
  geography: "Global",
  targetCount: 50,
  minFitScore: 0.5,
  includeTiers: ['A', 'B', 'C']
};
```

### 4. Competitive Analysis
```typescript
// Find journalists covering competitors
const input = {
  topic: "CRM software",
  keywords: ["Salesforce", "HubSpot", "customer relationship"],
  market: "B2B SaaS",
  targetCount: 75,
  minFitScore: 0.4
};
```

## Performance Considerations

### Query Optimization
- Indexes on org_id, topic, tier, fit_score
- Pagination to limit result sets
- JSONB indexes for fit_breakdown queries
- Materialized view for list summaries (future optimization)

### Scoring Performance
- Batch processing for large candidate pools
- Async activity log queries
- Caching of journalist profiles
- String similarity memoization

### Scalability
- Horizontal scaling via org-level sharding
- Background jobs for large list generation (future)
- Rate limiting on generation endpoint
- Query result caching

## Feature Flags

- `ENABLE_MEDIA_LISTS` - Master switch for media list builder (default: true)

## Testing

### Backend Tests
- `tests/mediaListService.test.ts` - 14 comprehensive unit tests
  - Generate media list with fit scoring
  - Save media list with entries
  - List management (CRUD operations)
  - Entry filtering and sorting
  - Fit scoring algorithm validation
  - Tier classification
  - Error handling

### E2E Tests
- `tests/media-lists.spec.ts` - 25 Playwright tests
  - Authentication flow
  - List generation UI
  - Form validation
  - Results preview
  - List management
  - Detail views
  - Navigation flows
  - Component rendering

## Future Enhancements

### Planned for S48+
- **AI Reasoning Engine** - GPT-4 powered fit explanations
- **Auto-Refresh Lists** - Periodic list regeneration
- **Export Capabilities** - CSV/Excel export with all details
- **Bulk Operations** - Multi-list operations
- **List Templates** - Saved search templates
- **Collaboration** - Shared lists across team
- **List Analytics** - Outreach performance per list
- **Smart Suggestions** - AI-powered keyword suggestions
- **Historical Trends** - Fit score trends over time
- **Lookalike Lists** - Generate similar lists
- **Exclusion Lists** - Blacklist certain journalists
- **Custom Scoring** - Adjustable scoring weights

## Monitoring & Observability

### Key Metrics
- List generation duration
- Average fit scores per list
- Tier distribution patterns
- Most common topics/keywords
- Generation failures/errors
- API endpoint latencies
- Cache hit rates

### Audit Events
- `media_list.generated` - List generation completed
- `media_list.created` - List saved
- `media_list.viewed` - List viewed
- `media_list.updated` - List metadata updated
- `media_list.deleted` - List deleted
- `media_list.generation_failed` - Generation error

## Security Considerations

### Data Access
- RLS policies enforce org-level isolation
- No cross-org data leakage
- Journalist profiles protected by S46 RLS
- API endpoints require authentication

### Input Validation
- Topic length limits (500 chars)
- Keyword count limits (100 keywords max)
- Target count limits (1-200)
- Fit score range validation (0-1)
- SQL injection prevention via parameterized queries

### Rate Limiting
- Generation endpoint rate-limited per org
- Prevents abuse and resource exhaustion
- Quota tracking for billing (future)

## Known Limitations

1. **Scoring Accuracy** - Fit scores are estimates based on available data
2. **Coverage Data** - Requires S40-S43 data; new journalists may score lower
3. **String Matching** - Levenshtein distance has limitations with very different phrasings
4. **Real-time Updates** - Lists are snapshots; journalist data may change
5. **Geographic Accuracy** - Geography matching is keyword-based, not geocoded
6. **Language Support** - Currently optimized for English-language journalism

## Migration Path

### From Manual Lists (S1-S46)
1. Export existing manual journalist lists
2. Recreate using media list generator
3. Compare fit scores with manual selections
4. Refine keywords and targeting
5. Replace manual lists with AI-generated lists

### Integration with Existing Workflows
- Media lists integrate seamlessly with S44 outreach sequences
- Lists can be used as targeting input for S39 pitch campaigns
- S40 monitoring alerts can trigger list regeneration

## Success Metrics

### User Adoption
- Number of lists generated per org
- Average list size
- Regeneration frequency
- Save rate (preview → save conversion)

### Quality Metrics
- Average fit scores of saved lists
- A/B tier percentage in saved lists
- User feedback on journalist relevance
- Outreach success rate from generated lists

### Performance Metrics
- Generation time < 5 seconds for 50 journalists
- API p95 latency < 1 second
- Zero RLS policy violations
- 99.9% uptime for generation endpoint

## Conclusion

The AI Media List Builder transforms journalist targeting from manual research into intelligent, data-driven list generation. By combining the journalist identity graph (S46), historical coverage (S40-S43), and engagement data (S44-S45) with sophisticated fit scoring algorithms, the system enables PR teams to:

- **Save Time** - Generate targeted lists in seconds vs hours of manual research
- **Improve Quality** - Data-driven fit scores vs gut feelings
- **Increase Coverage** - Discover relevant journalists you might have missed
- **Optimize Campaigns** - Target the right journalists for each campaign
- **Track Performance** - Measure list quality and refine over time

The system provides a foundation for future AI-powered PR intelligence features while delivering immediate value through intelligent automation of a time-consuming manual process.
