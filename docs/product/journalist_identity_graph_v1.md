# Journalist Identity Graph & Contact Intelligence V1

**Sprint**: S46
**Status**: ✅ Shipped
**Feature Flag**: `ENABLE_JOURNALIST_GRAPH`

## Overview

The Journalist Identity Graph is a unified contact intelligence system that consolidates journalist data from all PR systems (S38-S45) into a single, deduplicated identity layer. It provides identity resolution, engagement scoring, relationship mapping, and intelligent contact management across the entire PR lifecycle.

## Key Features

### 1. Unified Journalist Profiles
- Centralized journalist identity database
- Primary and secondary email tracking
- Outlet affiliations and beat coverage areas
- Social media profile consolidation
- Manual override and enrichment capabilities

### 2. Identity Resolution & Deduplication
- Fuzzy matching using Levenshtein distance algorithm
- Email-based identity matching (primary and secondary)
- Name similarity detection (>70% threshold)
- Outlet-based correlation
- Automated duplicate detection
- Assisted profile merging with conflict resolution

### 3. Cross-System Activity Tracking
- Unified activity log across all PR systems
- Activity types:
  - `press_release_sent` (S38)
  - `pitch_sent` (S39)
  - `mention_detected` (S40)
  - `coverage_published` (S40)
  - `outreach_email` (S44)
  - `email_opened` (S45)
  - `email_clicked` (S45)
  - `email_replied` (S45)
- Source system attribution
- Activity metadata and context preservation

### 4. Multi-Dimensional Scoring Models

#### Engagement Score (0.0 - 1.0)
Weighted composite score:
```
engagement_score = (response_rate × 0.4) +
                   (coverage_rate × 0.3) +
                   (open_rate × 0.2) +
                   (activity_volume × 0.1)
```

Where:
- `response_rate = replies / emails_sent`
- `coverage_rate = coverage_events / total_outreach`
- `open_rate = opens / emails_sent`
- `activity_volume = min(1.0, total_activities / 100)`

#### Responsiveness Score (0.0 - 1.0)
V1 Implementation: `reply_rate = replies / emails_sent`
Future: Time-to-response analysis, conversation depth

#### Relevance Score (0.0 - 1.0)
V1 Implementation: Default 0.5 (stub)
Future: Beat alignment, topic matching, historical coverage analysis

### 5. Tier Classification System

4-tier journalist classification (A/B/C/D) based on:

| Criterion | Weight | Levels |
|-----------|--------|--------|
| Outlet Tier | 40% | tier1 (major) / tier2 (mid) / tier3 (niche) |
| Engagement Level | 30% | high (≥0.7) / medium (≥0.4) / low (<0.4) |
| Coverage Frequency | 20% | frequent (≥10) / occasional (≥3) / rare (<3) |
| Responsiveness | 10% | high (≥0.5) / medium (≥0.2) / low (<0.2) |

**Tier Mapping**:
- **A-Tier**: 80-100 points (high-value, highly engaged)
- **B-Tier**: 60-79 points (strong potential, active)
- **C-Tier**: 40-59 points (moderate engagement)
- **D-Tier**: 0-39 points (low engagement, cold contacts)

### 6. Graph Intelligence
- Node types: journalist, outlet, topic, coverage, outreach
- Edge types: works_for, covers, wrote_about, received_outreach, mentioned_in, collaborated_with
- Relationship strength weighting
- Graph generation with configurable depth and filters
- Ready for D3.js visualization

### 7. Dashboard Interface
- Journalist list with search and filters
- Engagement score visualization
- Beat and outlet filtering
- Last activity tracking
- Quick access to journalist profiles

## Architecture

### Database Schema (Migration 51)

#### `journalist_profiles`
Core journalist identity table with RLS policies:

