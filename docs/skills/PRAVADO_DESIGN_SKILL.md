# PRAVADO DESIGN SKILL
**For:** Claude Code sessions building Pravado v2 UI
**Read this before:** Writing any component, touching any existing component, or making any styling decision
**Authority:** `DS_v3_PRINCIPLES.md`, `DS_v3_1_EXPRESSION.md`, `DS_v3_COMPLIANCE_CHECKLIST.md`
**Last Updated:** 2026-03-03

---

## What Pravado Looks Like

Before touching code, hold this mental image:

**Bloomberg Terminal meets AI command center.** Dark. Dense. Purposeful. Every pixel earns its place. The interface communicates authority — this is a tool for professionals making consequential decisions, not a consumer app for casual browsing.

**The feeling:** You are in control of something powerful. The system is working on your behalf. Information is surfaced exactly when you need it. Actions are clear and consequential. Nothing is decorative.

**Not:**
- A SaaS dashboard with rounded cards and pastel accents
- A content creation tool with friendly, warm UI
- A generic "dark mode" app with blue gradients
- A Notion-style workspace with large white space and soft typography
- A Figma-style tool with playful icons and bright fills
- Excel data stacked into full-width rows pretending to be cards
- Anything that looks like it was designed by prompting Midjourney

---

## Enterprise-Grade: What It Actually Means

This section exists because "enterprise-grade" is often used and never defined. Here is what separates a $200/month B2B SaaS from a free dashboard template:

**1. Intentional information density.** Every data point is somewhere for a reason. No card spans full width unless the content needs full width. Three stats do not live inside a card that fills 1200px — they live inside a 320px-wide grid cell.

**2. Typographic hierarchy that is visible without squinting.** A page title and a card title should never require reading the surrounding context to distinguish them. They must differ in size, weight, OR opacity enough that the hierarchy is obvious at a glance.

**3. Whitespace is structural, not decorative.** Whitespace separates distinct semantic sections. It does not pad out content to fill available space. An empty 120px gap between two cards that are in the same section is a design failure.

**4. Components justify their width.** A button that says "Export" does not span 400px. An input asking for an email address does not span 900px. Widths are set by the data shape, not the container size.

**5. Tables for tabular data, cards for decisions.** If the user needs to compare rows of data across multiple columns, that is a table. If the user needs to decide whether to take an action, that is a card. The current codebase has data tables masquerading as card grids. This is the "stacked spreadsheet" problem. Fix it by asking: "Is the user comparing, or deciding?"

**6. Typography weight is the primary hierarchy signal at small scales.** When two items are close in size (14px vs 15px), weight (400 vs 600) and opacity (/90 vs /60) carry the hierarchy. A card title at `text-sm font-semibold text-white/90` and body text at `text-sm font-normal text-white/65` are visually distinct even at the same size.

**7. Interaction states are always defined.** A top frontend developer never ships a component with only a default state. Every interactive element has: default, hover, focus, active, disabled. Missing states are not "coming later" — they are incomplete work.

---

## The Design System in One Glance

### Background Hierarchy (darkest → lightest)

```
bg-page      (#0A0A0F)  ← Page background. The void.
bg-slate-1   (#0E0E14)  ← Subtle elevation. Headers, sub-panels.
bg-panel     (#13131A)  ← Cards. Panels. The standard container.
bg-slate-3   (#19191F)  ← Elevated panels. Input backgrounds.
bg-slate-4   (#1F1F28)  ← Active / hover states.
bg-slate-5   (#2A2A35)  ← Pressed states. Strong hover.
bg-slate-6   (#3D3D4A)  ← Muted surfaces. Disabled states.
```

**Rule:** Never jump more than two steps in one component. A card on a page uses `bg-panel`. An input inside that card uses `bg-slate-3`. A dropdown from that input uses `bg-panel` again (elevated context). No phantom values between steps.

### Border Hierarchy

```
border-border-subtle   (#1F1F28)  ← Default. Use this 90% of the time.
border-slate-5         (#2A2A35)  ← Hover state borders.
border-slate-6         (#3D3D4A)  ← Active / focus borders.
```

### Text Opacity Scale

```
text-white/95   ← Page/surface titles only. Maximum readable contrast.
text-white/90   ← Card titles, primary headings. High visibility.
text-white/85   ← Body text, primary readable content.
text-white/70   ← Secondary text, descriptions.
text-white/60   ← Tertiary. Supporting info.
text-white/55   ← Metadata, timestamps, section labels.
text-white/50   ← Placeholder-adjacent. Fine print.
text-white/40   ← Disabled, hint text.
text-white/30   ← Placeholder text only.
```

**Never use plain `text-white` (100%).** It is brighter than the DS intent (`--white-0: #E8E8ED`). Always add an opacity modifier.

### Pillar Colors (Brand Accents)

```
brand-iris     (#A855F7)  ← Content pillar. Purple.
brand-cyan     (#00D9FF)  ← SEO/AEO pillar. Electric cyan.
brand-magenta  (#D946EF)  ← PR pillar. Hot magenta.
brand-teal     (#14B8A6)  ← Teal. Secondary accent.
brand-amber    (#F59E0B)  ← Amber. Warning-adjacent.
```

Pillar colors are **functional, not decorative.** They identify which pillar owns an action or element. Do not use iris on a PR card, or magenta on a Content heading.

### Semantic Colors

```
semantic-success   (#22C55E)  ← Always with /10 bg, /20 border
semantic-warning   (#EAB308)  ← Always with /10 bg, /20 border
semantic-danger    (#EF4444)  ← Always with /10 bg, /20 border
semantic-info      (#00D9FF)  ← Same as brand-cyan
```

