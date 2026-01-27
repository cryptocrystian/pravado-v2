#!/usr/bin/env node
/**
 * CI Guard: Action Stream Interaction Model v5.2
 *
 * Prevents regression of:
 * 1. Modal model (NO right-side drawer for Action Stream)
 * 2. ANCHORED HoverCard micro-brief (v5) - popover with arrow
 * 3. CTA behavior (Primary executes, Secondary/card opens modal)
 * 4. Consolidated secondary label ("Review" only)
 * 5. Active/History/Locked lifecycle buckets
 * 6. Decision-support content (why, recommended_next_step, signals)
 * 7. Deep link work surface routing
 * 8. Evidence display in modal
 * 9. Single-hover coordination (only one HoverCard open at a time)
 * 10. Modal Decision CTAs (v3) - execute actions from within modal
 * 11. LOCKED ACTIONS POLICY (v5.2) - no Execute for locked, only "Unlock Pro"
 *
 * HOVER MICRO-BRIEF v5.1 (ANCHORED POPOVER + CTA):
 * - Uses Radix HoverCard component
 * - Popover anchored to card with arrow
 * - Single hover open at a time (ActionStreamPane coordinates)
 * - Non-hovered cards dimmed when hover is open
 * - Open delay ~200ms, close delay ~250ms
 * - Compact mode: NO hover popover
 * - v5.1: Primary Execute CTA in hover popover (quick action without modal)
 *
 * MODAL DECISION CTAs v3:
 * - Primary CTA in sticky footer executes action
 * - Inline execution states (idle, executing, success, error)
 * - Focus management - Primary CTA receives focus on open
 * - Enter key triggers primary action
 * - Success/error inline display with Done/Retry buttons
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMAND_CENTER_COMPONENTS = path.resolve(__dirname, '../src/components/command-center');
const UI_COMPONENTS = path.resolve(__dirname, '../src/components/ui');
const COMMAND_CENTER_PAGE = path.resolve(__dirname, '../src/app/app/command-center/page.tsx');

// Required patterns for compliance
const REQUIRED_PATTERNS = [
  {
    file: 'ActionCard.tsx',
    patterns: [
      { regex: /action-card-v8/, description: 'ActionCard v8 marker (HoverCard popover)' },
      { regex: /onReview\??\s*:\s*\(\)/, description: 'onReview prop for modal opening' },
      { regex: /onPrimaryAction\??\s*:\s*\(\)/, description: 'onPrimaryAction prop for execution' },
      { regex: /executionState/, description: 'Execution state support' },
      { regex: /NEVER opens modal|EXECUTES action/, description: 'Primary CTA behavior comment' },
      // v3 Decision Support patterns (now in ActionHoverBrief)
      // Note: action.why, action.signals, signalToneColors moved to ActionHoverBrief.tsx
      // v5 HOVERCARD patterns (REQUIRED)
      { regex: /HoverCard/, description: 'HoverCard component import (v5)' },
      { regex: /HoverCardContent/, description: 'HoverCardContent component (v5)' },
      { regex: /HoverCardTrigger/, description: 'HoverCardTrigger component (v5)' },
      { regex: /isHoverOpen/, description: 'Controlled hover open state prop (v5)' },
      { regex: /onHoverOpenChange/, description: 'Hover state change callback (v5)' },
      { regex: /isDimmed/, description: 'Dimmed state when another card hovered (v5)' },
      { regex: /ActionHoverBrief/, description: 'ActionHoverBrief component for popover content (v5)' },
      { regex: /HOVER_OPEN_DELAY|openDelay/, description: 'Hover open delay timing (v5)' },
      { regex: /HOVER_CLOSE_DELAY|closeDelay/, description: 'Hover close delay timing (v5)' },
      // v5.2 LOCKED ACTIONS patterns (REQUIRED)
      { regex: /isLocked/, description: 'Locked action detection (v5.2)' },
      { regex: /lockedClass|lockedPriorityStyle/, description: 'Locked styling classes (v5.2)' },
      { regex: /Unlock Pro/, description: 'Unlock Pro CTA text for locked actions (v5.2)' },
      { regex: /LOCKED ACTIONS POLICY/, description: 'Locked actions policy comment (v5.2)' },
    ],
  },
  {
    file: 'ActionHoverBrief.tsx',
    patterns: [
      { regex: /ActionHoverBrief/, description: 'ActionHoverBrief component definition' },
      { regex: /action-hover-brief-v5/, description: 'ActionHoverBrief v5 marker class' },
      { regex: /action\.why/, description: 'Displays why section' },
      { regex: /action\.recommended_next_step/, description: 'Displays next step section' },
      { regex: /action\.signals/, description: 'Displays signals section' },
      { regex: /action\.guardrails/, description: 'Displays guardrails section' },
      { regex: /signalToneColors/, description: 'Signal tone color mapping' },
      // v5.1 Hover CTA patterns (REQUIRED)
      { regex: /onPrimaryAction\??:/, description: 'onPrimaryAction prop for hover execute (v5.1)' },
      { regex: /executionState/, description: 'executionState prop for hover states (v5.1)' },
      { regex: /hover-brief-cta/, description: 'Hover CTA button marker class (v5.1)' },
      { regex: /action\.cta\.primary/, description: 'Displays CTA primary label (v5.1)' },
      // v5.2 Locked state patterns (REQUIRED)
      { regex: /isLocked/, description: 'isLocked prop for locked state (v5.2)' },
    ],
  },
  {
    file: 'ActionModal.tsx',
    patterns: [
      { regex: /ActionModal/, description: 'ActionModal component' },
      { regex: /role="dialog"/, description: 'Dialog ARIA role' },
      { regex: /aria-modal="true"/, description: 'Modal ARIA attribute' },
      { regex: /Escape/, description: 'Escape key handling' },
      { regex: /onPrimaryAction/, description: 'Primary action handler' },
      // v3 Decision Support patterns
      { regex: /action\.why/, description: 'Uses action.why for Why This Matters (v3)' },
      { regex: /action\.recommended_next_step/, description: 'Uses action.recommended_next_step (v3)' },
      { regex: /action\.evidence/, description: 'Displays evidence for investigation (v3)' },
      { regex: /action\.deep_link/, description: 'Work surface routing via deep_link (v3)' },
      { regex: /action\.controls/, description: 'Modal controls (schedule/edit/assign) (v3)' },
      // Dismissal patterns (v2.1)
      { regex: /handleBackdropMouseDown|onMouseDown.*backdrop/i, description: 'Backdrop click-to-dismiss (v2.1)' },
      { regex: /stopPropagation/, description: 'Prevents modal clicks from closing (v2.1)' },
      // v3 Modal Decision CTAs patterns (REQUIRED)
      { regex: /action-modal-v3/, description: 'ActionModal v3 marker class' },
      { regex: /executionState/, description: 'Execution state prop (v3)' },
      { regex: /primaryCtaRef/, description: 'Primary CTA ref for focus management (v3)' },
      { regex: /key === 'Enter'/, description: 'Enter key triggers primary action (v3)' },
      { regex: /isCompleted|success.*inline|Done/, description: 'Success state inline display (v3)' },
      { regex: /hasError|error.*inline|Retry/, description: 'Error state with retry (v3)' },
      // v3.1 Locked actions patterns (REQUIRED)
      { regex: /isLocked/, description: 'isLocked prop for locked state (v3.1)' },
      { regex: /onUpgrade/, description: 'onUpgrade callback for upgrade flow (v3.1)' },
      { regex: /modal-upgrade-cta/, description: 'Upgrade CTA marker class (v3.1)' },
      { regex: /Pro Feature|Unlock Pro/, description: 'Locked state messaging (v3.1)' },
    ],
  },
  {
    file: 'ActionStreamPane.tsx',
    patterns: [
      { regex: /onReview\?\s*:\s*\(action/, description: 'onReview callback prop' },
      { regex: /onPrimaryAction\?\s*:\s*\(action/, description: 'onPrimaryAction callback prop' },
      { regex: /executionStates/, description: 'Execution states map' },
      { regex: /INTERACTION CONTRACT|handleReview/, description: 'Modal model implementation' },
      { regex: /lifecycleBucket|LifecycleBucket/, description: 'Active/History lifecycle state (v7)' },
      { regex: /getLifecycleBucket/, description: 'Lifecycle bucket helper (v7)' },
      // v5 HOVER COORDINATION patterns (REQUIRED)
      { regex: /hoveredActionId/, description: 'Tracks which action has hover open (v5)' },
      { regex: /handleHoverOpenChange/, description: 'Hover change handler for coordination (v5)' },
      { regex: /isHoverOpen=/, description: 'Passes isHoverOpen prop to ActionCard (v5)' },
      { regex: /onHoverOpenChange=/, description: 'Passes onHoverOpenChange prop to ActionCard (v5)' },
      { regex: /isDimmed=/, description: 'Passes isDimmed prop to ActionCard (v5)' },
      { regex: /HOVER COORDINATION|Single-hover coordination/, description: 'Hover coordination docs (v5)' },
      // v5.2 LOCKED ACTIONS patterns (REQUIRED)
      { regex: /isActionLocked/, description: 'Locked action detection helper (v5.2)' },
      { regex: /lockedItems/, description: 'Locked items memo/state (v5.2)' },
      { regex: /Upgrade Opportunities|isLockedSectionOpen/, description: 'Locked section UI (v5.2)' },
    ],
  },
  {
    file: 'types.ts',
    patterns: [
      // v3 Type definitions
      { regex: /ActionSignal/, description: 'ActionSignal type for decision signals (v3)' },
      { regex: /ActionEvidence/, description: 'ActionEvidence type for investigation (v3)' },
      { regex: /ActionDeepLink/, description: 'ActionDeepLink type for work surface routing (v3)' },
      { regex: /ActionControl/, description: 'ActionControl type for modal controls (v3)' },
      { regex: /why:\s*string/, description: 'ActionItem.why field (v3)' },
      { regex: /recommended_next_step:\s*string/, description: 'ActionItem.recommended_next_step field (v3)' },
    ],
  },
  {
    file: 'hover-card.tsx',
    path: path.join(UI_COMPONENTS, 'hover-card.tsx'),
    patterns: [
      { regex: /HoverCardPrimitive|@radix-ui\/react-hover-card/, description: 'Radix HoverCard import' },
      { regex: /HoverCard/, description: 'HoverCard component export' },
      { regex: /HoverCardTrigger/, description: 'HoverCardTrigger component export' },
      { regex: /HoverCardContent/, description: 'HoverCardContent component export' },
      { regex: /HoverCardArrow/, description: 'HoverCardArrow component export' },
    ],
  },
  {
    file: 'page.tsx (required)',
    path: COMMAND_CENTER_PAGE,
    patterns: [
      // v3 Modal execution state (REQUIRED)
      { regex: /executionState=\{/, description: 'Passes executionState prop to ActionModal (v3)' },
      { regex: /ActionModal/, description: 'Uses ActionModal component' },
    ],
  },
];

// Forbidden patterns (should NOT be present)
const FORBIDDEN_PATTERNS = [
  {
    file: 'ActionStreamPane.tsx',
    patterns: [
      { regex: /ActionPeekDrawer/, description: 'ActionPeekDrawer import (use ActionModal)' },
      { regex: /Sheet|SheetContent/, description: 'Sheet component import (use ActionModal)' },
    ],
  },
  {
    file: 'page.tsx',
    path: COMMAND_CENTER_PAGE,
    patterns: [
      { regex: /ActionPeekDrawer/, description: 'ActionPeekDrawer usage (use ActionModal)' },
      { regex: /isDrawerOpen/, description: 'Drawer state (use isModalOpen)' },
      { regex: /isExecuting=\{/, description: 'Deprecated isExecuting prop (use executionState)' },
    ],
  },
  {
    file: 'ActionCard.tsx',
    patterns: [
      // Secondary CTA should be "Review", not these
      { regex: />\s*Details\s*<\/button>/, description: 'Secondary CTA "Details" (use "Review")' },
      { regex: />\s*View\s*<\/button>/, description: 'Secondary CTA "View" (use "Review")' },
      // No hidden CTAs on hover
      { regex: /group-hover:block.*button|group-hover:flex.*button.*primary/i, description: 'Hidden CTA on hover' },
      // v4 CONTAINED SLOT PATTERNS (now obsolete, use HoverCard)
      { regex: /MICRO-BRIEF SLOT v4/, description: 'Old v4 contained slot (use HoverCard v5)' },
      { regex: /HOVER INTELLIGENCE v3/, description: 'Old v3 hover pattern (use HoverCard v5)' },
      // Old version markers
      { regex: /action-card-v[567](?![\d])/, description: 'Old ActionCard v5/v6/v7 marker (use v8)' },
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
  console.log('Checking Action Stream interaction model (v5.2 + Locked Actions Policy)...\n');

  let hasErrors = false;
  const results = [];

  // Check required patterns
  for (const check of REQUIRED_PATTERNS) {
    const result = checkFile(check.file, check.patterns, [], check.path);
    results.push({ file: check.file, ...result });

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
    console.error('FAIL: Action Stream interaction model has regressions.\n');
    console.error('Required patterns:');
    console.error('  - ActionCard: v8 marker, HoverCard, isLocked, Unlock Pro CTA');
    console.error('  - ActionHoverBrief: Popover content with why, signals, guardrails, isLocked');
    console.error('  - ActionModal: v3 marker, executionState, isLocked, onUpgrade, Unlock Pro CTA');
    console.error('  - ActionStreamPane: Hover coordination, isActionLocked, lockedItems, Upgrade Opportunities');
    console.error('  - hover-card.tsx: Radix HoverCard UI component');
    console.error('  - page.tsx: executionState prop passed to ActionModal\n');
    console.error('Forbidden patterns:');
    console.error('  - ActionPeekDrawer / Sheet imports');
    console.error('  - Secondary CTA labels other than "Review"');
    console.error('  - Old v3/v4 hover patterns (use HoverCard v5)');
    console.error('  - Old ActionCard v5/v6/v7 markers (use v8)');
    console.error('  - Deprecated isExecuting prop (use executionState)\n');
    process.exit(1);
  }

  console.log('PASS: Action Stream interaction model v5.2 compliant (Locked Actions Policy).\n');
  process.exit(0);
}

main();
