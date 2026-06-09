#!/usr/bin/env node
/**
 * Phase 0.5 Plan 05 — Reject Windows `Zone.Identifier` metadata files.
 *
 * NTFS Alternate Data Streams attach `*:Zone.Identifier` files when
 * Windows downloads or copies content from another zone. On WSL these
 * surface as real files (`file.txt:Zone.Identifier`). They have no
 * business in a git repo.
 *
 * The hook examines STAGED files (`git diff --cached --name-only`) for
 * any path containing `Zone.Identifier`. If found, abort.
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/05-pre-commit.md
 */

import { execSync } from 'node:child_process';

function getStagedFiles() {
  let raw;
  try {
    raw = execSync('git diff --cached --name-only', { encoding: 'utf8' });
  } catch (err) {
    console.error('[check-zone-identifier] git diff failed:', err.message);
    process.exit(2);
  }
  return raw.split('\n').filter(Boolean);
}

const ZONE_IDENTIFIER_RE = /Zone\.Identifier/i;
const staged = getStagedFiles();
const offenders = staged.filter((path) => ZONE_IDENTIFIER_RE.test(path));

if (offenders.length === 0) {
  process.exit(0);
}

console.error('');
console.error(
  'Pre-commit blocked: staged file(s) look like Windows NTFS metadata.'
);
console.error('');
for (const path of offenders) {
  console.error(`  ${path}`);
}
console.error('');
console.error('These are NTFS Alternate Data Streams that attach when Windows');
console.error(
  'downloads or copies content from another zone. They never belong'
);
console.error('in the repo.');
console.error('');
console.error('Fix:');
console.error('  git restore --staged <file>   # unstage');
console.error('  rm <file>                     # remove from disk');
console.error(
  '  # Optionally add `*:Zone.Identifier` to .gitignore (already done).'
);
console.error('');
console.error('Emergency escape: `git commit --no-verify` (use sparingly).');
process.exit(1);
