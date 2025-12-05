/**
 * Board Report Card Component (Sprint S63)
 * Displays a summary card for a board report in list view
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  type ExecBoardReportWithCounts,
  getFormatLabel,
  getStatusLabel,
  getStatusColor,
  formatPeriodRange,
  formatFiscalQuarter,
  getReportProgress,
  formatRelativeTime,
} from '@/lib/executiveBoardReportApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  Users,
  Calendar,
  Clock,
} from 'lucide-react';

interface BoardReportCardProps {
  report: ExecBoardReportWithCounts;
  isSelected?: boolean;
  onSelect?: (report: ExecBoardReportWithCounts) => void;
}

export function BoardReportCard({ report, isSelected, onSelect }: BoardReportCardProps) {
  const progress = getReportProgress(report);
  const statusColor = getStatusColor(report.status);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-indigo-500 bg-indigo-50/50'
      )}
      onClick={() => onSelect?.(report)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-gray-900 line-clamp-1">{report.title}</span>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'text-xs',
              statusColor === 'green' && 'bg-green-100 text-green-700',
              statusColor === 'yellow' && 'bg-yellow-100 text-yellow-700',
              statusColor === 'blue' && 'bg-blue-100 text-blue-700',
              statusColor === 'indigo' && 'bg-indigo-100 text-indigo-700',
              statusColor === 'gray' && 'bg-gray-100 text-gray-700'
            )}
          >
            {getStatusLabel(report.status)}
          </Badge>
        </div>

        <div className="text-sm text-gray-500 mb-3">
          {getFormatLabel(report.format)}
          {report.fiscalQuarter && (
            <span className="ml-2">
              | {formatFiscalQuarter(report.fiscalQuarter, report.fiscalYear)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatPeriodRange(report.periodStart, report.periodEnd)}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {report.audienceCount}
          </div>
        </div>

        {/* Progress bar for sections */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Sections</span>
            <span>
              {report.completedSectionCount}/{report.sectionCount}
            </span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        <div className="flex items-center justify-end mt-2 text-xs text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          Updated {formatRelativeTime(report.updatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}
