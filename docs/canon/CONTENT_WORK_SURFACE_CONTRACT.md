# CONTENT WORK SURFACE CONTRACT

> **Status:** CANONICAL (V2 — AMENDED 2026-03-02)
> **Authority:** This document defines the content work surface contract. Supersedes V1 (2026-01-25).
> **Classification:** Active Implementation Specification
> **Last Updated:** 2026-03-02
> **Amendment Summary:** Removed mandatory TriPaneShell layout requirement (was incorrectly applied globally; TriPaneShell is Command Center-specific per product decision D022). Each view now uses a surface-appropriate layout. Added competitive moat requirements and AEO-first content quality doctrine per COMPETITIVE_INTELLIGENCE_2026.md.

---

## 1. Purpose & Scope

### 1.1 What This Contract Governs

This document defines the **V1 frozen contract** for the Content Work Surface. All implementations must conform to this specification. Any deviation requires a Canon Amendment PR.

**Governs:**
- Content pillar routes and navigation
- Work surface layout and component structure
- Canonical object UI bindings
- View requirements and interactions
- Authority metrics display
- CiteMind governance gates
- Cross-pillar integration points

### 1.2 What This Contract Forbids

The Content Work Surface is **NOT**:
- A generic AI writing tool (no chat-style drafting canvas)
- A social media scheduler clone (no time-slot publishing grid)
- A keyword stuffing engine (no density/frequency optimizers)
- A viral content generator (no "trending hooks" generators)
- A blog CMS replacement (no WYSIWYG-first editing)

**Any feature proposal resembling these patterns is canon-invalid.**

### 1.3 Contract Inheritance

This contract inherits all constraints from:
- `CONTENT_PILLAR_CANON.md` (Product definition — AUTHORITATIVE)
- `CONTENT_PILLAR_SYSTEM.md` (System model)
- `DS_v3_1_EXPRESSION.md` (Design tokens)
- `AUTOMATION_MODES_UX.md` (Manual/Copilot/Autopilot patterns)

**If any implementation detail below conflicts with CONTENT_PILLAR_CANON.md, the canon wins.**

---

## 2. Route Map

### 2.1 Content Pillar Routes (V1)

| Route | Component | Layout | Description |
|-------|-----------|--------|-------------|
| `/app/content` | `ContentWorkSurface` | Surface-appropriate (see §3.2) | Main work surface with tabbed views |
| `/app/content/calendar` | `ContentCalendarView` | Full-width | Multi-format calendar with themes |
| `/app/content/library` | `ContentLibraryView` | Filter sidebar + main grid | Asset library with filters |
| `/app/content/asset/[id]` | `ContentAssetEditor` | Two-pane + CiteMind drawer | Structured asset editor |
| `/app/content/brief/[id]` | `ContentBriefEditor` | Two-pane | Brief viewer/editor |
| `/app/content/insights` | `ContentInsightsView` | Full-width | Authority analytics |

### 2.2 API Route Handlers (Existing)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/content/items` | GET, POST | List/create content assets |
| `/api/content/briefs` | GET, POST | List/create content briefs |
| `/api/content/briefs/[id]` | GET, PATCH | Individual brief CRUD |
| `/api/content/briefs/generate` | POST | Generate brief from inputs |
| `/api/content/clusters` | GET | Topic clusters |
| `/api/content/gaps` | GET | Content opportunity gaps |
| `/api/content/quality/analyze` | POST | Quality analysis |

### 2.3 API Route Handlers (Required for V1)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/api/content/items/[id]` | GET, PATCH, DELETE | Individual asset CRUD |
| `/api/content/calendar` | GET | Calendar entries with cross-pillar |
| `/api/content/derivatives/[assetId]` | GET, POST | Derivative surfaces |
| `/api/content/authority-signals` | GET | Authority signal records |

---

## 3. Work Surface Layout Standard

### 3.1 Layout Philosophy (AMENDED D022)

**TriPaneShell is NOT mandated globally.** The TriPaneShell is the Command Center layout — it is appropriate for a command-and-intelligence hub where three simultaneous context streams are always relevant.

Content is a workflow-centric surface. Each view should use the layout that best serves its workflow, not a forced three-pane structure. Layout must be earned by the content's needs.

**Per D019 Layout Laws:**
- Width is earned by content, not assumed from container
- Whitespace separates semantic sections or is breathing room — no other purpose
- Cards are decision units (one action), not data containers
- Data shape determines layout — tables for tabular data, cards for decisions, KPI rows for metrics, charts for time-series

### 3.2 View-Specific Layout Specifications

