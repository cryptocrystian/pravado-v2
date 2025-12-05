/**
 * Ops Dashboard Page (Sprint S27)
 * Internal observability dashboard for LLM usage, execution, and queue metrics
 */

'use client';

import { useEffect, useState } from 'react';

interface OpsOverview {
  execution: {
    period: string;
    runCounts: {
      total: number;
      success: number;
      failed: number;
      running: number;
    };
    avgRuntimeMs: number;
  };
  llmUsage: {
    totalTokens: number;
    totalCalls: number;
    errorRate: number;
    byProvider: Array<{
      provider: string;
      model: string;
      totalTokens: number;
      totalCalls: number;
      avgLatencyMs: number;
    }>;
  };
  recentFailures: Array<{
    id: string;
    playbookName: string | null;
    createdAt: string;
  }>;
}

interface QueueStats {
  pending: {
    total: number;
  };
  avgWaitTimeMs: number;
}

export default function OpsPage() {
  const [overview, setOverview] = useState<OpsOverview | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, queueRes] = await Promise.all([
          fetch('/api/v1/ops/overview?period=24h', {
            credentials: 'include',
          }),
          fetch('/api/v1/ops/queue', {
            credentials: 'include',
          }),
        ]);

        if (!overviewRes.ok || !queueRes.ok) {
          throw new Error('Failed to fetch ops metrics');
        }

        const overviewData = await overviewRes.json();
        const queueData = await queueRes.json();

        setOverview(overviewData.data);
        setQueueStats(queueData.data);
      } catch (err) {
        const error = err as Error;
        setError(error.message || 'Failed to load ops metrics');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Ops Dashboard</h1>
        <p>Loading metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Ops Dashboard</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  const successRate = overview?.execution.runCounts.total
    ? ((overview.execution.runCounts.success / overview.execution.runCounts.total) * 100).toFixed(1)
    : '0';

  const errorRate = overview?.llmUsage.errorRate
    ? (overview.llmUsage.errorRate * 100).toFixed(1)
    : '0';

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ops Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Internal observability for LLM usage, playbook execution, and queue health
        </p>
      </div>

      {/* System Health */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Runs (24h)</p>
          <p className="text-3xl font-bold mt-2">{overview?.execution.runCounts.total || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Success Rate: {successRate}%</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Queue Pending</p>
          <p className="text-3xl font-bold mt-2">{queueStats?.pending.total || 0}</p>
          <p className="text-sm text-gray-500 mt-2">
            Avg Wait: {Math.round((queueStats?.avgWaitTimeMs || 0) / 1000)}s
          </p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">LLM Calls (24h)</p>
          <p className="text-3xl font-bold mt-2">{overview?.llmUsage.totalCalls || 0}</p>
          <p className="text-sm text-gray-500 mt-2">Error Rate: {errorRate}%</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Tokens (24h)</p>
          <p className="text-3xl font-bold mt-2">
            {((overview?.llmUsage.totalTokens || 0) / 1000).toFixed(1)}k
          </p>
          <p className="text-sm text-gray-500 mt-2">LLM API usage</p>
        </div>
      </div>

      {/* LLM Usage by Provider */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2">LLM Usage by Provider/Model (24h)</h2>
        <p className="text-gray-600 mb-4">Token usage and performance per LLM provider</p>
        <div className="space-y-4">
          {overview?.llmUsage.byProvider && overview.llmUsage.byProvider.length > 0 ? (
            overview.llmUsage.byProvider.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">
                    {p.provider} - {p.model}
                  </p>
                  <p className="text-sm text-gray-600">
                    {p.totalCalls} calls, {(p.totalTokens / 1000).toFixed(1)}k tokens
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Avg: {p.avgLatencyMs}ms</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No LLM usage in the last 24 hours</p>
          )}
        </div>
      </div>

      {/* Recent Failures */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-2">Recent Failures</h2>
        <p className="text-gray-600 mb-4">Last 10 failed playbook runs</p>
        <div className="space-y-2">
          {overview?.recentFailures && overview.recentFailures.length > 0 ? (
            overview.recentFailures.map((failure) => (
              <div key={failure.id} className="flex items-center justify-between border-b pb-2">
                <div>
                  <p className="font-medium">{failure.playbookName || 'Unknown Playbook'}</p>
                  <p className="text-sm text-gray-600">{failure.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {new Date(failure.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No recent failures</p>
          )}
        </div>
      </div>
    </div>
  );
}
