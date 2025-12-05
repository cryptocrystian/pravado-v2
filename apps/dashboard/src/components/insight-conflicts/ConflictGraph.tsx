'use client';

/**
 * ConflictGraph Component (Sprint S74)
 * Visualization of conflict relationships
 */

import { useMemo } from 'react';
import type { ConflictGraphData, ConflictGraphNode } from '@pravado/types';
import {
  getGraphNodeColor,
  getGraphNodeSize,
} from '../../lib/insightConflictApi';

interface ConflictGraphProps {
  data: ConflictGraphData | null;
  loading?: boolean;
  onNodeClick?: (node: ConflictGraphNode) => void;
  width?: number;
  height?: number;
}

export function ConflictGraph({
  data,
  loading,
  onNodeClick,
  width = 800,
  height = 500,
}: ConflictGraphProps) {
  // Position nodes in a force-directed-like layout (simplified)
  const positionedData = useMemo(() => {
    if (!data || data.nodes.length === 0) return null;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Group nodes by type
    const conflictNodes = data.nodes.filter(n => n.type === 'conflict');
    const itemNodes = data.nodes.filter(n => n.type === 'item');
    const sourceNodes = data.nodes.filter(n => n.type === 'source');
    const resolutionNodes = data.nodes.filter(n => n.type === 'resolution');

    // Position conflict nodes in center circle
    const conflictPositions = conflictNodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / conflictNodes.length;
      return {
        ...node,
        x: centerX + radius * 0.5 * Math.cos(angle),
        y: centerY + radius * 0.5 * Math.sin(angle),
      };
    });

    // Position item nodes in outer circle
    const itemPositions = itemNodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / Math.max(itemNodes.length, 1);
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Position source nodes at the top
    const sourcePositions = sourceNodes.map((node, index) => ({
      ...node,
      x: width * 0.2 + (index * (width * 0.6)) / Math.max(sourceNodes.length - 1, 1),
      y: 50,
    }));

    // Position resolution nodes at the bottom
    const resolutionPositions = resolutionNodes.map((node, index) => ({
      ...node,
      x: width * 0.2 + (index * (width * 0.6)) / Math.max(resolutionNodes.length - 1, 1),
      y: height - 50,
    }));

    const allNodes = [
      ...conflictPositions,
      ...itemPositions,
      ...sourcePositions,
      ...resolutionPositions,
    ];

    return {
      nodes: allNodes,
      edges: data.edges,
      metadata: data.metadata,
    };
  }, [data, width, height]);

  if (loading) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 flex items-center justify-center"
        style={{ width, height }}
      >
        <div className="flex items-center gap-2 text-gray-500">
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading graph...</span>
        </div>
      </div>
    );
  }

  if (!positionedData || positionedData.nodes.length === 0) {
    return (
      <div
        className="bg-white rounded-lg border border-gray-200 flex items-center justify-center"
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <p>No graph data available</p>
        </div>
      </div>
    );
  }

  // Create node lookup for edge drawing
  const nodeMap = new Map(positionedData.nodes.map(n => [n.id, n]));

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <svg width={width} height={height} className="bg-gray-50">
        {/* Edges */}
        <g>
          {positionedData.edges.map((edge) => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <line
                key={edge.id}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={edge.color || '#E5E7EB'}
                strokeWidth={Math.max(1, (edge.weight || 0.5) * 3)}
                strokeOpacity={0.6}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {positionedData.nodes.map((node) => {
            const size = node.size || getGraphNodeSize(node.type, node.data.severity);
            const color = node.color || getGraphNodeColor(node.type, node.data.severity);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="cursor-pointer"
                onClick={() => onNodeClick?.(node)}
              >
                <circle
                  r={size}
                  fill={color}
                  className="transition-all hover:opacity-80"
                />
                <circle
                  r={size}
                  fill="none"
                  stroke="white"
                  strokeWidth={2}
                />
                {/* Label */}
                <text
                  y={size + 14}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                  style={{ fontSize: '10px' }}
                >
                  {node.label.length > 15 ? `${node.label.slice(0, 15)}...` : node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <LegendItem color={getGraphNodeColor('conflict')} label="Conflict" />
            <LegendItem color={getGraphNodeColor('item')} label="Item" />
            <LegendItem color={getGraphNodeColor('source')} label="Source" />
            <LegendItem color={getGraphNodeColor('resolution')} label="Resolution" />
          </div>
          <div className="text-xs text-gray-400">
            {positionedData.metadata.totalNodes} nodes, {positionedData.metadata.totalEdges} edges
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}
