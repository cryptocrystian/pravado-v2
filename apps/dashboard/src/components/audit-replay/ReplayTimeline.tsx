'use client';

/**
 * Replay Timeline Component (Sprint S37)
 * Vertical diff timeline for replay events
 */

import type { ReplayTimelineEvent } from '@/lib/auditReplayApi';
import { formatEntityType, getEntityTypeColor } from '@/lib/auditReplayApi';

interface ReplayTimelineProps {
  events: ReplayTimelineEvent[];
  selectedIndex?: number;
  onSelectEvent: (index: number) => void;
}

export function ReplayTimeline({
  events,
  selectedIndex,
  onSelectEvent,
}: ReplayTimelineProps) {
  const severityColors: Record<string, string> = {
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    critical: 'bg-purple-500',
  };

  const entityColors: Record<string, string> = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    indigo: 'text-indigo-600',
    orange: 'text-orange-600',
    gray: 'text-gray-600',
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No events in timeline
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

      {/* Events */}
      <div className="space-y-4">
        {events.map((event, idx) => (
          <div
            key={event.index}
            onClick={() => onSelectEvent(event.index)}
            className={`relative pl-10 cursor-pointer transition-all ${
              selectedIndex === event.index
                ? 'bg-blue-50 -mx-4 px-4 py-2 rounded-lg'
                : 'hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg'
            }`}
          >
            {/* Timeline dot */}
            <div
              className={`absolute left-2 w-4 h-4 rounded-full border-2 border-white ${
                severityColors[event.severity] || 'bg-gray-500'
              }`}
            />

            {/* Event content */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {event.summary}
                  </span>
                  {event.changeCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {event.changeCount} change{event.changeCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                  {event.entityType && (
                    <span
                      className={`text-xs font-medium ${
                        entityColors[getEntityTypeColor(event.entityType)]
                      }`}
                    >
                      {formatEntityType(event.entityType)}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{event.eventType}</span>
                </div>
              </div>

              {/* Index indicator */}
              <span className="text-xs text-gray-400">#{idx + 1}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
