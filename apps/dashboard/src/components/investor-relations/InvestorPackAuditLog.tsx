/**
 * Investor Pack Audit Log Component (Sprint S64)
 * Displays audit trail for pack actions
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type InvestorPackAuditLog, formatRelativeTime } from '@/lib/investorRelationsApi';
import { cn } from '@/lib/utils';
import {
  History,
  Plus,
  Edit,
  RefreshCw,
  Send,
  Archive,
  HelpCircle,
  FileText,
  Settings,
} from 'lucide-react';
import type { InvestorEventType } from '@pravado/types';

interface InvestorPackAuditLogProps {
  auditLogs: InvestorPackAuditLog[];
  className?: string;
}

const ACTION_CONFIG: Record<
  InvestorEventType,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  created: { icon: Plus, color: 'green', label: 'Created' },
  updated: { icon: Edit, color: 'blue', label: 'Updated' },
  status_changed: { icon: Settings, color: 'indigo', label: 'Status Changed' },
  section_generated: { icon: RefreshCw, color: 'indigo', label: 'Section Generated' },
  section_regenerated: { icon: RefreshCw, color: 'blue', label: 'Section Regenerated' },
  section_edited: { icon: FileText, color: 'yellow', label: 'Section Edited' },
  qna_generated: { icon: HelpCircle, color: 'purple', label: 'Q&A Generated' },
  qna_created: { icon: HelpCircle, color: 'green', label: 'Q&A Created' },
  published: { icon: Send, color: 'green', label: 'Published' },
  archived: { icon: Archive, color: 'gray', label: 'Archived' },
};

export function InvestorPackAuditLogComponent({ auditLogs, className }: InvestorPackAuditLogProps) {
  if (auditLogs.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No activity recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4 text-indigo-600" />
          Activity Log ({auditLogs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-4">
            {auditLogs.map((log) => {
              const config = ACTION_CONFIG[log.eventType] || {
                icon: History,
                color: 'gray',
                label: log.eventType,
              };
              const Icon = config.icon;

              return (
                <div key={log.id} className="relative flex gap-4 pl-8">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      'absolute left-2 w-4 h-4 rounded-full border-2 bg-white',
                      config.color === 'green' && 'border-green-500',
                      config.color === 'blue' && 'border-blue-500',
                      config.color === 'indigo' && 'border-indigo-500',
                      config.color === 'yellow' && 'border-yellow-500',
                      config.color === 'purple' && 'border-purple-500',
                      config.color === 'red' && 'border-red-500',
                      config.color === 'gray' && 'border-gray-400'
                    )}
                  />

                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn(
                            'h-4 w-4',
                            config.color === 'green' && 'text-green-600',
                            config.color === 'blue' && 'text-blue-600',
                            config.color === 'indigo' && 'text-indigo-600',
                            config.color === 'yellow' && 'text-yellow-600',
                            config.color === 'purple' && 'text-purple-600',
                            config.color === 'red' && 'text-red-600',
                            config.color === 'gray' && 'text-gray-500'
                          )}
                        />
                        <Badge variant="secondary" className="text-xs">
                          {config.label}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(log.createdAt)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      {log.userEmail ? (
                        <span className="font-medium">{log.userEmail}</span>
                      ) : (
                        <span className="text-gray-400">System</span>
                      )}
                      {' performed '}
                      <span className="font-medium">{log.eventType.replace(/_/g, ' ')}</span>
                    </div>

                    {/* Show token usage if present */}
                    {log.tokensUsed && (
                      <div className="mt-1 text-xs text-gray-400">
                        {log.tokensUsed.toLocaleString()} tokens used
                        {log.durationMs && ` | ${(log.durationMs / 1000).toFixed(1)}s`}
                      </div>
                    )}

                    {/* Show relevant details */}
                    {log.detailsJson && Object.keys(log.detailsJson).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        <details>
                          <summary className="cursor-pointer hover:text-gray-700">
                            View details
                          </summary>
                          <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.detailsJson, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
