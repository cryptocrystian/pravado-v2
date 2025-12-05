/**
 * CrisisSignalList Component (Sprint S55)
 *
 * Displays a list of crisis signals with filtering, severity indicators,
 * and quick acknowledgment actions
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Radio,
  RefreshCw,
  Zap,
} from 'lucide-react';
import type { CrisisSignal, CrisisSeverity, CrisisSourceSystem } from '@pravado/types';
import { SEVERITY_COLORS, formatTimeAgo } from '@/lib/crisisApi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CrisisSignalListProps {
  signals: CrisisSignal[];
  isLoading?: boolean;
  onAcknowledge?: (signal: CrisisSignal, linkToIncident?: string) => Promise<void>;
  onCreateIncident?: (signal: CrisisSignal) => void;
  onViewDetails?: (signal: CrisisSignal) => void;
  onRefresh?: () => void;
  maxHeight?: string;
  className?: string;
}

const SOURCE_LABELS: Record<CrisisSourceSystem, string> = {
  media_monitoring: 'Media Monitoring',
  media_crawling: 'Media Crawling',
  media_alerts: 'Media Alerts',
  journalist_timeline: 'Journalist Timeline',
  media_performance: 'Media Performance',
  competitive_intel: 'Competitive Intel',
  media_briefing: 'Media Briefing',
  manual_entry: 'Manual Entry',
  external_api: 'External API',
  social_listening: 'Social Listening',
};

export default function CrisisSignalList({
  signals,
  isLoading = false,
  onAcknowledge,
  onCreateIncident,
  onViewDetails,
  onRefresh,
  maxHeight = '600px',
  className = '',
}: CrisisSignalListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<CrisisSeverity[]>([]);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const filteredSignals = signals.filter((signal) => {
    if (showActiveOnly && !signal.isActive) return false;
    if (filterSeverity.length > 0 && !filterSeverity.includes(signal.severity)) {
      return false;
    }
    return true;
  });

  const handleAcknowledge = useCallback(
    async (signal: CrisisSignal) => {
      if (!onAcknowledge) return;
      setAcknowledging(signal.id);
      try {
        await onAcknowledge(signal);
      } finally {
        setAcknowledging(null);
      }
    },
    [onAcknowledge]
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleSeverityFilter = (severity: CrisisSeverity) => {
    setFilterSeverity((prev) =>
      prev.includes(severity)
        ? prev.filter((s) => s !== severity)
        : [...prev, severity]
    );
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Crisis Signals</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {filteredSignals.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                  {filterSeverity.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1">
                      {filterSeverity.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Severity</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['severe', 'critical', 'high', 'medium', 'low'] as CrisisSeverity[]).map(
                  (severity) => (
                    <DropdownMenuCheckboxItem
                      key={severity}
                      checked={filterSeverity.includes(severity)}
                      onCheckedChange={() => toggleSeverityFilter(severity)}
                    >
                      <span className="capitalize">{severity}</span>
                    </DropdownMenuCheckboxItem>
                  )
                )}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showActiveOnly}
                  onCheckedChange={setShowActiveOnly}
                >
                  Active Only
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh */}
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw
                  className={cn('h-4 w-4', isLoading && 'animate-spin')}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea style={{ maxHeight }} className="px-4 pb-4">
          {filteredSignals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-3 text-green-500" />
              <p className="text-sm">No active crisis signals</p>
              <p className="text-xs mt-1">All systems are normal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSignals.map((signal) => {
                const severityColors = SEVERITY_COLORS[signal.severity];
                const isExpanded = expandedId === signal.id;

                return (
                  <div
                    key={signal.id}
                    className={cn(
                      'border rounded-lg p-3 transition-all',
                      signal.isEscalated && 'border-red-300 bg-red-50/30',
                      !signal.isActive && 'opacity-60'
                    )}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 uppercase text-xs font-semibold',
                              severityColors.bg,
                              severityColors.text
                            )}
                          >
                            {signal.severity}
                          </Badge>
                          <h4 className="font-medium text-sm truncate">
                            {signal.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(signal.createdAt)}</span>
                          <span className="text-gray-300">|</span>
                          <span>Confidence: {(signal.confidenceScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {signal.isEscalated && (
                          <Badge variant="destructive" className="text-xs">
                            Escalated
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleExpand(signal.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-3">
                        {/* Description */}
                        {signal.description && (
                          <p className="text-sm text-muted-foreground">
                            {signal.description}
                          </p>
                        )}

                        {/* Source Systems */}
                        <div className="flex flex-wrap gap-1">
                          {signal.sourceSystems.map((source, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs bg-blue-50"
                            >
                              <Radio className="h-3 w-3 mr-1" />
                              {SOURCE_LABELS[source] || source}
                            </Badge>
                          ))}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="text-muted-foreground">Priority</div>
                            <div className="font-semibold">
                              {signal.priorityScore.toFixed(1)}
                            </div>
                          </div>
                          {signal.mentionVelocity !== undefined && (
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-muted-foreground">Velocity</div>
                              <div className="font-semibold flex items-center justify-center gap-1">
                                <Zap className="h-3 w-3" />
                                {signal.mentionVelocity.toFixed(1)}/hr
                              </div>
                            </div>
                          )}
                          {signal.sentimentScore !== undefined && (
                            <div className="text-center p-2 bg-gray-50 rounded">
                              <div className="text-muted-foreground">Sentiment</div>
                              <div
                                className={cn(
                                  'font-semibold',
                                  signal.sentimentScore < -0.3
                                    ? 'text-red-600'
                                    : signal.sentimentScore > 0.3
                                      ? 'text-green-600'
                                      : 'text-yellow-600'
                                )}
                              >
                                {signal.sentimentScore.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          {onViewDetails && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewDetails(signal)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          )}
                          {signal.isActive && onCreateIncident && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onCreateIncident(signal)}
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              Create Incident
                            </Button>
                          )}
                          {signal.isActive && onAcknowledge && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAcknowledge(signal)}
                              disabled={acknowledging === signal.id}
                            >
                              {acknowledging === signal.id ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                              )}
                              Acknowledge
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
