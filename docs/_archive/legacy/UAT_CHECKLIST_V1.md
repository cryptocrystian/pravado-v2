# Pravado UAT Checklist v1.0

User Acceptance Testing checklist for validating Pravado platform functionality.

---

## Pre-UAT Setup

### Environment Preparation

- [ ] **Migrations applied**: All migrations 0-76 executed successfully
- [ ] **API running**: `pnpm --filter @pravado/api dev` responds at http://localhost:3001
- [ ] **Dashboard running**: `pnpm --filter @pravado/dashboard dev` responds at http://localhost:3000
- [ ] **Demo data seeded**: `pnpm --filter @pravado/api seed:demo` completed
- [ ] **Environment variables**: All required vars in `.env` (see `.env.example`)

### Health Checks

- [ ] `GET /health/live` returns `{"alive":true}`
- [ ] `GET /health/ready` returns `{"ready":true,"version":"..."}`
- [ ] `GET /health/info` returns app info with feature flags
- [ ] No database connection errors in API logs

---

## 1. Authentication & Authorization

### 1.1 Login Flow
- [ ] Login page loads at `/login`
- [ ] Can enter email and password
- [ ] Successful login redirects to dashboard
- [ ] Invalid credentials show error message
- [ ] Session persists on page refresh

### 1.2 Organization Context
- [ ] User is associated with correct organization
- [ ] Organization name displays in header/sidebar
- [ ] Switching orgs (if applicable) updates data context

### 1.3 Role-Based Access
- [ ] Owner role sees all features
- [ ] Member role sees appropriate features
- [ ] Admin-only routes are protected

---

## 2. Core Navigation

### 2.1 Main Navigation
- [ ] Dashboard/Home link works
- [ ] All sidebar menu items load their pages
- [ ] Active page is highlighted in navigation
- [ ] Mobile responsive navigation works

### 2.2 Page Loading
- [ ] Pages load without JavaScript errors
- [ ] Loading states display during data fetch
- [ ] Error states display when API fails
- [ ] Empty states display when no data

---

## 3. PR & Media Intelligence

### 3.1 Media Monitoring
- [ ] Media sources list displays (3 sources in demo)
- [ ] Source details show URL and type
- [ ] Active/inactive toggle works
- [ ] Add new source form functions

### 3.2 Earned Mentions
- [ ] Mentions list displays (3 mentions in demo)
- [ ] Sentiment indicators show (Positive/Neutral/Negative)
- [ ] Reach scores display
- [ ] Published date shows
- [ ] Click opens mention details

### 3.3 Press Releases
- [ ] Releases list displays (2 releases in demo)
- [ ] Status badges show (Published/Draft)
- [ ] Can view release content
- [ ] Can edit draft releases
- [ ] Generate new release (if LLM enabled)

---

## 4. Crisis Management

### 4.1 Crisis Dashboard
- [ ] Incidents list displays (2 incidents in demo)
- [ ] Severity indicators show (High=red, Medium=yellow)
- [ ] Status badges show (Active/Monitoring)
- [ ] Type classification displays

### 4.2 Incident Details
- [ ] Click incident opens detail view
- [ ] Description displays correctly
- [ ] Detection timestamp shows
- [ ] Can update incident status
- [ ] Timeline/activity log displays

### 4.3 Crisis Actions
- [ ] Can create new incident
- [ ] Can assign severity
- [ ] Can update status
- [ ] Can add notes/comments

---

## 5. Scenario Simulations

### 5.1 Scenario List
- [ ] Scenarios display (3 scenarios in demo)
- [ ] Type badges show (Crisis/Competitive/Regulatory)
- [ ] Status indicators show (Completed/Running)
- [ ] Description displays

### 5.2 Scenario Details
- [ ] Click scenario opens detail view
- [ ] Scenario run history displays
- [ ] Run timestamps show
- [ ] Can view run results

