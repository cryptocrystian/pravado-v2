/**
 * CrisisActionList Component (Sprint S55)
 *
 * Displays a list of crisis response actions with status management,
 * priority indicators, and quick workflow actions
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  ListTodo,
  Play,
  RefreshCw,
  Sparkles,
  ThumbsUp,
  User,
  X,
} from 'lucide-react';
import type {
  CrisisAction,
  CrisisActionStatus,
  CrisisUrgency,
} from '@pravado/types';
import {
  ACTION_STATUS_COLORS,
  ACTION_TYPE_LABELS,
  URGENCY_LABELS,
  formatTimeAgo,
  calculateUrgencyFromDue,
} from '@/lib/crisisApi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CrisisActionListProps {
  actions: CrisisAction[];
  isLoading?: boolean;
  onApprove?: (action: CrisisAction) => Promise<void>;
  onStart?: (action: CrisisAction) => Promise<void>;
  onComplete?: (action: CrisisAction, notes?: string) => Promise<void>;
  onReject?: (action: CrisisAction) => Promise<void>;
  onViewDetails?: (action: CrisisAction) => void;
  onRefresh?: () => void;
  maxHeight?: string;
  className?: string;
}

const URGENCY_COLORS: Record<CrisisUrgency, { bg: string; text: string }> = {
  immediate: { bg: 'bg-red-100', text: 'text-red-800' },
  urgent: { bg: 'bg-orange-100', text: 'text-orange-800' },
  normal: { bg: 'bg-blue-100', text: 'text-blue-800' },
  low: { bg: 'bg-gray-100', text: 'text-gray-600' },
};

export default function CrisisActionList({
  actions,
  isLoading = false,
  onApprove,
  onStart,
  onComplete,
  onReject,
  onViewDetails: _onViewDetails,
  onRefresh,
  maxHeight = '600px',
  className = '',
}: CrisisActionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CrisisActionStatus[]>([]);
  const [showAiOnly, setShowAiOnly] = useState(false);

  const filteredActions = actions.filter((action) => {
    if (filterStatus.length > 0 && !filterStatus.includes(action.status)) {
      return false;
    }
    if (showAiOnly && !action.isAiGenerated) return false;
    return true;
  });

  // Calculate completion stats
  const completedCount = actions.filter((a) => a.status === 'completed').length;
  const totalCount = actions.length;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleAction = useCallback(
    async (
      action: CrisisAction,
      handler?: (action: CrisisAction) => Promise<void>
    ) => {
      if (!handler) return;
      setProcessingId(action.id);
      try {
        await handler(action);
      } finally {
        setProcessingId(null);
      }
    },
    []
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleStatusFilter = (status: CrisisActionStatus) => {
    setFilterStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const getEffectiveUrgency = (action: CrisisAction): CrisisUrgency => {
    return action.urgency || calculateUrgencyFromDue(action.dueAt);
  };

  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="shrink-0 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">Response Actions</CardTitle>
            <Badge variant="secondary" className="ml-2">
              {filteredActions.length}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
                  Filter
                  {filterStatus.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1">
                      {filterStatus.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(
                  [
                    'recommended',
                    'approved',
                    'in_progress',
                    'completed',
                    'deferred',
                    'rejected',
                  ] as CrisisActionStatus[]
                ).map((status) => (
                  <DropdownMenuCheckboxItem
                    key={status}
                    checked={filterStatus.includes(status)}
                    onCheckedChange={() => toggleStatusFilter(status)}
                  >
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={showAiOnly}
                  onCheckedChange={setShowAiOnly}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Generated Only
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

        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {completedCount} of {totalCount} completed
              </span>
              <span>{completionRate.toFixed(0)}%</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-0">
        <ScrollArea style={{ maxHeight }} className="px-4 pb-4">
          {filteredActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mb-3 text-green-500" />
              <p className="text-sm">No pending actions</p>
              <p className="text-xs mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action) => {
                const statusColors = ACTION_STATUS_COLORS[action.status];
                const urgency = getEffectiveUrgency(action);
                const urgencyColors = URGENCY_COLORS[urgency];
                const isExpanded = expandedId === action.id;
                const isProcessing = processingId === action.id;

                return (
                  <div
                    key={action.id}
                    className={cn(
                      'border rounded-lg p-3 transition-all',
                      urgency === 'immediate' && 'border-red-300 bg-red-50/30',
                      urgency === 'urgent' && 'border-orange-300 bg-orange-50/30',
                      action.status === 'completed' && 'opacity-60'
                    )}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {action.isAiGenerated && (
                            <Sparkles className="h-4 w-4 text-purple-500 shrink-0" />
                          )}
                          <h4 className="font-medium text-sm truncate">
                            {action.title}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs capitalize',
                              statusColors.bg,
                              statusColors.text
                            )}
                          >
                            {action.status.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', urgencyColors.bg, urgencyColors.text)}
                          >
                            {URGENCY_LABELS[urgency]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {ACTION_TYPE_LABELS[action.actionType]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground">
                          P{action.priorityScore.toFixed(0)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => toggleExpand(action.id)}
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
                        {action.description && (
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {action.dueAt && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Due: {formatTimeAgo(action.dueAt)}</span>
                            </div>
                          )}
                          {action.assignedTo && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>Assigned</span>
                            </div>
                          )}
                          {action.estimatedDurationMins && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>~{action.estimatedDurationMins} min</span>
                            </div>
                          )}
                          {action.confidenceScore !== undefined && (
                            <div className="text-muted-foreground">
                              Confidence: {(action.confidenceScore * 100).toFixed(0)}%
                            </div>
                          )}
                        </div>

                        {/* Completion Notes */}
                        {action.completionNotes && (
                          <div className="p-2 bg-green-50 rounded text-sm text-green-800">
                            <strong>Outcome:</strong> {action.completionNotes}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2">
                          {action.status === 'recommended' && (
                            <>
                              {onReject && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => handleAction(action, onReject)}
                                  disabled={isProcessing}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              )}
                              {onApprove && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleAction(action, onApprove)}
                                  disabled={isProcessing}
                                >
                                  {isProcessing ? (
                                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                                  ) : (
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                  )}
                                  Approve
                                </Button>
                              )}
                            </>
                          )}
                          {action.status === 'approved' && onStart && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleAction(action, onStart)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Play className="h-4 w-4 mr-1" />
                              )}
                              Start
                            </Button>
                          )}
                          {action.status === 'in_progress' && onComplete && (
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleAction(action, onComplete)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                              )}
                              Complete
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