```sql
CREATE TABLE journalist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,

  -- Identity fields
  full_name TEXT NOT NULL,
  primary_email TEXT NOT NULL,
  secondary_emails TEXT[] DEFAULT '{}',

  -- Affiliation fields
  primary_outlet TEXT,
  secondary_outlets TEXT[] DEFAULT '{}',
  beat TEXT,

  -- Social profiles
  twitter_handle TEXT,
  linkedin_url TEXT,
  bio TEXT,

  -- Scoring fields
  engagement_score FLOAT DEFAULT 0.0 CHECK (engagement_score BETWEEN 0 AND 1),
  responsiveness_score FLOAT DEFAULT 0.0 CHECK (responsiveness_score BETWEEN 0 AND 1),
  relevance_score FLOAT DEFAULT 0.0 CHECK (relevance_score BETWEEN 0 AND 1),
  tier TEXT CHECK (tier IN ('A', 'B', 'C', 'D')),

  -- Metadata
  last_activity_at TIMESTAMPTZ,
  last_scored_at TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  UNIQUE (org_id, primary_email)
);

CREATE INDEX idx_journalist_profiles_org_email ON journalist_profiles(org_id, primary_email);
CREATE INDEX idx_journalist_profiles_engagement ON journalist_profiles(org_id, engagement_score DESC);
CREATE INDEX idx_journalist_profiles_outlet ON journalist_profiles(org_id, primary_outlet);
CREATE INDEX idx_journalist_profiles_beat ON journalist_profiles(org_id, beat);
```

#### `journalist_merge_map`
Tracks merged journalist identities:

```sql
CREATE TABLE journalist_merge_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  merged_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,
  canonical_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,
  merged_at TIMESTAMPTZ DEFAULT NOW(),
  merged_by UUID REFERENCES auth.users(id),
  merge_reason TEXT
);
```

#### `journalist_activity_log`
Unified activity tracking across all PR systems:

```sql
CREATE TABLE journalist_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,

  -- Activity classification
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'press_release_sent',
    'pitch_sent',
    'mention_detected',
    'coverage_published',
    'outreach_email',
    'email_opened',
    'email_clicked',
    'email_replied',
    'manual_log'
  )),

  -- Source tracking
  source_system TEXT NOT NULL CHECK (source_system IN (
    's38_pr_generator',
    's39_pitch_engine',
    's40_media_monitoring',
    's44_outreach',
    's45_deliverability',
    'manual'
  )),
  source_id TEXT,

  -- Activity metadata
  activity_data JSONB DEFAULT '{}',
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),

  -- Timing
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journalist_activity_journalist ON journalist_activity_log(journalist_id, occurred_at DESC);
CREATE INDEX idx_journalist_activity_org_type ON journalist_activity_log(org_id, activity_type, occurred_at DESC);
```

### Database Functions

#### `calculate_engagement_score()`
Automatically calculates weighted engagement score from activity data.

#### `update_journalist_scores()`
Recalculates all scoring dimensions (engagement, responsiveness, relevance) and tier classification.

#### `get_journalist_activity_summary()`
Returns aggregated activity metrics for scoring calculations.

#### `get_canonical_journalist_id()`
Resolves merged journalist IDs to their canonical profile ID.

### Service Layer

#### `JournalistGraphService` (1150 lines)

**Profile Management**:
- `createProfile(orgId, input)` - Create journalist profile
- `getProfile(id, orgId)` - Get single profile
- `getEnrichedProfile(id, orgId)` - Get profile with all related data
- `listProfiles(orgId, query)` - List with filters and pagination
- `updateProfile(id, orgId, input)` - Update profile fields
- `deleteProfile(id, orgId)` - Soft delete profile

**Identity Resolution**:
- `findMatches(orgId, input)` - Fuzzy matching with similarity scores
- `findDuplicates(orgId)` - Automated duplicate detection
- `mergeProfiles(orgId, input)` - Merge two profiles with conflict resolution

**Activity Tracking**:
- `createActivity(orgId, input)` - Log single activity
- `batchCreateActivities(orgId, inputs)` - Bulk activity logging
- `listActivities(orgId, query)` - Query activities with filters

**Scoring & Classification**:
- `calculateEngagementScore(journalistId, orgId)` - Engagement score calculation
- `calculateResponsivenessScore(journalistId, orgId)` - Responsiveness score
- `calculateRelevanceScore(journalistId, orgId)` - Relevance score (stub in V1)
- `updateAllScores(journalistId, orgId)` - Recalculate all dimensions
- `batchUpdateScores(orgId, journalistIds)` - Bulk score updates
- `classifyTier(journalistId, orgId)` - Calculate tier classification

**Graph Builder**:
- `buildGraph(orgId, query)` - Generate journalist graph with nodes and edges

## API Endpoints

### Profile Management

