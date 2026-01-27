/**
 * Branch Selector Component (Sprint S23)
 * Dropdown for selecting and switching branches
 */

'use client';

import { useState, useEffect, useRef } from 'react';

export interface Branch {
  id: string;
  name: string;
  isProtected: boolean;
  latestCommit: {
    id: string;
    message: string;
    version: number;
    createdAt: string;
  } | null;
  commitCount: number;
}

export interface BranchSelectorProps {
  playbookId: string;
  currentBranchId?: string;
  onBranchChange: (branchId: string) => void;
  onCreateBranch: () => void;
}

export function BranchSelector({
  playbookId,
  currentBranchId,
  onBranchChange,
  onCreateBranch,
}: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load branches
  useEffect(() => {
    const loadBranches = async () => {
      try {
        // Gate 1A: Use route handler, not direct backend call
        const response = await fetch(`/api/playbooks/${playbookId}/branches`);
        const data = await response.json();

        if (data.success && data.data?.branches) {
          setBranches(data.data.branches);
        }
      } catch (error) {
        console.error('Failed to load branches:', error);
      } finally {
        setLoading(false);
      }
    };

    if (playbookId) {
      loadBranches();
    }
  }, [playbookId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  const currentBranch = branches.find((b) => b.id === currentBranchId);

  const handleBranchClick = async (branchId: string) => {
    if (branchId === currentBranchId) {
      setIsOpen(false);
      return;
    }

    try {
      // Gate 1A: Use route handler, not direct backend call
      const response = await fetch(
        `/api/playbooks/${playbookId}/branches/${branchId}/switch`,
        {
          method: 'POST',
        }
      );

      if (response.ok) {
        onBranchChange(branchId);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to switch branch:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded bg-gray-50">
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
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Branch selector button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12M8 12h12m-12 5h12M3 7h.01M3 12h.01M3 17h.01"
          />
        </svg>
        <span className="font-medium">
          {currentBranch?.name || 'Select Branch'}
        </span>
        {currentBranch?.isProtected && (
          <svg
            className="w-3 h-3 text-yellow-600"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-label="Protected branch"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Create new branch button */}
          <button
            onClick={() => {
              setIsOpen(false);
              onCreateBranch();
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-200 flex items-center gap-2 text-blue-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="font-medium">Create New Branch</span>
          </button>

          {/* Branch list */}
          <div className="py-1">
            {branches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => handleBranchClick(branch.id)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex flex-col gap-1 ${
                  branch.id === currentBranchId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${
                        branch.id === currentBranchId
                          ? 'text-blue-600'
                          : 'text-gray-900'
                      }`}
                    >
                      {branch.name}
                    </span>
                    {branch.isProtected && (
                      <svg
                        className="w-3 h-3 text-yellow-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-label="Protected branch"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {branch.id === currentBranchId && (
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {branch.commitCount} commits
                  </span>
                </div>
                {branch.latestCommit && (
                  <div className="text-xs text-gray-500 truncate">
                    {branch.latestCommit.message}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
