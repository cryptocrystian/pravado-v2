/**
 * PR Deliverability Page (Sprint S100)
 * Pure client rendering - data loaded via route handlers only
 *
 * INVARIANT: This page does NOT import from prDataServer.
 * All data flows through /api/pr/* route handlers.
 */

import DeliverabilityClient from './DeliverabilityClient';

// Default empty state for deliverability summary
const EMPTY_SUMMARY = {
  totalMessages: 0,
  totalSent: 0,
  totalDelivered: 0,
  totalOpened: 0,
  totalClicked: 0,
  totalBounced: 0,
  totalComplained: 0,
  totalFailed: 0,
  deliveryRate: 0,
  openRate: 0,
  clickRate: 0,
  bounceRate: 0,
};

export default function DeliverabilityPage() {
  // S100: No server-side data fetching. Client component loads via /api/pr/deliverability/*
  return (
    <DeliverabilityClient
      initialSummary={EMPTY_SUMMARY}
      initialMessages={[]}
      initialMessagesTotal={0}
      initialTopEngaged={[]}
    />
  );
}
