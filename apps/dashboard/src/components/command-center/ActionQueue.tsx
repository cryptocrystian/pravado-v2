'use client';

import {
  Newspaper,
  EnvelopeOpen,
  FileText,
  Warning,
} from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';
import type { CCActionItem, ActionPriority, ActionSurface } from './cc-mock-data';
import { actionQueueItems } from './cc-mock-data';

// --- Priority badge styles ---
const priorityConfig: Record<
  ActionPriority,
  { label: string; className: string }
> = {
  critical: {
    label: 'CRITICAL',
    className: 'bg-red-500/10 text-red-500 text-xs font-medium px-2 py-0.5 rounded-full',
  },
  high: {
    label: 'HIGH',
    className: 'bg-amber-500/10 text-amber-500 text-xs font-medium px-2 py-0.5 rounded-full',
  },
  medium: {
    label: 'MEDIUM',
    className: 'bg-white/5 text-white/70 text-xs font-medium px-2 py-0.5 rounded-full',
  },
};

// --- Surface tag styles ---
const surfaceConfig: Record<
  ActionSurface,
  { label: string; className: string }
> = {
  pr: {
    label: 'PR',
    className: 'bg-blue-500/10 text-blue-400 text-xs px-1.5 py-0.5 rounded',
  },
  content: {
    label: 'CONTENT',
    className: 'bg-violet-500/10 text-violet-400 text-xs px-1.5 py-0.5 rounded',
  },
  seo: {
    label: 'SEO',
    className: 'bg-cc-cyan/10 text-cc-cyan text-xs px-1.5 py-0.5 rounded',
  },
};

// --- Icon map ---
const iconMap: Record<
  CCActionItem['icon'],
  React.ComponentType<IconProps>
> = {
  newspaper: Newspaper,
  'envelope-open': EnvelopeOpen,
  'file-text': FileText,
  warning: Warning,
};

function ActionQueueCard({ item }: { item: CCActionItem }) {
  const priority = priorityConfig[item.priority];
  const surface = surfaceConfig[item.surface];
  const Icon = iconMap[item.icon];

  return (
    <div className="bg-cc-surface border border-white/8 rounded-xl p-4 mb-2 hover:border-white/[0.16] transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left side */}
        <div className="flex-1 min-w-0">
          {/* Priority badge + icon row */}
          <div className="flex items-center gap-2 mb-2">
            <span className={priority.className}>{priority.label}</span>
            <Icon size={20} className="text-white/70 flex-shrink-0" weight="regular" />
          </div>

          {/* Title */}
          <h4 className="text-base font-semibold text-white mb-1">{item.title}</h4>

          {/* Description */}
          <p className="text-sm text-white/70">{item.description}</p>
        </div>

        {/* Right side: surface tag */}
        <div className="flex-shrink-0 pt-0.5">
          <span className={surface.className}>{surface.label}</span>
        </div>
      </div>

      {/* Buttons row */}
      <div className="flex items-center gap-2 mt-3">
        <button className="bg-cc-cyan text-cc-page text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-cc-cyan/90 transition-colors cursor-pointer">
          {item.primaryCta}
        </button>
        <button className="text-xs text-white/45 hover:text-white/70 transition-colors cursor-pointer">
          {item.secondaryCta}
        </button>
      </div>
    </div>
  );
}

export function ActionQueue() {
  const items = actionQueueItems;
  const count = items.length;

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
          Action Queue
        </span>
        <span className="text-xs text-white/45">{count} items</span>
      </div>

      {/* Action cards */}
      <div>
        {items.map((item) => (
          <ActionQueueCard key={item.id} item={item} />
        ))}
      </div>

      {/* View all link (only when >4 items) */}
      {count > 4 && (
        <button className="text-sm text-cc-cyan cursor-pointer mt-2 hover:text-cc-cyan/80 transition-colors">
          View all {count} actions &rarr;
        </button>
      )}
    </div>
  );
}