| View | Layout | Rationale |
|------|--------|-----------|
| **Overview** | Full-width dashboard (no forced panes) | Authority metrics and proposals read as a strategic dashboard, not a work surface |
| **Library** | Two-pane: filter sidebar (280px) + main grid | Filters are always contextually relevant to the browsing task |
| **Calendar** | Full-width with top legend strip | Calendar grids need full horizontal space to be readable |
| **Asset Editor** | Two-pane: outline nav (240px) + editor; CiteMind intelligence panel slides in from right as overlay/drawer on demand | Editor needs full width; CiteMind panel is contextual, not always needed |
| **Brief Editor** | Two-pane: brief sections nav (240px) + brief content | Same principle as asset editor |
| **Insights** | Full-width dashboard | Charts and delta comparisons need full horizontal space |

**Important:** A view may use TriPaneShell if its specific workflow genuinely requires three simultaneous panels. The principle is fitness-for-purpose, not avoidance of TriPaneShell. It simply cannot be the default imposed on all views.

### 3.3 Responsive Breakpoints (All Views)

| Breakpoint | Behavior |
|------------|----------|
| Desktop (lg+) | Layout as specified per view above |
| Tablet (md-lg) | Collapse secondary panels to toggleable drawers |
| Mobile (-md) | Single panel with bottom navigation tabs |

### 3.4 Pillar Accent

Content pillar uses **Iris** accent (`brand-iris` / `#A855F7`):

```typescript
// From pillar-accents.ts
content: {
  bg: 'bg-brand-iris/5',
  bgHover: 'bg-brand-iris/10',
  solidBg: 'bg-brand-iris',
  text: 'text-brand-iris',
  border: 'border-brand-iris/20',
  borderHover: 'border-brand-iris/40',
  glow: 'shadow-brand-iris/20',
}
```

---

## 4. Canonical Objects & UI Binding

### 4.1 Content Asset (Primary Object)

**Database entity:** `content_items` (existing)

**UI Required Fields:**

| Field | Type | Display | Requirement |
|-------|------|---------|-------------|
| `id` | UUID | Hidden | Required |
| `title` | string | Prominent | Required |
| `contentType` | enum | Badge | Required |
| `status` | enum | Status badge | Required |
| `authorityIntent` | string | Subtitle | V1 Required |
| `citeMindStatus` | enum | Gate indicator | V1 Required |
| `entityAssociations` | string[] | Tag chips | V1 Required |
| `wordCount` | number | Metadata | Optional |
| `publishedAt` | timestamp | Metadata | Optional |
| `authorityScore` | number (0-100) | Metric tile | V1 Required |

**Status Values:**

| Status | Badge Color | Semantic |
|--------|-------------|----------|
| `draft` | `semantic-warning` | Work in progress |
| `review` | `brand-iris` | Awaiting approval |
| `approved` | `brand-cyan` | Ready to publish |
| `published` | `semantic-success` | Live |
| `archived` | `muted` | Inactive |

**CiteMind Status Values:**

| Status | Badge | Behavior |
|--------|-------|----------|
| `pending` | Gray dot | Analysis not run |
| `analyzing` | Cyan pulse | In progress |
| `passed` | Green checkmark | Eligible for publish |
| `warning` | Amber warning | Issues found, can proceed |
| `blocked` | Red X | Cannot publish until resolved |

### 4.2 Content Brief

**Database entity:** `content_briefs` (existing)

**UI Required Fields:**

| Field | Type | Display | Requirement |
|-------|------|---------|-------------|
| `id` | UUID | Hidden | Required |
| `title` | string | Prominent | Required |
| `status` | enum | Badge | Required |
| `targetKeyword` | string | Tag | Optional |
| `targetIntent` | enum | Badge | Required |
| `strategicObjective` | string | Section | V1 Required |
| `allowedAssertions` | string[] | Checklist | V1 Required |
| `requiredCitations` | string[] | Checklist | V1 Required |
| `derivativeMap` | object | Visual map | V1 Required |

### 4.3 Derivative Surface

**Database entity:** `content_derivatives` (new)

**UI Required Fields:**

| Field | Type | Display | Requirement |
|-------|------|---------|-------------|
| `id` | UUID | Hidden | Required |
| `parentAssetId` | UUID | Link to parent | Required |
| `surfaceType` | enum | Badge | Required |
| `content` | string | Preview | Required |
| `valid` | boolean | Status indicator | Required |

**Surface Types:**

| Type | Description | Pillar |
|------|-------------|--------|
| `pr_pitch_excerpt` | Pitch-ready excerpt | PR |
| `aeo_snippet` | AI-optimized snippet | SEO |
| `ai_summary` | AI-ready summary | Cross-pillar |
| `social_fragment` | Social post content | Cross-pillar |

**Invalidation Rule:**
When parent asset is edited, all derivatives show `valid: false` with warning and regeneration prompt.

