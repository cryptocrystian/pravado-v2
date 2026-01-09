#!/usr/bin/env node

/**
 * Command Center Typography Guard
 *
 * FAILS if any of the following are found in command-center scope:
 * 1. text-[10px] or smaller (minimum: text-[11px])
 * 2. text-slate-* or text-gray-* colors (use white/xx tokens instead)
 *
 * Exceptions allowed via inline comments:
 *   // typography-allow: meta
 *   // typography-allow: badge
 *
 * Usage:
 *   node scripts/check-command-center-typography.mjs         # Fails on violations (default)
 *   node scripts/check-command-center-typography.mjs --warn  # Warns only, exit 0
 */

import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const WARN_ONLY = process.argv.includes('--warn');

// Directories to scan
const SCAN_DIRS = [
  'src/components/command-center',
  'src/app/app/command-center',
];

// Forbidden patterns with descriptions
const FORBIDDEN_PATTERNS = [
  {
    regex: /text-\[([1-9]|10)px\]/g,
    name: 'small-text',
    message: 'Text smaller than 11px found',
    fix: 'Replace with text-[11px] or text-xs (12px) minimum',
  },
  {
    regex: /\btext-slate-\d{2,3}\b/g,
    name: 'slate-color',
    message: 'text-slate-* color found (use white/xx tokens)',
    fix: 'Replace with text-white/XX opacity variant',
  },
  {
    regex: /\btext-gray-\d{2,3}\b/g,
    name: 'gray-color',
    message: 'text-gray-* color found (use white/xx tokens)',
    fix: 'Replace with text-white/XX opacity variant',
  },
];

// Allowlist marker patterns
const ALLOWLIST_MARKERS = [
  'typography-allow:',
  'contrast-allow:',
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

    FORBIDDEN_PATTERNS.forEach(({ regex, name, message }) => {
      // Reset regex state for each check
      regex.lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        violations.push({
          file: filePath,
          line: lineIndex + 1,
          column: match.index + 1,
          pattern: name,
          message,
          found: match[0],
          context: line.trim().substring(0, 100),
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
      console.log(`  Line ${v.line}: \x1b[31m${v.found}\x1b[0m (${v.message})`);
      console.log(`    ${v.context}`);
    }
    console.log();
  }
}

function main() {
  console.log('Command Center Typography Guard');
  console.log('================================\n');
  console.log('Checking for:');
  console.log('  - Text smaller than 11px');
  console.log('  - text-slate-* colors (should use white/xx)');
  console.log('  - text-gray-* colors (should use white/xx)\n');

  let allViolations = [];

  for (const dir of SCAN_DIRS) {
    allViolations.push(...scanDirectory(dir));
  }

  if (allViolations.length === 0) {
    console.log('\x1b[32m✓ All Command Center files pass typography check.\x1b[0m\n');
    console.log('PASS: Typography is compliant with DS v3 standards.');
    process.exit(0);
  }

  console.log(`Found ${allViolations.length} typography violation(s):\n`);
  printViolations(allViolations);

  // Show fix suggestions
  const patterns = [...new Set(allViolations.map(v => v.pattern))];
  console.log('Fix suggestions:');
  for (const pattern of patterns) {
    const patternInfo = FORBIDDEN_PATTERNS.find(p => p.name === pattern);
    if (patternInfo) {
      console.log(`  ${pattern}: ${patternInfo.fix}`);
    }
  }
  console.log('\nTo allowlist: Add "// typography-allow: <reason>" comment on the same line.\n');

  if (WARN_ONLY) {
    console.log('\x1b[33mWARN: Typography violations found (--warn mode, not failing).\x1b[0m');
    process.exit(0);
  } else {
    console.log('\x1b[31mFAIL: Typography violations found.\x1b[0m');
    process.exit(1);
  }
}

main();
