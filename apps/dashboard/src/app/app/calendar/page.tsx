'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * Calendar Page - Orchestration Calendar
 *
 * Stub page for full calendar surface.
 * Uses DS v3 topbar shell (CalendarLayout) - NO sidebar.
 * Full implementation will be built in a future sprint.
 *
 * @see /contracts/examples/orchestration-calendar.json
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import Link from 'next/link';

export default function CalendarPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0A0A0F] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 flex items-center justify-center bg-brand-cyan/10 rounded-lg border border-brand-cyan/20">
                <svg
                  className="w-5 h-5 text-brand-cyan"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">
                  Orchestration Calendar
                </h1>
                <p className="text-sm text-slate-6">
                  Schedule and coordinate your marketing activities
                </p>
              </div>
            </div>
          </div>
          <Link
            href="/app/command-center"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-6 hover:text-white bg-[#13131A] border border-[#1F1F28] hover:border-slate-4 rounded-lg transition-all duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Command Center
          </Link>
        </div>

        {/* Coming Soon Placeholder */}
        <div className="p-12 bg-[#13131A] border border-[#1F1F28] rounded-xl">
          <div className="max-w-md mx-auto text-center">
            {/* Illustration */}
            <div className="w-24 h-24 mx-auto mb-6 bg-brand-cyan/10 rounded-2xl flex items-center justify-center border border-brand-cyan/20">
              <svg
                className="w-12 h-12 text-brand-cyan"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-lg font-semibold text-white mb-2">
              Full Calendar Coming Soon
            </h2>
            <p className="text-sm text-slate-6 mb-6 leading-relaxed">
              The orchestration calendar will provide a comprehensive view of
              all your scheduled PR, Content, and SEO activities. Plan your
              campaigns, coordinate publishing, and track execution in one
              unified timeline.
            </p>

            {/* Feature Preview */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg">
                <div className="w-8 h-8 mx-auto mb-2 bg-brand-magenta/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-brand-magenta"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.276A1 1 0 0018 15V3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-white">PR</p>
                <p className="text-[10px] text-slate-6">Press & Outreach</p>
              </div>
              <div className="p-4 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg">
                <div className="w-8 h-8 mx-auto mb-2 bg-brand-iris/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-brand-iris"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-xs font-medium text-white">Content</p>
                <p className="text-[10px] text-slate-6">Publishing</p>
              </div>
              <div className="p-4 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg">
                <div className="w-8 h-8 mx-auto mb-2 bg-brand-cyan/10 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-brand-cyan"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-white">SEO</p>
                <p className="text-[10px] text-slate-6">Optimization</p>
              </div>
            </div>

            {/* CTA */}
            <Link
              href="/app/command-center"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-brand-cyan/10 border border-brand-cyan/30 rounded-lg hover:bg-brand-cyan/20 hover:border-brand-cyan/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.15)] transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                  clipRule="evenodd"
                />
              </svg>
              Explore Command Center
            </Link>
          </div>
        </div>

        {/* Preview Items */}
        <div className="mt-6 p-4 bg-[#13131A] border border-[#1F1F28] rounded-lg">
          <h3 className="text-xs font-semibold text-slate-6 uppercase tracking-wide mb-3">
            Preview: Upcoming Activities
          </h3>
          <div className="space-y-2 opacity-60">
            {/* Sample items */}
            {[
              { pillar: 'pr', title: 'TechCrunch Follow-up', time: '10:00', status: 'Scheduled' },
              { pillar: 'content', title: 'EVI Framework Article', time: '14:00', status: 'Drafting' },
              { pillar: 'seo', title: 'Keyword Optimization', time: '16:00', status: 'Planned' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg"
              >
                <span className="text-sm font-medium text-white w-14">
                  {item.time}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded uppercase ${
                    item.pillar === 'pr'
                      ? 'bg-brand-magenta/10 text-brand-magenta'
                      : item.pillar === 'content'
                        ? 'bg-brand-iris/10 text-brand-iris'
                        : 'bg-brand-cyan/10 text-brand-cyan'
                  }`}
                >
                  {item.pillar}
                </span>
                <span className="flex-1 text-sm text-white truncate">
                  {item.title}
                </span>
                <span className="text-xs text-slate-5">{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
