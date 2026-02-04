/**
 * Mode Preferences - Global + Per-Pillar Mode Management
 *
 * Phase 10A: Implements user-controllable mode system with:
 * - Global default mode (platform-wide)
 * - Per-pillar overrides (PR, Content, Command Center, SEO)
 * - Ceiling enforcement (surface-level restrictions honored)
 * - localStorage persistence with in-memory fallback
 *
 * RESOLUTION HIERARCHY:
 * 1. If pillar override exists, use it
 * 2. Else use global mode
 * 3. Default to 'manual' (most restrictive)
 *
 * @see /docs/canon/UX_CONTINUITY_CANON.md §5 Mode-Driven
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 */

// ============================================
// TYPES
// ============================================

export type AutomationMode = 'manual' | 'copilot' | 'autopilot';

export type Pillar = 'commandCenter' | 'pr' | 'content' | 'seo';

export interface ModePreferences {
  /** Platform-wide default mode */
  globalMode: AutomationMode;
  /** Per-pillar overrides (optional) */
  pillarOverrides: Partial<Record<Pillar, AutomationMode>>;
  /** When preferences were last updated */
  updatedAt: string;
}

export interface ModeResolutionResult {
  /** The mode the user selected (or inherited from global) */
  selectedMode: AutomationMode;
  /** The effective mode after ceiling enforcement */
  effectiveMode: AutomationMode;
  /** Whether ceiling was applied */
  ceilingApplied: boolean;
  /** The ceiling that was enforced (if any) */
  ceiling?: AutomationMode;
  /** Source of the selected mode */
  source: 'pillar-override' | 'global' | 'default';
}

// ============================================
// CONSTANTS
// ============================================

const STORAGE_KEY = 'pravado:mode-preferences';

const DEFAULT_PREFERENCES: ModePreferences = {
  globalMode: 'manual',
  pillarOverrides: {},
  updatedAt: '1970-01-01T00:00:00.000Z', // Static epoch for hydration safety
};

/** Mode autonomy order (lower index = less autonomy) */
const MODE_ORDER: AutomationMode[] = ['manual', 'copilot', 'autopilot'];

// ============================================
// MODE COMPARISON UTILITIES
// ============================================

/**
 * Get the autonomy index of a mode (higher = more autonomous)
 */
export function getModeIndex(mode: AutomationMode): number {
  return MODE_ORDER.indexOf(mode);
}

/**
 * Check if a mode is at or below a ceiling
 */
export function isModeBelowOrAtCeiling(mode: AutomationMode, ceiling: AutomationMode): boolean {
  return getModeIndex(mode) <= getModeIndex(ceiling);
}

/**
 * Get the effective mode after applying ceiling
 */
export function applyModeCeiling(requestedMode: AutomationMode, ceiling: AutomationMode): AutomationMode {
  if (isModeBelowOrAtCeiling(requestedMode, ceiling)) {
    return requestedMode;
  }
  return ceiling;
}

// ============================================
// STORAGE LAYER
// ============================================

let inMemoryPreferences: ModePreferences = { ...DEFAULT_PREFERENCES };

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Load preferences from storage (localStorage or in-memory fallback)
 */
export function loadPreferences(): ModePreferences {
  if (typeof window === 'undefined') {
    return inMemoryPreferences;
  }

  if (isLocalStorageAvailable()) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ModePreferences;
        // Validate structure
        if (parsed.globalMode && MODE_ORDER.includes(parsed.globalMode)) {
          inMemoryPreferences = parsed;
          return parsed;
        }
      }
    } catch {
      // Fall through to default
    }
  }

  return inMemoryPreferences;
}

/**
 * Save preferences to storage
 */
export function savePreferences(prefs: ModePreferences): void {
  const updated = {
    ...prefs,
    updatedAt: new Date().toISOString(),
  };

  inMemoryPreferences = updated;

  if (typeof window !== 'undefined' && isLocalStorageAvailable()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage full or unavailable - in-memory state is still updated
    }
  }
}

// ============================================
// PREFERENCE ACCESSORS
// ============================================

/**
 * Get the current mode preferences
 */
export function getModePreferences(): ModePreferences {
  return loadPreferences();
}

/**
 * Set the global mode (platform-wide default)
 */
export function setGlobalMode(mode: AutomationMode): void {
  const current = loadPreferences();
  savePreferences({
    ...current,
    globalMode: mode,
  });
}

/**
 * Set a pillar-specific mode override
 */
export function setPillarMode(pillar: Pillar, mode: AutomationMode): void {
  const current = loadPreferences();
  savePreferences({
    ...current,
    pillarOverrides: {
      ...current.pillarOverrides,
      [pillar]: mode,
    },
  });
}

/**
 * Clear a pillar override (fall back to global)
 */
export function clearPillarOverride(pillar: Pillar): void {
  const current = loadPreferences();
  const { [pillar]: _, ...remaining } = current.pillarOverrides;
  savePreferences({
    ...current,
    pillarOverrides: remaining,
  });
}

/**
 * Check if a pillar has an override set
 */
export function hasPillarOverride(pillar: Pillar): boolean {
  const prefs = loadPreferences();
  return pillar in prefs.pillarOverrides;
}

// ============================================
// MODE RESOLUTION
// ============================================

/**
 * Resolve the effective mode for a pillar with optional ceiling enforcement.
 *
 * This is the PRIMARY function for determining which mode to use.
 *
 * @param pillar - The pillar to resolve mode for
 * @param ceiling - Optional ceiling (surface-level restriction)
 * @returns Resolution result with selected mode, effective mode, and metadata
 */
export function resolveMode(
  pillar: Pillar,
  ceiling?: AutomationMode
): ModeResolutionResult {
  const prefs = loadPreferences();

  // Determine selected mode (pillar override > global > default)
  let selectedMode: AutomationMode;
  let source: ModeResolutionResult['source'];

  if (prefs.pillarOverrides[pillar]) {
    selectedMode = prefs.pillarOverrides[pillar]!;
    source = 'pillar-override';
  } else if (prefs.globalMode) {
    selectedMode = prefs.globalMode;
    source = 'global';
  } else {
    selectedMode = 'manual';
    source = 'default';
  }

  // Apply ceiling if provided
  if (ceiling) {
    const effectiveMode = applyModeCeiling(selectedMode, ceiling);
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
}

/**
 * Simple mode resolution without ceiling (convenience function)
 */
export function getEffectiveMode(pillar: Pillar): AutomationMode {
  return resolveMode(pillar).effectiveMode;
}

// ============================================
// MODE LABELS & CONFIG
// ============================================

export interface ModeConfig {
  label: string;
  description: string;
  shortDescription: string;
}

export const MODE_CONFIGS: Record<AutomationMode, ModeConfig> = {
  manual: {
    label: 'Manual',
    description: 'You control everything. AI provides suggestions but takes no action.',
    shortDescription: 'Full control',
  },
  copilot: {
    label: 'Copilot',
    description: 'AI prepares drafts and recommendations. You approve before execution.',
    shortDescription: 'AI assists, you approve',
  },
  autopilot: {
    label: 'Autopilot',
    description: 'AI handles routine tasks automatically. You review exceptions only.',
    shortDescription: 'AI executes, you monitor',
  },
};

export const PILLAR_LABELS: Record<Pillar, string> = {
  commandCenter: 'Command Center',
  pr: 'PR Intelligence',
  content: 'Content Hub',
  seo: 'SEO Command',
};
