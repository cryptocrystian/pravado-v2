/**
 * One-time cleanup script for ghost test orgs.
 *
 * Usage:
 *   npx tsx apps/api/src/scripts/cleanupTestOrgs.ts          # Dry run — list only
 *   npx tsx apps/api/src/scripts/cleanupTestOrgs.ts --confirm # Delete ghost orgs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const GHOST_NAMES = ['Pravado Test', 'Pravado Test 01', 'Test Biz', 'Pravado Demo Org'];
const CUTOFF_DATE = '2026-01-01T00:00:00Z';

// Cascade tables — order matters (children before parent)
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

async function main() {
  const confirm = process.argv.includes('--confirm');

  console.log('Searching for ghost test orgs...');
  console.log(`  Names: ${GHOST_NAMES.join(', ')}`);
  console.log(`  Created before: ${CUTOFF_DATE}`);
  console.log();

  const { data: orgs, error } = await supabase
    .from('orgs')
    .select('id, name, created_at')
    .in('name', GHOST_NAMES)
    .lt('created_at', CUTOFF_DATE);

  if (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  }

  if (!orgs || orgs.length === 0) {
    console.log('No ghost orgs found. Nothing to do.');
    process.exit(0);
  }

  console.log(`Found ${orgs.length} ghost org(s):\n`);
  for (const org of orgs) {
    console.log(`  [${org.id}] "${org.name}" — created ${org.created_at}`);
  }
  console.log();

  if (!confirm) {
    console.log('Run with --confirm to delete these orgs and their cascade data.');
    process.exit(0);
  }

  // Delete cascade data then orgs
  const orgIds = orgs.map((o) => o.id);

  for (const table of CASCADE_TABLES) {
    const { error: delErr, count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .in('org_id', orgIds);

    if (delErr) {
      // Table may not have org_id column or may not exist — skip gracefully
      console.log(`  ${table}: skipped (${delErr.message})`);
    } else {
      console.log(`  ${table}: deleted ${count ?? 0} rows`);
    }
  }

  // Delete the orgs themselves
  const { error: orgDelErr, count: orgCount } = await supabase
    .from('orgs')
    .delete({ count: 'exact' })
    .in('id', orgIds);

  if (orgDelErr) {
    console.error(`Failed to delete orgs: ${orgDelErr.message}`);
    process.exit(1);
  }

  console.log(`\nDeleted ${orgCount ?? 0} ghost org(s). Done.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
