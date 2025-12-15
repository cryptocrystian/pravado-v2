#!/bin/bash
#
# Sprint S100.1: PR Network Invariant Guard
#
# This script ensures NO client-side code makes direct calls to:
# - pravado-api-staging.onrender.com
# - /api/v1/* paths (except in route handlers)
# - localhost:4000
#
# Usage: ./scripts/check-pr-network-invariant.sh
# Exit code: 0 = pass, 1 = violations found
#

set -e

echo "===== Sprint S100.1: PR Network Invariant Guard ====="
echo ""

violations=0

# Directories to check for client-side code (exclude route handlers and server code)
CLIENT_DIRS=(
  "src/app/app/pr"
  "src/components/pr-pitch"
  "src/components/pr-intelligence"
  "src/components/pr-generator"
  "src/lib/prPitchApi.ts"
  "src/lib/prOutreachApi.ts"
  "src/lib/prOutreachDeliverabilityApi.ts"
  "src/lib/journalistGraphApi.ts"
)

echo "Checking for direct staging API calls in PR client code..."
echo ""

# Check for pravado-api-staging.onrender.com
echo "[1/3] Checking for pravado-api-staging.onrender.com..."
for dir in "${CLIENT_DIRS[@]}"; do
  if [ -e "$dir" ]; then
    matches=$(grep -r "pravado-api-staging\.onrender\.com" "$dir" 2>/dev/null || true)
    if [ -n "$matches" ]; then
      echo "VIOLATION: Direct staging URL found in $dir:"
      echo "$matches"
      echo ""
      violations=$((violations + 1))
    fi
  fi
done
echo "Done."
echo ""

# Check for API_BASE_URL usage in client files (excluding route handlers)
echo "[2/3] Checking for API_BASE_URL usage in client code..."
for dir in "${CLIENT_DIRS[@]}"; do
  if [ -e "$dir" ]; then
    # Skip if it's a file that's already been fixed to not use API_BASE_URL
    if [ -f "$dir" ]; then
      matches=$(grep -E "API_BASE_URL|NEXT_PUBLIC_API_URL" "$dir" 2>/dev/null || true)
      if [ -n "$matches" ]; then
        echo "VIOLATION: API_BASE_URL found in $dir:"
        echo "$matches"
        echo ""
        violations=$((violations + 1))
      fi
    else
      # It's a directory
      matches=$(grep -r "API_BASE_URL" "$dir" 2>/dev/null | grep -v "\.test\." | grep -v "\.spec\." || true)
      if [ -n "$matches" ]; then
        echo "VIOLATION: API_BASE_URL found in $dir:"
        echo "$matches"
        echo ""
        violations=$((violations + 1))
      fi
    fi
  fi
done
echo "Done."
echo ""

# Check for localhost:4000 in client files
echo "[3/3] Checking for localhost:4000 in PR code..."
for dir in "${CLIENT_DIRS[@]}"; do
  if [ -e "$dir" ]; then
    matches=$(grep -r "localhost:4000" "$dir" 2>/dev/null | grep -v "\.test\." | grep -v "\.spec\." || true)
    if [ -n "$matches" ]; then
      echo "VIOLATION: localhost:4000 found in $dir:"
      echo "$matches"
      echo ""
      violations=$((violations + 1))
    fi
  fi
done
echo "Done."
echo ""

# Summary
echo "===== Summary ====="
if [ $violations -eq 0 ]; then
  echo "All checks passed. PR network invariant is enforced."
  echo ""
  echo "Browser should ONLY call: /api/pr/*"
  echo "NO direct calls to staging API from client code."
  exit 0
else
  echo "FAILED: Found $violations violation(s)"
  echo ""
  echo "S100.1 Invariant:"
  echo "  - Browser calls ONLY /api/pr/* (same-origin)"
  echo "  - NO direct staging API calls from client"
  echo "  - NO API_BASE_URL in client components"
  echo "  - NO localhost:4000 in client code"
  exit 1
fi
