/**
 * Timeline Filters Component (Sprint S49)
 * Comprehensive filtering panel for timeline events
 */

import type {
  TimelineQuery,
  TimelineEventType,
  TimelineSourceSystem,
  TimelineSentiment,
} from '@pravado/types';
import { useState } from 'react';

interface TimelineFiltersProps {
  onFilterChange: (filters: TimelineQuery) => void;
  onReset: () => void;
}

const eventTypeOptions: { value: TimelineEventType; label: string; category: string }[] = [
  { value: 'press_release_generated', label: 'Press Release Generated', category: 'Press Releases' },
  { value: 'press_release_sent', label: 'Press Release Sent', category: 'Press Releases' },
  { value: 'pitch_sent', label: 'Pitch Sent', category: 'Pitch Engine' },
  { value: 'pitch_replied', label: 'Pitch Replied', category: 'Pitch Engine' },
  { value: 'outreach_sent', label: 'Outreach Sent', category: 'Outreach' },
  { value: 'outreach_replied', label: 'Outreach Replied', category: 'Outreach' },
  { value: 'coverage_published', label: 'Coverage Published', category: 'Media Monitoring' },
  { value: 'media_mention', label: 'Media Mention', category: 'Media Monitoring' },
  { value: 'manual_note', label: 'Manual Note', category: 'Custom' },
];

const sourceSystemOptions: { value: TimelineSourceSystem; label: string }[] = [
  { value: 'press_releases', label: 'Press Releases' },
  { value: 'pitch_engine', label: 'Pitch Engine' },
  { value: 'pr_outreach', label: 'PR Outreach' },
  { value: 'media_monitoring', label: 'Media Monitoring' },
  { value: 'engagement_analytics', label: 'Engagement Analytics' },
  { value: 'identity_graph', label: 'Identity Graph' },
  { value: 'media_lists', label: 'Media Lists' },
  { value: 'discovery_engine', label: 'Discovery Engine' },
  { value: 'manual', label: 'Manual' },
];

const sentimentOptions: { value: TimelineSentiment; label: string; color: string }[] = [
  { value: 'positive', label: 'Positive', color: 'text-green-600' },
  { value: 'neutral', label: 'Neutral', color: 'text-gray-600' },
  { value: 'negative', label: 'Negative', color: 'text-red-600' },
  { value: 'unknown', label: 'Unknown', color: 'text-gray-400' },
];

export function TimelineFilters({ onFilterChange, onReset }: TimelineFiltersProps) {
  const [filters, setFilters] = useState<TimelineQuery>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterUpdate = (key: keyof TimelineQuery, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    setFilters({});
    onReset();
  };

  const toggleEventType = (eventType: TimelineEventType) => {
    const current = filters.eventTypes || [];
    const newEventTypes = current.includes(eventType)
      ? current.filter((t) => t !== eventType)
      : [...current, eventType];
    handleFilterUpdate('eventTypes', newEventTypes.length > 0 ? newEventTypes : undefined);
  };

  const toggleSourceSystem = (source: TimelineSourceSystem) => {
    const current = filters.sourceSystems || [];
    const newSources = current.includes(source)
      ? current.filter((s) => s !== source)
      : [...current, source];
    handleFilterUpdate('sourceSystems', newSources.length > 0 ? newSources : undefined);
  };

  const toggleSentiment = (sentiment: TimelineSentiment) => {
    const current = filters.sentiments || [];
    const newSentiments = current.includes(sentiment)
      ? current.filter((s) => s !== sentiment)
      : [...current, sentiment];
    handleFilterUpdate('sentiments', newSentiments.length > 0 ? newSentiments : undefined);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Search
        </label>
        <input
          type="text"
          placeholder="Search title or description..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          value={filters.searchQuery || ''}
          onChange={(e) =>
            handleFilterUpdate('searchQuery', e.target.value || undefined)
          }
        />
      </div>

      {isExpanded && (
        <>
          {/* Time Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeRange"
                  checked={filters.last30Days === true}
                  onChange={() => {
                    handleFilterUpdate('last30Days', true);
                    handleFilterUpdate('last90Days', undefined);
                    handleFilterUpdate('startDate', undefined);
                    handleFilterUpdate('endDate', undefined);
                  }}
                />
                <span className="text-sm text-gray-700">Last 30 days</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeRange"
                  checked={filters.last90Days === true}
                  onChange={() => {
                    handleFilterUpdate('last90Days', true);
                    handleFilterUpdate('last30Days', undefined);
                    handleFilterUpdate('startDate', undefined);
                    handleFilterUpdate('endDate', undefined);
                  }}
                />
                <span className="text-sm text-gray-700">Last 90 days</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeRange"
                  checked={
                    !filters.last30Days &&
                    !filters.last90Days
                  }
                  onChange={() => {
                    handleFilterUpdate('last30Days', undefined);
                    handleFilterUpdate('last90Days', undefined);
                  }}
                />
                <span className="text-sm text-gray-700">All time</span>
              </label>
            </div>
          </div>

          {/* Sentiments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sentiment
            </label>
            <div className="space-y-2">
              {sentimentOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.sentiments?.includes(option.value) || false}
                    onChange={() => toggleSentiment(option.value)}
                  />
                  <span className={`text-sm ${option.color}`}>
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Event Types */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Types
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {eventTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.eventTypes?.includes(option.value) || false}
                    onChange={() => toggleEventType(option.value)}
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                  <span className="text-xs text-gray-500">({option.category})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Source Systems */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Source Systems
            </label>
            <div className="space-y-2">
              {sourceSystemOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={
                      filters.sourceSystems?.includes(option.value) || false
                    }
                    onChange={() => toggleSourceSystem(option.value)}
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Relevance Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Relevance Score: {filters.minRelevanceScore ? Math.round(filters.minRelevanceScore * 100) : 0}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={filters.minRelevanceScore || 0}
              onChange={(e) =>
                handleFilterUpdate(
                  'minRelevanceScore',
                  parseFloat(e.target.value) || undefined
                )
              }
              className="w-full"
            />
          </div>

          {/* Clustered Events */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasCluster === true}
                onChange={(e) =>
                  handleFilterUpdate('hasCluster', e.target.checked || undefined)
                }
              />
              <span className="text-sm text-gray-700">
                Only show clustered events
              </span>
            </label>
          </div>
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-200">
        <button
          onClick={handleApply}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors font-medium"
        >
          Reset
        </button>
      </div>

      {/* Active Filters Count */}
      {Object.keys(filters).length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {Object.keys(filters).length} filter(s) active
        </div>
      )}
    </div>
  );
}
