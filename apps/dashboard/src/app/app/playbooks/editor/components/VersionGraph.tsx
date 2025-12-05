/**
 * Version Graph Component (Sprint S23)
 * Visualizes commit DAG for playbook version control
 */

'use client';

import type { CommitDAGNode } from '@pravado/types';
import { useEffect, useState } from 'react';

export interface VersionGraphProps {
  playbookId: string;
  onCommitSelect?: (commitId: string) => void;
}

interface GraphLayout {
  commits: Array<{
    node: CommitDAGNode;
    x: number;
    y: number;
    parents: string[];
  }>;
  width: number;
  height: number;
}

/**
 * Layout commit DAG for visualization
 */
function layoutDAG(nodes: CommitDAGNode[]): GraphLayout {
  const HORIZONTAL_SPACING = 200;
  const VERTICAL_SPACING = 100;

  // Create branch lanes
  const branchLanes = new Map<string, number>();
  let currentLane = 0;

  const positioned = nodes.map((node, index) => {
    // Assign lane based on branch
    if (!branchLanes.has(node.branchName)) {
      branchLanes.set(node.branchName, currentLane++);
    }

    const lane = branchLanes.get(node.branchName) || 0;

    return {
      node,
      x: index * HORIZONTAL_SPACING + 50,
      y: lane * VERTICAL_SPACING + 50,
      parents: node.parentIds,
    };
  });

  const width = Math.max(800, nodes.length * HORIZONTAL_SPACING + 100);
  const height = Math.max(400, currentLane * VERTICAL_SPACING + 150);

  return {
    commits: positioned,
    width,
    height,
  };
}

/**
 * Format timestamp for display
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function VersionGraph({ playbookId, onCommitSelect }: VersionGraphProps) {
  const [dag, setDag] = useState<CommitDAGNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null);

  // Load commit DAG
  useEffect(() => {
    const loadDAG = async () => {
      try {
        const response = await fetch(`/api/v1/playbooks/${playbookId}/commits/dag`);
        const data = await response.json();

        if (data.success && data.data?.dag) {
          setDag(data.data.dag);
        } else {
          setError(data.error?.message || 'Failed to load commit graph');
        }
      } catch (err) {
        setError('Failed to load commit graph');
      } finally {
        setLoading(false);
      }
    };

    if (playbookId) {
      loadDAG();
    }
  }, [playbookId]);

  const handleCommitClick = (commitId: string) => {
    setSelectedCommit(commitId);
    onCommitSelect?.(commitId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading commit graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (dag.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">No commits yet</div>
      </div>
    );
  }

  const layout = layoutDAG(dag);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-auto">
      <svg
        width={layout.width}
        height={layout.height}
        className="cursor-pointer"
        style={{ minHeight: '400px' }}
      >
        {/* Draw edges (parent relationships) */}
        {layout.commits.map((commit) =>
          commit.parents.map((parentId) => {
            const parent = layout.commits.find((c) => c.node.id === parentId);
            if (!parent) return null;

            return (
              <line
                key={`${commit.node.id}-${parentId}`}
                x1={commit.x + 80}
                y1={commit.y + 40}
                x2={parent.x + 80}
                y2={parent.y + 40}
                stroke={commit.node.isMerge ? '#f59e0b' : '#9ca3af'}
                strokeWidth={commit.node.isMerge ? 3 : 2}
                strokeDasharray={commit.node.isMerge ? '5,5' : undefined}
              />
            );
          })
        )}

        {/* Draw commit nodes */}
        {layout.commits.map((commit) => {
          const isSelected = selectedCommit === commit.node.id;
          const bgColor = commit.node.isMerge
            ? '#fef3c7'
            : isSelected
              ? '#dbeafe'
              : '#f3f4f6';
          const borderColor = commit.node.isMerge
            ? '#f59e0b'
            : isSelected
              ? '#3b82f6'
              : '#9ca3af';

          return (
            <g
              key={commit.node.id}
              onClick={() => handleCommitClick(commit.node.id)}
              className="cursor-pointer"
            >
              {/* Node background */}
              <rect
                x={commit.x}
                y={commit.y}
                width={160}
                height={80}
                rx={8}
                fill={bgColor}
                stroke={borderColor}
                strokeWidth={isSelected ? 3 : 2}
              />

              {/* Merge indicator */}
              {commit.node.isMerge && (
                <circle
                  cx={commit.x + 150}
                  cy={commit.y + 10}
                  r={6}
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth={2}
                />
              )}

              {/* Branch name */}
              <text
                x={commit.x + 80}
                y={commit.y + 20}
                textAnchor="middle"
                className="text-xs font-semibold"
                fill="#374151"
              >
                {commit.node.branchName}
              </text>

              {/* Commit message (truncated) */}
              <text
                x={commit.x + 80}
                y={commit.y + 38}
                textAnchor="middle"
                className="text-xs"
                fill="#6b7280"
              >
                {commit.node.message.length > 20
                  ? commit.node.message.substring(0, 20) + '...'
                  : commit.node.message}
              </text>

              {/* Version number */}
              <text
                x={commit.x + 80}
                y={commit.y + 54}
                textAnchor="middle"
                className="text-xs font-mono"
                fill="#9ca3af"
              >
                v{commit.node.version}
              </text>

              {/* Timestamp */}
              <text
                x={commit.x + 80}
                y={commit.y + 70}
                textAnchor="middle"
                className="text-xs"
                fill="#9ca3af"
              >
                {formatTimestamp(commit.node.createdAt)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
