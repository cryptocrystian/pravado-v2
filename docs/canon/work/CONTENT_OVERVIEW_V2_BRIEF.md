# CONTENT OVERVIEW — V2 REDESIGN BRIEF
**Status:** ACTIVE — For Claude Code execution
**Supersedes:** CONTENT_OVERVIEW_REDESIGN_BRIEF.md (the 3-zone/column-percentage brief)
**Date:** 2026-03-02

---

## CONTEXT: WHY THIS BRIEF EXISTS

The V1 redesign produced a technically compliant layout (clean tokens, correct hierarchy, no DS violations) but made a structural mistake: it prescribed a rigid 3-column layout (28% / 48% / 24%) that:

1. Forces the cross-pillar attribution feed — Pravado's primary competitive differentiator — **below the fold**
2. Allocates 24% of a 1580px viewport to four isolated numbers (Zone C), producing dead space
3. Treats three information categories as equal weight when they are not
4. Imposes column constraints that limit design creativity

This brief replaces column prescriptions with **outcome requirements**. You determine the best layout. The design system gives you the pattern language. The outcomes tell you what success looks like.

---

## THE ONE RULE BEFORE YOU START

Read these files in full before writing a single line of code:

1. `/docs/skills/PRAVADO_DESIGN_SKILL.md` — patterns, banned values, anti-patterns
2. `/docs/canon/DS_v3_1_EXPRESSION.md` — tokens
3. `/docs/canon/DS_v3_COMPLIANCE_CHECKLIST.md` — pre-commit checklist

---

## FILES TO MODIFY

- `apps/dashboard/src/components/content/views/ContentOverviewView.tsx` — full rewrite
- `apps/dashboard/src/components/content/ContentWorkSurfaceShell.tsx` — one targeted fix (see below)

Do not touch any other files. Types, mock data, the route page, and ContentAssetCard are correct.

---

## SHELL FIX (Required — Do This First)

In `ContentWorkSurfaceShell.tsx`, find the content area wrapper:

```tsx
<div className={`flex-1 min-h-0 overflow-hidden flex flex-col px-6 py-4 ...`}>
```

Remove `px-6 py-4` from this wrapper entirely. The shell must not impose horizontal margins. Each view owns its own edge treatment. The ContentOverviewView will handle its own internal layout — some sections will be full-bleed to the viewport edge, others will have internal padding where appropriate.

---

## OUTCOME REQUIREMENTS

These are non-negotiable. Layout is your decision. These outcomes are not.

### Outcome 1: No Scrolling to See Critical Information

A user landing on this page must be able to see ALL of the following without scrolling:

- The Content CiteMind score (the number, its 30-day trend, and its sub-metrics)
- All active SAGE proposals (currently 3) with enough detail to understand the action
- At minimum 2 cross-pillar attribution events showing the PR → Content → AEO chain
- The operational pipeline status (drafts in progress, published this month)

If any of these require scrolling on a standard 1440px-wide, 900px-tall viewport, the layout has failed.

### Outcome 2: SAGE Proposals Are the Hero

SAGE proposals are the primary action surface. They must receive the most visual weight and the most horizontal space. A user's eye should land on SAGE first (or tied-first with the CiteMind score). The competitive gap text inside each proposal — the specific intelligence about what CompetitorX is doing that we're not — must be immediately readable, never truncated, never compressed.

### Outcome 3: Cross-Pillar Attribution Is Above the Fold

The attribution feed (PR coverage → CiteMind lift → EVI delta) is the single feature no competitor can replicate. It cannot be below the fold. It must be visible on load. Its position in the layout should reinforce its importance — not relegated to a footer or appended below.

### Outcome 4: No Dead Space

Every region of the viewport that is not a deliberate breathing gap between semantic sections must contain information. Zone C in V1 (three isolated numbers in a tall column) is the failure pattern to avoid. If operational stats only need 80px of height, they should occupy 80px — not a 400px column.

### Outcome 5: The Layout Must Scale Down Gracefully

