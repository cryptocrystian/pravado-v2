#!/bin/bash
# S99 PR Pillar Staging Verification Script
# Run this to verify the PR pillar API endpoints are working

API_BASE="https://pravado-api-staging.onrender.com"

echo "=========================================="
echo "S99 PR Pillar Staging Verification"
echo "=========================================="
echo ""

# Test 1: Health check
echo "Test 1: API Health Check"
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/health")
if [ "$HEALTH" = "200" ]; then
  echo "  ✅ PASS: API is responding ($HEALTH)"
else
  echo "  ❌ FAIL: API health check failed ($HEALTH)"
fi
echo ""

# Test 2: Journalist Graph endpoint (without auth - should return 401)
echo "Test 2: Journalist Graph (no auth - expect 401)"
JG_NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/v1/journalist-graph/profiles?limit=10")
if [ "$JG_NOAUTH" = "401" ]; then
  echo "  ✅ PASS: Endpoint requires auth ($JG_NOAUTH)"
else
  echo "  ⚠️  INFO: Unexpected status ($JG_NOAUTH)"
fi
echo ""

# Test 3: PR Releases endpoint (without auth - should return 401)
echo "Test 3: PR Releases (no auth - expect 401)"
PR_NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/v1/pr/releases?limit=1")
if [ "$PR_NOAUTH" = "401" ]; then
  echo "  ✅ PASS: Endpoint requires auth ($PR_NOAUTH)"
else
  echo "  ⚠️  INFO: Unexpected status ($PR_NOAUTH)"
fi
echo ""

# Test 4: PR Outreach Sequences (without auth - should return 401)
echo "Test 4: PR Outreach Sequences (no auth - expect 401)"
SEQ_NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE/api/v1/pr-outreach/sequences?limit=10")
if [ "$SEQ_NOAUTH" = "401" ]; then
  echo "  ✅ PASS: Endpoint requires auth ($SEQ_NOAUTH)"
else
  echo "  ⚠️  INFO: Unexpected status ($SEQ_NOAUTH)"
fi
echo ""

echo "=========================================="
echo "To test WITH authentication:"
echo "=========================================="
echo ""
echo "1. Log into the dashboard in Chrome"
echo "2. Open DevTools > Application > Cookies"
echo "3. Find 'sb-access-token' or similar Supabase token"
echo "4. Run:"
echo ""
echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "        '$API_BASE/api/v1/journalist-graph/profiles?limit=10'"
echo ""
echo "Expected: 200 with JSON data"
echo ""
echo "=========================================="
echo "Dashboard URL Verification:"
echo "=========================================="
echo ""
echo "Check these in browser with DevTools Network tab:"
echo "  1. https://pravado-dashboard.vercel.app/app/pr/journalists"
echo "  2. https://pravado-dashboard.vercel.app/app/pr"
echo "  3. https://pravado-dashboard.vercel.app/app/pr/generator"
echo ""
echo "Verify: No requests to localhost:4000"
echo "Verify: All API calls go to $API_BASE"
echo "Verify: Authorization header present on all requests"
