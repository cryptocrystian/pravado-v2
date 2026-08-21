'use client';

/**
 * SEO Manual Mode View
 *
 * Renders inline tab content for the Manual mode SEO/AEO Work Surface.
 * Parent shell handles tab switching; this component receives activeTab prop.
 * Pillar color: brand-cyan (#00D9FF)
 *
 * @see /docs/canon/SEO_AEO_PILLAR_CANON.md
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

import { useMemo, useState } from 'react';

import {
  MOCK_COMPETITORS,
  MOCK_SEO_ASSETS,
  MOCK_TECHNICAL_FINDINGS,
  MOCK_CITATION_ACTIVITY,
  MOCK_TOPIC_CLUSTERS,
} from './mock-data';
import { SeoOverviewPanel } from './SeoOverviewPanel';
import {
  getAEOBandColor,
  getAEOBandBgColor,
  getAEOBandLabel,
  FINDING_CATEGORY_CONFIG,
  SEVERITY_CONFIG,
  type SEOAsset,
  type TechnicalFinding,
} from './types';

// ============================================
// TYPES
// ============================================

interface SEOManualViewProps {
  activeTab: 'overview' | 'aeo' | 'technical' | 'intelligence';
}

// ============================================
// HELPERS
// ============================================

function getSchemaStatusBadge(status: 'complete' | 'partial' | 'missing'): {
  label: string;
  className: string;
} {
  if (status === 'complete') {
    return {
      label: 'Complete',
      className:
        'bg-semantic-success/10 text-semantic-success border-semantic-success/20',
    };
  }
  if (status === 'partial') {
    return {
      label: 'Partial',
      className:
        'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20',
    };
  }
  return {
    label: 'Missing',
    className:
      'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20',
  };
}

function getEntityStatusBadge(status: 'strong' | 'moderate' | 'weak'): {
  label: string;
  className: string;
} {
  if (status === 'strong') {
    return {
      label: 'Strong',
      className:
        'bg-semantic-success/10 text-semantic-success border-semantic-success/20',
    };
  }
  if (status === 'moderate') {
    return {
      label: 'Moderate',
      className:
        'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20',
    };
  }
  return {
    label: 'Weak',
    className:
      'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20',
  };
}

function getSentimentIndicator(
  sentiment: 'positive' | 'neutral' | 'negative'
): { label: string; className: string } {
  if (sentiment === 'positive') {
    return {
      label: 'Positive',
      className:
        'bg-semantic-success/10 text-semantic-success border-semantic-success/20',
    };
  }
  if (sentiment === 'neutral') {
    return {
      label: 'Neutral',
      className: 'bg-white/5 text-white/50 border-white/10',
    };
  }
  return {
    label: 'Negative',
    className:
      'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20',
  };
}

function getSurfaceBadgeColor(surface: string): string {
  switch (surface) {
    case 'ChatGPT':
      return 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30';
    case 'Perplexity':
      return 'bg-brand-iris/10 text-brand-iris border-brand-iris/30';
    case 'Gemini':
      return 'bg-brand-teal/10 text-brand-teal border-brand-teal/30';
    default:
      return 'bg-white/5 text-white/50 border-white/10';
  }
}

function getTopicHealthColor(health: number): string {
  if (health >= 70) return 'bg-brand-cyan';
  if (health >= 50) return 'bg-brand-cyan/50';
  return 'bg-brand-cyan/25';
}

function severityOrder(severity: string): number {
  return SEVERITY_CONFIG[severity]?.order ?? 99;
}

// ============================================
// AEO TAB
// ============================================

function AEOTab() {
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedAssets = useMemo(
    () =>
      [...MOCK_SEO_ASSETS].sort((a, b) =>
        sortDirection === 'desc'
          ? b.aeoScore - a.aeoScore
          : a.aeoScore - b.aeoScore
      ),
    [sortDirection]
  );

  return (
    <div className="space-y-6">
      {/* AEO Score Formula */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-cyan/10">
            <svg
              className="w-4 h-4 text-brand-cyan"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
              AEO Score Formula
            </span>
            <p className="text-sm text-white/70 mt-0.5">
              Entity Clarity{' '}
              <span className="text-brand-cyan font-semibold">30%</span>
              {' + '}Schema{' '}
              <span className="text-brand-cyan font-semibold">25%</span>
              {' + '}Semantic Depth{' '}
              <span className="text-brand-cyan font-semibold">25%</span>
              {' + '}Authority{' '}
              <span className="text-brand-cyan font-semibold">20%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-subtle">
            <thead className="bg-slate-3/50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Title / URL
                </th>
                <th
                  className="px-4 py-3 text-right text-[11px] font-bold text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 transition-colors"
                  onClick={() =>
                    setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    AEO Score
                    <svg
                      className={`w-3 h-3 transition-transform duration-150 ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </span>
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Schema
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Entity
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Cited By
                </th>
                <th className="px-4 py-3 text-right text-[11px] font-bold text-white/50 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {sortedAssets.map((asset) => (
                <AEOAssetRow key={asset.id} asset={asset} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AEOAssetRow({ asset }: { asset: SEOAsset }) {
  const schema = getSchemaStatusBadge(asset.schemaStatus);
  const entity = getEntityStatusBadge(asset.entityStatus);
  const scoreColor = getAEOBandColor(asset.aeoScore);
  const scoreBgColor = getAEOBandBgColor(asset.aeoScore);
  const bandLabel = getAEOBandLabel(asset.aeoScore);

  return (
    <tr className="hover:bg-slate-3 transition-all duration-150">
      <td className="px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/90 truncate">
            {asset.title}
          </p>
          <p className="text-[13px] text-white/50 truncate">{asset.url}</p>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex flex-col items-end gap-1">
          <span className={`text-lg font-bold tabular-nums ${scoreColor}`}>
            {asset.aeoScore}
          </span>
          <span className={`w-full h-1 rounded-full ${scoreBgColor}/20`}>
            <span
              className={`block h-full rounded-full ${scoreBgColor}`}
              style={{ width: `${asset.aeoScore}%` }}
            />
          </span>
          <span
            className={`text-[11px] font-bold uppercase tracking-wider ${scoreColor}`}
          >
            {bandLabel}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${schema.className}`}
        >
          {schema.label}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={`inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${entity.className}`}
        >
          {entity.label}
        </span>
      </td>
      <td className="px-4 py-3">
        {asset.citedBy.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {asset.citedBy.map((surface) => (
              <span
                key={surface}
                className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${getSurfaceBadgeColor(surface)}`}
              >
                {surface}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[13px] text-white/40">No citations</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {asset.schemaStatus !== 'complete' && (
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
            >
              Fix Schema
            </button>
          )}
          {asset.entityStatus !== 'strong' && (
            <button
              type="button"
              className="px-3 py-1.5 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150"
            >
              Improve Entity
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ============================================
// TECHNICAL TAB
// ============================================

function TechnicalTab() {
  const sortedFindings = useMemo(
    () =>
      [...MOCK_TECHNICAL_FINDINGS].sort(
        (a, b) => severityOrder(a.severity) - severityOrder(b.severity)
      ),
    []
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/90">
          Technical Findings
          <span className="ml-2 text-[13px] font-normal text-white/50">
            ({sortedFindings.length} issues)
          </span>
        </h3>
      </div>

      {sortedFindings.map((finding) => (
        <TechnicalFindingCard key={finding.id} finding={finding} />
      ))}
    </div>
  );
}

function TechnicalFindingCard({ finding }: { finding: TechnicalFinding }) {
  const categoryConf = FINDING_CATEGORY_CONFIG[finding.category];
  const severityConf = SEVERITY_CONFIG[finding.severity];
  const isElevated =
    finding.severity === 'critical' && finding.category === 'structured-data';

  return (
    <div
      className={`bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-5 transition-all duration-150 hover:border-slate-5 ${
        isElevated ? 'border-l-4 border-l-brand-cyan' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          {/* Badges Row */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${categoryConf.color}`}
            >
              {categoryConf.label}
            </span>
            <span
              className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${severityConf.color}`}
            >
              {severityConf.label}
            </span>
            <span className="text-[13px] text-white/50">
              {finding.affectedPages} page
              {finding.affectedPages !== 1 ? 's' : ''} affected
            </span>
          </div>

          {/* Title + Description */}
          <h4 className="text-sm font-semibold text-white/90 mb-1">
            {finding.title}
          </h4>
          <p className="text-sm text-white/70 mb-3">{finding.description}</p>

          {/* AEO Bridge Impact */}
          <div className="border-l-2 border-brand-cyan pl-3 py-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan">
              AEO Bridge Impact
            </span>
            <p className="text-sm text-white/70 mt-0.5">
              {finding.aeoBridgeImpact}
            </p>
          </div>
        </div>

        {/* Fix Button */}
        {finding.fixable && (
          <div className="shrink-0">
            <button
              type="button"
              className="px-4 py-2 text-sm font-semibold bg-brand-cyan text-slate-0 rounded-lg hover:bg-brand-cyan/90 shadow-[0_0_16px_rgba(0,217,255,0.25)] transition-all duration-150"
            >
              Fix
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// INTELLIGENCE TAB
// ============================================

function IntelligenceTab() {
  const maxCompetitorSoM = useMemo(
    () => Math.max(...MOCK_COMPETITORS.map((c) => c.shareOfModel)),
    []
  );

  return (
    <div className="space-y-6">
      {/* Competitor Share of Model */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
        <h3 className="text-sm font-semibold text-white/90 mb-4">
          Competitor Share of Model
        </h3>
        <div className="space-y-3">
          {MOCK_COMPETITORS.map((competitor) => (
            <div key={competitor.name} className="flex items-center gap-3">
              <span
                className={`text-sm w-32 shrink-0 truncate ${competitor.name === 'Your Brand' ? 'font-semibold text-brand-cyan' : 'text-white/70'}`}
              >
                {competitor.name}
              </span>
              <div className="flex-1 h-5 bg-slate-3 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all duration-500 ${
                    competitor.name === 'Your Brand'
                      ? 'bg-brand-cyan shadow-[0_0_16px_rgba(0,217,255,0.15)]'
                      : 'bg-white/20'
                  }`}
                  style={{
                    width: `${(competitor.shareOfModel / maxCompetitorSoM) * 100}%`,
                  }}
                />
              </div>
              <span
                className={`text-sm font-bold tabular-nums w-14 text-right ${competitor.name === 'Your Brand' ? 'text-brand-cyan' : 'text-white/70'}`}
              >
                {competitor.shareOfModel}%
              </span>
              <span
                className={`text-[13px] tabular-nums w-12 text-right ${competitor.trend > 0 ? 'text-semantic-success' : competitor.trend < 0 ? 'text-semantic-danger' : 'text-white/50'}`}
              >
                {competitor.trend > 0 ? '+' : ''}
                {competitor.trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Citation Activity Feed */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1">
        <div className="px-6 py-4 border-b border-border-subtle">
          <h3 className="text-sm font-semibold text-white/90">
            Citation Activity
          </h3>
        </div>
        <div className="divide-y divide-border-subtle">
          {MOCK_CITATION_ACTIVITY.map((citation) => {
            const sentimentConf = getSentimentIndicator(citation.sentiment);
            return (
              <div
                key={citation.id}
                className="px-6 py-4 hover:bg-slate-3 transition-all duration-150"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${getSurfaceBadgeColor(citation.surface)}`}
                      >
                        {citation.surface}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${sentimentConf.className}`}
                      >
                        {sentimentConf.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white/90 mb-1">
                      &ldquo;{citation.query}&rdquo;
                    </p>
                    <p className="text-sm text-white/70 leading-relaxed border-l-2 border-brand-cyan/40 pl-3 mt-2">
                      {citation.context}
                    </p>
                  </div>
                  <span className="text-[13px] text-white/50 shrink-0">
                    {new Date(citation.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Topic Cluster Health */}
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
        <h3 className="text-sm font-semibold text-white/90 mb-4">
          Topic Cluster Health
        </h3>
        <div className="space-y-4">
          {MOCK_TOPIC_CLUSTERS.map((cluster) => (
            <div key={cluster.name} className="flex items-center gap-4">
              <span className="text-sm text-white/90 w-44 shrink-0 truncate font-medium">
                {cluster.name}
              </span>
              <div className="flex-1 h-3 bg-slate-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getTopicHealthColor(cluster.health)}`}
                  style={{ width: `${cluster.health}%` }}
                />
              </div>
              <span
                className={`text-sm font-bold tabular-nums w-10 text-right ${
                  cluster.health >= 70
                    ? 'text-semantic-success'
                    : cluster.health >= 50
                      ? 'text-semantic-warning'
                      : 'text-semantic-danger'
                }`}
              >
                {cluster.health}
              </span>
              <div className="flex items-center gap-4 shrink-0 w-40">
                <span className="text-[13px] text-white/50">
                  {cluster.articles} article{cluster.articles !== 1 ? 's' : ''}
                </span>
                <span className="text-[13px] text-brand-cyan">
                  {cluster.citations} citation
                  {cluster.citations !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function SEOManualView({ activeTab }: SEOManualViewProps) {
  switch (activeTab) {
    case 'overview':
      return <SeoOverviewPanel />;
    case 'aeo':
      return <AEOTab />;
    case 'technical':
      return <TechnicalTab />;
    case 'intelligence':
      return <IntelligenceTab />;
    default:
      return null;
  }
}
