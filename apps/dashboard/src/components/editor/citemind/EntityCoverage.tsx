'use client';

import { CheckCircle, Warning, XCircle } from '@phosphor-icons/react';
import type { EntityItem } from '../editor-mock-data';

const statusConfig: Record<
  EntityItem['status'],
  { icon: typeof CheckCircle; color: string }
> = {
  covered: { icon: CheckCircle, color: 'text-semantic-success' },
  partial: { icon: Warning, color: 'text-amber-500' },
  missing: { icon: XCircle, color: 'text-red-500' },
};

const typeColors: Record<EntityItem['type'], string> = {
  primary: 'bg-cc-cyan/10 text-cc-cyan',
  secondary: 'bg-brand-iris/10 text-brand-iris',
  technical: 'bg-cc-cyan/10 text-cc-cyan',
};

interface EntityCoverageProps {
  entities: EntityItem[];
}

export function EntityCoverage({ entities }: EntityCoverageProps) {
  const covered = entities.filter((e) => e.status === 'covered').length;
  const total = entities.length;

  return (
    <div className="p-4">
      {/* Summary row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-white/45">
          {covered}/{total} entities covered
        </span>
        <div className="flex gap-1">
          {entities.map((e, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                e.status === 'covered'
                  ? 'bg-semantic-success'
                  : e.status === 'partial'
                    ? 'bg-amber-500'
                    : 'bg-red-500/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Entity list */}
      <div className="space-y-2">
        {entities.map((entity) => {
          const cfg = statusConfig[entity.status];
          const Icon = cfg.icon;
          return (
            <div key={entity.name} className="flex items-start gap-2 py-1.5">
              <Icon
                size={16}
                className={`${cfg.color} mt-0.5 flex-shrink-0`}
                weight="fill"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/90 truncate">
                    {entity.name}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${typeColors[entity.type]}`}
                  >
                    {entity.type}
                  </span>
                </div>
                <span className="text-xs text-white/30">
                  {entity.mentions}/{entity.required} mentions
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
