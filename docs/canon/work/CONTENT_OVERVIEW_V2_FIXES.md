# CONTENT OVERVIEW V2 — TARGETED FIXES
**Status:** ACTIVE — For Claude Code execution
**Scope:** Two specific fixes only. Do not touch anything else.
**Date:** 2026-03-03

---

## CONTEXT

The V2 layout is correct and approved. Two visual defects remain:

1. **Attribution column dead space** — after the 4th event, the right column has a large empty dark region in the lower half
2. **CiteMind strip gap** — a visible empty horizontal stretch between the `CROSS-PILLAR` sub-metric and the ops stats block

Fix these two things only. No layout changes. No structural changes. No other files.

---

## FILE TO MODIFY

`apps/dashboard/src/components/content/views/ContentOverviewView.tsx` only.

---

## FIX 1: Attribution Column Dead Space

**Problem:** The right column (`Cross-Pillar Attribution`) renders at a fixed height matching the SAGE column. After the 4th attribution event, the lower ~40% of the column is empty background.

**Fix:** Move the `Active Themes` strip from below the fold into the attribution column, directly below the last attribution event. It belongs here — it's thematically related to content strategy context, and it fills the space with real information.

**Implementation:**
- Remove the standalone `Active Themes` full-width strip from its current below-fold position
- Render it inside the right column, below the attribution feed, separated by a `border-t border-border-subtle` divider and a section label `ACTIVE THEMES` in `text-[11px] font-bold uppercase tracking-wider text-white/40`
- Theme cards should stack vertically in this context (not horizontal scroll) since the column width is narrower — each card one row: theme name left, asset count + CiteMind score right
- If there are more than 4 themes, show 4 and a `See all →` link
- The column should now fill its full height with content, no empty region

---

## FIX 2: CiteMind Instrument Strip Gap

**Problem:** The instrument strip spans the full viewport width but has a visible empty horizontal gap between the sub-metrics block (Citation Eligibility / AI Ingestion / Cross-Pillar) and the ops stats block (3 IN PROGRESS / 4 PUBLISHED / 91 TOP CITEMIND / 2 RESOLVE).

**Fix:** Add a `Pipeline` indicator between these two blocks that shows the content pipeline flow as a compact inline element.

**Implementation:**
- Between the sub-metrics block and the ops stats block, add a pipeline flow indicator
- Layout: `DRAFT 3 → REVIEW 1 → PUBLISHED 4` as a horizontal inline chain
- Each stage: count in `text-base font-bold tabular-nums text-white/90`, stage label in `text-[11px] uppercase tracking-wider text-white/40`
- Arrows between stages: `→` in `text-white/25`
- Section label above: `PIPELINE` in `text-[11px] font-bold uppercase tracking-wider text-white/40`
- Use the mock data values already in the component (drafts: 3, published: 4 — add review: 1 to the mock data if not present)
- This element should be centered in the gap using `flex-1` with `flex items-center justify-center` so it naturally fills whatever space exists between the two existing blocks

---

## DS COMPLIANCE

Both fixes must pass:
- No phantom hex values
- No `bg-gray-*`, `text-gray-*`
- No plain `text-white`
- `brand-iris` for Content accents
- All `text-[11px]` with `uppercase tracking-wider`

Run DS_v3_COMPLIANCE_CHECKLIST.md Section 1A before confirming done.

---

## WHEN DONE

Confirm:
1. Attribution column: no empty region below event 4
2. CiteMind strip: gap filled with pipeline indicator
3. Active Themes now renders inside the right column (not as a separate below-fold strip)
4. DS compliance passes
5. No other files modified
