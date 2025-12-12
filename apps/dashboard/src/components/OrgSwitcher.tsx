/**
 * Organization Switcher Component (Sprint S89)
 * Allows users to switch between organizations and join the demo org
 */

'use client';

import { useState, useEffect } from 'react';

interface Org {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface OrgSwitcherProps {
  currentOrg: Org;
  allOrgs: Org[];
}

export function OrgSwitcher({ currentOrg, allOrgs }: OrgSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [orgs] = useState<Org[]>(allOrgs);
  const [isJoiningDemo, setIsJoiningDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if demo org exists in user's orgs
  const hasDemoOrg = orgs.some((org) => org.name === 'Pravado Demo Org');

  const handleSwitchOrg = async (orgId: string) => {
    // Store selected org in localStorage for persistence
    localStorage.setItem('pravado_active_org_id', orgId);
    // Refresh the page to use new org context
    window.location.reload();
  };

  const handleJoinDemoOrg = async () => {
    setIsJoiningDemo(true);
    setError(null);

    try {
      const { supabase } = await import('@/lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/v1/orgs/join-demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Set this as the active org and refresh
        localStorage.setItem('pravado_active_org_id', data.data.org.id);
        window.location.reload();
      } else {
        setError(data.error?.message || 'Failed to join demo organization');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join demo org');
    } finally {
      setIsJoiningDemo(false);
    }
  };

  // Sync with localStorage on mount
  useEffect(() => {
    const savedOrgId = localStorage.getItem('pravado_active_org_id');
    if (savedOrgId && savedOrgId !== currentOrg.id) {
      const savedOrg = orgs.find((o) => o.id === savedOrgId);
      if (savedOrg) {
        // Redirect if there's a mismatch
        window.location.reload();
      }
    }
  }, [currentOrg.id, orgs]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg bg-slate-3/50 hover:bg-slate-3 transition-colors duration-200 w-full"
      >
        <div className="w-8 h-8 bg-brand-iris rounded-lg flex items-center justify-center text-white font-semibold text-sm">
          {currentOrg.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-white truncate">
            {currentOrg.name}
          </p>
          <p className="text-xs text-muted truncate">
            {currentOrg.name === 'Pravado Demo Org' ? 'Demo Organization' : 'Organization'}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute left-0 right-0 mt-2 bg-slate-2 border border-border-subtle rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="p-2">
              <p className="text-xs font-medium text-muted uppercase px-2 py-1">
                Your Organizations
              </p>

              {orgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    if (org.id !== currentOrg.id) {
                      handleSwitchOrg(org.id);
                    }
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-2 rounded-md transition-colors ${
                    org.id === currentOrg.id
                      ? 'bg-brand-iris/10 text-brand-iris'
                      : 'hover:bg-slate-3 text-white'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${
                      org.id === currentOrg.id
                        ? 'bg-brand-iris text-white'
                        : 'bg-slate-4 text-muted'
                    }`}
                  >
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm truncate flex-1 text-left">
                    {org.name}
                  </span>
                  {org.id === currentOrg.id && (
                    <svg className="w-4 h-4 text-brand-iris" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {org.name === 'Pravado Demo Org' && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-brand-cyan/10 text-brand-cyan rounded">
                      Demo
                    </span>
                  )}
                </button>
              ))}

              {/* Join Demo Org Option */}
              {!hasDemoOrg && (
                <>
                  <div className="border-t border-border-subtle my-2" />
                  <button
                    onClick={handleJoinDemoOrg}
                    disabled={isJoiningDemo}
                    className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-slate-3 transition-colors text-brand-cyan disabled:opacity-50"
                  >
                    <div className="w-6 h-6 rounded bg-brand-cyan/10 flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span className="text-sm">
                      {isJoiningDemo ? 'Joining...' : 'Join Demo Organization'}
                    </span>
                  </button>
                </>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-2 p-2 text-xs text-semantic-danger bg-semantic-danger/10 rounded-md">
                  {error}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
