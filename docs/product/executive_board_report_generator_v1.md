# Executive Board Report Generator V1

**Sprint:** S63
**Feature Flag:** `ENABLE_EXEC_BOARD_REPORTS`
**Status:** Implemented

## Overview & Feature Summary

The Executive Board Report Generator creates comprehensive "Board Packs" and quarterly executive narratives by aggregating data from upstream Pravado systems (S38-S62). This system enables organizations to:

- Generate professional quarterly board reports with AI-powered narrative generation
- Aggregate metrics and insights from content, PR, SEO, and media systems
- Manage audience distribution with role-based access control
- Track approval workflows from draft through publication
- Export reports in PDF and PPTX formats for board presentations

### Key Capabilities

1. **Multi-format Reports**: Quarterly packs, board meeting summaries, annual reviews, and investor updates
2. **AI-Powered Generation**: Uses GPT-4o to create executive narratives from aggregated data
3. **Configurable Sections**: 12 section types covering all major reporting needs
4. **Audience Management**: Track board members, investors, and executives with view permissions
5. **Approval Workflow**: Draft → In Review → Approved → Published lifecycle
6. **Audit Trail**: Complete activity logging for compliance and governance

---

## Database Schema Reference

### Tables

| Table | Description |
|-------|-------------|
| `exec_board_reports` | Main report entity with metadata, status, and configuration |
| `exec_board_report_sections` | Individual sections with generated content |
| `exec_board_report_sources` | Data sources used for section generation |
| `exec_board_report_audience` | Board members and stakeholders with access |
| `exec_board_report_audit_log` | Activity tracking for compliance |

### Enums

```sql
-- Report format types
CREATE TYPE exec_board_report_format AS ENUM (
  'quarterly',        -- Quarterly board pack
  'annual',           -- Annual review
  'board_meeting',    -- Board meeting summary
  'investor_update'   -- Investor communications
);

-- Report status lifecycle
CREATE TYPE exec_board_report_status AS ENUM (
  'draft',           -- Initial creation
  'generating',      -- AI generation in progress
  'in_review',       -- Awaiting approval
  'approved',        -- Approved, ready for publish
  'published',       -- Published to audience
  'archived'         -- No longer active
);

-- Section types
CREATE TYPE exec_board_report_section_type AS ENUM (
  'executive_summary',
  'kpi_dashboard',
  'content_performance',
  'pr_coverage',
  'seo_rankings',
  'media_mentions',
  'competitive_analysis',
  'audience_insights',
  'risk_assessment',
  'strategic_recommendations',
  'financial_overview',
  'action_items'
);

-- Section generation status
CREATE TYPE exec_board_report_section_status AS ENUM (
  'pending',
  'generating',
  'generated',
  'error',
  'skipped'
);
```

### Key Columns

**exec_board_reports:**
- `id`, `org_id`, `created_by` - Identity and ownership
- `title`, `description` - Report metadata
- `format`, `status` - Type and lifecycle
- `period_start`, `period_end` - Reporting period
- `fiscal_quarter`, `fiscal_year` - Financial context
- `section_types` - Array of included sections
- `template_config` - Customization options (JSON)
- `llm_model`, `tone`, `target_length` - Generation settings
- `pdf_storage_path`, `pptx_storage_path` - Export files
- `approved_by`, `approved_at` - Approval tracking
- `published_by`, `published_at` - Publication tracking

---

## API Endpoint Reference

Base path: `/api/v1/executive-board-reports`

### Report Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List reports with pagination and filters |
| GET | `/stats` | Get report statistics for organization |
| POST | `/` | Create a new board report |
| GET | `/:reportId` | Get full report with sections and audience |
| PUT | `/:reportId` | Update report settings |
| DELETE | `/:reportId` | Delete or archive report |

### Generation & Workflow

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/:reportId/generate` | Trigger AI section generation |
| POST | `/:reportId/approve` | Mark report as approved |
| POST | `/:reportId/publish` | Publish and notify audience |

### Section Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:reportId/sections` | List all sections |
| PUT | `/:reportId/sections/:sectionId` | Update section content/visibility |
| PUT | `/:reportId/sections/order` | Reorder sections |

