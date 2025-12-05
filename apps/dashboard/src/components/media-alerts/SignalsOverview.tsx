/**
 * Signals Overview Component (Sprint S43)
 * Dashboard cards showing alert statistics and trends
 */

import type { MediaAlertSignalsOverview } from '@pravado/types';

interface SignalsOverviewProps {
  signals: MediaAlertSignalsOverview | null;
  isLoading: boolean;
  onRefresh: () => void;
}

function StatCard({ label, value, color = 'blue' }: { label: string; value: number; color?: string }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className={`p-4 border rounded-lg ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm mt-1">{label}</p>
    </div>
  );
}

export function SignalsOverview({ signals, isLoading, onRefresh }: SignalsOverviewProps) {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!signals) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No signal data available</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
      >
        Refresh Signals
      </button>

      {/* Critical Alerts */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Past 24 Hours</h3>
        <div className="space-y-2">
          <StatCard
            label="Critical Alerts"
            value={signals.stats.criticalEvents24h}
            color="red"
          />
          <StatCard
            label="Warning Alerts"
            value={signals.stats.warningEvents24h}
            color="yellow"
          />
          <StatCard
            label="Info Alerts"
            value={signals.stats.infoEvents24h}
            color="blue"
          />
        </div>
      </div>

      {/* Total Stats */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Overall</h3>
        <div className="space-y-2">
          <StatCard
            label="Total Rules"
            value={signals.stats.totalRules}
            color="gray"
          />
          <StatCard
            label="Active Rules"
            value={signals.stats.activeRules}
            color="green"
          />
          <StatCard
            label="Unread Events"
            value={signals.stats.unreadEvents}
            color="blue"
          />
        </div>
      </div>

      {/* Top Alert Types */}
      {signals.topAlertTypes.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Alert Types (7d)</h3>
          <div className="space-y-2">
            {signals.topAlertTypes.map((type) => (
              <div
                key={type.alertType}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <span className="text-gray-700">{type.alertType.replace('_', ' ')}</span>
                <span className="font-medium text-gray-900">{type.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events Preview */}
      {signals.recentEvents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Events</h3>
          <div className="space-y-2">
            {signals.recentEvents.slice(0, 3).map((event) => (
              <div key={event.eventId} className="p-2 bg-gray-50 rounded text-xs">
                <p className="font-medium text-gray-900">{event.ruleName}</p>
                <p className="text-gray-600 mt-1 truncate">{event.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