#### `GET /api/v1/journalist-graph/profiles`
List journalist profiles with filters.

**Query Parameters**:
- `q` - Full-text search (name, email, outlet)
- `outlet` - Filter by outlet
- `beat` - Filter by beat
- `minEngagementScore` - Minimum engagement score (0.0-1.0)
- `minRelevanceScore` - Minimum relevance score (0.0-1.0)
- `sortBy` - Sort field (engagement_score, relevance_score, last_activity_at, full_name)
- `sortOrder` - Sort order (asc, desc)
- `limit` - Page size (default: 50, max: 100)
- `offset` - Pagination offset

**Response**:
```json
{
  "success": true,
  "data": {
    "profiles": [
      {
        "id": "uuid",
        "fullName": "Jane Reporter",
        "primaryEmail": "jane@techcrunch.com",
        "secondaryEmails": ["jane.reporter@gmail.com"],
        "primaryOutlet": "TechCrunch",
        "beat": "Enterprise SaaS",
        "engagementScore": 0.82,
        "responsivenessScore": 0.75,
        "relevanceScore": 0.5,
        "tier": "A",
        "lastActivityAt": "2025-11-20T10:30:00Z"
      }
    ],
    "total": 142,
    "limit": 50,
    "offset": 0
  }
}
```

#### `GET /api/v1/journalist-graph/profiles/:id`
Get single journalist profile.

#### `GET /api/v1/journalist-graph/profiles/:id/enriched`
Get profile with all related data (activities, coverage, outreach history).

#### `POST /api/v1/journalist-graph/profiles`
Create new journalist profile.

**Request Body**:
```json
{
  "fullName": "Jane Reporter",
  "primaryEmail": "jane@techcrunch.com",
  "secondaryEmails": ["jane.reporter@gmail.com"],
  "primaryOutlet": "TechCrunch",
  "beat": "Enterprise SaaS",
  "twitterHandle": "@janereporter",
  "linkedinUrl": "https://linkedin.com/in/janereporter",
  "bio": "Senior tech reporter covering enterprise SaaS and cloud infrastructure",
  "notes": "Met at TechCrunch Disrupt 2024"
}
```

#### `PUT /api/v1/journalist-graph/profiles/:id`
Update journalist profile.

#### `DELETE /api/v1/journalist-graph/profiles/:id`
Delete journalist profile.

### Identity Resolution

#### `POST /api/v1/journalist-graph/resolve-identity`
Find matching journalists using fuzzy matching.

**Request Body**:
```json
{
  "fullName": "Jane Reporter",
  "email": "jane@techcrunch.com",
  "outlet": "TechCrunch",
  "matchThreshold": 0.5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "profile": { /* journalist profile */ },
        "matchScore": 0.95,
        "matchReasons": [
          "Email exact match",
          "Name similarity: 0.98",
          "Outlet match"
        ]
      }
    ]
  }
}
```

#### `POST /api/v1/journalist-graph/find-duplicates`
Find potential duplicate profiles.

**Response**:
```json
{
  "success": true,
  "data": {
    "duplicateSets": [
      {
        "profiles": [/* profiles */],
        "matchScore": 0.87,
        "suggestedCanonical": "uuid"
      }
    ]
  }
}
```

#### `POST /api/v1/journalist-graph/merge-profiles`
Merge two journalist profiles.

**Request Body**:
```json
{
  "sourceId": "uuid-to-merge",
  "targetId": "uuid-to-keep",
  "fieldResolution": {
    "primaryEmail": "target",
    "primaryOutlet": "source",
    "bio": "target"
  }
}
```

### Activity Tracking

#### `GET /api/v1/journalist-graph/activities`
List activities with filters.

**Query Parameters**:
- `journalistId` - Filter by journalist
- `activityType` - Filter by type (can be array)
- `sourceSystem` - Filter by source system (can be array)
- `sentiment` - Filter by sentiment (positive, neutral, negative)
- `startDate` - Start date for time range
- `endDate` - End date for time range
- `limit` - Page size
- `offset` - Pagination offset

#### `POST /api/v1/journalist-graph/activities`
Create single activity.

