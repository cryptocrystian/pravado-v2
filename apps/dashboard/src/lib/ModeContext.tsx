/**
 * Mode Context - React Provider for Mode Preferences
 *
 * Phase 10A: Provides reactive mode state across the application.
 *
 * Usage:
 * ```tsx
 * // In a pillar component:
 * const { mode, setMode, resolution } = useMode('content');
 *
 * // With ceiling enforcement:
 * const { effectiveMode, ceilingApplied, ceiling } = useMode('pr', 'copilot');
 * ```
 *
 * @see /docs/canon/UX_CONTINUITY_CANON.md §5 Mode-Driven
 */

'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import {
  type AutomationMode,
  type Pillar,
  type ModePreferences,
  type ModeResolutionResult,
  getModePreferences,
  setGlobalMode,
  setPillarMode,
  clearPillarOverride,
  // Note: hasPillarOverride and resolveMode from mode-preferences read localStorage directly,
  // which causes hydration mismatches. This provider reimplements them using React state.
} from './mode-preferences';

// ============================================
// CONTEXT TYPE
// ============================================

interface ModeContextValue {
  /** Current preferences state */
  preferences: ModePreferences;
  /** Set global mode (all pillars) */
  setGlobalMode: (mode: AutomationMode) => void;
  /** Set pillar-specific override */
  setPillarMode: (pillar: Pillar, mode: AutomationMode) => void;
  /** Clear pillar override (use global) */
  clearPillarOverride: (pillar: Pillar) => void;
  /** Check if pillar has override */
  hasPillarOverride: (pillar: Pillar) => boolean;
  /** Resolve mode for a pillar with optional ceiling */
  resolveMode: (pillar: Pillar, ceiling?: AutomationMode) => ModeResolutionResult;
}

const ModeContext = createContext<ModeContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface ModeProviderProps {
  children: ReactNode;
}

// Static default preferences for SSR/hydration consistency
const DEFAULT_PREFERENCES: ModePreferences = {
  globalMode: 'manual',
  pillarOverrides: {},
  updatedAt: '1970-01-01T00:00:00.000Z', // Static epoch for hydration safety
};

export function ModeProvider({ children }: ModeProviderProps) {
  // Initialize with static default to avoid hydration mismatch (SSR has no localStorage)
  const [preferences, setPreferences] = useState<ModePreferences>(DEFAULT_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);

  // Sync from localStorage AFTER hydration (client-only)
  useEffect(() => {
    setPreferences(getModePreferences());
    setIsHydrated(true);
  }, []);

  // Sync with localStorage changes (e.g., from other tabs)
  useEffect(() => {
    if (!isHydrated) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pravado:mode-preferences') {
        setPreferences(getModePreferences());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isHydrated]);

  const handleSetGlobalMode = useCallback((mode: AutomationMode) => {
    setGlobalMode(mode);
    setPreferences(getModePreferences());
  }, []);

  const handleSetPillarMode = useCallback((pillar: Pillar, mode: AutomationMode) => {
    setPillarMode(pillar, mode);
    setPreferences(getModePreferences());
  }, []);

  const handleClearPillarOverride = useCallback((pillar: Pillar) => {
    clearPillarOverride(pillar);
    setPreferences(getModePreferences());
  }, []);

  // Use state-based check to avoid hydration mismatch (don't call hasPillarOverride which reads localStorage)
  const handleHasPillarOverride = useCallback((pillar: Pillar) => {
    return pillar in preferences.pillarOverrides;
  }, [preferences.pillarOverrides]);

  // Use state-based resolution to avoid hydration mismatch
  // This mirrors the logic in resolveMode but uses React state instead of localStorage
  const handleResolveMode = useCallback((pillar: Pillar, ceiling?: AutomationMode): ModeResolutionResult => {
    // Determine selected mode from state (not localStorage)
    let selectedMode: AutomationMode;
    let source: ModeResolutionResult['source'];

    if (preferences.pillarOverrides[pillar]) {
      selectedMode = preferences.pillarOverrides[pillar]!;
      source = 'pillar-override';
    } else if (preferences.globalMode) {
      selectedMode = preferences.globalMode;
      source = 'global';
    } else {
      selectedMode = 'manual';
      source = 'default';
    }

    // Apply ceiling if provided
    if (ceiling) {
      // Mode autonomy order: manual < copilot < autopilot
      const modeOrder: AutomationMode[] = ['manual', 'copilot', 'autopilot'];
      const selectedIndex = modeOrder.indexOf(selectedMode);
      const ceilingIndex = modeOrder.indexOf(ceiling);
      const effectiveMode = selectedIndex <= ceilingIndex ? selectedMode : ceiling;

      return {
        selectedMode,
        effectiveMode,
        ceilingApplied: effectiveMode !== selectedMode,
        ceiling,
        source,
      };
    }

    return {
      selectedMode,
      effectiveMode: selectedMode,
      ceilingApplied: false,
      source,
    };
  }, [preferences]);

  const value: ModeContextValue = {
    preferences,
    setGlobalMode: handleSetGlobalMode,
    setPillarMode: handleSetPillarMode,
    clearPillarOverride: handleClearPillarOverride,
    hasPillarOverride: handleHasPillarOverride,
    resolveMode: handleResolveMode,
  };

  return (
    <ModeContext.Provider value={value}>
      {children}
    </ModeContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Access the mode context directly (advanced usage)
 */
export function useModeContext(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useModeContext must be used within a ModeProvider');
  }
  return context;
}

/**
 * Get mode for a specific pillar with optional ceiling enforcement.
 *
 * This is the PRIMARY hook for pillar components.
 *
 * @param pillar - The pillar to get mode for
 * @param ceiling - Optional ceiling (surface-level restriction)
 * @returns Mode state and setters
 */
export function useMode(pillar: Pillar, ceiling?: AutomationMode) {
  const context = useContext(ModeContext);

  // Fallback for components outside provider (SSR safety)
  if (!context) {
    const fallbackResolution: ModeResolutionResult = {
      selectedMode: 'manual',
      effectiveMode: 'manual',
      ceilingApplied: false,
      source: 'default',
    };
    return {
      mode: 'manual' as AutomationMode,
      effectiveMode: 'manual' as AutomationMode,
      resolution: fallbackResolution,
      setMode: () => {},
      setGlobalMode: () => {},
      clearOverride: () => {},
      hasOverride: false,
    };
  }

  const resolution = context.resolveMode(pillar, ceiling);
  const hasOverride = context.hasPillarOverride(pillar);

  return {
    /** The selected mode (before ceiling) */
    mode: resolution.selectedMode,
    /** The effective mode (after ceiling) */
    effectiveMode: resolution.effectiveMode,
    /** Full resolution result */
    resolution,
    /** Set mode for this pillar only */
    setMode: (mode: AutomationMode) => context.setPillarMode(pillar, mode),
    /** Set global mode (all pillars) */
    setGlobalMode: context.setGlobalMode,
    /** Clear pillar override (use global) */
    clearOverride: () => context.clearPillarOverride(pillar),
    /** Whether this pillar has an override */
    hasOverride,
  };
}

/**
 * Get global mode preferences (for settings pages)
 */
export function useModePreferences() {
  const context = useContext(ModeContext);

  if (!context) {
    return {
      preferences: DEFAULT_PREFERENCES,
      setGlobalMode: () => {},
      setPillarMode: () => {},
      clearPillarOverride: () => {},
    };
  }

  return {
    preferences: context.preferences,
    setGlobalMode: context.setGlobalMode,
    setPillarMode: context.setPillarMode,
    clearPillarOverride: context.clearPillarOverride,
  };
}
