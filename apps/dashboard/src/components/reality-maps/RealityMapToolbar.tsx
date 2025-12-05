'use client';

/**
 * RealityMapToolbar Component (Sprint S73)
 * Toolbar for reality map operations and controls
 */

import { useState } from 'react';
import type { RealityMapStatus } from '@pravado/types';

interface RealityMapToolbarProps {
  mapId: string;
  status: RealityMapStatus;
  onGenerate?: () => void;
  onRefreshAnalysis?: () => void;
  onEdit?: () => void;
  onExport?: (format: 'json' | 'pdf' | 'png') => void;
  onViewAuditLog?: () => void;
  onDelete?: () => void;
  generating?: boolean;
  analyzing?: boolean;
}

export function RealityMapToolbar({
  mapId,
  status,
  onGenerate,
  onRefreshAnalysis,
  onEdit,
  onExport,
  onViewAuditLog,
  onDelete,
  generating = false,
  analyzing = false,
}: RealityMapToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  const canGenerate = status === 'draft' || status === 'completed' || status === 'failed';
  const canEdit = status !== 'generating' && status !== 'analyzing';
  const isProcessing = status === 'generating' || status === 'analyzing' || generating || analyzing;

  return (
    <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200">
      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={!canGenerate || isProcessing}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          canGenerate && !isProcessing
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {status === 'generating' || generating ? 'Generating...' : 'Analyzing...'}
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {status === 'draft' ? 'Generate' : 'Regenerate'}
          </>
        )}
      </button>

      {/* Refresh Analysis */}
      {status === 'completed' && (
        <button
          onClick={onRefreshAnalysis}
          disabled={analyzing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Analysis
        </button>
      )}

      {/* Edit Button */}
      <button
        onClick={onEdit}
        disabled={!canEdit}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>

      {/* Export Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showExportMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowExportMenu(false)}
            />
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={() => {
                  onExport?.('json');
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export as JSON
              </button>
              <button
                onClick={() => {
                  onExport?.('pdf');
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export as PDF
              </button>
              <button
                onClick={() => {
                  onExport?.('png');
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Export as PNG
              </button>
            </div>
          </>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Map ID display */}
      <div className="text-xs text-gray-400 font-mono">
        ID: {mapId.slice(0, 8)}...
      </div>

      {/* More Actions Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowActionsMenu(!showActionsMenu)}
          className="inline-flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>

        {showActionsMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowActionsMenu(false)}
            />
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <button
                onClick={() => {
                  onViewAuditLog?.();
                  setShowActionsMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                View Audit Log
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  onDelete?.();
                  setShowActionsMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Map
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
