/**
 * Main App Dashboard - UX-Pilot Spec Implementation (Sprint S90)
 *
 * AI-First Intelligence Dashboard with:
 * - Top Intelligence Strip (KPIs with real-time data)
 * - AI Narrative Panel (Daily summary, trending insights)
 * - Cross-Pillar Intelligence Cards
 * - Recent Activity Stream with AI summaries
 *
 * Design System: Pravado DS v2
 */

import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/getCurrentUser';
import DashboardClient from './DashboardClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Loading skeleton for dashboard
function DashboardSkeleton() {
  return (
    <div className="p-8 animate-pulse">
      <div className="max-w-7xl mx-auto">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-64 bg-slate-4 rounded-lg mb-2" />
          <div className="h-4 w-96 bg-slate-5 rounded" />
        </div>

        {/* Intelligence Strip skeleton */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="panel-card p-4">
              <div className="h-4 w-20 bg-slate-5 rounded mb-2" />
              <div className="h-8 w-16 bg-slate-4 rounded" />
            </div>
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="panel-card p-6 h-64 mb-6" />
            <div className="grid grid-cols-2 gap-4">
              <div className="panel-card p-6 h-48" />
              <div className="panel-card p-6 h-48" />
            </div>
          </div>
          <div className="col-span-4">
            <div className="panel-card p-6 h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function AppPage() {
  const session = await getCurrentUser();
  const userName = session?.user?.fullName?.split(' ')[0] || 'there';

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient userName={userName} />
    </Suspense>
  );
}
