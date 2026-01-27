#!/usr/bin/env node
/**
 * CI Guard: Entity Map SAGE-Native Specification v2.0
 *
 * Prevents regression of:
 * 1. Zone-based layout (authority/signal/growth/exposure)
 * 2. Deterministic layout seed (stable positioning)
 * 3. Action Stream integration (hover highlight, execute pulse)
 * 4. Top-20 node constraint
 * 5. Pillar styling consistency
 *
 * @see /docs/canon/ENTITY-MAP-SAGE.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMAND_CENTER_COMPONENTS = path.resolve(__dirname, '../src/components/command-center');
const CONTRACTS_DIR = path.resolve(__dirname, '../../..', 'contracts/examples');

// Required patterns for compliance
const REQUIRED_PATTERNS = [
  {
    file: 'EntityMap.tsx',
    patterns: [
      { regex: /entity-map-v2/, description: 'EntityMap v2 marker class' },
      { regex: /layoutSeed|layout_seed/, description: 'Deterministic layout seed prop' },
      { regex: /zone:/, description: 'Zone-based positioning reference' },
      { regex: /hoveredActionId/, description: 'Hovered action ID prop for Action Stream coordination' },
      { regex: /executingActionId/, description: 'Executing action ID prop for pulse animation' },
      { regex: /entity-pulse|animate-entity-pulse/, description: 'Entity pulse animation class' },
      { regex: /actionImpacts/, description: 'Action impacts mapping prop' },
      { regex: /ZONE_POSITIONS|zoneConfig/, description: 'Zone position configuration' },
      { regex: /pillarAccents|PILLAR_RGB/, description: 'Pillar styling reference' },
      { regex: /isHighlighted/, description: 'Highlight state for nodes' },
      { regex: /isDimmed/, description: 'Dimmed state for non-affected nodes' },
      { regex: /isDriver|driver_node/, description: 'Driver node indication' },
    ],
  },
  {
    file: 'types.ts',
    patterns: [
      { regex: /EntityNode/, description: 'EntityNode type definition' },
      { regex: /EntityEdge/, description: 'EntityEdge type definition' },
      { regex: /EntityZone/, description: 'EntityZone type definition' },
      { regex: /ActionImpactMap/, description: 'ActionImpactMap type definition' },
      { regex: /EntityMapResponse/, description: 'EntityMapResponse type definition' },
      { regex: /EdgeRel/, description: 'EdgeRel type definition' },
    ],
  },
  {
    file: 'IntelligenceCanvasPane.tsx',
    patterns: [
      { regex: /EntityMap/, description: 'EntityMap component import/usage' },
      { regex: /entityMapData/, description: 'Entity map data prop' },
      { regex: /hoveredActionId/, description: 'Hovered action ID prop' },
      { regex: /executingActionId/, description: 'Executing action ID prop' },
    ],
  },
  {
    file: 'ActionStreamPane.tsx',
    patterns: [
      { regex: /onHoverActionChange/, description: 'Hover action change callback prop' },
    ],
  },
];

// Entity Map contract validation
const CONTRACT_PATTERNS = [
  {
    file: 'entity-map.json',
    path: path.join(CONTRACTS_DIR, 'entity-map.json'),
    patterns: [
      { regex: /"layout_seed"/, description: 'Contract includes layout_seed field' },
      { regex: /"zone":\s*"(authority|signal|growth|exposure)"/, description: 'Contract uses valid zone values' },
      { regex: /"action_impacts"/, description: 'Contract includes action_impacts mapping' },
      { regex: /"driver_node"/, description: 'Contract includes driver_node in action impacts' },
      { regex: /"impacted_nodes"/, description: 'Contract includes impacted_nodes in action impacts' },
      { regex: /"impacted_edges"/, description: 'Contract includes impacted_edges in action impacts' },
    ],
  },
];

// Forbidden patterns (should NOT be present)
const FORBIDDEN_PATTERNS = [
  {
    file: 'EntityMap.tsx',
    patterns: [
      { regex: /forceSimulation/, description: 'Physics-based force simulation (use zone layout)' },
      { regex: /d3\.force|d3-force/, description: 'D3 force layout (use zone layout)' },
      { regex: /useLayoutEffect.*position.*setState/, description: 'Position recalculation during interaction' },
    ],
  },
];

function checkFile(fileName, requiredPatterns, forbiddenPatterns = [], customPath = null) {
  const filePath = customPath || path.join(COMMAND_CENTER_COMPONENTS, fileName);

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
  console.log('Checking Entity Map SAGE-Native specification (v2.0)...\n');

  let hasErrors = false;
  const results = [];

  // Check required patterns in components
  for (const check of REQUIRED_PATTERNS) {
    const result = checkFile(check.file, check.patterns, [], check.path);
    results.push({ file: check.file, ...result });

    if (!result.success) {
      hasErrors = true;
    }
  }

  // Check contract patterns
  for (const check of CONTRACT_PATTERNS) {
    const result = checkFile(check.file, check.patterns, [], check.path);
    results.push({ file: check.file + ' (contract)', ...result });

    if (!result.success) {
      hasErrors = true;
    }
  }

  // Check forbidden patterns
  for (const check of FORBIDDEN_PATTERNS) {
    const result = checkFile(check.file, [], check.patterns, check.path);
    results.push({ file: check.file + ' (forbidden)', ...result });

    if (!result.success) {
      hasErrors = true;
    }
  }

  // Output results
  for (const result of results) {
    if (result.success) {
      console.log(`\u2713 ${result.file}`);
    } else {
      console.error(`\u2717 ${result.file}`);
      for (const error of result.errors) {
        console.error(`  - ${error}`);
      }
    }
  }

  console.log('');

  if (hasErrors) {
    console.error('FAIL: Entity Map specification has regressions.\n');
    console.error('Required patterns:');
    console.error('  - EntityMap.tsx: v2 marker, zone layout, action stream coordination');
    console.error('  - types.ts: EntityNode, EntityEdge, EntityZone, ActionImpactMap types');
    console.error('  - IntelligenceCanvasPane.tsx: EntityMap integration');
    console.error('  - ActionStreamPane.tsx: onHoverActionChange callback');
    console.error('  - entity-map.json: layout_seed, zone, action_impacts\n');
    console.error('Forbidden patterns:');
    console.error('  - Physics-based force simulation (use zone layout)');
    console.error('  - Position recalculation during interaction\n');
    process.exit(1);
  }

  console.log('PASS: Entity Map SAGE-Native specification v2.0 compliant.\n');
  process.exit(0);
}

main();
