/**
 * Strategic Audit Log Timeline Component (Sprint S65)
 * Displays activity timeline for strategic intelligence reports
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  type StrategicAuditLogEntry,
  getEventLabel,
  getStatusLabel,
  getSectionTypeLabel,
  formatRelativeTime,
  formatDuration,
  formatTokens,
} from '@/lib/strategicIntelligenceApi';
import {
  Plus,
  Edit,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Database,
  Trash2,
  Check,
  Send,
  Archive,
  User,
  Clock,
  Zap,
} from 'lucide-react';

interface StrategicAuditLogTimelineProps {
  logs: StrategicAuditLogEntry[];
  showReportInfo?: boolean;
}

export function StrategicAuditLogTimeline({
  logs,
  showReportInfo: _showReportInfo = false,
}: StrategicAuditLogTimelineProps) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No activity recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            {/* Events */}
            <div className="space-y-6">
              {logs.map((log, index) => (
                <TimelineEvent
                  key={log.id}
                  log={log}
                  isFirst={index === 0}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TimelineEventProps {
  log: StrategicAuditLogEntry;
  isFirst: boolean;
}

function TimelineEvent({ log, isFirst }: TimelineEventProps) {
  const { icon: IconComponent, color } = getEventIcon(log.eventType);

  return (
    <div className="relative pl-10">
      {/* Event icon */}
      <div
        className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${color} ${
          isFirst ? 'ring-2 ring-offset-2 ring-offset-background ring-primary' : ''
        }`}
      >
        <IconComponent className="h-4 w-4 text-white" />
      </div>

      {/* Event content */}
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-start justify-between mb-1">
          <span className="font-medium">{getEventLabel(log.eventType)}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(log.createdAt)}
          </span>
        </div>

        {/* Status change */}
        {log.previousStatus && log.newStatus && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline">{getStatusLabel(log.previousStatus)}</Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="default">{getStatusLabel(log.newStatus)}</Badge>
          </div>
        )}

        {/* Section info */}
        {log.sectionType && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">
              {getSectionTypeLabel(log.sectionType)}
            </Badge>
          </div>
        )}

        {/* User info */}
        {log.userEmail && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <User className="h-3 w-3" />
            <span>{log.userEmail}</span>
          </div>
        )}

        {/* Metrics */}
        {(log.tokensUsed || log.durationMs) && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {log.tokensUsed && (
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>{formatTokens(log.tokensUsed)} tokens</span>
              </div>
            )}
            {log.durationMs && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatDuration(log.durationMs)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getEventIcon(
  eventType: string
): { icon: typeof Plus; color: string } {
  const iconMap: Record<
    string,
    { icon: typeof Plus; color: string }
  > = {
    created: { icon: Plus, color: 'bg-blue-500' },
    updated: { icon: Edit, color: 'bg-yellow-500' },
    generated: { icon: Sparkles, color: 'bg-purple-500' },
    regenerated: { icon: RefreshCw, color: 'bg-orange-500' },
    approved: { icon: Check, color: 'bg-green-500' },
    published: { icon: Send, color: 'bg-emerald-500' },
    archived: { icon: Archive, color: 'bg-gray-500' },
    deleted: { icon: Trash2, color: 'bg-red-500' },
    exported: { icon: Database, color: 'bg-indigo-500' },
  };

  return iconMap[eventType] || { icon: Plus, color: 'bg-blue-500' };
}
