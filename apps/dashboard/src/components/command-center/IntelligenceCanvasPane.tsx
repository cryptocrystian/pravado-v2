'use client';

/**
 * IntelligenceCanvasPane v3 — 2-Row layout: tab toolbar (TOP ROW) + canvas (BOTTOM ROW)
 *
 * Three-tab canvas:
 *   ENTITY MAP (default) | ORCHESTRATION (Coming Soon) | SYNERGY FLOW (Coming Soon)
 *
 * Phase 0 Track 0B: the canvas was driven by ~340 lines of hardcoded
 * MOCK_ENTITY_NODES / MOCK_ENTITY_EDGES (fabricated competitor entities, fake
 * citation counts). Those constants are deleted and the active tab's body
 * renders <ComingSoonGate /> behind CC_ENTITY_MAP_WIRED until SAGE provides
 * the real entity-map signal feed. The tab toolbar shell stays intact so the
 * Command Center density guard (regression-prevention) keeps seeing the v3
 * 2-row architecture.
 *
 * Phase 1 restores: the EntityMap render, zoom controls, fullscreen toggle.
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md §8
 * @see /docs/canon/COMMAND-CENTER-UI.md
 * @see /docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0B-MOCK-CONTAINMENT.md §4
 */

import { useState } from 'react';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

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

export function IntelligenceCanvasPane(_props: IntelligenceCanvasPaneProps) {
  const [activeTab, setActiveTab] = useState<CanvasTab>('entity_map');
  const wired = useFeatureFlag('CC_ENTITY_MAP_WIRED');

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
        {!wired ? (
          <ComingSoonGate
            pillar="Command"
            subsurface="Intelligence Canvas"
            description="SAGE is building your entity map. This activates once your first signals are ingested across PR, content, and SEO."
          />
        ) : // Phase 1 restores the real canvas render here (EntityMap / Orchestration / SynergyFlow).
        null}
      </div>
    </div>
  );
}
