'use client';

/**
 * Replay Configurator Component (Sprint S37)
 * Form for configuring replay filters
 */

import { useState } from 'react';

import type { AuditReplayFilters } from '@/lib/auditReplayApi';

interface ReplayConfiguratorProps {
  onStartReplay: (filters: AuditReplayFilters) => void;
  loading?: boolean;
}

export function ReplayConfigurator({ onStartReplay, loading }: ReplayConfiguratorProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [severity, setSeverity] = useState<string>('');

  const eventTypeOptions = [
    { value: 'content', label: 'Content Events' },
    { value: 'playbook', label: 'Playbook Events' },
    { value: 'billing', label: 'Billing Events' },
    { value: 'auth', label: 'Auth Events' },
    { value: 'llm', label: 'LLM Events' },
  ];

  const severityOptions = [
    { value: '', label: 'All Severities' },
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Warning' },
    { value: 'error', label: 'Error' },
    { value: 'critical', label: 'Critical' },
  ];

  const handleEventTypeChange = (value: string) => {
    setEventTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const filters: AuditReplayFilters = {};

    if (startDate) {
      filters.startDate = new Date(startDate).toISOString();
    }
    if (endDate) {
      filters.endDate = new Date(endDate).toISOString();
    }
    if (eventTypes.length > 0) {
      filters.entityTypes = eventTypes;
    }
    if (severity) {
      filters.severity = severity as 'info' | 'warning' | 'error' | 'critical';
    }

    onStartReplay(filters);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Replay</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Date
          </label>
          <input
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Date
          </label>
          <input
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Severity
          </label>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {severityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Types */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {eventTypeOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleEventTypeChange(opt.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                eventTypes.includes(opt.value)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Starting Replay...</span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Start Replay</span>
          </>
        )}
      </button>
    </form>
  );
}
