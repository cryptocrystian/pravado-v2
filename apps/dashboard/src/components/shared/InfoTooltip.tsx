'use client';

import { useState, useRef, useEffect } from 'react';

interface InfoTooltipProps {
  content: string;
  /** Optional custom size for the icon (default 13) */
  size?: number;
}

/**
 * InfoTooltip — hoverable (i) icon that shows a plain-English explanation.
 * Used next to opaque metrics like EVI, CiteMind, SAGE, SOV.
 */
export function InfoTooltip({ content, size = 13 }: InfoTooltipProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Flip to top if too close to bottom of viewport
      setPosition(rect.bottom + 160 > window.innerHeight ? 'top' : 'bottom');
    }
  }, [show]);

  return (
    <span className="relative inline-flex items-center">
      <button
        ref={triggerRef}
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        className="inline-flex items-center justify-center rounded-full text-white/30 hover:text-white/60 transition-colors focus:outline-none"
        aria-label="More info"
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <text
            x="8"
            y="12"
            textAnchor="middle"
            fill="currentColor"
            fontSize="10"
            fontWeight="600"
            fontFamily="system-ui"
          >
            i
          </text>
        </svg>
      </button>

      {show && (
        <div
          ref={tooltipRef}
          className={`absolute z-[100] w-64 px-3 py-2.5 rounded-lg border border-white/10 bg-slate-2 shadow-elev-3 text-xs text-white/80 leading-relaxed ${
            position === 'bottom' ? 'top-full mt-1.5' : 'bottom-full mb-1.5'
          } left-1/2 -translate-x-1/2`}
        >
          {content}
        </div>
      )}
    </span>
  );
}
