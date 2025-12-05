/**
 * Executive Dashboard Layout Component (Sprint S61)
 * Three-panel layout wrapper for the executive command center
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ExecDashboardLayoutProps {
  /** Header content (filter bar, dashboard header) */
  header?: ReactNode;
  /** Left panel content (insights feed) */
  leftPanel?: ReactNode;
  /** Center panel content (KPI grid, narrative) */
  centerPanel?: ReactNode;
  /** Right panel content (dashboard selector, quick actions) */
  rightPanel?: ReactNode;
  /** Full width content below the panels */
  footer?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Custom class name */
  className?: string;
}

export function ExecDashboardLayout({
  header,
  leftPanel,
  centerPanel,
  rightPanel,
  footer,
  loading,
  className,
}: ExecDashboardLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header Section */}
      {header && (
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {header}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
              <p className="mt-4 text-gray-500">Loading executive dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Left Panel - Insights Feed (3/12 on large screens) */}
            {leftPanel && (
              <div className="col-span-12 lg:col-span-3 order-2 lg:order-1">
                {leftPanel}
              </div>
            )}

            {/* Center Panel - KPIs, Narrative (6/12 on large screens) */}
            {centerPanel && (
              <div
                className={cn(
                  'order-1 lg:order-2',
                  leftPanel && rightPanel
                    ? 'col-span-12 lg:col-span-6'
                    : leftPanel || rightPanel
                      ? 'col-span-12 lg:col-span-9'
                      : 'col-span-12'
                )}
              >
                {centerPanel}
              </div>
            )}

            {/* Right Panel - Dashboard Selector, Quick Actions (3/12 on large screens) */}
            {rightPanel && (
              <div className="col-span-12 lg:col-span-3 order-3">
                {rightPanel}
              </div>
            )}

            {/* Full Width Alternative Layout */}
            {!leftPanel && !centerPanel && !rightPanel && (
              <div className="col-span-12">
                <div className="text-center py-12 text-gray-500">
                  No content to display
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Section */}
      {footer && (
        <div className="border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple two-panel layout variant
 */
interface ExecTwoPanelLayoutProps {
  /** Main content panel */
  main?: ReactNode;
  /** Sidebar content */
  sidebar?: ReactNode;
  /** Header content */
  header?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Whether sidebar should be on the right */
  sidebarRight?: boolean;
  /** Loading state */
  loading?: boolean;
  className?: string;
}

export function ExecTwoPanelLayout({
  main,
  sidebar,
  header,
  footer,
  sidebarRight = true,
  loading,
  className,
}: ExecTwoPanelLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header Section */}
      {header && (
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {header}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
              <p className="mt-4 text-gray-500">Loading...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            {/* Main Panel */}
            <div
              className={cn(
                sidebar ? 'col-span-12 lg:col-span-8' : 'col-span-12',
                !sidebarRight && sidebar && 'lg:order-2'
              )}
            >
              {main}
            </div>

            {/* Sidebar Panel */}
            {sidebar && (
              <div
                className={cn(
                  'col-span-12 lg:col-span-4',
                  !sidebarRight && 'lg:order-1'
                )}
              >
                {sidebar}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Section */}
      {footer && (
        <div className="border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Stack layout variant for simpler views
 */
interface ExecStackLayoutProps {
  /** Array of content sections to stack */
  sections?: ReactNode[];
  /** Header content */
  header?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Gap between sections */
  gap?: 'sm' | 'md' | 'lg';
  /** Loading state */
  loading?: boolean;
  className?: string;
}

export function ExecStackLayout({
  sections = [],
  header,
  footer,
  gap = 'md',
  loading,
  className,
}: ExecStackLayoutProps) {
  const gapClass = {
    sm: 'space-y-4',
    md: 'space-y-6',
    lg: 'space-y-8',
  }[gap];

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      {/* Header Section */}
      {header && (
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {header}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
              <p className="mt-4 text-gray-500">Loading...</p>
            </div>
          </div>
        ) : (
          <div className={gapClass}>
            {sections.map((section, index) => (
              <div key={index}>{section}</div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Section */}
      {footer && (
        <div className="border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
