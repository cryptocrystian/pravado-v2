'use client';

/**
 * CreationStage1Entry — Type/path selection for content creation.
 *
 * Two-zone layout: SAGE Brief Queue (left) + Manual Type Selection (right).
 * Autopilot mode shows a centered override confirmation instead.
 *
 * @see /docs/skills/PRAVADO_DESIGN_SKILL.md
 */

import { useState } from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import {
  Robot,
  Lightning,
  Article,
  BookOpenText,
  EnvelopeSimple,
  ShareNetwork,
  Megaphone,
  CaretDown,
  CaretUp,
  TrendUp,
} from '@phosphor-icons/react';
import type { AutomationMode, CreationContentType } from '../types';
import { CREATION_TYPE_CONFIG } from '../types';

// ============================================
// ICON MAP — Phosphor components keyed by iconName
// ============================================

const ICON_MAP: Record<string, PhosphorIcon> = {
  Article,
  BookOpenText,
  EnvelopeSimple,
  ShareNetwork,
  Megaphone,
};

// ============================================
// MOCK SAGE BRIEFS
// ============================================

interface SAGEBrief {
  id: string;
  title: string;
  priority: 'critical' | 'high' | 'medium';
  eviImpact: string;
  reason: string;
}

const SAGE_BRIEFS_MOCK: SAGEBrief[] = [
  {
    id: 'sb-1',
    title: 'Enterprise AEO Implementation Guide',
    priority: 'critical',
    eviImpact: '+8–12 EVI pts',
    reason: 'A competitor is cited 134x on ChatGPT for this topic. No competing content exists.',
  },
  {
    id: 'sb-2',
    title: 'AI Citation Tracking for B2B SaaS',
    priority: 'high',
    eviImpact: '+5–8 EVI pts',
    reason: 'Search volume up 340% QoQ. Top 3 competitors have published in the last 30 days.',
  },
  {
    id: 'sb-3',
    title: 'Share of Model Benchmarking Report',
    priority: 'medium',
    eviImpact: '+3–5 EVI pts',
    reason: 'Unique angle available — no competitor has published methodology content.',
  },
];

// ============================================
// PROPS
// ============================================

interface CreationStage1EntryProps {
  mode: AutomationMode;
  onContentTypeSelect: (type: CreationContentType) => void;
  onSageBriefSelect: (id: string) => void;
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function CreationStage1Entry({
  mode,
  onContentTypeSelect,
  onSageBriefSelect,
  onClose,
}: CreationStage1EntryProps) {
  const [sageExpanded, setSageExpanded] = useState(mode === 'copilot');

  // Autopilot: centered override confirmation
  if (mode === 'autopilot') {
    return (
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div className="text-center max-w-md">
          <Robot className="w-10 h-10 text-brand-iris/60 mx-auto mb-4" weight="regular" />
          <h2 className="text-lg font-semibold text-white/90 mb-2">
            SAGE manages content creation automatically
          </h2>
          <p className="text-[13px] text-white/60 leading-relaxed mb-8">
            In Autopilot mode, SAGE generates and schedules content based on your authority gaps.
            To override and create manually, continue below.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-white/15 text-white/60 text-sm font-medium rounded-lg hover:text-white/80 hover:border-white/25 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onContentTypeSelect('blog_post')}
              className="px-4 py-2 bg-brand-iris text-white/95 text-sm font-semibold rounded-lg hover:bg-brand-iris/90 transition-colors shadow-[0_0_16px_rgba(168,85,247,0.25)]"
            >
              Override — Create Manually
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCopilot = mode === 'copilot';

  return (
    <div className="px-8 py-8">
      <div className="flex gap-0">
        {/* LEFT ZONE — SAGE Brief Queue */}
        <div className={`${isCopilot ? 'flex-[55]' : 'flex-[45]'} min-w-0 pr-4`}>
          <div className="flex items-center gap-1.5 mb-4">
            <Lightning className="w-3.5 h-3.5 text-brand-iris" weight="fill" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-iris">
              SAGE&trade; Recommends
            </span>
          </div>

          {/* Manual mode: collapsed behind toggle */}
          {!isCopilot && (
            <button
              type="button"
              onClick={() => setSageExpanded(!sageExpanded)}
              className="flex items-center gap-2 text-[13px] text-white/50 hover:text-white/70 transition-colors mb-4"
            >
              Show SAGE recommendations ({SAGE_BRIEFS_MOCK.length})
              {sageExpanded ? (
                <CaretUp className="w-3.5 h-3.5" weight="regular" />
              ) : (
                <CaretDown className="w-3.5 h-3.5" weight="regular" />
              )}
            </button>
          )}

          {/* Copilot mode heading */}
          {isCopilot && (
            <p className="text-sm text-white/70 mb-4">SAGE has prepared these for you</p>
          )}

          {/* Brief cards */}
          {(isCopilot || sageExpanded) && (
            <div className="space-y-3">
              {SAGE_BRIEFS_MOCK.map((brief) => (
                <div
                  key={brief.id}
                  className="bg-slate-2 border border-border-subtle rounded-xl p-4"
                >
                  {/* Top row: priority + EVI impact */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        brief.priority === 'critical'
                          ? 'bg-semantic-danger/10 text-semantic-danger border border-semantic-danger/20'
                          : brief.priority === 'high'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-white/5 text-white/50 border border-white/10'
                      }`}
                    >
                      {brief.priority}
                    </span>
                    <span className="text-[13px] text-semantic-success flex items-center gap-1 ml-auto">
                      <TrendUp className="w-3 h-3" weight="bold" />
                      {brief.eviImpact}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-semibold text-white/90 mb-1">{brief.title}</h3>

                  {/* Reason */}
                  <p className="text-[13px] text-white/60 truncate mb-3">{brief.reason}</p>

                  {/* Select CTA */}
                  <button
                    type="button"
                    onClick={() => onSageBriefSelect(brief.id)}
                    className="text-sm text-brand-iris hover:text-brand-iris/80 transition-colors"
                  >
                    Select this brief →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="w-px bg-white/[0.08] self-stretch mx-4 shrink-0" />

        {/* RIGHT ZONE — Manual Type Selection */}
        <div className={`${isCopilot ? 'flex-[40]' : 'flex-[45]'} min-w-0 pl-4`}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-4 block">
            {isCopilot ? 'Or start from scratch' : 'Start Fresh'}
          </span>

          <div className="space-y-1">
            {(Object.entries(CREATION_TYPE_CONFIG) as [CreationContentType, typeof CREATION_TYPE_CONFIG[CreationContentType]][]).map(
              ([key, config]) => {
                const IconComponent = ICON_MAP[config.iconName];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onContentTypeSelect(key)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors text-left"
                  >
                    {IconComponent && (
                      <IconComponent className="w-5 h-5 text-brand-iris/70 shrink-0" weight="regular" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/85">{config.label}</div>
                      <div className="text-[13px] text-white/50">{config.description}</div>
                    </div>
                    {config.crossPillarNote && (
                      <span className="text-[11px] text-brand-magenta/70 shrink-0">
                        {config.crossPillarNote}
                      </span>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
