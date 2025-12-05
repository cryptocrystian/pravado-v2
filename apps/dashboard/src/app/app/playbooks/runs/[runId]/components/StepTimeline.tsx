/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * StepTimeline Component (Sprint S19)
 * Vertical timeline showing all steps with state colors and parallel branches
 */

'use client';

import type { StepRunView } from '@pravado/types';
import { motion } from 'framer-motion';

interface StepTimelineProps {
  steps: StepRunView[];
  selectedStepKey: string | null;
  onSelectStep: (stepKey: string) => void;
}

/**
 * Get state color classes
 */
function getStateColor(state: string): { bg: string; border: string; text: string } {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    queued: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
    running: { bg: 'bg-blue-100', border: 'border-blue-600', text: 'text-blue-700' },
    success: { bg: 'bg-green-100', border: 'border-green-600', text: 'text-green-700' },
    failed: { bg: 'bg-red-100', border: 'border-red-600', text: 'text-red-700' },
    waiting_for_dependencies: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-600',
      text: 'text-yellow-700',
    },
    blocked: { bg: 'bg-purple-100', border: 'border-purple-600', text: 'text-purple-700' },
    canceled: { bg: 'bg-gray-100', border: 'border-gray-600', text: 'text-gray-700' },
  };
  return colors[state] || colors.queued;
}

/**
 * Get step type icon
 */
function getStepIcon(type: string): string {
  const icons: Record<string, string> = {
    AGENT: '🤖',
    DATA: '⚙️',
    BRANCH: '◆',
    API: '🌐',
  };
  return icons[type] || '📦';
}

/**
 * Format timestamp
 */
function formatTime(timestamp: string | null): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Calculate step duration
 */
function getStepDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return '—';
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const durationMs = end - start;
  const seconds = (durationMs / 1000).toFixed(1);
  return `${seconds}s`;
}

export function StepTimeline({ steps, selectedStepKey, onSelectStep }: StepTimelineProps) {
  return (
    <div className="bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Execution Timeline</h2>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-gray-300" />

          {/* Steps */}
          <div className="space-y-1">
            {steps.map((step, index) => {
              const colors = getStateColor(step.state);
              const icon = getStepIcon(step.type as string);
              const isSelected = step.key === selectedStepKey;
              const duration = getStepDuration(step.startedAt, step.completedAt);

              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => onSelectStep(step.key)}
                    className={`
                      w-full text-left relative pl-10 pr-4 py-3 rounded-lg
                      transition-all duration-150
                      ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : 'hover:bg-gray-50'}
                    `}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`
                        absolute left-[6px] top-1/2 -translate-y-1/2
                        w-4 h-4 rounded-full border-2 ${colors.border} bg-white
                        flex items-center justify-center
                      `}
                    >
                      {step.state === 'running' && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      )}
                      {step.state === 'success' && (
                        <div className="text-green-600 text-xs font-bold">✓</div>
                      )}
                      {step.state === 'failed' && (
                        <div className="text-red-600 text-xs font-bold">✗</div>
                      )}
                    </div>

                    {/* Step content */}
                    {/* @ts-ignore */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{String(icon)}</span>
                        <span className="font-medium text-gray-900 text-sm">{step.name}</span>
                        <span
                          className={`
                            px-2 py-0.5 rounded text-xs font-medium uppercase
                            ${colors.bg} ${colors.text}
                          `}
                        >
                          {step.state}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="font-mono">{step.key}</span>
                        <span>•</span>
                        <span>{step.type}</span>
                        {step.attempt > 0 && (
                          <>
                            <span>•</span>
                            <span>
                              Attempt {step.attempt + 1}/{step.maxAttempts}
                            </span>
                          </>
                        )}
                      </div>

                      {step.startedAt && (
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatTime(step.startedAt)}</span>
                          {step.completedAt && (
                            <>
                              <span>→</span>
                              <span>{formatTime(step.completedAt)}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{duration}</span>
                        </div>
                      )}
                    </div>

                    {/* Personality badge for AGENT steps */}
                    {step.type === 'AGENT' && step.personality && (
                      <div className="mt-1 text-xs text-purple-600 font-medium">
                        🎭 {step.personality.name}
                      </div>
                    )}

                    {/* Error indicator */}
                    {step.state === 'failed' && step.error && (
                      <div className="mt-1 text-xs text-red-600 truncate">
                        Error: {typeof step.error === 'object' && step.error !== null
                          ? (step.error as any).message || JSON.stringify(step.error)
                          : String(step.error)}
                      </div>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
