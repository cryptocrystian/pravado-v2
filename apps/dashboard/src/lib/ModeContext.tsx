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
  hasPillarOverride,
  resolveMode,
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

export function ModeProvider({ children }: ModeProviderProps) {
  const [preferences, setPreferences] = useState<ModePreferences>(() => getModePreferences());

  // Sync with localStorage changes (e.g., from other tabs)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pravado:mode-preferences') {
        setPreferences(getModePreferences());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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

  const handleHasPillarOverride = useCallback((pillar: Pillar) => {
    return hasPillarOverride(pillar);
  }, []);

  const handleResolveMode = useCallback((pillar: Pillar, ceiling?: AutomationMode) => {
    return resolveMode(pillar, ceiling);
  }, []);

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
      preferences: {
        globalMode: 'manual' as AutomationMode,
        pillarOverrides: {},
        updatedAt: new Date().toISOString(),
      },
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
