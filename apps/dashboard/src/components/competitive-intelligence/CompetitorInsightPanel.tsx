'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CompetitorInsight, CIInsightCategory } from '@pravado/types';
import {
  getInsightCategoryColor,
  getInsightCategoryBgColor,
  updateInsight,
} from '@/lib/competitorIntelligenceApi';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Trophy,
  Bell,
  MessageSquare,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CompetitorInsightPanelProps {
  insight: CompetitorInsight;
  onUpdate?: (insight: CompetitorInsight) => void;
  compact?: boolean;
  className?: string;
}

const categoryIcons: Record<CIInsightCategory, typeof Lightbulb> = {
  opportunity: Lightbulb,
  threat: AlertTriangle,
  trend: TrendingUp,
  advantage: Trophy,
  anomaly: Bell,
  recommendation: MessageSquare,
};

export function CompetitorInsightPanel({
  insight,
  onUpdate,
  compact = false,
  className,
}: CompetitorInsightPanelProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [isLoading, setIsLoading] = useState(false);

  const IconComponent = categoryIcons[insight.category] || Lightbulb;
  const categoryColor = getInsightCategoryColor(insight.category);
  const categoryBgColor = getInsightCategoryBgColor(insight.category);

  const handleMarkRead = async () => {
    setIsLoading(true);
    try {
      const updated = await updateInsight(insight.id, { isRead: true });
      onUpdate?.(updated);
    } catch (error) {
      console.error('Failed to mark insight as read:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    setIsLoading(true);
    try {
      const updated = await updateInsight(insight.id, { isDismissed: true });
      onUpdate?.(updated);
    } catch (error) {
      console.error('Failed to dismiss insight:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (insight.isDismissed) {
    return null;
  }

  return (
    <Card
      className={cn(
        'transition-all',
        !insight.isRead && 'ring-2 ring-primary/20',
        categoryBgColor,
        className
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn('rounded-full p-1.5', categoryBgColor)}>
              <IconComponent className={cn('h-4 w-4', categoryColor)} />
            </div>
            <div>
              <Badge
                variant="outline"
                className={cn(categoryColor, 'border-0 capitalize', categoryBgColor)}
              >
                {insight.category.replace('_', ' ')}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="text-xs">
              Impact: {insight.impactScore}
            </Badge>
            <Badge variant="outline" className="text-xs">
              Confidence: {insight.confidenceScore}%
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
        {insight.timeWindowStart && insight.timeWindowEnd && (
          <CardDescription className="text-xs">
            {new Date(insight.timeWindowStart).toLocaleDateString()} -{' '}
            {new Date(insight.timeWindowEnd).toLocaleDateString()}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {(isExpanded || !compact) && (
          <>
            <p className="text-sm text-muted-foreground">{insight.description}</p>

            {insight.recommendation && (
              <div className="rounded-md bg-muted p-3">
                <p className="text-sm font-medium">Recommendation</p>
                <p className="mt-1 text-sm text-muted-foreground">{insight.recommendation}</p>
              </div>
            )}

            {insight.supportingMetrics && Object.keys(insight.supportingMetrics).length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(insight.supportingMetrics).map(([key, value]) => (
                  <div key={key} className="rounded bg-muted/50 p-2">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>{' '}
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {!insight.isRead && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkRead}
                disabled={isLoading}
                className="text-xs"
              >
                <Check className="mr-1 h-3 w-3" />
                Mark Read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              disabled={isLoading}
              className="text-xs text-muted-foreground"
            >
              <X className="mr-1 h-3 w-3" />
              Dismiss
            </Button>
          </div>

          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-1 h-3 w-3" />
                  Less
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-3 w-3" />
                  More
                </>
              )}
            </Button>
          )}

          <span className="text-xs text-muted-foreground">
            {insight.generatedBy === 'llm' && 'AI Generated'}
            {insight.generatedBy === 'rule' && 'Rule Based'}
            {insight.generatedBy === 'hybrid' && 'AI + Rules'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface CompetitorInsightListProps {
  insights: CompetitorInsight[];
  onUpdate?: (insight: CompetitorInsight) => void;
  compact?: boolean;
  className?: string;
}

export function CompetitorInsightList({
  insights,
  onUpdate,
  compact = false,
  className,
}: CompetitorInsightListProps) {
  const sortedInsights = [...insights].sort((a, b) => {
    // Unread first, then by impact score
    if (!a.isRead && b.isRead) return -1;
    if (a.isRead && !b.isRead) return 1;
    return (b.priorityScore || b.impactScore) - (a.priorityScore || a.impactScore);
  });

  if (sortedInsights.length === 0) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <p className="text-muted-foreground">No insights available</p>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {sortedInsights.map((insight) => (
        <CompetitorInsightPanel
          key={insight.id}
          insight={insight}
          onUpdate={onUpdate}
          compact={compact}
        />
      ))}
    </div>
  );
}
