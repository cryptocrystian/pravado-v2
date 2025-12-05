# Billing Self-Service UI v1 (Sprint S33.2)

**Status**: ✅ Implemented
**Sprint**: S33.2
**Dependencies**: Sprint S33 (Backend), Sprint S32 (Alerts), Sprint S28 (Billing Foundation)
**Location**: `/app/billing`

## Overview

The Billing Self-Service UI provides organizations with complete control over their subscription, plan selection, and usage monitoring through an intuitive web interface. This frontend implementation builds on the Sprint S33 backend APIs to deliver a seamless self-service experience.

## Architecture

### Frontend Components

#### Core Page Component
- **Location**: `apps/dashboard/src/app/app/billing/page.tsx`
- **Type**: Next.js Client Component
- **State Management**: React hooks (useState, useEffect)
- **Data Loading**: Parallel API fetches on mount

#### UI Components Library

**Location**: `apps/dashboard/src/app/app/billing/components/`

1. **UsageBar.tsx** - Color-coded progress bar
   - Props: label, used, limit, unit, overage
   - Color thresholds: Green (<70%), Yellow (70-99%), Red (≥100%)
   - Displays percentage and absolute numbers

2. **PlanRecommendationBadge.tsx** - AI recommendation indicator
   - Shows recommended plan from backend algorithm
   - Lightning bolt icon for visual prominence

3. **TrialBanner.tsx** - Trial expiration warning
   - Conditional rendering based on trialDaysRemaining
   - Urgent styling for ≤3 days remaining
   - "Upgrade Now" CTA scrolls to plan selection

4. **OverageBreakdown.tsx** - Detailed cost breakdown
   - Itemizes overage costs by resource type
   - Shows unit prices and calculations
   - "No overages" state for zero costs

5. **StripePortalButton.tsx** - Payment method management
   - Opens Stripe Customer Portal
   - Loading states during redirect
   - Variant support (primary/secondary)

6. **BillingPlanCard.tsx** - Individual plan display
   - Shows pricing, limits, features
   - Upgrade/Downgrade/Contact Sales buttons
   - Current plan highlighting
   - Downgrade guardrail warnings

7. **CancelSubscriptionModal.tsx** - Cancellation confirmation
   - Two-option selection: immediate vs. end-of-period
   - Warning messages with renewal date
   - Confirm/Cancel actions

8. **DowngradeBlockedDialog.tsx** - Usage guardrail enforcement
   - Triggered by 422_UPGRADE_REQUIRED error
   - Shows which resources exceed limits
   - Provides actionable suggestions

### API Integration Layer

**Location**: `apps/dashboard/src/lib/billingApi.ts`

#### Type Definitions
```typescript
BillingPlan
OrgBillingSummaryEnriched
BillingAlertRecord
ApiResponse<T>
```

#### API Methods
- `getBillingSummaryEnriched()` - Fetches enriched summary with S33 fields
- `getAvailablePlans()` - Lists all active billing plans
- `getPlanDetails(slug)` - Gets specific plan details
- `switchPlan(slug)` - Downgrades to target plan (with guardrails)
- `cancelSubscription(immediate)` - Cancels subscription
- `resumeSubscription()` - Resumes cancelled subscription
- `createCheckoutSession(slug)` - Creates Stripe checkout for upgrades
- `openPaymentPortal()` - Opens Stripe Customer Portal
- `getUsageAlerts()` - Fetches S32 alerts
- `acknowledgeAlert(id)` - Dismisses alert

#### Helper Functions
- `canDowngradeToPlan()` - Client-side guardrail check
- `calculateUsagePercentage()` - Determines color coding
- `formatCurrency()` - Formats cents to $X.XX
- `getAlertSeverityColor()` - Maps severity to color

## User Flows

### 1. View Current Plan & Usage
**Entry**: Navigate to `/app/billing`

**Steps**:
1. Page loads billing summary, plans, and alerts in parallel
2. Displays current plan card with:
   - Plan name and price
   - Billing status badge (ACTIVE, TRIAL, PAST_DUE, CANCELED)
   - Next billing date or trial end date
   - Cancel/Resume button
   - "Manage Payment Method" button
3. Shows usage progress bars for:
   - Tokens (with overage if applicable)
   - Playbook runs (with overage if applicable)
   - Seats (with overage if applicable)
4. Displays recommended plan badge if usage suggests upgrade
5. Shows projected monthly cost including overages

**Error Handling**:
- Loading spinner during data fetch
- Error banner if API fails
- Graceful degradation if partial data missing

