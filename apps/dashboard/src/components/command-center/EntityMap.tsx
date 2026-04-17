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

function getColor(node: EntityNode): string {
  return KIND_COLORS[node.kind] ?? '#00D9FF';
}

function getNodeWidth(node: EntityNode): number {
  switch (node.kind) {
    case 'brand': return 140;
    case 'ai_engine': return 88;
    case 'journalist':
    case 'publication': return 96;
    case 'topic_cluster': return 80;
    default: return 80;
  }
}

function getNodeHeight(node: EntityNode): number {
  switch (node.kind) {
    case 'brand': return 68;
    case 'ai_engine': return 52;
    case 'journalist':
    case 'publication': return 52;
    case 'topic_cluster': return 48;
    default: return 48;
  }
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
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewScale, setViewScale] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const simLinksRef = useRef<SimLink[]>([]);
  const starsRef = useRef<Array<{ x: number; y: number; o: number; r: number }>>([]);
  const isDraggingCanvas = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

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

  // Generate stars once — mix of dim + bright
  useEffect(() => {
    const stars: Array<{ x: number; y: number; o: number; r: number }> = [];
    // Regular stars
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        o: 0.04 + Math.random() * 0.06,
        r: 1,
      });
    }
    // Bright accent stars
    for (let i = 0; i < 10; i++) {
      stars.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        o: 0.15 + Math.random() * 0.05,
        r: 1.5,
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
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
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

  // ── Pan + zoom handlers ──
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'CANVAS') {
      isDraggingCanvas.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { x: pan.x, y: pan.y };
    }
  }, [pan]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingCanvas.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }, []);

  const handleCanvasMouseUp = useCallback(() => {
    isDraggingCanvas.current = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setViewScale(s => Math.max(0.4, Math.min(2.5, s - e.deltaY * 0.001)));
  }, []);

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
      style={{ width: '100%', height: '100%', minHeight: 300, cursor: isDraggingCanvas.current ? 'grabbing' : 'grab' }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onWheel={handleWheel}
      onDoubleClick={() => { setPan({ x: 0, y: 0 }); setViewScale(1); }}
    >
      {/* Gradient mesh — gives glassmorphism cards something to blur over */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 40% at 20% 50%, rgba(168,85,247,0.08) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 80% 30%, rgba(0,217,255,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 60% 80%, rgba(232,121,249,0.05) 0%, transparent 70%)
          `,
          animation: 'mesh-drift 12s ease-in-out infinite alternate',
        }}
      />

      {/* Pannable + zoomable content layer */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${(zoom ?? 1) * viewScale})`,
          transformOrigin: 'center center',
          pointerEvents: 'none',
        }}
      >
        {/* Canvas layer — edges + particles + stars */}
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
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
              pointerEvents: 'auto',
              background: 'rgba(8, 8, 18, 0.72)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: `1px solid rgba(${hexToRgb(color)}, 0.35)`,
              borderRadius: KIND_RADIUS[node.entity.kind] ?? '8px',
              boxShadow: `0 0 ${isSelected ? 32 : 24}px rgba(${hexToRgb(color)}, ${glowIntensity}), 0 8px 32px rgba(0,0,0,0.4)`,
              zIndex: isSelected ? 20 : isBrand ? 10 : 1,
            }}
            onClick={() => handleNodeClick(node.id)}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
          >
            {/* Frosted highlight — inner top edge */}
            <div className="absolute inset-x-0 top-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
            />

            {/* Content */}
            <div className="relative w-full h-full flex flex-col justify-center px-3 py-2 overflow-hidden">
              {/* Entity type label */}
              <span style={{
                fontFamily: 'monospace', fontSize: 9,
                letterSpacing: '0.15em', textTransform: 'uppercase' as const,
                color: `rgba(${hexToRgb(color)}, 0.7)`,
                lineHeight: 1,
              }}>
                {node.entity.kind.replace('_', ' ')}
              </span>

              {/* Primary label */}
              <span style={{
                fontFamily: 'monospace',
                fontSize: isBrand ? 14 : 12,
                fontWeight: isBrand ? 700 : 600,
                color: '#ffffff',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
                marginTop: 3,
              }}>
                {node.entity.label}
              </span>

              {/* Metric pill for non-brand */}
              {!isBrand && (
                <div className="flex items-center gap-1" style={{ marginTop: 5 }}>
                  <div style={{
                    width: `${node.entity.affinity_score}%`,
                    maxWidth: '70%',
                    height: 2,
                    borderRadius: 1,
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  }} />
                  <span style={{ fontSize: 9, color: `rgba(${hexToRgb(color)}, 0.6)`, fontFamily: 'monospace' }}>
                    {node.entity.affinity_score}
                  </span>
                </div>
              )}

              {/* Brand: pillar indicators */}
              {isBrand && (
                <div className="flex items-center gap-2" style={{ marginTop: 6 }}>
                  {['PR', 'SEO', 'AEO'].map(p => (
                    <span key={p} style={{
                      fontSize: 9, fontFamily: 'monospace',
                      color: PILLAR_COLORS[p], letterSpacing: '0.1em',
                    }}>{p}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Brand: triple pulse rings */}
            {isBrand && (
              <>
                <div className="absolute pointer-events-none" style={{
                  inset: -8, borderRadius: 22,
                  border: '1px solid rgba(168,85,247,0.5)',
                  animation: 'entity-pulse-ring 2s ease-in-out infinite',
                }} />
                <div className="absolute pointer-events-none" style={{
                  inset: -16, borderRadius: 26,
                  border: '1px solid rgba(168,85,247,0.25)',
                  animation: 'entity-pulse-ring 2s ease-in-out 0.66s infinite',
                }} />
                <div className="absolute pointer-events-none" style={{
                  inset: -26, borderRadius: 32,
                  border: '1px solid rgba(168,85,247,0.1)',
                  animation: 'entity-pulse-ring 2s ease-in-out 1.33s infinite',
                }} />
                {/* Corner accent glow */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  borderRadius: 16,
                  background: 'radial-gradient(ellipse at 30% 30%, rgba(168,85,247,0.15), transparent 60%)',
                }} />
              </>
            )}
          </div>
        );
      })}
      </div>{/* close pannable content layer */}

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
        @keyframes mesh-drift {
          0% { opacity: 0.8; transform: scale(1) translate(0, 0); }
          100% { opacity: 1; transform: scale(1.05) translate(-10px, 5px); }
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
