'use client';

/**
 * PR Action Queue — /app/pr
 *
 * Three-mode surface:
 *   Manual    → Priority-sorted action grid (human-driven)
 *   Copilot   → SAGE pitch recommendation queue
 *   Autopilot → Exception console + activity log
 *
 * Mode state lives in PRModeContext (provided by PRShell).
 */

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lightning,
  ArrowRight,
  Clock,
} from '@phosphor-icons/react';

import { usePRMode } from '@/components/pr/PRModeContext';
import { ConversationThread } from '@/components/pr/ConversationThread';
import {
  mockActions,
  mockJournalists,
  mockConversation,
} from '@/components/pr/pr-mock-data';
import type { PRActionItem } from '@/components/pr/pr-mock-data';
import { PRActionCard } from '@/components/pr/PRActionCard';
import { fetchInbox, adaptInboxToPRAction } from '@/lib/prApi';


// ============================================
// URGENCY BADGE
// ============================================

const URGENCY_STYLES = {
  critical: 'bg-semantic-danger/10 text-semantic-danger',
  high: 'bg-semantic-warning/10 text-semantic-warning',
  medium: 'bg-white/5 text-white/45',
  low: 'bg-white/5 text-white/30',
};

// ============================================
// MANUAL VIEW
// ============================================

function ManualView({
  actions,
  isLoading,
  onDismiss,
  onOpenThread,
}: {
  actions: PRActionItem[];
  isLoading: boolean;
  onDismiss: (id: string) => void;
  onOpenThread: () => void;
}) {
  const criticalHigh = actions.filter((a) => a.priority === 'critical' || a.priority === 'high');
  const mediumLow = actions.filter((a) => a.priority === 'medium' || a.priority === 'low');

  if (actions.length === 0 && !isLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-white/45">You&apos;re all caught up — no actions pending.</p>
        <p className="text-white/30 text-sm mt-2">SAGE will surface journalist opportunities as it monitors your visibility signals.</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6 ${isLoading ? 'opacity-50' : ''}`}>
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">Critical &amp; High</h2>
        {criticalHigh.map((action) => (
          <PRActionCard
            key={action.id}
            action={action}
            onDismiss={() => onDismiss(action.id)}
            onSecondary={action.journalistId ? onOpenThread : undefined}
          />
        ))}
      </div>
      <div>
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">Medium &amp; Low</h2>
        {mediumLow.map((action) => (
          <PRActionCard
            key={action.id}
            action={action}
            onDismiss={() => onDismiss(action.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================
// COPILOT VIEW
// ============================================

function CopilotView() {
  const router = useRouter();
  const [recs, setRecs] = useState<Array<{
    id: string; urgency: 'critical' | 'high' | 'medium' | 'low';
    journalist: string; publication: string; beat: string;
    hook: string; eviImpact: string; confidence: number;
    action: string; reason: string;
  }>>([]);
  const [pipeline, setPipeline] = useState({ drafts: 0, awaiting_send: 0, sent: 0, coverage: 0 });

  useEffect(() => {
    fetch('/api/pr/action-queue')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.items)) setRecs(d.items); })
      .catch(() => {});

    fetch('/api/pr/pitches/summary')
      .then(r => r.json())
      .then(d => {
        if (d && typeof d.drafts === 'number') {
          setPipeline({ drafts: d.drafts, awaiting_send: d.awaiting_send ?? 0, sent: d.sent ?? 0, coverage: d.coverage ?? 0 });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

      {/* Left: SAGE pitch recommendations */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightning className="w-4 h-4 text-brand-magenta" weight="fill" />
            <h2 className="text-[13px] font-bold text-white/90">SAGE Pitch Queue</h2>
            <span className="text-[11px] text-white/40 bg-slate-3 px-2 py-0.5 rounded-full">
              {recs.length}
            </span>
          </div>
        </div>

        {recs.length === 0 ? (
          <div className="bg-slate-2 border border-slate-4 rounded-xl p-8 text-center">
            <p className="text-white/45 text-[13px]">No pitch recommendations yet.</p>
            <p className="text-white/30 text-[12px] mt-1">SAGE will surface journalist opportunities as it monitors your visibility signals.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recs.map((rec) => (
              <div
                key={rec.id}
                className="bg-slate-2 border border-slate-4 rounded-xl p-5 hover:border-slate-5 transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-full ${URGENCY_STYLES[rec.urgency] ?? URGENCY_STYLES.medium}`}>
                      {rec.urgency}
                    </span>
                    <span className="text-[12px] font-semibold text-white/90">{rec.journalist}</span>
                    <span className="text-[12px] text-white/50">·</span>
                    <span className="text-[12px] text-white/50">{rec.publication}</span>
                    <span className="text-[11px] text-white/35 bg-slate-3 px-2 py-0.5 rounded-full">{rec.beat}</span>
                  </div>
                  <span className="text-[13px] font-bold text-semantic-success shrink-0 ml-3">{rec.eviImpact} EVI</span>
                </div>
                <p className="text-[13px] text-white/75 mb-1 leading-relaxed">{rec.hook}</p>
                <p className="text-[12px] text-white/45 mb-4">{rec.reason}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-magenta" />
                    <span className="text-[11px] text-white/40">Confidence {Math.round(rec.confidence * 100)}%</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push(`/app/pr/pitches/new?journalist=${encodeURIComponent(rec.journalist)}`)}
                    className="flex items-center gap-1.5 bg-brand-magenta text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-magenta/90 shadow-[0_0_12px_rgba(236,72,153,0.25)] transition-all duration-150"
                  >
                    {rec.action}
                    <ArrowRight className="w-3 h-3" weight="bold" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right: Relationship health + pipeline summary */}
      <div className="space-y-4">

        {/* EVI attribution */}
        <div className="bg-slate-2 border border-slate-4 rounded-xl p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">EVI Attribution</h3>
          <p className="text-[12px] text-white/35">EVI attribution data will appear as pitches generate coverage.</p>
        </div>

        {/* Top journalists */}
        <div className="bg-slate-2 border border-slate-4 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">Top Targets</h3>
          </div>
          <p className="text-[12px] text-white/35">Top journalist targets will appear as SAGE analyzes your industry signals.</p>
        </div>

        {/* Pipeline summary */}
        <div className="bg-slate-2 border border-slate-4 rounded-xl p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">Pitch Pipeline</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Drafts', value: pipeline.drafts, color: 'text-white/70' },
              { label: 'Awaiting Send', value: pipeline.awaiting_send, color: 'text-semantic-warning' },
              { label: 'Sent', value: pipeline.sent, color: 'text-brand-cyan' },
              { label: 'Coverage', value: pipeline.coverage, color: 'text-semantic-success' },
            ].map((item) => (
              <div key={item.label} className="bg-slate-3 rounded-lg p-3">
                <p className={`text-[18px] font-bold ${item.color}`}>{item.value}</p>
                <p className="text-[11px] text-white/40 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AUTOPILOT VIEW
// ============================================

function AutopilotView() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">

      {/* Left: Exceptions */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-[13px] font-bold text-white/90">Exceptions</h2>
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-3 mb-5 bg-slate-2 border border-slate-4 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
            <span className="text-[12px] font-semibold text-white/70">IDLE</span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <span className="text-[12px] text-white/50">0 items supervised</span>
        </div>

        <div className="bg-slate-2 border border-slate-4 rounded-xl p-8 text-center">
          <p className="text-white/45 text-[13px]">No exceptions.</p>
          <p className="text-white/30 text-[12px] mt-1">SAGE has no blocked items requiring review.</p>
        </div>
      </div>

      {/* Right: Activity log */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-bold text-white/90">Activity Log</h2>
        </div>

        <div className="bg-slate-2 border border-slate-4 rounded-xl p-8 text-center">
          <p className="text-white/45 text-[13px]">Activity log will populate as SAGE executes pitching actions.</p>
        </div>

        {/* Pause autopilot */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-slate-2 border border-slate-4 rounded-xl text-[12px] font-semibold text-white/60 hover:text-white/90 hover:border-slate-5 transition-all duration-150"
          >
            <Clock className="w-3.5 h-3.5" weight="regular" />
            Pause Autopilot
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE
// ============================================

export default function PRActionQueuePage() {
  const { mode } = usePRMode();
  const [actions, setActions] = useState<PRActionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showThread, setShowThread] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchInbox();
        if (!cancelled) {
          const mockCriticalHigh = mockActions.filter(
            (a) => a.priority === 'critical' || a.priority === 'high',
          );
          if (data.items.length > 0) {
            setActions([...mockCriticalHigh, ...data.items.map(adaptInboxToPRAction)]);
          } else {
            setActions(mockActions);
          }
        }
      } catch {
        if (!cancelled) setActions(mockActions);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  function handleDismiss(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="pt-6 pb-16 px-8">
      {mode === 'manual' && (
        <ManualView
          actions={actions}
          isLoading={isLoading}
          onDismiss={handleDismiss}
          onOpenThread={() => setShowThread(true)}
        />
      )}
      {mode === 'copilot' && <CopilotView />}
      {mode === 'autopilot' && <AutopilotView />}

      <ConversationThread
        journalist={mockJournalists[0]}
        messages={mockConversation}
        open={showThread}
        onClose={() => setShowThread(false)}
      />
    </div>
  );
}
