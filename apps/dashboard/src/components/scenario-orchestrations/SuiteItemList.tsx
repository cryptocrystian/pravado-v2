'use client';

/**
 * SuiteItemList Component (Sprint S72)
 * List of simulation items within a suite
 */

import type { ScenarioSuiteItem, AIScenarioSimulation } from '@pravado/types';
import {
  CONDITION_TYPE_LABELS,
  CONDITION_TYPE_DESCRIPTIONS,
} from '../../lib/scenarioOrchestrationApi';

interface SuiteItemListProps {
  items: ScenarioSuiteItem[];
  simulations?: Map<string, AIScenarioSimulation>;
  onReorder?: (itemId: string, newIndex: number) => void;
  onEdit?: (item: ScenarioSuiteItem) => void;
  onRemove?: (item: ScenarioSuiteItem) => void;
  readonly?: boolean;
}

export function SuiteItemList({
  items,
  simulations,
  onReorder: _onReorder,
  onEdit,
  onRemove,
  readonly = false,
}: SuiteItemListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No simulations in this suite yet.</p>
        {!readonly && <p className="text-sm mt-1">Add simulations to build your scenario chain.</p>}
      </div>
    );
  }

  const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="space-y-2">
      {sortedItems.map((item, index) => {
        const simulation = simulations?.get(item.simulationId);
        const conditionLabel = CONDITION_TYPE_LABELS[item.triggerConditionType] || 'Unknown';
        const conditionDesc = CONDITION_TYPE_DESCRIPTIONS[item.triggerConditionType] || '';

        return (
          <div key={item.id} className="relative">
            {/* Connection line */}
            {index > 0 && (
              <div className="absolute left-6 -top-2 h-2 w-0.5 bg-gray-300" />
            )}

            <div className="flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
              {/* Order indicator */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-sm font-semibold">
                {index + 1}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {item.label || simulation?.name || 'Unknown Simulation'}
                  </h4>
                  {item.triggerConditionType !== 'always' && (
                    <span
                      className="px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800"
                      title={conditionDesc}
                    >
                      {conditionLabel}
                    </span>
                  )}
                </div>

                {simulation && (
                  <p className="text-xs text-gray-500">
                    {simulation.objectiveType.replace(/_/g, ' ')} - {simulation.simulationMode.replace(/_/g, ' ')}
                  </p>
                )}

                {item.notes && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.notes}</p>
                )}

                {/* Condition details */}
                {item.triggerConditionType !== 'always' && item.triggerCondition && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    <span className="font-medium">Condition:</span>{' '}
                    {renderConditionSummary(item.triggerConditionType, item.triggerCondition as Record<string, unknown>)}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!readonly && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit?.(item)}
                    className="p-1 text-gray-400 hover:text-indigo-600 rounded"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onRemove?.(item)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderConditionSummary(
  type: string,
  condition: Record<string, unknown>
): string {
  switch (type) {
    case 'risk_threshold':
      return `Risk level ${condition.comparison || '>='} ${condition.minRiskLevel}`;
    case 'keyword_match':
      const keywords = condition.keywords as string[] || [];
      return `Match ${condition.matchMode || 'any'}: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}`;
    case 'sentiment_shift':
      return `Sentiment ${condition.direction}${condition.magnitude ? ` (${condition.magnitude})` : ''}`;
    case 'outcome_match':
      return `Outcome type: ${condition.outcomeType}`;
    case 'agent_response':
      return `Agent: ${condition.agentRoleType || 'any'}`;
    default:
      return 'Custom condition';
  }
}
