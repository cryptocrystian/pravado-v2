/**
 * Executive Digest Card Component (Sprint S62)
 * Summary card for each digest showing key stats and status
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  type ExecDigestWithCounts,
  getDeliveryPeriodLabel,
  getTimeWindowLabel,
  formatRelativeTime,
  formatFutureTime,
  formatSchedule,
  getDigestHealthStatus,
  getDigestHealthColor,
  getDeliveryStatusColor,
  getDeliveryStatusLabel,
} from '@/lib/executiveDigestApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  Clock,
  Send,
  Calendar,
  CheckCircle,
  XCircle,
  Archive,
  Pause,
} from 'lucide-react';

interface ExecDigestCardProps {
  digest: ExecDigestWithCounts;
  isSelected?: boolean;
  onSelect?: (digest: ExecDigestWithCounts) => void;
  className?: string;
}

export function ExecDigestCard({
  digest,
  isSelected,
  onSelect,
  className,
}: ExecDigestCardProps) {
  const healthStatus = getDigestHealthStatus(digest);
  const healthColor = getDigestHealthColor(healthStatus);

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected && 'ring-2 ring-indigo-500 shadow-md',
        digest.isArchived && 'opacity-60',
        !digest.isActive && 'bg-gray-50',
        className
      )}
      onClick={() => onSelect?.(digest)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('p-2 rounded-full', healthStatus === 'healthy' ? 'bg-green-100' : healthStatus === 'warning' ? 'bg-yellow-100' : 'bg-red-100')}>
              <FileText className={cn('h-4 w-4', healthColor)} />
            </div>
            <div>
              <div className="font-semibold text-gray-900 line-clamp-1">
                {digest.title}
              </div>
              {digest.description && (
                <div className="text-xs text-gray-500 line-clamp-1">
                  {digest.description}
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {!digest.isActive && (
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                <Pause className="h-3 w-3 mr-1" />
                Paused
              </Badge>
            )}
            {digest.isArchived && (
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                <Archive className="h-3 w-3 mr-1" />
                Archived
              </Badge>
            )}
          </div>
        </div>

        {/* Period & Time Window */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
            <Calendar className="h-3 w-3 mr-1" />
            {getDeliveryPeriodLabel(digest.deliveryPeriod)}
          </Badge>
          <Badge variant="secondary">
            {getTimeWindowLabel(digest.timeWindow)}
          </Badge>
        </div>

        {/* Schedule */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>{formatSchedule(digest)}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 rounded bg-gray-50">
            <div className="text-gray-500">Sections</div>
            <div className="font-medium text-gray-900">{digest.sectionsCount}</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-50">
            <div className="text-gray-500">Recipients</div>
            <div className="font-medium text-gray-900">{digest.recipientsCount}</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-50">
            <div className="text-gray-500">Deliveries</div>
            <div className="font-medium text-gray-900">{digest.deliveriesCount}</div>
          </div>
        </div>

        {/* Delivery Status */}
        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-1 text-gray-600">
            <Send className="h-3 w-3" />
            <span>
              {digest.lastDeliveredAt
                ? `Last: ${formatRelativeTime(digest.lastDeliveredAt)}`
                : 'Never delivered'}
            </span>
          </div>
          {digest.nextDeliveryAt && digest.isActive && (
            <div className="text-indigo-600 font-medium">
              Next: {formatFutureTime(digest.nextDeliveryAt)}
            </div>
          )}
        </div>

        {/* Last delivery status indicator */}
        {digest.lastDeliveryStatus && (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            getDeliveryStatusColor(digest.lastDeliveryStatus)
          )}>
            {digest.lastDeliveryStatus === 'success' ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            <span>Last delivery: {getDeliveryStatusLabel(digest.lastDeliveryStatus)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
