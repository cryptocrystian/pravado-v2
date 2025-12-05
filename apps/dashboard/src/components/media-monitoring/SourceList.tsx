'use client';

/**
 * Source List Component (Sprint S40)
 * Displays and manages monitored publication sources
 */

import type { CreateSourceInput, MediaMonitoringSource } from '@pravado/types';
import { useState } from 'react';

interface SourceListProps {
  sources: MediaMonitoringSource[];
  selectedSourceId: string | null;
  onSelectSource: (source: MediaMonitoringSource | null) => void;
  onAddSource: (input: CreateSourceInput) => Promise<void>;
  onDeactivateSource: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export function SourceList({
  sources,
  selectedSourceId,
  onSelectSource,
  onAddSource,
  onDeactivateSource,
  isLoading,
}: SourceListProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSource = async () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) return;

    setIsAdding(true);
    try {
      await onAddSource({
        name: newSourceName.trim(),
        url: newSourceUrl.trim(),
      });
      setNewSourceName('');
      setNewSourceUrl('');
      setShowAddForm(false);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900">Sources</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-md bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          {showAddForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {/* Add Source Form */}
      {showAddForm && (
        <div className="border-b border-gray-200 bg-white p-4">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Source Name
              </label>
              <input
                type="text"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="TechCrunch"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                URL
              </label>
              <input
                type="url"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="https://techcrunch.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleAddSource}
              disabled={isAdding || !newSourceName.trim() || !newSourceUrl.trim()}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isAdding ? 'Adding...' : 'Add Source'}
            </button>
          </div>
        </div>
      )}

      {/* Source List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : sources.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            No sources configured. Add a source to start monitoring.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {/* All Sources option */}
            <li>
              <button
                onClick={() => onSelectSource(null)}
                className={`w-full px-4 py-3 text-left transition-colors ${
                  selectedSourceId === null
                    ? 'bg-blue-50 border-l-2 border-blue-600'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div className="font-medium text-gray-900">All Sources</div>
                <div className="text-xs text-gray-500">
                  {sources.filter((s) => s.active).length} active sources
                </div>
              </button>
            </li>
            {/* Individual sources */}
            {sources.map((source) => (
              <li key={source.id}>
                <button
                  onClick={() => onSelectSource(source)}
                  className={`group w-full px-4 py-3 text-left transition-colors ${
                    selectedSourceId === source.id
                      ? 'bg-blue-50 border-l-2 border-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate">
                          {source.name}
                        </span>
                        {!source.active && (
                          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {source.url}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeactivateSource(source.id);
                      }}
                      className="ml-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                      title="Deactivate source"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
