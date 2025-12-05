/**
 * Executive Dashboard Card Component (Sprint S61)
 * Summary card for each dashboard showing key stats
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  type ExecDashboardWithCounts,
  getTimeWindowLabel,
  getPrimaryFocusLabel,
  formatRelativeTime,
} from '@/lib/executiveCommandCenterApi';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Clock,
  Target,
  Activity,
  FileText,
  Star,
  Archive,
} from 'lucide-react';

interface ExecDashboardCardProps {
  dashboard: ExecDashboardWithCounts;
  isSelected?: boolean;
  onSelect?: (dashboard: ExecDashboardWithCounts) => void;
  className?: string;
}

function getFocusColor(focus: string): string {
  switch (focus) {
    case 'risk':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'reputation':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'growth':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'governance':
      return 'text-purple-600 bg-purple-50 border-purple-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function ExecDashboardCard({
  dashboard,
  isSelected,
  onSelect,
  className,
}: ExecDashboardCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-blue-500 shadow-md',
        dashboard.isArchived && 'opacity-60',
        className
      )}
      onClick={() => onSelect?.(dashboard)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-indigo-100">
              <LayoutDashboard className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 line-clamp-1">
                {dashboard.title}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {dashboard.lastRefreshedAt
                  ? formatRelativeTime(dashboard.lastRefreshedAt)
                  : 'Never refreshed'}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {dashboard.isDefault && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Star className="h-3 w-3 mr-1" />
                Default
              </Badge>
            )}
            {dashboard.isArchived && (
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                <Archive className="h-3 w-3 mr-1" />
                Archived
              </Badge>
            )}
          </div>
        </div>

        {/* Focus & Time Window */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getFocusColor(dashboard.primaryFocus)}>
            <Target className="h-3 w-3 mr-1" />
            {getPrimaryFocusLabel(dashboard.primaryFocus)}
          </Badge>
          <Badge variant="secondary">
            {getTimeWindowLabel(dashboard.timeWindow)}
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 rounded bg-gray-50">
            <div className="text-gray-500">KPIs</div>
            <div className="font-medium text-gray-900">{dashboard.kpisCount}</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-50">
            <div className="text-gray-500">Insights</div>
            <div className="font-medium text-gray-900">{dashboard.insightsCount}</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-50">
            <div className="text-gray-500">Narrative</div>
            <div className="font-medium text-gray-900">
              {dashboard.hasNarrative ? (
                <FileText className="h-4 w-4 mx-auto text-green-600" />
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          </div>
        </div>

        {/* Summary highlights if available */}
        {dashboard.summary && (
          <div className="flex items-center gap-2 pt-2 border-t text-xs text-gray-600">
            <Activity className="h-3 w-3" />
            <span>
              {dashboard.summary.topRisksCount || 0} risks, {dashboard.summary.topOpportunitiesCount || 0} opportunities
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
