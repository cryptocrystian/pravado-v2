/**
 * InsightPanel Component (Sprint S54)
 *
 * Sidebar panel displaying grouped insights from briefing sources
 * organized by strength and category with actionable recommendations
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info,
  HelpCircle,
  ArrowRight,
  Filter,
  X,
} from 'lucide-react';
import type { BriefingInsight, InsightStrength, BriefingSourceType } from '@pravado/types';
import {
  getInsightStrengthLabel,
  getInsightStrengthColor,
  getSourceTypeLabel,
  getSourceTypeIcon,
} from '@/lib/mediaBriefingApi';
import { cn } from '@/lib/utils';
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
import { ScrollArea } from '@/components/ui/scroll-area';

interface InsightPanelProps {
  insights: BriefingInsight[];
  onInsightClick?: (insight: BriefingInsight) => void;
  onViewSource?: (sourceType: BriefingSourceType, sourceId: string) => void;
  className?: string;
  maxHeight?: string;
}

const strengthOrder: InsightStrength[] = ['strong', 'moderate', 'weak', 'speculative'];

function getStrengthIcon(strength: InsightStrength) {
  switch (strength) {
    case 'strong':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'moderate':
      return <Info className="h-4 w-4 text-blue-600" />;
    case 'weak':
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case 'speculative':
      return <HelpCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Lightbulb className="h-4 w-4" />;
  }
}

function getStrengthBgColor(strength: InsightStrength): string {
  const colors: Record<InsightStrength, string> = {
    strong: 'bg-green-50 border-green-200',
    moderate: 'bg-blue-50 border-blue-200',
    weak: 'bg-yellow-50 border-yellow-200',
    speculative: 'bg-gray-50 border-gray-200',
  };
  return colors[strength] || 'bg-gray-50';
}

export default function InsightPanel({
  insights,
  onInsightClick,
  onViewSource,
  className = '',
  maxHeight = '600px',
}: InsightPanelProps) {
  const [expandedStrengths, setExpandedStrengths] = useState<Set<InsightStrength>>(
    new Set(['strong', 'moderate'])
  );
  const [filterStrength, setFilterStrength] = useState<InsightStrength | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(insights.map((i) => i.category));
    return Array.from(cats).sort();
  }, [insights]);

  // Filter and group insights
  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      if (filterStrength !== 'all' && insight.strength !== filterStrength) return false;
      if (filterCategory !== 'all' && insight.category !== filterCategory) return false;
      return true;
    });
  }, [insights, filterStrength, filterCategory]);

  const groupedByStrength = useMemo(() => {
    const grouped: Record<InsightStrength, BriefingInsight[]> = {
      strong: [],
      moderate: [],
      weak: [],
      speculative: [],
    };
    filteredInsights.forEach((insight) => {
      grouped[insight.strength].push(insight);
    });
    // Sort each group by relevance score
    Object.keys(grouped).forEach((key) => {
      grouped[key as InsightStrength].sort((a, b) => b.relevanceScore - a.relevanceScore);
    });
    return grouped;
  }, [filteredInsights]);

  const toggleStrength = (strength: InsightStrength) => {
    const newExpanded = new Set(expandedStrengths);
    if (newExpanded.has(strength)) {
      newExpanded.delete(strength);
    } else {
      newExpanded.add(strength);
    }
    setExpandedStrengths(newExpanded);
  };

  const toggleInsight = (insightId: string) => {
    const newExpanded = new Set(expandedInsights);
    if (newExpanded.has(insightId)) {
      newExpanded.delete(insightId);
    } else {
      newExpanded.add(insightId);
    }
    setExpandedInsights(newExpanded);
  };

  const clearFilters = () => {
    setFilterStrength('all');
    setFilterCategory('all');
  };

  const hasFilters = filterStrength !== 'all' || filterCategory !== 'all';

  if (insights.length === 0) {
    return (
      <Card className={cn('', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground text-sm">
            No insights available yet. Generate the briefing to extract insights from your sources.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
            <Badge variant="secondary" className="text-xs">
              {filteredInsights.length}
            </Badge>
          </CardTitle>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mt-2">
          <Select value={filterStrength} onValueChange={(v) => setFilterStrength(v as any)}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue placeholder="Strength" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strengths</SelectItem>
              {strengthOrder.map((s) => (
                <SelectItem key={s} value={s}>
                  {getInsightStrengthLabel(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          <div className="p-4 pt-2 space-y-3">
            {strengthOrder.map((strength) => {
              const strengthInsights = groupedByStrength[strength];
              if (strengthInsights.length === 0) return null;

              const isExpanded = expandedStrengths.has(strength);

              return (
                <div key={strength} className="space-y-2">
                  {/* Strength Header */}
                  <button
                    onClick={() => toggleStrength(strength)}
                    className="flex items-center justify-between w-full py-1 hover:bg-gray-50 rounded px-1 -mx-1"
                  >
                    <div className="flex items-center gap-2">
                      {getStrengthIcon(strength)}
                      <span className={cn('text-sm font-medium', getInsightStrengthColor(strength))}>
                        {getInsightStrengthLabel(strength)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {strengthInsights.length}
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Insights List */}
                  {isExpanded && (
                    <div className="space-y-2 pl-6">
                      {strengthInsights.map((insight) => {
                        const isInsightExpanded = expandedInsights.has(insight.id);

                        return (
                          <div
                            key={insight.id}
                            className={cn(
                              'border rounded-lg p-3 transition-all cursor-pointer',
                              getStrengthBgColor(strength),
                              onInsightClick && 'hover:shadow-sm'
                            )}
                            onClick={() => {
                              if (onInsightClick) {
                                onInsightClick(insight);
                              } else {
                                toggleInsight(insight.id);
                              }
                            }}
                          >
                            {/* Insight Header */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs">
                                    {getSourceTypeIcon(insight.sourceType)}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    {insight.category}
                                  </Badge>
                                  {insight.actionable && (
                                    <Badge className="text-[10px] px-1.5 py-0 bg-purple-100 text-purple-700">
                                      Actionable
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {insight.title}
                                </h4>
                              </div>
                              <div className="text-[10px] text-muted-foreground shrink-0">
                                {(insight.relevanceScore * 100).toFixed(0)}%
                              </div>
                            </div>

                            {/* Insight Content (expanded) */}
                            {isInsightExpanded && (
                              <div className="mt-2 pt-2 border-t border-gray-200 space-y-2">
                                <p className="text-xs text-gray-600">{insight.content}</p>

                                {insight.suggestedAction && (
                                  <div className="flex items-start gap-2 bg-white/50 rounded p-2">
                                    <ArrowRight className="h-3 w-3 text-purple-600 mt-0.5 shrink-0" />
                                    <div>
                                      <span className="text-[10px] font-medium text-purple-700 uppercase">
                                        Suggested Action
                                      </span>
                                      <p className="text-xs text-gray-700">{insight.suggestedAction}</p>
                                    </div>
                                  </div>
                                )}

                                {insight.sourceId && onViewSource && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewSource(insight.sourceType, insight.sourceId!);
                                    }}
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View {getSourceTypeLabel(insight.sourceType)}
                                  </Button>
                                )}
                              </div>
                            )}

                            {/* Collapsed preview */}
                            {!isInsightExpanded && (
                              <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                                {insight.content}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Summary Footer */}
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>
              {filteredInsights.filter((i) => i.actionable).length} actionable insights
            </span>
            <span>
              Avg relevance: {(filteredInsights.reduce((acc, i) => acc + i.relevanceScore, 0) / filteredInsights.length * 100 || 0).toFixed(0)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
