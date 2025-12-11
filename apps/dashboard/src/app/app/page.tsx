/**
 * Main app dashboard page
 * Styled according to Pravado Design System v2
 */

import Link from 'next/link';
import { getCurrentUser } from '@/lib/getCurrentUser';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

// Icons
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
  playbook: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  team: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
};

export default async function AppPage() {
  const session = await getCurrentUser();
  const userName = session?.user?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-muted">
            Here&apos;s what&apos;s happening with your marketing efforts.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* PR Coverage Card */}
          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Media Mentions</p>
                <p className="text-2xl font-bold text-white mt-1">0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-iris/10 flex items-center justify-center text-brand-iris">
                {icons.pr}
              </div>
            </div>
            <p className="text-xs text-slate-6 mt-4">This month</p>
          </div>

          {/* Content Pieces Card */}
          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Content Published</p>
                <p className="text-2xl font-bold text-white mt-1">0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 flex items-center justify-center text-brand-cyan">
                {icons.content}
              </div>
            </div>
            <p className="text-xs text-slate-6 mt-4">This month</p>
          </div>

          {/* Active Playbooks Card */}
          <div className="panel-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Active Playbooks</p>
                <p className="text-2xl font-bold text-white mt-1">0</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-brand-magenta/10 flex items-center justify-center text-brand-magenta">
                {icons.playbook}
              </div>
            </div>
            <p className="text-xs text-slate-6 mt-4">Running now</p>
          </div>
        </div>

        {/* Getting Started Section */}
        <div className="panel-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-6">
            Get Started with Pravado
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* PR Card */}
            <Link
              href="/app/pr"
              className="group p-4 rounded-xl border border-border-subtle hover:border-brand-iris/50 hover:bg-slate-3/50 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-iris/10 flex items-center justify-center text-brand-iris shrink-0">
                  {icons.pr}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white group-hover:text-brand-iris transition-colors">
                    PR & Media Relations
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    Build relationships with journalists and get media coverage.
                  </p>
                </div>
                <span className="text-muted group-hover:text-brand-iris transition-colors">
                  {icons.arrow}
                </span>
              </div>
            </Link>

            {/* Content Card */}
            <Link
              href="/app/content"
              className="group p-4 rounded-xl border border-border-subtle hover:border-brand-cyan/50 hover:bg-slate-3/50 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan shrink-0">
                  {icons.content}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white group-hover:text-brand-cyan transition-colors">
                    Content Marketing
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    Create and manage your content strategy with AI assistance.
                  </p>
                </div>
                <span className="text-muted group-hover:text-brand-cyan transition-colors">
                  {icons.arrow}
                </span>
              </div>
            </Link>

            {/* SEO Card */}
            <Link
              href="/app/seo"
              className="group p-4 rounded-xl border border-border-subtle hover:border-brand-magenta/50 hover:bg-slate-3/50 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-magenta/10 flex items-center justify-center text-brand-magenta shrink-0">
                  {icons.seo}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white group-hover:text-brand-magenta transition-colors">
                    SEO Optimization
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    Improve your search rankings and organic visibility.
                  </p>
                </div>
                <span className="text-muted group-hover:text-brand-magenta transition-colors">
                  {icons.arrow}
                </span>
              </div>
            </Link>

            {/* Playbooks Card */}
            <Link
              href="/app/playbooks"
              className="group p-4 rounded-xl border border-border-subtle hover:border-brand-teal/50 hover:bg-slate-3/50 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-teal/10 flex items-center justify-center text-brand-teal shrink-0">
                  {icons.playbook}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white group-hover:text-brand-teal transition-colors">
                    AI Playbooks
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    Automate your marketing workflows with intelligent playbooks.
                  </p>
                </div>
                <span className="text-muted group-hover:text-brand-teal transition-colors">
                  {icons.arrow}
                </span>
              </div>
            </Link>

            {/* Team Card */}
            <Link
              href="/app/team"
              className="group p-4 rounded-xl border border-border-subtle hover:border-brand-amber/50 hover:bg-slate-3/50 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-amber/10 flex items-center justify-center text-brand-amber shrink-0">
                  {icons.team}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white group-hover:text-brand-amber transition-colors">
                    Team Management
                  </h3>
                  <p className="text-sm text-muted mt-1">
                    Invite team members and manage collaboration.
                  </p>
                </div>
                <span className="text-muted group-hover:text-brand-amber transition-colors">
                  {icons.arrow}
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity - Empty State */}
        <div className="panel-card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Recent Activity
          </h2>
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-3 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-white font-medium mb-2">No activity yet</h3>
            <p className="text-muted text-sm max-w-sm mx-auto">
              Start by exploring the features above. Your recent actions will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