---

## Typography System (AUTHORITATIVE — Supersedes typography.ts)

### The Problem This Section Solves

The `typography.ts` token file defines `headingLg = 'text-lg'` (18px) as the largest heading. Body text is `text-sm` (14px). The gap is 4px. On a 27" monitor at full resolution this gap is invisible. This is why headings look the same as content.

**Enterprise-grade hierarchy requires at minimum a 6px gap between levels, and a 10px gap between page title and body.** The corrected scale below enforces this.

---

### Typography Scale (Canonical)

| Level | Size | Tailwind | Weight | Opacity | Use |
|-------|------|----------|--------|---------|-----|
| Surface Title | 24px | `text-2xl` | 700 | `/95` | Page/surface name. One per view. |
| Section Heading | 20px | `text-xl` | 600 | `/95` | Major sections within a surface. |
| Pane / Panel Title | 18px | `text-lg` | 600 | `/90` | Tri-pane titles, modal headers. |
| Sub-section / Card Group | 16px | `text-base` | 600 | `/90` | Grouping headers inside a pane. |
| Card Title | 15px | `text-[15px]` | 600 | `/90` | Individual card headings. |
| Body Primary | 14px | `text-sm` | 400 | `/85` | Main readable content. |
| Body Secondary | 13px | `text-[13px]` | 400 | `/70` | Supporting text, descriptions. |
| Metadata | 12px | `text-xs` | 500 | `/55` | Only with uppercase + tracking-wide. |
| Badge / Micro | 11px | `text-[11px]` | 700 | varies | Only for badges with uppercase. Never for readable prose. |

**Hard rules from this table:**
- `text-2xl font-bold` is the only acceptable Surface Title. Never `text-xl` for an h1.
- `text-sm` (14px) body and `text-sm` (14px) card titles are **the same size**. Disambiguate with weight (`font-semibold` vs `font-normal`) AND opacity (`/90` vs `/85`). Do not cheat this — use `text-[15px]` for card titles if visual separation feels inadequate.
- `text-xs` (12px) is **only permitted with `uppercase tracking-wide font-medium`**. Plain 12px body text fails legibility standards on dark backgrounds.
- `text-[11px]` is **only for badge labels** with `uppercase tracking-wider font-bold`. Never for prose, helper text, or anything the user must read at length.
- `text-[10px]` — **never.** Not anywhere.

---

### Correct Heading Implementation

```tsx
// ✅ Surface Title — appears once per route, top of shell
<h1 className="text-2xl font-bold text-white/95 tracking-tight">
  PR Intelligence
</h1>

// ✅ Section Heading — major content sections
<h2 className="text-xl font-semibold text-white/95 tracking-tight">
  Relationship Signals
</h2>

// ✅ Pane Title (tri-pane shell, modal header)
<h3 className="text-lg font-semibold text-white/90 tracking-tight">
  Action Stream
</h3>

// ✅ Sub-section / Card Group
<h4 className="text-base font-semibold text-white/90">
  Active Campaigns
</h4>

// ✅ Card Title
<h5 className="text-[15px] font-semibold text-white/90 leading-snug">
  TechCrunch Journalist Outreach
</h5>

// ✅ Body text
<p className="text-sm text-white/85 leading-relaxed">
  Supporting description or content.
</p>

// ✅ Secondary / description
<p className="text-[13px] text-white/70 leading-relaxed">
  Supporting context under a heading.
</p>

// ✅ Section label (uppercase small)
<span className="text-xs font-semibold text-white/55 uppercase tracking-wide">
  Filter by Pillar
</span>

// ✅ Timestamp / metadata
<span className="text-xs text-white/50">2h ago</span>

// ✅ Badge label (only acceptable 11px use)
<span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan">
  SEO
</span>
```

---

### Typography Violations (Hard Fails)

```
❌ text-sm font-semibold   for a page title  →  text-2xl font-bold
❌ text-xs                 for body text      →  text-sm minimum
❌ text-[10px]             anywhere           →  never
❌ text-[11px]             for prose/labels   →  text-xs + uppercase only
❌ text-xs                 without uppercase  →  add uppercase tracking-wide OR use text-sm
❌ same size for heading and body             →  differentiate by weight + opacity at minimum
❌ font-normal on a title class               →  font-semibold or font-bold
```

---

## Layout Laws (Non-Negotiable)

These rules address the "stacked spreadsheet" problem. They must be followed before writing any layout code.

### Law 1: Width Is Earned, Not Taken

A component's width must be justified by what it contains, not by the available space.

```
❌ A card containing 3 stats spans 100% width
✅ Three stat cells in a 3-column grid, each ~200px wide

❌ A form input for "Email Address" spans 900px
✅ The input is max 420px, aligned left, with the rest as open space

❌ A badge row with 4 status chips spans full width
✅ The badge row auto-sizes to its content, floated left
```

**Decision rule:** Before setting `w-full` on anything, ask: "Does the content need this width, or am I filling space?" If filling space, the answer is a grid, not a wide component.

### Law 2: Dead Space Has Two Jobs or Zero Jobs

Whitespace is structural (separating semantic sections) or breathing room (inside a tight data cluster). If it does neither, remove it.

```
❌ 80px gap between "Overview" section and "Recent Activity" section with no visual separator
   → These are different sections. The gap is just padding. Use a separator or reduce to 24px.

✅ 8px gap between label and value inside a stat cell → breathing room, correct
✅ 32px gap between "Journalists" section and "Coverage" section → separation, correct
```

