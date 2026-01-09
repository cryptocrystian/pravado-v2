#!/usr/bin/env node
/**
 * CI Guard: Command Center Contrast / Legibility
 *
 * Ensures no dark-on-dark text in Command Center by forbidding
 * text-slate-*, text-gray-*, text-neutral-* tokens.
 *
 * ALLOWED text tokens:
 * - text-white/* (opacity variants)
 * - text-brand-* (cyan, iris, magenta)
 * - text-semantic-* (danger, warning, success)
 *
 * Exceptions can be allowlisted with "contrast-allow:" comment on same line.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Paths to scan
const SCAN_PATHS = [
  path.resolve(__dirname, '../src/components/command-center'),
  path.resolve(__dirname, '../src/app/app/command-center'),
];

// Forbidden patterns (low-contrast text colors)
const FORBIDDEN_PATTERNS = [
  { regex: /text-slate-[0-9]+/, name: 'text-slate-*' },
  { regex: /text-gray-[0-9]+/, name: 'text-gray-*' },
  { regex: /text-neutral-[0-9]+/, name: 'text-neutral-*' },
  { regex: /text-zinc-[0-9]+/, name: 'text-zinc-*' },
  { regex: /text-stone-[0-9]+/, name: 'text-stone-*' },
];

// Allowlist marker - if present on same line, ignore that line
const ALLOWLIST_MARKER = 'contrast-allow:';

function getAllFiles(dirPath, files = []) {
  if (!fs.existsSync(dirPath)) {
    return files;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  lines.forEach((line, index) => {
    // Skip if allowlisted
    if (line.includes(ALLOWLIST_MARKER)) {
      return;
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      const match = line.match(pattern.regex);
      if (match) {
        violations.push({
          file: filePath,
          line: index + 1,
          column: line.indexOf(match[0]) + 1,
          pattern: pattern.name,
          found: match[0],
          lineContent: line.trim().substring(0, 80),
        });
      }
    }
  });

  return violations;
}

function main() {
  console.log('Checking Command Center contrast / legibility...\n');

  let allViolations = [];

  for (const scanPath of SCAN_PATHS) {
    const files = getAllFiles(scanPath);
    for (const file of files) {
      const violations = checkFile(file);
      allViolations = allViolations.concat(violations);
    }
  }

  if (allViolations.length === 0) {
    console.log('✓ All Command Center files pass contrast check.\n');
    console.log('No forbidden text color tokens found.\n');
    console.log('PASS: Command Center legibility is compliant.\n');
    process.exit(0);
  }

  console.error('✗ Found low-contrast text tokens:\n');

  // Group by file
  const byFile = new Map();
  for (const v of allViolations) {
    const existing = byFile.get(v.file) || [];
    existing.push(v);
    byFile.set(v.file, existing);
  }

  for (const [file, violations] of byFile) {
    const relPath = path.relative(process.cwd(), file);
    console.error(`  ${relPath}:`);
    for (const v of violations) {
      console.error(`    Line ${v.line}: ${v.found}`);
      console.error(`      ${v.lineContent}`);
    }
    console.error('');
  }

  console.error('FAIL: Found ' + allViolations.length + ' contrast violation(s).\n');
  console.error('Allowed text tokens in Command Center:');
  console.error('  - text-white/* (e.g., text-white/90, text-white/70, text-white/50)');
  console.error('  - text-brand-* (e.g., text-brand-cyan, text-brand-iris, text-brand-magenta)');
  console.error('  - text-semantic-* (e.g., text-semantic-danger, text-semantic-warning)');
  console.error('\nTo allowlist a specific use, add "contrast-allow:" comment on the same line.\n');
  process.exit(1);
}

main();
