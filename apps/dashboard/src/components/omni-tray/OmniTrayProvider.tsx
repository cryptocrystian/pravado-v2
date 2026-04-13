'use client';

/**
 * OmniTrayProvider — Click-to-open tray, no proximity detection.
 *
 * Renders:
 * - Children (page content)
 * - OmniTrayTab (persistent click handle)
 * - OmniTray panel (when open)
 *
 * ESC key closes the tray.
 */

import { useEffect } from 'react';
import { useOmniTray } from './useOmniTray';
import { OmniTrayTab } from './OmniTrayTab';
import { OmniTray } from './OmniTray';

export function OmniTrayProvider({ children }: { children: React.ReactNode }) {
  const { isOpen, close } = useOmniTray();

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  return (
    <>
      {children}
      <OmniTrayTab />
      {isOpen && <OmniTray />}
    </>
  );
}
