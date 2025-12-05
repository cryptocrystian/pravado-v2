'use client';

/**
 * Audit Filters Component (Sprint S36)
 * Filter panel for audit log queries
 */

import { useEffect, useState } from 'react';
import type { ActorType, AuditEventTypeMetadata, AuditQueryFilters, AuditSeverity } from '@/lib/auditApi';
import { getAuditEventTypes } from '@/lib/auditApi';

interface AuditFiltersProps {
  filters: AuditQueryFilters;
  onChange: (filters: AuditQueryFilters) => void;
  onSearch: () => void;
}

const severityOptions: AuditSeverity[] = ['info', 'warning', 'error', 'critical'];
const actorTypeOptions: ActorType[] = ['user', 'system', 'agent'];

export function AuditFilters({ filters, onChange, onSearch }: AuditFiltersProps) {
  const [eventTypes, setEventTypes] = useState<AuditEventTypeMetadata[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    loadEventTypes();
  }, []);

  async function loadEventTypes() {
    try {
      const data = await getAuditEventTypes();
      setEventTypes(data.eventTypes);
      setCategories(data.categories);
    } catch (error) {
      console.error('Failed to load event types:', error);
    }
  }

  const filteredEventTypes = selectedCategory
    ? eventTypes.filter((et) => et.category === selectedCategory)
    : eventTypes;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Filters</h3>

      {/* Search */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
        <input
          type="text"
          placeholder="Search in context..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate?.split('T')[0] || ''}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value ? `${e.target.value}T00:00:00Z` : undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate?.split('T')[0] || ''}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value ? `${e.target.value}T23:59:59Z` : undefined })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Severity */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
        <select
          value={Array.isArray(filters.severity) ? filters.severity[0] : filters.severity || ''}
          onChange={(e) => onChange({ ...filters, severity: e.target.value as AuditSeverity || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All severities</option>
          {severityOptions.map((sev) => (
            <option key={sev} value={sev}>
              {sev.charAt(0).toUpperCase() + sev.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Actor Type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Actor Type</label>
        <select
          value={Array.isArray(filters.actorType) ? filters.actorType[0] : filters.actorType || ''}
          onChange={(e) => onChange({ ...filters, actorType: e.target.value as ActorType || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All actors</option>
          {actorTypeOptions.map((actor) => (
            <option key={actor} value={actor}>
              {actor.charAt(0).toUpperCase() + actor.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            onChange({ ...filters, eventType: undefined });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Event Type */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Event Type</label>
        <select
          value={Array.isArray(filters.eventType) ? filters.eventType[0] : filters.eventType || ''}
          onChange={(e) => onChange({ ...filters, eventType: e.target.value || undefined })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All event types</option>
          {filteredEventTypes.map((et) => (
            <option key={et.type} value={et.type}>
              {et.description}
            </option>
          ))}
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onSearch}
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Apply Filters
        </button>
        <button
          onClick={() => {
            onChange({});
            setSelectedCategory('');
          }}
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
