'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * Command Center Page
 *
 * AI-First Command Center with tri-pane layout:
 * - Left: Action Stream (prioritized AI proposals)
 * - Center: Intelligence Canvas (knowledge graph + citations)
 * - Right: Strategy Panel (KPIs + narratives)
 *
 * Uses DS v3 topbar shell (CommandCenterLayout) - NO sidebar.
 * Data is fetched from /api/command-center/* endpoints
 * and served via MSW during hollow development phase.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 */

import { useCallback, useEffect, useState } from 'react';

import {
  ActionPeekDrawer,
  ActionStreamPane,
  CalendarPeek,
  IntelligenceCanvasPane,
  StrategyPanelPane,
  TriPaneShell,
} from '@/components/command-center';
import type {
  ActionItem,
  ActionStreamResponse,
  IntelligenceCanvasResponse,
  OrchestrationCalendarResponse,
  StrategyPanelResponse,
} from '@/components/command-center/types';

// Data fetch states
interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

function useCommandCenterData<T>(endpoint: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const response = await fetch(endpoint);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setState({ data, isLoading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            data: null,
            isLoading: false,
            error: err instanceof Error ? err : new Error('Failed to fetch'),
          });
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return state;
}

export default function CommandCenterPage() {
  // Fetch data from all endpoints
  const actionStream = useCommandCenterData<ActionStreamResponse>(
    '/api/command-center/action-stream'
  );
  const intelligenceCanvas = useCommandCenterData<IntelligenceCanvasResponse>(
    '/api/command-center/intelligence-canvas'
  );
  const strategyPanel = useCommandCenterData<StrategyPanelResponse>(
    '/api/command-center/strategy-panel'
  );
  const calendar = useCommandCenterData<OrchestrationCalendarResponse>(
    '/api/command-center/orchestration-calendar'
  );

  // Selected action state for Peek Drawer
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleActionSelect = useCallback((action: ActionItem) => {
    setSelectedAction(action);
    setIsDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
    // Clear selection after drawer animation completes
    setTimeout(() => setSelectedAction(null), 300);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)]">
      <TriPaneShell
        actionPane={
          <ActionStreamPane
            data={actionStream.data}
            isLoading={actionStream.isLoading}
            error={actionStream.error}
            onActionSelect={handleActionSelect}
            selectedActionId={selectedAction?.id ?? null}
          />
        }
        intelligencePane={
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <IntelligenceCanvasPane
                data={intelligenceCanvas.data}
                isLoading={intelligenceCanvas.isLoading}
                error={intelligenceCanvas.error}
              />
            </div>
            {/* Calendar Peek at bottom of intelligence pane */}
            <div className="flex-shrink-0 p-4 border-t border-[#1F1F28]">
              <CalendarPeek
                data={calendar.data}
                isLoading={calendar.isLoading}
                error={calendar.error}
              />
            </div>
          </div>
        }
        strategyPane={
          <StrategyPanelPane
            data={strategyPanel.data}
            isLoading={strategyPanel.isLoading}
            error={strategyPanel.error}
          />
        }
      />

      {/* Action Peek Drawer */}
      <ActionPeekDrawer
        action={selectedAction}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </div>
  );
}
