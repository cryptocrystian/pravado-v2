/**
 * Custom Node Components (Sprint S17)
 * Renders different node types with icons and labels
 */

'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

import type { EditorNodeData } from '../types/graph';

/**
 * Base node component with common structure
 */
function BaseNode({ data, selected, type }: NodeProps<EditorNodeData>) {
  const icon = getNodeIcon(type as string);
  const color = getNodeColor(type as string);
  const hasErrors = data.errors && data.errors.length > 0;

  return (
    <div
      className={`
        px-4 py-2 shadow-md rounded-md border-2 bg-white min-w-[150px]
        ${selected ? 'border-blue-500' : 'border-gray-300'}
        ${hasErrors ? 'border-red-500' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2">
        <div className={`text-2xl ${color}`}>{icon}</div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 uppercase">{type}</div>
          <div className="font-semibold text-sm">{data.label}</div>
        </div>
        {hasErrors && (
          <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
            !
          </div>
        )}
      </div>

      {hasErrors && (
        <div className="mt-2 text-xs text-red-600">
          {data.errors?.slice(0, 2).join(', ')}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

/**
 * AGENT node
 */
export const AgentNode = memo(BaseNode);

/**
 * DATA node
 */
export const DataNode = memo(BaseNode);

/**
 * BRANCH node - has two output handles
 */
function BranchNodeComponent({ data, selected }: NodeProps<EditorNodeData>) {
  const hasErrors = data.errors && data.errors.length > 0;

  return (
    <div
      className={`
        px-4 py-2 shadow-md rounded-md border-2 bg-white min-w-[150px]
        ${selected ? 'border-blue-500' : 'border-gray-300'}
        ${hasErrors ? 'border-red-500' : ''}
      `}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2">
        <div className="text-2xl text-yellow-600">◆</div>
        <div className="flex-1">
          <div className="text-xs text-gray-500 uppercase">BRANCH</div>
          <div className="font-semibold text-sm">{data.label}</div>
        </div>
        {hasErrors && (
          <div className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">
            !
          </div>
        )}
      </div>

      {/* Two output handles for true/false branches */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: '35%' }}
        className="w-3 h-3 bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: '65%' }}
        className="w-3 h-3 bg-red-500"
      />
    </div>
  );
}

export const BranchNode = memo(BranchNodeComponent);

/**
 * API node
 */
export const ApiNode = memo(BaseNode);

/**
 * Get icon for node type
 */
function getNodeIcon(type: string): string {
  switch (type) {
    case 'AGENT':
      return '🤖';
    case 'DATA':
      return '⚙️';
    case 'BRANCH':
      return '◆';
    case 'API':
      return '🌐';
    default:
      return '📦';
  }
}

/**
 * Get color for node type
 */
function getNodeColor(type: string): string {
  switch (type) {
    case 'AGENT':
      return 'text-blue-600';
    case 'DATA':
      return 'text-green-600';
    case 'BRANCH':
      return 'text-yellow-600';
    case 'API':
      return 'text-purple-600';
    default:
      return 'text-gray-600';
  }
}

/**
 * Export node types for React Flow
 */
export const nodeTypes = {
  AGENT: AgentNode,
  DATA: DataNode,
  BRANCH: BranchNode,
  API: ApiNode,
};