Below-fold content (Active Themes strip, Recent Assets grid) should follow naturally from the above-fold layout. It should feel like a continuation, not a completely different visual grammar.

---

## INFORMATION ARCHITECTURE

This is what must be present. How you arrange it is up to you.

### A — CiteMind Authority Status

The Content CiteMind score is a live instrument reading, not a stat widget. It must read as a live signal.

**Must include:**
- The score number: `74` — large, colored by range (see DS), dominant
- Label: `CONTENT CITEMIND SCORE`
- Trend: `+6 pts · 30d` with directional arrow in semantic-success
- 30-day sparkline or mini trend chart — this was missing in V1 and created dead space; it turns the score from a static number into a live instrument
- Sub-metrics in a tight grid (no nested cards, border dividers between cells):
  - Citation Eligibility: 71
  - AI Ingestion: 78
  - Cross-Pillar Impact: 65

**Score color rules:**
- 80–100: `text-semantic-success` with subtle green glow
- 60–79: `text-brand-cyan`
- 40–59: `text-semantic-warning`
- 0–39: `text-semantic-danger`

### B — SAGE Action Queue

Three competitive intelligence proposals. Each is a decision unit: read it, decide whether to act.

**Each proposal must include:**
- Priority badge: CRITICAL / HIGH / MEDIUM (colored by severity)
- Content type + topic cluster label
- EVI impact range (right-aligned, `text-semantic-success`, prominent)
- Proposal title (card heading size)
- Competitive gap text: the specific intelligence. `text-sm text-white/65`. 3 lines max. This is the highest-value text in the entire surface — treat it accordingly. Never truncate it.
- **Cross-pillar tail line** — this was missing in V1 and is the key differentiator expression: a single line showing what other pillars are queued as follow-on actions. Example: `→ PR pitch queued · AEO snippet ready`. Text-xs, text-white/45, styled as a downstream chain indicator.
- Effort estimate
- "Create from Brief →" CTA button with iris glow

**Hover behavior:** Edge glow only (`hover:shadow-[0_0_0_1px_rgba(168,85,247,0.2)]`). No physical lift (no translate-y).

**Priority left-border stripe:**
- CRITICAL: `border-l-2 border-semantic-danger`
- HIGH: `border-l-2 border-semantic-warning`
- MEDIUM: `border-l-2 border-brand-cyan`

### C — Cross-Pillar Attribution Feed

This is the moat. No competitor can show this. It must be above the fold.

Each event in the feed is a causal chain item — something that happened in one pillar that moved a metric in another pillar.

**Each event includes:**
- Pillar source icon (PR = magenta, Content = iris, SEO/AEO = cyan)
- Description: the specific action and its cross-pillar consequence
- EVI delta (right-aligned, colored, tabular-nums): `+4.2`
- Source label: `PR Surface — TechCrunch placement`

**Feed items (from mock data):**
1. TechCrunch coverage raised AI Marketing cluster CiteMind → +4.2
2. Enterprise AEO Guide cited in 3 ChatGPT responses → +1.8
3. PR pitch to Sarah Chen queued → +0.0 projected / +1.8 if secured
4. FAQ schema deployed lifted AI Ingestion 6pts → +0.9

### D — Operational Status

Four data points. They need minimal space. Do not give them a full column.

- In Progress: 3 active drafts
- Published This Month: 4
- Top CiteMind This Month: "The Complete Guide to AI Visibility in 2026" · score 91 (in semantic-success)
- Needs Attention: 2 assets with CiteMind issues · "Resolve" link

These could live as a compact horizontal bar, a tight sidebar strip alongside the attribution feed, a row of inline stats above or below the SAGE queue, or integrated into the CiteMind status area. They should not be their own major layout zone.

### E — Active Themes Strip (Below Fold Is Acceptable)

Horizontal scroll row of theme cards. Each card: theme name, asset count, CiteMind score colored by range, trend arrow.

This is useful context but not critical-path information. Below-fold is acceptable here — but it must be the first thing below the fold, not buried further.

### F — Recent Assets (Below Fold)

