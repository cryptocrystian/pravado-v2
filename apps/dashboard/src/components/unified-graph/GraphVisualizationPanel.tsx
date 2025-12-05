/**
 * Graph Visualization Panel Component (Sprint S66)
 * Visual representation of the knowledge graph
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  IntelligenceNode,
  IntelligenceEdge,
  getNodeTypeColor,
  getEdgeTypeColor,
} from '@/lib/unifiedGraphApi';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
} from 'lucide-react';

interface GraphVisualizationPanelProps {
  nodes: IntelligenceNode[];
  edges: IntelligenceEdge[];
  selectedNodeId?: string | null;
  onNodeSelect?: (nodeId: string) => void;
  onEdgeSelect?: (edgeId: string) => void;
  isLoading?: boolean;
}

interface Position {
  x: number;
  y: number;
}

export function GraphVisualizationPanel({
  nodes,
  edges,
  selectedNodeId,
  onNodeSelect,
  onEdgeSelect: _onEdgeSelect,
  isLoading,
}: GraphVisualizationPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [nodePositions, setNodePositions] = useState<Map<string, Position>>(new Map());
  const [, _setIsDragging] = useState(false);
  const [, _setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 });

  // Calculate node positions using a simple force-directed layout
  useEffect(() => {
    if (nodes.length === 0) return;

    const positions = new Map<string, Position>();
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    // Initial random positions in a circle
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      const radius = Math.min(width, height) * 0.35;
      positions.set(node.id, {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      });
    });

    // Simple force-directed iterations
    const iterations = 50;
    const repulsion = 5000;
    const attraction = 0.01;
    const damping = 0.9;

    const velocities = new Map<string, Position>();
    nodes.forEach((node) => velocities.set(node.id, { x: 0, y: 0 }));

    for (let iter = 0; iter < iterations; iter++) {
      // Calculate repulsion forces
      nodes.forEach((nodeA) => {
        const posA = positions.get(nodeA.id)!;
        const velA = velocities.get(nodeA.id)!;

        nodes.forEach((nodeB) => {
          if (nodeA.id === nodeB.id) return;
          const posB = positions.get(nodeB.id)!;

          const dx = posA.x - posB.x;
          const dy = posA.y - posB.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const force = repulsion / (dist * dist);

          velA.x += (dx / dist) * force;
          velA.y += (dy / dist) * force;
        });
      });

      // Calculate attraction forces along edges
      edges.forEach((edge) => {
        const posA = positions.get(edge.sourceNodeId);
        const posB = positions.get(edge.targetNodeId);
        if (!posA || !posB) return;

        const velA = velocities.get(edge.sourceNodeId);
        const velB = velocities.get(edge.targetNodeId);
        if (!velA || !velB) return;

        const dx = posB.x - posA.x;
        const dy = posB.y - posA.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = dist * attraction;

        velA.x += (dx / dist) * force;
        velA.y += (dy / dist) * force;
        velB.x -= (dx / dist) * force;
        velB.y -= (dy / dist) * force;
      });

      // Apply velocities and damping
      nodes.forEach((node) => {
        const pos = positions.get(node.id)!;
        const vel = velocities.get(node.id)!;

        pos.x += vel.x;
        pos.y += vel.y;
        vel.x *= damping;
        vel.y *= damping;

        // Keep within bounds
        pos.x = Math.max(50, Math.min(width - 50, pos.x));
        pos.y = Math.max(50, Math.min(height - 50, pos.y));
      });
    }

    setNodePositions(positions);
  }, [nodes, edges]);

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || nodePositions.size === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    edges.forEach((edge) => {
      const sourcePos = nodePositions.get(edge.sourceNodeId);
      const targetPos = nodePositions.get(edge.targetNodeId);
      if (!sourcePos || !targetPos) return;

      ctx.beginPath();
      ctx.moveTo(sourcePos.x, sourcePos.y);
      ctx.lineTo(targetPos.x, targetPos.y);

      // Color based on edge type
      const colorClass = getEdgeTypeColor(edge.edgeType);
      if (colorClass.includes('red')) {
        ctx.strokeStyle = '#dc2626';
      } else if (colorClass.includes('green')) {
        ctx.strokeStyle = '#16a34a';
      } else if (colorClass.includes('blue')) {
        ctx.strokeStyle = '#2563eb';
      } else if (colorClass.includes('orange')) {
        ctx.strokeStyle = '#ea580c';
      } else {
        ctx.strokeStyle = '#64748b';
      }

      ctx.lineWidth = Math.max(1, edge.weight);
      ctx.stroke();

      // Draw arrow for directed edges
      if (!edge.isBidirectional) {
        const angle = Math.atan2(targetPos.y - sourcePos.y, targetPos.x - sourcePos.x);
        const arrowLen = 10;
        const arrowX = targetPos.x - 20 * Math.cos(angle);
        const arrowY = targetPos.y - 20 * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle - Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLen * Math.cos(angle + Math.PI / 6),
          arrowY - arrowLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach((node) => {
      const pos = nodePositions.get(node.id);
      if (!pos) return;

      const isSelected = node.id === selectedNodeId;
      const radius = isSelected ? 18 : 15;

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI);

      // Color based on node type
      const colorClass = getNodeTypeColor(node.nodeType);
      if (colorClass.includes('blue')) {
        ctx.fillStyle = isSelected ? '#1d4ed8' : '#3b82f6';
      } else if (colorClass.includes('green')) {
        ctx.fillStyle = isSelected ? '#15803d' : '#22c55e';
      } else if (colorClass.includes('red')) {
        ctx.fillStyle = isSelected ? '#b91c1c' : '#ef4444';
      } else if (colorClass.includes('purple')) {
        ctx.fillStyle = isSelected ? '#7e22ce' : '#a855f7';
      } else if (colorClass.includes('orange')) {
        ctx.fillStyle = isSelected ? '#c2410c' : '#f97316';
      } else {
        ctx.fillStyle = isSelected ? '#475569' : '#64748b';
      }

      ctx.fill();

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // Node label
      ctx.fillStyle = '#1f2937';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const label = node.label.length > 15
        ? node.label.substring(0, 12) + '...'
        : node.label;
      ctx.fillText(label, pos.x, pos.y + radius + 4);
    });

    ctx.restore();
  }, [nodes, edges, nodePositions, zoom, panOffset, selectedNodeId]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.x) / zoom;
    const y = (e.clientY - rect.top - panOffset.y) / zoom;

    // Find clicked node
    for (const node of nodes) {
      const pos = nodePositions.get(node.id);
      if (!pos) continue;

      const dx = x - pos.x;
      const dy = y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= 20) {
        onNodeSelect?.(node.id);
        return;
      }
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 3));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Graph Visualization
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Graph Visualization
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="w-24">
              <Slider
                value={[zoom * 50]}
                min={15}
                max={150}
                step={5}
                onValueChange={([v]) => setZoom(v / 50)}
              />
            </div>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleReset}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <div
          ref={containerRef}
          className="w-full h-full min-h-[400px] bg-muted/30 relative"
        >
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="cursor-pointer"
          />
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Network className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No nodes to display</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
