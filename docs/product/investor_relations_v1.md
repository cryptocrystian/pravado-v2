# Investor Relations Pack & Earnings Narrative Engine V1

**Sprint**: S64
**Status**: Complete
**Feature Flag**: `ENABLE_INVESTOR_RELATIONS`

## Overview

The Investor Relations Pack & Earnings Narrative Engine automates the creation of investor-ready communications by aggregating data from upstream PR, content, and media systems (S38-S63). It generates comprehensive packs for quarterly earnings, annual reviews, investor days, board updates, and fundraising rounds.

## Key Features

### 1. Pack Management
- **Create Packs**: Define investor packs with title, format, audience, and reporting period
- **Multiple Formats**: Support for quarterly earnings, annual review, investor day, board update, fundraising round, and custom formats
- **Audience Targeting**: Configure content for institutional investors, board of directors, financial analysts, or internal executives
- **Workflow States**: Draft → Generating → Review → Approved → Published → Archived

### 2. AI-Powered Content Generation
- **Section Generation**: Automatically generate content sections based on pack format
- **Data Aggregation**: Pull insights from media performance, content quality, competitor intelligence, and other upstream systems
- **Tone Customization**: Professional, formal, or executive writing styles
- **Length Control**: Brief, standard, or comprehensive content generation

### 3. Section Types
- Executive Summary
- Highlights / Lowlights
- KPI Overview
- Financial Summary
- Market Context
- Competition / Competitive Landscape
- Strategic Initiatives
- Product Roadmap
- Forward Guidance
- Risk Factors
- Year in Review
- Company Overview
- Use of Funds
- Appendix
- Custom

### 4. Q&A Engine
- **Auto-Generation**: Generate anticipated investor questions with prepared answers
- **Category Classification**: Financial, strategic, operational, market, product, competitive, risk, governance, ESG
- **Confidence Scoring**: AI confidence level for each generated answer
- **Approval Workflow**: Draft → Approved status for Q&A entries
- **Usage Tracking**: Track how often each Q&A is used

### 5. Audit Trail
- Complete activity logging for all pack actions
- Track section generation/regeneration events
- Record token usage and generation duration
- User attribution for all changes

## Architecture

### Database Schema

```
investor_packs (main pack table)
├── investor_pack_sections (generated content sections)
├── investor_pack_sources (data source references)
├── investor_qna (Q&A entries)
└── investor_pack_audit_log (activity trail)
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/investor-relations/packs` | Create new pack |
| GET | `/api/v1/investor-relations/packs` | List packs with filters |
| GET | `/api/v1/investor-relations/packs/:id` | Get pack with sections and Q&As |
| PUT | `/api/v1/investor-relations/packs/:id` | Update pack |
| DELETE | `/api/v1/investor-relations/packs/:id` | Delete pack |
| POST | `/api/v1/investor-relations/packs/:id/generate` | Generate pack content |
| PUT | `/api/v1/investor-relations/packs/:id/sections/:sectionId` | Update section |
| POST | `/api/v1/investor-relations/packs/:id/sections/:sectionId/regenerate` | Regenerate section |
| POST | `/api/v1/investor-relations/packs/:id/qnas` | Create Q&A |
| PUT | `/api/v1/investor-relations/packs/:id/qnas/:qnaId` | Update Q&A |
| DELETE | `/api/v1/investor-relations/packs/:id/qnas/:qnaId` | Delete Q&A |
| POST | `/api/v1/investor-relations/packs/:id/qnas/:qnaId/approve` | Approve Q&A |
| POST | `/api/v1/investor-relations/packs/:id/qnas/generate` | Generate Q&As |
| POST | `/api/v1/investor-relations/packs/:id/approve` | Approve pack |
| POST | `/api/v1/investor-relations/packs/:id/publish` | Publish pack |
| POST | `/api/v1/investor-relations/packs/:id/archive` | Archive pack |
| GET | `/api/v1/investor-relations/packs/:id/audit-logs` | Get audit logs |
| GET | `/api/v1/investor-relations/stats` | Get statistics |

## Usage

### Creating a Pack

```typescript
import { createPack } from '@/lib/investorRelationsApi';

const pack = await createPack({
  title: 'Q4 2024 Investor Pack',
  format: 'quarterly_earnings',
  primaryAudience: 'investors',
  periodStart: '2024-10-01T00:00:00.000Z',
  periodEnd: '2024-12-31T23:59:59.999Z',
  fiscalQuarter: 'Q4',
  fiscalYear: 2024,
  tone: 'professional',
  targetLength: 'comprehensive',
});
```

### Generating Content

```typescript
import { generatePack } from '@/lib/investorRelationsApi';

const result = await generatePack(packId);
// Returns: { pack, sections }
```

### Managing Q&A

```typescript
import { generateQnAs, approveQnA } from '@/lib/investorRelationsApi';

// Generate 5 Q&As
const qnas = await generateQnAs(packId, 5);

// Approve a Q&A
const approved = await approveQnA(packId, qnaId);
```

## UI Components

| Component | Description |
|-----------|-------------|
| `InvestorPackStatsCard` | Stats overview card |
| `InvestorPackHeader` | Pack details and actions |
| `InvestorPackSectionCard` | Section display with editing |
| `InvestorQnACard` | Q&A entry with approval workflow |
| `InvestorPackListItem` | Pack list view item |
| `InvestorPackAuditLogComponent` | Activity trail display |
| `CreateInvestorPackDialog` | Create pack modal |

## Dashboard Pages

- `/app/exec/investors` - Main dashboard with pack list and stats
- `/app/exec/investors/[id]` - Pack detail page with sections, Q&A, and activity

## Data Sources

The engine aggregates data from these upstream systems:

| System | Data Used |
|--------|-----------|
| S52: Media Performance | Mention counts, sentiment scores |
| S53: Journalist Discovery | Media coverage insights |
| S54: Journalist Timeline | Relationship history |
| S55: Journalist Enrichment | Contact engagement data |
| S56: Audience Personas | Target audience insights |
| S57: Competitive Intelligence | Market positioning |
| S58-S63: Various | Additional contextual data |

## Configuration

### Default Sections by Format

**Quarterly Earnings**:
- Executive Summary
- Highlights
- Lowlights
- KPI Overview
- Financial Summary
- Market Context
- Forward Guidance

**Annual Review**:
- Executive Summary
- Year in Review
- Highlights
- Lowlights
- KPI Overview
- Financial Summary
- Market Context
- Strategic Initiatives
- Forward Guidance

**Investor Day**:
- Executive Summary
- Company Overview
- Market Context
- Strategic Initiatives
- Product Roadmap
- Competitive Landscape

**Board Update**:
- Executive Summary
- KPI Overview
- Highlights
- Lowlights
- Strategic Initiatives
- Risk Factors

**Fundraising Round**:
- Executive Summary
- Market Context
- Product Roadmap
- Competitive Landscape
- Financial Summary
- Use of Funds

## Security

- Row-Level Security (RLS) enabled on all tables
- Organization-scoped data access
- User attribution on all mutations
- Audit logging for compliance

## Future Enhancements (V2)

- PDF/PowerPoint export
- Template library
- Collaborative editing
- Version comparison
- Scheduled publishing
- Distribution tracking
- Analytics dashboard
