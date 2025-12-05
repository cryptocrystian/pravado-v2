/**
 * Board Report Header Component (Sprint S63)
 * Displays report details and action buttons
 */

'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  type ExecBoardReport,
  getFormatLabel,
  getStatusLabel,
  getStatusColor,
  formatPeriodRange,
  formatFiscalQuarter,
  formatRelativeTime,
} from '@/lib/executiveBoardReportApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  RefreshCw,
  Send,
  Download,
  Edit,
  Archive,
  Trash2,
  MoreVertical,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react';

interface BoardReportHeaderProps {
  report: ExecBoardReport;
  isGenerating?: boolean;
  isPublishing?: boolean;
  onGenerate?: () => void;
  onApprove?: () => void;
  onPublish?: () => void;
  onDownloadPdf?: () => void;
  onDownloadPptx?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}

export function BoardReportHeader({
  report,
  isGenerating,
  isPublishing,
  onGenerate,
  onApprove,
  onPublish,
  onDownloadPdf,
  onDownloadPptx,
  onEdit,
  onArchive,
  onDelete,
}: BoardReportHeaderProps) {
  const statusColor = getStatusColor(report.status);
  const canGenerate = report.status === 'draft' || report.status === 'review';
  const canApprove = report.status === 'review';
  const canPublish = report.status === 'approved';
  const hasPdf = !!report.pdfStoragePath;
  const hasPptx = !!report.pptxStoragePath;

  return (
    <div className="space-y-4">
      {/* Title and Actions Row */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            {report.title}
          </h2>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span>{getFormatLabel(report.format)}</span>
            <span>|</span>
            <span>{formatPeriodRange(report.periodStart, report.periodEnd)}</span>
            {report.fiscalQuarter && (
              <>
                <span>|</span>
                <span>{formatFiscalQuarter(report.fiscalQuarter, report.fiscalYear)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Primary Actions */}
          {canGenerate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Generate
            </Button>
          )}

          {canApprove && (
            <Button
              variant="outline"
              size="sm"
              onClick={onApprove}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}

          {canPublish && (
            <Button
              size="sm"
              onClick={onPublish}
              disabled={isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Publish
            </Button>
          )}

          {/* Downloads */}
          {(hasPdf || hasPptx) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasPdf && (
                  <DropdownMenuItem onClick={onDownloadPdf}>
                    Download PDF
                  </DropdownMenuItem>
                )}
                {hasPptx && (
                  <DropdownMenuItem onClick={onDownloadPptx}>
                    Download PowerPoint
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Status and Meta Row */}
      <div className="flex items-center gap-4">
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

        {report.generationDurationMs && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            Generated in {(report.generationDurationMs / 1000).toFixed(1)}s
          </div>
        )}

        {report.publishedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Send className="h-3 w-3" />
            Published {formatRelativeTime(report.publishedAt)}
          </div>
        )}

        <div className="text-xs text-gray-400 ml-auto">
          Created {formatRelativeTime(report.createdAt)}
        </div>
      </div>

      {/* Description */}
      {report.description && (
        <p className="text-sm text-gray-600">{report.description}</p>
      )}
    </div>
  );
}
