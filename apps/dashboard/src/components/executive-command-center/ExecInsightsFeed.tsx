/**
 * Executive Insights Feed Component (Sprint S61)
 * Scrollable feed of insights grouped by source and severity
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  type ExecDashboardInsight,
  type ExecInsightSourceSystem,
  getSourceSystemLabel,
  getSourceSystemColor,
  formatRelativeTime,
} from '@/lib/executiveCommandCenterApi';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ExecInsightsFeedProps {
  insights: ExecDashboardInsight[];
  loading?: boolean;
  onFilterChange?: (filters: { sourceSystem?: ExecInsightSourceSystem; isRisk?: boolean; isOpportunity?: boolean }) => void;
  className?: string;
}

function getSeverityBadge(severity: number, isRisk: boolean, isOpportunity: boolean) {
  if (isRisk) {
    if (severity >= 80) return { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-200' };
    if (severity >= 60) return { label: 'High', className: 'bg-orange-100 text-orange-800 border-orange-200' };
    if (severity >= 40) return { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    return { label: 'Low', className: 'bg-green-100 text-green-800 border-green-200' };
  }
  if (isOpportunity) {
    if (severity >= 80) return { label: 'High Impact', className: 'bg-green-100 text-green-800 border-green-200' };
    if (severity >= 60) return { label: 'Medium Impact', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    return { label: 'Low Impact', className: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
  return { label: 'Info', className: 'bg-gray-100 text-gray-800 border-gray-200' };
}

export function ExecInsightsFeed({
  insights,
  loading,
  onFilterChange: _onFilterChange,
  className,
}: ExecInsightsFeedProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'risks' | 'opportunities'>('all');
  const [sourceFilter, setSourceFilter] = useState<ExecInsightSourceSystem | 'all'>('all');

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  // Filter insights
  const filteredInsights = insights.filter((insight) => {
    if (filter === 'risks' && !insight.isRisk) return false;
    if (filter === 'opportunities' && !insight.isOpportunity) return false;
    if (sourceFilter !== 'all' && insight.sourceSystem !== sourceFilter) return false;
    return true;
  });

  // Get unique source systems for filter dropdown
  const sourceSystems = Array.from(new Set(insights.map((i) => i.sourceSystem)));

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading insights...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights Feed
            <Badge variant="secondary">{filteredInsights.length}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="w-[130px] h-8">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Insights</SelectItem>
                <SelectItem value="risks">Risks Only</SelectItem>
                <SelectItem value="opportunities">Opportunities</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sourceFilter}
              onValueChange={(v) => setSourceFilter(v as typeof sourceFilter)}
            >
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {sourceSystems.map((source) => (
                  <SelectItem key={source} value={source}>
                    {getSourceSystemLabel(source)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
        {filteredInsights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No insights match the current filters.
          </div>
        ) : (
          filteredInsights.map((insight) => {
            const severityBadge = getSeverityBadge(
              insight.severityOrImpact,
              insight.isRisk,
              insight.isOpportunity
            );
            const isExpanded = expanded.has(insight.id);

            return (
              <div
                key={insight.id}
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  insight.isRisk && 'border-red-100 bg-red-50/30',
                  insight.isOpportunity && 'border-green-100 bg-green-50/30',
                  !insight.isRisk && !insight.isOpportunity && 'border-gray-100 bg-gray-50/30',
                  insight.isTopInsight && 'ring-1 ring-yellow-300'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {insight.isRisk ? (
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                    ) : insight.isOpportunity ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 line-clamp-2">
                        {insight.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={cn('text-xs', getSourceSystemColor(insight.sourceSystem))}
                        >
                          {getSourceSystemLabel(insight.sourceSystem)}
                        </Badge>
                        <Badge variant="outline" className={cn('text-xs', severityBadge.className)}>
                          {severityBadge.label}
                        </Badge>
                        {insight.isTopInsight && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            Top Insight
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(insight.id)}
                    className="flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {/* Expanded Content */}
                {isExpanded && insight.description && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">{insight.description}</p>
                    {insight.linkUrl && (
                      <a
                        href={insight.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline"
                      >
                        View Details
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {formatRelativeTime(insight.createdAt)}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
