# DS v3.1 Compliance Audit
**Date:** 2026-02-18  
**Scope:** `apps/dashboard/src/components/`  
**Files Scanned:** ContentWorkSurfaceShell.tsx, TriPaneShell.tsx, ActionCard.tsx, pillar-accents.ts, prWorkSurfaceStyles.ts, PRWorkSurfaceShell (styles contract), globals.css, tailwind.config.ts  
**Status:** ⚠️ VIOLATIONS FOUND — Cleanup required before Content sprint

---

## Summary

The design system definition is correct and complete. `globals.css` and `tailwind.config.ts` properly define all DS v3.1 tokens. The problem is that **components are not using those tokens** — they're using hardcoded hex values, many of which are one-off "in-between" values that don't exist in the DS at all. This is the source of the visual inconsistency and "design gremlin" behavior.

**Root cause:** Previous sessions inferred tokens from existing components rather than reading `DS_v3_1_EXPRESSION.md`. One hardcoded value spawned another, creating a drift chain.

---

## DS v3.1 Token Map (Ground Truth)

For use in fixes. All hex values below come from `globals.css` — these are the ONLY valid values.

| Token | CSS Var | Tailwind Class | Hex |
|-------|---------|---------------|-----|
| Page background | `--slate-0` / `--page-bg` | `bg-slate-0` / `bg-page` | `#0A0A0F` |
| Subtle elevation | `--slate-1` | `bg-slate-1` | `#0E0E14` |
| Card / Panel | `--slate-2` / `--panel-bg` | `bg-slate-2` / `bg-panel` | `#13131A` |
| Panel elevated | `--slate-3` | `bg-slate-3` | `#19191F` |
| Border default | `--slate-4` / `--dark-border` | `bg-slate-4` | `#1F1F28` |
| Border hover | `--slate-5` | `bg-slate-5` | `#2A2A35` |
| Muted text | `--slate-6` | `bg-slate-6` / `text-muted` | `#3D3D4A` |
| Border (utility) | `--dark-border` / `--border-subtle` | `border-border-subtle` | `#1F1F28` |
| Content text | `--white-0` / `--text` | `text-text` / `text-white-0` | `#E8E8ED` |

---

## Violation Category 1: Phantom Hex Values (HIGH SEVERITY)

These hex values **do not exist in DS v3.1**. They are one-off guesses inserted between real tokens, creating an unofficial sub-palette that is invisible to the design system.

| Phantom Value | Found In | Closest DS Token | Fix |
|--------------|----------|-----------------|-----|
| `#050508` | TriPaneShell (center pane bg) | `bg-slate-0` (`#0A0A0F`) | Replace with `bg-page` |
| `#0D0D12` | TriPaneShell, ActionCard, prWorkSurfaceStyles | Between slate-0 and slate-1 | Replace with `bg-slate-1` (`bg-[#0E0E14]`) |
| `#111116` | ActionCard (card hover) | Between slate-1 and slate-2 | Replace with `bg-slate-2` or `hover:bg-slate-2` |
| `#111118` | ActionCard (comfortable hover) | Same as above | Replace with `bg-slate-2` |
| `#16161E` | prWorkSurfaceStyles (`panelBg`) | Between slate-2 and slate-3 | Replace with `bg-slate-2` or `bg-slate-3` |
| `#1A1A24` | TriPaneShell, ActionCard, ContentWorkSurface, prWorkSurfaceStyles (`borderSubtle`) | Between slate-3 and slate-4 | Replace with `border-border-subtle` (`#1F1F28`) |
| `#2A2A36` | ActionCard, TriPaneShell (`borderHover`) | `--slate-5` is `#2A2A35` (1 digit off) | Replace with `border-slate-5` |
| `#3A3A48` | prWorkSurfaceStyles (`borderActive`) | No equivalent | Replace with `border-slate-5` or `border-slate-6` |
| `#0D0D12` (cardBg in styles) | prWorkSurfaceStyles | `bg-slate-1` | Replace with `bg-slate-1` |

**Count:** 9 phantom values, appearing in dozens of class strings across the codebase.

---

## Violation Category 2: Named Tokens Not Used Where They Should Be (MEDIUM SEVERITY)

The Tailwind config defines proper named tokens. These aren't being used consistently.

| Pattern Found | Should Be |
|--------------|-----------|
| `bg-[#0A0A0F]` (hardcoded) | `bg-page` or `bg-slate-0` |
| `bg-[#13131A]` (hardcoded) | `bg-panel` or `bg-slate-2` |
| `border-[#1F1F28]` (hardcoded) | `border-border-subtle` |
| `bg-gradient-to-r from-[#0A0A0F] to-[#0D0D12]` | `bg-gradient-to-r from-page to-slate-1` |
| `fill-[#1A1A24]` (HoverCard arrow) | Should use `fill-slate-4` or `fill-border-subtle` |

---

## Violation Category 3: Invalid Tailwind Syntax (MEDIUM SEVERITY)