### Audience Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:reportId/audience` | List audience members |
| POST | `/:reportId/audience` | Add audience member |
| PUT | `/:reportId/audience/:audienceId` | Update member settings |
| DELETE | `/:reportId/audience/:audienceId` | Remove member |

### Audit Log

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:reportId/audit-logs` | Get activity history |

---

## Section Types Reference

| Section Type | Label | Description |
|--------------|-------|-------------|
| `executive_summary` | Executive Summary | High-level overview of period performance |
| `kpi_dashboard` | KPI Dashboard | Key performance indicators and metrics |
| `content_performance` | Content Performance | Content marketing metrics and highlights |
| `pr_coverage` | PR Coverage | Media coverage and PR campaign results |
| `seo_rankings` | SEO Rankings | Search visibility and ranking changes |
| `media_mentions` | Media Mentions | Brand mentions and sentiment analysis |
| `competitive_analysis` | Competitive Analysis | Market positioning vs competitors |
| `audience_insights` | Audience Insights | Audience demographics and behavior |
| `risk_assessment` | Risk Assessment | Identified risks and mitigation status |
| `strategic_recommendations` | Strategic Recommendations | AI-generated strategic guidance |
| `financial_overview` | Financial Overview | Budget utilization and ROI |
| `action_items` | Action Items | Prioritized next steps |

### Default Section Order

```typescript
const EXEC_BOARD_REPORT_SECTION_DEFAULT_ORDER = [
  'executive_summary',
  'kpi_dashboard',
  'content_performance',
  'pr_coverage',
  'seo_rankings',
  'media_mentions',
  'competitive_analysis',
  'strategic_recommendations',
  'action_items',
];
```

---

## Frontend Component Inventory

| Component | File | Purpose |
|-----------|------|---------|
| `BoardReportCard` | `BoardReportCard.tsx` | Report summary card for list view |
| `BoardReportHeader` | `BoardReportHeader.tsx` | Detail view header with workflow actions |
| `BoardReportSectionList` | `BoardReportSectionList.tsx` | Collapsible section content display |
| `BoardReportAudienceList` | `BoardReportAudienceList.tsx` | Audience management with add dialog |
| `BoardReportAuditLog` | `BoardReportAuditLog.tsx` | Activity timeline display |
| `BoardReportStatsCard` | `BoardReportStatsCard.tsx` | Statistics overview grid |
| `BoardReportForm` | `BoardReportForm.tsx` | Create/edit form with section selection |

### Page Location

Main page: `apps/dashboard/src/app/app/exec/board-reports/page.tsx`

---

## Upstream Dependencies

S63 aggregates data from these upstream systems:

| Sprint | System | Data Used |
|--------|--------|-----------|
| S38 | Audience Personas | Audience segmentation and insights |
| S39 | Media Performance | Media monitoring metrics |
| S40 | Competitive Intelligence | Competitor analysis data |
| S41 | Billing System | Budget and financial metrics |
| S42-45 | Audit System | Governance and compliance data |
| S46-48 | Media Monitoring | Media mentions and sentiment |
| S49-50 | PR Outreach | Outreach performance metrics |
| S51 | Journalist Discovery | Media relationship data |
| S52-55 | Journalist Intelligence | Contact enrichment and timeline |
| S56-60 | Content System | Content performance data |
| S61 | SEO Analytics | Search ranking data |
| S62 | Executive Digests | Digest templates and patterns |

---

## Usage Examples & API Snippets

### Create a Quarterly Report

```typescript
const report = await createReport({
  title: 'Q1 2025 Board Pack',
  format: 'quarterly',
  periodStart: '2025-01-01',
  periodEnd: '2025-03-31',
  fiscalQuarter: 'Q1',
  fiscalYear: 2025,
  sectionTypes: [
    'executive_summary',
    'kpi_dashboard',
    'content_performance',
    'pr_coverage',
    'strategic_recommendations',
    'action_items',
  ],
  llmModel: 'gpt-4o',
  tone: 'professional',
  targetLength: 'comprehensive',
});
```

### Generate Report Sections

```typescript
await generateReport(reportId, {
  forceRegenerate: false,  // Skip already-generated sections
  generatePdf: true,       // Create PDF after generation
  generatePptx: false,
});
```

### Add Board Member to Audience

```typescript
await addAudienceMember(reportId, {
  email: 'ceo@company.com',
  name: 'Jane Smith',
  role: 'CEO',
  accessLevel: 'approve',  // Can approve the report
});
```

### Publish Report to Audience

```typescript
await publishReport(reportId, {
  notifyAudience: true,    // Send email notifications
  regeneratePdf: true,     // Ensure latest PDF
});
```

### List Reports with Filters

```typescript
const { reports, total } = await listReports({
  format: 'quarterly',
  status: 'published',
  limit: 10,
  offset: 0,
  includeArchived: false,
});
```

---

## Security & RLS Notes

### Row Level Security Policies

All tables implement RLS policies for organization-level data isolation:

```sql
-- Example: Reports accessible only to org members
CREATE POLICY "Users can view reports for their organization"
  ON exec_board_reports FOR SELECT
  USING (org_id IN (
    SELECT org_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Example: Only report owners can update
CREATE POLICY "Users can update reports they created or are org admins"
  ON exec_board_reports FOR UPDATE
  USING (
    created_by = auth.uid() OR
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );
```

### Access Level Controls

| Level | Permissions |
|-------|-------------|
| `view` | Can view published reports |
| `comment` | Can view and add comments |
| `approve` | Can approve reports for publication |

### Audit Logging

All significant actions are logged to `exec_board_report_audit_log`:
- Report creation, updates, deletion
- Section generation and modifications
- Audience additions and removals
- Approval and publication events
- View tracking for audience members

---

## Configuration Options

### Generation Settings

| Setting | Options | Default |
|---------|---------|---------|
| `llmModel` | `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo` | `gpt-4o` |
| `tone` | `professional`, `formal`, `executive` | `professional` |
| `targetLength` | `brief`, `standard`, `comprehensive` | `comprehensive` |

### Template Configuration

```typescript
interface TemplateConfig {
  headerLogo?: string;
  primaryColor?: string;
  showConfidentialWatermark?: boolean;
  customFooter?: string;
  pageNumbers?: boolean;
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `LLM_OPENAI_API_KEY` | OpenAI API key for section generation |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |

---

## Future Enhancements

1. **Template Library**: Pre-built report templates for different industries
2. **Collaborative Editing**: Real-time section editing by multiple users
3. **Scheduled Generation**: Automatic quarterly report generation
4. **Custom Branding**: Full white-label support with custom themes
5. **Data Visualization**: Interactive charts embedded in sections
6. **Multi-language Support**: Generate reports in different languages
7. **Version History**: Track changes across report versions
8. **External Integrations**: Connect to Slack, email, and calendar systems
9. **Benchmark Comparisons**: Industry benchmark data integration
10. **AI Summary Audio**: Generate audio narration for executives

---

## Migration Reference

**File:** `apps/api/supabase/migrations/67_create_exec_board_reports_schema.sql`

Creates:
- 4 enum types
- 5 tables with proper relationships
- RLS policies for all tables
- Performance indexes
- Automatic `updated_at` triggers

---

## Test Coverage

### Backend Tests
- `apps/api/tests/executiveBoardReportService.test.ts`
- Covers: CRUD operations, audience management, statistics

### E2E Tests
- `apps/dashboard/tests/executive-board-reports.e2e.ts`
- Covers: List view, creation, detail view, sections, audience, workflows

---

## Related Documentation

- [Executive Digest Generator V1](./executive_digest_generator_v1.md) (S62)
- [Media Performance Insights](./advanced_media_performance_insights_v1.md) (S39)
- [Competitive Intelligence](./competitive_intelligence_v1.md) (S40)
- [Audit Logging V1](./audit_logging_v1.md) (S42)
