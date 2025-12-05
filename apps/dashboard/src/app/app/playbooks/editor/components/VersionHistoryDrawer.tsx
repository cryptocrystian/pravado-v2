/**
 * VersionHistoryDrawer Component (Sprint S20)
 * Sidebar drawer showing playbook version history
 */

'use client';

import type { PlaybookVersionRecord, GraphDiff } from '@pravado/types';
import { useState } from 'react';

import { VersionDiffViewer } from './VersionDiffViewer';

export interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: PlaybookVersionRecord[];
  onRestoreVersion: (version: PlaybookVersionRecord) => void;
  currentDiff?: {
    diff: GraphDiff;
    validation: { valid: boolean; errors: string[]; issues: any[] };
  };
}

export function VersionHistoryDrawer({
  isOpen,
  onClose,
  versions,
  onRestoreVersion,
  currentDiff,
}: VersionHistoryDrawerProps) {
  const [selectedVersion, setSelectedVersion] = useState<PlaybookVersionRecord | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  if (!isOpen) return null;

  const handleVersionClick = (version: PlaybookVersionRecord) => {
    setSelectedVersion(version);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedVersion(null);
    setViewMode('list');
  };

  return (
    <div className="fixed inset-0 z-40">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose} />

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {viewMode === 'detail' && (
              <button
                onClick={handleBackToList}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-semibold">
              {viewMode === 'list' ? 'Version History' : `Version ${selectedVersion?.version}`}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === 'list' ? (
            <div className="p-4 space-y-4">
              {/* Current Changes Section */}
              {currentDiff && currentDiff.diff.hasChanges && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    Current Changes
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-yellow-900">
                        Unsaved Changes
                      </span>
                      <span className="text-xs text-yellow-700">
                        {currentDiff.diff.addedNodes.length +
                          currentDiff.diff.removedNodes.length +
                          currentDiff.diff.modifiedNodes.length}{' '}
                        changes
                      </span>
                    </div>
                    <VersionDiffViewer
                      diff={currentDiff.diff}
                      latestVersion={
                        versions[0]
                          ? {
                              version: versions[0].version,
                              createdAt: versions[0].createdAt,
                              commitMessage: versions[0].commitMessage,
                            }
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}

              {/* Version List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Saved Versions ({versions.length})
                </h3>
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-sm">No saved versions yet</p>
                    <p className="text-xs mt-1">Save your first version to see history</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {versions.map((version, index) => (
                      <div
                        key={version.id}
                        className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleVersionClick(version)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              v{version.version}
                            </span>
                            {index === 0 && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                Latest
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(version.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {version.commitMessage && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {version.commitMessage}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>
                            {version.graph.nodes.length} nodes, {version.graph.edges.length} edges
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestoreVersion(version);
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4">
              {selectedVersion && (
                <div className="space-y-4">
                  {/* Version Info */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Version</div>
                        <div className="font-semibold">v{selectedVersion.version}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Created</div>
                        <div className="font-medium">
                          {new Date(selectedVersion.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500 uppercase mb-1">Message</div>
                        <div className="text-sm">
                          {selectedVersion.commitMessage || (
                            <span className="text-gray-400 italic">No message</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Graph Stats */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-2">Graph Structure</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nodes:</span>
                        <span className="font-medium">{selectedVersion.graph.nodes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Edges:</span>
                        <span className="font-medium">{selectedVersion.graph.edges.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Node Types:</span>
                        <span className="font-medium">
                          {
                            new Set(selectedVersion.graph.nodes.map((n) => n.type)).size
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onRestoreVersion(selectedVersion)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      Restore This Version
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
