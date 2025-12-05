/**
 * Executive Digest Delivery History Component (Sprint S62)
 * Displays delivery log history with status and recipient details
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  type ExecDigestDeliveryLog,
  getDeliveryStatusLabel,
  getDeliveryStatusColor,
  getDeliveryStatusBgColor,
  formatDateTime,
  formatRelativeTime,
} from '@/lib/executiveDigestApi';
import { cn } from '@/lib/utils';
import {
  Send,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  Loader,
} from 'lucide-react';
import { useState } from 'react';

interface ExecDigestDeliveryHistoryProps {
  deliveryLogs: ExecDigestDeliveryLog[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export function ExecDigestDeliveryHistory({
  deliveryLogs,
  isLoading,
  onLoadMore,
  hasMore,
  className,
}: ExecDigestDeliveryHistoryProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const toggleExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getStatusIcon = (status: ExecDigestDeliveryLog['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial_success':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'sending':
        return <Loader className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (deliveryLogs.length === 0 && !isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No delivery history yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Delivery logs will appear here after digests are sent.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Send className="h-4 w-4 text-indigo-600" />
          Delivery History ({deliveryLogs.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {deliveryLogs.map((log) => {
          const isExpanded = expandedLogs.has(log.id);

          return (
            <Collapsible
              key={log.id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(log.id)}
            >
              <div className="border rounded-lg">
                <CollapsibleTrigger asChild>
                  <div className="p-3 cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDateTime(log.completedAt || log.startedAt || log.createdAt)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatRelativeTime(log.completedAt || log.startedAt || log.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          className={cn(
                            getDeliveryStatusColor(log.status),
                            getDeliveryStatusBgColor(log.status)
                          )}
                        >
                          {getDeliveryStatusLabel(log.status)}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>
                            {log.successfulDeliveries}/{log.recipientsCount}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="p-3 pt-0 border-t space-y-3">
                    {/* Timing details */}
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      {log.scheduledAt && (
                        <div>
                          <div className="text-gray-500">Scheduled</div>
                          <div className="font-medium">{formatDateTime(log.scheduledAt)}</div>
                        </div>
                      )}
                      {log.startedAt && (
                        <div>
                          <div className="text-gray-500">Started</div>
                          <div className="font-medium">{formatDateTime(log.startedAt)}</div>
                        </div>
                      )}
                      {log.completedAt && (
                        <div>
                          <div className="text-gray-500">Completed</div>
                          <div className="font-medium">{formatDateTime(log.completedAt)}</div>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>{log.successfulDeliveries} successful</span>
                      </div>
                      {log.failedDeliveries > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          <span>{log.failedDeliveries} failed</span>
                        </div>
                      )}
                      {log.pdfStoragePath && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <FileText className="h-3 w-3" />
                          <span>
                            PDF {log.pdfSizeBytes ? `(${Math.round(log.pdfSizeBytes / 1024)}KB)` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Error message */}
                    {log.errorMessage && (
                      <div className="p-2 rounded bg-red-50 text-red-700 text-xs">
                        {log.errorMessage}
                      </div>
                    )}

                    {/* Recipient results */}
                    {log.recipientResults && log.recipientResults.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-medium">Recipients:</div>
                        <div className="space-y-1">
                          {log.recipientResults.map((result, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded bg-gray-50 text-xs"
                            >
                              <span className="text-gray-700">{result.email}</span>
                              <div className="flex items-center gap-2">
                                {result.status === 'success' ? (
                                  <Badge variant="outline" className="text-green-600 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Sent
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-600 border-red-200">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                                {result.sentAt && (
                                  <span className="text-gray-400">
                                    {formatRelativeTime(result.sentAt)}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}

        {/* Load More */}
        {hasMore && (
          <div className="pt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
