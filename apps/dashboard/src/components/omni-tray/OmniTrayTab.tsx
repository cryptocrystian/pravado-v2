'use client';

/**
 * OmniTrayTab — Click-to-open handle strip on the right edge.
 *
 * Desktop (>=768px): 8px vertical strip, full viewport height below topbar.
 * Mobile (<768px): 56px floating circle, bottom-right.
 *
 * No proximity detection — click only.
 */

import { Lightning } from '@phosphor-icons/react';
import { useOmniTray } from './useOmniTray';

export function OmniTrayTab() {
  const { isOpen, toggle } = useOmniTray();

  return (
    <>
      {/* Desktop: persistent right-edge strip */}
      <button
        onClick={toggle}
        className="
          hidden md:flex fixed z-40 right-0 top-20 bottom-0 w-2
          items-center justify-center
          bg-slate-2 border-l border-slate-4
          hover:w-5 hover:bg-slate-3 hover:border-brand-cyan/30
          hover:shadow-[inset_2px_0_8px_rgba(0,217,255,0.1)]
          transition-all duration-200 ease-out
          group cursor-pointer
        "
        aria-label={isOpen ? 'Close AI tray' : 'Open AI tray'}
      >
        <svg
          className={`w-3 h-3 text-white/30 group-hover:text-brand-cyan opacity-0 group-hover:opacity-100 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Mobile: floating action button */}
      <button
        onClick={toggle}
        className="
          md:hidden fixed z-40 right-4 bottom-4
          w-14 h-14 rounded-full
          bg-brand-iris text-white
          flex items-center justify-center
          shadow-[0_0_20px_rgba(168,85,247,0.3)]
          hover:bg-brand-iris/90
          active:scale-95
          transition-all duration-150
        "
        aria-label={isOpen ? 'Close AI tray' : 'Open AI tray'}
      >
        <Lightning size={24} weight="fill" />
      </button>
    </>
  );
}
