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
 * CommandCenterTopbar v2.1 — Phase 0 Track 0C UX hygiene pass
 *
 * AI-native, topbar-centric navigation with polished styling:
 *
 * GROUPING:
 * - Left cluster: Pravado wordmark + " / OrgName " mark (item 9 — real org name)
 * - Middle cluster: Surface navigation (prominent, with glow active states)
 * - Right cluster: AI Active indicator + user menu only
 *
 * Phase 0 Track 0C removals (audit findings):
 * - Notification bell (item 6) — was non-functional, unread dot was fabricated.
 *   Returns in Phase 1 with a real notifications endpoint.
 * - SAGE / CRAFT / CiteMind chips (item 7) — looked interactive but only
 *   toggled their own visual state. Phase 1 can bring them back as real
 *   filters if useful.
 * - "Account" menu item (item 8) — duplicated Settings (same href). Removed.
 * - "Billing" menu item (item 5) — billing page is hidden in Phase 0.
 *
 * Phase 0 Track 0C additions:
 * - Org name displayed next to logo (item 9 — prop renamed from `_orgName`).
 * - User identity fallback (item 10 — email-prefix when fullName is null;
 *   real email surfaced in dropdown; literal "User" replaced with "You" as
 *   last-resort fallback). The full Supabase metadata plumbing (wizard
 *   captures display name) is Phase 1 work — tracked separately.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 * @see /docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0C-UX-HYGIENE.md
 */

import {
  CaretDown,
  Gear,
  BookOpen,
  ChatDots,
  SignOut,
} from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

import { PravadoLogoIcon } from '@/components/brand/PravadoLogo';
import { supabase } from '@/lib/supabaseClient';

interface CommandCenterTopbarProps {
  orgName?: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
}

// Surface navigation items — canonical surfaces only (per UX_SURFACES.md)
const topbarSurfaces = [
  { name: 'Command Center', href: '/app/command-center', shortName: 'Command' },
  { name: 'PR', href: '/app/pr', shortName: 'PR' },
  { name: 'Content', href: '/app/content', shortName: 'Content' },
  { name: 'SEO', href: '/app/seo', shortName: 'SEO' },
  { name: 'Calendar', href: '/app/calendar', shortName: 'Calendar' },
  { name: 'Analytics', href: '/app/analytics', shortName: 'Analytics' },
];

// ── User Menu Dropdown ──────────────────────────────────────

function UserMenu({
  userName,
  userEmail,
  userAvatarUrl,
}: {
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Track 0C item 10: identity fallback chain. Never literal "User" —
  // that string is too ambiguous. "You" is the last-resort honest label.
  const emailPrefix = userEmail ? userEmail.split('@')[0] : null;
  const displayName = userName || emailPrefix || 'You';
  const displayEmail = userEmail ?? '';
  const avatarLetter = (displayName || 'Y').charAt(0).toUpperCase();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
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

  // Track 0C item 8: Account duplicated Settings (same href) — removed.
  // Track 0C item 5: Billing hidden in Phase 0 — removed.
  const menuItems = [
    { label: 'Settings', icon: <Gear size={16} />, href: '/app/settings' },
  ];

  const helpItems = [
    {
      label: 'Help & Docs',
      icon: <BookOpen size={16} />,
      href: 'https://docs.pravado.io',
      external: true,
    },
    {
      label: 'Send Feedback',
      icon: <ChatDots size={16} />,
      href: 'mailto:feedback@pravado.io',
      external: true,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-4 transition-colors group"
      >
        {userAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- third-party avatar URL, not a Next-managed static asset
          <img
            src={userAvatarUrl}
            alt={displayName}
            className="w-9 h-9 rounded-full ring-2 ring-border-subtle"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-iris to-brand-magenta flex items-center justify-center text-white text-xs font-bold ring-2 ring-border-subtle">
            {avatarLetter}
          </div>
        )}
        <CaretDown
          weight="regular"
          className="w-3 h-3 text-white/45 group-hover:text-white/75 hidden sm:block transition-colors"
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-2 border border-slate-4 rounded-xl shadow-elev-3 z-50 overflow-hidden">
          {/* User info — item 10: surface email so the user can verify */}
          <div className="px-4 py-3 border-b border-slate-4">
            <p className="font-medium text-white text-sm truncate">
              {displayName}
            </p>
            {displayEmail && (
              <p className="text-xs truncate" style={{ color: '#7A7A8A' }}>
                {displayEmail}
              </p>
            )}
          </div>

          {/* Main nav */}
          <div className="py-1">
            {menuItems.map((item) => (
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
            {helpItems.map((item) => (
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
  orgName,
  userName,
  userEmail,
  userAvatarUrl,
}: CommandCenterTopbarProps) {
  const pathname = usePathname();

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/app/command-center') {
      return (
        pathname === '/app/command-center' ||
        pathname?.startsWith('/app/command-center/')
      );
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 h-20 bg-slate-1/95 backdrop-blur-xl border-b border-border-subtle flex items-center px-3 gap-4">
        {/* ============================================
            LEFT CLUSTER: Logo + Org Name
            ============================================ */}
        <div className="flex items-center gap-3 flex-shrink-0 pl-2">
          {/* Pravado Wordmark + " / OrgName " */}
          <Link
            href="/app/command-center"
            className="flex items-center gap-1.5 group"
          >
            <PravadoLogoIcon size={28} />
            <span className="font-mono font-bold tracking-[0.15em] text-white text-base group-hover:opacity-90 transition-opacity">
              PRAVADO
            </span>
          </Link>
          {orgName && (
            <span className="hidden md:inline text-white/40 text-sm">
              / {orgName}
            </span>
          )}
        </div>

        {/* ============================================
            MIDDLE CLUSTER: Surface Navigation (PROMINENT)
            ============================================ */}
        <nav className="hidden md:flex items-center gap-2 flex-1 ml-8">
          {topbarSurfaces.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-4 py-2 text-lg font-semibold rounded-lg transition-all duration-200
                  ${
                    active
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
            RIGHT CLUSTER: AI Status + User Menu
            (Item 6: notification bell removed)
            (Item 7: SAGE/CRAFT/CiteMind chips removed)
            ============================================ */}
        <div className="flex items-center gap-1.5">
          {/* AI Active Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_6px_rgba(0,217,255,0.8)]" />
            <span className="text-xs font-semibold text-brand-cyan uppercase tracking-wide">
              AI Active
            </span>
          </div>

          {/* User Menu */}
          <UserMenu
            userName={userName}
            userEmail={userEmail}
            userAvatarUrl={userAvatarUrl}
          />
        </div>
      </header>
    </>
  );
}

export default CommandCenterTopbar;
