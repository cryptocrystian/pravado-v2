'use client';

import { useState, useEffect, useCallback } from 'react';

interface BetaRequest {
  id: string;
  email: string;
  company_name: string;
  status: string;
  created_at: string;
}

interface InviteCode {
  id: string;
  code: string;
  email: string;
  used: boolean;
  created_at: string;
}

export default function AdminBetaPage() {
  const [tab, setTab] = useState<'waitlist' | 'codes'>('waitlist');
  const [requests, setRequests] = useState<BetaRequest[]>([]);
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingInviteRequestId, setPendingInviteRequestId] = useState<string | null>(null);

  const loadWaitlist = useCallback(() => {
    const params = new URLSearchParams({ page: '1', limit: '50' });
    if (statusFilter !== 'all') params.set('status', statusFilter);
    fetch(`/api/admin/beta/waitlist?${params}`)
      .then(r => r.json())
      .then(d => { setRequests(d.requests ?? []); setTotal(d.total ?? 0); })
      .catch(() => {});
  }, [statusFilter]);

  const loadCodes = useCallback(() => {
    fetch('/api/admin/beta/codes')
      .then(r => r.json())
      .then(d => setCodes(d.codes ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { if (tab === 'waitlist') loadWaitlist(); else loadCodes(); }, [tab, loadWaitlist, loadCodes]);

  function showToastMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove(id: string) {
    await fetch('/api/admin/beta/approve', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: id }),
    });
    showToastMsg('Request approved');
    loadWaitlist();
  }

  function openInviteModal(email: string, requestId?: string) {
    setInviteEmail(email);
    setPendingInviteRequestId(requestId ?? null);
    setShowInviteModal(true);
  }

  async function handleSendInvite() {
    await fetch('/api/admin/beta/invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, requestId: pendingInviteRequestId }),
    });
    setShowInviteModal(false);
    showToastMsg(`Invite sent to ${inviteEmail}`);
    loadWaitlist();
    loadCodes();
  }

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-lg font-bold text-white mb-6">Beta Management</h1>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-semantic-success/15 border border-semantic-success/30 rounded-lg px-4 py-2 text-sm text-semantic-success z-50">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {(['waitlist', 'codes'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              tab === t ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t === 'waitlist' ? 'Waitlist' : 'Invite Codes'}
          </button>
        ))}
      </div>

      {tab === 'waitlist' && (
        <>
          {/* Status filters */}
          <div className="flex gap-1 mb-4">
            {['all', 'pending', 'approved', 'invited', 'used'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 text-[11px] font-semibold uppercase rounded ${
                  statusFilter === s ? 'bg-brand-cyan/15 text-brand-cyan' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {s}
              </button>
            ))}
            <span className="ml-2 text-[11px] text-white/30 self-center">{total} total</span>
          </div>

          {/* Table */}
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#1F1F28' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#13131A' }}>
                  <th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Company</th>
                  <th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Submitted</th>
                  <th className="text-right px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1F1F28' }}>
                {requests.map(r => (
                  <tr key={r.id} style={{ background: '#0A0A0F' }}>
                    <td className="px-4 py-3 text-white/70 text-xs">{r.email}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{r.company_name || '--'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        r.status === 'pending' ? 'bg-semantic-warning/15 text-semantic-warning' :
                        r.status === 'approved' ? 'bg-brand-cyan/15 text-brand-cyan' :
                        r.status === 'invited' ? 'bg-semantic-success/15 text-semantic-success' :
                        'bg-white/5 text-white/40'
                      }`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {r.status === 'pending' && (
                          <button onClick={() => handleApprove(r.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-brand-cyan hover:bg-brand-cyan/10 rounded transition-colors">
                            Approve
                          </button>
                        )}
                        {(r.status === 'pending' || r.status === 'approved') && (
                          <button onClick={() => openInviteModal(r.email, r.id)}
                            className="px-2 py-1 text-[11px] font-semibold text-semantic-success hover:bg-semantic-success/10 rounded transition-colors">
                            Invite
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">No requests</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'codes' && (
        <>
          <button onClick={() => { setInviteEmail(''); setPendingInviteRequestId(null); setShowInviteModal(true); }}
            className="mb-4 px-3 py-1.5 text-xs font-semibold bg-brand-cyan text-white rounded-lg hover:bg-brand-cyan/90 transition-colors">
            Generate Invite Code
          </button>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: '#1F1F28' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#13131A' }}>
                  <th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Email</th>
                  <th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Used</th>
                  <th className="text-left px-4 py-3 text-[11px] text-white/40 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: '#1F1F28' }}>
                {codes.map(c => (
                  <tr key={c.id} style={{ background: '#0A0A0F' }}>
                    <td className="px-4 py-3 text-white/80 font-mono text-xs">{c.code}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{c.email || '--'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold uppercase ${c.used ? 'text-semantic-success' : 'text-white/30'}`}>
                        {c.used ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {codes.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30 text-sm">No invite codes yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="rounded-xl p-6 w-96" style={{ background: '#13131A', border: '1px solid #1F1F28' }}>
            <h3 className="text-sm font-bold text-white mb-4">Send Beta Invite</h3>
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="email@company.com"
              className="w-full px-3 py-2 rounded-lg text-sm text-white/90 placeholder-white/30 mb-4"
              style={{ background: '#0A0A0F', border: '1px solid #1F1F28' }}
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowInviteModal(false)}
                className="px-3 py-1.5 text-xs text-white/40 hover:text-white/70">Cancel</button>
              <button onClick={handleSendInvite}
                className="px-3 py-1.5 text-xs font-semibold bg-semantic-success text-white rounded-lg hover:bg-semantic-success/90">
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
