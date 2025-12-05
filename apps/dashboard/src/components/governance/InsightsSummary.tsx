/**
 * Insights Summary Component (Sprint S59)
 * Displays AI-generated governance insights with recommendations
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '@/lib/utils';
import type {
  GovernanceAuditInsight,
  GovernanceInsightRecommendation,
  GovernanceInsightTopRisk,
} from '@/lib/governanceApi';
import { formatDate, formatDateTime, getScopeLabel, getEntityTypeLabel } from '@/lib/governanceApi';
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Sparkles,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface InsightsSummaryProps {
  insights: GovernanceAuditInsight[];
  loading?: boolean;
  onInsightClick?: (insight: GovernanceAuditInsight) => void;
  onGenerateClick?: () => void;
  className?: string;
}

interface InsightCardProps {
  insight: GovernanceAuditInsight;
  onClick?: () => void;
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function InsightCard({ insight, onClick }: InsightCardProps) {
  const isLlmGenerated = insight.generatedBy === 'llm_assisted' || insight.generatedBy === 'hybrid';

  return (
    <Card
      className={cn('hover:shadow-md transition-shadow', onClick && 'cursor-pointer')}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-gray-900">{insight.title}</span>
          </div>
          <div className="flex items-center gap-1">
            {isLlmGenerated && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {getScopeLabel(insight.scope)}
            </Badge>
          </div>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-600 line-clamp-2">{insight.summary}</p>

        {/* Metrics */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <FileText className="h-4 w-4" />
            <span>{insight.findingsCount} findings</span>
          </div>
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{insight.resolvedFindingsCount} resolved</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="h-4 w-4" />
            <span>{formatDate(insight.timeWindowStart)} - {formatDate(insight.timeWindowEnd)}</span>
          </div>
        </div>

        {/* Top Risks Preview */}
        {insight.topRisks && insight.topRisks.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-gray-500">Top Risk:</span>
            <span className="text-xs font-medium text-gray-700">
              {insight.topRisks[0].entityName || insight.topRisks[0].entityId}
            </span>
            <SeverityBadge severity={insight.topRisks[0].riskLevel} className="text-xs" />
          </div>
        )}

        {/* View Details */}
        {onClick && (
          <div className="flex items-center justify-end text-sm text-blue-600 hover:text-blue-700">
            <span>View Details</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecommendationListProps {
  recommendations: GovernanceInsightRecommendation[];
  maxItems?: number;
}

function RecommendationList({ recommendations, maxItems = 5 }: RecommendationListProps) {
  const visibleRecs = recommendations.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {visibleRecs.map((rec, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
        >
          <Badge variant="outline" className={cn('text-xs shrink-0', getPriorityColor(rec.priority))}>
            {rec.priority}
          </Badge>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-900">{rec.title}</div>
            <div className="text-xs text-gray-600 line-clamp-2">{rec.description}</div>
            {rec.estimatedImpact && (
              <div className="text-xs text-gray-500 mt-1">Impact: {rec.estimatedImpact}</div>
            )}
          </div>
        </div>
      ))}
      {recommendations.length > maxItems && (
        <div className="text-sm text-gray-500 text-center">
          +{recommendations.length - maxItems} more recommendations
        </div>
      )}
    </div>
  );
}

interface TopRisksListProps {
  topRisks: GovernanceInsightTopRisk[];
  maxItems?: number;
}

function TopRisksList({ topRisks, maxItems = 5 }: TopRisksListProps) {
  const visibleRisks = topRisks.slice(0, maxItems);

  return (
    <div className="space-y-2">
      {visibleRisks.map((risk, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
            <div>
              <div className="font-medium text-sm text-gray-900">
                {risk.entityName || risk.entityId}
              </div>
              <div className="text-xs text-gray-500">
                {getEntityTypeLabel(risk.entityType)}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-lg" style={{ color: risk.riskScore >= 70 ? '#dc2626' : risk.riskScore >= 40 ? '#f59e0b' : '#16a34a' }}>
              {risk.riskScore.toFixed(0)}
            </div>
            <SeverityBadge severity={risk.riskLevel} className="text-xs" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function InsightsSummary({
  insights,
  loading,
  onInsightClick,
  onGenerateClick,
  className,
}: InsightsSummaryProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading insights...</p>
        </CardContent>
      </Card>
    );
  }

  const latestInsight = insights[0];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">AI Governance Insights</h2>
        </div>
        {onGenerateClick && (
          <Button onClick={onGenerateClick} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Generate New
          </Button>
        )}
      </div>

      {insights.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No insights generated yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Generate insights to get AI-powered governance recommendations
            </p>
            {onGenerateClick && (
              <Button onClick={onGenerateClick} className="mt-4">
                <Sparkles className="h-4 w-4 mr-1" />
                Generate Insights
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Latest Insight Detail */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{latestInsight.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {latestInsight.generatedBy !== 'rule_based' && (
                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI Generated
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatDateTime(latestInsight.createdAt)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Executive Summary */}
                {latestInsight.executiveSummary && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Executive Summary</h4>
                    <p className="text-sm text-gray-600">{latestInsight.executiveSummary}</p>
                  </div>
                )}

                {/* Summary */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                  <p className="text-sm text-gray-600">{latestInsight.summary}</p>
                </div>

                {/* Recommendations */}
                {latestInsight.recommendations && latestInsight.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recommendations</h4>
                    <RecommendationList recommendations={latestInsight.recommendations} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous Insights */}
            {insights.length > 1 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Previous Insights</h3>
                <div className="space-y-2">
                  {insights.slice(1, 4).map((insight) => (
                    <InsightCard
                      key={insight.id}
                      insight={insight}
                      onClick={() => onInsightClick?.(insight)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Risks Sidebar */}
          <div className="space-y-4">
            {latestInsight.topRisks && latestInsight.topRisks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Top Risk Entities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TopRisksList topRisks={latestInsight.topRisks} />
                </CardContent>
              </Card>
            )}

            {/* Risk Distribution */}
            {latestInsight.riskDistribution && Object.keys(latestInsight.riskDistribution).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(latestInsight.riskDistribution).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
