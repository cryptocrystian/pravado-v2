# Work Surface QA Gate

**Version:** 1.0
**Status:** Canonical
**Last Updated:** 2026-02-04

This document defines PASS/FAIL checks for work surface compliance. Used to block merges.

---

## Test Viewports

All checks must pass on:
- **1920x1080** (Full HD)
- **1440x900** (Common laptop)
- **1280x720** (Minimum supported)

---

## How to Verify Locally

1. Start dev server: `pnpm --filter @pravado/dashboard dev`
2. Navigate to Content page: `http://localhost:3000/app/content`
3. Switch to **Manual mode** using the mode switcher
4. Set browser to each viewport size (DevTools > Device Toolbar or resize window)
5. Run through each check below

---

## Check 1: Typography Floor

**Test:**
- Inspect all visible text on the Manual workbench
- Use DevTools to verify computed font-size

**PASS criteria:**
- [ ] No body text below 12px (`text-xs` = 0.75rem = 12px)
- [ ] No interactive labels (buttons, links) below 12px
- [ ] Micro-labels (if any) are supplementary and non-clickable

**Regression check:**
- [ ] Command Center typography unchanged
- [ ] PR Work Surface typography unchanged

**FAIL if:** Any body or interactive text is smaller than 12px, or other pillars have font changes.

---

## Check 2: Editor Dominance (Manual Mode)

**Test:**
1. Select an item from the queue
2. Click "Edit" to enter editing state (`isEditing === true`)
3. Measure editor canvas width vs. total center workspace width

**PASS criteria (at 1440x900):**
- [ ] Editor canvas >= 70% of center workspace width (excluding left queue and collapsed rail handle)
- [ ] Left queue width: 220-280px
- [ ] Context rail collapsed by default (unless hard blocker exists)
- [ ] Collapsed rail handle <= 28px wide
- [ ] Collapsed rail does NOT reserve blank space (no 200px+ empty column)

**FAIL if:** Editor feels boxed in, rail reserves dead space, or editor < 70% of available width.

---

## Check 3: CTA Persistence

**Test:**
1. Enter editing state
2. Add content to the editor until it would overflow
3. Scroll within the editor
4. Check action bar visibility

**PASS criteria:**
- [ ] Action bar (Save Draft / Mark Ready / Execute) visible without page scroll
- [ ] Only editor body content scrolls
- [ ] Header and action bar remain pinned (no scroll)
- [ ] No page-level scrollbar introduced by editor content

**FAIL if:** User must scroll the page to see primary CTA, or action bar moves with content.

---

## Check 4: Dead Space Ceiling

**Test:**
1. Enter editing state with content selected
2. Visually assess the editor region above the fold
3. Estimate unused space percentage

**PASS criteria (at 1440x900):**
- [ ] Obvious dead space <= 50% of editor region above fold
- [ ] No giant empty center when actionable content exists
- [ ] Full-width elements justify their space with content

**FAIL if:** More than half the editor region is obviously empty/unused.

---

## Check 5: Mode Clarity

**Test:**
1. Land on Content page in Manual mode
2. Assess within 3 seconds: "What am I doing here?"

**PASS criteria:**
- [ ] Manual mode clearly indicates "I am creating" (editor dominant, edit affordances visible)
- [ ] No AI reasoning panels dominating the view
- [ ] Mode indicator visible and unambiguous
- [ ] Copilot/Autopilot modes remain unchanged (not broken by this work)

**FAIL if:** User cannot identify their primary activity within 3 seconds.

---

## Check 6: Progressive Disclosure (Queue)

**Test:**
1. Observe queue list rows in default state
2. Hover over a non-selected row
3. Click to select a row

**PASS criteria:**
- [ ] Default rows show: type badge + title (dense)
- [ ] On hover: additional chips appear (confidence, due, impact)
- [ ] Selected row: always shows expanded metadata
- [ ] Row height stays consistent (no jarring layout shifts)

**FAIL if:** Queue is too noisy by default, or hover/selection doesn't reveal more info.

---

## Check 7: Empty State

**Test:**
1. Deselect all items (if possible) or load with no items

**PASS criteria:**
- [ ] Clear message explains what to do
- [ ] User understands within 3 seconds
- [ ] Optional "Create New" CTA is visible if applicable

**FAIL if:** Blank screen with no guidance.

---

## Summary Checklist

Copy this for PR review:

```
## Work Surface QA Gate (Content Manual)

Tested at: [1920x1080] [1440x900] [1280x720]

- [ ] Check 1: Typography floor (12px min, no regressions)
- [ ] Check 2: Editor dominance (>= 70%, rail truly collapsed)
- [ ] Check 3: CTA persistence (action bar always visible)
- [ ] Check 4: Dead space ceiling (<= 50%)
- [ ] Check 5: Mode clarity (3-second comprehension)
- [ ] Check 6: Progressive disclosure (hover/select reveals)
- [ ] Check 7: Empty state (clear guidance)

All checks PASS: [ ] Yes [ ] No
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-02-04 | Initial QA gate |
