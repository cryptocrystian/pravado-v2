# Pravado Screenshot Capture Guide

> **Sprint S86 - Visual QA, Screenshot Suite & UX Polish**
> **Purpose**: Standardized screenshot collection for documentation, marketing, and regression testing
> **Last Updated**: December 8, 2025

---

## Overview

This guide provides a systematic approach to capturing consistent, high-quality screenshots of the Pravado dashboard for:
- Marketing materials and website assets
- Documentation and help guides
- Visual regression baseline
- Investor/stakeholder presentations

---

## Environment Setup

### Browser Configuration
```
Browser: Chrome (latest stable)
Window Size: 1440x900 (primary) | 1920x1080 (hero shots)
Device Pixel Ratio: 2x (Retina) for high-res exports
Extensions: Disable all (or use incognito)
```

### System Settings
- **OS Dark Mode**: Enabled (DS v2 is dark-mode first)
- **Font Smoothing**: Enabled
- **Reduce Motion**: Disabled (to capture animations if needed)

### Chrome DevTools Preset
```javascript
// Run in Console to set consistent viewport
document.body.style.zoom = '100%';
```

### Recommended Chrome Flags
- `chrome://flags/#enable-force-dark` - OFF
- `chrome://flags/#enable-reader-mode` - OFF

---

## Screenshot Naming Convention

```
pravado_[section]_[page]_[state]_[viewport].png
```

### Examples
- `pravado_auth_login_default_1440.png`
- `pravado_pr_explorer_empty_1440.png`
- `pravado_exec_investors_loaded_1920.png`
- `pravado_playbooks_editor_modal_1440.png`

### Section Codes
| Code | Section |
|------|---------|
| `auth` | Authentication (login, callback, onboarding) |
| `home` | Dashboard home |
| `pr` | PR Intelligence |
| `content` | Content Hub |
| `seo` | SEO Module |
| `playbooks` | AI Playbooks |
| `agents` | AI Agents |
| `team` | Team Management |
| `exec` | Executive Suite |
| `scenarios` | Scenarios & Simulations |
| `reality` | Reality Maps |
| `conflicts` | Insight Conflicts |
| `risk` | Risk Radar |
| `billing` | Billing & Subscription |
| `admin` | Admin Pages |

### State Codes
| Code | Description |
|------|-------------|
| `default` | Default/initial view |
| `empty` | Empty state (no data) |
| `loaded` | Populated with data |
| `loading` | Loading spinner visible |
| `error` | Error state displayed |
| `modal` | Modal dialog open |
| `hover` | Hover state on element |
| `selected` | Item selected |
| `expanded` | Sidebar/section expanded |
| `collapsed` | Sidebar/section collapsed |

---

## Required Screenshots

### Priority 1: Marketing/Website (Hero Shots)

| # | Page | State | Viewport | Notes |
|---|------|-------|----------|-------|
| 1 | `/app` | loaded | 1920x1080 | Dashboard with sample data |
| 2 | `/app/pr` | loaded | 1920x1080 | Journalist explorer with selections |
| 3 | `/app/content` | loaded | 1920x1080 | Content hub with articles |
| 4 | `/app/playbooks` | loaded | 1920x1080 | Playbooks list |
| 5 | `/app/exec` | loaded | 1920x1080 | Executive dashboard |
| 6 | `/app/exec/investors` | loaded | 1920x1080 | Investor relations |
| 7 | `/app/scenarios` | loaded | 1920x1080 | Scenario simulations |
| 8 | `/app/risk-radar` | loaded | 1920x1080 | Risk dashboard |

### Priority 2: Documentation (Feature Shots)

| # | Page | State | Viewport | Notes |
|---|------|-------|----------|-------|
| 9 | `/login` | default | 1440x900 | Login page |
| 10 | `/onboarding` | default | 1440x900 | Onboarding wizard |
| 11 | `/app/pr` | empty | 1440x900 | No journalists/lists |
| 12 | `/app/pr` | modal | 1440x900 | Create list modal |
| 13 | `/app/content` | default | 1440x900 | Content listing |
| 14 | `/app/playbooks/editor` | loaded | 1440x900 | Visual editor |
| 15 | `/app/agents` | loaded | 1440x900 | Agent cards |
| 16 | `/app/team` | loaded | 1440x900 | Team members |
| 17 | `/app/billing` | loaded | 1440x900 | Billing overview |
| 18 | `/app/scenarios/simulations` | loaded | 1440x900 | Simulation results |
| 19 | `/app/scenarios/orchestrations` | loaded | 1440x900 | Suite management |
| 20 | `/app/reality-maps` | loaded | 1440x900 | Reality map view |
| 21 | `/app/insight-conflicts` | loaded | 1440x900 | Conflicts list |

