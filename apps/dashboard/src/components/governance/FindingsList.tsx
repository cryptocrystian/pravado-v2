/**
 * Findings List Component (Sprint S59)
 * Table display for governance findings with status filters and actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeverityBadge } from './SeverityBadge';
import { StatusBadge } from './StatusBadge';
import type {
  GovernanceFinding,
  GovernanceFindingsQuery,
  GovernanceFindingStatus,
} from '@/lib/governanceApi';
import { formatRelativeTime, getTargetSystemLabel } from '@/lib/governanceApi';
import {
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface FindingsListProps {
  findings: GovernanceFinding[];
  total: number;
  hasMore: boolean;
  loading?: boolean;
  query: GovernanceFindingsQuery;
  onQueryChange: (query: GovernanceFindingsQuery) => void;
  onFindingClick?: (finding: GovernanceFinding) => void;
  onAcknowledgeClick?: (finding: GovernanceFinding) => void;
  onResolveClick?: (finding: GovernanceFinding) => void;
  onDismissClick?: (finding: GovernanceFinding) => void;
  onEscalateClick?: (finding: GovernanceFinding) => void;
}

const statusFilters: { value: GovernanceFindingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export function FindingsList({
  findings,
  total,
  hasMore,
  loading,
  query,
  onQueryChange,
  onFindingClick,
  onAcknowledgeClick,
  onResolveClick,
  onDismissClick,
  onEscalateClick,
}: FindingsListProps) {
  const limit = query.limit || 20;
  const offset = query.offset || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const handleStatusFilter = (status: GovernanceFindingStatus | 'all') => {
    onQueryChange({
      ...query,
      status: status === 'all' ? undefined : status,
      offset: 0,
    });
  };

  const handlePrevPage = () => {
    if (offset >= limit) {
      onQueryChange({ ...query, offset: offset - limit });
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      onQueryChange({ ...query, offset: offset + limit });
    }
  };

  const currentStatus = query.status || 'all';

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading findings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Compliance Findings</CardTitle>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-gray-400 mr-2" />
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={currentStatus === filter.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => handleStatusFilter(filter.value)}
                className="text-xs"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {findings.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No findings found</p>
            <p className="text-sm text-gray-400 mt-1">
              {query.status ? 'Try changing the status filter' : 'No compliance issues detected'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Finding
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Detected
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {findings.map((finding) => (
                    <tr
                      key={finding.id}
                      onClick={() => onFindingClick?.(finding)}
                      className={`hover:bg-gray-50 ${onFindingClick ? 'cursor-pointer' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {finding.summary}
                          </div>
                          {finding.details && (
                            <div className="text-xs text-gray-500 truncate">{finding.details}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <SeverityBadge severity={finding.severity} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={finding.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {getTargetSystemLabel(finding.sourceSystem)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeTime(finding.detectedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onFindingClick && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onFindingClick(finding);
                              }}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {finding.status === 'open' && onAcknowledgeClick && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAcknowledgeClick(finding);
                              }}
                              title="Acknowledge"
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(finding.status === 'open' ||
                            finding.status === 'acknowledged' ||
                            finding.status === 'in_progress') &&
                            onResolveClick && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onResolveClick(finding);
                                }}
                                title="Resolve"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          {(finding.status === 'open' || finding.status === 'acknowledged') &&
                            onEscalateClick && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEscalateClick(finding);
                                }}
                                title="Escalate"
                                className="text-purple-600 hover:text-purple-700"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            )}
                          {finding.status !== 'resolved' &&
                            finding.status !== 'dismissed' &&
                            onDismissClick && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDismissClick(finding);
                                }}
                                title="Dismiss"
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Showing {offset + 1} - {Math.min(offset + findings.length, total)} of {total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasMore}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
