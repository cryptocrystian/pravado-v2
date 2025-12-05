# Advanced Media Performance Insights V1 (Sprint S52)

**Version**: 1.0
**Status**: Production
**Last Updated**: 2024-02-02

---

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Database Schema](#database-schema)
4. [API Reference](#api-reference)
5. [Scoring Algorithms](#scoring-algorithms)
6. [User Workflows](#user-workflows)
7. [Integration Guide](#integration-guide)
8. [Dashboard Components](#dashboard-components)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Purpose

Advanced Media Performance Insights V1 provides unified performance analytics across all PR campaigns and media coverage (S38-S50). It aggregates data from press releases, pitches, media monitoring, journalist interactions, and audience personas to deliver actionable intelligence.

### Goals

- **Unified Analytics**: Single dashboard for all performance metrics
- **AI-Powered Insights**: LLM-generated narrative recommendations
- **Multi-Dimensional Scoring**: Visibility, EVI, Sentiment, Journalist Impact
- **Anomaly Detection**: Statistical identification of unusual patterns
- **Trend Analysis**: Time-series visualization of key metrics

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Dashboard Layer                      │
│  /app/media-performance (7 React Components)           │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                     API Layer                            │
│  13 REST Endpoints @ /api/v1/media-performance         │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                   Service Layer                          │
│  MediaPerformanceService (30+ methods)                 │
│  - Scoring algorithms                                   │
│  - Anomaly detection                                    │
│  - LLM integration                                      │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│                   Database Layer                         │
│  Migration 57 (4 tables, 5 SQL functions)              │
└─────────────────────────────────────────────────────────┘
```

---

## Key Features

### 1. Performance Snapshots

**Time-series rollups** of performance metrics aggregated at configurable intervals (hourly, daily, weekly, monthly).

**Metrics Captured** (30+ per snapshot):
- **Volume**: mention count, article count, journalist count, outlet count
- **Sentiment**: average sentiment, distribution, stability score
- **Visibility**: visibility score, estimated reach, share of voice
- **Engagement**: engagement score, pitch success rate, deliverability rate
- **Velocity**: coverage velocity, momentum score
- **EVI**: Earned Visibility Index with component scores
- **Journalist Impact**: top journalists, impact scores
- **Tier Distribution**: breakdown by outlet tier (1-4, unknown)
- **Keywords & Topics**: weighted keywords, topic clusters, entity mentions

### 2. Pre-Aggregated Dimensions

**Rollups** by specific dimensions for fast querying:
- **Brand**: Performance by brand/company
- **Campaign**: Performance by PR campaign
- **Journalist**: Individual journalist performance
- **Outlet Tier**: Performance by media outlet quality tier
- **Topic Cluster**: Performance by subject matter
- **Time Window**: Custom date range aggregations
- **Geography**: Location-based performance
- **Sentiment Category**: Performance by sentiment bucket

### 3. Computed Scores

**Entity-level scores** calculated and stored for quick retrieval:
- **Visibility Score** (0-100): Overall media exposure quality
- **Sentiment Stability** (0-100): Consistency of positive sentiment
- **Momentum Score** (0-100): Growth trajectory
- **Journalist Impact** (0-100): Individual journalist value
- **EVI Score** (0-100): Earned Visibility Index composite
- **Resonance** (0-100): Audience engagement quality
- **Overall Performance** (0-100): Master composite score

### 4. AI-Powered Insights

**LLM-generated narrative insights** with categorization:
- **Achievement**: Record-breaking performance, milestones reached
- **Anomaly**: Unusual spikes, drops, or patterns detected
- **Recommendation**: Actionable next steps based on data
- **Trend**: Emerging patterns over time
- **Risk**: Potential issues requiring attention
- **Opportunity**: Favorable conditions to capitalize on

Each insight includes:
- Title and summary
- Recommendation text
- Impact score (0-100)
- Confidence score (0-1)
- Supporting data (JSONB)
- LLM model and prompt version (if AI-generated)

### 5. Anomaly Detection

**Statistical z-score analysis** to identify outliers:
- **Threshold**: 2.0 sigma (configurable)
- **Types**: Spike, drop, outlier
- **Context**: Historical average, standard deviation
- **Magnitude**: Severity of anomaly

---

## Database Schema

### Tables

#### 1. `media_performance_snapshots`

Primary time-series table storing performance rollups.

**Columns**:
```sql
id                      UUID PRIMARY KEY
org_id                  UUID NOT NULL (FK to orgs)
snapshot_at             TIMESTAMPTZ NOT NULL
aggregation_period      aggregation_period NOT NULL DEFAULT 'daily'

-- Dimensions (filters/grouping)
brand_id                UUID NULL
campaign_id             UUID NULL
journalist_id           UUID NULL
outlet_tier             TEXT NULL
topic_cluster           TEXT NULL

-- Volume Metrics
mention_count           INTEGER DEFAULT 0
article_count           INTEGER DEFAULT 0
journalist_count        INTEGER DEFAULT 0
outlet_count            INTEGER DEFAULT 0

-- Sentiment Metrics
avg_sentiment           FLOAT NULL
sentiment_distribution  JSONB NULL
sentiment_stability_score FLOAT NULL

-- Visibility Metrics
visibility_score        FLOAT NULL
estimated_reach         BIGINT NULL
share_of_voice          FLOAT NULL

-- Engagement Metrics
engagement_score        FLOAT NULL
pitch_success_rate      FLOAT NULL
deliverability_rate     FLOAT NULL

-- Velocity & EVI
coverage_velocity       FLOAT NULL
momentum_score          FLOAT NULL
evi_score               FLOAT NULL
evi_components          JSONB NULL

-- Journalist Impact
journalist_impact_score FLOAT NULL
top_journalists         JSONB NULL

-- Tier Distribution
tier_distribution       JSONB NULL

-- Keywords & Topics
top_keywords            JSONB NULL
topic_clusters          JSONB NULL
entities_mentioned      JSONB NULL

-- Anomalies
has_anomaly             BOOLEAN DEFAULT false
anomaly_type            TEXT NULL
anomaly_magnitude       FLOAT NULL

created_at              TIMESTAMPTZ DEFAULT NOW()
updated_at              TIMESTAMPTZ DEFAULT NOW()
```

**Indexes**:
- `(org_id, snapshot_at DESC)` - Fast time-series queries
- `(org_id, brand_id, snapshot_at DESC)` - Brand filtering
- `(org_id, campaign_id, snapshot_at DESC)` - Campaign filtering
- `(org_id, journalist_id, snapshot_at DESC)` - Journalist filtering
- `(org_id, has_anomaly, snapshot_at DESC)` - Anomaly queries
- `(org_id, evi_score DESC)` - Top performers
- GIN `(top_keywords)` - Keyword search
- GIN `(topic_clusters)` - Topic search

**RLS Policy**: `org_id = auth.user_org_id()`

#### 2. `media_performance_dimensions`

Pre-aggregated rollups by dimension.

**Columns**:
```sql
id                  UUID PRIMARY KEY
org_id              UUID NOT NULL
dimension_type      dimension_type NOT NULL
dimension_value     TEXT NOT NULL
start_date          DATE NOT NULL
end_date            DATE NOT NULL
total_mentions      INTEGER DEFAULT 0
unique_journalists  INTEGER DEFAULT 0
unique_outlets      INTEGER DEFAULT 0
avg_sentiment       FLOAT NULL
total_reach         BIGINT NULL
avg_visibility_score FLOAT NULL
avg_engagement_score FLOAT NULL
rollup_data         JSONB NULL
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()
```

**Indexes**:
- `(org_id, dimension_type, start_date DESC)`
- `(org_id, dimension_type, dimension_value, start_date DESC)`
- GIN `(rollup_data)`

**RLS Policy**: `org_id = auth.user_org_id()`

#### 3. `media_performance_scores`

Computed scores by entity.

**Columns**:
```sql
id                  UUID PRIMARY KEY
org_id              UUID NOT NULL
entity_type         TEXT NOT NULL
entity_id           TEXT NOT NULL
score_type          score_type NOT NULL
score_value         FLOAT NOT NULL
score_components    JSONB NULL
calculated_at       TIMESTAMPTZ DEFAULT NOW()
window_start_date   DATE NOT NULL
window_end_date     DATE NOT NULL
metadata            JSONB NULL
created_at          TIMESTAMPTZ DEFAULT NOW()
updated_at          TIMESTAMPTZ DEFAULT NOW()

UNIQUE(org_id, entity_type, entity_id, score_type)
```

**Indexes**:
- `(org_id, entity_type, entity_id, score_type)`
- `(org_id, score_type, score_value DESC)`
- `(org_id, calculated_at DESC)`

**RLS Policy**: `org_id = auth.user_org_id()`

#### 4. `media_performance_insights`

AI-generated and rule-based insights.

**Columns**:
```sql
id                      UUID PRIMARY KEY
org_id                  UUID NOT NULL
category                insight_category NOT NULL
title                   TEXT NOT NULL
summary                 TEXT NOT NULL
recommendation          TEXT NULL
generated_by_llm        BOOLEAN DEFAULT false
llm_model               TEXT NULL
llm_prompt_version      TEXT NULL
related_entity_type     TEXT NULL
related_entity_id       TEXT NULL
time_window_start       TIMESTAMPTZ NULL
time_window_end         TIMESTAMPTZ NULL
impact_score            FLOAT NULL
confidence_score        FLOAT NULL
supporting_data         JSONB NULL
is_read                 BOOLEAN DEFAULT false
is_dismissed            BOOLEAN DEFAULT false
created_at              TIMESTAMPTZ DEFAULT NOW()
updated_at              TIMESTAMPTZ DEFAULT NOW()
```

**Indexes**:
- `(org_id, created_at DESC)`
- `(org_id, category, created_at DESC)`
- `(org_id, is_read, is_dismissed)`
- `(org_id, related_entity_type, related_entity_id)`

**RLS Policy**: `org_id = auth.user_org_id()`

### SQL Helper Functions

#### 1. `calculate_visibility_score()`

Calculates visibility score (0-100) based on weighted factors.

**Parameters**:
- `p_estimated_reach BIGINT`
- `p_tier_distribution JSONB`
- `p_mention_count INTEGER`
- `p_share_of_voice FLOAT`

**Returns**: `FLOAT`

**Algorithm**:
```
reachScore = min(100, log10(reach + 1) * 10)
tierScore = (tier1 * 1.0 + tier2 * 0.7 + tier3 * 0.4 + tier4 * 0.2) / total * 100
frequencyScore = min(100, log10(mentions + 1) * 20)
sovScore = shareOfVoice

visibilityScore = reachScore * 0.3 + tierScore * 0.3 + frequencyScore * 0.2 + sovScore * 0.2
```

#### 2. `calculate_sentiment_trend()`

Analyzes sentiment changes over a time window.

**Parameters**:
- `p_org_id UUID`
- `p_entity_type TEXT`
- `p_entity_id TEXT`
- `p_window_days INTEGER DEFAULT 30`

**Returns**: `JSONB`
```json
{
  "change_pct": 15.5,
  "stability_score": 85.0,
  "trend_direction": "up",
  "current_sentiment": 0.7,
  "previous_sentiment": 0.6
}
```

#### 3. `calculate_journalist_impact()`

Scores journalist value based on frequency, tier, and sentiment.

**Parameters**:
- `p_journalist_id UUID`
- `p_org_id UUID`
- `p_window_days INTEGER DEFAULT 90`

**Returns**: `FLOAT`

**Algorithm**:
```
frequencyScore = min(100, mention_count * 2) * 0.3
tierScore = (tier1_count * 100 + tier2_count * 70 + tier3_count * 40 + tier4_count * 20) / total * 0.4
sentimentBonus = ((avg_sentiment + 1) * 50) * 0.3

impactScore = frequencyScore + tierScore + sentimentBonus
```

#### 4. `calculate_evi_score()`

Calculates Earned Visibility Index (EVI) composite score.

**Parameters**:
- `p_estimated_reach BIGINT`
- `p_avg_sentiment FLOAT`
- `p_tier_distribution JSONB`
- `p_mention_count INTEGER`

**Returns**: `FLOAT`

**Algorithm**:
```
reachScore = min(100, log10(reach + 1) * 10) * 0.3
sentimentScore = ((sentiment + 1) * 50) * 0.25
tierScore = (weighted_tier_average) * 0.3
frequencyScore = min(100, log10(mentions + 1) * 20) * 0.15

eviScore = reachScore + sentimentScore + tierScore + frequencyScore
```

#### 5. `detect_performance_anomaly()`

Detects statistical anomalies using z-score analysis.

**Parameters**:
- `p_current_value FLOAT`
- `p_historical_avg FLOAT`
- `p_historical_stddev FLOAT`
- `p_threshold_sigma FLOAT DEFAULT 2.0`

**Returns**: `JSONB`
```json
{
  "has_anomaly": true,
  "anomaly_type": "spike",
  "magnitude": 3.5,
  "z_score": 3.5
}
```

**Algorithm**:
```
zScore = (current - avg) / stddev
hasAnomaly = |zScore| > threshold
anomalyType = zScore > 0 ? 'spike' : 'drop'
magnitude = |zScore|
```

---

## API Reference

### Base URL

```
/api/v1/media-performance
```

### Authentication

All endpoints require:
- `x-org-id` header with organization UUID
- Valid authentication token (cookie or bearer)

### Endpoints

#### 1. Snapshot Endpoints

##### POST `/snapshots`

Create a new performance snapshot.

**Request Body**:
```json
{
  "snapshotAt": "2024-02-02T12:00:00Z",
  "aggregationPeriod": "daily",
  "brandId": "uuid",
  "campaignId": "uuid",
  "metrics": {
    "mentionCount": 50,
    "articleCount": 30,
    "journalistCount": 25,
    "outletCount": 35,
    "avgSentiment": 0.7,
    "sentimentDistribution": {
      "veryNegative": 1,
      "negative": 2,
      "neutral": 10,
      "positive": 20,
      "veryPositive": 17
    },
    "estimatedReach": 500000,
    "shareOfVoice": 25.5,
    "tierDistribution": {
      "tier1": 10,
      "tier2": 15,
      "tier3": 8,
      "tier4": 2,
      "unknown": 0
    }
  }
}
```

**Response**: `MediaPerformanceSnapshot`

##### GET `/snapshots`

Retrieve snapshots with filters.

**Query Parameters**:
- `brandId` (optional): Filter by brand UUID
- `campaignId` (optional): Filter by campaign UUID
- `journalistId` (optional): Filter by journalist UUID
- `startDate` (optional): Start of date range (ISO 8601)
- `endDate` (optional): End of date range (ISO 8601)
- `aggregationPeriod` (optional): Filter by period
- `hasAnomaly` (optional): Filter by anomaly presence
- `minEviScore` (optional): Minimum EVI score
- `limit` (optional, default 100): Result limit
- `offset` (optional, default 0): Pagination offset

**Response**:
```json
{
  "success": true,
  "data": {
    "snapshots": [/* array of snapshots */],
    "total": 150
  }
}
```

##### GET `/snapshots/:id`

Retrieve a specific snapshot by ID.

**Response**: `MediaPerformanceSnapshot`

#### 2. Dimension Endpoints

##### POST `/dimensions`

Create a dimension rollup.

**Request Body**:
```json
{
  "dimensionType": "brand",
  "dimensionValue": "Acme Corp",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "metrics": {
    "totalMentions": 500,
    "uniqueJournalists": 50,
    "uniqueOutlets": 75,
    "avgSentiment": 0.7,
    "totalReach": 5000000
  }
}
```

**Response**: `MediaPerformanceDimension`

##### GET `/dimensions`

Retrieve dimensions with filters.

**Query Parameters**:
- `dimensionType` (optional): Filter by type
- `dimensionValue` (optional): Filter by value
- `startDate` (optional): Start of date range
- `endDate` (optional): End of date range
- `limit` (optional, default 100)
- `offset` (optional, default 0)

**Response**: `GetDimensionsResponse`

#### 3. Score Endpoints

##### POST `/scores`

Upsert a performance score (creates or updates).

**Request Body**:
```json
{
  "entityType": "campaign",
  "entityId": "campaign-uuid",
  "scoreType": "visibility",
  "scoreValue": 85,
  "scoreComponents": {
    "reach": 90,
    "tier": 85,
    "frequency": 80,
    "sov": 85
  },
  "windowStartDate": "2024-01-01",
  "windowEndDate": "2024-01-31"
}
```

**Response**: `MediaPerformanceScore`

##### GET `/scores`

Retrieve scores with filters.

**Query Parameters**:
- `entityType` (optional): Filter by entity type
- `entityId` (optional): Filter by entity ID
- `scoreType` (optional): Filter by score type
- `minScore` (optional): Minimum score value
- `maxScore` (optional): Maximum score value
- `startDate` (optional): Calculation date start
- `endDate` (optional): Calculation date end
- `limit` (optional, default 100)
- `offset` (optional, default 0)

**Response**: `GetScoresResponse`

#### 4. Insight Endpoints

##### POST `/insights`

Create a manual insight.

**Request Body**:
```json
{
  "category": "achievement",
  "title": "Record Mentions This Month",
  "summary": "Achieved 500 mentions, a 50% increase from last month.",
  "recommendation": "Continue current outreach strategy.",
  "impactScore": 85,
  "confidenceScore": 0.95
}
```

**Response**: `MediaPerformanceInsight`

##### POST `/insights/generate/:snapshotId`

Generate an AI insight from a snapshot.

**Request Body**:
```json
{
  "category": "trend"
}
```

**Response**: `MediaPerformanceInsight` (with `generatedByLlm: true`)

##### PATCH `/insights/:id`

Update insight status.

**Request Body**:
```json
{
  "isRead": true,
  "isDismissed": false
}
```

**Response**: `MediaPerformanceInsight`

##### GET `/insights`

Retrieve insights with filters.

**Query Parameters**:
- `category` (optional): Filter by category
- `isRead` (optional): Filter by read status
- `isDismissed` (optional): Filter by dismissed status
- `relatedEntityType` (optional): Filter by related entity
- `relatedEntityId` (optional): Filter by entity ID
- `minImpactScore` (optional): Minimum impact
- `startDate` (optional): Creation date start
- `endDate` (optional): Creation date end
- `limit` (optional, default 50)
- `offset` (optional, default 0)

**Response**: `GetInsightsResponse` (includes unreadCount)

#### 5. Analytics Endpoints

##### GET `/trends/:metric`

Get trend data for a specific metric.

**Path Parameters**:
- `metric`: One of `mention_volume`, `sentiment_score`, `visibility_index`, etc.

**Query Parameters**:
- `brandId` (optional)
- `campaignId` (optional)
- `startDate` (optional)
- `endDate` (optional)
- `limit` (optional, default 100)

**Response**:
```json
{
  "success": true,
  "data": {
    "metric": "mention_volume",
    "dataPoints": [
      {"timestamp": "2024-01-01T00:00:00Z", "value": 50},
      {"timestamp": "2024-01-02T00:00:00Z", "value": 55}
    ],
    "summary": {
      "currentValue": 55,
      "previousValue": 50,
      "changePct": 10.0,
      "trendDirection": "up",
      "avgValue": 52.5,
      "maxValue": 55,
      "minValue": 50
    }
  }
}
```

##### GET `/anomalies`

Get detected anomalies.

**Query Parameters**:
- `brandId` (optional)
- `campaignId` (optional)
- `startDate` (optional)
- `endDate` (optional)
- `limit` (optional, default 20)

**Response**:
```json
{
  "success": true,
  "data": {
    "anomalies": [
      {
        "snapshot": {/* MediaPerformanceSnapshot */},
        "anomalyDetails": {
          "hasAnomaly": true,
          "anomalyType": "spike",
          "magnitude": 3.5,
          "zScore": 3.5
        },
        "context": {
          "historicalAvg": 50,
          "historicalStdDev": 10,
          "threshold": 2.0
        }
      }
    ],
    "total": 5
  }
}
```

##### GET `/overview`

Get comprehensive performance overview.

**Query Parameters** (all required):
- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date
- `brandId` (optional)
- `campaignId` (optional)

**Response**:
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "summary": {
      "totalMentions": 1500,
      "totalArticles": 900,
      "totalJournalists": 150,
      "totalOutlets": 200,
      "avgSentiment": 0.7,
      "estimatedReach": 15000000,
      "avgVisibilityScore": 85,
      "avgEviScore": 82
    },
    "trends": {
      "mentionsTrend": 15.5,
      "sentimentTrend": 5.2,
      "visibilityTrend": 10.3,
      "eviTrend": 8.7
    },
    "topPerformers": {
      "campaigns": [/* TopPerformer[] */],
      "journalists": [/* TopPerformer[] */],
      "topics": [/* TopPerformer[] */]
    },
    "insights": [/* MediaPerformanceInsight[] */]
  }
}
```

---

## Scoring Algorithms

### Visibility Score (0-100)

**Purpose**: Measure overall media exposure quality

**Factors**:
1. **Reach (30%)**: Logarithmic scale of estimated audience
   - `reachScore = min(100, log10(reach + 1) * 10)`
2. **Tier Quality (30%)**: Weighted outlet tier distribution
   - Tier 1 = 100%, Tier 2 = 70%, Tier 3 = 40%, Tier 4 = 20%
3. **Frequency (20%)**: Logarithmic scale of mention count
   - `frequencyScore = min(100, log10(mentions + 1) * 20)`
4. **Share of Voice (20%)**: Percentage of total market mentions

**Formula**:
```
visibilityScore = reachScore * 0.3 + tierScore * 0.3 + frequencyScore * 0.2 + sovScore * 0.2
```

**Interpretation**:
- **80-100**: Excellent visibility, broad high-quality coverage
- **60-79**: Good visibility, solid mainstream coverage
- **40-59**: Moderate visibility, room for improvement
- **0-39**: Poor visibility, requires strategic changes

### EVI Score (Earned Visibility Index, 0-100)

**Purpose**: Composite measure of earned media value

**Factors**:
1. **Reach (30%)**: Audience size
2. **Sentiment (25%)**: Quality of coverage tone
   - Converted from -1 to 1 scale: `(sentiment + 1) * 50`
3. **Tier (30%)**: Outlet quality weighted average
4. **Frequency (15%)**: Coverage volume

**Formula**:
```
eviScore = reachScore * 0.3 + sentimentScore * 0.25 + tierScore * 0.3 + frequencyScore * 0.15
```

**Interpretation**:
- **80-100**: Premium earned media value
- **60-79**: Strong earned media presence
- **40-59**: Average earned media impact
- **0-39**: Weak earned media performance

### Journalist Impact Score (0-100)

**Purpose**: Measure individual journalist value to your PR efforts

**Factors**:
1. **Frequency (30%)**: How often they cover you
   - `frequencyScore = min(100, mention_count * 2)`
2. **Tier (40%)**: Quality of their outlet
   - Tier 1 = 100, Tier 2 = 70, Tier 3 = 40, Tier 4 = 20
3. **Sentiment Bonus (30%)**: How favorably they cover you
   - `sentimentBonus = ((avg_sentiment + 1) * 50) * 0.3`

**Formula**:
```
impactScore = frequencyScore * 0.3 + tierScore * 0.4 + sentimentBonus
```

**Interpretation**:
- **80-100**: VIP journalist, prioritize relationship
- **60-79**: Valuable journalist, maintain contact
- **40-59**: Emerging relationship, nurture potential
- **0-39**: Low-value journalist, deprioritize

### Sentiment Stability Score (0-100)

**Purpose**: Measure consistency of positive sentiment

**Algorithm**:
1. Calculate sentiment variance over time window
2. Compute standard deviation
3. Convert to stability score: `100 - (stdDev * 100)`

**Interpretation**:
- **80-100**: Very stable sentiment, predictable coverage
- **60-79**: Moderately stable, some fluctuations
- **40-59**: Unstable sentiment, significant variations
- **0-39**: Highly volatile sentiment, requires attention

### Anomaly Detection

**Purpose**: Identify unusual performance patterns

**Algorithm**:
1. Calculate historical average and standard deviation (30-day window)
2. Compute z-score: `(current - avg) / stddev`
3. Flag if `|z-score| > threshold` (default 2.0 sigma)
4. Classify as spike (positive) or drop (negative)

**Interpretation**:
- **Z-score > 3**: Extreme anomaly, investigate immediately
- **Z-score 2-3**: Significant anomaly, monitor closely
- **Z-score < 2**: Normal variation

---

## User Workflows

### Workflow 1: Monitor Campaign Performance

**Goal**: Track ongoing campaign metrics

**Steps**:
1. Navigate to `/app/media-performance`
2. Select date range (last 30 days recommended)
3. Review summary cards:
   - Check Visibility Score trend
   - Verify EVI Score momentum
   - Monitor Sentiment quality
   - Track Coverage Stats growth
4. Examine Sentiment Trend Chart for shifts
5. Review Coverage Velocity for consistent output
6. Check Insight Panel for AI recommendations
7. Take action on high-impact insights

**Best Practice**: Check daily for trending campaigns, weekly for steady-state campaigns.

### Workflow 2: Analyze Journalist Relationships

**Goal**: Identify top journalist targets

**Steps**:
1. Navigate to dashboard
2. Scroll to Journalist Impact Table
3. Sort by Impact Score (descending)
4. Review top 10 journalists:
   - Note tier levels
   - Check mention frequency
   - Verify sentiment scores
5. Click journalist for detailed profile
6. Add top journalists to outreach lists
7. Schedule regular touchpoints

**Best Practice**: Review monthly, prioritize tier 1-2 journalists with impact > 70.

### Workflow 3: Detect and Respond to Anomalies

**Goal**: Quickly identify and address unusual patterns

**Steps**:
1. Enable anomaly notifications (if available)
2. Review Insight Panel for anomaly category insights
3. Navigate to Coverage Velocity Chart
4. Identify spike or drop dates
5. Cross-reference with Campaign Heatmap
6. Check tier distribution for quality shifts
7. Generate AI insight for root cause analysis
8. Take corrective action or capitalize on opportunity

**Best Practice**: Review anomalies within 24 hours of detection.

### Workflow 4: Quarterly Performance Review

**Goal**: Strategic analysis for leadership

**Steps**:
1. Set date range to last 90 days
2. Export key metrics:
   - Total mentions, articles, journalists
   - Average scores (Visibility, EVI, Sentiment)
   - Top performers (campaigns, journalists, topics)
3. Review Sentiment Trend for long-term direction
4. Analyze Tier Distribution for quality improvement
5. Compare to previous quarter
6. Generate executive summary with insights
7. Set goals for next quarter

**Best Practice**: Schedule quarterly reviews, include stakeholder presentations.

### Workflow 5: Optimize Campaign Strategy

**Goal**: Data-driven campaign improvements

**Steps**:
1. Filter dashboard by specific campaign
2. Review all metrics for that campaign
3. Compare to organization averages
4. Identify strengths (scores > 70)
5. Identify weaknesses (scores < 50)
6. Review AI recommendations
7. Implement top 3 actionable insights
8. Re-measure after 2 weeks

**Best Practice**: Run optimization cycles every 2 weeks during active campaigns.

---

## Integration Guide

### Integrating with Press Release Generator (S38)

When a press release is published, create a snapshot to track its performance:

```typescript
import { createSnapshot } from '@/lib/mediaPerformanceApi';

async function onPressReleasePublished(releaseId: string) {
  // Wait 24 hours for coverage to accumulate
  setTimeout(async () => {
    const coverage = await getCoverageMetrics(releaseId);

    await createSnapshot({
      snapshotAt: new Date(),
      aggregationPeriod: 'daily',
      campaignId: coverage.campaignId,
      metrics: {
        mentionCount: coverage.mentions,
        articleCount: coverage.articles,
        journalistCount: coverage.journalists.length,
        outletCount: coverage.outlets.length,
        estimatedReach: coverage.totalReach,
        tierDistribution: coverage.tiers,
      },
    });
  }, 24 * 60 * 60 * 1000);
}
```

### Integrating with Media Monitoring (S40)

Stream real-time mentions into snapshots:

```typescript
import { createSnapshot } from '@/lib/mediaPerformanceApi';

async function onNewMention(mention: MediaMention) {
  // Aggregate mentions hourly
  const hourlySnapshot = await getOrCreateHourlySnapshot(new Date());

  hourlySnapshot.metrics.mentionCount += 1;
  hourlySnapshot.metrics.estimatedReach += mention.reach;

  if (mention.sentiment) {
    updateSentimentDistribution(hourlySnapshot, mention.sentiment);
  }

  await upsertSnapshot(hourlySnapshot);
}
```

### Integrating with Journalist Graph (S46)

Update journalist impact scores based on interactions:

```typescript
import { upsertScore, calculateJournalistImpact } from '@/lib/mediaPerformanceApi';

async function updateJournalistScore(journalistId: string) {
  const impactScore = await calculateJournalistImpact(journalistId, orgId, 90);

  await upsertScore({
    entityType: 'journalist',
    entityId: journalistId,
    scoreType: 'journalist_impact',
    scoreValue: impactScore,
    windowStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    windowEndDate: new Date(),
  });
}
```

### Integrating with Audience Personas (S51)

Link performance to target personas:

```typescript
import { createDimension } from '@/lib/mediaPerformanceApi';

async function trackPersonaPerformance(personaId: string, metrics: PerformanceMetrics) {
  await createDimension({
    dimensionType: 'audience_persona',
    dimensionValue: personaId,
    startDate: metrics.startDate,
    endDate: metrics.endDate,
    metrics: {
      totalMentions: metrics.mentions,
      uniqueJournalists: metrics.journalists.size,
      uniqueOutlets: metrics.outlets.size,
      avgSentiment: metrics.avgSentiment,
    },
  });
}
```

---

## Dashboard Components

### 1. PerformanceScoreCard

**Purpose**: Display single metric with trend

**Props**:
- `title`: Metric name
- `score`: Current value (0-100)
- `trend`: Direction ('up', 'down', 'stable')
- `changePct`: Percentage change
- `description`: Explanation text
- `icon`: Custom icon element

**Usage**:
```tsx
<PerformanceScoreCard
  title="Visibility Score"
  score={85}
  trend="up"
  changePct={12.5}
  description="Overall media reach and exposure"
  icon={<TrendingUp />}
/>
```

### 2. SentimentTrendChart

**Purpose**: Line chart of sentiment over time

**Props**:
- `data`: Array of `{timestamp, value}` points
- `currentSentiment`: Latest sentiment value
- `trendDirection`: Overall trend
- `changePct`: Change percentage
- `height`: Chart height in pixels

**Usage**:
```tsx
<SentimentTrendChart
  data={sentimentData}
  currentSentiment={0.7}
  trendDirection="up"
  changePct={5.2}
  height={200}
/>
```

### 3. CoverageVelocityChart

**Purpose**: Bar chart of mentions per period

**Props**:
- `data`: Array of `{timestamp, mentionCount}` points
- `currentVelocity`: Mentions per day
- `momentumScore`: Growth score (0-100)
- `height`: Chart height

**Usage**:
```tsx
<CoverageVelocityChart
  data={velocityData}
  currentVelocity={5.5}
  momentumScore={70}
  height={200}
/>
```

### 4. TierDistributionPie

**Purpose**: Donut chart of outlet tiers

**Props**:
- `distribution`: Object with tier1-4, unknown counts
- `totalMentions`: Total mention count
- `size`: Chart diameter

**Usage**:
```tsx
<TierDistributionPie
  distribution={{
    tier1: 10,
    tier2: 15,
    tier3: 8,
    tier4: 2,
    unknown: 0
  }}
  totalMentions={500}
  size={200}
/>
```

### 5. JournalistImpactTable

**Purpose**: Sortable table of top journalists

**Props**:
- `journalists`: Array of journalist objects
- `onJournalistClick`: Click handler
- `maxRows`: Display limit

**Usage**:
```tsx
<JournalistImpactTable
  journalists={topJournalists}
  onJournalistClick={(j) => navigate(`/journalist/${j.id}`)}
  maxRows={10}
/>
```

### 6. CampaignHeatmap

**Purpose**: Calendar heatmap of activity

**Props**:
- `data`: Array of `{date, value}` points
- `metric`: Metric name
- `weeks`: Number of weeks to display

**Usage**:
```tsx
<CampaignHeatmap
  data={activityData}
  metric="mentions"
  weeks={12}
/>
```

### 7. InsightNarrativePanel

**Purpose**: Display AI and rule-based insights

**Props**:
- `insights`: Array of insight objects
- `showDismissed`: Include dismissed insights
- `onInsightDismissed`: Dismiss handler
- `onInsightRead`: Read handler
- `maxInsights`: Display limit

**Usage**:
```tsx
<InsightNarrativePanel
  insights={insights}
  showDismissed={false}
  onInsightDismissed={(id) => handleDismiss(id)}
  onInsightRead={(id) => handleRead(id)}
  maxInsights={5}
/>
```

---

## Best Practices

### Data Collection

1. **Frequency**: Create daily snapshots for active campaigns, weekly for maintenance
2. **Timing**: Run snapshot aggregation at consistent times (e.g., midnight UTC)
3. **Completeness**: Always include minimum required metrics (counts, sentiment)
4. **Accuracy**: Validate source data before creating snapshots

### Performance Optimization

1. **Indexing**: Ensure all queries use indexed columns
2. **Caching**: Cache overview responses for 5-15 minutes
3. **Pagination**: Always use limit/offset for large result sets
4. **Rollups**: Use pre-aggregated dimensions for common queries

### Scoring Strategy

1. **Consistency**: Use same time windows when comparing scores
2. **Baselines**: Establish organization baselines before optimizing
3. **Trends**: Focus on trends over absolute values
4. **Context**: Consider industry and company size when interpreting scores

### Insight Management

1. **Prioritization**: Sort by impact score, address highest first
2. **Freshness**: Dismiss outdated insights (>30 days old)
3. **Actionability**: Only create insights with clear recommendations
4. **Follow-up**: Track which insights led to measurable improvements

### Dashboard Usage

1. **Bookmarking**: Bookmark common date range/filter combinations
2. **Monitoring**: Set up weekly email digests of key metrics
3. **Collaboration**: Share screenshots of insights with stakeholders
4. **Mobile**: Use responsive design for on-the-go monitoring

---

## Troubleshooting

### Issue: Snapshots not appearing in dashboard

**Possible Causes**:
1. Snapshot is outside selected date range
2. Org ID mismatch
3. RLS policy blocking access

**Solutions**:
1. Verify `snapshot_at` is within selected range
2. Check `x-org-id` header matches snapshot's `org_id`
3. Verify user has org access via RLS policy

### Issue: Scores showing as 0 or null

**Possible Causes**:
1. Insufficient data for calculation
2. Missing required fields (reach, tier distribution)
3. Division by zero in algorithm

**Solutions**:
1. Ensure minimum 3-5 snapshots exist for trending
2. Include all required metrics in snapshot creation
3. Check for null/undefined values before calculation

### Issue: Anomalies not detecting spikes

**Possible Causes**:
1. Insufficient historical data (< 30 days)
2. High natural variance making threshold too strict
3. Spike is within 2 sigma threshold

**Solutions**:
1. Wait for 30+ days of baseline data
2. Adjust `threshold_sigma` parameter (lower for sensitivity)
3. Review z-score values in anomaly details

### Issue: LLM insights failing to generate

**Possible Causes**:
1. LLM API key not configured
2. Rate limiting from LLM provider
3. Invalid snapshot data

**Solutions**:
1. Verify `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` env variable
2. Implement exponential backoff retry logic
3. Validate snapshot has minimum required fields

### Issue: Dashboard loading slowly

**Possible Causes**:
1. Large date range (>90 days)
2. No indexes on filter columns
3. Missing pagination

**Solutions**:
1. Reduce date range or use monthly aggregation
2. Ensure indexes exist on `org_id`, `snapshot_at`, dimension columns
3. Implement pagination with limit=100 default

### Issue: Tier distribution not displaying

**Possible Causes**:
1. `tierDistribution` field is null
2. All tier counts are 0
3. JSON parsing error

**Solutions**:
1. Ensure `tierDistribution` is included in snapshot creation
2. Verify at least one tier has mentions
3. Check JSONB format in database

---

## Appendix

### Metric Definitions

| Metric | Definition | Range | Source |
|--------|------------|-------|--------|
| Mention Count | Total number of brand/product mentions | 0-∞ | Media Monitoring (S40) |
| Article Count | Total number of unique articles | 0-∞ | Media Monitoring (S40) |
| Journalist Count | Unique journalists who covered | 0-∞ | Journalist Graph (S46) |
| Outlet Count | Unique media outlets | 0-∞ | Media Monitoring (S40) |
| Avg Sentiment | Mean sentiment score | -1 to 1 | Media Monitoring (S40) |
| Estimated Reach | Total potential audience | 0-∞ | Media Monitoring (S40) |
| Share of Voice | % of market mentions | 0-100% | Calculated |
| Pitch Success Rate | % of pitches that got coverage | 0-100% | PR Pitch Engine (S39) |
| Deliverability Rate | % of emails successfully delivered | 0-100% | Outreach Deliverability (S45) |
| Coverage Velocity | Mentions per day | 0-∞ | Calculated |

### Enum Values

**AggregationPeriod**:
- `hourly`
- `daily`
- `weekly`
- `monthly`

**DimensionType**:
- `brand`
- `campaign`
- `journalist`
- `outlet_tier`
- `topic_cluster`
- `time_window`
- `geography`
- `sentiment_category`

**ScoreType**:
- `visibility`
- `sentiment_stability`
- `momentum`
- `journalist_impact`
- `evi`
- `resonance`
- `overall_performance`

**InsightCategory**:
- `achievement`
- `anomaly`
- `recommendation`
- `trend`
- `risk`
- `opportunity`

### Related Documentation

- [Press Release Generator V1](./pr_generator_v1.md) - S38
- [PR Pitch Engine V1](./pr_pitch_engine_v1.md) - S39
- [Media Monitoring V1](./media_monitoring_v1.md) - S40
- [Journalist Identity Graph V1](./journalist_graph_v1.md) - S46
- [Audience Persona Builder V1](./audience_persona_builder_v1.md) - S51

---

**Document Version**: 1.0
**Last Updated**: 2024-02-02
**Author**: Sprint S52 Team
**Status**: Production
