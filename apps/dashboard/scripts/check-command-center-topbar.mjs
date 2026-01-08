#!/usr/bin/env node
/**
 * CI Guard: Command Center Topbar Search Duplication
 *
 * Prevents regression of duplicate search elements in the command-center scope.
 * The Command Center uses Omni-Tray (a single AI command interface), NOT multiple search inputs.
 *
 * Fails if in command-center scope there are 2+ occurrences of:
 * - placeholder="Search" or placeholder containing "search"
 * - aria-label containing "search" (case insensitive)
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMAND_CENTER_SCOPE = path.resolve(__dirname, '../src/components/command-center');
const COMMAND_CENTER_APP_SCOPE = path.resolve(__dirname, '../src/app/app/command-center');

// Patterns that indicate a search input (not Omni-Tray)
const SEARCH_PATTERNS = [
  /placeholder=["'][^"']*[Ss]earch[^"']*["']/g,
  /aria-label=["'][^"']*[Ss]earch[^"']*["']/gi,
  /<input[^>]*type=["']search["'][^>]*>/g,
];

// Exceptions - these are allowed (Omni-Tray trigger, etc.)
const ALLOWED_PATTERNS = [
  /Open Omni-Tray/,
  /Ask Pravado/,
  /Omni-Tray/,
];

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) {
    return fileList;
  }

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, fileList);
    } else if (/\.(tsx?|jsx?|js)$/.test(file)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function findSearchOccurrences(directory) {
  const occurrences = [];
  const files = walkDir(directory);

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');

    for (const pattern of SEARCH_PATTERNS) {
      // Reset regex lastIndex
      pattern.lastIndex = 0;
      const matches = content.match(pattern) || [];
      for (const match of matches) {
        // Check if this match is in an allowed context
        const isAllowed = ALLOWED_PATTERNS.some((allowed) => allowed.test(match));
        if (!isAllowed) {
          occurrences.push({
            file: filePath,
            match,
          });
        }
      }
    }
  }

  return occurrences;
}

function main() {
  console.log('Checking for duplicate search elements in Command Center scope...\n');

  const allOccurrences = [];

  // Check both scopes
  for (const scope of [COMMAND_CENTER_SCOPE, COMMAND_CENTER_APP_SCOPE]) {
    if (fs.existsSync(scope)) {
      const occurrences = findSearchOccurrences(scope);
      allOccurrences.push(...occurrences);
    }
  }

  if (allOccurrences.length >= 2) {
    console.error('FAIL: Multiple search elements detected in Command Center scope!\n');
    console.error('The Command Center should only have ONE search-like element: the Omni-Tray trigger.\n');
    console.error('Found occurrences:');
    for (const occ of allOccurrences) {
      console.error(`  - ${occ.file}`);
      console.error(`    Match: ${occ.match}\n`);
    }
    console.error('\nTo fix:');
    console.error('1. Remove duplicate search inputs');
    console.error('2. Use the Omni-Tray trigger pattern (see CommandCenterTopbar.tsx)');
    console.error('3. Ensure aria-label uses "Open Omni-Tray" not "Search"\n');
    process.exit(1);
  }

  if (allOccurrences.length === 1) {
    console.log('WARNING: One search-like element found. Ensure it is intentional.');
    console.log(`  - ${allOccurrences[0].file}`);
    console.log(`    Match: ${allOccurrences[0].match}\n`);
  }

  console.log('PASS: No duplicate search elements in Command Center scope.\n');
  process.exit(0);
}

main();
