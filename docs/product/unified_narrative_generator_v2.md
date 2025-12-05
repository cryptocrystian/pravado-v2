# Unified Narrative Generator V2 - Product Specification

**Sprint:** S70
**Feature:** Cross-Domain Synthesis Engine
**Status:** Implemented
**Last Updated:** December 2024

## Overview

The Unified Narrative Generator V2 is a cross-domain synthesis engine that reads from ALL intelligence systems (S38-S69), identifies patterns, correlations, and insights across domains, and produces multi-layer narrative documents. It transforms raw intelligence data into coherent, actionable narratives tailored to specific audiences.

## Problem Statement

Organizations accumulate vast intelligence across multiple systems:

- Media monitoring alerts
- Competitive intelligence
- Brand reputation data
- Journalist relationships
- Content performance
- Risk assessments
- Executive insights

This creates challenges:

- **Information Overload**: Too much data to process manually
- **Siloed Insights**: Each system provides isolated analysis
- **Missing Connections**: Cross-domain patterns go undetected
- **Narrative Fatigue**: Manual report creation is time-consuming
- **Inconsistent Messaging**: Different stakeholders receive fragmented views

## Solution

An AI-powered narrative synthesis engine that:

1. **Aggregates Intelligence** from all source systems
2. **Identifies Patterns** including correlations, contradictions, and risk clusters
3. **Generates Narratives** tailored to specific audience types
4. **Produces Artifacts** including talking points, briefs, and memos
5. **Supports Workflows** for review, approval, and publication
6. **Computes Deltas** to highlight changes between periods

## Core Concepts

### Narrative Types

Seven specialized narrative types for different strategic needs:

| Type | Purpose | Primary Audience |
|------|---------|------------------|
| `executive` | High-level strategic overview | C-Suite, Board |
| `strategy` | Strategic planning and initiatives | Strategy Team |
| `investor` | Financial and growth narratives | Investors, Analysts |
| `crisis` | Risk response and mitigation | Crisis Team |
| `competitive` | Market positioning and competition | Product, Marketing |
| `reputation` | Brand perception and sentiment | Communications |
| `quarterly` | Period summary and outlook | All Stakeholders |

### Output Formats

Five document formats optimized for different use cases:

| Format | Description |
|--------|-------------|
| `executive_brief` | Concise 1-2 page summary |
| `deep_dive` | Comprehensive analysis with appendices |
| `presentation` | Slide-ready content with visuals |
| `memo` | Internal communication format |
| `report` | Formal structured report |

### Source Systems

The engine synthesizes data from 30+ source systems:

| Category | Systems |
|----------|---------|
| Content | `content_quality`, `content_briefs`, `content_rewrites` |
| Media | `media_monitoring`, `media_alerts`, `media_performance` |
| PR | `press_releases`, `pitches`, `outreach`, `deliverability` |
| Journalists | `journalist_graph`, `discovery`, `enrichment`, `timeline` |
| Intelligence | `competitive_intel`, `brand_reputation`, `risk_radar` |
| Executive | `executive_command`, `board_reports`, `investor_relations` |
| Strategic | `strategic_intelligence`, `unified_graph`, `scenarios` |

### Narrative Sections

Each narrative contains structured sections:

- **Executive Summary**: Key takeaways and critical insights
- **Strategic Context**: Market conditions and positioning
- **Performance Analysis**: Metrics and KPI analysis
- **Opportunities**: Growth areas and untapped potential
- **Risks & Challenges**: Threats and mitigation strategies
- **Recommendations**: Actionable next steps
- **Appendices**: Supporting data and references

### Cross-System Insights

The engine extracts four types of cross-domain insights:

| Type | Description |
|------|-------------|
| `correlation` | Positive relationships between systems |
| `contradiction` | Conflicting signals requiring attention |
| `pattern` | Recurring themes across domains |
| `risk_cluster` | Multiple risk indicators converging |

### Supplementary Artifacts

Automatically generated supporting materials:

- **Talking Points**: Key messages for stakeholder communications
- **Analyst Brief**: Technical details for analysts
- **Internal Memo**: Team alignment document
- **TL;DR Synthesis**: Ultra-concise summary
- **Narrative Delta**: Changes from previous period

## Architecture

### Database Schema

Seven PostgreSQL tables with RLS policies:

```
unified_narratives            - Core narrative entities
unified_narrative_sections    - Narrative content sections
unified_narrative_insights    - Cross-system insights
unified_narrative_sources     - Source data references
unified_narrative_artifacts   - Generated supplementary materials
unified_narrative_audit       - Operation audit trail
```

### Workflow States

Narratives progress through a defined lifecycle:

```
draft → generating → review → approved → published → archived
```

| State | Description |
|-------|-------------|
| `draft` | Initial creation, can be edited |
| `generating` | AI synthesis in progress |
| `review` | Ready for stakeholder review |
| `approved` | Approved for publication |
| `published` | Available to target audience |
| `archived` | Historical record |

