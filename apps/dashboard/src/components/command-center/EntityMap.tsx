'use client';

/**
 * EntityMap v6 — Glassmorphism + D3-force + Canvas
 *
 * MARKER: entity-map-v6
 *
 * Pure React/D3 implementation. No Three.js, no WebGL.
 * - Canvas layer: connection lines + animated particles + star field
 * - DOM overlay: glassmorphism node cards positioned by d3-force
 * - d3-force simulation for physics-based layout
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md
 */

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';
import type { EntityNode, EntityEdge, SessionCitationEvent, ActionImpactMap } from './types';

// ── Color Map ──────────────────────────────────────────────

const KIND_COLORS: Record<string, string> = {
  brand: '#A855F7',
  ai_engine: '#00D9FF',
  journalist: '#E879F9',
  publication: '#E879F9',
  topic_cluster: '#14B8A6',
};

const PILLAR_COLORS: Record<string, string> = {
  PR: '#E879F9',
  SEO: '#00D9FF',
  AEO: '#A855F7',
};

const KIND_RADIUS: Record<string, string> = {
  brand: '16px',
  ai_engine: '50%',
  journalist: '8px',
  topic_cluster: '4px',
  publication: '12px',
};

const KIND_ICONS: Record<string, string> = {
  brand: '◆',
  ai_engine: '⬡',
  journalist: '✎',
  publication: '⬢',
  topic_cluster: '◈',
};

function getColor(node: EntityNode): string {
  return KIND_COLORS[node.kind] ?? '#00D9FF';
}

function getNodeWidth(node: EntityNode): number {
  if (node.kind === 'brand') return 120;
  return 56 + (node.authority_weight / 100) * 40;
}

function getNodeHeight(node: EntityNode): number {
  if (node.kind === 'brand') return 52;
  return 32 + (node.authority_weight / 100) * 8;
}

// ── Types ──────────────────────────────────────────────────

interface EntityMapProps {
  nodes: EntityNode[];
  edges: EntityEdge[];
  sessionEvents?: SessionCitationEvent[];
  actionImpacts?: Record<string, ActionImpactMap>;
  hoveredActionId?: string | null;
  executingActionId?: string | null;
  onNodeClick?: (nodeId: string) => void;
  zoom?: number;
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  entity: EntityNode;
  w: number;
  h: number;
  color: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  edge: EntityEdge;
  color: string;
}

interface Particle {
  linkIdx: number;
  progress: number;
  speed: number;
  color: string;
}

// ── Component ──────────────────────────────────────────────

