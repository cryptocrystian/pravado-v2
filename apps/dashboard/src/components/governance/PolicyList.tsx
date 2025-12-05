/**
 * Policy List Component (Sprint S59)
 * Table display for governance policies with actions
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SeverityBadge } from './SeverityBadge';
import { CategoryBadge } from './CategoryBadge';
import type { GovernancePolicy, GovernancePoliciesQuery } from '@/lib/governanceApi';
import { getScopeLabel, formatRelativeTime } from '@/lib/governanceApi';
import { Plus, Edit, Trash2, Archive, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface PolicyListProps {
  policies: GovernancePolicy[];
  total: number;
  hasMore: boolean;
  loading?: boolean;
  query: GovernancePoliciesQuery;
  onQueryChange: (query: GovernancePoliciesQuery) => void;
  onPolicyClick?: (policy: GovernancePolicy) => void;
  onCreateClick?: () => void;
  onEditClick?: (policy: GovernancePolicy) => void;
  onDeleteClick?: (policy: GovernancePolicy) => void;
  onArchiveClick?: (policy: GovernancePolicy) => void;
}

export function PolicyList({
  policies,
  total,
  hasMore,
  loading,
  query,
  onQueryChange,
  onPolicyClick,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onArchiveClick,
}: PolicyListProps) {
  const limit = query.limit || 20;
  const offset = query.offset || 0;
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading policies...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Governance Policies</CardTitle>
        {onCreateClick && (
          <Button onClick={onCreateClick} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Create Policy
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {policies.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No policies found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first policy to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Policy
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scope
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {policies.map((policy) => (
                    <tr
                      key={policy.id}
                      onClick={() => onPolicyClick?.(policy)}
                      className={`hover:bg-gray-50 ${onPolicyClick ? 'cursor-pointer' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{policy.name}</div>
                          <div className="text-xs text-gray-500 font-mono">{policy.key}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <CategoryBadge category={policy.category} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {getScopeLabel(policy.scope)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <SeverityBadge severity={policy.severity} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            policy.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatRelativeTime(policy.updatedAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {onPolicyClick && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPolicyClick(policy);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {onEditClick && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditClick(policy);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {onArchiveClick && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onArchiveClick(policy);
                              }}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                          {onDeleteClick && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteClick(policy);
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
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
                Showing {offset + 1} - {Math.min(offset + policies.length, total)} of {total}
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
