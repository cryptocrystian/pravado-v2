'use client';

/**
 * PlaybookCard Component (Sprint S67)
 * Displays a single scenario playbook with its details and actions
 */

import { useState } from 'react';
import type {
  ScenarioPlaybook,
  ScenarioRiskLevel,
  ScenarioPlaybookStatus,
  ScenarioTriggerType,
} from '@pravado/types';
import {
  SCENARIO_RISK_LEVEL_LABELS,
  RISK_LEVEL_COLORS,
  SCENARIO_PLAYBOOK_STATUS_LABELS,
  SCENARIO_TRIGGER_TYPE_LABELS,
} from '@pravado/types';

interface PlaybookCardProps {
  playbook: ScenarioPlaybook;
  onView?: (playbook: ScenarioPlaybook) => void;
  onEdit?: (playbook: ScenarioPlaybook) => void;
  onDelete?: (playbook: ScenarioPlaybook) => void;
  onActivate?: (playbook: ScenarioPlaybook) => void;
  onArchive?: (playbook: ScenarioPlaybook) => void;
}

export function PlaybookCard({
  playbook,
  onView,
  onEdit,
  onDelete,
  onActivate,
  onArchive,
}: PlaybookCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const riskColor = RISK_LEVEL_COLORS[playbook.riskLevel as ScenarioRiskLevel] || 'bg-gray-100';
  const statusLabel = SCENARIO_PLAYBOOK_STATUS_LABELS[playbook.status as ScenarioPlaybookStatus] || playbook.status;
  const triggerLabel = SCENARIO_TRIGGER_TYPE_LABELS[playbook.triggerType as ScenarioTriggerType] || playbook.triggerType;
  const riskLabel = SCENARIO_RISK_LEVEL_LABELS[playbook.riskLevel as ScenarioRiskLevel] || playbook.riskLevel;

  const isActive = playbook.status === 'active';
  const isDraft = playbook.status === 'draft';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className="text-lg font-semibold text-gray-900 truncate cursor-pointer hover:text-blue-600"
              onClick={() => onView?.(playbook)}
            >
              {playbook.name}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                isActive
                  ? 'bg-green-100 text-green-800'
                  : isDraft
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {statusLabel}
            </span>
          </div>

          {playbook.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {playbook.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {triggerLabel}
            </span>

            <span className={`inline-flex items-center px-2 py-0.5 rounded ${riskColor}`}>
              {riskLabel} Risk
            </span>

            {playbook.category && (
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                {playbook.category}
              </span>
            )}

            <span className="text-gray-400">
              v{playbook.version}
            </span>
          </div>

          {playbook.tags && playbook.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {playbook.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                >
                  {tag}
                </span>
              ))}
              {playbook.tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{playbook.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="relative ml-2">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onView?.(playbook);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      onEdit?.(playbook);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Edit Playbook
                  </button>
                  {isDraft && (
                    <button
                      onClick={() => {
                        onActivate?.(playbook);
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-gray-100"
                    >
                      Activate
                    </button>
                  )}
                  {isActive && (
                    <button
                      onClick={() => {
                        onArchive?.(playbook);
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-yellow-600 hover:bg-gray-100"
                    >
                      Archive
                    </button>
                  )}
                  <button
                    onClick={() => {
                      onDelete?.(playbook);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>
          Updated {new Date(playbook.updatedAt).toLocaleDateString()}
        </span>
        {playbook.targetSystems && playbook.targetSystems.length > 0 && (
          <span>
            {playbook.targetSystems.length} target system{playbook.targetSystems.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}
