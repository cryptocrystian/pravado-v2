/**
 * Admin Scheduler Page (Sprint S42)
 * Dashboard for managing scheduled background tasks
 */

'use client';

import type { SchedulerStats, SchedulerTask } from '@pravado/types';
import { useEffect, useState } from 'react';

import { TaskListTable } from '@/components/scheduler';
import {
  getSchedulerStats,
  listSchedulerTasks,
  runTaskNow,
  updateSchedulerTask,
} from '@/lib/schedulerApi';

export default function SchedulerPage() {
  const [tasks, setTasks] = useState<SchedulerTask[]>([]);
  const [stats, setStats] = useState<SchedulerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
  const [togglingTasks, setTogglingTasks] = useState<Set<string>>(new Set());

  // Load tasks and stats
  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [tasksData, statsData] = await Promise.all([
        listSchedulerTasks(),
        getSchedulerStats(),
      ]);

      setTasks(tasksData.tasks);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheduler data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Toggle task enabled/disabled
  const handleToggleTask = async (taskId: string, enabled: boolean) => {
    setTogglingTasks((prev) => new Set(prev).add(taskId));

    try {
      await updateSchedulerTask(taskId, { enabled });
      await loadData(); // Reload to get updated state
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task');
    } finally {
      setTogglingTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // Run task immediately
  const handleRunTask = async (taskName: string) => {
    setRunningTasks((prev) => new Set(prev).add(taskName));

    try {
      await runTaskNow(taskName);
      await loadData(); // Reload to get updated last run time
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run task');
    } finally {
      setRunningTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskName);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading scheduler...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Scheduler Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage scheduled background tasks and cron jobs
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total Tasks</div>
              <div className="mt-1 text-3xl font-bold text-gray-900">{stats.totalTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Enabled Tasks</div>
              <div className="mt-1 text-3xl font-bold text-green-600">{stats.enabledTasks}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total Runs</div>
              <div className="mt-1 text-3xl font-bold text-gray-900">{stats.totalRuns}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Successful</div>
              <div className="mt-1 text-3xl font-bold text-green-600">{stats.successfulRuns}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Failed</div>
              <div className="mt-1 text-3xl font-bold text-red-600">{stats.failedRuns}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Last 24h</div>
              <div className="mt-1 text-3xl font-bold text-blue-600">{stats.last24hRuns}</div>
            </div>
          </div>
        )}

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Scheduled Tasks</h2>
          </div>
          <TaskListTable
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onRunTask={handleRunTask}
            runningTasks={runningTasks}
            togglingTasks={togglingTasks}
          />
        </div>
      </div>
    </div>
  );
}
