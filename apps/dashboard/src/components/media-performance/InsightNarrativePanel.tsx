/**
 * InsightNarrativePanel Component (Sprint S52)
 * Panel displaying AI-generated and rule-based performance insights
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getInsightCategoryColor,
  markInsightAsRead,
  dismissInsight,
} from '@/lib/mediaPerformanceApi';
import type { MediaPerformanceInsight, InsightCategory } from '@pravado/types';
import { X, CheckCircle, AlertCircle, TrendingUp, Lightbulb, Target, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface InsightNarrativePanelProps {
  insights: MediaPerformanceInsight[];
  title?: string;
  showDismissed?: boolean;
  onInsightClick?: (insight: MediaPerformanceInsight) => void;
  onInsightDismissed?: (insightId: string) => void;
  onInsightRead?: (insightId: string) => void;
  className?: string;
  maxInsights?: number;
}

export function InsightNarrativePanel({
  insights,
  title = 'Performance Insights',
  showDismissed = false,
  onInsightClick,
  onInsightDismissed,
  onInsightRead,
  className,
  maxInsights = 5,
}: InsightNarrativePanelProps) {
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  const visibleInsights = insights
    .filter((i) => showDismissed || !i.isDismissed)
    .slice(0, maxInsights);

  const unreadCount = insights.filter((i) => !i.isRead && !i.isDismissed).length;

  const handleDismiss = async (insight: MediaPerformanceInsight, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissingIds((prev) => new Set(prev).add(insight.id));

    try {
      await dismissInsight(insight.id);
      onInsightDismissed?.(insight.id);
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    } finally {
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(insight.id);
        return next;
      });
    }
  };

  const handleRead = async (insight: MediaPerformanceInsight) => {
    if (!insight.isRead) {
      try {
        await markInsightAsRead(insight.id);
        onInsightRead?.(insight.id);
      } catch (error) {
        console.error('Failed to mark insight as read:', error);
      }
    }
    onInsightClick?.(insight);
  };

  const getCategoryIcon = (category: InsightCategory) => {
    const iconMap = {
      achievement: <Target className="h-4 w-4" />,
      anomaly: <AlertCircle className="h-4 w-4" />,
      recommendation: <Lightbulb className="h-4 w-4" />,
      trend: <TrendingUp className="h-4 w-4" />,
      risk: <AlertCircle className="h-4 w-4" />,
      opportunity: <Sparkles className="h-4 w-4" />,
    };
    return iconMap[category] || <CheckCircle className="h-4 w-4" />;
  };

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                {unreadCount} new
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {insights.length} total
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {visibleInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-sm">
            <Sparkles className="h-8 w-8 mb-2 text-gray-400" />
            <p>No insights available</p>
          </div>
        ) : (
          visibleInsights.map((insight) => {
            const categoryColor = getInsightCategoryColor(insight.category);
            const isDismissing = dismissingIds.has(insight.id);

            return (
              <div
                key={insight.id}
                className={cn(
                  'p-4 rounded-lg border transition-all',
                  !insight.isRead && 'bg-blue-50 border-blue-200',
                  insight.isRead && 'bg-white border-gray-200 hover:border-gray-300',
                  onInsightClick && 'cursor-pointer',
                  isDismissing && 'opacity-50'
                )}
                onClick={() => handleRead(insight)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div
                      className={cn(
                        'p-1.5 rounded',
                        categoryColor === 'green' && 'bg-green-100 text-green-700',
                        categoryColor === 'blue' && 'bg-blue-100 text-blue-700',
                        categoryColor === 'purple' && 'bg-purple-100 text-purple-700',
                        categoryColor === 'yellow' && 'bg-yellow-100 text-yellow-700',
                        categoryColor === 'red' && 'bg-red-100 text-red-700',
                        categoryColor === 'teal' && 'bg-teal-100 text-teal-700'
                      )}
                    >
                      {getCategoryIcon(insight.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">
                          {insight.title}
                        </h4>
                        {insight.generatedByLlm && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            AI
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-700"
                    onClick={(e) => handleDismiss(insight, e)}
                    disabled={isDismissing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-700 mb-2">{insight.summary}</p>

                {/* Recommendation */}
                {insight.recommendation && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 mt-2">
                    <span className="font-medium text-gray-700">Recommendation:</span>{' '}
                    {insight.recommendation}
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs text-gray-500">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {insight.category.replace('_', ' ')}
                    </Badge>
                    {insight.impactScore !== null && insight.impactScore !== undefined && (
                      <span>Impact: {insight.impactScore.toFixed(0)}/100</span>
                    )}
                    {insight.confidenceScore !== null && insight.confidenceScore !== undefined && (
                      <span>Confidence: {(insight.confidenceScore * 100).toFixed(0)}%</span>
                    )}
                  </div>
                  <div>
                    {new Date(insight.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Show More */}
        {insights.length > maxInsights && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm" className="text-xs">
              View All {insights.length} Insights
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
