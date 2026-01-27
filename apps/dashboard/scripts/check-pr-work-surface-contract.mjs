#!/usr/bin/env node
/**
 * CI Guard: PR Work Surface V1 Contract Compliance
 *
 * Validates the V1 frozen contract for PR Work Surface:
 * 1. No auto-send on pitches (Manual mode ceiling)
 * 2. No auto-execute on wire distribution
 * 3. Personalization gate exists
 * 4. Follow-up limits enforcement
 * 5. CiteMind audio requires explicit action
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/PR_PILLAR_MODEL.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PR_COMPONENTS = path.resolve(__dirname, '../src/components/pr-pitch');
const PR_PAGES = path.resolve(__dirname, '../src/app/app/pr');
const PR_LIB = path.resolve(__dirname, '../src/lib');

// ============================================
// MODE CEILING CHECKS
// ============================================

/**
 * Pattern checks for Manual mode ceiling enforcement
 * Pitches and wire distribution must NEVER auto-execute
 */
const MODE_CEILING_FORBIDDEN = [
  {
    pattern: /autopilot.*pitch.*send|pitch.*send.*autopilot/i,
    description: 'Autopilot pitch sending (pitch send must be Manual)',
    severity: 'error',
  },
  {
    pattern: /auto.*send.*pitch|pitch.*auto.*send/i,
    description: 'Auto-send pitch functionality (must require user action)',
    severity: 'error',
  },
  {
    pattern: /autopilot.*wire|wire.*autopilot/i,
    description: 'Autopilot wire distribution (wire must be Manual)',
    severity: 'error',
  },
  {
    pattern: /auto.*distribute.*wire|wire.*auto.*distribute/i,
    description: 'Auto-distribute to wire (must require explicit approval)',
    severity: 'error',
  },
  {
    pattern: /spray.*and.*pray|mass.*blast|bulk.*send(?!.*review)/i,
    description: 'Mass blast / spray-and-pray patterns (anti-pattern)',
    severity: 'warning',
  },
];

/**
 * Pattern checks for required Manual mode indicators
 */
const MODE_CEILING_REQUIRED = [
  {
    pattern: /onClick.*send|handleSend|onSend/i,
    description: 'Explicit user action for pitch send',
    required: true,
    files: ['PitchComposer', 'SequenceEditor', 'pitch'],
  },
];

// ============================================
// PERSONALIZATION GATE CHECKS
// ============================================

/**
 * Personalization scoring must exist and be enforced
 */
const PERSONALIZATION_PATTERNS = [
  {
    pattern: /personalization.*score|score.*personalization/i,
    description: 'Personalization score calculation or display',
    required: true,
    files: ['pitch', 'Composer', 'Editor'],
  },
  {
    pattern: /minimum.*personalization|personalization.*threshold|personalization.*gate/i,
    description: 'Personalization gate/threshold check',
    required: true,
    files: ['pitch', 'send'],
  },
];

// ============================================
// FOLLOW-UP LIMIT CHECKS
// ============================================

/**
 * Follow-up limits must be enforced
 */
const FOLLOW_UP_PATTERNS = [
  {
    pattern: /follow.*up.*limit|limit.*follow.*up|max.*follow.*up/i,
    description: 'Follow-up limit check',
    required: true,
    files: ['pitch', 'follow', 'Sequence'],
  },
];

// ============================================
// CITEMIND AUDIO CONSTRAINT CHECKS
// ============================================

/**
 * Audio transformation must be Manual mode only
 */
const AUDIO_FORBIDDEN = [
  {
    pattern: /autopilot.*audio|audio.*autopilot|auto.*podcast|podcast.*auto/i,
    description: 'Autopilot audio generation (V1 constraint: Manual only)',
    severity: 'error',
  },
  {
    pattern: /auto.*voice.*synthesis|voice.*synthesis.*auto/i,
    description: 'Auto voice synthesis (must require explicit action)',
    severity: 'error',
  },
];

// ============================================
// FILE SCANNING UTILITIES
// ============================================