**Request Body**:
```json
{
  "journalistId": "uuid",
  "activityType": "email_opened",
  "sourceSystem": "s45_deliverability",
  "sourceId": "outreach-email-123",
  "activityData": {
    "campaignId": "campaign-456",
    "subject": "New product launch announcement",
    "openedAt": "2025-11-25T09:15:00Z"
  },
  "occurredAt": "2025-11-25T09:15:00Z"
}
```

#### `POST /api/v1/journalist-graph/activities/batch`
Create multiple activities in batch.

### Scoring & Classification

#### `POST /api/v1/journalist-graph/profiles/:id/update-scores`
Recalculate all scores for a journalist.

**Response**:
```json
{
  "success": true,
  "data": {
    "engagementScore": 0.82,
    "responsivenessScore": 0.75,
    "relevanceScore": 0.5,
    "tier": "A",
    "components": {
      "responseRate": 0.60,
      "coverageRate": 0.15,
      "openRate": 0.75,
      "activityVolume": 0.45
    }
  }
}
```

#### `POST /api/v1/journalist-graph/update-scores/batch`
Update scores for multiple journalists.

#### `GET /api/v1/journalist-graph/profiles/:id/tier`
Get tier classification with breakdown.

**Response**:
```json
{
  "success": true,
  "data": {
    "tier": "A",
    "totalPoints": 85,
    "breakdown": {
      "outletTierPoints": 40,
      "engagementPoints": 27,
      "coveragePoints": 12,
      "responsivenessPoints": 6
    },
    "details": {
      "outletTier": "tier1",
      "engagementLevel": "high",
      "coverageFrequency": "frequent",
      "responsivenessLevel": "medium"
    }
  }
}
```

### Graph Operations

#### `POST /api/v1/journalist-graph/graph`
Build journalist relationship graph.

**Request Body**:
```json
{
  "journalistIds": ["uuid1", "uuid2"],
  "includeOutlets": true,
  "includeTopics": true,
  "includeCoverage": true,
  "includeOutreach": true,
  "minEngagementScore": 0.5,
  "maxDepth": 2
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "journalist-uuid1",
        "type": "journalist",
        "data": { /* journalist profile */ }
      },
      {
        "id": "outlet-techcrunch",
        "type": "outlet",
        "data": { "name": "TechCrunch", "tier": "tier1" }
      }
    ],
    "edges": [
      {
        "source": "journalist-uuid1",
        "target": "outlet-techcrunch",
        "type": "works_for",
        "weight": 1.0
      }
    ],
    "metadata": {
      "totalNodes": 25,
      "totalEdges": 42,
      "generatedAt": "2025-11-25T10:00:00Z"
    }
  }
}
```

## Frontend Integration

### Dashboard Page

**Route**: `/app/pr/journalists`

**Features**:
- Journalist list table
- Full-text search
- Engagement score visualization (progress bars)
- Beat and outlet columns
- Last activity tracking
- Click-through to detailed profiles (future)

### API Client

**File**: `apps/dashboard/src/lib/journalistGraphApi.ts`

**Key Functions**:
```typescript
import * as journalistGraphApi from '@/lib/journalistGraphApi';

// List journalists
const { data } = await journalistGraphApi.listProfiles({
  q: 'enterprise',
  minEngagementScore: 0.5,
  sortBy: 'engagement_score',
  sortOrder: 'desc',
  limit: 50
});

// Resolve identity
const { data } = await journalistGraphApi.resolveIdentity({
  fullName: 'Jane Reporter',
  email: 'jane@example.com'
});

// Merge profiles
await journalistGraphApi.mergeProfiles({
  sourceId: 'uuid1',
  targetId: 'uuid2'
});

// Create activity
await journalistGraphApi.createActivity({
  journalistId: 'uuid',
  activityType: 'email_opened',
  sourceSystem: 's45_deliverability'
});
```

## Configuration

### Feature Flag

```typescript
ENABLE_JOURNALIST_GRAPH: true // Enable journalist identity graph features
```

### Database Setup

Run migration 51:
```bash
cd apps/api
supabase db push
```

### Environment Variables

No additional environment variables required. Uses existing Supabase connection.

## Integration with Previous Sprints

### S38: PR Generator
- `press_release_sent` activities logged when releases are sent
- Journalist extraction from distribution lists

### S39: PR Pitch Engine
- `pitch_sent` activities logged for each pitch
- Journalist engagement tracking through pitch responses

