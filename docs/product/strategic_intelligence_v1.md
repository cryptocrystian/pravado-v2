# Strategic Intelligence Narrative Engine V1

**Sprint:** S65
**Status:** Complete
**Feature Flag:** `ENABLE_STRATEGIC_INTELLIGENCE`

## Overview

The Strategic Intelligence Narrative Engine is a CEO-level reporting system that synthesizes data from all upstream Pravado systems (S38-S64) into comprehensive strategic intelligence reports. It provides AI-powered narrative generation, multi-format report templates, and executive-ready deliverables.

## Problem Statement

Executives need a unified view of their organization's strategic position across PR, media, competitive intelligence, brand health, crisis management, and investor relations. Manually synthesizing insights from 17+ systems is time-consuming and error-prone, leading to delayed decision-making and missed opportunities.

## Solution

The Strategic Intelligence Narrative Engine automatically aggregates data from all Pravado systems and uses LLM-powered analysis to generate executive-ready strategic reports. The system supports multiple report formats tailored to different audiences (board, investors, CEO) and provides workflow management for review and approval processes.

## Key Features

### 1. Multi-System Data Aggregation

The engine pulls insights from 17 upstream systems:

| System | Data Source | Sprint |
|--------|-------------|--------|
| PR Generator | Press releases, media coverage | S43 |
| Media Monitoring | Coverage tracking, sentiment | S45 |
| Media Alerts | Alert triggers, notifications | S48 |
| Media Performance | Performance metrics, ROI | S57 |
| Competitive Intelligence | Competitor analysis | S58 |
| Crisis Engine | Crisis events, response metrics | S59 |
| Brand Reputation | Brand health scores | S60 |
| Brand Alerts | Brand monitoring alerts | S60 |
| Governance | Compliance status, audit findings | S61 |
| Risk Radar | Risk assessments, mitigation | S62 |
| Exec Command Center | Real-time dashboards | S63 |
| Exec Digest | Automated briefings | S63 |
| Board Reports | Board-ready reports | S64 |
| Investor Relations | IR communications | S64 |
| Journalist Graph | Journalist relationships | S53 |
| Media Lists | Curated media contacts | S52 |
| Outreach Engine | Campaign performance | S49 |

### 2. Report Formats

| Format | Use Case | Audience |
|--------|----------|----------|
| Quarterly Strategic Review | Regular strategic assessment | Executive Team |
| Annual Strategic Assessment | Yearly comprehensive review | Board, Investors |
| Board Strategy Brief | Condensed board-ready format | Board of Directors |
| CEO Intelligence Brief | Daily/weekly executive summary | CEO, C-Suite |
| Investor Strategy Update | IR-focused strategic narrative | Investors, Analysts |
| Crisis Strategic Response | Crisis-mode strategic guidance | Crisis Team, Executives |
| Competitive Strategy Report | Competitive positioning analysis | Strategy Team |
| Custom | User-defined sections | Various |

### 3. Section Types

Reports are composed of modular sections:

- **Executive Summary**: High-level strategic overview
- **Strategic Context**: Market and industry analysis
- **Media Performance**: PR and coverage metrics
- **Competitive Landscape**: Competitor positioning
- **Crisis Assessment**: Risk and crisis status
- **Brand Health**: Brand perception metrics
- **Stakeholder Analysis**: Key stakeholder insights
- **Risk Assessment**: Strategic risk profile
- **Opportunities**: Growth and expansion opportunities
- **Recommendations**: Actionable strategic recommendations
- **Appendix**: Supporting data and methodology

### 4. Strategic Scoring

Each report calculates composite scores:

| Score | Description | Range |
|-------|-------------|-------|
| Strategic Score | Overall strategic health | 0-100 |
| Risk Score | Aggregate risk level | 0-100 |
| Opportunity Score | Growth potential | 0-100 |
| Messaging Score | Communication effectiveness | 0-100 |
| Competitive Score | Competitive positioning | 0-100 |
| Brand Health Score | Brand perception strength | 0-100 |

### 5. Workflow Management

Reports follow a structured workflow:

```
Draft → Generating → Review → Approved → Published → Archived
```

- **Draft**: Initial creation, awaiting content generation
- **Generating**: AI content generation in progress
- **Review**: Content generated, pending human review
- **Approved**: Reviewed and approved, ready for distribution
- **Published**: Published and distributed to stakeholders
- **Archived**: Historical record, no longer active

### 6. Export Capabilities

Reports can be exported in multiple formats:

- **PDF**: Print-ready document with executive styling
- **PowerPoint (PPTX)**: Presentation-ready slides
- **Markdown**: Raw content for further editing

## User Interface

