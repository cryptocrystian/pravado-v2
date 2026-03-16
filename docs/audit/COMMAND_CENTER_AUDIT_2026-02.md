# COMMAND CENTER IMPLEMENTATION AUDIT
**Date:** 2026-02-18  
**Auditor:** Architect session  
**Method:** Line-by-line comparison of all frozen components against `COMMAND_CENTER_CONTRACT.md`, `COMMAND_CENTER_GOLDEN_FLOW.md`, `MODE_UX_ARCHITECTURE.md`, and `docs/skills/PRAVADO_DESIGN_SKILL.md`  
**Status:** GAP LIST — Not a code review, not a ticket. Fix priorities set below.

---

## Files Audited

| File | Status |
|------|--------|
| `command-center/page.tsx` | ✅ Read |
| `command-center/TriPaneShell.tsx` | ✅ Read |
| `command-center/ActionCard.tsx` | ✅ Read |
| `command-center/ActionStreamPane.tsx` | ✅ Read |
| `command-center/StrategyPanelPane.tsx` | ✅ Read |
| `command-center/pillar-accents.ts` | ✅ Read |
| `command-center/CalendarPeek.tsx` | ❌ Not read — spot-check needed |
| `command-center/EntityMap.tsx` | ❌ Not read — spot-check needed |
| `command-center/ActionModal.tsx` | ❌ Not read — spot-check needed |
| `command-center/ActionHoverBrief.tsx` | ❌ Not read — spot-check needed |
| `command-center/IntelligenceCanvasPane.tsx` | ❌ Not read — spot-check needed |

Files not read are flagged in the gap list where contract invariants require verification.

---

## Gap Summary (by severity)

| # | Gap | File(s) | Severity | Category |
|---|-----|---------|----------|---------|
| 1 | `surfaceTokens` JS hex object — banned pattern | `pillar-accents.ts` | 🔴 Critical | DS Token |
| 2 | `modeStyles.manual.bg = 'bg-white/20/50'` — invalid chained opacity | `pillar-accents.ts` | 🔴 Critical | DS Token |
| 3 | Phantom hex values throughout ActionStreamPane | `ActionStreamPane.tsx` | 🔴 Critical | DS Token |
| 4 | Phantom hex values throughout StrategyPanelPane | `StrategyPanelPane.tsx` | 🔴 Critical | DS Token |
| 5 | `border-[#2A2A36]` — off-by-1 phantom value | `ActionCard.tsx` | 🔴 Critical | DS Token |
| 6 | `text-white` without opacity on pane headers | `TriPaneShell.tsx` | 🟠 High | DS Token |
| 7 | Non-standard opacity steps (`/8`) on semantic colors | `ActionStreamPane.tsx`, `StrategyPanelPane.tsx` | 🟠 High | DS Token |
| 8 | Impact Strip absent — required on every work surface | `page.tsx` | 🟠 High | Missing Feature |
| 9 | Mode badges incomplete — only "Auto" shown on cards | `ActionCard.tsx` | 🟠 High | Contract Gap |
| 10 | Strategy Panel width doesn't match contract at non-xl | `TriPaneShell.tsx` | 🟡 Medium | Contract Gap |
| 11 | Upgrade hook button in Strategy Panel — possible contract violation | `StrategyPanelPane.tsx` | 🟡 Medium | Contract Gap |
| 12 | Autopilot mode badge border `/25` — non-standard step | `ActionCard.tsx` | 🟡 Medium | DS Token |
| 13 | CalendarPeek height contract `h-[280px]` — unverified | `CalendarPeek.tsx` | 🟡 Medium | Unverified |
| 14 | Entity Map zone layout invariant — unverified | `EntityMap.tsx` | 🟡 Medium | Unverified |
| 15 | `cardElevated: '#1A1A24'` in `surfaceTokens` — phantom in banned list | `pillar-accents.ts` | 🔴 Critical | DS Token |
| 16 | `borderSubtle: '#16161E'` in `surfaceTokens` — phantom in banned list | `pillar-accents.ts` | 🔴 Critical | DS Token |
| 17 | `borderHover: '#2A2A36'` in `surfaceTokens` — off-by-1 phantom | `pillar-accents.ts` | 🔴 Critical | DS Token |

