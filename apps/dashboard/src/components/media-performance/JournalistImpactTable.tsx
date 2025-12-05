/**
 * JournalistImpactTable Component (Sprint S52)
 * Table showing top-performing journalists with impact scores and metrics
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getScoreColor, getSentimentColor } from '@/lib/mediaPerformanceApi';
import type { TopJournalist } from '@pravado/types';
import { ArrowUpDown, TrendingUp, Award } from 'lucide-react';
import { useState, useMemo } from 'react';

interface JournalistImpactTableProps {
  journalists: TopJournalist[];
  title?: string;
  onJournalistClick?: (journalist: TopJournalist) => void;
  className?: string;
  maxRows?: number;
}

type SortField = 'impactScore' | 'mentionCount' | 'avgSentiment';
type SortDirection = 'asc' | 'desc';

export function JournalistImpactTable({
  journalists,
  title = 'Top Journalists',
  onJournalistClick,
  className,
  maxRows = 10,
}: JournalistImpactTableProps) {
  const [sortField, setSortField] = useState<SortField>('impactScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedJournalists = useMemo(() => {
    return [...journalists]
      .sort((a, b) => {
        let aVal = 0;
        let bVal = 0;

        switch (sortField) {
          case 'impactScore':
            aVal = a.impactScore;
            bVal = b.impactScore;
            break;
          case 'mentionCount':
            aVal = a.mentionCount;
            bVal = b.mentionCount;
            break;
          case 'avgSentiment':
            aVal = a.avgSentiment;
            bVal = b.avgSentiment;
            break;
        }

        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      })
      .slice(0, maxRows);
  }, [journalists, sortField, sortDirection, maxRows]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />;
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {journalists.length} total
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {journalists.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
            No journalist data available
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="pb-2 pr-2 font-medium text-gray-600">Rank</th>
                  <th className="pb-2 px-2 font-medium text-gray-600">Journalist</th>
                  <th
                    className="pb-2 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('impactScore')}
                  >
                    <div className="flex items-center gap-1">
                      Impact {getSortIcon('impactScore')}
                    </div>
                  </th>
                  <th
                    className="pb-2 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('mentionCount')}
                  >
                    <div className="flex items-center gap-1">
                      Mentions {getSortIcon('mentionCount')}
                    </div>
                  </th>
                  <th
                    className="pb-2 px-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                    onClick={() => handleSort('avgSentiment')}
                  >
                    <div className="flex items-center gap-1">
                      Sentiment {getSortIcon('avgSentiment')}
                    </div>
                  </th>
                  <th className="pb-2 pl-2 font-medium text-gray-600">Tier</th>
                </tr>
              </thead>
              <tbody>
                {sortedJournalists.map((journalist, idx) => {
                  const impactColor = getScoreColor(journalist.impactScore);
                  const sentimentColor = getSentimentColor(journalist.avgSentiment);

                  return (
                    <tr
                      key={journalist.journalistId}
                      className={cn(
                        'border-b last:border-0 hover:bg-gray-50 transition-colors',
                        onJournalistClick && 'cursor-pointer'
                      )}
                      onClick={() => onJournalistClick?.(journalist)}
                    >
                      {/* Rank */}
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-1">
                          {idx === 0 && <Award className="h-4 w-4 text-yellow-500" />}
                          <span className="text-gray-600 font-medium">#{idx + 1}</span>
                        </div>
                      </td>

                      {/* Journalist Name */}
                      <td className="py-3 px-2">
                        <div className="font-medium text-gray-900 truncate max-w-xs">
                          {journalist.journalistName}
                        </div>
                      </td>

                      {/* Impact Score */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs font-semibold',
                              impactColor === 'green' && 'bg-green-100 text-green-800 border-green-200',
                              impactColor === 'blue' && 'bg-blue-100 text-blue-800 border-blue-200',
                              impactColor === 'yellow' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                              impactColor === 'red' && 'bg-red-100 text-red-800 border-red-200',
                              impactColor === 'gray' && 'bg-gray-100 text-gray-800 border-gray-200'
                            )}
                          >
                            {journalist.impactScore.toFixed(0)}
                          </Badge>
                          {journalist.impactScore >= 80 && (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          )}
                        </div>
                      </td>

                      {/* Mention Count */}
                      <td className="py-3 px-2">
                        <span className="font-medium text-gray-900">
                          {journalist.mentionCount}
                        </span>
                      </td>

                      {/* Sentiment */}
                      <td className="py-3 px-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            sentimentColor === 'green' && 'bg-green-100 text-green-800 border-green-200',
                            sentimentColor === 'blue' && 'bg-blue-100 text-blue-800 border-blue-200',
                            sentimentColor === 'yellow' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
                            sentimentColor === 'orange' && 'bg-orange-100 text-orange-800 border-orange-200',
                            sentimentColor === 'red' && 'bg-red-100 text-red-800 border-red-200',
                            sentimentColor === 'gray' && 'bg-gray-100 text-gray-800 border-gray-200'
                          )}
                        >
                          {((journalist.avgSentiment + 1) * 50).toFixed(0)}%
                        </Badge>
                      </td>

                      {/* Tier */}
                      <td className="py-3 pl-2">
                        {journalist.outletTier && (
                          <Badge variant="secondary" className="text-xs">
                            {journalist.outletTier}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Footer */}
        {journalists.length > maxRows && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-600 text-center">
            Showing top {maxRows} of {journalists.length} journalists
          </div>
        )}
      </CardContent>
    </Card>
  );
}
