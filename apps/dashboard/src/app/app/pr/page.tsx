'use client';

/**
 * PR Action Queue — /app/pr
 *
 * Three-mode surface:
 *   Manual    → Priority-sorted action grid (human-driven)
 *   Copilot   → SAGE pitch recommendation queue
 *   Autopilot → Exception console + activity log
 *
 * Mode state lives in PRModeContext (provided by PRShell). Default is
 * Copilot for Phase 0 (the exemplary path per the May 12 audit).
 *
 * Phase 0 Track 0B:
 *   - Manual mode is gated behind PR_ACTION_QUEUE_MANUAL_WIRED. Until the
 *     manual action queue has a real backend (the May 12 audit caught it
 *     mixing mockCriticalHigh into the inbox response), it renders
 *     ComingSoonGate.
 *   - mockActions / mockJournalists / mockConversation imports removed at
 *     the page level; the ConversationThread modal (manual-only) is no
 *     longer rendered. pr-mock-data.ts itself stays for the SAGE journalists
 *     tab per the Feb brief exemption.
 */

export const dynamic = 'force-dynamic';

import {
  Lightning,
  ArrowRight,
  Clock,
  WarningCircle,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import type { ActionItem, Priority } from '@/components/command-center/types';
import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { ModeEvaluatingState } from '@/components/shared/ModeEvaluatingState';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useMode } from '@/lib/ModeContext';

// ============================================
// URGENCY BADGE
// ============================================

const URGENCY_STYLES: Record<Priority, string> = {
  critical: 'bg-semantic-danger/10 text-semantic-danger',
  high: 'bg-semantic-warning/10 text-semantic-warning',
  medium: 'bg-white/5 text-white/45',
  low: 'bg-white/5 text-white/30',
};

const SIGNAL_TONE: Record<string, string> = {
  positive: 'text-semantic-success',
  neutral: 'text-white/70',
  warning: 'text-semantic-warning',
  critical: 'text-semantic-danger',
};

// ============================================
// COPILOT VIEW — SAGE Pitch Queue (real SAGE proposals, read-only)
// ============================================

interface ActionStreamPayload {
  generated_at: string;
  items: ActionItem[];
}

type QueueState =
  | { status: 'loading' }
  | { status: 'error'; message: string; code?: string; httpStatus: number }
  | { status: 'no_org' }
  | { status: 'ready'; data: ActionStreamPayload };

/**
 * Pipeline is honestly unavailable until a real count source is wired
 * (/api/pr/pitches/summary returns available:false). We render "—", never a
 * fabricated 0.
 */
type PipelineState =
  | { available: false }
  | {
      available: true;
      drafts: number;
      awaiting_send: number;
      sent: number;
      coverage: number;
    };

