/**
 * Event Drawer Component (Sprint S49)
 * Right-side overlay drawer for displaying full timeline event details
 */

import type { JournalistTimelineEvent } from '@pravado/types';

interface EventDrawerProps {
  event: JournalistTimelineEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (eventId: string) => void;
  onEdit?: (eventId: string) => void;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'negative':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'neutral':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-400 border-gray-300';
  }
}

export function EventDrawer({
  event,
  isOpen,
  onClose,
  onDelete,
  onEdit,
}: EventDrawerProps) {
  if (!isOpen || !event) return null;

  const sentimentColor = getSentimentColor(event.sentiment);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-2/3 lg:w-1/2 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(event.id)}
                className="text-gray-500 hover:text-blue-600 transition-colors p-2"
                title="Edit Event"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this event?')) {
                    onDelete(event.id);
                    onClose();
                  }
                }}
                className="text-gray-500 hover:text-red-600 transition-colors p-2"
                title="Delete Event"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {event.title}
            </h3>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {event.eventType.replace(/_/g, ' ')}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {event.description}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Timestamp */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-xs text-gray-500 mb-1">
                Event Time
              </label>
              <div className="text-sm font-medium text-gray-900">
                {formatDate(event.eventTimestamp)}
              </div>
            </div>

            {/* Sentiment */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-xs text-gray-500 mb-1">
                Sentiment
              </label>
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${sentimentColor}`}
              >
                {event.sentiment}
              </span>
            </div>

            {/* Relevance Score */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-xs text-gray-500 mb-1">
                Relevance Score
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${event.relevanceScore * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round(event.relevanceScore * 100)}%
                </span>
              </div>
            </div>

            {/* Relationship Impact */}
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="block text-xs text-gray-500 mb-1">
                Relationship Impact
              </label>
              <div className={`text-sm font-semibold ${
                event.relationshipImpact > 0
                  ? 'text-green-600'
                  : event.relationshipImpact < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}>
                {event.relationshipImpact > 0 ? '+' : ''}
                {event.relationshipImpact.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Source Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Source Information
            </label>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Source System:</span>
                <span className="font-medium text-blue-900">
                  {event.sourceSystem.replace(/_/g, ' ')}
                </span>
              </div>
              {event.sourceId && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Source ID:</span>
                  <span className="font-mono text-xs text-blue-900">
                    {event.sourceId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cluster Information */}
          {event.clusterId && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
                <span>🔗</span>
                Cluster Information
              </label>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Cluster ID:</span>
                  <span className="font-mono text-xs text-purple-900">
                    {event.clusterId}
                  </span>
                </div>
                {event.clusterType && (
                  <div className="flex justify-between">
                    <span className="text-purple-700">Cluster Type:</span>
                    <span className="font-medium text-purple-900">
                      {event.clusterType.replace(/_/g, ' ')}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-purple-600 mt-2">
                This event is part of a related event cluster
              </p>
            </div>
          )}

          {/* Payload Data */}
          {event.payload && Object.keys(event.payload).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Payload
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          {event.metadata && Object.keys(event.metadata).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metadata
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-700 font-mono whitespace-pre-wrap">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* System Timestamps */}
          <div className="border-t border-gray-200 pt-4 space-y-2 text-xs text-gray-500">
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{formatDate(event.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Updated:</span>
              <span>{formatDate(event.updatedAt)}</span>
            </div>
            {event.createdBy && (
              <div className="flex justify-between">
                <span>Created By:</span>
                <span className="font-mono">{event.createdBy}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
