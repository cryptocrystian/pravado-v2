#!/usr/bin/env node
/**
 * CI Guard: Command Center V1 Contract Compliance
 *
 * Validates the V1 frozen contract:
 * 1. Golden Flow integration (hover/execute coordination)
 * 2. Calendar fixed height constraint
 * 3. Entity Map zone layout
 * 4. Strategy Panel diagnostic-only
 * 5. No navigation during flow
 *
 * @see /docs/canon/COMMAND_CENTER_CONTRACT.md
 * @see /docs/canon/COMMAND_CENTER_GOLDEN_FLOW.md
 * @see /docs/canon/ENTITY_MAP_CONTRACT.md
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMAND_CENTER_COMPONENTS = path.resolve(__dirname, '../src/components/command-center');
const COMMAND_CENTER_PAGE = path.resolve(__dirname, '../src/app/app/command-center/page.tsx');

// ============================================
// GOLDEN FLOW CHECKS
// ============================================

const GOLDEN_FLOW_PAGE_PATTERNS = [
  {
    pattern: /hoveredActionId.*useState/,
    description: 'Hover action ID state in page',
    required: true,
  },
  {
    pattern: /executingActionId/,
    description: 'Executing action ID computation in page',
    required: true,
  },
  {
    pattern: /onHoverActionChange/,
    description: 'Hover action change callback passed to Action Stream',
    required: true,
  },
  {
    pattern: /hoveredActionId=\{hoveredActionId\}/,
    description: 'Hover action ID passed to Intelligence Canvas',
    required: true,
  },
  {
    pattern: /executingActionId=\{executingActionId\}/,
    description: 'Executing action ID passed to Intelligence Canvas',
    required: true,
  },
];

const GOLDEN_FLOW_INTELLIGENCE_CANVAS_PATTERNS = [
  {
    pattern: /hoveredActionId/,
    description: 'Hover action ID prop in Intelligence Canvas',
    required: true,
  },
  {
    pattern: /executingActionId/,
    description: 'Executing action ID prop in Intelligence Canvas',
    required: true,
  },
  {
    pattern: /EntityMap/,
    description: 'EntityMap component usage',
    required: true,
  },
];

const GOLDEN_FLOW_ACTION_STREAM_PATTERNS = [
  {
    pattern: /onHoverActionChange/,
    description: 'Hover action change callback prop',
    required: true,
  },
  {
    pattern: /HoverCard|ActionHoverBrief/,
    description: 'HoverCard or ActionHoverBrief component',
    required: true,
  },
];

// ============================================
// CALENDAR FIXED HEIGHT CHECK
// ============================================

const CALENDAR_PATTERNS = [
  {
    pattern: /h-\[280px\]/,
    description: 'Fixed height container (h-[280px])',
    required: true,
  },
  {
    pattern: /FIXED|fixed.*height|height.*fixed/i,
    description: 'Fixed height documentation comment',
    required: true,
  },
];

const CALENDAR_FORBIDDEN = [
  {
    pattern: /router\.push|useRouter\(\).*push/,
    description: 'Navigation on calendar item click (should open modal)',
    severity: 'warning',
  },
];

// ============================================
// ENTITY MAP ZONE CHECK
// ============================================

const ENTITY_MAP_ZONE_PATTERNS = [
  {
    pattern: /authority.*signal.*growth.*exposure|ZONE_POSITIONS/,
    description: 'SAGE zone positions defined',
    required: true,
  },
  {
    pattern: /zone:\s*['"]?(authority|signal|growth|exposure)['"]?/,
    description: 'Zone assignment in node props',
    required: true,
  },
];

// ============================================
// STRATEGY PANEL DIAGNOSTIC CHECK
// ============================================

const STRATEGY_PANEL_FORBIDDEN = [
  {
    pattern: /onPrimaryAction|onClick.*execute/i,
    description: 'Action execution in Strategy Panel (diagnostic only)',
    severity: 'error',
  },
  {
    pattern: /<button.*Execute|<button.*primary/i,
    description: 'Action buttons in Strategy Panel (diagnostic only)',
    severity: 'warning',
  },
];

// ============================================
// FILE CHECKS
// ============================================

function checkFile(filePath, requiredPatterns, forbiddenPatterns = []) {
  if (!fs.existsSync(filePath)) {
    return { success: false, errors: [`File not found: ${filePath}`], warnings: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];
  const warnings = [];
  const fileName = path.basename(filePath);

  // Check required patterns
  for (const { pattern, description, required } of requiredPatterns) {
    if (required && !pattern.test(content)) {
      errors.push(`${fileName}: Missing required pattern - ${description}`);
    }
  }

  // Check forbidden patterns
  for (const { pattern, description, severity } of forbiddenPatterns) {
    if (pattern.test(content)) {
      const message = `${fileName}: Found forbidden pattern - ${description}`;
      if (severity === 'error') {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  }

  return { success: errors.length === 0, errors, warnings };
}

// ============================================
// MAIN
// ============================================

function main() {
  console.log('Checking Command Center V1 Contract Compliance...\n');

  let hasErrors = false;
  const allErrors = [];
  const allWarnings = [];

  // 1. Check Golden Flow in page.tsx
  console.log('1. Checking Golden Flow integration (page.tsx)...');
  const pageResult = checkFile(COMMAND_CENTER_PAGE, GOLDEN_FLOW_PAGE_PATTERNS);
  if (!pageResult.success) {
    hasErrors = true;
    allErrors.push(...pageResult.errors);
  }

  // 2. Check Golden Flow in IntelligenceCanvasPane
  console.log('2. Checking Intelligence Canvas integration...');
  const canvasResult = checkFile(
    path.join(COMMAND_CENTER_COMPONENTS, 'IntelligenceCanvasPane.tsx'),
    GOLDEN_FLOW_INTELLIGENCE_CANVAS_PATTERNS
  );
  if (!canvasResult.success) {
    hasErrors = true;
    allErrors.push(...canvasResult.errors);
  }

  // 3. Check Golden Flow in ActionStreamPane
  console.log('3. Checking Action Stream integration...');
  const streamResult = checkFile(
    path.join(COMMAND_CENTER_COMPONENTS, 'ActionStreamPane.tsx'),
    GOLDEN_FLOW_ACTION_STREAM_PATTERNS
  );
  if (!streamResult.success) {
    hasErrors = true;
    allErrors.push(...streamResult.errors);
  }

  // 4. Check Calendar fixed height
  console.log('4. Checking Calendar fixed height contract...');
  const calendarResult = checkFile(
    path.join(COMMAND_CENTER_COMPONENTS, 'CalendarPeek.tsx'),
    CALENDAR_PATTERNS,
    CALENDAR_FORBIDDEN
  );
  if (!calendarResult.success) {
    hasErrors = true;
    allErrors.push(...calendarResult.errors);
  }
  allWarnings.push(...calendarResult.warnings);

  // 5. Check Entity Map zones
  console.log('5. Checking Entity Map zone layout...');
  const entityMapResult = checkFile(
    path.join(COMMAND_CENTER_COMPONENTS, 'EntityMap.tsx'),
    ENTITY_MAP_ZONE_PATTERNS
  );
  if (!entityMapResult.success) {
    hasErrors = true;
    allErrors.push(...entityMapResult.errors);
  }

  // 6. Check Strategy Panel diagnostic-only
  console.log('6. Checking Strategy Panel diagnostic-only...');
  const strategyResult = checkFile(
    path.join(COMMAND_CENTER_COMPONENTS, 'StrategyPanelPane.tsx'),
    [],
    STRATEGY_PANEL_FORBIDDEN
  );
  if (!strategyResult.success) {
    hasErrors = true;
    allErrors.push(...strategyResult.errors);
  }
  allWarnings.push(...strategyResult.warnings);

  // Output results
  console.log('\n');

  if (allWarnings.length > 0) {
    console.warn('WARNINGS:');
    for (const warning of allWarnings) {
      console.warn(`  ⚠ ${warning}`);
    }
    console.log('');
  }

  if (allErrors.length > 0) {
    console.error('ERRORS:');
    for (const error of allErrors) {
      console.error(`  ✗ ${error}`);
    }
    console.log('');
  }

  if (hasErrors) {
    console.error('FAIL: Command Center V1 Contract check failed.\n');
    console.error('V1 Contract Requirements:');
    console.error('  - Golden Flow: hoveredActionId/executingActionId coordination');
    console.error('  - Calendar: Fixed h-[280px] container');
    console.error('  - Entity Map: SAGE zone layout (authority/signal/growth/exposure)');
    console.error('  - Strategy Panel: Diagnostic only (no action buttons)');
    console.error('\nSee: /docs/canon/COMMAND_CENTER_CONTRACT.md\n');
    process.exit(1);
  }

  console.log('PASS: Command Center V1 Contract check passed.\n');
  console.log('✓ Golden Flow integration verified');
  console.log('✓ Calendar fixed height enforced');
  console.log('✓ Entity Map zone layout present');
  console.log('✓ Strategy Panel is diagnostic-only');
  console.log('');

  process.exit(0);
}

main();
