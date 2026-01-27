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
 * Command Center Page v2.0 - Modal Model
 *
 * INTERACTION CONTRACT v2.0:
 * - Card click / "Review" button → Opens ActionModal (centered)
 * - Primary CTA → Executes action (shows toast, updates state)
 * - NO right-side drawer for action investigation
 *
 * AI-First Command Center with tri-pane layout:
 * - Left: Action Stream (prioritized AI proposals)
 * - Center: Intelligence Canvas (knowledge graph + citations)
 * - Right: Strategy Panel (KPIs + narratives)
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import {
  ActionModal,
  ActionStreamPane,
  CalendarPeek,
  IntelligenceCanvasPane,
  StrategyPanelPane,
  TriPaneShell,
} from '@/components/command-center';
import type {
  ActionItem,
  ActionStreamResponse,
  EVIFilterState,
  ExecutionState,
  IntelligenceCanvasResponse,
  OrchestrationCalendarResponse,
  StrategyPanelResponse,
  EntityMapResponse,
} from '@/components/command-center';

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

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg
        ${type === 'success' ? 'bg-semantic-success/95' : 'bg-semantic-danger/95'}
        text-white animate-in slide-in-from-bottom-5 fade-in duration-300
      `}
    >
      {type === 'success' ? (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}

export default function CommandCenterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const entityMap = useCommandCenterData<EntityMapResponse>(
    '/api/command-center/entity-map'
  );

  // v2 Entity Map: Track hovered action for cross-pane coordination
  const [hoveredActionId, setHoveredActionId] = useState<string | null>(null);

  // v2 Entity Map: Handle hover action change from ActionStreamPane
  const handleHoverActionChange = useCallback((actionId: string | null) => {
    setHoveredActionId(actionId);
  }, []);

  // Modal state (replaces drawer)
  const [selectedAction, setSelectedAction] = useState<ActionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Execution states per action
  const [executionStates, setExecutionStates] = useState<Record<string, ExecutionState>>({});

  // v2 Entity Map: Find currently executing action ID for pulse animation
  const executingActionId = useMemo(() => {
    const entry = Object.entries(executionStates).find(([, state]) => state === 'executing');
    return entry ? entry[0] : null;
  }, [executionStates]);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // EVI filter state from Strategy Panel
  const [eviFilter, setEviFilter] = useState<EVIFilterState | null>(() => {
    // Initialize from URL params if present
    const driver = searchParams?.get('driver') as EVIFilterState['driver'] | null;
    const pillar = searchParams?.get('pillar') as EVIFilterState['pillar'] | null;
    if (driver || pillar) {
      return {
        driver: driver || undefined,
        pillar: pillar || undefined,
        source: 'manual',
        label: `${driver || ''} ${pillar ? `→ ${pillar}` : ''}`.trim(),
      };
    }
    return null;
  });

  // Handle EVI filter change (from Strategy Panel)
  const handleEviFilter = useCallback((filter: EVIFilterState | null) => {
    setEviFilter(filter);

    // Persist to URL for session persistence
    const url = new URL(window.location.href);
    if (filter) {
      if (filter.driver) url.searchParams.set('driver', filter.driver);
      else url.searchParams.delete('driver');
      if (filter.pillar) url.searchParams.set('pillar', filter.pillar);
      else url.searchParams.delete('pillar');
    } else {
      url.searchParams.delete('driver');
      url.searchParams.delete('pillar');
    }
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  // Clear EVI filter
  const handleClearEviFilter = useCallback(() => {
    handleEviFilter(null);
  }, [handleEviFilter]);

  // Handle "Review" - opens modal for investigation
  const handleReview = useCallback((action: ActionItem) => {
    setSelectedAction(action);
    setIsModalOpen(true);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    // Clear selection after modal animation completes
    setTimeout(() => setSelectedAction(null), 300);
  }, []);

  // Handle Primary Action - executes the action
  const handlePrimaryAction = useCallback((action: ActionItem) => {
    // Don't execute if gated
    if (action.gate.required) {
      setToast({ message: `Action requires ${action.gate.min_plan} plan`, type: 'error' });
      return;
    }

    // Already executing or completed
    if (executionStates[action.id] === 'executing' || executionStates[action.id] === 'success') {
      return;
    }

    console.log('[CommandCenter] Executing action:', action.id, action.cta.primary);

    // Set executing state
    setExecutionStates(prev => ({ ...prev, [action.id]: 'executing' }));

    // Simulate execution (in production, this would be an API call)
    setTimeout(() => {
      // Simulate 90% success rate
      const success = Math.random() > 0.1;

      setExecutionStates(prev => ({
        ...prev,
        [action.id]: success ? 'success' : 'error',
      }));

      if (success) {
        setToast({ message: `${action.cta.primary} completed successfully`, type: 'success' });
        // v3: Don't auto-close modal - it now shows success state inline
        // User can click "Done" button or navigate via deep link
      } else {
        setToast({ message: `Failed to ${action.cta.primary.toLowerCase()}`, type: 'error' });
      }
    }, 1500 + Math.random() * 1000); // 1.5-2.5s simulated delay
  }, [executionStates]);

  // Clear toast
  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)]">
      <TriPaneShell
        actionPane={
          <ActionStreamPane
            data={actionStream.data}
            isLoading={actionStream.isLoading}
            error={actionStream.error}
            onReview={handleReview}
            onPrimaryAction={handlePrimaryAction}
            selectedActionId={selectedAction?.id ?? null}
            executionStates={executionStates}
            eviFilter={eviFilter}
            onClearEviFilter={handleClearEviFilter}
            onHoverActionChange={handleHoverActionChange}
          />
        }
        intelligencePane={
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <IntelligenceCanvasPane
                data={intelligenceCanvas.data}
                isLoading={intelligenceCanvas.isLoading}
                error={intelligenceCanvas.error}
                entityMapData={entityMap.data}
                hoveredActionId={hoveredActionId}
                executingActionId={executingActionId}
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
            onDriverFilter={handleEviFilter}
            activeFilter={eviFilter}
          />
        }
      />

      {/* Action Modal v3 (centered, replaces right-side drawer) */}
      <ActionModal
        action={selectedAction}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onPrimaryAction={handlePrimaryAction}
        executionState={selectedAction ? executionStates[selectedAction.id] ?? 'idle' : 'idle'}
      />

      {/* Toast notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={clearToast} />
      )}
    </div>
  );
}
