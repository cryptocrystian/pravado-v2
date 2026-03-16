'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Action Queue', href: '/app/pr' },
  { label: 'Journalists', href: '/app/pr/journalists' },
  { label: 'Pitches', href: '/app/pr/pitches' },
  { label: 'Coverage', href: '/app/pr/coverage' },
  { label: 'Intelligence', href: '/app/pr/intelligence' },
];

export function PRTabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === '/app/pr') return pathname === '/app/pr';
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
              className={`py-3 text-[15px] transition-colors border-b-2 ${
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