### S40: Media Monitoring
- `mention_detected` activities when journalists mention clients
- `coverage_published` activities for earned coverage
- Journalist attribution for articles

### S41: Media Crawling
- Automatic journalist discovery from bylines
- Outlet affiliation updates
- Beat inference from article topics

### S44: PR Outreach
- `outreach_email` activities for each sent email
- Email metadata preservation (subject, campaign)

### S45: Deliverability & Engagement
- `email_opened`, `email_clicked`, `email_replied` activities
- Engagement metrics feeding scoring models
- Response tracking for responsiveness scores

## Usage Examples

### Example 1: Create Journalist and Track Activity

```typescript
// Create journalist profile
const { data: profile } = await journalistGraphApi.createProfile({
  fullName: 'Jane Reporter',
  primaryEmail: 'jane@techcrunch.com',
  primaryOutlet: 'TechCrunch',
  beat: 'Enterprise SaaS'
});

// Log outreach activity
await journalistGraphApi.createActivity({
  journalistId: profile.id,
  activityType: 'outreach_email',
  sourceSystem: 's44_outreach',
  activityData: {
    subject: 'New AI product launch',
    campaignId: 'campaign-123'
  }
});

// Later: Log engagement
await journalistGraphApi.createActivity({
  journalistId: profile.id,
  activityType: 'email_opened',
  sourceSystem: 's45_deliverability'
});

// Update scores
await journalistGraphApi.updateScores(profile.id);
```

### Example 2: Identity Resolution and Deduplication

```typescript
// Find potential matches for incoming journalist data
const { data } = await journalistGraphApi.resolveIdentity({
  fullName: 'Jane A Reporter',
  email: 'jane.reporter@techcrunch.com',
  outlet: 'TechCrunch'
});

if (data.matches.length > 0) {
  const match = data.matches[0];
  if (match.matchScore > 0.8) {
    // High confidence match - use existing profile
    console.log('Found existing journalist:', match.profile.id);
  } else {
    // Medium confidence - suggest merge to user
    console.log('Potential duplicate detected:', match.matchScore);
  }
}

// Find all duplicates in database
const { data: duplicates } = await journalistGraphApi.findDuplicates();

for (const dupSet of duplicates.duplicateSets) {
  // Review and merge as appropriate
  await journalistGraphApi.mergeProfiles({
    sourceId: dupSet.profiles[1].id,
    targetId: dupSet.suggestedCanonical,
    fieldResolution: { /* specify field preferences */ }
  });
}
```

### Example 3: Tier-Based Prioritization

```typescript
// Get high-value journalists for VIP outreach campaign
const { data } = await journalistGraphApi.listProfiles({
  minEngagementScore: 0.7,
  sortBy: 'engagement_score',
  sortOrder: 'desc',
  limit: 20
});

// Get tier breakdown
for (const journalist of data.profiles) {
  const { data: tier } = await journalistGraphApi.getTier(journalist.id);

  if (tier.tier === 'A') {
    // VIP treatment: personalized outreach, manual review
    console.log(`A-tier journalist: ${journalist.fullName}`);
  } else if (tier.tier === 'B') {
    // Standard outreach with attention
    console.log(`B-tier journalist: ${journalist.fullName}`);
  }
}
```

### Example 4: Build Journalist Network Graph

```typescript
// Build graph for visualization
const { data } = await journalistGraphApi.buildGraph({
  includeOutlets: true,
  includeTopics: true,
  includeCoverage: true,
  minEngagementScore: 0.5,
  maxDepth: 2
});

// Use with D3.js or similar visualization library
const visualization = d3ForceGraph()
  .nodes(data.nodes)
  .links(data.edges)
  .nodeLabel(d => d.type === 'journalist' ? d.data.fullName : d.data.name)
  .linkWidth(d => d.weight * 3);
```

## Testing

### Backend Tests

**File**: `apps/api/tests/journalistGraphService.test.ts`

**Coverage**:
- Profile CRUD operations
- Identity resolution with fuzzy matching
- Activity logging
- Engagement score calculation
- Graph building

**Run**:
```bash
cd apps/api
pnpm test tests/journalistGraphService.test.ts
```

### E2E Tests

**File**: `apps/dashboard/tests/journalists/journalist-graph.spec.ts`

**Coverage**:
- Dashboard page rendering
- Journalist list display
- Search functionality
- Engagement score visualization
- Error and empty states

