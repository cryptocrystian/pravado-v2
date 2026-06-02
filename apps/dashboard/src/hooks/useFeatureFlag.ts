/**
 * useFeatureFlag
 *
 * Thin React hook around @pravado/feature-flags `isEnabled()`. Memoizes
 * the result per flag name so renders don't re-invoke the provider.
 *
 * Phase 0 Track 0B — pairs with ComingSoonGate to keep unwired surfaces
 * dark until Phase 1.
 */

import { useMemo } from 'react';
import { isEnabled, type FlagName } from '@pravado/feature-flags';

export function useFeatureFlag(flag: FlagName): boolean {
  return useMemo(() => isEnabled(flag), [flag]);
}
