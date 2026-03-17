'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const LEGAL_NAV = [
  { href: '/legal/terms', label: 'Terms of Service' },
  { href: '/legal/privacy', label: 'Privacy Policy' },
  { href: '/legal/cookies', label: 'Cookie Policy' },
  { href: '/legal/acceptable-use', label: 'Acceptable Use' },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0A0A0F' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(168, 85, 247, 0.08) 0%, transparent 60%)',
        }}
      />
      <div className="relative max-w-6xl mx-auto px-4 py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: '#7A7A8A' }}
          >
            <svg
              width="16"
              height="16"
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
            Back to app
          </Link>
          <span
            className="text-lg font-bold"
            style={{
              background: 'linear-gradient(135deg, #A855F7, #00D9FF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Pravado
          </span>
        </div>

        <div className="flex gap-8">
          {/* Sidebar nav */}
          <aside className="hidden md:block w-52 shrink-0">
            <nav className="sticky top-8 space-y-1">
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: '#3D3D4A' }}
              >
                Legal
              </p>
              {LEGAL_NAV.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === link.href ? 'text-white font-medium' : ''
                  }`}
                  style={{
                    color:
                      pathname === link.href ? '#FFFFFF' : '#7A7A8A',
                    backgroundColor:
                      pathname === link.href
                        ? 'rgba(255,255,255,0.06)'
                        : 'transparent',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main
            className="flex-1 min-w-0 rounded-2xl border p-8 md:p-12"
            style={{
              backgroundColor: '#13131A',
              borderColor: '#1F1F28',
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