**Run**:
```bash
cd apps/dashboard
pnpm test:e2e tests/journalists/journalist-graph.spec.ts
```

## Performance Considerations

- **Indexes**: Optimized indexes on org_id, email, engagement_score, outlet, beat
- **RLS Policies**: Org-scoped access control with efficient query patterns
- **Pagination**: Default 50, max 100 items per page
- **Batch Operations**: Bulk activity creation and score updates
- **Score Caching**: `last_scored_at` timestamp prevents redundant calculations
- **Graph Depth Limits**: Configurable max depth prevents excessive computation

## Security

- Row Level Security (RLS) policies enforce org isolation
- All queries scoped to user's organization
- Soft deletes preserve audit trail
- Activity logs are immutable (insert-only)
- Merge operations logged with attribution

## Future Enhancements

### V2 Planned Features
1. **Advanced Relevance Scoring**: Topic modeling, beat alignment, historical coverage analysis
2. **Time-to-Response Analysis**: Response time patterns, optimal outreach timing
3. **Relationship Strength Scoring**: Multi-touch attribution, relationship velocity
4. **Predictive Analytics**: Coverage likelihood prediction, outreach success modeling
5. **Outlet Authority Scoring**: Dynamic outlet tier calculation based on traffic, domain authority
6. **Journalist Influence Scoring**: Social media reach, article engagement metrics
7. **Network Effects**: Journalist collaboration patterns, co-author networks
8. **Smart Recommendations**: Best journalists for specific topics/pitches
9. **Automated Enrichment**: Third-party data integration (Clearbit, Hunter.io)
10. **Relationship Health Monitoring**: Engagement decline alerts, re-engagement suggestions

### V3+ Aspirations
- Real-time journalist activity feeds
- Journalist preference learning (topics, angles, timing)
- A/B testing for outreach strategies
- Competitive intelligence (which journalists cover competitors)
- Beat evolution tracking (journalist career path analysis)
- Multi-language support for international PR
- Chrome extension for LinkedIn journalist enrichment

## Metrics & KPIs

**Operational Metrics**:
- Total journalist profiles in database
- Active journalists (activity in last 90 days)
- Average engagement score across database
- Tier distribution (A/B/C/D percentages)
- Duplicate detection rate
- Merge operations per week

**Quality Metrics**:
- Identity match accuracy (precision/recall)
- Score prediction accuracy (vs. actual outcomes)
- Data completeness percentage (fields populated)
- Activity log volume by source system
- Average activities per journalist

**Business Impact**:
- Coverage rate by journalist tier
- Response rate by engagement score bucket
- ROI by tier (coverage value / outreach effort)
- Journalist retention rate (continued engagement over time)

## Support & Troubleshooting

### Common Issues

**Issue**: Journalist not showing up in search
**Solution**: Check RLS policies, verify org_id, ensure profile not soft-deleted

**Issue**: Engagement score not updating
**Solution**: Run `POST /profiles/:id/update-scores` manually, check activity log has recent entries

**Issue**: Duplicate detection missing obvious duplicates
**Solution**: Lower `matchThreshold` parameter, check for unusual email formats

**Issue**: Slow profile list queries
**Solution**: Add indexes on frequently filtered fields, reduce page size, use pagination

### Debug Mode

Enable debug logging:
```typescript
// In JournalistGraphService
const DEBUG = process.env.DEBUG_JOURNALIST_GRAPH === 'true';
```

## Related Documentation

- [Sprint S38: PR Generator](./pr_generator_v1.md)
- [Sprint S39: PR Pitch Engine](./pr_pitch_engine_v1.md)
- [Sprint S40: Media Monitoring](./media_monitoring_v1.md)
- [Sprint S44: PR Outreach](./pr_outreach_v1.md)
- [Sprint S45: Deliverability & Engagement](./pr_outreach_deliverability_v1.md)

## Changelog

### V1.0.0 (Sprint S46)
- Initial release with unified journalist profiles
- Identity resolution and deduplication
- Multi-dimensional scoring (engagement, responsiveness, relevance)
- Tier classification system (A/B/C/D)
- Cross-system activity tracking
- Graph builder with nodes and edges
- Dashboard UI with journalist list
- Complete API with 18 endpoints
- Backend and E2E test coverage
