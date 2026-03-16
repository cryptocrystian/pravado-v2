# PR Work Surface — DS v3.1 Compliance Audit
**Date:** February 2026  
**Scope:** All files in `/apps/dashboard/src/components/pr-work-surface/`  
**Standard:** DS v3.1 Expression Guidelines + PR Pillar Model V1.2  
**Reference Format:** Command Center Audit 2026-02

---

## Executive Summary

The PR Work Surface is broadly well-structured and demonstrates strong architectural compliance with the PR Pillar Model: mode ceilings are enforced, bulk send is blocked by design, automation guardrails are present, and Impact Strip integration is in place on required surfaces. The codebase shows intentional DS v3.0 awareness throughout.

However, a systematic **sub-13px typography epidemic** affects every single view and component, constituting the most widespread gap category. Additionally, two forbidden token usages (`text-red-400`, `semantic-error`) and one contract violation (follow-up limit discrepancy) require targeted fixes.

**Total Gaps:** 47 discrete instances across 6 severity categories.

---

## Severity Classification

| Severity | Definition |
|---|---|
| **P0 — Contract Violation** | Breaks a frozen V1.x contract rule. Ship-blocker. |
| **P1 — Token Forbidden** | Explicitly prohibited token in DS v3.1. Must fix before next deploy. |
| **P2 — Typography Floor** | Sub-13px semantic content; sub-12px label content. Fix in next sprint. |
| **P3 — Semantic Inconsistency** | Correct visual result via wrong token path (phantom hex). Fix in polish pass. |
| **P4 — Bare White** | `text-white` or `bg-white` without opacity modifier on non-emphasis content. |
| **P5 — Minor** | Edge cases, missing tracking, inconsistent density. Address in cleanup. |

---

## P0 — Contract Violations

### P0-1 · Follow-up Limit Discrepancy
**File:** `views/PRSettings.tsx` — `DEFAULT_GUARDRAILS`  
**Issue:** `followUpLimitPerWeek: 3` contradicts `PR_PITCH_PIPELINE_CONTRACT.md` which sets a hard ceiling of **max 2 follow-ups per 7 days** per contact. The Settings UI slider also allows up to `max={5}` follow-ups.

**Contract clause violated:** PR_PITCH_PIPELINE_CONTRACT V1.1 §4.2 "Follow-up enforcement: maximum 2 attempts per contact per 7-day window."

**Fix:**
```tsx
// DEFAULT_GUARDRAILS
followUpLimitPerWeek: 2,  // was: 3

// RangeSlider for followUpLimitPerWeek
// max={2}  // was: max={5}
```

---

## P1 — Forbidden Tokens

### P1-1 · `text-red-400` in ContactFormModal
**File:** `components/ContactFormModal.tsx`  
**Lines:** All inline error message paragraphs (4 instances)

`text-red-400` is an explicitly forbidden legacy Tailwind color token. Must use `text-semantic-danger`.

```tsx
// BEFORE
<p className="mt-1 text-xs text-red-400">{errors.fullName}</p>

// AFTER
<p className="mt-1 text-[13px] text-semantic-danger">{errors.fullName}</p>
// Note: also fixes typography floor (P2) - text-xs → text-[13px]
```

Also affects: `border-red-500` → `border-semantic-danger`, `focus:ring-red-500/30` → `focus:ring-semantic-danger/30`.

### P1-2 · `semantic-error` Token (Non-Existent)
**File:** `views/PRPitches.tsx`  
**Instances:** Toast component (3 usages), NewPitchModal error state (3 usages)

`semantic-error` is not a defined DS token. The correct token is `semantic-danger`.

```tsx
// BEFORE
'bg-semantic-error/10 border-semantic-error/30 text-semantic-error'

// AFTER
'bg-semantic-danger/10 border-semantic-danger/30 text-semantic-danger'
```

---

## P2 — Typography Floor Violations

### Systematic Pattern

DS v3.1 defines two valid small-text tiers:
- **13px minimum** for all semantic content (data, labels, descriptions, dates, badges)
- **12px (text-xs) only** for uppercase + `tracking-wider` decorative labels (column headers, section labels)
- **Below 12px is never valid** for any rendered text

