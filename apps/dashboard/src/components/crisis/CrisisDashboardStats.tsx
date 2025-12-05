/**
 * CrisisDashboardStats Component (Sprint S55)
 *
 * Displays crisis dashboard statistics with key metrics,
 * severity distribution, and recent activity
 */

'use client';

import React from 'react';
import {
  AlertTriangle,
  Bell,
  ListTodo,
  ArrowUpRight,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  RefreshCw,
} from 'lucide-react';
import type { CrisisDashboardStats, CrisisSeverity, CrisisTrajectory } from '@pravado/types';
import { SEVERITY_COLORS, TRAJECTORY_COLORS, formatTimeAgo } from '@/lib/crisisApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CrisisDashboardStatsProps {
  stats: CrisisDashboardStats | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  onNavigateToIncidents?: () => void;
  onNavigateToSignals?: () => void;
  onNavigateToActions?: () => void;
  className?: string;
}

const SEVERITY_ORDER: CrisisSeverity[] = ['severe', 'critical', 'high', 'medium', 'low'];
const TRAJECTORY_ORDER: CrisisTrajectory[] = [
  'critical',
  'worsening',
  'stable',
  'improving',
  'resolved',
  'unknown',
];

export default function CrisisDashboardStats({
  stats,
  isLoading = false,
  onRefresh,
  onNavigateToIncidents,
  onNavigateToSignals,
  onNavigateToActions,
  className = '',
}: CrisisDashboardStatsProps) {
  // Calculate totals
  const totalBySeverity = stats
    ? Object.values(stats.bySeverity).reduce((a, b) => a + b, 0)
    : 0;

  const getTrajectoryIcon = (trajectory: CrisisTrajectory) => {
    switch (trajectory) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'worsening':
      case 'critical':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (!stats && !isLoading) {
    return (
      <Card className={cn('flex items-center justify-center min-h-[200px]', className)}>
        <div className="text-center text-muted-foreground">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No crisis data available</p>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Refresh Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5 text-red-600" />
          Crisis Dashboard
        </h2>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        )}
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Incidents */}
        <Card
          className={cn(
            'cursor-pointer hover:shadow-md transition-shadow',
            stats?.activeIncidents && stats.activeIncidents > 0 && 'border-red-200'
          )}
          onClick={onNavigateToIncidents}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Incidents</p>
                <p
                  className={cn(
                    'text-3xl font-bold',
                    stats?.activeIncidents && stats.activeIncidents > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  )}
                >
                  {isLoading ? '-' : stats?.activeIncidents || 0}
                </p>
              </div>
              <AlertTriangle
                className={cn(
                  'h-8 w-8',
                  stats?.activeIncidents && stats.activeIncidents > 0
                    ? 'text-red-500'
                    : 'text-gray-300'
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Active Signals */}
        <Card
          className={cn(
            'cursor-pointer hover:shadow-md transition-shadow',
            stats?.activeSignals && stats.activeSignals > 0 && 'border-orange-200'
          )}
          onClick={onNavigateToSignals}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Signals</p>
                <p
                  className={cn(
                    'text-3xl font-bold',
                    stats?.activeSignals && stats.activeSignals > 0
                      ? 'text-orange-600'
                      : 'text-gray-600'
                  )}
                >
                  {isLoading ? '-' : stats?.activeSignals || 0}
                </p>
              </div>
              <Bell
                className={cn(
                  'h-8 w-8',
                  stats?.activeSignals && stats.activeSignals > 0
                    ? 'text-orange-500'
                    : 'text-gray-300'
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pending Actions */}
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={onNavigateToActions}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Actions</p>
                <p className="text-3xl font-bold text-blue-600">
                  {isLoading ? '-' : stats?.pendingActions || 0}
                </p>
              </div>
              <ListTodo className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {/* Escalated */}
        <Card
          className={cn(
            stats?.escalatedCount && stats.escalatedCount > 0 && 'border-red-300 bg-red-50/30'
          )}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Escalated</p>
                <p
                  className={cn(
                    'text-3xl font-bold',
                    stats?.escalatedCount && stats.escalatedCount > 0
                      ? 'text-red-700'
                      : 'text-gray-600'
                  )}
                >
                  {isLoading ? '-' : stats?.escalatedCount || 0}
                </p>
              </div>
              <ArrowUpRight
                className={cn(
                  'h-8 w-8',
                  stats?.escalatedCount && stats.escalatedCount > 0
                    ? 'text-red-600'
                    : 'text-gray-300'
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Severity Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Severity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-6 bg-gray-100 rounded" />
                ))}
              </div>
            ) : (
              SEVERITY_ORDER.map((severity) => {
                const count = stats?.bySeverity[severity] || 0;
                const percentage = totalBySeverity > 0 ? (count / totalBySeverity) * 100 : 0;
                const colors = SEVERITY_COLORS[severity];

                return (
                  <div key={severity} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn('capitalize font-medium', colors.text)}>
                        {severity}
                      </span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2"
                      style={
                        {
                          '--progress-bg': colors.bg.replace('bg-', ''),
                        } as React.CSSProperties
                      }
                    />
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Trajectory Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">By Trajectory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-gray-100 rounded" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {TRAJECTORY_ORDER.filter(
                  (t) => (stats?.byTrajectory[t] || 0) > 0
                ).map((trajectory) => {
                  const count = stats?.byTrajectory[trajectory] || 0;
                  const colors = TRAJECTORY_COLORS[trajectory];

                  return (
                    <div
                      key={trajectory}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg',
                        colors.bg
                      )}
                    >
                      {getTrajectoryIcon(trajectory)}
                      <span className={cn('text-sm capitalize', colors.text)}>
                        {trajectory}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {count}
                      </Badge>
                    </div>
                  );
                })}
                {TRAJECTORY_ORDER.every(
                  (t) => (stats?.byTrajectory[t] || 0) === 0
                ) && (
                  <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
                    No trajectory data
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[200px] px-4 pb-4">
            {isLoading ? (
              <div className="animate-pulse space-y-3 pt-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-3 pt-2">
                {stats.recentActivity.map((activity, idx) => {
                  const severityColors = activity.severity
                    ? SEVERITY_COLORS[activity.severity]
                    : null;

                  return (
                    <div key={idx} className="flex gap-3 items-start">
                      <div
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                          activity.type === 'incident' && 'bg-red-100',
                          activity.type === 'signal' && 'bg-orange-100',
                          activity.type === 'action' && 'bg-blue-100',
                          activity.type === 'brief' && 'bg-purple-100',
                          activity.type === 'escalation' && 'bg-red-200'
                        )}
                      >
                        {activity.type === 'incident' && (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                        {activity.type === 'signal' && (
                          <Bell className="h-4 w-4 text-orange-600" />
                        )}
                        {activity.type === 'action' && (
                          <ListTodo className="h-4 w-4 text-blue-600" />
                        )}
                        {activity.type === 'escalation' && (
                          <ArrowUpRight className="h-4 w-4 text-red-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {activity.title}
                          </span>
                          {severityColors && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs shrink-0',
                                severityColors.bg,
                                severityColors.text
                              )}
                            >
                              {activity.severity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No recent activity
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
