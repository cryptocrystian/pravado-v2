/**
 * Executive Risk Dashboard Component (Sprint S60)
 * High-level executive view of overall risk posture
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskLevelBadge } from './RiskLevelBadge';
import type { RiskRadarSnapshot, RiskRadarForecast } from '@/lib/riskRadarApi';
import { formatRelativeTime } from '@/lib/riskRadarApi';
import {
  Radar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Activity,
  Clock,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  BarChart3,
} from 'lucide-react';

interface ExecutiveRiskDashboardProps {
  snapshot?: RiskRadarSnapshot;
  forecast?: RiskRadarForecast;
  previousSnapshot?: RiskRadarSnapshot;
  loading?: boolean;
  className?: string;
}

function getTrendIndicator(current: number, previous: number): {
  direction: 'up' | 'down' | 'stable';
  change: number;
  color: string;
} {
  const change = current - previous;
  if (Math.abs(change) < 2) {
    return { direction: 'stable', change: 0, color: 'text-gray-500' };
  }
  if (change > 0) {
    return { direction: 'up', change, color: 'text-red-500' }; // Risk increasing is bad
  }
  return { direction: 'down', change: Math.abs(change), color: 'text-green-500' }; // Risk decreasing is good
}

export function ExecutiveRiskDashboard({
  snapshot,
  forecast,
  previousSnapshot,
  loading,
  className,
}: ExecutiveRiskDashboardProps) {
  if (loading || !snapshot) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Radar className="h-4 w-4" />
            Executive Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center text-gray-500">
            {loading ? 'Loading dashboard...' : 'No snapshot data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const trend = previousSnapshot
    ? getTrendIndicator(snapshot.overallRiskIndex, previousSnapshot.overallRiskIndex)
    : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Radar className="h-4 w-4" />
          Executive Risk Dashboard
          <Badge variant="outline" className="ml-auto text-xs">
            <Clock className="h-3 w-3 mr-1" />
            {formatRelativeTime(snapshot.snapshotDate)}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Primary Risk Score */}
        <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
          <div className="text-sm text-gray-500 mb-2">Overall Risk Index</div>
          <div className="flex items-center justify-center gap-3">
            <span
              className={cn(
                'text-6xl font-bold',
                snapshot.riskLevel === 'critical'
                  ? 'text-red-600'
                  : snapshot.riskLevel === 'high'
                    ? 'text-orange-600'
                    : snapshot.riskLevel === 'medium'
                      ? 'text-yellow-600'
                      : 'text-green-600'
              )}
            >
              {snapshot.overallRiskIndex}
            </span>
            {trend && trend.direction !== 'stable' && (
              <div className={cn('flex items-center', trend.color)}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
                <span className="text-sm ml-1">
                  {trend.direction === 'up' ? '+' : '-'}
                  {trend.change}
                </span>
              </div>
            )}
          </div>
          <div className="mt-3">
            <RiskLevelBadge level={snapshot.riskLevel} size="lg" />
          </div>
          {snapshot.confidenceScore !== undefined && (
            <div className="text-xs text-gray-500 mt-2">
              {Math.round(snapshot.confidenceScore * 100)}% confidence
            </div>
          )}
        </div>

        {/* Component Scores Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'Sentiment',
              value: snapshot.sentimentScore,
              icon: <Activity className="h-4 w-4" />,
            },
            {
              label: 'Velocity',
              value: snapshot.velocityScore,
              icon: <TrendingUp className="h-4 w-4" />,
            },
            {
              label: 'Alerts',
              value: snapshot.alertScore,
              icon: <AlertTriangle className="h-4 w-4" />,
            },
            {
              label: 'Competitive',
              value: snapshot.competitiveScore,
              icon: <BarChart3 className="h-4 w-4" />,
            },
            {
              label: 'Governance',
              value: snapshot.governanceScore,
              icon: <Shield className="h-4 w-4" />,
            },
            {
              label: 'Persona',
              value: snapshot.personaScore,
              icon: <Users className="h-4 w-4" />,
            },
          ]
            .filter((s) => s.value !== undefined)
            .map((score) => (
              <div
                key={score.label}
                className={cn(
                  'p-3 rounded-lg border',
                  (score.value || 0) >= 70
                    ? 'bg-red-50 border-red-200'
                    : (score.value || 0) >= 50
                      ? 'bg-orange-50 border-orange-200'
                      : (score.value || 0) >= 30
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-green-50 border-green-200'
                )}
              >
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  {score.icon}
                  <span className="text-xs">{score.label}</span>
                </div>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    (score.value || 0) >= 70
                      ? 'text-red-600'
                      : (score.value || 0) >= 50
                        ? 'text-orange-600'
                        : (score.value || 0) >= 30
                          ? 'text-yellow-600'
                          : 'text-green-600'
                  )}
                >
                  {score.value}
                </div>
              </div>
            ))}
        </div>

        {/* Forecast Preview */}
        {forecast && (
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-700">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Forecast</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {forecast.horizon}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Current:</span>
                <span className="font-bold">{snapshot.overallRiskIndex}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-purple-400" />
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Predicted:</span>
                <span
                  className={cn(
                    'font-bold',
                    forecast.predictedRiskLevel === 'critical'
                      ? 'text-red-600'
                      : forecast.predictedRiskLevel === 'high'
                        ? 'text-orange-600'
                        : forecast.predictedRiskLevel === 'medium'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                  )}
                >
                  {forecast.predictedRiskIndex}
                </span>
              </div>
            </div>
            {forecast.probabilityOfCrisis !== undefined && (
              <div className="mt-2 pt-2 border-t border-purple-200 text-sm">
                <span className="text-gray-600">Crisis probability: </span>
                <span
                  className={cn(
                    'font-bold',
                    forecast.probabilityOfCrisis >= 0.7
                      ? 'text-red-600'
                      : forecast.probabilityOfCrisis >= 0.4
                        ? 'text-orange-600'
                        : 'text-green-600'
                  )}
                >
                  {Math.round(forecast.probabilityOfCrisis * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Key Concerns Summary */}
        {snapshot.keyConcerns && snapshot.keyConcerns.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Top Concerns ({snapshot.keyConcerns.length})
            </div>
            <div className="space-y-1">
              {snapshot.keyConcerns.slice(0, 3).map((concern) => (
                <div
                  key={concern.id}
                  className="flex items-center gap-2 text-sm p-2 bg-red-50 rounded border border-red-100"
                >
                  <RiskLevelBadge level={concern.severity} size="sm" />
                  <span className="text-gray-800 truncate">{concern.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emerging Risks Summary */}
        {snapshot.emergingRisks && snapshot.emergingRisks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Target className="h-4 w-4 text-purple-500" />
              Emerging Risks ({snapshot.emergingRisks.length})
            </div>
            <div className="space-y-1">
              {snapshot.emergingRisks.slice(0, 2).map((risk) => (
                <div
                  key={risk.id}
                  className="flex items-center justify-between text-sm p-2 bg-purple-50 rounded border border-purple-100"
                >
                  <span className="text-gray-800 truncate">{risk.name}</span>
                  <Badge variant="outline" className="text-xs shrink-0">
                    {Math.round(risk.probability * 100)}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Positive Factors Summary */}
        {snapshot.positiveFactors && snapshot.positiveFactors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Shield className="h-4 w-4 text-green-500" />
              Positive Factors ({snapshot.positiveFactors.length})
            </div>
            <div className="space-y-1">
              {snapshot.positiveFactors.slice(0, 2).map((factor) => (
                <div
                  key={factor.id}
                  className="flex items-center justify-between text-sm p-2 bg-green-50 rounded border border-green-100"
                >
                  <span className="text-gray-800 truncate">{factor.name}</span>
                  <Badge
                    variant="outline"
                    className="text-xs shrink-0 bg-green-100 text-green-700"
                  >
                    -{factor.impact}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