### 4.4 Calendar Entry

**Database entity:** `content_calendar` (new)

**UI Required Fields:**

| Field | Type | Display | Requirement |
|-------|------|---------|-------------|
| `id` | UUID | Hidden | Required |
| `assetId` | UUID | Link | Required |
| `scheduledAt` | timestamp | Calendar position | Required |
| `campaign` | string | Lane grouping | Optional |
| `theme` | string | Color coding | Optional |
| `crossPillarDeps` | object[] | Dependency indicators | V1 Required |
| `automationMode` | enum | Mode badge | Required |

### 4.5 Authority Signal Record

**Database entity:** `content_authority_signals` (new)

**UI Required Fields:**

| Field | Type | Display | Requirement |
|-------|------|---------|-------------|
| `assetId` | UUID | Link | Required |
| `authorityContributionScore` | number (0-100) | Primary metric | Required |
| `citationEligibilityScore` | number (0-100) | Secondary metric | Required |
| `aiIngestionLikelihood` | number (0-100) | Secondary metric | Required |
| `crossPillarImpact` | number (0-100) | Secondary metric | Required |
| `competitiveAuthorityDelta` | number (-100 to 100) | Comparison metric | Required |
| `measuredAt` | timestamp | Time context | Required |

---

## 5. Views (Canon-Required)

### 5.1 Content Overview

**Route:** `/app/content` (default tab)

**Primary Interactions:**
- View authority contribution summary (primary KPI)
- See active themes with asset counts
- View AI ingestion readiness aggregate
- Access SAGE proposals for content actions
- Navigate to specific assets/briefs

**Layout:**
- **Left pane:** View tabs, quick filters, recent assets
- **Center pane:** Authority dashboard cards, active themes grid, proposals list
- **Right pane:** Cross-pillar hooks, AI status, quick insights

**Required Components:**
- `AuthorityDashboard` - Primary metrics display
- `ActiveThemesGrid` - Theme cards with asset counts
- `ContentProposalsList` - SAGE-generated proposals
- `CrossPillarHooks` - PR/SEO integration points

### 5.2 Content Library

**Route:** `/app/content/library` or `/app/content` with `?view=library`

**Primary Interactions:**
- Browse all content assets
- Filter by entity, theme, pillar, status
- Search by keyword/title
- View lifecycle and authority state
- See derivative visibility

**Layout:**
- **Left pane:** Filters panel (entity, theme, status, type)
- **Center pane:** Asset grid/list with density-adaptive display
- **Right pane:** Selected asset preview, quick actions

**Required Components:**
- `ContentFiltersPanel` - Multi-facet filtering
- `ContentAssetGrid` - Density-adaptive asset cards
- `ContentAssetCard` - Individual asset display
- `AssetPreviewPanel` - Quick view in right rail

**Density Levels (following ActionCard pattern):**

| Level | Card Count | Card Height | Content |
|-------|------------|-------------|---------|
| Comfortable | ≤12 | 180px | Full preview, all metrics |
| Standard | 13-24 | 120px | Title, status, key metric |
| Compact | 25+ | 48px | Row layout, title + status only |

### 5.3 Content Calendar

**Route:** `/app/content/calendar`

**Primary Interactions:**
- View multi-format calendar (week/month/quarter)
- See campaign/theme groupings
- Identify cross-pillar dependencies
- View automation mode indicators
- Drag-drop rescheduling (Copilot mode)

**Layout:**
- **Left pane:** Calendar navigation, theme legend, view controls
- **Center pane:** Calendar grid with asset entries
- **Right pane:** Selected day detail, dependencies, automation status

**Required Components:**
- `ContentCalendarGrid` - Main calendar display
- `CalendarEntryCard` - Individual entry with mode badge
- `ThemeLegend` - Campaign/theme color key
- `DependencyIndicator` - Cross-pillar dependency display

### 5.4 Asset Editor

**Route:** `/app/content/asset/[id]`

**Primary Interactions:**
- Edit structured content sections (NOT freeform)
- View inline CiteMind qualification feedback
- See entity grounding indicators
- Access revision history
- Generate/regenerate derivatives

**Layout:**
- **Left pane:** Section navigation, outline view
- **Center pane:** Structured editor with CiteMind inline
- **Right pane:** CiteMind status, entity associations, derivatives

**Required Components:**
- `StructuredContentEditor` - Section-based editing
- `CiteMindInlineIndicator` - Qualification feedback per section
- `EntityGroundingPanel` - Associated entities
- `DerivativePanel` - Generated surfaces with validity

**Critical Constraint:**
No chat-style AI canvas. Editor is **structured sections** with CiteMind feedback, not a "write anything" box.

### 5.5 Brief Editor