### 5.3 Scenario Creation
- [ ] Create new scenario form works
- [ ] Can set name and description
- [ ] Can select scenario type
- [ ] Can trigger simulation run (if LLM enabled)

---

## 6. Scenario Orchestration

### 6.1 Suite List
- [ ] Suites display (2 suites in demo)
- [ ] Status shows (Completed/Running)
- [ ] Suite run history displays

### 6.2 Suite Details
- [ ] Click suite opens detail view
- [ ] Linked scenarios are listed
- [ ] Suite run progress shows
- [ ] Can view aggregated results

### 6.3 Suite Execution
- [ ] Can create new suite
- [ ] Can add scenarios to suite
- [ ] Can trigger suite run
- [ ] Progress updates in real-time

---

## 7. Reality Maps

### 7.1 Map List
- [ ] Maps display (2 maps in demo)
- [ ] Status shows (Completed/Generated)
- [ ] Node/edge counts display
- [ ] Path count displays

### 7.2 Map Visualization
- [ ] Click map opens visualization
- [ ] Root node displays at top/center
- [ ] Child nodes branch correctly
- [ ] Probability labels on nodes
- [ ] Transition labels on edges
- [ ] Can zoom/pan the visualization

### 7.3 Map Details
- [ ] Parameters display (maxDepth, branchingFactor)
- [ ] Can view individual node details
- [ ] Can explore paths through the tree

### 7.4 Map Generation
- [ ] Can create new reality map
- [ ] Can set generation parameters
- [ ] Map generates with nodes/edges
- [ ] Visualization renders after generation

---

## 8. Insight Conflicts

### 8.1 Conflict List
- [ ] Conflicts display (2 conflicts in demo)
- [ ] Type badges show (Contradiction/Divergence)
- [ ] Severity indicators show (High/Medium)
- [ ] Status badges show (Detected/Analyzing)

### 8.2 Conflict Details
- [ ] Click conflict opens detail view
- [ ] Conflict summary displays
- [ ] Source entities listed with systems
- [ ] Affected systems listed
- [ ] Resolution options (if applicable)

### 8.3 Conflict Resolution
- [ ] Can acknowledge conflict
- [ ] Can update status
- [ ] Can add resolution notes
- [ ] Resolved conflicts move to history

---

## 9. Executive Intelligence

### 9.1 Command Center
- [ ] Dashboard loads with aggregated data
- [ ] Overall health score displays
- [ ] Active signals/alerts show
- [ ] Crisis status indicator works
- [ ] Recent activity timeline displays

### 9.2 Unified Narratives
- [ ] Narratives list displays (2 narratives in demo)
- [ ] Type badges show (Quarterly Review/Crisis Response)
- [ ] Status shows (Published/Draft)
- [ ] Format indicates (Comprehensive/Executive)

### 9.3 Narrative Details
- [ ] Click narrative opens detail view
- [ ] Executive summary displays
- [ ] Source systems attribution shows
- [ ] Sections render correctly
- [ ] Can regenerate narrative (if LLM enabled)

### 9.4 Executive Digests
- [ ] Digest list displays (1 digest in demo)
- [ ] Period dates show correctly
- [ ] Key insights list (3 items in demo)
- [ ] Status shows (Published)

### 9.5 Board Reports
- [ ] Reports list displays (1 report in demo)
- [ ] Status shows (Draft)
- [ ] Can view report structure
- [ ] Executive summary aligns with narrative

### 9.6 Strategic Intelligence
- [ ] Reports display (1 report in demo)
- [ ] Period coverage shows (~90 days)
- [ ] Market position insights display
- [ ] Status shows (Published)

---

## 10. Brand Reputation

### 10.1 Reputation Reports
- [ ] Reports display (2 reports in demo)
- [ ] Overall score shows (78-82 range)
- [ ] Report type shows (Weekly/Monthly)
- [ ] Period dates display

