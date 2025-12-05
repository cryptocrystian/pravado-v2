/**
 * Timeline Event Component (Sprint S49)
 * Displays a single event in the journalist relationship timeline
 */

import type { JournalistTimelineEvent, TimelineEventType } from '@pravado/types';

interface TimelineEventProps {
  event: JournalistTimelineEvent;
  onSelect?: (event: JournalistTimelineEvent) => void;
  isSelected?: boolean;
  showDate?: boolean;
}

// Event type display configuration
const eventTypeConfig: Record<
  TimelineEventType,
  { icon: string; color: string; label: string }
> = {
  // S38 Press Releases
  press_release_generated: { icon: '📄', color: 'bg-blue-50 border-blue-200', label: 'Press Release Generated' },
  press_release_sent: { icon: '📤', color: 'bg-blue-50 border-blue-200', label: 'Press Release Sent' },

  // S39 Pitch Engine
  pitch_sent: { icon: '✉️', color: 'bg-purple-50 border-purple-200', label: 'Pitch Sent' },
  pitch_opened: { icon: '👁️', color: 'bg-purple-50 border-purple-200', label: 'Pitch Opened' },
  pitch_clicked: { icon: '🖱️', color: 'bg-purple-50 border-purple-200', label: 'Pitch Clicked' },
  pitch_replied: { icon: '💬', color: 'bg-green-50 border-green-200', label: 'Pitch Replied' },
  pitch_bounced: { icon: '⚠️', color: 'bg-red-50 border-red-200', label: 'Pitch Bounced' },

  // S40 Media Monitoring
  media_mention: { icon: '📰', color: 'bg-green-50 border-green-200', label: 'Media Mention' },
  coverage_published: { icon: '🎉', color: 'bg-green-50 border-green-200', label: 'Coverage Published' },
  brand_mention: { icon: '🏷️', color: 'bg-green-50 border-green-200', label: 'Brand Mention' },

  // S41 RSS Crawling
  article_published: { icon: '📝', color: 'bg-gray-50 border-gray-200', label: 'Article Published' },

  // S43 Media Alerts
  alert_triggered: { icon: '🔔', color: 'bg-yellow-50 border-yellow-200', label: 'Alert Triggered' },
  signal_detected: { icon: '📡', color: 'bg-yellow-50 border-yellow-200', label: 'Signal Detected' },

  // S44 PR Outreach
  outreach_sent: { icon: '📧', color: 'bg-indigo-50 border-indigo-200', label: 'Outreach Sent' },
  outreach_opened: { icon: '👀', color: 'bg-indigo-50 border-indigo-200', label: 'Outreach Opened' },
  outreach_clicked: { icon: '👆', color: 'bg-indigo-50 border-indigo-200', label: 'Outreach Clicked' },
  outreach_replied: { icon: '✅', color: 'bg-green-50 border-green-200', label: 'Outreach Replied' },
  outreach_bounced: { icon: '❌', color: 'bg-red-50 border-red-200', label: 'Outreach Bounced' },
  outreach_unsubscribed: { icon: '🚫', color: 'bg-red-50 border-red-200', label: 'Unsubscribed' },
  outreach_followup: { icon: '🔁', color: 'bg-indigo-50 border-indigo-200', label: 'Follow-up Sent' },

  // S45 Engagement Analytics
  email_engagement: { icon: '📊', color: 'bg-teal-50 border-teal-200', label: 'Email Engagement' },
  link_clicked: { icon: '🔗', color: 'bg-teal-50 border-teal-200', label: 'Link Clicked' },
  attachment_downloaded: { icon: '📎', color: 'bg-teal-50 border-teal-200', label: 'Attachment Downloaded' },

  // S46 Identity Graph
  profile_created: { icon: '👤', color: 'bg-cyan-50 border-cyan-200', label: 'Profile Created' },
  profile_updated: { icon: '✏️', color: 'bg-cyan-50 border-cyan-200', label: 'Profile Updated' },
  profile_merged: { icon: '🔀', color: 'bg-cyan-50 border-cyan-200', label: 'Profile Merged' },
  profile_enriched: { icon: '✨', color: 'bg-cyan-50 border-cyan-200', label: 'Profile Enriched' },

  // S47 Media Lists
  added_to_media_list: { icon: '➕', color: 'bg-pink-50 border-pink-200', label: 'Added to Media List' },
  removed_from_media_list: { icon: '➖', color: 'bg-pink-50 border-pink-200', label: 'Removed from Media List' },

  // S48 Discovery
  journalist_discovered: { icon: '🔍', color: 'bg-orange-50 border-orange-200', label: 'Journalist Discovered' },
  discovery_merged: { icon: '🔗', color: 'bg-orange-50 border-orange-200', label: 'Discovery Merged' },

  // Custom events
  manual_note: { icon: '📝', color: 'bg-gray-50 border-gray-200', label: 'Manual Note' },
  tag_added: { icon: '🏷️', color: 'bg-gray-50 border-gray-200', label: 'Tag Added' },
  tag_removed: { icon: '🗑️', color: 'bg-gray-50 border-gray-200', label: 'Tag Removed' },
  custom_interaction: { icon: '🤝', color: 'bg-gray-50 border-gray-200', label: 'Custom Interaction' },
};

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive':
      return 'text-green-600';
    case 'negative':
      return 'text-red-600';
    case 'neutral':
      return 'text-gray-600';
    default:
      return 'text-gray-400';
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function TimelineEvent({
  event,
  onSelect,
  isSelected = false,
  showDate = true,
}: TimelineEventProps) {
  const config = eventTypeConfig[event.eventType];
  const sentimentColor = getSentimentColor(event.sentiment);

  return (
    <div
      className={`
        border rounded-lg p-4 cursor-pointer transition-all
        ${config.color}
        ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-sm'}
      `}
      onClick={() => onSelect?.(event)}
    >
      {/* Event Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <div className="font-medium text-gray-900">{event.title}</div>
            <div className="text-xs text-gray-500">{config.label}</div>
          </div>
        </div>

        {/* Relevance Score */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${event.relevanceScore * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">
              {Math.round(event.relevanceScore * 100)}%
            </span>
          </div>
          {showDate && (
            <span className="text-xs text-gray-500">
              {formatDate(event.eventTimestamp)}
            </span>
          )}
        </div>
      </div>

      {/* Event Description */}
      {event.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Event Metadata */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        {/* Sentiment */}
        <div className="flex items-center gap-1">
          <span>Sentiment:</span>
          <span className={`font-medium ${sentimentColor}`}>
            {event.sentiment}
          </span>
        </div>

        {/* Impact */}
        {event.relationshipImpact !== 0 && (
          <div className="flex items-center gap-1">
            <span>Impact:</span>
            <span
              className={`font-medium ${
                event.relationshipImpact > 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {event.relationshipImpact > 0 ? '+' : ''}
              {event.relationshipImpact.toFixed(2)}
            </span>
          </div>
        )}

        {/* Source System */}
        <div className="flex items-center gap-1">
          <span>Source:</span>
          <span className="font-medium text-gray-700">
            {event.sourceSystem.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Cluster Indicator */}
        {event.clusterId && (
          <div className="flex items-center gap-1">
            <span>🔗</span>
            <span className="font-medium text-blue-600">Clustered</span>
          </div>
        )}
      </div>
    </div>
  );
}
