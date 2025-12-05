/**
 * Timeline Cluster Component (Sprint S49)
 * Displays a group of related timeline events
 */

import type { TimelineCluster as TimelineClusterType } from '@pravado/types';
import { TimelineEvent } from './TimelineEvent';
import { useState } from 'react';

interface TimelineClusterProps {
  cluster: TimelineClusterType;
  onEventSelect?: (eventId: string) => void;
  isExpanded?: boolean;
}

const clusterTypeConfig = {
  outreach_sequence: {
    icon: '📧',
    color: 'border-indigo-300 bg-indigo-50',
    label: 'Outreach Sequence',
  },
  coverage_thread: {
    icon: '📰',
    color: 'border-green-300 bg-green-50',
    label: 'Coverage Thread',
  },
  pitch_followup: {
    icon: '🔁',
    color: 'border-purple-300 bg-purple-50',
    label: 'Pitch Follow-up',
  },
  discovery_flow: {
    icon: '🔍',
    color: 'border-orange-300 bg-orange-50',
    label: 'Discovery Flow',
  },
  engagement_burst: {
    icon: '⚡',
    color: 'border-yellow-300 bg-yellow-50',
    label: 'Engagement Burst',
  },
  alert_series: {
    icon: '🔔',
    color: 'border-red-300 bg-red-50',
    label: 'Alert Series',
  },
  custom: {
    icon: '📎',
    color: 'border-gray-300 bg-gray-50',
    label: 'Custom Cluster',
  },
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateRange(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.floor(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    return `Same day (${formatDate(startDate)})`;
  } else if (diffDays === 1) {
    return `${formatDate(startDate)} - ${formatDate(endDate)} (2 days)`;
  } else {
    return `${formatDate(startDate)} - ${formatDate(endDate)} (${diffDays + 1} days)`;
  }
}

export function TimelineCluster({
  cluster,
  onEventSelect,
  isExpanded: initialExpanded = false,
}: TimelineClusterProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const config = clusterTypeConfig[cluster.type];

  const avgRelevance = Math.round(cluster.relevanceScore * 100);
  const impactLabel =
    cluster.relationshipImpact > 0
      ? 'Positive'
      : cluster.relationshipImpact < 0
        ? 'Negative'
        : 'Neutral';
  const impactColor =
    cluster.relationshipImpact > 0
      ? 'text-green-600'
      : cluster.relationshipImpact < 0
        ? 'text-red-600'
        : 'text-gray-600';

  return (
    <div className={`border-2 rounded-lg overflow-hidden ${config.color}`}>
      {/* Cluster Header */}
      <div
        className="p-4 cursor-pointer hover:bg-opacity-80 transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            <div>
              <div className="font-semibold text-gray-900">{cluster.title}</div>
              <div className="text-sm text-gray-600">{config.label}</div>
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <button
            className="text-gray-500 hover:text-gray-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Cluster Description */}
        {cluster.description && (
          <p className="text-sm text-gray-600 mb-3">{cluster.description}</p>
        )}

        {/* Cluster Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {/* Event Count */}
          <div>
            <div className="text-gray-500 text-xs">Events</div>
            <div className="font-semibold text-gray-900">
              {cluster.eventCount}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <div className="text-gray-500 text-xs">Duration</div>
            <div className="font-semibold text-gray-900">
              {formatDateRange(cluster.startDate, cluster.endDate)}
            </div>
          </div>

          {/* Avg Relevance */}
          <div>
            <div className="text-gray-500 text-xs">Avg Relevance</div>
            <div className="flex items-center gap-1">
              <div className="w-12 bg-gray-300 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${avgRelevance}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900 text-xs">
                {avgRelevance}%
              </span>
            </div>
          </div>

          {/* Impact */}
          <div>
            <div className="text-gray-500 text-xs">Impact</div>
            <div className={`font-semibold ${impactColor}`}>
              {impactLabel}
              {cluster.relationshipImpact !== 0 && (
                <span className="ml-1">
                  ({cluster.relationshipImpact > 0 ? '+' : ''}
                  {cluster.relationshipImpact.toFixed(2)})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Events List */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-white p-4 space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Events in this cluster:
          </div>
          {cluster.events.map((event) => (
            <TimelineEvent
              key={event.id}
              event={event}
              onSelect={() => onEventSelect?.(event.id)}
              showDate={true}
            />
          ))}
        </div>
      )}

      {/* Collapsed Preview */}
      {!isExpanded && (
        <div className="border-t border-gray-200 bg-white px-4 py-2 text-center">
          <button
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
          >
            View {cluster.eventCount} events in this cluster →
          </button>
        </div>
      )}
    </div>
  );
}
