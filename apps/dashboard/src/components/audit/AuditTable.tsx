'use client';

/**
 * Audit Table Component (Sprint S36)
 * Paginated table display for audit log entries
 */

import type { AuditLogEntry } from '@/lib/auditApi';
import { formatRelativeTime, getActorTypeDisplay } from '@/lib/auditApi';
import { AuditEventTypeBadge } from './AuditEventTypeBadge';
import { AuditSeverityBadge } from './AuditSeverityBadge';

interface AuditTableProps {
  entries: AuditLogEntry[];
  loading?: boolean;
  onEntryClick?: (entry: AuditLogEntry) => void;
}

export function AuditTable({ entries, loading, onEntryClick }: AuditTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-2 text-sm text-gray-500">Loading audit logs...</p>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No audit logs found</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Severity
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actor
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Details
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry) => (
            <tr
              key={entry.id}
              onClick={() => onEntryClick?.(entry)}
              className={`hover:bg-gray-50 ${onEntryClick ? 'cursor-pointer' : ''}`}
            >
              <td className="px-4 py-3 whitespace-nowrap">
                <AuditEventTypeBadge eventType={entry.eventType} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <AuditSeverityBadge severity={entry.severity} />
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                {getActorTypeDisplay(entry.actorType)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                {formatRelativeTime(entry.createdAt)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">
                {Object.keys(entry.context).length > 0
                  ? JSON.stringify(entry.context).slice(0, 50) + '...'
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
