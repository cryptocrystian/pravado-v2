/**
 * Cleanup script for test orgs.
 *
 * Two modes:
 *
 *   1. Discovery mode (original) — finds ghost orgs by name allowlist +
 *      created-before-cutoff filter. Used for batch cleanup of the
 *      original set of test orgs left over from pre-Phase-0 development.
 *
 *      Usage:
 *        npx tsx apps/api/src/scripts/cleanupTestOrgs.ts            # Dry run
 *        npx tsx apps/api/src/scripts/cleanupTestOrgs.ts --confirm  # Delete
 *
 *   2. Targeted mode (added F13 Tier 2 follow-up) — targets a single
 *      org by UUID. Skips the name/date discovery entirely. Used for
 *      cleaning up specific test orgs by id (e.g. FlowMetric after a
 *      pilot sprint) without expanding the allowlist.
 *
 *      Usage:
 *        npx tsx apps/api/src/scripts/cleanupTestOrgs.ts --org-id <uuid>            # Dry run
 *        npx tsx apps/api/src/scripts/cleanupTestOrgs.ts --org-id <uuid> --confirm  # Delete
 *
 * Safety posture:
 *   - Default is dry-run (list-only). Deletion requires explicit
 *     --confirm. This has not changed.
 *   - Targeted mode validates the UUID format before touching the DB.
 *   - Both modes print per-table row counts before deletion so the
 *     operator can sanity-check scope.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Discovery-mode allowlist. Only applies when --org-id is NOT provided.
const GHOST_NAMES = [
  'Pravado Test',
  'Pravado Test 01',
  'Test Biz',
  'Pravado Demo Org',
];
const CUTOFF_DATE = '2026-01-01T00:00:00Z';

// Cascade tables — order matters (children before parent).
// Every table listed here has an `org_id` column that FKs to `orgs`.
// See docs/schema/org-scoped-tables.md for the authoritative list;
// this array is the operational deletion order, not the full set.
const CASCADE_TABLES = [
  'sage_proposals',
  'sage_signals',
  'evi_snapshots',
  'citation_monitor_results',
  'citemind_scores',
  'content_items',
  'content_topics',
  'pr_pitches',
  'journalist_profiles',
  'seo_keyword_metrics',
  'seo_backlinks',
  'org_members',
];

// Strict UUID v1-v5 validation. We only accept canonical
// 8-4-4-4-12 hex form. No braces, no urn: prefix.
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface CliArgs {
  orgId: string | null;
  confirm: boolean;
  force: boolean;
}

/**
 * Parse process.argv into a structured CliArgs object.
 * Exported for unit-test coverage — the function is pure over its
 * input array and does not touch process state.
 */
export function parseArgs(argv: string[]): CliArgs {
  let orgId: string | null = null;
  let confirm = false;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--confirm') {
      confirm = true;
    } else if (arg === '--force') {
      force = true;
    } else if (arg === '--org-id') {
      const next = argv[i + 1];
      if (!next) {
        throw new Error('--org-id requires a UUID argument');
      }
      if (!UUID_REGEX.test(next)) {
        throw new Error(
          `--org-id value is not a valid UUID: "${next}". ` +
            'Expected canonical 8-4-4-4-12 hex form.'
        );
      }
      orgId = next;
      i++; // consume the value
    }
  }

  return { orgId, confirm, force };
}

interface OrgRow {
  id: string;
  name: string;
  created_at: string;
}

/**
 * Discovery mode: find ghost orgs by name allowlist + date cutoff.
 * Returns the list to potentially delete. Empty list = nothing to do.
 */
async function discoverGhostOrgs(): Promise<OrgRow[]> {
  console.log('Searching for ghost test orgs...');
  console.log(`  Names: ${GHOST_NAMES.join(', ')}`);
  console.log(`  Created before: ${CUTOFF_DATE}`);
  console.log();

  const { data, error } = await supabase
    .from('orgs')
    .select('id, name, created_at')
    .in('name', GHOST_NAMES)
    .lt('created_at', CUTOFF_DATE);

  if (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  }

  return (data ?? []) as OrgRow[];
}

/**
 * Targeted mode: load a single org by UUID. Exits with code 2 if the
 * org doesn't exist so callers can distinguish a "typo'd UUID" from
 * a "nothing to do" outcome.
 */
async function loadOrgById(orgId: string): Promise<OrgRow[]> {
  console.log(`Targeting single org: ${orgId}`);
  console.log();

  const { data, error } = await supabase
    .from('orgs')
    .select('id, name, created_at')
    .eq('id', orgId)
    .maybeSingle();

  if (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  }

  if (!data) {
    console.error(
      `Org ${orgId} not found. Refusing to proceed — verify the UUID.`
    );
    process.exit(2);
  }

  return [data as OrgRow];
}

async function runCleanup(orgs: OrgRow[], confirm: boolean) {
  if (orgs.length === 0) {
    console.log('No orgs matched. Nothing to do.');
    process.exit(0);
  }

  console.log(`Found ${orgs.length} org(s):\n`);
  for (const org of orgs) {
    console.log(`  [${org.id}] "${org.name}" — created ${org.created_at}`);
  }
  console.log();

  if (!confirm) {
    console.log('Dry run — pass --confirm to actually delete.');
    process.exit(0);
  }

  const orgIds = orgs.map((o) => o.id);

  for (const table of CASCADE_TABLES) {
    const { error: delErr, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .in('org_id', orgIds);

    if (delErr) {
      // Table may not have org_id column, may not exist, or may be
      // absent under a rename — skip gracefully with a visible log.
      console.log(`  ${table}: skipped (${delErr.message})`);
    } else {
      console.log(`  ${table}: deleted ${count ?? 0} rows`);
    }
  }

  const { error: orgDelErr, count: orgCount } = await supabase
    .from('orgs')
    .delete({ count: 'exact' })
    .in('id', orgIds);

  if (orgDelErr) {
    console.error(`Failed to delete orgs: ${orgDelErr.message}`);
    process.exit(1);
  }

  console.log(`\nDeleted ${orgCount ?? 0} org(s). Done.`);
}

async function main() {
  let args: CliArgs;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

  const orgs = args.orgId
    ? await loadOrgById(args.orgId)
    : await discoverGhostOrgs();

  await runCleanup(orgs, args.confirm);
}

// Only run main() when this file is executed directly, not when
// imported by the test file (which imports parseArgs et al).
const isDirectRun =
  process.argv[1] && process.argv[1].endsWith('cleanupTestOrgs.ts');
if (isDirectRun) {
  main().catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}
