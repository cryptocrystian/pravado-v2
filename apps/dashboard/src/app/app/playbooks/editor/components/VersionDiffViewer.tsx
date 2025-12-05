/**
 * VersionDiffViewer Component (Sprint S20)
 * Displays visual diff between two playbook graphs
 */

'use client';

import type { GraphDiff } from '@pravado/types';

export interface VersionDiffViewerProps {
  diff: GraphDiff;
  latestVersion?: {
    version: number;
    createdAt: string;
    commitMessage: string | null;
  };
}

export function VersionDiffViewer({ diff, latestVersion }: VersionDiffViewerProps) {
  if (!diff.hasChanges) {
    return (
      <div className="p-6 text-center text-gray-500">
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p className="text-sm font-medium">No changes detected</p>
        <p className="text-xs mt-1">
          Current graph matches the latest saved version
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      {latestVersion && (
        <div className="pb-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">
            Changes since v{latestVersion.version}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Last saved: {new Date(latestVersion.createdAt).toLocaleString()}
          </p>
          {latestVersion.commitMessage && (
            <p className="text-xs text-gray-600 mt-1 italic">
              &ldquo;{latestVersion.commitMessage}&rdquo;
            </p>
          )}
        </div>
      )}

      {/* Added Nodes */}
      {diff.addedNodes.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
            Added Nodes ({diff.addedNodes.length})
          </h4>
          <ul className="space-y-1">
            {diff.addedNodes.map((node, index) => (
              <li key={index} className="text-sm text-green-800 flex items-center gap-2">
                <span className="font-mono text-xs bg-green-100 px-2 py-0.5 rounded">
                  {node.type}
                </span>
                <span>{node.label}</span>
                <span className="text-xs text-green-600">({node.id})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Removed Nodes */}
      {diff.removedNodes.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
            Removed Nodes ({diff.removedNodes.length})
          </h4>
          <ul className="space-y-1">
            {diff.removedNodes.map((node, index) => (
              <li key={index} className="text-sm text-red-800 flex items-center gap-2">
                <span className="font-mono text-xs bg-red-100 px-2 py-0.5 rounded">
                  {node.type}
                </span>
                <span className="line-through">{node.label}</span>
                <span className="text-xs text-red-600">({node.id})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modified Nodes */}
      {diff.modifiedNodes.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
            Modified Nodes ({diff.modifiedNodes.length})
          </h4>
          <ul className="space-y-3">
            {diff.modifiedNodes.map((node, index) => (
              <li key={index} className="text-sm text-blue-900">
                <div className="font-medium mb-1">{node.label}</div>
                <ul className="ml-4 space-y-0.5">
                  {node.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="text-xs text-blue-700">
                      • {change}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Added Edges */}
      {diff.addedEdges.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-green-900 mb-2">
            Added Connections ({diff.addedEdges.length})
          </h4>
          <ul className="space-y-1">
            {diff.addedEdges.map((edge, index) => (
              <li key={index} className="text-sm text-green-800 font-mono">
                {edge.source} → {edge.target}
                {edge.label && (
                  <span className="text-xs ml-2 text-green-600">
                    ({edge.label})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Removed Edges */}
      {diff.removedEdges.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-900 mb-2">
            Removed Connections ({diff.removedEdges.length})
          </h4>
          <ul className="space-y-1">
            {diff.removedEdges.map((edge, index) => (
              <li key={index} className="text-sm text-red-800 font-mono line-through">
                {edge.source} → {edge.target}
                {edge.label && (
                  <span className="text-xs ml-2 text-red-600">
                    ({edge.label})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Summary */}
      <div className="pt-3 border-t border-gray-200">
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total changes:</span>
            <span className="font-medium">
              {diff.addedNodes.length +
                diff.removedNodes.length +
                diff.modifiedNodes.length +
                diff.addedEdges.length +
                diff.removedEdges.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
