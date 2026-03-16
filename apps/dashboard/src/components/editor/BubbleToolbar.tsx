'use client';

/**
 * BubbleToolbar — AI-action floating menu for EditorCanvas.
 * DS v3.1 tokens. Appears on text selection.
 */

import { useState } from 'react';
import {
  ArrowsClockwise,
  ArrowsOut,
  ArrowsIn,
  Sparkle,
  CaretDown,
} from '@phosphor-icons/react';

const toneOptions = ['Professional', 'Conversational', 'Technical', 'Authoritative'];

interface BubbleToolbarProps {
  onAction: (action: string, value?: string) => void;
}

export function BubbleToolbar({ onAction }: BubbleToolbarProps) {
  const [showToneMenu, setShowToneMenu] = useState(false);

  return (
    <div className="flex items-center gap-0.5 bg-slate-2 border border-slate-4 rounded-xl px-1 py-1 shadow-elev-3">
      <button
        type="button"
        onClick={() => onAction('rewrite')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-slate-3 transition-colors"
      >
        <ArrowsClockwise size={14} />
        Rewrite
      </button>

      <button
        type="button"
        onClick={() => onAction('expand')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-slate-3 transition-colors"
      >
        <ArrowsOut size={14} />
        Expand
      </button>

      <button
        type="button"
        onClick={() => onAction('shorten')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-slate-3 transition-colors"
      >
        <ArrowsIn size={14} />
        Shorten
      </button>

      {/* Improve AEO — brand-teal accent */}
      <button
        type="button"
        onClick={() => onAction('improve-aeo')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-brand-teal hover:bg-brand-teal/10 transition-colors font-semibold"
      >
        <Sparkle size={14} />
        Improve AEO
      </button>

      {/* Tone dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowToneMenu(!showToneMenu)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-slate-3 transition-colors"
        >
          Tone
          <CaretDown size={12} />
        </button>

        {showToneMenu && (
          <div className="absolute top-full right-0 mt-1 bg-slate-2 border border-slate-4 rounded-xl shadow-elev-3 py-1 w-[160px] z-50">
            {toneOptions.map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => {
                  onAction('tone', tone.toLowerCase());
                  setShowToneMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-slate-3 transition-colors"
              >
                {tone}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
