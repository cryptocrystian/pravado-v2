/**
 * Board Report Stats Card Component (Sprint S63)
 * Displays statistics overview for board reports
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { type ExecBoardReportStats, formatRelativeTime } from '@/lib/executiveBoardReportApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  Edit,
  Send,
  Archive,
  Users,
  Layers,
  Clock,
  Cpu,
  Calendar,
  TrendingUp,
  Loader2,
} from 'lucide-react';

interface BoardReportStatsCardProps {
  stats: ExecBoardReportStats;
  isLoading?: boolean;
  className?: string;
}

export function BoardReportStatsCard({
  stats,
  isLoading,
  className,
}: BoardReportStatsCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      label: 'Total Reports',
      value: stats.totalReports,
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      label: 'Drafts',
      value: stats.draftReports,
      icon: Edit,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      label: 'Published',
      value: stats.publishedReports,
      icon: Send,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Archived',
      value: stats.archivedReports,
      icon: Archive,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
    },
    {
      label: 'Audience',
      value: stats.totalAudienceMembers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Sections',
      value: stats.totalSectionsGenerated,
      icon: Layers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4', className)}>
      {statItems.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', item.bgColor)}>
                <item.icon className={cn('h-4 w-4', item.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-500">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Additional metrics row */}
      <Card className="col-span-2 md:col-span-3 lg:col-span-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Avg. Generation:</span>
              <span className="font-medium text-gray-900">
                {stats.averageGenerationTimeMs > 0
                  ? `${(stats.averageGenerationTimeMs / 1000).toFixed(1)}s`
                  : 'N/A'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">Total Tokens:</span>
              <span className="font-medium text-gray-900">
                {stats.totalTokensUsed.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">This Quarter:</span>
              <span className="font-medium text-gray-900">{stats.reportsThisQuarter}</span>
            </div>

            {stats.lastPublishedAt && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-gray-500">Last Published:</span>
                <span className="font-medium text-gray-900">
                  {formatRelativeTime(stats.lastPublishedAt)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
