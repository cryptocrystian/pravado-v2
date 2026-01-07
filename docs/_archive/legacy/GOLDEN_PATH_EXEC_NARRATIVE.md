# Golden Path #1: Executive & Unified Narrative Intelligence

This guide walks through the **Executive Intelligence to Unified Narrative** flow using the demo organization data.

---

## Prerequisites

1. **Migrations applied**: All migrations 0-76 are applied to your Supabase database.
2. **Environment configured**: `.env` file is set up per `DEPLOYMENT_GUIDE.md`.
3. **Demo data seeded**: Run the seed script:
   ```bash
   pnpm --filter @pravado/api seed:demo
   ```
4. **Services running**:
   - API: `pnpm --filter @pravado/api dev` (http://localhost:3001)
   - Dashboard: `pnpm --filter @pravado/dashboard dev` (http://localhost:3000)

---

## Flow Overview

```
Media & PR Intelligence → Executive Command Center → Unified Narratives
                                      ↓
              Executive Digests ← Board Reports
```

This flow demonstrates how Pravado synthesizes information from multiple sources into executive-ready documents.

---

## Step 1: Log In as Demo Executive

1. Open the dashboard: http://localhost:3000
2. **Login credentials**:
   - Email: `demo-exec@demo.local`
   - Password: (use your Supabase auth setup or bypass for local dev)
3. You should land on the main dashboard.

**What to verify:**
- Dashboard loads without errors
- Organization shows as "Pravado Demo Org"

---

## Step 2: Explore Media & PR Intelligence

### 2.1 Media Monitoring

1. Navigate to **PR & Media** → **Media Monitoring**
2. You should see:
   - **3 media sources**: TechCrunch, Reuters, Industry Blog
   - **3 earned mentions** with varying sentiment:
     - "Company X Launches Revolutionary AI Platform" (Positive, Reach: 85)
     - "Market Analysis: Emerging Players in AI Space" (Neutral, Reach: 72)
     - "Industry Challenges Ahead for 2025" (Negative, Reach: 45)

**What to verify:**
- Media sources are listed
- Earned mentions show sentiment indicators (green/yellow/red)
- Reach scores are displayed

### 2.2 Press Releases

1. Navigate to **PR & Media** → **Press Releases** (or **Generator**)
2. You should see:
   - "Q4 2024 Earnings Announcement" (Published)
   - "New Product Launch: AI Assistant Pro" (Draft)

**What to verify:**
- Press releases load
- Status badges show correctly (Published vs Draft)

---

## Step 3: Executive Command Center

1. Navigate to **Exec** → **Command Center** (or **Dashboard**)
2. The command center aggregates intelligence from all systems.

**What to see:**
- **Overall Health Score**: Derived from reputation reports (~80)
- **Active Signals**: Media mentions and alerts
- **Crisis Status**: Active incidents (Data Breach Alert)
- **Recent Activity**: Timeline of system events

**Key metrics to observe:**
- Reputation score from Brand Health (78-82 range)
- Any active crisis incidents highlighted
- Media sentiment distribution

**What to verify:**
- KPIs/metrics are non-empty
- No "No data" placeholders in critical sections
- Charts render with the seeded data

---

## Step 4: Unified Narratives

This is the core intelligence synthesis feature.

1. Navigate to **Exec** → **Unified Narratives** (or **Intelligence** → **Narratives**)
2. You should see two narratives:

### Narrative A: "Q4 2024 Company Performance Narrative"
- **Type**: Quarterly Review
- **Status**: Published
- **Format**: Comprehensive

Click to open and observe:
- **Executive Summary**: "Company demonstrated resilient performance in Q4..."
- **Source Systems**: PR, Crisis, Reputation, Strategy icons/badges
- **Sections**: Multiple sections pulling from different domains

### Narrative B: "Crisis Response Narrative - Security Incident"
- **Type**: Crisis Response
- **Status**: Draft
- **Format**: Executive

This narrative is specifically tied to the security incident.

**What to verify:**
- Both narratives appear in the list
- Clicking a narrative shows its sections
- Source system attribution is visible
- Executive summary reflects synthesized intelligence

---

## Step 5: Executive Digests

1. Navigate to **Exec** → **Digests**
2. You should see:
   - "Weekly Executive Digest - Week 48"

Click to view:
- **Key Insights** (3 items):
  1. Revenue up 12% YoY
  2. New market expansion on track
  3. Crisis contained
- **Period**: Last 7 days
- **Status**: Published

**What to verify:**
- Digest loads with key insights
- Period dates are correct
- Same narrative thread as Unified Narratives

---

## Step 6: Board Reports

1. Navigate to **Exec** → **Board Reports**
2. You should see:
   - "Board Report - Q4 2024" (Draft)

This represents the quarterly board-ready package.

**What to verify:**
- Report appears with correct status
- Executive summary aligns with the Q4 narrative
- Can view/edit the report structure

---

## Step 7: Strategic Intelligence Reports

1. Navigate to **Exec** → **Strategic Intelligence** (or **Strategy**)
2. You should see:
   - "Strategic Intelligence Brief - Q4 2024"

This is the CEO-level strategic view.

**What to verify:**
- Report shows market position insights
- Period covers ~90 days
- Status is Published

---

## Narrative Thread Validation

The demo data tells a coherent story:

| System | Data Point | Story Element |
|--------|-----------|---------------|
| Media | Positive TechCrunch mention | Product launch success |
| Media | Negative blog post | Industry challenges awareness |
| Crisis | Security incident (active) | Ongoing risk management |
| Reputation | Score 78-82 | Generally healthy brand |
| Narrative | Q4 Performance | Synthesizes all above |
| Digest | Week 48 | Actionable summary |
| Board Report | Q4 Draft | Board-ready presentation |

---

## Regeneration Test (Optional)

To verify AI regeneration works:

1. Open "Q4 2024 Company Performance Narrative"
2. Click **Regenerate** (or equivalent action)
3. Observe:
   - Loading state appears
   - New content is generated (if LLM is configured)
   - Or stub response if LLM_PROVIDER=stub

---

## Success Criteria

- [ ] All pages load without errors
- [ ] Demo data is visible in each section
- [ ] Narratives show multi-source attribution
- [ ] Digest and Board Report reference same period
- [ ] No console errors in browser dev tools

---

## Troubleshooting

**No data showing:**
- Verify seed script ran successfully
- Check API logs for database errors
- Confirm org_id matches in the database

**Auth issues:**
- For local dev, consider using Supabase Auth bypass
- Ensure user is linked to demo-org

**API errors:**
- Check health endpoints: `curl http://localhost:3001/health/ready`
- Verify Supabase credentials in `.env`

---

## Next Steps

After completing this flow:
1. Proceed to **Golden Path #2**: Crisis → Reality Maps → Conflicts
2. Complete the **UAT Checklist** in `docs/UAT_CHECKLIST_V1.md`
