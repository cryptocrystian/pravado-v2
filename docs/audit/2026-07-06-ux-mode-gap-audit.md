# UX Mode Implementation Gap Audit — Pre-Remediation Scoping

**Date:** 2026-07-06
**Type:** Gap audit (diagnostic only — no code changes, no fixes)
**Against:** `AUTOMATION_MODE_CONTRACTS_CANON.md` + `MODE_UX_ARCHITECTURE.md` must-ship list
**Scope:** Manual / Copilot / Autopilot per-pillar mode build-out, beta-blocking readiness.

---

## Headline finding

Mode is **not one system** — it is **five disconnected implementations** with three different defaults and **zero server persistence**:

| System   | File                                              | Default   | Persistence                 |
| -------- | ------------------------------------------------- | --------- | --------------------------- |
| Global   | `lib/ModeContext.tsx` + `lib/mode-preferences.ts` | `manual`  | localStorage only           |
| PR       | `components/pr/PRModeContext.tsx:28`              | `copilot` | in-memory `useState` (none) |
| Content  | `app/app/content/page.tsx:53`                     | `copilot` | in-memory `useState` (none) |
| SEO      | `components/seo/SEOModeContext.tsx`               | (context) | in-memory (none)            |
| Calendar | `components/calendar/CalendarModeContext.tsx`     | (context) | in-memory (none)            |

Changing mode in one pillar does not affect the others; nothing survives a server round-trip or a new device. **This fragmentation is the root cause of most PARTIAL/MISSING items below** — there is no single, persisted, plan-hydrated mode state to drive layout, re-evaluation, or ceilings. Remediation should start with a keystone "unify mode state" step.

---

## Item audit table

| #   | Description                                   | State                  | Evidence (file:line)                                                                                                                                                                                                                                                     | Est fix LoC  | Must-ship?     |
| --- | --------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------ | -------------- |
| 1   | ModeSwitcher in every work-surface header     | **BUILT** (fragmented) | `pr/PRChromeBar.tsx:84,236` (local impl); `seo/SEOChromeBar.tsx:235`; `calendar/CalendarChromeBar.tsx:248`; `analytics/AnalyticsChromeBar.tsx:241`; `shared/ModeSwitcher.tsx`                                                                                            | ~0 (present) | Y              |
| 2   | Mode badge in Impact Strip on proposals       | **PARTIAL**            | Command Center per-action tag: `command-center/ActionCard.tsx:267,437,675` (`action.mode`); `shared/ImpactStrip.tsx:72` has ModeSwitcher; PR/Content use separate ImpactStrip variants                                                                                   | ~100         | Y              |
| 3   | Layout changes between modes (not badge swap) | **PARTIAL**            | SEO ✅ `app/app/seo/page.tsx:23-25`; PR ✅ `app/app/pr/page.tsx:6-9`; **Content ❌ orphaned** — `ManualModeView`/`CopilotModeView`/`AutopilotModeView` only exported (`content/index.ts:45-47`), never mounted; `content/page.tsx:123-217` renders `ContentOverviewView` | ~250         | Y              |
| 4   | Plan-tier default mode wired                  | **MISSING**            | Hardcoded `globalMode: 'manual'` (`mode-preferences.ts:56`, `ModeContext.tsx:76`); PR/Content default `'copilot'` via `useState`; **no plan read, no server persistence** anywhere                                                                                       | ~350         | Y              |
| 5   | Content V1 hardcoded ceilings enforced        | **MISSING**            | grep `mode\|ceiling\|autopilot` in `apps/api/src/routes/content` → **no matches**; ceilings exist only as client `ModeSwitcher` `ceiling` props, unenforced at publish/draft endpoints                                                                                   | ~250         | Y              |
| 6   | Mode-conditional Action Stream behavior       | **PARTIAL**            | `ActionCard.tsx:267-276,437-446,675-684` branches on `action.mode` for **label/tag only** — not §5C structural behavior (autopilot default-collapse, copilot reasoning chip + Approve/Review, manual direct CTA)                                                         | ~200         | Y              |
| 7   | ModeSwitcher change triggers re-evaluation    | **PARTIAL**            | Change = optimistic state + persist (localStorage for global / memory for PR+Content) + §6C autopilot-exit confirm (`ModeSwitcher.tsx:317-335`). **No re-evaluation, no evaluating-AI state, no layout recalc, no transition indicator**                                 | ~300         | Y              |
| 8   | Autopilot kill switch + activity log surface  | **PARTIAL**            | `content/views/AutopilotModeView.tsx` (built but orphaned), PR guardrails `app/api/pr/guardrails/evaluate/route.ts`, exception-queue fragments; **kill switch not confirmed**                                                                                            | ~250         | **DEFER (P2)** |

