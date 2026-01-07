# Sprint S84 - Design System v2 Enforcement (Auth + Shell)

> **Completed**: December 8, 2025
> **Sprint Focus**: DS v2 Enforcement for Auth Flow and App Shell

---

## Summary

Sprint S84 enforced Pravado Design System v2 compliance across all authentication pages and the app shell, establishing these as reference implementations for the rest of the application. This sprint focused on visual consistency without any behavior or API changes.

---

## Scope

### In Scope
- Auth pages: login, signup, callback, onboarding
- App shell: layout, sidebar, top navigation
- Error pages: error.tsx, global-error.tsx, not-found.tsx

### Out of Scope
- Pillar pages (covered in S83)
- Component library internals
- Feature-specific pages (billing, playbooks, etc.)

---

## Phase 1: Audit Results

### Already DS v2 Compliant (No Changes Needed)
| File | Status | Notes |
|------|--------|-------|
| `apps/dashboard/src/app/login/page.tsx` | Compliant | Uses auth-card, btn-oauth, btn-magic-link, btn-primary, input-field, alert-error/success, AIPresenceDot |
| `apps/dashboard/src/app/callback/page.tsx` | Compliant | Uses auth-card, alert-error, btn-primary, btn-secondary, AIPresenceDot |
| `apps/dashboard/src/app/onboarding/page.tsx` | Compliant | Uses auth-card, input-field, btn-primary, alert-error, alert-info |
| `apps/dashboard/src/app/app/layout.tsx` | Compliant | Uses bg-page, bg-slate-1, border-border-subtle, text-gradient-hero, brand-iris, brand-cyan |

### Updated to DS v2
| File | Status | Changes Applied |
|------|--------|-----------------|
| `apps/dashboard/src/app/error.tsx` | Updated | Replaced bg-gray-50, text-gray-*, bg-blue-* with DS v2 tokens |
| `apps/dashboard/src/app/global-error.tsx` | Updated | Full inline DS v2 styling (required since it replaces root layout) |
| `apps/dashboard/src/app/not-found.tsx` | Updated | Replaced legacy colors with DS v2 tokens |

---

## Phase 2: Changes Applied

### error.tsx
**Before:**
```tsx
bg-gray-50, text-gray-900, text-gray-600, text-gray-500
bg-blue-600, bg-gray-200
```

**After:**
```tsx
bg-page, text-white-0, text-muted, text-slate-6
btn-primary, btn-secondary, auth-card, alert-error
semantic-danger accent colors
Radial gradient background with semantic-danger
```

### global-error.tsx
**Before:**
```tsx
bg-gray-50, text-gray-900, text-gray-600, text-gray-500
bg-blue-600
```

**After:**
```tsx
Inline styles using DS v2 hex values (required since this replaces root layout):
- Background: #0B0F14 (--slate-0)
- Text: #EAF2F7 (--white-0), #3B4E67 (--slate-6)
- Accent: #6A6FF9 (--brand-iris), #38E1FF (--brand-cyan)
- Error: #FF6B6B (--semantic-danger)
- Card styling matches auth-card pattern
```

### not-found.tsx
**Before:**
```tsx
bg-gray-50, text-gray-900, text-gray-600
bg-blue-600
```

**After:**
```tsx
bg-page, text-white-0, text-muted, text-slate-6
text-gradient-hero for 404 number
btn-primary, btn-secondary, auth-card
brand-iris accent colors
Radial gradient background with brand-iris
```

---

## DS v2 Patterns Established

### Auth Page Pattern
All auth-related pages follow this consistent structure:
1. **Background**: `bg-page` with radial gradient overlay
2. **Card**: `auth-card` class for glassmorphic container
3. **Title**: `text-white-0` for headings, `text-muted` for subtitles
4. **Buttons**: `btn-primary`, `btn-secondary`, `btn-oauth`, `btn-magic-link`
5. **Inputs**: `input-field` class
6. **Alerts**: `alert-error`, `alert-success`, `alert-info`
7. **AI Presence**: `AIPresenceDot` component with idle/analyzing/generating states

### Error Page Pattern
Error pages follow this structure:
1. **Background**: `bg-page` with semantic-danger/brand-iris radial gradient
2. **Card**: `auth-card` class for consistent styling
3. **Icon**: Circular background with `semantic-danger/10` or `brand-iris/10`
4. **Actions**: `btn-primary` for primary action, `btn-secondary` for alternative
5. **Support**: Contact link styled with `text-brand-cyan`

