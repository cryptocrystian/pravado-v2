/**
 * Mode Switcher - Cross-Pillar Mode Control
 *
 * Phase 10A → 10B: User-controllable mode switcher for pillar shells.
 *
 * Features:
 * - Compact dropdown control for header placement
 * - Shows effective mode (after ceiling enforcement)
 * - Allows "this pillar" vs "global" scope selection
 * - Ceiling indicator when mode is capped
 * - Autopilot exit confirmation dialog (§6C canon)
 * - "Capped" badge on options above ceiling
 *
 * Per AI_VISUAL_COMMUNICATION_CANON: No decorative motion.
 * Transitions are communicative (state change only).
 *
 * @see /docs/canon/MODE_UX_ARCHITECTURE.md §4 ModeSwitcher, §6C Confirmation
 * @see /docs/canon/AUTOMATE_EXECUTION_MODEL.md
 */

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  type AutomationMode,
  type Pillar,
  MODE_CONFIGS,
  PILLAR_LABELS,
} from '@/lib/mode-preferences';
import { useMode } from '@/lib/ModeContext';

// ============================================
// ICONS
// ============================================

function ModeIcon({ mode, className = 'w-4 h-4' }: { mode: AutomationMode; className?: string }) {
  if (mode === 'manual') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    );
  }
  if (mode === 'copilot') {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

// ============================================
// MODE TOKEN STYLES
// ============================================

const MODE_TOKENS: Record<AutomationMode, { bg: string; border: string; text: string }> = {
  manual: {
    bg: 'bg-white/5',
    border: 'border-white/10',
    text: 'text-white/60',
  },
  copilot: {
    bg: 'bg-brand-iris/10',
    border: 'border-brand-iris/30',
    text: 'text-brand-iris',
  },
  autopilot: {
    bg: 'bg-brand-cyan/10',
    border: 'border-brand-cyan/30',
    text: 'text-brand-cyan',
  },
};

// ============================================
// MOCK ACTIVE ACTIONS COUNT
// ============================================

/** Mock count of actions currently being handled by Autopilot.
 *  Replace with real execution data when AUTOMATE backend is wired. */
const MOCK_AUTOPILOT_ACTIVE_ACTIONS = 4;

// ============================================
// AUTOPILOT EXIT CONFIRMATION DIALOG
// ============================================

interface AutopilotExitDialogProps {
  targetMode: AutomationMode;
  activeActionCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

function AutopilotExitDialog({ targetMode, activeActionCount, onCancel, onConfirm }: AutopilotExitDialogProps) {
  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    },
    [onCancel],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-page/70 backdrop-blur-sm"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dialog card — DS v3.1: bg-panel, border-border-subtle, rounded-xl, shadow-elev-3 */}
        <div
          className="bg-panel border border-border-subtle rounded-xl shadow-elev-3 w-full max-w-sm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="autopilot-exit-title"
          aria-describedby="autopilot-exit-desc"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-brand-cyan/10">
                <ModeIcon mode="autopilot" className="w-5 h-5 text-brand-cyan" />
              </div>
              <h3
                id="autopilot-exit-title"
                className="text-base font-semibold text-white/90"
              >
                Switch from Autopilot?
              </h3>
            </div>
            <p
              id="autopilot-exit-desc"
              className="text-sm text-white/60 leading-relaxed"
            >
              AI is currently handling{' '}
              <span className="text-brand-cyan font-medium">
                {activeActionCount} action{activeActionCount !== 1 ? 's' : ''}
              </span>
              . Switching to{' '}
              <span className="text-white/80 font-medium">{MODE_CONFIGS[targetMode].label}</span>{' '}
              will pause these.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6 pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-colors duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white/90 bg-brand-iris rounded-lg hover:bg-brand-iris/90 transition-colors duration-150"
            >
              Switch to {MODE_CONFIGS[targetMode].label}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================
// TYPES
// ============================================

interface ModeSwitcherProps {
  /** The pillar this switcher controls */
  pillar: Pillar;
  /** Optional ceiling restriction for this surface */
  ceiling?: AutomationMode;
  /** Compact mode (icon only trigger) */
  compact?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function ModeSwitcher({ pillar, ceiling, compact = false }: ModeSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState<'pillar' | 'global'>('pillar');
  const [exitConfirm, setExitConfirm] = useState<{ targetMode: AutomationMode } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    mode: selectedMode,
    effectiveMode,
    resolution,
    setMode,
    setGlobalMode,
    hasOverride,
  } = useMode(pillar, ceiling);

  const tokens = MODE_TOKENS[effectiveMode];
  const config = MODE_CONFIGS[effectiveMode];

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  /** Commit a mode change (after any confirmation) */
  const commitModeChange = useCallback((mode: AutomationMode) => {
    if (scope === 'global') {
      setGlobalMode(mode);
    } else {
      setMode(mode);
    }
    setIsOpen(false);
  }, [scope, setGlobalMode, setMode]);

  /**
   * Handle mode selection.
   * Per MODE_UX_ARCHITECTURE.md §6C: If switching FROM Autopilot,
   * show a confirmation dialog before applying the change.
   */
  const handleModeSelect = useCallback((mode: AutomationMode) => {
    // §6C: Confirmation only when switching FROM Autopilot to a lower mode
    if (effectiveMode === 'autopilot' && mode !== 'autopilot') {
      setExitConfirm({ targetMode: mode });
      setIsOpen(false);
      return;
    }
    commitModeChange(mode);
  }, [effectiveMode, commitModeChange]);

  const handleExitConfirm = useCallback(() => {
    if (exitConfirm) {
      commitModeChange(exitConfirm.targetMode);
    }
    setExitConfirm(null);
  }, [exitConfirm, commitModeChange]);

  const handleExitCancel = useCallback(() => {
    setExitConfirm(null);
  }, []);

  const MODE_ORDER: AutomationMode[] = ['manual', 'copilot', 'autopilot'];

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-lg border
            ${tokens.bg} ${tokens.border}
            hover:bg-white/5
            transition-colors duration-200
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <ModeIcon mode={effectiveMode} className={`w-3.5 h-3.5 ${tokens.text}`} />
          {!compact && (
            <span className={`text-xs font-medium ${tokens.text}`}>
              {config.label}
            </span>
          )}
          {/* Ceiling indicator on trigger */}
          {resolution.ceilingApplied && (
            <span className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-semantic-warning/20 text-semantic-warning rounded">
              Capped
            </span>
          )}
          {/* Override indicator */}
          {hasOverride && !resolution.ceilingApplied && (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-iris" title="Pillar override active" />
          )}
          <svg
            className={`w-3 h-3 ${tokens.text} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute top-full left-0 mt-1 w-72 z-50 bg-panel border border-border-subtle rounded-xl shadow-elev-3 overflow-hidden"
            role="listbox"
          >
            {/* Header with scope toggle */}
            <div className="px-3 py-2 border-b border-border-subtle bg-slate-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                  Set Mode
                </span>
                {/* Scope toggle */}
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setScope('pillar')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      scope === 'pillar'
                        ? 'bg-white/10 text-white/90'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    {PILLAR_LABELS[pillar].split(' ')[0]} only
                  </button>
                  <button
                    type="button"
                    onClick={() => setScope('global')}
                    className={`px-2 py-0.5 rounded font-medium ${
                      scope === 'global'
                        ? 'bg-white/10 text-white/90'
                        : 'text-white/40 hover:text-white/60'
                    }`}
                  >
                    All pillars
                  </button>
                </div>
              </div>
            </div>

            {/* Ceiling notice */}
            {ceiling && (
              <div className="px-3 py-2 border-b border-border-subtle bg-semantic-warning/5">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-semantic-warning">
                    Ceiling: <span className="normal-case font-medium tracking-normal">{MODE_CONFIGS[ceiling].label}</span>
                  </span>
                </div>
                <p className="text-xs text-white/40 mt-1 ml-5">
                  This surface restricts modes above {MODE_CONFIGS[ceiling].label.toLowerCase()}.
                </p>
              </div>
            )}

            {/* Mode Options */}
            <div className="py-1">
              {MODE_ORDER.map((mode) => {
                const modeConfig = MODE_CONFIGS[mode];
                const modeTokens = MODE_TOKENS[mode];
                const isAboveCeiling = !!(ceiling && MODE_ORDER.indexOf(mode) > MODE_ORDER.indexOf(ceiling));
                const isSelected = mode === selectedMode;
                const isEffective = mode === effectiveMode;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => !isAboveCeiling && handleModeSelect(mode)}
                    disabled={isAboveCeiling}
                    className={`
                      w-full px-3 py-2.5 text-left flex items-start gap-3
                      ${isEffective ? 'bg-white/5' : 'hover:bg-white/5'}
                      ${isAboveCeiling ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                      transition-colors duration-150
                    `}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className={`p-1.5 rounded-lg ${modeTokens.bg}`}>
                      <ModeIcon mode={mode} className={`w-4 h-4 ${modeTokens.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${isAboveCeiling ? 'text-white/40' : 'text-white/90'}`}>
                          {modeConfig.label}
                        </span>
                        {isEffective && (
                          <svg className="w-3.5 h-3.5 text-semantic-success" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {isSelected && !isEffective && (
                          <span className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-semantic-warning/20 text-semantic-warning rounded">
                            Capped
                          </span>
                        )}
                        {isAboveCeiling && (
                          <span className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-slate-4 text-white/40 rounded">
                            Capped
                          </span>
                        )}
                      </div>
                      <p className={`text-xs ${isAboveCeiling ? 'text-white/30' : 'text-white/50'}`}>
                        {modeConfig.shortDescription}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Current state summary */}
            {hasOverride && (
              <div className="px-3 py-2 border-t border-border-subtle bg-slate-1">
                <p className="text-xs text-white/40">
                  <span className="text-brand-iris">Override active</span> for {PILLAR_LABELS[pillar]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Autopilot Exit Confirmation Dialog — §6C */}
      {exitConfirm && (
        <AutopilotExitDialog
          targetMode={exitConfirm.targetMode}
          activeActionCount={MOCK_AUTOPILOT_ACTIVE_ACTIONS}
          onCancel={handleExitCancel}
          onConfirm={handleExitConfirm}
        />
      )}
    </>
  );
}

export default ModeSwitcher;
