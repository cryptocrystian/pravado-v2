#!/usr/bin/env node

/**
 * Command Center Typography Guard
 *
 * Warns/fails if text-[10px] or smaller appears in command-center scope,
 * except for explicit allowlist comments (typography-allow:).
 *
 * Minimum readable size: text-[11px] or text-xs (12px)
 *
 * Usage:
 *   node scripts/check-command-center-typography.mjs
 *   node scripts/check-command-center-typography.mjs --fail  # Exit 1 on violations
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const FAIL_ON_VIOLATIONS = process.argv.includes('--fail');

// Directories to scan
const SCAN_DIRS = [
  'src/components/command-center',
  'src/app/app/command-center',
];

// Forbidden small text patterns (10px or smaller)
const FORBIDDEN_PATTERNS = [
  { regex: /text-\[([1-9]|10)px\]/g, name: 'text-[1-10px]' },
];

// Allowlist marker
const ALLOWLIST_MARKER = 'typography-allow:';

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, lineIndex) => {
    // Skip if line has allowlist marker
    if (line.includes(ALLOWLIST_MARKER)) {
      return;
    }

    FORBIDDEN_PATTERNS.forEach(({ regex, name }) => {
      // Reset regex state
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index + 1,
          pattern: name,
          found: match[0],
          context: line.trim().substring(0, 80),
        });
      }
    });
  });

  return violations;
}

function scanDirectory(dir) {
  const violations = [];
  const basePath = process.cwd();
  const fullPath = join(basePath, dir);

  try {
    const entries = readdirSync(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = join(fullPath, entry.name);

      if (entry.isDirectory()) {
        violations.push(...scanDirectory(join(dir, entry.name)));
      } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
        violations.push(...scanFile(entryPath));
      }
    }
  } catch (err) {
    // Directory doesn't exist, skip
  }

  return violations;
}

function main() {
  console.log('Checking Command Center typography (minimum text-[11px])...\n');

  let allViolations = [];

  for (const dir of SCAN_DIRS) {
    allViolations.push(...scanDirectory(dir));
  }

  if (allViolations.length === 0) {
    console.log('✓ All Command Center files pass typography check.\n');
    console.log('No text smaller than 11px found (or properly allowlisted).\n');
    console.log('PASS: Command Center typography is compliant.');
    process.exit(0);
  }

  console.log(`Found ${allViolations.length} typography violation(s):\n`);

  const byFile = {};
  for (const v of allViolations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  for (const [file, violations] of Object.entries(byFile)) {
    const relPath = relative(process.cwd(), file);
    console.log(`\x1b[33m${relPath}\x1b[0m`);
    for (const v of violations) {
      console.log(`  Line ${v.line}: \x1b[31m${v.found}\x1b[0m`);
      console.log(`    ${v.context}`);
    }
    console.log();
  }

  console.log('To fix: Replace with text-[11px] or text-xs (12px) minimum.');
  console.log('To allowlist: Add "typography-allow:" comment on the same line.\n');

  if (FAIL_ON_VIOLATIONS) {
    console.log('\x1b[31mFAIL: Typography violations found.\x1b[0m');
    process.exit(1);
  } else {
    console.log('\x1b[33mWARN: Typography violations found (not failing build).\x1b[0m');
    process.exit(0);
  }
}

main();
