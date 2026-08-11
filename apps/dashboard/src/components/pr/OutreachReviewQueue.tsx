'use client';

/**
 * OutreachReviewQueue — the human approve/reject gate before a real PR send. DS v3.1.
 *
 * PR pillar accent: brand-magenta.
 *
 * HONEST DATA: reads /api/pr/reviews (pending queue). Each card renders the EXACT
 * composed subject and body that would be sent — verbatim, in a scrollable full-text
 * view — so the human reviews the real text, not a summary. Approve routes through the
 * backend's guarded send chokepoint (all CAN-SPAM governors run); the card reflects the
 * real send outcome. Reject removes the pitch from the queue.
 *
 * An empty queue is the expected honest state: no reviews exist until real outreach
 * egress is provisioned. That is correct, not a bug.
 *
 * Authorization is the backend's decision. Approve/reject may return a real 403 for a
 * non-owner/admin caller — that is surfaced verbatim, never faked client-side.
 *
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

import {
  ShieldCheck,
  WarningCircle,
  EnvelopeSimple,
  CheckCircle,
  XCircle,
  UserCircle,
  PaperPlaneTilt,
  Prohibit,
} from '@phosphor-icons/react';
import { useState } from 'react';

import {
  useOutreachReviews,
  ReviewMutationError,
  type OutreachReview,
  type SendOutcome,
} from '@/hooks/useOutreachReviews';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** The recipient linkage the review carries (name is not present on the row). */
function recipientLabel(review: OutreachReview): { label: string; id: string } {
  if (review.journalist_id) {
    return { label: 'Journalist', id: review.journalist_id };
  }
  if (review.recipient_contact_id) {
    return { label: 'Contact', id: review.recipient_contact_id };
  }
  return { label: 'Recipient', id: 'unlinked' };
}

/** Honest description of the guarded-send outcome (never fabricated). */
function sendOutcomeCopy(outcome: SendOutcome): {
  tone: 'success' | 'info' | 'danger';
  text: string;
} {
  switch (outcome) {
    case 'success':
      return {
        tone: 'success',
        text: 'Approved — sent through the guarded pipeline.',
      };
    case 'governed_complete':
      return {
        tone: 'info',
        text: 'Approved — the guarded pipeline governed this send (a CAN-SPAM governor held or suppressed it). No message left ungoverned.',
      };
    case 'failure':
    default:
      return {
        tone: 'danger',
        text: 'Approved, but the guarded send did not complete. Nothing was sent.',
      };
  }
}