**Route:** `/app/content/brief/[id]`

**Primary Interactions:**
- View/edit brief components
- See strategic objective (SAGE-derived)
- Manage allowed assertions and required citations
- View derivative map
- Generate draft from brief

**Layout:**
- **Left pane:** Brief sections navigation
- **Center pane:** Brief content with validation
- **Right pane:** SAGE context, derivative map preview

**Required Components:**
- `BriefSectionsEditor` - Structured brief editing
- `AssertionChecklist` - Allowed assertions with validation
- `CitationChecklist` - Required citations
- `DerivativeMapPreview` - Visual derivative relationships

### 5.6 Insights & Optimization

**Route:** `/app/content/insights`

**Primary Interactions:**
- View authority deltas over time
- Identify citation readiness gaps
- Compare competitive authority
- See repurposing efficiency metrics
- Access optimization recommendations

**Layout:**
- **Left pane:** Time range, metric selection
- **Center pane:** Charts and delta displays
- **Right pane:** AI recommendations, gap alerts

**Required Components:**
- `AuthorityDeltaChart` - Time-series authority changes
- `CitationGapsPanel` - Citation readiness gaps
- `CompetitiveAuthorityPanel` - Competitive comparison
- `OptimizationRecommendations` - SAGE-driven suggestions

---

## 6. Metrics

### 6.1 Canon-Required Metrics

These metrics MUST appear in the Content Work Surface, even if initially mocked/placeholder.

| Metric | Description | Display Location |
|--------|-------------|------------------|
| **Authority Contribution Score** | 0-100, primary content KPI | Overview, Library cards, Asset detail |
| **Citation Eligibility Score** | 0-100, CiteMind readiness | Asset detail, Insights |
| **AI Ingestion Likelihood** | 0-100, AI discoverability | Asset detail, Insights |
| **Cross-Pillar Impact** | 0-100, PR+SEO reinforcement | Overview, Asset detail |
| **Competitive Authority Delta** | -100 to +100, vs competitors | Insights, Asset detail |

### 6.2 Metric Display Patterns

**Overview Dashboard:**
```
┌─────────────────────────────────────────────┐
│  AUTHORITY IMPACT                           │
├─────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │   73    │ │   +12   │ │   85%   │       │
│  │ Score   │ │ 7d Δ    │ │ AI Ready│       │
│  └─────────┘ └─────────┘ └─────────┘       │
└─────────────────────────────────────────────┘
```

**Asset Card (Comfortable Density):**
```
┌─────────────────────────────────────────────┐
│  Article Title Here                    [Pub]│
├─────────────────────────────────────────────┤
│  Authority: 73  │  Citation: 85  │  AI: 91 │
│  ───────────────────────────────────────── │
│  Entities: Brand, Product, Person           │
│  Theme: Q1 Campaign                         │
└─────────────────────────────────────────────┘
```

### 6.3 Metric Color Coding

| Score Range | Color | Semantic |
|-------------|-------|----------|
| 80-100 | `semantic-success` | Excellent |
| 60-79 | `brand-cyan` | Good |
| 40-59 | `semantic-warning` | Needs attention |
| 0-39 | `semantic-danger` | Critical |

---

## 7. Governance & Gating

### 7.1 CiteMind Qualification Gates

All content assets must pass CiteMind qualification before publishing.

| Gate | Condition | UI Behavior |
|------|-----------|-------------|
| **Claims verified** | All claims have sources | Block if unverified claims |
| **Entities grounded** | Assertions link to entities | Block if orphan assertions |
| **Citations present** | Required citations included | Block if missing citations |
| **Repetition intentional** | No spam patterns detected | Warn if repetition detected |

### 7.2 Gate Enforcement UI

**Blocked State:**
```
┌─────────────────────────────────────────────┐
│  🔴 CiteMind: BLOCKED                       │
├─────────────────────────────────────────────┤
│  Cannot publish until resolved:             │
│  • 2 unverified claims in section 3         │
│  • Missing required citation: [Source X]    │
│                                             │
│  [View Issues]  [Request Review]            │
└─────────────────────────────────────────────┘
```

**Warning State:**
```
┌─────────────────────────────────────────────┐
│  🟡 CiteMind: WARNING                       │
├─────────────────────────────────────────────┤
│  Issues found (can proceed with caution):   │
│  • Repetitive phrasing in section 2         │
│                                             │
│  [View Issues]  [Proceed Anyway]            │
└─────────────────────────────────────────────┘
```

**Passed State:**
```
┌─────────────────────────────────────────────┐
│  🟢 CiteMind: PASSED                        │
├─────────────────────────────────────────────┤
│  All governance checks passed.              │
│  Ready for publication.                     │
│                                             │
│  [Publish]                                  │
└─────────────────────────────────────────────┘
```

