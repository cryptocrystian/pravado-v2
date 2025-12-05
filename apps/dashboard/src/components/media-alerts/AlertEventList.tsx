/**
 * Alert Event List Component (Sprint S43)
 * Displays alert events with severity badges and filtering
 */

import type { MediaAlertEvent, MediaAlertSeverity } from '@pravado/types';

interface AlertEventListProps {
  events: MediaAlertEvent[];
  onEventClick: (event: MediaAlertEvent) => void;
  isLoading: boolean;
  onEventsChange?: (ruleId?: string) => Promise<void>;
}

function SeverityBadge({ severity }: { severity: MediaAlertSeverity }) {
  const colors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium border ${colors[severity]}`}>
      {severity.toUpperCase()}
    </span>
  );
}

function AlertTypeBadge({ type }: { type: string }) {
  return (
    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
      {type.replace('_', ' ')}
    </span>
  );
}

export function AlertEventList({ events, onEventClick, isLoading, onEventsChange: _onEventsChange }: AlertEventListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No alerts yet</h3>
        <p className="text-gray-600 text-sm">
          When your alert rules trigger, events will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          onClick={() => onEventClick(event)}
          className={`p-4 bg-white border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
            event.isRead ? 'border-gray-200' : 'border-blue-300 bg-blue-50'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <SeverityBadge severity={event.severity} />
              <AlertTypeBadge type={event.alertType} />
              {!event.isRead && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" title="Unread" />
              )}
            </div>
            <span className="text-xs text-gray-500">
              {new Date(event.triggeredAt).toLocaleString()}
            </span>
          </div>
          <p className="text-sm text-gray-900 font-medium">{event.summary}</p>
          {event.details && Object.keys(event.details).length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              {JSON.stringify(event.details).slice(0, 100)}...
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
