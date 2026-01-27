#!/usr/bin/env node

/**
 * PR Work Surface V1 Guardrail Script
 *
 * Validates PR Work Surface V1 implementation against contract requirements:
 * 1. Required views exist (Overview, Database, Pitches, Coverage, Distribution, Settings)
 * 2. Required components exist (DistributionDecisionMatrix, ContactDetailDrawer, etc.)
 * 3. Types export required entity types
 * 4. No autopilot patterns in send/pitch actions
 * 5. Distribution tracks are properly configured
 *
 * Run: node scripts/check-pr-work-surface-v1.mjs
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Configuration
const REQUIRED_VIEWS = [
  'PROverview',
  'PRDatabase',
  'PRPitches',
  'PRCoverage',
  'PRDistribution',
  'PRSettings',
];

const REQUIRED_COMPONENTS = [
  'PRWorkSurfaceShell',
  'DistributionDecisionMatrix',
  'ContactDetailDrawer',
  'PitchComposer',
  'AttentionQueue',
  'CopilotSuggestions',
  'MediaContactTable',
  'RelationshipBadge',
  'TopicCurrencyIndicator',
];

const REQUIRED_TYPES = [
  'MediaContact',
  'Pitch',
  'Coverage',
  'Distribution',
  'PressRelease',
  'DistributionTrack',
  'AutomationMode',
  'RelationshipStage',
  'EntityType',
];

// Patterns that indicate actual autopilot/auto-send implementation (not just disclaimers)
const FORBIDDEN_PATTERNS = [
  { pattern: /autoSend\s*[=:]\s*true/i, reason: 'No auto-send allowed for pitches' },
  { pattern: /enableAutoSend/i, reason: 'No auto-send allowed for pitches' },
  { pattern: /mode:\s*['"]autopilot['"].*pitch/i, reason: 'Pitches must be manual or copilot only' },
  { pattern: /modeCeiling:\s*['"]autopilot['"].*send_pitch/i, reason: 'send_pitch cannot have autopilot ceiling' },
];

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  warnings: [],
};

function log(type, message) {
  const icons = { pass: '\u2713', fail: '\u2717', warn: '\u26A0', info: '\u2022' };
  console.log(`  ${icons[type] || icons.info} ${message}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(ROOT, filePath);
  if (fs.existsSync(fullPath)) {
    log('pass', `${description} exists`);
    results.passed++;
    return true;
  } else {
    log('fail', `${description} missing: ${filePath}`);
    results.failed++;
    results.errors.push(`Missing: ${filePath}`);
    return false;
  }
}

function checkFileContains(filePath, patterns, description) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) {
    log('fail', `Cannot check ${description}: file missing`);
    results.failed++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const missing = patterns.filter((p) => !content.includes(p));

  if (missing.length === 0) {
    log('pass', `${description} exports all required items`);
    results.passed++;
    return true;
  } else {
    log('fail', `${description} missing exports: ${missing.join(', ')}`);
    results.failed++;
    results.errors.push(`Missing exports in ${filePath}: ${missing.join(', ')}`);
    return false;
  }
}

function checkForbiddenPatterns(filePath, patterns) {
  const fullPath = path.join(ROOT, filePath);
  if (!fs.existsSync(fullPath)) return true;

  const content = fs.readFileSync(fullPath, 'utf-8');
  let clean = true;

  for (const { pattern, reason } of patterns) {
    if (pattern.test(content)) {
      log('fail', `Forbidden pattern in ${filePath}: ${reason}`);
      results.failed++;
      results.errors.push(`Forbidden pattern in ${filePath}: ${reason}`);
      clean = false;
    }
  }

  if (clean) {
    log('pass', `${path.basename(filePath)} has no forbidden patterns`);
    results.passed++;
  }

  return clean;
}

function checkDistributionTracks() {
  const distributionPath = 'src/components/pr-work-surface/components/DistributionDecisionMatrix.tsx';
  const fullPath = path.join(ROOT, distributionPath);

  if (!fs.existsSync(fullPath)) {
    log('fail', 'DistributionDecisionMatrix component missing');
    results.failed++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check for required track configurations
  const hasTrack1 = content.includes('citemind_aeo') || content.includes('CiteMind');
  const hasTrack2 = content.includes('legacy_wire') || content.includes('Traditional Wire');
  const hasDefaultOn = content.includes('defaultEnabled: true');
  const hasExplicitConfirmation = content.includes('requiresExplicitConfirmation');

  if (hasTrack1 && hasTrack2) {
    log('pass', 'Both distribution tracks configured (CiteMind AEO + Legacy Wire)');
    results.passed++;
  } else {
    log('fail', 'Missing distribution tracks - need CiteMind AEO and Legacy Wire');
    results.failed++;
  }

  if (hasDefaultOn) {
    log('pass', 'CiteMind AEO has defaultEnabled: true');
    results.passed++;
  } else {
    log('warn', 'CiteMind AEO should have defaultEnabled: true');
    results.warnings++;
  }

  if (hasExplicitConfirmation) {
    log('pass', 'Legacy Wire requires explicit confirmation');
    results.passed++;
  } else {
    log('warn', 'Legacy Wire should require explicit confirmation');
    results.warnings++;
  }

  return hasTrack1 && hasTrack2;
}

function checkAutomationCeilings() {
  const settingsPath = 'src/components/pr-work-surface/views/PRSettings.tsx';
  const fullPath = path.join(ROOT, settingsPath);

  if (!fs.existsSync(fullPath)) {
    log('fail', 'PRSettings view missing - cannot verify automation ceilings');
    results.failed++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check for automation ceiling definitions
  const hasCeilings = content.includes('AutomationCeiling') || content.includes('modeCeiling');
  const hasManualPitch = content.includes("send_pitch") && content.includes("'manual'");
  const hasCopilotFollowup = content.includes("send_followup") && content.includes("'copilot'");

  if (hasCeilings) {
    log('pass', 'Automation ceilings are defined');
    results.passed++;
  } else {
    log('warn', 'Automation ceilings should be explicitly defined');
    results.warnings++;
  }

  if (hasManualPitch) {
    log('pass', 'send_pitch action is manual-only');
    results.passed++;
  } else {
    log('warn', 'send_pitch should be manual-only (ceiling: manual)');
    results.warnings++;
  }

  return hasCeilings;
}

// Main execution
console.log('\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log(' PR WORK SURFACE V1 GUARDRAIL CHECK');
console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n');

// 1. Check required views
console.log('\n1. Required Views:');
for (const view of REQUIRED_VIEWS) {
  checkFileExists(`src/components/pr-work-surface/views/${view}.tsx`, view);
}

// 2. Check required components
console.log('\n2. Required Components:');
checkFileExists('src/components/pr-work-surface/PRWorkSurfaceShell.tsx', 'PRWorkSurfaceShell');
for (const comp of REQUIRED_COMPONENTS.filter((c) => c !== 'PRWorkSurfaceShell')) {
  checkFileExists(`src/components/pr-work-surface/components/${comp}.tsx`, comp);
}

// 3. Check types export
console.log('\n3. Type Exports:');
checkFileContains('src/components/pr-work-surface/types.ts', REQUIRED_TYPES, 'types.ts');

// 4. Check index barrel exports
console.log('\n4. Index Exports:');
checkFileContains(
  'src/components/pr-work-surface/index.ts',
  [...REQUIRED_VIEWS, 'PRWorkSurfaceShell', 'DistributionDecisionMatrix'],
  'index.ts'
);

// 5. Check for forbidden autopilot patterns
console.log('\n5. Forbidden Patterns Check:');
const viewFiles = REQUIRED_VIEWS.map((v) => `src/components/pr-work-surface/views/${v}.tsx`);
for (const file of viewFiles) {
  checkForbiddenPatterns(file, FORBIDDEN_PATTERNS);
}

// 6. Check distribution tracks
console.log('\n6. Distribution Tracks:');
checkDistributionTracks();

// 7. Check automation ceilings
console.log('\n7. Automation Ceilings:');
checkAutomationCeilings();

// 8. Check main page exists
console.log('\n8. Main Page:');
checkFileExists('src/app/app/pr/page.tsx', 'PR Work Surface page');

// 9. Check legacy quarantine
console.log('\n9. Legacy Quarantine:');
checkFileExists('src/app/app/pr-legacy/page.tsx', 'Legacy PR page (quarantined)');

// Summary
console.log('\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log(' SUMMARY');
console.log('\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
console.log(`  Passed:   ${results.passed}`);
console.log(`  Failed:   ${results.failed}`);
console.log(`  Warnings: ${results.warnings}`);

if (results.failed > 0) {
  console.log('\n\u2717 PR Work Surface V1 guardrails FAILED');
  console.log('\nErrors:');
  results.errors.forEach((e) => console.log(`  - ${e}`));
  process.exit(1);
} else {
  console.log('\n\u2713 PR Work Surface V1 guardrails PASSED');
  process.exit(0);
}
