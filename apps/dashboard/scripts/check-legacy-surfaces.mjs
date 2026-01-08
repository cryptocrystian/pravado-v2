#!/usr/bin/env node
/**
 * Legacy Surface Guard
 *
 * Enforces Command Center as the ONLY primary user surface.
 * Fails CI if legacy dashboard patterns are detected.
 *
 * @see /docs/canon/UX_SURFACES.md - Surface Authority section
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const errors = [];

/**
 * Recursively get all files in a directory
 */
function getFiles(dir, pattern = /\.(tsx?|jsx?)$/) {
  const files = [];
  if (!existsSync(dir)) return files;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
        files.push(...getFiles(fullPath, pattern));
      }
    } else if (pattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Check 1: Ensure /app/page.tsx redirects to command-center
 */
function checkAppPageRedirect() {
  const appPage = join(projectRoot, 'src/app/app/page.tsx');
  if (!existsSync(appPage)) {
    errors.push('[FAIL] /app/app/page.tsx does not exist - legacy route must redirect');
    return;
  }

  const content = readFileSync(appPage, 'utf-8');
  if (!content.includes("redirect('/app/command-center')")) {
    errors.push('[FAIL] /app/app/page.tsx must redirect to /app/command-center');
  } else {
    console.log('[PASS] /app/page.tsx redirects to /app/command-center');
  }
}

/**
 * Check 2: Ensure no Dashboard nav items exist in layout
 */
function checkNavigation() {
  const layoutPath = join(projectRoot, 'src/app/app/layout.tsx');
  if (!existsSync(layoutPath)) {
    errors.push('[FAIL] layout.tsx does not exist');
    return;
  }

  const content = readFileSync(layoutPath, 'utf-8');

  // Check for Dashboard nav item (not as part of icon name)
  const dashboardNavPattern = /name:\s*['"]Dashboard['"]/;
  if (dashboardNavPattern.test(content)) {
    errors.push('[FAIL] layout.tsx contains a "Dashboard" nav item - remove it');
  } else {
    console.log('[PASS] No Dashboard nav item in sidebar');
  }

  // Verify Command Center is first nav item
  const navItemsMatch = content.match(/const navItems\s*=\s*\[([^\]]+)\]/s);
  if (navItemsMatch) {
    const firstItem = navItemsMatch[1].split(',')[0];
    if (!firstItem.includes('Command Center')) {
      errors.push('[FAIL] Command Center must be the first nav item');
    } else {
      console.log('[PASS] Command Center is first nav item');
    }
  }
}

/**
 * Check 3: Ensure no /app/dashboard directory exists
 */
function checkNoDashboardDirectory() {
  const dashboardDir = join(projectRoot, 'src/app/app/dashboard');
  if (existsSync(dashboardDir)) {
    errors.push('[FAIL] /app/app/dashboard directory must not exist - deprecated');
  } else {
    console.log('[PASS] No legacy /app/dashboard directory');
  }
}

/**
 * Check 4: Scan for href="/app/dashboard" or href="/app" (except allowed patterns)
 */
function checkNoLegacyLinks() {
  const srcDir = join(projectRoot, 'src');
  const files = getFiles(srcDir);

  const allowedPatterns = [
    '/app/command-center',
    '/app/pr',
    '/app/content',
    '/app/seo',
    '/app/playbooks',
    '/app/agents',
    '/app/analytics',
    '/app/team',
    '/app/settings',
    '/app/calendar',
    '/app/ops',
  ];

  const legacyLinkPattern = /href=["']\/app(\/dashboard)?["']/g;

  for (const file of files) {
    // Skip the redirect file itself
    if (file.includes('app/app/page.tsx')) continue;

    const content = readFileSync(file, 'utf-8');
    const matches = content.matchAll(legacyLinkPattern);

    for (const match of matches) {
      const href = match[0].match(/href=["']([^"']+)["']/)?.[1];
      if (href && !allowedPatterns.some((p) => href.startsWith(p))) {
        const relPath = relative(projectRoot, file);
        errors.push(`[FAIL] ${relPath} contains legacy link: ${href}`);
      }
    }
  }

  if (!errors.some((e) => e.includes('legacy link'))) {
    console.log('[PASS] No legacy dashboard links found');
  }
}

// Run all checks
console.log('\n=== Legacy Surface Guard ===\n');
console.log('Enforcing Command Center as primary surface...\n');

checkAppPageRedirect();
checkNavigation();
checkNoDashboardDirectory();
checkNoLegacyLinks();

console.log('');

if (errors.length > 0) {
  console.log('=== ERRORS ===\n');
  errors.forEach((e) => console.log(e));
  console.log('\nSee /docs/canon/UX_SURFACES.md for surface authority documentation.\n');
  process.exit(1);
} else {
  console.log('=== All legacy surface checks passed ===\n');
  process.exit(0);
}