3-column grid of ContentAssetCard components at comfortable density. "View library →" link. These already look correct from V1 — reuse that pattern.

---

## LAYOUT LATITUDE

You have full creative latitude on layout structure. Some approaches to consider — you are not required to use any of these:

**Option A: Wide SAGE + right sidebar**
SAGE proposals take 60–65% width as the dominant column. CiteMind score, attribution feed, and operational stats share a right sidebar — stacked vertically, no forced equal height.

**Option B: Full-width header strip + two zones**
A single full-width header strip containing CiteMind score + operational stats in a compact horizontal bar (like the ImpactStrip pattern). Below it: SAGE proposals (left, ~60%) + attribution feed (right, ~40%). Everything above fold.

**Option C: Asymmetric dashboard**
CiteMind score as a hero block top-left (~25% width). Attribution feed directly to its right (~35% width). Operational stats as a compact column on the far right (~15% width). SAGE proposals spanning the full width below these three — horizontal card row instead of vertical stack.

**Option D: Something else entirely**
If you see a better structure that satisfies all five outcomes, use it. The outcomes are the constraint. The structure is your design decision.

---

## ABSOLUTE CONSTRAINTS (NON-NEGOTIABLE)

These are not suggestions. They are requirements regardless of layout choice.

### Layout
- No scrolling required to see CiteMind score, all 3 SAGE proposals, and 2+ attribution events
- No dead space — every region earns its space
- Full viewport width — the shell no longer imposes `px-6` margins (you fixed that above)
- SAGE proposals receive the most horizontal space and visual weight

### DS Token Compliance (from DS_v3_COMPLIANCE_CHECKLIST.md)
- Zero phantom hex values — no `#050508`, `#0D0D12`, `#111116`, or any other raw hex
- No `bg-gray-*`, `text-gray-*`, `bg-zinc-*`, `bg-neutral-*`
- No plain `text-white` — always `text-white/[opacity]`
- No `hover:-translate-y-*` — edge glow only
- `brand-iris` for all Content pillar accents — never `brand-cyan` or `brand-magenta` for Content
- All `text-[11px]` must have `uppercase tracking-wider`
- All `text-xs` standalone labels must have `uppercase tracking-wide`

### Typography
- CiteMind score: `text-5xl font-bold tabular-nums` minimum (this is an instrument reading)
- SAGE competitive gap text: `text-sm` (14px) minimum, never truncated
- EVI impact numbers: `tabular-nums` always
- Cross-pillar tail line: `text-xs text-white/45`
- Operational stats numbers: `text-2xl font-bold tabular-nums`

### Moat Expression
- Every SAGE proposal must include the cross-pillar tail line (`→ PR pitch queued · AEO snippet ready`)
- The attribution feed must be visible above the fold — this is the feature no competitor has

---

## ACCEPTANCE CRITERIA

### 5-Second Test
A new user landing on this page can identify within 5 seconds:
- [ ] What is my Content CiteMind score and is it trending up or down?
- [ ] What is the single most important thing SAGE wants me to do?
- [ ] Has my content strategy produced measurable cross-pillar results?

### No-Scroll Test
On a 1440 × 900 viewport, without scrolling:
- [ ] CiteMind score visible
- [ ] All 3 SAGE proposals visible (or 2 full + 1 partially visible indicating scroll)
- [ ] At least 2 attribution feed events visible
- [ ] Operational stats visible

### DS Compliance
Run through DS_v3_COMPLIANCE_CHECKLIST.md before declaring done. Every item must pass.

### Dead Space Test
No layout region larger than 2 card heights contains only empty background.

### Moat Expression Test
- [ ] Cross-pillar tail line present on every SAGE proposal
- [ ] Attribution feed is above the fold
- [ ] The feed visually communicates cause-and-effect (not just a list of events)

---

## WHEN DONE

Confirm:
1. Which acceptance criteria pass
2. Layout approach chosen and brief rationale (one sentence)
3. Any DS violations flagged with `// DS-VIOLATION: [reason]`
4. No other files modified except the two specified
