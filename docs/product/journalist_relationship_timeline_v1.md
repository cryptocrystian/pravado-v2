# Journalist Relationship Timeline & Narrative Builder V1

**Sprint:** S49
**Status:** Production Ready
**Feature Flag:** `ENABLE_JOURNALIST_TIMELINE`
**Migration:** 54

---

## Executive Summary

The Journalist Relationship Timeline is the foundational intelligence layer of the Pravado Journalist Relationship CRM. It aggregates, normalizes, and enriches all journalist interaction data from 11 upstream systems (S38-S48) into a unified, chronological relationship timeline.

This feature enables PR professionals to:
- View comprehensive interaction history with any journalist in one place
- Understand relationship health through AI-powered scoring
- Generate executive-ready relationship narratives
- Make data-driven decisions about outreach timing and strategy
- Track relationship momentum over time

**Key Metrics:**
- **40+ event types** from 11 source systems
- **12 performance indexes** for sub-50ms queries
- **3 PostgreSQL helper functions** for server-side aggregation
- **14 REST API endpoints** for complete timeline operations
- **7 React components** for rich timeline UI
- **AI-powered narrative generation** with rule-based fallback

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Use Cases](#use-cases)
3. [Technical Architecture](#technical-architecture)
4. [Event Types & Sources](#event-types--sources)
5. [Relationship Health Scoring](#relationship-health-scoring)
6. [Narrative Generation](#narrative-generation)
7. [API Reference](#api-reference)
8. [UI Components](#ui-components)
9. [Database Schema](#database-schema)
10. [Integration Guide](#integration-guide)
11. [Best Practices](#best-practices)

---

## Feature Overview

### What is the Journalist Relationship Timeline?

The timeline is a **unified, chronological feed** of all interactions between your organization and a specific journalist. It automatically aggregates events from:

- **S38**: RSS Media Crawler (article discoveries, coverage tracking)
- **S39**: PR Pitch Engine (pitches sent, replies received)
- **S40**: Media Monitoring Dashboard (coverage published, sentiment analysis)
- **S41**: Press Release Generator (releases sent, journalist views)
- **S42**: Journalist Discovery Engine (profile updates, discovery events)
- **S43**: PR Outreach System (outreach sent, responses, bounces)
- **S44**: Media Alert System (breaking news alerts, trend signals)
- **S45**: Content Brief Generator (briefs created for journalist)
- **S46**: Content Quality Scoring (quality assessments of journalist content)
- **S47**: Content Rewrite Engine (content optimization for journalist)
- **S48**: Media Contact Enrichment (profile enrichments, contact updates)

Additionally, users can **manually add notes** for offline interactions like phone calls, conferences, or informal conversations.

### Core Capabilities

1. **Event Aggregation**: Automatically captures and normalizes events from all upstream systems
2. **Timeline Visualization**: Chronological display with rich filtering, sorting, and search
3. **Event Clustering**: Groups related events (e.g., outreach sequences, coverage threads)
4. **Health Scoring**: Calculates relationship health score (0-100) based on 6 factors
5. **Narrative Generation**: AI-powered relationship summaries with insights and recommendations
6. **Manual Annotation**: Add custom notes for offline interactions
7. **Export & Reporting**: Generate relationship reports for stakeholders

---

## Use Cases

### 1. Pre-Pitch Relationship Assessment

**Scenario**: Before sending a pitch, a PR professional wants to understand the current relationship state with a journalist.

**Workflow**:
1. Navigate to journalist's timeline page
2. Review health score (e.g., 72/100 - "Healthy")
3. Check "Last 30 Days" stats (e.g., 3 interactions, 2 positive)
4. Review recent events for context
5. Generate 30-day narrative for executive summary
6. Make informed decision about pitch timing and approach

**Outcome**: Data-driven decision reduces risk of poorly-timed outreach.

---

### 2. Post-Coverage Follow-Up Strategy

**Scenario**: A journalist just published positive coverage. The team wants to capitalize on this momentum.

**Workflow**:
1. Automated `coverage_published` event created via S40
2. Timeline shows positive sentiment, high relevance score
3. Health score increases from 58 → 67
4. System auto-clusters this with previous outreach sequence
5. Team reviews narrative: "Recent positive coverage indicates strong relationship momentum"
6. Team schedules immediate follow-up with related story angle

**Outcome**: Timely follow-up strengthens relationship and increases future coverage probability.

---

### 3. Executive Relationship Briefing

**Scenario**: CEO is meeting a key journalist at a conference tomorrow. Communications team needs to brief them.

**Workflow**:
1. Generate "All Time" narrative for journalist
2. Export executive summary section:
   - Total interactions: 47 over 18 months
   - Coverage published: 8 articles (6 positive, 2 neutral)
   - Last interaction: 12 days ago (pitch reply)
   - Relationship health: 81/100 (Very Healthy)
   - Key topics: product launches, industry trends, executive interviews
3. Print narrative with recommendations
4. CEO reviews 2-page brief before meeting

**Outcome**: CEO enters meeting fully informed, strengthens relationship.

---

### 4. Quarterly Journalist Relationship Audit

**Scenario**: Communications director wants to assess team performance with top-tier journalists.

**Workflow**:
1. Review timelines for 20 priority journalists
2. Filter events to "Last 90 Days"
3. Generate health score trend reports
4. Identify declining relationships (health score dropped >15 points)
5. Auto-cluster events to identify successful outreach patterns
6. Create action plan for at-risk relationships

**Outcome**: Proactive relationship management prevents relationship decay.

---

### 5. Manual Note Tracking for Offline Interactions

**Scenario**: PR manager has a 30-minute phone call with a journalist about an upcoming product launch.

**Workflow**:
1. Open journalist timeline page
2. Click "Add Note" button
3. Fill in details:
   - Title: "Phone call - Q1 product launch discussion"
   - Description: "Very interested in exclusive preview. Mentioned planning feature story for launch week. Wants embargoed materials 2 weeks early."
   - Sentiment: Positive
   - Relationship Impact: +0.5
4. Submit note
5. Event appears in timeline immediately
6. Health score updates in real-time

**Outcome**: All interactions captured, team has complete context for future outreach.

---

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Upstream Systems (S38-S48)              │
│  RSS Crawler │ Pitch Engine │ Media Monitoring │ ...        │
└────────────────────────┬────────────────────────────────────┘
                         │ System Event Push
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Journalist Timeline Service Layer              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Event       │  │  Clustering  │  │  Narrative   │     │
│  │  Aggregator  │  │  Engine      │  │  Generator   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            PostgreSQL (journalist_relationship_events)      │
│  + 12 Performance Indexes                                   │
│  + 3 Helper Functions (stats, health score, clustering)     │
│  + RLS Policies (org-level isolation)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   REST API Layer (14 endpoints)             │
│  /events │ /stats │ /health-score │ /narrative │ ...        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (7 components)            │
│  Timeline Page │ Event List │ Filters │ Drawer │ ...        │
└─────────────────────────────────────────────────────────────┘
```

### Component Stack

| Layer | Technology | Files |
|-------|-----------|-------|
| **Database** | PostgreSQL + Supabase | `migrations/54_create_journalist_timeline_schema.sql` |
| **Types** | TypeScript | `packages/types/src/journalistTimeline.ts` |
| **Validation** | Zod | `packages/validators/src/journalistTimeline.ts` |
| **Service** | Node.js | `apps/api/src/services/journalistTimelineService.ts` |
| **Narrative AI** | LLM + Rules | `apps/api/src/services/narrativeGeneratorService.ts` |
| **API** | Express REST | `apps/api/src/routes/journalistTimeline/index.ts` |
| **Frontend** | React + Next.js | `apps/dashboard/src/app/app/journalists/[id]/timeline/page.tsx` |
| **Components** | React | `apps/dashboard/src/components/journalist-timeline/*` |
| **API Client** | Fetch | `apps/dashboard/src/lib/journalistTimelineApi.ts` |

---

## Event Types & Sources

### Event Type Taxonomy

The timeline supports **40+ event types** organized into 11 categories:

#### 1. Pitching & Outreach (S39, S43)
- `pitch_sent` - Pitch email sent to journalist
- `pitch_opened` - Journalist opened pitch email
- `pitch_clicked` - Journalist clicked link in pitch
- `pitch_replied` - Journalist replied to pitch
- `pitch_declined` - Journalist declined pitch
- `outreach_sent` - General outreach email sent
- `outreach_opened` - Outreach email opened
- `outreach_replied` - Outreach email replied
- `outreach_bounced` - Email bounced

#### 2. Coverage & Publishing (S38, S40)
- `coverage_published` - Journalist published article mentioning organization
- `coverage_updated` - Published article was updated
- `rss_article_discovered` - New article discovered via RSS
- `social_mention` - Social media mention by journalist

#### 3. Press Releases (S41)
- `press_release_sent` - Press release distributed to journalist
- `press_release_viewed` - Journalist viewed press release
- `press_release_downloaded` - Journalist downloaded release assets

#### 4. Profile & Discovery (S42, S48)
- `journalist_discovered` - New journalist profile created
- `profile_enriched` - Contact data enriched
- `contact_verified` - Email/contact verified
- `profile_updated` - Profile information updated

#### 5. Media Monitoring (S40, S44)
- `media_alert_triggered` - Breaking news alert matched journalist
- `trend_signal_detected` - Trending topic matched journalist's beat
- `competitor_coverage_detected` - Journalist covered competitor

#### 6. Content Intelligence (S45, S46, S47)
- `content_brief_generated` - Brief created for journalist's beat
- `content_quality_scored` - Quality score calculated for journalist content
- `content_rewrite_suggested` - Rewrite recommendation for journalist

#### 7. Engagement & Interaction
- `email_engagement` - General email interaction
- `website_visit` - Journalist visited press room/newsroom
- `asset_download` - Journalist downloaded media kit/assets

#### 8. Events & Meetings
- `meeting_scheduled` - Meeting scheduled with journalist
- `meeting_completed` - Meeting took place
- `conference_interaction` - Met at conference/event
- `phone_call` - Phone conversation

#### 9. Relationship Milestones
- `relationship_established` - First meaningful interaction
- `relationship_milestone` - Significant relationship event
- `coverage_milestone` - Nth article published

#### 10. Negative Signals
- `negative_coverage` - Negative article published
- `complaint_received` - Journalist complaint
- `unsubscribe` - Journalist unsubscribed from communications
- `spam_report` - Email marked as spam

#### 11. Manual Notes
- `manual_note` - User-created timeline note

### Source System Mapping

| Source System | Event Types | Integration Method |
|--------------|-------------|-------------------|
| **S38: RSS Crawler** | `rss_article_discovered`, `coverage_published` | Auto-push via `pushSystemEvent()` |
| **S39: Pitch Engine** | `pitch_sent`, `pitch_opened`, `pitch_clicked`, `pitch_replied` | Auto-push via `pushSystemEvent()` |
| **S40: Media Monitoring** | `coverage_published`, `coverage_updated`, `social_mention` | Auto-push via `pushSystemEvent()` |
| **S41: Press Release** | `press_release_sent`, `press_release_viewed` | Auto-push via `pushSystemEvent()` |
| **S42: Discovery Engine** | `journalist_discovered`, `profile_updated` | Auto-push via `pushSystemEvent()` |
| **S43: Outreach System** | `outreach_sent`, `outreach_opened`, `outreach_replied` | Auto-push via `pushSystemEvent()` |
| **S44: Media Alerts** | `media_alert_triggered`, `trend_signal_detected` | Auto-push via `pushSystemEvent()` |
| **S45: Brief Generator** | `content_brief_generated` | Auto-push via `pushSystemEvent()` |
| **S46: Quality Scoring** | `content_quality_scored` | Auto-push via `pushSystemEvent()` |
| **S47: Rewrite Engine** | `content_rewrite_suggested` | Auto-push via `pushSystemEvent()` |
| **S48: Enrichment** | `profile_enriched`, `contact_verified` | Auto-push via `pushSystemEvent()` |
| **Manual Entry** | `manual_note`, `phone_call`, `meeting_completed` | User-created via UI |

---

## Relationship Health Scoring

### Scoring Algorithm

The relationship health score is a **0-100 metric** calculated using 6 weighted factors:

```typescript
Health Score =
  Event Count Score (20%)      // More interactions = healthier
  + Recency Score (25%)        // Recent activity = healthier
  + Activity Score (15%)       // Consistent activity = healthier
  + Sentiment Score (15%)      // Positive sentiment = healthier
  + Engagement Score (15%)     // High engagement = healthier
  + Coverage Score (10%)       // Published coverage = healthier
```

### Detailed Scoring Logic

#### 1. Event Count Score (Max 20 points)
```sql
-- Base score from total event count
event_count_score = MIN(total_events * 0.5, 20)

-- Examples:
-- 10 events  → 5 points
-- 40 events  → 20 points (maxed out)
-- 100 events → 20 points (capped)
```

#### 2. Recency Score (Max 25 points)
```sql
-- Days since last interaction
IF last_interaction_days <= 7 THEN
  recency_score = 25  -- Within 1 week
ELSIF last_interaction_days <= 30 THEN
  recency_score = 15  -- Within 1 month
ELSIF last_interaction_days <= 90 THEN
  recency_score = 8   -- Within 3 months
ELSE
  recency_score = 0   -- Stale relationship
END IF
```

#### 3. Activity Score (Max 15 points)
```sql
-- Events in last 90 days
activity_score = MIN(recent_90_days * 1.5, 15)

-- Examples:
-- 0 events   → 0 points
-- 5 events   → 7.5 points
-- 10+ events → 15 points (maxed out)
```

#### 4. Sentiment Score (Max 15 points)
```sql
-- Weighted by sentiment distribution
positive_ratio = positive_events / total_events
negative_ratio = negative_events / total_events

sentiment_score = (positive_ratio * 15) - (negative_ratio * 10)

-- Clamped to [0, 15]
-- Examples:
-- 80% positive, 0% negative  → 12 points
-- 100% positive, 0% negative → 15 points
-- 50% positive, 20% negative → 5.5 points
```

#### 5. Engagement Score (Max 15 points)
```sql
-- High-value engagement events
engagement_events = COUNT(event_type IN [
  'pitch_replied',
  'coverage_published',
  'outreach_replied',
  'meeting_completed',
  'phone_call'
])

engagement_score = MIN(engagement_events * 3, 15)

-- Examples:
-- 0 engagements → 0 points
-- 3 engagements → 9 points
-- 5+ engagements → 15 points (maxed out)
```

#### 6. Coverage Score (Max 10 points)
```sql
-- Published coverage counts extra
coverage_count = COUNT(event_type IN [
  'coverage_published',
  'rss_article_discovered'
])

coverage_score = MIN(coverage_count * 2, 10)

-- Examples:
-- 0 coverage → 0 points
-- 3 coverage → 6 points
-- 5+ coverage → 10 points (maxed out)
```

### Health Score Ranges

| Score | Label | Color | Interpretation |
|-------|-------|-------|---------------|
| 80-100 | Very Healthy | Green | Strong, active relationship with recent positive interactions |
| 60-79 | Healthy | Light Green | Good relationship with regular engagement |
| 40-59 | Moderate | Yellow | Relationship exists but needs attention |
| 20-39 | Weak | Orange | Limited interaction, relationship at risk |
| 0-19 | Poor | Red | Inactive or damaged relationship, immediate action needed |

### Health Score Breakdown

The API returns detailed breakdown for transparency:

```typescript
interface RelationshipHealthScore {
  score: number;              // 0-100 total score
  trend: 'improving' | 'stable' | 'declining';
  breakdown: {
    eventCount: number;       // 0-20
    recency: number;          // 0-25
    activity: number;         // 0-15
    sentiment: number;        // 0-15
    engagement: number;       // 0-15
    coverage: number;         // 0-10
  };
  recommendations: string[];
}
```

### Recommendations Engine

Based on score components, the system generates actionable recommendations:

```typescript
// Low recency (0-8 points)
if (breakdown.recency <= 8) {
  recommendations.push("Relationship is stale. Schedule outreach within next 7 days.");
}

// Low engagement (0-5 points)
if (breakdown.engagement <= 5) {
  recommendations.push("Low engagement. Try personalized pitch or exclusive content.");
}

// Negative sentiment trend
if (breakdown.sentiment <= 5) {
  recommendations.push("Recent negative sentiment detected. Review relationship issues.");
}

// No coverage
if (breakdown.coverage === 0) {
  recommendations.push("No coverage yet. Consider newsjacking or exclusive offer.");
}

// High score with recent activity
if (score >= 70 && breakdown.recency === 25) {
  recommendations.push("Strong relationship. Good time for ambitious pitch or exclusive.");
}
```

---

## Narrative Generation

### Overview

The Narrative Generator creates **executive-ready relationship summaries** using:
1. **LLM-powered generation** (primary) - Claude/GPT with custom prompts
2. **Rule-based generation** (fallback) - Template-based summaries

### Narrative Structure

Every generated narrative includes 6 sections:

```typescript
interface JournalistNarrative {
  executiveSummary: string;           // 2-3 sentence overview
  relationshipHistory: string;        // Chronological relationship story
  keyInteractions: Array<{            // 3-5 most important events
    date: Date;
    type: string;
    description: string;
    significance: string;
  }>;
  coverageAnalysis: string;           // Coverage patterns and themes
  sentimentAnalysis: string;          // Sentiment trends over time
  recommendations: string[];          // 3-5 actionable next steps
  generatedAt: Date;
  timeframe: 'last_30_days' | 'last_90_days' | 'all_time';
}
```

### LLM Prompts

#### System Prompt
```
You are an expert PR and media relations analyst. Your task is to analyze
journalist relationship data and generate insightful, actionable narratives
that help PR professionals understand their relationships and optimize their
outreach strategies.

Focus on:
- Relationship health and momentum
- Engagement patterns and timing
- Coverage themes and sentiment trends
- Concrete, actionable recommendations

Write in a professional but conversational tone suitable for executive briefings.
```

#### Executive Summary Prompt
```
Based on the following journalist interaction data, generate a 2-3 sentence
executive summary of the relationship:

Journalist: {journalistName}
Total Interactions: {totalEvents}
Last Interaction: {lastInteractionDays} days ago
Health Score: {healthScore}/100
Recent Activity: {recent30Days} events in last 30 days
Coverage: {coverageCount} articles published
Sentiment: {positivePercent}% positive, {negativePercent}% negative

Provide a concise, actionable summary that captures relationship state and momentum.
```

#### Relationship History Prompt
```
Write a chronological narrative of the relationship based on these key events:

{eventsList}

Tell a story that:
1. Explains how the relationship developed over time
2. Highlights inflection points and milestones
3. Identifies patterns in interaction frequency and type
4. Notes any gaps or changes in relationship dynamics

Maximum 3 paragraphs.
```

#### Recommendations Prompt
```
Based on this relationship analysis, provide 3-5 specific, actionable
recommendations for the PR team:

Health Score: {healthScore}/100
Breakdown: Recency={recency}, Activity={activity}, Sentiment={sentiment}
Last Interaction: {lastInteractionDays} days ago
Coverage: {coverageCount} articles
Recent Events: {recentEventTypes}

Recommendations should be:
- Specific and actionable
- Prioritized by impact
- Based on data patterns
- Time-sensitive where appropriate

Format as bullet points.
```

### Rule-Based Fallback

If LLM fails or is disabled, rule-based templates generate narratives:

```typescript
// Executive Summary Template
const executiveSummary = `
  ${journalistName} has ${totalEvents} total interactions over ${daysSinceFirst} days,
  with a current health score of ${healthScore}/100 (${healthLabel}).
  ${
    recent30Days > 0
      ? `Recent activity is ${activityLevel} with ${recent30Days} events in the last 30 days.`
      : `No recent activity detected in the last 30 days.`
  }
  ${
    coverageCount > 0
      ? `${journalistName} has published ${coverageCount} articles, with ${positivePercent}% positive sentiment.`
      : `No coverage has been published yet.`
  }
`;

// Recommendations Template
const recommendations = [];

if (healthScore < 40) {
  recommendations.push("Priority: Re-engage immediately with personalized outreach");
}

if (lastInteractionDays > 60) {
  recommendations.push("Relationship is stale - schedule touch-base call or email");
}

if (coverageCount === 0 && totalEvents > 5) {
  recommendations.push("Multiple interactions but no coverage - review pitch quality");
}

// ... 10+ more rule-based recommendations
```

### Narrative Timeframes

Users can generate narratives for three timeframes:

1. **Last 30 Days**: Recent relationship snapshot
   - Best for: Pre-pitch prep, weekly reviews
   - Events: Only last 30 days
   - Focus: Current momentum and immediate opportunities

2. **Last 90 Days**: Quarterly relationship view
   - Best for: QBR prep, relationship audits
   - Events: Last 90 days
   - Focus: Trends, patterns, relationship trajectory

3. **All Time**: Complete relationship history
   - Best for: Executive briefings, major pitches
   - Events: All events since first interaction
   - Focus: Comprehensive relationship story and evolution

---

## API Reference

### Base URL
```
/api/v1/journalist-timeline
```

### Authentication
All endpoints require authentication. Include session cookie or JWT token.

### Endpoints

#### 1. Create Event
```http
POST /events
Content-Type: application/json

{
  "journalistId": "uuid",
  "eventType": "pitch_sent",
  "title": "Q4 Earnings Pitch",
  "description": "Personalized pitch based on recent coverage",
  "sourceSystem": "pitch_engine",
  "sourceId": "pitch-123",
  "payload": { "pitchId": "pitch-123" },
  "relevanceScore": 0.8,
  "relationshipImpact": 0.2,
  "sentiment": "neutral"
}

Response: 201 Created
{
  "id": "event-uuid",
  "orgId": "org-uuid",
  "journalistId": "journalist-uuid",
  "eventType": "pitch_sent",
  // ... full event object
}
```

#### 2. List Events
```http
GET /events?journalistId={uuid}&limit=20&offset=0&sortBy=event_timestamp&sortOrder=desc

Query Parameters:
- journalistId: string (required)
- eventTypes: string[] (optional)
- sourceSystems: string[] (optional)
- sentiments: string[] (optional)
- startDate: ISO8601 (optional)
- endDate: ISO8601 (optional)
- last30Days: boolean (optional)
- last90Days: boolean (optional)
- minRelevanceScore: number 0-1 (optional)
- searchQuery: string (optional)
- sortBy: string (default: event_timestamp)
- sortOrder: 'asc' | 'desc' (default: desc)
- limit: number (default: 20, max: 100)
- offset: number (default: 0)

Response: 200 OK
{
  "events": [ /* array of events */ ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 156,
    "hasMore": true
  },
  "stats": { /* optional stats object */ }
}
```

#### 3. Get Event
```http
GET /events/{eventId}

Response: 200 OK
{
  "id": "event-uuid",
  // ... full event object
}
```

#### 4. Update Event
```http
PATCH /events/{eventId}
Content-Type: application/json

{
  "title": "Updated title",
  "description": "Updated description",
  "sentiment": "positive",
  "relationshipImpact": 0.5
}

Response: 200 OK
{
  "id": "event-uuid",
  // ... updated event object
}
```

#### 5. Delete Event
```http
DELETE /events/{eventId}

Response: 200 OK
{
  "success": true
}
```

#### 6. Get Statistics
```http
GET /stats/{journalistId}

Response: 200 OK
{
  "totalEvents": 47,
  "lastInteraction": "2025-11-20T10:30:00Z",
  "firstInteraction": "2024-03-15T14:22:00Z",
  "eventTypeCounts": {
    "pitch_sent": 12,
    "pitch_replied": 5,
    "coverage_published": 8,
    // ...
  },
  "sentimentDistribution": {
    "positive": 28,
    "neutral": 15,
    "negative": 4,
    "unknown": 0
  },
  "avgRelevanceScore": 0.73,
  "avgRelationshipImpact": 0.21,
  "totalClusters": 6,
  "recent30Days": 8,
  "recent90Days": 23
}
```

#### 7. Calculate Health Score
```http
GET /health-score/{journalistId}

Response: 200 OK
{
  "score": 72.5,
  "trend": "improving",
  "breakdown": {
    "eventCount": 15.5,
    "recency": 25,
    "activity": 12,
    "sentiment": 11.2,
    "engagement": 9,
    "coverage": 8
  },
  "recommendations": [
    "Strong recent activity - good time for ambitious pitch",
    "High coverage rate - journalist is engaged with your stories",
    "Consider exclusive content to maintain momentum"
  ]
}
```

#### 8. Get Aggregation
```http
GET /aggregation/{journalistId}?period=day&startDate=2025-01-01&endDate=2025-01-31

Query Parameters:
- period: 'day' | 'week' | 'month'
- startDate: ISO8601
- endDate: ISO8601

Response: 200 OK
{
  "period": "day",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-31T23:59:59Z",
  "dataPoints": [
    {
      "date": "2025-01-01",
      "eventCount": 3,
      "sentimentBreakdown": { "positive": 2, "neutral": 1 },
      "avgRelevanceScore": 0.78,
      "avgRelationshipImpact": 0.25
    },
    // ... more data points
  ]
}
```

#### 9. Auto-Cluster Events
```http
POST /auto-cluster/{journalistId}

Response: 200 OK
{
  "clustersCreated": 3
}
```

#### 10. Get Cluster
```http
GET /clusters/{clusterId}

Response: 200 OK
{
  "id": "cluster-uuid",
  "type": "outreach_sequence",
  "events": [ /* array of events in cluster */ ],
  "summary": "3-email outreach sequence leading to positive reply"
}
```

#### 11. Batch Create Events
```http
POST /batch
Content-Type: application/json

{
  "events": [
    { /* event 1 */ },
    { /* event 2 */ }
  ],
  "skipDuplicates": true,
  "autoCluster": true
}

Response: 200 OK
{
  "created": 2,
  "skipped": 0,
  "errors": [],
  "clusterResult": {
    "clustersCreated": 1
  }
}
```

#### 12. Create Manual Note
```http
POST /notes
Content-Type: application/json

{
  "journalistId": "uuid",
  "title": "Phone call - Q1 product launch",
  "description": "Very interested in exclusive preview...",
  "sentiment": "positive",
  "relationshipImpact": 0.5
}

Response: 201 Created
{
  "id": "event-uuid",
  "eventType": "manual_note",
  // ... full event object
}
```

#### 13. Generate Narrative
```http
POST /narrative
Content-Type: application/json

{
  "journalistId": "uuid",
  "timeframe": "last_30_days",
  "includeRecommendations": true
}

Response: 200 OK
{
  "executiveSummary": "Jane Smith has 12 interactions...",
  "relationshipHistory": "The relationship began in March 2024...",
  "keyInteractions": [ /* array */ ],
  "coverageAnalysis": "Jane has published 3 articles...",
  "sentimentAnalysis": "Overall sentiment is positive (75%)...",
  "recommendations": [ /* array */ ],
  "generatedAt": "2025-11-26T10:00:00Z",
  "timeframe": "last_30_days"
}
```

#### 14. Push System Event
```http
POST /push-event
Content-Type: application/json

{
  "sourceSystem": "pitch_engine",
  "sourceId": "pitch-789",
  "journalistId": "uuid",
  "eventType": "pitch_sent",
  "title": "Pitch sent from S39",
  "payload": { "pitchId": "pitch-789" },
  "relevanceScore": 0.75
}

Response: 201 Created
{
  "id": "event-uuid",
  // ... full event object
}
```

---

## UI Components

### 1. TimelineEvent Component
**File**: `components/journalist-timeline/TimelineEvent.tsx`

**Purpose**: Displays individual timeline event with icon, title, metadata, sentiment badge.

**Props**:
```typescript
interface TimelineEventProps {
  event: JournalistTimelineEvent;
  onSelect: (event: JournalistTimelineEvent) => void;
  isSelected: boolean;
}
```

**Features**:
- 40+ event type configurations with unique icons and colors
- Sentiment badge (positive/negative/neutral)
- Relevance score progress bar
- Relationship impact indicator
- Click to open event drawer

---

### 2. TimelineCluster Component
**File**: `components/journalist-timeline/TimelineCluster.tsx`

**Purpose**: Displays clustered events (e.g., outreach sequence, coverage thread).

**Props**:
```typescript
interface TimelineClusterProps {
  cluster: TimelineCluster;
  onExpand: () => void;
}
```

**Features**:
- Collapsible cluster view
- Cluster summary
- Event count badge
- Timeline visualization of cluster events

---

### 3. TimelineFilters Component
**File**: `components/journalist-timeline/TimelineFilters.tsx`

**Purpose**: Filter panel for timeline events.

**Props**:
```typescript
interface TimelineFiltersProps {
  onFilterChange: (filters: TimelineQuery) => void;
  onReset: () => void;
}
```

**Features**:
- Event type multi-select
- Sentiment filter (positive/neutral/negative)
- Time range selector (last 30/90 days, custom range)
- Relevance score slider
- Full-text search
- Reset filters button

---

### 4. EventDrawer Component
**File**: `components/journalist-timeline/EventDrawer.tsx`

**Purpose**: Right-side overlay displaying full event details.

**Props**:
```typescript
interface EventDrawerProps {
  event: JournalistTimelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
}
```

**Features**:
- Full event metadata display
- Payload and metadata JSON viewers
- Source system information
- Cluster information (if clustered)
- Edit/delete actions
- Responsive design (mobile-friendly)

---

### 5. HealthScoreBadge Component
**File**: `components/journalist-timeline/HealthScoreBadge.tsx`

**Purpose**: Displays relationship health score with visual indicators.

**Props**:
```typescript
interface HealthScoreBadgeProps {
  healthScore: RelationshipHealthScore;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}
```

**Features**:
- Color-coded score badge (red/orange/yellow/green)
- Trend indicator (↑ improving, → stable, ↓ declining)
- Optional breakdown tooltip
- Size variants

---

### 6. NarrativePanel Component
**File**: `components/journalist-timeline/NarrativePanel.tsx`

**Purpose**: Displays AI-generated narrative with executive summary, history, and recommendations.

**Props**:
```typescript
interface NarrativePanelProps {
  narrative: JournalistNarrative;
  isLoading: boolean;
  onRegenerate: () => void;
}
```

**Features**:
- Executive summary section
- Collapsible relationship history
- Key interactions timeline
- Coverage and sentiment analysis
- Recommendations list
- Regenerate button
- Loading skeleton

---

### 7. AddNoteModal Component
**File**: `components/journalist-timeline/AddNoteModal.tsx`

**Purpose**: Modal for creating manual timeline notes.

**Props**:
```typescript
interface AddNoteModalProps {
  journalistId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (note: CreateManualNoteInput) => Promise<void>;
}
```

**Features**:
- Title and description inputs
- Sentiment selector (positive/neutral/negative)
- Relationship impact slider (-1 to +1)
- Form validation
- Submit/cancel actions

---

## Database Schema

### journalist_relationship_events Table

```sql
CREATE TABLE journalist_relationship_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  journalist_id UUID NOT NULL REFERENCES journalist_profiles(id) ON DELETE CASCADE,

  -- Event Classification
  event_type TEXT NOT NULL,  -- 40+ event types
  title TEXT NOT NULL,
  description TEXT,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Source Tracking
  source_system TEXT NOT NULL,  -- 11 source systems
  source_id TEXT,  -- External reference ID

  -- Event Data
  payload JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Analytics
  relevance_score FLOAT CHECK (relevance_score >= 0 AND relevance_score <= 1),
  relationship_impact FLOAT CHECK (relationship_impact >= -1 AND relationship_impact <= 1),
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'unknown')),

  -- Clustering
  cluster_id UUID,
  cluster_type TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Performance Indexes (12 total)

```sql
-- Primary query patterns
CREATE INDEX idx_timeline_journalist_timestamp ON journalist_relationship_events(journalist_id, event_timestamp DESC);
CREATE INDEX idx_timeline_org_journalist ON journalist_relationship_events(org_id, journalist_id);

-- Filtering indexes
CREATE INDEX idx_timeline_event_type ON journalist_relationship_events(event_type);
CREATE INDEX idx_timeline_source_system ON journalist_relationship_events(source_system);
CREATE INDEX idx_timeline_sentiment ON journalist_relationship_events(sentiment);
CREATE INDEX idx_timeline_cluster ON journalist_relationship_events(cluster_id) WHERE cluster_id IS NOT NULL;

-- Analytics indexes
CREATE INDEX idx_timeline_relevance ON journalist_relationship_events(relevance_score DESC);
CREATE INDEX idx_timeline_impact ON journalist_relationship_events(relationship_impact DESC);

-- Time-based queries
CREATE INDEX idx_timeline_recent_30 ON journalist_relationship_events(event_timestamp) WHERE event_timestamp >= NOW() - INTERVAL '30 days';
CREATE INDEX idx_timeline_recent_90 ON journalist_relationship_events(event_timestamp) WHERE event_timestamp >= NOW() - INTERVAL '90 days';

-- Deduplication
CREATE UNIQUE INDEX idx_timeline_source_dedup ON journalist_relationship_events(source_system, source_id, journalist_id) WHERE source_id IS NOT NULL;

-- Full-text search
CREATE INDEX idx_timeline_search ON journalist_relationship_events USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
```

### Helper Functions

#### 1. get_journalist_timeline_stats
Returns aggregated statistics for a journalist.

#### 2. calculate_relationship_health_score
Calculates 0-100 health score based on 6 factors.

#### 3. auto_cluster_timeline_events
Groups related events into clusters using temporal and semantic similarity.

---

## Integration Guide

### For Upstream Systems (S38-S48)

All upstream systems should push events to the timeline using the `pushSystemEvent` endpoint:

```typescript
import { pushSystemEvent } from '@/lib/journalistTimelineApi';

// Example: S39 Pitch Engine integration
async function onPitchSent(pitchId: string, journalistId: string) {
  await pushSystemEvent({
    sourceSystem: 'pitch_engine',
    sourceId: pitchId,
    journalistId,
    eventType: 'pitch_sent',
    title: 'Sent pitch about Q4 earnings',
    payload: {
      pitchId,
      subject: 'Q4 Earnings Exclusive',
      personalizationScore: 0.85,
    },
    relevanceScore: 0.8,
    relationshipImpact: 0.1,
    sentiment: 'neutral',
  });
}

// Example: S40 Media Monitoring integration
async function onCoveragePublished(articleId: string, journalistId: string) {
  await pushSystemEvent({
    sourceSystem: 'media_monitoring',
    sourceId: articleId,
    journalistId,
    eventType: 'coverage_published',
    title: 'Published article: "Tech Trends 2025"',
    description: 'Feature article covering our Q4 product launch',
    payload: {
      articleId,
      publicationName: 'TechCrunch',
      articleUrl: 'https://techcrunch.com/...',
      wordCount: 1200,
    },
    relevanceScore: 0.95,
    relationshipImpact: 0.4,
    sentiment: 'positive',
  });
}
```

### Event Push Best Practices

1. **Always provide source_id**: Enables deduplication
2. **Set accurate relevance_score**: Helps prioritization (0-1 scale)
3. **Set relationship_impact**: Positive for good events, negative for issues
4. **Include rich payload**: More context = better narratives
5. **Push immediately**: Real-time updates keep timeline current

### Deduplication

The system automatically deduplicates events based on `(source_system, source_id, journalist_id)`. If you push the same event twice, the second push will fail gracefully.

---

## Best Practices

### 1. Manual Note Guidelines

**When to add manual notes:**
- Phone calls with journalist
- In-person meetings at conferences
- Informal conversations (coffee, lunch)
- Off-the-record background briefings
- Any interaction not captured by automated systems

**What to include:**
- Specific details (topics discussed, journalist interest level)
- Action items or follow-ups promised
- Sentiment and relationship impact assessment
- Context that helps team understand relationship state

**Example good note:**
```
Title: "Phone call - Q1 product launch exclusive"

Description:
30-minute call to discuss Q1 launch. Jane very interested in exclusive
preview - wants embargoed materials 2 weeks before launch. Mentioned she's
planning feature story for launch week. Discussed CEO interview possibility.
She covered our competitor last month, so timing is perfect.

Action items:
- Send embargo agreement by Friday
- Schedule CEO interview for week before launch
- Provide early access to product demo

Sentiment: Positive
Relationship Impact: +0.6
```

### 2. Timeline Review Cadence

**Weekly**: Review top 10 priority journalists
- Check health scores for any declines
- Review last 7 days of activity
- Identify opportunities for follow-up

**Monthly**: Comprehensive relationship audit
- Generate 30-day narratives for key journalists
- Identify declining relationships (score drop >10 points)
- Plan re-engagement campaigns

**Quarterly**: Strategic relationship planning
- Generate 90-day narratives for all tier-1 journalists
- Export health score reports for leadership
- Set relationship goals for next quarter

### 3. Health Score Action Thresholds

| Score | Action |
|-------|--------|
| 80-100 | Maintain momentum - continue current cadence |
| 60-79 | Relationship is healthy - consider upselling (exclusives, CEO access) |
| 40-59 | Needs attention - increase touchpoint frequency |
| 20-39 | At risk - immediate re-engagement required |
| 0-19 | Critical - escalate to team lead, develop recovery plan |

### 4. Narrative Generation Strategy

**Use 30-day narratives for:**
- Pre-pitch preparation
- Weekly team meetings
- Quick relationship checks

**Use 90-day narratives for:**
- Quarterly business reviews
- Relationship audits
- Trend identification

**Use all-time narratives for:**
- Executive briefings
- Major pitch preparation
- New team member onboarding

### 5. Event Filtering Best Practices

**Find coverage opportunities:**
```
Filter: eventType = ['pitch_sent', 'pitch_replied']
AND sentiment = 'positive'
AND last30Days = true
AND minRelevanceScore = 0.7
```

**Identify at-risk relationships:**
```
Filter: last90Days = true
AND sentiment IN ['negative', 'neutral']
AND eventTypes NOT IN ['coverage_published', 'pitch_replied']
```

**Track outreach effectiveness:**
```
Filter: eventTypes = ['outreach_sent', 'outreach_opened', 'outreach_replied']
AND last30Days = true
```

---

## Performance Characteristics

### Query Performance

| Operation | Typical Response Time | Notes |
|-----------|---------------------|-------|
| List events (20 items) | <50ms | With proper indexes |
| Get single event | <10ms | Primary key lookup |
| Calculate health score | <100ms | PostgreSQL function |
| Get stats | <80ms | Aggregation query |
| Auto-cluster | 200-500ms | Depends on event count |
| Generate narrative (LLM) | 2-5 seconds | LLM latency |
| Generate narrative (rules) | <200ms | Template-based |

### Scalability

The system is designed to handle:
- **10,000+ journalists** per organization
- **100,000+ events** per journalist
- **1M+ total events** per organization
- **100+ concurrent users** viewing timelines

### Caching Strategy

- Health scores cached for 5 minutes
- Statistics cached for 10 minutes
- Narratives cached for 24 hours
- Event lists not cached (real-time)

---

## Testing

### Backend Test Coverage

**File**: `apps/api/tests/journalistTimelineService.test.ts`

**Test Scenarios (14+)**:
- Event creation with validation
- Timeline retrieval with filtering
- Statistics calculation
- Health score calculation
- Event clustering
- Batch operations
- Manual note creation
- RLS compliance
- Error handling

### E2E Test Coverage

**File**: `apps/dashboard/tests/pr-timeline/timeline.spec.ts`

**Test Scenarios (20+)**:
- Timeline page display
- Health score rendering
- Event filtering workflows
- Manual note creation
- Event drawer interactions
- Narrative generation
- Pagination
- Access control
- Performance benchmarks

---

## Security & Compliance

### Row-Level Security (RLS)

All queries automatically scoped by `org_id`:

```sql
-- RLS Policy Example
CREATE POLICY timeline_org_isolation ON journalist_relationship_events
  FOR ALL
  USING (org_id = current_org_id());
```

### Data Privacy

- Events tied to org-level isolation
- No cross-org data leakage
- Audit trail for all manual notes
- GDPR-compliant data deletion (CASCADE on journalist delete)

### Access Control

- Requires authenticated session
- Org membership verified server-side
- Feature flag gating (`ENABLE_JOURNALIST_TIMELINE`)

---

## Future Enhancements

### Planned for S50+

1. **Relationship Alerts**: Proactive notifications for declining scores
2. **Bulk Export**: Export timelines to PDF/CSV for stakeholders
3. **Relationship Segmentation**: Group journalists by health score
4. **Predictive Scoring**: ML-based prediction of coverage probability
5. **Integration Templates**: Pre-built templates for common integrations
6. **Mobile App Support**: Native mobile timeline viewer

---

## Support & Troubleshooting

### Common Issues

**Issue**: Health score not updating after new event
- **Solution**: Health scores cached 5 minutes. Wait or manually trigger recalculation.

**Issue**: Duplicate events appearing
- **Solution**: Check that `sourceId` is unique per source system.

**Issue**: Narrative generation failing
- **Solution**: Check LLM service availability. System falls back to rule-based generation.

**Issue**: Timeline loading slowly
- **Solution**: Add filters to reduce result set. Check database indexes.

### Debug Logging

Enable debug logging for timeline service:

```typescript
// apps/api/src/services/journalistTimelineService.ts
const DEBUG = process.env.DEBUG_TIMELINE === 'true';
```

### Metrics & Monitoring

Track these key metrics:
- Event creation rate (events/hour)
- Timeline query latency (p50, p95, p99)
- Health score calculation time
- Narrative generation success rate
- LLM fallback rate

---

## Changelog

### V1.0.0 (Sprint S49)
- Initial release
- 40+ event types from 11 source systems
- Health scoring with 6 factors
- LLM-powered narrative generation
- 14 REST API endpoints
- 7 React components
- Complete timeline UI
- Backend and E2E test coverage

---

## References

- **Sprint S49 Spec**: Original requirements document
- **Migration 54**: `apps/api/supabase/migrations/54_create_journalist_timeline_schema.sql`
- **Service Layer**: `apps/api/src/services/journalistTimelineService.ts`
- **API Routes**: `apps/api/src/routes/journalistTimeline/index.ts`
- **Timeline Page**: `apps/dashboard/src/app/app/journalists/[id]/timeline/page.tsx`
- **Types**: `packages/types/src/journalistTimeline.ts`
- **Validators**: `packages/validators/src/journalistTimeline.ts`

---

**Document Version**: 1.0
**Last Updated**: November 26, 2025
**Author**: Pravado Engineering Team
**Status**: Production Ready