type Notice = { kind: 'success' | 'info' | 'danger'; text: string } | null;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function OutreachReviewQueue() {
  const { reviews, isLoading, error, actioningId, approve, reject } =
    useOutreachReviews();

  // Global banner for a completed action (row leaves the queue once actioned).
  const [notice, setNotice] = useState<Notice>(null);
  // Per-card error (e.g. a 403 "requires owner/admin"), keyed by review id.
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  function clearCardError(id: string) {
    setCardErrors((prev) => {
      if (!(id in prev)) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function handleApprove(review: OutreachReview) {
    clearCardError(review.id);
    setNotice(null);
    try {
      const result = await approve(review.id);
      const copy = sendOutcomeCopy(result.send.result);
      setNotice({ kind: copy.tone, text: copy.text });
    } catch (err) {
      const message =
        err instanceof ReviewMutationError && err.status === 403
          ? 'Approving requires owner/admin.'
          : err instanceof Error
            ? err.message
            : 'Could not approve this pitch.';
      setCardErrors((prev) => ({ ...prev, [review.id]: message }));
    }
  }

  async function handleReject(review: OutreachReview) {
    clearCardError(review.id);
    setNotice(null);
    try {
      await reject(review.id);
      setNotice({
        kind: 'info',
        text: 'Pitch rejected — removed from the review queue. Nothing was sent.',
      });
    } catch (err) {
      const message =
        err instanceof ReviewMutationError && err.status === 403
          ? 'Rejecting requires owner/admin.'
          : err instanceof Error
            ? err.message
            : 'Could not reject this pitch.';
      setCardErrors((prev) => ({ ...prev, [review.id]: message }));
    }
  }

  const pendingCount = reviews.length;

  return (
    <div className="relative">
      {/* Header — makes clear this is the human gate before a real send */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-white/95 tracking-tight">
            Outreach Review
          </h2>
          <p className="text-[13px] text-white/55 mt-0.5 leading-relaxed max-w-2xl">
            The human gate before any real send. Each pitch below is held until
            you approve it — approval sends the exact text shown through the
            guarded delivery pipeline; rejection discards it.
          </p>
        </div>
        {!isLoading && !error && pendingCount > 0 && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Completed-action banner (row has left the queue) */}
      {notice && (
        <div
          className={`mb-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 ${
            notice.kind === 'success'
              ? 'bg-semantic-success/10 border-semantic-success/20'
              : notice.kind === 'danger'
                ? 'bg-semantic-danger/10 border-semantic-danger/20'
                : 'bg-brand-magenta/10 border-brand-magenta/25'
          }`}
        >
          {notice.kind === 'success' ? (
            <CheckCircle
              size={18}
              weight="fill"
              className="text-semantic-success shrink-0 mt-0.5"
            />
          ) : notice.kind === 'danger' ? (
            <WarningCircle
              size={18}
              weight="fill"
              className="text-semantic-danger shrink-0 mt-0.5"
            />
          ) : (
            <ShieldCheck
              size={18}
              weight="fill"
              className="text-brand-magenta shrink-0 mt-0.5"
            />
          )}
          <p className="text-[13px] text-white/85 leading-relaxed">
            {notice.text}
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-panel border border-border-subtle rounded-xl p-5 space-y-3"
            >
              <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-64 bg-white/5 rounded animate-pulse" />
              <div className="h-24 w-full bg-white/5 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Error — honest, surfaces the real status/message, no fake fallback */}
      {!isLoading && error && (
        <div className="bg-panel border border-semantic-danger/20 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <WarningCircle
            size={26}
            className="text-semantic-danger mb-3"
            weight="fill"
          />
          <p className="text-sm text-white/85 leading-relaxed max-w-md">
            Couldn&rsquo;t load the review queue.
          </p>
          <p className="text-[13px] text-white/50 leading-relaxed max-w-md mt-1">
            {error instanceof ReviewMutationError && error.status === 403
              ? error.message
              : error instanceof Error
                ? error.message
                : 'Please try again shortly.'}
          </p>
        </div>
      )}

      {/* Empty — no reviews exist until real outreach egress is provisioned */}
      {!isLoading && !error && reviews.length === 0 && (
        <div className="bg-panel border border-border-subtle rounded-xl p-10 flex flex-col items-center justify-center text-center">
          <EnvelopeSimple
            size={28}
            className="text-white/25 mb-3"
            weight="fill"
          />
          <p className="text-sm text-white/85 leading-relaxed max-w-md">
            No pitches pending review.
          </p>
          <p className="text-[13px] text-white/55 leading-relaxed max-w-md mt-1.5">
            When outreach composes a pitch, it is held here for a human to
            approve before anything is sent. Nothing is queued until real
            outreach egress is provisioned.
          </p>
        </div>
      )}

      {/* Pending review cards */}
      {!isLoading && !error && reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => {
            const recipient = recipientLabel(review);
            const busy = actioningId === review.id;
            const cardError = cardErrors[review.id];
            return (
              <div
                key={review.id}
                className="bg-slate-1 border border-border-subtle border-l-4 border-l-brand-magenta rounded-xl shadow-elev-1"
              >
                {/* Card head — recipient + created time */}
                <div className="flex items-start justify-between gap-4 px-5 pt-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <UserCircle
                        size={16}
                        weight="fill"
                        className="text-brand-magenta/80 shrink-0"
                      />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/55">
                        {recipient.label}
                      </span>
                    </div>
                    <p className="text-sm text-white/85 font-mono mt-1 break-all">
                      {recipient.id}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs text-white/50 whitespace-nowrap">
                      {formatDateTime(review.created_at)}
                    </span>
                    <p className="text-[11px] text-white/35 mt-0.5">
                      Held for review
                    </p>
                  </div>
                </div>

                {/* Composed subject — verbatim */}
                <div className="px-5 mt-4">
                  <p className="text-xs font-semibold text-white/55 uppercase tracking-wide mb-1">
                    Subject
                  </p>
                  <p className="text-sm text-white/90 leading-snug bg-slate-3 border border-border-subtle rounded-lg px-3 py-2 break-words">
                    {review.composed_subject || (
                      <span className="text-white/40 italic">
                        (no subject composed)
                      </span>
                    )}
                  </p>
                </div>

                {/* Composed body — VERBATIM, full text, scrollable (never truncated) */}
                <div className="px-5 mt-3">
                  <p className="text-xs font-semibold text-white/55 uppercase tracking-wide mb-1">
                    Body — exact text that would send
                  </p>
                  <div className="max-h-72 overflow-y-auto outreach-review-scroll bg-slate-3 border border-border-subtle rounded-lg px-3 py-2.5">
                    <pre className="text-[13px] text-white/85 leading-relaxed whitespace-pre-wrap break-words font-sans">
                      {review.composed_body || '(no body composed)'}
                    </pre>
                  </div>
                </div>

                {/* Per-card error (e.g. real 403 requires owner/admin) */}
                {cardError && (
                  <div className="mx-5 mt-3 flex items-start gap-2 rounded-lg border border-semantic-danger/20 bg-semantic-danger/10 px-3 py-2">
                    <Prohibit
                      size={15}
                      weight="fill"
                      className="text-semantic-danger shrink-0 mt-0.5"
                    />
                    <p className="text-[13px] text-white/85 leading-relaxed">
                      {cardError}
                    </p>
                  </div>
                )}

                {/* Actions — Approve / Reject */}
                <div className="flex items-center justify-end gap-2 px-5 py-4 mt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleReject(review)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={16} weight="regular" />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleApprove(review)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-brand-magenta text-white/95 rounded-lg hover:bg-brand-magenta/90 shadow-[0_0_16px_rgba(217,70,239,0.25)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PaperPlaneTilt size={16} weight="fill" />
                    {busy ? 'Working…' : 'Approve & Send'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx global>{`
        .outreach-review-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .outreach-review-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .outreach-review-scroll::-webkit-scrollbar-thumb {
          background: #1f1f28;
          border-radius: 2px;
        }
        .outreach-review-scroll::-webkit-scrollbar-thumb:hover {
          background: #2a2a35;
        }
      `}</style>
    </div>
  );
}
