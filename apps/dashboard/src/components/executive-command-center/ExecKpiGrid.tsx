/**
 * Executive KPI Grid Component (Sprint S61)
 * Grid of KPI tiles with trend indicators
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  type ExecDashboardKpi,
  getSourceSystemLabel,
  getSourceSystemColor,
  getTrendIconClass,
} from '@/lib/executiveCommandCenterApi';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Loader2,
} from 'lucide-react';

interface ExecKpiGridProps {
  kpis: ExecDashboardKpi[];
  loading?: boolean;
  className?: string;
}

function getTrendIcon(direction: 'up' | 'down' | 'flat') {
  switch (direction) {
    case 'up':
      return <TrendingUp className="h-4 w-4" />;
    case 'down':
      return <TrendingDown className="h-4 w-4" />;
    default:
      return <Minus className="h-4 w-4" />;
  }
}

function formatValue(value: number, unit?: string | null): string {
  if (unit === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  if (unit === 'count') {
    return value.toFixed(0);
  }
  if (unit === 'score') {
    return value.toFixed(0);
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(1);
}

function getValueColor(metricKey: string, value: number): string {
  // Higher is worse for risk metrics
  if (metricKey.includes('risk') || metricKey.includes('crisis')) {
    if (value >= 75) return 'text-red-600';
    if (value >= 50) return 'text-orange-600';
    if (value >= 25) return 'text-yellow-600';
    return 'text-green-600';
  }
  // Higher is better for most other metrics
  if (value >= 75) return 'text-green-600';
  if (value >= 50) return 'text-blue-600';
  if (value >= 25) return 'text-yellow-600';
  return 'text-red-600';
}

export function ExecKpiGrid({ kpis, loading, className }: ExecKpiGridProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Key Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading KPIs...</span>
        </CardContent>
      </Card>
    );
  }

  if (!kpis || kpis.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Key Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 text-gray-500">
          No KPIs available. Refresh the dashboard to aggregate metrics.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Key Performance Indicators
          <Badge variant="secondary" className="ml-auto">
            {kpis.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
            >
              {/* Source System Badge */}
              {kpi.sourceSystem && (
                <Badge
                  variant="outline"
                  className={cn('text-xs mb-2', getSourceSystemColor(kpi.sourceSystem))}
                >
                  {getSourceSystemLabel(kpi.sourceSystem)}
                </Badge>
              )}

              {/* Metric Label */}
              <div className="text-xs text-gray-500 mb-1 line-clamp-1">
                {kpi.metricLabel}
              </div>

              {/* Value */}
              <div className="flex items-end justify-between">
                <div
                  className={cn(
                    'text-2xl font-bold',
                    getValueColor(kpi.metricKey, kpi.metricValue)
                  )}
                >
                  {formatValue(kpi.metricValue, kpi.metricUnit)}
                </div>

                {/* Trend */}
                {kpi.metricTrend && (
                  <div
                    className={cn(
                      'flex items-center gap-1',
                      getTrendIconClass(kpi.metricTrend.direction)
                    )}
                  >
                    {getTrendIcon(kpi.metricTrend.direction)}
                    {kpi.metricTrend.changePercent !== undefined && (
                      <span className="text-xs">
                        {kpi.metricTrend.changePercent > 0 ? '+' : ''}
                        {kpi.metricTrend.changePercent.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Unit */}
              {kpi.metricUnit && kpi.metricUnit !== 'count' && kpi.metricUnit !== 'score' && (
                <div className="text-xs text-gray-400 mt-1">{kpi.metricUnit}</div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
