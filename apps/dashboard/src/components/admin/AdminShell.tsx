'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const ADMIN_NAV = [
  { label: 'Overview', href: '/app/admin' },
  { label: 'Platform', href: '/app/admin/platform' },
  { label: 'Beta', href: '/app/admin/beta' },
  { label: 'Users', href: '/app/admin/users' },
  { label: 'Billing', href: '/app/admin/billing' },
  { label: 'Intelligence', href: '/app/admin/intelligence' },
  { label: 'Logs', href: '/app/admin/logs' },
];

interface AdminShellProps {
  children: ReactNode;
  userEmail: string;
}

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen" style={{ background: '#0A0A0F' }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col shrink-0" style={{ background: '#13131A', borderRight: '1px solid #1F1F28' }}>
        {/* Logo area */}
        <div className="h-14 flex items-center gap-2 px-4" style={{ borderBottom: '1px solid #1F1F28' }}>
          <span className="text-sm font-bold text-white/90">Pravado</span>
          <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-semantic-danger/20 text-semantic-danger">
            Admin
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {ADMIN_NAV.map(item => {
            const active = item.href === '/app/admin'
              ? pathname === '/app/admin'
              : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-white/8 text-white'
                    : 'text-white/45 hover:text-white/75 hover:bg-white/4'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user info */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid #1F1F28' }}>
          <p className="text-[11px] text-white/30 truncate">{userEmail}</p>
          <Link href="/app/command-center" className="text-[11px] text-brand-cyan hover:text-brand-cyan/80 mt-1 block">
            &larr; Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
