'use client';

/**
 * ContentSageQueue — real SAGE proposals for the Content pillar.
 *
 * HONEST DATA: self-fetches the dashboard proxy /api/content/recommendations, which
 * forwards to the real SAGE action-stream (`/api/v1/sage/action-stream?pillar=content`).
 * Every field rendered comes straight from a real `sage_proposals` row mapped to the
 * ActionItem shape — nothing is fabricated. Card fields that SAGE does not provide
 * (EVI low/high range, effort, time estimate, topic cluster) are simply omitted rather
 * than invented.
 *
 * THREE (+1) HONEST STATES:
 *  - loading  → skeleton, no fake numbers
 *  - error    → surfaces the real upstream status/message (no fake-data fallback)
 *  - no_org   → honest "finish setting up your workspace" (403 NO_ORG)
 *  - empty    → "No content recommendations right now" (correct for a new org with no
 *               signals — this is not a bug).
 *
 * READ-ONLY for this slice: the primary CTA navigates to the proposal's real
 * `deep_link` (where the user actually acts). We deliberately do NOT fire the
 * `execute`/`approve` PATCH, create a brief, or publish from this surface — the
 * governed `content.create_brief` runs via the SAGE loop, not this UI. The "Create"
 * button opens the manual creation overlay (no mutation, no send).
 *
 * DS: Content pillar accent = brand-iris (#A855F7). Mirrors SeoRecommendationsQueue's
 * card/states, re-skinned iris + a Content badge, and embeddable in the Copilot layout.
 *
 * @see apps/dashboard/src/components/seo/SeoRecommendationsQueue.tsx (reference)
 * @see /docs/skills/PRAVADO_DESIGN_SKILL.md
 */

import {
  Lightning,
  WarningCircle,
  Warning,
  CheckCircle,
  Plus,
  ArrowRight,
} from '@phosphor-icons/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { ActionItem, Priority } from '@/components/command-center/types';

interface ActionStreamPayload {
  generated_at: string;
  items: ActionItem[];
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string; code?: string; httpStatus: number }
  | { status: 'no_org' }
  | { status: 'ready'; data: ActionStreamPayload };

// Ordered highest-urgency first. Sections render only when they hold real items.
const PRIORITY_ORDER: Priority[] = ['critical', 'high', 'medium', 'low'];

const PRIORITY_SECTION: Record<Priority, { label: string; heading: string }> = {
  critical: { label: 'Critical', heading: 'Critical — Act This Week' },
  high: { label: 'High', heading: 'High — Act This Month' },
  medium: { label: 'Medium', heading: 'Medium — Act This Quarter' },
  low: { label: 'Low', heading: 'Low — Backlog' },
};

const sectionHeadingColor: Record<Priority, string> = {
  critical: 'text-semantic-danger',
  high: 'text-semantic-warning',
  medium: 'text-brand-iris',
  low: 'text-white/45',
};

const priorityBadge: Record<Priority, string> = {
  critical:
    'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20',
  high: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20',
  medium: 'bg-brand-iris/10 text-brand-iris border-brand-iris/30',
  low: 'bg-white/5 text-white/70 border-white/20',
};

const cardBorder: Record<Priority, string> = {
  critical: 'border-semantic-danger/25',
  high: 'border-semantic-warning/25',
  medium: 'border-border-subtle',
  low: 'border-border-subtle',
};

const signalTone: Record<string, string> = {
  positive: 'text-semantic-success',
  neutral: 'text-white/70',
  warning: 'text-semantic-warning',
  critical: 'text-semantic-danger',
};

function PriorityIcon({ kind }: { kind: Priority }) {
  if (kind === 'critical') {
    return (
      <WarningCircle
        size={18}
        weight="fill"
        className="text-semantic-danger shrink-0"
      />
    );
  }
  if (kind === 'high') {
    return (
      <Warning
        size={18}
        weight="fill"
        className="text-semantic-warning shrink-0"
      />
    );
  }
  return null;
}

function ProposalCard({ item }: { item: ActionItem }) {
  const router = useRouter();
  const priority = item.priority;

  // Wave-2 loop visibility: honestly surface an already-executed proposal's outcome.
  const outcome = item.outcome;

  return (
    <article
      className={`bg-slate-1 border ${cardBorder[priority]} rounded-xl p-5 mb-3`}
    >
      {/* Header: title + badges */}
      <div className="flex items-start gap-3">
        <PriorityIcon kind={priority} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-semibold text-white/90 leading-snug">
              {item.title}
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-iris/15 text-brand-iris border-brand-iris/30">
              Content
            </span>
            <span
              className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${priorityBadge[priority]}`}
            >
              {PRIORITY_SECTION[priority].label}
            </span>
          </div>
        </div>
      </div>

      {/* Why — the real proposal rationale */}
      {item.why && (
        <div className="bg-white/[0.03] border border-border-subtle rounded-lg p-3 mt-3">
          <p className="text-sm text-white/85 leading-relaxed">{item.why}</p>
        </div>
      )}

      {/* Signals — real impact / confidence / priority from the proposal */}
      {item.signals.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap mt-3">
          {item.signals.map((sig) => (
            <div key={sig.label} className="flex items-baseline gap-1.5">
              <span className="text-xs font-semibold text-white/55 uppercase tracking-wide">
                {sig.label}
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  signalTone[sig.tone] ?? 'text-white/70'
                }`}
              >
                {sig.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Recommended next step — real proposal field */}
      {item.recommended_next_step && (
        <p className="text-[13px] text-white/70 leading-relaxed mt-3">
          <span className="text-white/50">Recommended: </span>
          {item.recommended_next_step}
        </p>
      )}

      {/* Outcome (executed proposals) — honest, never shown as a win unless verified */}
      {outcome && (
        <div className="flex items-center gap-2 mt-3">
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

      {/* Footer CTA — navigation only (read-only slice) */}
      <div className="flex items-center gap-3 mt-4">
        <button
          type="button"
          onClick={() =>
            item.deep_link?.href ? router.push(item.deep_link.href) : undefined
          }
          disabled={!item.deep_link?.href}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand-iris text-white/95 rounded-lg hover:bg-brand-iris/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_16px_rgba(168,85,247,0.15)] transition-all duration-150"
        >
          {item.cta?.primary || item.deep_link?.label || 'Open in Content'}
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>
    </article>
  );
}

