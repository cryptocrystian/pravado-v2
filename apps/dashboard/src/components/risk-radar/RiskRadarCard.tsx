/**
 * Risk Radar Card Component (Sprint S60)
 * Card for displaying snapshot summary in a grid or list
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskLevelBadge } from './RiskLevelBadge';
import type { RiskRadarSnapshot } from '@/lib/riskRadarApi';
import { formatRelativeTime } from '@/lib/riskRadarApi';
import { Radar, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

interface RiskRadarCardProps {
  snapshot: RiskRadarSnapshot;
  isActive?: boolean;
  onSelect?: (snapshot: RiskRadarSnapshot) => void;
  className?: string;
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'critical':
      return 'text-red-600';
    case 'high':
      return 'text-orange-600';
    case 'medium':
      return 'text-yellow-600';
    case 'low':
    default:
      return 'text-green-600';
  }
}

function getRiskBgColor(level: string): string {
  switch (level) {
    case 'critical':
      return 'bg-red-50 border-red-200';
    case 'high':
      return 'bg-orange-50 border-orange-200';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200';
    case 'low':
    default:
      return 'bg-green-50 border-green-200';
  }
}

export function RiskRadarCard({ snapshot, isActive, onSelect, className }: RiskRadarCardProps) {
  const hasEmergingRisks = snapshot.emergingRisks && snapshot.emergingRisks.length > 0;
  const concernsCount = snapshot.keyConcerns?.length || 0;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isActive && 'ring-2 ring-blue-500 shadow-md',
        getRiskBgColor(snapshot.riskLevel),
        className
      )}
      onClick={() => onSelect?.(snapshot)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with Risk Index */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-full', snapshot.riskLevel === 'critical' ? 'bg-red-100' : 'bg-gray-100')}>
              <Radar className={cn('h-5 w-5', getRiskColor(snapshot.riskLevel))} />
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {snapshot.title || `Snapshot #${snapshot.id.slice(0, 8)}`}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(snapshot.snapshotDate)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={cn('text-2xl font-bold', getRiskColor(snapshot.riskLevel))}>
              {snapshot.overallRiskIndex}
            </div>
            <div className="text-xs text-gray-500">/ 100</div>
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className="flex items-center gap-2">
          <RiskLevelBadge level={snapshot.riskLevel} />
          {snapshot.isActive && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
          {hasEmergingRisks && (
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <TrendingUp className="h-3 w-3 mr-1" />
              Emerging
            </Badge>
          )}
        </div>

        {/* Component Scores Summary */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          {snapshot.sentimentScore !== undefined && (
            <div className="text-center p-1 rounded bg-white/50">
              <div className="text-gray-500">Sentiment</div>
              <div className={cn('font-medium', snapshot.sentimentScore > 60 ? 'text-red-600' : 'text-green-600')}>
                {snapshot.sentimentScore}
              </div>
            </div>
          )}
          {snapshot.alertScore !== undefined && (
            <div className="text-center p-1 rounded bg-white/50">
              <div className="text-gray-500">Alerts</div>
              <div className={cn('font-medium', snapshot.alertScore > 60 ? 'text-red-600' : 'text-green-600')}>
                {snapshot.alertScore}
              </div>
            </div>
          )}
          {snapshot.governanceScore !== undefined && (
            <div className="text-center p-1 rounded bg-white/50">
              <div className="text-gray-500">Governance</div>
              <div className={cn('font-medium', snapshot.governanceScore > 60 ? 'text-red-600' : 'text-green-600')}>
                {snapshot.governanceScore}
              </div>
            </div>
          )}
        </div>

        {/* Concerns Count */}
        {concernsCount > 0 && (
          <div className="text-xs text-gray-600 pt-1 border-t border-gray-200">
            {concernsCount} key concern{concernsCount !== 1 ? 's' : ''} identified
          </div>
        )}
      </CardContent>
    </Card>
  );
}