### 7.3 Derivative Invalidation Rules

| Parent Event | Derivative Behavior |
|--------------|---------------------|
| Parent edited | All derivatives marked `valid: false` |
| Parent status change | Derivatives re-validated |
| Parent deleted | Derivatives orphaned (warning state) |

**Invalidation UI:**
```
┌─────────────────────────────────────────────┐
│  ⚠️ DERIVATIVE OUTDATED                     │
├─────────────────────────────────────────────┤
│  Parent asset was modified.                 │
│  This derivative may no longer be accurate. │
│                                             │
│  [Regenerate]  [View Parent]  [Dismiss]     │
└─────────────────────────────────────────────┘
```

### 7.4 Automation Mode Ceilings (Content)

| Action | Manual | Copilot | Autopilot | V1 Default |
|--------|--------|---------|-----------|------------|
| Brief generation | Yes | Yes | No | Copilot |
| Draft creation | Yes | Yes | No | Copilot |
| Quality analysis | Yes | Yes | Yes | Autopilot |
| Derivative generation | Yes | Yes | No | Copilot |
| Publishing | Yes | No | No | Manual |
| Calendar scheduling | Yes | Yes | No | Copilot |
| Optimization suggestions | Yes | Yes | Yes | Autopilot |

**Hard Ceilings:**
- **Publishing** = Manual only (irreversible, brand-affecting)
- **Draft creation** = Copilot max (human must review)

---

## 8. Component Inventory

### 8.1 Reuse from Command Center

| Component | Source Path | Usage |
|-----------|-------------|-------|
| `TriPaneShell` | `components/command-center/TriPaneShell.tsx` | Main layout |
| `pillar-accents.ts` | `components/command-center/pillar-accents.ts` | Styling tokens |
| `modeStyles` | `components/command-center/pillar-accents.ts` | Mode badges |
| `surfaceTokens` | `components/command-center/pillar-accents.ts` | Surface colors |

### 8.2 Reuse from PR Work Surface

| Component | Source Path | Usage |
|-----------|-------------|-------|
| `ImpactStrip` | `components/pr-work-surface/components/ImpactStrip.tsx` | SAGE/EVI indicator |
| `ModeBadge` | `components/pr-work-surface/components/ImpactStrip.tsx` | Automation mode |
| `EVIIndicator` | `components/pr-work-surface/components/ImpactStrip.tsx` | Authority impact |

### 8.3 Reuse from UI Primitives

| Component | Source Path | Usage |
|-----------|-------------|-------|
| `Card` | `components/ui/card.tsx` | Container |
| `Badge` | `components/ui/badge.tsx` | Status/type indicators |
| `Tabs` | `components/ui/tabs.tsx` | View navigation |
| `Sheet` | `components/ui/sheet.tsx` | Detail drawers |
| `Dialog` | `components/ui/dialog.tsx` | Modals |
| `Progress` | `components/ui/progress.tsx` | Metric bars |
| `ScrollArea` | `components/ui/scroll-area.tsx` | Custom scrollbars |
| `HoverCard` | `components/ui/hover-card.tsx` | Quick previews |

### 8.4 Create New (Content-Specific)

| Component | Target Path | Purpose |
|-----------|-------------|---------|
| `ContentWorkSurfaceShell` | `components/content/ContentWorkSurfaceShell.tsx` | Main shell with tabs |
| `ContentOverviewView` | `components/content/views/ContentOverviewView.tsx` | Overview tab |
| `ContentLibraryView` | `components/content/views/ContentLibraryView.tsx` | Library tab |
| `ContentCalendarView` | `components/content/views/ContentCalendarView.tsx` | Calendar tab |
| `ContentInsightsView` | `components/content/views/ContentInsightsView.tsx` | Insights tab |
| `ContentAssetCard` | `components/content/components/ContentAssetCard.tsx` | Density-adaptive card |
| `ContentFiltersPanel` | `components/content/components/ContentFiltersPanel.tsx` | Filter controls |
| `AuthorityDashboard` | `components/content/components/AuthorityDashboard.tsx` | Metrics display |
| `CiteMindStatusIndicator` | `components/content/components/CiteMindStatusIndicator.tsx` | Gate status |
| `DerivativePanel` | `components/content/components/DerivativePanel.tsx` | Derivatives list |
| `StructuredContentEditor` | `components/content/components/StructuredContentEditor.tsx` | Section editor |
| `ContentEmptyState` | `components/content/components/ContentEmptyState.tsx` | Empty states |
| `ContentLoadingSkeleton` | `components/content/components/ContentLoadingSkeleton.tsx` | Loading states |

### 8.5 Component File Structure

