#!/usr/bin/env node
/**
 * CI Guard: Command Center Density + Calendar UX + Legibility v3.0
 *
 * Prevents regression of:
 * 1. UI density patterns (v7.0 - comfortable/standard/compact)
 * 2. Calendar UX (day selection, schedule drawer)
 * 3. Action Stream no-layout-shift hover (absolute positioned overlay)
 * 4. Active/History lifecycle toggle
 * 5. Legibility (no low-contrast zinc-500/600 for primary labels)
 * 6. CTA hierarchy (dominant primary in comfortable mode)
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMAND_CENTER_COMPONENTS = path.resolve(__dirname, '../src/components/command-center');

// Required patterns for compliance
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
      { regex: /selectedDate/, description: 'Day selection state (v2.5)' },
      { regex: /calendar-day-cell|CalendarDayCell/, description: 'Day cell component (v2.5)' },
    ],
  },
  {
    file: 'ActionStreamPane.tsx',
    patterns: [
      { regex: /LAYER 1|LAYER 2/i, description: 'Layer documentation comments' },
      { regex: /ActionCard|DensityLevel/, description: 'ActionCard component import' },
      { regex: /useSearchParams/, description: 'Query param support for density override (v6)' },
      { regex: /densityOverride|hasValidOverride/, description: 'Dev density override logic (v6)' },
      { regex: /lifecycleBucket|LifecycleBucket/, description: 'Active/History lifecycle state (v7)' },
      { regex: /Active.*History|bucketCounts/i, description: 'Active/History toggle UI (v7)' },
    ],
  },
  {
    file: 'ActionCard.tsx',
    patterns: [
      { regex: /action-card-v[3456]/, description: 'Action card v3/v4/v5/v6 CSS class marker' },
      { regex: /densityLevel|DensityLevel/, description: 'Density level support' },
      { regex: /onPrimaryAction|onReview/, description: 'On-card CTA handlers (v5+: onReview replaces onSecondaryAction)' },
      { regex: /group-hover:opacity/, description: 'Hover opacity transitions (v6: no-layout-shift)' },
      { regex: /COMFORTABLE MODE|UX-PILOT/i, description: 'UX-Pilot authority comment' },
      { regex: /DOMINANT|EXECUTES action/i, description: 'CTA behavior documentation' },
      { regex: /min-h-\[180px\]|min-h-\[120px\]/, description: 'Fixed height cards (v6: no-layout-shift)' },
      { regex: /absolute.*bottom|NO LAYOUT SHIFT/i, description: 'Absolute positioned hover (v6)' },
    ],
  },
];

// Forbidden patterns (should NOT be present for legibility)
const FORBIDDEN_PATTERNS = [
  {
    file: 'CommandCenterTopbar.tsx',
    patterns: [
      // Primary nav labels should NOT use low-contrast grays
      { regex: /text-zinc-500|text-zinc-600/, description: 'Low-contrast zinc colors on primary labels' },
      // Old slate-5 pattern on primary nav (replaced with white/75)
      { regex: /'text-slate-5 hover:text-white hover:bg-\[#13131A\]'/, description: 'Old low-contrast nav pattern' },
    ],
  },
];

function checkFile(fileName, requiredPatterns, forbiddenPatterns = []) {
  const filePath = path.join(COMMAND_CENTER_COMPONENTS, fileName);

  if (!fs.existsSync(filePath)) {
    return { success: false, errors: [`File not found: ${fileName}`] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];

  // Check required patterns (must be present)
  for (const pattern of requiredPatterns) {
    if (!pattern.regex.test(content)) {
      errors.push(`Missing required: ${pattern.description}`);
    }
  }

  // Check forbidden patterns (must NOT be present)
  for (const pattern of forbiddenPatterns) {
    if (pattern.regex.test(content)) {
      errors.push(`Found forbidden: ${pattern.description}`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

function main() {
  console.log('Checking Command Center density, UX, and legibility patterns...\n');

  let hasErrors = false;
  const results = [];

  // Check required patterns
  for (const check of REQUIRED_PATTERNS) {
    const result = checkFile(check.file, check.patterns);
    results.push({ file: check.file, ...result });

    if (!result.success) {
      hasErrors = true;
    }
  }

  // Check forbidden patterns
  for (const check of FORBIDDEN_PATTERNS) {
    const result = checkFile(check.file, [], check.patterns);
    results.push({ file: check.file + ' (legibility)', ...result });

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
    console.error('FAIL: Command Center patterns are incomplete or have regressions.\n');
    console.error('Required patterns:');
    console.error('  - IntelligenceCanvasPane: Tabs + 2-row layout');
    console.error('  - StrategyPanelPane: Insights drawer + progressive disclosure');
    console.error('  - CalendarPeek: Schedule drawer + Day/Week/Month toggle + day selection');
    console.error('  - ActionStreamPane: Hover-peek class + layer structure');
    console.error('  - CommandCenterTopbar: No low-contrast zinc-500/600 on primary labels\n');
    process.exit(1);
  }

  console.log('PASS: All Command Center patterns present and legibility checks passed.\n');
  process.exit(0);
}

main();
