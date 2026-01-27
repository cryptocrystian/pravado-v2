'use client';

/**
 * Distribution Decision Matrix V1.1 - DS 3.0
 *
 * Two-track distribution system with CiteMind as the hero track:
 * - Track 1: CiteMind AEO (default ON) - Cohesive flow: Schema → Newsroom → IndexNow → Citations
 * - Track 2: Legacy Wire (default OFF) - Add-on commerce decision with explicit confirmation
 *
 * NO autopilot distribution. All sends require manual trigger.
 *
 * @see /docs/canon/CITEMIND_SYSTEM.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md (V1.1)
 */

import { useState } from 'react';
import type { DistributionTrack, DistributionTrackInfo } from '../types';
import { ImpactStrip } from './ImpactStrip';
import {
  glowEffects,
  buttonStyles,
} from '../prWorkSurfaceStyles';

// ============================================
// TRACK CONFIGURATIONS (V1.1)
// ============================================

const TRACK_CONFIGS: DistributionTrackInfo[] = [
  {
    track: 'citemind_aeo',
    isPrimary: true,
    headline: 'CiteMind AEO',
    description: 'AI-optimized distribution via CiteMind Newsroom — the modern path to earned visibility',
    features: [
      'NewsArticle schema generation',
      'Instant IndexNow submission',
      'AI citation tracking',
      'Semantic markup optimization',
      'Entity extraction & reinforcement',
    ],
    cost: 0,
    costDescription: 'Included with all plans',
    requiresConfirmation: false,
    expectedOutcomes: [
      'Indexed within 24-48 hours',
      'AI systems receive semantic signals',
      'Citation tracking begins immediately',
      'Entity graph updated in real-time',
    ],
    citeMindIntegration: {
      schemaGeneration: true,
      indexNow: true,
      citationTracking: true,
    },
  },
  {
    track: 'legacy_wire',
    isPrimary: false,
    headline: 'Traditional Wire',
    description: 'Legacy PR wire distribution through traditional channels — for when you need mass media reach',
    features: [
      'AP/Reuters syndication',
      'Print media reach',
      'Broadcast pickup potential',
      'Financial disclosure compliance',
    ],
    cost: 49900, // $499.00 in cents
    costDescription: '$499 per release',
    requiresConfirmation: true,
    expectedOutcomes: [
      'Wire syndication within 2-4 hours',
      'Potential print/broadcast pickup',
      'No AI optimization',
      'Traditional reach metrics only',
    ],
  },
];

// ============================================
// CITEMIND FLOW VISUALIZATION
// ============================================

