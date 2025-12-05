/**
 * ReputationEventsList Component (Sprint S56)
 * Displays recent reputation events/signals
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getEventSeverityColor,
  getEventSeverityBgColor,
  getSourceSystemLabel,
  getSourceSystemIcon,
  getSignalTypeLabel,
  getSignalTypeColor,
  getComponentLabel,
  formatRelativeTime,
  formatDelta,
} from '@/lib/brandReputationApi';
import { cn } from '@/lib/utils';
import type { BrandReputationEvent } from '@pravado/types';
import { Activity, ArrowUp, ArrowDown, Minus, Zap } from 'lucide-react';

interface ReputationEventsListProps {
  events: BrandReputationEvent[];
  totalCount: number;
  maxItems?: number;
  className?: string;
}

export function ReputationEventsList({
  events,
  totalCount,
  maxItems = 10,
  className,
}: ReputationEventsListProps) {
  const limitedEvents = events.slice(0, maxItems);

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-600">
              Recent Events
            </CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {totalCount} total
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {limitedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mb-2 text-gray-300" />
            <p className="text-sm">No events recorded</p>
            <p className="text-xs">Events will appear as they occur</p>
          </div>
        ) : (
          <div className="space-y-3">
            {limitedEvents.map((event) => (
              <EventItem key={event.id} event={event} />
            ))}
          </div>
        )}

        {totalCount > limitedEvents.length && (
          <p className="text-xs text-gray-500 text-center mt-4 pt-2 border-t">
            Showing {limitedEvents.length} of {totalCount} events
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface EventItemProps {
  event: BrandReputationEvent;
}

function EventItem({ event }: EventItemProps) {
  const severityColorClass = getEventSeverityColor(event.severity);
  const severityBgClass = getEventSeverityBgColor(event.severity);
  const signalColorClass = getSignalTypeColor(event.signalType);
  const { text: deltaText, colorClass: deltaColorClass } = formatDelta(event.delta);

  const isPositive = event.delta > 0;
  const isNegative = event.delta < 0;

  return (
    <div className={cn('p-3 rounded-lg border', severityBgClass)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <span className="text-lg">{getSourceSystemIcon(event.sourceSystem)}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-medium text-gray-800">
                {event.title}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs capitalize', severityColorClass)}
              >
                {event.severity}
              </Badge>
            </div>
            {event.description && (
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {event.description}
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
              <Badge variant="outline" className="text-xs bg-white/50">
                {getSourceSystemLabel(event.sourceSystem)}
              </Badge>
              <Badge variant="outline" className={cn('text-xs bg-white/50', signalColorClass)}>
                {getSignalTypeLabel(event.signalType)}
              </Badge>
              <Badge variant="outline" className="text-xs bg-white/50">
                {getComponentLabel(event.affectedComponent)}
              </Badge>
              <span className="ml-auto">
                {formatRelativeTime(event.eventTimestamp)}
              </span>
            </div>
          </div>
        </div>

        {/* Delta Impact */}
        <div className="flex flex-col items-end">
          <div className={cn('flex items-center gap-0.5 font-bold text-lg', deltaColorClass)}>
            {isPositive && <ArrowUp className="h-4 w-4" />}
            {isNegative && <ArrowDown className="h-4 w-4" />}
            {!isPositive && !isNegative && <Minus className="h-4 w-4" />}
            {deltaText}
          </div>
          <span className="text-xs text-gray-500">impact</span>
        </div>
      </div>

      {/* Processing Status */}
      {event.isProcessed && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-200/50 text-xs text-gray-500">
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
            Processed
          </Badge>
          {event.processedAt && (
            <span className="ml-1">at {formatRelativeTime(event.processedAt)}</span>
          )}
        </div>
      )}
    </div>
  );
}