The following violations are organized by file. The most common pattern is badge text at `text-[11px]` and metadata at `text-[10px]` or below.

---

### PRCoverage.tsx

| Instance | Current | Required | Note |
|---|---|---|---|
| TierBadge label | `text-[11px]` | `text-[13px]` | Semantic tier info |
| SentimentBadge label | `text-[11px]` | `text-[13px]` | Semantic sentiment info |
| AICitationBadge label | `text-[11px]` | `text-[13px]` | Semantic signal badge |
| StatCard `.subtext` | `text-[10px]` | `text-[13px]` | Supplemental data |
| StatCard `.label` | `text-xs` | `text-xs uppercase tracking-wider` | Needs uppercase+tracking to qualify for 12px |
| TierDistributionBar count | `text-[10px]` | `text-[13px]` | Semantic data |
| TierDistributionBar legend items | `text-[11px]` | `text-[13px]` | Semantic labels |
| SentimentSummary bar labels | `text-[11px]` | `text-[13px]` | Semantic labels |
| CiteMindPulseCard `/ 100` | `text-[9px]` | `text-[13px]` | **Most severe** — 9px is illegible |
| CiteMindPulseCard model names | `text-[9px]` | `text-[13px]` | **Severe** |
| CiteMindPulseCard section label | `text-[10px]` | `text-xs uppercase tracking-wider` | Needs uppercase+tracking |
| CiteMindPulseCard stat labels | `text-[11px]` | `text-[13px]` | |
| CoverageTimeline outlet + date | `text-[11px]` | `text-[13px]` | |
| CoverageTableRow "Cited" badge | `text-[10px]` | `text-[13px]` | |
| CoverageTableRow date | `text-[11px]` | `text-[13px]` | |
| CoverageTable header row | `text-[10px]` | `text-xs uppercase tracking-wider` | 10px still violates 12px label floor |
| Filter tab count chips | `text-[10px]` | `text-[13px]` | |

**CiteMind Pulse redesign note:** The 9px model-name labels in the citation breakdown grid are the most severe instance in the entire work surface. The 5-column grid is too cramped for any readable text. Recommend collapsing to a horizontal bar or list layout where each model gets `text-[13px]` treatment.

---

### PRDistribution.tsx

| Instance | Current | Required | Note |
|---|---|---|---|
| StatusBadge label | `text-[11px]` | `text-[13px]` | |
| TrackBadge label | `text-[11px]` | `text-[13px]` | |
| FeatureBadge label | `text-[11px]` | `text-[13px]` | |
| MiniCalendar day names | `text-[10px]` | `text-xs uppercase tracking-wider` | Needs tracking to qualify |
| Recent Distributions table header | `text-[10px]` | `text-xs uppercase tracking-wider` | 10px still violates |
| Release list updated date | `text-[11px]` | `text-[13px]` | |

---

### PRPitches.tsx

| Instance | Current | Required | Note |
|---|---|---|---|
| KanbanCard follow-up count badge | `text-[11px]` | `text-[13px]` | |
| KanbanColumn count badge | `text-[11px]` | `text-[13px]` | |
| Manual notice "MANUAL MODE ENFORCED" | `text-[11px]` | `text-xs uppercase tracking-wider` | Needs tracking to qualify for 12px |
| Error state alert text | `text-xs` | `text-[13px]` | Error text is semantic — needs 13px |
| ListRow follow-up span | `text-[13px]` | ✓ compliant | |

---

### PRSettings.tsx

| Instance | Current | Required | Note |
|---|---|---|---|
| ModeBadge label | `text-[11px]` | `text-[13px]` | |
| SystemEnforcedBanner "CANNOT OVERRIDE" chip | `text-[10px]` | `text-xs uppercase tracking-wider` | Needs tracking |
| CeilingGroupPanel "LOCKED" chip | `text-[10px]` | `text-xs uppercase tracking-wider` | |
| CeilingGroup legend dots | `text-xs` (no uppercase/tracking) | `text-xs uppercase tracking-wider` | |
| CeilingRow "Locked" label | `text-[10px]` | `text-[13px]` | Semantic label |
| GuardrailsPanel help text | `text-xs` | `text-[13px]` | Semantic helper text |
| PRSettings header description | `text-xs` | `text-[13px]` | Semantic description |

