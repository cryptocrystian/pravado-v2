'use client';

/**
 * PR Settings View (V1.1) - DS 3.0
 *
 * Automation ceilings, guardrails, and preferences with:
 * - SYSTEM ENFORCED explanation panels
 * - Clear visual distinction between locked and configurable settings
 * - Educational explainers for each constraint category
 * - DS 3.0 styling throughout
 *
 * @see /docs/canon/AUTOMATE_v2.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import { useState, useEffect, useCallback } from 'react';
import type { AutomationMode, AutomationCeiling, PRGuardrails } from '../types';
import {
  buttonStyles,
  glowEffects,
} from '../prWorkSurfaceStyles';

// ============================================
// TOAST COMPONENT
// ============================================

function Toast({
  message,
  isVisible,
  onClose,
  variant = 'success',
}: {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  variant?: 'success' | 'info' | 'warning';
}) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => onClose(), 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const variantStyles = {
    success: 'bg-semantic-success/15 border-semantic-success/30 text-semantic-success',
    info: 'bg-brand-cyan/15 border-brand-cyan/30 text-brand-cyan',
    warning: 'bg-semantic-warning/15 border-semantic-warning/30 text-semantic-warning',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-elev-3 ${variantStyles[variant]}`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================
// SLIDER WITH IMPROVED AFFORDANCE
// ============================================

function RangeSlider({
  value,
  min,
  max,
  onChange,
  accentColor = 'cyan',
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accentColor?: 'cyan' | 'magenta' | 'iris';
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const accentStyles = {
    cyan: 'from-brand-cyan to-brand-cyan/70',
    magenta: 'from-brand-magenta to-brand-magenta/70',
    iris: 'from-brand-iris to-brand-iris/70',
  };
  const thumbAccent = {
    cyan: 'bg-brand-cyan shadow-[0_0_12px_rgba(0,217,255,0.4)]',
    magenta: 'bg-brand-magenta shadow-[0_0_12px_rgba(232,121,249,0.4)]',
    iris: 'bg-brand-iris shadow-[0_0_12px_rgba(139,92,246,0.4)]',
  };

  return (
    <div className="relative group">
      {/* Track background */}
      <div className="h-2 rounded-full bg-[#1A1A24] overflow-hidden">
        {/* Fill */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${accentStyles[accentColor]} transition-all duration-100`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Native input (invisible but functional) */}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
      />
      {/* Custom thumb */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full ${thumbAccent[accentColor]} border-2 border-white transition-transform duration-100 group-hover:scale-110 pointer-events-none`}
        style={{ left: `calc(${percentage}% - 8px)` }}
      />
    </div>
  );
}

// ============================================
// AUTOMATION CEILINGS CONFIG
// ============================================

interface CeilingGroup {
  title: string;
  description: string;
  isSystemEnforced: boolean;
  systemReason?: string;
  ceilings: AutomationCeiling[];
}

const CEILING_GROUPS: CeilingGroup[] = [
  {
    title: 'Relationship Actions',
    description: 'Actions that involve direct contact with journalists, influencers, or media.',
    isSystemEnforced: true,
    systemReason: 'Relationship risk is too high for full automation. These ceilings protect your professional reputation and the quality of your media relationships.',
    ceilings: [
      {
        action: 'send_pitch',
        modeCeiling: 'manual',
        rationale: 'Each pitch represents your brand to a journalist. Automation risks damaging relationships.',
        overridable: false,
      },
      {
        action: 'send_followup',
        modeCeiling: 'copilot',
        rationale: 'Copilot can draft follow-ups, but a human must review tone and timing.',
        overridable: false,
      },
      {
        action: 'citemind_audio',
        modeCeiling: 'manual',
        rationale: 'V1 limitation: Audio content creation requires explicit human approval.',
        overridable: false,
      },
    ],
  },
  {
    title: 'Technical Optimization',
    description: 'Backend SEO and indexing operations with no external relationship risk.',
    isSystemEnforced: false,
    ceilings: [
      {
        action: 'generate_schema',
        modeCeiling: 'autopilot',
        rationale: 'Schema generation is a low-risk technical optimization.',
        overridable: true,
      },
      {
        action: 'submit_indexnow',
        modeCeiling: 'autopilot',
        rationale: 'IndexNow submission has no relationship or brand risk.',
        overridable: true,
      },
    ],
  },
  {
    title: 'Monitoring & Enrichment',
    description: 'Passive tracking and data quality operations.',
    isSystemEnforced: false,
    ceilings: [
      {
        action: 'track_coverage',
        modeCeiling: 'autopilot',
        rationale: 'Passive monitoring with no external-facing action.',
        overridable: true,
      },
      {
        action: 'contact_enrichment',
        modeCeiling: 'copilot',
        rationale: 'Data quality should be reviewed before updating contact records.',
        overridable: true,
      },
    ],
  },
];

