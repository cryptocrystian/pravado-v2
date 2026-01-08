#!/usr/bin/env node

/**
 * CI Guard: Command Center Shell Integrity
 *
 * Ensures Command Center and Calendar routes use the DS v3 topbar shell
 * and do NOT regress to legacy sidebar patterns.
 *
 * Fails if:
 * - command-center layout imports/uses AppShellSidebar or legacy sidebar
 * - command-center layout renders navItems sidebar patterns
 * - any command-center file references "Dashboard" nav items
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

const DASHBOARD_ROOT = process.cwd();
const COMMAND_CENTER_DIR = join(DASHBOARD_ROOT, 'src/app/app/command-center');
const CALENDAR_DIR = join(DASHBOARD_ROOT, 'src/app/app/calendar');
const COMPONENTS_DIR = join(DASHBOARD_ROOT, 'src/components/command-center');

// Forbidden patterns that indicate sidebar regression
const FORBIDDEN_PATTERNS = [
  {
    pattern: /AppShellSidebar/gi,
    message: 'References legacy AppShellSidebar component',
  },
  {
    pattern: /sidebar.*nav/gi,
    message: 'Contains sidebar navigation pattern',
  },
  {
    pattern: /navItems\s*=\s*\[/gi,
    message: 'Defines navItems array (sidebar pattern)',
  },
  {
    pattern: /<aside.*sidebar/gi,
    message: 'Renders aside element with sidebar class',
  },
  {
    pattern: /href=["']\/app["']\s*>/gi,
    message: 'Links to /app (legacy dashboard route)',
  },
  {
    pattern: /name:\s*["']Dashboard["']/gi,
    message: 'References "Dashboard" navigation item',
  },
];

// Required patterns in layout files
const REQUIRED_IN_LAYOUT = [
  {
    pattern: /CommandCenterTopbar/,
    message: 'Must use CommandCenterTopbar component',
  },
];

const errors = [];
const warnings = [];

function getAllFiles(dir, files = []) {
  if (!existsSync(dir)) {
    return files;
  }

  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      getAllFiles(fullPath, files);
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const relativePath = relative(DASHBOARD_ROOT, filePath);
  const isLayout = filePath.includes('layout.tsx');

  // Check for forbidden patterns
  for (const { pattern, message } of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(`${relativePath}: ${message}`);
    }
  }

  // Check required patterns in layout files
  if (isLayout) {
    for (const { pattern, message } of REQUIRED_IN_LAYOUT) {
      if (!pattern.test(content)) {
        errors.push(`${relativePath}: ${message}`);
      }
    }

    // Verify layout doesn't import from legacy app layout
    if (/from\s+['"]\.\.\/layout['"]/.test(content)) {
      errors.push(`${relativePath}: Imports from parent layout (potential sidebar inheritance)`);
    }
  }
}

console.log('\\n🛡️  Command Center Shell Guard\\n');
console.log('Checking for sidebar regression patterns...\\n');

// Check Command Center directory
const commandCenterFiles = getAllFiles(COMMAND_CENTER_DIR);
console.log(`  📁 command-center: ${commandCenterFiles.length} files`);
commandCenterFiles.forEach(checkFile);

// Check Calendar directory
const calendarFiles = getAllFiles(CALENDAR_DIR);
console.log(`  📁 calendar: ${calendarFiles.length} files`);
calendarFiles.forEach(checkFile);

// Check Command Center components
const componentFiles = getAllFiles(COMPONENTS_DIR);
console.log(`  📁 components/command-center: ${componentFiles.length} files`);
componentFiles.forEach(checkFile);

console.log('');

// Report results
if (errors.length > 0) {
  console.log('❌ FAILED - Sidebar regression detected:\\n');
  errors.forEach((err) => console.log(`   • ${err}`));
  console.log('\\n   Command Center must use DS v3 topbar shell, not legacy sidebar.');
  console.log('   See: /docs/canon/COMMAND-CENTER-UI.md\\n');
  process.exit(1);
}

if (warnings.length > 0) {
  console.log('⚠️  Warnings:\\n');
  warnings.forEach((warn) => console.log(`   • ${warn}`));
  console.log('');
}

console.log('✅ PASSED - Command Center shell integrity verified');
console.log('   • No sidebar regression patterns detected');
console.log('   • Layouts use CommandCenterTopbar\\n');
process.exit(0);
