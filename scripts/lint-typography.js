#!/usr/bin/env node
/**
 * DS v3.1 Typography & Token Lint Guard
 *
 * Scans the PR Work Surface (and optionally other pillars) for:
 *   1. Sub-13px text in non-label contexts (the regression that keeps coming back)
 *   2. Forbidden legacy color tokens
 *   3. Non-existent semantic tokens (e.g. semantic-error)
 *
 * Usage:
 *   node scripts/lint-typography.js               # scan pr-work-surface only
 *   node scripts/lint-typography.js --all         # scan all pillar directories
 *   node scripts/lint-typography.js --fix-report  # print a fix-ready report
 *
 * Exit codes:
 *   0 = clean
 *   1 = violations found
 *
 * Add to package.json scripts:
 *   "lint:ds": "node scripts/lint-typography.js"
 *   "lint:ds:all": "node scripts/lint-typography.js --all"
 *
 * Add to CI (e.g. .github/workflows/ci.yml):
 *   - run: npm run lint:ds
 */

const fs = require('fs');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

const SCAN_DIRS = {
  'pr-work-surface': 'apps/dashboard/src/components/pr-work-surface',
};

const ALL_DIRS = {
  ...SCAN_DIRS,
  'command-center': 'apps/dashboard/src/components/command-center',
  'seo-work-surface': 'apps/dashboard/src/components/seo-work-surface',
  'content-work-surface': 'apps/dashboard/src/components/content-work-surface',
};

const FILE_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

// ─── Rule Definitions ─────────────────────────────────────────────────────────

/**
 * RULE 1: Forbidden small text sizes.
 *
 * text-[9px], text-[10px], text-[11px] are ONLY allowed when the same element
 * also has BOTH 'uppercase' AND 'tracking-wider' in the same className string.
 *
 * If either condition is missing it is a violation — the text is too small
 * for semantic content without the label compensation.
 */
const SMALL_SIZE_PATTERN = /text-\[(9|10|11)px\]/g;

/**
 * RULE 2: Forbidden legacy color tokens.
 *
 * These tokens either don't exist in our DS or are explicitly replaced
 * by semantic tokens. Any occurrence is a violation regardless of context.
 */
