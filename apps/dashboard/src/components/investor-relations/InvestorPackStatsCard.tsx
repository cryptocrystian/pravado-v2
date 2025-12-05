/**
 * Investor Pack Stats Card Component (Sprint S64)
 * Displays a single statistic card
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Loader2, type LucideIcon } from 'lucide-react';

interface InvestorPackStatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconColor?: string;
  bgColor?: string;
  trend?: string;
  trendValue?: string;
  subtitle?: string;
  isLoading?: boolean;
  className?: string;
}

export function InvestorPackStatsCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-indigo-600',
  bgColor = 'bg-indigo-50',
  trend,
  trendValue,
  subtitle,
  isLoading,
  className,
}: InvestorPackStatsCardProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4 flex items-center justify-center h-24">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <p className="text-xs text-green-600 mt-1">
                {trend} {trendValue}
              </p>
            )}
          </div>
          <div className={cn('p-2 rounded-lg', bgColor)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
