'use client';

/**
 * Command Center v3 — Tri-Pane Strategic Briefing Room
 *
 * Full-viewport height layout. Zero main-page scroll.
 * TriPaneShell is the only layout primitive.
 *
 * Layout stack:
 *   CommandCenterTopbar (80px, rendered by layout.tsx)
 *   TriPaneShell (fills remaining height)
 *     Action Stream | Intelligence Canvas | Strategy Panel
 */

import { useState, useEffect } from 'react';

import { TriPaneShell } from '@/components/command-center/TriPaneShell';
import { ActionStreamPane } from '@/components/command-center/ActionStreamPane';
import { IntelligenceCanvasPane } from '@/components/command-center/IntelligenceCanvasPane';
import { StrategyPanelPane } from '@/components/command-center/StrategyPanelPane';

// ── Hooks ──

function useGreeting() {
  const [greeting, setGreeting] = useState('Good afternoon');
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
  }, []);
  return greeting;
}

function useFormattedDate() {
  const [str, setStr] = useState('');
  useEffect(() => {
    const now = new Date();
    setStr(
      now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) +
        ' \u00b7 ' +
        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    );
  }, []);
  return str;
}

// ── Page ──

export default function CommandCenterPage() {
  const greeting = useGreeting();
  const date = useFormattedDate();

  return (
    <div className="flex flex-col bg-page" style={{ height: 'calc(100vh - 80px)' }}>
      <div className="flex-1 min-h-0">
        <TriPaneShell
          greeting={greeting}
          date={date}
          actionPane={<ActionStreamPane />}
          intelligencePane={<IntelligenceCanvasPane />}
          strategyPane={<StrategyPanelPane />}
        />
      </div>
    </div>
  );
}
