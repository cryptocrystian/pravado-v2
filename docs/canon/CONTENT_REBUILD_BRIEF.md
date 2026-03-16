# CONTENT SURFACE REBUILD BRIEF
**Status:** ACTIVE — IMPLEMENTATION READY
**Version:** 1.0
**Date:** 2026-03-02
**Audience:** Claude Code, Engineering, Product
**Supersedes:** Any prior Content surface implementation (current `/app/content` is pre-contract prototype — rip and replace)

---

## 0. CRITICAL CONTEXT — READ BEFORE BUILDING

### What Exists Now (And Why It Must Be Replaced)

The current `/app/content` implementation is a pre-contract placeholder that predates the CONTENT_PILLAR_CANON.md and CONTENT_WORK_SURFACE_CONTRACT.md. It is a generic document management UI with CMS patterns — not an authority intelligence surface. It cannot be iterated into the correct architecture; it must be rebuilt from scratch.

**What the current surface is:**
- Generic document grid with status filters
- CiteMind scores shown as metadata on cards (secondary, not primary)
- SAGE briefs in a left rail (correct pattern, wrong prominence)
- No three-mode differentiation
- No ImpactStrip
- No AEO citation guidance in editor
- No derivative pipeline
- No cross-pillar attribution visible anywhere

**What it needs to be:**
An AEO-first content intelligence system where citation-worthiness is the primary quality signal, SAGE proposals drive the workflow, and every content asset is treated as an authority infrastructure investment — not a blog post.

### Canon Hierarchy for This Build

Consult these documents in this order when any ambiguity arises:

1. `CONTENT_PILLAR_CANON.md` — product truth
2. `CONTENT_WORK_SURFACE_CONTRACT.md v2.0` — implementation spec (includes D022 layout amendments and D023 moat requirements)
3. `COMPETITIVE_INTELLIGENCE_2026.md` — competitive context for feature decisions
4. `DECISIONS_LOG.md` D018–D023 — specific implementation constraints
5. `DS_v3_1_EXPRESSION.md` + `DS_v3_PRINCIPLES.md` — design system
6. `MODE_UX_ARCHITECTURE.md` — mode behavior
7. `AUTOMATION_MODES_UX.md` — automation governance

---

## 1. WHAT WE ARE BUILDING

### The One-Line Description
> A content authority system that shows you what to create, guides you to make it citation-worthy, and proves the impact across PR, AEO, and your EVI score.

### The User Mental Model We're Creating
Users should experience Pravado Content as fundamentally different from any content tool they've used:

- **Every session starts with strategic context**: What needs to be created, why, and what it will do to EVI. Never a blank slate.
- **Quality is measured by citation potential**: The primary number on every piece of content is not word count or SEO score — it's CiteMind score (citation eligibility).
- **Creating content is building competitive moats**: The language, the framing, the SAGE briefs — all of it frames content creation as authority infrastructure investment, not content production volume.
- **The platform connects the dots**: I publish this guide → it gets cited in ChatGPT → that cite is attributed here → my EVI goes up → SAGE knows to pitch TechCrunch next. The causal chain is visible.

### The Three Questions Every View Must Answer

Before building any view, ask:
1. **What decision does the user need to make here?** (Design for the decision, not the data)
2. **How does this view increase durable authority?** (If it can't answer this, it doesn't belong)
3. **Where is the cross-pillar connection visible?** (PR, AEO, EVI — always contextually present)

---

## 2. VIEW SPECIFICATIONS

### 2.1 Overview (`/app/content`)

**Purpose:** Strategic command. Show what matters, what's urgent, and what to create next.

**Layout:** Full-width dashboard. No forced panes.

**ImpactStrip (required at top):**
```
│ SAGE: Content Authority │ EVI +2.3 Visibility ↑ │ Mode: Copilot 🤖 │
```

**Above the fold (three zones):**

