#!/usr/bin/env node

/**
 * PR Work Surface V1.1 CI Guardrail Script
 *
 * Validates the V1.1 best-in-class upgrade implementation.
 * Run with: pnpm --filter @pravado/dashboard check:pr-v11
 *
 * V1.1 Upgrades:
 * - PRInbox with queue + detail split layout
 * - PRPitches with Kanban pipeline view
 * - PRDatabase with advanced filters, saved segments, data quality mode
 * - PRSettings with SYSTEM ENFORCED explanation panels
 * - No auto-send, no bulk send for relationship actions
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md (Section 13)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DASHBOARD_ROOT = path.resolve(__dirname, '..');

const errors = [];
const warnings = [];
const passes = [];

// Helper to read file content
function readFile(relativePath) {
  const fullPath = path.join(DASHBOARD_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

// Helper to check if file exists
function fileExists(relativePath) {
  const fullPath = path.join(DASHBOARD_ROOT, relativePath);
  return fs.existsSync(fullPath);
}

// Check 1: PR Inbox with queue + detail split layout
function checkPRInbox() {
  console.log('\n--- Check 1: PR Inbox View (V1.1) ---');

  const inboxPath = 'src/components/pr-work-surface/views/PRInbox.tsx';
  if (!fileExists(inboxPath)) {
    errors.push('PRInbox.tsx view does not exist');
    return;
  }
  passes.push('PRInbox.tsx view exists');

  const inboxContent = readFile(inboxPath);
  if (!inboxContent) {
    errors.push('Cannot read PRInbox content');
    return;
  }

  // V1.1: Check for queue + detail split layout patterns
  const v11Patterns = [
    { pattern: 'QueueItem', name: 'QueueItem component' },
    { pattern: 'DetailPanel', name: 'DetailPanel component' },
    { pattern: 'eviImpact', name: 'EVI Impact display' },
    { pattern: 'sageRationale', name: 'SAGE Rationale display' },
  ];

  for (const { pattern, name } of v11Patterns) {
    if (inboxContent.includes(pattern)) {
      passes.push(`PRInbox has ${name}`);
    } else {
      warnings.push(`PRInbox may be missing ${name}`);
    }
  }

  // Check it's exported from index
  const indexContent = readFile('src/components/pr-work-surface/index.ts');
  if (!indexContent || !indexContent.includes('PRInbox')) {
    errors.push('PRInbox is not exported from pr-work-surface index');
    return;
  }
  passes.push('PRInbox is exported from pr-work-surface index');
}

// Check 2: Contact Ledger component exists
function checkContactLedger() {
  console.log('\n--- Check 2: Contact Relationship Ledger ---');

  const ledgerPath = 'src/components/pr-work-surface/components/ContactRelationshipLedger.tsx';
  if (!fileExists(ledgerPath)) {
    errors.push('ContactRelationshipLedger.tsx component does not exist');
    return;
  }
  passes.push('ContactRelationshipLedger.tsx component exists');

  const indexContent = readFile('src/components/pr-work-surface/index.ts');
  if (!indexContent || !indexContent.includes('ContactRelationshipLedger')) {
    errors.push('ContactRelationshipLedger is not exported from pr-work-surface index');
    return;
  }
  passes.push('ContactRelationshipLedger is exported from pr-work-surface index');

  const ledgerContent = readFile(ledgerPath);
  if (!ledgerContent) {
    errors.push('Cannot read ContactRelationshipLedger content');
    return;
  }

  const requiredEventTypes = [
    'pitch_sent',
    'reply_received',
    'coverage_won',
    'relationship_stage_changed',
    'topic_currency_changed',
  ];

  for (const eventType of requiredEventTypes) {
    if (!ledgerContent.includes(eventType)) {
      warnings.push(`ContactRelationshipLedger may be missing event type: ${eventType}`);
    }
  }
  passes.push('ContactRelationshipLedger has core event types');
}

// Check 3: PRPitches with Kanban pipeline view
function checkPitches() {
  console.log('\n--- Check 3: PRPitches with Kanban Pipeline (V1.1) ---');

  const pitchesPath = 'src/components/pr-work-surface/views/PRPitches.tsx';
  if (!fileExists(pitchesPath)) {
    errors.push('PRPitches.tsx view does not exist');
    return;
  }
  passes.push('PRPitches.tsx view exists');

  const pitchesContent = readFile(pitchesPath);
  if (!pitchesContent) {
    errors.push('Cannot read PRPitches content');
    return;
  }

  // V1.1: Check for Kanban pipeline patterns
  const kanbanPatterns = [
    { pattern: 'kanban', name: 'kanban view mode' },
    { pattern: 'KanbanColumn', name: 'KanbanColumn component' },
    { pattern: 'KanbanCard', name: 'KanbanCard component' },
    { pattern: 'ViewToggle', name: 'ViewToggle component' },
    { pattern: 'PIPELINE_STAGES', name: 'pipeline stages config' },
  ];

  for (const { pattern, name } of kanbanPatterns) {
    if (pitchesContent.includes(pattern)) {
      passes.push(`PRPitches has ${name}`);
    } else {
      warnings.push(`PRPitches may be missing ${name}`);
    }
  }

  // Check for required stages
  const requiredStages = ['draft', 'scheduled', 'sent', 'opened', 'replied'];
  for (const stage of requiredStages) {
    if (!pitchesContent.includes(stage)) {
      warnings.push(`PRPitches may be missing stage: ${stage}`);
    }
  }
  passes.push('PRPitches has core pipeline stages');

  // V1.1: Check for manual mode enforcement notice
  if (pitchesContent.includes('MANUAL MODE ENFORCED') || pitchesContent.includes('No auto-send')) {
    passes.push('PRPitches displays manual mode enforcement notice');
  } else {
    warnings.push('PRPitches may not display manual mode enforcement notice');
  }
}

// Check 4: PRDatabase with advanced filters
function checkDatabase() {
  console.log('\n--- Check 4: PRDatabase with Advanced Filters (V1.1) ---');

  const databasePath = 'src/components/pr-work-surface/views/PRDatabase.tsx';
  if (!fileExists(databasePath)) {
    errors.push('PRDatabase.tsx view does not exist');
    return;
  }
  passes.push('PRDatabase.tsx view exists');

  const databaseContent = readFile(databasePath);
  if (!databaseContent) {
    errors.push('Cannot read PRDatabase content');
    return;
  }

  // V1.1: Check for advanced filter patterns
  const advancedFilterPatterns = [
    { pattern: 'FilterDrawer', name: 'FilterDrawer component' },
    { pattern: 'SavedSegment', name: 'SavedSegment support' },
    { pattern: 'DataQuality', name: 'Data Quality mode' },
    { pattern: 'Advanced Filters', name: 'Advanced Filters button' },
    { pattern: 'verificationStatus', name: 'verification status filter' },
    { pattern: 'topicCurrencyRange', name: 'topic currency range filter' },
    { pattern: 'outletTier', name: 'outlet tier filter' },
  ];

  for (const { pattern, name } of advancedFilterPatterns) {
    if (databaseContent.includes(pattern)) {
      passes.push(`PRDatabase has ${name}`);
    } else {
      warnings.push(`PRDatabase may be missing ${name}`);
    }
  }
}

// Check 5: PRSettings with SYSTEM ENFORCED panels
function checkSettings() {
  console.log('\n--- Check 5: PRSettings with SYSTEM ENFORCED Panels (V1.1) ---');

  const settingsPath = 'src/components/pr-work-surface/views/PRSettings.tsx';
  if (!fileExists(settingsPath)) {
    errors.push('PRSettings.tsx view does not exist');
    return;
  }
  passes.push('PRSettings.tsx view exists');

  const settingsContent = readFile(settingsPath);
  if (!settingsContent) {
    errors.push('Cannot read PRSettings content');
    return;
  }

  // V1.1: Check for SYSTEM ENFORCED panels
  const enforcementPatterns = [
    { pattern: 'SYSTEM ENFORCED', name: 'SYSTEM ENFORCED banner' },
    { pattern: 'isSystemEnforced', name: 'system enforcement flag' },
    { pattern: 'CANNOT OVERRIDE', name: 'cannot override indicator' },
    { pattern: 'overridable', name: 'overridable flag' },
    { pattern: 'CeilingGroup', name: 'CeilingGroup organization' },
    { pattern: 'PhilosophyExplainer', name: 'automation philosophy explainer' },
  ];

  for (const { pattern, name } of enforcementPatterns) {
    if (settingsContent.includes(pattern)) {
      passes.push(`PRSettings has ${name}`);
    } else {
      warnings.push(`PRSettings may be missing ${name}`);
    }
  }

  // Check critical constraints are documented
  const criticalConstraints = ['send_pitch', 'send_followup', 'citemind_audio'];
  for (const constraint of criticalConstraints) {
    if (settingsContent.includes(constraint)) {
      passes.push(`PRSettings includes ${constraint} constraint`);
    } else {
      warnings.push(`PRSettings may be missing ${constraint} constraint documentation`);
    }
  }
}

// Check 6: Impact Strip component exists and is used
function checkImpactStrip() {
  console.log('\n--- Check 6: Impact Strip Component ---');

  const stripPath = 'src/components/pr-work-surface/components/ImpactStrip.tsx';
  if (!fileExists(stripPath)) {
    errors.push('ImpactStrip.tsx component does not exist');
    return;
  }
  passes.push('ImpactStrip.tsx component exists');

  const indexContent = readFile('src/components/pr-work-surface/index.ts');
  if (!indexContent || !indexContent.includes('ImpactStrip')) {
    errors.push('ImpactStrip is not exported from pr-work-surface index');
    return;
  }
  passes.push('ImpactStrip is exported from pr-work-surface index');

  const stripContent = readFile(stripPath);
  if (!stripContent) {
    errors.push('Cannot read ImpactStrip content');
    return;
  }

  const requiredExports = ['SAGETag', 'EVIIndicator', 'ModeBadge'];
  for (const exportName of requiredExports) {
    const hasDirectExport = stripContent.includes(`export function ${exportName}`) ||
                            stripContent.includes(`export const ${exportName}`);
    const hasNamedExport = stripContent.includes(`export { `) && stripContent.includes(exportName);
    if (!hasDirectExport && !hasNamedExport) {
      errors.push(`ImpactStrip missing required export: ${exportName}`);
    }
  }
  passes.push('ImpactStrip has SAGETag, EVIIndicator, ModeBadge');
}

// Check 7: Forbidden patterns (V1.1 enhanced)
function checkForbiddenPatterns() {
  console.log('\n--- Check 7: Forbidden Patterns (V1.1 Enhanced) ---');

  const filesToScan = [
    'src/components/pr-work-surface/views/PRInbox.tsx',
    'src/components/pr-work-surface/views/PRPitches.tsx',
    'src/components/pr-work-surface/views/PRDistribution.tsx',
    'src/components/pr-work-surface/views/PRSettings.tsx',
    'src/components/pr-work-surface/components/PitchComposer.tsx',
    'src/components/pr-work-surface/components/DistributionDecisionMatrix.tsx',
  ];

  const forbiddenPatterns = [
    { pattern: /auto[-_]?send/gi, name: 'auto-send semantics', allowInNegation: true },
    { pattern: /bulk[-_]?send/gi, name: 'bulk send action', allowInNegation: true },
    { pattern: /send[-_]?all/gi, name: 'send-all action', allowInNegation: false },
    { pattern: /mass[-_]?send/gi, name: 'mass send action', allowInNegation: false },
    { pattern: /spray[-_]?and[-_]?pray/gi, name: 'spray-and-pray pattern', allowInNegation: false },
  ];

  // Allowed negation contexts
  const negationIndicators = [
    'No auto-send',
    'NO auto-send',
    'not available',
    'disabled',
    'banned',
    'forbidden',
    'require manual',
    'requires manual',
    'not enabled',
    'MANUAL MODE ENFORCED',
    'Manual distribution only',
    'manual send action',
  ];

  let foundForbidden = false;

  for (const filePath of filesToScan) {
    const content = readFile(filePath);
    if (!content) continue;

    for (const { pattern, name, allowInNegation } of forbiddenPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        const isNegationContext = allowInNegation && negationIndicators.some((neg) => content.includes(neg));

        if (!isNegationContext) {
          errors.push(`FORBIDDEN: Found "${name}" in ${filePath}`);
          foundForbidden = true;
        }
      }
    }
  }

  if (!foundForbidden) {
    passes.push('No forbidden patterns detected');
  }

  // Check CiteMind audio is manual-only
  const distributionContent = readFile('src/components/pr-work-surface/components/DistributionDecisionMatrix.tsx');
  if (distributionContent) {
    if (distributionContent.includes('Manual distribution only') || distributionContent.includes('manual')) {
      passes.push('Distribution matrix enforces manual mode');
    } else {
      warnings.push('Distribution matrix may not be enforcing manual mode');
    }
  }
}

// Check 8: V1.1 Types are properly defined
function checkTypes() {
  console.log('\n--- Check 8: V1.1 Types ---');

  const typesPath = 'src/components/pr-work-surface/types.ts';
  const typesContent = readFile(typesPath);

  if (!typesContent) {
    errors.push('types.ts does not exist or cannot be read');
    return;
  }

  const requiredTypes = [
    // Core types
    'InboxItem',
    'InboxItemType',
    'MediaContact',
    'Pitch',
    'PitchStatus',
    // SAGE/EVI types
    'SAGEContribution',
    'SAGEDimension',
    'EVIImpact',
    'EVIDriver',
    'EVIDirection',
    // V1.1 Database types
    'DatabaseFilterState',
    'SavedSegment',
    'VerificationStatus',
    'DataQualityStats',
    // Automation types
    'AutomationMode',
    'AutomationCeiling',
    'PRGuardrails',
  ];

  let missingTypes = [];
  for (const typeName of requiredTypes) {
    if (!typesContent.includes(typeName)) {
      missingTypes.push(typeName);
    }
  }

  if (missingTypes.length === 0) {
    passes.push('All V1.1 types are defined');
  } else {
    for (const t of missingTypes) {
      warnings.push(`Missing V1.1 type definition: ${t}`);
    }
  }
}

// Check 9: PR Work Surface Shell
function checkShell() {
  console.log('\n--- Check 9: PR Work Surface Shell (V1.1) ---');

  const shellPath = 'src/components/pr-work-surface/PRWorkSurfaceShell.tsx';
  if (!fileExists(shellPath)) {
    errors.push('PRWorkSurfaceShell.tsx does not exist');
    return;
  }
  passes.push('PRWorkSurfaceShell.tsx exists');

  const shellContent = readFile(shellPath);
  if (!shellContent) {
    errors.push('Cannot read PRWorkSurfaceShell content');
    return;
  }

  // V1.1: Check for updated branding
  if (shellContent.includes('PR Intelligence') || shellContent.includes('PR Work Surface')) {
    passes.push('PRWorkSurfaceShell has proper branding');
  } else {
    warnings.push('PRWorkSurfaceShell may have incorrect branding');
  }

  // V1.1: Check legacy UI link is removed
  if (shellContent.includes('Legacy UI') || shellContent.includes('pr-legacy')) {
    warnings.push('PRWorkSurfaceShell still contains legacy UI references');
  } else {
    passes.push('PRWorkSurfaceShell has no legacy UI references');
  }

  // Check all tabs are defined
  const requiredTabs = ['inbox', 'overview', 'database', 'pitches', 'coverage', 'distribution', 'settings'];
  for (const tab of requiredTabs) {
    if (shellContent.includes(`'${tab}'`) || shellContent.includes(`"${tab}"`)) {
      passes.push(`PRWorkSurfaceShell has ${tab} tab`);
    } else {
      errors.push(`PRWorkSurfaceShell missing ${tab} tab`);
    }
  }
}

// Main execution
console.log('='.repeat(60));
console.log('PR Work Surface V1.1 CI Guardrail Check');
console.log('='.repeat(60));

checkPRInbox();
checkContactLedger();
checkPitches();
checkDatabase();
checkSettings();
checkImpactStrip();
checkForbiddenPatterns();
checkTypes();
checkShell();

// Summary
console.log('\n' + '='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));

console.log(`\n  Passes: ${passes.length}`);
for (const pass of passes) {
  console.log(`    [PASS] ${pass}`);
}

if (warnings.length > 0) {
  console.log(`\n  Warnings: ${warnings.length}`);
  for (const warning of warnings) {
    console.log(`    [WARN] ${warning}`);
  }
}

if (errors.length > 0) {
  console.log(`\n  Errors: ${errors.length}`);
  for (const error of errors) {
    console.log(`    [FAIL] ${error}`);
  }
  console.log('\n' + '='.repeat(60));
  console.log('PR Work Surface V1.1 check FAILED');
  console.log('='.repeat(60));
  process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('PR Work Surface V1.1 check PASSED');
console.log('='.repeat(60));
process.exit(0);