---

## Per-item detail

**Item 1 — BUILT (fragmented).** A ModeSwitcher renders in every surface header, but there are **≥2 distinct implementations**: the shared `shared/ModeSwitcher.tsx` (full: ceiling UI + §6C autopilot-exit confirm) and pillar-local ones (e.g. `PRChromeBar.tsx:84 function ModeSwitcher()`). The local ones likely lack the ceiling/confirm affordances — inconsistent §4/§6C compliance across pillars.

**Item 2 — PARTIAL.** Per-_action_ mode tags exist in the Command Center (`ActionCard.tsx`, architect-confirmed in Chrome). The shared `ImpactStrip` embeds the ModeSwitcher, but PR (`pr-work-surface/components/ImpactStrip.tsx`) and Content use their own strip variants; a uniform per-proposal mode badge across all three pillar Impact Strips is not confirmed.

**Item 3 — PARTIAL.** SEO and PR do **real** mode-conditional layout switching (SEO mounts `SEOManualView`/`SEOCopilotView`/`SEOAutopilotView`; PR is a three-mode surface). **Content is the gap:** its three mode views are fully built but **never mounted** — `content/page.tsx` renders `ContentOverviewView` with a `mode` prop (badge-level), which is exactly the "badge swap" §1 warns against for Content.

**Item 4 — MISSING (canon-blocking).** There is **no plan → default-mode path at all**. Default is hardcoded (`manual` global, `copilot` PR/Content), read from localStorage/memory, never from plan tier or an org/user record. See the canon conflict below — even the _target_ default is ambiguous, but no code reads plan tier regardless.

**Item 5 — MISSING.** The Content backend (`apps/api/src/routes/content/**`) has **zero** mode/ceiling awareness. The §2C V1 ceilings (publishing never Autopilot; draft/derivative/brief/scheduling = Copilot ceiling; CiteMind = Autopilot ceiling) are not enforced where it matters. The client can pass a `ceiling` prop to `ModeSwitcher`, but that only caps the _UI selector_ — the publish/draft/schedule endpoints do not check mode, so the hard ceiling is bypassable.

**Item 6 — PARTIAL.** `ActionCard` does branch on `action.mode`, but the branches toggle **labels/tags**, not the §5C structural contract (Autopilot cards collapsed-by-default unless exception; Copilot cards show reasoning chip + Approve/Review; Manual cards show a direct CTA with no AI reasoning). Consistent with the architect's "uniform card treatment" observation.

**Item 7 — PARTIAL.** The change handler does (1) optimistic badge update, (2) persist, and the §6C autopilot-exit confirmation — but **omits (3) trigger re-evaluation with an evaluating-AI state, (4) render mode-appropriate layout, (5) transition indicator.** It is a state swap, not a re-evaluation. (Also: "persist" is localStorage/memory, not server.)

**Item 8 — PARTIAL / DEFER.** Guardrail evaluation (`api/pr/guardrails/evaluate`), an exception queue, and a content `AutopilotModeView` exist, but the content view is orphaned and a dedicated **kill switch** was not found. Not beta-blocking — file as post-beta **P2**.

---

