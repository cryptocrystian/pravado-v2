/**
 * PerformanceScoreCard Component (Sprint S52)
 * Displays a performance metric with score, trend, and visual indicator
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getScoreColor, getScoreLabel, getTrendColor } from '@/lib/mediaPerformanceApi';
import type { TrendDirection } from '@pravado/types';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

interface PerformanceScoreCardProps {
  title: string;
  score: number | null | undefined;
  previousScore?: number | null;
  trend?: TrendDirection;
  changePct?: number | null;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function PerformanceScoreCard({
  title,
  score,
  previousScore,
  trend,
  changePct,
  description,
  icon,
  className,
}: PerformanceScoreCardProps) {
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  // Calculate change if not provided
  const calculatedChange =
    changePct !== undefined
      ? changePct
      : score !== null && score !== undefined && previousScore !== null && previousScore !== undefined
      ? ((score - previousScore) / previousScore) * 100
      : null;

  // Determine trend if not provided (map any non-standard value to 'stable')
  const determinedTrend: 'up' | 'down' | 'stable' | undefined =
    (trend === 'up' || trend === 'down' || trend === 'stable') ? trend :
    (calculatedChange !== null && calculatedChange !== undefined
      ? calculatedChange > 0
        ? 'up'
        : calculatedChange < 0
        ? 'down'
        : 'stable'
      : undefined);

  const trendColor = getTrendColor(determinedTrend || 'stable');

  const getTrendIconComponent = () => {
    if (!determinedTrend) return null;
    if (determinedTrend === 'up') return <ArrowUp className="h-4 w-4" />;
    if (determinedTrend === 'down') return <ArrowDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      {/* Background accent */}
      <div
        className={cn(
          'absolute top-0 right-0 w-24 h-24 rounded-full opacity-10 -mr-8 -mt-8',
          scoreColor === 'green' && 'bg-green-500',
          scoreColor === 'blue' && 'bg-blue-500',
          scoreColor === 'yellow' && 'bg-yellow-500',
          scoreColor === 'red' && 'bg-red-500',
          scoreColor === 'gray' && 'bg-gray-500'
        )}
      />

      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          {icon && <div className="text-gray-400">{icon}</div>}
        </div>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </CardHeader>

      <CardContent className="space-y-3 relative z-10">
        {/* Score Display */}
        <div className="flex items-baseline gap-2">
          {score !== null && score !== undefined ? (
            <>
              <span
                className={cn(
                  'text-3xl font-bold',
                  scoreColor === 'green' && 'text-green-600',
                  scoreColor === 'blue' && 'text-blue-600',
                  scoreColor === 'yellow' && 'text-yellow-600',
                  scoreColor === 'red' && 'text-red-600',
                  scoreColor === 'gray' && 'text-gray-600'
                )}
              >
                {score.toFixed(0)}
              </span>
              <Badge
                className={cn(
                  'text-xs',
                  scoreColor === 'green' && 'bg-green-100 text-green-800',
                  scoreColor === 'blue' && 'bg-blue-100 text-blue-800',
                  scoreColor === 'yellow' && 'bg-yellow-100 text-yellow-800',
                  scoreColor === 'red' && 'bg-red-100 text-red-800',
                  scoreColor === 'gray' && 'bg-gray-100 text-gray-800'
                )}
              >
                {scoreLabel}
              </Badge>
            </>
          ) : (
            <span className="text-gray-500 text-sm">No data</span>
          )}
        </div>

        {/* Trend & Change */}
        {calculatedChange !== null && calculatedChange !== undefined && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'p-1.5 rounded-md',
                trendColor === 'green' && 'bg-green-100 text-green-600',
                trendColor === 'red' && 'bg-red-100 text-red-600',
                trendColor === 'gray' && 'bg-gray-100 text-gray-600'
              )}
            >
              {getTrendIconComponent()}
            </div>
            <span
              className={cn(
                'text-sm font-semibold',
                trendColor === 'green' && 'text-green-600',
                trendColor === 'red' && 'text-red-600',
                trendColor === 'gray' && 'text-gray-600'
              )}
            >
              {calculatedChange > 0 ? '+' : ''}{calculatedChange.toFixed(1)}%
            </span>
            {previousScore !== null && previousScore !== undefined && (
              <span className="text-xs text-gray-500">
                vs. {previousScore.toFixed(0)}
              </span>
            )}
          </div>
        )}

        {/* Score Bar */}
        {score !== null && score !== undefined && (
          <div className="pt-2">
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  scoreColor === 'green' && 'bg-green-500',
                  scoreColor === 'blue' && 'bg-blue-500',
                  scoreColor === 'yellow' && 'bg-yellow-500',
                  scoreColor === 'red' && 'bg-red-500',
                  scoreColor === 'gray' && 'bg-gray-500'
                )}
                style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
