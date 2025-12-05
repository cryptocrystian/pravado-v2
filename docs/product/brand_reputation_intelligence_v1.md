# Brand Reputation Intelligence V1

**Sprint:** S56
**Status:** Complete
**Last Updated:** November 2024

## Overview

Brand Reputation Intelligence provides real-time brand reputation scoring and an executive radar dashboard for leadership decision-making. The system aggregates signals from all prior PR and media subsystems (S38-S55) to compute a composite Brand Reputation Score (0-100) and provides actionable insights.

## Key Features

### 1. Brand Reputation Score (0-100)

A composite score calculated from five weighted components:

| Component | Default Weight | Description |
|-----------|----------------|-------------|
| Sentiment | 25% | Overall sentiment of media coverage |
| Coverage | 25% | Volume and quality of earned media |
| Crisis Impact | 20% | Impact of active crises on reputation |
| Competitive Position | 15% | Position relative to tracked competitors |
| Engagement | 15% | Journalist response rates and media engagement |

### 2. Executive Radar Dashboard

A comprehensive dashboard providing:

- Current reputation score with trend indicator
- Component-level score breakdown
- Top positive and negative drivers
- Competitive comparison
- Active alerts and events
- Executive summary with risks, opportunities, and recommended actions

### 3. Reputation Event Tracking

Automatic tracking of events from integrated systems:

- Media Monitoring (S40)
- Media Alerts (S43)
- Media Performance (S52)
- Crisis Incidents (S55)
- Competitive Intelligence (S53)
- PR Outreach (S44)
- PR Generator (S38)
- PR Pitch (S39)
- Journalist Engagement (S49)
- Social Listening
- Manual Adjustments

### 4. Alert System

Configurable alerts based on:

- Score drop thresholds
- Critical score thresholds
- Warning score thresholds
- Trend reversals

## Architecture

### Database Schema

```
brand_reputation_snapshots
├── id (uuid)
├── org_id (uuid)
├── overall_score (numeric)
├── sentiment_score (numeric)
├── coverage_score (numeric)
├── crisis_impact_score (numeric)
├── competitive_position_score (numeric)
├── engagement_score (numeric)
├── trend_direction (enum)
├── top_positive_drivers (jsonb)
├── top_negative_drivers (jsonb)
├── competitor_comparison (jsonb)
├── executive_summary (text)
├── key_risks (text[])
├── key_opportunities (text[])
└── created_at (timestamp)

brand_reputation_events
├── id (uuid)
├── org_id (uuid)
├── source_system (enum)
├── signal_type (enum)
├── delta (numeric)
├── affected_component (enum)
├── severity (enum)
├── title (text)
├── description (text)
├── context (jsonb)
├── is_processed (boolean)
└── event_timestamp (timestamp)

brand_reputation_config
├── id (uuid)
├── org_id (uuid)
├── weight_sentiment (numeric)
├── weight_coverage (numeric)
├── weight_crisis (numeric)
├── weight_competitive (numeric)
├── weight_engagement (numeric)
├── threshold_alert_score_drop (numeric)
├── threshold_critical_score (numeric)
├── threshold_warning_score (numeric)
├── auto_recalculate (boolean)
├── recalculate_interval_hours (integer)
└── alert_recipients (jsonb)

brand_reputation_alerts
├── id (uuid)
├── org_id (uuid)
├── severity (enum)
├── title (text)
├── message (text)
├── trigger_type (text)
├── is_acknowledged (boolean)
├── is_resolved (boolean)
└── created_at (timestamp)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/reputation/dashboard` | Get comprehensive dashboard |
| GET | `/api/v1/reputation/trend` | Get reputation trend data |
| POST | `/api/v1/reputation/recalculate` | Trigger score recalculation |
| GET | `/api/v1/reputation/config` | Get configuration |
| PATCH | `/api/v1/reputation/config` | Update configuration |
| GET | `/api/v1/reputation/events` | List reputation events |
| POST | `/api/v1/reputation/events` | Create manual event |
| GET | `/api/v1/reputation/alerts` | List alerts |
| POST | `/api/v1/reputation/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/api/v1/reputation/alerts/:id/resolve` | Resolve alert |
| GET | `/api/v1/reputation/health` | System health check |
| GET | `/api/v1/reputation/competitors` | Competitive comparison |

### Frontend Components

| Component | Description |
|-----------|-------------|
| ReputationScoreCard | Displays overall score with trend |
| ComponentScorePanel | Component breakdown visualization |
| ReputationDriverList | Positive/negative driver lists |
| CompetitorComparisonTable | Competitive position analysis |
| ReputationAlertsList | Active alerts with actions |
| ExecutiveSummaryPanel | Executive narrative panel |
| ReputationTrendChart | Trend visualization |
| ReputationEventsList | Recent events timeline |

## Feature Flag

```typescript
ENABLE_BRAND_REPUTATION: true
```

## Time Windows

- **24h**: Last 24 hours (hourly granularity)
- **7d**: Last 7 days (daily granularity)
- **30d**: Last 30 days (daily granularity)
- **90d**: Last 90 days (weekly granularity)
- **all**: All time (weekly granularity)

## Score Calculation

### Component Formulas

1. **Sentiment Score**: Based on positive/negative mention ratio and average sentiment
2. **Coverage Score**: Based on mention volume, velocity, and tier distribution
3. **Crisis Impact Score**: Inverse of crisis severity impact (100 - crisis_impact)
4. **Competitive Position Score**: Based on rank among competitors
5. **Engagement Score**: Based on outreach response rates and journalist meetings

### Overall Score

```
overall_score =
  (sentiment_score * weight_sentiment / 100) +
  (coverage_score * weight_coverage / 100) +
  (crisis_impact_score * weight_crisis / 100) +
  (competitive_position_score * weight_competitive / 100) +
  (engagement_score * weight_engagement / 100)
```

## Integration Points

### Inbound (Data Sources)

| System | Data Provided |
|--------|---------------|
| Media Monitoring (S40) | Mentions, sentiment |
| Media Performance (S52) | EVI scores, visibility |
| Crisis Engine (S55) | Active crises, severity |
| Competitive Intelligence (S53) | Competitor scores |
| PR Outreach (S44) | Response rates |
| Journalist Timeline (S49) | Engagement metrics |

### Outbound (Consumers)

- Executive Dashboard (Frontend)
- Alert Notifications (Email, Slack, Webhook)
- Audit Logging (S35)

## Best Practices

1. **Regular Recalculation**: Enable auto-recalculate for up-to-date scores
2. **Threshold Configuration**: Set appropriate alert thresholds for your industry
3. **Competitor Tracking**: Track 3-5 key competitors for meaningful comparison
4. **Event Investigation**: Review high-impact events promptly
5. **Executive Reviews**: Schedule weekly reviews of the executive summary

## Troubleshooting

### Score Not Updating

1. Check if auto-recalculate is enabled
2. Verify events are being recorded
3. Trigger manual recalculation

### Missing Competitor Data

1. Verify competitor profiles exist in Competitive Intelligence
2. Check if competitor IDs are configured
3. Ensure competitor monitoring is active

### Alert Not Triggering

1. Verify alert thresholds are configured
2. Check if alerts are enabled
3. Verify alert recipient configuration

## Future Enhancements

- AI-generated executive narratives
- Predictive reputation modeling
- Industry benchmark comparisons
- Social media integration
- Stakeholder sentiment tracking
