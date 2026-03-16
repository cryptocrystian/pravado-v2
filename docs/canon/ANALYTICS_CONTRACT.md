# ANALYTICS & REPORTING V1 CONTRACT

> **Status:** CANONICAL — V1 FROZEN
> **Authority:** This document defines the Analytics surface specification. Written before any implementation code.
> **Classification:** Release Lock — Changes require formal change control
> **Last Updated:** 2026-02-20

---

## 1. Prime Directive

**Analytics answers one question: "Is our EVI improving, and what's driving it?"**

Analytics is the **observational layer** — it shows trends, correlations, and contributing factors across all three pillars. It does NOT execute actions, propose changes, or modify any state. It is a read-only window into the health and trajectory of earned visibility.

### 1.1 What Analytics Is

- A single, scrollable EVI health dashboard
- Cross-pillar by nature — no pillar accent color, neutral presentation
- Historical context that the Command Center Strategy Panel lacks
- The place a user goes to understand *why* EVI moved

### 1.2 What Analytics Is NOT

- Not a second Command Center (CC shows what to do next; Analytics shows what happened)
- Not a drill-down reporting tool (V1 has no sub-page navigation)
- Not a data export surface (no CSV, no PDF — deferred to V2)
- Not mode-aware (observational surfaces have no mode dimension)

---

## 2. V1 Scope

### 2.1 Included in V1

| Section | Purpose | Data Source |
|---------|---------|-------------|
| **EVI Scorecard** | Current EVI score, 30-day delta, trend sparkline, last updated timestamp | EVI time series |
| **Driver Breakdown** | Visibility / Authority / Momentum — current score + 30d delta + direction | EVI driver components |
| **EVI Over Time** | Line chart with 30d / 90d / 12m range toggle | EVI time series |
| **Share of Model Trend** | Topic cluster comparison, bar or area chart, 30d comparison | Share of Model snapshots |
| **Coverage Timeline** | PR coverage events plotted against EVI movement, showing correlation | Coverage events + EVI series |
| **Top Movers** | What drove EVI up or down this period — contributing factors with deltas | Pillar contribution deltas |

### 2.2 Excluded from V1 (Logged as Future)

| Feature | Reason for Deferral | V2 Priority |
|---------|-------------------|-------------|
| Custom date ranges | Complexity; fixed ranges (30d/90d/12m) sufficient for V1 | Medium |
| Drill-down sub-pages | Single dashboard sufficient for V1 | Medium |
| Data export (CSV/PDF) | Not core to the observational question | Low |
| Pillar-specific analytics tabs | Cross-pillar view is the V1 value; pillar detail lives in each surface | Medium |
| Anomaly detection / alerts | Requires ML pipeline not yet built | Low |
| Comparative benchmarking | Requires industry data not yet available | Low |
| Real-time updates | Mock data for V1; real-time requires API pipeline | Medium |

---

## 3. Surface Architecture

### 3.1 Tab Structure

**Single scrollable dashboard.** No tabs for V1. The six sections stack vertically in a natural reading order: scorecard → drivers → trend → share of model → coverage → movers.

Rationale: Analytics is consumed as a narrative ("here's where you are → here's what's driving it → here's the trend → here's what moved"). Tabs would fragment this narrative for V1's scope.

### 3.2 Mode Agnostic

Analytics has **no ModeSwitcher** and **no ImpactStrip**. It is purely observational — the same view regardless of what mode any pillar is running in. The page header uses neutral styling (no pillar accent color).

### 3.3 Route

```
/app/analytics
```

Uses the same topbar-first layout as Command Center and Calendar (`CommandCenterTopbar`).

---

## 4. EVI Model (Canonical Reference)

Analytics MUST match the Command Center's EVI model exactly. The formula is defined in `EARNED_VISIBILITY_INDEX.md`:

```
EVI = (Visibility × 0.40) + (Authority × 0.35) + (Momentum × 0.25)
```

