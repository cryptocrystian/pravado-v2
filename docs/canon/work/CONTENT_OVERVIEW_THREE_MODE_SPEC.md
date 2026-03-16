# CONTENT OVERVIEW — THREE-MODE DESIGN SPEC
**Status:** ACTIVE — For Claude Code execution
**Date:** 2026-03-03
**Supersedes:** All prior ContentOverviewView briefs for layout direction
**Authority:** Synthesizes MODE_UX_ARCHITECTURE.md, AUTOMATION_MODE_CONTRACTS_CANON.md, CONTENT_MODE_RESPONSIBILITY_MAP.md

---

## THE CORE PRINCIPLE (READ THIS FIRST)

These are three separate products sharing one navigation shell. They are not one layout with a badge swap. When mode changes, the layout, information hierarchy, primary actions, tab labels, and available affordances all change meaningfully. A user switching modes should feel like they stepped into a different cockpit — same aircraft, different instrumentation for a different phase of flight.

**Manual = Workbench.** The operator is flying manually. Full controls visible. AI is in the background.
**Copilot = Plan Review.** AI has prepared the flight plan. Pilot reviews and authorizes each leg.
**Autopilot = Exception Console.** Autopilot is flying. Pilot monitors. Only alerts that require intervention surface.

---

## BEFORE WRITING CODE

Read in order:
1. `/docs/skills/PRAVADO_DESIGN_SKILL.md`
2. `/docs/canon/DS_v3_1_EXPRESSION.md`
3. `/docs/canon/DS_v3_COMPLIANCE_CHECKLIST.md`
4. This document in full

---

## FILES TO MODIFY

- `apps/dashboard/src/components/content/views/ContentOverviewView.tsx` — full rewrite
- `apps/dashboard/src/components/content/ContentWorkSurfaceShell.tsx` — two targeted fixes

Do not touch types.ts, mock data, ContentAssetCard, or the route page.

---

## SHELL FIXES (Do These First)

### Fix 1: Margin source
The content area wrapper still has internal padding reintroducing margins. Find and remove ALL padding from the content area wrapper div. The view must render edge-to-edge within the shell. Views own their internal spacing — the shell provides zero padding.

### Fix 2: Tab behavior in Autopilot mode
The shell already has some Autopilot tab filtering. Verify and enforce:
- In Autopilot: "Content" tab label changes to "Exceptions"
- In Autopilot: Library and Insights tabs are hidden
- In Autopilot: A new "Activity Log" tab appears (key: `'activity-log'`, icon: `ClockCounterClockwise`)
- In Manual and Copilot: standard tabs (Content, Library, Calendar, Insights)

---

## THE MOCK DATA CONTRACT

The existing `CONTENT_OVERVIEW_MOCK` in the view contains the Copilot-mode data. You need to add mode-specific mock data. Add these to the mock data section at the top of the view:

```typescript
// Manual mode mock — full asset queue, no SAGE filtering
const MANUAL_QUEUE_MOCK = [
  { id: 'm1', title: 'Enterprise AEO Guide: Winning AI Citations at Scale', status: 'published', citeMindScore: 91, citeMindStatus: 'citation-ready', contentType: 'Guide', updatedAt: 'Feb 27', wordCount: 4800, entityTags: ['ENTERPRISE', 'AEO STRATEGY'] },
  { id: 'm2', title: 'PR Technology Buyer Guide 2026', status: 'draft', citeMindScore: 42, citeMindStatus: 'needs-work', contentType: 'Guide', updatedAt: 'Feb 28', wordCount: 1200, entityTags: ['PR TECHNOLOGY', 'BRAND'] },
  { id: 'm3', title: 'What Is AEO? The Definitive Definition', status: 'review', citeMindScore: 68, citeMindStatus: 'good-standing', contentType: 'FAQ Page', updatedAt: 'Mar 1', wordCount: 2100, entityTags: ['AEO STRATEGY'] },
  { id: 'm4', title: 'AI Citation Optimization: 2026 Playbook', status: 'draft', citeMindScore: 0, citeMindStatus: 'pending', contentType: 'Guide', updatedAt: 'Mar 2', wordCount: 600, entityTags: ['AEO STRATEGY', 'ENTERPRISE'] },
  { id: 'm5', title: 'Pravado vs. Competitors: Content Authority Comparison', status: 'draft', citeMindScore: 0, citeMindStatus: 'pending', contentType: 'Comparison', updatedAt: 'Mar 2', wordCount: 400, entityTags: ['PR TECHNOLOGY'] },
];

// Autopilot mode mock — exceptions only
const AUTOPILOT_EXCEPTIONS_MOCK = [
  { id: 'e1', title: 'PR Technology Buyer Guide 2026', issue: 'CiteMind BLOCKED', reason: '3 unverified claims in section 2. Cannot publish until resolved.', urgency: 'critical', citeMindScore: 42 },
  { id: 'e2', title: 'AI Citation Optimization: 2026 Playbook', issue: 'Deadline in 48h', reason: 'Scheduled for Mar 5. Draft is incomplete at 600 words. Human review required.', urgency: 'high', citeMindScore: 0 },
];

const AUTOPILOT_ACTIVITY_MOCK = [
  { id: 'a1', action: 'CiteMind quality analysis', asset: 'Enterprise AEO Guide', result: 'Passed — score 91', timestamp: '2h ago', type: 'quality' },
  { id: 'a2', action: 'Derivative generated', asset: 'Enterprise AEO Guide → AEO snippet', result: 'Ready for PR surface', timestamp: '2h ago', type: 'derivative' },
  { id: 'a3', action: 'Brief generated', asset: 'Q2 AI Tools Roundup', result: 'Awaiting Copilot approval', timestamp: '5h ago', type: 'brief' },
  { id: 'a4', action: 'CiteMind quality analysis', asset: 'What Is AEO? Definition', result: 'Passed — score 68', timestamp: '8h ago', type: 'quality' },
];
```

