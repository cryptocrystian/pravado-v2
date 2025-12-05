/**
 * Compliance Metrics Panel Component (Sprint S59)
 * Displays key compliance metrics and KPIs
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GovernanceComplianceMetrics } from '@/lib/governanceApi';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  Clock,
  AlertCircle,
  Shield,
  Target,
  Zap,
} from 'lucide-react';

interface ComplianceMetricsPanelProps {
  metrics: GovernanceComplianceMetrics;
  loading?: boolean;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  format?: 'percentage' | 'number' | 'time';
  change?: number;
  icon: React.ReactNode;
  colorClass?: string;
}

function MetricCard({ title, value, format, change, icon, colorClass }: MetricCardProps) {
  const formattedValue = (() => {
    if (typeof value === 'string') return value;
    switch (format) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'time':
        return value < 1 ? `${(value * 60).toFixed(0)}m` : `${value.toFixed(1)}h`;
      default:
        return value.toFixed(1);
    }
  })();

  const changeColor =
    change === undefined || change === null
      ? 'text-gray-500'
      : change > 0
      ? 'text-green-600'
      : change < 0
      ? 'text-red-600'
      : 'text-gray-500';

  const ChangeIcon =
    change === undefined || change === null
      ? Minus
      : change > 0
      ? TrendingUp
      : change < 0
      ? TrendingDown
      : Minus;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn('p-2 rounded-lg bg-gray-100', colorClass)}>{icon}</div>
          {change !== undefined && change !== null && (
            <div className={cn('flex items-center gap-1 text-sm', changeColor)}>
              <ChangeIcon className="h-3 w-3" />
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className="mt-3">
          <div className={cn('text-2xl font-bold', colorClass?.replace('bg-', 'text-') || 'text-gray-900')}>
            {formattedValue}
          </div>
          <div className="text-sm text-gray-500">{title}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ComplianceMetricsPanel({
  metrics,
  loading,
  className,
}: ComplianceMetricsPanelProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-sm text-gray-500">Loading metrics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Compliance Metrics</h2>
        <span className="text-sm text-gray-500">Last 30 days</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          title="Compliance Score"
          value={metrics.complianceScore}
          format="percentage"
          change={metrics.trendsVsPreviousPeriod?.complianceScoreChange}
          icon={<Shield className="h-5 w-5 text-blue-600" />}
          colorClass="bg-blue-50"
        />

        <MetricCard
          title="Policy Coverage"
          value={metrics.policyCoverage}
          format="percentage"
          icon={<Target className="h-5 w-5 text-indigo-600" />}
          colorClass="bg-indigo-50"
        />

        <MetricCard
          title="Rule Effectiveness"
          value={metrics.ruleEffectiveness}
          format="percentage"
          icon={<Zap className="h-5 w-5 text-purple-600" />}
          colorClass="bg-purple-50"
        />

        <MetricCard
          title="Resolution Rate"
          value={metrics.resolutionRate}
          format="percentage"
          change={metrics.trendsVsPreviousPeriod?.resolutionRateChange}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          colorClass="bg-green-50"
        />

        <MetricCard
          title="Mean Time to Resolution"
          value={metrics.meanTimeToResolution}
          format="time"
          icon={<Clock className="h-5 w-5 text-amber-600" />}
          colorClass="bg-amber-50"
        />

        <MetricCard
          title="Findings per Day"
          value={metrics.findingsPerDay}
          format="number"
          change={metrics.trendsVsPreviousPeriod?.findingsChange}
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          colorClass="bg-red-50"
        />
      </div>

      {/* Trend Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">vs Previous Period:</span>
            </div>

            <div
              className={cn(
                'flex items-center gap-1',
                metrics.trendsVsPreviousPeriod?.complianceScoreChange >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              )}
            >
              {metrics.trendsVsPreviousPeriod?.complianceScoreChange >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                Compliance{' '}
                {metrics.trendsVsPreviousPeriod?.complianceScoreChange >= 0 ? '+' : ''}
                {metrics.trendsVsPreviousPeriod?.complianceScoreChange?.toFixed(1)}%
              </span>
            </div>

            <div
              className={cn(
                'flex items-center gap-1',
                metrics.trendsVsPreviousPeriod?.findingsChange <= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              )}
            >
              {metrics.trendsVsPreviousPeriod?.findingsChange <= 0 ? (
                <TrendingDown className="h-4 w-4" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              <span>
                Findings{' '}
                {metrics.trendsVsPreviousPeriod?.findingsChange >= 0 ? '+' : ''}
                {metrics.trendsVsPreviousPeriod?.findingsChange?.toFixed(1)}%
              </span>
            </div>

            <div
              className={cn(
                'flex items-center gap-1',
                metrics.trendsVsPreviousPeriod?.resolutionRateChange >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              )}
            >
              {metrics.trendsVsPreviousPeriod?.resolutionRateChange >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>
                Resolution{' '}
                {metrics.trendsVsPreviousPeriod?.resolutionRateChange >= 0 ? '+' : ''}
                {metrics.trendsVsPreviousPeriod?.resolutionRateChange?.toFixed(1)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