function QueueHeader({
  count,
  updatedLabel,
  showSeeAll,
  onViewAllProposals,
  onCreateManual,
}: {
  count: number | null;
  updatedLabel?: string | null;
  showSeeAll?: boolean;
  onViewAllProposals?: () => void;
  onCreateManual?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Lightning className="w-4 h-4 text-brand-iris" weight="fill" />
        <span className="text-sm font-semibold text-white/90">
          SAGE Action Queue
        </span>
        {count !== null && (
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-brand-iris/20 text-brand-iris border border-brand-iris/30">
            {count}
          </span>
        )}
        {updatedLabel && (
          <span className="text-xs text-white/45">Updated {updatedLabel}</span>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        {showSeeAll && (
          <button
            type="button"
            onClick={onViewAllProposals}
            className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
          >
            See all →
          </button>
        )}
        {onCreateManual && (
          <button
            type="button"
            onClick={onCreateManual}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-brand-iris text-white/95 rounded-lg hover:bg-brand-iris/90 shadow-[0_0_14px_rgba(168,85,247,0.35)] transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" weight="regular" />
            Create
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="space-y-3"
      aria-busy="true"
      aria-label="Loading recommendations"
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-slate-1 border border-border-subtle rounded-xl p-5 animate-pulse"
        >
          <div className="h-4 w-2/3 bg-white/10 rounded mb-4" />
          <div className="h-16 w-full bg-white/[0.05] rounded-lg mb-3" />
          <div className="flex gap-4">
            <div className="h-3 w-20 bg-white/10 rounded" />
            <div className="h-3 w-20 bg-white/10 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({
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
            Couldn&rsquo;t load content recommendations
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

function EmptyState({ noOrg }: { noOrg?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CheckCircle
        className="w-8 h-8 text-brand-iris/40 mb-3"
        weight="duotone"
      />
      <h3 className="text-sm font-semibold text-white/90">
        {noOrg
          ? 'Finish setting up your workspace'
          : 'No content recommendations right now'}
      </h3>
      <p className="text-[13px] text-white/40 mt-1 max-w-sm leading-relaxed">
        {noOrg
          ? 'SAGE surfaces content recommendations once your workspace is connected to an organization.'
          : 'SAGE will surface prioritized content actions here as it processes your visibility signals. A quiet queue is expected for a new brand.'}
      </p>
    </div>
  );
}

export function ContentSageQueue({
  onViewAllProposals,
  onCreateManual,
}: {
  onViewAllProposals?: () => void;
  onCreateManual?: () => void;
}) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/content/recommendations', {
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
                `Recommendations request failed (${res.status})`,
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

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') {
    return (
      <div>
        <QueueHeader count={null} onCreateManual={onCreateManual} />
        <LoadingSkeleton />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div>
        <QueueHeader count={null} onCreateManual={onCreateManual} />
        <ErrorState
          message={state.message}
          code={state.code}
          httpStatus={state.httpStatus}
        />
      </div>
    );
  }

  if (state.status === 'no_org') {
    return (
      <div>
        <QueueHeader count={null} onCreateManual={onCreateManual} />
        <EmptyState noOrg />
      </div>
    );
  }

  const { items, generated_at } = state.data;
  const total = items.length;
  const updatedLabel = (() => {
    const d = new Date(generated_at);
    return Number.isNaN(d.getTime())
      ? null
      : d.toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
  })();

  return (
    <div>
      <QueueHeader
        count={total}
        updatedLabel={updatedLabel}
        showSeeAll={total > 3}
        onViewAllProposals={onViewAllProposals}
        onCreateManual={onCreateManual}
      />

      {total === 0 ? (
        <EmptyState />
      ) : (
        PRIORITY_ORDER.map((priority) => {
          const sectionItems = items.filter((i) => i.priority === priority);
          if (sectionItems.length === 0) return null;
          return (
            <section key={priority} className="mb-6">
              <h2
                className={`text-xs font-bold uppercase tracking-wider mb-3 ${sectionHeadingColor[priority]}`}
              >
                {PRIORITY_SECTION[priority].heading}
              </h2>
              {sectionItems.map((item) => (
                <ProposalCard key={item.id} item={item} />
              ))}
            </section>
          );
        })
      )}
    </div>
  );
}
