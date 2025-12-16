/**
 * Settings Page
 * Organization and account settings
 */

'use client';

import Link from 'next/link';
import { useState } from 'react';

export const dynamic = 'force-dynamic';

type SettingsTab = 'account' | 'organization' | 'integrations' | 'notifications';

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
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
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
      </div>
    </div>
  );
}
