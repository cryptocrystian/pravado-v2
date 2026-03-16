'use client';

/**
 * SEO/AEO Copilot Mode View
 *
 * AI-first UX with SAGE proposal banners, reasoning chips, confidence indicators,
 * and approve/reject affordances across all four tabs.
 *
 * DS v3.1 compliant — pillar color: brand-cyan (#00D9FF)
 *
 * @see /docs/canon/SEO_AEO_PILLAR_CANON.md
 * @see /docs/canon/MODE_UX_ARCHITECTURE.md
 */

import { useState, useCallback } from 'react';

import {
  MOCK_SEO_ASSETS,
  MOCK_TECHNICAL_FINDINGS,
  MOCK_CITATION_ACTIVITY,
  MOCK_TOPIC_CLUSTERS,
} from './mock-data';

import { useGscStatus } from '@/lib/useGSC';

import {
  getAEOBandColor,
  getAEOBandBgColor,
  getAEOBandLabel,
  FINDING_CATEGORY_CONFIG,
  SEVERITY_CONFIG,
  type SAGEProposal,
} from './types';

// ============================================
// TYPES
// ============================================

interface SEOCopilotViewProps {
  activeTab: 'overview' | 'aeo' | 'technical' | 'intelligence';
}

type ProposalDecision = 'approved' | 'rejected';

// ============================================
// CONFIDENCE BAR
// ============================================

