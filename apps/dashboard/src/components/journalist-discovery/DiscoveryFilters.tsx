'use client';

/**
 * Discovery Filters Component (Sprint S48.2)
 * Filter panel for journalist discovery queries
 */

import type { DiscoveryQuery, DiscoveryStatus, DiscoverySourceType } from '@pravado/types';

interface DiscoveryFiltersProps {
  filters: DiscoveryQuery;
  onChange: (filters: DiscoveryQuery) => void;
  onSearch: () => void;
}

const statusOptions: DiscoveryStatus[] = ['pending', 'confirmed', 'merged', 'rejected'];
const sourceTypeOptions: DiscoverySourceType[] = [
  'article_author',
  'rss_feed',
  'social_profile',
  'staff_directory',
];

const beatOptions = [
  'technology',
  'business',
  'finance',
  'healthcare',
  'politics',
  'sports',
  'entertainment',
  'science',
  'education',
];

export function DiscoveryFilters({ filters, onChange, onSearch }: DiscoveryFiltersProps) {
  const handleStatusToggle = (status: DiscoveryStatus) => {
    const currentStatuses = Array.isArray(filters.status) ? filters.status : filters.status ? [filters.status] : [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s: DiscoveryStatus) => s !== status)
      : [...currentStatuses, status];
    onChange({ ...filters, status: newStatuses });
  };

  const handleSourceTypeToggle = (sourceType: DiscoverySourceType) => {
    const currentSourceTypes = Array.isArray(filters.sourceType) ? filters.sourceType : filters.sourceType ? [filters.sourceType] : [];
    const newSourceTypes = currentSourceTypes.includes(sourceType)
      ? currentSourceTypes.filter((st: DiscoverySourceType) => st !== sourceType)
      : [...currentSourceTypes, sourceType];
    onChange({ ...filters, sourceType: newSourceTypes });
  };

  const handleBeatToggle = (beat: string) => {
    const currentBeats = filters.beats || [];
    const newBeats = currentBeats.includes(beat)
      ? currentBeats.filter((b) => b !== beat)
      : [...currentBeats, beat];
    onChange({ ...filters, beats: newBeats });
  };

  const handleReset = () => {
    onChange({});
    onSearch();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Reset
        </button>
      </div>

      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
        <input
          type="text"
          placeholder="Search by name..."
          value={filters.q || ''}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Status Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
        <div className="space-y-2">
          {statusOptions.map((status) => (
            <label key={status} className="flex items-center">
              <input
                type="checkbox"
                checked={(Array.isArray(filters.status) && filters.status.includes(status)) || filters.status === status || false}
                onChange={() => handleStatusToggle(status)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 capitalize">{status}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Source Type Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Source Type</label>
        <div className="space-y-2">
          {sourceTypeOptions.map((sourceType) => (
            <label key={sourceType} className="flex items-center">
              <input
                type="checkbox"
                checked={(Array.isArray(filters.sourceType) && filters.sourceType.includes(sourceType)) || filters.sourceType === sourceType || false}
                onChange={() => handleSourceTypeToggle(sourceType)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                {sourceType === 'article_author' && 'Article Author'}
                {sourceType === 'rss_feed' && 'RSS Feed'}
                {sourceType === 'social_profile' && 'Social Profile'}
                {sourceType === 'staff_directory' && 'Staff Directory'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Confidence Score Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Min Confidence Score
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={(filters.minConfidenceScore || 0) * 100}
          onChange={(e) =>
            onChange({ ...filters, minConfidenceScore: parseInt(e.target.value) / 100 })
          }
          className="w-full"
        />
        <div className="text-xs text-gray-500 mt-1">
          {Math.round((filters.minConfidenceScore || 0) * 100)}%
        </div>
      </div>

      {/* Beats Filter */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Beats</label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {beatOptions.map((beat) => (
            <label key={beat} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.beats?.includes(beat) || false}
                onChange={() => handleBeatToggle(beat)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700 capitalize">{beat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Boolean Filters */}
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.hasEmail || false}
            onChange={(e) => onChange({ ...filters, hasEmail: e.target.checked || undefined })}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Has Email</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.hasSocialLinks || false}
            onChange={(e) =>
              onChange({ ...filters, hasSocialLinks: e.target.checked || undefined })
            }
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Has Social Links</span>
        </label>
      </div>

      {/* Search Button */}
      <button
        onClick={onSearch}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Apply Filters
      </button>
    </div>
  );
}
