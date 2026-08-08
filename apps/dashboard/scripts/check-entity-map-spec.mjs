#!/usr/bin/env node
/**
 * CI Guard: Entity Map Concentric-Ring Specification v3.0
 *
 * Enforces the canonical concentric-ring model (ENTITY_MAP_SPEC.md v2.0) and
 * prevents regression to the RETIRED zone model (D012) and continuous animation
 * loops (D013).
 *
 * Requires:
 * 1. entity-map-v3 marker + concentric-ring layout (computeRingLayout, ring bands)
 * 2. affinity-based angular positioning + authority_weight sizing
 * 3. entity_insight progressive disclosure (D015) + linked_action_id wiring (D016)
 * 4. Action Stream coordination props (hoveredActionId / executingActionId)
 * 5. Real contract consumption (CC_ENTITY_MAP_WIRED gate)
 *
 * Forbids:
 * - Zone-based layout (zone: 'authority'|'signal'|'growth'|'exposure') — D012
 * - d3-force / forceSimulation physics layout
 * - requestAnimationFrame draw loop (continuous animation) — D013
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md v2.0 §2, §7 (D012, D013), §11
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMAND_CENTER_COMPONENTS = path.resolve(
  __dirname,
  '../src/components/command-center'
);
const CONTRACTS_DIR = path.resolve(__dirname, '../../..', 'contracts/examples');

// Required patterns (must be present)
const REQUIRED_PATTERNS = [
  {
    file: 'EntityMap.tsx',
    patterns: [
      { regex: /entity-map-v3/, description: 'entity-map-v3 marker class' },
      {
        regex: /computeRingLayout/,
        description: 'Concentric-ring layout function',
      },
      { regex: /ring === 0|n\.ring/, description: 'Ring-based node placement' },
      {
        regex: /affinity_score/,
        description: 'Affinity-based angular positioning',
      },
      {
        regex: /authority_weight/,
        description: 'Authority-weight node sizing',
      },
      {
        regex: /entity_insight/,
        description: 'Progressive disclosure of entity_insight (D015)',
      },
      {
        regex: /linked_action_id/,
        description: 'Gap node → linked action wiring (D016)',
      },
      {
        regex: /cc:focus-action/,
        description: 'Action Stream focus event (cross-surface coherence)',
      },
      {
        regex: /hoveredActionId/,
        description: 'Hovered action ID prop (cross-pane highlight)',
      },
      {
        regex: /executingActionId/,
        description: 'Executing action ID prop (cross-pane pulse)',
      },
      {
        regex: /em-core-pulse|Brand Core pulse/,
        description: 'Brand Core pulse (canon §7 — CSS, not a JS loop)',
      },
    ],
  },
  {
    file: 'types.ts',
    patterns: [
      { regex: /EntityNode/, description: 'EntityNode type definition' },
      { regex: /EntityEdge/, description: 'EntityEdge type definition' },
      { regex: /EntityMapPayload/, description: 'EntityMapPayload type' },
      { regex: /EdgeRel/, description: 'EdgeRel type definition' },
      {
        regex: /SessionCitationEvent/,
        description: 'SessionCitationEvent type (D013)',
      },
    ],
  },
  {
    file: 'IntelligenceCanvasPane.tsx',
    patterns: [
      { regex: /EntityMap/, description: 'EntityMap component usage' },
      {
        regex: /CC_ENTITY_MAP_WIRED/,
        description: 'Real-data feature gate',
      },
      { regex: /hoveredActionId/, description: 'Hovered action ID prop' },
      { regex: /executingActionId/, description: 'Executing action ID prop' },
      {
        regex: /entity-map/,
        description: 'Consumes /api/command-center/entity-map contract',
      },
    ],
  },
];

// Contract fixture validation (v3 ring shape)
const CONTRACT_PATTERNS = [
  {
    file: 'entity-map.json',
    path: path.join(CONTRACTS_DIR, 'entity-map.json'),
    patterns: [
      { regex: /"layout_version":\s*"v3"/, description: 'layout_version v3' },
      { regex: /"ring":\s*[0-3]/, description: 'ring 0–3 placement' },
      { regex: /"affinity_score"/, description: 'affinity_score field' },
      { regex: /"authority_weight"/, description: 'authority_weight field' },
      { regex: /"linked_action_id"/, description: 'linked_action_id field' },
      { regex: /"entity_insight"/, description: 'entity_insight field' },
    ],
  },
];

// Forbidden patterns (must NOT be present)
const FORBIDDEN_PATTERNS = [
  {
    file: 'EntityMap.tsx',
    patterns: [
      {
        regex: /forceSimulation\(/,
        description: 'd3-force physics simulation',
      },
      { regex: /from ['"]d3-force['"]/, description: 'd3-force import' },
      {
        regex: /requestAnimationFrame\(/,
        description:
          'requestAnimationFrame draw loop (D013 — event-driven only)',
      },
      {
        regex: /zone:\s*['"](authority|signal|growth|exposure)['"]/,
        description: 'Retired zone-based positioning (D012)',
      },
    ],
  },
  {
    file: 'entity-map.json',
    path: path.join(CONTRACTS_DIR, 'entity-map.json'),
    patterns: [
      {
        regex: /"zone":\s*"(authority|signal|growth|exposure)"/,
        description: 'Retired zone values in contract (D012)',
      },
    ],
  },
];

function checkFile(
  fileName,
  requiredPatterns,
  forbiddenPatterns = [],
  customPath = null
) {
  const filePath = customPath || path.join(COMMAND_CENTER_COMPONENTS, fileName);

  if (!fs.existsSync(filePath)) {
    return { success: false, errors: [`File not found: ${fileName}`] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];

  for (const pattern of requiredPatterns) {
    if (!pattern.regex.test(content)) {
      errors.push(`Missing required: ${pattern.description}`);
    }
  }
  for (const pattern of forbiddenPatterns) {
    if (pattern.regex.test(content)) {
      errors.push(`Found forbidden: ${pattern.description}`);
    }
  }

  return { success: errors.length === 0, errors };
}

function main() {
  console.log('Checking Entity Map concentric-ring specification (v3.0)...\n');

  let hasErrors = false;
  const results = [];

  for (const check of REQUIRED_PATTERNS) {
    const result = checkFile(check.file, check.patterns, [], check.path);
    results.push({ file: check.file, ...result });
    if (!result.success) hasErrors = true;
  }

  for (const check of CONTRACT_PATTERNS) {
    const result = checkFile(check.file, check.patterns, [], check.path);
    results.push({ file: check.file + ' (contract)', ...result });
    if (!result.success) hasErrors = true;
  }

  for (const check of FORBIDDEN_PATTERNS) {
    const result = checkFile(check.file, [], check.patterns, check.path);
    results.push({ file: check.file + ' (forbidden)', ...result });
    if (!result.success) hasErrors = true;
  }

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
    console.error('FAIL: Entity Map v3 specification has regressions.\n');
    console.error('Required: entity-map-v3 marker, concentric-ring layout,');
    console.error('affinity/authority encoding, entity_insight (D015),');
    console.error(
      'linked_action_id wiring (D016), Action Stream coordination.\n'
    );
    console.error(
      'Forbidden: zone model (D012), d3-force, RAF loops (D013).\n'
    );
    process.exit(1);
  }

  console.log(
    'PASS: Entity Map concentric-ring specification v3.0 compliant.\n'
  );
  process.exit(0);
}

main();