### API Endpoints

All endpoints under `/api/v1/unified-narratives`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | / | Create narrative |
| GET | /:id | Get narrative |
| PATCH | /:id | Update narrative |
| DELETE | /:id | Delete narrative |
| GET | / | List narratives |
| POST | /:id/generate | Generate narrative content |
| POST | /:id/regenerate | Regenerate from sources |
| GET | /:id/sections | List sections |
| PATCH | /:id/sections/:sectionId | Update section |
| POST | /:id/sections/:sectionId/regenerate | Regenerate section |
| GET | /:id/insights | List cross-system insights |
| POST | /:id/insights | Add insight |
| POST | /:id/delta | Compute period delta |
| POST | /:id/approve | Approve narrative |
| POST | /:id/publish | Publish narrative |
| POST | /:id/archive | Archive narrative |
| POST | /:id/export | Export to format |
| GET | /stats | Get statistics |
| GET | /audit | List audit logs |

## Key Features

### 1. Multi-Source Aggregation

Collects and normalizes data from all configured source systems:

```typescript
const narrative = await createNarrative(ctx, {
  title: 'Q4 2024 Executive Summary',
  narrativeType: 'executive',
  sourceSystems: [
    'media_monitoring',
    'competitive_intel',
    'brand_reputation',
    'executive_command',
  ],
  periodStart: '2024-10-01',
  periodEnd: '2024-12-31',
});
```

### 2. AI-Powered Generation

LLM-driven synthesis with configurable parameters:

```typescript
await generateNarrative(ctx, narrativeId, {
  temperature: 0.7,
  maxTokens: 8000,
  includeVisuals: true,
  focusAreas: ['market_expansion', 'competitive_threats'],
});
```

### 3. Section Management

Granular control over narrative sections:

```typescript
// Update a specific section
await updateSection(ctx, narrativeId, sectionId, {
  contentMd: '## Updated Executive Summary\n\nKey insights...',
});

// Regenerate just one section
await regenerateSection(ctx, narrativeId, sectionId, {
  additionalContext: 'Focus on Q4 revenue growth',
});
```

### 4. Cross-System Insight Extraction

Automatic pattern detection across sources:

```typescript
const insights = await getInsights(ctx, narrativeId, {
  insightType: 'contradiction',
  minConfidence: 0.8,
});
// Returns: contradictions between systems with confidence scores
```

### 5. Narrative Delta Computation

Compare narratives across periods:

```typescript
const delta = await computeDelta(ctx, narrativeId, {
  previousNarrativeId: 'narrative-q3-2024',
  includeInsights: true,
});
// Returns: changes, new items, resolved items, trend analysis
```

### 6. Multi-Format Export

Export to various formats for distribution:

```typescript
const result = await exportNarrative(ctx, narrativeId, {
  format: 'pptx',
  includeAppendices: true,
  branding: 'corporate',
});
// Returns: download URL for PowerPoint presentation
```

### 7. Workflow Management

Full lifecycle control with audit trail:

```typescript
// Approve for publication
await approveNarrative(ctx, narrativeId, {
  approvalNote: 'Reviewed and approved by CMO',
});

// Publish to stakeholders
await publishNarrative(ctx, narrativeId, {
  channels: ['email', 'portal'],
  notifyStakeholders: true,
});

// Archive when no longer current
await archiveNarrative(ctx, narrativeId, 'Superseded by Q1 2025 report');
```

## UI Components

### Dashboard Layout

Three-panel layout with cards, filters, and detail drawer:

1. **Header**: Title, stats summary, action buttons
2. **Stats Row**: Narrative counts by status
3. **Filter Bar**: Search, status, type, and sort controls
4. **Narrative Grid**: Cards showing all narratives
5. **Detail Drawer**: Full narrative view with sections

### Components

| Component | Purpose |
|-----------|---------|
| `NarrativeCard` | Compact narrative summary card |
| `NarrativeFiltersBar` | Search and filter controls |
| `NarrativeGeneratorForm` | Create/configure new narratives |
| `NarrativeDetailDrawer` | Full narrative viewer/editor |
| `NarrativeSectionEditor` | Section content editing |
| `NarrativeInsightsList` | Cross-system insights display |
| `NarrativeWorkflowActions` | Approve/publish/export buttons |

### Form Fields

The generator form captures:

- **Title & Subtitle**: Narrative identification
- **Narrative Type**: Executive, strategy, investor, etc.
- **Output Format**: Brief, deep dive, presentation, etc.
- **Period Range**: Start and end dates
- **Source Systems**: Which systems to aggregate
- **Target Audience**: Intended recipients
- **Tags**: Categorization labels
- **Generate Immediately**: Auto-generate on create

## Integration Points

### Upstream Systems (Data Sources)

Aggregates intelligence from all Pravado modules:

