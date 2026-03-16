# Pravado v2 — Sprint Plan
**Prepared:** 2026-02-24
**Authority:** All decisions in this file are final. Claude Code executes; it does not re-interpret.

---

## Pre-Sprint: Accent Color Token Addition (D022)

**Scope:** 2 files, 5 lines. Do this first. Zero risk.

**Rationale:** `brand-iris` (#A855F7) is assigned to the Content pillar. The same hex appears in DS docs as "electric-purple / AEO/Intelligence." The Entity Map requires three visually unambiguous ring colors. Adding `brand-violet` resolves the collision before any Entity Map or Analytics sprint begins.

**Files:**
- `apps/dashboard/src/app/globals.css` — add `--brand-violet: #7C3AED;`
- `apps/dashboard/tailwind.config.ts` — add `violet: 'var(--brand-violet)'` under `brand`

**Ring color mapping (canonical after this change):**
- Ring 1 (Owned / SEO-Content) → `brand-cyan` (#00D9FF)
- Ring 2 (Earned / PR) → `brand-magenta` (#D946EF)
- Ring 3 (Perceived / AEO) → `brand-violet` (#7C3AED)
- Content pillar (editor, orchestration, content cards) → `brand-iris` (#A855F7) — unchanged

---

## Sprint 1: Token Compliance
**Goal:** Every component in scope uses only DS v3.1 tokens. Zero phantom hex values. Zero invalid opacity chains. Zero JS hex objects.
**Risk:** Zero behavioral change. Pure find-and-replace. Ship as a single commit per file.
**Pre-requisite:** Pre-sprint above complete.

---

### 1A — `pillar-accents.ts`

**Changes:**
1. Delete entire `surfaceTokens` export object. Search for `surfaceTokens.` usage in codebase before deleting — replace all consumers with Tailwind classes.
2. Fix `modeStyles.manual.bg`: `'bg-white/20/50'` → `'bg-white/5'`
3. Fix `priorityStyles.low.bg`: `'bg-white/30/10'` → `'bg-white/5'`
4. Fix `modeStyles.manual.text`: ensure `text-white/70` (no chained opacity)
5. Replace `cardElevated: '#1A1A24'` → delete (part of surfaceTokens deletion)
6. Replace `borderSubtle: '#16161E'` → delete (part of surfaceTokens deletion)
7. Replace `borderHover: '#2A2A36'` → delete (part of surfaceTokens deletion)

---

### 1B — `prWorkSurfaceStyles.ts`

**Changes:**
1. Delete `surfaceTokens` export object (same pattern as pillar-accents.ts)
2. Replace all phantom hex values:
   - `#0D0D12` → `bg-slate-1`
   - `#16161E` → `bg-slate-2`
   - `#1A1A24` → `bg-slate-3` or `border-border-subtle` depending on context
   - `#2A2A36` → `bg-slate-5`
   - `#3A3A48` → `bg-slate-5`

---

### 1C — `ActionStreamPane.tsx`

**Changes (global replace in file):**
- `bg-[#0D0D12]` → `bg-slate-1`
- `bg-[#0A0A0F]` → `bg-page`
- `bg-[#1A1A24]` → `bg-slate-3`
- `border-[#1A1A24]` → `border-border-subtle`
- `bg-semantic-danger/8` → `bg-semantic-danger/10`
- `bg-semantic-warning/8` → `bg-semantic-warning/10`
- `bg-brand-cyan/8` → `bg-brand-cyan/10`

---

### 1D — `StrategyPanelPane.tsx`

**Changes (global replace in file):**
- Same phantom hex replacements as 1C
- `bg-semantic-danger/8` → `bg-semantic-danger/10`
- `bg-semantic-warning/8` → `bg-semantic-warning/10`
- `bg-brand-cyan/8` → `bg-brand-cyan/10`

---

### 1E — `ActionCard.tsx`

**Changes:**
- `border-[#2A2A36]` → `border-slate-5`
- `hover:bg-brand-iris/8` → `hover:bg-brand-iris/10`
- `hover:bg-brand-magenta/8` → `hover:bg-brand-magenta/10`
- `hover:bg-brand-cyan/8` → `hover:bg-brand-cyan/10`
- Autopilot badge border: `border-brand-cyan/25` → `border-brand-cyan/30`

---

### 1F — `TriPaneShell.tsx`

**Changes:**
- `text-white` on all three pane header h2 elements → `text-white/90`
- Any `bg-[#050508]` or `bg-[#0D0D12]` phantom values → `bg-page` or `bg-slate-1`

---

### 1G — Analytics components

**Files:** `HeadlineMetrics.tsx`, `ContentTable.tsx`, `PlacementsTable.tsx`, `AnalyticsDashboard.tsx`

**Changes (global replace across all four files):**
- `bg-cc-surface` → `bg-panel` (standard card background)
- `border-white/8` → `border-border-subtle` (non-standard opacity step)
- `rounded-2xl` on cards → `rounded-xl` (16px → 12px per updated DS)
- `text-emerald-500` → `text-semantic-success` (not a DS token)
- `text-purple-400` → `text-brand-iris` (not a DS token)
- `stroke="#00E5CC"` inline SVG → `stroke` from DS token (use CSS variable or replace with `#00D9FF`)
- `stroke="#A78BFA"` → `stroke="#A855F7"` (brand-iris hex)
- `backgroundColor: 'var(--cc-surface)'` in Recharts tooltip → `'var(--panel-bg)'`
- `border: '1px solid rgba(255,255,255,0.08)'` → `'1px solid var(--border-subtle)'`

---

### 1H — `ContentWorkSurfaceShell.tsx`

**Changes:**
- `bg-black/50` (drawer backdrop) → `bg-page/70 backdrop-blur-sm`
- `text-white` (plain) → `text-white/90`
- Any phantom hex values → nearest DS token per banned list

---

### 1I — Mode badges in `ActionCard.tsx`

**Change:** Add Manual and Copilot mode badges (currently only Autopilot has one).

```tsx
<span className={`px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border ${
  action.mode === 'autopilot' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30' :
  action.mode === 'copilot'   ? 'bg-brand-iris/10 text-brand-iris border-brand-iris/30' :
                                'bg-white/5 text-white/70 border-white/20'
}`}>
  {action.mode === 'autopilot' ? 'Auto' : action.mode === 'copilot' ? 'Copilot' : 'Manual'}
</span>
```

---

### 1J — `TriPaneShell.tsx` Strategy Panel width

**Change:** `w-[300px] xl:w-[340px]` → `w-[320px]` (contract requires 320px fixed)

---

## Sprint 2: Typography Hierarchy
**Goal:** Every surface title is `text-2xl font-bold`. Every section heading is `text-xl` or `text-lg`. Card titles are visually distinct from body text. Topbar updated.
**Pre-requisite:** Sprint 1 complete.

---

### 2A — Topbar (`CommandCenterTopbar.tsx`)

**Changes:**
1. `h-14` → `h-16` (56px → 64px for enterprise authority)
2. `bg-page/95` → `bg-slate-1/95` (subtle elevation from page)
3. Wordmark: `text-lg font-bold` → `text-xl font-bold` (20px minimum)
4. Nav items: already `text-[15px] font-medium` — correct, no change needed

---

### 2B — Surface Shell Headers (ALL work surfaces)

Apply to: `PRWorkSurfaceShell.tsx`, `ContentWorkSurfaceShell.tsx`, `SEOWorkSurfaceShell.tsx`, `AnalyticsDashboard.tsx`, and any other surface shell with an h1.

**Rule:** Every surface h1 must be `text-2xl font-bold text-white/95 tracking-tight`. No exceptions.

**Current violations found:**
- `AnalyticsDashboard`: `text-lg font-semibold text-white/90` → `text-2xl font-bold text-white/95 tracking-tight`
- `PRWorkSurfaceShell`: `text-xl font-semibold text-white/95` → `text-2xl font-bold text-white/95 tracking-tight`
- Any other surface using `text-xl` or smaller for h1 → `text-2xl font-bold`

**Surface subtitle (the descriptor line below h1):**
- Currently: `text-[11px] font-bold uppercase` in some shells → wrong (badge size for a subtitle)
- Fix: `text-[13px] text-white/55` — no uppercase, readable size

---

### 2C — Pane Headers (`TriPaneShell.tsx`)

**Change:** Pane header text — currently `text-sm font-semibold text-white/90` → `text-lg font-semibold text-white/90 tracking-tight`

This is the biggest single visual change: tri-pane headers going from 14px to 18px creates immediate visual hierarchy.

---

### 2D — Section Labels in Analytics

**Current:** `text-[11px] font-bold uppercase tracking-wider` used for section headings like "EVI Drivers", "Top Movers", "EVI Over Time"
**Fix:** These are section headings (h2 level), not micro badges. Use `text-xs font-semibold uppercase tracking-wide text-white/55` for label-style section headers, or `text-base font-semibold text-white/90` for proper section headings depending on visual weight needed.

**Rule:** If it appears above a major content section (a chart, a table, a card group), it is a section heading and must be at minimum `text-xs uppercase tracking-wide`. If it is the primary heading for a subsection users scroll to, use `text-base font-semibold text-white/90`.

---

### 2E — Typography token migration

**Files:** All components that import from `typography.ts` or `text-intents.ts`

**Find and replace deprecated tokens:**
- `headingLg` → `headingPage` (or apply `text-2xl font-bold text-white/95 tracking-tight` directly)
- `headingMd` → `headingPane`
- `headingSm` → `headingSubsection`
- `titleLarge` → `titlePage`
- `titleSecondary` → `titlePane`
- `titlePrimary` → `titleCard` (if used for card-level titles) or `titleCompact`

Do NOT bulk-replace blindly. Verify context before each replacement to ensure the new token is semantically appropriate.

---

## Sprint 3: Layout Restructuring
**Goal:** Every layout decision is justified by data shape. Cards for decisions. Tables for tabular data. KPI rows for metrics. Width justified by content.
**Pre-requisite:** Sprint 2 complete (typography must be fixed first — layout decisions depend on visual hierarchy being readable).

---

### Layout Decision Map (Authoritative)

These decisions are final. Claude Code does not interpret — it implements these exactly.

| Surface | Component | Current Shape | Correct Shape | Decision |
|---------|-----------|---------------|---------------|----------|
| Analytics | HeadlineMetrics | 4-col card grid | **Keep** — correct KPI shape | Layout is RIGHT. Sprint 1 fixes tokens. |
| Analytics | ContentTable summary | 3-col card grid | **Keep** — correct KPI shape | Layout is RIGHT. Sprint 1 fixes tokens. |
| Analytics | PlacementsTable summary | 3-col card grid | **Keep** — correct KPI shape | Layout is RIGHT. Sprint 1 fixes tokens. |
| Analytics | ContentTable rows | Already `<table>` | **Keep** | Correct. |
| Analytics | PlacementsTable rows | Already `<table>` | **Keep** | Correct. |
| Analytics | TopMovers | Stacked event cards | Convert to **table rows** | Each mover is a row with 3 attributes (description, pillar, delta). No decision to make per row. Table. |
| Analytics | CoverageTimeline events | Flex-wrap event chips | Convert to **compact table** | Date, publication, headline, EVI impact — tabular. |
| PR | Journalist database | Cards (assumed) | **Sortable table** | Journalists have 5+ comparable attributes. Table with inline quick-action. |
| PR | Pitches list | Cards (assumed) | **Cards** — keep | A pitch row is a decision (send/approve/skip). Card is correct. |
| PR | Coverage list | Table (assumed) | **Table** — keep | Coverage items are comparable rows. |
| Content | Library view | Cards (assumed) | **Cards** — keep | Each document is a decision (edit/publish/archive). |
| Content | Work queue | Cards (assumed) | **Cards** — keep | Each item requires an approve/reject decision. |
| SEO | Topic clusters | Cards (assumed) | **Table** | Topic clusters have schema score, coverage, gap — comparable attributes. |
| SEO | Citations table | Already table (assumed) | **Keep** | Correct. |
| Command Center | Action Stream | Cards | **Keep** | Each action is a decision. Cards are correct and contract-locked. |
| Command Center | Strategy Panel | Vertical stack | **Keep** | Contract-locked layout. |

---

### 3A — Analytics TopMovers: Cards → Table

**Convert** `TopMovers` function in `AnalyticsDashboard.tsx` from stacked cards to a compact table:

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-border-subtle">
      <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide text-white/55">Factor</th>
      <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide text-white/55">Pillar</th>
      <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide text-white/55">Period</th>
      <th className="text-right pb-3 text-xs font-semibold uppercase tracking-wide text-white/55">Impact</th>
    </tr>
  </thead>
  <tbody>
    {sorted.map((mover) => (
      <tr key={mover.id} className="border-b border-border-subtle/50 last:border-0">
        <td className="py-3 text-sm text-white/85">{mover.description}</td>
        <td className="py-3"><PillarBadge pillar={mover.pillar} /></td>
        <td className="py-3 text-[13px] text-white/55">{mover.period}</td>
        <td className={`py-3 text-right text-base font-bold tabular-nums ${isPositive ? 'text-semantic-success' : 'text-semantic-danger'}`}>
          {isPositive ? '+' : ''}{mover.delta.toFixed(1)}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

---

### 3B — Analytics CoverageTimeline events: Chips → Table

**Convert** the event chips section in `CoverageTimeline` to a compact table above the chart:

```tsx
<table className="w-full mb-4">
  <thead>
    <tr className="border-b border-border-subtle">
      <th className="text-left pb-2 text-xs font-semibold uppercase tracking-wide text-white/55">Date</th>
      <th className="text-left pb-2 text-xs font-semibold uppercase tracking-wide text-white/55">Placement</th>
      <th className="text-left pb-2 text-xs font-semibold uppercase tracking-wide text-white/55">Tier</th>
      <th className="text-right pb-2 text-xs font-semibold uppercase tracking-wide text-white/55">EVI Impact</th>
    </tr>
  </thead>
  <tbody>
    {events.map((event) => { /* rows */ })}
  </tbody>
</table>
```

---

### 3C — PR Journalist Database: Cards → Table

**File:** `pr-work-surface/views/PRDatabase.tsx` (or equivalent)

If journalist contacts are currently rendered as cards, convert to a sortable table. Each journalist row should have:

Columns: Name | Publication | Beat | Tier | Relationship Score | Last Contact | Actions

The Actions column contains a single primary action button (inline, compact: "Pitch" or "View").

The full journalist profile opens in a drawer, not a modal. This is already in the contract.

---

### 3D — SEO Topic Clusters: Cards → Table

**File:** `seo/TopicClusterList.tsx`

If topic clusters are rendered as cards, convert to a table. Each cluster row:

Columns: Topic | Content Count | Schema Coverage | Gap Score | Authority Weight | Actions

"Actions" = single "View Cluster" link.

---

### 3E — Width audit pass (all surfaces)

After 3A–3D, do a final width audit across all surfaces:

**Rule:** Any card, panel, or container with `w-full` that contains 3 or fewer data points must be given an explicit max-width or placed in an appropriately-sized grid.

Specific targets:
- Any standalone "stat" card outside a grid → wrap in a `grid grid-cols-3` or `grid grid-cols-4` with siblings
- Any form input wider than `max-w-lg` (512px) for short-value inputs (email, name, URL) → cap at `max-w-sm` (384px) or `max-w-md` (448px)
- Buttons that fill full width unnecessarily → `w-auto` or `w-fit`

---

## Sprint 4: Impact Strip + Missing Features
**Goal:** Impact Strip present on all work surfaces. Mode badges complete. CI checks verified.
**Pre-requisite:** Sprint 3 complete.

**Scope:**
1. Add `ImpactStrip` to any surface shell missing it (verify `ContentWorkSurfaceShell.tsx`, `SEOWorkSurfaceShell.tsx`, `AnalyticsDashboard.tsx`)
2. Verify `CalendarPeek.tsx` height contract `h-[280px]`
3. Verify `EntityMap.tsx` zone/ring layout (now ring-based per D012)
4. Verify `ActionModal.tsx`, `ActionHoverBrief.tsx`, `IntelligenceCanvasPane.tsx` DS token compliance
5. Confirm CI check scripts exist in `scripts/` — create any that are missing
6. Resolve upgrade hook button in `StrategyPanelPane.tsx` per GAP-011

---

## Sprint Execution Rules (Claude Code Must Follow)

1. **Read the design skill before writing any component.** Path: `docs/skills/PRAVADO_DESIGN_SKILL.md`. Non-negotiable.

2. **One sprint at a time.** Do not start Sprint 2 work while Sprint 1 is incomplete. The pre-commit checklist in the design skill must pass before moving to the next sprint.

3. **Never copy existing component patterns for color/background values.** Existing components contain violations. Always derive values from `DS_v3_1_EXPRESSION.md` or the design skill token tables.

4. **The layout decision map is final.** If a surface is listed as "Table," it becomes a table. If it is listed as "Keep," the layout shape is not changed. Do not reinterpret based on what "looks better."

5. **Typography violations are blocking.** Any surface h1 that is not `text-2xl font-bold` after Sprint 2 is an incomplete sprint. Do not move to Sprint 3 until all surface titles pass.

6. **Widths are justified, not defaulted.** Before writing `w-full` on any non-full-bleed component, state the justification in a code comment: `{/* w-full: full-bleed chart, needs container width */}`. If no justification can be written, the component is not full-width.