### App Shell Pattern
The app shell (layout.tsx) follows:
1. **Sidebar**: `bg-slate-1` with `border-border-subtle`
2. **Logo**: `text-gradient-hero` gradient text
3. **Nav Items**: `text-slate-6` default, `text-brand-cyan` active
4. **Icons**: Brand colors for category icons (`brand-iris`, `brand-cyan`, `brand-teal`, etc.)
5. **User Menu**: `bg-slate-3` with border styling

---

## Token Mapping Reference

### Legacy to DS v2 Colors
| Legacy Class | DS v2 Replacement |
|--------------|-------------------|
| `bg-gray-50` | `bg-page` (via globals.css) |
| `bg-gray-100` | `bg-slate-3` or `bg-slate-4` |
| `bg-gray-200` | `btn-secondary` class |
| `bg-blue-600` | `btn-primary` class or `bg-brand-iris` |
| `text-gray-900` | `text-white-0` |
| `text-gray-600` | `text-muted` |
| `text-gray-500` | `text-muted` or `text-slate-6` |
| `text-gray-400` | `text-slate-6` |
| `text-blue-600` | `text-brand-cyan` or `text-brand-iris` |

### Component Class Usage
| Scenario | DS v2 Class |
|----------|-------------|
| Primary action button | `btn-primary` |
| Secondary action button | `btn-secondary` |
| OAuth sign-in button | `btn-oauth` |
| Magic link button | `btn-magic-link` |
| Ghost/text button | `btn-ghost` |
| Form input | `input-field` |
| Auth page card | `auth-card` |
| Dashboard panel | `panel-card` |
| Error alert | `alert-error` |
| Success alert | `alert-success` |
| Info alert | `alert-info` |

---

## Build Verification

| Check | Status |
|-------|--------|
| TypeScript (`tsc --noEmit`) | Passed |
| Next.js lint | Passed (no new errors) |
| No hardcoded grays in updated files | Verified |
| DS v2 tokens consistently applied | Verified |

---

## Files Modified

### Error Pages
- `apps/dashboard/src/app/error.tsx`
- `apps/dashboard/src/app/global-error.tsx`
- `apps/dashboard/src/app/not-found.tsx`

### Documentation
- `docs/DESIGN_SYSTEM_ALIGNMENT_S84.md` (this file)

### Files Audited (Already Compliant)
- `apps/dashboard/src/app/login/page.tsx`
- `apps/dashboard/src/app/callback/page.tsx`
- `apps/dashboard/src/app/onboarding/page.tsx`
- `apps/dashboard/src/app/app/layout.tsx`

---

## Reference Implementation Status

The following files are now **canonical DS v2 reference implementations**:

| Category | Reference File | Key Patterns |
|----------|---------------|--------------|
| Login/Signup | `login/page.tsx` | OAuth flow, magic link, form inputs, alerts |
| Auth Callback | `callback/page.tsx` | Loading states, error handling, redirects |
| Onboarding | `onboarding/page.tsx` | Multi-step forms, validation, progress |
| App Shell | `app/layout.tsx` | Sidebar, navigation, user menu |
| Error Page | `error.tsx` | Runtime error display, retry actions |
| 404 Page | `not-found.tsx` | Not found state, navigation options |
| Critical Error | `global-error.tsx` | Root-level error (inline styles) |

---

## Notes

1. **global-error.tsx uses inline styles** - This is intentional since it replaces the root layout and cannot rely on CSS classes from globals.css

2. **AI Presence Dot** - The `AIPresenceDot` component is used consistently across auth pages to indicate AI activity states (idle, analyzing, generating)

3. **Semantic Colors** - Error pages use `semantic-danger` while navigation/informational pages use `brand-iris` or `brand-cyan`

4. **Gradient Backgrounds** - All auth/error pages use a subtle radial gradient overlay for visual depth

5. **Support Contact** - All error states include a support contact link styled with `text-brand-cyan`

---

## Next Steps (Future Sprints)

1. Apply similar DS v2 enforcement to remaining pillar pages
2. Update component library internals to use DS v2 tokens
3. Create Storybook documentation for DS v2 patterns
4. Add visual regression tests for DS v2 compliance
