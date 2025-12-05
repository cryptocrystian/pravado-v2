/**
 * Risk Indicator Panel Component (Sprint S60)
 * Displays indicators grouped by type with trend analysis
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RiskRadarIndicator, RiskRadarTrendDirection } from '@/lib/riskRadarApi';
import { getIndicatorTypeLabel } from '@/lib/riskRadarApi';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Shield,
  MessageSquare,
  Zap,
  Users,
  Newspaper,
  Clock,
  Loader2,
} from 'lucide-react';

interface RiskIndicatorPanelProps {
  indicators: RiskRadarIndicator[];
  loading?: boolean;
  className?: string;
}

const indicatorIcons: Record<string, React.ReactNode> = {
  sentiment: <MessageSquare className="h-4 w-4" />,
  velocity: <Zap className="h-4 w-4" />,
  alerts: <AlertTriangle className="h-4 w-4" />,
  competitive: <BarChart3 className="h-4 w-4" />,
  governance: <Shield className="h-4 w-4" />,
  persona: <Users className="h-4 w-4" />,
  media_coverage: <Newspaper className="h-4 w-4" />,
  crisis_history: <Clock className="h-4 w-4" />,
  reputation: <Brain className="h-4 w-4" />,
};

function getTrendIcon(direction?: RiskRadarTrendDirection) {
  switch (direction) {
    case 'improving':
      return <TrendingDown className="h-4 w-4 text-green-500" />;
    case 'worsening':
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    case 'volatile':
      return <Activity className="h-4 w-4 text-orange-500" />;
    case 'stable':
    default:
      return <Minus className="h-4 w-4 text-gray-500" />;
  }
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-red-600 bg-red-50';
  if (score >= 50) return 'text-orange-600 bg-orange-50';
  if (score >= 25) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
}

function groupIndicatorsByType(indicators: RiskRadarIndicator[]): Record<string, RiskRadarIndicator[]> {
  return indicators.reduce((acc, indicator) => {
    const type = indicator.indicatorType;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(indicator);
    return acc;
  }, {} as Record<string, RiskRadarIndicator[]>);
}

export function RiskIndicatorPanel({ indicators, loading, className }: RiskIndicatorPanelProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Risk Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading indicators...</span>
        </CardContent>
      </Card>
    );
  }

  if (!indicators || indicators.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Risk Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          No indicators available for this snapshot.
        </CardContent>
      </Card>
    );
  }

  const grouped = groupIndicatorsByType(indicators);
  const typeOrder = [
    'sentiment',
    'alerts',
    'velocity',
    'competitive',
    'governance',
    'reputation',
    'crisis_history',
    'persona',
    'media_coverage',
  ];

  const sortedTypes = Object.keys(grouped).sort(
    (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b)
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Risk Indicators
          <Badge variant="secondary" className="ml-auto">
            {indicators.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
        {sortedTypes.map((type) => (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              {indicatorIcons[type] || <Activity className="h-4 w-4" />}
              {getIndicatorTypeLabel(type as any)}
            </div>
            <div className="space-y-2 pl-6">
              {grouped[type].map((indicator) => (
                <div
                  key={indicator.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {indicator.name}
                    </div>
                    {indicator.description && (
                      <div className="text-xs text-gray-500 truncate">
                        {indicator.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>Source: {indicator.sourceSystem}</span>
                      {indicator.scoreDelta !== undefined && indicator.scoreDelta !== 0 && (
                        <span className={indicator.scoreDelta > 0 ? 'text-red-600' : 'text-green-600'}>
                          {indicator.scoreDelta > 0 ? '+' : ''}{indicator.scoreDelta.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getTrendIcon(indicator.trendDirection)}
                    <div
                      className={cn(
                        'px-2 py-1 rounded text-sm font-semibold',
                        getScoreColor(indicator.score)
                      )}
                    >
                      {indicator.score.toFixed(0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
