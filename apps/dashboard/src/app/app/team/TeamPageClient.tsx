'use client';

/**
 * Team page client component with interactive elements
 */

import type { ListMembersData } from '@pravado/types';
import { useState } from 'react';

interface TeamPageClientProps {
  orgId: string;
  members: ListMembersData['members'];
  invites: ListMembersData['invites'];
  currentUserId: string;
}

export function TeamPageClient({
  orgId,
  members: initialMembers,
  invites: initialInvites,
  currentUserId,
}: TeamPageClientProps) {
  const [members] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/orgs/${orgId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Invitation sent to ${email}`);
        setEmail('');
        setRole('member');
        setShowInviteForm(false);

        // Add new invite to the list
        if (data.data?.invite) {
          setInvites([...invites, { ...data.data.invite, createdByUser: { fullName: null } }]);
        }
      } else {
        setError(data.error?.message || 'Failed to send invitation');
      }
    } catch (err) {
      setError('An error occurred while sending the invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (inviteId: string, inviteEmail: string) => {
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/orgs/${orgId}/invites/${inviteId}/resend`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Invitation resent to ${inviteEmail}`);
      } else {
        setError(data.error?.message || 'Failed to resend invitation');
      }
    } catch (err) {
      setError('An error occurred while resending the invitation');
    }
  };

  const getRoleBadgeColor = (roleValue: string) => {
    switch (roleValue) {
      case 'owner':
        return 'bg-brand-magenta/10 text-brand-magenta';
      case 'admin':
        return 'bg-brand-iris/10 text-brand-iris';
      case 'member':
        return 'bg-slate-5 text-slate-6';
      default:
        return 'bg-slate-5 text-slate-6';
    }
  };

  return (
    <div className="p-8 bg-page min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white-0">Team</h2>
            <p className="text-muted mt-1">
              Manage your organization members and invitations
            </p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="btn-primary"
          >
            {showInviteForm ? 'Cancel' : 'Invite Member'}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="alert-success mb-6">
            <p>{success}</p>
          </div>
        )}

        {error && (
          <div className="alert-error mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <div className="mb-8 panel-card p-6">
            <h3 className="text-lg font-semibold text-white-0 mb-4">
              Invite Team Member
            </h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-6 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-slate-6 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                  className="input-field"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="mt-1 text-xs text-slate-6">
                  Admins can invite and manage team members
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="panel-card mb-6">
          <div className="px-6 py-4 border-b border-border-subtle">
            <h3 className="text-lg font-semibold text-white-0">
              Members ({members.length})
            </h3>
          </div>
          <div className="divide-y divide-border-subtle">
            {members.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-6">
                No members found
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-3/30 transition-colors duration-sm">
                  <div className="flex items-center space-x-3">
                    {member.user.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt={member.user.fullName || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-5 rounded-full flex items-center justify-center text-white-0 font-medium">
                        {member.user.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white-0">
                        {member.user.fullName || 'Unknown'}
                        {member.userId === currentUserId && (
                          <span className="ml-2 text-xs text-slate-6">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-6">{member.user.email}</p>
                    </div>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        member.role
                      )}`}
                    >
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Invites */}
        <div className="panel-card">
          <div className="px-6 py-4 border-b border-border-subtle">
            <h3 className="text-lg font-semibold text-white-0">
              Pending Invitations ({invites.length})
            </h3>
          </div>
          <div className="divide-y divide-border-subtle">
            {invites.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-6">
                No pending invitations
              </div>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-3/30 transition-colors duration-sm">
                  <div>
                    <p className="text-sm font-medium text-white-0">{invite.email}</p>
                    <p className="text-xs text-slate-6">
                      Invited {new Date(invite.createdAt).toLocaleDateString()}
                      {invite.createdByUser.fullName && ` by ${invite.createdByUser.fullName}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                        invite.role
                      )}`}
                    >
                      {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                    </span>
                    <button
                      onClick={() => handleResend(invite.id, invite.email)}
                      className="text-sm text-brand-cyan hover:text-brand-cyan/80 font-medium transition-colors duration-sm"
                    >
                      Resend
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
