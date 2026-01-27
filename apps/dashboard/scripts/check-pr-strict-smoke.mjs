#!/usr/bin/env node

/**
 * PR Pillar Strict Mode Smoke Test
 * Sprint S100.1: CI-friendly validation of strict API mode
 *
 * This script validates that when PRAVADO_STRICT_API=1:
 * 1. /api/pr/status endpoint responds with 200
 * 2. Authenticated routes exist (200 or 401, NOT 404/500)
 * 3. PR UI code does NOT import demo generators when strict mode is enabled
 *
 * Usage:
 *   node scripts/check-pr-strict-smoke.mjs           # Run all checks
 *   node scripts/check-pr-strict-smoke.mjs --warn    # Warn only, don't fail
 *   node scripts/check-pr-strict-smoke.mjs --static  # Static scan only
 *
 * Environment:
 *   NEXT_PUBLIC_BASE_URL - Base URL for API calls (default: http://localhost:3000)
 *   PRAVADO_STRICT_API - Must be '1' for strict mode validation
 *
 * @see /docs/dev/PR_PILLAR_TESTING.md
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

const WARN_ONLY = process.argv.includes('--warn');
const STATIC_ONLY = process.argv.includes('--static');

// Base URL for API calls
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Construct full API URL
function apiUrl(path) {
  const fullPath = BASE_PATH ? `${BASE_PATH}${path}` : path;
  return `${BASE_URL}${fullPath}`;
}

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// ============================================================================
// PART 1: Network Smoke Tests
// ============================================================================

/**
 * Check /api/pr/status endpoint
 * Should return 200 with auth status (even for unauthenticated requests)
 */
async function checkStatusEndpoint() {
  const url = apiUrl('/api/pr/status');
  log(`\n📡 Checking status endpoint: ${url}`, 'blue');

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (response.status !== 200) {
      return {
        pass: false,
        message: `Status endpoint returned ${response.status}, expected 200`,
      };
    }

    const data = await response.json();

    // Check x-pr-auth header
    const authHeader = response.headers.get('x-pr-auth');
    log(`  x-pr-auth header: ${authHeader || '(not set)'}`, 'dim');

    // Check strict mode flags in response
    const prFlags = data.prFlags || data.flags || {};
    log(`  strictApi: ${prFlags.strictApi}`, 'dim');
    log(`  allowMockFallback: ${prFlags.allowMockFallback}`, 'dim');

    // Validate structure
    if (!data.auth || typeof data.auth.status !== 'string') {
      return {
        pass: false,
        message: 'Status response missing auth.status field',
        data,
      };
    }

    return {
      pass: true,
      message: `Status endpoint OK (auth: ${data.auth.status})`,
      authStatus: data.auth.status,
      prFlags,
    };
  } catch (err) {
    return {
      pass: false,
      message: `Failed to fetch status: ${err.message}`,
    };
  }
}

/**
 * Check that PR API routes exist (not 404/500)
 * We expect 200 (if auth passes) or 401/403 (if not authenticated)
 */
async function checkRouteExists(path, method = 'GET') {
  const url = apiUrl(path);

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Accept': 'application/json' },
    });

    // Accept: 200, 401, 403 (route exists)
    // Reject: 404 (route not found), 500 (server error)
    const acceptable = [200, 401, 403];
    const rejected = [404, 500, 502, 503];

    if (rejected.includes(response.status)) {
      return {
        pass: false,
        message: `Route ${path} returned ${response.status} (should not be 404/5xx)`,
        status: response.status,
      };
    }

    // Check for mock flag in response (only for 200 responses)
    if (response.status === 200) {
      try {
        const data = await response.json();
        if (data._mock === true) {
          return {
            pass: false,
            message: `Route ${path} returned mock data (_mock: true) - strict mode should prevent this`,
            status: response.status,
            isMock: true,
          };
        }
      } catch {
        // Not JSON, that's fine
      }
    }

    return {
      pass: true,
      message: `Route ${path} exists (${response.status})`,
      status: response.status,
    };
  } catch (err) {
    return {
      pass: false,
      message: `Failed to fetch ${path}: ${err.message}`,
    };
  }
}

// ============================================================================
// PART 2: Static Code Scan
// ============================================================================

/**
 * Directories to scan for demo/mock imports
 */
const SCAN_DIRS = [
  'src/components/pr-work-surface',
  'src/app/app/pr',
];

/**
 * Patterns that indicate demo/mock data usage in production code
 */
const DEMO_PATTERNS = [
  {
    regex: /import.*from.*['"].*demo.*['"]/gi,
    name: 'demo-import',
    message: 'Importing from demo module',
  },
  {
    regex: /import.*from.*['"].*mock.*['"]/gi,
    name: 'mock-import',
    message: 'Importing from mock module',
  },
  {
    regex: /generateMock(Journalists|Pitches|Sequences|Lists|Inbox)/gi,
    name: 'mock-generator',
    message: 'Using mock data generator function',
  },
  {
    regex: /demoData\s*[=:]/gi,
    name: 'demo-data-var',
    message: 'Demo data variable assignment',
  },
  {
    regex: /DEMO_MODE.*\?.*mock/gi,
    name: 'demo-conditional',
    message: 'Conditional mock based on DEMO_MODE',
  },
];

/**
 * Allowlist markers - lines containing these are skipped
 */
const ALLOWLIST_MARKERS = [
  'strict-allow:',
  '// test',
  '// TODO:',
  '.test.',
  '.spec.',
];

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  // Skip test files entirely
  if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('__tests__')) {
    return violations;
  }

  lines.forEach((line, lineIndex) => {
    // Skip if line has any allowlist marker
    if (ALLOWLIST_MARKERS.some(marker => line.toLowerCase().includes(marker.toLowerCase()))) {
      return;
    }

    // Check for demo patterns
    DEMO_PATTERNS.forEach(({ regex, name, message }) => {
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
          context: line.trim().substring(0, 100),
        });
      }
    });
  });

  return violations;
}