```
apps/dashboard/src/components/content/
├── index.ts                          # Barrel exports
├── types.ts                          # Content-specific types
├── ContentWorkSurfaceShell.tsx       # Main shell
├── views/
│   ├── ContentOverviewView.tsx
│   ├── ContentLibraryView.tsx
│   ├── ContentCalendarView.tsx
│   └── ContentInsightsView.tsx
└── components/
    ├── ContentAssetCard.tsx
    ├── ContentFiltersPanel.tsx
    ├── AuthorityDashboard.tsx
    ├── CiteMindStatusIndicator.tsx
    ├── DerivativePanel.tsx
    ├── StructuredContentEditor.tsx
    ├── ContentEmptyState.tsx
    └── ContentLoadingSkeleton.tsx
```

---

## 9. Data Contracts (Frontend)

### 9.1 TypeScript Interfaces

```typescript
// types.ts

export type ContentStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type ContentType = 'blog_post' | 'long_form' | 'landing_page' | 'guide' | 'case_study';
export type CiteMindStatus = 'pending' | 'analyzing' | 'passed' | 'warning' | 'blocked';
export type DerivativeType = 'pr_pitch_excerpt' | 'aeo_snippet' | 'ai_summary' | 'social_fragment';

export interface ContentAsset {
  id: string;
  title: string;
  contentType: ContentType;
  status: ContentStatus;
  authorityIntent: string;
  citeMindStatus: CiteMindStatus;
  entityAssociations: string[];
  wordCount?: number;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
  authoritySignals: AuthoritySignals;
}

export interface AuthoritySignals {
  authorityContributionScore: number;       // 0-100
  citationEligibilityScore: number;         // 0-100
  aiIngestionLikelihood: number;            // 0-100
  crossPillarImpact: number;                // 0-100
  competitiveAuthorityDelta: number;        // -100 to 100
  measuredAt: string;
}

export interface ContentBrief {
  id: string;
  title: string;
  status: 'draft' | 'approved' | 'in_progress' | 'completed';
  targetKeyword?: string;
  targetIntent: 'informational' | 'navigational' | 'commercial' | 'transactional';
  strategicObjective: string;
  allowedAssertions: string[];
  requiredCitations: string[];
  derivativeMap: DerivativeMap;
  createdAt: string;
  updatedAt: string;
}

export interface DerivativeMap {
  surfaces: DerivativeSurface[];
  expectedDerivatives: DerivativeType[];
}

export interface DerivativeSurface {
  id: string;
  parentAssetId: string;
  surfaceType: DerivativeType;
  content: string;
  valid: boolean;
  generatedAt: string;
}

export interface ContentCalendarEntry {
  id: string;
  assetId: string;
  asset: ContentAsset;
  scheduledAt: string;
  campaign?: string;
  theme?: string;
  crossPillarDeps: CrossPillarDependency[];
  automationMode: 'manual' | 'copilot' | 'autopilot';
}

export interface CrossPillarDependency {
  pillar: 'pr' | 'seo';
  type: 'blocks' | 'blocked_by' | 'syncs_with';
  entityId: string;
  entityLabel: string;
}

export interface ContentGap {
  keyword: string;
  intent?: string;
  seoOpportunityScore: number;
  existingContentCount: number;
  suggestedAction: string;
}

export interface ContentCluster {
  id: string;
  name: string;
  description?: string;
  topics: { id: string; name: string }[];
  representativeContent: ContentAsset[];
}
```

### 9.2 SWR Hook Naming Conventions

```typescript
// hooks/useContentData.ts

// List hooks (plural noun)
export function useContentItems(params?: ContentItemsParams): SWRResponse<ContentAsset[]>;
export function useContentBriefs(params?: ContentBriefsParams): SWRResponse<ContentBrief[]>;
export function useContentGaps(params?: ContentGapsParams): SWRResponse<ContentGap[]>;
export function useContentClusters(params?: ContentClustersParams): SWRResponse<ContentCluster[]>;
export function useContentCalendar(params?: ContentCalendarParams): SWRResponse<ContentCalendarEntry[]>;

// Single item hooks (singular noun + Id)
export function useContentItem(id: string): SWRResponse<ContentAsset>;
export function useContentBrief(id: string): SWRResponse<ContentBrief>;

// Mutation hooks (action verb)
export function useCreateContentItem(): SWRMutationResponse<ContentAsset>;
export function useUpdateContentItem(id: string): SWRMutationResponse<ContentAsset>;
export function useGenerateBrief(): SWRMutationResponse<ContentBrief>;
export function useAnalyzeQuality(assetId: string): SWRMutationResponse<QualityAnalysis>;
```

### 9.3 API Response Wrapper

All API responses use the standard wrapper:

