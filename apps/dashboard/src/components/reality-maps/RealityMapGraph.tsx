'use client';

/**
 * RealityMapGraph Component (Sprint S73)
 * Interactive graph visualization for reality maps
 */

import { useMemo, useState, useCallback } from 'react';
import type { RealityMapGraphData, RealityMapGraphNode, RealityMapGraphEdge } from '@pravado/types';
import {
  getNodeColor,
  getEdgeColor,
  formatProbability,
  formatScore,
  NODE_TYPE_LABELS,
} from '../../lib/realityMapApi';

interface RealityMapGraphProps {
  graphData: RealityMapGraphData;
  onNodeClick?: (node: RealityMapGraphNode) => void;
  onEdgeClick?: (edge: RealityMapGraphEdge) => void;
  selectedNodeId?: string | null;
  highlightedPathIds?: string[];
}

export function RealityMapGraph({
  graphData,
  onNodeClick,
  onEdgeClick,
  selectedNodeId,
  highlightedPathIds = [],
}: RealityMapGraphProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const { nodes, edges, metadata } = graphData;

  // Calculate SVG dimensions based on graph bounds
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
    }

    const positions = nodes.map(n => n.position || { x: 0, y: 0 });
    const minX = Math.min(...positions.map(p => p.x)) - 100;
    const maxX = Math.max(...positions.map(p => p.x)) + 100;
    const minY = Math.min(...positions.map(p => p.y)) - 100;
    const maxY = Math.max(...positions.map(p => p.y)) + 100;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: Math.max(800, maxX - minX),
      height: Math.max(600, maxY - minY),
    };
  }, [nodes]);

  // Build node position lookup
  const nodePositions = useMemo(() => {
    const lookup = new Map<string, { x: number; y: number }>();
    nodes.forEach(node => {
      lookup.set(node.id, node.position || { x: 0, y: 0 });
    });
    return lookup;
  }, [nodes]);

  // Check if node is in highlighted path
  const isNodeHighlighted = useCallback((nodeId: string) => {
    if (highlightedPathIds.length === 0) return false;
    const path = graphData.paths.find(p => highlightedPathIds.includes(p.id));
    return path?.pathNodes.includes(nodeId) || false;
  }, [graphData.paths, highlightedPathIds]);

  // Check if edge is in highlighted path
  const isEdgeHighlighted = useCallback((edge: RealityMapGraphEdge) => {
    if (highlightedPathIds.length === 0) return false;
    const path = graphData.paths.find(p => highlightedPathIds.includes(p.id));
    if (!path) return false;

    const sourceIdx = path.pathNodes.indexOf(edge.source);
    const targetIdx = path.pathNodes.indexOf(edge.target);
    return sourceIdx >= 0 && targetIdx >= 0 && Math.abs(targetIdx - sourceIdx) === 1;
  }, [graphData.paths, highlightedPathIds]);

  const handleZoomIn = () => setZoom(z => Math.min(2, z + 0.2));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.2));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-lg font-medium">No graph data available</p>
          <p className="text-sm mt-1">Generate the reality map to see the visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          title="Zoom in"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          title="Zoom out"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
        </button>
        <button
          onClick={handleResetView}
          className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
          title="Reset view"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 rounded-lg shadow px-3 py-2 text-xs text-gray-600">
        <div className="flex gap-4">
          <span>{metadata.totalNodes} nodes</span>
          <span>{metadata.totalEdges} edges</span>
          <span>{metadata.totalPaths} paths</span>
          <span>Depth: {metadata.maxDepth}</span>
        </div>
      </div>

      {/* Graph SVG */}
      <svg
        width="100%"
        height="600"
        viewBox={`${bounds.minX + pan.x} ${bounds.minY + pan.y} ${bounds.width / zoom} ${bounds.height / zoom}`}
        className="cursor-move"
      >
        <defs>
          {/* Arrow marker for edges */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#9CA3AF"
            />
          </marker>
          <marker
            id="arrowhead-highlighted"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#6366F1"
            />
          </marker>
        </defs>

        {/* Edges */}
        <g className="edges">
          {edges.map(edge => {
            const sourcePos = nodePositions.get(edge.source);
            const targetPos = nodePositions.get(edge.target);
            if (!sourcePos || !targetPos) return null;

            const highlighted = isEdgeHighlighted(edge);
            const color = highlighted ? '#6366F1' : getEdgeColor(edge.probability);

            return (
              <g key={edge.id}>
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={color}
                  strokeWidth={highlighted ? 3 : 2}
                  strokeOpacity={highlighted ? 1 : 0.6}
                  markerEnd={highlighted ? 'url(#arrowhead-highlighted)' : 'url(#arrowhead)'}
                  onClick={() => onEdgeClick?.(edge)}
                  className="cursor-pointer hover:stroke-indigo-500"
                />
                {edge.label && (
                  <text
                    x={(sourcePos.x + targetPos.x) / 2}
                    y={(sourcePos.y + targetPos.y) / 2 - 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill="#6B7280"
                  >
                    {formatProbability(edge.probability)}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodes.map(node => {
            const pos = node.position || { x: 0, y: 0 };
            const isSelected = node.id === selectedNodeId;
            const isHovered = node.id === hoveredNodeId;
            const highlighted = isNodeHighlighted(node.id);
            const nodeColor = node.color || getNodeColor(node.riskScore);
            const size = node.size || 40;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => onNodeClick?.(node)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer"
              >
                {/* Node circle */}
                <circle
                  r={size / 2}
                  fill={nodeColor}
                  stroke={isSelected || highlighted ? '#6366F1' : '#fff'}
                  strokeWidth={isSelected ? 4 : highlighted ? 3 : 2}
                  opacity={isHovered ? 1 : 0.9}
                />

                {/* Node type indicator */}
                {node.type === 'root' && (
                  <circle
                    r={size / 4}
                    fill="white"
                    opacity={0.5}
                  />
                )}

                {/* Node label */}
                <text
                  y={size / 2 + 15}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="500"
                  fill="#374151"
                >
                  {node.label.slice(0, 20)}
                </text>

                {/* Probability label */}
                <text
                  y={size / 2 + 28}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#6B7280"
                >
                  {formatProbability(node.probability)}
                </text>

                {/* Hover tooltip */}
                {isHovered && (
                  <g>
                    <rect
                      x={-80}
                      y={-size - 60}
                      width={160}
                      height={50}
                      rx={4}
                      fill="white"
                      stroke="#E5E7EB"
                    />
                    <text x={0} y={-size - 42} textAnchor="middle" fontSize="10" fontWeight="500" fill="#111827">
                      {NODE_TYPE_LABELS[node.type]}
                    </text>
                    <text x={0} y={-size - 28} textAnchor="middle" fontSize="9" fill="#6B7280">
                      Risk: {formatScore(node.riskScore)} | Opp: {formatScore(node.opportunityScore)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg shadow px-3 py-2 text-xs">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Low Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
