#!/usr/bin/env node
/**
 * CI Guard: Command Center Density + Calendar UX
 *
 * Prevents regression of UI density and calendar UX patterns:
 * 1. Intelligence pane must use tabs and 2-row structure
 * 2. Calendar peek must have Schedule Drawer
 * 3. Strategy pane must have progressive disclosure with drawer
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMAND_CENTER_COMPONENTS = path.resolve(__dirname, '../src/components/command-center');

// Required patterns for density compliance
const REQUIRED_PATTERNS = [
  {
    file: 'IntelligenceCanvasPane.tsx',
    patterns: [
      { regex: /activeTab|setActiveTab/, description: 'Tab state management' },
      { regex: /tabs\.map|TabConfig/, description: 'Tab configuration' },
      { regex: /TOP ROW|BOTTOM ROW|2-Row/i, description: '2-row layout structure comment' },
    ],
  },
  {
    file: 'StrategyPanelPane.tsx',
    patterns: [
      { regex: /InsightsDrawer|isDrawerOpen/, description: 'Insights drawer component' },
      { regex: /View all.*→|handleOpenDrawer/, description: 'View all trigger for progressive disclosure' },
    ],
  },
  {
    file: 'CalendarPeek.tsx',
    patterns: [
      { regex: /ScheduleDrawer/, description: 'Schedule drawer component' },
      { regex: /viewMode.*day.*week.*month|ViewMode/i, description: 'Day/Week/Month view toggle' },
      { regex: /handleItemClick|selectedItem/, description: 'Item selection for drawer' },
    ],
  },
];

function checkFile(fileName, requiredPatterns) {
  const filePath = path.join(COMMAND_CENTER_COMPONENTS, fileName);

  if (!fs.existsSync(filePath)) {
    return { success: false, errors: [`File not found: ${fileName}`] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];

  for (const pattern of requiredPatterns) {
    if (!pattern.regex.test(content)) {
      errors.push(`Missing: ${pattern.description}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

function main() {
  console.log('Checking Command Center density and UX patterns...\n');

  let hasErrors = false;
  const results = [];

  for (const check of REQUIRED_PATTERNS) {
    const result = checkFile(check.file, check.patterns);
    results.push({ file: check.file, ...result });

    if (!result.success) {
      hasErrors = true;
    }
  }

  // Output results
  for (const result of results) {
    if (result.success) {
      console.log(`✓ ${result.file}`);
    } else {
      console.error(`✗ ${result.file}`);
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('FAIL: Command Center density/UX patterns are incomplete.\n');
    console.error('Required patterns:');
    console.error('  - IntelligenceCanvasPane: Tabs + 2-row layout');
    console.error('  - StrategyPanelPane: Insights drawer + progressive disclosure');
    console.error('  - CalendarPeek: Schedule drawer + Day/Week/Month toggle\n');
    process.exit(1);
  }

  console.log('PASS: All Command Center density/UX patterns present.\n');
  process.exit(0);
}

main();
