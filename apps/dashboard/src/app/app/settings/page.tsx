/**
 * Settings Page
 * Organization and account settings
 */

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

type SettingsTab = 'account' | 'organization' | 'integrations' | 'notifications';

function GSCIntegrationCard() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'disconnected'>('loading');
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetch('/api/integrations/gsc/status')
      .then(r => r.json())
      .then(data => setStatus(data.connected ? 'connected' : 'disconnected'))
      .catch(() => setStatus('disconnected'));
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/integrations/gsc/auth-url');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/integrations/gsc/disconnect', { method: 'DELETE' });
    setStatus('disconnected');
  };

  return (
    <div className="p-4 rounded-lg bg-slate-3/30 border border-border-subtle">
      <div className="flex items-center gap-3 mb-1">
        <svg className="w-5 h-5 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <div className="font-medium text-white">Google Search Console</div>
      </div>
      <div className="text-sm text-slate-11 mb-3">Import keyword data and search performance</div>
      {status === 'loading' ? (
        <span className="px-3 py-1.5 text-xs font-medium text-slate-10">Checking...</span>
      ) : status === 'connected' ? (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-semantic-success bg-semantic-success/10 border border-semantic-success/20 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
            Connected
          </span>
          <button
            onClick={handleDisconnect}
            className="px-3 py-1.5 text-xs font-medium text-white/40 hover:text-white/70 transition-colors"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={handleConnect}
          disabled={connecting}
          className="px-3 py-1.5 text-xs font-medium text-brand-cyan border border-brand-cyan/30 rounded-lg hover:bg-brand-cyan/10 transition-colors disabled:opacity-50"
        >
          {connecting ? 'Connecting...' : 'Connect'}
        </button>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');

  const tabs = [
    { key: 'account' as const, label: 'Account', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { key: 'organization' as const, label: 'Organization', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )},
    { key: 'integrations' as const, label: 'Integrations', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )},
    { key: 'notifications' as const, label: 'Notifications', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    )},
  ];

  const subPages = [
    { label: 'Brand Voice', href: '/app/settings/brand-voice', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )},
    { label: 'Knowledge Base', href: '/app/settings/knowledge-base', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )},
    { label: 'Security', href: '/app/settings/security', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )},
    { label: 'Billing', href: '/app/settings/billing', icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    )},
  ];

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-border-subtle bg-gradient-to-b from-slate-3/50 to-transparent">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-5/50 ring-1 ring-slate-4">
              <svg className="w-6 h-6 text-slate-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
              <p className="text-slate-10 mt-1">
                Manage your account and organization preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8 max-w-5xl mx-auto">
        <div className="flex gap-8">
          {/* Sidebar */}
          <div className="w-48 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  type="button"
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-brand-iris/10 text-brand-iris'
                      : 'text-slate-10 hover:text-white hover:bg-slate-4/50'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Sub-page links */}
            <div className="mt-6 pt-4 border-t border-border-subtle">
              <p className="px-3 mb-2 text-[11px] font-medium text-white/40 uppercase tracking-wider">Configure</p>
              <nav className="space-y-1">
                {subPages.map((page) => (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-10 hover:text-white hover:bg-slate-4/50 transition-all"
                  >
                    {page.icon}
                    {page.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            <div className="panel-card p-8">
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Account Settings</h2>
                  <p className="text-slate-11">
                    Account settings are managed through your authentication provider.
                    Changes to your profile, password, or security settings should be made there.
                  </p>
                  <div className="p-4 rounded-lg bg-slate-3/30 border border-border-subtle">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-iris/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-brand-iris" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-white">Secure Authentication</div>
                        <div className="text-sm text-slate-11">Connected via OAuth provider</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'organization' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Organization Settings</h2>
                  <p className="text-slate-11">
                    Organization configuration options will be available here.
                  </p>
                  <Link
                    href="/app/team"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-brand-iris text-white font-medium rounded-lg hover:bg-brand-iris/90 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Manage Team
                  </Link>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Integrations</h2>
                  <p className="text-slate-11">
                    Connect external services to enhance your Pravado experience.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <GSCIntegrationCard />
                    {['Slack', 'HubSpot', 'Salesforce', 'Google Analytics'].map((integration) => (
                      <div key={integration} className="p-4 rounded-lg bg-slate-3/30 border border-border-subtle">
                        <div className="font-medium text-white mb-1">{integration}</div>
                        <div className="text-sm text-slate-11 mb-3">Coming soon</div>
                        <button
                          disabled
                          className="px-3 py-1.5 text-xs font-medium text-slate-10 bg-slate-4 rounded-lg cursor-not-allowed"
                        >
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
                  <p className="text-slate-11">
                    Configure how and when you receive notifications from Pravado.
                  </p>
                  <div className="space-y-4">
                    {[
                      { label: 'Email notifications', description: 'Receive updates via email' },
                      { label: 'Coverage alerts', description: 'Get notified about new media coverage' },
                      { label: 'AI insights', description: 'Daily AI-generated intelligence summaries' },
                    ].map((pref) => (
                      <div key={pref.label} className="flex items-center justify-between p-4 rounded-lg bg-slate-3/30 border border-border-subtle">
                        <div>
                          <div className="font-medium text-white">{pref.label}</div>
                          <div className="text-sm text-slate-11">{pref.description}</div>
                        </div>
                        <button className="relative w-11 h-6 bg-slate-5 rounded-full transition-colors">
                          <span className="absolute left-1 top-1 w-4 h-4 bg-slate-10 rounded-full transition-transform" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legal */}
        <div className="pt-6 mt-6 border-t border-border-subtle">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Legal</h3>
          <div className="space-y-2">
            <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/50 hover:text-white/80 transition-colors">Terms of Service &rarr;</a>
            <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/50 hover:text-white/80 transition-colors">Privacy Policy &rarr;</a>
            <a href="/legal/cookies" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/50 hover:text-white/80 transition-colors">Cookie Policy &rarr;</a>
            <a href="/legal/acceptable-use" target="_blank" rel="noopener noreferrer" className="block text-sm text-white/50 hover:text-white/80 transition-colors">Acceptable Use Policy &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}
