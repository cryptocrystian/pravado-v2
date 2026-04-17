import type { ReactNode } from 'react';
import Link from 'next/link';
import { PravadoLogo } from '@/components/brand/PravadoLogo';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh', color: '#ffffff' }}>
      {/* Nav */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          background: 'rgba(10,10,15,0.7)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <Link href="/" className="flex items-center gap-2">
          <PravadoLogo iconSize={28} fontSize="18px" />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/beta"
            className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
            style={{ background: '#00D9FF', color: '#0A0A0F' }}
          >
            Get Early Access
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Content with top padding for fixed nav */}
      <main style={{ paddingTop: 72 }}>{children}</main>

      {/* Footer */}
      <footer
        className="flex flex-col sm:flex-row items-center justify-between px-6 py-8 gap-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' }}
      >
        <span className="text-xs">&copy; 2026 Pravado &middot; Saipien Labs LLC</span>
        <div className="flex items-center gap-4 text-xs">
          <Link href="/legal/terms" className="hover:text-white/60 transition-colors">Terms</Link>
          <Link href="/legal/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <Link href="/legal/cookies" className="hover:text-white/60 transition-colors">Cookies</Link>
        </div>
      </footer>
    </div>
  );
}
