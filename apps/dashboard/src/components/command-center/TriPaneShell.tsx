'use client';

/**
 * TriPaneShell - Command Center Layout Container
 *
 * Implements the DS v3 tri-pane layout:
 * - Desktop: 3 columns (Action | Intelligence | Strategy)
 * - Tablet: 2 columns with collapsible panels
 * - Mobile: Single column with segmented control
 *
 * @see /docs/canon/DS_v3_PRINCIPLES.md
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

  const mobileSegments: { key: MobilePane; label: string }[] = [
    { key: 'action', label: 'Action' },
    { key: 'intelligence', label: 'Intelligence' },
    { key: 'strategy', label: 'Strategy' },
  ];

  return (
    <div className="h-full flex flex-col bg-[#0A0A0F]">
      {/* Mobile Segmented Control */}
      <div className="lg:hidden flex items-center justify-center gap-1 p-3 bg-[#13131A] border-b border-[#1F1F28]">
        {mobileSegments.map((segment) => (
          <button
            key={segment.key}
            onClick={() => setActivePane(segment.key)}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${
                activePane === segment.key
                  ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30'
                  : 'text-slate-6 hover:text-white hover:bg-slate-4/50'
              }
            `}
          >
            {segment.label}
          </button>
        ))}
      </div>

      {/* Desktop/Tablet Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane - Action Stream */}
        <div
          className={`
            hidden lg:flex flex-col border-r border-[#1F1F28] bg-[#0A0A0F]
            transition-all duration-300 ease-emphatic
            ${leftCollapsed ? 'w-12' : 'w-[340px] xl:w-[380px]'}
          `}
        >
          {leftCollapsed ? (
            <button
              onClick={() => setLeftCollapsed(false)}
              className="h-full flex items-center justify-center text-slate-6 hover:text-brand-cyan transition-colors"
              aria-label="Expand Action Stream"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F28]">
                <h2 className="text-sm font-semibold text-white">Action Stream</h2>
                <button
                  onClick={() => setLeftCollapsed(true)}
                  className="p-1 text-slate-6 hover:text-white transition-colors"
                  aria-label="Collapse Action Stream"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {actionPane}
              </div>
            </>
          )}
        </div>

        {/* Center Pane - Intelligence Canvas */}
        <div className="hidden md:flex flex-1 flex-col bg-[#0A0A0F] min-w-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F28]">
            <h2 className="text-sm font-semibold text-white">Intelligence Canvas</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {intelligencePane}
          </div>
        </div>

        {/* Right Pane - Strategy Panel */}
        <div
          className={`
            hidden lg:flex flex-col border-l border-[#1F1F28] bg-[#0A0A0F]
            transition-all duration-300 ease-emphatic
            ${rightCollapsed ? 'w-12' : 'w-[320px] xl:w-[360px]'}
          `}
        >
          {rightCollapsed ? (
            <button
              onClick={() => setRightCollapsed(false)}
              className="h-full flex items-center justify-center text-slate-6 hover:text-brand-cyan transition-colors"
              aria-label="Expand Strategy Panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#1F1F28]">
                <h2 className="text-sm font-semibold text-white">Strategy Panel</h2>
                <button
                  onClick={() => setRightCollapsed(true)}
                  className="p-1 text-slate-6 hover:text-white transition-colors"
                  aria-label="Collapse Strategy Panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {strategyPane}
              </div>
            </>
          )}
        </div>

        {/* Tablet: 2 panes (Action hidden, show Intelligence + Strategy) */}
        <div className="hidden md:hidden lg:hidden flex-1 overflow-hidden">
          {/* This would show on md breakpoint only */}
        </div>

        {/* Mobile: Single pane based on segment */}
        <div className="lg:hidden flex-1 overflow-y-auto custom-scrollbar">
          {activePane === 'action' && actionPane}
          {activePane === 'intelligence' && intelligencePane}
          {activePane === 'strategy' && strategyPane}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1F1F28;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2F2F3A;
        }
      `}</style>
    </div>
  );
}
