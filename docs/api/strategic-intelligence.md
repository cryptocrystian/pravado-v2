# Strategic Intelligence API Reference

**Base URL:** `/api/v1/strategic-intelligence`
**Feature Flag:** `ENABLE_STRATEGIC_INTELLIGENCE`

## Authentication

All endpoints require authentication via Bearer token in the Authorization header.

```
Authorization: Bearer <token>
```

## Reports

### List Reports

Retrieve a paginated list of strategic intelligence reports.

```
GET /reports
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of results (default: 20, max: 100) |
| offset | integer | No | Pagination offset (default: 0) |
| status | string | No | Filter by status |
| format | string | No | Filter by report format |
| search | string | No | Search in title and description |
| sortBy | string | No | Sort field (default: created_at) |
| sortOrder | string | No | Sort direction: asc or desc (default: desc) |
| periodStart | string | No | Filter by period start (ISO 8601) |
| periodEnd | string | No | Filter by period end (ISO 8601) |

#### Response

```json
{
  "reports": [
    {
      "id": "uuid",
      "orgId": "uuid",
      "title": "Q4 2024 Strategic Review",
      "format": "quarterly_strategic_review",
      "status": "published",
      "targetAudience": ["board", "c_suite"],
      "periodStart": "2024-10-01T00:00:00Z",
      "periodEnd": "2024-12-31T23:59:59Z",
      "strategicScore": 78,
      "riskScore": 45,
      "opportunityScore": 82,
      "createdAt": "2024-12-15T10:00:00Z",
      "updatedAt": "2024-12-20T14:30:00Z"
    }
  ],
  "total": 25,
  "limit": 20,
  "offset": 0
}
```

### Create Report

Create a new strategic intelligence report.

```
POST /reports
```

#### Request Body

```json
{
  "title": "Q4 2024 Strategic Review",
  "format": "quarterly_strategic_review",
  "targetAudience": ["board", "c_suite"],
  "periodStart": "2024-10-01T00:00:00Z",
  "periodEnd": "2024-12-31T23:59:59Z",
  "description": "Quarterly strategic review for Q4 2024",
  "customSections": ["executive_summary", "strategic_context", "recommendations"]
}
```

#### Response

```json
{
  "id": "uuid",
  "orgId": "uuid",
  "title": "Q4 2024 Strategic Review",
  "format": "quarterly_strategic_review",
  "status": "draft",
  "targetAudience": ["board", "c_suite"],
  "periodStart": "2024-10-01T00:00:00Z",
  "periodEnd": "2024-12-31T23:59:59Z",
  "description": "Quarterly strategic review for Q4 2024",
  "createdAt": "2024-12-15T10:00:00Z",
  "createdBy": "uuid"
}
```

### Get Report

Retrieve a single report with all sections and sources.

```
GET /reports/:id
```

#### Response

```json
{
  "report": {
    "id": "uuid",
    "orgId": "uuid",
    "title": "Q4 2024 Strategic Review",
    "format": "quarterly_strategic_review",
    "status": "published",
    "targetAudience": ["board", "c_suite"],
    "periodStart": "2024-10-01T00:00:00Z",
    "periodEnd": "2024-12-31T23:59:59Z",
    "strategicScore": 78,
    "riskScore": 45,
    "opportunityScore": 82,
    "messagingScore": 71,
    "competitiveScore": 65,
    "brandHealthScore": 80,
    "summaryJson": {
      "keyInsights": ["..."],
      "topRisks": [{"risk": "...", "severity": "high"}],
      "topOpportunities": [{"opportunity": "...", "impact": "high"}]
    },
    "createdAt": "2024-12-15T10:00:00Z",
    "updatedAt": "2024-12-20T14:30:00Z",
    "approvedAt": "2024-12-18T09:00:00Z",
    "approvedBy": "uuid",
    "publishedAt": "2024-12-20T14:30:00Z"
  },
  "sections": [
    {
      "id": "uuid",
      "reportId": "uuid",
      "sectionType": "executive_summary",
      "title": "Executive Summary",
      "contentMd": "# Executive Summary\n\n...",
      "contentHtml": "<h1>Executive Summary</h1>...",
      "orderIndex": 0,
      "generatedAt": "2024-12-16T11:00:00Z"
    }
  ],
  "sources": [
    {
      "id": "uuid",
      "reportId": "uuid",
      "sourceSystem": "media_performance",
      "sourceId": "uuid",
      "sourceType": "performance_report",
      "sourceTitle": "November Media Performance",
      "contributionWeight": 0.15,
      "extractedAt": "2024-12-16T10:55:00Z"
    }
  ]
}
```

### Update Report

Update report metadata.

```
PUT /reports/:id
```

#### Request Body

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "targetAudience": ["board", "c_suite", "investors"]
}
```

### Delete Report

Delete a report and all associated data.

```
DELETE /reports/:id
```

