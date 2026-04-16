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
 * CommandCenterTopbar v2.0 - UX Pilot Reference Match
 *
 * AI-native, topbar-centric navigation with polished styling:
 *
 * GROUPING (per UX Pilot):
 * - Left cluster: Pravado wordmark + AI status dot, Org selector
 * - Middle cluster: Surface navigation (prominent, with glow active states)
 * - Center-right: Omni-Tray trigger (ONLY search-like affordance)
 * - Right cluster: AI Active indicator, context chips, notifications, user menu
 *
 * NAVIGATION PROMINENCE:
 * - Nav items use text-sm font (not xs)
 * - Inactive: text-white/70 (lighter than before)
 * - Active: text-white + bg-brand-cyan/15 + border + glow + underline
 * - Consistent spacing between items
 *
 * IMPORTANT: Only ONE search-like element exists (Omni-Tray trigger).
 * Do NOT add additional search inputs.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CaretDown, Bell, Gear, User, CreditCard, BookOpen, ChatDots, SignOut } from '@phosphor-icons/react';
import { PravadoLogoIcon } from '@/components/brand/PravadoLogo';
import { supabase } from '@/lib/supabaseClient';

interface CommandCenterTopbarProps {
  orgName?: string;
  userName?: string;
  userAvatarUrl?: string;
}

// Surface navigation items — canonical surfaces only (per UX_SURFACES.md)
const surfaceNavItems = [
  { name: 'Command Center', href: '/app/command-center', shortName: 'Command' },
  { name: 'PR', href: '/app/pr', shortName: 'PR' },
  { name: 'Content', href: '/app/content', shortName: 'Content' },
  { name: 'SEO', href: '/app/seo', shortName: 'SEO' },
  { name: 'Calendar', href: '/app/calendar', shortName: 'Calendar' },
  { name: 'Analytics', href: '/app/analytics', shortName: 'Analytics' },
];

// ── User Menu Dropdown ──────────────────────────────────────