### Law 3: Cards Are Decision Units, Not Data Containers

A card should contain exactly what a user needs to make one decision or take one action.

```
❌ A card that contains: journalist name, last coverage date, email, beat tags,
   relationship score, last outreach date, open rate, click rate, 3 action buttons
   → This is a table row. Put it in a table.

✅ A card that contains: journalist name, beat, relationship score, one primary action
   → Decision unit. The user decides: "Should I pitch this person now?"
```

**Test:** Can the user make the relevant decision in under 3 seconds looking only at this card? If yes, it's a card. If they need to scan multiple fields across multiple cards, it's a table.

### Law 4: Data Shape Determines Layout

| Data shape | Layout |
|-----------|--------|
| N items, each with M comparable attributes | Table |
| N items, each requiring an individual decision | Card grid |
| 1 item with deep detail | Detail pane / drawer |
| 3–6 summary metrics | KPI row (horizontal, not cards) |
| Time-series | Chart (full-width justified) |
| Status pipeline | Kanban or step indicator |
| Ranked list | List (vertical, not cards) |

```
❌ Analytics summary: 6 KPI cards stacked 2-across, each spanning 600px
✅ Analytics summary: KPI row, 6 cells at ~160px each, single horizontal line

❌ Journalist database: 50 journalist "cards" in a 2-column grid
✅ Journalist database: Sortable table with inline action affordances

❌ Action Stream: cards with 8+ fields each, stacked vertically
✅ Action Stream: cards with 3–4 fields maximum, density-adaptive
```

### Law 5: The 3-Column Rule for Metrics

Summary metrics go in a 3-column grid at desktop, 2-column at tablet. Never in a single wide card.

```tsx
// ✅ Correct metric layout
<div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
  <MetricCell label="EVI Score" value="72" delta="+3" />
  <MetricCell label="Coverage" value="14" delta="+2" />
  <MetricCell label="Pitches" value="8" delta="0" />
</div>

// ❌ Wrong metric layout
<div className="bg-panel border border-border-subtle rounded-xl p-6 w-full">
  <div className="flex justify-between">
    <MetricCell ... />
    <MetricCell ... />
    <MetricCell ... />
  </div>
</div>
```

---

## Component Patterns (Copy These Exactly)

### Standard Card

```tsx
<div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 transition-all duration-150">
  {/* content */}
</div>
```

### Interactive Card (Clickable)

```tsx
<div className="bg-slate-1 border border-border-subtle rounded-xl shadow-elev-1 cursor-pointer transition-all duration-150 hover:bg-panel hover:border-slate-5 hover:shadow-elev-2">
  {/* content */}
</div>
```

### Pillar-Accented Card (Left Border Stripe)

```tsx
// Content pillar card
<div className="bg-slate-1 border border-border-subtle border-l-4 border-l-brand-iris rounded-xl transition-all duration-150 hover:border-slate-5">
  {/* content */}
</div>
```

### KPI / Metric Cell (Use in Grid — Never as Standalone Wide Card)

```tsx
<div className="flex flex-col gap-1 px-4 py-3 bg-panel border border-border-subtle rounded-lg">
  <span className="text-xs font-semibold text-white/55 uppercase tracking-wide">EVI Score</span>
  <div className="flex items-baseline gap-2">
    <span className="text-2xl font-bold text-white/95 tabular-nums">72</span>
    <span className="text-xs font-bold text-semantic-success">↑3</span>
  </div>
  <span className="text-[13px] text-white/50">vs last 7d</span>
</div>
```

### Section Label (Uppercase, Small)

```tsx
<span className="text-xs font-semibold uppercase tracking-wide text-white/55">
  Section Title
</span>
```

### Body Text (Primary)

```tsx
<p className="text-sm text-white/85 leading-relaxed">
  Main content text.
</p>
```

### Body Text (Secondary)

```tsx
<p className="text-[13px] text-white/70 leading-relaxed">
  Supporting description text.
</p>
```

### Card Title

```tsx
<h5 className="text-[15px] font-semibold text-white/90 leading-snug">
  Card Title
</h5>
```

### Timestamp / Metadata

```tsx
<span className="text-xs text-white/50">2h ago</span>
```

### Primary Button (Pillar-Colored)

```tsx
// Content pillar
<button className="px-4 py-2.5 text-sm font-semibold bg-brand-iris text-white rounded-lg hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.25)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed">
  Action Label
</button>

// PR pillar
<button className="px-4 py-2.5 text-sm font-semibold bg-brand-magenta text-white rounded-lg hover:bg-brand-magenta/90 shadow-[0_0_16px_rgba(217,70,239,0.25)] transition-all duration-150">
  Action Label
</button>

// SEO / success state
<button className="px-4 py-2.5 text-sm font-semibold bg-semantic-success text-white rounded-lg hover:bg-semantic-success/90 shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all duration-150">
  Action Label
</button>
```

### Secondary Button (Ghost)

```tsx
<button className="px-4 py-2.5 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150">
  Secondary Action
</button>
```

### Tertiary Button (Text Only)

```tsx
<button className="px-3 py-2 text-sm font-medium text-white/50 hover:text-white/80 hover:bg-slate-4/50 rounded-lg transition-colors">
  Tertiary
</button>
```

### Mode Badge

```tsx
// Manual
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-white/5 text-white/70 border-white/20">
  Manual
</span>

// Copilot
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-iris/10 text-brand-iris border-brand-iris/30">
  Copilot
</span>

// Autopilot
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30">
  Autopilot
</span>
```