**Zone 1 — Authority Status (left third):**
- Primary metric: Overall CiteMind score (large, prominent, with 30-day trend arrow)
- Three sub-metrics in a row: Citation Eligibility avg, AI Ingestion Likelihood avg, Cross-Pillar Impact avg
- Color coding per D023: 80-100 success green, 60-79 cyan, 40-59 warning amber, 0-39 danger red

**Zone 2 — SAGE Action Queue (center third):**
- Top 3 SAGE content proposals as cards, each showing:
  - Title / type (Guide, Article, Report, Comparison)
  - Priority badge (CRITICAL / HIGH / MEDIUM)
  - The competitive gap in plain language: "CompetitorX cited 134x/week on this topic. You: 0."
  - Estimated EVI impact: "+8–12 pts"
  - CTA: "Create from Brief →" (one-click)
- "See all proposals →" link

**Zone 3 — Active Content Status (right third):**
- In Progress count with quick links to each draft
- Published this month count
- Top CiteMind score this month (the best-performing piece)
- "Needs Attention" count (CiteMind warnings/blocks, stale derivatives)

**Below the fold:**

**Active Themes Strip:** Horizontal scrollable row of theme cards showing campaign name, asset count, aggregate CiteMind score, and trend. Clicking opens Library filtered by theme.

**Cross-Pillar Activity Feed:** Recent events connecting Content to PR and SEO:
- "TechCrunch coverage boosted AI Marketing Tools cluster CiteMind +4.2 pts"
- "Enterprise AEO Guide published → 3 new ChatGPT citations detected"
- "PR pitch sent for this guide — coverage would add +1.8 EVI pts if placed"

---

### 2.2 Library (`/app/content/library` or `?view=library`)

**Purpose:** Browse, filter, and assess the content asset portfolio as authority infrastructure.

**Layout:** Two-pane. Left filter sidebar (280px, collapsible to 40px icon state). Right: main asset grid.

**Filter Sidebar:**
- Search bar (title search)
- Status tabs: All / In Progress / Published / Review / Archived
- Content type: Article / Guide / Report / Comparison / All
- CiteMind status: All / Passed / Warning / Blocked / Pending
- Theme/Campaign (multi-select from org themes)
- Sort: CiteMind Score ↓ / Date Updated ↓ / Cross-Pillar Impact ↓

**Asset Grid (density-adaptive per contract §5.2):**

At **comfortable density** (≤12 assets), each card shows:
```
┌──────────────────────────────────────────────────────┐
│  [Type badge]  [Status badge]              [CiteMind]│
│                                                  88  │
│  The Complete Guide to AI Visibility in 2026         │
│  Authority intent: Establish entity authority for    │
│  "AEO" and "AI citation optimization" topic cluster  │
├──────────────────────────────────────────────────────┤
│  Citation Eligibility: 91  │  AI Ingestion: 87       │
│  Cross-Pillar Impact: +2.1 EVI pts                   │
├──────────────────────────────────────────────────────┤
│  Entities: Brand  AEO Strategy  Enterprise           │
│  3 derivatives active  │  Feb 18  │  3,200 words     │
│  [Edit]  [View Derivatives]  [SAGE Optimize]         │
└──────────────────────────────────────────────────────┘
```

CiteMind score in top-right corner is the visual anchor — it should be large (text-2xl), colored by score range, the first thing the eye lands on.

At **standard density** (13-24 assets): Title + CiteMind score + status + key action.
At **compact density** (25+): Row layout — title, CiteMind score dot, status badge, updated date.

**SAGE Optimize badge:** Assets with available SAGE optimization recommendations show a subtle `[↑ Optimize]` badge. Clicking opens the SAGE recommendation in a side drawer without leaving the library.

---

### 2.3 Asset Editor (`/app/content/asset/[id]`)

**Purpose:** Create and refine a citation-worthy authority asset with inline guidance.

**Layout:** Two-pane primary. Left outline nav (240px). Right: editor (flex-1). CiteMind intelligence panel slides in from right as a drawer (does not shrink editor).

