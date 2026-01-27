#!/usr/bin/env node
/**
 * Gate 1A Network Invariant Enforcement Script
 *
 * This script enforces the Gate 1A invariant:
 * - Browser code must ONLY call /api/* route handlers
 * - Browser code must NEVER call backend API directly (/api/v1/* or localhost:4000)
 *
 * Allowed patterns (server-side only):
 * - backendFetch('/api/v1/...') in route handlers and server components
 * - apiRequest('/api/v1/...') in server components
 * - Files in /app/api/ (route handlers)
 * - Files in /server/ (server utilities)
 *
 * Forbidden patterns (client-side):
 * - fetch('/api/v1/...')
 * - fetch('http://localhost:4000/...')
 * - fetch('${apiUrl}/api/v1/...')
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to check (relative to dashboard src)
const CHECK_DIRS = [
  'app/app',        // Page components
  'app/onboarding', // Onboarding pages
  'components',     // Shared components
  'hooks',          // Client hooks
];

// Directories to exclude (these are allowed to use /api/v1)
const EXCLUDE_DIRS = [
  'app/api',       // Route handlers - they proxy to backend
  'server',        // Server utilities
  'lib',           // Contains server-side apiClient
];

// Patterns that indicate a client-side violation
const VIOLATION_PATTERNS = [
  // Direct localhost calls
  /['"`]https?:\/\/localhost:\d+\/api\/v1/g,
  // Template string with apiUrl
  /\$\{apiUrl\}\/api\/v1/g,
  // Direct /api/v1 fetch (but allow backendFetch and apiRequest)
  /fetch\s*\(\s*['"`]\/api\/v1/g,
  /fetch\s*\(\s*`\/api\/v1/g,
];

// Files that are server components (start with async function or use 'use server')
function isServerComponent(content) {
  // Has 'use client' directive = client component
  if (content.includes("'use client'") || content.includes('"use client"')) {
    return false;
  }
  // Uses backendFetch or apiRequest = server component
  if (content.includes('backendFetch') || content.includes('apiRequest')) {
    return true;
  }
  // Has async default export function = likely server component
  if (/export\s+default\s+async\s+function/.test(content)) {
    return true;
  }
  // Default: assume client for safety
  return false;
}

function checkFile(filePath) {
  const violations = [];
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip if it's a server component
  if (isServerComponent(content)) {
    return violations;
  }

  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    for (const pattern of VIOLATION_PATTERNS) {
      // Reset lastIndex for global patterns
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: lineNumber,
          content: line.trim().substring(0, 100),
          pattern: pattern.toString(),
        });
      }
    }
  }

  return violations;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  }
}

function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  let allViolations = [];
  let filesChecked = 0;

  console.log('Gate 1A Network Invariant Check');
  console.log('================================\n');
  console.log('Checking directories:', CHECK_DIRS.join(', '));
  console.log('Excluding:', EXCLUDE_DIRS.join(', '));
  console.log('');

  for (const checkDir of CHECK_DIRS) {
    const fullPath = path.join(srcDir, checkDir);
    if (!fs.existsSync(fullPath)) {
      console.log(`Skipping ${checkDir} (does not exist)`);
      continue;
    }

    walkDir(fullPath, (filePath) => {
      // Check if file is in an excluded directory
      const relativePath = path.relative(srcDir, filePath);
      const isExcluded = EXCLUDE_DIRS.some((exclude) =>
        relativePath.startsWith(exclude)
      );

      if (isExcluded) {
        return;
      }

      filesChecked++;
      const violations = checkFile(filePath);
      allViolations = allViolations.concat(violations);
    });
  }

  console.log(`Files checked: ${filesChecked}`);
  console.log(`Violations found: ${allViolations.length}\n`);

  if (allViolations.length > 0) {
    console.log('VIOLATIONS:');
    console.log('-----------');
    for (const v of allViolations) {
      const relativePath = path.relative(srcDir, v.file);
      console.log(`\n${relativePath}:${v.line}`);
      console.log(`  ${v.content}`);
    }
    console.log('\n');
    console.log('Gate 1A FAILED: Client code must only call /api/* route handlers.');
    console.log('Fix violations above before committing.\n');
    process.exit(1);
  }

  console.log('Gate 1A PASSED: No network invariant violations found.\n');
  process.exit(0);
}

main();
