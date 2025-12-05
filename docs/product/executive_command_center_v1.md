# Executive Command Center & Cross-System Insights V1

**Sprint:** S61
**Status:** Complete
**Feature Flag:** `ENABLE_EXECUTIVE_COMMAND_CENTER`

## Overview

The Executive Command Center provides a unified dashboard experience for executives to monitor cross-system KPIs, risks, opportunities, and AI-generated narrative summaries. It aggregates insights from Risk Radar (S60), Crisis Response (S55), Brand Reputation (S56-S57), Governance & Compliance (S59), Media Performance (S52), Competitive Intelligence (S53), and PR Outreach (S44) into a single, actionable view.

## Key Features

### 1. Cross-System KPI Aggregation
- **Unified Metrics**: Pulls key performance indicators from all connected Pravado systems
- **Trend Analysis**: Shows directional trends (up/down/flat) with percentage changes
- **Category Grouping**: KPIs organized by category (risk, reputation, growth, governance)
- **Real-time Refresh**: On-demand data aggregation with configurable time windows

### 2. Insights Feed
- **Top 5 Risks**: Highest severity risk indicators across all systems
- **Top 5 Opportunities**: Most impactful growth opportunities identified
- **Source Attribution**: Each insight linked to its originating system
- **Severity Scoring**: 0-100 severity/impact scores for prioritization
- **Expandable Details**: Click-through to detailed descriptions and source links

### 3. LLM-Powered Narrative Generation
- **This Week's Narrative**: AI-generated executive summary
- **Risk Summary Section**: Consolidated risk narrative
- **Opportunities Summary Section**: Growth opportunity highlights
- **Storyline Section**: Contextual narrative connecting insights
- **Regeneration**: On-demand narrative refresh with latest data

### 4. Executive Dashboard Management
- **Multiple Dashboards**: Create focused dashboards for different purposes
- **Time Windows**: 24h, 7d, 30d, or 90d data aggregation periods
- **Primary Focus Modes**: Mixed, Risk, Reputation, Growth, or Governance focus
- **Default Dashboard**: Set a dashboard as the default view
- **Archive/Delete**: Soft delete (archive) or hard delete dashboards

## Technical Architecture

### Database Schema (Migration 65)

```sql
-- Core dashboard configuration
exec_dashboards (
  id, org_id, title, description, time_window, primary_focus,
  filters, is_default, is_archived, last_refreshed_at,
  created_by, updated_by, created_at, updated_at
)

-- Cross-system insights
exec_dashboard_insights (
  id, org_id, dashboard_id, source_system, source_record_id,
  category, title, description, severity_or_impact,
  is_risk, is_opportunity, is_top_insight, link_url, metadata, created_at
)

-- Aggregated KPIs
exec_dashboard_kpis (
  id, org_id, dashboard_id, source_system, category,
  metric_key, metric_label, metric_value, metric_unit, metric_trend,
  computed_at, created_at
)

-- LLM-generated narratives
exec_dashboard_narratives (
  id, org_id, dashboard_id, narrative_summary,
  narrative_risks_summary, narrative_opportunities_summary,
  narrative_storyline, is_current, generated_at,
  prompt_used, model_used, generation_duration_ms, created_at
)

-- Audit trail
exec_dashboard_audit_log (
  id, org_id, dashboard_id, action, actor_id,
  old_values, new_values, ip_address, user_agent, created_at
)
```

### Enums

```typescript
// Time windows for data aggregation
type ExecDashboardTimeWindow = '24h' | '7d' | '30d' | '90d';

// Primary focus areas
type ExecDashboardPrimaryFocus = 'risk' | 'reputation' | 'growth' | 'governance' | 'mixed';

// Source systems for insights
type ExecInsightSourceSystem =
  | 'risk_radar' | 'crisis' | 'reputation' | 'governance'
  | 'media_performance' | 'competitive_intel' | 'personas'
  | 'outreach' | 'media_monitoring' | 'press_releases'
  | 'pitches' | 'media_lists' | 'journalist_discovery' | 'other';
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/exec-dashboards` | List all dashboards |
| POST | `/api/v1/exec-dashboards` | Create new dashboard |
| GET | `/api/v1/exec-dashboards/:id` | Get dashboard with KPIs/insights |
| PATCH | `/api/v1/exec-dashboards/:id` | Update dashboard |
| DELETE | `/api/v1/exec-dashboards/:id` | Delete/archive dashboard |
| POST | `/api/v1/exec-dashboards/:id/refresh` | Refresh dashboard data |
| GET | `/api/v1/exec-dashboards/:id/insights` | List insights |
| GET | `/api/v1/exec-dashboards/:id/kpis` | List KPIs |
| GET | `/api/v1/exec-dashboards/:id/narratives` | List narratives |