**Outline Nav (left, 240px):**
- Section list for the current document (editable section titles)
- Per-section CiteMind indicator: green dot (citation-ready), amber dot (needs work), red dot (blocked)
- Section reordering via drag handle
- "+ Add Section" at bottom
- At top: Document-level CiteMind score (prominent)

**Editor (center, full remaining width):**

Top header bar:
```
│ [Back to Library]  Enterprise AEO Guide           [Save]  [Preview]  │
│ SAGE Brief: "Close CompetitorX's 48-pt gap in Enterprise AEO"         │
```

The editor is **section-based, not freeform**. Each section is a structured unit:

**Section component anatomy:**
```
┌─────────────────────────────────────────────────────────┐
│ ◎ Introduction                        CiteMind: 72 ⚠️  │
├─────────────────────────────────────────────────────────┤
│ [Rich text editor for this section]                     │
│                                                         │
│ [Type here — write a direct, entity-rich introduction   │
│  that defines the core concept AI engines will cite]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
  ↳ CiteMind feedback: "Add a direct definition of 'AEO'
     as a named entity. Perplexity cites definition-first
     passages 3.1x more than narrative openers."
```

**Enforced section types for long-form assets:**
1. Introduction (with entity definition requirement)
2. Core Concept / Evidence sections (1–N, user-titled)
3. FAQ (first-class component — see below)
4. Related Concepts (structured entity reinforcement)

**FAQ Section Component (special):**
- Each FAQ entry is structured: Question + Direct Answer (≤2 sentences, AEO-optimized)
- Schema markup generated automatically for each entry (JSON-LD preview available)
- CiteMind scores each Q&A pair individually
- "Add FAQ from SAGE" button pulls SAGE-suggested questions for the topic cluster

**AI Assist (Copilot mode only):**
- Inline "Rewrite for AEO →" button on any section
- AI rewrites the passage for passage-level citation readiness
- Always shows the original alongside the suggestion (diff view)
- User approves or rejects — never auto-applies

**CiteMind Drawer (slides in from right, triggered by clicking section indicator or CiteMind score):**
- Document-level scores: Citation Eligibility, AI Ingestion Likelihood, Competitive Gap
- Section-level breakdown: which sections are citation-ready, which need work
- Specific actionable guidance per section
- Entity grounding: which entities are being reinforced and their Ring status
- Publish gate status with clear blockers listed

---

### 2.4 Calendar (`/app/content/calendar`)

**Purpose:** Orchestration view — shows content as part of a coordinated cross-pillar execution timeline, not just a posting schedule.

**Layout:** Full-width. Top: filters/legend strip. Main: calendar grid.

**Top Strip:**
- Week / Month / Quarter toggle
- Theme filter (show all or filter by campaign)
- Pillar filter (show Content only / show cross-pillar dependencies)
- Mode legend: AUTO badge (cyan) / COPILOT badge (purple) / MANUAL badge (slate)

**Calendar Grid:**
- Each day column shows content items as cards
- Cards are compact but show: Title (truncated), CiteMind score dot, automation mode badge, status badge
- Cross-pillar dependency indicators: a PR dependency shows a blue PR badge; an SEO trigger shows a cyan SEO badge
- Hovering a dependency badge shows: "Blocked by: TechCrunch pitch pending" or "Triggers: FAQ schema deploy on publish"

**Selected item detail panel (appears on click, slides in from right without breaking calendar layout):**
- Full asset info
- Dependencies expanded
- SAGE rationale for this timing ("Publishing this week closes a gap before CompetitorX's content refresh cycle")
- Automation mode selector (for Copilot-eligible items)

---

### 2.5 Brief Editor (`/app/content/brief/[id]`)

**Purpose:** Review, refine, and approve a SAGE-generated content brief before drafting begins.

**Layout:** Two-pane. Left: brief sections nav. Right: brief content.

