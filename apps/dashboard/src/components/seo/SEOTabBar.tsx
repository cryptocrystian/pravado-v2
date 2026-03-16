'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Overview', href: '/app/seo' },
  { label: 'Topics', href: '/app/seo/topics' },
  { label: 'Competitors', href: '/app/seo/competitors' },
  { label: 'Citations', href: '/app/seo/citations' },
  { label: 'Recommendations', href: '/app/seo/recommendations' },
];

export function SEOTabBar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === '/app/seo') return pathname === '/app/seo';
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
