# S89 Design System v2 Visual Audit

## Overview

This document audits the current implementation of Pravado Design System v2 across the dashboard, identifying where the "AI-first premium" feel is delivered, missing, or only partially present.

---

## Design System v2 Core Principles

Per the canonical spec (`docs/design-system/pravado_design_system_v2_ai_first_standard.md`):

| Principle | Description |
|-----------|-------------|
| **AI-First** | AI presence indicators, proactive suggestions, intelligence surfacing |
| **Premium Dark** | Dark slate backgrounds, subtle depth, professional elegance |
| **Brand Energy** | Iris, cyan, magenta accents for energy and differentiation |
| **Motion** | Smooth transitions, subtle animations, AI pulse effects |
| **Depth** | Layered panels, elevation shadows, backdrop blur |

---

## Token Implementation Status

### CSS Variables (globals.css)

| Category | Status | Notes |
|----------|--------|-------|
| Slate Neutrals (0-6) | ✅ Complete | All values defined in `:root` |
| Brand Accents | ✅ Complete | iris, cyan, teal, magenta, amber |
| Semantic Colors | ✅ Complete | info, success, warning, danger |
| Page/Panel Aliases | ✅ Complete | Proper semantic naming |
| Radii | ✅ Complete | xs through 2xl defined |
| Elevation/Shadows | ✅ Complete | elev-0 through elev-3 |
| Motion | ✅ Complete | Duration and easing tokens |
| Z-Index | ✅ Complete | Proper layering scale |
| Gradients | ✅ Complete | Hero and warm gradients |

### Tailwind Integration (tailwind.config.ts)

| Extension | Status | Notes |
|-----------|--------|-------|
| Colors | ✅ Complete | All brand/semantic colors mapped |
| Border Radius | ✅ Complete | DS radii available |
| Box Shadow | ✅ Complete | Elevation shadows wired |
| Transitions | ✅ Complete | Motion tokens available |

### Component Classes (globals.css)

| Class | Purpose | Status |
|-------|---------|--------|
| `.btn-primary` | Primary action button | ✅ Complete |
| `.btn-secondary` | Secondary button | ✅ Complete |
| `.btn-ghost` | Ghost button | ✅ Complete |
| `.btn-oauth` | OAuth provider buttons | ✅ Complete |
| `.input-field` | Form inputs | ✅ Complete |
| `.auth-card` | Auth page cards | ✅ Complete |
| `.panel-card` | Standard panels | ✅ Complete |
| `.ai-dot` | AI presence idle | ✅ Complete |
| `.ai-dot-analyzing` | AI analyzing state | ✅ Complete |
| `.ai-dot-generating` | AI generating state | ✅ Complete |

**Assessment: Token foundation is solid.** The problem is adoption, not definition.

---

## Page-by-Page Compliance Audit

### Fully Aligned Pages ✅

| Page | Route | DS v2 Status |
|------|-------|--------------|
| Login | `/login` | ✅ Full alignment |
| Onboarding | `/onboarding` | ✅ Full alignment |
| App Shell | `/app/layout.tsx` | ✅ Full alignment |
| Callback | `/callback` | ✅ Full alignment |

### Partially Aligned Pages ⚠️

| Page | Route | Issues |
|------|-------|--------|
| Dashboard | `/app` | Uses DS colors but static, no AI proactivity |
| PR/Media | `/app/pr` | Panel cards present, but legacy grays in some sub-components |
| Content | `/app/content` | Three-panel layout good, missing accent energy |
| SEO | `/app/seo` | Tab structure works, placeholders feel hollow |
| Playbooks | `/app/playbooks` | Cards use DS tokens, missing visual flow editor |
| Exec | `/app/exec` | Most complete - KPIs, insights, narratives |
| Scenarios | `/app/scenarios` | Functional but generic feeling |

### Not Aligned Pages ❌

| Page | Route | Issues |
|------|-------|--------|
| Agents | `/app/agents` | Empty shell, should be AI showcase |
| Reality Maps | Not implemented | No page exists |
| Insight Conflicts | Not implemented | No page exists |
| Team | `/app/team` | Functional but unstyled |

---

## Legacy Styling Violations

### Files with Legacy Colors

**Total Files with `bg-gray`, `text-gray`, `bg-blue`, `ring-blue`:** 270 files

