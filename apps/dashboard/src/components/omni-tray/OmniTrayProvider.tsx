'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useOmniTray, OmniTrayEdge } from './useOmniTray';
import { OmniTrayTab } from './OmniTrayTab';
import { OmniTray } from './OmniTray';

const TOPBAR_HEIGHT = 80;
const DEAD_ZONE = 80; // px from edge before any reaction
const OPEN_THRESHOLD = 20; // px from edge to trigger open
const DWELL_MS: Record<OmniTrayEdge, number> = {
  left: 300,
  right: 300,
  bottom: 800, // Bottom requires longer intent to avoid tab-click conflicts
};
const VELOCITY_LIMIT = 0.8; // px/ms - above this, suppress trigger

export function OmniTrayProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, open, close, setProximity } = useOmniTray();
  const [showIntroTooltip, setShowIntroTooltip] = useState(false);

  const lastPos = useRef<{ x: number; y: number; t: number } | null>(null);
  const dwellTimer = useRef<NodeJS.Timeout | null>(null);
  const dwellEdge = useRef<OmniTrayEdge | null>(null);

  const getProximityLevel = useCallback(
    (x: number, y: number, edge: OmniTrayEdge): number => {
      if (edge === 'left') return Math.max(0, 1 - x / DEAD_ZONE);
      if (edge === 'right') return Math.max(0, 1 - (window.innerWidth - x) / DEAD_ZONE);
      if (edge === 'bottom') return Math.max(0, 1 - (window.innerHeight - y) / DEAD_ZONE);
      return 0;
    },
    []
  );

  const getDistanceFromEdge = useCallback(
    (x: number, y: number, edge: OmniTrayEdge): number => {
      if (edge === 'left') return x;
      if (edge === 'right') return window.innerWidth - x;
      if (edge === 'bottom') return window.innerHeight - y;
      return Infinity;
    },
    []
  );

  // Proximity detection + dwell logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX: x, clientY: y } = e;
      const now = Date.now();

      // Ignore top area (topbar zone)
      if (y < TOPBAR_HEIGHT) {
        lastPos.current = { x, y, t: now };
        return;
      }

      // Velocity gate
      if (lastPos.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        const dt = now - lastPos.current.t;
        if (dt > 0) {
          const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
          if (velocity > VELOCITY_LIMIT) {
            lastPos.current = { x, y, t: now };
            return;
          }
        }
      }
      lastPos.current = { x, y, t: now };

      if (isOpen) return; // Don't process proximity when already open

      // Bottom edge exclusion: if cursor is near bottom but NOT within viewport bottom
      // 20px (actual window edge), treat it as interior content — don't trigger bottom tray.
      const BOTTOM_CONTENT_GUARD = 120; // px from bottom of viewport
      const nearBottomContent = (window.innerHeight - y) < BOTTOM_CONTENT_GUARD &&
                                 (window.innerHeight - y) > OPEN_THRESHOLD;

      const edges: OmniTrayEdge[] = ['left', 'right', 'bottom'];

      edges.forEach((edge) => {
        // Skip bottom proximity glow when cursor is in bottom content zone (not at true edge)
        if (edge === 'bottom' && nearBottomContent) {
          setProximity('bottom', 0);
          if (dwellEdge.current === 'bottom') {
            if (dwellTimer.current) clearTimeout(dwellTimer.current);
            dwellEdge.current = null;
          }
          return;
        }

        const level = getProximityLevel(x, y, edge);
        setProximity(edge, level);

        const dist = getDistanceFromEdge(x, y, edge);

        if (dist <= OPEN_THRESHOLD) {
          // Start dwell timer for this edge
          if (dwellEdge.current !== edge) {
            if (dwellTimer.current) clearTimeout(dwellTimer.current);
            dwellEdge.current = edge;
            dwellTimer.current = setTimeout(() => {
              open(edge);
              dwellEdge.current = null;
            }, DWELL_MS[edge]);
          }
        } else if (dwellEdge.current === edge) {
          // Cursor left the open zone - cancel dwell
          if (dwellTimer.current) clearTimeout(dwellTimer.current);
          dwellEdge.current = null;
        }
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      if (dwellTimer.current) clearTimeout(dwellTimer.current);
    };
  }, [isOpen, open, close, setProximity, getProximityLevel, getDistanceFromEdge]);

  // First-run onboarding choreography
  useEffect(() => {
    const shown = localStorage.getItem('pravado_omnitray_intro_shown');
    if (shown) return;

    const timer = setTimeout(() => {
      // Pulse left tab
      setProximity('left', 0.8);
      setTimeout(() => setProximity('left', 0), 600);
      // Pulse right tab
      setTimeout(() => {
        setProximity('right', 0.8);
        setTimeout(() => setProximity('right', 0), 600);
      }, 800);
      // Pulse bottom tab
      setTimeout(() => {
        setProximity('bottom', 0.8);
        setTimeout(() => setProximity('bottom', 0), 600);
      }, 1600);
      // Show tooltip
      setTimeout(() => setShowIntroTooltip(true), 1800);
      setTimeout(() => {
        setShowIntroTooltip(false);
        localStorage.setItem('pravado_omnitray_intro_shown', 'true');
      }, 4800);
    }, 2000);

    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {children}
      {/* Persistent edge tabs */}
      <OmniTrayTab edge="left" />
      <OmniTrayTab edge="right" />
      <OmniTrayTab edge="bottom" />
      {/* Intro tooltip near right tab */}
      {showIntroTooltip && (
        <div
          className="fixed z-50 right-14 top-1/2 -translate-y-1/2 animate-in fade-in duration-300"
        >
          <div className="text-xs text-white/70 bg-slate-2 border border-brand-cyan/20 px-3 py-1.5 rounded-lg shadow-lg">
            AI is always one move away
          </div>
        </div>
      )}
      {/* Tray panel */}
      {isOpen && <OmniTray />}
    </>
  );
}