#### Response

```json
{
  "success": true
}
```

## Report Generation

### Generate Report Content

Generate or regenerate report content using AI.

```
POST /reports/:id/generate
```

#### Request Body

```json
{
  "refreshInsights": true,
  "sectionsToGenerate": ["executive_summary", "recommendations"]
}
```

#### Response

```json
{
  "report": { ... },
  "sections": [ ... ],
  "sources": [ ... ],
  "insights": {
    "mediaPerformance": { ... },
    "competitiveIntel": { ... },
    "brandHealth": { ... },
    "riskAssessment": { ... }
  }
}
```

### Refresh Insights

Refresh aggregated insights from upstream systems.

```
POST /reports/:id/refresh-insights
```

#### Request Body

```json
{
  "forceRefresh": true
}
```

#### Response

```json
{
  "report": { ... },
  "insights": { ... }
}
```

## Report Workflow

### Approve Report

Move report to approved status.

```
POST /reports/:id/approve
```

#### Request Body

```json
{
  "approvalNotes": "Reviewed and approved for distribution"
}
```

#### Response

```json
{
  "id": "uuid",
  "status": "approved",
  "approvedAt": "2024-12-18T09:00:00Z",
  "approvedBy": "uuid"
}
```

### Publish Report

Publish report for distribution.

```
POST /reports/:id/publish
```

#### Request Body

```json
{
  "generatePdf": true,
  "distributionList": ["email@example.com"]
}
```

#### Response

```json
{
  "report": { ... },
  "pdfUrl": "https://..."
}
```

### Archive Report

Archive a report.

```
POST /reports/:id/archive
```

#### Response

```json
{
  "id": "uuid",
  "status": "archived",
  "archivedAt": "2024-12-30T10:00:00Z"
}
```

## Sections

### Update Section

Update section content.

```
PUT /reports/:reportId/sections/:sectionId
```

#### Request Body

```json
{
  "contentMd": "# Updated Content\n\nNew markdown content...",
  "title": "Updated Section Title"
}
```

#### Response

```json
{
  "id": "uuid",
  "sectionType": "executive_summary",
  "title": "Updated Section Title",
  "contentMd": "# Updated Content\n\nNew markdown content...",
  "contentHtml": "<h1>Updated Content</h1>...",
  "updatedAt": "2024-12-20T15:00:00Z"
}
```

### Regenerate Section

Regenerate section content using AI.

```
POST /reports/:reportId/sections/:sectionId/regenerate
```

#### Request Body

```json
{
  "additionalContext": "Focus on competitive positioning"
}
```

#### Response

```json
{
  "id": "uuid",
  "sectionType": "competitive_landscape",
  "contentMd": "# Competitive Landscape\n\n...",
  "contentHtml": "<h1>Competitive Landscape</h1>...",
  "generatedAt": "2024-12-20T15:05:00Z"
}
```

## Sources

### List Report Sources

Get all data sources for a report.

```
GET /reports/:id/sources
```

#### Response

```json
{
  "sources": [
    {
      "id": "uuid",
      "sourceSystem": "media_performance",
      "sourceId": "uuid",
      "sourceType": "performance_report",
      "sourceTitle": "November Media Performance",
      "contributionWeight": 0.15,
      "insightsJson": { ... },
      "extractedAt": "2024-12-16T10:55:00Z"
    }
  ]
}
```

### Add Source

Manually add a data source to a report.

```
POST /reports/:id/sources
```

#### Request Body

```json
{
  "sourceSystem": "media_monitoring",
  "sourceId": "uuid",
  "sourceType": "coverage_report",
  "sourceTitle": "December Coverage Report",
  "contributionWeight": 0.10
}
```

### Remove Source

Remove a source from a report.

```
DELETE /reports/:reportId/sources/:sourceId
```

## Statistics

### Get Statistics

Get aggregate statistics for strategic intelligence reports.

```
GET /stats
```

#### Response

```json
{
  "totalReports": 25,
  "byStatus": {
    "draft": 3,
    "generating": 1,
    "review": 2,
    "approved": 5,
    "published": 12,
    "archived": 2
  },
  "byFormat": {
    "quarterly_strategic_review": 8,
    "ceo_intelligence_brief": 10,
    "board_strategy_brief": 5,
    "investor_strategy_update": 2
  },
  "avgStrategicScore": 75.4,
  "avgRiskScore": 42.1,
  "avgOpportunityScore": 78.9,
  "recentReports": [ ... ]
}
```

## Period Comparison

### Compare Periods

Compare strategic metrics between two time periods.

```
POST /compare
```

#### Request Body

```json
{
  "currentPeriodStart": "2024-10-01T00:00:00Z",
  "currentPeriodEnd": "2024-12-31T23:59:59Z",
  "previousPeriodStart": "2024-07-01T00:00:00Z",
  "previousPeriodEnd": "2024-09-30T23:59:59Z"
}
```