---

## MODE A: MANUAL — "WORKBENCH"

### Mental model
The user is the operator. They control everything. AI is invisible unless explicitly invoked. This is a professional content management tool, not an AI dashboard.

### What the user sees

**Above fold — full viewport width, zero margins:**

A compact status bar across the top (same instrument strip aesthetic, but no SAGE proposals — just the raw metrics):
- CiteMind score: `74` with sub-metrics (Citation Eligibility 71 · AI Ingestion 78 · Cross-Pillar 65)
- Pipeline: DRAFT 3 → REVIEW 1 → PUBLISHED 4
- Ops stats: 3 in progress · 4 published this month · Top: 91
- NO SAGE proposals visible. NO attribution feed visible. Manual mode = AI invisible.

Below the status bar, the full asset work queue takes the entire viewport:
- A single filter/search bar (not three stacked rows — one bar with inline pills: `[Search content...]  [All Status ▾]  [All Types ▾]  [All Entities ▾]`)
- Dense asset list below — use ContentAssetCard at standard density
- Each card shows: drag handle (⠿) on left, status badge, title, CiteMind score, content type, updated date, word count, entity tags
- Drag handle is visible — in Manual mode the user controls queue order
- Direct edit affordance on hover: "Edit →" appears on each card
- Cards are NOT pre-sorted by AI priority — they appear in last-updated order
- No AI reasoning chips, no approve/reject affordances, no SAGE suggestions

**Primary action:** `+ Create` button in header (full prominence). This is the entry point in Manual mode.

**AI state:** Idle indicator only — a small dot in the header (white/30, no animation, no label). AI is present but dormant.

### What does NOT appear in Manual
- SAGE Action Queue or any SAGE proposal cards
- Cross-pillar attribution feed
- EVI impact projections on assets
- Approve / Reject affordances
- AI reasoning chips
- "AI evaluated" or "AI suggests" language anywhere

### Layout summary
```
┌─────────────────── FULL WIDTH ───────────────────────┐
│ [CiteMind 74] [sub-metrics] [Pipeline] [Ops stats]   │  ~80px
├──────────────────────────────────────────────────────┤
│ [Search...] [All Status ▾] [All Types ▾] [All Ent ▾] │  ~48px
├──────────────────────────────────────────────────────┤
│ ⠿  PUBLISHED  Enterprise AEO Guide...    91  Guide   │
│ ⠿  NEEDS REV  PR Technology Buyer...     42  Guide   │
│ ⠿  REVIEW     What Is AEO?...            68  FAQ     │
│ ⠿  DRAFT      AI Citation Optimization... 0  Guide   │
│ ⠿  DRAFT      Pravado vs Competitors...   0  Comp.   │
└──────────────────────────────────────────────────────┘
```

---

## MODE B: COPILOT — "PLAN REVIEW"

### Mental model
AI has done the strategic analysis. The user's job is to review what it found, understand the reasoning, and authorize or reject each proposed action. Creation is secondary — review and decision-making is primary.

### What the user sees

This is the layout we've been iterating on. Keep the Option B structure (CiteMind instrument strip + two-column SAGE/Attribution). Enforce these specifics:

**CiteMind instrument strip — full width, zero margins, ~90px:**
- Left: Score `74` (text-5xl) + sparkline + `+6 pts · 30d` trend
- Center-left: Sub-metrics in divider-separated cells (Citation Eligibility 71 · AI Ingestion 78 · Cross-Pillar 65)
- Center-right: Pipeline flow (DRAFT 3 → REVIEW 1 → PUBLISHED 4) with `PIPELINE` label
- Right: Ops stats (3 IN PROGRESS · 4 PUBLISHED · TOP CITEMIND 91 · RESOLVE 2)
- Background: `bg-slate-1` with subtle `border-b border-border-subtle`
- Zero horizontal padding on the strip itself — it bleeds edge to edge