function ConfidenceBar({ confidence }: { confidence: number }) {
  const barColor =
    confidence >= 70
      ? 'bg-brand-cyan'
      : confidence >= 50
        ? 'bg-brand-cyan/50'
        : 'bg-brand-cyan/25';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[13px] font-semibold text-white/70 tabular-nums">
        {confidence}%
      </span>
      <div className="w-16 h-1.5 rounded-full bg-slate-5 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-300`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// REASONING CHIP (Expandable)
// ============================================

function ReasoningChip({ reasoning }: { reasoning: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="flex items-start gap-1.5 text-left bg-brand-cyan/10 text-brand-cyan rounded-lg px-2.5 py-1.5 transition-all duration-150 hover:bg-brand-cyan/15 cursor-pointer"
    >
      <svg
        className="w-3.5 h-3.5 shrink-0 mt-0.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className={`text-[13px] leading-snug ${expanded ? '' : 'line-clamp-1'}`}>
        {reasoning}
      </span>
    </button>
  );
}

// ============================================
// OVERVIEW TAB (COPILOT)
// ============================================

function OverviewTab({
  proposals,
  decisions,
  onApprove,
  onReject,
}: {
  proposals: SAGEProposal[];
  decisions: Record<string, ProposalDecision>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const totalAEO = proposals.reduce((sum, p) => sum + p.estimatedAEOImpact, 0);
  const totalEVI = proposals.reduce((sum, p) => sum + p.estimatedEVIImpact, 0);
  const pendingCount = proposals.filter((p) => !decisions[p.id]).length;

  // GSC connection status — gates Share of Model and Layer Health data
  const { data: gscStatus } = useGscStatus();
  const gscConnected = gscStatus?.connected ?? false;

  return (
    <div className="space-y-6">
      {/* SAGE Proposal Banner — only when proposals exist */}
      {proposals.length > 0 ? (
        <div className="bg-brand-cyan/10 border border-brand-cyan/30 rounded-xl p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
              <p className="text-sm text-white/90">
                <span className="font-semibold text-brand-cyan">SAGE</span>{' '}
                identified{' '}
                <span className="font-semibold text-white/90">
                  {pendingCount} priority action{pendingCount !== 1 ? 's' : ''}
                </span>{' '}
                — Est. impact:{' '}
                <span className="font-bold text-brand-cyan tabular-nums">
                  +{totalAEO} AEO pts
                </span>{' '}
                ·{' '}
                <span className="font-bold text-brand-cyan tabular-nums">
                  +{totalEVI.toFixed(1)} EVI
                </span>
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-2 text-sm font-semibold bg-brand-cyan text-white/90 rounded-lg hover:bg-brand-cyan/90 shadow-[0_0_16px_rgba(0,217,255,0.25)] transition-all duration-150 shrink-0"
            >
              Review Plan
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-brand-cyan/5 border border-brand-cyan/15 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan/50" />
            <p className="text-sm text-white/60">
              <span className="font-semibold text-brand-cyan">SAGE</span> is analyzing your domain.
            </p>
          </div>
        </div>
      )}

      {/* Share of Model */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/90">Share of Model</h3>
        </div>
        {gscConnected ? (
          <>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-3xl font-bold text-white/30 tabular-nums">--</span>
              <span className="text-sm text-white/40 mb-1">Calculating...</span>
            </div>
            <p className="text-[13px] text-white/50">Share of Model data is being calculated from your connected sources.</p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-white/50 text-center">
              Connect Google Search Console to see your Share of Model data.
            </p>
            <a
              href="/app/settings"
              className="mt-3 px-4 py-2 text-sm font-semibold text-brand-cyan border border-brand-cyan/30 rounded-lg hover:bg-brand-cyan/10 transition-colors"
            >
              Connect GSC
            </a>
          </div>
        )}
      </div>

      {/* Three Layer Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { layer: 1, label: 'SEO Health' },
          { layer: 2, label: 'AEO Readiness' },
          { layer: 3, label: 'Share of Model' },
        ].map((layerDef) => (
          <div
            key={layerDef.layer}
            className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                Layer {layerDef.layer}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                {gscConnected ? 'Pending' : 'No data'}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-white/90 mb-1">{layerDef.label}</h4>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-2xl font-bold tabular-nums text-white/30">--</span>
              <span className="text-[13px] text-white/50 mb-0.5">/100</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-5 overflow-hidden mb-3">
              <div className="h-full rounded-full bg-brand-cyan/25 transition-all duration-300" style={{ width: '0%' }} />
            </div>
            <p className="text-[13px] text-white/50 leading-relaxed">
              {gscConnected
                ? 'Data is being collected. Scores will appear after the first analysis cycle.'
                : 'Connect Google Search Console to populate this layer.'}
            </p>
          </div>
        ))}
      </div>

      {/* SAGE Priority Queue */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1">
        <div className="px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
            <h3 className="text-sm font-semibold text-white/90">SAGE Priority Queue</h3>
            <span className="text-[13px] text-white/50 ml-1">
              AI-sorted by impact
            </span>
          </div>
        </div>
        {proposals.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-white/50">No SEO actions yet.</p>
            <p className="text-xs text-white/30 mt-1">SAGE will generate recommendations once your domain data has been analyzed.</p>
          </div>
        ) : (
        <div className="divide-y divide-border-subtle">
          {[...proposals]
            .sort((a, b) => b.estimatedAEOImpact + b.estimatedEVIImpact - (a.estimatedAEOImpact + a.estimatedEVIImpact))
            .map((proposal) => {
              const decision = decisions[proposal.id];
              const isApproved = decision === 'approved';
              const isRejected = decision === 'rejected';

              return (
                <div
                  key={proposal.id}
                  className={`px-6 py-4 transition-all duration-150 ${
                    isRejected ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white/90 mb-2">
                        {proposal.title}
                      </h4>
                      <ReasoningChip reasoning={proposal.reasoning} />
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {decision ? (
                        isApproved ? (
                          <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-semantic-success/10 text-semantic-success border-semantic-success/20">
                            Approved
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-white/5 text-white/40 border-white/10">
                            Rejected
                          </span>
                        )
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onApprove(proposal.id)}
                            className="px-3 py-1.5 text-sm font-semibold bg-semantic-success text-white/90 rounded-lg hover:bg-semantic-success/90 shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all duration-150"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(proposal.id)}
                            className="px-3 py-1.5 text-sm font-medium text-white/50 bg-white/5 border border-white/10 rounded-lg hover:text-white/70 hover:border-white/20 hover:bg-white/10 transition-all duration-150"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <ConfidenceBar confidence={proposal.confidence} />
                    <div className="flex items-center gap-3 text-[13px]">
                      <span className="text-white/50">
                        AEO{' '}
                        <span className="font-semibold text-brand-cyan tabular-nums">
                          +{proposal.estimatedAEOImpact}
                        </span>
                      </span>
                      <span className="text-white/50">
                        EVI{' '}
                        <span className="font-semibold text-brand-cyan tabular-nums">
                          +{proposal.estimatedEVIImpact.toFixed(1)}
                        </span>
                      </span>
                    </div>
                    <span
                      className={`ml-auto px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${
                        proposal.type === 'schema'
                          ? 'bg-brand-iris/10 text-brand-iris border-brand-iris/30'
                          : proposal.type === 'entity'
                            ? 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30'
                            : proposal.type === 'content'
                              ? 'bg-brand-teal/10 text-brand-teal border-brand-teal/30'
                              : 'bg-brand-amber/10 text-brand-amber border-brand-amber/30'
                      }`}
                    >
                      {proposal.type}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// AEO TAB (COPILOT)
// ============================================

function AEOTab({
  decisions,
  onApprove,
  onReject,
}: {
  decisions: Record<string, ProposalDecision>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  // Sort by improvement potential (lowest AEO score first)
  const sortedAssets = [...MOCK_SEO_ASSETS].sort((a, b) => a.aeoScore - b.aeoScore);

  // Generate reasoning per asset based on their weaknesses
  const getAssetReasoning = (asset: (typeof MOCK_SEO_ASSETS)[number]): string => {
    const weakest = Object.entries(asset.aeoBreakdown).sort(
      ([, a], [, b]) => a - b
    )[0];
    const labelMap: Record<string, string> = {
      entityClarity: 'entity clarity',
      schema: 'schema coverage',
      semanticDepth: 'semantic depth',
      authority: 'authority signals',
    };
    return `Lowest factor: ${labelMap[weakest[0]] || weakest[0]} at ${weakest[1]}/100. Improving this factor will have the highest marginal AEO impact for this asset.`;
  };

  const getAssetConfidence = (asset: (typeof MOCK_SEO_ASSETS)[number]): number => {
    // Higher confidence for lower-scoring assets (more room for improvement)
    if (asset.aeoScore <= 40) return 92;
    if (asset.aeoScore <= 60) return 80;
    if (asset.aeoScore <= 80) return 65;
    return 50;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
          <h3 className="text-sm font-semibold text-white/90">AI-Prioritized Assets</h3>
          <span className="text-[13px] text-white/50">
            Sorted by improvement potential
          </span>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
          {sortedAssets.length} assets
        </span>
      </div>

      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle bg-slate-3/50">
              <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-white/50">
                Asset
              </th>
              <th className="text-center px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white/50">
                AEO Score
              </th>
              <th className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white/50">
                SAGE Reasoning
              </th>
              <th className="text-center px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white/50">
                Confidence
              </th>
              <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-white/50">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sortedAssets.map((asset) => {
              const decisionKey = `aeo-${asset.id}`;
              const decision = decisions[decisionKey];
              const isApproved = decision === 'approved';
              const isRejected = decision === 'rejected';
              const confidence = getAssetConfidence(asset);

              return (
                <tr
                  key={asset.id}
                  className={`transition-all duration-150 hover:bg-slate-4/30 ${
                    isRejected ? 'opacity-40' : ''
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-white/90 mb-0.5">
                      {asset.title}
                    </div>
                    <div className="text-[13px] text-white/50">{asset.url}</div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span
                        className={`text-lg font-bold tabular-nums ${getAEOBandColor(asset.aeoScore)}`}
                      >
                        {asset.aeoScore}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getAEOBandBgColor(asset.aeoScore)}/10 ${getAEOBandColor(asset.aeoScore)}`}
                      >
                        {getAEOBandLabel(asset.aeoScore)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 max-w-xs">
                    <ReasoningChip reasoning={getAssetReasoning(asset)} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <ConfidenceBar confidence={confidence} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {decision ? (
                      isApproved ? (
                        <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-semantic-success/10 text-semantic-success border-semantic-success/20">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-white/5 text-white/40 border-white/10">
                          Rejected
                        </span>
                      )
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onApprove(decisionKey)}
                          className="px-3 py-1.5 text-sm font-semibold bg-semantic-success text-white/90 rounded-lg hover:bg-semantic-success/90 shadow-[0_0_16px_rgba(34,197,94,0.25)] transition-all duration-150"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => onReject(decisionKey)}
                          className="px-3 py-1.5 text-sm font-medium text-white/50 bg-white/5 border border-white/10 rounded-lg hover:text-white/70 hover:border-white/20 hover:bg-white/10 transition-all duration-150"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// TECHNICAL TAB (COPILOT)
// ============================================

function TechnicalTab({
  decisions,
  onApprove,
  onReject,
}: {
  decisions: Record<string, ProposalDecision>;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  // Sort by AEO impact (critical schema > critical perf > warning schema > etc.)
  const aeoImpactOrder: Record<string, number> = {
    'structured-data': 0,
    crawlability: 1,
    indexing: 2,
    performance: 3,
    mobile: 4,
    security: 5,
  };

  const sortedFindings = [...MOCK_TECHNICAL_FINDINGS].sort((a, b) => {
    const severityOrder = (SEVERITY_CONFIG[a.severity]?.order ?? 99) - (SEVERITY_CONFIG[b.severity]?.order ?? 99);
    if (severityOrder !== 0) return severityOrder;
    return (aeoImpactOrder[a.category] ?? 99) - (aeoImpactOrder[b.category] ?? 99);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
          <h3 className="text-sm font-semibold text-white/90">AI-Prioritized Findings</h3>
          <span className="text-[13px] text-white/50">
            Sorted by AEO impact
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-semantic-danger font-semibold tabular-nums">
            {MOCK_TECHNICAL_FINDINGS.filter((f) => f.severity === 'critical').length} critical
          </span>
          <span className="text-white/30">·</span>
          <span className="text-[13px] text-semantic-warning font-semibold tabular-nums">
            {MOCK_TECHNICAL_FINDINGS.filter((f) => f.severity === 'warning').length} warnings
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {sortedFindings.map((finding) => {
          const decisionKey = `tech-${finding.id}`;
          const decision = decisions[decisionKey];
          const isApproved = decision === 'approved';
          const isRejected = decision === 'rejected';
          const categoryConfig = FINDING_CATEGORY_CONFIG[finding.category];
          const severityConfig = SEVERITY_CONFIG[finding.severity];

          return (
            <div
              key={finding.id}
              className={`bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-5 transition-all duration-150 ${
                isRejected ? 'opacity-40' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${categoryConfig.color}`}
                    >
                      {categoryConfig.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${severityConfig.color}`}
                    >
                      {severityConfig.label}
                    </span>
                    <span className="text-[13px] text-white/50">
                      {finding.affectedPages} page{finding.affectedPages !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white/90">
                    {finding.title}
                  </h4>
                </div>
                {decision && (
                  isApproved ? (
                    <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-semantic-success/10 text-semantic-success border-semantic-success/20 shrink-0">
                      AI Fixing
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-white/5 text-white/40 border-white/10 shrink-0">
                      Assigned
                    </span>
                  )
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-white/70 mb-3">{finding.description}</p>

              {/* AEO Bridge */}
              <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg px-4 py-3 mb-4">
                <div className="flex items-start gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan shrink-0 mt-0.5">
                    AEO Bridge
                  </span>
                  <p className="text-[13px] text-white/70 leading-relaxed">
                    {finding.aeoBridgeImpact}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {!decision && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onApprove(decisionKey)}
                    className="px-4 py-2 text-sm font-semibold bg-brand-cyan text-white/90 rounded-lg hover:bg-brand-cyan/90 shadow-[0_0_16px_rgba(0,217,255,0.25)] transition-all duration-150"
                  >
                    Let AI Fix — Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(decisionKey)}
                    className="px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
                  >
                    I'll Handle This — Assign
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// INTELLIGENCE TAB (Mode-agnostic, same as Manual)
// ============================================

function IntelligenceTab() {
  const sentimentConfig: Record<string, { color: string; label: string }> = {
    positive: { color: 'bg-semantic-success/10 text-semantic-success border-semantic-success/20', label: 'Positive' },
    neutral: { color: 'bg-white/5 text-white/50 border-white/10', label: 'Neutral' },
    negative: { color: 'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20', label: 'Negative' },
  };

  return (
    <div className="space-y-6">
      {/* Citation Activity */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-white/90">Recent Citation Activity</h3>
        </div>
        <div className="divide-y divide-border-subtle">
          {MOCK_CITATION_ACTIVITY.map((citation) => {
            const sentiment = sentimentConfig[citation.sentiment] || sentimentConfig.neutral;
            return (
              <div key={citation.id} className="px-6 py-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-semibold text-brand-cyan">
                    {citation.surface}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border text-[11px] font-bold uppercase tracking-wider ${sentiment.color}`}
                  >
                    {sentiment.label}
                  </span>
                  <span className="text-[13px] text-white/50 ml-auto">
                    {new Date(citation.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-sm text-white/70 mb-1">
                  <span className="text-white/50">Query:</span> {citation.query}
                </p>
                <p className="text-[13px] text-white/50 leading-relaxed">
                  {citation.context}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic Clusters */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-white/90">Topic Cluster Health</h3>
        </div>
        <div className="divide-y divide-border-subtle">
          {MOCK_TOPIC_CLUSTERS.map((cluster) => (
            <div key={cluster.name} className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-white/90">{cluster.name}</h4>
                <span
                  className={`text-lg font-bold tabular-nums ${getAEOBandColor(cluster.health)}`}
                >
                  {cluster.health}
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-5 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full ${getAEOBandBgColor(cluster.health)} transition-all duration-300`}
                  style={{ width: `${cluster.health}%` }}
                />
              </div>
              <div className="flex items-center gap-4 text-[13px] text-white/50">
                <span>{cluster.articles} article{cluster.articles !== 1 ? 's' : ''}</span>
                <span>{cluster.citations} citation{cluster.citations !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// INLINE TOAST
// ============================================

interface ToastMsg { id: number; text: string; type: 'success' | 'neutral'; }

function ToastStack({ toasts }: { toasts: ToastMsg[] }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-elev-3 text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            t.type === 'success'
              ? 'bg-semantic-success/15 border-semantic-success/30 text-semantic-success'
              : 'bg-white/8 border-white/15 text-white/70'
          }`}
        >
          {t.type === 'success' ? '✓' : '→'} {t.text}
        </div>
      ))}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SEOCopilotView({ activeTab }: SEOCopilotViewProps) {
  const [decisions, setDecisions] = useState<Record<string, ProposalDecision>>({});
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  let toastIdRef = 0;

  const showToast = useCallback((text: string, type: 'success' | 'neutral') => {
    const id = ++toastIdRef;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }, []);

  const handleApprove = (id: string) => {
    setDecisions((prev) => ({ ...prev, [id]: 'approved' }));
    showToast('Approved — AI will handle this fix', 'success');
  };

  const handleReject = (id: string) => {
    setDecisions((prev) => ({ ...prev, [id]: 'rejected' }));
    showToast('Assigned to your queue', 'neutral');
  };

  return (
    <>
    <ToastStack toasts={toasts} />
    <div className="max-w-6xl mx-auto">
      {activeTab === 'overview' && (
        <OverviewTab
          proposals={[]}
          decisions={decisions}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      {activeTab === 'aeo' && (
        <AEOTab
          decisions={decisions}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      {activeTab === 'technical' && (
        <TechnicalTab
          decisions={decisions}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      {activeTab === 'intelligence' && <IntelligenceTab />}
    </div>
    </>
  );
}