### Status Badge

```tsx
// Success
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-semantic-success/10 text-semantic-success border-semantic-success/20">
  Done
</span>

// Warning
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20">
  At Risk
</span>

// Danger
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20">
  Blocked
</span>
```

### Pillar Badge

```tsx
// Content
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-iris/15 text-brand-iris border-brand-iris/30">
  Content
</span>

// PR
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30">
  PR
</span>

// SEO
<span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30">
  SEO
</span>
```

### AI Presence Dots

```tsx
// Idle — AI is watching but not active
<span className="w-2 h-2 rounded-full bg-slate-6" />

// Analyzing — cyan pulse
<span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]" />

// Generating — iris, steadier glow
<span className="w-2 h-2 rounded-full bg-brand-iris shadow-[0_0_8px_rgba(168,85,247,0.6)]" />

// Error
<span className="w-2 h-2 rounded-full bg-semantic-danger" />
```

### Input Field

```tsx
<input
  className="w-full px-3 py-2.5 text-sm text-white/90 bg-slate-3 border border-border-subtle rounded-lg placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/50 focus:ring-1 focus:ring-brand-cyan/20 transition-all duration-150"
  placeholder="Placeholder text"
/>
```

### Pane Header (Tri-pane Shell Pattern)

```tsx
<div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-gradient-to-r from-slate-1 to-page">
  <div className="flex items-center gap-2">
    <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
    <h3 className="text-lg font-semibold text-white/90 tracking-tight">Pane Title</h3>
  </div>
  {/* Optional controls */}
</div>
```

### Surface Shell Header — Unified Chrome Bar (CANONICAL — All Work Surfaces)

**CRITICAL: The old pattern (h1 + subtitle + large icon box) is ABOLISHED. Do not use it. Do not reference it. It wastes 25% of viewport height before any data appears.**

Every work surface uses a single unified 48px chrome bar that contains ALL of the following in one horizontal row:

```
[small pillar icon] [Surface Name text-sm] [divider] [Tab 1][Tab 2][Tab 3]... [flex-1 spacer] [SAGE tag] [EVI score] [Mode switcher ▾] [ⓘ icon] [+ Create ▾]
```

```tsx
{/* Single unified chrome bar — 48px, replaces header + tabs + ImpactStrip */}
<div className="flex items-center h-12 px-4 border-b border-border-subtle bg-slate-1 shrink-0 relative z-10">

  {/* LEFT: icon + title + divider + tabs */}
  <PillarIcon className="w-5 h-5 text-brand-[pillar] shrink-0" weight="regular" />
  <span className="text-sm font-semibold text-white/80 ml-2 shrink-0">Surface Name</span>
  <div className="w-px h-4 bg-white/10 mx-3 shrink-0" />
  {/* Tabs — inline, px-3 h-full, iris underline on active */}
  <button className="flex items-center gap-1.5 px-3 h-full text-sm font-medium text-white/95 relative">
    Tab Label
    {/* active underline */}
    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-iris rounded-t" />
  </button>

  {/* SPACER */}
  <div className="flex-1" />

  {/* RIGHT: SAGE + EVI + Mode + Explain + Create */}
  <div className="flex items-center gap-2 shrink-0">
    {/* SAGE tag */}
    <div className="flex items-center gap-1.5 max-w-[220px] truncate">
      <Lightning className="w-3.5 h-3.5 text-brand-iris shrink-0" />
      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-iris truncate">
        SAGE tag text
      </span>
    </div>
    <div className="w-px h-4 bg-white/10" />
    {/* EVI */}
    <div className="flex items-center gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">EVI</span>
      <span className="text-sm font-bold tabular-nums text-brand-cyan">72</span>
      <span className="text-xs text-semantic-success">↑3.1</span>
    </div>
    <div className="w-px h-4 bg-white/10" />
    {/* Mode switcher — see Visual Hierarchy section for per-mode styles */}
    <div className="relative" ref={modeDropdownRef}>
      <button className="flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-wider {mode-tokens}">
        <ModeIcon /> {modeLabel} <CaretDown className="w-3 h-3" />
      </button>
      {/* Dropdown: position right-0, z-[200] to prevent clipping */}
      <div className="absolute right-0 top-full mt-1 w-48 bg-slate-2 border border-slate-4 rounded-lg shadow-elev-3 py-1 z-[200]">
        {/* mode options */}
      </div>
    </div>
    {/* Explain — icon only, no text label */}
    <button className="p-1.5 rounded hover:bg-white/5 text-white/50 hover:text-white/80 transition-colors">
      <Info className="w-4 h-4" />
    </button>
    {/* Create — see Visual Hierarchy section for per-mode treatment */}
    <CreateButton mode={currentMode} />
  </div>
</div>
```

**Hard rules for this pattern:**
- `h-12` (48px) exactly. Never taller, never shorter.
- `bg-slate-1` — not gradient, not bg-page, not transparent.
- Pillar icon `w-5 h-5` inline — NO surrounding box, ring, or glow.
- Surface name `text-sm font-semibold` — NOT h1, NOT text-2xl, NOT text-xl.
- No subtitle. Ever. The surface name is sufficient identity.
- Mode dropdown: always `right-0 z-[200]` — never left-0 (causes viewport edge clipping).
- ImpactStrip component NOT rendered as a separate row — its elements (SAGE, EVI, mode) are inline in this bar.
- Explain button: icon-only. No text label.

