/**
 * Demo Organization Seed Script (Sprint S77)
 *
 * Creates a complete demo organization with sample data across all key systems.
 * Run with: pnpm --filter @pravado/api seed:demo
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEMO_ORG = {
  slug: 'demo-org',
  name: 'Pravado Demo Org',
  description: 'Demo organization for UAT and golden path testing',
};

const DEMO_USERS = [
  {
    email: 'demo-exec@demo.local',
    name: 'Alex Executive',
    role: 'owner' as const,
  },
  {
    email: 'demo-analyst@demo.local',
    name: 'Jordan Analyst',
    role: 'member' as const,
  },
];

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  return createClient(url, key);
}

// ============================================================================
// SEED FUNCTIONS
// ============================================================================

interface SeedContext {
  supabase: SupabaseClient;
  orgId: string;
  userIds: string[];
  createdIds: {
    playbooks: string[];
    playbookRuns: string[];
    crisisIncidents: string[];
    scenarios: string[];
    scenarioRuns: string[];
    suites: string[];
    suiteRuns: string[];
    realityMaps: string[];
    conflicts: string[];
    narratives: string[];
    digests: string[];
    boardReports: string[];
    strategicReports: string[];
    reputationReports: string[];
    pressReleases: string[];
    mediaMonitoringSources: string[];
    earnedMentions: string[];
  };
}

async function seedOrganization(supabase: SupabaseClient): Promise<string> {
  console.log('🏢 Seeding organization...');

  // Check if demo org already exists (by name since slug column may not exist)
  const { data: existing } = await supabase
    .from('orgs')
    .select('id')
    .eq('name', DEMO_ORG.name)
    .single();

  if (existing) {
    console.log(`   ✓ Demo org already exists: ${existing.id}`);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('orgs')
    .insert({
      id: uuidv4(),
      name: DEMO_ORG.name,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create org: ${error.message}`);
  console.log(`   ✓ Created org: ${data.id}`);
  return data.id;
}

async function seedUsers(
  supabase: SupabaseClient,
  orgId: string
): Promise<string[]> {
  console.log('👥 Seeding users...');
  const userIds: string[] = [];

  for (const user of DEMO_USERS) {
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', user.email)
      .single();

    let userId: string;
    if (existing) {
      userId = existing.id;
      console.log(`   ✓ User exists: ${user.email}`);
    } else {
      userId = uuidv4();
      const { error } = await supabase.from('users').insert({
        id: userId,
        email: user.email,
        full_name: user.name,
      });
      if (error) {
        console.log(`   ⚠ Could not create user (may need auth): ${user.email}`);
        continue;
      }
      console.log(`   ✓ Created user: ${user.email}`);
    }

    // Link user to org
    const { error: linkError } = await supabase.from('user_orgs').upsert(
      {
        user_id: userId,
        org_id: orgId,
        role: user.role,
      },
      { onConflict: 'user_id,org_id' }
    );

    if (!linkError) {
      userIds.push(userId);
    }
  }

  return userIds;
}

async function seedPRAndMedia(ctx: SeedContext): Promise<void> {
  console.log('📰 Seeding PR & Media data...');
  const { supabase, orgId } = ctx;

  // Media monitoring sources
  const sources = [
    { name: 'TechCrunch', url: 'https://techcrunch.com', source_type: 'news' },
    { name: 'Reuters', url: 'https://reuters.com', source_type: 'wire' },
    { name: 'Industry Blog', url: 'https://blog.example.com', source_type: 'blog' },
  ];

  for (const source of sources) {
    const sourceId = uuidv4();
    await supabase.from('media_monitoring_sources').insert({
      id: sourceId,
      org_id: orgId,
      ...source,
      is_active: true,
    });
    ctx.createdIds.mediaMonitoringSources.push(sourceId);
  }
  console.log(`   ✓ Created ${sources.length} media sources`);

  // Earned mentions
  const mentions = [
    {
      title: 'Company X Launches Revolutionary AI Platform',
      sentiment: 'positive',
      reach_score: 85,
      source_name: 'TechCrunch',
    },
    {
      title: 'Market Analysis: Emerging Players in AI Space',
      sentiment: 'neutral',
      reach_score: 72,
      source_name: 'Reuters',
    },
    {
      title: 'Industry Challenges Ahead for 2025',
      sentiment: 'negative',
      reach_score: 45,
      source_name: 'Industry Blog',
    },
  ];

  for (const mention of mentions) {
    const mentionId = uuidv4();
    await supabase.from('earned_mentions').insert({
      id: mentionId,
      org_id: orgId,
      ...mention,
      published_at: new Date().toISOString(),
      url: `https://example.com/article/${mentionId.slice(0, 8)}`,
    });
    ctx.createdIds.earnedMentions.push(mentionId);
  }
  console.log(`   ✓ Created ${mentions.length} earned mentions`);

  // Press releases
  const releases = [
    {
      title: 'Q4 2024 Earnings Announcement',
      status: 'published',
      release_type: 'earnings',
    },
    {
      title: 'New Product Launch: AI Assistant Pro',
      status: 'draft',
      release_type: 'product',
    },
  ];

  for (const release of releases) {
    const releaseId = uuidv4();
    await supabase.from('pr_generated_releases').insert({
      id: releaseId,
      org_id: orgId,
      ...release,
      body: `This is the body content for: ${release.title}`,
      generated_at: new Date().toISOString(),
    });
    ctx.createdIds.pressReleases.push(releaseId);
  }
  console.log(`   ✓ Created ${releases.length} press releases`);
}

async function seedCrisisData(ctx: SeedContext): Promise<void> {
  console.log('🚨 Seeding Crisis data...');
  const { supabase, orgId } = ctx;

  // Crisis incidents
  const incidents = [
    {
      title: 'Data Breach Alert - Third Party Vendor',
      severity: 'high',
      status: 'active',
      incident_type: 'security',
      description: 'Potential customer data exposure through vendor compromise.',
    },
    {
      title: 'Negative Social Media Campaign',
      severity: 'medium',
      status: 'monitoring',
      incident_type: 'reputation',
      description: 'Coordinated negative posts identified on Twitter/X.',
    },
  ];

  for (const incident of incidents) {
    const incidentId = uuidv4();
    await supabase.from('crisis_assessments').insert({
      id: incidentId,
      org_id: orgId,
      ...incident,
      detected_at: new Date().toISOString(),
    });
    ctx.createdIds.crisisIncidents.push(incidentId);
  }
  console.log(`   ✓ Created ${incidents.length} crisis incidents`);
}

async function seedBrandReputation(ctx: SeedContext): Promise<void> {
  console.log('⭐ Seeding Brand Reputation data...');
  const { supabase, orgId } = ctx;

  // Brand reputation reports
  const reports = [
    {
      title: 'Weekly Brand Health Report - Week 48',
      report_type: 'weekly',
      overall_score: 78,
      status: 'published',
    },
    {
      title: 'Monthly Reputation Summary - November 2024',
      report_type: 'monthly',
      overall_score: 82,
      status: 'published',
    },
  ];

  for (const report of reports) {
    const reportId = uuidv4();
    await supabase.from('brand_reputation_reports').insert({
      id: reportId,
      org_id: orgId,
      ...report,
      period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
    });
    ctx.createdIds.reputationReports.push(reportId);
  }
  console.log(`   ✓ Created ${reports.length} reputation reports`);
}

async function seedExecutiveIntelligence(ctx: SeedContext): Promise<void> {
  console.log('📊 Seeding Executive Intelligence data...');
  const { supabase, orgId } = ctx;

  // Strategic Intelligence Reports
  const strategicReports = [
    {
      title: 'Strategic Intelligence Brief - Q4 2024',
      report_type: 'quarterly',
      status: 'published',
      executive_summary: 'Market position remains strong with growth in key verticals.',
    },
  ];

  for (const report of strategicReports) {
    const reportId = uuidv4();
    await supabase.from('strategic_intelligence_reports').insert({
      id: reportId,
      org_id: orgId,
      ...report,
      period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
    });
    ctx.createdIds.strategicReports.push(reportId);
  }
  console.log(`   ✓ Created ${strategicReports.length} strategic reports`);

  // Exec Digests
  const digests = [
    {
      title: 'Weekly Executive Digest - Week 48',
      digest_type: 'weekly',
      status: 'published',
      key_insights: ['Revenue up 12% YoY', 'New market expansion on track', 'Crisis contained'],
    },
  ];

  for (const digest of digests) {
    const digestId = uuidv4();
    await supabase.from('exec_digests').insert({
      id: digestId,
      org_id: orgId,
      ...digest,
      period_start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
    });
    ctx.createdIds.digests.push(digestId);
  }
  console.log(`   ✓ Created ${digests.length} exec digests`);

  // Board Reports
  const boardReports = [
    {
      title: 'Board Report - Q4 2024',
      report_type: 'quarterly',
      status: 'draft',
      executive_summary: 'Strong quarter with key milestones achieved across all business units.',
    },
  ];

  for (const report of boardReports) {
    const reportId = uuidv4();
    await supabase.from('executive_board_reports').insert({
      id: reportId,
      org_id: orgId,
      ...report,
      period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
    });
    ctx.createdIds.boardReports.push(reportId);
  }
  console.log(`   ✓ Created ${boardReports.length} board reports`);
}

async function seedUnifiedNarratives(ctx: SeedContext): Promise<void> {
  console.log('📝 Seeding Unified Narratives...');
  const { supabase, orgId } = ctx;

  const narratives = [
    {
      title: 'Q4 2024 Company Performance Narrative',
      narrative_type: 'quarterly_review',
      status: 'published',
      format: 'comprehensive',
      executive_summary:
        'Company demonstrated resilient performance in Q4 despite market headwinds. Key achievements include successful product launch and crisis mitigation.',
    },
    {
      title: 'Crisis Response Narrative - Security Incident',
      narrative_type: 'crisis_response',
      status: 'draft',
      format: 'executive',
      executive_summary:
        'Synthesized response narrative for the Q4 security incident, including timeline, actions taken, and lessons learned.',
    },
  ];

  for (const narrative of narratives) {
    const narrativeId = uuidv4();
    await supabase.from('unified_narratives').insert({
      id: narrativeId,
      org_id: orgId,
      ...narrative,
      period_start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      period_end: new Date().toISOString(),
      source_systems: ['pr', 'crisis', 'reputation', 'strategy'],
    });
    ctx.createdIds.narratives.push(narrativeId);
  }
  console.log(`   ✓ Created ${narratives.length} unified narratives`);
}

async function seedPlaybooks(ctx: SeedContext): Promise<void> {
  console.log('📘 Seeding Playbooks...');
  const { supabase, orgId } = ctx;

  const playbooks = [
    {
      name: 'Crisis Response Playbook',
      description: 'Standard operating procedure for crisis events',
      status: 'active',
      pillar: 'pr',
    },
    {
      name: 'Product Launch Playbook',
      description: 'Coordinated launch activities across PR and content',
      status: 'active',
      pillar: 'content',
    },
    {
      name: 'Quarterly Report Generation',
      description: 'Automated quarterly reporting workflow',
      status: 'active',
      pillar: 'seo',
    },
  ];

  for (const playbook of playbooks) {
    const playbookId = uuidv4();
    await supabase.from('playbooks').insert({
      id: playbookId,
      org_id: orgId,
      ...playbook,
      version: 1,
    });
    ctx.createdIds.playbooks.push(playbookId);

    // Create a sample run for each playbook
    const runId = uuidv4();
    await supabase.from('playbook_runs').insert({
      id: runId,
      org_id: orgId,
      playbook_id: playbookId,
      status: 'completed',
      started_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date().toISOString(),
    });
    ctx.createdIds.playbookRuns.push(runId);
  }
  console.log(`   ✓ Created ${playbooks.length} playbooks with runs`);
}

async function seedScenarios(ctx: SeedContext): Promise<void> {
  console.log('🎭 Seeding Scenarios & Simulations...');
  const { supabase, orgId } = ctx;

  // AI Scenario Simulations
  const scenarios = [
    {
      name: 'Market Downturn Response',
      description: 'Simulates response to 20% market correction',
      scenario_type: 'crisis',
      status: 'completed',
    },
    {
      name: 'Competitor Product Launch',
      description: 'Response strategies for major competitor announcement',
      scenario_type: 'competitive',
      status: 'completed',
    },
    {
      name: 'Regulatory Change Impact',
      description: 'Assesses impact of new privacy regulations',
      scenario_type: 'regulatory',
      status: 'running',
    },
  ];

  for (const scenario of scenarios) {
    const scenarioId = uuidv4();
    await supabase.from('ai_scenario_simulations').insert({
      id: scenarioId,
      org_id: orgId,
      ...scenario,
    });
    ctx.createdIds.scenarios.push(scenarioId);

    // Create scenario runs
    const runId = uuidv4();
    await supabase.from('ai_scenario_runs').insert({
      id: runId,
      org_id: orgId,
      simulation_id: scenarioId,
      status: scenario.status === 'running' ? 'in_progress' : 'completed',
      started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      completed_at: scenario.status === 'completed' ? new Date().toISOString() : null,
    });
    ctx.createdIds.scenarioRuns.push(runId);
  }
  console.log(`   ✓ Created ${scenarios.length} scenarios with runs`);
}

async function seedOrchestrationSuites(ctx: SeedContext): Promise<void> {
  console.log('🎼 Seeding Orchestration Suites...');
  const { supabase, orgId } = ctx;

  const suites = [
    {
      name: 'Q4 Crisis Simulation Suite',
      description: 'Multi-scenario suite for crisis preparedness',
      status: 'completed',
    },
    {
      name: 'Product Launch Scenarios',
      description: 'Suite exploring various launch outcomes',
      status: 'running',
    },
  ];

  for (const suite of suites) {
    const suiteId = uuidv4();
    await supabase.from('scenario_suites').insert({
      id: suiteId,
      org_id: orgId,
      ...suite,
    });
    ctx.createdIds.suites.push(suiteId);

    // Create suite run
    const runId = uuidv4();
    await supabase.from('scenario_suite_runs').insert({
      id: runId,
      org_id: orgId,
      suite_id: suiteId,
      status: suite.status === 'running' ? 'in_progress' : 'completed',
      started_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      completed_at: suite.status === 'completed' ? new Date().toISOString() : null,
    });
    ctx.createdIds.suiteRuns.push(runId);
  }
  console.log(`   ✓ Created ${suites.length} orchestration suites with runs`);
}

async function seedRealityMaps(ctx: SeedContext): Promise<void> {
  console.log('🗺️ Seeding Reality Maps...');
  const { supabase, orgId } = ctx;

  const maps = [
    {
      name: 'Crisis Outcome Tree',
      description: 'Probability tree for crisis resolution paths',
      status: 'completed',
    },
    {
      name: 'Market Response Scenarios',
      description: 'Branching outcomes for market conditions',
      status: 'generated',
    },
  ];

  for (const map of maps) {
    const mapId = uuidv4();
    await supabase.from('reality_maps').insert({
      id: mapId,
      org_id: orgId,
      ...map,
      parameters: {
        maxDepth: 5,
        branchingFactor: 3,
        probabilityThreshold: 0.1,
      },
      total_nodes: 15,
      total_edges: 14,
      total_paths: 8,
    });
    ctx.createdIds.realityMaps.push(mapId);

    // Create sample nodes
    const rootNodeId = uuidv4();
    await supabase.from('reality_map_nodes').insert({
      id: rootNodeId,
      org_id: orgId,
      reality_map_id: mapId,
      node_type: 'root',
      label: 'Current State',
      probability: 1.0,
      depth: 0,
    });

    // Create child nodes
    for (let i = 1; i <= 3; i++) {
      const childNodeId = uuidv4();
      await supabase.from('reality_map_nodes').insert({
        id: childNodeId,
        org_id: orgId,
        reality_map_id: mapId,
        node_type: 'outcome',
        label: `Outcome Path ${i}`,
        probability: 0.33,
        depth: 1,
        parent_id: rootNodeId,
      });

      // Create edge
      await supabase.from('reality_map_edges').insert({
        id: uuidv4(),
        org_id: orgId,
        reality_map_id: mapId,
        parent_node_id: rootNodeId,
        child_node_id: childNodeId,
        transition_probability: 0.33,
        label: `Transition ${i}`,
      });
    }
  }
  console.log(`   ✓ Created ${maps.length} reality maps with nodes`);
}

async function seedInsightConflicts(ctx: SeedContext): Promise<void> {
  console.log('⚡ Seeding Insight Conflicts...');
  const { supabase, orgId } = ctx;

  const conflicts = [
    {
      title: 'Conflicting Crisis Severity Assessments',
      conflict_type: 'contradiction',
      severity: 'high',
      status: 'detected',
      conflict_summary:
        'Risk Radar indicates critical severity while Crisis Engine shows medium severity for the same incident.',
    },
    {
      title: 'Divergent Market Response Recommendations',
      conflict_type: 'divergence',
      severity: 'medium',
      status: 'analyzing',
      conflict_summary:
        'Strategic Intelligence recommends aggressive expansion while Scenario Simulations suggest cautious approach.',
    },
  ];

  for (const conflict of conflicts) {
    const conflictId = uuidv4();
    await supabase.from('insight_conflicts').insert({
      id: conflictId,
      org_id: orgId,
      ...conflict,
      source_entities: [
        { system: 'risk_radar', entityId: 'rr-001' },
        { system: 'crisis_engine', entityId: 'ce-001' },
      ],
      affected_systems: ['crisis', 'strategy', 'executive'],
    });
    ctx.createdIds.conflicts.push(conflictId);
  }
  console.log(`   ✓ Created ${conflicts.length} insight conflicts`);
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

export async function runSeed(): Promise<void> {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PRAVADO DEMO ORGANIZATION SEED SCRIPT (S77)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  const supabase = getSupabaseClient();

  // Seed organization and users
  const orgId = await seedOrganization(supabase);
  const userIds = await seedUsers(supabase, orgId);

  // Initialize context
  const ctx: SeedContext = {
    supabase,
    orgId,
    userIds,
    createdIds: {
      playbooks: [],
      playbookRuns: [],
      crisisIncidents: [],
      scenarios: [],
      scenarioRuns: [],
      suites: [],
      suiteRuns: [],
      realityMaps: [],
      conflicts: [],
      narratives: [],
      digests: [],
      boardReports: [],
      strategicReports: [],
      reputationReports: [],
      pressReleases: [],
      mediaMonitoringSources: [],
      earnedMentions: [],
    },
  };

  // Seed all domains
  await seedPRAndMedia(ctx);
  await seedCrisisData(ctx);
  await seedBrandReputation(ctx);
  await seedExecutiveIntelligence(ctx);
  await seedUnifiedNarratives(ctx);
  await seedPlaybooks(ctx);
  await seedScenarios(ctx);
  await seedOrchestrationSuites(ctx);
  await seedRealityMaps(ctx);
  await seedInsightConflicts(ctx);

  // Summary
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  SEED COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`  Organization: ${DEMO_ORG.name} (${orgId})`);
  console.log(`  Users: ${userIds.length}`);
  console.log('');
  console.log('  Created Records:');
  console.log(`    • Playbooks: ${ctx.createdIds.playbooks.length}`);
  console.log(`    • Playbook Runs: ${ctx.createdIds.playbookRuns.length}`);
  console.log(`    • Crisis Incidents: ${ctx.createdIds.crisisIncidents.length}`);
  console.log(`    • Scenarios: ${ctx.createdIds.scenarios.length}`);
  console.log(`    • Scenario Runs: ${ctx.createdIds.scenarioRuns.length}`);
  console.log(`    • Orchestration Suites: ${ctx.createdIds.suites.length}`);
  console.log(`    • Suite Runs: ${ctx.createdIds.suiteRuns.length}`);
  console.log(`    • Reality Maps: ${ctx.createdIds.realityMaps.length}`);
  console.log(`    • Insight Conflicts: ${ctx.createdIds.conflicts.length}`);
  console.log(`    • Unified Narratives: ${ctx.createdIds.narratives.length}`);
  console.log(`    • Exec Digests: ${ctx.createdIds.digests.length}`);
  console.log(`    • Board Reports: ${ctx.createdIds.boardReports.length}`);
  console.log(`    • Strategic Reports: ${ctx.createdIds.strategicReports.length}`);
  console.log(`    • Reputation Reports: ${ctx.createdIds.reputationReports.length}`);
  console.log(`    • Press Releases: ${ctx.createdIds.pressReleases.length}`);
  console.log(`    • Media Sources: ${ctx.createdIds.mediaMonitoringSources.length}`);
  console.log(`    • Earned Mentions: ${ctx.createdIds.earnedMentions.length}`);
  console.log('');
  console.log('  Next steps:');
  console.log('    1. Review docs/GOLDEN_PATH_EXEC_NARRATIVE.md');
  console.log('    2. Review docs/GOLDEN_PATH_CRISIS_REALITY_CONFLICTS.md');
  console.log('    3. Run through UAT checklist in docs/UAT_CHECKLIST_V1.md');
  console.log('');
}

// ============================================================================
// CLI ENTRYPOINT
// ============================================================================

runSeed()
  .then(() => {
    console.log('Seed completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
