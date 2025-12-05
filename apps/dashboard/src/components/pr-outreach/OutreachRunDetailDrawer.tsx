'use client';

/**
 * Outreach Run Detail Drawer Component (Sprint S44)
 * Displays full run details with events timeline
 */

import { useEffect, useState } from 'react';

import type { OutreachRunWithDetails } from '@pravado/types';

import { advanceOutreachRun, getOutreachRun, stopOutreachRun } from '@/lib/prOutreachApi';

export interface OutreachRunDetailDrawerProps {
  runId: string;
  onClose: () => void;
  onRunChange: () => void;
}

export function OutreachRunDetailDrawer({ runId, onClose, onRunChange }: OutreachRunDetailDrawerProps) {
  const [run, setRun] = useState<OutreachRunWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    loadRun();
  }, [runId]);

  const loadRun = async () => {
    setLoading(true);
    try {
      const data = await getOutreachRun(runId);
      setRun(data);
    } catch (error) {
      console.error('Failed to load run:', error);
      alert('Failed to load run details');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!confirm('Stop this run?')) return;

    setActing(true);
    try {
      await stopOutreachRun(runId, 'manual_stop');
      onRunChange();
      loadRun();
    } catch (error) {
      console.error('Failed to stop run:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActing(false);
    }
  };

  const handleAdvance = async () => {
    if (!confirm('Manually advance to next step?')) return;

    setActing(true);
    try {
      await advanceOutreachRun(runId, true);
      onRunChange();
      loadRun();
    } catch (error) {
      console.error('Failed to advance run:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActing(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'sent':
        return '✉️';
      case 'opened':
        return '👀';
      case 'clicked':
        return '🖱️';
      case 'replied':
        return '💬';
      case 'bounced':
        return '⚠️';
      case 'failed':
        return '❌';
      default:
        return '•';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between bg-gray-50">
        <div>
          <h2 className="text-xl font-semibold">Run Details</h2>
          {run && (
            <p className="text-sm text-gray-600 mt-1">
              {run.journalist.name} • {run.sequence.name}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        )}

        {!loading && run && (
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-medium capitalize">{run.status}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Current Step</div>
                  <div className="font-medium">{run.currentStepNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Steps Sent</div>
                  <div className="font-medium">{run.totalStepsSent}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Retries</div>
                  <div className="font-medium">{run.retryCount}</div>
                </div>
              </div>

              {run.nextStepAt && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">Next Step At</div>
                  <div className="font-medium">{formatDate(run.nextStepAt)}</div>
                </div>
              )}

              {run.repliedAt && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-green-600">Journalist Replied!</div>
                  <div className="font-medium">At step {run.replyStepNumber}</div>
                  <div className="text-sm">{formatDate(run.repliedAt)}</div>
                </div>
              )}

              {run.lastError && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-sm text-red-600">Last Error</div>
                  <div className="text-sm font-mono bg-red-50 p-2 rounded mt-1">
                    {run.lastError}
                  </div>
                </div>
              )}
            </div>

            {/* Journalist Info */}
            <div>
              <h3 className="font-medium mb-2">Journalist</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Name: </span>
                    <span className="font-medium">{run.journalist.name}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Email: </span>
                    <span className="font-medium">{run.journalist.email}</span>
                  </div>
                  {run.journalist.outlet && (
                    <div>
                      <span className="text-sm text-gray-600">Outlet: </span>
                      <span className="font-medium">{run.journalist.outlet}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Events Timeline */}
            <div>
              <h3 className="font-medium mb-2">Events Timeline</h3>
              {run.events.length === 0 && (
                <div className="text-center py-4 text-gray-500">No events yet</div>
              )}
              <div className="space-y-3">
                {run.events.map((event) => (
                  <div key={event.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{getEventIcon(event.eventType)}</span>
                      <div className="flex-1">
                        <div className="font-medium capitalize">{event.eventType}</div>
                        <div className="text-sm text-gray-600">
                          Step {event.stepNumber}
                        </div>
                        {event.emailSubject && (
                          <div className="text-sm mt-2 font-medium">{event.emailSubject}</div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(event.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {run && run.status === 'running' && (
        <div className="p-6 border-t bg-gray-50 flex items-center gap-3">
          <button
            onClick={handleAdvance}
            disabled={acting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Advance to Next Step
          </button>
          <button
            onClick={handleStop}
            disabled={acting}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            Stop Run
          </button>
        </div>
      )}
    </div>
  );
}
