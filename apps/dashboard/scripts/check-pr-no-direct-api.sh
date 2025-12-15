#!/bin/bash
#
# Sprint S100: PR Auth & Data Execution Lock - Regression Guard
#
# This script enforces the invariant that NO PR page imports from prDataServer.
# All PR data requests MUST go through /api/pr/* route handlers.
#
# Usage: ./scripts/check-pr-no-direct-api.sh
# Exit code: 0 = pass, 1 = violations found
#

set -e

echo "===== Sprint S100: PR Auth Regression Guard ====="
echo ""

# Define directories to check (PR pages and components that should NOT import prDataServer)
PR_PAGES=(
  "src/app/app/pr/journalists"
  "src/app/app/pr/generator"
  "src/app/app/pr/deliverability"
  "src/app/app/pr/outreach"
  "src/app/app/pr/pitches"
)

# Define the forbidden pattern
FORBIDDEN_PATTERN="from.*@/server/prDataServer"

violations=0

echo "Checking for forbidden prDataServer imports in PR pages..."
echo ""

for dir in "${PR_PAGES[@]}"; do
  if [ -d "$dir" ]; then
    # Search for files importing from prDataServer
    matches=$(grep -rE "$FORBIDDEN_PATTERN" "$dir" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo "VIOLATION in $dir:"
      echo "$matches"
      echo ""
      violations=$((violations + 1))
    else
      echo "OK: $dir"
    fi
  else
    echo "SKIP: $dir (not found)"
  fi
done

echo ""

# Also check that page.tsx files don't have async function (indicating SSR fetch)
# In S100, pages should render client components that load their own data
echo "Checking for async page components (should not fetch data in SSR)..."
echo ""

for dir in "${PR_PAGES[@]}"; do
  page_file="$dir/page.tsx"
  if [ -f "$page_file" ]; then
    # Check for async function in page.tsx (indicates SSR data fetching)
    if grep -qE "export default async function" "$page_file"; then
      echo "WARNING: $page_file has async default export (SSR data fetch)"
      # This is a warning, not a violation, as it may be intentional
    else
      echo "OK: $page_file (no async SSR)"
    fi
  fi
done

echo ""

# Final check: ensure route handlers exist for all expected endpoints
echo "Checking that route handlers exist..."
echo ""

EXPECTED_ROUTES=(
  "src/app/api/pr/journalists/route.ts"
  "src/app/api/pr/releases/route.ts"
  "src/app/api/pr/releases/[id]/route.ts"
  "src/app/api/pr/releases/generate/route.ts"
  "src/app/api/pr/deliverability/summary/route.ts"
  "src/app/api/pr/deliverability/messages/route.ts"
  "src/app/api/pr/deliverability/top-engaged/route.ts"
  "src/app/api/pr/outreach/stats/route.ts"
  "src/app/api/pr/pitches/sequences/route.ts"
)

for route in "${EXPECTED_ROUTES[@]}"; do
  if [ -f "$route" ]; then
    echo "OK: $route"
  else
    echo "MISSING: $route"
    violations=$((violations + 1))
  fi
done

echo ""
echo "===== Summary ====="

if [ $violations -eq 0 ]; then
  echo "All checks passed. PR auth execution lock is enforced."
  exit 0
else
  echo "FAILED: Found $violations violation(s)"
  echo ""
  echo "S100 Invariant: All PR data requests MUST go through /api/pr/* route handlers."
  echo "NO page may import from @/server/prDataServer."
  exit 1
fi
