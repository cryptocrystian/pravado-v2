import type { ReactNode } from 'react';
import Link from 'next/link';
import { PravadoLogo } from '@/components/brand/PravadoLogo';

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: '#0A0A0F', color: '#ffffff', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      {/* Fixed nav */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 56, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 48px',
        background: 'rgba(6,6,10,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <PravadoLogo iconSize={28} fontSize="18px" />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/login" style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.12)',
            textDecoration: 'none',
          }}>Sign In</Link>
          <Link href="/beta" style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 14,
            fontWeight: 600, background: '#00D9FF', color: '#0A0A0F',
            textDecoration: 'none',
          }}>Get Early Access</Link>
        </div>
      </nav>

      <main style={{ paddingTop: 56 }}>{children}</main>

      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
          &copy; 2026 Pravado &middot; Saipien Labs LLC
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          {[['Terms', '/legal/terms'], ['Privacy', '/legal/privacy'], ['Cookies', '/legal/cookies']].map(([label, href]) => (
            <Link key={href} href={href} style={{
              fontSize: 13, color: 'rgba(255,255,255,0.35)',
              textDecoration: 'none',
            }}>{label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