const FORBIDDEN_TOKENS = [
  // Replaced by semantic-danger
  { pattern: /\bred-400\b/, name: 'red-400', replacement: 'semantic-danger' },
  { pattern: /\bred-500\b/, name: 'red-500', replacement: 'semantic-danger' },
  // Does not exist — typo for semantic-danger
  { pattern: /\bsemantic-error\b/, name: 'semantic-error', replacement: 'semantic-danger' },
  // Replaced by semantic-success
  { pattern: /\bemerald-400\b/, name: 'emerald-400', replacement: 'semantic-success' },
  // Replaced by semantic-warning
  { pattern: /\bamber-400\b/, name: 'amber-400', replacement: 'semantic-warning' },
  // Old slate/gray scale — use white/opacity instead
  { pattern: /\btext-slate-\d{3}\b/, name: 'text-slate-*', replacement: 'text-white/{opacity}' },
  { pattern: /\btext-gray-\d{3}\b/, name: 'text-gray-*', replacement: 'text-white/{opacity}' },
  { pattern: /\bbg-gray-\d{3}\b/, name: 'bg-gray-*', replacement: 'bg-[#surface-hex]' },
  { pattern: /\bbg-slate-\d{3}\b/, name: 'bg-slate-*', replacement: 'bg-[#surface-hex]' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAllFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...getAllFiles(fullPath, exts));
    } else if (exts.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Check whether a className string that contains a small size token
 * also has the required 'uppercase' AND 'tracking-wider' compensation.
 *
 * We look at a 300-char window around the match to capture the full
 * className string without trying to parse JSX properly.
 */
function hasLabelCompensation(source, matchIndex) {
  // Extract a window around the match
  const start = Math.max(0, matchIndex - 150);
  const end = Math.min(source.length, matchIndex + 150);
  const window = source.slice(start, end);

  const hasUppercase = /\buppercase\b/.test(window);
  const hasTracking = /\btracking-wider\b/.test(window);

  return hasUppercase && hasTracking;
}

// ─── Linter ───────────────────────────────────────────────────────────────────

function lintFile(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const lines = source.split('\n');
  const violations = [];

  // Rule 1: small size tokens without label compensation
  let match;
  SMALL_SIZE_PATTERN.lastIndex = 0;
  while ((match = SMALL_SIZE_PATTERN.exec(source)) !== null) {
    if (!hasLabelCompensation(source, match.index)) {
      // Find line number
      const linesBefore = source.slice(0, match.index).split('\n');
      const lineNum = linesBefore.length;
      const lineContent = lines[lineNum - 1]?.trim() ?? '';

      violations.push({
        rule: 'typography-floor',
        severity: 'error',
        line: lineNum,
        col: linesBefore[linesBefore.length - 1].length + 1,
        token: match[0],
        lineContent,
        message: `${match[0]} is below the 13px semantic floor. Use text-[13px] for content, or add 'uppercase tracking-wider' if this is a decorative label.`,
        fix: `Change ${match[0]} to text-[13px] (or add uppercase + tracking-wider if decorative label)`,
      });
    }
  }

  // Rule 2: forbidden legacy tokens
  for (const rule of FORBIDDEN_TOKENS) {
    rule.pattern.lastIndex = 0;
    const rx = new RegExp(rule.pattern.source, 'g');
    let m;
    while ((m = rx.exec(source)) !== null) {
      const linesBefore = source.slice(0, m.index).split('\n');
      const lineNum = linesBefore.length;
      const lineContent = lines[lineNum - 1]?.trim() ?? '';

      violations.push({
        rule: 'forbidden-token',
        severity: 'error',
        line: lineNum,
        col: linesBefore[linesBefore.length - 1].length + 1,
        token: m[0],
        lineContent,
        message: `Forbidden token '${rule.name}'. Use '${rule.replacement}' instead.`,
        fix: `Replace '${m[0]}' with the appropriate '${rule.replacement}' token`,
      });
    }
  }

  return violations;
}

// ─── Reporter ─────────────────────────────────────────────────────────────────

function formatViolation(filePath, v, rootDir) {
  const rel = path.relative(rootDir, filePath);
  return `  ${rel}:${v.line}:${v.col}  [${v.rule}]  ${v.message}\n    └─ ${v.lineContent}`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const scanAll = args.includes('--all');
  const fixReport = args.includes('--fix-report');

  const dirsToScan = scanAll ? ALL_DIRS : SCAN_DIRS;

  let totalViolations = 0;
  const allResults = [];

  for (const [label, relDir] of Object.entries(dirsToScan)) {
    const absDir = path.join(ROOT, relDir);
    const files = getAllFiles(absDir, FILE_EXTENSIONS);
    const dirResults = [];

    for (const filePath of files) {
      const violations = lintFile(filePath);
      if (violations.length > 0) {
        dirResults.push({ filePath, violations });
        totalViolations += violations.length;
      }
    }

    if (dirResults.length > 0) {
      allResults.push({ label, dirResults });
    }
  }

  // ── Output ──────────────────────────────────────────────────────────────────

  if (totalViolations === 0) {
    console.log('\n✅  DS v3.1 typography & token check passed — no violations found.\n');
    process.exit(0);
  }

  console.log(`\n❌  DS v3.1 violations found: ${totalViolations} total\n`);
  console.log('─'.repeat(72));

  for (const { label, dirResults } of allResults) {
    console.log(`\n📁  ${label}`);
    for (const { filePath, violations } of dirResults) {
      console.log(`\n  ${path.relative(ROOT, filePath)}`);
      for (const v of violations) {
        console.log(`    Line ${v.line}: [${v.severity}] ${v.message}`);
        console.log(`    ↳  ${v.lineContent.slice(0, 100)}`);
        if (fixReport) {
          console.log(`    🔧 ${v.fix}`);
        }
        console.log();
      }
    }
  }

  console.log('─'.repeat(72));
  console.log(`\nTotal: ${totalViolations} violation${totalViolations === 1 ? '' : 's'}\n`);
  console.log('Run with --fix-report for actionable fix suggestions.\n');
  console.log('Reference: /docs/canon/DS_v3_1_EXPRESSION.md\n');

  process.exit(1);
}

main();
