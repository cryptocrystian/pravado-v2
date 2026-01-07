#!/usr/bin/env node

/**
 * Path Guard Script
 *
 * Prevents scope drift by failing PRs that modify restricted paths
 * unless explicitly authorized via:
 * 1) Label: "canon-amendment"
 * 2) Work Order reference in PR title/body (WO-###, #issue, or "Work Order:")
 *
 * Exit codes:
 * 0 - All checks passed (or not a PR event)
 * 1 - Unauthorized restricted path modifications detected
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// ANSI colors
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// ============================================================================
// PATH DEFINITIONS
// ============================================================================

/**
 * Restricted paths - modifications require authorization
 * Uses glob-like patterns (simplified matching)
 */
const RESTRICTED_PATHS = [
  'apps/api/',           // Backend API (use with caution)
  'apps/server/',        // Legacy server (if exists)
  'packages/backend/',   // Backend packages
  'supabase/',           // Database migrations/config
  'infra/',              // Infrastructure
  'scripts/db/',         // Database scripts
  '.github/workflows/',  // CI workflows (partial - see allowlist)
  'docs/',               // Docs (partial - see allowlist)
];

/**
 * Allowed paths - always OK to modify without authorization
 */
const ALLOWED_PATHS = [
  'apps/dashboard/',
  'packages/types/',
  'packages/validators/',
  'packages/utils/',
  'packages/feature-flags/',
  'contracts/',
  'docs/canon/',
  'docs/audit/',
  'docs/_archive/',
  'docs/ARCHITECTURE.md',
  'docs/DEVELOPMENT.md',
  'docs/TESTING.md',
  'docs/DEPLOYMENT_GUIDE.md',
  'docs/FEATURE_FLAGS.md',
  'docs/auth_model.md',
  'docs/org_model.md',
  '.github/ISSUE_TEMPLATE/',
  '.github/PULL_REQUEST_TEMPLATE/',
  '.claude/',
  'CLAUDE.md',
  'README.md',
  'package.json',
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
  'tsconfig.json',
  '.gitignore',
  '.claudeignore',
  '.eslintrc',
  '.prettierrc',
  'turbo.json',
];

/**
 * Workflow allowlist - these workflows can be modified without auth
 */
const ALLOWED_WORKFLOWS = [
  '.github/workflows/canon-gates.yml',
  '.github/workflows/path-guard.yml',
];

/**
 * Script allowlist - guard scripts can be modified
 */
