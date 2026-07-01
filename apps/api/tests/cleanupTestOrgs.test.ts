/**
 * cleanupTestOrgs — CLI parser + ownership assertion tests
 * (F13 Tier 2 follow-up).
 *
 * Focused coverage:
 *
 *   1. parseArgs — verifies the flag parser accepts a valid UUID via
 *      --org-id, rejects a malformed value with a helpful error, and
 *      preserves the no-flag path so the original discovery-mode
 *      invocation still works.
 *
 *   2. assertSingleOwner — verifies the ownership guard proceeds on
 *      a single-owner org, refuses to proceed on unowned or multi-
 *      owner orgs, and honors --force.
 *
 * Not covered here: full runCleanup DELETE cascade. That path
 * requires either a real DB or a full mock of every table in
 * CASCADE_TABLES; integration coverage of the delete path is more
 * valuable when done against a staging DB and is deferred to the
 * post-merge cleanup run (which will exercise the entire pipeline
 * end-to-end against a real org).
 *
 * Env-var + createClient side effects at module import are guarded
 * by process.env setup + a vi.mock of @supabase/supabase-js so the
 * module loads without a live Supabase connection.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Set env vars via vi.hoisted so they land BEFORE the target module's
// top-level env check runs. Plain `process.env.X = ...` assignments
// above the imports get sorted after the imports by vitest's hoisting
// pass, which triggers the guard at cleanupTestOrgs.ts:37.
vi.hoisted(() => {
  process.env.SUPABASE_URL = 'https://mock.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    // Placeholder — the module-level client is replaced per-test via
    // the `client` parameter on the exported functions we care about.
    from: vi.fn(),
    auth: { admin: { getUserById: vi.fn() } },
  })),
}));

import { parseArgs, assertSingleOwner } from '../src/scripts/cleanupTestOrgs';

// ---------------------------------------------------------------------------
// parseArgs
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('returns defaults for empty argv (preserves discovery-mode entrypoint)', () => {
    expect(parseArgs([])).toEqual({
      orgId: null,
      confirm: false,
      force: false,
    });
  });

  it('accepts --confirm alone (original discovery-mode confirm path)', () => {
    expect(parseArgs(['--confirm'])).toEqual({
      orgId: null,
      confirm: true,
      force: false,
    });
  });

  it('accepts --org-id with a valid canonical UUID', () => {
    const args = parseArgs([
      '--org-id',
      '4672f68e-5b2b-40f9-935c-c34a342ad1c2',
    ]);
    expect(args.orgId).toBe('4672f68e-5b2b-40f9-935c-c34a342ad1c2');
    expect(args.confirm).toBe(false);
    expect(args.force).toBe(false);
  });

  it('accepts --org-id --confirm --force in any order', () => {
    const orgId = '4672f68e-5b2b-40f9-935c-c34a342ad1c2';
    expect(parseArgs(['--force', '--org-id', orgId, '--confirm'])).toEqual({
      orgId,
      confirm: true,
      force: true,
    });
    expect(parseArgs(['--confirm', '--org-id', orgId, '--force'])).toEqual({
      orgId,
      confirm: true,
      force: true,
    });
  });

  it('rejects --org-id with no value', () => {
    expect(() => parseArgs(['--org-id'])).toThrow(/requires a UUID/i);
  });

  it('rejects --org-id with a malformed value (not enough hex)', () => {
    expect(() => parseArgs(['--org-id', 'not-a-uuid'])).toThrow(
      /not a valid UUID/i
    );
  });

  it('rejects --org-id with wrong group lengths', () => {
    expect(() =>
      parseArgs(['--org-id', '4672f68e-5b2b-40f9-935c-c34a342ad1'])
    ).toThrow(/not a valid UUID/i);
  });

  it('rejects --org-id with braces (non-canonical form)', () => {
    expect(() =>
      parseArgs(['--org-id', '{4672f68e-5b2b-40f9-935c-c34a342ad1c2}'])
    ).toThrow(/not a valid UUID/i);
  });

  it('ignores unknown flags without throwing (discovery-mode compat)', () => {
    expect(parseArgs(['--unknown', '--confirm'])).toEqual({
      orgId: null,
      confirm: true,
      force: false,
    });
  });
});

// ---------------------------------------------------------------------------
// assertSingleOwner
// ---------------------------------------------------------------------------

function makeClient(memberships: Array<{ user_id: string }>) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: memberships,
            error: null,
          }),
        })),
      })),
    })),
    auth: {
      admin: {
        getUserById: vi.fn(async (id: string) => ({
          data: {
            user: {
              email: `user-${id.slice(0, 8)}@example.com`,
            },
          },
          error: null,
        })),
      },
    },
  } as never;
}

function makeErrorClient(errMsg: string) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: { message: errMsg },
          }),
        })),
      })),
    })),
    auth: { admin: { getUserById: vi.fn() } },
  } as never;
}

describe('assertSingleOwner', () => {
  const ORG_ID = '4672f68e-5b2b-40f9-935c-c34a342ad1c2';
  const OWNER_ID = '65d7a131-a2e4-466b-b384-eea5aa97e878';
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // process.exit is called on the deny paths — spy so we can assert
    // without actually exiting the vitest process.
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit(${code ?? 0})`);
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('proceeds silently on a single-owner org', async () => {
    const client = makeClient([{ user_id: OWNER_ID }]);
    await expect(
      assertSingleOwner(ORG_ID, false, client)
    ).resolves.toBeUndefined();
    expect(exitSpy).not.toHaveBeenCalled();
    // Confirms the owner-email lookup fired
    expect(client.auth.admin.getUserById).toHaveBeenCalledWith(OWNER_ID);
  });

  it('exits with code 3 on an unowned org without --force', async () => {
    const client = makeClient([]);
    await expect(assertSingleOwner(ORG_ID, false, client)).rejects.toThrow(
      'process.exit(3)'
    );
  });

  it('exits with code 3 on a multi-owner org without --force', async () => {
    const client = makeClient([
      { user_id: OWNER_ID },
      { user_id: '99999999-9999-4999-8999-999999999999' },
    ]);
    await expect(assertSingleOwner(ORG_ID, false, client)).rejects.toThrow(
      'process.exit(3)'
    );
  });

  it('proceeds on unowned org when --force is passed', async () => {
    const client = makeClient([]);
    await expect(
      assertSingleOwner(ORG_ID, true, client)
    ).resolves.toBeUndefined();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('proceeds on multi-owner org when --force is passed', async () => {
    const client = makeClient([
      { user_id: OWNER_ID },
      { user_id: '99999999-9999-4999-8999-999999999999' },
    ]);
    await expect(
      assertSingleOwner(ORG_ID, true, client)
    ).resolves.toBeUndefined();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with code 3 on ownership query error without --force', async () => {
    const client = makeErrorClient('Connection refused');
    await expect(assertSingleOwner(ORG_ID, false, client)).rejects.toThrow(
      'process.exit(3)'
    );
  });

  it('proceeds on ownership query error when --force is passed', async () => {
    const client = makeErrorClient('Connection refused');
    await expect(
      assertSingleOwner(ORG_ID, true, client)
    ).resolves.toBeUndefined();
    expect(exitSpy).not.toHaveBeenCalled();
  });
});
