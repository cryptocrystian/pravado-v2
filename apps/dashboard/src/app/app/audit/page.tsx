/**
 * Audit Log Viewer Page (Sprint S35 + S36)
 * Comprehensive audit log viewing with filters, search, statistics, and CSV export
 */

'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';

import {
  getAuditLogs,
  getAuditStats,
  getAuditEventTypes,
  formatRelativeTime,
  getSeverityColor,
  formatEventType,
  getActorTypeDisplay,
  createAuditExport,
  getExportStatus,
  getExportDownloadUrl,
  formatFileSize,
  type AuditLogEntry,
  type AuditQueryFilters,
  type AuditStats,
  type AuditEventTypesResponse,
  type AuditSeverity,
  type ActorType,
  type AuditExportJob,
} from '@/lib/auditApi';

export default function AuditLogPage() {
  // State
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [eventTypes, setEventTypes] = useState<AuditEventTypesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<AuditQueryFilters>({
    limit: 25,
    offset: 0,
  });
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  // Export state (S36)
  const [exportJob, setExportJob] = useState<AuditExportJob | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [logsResult, statsResult, typesResult] = await Promise.all([
        getAuditLogs(filters),
        getAuditStats(30),
        getAuditEventTypes(),
      ]);

      setEntries(logsResult.entries);
      setTotal(logsResult.total);
      setHasMore(logsResult.hasMore);
      setStats(statsResult);
      setEventTypes(typesResult);
    } catch (err: unknown) {
      console.error('Failed to load audit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load audit data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle filter changes
  const updateFilter = (key: keyof AuditQueryFilters, value: AuditQueryFilters[keyof AuditQueryFilters]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filter changes
    }));
  };

  // Handle pagination
  const handleNextPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 25),
    }));
  };

  const handlePrevPage = () => {
    setFilters((prev) => ({
      ...prev,
      offset: Math.max(0, (prev.offset || 0) - (prev.limit || 25)),
    }));
  };

  // S36: Handle export
  const handleExport = async () => {
    try {
      setExportLoading(true);
      const result = await createAuditExport(filters);
      setShowExportModal(true);

      // Poll for status
      const pollStatus = async () => {
        try {
          const status = await getExportStatus(result.jobId);
          setExportJob(status.job);

          if (status.job.status === 'queued' || status.job.status === 'processing') {
            setTimeout(pollStatus, 2000);
          }
        } catch (err) {
          console.error('Failed to get export status:', err);
        }
      };

      pollStatus();
    } catch (err: unknown) {
      console.error('Failed to create export:', err);
      setError(err instanceof Error ? err.message : 'Failed to create export');
    } finally {
      setExportLoading(false);
    }
  };

  // Get severity badge styles
  const getSeverityBadgeClass = (severity: AuditSeverity) => {
    const color = getSeverityColor(severity);
    const baseClass = 'px-2 py-1 rounded-full text-xs font-medium';

    switch (color) {
      case 'blue':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'yellow':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'red':
        return `${baseClass} bg-red-100 text-red-800`;
      case 'purple':
        return `${baseClass} bg-purple-100 text-purple-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  // Get actor type badge styles
  const getActorBadgeClass = (actorType: ActorType) => {
    const baseClass = 'px-2 py-1 rounded text-xs font-medium';

    switch (actorType) {
      case 'user':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'system':
        return `${baseClass} bg-gray-100 text-gray-800`;
      case 'agent':
        return `${baseClass} bg-indigo-100 text-indigo-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  // Render loading state
  if (loading && entries.length === 0) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && entries.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
          <p className="text-gray-600">
            Track and review all activity across your organization
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {exportLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export CSV</span>
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Total Events (30d)</div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalEvents.toLocaleString()}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Errors</div>
            <div className="text-2xl font-bold text-red-600">
              {stats.bySeverity.error.toLocaleString()}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Warnings</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.bySeverity.warning.toLocaleString()}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Critical</div>
            <div className="text-2xl font-bold text-purple-600">
              {stats.bySeverity.critical.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search in context..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={filters.severity as string || ''}
              onChange={(e) => updateFilter('severity', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Actor Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actor Type
            </label>
            <select
              value={filters.actorType as string || ''}
              onChange={(e) => updateFilter('actorType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actors</option>
              <option value="user">User</option>
              <option value="system">System</option>
              <option value="agent">AI Agent</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.eventType as string || ''}
              onChange={(e) => updateFilter('eventType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {eventTypes?.categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate?.split('T')[0] || ''}
              onChange={(e) =>
                updateFilter(
                  'startDate',
                  e.target.value ? new Date(e.target.value).toISOString() : undefined
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No audit logs found matching your filters.
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatRelativeTime(entry.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatEventType(entry.eventType)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.eventType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getSeverityBadgeClass(entry.severity)}>
                        {entry.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getActorBadgeClass(entry.actorType)}>
                        {getActorTypeDisplay(entry.actorType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {JSON.stringify(entry.context).slice(0, 50)}...
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {(filters.offset || 0) + 1} to{' '}
            {Math.min((filters.offset || 0) + entries.length, total)} of {total} results
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrevPage}
              disabled={(filters.offset || 0) === 0}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={!hasMore}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {formatEventType(selectedEntry.eventType)}
                  </h2>
                  <p className="text-sm text-gray-500">{selectedEntry.eventType}</p>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Severity</div>
                    <span className={getSeverityBadgeClass(selectedEntry.severity)}>
                      {selectedEntry.severity.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Actor</div>
                    <span className={getActorBadgeClass(selectedEntry.actorType)}>
                      {getActorTypeDisplay(selectedEntry.actorType)}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Timestamp</div>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedEntry.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Event ID</div>
                    <div className="text-sm text-gray-900 font-mono">
                      {selectedEntry.id}
                    </div>
                  </div>
                </div>

                {selectedEntry.userId && (
                  <div>
                    <div className="text-sm text-gray-600">User ID</div>
                    <div className="text-sm text-gray-900 font-mono">
                      {selectedEntry.userId}
                    </div>
                  </div>
                )}

                {selectedEntry.ipAddress && (
                  <div>
                    <div className="text-sm text-gray-600">IP Address</div>
                    <div className="text-sm text-gray-900 font-mono">
                      {selectedEntry.ipAddress}
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm text-gray-600 mb-2">Context</div>
                  <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedEntry.context, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Status Modal (S36) */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Export Status</h2>
                <button
                  onClick={() => {
                    setShowExportModal(false);
                    setExportJob(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {exportJob ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      exportJob.status === 'success' ? 'bg-green-100 text-green-800' :
                      exportJob.status === 'failed' ? 'bg-red-100 text-red-800' :
                      exportJob.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {exportJob.status.charAt(0).toUpperCase() + exportJob.status.slice(1)}
                    </span>
                  </div>

                  {exportJob.status === 'processing' && (
                    <div className="relative pt-1">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100">
                        <div className="animate-pulse bg-blue-500 h-full w-full" />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Processing audit logs...</p>
                    </div>
                  )}

                  {exportJob.rowCount !== null && exportJob.rowCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Records</span>
                      <span className="text-sm font-medium text-gray-900">
                        {exportJob.rowCount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {exportJob.fileSizeBytes && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">File Size</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatFileSize(exportJob.fileSizeBytes)}
                      </span>
                    </div>
                  )}

                  {exportJob.status === 'failed' && exportJob.errorMessage && (
                    <div className="p-3 bg-red-50 rounded-md">
                      <p className="text-sm text-red-700">{exportJob.errorMessage}</p>
                    </div>
                  )}

                  {exportJob.status === 'success' && (
                    <a
                      href={getExportDownloadUrl(exportJob.id)}
                      download
                      className="block w-full px-4 py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700"
                    >
                      Download CSV
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  <p className="mt-2 text-sm text-gray-500">Starting export...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
