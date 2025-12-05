/**
 * ComponentScorePanel Component (Sprint S56)
 * Displays component scores with visual breakdown
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getScoreColor,
  getComponentLabel,
  getComponentIcon,
  getTrendColor,
} from '@/lib/brandReputationApi';
import { cn } from '@/lib/utils';
import type { ComponentScore, ReputationComponent } from '@pravado/types';
import { ArrowUp, ArrowDown, Minus, BarChart3 } from 'lucide-react';

interface ComponentScorePanelProps {
  componentScores: ComponentScore[];
  strongestComponent?: ReputationComponent;
  weakestComponent?: ReputationComponent;
  className?: string;
}

export function ComponentScorePanel({
  componentScores,
  strongestComponent,
  weakestComponent,
  className,
}: ComponentScorePanelProps) {
  // Sort by score descending
  const sortedScores = [...componentScores].sort((a, b) => b.score - a.score);

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-600">
              Score Components
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {sortedScores.map((component) => {
          const isStrongest = component.component === strongestComponent;
          const isWeakest = component.component === weakestComponent;
          const scoreColorClass = getScoreColor(component.score);
          const trendColorClass = getTrendColor(component.trend);

          return (
            <div key={component.component} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getComponentIcon(component.component)}</span>
                  <span className="text-sm font-medium text-gray-700">
                    {getComponentLabel(component.component)}
                  </span>
                  {isStrongest && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 text-xs">
                      Strongest
                    </Badge>
                  )}
                  {isWeakest && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">
                      Weakest
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-lg font-bold', scoreColorClass)}>
                    {component.score.toFixed(0)}
                  </span>
                  {component.delta !== undefined && component.delta !== null && (
                    <div className="flex items-center gap-0.5">
                      {component.trend === 'up' && (
                        <ArrowUp className={cn('h-3 w-3', trendColorClass)} />
                      )}
                      {component.trend === 'down' && (
                        <ArrowDown className={cn('h-3 w-3', trendColorClass)} />
                      )}
                      {component.trend === 'flat' && (
                        <Minus className={cn('h-3 w-3', trendColorClass)} />
                      )}
                      <span className={cn('text-xs', trendColorClass)}>
                        {component.delta > 0 ? '+' : ''}
                        {component.delta.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-500',
                    component.score >= 80
                      ? 'bg-green-500'
                      : component.score >= 60
                      ? 'bg-blue-500'
                      : component.score >= 40
                      ? 'bg-yellow-500'
                      : component.score >= 20
                      ? 'bg-orange-500'
                      : 'bg-red-500'
                  )}
                  style={{ width: `${component.score}%` }}
                />
              </div>

              {/* Weight Contribution */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Weight: {component.weight}%</span>
                <span>Contribution: {component.contribution.toFixed(1)} pts</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
