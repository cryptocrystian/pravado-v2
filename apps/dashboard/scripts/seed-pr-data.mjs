#!/usr/bin/env node

/**
 * PR Pillar Seed Data Generator
 * Sprint S100.1: Generate and INSERT realistic sample data into Supabase
 *
 * Creates:
 * - 15 journalist contacts (journalist_profiles)
 * - 5 pitch sequences (pr_pitch_sequences)
 * - 10+ touches/events (journalist_activity_log)
 * - 4 media lists (media_lists with entries)
 *
 * Usage:
 *   node scripts/seed-pr-data.mjs                 # Dry run (preview only)
 *   node scripts/seed-pr-data.mjs --execute      # Actually insert data
 *   node scripts/seed-pr-data.mjs --clean        # Delete seeded data first
 *
 * Required Environment Variables:
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for admin operations
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

const DRY_RUN = !process.argv.includes('--execute');
const CLEAN_FIRST = process.argv.includes('--clean');

// Seed marker to identify seeded data for cleanup
const SEED_MARKER = 'pravado_pr_seed_v1';

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

function getEnvVars() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  if (missing.length > 0 && !DRY_RUN) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(v => console.error(`   - ${v}`));
    console.error('\nTip: Copy .env.example to .env.local and fill in the values');
    process.exit(1);
  }

  return { supabaseUrl, supabaseServiceKey };
}

// ============================================
// SAMPLE DATA TEMPLATES
// ============================================

const OUTLETS = [
  { name: 'TechCrunch', tier: 't1', type: 'blog' },
  { name: 'Wired', tier: 't1', type: 'magazine' },
  { name: 'Forbes', tier: 't1', type: 'magazine' },
  { name: 'VentureBeat', tier: 't2', type: 'blog' },
  { name: 'ZDNet', tier: 't2', type: 'blog' },
  { name: 'The Verge', tier: 't2', type: 'blog' },
  { name: 'Engadget', tier: 't2', type: 'blog' },
  { name: 'Protocol', tier: 't2', type: 'newsletter' },
  { name: 'Axios', tier: 't2', type: 'newsletter' },
  { name: 'MarTech Today', tier: 't3', type: 'blog' },
  { name: 'CMSWire', tier: 't3', type: 'blog' },
  { name: 'AdExchanger', tier: 't3', type: 'blog' },
  { name: 'Marketing Dive', tier: 't3', type: 'blog' },
  { name: 'SaaStr', tier: 'trade', type: 'blog' },
  { name: 'First Round Review', tier: 'niche', type: 'blog' },
];

const BEATS = [
  'AI & Machine Learning',
  'Enterprise SaaS',
  'Marketing Technology',
  'Startups & VC',
  'Future of Work',
  'Digital Transformation',
  'Data & Analytics',
  'E-commerce',
  'Cloud Computing',
  'B2B Marketing',
];

const FIRST_NAMES = [
  'Sarah', 'Michael', 'Emma', 'Alex', 'Jennifer', 'David', 'Rachel', 'Chris',
  'Amanda', 'Jason', 'Sophia', 'Daniel', 'Olivia', 'Ryan', 'Nicole',
];

const LAST_NAMES = [
  'Chen', 'Rodriguez', 'Wilson', 'Thompson', 'Liu', 'Park', 'Martinez', 'Kim',
  'Anderson', 'Taylor', 'Lee', 'Garcia', 'Brown', 'Davis', 'Miller',
];

// ============================================
// DATA GENERATORS
// ============================================

function generateJournalists(orgId, count = 15) {
  const journalists = [];
  const usedNames = new Set();

  for (let i = 0; i < count; i++) {
    let firstName, lastName;
    do {
      firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    } while (usedNames.has(`${firstName} ${lastName}`));
    usedNames.add(`${firstName} ${lastName}`);

    const outlet = OUTLETS[Math.floor(Math.random() * OUTLETS.length)];
    const beat = BEATS[Math.floor(Math.random() * BEATS.length)];
    const emailDomain = outlet.name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z]/g, '');

    journalists.push({
      id: randomUUID(),
      org_id: orgId,
      full_name: `${firstName} ${lastName}`,
      primary_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}.com`,
      secondary_emails: [],
      primary_outlet: outlet.name,
      beat: beat,
      twitter_handle: `@${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
      website_url: null,
      engagement_score: parseFloat((0.3 + Math.random() * 0.7).toFixed(2)),
      responsiveness_score: parseFloat((0.2 + Math.random() * 0.8).toFixed(2)),
      relevance_score: parseFloat((0.4 + Math.random() * 0.6).toFixed(2)),
      last_activity_at: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
      metadata: {
        tier: outlet.tier,
        outlet_type: outlet.type,
        verified: Math.random() > 0.2,
        seed_marker: SEED_MARKER,
      },
    });
  }

  return journalists;
}

function generatePitchSequences(orgId, userId, journalists, count = 5) {
  const sequences = [];
  const contacts = [];
  const events = [];

  const statuses = ['draft', 'active', 'completed', 'paused'];
  const subjects = [
    'AI-Powered PR Platform Launch - Exclusive Story',
    'Thought Leadership: Future of Marketing Operations',
    'New Research: B2B Marketing Trends 2026',
    'Expert Interview Request: AI in Enterprise',
    'Breaking: Major Platform Partnership Announcement',
  ];

  for (let i = 0; i < count; i++) {
    const sequenceId = randomUUID();
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const contactCount = 1 + Math.floor(Math.random() * 3);
    const createdAt = new Date(Date.now() - (14 - i * 3) * 86400000).toISOString();

    sequences.push({
      id: sequenceId,
      org_id: orgId,
      user_id: userId,
      name: subjects[i].split(' - ')[0],
      status: status,
      default_subject: subjects[i],
      default_preview_text: 'Important PR opportunity',
      settings: {
        sendWindow: { startHour: 9, endHour: 17, timezone: 'America/New_York' },
        followUpDelayDays: 3,
        maxAttempts: 3,
        excludeWeekends: true,
        seed_marker: SEED_MARKER,
      },
      created_at: createdAt,
    });

    // Assign random journalists to this sequence
    const shuffledJournalists = [...journalists].sort(() => Math.random() - 0.5);
    for (let j = 0; j < contactCount && j < shuffledJournalists.length; j++) {
      const journalist = shuffledJournalists[j];
      const contactStatuses = ['queued', 'sent', 'opened', 'replied'];
      const contactStatus = contactStatuses[Math.floor(Math.random() * contactStatuses.length)];
      const contactId = randomUUID();

      contacts.push({
        id: contactId,
        org_id: orgId,
        sequence_id: sequenceId,
        journalist_id: journalist.id,
        status: contactStatus,
        current_step_position: contactStatus === 'queued' ? 1 : 1,
        last_event_at: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000).toISOString(),
        metadata: {
          personalized_subject: `${subjects[i]} - For ${journalist.full_name}`,
          personalization_score: Math.floor(50 + Math.random() * 50),
          seed_marker: SEED_MARKER,
        },
      });

      // Create pitch events for this contact
      if (contactStatus !== 'queued') {
        events.push({
          id: randomUUID(),
          org_id: orgId,
          contact_id: contactId,
          step_position: 1,
          event_type: 'sent',
          payload: { seed_marker: SEED_MARKER },
          created_at: new Date(Date.now() - (6 + Math.floor(Math.random() * 3)) * 86400000).toISOString(),
        });

        if (contactStatus === 'opened' || contactStatus === 'replied') {
          events.push({
            id: randomUUID(),
            org_id: orgId,
            contact_id: contactId,
            step_position: 1,
            event_type: 'opened',
            payload: { seed_marker: SEED_MARKER },
            created_at: new Date(Date.now() - (3 + Math.floor(Math.random() * 2)) * 86400000).toISOString(),
          });
        }

        if (contactStatus === 'replied') {
          events.push({
            id: randomUUID(),
            org_id: orgId,
            contact_id: contactId,
            step_position: 1,
            event_type: 'replied',
            payload: { seed_marker: SEED_MARKER },
            created_at: new Date(Date.now() - Math.floor(Math.random() * 2) * 86400000).toISOString(),
          });
        }
      }
    }
  }

  return { sequences, contacts, events };
}

function generateActivityLog(orgId, journalists, count = 10) {
  const activities = [];
  const activityTypes = [
    'pitch_sent',
    'pitch_sent',
    'email_opened',
    'email_clicked',
    'email_replied',
    'coverage_published',
    'mention_detected',
  ];

  const shuffledJournalists = [...journalists].sort(() => Math.random() - 0.5);

  for (let i = 0; i < count && i < shuffledJournalists.length * 2; i++) {
    const journalist = shuffledJournalists[i % shuffledJournalists.length];
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];

    activities.push({
      id: randomUUID(),
      org_id: orgId,
      journalist_id: journalist.id,
      activity_type: activityType,
      source_system: 'pr_pillar_seed',
      source_id: null,
      activity_data: {
        seed_marker: SEED_MARKER,
        details: `Seeded ${activityType} activity`,
      },
      sentiment: activityType === 'coverage_published' ? 'positive' : null,
      occurred_at: new Date(Date.now() - Math.floor(Math.random() * 14) * 86400000).toISOString(),
      metadata: { seed_marker: SEED_MARKER },
    });
  }

  return activities;
}

function generateMediaLists(orgId, userId, journalists, count = 4) {
  const lists = [];
  const entries = [];

  const topics = [
    { name: 'AI Tech Reporters', topic: 'artificial intelligence', keywords: ['AI', 'machine learning', 'automation'] },
    { name: 'SaaS Enterprise Writers', topic: 'enterprise software', keywords: ['SaaS', 'B2B', 'enterprise'] },
    { name: 'Marketing Tech Experts', topic: 'marketing technology', keywords: ['martech', 'marketing automation', 'CRM'] },
    { name: 'Startup & VC Journalists', topic: 'venture capital', keywords: ['startups', 'funding', 'VC'] },
  ];

  for (let i = 0; i < count && i < topics.length; i++) {
    const topic = topics[i];
    const listId = randomUUID();

    lists.push({
      id: listId,
      org_id: orgId,
      name: topic.name,
      description: `Curated list of journalists covering ${topic.topic}`,
      input_topic: topic.topic,
      input_keywords: topic.keywords,
      input_market: 'US',
      input_geography: 'North America',
      input_product: 'Pravado',
      created_by: userId,
    });

    // Add 3-5 journalists to each list
    const listJournalists = journalists
      .filter(j => j.beat.toLowerCase().includes(topic.keywords[0].toLowerCase()) ||
                   j.beat.toLowerCase().includes(topic.topic.split(' ')[0].toLowerCase()))
      .slice(0, 3 + Math.floor(Math.random() * 3));

    // If not enough matches, add random journalists
    if (listJournalists.length < 3) {
      const remaining = journalists.filter(j => !listJournalists.includes(j)).slice(0, 3 - listJournalists.length);
      listJournalists.push(...remaining);
    }

    listJournalists.forEach((journalist, idx) => {
      const fitScore = 0.6 + Math.random() * 0.4;
      const tiers = ['A', 'B', 'C', 'D'];
      const tierIdx = fitScore > 0.85 ? 0 : fitScore > 0.7 ? 1 : fitScore > 0.55 ? 2 : 3;

      entries.push({
        id: randomUUID(),
        list_id: listId,
        journalist_id: journalist.id,
        fit_score: parseFloat(fitScore.toFixed(2)),
        tier: tiers[tierIdx],
        reason: `Covers ${topic.topic} at ${journalist.primary_outlet}`,
        fit_breakdown: {
          beat_match: 0.3 + Math.random() * 0.7,
          outlet_tier: journalist.metadata.tier === 't1' ? 1 : journalist.metadata.tier === 't2' ? 0.7 : 0.5,
          engagement: journalist.engagement_score,
          seed_marker: SEED_MARKER,
        },
        position: idx + 1,
      });
    });
  }

  return { lists, entries };
}

// ============================================
// DATABASE OPERATIONS
// ============================================

async function cleanSeedData(supabase, orgId) {
  console.log('\n🧹 Cleaning existing seed data...');

  // Clean in reverse dependency order
  // 1. pr_pitch_events (depends on pr_pitch_contacts)
  const { error: eventsErr } = await supabase
    .from('pr_pitch_events')
    .delete()
    .eq('org_id', orgId)
    .contains('payload', { seed_marker: SEED_MARKER });
  if (eventsErr) console.warn('  Warning cleaning events:', eventsErr.message);
  else console.log('  ✓ Cleaned pr_pitch_events');

  // 2. pr_pitch_contacts (depends on pr_pitch_sequences, journalists)
  const { error: contactsErr } = await supabase
    .from('pr_pitch_contacts')
    .delete()
    .eq('org_id', orgId)
    .contains('metadata', { seed_marker: SEED_MARKER });
  if (contactsErr) console.warn('  Warning cleaning contacts:', contactsErr.message);
  else console.log('  ✓ Cleaned pr_pitch_contacts');

  // 3. pr_pitch_sequences
  const { error: seqErr } = await supabase
    .from('pr_pitch_sequences')
    .delete()
    .eq('org_id', orgId)
    .contains('settings', { seed_marker: SEED_MARKER });
  if (seqErr) console.warn('  Warning cleaning sequences:', seqErr.message);
  else console.log('  ✓ Cleaned pr_pitch_sequences');

  // 4. media_list_entries (depends on media_lists, journalist_profiles)
  const { error: entriesErr } = await supabase
    .from('media_list_entries')
    .delete()
    .contains('fit_breakdown', { seed_marker: SEED_MARKER });
  if (entriesErr) console.warn('  Warning cleaning list entries:', entriesErr.message);
  else console.log('  ✓ Cleaned media_list_entries');

  // 5. media_lists
  const { data: seedLists } = await supabase
    .from('media_lists')
    .select('id')
    .eq('org_id', orgId)
    .like('description', '%Curated list of journalists%');
  if (seedLists && seedLists.length > 0) {
    const { error: listsErr } = await supabase
      .from('media_lists')
      .delete()
      .in('id', seedLists.map(l => l.id));
    if (listsErr) console.warn('  Warning cleaning lists:', listsErr.message);
    else console.log('  ✓ Cleaned media_lists');
  }

  // 6. journalist_activity_log
  const { error: activityErr } = await supabase
    .from('journalist_activity_log')
    .delete()
    .eq('org_id', orgId)
    .contains('metadata', { seed_marker: SEED_MARKER });
  if (activityErr) console.warn('  Warning cleaning activity log:', activityErr.message);
  else console.log('  ✓ Cleaned journalist_activity_log');

  // 7. journalist_profiles (last, as others depend on it)
  const { error: journalistErr } = await supabase
    .from('journalist_profiles')
    .delete()
    .eq('org_id', orgId)
    .contains('metadata', { seed_marker: SEED_MARKER });
  if (journalistErr) console.warn('  Warning cleaning journalists:', journalistErr.message);
  else console.log('  ✓ Cleaned journalist_profiles');

  console.log('✅ Seed data cleanup complete\n');
}

async function insertSeedData(supabase, data) {
  console.log('\n📝 Inserting seed data...');

  // Insert in dependency order
  // 1. journalist_profiles
  console.log(`  Inserting ${data.journalists.length} journalists...`);
  const { error: journalistErr } = await supabase
    .from('journalist_profiles')
    .upsert(data.journalists, { onConflict: 'org_id,primary_email' });
  if (journalistErr) throw new Error(`Failed to insert journalists: ${journalistErr.message}`);
  console.log('  ✓ Journalists inserted');

  // 2. pr_pitch_sequences
  console.log(`  Inserting ${data.sequences.length} pitch sequences...`);
  const { error: seqErr } = await supabase
    .from('pr_pitch_sequences')
    .upsert(data.sequences, { onConflict: 'id' });
  if (seqErr) throw new Error(`Failed to insert sequences: ${seqErr.message}`);
  console.log('  ✓ Pitch sequences inserted');

  // 3. pr_pitch_contacts
  console.log(`  Inserting ${data.contacts.length} pitch contacts...`);
  const { error: contactsErr } = await supabase
    .from('pr_pitch_contacts')
    .upsert(data.contacts, { onConflict: 'sequence_id,journalist_id' });
  if (contactsErr) throw new Error(`Failed to insert contacts: ${contactsErr.message}`);
  console.log('  ✓ Pitch contacts inserted');

  // 4. pr_pitch_events
  console.log(`  Inserting ${data.events.length} pitch events...`);
  const { error: eventsErr } = await supabase
    .from('pr_pitch_events')
    .upsert(data.events, { onConflict: 'id' });
  if (eventsErr) throw new Error(`Failed to insert events: ${eventsErr.message}`);
  console.log('  ✓ Pitch events inserted');

  // 5. journalist_activity_log
  console.log(`  Inserting ${data.activities.length} activity log entries...`);
  const { error: activityErr } = await supabase
    .from('journalist_activity_log')
    .upsert(data.activities, { onConflict: 'id' });
  if (activityErr) throw new Error(`Failed to insert activities: ${activityErr.message}`);
  console.log('  ✓ Activity log inserted');

  // 6. media_lists
  console.log(`  Inserting ${data.lists.length} media lists...`);
  const { error: listsErr } = await supabase
    .from('media_lists')
    .upsert(data.lists, { onConflict: 'id' });
  if (listsErr) throw new Error(`Failed to insert lists: ${listsErr.message}`);
  console.log('  ✓ Media lists inserted');

  // 7. media_list_entries
  console.log(`  Inserting ${data.listEntries.length} media list entries...`);
  const { error: entriesErr } = await supabase
    .from('media_list_entries')
    .upsert(data.listEntries, { onConflict: 'id' });
  if (entriesErr) throw new Error(`Failed to insert list entries: ${entriesErr.message}`);
  console.log('  ✓ Media list entries inserted');

  console.log('✅ All seed data inserted successfully!\n');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         PR Pillar Seed Data Generator                ║');
  console.log('║         Sprint S100.1                                ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const { supabaseUrl, supabaseServiceKey } = getEnvVars();

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No data will be written');
    console.log('   Run with --execute to actually insert data\n');
  }

  // Initialize Supabase client
  let supabase;
  let orgId;
  let userId;

  if (!DRY_RUN) {
    console.log('🔌 Connecting to Supabase...');
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get an org that has members (skip empty orgs)
    const { data: memberships, error: memberError } = await supabase
      .from('org_members')
      .select('org_id, user_id, orgs(name)')
      .limit(1);

    if (memberError || !memberships || memberships.length === 0) {
      console.error('❌ No organization with members found. Please add a user to an org first.');
      process.exit(1);
    }

    orgId = memberships[0].org_id;
    userId = memberships[0].user_id;
    const orgName = memberships[0].orgs?.name || 'Unknown';
    console.log(`  ✓ Using org: ${orgName} (${orgId})`);
    console.log(`  ✓ Using user: ${userId}\n`);

    if (CLEAN_FIRST) {
      await cleanSeedData(supabase, orgId);
    }
  } else {
    // Use placeholder IDs for dry run
    orgId = 'dry-run-org-id';
    userId = 'dry-run-user-id';
  }

  // Generate data
  console.log('📊 Generating seed data...');

  const journalists = generateJournalists(orgId, 15);
  console.log(`  ✓ Generated ${journalists.length} journalist profiles`);

  const { sequences, contacts, events } = generatePitchSequences(orgId, userId, journalists, 5);
  console.log(`  ✓ Generated ${sequences.length} pitch sequences`);
  console.log(`  ✓ Generated ${contacts.length} pitch contacts`);
  console.log(`  ✓ Generated ${events.length} pitch events`);

  const activities = generateActivityLog(orgId, journalists, 12);
  console.log(`  ✓ Generated ${activities.length} activity log entries`);

  const { lists, entries: listEntries } = generateMediaLists(orgId, userId, journalists, 4);
  console.log(`  ✓ Generated ${lists.length} media lists`);
  console.log(`  ✓ Generated ${listEntries.length} media list entries`);

  // Summary
  console.log('\n╭─────────────────────────────────────────────────────╮');
  console.log('│                 GENERATED DATA SUMMARY              │');
  console.log('├─────────────────────────────────────────────────────┤');
  console.log(`│  Journalists:        ${journalists.length.toString().padStart(4)}                         │`);
  console.log(`│  Pitch Sequences:    ${sequences.length.toString().padStart(4)}                         │`);
  console.log(`│  Pitch Contacts:     ${contacts.length.toString().padStart(4)}                         │`);
  console.log(`│  Pitch Events:       ${events.length.toString().padStart(4)}                         │`);
  console.log(`│  Activity Log:       ${activities.length.toString().padStart(4)}                         │`);
  console.log(`│  Media Lists:        ${lists.length.toString().padStart(4)}                         │`);
  console.log(`│  List Entries:       ${listEntries.length.toString().padStart(4)}                         │`);
  console.log('╰─────────────────────────────────────────────────────╯');

  // Sample output
  console.log('\n📋 Sample Data:');
  console.log('\n  Journalists (first 3):');
  journalists.slice(0, 3).forEach(j => {
    console.log(`    - ${j.full_name} (${j.primary_outlet}) - ${j.beat}`);
  });

  console.log('\n  Pitch Sequences:');
  sequences.forEach(s => {
    const seqContacts = contacts.filter(c => c.sequence_id === s.id);
    console.log(`    - ${s.name} [${s.status}] - ${seqContacts.length} contacts`);
  });

  console.log('\n  Media Lists:');
  lists.forEach(l => {
    const listCount = listEntries.filter(e => e.list_id === l.id).length;
    console.log(`    - ${l.name}: ${listCount} journalists`);
  });

  // Insert or preview
  if (!DRY_RUN) {
    await insertSeedData(supabase, {
      journalists,
      sequences,
      contacts,
      events,
      activities,
      lists,
      listEntries,
    });

    console.log('╔══════════════════════════════════════════════════════╗');
    console.log('║                   SEED COMPLETE                      ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  Your PR Pillar is now populated with test data!     ║');
    console.log('║                                                      ║');
    console.log('║  Next steps:                                         ║');
    console.log('║  1. Set PRAVADO_STRICT_API=1 in .env.local           ║');
    console.log('║  2. Start the dashboard: pnpm dev                    ║');
    console.log('║  3. Navigate to /app/pr to see real data             ║');
    console.log('║  4. Run verify script: pnpm verify:pr                ║');
    console.log('╚══════════════════════════════════════════════════════╝');
  } else {
    console.log('\n╭─────────────────────────────────────────────────────╮');
    console.log('│                    DRY RUN COMPLETE                 │');
    console.log('├─────────────────────────────────────────────────────┤');
    console.log('│  No data was written to the database.               │');
    console.log('│                                                     │');
    console.log('│  To actually insert this data:                      │');
    console.log('│    node scripts/seed-pr-data.mjs --execute          │');
    console.log('│                                                     │');
    console.log('│  To clean existing seed data first:                 │');
    console.log('│    node scripts/seed-pr-data.mjs --execute --clean  │');
    console.log('╰─────────────────────────────────────────────────────╯');
  }
}

main().catch(err => {
  console.error('\n❌ Fatal error:', err.message);
  process.exit(1);
});
