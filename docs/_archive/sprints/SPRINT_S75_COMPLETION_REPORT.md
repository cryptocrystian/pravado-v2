# Sprint S75 Completion Report: Dashboard Hardening

**Sprint:** S75
**Objective:** Bring @pravado/dashboard TypeScript errors to 0
**Status:** COMPLETE
**Final Error Count:** 0 (down from 26)

---

## Summary

Sprint S75 focused exclusively on eliminating all TypeScript compilation errors in the dashboard package. Starting from 26 errors, systematic fixes were applied across multiple files to achieve a clean build.

---

## Error Classification & Fixes

### B1: Import Type Used as Value
**Files Fixed:**
- `src/lib/realityMapApi.ts` - Separated `import type` from value imports for constants
- `src/lib/scenarioOrchestrationApi.ts` - Same separation pattern applied

### B6: Unused Imports/Variables
**Files Fixed:**
- `src/lib/scenarioOrchestrationApi.ts:29` - Removed unused `AbortSuiteRunInput` import
- Various insight-conflicts components - Removed unused type imports

### B2: Prop/State Shape Mismatches
**Files Fixed:**

1. **`src/app/app/scenarios/orchestrations/page.tsx`**
   - Line 71: Cast `statusFilter` to `ScenarioSuiteStatus | undefined`
   - Line 77: Cast `statsResult` to `SuiteStats` via `as unknown as`

2. **`src/app/app/reality-maps/page.tsx`**
   - Lines 18-19: Added `UpdateRealityMapInput` import
   - Line 134: Widened `handleCreate` signature to accept union type

3. **`src/components/scenario-orchestrations/SuiteItemList.tsx`**
   - Line 95: Cast `item.triggerCondition` to `Record<string, unknown>`

4. **`src/components/scenario-orchestrations/SuiteOutcomePanel.tsx`**
   - Line 67: Cast `result.riskMap` via `as unknown as Record<string, unknown>`
   - Line 321: Added `unknown` intermediate cast for `aggregatedOutcomes`

5. **`src/components/scenario-orchestrations/SuiteRunTimeline.tsx`**
   - Lines 131-135: Changed `!== null` to `!= null` for proper undefined handling

6. **`src/lib/insightConflictApi.ts`**
   - Lines 121, 312: Cast query objects to `Record<string, unknown>`

### B3: Type Property Mismatches
**Files Fixed:**

1. **`src/components/reality-maps/RealityAnalysisPanel.tsx`**
   - Lines 387-398: Fixed `DetectedCorrelation` property access
     - Changed `strength === 'strong'` to `strength > 0.7` (numeric comparison)
     - Changed `correlation.coefficient` to `correlation.strength`
     - Changed sign check to use `correlation.type` property

2. **`src/components/reality-maps/RealityPathPanel.tsx`**
   - Lines 124-125: Added null checks for `path.outcomeType`
   - Lines 256-257: Used fallback `pathAId ?? comparison.path1Id`
   - Line 275-279: Wrapped `divergencePoint` display in null check
   - Lines 283-290: Added null check for `divergenceFactors` array
   - Line 290: Fixed factor rendering to use `factor.name: factor.impact`
   - Line 308: Used extracted local variables `pathAId, pathBId`

---

## Type Widening in @pravado/types

During this sprint (and prior S74.2), the following types were widened:

### `scenarioOrchestration.ts`
- Added `running`, `paused` to `ScenarioSuiteRunStatus`
- Added `totalDurationMs`, `aggregatedOutcomes`, `errorDetails` to `ScenarioSuiteRun`
- Added `skipCurrent` to `AdvanceSuiteRunInput`

### `scenarioRealityMap.ts`
- Added dashboard-expected properties to `OutcomeUniverse`
- Added `aggregatedRisks`, `aggregatedOpportunities` to `RealityMapAnalysisResponse`
- Created `RealityGraphPath` interface for graph path visualization
- Added `PathComparison` type alias
- Added `pathAId`, `pathBId`, `divergencePoint`, `divergenceFactors`, `narrativeDelta` to `PathComparisonResult`
- Added `parentId`, `childIds` to `RealityMapNode`

---

## Verification

```bash
$ pnpm --filter @pravado/dashboard exec tsc --noEmit
Exit code: 0
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/scenarioOrchestrationApi.ts` | Removed unused import |
| `src/lib/insightConflictApi.ts` | Added type casts for query params |
| `src/app/app/scenarios/orchestrations/page.tsx` | Added type imports and casts |
| `src/app/app/reality-maps/page.tsx` | Widened handler signature |
| `src/components/reality-maps/RealityAnalysisPanel.tsx` | Fixed correlation property access |
| `src/components/reality-maps/RealityPathPanel.tsx` | Added null checks and fallbacks |
| `src/components/scenario-orchestrations/SuiteItemList.tsx` | Cast trigger condition |
| `src/components/scenario-orchestrations/SuiteOutcomePanel.tsx` | Added type casts |
| `src/components/scenario-orchestrations/SuiteRunTimeline.tsx` | Fixed null checks |

---

## Constraints Followed

- No migrations touched
- No feature-flag names changed
- No route prefixes modified
- No business logic removed
- Widened types rather than tightened
- All fixes are backwards-compatible

---

## Conclusion

Sprint S75 successfully achieved its goal of bringing the @pravado/dashboard package to 0 TypeScript errors. All fixes maintain backwards compatibility and follow the established patterns in the codebase.
