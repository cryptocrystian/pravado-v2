/**
 * CrisisSeverityBadge Component (Sprint S55)
 *
 * Renders a colored badge with icon based on crisis severity,
 * trajectory, and propagation level
 */

'use client';

import React from 'react';
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Radio,
  Zap,
  Flame,
} from 'lucide-react';
import type {
  CrisisSeverity,
  CrisisTrajectory,
  CrisisPropagationLevel,
} from '@pravado/types';
import { SEVERITY_COLORS, TRAJECTORY_COLORS, PROPAGATION_COLORS } from '@/lib/crisisApi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CrisisSeverityBadgeProps {
  severity: CrisisSeverity;
  trajectory?: CrisisTrajectory;
  propagation?: CrisisPropagationLevel;
  showTrajectory?: boolean;
  showPropagation?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SEVERITY_ICONS: Record<CrisisSeverity, React.ReactNode> = {
  low: <Info className="h-3 w-3" />,
  medium: <AlertCircle className="h-3 w-3" />,
  high: <AlertTriangle className="h-3 w-3" />,
  critical: <AlertOctagon className="h-3 w-3" />,
  severe: <Flame className="h-3 w-3" />,
};

const TRAJECTORY_ICONS: Record<CrisisTrajectory, React.ReactNode> = {
  improving: <TrendingDown className="h-3 w-3 text-green-600" />,
  stable: <Minus className="h-3 w-3 text-blue-600" />,
  worsening: <TrendingUp className="h-3 w-3 text-orange-600" />,
  critical: <Zap className="h-3 w-3 text-red-600" />,
  resolved: <Activity className="h-3 w-3 text-gray-500" />,
  unknown: <Activity className="h-3 w-3 text-gray-400" />,
};

const PROPAGATION_ICONS: Record<CrisisPropagationLevel, React.ReactNode> = {
  contained: <Radio className="h-3 w-3" />,
  spreading: <Radio className="h-3 w-3" />,
  viral: <Zap className="h-3 w-3" />,
  mainstream: <Activity className="h-3 w-3" />,
  saturated: <Flame className="h-3 w-3" />,
};

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-2.5 py-1.5',
};

export function CrisisSeverityBadge({
  severity,
  trajectory,
  propagation,
  showTrajectory = false,
  showPropagation = false,
  size = 'md',
  className = '',
}: CrisisSeverityBadgeProps) {
  const severityColors = SEVERITY_COLORS[severity];
  const trajectoryColors = trajectory ? TRAJECTORY_COLORS[trajectory] : null;
  const propagationColors = propagation ? PROPAGATION_COLORS[propagation] : null;

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        {/* Severity Badge */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn(
                'font-semibold uppercase flex items-center gap-1',
                severityColors.bg,
                severityColors.text,
                severityColors.border,
                SIZE_CLASSES[size]
              )}
            >
              {SEVERITY_ICONS[severity]}
              <span>{severity}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Severity: {severity.toUpperCase()}</p>
          </TooltipContent>
        </Tooltip>

        {/* Trajectory Badge */}
        {showTrajectory && trajectory && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-1 capitalize',
                  trajectoryColors?.bg,
                  trajectoryColors?.text,
                  SIZE_CLASSES[size]
                )}
              >
                {TRAJECTORY_ICONS[trajectory]}
                <span>{trajectory}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Trajectory: {trajectory}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Propagation Badge */}
        {showPropagation && propagation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={cn(
                  'flex items-center gap-1 capitalize',
                  propagationColors?.bg,
                  propagationColors?.text,
                  SIZE_CLASSES[size]
                )}
              >
                {PROPAGATION_ICONS[propagation]}
                <span>{propagation}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Propagation: {propagation}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

/**
 * Compact severity indicator for tight spaces
 */
export function CrisisSeverityIndicator({
  severity,
  trajectory,
  className = '',
}: {
  severity: CrisisSeverity;
  trajectory?: CrisisTrajectory;
  className?: string;
}) {
  const severityColors = SEVERITY_COLORS[severity];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-0.5 rounded-full px-2 py-0.5',
              severityColors.bg,
              className
            )}
          >
            <span className={cn('font-bold text-xs', severityColors.text)}>
              {severity.charAt(0).toUpperCase()}
            </span>
            {trajectory && (
              <span className="ml-0.5">{TRAJECTORY_ICONS[trajectory]}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {severity.toUpperCase()}
            {trajectory && ` - ${trajectory}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default CrisisSeverityBadge;
