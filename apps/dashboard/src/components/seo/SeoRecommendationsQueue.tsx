'use client';

/**
 * SeoRecommendationsQueue — real SAGE recommendations for the SEO pillar.
 *
 * HONEST DATA: self-fetches the dashboard proxy /api/seo/recommendations, which
 * forwards to the real SAGE action-stream (`/api/v1/sage/action-stream?pillar=seo`).
 * Every field rendered comes straight from a real `sage_proposals` row mapped to the
 * ActionItem shape — nothing is fabricated.
 *
 * THREE HONEST STATES:
 *  - loading  → skeleton, no fake numbers
 *  - error    → surfaces the real upstream status/message (no fake-data fallback)
 *  - empty    → "No SEO recommendations right now" (correct for a new org with no
 *               signals — this is not a bug). A 403 NO_ORG is shown as an honest
 *               org-setup empty state.
 *
 * READ-ONLY for this slice: the primary CTA navigates to the proposal's real
 * `deep_link` (where the user actually acts). We deliberately do NOT fire the
 * `execute`/`approve` PATCH from this surface — executing a proposal runs the real
 * CRAFT executor (which can reach governed send paths) and is out of scope here.
 */

import {
  WarningCircle,
  Warning,
  Info,
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

const PRIORITY_SECTION: Record<
  Priority,
  { label: string; heading: string; icon: 'danger' | 'warning' | 'info' | null }
> = {
  critical: {
    label: 'Critical',
    heading: 'Critical — Act This Week',
    icon: 'danger',
  },
  high: {
    label: 'High',
    heading: 'High — Act This Month',
    icon: 'warning',
  },
  medium: {
    label: 'Medium',
    heading: 'Medium — Act This Quarter',
    icon: null,
  },
  low: {
    label: 'Low',
    heading: 'Low — Backlog',
    icon: null,
  },
};

const sectionHeadingColor: Record<Priority, string> = {
  critical: 'text-semantic-danger',
  high: 'text-semantic-warning',
  medium: 'text-brand-cyan',
  low: 'text-white/45',
};

const priorityBadge: Record<Priority, string> = {
  critical:
    'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20',
  high: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20',
  medium: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30',
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

function PriorityIcon({
  kind,
}: {
  kind: 'danger' | 'warning' | 'info' | null;
}) {
  if (kind === 'danger') {
    return (
      <WarningCircle
        size={18}
        weight="fill"
        className="text-semantic-danger shrink-0"
      />
    );
  }
  if (kind === 'warning') {
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

function RecommendationCard({ item }: { item: ActionItem }) {
  const router = useRouter();
  const priority = item.priority;
  const iconKind = PRIORITY_SECTION[priority].icon;

  // Wave-2 loop visibility: honestly surface an already-executed proposal's outcome.
  const outcome = item.outcome;

  return (
    <article
      className={`bg-slate-1 border ${cardBorder[priority]} rounded-xl p-5 mb-3`}
    >
      {/* Header: title + badges */}
      <div className="flex items-start gap-3">
        {iconKind && <PriorityIcon kind={iconKind} />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-semibold text-white/90 leading-snug">
              {item.title}
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30">
              SEO
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

      {/* Signals — real EVI impact / confidence / priority from the proposal */}
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
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-brand-cyan text-page rounded-lg hover:bg-brand-cyan/90 shadow-[0_0_16px_rgba(0,217,255,0.15)] transition-all duration-150"
        >
          {item.cta?.primary || item.deep_link?.label || 'Open in SEO'}
          <ArrowRight size={14} weight="bold" />
        </button>
      </div>
    </article>
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
            Couldn&rsquo;t load SEO recommendations
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
    <div className="flex flex-col items-center justify-center text-center py-20">
      <Info size={40} className="text-brand-cyan opacity-50 mb-4" />
      <h3 className="text-xl font-semibold text-white/90 mb-2">
        {noOrg
          ? 'Finish setting up your workspace'
          : 'No SEO recommendations right now'}
      </h3>
      <p className="text-sm text-white/60 max-w-md leading-relaxed">
        {noOrg
          ? 'SAGE surfaces SEO recommendations once your workspace is connected to an organization.'
          : 'SAGE will surface prioritized SEO actions here as it processes your visibility signals. A quiet queue is expected for a new brand.'}
      </p>
    </div>
  );
}

export function SeoRecommendationsQueue() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/seo/recommendations', {
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white/95 tracking-tight">
            SAGE Recommendations
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Prioritized SEO actions from your visibility signals.
          </p>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white/95 tracking-tight">
            SAGE Recommendations
          </h1>
        </div>
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white/95 tracking-tight">
            SAGE Recommendations
          </h1>
        </div>
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
      {/* Header — counts derived from real data, never hardcoded */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-white/95 tracking-tight">
            SAGE Recommendations
          </h1>
          {updatedLabel && (
            <span className="text-xs text-white/50">
              Updated {updatedLabel}
            </span>
          )}
        </div>
        <p className="text-sm text-white/60 mt-1">
          {total === 0
            ? 'Prioritized SEO actions from your visibility signals.'
            : `${total} SEO ${total === 1 ? 'action' : 'actions'} identified from your SAGE signals.`}
        </p>
      </div>

      {total === 0 ? (
        <EmptyState />
      ) : (
        PRIORITY_ORDER.map((priority) => {
          const sectionItems = items.filter((i) => i.priority === priority);
          if (sectionItems.length === 0) return null;
          return (
            <section key={priority} className="mb-8">
              <h2
                className={`text-xs font-bold uppercase tracking-wider mb-4 ${sectionHeadingColor[priority]}`}
              >
                {PRIORITY_SECTION[priority].heading}
              </h2>
              {sectionItems.map((item) => (
                <RecommendationCard key={item.id} item={item} />
              ))}
            </section>
          );
        })
      )}

      <p className="text-[13px] text-white/45 italic mt-8">
        Impact estimates come from SAGE&rsquo;s analysis of your visibility
        signals. Actual results vary with content quality, distribution, and the
        competitive landscape.
      </p>
    </div>
  );
}
