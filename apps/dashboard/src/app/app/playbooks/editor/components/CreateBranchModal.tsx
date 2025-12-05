/**
 * Create Branch Modal Component (Sprint S23)
 * Modal for creating a new branch
 */

'use client';

import { useState } from 'react';

export interface CreateBranchModalProps {
  playbookId: string;
  onClose: () => void;
  onBranchCreated: (branchId: string) => void;
}

export function CreateBranchModal({
  playbookId,
  onClose,
  onBranchCreated,
}: CreateBranchModalProps) {
  const [branchName, setBranchName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!branchName.trim()) {
      setError('Branch name is required');
      return;
    }

    // Validate branch name format
    if (!/^[a-zA-Z0-9_-]+$/.test(branchName)) {
      setError('Branch name must be alphanumeric with hyphens and underscores only');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`/api/v1/playbooks/${playbookId}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: branchName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create branch');
      }

      if (data.success && data.data?.branch) {
        onBranchCreated(data.data.branch.id);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Create New Branch</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              id="branchName"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="feature-name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Use letters, numbers, hyphens, and underscores only
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !branchName.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