### 2. Upgrade Plan
**Entry**: Click "Upgrade" button on higher-tier plan card

**Steps**:
1. User clicks "Upgrade" on Growth or Enterprise plan
2. For Enterprise: Shows alert "Contact sales at sales@pravado.com"
3. For other plans:
   - Calls `createCheckoutSession(planSlug)`
   - Receives Stripe checkout URL
   - Redirects browser to Stripe checkout
4. User completes payment on Stripe
5. Stripe webhook updates org plan (backend)
6. User returns to app, sees new plan active

**Error Handling**:
- Alert if checkout session creation fails
- Button loading state prevents double-clicks

### 3. Downgrade Plan (Success)
**Entry**: Click "Downgrade" button on lower-tier plan card

**Pre-condition**: Current usage is within target plan limits

**Steps**:
1. User clicks "Downgrade" on Internal Dev or Starter plan
2. Client checks `canDowngradeToPlan()` - shows warning if blocked
3. Calls `switchPlan(targetSlug)`
4. Backend validates guardrails, allows switch
5. Returns success response
6. Page reloads billing data
7. Shows new plan as active
8. Usage bars update to reflect new limits

**Error Handling**:
- Generic error alert if non-422 error occurs

### 4. Downgrade Plan (Blocked by Guardrails)
**Entry**: Click "Downgrade" button on lower-tier plan card

**Pre-condition**: Current usage exceeds target plan limits

**Steps**:
1. User clicks "Downgrade"
2. Client may show yellow warning badge preemptively
3. Calls `switchPlan(targetSlug)`
4. Backend returns 422_UPGRADE_REQUIRED error:
   ```json
   {
     "success": false,
     "error": {
       "code": "422_UPGRADE_REQUIRED",
       "message": "Your usage exceeds the limits of the selected plan"
     }
   }
   ```
5. Client displays DowngradeBlockedDialog with:
   - Error icon and "Cannot Downgrade Plan" title
   - Usage breakdown showing exceeded limits:
     - "Tokens: 1,200,000 / 100,000 (1100% over)"
   - Suggestions:
     - "Reduce token usage or wait for billing period to reset"
     - "Remove team members to reduce active seats"
   - Close button
6. User must take corrective action before downgrade allowed

**Resolution Paths**:
- Wait for billing period reset (automatic)
- Remove team members (for seat overages)
- Process fewer playbook runs (for run overages)
- Contact support for assistance

### 5. Cancel Subscription
**Entry**: Click "Cancel Subscription" button on current plan card

**Steps**:
1. User clicks "Cancel Subscription"
2. CancelSubscriptionModal appears with:
   - Warning banner about losing access
   - Radio options:
     - **Cancel at period end** (default): Keep access until renewal date
     - **Cancel immediately**: Lose access right away (no refunds)
   - "Keep Subscription" (cancel action)
   - "Confirm Cancel" (proceed with cancellation)
3. User selects option and clicks "Confirm Cancel"
4. Calls `cancelSubscription(immediate: boolean)`
5. Backend updates subscription status
6. Returns success
7. Page reloads, shows status as "CANCELED"
8. "Cancel" button replaced with "Resume Subscription" button

**Error Handling**:
- Alert if cancellation fails
- Modal stays open on error

### 6. Resume Subscription
**Entry**: Click "Resume Subscription" button (only visible if cancelled)

**Steps**:
1. User clicks "Resume Subscription"
2. Calls `resumeSubscription()`
3. Backend reactivates subscription
4. Returns success
5. Page reloads, shows status as "ACTIVE"
6. "Resume" button replaced with "Cancel" button

**Note**: This is a stub implementation in S33.2. Full Stripe integration for resume coming in future sprint.

### 7. Manage Payment Method
**Entry**: Click "Manage Payment Method" button

**Steps**:
1. User clicks button
2. Calls `openPaymentPortal()`
3. Backend creates Stripe Customer Portal session
4. Returns portal URL
5. Browser redirects to Stripe Customer Portal
6. User updates payment method on Stripe
7. Returns to app via Stripe return URL

**Error Handling**:
- Alert if portal creation fails
- Button shows loading state during API call

### 8. View and Dismiss Usage Alerts
**Entry**: Alerts appear automatically if thresholds crossed (S32)

**Steps**:
1. Page loads and fetches `getUsageAlerts()`
2. If alerts exist, displays "Usage Alerts" panel above plan card
3. Each alert shows:
   - Color-coded background (high=red, medium=yellow, low=blue)
   - Alert message: "Token usage at 90%"
   - Creation date
   - "Dismiss" button (if not already acknowledged)
