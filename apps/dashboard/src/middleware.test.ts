/**
 * Middleware regression suite (F37 / F37').
 *
 * Locks in the CORRECT Supabase SSR session-refresh behavior that the
 * middleware currently implements, guarding against the regression history
 * on this file:
 *   - d157497 "use getSession() instead of getUser() in server components"
 *   - 89562fe "remove ALL middleware redirects — session refresh only"
 *
 * The F37 diagnostic confirmed the middleware is already correct: `setAll`
 * mutates `request.cookies` BEFORE rebuilding the response, so a downstream
 * RSC (`getServerAccessToken`) reads the refreshed token. These tests fail
 * loudly if that pattern is ever reverted.
 */

import { NextRequest, NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Shared mock state, created before the hoisted vi.mock factory runs.
const h = vi.hoisted(() => ({
  captured: {} as {
    getAll?: () => { name: string; value: string }[];
    setAll?: (
      cookies: { name: string; value: string; options?: unknown }[]
    ) => void;
  },
  getUser: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock('@supabase/ssr', () => ({
  createServerClient: (
    _url: string,
    _key: string,
    opts: {
      cookies: {
        getAll: () => { name: string; value: string }[];
        setAll: (
          c: { name: string; value: string; options?: unknown }[]
        ) => void;
      };
    }
  ) => {
    // Capture the handlers the middleware wires up so tests can drive them.
    h.captured.getAll = opts.cookies.getAll;
    h.captured.setAll = opts.cookies.setAll;
    return { auth: { getUser: h.getUser, getSession: h.getSession } };
  },
}));

// Import AFTER the mock is registered.
import { middleware, config } from './middleware';

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
});

describe('middleware — session refresh (F37 regression guard)', () => {
  it('setAll mutates request.cookies BEFORE returning the response', async () => {
    // Simulate Supabase refreshing the token during getUser().
    h.getUser.mockImplementation(async () => {
      h.captured.setAll?.([
        { name: 'sb-kroex-auth-token', value: 'FRESH', options: { path: '/' } },
      ]);
      return { data: { user: { id: 'u1' } }, error: null };
    });

    const req = new NextRequest('https://app.pravado.io/app/team');
    req.cookies.set('sb-kroex-auth-token', 'STALE');

    const res = await middleware(req);

    // The core F37 guarantee: request cookies carry the fresh token so the
    // downstream RSC reads the refreshed value (not the stale one).
    expect(req.cookies.get('sb-kroex-auth-token')?.value).toBe('FRESH');
    // And the response returns the refreshed cookie to the browser.
    expect(res.cookies.get('sb-kroex-auth-token')?.value).toBe('FRESH');
  });

  it('uses getUser() (server-side validation), never getSession()', async () => {
    h.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    const req = new NextRequest('https://app.pravado.io/app/team');
    await middleware(req);

    expect(h.getUser).toHaveBeenCalledTimes(1);
    expect(h.getSession).not.toHaveBeenCalled();
  });

  it('returns a valid NextResponse when refresh fails (does not throw)', async () => {
    h.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'refresh failed' },
    });

    const req = new NextRequest('https://app.pravado.io/login');
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
  });

  it('redirects unauthenticated users away from /app (still a NextResponse)', async () => {
    h.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('https://app.pravado.io/app/team');
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });
});

describe('middleware — matcher config', () => {
  it('covers /app, /onboarding, and /login', () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining(['/app/:path*', '/onboarding/:path*', '/login'])
    );
  });
});
