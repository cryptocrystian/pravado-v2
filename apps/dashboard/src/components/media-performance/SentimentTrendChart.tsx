/**
 * SentimentTrendChart Component (Sprint S52)
 * Line chart showing sentiment trends over time with color-coded zones
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getSentimentColor } from '@/lib/mediaPerformanceApi';
import type { TrendDirection } from '@pravado/types';
import { useMemo } from 'react';

interface SentimentDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

interface SentimentTrendChartProps {
  data: SentimentDataPoint[];
  title?: string;
  currentSentiment?: number | null;
  trendDirection?: TrendDirection;
  changePct?: number | null;
  className?: string;
  height?: number;
}

export function SentimentTrendChart({
  data,
  title = 'Sentiment Trend',
  currentSentiment,
  trendDirection: _trendDirection,
  changePct: _changePct,
  className,
  height = 200,
}: SentimentTrendChartProps) {
  // Calculate chart dimensions and scales
  const { chartPoints, yAxisLabels, xAxisLabels } = useMemo(() => {
    if (data.length === 0) {
      return { chartPoints: [], yAxisLabels: [], xAxisLabels: [] };
    }

    const width = 600;
    const padding = { left: 40, right: 20, top: 20, bottom: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Y-axis: -1 to 1 (sentiment range)
    const yMin = -1;
    const yMax = 1;
    const yRange = yMax - yMin;

    // X-axis: time
    const xMin = data[0].timestamp.getTime();
    const xMax = data[data.length - 1].timestamp.getTime();
    const xRange = xMax - xMin || 1;

    // Map data points to SVG coordinates
    const points = data.map((point, _idx) => {
      const x = padding.left + (point.timestamp.getTime() - xMin) / xRange * chartWidth;
      const y = padding.top + chartHeight - ((point.value - yMin) / yRange) * chartHeight;
      return { x, y, value: point.value, timestamp: point.timestamp };
    });

    // Y-axis labels
    const yLabels = [
      { value: 1, label: '+100%', y: padding.top },
      { value: 0.5, label: '+50%', y: padding.top + chartHeight * 0.25 },
      { value: 0, label: 'Neutral', y: padding.top + chartHeight * 0.5 },
      { value: -0.5, label: '-50%', y: padding.top + chartHeight * 0.75 },
      { value: -1, label: '-100%', y: padding.top + chartHeight },
    ];

    // X-axis labels (show first, middle, last)
    const xLabels = [
      { timestamp: data[0].timestamp, x: padding.left },
      { timestamp: data[Math.floor(data.length / 2)].timestamp, x: padding.left + chartWidth / 2 },
      { timestamp: data[data.length - 1].timestamp, x: padding.left + chartWidth },
    ];

    return {
      chartPoints: points,
      yAxisLabels: yLabels,
      xAxisLabels: xLabels,
    };
  }, [data, height]);

  const currentSentimentColor = getSentimentColor(currentSentiment);

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {currentSentiment !== null && currentSentiment !== undefined && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {(currentSentiment * 100).toFixed(0)}%
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  currentSentimentColor === 'green' && 'bg-green-100 text-green-800 border-green-200',
                  currentSentimentColor === 'blue' && 'bg-blue-100 text-blue-800 border-blue-200',
                  currentSentimentColor === 'yellow' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                  currentSentimentColor === 'orange' && 'bg-orange-100 text-orange-800 border-orange-200',
                  currentSentimentColor === 'red' && 'bg-red-100 text-red-800 border-red-200'
                )}
              >
                {currentSentimentColor === 'green' && 'Positive'}
                {currentSentimentColor === 'blue' && 'Neutral'}
                {currentSentimentColor === 'yellow' && 'Mixed'}
                {currentSentimentColor === 'orange' && 'Negative'}
                {currentSentimentColor === 'red' && 'Very Negative'}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            No sentiment data available
          </div>
        ) : (
          <svg width="100%" height={height} viewBox={`0 0 600 ${height}`} className="overflow-visible">
            {/* Grid lines */}
            {yAxisLabels.map((label) => (
              <line
                key={`grid-${label.value}`}
                x1="40"
                y1={label.y}
                x2="580"
                y2={label.y}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
            ))}

            {/* Positive/Negative zones */}
            <rect
              x="40"
              y="20"
              width="540"
              height={height * 0.4}
              fill="#dcfce7"
              opacity="0.05"
            />
            <rect
              x="40"
              y={height * 0.55}
              width="540"
              height={height * 0.4}
              fill="#fee2e2"
              opacity="0.05"
            />

            {/* Chart line */}
            {chartPoints.length > 0 && (
              <polyline
                points={chartPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Data points */}
            {chartPoints.map((point, _idx) => (
              <circle
                key={_idx}
                cx={point.x}
                cy={point.y}
                r="2.5"
                fill="#3b82f6"
              >
                <title>{point.timestamp.toLocaleDateString()}: {(point.value * 100).toFixed(0)}%</title>
              </circle>
            ))}

            {/* Y-axis labels */}
            {yAxisLabels.map((label) => (
              <text
                key={`y-${label.value}`}
                x="35"
                y={label.y + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
              >
                {label.label}
              </text>
            ))}

            {/* X-axis labels */}
            {xAxisLabels.map((label, _idx) => (
              <text
                key={_idx}
                x={label.x}
                y={height - 10}
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
      </CardContent>
    </Card>
  );
}
