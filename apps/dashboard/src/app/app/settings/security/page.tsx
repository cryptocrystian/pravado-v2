/**
 * Security Settings Page (Sprint S-INT-10)
 *
 * - TOTP MFA enrollment/management via Supabase Auth
 * - Active session info + sign out controls
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Factor } from '@supabase/supabase-js';

type MFAState = 'loading' | 'not-enrolled' | 'enrolling' | 'verifying' | 'enrolled';

export default function SecuritySettingsPage() {
  // MFA state
  const [mfaState, setMfaState] = useState<MFAState>('loading');
  const [factors, setFactors] = useState<Factor[]>([]);
  const [qrCode, setQrCode] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  // Session state
  const [sessionInfo, setSessionInfo] = useState<{
    expiresAt: string;
    createdAt: string;
    userAgent: string;
  } | null>(null);

  // General state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Org MFA requirement
  const [orgRequiresMFA, setOrgRequiresMFA] = useState(false);

  const loadMFAStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactors = (data?.totp ?? []).filter(
        (f: Factor) => f.status === 'verified'
      );
      setFactors(totpFactors);
      setMfaState(totpFactors.length > 0 ? 'enrolled' : 'not-enrolled');
    } catch {
      setMfaState('not-enrolled');
    }
  }, []);

  const loadSessionInfo = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setSessionInfo({
        expiresAt: new Date(data.session.expires_at! * 1000).toISOString(),
        createdAt: new Date(
          (data.session.expires_at! - 3600) * 1000
        ).toISOString(),
        userAgent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      });
    }
  }, []);

  const loadOrgMFARequirement = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: membership } = await supabase
      .from('org_members')
      .select('org_id, orgs!inner(require_mfa)')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    const orgData = membership?.orgs as unknown as { require_mfa: boolean } | null;
    setOrgRequiresMFA(orgData?.require_mfa ?? false);
  }, []);

  useEffect(() => {
    loadMFAStatus();
    loadSessionInfo();
    loadOrgMFARequirement();
  }, [loadMFAStatus, loadSessionInfo, loadOrgMFARequirement]);

  // Start MFA enrollment
  const handleEnroll = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setFactorId(data.id);
      setMfaState('enrolling');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start MFA enrollment');
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA code during enrollment
  const handleVerify = async () => {
    if (verifyCode.length !== 6) {
      setError('Enter a 6-digit code');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId,
      });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyErr) throw verifyErr;

      setSuccess('Two-factor authentication enabled successfully.');
      setMfaState('enrolled');
      setVerifyCode('');
      setQrCode('');
      loadMFAStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Disable MFA (unenroll)
  const handleDisable = async () => {
    if (disableCode.length !== 6) {
      setError('Enter your current 6-digit code to disable 2FA');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Verify current code first
      const factor = factors[0];
      if (!factor) throw new Error('No factor found');

      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });
      if (challengeErr) throw challengeErr;

      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challenge.id,
        code: disableCode,
      });
      if (verifyErr) throw verifyErr;

      // Now unenroll
      const { error: unenrollErr } = await supabase.auth.mfa.unenroll({
        factorId: factor.id,
      });
      if (unenrollErr) throw unenrollErr;

      setSuccess('Two-factor authentication disabled.');
      setMfaState('not-enrolled');
      setFactors([]);
      setShowDisable(false);
      setDisableCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Sign out current session
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Sign out all sessions
  const handleSignOutAll = async () => {
    await supabase.auth.signOut({ scope: 'global' });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-border-subtle bg-gradient-to-b from-slate-3/50 to-transparent">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-slate-5/50 ring-1 ring-slate-4">
              <svg className="w-6 h-6 text-slate-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Security</h1>
              <p className="text-sm text-slate-11 mt-1">
                Manage two-factor authentication and active sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-8 max-w-3xl mx-auto space-y-8">
        {/* Status messages */}
        {error && (
          <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E' }}>
            {success}
          </div>
        )}

        {/* Org MFA requirement banner */}
        {orgRequiresMFA && mfaState === 'not-enrolled' && (
          <div className="px-4 py-3 rounded-lg text-sm border" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', borderColor: 'rgba(234, 179, 8, 0.3)', color: '#EAB308' }}>
            Your organization requires two-factor authentication. Set it up to continue using Pravado.
          </div>
        )}

        {/* ================================ */}
        {/* MFA Section */}
        {/* ================================ */}
        <section className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: '#13131A', borderColor: '#1F1F28' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Two-Factor Authentication</h2>
              <p className="text-sm text-slate-11 mt-0.5">
                Add an extra layer of security with a TOTP authenticator app
              </p>
            </div>
            {mfaState === 'enrolled' && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>
                Active
              </span>
            )}
          </div>

          {mfaState === 'loading' && (
            <p className="text-sm text-slate-11">Loading...</p>
          )}

          {mfaState === 'not-enrolled' && (
            <button
              onClick={handleEnroll}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)' }}
            >
              {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
            </button>
          )}

          {mfaState === 'enrolling' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-11">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.):
              </p>
              {qrCode && (
                <div className="flex justify-center p-4 rounded-lg bg-white w-fit mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              )}
              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white text-center font-mono tracking-[0.3em] outline-none"
                  style={{ backgroundColor: '#0A0A0F', border: '1px solid #1F1F28' }}
                  placeholder="000000"
                />
                <button
                  onClick={handleVerify}
                  disabled={loading || verifyCode.length !== 6}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)' }}
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          {mfaState === 'enrolled' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-11">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Two-factor authentication is active
              </div>
              {factors.map((f) => (
                <div key={f.id} className="text-xs text-slate-11">
                  Factor: {f.friendly_name || 'Authenticator App'} (enrolled {new Date(f.created_at).toLocaleDateString()})
                </div>
              ))}

              {!showDisable ? (
                <button
                  onClick={() => setShowDisable(true)}
                  className="text-sm transition-colors hover:text-red-400"
                  style={{ color: '#7A7A8A' }}
                >
                  Remove 2FA
                </button>
              ) : (
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white text-center font-mono tracking-[0.3em] outline-none"
                    style={{ backgroundColor: '#0A0A0F', border: '1px solid #1F1F28' }}
                    placeholder="Enter code"
                  />
                  <button
                    onClick={handleDisable}
                    disabled={loading || disableCode.length !== 6}
                    className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}
                  >
                    {loading ? 'Disabling...' : 'Confirm Disable'}
                  </button>
                  <button
                    onClick={() => { setShowDisable(false); setDisableCode(''); }}
                    className="text-sm text-slate-11 hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ================================ */}
        {/* Active Sessions Section */}
        {/* ================================ */}
        <section className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: '#13131A', borderColor: '#1F1F28' }}>
          <div>
            <h2 className="text-lg font-semibold text-white">Active Sessions</h2>
            <p className="text-sm text-slate-11 mt-0.5">
              Manage your active sign-in sessions
            </p>
          </div>

          {sessionInfo && (
            <div className="rounded-lg border p-4 space-y-2" style={{ backgroundColor: '#0A0A0F', borderColor: '#1F1F28' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">Current Session</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' }}>
                  Active
                </span>
              </div>
              <div className="text-xs text-slate-11 space-y-1">
                <p>Browser: {getBrowserName(sessionInfo.userAgent)}</p>
                <p>Expires: {new Date(sessionInfo.expiresAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors border"
              style={{ borderColor: '#1F1F28', backgroundColor: 'transparent' }}
            >
              Sign out this device
            </button>
            <button
              onClick={handleSignOutAll}
              className="px-4 py-2.5 rounded-lg text-sm font-medium transition-opacity"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}
            >
              Sign out all devices
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

/** Extract a readable browser name from user-agent string */
function getBrowserName(ua: string): string {
  if (ua.includes('Chrome') && !ua.includes('Edge')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edge')) return 'Microsoft Edge';
  return 'Unknown Browser';
}