#### Response

```json
{
  "currentPeriod": {
    "strategicScore": 78,
    "riskScore": 45,
    "opportunityScore": 82,
    "reportCount": 3
  },
  "previousPeriod": {
    "strategicScore": 72,
    "riskScore": 52,
    "opportunityScore": 75,
    "reportCount": 3
  },
  "changes": {
    "strategicScore": { "absolute": 6, "percentage": 8.3 },
    "riskScore": { "absolute": -7, "percentage": -13.5 },
    "opportunityScore": { "absolute": 7, "percentage": 9.3 }
  }
}
```

## Export

### Export Report

Export report in specified format.

```
POST /reports/:id/export
```

#### Request Body

```json
{
  "format": "pdf",
  "includeAppendix": true,
  "includeSources": true
}
```

#### Response

```json
{
  "url": "https://storage.example.com/exports/report-uuid.pdf",
  "expiresAt": "2024-12-21T10:00:00Z",
  "format": "pdf",
  "fileSize": 1024000
}
```

## Audit Log

### List Audit Logs

Get audit log entries for a report.

```
GET /reports/:id/audit-logs
```

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| limit | integer | No | Number of results (default: 50) |
| offset | integer | No | Pagination offset |
| eventType | string | No | Filter by event type |

#### Response

```json
{
  "logs": [
    {
      "id": "uuid",
      "reportId": "uuid",
      "eventType": "report_published",
      "actorId": "uuid",
      "changesJson": {
        "status": { "from": "approved", "to": "published" }
      },
      "createdAt": "2024-12-20T14:30:00Z"
    }
  ],
  "total": 15
}
```

## Enums

### Report Formats

| Value | Description |
|-------|-------------|
| quarterly_strategic_review | Quarterly strategic assessment |
| annual_strategic_assessment | Annual comprehensive review |
| board_strategy_brief | Board-ready brief |
| ceo_intelligence_brief | CEO daily/weekly summary |
| investor_strategy_update | Investor-focused update |
| crisis_strategic_response | Crisis mode guidance |
| competitive_strategy_report | Competitive analysis |
| custom | User-defined format |

### Report Status

| Value | Description |
|-------|-------------|
| draft | Initial creation |
| generating | AI generation in progress |
| review | Pending human review |
| approved | Approved for distribution |
| published | Published and distributed |
| archived | Historical record |

### Section Types

| Value | Description |
|-------|-------------|
| executive_summary | High-level overview |
| strategic_context | Market/industry analysis |
| media_performance | PR and coverage metrics |
| competitive_landscape | Competitor positioning |
| crisis_assessment | Risk and crisis status |
| brand_health | Brand perception |
| stakeholder_analysis | Stakeholder insights |
| risk_assessment | Risk profile |
| opportunities | Growth opportunities |
| recommendations | Strategic recommendations |
| appendix | Supporting data |

### Target Audiences

| Value | Description |
|-------|-------------|
| board | Board of Directors |
| c_suite | C-Level Executives |
| investors | Investors and Analysts |
| executive_team | Executive Leadership |
| strategy_team | Strategy Department |
| communications_team | Communications/PR Team |
| crisis_team | Crisis Response Team |

### Source Systems

| Value | Description |
|-------|-------------|
| pr_generator | Press Release Generator (S43) |
| media_monitoring | Media Monitoring (S45) |
| media_alerts | Media Alerts (S48) |
| media_performance | Media Performance (S57) |
| competitive_intel | Competitive Intelligence (S58) |
| crisis_engine | Crisis Engine (S59) |
| brand_reputation | Brand Reputation (S60) |
| brand_alerts | Brand Alerts (S60) |
| governance | Governance (S61) |
| risk_radar | Risk Radar (S62) |
| exec_command_center | Executive Command Center (S63) |
| exec_digest | Executive Digest (S63) |
| board_reports | Board Reports (S64) |
| investor_relations | Investor Relations (S64) |
| journalist_graph | Journalist Graph (S53) |
| media_lists | Media Lists (S52) |
| outreach_engine | Outreach Engine (S49) |

### Event Types

| Value | Description |
|-------|-------------|
| report_created | Report created |
| report_updated | Report metadata updated |
| report_generated | Content generated |
| report_approved | Report approved |
| report_published | Report published |
| report_archived | Report archived |
| section_updated | Section content updated |
| section_regenerated | Section regenerated |
| source_added | Source added |
| source_removed | Source removed |
| insights_refreshed | Insights refreshed |
| export_requested | Export requested |

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "title", "message": "Title is required" }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "error": "Feature not enabled",
  "code": "FEATURE_DISABLED"
}
```

### 404 Not Found

```json
{
  "error": "Report not found"
}
```

### 409 Conflict

```json
{
  "error": "Cannot approve report",
  "details": "Report must be in review status"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "requestId": "uuid"
}
```
