#!/usr/bin/env node
/**
 * CI Guard: Command Center Contrast / Legibility v2.0
 *
 * Ensures no dark-on-dark text in Command Center by:
 * 1. Forbidding text-slate-*, text-gray-*, text-neutral-* tokens
 * 2. Warning on low-opacity text (< white/50) for non-micro content
 *
 * ALLOWED text tokens:
 * - text-white/* (opacity variants, min /50 for body text)
 * - text-brand-* (cyan, iris, magenta)
 * - text-semantic-* (danger, warning, success)
 *
 * Exceptions can be allowlisted with:
 * - "contrast-allow:" for forbidden color tokens
 * - "typography-allow: micro" for low-opacity micro text
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 * @see /apps/dashboard/src/components/command-center/text-intents.ts
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
const FORBIDDEN_COLOR_PATTERNS = [
  { regex: /text-slate-[0-9]+/, name: 'text-slate-*' },
  { regex: /text-gray-[0-9]+/, name: 'text-gray-*' },
  { regex: /text-neutral-[0-9]+/, name: 'text-neutral-*' },
  { regex: /text-zinc-[0-9]+/, name: 'text-zinc-*' },
  { regex: /text-stone-[0-9]+/, name: 'text-stone-*' },
];

// Low opacity pattern for body text (< /50)
// Matches text-white/XX where XX < 50
const LOW_OPACITY_PATTERN = /text-white\/(3[0-9]|[12][0-9]|[0-9])(?!\d)/;

// Allowlist markers
const COLOR_ALLOWLIST_MARKER = 'contrast-allow:';
const TYPOGRAPHY_ALLOWLIST_MARKER = 'typography-allow:';

// Micro context markers (when low opacity is acceptable)
const MICRO_CONTEXTS = ['micro', 'timestamp', 'badge', 'metric', 'tab', 'section', 'pillar', 'meta'];

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
  const warnings = [];

  lines.forEach((line, index) => {
    // Check for forbidden color tokens
    if (!line.includes(COLOR_ALLOWLIST_MARKER)) {
      for (const pattern of FORBIDDEN_COLOR_PATTERNS) {
        const match = line.match(pattern.regex);
        if (match) {
          violations.push({
            file: filePath,
            line: index + 1,
            type: 'forbidden-color',
            pattern: pattern.name,
            found: match[0],
            lineContent: line.trim().substring(0, 100),
          });
        }
      }
    }

    // Check for low opacity text (warning, unless allowlisted)
    if (!line.includes(TYPOGRAPHY_ALLOWLIST_MARKER)) {
      const opacityMatch = line.match(LOW_OPACITY_PATTERN);
      if (opacityMatch) {
        // Check if this line has any micro context
        const hasTypographyAllow = line.includes('typography-allow:');
        const hasMicroContext = MICRO_CONTEXTS.some(ctx =>
          line.toLowerCase().includes(ctx) ||
          line.includes('text-[11px]') ||
          line.includes('text-[10px]')
        );

        if (!hasTypographyAllow && !hasMicroContext) {
          warnings.push({
            file: filePath,
            line: index + 1,
            type: 'low-opacity',
            found: opacityMatch[0],
            lineContent: line.trim().substring(0, 100),
          });
        }
      }
    }
  });

  return { violations, warnings };
}

function main() {
  console.log('Command Center Contrast / Legibility Guard v2.0');
  console.log('================================================\n');

  console.log('Checking for:');
  console.log('  - Forbidden color tokens (text-slate/gray/neutral/zinc/stone)');
  console.log('  - Low-opacity text (< white/50) for non-micro content\n');

  let allViolations = [];
  let allWarnings = [];

  for (const scanPath of SCAN_PATHS) {
    const files = getAllFiles(scanPath);
    for (const file of files) {
      const { violations, warnings } = checkFile(file);
      allViolations = allViolations.concat(violations);
      allWarnings = allWarnings.concat(warnings);
    }
  }

  // Report violations (FAIL)
  if (allViolations.length > 0) {
    console.error('\x1b[31m✗ Found forbidden color tokens:\x1b[0m\n');

    const byFile = new Map();
    for (const v of allViolations) {
      const existing = byFile.get(v.file) || [];
      existing.push(v);
      byFile.set(v.file, existing);
    }

    for (const [file, violations] of byFile) {
      const relPath = path.relative(process.cwd(), file);
      console.error(`  \x1b[33m${relPath}\x1b[0m`);
      for (const v of violations) {
        console.error(`    Line ${v.line}: \x1b[31m${v.found}\x1b[0m`);
        console.error(`      ${v.lineContent}`);
      }
      console.error('');
    }
  }

  // Report warnings (non-blocking)
  if (allWarnings.length > 0) {
    console.log('\x1b[33m⚠ Low-opacity text warnings (may need review):\x1b[0m\n');

    const byFile = new Map();
    for (const w of allWarnings) {
      const existing = byFile.get(w.file) || [];
      existing.push(w);
      byFile.set(w.file, existing);
    }

    for (const [file, warnings] of byFile) {
      const relPath = path.relative(process.cwd(), file);
      console.log(`  \x1b[33m${relPath}\x1b[0m`);
      for (const w of warnings) {
        console.log(`    Line ${w.line}: \x1b[33m${w.found}\x1b[0m (consider using >= white/50)`);
        console.log(`      ${w.lineContent}`);
      }
      console.log('');
    }

    console.log('To allowlist low-opacity micro text, add "// typography-allow: micro" comment.\n');
  }

  // Final result
  if (allViolations.length === 0 && allWarnings.length === 0) {
    console.log('\x1b[32m✓ All Command Center files pass contrast check.\x1b[0m\n');
    console.log('No forbidden color tokens or low-opacity issues found.\n');
    console.log('\x1b[32mPASS: Command Center legibility is compliant.\x1b[0m\n');
    process.exit(0);
  } else if (allViolations.length === 0) {
    console.log(`\x1b[32m✓ No forbidden color tokens found.\x1b[0m`);
    console.log(`\x1b[33m⚠ ${allWarnings.length} low-opacity warning(s) (non-blocking).\x1b[0m\n`);
    console.log('\x1b[32mPASS: Command Center legibility is compliant.\x1b[0m\n');
    process.exit(0);
  } else {
    console.error(`\x1b[31mFAIL: Found ${allViolations.length} contrast violation(s).\x1b[0m\n`);
    console.error('Allowed text tokens in Command Center:');
    console.error('  - text-white/* (e.g., text-white/90, text-white/70, text-white/50)');
    console.error('  - text-brand-* (e.g., text-brand-cyan, text-brand-iris, text-brand-magenta)');
    console.error('  - text-semantic-* (e.g., text-semantic-danger, text-semantic-warning)');
    console.error('\nTo allowlist, add "contrast-allow:" comment on the same line.\n');
    process.exit(1);
  }
}

main();
