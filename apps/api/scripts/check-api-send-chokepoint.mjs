#!/usr/bin/env node
/**
 * API Send-Chokepoint CI Guard (Lane B).
 *
 * Enforces the NON-NEGOTIABLE invariant: no outbound email can reach the
 * provider without passing through sendGuardedEmail() (suppression / CAN-SPAM,
 * pitch-eligibility, daily cap, sequence cap, follow-up cap, personalization).
 *
 * FAILS the build if:
 *   1. `provider.send(` appears anywhere in apps/api/src except the
 *      deliverability service (the single provider abstraction).
 *   2. A raw `.sendEmail(` call appears on any line NOT tagged
 *      `// chokepoint-rawsend` (the one sanctioned raw-send wrapper).
 *   3. Any known send-site file stops importing `sendGuardedEmail`.
 *
 * The dashboard guardrail (check-pr-guardrails.mjs) scans the UI; this scans
 * the backend send path, which was previously unguarded.
 *
 * Usage:  node apps/api/scripts/check-api-send-chokepoint.mjs [--warn]
 *
 * @see apps/api/src/services/sendGuardedEmail.ts
 * @see docs/canon/JOURNALIST_DATABASE_GOVERNANCE.md §4, §10.3, §16
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_ROOT = join(__dirname, '..');
const SRC = join(API_ROOT, 'src');
const WARN_ONLY = process.argv.includes('--warn');

// The single file allowed to call the provider abstraction directly.
const PROVIDER_SEND_ALLOWED = ['src/services/outreachDeliverabilityService.ts'];
// The single line marker allowed to invoke the raw `.sendEmail(` provider path.
const RAWSEND_MARKER = 'chokepoint-rawsend';
const ALLOWLIST_MARKER = 'chokepoint-allow:';

// Send-site files that MUST import the chokepoint.
const REQUIRED_CHOKEPOINT_IMPORTERS = [
  'src/routes/prOutreach/index.ts',
  'src/routes/prOutreachDeliverability/index.ts',
  'src/services/outreachService.ts',
  // Wave-2: the pr.send_pitch executor is a fourth send-site — it MUST keep
  // routing pitches through the governed chokepoint (never the provider).
  'src/services/craft/executors/prSendPitchExecutor.ts',
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (
        entry === 'node_modules' ||
        entry === '__tests__' ||
        entry === 'tests'
      )
        continue;
      out.push(...walk(full));
    } else if (/\.(ts|tsx|mjs|js)$/.test(entry) && !/\.test\.ts$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const violations = [];
const rel = (f) => relative(API_ROOT, f);

const files = walk(SRC);

for (const file of files) {
  const relPath = rel(file);
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    if (line.includes(ALLOWLIST_MARKER)) return;

    // 1. provider.send(
    if (/\bprovider\.send\s*\(/.test(line)) {
      if (!PROVIDER_SEND_ALLOWED.includes(relPath)) {
        violations.push({
          file: relPath,
          line: i + 1,
          rule: 'provider-send-outside-service',
          found: line.trim(),
          message:
            'provider.send() may only be called inside the deliverability service.',
        });
      }
    }

    // 2. raw .sendEmail( calls must be tagged chokepoint-rawsend
    if (/\.sendEmail\s*\(/.test(line)) {
      if (!line.includes(RAWSEND_MARKER)) {
        violations.push({
          file: relPath,
          line: i + 1,
          rule: 'ungoverned-sendEmail',
          found: line.trim(),
          message:
            'Raw .sendEmail() call must go through sendGuardedEmail via the tagged ' +
            'deliverabilityRawSend wrapper (// chokepoint-rawsend).',
        });
      }
    }
  });
}

// 3. required importers
for (const req of REQUIRED_CHOKEPOINT_IMPORTERS) {
  const full = join(API_ROOT, req);
  let content = '';
  try {
    content = readFileSync(full, 'utf-8');
  } catch {
    violations.push({
      file: req,
      line: 0,
      rule: 'missing-send-site',
      found: '',
      message: 'Expected send-site file is missing.',
    });
    continue;
  }
  if (!/sendGuardedEmail/.test(content)) {
    violations.push({
      file: req,
      line: 0,
      rule: 'send-site-missing-chokepoint',
      found: '',
      message:
        'Send-site file no longer imports/uses sendGuardedEmail — chokepoint bypass risk.',
    });
  }
}

console.log('API Send-Chokepoint CI Guard');
console.log('============================\n');

if (violations.length === 0) {
  console.log(
    'PASS: every provider send path routes through sendGuardedEmail().'
  );
  process.exit(0);
}

console.log(`Found ${violations.length} chokepoint violation(s):\n`);
for (const v of violations) {
  console.log(`  ${v.file}:${v.line} [${v.rule}]`);
  if (v.found) console.log(`    > ${v.found}`);
  console.log(`    ${v.message}\n`);
}

if (WARN_ONLY) {
  console.log('WARN mode: not failing.');
  process.exit(0);
}
console.log(
  'FAIL: send-chokepoint invariant violated. Route all sends through sendGuardedEmail().'
);
process.exit(1);