4. User clicks "Dismiss"
5. Calls `acknowledgeAlert(alertId)`
6. Backend marks alert as acknowledged
7. Alert removed from UI immediately

**Alert Severity Styling**:
- **High**: `bg-red-50 border-red-200 text-red-800`
- **Medium**: `bg-yellow-50 border-yellow-200 text-yellow-800`
- **Low**: `bg-blue-50 border-blue-200 text-blue-800`

### 9. Trial Experience
**Entry**: User on trial plan (trialDaysRemaining > 0)

**Display Behavior**:
1. Trial banner appears at top of page
2. Banner styling:
   - **Urgent** (≤3 days): Red background with red button
   - **Normal** (>3 days): Yellow background with yellow button
3. Banner text: "Your trial ends in X days"
4. "Upgrade Now" button scrolls to plan selection grid
5. Current plan card shows "TRIAL" status badge
6. Next billing date shows as trial end date

**After Trial Expires** (handled by backend):
- Status changes to "past_due" or moves to free plan
- Trial banner disappears
- User prompted to select paid plan

## UI/UX Specifications

### Color Coding for Usage

**Usage Percentage Thresholds**:
- **Green** (<70%): `bg-green-500`, `text-green-700`
- **Yellow** (70-99%): `bg-yellow-500`, `text-yellow-700`
- **Red** (≥100% or any overage): `bg-red-500`, `text-red-700`

**Implementation**:
```typescript
const percentage = (used / limit) * 100;
let color = 'green';
if (percentage >= 100 || overage > 0) color = 'red';
else if (percentage >= 70) color = 'yellow';
```

### Responsive Design

**Grid Layouts**:
- Plan cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Adapts from vertical stack on mobile to 4-column grid on desktop

**Component Styling**:
- All components use Tailwind CSS utility classes
- Consistent padding: `p-6` for cards, `p-4` for smaller sections
- Rounded corners: `rounded-lg` for cards, `rounded-md` for buttons

### Loading & Error States

**Loading**:
```tsx
<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
<p className="mt-4 text-gray-600">Loading billing information...</p>
```

**Error**:
```tsx
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
  {error || 'Failed to load billing information'}
</div>
```

**Empty States**:
- Overage breakdown: "No overages this period" in green badge
- Alerts: Panel hidden if no alerts exist

## Error Handling

### API Error Responses

**Format**:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

**Error Codes**:
- `422_UPGRADE_REQUIRED`: Downgrade blocked by usage guardrails
- `403_FORBIDDEN`: User lacks permission
- `404_NOT_FOUND`: Resource not found
- `500_INTERNAL_ERROR`: Server error

**Handling Strategy**:
1. Check `result.success` boolean
2. If false, check `result.error.code`
3. Handle special cases (e.g., 422 → show dialog)
4. Default: Show `result.error.message` in alert

### Network Failures

**Retry Logic**: None (rely on user refresh)

**User Feedback**:
- Show generic error banner at top of page
- Provide "Reload" suggestion

**Example**:
```tsx
if (error) {
  return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error || 'Failed to load billing information'}
      </div>
    </div>
  );
}
```

## Security Considerations

### Authentication
- All billing routes require authentication
- Enforced by middleware at `/app/*` level
- Unauthenticated users redirected to `/login`

### Authorization
- Org-level permissions checked by backend
- Frontend assumes user has billing access if on page
- Backend validates org membership on all API calls

### Data Privacy
- Sensitive data (Stripe customer IDs) never exposed to frontend
- Only display-safe fields sent to client
- Payment details managed exclusively in Stripe Customer Portal

### XSS Prevention
- All user inputs sanitized by React's built-in escaping
- No `dangerouslySetInnerHTML` used
- API responses validated before rendering

## Performance Optimizations

### Parallel Data Loading
```typescript
const [summaryData, plansData, alertsData] = await Promise.all([
  getBillingSummaryEnriched(),
  getAvailablePlans(),
  getUsageAlerts()
]);
```
Reduces initial load time by ~66% vs. sequential fetches.

### Conditional Rendering
- Components render only if data exists
- Trial banner: `{trialDaysRemaining > 0 && <TrialBanner />}`
- Overage breakdown: `{overages.estimatedCost > 0 && <OverageBreakdown />}`
- Alerts panel: `{alerts.length > 0 && <AlertsPanel />}`

### Lazy Loading
- Not implemented in S33.2
- Future consideration: Code-split modal components

## Testing

### E2E Tests (Playwright)

**Location**: `apps/dashboard/tests/billing/billing-page.spec.ts`

