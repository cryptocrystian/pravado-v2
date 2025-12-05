/**
 * CompetitorComparisonTable Component (Sprint S56)
 * Displays brand vs competitor reputation comparison
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getScoreColor,
  getTrendColor,
  formatRank,
  formatRankChange,
} from '@/lib/brandReputationApi';
import { cn } from '@/lib/utils';
import type { CompetitorReputationComparison } from '@pravado/types';
import { Users, ArrowUp, ArrowDown, Minus, Trophy, Target } from 'lucide-react';

interface CompetitorComparisonTableProps {
  brandScore: number;
  competitors: CompetitorReputationComparison[];
  brandRank: number;
  className?: string;
}

export function CompetitorComparisonTable({
  brandScore,
  competitors,
  brandRank,
  className,
}: CompetitorComparisonTableProps) {
  // Sort competitors by score descending
  const sortedCompetitors = [...competitors].sort(
    (a, b) => b.competitorScore - a.competitorScore
  );

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-600">
              Competitive Position
            </CardTitle>
          </div>
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            <Trophy className="h-3 w-3 mr-1" />
            Rank: {formatRank(brandRank)} of {competitors.length + 1}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Brand Score Header */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Your Brand</span>
            </div>
            <span className={cn('text-xl font-bold', getScoreColor(brandScore))}>
              {brandScore.toFixed(0)}
            </span>
          </div>
        </div>

        {/* Competitors Table */}
        {sortedCompetitors.length === 0 ? (
          <p className="text-sm text-gray-500 italic text-center py-4">
            No competitors being tracked
          </p>
        ) : (
          <div className="space-y-3">
            {sortedCompetitors.map((comp) => {
              const scoreColorClass = getScoreColor(comp.competitorScore);
              const trendColorClass = getTrendColor(comp.competitorTrend);
              const deltaColorClass =
                comp.scoreDelta > 0
                  ? 'text-green-600'
                  : comp.scoreDelta < 0
                  ? 'text-red-600'
                  : 'text-gray-600';
              const { text: rankChangeText, colorClass: rankChangeColorClass } = formatRankChange(
                comp.rankChange
              );

              return (
                <div
                  key={comp.competitorId}
                  className="p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        #{comp.rank} {comp.competitorName}
                      </span>
                      <span className={cn('text-xs', rankChangeColorClass)}>
                        ({rankChangeText})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-lg font-bold', scoreColorClass)}>
                        {comp.competitorScore.toFixed(0)}
                      </span>
                      <div className="flex items-center">
                        {comp.competitorTrend === 'up' && (
                          <ArrowUp className={cn('h-3 w-3', trendColorClass)} />
                        )}
                        {comp.competitorTrend === 'down' && (
                          <ArrowDown className={cn('h-3 w-3', trendColorClass)} />
                        )}
                        {comp.competitorTrend === 'flat' && (
                          <Minus className={cn('h-3 w-3', trendColorClass)} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Delta */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-500">vs Your Brand:</span>
                    <span className={cn('font-medium', deltaColorClass)}>
                      {comp.scoreDelta > 0 ? '+' : ''}
                      {comp.scoreDelta.toFixed(1)} pts
                      {comp.scoreDelta > 0 ? ' ahead' : comp.scoreDelta < 0 ? ' behind' : ''}
                    </span>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t">
                    {comp.strengths.slice(0, 2).map((strength, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700"
                      >
                        +{strength}
                      </Badge>
                    ))}
                    {comp.weaknesses.slice(0, 2).map((weakness, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-xs bg-red-50 text-red-700"
                      >
                        -{weakness}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
