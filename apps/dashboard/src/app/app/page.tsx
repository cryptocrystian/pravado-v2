/**
 * Main app dashboard page
 * Styled according to Pravado Design System v2
 */

import { getCurrentUser } from '@/lib/getCurrentUser';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

// Stats card icons
const icons = {
  pr: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  content: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  seo: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default async function AppPage() {
  const session = await getCurrentUser();

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white-0 mb-2">Dashboard</h2>
          <p className="text-muted">
            Welcome to {session?.activeOrg?.name}
          </p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* PR Coverage Card */}
          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">PR Coverage</p>
                <p className="text-2xl font-bold text-white-0 mt-1">0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-iris/10 flex items-center justify-center text-brand-iris">
                {icons.pr}
              </div>
            </div>
            <p className="text-xs text-slate-6 mt-4">Coming in future sprints</p>
          </div>

          {/* Content Pieces Card */}
          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Content Pieces</p>
                <p className="text-2xl font-bold text-white-0 mt-1">0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                {icons.content}
              </div>
            </div>
            <p className="text-xs text-slate-6 mt-4">Coming in future sprints</p>
          </div>

          {/* SEO Score Card */}
          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">SEO Score</p>
                <p className="text-2xl font-bold text-white-0 mt-1">-</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-magenta/10 flex items-center justify-center text-brand-magenta">
                {icons.seo}
              </div>
            </div>
            <p className="text-xs text-slate-6 mt-4">Coming in future sprints</p>
          </div>
        </div>

        {/* Sprint Progress */}
        <div className="panel-card p-6">
          <h3 className="text-lg font-semibold text-white-0 mb-6">
            Sprint Progress
          </h3>
          <div className="space-y-6">
            {/* Sprint S1 - Complete */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white-0">
                  Sprint S1 - Foundation
                </span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-semantic-success">
                  {icons.check}
                  Complete
                </span>
              </div>
              <div className="w-full bg-slate-4 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-md ease-standard"
                  style={{
                    width: '100%',
                    background: 'var(--semantic-success)'
                  }}
                />
              </div>
              <ul className="mt-3 ml-4 text-xs text-slate-6 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-semantic-success">{icons.check}</span>
                  User authentication with Supabase
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-semantic-success">{icons.check}</span>
                  Organization management
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-semantic-success">{icons.check}</span>
                  Protected routes and middleware
                </li>
              </ul>
            </div>

            {/* Sprint S2 - In Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white-0">
                  Sprint S2 - Team Collaboration
                </span>
                <span className="flex items-center gap-1.5 text-sm font-medium text-brand-cyan">
                  {icons.clock}
                  In Progress
                </span>
              </div>
              <div className="w-full bg-slate-4 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-md ease-standard"
                  style={{
                    width: '75%',
                    background: 'var(--brand-cyan)'
                  }}
                />
              </div>
              <ul className="mt-3 ml-4 text-xs text-slate-6 space-y-1.5">
                <li className="flex items-center gap-2">
                  <span className="text-semantic-success">{icons.check}</span>
                  App shell with sidebar navigation
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-semantic-success">{icons.check}</span>
                  Email invite delivery system
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-amber">{icons.clock}</span>
                  Team management page
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-brand-amber">{icons.clock}</span>
                  Invite acceptance flow
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
