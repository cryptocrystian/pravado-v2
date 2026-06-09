#!/usr/bin/env node
/**
 * Phase 0.5 Plan 05 — Monitored-dir clean check.
 *
 * Rejects a commit if `git status --porcelain` shows ANY untracked OR
 * unstaged-modified file inside one of the monitored directories. The
 * intent is to prevent the "untracked agency routes" pattern that
 * surfaced in Track 0D: source files sitting on a developer's disk that
 * the workspace typecheck never sees because they're not in the git index.
 *
 * Monitored directories:
 *   - apps/api/src/routes/
 *   - apps/dashboard/src/app/app/
 *   - packages/feature-flags/src/
 *
 * If a file is genuinely meant to stay local (scratch / experiment),
 * either `.gitignore` it or stage it before committing.
 *
 * Hook contract: exit 0 on clean, exit non-zero with a diagnostic on
 * dirty.
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/05-pre-commit.md
 */

import { execSync } from 'node:child_process';

const MONITORED_DIRS = [
  'apps/api/src/routes/',
  'apps/dashboard/src/app/app/',
  'packages/feature-flags/src/',
];

function getDirtyEntries() {
  let raw;
  try {
    raw = execSync('git status --porcelain', { encoding: 'utf8' });
  } catch (err) {
    console.error('[check-monitored-dirs] git status failed:', err.message);
    process.exit(2);
  }

  // Porcelain format: "XY path" where X = index, Y = worktree.
  // We care about UNTRACKED (??) and UNSTAGED modifications ( M / MM / etc.
  // where the second column isn't a space).
  const dirty = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const status = line.slice(0, 2);
    const path = line.slice(3).trim();

    const untracked = status === '??';
    const unstagedModified = status[1] !== ' ' && status[1] !== '?';

    if (untracked || unstagedModified) {
      dirty.push({ status, path });
    }
  }
  return dirty;
}

const dirty = getDirtyEntries();
const offenders = dirty.filter((entry) =>
  MONITORED_DIRS.some((dir) => entry.path.startsWith(dir))
);

if (offenders.length === 0) {
  process.exit(0);
}

console.error('');
console.error(
  'Pre-commit blocked: untracked or unstaged file(s) in a monitored directory.'
);
console.error('');
for (const { status, path } of offenders) {
  console.error(`  [${status}] ${path}`);
}
console.error('');
console.error('Each file is either:');
console.error('  - Real work-in-progress → `git add` it and re-commit, OR');
console.error('  - Scratch / local-only → add it to .gitignore.');
console.error('');
console.error(
  'Monitored directories (kept clean to prevent the Track 0D agency-routes pattern):'
);
for (const dir of MONITORED_DIRS) {
  console.error(`  - ${dir}`);
}
console.error('');
console.error('Emergency escape: `git commit --no-verify` (use sparingly).');
process.exit(1);
