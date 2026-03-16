'use client';

import { ArrowUp, ArrowDown, Minus, Sparkle } from '@phosphor-icons/react';
import type { CitationSignal } from '../editor-mock-data';

const trendConfig = {
  up: { icon: ArrowUp, color: 'text-semantic-success' },
  down: { icon: ArrowDown, color: 'text-red-500' },
  stable: { icon: Minus, color: 'text-white/30' },
  new: { icon: Sparkle, color: 'text-cc-cyan' },
};

interface CitationSignalsProps {
  signals: CitationSignal[];
}

export function CitationSignals({ signals }: CitationSignalsProps) {
  const citedCount = signals.filter((s) => s.cited).length;

  return (
    <div className="p-4">
      <span className="text-xs text-white/45 block mb-3">
        Cited in {citedCount}/{signals.length} engines
      </span>

      <div className="space-y-2.5">
        {signals.map((signal) => {
          const trend = trendConfig[signal.trend];
          const TrendIcon = trend.icon;
          return (
            <div
              key={`${signal.engine}-${signal.query}`}
              className="bg-white/[0.02] rounded-lg p-2.5"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white/90">
                  {signal.engine}
                </span>
                <div className="flex items-center gap-1.5">
                  {signal.cited ? (
                    <span className="text-xs text-semantic-success font-medium">
                      #{signal.position}
                    </span>
                  ) : (
                    <span className="text-xs text-white/30">Not cited</span>
                  )}
                  <TrendIcon size={12} className={trend.color} weight="bold" />
                </div>
              </div>
              <p className="text-xs text-white/45 truncate">
                &ldquo;{signal.query}&rdquo;
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
