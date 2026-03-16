'use client';

/**
 * IntelligenceCanvasPane v3 — Full-Height Entity Map + Tab Bar
 *
 * Three-tab canvas:
 *   ENTITY MAP (default) | ORCHESTRATION (Coming Soon) | SYNERGY FLOW (Coming Soon)
 *
 * Entity Map fills available pane height. Tab bar pinned to bottom.
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md §8
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import type { EntityNode, EntityEdge } from './types';
import { EntityMap } from './EntityMap';
import { useCitationResults } from '@/lib/useCiteMind';

// ── Tab definitions ──────────────────────────────────────

type CanvasTab = 'entity_map' | 'orchestration_editor' | 'synergy_flow';

const TABS: { id: CanvasTab; label: string; color: string; ready: boolean }[] = [
  { id: 'entity_map', label: 'Entity Map', color: 'text-brand-iris', ready: true },
  { id: 'orchestration_editor', label: 'Orchestration', color: 'text-brand-cyan', ready: false },
  { id: 'synergy_flow', label: 'Synergy Flow', color: 'text-white/30', ready: false },
];

// ── Mock data — Entity Map v3 ────────────────────────────

const MOCK_ENTITY_NODES: EntityNode[] = [
  // Ring 0 — Brand Core
  {
    id: 'brand', kind: 'brand', label: 'Pravado', ring: 0, pillar: null,
    affinity_score: 100, authority_weight: 100, connection_status: 'verified_solid',
    linked_action_id: 'action-0', entity_insight: 'Brand core entity.',
    impact_pillars: [], last_updated: new Date().toISOString(), meta: {},
  },
  // Ring 1 — Topic clusters (Owned)
  {
    id: 'topic-aeo', kind: 'topic_cluster', label: 'AEO Strategy', ring: 1, pillar: 'SEO',
    affinity_score: 88, authority_weight: 74, connection_status: 'verified_solid',
    linked_action_id: 'action-1',
    entity_insight: 'Highest schema coverage cluster. 14 published pieces, avg CiteMind score 7.8.',
    impact_pillars: ['SEO', 'AEO'], last_updated: new Date().toISOString(), meta: {},
  },
  {
    id: 'topic-citation', kind: 'topic_cluster', label: 'Citation Intelligence', ring: 1, pillar: 'SEO',
    affinity_score: 71, authority_weight: 58, connection_status: 'verified_pending',
    linked_action_id: 'action-2',
    entity_insight: 'Schema coverage at 62%. 3 pieces lack structured data — blocking Ring 3 connections.',
    impact_pillars: ['SEO'], last_updated: new Date().toISOString(), meta: {},
  },
  {
    id: 'topic-entity-seo', kind: 'topic_cluster', label: 'Entity SEO', ring: 1, pillar: 'SEO',
    affinity_score: 45, authority_weight: 32, connection_status: 'gap',
    linked_action_id: 'action-3',
    entity_insight: 'Cluster exists but only 2 pieces published. Competitor B has 9 pieces on this topic.',
    impact_pillars: ['SEO', 'AEO'], last_updated: new Date().toISOString(), meta: {},
  },
  // Ring 2 — Journalists / publications (Earned)
  {
    id: 'j-sarah', kind: 'journalist', label: 'Sarah Chen', ring: 2, pillar: 'PR',
    affinity_score: 91, authority_weight: 78, connection_status: 'verified_solid',
    linked_action_id: 'action-4',
    entity_insight: 'Covers AI infrastructure at 3.2× frequency matching your target topics. Replied to 2 pitches this week.',
    impact_pillars: ['PR', 'AEO'], last_updated: new Date().toISOString(), meta: {},
  },
  {
    id: 'pub-techcrunch', kind: 'publication', label: 'TechCrunch', ring: 2, pillar: 'PR',
    affinity_score: 84, authority_weight: 95, connection_status: 'verified_solid',
    linked_action_id: 'action-5',
    entity_insight: 'Published 3 articles mentioning Pravado this month. DA 93 — strongest earned authority signal.',
    impact_pillars: ['PR', 'AEO'], last_updated: new Date().toISOString(), meta: {},
  },
  {
    id: 'j-marcus', kind: 'journalist', label: 'Marcus Webb', ring: 2, pillar: 'PR',
    affinity_score: 62, authority_weight: 55, connection_status: 'in_progress',
    linked_action_id: 'action-6',
    entity_insight: 'Pitch sent 3 days ago. No reply. Beat covers enterprise SaaS at 2.1× topic match.',
    impact_pillars: ['PR'], last_updated: new Date().toISOString(), meta: {},
  },
  {
    id: 'pub-forbes', kind: 'publication', label: 'Forbes', ring: 2, pillar: 'PR',
    affinity_score: 38, authority_weight: 97, connection_status: 'gap',
    linked_action_id: 'action-7',
    entity_insight: 'Forbes actively covers AI visibility platforms. Two journalists researching this topic — no Pravado connection yet.',
    impact_pillars: ['PR', 'AEO'], last_updated: new Date().toISOString(), meta: {},
  },
  // Ring 3 — AI engines (Perceived)
  {
    id: 'ai-perplexity', kind: 'ai_engine', label: 'Perplexity', ring: 3, pillar: 'AEO',
    affinity_score: 82, authority_weight: 85, connection_status: 'verified_solid',
    linked_action_id: 'action-8',
    entity_insight: 'Cites Pravado in 69% of AI marketing automation queries. Highest citation rate across all engines.',
    impact_pillars: ['AEO'], last_updated: new Date().toISOString(), meta: {},
  },
  {
    id: 'ai-chatgpt', kind: 'ai_engine', label: 'ChatGPT', ring: 3, pillar: 'AEO',
    affinity_score: 79, authority_weight: 92, connection_status: 'verified_solid',
    linked_action_id: 'action-9',
    entity_insight: 'Citations up 18% this week. TechCrunch coverage directly correlates with GPT citation increase.',
    impact_pillars: ['AEO'], last_updated: new Date().toISOString(), meta: {},
  },
  {
    id: 'ai-gemini', kind: 'ai_engine', label: 'Gemini', ring: 3, pillar: 'AEO',
    affinity_score: 61, authority_weight: 78, connection_status: 'verified_pending',
    linked_action_id: 'action-10',
    entity_insight: 'Present in Gemini responses but citation quality score is 5.2/10 — structured data gaps limiting context quality.',
    impact_pillars: ['AEO'], last_updated: new Date().toISOString(), meta: {},
  },
  {
    id: 'ai-claude', kind: 'ai_engine', label: 'Claude', ring: 3, pillar: 'AEO',
    affinity_score: 55, authority_weight: 70, connection_status: 'gap',
    linked_action_id: 'action-11',
    entity_insight: 'Minimal citation presence. Entity disambiguation needed — Pravado not yet distinct in Anthropic knowledge graph.',
    impact_pillars: ['AEO'], last_updated: new Date().toISOString(), meta: {},
  },
  {
    id: 'ai-bing', kind: 'ai_engine', label: 'Bing Copilot', ring: 3, pillar: 'AEO',
    affinity_score: 48, authority_weight: 65, connection_status: 'gap',
    linked_action_id: 'action-12',
    entity_insight: 'No confirmed citations. Bing favors structured FAQ schema — 3 FAQ gaps identified by CiteMind.',
    impact_pillars: ['AEO'], last_updated: new Date().toISOString(), meta: {},
  },
];

const MOCK_ENTITY_EDGES: EntityEdge[] = [
  // Ring 1 → Core
  { id: 'e1', from: 'topic-aeo', to: 'brand', rel: 'topic_to_brand', state: 'verified_solid', strength: 74, pillar: 'SEO', verified_at: new Date().toISOString() },
  { id: 'e2', from: 'topic-citation', to: 'brand', rel: 'topic_to_brand', state: 'verified_pending', strength: 58, pillar: 'SEO', verified_at: null },
  { id: 'e3', from: 'topic-entity-seo', to: 'brand', rel: 'topic_to_brand', state: 'gap', strength: 32, pillar: 'SEO', verified_at: null },
  // Ring 2 → Core
  { id: 'e4', from: 'j-sarah', to: 'brand', rel: 'journalist_covers', state: 'verified_solid', strength: 78, pillar: 'PR', verified_at: new Date().toISOString() },
  { id: 'e5', from: 'pub-techcrunch', to: 'brand', rel: 'journalist_covers', state: 'verified_solid', strength: 95, pillar: 'PR', verified_at: new Date().toISOString() },
  { id: 'e6', from: 'j-marcus', to: 'brand', rel: 'journalist_covers', state: 'in_progress', strength: 55, pillar: 'PR', verified_at: null },
  { id: 'e7', from: 'pub-forbes', to: 'brand', rel: 'journalist_covers', state: 'gap', strength: 30, pillar: 'PR', verified_at: null },
  // Ring 3 → Core
  { id: 'e8', from: 'ai-perplexity', to: 'brand', rel: 'cites_brand', state: 'verified_solid', strength: 85, pillar: 'AEO', verified_at: new Date().toISOString() },
  { id: 'e9', from: 'ai-chatgpt', to: 'brand', rel: 'cites_brand', state: 'verified_solid', strength: 82, pillar: 'AEO', verified_at: new Date().toISOString() },
  { id: 'e10', from: 'ai-gemini', to: 'brand', rel: 'cites_brand', state: 'verified_pending', strength: 61, pillar: 'AEO', verified_at: null },
  { id: 'e11', from: 'ai-claude', to: 'brand', rel: 'cites_brand', state: 'gap', strength: 20, pillar: 'AEO', verified_at: null },
  { id: 'e12', from: 'ai-bing', to: 'brand', rel: 'cites_brand', state: 'gap', strength: 15, pillar: 'AEO', verified_at: null },
];


// ── Props ────────────────────────────────────────────────

interface IntelligenceCanvasPaneProps {
  hoveredActionId?: string | null;
  executingActionId?: string | null;
}

// ── Component ────────────────────────────────────────────

const ENGINE_COLORS: Record<string, string> = {
  perplexity: '#20B2AA',
  chatgpt: '#10A37F',
  gemini: '#4285F4',
  claude: '#D97706',
};

const ENGINE_LABELS: Record<string, string> = {
  perplexity: 'Perplexity',
  chatgpt: 'ChatGPT',
  gemini: 'Gemini',
  claude: 'Claude',
};

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function IntelligenceCanvasPane({
  hoveredActionId,
  executingActionId,
}: IntelligenceCanvasPaneProps) {
  const [activeTab, setActiveTab] = useState<CanvasTab>('entity_map');
  const [zoom, setZoom] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // S-INT-05: Fetch real citation results
  const { results: citationResults } = useCitationResults({ mentionedOnly: true, days: 30, limit: 20 });

  // Map API results to display format — no mock fallback
  const displayCitations = useMemo(() => {
    return citationResults.map((r) => ({
      id: r.id,
      platform: ENGINE_LABELS[r.engine] || r.engine,
      platformColor: ENGINE_COLORS[r.engine] || '#888',
      query: r.query_prompt,
      snippet: r.response_excerpt || '',
      position: 0,
      qualityColor: '#22C55E',
      timeAgo: timeAgo(r.monitored_at),
    }));
  }, [citationResults]);

  const contentRef = useRef<HTMLDivElement>(null);
  const [mapSize, setMapSize] = useState(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { height } = entry.contentRect;
      setMapSize(Math.floor(height * 0.68));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ZOOM_MIN = 0.6;
  const ZOOM_MAX = 1.5;
  const ZOOM_STEP = 0.15;

  return (
    <div className="h-full flex flex-col">
      {/* ── Canvas Toolbar ── */}
      <div className="flex-shrink-0 flex items-center justify-between
        px-3 py-1.5 border-b border-border-subtle bg-page">

        {/* Mode tabs — left */}
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <div key={tab.id} className="relative group">
              <button
                onClick={() => tab.ready && setActiveTab(tab.id)}
                disabled={!tab.ready}
                className={`
                  px-2.5 py-1 text-xs font-semibold rounded-md transition-all
                  ${activeTab === tab.id
                    ? `${tab.color} bg-white/8 border border-white/12`
                    : tab.ready
                      ? 'text-white/35 hover:text-white/60 cursor-pointer'
                      : 'text-white/20 cursor-not-allowed opacity-50'
                  }
                `}
              >
                {tab.label}
                {!tab.ready && (
                  <span className="ml-1.5 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-white/8 text-white/30 rounded">
                    Soon
                  </span>
                )}
              </button>
              {/* Tooltip on hover for disabled tabs */}
              {!tab.ready && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-slate-2 border border-slate-4 rounded-lg text-xs text-white/60 whitespace-nowrap shadow-elev-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Coming in next sprint
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Canvas controls — right */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(2))))}
            disabled={zoom <= ZOOM_MIN}
            className="w-7 h-7 flex items-center justify-center rounded text-white/40
              hover:text-white/80 hover:bg-white/8 disabled:opacity-30
              disabled:cursor-not-allowed transition-all text-sm font-bold"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="text-xs text-white/30 w-9 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(2))))}
            disabled={zoom >= ZOOM_MAX}
            className="w-7 h-7 flex items-center justify-center rounded text-white/40
              hover:text-white/80 hover:bg-white/8 disabled:opacity-30
              disabled:cursor-not-allowed transition-all text-sm font-bold"
            aria-label="Zoom in"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="px-2 py-1 text-xs text-white/30 hover:text-white/60
              hover:bg-white/8 rounded transition-all"
            aria-label="Reset zoom"
          >
            Reset
          </button>
          <div className="w-px h-4 bg-border-subtle mx-1" />
          <button
            onClick={() => setIsFullscreen(true)}
            className="w-7 h-7 flex items-center justify-center rounded text-white/40
              hover:text-white/80 hover:bg-white/8 transition-all"
            aria-label="Fullscreen"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          <div className="flex items-center gap-1 ml-1 text-xs text-white/25">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
            Live
          </div>
        </div>
      </div>

      {/* ── Content: square map row + feed row ── */}
      <div ref={contentRef} className="relative flex-1 min-h-0 flex flex-col"
        style={{ background: '#06060A' }}>

        {/* Map row — full width, height = mapSize, holds the square canvas + flanking legend */}
        <div
          className="relative flex-shrink-0 flex items-center justify-center"
          style={{ height: mapSize > 0 ? `${mapSize}px` : '65%' }}
        >
          {/* Square canvas */}
          <div
            className="relative"
            style={{
              width: mapSize > 0 ? `${mapSize}px` : '100%',
              height: mapSize > 0 ? `${mapSize}px` : '100%',
              background: '#0A0A0F',
              borderLeft: '1px solid rgba(255,255,255,0.04)',
              borderRight: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {activeTab === 'entity_map' && (
              <EntityMap
                nodes={MOCK_ENTITY_NODES}
                edges={MOCK_ENTITY_EDGES}
                hoveredActionId={hoveredActionId ?? null}
                executingActionId={executingActionId ?? null}
                zoom={zoom}
              />
            )}
            {activeTab === 'orchestration_editor' && (
              <div className="flex items-center justify-center h-full text-white/30">
                <div className="text-center"><p className="text-sm font-medium">Orchestration Editor</p><p className="text-xs mt-1 text-white/20">Coming in V2</p></div>
              </div>
            )}
            {activeTab === 'synergy_flow' && (
              <div className="flex items-center justify-center h-full text-white/30">
                <div className="text-center"><p className="text-sm font-medium">Synergy Flow</p><p className="text-xs mt-1 text-white/20">Coming in V2</p></div>
              </div>
            )}
          </div>

          {/* Legend — lives in the LEFT flank, never overlaps the SVG */}
          {activeTab === 'entity_map' && (
            <div className="absolute left-3 bottom-4 flex flex-col gap-1.5 pointer-events-none z-10"
              style={{ maxWidth: '140px' }}>
              <div className="rounded-lg border border-white/8 bg-black/70 backdrop-blur-sm px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2">Connections</p>
                <div className="space-y-1.5">
                  {[
                    { color: '#22C55E', dash: false, label: 'Verified' },
                    { color: '#F59E0B', dash: false, opacity: 0.5, label: 'Pending' },
                    { color: 'rgba(255,255,255,0.4)', dash: true, label: 'Gap' },
                    { color: '#00D9FF', dash: true, label: 'In Progress' },
                  ].map(({ color, dash, label, opacity }) => (
                    <div key={label} className="flex items-center gap-2">
                      <svg width="28" height="8" className="flex-shrink-0">
                        <line x1="0" y1="4" x2="28" y2="4" stroke={color} strokeWidth="1.5"
                          strokeOpacity={opacity ?? 1} strokeDasharray={dash ? '4,3' : undefined} />
                      </svg>
                      <span className="text-xs text-white/55">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-white/8 bg-black/70 backdrop-blur-sm px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/35 mb-2">Rings</p>
                <div className="space-y-1.5">
                  {[
                    { color: '#00D9FF', label: 'Owned · SEO' },
                    { color: '#E879F9', label: 'Earned · PR' },
                    { color: '#A855F7', label: 'Perceived · AEO' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 border"
                        style={{ background: color + '33', borderColor: color + '99' }} />
                      <span className="text-xs text-white/55">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CiteMind Feed — remaining 40% */}
        <div className="flex-1 min-h-0 border-t border-border-subtle flex flex-col overflow-hidden">
          <div className="flex-shrink-0 flex items-center justify-between
            px-4 py-2.5 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wide text-white/60">
                CiteMind Feed
              </span>
            </div>
            <span className="text-xs text-white/30">
              {citationResults.length > 0 && citationResults[0]
                ? `Last scan: ${timeAgo(citationResults[0].monitored_at)}`
                : 'Last scan: --'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto cc-scrollbar px-3 py-2 space-y-2">
            {displayCitations.length > 0 ? (
              displayCitations.map((c) => (
                <div key={c.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-1
                    border border-border-subtle hover:border-brand-cyan/20 transition-colors">
                  <span className="flex-shrink-0 px-2 py-0.5 text-xs font-bold rounded"
                    style={{ background: c.platformColor + '20', color: c.platformColor }}>
                    {c.platform}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/45 italic truncate mb-0.5">
                      &quot;{c.query}&quot;
                    </p>
                    <p className="text-xs text-white/75 line-clamp-1">{c.snippet}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-xs text-white/35">{c.timeAgo}</div>
                    <div className="text-xs font-semibold" style={{ color: c.qualityColor }}>
                      #{c.position}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-8 px-4">
                <p className="text-xs text-white/40 text-center leading-relaxed">
                  No AI citations detected yet. Citation monitoring runs every 6 hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Fullscreen Modal ── */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center
            bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setIsFullscreen(false)}
        >
          <div className="relative bg-page border border-border-subtle rounded-xl overflow-hidden"
            style={{ width: '90vw', height: '85vh' }}>

            {/* Fullscreen header */}
            <div className="flex items-center justify-between px-4 py-2.5
              border-b border-border-subtle bg-slate-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-iris animate-pulse" />
                <span className="text-sm font-semibold text-white/90">Entity Map</span>
                <span className="text-xs text-white/40 ml-1">Intelligence Canvas</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom(z => Math.max(ZOOM_MIN, parseFloat((z - ZOOM_STEP).toFixed(2))))}
                  disabled={zoom <= ZOOM_MIN}
                  className="w-7 h-7 flex items-center justify-center rounded text-white/40
                    hover:text-white/80 hover:bg-white/8 disabled:opacity-30 transition-all font-bold">
                  −
                </button>
                <span className="text-xs text-white/30 w-9 text-center tabular-nums">
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={() => setZoom(z => Math.min(ZOOM_MAX, parseFloat((z + ZOOM_STEP).toFixed(2))))}
                  disabled={zoom >= ZOOM_MAX}
                  className="w-7 h-7 flex items-center justify-center rounded text-white/40
                    hover:text-white/80 hover:bg-white/8 disabled:opacity-30 transition-all font-bold">
                  +
                </button>
                <button onClick={() => setZoom(1.0)}
                  className="px-2 py-1 text-xs text-white/30 hover:text-white/60
                    hover:bg-white/8 rounded transition-all">
                  Reset
                </button>
                <div className="w-px h-4 bg-border-subtle mx-1" />
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded text-white/50
                    hover:text-white hover:bg-white/8 transition-all text-lg leading-none"
                  aria-label="Close fullscreen"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Fullscreen map only — focused view */}
            <div className="w-full" style={{ height: 'calc(85vh - 45px)' }}>
              <EntityMap
                nodes={MOCK_ENTITY_NODES}
                edges={MOCK_ENTITY_EDGES}
                hoveredActionId={hoveredActionId ?? null}
                executingActionId={executingActionId ?? null}
                zoom={zoom}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