```typescript
// Success
{ success: true, data: T }

// Error
{ success: false, error: { code: string, message: string } }
```

### 9.4 Error/Empty/Loading Patterns

**Loading State:**
```typescript
function ContentLoadingSkeleton({ density }: { density: DensityLevel }) {
  const skeletonCount = density === 'compact' ? 8 : density === 'standard' ? 5 : 3;
  const skeletonHeight = density === 'compact' ? 'h-12' : density === 'standard' ? 'h-24' : 'h-44';

  return (
    <div className="space-y-3">
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div key={i} className={`${skeletonHeight} bg-slate-2 rounded-lg animate-pulse`} />
      ))}
    </div>
  );
}
```

**Empty State:**
```typescript
function ContentEmptyState({ view }: { view: 'library' | 'calendar' | 'briefs' }) {
  const messages = {
    library: { title: 'No content yet', subtitle: 'Create your first content asset to get started' },
    calendar: { title: 'Calendar is empty', subtitle: 'Schedule content to see it here' },
    briefs: { title: 'No briefs created', subtitle: 'Generate a brief to plan content strategically' },
  };

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <div className="w-12 h-12 mb-3 rounded-xl bg-slate-2 flex items-center justify-center">
        {/* Icon */}
      </div>
      <p className="text-sm text-white/70 font-medium">{messages[view].title}</p>
      <p className="text-xs text-white/40 mt-1">{messages[view].subtitle}</p>
    </div>
  );
}
```

**Error State:**
```typescript
function ContentErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
      <h4 className="text-sm font-semibold text-semantic-danger">Failed to load content</h4>
      <p className="text-xs text-white/55 mt-1">{error.message}</p>
      <button onClick={onRetry} className="mt-3 text-xs text-brand-iris hover:underline">
        Try again
      </button>
    </div>
  );
}
```

---

## 9B. Competitive Moat Requirements (ADDED 2026-03-02)

These requirements are derived from COMPETITIVE_INTELLIGENCE_2026.md and represent the minimum feature set needed to establish and defend Pravado's content moats. They are non-negotiable for V2.

### 9B.1 Moat 1 — Citation-Worthiness as the Primary Quality Metric

The Content Work Surface must treat **AEO citation potential** as the primary content quality metric, not NLP term coverage, word count, or keyword density. This directly contradicts every legacy content tool and defines Pravado's differentiation.

**Required expressions:**
- CiteMind score must be visually primary on every content asset card — more prominent than word count or publish date
- Content Editor must include passage-level AEO guidance: entity-rich definitions, direct Q&A formatting, structured data recommendations — this is the writing feedback layer that replaces NLP term highlighting
- Before publishing, the CiteMind gate must show the citation potential score alongside the governance pass/fail status
- Empty state for new content must frame the creation task as "building an authority asset" not "writing a blog post"

### 9B.2 Moat 2 — Cross-Pillar Attribution Visible in Content

Content decisions must visibly connect to PR and AEO outcomes. This is the feature no competitor can replicate.

**Required expressions:**
- Every content asset must display its **Cross-Pillar Impact** score showing PR contribution and AEO citation lift
- SAGE briefs must show the competitive gap they're closing ("CompetitorX is cited 134x/week on this topic; you are not. Closing this gap: +8–12 EVI pts.")
- After publishing, CiteMind must update the asset's citation tracking within 7–14 days and show which AI engines have cited the piece
- The ImpactStrip must always display the EVI delta that publishing this content would contribute

### 9B.3 Moat 3 — Brief → Draft → Derivative Pipeline

Every content asset must be structured to produce cross-pillar derivatives automatically. This is structural reuse, not manual repurposing — and it's a capability no single-pillar tool can offer.

**Required expressions:**
- Brief generation must produce a derivative map showing: PR pitch excerpt targets, AEO snippet targets, AI-ready summary, social fragments
- The editor must show derivative status in a right-rail panel (or accessible drawer): which derivatives exist, which are stale, which need regeneration
- Derivative generation must be a one-click Copilot action per asset — not a separate workflow
- PR pitch excerpts must be directly linkable to the Pitches pipeline in the PR surface

### 9B.4 Moat 4 — AEO-Optimized Editor (Not a Generic Rich Text Editor)

The Asset Editor must be purpose-built for AEO citation-worthiness, not a standard rich text editor with AI suggestions bolted on.

**Required expressions:**
- Passage-level CiteMind feedback: each paragraph/section gets a citation readiness indicator, not just the whole document
- Structured sections enforced: every long-form asset has defined sections (Introduction, Entity Definition, Evidence, FAQ, Related Concepts) — these are the structural units AI engines extract from
- FAQ section must be a first-class editor component with schema markup generation
- Entity grounding panel shows which entities this passage reinforces and their current Ring position in the Entity Map

