# Brand Reputation Alerts & Executive Reporting V1

**Sprint:** S57
**Status:** Implemented
**Dependencies:** S56 Brand Reputation Intelligence

## Overview

The Brand Reputation Alerts & Executive Reporting feature extends S56 Brand Reputation Intelligence with:

1. **Real-time & scheduled alerts** for reputation score thresholds, component drops, competitor gaps, and crisis incidents
2. **Executive reputation reports** - weekly/monthly PDF-ready briefing objects with AI-generated sections
3. **Dashboard insights** - consolidated view of reputation drivers and alert status

## Architecture

### Database Schema

**Tables:**
- `brand_reputation_alert_rules` - Alert rule definitions with threshold conditions
- `brand_reputation_alert_events` - Triggered alert instances with lifecycle tracking
- `brand_reputation_reports` - Executive report metadata and snapshots
- `brand_reputation_report_sections` - Individual report sections (overview, highlights, etc.)
- `brand_reputation_report_recipients` - Report delivery targets

**Key Enums:**
- `reputation_alert_channel`: in_app, email, slack, webhook
- `reputation_alert_status`: new, acknowledged, muted, resolved
- `reputation_report_frequency`: ad_hoc, weekly, monthly, quarterly
- `reputation_report_format`: executive_summary, detailed
- `reputation_report_section_type`: overview, highlights, risks, opportunities, competitors, recommendations, events_timeline

### API Endpoints

**Alert Rules:**
```
POST   /api/v1/reputation-alerts/alert-rules           # Create rule
GET    /api/v1/reputation-alerts/alert-rules           # List rules
GET    /api/v1/reputation-alerts/alert-rules/:id       # Get rule
PATCH  /api/v1/reputation-alerts/alert-rules/:id       # Update rule
DELETE /api/v1/reputation-alerts/alert-rules/:id       # Delete rule
```

**Alert Events:**
```
GET    /api/v1/reputation-alerts/alert-events          # List events
GET    /api/v1/reputation-alerts/alert-events/:id      # Get event
POST   /api/v1/reputation-alerts/alert-events/:id/acknowledge  # Acknowledge
POST   /api/v1/reputation-alerts/alert-events/:id/resolve      # Resolve
POST   /api/v1/reputation-alerts/alert-events/:id/mute         # Mute
```

**Reports:**
```
POST   /api/v1/reputation-alerts/reports              # Create draft report
GET    /api/v1/reputation-alerts/reports              # List reports
GET    /api/v1/reputation-alerts/reports/:id          # Get report with sections
POST   /api/v1/reputation-alerts/reports/generate     # Generate full report
POST   /api/v1/reputation-alerts/reports/:id/sections/:sectionId/regenerate  # Regenerate section
```

**Insights:**
```
GET    /api/v1/reputation-alerts/insights             # Dashboard insights
```

## Alert Rule Types

### 1. Overall Score Threshold
Alert when overall reputation score crosses thresholds:
- `minOverallScore`: Alert if score drops below this value
- `maxOverallScore`: Alert if score rises above this value

### 2. Score Delta Threshold
Alert on significant score changes:
- `minDeltaOverallScore`: Alert if score change exceeds negative threshold
- `maxDeltaOverallScore`: Alert if score change exceeds positive threshold

### 3. Component Score Threshold
Alert on specific component drops:
- `componentKey`: sentiment, coverage, crisis_impact, competitive_position, engagement
- `minComponentScore`: Alert if component score drops below this value

### 4. Competitor Gap Threshold
Alert on competitive positioning changes:
- `competitorSlug`: Target competitor identifier
- `minCompetitorGap`: Alert if gap drops below threshold
- `maxCompetitorGap`: Alert if gap exceeds threshold

### 5. Crisis Integration
Alert on crisis incidents:
- `linkCrisisIncidents`: Enable crisis-linked alerts
- `minIncidentSeverity`: Minimum severity (1-5) to trigger

## Alert Evaluation Engine

The evaluation engine runs when:
1. New reputation snapshots are created (S56)
2. Crisis incidents are detected/updated (S55)
3. Manual evaluation is triggered

**Cooldown Logic:**
- Each rule has a `cooldownMinutes` setting
- After triggering, rule won't fire again until cooldown expires
- Prevents alert fatigue from repeated threshold crossings

## Executive Reports

### Report Structure

**Key Metrics:**
- Overall score and trend
- Component score breakdown
- Alert summary
- Crisis count

**Sections:**
1. **Overview** - Executive summary of reputation status
2. **Highlights** - Key positive developments
3. **Risks** - Areas of concern
4. **Opportunities** - Growth opportunities
5. **Competitors** - Competitive landscape analysis
6. **Recommendations** - Action items
7. **Events Timeline** - Chronological incident log

### Generation Process

1. Fetch S56 reputation snapshots for period
2. Query trend data and competitor comparisons
3. Retrieve crisis incidents from S55
4. Generate section content (template-based, LLM-ready)
5. Store sections with metadata
6. Update report status to `generated`

## Frontend Components

**Dashboard:**
- `InsightsSummaryCard` - Reputation score with trend and alert counts
- `AlertRulesList` - Manage alert rules with toggle/edit/delete
- `AlertEventsTable` - View and action alert events
- `ReportsList` - Browse and generate executive reports
- `AlertRuleForm` - Create/edit alert rule configuration

**Page:** `/app/reputation/alerts`

## Feature Flag

```typescript
FLAGS.ENABLE_BRAND_REPUTATION_ALERTS // true by default
```

## Integration Points

- **S56 Brand Reputation Intelligence**: Source of reputation snapshots
- **S55 Crisis Engine**: Crisis incident linking
- **S53 Competitive Intelligence**: Competitor gap calculations
- **S42 Scheduler**: Scheduled report generation
- **S44 PR Outreach**: Email delivery for reports

## Usage Examples

### Create a Low Score Alert

```typescript
const rule = await createAlertRule({
  name: 'Critical Score Drop',
  description: 'Alert when reputation score drops below 50',
  channel: 'email',
  minOverallScore: 50,
  cooldownMinutes: 120,
  notificationConfig: {
    emailAddresses: ['cmo@company.com'],
    includeDetails: true,
  },
});
```

### Generate Weekly Report

```typescript
const report = await generateReport({
  reportPeriodStart: '2024-01-01T00:00:00Z',
  reportPeriodEnd: '2024-01-07T00:00:00Z',
  frequency: 'weekly',
  format: 'executive_summary',
  includeCompetitors: true,
  includeCrisisData: true,
  recipients: [
    { channel: 'email', target: 'ceo@company.com', isPrimary: true },
  ],
});
```

### Get Dashboard Insights

```typescript
const insights = await getReputationInsights({
  periodStart: '2024-01-01T00:00:00Z',
  periodEnd: '2024-01-31T00:00:00Z',
  includeCompetitors: true,
  includeCrisisData: true,
  maxDrivers: 5,
});
```

## Testing

Backend tests: `apps/api/tests/brandReputationAlertsService.test.ts`

Run tests:
```bash
pnpm --filter @pravado/api test
```

## Migration

Migration file: `apps/api/supabase/migrations/62_create_brand_reputation_alerts_schema.sql`

Apply migration:
```bash
supabase db push
```
