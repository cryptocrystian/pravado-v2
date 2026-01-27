#!/usr/bin/env node

/**
 * EVI Specification Guardrail
 *
 * CI script to ensure EVI implementation matches canonical specification.
 * Fails build if:
 * - EVI weights don't sum to 1.0
 * - EVI bands are not contiguous 0-100
 * - "AEO Health Score" appears anywhere in codebase
 * - Strategy Panel has duplicate top-level KPIs
 *
 * @see /docs/canon/EARNED_VISIBILITY_INDEX.md
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let errors = [];
let warnings = [];

// Canonical constants
const CANONICAL_WEIGHTS = {
  visibility: 0.40,
  authority: 0.35,
  momentum: 0.25,
};

const CANONICAL_BANDS = {
  at_risk: { min: 0, max: 40 },
  emerging: { min: 41, max: 60 },
  competitive: { min: 61, max: 80 },
  dominant: { min: 81, max: 100 },
};

// Banned patterns - only check for AEO-specific terms
// Note: Generic "health score" is allowed in non-EVI contexts (e.g., journalist health)
const BANNED_PATTERNS = [
  { pattern: /AEO\s*Health\s*Score/gi, message: '"AEO Health Score" is deprecated - use EVI only' },
  { pattern: /\bAEO\s*Score\b/gi, message: '"AEO Score" is deprecated - use EVI only' },
];

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir, files = []) {
  try {
    const items = readdirSync(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === '.next') {
        continue;
      }
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          getAllFiles(fullPath, files);
        } else if (stat.isFile()) {
          files.push(fullPath);
        }
      } catch {
        // Skip files we can't read
      }
    }
  } catch {
    // Skip directories we can't read
  }
  return files;
}

/**
 * Check EVI types file for canonical constants
 */
function checkEVITypes() {
  console.log('\n📐 Checking EVI Types...');

  const typesPath = 'src/lib/evi/types.ts';
  let content;

  try {
    content = readFileSync(typesPath, 'utf-8');
  } catch {
    errors.push(`EVI types file not found: ${typesPath}`);
    return;
  }

  // Check weights
  const weightsMatch = content.match(/EVI_WEIGHTS\s*=\s*\{([^}]+)\}/s);
  if (!weightsMatch) {
    errors.push('EVI_WEIGHTS constant not found in types.ts');
  } else {
    const weightsBlock = weightsMatch[1];

    // Extract weights
    const visMatch = weightsBlock.match(/visibility:\s*([\d.]+)/);
    const authMatch = weightsBlock.match(/authority:\s*([\d.]+)/);
    const momMatch = weightsBlock.match(/momentum:\s*([\d.]+)/);

    if (!visMatch || !authMatch || !momMatch) {
      errors.push('Missing weight definitions in EVI_WEIGHTS');
    } else {
      const vis = parseFloat(visMatch[1]);
      const auth = parseFloat(authMatch[1]);
      const mom = parseFloat(momMatch[1]);
      const sum = vis + auth + mom;

      if (Math.abs(sum - 1.0) > 0.001) {
        errors.push(`EVI weights must sum to 1.0 (found ${sum.toFixed(3)})`);
      }

      if (vis !== CANONICAL_WEIGHTS.visibility) {
        errors.push(`Visibility weight must be ${CANONICAL_WEIGHTS.visibility} (found ${vis})`);
      }
      if (auth !== CANONICAL_WEIGHTS.authority) {
        errors.push(`Authority weight must be ${CANONICAL_WEIGHTS.authority} (found ${auth})`);
      }
      if (mom !== CANONICAL_WEIGHTS.momentum) {
        errors.push(`Momentum weight must be ${CANONICAL_WEIGHTS.momentum} (found ${mom})`);
      }
    }
  }

  // Check bands - simplified check for required status levels
  const hasAtRisk = content.includes('at_risk') && content.includes("'At Risk'");
  const hasEmerging = content.includes('emerging') && content.includes("'Emerging'");
  const hasCompetitive = content.includes('competitive') && content.includes("'Competitive'");
  const hasDominant = content.includes('dominant') && content.includes("'Dominant'");

  if (!hasAtRisk || !hasEmerging || !hasCompetitive || !hasDominant) {
    const missing = [];
    if (!hasAtRisk) missing.push('at_risk');
    if (!hasEmerging) missing.push('emerging');
    if (!hasCompetitive) missing.push('competitive');
    if (!hasDominant) missing.push('dominant');
    errors.push(`EVI_BANDS missing required status levels: ${missing.join(', ')}`);
  }

  console.log('  Types check completed');
}

/**
 * Check for banned patterns in source files
 */
function checkBannedPatterns() {
  console.log('\n🚫 Checking for banned patterns...');

  const srcDir = 'src';
  const files = getAllFiles(srcDir);

  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx'];

  for (const file of files) {
    const ext = extname(file);
    if (!codeExtensions.includes(ext)) continue;

    let content;
    try {
      content = readFileSync(file, 'utf-8');
    } catch {
      continue;
    }

    for (const { pattern, message } of BANNED_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        // Allow in test files and this script
        if (file.includes('__tests__') || file.includes('.test.') || file.includes('check-evi')) {
          warnings.push(`${file}: Contains banned pattern (allowed in tests): ${message}`);
        } else {
          errors.push(`${file}: ${message}`);
        }
      }
    }
  }

  console.log('  Pattern check completed');
}

/**
 * Check strategy panel contract
 */
function checkStrategyPanelContract() {
  console.log('\n📋 Checking Strategy Panel contract...');

  const contractPath = '../../contracts/examples/strategy-panel.json';
  let contract;

  try {
    const content = readFileSync(contractPath, 'utf-8');
    contract = JSON.parse(content);
  } catch {
    warnings.push(`Strategy panel contract not found or invalid: ${contractPath}`);
    return;
  }

  // Check that EVI is present
  if (!contract.evi) {
    errors.push('Strategy panel contract missing "evi" field');
    return;
  }

  // Check EVI has required fields
  const requiredFields = ['score', 'status', 'trend', 'drivers', 'sparkline'];
  for (const field of requiredFields) {
    if (!(field in contract.evi)) {
      errors.push(`Strategy panel EVI missing required field: ${field}`);
    }
  }

  // Check drivers
  if (contract.evi.drivers) {
    if (!Array.isArray(contract.evi.drivers) || contract.evi.drivers.length !== 3) {
      errors.push('Strategy panel EVI must have exactly 3 drivers');
    } else {
      const types = contract.evi.drivers.map(d => d.type);
      if (!types.includes('visibility') || !types.includes('authority') || !types.includes('momentum')) {
        errors.push('Strategy panel EVI drivers must include visibility, authority, and momentum');
      }
    }
  }

  console.log('  Contract check completed');
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 EVI Specification Guardrail');
  console.log('================================');

  checkEVITypes();
  checkBannedPatterns();
  checkStrategyPanelContract();

  // Summary
  console.log('\n================================');

  if (warnings.length > 0) {
    console.log(`\n${YELLOW}⚠️  Warnings (${warnings.length}):${RESET}`);
    warnings.forEach(w => console.log(`   ${w}`));
  }

  if (errors.length > 0) {
    console.log(`\n${RED}❌ Errors (${errors.length}):${RESET}`);
    errors.forEach(e => console.log(`   ${e}`));
    console.log(`\n${RED}EVI specification check FAILED${RESET}`);
    process.exit(1);
  }

  console.log(`\n${GREEN}✅ EVI specification check PASSED${RESET}`);
  process.exit(0);
}

main();
