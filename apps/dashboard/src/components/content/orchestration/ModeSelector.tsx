/**
 * Mode Selector Component
 *
 * Phase 6A.3: Mode-driven experience implementation.
 * Allows users to select automation mode with ceiling enforcement.
 *
 * Per AUTOMATE_EXECUTION_MODEL:
 * - Manual: Human creates and approves
 * - Copilot: AI assists, human decides
 * - Autopilot: AI executes within constraints
 *
 * INVARIANT COMPLIANCE (§5 Mode-Driven):
 * - Current mode always visible
 * - Mode ceiling enforced
 * - Mode transitions are intentional and confirmed
 *
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { modeTokens, motion } from '../tokens';
import type { AutomationMode } from '../types';

// ============================================
// TYPES
// ============================================

interface ModeSelectorProps {
  /** Current selected mode */
  currentMode: AutomationMode;
  /** Maximum allowed mode for this action */
  modeCeiling: AutomationMode;
  /** Handler for mode change */
  onModeChange: (mode: AutomationMode) => void;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================
// MODE ORDER (for ceiling comparison)
// ============================================

const MODE_ORDER: AutomationMode[] = ['manual', 'copilot', 'autopilot'];

function getModeIndex(mode: AutomationMode): number {
  return MODE_ORDER.indexOf(mode);
}

function isModeBelowCeiling(mode: AutomationMode, ceiling: AutomationMode): boolean {
  return getModeIndex(mode) <= getModeIndex(ceiling);
}

// ============================================
// MODE CONFIGURATION
// ============================================

const MODE_CONFIG: Record<AutomationMode, {
  label: string;
  description: string;
  icon: React.ReactNode;
  shortDescription: string;
}> = {
  manual: {
    label: 'Manual',
    description: 'You control everything. AI provides no suggestions.',
    shortDescription: 'Full control',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  copilot: {
    label: 'Copilot',
    description: 'AI suggests completions. You approve each suggestion.',
    shortDescription: 'AI assists',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  autopilot: {
    label: 'Autopilot',
    description: 'AI drafts content. You review before publishing.',
    shortDescription: 'AI drafts',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
};

// ============================================
// MODE SELECTOR COMPONENT
// ============================================

export function ModeSelector({
  currentMode,
  modeCeiling,
  onModeChange,
  disabled = false,
}: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentConfig = MODE_CONFIG[currentMode];
  const tokens = modeTokens[currentMode];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleModeSelect = (mode: AutomationMode) => {
    if (isModeBelowCeiling(mode, modeCeiling) && !disabled) {
      onModeChange(mode);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border
          ${tokens.bg} ${tokens.border}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'}
          ${motion.transition.fast}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={tokens.text}>{currentConfig.icon}</span>
        <span className={`text-xs font-medium ${tokens.text}`}>{currentConfig.label}</span>
        {!disabled && (
          <svg
            className={`w-3 h-3 ${tokens.text} ${motion.transition.fast} ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute top-full left-0 mt-1 w-64 z-50
            bg-slate-2 border border-slate-4 rounded-lg shadow-elev-3
            ${motion.transition.fast}
          `}
          role="listbox"
        >
          {/* Ceiling Notice */}
          <div className="px-3 py-2 border-b border-slate-4">
            <p className="text-[10px] text-white/40">
              Mode ceiling for this action: <span className="text-white/60 font-medium">{MODE_CONFIG[modeCeiling].label}</span>
            </p>
          </div>

          {/* Mode Options */}
          <div className="py-1">
            {MODE_ORDER.map((mode) => {
              const config = MODE_CONFIG[mode];
              const modeToken = modeTokens[mode];
              const isAvailable = isModeBelowCeiling(mode, modeCeiling);
              const isSelected = mode === currentMode;

              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeSelect(mode)}
                  disabled={!isAvailable}
                  className={`
                    w-full px-3 py-2 text-left flex items-start gap-3
                    ${isSelected ? 'bg-white/5' : 'hover:bg-white/5'}
                    ${!isAvailable ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    ${motion.transition.fast}
                  `}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className={`p-1.5 rounded-lg ${modeToken.bg}`}>
                    <span className={modeToken.text}>{config.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isAvailable ? 'text-white' : 'text-white/40'}`}>
                        {config.label}
                      </span>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-brand-iris" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {!isAvailable && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-4 text-white/40 rounded">
                          Above ceiling
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${isAvailable ? 'text-white/50' : 'text-white/30'}`}>
                      {config.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MODE INDICATOR (Compact, read-only)
// ============================================

interface ModeIndicatorProps {
  mode: AutomationMode;
  showDescription?: boolean;
}

export function ModeIndicator({ mode, showDescription = false }: ModeIndicatorProps) {
  const config = MODE_CONFIG[mode];
  const tokens = modeTokens[mode];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${tokens.bg} ${tokens.border}`}>
      <span className={tokens.text}>{config.icon}</span>
      <span className={`text-xs font-medium ${tokens.text}`}>{config.label}</span>
      {showDescription && (
        <span className="text-xs text-white/40">• {config.shortDescription}</span>
      )}
    </div>
  );
}

// ============================================
// MODE BEHAVIOR BANNER (Shows what AI will do)
// ============================================

interface ModeBehaviorBannerProps {
  mode: AutomationMode;
  isActive?: boolean;
}

export function ModeBehaviorBanner({ mode, isActive = false }: ModeBehaviorBannerProps) {
  const tokens = modeTokens[mode];

  const behaviors: Record<AutomationMode, { action: string; indicator?: string }> = {
    manual: {
      action: 'AI is inactive. Write your content manually.',
    },
    copilot: {
      action: 'AI will suggest completions as you type.',
      indicator: 'Ghost text appears when paused',
    },
    autopilot: {
      action: 'AI is drafting content based on your brief.',
      indicator: 'Review required before publishing',
    },
  };

  const behavior = behaviors[mode];

  if (!isActive) return null;

  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border ${tokens.bg} ${tokens.border} ${motion.transition.fast}`}>
      <span className={`w-2 h-2 rounded-full ${tokens.bg.replace('/10', '')} ${mode !== 'manual' ? 'animate-pulse' : ''}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium ${tokens.text}`}>{behavior.action}</p>
        {behavior.indicator && (
          <p className="text-[10px] text-white/40">{behavior.indicator}</p>
        )}
      </div>
    </div>
  );
}

export default ModeSelector;
