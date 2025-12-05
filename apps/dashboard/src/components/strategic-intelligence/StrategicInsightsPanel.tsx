/**
 * Strategic Insights Panel Component (Sprint S65)
 * Displays aggregated insights from all upstream systems
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { AggregatedStrategicInsights } from '@/lib/strategicIntelligenceApi';
import {
  Radio,
  Target,
  AlertTriangle,
  Heart,
  Shield,
  DollarSign,
  Monitor,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

interface StrategicInsightsPanelProps {
  insights: AggregatedStrategicInsights;
}

export function StrategicInsightsPanel({ insights }: StrategicInsightsPanelProps) {
  return (
    <div className="space-y-6">
      {/* Media Performance */}
      {insights.mediaPerformance && (
        <InsightCard
          icon={Radio}
          title="Media Performance"
          iconColor="text-blue-500"
        >
          <div className="grid grid-cols-2 gap-4">
            <MetricItem
              label="Overall Score"
              value={insights.mediaPerformance.overallScore}
              isScore
            />
            <MetricItem
              label="Reach"
              value={insights.mediaPerformance.reach.toLocaleString()}
            />
            <MetricItem
              label="Impressions"
              value={insights.mediaPerformance.impressions.toLocaleString()}
            />
            <MetricItem
              label="Sentiment"
              value={insights.mediaPerformance.sentiment}
              isScore
            />
          </div>
          {insights.mediaPerformance.topMentions.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Top Outlets</p>
              <div className="flex flex-wrap gap-2">
                {insights.mediaPerformance.topMentions.slice(0, 5).map((m, i) => (
                  <Badge key={i} variant="secondary">
                    {m.outlet} ({m.count})
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </InsightCard>
      )}

      {/* Competitive Intelligence */}
      {insights.competitiveIntel && (
        <InsightCard
          icon={Target}
          title="Competitive Intelligence"
          iconColor="text-purple-500"
        >
          <div className="mb-4">
            <MetricItem
              label="Position Index"
              value={insights.competitiveIntel.positionIndex}
              isScore
            />
          </div>
          {insights.competitiveIntel.topCompetitors.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Share of Voice</p>
              {insights.competitiveIntel.topCompetitors.slice(0, 4).map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm min-w-[100px] truncate">{c.name}</span>
                  <Progress value={c.shareOfVoice} className="flex-1" />
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {c.shareOfVoice}%
                  </span>
                </div>
              ))}
            </div>
          )}
          {insights.competitiveIntel.strengthsVsCompetitors.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Strengths</p>
              <ul className="text-sm space-y-1">
                {insights.competitiveIntel.strengthsVsCompetitors.slice(0, 3).map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </InsightCard>
      )}

      {/* Crisis Status */}
      {insights.crisisStatus && (
        <InsightCard
          icon={AlertTriangle}
          title="Crisis Status"
          iconColor="text-orange-500"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <MetricItem
              label="Readiness Score"
              value={insights.crisisStatus.readinessScore}
              isScore
            />
            <MetricItem
              label="Active Crises"
              value={insights.crisisStatus.activeCrises}
              warning={insights.crisisStatus.activeCrises > 0}
            />
          </div>
          {insights.crisisStatus.riskFactors.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Risk Factors</p>
              <div className="flex flex-wrap gap-2">
                {insights.crisisStatus.riskFactors.slice(0, 5).map((r, i) => (
                  <Badge key={i} variant="outline" className="text-orange-600">
                    {r}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </InsightCard>
      )}

      {/* Brand Health */}
      {insights.brandHealth && (
        <InsightCard
          icon={Heart}
          title="Brand Health"
          iconColor="text-red-500"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <MetricItem
              label="Overall Score"
              value={insights.brandHealth.overallScore}
              isScore
            />
            <MetricItem
              label="Awareness Index"
              value={insights.brandHealth.awarenessIndex}
              isScore
            />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm">Sentiment Trend:</span>
            <TrendIndicator trend={insights.brandHealth.sentimentTrend} />
          </div>
          {insights.brandHealth.reputationRisks.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Reputation Risks</p>
              <ul className="text-sm space-y-1">
                {insights.brandHealth.reputationRisks.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </InsightCard>
      )}

      {/* Governance */}
      {insights.governance && (
        <InsightCard
          icon={Shield}
          title="Governance & Compliance"
          iconColor="text-green-500"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <MetricItem
              label="Compliance Score"
              value={insights.governance.complianceScore}
              isScore
            />
            <MetricItem
              label="ESG Score"
              value={insights.governance.esgScore}
              isScore
            />
          </div>
          <MetricItem
            label="Open Issues"
            value={insights.governance.openIssues}
            warning={insights.governance.openIssues > 0}
          />
          {insights.governance.upcomingDeadlines.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground mb-2">Upcoming Deadlines</p>
              <ul className="text-sm space-y-1">
                {insights.governance.upcomingDeadlines.slice(0, 3).map((d, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span>{d.item}</span>
                    <Badge variant="outline">{new Date(d.date).toLocaleDateString()}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </InsightCard>
      )}

      {/* Investor Sentiment */}
      {insights.investorSentiment && (
        <InsightCard
          icon={DollarSign}
          title="Investor Sentiment"
          iconColor="text-emerald-500"
        >
          <div className="grid grid-cols-2 gap-4 mb-4">
            <MetricItem
              label="Overall Score"
              value={insights.investorSentiment.overallScore}
              isScore
            />
            <MetricItem
              label="Analyst Coverage"
              value={insights.investorSentiment.analystCoverage}
            />
          </div>
          {insights.investorSentiment.recentEarnings && (
            <div className="flex items-center gap-2">
              <span className="text-sm">
                {insights.investorSentiment.recentEarnings.quarter} Earnings:
              </span>
              <Badge
                variant={
                  insights.investorSentiment.recentEarnings.sentiment === 'positive'
                    ? 'default'
                    : insights.investorSentiment.recentEarnings.sentiment === 'negative'
                    ? 'destructive'
                    : 'secondary'
                }
              >
                {insights.investorSentiment.recentEarnings.sentiment}
              </Badge>
            </div>
          )}
        </InsightCard>
      )}

      {/* Executive Metrics */}
      {insights.executiveMetrics && (
        <InsightCard
          icon={Monitor}
          title="Executive Command Center"
          iconColor="text-indigo-500"
        >
          <div className="grid grid-cols-3 gap-4">
            <MetricItem
              label="Health Score"
              value={insights.executiveMetrics.overallHealthScore}
              isScore
            />
            <MetricItem
              label="Priority Alerts"
              value={insights.executiveMetrics.priorityAlerts}
              warning={insights.executiveMetrics.priorityAlerts > 0}
            />
            <MetricItem
              label="Pending Decisions"
              value={insights.executiveMetrics.pendingDecisions}
            />
          </div>
        </InsightCard>
      )}

      {/* Empty state */}
      {Object.keys(insights).length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No insights available yet.</p>
            <p className="text-sm">Generate the report to aggregate insights from all systems.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface InsightCardProps {
  icon: typeof Radio;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}

function InsightCard({ icon: Icon, title, iconColor, children }: InsightCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

interface MetricItemProps {
  label: string;
  value: number | string;
  isScore?: boolean;
  warning?: boolean;
}

function MetricItem({ label, value, isScore, warning }: MetricItemProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const displayValue = typeof value === 'number' && isScore ? Math.round(value) : value;
  const colorClass = isScore && typeof value === 'number'
    ? getScoreColor(value)
    : warning
    ? 'text-orange-600'
    : '';

  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${colorClass}`}>
        {displayValue}
        {isScore && <span className="text-sm text-muted-foreground">/100</span>}
      </p>
    </div>
  );
}

interface TrendIndicatorProps {
  trend: 'improving' | 'stable' | 'declining';
}

function TrendIndicator({ trend }: TrendIndicatorProps) {
  switch (trend) {
    case 'improving':
      return (
        <Badge variant="default" className="bg-green-500">
          <TrendingUp className="h-3 w-3 mr-1" />
          Improving
        </Badge>
      );
    case 'declining':
      return (
        <Badge variant="destructive">
          <TrendingDown className="h-3 w-3 mr-1" />
          Declining
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <Minus className="h-3 w-3 mr-1" />
          Stable
        </Badge>
      );
  }
}
