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
        return 'bg-purple-100 text-purple-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Team</h2>
            <p className="text-gray-600 mt-1">
              Manage your organization members and invitations
            </p>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {showInviteForm ? 'Cancel' : 'Invite Member'}
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Invite Form */}
        {showInviteForm && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invite Team Member
            </h3>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="colleague@example.com"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'member')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Admins can invite and manage team members
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Members ({members.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {members.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No members found
              </div>
            ) : (
              members.map((member) => (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {member.user.avatarUrl ? (
                      <img
                        src={member.user.avatarUrl}
                        alt={member.user.fullName || 'User'}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-medium">
                        {member.user.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.fullName || 'Unknown'}
                        {member.userId === currentUserId && (
                          <span className="ml-2 text-xs text-gray-500">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
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
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Pending Invitations ({invites.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200">
            {invites.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No pending invitations
              </div>
            ) : (
              invites.map((invite) => (
                <div key={invite.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                    <p className="text-xs text-gray-500">
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
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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
