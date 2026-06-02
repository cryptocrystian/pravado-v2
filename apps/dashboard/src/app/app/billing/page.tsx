/**
 * Billing Self-Service Portal
 *
 * Phase 0 Track 0C item 5: hidden in Phase 0.
 *
 * The Sprint S33.2 implementation rendered `NaN` for every usage stat in
 * production because the usage telemetry pipeline isn't wired. Shipping NaN
 * fields to real users is worse than no surface at all. The Billing nav
 * entry has been removed from CommandCenterTopbar; this route file persists
 * so deep links don't 404, but it renders a Phase 0 placeholder.
 *
 * Phase 1 Workstream 6 brings Billing back with real Stripe + Supabase
 * usage data.
 *
 * The original component, its sibling pages (history/, invoice/), and
 * the `components/` subdirectory are left in place so Phase 1 can flip
 * them back on without re-implementing.
 */

'use client';

export const dynamic = 'force-dynamic';

export default function BillingPage() {
  return (
    <div className="p-8 text-center max-w-md mx-auto">
      <h1 className="text-2xl font-semibold text-white mb-3">Billing</h1>
      <p className="text-white/60 leading-relaxed">
        Billing is coming soon. Contact{' '}
        <a
          href="mailto:support@pravado.io"
          className="text-brand-cyan hover:underline"
        >
          support@pravado.io
        </a>{' '}
        with questions about your subscription.
      </p>
    </div>
  );
}
