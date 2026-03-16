# AUDIT-FIX-01 — Complete

**Date**: 2026-03-14
**Scope**: Three Command Center bugs from surface audit

---

## BUG CC-01 — StrategyPanelPane null crash

**File**: `apps/dashboard/src/components/command-center/StrategyPanelPane.tsx`

**Problem**: Component crashed with "Cannot read properties of undefined (reading 'drivers')" when API returned unexpected data.

**Fix**:
- Added null guard before rendering EVI data: if `evi` is missing or `evi.score` is not a number, renders a graceful "EVI data is loading or unavailable" message instead of crashing
- Wrapped `evi.drivers` iteration with `(evi.drivers ?? [])` and conditional rendering
- Added `?? 'emerging'` fallback for `evi.status` in EVIHero
- Added `?? 0` fallbacks for `evi.score`, `evi.delta_7d`, `evi.delta_30d`
- Added `?? 'flat'` fallback for `evi.trend`
- Added `?? []` fallback for `evi.sparkline`
- Added early return in `Sparkline` for empty/missing data arrays
- Added `?? []` fallbacks for `data.narratives`, `data.upgrade_hooks`, `data.top_movers`

## BUG CC-02 — BullMQ "Queue name cannot contain :"

**File**: `apps/api/src/queue/bullmqQueue.ts`

**Problem**: BullMQ rejects queue names containing colons. All 6 queues used colon-separated names.

**Fix**: Replaced all colons with hyphens in queue names:
| Before | After |
|--------|-------|
| `evi:recalculate` | `evi-recalculate` |
| `sage:signal-scan` | `sage-signal-scan` |
| `citemind:score` | `citemind-score` |
| `citemind:monitor` | `citemind-monitor` |
| `gsc:sync` | `gsc-sync` |
| `journalists:enrich-batch` | `journalists-enrich-batch` |

Both Queue and Worker instances updated to use matching names.

## BUG CC-03 — SAGE Daily Brief showing hardcoded demo content

**Files**:
- `apps/dashboard/src/components/command-center/ActionStreamPane.tsx`
- `apps/dashboard/src/components/command-center/SituationBrief.tsx`
- `apps/dashboard/src/components/command-center/types.ts`

**Problem**: The SAGE Daily Brief always showed hardcoded demo text from `cc-mock-data.ts` regardless of API response.

**Fix**:
- Removed `import { situationBriefText } from './cc-mock-data'` from ActionStreamPane
- Added `daily_brief?: string | null` to `ActionStreamResponse` type
- ActionStreamPane now renders `data?.daily_brief` when present, otherwise shows empty state: "SAGE is analyzing your signals. Your first daily brief will appear here once enough data has been collected."
- Removed hardcoded "See journalist opportunities" CTA and "Today, 6:00 AM" timestamp from empty state
- Updated `SituationBrief.tsx` to accept `briefText` prop instead of importing mock data; shows empty state when no brief text provided; hides CTAs when no real data

---

## Exit Criteria Verification

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Command Center loads without JS crash with valid data | Fixed — null guards on all EVI property access |
| 2 | Command Center shows graceful empty state when API down | Fixed — renders "EVI data is loading or unavailable" |
| 3 | `pnpm dev` starts with no BullMQ queue name error | Fixed — all colons replaced with hyphens |
| 4 | BullMQ workers initialize successfully | Fixed — queue names match between Queue and Worker |
| 5 | SAGE Daily Brief shows real data or empty state | Fixed — no hardcoded demo text remains |
| 6 | Zero TypeScript errors | Verified — both dashboard and API pass `tsc --noEmit` |
| 7 | Sprint summary written | This file |
