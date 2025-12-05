/**
 * Executive Digest Header Component (Sprint S62)
 * Header with title, actions, and status for digest detail view
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
  type ExecDigest,
  getDeliveryPeriodLabel,
  formatRelativeTime,
  formatFutureTime,
  formatSchedule,
} from '@/lib/executiveDigestApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  RefreshCw,
  Send,
  Download,
  Settings,
  MoreVertical,
  Archive,
  Trash2,
  Play,
  Pause,
  Clock,
  Calendar,
} from 'lucide-react';

interface ExecDigestHeaderProps {
  digest: ExecDigest;
  isGenerating?: boolean;
  isDelivering?: boolean;
  onGenerate?: () => void;
  onDeliver?: () => void;
  onDownloadPdf?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onToggleActive?: () => void;
  className?: string;
}

export function ExecDigestHeader({
  digest,
  isGenerating,
  isDelivering,
  onGenerate,
  onDeliver,
  onDownloadPdf,
  onEdit,
  onArchive,
  onDelete,
  onToggleActive,
  className,
}: ExecDigestHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Top Row - Title and Actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-indigo-100">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{digest.title}</h1>
            {digest.description && (
              <p className="text-sm text-gray-500 mt-1">{digest.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Generate Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerate}
            disabled={isGenerating || isDelivering}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isGenerating && 'animate-spin')} />
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>

          {/* Deliver Button */}
          <Button
            variant="default"
            size="sm"
            onClick={onDeliver}
            disabled={isGenerating || isDelivering || !digest.isActive}
          >
            <Send className={cn('h-4 w-4 mr-2', isDelivering && 'animate-pulse')} />
            {isDelivering ? 'Delivering...' : 'Deliver Now'}
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {digest.pdfStoragePath && (
                <DropdownMenuItem onClick={onDownloadPdf}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {digest.isActive ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Delivery
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume Delivery
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!digest.isArchived && (
                <DropdownMenuItem onClick={onArchive} className="text-orange-600">
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Bottom Row - Status Badges */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status Badge */}
        <Badge
          variant="outline"
          className={cn(
            digest.isActive
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-600 border-gray-200'
          )}
        >
          {digest.isActive ? 'Active' : 'Paused'}
        </Badge>

        {/* Delivery Period */}
        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
          <Calendar className="h-3 w-3 mr-1" />
          {getDeliveryPeriodLabel(digest.deliveryPeriod)}
        </Badge>

        {/* Schedule Info */}
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{formatSchedule(digest)}</span>
        </div>

        {/* Last Delivered */}
        {digest.lastDeliveredAt && (
          <div className="text-sm text-gray-500">
            Last delivered: {formatRelativeTime(digest.lastDeliveredAt)}
          </div>
        )}

        {/* Next Delivery */}
        {digest.nextDeliveryAt && digest.isActive && (
          <div className="text-sm text-indigo-600 font-medium">
            Next: {formatFutureTime(digest.nextDeliveryAt)}
          </div>
        )}

        {/* PDF Status */}
        {digest.pdfStoragePath && digest.pdfGeneratedAt && (
          <Badge variant="secondary">
            PDF: {formatRelativeTime(digest.pdfGeneratedAt)}
          </Badge>
        )}
      </div>
    </div>
  );
}
