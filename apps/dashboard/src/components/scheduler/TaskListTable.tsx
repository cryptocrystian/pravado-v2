/**
 * Task List Table Component (Sprint S42)
 * Displays scheduler tasks in a table with actions
 */

import type { SchedulerTask } from '@pravado/types';
import { RunNowButton } from './RunNowButton';
import { StatusBadge } from './StatusBadge';
import { ToggleButton } from './ToggleButton';

interface TaskListTableProps {
  tasks: SchedulerTask[];
  onToggleTask: (taskId: string, enabled: boolean) => Promise<void>;
  onRunTask: (taskName: string) => Promise<void>;
  runningTasks: Set<string>;
  togglingTasks: Set<string>;
}

export function TaskListTable({
  tasks,
  onToggleTask,
  onRunTask,
  runningTasks,
  togglingTasks,
}: TaskListTableProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Task
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Schedule
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Run
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Enabled
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                No scheduler tasks found
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{task.name}</div>
                  {task.description && (
                    <div className="text-sm text-gray-500">{task.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{task.schedule}</code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(task.lastRunAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={task.lastRunStatus} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ToggleButton
                    enabled={task.enabled}
                    onChange={(enabled) => onToggleTask(task.id, enabled)}
                    disabled={togglingTasks.has(task.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <RunNowButton
                    onClick={() => onRunTask(task.name)}
                    disabled={!task.enabled}
                    isRunning={runningTasks.has(task.name)}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