const DEFAULT_GUARDRAILS: PRGuardrails = {
  personalizationMinimum: 60,
  followUpLimitPerWeek: 3,
  dailyPitchCap: {
    cold: 10,
    warm: 20,
    engaged: 30,
  },
  newContactRateWarning: 15,
};

// ============================================
// MODE BADGE COMPONENT
// ============================================

function ModeBadge({ mode, size = 'md' }: { mode: AutomationMode; size?: 'sm' | 'md' }) {
  const config = {
    manual: {
      bg: 'bg-semantic-danger/15',
      text: 'text-semantic-danger',
      border: 'border-semantic-danger/30',
      icon: '🔒',
      label: 'Manual Only',
      shortLabel: 'Manual',
    },
    copilot: {
      bg: 'bg-brand-iris/15',
      text: 'text-brand-iris',
      border: 'border-brand-iris/30',
      icon: '🤝',
      label: 'Copilot Max',
      shortLabel: 'Copilot',
    },
    autopilot: {
      bg: 'bg-semantic-success/15',
      text: 'text-semantic-success',
      border: 'border-semantic-success/30',
      icon: '🤖',
      label: 'Autopilot OK',
      shortLabel: 'Autopilot',
    },
  };

  const { bg, text, border, icon, label, shortLabel } = config[mode];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold uppercase rounded border ${bg} ${text} ${border}`}>
      <span>{icon}</span>
      <span>{size === 'sm' ? shortLabel : label}</span>
    </span>
  );
}

// ============================================
// SYSTEM ENFORCED BANNER COMPONENT
// ============================================

function SystemEnforcedBanner({ reason }: { reason: string }) {
  return (
    <div className="p-4 rounded-xl bg-semantic-danger/5 border border-semantic-danger/30 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-semantic-danger/15">
          <svg className="w-5 h-5 text-semantic-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-semantic-danger">SYSTEM ENFORCED</h4>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-semantic-danger/15 text-semantic-danger border border-semantic-danger/30">
              CANNOT OVERRIDE
            </span>
          </div>
          <p className="text-sm text-white/55">{reason}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONFIGURABLE BANNER COMPONENT
// ============================================

function ConfigurableBanner() {
  return (
    <div className="p-3 rounded-lg bg-semantic-success/10 border border-semantic-success/30 mb-4">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium text-semantic-success">USER CONFIGURABLE</span>
        <span className="text-xs text-white/55">You can adjust these ceilings based on your needs</span>
      </div>
    </div>
  );
}

// ============================================
// CEILING GROUP COMPONENT
// ============================================

function CeilingGroupPanel({ group }: { group: CeilingGroup }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`rounded-xl border overflow-hidden ${
      group.isSystemEnforced
        ? 'bg-gradient-to-br from-semantic-danger/5 to-transparent border-semantic-danger/20'
        : 'bg-[#0D0D12] border-[#1A1A24]'
    }`}>
      {/* Group Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-base font-semibold text-white">{group.title}</h4>
            {group.isSystemEnforced && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-semantic-danger/15 text-semantic-danger border border-semantic-danger/30">
                LOCKED
              </span>
            )}
          </div>
          <p className="text-sm text-white/55">{group.description}</p>
        </div>
        <svg
          className={`w-5 h-5 text-white/55 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Group Content */}
      {expanded && (
        <div className="px-5 pb-5">
          {group.isSystemEnforced && group.systemReason && (
            <SystemEnforcedBanner reason={group.systemReason} />
          )}
          {!group.isSystemEnforced && <ConfigurableBanner />}

          <div className="space-y-3">
            {group.ceilings.map((ceiling) => (
              <div
                key={ceiling.action}
                className={`p-4 rounded-lg border ${
                  !ceiling.overridable
                    ? 'bg-semantic-danger/5 border-semantic-danger/20'
                    : 'bg-[#13131A] border-[#1A1A24]'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-white capitalize">
                        {ceiling.action.replace(/_/g, ' ')}
                      </span>
                      <ModeBadge mode={ceiling.modeCeiling} size="sm" />
                    </div>
                    <p className="text-xs text-white/55">{ceiling.rationale}</p>
                  </div>
                  {!ceiling.overridable ? (
                    <div
                      className="group/lock shrink-0 flex items-center gap-1.5 px-2 py-1 rounded bg-semantic-danger/10 border border-semantic-danger/20 cursor-help hover:bg-semantic-danger/15 hover:border-semantic-danger/30 transition-all duration-200"
                      title="This setting is system-enforced and cannot be changed"
                    >
                      <svg className="w-3.5 h-3.5 text-semantic-danger group-hover/lock:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="text-[10px] font-medium text-semantic-danger">Locked</span>
                    </div>
                  ) : (
                    <div className="shrink-0">
                      <select
                        defaultValue={ceiling.modeCeiling}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#13131A] border border-[#1A1A24] text-white focus:outline-none focus:border-brand-magenta/50 focus:ring-1 focus:ring-brand-magenta/30"
                      >
                        <option value="manual">Manual</option>
                        <option value="copilot">Copilot</option>
                        <option value="autopilot">Autopilot</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PHILOSOPHY EXPLAINER
// ============================================

function PhilosophyExplainer() {
  return (
    <div className={`p-6 rounded-2xl bg-gradient-to-br from-brand-iris/10 to-brand-cyan/5 border border-brand-iris/20 ${glowEffects.content}`}>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-brand-iris/15">
          <svg className="w-6 h-6 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">The PRAVADO Philosophy</h3>
          <p className="text-sm text-white/55 mb-4">
            PRAVADO uses a three-tier automation model: <strong className="text-white">Manual</strong>,{' '}
            <strong className="text-white">Copilot</strong>, and <strong className="text-white">Autopilot</strong>.
            Not all actions can reach all tiers — and that&apos;s by design.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-[#13131A] border border-[#1A1A24]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔒</span>
                <span className="text-sm font-semibold text-semantic-danger">Manual</span>
              </div>
              <p className="text-xs text-white/55">
                Human does the action. AI may provide context but takes no action.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#13131A] border border-[#1A1A24]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🤝</span>
                <span className="text-sm font-semibold text-brand-iris">Copilot</span>
              </div>
              <p className="text-xs text-white/55">
                AI drafts, proposes, or prepares. Human reviews and approves before execution.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-[#13131A] border border-[#1A1A24]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🤖</span>
                <span className="text-sm font-semibold text-semantic-success">Autopilot</span>
              </div>
              <p className="text-xs text-white/55">
                AI executes autonomously within defined parameters. Human monitors outcomes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// GUARDRAILS PANEL
// ============================================

function GuardrailsPanel({
  guardrails,
  onChange,
}: {
  guardrails: PRGuardrails;
  onChange: (g: PRGuardrails) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Guardrails</h3>
          <p className="text-sm text-white/55 mt-1">
            Safety limits to protect relationships and prevent over-pitching
          </p>
        </div>
        <span className="px-3 py-1 text-[11px] font-bold uppercase rounded-full bg-semantic-success/15 text-semantic-success border border-semantic-success/30">
          User Configurable
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personalization Minimum */}
        <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-white">Personalization Minimum</label>
            <span className="text-sm font-mono text-brand-cyan">{guardrails.personalizationMinimum}%</span>
          </div>
          <RangeSlider
            value={guardrails.personalizationMinimum}
            min={0}
            max={100}
            onChange={(v) => onChange({ ...guardrails, personalizationMinimum: v })}
            accentColor="cyan"
          />
          <p className="text-xs text-white/50 mt-3">Pitches below this score will show a warning before sending</p>
        </div>

        {/* Follow-up Limit */}
        <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-white">Weekly Follow-up Limit</label>
            <span className="text-sm font-mono text-brand-cyan">{guardrails.followUpLimitPerWeek}</span>
          </div>
          <RangeSlider
            value={guardrails.followUpLimitPerWeek}
            min={1}
            max={5}
            onChange={(v) => onChange({ ...guardrails, followUpLimitPerWeek: v })}
            accentColor="cyan"
          />
          <p className="text-xs text-white/50 mt-3">Maximum follow-ups per contact per week</p>
        </div>

        {/* Daily Pitch Caps */}
        <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24] md:col-span-2">
          <label className="text-sm font-medium text-white mb-3 block">Daily Pitch Caps by Relationship Stage</label>
          <div className="grid grid-cols-3 gap-4">
            {(['cold', 'warm', 'engaged'] as const).map((stage) => {
              const colors = {
                cold: 'text-white/60',
                warm: 'text-semantic-warning',
                engaged: 'text-semantic-success',
              };
              const accents: Record<string, 'cyan' | 'magenta' | 'iris'> = {
                cold: 'cyan',
                warm: 'magenta',
                engaged: 'iris',
              };
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium capitalize ${colors[stage]}`}>{stage}</span>
                    <span className="text-xs font-mono text-brand-cyan">{guardrails.dailyPitchCap[stage]}</span>
                  </div>
                  <RangeSlider
                    value={guardrails.dailyPitchCap[stage]}
                    min={1}
                    max={50}
                    onChange={(v) =>
                      onChange({
                        ...guardrails,
                        dailyPitchCap: { ...guardrails.dailyPitchCap, [stage]: v },
                      })
                    }
                    accentColor={accents[stage]}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-white/50 mt-3">Maximum pitches per day for each relationship stage</p>
        </div>

        {/* New Contact Rate Warning */}
        <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24] md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-white">New Contact Rate Warning</label>
            <span className="text-sm font-mono text-brand-cyan">{guardrails.newContactRateWarning}%</span>
          </div>
          <RangeSlider
            value={guardrails.newContactRateWarning}
            min={5}
            max={50}
            onChange={(v) => onChange({ ...guardrails, newContactRateWarning: v })}
            accentColor="cyan"
          />
          <p className="text-xs text-white/50 mt-3">
            Show warning if more than this percentage of daily pitches go to new/cold contacts
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PRSettings() {
  const [guardrails, setGuardrails] = useState<PRGuardrails>(DEFAULT_GUARDRAILS);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleSave = useCallback(() => {
    // In real implementation, this would save to API
    console.log('Saving guardrails:', guardrails);
    setToastMessage('Settings saved successfully');
    setToastVisible(true);
  }, [guardrails]);

  const handleReset = useCallback(() => {
    setGuardrails(DEFAULT_GUARDRAILS);
    setToastMessage('Settings reset to defaults');
    setToastVisible(true);
  }, []);

  const hideToast = useCallback(() => {
    setToastVisible(false);
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Automation & Guardrails</h2>
          <p className="text-xs text-white/40 mt-0.5">Control what AI can do on your behalf</p>
        </div>
      </div>

      {/* Philosophy Explainer */}
      <PhilosophyExplainer />

      {/* Automation Ceilings */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Automation Ceilings</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-white/55">
              <div className="w-3 h-3 rounded bg-semantic-danger/30 border border-semantic-danger/50" />
              <span>System Enforced</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/55">
              <div className="w-3 h-3 rounded bg-semantic-success/30 border border-semantic-success/50" />
              <span>Configurable</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-white/55">
          Each action has a maximum automation level it can reach. Some ceilings are system-enforced and cannot be changed.
        </p>

        <div className="space-y-4">
          {CEILING_GROUPS.map((group) => (
            <CeilingGroupPanel key={group.title} group={group} />
          ))}
        </div>
      </div>

      {/* Guardrails */}
      <GuardrailsPanel guardrails={guardrails} onChange={setGuardrails} />

      {/* Save Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-[#1A1A24]">
        <button
          type="button"
          onClick={handleReset}
          className={buttonStyles.tertiary}
        >
          Reset to Defaults
        </button>
        <button
          type="button"
          onClick={handleSave}
          className={buttonStyles.primary}
        >
          Save Settings
        </button>
      </div>

      {/* Critical Constraints Notice */}
      <div className="p-5 rounded-xl bg-semantic-danger/5 border border-semantic-danger/20">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-semantic-danger/15">
            <svg className="w-5 h-5 text-semantic-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-semantic-danger mb-1">Critical Constraints</h4>
            <ul className="text-xs text-white/55 space-y-1">
              <li>• <strong className="text-white">Pitch sending</strong> will always require manual action — no exceptions</li>
              <li>• <strong className="text-white">Follow-up sending</strong> requires human review even in Copilot mode</li>
              <li>• <strong className="text-white">CiteMind audio generation</strong> is manual-only in V1</li>
              <li>• These constraints are enforced at the platform level and cannot be bypassed</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      <Toast message={toastMessage} isVisible={toastVisible} onClose={hideToast} />
    </div>
  );
}
