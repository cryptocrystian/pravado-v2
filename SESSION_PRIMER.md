# SESSION PRIMER — Pravado v2
> Update this file at the start and end of every session. This is the single source of truth for cross-session continuity.

## Last Updated
2026-03-02 — Content Surface Phase 1 Rebuild complete

---

## Current State: CONTENT SURFACE PHASE 1 ✅ LIVE

The Content work surface has been **fully rebuilt** and is rendering in production at `/app/content`. The old stale two-column CMS page has been replaced.

### What's done (this session + last session)

**Route & Shell**
- `/app/app/content/page.tsx` — rewritten, connected to `ContentWorkSurfaceShell`, all 4 tabs wired (Overview / Library / Calendar / Insights)

**ContentOverviewView** (`/components/content/views/ContentOverviewView.tsx`) — NEW
- 3-zone layout: Authority Status (CiteMind 74, sub-metrics) | SAGE Action Queue (3 proposals with competitive gap language) | Active Status (pipeline, top asset, needs attention)
- Active Themes strip with per-cluster CiteMind scores and trend arrows
- Cross-Pillar Attribution feed (PR coverage → EVI delta, citation detected, pitch sent, AEO change)
- Recent Assets grid using new ContentAssetCard v2
- Full-width layout (D022 compliant — no forced TriPaneShell)

**ContentAssetCard v2** (`/components/content/components/ContentAssetCard.tsx`) — REBUILT
- CiteMind score is now the **dominant visual anchor** (text-2xl, top-right, color-coded by score range, labeled "CiteMind / Citation-ready|Good standing|Needs work|Low eligibility")
- All three density modes: comfortable (full), standard (condensed), compact (row)
- Moat 1 requirement satisfied

**Mock Data** (`/components/content/content-mock-data.ts`) — EXTENDED
- Added `CONTENT_OVERVIEW_MOCK: ContentOverviewData` with 3 realistic assets, 3 SAGE proposals with real competitive gap language, 5 active themes, 4 cross-pillar events

**Shell Layout Fix** (`ContentWorkSurfaceShell.tsx`)
- Fixed `flex-1 min-h-0 overflow-hidden flex flex-col` on content wrapper so `overflow-y-auto` in child views actually constrains and scrolls correctly

---

## What's Next: PHASE 2 — Asset Editor

Per CONTENT_REBUILD_BRIEF.md §2.3, the Asset Editor is the next highest priority:

**Route:** `/app/content/asset/[id]` (new dynamic route)
**Layout:** Two-pane — outline nav (240px left) + structured section editor (full-width)
**Key components to build:**
1. `AssetEditorShell` — two-pane layout, section nav, CiteMind drawer trigger
2. `SectionEditor` — each section is a structured unit (intro, concept, evidence, FAQ, related)
3. `FAQComponent` — first-class FAQ with schema generation
4. `CiteMindDrawer` — slides in from right, shows doc/section scores, entity grounding, publish gate
5. `DerivativeStatusPanel` — shows PR pitch excerpt, AEO snippet, AI summary, social fragment status

**Moats to express:**
- Moat 3: Brief → Draft → Derivative pipeline (derivative map in right panel)
- Moat 4: AEO-optimized editor (passage-level CiteMind feedback, structured section enforcement)
- Moat 1: CiteMind publish gate (blocks/warns before publish)

---

## Active Canon Files

| File | Status |
|------|--------|
| `CONTENT_WORK_SURFACE_CONTRACT.md` | v2.0 — §9B moat requirements partially implemented |
| `CONTENT_REBUILD_BRIEF.md` | Phase 1 complete, Phase 2 pending |
| `COMPETITIVE_INTELLIGENCE_2026.md` | Complete — review quarterly |
| `DECISIONS_LOG.md` | D022–D024 logged this sprint |
| `DS_v3_1_EXPRESSION.md` | Active design system reference |

---

## Key Architectural Context

- **No TriPaneShell on Content surface** (D022) — each view uses its own layout
- **CiteMind score = primary quality metric everywhere** (D023) — never show word count or NLP score as primary
- **AEO citation-worthiness > SEO keyword density** — never build Surfer-style panels
- **Every SAGE proposal must show competitive gap language** — not just "write content about X"
- **Cross-pillar attribution must be visible** — PR coverage → citation lift → EVI pts chain

---

## File Locations Quick Reference

```
/app/app/content/page.tsx              — Route page (rebuilt)
/components/content/
  ContentWorkSurfaceShell.tsx          — Shell with tabs, ImpactStrip
  content-mock-data.ts                 — CONTENT_OVERVIEW_MOCK added
  views/
    ContentOverviewView.tsx            — NEW: 3-zone strategic dashboard
    ContentLibraryView.tsx             — Rebuilt (uses new AssetCard)
    ContentCalendarView.tsx            — Existing stub (working)
    ContentInsightsView.tsx            — Existing stub (working)
  components/
    ContentAssetCard.tsx               — REBUILT: CiteMind-first hierarchy
/docs/canon/DECISIONS_LOG.md          — D022, D023, D024
/docs/canon/CONTENT_REBUILD_BRIEF.md  — Phase specs
```

---

## Design System Quick Ref (DS v3.1)

- Background: `bg-slate-0` (#0A0A0F), Card: `bg-slate-2`, Border: `border-slate-4`
- Content pillar accent: `brand-iris` (purple)
- Success/Good: `semantic-success`, Warning: `semantic-warning`, Danger: `semantic-danger`
- Cyan: `brand-cyan` (used for EVI scores, "ready" states)
- Typography: tight tracking, `font-bold` for numbers, `/95` or `/90` for headings, `/50` for labels
- Motion: `transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]`