Each component is normalized to 0–100 before weighting. The composite EVI score ranges 0–100.

### 4.1 EVI Status Bands

| EVI Range | Status | Color |
|-----------|--------|-------|
| 0–40 | At Risk | `semantic-danger` |
| 41–60 | Emerging | `semantic-warning` |
| 61–80 | Competitive | `brand-cyan` |
| 81–100 | Dominant | `semantic-success` |

### 4.2 Driver Definitions

| Driver | Weight | What It Measures |
|--------|--------|-----------------|
| **Visibility** | 40% | Where the brand currently appears — AI answers, press coverage, SERP coverage, featured snippets |
| **Authority** | 35% | Why the brand should be trusted — citation quality, domain authority, structured data, E-E-A-T signals |
| **Momentum** | 25% | Trajectory and velocity — citation velocity, share of voice change, content velocity, ranking trajectory |

### 4.3 Share of Model

```
Share of Model = (Brand AI Citations) / (Total AI Citations in Topic Domain) × 100
```

Displayed per topic cluster. See `SEO_AEO_PILLAR_CANON.md` §4 for full definition.

---

## 5. Section Specifications

### 5.1 EVI Scorecard

The hero section at top of page. Displays:

- **EVI score** — Large numerical display (e.g., "72.4"), using the band color
- **30-day delta** — Signed change with arrow (e.g., "+3.2 ↑" in green, "-1.8 ↓" in red)
- **Trend sparkline** — Miniature 30-day line showing trajectory
- **Last updated** — Timestamp ("Updated 2 hours ago" or similar)
- **Status label** — Band name ("Competitive") using band color

### 5.2 Driver Breakdown

Three equal cards in a horizontal row:

| Card | Label | Displays |
|------|-------|----------|
| Visibility | "Visibility" | Score (0–100), 30d delta with direction arrow, weight label "40%" |
| Authority | "Authority" | Score (0–100), 30d delta with direction arrow, weight label "35%" |
| Momentum | "Momentum" | Score (0–100), 30d delta with direction arrow, weight label "25%" |

Design intent: Drivers should NOT all move together. Interesting state = divergence (e.g., Visibility up, Authority flat, Momentum down). Mock data must demonstrate this.

### 5.3 EVI Over Time

- **Chart type:** Line chart (SVG-rendered, no external charting library for V1)
- **Range toggle:** 30d / 90d / 12m (segmented control, same pattern as calendar view toggle)
- **Y-axis:** 0–100 (EVI scale)
- **X-axis:** Time labels appropriate to range
- **Band overlay:** Subtle horizontal bands showing At Risk / Emerging / Competitive / Dominant zones
- **Interaction:** Hover shows exact value + date (CSS tooltip, no JS library)

### 5.4 Share of Model Trend

- **Chart type:** Horizontal bar chart or simple area comparison
- **Data:** 3–4 topic clusters with current SoM % and 30d change
- **Comparison:** Show "You" vs top competitor for each cluster
- **Color:** Use `brand-cyan` for user's bars (SoM is an SEO/AEO metric), `white/30` for competitor

### 5.5 Coverage Timeline

- **Layout:** Horizontal timeline strip
- **Top lane:** PR coverage events as dots/markers, colored by tier (T1/T2/T3)
- **Bottom lane:** EVI mini-chart aligned to same time axis
- **Purpose:** Visual correlation — "coverage events here caused EVI movement there"
- **Events:** 4–6 coverage events with title, tier, and date

### 5.6 Top Movers

- **Layout:** Vertical list of 5 contributing factors
- **Each item:** Factor description, pillar badge, delta value (signed), direction indicator
- **Sort:** By absolute delta, descending
- **Mix:** At least 2 positive and 2 negative movers to show what helped and what hurt

---

## 6. Visual Design

### 6.1 Color Rules