---

### PRInbox.tsx

| Instance | Current | Required | Note |
|---|---|---|---|
| Copilot reasoning label | `text-[11px]` | `text-[13px]` | |
| Priority badge labels | `text-[11px]` | `text-[13px]` | |
| Inbox type config labels | `text-[11px]` | `text-[13px]` | |
| Mode descriptor text | `text-[11px]` | `text-[13px]` | |

---

### PRPitchPipeline.tsx

| Instance | Current | Required | Note |
|---|---|---|---|
| Stage CTA buttons | `text-[11px]` | `text-[13px]` | Interactive text — critical |
| Follow-up count badges | `text-[11px]` | `text-[13px]` | |
| Optimal window text | `text-[11px]` | `text-[13px]` | |

---

### ContactFormModal.tsx

| Instance | Current | Required | Note |
|---|---|---|---|
| Validation error messages | `text-xs` | `text-[13px]` | Semantic error text (also P1) |

---

### ContactRelationshipLedger.tsx

| Instance | Current | Required | Note |
|---|---|---|---|
| Actor name (event footer) | `text-[10px]` | `text-[13px]` | |
| Time-ago display | `text-xs` (no uppercase/tracking) | `text-[13px]` | Semantic temporal data |

---

### DistributionDecisionMatrix.tsx

| Instance | Current | Required | Note |
|---|---|---|---|
| Track explainer "Best For:" header | `text-[10px]` | `text-xs uppercase tracking-wider` | |
| Track explainer bullet items | `text-xs` | `text-[13px]` | Semantic feature list |
| Cost section "Total Distribution Cost" label | `text-sm` | ✓ compliant | |

---

## P3 — Phantom Hex Values (Semantic Inconsistency)

### Systematic Surface Token Pattern

All views use bare hex values for surface backgrounds and borders instead of semantic surface tokens. This is pervasive and systematic — present in every file. The following hex values are used extensively:

| Hex | Semantic Role | Expected Token |
|---|---|---|
| `bg-[#0A0A0F]` | Base/deepest surface | `bg-surface-base` or `bg-surface-0` |
| `bg-[#0D0D12]` | Primary card surface | `bg-surface-1` |
| `bg-[#13131A]` | Elevated surface | `bg-surface-2` |
| `border-[#1A1A24]` | Default border | `border-border-subtle` |
| `border-[#2A2A36]` | Hover/active border | `border-border-default` |

**Scope:** These appear in virtually every `<div>` container across all 10 files. While visually correct, the tokens are not linked to the DS theme system, meaning theme changes or dark/light variants will not propagate.

**Recommended approach:** Create a `surfaces.ts` token file and replace in a single sweeping PR. Do not fix file-by-file as it creates inconsistency during the transition.

**Files affected:** All 10 files in scope. This is the highest-volume gap in the entire audit but lowest visual risk since hex values are correct.

---

## P4 — Bare `text-white` Without Opacity

DS v3.1 defines a contrast hierarchy for text on dark surfaces. `text-white` (100% opacity) should be reserved for primary headings and maximum-emphasis data points. Body content, labels, and secondary text should use graduated opacity.

The following instances use bare `text-white` where an opacity modifier is expected:

**PRCoverage.tsx**
- `CoverageTimeline` headline: `text-sm text-white/85` — ✓ correct (already has opacity)
- `CoverageTableRow` headline: `text-sm text-white/85` — ✓ correct
- `StatCard` value when `accent='neutral'`: `text-2xl font-bold text-white` — bare white on the main value. This is intentional maximum-emphasis treatment for the primary number, which is acceptable.

**PRPitches.tsx**
- `PitchDetailPanel` form section headers: `text-sm font-medium text-white` — P4, should be `text-white/70` consistent with the form label pattern elsewhere
- `PitchDetailPanel` subject line display: `text-white font-medium` — acceptable as primary content emphasis