## Totals & gap size

- **Must-ship items (1–7): 6 of 7 are PARTIAL or MISSING** (only Item 1 is present, and it's fragmented). Item 8 defers.
- **Estimated must-ship remediation:** **~1,600–2,000 LoC**, dominated by a keystone "unify mode state" foundation (~600–800 LoC) that the rest depends on.

---

## Recommended remediation sprint plan (grouped by cohesion, not by item)

1. **PR-1 · Keystone: unify + persist mode state (~600–800 LoC).** Collapse the five mode systems into one server-persisted `ModeContext`: add an org/user mode-preference record + API, migrate `PRModeContext`/`SEOModeContext`/`CalendarModeContext`/Content-local `useState` onto it, and wire **plan-tier default hydration** (Item 4, after the canon conflict is resolved). Unblocks Items 1, 2, 3, 4, 7.
2. **PR-2 · Mode-conditional surfaces (~350 LoC).** Mount Content's orphaned `Manual/Copilot/AutopilotModeView` (Item 3); standardize the Impact-Strip mode badge across PR/Content/SEO (Item 2).
3. **PR-3 · Re-evaluation on mode change (~300 LoC).** Change handler → backend proposal re-eval + evaluating-AI state + transition indicator (Item 7).
4. **PR-4 · Content ceiling enforcement (~250 LoC).** Server-side §2C ceilings on publish/draft/derivative/brief/schedule endpoints (Item 5).
5. **PR-5 · Action Stream structural behavior (~200 LoC).** §5C per-mode card treatment: Autopilot collapse, Copilot reasoning + Approve/Review, Manual direct CTA (Item 6).
6. **Post-beta P2.** Item 8 autopilot supervision surface (kill switch, activity log, guardrail alerts).

Sequence PR-1 first — attempting 2/3/4/7 before the state is unified/persisted means building on sand.

---

## Canon conflict surfaced (architect to resolve)

**Plan-tier default mode (Item 4)** — two canon sources disagree, and the code implements **neither**:

- `PLANS_LIMITS_ENTITLEMENTS.md` (per §2D): Starter/Trial = **Copilot** ("Manual + Copilot only"); Pro = Copilot; Enterprise = **Manual**.
- Overview canvas: SMB = **Autopilot**; Mid-market = Copilot; Enterprise = Manual.
- Code today: hardcoded `manual` (global) / `copilot` (PR + Content), with **no plan read at all**.

The SMB default is the crux: `Autopilot` (Overview) vs `Copilot` (Plans/Entitlements). Resolve before wiring PR-1's hydration.

---

## Adjacent findings (mode-related bugs / debt surfaced during inspection)

1. **Five disconnected mode systems, three defaults, zero server persistence** (see headline table) — the core debt.
2. **≥2 ModeSwitcher implementations** — `shared/ModeSwitcher.tsx` vs `PRChromeBar.tsx:84` (and likely SEO/Calendar/Analytics locals). Only the shared one has the §6C autopilot-exit confirmation and ceiling UI, so §6C compliance is inconsistent across pillars.
3. **Content mode views are orphaned** — `ManualModeView`/`CopilotModeView`/`AutopilotModeView` are fully built (`content/views/`) but only exported (`content/index.ts:45-47`), never rendered.
4. **Mock data underpins mode surfaces** — `content/page.tsx` renders from `CONTENT_OVERVIEW_MOCK`; the shared ModeSwitcher's §6C exit dialog shows a fabricated count (`MOCK_AUTOPILOT_ACTIVE_ACTIONS = 4`, `ModeSwitcher.tsx:126`). Mode UX is being validated against mock state.
5. **Content ceilings are client-only** — the V1 hard ceilings live as `ModeSwitcher` `ceiling` props (UI cap) with no server enforcement, so they are bypassable via the API.
6. **`manual` is the global default but `copilot` is the PR/Content default** — a user's effective mode depends on which pillar's silo they land in, with no reconciliation.
