/**
 * AlertsPanel Component (Sprint S32)
 *
 * Minimal, functional component for displaying billing usage alerts.
 * Displays alerts with severity colors, allows acknowledgement, and shows summary.
 */

'use client';

import type { BillingAlertRecord, BillingAlertSummary } from '@pravado/types';
import { useEffect, useState } from 'react';

/**
 * API Response types
 */
interface AlertsResponse {
  success: boolean;
  data: {
    alerts: BillingAlertRecord[];
    summary: BillingAlertSummary;
  };
}

interface AcknowledgeResponse {
  success: boolean;
  data: {
    alertId: string;
    acknowledgedAt: string;
  };
}

/**
 * Severity badge styling
 */
const severityStyles = {
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

/**
 * Alert type labels
 */
const alertTypeLabels: Record<string, string> = {
  usage_soft_warning: 'Usage Warning',
  usage_hard_warning: 'Hard Limit Reached',
  overage_incurred: 'Overage Incurred',
  trial_expiring: 'Trial Expiring',
  subscription_canceled: 'Subscription Canceled',
  plan_upgraded: 'Plan Upgraded',
  plan_downgraded: 'Plan Downgraded',
};

/**
 * AlertsPanel Component
 */
export function AlertsPanel() {
  const [alerts, setAlerts] = useState<BillingAlertRecord[]>([]);
  const [summary, setSummary] = useState<BillingAlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledging, setAcknowledging] = useState<Set<string>>(new Set());

  /**
   * Fetch alerts on mount
   */
  useEffect(() => {
    fetchAlerts();
  }, []);

  /**
   * Fetch alerts from API
   */
  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/v1/billing/alerts', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      const data = (await response.json()) as AlertsResponse;

      if (data.success) {
        setAlerts(data.data.alerts);
        setSummary(data.data.summary);
      } else {
        throw new Error('Failed to fetch alerts');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Failed to fetch alerts:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Acknowledge an alert
   */
  const acknowledgeAlert = async (alertId: string) => {
    try {
      setAcknowledging((prev) => new Set(prev).add(alertId));

      const response = await fetch(`/api/v1/billing/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to acknowledge alert: ${response.statusText}`);
      }

      const data = (await response.json()) as AcknowledgeResponse;

      if (data.success) {
        // Update alert in local state
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId
              ? { ...alert, acknowledgedAt: data.data.acknowledgedAt }
              : alert
          )
        );

        // Update summary counts
        if (summary) {
          setSummary({
            ...summary,
            unacknowledged: Math.max(0, summary.unacknowledged - 1),
          });
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error('Failed to acknowledge alert:', error);
      alert(`Failed to acknowledge alert: ${error.message}`);
    } finally {
      setAcknowledging((prev) => {
        const next = new Set(prev);
        next.delete(alertId);
        return next;
      });
    }
  };

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold">Billing Alerts</h2>
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading alerts...</div>
        </div>
      </div>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <h2 className="mb-4 text-lg font-semibold text-red-900">Billing Alerts</h2>
        <div className="text-red-700">
          <p className="font-medium">Failed to load alerts</p>
          <p className="mt-2 text-sm">{error}</p>
          <button
            onClick={fetchAlerts}
            className="mt-4 rounded bg-red-100 px-4 py-2 text-sm font-medium text-red-900 hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Billing Alerts</h2>
        <button
          onClick={fetchAlerts}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
            <div className="text-sm text-gray-600">Total Alerts</div>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <div className="text-2xl font-bold text-blue-900">{summary.bySeverity.info}</div>
            <div className="text-sm text-blue-700">Info</div>
          </div>
          <div className="rounded-lg bg-yellow-50 p-3">
            <div className="text-2xl font-bold text-yellow-900">{summary.bySeverity.warning}</div>
            <div className="text-sm text-yellow-700">Warning</div>
          </div>
          <div className="rounded-lg bg-red-50 p-3">
            <div className="text-2xl font-bold text-red-900">{summary.bySeverity.critical}</div>
            <div className="text-sm text-red-700">Critical</div>
          </div>
        </div>
      )}

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          <p className="text-lg font-medium">No alerts</p>
          <p className="mt-1 text-sm">All good! Your billing is on track.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg border p-4 ${
                alert.acknowledgedAt ? 'opacity-50' : ''
              } ${severityStyles[alert.severity]}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {alertTypeLabels[alert.alertType] || alert.alertType}
                    </span>
                    {alert.severity === 'critical' && (
                      <span className="text-xs">🔴</span>
                    )}
                    {alert.severity === 'warning' && (
                      <span className="text-xs">⚠️</span>
                    )}
                    {alert.severity === 'info' && (
                      <span className="text-xs">ℹ️</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium">{alert.message}</p>
                  <p className="mt-1 text-xs opacity-75">
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                  {alert.acknowledgedAt && (
                    <p className="mt-1 text-xs font-medium opacity-75">
                      ✓ Acknowledged {new Date(alert.acknowledgedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {!alert.acknowledgedAt && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    disabled={acknowledging.has(alert.id)}
                    className="ml-4 rounded bg-white px-3 py-1 text-sm font-medium shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  >
                    {acknowledging.has(alert.id) ? 'Acknowledging...' : 'Acknowledge'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
