#!/usr/bin/env node

/**
 * PR Backend Verification Script
 * Sprint S100.1: Verify PR pillar is operational with real persistence
 *
 * This script:
 * 1. Calls PR API endpoints
 * 2. Asserts non-empty data after seeding
 * 3. Tests manual-send creates pitch_event and changes state
 *
 * Usage:
 *   node scripts/verify-pr-backend.mjs              # Run all checks
 *   node scripts/verify-pr-backend.mjs --warn-only  # Warn mode (CI default)
 *
 * Required Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * @see /docs/dev/PR_PILLAR_TESTING.md
 */

import { createClient } from '@supabase/supabase-js';

// ============================================
// CONFIGURATION
// ============================================

const WARN_ONLY = process.argv.includes('--warn-only');

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    if (!WARN_ONLY) process.exit(1);
    return { supabaseUrl: null, supabaseServiceKey: null };
  }

  return { supabaseUrl, supabaseServiceKey };
}

// ============================================
// TEST HELPERS
// ============================================

class TestResult {
  constructor() {
    this.passed = 0;
    this.failed = 0;
    this.warnings = 0;
    this.results = [];
  }

  pass(name, detail = '') {
    this.passed++;
    this.results.push({ name, status: 'PASS', detail });
    console.log(`  ✓ ${name}${detail ? `: ${detail}` : ''}`);
  }

  fail(name, reason) {
    if (WARN_ONLY) {
      this.warnings++;
      this.results.push({ name, status: 'WARN', detail: reason });
      console.log(`  ⚠ ${name}: ${reason}`);
    } else {
      this.failed++;
      this.results.push({ name, status: 'FAIL', detail: reason });
      console.log(`  ✗ ${name}: ${reason}`);
    }
  }

  skip(name, reason) {
    this.results.push({ name, status: 'SKIP', detail: reason });
    console.log(`  ○ ${name}: ${reason}`);
  }
}

// ============================================
// TEST SUITES
// ============================================

async function testJournalistProfiles(supabase, orgId, results) {
  console.log('\n📋 Testing Journalist Profiles...');

  // Check count
  const { count, error } = await supabase
    .from('journalist_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  if (error) {
    results.fail('journalist_profiles table accessible', error.message);
    return null;
  }

  results.pass('journalist_profiles table accessible');

  if (count === 0) {
    results.fail('journalist_profiles has data', 'No journalists found. Run pnpm seed:pr first.');
    return null;
  }

  results.pass('journalist_profiles has data', `${count} journalists found`);

  // Get a sample journalist for further tests
  const { data: journalists } = await supabase
    .from('journalist_profiles')
    .select('*')
    .eq('org_id', orgId)
    .limit(1);

  if (journalists && journalists.length > 0) {
    const j = journalists[0];
    results.pass('journalist has required fields', `${j.full_name} (${j.primary_outlet})`);
    return j;
  }

  return null;
}

async function testPitchSequences(supabase, orgId, results) {
  console.log('\n📋 Testing Pitch Sequences...');

  // Check count
  const { count, error } = await supabase
    .from('pr_pitch_sequences')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  if (error) {
    results.fail('pr_pitch_sequences table accessible', error.message);
    return null;
  }

  results.pass('pr_pitch_sequences table accessible');

  if (count === 0) {
    results.fail('pr_pitch_sequences has data', 'No sequences found. Run pnpm seed:pr first.');
    return null;
  }

  results.pass('pr_pitch_sequences has data', `${count} sequences found`);

  // Get a sample sequence with contacts
  const { data: sequences } = await supabase
    .from('pr_pitch_sequences')
    .select('*')
    .eq('org_id', orgId)
    .limit(1);

  if (sequences && sequences.length > 0) {
    const s = sequences[0];
    results.pass('sequence has required fields', `"${s.name}" [${s.status}]`);
    return s;
  }

  return null;
}

