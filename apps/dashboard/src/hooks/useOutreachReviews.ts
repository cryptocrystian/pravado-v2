'use client';

/**
 * useOutreachReviews — the PR outreach review-queue data hook.
 *
 * Wraps the honest proxy at /api/pr/reviews (pending queue) plus the owner/admin-gated
 * approve/reject mutations. Every call goes through the dashboard proxy, never the backend
 * directly. Errors are surfaced verbatim (a 403 from approve/reject carries the backend's
 * "requires owner/admin" message) — authorization is the backend's decision, never faked
 * here.
 *
 * An empty queue is the expected honest state: no reviews exist until real outreach egress
 * is provisioned. That is correct, not a bug.
 */

import { useCallback, useState } from 'react';
import useSWR from 'swr';

// ---------------------------------------------------------------------------
// Shapes (mirror the backend pr_pitch_reviews row + approve response)
// ---------------------------------------------------------------------------

export interface OutreachReview {
  id: string;
  org_id: string;
  proposal_id: string;
  recipient_contact_id: string | null;
  journalist_id: string | null;
  composed_subject: string;
  composed_body: string;
  composed_hash: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Real send outcome from the guarded pipeline (never fabricated). */
export type SendOutcome = 'governed_complete' | 'success' | 'failure';

export interface ApproveResult {
  review: OutreachReview;
  send: { result: SendOutcome; detail: Record<string, unknown> };
}

interface ReviewsPayload {
  items: OutreachReview[];
}

/** A mutation error that preserves the backend HTTP status (e.g. 403 for non-admin). */
export class ReviewMutationError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ReviewMutationError';
    this.status = status;
    this.code = code;
  }
}

async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ReviewMutationError(
      json?.error?.message ?? `Request failed (${res.status})`,
      res.status,
      json?.error?.code
    );
  }
  return json.data as T;
}

async function postAction<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'POST' });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new ReviewMutationError(
      json?.error?.message ?? `Request failed (${res.status})`,
      res.status,
      json?.error?.code
    );
  }
  return json.data as T;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseOutreachReviews {
  reviews: OutreachReview[];
  isLoading: boolean;
  error: ReviewMutationError | Error | null;
  /** id currently mutating (approve/reject), or null. */
  actioningId: string | null;
  /** Approve a review → runs the guarded send. Resolves with the real send outcome. */
  approve: (id: string) => Promise<ApproveResult>;
  /** Reject a review → removes it from the pending queue. */
  reject: (id: string) => Promise<OutreachReview>;
  /** Re-fetch the pending queue. */
  refresh: () => void;
}

export function useOutreachReviews(): UseOutreachReviews {
  const { data, error, isLoading, mutate } = useSWR<ReviewsPayload>(
    '/api/pr/reviews',
    jsonFetcher,
    { revalidateOnFocus: false }
  );

  const [actioningId, setActioningId] = useState<string | null>(null);

  const approve = useCallback(
    async (id: string): Promise<ApproveResult> => {
      setActioningId(id);
      try {
        const result = await postAction<ApproveResult>(
          `/api/pr/reviews/${encodeURIComponent(id)}/approve`
        );
        // Approved rows leave the pending queue — re-fetch the honest list.
        await mutate();
        return result;
      } finally {
        setActioningId(null);
      }
    },
    [mutate]
  );

  const reject = useCallback(
    async (id: string): Promise<OutreachReview> => {
      setActioningId(id);
      try {
        const result = await postAction<{ review: OutreachReview }>(
          `/api/pr/reviews/${encodeURIComponent(id)}/reject`
        );
        await mutate();
        return result.review;
      } finally {
        setActioningId(null);
      }
    },
    [mutate]
  );

  return {
    reviews: data?.items ?? [],
    isLoading,
    error: (error as ReviewMutationError | Error | undefined) ?? null,
    actioningId,
    approve,
    reject,
    refresh: () => {
      void mutate();
    },
  };
}
