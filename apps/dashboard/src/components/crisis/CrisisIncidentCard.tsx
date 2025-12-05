/**
 * CrisisIncidentCard Component (Sprint S55)
 *
 * Displays a crisis incident card with severity, trajectory, propagation,
 * and quick stats for the crisis response dashboard
 */

'use client';

import React from 'react';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Users,
  Activity,
  ArrowUpRight,
  Radio,
} from 'lucide-react';
import type { CrisisIncident } from '@pravado/types';
import {
  SEVERITY_COLORS,
  TRAJECTORY_COLORS,
  PROPAGATION_COLORS,
  STATUS_COLORS,
  formatTimeAgo,
} from '@/lib/crisisApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface CrisisIncidentCardProps {
  incident: CrisisIncident;
  onSelect?: (incident: CrisisIncident) => void;
  onEscalate?: (incident: CrisisIncident) => void;
  onViewBrief?: (incident: CrisisIncident) => void;
  isSelected?: boolean;
  className?: string;
}

export default function CrisisIncidentCard({
  incident,
  onSelect,
  onEscalate,
  onViewBrief,
  isSelected = false,
  className = '',
}: CrisisIncidentCardProps) {
  const severityColors = SEVERITY_COLORS[incident.severity];
  const trajectoryColors = TRAJECTORY_COLORS[incident.trajectory];
  const propagationColors = PROPAGATION_COLORS[incident.propagationLevel];
  const statusColors = STATUS_COLORS[incident.status];

  const getTrajectoryIcon = () => {
    switch (incident.trajectory) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'worsening':
      case 'critical':
        return <TrendingUp className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatReach = (reach: number): string => {
    if (reach >= 1_000_000) return `${(reach / 1_000_000).toFixed(1)}M`;
    if (reach >= 1_000) return `${(reach / 1_000).toFixed(1)}K`;
    return reach.toString();
  };

  return (
    <Card
      className={cn(
        'transition-all cursor-pointer hover:shadow-md',
        isSelected && 'ring-2 ring-red-500 bg-red-50/30',
        incident.severity === 'severe' && 'border-red-300',
        incident.severity === 'critical' && 'border-orange-300',
        className
      )}
      onClick={() => onSelect?.(incident)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {incident.isEscalated && (
                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
              )}
              <CardTitle className="text-lg truncate">{incident.title}</CardTitle>
            </div>
            {incident.incidentCode && (
              <p className="text-xs text-muted-foreground font-mono">
                {incident.incidentCode}
              </p>
            )}
          </div>

          {/* Severity Badge */}
          <Badge
            variant="outline"
            className={cn(
              'ml-2 shrink-0 font-semibold uppercase text-xs',
              severityColors.bg,
              severityColors.text,
              severityColors.border
            )}
          >
            {incident.severity}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status & Trajectory */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={cn('text-xs', statusColors.bg, statusColors.text)}
          >
            {incident.status}
          </Badge>
          <div className="flex items-center gap-1">
            {getTrajectoryIcon()}
            <span
              className={cn(
                'text-xs font-medium capitalize',
                trajectoryColors.text
              )}
            >
              {incident.trajectory}
            </span>
          </div>
          <Badge
            variant="outline"
            className={cn('text-xs', propagationColors.bg, propagationColors.text)}
          >
            <Radio className="h-3 w-3 mr-1" />
            {incident.propagationLevel}
          </Badge>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-3 py-2 border-t border-b">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span className="text-xs">Mentions</span>
            </div>
            <div className="text-lg font-semibold">{incident.mentionCount}</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span className="text-xs">Reach</span>
            </div>
            <div className="text-lg font-semibold">
              {formatReach(incident.estimatedReach)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Sentiment</div>
            <div
              className={cn(
                'text-lg font-semibold',
                incident.sentimentScore !== undefined &&
                  (incident.sentimentScore < -0.3
                    ? 'text-red-600'
                    : incident.sentimentScore > 0.3
                      ? 'text-green-600'
                      : 'text-yellow-600')
              )}
            >
              {incident.sentimentScore !== undefined
                ? incident.sentimentScore.toFixed(2)
                : 'N/A'}
            </div>
          </div>
        </div>

        {/* Escalation Level */}
        {incident.isEscalated && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-red-50 rounded-md">
            <ArrowUpRight className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700 font-medium">
              Escalation Level {incident.escalationLevel}
            </span>
          </div>
        )}

        {/* Keywords/Topics */}
        {incident.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {incident.keywords.slice(0, 4).map((keyword, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
            {incident.keywords.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{incident.keywords.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Affected Areas */}
        {(incident.affectedProducts.length > 0 ||
          incident.affectedRegions.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {incident.affectedProducts.slice(0, 2).map((product, idx) => (
              <Badge
                key={`prod-${idx}`}
                variant="secondary"
                className="text-xs bg-blue-100 text-blue-700"
              >
                {product}
              </Badge>
            ))}
            {incident.affectedRegions.slice(0, 2).map((region, idx) => (
              <Badge
                key={`reg-${idx}`}
                variant="secondary"
                className="text-xs bg-purple-100 text-purple-700"
              >
                {region}
              </Badge>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(incident.firstDetectedAt)}
          </div>

          <div className="flex gap-1">
            {onViewBrief && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewBrief(incident);
                }}
              >
                Brief
              </Button>
            )}
            {onEscalate && incident.status === 'active' && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onEscalate(incident);
                }}
              >
                Escalate
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