#### High-Severity Violations (Core User Paths)

| File | Violations | Impact |
|------|------------|--------|
| `apps/dashboard/src/components/scenario-playbooks/*.tsx` | gray backgrounds | Medium |
| `apps/dashboard/src/components/media-monitoring/*.tsx` | gray borders | Medium |
| `apps/dashboard/src/components/audit/*.tsx` | gray/blue mix | Low |
| `apps/dashboard/src/components/billing/*.tsx` | gray buttons | Low |

#### Component Categories with Legacy Styling

| Category | File Count | Primary Issues |
|----------|------------|----------------|
| Reality Maps | 6 | bg-gray-*, border-gray-* |
| Insight Conflicts | 8 | bg-gray-*, text-gray-* |
| Scenario Components | 12 | Mixed DS and legacy |
| Executive Components | 10 | Mostly compliant, some gray |
| PR/Media Components | 15 | Legacy gray in tables |
| Crisis Components | 8 | Some legacy borders |
| Governance | 6 | Legacy gray backgrounds |

---

## AI Presence Audit

### AI Dot Implementation

| Location | State | Implementation |
|----------|-------|----------------|
| App Shell Header | ✅ Present | Static "AI Active" badge |
| Sidebar Logo | ✅ Present | Cyan pulse dot |
| Dashboard | ❌ Missing | No AI activity indicator |
| Pillar Pages | ❌ Missing | No AI presence anywhere |
| Playbook Runs | ⚠️ Partial | Status only, no AI indicator |

### AI Proactivity Elements

| Element | Spec | Implementation |
|---------|------|----------------|
| "Pravado recommends..." | Required | ❌ Not implemented |
| AI suggestion cards | Required | ❌ Not implemented |
| AI activity feed | Required | ❌ Not implemented |
| "Ask Pravado" input | Optional | ❌ Not implemented |
| Contextual AI tips | Required | ⚠️ Onboarding only |

### AI States Visualization

```
Spec defines:
- Idle: slate-6 dot
- Analyzing: cyan pulse animation
- Generating: iris dot with shimmer
- Error: danger red

Current implementation:
- Static cyan dot only
- No state transitions
- No error handling
- No contextual AI messaging
```

---

## Motion & Animation Audit

### Motion Tokens Usage

| Token | Files Using | Expected |
|-------|-------------|----------|
| `duration-sm` | 158 files | ✅ Good |
| `duration-md` | 23 files | Could be higher |
| `ease-standard` | ~50 files | Could be higher |
| `animate-ai-pulse` | 2 files | ❌ Should be more |

### Missing Motion Affordances

| Element | Spec | Implementation |
|---------|------|----------------|
| Card hover lift | `elev-2` on hover | ❌ Most cards static |
| Button press | Scale 0.98 | ❌ Not implemented |
| Loading shimmer | Brand gradient | ⚠️ Partial (some components) |
| Page transitions | Fade in/out | ❌ Not implemented |
| AI thinking pulse | Cyan pulse | ⚠️ Logo only |

---

## Visual Hierarchy Audit

### Depth & Elevation

| Component | Expected Shadow | Actual |
|-----------|-----------------|--------|
| Panel cards | `elev-3` / `shadow-panel` | ✅ Mostly correct |
| Dropdowns | `elev-2` | ⚠️ Some missing |
| Modals | `elev-3` + backdrop | ✅ Correct |
| Toasts | `elev-2` | ⚠️ Not verified |
| Sidebar | `elev-1` | ✅ Correct |

### Color Accent Usage