- S38 Content Quality: Quality scores, performance
- S39 Content Rewrites: Content transformations
- S43 Press Releases: Release performance
- S44 Pitch Engine: Pitch analytics
- S45 Deliverability: Email metrics
- S46 Journalist Graph: Relationship data
- S47-49 Media Lists/Discovery/Enrichment: Journalist intel
- S50 Media Performance: Campaign metrics
- S52 Personas: Audience segments
- S53 Playbooks: Execution results
- S57-58 Crisis/Reputation: Brand health
- S59-60 Governance/Risk: Compliance and risk
- S61-62 Executive Dashboards: Strategic metrics
- S63 Board Reports: Governance insights
- S64 Investor Relations: Stakeholder content
- S65 Strategic Intelligence: Trend analysis
- S66 Intelligence Graph: Entity relationships
- S67-69 Scenarios: Future projections

### Downstream Systems (Consumers)

Narratives feed into:

- Executive dashboards
- Board presentations
- Investor communications
- Crisis response playbooks
- Strategic planning tools

## Performance Considerations

### Indexing

Optimized with B-tree and GIN indexes:

- Narrative type lookups
- Status filtering
- Date range queries
- Tag overlap queries
- Full-text search on titles

### Generation Optimization

- Parallel source data fetching
- Cached source aggregations
- Incremental section generation
- Background processing for large narratives

### Pagination

All list operations use cursor-based pagination with configurable limits (default 50).

## Security

### Row-Level Security

All tables enforce org_id isolation via RLS policies.

### Feature Flag

Protected by `ENABLE_UNIFIED_NARRATIVES` flag.

### Workflow Permissions

- Draft/Generate: Any team member
- Approve: Managers and above
- Publish: Directors and above
- Archive: Any team member

### Audit Trail

All operations logged with actor, timestamp, operation type, and metadata.

## Testing

### Unit Tests (99 tests)

Comprehensive service tests covering:

- Narrative CRUD operations
- Generation workflows
- Section management
- Insight extraction
- Delta computation
- Workflow state transitions
- Export operations
- Statistics computation
- Audit logging
- Edge cases and error handling

### E2E Tests

Full API integration tests for:

- Feature flag gating
- Complete narrative lifecycle
- Section operations
- Insight operations
- Workflow transitions
- Export functionality
- Statistics endpoints
- Audit log queries
- Error handling

## Dependencies

### External

- OpenAI API (narrative generation)
- Supabase (PostgreSQL storage)

### Internal Packages

- `@pravado/types`: Type definitions
- `@pravado/validators`: Zod schemas
- `@pravado/feature-flags`: Feature gating

## Configuration

### Environment Variables

```
OPENAI_API_KEY          - Required for narrative generation
```

### Feature Flag

```typescript
ENABLE_UNIFIED_NARRATIVES: true
```

## API Examples

### Create and Generate Narrative

```typescript
// Create narrative
const narrative = await fetch('/api/v1/unified-narratives', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Q4 2024 Executive Summary',
    narrativeType: 'executive',
    format: 'executive_brief',
    periodStart: '2024-10-01',
    periodEnd: '2024-12-31',
    sourceSystems: ['media_monitoring', 'competitive_intel'],
    targetAudience: ['board', 'c-suite'],
  }),
});

// Generate content
await fetch(`/api/v1/unified-narratives/${narrative.id}/generate`, {
  method: 'POST',
  body: JSON.stringify({
    temperature: 0.7,
    includeVisuals: true,
  }),
});
```

### Workflow Progression

```typescript
// Approve
await fetch(`/api/v1/unified-narratives/${id}/approve`, {
  method: 'POST',
  body: JSON.stringify({
    approvalNote: 'Reviewed by leadership team',
  }),
});

// Publish
await fetch(`/api/v1/unified-narratives/${id}/publish`, {
  method: 'POST',
  body: JSON.stringify({
    channels: ['email', 'portal'],
  }),
});

// Export
const { url } = await fetch(`/api/v1/unified-narratives/${id}/export`, {
  method: 'POST',
  body: JSON.stringify({ format: 'pdf' }),
}).then(r => r.json());
```

## Future Enhancements

### V3 Considerations

- Real-time streaming generation
- Collaborative editing
- Version history and comparison
- Template library
- Scheduled generation
- Multi-language support
- Custom section templates
- AI-suggested improvements
- Stakeholder feedback integration
- Distribution analytics

## Changelog

### V2.0.0 (S70)

- Initial cross-domain synthesis engine
- 7 narrative types, 5 output formats
- 30+ source system integration
- Section-level editing and regeneration
- Cross-system insight extraction
- Narrative delta computation
- Multi-format export (PDF, DOCX, PPTX, HTML, MD, JSON)
- Full workflow lifecycle
- Complete audit logging
- Dashboard UI with detail drawer
- 99 unit tests, comprehensive E2E tests
