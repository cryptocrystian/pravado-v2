'use client';

/**
 * EVI Explainer Modal
 *
 * Customer-facing modal explaining the Earned Visibility Index (EVI).
 * Provides:
 * - Plain-English definition
 * - Formula breakdown
 * - Worked example
 * - Improvement tips
 *
 * @see /docs/canon/EVI_SPEC.md
 */

import { useState } from 'react';
import type { EVIDriverType } from './types';

interface EVIExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional: current EVI data to show worked example */
  currentScore?: number;
  drivers?: {
    visibility: number;
    authority: number;
    momentum: number;
  };
}

// Driver config for display
const driverConfig: Record<EVIDriverType, {
  label: string;
  weight: string;
  color: string;
  icon: string;
  description: string;
  tips: string[];
}> = {
  visibility: {
    label: 'Visibility',
    weight: '40%',
    color: 'brand-cyan',
    icon: '👁',
    description: 'How often your brand appears in AI answers, press coverage, and search results.',
    tips: [
      'Secure press coverage in tier-1 publications',
      'Optimize content for AI citation patterns',
      'Target featured snippets for key queries',
    ],
  },
  authority: {
    label: 'Authority',
    weight: '35%',
    color: 'brand-iris',
    icon: '🏛',
    description: 'How credible and trustworthy sources consider your brand.',
    tips: [
      'Earn backlinks from high-DA domains',
      'Build relationships with industry journalists',
      'Implement structured data on key pages',
    ],
  },
  momentum: {
    label: 'Momentum',
    weight: '25%',
    color: 'brand-magenta',
    icon: '🚀',
    description: 'How your visibility is changing relative to competitors.',
    tips: [
      'Maintain consistent publishing cadence',
      'Monitor competitor PR activity',
      'Capitalize on trending topics quickly',
    ],
  },
};

// Status band config
const statusBands = [
  { range: '0-40', label: 'At Risk', color: 'semantic-danger', description: 'Urgent action needed to improve brand visibility' },
  { range: '41-60', label: 'Emerging', color: 'brand-amber', description: 'Building momentum, focus on growth opportunities' },
  { range: '61-80', label: 'Competitive', color: 'brand-cyan', description: 'Strong position, maintain and optimize' },
  { range: '81-100', label: 'Dominant', color: 'semantic-success', description: 'Market leader, focus on defense and expansion' },
];

