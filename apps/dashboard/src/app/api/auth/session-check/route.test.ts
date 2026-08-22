/**
 * session-check routing tests (D041).
 *
 * Locks in the completion-gated redirect: a user with an org is sent to the
 * dashboard ONLY once onboarding is complete, otherwise into the wizard. This
 * is what stops audit-funnel users (whose org is pre-created) from skipping
 * onboarding into an unseeded Command Center, and it fails safe (treats a
 * backend hiccup as "complete") so an established user is never trapped.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  backendFetch: vi.fn(),
}));

vi.mock('@/lib/getCurrentUser', () => ({ getCurrentUser: h.getCurrentUser }));
vi.mock('@/server/backendProxy', () => ({ backendFetch: h.backendFetch }));

import { GET } from './route';

const org = { id: 'o1', name: 'Org', createdAt: '', updatedAt: '' };
const sessionWithOrg = {
  user: { id: 'u1', email: 'a@b.com', fullName: null, avatarUrl: null },
  orgs: [org],
  activeOrg: org,
};
const sessionNoOrg = { ...sessionWithOrg, orgs: [], activeOrg: null };

async function body() {
  const res = await GET();
  return { status: res.status, json: await res.json() };
}

beforeEach(() => {
  h.getCurrentUser.mockReset();
  h.backendFetch.mockReset();
});

describe('GET /api/auth/session-check', () => {
  it('401s to login when there is no session', async () => {
    h.getCurrentUser.mockResolvedValue(null);
    const { status, json } = await body();
    expect(status).toBe(401);
    expect(json.hasOrg).toBe(false);
    expect(json.redirectTo).toMatch(/^\/login/);
    expect(h.backendFetch).not.toHaveBeenCalled();
  });

  it('routes a signed-in user with NO org to onboarding (no backend call)', async () => {
    h.getCurrentUser.mockResolvedValue(sessionNoOrg);
    const { json } = await body();
    expect(json.hasOrg).toBe(false);
    expect(json.redirectTo).toBe('/onboarding/ai-intro');
    expect(h.backendFetch).not.toHaveBeenCalled();
  });

  it('routes an org that COMPLETED onboarding to the dashboard', async () => {
    h.getCurrentUser.mockResolvedValue(sessionWithOrg);
    h.backendFetch.mockResolvedValue({ completed: true });
    const { json } = await body();
    expect(json.hasOrg).toBe(true);
    expect(json.onboardingCompleted).toBe(true);
    expect(json.redirectTo).toBe('/app/command-center');
  });

  it('routes an org that has NOT completed onboarding into the wizard (the audit-funnel fix)', async () => {
    h.getCurrentUser.mockResolvedValue(sessionWithOrg);
    h.backendFetch.mockResolvedValue({ completed: false });
    const { json } = await body();
    expect(json.hasOrg).toBe(true);
    expect(json.onboardingCompleted).toBe(false);
    expect(json.redirectTo).toBe('/onboarding/ai-intro');
  });

  it('fails safe to the dashboard when the onboarding status call throws', async () => {
    h.getCurrentUser.mockResolvedValue(sessionWithOrg);
    h.backendFetch.mockRejectedValue(new Error('backend down'));
    const { json } = await body();
    expect(json.hasOrg).toBe(true);
    expect(json.onboardingCompleted).toBe(true);
    expect(json.redirectTo).toBe('/app/command-center');
  });
});
