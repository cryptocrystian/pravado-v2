#!/usr/bin/env node

/**
 * Canon Integrity Check Script
 *
 * This script enforces canon integrity by checking:
 * A) Canon Index Completeness - All canon files are listed in README.md
 * B) No Spec Docs Outside Allowed Locations - Prevents doc drift
 *
 * Exit codes:
 * 0 - All checks passed
 * 1 - One or more checks failed
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ANSI colors for output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const CANON_DIR = join(ROOT_DIR, 'docs', 'canon');
const CANON_README = join(CANON_DIR, 'README.md');

// Allowed doc locations (outside of these, new/changed .md files are forbidden)
const ALLOWED_DOC_PATHS = [
  'docs/canon/',
  'docs/audit/',
  'docs/_archive/',
];

// Explicitly allowed root-level docs in docs/
const ALLOWED_ROOT_DOCS = [
  'docs/ARCHITECTURE.md',
  'docs/DEVELOPMENT.md',
  'docs/TESTING.md',
  'docs/DEPLOYMENT_GUIDE.md',
  'docs/FEATURE_FLAGS.md',
  'docs/auth_model.md',
  'docs/org_model.md',
];

let hasErrors = false;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function error(message) {
  log(`ERROR: ${message}`, RED);
  hasErrors = true;
}

function success(message) {
  log(`OK: ${message}`, GREEN);
}

function warn(message) {
  log(`WARN: ${message}`, YELLOW);
}

/**
 * A) Canon Index Completeness Check
 * Verifies that README.md contains an entry for every .md file in /docs/canon
 */
function checkCanonIndexCompleteness() {
  log('\n=== A) Canon Index Completeness Check ===\n');

  if (!existsSync(CANON_DIR)) {
    error(`Canon directory not found: ${CANON_DIR}`);
    return;
  }

  if (!existsSync(CANON_README)) {
    error(`Canon README not found: ${CANON_README}`);
    return;
  }

  // Get all .md files in canon directory (excluding README.md which is the index itself)
  const canonFiles = readdirSync(CANON_DIR)
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .sort();

  // Read README content
  const readmeContent = readFileSync(CANON_README, 'utf-8');

  const missingFromIndex = [];

  for (const file of canonFiles) {
    // Check if the filename appears in README (as a reference)
    // We look for the filename with backticks or as part of a table/list
    const patterns = [
      new RegExp(`\`${file}\``, 'i'),           // `filename.md`
      new RegExp(`\\|\\s*${file}\\s*\\|`, 'i'), // | filename.md |
      new RegExp(`-\\s*${file}`, 'i'),          // - filename.md
      new RegExp(`\\[${file}\\]`, 'i'),         // [filename.md]
    ];

    const isReferenced = patterns.some(p => p.test(readmeContent));

    if (!isReferenced) {
      missingFromIndex.push(file);
    }
  }

  if (missingFromIndex.length > 0) {
    error(`The following canon files are NOT listed in README.md:`);
    missingFromIndex.forEach(f => log(`  - ${f}`, RED));
    log('\nFix: Add these files to /docs/canon/README.md in the appropriate section.', YELLOW);
  } else {
    success(`All ${canonFiles.length} canon files are listed in README.md`);
  }

  // Also list the files for visibility
  log(`\nCanon files found (${canonFiles.length}):`);
  canonFiles.forEach(f => log(`  - ${f}`));
}

/**
 * B) No Spec Docs Outside Allowed Locations
 * Checks that changed/added .md files under docs/ are only in allowed paths
 */
function checkNoSpecDocsOutsideAllowed() {
  log('\n=== B) Spec Docs Location Check ===\n');

  // Get changed files using git
  let changedFiles = [];

  try {
    // Try to get diff against origin/main (PR context)
    changedFiles = execSync('git diff --name-only origin/main...HEAD 2>/dev/null', {
      cwd: ROOT_DIR,
      encoding: 'utf-8'
    }).trim().split('\n').filter(Boolean);
  } catch {
    try {
      // Fallback: diff against previous commit
      changedFiles = execSync('git diff --name-only HEAD~1...HEAD 2>/dev/null', {
        cwd: ROOT_DIR,
        encoding: 'utf-8'
      }).trim().split('\n').filter(Boolean);
    } catch {
      warn('Could not determine changed files via git. Skipping location check.');
      log('This check requires git history (PR or commit context).');
      return;
    }
  }

  if (changedFiles.length === 0) {
    log('No changed files detected. Skipping location check.');
    return;
  }

  log(`Changed files detected: ${changedFiles.length}`);

  // Filter to only docs/*.md files (not in allowed subdirectories)
  const docsChanges = changedFiles.filter(f => {
    // Must be under docs/
    if (!f.startsWith('docs/')) return false;
    // Must be a .md file
    if (!f.endsWith('.md')) return false;
    return true;
  });

  if (docsChanges.length === 0) {
    success('No documentation changes detected in this PR.');
    return;
  }

  log(`\nDoc changes found: ${docsChanges.length}`);

  const violations = [];

  for (const file of docsChanges) {
    // Check if it's in an allowed subdirectory
    const inAllowedSubdir = ALLOWED_DOC_PATHS.some(p => file.startsWith(p));

    // Check if it's an explicitly allowed root doc
    const isAllowedRootDoc = ALLOWED_ROOT_DOCS.includes(file);

    if (!inAllowedSubdir && !isAllowedRootDoc) {
      violations.push(file);
    }
  }

  if (violations.length > 0) {
    error('Spec docs found outside allowed locations:');
    violations.forEach(f => log(`  - ${f}`, RED));
    log('\nSpec docs must live in /docs/canon or be archived to /docs/_archive.', YELLOW);
    log('Allowed locations:', YELLOW);
    ALLOWED_DOC_PATHS.forEach(p => log(`  - ${p}`, YELLOW));
    log('Allowed root docs:', YELLOW);
    ALLOWED_ROOT_DOCS.forEach(p => log(`  - ${p}`, YELLOW));
  } else {
    success('All doc changes are in allowed locations.');
    docsChanges.forEach(f => log(`  - ${f}`));
  }
}

/**
 * Main execution
 */
function main() {
  log('===============================================');
  log('       PRAVADO Canon Integrity Check          ');
  log('===============================================');

  checkCanonIndexCompleteness();
  checkNoSpecDocsOutsideAllowed();

  log('\n===============================================');

  if (hasErrors) {
    log('FAILED: Canon integrity check failed!', RED);
    log('Please fix the issues above before merging.', RED);
    process.exit(1);
  } else {
    log('PASSED: All canon integrity checks passed!', GREEN);
    process.exit(0);
  }
}

main();
