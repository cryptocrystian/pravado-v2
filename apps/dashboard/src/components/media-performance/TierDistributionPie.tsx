/**
 * TierDistributionPie Component (Sprint S52)
 * Pie chart showing media outlet tier distribution with quality scores
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TierDistribution } from '@pravado/types';
import { useMemo } from 'react';

interface TierDistributionPieProps {
  distribution: TierDistribution;
  title?: string;
  totalMentions?: number;
  className?: string;
  size?: number;
}

export function TierDistributionPie({
  distribution,
  title = 'Outlet Tier Distribution',
  totalMentions,
  className,
  size = 200,
}: TierDistributionPieProps) {
  const { segments, total, tierPercentages } = useMemo(() => {
    const totalCount =
      distribution.tier1 +
      distribution.tier2 +
      distribution.tier3 +
      distribution.tier4 +
      distribution.unknown;

    if (totalCount === 0) {
      return { segments: [], total: 0, tierPercentages: [] };
    }

    const tiers = [
      {
        name: 'Tier 1',
        value: distribution.tier1,
        color: '#22c55e',
        quality: 'Premium',
      },
      {
        name: 'Tier 2',
        value: distribution.tier2,
        color: '#3b82f6',
        quality: 'High',
      },
      {
        name: 'Tier 3',
        value: distribution.tier3,
        color: '#f59e0b',
        quality: 'Medium',
      },
      {
        name: 'Tier 4',
        value: distribution.tier4,
        color: '#ef4444',
        quality: 'Low',
      },
      {
        name: 'Unknown',
        value: distribution.unknown,
        color: '#9ca3af',
        quality: 'Unknown',
      },
    ].filter((tier) => tier.value > 0);

    // Calculate pie segments
    let currentAngle = -90; // Start at top
    const pieSegments = tiers.map((tier) => {
      const percentage = (tier.value / totalCount) * 100;
      const angle = (percentage / 100) * 360;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Calculate arc path
      const radius = size / 2 - 10;
      const centerX = size / 2;
      const centerY = size / 2;

      const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const path = `
        M ${centerX} ${centerY}
        L ${startX} ${startY}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}
        Z
      `;

      currentAngle = endAngle;

      return {
        ...tier,
        percentage,
        path,
        startAngle,
        endAngle,
      };
    });

    const percentages = tiers.map((tier) => ({
      name: tier.name,
      percentage: (tier.value / totalCount) * 100,
      value: tier.value,
      color: tier.color,
      quality: tier.quality,
    }));

    return {
      segments: pieSegments,
      total: totalCount,
      tierPercentages: percentages,
    };
  }, [distribution, size]);

  // Calculate quality score (weighted by tier)
  const qualityScore = useMemo(() => {
    if (total === 0) return 0;
    const weighted =
      (distribution.tier1 * 1.0 +
        distribution.tier2 * 0.7 +
        distribution.tier3 * 0.4 +
        distribution.tier4 * 0.2) /
      total;
    return Math.round(weighted * 100);
  }, [distribution, total]);

  const qualityColor =
    qualityScore >= 80
      ? 'green'
      : qualityScore >= 60
      ? 'blue'
      : qualityScore >= 40
      ? 'yellow'
      : 'red';

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              qualityColor === 'green' && 'bg-green-100 text-green-800 border-green-200',
              qualityColor === 'blue' && 'bg-blue-100 text-blue-800 border-blue-200',
              qualityColor === 'yellow' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
              qualityColor === 'red' && 'bg-red-100 text-red-800 border-red-200'
            )}
          >
            Quality: {qualityScore}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            No tier distribution data available
          </div>
        ) : (
          <div className="flex items-center gap-6">
            {/* Pie Chart */}
            <div className="flex-shrink-0">
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Pie segments */}
                {segments.map((segment, idx) => (
                  <g key={idx}>
                    <path
                      d={segment.path}
                      fill={segment.color}
                      stroke="white"
                      strokeWidth="2"
                    >
                      <title>
                        {segment.name}: {segment.value} ({segment.percentage.toFixed(1)}%)
                      </title>
                    </path>
                  </g>
                ))}

                {/* Center circle (donut) */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={size / 4}
                  fill="white"
                  stroke="white"
                  strokeWidth="2"
                />

                {/* Center text */}
                <text
                  x={size / 2}
                  y={size / 2 - 5}
                  textAnchor="middle"
                  fontSize="20"
                  fontWeight="bold"
                  fill="#374151"
                >
                  {total}
                </text>
                <text
                  x={size / 2}
                  y={size / 2 + 12}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {totalMentions !== undefined ? 'outlets' : 'total'}
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2">
              {tierPercentages.map((tier, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="text-gray-700 font-medium">{tier.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {tier.quality}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 font-medium">{tier.value}</span>
                    <span className="text-gray-500 text-xs w-12 text-right">
                      {tier.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {totalMentions !== undefined && totalMentions > 0 && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>Total Mentions:</span>
              <span className="font-semibold text-gray-900">{totalMentions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Outlets Covered:</span>
              <span className="font-semibold text-gray-900">{total}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