**Two-column main area, zero outer margins:**

Left column (~60% width) — SAGE Action Queue:
- Header: ⚡ `SAGE ACTION QUEUE` · badge count `3`
- **Approve / Reject affordances on each card** — this was missing before and is required in Copilot
  - Each card has TWO actions at the bottom: `Approve & Create Brief →` (iris filled button) + `Dismiss` (ghost text button)
  - The existing `Create from Brief →` becomes `Approve & Create Brief →` in Copilot mode
- AI reasoning chip on each card: a small `SAGE REASONING` label above the competitive gap text
- Confidence indicator on each card: `Confidence 0.87` in text-xs text-white/45 next to effort
- Cross-pillar tail line: `→ PR pitch queued · AEO snippet ready` (already implemented — keep it)
- Priority left-border stripe (already implemented — keep it)

Right column (~40% width) — Cross-Pillar Attribution + Active Themes:
- Keep exactly as implemented in last iteration
- Attribution feed with 4 events visible
- Active Themes below attribution with divider

**AI state in Copilot:** `SAGE READY` indicator in the ImpactStrip — a small pulsing iris dot with label

### Key difference from last iteration
Add approve/reject affordances to every SAGE card. That's the primary missing element that makes this genuinely Copilot mode rather than just a display.

---

## MODE C: AUTOPILOT — "EXCEPTION CONSOLE"

### Mental model
The system is running. The user is a supervisor, not an operator. The interface should feel quiet and authoritative, not dense and action-oriented. Silence is good news.

### What the user sees

**Tab bar changes in Autopilot (shell fix already specified above):**
- "Content" → "Exceptions"
- Library and Insights hidden
- "Activity Log" tab added

**Above fold — Autopilot Status Bar, full width, ~80px:**
Different from Copilot's CiteMind strip. Autopilot's header bar is about system status, not authority metrics:
- Left: AI state indicator — large `EXECUTING` label with animated iris dot + `12 items supervised` (text-xs text-white/45, no CTA, no urgency — proof-of-work only)
- Center: Brief health summary — `CiteMind PASSING 3/4` · `BLOCKED 1` (in semantic-danger)
- Right: Kill switch — `⏸ Pause Autopilot` button (ghost style, border-white/20, text-white/60) + mode badge `AUTOPILOT`
- Background: `bg-slate-1` with subtle `border-b border-border-subtle`

**Two-column main area (when on Exceptions tab):**

Left column (~55% width) — Exception Queue:
- If exceptions exist: list of exception cards (use AUTOPILOT_EXCEPTIONS_MOCK)
  - Each exception card: red/amber left border by urgency · asset title · issue type badge · reason text (full, never truncated) · `Resolve →` CTA
  - CRITICAL exceptions: `border-l-2 border-semantic-danger` + subtle `bg-semantic-danger/5`
  - HIGH exceptions: `border-l-2 border-semantic-warning` + subtle `bg-semantic-warning/5`
- If no exceptions: **"All Clear" empty state** — this is a valid and positive state
  - Large `✓` in semantic-success, `All clear — no exceptions` heading, `12 items executing normally` subtext
  - This should feel like a reward, not an error state

Right column (~45% width) — Recent Activity:
- Header: `ACTIVITY LOG` with `View full log →` link
- List of auto-handled actions from AUTOPILOT_ACTIVITY_MOCK
- Each entry: action type icon (colored by type) · action description · asset name · result · timestamp
- Entries are READ-ONLY — no CTAs, no approve/reject (these happened automatically)
- Cross-pillar hooks shown as compact read-only summary at bottom: collapsed by default, `Show cross-pillar impact ▾` expand toggle

**AI state in Autopilot:** `EXECUTING` with animated cyan dot in the status bar (already in the header)

**What does NOT appear in Autopilot:**
- SAGE Action Queue / proposals (AI is already executing on these)
- Create button (demoted — small text link in header only, not prominent CTA)
- Drag handles or reorder controls
- Approve/reject affordances
- Full asset work queue
- CiteMind instrument strip (replaced by the Autopilot status bar)

