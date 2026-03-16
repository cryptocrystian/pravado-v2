'use client';

/**
 * AnalyticsTabBar — Client-side tab navigation for analytics sub-surfaces.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Overview', href: '/app/analytics' },
  { label: 'Content', href: '/app/analytics/content' },
  { label: 'PR', href: '/app/analytics/pr' },
  { label: 'SEO', href: '/app/analytics/seo' },
  { label: 'Reports', href: '/app/analytics/reports' },
];

export function AnalyticsTabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === '/app/analytics') return pathname === '/app/analytics';
    return pathname.startsWith(href);
  }

  return (
    <div className="border-b border-white/8 px-8 bg-cc-page">
      <nav className="flex gap-6 max-w-[1600px] mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`py-3 text-sm transition-colors border-b-2 ${
                active
                  ? 'border-cc-cyan text-white font-semibold'
                  : 'border-transparent text-white/45 hover:text-white/70'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
