/**
 * Alert Event Detail Drawer Component (Sprint S43)
 * Displays full event details with mark-as-read functionality
 */

import type { MediaAlertEvent } from '@pravado/types';
import { useState } from 'react';

import { markAlertEventsRead } from '@/lib/mediaAlertsApi';

interface AlertEventDetailDrawerProps {
  event: MediaAlertEvent;
  isOpen: boolean;
  onClose: () => void;
  onEventChange: () => void;
}

export function AlertEventDetailDrawer({
  event,
  isOpen,
  onClose,
  onEventChange,
}: AlertEventDetailDrawerProps) {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkRead = async () => {
    setIsMarking(true);
    try {
      await markAlertEventsRead({
        eventIds: [event.id],
        isRead: !event.isRead,
      });
      onEventChange();
      onClose();
    } catch (error) {
      console.error('Failed to mark event:', error);
    } finally {
      setIsMarking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-30 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Alert Event Details</h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(event.triggeredAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
            <p className="text-gray-900">{event.summary}</p>
          </div>

          {/* Alert Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Alert Type</h3>
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">
                {event.alertType.replace('_', ' ')}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Severity</h3>
              <span
                className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                  event.severity === 'critical'
                    ? 'bg-red-100 text-red-800'
                    : event.severity === 'warning'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {event.severity.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Details */}
          {event.details && Object.keys(event.details).length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Details</h3>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <pre className="text-xs text-gray-800 overflow-x-auto">
                  {JSON.stringify(event.details, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Context References */}
          <div className="space-y-3">
            {event.articleId && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Article ID</h3>
                <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {event.articleId}
                </code>
              </div>
            )}
            {event.mentionId && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">Mention ID</h3>
                <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                  {event.mentionId}
                </code>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleMarkRead}
              disabled={isMarking}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isMarking
                ? 'Updating...'
                : event.isRead
                  ? 'Mark as Unread'
                  : 'Mark as Read'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