function CiteMindFlowVisual() {
  const steps = [
    { label: 'Schema', icon: '{ }', description: 'NewsArticle markup generated' },
    { label: 'Publish', icon: '📰', description: 'Published to Newsroom' },
    { label: 'Index', icon: '🔔', description: 'IndexNow submitted' },
    { label: 'Track', icon: '📊', description: 'Citation monitoring begins' },
  ];

  return (
    <div className="p-4 rounded-xl bg-gradient-to-r from-brand-cyan/10 to-brand-iris/10 border border-brand-cyan/20">
      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs font-medium text-brand-cyan uppercase tracking-wider">
          CiteMind Integration Flow
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-[#13131A] border border-brand-cyan/30 flex items-center justify-center text-lg">
                {step.icon}
              </div>
              <span className="text-xs text-white font-medium mt-1">{step.label}</span>
              <span className="text-[10px] text-white/55 text-center max-w-[80px]">{step.description}</span>
            </div>
            {index < steps.length - 1 && (
              <svg className="w-6 h-6 text-brand-cyan/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// WHY CHOOSE THIS TRACK EXPLAINER
// ============================================

function TrackExplainer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0F]/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl p-6 rounded-2xl bg-[#0D0D12] border border-[#1A1A24] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Why Choose Each Track?</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 text-white/55" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CiteMind Track */}
          <div className="p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-semantic-success/15 text-semantic-success border border-semantic-success/30">
                Recommended
              </span>
              <span className="text-sm font-semibold text-brand-cyan">CiteMind AEO</span>
            </div>
            <p className="text-sm text-white/55 mb-4">
              Best for maximizing AI visibility and long-term search presence. Uses semantic
              markup to help AI systems understand and cite your content.
            </p>
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Best For:</div>
              <ul className="space-y-1 text-xs text-white/55">
                <li className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-brand-cyan" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                  Product announcements & updates
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-brand-cyan" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                  Thought leadership content
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-brand-cyan" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                  Building long-term authority
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-brand-cyan" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                  AI answer engine optimization
                </li>
              </ul>
            </div>
          </div>

          {/* Legacy Wire Track */}
          <div className="p-4 rounded-xl bg-[#13131A] border border-[#1A1A24]">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/30">
                Add-on
              </span>
              <span className="text-sm font-semibold text-white/70">Traditional Wire</span>
            </div>
            <p className="text-sm text-white/55 mb-4">
              Best for time-sensitive announcements requiring immediate mass media reach
              and regulatory compliance scenarios.
            </p>
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Best For:</div>
              <ul className="space-y-1 text-xs text-white/55">
                <li className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-semantic-warning" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                  SEC/financial disclosures
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-semantic-warning" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                  Major acquisitions/IPO news
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-semantic-warning" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                  Crisis communications
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-3 h-3 text-semantic-warning" fill="currentColor" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3"/></svg>
                  Broad print/broadcast reach
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-brand-iris/5 border border-brand-iris/20">
          <p className="text-xs text-white/55">
            <strong className="text-brand-iris">Pro tip:</strong> Most announcements benefit most from CiteMind AEO alone.
            Only add Traditional Wire when you specifically need immediate mass media syndication or regulatory compliance.
            Using both together is generally unnecessary and can dilute your narrative control.
          </p>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={buttonStyles.primary}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

interface Props {
  releaseId?: string;
  onDistribute?: (tracks: DistributionTrack[]) => void;
  disabled?: boolean;
}

export function DistributionDecisionMatrix({ releaseId: _releaseId, onDistribute, disabled }: Props) {
  const [selectedTracks, setSelectedTracks] = useState<Set<DistributionTrack>>(
    new Set(['citemind_aeo'])
  );
  const [legacyConfirmed, setLegacyConfirmed] = useState(false);
  const [showLegacyConfirmation, setShowLegacyConfirmation] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const handleTrackToggle = (trackId: DistributionTrack) => {
    const track = TRACK_CONFIGS.find((t) => t.track === trackId);
    if (!track) return;

    if (trackId === 'legacy_wire' && !selectedTracks.has(trackId)) {
      setShowLegacyConfirmation(true);
      return;
    }

    setSelectedTracks((prev) => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
        if (trackId === 'legacy_wire') {
          setLegacyConfirmed(false);
        }
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const confirmLegacyWire = () => {
    setLegacyConfirmed(true);
    setSelectedTracks((prev) => new Set([...prev, 'legacy_wire']));
    setShowLegacyConfirmation(false);
  };

  const totalCost = Array.from(selectedTracks).reduce((sum, trackId) => {
    const track = TRACK_CONFIGS.find((t) => t.track === trackId);
    return sum + (track?.cost || 0);
  }, 0);

  const handleDistribute = () => {
    if (onDistribute) {
      onDistribute(Array.from(selectedTracks));
    }
  };

  const citeMindTrack = TRACK_CONFIGS[0];
  const legacyTrack = TRACK_CONFIGS[1];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Distribution Channels</h3>
          <p className="text-sm text-white/55 mt-1">
            Select distribution tracks for your press release
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowExplainer(true)}
            className="text-xs text-brand-iris hover:text-brand-iris/80 transition-colors underline"
          >
            Why choose each track?
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse" />
            <span className="text-xs text-brand-cyan font-medium">Manual distribution only</span>
          </div>
        </div>
      </div>

      {/* Track 1: CiteMind AEO (Hero) */}
      <div
        className={`relative rounded-2xl border-2 transition-all cursor-pointer ${
          selectedTracks.has('citemind_aeo')
            ? `border-brand-cyan bg-gradient-to-br from-brand-cyan/5 to-transparent ${glowEffects.seo}`
            : 'border-[#1A1A24] bg-[#0D0D12] hover:border-[#2A2A36]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && handleTrackToggle('citemind_aeo')}
      >
        {/* Hero Badge */}
        <div className="absolute -top-3 left-4 flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-brand-cyan text-[#0A0A0F]">
            Primary Track
          </span>
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-full bg-semantic-success/15 text-semantic-success border border-semantic-success/30">
            Recommended
          </span>
        </div>

        <div className="p-6 pt-8">
          <div className="flex items-start gap-4">
            {/* Checkbox */}
            <div
              className={`shrink-0 w-6 h-6 mt-1 rounded-lg border-2 flex items-center justify-center transition-colors ${
                selectedTracks.has('citemind_aeo')
                  ? 'border-brand-cyan bg-brand-cyan'
                  : 'border-[#2A2A36] bg-transparent'
              }`}
            >
              {selectedTracks.has('citemind_aeo') && (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="text-xl font-semibold text-white">{citeMindTrack.headline}</h4>
                <span className="text-sm font-medium text-semantic-success">{citeMindTrack.costDescription}</span>
              </div>

              <p className="text-sm text-white/55 mb-4">{citeMindTrack.description}</p>

              {/* CiteMind Flow Visual */}
              <CiteMindFlowVisual />

              {/* Features */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {citeMindTrack.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2 text-sm text-white/55">
                    <svg className="w-4 h-4 text-brand-cyan shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>

              {/* Impact Strip */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-white/55">Impact:</span>
                <ImpactStrip
                  sageContributions={[
                    { dimension: 'authority', isPrimary: true },
                    { dimension: 'exposure', isPrimary: false },
                  ]}
                  eviImpact={{ driver: 'visibility', direction: 'positive' }}
                  mode="manual"
                  compact
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Track 2: Legacy Wire (Add-on) */}
      <div
        className={`relative rounded-xl border transition-all cursor-pointer ${
          selectedTracks.has('legacy_wire')
            ? 'border-semantic-warning/50 bg-semantic-warning/5'
            : 'border-[#1A1A24] bg-[#0D0D12] hover:border-[#2A2A36]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && handleTrackToggle('legacy_wire')}
      >
        {/* Add-on Badge */}
        <div className="absolute -top-3 left-4 flex items-center gap-2">
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase rounded-full bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/30">
            Add-on Option
          </span>
          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-white/10 text-white/55">
            growth+ plan
          </span>
        </div>

        <div className="p-5 pt-6">
          <div className="flex items-start gap-4">
            {/* Checkbox */}
            <div
              className={`shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${
                selectedTracks.has('legacy_wire')
                  ? 'border-semantic-warning bg-semantic-warning'
                  : 'border-[#2A2A36] bg-transparent'
              }`}
            >
              {selectedTracks.has('legacy_wire') && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-semibold text-white">{legacyTrack.headline}</h4>
                <span className="text-sm font-medium text-semantic-warning">{legacyTrack.costDescription}</span>
              </div>

              <p className="text-sm text-white/55 mb-3">{legacyTrack.description}</p>

              {/* Features */}
              <div className="flex flex-wrap gap-3 mb-3">
                {legacyTrack.features.map((feature) => (
                  <span key={feature} className="text-xs text-white/55 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </span>
                ))}
              </div>

              {/* Expected Outcomes */}
              {selectedTracks.has('legacy_wire') && (
                <div className="p-3 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20">
                  <div className="text-xs font-medium text-semantic-warning mb-1">Expected Outcomes:</div>
                  <ul className="text-xs text-white/55 space-y-1">
                    {legacyTrack.expectedOutcomes.map((outcome) => (
                      <li key={outcome}>• {outcome}</li>
                    ))}
                  </ul>
                  {legacyConfirmed ? (
                    <div className="mt-2 text-xs text-semantic-success">✓ Wire distribution confirmed</div>
                  ) : (
                    <div className="mt-2 text-xs text-semantic-warning">⚠ Requires confirmation before distribution</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#13131A] border border-[#1A1A24]">
        <div>
          <div className="text-sm text-white/55">Total Distribution Cost</div>
          <div className="text-2xl font-bold text-white">
            {totalCost === 0 ? 'Free' : `$${(totalCost / 100).toFixed(2)}`}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDistribute}
          disabled={disabled || selectedTracks.size === 0}
          className={`${buttonStyles.primary} shadow-lg shadow-brand-magenta/20`}
        >
          Distribute Now
        </button>
      </div>

      {/* Manual Execution Notice */}
      <div className="p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-brand-cyan font-medium">No Automatic Distribution</p>
            <p className="text-xs text-white/55 mt-1">
              All distribution requires your explicit action. Press releases will not be sent without clicking "Distribute Now".
              CiteMind audio content generation is manual-only in V1.
            </p>
          </div>
        </div>
      </div>

      {/* Legacy Wire Confirmation Modal */}
      {showLegacyConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0A0F]/80 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0D0D12] border border-[#1A1A24] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-semantic-warning/15">
                <svg className="w-6 h-6 text-semantic-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">Confirm Wire Distribution</h3>
            </div>

            <p className="text-sm text-white/55 mb-4">
              Traditional wire distribution costs <strong className="text-white">$499.00</strong> per release
              and cannot be undone once sent. This will distribute your press release to major wire services
              including AP and Reuters.
            </p>

            <div className="p-3 rounded-lg bg-semantic-warning/10 border border-semantic-warning/20 mb-6">
              <p className="text-xs text-semantic-warning">
                By confirming, you acknowledge this charge and that wire distribution is immediate and irreversible.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowLegacyConfirmation(false)}
                className={buttonStyles.secondary + ' flex-1'}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLegacyWire}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-semantic-warning rounded-lg hover:bg-semantic-warning/90 transition-colors"
              >
                Confirm Wire Distribution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track Explainer Modal */}
      <TrackExplainer isOpen={showExplainer} onClose={() => setShowExplainer(false)} />
    </div>
  );
}
