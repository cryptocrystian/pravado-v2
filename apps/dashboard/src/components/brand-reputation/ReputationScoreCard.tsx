/**
 * ReputationScoreCard Component (Sprint S56)
 * Displays the overall brand reputation score with trend indicator
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getScoreColor,
  getScoreLabel,
  getTrendColor,
  formatDelta,
} from '@/lib/brandReputationApi';
import { cn } from '@/lib/utils';
import type { ReputationTrendDirection } from '@pravado/types';
import { ArrowUp, ArrowDown, Minus, TrendingUp } from 'lucide-react';

interface ReputationScoreCardProps {
  score: number | null | undefined;
  previousScore?: number | null;
  trendDirection?: ReputationTrendDirection;
  scoreDelta?: number | null;
  title?: string;
  description?: string;
  className?: string;
  showTrend?: boolean;
}

export function ReputationScoreCard({
  score,
  previousScore,
  trendDirection,
  scoreDelta,
  title = 'Brand Reputation Score',
  description,
  className,
  showTrend = true,
}: ReputationScoreCardProps) {
  const scoreColorClass = getScoreColor(score);
  const scoreLabel = getScoreLabel(score);

  // Calculate delta if not provided
  const calculatedDelta =
    scoreDelta !== undefined
      ? scoreDelta
      : score !== null && score !== undefined && previousScore !== null && previousScore !== undefined
      ? score - previousScore
      : null;

  // Determine trend if not provided
  const determinedTrend =
    trendDirection ||
    (calculatedDelta !== null && calculatedDelta !== undefined
      ? Math.abs(calculatedDelta) < 2
        ? 'flat'
        : calculatedDelta > 0
        ? 'up'
        : 'down'
      : 'flat');

  const trendColorClass = getTrendColor(determinedTrend);
  const { text: deltaText, colorClass: deltaColorClass } = formatDelta(calculatedDelta);

  // Color classes for styling (scoreBgClasses available for V2 styling)
  const badgeBgClasses: Record<string, string> = {
    'text-green-600': 'bg-green-100 text-green-800',
    'text-blue-600': 'bg-blue-100 text-blue-800',
    'text-yellow-600': 'bg-yellow-100 text-yellow-800',
    'text-orange-600': 'bg-orange-100 text-orange-800',
    'text-red-600': 'bg-red-100 text-red-800',
    'text-gray-600': 'bg-gray-100 text-gray-800',
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          </div>
          {scoreLabel !== 'N/A' && (
            <Badge variant="outline" className={cn('text-xs', badgeBgClasses[scoreColorClass])}>
              {scoreLabel}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Score Display */}
        <div className="flex items-baseline gap-2">
          <div className={cn('text-4xl font-bold', scoreColorClass)}>
            {score !== null && score !== undefined ? score.toFixed(0) : '--'}
          </div>
          {score !== null && score !== undefined && (
            <span className="text-sm text-gray-500">/ 100</span>
          )}
        </div>

        {/* Trend Indicator */}
        {showTrend && calculatedDelta !== null && calculatedDelta !== undefined && (
          <div className="flex items-center gap-1">
            {determinedTrend === 'up' && <ArrowUp className={cn('h-4 w-4', trendColorClass)} />}
            {determinedTrend === 'down' && <ArrowDown className={cn('h-4 w-4', trendColorClass)} />}
            {determinedTrend === 'flat' && <Minus className={cn('h-4 w-4', trendColorClass)} />}
            <span className={cn('text-sm font-medium', deltaColorClass)}>
              {deltaText}
            </span>
            <span className="text-xs text-gray-500">from previous period</span>
          </div>
        )}

        {/* Score Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              score !== null && score !== undefined
                ? score >= 80
                  ? 'bg-green-500'
                  : score >= 60
                  ? 'bg-blue-500'
                  : score >= 40
                  ? 'bg-yellow-500'
                  : score >= 20
                  ? 'bg-orange-500'
                  : 'bg-red-500'
                : 'bg-gray-300'
            )}
            style={{ width: `${score ?? 0}%` }}
          />
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-600 pt-1 border-t">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
