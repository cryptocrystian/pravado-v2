'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CompetitorMetricsSnapshot, CISentimentTrend } from '@pravado/types';
import { formatNumber } from '@/lib/competitorIntelligenceApi';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';

interface CompetitorTrendChartProps {
  snapshots: CompetitorMetricsSnapshot[];
  metric?: 'mentions' | 'sentiment' | 'evi' | 'reach';
  title?: string;
  description?: string;
  className?: string;
}

export function CompetitorTrendChart({
  snapshots,
  metric = 'mentions',
  title,
  description,
  className,
}: CompetitorTrendChartProps) {
  const sortedSnapshots = useMemo(
    () => [...snapshots].sort((a, b) => new Date(a.snapshotAt).getTime() - new Date(b.snapshotAt).getTime()),
    [snapshots]
  );

  const chartData = useMemo(() => {
    return sortedSnapshots.map((snapshot) => {
      switch (metric) {
        case 'mentions':
          return snapshot.mentionCount;
        case 'sentiment':
          return snapshot.avgSentiment !== null && snapshot.avgSentiment !== undefined
            ? snapshot.avgSentiment * 100
            : 0;
        case 'evi':
          return snapshot.eviScore || 0;
        case 'reach':
          return snapshot.estimatedReach || 0;
        default:
          return 0;
      }
    });
  }, [sortedSnapshots, metric]);

  const maxValue = Math.max(...chartData, 1);
  const minValue = Math.min(...chartData, 0);
  const range = maxValue - minValue || 1;

  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable' as const, change: 0, changePct: 0 };

    const firstHalf = chartData.slice(0, Math.floor(chartData.length / 2));
    const secondHalf = chartData.slice(Math.floor(chartData.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    const changePct = firstAvg !== 0 ? (change / firstAvg) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (changePct > 5) direction = 'up';
    else if (changePct < -5) direction = 'down';

    return { direction, change, changePct };
  }, [chartData]);

  const metricLabels = {
    mentions: { title: 'Mention Volume', unit: '' },
    sentiment: { title: 'Sentiment Score', unit: '%' },
    evi: { title: 'EVI Score', unit: '' },
    reach: { title: 'Estimated Reach', unit: '' },
  };

  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const trendColor =
    metric === 'sentiment'
      ? trend.direction === 'up'
        ? 'text-green-600'
        : trend.direction === 'down'
        ? 'text-red-600'
        : 'text-gray-600'
      : trend.direction === 'up'
      ? 'text-green-600'
      : trend.direction === 'down'
      ? 'text-red-600'
      : 'text-gray-600';

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title || metricLabels[metric].title}</CardTitle>
            {description && <CardDescription className="text-xs">{description}</CardDescription>}
          </div>
          <div className={cn('flex items-center gap-1', trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {trend.changePct >= 0 ? '+' : ''}
              {trend.changePct.toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple bar chart visualization */}
        <div className="flex h-24 items-end gap-1">
          {chartData.map((value, index) => {
            const height = ((value - minValue) / range) * 100;
            const isLatest = index === chartData.length - 1;

            return (
              <div
                key={index}
                className="flex-1 group relative"
                title={`${sortedSnapshots[index]?.snapshotAt ? new Date(sortedSnapshots[index].snapshotAt).toLocaleDateString() : ''}: ${metric === 'reach' ? formatNumber(value) : value.toFixed(1)}${metricLabels[metric].unit}`}
              >
                <div
                  className={cn(
                    'w-full rounded-t transition-all',
                    isLatest ? 'bg-primary' : 'bg-primary/40',
                    'hover:bg-primary/80'
                  )}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded bg-muted p-2">
            <p className="text-muted-foreground">Latest</p>
            <p className="font-medium">
              {metric === 'reach'
                ? formatNumber(chartData[chartData.length - 1])
                : chartData[chartData.length - 1]?.toFixed(1)}
              {metricLabels[metric].unit}
            </p>
          </div>
          <div className="rounded bg-muted p-2">
            <p className="text-muted-foreground">Average</p>
            <p className="font-medium">
              {metric === 'reach'
                ? formatNumber(chartData.reduce((a, b) => a + b, 0) / chartData.length)
                : (chartData.reduce((a, b) => a + b, 0) / chartData.length).toFixed(1)}
              {metricLabels[metric].unit}
            </p>
          </div>
          <div className="rounded bg-muted p-2">
            <p className="text-muted-foreground">Peak</p>
            <p className="font-medium">
              {metric === 'reach' ? formatNumber(maxValue) : maxValue.toFixed(1)}
              {metricLabels[metric].unit}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SentimentTrendDisplayProps {
  trend: CISentimentTrend;
  className?: string;
}

export function SentimentTrendDisplay({ trend, className }: SentimentTrendDisplayProps) {
  const directionIcon = {
    improving: ArrowUp,
    declining: ArrowDown,
    stable: Minus,
    unknown: Minus,
  };

  const directionColor = {
    improving: 'text-green-600',
    declining: 'text-red-600',
    stable: 'text-gray-600',
    unknown: 'text-gray-600',
  };

  const Icon = directionIcon[trend.direction];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <Icon className={cn('h-4 w-4', directionColor[trend.direction])} />
        <span className={cn('text-sm font-medium', directionColor[trend.direction])}>
          {trend.direction.charAt(0).toUpperCase() + trend.direction.slice(1)}
        </span>
      </div>
      <Badge variant="outline" className="text-xs">
        {(trend.current * 100).toFixed(0)}% ({trend.changePct ? `${trend.changePct > 0 ? '+' : ''}${trend.changePct.toFixed(1)}%` : 'No change'})
      </Badge>
      <Badge variant="outline" className="text-xs">
        Stability: {trend.stabilityScore.toFixed(0)}%
      </Badge>
    </div>
  );
}