**Brief sections (nav + content):**
1. **Strategic Objective** — SAGE-derived, editable; shows the competitive gap and EVI opportunity
2. **Target Entities** — which entities this brief reinforces; links to Entity Map ring position
3. **Allowed Assertions** — the claims this piece can make (cite-able, entity-grounded)
4. **Required Citations** — sources that must be referenced
5. **Structural Outline** — enforced section structure for the resulting asset
6. **Derivative Map** — what cross-pillar derivatives will be generated (PR excerpt target, AEO snippet target, AI summary, social fragments)
7. **Competitive Context** — CompetitorX gap visualization specific to this topic

**Actions bar (bottom):**
- "Generate Draft →" (Copilot — creates asset from brief, routes to Asset Editor)
- "Edit Brief" / "Approve Brief"
- "Cancel Brief" with confirmation

---

### 2.6 Insights (`/app/content/insights`)

**Purpose:** Measure content's contribution to EVI over time and identify optimization opportunities.

**Layout:** Full-width dashboard. Time range toggle (7d / 30d / 60d / 90d) at top right.

**Zone 1 — Authority Performance:**
- CiteMind Score trend (30-day line chart, Iris color)
- "What drove your content authority this period?" attribution breakdown:
  - New publications: N pieces, avg CiteMind X
  - Optimized existing: N pieces, avg +Y pts
  - AI citation events detected: N new citations across engines

**Zone 2 — Citation Intelligence:**
- Which published assets are being cited in AI engines (table: asset title / engine / citation count / trend)
- Which assets have zero citations but high citation eligibility (optimization opportunities)
- Citation drift: assets that were being cited and have dropped off (recovery opportunities)

