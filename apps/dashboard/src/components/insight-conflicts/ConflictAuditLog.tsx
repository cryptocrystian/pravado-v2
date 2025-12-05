'use client';

/**
 * ConflictAuditLog Component (Sprint S74)
 * Audit log display for insight conflicts
 */

import type { InsightConflictAuditLog, ConflictActorType } from '@pravado/types';
import { formatDate, formatRelativeTime } from '../../lib/insightConflictApi';

interface ConflictAuditLogProps {
  events: InsightConflictAuditLog[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

const EVENT_TYPE_ICONS: Record<string, string> = {
  created: 'M12 6v6m0 0v6m0-6h6m-6 0H6',
  updated: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  analyzed: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  resolved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  dismissed: 'M6 18L18 6M6 6l12 12',
  reviewed: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
  resolution_accepted: 'M5 13l4 4L19 7',
  resolution_rejected: 'M6 18L18 6M6 6l12 12',
  clustered: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
  graph_edge_created: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  created: 'bg-blue-100 text-blue-600',
  updated: 'bg-yellow-100 text-yellow-600',
  analyzed: 'bg-purple-100 text-purple-600',
  resolved: 'bg-green-100 text-green-600',
  dismissed: 'bg-gray-100 text-gray-600',
  reviewed: 'bg-indigo-100 text-indigo-600',
  resolution_accepted: 'bg-green-100 text-green-600',
  resolution_rejected: 'bg-red-100 text-red-600',
  clustered: 'bg-cyan-100 text-cyan-600',
  graph_edge_created: 'bg-orange-100 text-orange-600',
};

const ACTOR_TYPE_LABELS: Record<ConflictActorType, string> = {
  user: 'User',
  system: 'System',
  ai: 'AI',
};

export function ConflictAuditLog({
  events,
  loading,
  hasMore,
  onLoadMore,
}: ConflictAuditLogProps) {
  if (loading && events.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 w-1/3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <svg
          className="w-12 h-12 mx-auto text-gray-400 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-sm font-medium text-gray-900">No audit events</h3>
        <p className="text-xs text-gray-500 mt-1">Events will appear here as actions are taken.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900">Audit Log</h3>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200"></div>

        {/* Events */}
        <div className="space-y-0">
          {events.map((event, _index) => {
            const iconPath = EVENT_TYPE_ICONS[event.eventType] || EVENT_TYPE_ICONS.updated;
            const colorClass = EVENT_TYPE_COLORS[event.eventType] || 'bg-gray-100 text-gray-600';

            return (
              <div key={event.id} className="relative pl-14 pr-4 py-4">
                {/* Icon */}
                <div className={`absolute left-3 w-6 h-6 rounded-full ${colorClass} flex items-center justify-center`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
                  </svg>
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {formatEventType(event.eventType)}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        event.actorType === 'ai' ? 'bg-purple-100 text-purple-700' :
                        event.actorType === 'system' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ACTOR_TYPE_LABELS[event.actorType]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(event.createdAt)}
                    </span>
                  </div>

                  {/* Event details */}
                  {event.eventDetails && Object.keys(event.eventDetails).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      {Object.entries(event.eventDetails).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium text-gray-500">{formatKey(key)}:</span>
                          <span>{formatValue(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* State changes */}
                  {(event.previousState || event.newState) && (
                    <div className="mt-2 flex gap-2 text-xs">
                      {event.previousState && (
                        <div className="flex-1 p-2 bg-red-50 rounded">
                          <div className="font-medium text-red-700 mb-1">Previous</div>
                          <pre className="text-red-600 whitespace-pre-wrap break-words">
                            {JSON.stringify(event.previousState, null, 2).slice(0, 200)}
                          </pre>
                        </div>
                      )}
                      {event.newState && (
                        <div className="flex-1 p-2 bg-green-50 rounded">
                          <div className="font-medium text-green-700 mb-1">New</div>
                          <pre className="text-green-600 whitespace-pre-wrap break-words">
                            {JSON.stringify(event.newState, null, 2).slice(0, 200)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="mt-1 text-xs text-gray-400">
                    {formatDate(event.createdAt)}
                    {event.ipAddress && <span> • {event.ipAddress}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="p-4">
          <button
            onClick={onLoadMore}
            disabled={loading}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
}

function formatEventType(type: string): string {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatKey(key: string): string {
  return key
    .split(/(?=[A-Z])|_/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
