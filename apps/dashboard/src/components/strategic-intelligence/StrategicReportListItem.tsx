/**
 * Strategic Report List Item Component (Sprint S65)
 * Displays a single strategic intelligence report in a list
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
  type StrategicReportListItem as ReportListItem,
  getFormatLabel,
  getStatusLabel,
  getAudienceLabel,
  formatPeriodRange,
  formatFiscalQuarter,
  formatRelativeTime,
  formatScore,
  getScoreColor,
} from '@/lib/strategicIntelligenceApi';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  FileText,
  Users,
  Calendar,
  Target,
} from 'lucide-react';
import Link from 'next/link';

interface StrategicReportListItemProps {
  report: ReportListItem;
  onDelete?: (reportId: string) => void;
}

export function StrategicReportListItem({
  report,
  onDelete,
}: StrategicReportListItemProps) {
  // getStatusColor is used for background styling in the badge component

  const getStatusBadgeVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (report.status) {
      case 'published':
        return 'default';
      case 'approved':
        return 'default';
      case 'generating':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/app/exec/strategy/${report.id}`}
            className="font-semibold text-lg hover:underline truncate"
          >
            {report.title}
          </Link>
          <Badge variant={getStatusBadgeVariant()}>
            {getStatusLabel(report.status)}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            <span>{getFormatLabel(report.format)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{getAudienceLabel(report.audience)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatPeriodRange(report.periodStart, report.periodEnd)}</span>
          </div>
          {report.fiscalQuarter && report.fiscalYear && (
            <span className="text-xs bg-muted px-2 py-0.5 rounded">
              {formatFiscalQuarter(report.fiscalYear, parseInt(report.fiscalQuarter.replace(/\D/g, ''), 10) || 1)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span>{report.sectionCount} sections</span>
          <span>Updated {formatRelativeTime(report.updatedAt)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {report.overallStrategicScore !== null && (
          <div className="text-center">
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4 text-muted-foreground" />
              <span
                className={`text-lg font-bold text-${getScoreColor(report.overallStrategicScore)}-600`}
              >
                {formatScore(report.overallStrategicScore)}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Score</span>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/app/exec/strategy/${report.id}`}>
                <Eye className="h-4 w-4 mr-2" />
                View Report
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/app/exec/strategy/${report.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete?.(report.id)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