### 10.2 Brand Health
- [ ] Health indicators display
- [ ] Score trends visible
- [ ] Time period selector works

---

## 11. Playbooks

### 11.1 Playbook List
- [ ] Playbooks display (3 playbooks in demo)
- [ ] Status shows (Active)
- [ ] Pillar assignment shows (PR/Content/SEO)
- [ ] Description displays

### 11.2 Playbook Details
- [ ] Click playbook opens detail view
- [ ] Steps/actions display
- [ ] Version number shows
- [ ] Run history displays

### 11.3 Playbook Runs
- [ ] Run list shows (1 run per playbook in demo)
- [ ] Status shows (Completed)
- [ ] Start/end timestamps display
- [ ] Can view run details

### 11.4 Playbook Execution
- [ ] Can trigger new playbook run
- [ ] Execution progress displays
- [ ] Step completion updates
- [ ] Run completes successfully

---

## 12. Content Management

### 12.1 Content List
- [ ] Content items display
- [ ] Status badges show
- [ ] Content type shows
- [ ] Publication date displays

### 12.2 Content Creation
- [ ] Create new content form works
- [ ] Can set title and body
- [ ] Can assign pillar/category
- [ ] AI generation works (if enabled)

---

## 13. Settings & Administration

### 13.1 Organization Settings
- [ ] Org settings page loads
- [ ] Can view org details
- [ ] Can update org name (if owner)

### 13.2 User Management
- [ ] User list displays
- [ ] Roles show correctly
- [ ] Can invite new users (if owner)

### 13.3 Billing (if enabled)
- [ ] Billing page loads
- [ ] Current plan shows
- [ ] Usage metrics display

---

## 14. API Validation

### 14.1 Core Endpoints
- [ ] `GET /api/playbooks` returns playbooks
- [ ] `GET /api/crisis` returns incidents
- [ ] `GET /api/scenarios` returns scenarios
- [ ] `GET /api/reality-maps` returns maps
- [ ] `GET /api/conflicts` returns conflicts

### 14.2 Error Handling
- [ ] 401 returned for unauthenticated requests
- [ ] 403 returned for unauthorized access
- [ ] 404 returned for missing resources
- [ ] 400 returned for invalid input

---

## 15. Cross-Cutting Concerns

### 15.1 Data Consistency
- [ ] Org isolation is enforced (no cross-org data leak)
- [ ] Created records appear in lists
- [ ] Updated records reflect changes
- [ ] Deleted records are removed

### 15.2 Performance
- [ ] Pages load within 2 seconds
- [ ] Lists paginate appropriately
- [ ] No memory leaks during navigation
- [ ] API responses are reasonably fast

### 15.3 Error States
- [ ] Network errors show user-friendly message
- [ ] API errors show meaningful feedback
- [ ] Retry options available where appropriate

### 15.4 Responsive Design
- [ ] Desktop layout works (1920px)
- [ ] Tablet layout works (768px)
- [ ] Mobile layout works (375px)

---

## UAT Sign-Off

### Tester Information
- **Tester Name**: ___________________________
- **Date**: ___________________________
- **Environment**: [ ] Local [ ] Staging [ ] Production

### Results Summary
- **Total Checks**: ___
- **Passed**: ___
- **Failed**: ___
- **Blocked**: ___

### Critical Issues Found
1. ___________________________
2. ___________________________
3. ___________________________

### Recommendations
- ___________________________
- ___________________________

### Sign-Off
- [ ] **APPROVED** - Ready for production
- [ ] **CONDITIONAL** - Ready with noted exceptions
- [ ] **REJECTED** - Critical issues must be resolved

**Signature**: ___________________________
**Date**: ___________________________

---

## Related Documentation

- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Golden Path #1: Executive & Narrative](GOLDEN_PATH_EXEC_NARRATIVE.md)
- [Golden Path #2: Crisis & Reality Maps](GOLDEN_PATH_CRISIS_REALITY_CONFLICTS.md)
