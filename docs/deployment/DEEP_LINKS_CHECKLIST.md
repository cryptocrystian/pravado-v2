# Mobile Deep Link Setup Checklist

## iOS Universal Links

Status: PARTIAL — files deployed, Team ID needed

### Step 1 — Update Team ID (REQUIRED before iOS deep links work)
1. Go to developer.apple.com → Account → Membership
2. Copy your Team ID (10-character alphanumeric string, e.g. "AB12CD34EF")
3. Edit `apps/dashboard/public/.well-known/apple-app-site-association`
4. Replace `XXXXXXXXXX` with your real Team ID
5. Commit and push → Vercel redeploys automatically

### Step 2 — Verify after EAS build
After running `eas build --platform ios --profile preview`:
1. Open: https://app.pravado.io/.well-known/apple-app-site-association
2. Confirm it returns JSON with your real Team ID
3. Use Apple's validator: https://branch.io/resources/aasa-validator/

## Android App Links

Status: PARTIAL — files deployed, SHA-256 fingerprint needed

### Step 1 — Get SHA-256 fingerprint
After running `eas build --platform android --profile production`:
1. Go to expo.dev → your project → Builds
2. Click the Android build → Download Certificate
3. Run: `keytool -printcert -file <downloaded.cer> | grep SHA256`
4. Or find it directly in the EAS build details page

### Step 2 — Update assetlinks.json
1. Edit `apps/dashboard/public/.well-known/assetlinks.json`
2. Replace the TODO placeholder with your real SHA-256 fingerprint
   Format: `AB:CD:EF:...` (colon-separated hex pairs)
3. Commit and push

### Step 3 — Verify
1. Open: https://app.pravado.io/.well-known/assetlinks.json
2. Use Google's validator: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://app.pravado.io&relation=delegate_permission/common.handle_all_urls

## Testing Deep Links

Once both files have real values and the app is installed:

**iOS:**
```bash
# In iOS Simulator terminal
xcrun simctl openurl booted "https://app.pravado.io/app/command-center"
```

**Android:**
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://app.pravado.io/app/command-center" com.pravado.mobile
```

## Supported Deep Link Paths

| URL Path | Mobile Screen |
|----------|--------------|
| `/app/command-center` | Today tab |
| `/app/content/:id` | Content Detail modal |
| `/app/pr` | PR tab |
| `/app/analytics` | Analytics tab |
| `/login` | Login screen |
| `/legal/*` | Opens in browser (not app) |
