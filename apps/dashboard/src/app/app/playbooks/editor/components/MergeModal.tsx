/**
 * Merge Modal Component (Sprint S23)
 * Modal for merging branches with conflict resolution
 */

'use client';

import type { MergeConflict, PlaybookBranchWithCommit } from '@pravado/types';
import { useState, useEffect } from 'react';

export interface MergeModalProps {
  isOpen: boolean;
  isMerging: boolean;
  playbookId: string;
  currentBranchId?: string;
  currentBranchName?: string;
  branches: PlaybookBranchWithCommit[];
  conflicts?: MergeConflict[];
  onClose: () => void;
  onMerge: (
    sourceBranchId: string,
    targetBranchId: string,
    message?: string,
    resolutions?: Array<{ nodeId?: string; edgeId?: string; resolution: 'ours' | 'theirs' }>
  ) => void;
}

export function MergeModal({
  isOpen,
  isMerging,
  currentBranchId,
  currentBranchName,
  branches,
  conflicts,
  onClose,
  onMerge,
}: MergeModalProps) {
  const [sourceBranchId, setSourceBranchId] = useState('');
  const [message, setMessage] = useState('');
  const [conflictResolutions, setConflictResolutions] = useState<
    Map<string, 'ours' | 'theirs'>
  >(new Map());

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSourceBranchId('');
      setMessage('');
      setConflictResolutions(new Map());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const availableBranches = branches.filter((b) => b.id !== currentBranchId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!sourceBranchId || !currentBranchId) return;

    const resolutions = Array.from(conflictResolutions.entries()).map(([key, resolution]) => {
      const [type, id] = key.split(':');
      return type === 'node'
        ? { nodeId: id, resolution }
        : { edgeId: id, resolution };
    });

    onMerge(sourceBranchId, currentBranchId, message || undefined, resolutions.length > 0 ? resolutions : undefined);
  };

  const handleResolution = (conflictKey: string, resolution: 'ours' | 'theirs') => {
    const newResolutions = new Map(conflictResolutions);
    newResolutions.set(conflictKey, resolution);
    setConflictResolutions(newResolutions);
  };

  const allConflictsResolved =
    !conflicts || conflicts.length === 0 || conflicts.every((c) => {
      const key = c.nodeId ? `node:${c.nodeId}` : `edge:${c.edgeId}`;
      return conflictResolutions.has(key);
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Merge Branches</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Branch (current)
            </label>
            <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded">
              {currentBranchName || 'Current branch'}
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="source-branch" className="block text-sm font-medium text-gray-700 mb-2">
              Source Branch *
            </label>
            <select
              id="source-branch"
              value={sourceBranchId}
              onChange={(e) => setSourceBranchId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isMerging}
              required
            >
              <option value="">Select a branch to merge...</option>
              {availableBranches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} ({branch.commitCount} commits)
                </option>
              ))}
            </select>
          </div>

          {conflicts && conflicts.length > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
              <h3 className="text-sm font-semibold text-yellow-800 mb-2">
                ⚠️ Merge Conflicts Detected ({conflicts.length})
              </h3>
              <p className="text-xs text-yellow-700 mb-3">
                Both branches modified the same elements. Choose which version to keep:
              </p>
              <div className="space-y-3">
                {conflicts.map((conflict, index) => {
                  const conflictKey = conflict.nodeId ? `node:${conflict.nodeId}` : `edge:${conflict.edgeId}`;
                  const resolution = conflictResolutions.get(conflictKey);

                  return (
                    <div key={index} className="bg-white p-3 rounded border border-yellow-300">
                      <div className="text-sm font-medium mb-2">
                        {conflict.nodeId ? `Node: ${conflict.nodeId}` : `Edge: ${conflict.edgeId}`}
                        <span className="ml-2 text-xs text-gray-500">({conflict.type})</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleResolution(conflictKey, 'ours')}
                          className={`flex-1 px-3 py-2 text-sm border rounded ${
                            resolution === 'ours'
                              ? 'bg-blue-100 border-blue-500 text-blue-800'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Keep Ours ({currentBranchName})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResolution(conflictKey, 'theirs')}
                          className={`flex-1 px-3 py-2 text-sm border rounded ${
                            resolution === 'theirs'
                              ? 'bg-blue-100 border-blue-500 text-blue-800'
                              : 'border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          Keep Theirs (source)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="merge-message" className="block text-sm font-medium text-gray-700 mb-2">
              Merge Message (optional)
            </label>
            <input
              id="merge-message"
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Merge ${sourceBranchId ? 'source' : ''} into ${currentBranchName || 'current branch'}`}
              disabled={isMerging}
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isMerging}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!sourceBranchId || isMerging || !allConflictsResolved}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isMerging ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Merging...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Merge
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
