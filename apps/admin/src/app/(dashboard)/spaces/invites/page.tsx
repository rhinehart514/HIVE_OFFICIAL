"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { Button, Badge, HiveCard as Card, CardContent, CardHeader, CardTitle } from "@hive/ui";
import {
  ArrowPathIcon,
  UserPlusIcon,
  EnvelopeIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Aliases
const RefreshCw = ArrowPathIcon;
const UserPlus = UserPlusIcon;
const Mail = EnvelopeIcon;
const Trash = TrashIcon;
const CheckCircle = CheckCircleIcon;
const Clock = ClockIcon;
const AlertTriangle = ExclamationTriangleIcon;
const Shield = ShieldCheckIcon;
const X = XMarkIcon;

interface SchoolAdmin {
  id: string;
  email: string;
  displayName?: string;
  campusId: string;
  campusName: string;
  role: 'admin' | 'moderator';
  status: 'active' | 'pending' | 'revoked';
  invitedAt: string;
  acceptedAt?: string;
  lastLoginAt?: string;
  invitedBy: string;
}

interface Campus {
  id: string;
  name: string;
  schoolName: string;
}

export default function SchoolAdminInvitesPage() {
  const { admin } = useAdminAuth();
  const [admins, setAdmins] = useState<SchoolAdmin[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCampusId, setInviteCampusId] = useState("");
  const [inviteRole, setInviteRole] = useState<'admin' | 'moderator'>('admin');

  const isHiveTeam = !admin?.campusId;

  const fetchData = useCallback(async () => {
    if (!admin || !isHiveTeam) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch school admins
      const adminsResponse = await fetchWithAuth('/api/admin/school-admins', {
      });

      if (adminsResponse.ok) {
        const data = await adminsResponse.json();
        setAdmins(data.data?.admins || data.admins || []);
      }

      // Fetch campuses for dropdown
      const campusesResponse = await fetchWithAuth('/api/admin/schools', {
      });

      if (campusesResponse.ok) {
        const data = await campusesResponse.json();
        setCampuses(data.data?.schools || data.schools || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [admin, isHiveTeam]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admin || !inviteEmail || !inviteCampusId) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetchWithAuth('/api/admin/school-admins/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail,
          campusId: inviteCampusId,
          role: inviteRole,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invite');
      }

      // Reset form and refresh
      setInviteEmail("");
      setInviteCampusId("");
      setInviteRole('admin');
      setShowInviteForm(false);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (adminId: string) => {
    if (!admin) return;
    if (!confirm('Are you sure you want to revoke this admin\'s access?')) return;

    setActionLoading(true);
    try {
      const response = await fetchWithAuth(`/api/admin/school-admins/${adminId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to revoke access');
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke access');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Access control - only HIVE team
  if (!isHiveTeam) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-amber-400" />
            <div>
              <h3 className="text-lg font-medium text-white">Access Restricted</h3>
              <p className="text-white/50">
                School admin management is only available to HIVE team members.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  const activeAdmins = admins.filter(a => a.status === 'active');
  const pendingAdmins = admins.filter(a => a.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserPlus className="h-6 w-6 text-amber-400" />
          <h2 className="text-xl font-semibold text-white">School Admin Management</h2>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowInviteForm(true)}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Admin
          </Button>
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            className="border-white/[0.12] text-white/70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <span className="text-red-400">{error}</span>
            <Button
              onClick={() => setError(null)}
              variant="ghost"
              size="sm"
              className="ml-auto text-red-400"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Invite Form Modal */}
      {showInviteForm && (
        <Card className="border-amber-500/30 bg-[#141414]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Invite School Admin</CardTitle>
              <Button
                onClick={() => setShowInviteForm(false)}
                variant="ghost"
                size="sm"
                className="text-white/50"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="admin@university.edu"
                  required
                  className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.12] rounded-lg text-white placeholder:text-white/40 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">Campus</label>
                <select
                  value={inviteCampusId}
                  onChange={(e) => setInviteCampusId(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-white/[0.05] border border-white/[0.12] rounded-lg text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="">Select a campus...</option>
                  {campuses.map(campus => (
                    <option key={campus.id} value={campus.id}>
                      {campus.name} ({campus.schoolName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/50 mb-2">Role</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={inviteRole === 'admin'}
                      onChange={() => setInviteRole('admin')}
                      className="text-amber-500"
                    />
                    <span className="text-white">Admin</span>
                    <span className="text-white/40 text-sm">(Full access)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="moderator"
                      checked={inviteRole === 'moderator'}
                      onChange={() => setInviteRole('moderator')}
                      className="text-amber-500"
                    />
                    <span className="text-white">Moderator</span>
                    <span className="text-white/40 text-sm">(View + moderate)</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  variant="outline"
                  className="border-white/[0.12] text-white/70"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={actionLoading || !inviteEmail || !inviteCampusId}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {pendingAdmins.length > 0 && (
        <Card className="border-white/[0.08] bg-[#141414]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-400" />
              Pending Invitations ({pendingAdmins.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAdmins.map(pendingAdmin => (
                <div
                  key={pendingAdmin.id}
                  className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{pendingAdmin.email}</p>
                      <p className="text-white/40 text-sm">
                        {pendingAdmin.campusName} · Invited {new Date(pendingAdmin.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-yellow-500/20 text-yellow-400 capitalize">
                      {pendingAdmin.role}
                    </Badge>
                    <Button
                      onClick={() => handleRevoke(pendingAdmin.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active School Admins */}
      <Card className="border-white/[0.08] bg-[#141414]">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Active School Admins ({activeAdmins.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeAdmins.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/50">No school admins yet</p>
              <Button
                onClick={() => setShowInviteForm(true)}
                className="mt-4 bg-amber-500 hover:bg-amber-600"
              >
                Invite First Admin
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.08]">
                    <th className="text-left p-3 text-white/50">Admin</th>
                    <th className="text-left p-3 text-white/50">Campus</th>
                    <th className="text-left p-3 text-white/50">Role</th>
                    <th className="text-left p-3 text-white/50">Last Login</th>
                    <th className="text-left p-3 text-white/50">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAdmins.map(activeAdmin => (
                    <tr key={activeAdmin.id} className="border-b border-white/[0.06]">
                      <td className="p-3">
                        <div>
                          <p className="text-white font-medium">
                            {activeAdmin.displayName || activeAdmin.email}
                          </p>
                          {activeAdmin.displayName && (
                            <p className="text-white/40 text-sm">{activeAdmin.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-white">{activeAdmin.campusName}</td>
                      <td className="p-3">
                        <Badge
                          className={
                            activeAdmin.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }
                        >
                          {activeAdmin.role}
                        </Badge>
                      </td>
                      <td className="p-3 text-white/50">
                        {activeAdmin.lastLoginAt
                          ? new Date(activeAdmin.lastLoginAt).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="p-3">
                        <Button
                          onClick={() => handleRevoke(activeAdmin.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:bg-red-500/10"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
