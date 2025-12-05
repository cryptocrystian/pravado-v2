'use client';

/**
 * RunViewer Component (Sprint S71)
 * Displays simulation run details with agent turns
 */

import { useState, useEffect, useRef } from 'react';
import type { AIScenarioRun, AIScenarioAgent, AIScenarioTurn } from '@pravado/types';
import {
  getRunDetail,
  stepRun,
  abortRun,
  runToCompletion,
  listTurns,
} from '../../lib/aiScenarioSimulationApi';

interface RunViewerProps {
  runId: string;
  onClose?: () => void;
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  internal_exec: { bg: 'bg-blue-100', text: 'text-blue-800' },
  journalist: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  investor: { bg: 'bg-green-100', text: 'text-green-800' },
  customer: { bg: 'bg-purple-100', text: 'text-purple-800' },
  employee: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  regulator: { bg: 'bg-red-100', text: 'text-red-800' },
  market_analyst: { bg: 'bg-orange-100', text: 'text-orange-800' },
  system: { bg: 'bg-gray-100', text: 'text-gray-800' },
  critic: { bg: 'bg-pink-100', text: 'text-pink-800' },
};

const RUN_STATUS_COLORS: Record<string, string> = {
  starting: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  aborted: 'bg-orange-100 text-orange-800',
};

export function RunViewer({ runId, onClose }: RunViewerProps) {
  const [run, setRun] = useState<AIScenarioRun | null>(null);
  const [agents, setAgents] = useState<AIScenarioAgent[]>([]);
  const [turns, setTurns] = useState<AIScenarioTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const [stepping, setStepping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnsEndRef = useRef<HTMLDivElement>(null);

  const fetchRunDetail = async () => {
    try {
      const detail = await getRunDetail(runId);
      setRun(detail.run);
      setAgents(detail.agents);

      // Also fetch all turns
      const turnsResult = await listTurns(runId, { limit: 100, sortOrder: 'asc' });
      setTurns(turnsResult.turns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load run');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRunDetail();

    // Poll for updates if run is in progress
    const interval = setInterval(() => {
      if (run?.status === 'in_progress' || run?.status === 'starting') {
        fetchRunDetail();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [runId, run?.status]);

  useEffect(() => {
    // Auto-scroll to latest turn
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns.length]);

  const handleStep = async () => {
    setStepping(true);
    setError(null);
    try {
      await stepRun(runId);
      await fetchRunDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance step');
    } finally {
      setStepping(false);
    }
  };

  const handleRunToCompletion = async () => {
    setStepping(true);
    setError(null);
    try {
      await runToCompletion(runId, { maxSteps: 10 });
      await fetchRunDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run to completion');
    } finally {
      setStepping(false);
    }
  };

  const handleAbort = async () => {
    if (!confirm('Are you sure you want to abort this run?')) return;

    try {
      await abortRun(runId);
      await fetchRunDetail();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to abort run');
    }
  };

  const getAgentById = (agentId: string) => agents.find((a) => a.id === agentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="text-center py-12 text-gray-500">
        Run not found
      </div>
    );
  }

  const statusColor = RUN_STATUS_COLORS[run.status] || RUN_STATUS_COLORS.starting;
  const isRunning = run.status === 'in_progress' || run.status === 'starting';
  const canStep = isRunning && run.currentStep < run.maxSteps;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {run.runLabel || `Run #${run.runNumber}`}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
              {run.status}
            </span>
            <span className="text-sm text-gray-500">
              Step {run.currentStep} of {run.maxSteps}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canStep && (
            <>
              <button
                onClick={handleStep}
                disabled={stepping}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg disabled:opacity-50"
              >
                {stepping ? 'Stepping...' : 'Step'}
              </button>
              <button
                onClick={handleRunToCompletion}
                disabled={stepping}
                className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
              >
                Run to Completion
              </button>
            </>
          )}
          {isRunning && (
            <button
              onClick={handleAbort}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 border border-red-200 rounded-lg"
            >
              Abort
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Agents bar */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          {agents.map((agent) => {
            const colors = ROLE_COLORS[agent.roleType] || ROLE_COLORS.system;
            return (
              <span
                key={agent.id}
                className={`px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
              >
                {agent.displayName}
              </span>
            );
          })}
        </div>
      </div>

      {/* Turns */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No turns yet. Click &quot;Step&quot; to advance the simulation.
          </div>
        )}

        {turns.map((turn) => {
          const agent = getAgentById(turn.speakerAgentId);
          const colors = agent ? ROLE_COLORS[agent.roleType] || ROLE_COLORS.system : ROLE_COLORS.system;

          return (
            <div key={turn.id} className="flex gap-3">
              {/* Avatar */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                <span className={`text-sm font-medium ${colors.text}`}>
                  {(agent?.displayName || '?')[0]}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {agent?.displayName || 'Unknown Agent'}
                  </span>
                  <span className="text-xs text-gray-400">
                    Step {turn.stepIndex}
                  </span>
                  {turn.channel && (
                    <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                      {turn.channel}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-3 rounded-lg border border-gray-200">
                  {turn.content}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={turnsEndRef} />
      </div>

      {/* Risk indicator */}
      {run.riskLevel && run.riskLevel !== 'low' && (
        <div className={`px-4 py-2 text-sm font-medium ${
          run.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
          run.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          Risk Level: {run.riskLevel.toUpperCase()}
        </div>
      )}
    </div>
  );
}
