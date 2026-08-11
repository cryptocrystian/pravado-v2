'use client';

/**
 * PR Outreach Review — /app/pr/reviews
 *
 * The human approve/reject gate before any real PR send. Lists pending pitches with
 * their exact composed subject/body for verbatim review. Honest-empty until real
 * outreach egress is provisioned.
 */

export const dynamic = 'force-dynamic';

import { OutreachReviewQueue } from '@/components/pr/OutreachReviewQueue';

export default function PROutreachReviewPage() {
  return (
    <div className="pt-6 pb-16 px-8">
      <div className="max-w-[1100px] mx-auto">
        <OutreachReviewQueue />
      </div>
    </div>
  );
}
