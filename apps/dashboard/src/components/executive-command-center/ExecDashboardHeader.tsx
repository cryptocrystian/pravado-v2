/**
 * Executive Dashboard Header Component (Sprint S61)
 * Header with title, focus badge, quick stats, and last refresh time
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type ExecDashboard,
  type ExecDashboardWithCounts,
  getPrimaryFocusLabel,
  getTimeWindowLabel,
  formatRelativeTime,
} from '@/lib/executiveCommandCenterApi';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Clock,
  Target,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  FileText,
  Lightbulb,
  Star,
  Edit,
  MoreVertical,
} from 'lucide-react';

interface ExecDashboardHeaderProps {
  dashboard: ExecDashboard | ExecDashboardWithCounts;
  kpisCount?: number;
  insightsCount?: number;
  risksCount?: number;
  opportunitiesCount?: number;
  hasNarrative?: boolean;
  onEdit?: () => void;
  onSetDefault?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
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

export function ExecDashboardHeader({
  dashboard,
  kpisCount,
  insightsCount,
  risksCount,
  opportunitiesCount,
  hasNarrative,
  onEdit,
  onSetDefault,
  onArchive,
  onDelete,
  className,
}: ExecDashboardHeaderProps) {
  // Handle both ExecDashboard and ExecDashboardWithCounts
  const resolvedKpisCount = kpisCount ?? (dashboard as ExecDashboardWithCounts).kpisCount ?? 0;
  const resolvedInsightsCount = insightsCount ?? (dashboard as ExecDashboardWithCounts).insightsCount ?? 0;
  const resolvedHasNarrative = hasNarrative ?? (dashboard as ExecDashboardWithCounts).hasNarrative ?? false;
  const summary = (dashboard as ExecDashboardWithCounts).summary;
  const resolvedRisksCount = risksCount ?? summary?.topRisksCount ?? 0;
  const resolvedOpportunitiesCount = opportunitiesCount ?? summary?.topOpportunitiesCount ?? 0;

  return (
    <div className={cn('bg-white rounded-lg border shadow-sm', className)}>
      <div className="p-6">
        {/* Top Row: Title and Actions */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {dashboard.title}
                </h1>
                {dashboard.isDefault && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    <Star className="h-3 w-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              {dashboard.description && (
                <p className="text-gray-600 mt-1">{dashboard.description}</p>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          {(onEdit || onSetDefault || onArchive || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Dashboard
                  </DropdownMenuItem>
                )}
                {onSetDefault && !dashboard.isDefault && (
                  <DropdownMenuItem onClick={onSetDefault}>
                    <Star className="h-4 w-4 mr-2" />
                    Set as Default
                  </DropdownMenuItem>
                )}
                {(onEdit || onSetDefault) && (onArchive || onDelete) && (
                  <DropdownMenuSeparator />
                )}
                {onArchive && !dashboard.isArchived && (
                  <DropdownMenuItem onClick={onArchive} className="text-yellow-600">
                    Archive Dashboard
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-red-600">
                    Delete Dashboard
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Meta Info Row */}
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Badge variant="outline" className={cn('text-sm', getFocusColor(dashboard.primaryFocus))}>
            <Target className="h-3 w-3 mr-1" />
            {getPrimaryFocusLabel(dashboard.primaryFocus)}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Clock className="h-3 w-3 mr-1" />
            {getTimeWindowLabel(dashboard.timeWindow)}
          </Badge>
          {dashboard.lastRefreshedAt && (
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last refreshed {formatRelativeTime(dashboard.lastRefreshedAt)}
            </span>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{resolvedKpisCount}</div>
              <div className="text-xs text-gray-500">KPIs</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">{resolvedInsightsCount}</div>
              <div className="text-xs text-gray-500">Insights</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <div className="text-2xl font-bold text-red-600">{resolvedRisksCount}</div>
              <div className="text-xs text-gray-500">Risks</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-2xl font-bold text-green-600">{resolvedOpportunitiesCount}</div>
              <div className="text-xs text-gray-500">Opportunities</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50">
            <FileText className="h-5 w-5 text-purple-500" />
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {resolvedHasNarrative ? 'Yes' : 'No'}
              </div>
              <div className="text-xs text-gray-500">Narrative</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