### Data Aggregation Sources

The service aggregates data from these upstream tables:

1. **Risk Radar** (`risk_radar_snapshots`)
   - Overall risk index, velocity score, sentiment score
   - Key concerns and emerging risks as insights

2. **Crisis Response** (`crisis_incidents`)
   - Active crisis count, severity levels
   - Critical incidents as risk insights

3. **Brand Reputation** (`brand_reputation_snapshots`)
   - Reputation score, sentiment trends
   - Significant changes as insights

4. **Governance** (`governance_compliance_snapshots`)
   - Compliance score, audit findings
   - Non-compliant items as risk insights

5. **Media Performance** (`media_performance_snapshots`)
   - Coverage metrics, engagement rates
   - Top performing content as opportunity insights

6. **Competitive Intelligence** (`competitive_intel_snapshots`)
   - Competitive position, market share
   - Competitor movements as insights

7. **PR Outreach** (`pr_outreach_campaigns`)
   - Campaign performance, response rates
   - Successful pitches as opportunity insights

## Frontend Components

### ExecDashboardLayout
Three-panel responsive layout with header, left sidebar (insights), center (KPIs + narrative), and right sidebar (dashboard selector).

### ExecDashboardHeader
Dashboard title, focus badge, quick stats (KPIs, insights, risks, opportunities counts), and actions menu.

### ExecFilterBar
Controls for time window, primary focus, refresh button, and dashboard management.

### ExecKpiGrid
Responsive grid of KPI tiles with trend indicators, grouped by category.

### ExecInsightsFeed
Scrollable feed with filtering by source system and risk/opportunity type.

### ExecNarrativePanel
Collapsible sections for summary, risks, opportunities, and storyline with regeneration capability.

## Usage Examples

### Creating a Dashboard

```typescript
const response = await execDashboardApi.createDashboard({
  title: 'Weekly Risk Review',
  description: 'Executive risk overview for weekly leadership meetings',
  timeWindow: '7d',
  primaryFocus: 'risk',
});
```

### Refreshing Dashboard Data

```typescript
const response = await execDashboardApi.refreshDashboard(dashboardId, {
  timeWindowOverride: '30d',
  regenerateNarrative: true,
  forceRefresh: true,
});
```

### Filtering Insights

```typescript
const response = await execDashboardApi.listInsights(dashboardId, {
  sourceSystem: 'risk_radar',
  isRisk: true,
  isTopInsight: true,
  limit: 10,
});
```

## Configuration

### Environment Variables

```env
OPENAI_API_KEY=sk-...  # Required for narrative generation
```

### Feature Flag

```typescript
// packages/feature-flags/src/flags.ts
ENABLE_EXECUTIVE_COMMAND_CENTER: true
```

## Security

- **Row Level Security (RLS)**: All tables have RLS enabled with org_id isolation
- **Audit Logging**: All CRUD operations logged to audit table
- **Authentication Required**: All endpoints require valid session

## Performance Considerations

- **Lazy Loading**: Insights and narratives load on demand
- **Pagination**: All list endpoints support limit/offset
- **Caching**: Dashboard data cached until explicit refresh
- **Background Refresh**: Narrative generation is non-blocking

## Dependencies

### Upstream Sprints
- S52: Media Performance (media_performance_snapshots)
- S53: Competitive Intelligence (competitive_intel_snapshots)
- S44: PR Outreach (pr_outreach_campaigns)
- S55: Crisis Response (crisis_incidents)
- S56-S57: Brand Reputation (brand_reputation_snapshots)
- S59: Governance (governance_compliance_snapshots)
- S60: Risk Radar (risk_radar_snapshots)

### Packages
- `@pravado/types`: Type definitions
- `@pravado/validators`: Zod validation schemas
- `@pravado/feature-flags`: Feature flag management
- `@pravado/utils`: Logging utilities

## Testing

### Backend Tests
- `apps/api/tests/executiveCommandCenterService.test.ts`
- Dashboard CRUD operations
- Insights/KPIs/Narratives management
- Error handling and validation

### Frontend Tests
- Component rendering tests
- User interaction tests
- API integration tests

## Future Enhancements

1. **Scheduled Refresh**: Automatic periodic data refresh
2. **Email Reports**: Weekly executive summary emails
3. **Custom KPIs**: User-defined KPI configurations
4. **Dashboard Sharing**: Share dashboards across users
5. **Export to PDF**: Generate PDF reports from dashboards
6. **Comparison Mode**: Compare time periods side-by-side
7. **Alert Thresholds**: Configurable alert triggers for KPIs
