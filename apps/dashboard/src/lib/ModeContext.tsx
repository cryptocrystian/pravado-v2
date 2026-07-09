/**
 * Mode Context - React Provider for per-pillar automation mode.
 *
 * PR-1 Keystone: this is the SINGLE source of truth for automation mode across
 * the app. It hydrates per-pillar mode from the server once (GET
 * /api/orgs/:orgId/mode → { pr, content, seo } each with mode/source/floor/
 * ceiling), and persists changes back (PATCH). Canon: mode is PER-PILLAR
 * (MODE_UX_ARCHITECTURE §2A/§3), never a single global toggle.
 *
 * The server is the source of truth when an `orgId` is provided and hydration
 * has completed; localStorage (mode-preferences) remains the offline/optimistic
 * fallback and the pre-hydration value, preserving the existing client-only
 * behavior for surfaces mounted without an org context.
 *
 * Backward compatible: every field prior consumers (ImpactStrip, ModeSwitcher)
 * read — `mode`, `effectiveMode`, `resolution`, `setMode`, `hasOverride`, … — is
 * preserved. Server governance (`source`, `floor`, `ceiling`, `lockedByAdmin`,
 * `isLoading`) is exposed additively. Ceiling ENFORCEMENT lands in PR-4.
 *
 * @see /docs/canon/MODE_UX_ARCHITECTURE.md §2A/§3/§4
 */

'use client';

import type {
  AutomationMode as CanonicalMode,
  ModePillar,
  ModeSource,
  PillarModeState,
} from '@pravado/types';
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
} from './mode-preferences';

// AutomationMode (mode-preferences) and CanonicalMode (@pravado/types) are the
// same union; this assignment fails to typecheck if they ever drift.
const _modeTypesAligned: CanonicalMode = 'manual' as AutomationMode;
void _modeTypesAligned;

const SERVER_PILLARS: ModePillar[] = ['pr', 'content', 'seo'];

function isServerPillar(pillar: Pillar): pillar is ModePillar {
  return (SERVER_PILLARS as string[]).includes(pillar);
}

function captureModeError(err: unknown, ctx: Record<string, unknown>) {
  try {
    const w = window as unknown as {
      Sentry?: { captureException?: (e: unknown, c?: unknown) => void };
    };
    w.Sentry?.captureException?.(err, { extra: ctx });
  } catch {
    /* Sentry not present — fall through to console */
  }
  // eslint-disable-next-line no-console
  console.error('[ModeContext] mode update failed', ctx, err);
}

// ============================================
// CONTEXT TYPE
// ============================================

interface ModeContextValue {
  preferences: ModePreferences;
  setGlobalMode: (mode: AutomationMode) => void;
  setPillarMode: (pillar: Pillar, mode: AutomationMode) => void;
  clearPillarOverride: (pillar: Pillar) => void;
  hasPillarOverride: (pillar: Pillar) => boolean;
  resolveMode: (
    pillar: Pillar,
    ceiling?: AutomationMode
  ) => ModeResolutionResult;
  /** Server governance for a pillar (undefined until hydrated / no org). */
  serverPillar: (pillar: Pillar) => PillarModeState | undefined;
  /** True while the initial server hydration is in flight. */
  isLoading: boolean;
}

const ModeContext = createContext<ModeContextValue | null>(null);

// ============================================
// PROVIDER
// ============================================

interface ModeProviderProps {
  children: ReactNode;
  /** Active org id — enables server persistence when present. */
  orgId?: string;
}

const DEFAULT_PREFERENCES: ModePreferences = {
  globalMode: 'manual',
  pillarOverrides: {},
  updatedAt: '1970-01-01T00:00:00.000Z',
};