export function EntityMap({
  nodes,
  edges,
  onNodeClick,
  zoom = 1.0,
}: EntityMapProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<SimNode[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const simLinksRef = useRef<SimLink[]>([]);
  const starsRef = useRef<Array<{ x: number; y: number; o: number }>>([]);

  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  // Container dimensions
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height });
    }
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setDimensions({ width, height });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Build simulation data
  const { simNodes, simLinks } = useMemo(() => {
    const sn: SimNode[] = nodes.map(n => ({
      id: n.id,
      entity: n,
      w: getNodeWidth(n),
      h: getNodeHeight(n),
      color: getColor(n),
      // Seed brand at center
      x: n.kind === 'brand' ? dimensions.width / 2 : undefined,
      y: n.kind === 'brand' ? dimensions.height / 2 : undefined,
    }));

    const nodeMap = new Map(sn.map(n => [n.id, n]));
    const sl: SimLink[] = edges
      .filter(e => nodeMap.has(e.from) && nodeMap.has(e.to))
      .map(e => ({
        source: e.from,
        target: e.to,
        id: e.id,
        edge: e,
        color: e.state === 'gap' ? 'rgba(255,255,255,0.12)' : (PILLAR_COLORS[e.pillar] ?? '#00D9FF'),
      }));

    return { simNodes: sn, simLinks: sl };
  }, [nodes, edges, dimensions.width, dimensions.height]);

  // Generate stars once
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        o: 0.02 + Math.random() * 0.04,
      });
    }
    starsRef.current = stars;
  }, [dimensions.width, dimensions.height]);

  // Init particles for verified edges
  useEffect(() => {
    const particles: Particle[] = [];
    simLinks.forEach((link, idx) => {
      if (link.edge.state === 'verified_solid') {
        particles.push({
          linkIdx: idx,
          progress: Math.random(),
          speed: 0.002 + Math.random() * 0.002,
          color: link.color,
        });
      }
    });
    particlesRef.current = particles;
    simLinksRef.current = simLinks;
  }, [simLinks]);

  // D3 force simulation
  useEffect(() => {
    if (simNodes.length === 0) return;

    const w = dimensions.width;
    const h = dimensions.height;

    const sim = forceSimulation<SimNode>(simNodes)
      .force('link', forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(120).strength(0.3))
      .force('charge', forceManyBody<SimNode>().strength(-200))
      .force('center', forceCenter(w / 2, h / 2))
      .force('collision', forceCollide<SimNode>().radius(d => Math.max(d.w, d.h) / 2 + 12))
      .alphaDecay(0.015)
      .velocityDecay(0.3)
      .on('tick', () => {
        // Clamp to bounds
        for (const node of simNodes) {
          const pad = Math.max(node.w, node.h) / 2 + 4;
          node.x = Math.max(pad, Math.min(w - pad, node.x ?? w / 2));
          node.y = Math.max(pad, Math.min(h - pad, node.y ?? h / 2));
        }
        setNodePositions([...simNodes]);
      });

    simRef.current = sim;

    return () => { sim.stop(); };
  }, [simNodes, simLinks, dimensions.width, dimensions.height]);

  // Canvas render loop (edges + particles + stars)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = dimensions.width;
    const h = dimensions.height;
    canvas.width = w * window.devicePixelRatio;
    canvas.height = h * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    let running = true;

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      // Stars
      for (const star of starsRef.current) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.o})`;
        ctx.fill();
      }

      // Edges
      const links = simLinksRef.current;
      for (const link of links) {
        const src = link.source as SimNode;
        const tgt = link.target as SimNode;
        if (!src.x || !src.y || !tgt.x || !tgt.y) continue;

        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);

        const state = link.edge.state;
        if (state === 'verified_solid') {
          ctx.strokeStyle = link.color;
          ctx.globalAlpha = 0.4;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
        } else if (state === 'in_progress') {
          ctx.strokeStyle = link.color;
          ctx.globalAlpha = 0.3;
          ctx.lineWidth = 1;
          ctx.setLineDash([6, 4]);
        } else {
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.globalAlpha = 1;
          ctx.lineWidth = 0.5;
          ctx.setLineDash([4, 4]);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
      }

      // Particles
      for (const p of particlesRef.current) {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const link = links[p.linkIdx];
        if (!link) continue;
        const src = link.source as SimNode;
        const tgt = link.target as SimNode;
        if (!src.x || !src.y || !tgt.x || !tgt.y) continue;

        const px = src.x + (tgt.x - src.x) * p.progress;
        const py = src.y + (tgt.y - src.y) * p.progress;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, 5);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [dimensions.width, dimensions.height]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(prev => (prev === nodeId ? null : nodeId));
      onNodeClick?.(nodeId);
    },
    [onNodeClick],
  );

  const selectedEntity = selectedNodeId
    ? nodes.find(n => n.id === selectedNodeId)
    : null;

  return (
    <div
      ref={containerRef}
      className="entity-map-v6 relative overflow-hidden"
      style={{ width: '100%', height: '100%', minHeight: 300, transform: `scale(${zoom})`, transformOrigin: 'center center' }}
    >
      {/* Canvas layer — edges + particles + stars */}
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />

      {/* Node overlay — glassmorphism cards */}
      {nodePositions.map(node => {
        const x = (node.x ?? 0) - node.w / 2;
        const y = (node.y ?? 0) - node.h / 2;
        const isBrand = node.entity.kind === 'brand';
        const isSelected = node.id === selectedNodeId;
        const isHovered = node.id === hoveredNodeId;
        const color = node.color;
        const glowIntensity = isSelected ? 0.5 : isHovered ? 0.35 : 0.2;

        return (
          <div
            key={node.id}
            className="absolute cursor-pointer select-none transition-shadow duration-200"
            style={{
              left: x,
              top: y,
              width: node.w,
              height: node.h,
              background: 'rgba(10, 10, 20, 0.6)',
              backdropFilter: 'blur(16px) saturate(180%)',
              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
              border: `1px solid rgba(${hexToRgb(color)}, 0.35)`,
              borderRadius: KIND_RADIUS[node.entity.kind] ?? '8px',
              boxShadow: `0 0 ${isSelected ? 32 : 24}px rgba(${hexToRgb(color)}, ${glowIntensity}), 0 8px 32px rgba(0,0,0,0.4)`,
              zIndex: isSelected ? 20 : isBrand ? 10 : 1,
            }}
            onClick={() => handleNodeClick(node.id)}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            {/* Content */}
            <div className="flex items-center gap-1.5 px-2 h-full overflow-hidden">
              <span style={{ color, fontSize: isBrand ? 16 : 12, flexShrink: 0 }}>
                {KIND_ICONS[node.entity.kind] ?? '◇'}
              </span>
              <span
                className="truncate"
                style={{
                  fontFamily: 'monospace',
                  fontSize: isBrand ? 13 : 11,
                  fontWeight: isBrand ? 700 : 500,
                  color: isBrand ? '#ffffff' : 'rgba(255,255,255,0.85)',
                  letterSpacing: isBrand ? '0.05em' : undefined,
                }}
              >
                {node.entity.label}
              </span>
            </div>
            {/* Bottom bar — connection strength */}
            <div
              className="absolute bottom-0 left-0 right-0"
              style={{
                height: 2,
                borderRadius: '0 0 4px 4px',
                background: `linear-gradient(90deg, ${color}, transparent)`,
                opacity: node.entity.connection_status === 'verified_solid' ? 0.7 : 0.2,
              }}
            />
            {/* Brand pulse ring */}
            {isBrand && (
              <div
                className="absolute inset-[-6px] rounded-[22px] pointer-events-none"
                style={{
                  border: `2px solid ${color}`,
                  opacity: 0.3,
                  animation: 'entity-pulse-ring 2.5s ease-in-out infinite',
                }}
              />
            )}
          </div>
        );
      })}

      {/* ── Progressive Disclosure Panel ── */}
      {selectedEntity && (
        <div
          className="absolute top-2 right-2 w-[240px] bg-slate-2 border border-border-subtle rounded-lg p-3 shadow-lg z-30"
          style={{ animation: 'slideInRight 250ms ease-out' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded"
                style={{
                  backgroundColor: `${getColor(selectedEntity)}15`,
                  color: getColor(selectedEntity),
                }}
              >
                {selectedEntity.kind.replace('_', ' ')}
              </span>
              <span className="text-sm font-semibold text-white/90 truncate">{selectedEntity.label}</span>
            </div>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="shrink-0 text-white/40 hover:text-white/70 transition-colors"
              aria-label="Close panel"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Affinity</span>
              <p className="text-sm font-bold text-white/90 font-mono">{selectedEntity.affinity_score}</p>
            </div>
            <div>
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Authority</span>
              <p className="text-sm font-bold text-white/90 font-mono">{selectedEntity.authority_weight}</p>
            </div>
          </div>

          <div className="mb-3">
            <span className="text-[10px] text-white/40 uppercase tracking-wide">Connection</span>
            <p className="text-xs text-white/70 mt-0.5 capitalize">
              {selectedEntity.connection_status.replaceAll('_', ' ')}
            </p>
          </div>

          <div className="mb-3">
            <span className="text-[10px] text-white/40 uppercase tracking-wide">Intelligence</span>
            <p className="text-xs text-white/70 mt-0.5 leading-relaxed">
              {selectedEntity.entity_insight}
            </p>
          </div>

          {selectedEntity.impact_pillars.length > 0 && (
            <div className="mb-3">
              <span className="text-[10px] text-white/40 uppercase tracking-wide">Pillar Impact</span>
              <div className="flex items-center gap-1.5 mt-1">
                {selectedEntity.impact_pillars.map((p) => (
                  <span
                    key={p}
                    className="px-1.5 py-0.5 text-[10px] font-medium rounded"
                    style={{
                      backgroundColor: `${PILLAR_COLORS[p] ?? '#00D9FF'}15`,
                      color: PILLAR_COLORS[p] ?? '#00D9FF',
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedEntity.linked_action_id && (
            <button className="w-full text-left px-2 py-1.5 text-xs text-brand-cyan hover:bg-brand-cyan/5 border border-brand-cyan/20 rounded transition-colors">
              Open linked action &rarr;
            </button>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes entity-pulse-ring {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.08; transform: scale(1.08); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

/** Convert hex (#RRGGBB) to "R, G, B" string for rgba() */
function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export default EntityMap;