function scanDirectory(dir, basePath) {
  const violations = [];
  const fullPath = join(basePath, dir);

  if (!existsSync(fullPath)) {
    log(`  ⚠ Directory not found: ${dir}`, 'yellow');
    return violations;
  }

  try {
    const entries = readdirSync(fullPath);

    for (const entry of entries) {
      const entryPath = join(fullPath, entry);
      const stat = statSync(entryPath);

      if (stat.isDirectory()) {
        violations.push(...scanDirectory(join(dir, entry), basePath));
      } else if (stat.isFile() && /\.(tsx?|jsx?)$/.test(entry)) {
        violations.push(...scanFile(entryPath));
      }
    }
  } catch {
    // Directory doesn't exist, skip
  }

  return violations;
}

function runStaticScan() {
  log('\n🔍 Running static code scan for demo/mock patterns...', 'blue');

  const basePath = process.cwd();
  let allViolations = [];

  for (const dir of SCAN_DIRS) {
    log(`  Scanning ${dir}...`, 'dim');
    allViolations.push(...scanDirectory(dir, basePath));
  }

  if (allViolations.length > 0) {
    log(`\n${colors.red}Found ${allViolations.length} demo/mock pattern(s):${colors.reset}\n`);

    // Group by file
    const byFile = {};
    for (const v of allViolations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, fileViolations] of Object.entries(byFile)) {
      const relPath = relative(basePath, file);
      log(`  ${relPath}`, 'yellow');
      for (const v of fileViolations) {
        log(`    Line ${v.line}: ${v.found}`, 'red');
        log(`      ${v.message}`, 'dim');
      }
    }
  }

  return allViolations;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║       PR Pillar Strict Mode Smoke Test                    ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const strictApi = process.env.PRAVADO_STRICT_API;
  log(`PRAVADO_STRICT_API: ${strictApi || '(not set)'}`, strictApi === '1' ? 'green' : 'yellow');
  log(`Base URL: ${BASE_URL}`, 'dim');
  log(`Base Path: ${BASE_PATH || '(none)'}`, 'dim');

  if (strictApi !== '1') {
    log('\n⚠ PRAVADO_STRICT_API is not set to 1.', 'yellow');
    log('  This test is most meaningful with strict mode enabled.', 'dim');
    log('  Set PRAVADO_STRICT_API=1 in your environment.\n', 'dim');
  }

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // Part 1: Static scan (always run)
  const staticViolations = runStaticScan();
  if (staticViolations.length > 0) {
    results.failed += staticViolations.length;
  } else {
    log('\n✓ No demo/mock patterns found in PR UI code', 'green');
    results.passed++;
  }

  // Part 2: Network tests (skip if --static)
  if (!STATIC_ONLY) {
    log('\n📡 Running network smoke tests...', 'blue');
    log('  (Skip with --static flag)\n', 'dim');

    // Test 1: Status endpoint
    const statusResult = await checkStatusEndpoint();
    if (statusResult.pass) {
      log(`✓ ${statusResult.message}`, 'green');
      results.passed++;
    } else {
      log(`✗ ${statusResult.message}`, 'red');
      results.failed++;
    }

    // Test 2: Route existence checks
    const routes = [
      { path: '/api/pr/journalists?limit=1', method: 'GET' },
      { path: '/api/pr/lists', method: 'GET' },
      { path: '/api/pr/pitches/sequences?limit=1', method: 'GET' },
    ];

    for (const { path, method } of routes) {
      const routeResult = await checkRouteExists(path, method);
      if (routeResult.pass) {
        log(`✓ ${routeResult.message}`, 'green');
        results.passed++;
      } else {
        log(`✗ ${routeResult.message}`, 'red');
        results.failed++;

        // Mock data in strict mode is a critical failure
        if (routeResult.isMock && strictApi === '1') {
          log('  ⚠ CRITICAL: Mock data returned with PRAVADO_STRICT_API=1', 'red');
        }
      }
    }
  }

  // Summary
  console.log('\n╭─────────────────────────────────────────────────────────╮');
  console.log('│                    SMOKE TEST SUMMARY                   │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│  Passed:   ${String(results.passed).padEnd(4)} ✓                                     │`);
  console.log(`│  Failed:   ${String(results.failed).padEnd(4)} ✗                                     │`);
  console.log(`│  Warnings: ${String(results.warnings).padEnd(4)} ⚠                                     │`);
  console.log('╰─────────────────────────────────────────────────────────╯\n');

  if (results.failed > 0) {
    if (WARN_ONLY) {
      log('WARN: Issues found (--warn mode, not failing).', 'yellow');
      process.exit(0);
    } else {
      log('FAIL: Strict mode smoke test failed.', 'red');
      log('  Fix the issues above or run with --warn to skip failures.', 'dim');
      process.exit(1);
    }
  }

  log('PASS: All strict mode smoke tests passed.', 'green');
  process.exit(0);
}

main().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
