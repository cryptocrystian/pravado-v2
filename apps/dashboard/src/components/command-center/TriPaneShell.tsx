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
 * TriPaneShell - Command Center Layout Container
 *
 * Implements the DS v3 tri-pane layout:
 * - Desktop: 3 columns (Action | Intelligence | Strategy)
 * - Tablet: 2 columns with collapsible panels
 * - Mobile: Single column with segmented control
 */

import { useState, type ReactNode } from 'react';

interface TriPaneShellProps {
  actionPane: ReactNode;
  intelligencePane: ReactNode;
  strategyPane: ReactNode;
}

type MobilePane = 'action' | 'intelligence' | 'strategy';

export function TriPaneShell({
  actionPane,
  intelligencePane,
  strategyPane,
}: TriPaneShellProps) {
  const [activePane, setActivePane] = useState<MobilePane>('action');
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const mobileSegments: { key: MobilePane; label: string; icon: ReactNode }[] = [
    {
      key: 'action',
      label: 'Action',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      key: 'intelligence',
      label: 'Intelligence',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      key: 'strategy',
      label: 'Strategy',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#050508]">
      {/* Mobile Segmented Control */}
      <div className="lg:hidden flex items-center justify-center gap-1 p-2 bg-[#0A0A0F] border-b border-[#1A1A24]">
        {mobileSegments.map((segment) => (
          <button
            key={segment.key}
            onClick={() => setActivePane(segment.key)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
              ${
                activePane === segment.key
                  ? 'bg-gradient-to-r from-brand-cyan/20 to-brand-cyan/10 text-brand-cyan border border-brand-cyan/40 shadow-[0_0_20px_rgba(0,217,255,0.15)]'
                  : 'text-white/50 hover:text-white hover:bg-[#13131A]'
              }
            `}
          >
            {segment.icon}
            {segment.label}
          </button>
        ))}
      </div>

      {/* Desktop/Tablet Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Action Stream */}
        <div
          className={`
            hidden lg:flex flex-col border-r border-[#1A1A24] bg-[#0A0A0F]
            transition-all duration-300 ease-out
            ${leftCollapsed ? 'w-12' : 'w-[320px] xl:w-[360px]'}
          `}
        >
          {leftCollapsed ? (
            <button
              onClick={() => setLeftCollapsed(false)}
              className="h-full flex items-center justify-center text-white/50 hover:text-brand-cyan transition-colors group"
              aria-label="Expand Action Stream"
            >
              <div className="flex flex-col items-center gap-3">
                <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-[10px] font-medium uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">Actions</span>
              </div>
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A24] bg-gradient-to-r from-[#0A0A0F] to-[#0D0D12]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
                  <h2 className="text-sm font-semibold text-white tracking-tight">Action Stream</h2>
                </div>
                <button
                  onClick={() => setLeftCollapsed(true)}
                  className="p-1.5 text-white/50 hover:text-white hover:bg-[#1A1A24] rounded transition-colors"
                  aria-label="Collapse Action Stream"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto cc-scrollbar">
                {actionPane}
              </div>
            </>
          )}
        </div>

        {/* Center Pane - Intelligence Canvas */}
        <div className="hidden md:flex flex-1 flex-col bg-[#050508] min-w-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A24] bg-gradient-to-r from-[#0A0A0F] to-[#0D0D12]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-iris animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
              <h2 className="text-sm font-semibold text-white tracking-tight">Intelligence Canvas</h2>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-white/50">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Live
            </div>
          </div>
          <div className="flex-1 overflow-y-auto cc-scrollbar">
            {intelligencePane}
          </div>
        </div>

        {/* Right Pane - Strategy Panel */}
        <div
          className={`
            hidden lg:flex flex-col border-l border-[#1A1A24] bg-[#0A0A0F]
            transition-all duration-300 ease-out
            ${rightCollapsed ? 'w-12' : 'w-[300px] xl:w-[340px]'}
          `}
        >
          {rightCollapsed ? (
            <button
              onClick={() => setRightCollapsed(false)}
              className="h-full flex items-center justify-center text-white/50 hover:text-brand-magenta transition-colors group"
              aria-label="Expand Strategy Panel"
            >
              <div className="flex flex-col items-center gap-3">
                <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-[10px] font-medium uppercase tracking-wider [writing-mode:vertical-lr]">Strategy</span>
              </div>
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A24] bg-gradient-to-r from-[#0D0D12] to-[#0A0A0F]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand-magenta animate-pulse shadow-[0_0_8px_rgba(232,121,249,0.6)]" />
                  <h2 className="text-sm font-semibold text-white tracking-tight">Strategy Panel</h2>
                </div>
                <button
                  onClick={() => setRightCollapsed(true)}
                  className="p-1.5 text-white/50 hover:text-white hover:bg-[#1A1A24] rounded transition-colors"
                  aria-label="Collapse Strategy Panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto cc-scrollbar">
                {strategyPane}
              </div>
            </>
          )}
        </div>

        {/* Mobile: Single pane based on segment */}
        <div className="lg:hidden md:hidden flex-1 overflow-y-auto cc-scrollbar bg-[#050508]">
          {activePane === 'action' && actionPane}
          {activePane === 'intelligence' && intelligencePane}
          {activePane === 'strategy' && strategyPane}
        </div>
      </div>

      {/* Custom scrollbar styles - DS v3 aligned */}
      <style jsx global>{`
        .cc-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .cc-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .cc-scrollbar::-webkit-scrollbar-thumb {
          background: #1A1A24;
          border-radius: 2px;
        }
        .cc-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2A2A36;
        }
      `}</style>
    </div>
  );
}