---

## Gap Detail

---

### GAP-001 🔴 `surfaceTokens` JS hex object — BANNED PATTERN
**File:** `pillar-accents.ts`  
**Lines:** ~60–70

```typescript
// CURRENT — BANNED
export const surfaceTokens = {
  page: '#0A0A0F',
  card: '#13131A',
  cardElevated: '#1A1A24',   // ← PHANTOM (banned list)
  border: '#1F1F28',
  borderSubtle: '#16161E',   // ← PHANTOM (banned list)
  borderHover: '#2A2A36',    // ← PHANTOM off-by-1 (banned list)
  hoverOverlay: 'rgba(255, 255, 255, 0.02)',
  focusRing: 'ring-brand-cyan/30',
};
```

**Problem:** The DS audit identified JS hex token objects as a banned pattern. They bypass Tailwind's purging and create a parallel token system outside the DS. Three of the six hex values are in the banned phantom list.

**Fix:** Delete `surfaceTokens` entirely. Any consumers referencing it must switch to Tailwind DS classes (`bg-page`, `bg-panel`, `border-border-subtle`, etc.). Search codebase for `surfaceTokens.` usage before deleting.

---

### GAP-002 🔴 Invalid chained opacity — `'bg-white/20/50'`
**File:** `pillar-accents.ts`  
**Line:** `modeStyles.manual.bg`

```typescript
// CURRENT — INVALID TAILWIND
manual: {
  bg: 'bg-white/20/50',  // ← Tailwind silently ignores /50, applies /20 only
  ...
}
```

**Problem:** Chained opacity (`/X/Y`) is invalid Tailwind. The class silently resolves to the first value only. This is explicitly listed as a banned anti-pattern.

**Fix:**
```typescript
manual: {
  bg: 'bg-white/5',   // ← Use single opacity step from standard scale
  text: 'text-white/70',
  ...
}
```

---

### GAP-003 🔴 Phantom hex values throughout ActionStreamPane
**File:** `ActionStreamPane.tsx`

Phantom values found inline in className strings:

| Value Used | Correct Token | Count |
|-----------|--------------|-------|
| `bg-[#0D0D12]` | `bg-slate-1` | ~4 |
| `bg-[#0A0A0F]` | `bg-page` | ~2 |
| `bg-[#1A1A24]` | `bg-slate-3` | ~6 |
| `border-[#1A1A24]` | `border-border-subtle` | ~5 |
| `bg-[#1A1A24]` in LoadingSkeleton | `bg-slate-3 border-border-subtle` | 2 |
| `border-l-white/10` in LoadingSkeleton | Acceptable — no phantom | — |

All `#0D0D12`, `#0A0A0F`, `#1A1A24` values are from the DS audit's banned phantom list.

**Fix:** Global replace in this file:
- `bg-[#0D0D12]` → `bg-slate-1`
- `bg-[#0A0A0F]` → `bg-page`
- `bg-[#1A1A24]` → `bg-slate-3`
- `border-[#1A1A24]` → `border-border-subtle`

---

### GAP-004 🔴 Phantom hex values throughout StrategyPanelPane
**File:** `StrategyPanelPane.tsx`

Same phantom values as GAP-003, plus non-standard opacity steps:

| Value Used | Correct Token |
|-----------|--------------|
| `bg-[#0D0D12]` | `bg-slate-1` |
| `bg-[#0A0A0F]` | `bg-page` |
| `bg-[#1A1A24]` | `bg-slate-3` |
| `border-[#1A1A24]` | `border-border-subtle` |
| `bg-semantic-danger/8` | `bg-semantic-danger/10` |
| `bg-semantic-warning/8` | `bg-semantic-warning/10` |
| `bg-brand-cyan/8` | `bg-brand-cyan/10` |

