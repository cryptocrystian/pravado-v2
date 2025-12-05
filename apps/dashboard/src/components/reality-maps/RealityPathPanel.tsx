'use client';

/**
 * RealityPathPanel Component (Sprint S73)
 * Panel for displaying paths and path comparisons
 */

import { useState } from 'react';
import type { RealityMapPath, PathComparison, RealityGraphPath } from '@pravado/types';
import {
  OUTCOME_TYPE_LABELS,
  getOutcomeTypeBadgeClass,
  formatProbability,
  formatScore,
  getRiskLevelBadgeClass,
  getRiskLevel,
} from '../../lib/realityMapApi';

interface RealityPathPanelProps {
  paths: RealityGraphPath[];
  fullPaths?: RealityMapPath[];
  comparisons?: PathComparison[];
  selectedPathId?: string | null;
  onPathSelect?: (pathId: string) => void;
  onPathHighlight?: (pathIds: string[]) => void;
}

export function RealityPathPanel({
  paths,
  fullPaths = [],
  comparisons = [],
  selectedPathId,
  onPathSelect,
  onPathHighlight,
}: RealityPathPanelProps) {
  const [activeTab, setActiveTab] = useState<'paths' | 'comparisons'>('paths');
  const [expandedPathId, setExpandedPathId] = useState<string | null>(null);

  // Get full path data if available
  const getFullPath = (pathId: string): RealityMapPath | undefined => {
    return fullPaths.find(p => p.id === pathId);
  };

  // Get path by ID from graph paths
  const getPath = (pathId: string): RealityGraphPath | undefined => {
    return paths.find(p => p.id === pathId);
  };

  const handlePathClick = (pathId: string) => {
    onPathSelect?.(pathId);
    setExpandedPathId(expandedPathId === pathId ? null : pathId);
  };

  const handlePathHover = (pathId: string, isHovering: boolean) => {
    onPathHighlight?.(isHovering ? [pathId] : []);
  };

  if (paths.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <p className="text-sm">No paths found</p>
        <p className="text-xs mt-1">Generate the reality map to see outcome paths</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('paths')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'paths'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Paths ({paths.length})
        </button>
        <button
          onClick={() => setActiveTab('comparisons')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            activeTab === 'comparisons'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Comparisons ({comparisons.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'paths' ? (
          <div className="p-3 space-y-2">
            {paths.map(path => {
              const fullPath = getFullPath(path.id);
              const isSelected = path.id === selectedPathId;
              const isExpanded = path.id === expandedPathId;

              return (
                <div
                  key={path.id}
                  className={`border rounded-lg transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onMouseEnter={() => handlePathHover(path.id, true)}
                  onMouseLeave={() => handlePathHover(path.id, false)}
                >
                  {/* Path Header */}
                  <button
                    onClick={() => handlePathClick(path.id)}
                    className="w-full p-3 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${path.outcomeType ? getOutcomeTypeBadgeClass(path.outcomeType) : 'bg-gray-100 text-gray-700'}`}>
                            {path.outcomeType ? OUTCOME_TYPE_LABELS[path.outcomeType] : 'Unknown'}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {path.label || `Path ${path.id.slice(0, 8)}`}
                          </span>
                        </div>
                        {path.description && (
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                            {path.description}
                          </p>
                        )}
                      </div>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Path Stats */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="font-medium text-indigo-600">
                        {formatProbability(path.cumulativeProbability)}
                      </span>
                      <span>•</span>
                      <span>{path.pathNodes.length} nodes</span>
                      <span>•</span>
                      <span className={getRiskLevelBadgeClass(getRiskLevel(path.riskScore))}>
                        Risk: {formatScore(path.riskScore)}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-3 space-y-3">
                      {/* Path nodes visualization */}
                      <div>
                        <h5 className="text-xs font-medium text-gray-700 mb-2">Path Nodes</h5>
                        <div className="flex items-center gap-1 overflow-x-auto pb-2">
                          {path.pathNodes.slice(0, 5).map((nodeId, idx) => (
                            <div key={nodeId} className="flex items-center">
                              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-medium text-indigo-700">
                                {idx + 1}
                              </div>
                              {idx < Math.min(path.pathNodes.length - 1, 4) && (
                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </div>
                          ))}
                          {path.pathNodes.length > 5 && (
                            <span className="text-xs text-gray-500 ml-1">
                              +{path.pathNodes.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Full path details if available */}
                      {fullPath && (
                        <>
                          {/* Key Drivers */}
                          {fullPath.keyDrivers && fullPath.keyDrivers.length > 0 && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-700 mb-1">Key Drivers</h5>
                              <div className="flex flex-wrap gap-1">
                                {fullPath.keyDrivers.map((driver, idx) => (
                                  <span
                                    key={idx}
                                    className={`px-1.5 py-0.5 rounded text-xs ${
                                      driver.direction === 'positive'
                                        ? 'bg-green-100 text-green-700'
                                        : driver.direction === 'negative'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {driver.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Narrative Summary */}
                          {fullPath.aiSummary && (
                            <div>
                              <h5 className="text-xs font-medium text-gray-700 mb-1">AI Summary</h5>
                              <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                                {fullPath.aiSummary}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => onPathHighlight?.([path.id])}
                          className="flex-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          Highlight Path
                        </button>
                        <button
                          onClick={() => {/* TODO: View full path */}}
                          className="flex-1 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {comparisons.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No comparisons available</p>
                <p className="text-xs mt-1">Comparisons are generated during analysis</p>
              </div>
            ) : (
              comparisons.map(comparison => {
                const pathAId = comparison.pathAId ?? comparison.path1Id;
                const pathBId = comparison.pathBId ?? comparison.path2Id;
                const pathA = getPath(pathAId);
                const pathB = getPath(pathBId);

                return (
                  <div key={comparison.id} className="border border-gray-200 rounded-lg p-3">
                    {/* Comparison Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">Comparing</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {pathA?.label || 'Path A'}
                        </span>
                        <span className="text-gray-400">vs</span>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {pathB?.label || 'Path B'}
                        </span>
                      </div>
                      {comparison.divergencePoint && (
                        <span className="text-xs text-gray-400">
                          Divergence: {comparison.divergencePoint}
                        </span>
                      )}
                    </div>

                    {/* Divergence Factors */}
                    {comparison.divergenceFactors && comparison.divergenceFactors.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Key Differences</h5>
                        <div className="space-y-1">
                          {comparison.divergenceFactors.slice(0, 3).map((factor, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">{factor.name}: {factor.impact}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Narrative Delta */}
                    {comparison.narrativeDelta && (
                      <div className="bg-gray-50 rounded p-2">
                        <h5 className="text-xs font-medium text-gray-700 mb-1">Narrative Delta</h5>
                        <p className="text-xs text-gray-600">{comparison.narrativeDelta}</p>
                      </div>
                    )}

                    {/* Highlight buttons */}
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => onPathHighlight?.([pathAId, pathBId])}
                        className="flex-1 px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200"
                      >
                        Highlight Both
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