| Accent | Intended Use | Actual Use |
|--------|--------------|------------|
| Iris (#6A6FF9) | Primary actions, AI | ✅ Buttons, AI dot |
| Cyan (#38E1FF) | Focus, links, AI | ✅ Focus rings |
| Magenta (#D66DFF) | Premium features | ❌ Underutilized |
| Teal (#21B5C5) | Success indicators | ⚠️ Partial |
| Amber (#FFB65A) | Warnings, attention | ⚠️ Partial |

---

## "Feel" Assessment

### What's Working

1. **Dark slate foundation** - Backgrounds feel premium and modern
2. **Auth flows** - Login and onboarding are polished
3. **App shell** - Sidebar and header are well-designed
4. **Focus states** - Cyan focus rings are consistent
5. **Panel cards** - Using elevation properly

### What's Missing

1. **AI energy** - No sense that AI is actively working
2. **Accent highlights** - Cyan/magenta underused for emphasis
3. **Motion personality** - Static feel, no life
4. **Premium polish** - Many components feel generic
5. **Visual hierarchy** - Content areas blend together

### Specific Feel Issues

| Issue | Description | Impact |
|-------|-------------|--------|
| "Flat" feeling | No hover states, no depth changes | High |
| "Generic" | Could be any SaaS app | High |
| "Lifeless" | No animation, no personality | High |
| "Disconnected" | Pillars feel like separate apps | Medium |
| "Developer-facing" | Too much raw data, not enough insight | Medium |

---

## Brand Differentiation Score

### Current Score: 4/10

| Criteria | Score | Notes |
|----------|-------|-------|
| Color system | 7/10 | Tokens defined well |
| AI presence | 2/10 | Barely visible |
| Motion/animation | 3/10 | Mostly static |
| Visual polish | 5/10 | Functional but not premium |
| Unique personality | 3/10 | Generic SaaS feel |
| Cross-pillar cohesion | 4/10 | Each pillar feels different |

### Competitor Comparison

If shown to a user unfamiliar with Pravado:
- "This looks like any analytics dashboard"
- "Where's the AI?"
- "Why is it special?"

The DS v2 tokens exist but don't create a distinctive experience.

---

## Recommendations

### Critical Fixes (Pilot Readiness)

1. **Add AI activity indicator to dashboard**
   - Show last 3 AI actions
   - Pulsing dot when working
   - "Pravado just..." messages

2. **Add hover states to all cards**
   - Lift effect on hover (`elev-2`)
   - Subtle border color change
   - Cursor pointer feedback

3. **Add accent highlighting**
   - Use cyan for active/selected states
   - Use magenta for premium features
   - Gradient borders on key elements

### High Priority

4. **Replace all gray with slate**
   - Bulk find/replace `bg-gray` → `bg-slate`
   - Update `text-gray` → `text-slate` or `text-muted`
   - Fix `border-gray` → `border-border-subtle`

5. **Add loading states with brand shimmer**
   - Use gradient shimmer instead of spinner
   - AI-styled loading messages

6. **Implement AI state transitions**
   - Dot changes from idle → analyzing → generating
   - Contextual messaging based on state

### Medium Priority

7. **Add page transition animations**
8. **Implement button press feedback**
9. **Create AI suggestion components**
10. **Add sparklines to KPI cards**

---

## File-Level Remediation Priority

### Batch 1: Core Experience (Critical)

| File | Changes Needed |
|------|----------------|
| `/app/app/page.tsx` | Add AI activity, hover states |
| `/app/app/pr/page.tsx` | Add AI suggestions, fix grays |
| `/app/app/content/page.tsx` | Add accent highlighting |
| `/app/app/seo/page.tsx` | Implement missing tabs |
| `/app/app/agents/page.tsx` | Complete redesign needed |

### Batch 2: Components (High)

| Pattern | Files Affected | Fix |
|---------|----------------|-----|
| Table components | ~20 | Add hover rows, fix borders |
| Card components | ~30 | Add hover lift, accent borders |
| Badge components | ~15 | Ensure DS colors only |
| Form components | ~10 | Verify focus states |

### Batch 3: Secondary Pages (Medium)

| Area | Pages | Priority |
|------|-------|----------|
| Exec suite | 5 pages | Medium - mostly compliant |
| Billing | 4 pages | Medium - functional |
| Team/Settings | 2 pages | Low - rarely seen |

---

## Conclusion

**The Design System v2 is defined but not delivered.**

- **Tokens**: 100% defined
- **Core pages**: ~30% aligned
- **Component library**: ~40% aligned
- **AI presence**: ~10% implemented
- **Motion/feel**: ~20% implemented
- **Overall brand feel**: 4/10

The dashboard looks like a generic SaaS tool that happens to use dark mode, not an "AI-first communication intelligence platform." The premium, intelligent, proactive feel that DS v2 specifies is almost entirely absent.

Priority should be:
1. Add visible AI activity/presence
2. Add motion and hover states
3. Replace legacy colors
4. Add accent energy
