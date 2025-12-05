/**
 * PersonaHistoryTimeline Component (Sprint S51.2)
 * Displays persona history as a vertical timeline with change indicators
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { AudiencePersonaHistory } from '@pravado/types';
import { cn } from '@/lib/utils';
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  GitBranch,
  TrendingUp,
  User,
} from 'lucide-react';
import { useState } from 'react';

interface PersonaHistoryTimelineProps {
  history: AudiencePersonaHistory[];
  onSnapshotClick?: (snapshot: AudiencePersonaHistory) => void;
}

export function PersonaHistoryTimeline({
  history,
  onSnapshotClick,
}: PersonaHistoryTimelineProps) {
  const [dateFilter, setDateFilter] = useState<'all' | '7d' | '30d' | '90d'>('all');

  // Filter by date
  const filteredHistory = history.filter((snapshot) => {
    if (dateFilter === 'all') return true;
    if (!snapshot.snapshotAt) return true;
    const snapshotDate = new Date(snapshot.snapshotAt);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - snapshotDate.getTime()) / 86400000);

    switch (dateFilter) {
      case '7d':
        return daysDiff <= 7;
      case '30d':
        return daysDiff <= 30;
      case '90d':
        return daysDiff <= 90;
      default:
        return true;
    }
  });

  // Sort by date descending (newest first)
  const sortedHistory = [...filteredHistory].sort(
    (a, b) => new Date(b.snapshotAt || b.createdAt).getTime() - new Date(a.snapshotAt || a.createdAt).getTime()
  );

  // Snapshot type colors
  const snapshotTypeColors: Record<string, string> = {
    manual_update: 'bg-blue-100 text-blue-800 border-blue-200',
    trait_added: 'bg-green-100 text-green-800 border-green-200',
    insight_added: 'bg-purple-100 text-purple-800 border-purple-200',
    score_update: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    enrichment: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    merge: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const snapshotTypeIcons: Record<string, any> = {
    manual_update: User,
    trait_added: TrendingUp,
    insight_added: TrendingUp,
    score_update: TrendingUp,
    enrichment: GitBranch,
    merge: GitBranch,
  };

  // Change magnitude color
  const getMagnitudeColor = (magnitude: number): string => {
    if (magnitude >= 0.7) return 'text-red-600';
    if (magnitude >= 0.4) return 'text-yellow-600';
    if (magnitude >= 0.1) return 'text-blue-600';
    return 'text-gray-500';
  };

  const getMagnitudeBadge = (magnitude: number): string => {
    if (magnitude >= 0.7) return 'Major';
    if (magnitude >= 0.4) return 'Moderate';
    if (magnitude >= 0.1) return 'Minor';
    return 'Minimal';
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Score diff indicator
  const ScoreDiff = ({ field, before, after }: { field: string; before?: number; after?: number }) => {
    if (before === undefined || after === undefined || before === after) return null;

    const diff = after - before;
    const Icon = diff > 0 ? ArrowUp : diff < 0 ? ArrowDown : ArrowRight;
    const color = diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-500';

    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-gray-600">{field}:</span>
        <span className={cn('font-medium', color)}>
          {before.toFixed(0)} → {after.toFixed(0)}
        </span>
        <Icon className={cn('h-3 w-3', color)} />
        <span className={cn('font-medium', color)}>
          {diff > 0 ? '+' : ''}
          {diff.toFixed(1)}
        </span>
      </div>
    );
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No history available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Date Filter */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{history.length}</span> snapshots
        </div>
        <div className="flex items-center gap-2">
          {(['all', '7d', '30d', '90d'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={cn(
                'text-xs px-3 py-1 rounded-full border transition-colors',
                dateFilter === filter
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              )}
            >
              {filter === 'all' ? 'All' : filter.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Snapshots */}
        <div className="space-y-6">
          {sortedHistory.map((snapshot, idx) => {
            const SnapshotIcon = snapshotTypeIcons[snapshot.snapshotType] || TrendingUp;
            const isFirst = idx === 0;

            return (
              <div key={snapshot.id} className="relative pl-12">
                {/* Timeline dot */}
                <div
                  className={cn(
                    'absolute left-2 top-2 h-5 w-5 rounded-full border-2 flex items-center justify-center',
                    isFirst ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                  )}
                >
                  <SnapshotIcon className={cn('h-3 w-3', isFirst ? 'text-white' : 'text-gray-500')} />
                </div>

                {/* Snapshot card */}
                <Card
                  className={cn(
                    'transition-all',
                    onSnapshotClick && 'cursor-pointer hover:shadow-md',
                    isFirst && 'border-blue-200 shadow-sm'
                  )}
                  onClick={() => onSnapshotClick?.(snapshot)}
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn('text-xs', snapshotTypeColors[snapshot.snapshotType])}
                          >
                            {snapshot.snapshotType.replace(/_/g, ' ')}
                          </Badge>
                          {snapshot.changeMagnitude !== null && snapshot.changeMagnitude !== undefined && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                getMagnitudeColor(snapshot.changeMagnitude)
                              )}
                            >
                              {getMagnitudeBadge(snapshot.changeMagnitude)} Change
                            </Badge>
                          )}
                          {isFirst && (
                            <Badge variant="default" className="text-xs bg-blue-500">
                              Latest
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {formatDate(snapshot.snapshotAt || snapshot.createdAt)}
                          {snapshot.triggeredBy && (
                            <>
                              <span className="text-gray-400">•</span>
                              <User className="h-3 w-3" />
                              {snapshot.triggeredBy}
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Change Description */}
                    {snapshot.changeDescription && (
                      <p className="text-sm text-gray-700">{snapshot.changeDescription}</p>
                    )}

                    {/* Score Diffs */}
                    {snapshot.previousSnapshot && (
                      <div className="space-y-1 pt-2 border-t">
                        <ScoreDiff
                          field="Overall"
                          before={snapshot.previousSnapshot.overallScore}
                          after={snapshot.snapshotData.overallScore}
                        />
                        <ScoreDiff
                          field="Relevance"
                          before={snapshot.previousSnapshot.relevanceScore}
                          after={snapshot.snapshotData.relevanceScore}
                        />
                        <ScoreDiff
                          field="Engagement"
                          before={snapshot.previousSnapshot.engagementScore}
                          after={snapshot.snapshotData.engagementScore}
                        />
                        <ScoreDiff
                          field="Alignment"
                          before={snapshot.previousSnapshot.alignmentScore}
                          after={snapshot.snapshotData.alignmentScore}
                        />
                      </div>
                    )}

                    {/* Snapshot Data Summary */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">
                          {snapshot.snapshotData.overallScore?.toFixed(0) || 'N/A'}
                        </div>
                        <div className="text-gray-500">Overall</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">
                          {snapshot.snapshotData.traitCount || 0}
                        </div>
                        <div className="text-gray-500">Traits</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900">
                          {snapshot.snapshotData.insightCount || 0}
                        </div>
                        <div className="text-gray-500">Insights</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