### Layout summary
```
┌──────────── FULL WIDTH ────────────────────────────┐
│ ● EXECUTING  12 supervised │ 3/4 PASSING │ ⏸ Pause │  ~80px
├────────────────────────────────────────────────────┤
│ EXCEPTIONS (2)              │ ACTIVITY LOG          │
│                             │                       │
│ 🔴 PR Tech Buyer Guide      │ ✓ CiteMind analysis   │
│    CiteMind BLOCKED         │   Enterprise AEO...   │
│    3 unverified claims...   │   Passed · 2h ago     │
│    [Resolve →]              │                       │
│                             │ ✓ Derivative generated│
│ 🟡 AI Citation Playbook     │   AEO snippet ready   │
│    Deadline in 48h          │   2h ago              │
│    Draft incomplete...      │                       │
│    [Resolve →]              │ ○ Brief generated     │
│                             │   Awaiting approval   │
│                             │   5h ago              │
└────────────────────────────────────────────────────┘
```

---

## MODE SWITCHING MECHANICS

The view receives `mode` as a prop from the shell. The entire return is mode-gated:

```typescript
if (mode === 'manual') return <ManualView data={data} />;
if (mode === 'copilot') return <CopilotView data={data} />;
if (mode === 'autopilot') return <AutopilotView data={data} />;
```

Three separate render functions within the same file. They share DS tokens and component primitives (ContentAssetCard, etc.) but are NOT the same layout with conditional sections. The conditional approach produces tangled code and makes the "three products" mental model impossible to enforce.

**Mode transition:** When the ImpactStrip ModeSwitcher changes mode, show a brief `evaluating` state — iris dot animating for ~800ms — before rendering the new mode layout. This communicates that the AI is recalculating, not just swapping a badge.

---

## MARGIN FIX — UNIVERSAL RULE

**Rule:** The view renders edge-to-edge within its container. No outer `px-*` or `mx-*` on the root div of ContentOverviewView. Internal sections apply their own padding where needed (e.g., card groups with `px-4`, text sections with `px-6`). Full-bleed elements (the instrument strip, the status bar, section dividers) have zero horizontal padding and span the full width.

The instrument strip specifically must touch both edges of the viewport — no card border, no padding, no rounding on its outer container.

---

## DS COMPLIANCE (NON-NEGOTIABLE, ALL THREE MODES)

Run DS_v3_COMPLIANCE_CHECKLIST.md before finishing. Required:
- Zero phantom hex values
- Zero `bg-gray-*` / `text-gray-*` / `bg-zinc-*`
- Zero plain `text-white` without opacity modifier
- Zero `hover:-translate-y-*`
- All `text-[11px]` has `font-bold uppercase tracking-wider`
- `brand-iris` for Content accent everywhere — never `brand-cyan` for Content elements
- CiteMind score: `text-5xl font-bold tabular-nums` in Copilot mode
- Exception urgency in Autopilot uses semantic tokens only (`semantic-danger`, `semantic-warning`)

---

## ACCEPTANCE CRITERIA

### Manual mode
- [ ] No SAGE proposals visible anywhere
- [ ] No AI reasoning chips on queue items
- [ ] Drag handles present on queue items
- [ ] Filter bar is a single bar (not 3 stacked rows)
- [ ] Create button is the primary action (prominent)
- [ ] AI state shows as dormant (no animation, no label)
- [ ] Full asset list visible (5 items from mock)

### Copilot mode
- [ ] Every SAGE card has `Approve & Create Brief →` + `Dismiss` actions
- [ ] SAGE reasoning chip present on every proposal
- [ ] Confidence indicator present on every proposal
- [ ] Cross-pillar tail line present on every proposal
- [ ] CiteMind instrument strip spans full viewport width with zero side margins
- [ ] Attribution feed visible above fold (right column)
- [ ] No drag handles on anything

### Autopilot mode
- [ ] Tabs changed: Exceptions / Calendar / Activity Log (Content and Insights hidden)
- [ ] Autopilot status bar replaces CiteMind instrument strip
- [ ] "12 items supervised" shown as ambient indicator (no CTA, no pulsing)
- [ ] Kill switch / Pause button visible
- [ ] Exception queue shows 2 exceptions from mock
- [ ] Each exception shows full reason text (never truncated)
- [ ] Activity log shows 4 items (read-only, no CTAs)
- [ ] Create button demoted (not the primary CTA)
- [ ] No SAGE proposals visible
- [ ] No approve/reject affordances
- [ ] "All clear" empty state exists as a component (even if not shown with current mock)

### Universal
- [ ] Mode switching triggers ~800ms evaluating transition state before new layout renders
- [ ] Zero horizontal margins on root view container
- [ ] Instrument strip / status bar spans edge to edge
- [ ] DS compliance checklist passes for all three modes
- [ ] TypeScript compiles clean
- [ ] No other files modified except ContentOverviewView.tsx and ContentWorkSurfaceShell.tsx

---

## WHEN DONE

Confirm:
1. All three modes render correctly at 1440px viewport
2. Acceptance criteria status per mode
3. Any DS violations flagged with `// DS-VIOLATION: [reason]`
4. No other files modified
