/**
 * ReputationAlertsList Component (Sprint S56)
 * Displays active reputation alerts with actions
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getAlertSeverityColor,
  getAlertSeverityBgColor,
  formatRelativeTime,
  acknowledgeAlert,
  resolveAlert,
} from '@/lib/brandReputationApi';
import { cn } from '@/lib/utils';
import type { BrandReputationAlert, ReputationAlertSeverity } from '@pravado/types';
import {
  AlertTriangle,
  Info,
  AlertCircle,
  Bell,
  Check,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface ReputationAlertsListProps {
  alerts: BrandReputationAlert[];
  totalCount: number;
  unacknowledgedCount: number;
  criticalCount: number;
  onAlertAction?: () => void;
  className?: string;
}

export function ReputationAlertsList({
  alerts,
  totalCount,
  unacknowledgedCount,
  criticalCount,
  onAlertAction,
  className,
}: ReputationAlertsListProps) {
  const [loadingAlertId, setLoadingAlertId] = useState<string | null>(null);

  const handleAcknowledge = async (alertId: string) => {
    setLoadingAlertId(alertId);
    try {
      await acknowledgeAlert(alertId);
      onAlertAction?.();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    } finally {
      setLoadingAlertId(null);
    }
  };

  const handleResolve = async (alertId: string) => {
    const notes = prompt('Enter resolution notes:');
    if (!notes) return;

    setLoadingAlertId(alertId);
    try {
      await resolveAlert(alertId, notes);
      onAlertAction?.();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    } finally {
      setLoadingAlertId(null);
    }
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-sm font-medium text-gray-600">
              Reputation Alerts
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                <AlertCircle className="h-3 w-3 mr-1" />
                {criticalCount} Critical
              </Badge>
            )}
            {unacknowledgedCount > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                {unacknowledgedCount} New
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mb-2 text-green-500" />
            <p className="text-sm">No active alerts</p>
            <p className="text-xs">Your brand reputation is stable</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                isLoading={loadingAlertId === alert.id}
                onAcknowledge={() => handleAcknowledge(alert.id)}
                onResolve={() => handleResolve(alert.id)}
              />
            ))}
          </div>
        )}

        {totalCount > alerts.length && (
          <p className="text-xs text-gray-500 text-center mt-4 pt-2 border-t">
            Showing {alerts.length} of {totalCount} alerts
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertItemProps {
  alert: BrandReputationAlert;
  isLoading: boolean;
  onAcknowledge: () => void;
  onResolve: () => void;
}

function AlertItem({ alert, isLoading, onAcknowledge, onResolve }: AlertItemProps) {
  const severityColorClass = getAlertSeverityColor(alert.severity);
  const severityBgClass = getAlertSeverityBgColor(alert.severity);

  const getSeverityIcon = (severity: ReputationAlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('p-3 rounded-lg border', severityBgClass)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className={cn('mt-0.5', severityColorClass)}>
            {getSeverityIcon(alert.severity)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-800">
                {alert.title}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs capitalize', severityColorClass)}
              >
                {alert.severity}
              </Badge>
              {alert.isAcknowledged && !alert.isResolved && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  Acknowledged
                </Badge>
              )}
              {alert.isResolved && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  Resolved
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">
              {alert.message}
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>{formatRelativeTime(alert.createdAt)}</span>
              {alert.triggerValue !== undefined && alert.thresholdValue !== undefined && (
                <span>
                  | Score: {alert.triggerValue.toFixed(0)} / Threshold:{' '}
                  {alert.thresholdValue.toFixed(0)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {!alert.isResolved && (
          <div className="flex flex-col gap-1">
            {!alert.isAcknowledged && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={onAcknowledge}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Ack
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs bg-green-50 text-green-700 hover:bg-green-100"
              onClick={onResolve}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolve
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
