# WORK ORDER: Content Hub Overview — Full Visual Redesign
**Status:** READY FOR IMPLEMENTATION  
**Priority:** P0 — Blocks all Content surface progress  
**Architect:** Claude (claude.ai)  
**Implementer:** Claude Code  
**Canon:** `DS_v3_PRINCIPLES.md`, `DS_v3_1_EXPRESSION.md`, `DS_v3_COMPLIANCE_CHECKLIST.md`, `docs/skills/PRAVADO_DESIGN_SKILL.md`

---

## Context

The current `ContentOverviewView.tsx` and `ContentAssetCard.tsx` are functionally correct but visually non-compliant. They read as a generic SaaS analytics dashboard rather than a Bloomberg Terminal–style AI command center. The rebuild was done without reading `docs/skills/PRAVADO_DESIGN_SKILL.md` first. This brief corrects that.

**You MUST read `docs/skills/PRAVADO_DESIGN_SKILL.md` in full before writing a single line of code.**

---

## Files to Modify

1. `apps/dashboard/src/components/content/views/ContentOverviewView.tsx` — Full rewrite
2. `apps/dashboard/src/components/content/components/ContentAssetCard.tsx` — Full rewrite

Do NOT modify the shell, mock data, or route page. Those are correct.

---

## Design Direction (Non-Negotiable)

**The mental model:** A senior editor at a Bloomberg terminal who runs PR, Content, and SEO simultaneously. Every pixel earns its place. Information is surfaced at exact weight. The interface communicates that a powerful system is working on the user's behalf.

**What this is NOT:**
- Not a rounded-card analytics dashboard
- Not a friendly SaaS tool with warm whitespace
- Not a notification feed with priority labels
- Not Excel data stacked into cards

---

## ContentOverviewView — Full Specification