const ALLOWED_SCRIPTS = [
  'scripts/check-canon-integrity.mjs',
  'scripts/check-path-guard.mjs',
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function error(message) {
  log(`ERROR: ${message}`, RED);
}

function success(message) {
  log(`OK: ${message}`, GREEN);
}

function warn(message) {
  log(`WARN: ${message}`, YELLOW);
}

function info(message) {
  log(`INFO: ${message}`, CYAN);
}

/**
 * Check if a file path is explicitly allowed
 */
function isAllowedPath(filePath) {
  // Check exact matches and prefix matches
  for (const allowed of ALLOWED_PATHS) {
    if (allowed.endsWith('/')) {
      // Directory prefix
      if (filePath.startsWith(allowed)) return true;
    } else {
      // Exact file match
      if (filePath === allowed) return true;
    }
  }

  // Check workflow allowlist
  if (ALLOWED_WORKFLOWS.includes(filePath)) return true;

  // Check script allowlist
  if (ALLOWED_SCRIPTS.includes(filePath)) return true;

  return false;
}

/**
 * Check if a file path is restricted
 */
function isRestrictedPath(filePath) {
  // If explicitly allowed, not restricted
  if (isAllowedPath(filePath)) return false;

  // Check against restricted patterns
  for (const restricted of RESTRICTED_PATHS) {
    if (restricted.endsWith('/')) {
      // Directory prefix
      if (filePath.startsWith(restricted)) return true;
    } else {
      // Exact match
      if (filePath === restricted) return true;
    }
  }

  return false;
}

/**
 * Get changed files from git
 */
function getChangedFiles() {
  try {
    // Try PR context first
    const output = execSync('git diff --name-only origin/main...HEAD 2>/dev/null', {
      cwd: ROOT_DIR,
      encoding: 'utf-8'
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    try {
      // Fallback to previous commit
      const output = execSync('git diff --name-only HEAD~1...HEAD 2>/dev/null', {
        cwd: ROOT_DIR,
        encoding: 'utf-8'
      });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      warn('Could not determine changed files via git.');
      return [];
    }
  }
}

/**
 * Read GitHub event payload (if in CI)
 */
function getGitHubEventPayload() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !existsSync(eventPath)) {
    return null;
  }

  try {
    const content = readFileSync(eventPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Check if PR is authorized via label or Work Order reference
 */
function checkAuthorization(eventPayload) {
  const result = {
    isAuthorized: false,
    method: null,
    details: null,
  };

  if (!eventPayload || !eventPayload.pull_request) {
    // Not a PR event - allow by default (push to main after merge)
    result.isAuthorized = true;
    result.method = 'not-pr-event';
    result.details = 'Not a pull_request event, allowing changes.';
    return result;
  }

  const pr = eventPayload.pull_request;
  const title = pr.title || '';
  const body = pr.body || '';
  const labels = (pr.labels || []).map(l => l.name.toLowerCase());

  // Check 1: canon-amendment label
  if (labels.includes('canon-amendment')) {
    result.isAuthorized = true;
    result.method = 'label';
    result.details = 'PR has "canon-amendment" label.';
    return result;
  }

  // Check 2: Work Order reference patterns
  const workOrderPatterns = [
    /WO-\d+/i,              // WO-123
    /#\d+/,                 // #123
    /Work\s*Order:/i,       // Work Order:
  ];

  const textToSearch = `${title}\n${body}`;

  for (const pattern of workOrderPatterns) {
    const match = textToSearch.match(pattern);
    if (match) {
      result.isAuthorized = true;
      result.method = 'work-order';
      result.details = `Found Work Order reference: "${match[0]}"`;
      return result;
    }
  }

  // No authorization found
  result.isAuthorized = false;
  result.method = 'none';
  result.details = 'No authorization found (no label or Work Order reference).';
  return result;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  log(`${BOLD}===============================================${RESET}`);
  log(`${BOLD}         PRAVADO Path Guard Check             ${RESET}`);
  log(`${BOLD}===============================================${RESET}`);

  // Get GitHub event payload
  const eventPayload = getGitHubEventPayload();
  const eventName = process.env.GITHUB_EVENT_NAME || 'local';

  info(`Event type: ${eventName}`);

  // Check if this is a PR event
  if (eventName !== 'pull_request' && !eventPayload?.pull_request) {
    success('Not a pull_request event. Path guard only runs on PRs.');
    log('\nFor push events, changes are assumed to be already reviewed.');
    process.exit(0);
  }

  // Get changed files
  const changedFiles = getChangedFiles();

  if (changedFiles.length === 0) {
    success('No changed files detected.');
    process.exit(0);
  }

  info(`Changed files: ${changedFiles.length}`);

  // Find restricted files
  const restrictedFiles = changedFiles.filter(isRestrictedPath);

  if (restrictedFiles.length === 0) {
    success('No restricted paths modified in this PR.');
    log('\nAll changed files are in allowed paths:');
    changedFiles.slice(0, 10).forEach(f => log(`  - ${f}`));
    if (changedFiles.length > 10) {
      log(`  ... and ${changedFiles.length - 10} more`);
    }
    process.exit(0);
  }

  // Restricted files found - check authorization
  log(`\n${YELLOW}Restricted paths detected: ${restrictedFiles.length}${RESET}`);
  restrictedFiles.forEach(f => log(`  ${RED}▸${RESET} ${f}`));

  // Check authorization
  const auth = checkAuthorization(eventPayload);

  log(`\n${BOLD}Authorization Check:${RESET}`);
  info(`Method: ${auth.method}`);
  info(`Details: ${auth.details}`);

  if (auth.isAuthorized) {
    success(`\nPR is AUTHORIZED to modify restricted paths.`);
    log(`\n${BOLD}Authorized via:${RESET} ${auth.details}`);
    process.exit(0);
  }

  // NOT AUTHORIZED - FAIL
  log(`\n${RED}${BOLD}===============================================${RESET}`);
  log(`${RED}${BOLD}  PATH GUARD FAILED: Unauthorized Changes     ${RESET}`);
  log(`${RED}${BOLD}===============================================${RESET}`);

  log(`\n${BOLD}Restricted files modified:${RESET}`);
  restrictedFiles.forEach(f => log(`  ${RED}✗${RESET} ${f}`));

  log(`\n${BOLD}${YELLOW}How to fix:${RESET}`);
  log(`\n  ${CYAN}Option 1:${RESET} Add the label "${GREEN}canon-amendment${RESET}" to this PR`);
  log(`           (Requires maintainer approval for scope expansion)`);
  log(`\n  ${CYAN}Option 2:${RESET} Include a Work Order reference in the PR title or body:`);
  log(`           - ${GREEN}WO-123${RESET} (Work Order ID)`);
  log(`           - ${GREEN}#123${RESET} (GitHub Issue reference)`);
  log(`           - ${GREEN}Work Order: description${RESET}`);

  log(`\n${BOLD}Restricted path rules:${RESET}`);
  log(`  These paths require authorization to modify:`);
  RESTRICTED_PATHS.forEach(p => log(`    - ${p}*`));

  log(`\n${BOLD}Always-allowed paths:${RESET}`);
  log(`  These paths can always be modified:`);
  log(`    - apps/dashboard/**`);
  log(`    - packages/** (types, validators, utils, feature-flags)`);
  log(`    - docs/canon/**, docs/audit/**, docs/_archive/**`);
  log(`    - contracts/**`);
  log(`    - .claude/**, CLAUDE.md`);
  log(`    - Root config files (package.json, tsconfig.json, etc.)`);

  process.exit(1);
}

// Run main
main();
