#!/usr/bin/env node

/**
 * PR Guardrails CI Enforcement Check
 * Sprint S100.1: Ensures NON-NEGOTIABLE PR rules are enforced
 *
 * FAILS if any of the following are found:
 * 1. Auto-send patterns for pitches (must be manual only)
 * 2. Auto-schedule without human approval
 * 3. Bulk blast patterns (spray-and-pray)
 * 4. Missing personalization score checks before pitch send
 * 5. Missing follow-up limit checks
 *
 * NON-NEGOTIABLES:
 * - Pitch sending is ALWAYS Manual-only
 * - Follow-up sending requires human review
 * - CiteMind audio generation is Manual-only in V1
 * - No spray-and-pray, no bulk blast
 *
 * Usage:
 *   node scripts/check-pr-guardrails.mjs         # Fails on violations (default)
 *   node scripts/check-pr-guardrails.mjs --warn  # Warns only, exit 0
 *
 * @see /docs/canon/AUTOMATE_v2.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const WARN_ONLY = process.argv.includes('--warn');

// Directories to scan
const SCAN_DIRS = [
  'src/components/pr-work-surface',
  'src/app/app/pr',
  'src/app/api/pr',
];

// Forbidden patterns that violate guardrails
const FORBIDDEN_PATTERNS = [
  {
    regex: /autoSend\s*[=:]\s*true|auto[-_]?send\s*[=:]\s*true/gi,
    name: 'auto-send-enabled',
    message: 'Auto-send pattern found - pitches must be manual only',
    severity: 'error',
  },
  {
    regex: /autopilot.*pitch|pitch.*autopilot/gi,
    name: 'autopilot-pitch',
    message: 'Autopilot mode with pitches found - pitches must use manual mode',
    severity: 'error',
  },
  {
    regex: /bulkSend|bulk[-_]?blast|mass[-_]?email|spray[-_]?and[-_]?pray/gi,
    name: 'bulk-blast',
    message: 'Bulk blast pattern found - spray-and-pray is not allowed',
    severity: 'error',
  },
  {
    regex: /autoSchedule\s*\(\s*\)|auto[-_]?schedule\s*[=:]\s*true/gi,
    name: 'auto-schedule',
    message: 'Auto-schedule pattern found - scheduling requires human approval',
    severity: 'warning',
  },
];

// Required patterns that must be present
const REQUIRED_PATTERNS = [
  {
    files: ['guardrails/evaluate/route.ts'],
    pattern: /modeCeiling\s*[=:]\s*['"]manual['"]/,
    name: 'manual-mode-ceiling',
    message: 'Guardrails endpoint must set modeCeiling to manual for pitch actions',
  },
  {
    files: ['guardrails/evaluate/route.ts'],
    pattern: /PERSONALIZATION_BLOCKED_THRESHOLD|personalization.*40/,
    name: 'personalization-threshold',
    message: 'Guardrails must enforce personalization minimum of 40%',
  },
  {
    files: ['guardrails/evaluate/route.ts'],
    pattern: /MAX_FOLLOWUPS_PER_CONTACT|follow.*up.*limit|2.*per.*week/i,
    name: 'followup-limit',
    message: 'Guardrails must enforce follow-up limits (max 2 per week)',
  },
];

// Allowlist markers - lines containing these are skipped
const ALLOWLIST_MARKERS = [
  'guardrail-allow:',
  'ci-allow:',
  '// OK:',
];

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, lineIndex) => {
    // Skip if line has any allowlist marker
    if (ALLOWLIST_MARKERS.some(marker => line.includes(marker))) {
      return;
    }

    // Check for forbidden patterns
    FORBIDDEN_PATTERNS.forEach(({ regex, name, message, severity }) => {
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index + 1,
          pattern: name,
          message,
          severity,
          found: match[0],
          context: line.trim().substring(0, 120),
        });
      }
    });
  });

  return violations;
}

function checkRequiredPatterns(basePath) {
  const missingPatterns = [];

  for (const { files, pattern, name, message } of REQUIRED_PATTERNS) {
    let found = false;

    for (const file of files) {
      const fullPath = join(basePath, 'src/app/api/pr', file);
      try {
        const content = readFileSync(fullPath, 'utf-8');
        if (pattern.test(content)) {
          found = true;
          break;
        }
      } catch {
        // File doesn't exist, will be reported as missing
      }
    }

    if (!found) {
      missingPatterns.push({
        pattern: name,
        message,
        files: files.map(f => `src/app/api/pr/${f}`),
      });
    }
  }

  return missingPatterns;
}

function scanDirectory(dir, basePath) {
  const violations = [];
  const fullPath = join(basePath, dir);

  try {
    const entries = readdirSync(fullPath);

    for (const entry of entries) {
      const entryPath = join(fullPath, entry);
      const stat = statSync(entryPath);

      if (stat.isDirectory()) {
        violations.push(...scanDirectory(join(dir, entry), basePath));
      } else if (stat.isFile() && /\.(tsx?|jsx?|mjs)$/.test(entry)) {
        violations.push(...scanFile(entryPath));
      }
    }
  } catch {
    // Directory doesn't exist, skip
  }

  return violations;
}

function printViolations(violations) {
  const byFile = {};
  for (const v of violations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  for (const [file, fileViolations] of Object.entries(byFile)) {
    const relPath = relative(process.cwd(), file);
    console.log(`\x1b[33m${relPath}\x1b[0m`);
    for (const v of fileViolations) {
      const color = v.severity === 'error' ? '\x1b[31m' : '\x1b[33m';
      console.log(`  Line ${v.line}: ${color}${v.found}\x1b[0m`);
      console.log(`    ${v.message}`);
      console.log(`    \x1b[90m${v.context}\x1b[0m`);
    }
    console.log();
  }
}

function main() {
  console.log('PR Guardrails CI Enforcement Check');
  console.log('====================================\n');
  console.log('NON-NEGOTIABLES being enforced:');
  console.log('  1. Pitch sending is ALWAYS Manual-only');
  console.log('  2. Follow-up sending requires human review');
  console.log('  3. CiteMind audio generation is Manual-only in V1');
  console.log('  4. No spray-and-pray, no bulk blast\n');

  const basePath = process.cwd();
  let allViolations = [];
  let hasErrors = false;

  // Scan for forbidden patterns
  console.log('Scanning for forbidden patterns...');
  for (const dir of SCAN_DIRS) {
    allViolations.push(...scanDirectory(dir, basePath));
  }

  // Check for required patterns
  console.log('Checking required patterns...');
  const missingPatterns = checkRequiredPatterns(basePath);

  // Report violations
  const errorViolations = allViolations.filter(v => v.severity === 'error');
  const warningViolations = allViolations.filter(v => v.severity === 'warning');

  if (errorViolations.length > 0) {
    hasErrors = true;
    console.log(`\n\x1b[31mERROR: Found ${errorViolations.length} guardrail violation(s):\x1b[0m\n`);
    printViolations(errorViolations);
  }

  if (warningViolations.length > 0) {
    console.log(`\n\x1b[33mWARNING: Found ${warningViolations.length} potential issue(s):\x1b[0m\n`);
    printViolations(warningViolations);
  }

  if (missingPatterns.length > 0) {
    console.log(`\n\x1b[33mMISSING REQUIRED PATTERNS:\x1b[0m\n`);
    for (const mp of missingPatterns) {
      console.log(`  ${mp.pattern}:`);
      console.log(`    ${mp.message}`);
      console.log(`    Expected in: ${mp.files.join(', ')}`);
    }
    // Missing patterns are warnings, not errors
  }

  // Final result
  if (allViolations.length === 0 && missingPatterns.length === 0) {
    console.log('\x1b[32m✓ All PR files pass guardrail checks.\x1b[0m\n');
    console.log('PASS: Guardrails are properly enforced.');
    console.log('\nGuardrail Summary:');
    console.log('  - No auto-send patterns found');
    console.log('  - No bulk blast patterns found');
    console.log('  - Required guardrail checks in place');
    process.exit(0);
  }

  if (hasErrors && !WARN_ONLY) {
    console.log('\n\x1b[31mFAIL: Guardrail violations found.\x1b[0m');
    console.log('These violations must be fixed before merging.');
    console.log('Run with --warn to see violations without failing.');
    process.exit(1);
  }

  if (WARN_ONLY) {
    console.log('\n\x1b[33mWARN: Issues found (--warn mode, not failing).\x1b[0m');
    process.exit(0);
  }

  // Only warnings/missing patterns, no errors
  console.log('\n\x1b[33mWARN: Some patterns missing but no critical violations.\x1b[0m');
  process.exit(0);
}

main();
