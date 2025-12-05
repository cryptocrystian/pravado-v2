/**
 * Executive Digest Stats Card Component (Sprint S62)
 * Overview statistics for digest management
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ExecDigestStats } from '@/lib/executiveDigestApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  Users,
  Send,
  CheckCircle,
  Activity,
  TrendingUp,
} from 'lucide-react';

interface ExecDigestStatsCardProps {
  stats: ExecDigestStats;
  isLoading?: boolean;
  className?: string;
}

export function ExecDigestStatsCard({
  stats,
  isLoading,
  className,
}: ExecDigestStatsCardProps) {
  const deliveryRate =
    stats.totalDeliveries > 0
      ? Math.round((stats.successfulDeliveries / stats.totalDeliveries) * 100)
      : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4 text-indigo-600" />
          Digest Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Digests */}
          <StatItem
            icon={<FileText className="h-4 w-4" />}
            label="Total Digests"
            value={stats.totalDigests}
            subValue={`${stats.activeDigests} active`}
            iconColor="text-blue-600"
            bgColor="bg-blue-50"
            isLoading={isLoading}
          />

          {/* Active Digests */}
          <StatItem
            icon={<TrendingUp className="h-4 w-4" />}
            label="Active"
            value={stats.activeDigests}
            subValue={`${stats.totalDigests - stats.activeDigests} paused`}
            iconColor="text-green-600"
            bgColor="bg-green-50"
            isLoading={isLoading}
          />

          {/* Total Recipients */}
          <StatItem
            icon={<Users className="h-4 w-4" />}
            label="Recipients"
            value={stats.totalRecipients}
            subValue={`${stats.activeRecipients} active`}
            iconColor="text-purple-600"
            bgColor="bg-purple-50"
            isLoading={isLoading}
          />

          {/* Total Deliveries */}
          <StatItem
            icon={<Send className="h-4 w-4" />}
            label="Total Deliveries"
            value={stats.totalDeliveries}
            subValue={`${stats.successfulDeliveries} successful`}
            iconColor="text-indigo-600"
            bgColor="bg-indigo-50"
            isLoading={isLoading}
          />

          {/* Successful Deliveries */}
          <StatItem
            icon={<CheckCircle className="h-4 w-4" />}
            label="Successful"
            value={stats.successfulDeliveries}
            subValue={`${stats.totalDeliveries - stats.successfulDeliveries} failed`}
            iconColor="text-emerald-600"
            bgColor="bg-emerald-50"
            isLoading={isLoading}
          />

          {/* Delivery Rate */}
          <StatItem
            icon={<TrendingUp className="h-4 w-4" />}
            label="Delivery Rate"
            value={`${deliveryRate}%`}
            subValue="success rate"
            iconColor={deliveryRate >= 90 ? 'text-green-600' : deliveryRate >= 70 ? 'text-yellow-600' : 'text-red-600'}
            bgColor={deliveryRate >= 90 ? 'bg-green-50' : deliveryRate >= 70 ? 'bg-yellow-50' : 'bg-red-50'}
            isLoading={isLoading}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  subValue?: string;
  iconColor: string;
  bgColor: string;
  isLoading?: boolean;
}

function StatItem({
  icon,
  label,
  value,
  subValue,
  iconColor,
  bgColor,
  isLoading,
}: StatItemProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn('p-2 rounded-lg', bgColor)}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-semibold text-gray-900">
          {isLoading ? (
            <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" />
          ) : (
            value
          )}
        </div>
        {subValue && (
          <div className="text-xs text-gray-400">{subValue}</div>
        )}
      </div>
    </div>
  );
}