export function EVIExplainerModal({ isOpen, onClose, currentScore, drivers }: EVIExplainerModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'formula' | 'improve'>('overview');

  if (!isOpen) return null;

  const workedExample = drivers
    ? {
        visibility: drivers.visibility,
        authority: drivers.authority,
        momentum: drivers.momentum,
        calculated: (drivers.visibility * 0.4 + drivers.authority * 0.35 + drivers.momentum * 0.25).toFixed(1),
      }
    : {
        visibility: 72.5,
        authority: 64.8,
        momentum: 61.2,
        calculated: '67.0',
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#0D0D12] border border-[#1A1A24] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1A1A24]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30 flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">What is EVI?</h2>
              <p className="text-xs text-white/50">Earned Visibility Index</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-[#1A1A24] bg-[#0A0A0F]">
          {(['overview', 'formula', 'improve'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-all
                ${activeTab === tab
                  ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
                  : 'text-white/55 hover:text-white/90 hover:bg-[#1A1A24]'
                }
              `}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'formula' && 'How it Works'}
              {tab === 'improve' && 'Improve Score'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Definition */}
              <div className="p-4 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-2">The North Star for Modern PR</h3>
                <p className="text-sm text-white/70 leading-relaxed">
                  <strong className="text-brand-cyan">EVI (Earned Visibility Index)</strong> is a single score from 0-100
                  that measures your brand&apos;s earned media presence across AI answers, press coverage, and search visibility.
                  It combines three key drivers: <span className="text-brand-cyan">Visibility</span>,
                  <span className="text-brand-iris ml-1">Authority</span>, and
                  <span className="text-brand-magenta ml-1">Momentum</span>.
                </p>
              </div>

              {/* Current Score */}
              {currentScore && (
                <div className="p-4 bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">Your Current EVI</span>
                    <span className="text-3xl font-bold text-brand-cyan">{currentScore.toFixed(1)}</span>
                  </div>
                </div>
              )}

              {/* Status Bands */}
              <div>
                <h4 className="text-xs text-white/50 uppercase tracking-wide mb-2">Status Bands</h4>
                <div className="grid grid-cols-2 gap-2">
                  {statusBands.map((band) => (
                    <div key={band.label} className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full bg-${band.color}`} />
                        <span className="text-sm font-semibold text-white">{band.label}</span>
                        <span className="text-xs text-white/40 ml-auto">{band.range}</span>
                      </div>
                      <p className="text-[11px] text-white/50">{band.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'formula' && (
            <div className="space-y-4">
              {/* Formula */}
              <div className="p-4 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-3">The EVI Formula</h3>
                <div className="p-4 bg-[#0D0D12] rounded-lg font-mono text-center">
                  <span className="text-brand-cyan">EVI</span>
                  <span className="text-white/50 mx-2">=</span>
                  <span className="text-brand-cyan">Visibility</span>
                  <span className="text-white/40 mx-1">× 0.40</span>
                  <span className="text-white/50 mx-1">+</span>
                  <span className="text-brand-iris">Authority</span>
                  <span className="text-white/40 mx-1">× 0.35</span>
                  <span className="text-white/50 mx-1">+</span>
                  <span className="text-brand-magenta">Momentum</span>
                  <span className="text-white/40 mx-1">× 0.25</span>
                </div>
              </div>

              {/* Drivers */}
              <div>
                <h4 className="text-xs text-white/50 uppercase tracking-wide mb-2">The Three Drivers</h4>
                <div className="space-y-2">
                  {(['visibility', 'authority', 'momentum'] as EVIDriverType[]).map((driver) => {
                    const config = driverConfig[driver];
                    return (
                      <div key={driver} className={`p-3 bg-${config.color}/5 border border-${config.color}/20 rounded-lg`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{config.icon}</span>
                          <span className={`text-sm font-semibold text-${config.color}`}>{config.label}</span>
                          <span className="text-xs text-white/40 ml-auto">{config.weight} weight</span>
                        </div>
                        <p className="text-[11px] text-white/60">{config.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Worked Example */}
              <div className="p-4 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
                <h3 className="text-sm font-semibold text-white mb-3">Worked Example</h3>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-brand-cyan">Visibility</span>
                    <span className="text-white/40">=</span>
                    <span className="text-white">{workedExample.visibility}</span>
                    <span className="text-white/40">× 0.40 =</span>
                    <span className="text-brand-cyan">{(workedExample.visibility * 0.4).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-brand-iris">Authority</span>
                    <span className="text-white/40">=</span>
                    <span className="text-white">{workedExample.authority}</span>
                    <span className="text-white/40">× 0.35 =</span>
                    <span className="text-brand-iris">{(workedExample.authority * 0.35).toFixed(1)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-brand-magenta">Momentum</span>
                    <span className="text-white/40">=</span>
                    <span className="text-white">{workedExample.momentum}</span>
                    <span className="text-white/40">× 0.25 =</span>
                    <span className="text-brand-magenta">{(workedExample.momentum * 0.25).toFixed(1)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#1A1A24] flex items-center gap-2">
                    <span className="text-white font-semibold">EVI</span>
                    <span className="text-white/40">=</span>
                    <span className="text-brand-cyan">{(workedExample.visibility * 0.4).toFixed(1)}</span>
                    <span className="text-white/40">+</span>
                    <span className="text-brand-iris">{(workedExample.authority * 0.35).toFixed(1)}</span>
                    <span className="text-white/40">+</span>
                    <span className="text-brand-magenta">{(workedExample.momentum * 0.25).toFixed(1)}</span>
                    <span className="text-white/40">=</span>
                    <span className="text-xl font-bold text-semantic-success">{workedExample.calculated}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'improve' && (
            <div className="space-y-4">
              <p className="text-sm text-white/70">
                Focus on the driver with the lowest score relative to its weight for maximum EVI impact.
              </p>

              {(['visibility', 'authority', 'momentum'] as EVIDriverType[]).map((driver) => {
                const config = driverConfig[driver];
                return (
                  <div key={driver} className={`p-4 bg-${config.color}/5 border border-${config.color}/20 rounded-lg`}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{config.icon}</span>
                      <span className={`text-sm font-bold text-${config.color}`}>
                        Improve {config.label} ({config.weight})
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {config.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <svg className={`w-4 h-4 text-${config.color} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-white/70">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}

              {/* Quick Win */}
              <div className="p-4 bg-semantic-success/5 border border-semantic-success/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💡</span>
                  <span className="text-sm font-bold text-semantic-success">Quick Win Tip</span>
                </div>
                <p className="text-sm text-white/70">
                  Structured data (schema markup) is often the fastest way to boost Authority.
                  It helps AI models understand and cite your content correctly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1A1A24] bg-[#0A0A0F] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-cyan rounded-lg hover:bg-brand-cyan/90 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
