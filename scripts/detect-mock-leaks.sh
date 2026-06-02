#!/usr/bin/env bash
# Phase 0 Track 0B — Mock-leak detector
#
# Run on every PR. Any match in production dashboard code fails the build.
# Allowlist additions REQUIRE an architect-approved DECISIONS_LOG entry plus
# an inline issue-# reference in the comment above the new allowlist line.
#
# Spec: docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0B-MOCK-CONTAINMENT.md §6
set -e

PATTERNS=(
  "mockJournalists"
  "mockSageJournalists"
  "mockActions"
  "mockCriticalHigh"
  "MOCK_ENTITY_NODES"
  "MOCK_ENTITY_EDGES"
  "mockNarratives"
  "mockEVITrend"
  "mockPillarDeltas"
  "mockCompetitivePosition"
  "mockBrandVoice"
  "kbCategories"
  "mockTopicActivity"
  "mockRecommendations"
  "mockDocuments"
  "mockTemplates"
  "mockCoverage"
  "mockPitches"
  "mockReportTemplates"
  "mockAnalyticsContent"
  "mockAnalyticsPR"
  "mockAnalyticsSEO"
  # Discovered during 0B implementation (caught by exhaustive grep):
  "mockBriefs"
)

# Orphan consumer allowlist
# -------------------------
# These component files import mock data but are consumed exclusively by
# Phase 0 *_WIRED-gated parent pages, so they are dead code in Phase 0.
# Phase 1 rebuilds each against real data and the entry is removed.
# Tracked by: cryptocrystian/pravado-v2 issue #10.
ORPHAN_CONSUMERS=(
  "components/pr/PitchWizard\.tsx"
  "components/analytics/reports/ExecutiveSummaryReport\.tsx"
  "components/analytics/reports/BoardInvestorUpdate\.tsx"
  "components/analytics/CoverageTimeline\.tsx"
  "components/analytics/CompetitiveSnapshot\.tsx"
  "components/settings/BrandVoiceWizard\.tsx"
  "components/content/TemplateLibrary\.tsx"
  # Exported but unused at the time of Track 0B; covered by the same Phase 1
  # rebuild issue. Delete-or-rebuild decision made by issue #10's owner.
  "components/content/NewDocumentDropdown\.tsx"
)
ORPHAN_REGEX=$(IFS='|'; echo "${ORPHAN_CONSUMERS[*]}")

FOUND=0
for pattern in "${PATTERNS[@]}"; do
  matches=$(grep -rn "$pattern" apps/dashboard/src --include="*.tsx" --include="*.ts" --exclude-dir=node_modules 2>/dev/null || true)
  # Allow matches in tests / stories / mock-data files. The canonical
  # *-mock-data.ts files are exempt per the Feb 26 PR_WIRING_SPRINT_BRIEF
  # (mockSageJournalists is still used by the SAGE journalists tab); Phase 1
  # removes those exemptions surface-by-surface.
  prod_matches=$(echo "$matches" \
    | grep -v "__tests__\|\.test\.\|\.stories\.\|/mocks/\|pr-mock-data\.ts\|seo-mock-data\.ts\|analytics-mock-data\.ts\|content-mock-data\.ts\|editor-mock-data\.ts" \
    || true)
  # Strip orphan-consumer matches (issue #10).
  prod_matches=$(echo "$prod_matches" | grep -Ev "$ORPHAN_REGEX" || true)
  # Strip comment-only matches: the line format is "path:line:content"; the
  # match is a comment if `content` (after the second ':') begins with " *",
  # "*", "//", or "/*" (leading whitespace allowed). Code-with-trailing-
  # comment lines still match — that's intentional.
  prod_matches=$(echo "$prod_matches" \
    | awk -F: 'NF>=3 {body=substr($0, index($0,$3)); sub(/^[[:space:]]+/, "", body); if (body !~ /^(\*|\/\/|\/\*)/) print}' \
    || true)
  if [ -n "$prod_matches" ]; then
    echo "FAIL: '$pattern' found in production code:"
    echo "$prod_matches"
    echo ""
    FOUND=1
  fi
done

# Page-level files must not import from pr-mock-data.ts directly. The SAGE
# journalists tab is the only exempt consumer per the Feb brief, and it's
# fully gated in Phase 0 (PR_JOURNALISTS_WIRED).
import_matches=$(grep -rn "from '@/components/pr/pr-mock-data'" apps/dashboard/src/app --include="*.tsx" 2>/dev/null || true)
sage_only=$(echo "$import_matches" | grep -v "journalists/page\.tsx" 2>/dev/null || true)
if [ -n "$sage_only" ]; then
  echo "FAIL: non-SAGE page imports pr-mock-data.ts:"
  echo "$sage_only"
  FOUND=1
fi

if [ "$FOUND" -eq 1 ]; then
  echo ""
  echo "Mock data leak detected. Remove the constant or move it to a test file."
  echo "Phase 0 Track 0B reversed the 'fallback to sample data' decision from"
  echo "PR_WIRING_SPRINT_BRIEF.md Task 5; see docs/canon/DECISIONS_LOG.md."
  exit 1
fi

echo "OK: no mock leaks in production code."