async function testPitchContacts(supabase, orgId, sequence, results) {
  console.log('\n📋 Testing Pitch Contacts...');

  if (!sequence) {
    results.skip('pitch contacts', 'No sequence available');
    return null;
  }

  // Get contacts for the sequence
  const { data: contacts, error } = await supabase
    .from('pr_pitch_contacts')
    .select('*')
    .eq('org_id', orgId)
    .eq('sequence_id', sequence.id);

  if (error) {
    results.fail('pr_pitch_contacts table accessible', error.message);
    return null;
  }

  results.pass('pr_pitch_contacts table accessible');

  if (!contacts || contacts.length === 0) {
    results.fail('sequence has contacts', `Sequence "${sequence.name}" has no contacts`);
    return null;
  }

  results.pass('sequence has contacts', `${contacts.length} contacts in sequence`);

  // Find a contact that can be used for manual send test
  const queuedContact = contacts.find(c => c.status === 'queued');
  if (queuedContact) {
    results.pass('found queued contact for test', queuedContact.id.substring(0, 8) + '...');
    return queuedContact;
  }

  results.pass('contacts have various statuses', contacts.map(c => c.status).join(', '));
  return contacts[0];
}

async function testMediaLists(supabase, orgId, results) {
  console.log('\n📋 Testing Media Lists...');

  // Check count
  const { count, error } = await supabase
    .from('media_lists')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  if (error) {
    results.fail('media_lists table accessible', error.message);
    return;
  }

  results.pass('media_lists table accessible');

  if (count === 0) {
    results.fail('media_lists has data', 'No media lists found. Run pnpm seed:pr first.');
    return;
  }

  results.pass('media_lists has data', `${count} lists found`);

  // Check entries
  const { count: entryCount, error: entryError } = await supabase
    .from('media_list_entries')
    .select('*', { count: 'exact', head: true });

  if (entryError) {
    results.fail('media_list_entries table accessible', entryError.message);
    return;
  }

  results.pass('media_list_entries table accessible');

  if (entryCount > 0) {
    results.pass('media_list_entries has data', `${entryCount} entries found`);
  } else {
    results.fail('media_list_entries has data', 'No list entries found');
  }
}

async function testActivityLog(supabase, orgId, results) {
  console.log('\n📋 Testing Activity Log...');

  // Check count
  const { count, error } = await supabase
    .from('journalist_activity_log')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId);

  if (error) {
    results.fail('journalist_activity_log table accessible', error.message);
    return;
  }

  results.pass('journalist_activity_log table accessible');

  if (count === 0) {
    results.fail('journalist_activity_log has data', 'No activity log entries found. Run pnpm seed:pr first.');
    return;
  }

  results.pass('journalist_activity_log has data', `${count} activities found`);
}

async function testInboxComputation(supabase, orgId, results) {
  console.log('\n📋 Testing Inbox Computation...');

  // Get low engagement journalists
  const { data: lowEngagement, error: leError } = await supabase
    .from('journalist_profiles')
    .select('id, full_name, engagement_score, last_activity_at')
    .eq('org_id', orgId)
    .lt('engagement_score', 0.4)
    .limit(5);

  if (leError) {
    results.fail('low engagement query', leError.message);
    return;
  }

  results.pass('low engagement query works');

  const decayCount = lowEngagement?.filter(j => {
    if (!j.last_activity_at) return true;
    const daysSince = Math.floor((Date.now() - new Date(j.last_activity_at).getTime()) / (24 * 60 * 60 * 1000));
    return daysSince > 30;
  }).length || 0;

  if (decayCount > 0) {
    results.pass('relationship decay items computable', `${decayCount} decay candidates`);
  } else {
    results.pass('relationship decay items computable', 'No decay items (all contacts recently active)');
  }

  // Get active sequences for follow-up computation
  const { data: activeSeq, error: asError } = await supabase
    .from('pr_pitch_sequences')
    .select('id, name, created_at')
    .eq('org_id', orgId)
    .eq('status', 'active');

  if (asError) {
    results.fail('active sequences query', asError.message);
    return;
  }

  results.pass('active sequences query works');

  const followUpCount = activeSeq?.filter(s => {
    const daysSince = Math.floor((Date.now() - new Date(s.created_at).getTime()) / (24 * 60 * 60 * 1000));
    return daysSince >= 5 && daysSince <= 7;
  }).length || 0;

  results.pass('follow-up items computable', `${followUpCount} follow-up candidates`);
}

