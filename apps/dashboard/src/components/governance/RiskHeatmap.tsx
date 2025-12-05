/**
 * Risk Heatmap Component (Sprint S59)
 * Displays entity x dimension risk matrix visualization
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  GovernanceRiskHeatmapResponse,
  GovernanceRiskHeatmapCell,
  GovernanceScoreTrend,
} from '@/lib/governanceApi';
import { getEntityTypeLabel } from '@/lib/governanceApi';
import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface RiskHeatmapProps {
  data: GovernanceRiskHeatmapResponse;
  loading?: boolean;
  onCellClick?: (cell: GovernanceRiskHeatmapCell) => void;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-orange-400';
  if (score >= 40) return 'bg-yellow-400';
  if (score >= 20) return 'bg-green-300';
  return 'bg-green-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 60) return 'text-white';
  return 'text-gray-900';
}

function getTrendIcon(trend: GovernanceScoreTrend) {
  switch (trend) {
    case 'worsening':
      return <TrendingUp className="h-3 w-3 text-red-200" />;
    case 'improving':
      return <TrendingDown className="h-3 w-3 text-green-200" />;
    case 'stable':
    default:
      return <Minus className="h-3 w-3 text-gray-400" />;
  }
}

function formatDimensionLabel(dimension: string): string {
  return dimension
    .replace(/_/g, ' ')
    .replace(/risk$/i, '')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function RiskHeatmap({ data, loading, onCellClick, className }: RiskHeatmapProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading risk heatmap...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data.cells || data.cells.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-gray-400" />
            Risk Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No risk data available</p>
          <p className="text-sm text-gray-400 mt-1">Risk scores will appear here once calculated</p>
        </CardContent>
      </Card>
    );
  }

  // Build a lookup map for quick cell access
  const cellMap = new Map<string, GovernanceRiskHeatmapCell>();
  data.cells.forEach((cell) => {
    const key = `${cell.entityType}:${cell.riskDimension}`;
    cellMap.set(key, cell);
  });

  // Sort dimensions for consistent display
  const sortedDimensions = [...data.riskDimensions].sort();

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Risk Heatmap
          </CardTitle>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-400 rounded" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Critical</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                Entity Type
              </th>
              {sortedDimensions.map((dimension) => (
                <th
                  key={dimension}
                  className="p-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]"
                >
                  {formatDimensionLabel(dimension)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.entityTypes.map((entityType) => (
              <tr key={entityType} className="border-t border-gray-100">
                <td className="p-2 text-sm font-medium text-gray-900">
                  {getEntityTypeLabel(entityType)}
                </td>
                {sortedDimensions.map((dimension) => {
                  const cell = cellMap.get(`${entityType}:${dimension}`);

                  if (!cell) {
                    return (
                      <td key={dimension} className="p-2 text-center">
                        <div className="w-12 h-12 mx-auto rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          N/A
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={dimension} className="p-2 text-center">
                      <div
                        className={cn(
                          'w-12 h-12 mx-auto rounded flex flex-col items-center justify-center transition-transform hover:scale-110',
                          getScoreColor(cell.score),
                          getScoreTextColor(cell.score),
                          onCellClick && 'cursor-pointer'
                        )}
                        onClick={() => onCellClick?.(cell)}
                        title={`${getEntityTypeLabel(entityType)} - ${formatDimensionLabel(dimension)}: ${cell.score.toFixed(0)} (${cell.findingsCount} findings)`}
                      >
                        <span className="text-sm font-bold">{cell.score.toFixed(0)}</span>
                        <div className="flex items-center gap-0.5">
                          {getTrendIcon(cell.trend)}
                          {cell.findingsCount > 0 && (
                            <span className="text-[10px] opacity-75">{cell.findingsCount}</span>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

/**
 * Compact Risk Heatmap for Dashboard
 */
interface CompactRiskHeatmapProps {
  data: GovernanceRiskHeatmapResponse;
  maxItems?: number;
  onViewAll?: () => void;
  className?: string;
}

export function CompactRiskHeatmap({
  data,
  maxItems = 10,
  onViewAll,
  className,
}: CompactRiskHeatmapProps) {
  // Get highest risk cells
  const sortedCells = [...data.cells]
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);

  if (sortedCells.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Highest Risk Areas
          </CardTitle>
          {onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedCells.map((cell) => (
            <div
              key={`${cell.entityType}:${cell.riskDimension}`}
              className="flex items-center justify-between p-2 rounded bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-8 h-8 rounded flex items-center justify-center text-sm font-bold',
                    getScoreColor(cell.score),
                    getScoreTextColor(cell.score)
                  )}
                >
                  {cell.score.toFixed(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {getEntityTypeLabel(cell.entityType)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDimensionLabel(cell.riskDimension)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {getTrendIcon(cell.trend)}
                {cell.findingsCount > 0 && (
                  <span>{cell.findingsCount} findings</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
