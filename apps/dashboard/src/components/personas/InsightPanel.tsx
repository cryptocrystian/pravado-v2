/**
 * InsightPanel Component (Sprint S51.2)
 * Displays persona insights with filtering, sorting, and evidence expansion
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AudiencePersonaInsight } from '@pravado/types';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Zap,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface InsightPanelProps {
  insights: AudiencePersonaInsight[];
  onInsightClick?: (insight: AudiencePersonaInsight) => void;
}

type TabValue = 'all' | 'by-source' | 'actionable';
type SortBy = 'confidence' | 'impact' | 'recent';

export function InsightPanel({ insights, onInsightClick }: InsightPanelProps) {
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [sortBy, setSortBy] = useState<SortBy>('confidence');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  // Filter insights based on active tab
  const filteredInsights = useMemo(() => {
    if (activeTab === 'actionable') {
      return insights.filter((i) => i.isActionable);
    }
    return insights;
  }, [insights, activeTab]);

  // Sort insights
  const sortedInsights = useMemo(() => {
    const sorted = [...filteredInsights];
    switch (sortBy) {
      case 'confidence':
        return sorted.sort((a, b) => (b.confidenceScore || 0) - (a.confidenceScore || 0));
      case 'impact':
        return sorted.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
      case 'recent':
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      default:
        return sorted;
    }
  }, [filteredInsights, sortBy]);

  const toggleExpanded = (id: string) => {
    setExpandedInsights((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'behavior':
        return <Zap className="h-4 w-4" />;
      case 'preference':
        return <Lightbulb className="h-4 w-4" />;
      case 'risk':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Insights</h3>
          <Badge variant="outline">{insights.length}</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="by-source">By Source</TabsTrigger>
            <TabsTrigger value="actionable">Actionable</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Sort controls */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={sortBy === 'confidence' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('confidence')}
            >
              Confidence
            </Button>
            <Button
              variant={sortBy === 'impact' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('impact')}
            >
              Impact
            </Button>
            <Button
              variant={sortBy === 'recent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('recent')}
            >
              Recent
            </Button>
          </div>

          {/* Insights list */}
          {sortedInsights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No insights available</p>
            </div>
          ) : (
            sortedInsights.map((insight) => {
              const isExpanded = expandedInsights.has(insight.id);
              return (
                <div key={insight.id} className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => toggleExpanded(insight.id)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">{getIconForType(insight.insightType)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t space-y-2">
                      <p className="text-sm">{insight.description}</p>

                      <div className="flex flex-wrap gap-2">
                        {insight.confidenceScore && (
                          <Badge variant="secondary" className="text-xs">
                            Confidence: {(insight.confidenceScore * 100).toFixed(0)}%
                          </Badge>
                        )}
                        {insight.impactScore && (
                          <Badge variant="secondary" className="text-xs">
                            Impact: {insight.impactScore.toFixed(0)}/100
                          </Badge>
                        )}
                        {insight.isActionable && (
                          <Badge className="text-xs bg-blue-100 text-blue-800">
                            Actionable
                          </Badge>
                        )}
                      </div>

                      {insight.evidence && insight.evidence.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-xs font-medium mb-1">Evidence:</h5>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {insight.evidence.map((ev: Record<string, any>, idx: number) => (
                              <li key={idx} className="list-disc list-inside">
                                {typeof ev === 'string' ? ev : JSON.stringify(ev)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.recommendedActions && insight.recommendedActions.length > 0 && (
                        <div className="mt-2">
                          <h5 className="text-xs font-medium mb-1">Recommended Actions:</h5>
                          <ul className="text-xs space-y-1 text-muted-foreground">
                            {insight.recommendedActions.map((action, idx) => (
                              <li key={idx} className="list-disc list-inside">
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onInsightClick?.(insight)}
                        className="mt-2"
                      >
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
