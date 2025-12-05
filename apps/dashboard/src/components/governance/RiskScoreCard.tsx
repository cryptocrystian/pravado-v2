/**
 * Risk Score Card Component (Sprint S59)
 * Displays entity risk score with visual indicators and trend
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '@/lib/utils';
import type { GovernanceRiskScore, GovernanceScoreTrend } from '@/lib/governanceApi';
import { getEntityTypeLabel, getTrendColor } from '@/lib/governanceApi';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Activity } from 'lucide-react';

interface RiskScoreCardProps {
  riskScore: GovernanceRiskScore;
  compact?: boolean;
  onClick?: () => void;
  className?: string;
}

function getTrendIcon(trend: GovernanceScoreTrend | undefined) {
  switch (trend) {
    case 'improving':
      return <TrendingDown className="h-4 w-4" />;
    case 'worsening':
      return <TrendingUp className="h-4 w-4" />;
    case 'stable':
    default:
      return <Minus className="h-4 w-4" />;
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-red-600';
  if (score >= 60) return 'text-orange-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-red-100';
  if (score >= 60) return 'bg-orange-100';
  if (score >= 40) return 'bg-yellow-100';
  return 'bg-green-100';
}

export function RiskScoreCard({ riskScore, compact, onClick, className }: RiskScoreCardProps) {
  const trendColor = getTrendColor(riskScore.scoreTrend ?? 'stable');
  const scoreColor = getScoreColor(riskScore.overallScore);
  const scoreBgColor = getScoreBgColor(riskScore.overallScore);

  const trendColorClasses: Record<string, string> = {
    green: 'text-green-600',
    red: 'text-red-600',
    gray: 'text-gray-500',
  };

  const riskDimensions = [
    { key: 'contentRisk', label: 'Content', value: riskScore.contentRisk },
    { key: 'reputationRisk', label: 'Reputation', value: riskScore.reputationRisk },
    { key: 'crisisRisk', label: 'Crisis', value: riskScore.crisisRisk },
    { key: 'legalRisk', label: 'Legal', value: riskScore.legalRisk },
    { key: 'relationshipRisk', label: 'Relationship', value: riskScore.relationshipRisk },
    { key: 'competitiveRisk', label: 'Competitive', value: riskScore.competitiveRisk },
  ].filter((d) => d.value !== null && d.value !== undefined);

  if (compact) {
    return (
      <Card
        className={cn('hover:shadow-md transition-shadow', onClick && 'cursor-pointer', className)}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-full', scoreBgColor)}>
                <Shield className={cn('h-5 w-5', scoreColor)} />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {riskScore.entityName || riskScore.entityId}
                </div>
                <div className="text-xs text-gray-500">
                  {getEntityTypeLabel(riskScore.entityType)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={cn('text-2xl font-bold', scoreColor)}>
                {riskScore.overallScore.toFixed(0)}
              </div>
              <div className="flex items-center gap-1 justify-end">
                <span className={trendColorClasses[trendColor]}>
                  {getTrendIcon(riskScore.scoreTrend)}
                </span>
                <SeverityBadge severity={riskScore.riskLevel} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn('hover:shadow-md transition-shadow', onClick && 'cursor-pointer', className)}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className={cn('h-5 w-5', scoreColor)} />
            <CardTitle className="text-sm font-medium text-gray-600">Risk Score</CardTitle>
          </div>
          <SeverityBadge severity={riskScore.riskLevel} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Entity Info */}
        <div>
          <div className="text-lg font-semibold text-gray-900">
            {riskScore.entityName || riskScore.entityId}
          </div>
          <div className="text-xs text-gray-500">{getEntityTypeLabel(riskScore.entityType)}</div>
        </div>

        {/* Overall Score */}
        <div className="flex items-baseline gap-3">
          <div className={cn('text-4xl font-bold', scoreColor)}>
            {riskScore.overallScore.toFixed(0)}
          </div>
          <span className="text-sm text-gray-500">/ 100</span>
          {riskScore.previousScore !== null && riskScore.previousScore !== undefined && (
            <div className="flex items-center gap-1">
              <span className={trendColorClasses[trendColor]}>
                {getTrendIcon(riskScore.scoreTrend)}
              </span>
              <span className={cn('text-sm font-medium', trendColorClasses[trendColor])}>
                {riskScore.scoreTrend === 'improving' && 'Improving'}
                {riskScore.scoreTrend === 'worsening' && 'Worsening'}
                {riskScore.scoreTrend === 'stable' && 'Stable'}
              </span>
            </div>
          )}
        </div>

        {/* Risk Dimensions */}
        {riskDimensions.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs font-medium text-gray-500 uppercase">Risk Breakdown</div>
            <div className="grid grid-cols-2 gap-2">
              {riskDimensions.map((dimension) => (
                <div key={dimension.key} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{dimension.label}</span>
                  <span
                    className={cn(
                      'font-medium',
                      getScoreColor(dimension.value as number)
                    )}
                  >
                    {(dimension.value as number).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contributing Factors */}
        {riskScore.contributingFactors && riskScore.contributingFactors.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-xs font-medium text-gray-500 uppercase">Top Factors</div>
            <div className="space-y-1">
              {riskScore.contributingFactors.slice(0, 3).map((factor, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate max-w-[70%]">{factor.factor}</span>
                  <Badge variant="outline" className="text-xs">
                    +{factor.contribution.toFixed(0)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Findings */}
        {riskScore.activeFindingsCount > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-gray-600">
              {riskScore.activeFindingsCount} active finding{riskScore.activeFindingsCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Stale Indicator */}
        {riskScore.isStale && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <Activity className="h-4 w-4" />
            <span>Score may be outdated</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
