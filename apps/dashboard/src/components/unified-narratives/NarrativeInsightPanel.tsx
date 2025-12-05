/**
 * NarrativeInsightPanel Component (Sprint S70)
 *
 * Displays cross-system insights from a unified narrative
 */

'use client';

import React from 'react';
import {
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  Link2,
} from 'lucide-react';
import type { NarrativeInsight } from '@pravado/types';
import { NARRATIVE_INSIGHT_STRENGTH_LABELS } from '@pravado/types';
import { getInsightStrengthColor } from '@/lib/unifiedNarrativeApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NarrativeInsightPanelProps {
  insights: NarrativeInsight[];
  className?: string;
}

const INSIGHT_TYPE_ICONS: Record<string, React.ReactNode> = {
  opportunity: <TrendingUp className="h-4 w-4 text-green-600" />,
  risk: <AlertTriangle className="h-4 w-4 text-red-600" />,
  trend: <Zap className="h-4 w-4 text-blue-600" />,
  correlation: <Link2 className="h-4 w-4 text-purple-600" />,
  recommendation: <Target className="h-4 w-4 text-orange-600" />,
  default: <Lightbulb className="h-4 w-4 text-yellow-600" />,
};

export default function NarrativeInsightPanel({
  insights,
  className = '',
}: NarrativeInsightPanelProps) {
  if (!insights || insights.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No insights available for this narrative.</p>
        </CardContent>
      </Card>
    );
  }

  // Group insights by insightType
  const groupedInsights = insights.reduce(
    (acc, insight) => {
      const type = insight.insightType || 'general';
      if (!acc[type]) acc[type] = [];
      acc[type].push(insight);
      return acc;
    },
    {} as Record<string, NarrativeInsight[]>
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-600" />
          Cross-System Insights
          <Badge variant="secondary" className="ml-2">
            {insights.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedInsights).map(([insightType, typeInsights]) => (
          <div key={insightType}>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
              {INSIGHT_TYPE_ICONS[insightType] || INSIGHT_TYPE_ICONS.default}
              {insightType.replace(/_/g, ' ')}
            </h4>
            <div className="space-y-3">
              {typeInsights.map((insight, idx) => (
                <InsightCard key={insight.id || idx} insight={insight} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function InsightCard({ insight }: { insight: NarrativeInsight }) {
  const strengthColor = getInsightStrengthColor(insight.strength);

  return (
    <div className="p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h5 className="font-medium text-sm">{insight.title}</h5>
        <Badge variant="outline" className={cn('text-xs shrink-0', strengthColor)}>
          {NARRATIVE_INSIGHT_STRENGTH_LABELS[insight.strength]}
        </Badge>
      </div>

      <p className="text-sm text-gray-600 mb-3">{insight.description}</p>

      {/* Source System */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className="text-xs">
          {insight.sourceSystem.replace(/_/g, ' ')}
        </Badge>
        {insight.confidenceScore !== undefined && (
          <span className="text-xs text-muted-foreground">
            {Math.round(insight.confidenceScore * 100)}% confidence
          </span>
        )}
      </div>

      {/* Supporting Data */}
      {insight.supportingData && Object.keys(insight.supportingData).length > 0 && (
        <div className="mt-2 pt-2 border-t">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(insight.supportingData).slice(0, 4).map(([key, value]) => (
              <div key={key}>
                <span className="text-muted-foreground">{key}:</span>{' '}
                <span className="font-medium">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {insight.tags && insight.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {insight.tags.slice(0, 4).map((tag, idx) => (
            <Badge key={idx} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
