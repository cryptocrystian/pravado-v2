# MOBILE-01 — Pravado Companion App v1

**Date**: 2026-03-17
**Scope**: Complete React Native Expo companion app

---

## Screens Built

| Screen | Route | Purpose |
|--------|-------|---------|
| Login | `/(auth)/login` | Google OAuth + Magic Link via Supabase |
| Today | `/(tabs)/index` | EVI score, SAGE brief, pending actions, citations |
| Action Queue | `/(tabs)/queue` | SAGE proposals with filter + approve/dismiss |
| Analytics | `/(tabs)/analytics` | EVI trend, time range, driver breakdown |
| Content | `/(tabs)/content` | Content library with status tabs + CiteMind badges |
| PR | `/(tabs)/pr` | Pitches, coverage, journalists tabs |
| Content Detail | `/content/[id]` | Modal — content item detail (stub) |
| Pitch Detail | `/pr/pitch/[id]` | Modal — pitch detail (stub) |

## Components Built

| Component | Purpose |
|-----------|---------|
| `EVIScore` | Large EVI display with score, delta, status badge |
| `ProposalCard` | SAGE proposal card with priority, pillar, approve/dismiss |
| `PillarTag` | Colored PR/Content/SEO tag |
| `CiteMindBadge` | Pass/warn/block score badge |
| `EmptyState` | Consistent empty state with icon + title + subtitle |
| `LoadingPulse` | Animated skeleton loader |

## API Endpoints Consumed

| Endpoint | Screen |
|----------|--------|
| `GET /evi/current` | Today, Analytics |
| `GET /evi/history` | Analytics |
| `GET /command-center/action-stream` | Today, Queue |
| `POST /command-center/proposals/:id/execute` | Queue (approve) |
| `POST /command-center/proposals/:id/dismiss` | Queue (dismiss) |
| `GET /content/items` | Content |
| `GET /pr/pitches` | PR |
| `GET /pr/coverage` | PR |
| `GET /journalists` | PR |
| `GET /citemind/monitor/results` | Today |
| `POST /notifications/register-device` | Login (may 404) |

## Infrastructure

- **Auth**: Supabase with expo-secure-store token persistence
- **API client**: Auto-attaches Bearer token, handles 401 → sign out
- **Push notifications**: Expo push token registration (API endpoint TBD)
- **Design system**: DS v3 colors (#0A0A0F bg, #13131A surface, #1F1F28 border)
- **Navigation**: expo-router with file-based routing, bottom tabs + modals

## Push Notification Status

- Mobile-side setup complete (token registration, handler, deep linking)
- API endpoint `POST /notifications/register-device` does not exist yet
- Registration gracefully fails with warning log if 404
- Deep link routing configured for `queue`, `content/:id`, `analytics`

## What's Needed for App Store Submission

### Required
- App icon (1024x1024 for App Store, adaptive icon for Play Store)
- Splash screen image (matching dark theme)
- Privacy policy URL (done: https://app.pravado.io/legal/privacy)
- EAS Build account linked to Apple Developer + Google Play accounts
- Screenshots (6.5" iPhone, 12.9" iPad if supporting tablet)

### Recommended
- App Store description and keywords
- Content detail screen (currently stub — expand for full body preview)
- Pitch detail screen (currently stub — expand for timeline)
- Offline caching (currently online-only)
- Biometric lock option
