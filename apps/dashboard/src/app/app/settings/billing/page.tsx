'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';

const PLANS = [
  { id: 'starter', name: 'Starter', price: 99, users: 1, features: ['Basic SAGE proposals', 'Content editor', 'PR outreach'] },
  { id: 'pro', name: 'Pro', price: 299, users: 3, features: ['Full SAGE + CiteMind', 'Manual CRAFT', '3 team members'] },
  { id: 'growth', name: 'Growth', price: 799, users: 10, features: ['Full stack + Autopilot', '10 team members', 'Priority support'] },
];

interface Subscription {
  plan: string;
  status: string;
  current_period_end: string;
}

interface Usage {
  sage_proposals: { used: number; limit: number };
  citemind_scores: { used: number; limit: number };
}

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/billing/subscription').then(r => r.json()).catch(() => null),
      fetch('/api/billing/usage').then(r => r.json()).catch(() => null),
    ]).then(([sub, use]) => {
      if (sub?.success) setSubscription(sub.data);
      if (use?.success) setUsage(use.data);
      setLoading(false);
    });
  }, []);

  async function handleUpgrade(planId: string) {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // Checkout failed
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // Portal failed
    }
  }

  if (loading) {
    return (
      <div className="pt-6 pb-16 px-8 max-w-3xl mx-auto">
        <h1 className="text-lg font-bold text-white mb-6">Billing</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-2 rounded-xl" />
          <div className="h-48 bg-slate-2 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-16 px-8 max-w-3xl mx-auto">
      <h1 className="text-lg font-bold text-white mb-6">Billing</h1>

      {/* Current Plan */}
      {subscription ? (
        <div className="bg-slate-2 border border-slate-4 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Current Plan</p>
              <p className="text-xl font-bold text-white">{subscription.plan}</p>
              <p className="text-xs text-white/50 mt-1">
                {subscription.status === 'active' ? 'Active' : subscription.status} — renews {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleManageBilling}
              className="px-4 py-2 text-sm font-medium text-white/70 border border-white/10 rounded-lg hover:text-white hover:border-white/20 transition-colors"
            >
              Manage Billing
            </button>
          </div>

          {usage && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-4">
              <div>
                <p className="text-xs text-white/40 mb-1">SAGE Proposals</p>
                <p className="text-sm text-white/80">{usage.sage_proposals.used} / {usage.sage_proposals.limit}</p>
                <div className="h-1 bg-slate-4 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-brand-iris rounded-full" style={{ width: `${Math.min((usage.sage_proposals.used / usage.sage_proposals.limit) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">CiteMind Scores</p>
                <p className="text-sm text-white/80">{usage.citemind_scores.used} / {usage.citemind_scores.limit}</p>
                <div className="h-1 bg-slate-4 rounded-full mt-1.5 overflow-hidden">
                  <div className="h-full bg-brand-cyan rounded-full" style={{ width: `${Math.min((usage.citemind_scores.used / usage.citemind_scores.limit) * 100, 100)}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6">
          <p className="text-sm text-white/50 mb-4">Choose a plan to get started</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map(plan => (
              <div key={plan.id} className="bg-slate-2 border border-slate-4 rounded-xl p-5">
                <p className="text-lg font-bold text-white mb-1">{plan.name}</p>
                <p className="text-2xl font-bold text-white mb-1">${plan.price}<span className="text-sm text-white/40 font-normal">/mo</span></p>
                <p className="text-xs text-white/40 mb-4">{plan.users} user{plan.users > 1 ? 's' : ''}</p>
                <ul className="space-y-1.5 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="text-xs text-white/60 flex items-center gap-2">
                      <span className="text-semantic-success">&#10003;</span> {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  className="w-full py-2 text-sm font-semibold text-white bg-brand-iris rounded-lg hover:bg-brand-iris/90 transition-colors"
                >
                  Upgrade
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