### Strategic Intelligence Dashboard

The main dashboard (`/app/exec/strategy`) provides:

- **Stats Overview**: Total reports, average scores
- **Report List**: Filterable list of all reports
- **Quick Actions**: Create new report, refresh data
- **Status Filters**: Filter by status and format

### Report Detail Page

The detail page (`/app/exec/strategy/[id]`) includes:

- **Report Header**: Title, status, scores, workflow actions
- **Sections Tab**: View and edit report sections
- **Insights Tab**: Aggregated insights visualization
- **Sources Tab**: Data source attribution
- **Activity Tab**: Audit log timeline

### Section Editor

Each section supports:

- **Markdown Editing**: Rich text editing with preview
- **AI Regeneration**: Regenerate section content with AI
- **Source Attribution**: View contributing data sources
- **Version History**: Track content changes

## Technical Architecture

### Database Schema

```sql
-- Main reports table
strategic_intelligence_reports (
  id UUID PRIMARY KEY,
  org_id UUID REFERENCES orgs(id),
  title VARCHAR(500),
  format strategic_report_format_enum,
  status strategic_report_status_enum,
  target_audience strategic_audience_enum[],
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  strategic_score INTEGER,
  risk_score INTEGER,
  opportunity_score INTEGER,
  ...
)

-- Report sections
strategic_report_sections (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES strategic_intelligence_reports(id),
  section_type strategic_section_type_enum,
  title VARCHAR(300),
  content_md TEXT,
  content_html TEXT,
  order_index INTEGER,
  ...
)

-- Data sources
strategic_report_sources (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES strategic_intelligence_reports(id),
  source_system strategic_source_system_enum,
  source_id VARCHAR(255),
  source_type VARCHAR(100),
  contribution_weight DECIMAL(3,2),
  ...
)

-- Audit log
strategic_intelligence_audit_log (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES strategic_intelligence_reports(id),
  event_type strategic_event_type_enum,
  actor_id UUID,
  changes_json JSONB,
  ...
)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/strategic-intelligence/reports` | List reports |
| POST | `/api/v1/strategic-intelligence/reports` | Create report |
| GET | `/api/v1/strategic-intelligence/reports/:id` | Get report with sections |
| PUT | `/api/v1/strategic-intelligence/reports/:id` | Update report |
| DELETE | `/api/v1/strategic-intelligence/reports/:id` | Delete report |
| POST | `/api/v1/strategic-intelligence/reports/:id/generate` | Generate content |
| POST | `/api/v1/strategic-intelligence/reports/:id/approve` | Approve report |
| POST | `/api/v1/strategic-intelligence/reports/:id/publish` | Publish report |
| POST | `/api/v1/strategic-intelligence/reports/:id/archive` | Archive report |
| GET | `/api/v1/strategic-intelligence/stats` | Get statistics |

## Integration Points

### Upstream Dependencies

The Strategic Intelligence Engine depends on data from:

- S38-S64 systems for source data
- OpenAI GPT-4o for content generation
- Supabase for data storage

### Downstream Consumers

Strategic reports can be consumed by:

- Board portal integrations
- Investor relations platforms
- Executive dashboards
- Email distribution systems

## Security & Permissions

### Row-Level Security

All tables implement RLS policies:

- Users can only access reports for their organization
- Admin users have elevated permissions for workflow actions
- Audit logs are immutable and organization-scoped

### Data Classification

Strategic reports may contain sensitive business intelligence:

- Reports are marked with sensitivity levels
- Export permissions are controlled
- Audit trails track all access and changes

## Configuration

### Feature Flag

Enable the feature by setting:

```typescript
ENABLE_STRATEGIC_INTELLIGENCE: true
```

### Environment Variables

No additional environment variables required beyond existing OpenAI and Supabase configuration.

## Metrics & Monitoring

### Key Metrics

- Reports generated per period
- Average time to approval
- Section regeneration rate
- Export frequency by format
- Strategic score trends

### Audit Events

All significant actions are logged:

- `report_created`
- `report_generated`
- `report_approved`
- `report_published`
- `report_archived`
- `section_updated`
- `section_regenerated`
- `insights_refreshed`
- `export_requested`

## Future Enhancements

### Phase 2 Considerations

- Real-time streaming generation
- Multi-language report generation
- Custom section templates
- Scheduled report generation
- Email/Slack distribution
- Board portal integration
- Version comparison tools
- Collaborative editing

## Related Documentation

- [API Reference](../api/strategic-intelligence.md)
- [Executive Command Center](exec_command_center_v1.md)
- [Board Reports](board_reports_v1.md)
- [Investor Relations](investor_relations_v1.md)
