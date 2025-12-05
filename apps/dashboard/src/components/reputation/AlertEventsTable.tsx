/**
 * AlertEventsTable Component (Sprint S57)
 *
 * Displays a table of alert events with actions to acknowledge, resolve, or mute.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandReputationAlertEvent, ReputationAlertStatus } from '@pravado/types';
import {
  listAlertEvents,
  acknowledgeAlertEvent,
  resolveAlertEvent,
  muteAlertEvent,
  getAlertStatusLabel,
  getAlertStatusColor,
  getAlertStatusBgColor,
  formatDateTime,
  formatDelta,
} from '@/lib/brandReputationAlertsApi';

interface AlertEventsTableProps {
  filterStatus?: ReputationAlertStatus;
  onViewEvent?: (event: BrandReputationAlertEvent) => void;
  refreshTrigger?: number;
}

export function AlertEventsTable({
  filterStatus,
  onViewEvent,
  refreshTrigger = 0,
}: AlertEventsTableProps) {
  const [events, setEvents] = useState<BrandReputationAlertEvent[]>([]);
  const [counts, setCounts] = useState({ new: 0, acknowledged: 0, muted: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<ReputationAlertStatus | undefined>(
    filterStatus
  );

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listAlertEvents({
        status: selectedStatus,
        limit: 50,
        sortBy: 'triggeredAt',
        sortOrder: 'desc',
      });
      setEvents(response.events);
      setCounts(response.counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alert events');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshTrigger]);

  const handleAcknowledge = async (event: BrandReputationAlertEvent) => {
    try {
      const updated = await acknowledgeAlertEvent(event.id);
      setEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
      setCounts((prev) => ({
        ...prev,
        new: Math.max(0, prev.new - 1),
        acknowledged: prev.acknowledged + 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to acknowledge event');
    }
  };

  const handleResolve = async (event: BrandReputationAlertEvent) => {
    const notes = prompt('Enter resolution notes:');
    if (!notes) return;
    try {
      const updated = await resolveAlertEvent(event.id, notes);
      setEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
      setCounts((prev) => ({
        ...prev,
        [event.status]: Math.max(0, prev[event.status] - 1),
        resolved: prev.resolved + 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve event');
    }
  };

  const handleMute = async (event: BrandReputationAlertEvent) => {
    try {
      const updated = await muteAlertEvent(event.id);
      setEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
      setCounts((prev) => ({
        ...prev,
        [event.status]: Math.max(0, prev[event.status] - 1),
        muted: prev.muted + 1,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mute event');
    }
  };

  const statusFilters: { value: ReputationAlertStatus | undefined; label: string; count: number }[] = [
    { value: undefined, label: 'All', count: events.length },
    { value: 'new', label: 'New', count: counts.new },
    { value: 'acknowledged', label: 'Acknowledged', count: counts.acknowledged },
    { value: 'muted', label: 'Muted', count: counts.muted },
    { value: 'resolved', label: 'Resolved', count: counts.resolved },
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Alert Events</h2>
          <div className="flex space-x-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.label}
                onClick={() => setSelectedStatus(filter.value)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedStatus === filter.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className="ml-1 text-xs">({filter.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {events.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">No alert events found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trigger Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Triggered At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => {
                const scoreDelta = event.overallScoreBefore !== undefined && event.overallScoreAfter !== undefined
                  ? event.overallScoreAfter - event.overallScoreBefore
                  : null;
                const { text: deltaText, colorClass: deltaColor } = formatDelta(scoreDelta);

                return (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onViewEvent?.(event)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAlertStatusBgColor(event.status)} ${getAlertStatusColor(event.status)}`}
                      >
                        {getAlertStatusLabel(event.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 line-clamp-2">{event.triggerReason || 'No reason provided'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {event.overallScoreBefore !== undefined && event.overallScoreAfter !== undefined ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">{event.overallScoreBefore?.toFixed(1)}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-sm font-medium">{event.overallScoreAfter?.toFixed(1)}</span>
                          <span className={`text-sm ${deltaColor}`}>({deltaText})</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(event.triggeredAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2" onClick={(e) => e.stopPropagation()}>
                        {event.status === 'new' && (
                          <button
                            onClick={() => handleAcknowledge(event)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Acknowledge"
                          >
                            Ack
                          </button>
                        )}
                        {(event.status === 'new' || event.status === 'acknowledged') && (
                          <>
                            <button
                              onClick={() => handleResolve(event)}
                              className="text-green-600 hover:text-green-900"
                              title="Resolve"
                            >
                              Resolve
                            </button>
                            <button
                              onClick={() => handleMute(event)}
                              className="text-gray-600 hover:text-gray-900"
                              title="Mute"
                            >
                              Mute
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
