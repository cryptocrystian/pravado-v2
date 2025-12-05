/**
 * CampaignHeatmap Component (Sprint S52)
 * Calendar heatmap showing campaign activity intensity over time
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface HeatmapDataPoint {
  date: Date;
  value: number; // mentions/activity
}

interface CampaignHeatmapProps {
  data: HeatmapDataPoint[];
  title?: string;
  metric?: string;
  weeks?: number;
  className?: string;
}

export function CampaignHeatmap({
  data,
  title = 'Campaign Activity',
  metric = 'mentions',
  weeks = 12,
  className,
}: CampaignHeatmapProps) {
  const { heatmapCells, totalActivity } = useMemo(() => {
    if (data.length === 0) {
      return { heatmapCells: [], totalActivity: 0 };
    }

    // Get date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - weeks * 7 * 24 * 60 * 60 * 1000);

    // Create all days in range
    const allDays: Date[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      allDays.push(new Date(d));
    }

    // Map data to days
    const dataMap = new Map<string, number>();
    data.forEach((point) => {
      const key = point.date.toISOString().split('T')[0];
      dataMap.set(key, point.value);
    });

    const max = Math.max(...data.map((d) => d.value), 1);
    const total = data.reduce((sum, d) => sum + d.value, 0);

    // Group by weeks
    const cells = allDays.map((date) => {
      const key = date.toISOString().split('T')[0];
      const value = dataMap.get(key) || 0;
      const intensity = value / max;

      return {
        date,
        value,
        intensity,
        dayOfWeek: date.getDay(),
        weekNumber: Math.floor(
          (date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        ),
      };
    });

    return {
      heatmapCells: cells,
      totalActivity: total,
    };
  }, [data, weeks]);

  const getColorForIntensity = (intensity: number): string => {
    if (intensity === 0) return '#f3f4f6'; // gray-100
    if (intensity < 0.2) return '#dbeafe'; // blue-100
    if (intensity < 0.4) return '#93c5fd'; // blue-300
    if (intensity < 0.6) return '#60a5fa'; // blue-400
    if (intensity < 0.8) return '#3b82f6'; // blue-500
    return '#1d4ed8'; // blue-700
  };

  const cellSize = 12;
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {totalActivity} {metric}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {weeks} weeks
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {heatmapCells.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No activity data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block">
              {/* Day Labels */}
              <div className="flex gap-1 mb-1">
                <div className="w-8" /> {/* Spacer for day labels */}
                {Array.from({ length: Math.ceil(heatmapCells.length / 7) }).map((_, weekIdx) => (
                  <div
                    key={weekIdx}
                    className="text-xs text-gray-500 text-center"
                    style={{ width: cellSize }}
                  />
                ))}
              </div>

              {/* Heatmap Grid */}
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => (
                <div key={dayOfWeek} className="flex items-center gap-1 mb-1">
                  {/* Day label */}
                  <div className="w-8 text-xs text-gray-600 text-right pr-1">
                    {dayOfWeek % 2 === 0 ? dayLabels[dayOfWeek] : ''}
                  </div>

                  {/* Cells for this day of week */}
                  {heatmapCells
                    .filter((cell) => cell.dayOfWeek === dayOfWeek)
                    .map((cell, idx) => (
                      <div
                        key={idx}
                        className="rounded-sm transition-all hover:ring-2 hover:ring-blue-400 cursor-pointer"
                        style={{
                          width: cellSize,
                          height: cellSize,
                          backgroundColor: getColorForIntensity(cell.intensity),
                        }}
                        title={`${cell.date.toLocaleDateString()}: ${cell.value} ${metric}`}
                      />
                    ))}
                </div>
              ))}

              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 text-xs text-gray-600">
                <span>Less</span>
                {[0, 0.2, 0.4, 0.6, 0.8, 1.0].map((intensity, idx) => (
                  <div
                    key={idx}
                    className="rounded-sm"
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: getColorForIntensity(intensity),
                    }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