These are broken classes that Tailwind will silently ignore (no compilation error, just no styling applied).

| Invalid Class | Found In | Correct Replacement |
|--------------|----------|-------------------|
| `bg-white/20/50` | `pillar-accents.ts` (modeStyles.manual.bg) | `bg-white/10` |
| `bg-white/30/10` | `pillar-accents.ts` (priorityStyles.low.bg) | `bg-white/5` |

---

## Violation Category 4: Semantic Misuse (LOW SEVERITY)

| Pattern | Found In | Issue |
|---------|----------|-------|
| `text-white` (plain, no opacity) | ContentWorkSurfaceShell ExplainDrawer | DS text color should be `text-text` or `text-white-0`. Plain `text-white` is `#FFFFFF` — 100% white, brighter than the DS `--white-0: #E8E8ED` intent |
| `bg-black/50` | ContentWorkSurfaceShell (drawer backdrop) | `bg-black` is not a DS token. Should be `bg-slate-0/80` or `bg-page/70` with backdrop-blur |
| `hover:bg-brand-iris/8` | ActionCard | `/8` is not a standard Tailwind opacity step — use `/10` |
| `hover:bg-brand-magenta/8` | ActionCard | Same issue — use `/10` |
| `hover:bg-brand-cyan/8` | ActionCard | Same issue — use `/10` |

---

## Violation Category 5: surfaceTokens JS Objects (LOW SEVERITY — ARCHITECTURE)

Both `pillar-accents.ts` and `prWorkSurfaceStyles.ts` define `surfaceTokens` JavaScript objects with hardcoded hex values used as string constants in inline styles or template literals. This pattern bypasses Tailwind entirely and creates a second unofficial token system.

```typescript
// pillar-accents.ts — PROBLEM
export const surfaceTokens = {
  page: '#0A0A0F',       // Phantom/correct but bypasses Tailwind
  card: '#13131A',        // Should use CSS vars or Tailwind
  cardElevated: '#1A1A24', // Phantom value
  border: '#1F1F28',
  borderSubtle: '#16161E', // Phantom value
  borderHover: '#2A2A36',  // Off by 1 from slate-5
};
```

**Risk:** If these JS token values are used in `style={}` props or string interpolation (e.g., `style={{ backgroundColor: surfaceTokens.card }}`), they will never respond to theme changes and are invisible to Tailwind's purge/JIT.

**Recommended fix:** Remove these JS token objects. All surface values should come from Tailwind utility classes referencing CSS vars.

---

## What's Clean ✅

These patterns are **correct** and should be preserved:
- All `brand-iris`, `brand-cyan`, `brand-magenta`, `brand-amber`, `brand-teal` usage via Tailwind tokens
- All `semantic-success`, `semantic-warning`, `semantic-danger`, `semantic-info` usage
- All `shadow-elev-*` usage
- The `text-white/X` opacity scale (e.g., `text-white/50`, `text-white/85`) — this IS the DS v3 pattern for body text
- All pillar accent gradient patterns (`brand-iris/10`, `brand-magenta/30`, etc.)
- Motion classes (`duration-sm`, `ease-standard`, etc.)
- `rounded-lg`, `rounded-xl` (matching DS radius tokens)
- Typography classes in `prWorkSurfaceStyles.ts` — well-structured

---

## Fix Priority Order

### P1 — Fix Now (Before Any UI Work)
1. **Replace all phantom hex values** with nearest DS token (see Category 1 table)
2. **Fix invalid Tailwind syntax** (`/20/50`, `/30/10`) — these are silently broken

### P2 — Fix This Sprint
3. **Replace hardcoded-but-correct hex** with named tokens (`bg-[#0A0A0F]` → `bg-page`)
4. **Remove JS surfaceTokens objects** in `pillar-accents.ts` and `prWorkSurfaceStyles.ts`
5. **Standardize hover opacity** (`/8` → `/10` for brand colors)

### P3 — Low Priority
6. Backdrop color (`bg-black/50` → `bg-page/70`)
7. Plain `text-white` → `text-text` audit pass

---

## Recommended Fix Approach

Rather than a scattered find-replace, the cleanest path is:

1. **Create `DS_v3_COMPLIANCE_CHECKLIST.md`** (next deliverable) — rules baked in so Claude Code can self-check
2. **Single cleanup commit per component** — fix all violations in ContentWorkSurface together, then Command Center, then PR
3. **Add token validation to CLAUDE.md** — explicit list of forbidden phantom values

---

## Phantom Value Quick Reference Card

Pin this for the cleanup sprint. Any of these values in component code = violation:

```
PHANTOM (replace immediately):
#050508  →  bg-page (bg-slate-0)
#0D0D12  →  bg-slate-1
#111116  →  bg-slate-2
#111118  →  bg-slate-2
#16161E  →  bg-slate-2 or bg-slate-3
#1A1A24  →  border-border-subtle (or border-slate-4)
#2A2A36  →  border-slate-5 (correct is #2A2A35)
#3A3A48  →  border-slate-5 or border-slate-6
```