**PRSettings.tsx**
- `CeilingGroupPanel` title: `text-base font-semibold text-white` — acceptable for section heading emphasis
- Multiple `text-white` instances in body copy descriptions where `text-white/70` would be more appropriate

**Scope note:** P4 violations are lower priority than P2. Many instances of bare `text-white` in headings are intentional and correct. Focus P4 fixes on body copy and description text instances only.

---

## P5 — Minor / Polish

### P5-1 · PRCoverage `TierBadge` Uses `font-bold` Not `font-semibold`
Minor inconsistency with the rest of the badge system which uses `font-semibold`. Not a rule violation, but creates visual weight inconsistency.

### P5-2 · PRDistribution `ScheduledSendsList` Relationship Context at `text-[13px]`
Correct size, but the entire relationship context block (`text-[13px] text-white/30`) is extremely low contrast at 30% opacity. Consider raising to `text-white/50` for readability.

### P5-3 · PRPitches `KanbanCard` `daysAgo` Client-Only Calculation
The `useEffect`-based `daysAgo` pattern correctly avoids hydration mismatch, but displays `—` on initial render, creating a flash. Consider a server-safe relative date utility or passing pre-calculated date strings.

### P5-4 · `PRSettings` `Toast` Exports vs Local Definition
The Toast component is re-defined locally in `PRSettings.tsx` with a slightly different API than the Toast in `PRPitches.tsx`. These should be unified into a shared `components/Toast.tsx`.

### P5-5 · `DistributionDecisionMatrix` `_releaseId` Unused Prop
`releaseId` is typed and accepted but unused (aliased to `_releaseId`). Either wire it into the API call when distribution is implemented, or remove from the prop interface until needed.

### P5-6 · `PRCoverage` Missing API Integration
Unlike `PRDatabase` and `PRPitches`, `PRCoverage` has no API integration — it uses `useState` with mock data only, with no `useSWR` fetch to `/api/pr/coverage`. Low risk for now but this needs to be wired before GA.

### P5-7 · `PROverview` Command Center Preview Hardcoded
`MOCK_CC_PR_ACTIONS` in `PROverview.tsx` is hardcoded. The overview's Command Center preview card is explicitly not a second Action Stream (noted correctly in the contract), but the mock data suggests it could drift toward duplication in future development. Add a code comment clarifying the intent: this is a static link prompt, not a live action feed.

---

## Compliance Summary by File

| File | P0 | P1 | P2 count | P3 | P4 | P5 | Overall |
|---|---|---|---|---|---|---|---|
| PRInbox.tsx | — | — | 4 | ✗ systematic | minor | — | 🟡 |
| PROverview.tsx | — | — | 0 | ✗ systematic | minor | P5-7 | 🟢 |
| PRDatabase.tsx | — | — | 0 | ✗ systematic | minor | — | 🟢 |
| PRPitchPipeline.tsx | — | — | 3 | ✗ systematic | minor | — | 🟡 |
| PRPitches.tsx | — | P1-2 (×6) | 3 | ✗ systematic | minor | P5-3 | 🔴 |
| PRCoverage.tsx | — | — | 17 | ✗ systematic | minor | P5-6 | 🔴 |
| PRDistribution.tsx | — | — | 6 | ✗ systematic | minor | — | 🟡 |
| PRSettings.tsx | P0-1 | — | 7 | ✗ systematic | minor | P5-4 | 🔴 |
| DistributionDecisionMatrix.tsx | — | — | 3 | ✗ systematic | — | P5-5 | 🟡 |
| ContactFormModal.tsx | — | P1-1 (×7) | 1 | — | — | — | 🔴 |
| ContactRelationshipLedger.tsx | — | — | 2 | — | — | — | 🟡 |
| ImpactStrip.tsx | — | — | 0 | — | — | — | 🟢 |
| PitchComposer.tsx | — | — | 0 | — | — | — | 🟢 |

---

## PR-Specific Guardrail Compliance