export function ModeProvider({ children, orgId }: ModeProviderProps) {
  const [preferences, setPreferences] =
    useState<ModePreferences>(DEFAULT_PREFERENCES);
  const [isHydrated, setIsHydrated] = useState(false);
  const [serverPillars, setServerPillars] = useState<
    Partial<Record<ModePillar, PillarModeState>>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(!!orgId);

  // Sync from localStorage AFTER hydration (client-only, offline fallback).
  useEffect(() => {
    setPreferences(getModePreferences());
    setIsHydrated(true);
  }, []);

  // Cross-tab localStorage sync.
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

  // Server hydration: fetch per-pillar mode once when an org is available.
  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const res = await fetch(`/api/orgs/${orgId}/mode`, {
          cache: 'no-store',
        });
        const json = await res.json();
        if (!cancelled && json?.success && json.pillars) {
          setServerPillars(json.pillars as Record<ModePillar, PillarModeState>);
        }
      } catch (err) {
        if (!cancelled) captureModeError(err, { phase: 'hydrate', orgId });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const handleSetGlobalMode = useCallback((mode: AutomationMode) => {
    setGlobalMode(mode);
    setPreferences(getModePreferences());
  }, []);

  const handleSetPillarMode = useCallback(
    (pillar: Pillar, mode: AutomationMode) => {
      // Optimistic: update localStorage fallback immediately.
      setPillarMode(pillar, mode);
      setPreferences(getModePreferences());

      // Server persistence for the three product pillars.
      if (!orgId || !isServerPillar(pillar)) return;

      const previous = serverPillars[pillar];
      setServerPillars((prev) => ({
        ...prev,
        [pillar]: {
          mode,
          source: 'user' as ModeSource,
          floor: previous?.floor ?? 'manual',
          ceiling: previous?.ceiling ?? 'autopilot',
          lockedByAdmin: previous?.lockedByAdmin ?? false,
        },
      }));

      (async () => {
        try {
          const res = await fetch(`/api/orgs/${orgId}/mode`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pillar, mode }),
          });
          const json = await res.json();
          if (!res.ok || !json?.success) {
            throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
          }
          // Reconcile with the server's clamped/authoritative state.
          setServerPillars((prev) => ({
            ...prev,
            [pillar]: json.state as PillarModeState,
          }));
        } catch (err) {
          // Rollback optimistic update + report.
          setServerPillars((prev) => ({ ...prev, [pillar]: previous }));
          captureModeError(err, { phase: 'patch', orgId, pillar, mode });
        }
      })();
    },
    [orgId, serverPillars]
  );

  const handleClearPillarOverride = useCallback((pillar: Pillar) => {
    clearPillarOverride(pillar);
    setPreferences(getModePreferences());
  }, []);

  const handleHasPillarOverride = useCallback(
    (pillar: Pillar) => {
      if (isServerPillar(pillar) && serverPillars[pillar]) {
        return serverPillars[pillar]!.source === 'user';
      }
      return pillar in preferences.pillarOverrides;
    },
    [preferences.pillarOverrides, serverPillars]
  );

  const handleResolveMode = useCallback(
    (pillar: Pillar, ceiling?: AutomationMode): ModeResolutionResult => {
      let selectedMode: AutomationMode;
      let source: ModeResolutionResult['source'];

      const server = isServerPillar(pillar) ? serverPillars[pillar] : undefined;
      if (server) {
        // Server is source of truth once hydrated.
        selectedMode = server.mode;
        source = server.source === 'user' ? 'pillar-override' : 'global';
      } else if (preferences.pillarOverrides[pillar]) {
        selectedMode = preferences.pillarOverrides[pillar]!;
        source = 'pillar-override';
      } else if (preferences.globalMode) {
        selectedMode = preferences.globalMode;
        source = 'global';
      } else {
        selectedMode = 'manual';
        source = 'default';
      }

      // Effective ceiling = the tighter of the surface ceiling and the plan
      // ceiling (server). This keeps the read-path honest; PR-4 enforces writes.
      const modeOrder: AutomationMode[] = ['manual', 'copilot', 'autopilot'];
      const ceilings = [ceiling, server?.ceiling].filter(
        (c): c is AutomationMode => !!c
      );
      const effectiveCeiling =
        ceilings.length > 0
          ? ceilings.reduce((a, b) =>
              modeOrder.indexOf(a) <= modeOrder.indexOf(b) ? a : b
            )
          : undefined;

      if (effectiveCeiling) {
        const selectedIndex = modeOrder.indexOf(selectedMode);
        const ceilingIndex = modeOrder.indexOf(effectiveCeiling);
        const effectiveMode =
          selectedIndex <= ceilingIndex ? selectedMode : effectiveCeiling;
        return {
          selectedMode,
          effectiveMode,
          ceilingApplied: effectiveMode !== selectedMode,
          ceiling: effectiveCeiling,
          source,
        };
      }

      return {
        selectedMode,
        effectiveMode: selectedMode,
        ceilingApplied: false,
        source,
      };
    },
    [preferences, serverPillars]
  );

  const handleServerPillar = useCallback(
    (pillar: Pillar): PillarModeState | undefined =>
      isServerPillar(pillar) ? serverPillars[pillar] : undefined,
    [serverPillars]
  );

  const value: ModeContextValue = {
    preferences,
    setGlobalMode: handleSetGlobalMode,
    setPillarMode: handleSetPillarMode,
    clearPillarOverride: handleClearPillarOverride,
    hasPillarOverride: handleHasPillarOverride,
    resolveMode: handleResolveMode,
    serverPillar: handleServerPillar,
    isLoading,
  };

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
}

// ============================================
// HOOKS
// ============================================

export function useModeContext(): ModeContextValue {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useModeContext must be used within a ModeProvider');
  }
  return context;
}

/**
 * Primary hook for pillar components. Returns the effective mode plus the server
 * governance envelope (source/floor/ceiling/lockedByAdmin/isLoading).
 */
export function useMode(pillar: Pillar, ceiling?: AutomationMode) {
  const context = useContext(ModeContext);

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
      source: 'fallback' as ModeSource,
      floor: 'manual' as AutomationMode,
      ceiling: 'autopilot' as AutomationMode,
      lockedByAdmin: false,
      isLoading: false,
    };
  }

  const resolution = context.resolveMode(pillar, ceiling);
  const hasOverride = context.hasPillarOverride(pillar);
  const server = context.serverPillar(pillar);

  return {
    mode: resolution.selectedMode,
    effectiveMode: resolution.effectiveMode,
    resolution,
    setMode: (mode: AutomationMode) => context.setPillarMode(pillar, mode),
    setGlobalMode: context.setGlobalMode,
    clearOverride: () => context.clearPillarOverride(pillar),
    hasOverride,
    /** Where the effective mode came from (server governance). */
    source: (server?.source ?? 'fallback') as ModeSource,
    /** Plan/admin floor (enforced in PR-4). */
    floor: (server?.floor ?? 'manual') as AutomationMode,
    /** Plan/admin ceiling (enforced in PR-4). */
    ceiling: (server?.ceiling ?? 'autopilot') as AutomationMode,
    lockedByAdmin: server?.lockedByAdmin ?? false,
    isLoading: context.isLoading,
  };
}

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