**Zone 3 — Competitive Authority:**
- Your topic cluster CiteMind scores vs. CompetitorX (same table format as SEO surface's topic comparison)
- Gaps highlighted in red with "Close this gap" CTA that creates a SAGE brief

**Zone 4 — SAGE Optimization Queue:**
- Assets with available optimization recommendations
- Sorted by: estimated EVI lift from optimizing
- One-click "Optimize →" opens Asset Editor with CiteMind drawer pre-open

---

## 3. COMPONENT BUILD ORDER

Build in this order to enable incremental delivery:

### Phase 1 — Foundation (unlocks all views)
1. `ContentShell.tsx` — topbar with ImpactStrip, tab nav (Overview / Library / Calendar / Insights), pillar accent
2. `ContentImpactStrip.tsx` — SAGE context, EVI indicator, mode badge (import patterns from PR surface)
3. `ContentAssetCard.tsx` — density-adaptive, CiteMind score as visual primary
4. `CiteMindScoreDisplay.tsx` — score number + color coding + trend indicator (reusable everywhere)

### Phase 2 — Library (fastest user-visible value)
5. `ContentLibraryView.tsx` — two-pane layout, filter sidebar, asset grid
6. `ContentFiltersPanel.tsx` — filter controls
7. `ContentEmptyState.tsx` — authority-framed empty states

### Phase 3 — Overview (strategic command)
8. `ContentOverviewView.tsx` — full-width dashboard
9. `SAGEProposalCard.tsx` — competitive gap + EVI impact + one-click create
10. `CrossPillarActivityFeed.tsx` — recent PR/SEO/Content events

### Phase 4 — Editor (core workflow)
11. `ContentAssetEditor.tsx` — two-pane shell with outline nav
12. `SectionEditor.tsx` — individual section with CiteMind indicator
13. `FAQSectionComponent.tsx` — structured FAQ with schema generation
14. `CiteMindDrawer.tsx` — intelligence panel (slide-in from right)
15. `DerivativeStatusPanel.tsx` — derivative pipeline status

### Phase 5 — Supporting views
16. `ContentCalendarView.tsx`
17. `ContentBriefEditor.tsx`
18. `ContentInsightsView.tsx`

---

## 4. DATA INTEGRATION NOTES

### Existing APIs (wire to these)
- `GET /api/content/items` — asset list
- `GET /api/content/briefs` — brief list
- `GET /api/content/clusters` — topic clusters for SAGE proposals
- `GET /api/content/gaps` — content opportunity gaps
- `POST /api/content/quality/analyze` — CiteMind analysis trigger

### Required New API Endpoints (backend build required)
- `GET /api/content/items/[id]` — individual asset
- `PATCH /api/content/items/[id]` — update asset
- `GET /api/content/calendar` — calendar entries with cross-pillar deps
- `GET /api/content/derivatives/[assetId]` — derivative surfaces
- `POST /api/content/derivatives/generate` — trigger derivative generation
- `GET /api/content/authority-signals` — authority signal records

### Mock-first strategy
All views should render with realistic mock data even before API wiring is complete. No blank states during development. Use the data shapes from CONTENT_WORK_SURFACE_CONTRACT.md §9 TypeScript interfaces.

---

## 5. DESIGN SYSTEM REQUIREMENTS

All implementations must comply with:

- **Typography:** D018 scale — titles 24px min, body 14px, metadata 12px uppercase only
- **Border radius:** D021 — 8px default (rounded-md), 12px large panels (rounded-lg)
- **Pillar accent:** Iris — `text-brand-iris`, `bg-brand-iris/5`, `border-brand-iris/20`
- **Background:** `bg-page` for surface, `bg-slate-1` for cards, `bg-slate-2` for nested elements
- **No hardcoded hex colors** — all DS tokens per D003/D011
- **CiteMind score colors:** success green (80-100), brand-cyan (60-79), semantic-warning (40-59), semantic-danger (0-39)
- **Mode badges:** import from PR surface patterns — consistent across all surfaces

---

## 6. ANTI-PATTERNS — DO NOT BUILD THESE

The following patterns are canon-violations. If you find yourself building any of these, stop and re-read the canon.

| Anti-Pattern | Why Prohibited |
|---|---|
| Chat-style AI writing canvas | Bypasses CiteMind governance; freeform generation = unverified claims |
| Freeform content creation without a brief | Every draft must originate from a Brief per CONTENT_PILLAR_SYSTEM.md §2.2 |
| Social scheduler / posting time grid | Volume and timing optimization ≠ authority infrastructure |
| Keyword density / NLP term frequency panel | Legacy SEO metric with low AEO correlation; contradicts D023 |
| "Generate blog post" button | Frames content as volume, not authority |
| Auto-publish without CiteMind gate | Publishing = Manual only (automation ceiling per §7.4) |
| Flat document list without authority context | Every asset must show its authority signal; a list without CiteMind scores is insufficient |
| Generic AI writing suggestions not grounded in entity/citation context | AI suggestions must be specific: "Add a definition of [entity] — Perplexity cites this 3x more" not generic "improve your content" |

---

## 7. SUCCESS CRITERIA

The Content surface rebuild is complete when:

**Functional:**
- [ ] All six views render with mock data matching contract §4 TypeScript interfaces
- [ ] CiteMind score is visually primary on all asset representations (more visually prominent than word count and publish date)
- [ ] SAGE proposals visible on Overview with competitive gap language and EVI impact
- [ ] Asset Editor enforces structured sections (no freeform single textarea)
- [ ] CiteMind gate blocks publish for blocked assets; warns for warning assets
- [ ] Derivative panel shows status and one-click regeneration
- [ ] ImpactStrip present on Overview, Library header, and Asset Editor header
- [ ] Mode badge visible and contextually accurate on automation-eligible actions

**Competitive moat validation:**
- [ ] Moat 1: CiteMind score is the primary visual hierarchy element on every asset card ✓
- [ ] Moat 2: Cross-Pillar Impact score displays on every asset; ImpactStrip shows EVI delta ✓
- [ ] Moat 3: Derivative map visible in Brief Editor; derivative status accessible from Asset Editor ✓
- [ ] Moat 4: Passage-level CiteMind feedback in editor; structured sections enforced; FAQ component with schema ✓
- [ ] Moat 5: SAGE proposals in Overview with competitive gap framing; SAGE optimize badge in Library ✓

**Design system compliance:**
- [ ] Iris accent consistently applied
- [ ] No hardcoded hex colors
- [ ] Typography scale per D018
- [ ] Border radius per D021
- [ ] Empty/loading/error states on all views