### Priority 3: Error & Edge States

| # | Page | State | Viewport | Notes |
|---|------|-------|----------|-------|
| 22 | `/not-found` | default | 1440x900 | 404 page |
| 23 | `/error` | default | 1440x900 | Error boundary |
| 24 | `/app/pr` | loading | 1440x900 | Loading spinner |
| 25 | `/app/exec/investors` | error | 1440x900 | Error alert |
| 26 | `/app/playbooks` | empty | 1440x900 | No playbooks |

### Priority 4: Component Showcase

| # | Component | State | Notes |
|---|-----------|-------|-------|
| 27 | Button | all variants | btn-primary, btn-secondary, btn-ghost |
| 28 | Input | all states | default, focus, error, disabled |
| 29 | Card | panel-card | Standard panel styling |
| 30 | Modal | open | Overlay and dialog |
| 31 | Tabs | active/inactive | Tab navigation pattern |
| 32 | Alert | error | alert-error styling |
| 33 | Badge | variants | Semantic colors |
| 34 | Empty State | example | Icon, heading, CTA |

---

## Capture Techniques

### Full Page Screenshot (Chrome)
1. Open DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Set responsive viewport to desired size
4. Click "..." menu → "Capture full size screenshot"

### Element Screenshot (Chrome)
1. Open DevTools (F12)
2. Right-click element in Elements panel
3. Select "Capture node screenshot"

### Scrollable Area Screenshot
1. Use extension like "GoFullPage" for long pages
2. Or use Chrome's built-in full-size capture

### Animation Frame Capture
1. Open DevTools → More Tools → Animations
2. Pause at desired frame
3. Capture screenshot

---

## Post-Processing

### Image Optimization
```bash
# Using imageoptim (macOS) or similar
imageoptim -d ./screenshots

# Or using pngquant for PNG compression
pngquant --quality=80-90 *.png
```

### Recommended Export Settings
| Use Case | Format | Quality | Max Width |
|----------|--------|---------|-----------|
| Website | WebP | 85% | 1920px |
| Documentation | PNG | 100% | 1440px |
| Presentations | PNG | 100% | 1920px |
| Email | JPEG | 80% | 800px |

### Annotation Guidelines
- Use **brand-cyan (#00D4FF)** for highlight boxes
- Use **white** for text annotations
- Font: System UI or Inter
- Arrow style: Rounded, 2px stroke

---

## Screenshot Session Checklist

### Before Session
- [ ] Clear browser cache
- [ ] Login to demo account with sample data
- [ ] Set viewport to correct size
- [ ] Enable DevTools device emulation
- [ ] Create output folder with date

### During Session
- [ ] Capture each page at required states
- [ ] Wait for all assets to load before capture
- [ ] Verify no console errors in shot
- [ ] Check for stray tooltips/dropdowns
- [ ] Name files according to convention

### After Session
- [ ] Organize files by priority/section
- [ ] Run image optimization
- [ ] Verify all required shots captured
- [ ] Upload to shared storage

---

## Demo Data Requirements

For marketing-ready screenshots, ensure demo environment has:

### PR Intelligence
- 20+ journalists with varied tiers
- 3-5 media lists with members
- Some journalists with beat tags

### Content Hub
- 10+ content pieces in various states
- Mix of published/draft/review

### Playbooks
- 5+ playbooks (some running, some completed)
- Visual editor with connected nodes

### Executive Suite
- Investor packs at various stages
- KPI data populated
- Charts with meaningful data

### Scenarios
- Active simulations running
- Completed simulations with results
- Orchestration suites configured

---

## Tools & Resources

### Recommended Extensions
- **GoFullPage** - Full page screenshots
- **Awesome Screenshot** - Annotation and capture
- **ColorZilla** - Color picker for verification

### Storage Locations
```
/docs/screenshots/         # Version-controlled samples
/marketing/assets/         # High-res marketing assets
Google Drive/Screenshots/  # Shared team access
```

### Automation Scripts (Future)
```bash
# Playwright screenshot script (example)
npx playwright screenshot \
  --viewport-size=1440,900 \
  --full-page \
  --output=./screenshots \
  https://pravado-dashboard.vercel.app/app
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 8, 2025 | Initial guide created (S86) |

---

## Notes

1. **Sample Data**: Production screenshots should use anonymized/demo data
2. **Timing**: Capture after all animations complete (~500ms delay)
3. **Consistency**: Use same browser zoom level (100%) across all shots
4. **Quality Control**: Review each screenshot for visual artifacts before finalizing
5. **Dark Mode First**: DS v2 is designed dark-mode first; all screenshots should reflect this
