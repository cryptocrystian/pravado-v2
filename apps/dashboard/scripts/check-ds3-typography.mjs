#!/usr/bin/env node

/**
 * DS 3.0 Typography Enforcement Guard
 * Sprint S100.1: Expanded to scan whole dashboard with baseline allowlist
 *
 * FAILS if any of the following are found:
 * 1. text-[9px], text-[10px], text-[11px], text-[12px], text-xs without uppercase + tracking-wider
 *    (these sizes are ONLY allowed for uppercase labels with tracking)
 * 2. Semantic content (descriptions, metadata, timestamps) below 13px
 *
 * DS 3.0 Typography Rules:
 * - Minimum semantic text: 13px (text-[13px] or text-sm)
 * - Uppercase labels: 10-11px with font-bold + tracking-wider is acceptable
 * - Body text: 15-16px preferred for sustained reading
 * - Weight-driven hierarchy: Use font-semibold/font-bold, not just color opacity
 *
 * DS v3 Typography Tokens (use these instead of arbitrary sizes):
 * - text-body: 14px body text
 * - text-meta: 12px metadata (use sparingly)
 * - text-micro: 11px uppercase labels only
 * - text-heading-*: heading sizes
 *
 * Exceptions allowed via:
 *   - Inline comments: // ds3-allow: reason
 *   - Baseline allowlist file: scripts/.ds3-typography-allowlist.json
 *
 * Usage:
 *   node scripts/check-ds3-typography.mjs              # Fails on NEW violations
 *   node scripts/check-ds3-typography.mjs --warn       # Warns only, exit 0
 *   node scripts/check-ds3-typography.mjs --all        # Include allowlisted files
 *   node scripts/check-ds3-typography.mjs --update     # Update baseline allowlist
 *
 * @see /docs/canon/DS_v3_PRINCIPLES.md
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const WARN_ONLY = process.argv.includes('--warn');
const INCLUDE_ALL = process.argv.includes('--all');
const UPDATE_BASELINE = process.argv.includes('--update');

// Allowlist file path
const ALLOWLIST_PATH = join(__dirname, '.ds3-typography-allowlist.json');

// Directories to scan for DS 3.0 enforcement (expanded to whole dashboard)
const SCAN_DIRS = [
  'src/app',
  'src/components',
  'src/features',
];

// Directories to skip entirely
const SKIP_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'build',
];

// Patterns that are only allowed with uppercase + tracking-wider
const SMALL_TEXT_PATTERN = /text-\[(9|10|11|12)px\]|text-xs/g;

// Pattern to detect uppercase + tracking (valid exception)
const UPPERCASE_TRACKING_PATTERN = /uppercase.*tracking|tracking.*uppercase|font-bold.*uppercase.*tracking|uppercase.*font-bold.*tracking|text-micro/i;

// Forbidden patterns that are never acceptable
const FORBIDDEN_PATTERNS = [
  {
    regex: /text-\[([1-8])px\]/g,
    name: 'micro-text',
    message: 'Text smaller than 9px found - never acceptable',
    fix: 'Use minimum text-[13px] or text-body token',
  },
  {
    regex: /\btext-slate-\d{2,3}\b/g,
    name: 'slate-color',
    message: 'text-slate-* color found (use DS v3 tokens)',
    fix: 'Replace with text-white/XX opacity variant or var(--slate-X)',
  },
  {
    regex: /\btext-gray-\d{2,3}\b/g,
    name: 'gray-color',
    message: 'text-gray-* color found (use DS v3 tokens)',
    fix: 'Replace with text-white/XX opacity variant or var(--slate-X)',
  },
];

// Allowlist marker patterns (inline comments)
const ALLOWLIST_MARKERS = [
  'ds3-allow:',
  'typography-allow:',
  'contrast-allow:',
];

// Load baseline allowlist
function loadAllowlist() {
  try {
    if (existsSync(ALLOWLIST_PATH)) {
      const content = readFileSync(ALLOWLIST_PATH, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Ignore parse errors
  }
  return { files: [], patterns: {} };
}

// Save baseline allowlist
function saveAllowlist(allowlist) {
  const content = JSON.stringify(allowlist, null, 2) + '\n';
  writeFileSync(ALLOWLIST_PATH, content, 'utf-8');
}

function checkSmallTextViolation(line, lineContent) {
  SMALL_TEXT_PATTERN.lastIndex = 0;
  const smallTextMatches = [...lineContent.matchAll(SMALL_TEXT_PATTERN)];

  if (smallTextMatches.length === 0) return [];

  const violations = [];

  for (const match of smallTextMatches) {
    // Check if this line has valid uppercase + tracking exception
    const hasUppercaseTracking = UPPERCASE_TRACKING_PATTERN.test(lineContent);
    const hasFontBold = /font-bold|font-semibold/.test(lineContent);

    // If it's an uppercase label with tracking, it's valid
    if (hasUppercaseTracking && hasFontBold) {
      continue;
    }

    // Also allow text-meta class (DS v3 token)
    if (lineContent.includes('text-meta')) {
      continue;
    }

    violations.push({
      line,
      column: match.index + 1,
      pattern: 'small-semantic-text',
      message: `${match[0]} found without uppercase + tracking-wider (use text-body/text-meta tokens)`,
      found: match[0],
      context: lineContent.trim().substring(0, 120),
      fix: 'Replace with text-body (14px) or text-meta (12px) token, or add "uppercase tracking-wider font-bold" for labels',
    });
  }

  return violations;
}

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, lineIndex) => {
    // Skip if line has any allowlist marker
    if (ALLOWLIST_MARKERS.some(marker => line.includes(marker))) {
      return;
    }

    // Check for absolutely forbidden patterns
    FORBIDDEN_PATTERNS.forEach(({ regex, name, message, fix }) => {
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
          context: line.trim().substring(0, 120),
          fix,
        });
      }
    });

    // Check for small text that needs uppercase + tracking
    const smallTextViolations = checkSmallTextViolation(lineIndex + 1, line);
    for (const v of smallTextViolations) {
      violations.push({
        file: filePath,
        ...v,
      });
    }
  });

  return violations;
}

function shouldSkipDir(dirName) {
  return SKIP_DIRS.some(skip => dirName === skip || dirName.startsWith('.'));
}

function scanDirectory(dir) {
  const violations = [];
  const basePath = process.cwd();
  const fullPath = join(basePath, dir);

  try {
    const entries = readdirSync(fullPath, { withFileTypes: true });

    for (const entry of entries) {
      if (shouldSkipDir(entry.name)) continue;

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
      console.log(`  Line ${v.line}: \x1b[31m${v.found}\x1b[0m`);
      console.log(`    ${v.message}`);
      console.log(`    \x1b[90m${v.context}\x1b[0m`);
    }
    console.log();
  }
}

function main() {
  console.log('DS 3.0 Typography Enforcement Guard');
  console.log('====================================\n');
  console.log('Scanning: src/app/**, src/components/**, src/features/**\n');
  console.log('DS v3 Typography Rules:');
  console.log('  - Minimum semantic text: 13px (use text-body token)');
  console.log('  - Meta text: 12px (use text-meta token, sparingly)');
  console.log('  - Micro text: 11px (use text-micro, ONLY uppercase labels)');
  console.log('  - No raw text-slate-* or text-gray-* (use DS v3 tokens)\n');

  const allowlist = loadAllowlist();
  let allViolations = [];

  for (const dir of SCAN_DIRS) {
    allViolations.push(...scanDirectory(dir));
  }

  // Filter out allowlisted files unless --all flag is used
  const baselineFiles = new Set(allowlist.files || []);
  let newViolations = allViolations;

  if (!INCLUDE_ALL && baselineFiles.size > 0) {
    newViolations = allViolations.filter(v => {
      const relPath = relative(process.cwd(), v.file);
      return !baselineFiles.has(relPath);
    });

    const skippedCount = allViolations.length - newViolations.length;
    if (skippedCount > 0) {
      console.log(`\x1b[90mSkipping ${skippedCount} violations in ${baselineFiles.size} grandfathered files.\x1b[0m`);
      console.log(`\x1b[90m(Use --all to see all violations)\x1b[0m\n`);
    }
  }

  // Update baseline if requested
  if (UPDATE_BASELINE) {
    const filesWithViolations = [...new Set(allViolations.map(v => relative(process.cwd(), v.file)))];
    allowlist.files = filesWithViolations;
    allowlist.lastUpdated = new Date().toISOString();
    allowlist.totalViolations = allViolations.length;
    saveAllowlist(allowlist);
    console.log(`\x1b[32m✓ Updated baseline allowlist with ${filesWithViolations.length} files.\x1b[0m`);
    console.log(`  Path: ${relative(process.cwd(), ALLOWLIST_PATH)}\n`);
    process.exit(0);
  }

  if (newViolations.length === 0) {
    console.log('\x1b[32m✓ No NEW typography violations found.\x1b[0m\n');
    if (allViolations.length > 0) {
      console.log(`\x1b[90mNote: ${allViolations.length} existing violations in grandfathered files.\x1b[0m`);
      console.log('\x1b[90mRun --all to see them, or fix them over time.\x1b[0m\n');
    }
    console.log('PASS: Typography compliant with DS v3 standards (no new regressions).');
    process.exit(0);
  }

  console.log(`Found ${newViolations.length} NEW DS 3.0 typography violation(s):\n`);
  printViolations(newViolations);

  // Show fix suggestions
  const patterns = [...new Set(newViolations.map(v => v.pattern))];
  console.log('Fix suggestions:');
  for (const pattern of patterns) {
    const example = newViolations.find(v => v.pattern === pattern);
    if (example?.fix) {
      console.log(`  ${pattern}: ${example.fix}`);
    }
  }

  console.log('\nDS v3 Typography Tokens (use instead of arbitrary sizes):');
  console.log('  text-body     - 14px body text');
  console.log('  text-body-lg  - 16px larger body text');
  console.log('  text-meta     - 12px metadata (secondary info)');
  console.log('  text-micro    - 11px uppercase labels ONLY');
  console.log('  text-heading-* - heading sizes (xl/lg/md/sm)');

  console.log('\nTo allowlist specific cases, add inline comment:');
  console.log('  // ds3-allow: uppercase-label');
  console.log('  // ds3-allow: avatar-initial');
  console.log('  // ds3-allow: numeric-badge\n');

  if (WARN_ONLY) {
    console.log('\x1b[33mWARN: DS 3.0 typography violations found (--warn mode, not failing).\x1b[0m');
    process.exit(0);
  } else {
    console.log('\x1b[31mFAIL: NEW DS 3.0 typography violations found.\x1b[0m');
    console.log('Run with --warn to see violations without failing.');
    console.log('Run with --update to add current files to baseline allowlist.');
    process.exit(1);
  }
}

main();
