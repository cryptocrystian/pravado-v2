'use client';

import {
  LinkedinLogo,
  EnvelopeSimple,
  FileText,
  XLogo,
  CircleNotch,
  CheckCircle,
  Clock,
} from '@phosphor-icons/react';
import type { DerivativeItem } from '../editor-mock-data';

const typeIcons: Record<DerivativeItem['type'], typeof FileText> = {
  social_post: LinkedinLogo,
  email: EnvelopeSimple,
  summary: FileText,
  thread: XLogo,
};

const statusConfig: Record<
  DerivativeItem['status'],
  { icon: typeof CheckCircle; color: string; label: string }
> = {
  ready: { icon: CheckCircle, color: 'text-semantic-success', label: 'Ready' },
  generating: { icon: CircleNotch, color: 'text-cc-cyan', label: 'Generating...' },
  pending: { icon: Clock, color: 'text-white/30', label: 'Pending' },
};

interface DerivativesProps {
  derivatives: DerivativeItem[];
}

export function Derivatives({ derivatives }: DerivativesProps) {
  return (
    <div className="p-4">
      <div className="space-y-2">
        {derivatives.map((item) => {
          const TypeIcon = typeIcons[item.type];
          const status = statusConfig[item.status];
          const StatusIcon = status.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 py-2 px-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer group"
            >
              <TypeIcon size={18} className="text-white/45 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-white/80 block truncate group-hover:text-white transition-colors">
                  {item.title}
                </span>
                {item.platform && (
                  <span className="text-xs text-white/30">{item.platform}</span>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <StatusIcon
                  size={14}
                  className={`${status.color} ${item.status === 'generating' ? 'animate-spin' : ''}`}
                  weight={item.status === 'ready' ? 'fill' : 'regular'}
                />
                <span className={`text-xs ${status.color}`}>{status.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
