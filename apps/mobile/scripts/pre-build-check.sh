#!/bin/bash
set -e

echo "=== Pravado Mobile Pre-Build Check ==="
echo ""

cd "$(dirname "$0")/.."

# Check assets
echo "Checking assets..."
MISSING=0
for asset in assets/icon.png assets/splash.png assets/adaptive-icon.png; do
  if [ ! -f "$asset" ]; then
    echo "  MISSING: $asset"
    MISSING=1
  else
    echo "  OK: $asset"
  fi
done
if [ $MISSING -eq 1 ]; then
  echo ""
  echo "WARNING: Missing asset files. Build may fail."
  echo "Generate placeholders or add real brand assets."
  echo ""
fi

# Check config files
echo ""
echo "Checking config..."
for cfg in eas.json app.json package.json; do
  if [ -f "$cfg" ]; then
    echo "  OK: $cfg"
  else
    echo "  MISSING: $cfg"
    exit 1
  fi
done

echo ""
echo "=== Pre-build checks complete ==="
echo ""
echo "Next steps:"
echo "  cd apps/mobile"
echo "  npx eas build --platform ios --profile preview"
echo "  npx eas build --platform android --profile preview"
echo ""
echo "After build:"
echo "  iOS:     npx eas submit --platform ios"
echo "  Android: Download APK from EAS dashboard → upload to Play Console"
