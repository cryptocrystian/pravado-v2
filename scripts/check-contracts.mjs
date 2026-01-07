#!/usr/bin/env node

/**
 * Contracts Gate Script
 *
 * Validates contract examples and enforces that mock data
 * only comes from /contracts/examples (no duplicate sources).
 *
 * Checks:
 * A) All JSON in /contracts/examples is parseable
 * B) Dashboard mock imports only from /contracts/examples
 * C) No unauthorized mock folders exist
 *
 * Exit codes:
 * 0 - All checks passed
 * 1 - One or more checks failed
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

const CONTRACTS_DIR = join(ROOT_DIR, 'contracts', 'examples');
const DASHBOARD_DIR = join(ROOT_DIR, 'apps', 'dashboard');

// Allowed mock import sources (patterns)
const ALLOWED_MOCK_SOURCES = [
  'contracts/examples',
  '@/mocks', // The canonical mock folder that re-exports contracts
  './handlers', // Internal mock handler imports
  './browser',
  './server',
  './index',
];

// Forbidden mock folder patterns
const FORBIDDEN_MOCK_FOLDERS = [
  'apps/dashboard/src/__mocks__',
  'apps/dashboard/mocks',
  'apps/dashboard/src/fixtures',
  'apps/dashboard/src/test-data',
];

let hasErrors = false;

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function error(message) {
  log(`ERROR: ${message}`, RED);
  hasErrors = true;
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
 * A) Validate all JSON files in /contracts/examples are parseable
 */
function checkContractJsonValidity() {
  log(`\n${BOLD}=== A) Contract JSON Validity ===${RESET}\n`);

  if (!existsSync(CONTRACTS_DIR)) {
    error(`Contracts directory not found: ${CONTRACTS_DIR}`);
    return;
  }

  const jsonFiles = readdirSync(CONTRACTS_DIR).filter((f) => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    error('No JSON files found in contracts/examples');
    return;
  }

  info(`Found ${jsonFiles.length} contract example files`);

  const results = [];

  for (const file of jsonFiles) {
    const filePath = join(CONTRACTS_DIR, file);
    try {
      const content = readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);

      // Basic structure validation
      const keys = Object.keys(parsed);
      results.push({
        file,
        valid: true,
        keys: keys.length,
        size: content.length,
      });
    } catch (err) {
      results.push({
        file,
        valid: false,
        error: err.message,
      });
      error(`Failed to parse ${file}: ${err.message}`);
    }
  }

  const validCount = results.filter((r) => r.valid).length;

  if (validCount === jsonFiles.length) {
    success(`All ${jsonFiles.length} contract files are valid JSON`);
    log('\nContract files:');
    results.forEach((r) => {
      log(`  ${GREEN}✓${RESET} ${r.file} (${r.keys} keys, ${r.size} bytes)`);
    });
  } else {
    error(`${jsonFiles.length - validCount} contract files have JSON errors`);
  }
}

/**
 * B) Check that dashboard mock imports only from contracts/examples
 */
function checkMockImportSources() {
  log(`\n${BOLD}=== B) Mock Import Source Validation ===${RESET}\n`);

  const mocksDir = join(DASHBOARD_DIR, 'src', 'mocks');

  if (!existsSync(mocksDir)) {
    warn('Dashboard mocks directory not found, skipping import check');
    return;
  }

  // Find all TypeScript files in mocks directory
  const mockFiles = readdirSync(mocksDir).filter(
    (f) => f.endsWith('.ts') || f.endsWith('.tsx')
  );

  info(`Checking ${mockFiles.length} mock files for import sources`);

  const violations = [];

  for (const file of mockFiles) {
    const filePath = join(mocksDir, file);
    const content = readFileSync(filePath, 'utf-8');

    // Find all import statements
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];

      // Skip node_modules imports
      if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
        continue;
      }

      // Check if import is from allowed sources
      const isAllowed = ALLOWED_MOCK_SOURCES.some(
        (allowed) =>
          importPath.includes(allowed) ||
          importPath.startsWith('./') ||
          importPath.startsWith('../')
      );

      // Check specifically for mock data that should come from contracts
      if (importPath.includes('mock') || importPath.includes('fixture') || importPath.includes('test-data')) {
        if (!importPath.includes('contracts/examples') && !importPath.startsWith('./')) {
          violations.push({
            file,
            import: importPath,
            reason: 'Mock data should be imported from contracts/examples',
          });
        }
      }
    }
  }

  if (violations.length === 0) {
    success('All mock imports are from allowed sources');
  } else {
    violations.forEach((v) => {
      error(`${v.file}: Invalid import "${v.import}" - ${v.reason}`);
    });
  }
}

/**
 * C) Check for forbidden mock folders
 */
function checkNoForbiddenMockFolders() {
  log(`\n${BOLD}=== C) Forbidden Mock Folder Check ===${RESET}\n`);

  const foundForbidden = [];

  for (const folder of FORBIDDEN_MOCK_FOLDERS) {
    const fullPath = join(ROOT_DIR, folder);
    if (existsSync(fullPath) && statSync(fullPath).isDirectory()) {
      foundForbidden.push(folder);
    }
  }

  if (foundForbidden.length === 0) {
    success('No forbidden mock folders found');
  } else {
    foundForbidden.forEach((folder) => {
      error(`Forbidden mock folder exists: ${folder}`);
      log(`  Move mock data to /contracts/examples instead`, YELLOW);
    });
  }
}

/**
 * D) Validate required contract files exist
 */
function checkRequiredContracts() {
  log(`\n${BOLD}=== D) Required Contract Files ===${RESET}\n`);

  const required = [
    'action-stream.json',
    'intelligence-canvas.json',
    'strategy-panel.json',
    'orchestration-calendar.json',
  ];

  const missing = [];

  for (const file of required) {
    const filePath = join(CONTRACTS_DIR, file);
    if (!existsSync(filePath)) {
      missing.push(file);
    }
  }

  if (missing.length === 0) {
    success(`All ${required.length} required contract files exist`);
    required.forEach((f) => log(`  ${GREEN}✓${RESET} ${f}`));
  } else {
    missing.forEach((f) => {
      error(`Missing required contract: ${f}`);
    });
  }
}

/**
 * Main execution
 */
function main() {
  log(`${BOLD}===============================================${RESET}`);
  log(`${BOLD}        PRAVADO Contracts Gate Check          ${RESET}`);
  log(`${BOLD}===============================================${RESET}`);

  checkContractJsonValidity();
  checkMockImportSources();
  checkNoForbiddenMockFolders();
  checkRequiredContracts();

  log(`\n${BOLD}===============================================${RESET}`);

  if (hasErrors) {
    log(`${RED}FAILED: Contracts gate check failed!${RESET}`);
    log(`${RED}Please fix the issues above before merging.${RESET}`);
    process.exit(1);
  } else {
    log(`${GREEN}PASSED: All contracts gate checks passed!${RESET}`);
    process.exit(0);
  }
}

main();
