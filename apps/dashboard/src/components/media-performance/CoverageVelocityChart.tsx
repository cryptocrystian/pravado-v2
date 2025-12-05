/**
 * CoverageVelocityChart Component (Sprint S52)
 * Bar chart showing mentions per day/week with velocity metrics
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface VelocityDataPoint {
  timestamp: Date;
  mentionCount: number;
  label?: string;
}

interface CoverageVelocityChartProps {
  data: VelocityDataPoint[];
  title?: string;
  currentVelocity?: number | null; // mentions per day
  momentumScore?: number | null; // 0-100
  className?: string;
  height?: number;
}

export function CoverageVelocityChart({
  data,
  title = 'Coverage Velocity',
  currentVelocity,
  momentumScore,
  className,
  height = 200,
}: CoverageVelocityChartProps) {
  const { chartBars, maxMentions, avgMentions, xAxisLabels } = useMemo(() => {
    if (data.length === 0) {
      return { chartBars: [], maxMentions: 0, avgMentions: 0, xAxisLabels: [] };
    }

    const width = 600;
    const padding = { left: 40, right: 20, top: 20, bottom: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const max = Math.max(...data.map((d) => d.mentionCount), 1);
    const avg = data.reduce((sum, d) => sum + d.mentionCount, 0) / data.length;

    const barWidth = chartWidth / data.length - 4;
    const barGap = 4;

    const bars = data.map((point, pointIndex) => {
      const x = padding.left + pointIndex * (barWidth + barGap);
      const barHeight = (point.mentionCount / max) * chartHeight;
      const y = padding.top + chartHeight - barHeight;

      return {
        x,
        y,
        width: barWidth,
        height: barHeight,
        value: point.mentionCount,
        timestamp: point.timestamp,
        isAboveAvg: point.mentionCount > avg,
      };
    });

    // X-axis labels (show every nth bar to avoid crowding)
    const labelInterval = Math.max(1, Math.floor(data.length / 6));
    const labels = data
      .filter((_, filterIdx) => filterIdx % labelInterval === 0 || filterIdx === data.length - 1)
      .map((point) => ({
        timestamp: point.timestamp,
        x: padding.left + data.indexOf(point) * (barWidth + barGap) + barWidth / 2,
      }));

    return {
      chartBars: bars,
      maxMentions: max,
      avgMentions: avg,
      xAxisLabels: labels,
    };
  }, [data, height]);

  const momentumColor =
    momentumScore !== null && momentumScore !== undefined
      ? momentumScore >= 70
        ? 'green'
        : momentumScore >= 40
        ? 'blue'
        : momentumScore >= 20
        ? 'yellow'
        : 'red'
      : 'gray';

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {currentVelocity !== null && currentVelocity !== undefined && (
              <Badge variant="outline" className="text-xs">
                {currentVelocity.toFixed(1)} mentions/day
              </Badge>
            )}
            {momentumScore !== null && momentumScore !== undefined && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs flex items-center gap-1',
                  momentumColor === 'green' && 'bg-green-100 text-green-800 border-green-200',
                  momentumColor === 'blue' && 'bg-blue-100 text-blue-800 border-blue-200',
                  momentumColor === 'yellow' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  momentumColor === 'red' && 'bg-red-100 text-red-800 border-red-200',
                  momentumColor === 'gray' && 'bg-gray-100 text-gray-800 border-gray-200'
                )}
              >
                {momentumScore >= 50 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                Momentum: {momentumScore.toFixed(0)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            No velocity data available
          </div>
        ) : (
          <svg
            width="100%"
            height={height}
            viewBox={`0 0 600 ${height}`}
            className="overflow-visible"
          >
            {/* Average line */}
            {avgMentions > 0 && (
              <>
                <line
                  x1="40"
                  y1={20 + (height - 60) - (avgMentions / maxMentions) * (height - 60)}
                  x2="580"
                  y2={20 + (height - 60) - (avgMentions / maxMentions) * (height - 60)}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="4 2"
                />
                <text
                  x="585"
                  y={20 + (height - 60) - (avgMentions / maxMentions) * (height - 60) + 4}
                  fontSize="10"
                  fill="#64748b"
                  textAnchor="start"
                >
                  Avg
                </text>
              </>
            )}

            {/* Bars */}
            {chartBars.map((bar, _idx) => (
              <g key={_idx}>
                <rect
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  fill={bar.isAboveAvg ? '#3b82f6' : '#93c5fd'}
                  rx="2"
                >
                  <title>
                    {bar.timestamp.toLocaleDateString()}: {bar.value} mentions
                  </title>
                </rect>
                {/* Value label on hover */}
                {bar.height > 15 && (
                  <text
                    x={bar.x + bar.width / 2}
                    y={bar.y - 4}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6b7280"
                    opacity="0.8"
                  >
                    {bar.value}
                  </text>
                )}
              </g>
            ))}

            {/* Y-axis labels */}
            <text x="35" y="25" textAnchor="end" fontSize="10" fill="#6b7280">
              {maxMentions}
            </text>
            <text x="35" y={height - 35} textAnchor="end" fontSize="10" fill="#6b7280">
              0
            </text>

            {/* X-axis labels */}
            {xAxisLabels.map((label, _idx) => (
              <text
                key={_idx}
                x={label.x}
                y={height - 15}
                textAnchor="middle"
                fontSize="10"
                fill="#6b7280"
              >
                {label.timestamp.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </text>
            ))}
          </svg>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>Above Average</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-300 rounded" />
            <span>Below Average</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
