'use client';

/**
 * Authority Dashboard
 *
 * Displays the canon-required authority metrics for Content pillar:
 * - Authority Contribution Score (primary)
 * - Citation Eligibility Score
 * - AI Ingestion Likelihood
 * - Cross-Pillar Impact
 * - Competitive Authority Delta
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import type { AuthoritySignals } from '../types';

interface AuthorityDashboardProps {
  signals: AuthoritySignals;
  isLoading?: boolean;
}

// ============================================
// SCORE STYLING
// ============================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-semantic-success';
  if (score >= 60) return 'text-brand-cyan';
  if (score >= 40) return 'text-semantic-warning';
  return 'text-semantic-danger';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-semantic-success';
  if (score >= 60) return 'bg-brand-cyan';
  if (score >= 40) return 'bg-semantic-warning';
  return 'bg-semantic-danger';
}

function getDeltaColor(delta: number): string {
  if (delta > 0) return 'text-semantic-success';
  if (delta < 0) return 'text-semantic-danger';
  return 'text-white/50';
}

function getDeltaIcon(delta: number): string {
  if (delta > 0) return '↑';
  if (delta < 0) return '↓';
  return '→';
}

// ============================================
// METRIC CARD COMPONENT
// ============================================

interface MetricCardProps {
  label: string;
  value: number;
  description?: string;
  isDelta?: boolean;
  isLoading?: boolean;
}

function MetricCard({ label, value, description, isDelta = false, isLoading = false }: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#13131A] border border-[#1F1F28] rounded-lg p-4 animate-pulse">
        <div className="h-3 w-20 bg-[#1A1A24] rounded mb-3" />
        <div className="h-8 w-12 bg-[#1A1A24] rounded" />
      </div>
    );
  }

  const displayValue = isDelta ? Math.abs(value) : value;
  const colorClass = isDelta ? getDeltaColor(value) : getScoreColor(value);
  const bgColorClass = isDelta ? '' : getScoreBgColor(value);

  return (
    <div className="bg-[#13131A] border border-[#1F1F28] rounded-lg p-4 hover:border-[#2A2A36] transition-colors">
      <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex items-baseline gap-1">
        {isDelta && (
          <span className={`text-lg ${colorClass}`}>{getDeltaIcon(value)}</span>
        )}
        <span className={`text-2xl font-bold ${colorClass}`}>
          {isDelta && value > 0 ? '+' : ''}{displayValue}
        </span>
        {!isDelta && (
          <span className="text-xs text-white/30">/100</span>
        )}
      </div>
      {!isDelta && (
        <div className="mt-2 h-1.5 bg-[#1A1A24] rounded-full overflow-hidden">
          <div
            className={`h-full ${bgColorClass} transition-all duration-500`}
            style={{ width: `${value}%` }}
          />
        </div>
      )}
      {description && (
        <div className="text-[10px] text-white/30 mt-2">{description}</div>
      )}
    </div>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export function AuthorityDashboard({ signals, isLoading = false }: AuthorityDashboardProps) {
  return (
    <div className="space-y-4">
      {/* Primary Metric - Authority Contribution Score */}
      <div className="bg-gradient-to-r from-brand-iris/10 to-transparent border border-brand-iris/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-brand-iris animate-pulse" />
          <span className="text-xs font-medium text-brand-iris uppercase tracking-wider">
            Authority Score
          </span>
        </div>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-12 w-20 bg-[#1A1A24] rounded mb-2" />
            <div className="h-2 w-full bg-[#1A1A24] rounded" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold ${getScoreColor(signals.authorityContributionScore)}`}>
                {signals.authorityContributionScore}
              </span>
              <span className="text-sm text-white/30">/100</span>
            </div>
            <div className="mt-3 h-2 bg-[#1A1A24] rounded-full overflow-hidden">
              <div
                className={`h-full ${getScoreBgColor(signals.authorityContributionScore)} transition-all duration-500`}
                style={{ width: `${signals.authorityContributionScore}%` }}
              />
            </div>
            <p className="text-[10px] text-white/40 mt-2">
              Primary content authority metric across all assets
            </p>
          </>
        )}
      </div>

      {/* Secondary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Citation Eligibility"
          value={signals.citationEligibilityScore}
          description="CiteMind readiness"
          isLoading={isLoading}
        />
        <MetricCard
          label="AI Ingestion"
          value={signals.aiIngestionLikelihood}
          description="AI discoverability"
          isLoading={isLoading}
        />
        <MetricCard
          label="Cross-Pillar"
          value={signals.crossPillarImpact}
          description="PR + SEO reinforcement"
          isLoading={isLoading}
        />
        <MetricCard
          label="vs Competitors"
          value={signals.competitiveAuthorityDelta}
          isDelta
          description="Authority comparison"
          isLoading={isLoading}
        />
      </div>

      {/* Measurement timestamp */}
      {!isLoading && signals.measuredAt && (
        <div className="text-[10px] text-white/30 text-center">
          Last measured: {new Date(signals.measuredAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPACT VARIANT
// ============================================

interface AuthorityStripProps {
  signals: AuthoritySignals;
  compact?: boolean;
}

export function AuthorityStrip({ signals, compact = false }: AuthorityStripProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <span className={`text-sm font-bold ${getScoreColor(signals.authorityContributionScore)}`}>
          {signals.authorityContributionScore}
        </span>
        <span className="text-[10px] text-white/40">Authority</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg">
      <div className="text-center">
        <div className={`text-lg font-bold ${getScoreColor(signals.authorityContributionScore)}`}>
          {signals.authorityContributionScore}
        </div>
        <div className="text-[9px] text-white/40 uppercase">Authority</div>
      </div>
      <div className="w-px h-8 bg-[#1F1F28]" />
      <div className="text-center">
        <div className={`text-lg font-bold ${getScoreColor(signals.citationEligibilityScore)}`}>
          {signals.citationEligibilityScore}
        </div>
        <div className="text-[9px] text-white/40 uppercase">Citation</div>
      </div>
      <div className="w-px h-8 bg-[#1F1F28]" />
      <div className="text-center">
        <div className={`text-lg font-bold ${getScoreColor(signals.aiIngestionLikelihood)}`}>
          {signals.aiIngestionLikelihood}
        </div>
        <div className="text-[9px] text-white/40 uppercase">AI Ready</div>
      </div>
      <div className="w-px h-8 bg-[#1F1F28]" />
      <div className="text-center">
        <div className={`text-sm font-bold ${getDeltaColor(signals.competitiveAuthorityDelta)}`}>
          {getDeltaIcon(signals.competitiveAuthorityDelta)}{Math.abs(signals.competitiveAuthorityDelta)}
        </div>
        <div className="text-[9px] text-white/40 uppercase">vs Comp</div>
      </div>
    </div>
  );
}