### 9B.5 Moat 5 — SAGE Proposals Integrated, Not Separate

SAGE content proposals must be surfaced in the library and overview views, not in a separate "briefs" area that users have to navigate to. The insight must come to the user.

**Required expressions:**
- SAGE proposal cards in the Overview must show the competitive gap, estimated EVI impact, and a one-click "Create from Brief" action
- In the Library view, assets with available SAGE optimization recommendations should show an indicator badge
- SAGE must provide at least one content proposal per active topic cluster per week (automation via AUTOMATE in Autopilot mode)

## 10. Non-Goals / Drift Guardrails

### 10.1 Explicit Non-Goals

The Content Work Surface will **NEVER**:

| Anti-Pattern | Why Prohibited |
|--------------|----------------|
| **Social scheduler clone** | Timing ≠ authority; volume focus violates canon |
| **Keyword stuffing interface** | Density optimization is spam, not authority |
| **Viral content generator** | Trending hooks ≠ durable authority |
| **Chat-style AI writing** | Unstructured generation bypasses CiteMind |
| **Generic CMS replacement** | Pravado is authority infrastructure, not a blog editor |
| **Output volume metrics** | Word count/frequency are explicitly non-goals per canon |

### 10.2 CI Guardrails

The following CI checks must pass for Content Work Surface changes:

| Check | Script | Validates |
|-------|--------|-----------|
| `check-content-no-chat-canvas.mjs` | Content components | No freeform AI chat patterns |
| `check-content-citemind-gates.mjs` | Publish flows | CiteMind gate enforcement |
| `check-content-authority-metrics.mjs` | Display components | Authority metrics present |
| `check-content-structured-editor.mjs` | Editor components | Section-based, not freeform |

### 10.3 Code Review Checklist

Before merging Content Work Surface changes:

- [ ] No chat-style AI canvas introduced
- [ ] No social scheduler patterns
- [ ] No keyword density/frequency optimization
- [ ] CiteMind gates enforced on publish
- [ ] Authority metrics displayed (even if mocked)
- [ ] Derivative invalidation on parent edit
- [ ] Mode ceilings respected (no auto-publish)
- [ ] Design tokens used (no hardcoded hex)
- [ ] Iris accent consistently applied
- [ ] Empty/loading/error states implemented

---

## 11. Impact Strip Requirement

All Content surfaces MUST display the **Impact Strip** (adapted from PR pillar):

```
┌─────────────────────────────────────────────────────────────────┐
│  SAGE: Authority │ EVI: +2.3 Visibility ↑ │ Mode: Copilot 🤖   │
└─────────────────────────────────────────────────────────────────┘
```

**Display Locations:**
- Overview dashboard header
- Library view header
- Asset detail header
- Calendar entry cards

**Components to import:**
- `SAGETag` from `pr-work-surface/components/ImpactStrip.tsx`
- `EVIIndicator` from `pr-work-surface/components/ImpactStrip.tsx`
- `ModeBadge` from `pr-work-surface/components/ImpactStrip.tsx`

---

## 12. Compliance Checklist (V1)

V1 Content Work Surface MUST satisfy:

- [ ] Layout is surface-appropriate per §3.2 (NOT forced TriPaneShell)
- [ ] Iris (`brand-iris`) accent consistently applied
- [ ] Overview view with authority dashboard
- [ ] Library view with density-adaptive cards
- [ ] Calendar view with cross-pillar dependencies
- [ ] Asset editor with structured sections (no chat)
- [ ] Brief editor with assertion/citation checklists
- [ ] Insights view with authority metrics
- [ ] CiteMind status displayed on all assets
- [ ] CiteMind gates enforce publish blocking
- [ ] Derivative panel shows validity state
- [ ] Impact Strip displayed on key surfaces
- [ ] Empty/loading/error states implemented
- [ ] Mode badges on automation-eligible actions
- [ ] No hardcoded hex colors (use DS tokens)
- [ ] No chat-style AI canvas anywhere

---

## 13. Governance

### 13.1 Contract Authority

This document defines the V1 frozen contract. Any implementation that deviates requires a Canon Amendment PR with:
1. Justification for deviation
2. Product review sign-off
3. Update to this contract document

### 13.2 Amendment Process

To modify this contract:
1. Create PR with proposed changes
2. Tag as `canon-amendment`
3. Require product owner approval
4. Update revision history

---

## 14. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-25 | 1.0 | Initial V1 Content Work Surface Contract |
| 2026-03-02 | 2.0 | Removed mandatory TriPaneShell (D022); Added competitive moat requirements §9B; Added view-specific layout specs §3.2; Updated amendment metadata |
