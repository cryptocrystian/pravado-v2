/**
 * Executive Filter Bar Component (Sprint S61)
 * Controls for time_window, primary_focus, and dashboard filters
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type ExecDashboardTimeWindow,
  type ExecDashboardPrimaryFocus,
  getTimeWindowLabel,
  getPrimaryFocusLabel,
} from '@/lib/executiveCommandCenterApi';
import { cn } from '@/lib/utils';
import {
  Clock,
  Target,
  RefreshCw,
  Loader2,
  Plus,
  Settings,
} from 'lucide-react';

interface ExecFilterBarProps {
  timeWindow: ExecDashboardTimeWindow;
  primaryFocus: ExecDashboardPrimaryFocus;
  onTimeWindowChange?: (value: ExecDashboardTimeWindow) => void;
  onPrimaryFocusChange?: (value: ExecDashboardPrimaryFocus) => void;
  onRefresh?: () => void;
  onCreateDashboard?: () => void;
  onManageDashboards?: () => void;
  refreshing?: boolean;
  disabled?: boolean;
  showCreateButton?: boolean;
  showManageButton?: boolean;
  className?: string;
}

const TIME_WINDOWS: ExecDashboardTimeWindow[] = ['24h', '7d', '30d', '90d'];
const PRIMARY_FOCUSES: ExecDashboardPrimaryFocus[] = [
  'mixed',
  'risk',
  'reputation',
  'growth',
  'governance',
];

function getFocusColor(focus: ExecDashboardPrimaryFocus): string {
  switch (focus) {
    case 'risk':
      return 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100';
    case 'reputation':
      return 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100';
    case 'growth':
      return 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100';
    case 'governance':
      return 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100';
  }
}

export function ExecFilterBar({
  timeWindow,
  primaryFocus,
  onTimeWindowChange,
  onPrimaryFocusChange,
  onRefresh,
  onCreateDashboard,
  onManageDashboards,
  refreshing,
  disabled,
  showCreateButton = true,
  showManageButton = true,
  className,
}: ExecFilterBarProps) {
  return (
    <Card className={cn('bg-white/80 backdrop-blur-sm', className)}>
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Time Window Selector */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <Select
              value={timeWindow}
              onValueChange={onTimeWindowChange as (value: string) => void}
              disabled={disabled}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_WINDOWS.map((tw) => (
                  <SelectItem key={tw} value={tw}>
                    {getTimeWindowLabel(tw)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Primary Focus Selector */}
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-gray-500" />
            <div className="flex gap-1">
              {PRIMARY_FOCUSES.map((focus) => (
                <Button
                  key={focus}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 px-3',
                    primaryFocus === focus && getFocusColor(focus),
                    primaryFocus !== focus && 'bg-white hover:bg-gray-50'
                  )}
                  onClick={() => onPrimaryFocusChange?.(focus)}
                  disabled={disabled}
                >
                  {getPrimaryFocusLabel(focus).replace(' Overview', '').replace(' Management', '')}
                </Button>
              ))}
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {showManageButton && onManageDashboards && (
              <Button
                variant="outline"
                size="sm"
                onClick={onManageDashboards}
                disabled={disabled}
              >
                <Settings className="h-4 w-4 mr-1" />
                Manage
              </Button>
            )}

            {showCreateButton && onCreateDashboard && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateDashboard}
                disabled={disabled}
              >
                <Plus className="h-4 w-4 mr-1" />
                New Dashboard
              </Button>
            )}

            {onRefresh && (
              <Button
                variant="default"
                size="sm"
                onClick={onRefresh}
                disabled={disabled || refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Refresh Data
              </Button>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(timeWindow !== '7d' || primaryFocus !== 'mixed') && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t">
            <span className="text-xs text-gray-500">Active filters:</span>
            {timeWindow !== '7d' && (
              <Badge variant="secondary" className="text-xs">
                {getTimeWindowLabel(timeWindow)}
              </Badge>
            )}
            {primaryFocus !== 'mixed' && (
              <Badge
                variant="outline"
                className={cn('text-xs', getFocusColor(primaryFocus))}
              >
                {getPrimaryFocusLabel(primaryFocus)}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                onTimeWindowChange?.('7d');
                onPrimaryFocusChange?.('mixed');
              }}
              disabled={disabled}
            >
              Clear all
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
