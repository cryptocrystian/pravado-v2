/**
 * ReputationTrendChart Component (Sprint S56)
 * Displays reputation trend over time with component breakdown
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getTimeWindowLabel,
  getScoreColor,
  getTrendColor,
  prepareTrendChartData,
} from '@/lib/brandReputationApi';
import { cn } from '@/lib/utils';
import type { ReputationTrendPoint, ReputationTimeWindow, ReputationTrendDirection } from '@pravado/types';
import { ArrowUp, ArrowDown, Minus, Activity } from 'lucide-react';

interface ReputationTrendChartProps {
  trendPoints: ReputationTrendPoint[];
  overallTrend: ReputationTrendDirection;
  startScore: number;
  endScore: number;
  highScore: number;
  lowScore: number;
  averageScore: number;
  volatility: number;
  timeWindow: ReputationTimeWindow;
  showComponents?: boolean;
  className?: string;
}

export function ReputationTrendChart({
  trendPoints,
  overallTrend,
  startScore,
  endScore,
  highScore,
  lowScore,
  averageScore,
  volatility,
  timeWindow,
  showComponents = false,
  className,
}: ReputationTrendChartProps) {
  const trendColorClass = getTrendColor(overallTrend);
  const scoreDelta = endScore - startScore;

  // Prepare chart data (componentData available for V2 component breakdown view)
  const { labels, overallScores } = prepareTrendChartData(trendPoints);

  // Calculate chart dimensions
  const chartHeight = 150;
  const chartWidth = '100%';
  const padding = { top: 20, right: 10, bottom: 30, left: 40 };

  // Calculate Y-axis scale
  const yMin = Math.max(0, lowScore - 10);
  const yMax = Math.min(100, highScore + 10);
  const yRange = yMax - yMin;

  // Generate path for line chart
  const generatePath = (scores: number[]) => {
    if (scores.length === 0) return '';
    const xStep = (100 - padding.left / 4 - padding.right / 4) / (scores.length - 1 || 1);
    return scores
      .map((score, idx) => {
        const x = padding.left / 4 + idx * xStep;
        const y = ((yMax - score) / yRange) * 100;
        return `${idx === 0 ? 'M' : 'L'} ${x}% ${y}%`;
      })
      .join(' ');
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-600">
              Reputation Trend
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {getTimeWindowLabel(timeWindow)}
            </Badge>
            <div className={cn('flex items-center gap-1', trendColorClass)}>
              {overallTrend === 'up' && <ArrowUp className="h-4 w-4" />}
              {overallTrend === 'down' && <ArrowDown className="h-4 w-4" />}
              {overallTrend === 'flat' && <Minus className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {scoreDelta > 0 ? '+' : ''}{scoreDelta.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="p-2 bg-gray-50 rounded">
            <div className="text-lg font-bold text-gray-700">{startScore.toFixed(0)}</div>
            <div className="text-xs text-gray-500">Start</div>
          </div>
          <div className="p-2 bg-gray-50 rounded">
            <div className={cn('text-lg font-bold', getScoreColor(endScore))}>
              {endScore.toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">Current</div>
          </div>
          <div className="p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-700">{highScore.toFixed(0)}</div>
            <div className="text-xs text-green-600">High</div>
          </div>
          <div className="p-2 bg-red-50 rounded">
            <div className="text-lg font-bold text-red-700">{lowScore.toFixed(0)}</div>
            <div className="text-xs text-red-600">Low</div>
          </div>
        </div>

        {/* Simplified Chart Area */}
        {trendPoints.length > 1 ? (
          <div className="relative" style={{ height: chartHeight }}>
            <svg
              width={chartWidth}
              height={chartHeight}
              className="overflow-visible"
              viewBox={`0 0 100 100`}
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.2" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#grid)" />

              {/* Overall score line */}
              <path
                d={generatePath(overallScores)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />

              {/* Data points */}
              {overallScores.map((score, idx) => {
                const xStep = (100 - padding.left / 4 - padding.right / 4) / (overallScores.length - 1 || 1);
                const x = padding.left / 4 + idx * xStep;
                const y = ((yMax - score) / yRange) * 100;
                return (
                  <circle
                    key={idx}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="3"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="1"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
              <span>{yMax}</span>
              <span>{Math.round((yMax + yMin) / 2)}</span>
              <span>{yMin}</span>
            </div>

            {/* X-axis labels */}
            <div className="absolute bottom-0 left-10 right-0 flex justify-between text-xs text-gray-500">
              {labels.length > 0 && (
                <>
                  <span>{labels[0]}</span>
                  {labels.length > 2 && (
                    <span>{labels[Math.floor(labels.length / 2)]}</span>
                  )}
                  <span>{labels[labels.length - 1]}</span>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            Not enough data points to display trend
          </div>
        )}

        {/* Additional Stats */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
          <span>Avg: {averageScore.toFixed(1)}</span>
          <span>Volatility: {volatility.toFixed(2)}</span>
          <span>{trendPoints.length} data points</span>
        </div>

        {/* Component Legend (if showing components) */}
        {showComponents && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-xs text-gray-500">Components:</span>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
              Overall
            </Badge>
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              Sentiment
            </Badge>
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
              Coverage
            </Badge>
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
              Crisis
            </Badge>
            <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700">
              Competitive
            </Badge>
            <Badge variant="outline" className="text-xs bg-cyan-50 text-cyan-700">
              Engagement
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
