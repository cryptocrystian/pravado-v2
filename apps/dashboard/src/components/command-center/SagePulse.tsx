'use client';

import { sageSignals } from './cc-mock-data';

export function SagePulse() {
  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl p-5">
      {/* Header */}
      <span className="text-[13px] font-semibold uppercase tracking-wider text-white/60">
        SAGE Pulse
      </span>

      {/* Signals */}
      <div className="mt-4">
        {sageSignals.map((signal, idx) => (
          <div
            key={signal.id}
            className={`py-3 cursor-pointer hover:bg-white/[0.02] rounded-lg px-3 transition-colors ${
              idx < sageSignals.length - 1 ? 'border-b border-white/5' : ''
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-base flex-shrink-0 leading-5">
                {signal.emoji}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/80 leading-snug">
                  {signal.text}
                </p>
                <span className="text-xs text-white/45 mt-1 block">
                  {signal.timestamp}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <button className="text-xs text-cc-cyan cursor-pointer mt-4 block hover:text-cc-cyan/80 transition-colors">
        See full intelligence &rarr;
      </button>
    </div>
  );
}
