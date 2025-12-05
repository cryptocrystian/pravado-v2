'use client';

/**
 * SimulationCard Component (Sprint S71)
 * Card component for displaying an AI scenario simulation
 */

import type { AIScenarioSimulation } from '@pravado/types';

interface SimulationCardProps {
  simulation: AIScenarioSimulation;
  onView?: (simulation: AIScenarioSimulation) => void;
  onEdit?: (simulation: AIScenarioSimulation) => void;
  onDelete?: (simulation: AIScenarioSimulation) => void;
  onStartRun?: (simulation: AIScenarioSimulation) => void;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  configured: 'bg-blue-100 text-blue-800',
  running: 'bg-yellow-100 text-yellow-800',
  paused: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  archived: 'bg-gray-200 text-gray-600',
};

const OBJECTIVE_LABELS: Record<string, string> = {
  crisis_comms: 'Crisis Communications',
  investor_relations: 'Investor Relations',
  reputation: 'Reputation Management',
  go_to_market: 'Go-to-Market',
  regulatory: 'Regulatory',
  competitive: 'Competitive',
  earnings: 'Earnings',
  leadership_change: 'Leadership Change',
  m_and_a: 'M&A',
  custom: 'Custom',
};

const MODE_LABELS: Record<string, string> = {
  single_run: 'Single Run',
  multi_run: 'Multi-Run',
  what_if: 'What-If Analysis',
};

export function SimulationCard({
  simulation,
  onView,
  onEdit,
  onDelete,
  onStartRun,
}: SimulationCardProps) {
  const statusColor = STATUS_COLORS[simulation.status] || STATUS_COLORS.draft;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {simulation.name}
            </h3>
            {simulation.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                {simulation.description}
              </p>
            )}
          </div>
          <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {simulation.status}
          </span>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-50 text-purple-700">
            {OBJECTIVE_LABELS[simulation.objectiveType] || simulation.objectiveType}
          </span>
          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-indigo-50 text-indigo-700">
            {MODE_LABELS[simulation.simulationMode] || simulation.simulationMode}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          {simulation.runCount !== undefined && (
            <span>{simulation.runCount} run{simulation.runCount !== 1 ? 's' : ''}</span>
          )}
          {simulation.lastRunAt && (
            <span>Last run: {new Date(simulation.lastRunAt).toLocaleDateString()}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          {onView && (
            <button
              onClick={() => onView(simulation)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded"
            >
              View
            </button>
          )}
          {onStartRun && simulation.status !== 'running' && simulation.status !== 'archived' && (
            <button
              onClick={() => onStartRun(simulation)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded"
            >
              Start Run
            </button>
          )}
          {onEdit && simulation.status !== 'running' && (
            <button
              onClick={() => onEdit(simulation)}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
            >
              Edit
            </button>
          )}
          {onDelete && simulation.status !== 'running' && (
            <button
              onClick={() => onDelete(simulation)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
