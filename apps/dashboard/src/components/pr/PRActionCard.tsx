'use client';

import {
  EnvelopeOpen,
  Newspaper,
  Bell,
  FileText,
  Lightning,
  ChartBar,
  X,
} from '@phosphor-icons/react';
import type { PRActionItem } from './pr-mock-data';
import { priorityConfig } from './pr-mock-data';

const iconMap: Record<string, typeof EnvelopeOpen> = {
  EnvelopeOpen,
  Newspaper,
  Bell,
  FileText,
  Lightning,
  ChartBar,
};

interface PRActionCardProps {
  action: PRActionItem;
  onPrimary?: () => void;
  onSecondary?: () => void;
  onDismiss?: () => void;
}

export function PRActionCard({ action, onPrimary, onSecondary, onDismiss }: PRActionCardProps) {
  const Icon = iconMap[action.iconName] ?? FileText;
  const priority = priorityConfig[action.priority];

  return (
    <div className="bg-slate-2 border border-slate-4 rounded-xl p-4 mb-3 hover:border-slate-5 transition-colors group">
      {/* Top row: icon + priority badge + dismiss */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon
            size={20}
            className={action.priority === 'critical' ? 'text-red-500' : 'text-white/45'}
          />
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase ${priority.bg} ${priority.text}`}
          >
            {action.priority}
          </span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
            PR
          </span>
        </div>
        {action.dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/5 transition-all"
          >
            <X size={14} className="text-white/30" />
          </button>
        )}
      </div>

      {/* Title */}
      <h3 className="text-sm font-semibold text-white mb-1">{action.title}</h3>

      {/* Description */}
      <p className="text-sm text-white/70 mb-3 line-clamp-2">{action.description}</p>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrimary}
          className="bg-brand-magenta text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-brand-magenta/90 shadow-[0_0_10px_rgba(236,72,153,0.2)] transition-colors"
        >
          {action.primaryCta}
        </button>
        {action.secondaryCta && (
          <button
            type="button"
            onClick={onSecondary}
            className="bg-slate-3 border border-slate-4 rounded-lg px-3 py-1.5 text-xs text-white/70 hover:text-white hover:bg-slate-4 transition-colors"
          >
            {action.secondaryCta}
          </button>
        )}
      </div>
    </div>
  );
}
