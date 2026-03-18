# MOBILE-02 — Store Prep, Detail Screens, Push Endpoint

**Date**: 2026-03-17
**Scope**: Prepare Pravado mobile app for TestFlight and Play Store internal track

---

## What's Complete

### Push Notification API
- `POST /api/v1/notifications/register-device` endpoint created
- `device_push_tokens` table (migration 89)
- Upserts token on registration, tracks last_seen
- Mobile app now successfully registers push tokens

### Content Detail Screen
- Full CiteMind score breakdown with 6 factor bars
- Color-coded bars (green >75, yellow 55-75, red <55)
- Gate status explanation text
- Body preview with expand toggle
- Sticky action bar: Approve/Publish, Warn, Blocked states
- "Open in Pravado" deep link

### Pitch Detail Screen
- Journalist card with avatar and outlet
- Full pitch subject + body
- Visual status timeline (Created -> Sent -> Opened -> Responded -> Placed)
- EVI attribution for placed pitches
- "Open in Pravado" and "Edit in Pravado" deep links

### Deep Linking
- iOS: Associated Domains for app.pravado.io
- Android: Intent filters for https://app.pravado.io
- URL handler in root layout parses paths and navigates to correct screen
- Supports: /app/content/:id, /app/pr, /app/analytics, /app/command-center

### Store Metadata
- iOS App Store metadata (store-metadata/ios.md)
- Android Play Store metadata (store-metadata/android.md)
- App description, keywords, URLs, categories

### Build Infrastructure
- Pre-build check script (scripts/pre-build-check.sh)
- Placeholder asset generator (scripts/generate-placeholders.js)
- Placeholder PNGs created for icon, splash, adaptive-icon, favicon

## EAS Build Commands

```bash
# Preview build (internal testing)
cd apps/mobile
npx eas build --platform ios --profile preview
npx eas build --platform android --profile preview

# Production build
npx eas build --platform ios --profile production
npx eas build --platform android --profile production

# Submit to stores
npx eas submit --platform ios    # -> TestFlight
# Android: download from EAS dashboard -> upload to Play Console
```

## Manual Steps Still Needed

1. **Replace placeholder assets** with real brand icons/splash from design team
2. **Link EAS to Apple Developer account** (`npx eas credentials --platform ios`)
3. **Link EAS to Google Play account** (service account JSON in eas.json)
4. **Create apple-app-site-association** file at app.pravado.io/.well-known/ for universal links
5. **Create assetlinks.json** at app.pravado.io/.well-known/ for Android App Links
6. **Apply migration 89** (device_push_tokens) via Supabase SQL Editor
7. **App Store screenshots** — capture from simulator after build
8. **App review notes** — "Requires existing Pravado account. Test credentials: [provide]"