**Test Scenarios**:
1. ✅ Display billing page with current plan
2. ✅ Display usage progress bars
3. ✅ Display available plans grid
4. ✅ Show cancel subscription modal
5. ✅ Handle downgrade with usage guardrails
6. ✅ Show trial banner when in trial
7. ✅ Display alerts panel when alerts exist
8. ✅ Show Enterprise contact sales button
9. ✅ Show billing history CTA
10. ✅ Display overage breakdown when overages exist

**Mocking Strategy**:
- All API endpoints mocked with `page.route()`
- Test data matches production schema
- Different mocks per test scenario (trial, overages, alerts)

**Run Tests**:
```bash
pnpm playwright test apps/dashboard/tests/billing/
```

### Manual Testing Checklist

**Pre-requisites**:
- [ ] Backend S33 APIs deployed
- [ ] Stripe test mode configured
- [ ] Test org with various usage levels

**Test Cases**:
1. [ ] View billing page with active subscription
2. [ ] View billing page during trial period
3. [ ] View billing page with cancelled subscription
4. [ ] View billing page with overages
5. [ ] Attempt downgrade within limits (success)
6. [ ] Attempt downgrade exceeding limits (blocked)
7. [ ] Upgrade to higher plan (Stripe redirect)
8. [ ] Cancel subscription at period end
9. [ ] Cancel subscription immediately
10. [ ] Resume cancelled subscription
11. [ ] Open Stripe Customer Portal
12. [ ] Dismiss usage alerts
13. [ ] View page with recommended plan badge
14. [ ] View page on mobile device (responsive)

## Future Enhancements

### Sprint S34: Billing History
- Invoice list view
- PDF invoice downloads
- Payment history timeline

### Sprint S35: Advanced Features
- Plan comparison tool
- Usage forecasting charts
- Custom plan requests

### Technical Debt
1. **Resume Subscription**: Currently stub implementation, needs full Stripe integration
2. **Seat Overage Pricing**: Not defined in current plan schema
3. **Error Boundary**: Add React error boundary for component failures
4. **Optimistic Updates**: Update UI before API confirmation for snappier feel
5. **Unit Tests**: Add Jest/Vitest tests for individual components
6. **Accessibility**: Add ARIA labels and keyboard navigation

## Deployment

### Build Command
```bash
pnpm build --filter @pravado/dashboard
```

### Environment Variables
None required (inherits from existing Next.js config).

### Rollout Strategy
1. Deploy backend S33 APIs first
2. Deploy frontend with feature flag (optional)
3. Monitor error rates and user feedback
4. Full rollout after 48 hours

### Rollback Plan
- Revert to previous Next.js build
- No database migrations to rollback
- User data remains intact

## Monitoring & Analytics

### Key Metrics
- **Page Load Time**: Target <2s
- **API Error Rate**: Target <1%
- **Upgrade Conversion**: Track clicks on upgrade buttons
- **Downgrade Blocks**: Track 422 errors (usage guardrails working)
- **Cancellation Rate**: Track cancel vs. keep actions

### Logging
- API errors logged to console (visible in browser DevTools)
- Downgrade blocks logged for analysis
- Modal interactions logged for UX insights

### Alerts
- Frontend: None (client-side only)
- Backend: Existing S33 monitoring for API health

## Support & Troubleshooting

### Common Issues

**Issue**: "Failed to load billing information"
- **Cause**: Backend API down or authentication expired
- **Resolution**: Check backend health, re-authenticate user

**Issue**: Downgrade button disabled with warning
- **Cause**: Usage exceeds target plan limits
- **Resolution**: Expected behavior, user must reduce usage first

**Issue**: Stripe redirect fails
- **Cause**: Stripe checkout session creation failed
- **Resolution**: Check Stripe API keys, retry after 1 minute

**Issue**: Payment portal button does nothing
- **Cause**: Missing Stripe customer ID
- **Resolution**: User must complete initial checkout to create Stripe customer

### Debug Mode
Enable React DevTools in browser to inspect component state and props.

### Customer Support Runbook
1. Verify user's current plan in database
2. Check usage thresholds via S33 backend APIs
3. Review Stripe dashboard for payment issues
4. Guide user through browser refresh if stale data
5. Escalate to engineering if persistent errors

## Conclusion

The Billing Self-Service UI delivers a complete, user-friendly interface for subscription management, building on the robust S33 backend. With comprehensive error handling, usage guardrails, and seamless Stripe integration, organizations can confidently manage their plans without requiring support intervention.

**Next Steps**: Deploy to production, monitor adoption, gather user feedback for S34 enhancements.