**What this replaces (NEVER use these patterns again):**
```tsx
// ❌ ABOLISHED — wastes ~150px of viewport before any data
<div className="px-6 pt-6 pb-0">
  <div className="p-3 rounded-xl bg-brand-iris/10 ring-1 ...">  {/* icon box */}
  <h1 className="text-2xl font-bold ...">Surface Name</h1>         {/* h1 billboard */}
  <p className="text-[13px] ...">Descriptor subtitle</p>            {/* subtitle */}
</div>
<ImpactStrip ... />   {/* separate row */}
```

### Drawer / Modal Backdrop

```tsx
<div className="fixed inset-0 bg-page/70 backdrop-blur-sm z-40" onClick={onClose} />
```

### Scrollbar (Apply to Any Scrollable Pane)

```tsx
// Add className="prave-scroll" to the scrollable element, then:
<style jsx global>{`
  .prave-scroll::-webkit-scrollbar { width: 4px; }
  .prave-scroll::-webkit-scrollbar-track { background: transparent; }
  .prave-scroll::-webkit-scrollbar-thumb { background: #1F1F28; border-radius: 2px; }
  .prave-scroll::-webkit-scrollbar-thumb:hover { background: #2A2A35; }
`}</style>
```

### Impact Strip (Required on Every Work Surface)

```tsx
<div className="flex items-center gap-4 px-6 py-2 border-b border-border-subtle bg-slate-1/50">
  {/* SAGE Tag */}
  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">
    <span className="w-1.5 h-1.5 rounded-full bg-brand-iris" />
    SAGE
    <span className="font-normal normal-case text-white/40 ml-1">
      Authority gap: AI citations
    </span>
  </div>

  {/* EVI Score */}
  <div className="flex items-center gap-1.5">
    <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">EVI</span>
    <span className="text-sm font-bold text-brand-cyan tabular-nums">72</span>
    <span className="text-[11px] text-semantic-success">↑3</span>
  </div>

  {/* Mode Badge — right-aligned */}
  <div className="ml-auto">
    {/* Insert mode badge here */}
  </div>
</div>
```

---

## Navbar Specification

### CommandCenterTopbar (Canonical — All Routes)

Height: `h-16` (64px). This is the minimum for an enterprise topbar to read as authoritative. `h-14` (56px) reads as a mobile header.

Background: `bg-slate-1/95 backdrop-blur-xl` — slightly elevated from page, not pure page color.

```
[Logo + AI dot] [Divider] [Nav: CC | PR | Content | SEO | Calendar | Analytics] ......... [Omni-Tray pill] [AI status] [Chips] [Bell] [Avatar]
```

**Wordmark:** `text-xl font-bold` (20px minimum). The gradient from-brand-cyan via-brand-iris to-brand-magenta is correct and should be preserved — it communicates the three-pillar nature of the product.

**Nav items:** `text-[15px] font-medium` for inactive, `text-[15px] font-semibold` for active. Active state: `bg-brand-cyan/12 text-white border border-brand-cyan/25 shadow-[0_0_14px_rgba(0,217,255,0.18)]` with a 2px underline glow. This is already correct in the implementation.

**Omni-Tray pill:** Rounded-full, `w-64 xl:w-72`, should always show the ⌘K hint. This is the only search-like affordance in the topbar.

**Right cluster:** AI Active indicator → chips → bell → avatar. The bell should always have its notification badge rendered (even if empty state — just hide the badge, not the bell).

**What the topbar is NOT:**
- Not a second navigation layer. The surface shell tabs handle within-surface navigation.
- Not a breadcrumb. Breadcrumbs are for hierarchical content systems, not flat surface navigation.
- Not a search bar. The Omni-Tray is AI-first, not a filter input.

### AppSidebar (Legacy Shell — Non-CC Routes)

This sidebar currently renders for routes outside the main surfaces. It follows the same token rules as everything else. Key specs:

- Width: `w-64` (256px) — 72 (288px) is wider than necessary
- Logo: `text-xl font-bold text-gradient-hero` — consistent with topbar
- Nav items: `text-sm font-medium` — correct as-is
- Active state: same cyan accent pattern as topbar
- User section at bottom: avatar + name only, no email visible by default

---

## Glow Effects Reference

Glow effects are **functional signals**, not decoration. Use them to indicate:
- AI activity (cyan glow on analyzing dots)
- Active/selected state (pillar color glow on selected cards)
- Ready-to-execute state (success glow on primary CTA)

```
// Pillar glows
shadow-[0_0_16px_rgba(168,85,247,0.15)]   ← Content / iris (resting)
shadow-[0_0_20px_rgba(168,85,247,0.25)]   ← Content / iris (hover/active)
shadow-[0_0_16px_rgba(217,70,239,0.15)]   ← PR / magenta (resting)
shadow-[0_0_16px_rgba(0,217,255,0.15)]    ← SEO / cyan (resting)

// State glows
shadow-[0_0_16px_rgba(34,197,94,0.25)]    ← Success / ready-to-execute
shadow-[0_0_8px_rgba(0,217,255,0.6)]      ← AI analyzing dot
shadow-[0_0_8px_rgba(168,85,247,0.6)]     ← AI generating dot
```

**Never use glows on static, non-interactive elements.** A glow implies something is active, selected, or live.

---

## Mode-Aware Design Rules

Modes are not badge changes — they change the entire UI environment. When implementing a mode-aware component:

### Manual Mode
- Full queue visible, no AI filtering
- Dense tool aesthetics — creation surfaces prominent
- Direct manipulation affordances (drag handles, inline edit)
- AI suggestions collapsed or not shown
- `Create` button at full prominence

### Copilot Mode
- AI reasoning chips visible on each item (don't hide them behind clicks)
- Approve / Reject inline affordances on every actionable item
- SAGE proposal banner at top of queues
- Confidence indicators visible
- `Create` button present but secondary in the chrome bar

### Autopilot Mode
- Exception queue only — routine items hidden
- Activity log / execution status panel visible
- Kill switch accessible
- "All clear" empty state is valid and expected
- Tabs may change (e.g., "Content" → "Exceptions")
- `Create` button present as ghost/tertiary — user may still need to create content

**The rule:** If you've only changed the badge color and nothing else, you've implemented mode wrong.

---

## Visual Hierarchy per Mode (AUTHORITATIVE)

This section defines the **dominant → secondary → tertiary** action hierarchy for every mode on every work surface. This is composition law, not style preference. Claude Code must implement these hierarchies exactly — not approximate them.

### The Three Questions (Ask Before Every Component)

1. **What is the ONE thing this user's eye should land on first?** → That is the dominant element. It gets the most visual weight: largest, brightest, most contrast, most prominent position.
2. **What is available but not competing?** → Secondary. Present, styled, but clearly subordinate.
3. **What is there if you need it but invisible if you don't?** → Tertiary. Ghost button, icon-only, or text link.

**A page with two dominant elements has zero dominant elements.** If everything is loud, nothing is heard.

---

### Content Surface — Visual Hierarchy by Mode

#### Manual Mode

| Rank | Element | Position | Visual Treatment |
|------|---------|----------|------------------|
| **DOMINANT** | Create button | Chrome bar right cluster | `bg-brand-iris` filled, `px-4 py-2`, iris glow, full label "+ Create" with caret |
| **DOMINANT** | Asset work queue | Full viewport below chrome | Dense list/table, full width, all 5+ items visible immediately |
| Secondary | Filter bar | Top of queue | Single bar — search + inline pills, `bg-slate-3`, `h-9` |
| Secondary | Status strip | Below chrome bar | Compact `h-10`, CiteMind + pipeline metrics in single row |
| Tertiary | Explain | Chrome bar right | Icon-only `<Info>`, no label, `text-white/50` |
| Tertiary | Mode badge | Chrome bar right | Neutral `bg-white/5 text-white/70 border-white/20` — not calling attention |

**Manual mode Create implementation:**
```tsx
// DOMINANT — full iris fill, glow, prominent
<button className="flex items-center gap-2 px-4 py-2 bg-brand-iris text-white/95 text-sm font-semibold rounded-lg hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.25)] transition-all">
  <Plus className="w-4 h-4" /> Create <CaretDown className="w-3 h-3" />
</button>
```

---

#### Copilot Mode

| Rank | Element | Position | Visual Treatment |
|------|---------|----------|------------------|
| **DOMINANT** | SAGE Action Queue | Left ~60% of viewport | Full width of its column, cards with strong left-border accent |
| **DOMINANT** | "Approve & Create Brief →" | On every SAGE card | `bg-brand-iris` filled button, right-aligned on card, iris glow — this IS the Create action in Copilot |
| Secondary | Cross-Pillar Attribution | Right ~40% of viewport | Present and scannable, but narrower column |
| Secondary | CiteMind instrument strip | Below chrome bar | Full viewport width, compact `h-[90px]` |
| Secondary | Create (chrome bar) | Chrome bar right | **Ghost button** — `border border-white/15 text-white/60 hover:text-white/80` — available but not competing with SAGE CTAs |
| Tertiary | Dismiss | On every SAGE card | Text-only, `text-white/50`, no border |
| Tertiary | Explain | Chrome bar right | Icon-only |

**Copilot mode Create implementation — GHOST, not filled:**
```tsx
// SECONDARY — ghost, clearly subordinate to SAGE card CTAs
<button className="flex items-center gap-2 px-3 py-1.5 border border-white/15 text-white/60 text-sm font-medium rounded-lg hover:text-white/80 hover:border-white/25 hover:bg-white/5 transition-all">
  <Plus className="w-4 h-4" /> Create <CaretDown className="w-3 h-3" />
</button>
```

**Why:** In Copilot mode, "Approve & Create Brief" on SAGE cards IS the primary creation path. A dominant Create button in the chrome bar competes with it and splits user attention. The ghost style says "I'm here if you need me" without screaming.

---

#### Autopilot Mode

| Rank | Element | Position | Visual Treatment |
|------|---------|----------|------------------|
| **DOMINANT** | Exception queue | Left ~55% of viewport | Full column, exception cards with semantic urgency colors |
| **DOMINANT** | Pause Autopilot | Chrome bar / status bar | Visible kill switch — `border border-white/20 text-white/70`, always accessible |
| Secondary | Activity log | Right ~45% of viewport | Read-only, timestamped, no CTAs |
| Secondary | Autopilot status bar | Below chrome bar | `EXECUTING` label + ambient proof-of-work count |
| Tertiary | Create (chrome bar) | Chrome bar right | **Icon + text, tertiary style** — user may need to create despite automation |
| Tertiary | Explain | Chrome bar right | Icon-only |

**Autopilot mode Create implementation — TERTIARY, always present:**
```tsx
// TERTIARY — clearly demoted, but never removed
// User may always need to create content even in Autopilot
<button className="flex items-center gap-2 px-3 py-1.5 text-white/50 text-sm font-medium rounded-lg hover:text-white/70 hover:bg-white/5 transition-all">
  <Plus className="w-4 h-4" /> Create <CaretDown className="w-3 h-3" />
</button>
```

**Why:** Create is never removed. In Autopilot, the user's focus is on exceptions and system health — but they are never locked out of creating content. The tertiary style communicates "available, not urgent" without hiding the escape hatch.

---

### Create Button: Summary Table

| Mode | Style | Classes | Reasoning |
|------|-------|---------|----------|
| Manual | **Filled / Dominant** | `bg-brand-iris text-white/95 shadow-iris` | Creation is the primary workflow |
| Copilot | **Ghost / Secondary** | `border border-white/15 text-white/60` | SAGE card CTAs own "create" — this is the escape hatch |
| Autopilot | **Text / Tertiary** | `text-white/50 hover:bg-white/5` | Monitoring is primary — create available but not calling |

**Hard rule: Create is NEVER removed from any mode.** Demoted, yes. Removed, never.

---

### Margin & Edge-to-Edge Laws

These directly affect whether a design reads as enterprise-grade or template-grade:

**Chrome bar (`h-12`):** Zero internal content padding beyond `px-4`. The bar spans full viewport width.

**View content area:** The wrapper `div` that receives `{children}` from the shell has **zero padding**. Views own 100% of their internal spacing decisions.

**Full-bleed elements** (instrument strips, status bars, data tables): `w-full`, no `mx-*`, no `px-*` on their container. They touch both edges.

**Content within cards:** Cards themselves have `px-4 py-3` or `px-5 py-4`. The card is the spacing boundary — not the view wrapper.

```tsx
// ✅ Correct — view wrapper has zero padding
<div className="flex-1 min-h-0 overflow-hidden flex flex-col">
  {children}
</div>

// ❌ Wrong — padding creates margins on both sides of every view
<div className="flex-1 min-h-0 overflow-hidden flex flex-col px-6 py-4">
  {children}
</div>
```

**The margin test:** After implementing any view, take a screenshot at 1440px width. The left and right edges of full-bleed elements (instrument strips, data tables, status bars) must touch the viewport edge minus the scrollbar. If there is visible dark space on either side of a full-width element, the view wrapper has padding that must be removed.

---

## Pillar Accent Maps (Use These, Don't Rewrite)

```typescript
const pillarAccents = {
  content: {
    bg: 'bg-brand-iris/10',
    bgHover: 'bg-brand-iris/20',
    solidBg: 'bg-brand-iris',
    text: 'text-brand-iris',
    border: 'border-brand-iris/30',
    borderHover: 'border-brand-iris/50',
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.15)]',
    glowStrong: 'shadow-[0_0_24px_rgba(168,85,247,0.25)]',
    badge: 'bg-brand-iris/15 text-brand-iris border-brand-iris/30',
  },
  pr: {
    bg: 'bg-brand-magenta/10',
    bgHover: 'bg-brand-magenta/20',
    solidBg: 'bg-brand-magenta',
    text: 'text-brand-magenta',
    border: 'border-brand-magenta/30',
    borderHover: 'border-brand-magenta/50',
    glow: 'shadow-[0_0_16px_rgba(217,70,239,0.15)]',
    glowStrong: 'shadow-[0_0_24px_rgba(217,70,239,0.25)]',
    badge: 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30',
  },
  seo: {
    bg: 'bg-brand-cyan/10',
    bgHover: 'bg-brand-cyan/20',
    solidBg: 'bg-brand-cyan',
    text: 'text-brand-cyan',
    border: 'border-brand-cyan/30',
    borderHover: 'border-brand-cyan/50',
    glow: 'shadow-[0_0_16px_rgba(0,217,255,0.15)]',
    glowStrong: 'shadow-[0_0_24px_rgba(0,217,255,0.25)]',
    badge: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
  },
} as const;
```

---

## Anti-Patterns (Never Do These)

### Layout Anti-Patterns

```
❌ Full-width card for 3 or fewer data points
   → Use a grid cell or KPI row

❌ Cards for tabular/comparable data
   → Use a table with sortable columns

❌ Multiple full-width sections stacked vertically with no visual weight difference
   → Add sub-section hierarchy with headings, separators, or spacing

❌ Padding a component to fill available space
   → Set an explicit max-width and let it breathe

❌ Putting action buttons inside a section that shouldn't have actions
   → Check the surface contract
```

### Typography Anti-Patterns

```
❌ text-sm font-semibold   as a page/surface title  →  text-2xl font-bold
❌ text-sm                 as a section heading     →  text-xl or text-lg font-semibold
❌ text-xs                 for body text            →  text-sm minimum for prose
❌ text-[11px]             for prose or labels      →  text-xs + uppercase tracking
❌ text-[10px]             anywhere                 →  never
❌ same size for heading and body                   →  differentiate weight + opacity
❌ font-normal on a heading                         →  font-semibold minimum
❌ text-white/95           for body text            →  reserve for surface titles only
❌ tab text at text-[11px] uppercase                →  text-xs uppercase tracking-wide (12px)
```

### Background Anti-Patterns

```
❌  bg-gray-*          Use bg-slate-* or bg-page/bg-panel
❌  bg-zinc-*          Use bg-slate-* tokens
❌  bg-white           Use bg-white/X (always with opacity)
❌  bg-black           Use bg-page/X with opacity
❌  bg-[#050508]       Phantom value — use bg-page
❌  bg-[#0D0D12]       Phantom value — use bg-slate-1
❌  bg-[#111116]       Phantom value — use bg-panel (bg-slate-2)
❌  bg-[#111118]       Phantom value — use bg-panel (bg-slate-2)
❌  bg-[#16161E]       Phantom value — use bg-slate-2 or bg-slate-3
❌  bg-[#1A1A24]       Phantom value — use border-border-subtle
```

### Text Anti-Patterns

```
❌  text-white          Missing opacity — use text-white/90 minimum
❌  text-gray-*         Use text-white/X scale
❌  text-zinc-*         Use text-white/X scale
```

### Border Anti-Patterns

```
❌  border-[#1A1A24]    Phantom value — use border-border-subtle
❌  border-[#2A2A36]    Phantom value (off-by-1) — use border-slate-5
❌  border-gray-*       Use border-border-subtle or border-slate-*
```

### Opacity Anti-Patterns

```
❌  bg-white/20/50      Invalid chained opacity — Tailwind ignores this silently
❌  bg-white/30/10      Invalid chained opacity
❌  bg-brand-iris/8     Non-standard step — use /10
❌  bg-brand-cyan/8     Non-standard step — use /10
❌  bg-brand-magenta/8  Non-standard step — use /10
❌  any-class/X/Y       Only one opacity modifier per class
```

### Architecture Anti-Patterns

```
❌  const surfaceTokens = { page: '#0A0A0F', ... }
    → Defines a JS token object with hex values. Bypasses Tailwind. Delete it.

❌  style={{ backgroundColor: '#13131A' }}
    → Inline hex styles. Bypasses DS entirely. Use className instead.

❌  Copying existing component colors without checking DS_v3_COMPLIANCE_CHECKLIST.md
    → Existing components contain phantom values. Always check the source.
```

### Design Anti-Patterns

```
❌  Changing only the badge color when mode changes
    → Mode changes the entire UI environment, not just the badge

❌  Showing AI reasoning hidden behind a click in Copilot mode
    → Copilot requires reasoning visible inline

❌  Removing the Create button entirely in any mode
    → Create is always present. Demoted in Copilot (ghost), tertiary in Autopilot (text), never removed.

❌  Using the same Create button style across all modes
    → Manual = filled dominant, Copilot = ghost secondary, Autopilot = text tertiary. See Visual Hierarchy section.

❌  Glow effects on static, non-interactive elements
    → Glows signal activity/selection, not visual interest

❌  Using brand-cyan for Content pillar elements
    → brand-cyan is SEO. brand-iris is Content. Pillar colors are not interchangeable.

❌  Decorative animations that don't reflect real state
    → "ai-pulse" on a dot means something is actually happening. Don't animate for aesthetics.

❌  Dense information without hierarchy
    → Every data point needs a visual weight. Metrics > metadata > timestamps.

❌  Navbar at h-14 (56px)
    → Use h-16 (64px) minimum for enterprise authority.
```

---

## What "Good" Looks Like

A well-executed Pravado component has:

1. **Correct background step** — card is `bg-panel`, its container is `bg-slate-1` or `bg-page`
2. **Single border value** — `border-border-subtle` with `hover:border-slate-5` on interactive elements
3. **Proper text hierarchy** — surface title at `text-2xl/bold`, section at `text-xl/semibold`, pane at `text-lg/semibold`, card at `text-[15px]/semibold`, body at `text-sm/normal`
4. **Pillar-correct accent** — iris for Content, magenta for PR, cyan for SEO, never mixed
5. **Functional glow only** — if there's a glow, something is active, selected, or live
6. **Mode-aware content** — not just a badge swap; the displayed information changes
7. **Impact Strip** — present on every work surface shell, always
8. **Width-justified layout** — no component spans more width than its content requires
9. **Data shape drives layout** — tabular data in tables, decisions in cards, metrics in KPI rows

If all nine are true, the component is compliant and visually correct. If any are missing, flag before shipping.

---

## Pre-Commit Checklist

```
[ ] Surface title is text-2xl font-bold (if this component has a page h1)
[ ] Section headings use text-xl or text-lg, not text-sm
[ ] Card titles use text-[15px] font-semibold — not text-sm like body
[ ] No text-[10px] anywhere
[ ] No text-[11px] outside of badge labels with uppercase
[ ] No text-xs without uppercase tracking-wide
[ ] No phantom hex values (see banned list above)
[ ] No bg-gray-*, bg-zinc-*, text-gray-* classes
[ ] No plain text-white or bg-white (must have opacity)
[ ] No bg-black (use bg-page/X)
[ ] No invalid opacity chains (/X/Y patterns)
[ ] No JS hex constant objects
[ ] Brand color opacities use standard steps only (/5 /10 /15 /20 /25 /30 /40 /50 /60 /70 /80 /90)
[ ] Pillar colors match their pillar (iris=Content, magenta=PR, cyan=SEO)
[ ] Glows only on interactive/active/live elements
[ ] Mode changes affect more than just the badge
[ ] Chrome bar is the unified shell pattern (h-12, single row, no h1/subtitle/icon-box)
[ ] Create button style matches mode hierarchy (filled=Manual, ghost=Copilot, text=Autopilot)
[ ] Create button present in ALL three modes — never removed
[ ] View content wrapper has zero padding (px-0, no mx-*)
[ ] Full-bleed elements touch viewport edges
[ ] Mode dropdown positioned right-0 z-[200] — no viewport clipping
[ ] ImpactStrip NOT rendered as separate row — elements inline in chrome bar
[ ] Impact Strip elements present in chrome bar right cluster (SAGE tag, EVI, mode badge)
[ ] AI presence dot color matches actual state
[ ] Width justified: no full-width component for fewer than 5 data points
[ ] Layout matches data shape (tables for tabular, cards for decisions, KPI row for metrics)
[ ] Topbar height h-16 minimum
```