function PitchCard({ rec }: { rec: ActionItem }) {
  const router = useRouter();
  const urgency = rec.priority;
  const outcome = rec.outcome;

  // READ-ONLY slice: navigate to the proposal's real deep_link only. We never fire
  // approve/execute/send from here, and we deliberately prefer the deep_link label
  // over cta.primary (which can read "Send Pitch") so the button never implies a
  // send action that this surface does not perform.
  const ctaLabel = rec.deep_link?.label || 'Open in PR';
  const href = rec.deep_link?.href;

  return (
    <div className="bg-slate-2 border border-slate-4 rounded-xl p-5 hover:border-slate-5 transition-all duration-150">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${URGENCY_STYLES[urgency] ?? URGENCY_STYLES.medium}`}
          >
            {urgency}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30">
            PR
          </span>
          <h3 className="text-[15px] font-semibold text-white/90 leading-snug">
            {rec.title}
          </h3>
        </div>
      </div>

      {/* Why — the real proposal rationale */}
      {rec.why && (
        <p className="text-[13px] text-white/70 mb-3 leading-relaxed">
          {rec.why}
        </p>
      )}

      {/* Signals — real EVI impact / confidence / priority from the proposal */}
      {rec.signals.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap mb-3">
          {rec.signals.map((sig) => (
            <div key={sig.label} className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-white/55 uppercase tracking-wide">
                {sig.label}
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${SIGNAL_TONE[sig.tone] ?? 'text-white/70'}`}
              >
                {sig.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recommended next step — real proposal field */}
      {rec.recommended_next_step && (
        <p className="text-[13px] text-white/70 leading-relaxed mb-3">
          <span className="text-white/50">Recommended: </span>
          {rec.recommended_next_step}
        </p>
      )}

      {/* Outcome (executed proposals) — honest, never shown as a win unless verified */}
      {outcome && (
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${
              outcome.result === 'success'
                ? 'bg-semantic-success/10 text-semantic-success border-semantic-success/20'
                : outcome.result === 'failure'
                  ? 'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20'
                  : 'bg-white/5 text-white/70 border-white/20'
            }`}
          >
            {outcome.result === 'success'
              ? 'Completed'
              : outcome.result === 'failure'
                ? 'Failed'
                : 'Governed'}
          </span>
          {outcome.reason && (
            <span className="text-[13px] text-white/60">{outcome.reason}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-magenta" />
          <span className="text-[11px] text-white/40">
            Confidence {Math.round(rec.confidence * 100)}%
          </span>
        </div>
        {/* Navigation only — no send, no execute. */}
        <button
          type="button"
          onClick={() => (href ? router.push(href) : undefined)}
          className="flex items-center gap-1.5 bg-brand-magenta text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:bg-brand-magenta/90 shadow-[0_0_16px_rgba(217,70,239,0.25)] transition-all duration-150"
        >
          {ctaLabel}
          <ArrowRight className="w-3 h-3" weight="bold" />
        </button>
      </div>
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-label="Loading SAGE pitch queue"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-slate-2 border border-slate-4 rounded-xl p-5 animate-pulse"
        >
          <div className="h-4 w-2/3 bg-white/10 rounded mb-4" />
          <div className="h-12 w-full bg-white/[0.04] rounded-lg mb-3" />
          <div className="flex gap-4">
            <div className="h-3 w-20 bg-white/10 rounded" />
            <div className="h-3 w-20 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function QueueError({
  message,
  code,
  httpStatus,
}: {
  message: string;
  code?: string;
  httpStatus: number;
}) {
  return (
    <div className="bg-semantic-danger/10 border border-semantic-danger/20 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <WarningCircle
          size={20}
          weight="fill"
          className="text-semantic-danger shrink-0 mt-0.5"
        />
        <div>
          <h3 className="text-[15px] font-semibold text-semantic-danger">
            Couldn&rsquo;t load the SAGE pitch queue
          </h3>
          <p className="text-[13px] text-white/70 leading-relaxed mt-1">
            {message}
          </p>
          <p className="text-xs text-white/50 uppercase tracking-wide mt-2">
            Status {httpStatus}
            {code ? ` · ${code}` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

function CopilotView() {
  const [state, setState] = useState<QueueState>({ status: 'loading' });
  const [pipeline, setPipeline] = useState<PipelineState>({ available: false });

  useEffect(() => {
    let cancelled = false;

    async function loadQueue() {
      try {
        const res = await fetch('/api/pr/action-queue', {
          credentials: 'include',
        });

        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as {
            error?: { code?: string; message?: string };
          } | null;

          if (res.status === 403 && body?.error?.code === 'NO_ORG') {
            if (!cancelled) setState({ status: 'no_org' });
            return;
          }

          if (!cancelled) {
            setState({
              status: 'error',
              httpStatus: res.status,
              message:
                body?.error?.message ??
                `Pitch queue request failed (${res.status})`,
              code: body?.error?.code,
            });
          }
          return;
        }

        const body = (await res.json()) as {
          success?: boolean;
          data?: ActionStreamPayload;
          error?: { code?: string; message?: string };
        };

        if (!body.success || !body.data) {
          if (!cancelled) {
            setState({
              status: 'error',
              httpStatus: res.status,
              message: body.error?.message ?? 'Unexpected response from server',
              code: body.error?.code,
            });
          }
          return;
        }

        if (!cancelled) setState({ status: 'ready', data: body.data });
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            httpStatus: 0,
            message: err instanceof Error ? err.message : 'Network error',
          });
        }
      }
    }

    async function loadPipeline() {
      try {
        const res = await fetch('/api/pr/pitches/summary', {
          credentials: 'include',
        });
        if (!res.ok) return;
        const body = (await res.json()) as {
          available?: boolean;
          pipeline?: {
            drafts?: number;
            awaiting_send?: number;
            sent?: number;
            coverage?: number;
          } | null;
        };
        if (cancelled) return;
        if (body.available && body.pipeline) {
          setPipeline({
            available: true,
            drafts: body.pipeline.drafts ?? 0,
            awaiting_send: body.pipeline.awaiting_send ?? 0,
            sent: body.pipeline.sent ?? 0,
            coverage: body.pipeline.coverage ?? 0,
          });
        }
      } catch {
        // Honest: leave pipeline unavailable ("—"); never fabricate counts.
      }
    }

    loadQueue();
    loadPipeline();
    return () => {
      cancelled = true;
    };
  }, []);

  const items = state.status === 'ready' ? state.data.items : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* Left: SAGE pitch recommendations */}
      <div>
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lightning className="w-4 h-4 text-brand-magenta" weight="fill" />
            <h2 className="text-[13px] font-bold text-white/90">
              SAGE Pitch Queue
            </h2>
            {state.status === 'ready' && (
              <span className="text-[11px] text-white/40 bg-slate-3 px-2 py-0.5 rounded-full">
                {items.length}
              </span>
            )}
          </div>
        </div>

        {state.status === 'loading' && <QueueSkeleton />}

        {state.status === 'error' && (
          <QueueError
            message={state.message}
            code={state.code}
            httpStatus={state.httpStatus}
          />
        )}

        {(state.status === 'no_org' ||
          (state.status === 'ready' && items.length === 0)) && (
          <div className="bg-slate-2 border border-slate-4 rounded-xl p-8 text-center">
            <p className="text-white/45 text-[13px]">
              {state.status === 'no_org'
                ? 'Finish setting up your workspace'
                : 'No PR recommendations right now'}
            </p>
            <p className="text-white/30 text-[12px] mt-1">
              {state.status === 'no_org'
                ? 'SAGE surfaces pitch recommendations once your workspace is connected to an organization.'
                : 'SAGE will surface journalist opportunities as it monitors your visibility signals. A quiet queue is expected for a new brand.'}
            </p>
          </div>
        )}

        {state.status === 'ready' && items.length > 0 && (
          <div className="space-y-3">
            {items.map((rec) => (
              <PitchCard key={rec.id} rec={rec} />
            ))}
          </div>
        )}
      </div>

      {/* Right: Relationship health + pipeline summary */}
      <div className="space-y-4">
        {/* EVI attribution */}
        <div className="bg-slate-2 border border-slate-4 rounded-xl p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">
            EVI Attribution
          </h3>
          <p className="text-[12px] text-white/35">
            EVI attribution data will appear as pitches generate coverage.
          </p>
        </div>

        {/* Top journalists */}
        <div className="bg-slate-2 border border-slate-4 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40">
              Top Targets
            </h3>
          </div>
          <p className="text-[12px] text-white/35">
            Top journalist targets will appear as SAGE analyzes your industry
            signals.
          </p>
        </div>

        {/* Pipeline summary — honest "—" until a real count source is wired */}
        <div className="bg-slate-2 border border-slate-4 rounded-xl p-4">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-3">
            Pitch Pipeline
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                label: 'Drafts',
                value: pipeline.available ? pipeline.drafts : '—',
                color: 'text-white/70',
              },
              {
                label: 'Awaiting Send',
                value: pipeline.available ? pipeline.awaiting_send : '—',
                color: 'text-semantic-warning',
              },
              {
                label: 'Sent',
                value: pipeline.available ? pipeline.sent : '—',
                color: 'text-brand-cyan',
              },
              {
                label: 'Coverage',
                value: pipeline.available ? pipeline.coverage : '—',
                color: 'text-semantic-success',
              },
            ].map((item) => (
              <div key={item.label} className="bg-slate-3 rounded-lg p-3">
                <p
                  className={`text-[18px] font-bold ${pipeline.available ? item.color : 'text-white/30'}`}
                >
                  {item.value}
                </p>
                <p className="text-[11px] text-white/40 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          {!pipeline.available && (
            <p className="text-[11px] text-white/30 mt-3">
              Pipeline counts appear once pitch tracking is connected.
            </p>
          )}
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
            <span className="text-[12px] font-semibold text-white/70">
              IDLE
            </span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <span className="text-[12px] text-white/50">0 items supervised</span>
        </div>

        <div className="bg-slate-2 border border-slate-4 rounded-xl p-8 text-center">
          <p className="text-white/45 text-[13px]">No exceptions.</p>
          <p className="text-white/30 text-[12px] mt-1">
            SAGE has no blocked items requiring review.
          </p>
        </div>
      </div>

      {/* Right: Activity log */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-bold text-white/90">Activity Log</h2>
        </div>

        <div className="bg-slate-2 border border-slate-4 rounded-xl p-8 text-center">
          <p className="text-white/45 text-[13px]">
            Activity log will populate as SAGE executes pitching actions.
          </p>
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
  const { effectiveMode: mode, isEvaluating } = useMode('pr');
  const manualWired = useFeatureFlag('PR_ACTION_QUEUE_MANUAL_WIRED');

  // Cosmetic ~800ms mode-transition (PR-3) — shown before the new mode layout.
  if (isEvaluating) {
    return (
      <div className="pt-6 pb-16 px-8">
        <ModeEvaluatingState />
      </div>
    );
  }

  if (mode === 'manual' && !manualWired) {
    return <ComingSoonGate pillar="PR" subsurface="Manual mode" />;
  }

  return (
    <div className="pt-6 pb-16 px-8">
      {mode === 'copilot' && <CopilotView />}
      {mode === 'autopilot' && <AutopilotView />}
      {mode === 'manual' && (
        // Manual view returns in Phase 1 once the action queue has a
        // backend; for now it's gated above so this branch is unreachable.
        <CopilotView />
      )}
    </div>
  );
}
