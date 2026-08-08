'use client';

/**
 * IntelligenceCanvasPane v3 — 2-Row layout: tab toolbar (TOP ROW) + canvas (BOTTOM ROW)
 *
 * Three-tab canvas:
 *   ENTITY MAP (default) | ORCHESTRATION (Coming Soon) | SYNERGY FLOW (Coming Soon)
 *
 * Wave-2: the Entity Map tab now renders the canonical concentric-ring <EntityMap />
 * (v3) fed by the real GET /api/command-center/entity-map contract (nodes carry
 * ring 0–3, affinity_score, authority_weight, entity_insight, linked_action_id,
 * layout_version 'v3'). CC_ENTITY_MAP_WIRED gates it; when off, the ComingSoonGate
 * still shows. ORCHESTRATION and SYNERGY_FLOW remain label-only in V1 (canon §8).
 *
 * Cross-pane props (hoveredActionId / executingActionId) flow straight through to the
 * map so Action Stream hover/execute can highlight the linked entity nodes. Gap-node
 * clicks emit a `cc:focus-action` window event the Action Stream listens for (D016).
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md §8
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useEffect, useState } from 'react';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

import { EntityMap } from './EntityMap';
import type { EntityMapPayload } from './types';

type CanvasTab = 'entity_map' | 'orchestration_editor' | 'synergy_flow';

type TabConfig = {
  id: CanvasTab;
  label: string;
  color: string;
  ready: boolean;
};

const TABS: TabConfig[] = [
  {
    id: 'entity_map',
    label: 'Entity Map',
    color: 'text-brand-iris',
    ready: true,
  },
  {
    id: 'orchestration_editor',
    label: 'Orchestration',
    color: 'text-brand-cyan',
    ready: false,
  },
  {
    id: 'synergy_flow',
    label: 'Synergy Flow',
    color: 'text-white/30',
    ready: false,
  },
];

interface IntelligenceCanvasPaneProps {
  hoveredActionId?: string | null;
  executingActionId?: string | null;
}

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'no_org' }
  | { status: 'ready'; payload: EntityMapPayload };

export function IntelligenceCanvasPane({
  hoveredActionId = null,
  executingActionId = null,
}: IntelligenceCanvasPaneProps) {
  const [activeTab, setActiveTab] = useState<CanvasTab>('entity_map');
  const wired = useFeatureFlag('CC_ENTITY_MAP_WIRED');
  const [fetchState, setFetchState] = useState<FetchState>({
    status: 'loading',
  });

  // Self-fetch the real entity-map contract once the tab is wired. Status-aware:
  // the proxy preserves upstream 403 NO_ORG, which we render as an honest empty
  // state rather than crashing on `.nodes`.
  useEffect(() => {
    if (!wired) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/command-center/entity-map', {
          credentials: 'include',
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: { code?: string; message?: string };
          } | null;
          if (res.status === 403 && body?.error?.code === 'NO_ORG') {
            if (!cancelled) setFetchState({ status: 'no_org' });
            return;
          }
          if (!cancelled)
            setFetchState({
              status: 'error',
              message:
                body?.error?.message ??
                `Entity map fetch failed (${res.status})`,
            });
          return;
        }
        const payload = (await res.json()) as EntityMapPayload;
        if (!cancelled) setFetchState({ status: 'ready', payload });
      } catch (err) {
        if (!cancelled)
          setFetchState({
            status: 'error',
            message: err instanceof Error ? err.message : String(err),
          });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [wired]);

  return (
    <div className="h-full flex flex-col">
      {/* TOP ROW: tab toolbar (always rendered — shell stays intact even when gated) */}
      <div className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 border-b border-border-subtle bg-page">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => tab.ready && setActiveTab(tab.id)}
            disabled={!tab.ready}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === tab.id ? `${tab.color} bg-white/5` : 'text-white/40'
            } ${tab.ready ? 'hover:text-white' : 'cursor-not-allowed opacity-50'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* BOTTOM ROW: active tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'entity_map' ? (
          !wired ? (
            <ComingSoonGate
              pillar="Command"
              subsurface="Intelligence Canvas"
              description="SAGE is building your entity map. This activates once your first signals are ingested across PR, content, and SEO."
            />
          ) : (
            <EntityMapTabBody
              fetchState={fetchState}
              hoveredActionId={hoveredActionId}
              executingActionId={executingActionId}
            />
          )
        ) : (
          // Orchestration + Synergy Flow are label-only in V1 (canon §8).
          <ComingSoonGate
            pillar="Command"
            subsurface="Intelligence Canvas"
            description="This canvas tab arrives in a later release."
          />
        )}
      </div>
    </div>
  );
}

function EntityMapTabBody({
  fetchState,
  hoveredActionId,
  executingActionId,
}: {
  fetchState: FetchState;
  hoveredActionId: string | null;
  executingActionId: string | null;
}) {
  if (fetchState.status === 'loading') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black">
        <span className="text-xs text-white/50">
          {/* typography-allow: micro */}
          Loading entity map…
        </span>
      </div>
    );
  }

  if (fetchState.status === 'no_org') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black">
        <p className="max-w-sm px-6 text-center text-xs leading-relaxed text-white/50">
          {/* typography-allow: micro */}
          No workspace yet. Your entity map appears once an organization is set
          up and its first signals are ingested.
        </p>
      </div>
    );
  }

  if (fetchState.status === 'error') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-black">
        <p className="max-w-sm px-6 text-center text-xs leading-relaxed text-semantic-danger">
          Could not load the entity map: {fetchState.message}
        </p>
      </div>
    );
  }

  return (
    <EntityMap
      nodes={fetchState.payload.nodes}
      edges={fetchState.payload.edges}
      sessionEvents={fetchState.payload.session_events}
      hoveredActionId={hoveredActionId}
      executingActionId={executingActionId}
    />
  );
}
