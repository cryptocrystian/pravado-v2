/**
 * Analytics Dashboard
 * Cross-pillar performance metrics and insights
 */

import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-border-subtle bg-gradient-to-b from-slate-3/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-brand-magenta/15 ring-1 ring-brand-magenta/20">
              <svg className="w-6 h-6 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Analytics</h1>
              <p className="text-slate-10 mt-1">
                Cross-pillar performance metrics and AI-powered insights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8 max-w-7xl mx-auto">
        {/* Coming Soon Card */}
        <div className="panel-card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-magenta/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-brand-magenta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Analytics Coming Soon</h2>
          <p className="text-slate-11 max-w-md mx-auto mb-8">
            Unified analytics across PR, Content, and SEO pillars with AI-powered insights
            and performance recommendations.
          </p>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <div className="p-4 rounded-xl bg-slate-3/30 border border-border-subtle">
              <div className="text-brand-iris font-semibold mb-1">PR Metrics</div>
              <div className="text-sm text-slate-11">Coverage, sentiment, reach</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-3/30 border border-border-subtle">
              <div className="text-brand-cyan font-semibold mb-1">Content Performance</div>
              <div className="text-sm text-slate-11">Engagement, conversions</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-3/30 border border-border-subtle">
              <div className="text-brand-magenta font-semibold mb-1">SEO Impact</div>
              <div className="text-sm text-slate-11">Rankings, traffic, backlinks</div>
            </div>
          </div>

          <Link
            href="/app/command-center"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-4 text-white font-medium rounded-lg hover:bg-slate-5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
