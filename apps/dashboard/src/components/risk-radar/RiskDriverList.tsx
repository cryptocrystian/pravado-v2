/**
 * Risk Driver List Component (Sprint S60)
 * Shows key drivers for current risk snapshot
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RiskLevelBadge } from './RiskLevelBadge';
import type { RiskRadarDriver } from '@/lib/riskRadarApi';
import { getDriverCategoryLabel } from '@/lib/riskRadarApi';
import {
  Loader2,
  TrendingUp,
  Zap,
  AlertTriangle,
  BarChart3,
  Shield,
  Newspaper,
  Brain,
  Users,
  Globe,
  ChevronRight,
} from 'lucide-react';

interface RiskDriverListProps {
  drivers: RiskRadarDriver[];
  loading?: boolean;
  onDriverClick?: (driver: RiskRadarDriver) => void;
  className?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  sentiment_shift: <Brain className="h-4 w-4" />,
  velocity_spike: <Zap className="h-4 w-4" />,
  competitive_pressure: <BarChart3 className="h-4 w-4" />,
  governance_violation: <Shield className="h-4 w-4" />,
  media_surge: <Newspaper className="h-4 w-4" />,
  crisis_pattern: <AlertTriangle className="h-4 w-4" />,
  persona_sensitivity: <Users className="h-4 w-4" />,
  external_event: <Globe className="h-4 w-4" />,
  reputation_decline: <TrendingUp className="h-4 w-4" />,
};

function getImpactColor(score: number): string {
  if (score >= 80) return 'text-red-600 bg-red-50';
  if (score >= 60) return 'text-orange-600 bg-orange-50';
  if (score >= 40) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
}

export function RiskDriverList({
  drivers,
  loading,
  onDriverClick,
  className,
}: RiskDriverListProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Key Risk Drivers
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading drivers...</span>
        </CardContent>
      </Card>
    );
  }

  if (!drivers || drivers.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Key Risk Drivers
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          No risk drivers identified.
        </CardContent>
      </Card>
    );
  }

  // Sort by impact score descending
  const sortedDrivers = [...drivers].sort((a, b) => b.impactScore - a.impactScore);
  const primaryDrivers = sortedDrivers.slice(0, 3);
  const secondaryDrivers = sortedDrivers.slice(3);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Key Risk Drivers
          <Badge variant="secondary" className="ml-auto">
            {drivers.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Drivers */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase">Primary Drivers</div>
          {primaryDrivers.map((driver) => (
            <div
              key={driver.id}
              className={cn(
                'p-3 rounded-lg border transition-all',
                driver.urgency === 'critical' ? 'border-red-200 bg-red-50' :
                driver.urgency === 'high' ? 'border-orange-200 bg-orange-50' :
                'border-gray-200 bg-gray-50',
                onDriverClick && 'cursor-pointer hover:shadow-md'
              )}
              onClick={() => onDriverClick?.(driver)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-full',
                    driver.urgency === 'critical' ? 'bg-red-100' :
                    driver.urgency === 'high' ? 'bg-orange-100' : 'bg-gray-100'
                  )}>
                    {categoryIcons[driver.category] || <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{driver.name}</div>
                    <div className="text-xs text-gray-500">{getDriverCategoryLabel(driver.category)}</div>
                    {driver.description && (
                      <div className="text-sm text-gray-600 mt-1">{driver.description}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <RiskLevelBadge level={driver.urgency} size="sm" />
                      {driver.isEmerging && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Emerging
                        </Badge>
                      )}
                      {driver.isTurningPoint && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          <Zap className="h-3 w-3 mr-1" />
                          Turning Point
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    'text-lg font-bold px-2 py-1 rounded',
                    getImpactColor(driver.impactScore)
                  )}>
                    {driver.impactScore}
                  </div>
                  {driver.contributionPercentage !== undefined && (
                    <div className="text-xs text-gray-500 mt-1">
                      {driver.contributionPercentage.toFixed(0)}% contribution
                    </div>
                  )}
                </div>
              </div>
              {driver.sourceSystem && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                  Source: {driver.sourceSystem}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Secondary Drivers */}
        {secondaryDrivers.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase">Secondary Drivers</div>
            <div className="space-y-1">
              {secondaryDrivers.map((driver) => (
                <div
                  key={driver.id}
                  className={cn(
                    'flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors',
                    onDriverClick && 'cursor-pointer'
                  )}
                  onClick={() => onDriverClick?.(driver)}
                >
                  <div className="flex items-center gap-2">
                    {categoryIcons[driver.category] || <AlertTriangle className="h-4 w-4 text-gray-400" />}
                    <span className="text-sm text-gray-700">{driver.name}</span>
                    {driver.isEmerging && (
                      <Badge variant="outline" className="text-xs px-1">New</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'text-sm font-medium px-1.5 py-0.5 rounded',
                      getImpactColor(driver.impactScore)
                    )}>
                      {driver.impactScore}
                    </span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