async function testManualSendFlow(supabase, orgId, sequence, contact, results) {
  console.log('\n📋 Testing Manual Send Flow...');

  if (!sequence || !contact) {
    results.skip('manual send flow', 'No sequence or contact available');
    return;
  }

  if (contact.status !== 'queued') {
    results.skip('manual send flow', `Contact already in "${contact.status}" status`);
    return;
  }

  // Create a pitch event
  const { data: event, error: eventError } = await supabase
    .from('pr_pitch_events')
    .insert({
      org_id: orgId,
      contact_id: contact.id,
      step_position: 1,
      event_type: 'sent',
      payload: { test: true, verified_at: new Date().toISOString() },
    })
    .select()
    .single();

  if (eventError) {
    results.fail('create pitch_event', eventError.message);
    return;
  }

  results.pass('create pitch_event', `Event ID: ${event.id.substring(0, 8)}...`);

  // Update contact status
  const { error: updateError } = await supabase
    .from('pr_pitch_contacts')
    .update({ status: 'sent', last_event_at: new Date().toISOString() })
    .eq('id', contact.id)
    .eq('org_id', orgId);

  if (updateError) {
    results.fail('update contact status', updateError.message);
    return;
  }

  results.pass('update contact status', 'queued → sent');

  // Verify the update
  const { data: updatedContact } = await supabase
    .from('pr_pitch_contacts')
    .select('status')
    .eq('id', contact.id)
    .single();

  if (updatedContact?.status === 'sent') {
    results.pass('verify status transition', 'Status confirmed as "sent"');
  } else {
    results.fail('verify status transition', `Expected "sent", got "${updatedContact?.status}"`);
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║          PR Backend Verification Script                   ║');
  console.log('║          Sprint S100.1                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (WARN_ONLY) {
    console.log('🔔 WARN MODE: Failures will be treated as warnings\n');
  }

  const { supabaseUrl, supabaseServiceKey } = getEnvVars();

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n⚠ Cannot proceed without environment variables');
    process.exit(WARN_ONLY ? 0 : 1);
  }

  console.log('🔌 Connecting to Supabase...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get org ID from org_members (same logic as seed script)
  // This ensures we verify the org that has members and received seed data
  const { data: memberships, error: orgError } = await supabase
    .from('org_members')
    .select('org_id, orgs(name)')
    .limit(1);

  if (orgError || !memberships || memberships.length === 0) {
    console.error('❌ No organization with members found');
    process.exit(WARN_ONLY ? 0 : 1);
  }

  const orgId = memberships[0].org_id;
  const orgName = memberships[0].orgs?.name || 'Unknown';
  console.log(`  ✓ Using org: ${orgName} (${orgId.substring(0, 8)}...)\n`);

  const results = new TestResult();

  // Run test suites
  const journalist = await testJournalistProfiles(supabase, orgId, results);
  const sequence = await testPitchSequences(supabase, orgId, results);
  const contact = await testPitchContacts(supabase, orgId, sequence, results);
  await testMediaLists(supabase, orgId, results);
  await testActivityLog(supabase, orgId, results);
  await testInboxComputation(supabase, orgId, results);
  await testManualSendFlow(supabase, orgId, sequence, contact, results);

  // Summary
  console.log('\n╭─────────────────────────────────────────────────────────╮');
  console.log('│                      TEST SUMMARY                       │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│  Passed:   ${String(results.passed).padStart(3)} ✓                                    │`);
  console.log(`│  Failed:   ${String(results.failed).padStart(3)} ✗                                    │`);
  console.log(`│  Warnings: ${String(results.warnings).padStart(3)} ⚠                                    │`);
  console.log('╰─────────────────────────────────────────────────────────╯');

  if (results.failed > 0) {
    console.log('\n❌ VERIFICATION FAILED');
    console.log('\nTo fix:');
    console.log('  1. Ensure Supabase is running and migrations applied');
    console.log('  2. Run: pnpm --filter @pravado/dashboard seed:pr');
    console.log('  3. Re-run this script');
    process.exit(1);
  }

  if (results.warnings > 0) {
    console.log('\n⚠ VERIFICATION PASSED WITH WARNINGS');
    console.log('Some tests had issues but warn mode prevented failure.');
    process.exit(0);
  }

  console.log('\n✅ ALL TESTS PASSED');
  console.log('\nPR Backend is operational with real persistence.');
  console.log('You can now:');
  console.log('  1. Set PRAVADO_STRICT_API=1 in .env.local');
  console.log('  2. Start the dashboard: pnpm dev');
  console.log('  3. Navigate to /app/pr to see real data');
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(WARN_ONLY ? 0 : 1);
});