- **No pillar accent color** on the page header or chrome — Analytics is cross-pillar
- **EVI score** uses the band color from §4.1
- **Driver deltas** use `semantic-success` for positive, `semantic-danger` for negative
- **Pillar badges** on Top Movers use standard pillar colors (magenta/iris/cyan)
- **Charts** use `brand-cyan` for primary line, `white/20` for grid lines

### 6.2 Typography

- Page title: `text-lg font-semibold text-white/90`
- Section headings: `text-sm font-semibold text-white/90` with uppercase tracking label
- Body text: `text-sm text-white/70` minimum
- Metadata/labels: `text-[11px] font-bold uppercase tracking-wider text-white/50`
- EVI hero number: `text-4xl font-bold tabular-nums`

### 6.3 DS v3.1 Compliance

All standard DS v3.1 rules apply:
- Zero phantom hex values
- Zero bare `text-white` without opacity
- Zero sub-13px body text without `uppercase tracking-wider`
- Cards use `bg-panel border border-border-subtle rounded-xl shadow-elev-1`
- Backgrounds follow `bg-page` → `bg-slate-1` → `bg-panel` hierarchy

---

## 7. Interaction Contract (FROZEN)

### 7.1 Allowed Interactions

- **Range toggle** on EVI Over Time chart (30d / 90d / 12m)
- **Hover** on chart data points (CSS tooltip showing value + date)
- **Scroll** through the dashboard sections

### 7.2 Forbidden Interactions (V1)

- No action buttons — Analytics does not execute anything
- No CTAs that route to other surfaces — deferred to V2
- No date picker or custom range selector
- No drill-down navigation to sub-pages
- No inline editing of any kind
- No export buttons
- No mode switcher

---

## 8. Data Binding (V1 = Mock)

V1 uses mock data for all sections. The mock data interface is designed to match the eventual API shape:

```typescript
// EVI time series point
interface EVIDataPoint {
  date: string;          // ISO date
  eviScore: number;      // 0-100
  visibility: number;    // 0-100
  authority: number;     // 0-100
  momentum: number;      // 0-100
}

// Share of Model snapshot
interface SoMCluster {
  topicCluster: string;
  yourShare: number;     // percentage
  topCompetitor: string;
  competitorShare: number;
  delta30d: number;      // signed change
}

// Coverage event
interface CoverageEvent {
  id: string;
  date: string;
  title: string;
  tier: 'T1' | 'T2' | 'T3';
  eviImpact: number;    // signed delta
}

// Top mover
interface TopMover {
  id: string;
  description: string;
  pillar: 'pr' | 'content' | 'seo';
  delta: number;         // signed EVI points
  period: string;        // e.g., "Last 30 days"
}
```

---

## 9. Verification Checklist

```
[ ] ANALYTICS_CONTRACT.md exists in docs/canon/ before any code
[ ] Route /app/analytics renders without error
[ ] All 6 dashboard sections present with mock data
[ ] 30d / 90d / 12m toggle works on EVI chart
[ ] No mode switcher, no ImpactStrip, no pillar accent on chrome
[ ] Surface feels observational — no action buttons, no CTAs
[ ] DS v3.1 compliant: zero phantom hex, zero bare text-white, zero sub-min text
[ ] TypeScript typecheck passes
[ ] EVI formula matches CC model (Vis×0.40 + Auth×0.35 + Mom×0.25)
```

---

## 10. Canon Dependencies

| Document | Relationship |
|----------|-------------|
| `EARNED_VISIBILITY_INDEX.md` | **Authority** — EVI formula and driver definitions |
| `EVI_MATHEMATICS.md` | **Authority** — Mathematical model, decay, reinforcement |
| `SEO_AEO_PILLAR_CANON.md` §4 | **Authority** — Share of Model definition |
| `COMMAND_CENTER_CONTRACT.md` | **Peer** — Strategy Panel shows EVI; Analytics shows EVI history |
| `DS_v3_PRINCIPLES.md` | **Authority** — Design system compliance |
| `DS_v3_1_EXPRESSION.md` | **Authority** — Visual expression rules |