The `/8` opacity is non-standard — DS uses `/10` as the minimum bg opacity for semantic chips.

**Fix:** Same global replace as GAP-003, plus change all `/8` → `/10` on semantic/brand color backgrounds.

---

### GAP-005 🔴 `border-[#2A2A36]` — off-by-1 phantom
**File:** `ActionCard.tsx`

```tsx
// CURRENT — off-by-1 phantom (#2A2A36 vs correct #2A2A35)
${isSelected ? `${pillar.glow} border-[#2A2A36]` : ''}
```

**Fix:**
```tsx
${isSelected ? `${pillar.glow} border-slate-5` : ''}
```

`border-slate-5` maps to `#2A2A35`. The current value `#2A2A36` is one digit off — creates a hex value outside the DS token system.

---

### GAP-006 🟠 `text-white` without opacity on pane headers
**File:** `TriPaneShell.tsx`

```tsx
// CURRENT — banned, plain text-white
<h2 className="text-sm font-semibold text-white tracking-tight">Action Stream</h2>
<h2 className="text-sm font-semibold text-white tracking-tight">Intelligence Canvas</h2>
<h2 className="text-sm font-semibold text-white tracking-tight">Strategy Panel</h2>
```

**Fix:** `text-white` → `text-white/90` on all three pane header h2 elements. Plain `text-white` is always banned; pane titles are primary headings so `/90` is correct.

---

### GAP-007 🟠 Non-standard opacity steps on semantic colors
**Files:** `ActionStreamPane.tsx`, `StrategyPanelPane.tsx`

```tsx
// CURRENT — non-standard
bg-semantic-danger/8
bg-semantic-warning/8
bg-brand-cyan/8
```

DS standard opacity steps for bg: `/5 /10 /15 /20 /25 /30 /40 /50 /60 /70 /80 /90`. The `/8` step is off-standard and may not be in the Tailwind safelist.

**Fix:** All `/8` → `/10` on semantic and brand color backgrounds.

---

### GAP-008 🟠 Impact Strip absent — required on every work surface
**File:** `page.tsx` (and all work surface shells)

**Contract source:** `MODE_UX_ARCHITECTURE.md` Section 6:
> "Required in every mode on every surface: ModeSwitcher in header (shows current mode), Impact Strip with mode badge visible, AI state dot reflecting current automation state"

The Command Center page renders `TriPaneShell` directly with no Impact Strip above or below it. No SAGE tag, no EVI score display, no mode badge anywhere on the page shell.

**Note:** The Strategy Panel *contains* an EVI display (the hero score), but this is not the same as the Impact Strip. The Impact Strip is a persistent surface-level strip — always visible regardless of which pane the user is looking at — not embedded inside one of the three scrollable panes.

**Fix:** Add Impact Strip component between the page header and `TriPaneShell`. Minimal V1 implementation:

```tsx
// In page.tsx, above <TriPaneShell>
<ImpactStrip
  sageTag="Cross-pillar authority gap identified"
  eviScore={strategyPanel.data?.evi?.score ?? null}
  eviDelta={strategyPanel.data?.evi?.delta_7d ?? null}
  mode="copilot"  // from pillar mode config — wired in Phase 2
/>
```

This is a new component to build. Strip anatomy is defined in `PRAVADO_DESIGN_SKILL.md` — the gold-standard pattern is already documented.

---

### GAP-009 🟠 Mode badges incomplete — only "Auto" shown
**File:** `ActionCard.tsx`

The comfortable mode card only shows a badge when `action.mode === 'autopilot'`:

```tsx
{/* CURRENT — only autopilot gets a badge */}
{action.mode === 'autopilot' && !isCompleted && (
  <span className="px-2 py-1 text-[11px] font-medium uppercase rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/25">
    Auto
  </span>
)}
```

Per `MODE_UX_ARCHITECTURE.md` and the design skill, all three modes should have distinct badges:

| Mode | Badge |
|------|-------|
| Manual | `bg-white/5 text-white/70 border-white/20` |
| Copilot | `bg-brand-iris/10 text-brand-iris border-brand-iris/30` |
| Autopilot | `bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30` |

**Fix:** Replace the single conditional with:
```tsx
<span className={`px-2 py-1 text-[11px] font-bold uppercase rounded border ${
  action.mode === 'autopilot' ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30' :
  action.mode === 'copilot'   ? 'bg-brand-iris/10 text-brand-iris border-brand-iris/30' :
                                'bg-white/5 text-white/70 border-white/20'
}`}>
  {action.mode === 'autopilot' ? 'Auto' : action.mode === 'copilot' ? 'Copilot' : 'Manual'}
</span>
```

Also fix the border on the autopilot badge: current implementation uses `border-brand-cyan/25` — non-standard step. Must be `border-brand-cyan/30`.

---

### GAP-010 🟡 Strategy Panel width doesn't match contract at base desktop
**File:** `TriPaneShell.tsx`

**Contract:** `w-[320px]` fixed at desktop (≥1280px)  
**Implementation:** `w-[300px] xl:w-[340px]`

At desktop (1280px+), the contract says 320px. The implementation shows 300px at lg and 340px at xl. The xl value (340px) is a small deviation from the contract (320px). The base lg value (300px) is 20px short.

**Fix:** Change to `w-[320px] xl:w-[320px]` (or just `w-[320px]`) to match the contract exactly. If the 340px at xl was intentional and approved, document it in DECISIONS_LOG.md as an accepted deviation.

---

### GAP-011 🟡 Upgrade hook button in Strategy Panel — possible contract violation
**File:** `StrategyPanelPane.tsx` — `UpgradeHookCard`

```tsx
<button className="mt-2 text-[11px] text-brand-iris ... font-semibold transition-colors">
  Upgrade to {hook.min_plan} →
</button>
```

**Contract:** Strategy Panel invariant — `NO action buttons`. CI check `check-strategy-panel-buttons.mjs` exists to enforce this.

**Interpretation:** The upgrade hook button navigates to a plan/billing page — it is not an action that executes work on behalf of SAGE or the user's content pipeline. Whether this counts as a "strategy panel action button" in the contract's intent is debatable.

**Recommended resolution:** Flag to product for explicit decision. If accepted, add to `DECISIONS_LOG.md` and update the CI check to whitelist upgrade hook buttons by `data-upgrade-hook` attribute. If rejected, move upgrade hooks to a bottom-sheet or modal triggered from outside the Strategy Panel.

---

### GAP-012 🟡 Autopilot badge border — non-standard opacity step
**File:** `ActionCard.tsx`

```tsx
// CURRENT
border border-brand-cyan/25

// CORRECT per design skill
border border-brand-cyan/30
```

Small but explicit — `/25` is not in the standard opacity scale for brand color borders. `/30` is the correct step.

---

### GAP-013 🟡 CalendarPeek height contract — unverified
**File:** `CalendarPeek.tsx` (not read)

**Contract invariant:** Container height fixed at `h-[280px]`  
**CI check:** `check-calendar-height.mjs`

Cannot confirm without reading the component. Spot-check required.

---

### GAP-014 🟡 Entity Map zone layout — unverified
**File:** `EntityMap.tsx` (not read)

**Contract invariant:** Zone layout must match SAGE dimensions (Authority/Signal/Growth/Exposure). Deterministic layout (same seed = same positions). No navigation on entity click.

Cannot confirm without reading the component. Spot-check required.

---

## What Is Working Correctly

These aspects are compliant and should not be touched:

| Area | Finding |
|------|---------|
| Golden Flow state coordination | `hoveredActionId` and `executingActionId` are properly lifted to page.tsx and passed down — contract compliant |
| Hover timing | 200ms open, 250ms close — contract compliant |
| HoverCard positioning | `side="left"` with proper arrow — contract compliant |
| Single-hover coordination | `hoveredActionId` in ActionStreamPane correctly dims non-hovered cards — contract compliant |
| Card dimming on hover | `isDimmed` prop and `opacity-40` dimming — contract compliant |
| Density calculation | Three-tier system (comfortable default ≤8, standard 9-12, compact 13+) — contract compliant |
| EVI filter state | URL persistence and cross-pane communication — contract compliant |
| Lifecycle buckets (Active/History) | Correct separation of executing vs completed — contract compliant |
| Locked actions policy | Separate "Upgrade Opportunities" section — correct |
| Strategy Panel: EVI only top-level KPI | No duplicate KPIs found — contract compliant |
| `pillarAccents` object | Token values correct — matches design skill reference |
| Scrollbar styles | `cc-scrollbar` class — DS compliant |

---

## V1 Accepted Deviations (already in contract)

These are already documented in `COMMAND_CENTER_CONTRACT.md` Section 6 and need no action:

| Deviation | Contract Status |
|-----------|----------------|
| Calendar click opens drawer, not modal | V1 ACCEPTED |
| Entity Map 5-state progression not fully visualized | V1 ACCEPTED |

---

## Fix Priority Order

Sequence matters. Some fixes create prerequisites for others.

**Sprint 1 — DS Token cleanup (do these together, one pass)**

1. `pillar-accents.ts` — Delete `surfaceTokens`, fix `modeStyles.manual.bg` chained opacity (GAP-001, GAP-002, GAP-015, GAP-016, GAP-017)
2. `ActionStreamPane.tsx` — Replace all phantom hex values with DS tokens (GAP-003, GAP-007)
3. `StrategyPanelPane.tsx` — Replace all phantom hex values with DS tokens (GAP-004, GAP-007)
4. `ActionCard.tsx` — Fix `border-[#2A2A36]` and autopilot badge `/25` border (GAP-005, GAP-012)
5. `TriPaneShell.tsx` — Fix `text-white` → `text-white/90` on headers (GAP-006)

These are all pure token swaps — no behavioral change, no risk to contract compliance. Can be done in a single commit.

**Sprint 2 — Contract gaps**

6. `ActionCard.tsx` — Add Manual and Copilot mode badges (GAP-009)
7. `TriPaneShell.tsx` — Fix Strategy Panel width to `w-[320px]` (GAP-010)
8. `StrategyPanelPane.tsx` — Resolve upgrade hook button question with product (GAP-011)

**Sprint 3 — Missing feature**

9. Build `ImpactStrip` component and wire into `page.tsx` (GAP-008)

**Sprint 4 — Spot checks**

10. Read `CalendarPeek.tsx` — verify `h-[280px]` container (GAP-013)
11. Read `EntityMap.tsx` — verify zone layout, no-navigation invariant (GAP-014)
12. Read `ActionModal.tsx`, `ActionHoverBrief.tsx`, `IntelligenceCanvasPane.tsx` — verify DS tokens

---

## CI Checks Status

These CI checks are specified in the contract. Their existence in the actual codebase is unverified:

| Check | File | Status |
|-------|------|--------|
| `check-command-center-kpis.mjs` | `scripts/` | ❓ Unverified |
| `check-entity-map-zones.mjs` | `scripts/` | ❓ Unverified |
| `check-calendar-height.mjs` | `scripts/` | ❓ Unverified |
| `check-strategy-panel-buttons.mjs` | `scripts/` | ❓ Unverified |
| `check-golden-flow-integration.mjs` | `scripts/` | ❓ Unverified |

These should be verified to exist before any Sprint 1 work begins. If they don't exist, the contract's enforcement mechanism is missing and needs to be created before merge gates apply.

---

*Audit complete. See ARCHITECT_BRIEFING.md for Phase 2 next steps.*