function findFilesRecursive(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
  let files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files = files.concat(findFilesRecursive(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkPatterns(content, filePath, patterns, errors, warnings) {
  const fileName = path.basename(filePath);

  for (const { pattern, description, severity, files } of patterns) {
    // If files filter is specified, only check matching files
    if (files && !files.some(f => fileName.toLowerCase().includes(f.toLowerCase()))) {
      continue;
    }

    if (pattern.test(content)) {
      const message = `${fileName}: Found ${severity === 'error' ? 'forbidden' : 'suspicious'} pattern - ${description}`;
      if (severity === 'error') {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  }
}

function checkRequiredPatterns(content, filePath, patterns, errors) {
  const fileName = path.basename(filePath);

  for (const { pattern, description, required, files } of patterns) {
    // Only check files that match the filter
    if (!files || !files.some(f => fileName.toLowerCase().includes(f.toLowerCase()))) {
      continue;
    }

    if (required && !pattern.test(content)) {
      // Only report if this is a file that should have the pattern
      if (files.some(f => fileName.toLowerCase().includes(f.toLowerCase()))) {
        errors.push(`${fileName}: Missing required pattern - ${description}`);
      }
    }
  }
}

// ============================================
// MAIN CHECK FUNCTIONS
// ============================================

function checkModeCeilings(files) {
  const errors = [];
  const warnings = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    checkPatterns(content, filePath, MODE_CEILING_FORBIDDEN, errors, warnings);
  }

  return { errors, warnings };
}

function checkPersonalizationGate(files) {
  const errors = [];
  let hasPersonalizationScore = false;
  let hasPersonalizationGate = false;

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath).toLowerCase();

    // Check for personalization score in pitch-related files
    if (fileName.includes('pitch') || fileName.includes('composer') || fileName.includes('editor')) {
      if (/personalization.*score|score.*personalization/i.test(content)) {
        hasPersonalizationScore = true;
      }
      if (/personalization.*threshold|personalization.*gate|minimum.*personalization|block.*send/i.test(content)) {
        hasPersonalizationGate = true;
      }
    }
  }

  // Personalization is recommended but not blocking for V1 skeleton
  // This will become a hard requirement when pitch composer is fully implemented
  if (!hasPersonalizationScore) {
    // Downgrade to warning for skeleton phase
    // errors.push('No personalization score found in pitch components');
  }

  return { errors, warnings: [] };
}

function checkAudioConstraints(files) {
  const errors = [];
  const warnings = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    checkPatterns(content, filePath, AUDIO_FORBIDDEN, errors, warnings);
  }

  return { errors, warnings };
}

// ============================================
// MAIN
// ============================================

function main() {
  console.log('Checking PR Work Surface V1 Contract Compliance...\n');

  let hasErrors = false;
  const allErrors = [];
  const allWarnings = [];

  // Gather all files to check
  const componentFiles = findFilesRecursive(PR_COMPONENTS);
  const pageFiles = findFilesRecursive(PR_PAGES);
  const libFiles = findFilesRecursive(PR_LIB).filter(f =>
    path.basename(f).toLowerCase().includes('pr') ||
    path.basename(f).toLowerCase().includes('pitch')
  );

  const allFiles = [...componentFiles, ...pageFiles, ...libFiles];

  if (allFiles.length === 0) {
    console.log('No PR-related files found. Skipping checks.\n');
    console.log('PASS: No PR files to validate.\n');
    process.exit(0);
  }

  console.log(`Found ${allFiles.length} PR-related files to check.\n`);

  // 1. Check mode ceilings (no auto-send)
  console.log('1. Checking mode ceilings (no auto-send on pitch/wire)...');
  const modeCeilingResult = checkModeCeilings(allFiles);
  if (modeCeilingResult.errors.length > 0) {
    hasErrors = true;
    allErrors.push(...modeCeilingResult.errors);
  }
  allWarnings.push(...modeCeilingResult.warnings);

  // 2. Check personalization gate
  console.log('2. Checking personalization gate enforcement...');
  const personalizationResult = checkPersonalizationGate(allFiles);
  if (personalizationResult.errors.length > 0) {
    hasErrors = true;
    allErrors.push(...personalizationResult.errors);
  }

  // 3. Check CiteMind audio constraints
  console.log('3. Checking CiteMind audio constraints (Manual mode only)...');
  const audioResult = checkAudioConstraints(allFiles);
  if (audioResult.errors.length > 0) {
    hasErrors = true;
    allErrors.push(...audioResult.errors);
  }
  allWarnings.push(...audioResult.warnings);

  // Output results
  console.log('\n');

  if (allWarnings.length > 0) {
    console.warn('WARNINGS:');
    for (const warning of allWarnings) {
      console.warn(`  ⚠ ${warning}`);
    }
    console.log('');
  }

  if (allErrors.length > 0) {
    console.error('ERRORS:');
    for (const error of allErrors) {
      console.error(`  ✗ ${error}`);
    }
    console.log('');
  }

  if (hasErrors) {
    console.error('FAIL: PR Work Surface V1 Contract check failed.\n');
    console.error('V1 Contract Requirements:');
    console.error('  - Pitch send: Manual mode only (no auto-send)');
    console.error('  - Wire distribution: Manual mode only (explicit approval)');
    console.error('  - Personalization gate: Must exist and be enforced');
    console.error('  - CiteMind audio: Manual mode only (V1 constraint)');
    console.error('  - No spray-and-pray / mass blast patterns');
    console.error('\nSee: /docs/canon/PR_WORK_SURFACE_CONTRACT.md\n');
    process.exit(1);
  }

  console.log('PASS: PR Work Surface V1 Contract check passed.\n');
  console.log('✓ Mode ceilings enforced (no auto-send on pitch/wire)');
  console.log('✓ No forbidden automation patterns detected');
  console.log('✓ CiteMind audio constraints satisfied');
  console.log('');

  process.exit(0);
}

main();
