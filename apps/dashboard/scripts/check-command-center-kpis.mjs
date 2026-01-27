#!/usr/bin/env node
/**
 * CI Guard: Command Center KPI Compliance
 *
 * Prevents drift from the canonical EVI (Earned Visibility Index) model:
 * 1. No "AEO Health Score" references
 * 2. Strategy Panel is diagnostic-only (no action buttons)
 * 3. EVI is the single North Star KPI
 * 4. All metrics must map to EVI drivers
 *
 * @see /docs/canon/EARNED_VISIBILITY_INDEX.md
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMAND_CENTER_COMPONENTS = path.resolve(__dirname, '../src/components/command-center');
const CONTRACTS_DIR = path.resolve(__dirname, '../../../contracts/examples');
const TYPES_FILE = path.resolve(COMMAND_CENTER_COMPONENTS, 'types.ts');
const STRATEGY_PANEL_FILE = path.resolve(COMMAND_CENTER_COMPONENTS, 'StrategyPanelPane.tsx');

// Forbidden patterns (should NOT appear anywhere)
const FORBIDDEN_PATTERNS = [
  {
    pattern: /AEO\s*Health\s*Score/gi,
    description: 'AEO Health Score reference (use EVI)',
    severity: 'error',
  },
  {
    pattern: /aeoHealthScore|aeo_health_score/gi,
    description: 'AEO Health Score variable name (use evi)',
    severity: 'error',
  },
  {
    pattern: /AEOHealthScore/g,
    description: 'AEOHealthScore component (deprecated)',
    severity: 'error',
  },
];

// Required patterns for Strategy Panel compliance
const STRATEGY_PANEL_REQUIRED = [
  {
    pattern: /Earned\s*Visibility\s*Index/,
    description: 'EVI label in Strategy Panel',
  },
  {
    pattern: /evi\.score|evi\.drivers|evi\.status/,
    description: 'EVI data model usage',
  },
  {
    pattern: /EVIHero|EarnedVisibilityIndex/,
    description: 'EVI component or type reference',
  },
  {
    pattern: /DIAGNOSTIC\s*ONLY|diagnostic.only/i,
    description: 'Diagnostic-only role documented',
  },
];

// Forbidden patterns specific to Strategy Panel
const STRATEGY_PANEL_FORBIDDEN = [
  {
    pattern: /onClick.*Execute|button.*primary.*cta/i,
    description: 'Action buttons in Strategy Panel (diagnostic only)',
    severity: 'warning',
  },
  {
    pattern: /RecommendationCard|recommendations\./,
    description: 'Recommendations component (moved to Action Stream)',
    severity: 'warning',
  },
];

// Required types in types.ts
const TYPES_REQUIRED = [
  {
    pattern: /EVIStatus/,
    description: 'EVIStatus type definition',
  },
  {
    pattern: /EVIDriverType/,
    description: 'EVIDriverType type definition',
  },
  {
    pattern: /EVIDriver/,
    description: 'EVIDriver interface',
  },
  {
    pattern: /EVIMetric/,
    description: 'EVIMetric interface',
  },
  {
    pattern: /EarnedVisibilityIndex/,
    description: 'EarnedVisibilityIndex interface',
  },
  {
    pattern: /StrategyPanelResponse.*evi:/ms,
    description: 'StrategyPanelResponse uses evi field',
  },
];

// Contract validation for strategy-panel.json
const CONTRACT_REQUIRED = [
  {
    pattern: /"evi"\s*:/,
    description: 'EVI object in strategy-panel.json',
  },
  {
    pattern: /"drivers"\s*:\s*\[/,
    description: 'Drivers array in EVI object',
  },
  {
    pattern: /"visibility"|"authority"|"momentum"/,
    description: 'EVI driver types in contract',
  },
  {
    pattern: /"score"\s*:\s*\d/,
    description: 'EVI score in contract',
  },
];

function scanDirectory(dir, extensions = ['.ts', '.tsx', '.json']) {
  const files = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...scanDirectory(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkFile(filePath, forbiddenPatterns, requiredPatterns = []) {
  if (!fs.existsSync(filePath)) {
    return { success: false, errors: [`File not found: ${filePath}`], warnings: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];
  const warnings = [];
  const fileName = path.basename(filePath);

  // Check forbidden patterns
  for (const { pattern, description, severity } of forbiddenPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      const message = `${fileName}: Found forbidden pattern "${description}" (${matches.length} occurrence(s))`;
      if (severity === 'error') {
        errors.push(message);
      } else {
        warnings.push(message);
      }
    }
  }

  // Check required patterns
  for (const { pattern, description } of requiredPatterns) {
    if (!pattern.test(content)) {
      errors.push(`${fileName}: Missing required pattern "${description}"`);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

function main() {
  console.log('Checking Command Center KPI compliance (EVI North Star)...\n');

  let hasErrors = false;
  let hasWarnings = false;
  const allErrors = [];
  const allWarnings = [];

  // 1. Check all Command Center components for forbidden patterns
  console.log('1. Scanning for forbidden patterns...');
  const componentFiles = scanDirectory(COMMAND_CENTER_COMPONENTS);

  for (const file of componentFiles) {
    const result = checkFile(file, FORBIDDEN_PATTERNS);
    if (!result.success) {
      hasErrors = true;
      allErrors.push(...result.errors);
    }
    if (result.warnings.length > 0) {
      hasWarnings = true;
      allWarnings.push(...result.warnings);
    }
  }

  // 2. Check Strategy Panel specific requirements
  console.log('2. Checking Strategy Panel compliance...');
  const strategyPanelResult = checkFile(
    STRATEGY_PANEL_FILE,
    STRATEGY_PANEL_FORBIDDEN,
    STRATEGY_PANEL_REQUIRED
  );

  if (!strategyPanelResult.success) {
    hasErrors = true;
    allErrors.push(...strategyPanelResult.errors);
  }
  if (strategyPanelResult.warnings.length > 0) {
    hasWarnings = true;
    allWarnings.push(...strategyPanelResult.warnings);
  }

  // 3. Check types.ts for EVI type definitions
  console.log('3. Checking EVI type definitions...');
  const typesResult = checkFile(TYPES_FILE, [], TYPES_REQUIRED);

  if (!typesResult.success) {
    hasErrors = true;
    allErrors.push(...typesResult.errors);
  }

  // 4. Check strategy-panel.json contract
  console.log('4. Checking strategy-panel.json contract...');
  const contractFile = path.join(CONTRACTS_DIR, 'strategy-panel.json');
  const contractResult = checkFile(contractFile, FORBIDDEN_PATTERNS, CONTRACT_REQUIRED);

  if (!contractResult.success) {
    hasErrors = true;
    allErrors.push(...contractResult.errors);
  }

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
    console.error('FAIL: Command Center KPI compliance check failed.\n');
    console.error('Required:');
    console.error('  - EVI (Earned Visibility Index) is the single North Star KPI');
    console.error('  - Strategy Panel is diagnostic only (no action buttons)');
    console.error('  - All metrics map to EVI drivers (Visibility, Authority, Momentum)');
    console.error('\nForbidden:');
    console.error('  - "AEO Health Score" references');
    console.error('  - Recommendations with action buttons in Strategy Panel');
    console.error('  - Second top-level KPI in Strategy Panel\n');
    console.error('See: /docs/canon/EARNED_VISIBILITY_INDEX.md\n');
    process.exit(1);
  }

  if (hasWarnings) {
    console.log('PASS with warnings: Command Center KPI compliance check passed with warnings.\n');
  } else {
    console.log('PASS: Command Center KPI compliance check passed.\n');
  }

  console.log('✓ EVI is the North Star KPI');
  console.log('✓ Strategy Panel is diagnostic only');
  console.log('✓ No AEO Health Score references found');
  console.log('✓ EVI type definitions present');
  console.log('✓ Contract schema is EVI-centric\n');

  process.exit(0);
}

main();