### Layout: Three Zones, Full-Bleed, No Forced Columns

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ZONE A: Authority Status     │  ZONE B: SAGE Action Queue    │  ZONE C: Ops  │
│  (CiteMind + sub-metrics)     │  (Proposals, gap language)    │  (Pipeline)   │
│  ~28% width                  │  ~48% width                   │  ~24% width   │
├──────────────────────────────────────────────────────────────────────────────┤
│  ACTIVE THEMES STRIP (horizontal scroll)                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│  CROSS-PILLAR FEED (left half) │  RECENT ASSETS (right half, 3-col grid)     │
└──────────────────────────────────────────────────────────────────────────────┘
```

All zones render above the fold on a 1280px+ screen. Below-fold content scrolls naturally.

### Zone A — Authority Status (CiteMind Command)

The CiteMind score is the primary metric for the Content pillar. It must read like an instrument reading, not a stat widget.

**Design requirements:**
- Background: `bg-slate-1` with a left border stripe `border-l-2 border-brand-iris` and a subtle ambient glow `shadow-[inset_0_0_40px_rgba(168,85,247,0.04)]`
- Label: `text-[11px] font-bold uppercase tracking-wider text-white/50` — "CONTENT CITEMIND SCORE"
- Score number: `text-5xl font-bold tabular-nums` colored by range:
  - 80+: `text-semantic-success` + `shadow-[0_0_20px_rgba(34,197,94,0.15)]`
  - 60–79: `text-brand-cyan`
  - 40–59: `text-semantic-warning`
  - <40: `text-semantic-danger`
- Score suffix: `/100` in `text-xl text-white/30`
- Trend line directly below score: `+6 pts` with up-arrow in `text-semantic-success` + `text-[13px]`, then `text-[13px] text-white/40` for "30d"
- Divider: `border-t border-border-subtle my-4`
- Sub-metrics (3 cells in a `grid grid-cols-3 gap-0` — no gap, with dividers between):
  - Each cell: `text-xl font-bold tabular-nums text-white/90` for the number
  - Label below: `text-[11px] font-bold uppercase tracking-wider text-white/40`
  - No background on cells — they inherit Zone A background
  - Dividers between cells: `border-r border-border-subtle`
- Sub-metrics: Citation Eligibility / AI Ingestion / Cross-Pillar Impact

Do NOT use a card inside a card. Zone A IS the card. The sub-metrics sit directly inside it without additional container backgrounds.

### Zone B — SAGE Action Queue

This is the most important zone. The competitive gap language is the highest-value content on the entire surface. It must read with visual gravity.

**Zone header:**
```
⚡ SAGE Action Queue                                    [3 badge]
```
- `⚡` in `text-brand-iris`
- "SAGE Action Queue" in `text-sm font-semibold text-white/90`
- Badge: `px-2 py-0.5 text-[11px] font-bold rounded-full bg-brand-iris/20 text-brand-iris border border-brand-iris/30`

**Each proposal card:**

Background: `bg-slate-1 border border-border-subtle rounded-xl` with `hover:border-slate-5 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.15)]` on hover — edge glow, not physical lift.

Left border stripe using `border-l-2` colored by priority:
- critical: `border-l-semantic-danger`
- high: `border-l-semantic-warning`
- medium: `border-l-brand-cyan`

**Card internal layout (top to bottom, no wasted space):**

Row 1 — Badges + EVI impact (space-between):
```
[CRITICAL badge] [Guide · AEO Strategy]          [+8–12 EVI pts]
```
- Priority badge: `text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border` with semantic-danger colors for critical
- Content type + topic: `text-[13px] text-white/50` separated by `·`
- EVI impact: `text-base font-bold text-semantic-success tabular-nums` — this is the reward. Make it land. Right-aligned. The range format `+8–12` with `text-[11px] text-white/40 ml-0.5` for "EVI pts"

Row 2 — Proposal title:
- `text-[15px] font-semibold text-white/90 leading-snug mt-2`

Row 3 — Competitive gap text:
- This is the key differentiator. Use `text-sm text-white/65 leading-relaxed mt-1.5`
- The ⚡ icon at start: `text-brand-iris opacity-80`
- 3 lines max — `line-clamp-3`
- This must be readable. Do NOT reduce below 14px. Do NOT apply opacity below /60.

Row 4 — Effort + CTA (space-between, aligned bottom):
- Left: `text-[13px] text-white/40` — "High effort · 6–8 hours"
- Right: Primary button — `px-4 py-2 text-sm font-semibold bg-brand-iris text-white rounded-lg hover:bg-brand-iris/90 shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all duration-150`
- Button text: "Create from Brief →"

**Empty state:** Full zone height, centered: checkmark icon in `text-brand-iris/40`, "All caught up" in `text-sm text-white/50`, "SAGE has no open proposals" in `text-[13px] text-white/30`.

### Zone C — Operations Status

**Design:** `bg-slate-1 border border-border-subtle rounded-xl` — same as other zones.

Four stat cells stacked vertically, separated by `border-t border-border-subtle`:

**Cell 1 — In Progress**
- Number: `text-3xl font-bold text-white/90 tabular-nums`
- Label: `text-[11px] font-bold uppercase tracking-wider text-white/40`
- Sub-label: "active drafts" in `text-[13px] text-white/40`

**Cell 2 — Published This Month**
- Number: `text-3xl font-bold text-white/90 tabular-nums`
- Same label pattern

**Cell 3 — Top CiteMind This Month**
- Label: `text-[11px] font-bold uppercase tracking-wider text-semantic-success/80` — use success color for "TOP CITEMIND"
- Asset title: `text-sm font-semibold text-white/85` — truncated at 2 lines
- Score: `text-xl font-bold text-semantic-success tabular-nums` inline after title
- Score label: `text-[11px] text-semantic-success/70`

**Cell 4 — Needs Attention**
- If count > 0: Number in `text-2xl font-bold text-semantic-warning`
- Sub-label: "assets with CiteMind issues" in `text-[13px] text-semantic-warning/70`
- Resolve link: `text-[13px] text-semantic-warning/70 hover:text-semantic-warning underline`
- If count === 0: Show `text-sm text-semantic-success/80` "All assets healthy ✓"

### Active Themes Strip

Full-width horizontal scroll strip below the three zones. `mt-6` spacing.

Header row:
```
ACTIVE THEMES    [→ See all]
```
- "ACTIVE THEMES": `text-[11px] font-bold uppercase tracking-wider text-white/50`
- "See all": `text-[13px] text-white/40 hover:text-white/70`

Theme cards (horizontal scroll, `gap-3`, `overflow-x-auto`, hide scrollbar):
Each card: `flex-shrink-0 w-[180px] bg-slate-1 border border-border-subtle rounded-lg px-4 py-3 hover:border-slate-5 transition-all duration-150`

Inside each theme card:
- Theme name: `text-sm font-semibold text-white/85`
- Asset count: `text-[13px] text-white/50 mt-0.5` — "7 assets"
- CiteMind score: `text-2xl font-bold tabular-nums mt-2` colored by range (same rules as Zone A)
- Trend arrow: inline next to score, `text-[13px]` — `↑ text-semantic-success`, `↓ text-semantic-danger`, `→ text-white/40`

### Cross-Pillar Attribution Feed

Left half of the below-fold section. `w-1/2 pr-4`.

Header:
```
CROSS-PILLAR ATTRIBUTION
```
`text-[11px] font-bold uppercase tracking-wider text-white/50`

Each event row: `flex items-start gap-3 py-3 border-b border-border-subtle`

- Icon container: `w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center` with pillar-appropriate background (`bg-brand-magenta/10` for PR, `bg-brand-iris/10` for Content, `bg-brand-cyan/10` for SEO)
- Icon: 14px, pillar-colored
- Text block (flex-1):
  - Description: `text-sm text-white/70 leading-relaxed`
  - Source: `text-[13px] text-white/40 mt-0.5`
- EVI delta (right-aligned, flex-shrink-0):
  - Positive: `text-sm font-bold text-semantic-success tabular-nums`
  - Zero/pending: `text-sm text-white/30`
  - Negative: `text-sm font-bold text-semantic-danger tabular-nums`

### Recent Assets

Right half of the below-fold section. `w-1/2 pl-4 border-l border-border-subtle`.

Header row:
```
RECENT ASSETS                                    [View library →]
```

Three-column grid: `grid grid-cols-3 gap-3 mt-3`

Each cell uses `ContentAssetCard` in comfortable density mode (spec below).

---

## ContentAssetCard — Full Specification

This is a single-file component with three density modes. All three must be correct.

### Shared Principles for All Densities

1. **CiteMind score is ALWAYS the dominant visual element** — largest text on the card, top-right, colored
2. **Title is secondary** — prominent but visually subordinate to the score
3. **Entity tags and metadata are tertiary** — smallest, dimmest, bottom of card
4. **EVI delta is always present** when non-zero — the cross-pillar signal

### Comfortable Density (≤ 12 cards)

Card: `bg-slate-1 border border-border-subtle rounded-xl p-4 flex flex-col gap-2 hover:border-slate-5 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.1)] transition-all duration-150 cursor-pointer`

**Row 1 — Top strip (space-between):**
Left: Status badge
Right: **CiteMind block:**
```
[score]
CITEMIND
[status text]
```
- Score: `text-2xl font-bold tabular-nums` — colored by range
- "CITEMIND" label: `text-[11px] font-bold uppercase tracking-wider` — same color, /70 opacity
- Status text: `text-[11px]` — same color, /60 opacity — "Citation-ready" / "Good standing" / "Needs work" / "Low eligibility"
- Wrap the score block in `flex flex-col items-end`

Score color rules:
- 80+: `text-semantic-success`
- 60–79: `text-brand-cyan`
- 40–59: `text-semantic-warning`
- <40: `text-semantic-danger`

Status badge (left side of Row 1):
- Use the `text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border` pattern with appropriate semantic colors for the asset status (published, draft, needs_review, etc.)

**Row 2 — Title:**
`text-[15px] font-semibold text-white/90 leading-snug line-clamp-2`

**Row 3 — Authority intent:**
`text-[13px] text-white/55 leading-snug line-clamp-1`

**Row 4 — Secondary metrics (horizontal, compact):**
`text-[13px] text-white/50` — "87 AI Ingestion  84 Cross-Pillar" with a `·` separator and the metric names dimmer than the numbers.

**Row 5 — Footer (space-between):**
Left: Entity tag pills — `px-2 py-0.5 text-[11px] font-bold rounded bg-brand-iris/10 text-brand-iris border border-brand-iris/20` — max 2 visible + "+N" overflow
Right: EVI delta — `text-[13px] font-bold tabular-nums` in `text-semantic-success` / `text-semantic-danger` / `text-white/40` + `text-[11px] text-white/40 ml-0.5` for "EVI pts"

**Bottom edge: Word count + date:**
`text-[11px] text-white/35` — "3,200 words · Updated Feb 17"

### Standard Density (13–24 cards)

Card: same container as comfortable but `p-3`

Row 1: Status badge (left) + CiteMind block (right) — CiteMind `text-xl font-bold`
Row 2: Title only — `text-sm font-semibold text-white/90 line-clamp-1`
Row 3: EVI delta (right-aligned)
No secondary metrics. No entity tags. No metadata.

### Compact Density (25+ cards)

Row layout: `flex items-center gap-3 px-3 py-2.5 bg-slate-1 border border-border-subtle rounded-lg`

- CiteMind dot: `w-2.5 h-2.5 rounded-full flex-shrink-0` — colored by range (no number, just color signal)
- Title: `text-sm font-medium text-white/85 truncate flex-1`
- Score number: `text-sm font-bold tabular-nums flex-shrink-0` — colored by range
- Status badge: `text-[11px] font-bold uppercase flex-shrink-0` — colored text only, no bg

---

## Acceptance Criteria

Before marking this complete, every item must pass:

**5-Second Test:**
1. Open `/app/content` cold
2. In 5 seconds without clicking, can you identify: (a) the Content CiteMind score, (b) the most critical SAGE proposal, (c) which assets need attention?
3. If no to any, the design has failed

**Hierarchy Test:**
1. Take a screenshot
2. Convert to grayscale
3. The CiteMind score in Zone A must still read as the visually heaviest element in that zone
4. The EVI impact range in Zone B proposals must still be visually distinct from body text
5. If not, typography or weight is wrong

**DS Compliance:**
```
[ ] No phantom hex values (run Section 1A of DS_v3_COMPLIANCE_CHECKLIST.md)
[ ] No bg-gray-*, text-gray-*, bg-zinc-* classes
[ ] No plain text-white (must have /XX opacity)
[ ] No invalid opacity chains
[ ] Brand colors on correct pillars (iris = Content everywhere)
[ ] CiteMind score text size is text-2xl or larger in comfortable mode
[ ] Competitive gap text in proposals is text-sm (14px) minimum
[ ] Entity tags are text-[11px] uppercase (correct for badges)
[ ] EVI delta uses tabular-nums
[ ] Cards use bg-slate-1 or bg-slate-2, not phantom values
[ ] Hover states use edge glow, not physical lift (no translate-y)
```

**Visual Quality Check:**
- Does the surface feel like a command center or a dashboard?
- Do the SAGE proposals communicate urgency and competitive intelligence, or do they feel like notifications?
- Is the CiteMind score the first thing your eye goes to in Zone A?
- Do the asset cards have a clear decision hierarchy (score → title → context)?

---

## What NOT to Do

- Do not add decorative gradients to backgrounds that don't justify them
- Do not use `rounded-2xl` on cards — use `rounded-xl` (12px) per DS
- Do not use physical lift hover (`hover:-translate-y-1`) — use edge glow only
- Do not add motion to static data elements — no fade-in on score numbers
- Do not use full-width sections for small amounts of data
- Do not make the competitive gap text smaller than 14px to fit more in — truncate or expand the card instead
- Do not add a fourth zone or additional panels — three zones above fold is the spec

---

## Reference Files

- `docs/skills/PRAVADO_DESIGN_SKILL.md` — Read first, every time
- `docs/canon/DS_v3_1_EXPRESSION.md` — Token values
- `docs/canon/DS_v3_COMPLIANCE_CHECKLIST.md` — Banned values + pre-commit check
- `components/command-center/ActionCard.tsx` — Reference component that passes DS compliance
- `components/command-center/EviScoreCard.tsx` — Reference for numeric display patterns