function UserMenu({ userName, userAvatarUrl }: { userName: string; userAvatarUrl?: string }) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(userName || '');
  const [displayEmail, setDisplayEmail] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        const meta = data.user.user_metadata;
        setDisplayName(
          userName ||
          meta?.full_name ||
          meta?.name ||
          data.user.email?.split('@')[0] ||
          'User'
        );
        setDisplayEmail(data.user.email || '');
      }
    });
  }, [userName]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const menuItems = [
    { label: 'Settings', icon: <Gear size={16} />, href: '/app/settings' },
    { label: 'Account', icon: <User size={16} />, href: '/app/settings' },
    { label: 'Billing', icon: <CreditCard size={16} />, href: '/app/billing' },
  ];

  const helpItems = [
    { label: 'Help & Docs', icon: <BookOpen size={16} />, href: 'https://docs.pravado.io', external: true },
    { label: 'Send Feedback', icon: <ChatDots size={16} />, href: 'mailto:feedback@pravado.io', external: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-4 transition-colors group"
      >
        {userAvatarUrl ? (
          <img src={userAvatarUrl} alt={userName} className="w-9 h-9 rounded-full ring-2 ring-border-subtle" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-iris to-brand-magenta flex items-center justify-center text-white text-xs font-bold ring-2 ring-border-subtle">
            {(displayName || 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <CaretDown weight="regular" className="w-3 h-3 text-white/45 group-hover:text-white/75 hidden sm:block transition-colors" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-2 border border-slate-4 rounded-xl shadow-elev-3 z-50 overflow-hidden">
          {/* User info */}
          <div className="px-4 py-3 border-b border-slate-4">
            <p className="font-medium text-white text-sm truncate">{displayName}</p>
            <p className="text-xs truncate" style={{color:'#7A7A8A'}}>{displayEmail}</p>
          </div>

          {/* Main nav */}
          <div className="py-1">
            {menuItems.map(item => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-slate-3 transition-colors"
              >
                <span className="text-white/40">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>

          {/* Help */}
          <div className="py-1 border-t border-slate-4">
            {helpItems.map(item => (
              <a
                key={item.label}
                href={item.href}
                target={item.external ? '_blank' : undefined}
                rel={item.external ? 'noopener noreferrer' : undefined}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-slate-3 transition-colors"
              >
                <span className="text-white/40">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </div>

          {/* Sign out */}
          <div className="py-1 border-t border-slate-4">
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-semantic-danger/80 hover:text-semantic-danger hover:bg-slate-3 transition-colors"
            >
              <SignOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Topbar ─────────────────────────────────────────────

export function CommandCenterTopbar({
  orgName: _orgName = 'Pravado Test 01',
  userName = 'User',
  userAvatarUrl,
}: CommandCenterTopbarProps) {
  const pathname = usePathname();
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set(['media-monitoring']));

  const toggleChip = (chipId: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chipId)) {
        next.delete(chipId);
      } else {
        next.add(chipId);
      }
      return next;
    });
  };

  const contextChips = [
    { id: 'media-monitoring', label: 'Media Monitoring', color: 'brand-magenta' },
    { id: 'content-quality', label: 'Content Quality', color: 'brand-iris' },
  ];

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/app/command-center') {
      return pathname === '/app/command-center' || pathname?.startsWith('/app/command-center/');
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 h-20 bg-slate-1/95 backdrop-blur-xl border-b border-border-subtle flex items-center px-3 gap-4">
        {/* ============================================
            LEFT CLUSTER: Logo + Org Selector
            ============================================ */}
        <div className="flex items-center gap-3 flex-shrink-0 pl-2">
          {/* Pravado Wordmark + AI Status */}
          <Link href="/app/command-center" className="flex items-center gap-1.5 group">
            <PravadoLogoIcon size={28} />
            <span className="font-mono font-bold tracking-[0.15em] text-white text-base group-hover:opacity-90 transition-opacity">
              PRAVADO
            </span>
          </Link>
        </div>

        {/* ============================================
            MIDDLE CLUSTER: Surface Navigation (PROMINENT)
            ============================================ */}
        <nav className="hidden md:flex items-center gap-2 flex-1 ml-8">
          {surfaceNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-4 py-2 text-lg font-semibold rounded-lg transition-all duration-200
                  ${active
                    ? 'bg-brand-cyan/10 text-white border border-brand-cyan/25 shadow-[0_0_14px_rgba(0,217,255,0.18)]'
                    : 'text-white/70 hover:text-white hover:bg-panel'
                  }
                `}
              >
                <span className="hidden lg:inline">{item.name}</span>
                <span className="lg:hidden">{item.shortName}</span>
                {/* Active underline glow */}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-brand-cyan rounded-full shadow-[0_0_8px_rgba(0,217,255,0.7)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ============================================
            RIGHT CLUSTER: AI Status + Chips + Notif + User
            ============================================ */}
        <div className="flex items-center gap-1.5">
          {/* AI Active Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_6px_rgba(0,217,255,0.8)]" />
            <span className="text-xs font-semibold text-brand-cyan uppercase tracking-wide">AI Active</span>
          </div>

          {/* Context Toggle Chips */}
          <div className="hidden xl:flex items-center gap-1">
            {contextChips.map((chip) => {
              const isChipActive = activeChips.has(chip.id);
              return (
                <button
                  key={chip.id}
                  onClick={() => toggleChip(chip.id)}
                  className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                    transition-all duration-200 border
                    ${isChipActive
                      ? chip.color === 'brand-magenta'
                        ? 'bg-brand-magenta/10 text-brand-magenta border-brand-magenta/25 shadow-[0_0_8px_rgba(232,121,249,0.15)]'
                        : 'bg-brand-iris/10 text-brand-iris border-brand-iris/25 shadow-[0_0_8px_rgba(168,85,247,0.15)]'
                      : 'bg-transparent text-white/55 border-border-subtle hover:border-slate-5 hover:text-white/80'
                    }
                  `}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isChipActive
                        ? chip.color === 'brand-magenta'
                          ? 'bg-brand-magenta'
                          : 'bg-brand-iris'
                        : 'bg-white/35'
                    }`}
                  />
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-white/55 hover:text-white hover:bg-slate-4 rounded-lg transition-colors">
            <Bell weight="regular" className="w-6 h-6" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-magenta shadow-[0_0_4px_rgba(232,121,249,0.6)]" />
          </button>

          {/* User Menu */}
          <UserMenu userName={userName} userAvatarUrl={userAvatarUrl} />
        </div>
      </header>

    </>
  );
}

export default CommandCenterTopbar;
