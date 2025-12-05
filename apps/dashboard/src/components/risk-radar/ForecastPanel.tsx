/**
 * Forecast Panel Component (Sprint S60)
 * Shows current forecast with projected risk curves and narrative
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskLevelBadge } from './RiskLevelBadge';
import type { RiskRadarForecast } from '@/lib/riskRadarApi';
import { getHorizonLabel, formatProbability, formatRelativeTime } from '@/lib/riskRadarApi';
import {
  TrendingUp,
  RefreshCw,
  Clock,
  Target,
  CheckCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ForecastPanelProps {
  forecast?: RiskRadarForecast;
  loading?: boolean;
  onRegenerate?: () => void;
  regenerating?: boolean;
  className?: string;
}

export function ForecastPanel({
  forecast,
  loading,
  onRegenerate,
  regenerating,
  className,
}: ForecastPanelProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Risk Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading forecast...</span>
        </CardContent>
      </Card>
    );
  }

  if (!forecast) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Risk Forecast
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-gray-500 mb-4">No forecast generated yet.</div>
          {onRegenerate && (
            <Button onClick={onRegenerate} disabled={regenerating}>
              {regenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Forecast
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const projectionPoints = forecast.projectionCurve || [];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Risk Forecast
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {getHorizonLabel(forecast.horizon)}
          </Badge>
          {onRegenerate && (
            <Button variant="ghost" size="sm" onClick={onRegenerate} disabled={regenerating}>
              {regenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Predicted Risk Level */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-500">Predicted Risk</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                'text-3xl font-bold',
                forecast.predictedRiskLevel === 'critical' ? 'text-red-600' :
                forecast.predictedRiskLevel === 'high' ? 'text-orange-600' :
                forecast.predictedRiskLevel === 'medium' ? 'text-yellow-600' : 'text-green-600'
              )}>
                {forecast.predictedRiskIndex}
              </span>
              <span className="text-gray-400">/100</span>
              <RiskLevelBadge level={forecast.predictedRiskLevel} />
            </div>
          </div>
          {forecast.probabilityOfCrisis !== undefined && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Crisis Probability</div>
              <div className={cn(
                'text-2xl font-bold',
                forecast.probabilityOfCrisis >= 0.7 ? 'text-red-600' :
                forecast.probabilityOfCrisis >= 0.4 ? 'text-orange-600' : 'text-green-600'
              )}>
                {formatProbability(forecast.probabilityOfCrisis)}
              </div>
            </div>
          )}
        </div>

        {/* Confidence Interval */}
        {forecast.confidenceIntervalLow !== undefined && forecast.confidenceIntervalHigh !== undefined && (
          <div className="text-sm text-gray-600">
            <Target className="h-4 w-4 inline mr-1" />
            Confidence interval: {forecast.confidenceIntervalLow.toFixed(0)} - {forecast.confidenceIntervalHigh.toFixed(0)}
          </div>
        )}

        {/* Simple Projection Visualization */}
        {projectionPoints.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase">Projection Trend</div>
            <div className="flex items-end gap-1 h-16 bg-gray-50 rounded p-2">
              {projectionPoints.slice(0, 10).map((point, i) => {
                const height = (point.value / 100) * 100;
                const color = point.value >= 75 ? 'bg-red-400' :
                             point.value >= 50 ? 'bg-orange-400' :
                             point.value >= 25 ? 'bg-yellow-400' : 'bg-green-400';
                return (
                  <div
                    key={i}
                    className={cn('flex-1 rounded-t transition-all', color)}
                    style={{ height: `${height}%` }}
                    title={`${point.value.toFixed(0)} (${Math.round(point.confidence * 100)}% confidence)`}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Executive Summary */}
        {forecast.executiveSummary && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase">Executive Summary</div>
            <div className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100">
              {forecast.executiveSummary}
            </div>
          </div>
        )}

        {/* Expand/Collapse Details */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              Show Details
            </>
          )}
        </Button>

        {showDetails && (
          <div className="space-y-4 pt-2 border-t">
            {/* Recommended Actions */}
            {forecast.recommendedActions && forecast.recommendedActions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase">Recommended Actions</div>
                <div className="space-y-2">
                  {forecast.recommendedActions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Badge
                        variant="outline"
                        className={cn(
                          'shrink-0',
                          action.priority === 'immediate' ? 'bg-red-50 text-red-700' :
                          action.priority === 'high' ? 'bg-orange-50 text-orange-700' :
                          'bg-gray-50 text-gray-700'
                        )}
                      >
                        {action.priority}
                      </Badge>
                      <span className="text-gray-700">{action.action}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Watch Items */}
            {forecast.watchItems && forecast.watchItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase">Watch Items</div>
                <div className="space-y-2">
                  {forecast.watchItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-2 bg-amber-50 rounded">
                      <Eye className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">{item.item}</div>
                        <div className="text-gray-600">{item.reason}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Assumptions */}
            {forecast.keyAssumptions && forecast.keyAssumptions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase">Key Assumptions</div>
                <div className="space-y-1">
                  {forecast.keyAssumptions.map((assumption, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="h-3 w-3 text-gray-400" />
                      {assumption.assumption}
                      <span className="text-gray-400">({Math.round(assumption.confidence * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model Info */}
            <div className="text-xs text-gray-400 pt-2 border-t">
              Generated {formatRelativeTime(forecast.createdAt)}
              {forecast.llmModel && ` using ${forecast.llmModel}`}
              {forecast.tokensUsed && ` (${forecast.tokensUsed} tokens)`}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