| Rule | Status | Notes |
|---|---|---|
| `send_pitch = manual only` | ✅ Enforced | All files block auto-send. Prominent notice in PRPitches. |
| `send_followup` ceiling = copilot max | ✅ Enforced | PRPitchPipeline and PRInbox both enforce this. |
| Personalization gate ≥40% before send | ⚠️ Visual only | Score shown in PitchDetailPanel but no hard block on "Send Now" CTA when score <40. Needs enforcement. |
| Follow-up limit ≤2 per 7 days | ❌ Broken | PRSettings defaults to 3, slider allows up to 5. **P0-1.** |
| Impact Strip on required surfaces | ✅ Present | DistributionDecisionMatrix ✓, ContactRelationshipLedger ✓, PRPitchPipeline ✓ |
| Bulk send blocked | ✅ Enforced | Explicit warning in PRPitchPipeline. Warning in PRDistribution. |
| CiteMind audio = manual V1 | ✅ Enforced | PRSettings and DistributionDecisionMatrix both note this. |
| SYSTEM ENFORCED explainer present | ✅ Present | PRSettings has dedicated UI pattern with lock iconography. |

**Additional gap — Personalization gate (not P0 but needs sprint):**
The `PitchDetailPanel` in `PRPitches.tsx` shows "Send Now (Manual)" for `status === 'scheduled'` regardless of `personalizationScore`. The contract requires a warning (not a hard block, but a warning modal) when score < 40. Add a confirmation dialog:

```tsx
// In handleManualSend, before setIsSending(true):
if (pitch.personalizationScore < 40) {
  const confirmed = window.confirm(
    `Personalization score is ${pitch.personalizationScore}% (below 40% threshold). Send anyway?`
  );
  if (!confirmed) return;
}
```

---

## Sprint Recommendations

### Sprint 1 — Contract & Token Fixes (2–3 hours)
*Ship-blocker items. Must complete before next GA candidate.*

1. **P0-1** — Fix `followUpLimitPerWeek` default to `2`, slider max to `2` in `PRSettings.tsx`
2. **P1-1** — Replace all `text-red-400`, `border-red-500`, `focus:ring-red-500/30` with semantic-danger equivalents in `ContactFormModal.tsx`
3. **P1-2** — Replace all `semantic-error` with `semantic-danger` in `PRPitches.tsx` (Toast + NewPitchModal)
4. **Personalization gate** — Add low-score confirmation in `PitchDetailPanel.handleManualSend`

### Sprint 2 — Typography Floor (4–6 hours)
*All text below 13px in semantic positions. Work file by file.*

Priority order based on user-facing impact:
1. `PRCoverage.tsx` — CiteMind Pulse 9px labels (most severe; consider layout change)
2. `ContactFormModal.tsx` — error messages
3. `PRPitches.tsx` — badge and notice text
4. `PRDistribution.tsx` — badge and table text
5. `PRSettings.tsx` — ceiling and guardrail labels
6. `PRInbox.tsx`, `PRPitchPipeline.tsx` — badge standardization
7. `ContactRelationshipLedger.tsx` — actor + time labels

**Shared badge token approach:** All `text-[11px]` badges should move to a shared badge utility in `prWorkSurfaceStyles.ts`:
```ts
// Add to prWorkSurfaceStyles.ts
export const badgeStyles = {
  base: 'px-2 py-0.5 text-[13px] font-medium rounded',
  // ... variants
}
```

### Sprint 3 — Phantom Hex Replacement (2–4 hours, coordinated)
*Single coordinated PR across all files. Do not do piecemeal.*

Create `tokens/surfaces.ts`, define `surface-0` through `surface-2` and `border-subtle` / `border-default` tokens, then do a global search-and-replace. Verify visually in all views after.

### Sprint 4 — Polish Pass (1–2 hours)
Address P4 body copy bare-white instances, P5 minor items (unified Toast, unused props, API wiring for PRCoverage).

---

## Files Not In Scope (Need Separate Audit)

- `/api/pr/*` — API route handlers
- `types.ts` — Type definitions (no styling concerns)
- `prWorkSurfaceStyles.ts` — Token definitions (DS compliance source of truth, already audited)
- Any `__tests__` files

---

*Audit completed by Claude Sonnet 4.6 | PR Work Surface | DS v3.1 | February 2026*
