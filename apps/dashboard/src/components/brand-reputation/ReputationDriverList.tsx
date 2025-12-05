/**
 * ReputationDriverList Component (Sprint S56)
 * Displays top positive and negative drivers of reputation
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  getDriverTypeColor,
  getDriverTypeBgColor,
  getComponentLabel,
  getSourceSystemLabel,
  formatRelativeTime,
} from '@/lib/brandReputationApi';
import { cn } from '@/lib/utils';
import type { ReputationDriver } from '@pravado/types';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';

interface ReputationDriverListProps {
  positiveDrivers: ReputationDriver[];
  negativeDrivers: ReputationDriver[];
  maxItems?: number;
  className?: string;
}

export function ReputationDriverList({
  positiveDrivers,
  negativeDrivers,
  maxItems = 5,
  className,
}: ReputationDriverListProps) {
  const limitedPositive = positiveDrivers.slice(0, maxItems);
  const limitedNegative = negativeDrivers.slice(0, maxItems);

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {/* Positive Drivers */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <CardTitle className="text-sm font-medium text-gray-600">
              Positive Drivers
            </CardTitle>
            <Badge variant="outline" className="bg-green-50 text-green-700 text-xs ml-auto">
              {positiveDrivers.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {limitedPositive.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No positive drivers in this period</p>
          ) : (
            limitedPositive.map((driver) => (
              <DriverItem key={driver.id} driver={driver} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Negative Drivers */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            <CardTitle className="text-sm font-medium text-gray-600">
              Negative Drivers
            </CardTitle>
            <Badge variant="outline" className="bg-red-50 text-red-700 text-xs ml-auto">
              {negativeDrivers.length} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {limitedNegative.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No negative drivers in this period</p>
          ) : (
            limitedNegative.map((driver) => (
              <DriverItem key={driver.id} driver={driver} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DriverItemProps {
  driver: ReputationDriver;
}

function DriverItem({ driver }: DriverItemProps) {
  const isPositive = driver.type === 'positive';
  const colorClass = getDriverTypeColor(driver.type);
  const bgColorClass = getDriverTypeBgColor(driver.type);

  return (
    <div className={cn('p-3 rounded-lg border', bgColorClass)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-800 truncate">
              {driver.title}
            </span>
          </div>
          <p className="text-xs text-gray-600 line-clamp-2">
            {driver.description}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={cn('flex items-center gap-0.5 font-bold text-sm', colorClass)}>
            {isPositive ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )}
            {isPositive ? '+' : ''}
            {driver.impact.toFixed(1)}
          </div>
          <span className="text-xs text-gray-500">
            {driver.impactPercentage.toFixed(0)}% of change
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200/50">
        <Badge variant="outline" className="text-xs bg-white/50">
          {getComponentLabel(driver.component)}
        </Badge>
        <Badge variant="outline" className="text-xs bg-white/50">
          {getSourceSystemLabel(driver.sourceSystem)}
        </Badge>
        <span className="text-xs text-gray-500 ml-auto">
          {formatRelativeTime(driver.occurredAt)}
        </span>
      </div>
    </div>
  );
}
