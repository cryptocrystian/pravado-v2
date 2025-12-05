/**
 * ExecutiveSummaryPanel Component (Sprint S56)
 * Displays executive narrative with key risks, opportunities, and actions
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getTimeWindowLabel,
  formatDate,
} from '@/lib/brandReputationApi';
import { cn } from '@/lib/utils';
import type { ExecutiveRadarSummary, ReputationTimeWindow } from '@pravado/types';
import {
  FileText,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface ExecutiveSummaryPanelProps {
  summary: ExecutiveRadarSummary;
  timeWindow: ReputationTimeWindow;
  className?: string;
}

export function ExecutiveSummaryPanel({
  summary,
  timeWindow,
  className,
}: ExecutiveSummaryPanelProps) {
  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-600">
              Executive Summary
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {getTimeWindowLabel(timeWindow)}
            </Badge>
            {summary.activeCrises > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {summary.activeCrises} Active Crisis
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Narrative */}
        <div className="p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-700 leading-relaxed">
            {summary.summary || 'No executive summary available for this period.'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-700">
              {summary.currentScore.toFixed(0)}
            </div>
            <div className="text-xs text-blue-600">Current Score</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className={cn(
              'text-2xl font-bold',
              summary.scoreDelta > 0 ? 'text-green-600' : summary.scoreDelta < 0 ? 'text-red-600' : 'text-gray-600'
            )}>
              {summary.scoreDelta > 0 ? '+' : ''}{summary.scoreDelta.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Score Change</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-700">
              #{summary.competitiveRank}
            </div>
            <div className="text-xs text-purple-600">Competitive Rank</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-700">
              {summary.alertCount}
            </div>
            <div className="text-xs text-orange-600">Active Alerts</div>
          </div>
        </div>

        {/* Key Risks */}
        {summary.keyRisks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-gray-700">Key Risks</span>
            </div>
            <div className="pl-6 space-y-2">
              {summary.keyRisks.map((risk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-red-50 rounded border border-red-100"
                >
                  <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{risk}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Opportunities */}
        {summary.keyOpportunities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Key Opportunities</span>
            </div>
            <div className="pl-6 space-y-2">
              {summary.keyOpportunities.map((opportunity, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-green-50 rounded border border-green-100"
                >
                  <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">{opportunity}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {summary.recommendedActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Recommended Actions</span>
            </div>
            <div className="pl-6 space-y-2">
              {summary.recommendedActions.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-100"
                >
                  <span className="text-sm font-medium text-blue-600 flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <p className="text-sm text-blue-800">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Crisis Impact Note */}
        {summary.activeCrises > 0 && summary.crisisNotes && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Crisis Impact</span>
            </div>
            <p className="text-sm text-red-800">{summary.crisisNotes}</p>
            <p className="text-xs text-red-600 mt-1">
              Impact on score: -{Math.abs(summary.crisisImpactOnScore).toFixed(1)} points
            </p>
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 text-right pt-2 border-t">
          Analysis window: {formatDate(summary.windowStart)} - {formatDate(summary.windowEnd)}
          <br />
          Calculated at: {formatDate(summary.calculatedAt)}
        </div>
      </CardContent>
    </Card>
  );
}
