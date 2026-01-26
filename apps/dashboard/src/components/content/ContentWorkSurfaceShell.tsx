'use client';

/**
 * Content Work Surface Shell
 *
 * Main container for the Content pillar work surface.
 * Implements TriPaneShell layout with Content-specific panes.
 *
 * Uses Iris accent (brand-iris / #A855F7) per DS v3.1.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useState, type ReactNode } from 'react';
import type { ContentView } from './types';

// ============================================
// TYPES
// ============================================

export interface ContentWorkSurfaceShellProps {
  /** Main content area (children) */
  children: ReactNode;
  /** Optional right rail content */
  rightRailContent?: ReactNode;
  /** Whether to show right rail */
  showRightRail?: boolean;
  /** Current active view */
  activeView: ContentView;
  /** View change handler */
  onViewChange: (view: ContentView) => void;
  /** AI status for header dot */
  aiStatus?: 'idle' | 'analyzing' | 'generating';
}

type MobilePane = 'main' | 'rail';

// ============================================
// VIEW TAB CONFIG
// ============================================

const VIEW_TABS: { key: ContentView; label: string; icon: ReactNode }[] = [
  {
    key: 'overview',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    key: 'library',
    label: 'Library',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    key: 'calendar',
    label: 'Calendar',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    key: 'insights',
    label: 'Insights',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

// ============================================
// AI DOT COMPONENT
// ============================================

function AIDot({ status = 'idle' }: { status?: 'idle' | 'analyzing' | 'generating' }) {
  const baseClasses = 'w-2 h-2 rounded-full';
  if (status === 'analyzing') {
    return <span className={`${baseClasses} bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]`} />;
  }
  if (status === 'generating') {
    return <span className={`${baseClasses} bg-brand-iris animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.6)]`} />;
  }
  return <span className={`${baseClasses} bg-brand-iris/50`} />;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentWorkSurfaceShell({
  children,
  rightRailContent,
  showRightRail = false,
  activeView,
  onViewChange,
  aiStatus = 'idle',
}: ContentWorkSurfaceShellProps) {
  const [mobilePane, setMobilePane] = useState<MobilePane>('main');
  const [rightRailCollapsed, setRightRailCollapsed] = useState(false);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col bg-[#050508]">
      {/* View Tabs Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0A0A0F] border-b border-[#1A1A24]">
        <div className="flex items-center gap-1">
          {/* Content Pillar Icon */}
          <div className="flex items-center gap-2 mr-4 pr-4 border-r border-[#1A1A24]">
            <AIDot status={aiStatus} />
            <span className="text-sm font-semibold text-white">Content</span>
          </div>

          {/* View Tabs */}
          <div className="hidden sm:flex items-center gap-1">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => onViewChange(tab.key)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
                  ${
                    activeView === tab.key
                      ? 'bg-brand-iris/15 text-brand-iris'
                      : 'text-white/50 hover:text-white hover:bg-[#13131A]'
                  }
                `}
              >
                {tab.icon}
                <span className="hidden md:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* AI Status Pill */}
        {aiStatus !== 'idle' && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-iris/10 border border-brand-iris/20">
            <AIDot status={aiStatus} />
            <span className="text-xs font-medium text-brand-iris">
              {aiStatus === 'generating' ? 'Generating...' : 'Analyzing...'}
            </span>
          </div>
        )}
      </div>

      {/* Mobile Tab Bar (for view switching) */}
      <div className="sm:hidden flex items-center justify-center gap-1 p-2 bg-[#0A0A0F] border-b border-[#1A1A24] overflow-x-auto">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onViewChange(tab.key)}
            className={`
              flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 shrink-0
              ${
                activeView === tab.key
                  ? 'bg-brand-iris/15 text-brand-iris'
                  : 'text-white/50 hover:text-white hover:bg-[#13131A]'
              }
            `}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showRightRail && !rightRailCollapsed ? 'lg:mr-0' : ''}`}>
          {children}
        </div>

        {/* Right Rail (when enabled) */}
        {showRightRail && (
          <div
            className={`
              hidden lg:flex flex-col border-l border-[#1A1A24] bg-[#0A0A0F]
              transition-all duration-300 ease-out
              ${rightRailCollapsed ? 'w-12' : 'w-[320px] xl:w-[360px]'}
            `}
          >
            {rightRailCollapsed ? (
              <button
                onClick={() => setRightRailCollapsed(false)}
                className="h-full flex items-center justify-center text-white/50 hover:text-brand-iris transition-colors group"
                aria-label="Expand Details Panel"
              >
                <div className="flex flex-col items-center gap-3">
                  <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-[11px] font-medium uppercase tracking-wider [writing-mode:vertical-lr]">Details</span>
                </div>
              </button>
            ) : (
              <>
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A24] bg-gradient-to-r from-[#0D0D12] to-[#0A0A0F]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-iris/50" />
                    <h2 className="text-sm font-semibold text-white tracking-tight">Asset Details</h2>
                  </div>
                  <button
                    onClick={() => setRightRailCollapsed(true)}
                    className="p-1.5 text-white/50 hover:text-white hover:bg-[#1A1A24] rounded transition-colors"
                    aria-label="Collapse Details Panel"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto overflow-y-auto">
                  {rightRailContent}
                </div>
              </>
            )}
          </div>
        )}

        {/* Mobile: Toggle between main and rail */}
        {showRightRail && rightRailContent && (
          <div className="lg:hidden fixed bottom-4 right-4 z-50">
            <button
              onClick={() => setMobilePane(mobilePane === 'main' ? 'rail' : 'main')}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-iris text-white rounded-full shadow-lg hover:bg-brand-iris/90 transition-colors"
            >
              {mobilePane === 'main' ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium">View Details</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm font-medium">Back to List</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
