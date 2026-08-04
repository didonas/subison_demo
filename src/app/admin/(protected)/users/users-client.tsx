"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Power,
  KeyRound,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  createStaffUserAction,
  updateStaffUserRoleAction,
  toggleStaffUserActiveAction,
  revokeStaffUserSessionsAction,
} from "@/lib/admin/actions";
import { AdminRoleType } from "@/lib/admin/permissions.shared";

interface StaffUserItem {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  roles: string[];
  createdAt: string;
}

interface UsersClientProps {
  users: StaffUserItem[];
  currentAdminId: string;
  canManageRoles: boolean;
}

export function UsersClient({ users, currentAdminId, canManageRoles }: UsersClientProps) {
  const router = useRouter();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRoleType>("RECEPTIONIST");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await createStaffUserAction({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      if (!res.success) {
        setError(res.error || "Failed to create staff user.");
      } else {
        setName("");
        setEmail("");
        setPassword("");
        setCreateModalOpen(false);
        setSuccessMsg(`Staff account created for ${res.user?.name}.`);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      setLoading(true);
      setError(null);
      const res = await toggleStaffUserActiveAction(userId, !currentActive);
      if (!res.success) {
        setError(res.error || "Failed to update user status.");
      } else {
        setSuccessMsg(`User status changed.`);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: AdminRoleType) => {
    try {
      setLoading(true);
      setError(null);
      const res = await updateStaffUserRoleAction(userId, newRole);
      if (!res.success) {
        setError(res.error || "Failed to modify role.");
      } else {
        setSuccessMsg(`Role updated to ${newRole}.`);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSessions = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await revokeStaffUserSessionsAction(userId);
      if (!res.success) {
        setError("Failed to revoke user sessions.");
      } else {
        setSuccessMsg("Active sessions revoked. User must re-authenticate.");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case "SUPER_ADMIN":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "HOSPITAL_ADMIN":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "RECEPTIONIST":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Staff &amp; Access Control</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage hospital staff accounts, RBAC role permissions, and active login sessions.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2 px-4 rounded-xl shadow-md transition"
        >
          <UserPlus className="w-4 h-4" />
          Create Staff User
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          role="status"
          className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-4">Staff Member</th>
                <th className="py-4 px-4">Role Assignment</th>
                <th className="py-4 px-4">Account Status</th>
                <th className="py-4 px-4">Last Login</th>
                <th className="py-4 px-4 text-right">Security Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.map((u) => {
                const isSelf = u.id === currentAdminId;
                const primaryRole = (u.roles[0] || "RECEPTIONIST") as AdminRoleType;

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white flex items-center gap-2">
                        {u.name}
                        {isSelf && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      {canManageRoles && !isSelf ? (
                        <select
                          value={primaryRole}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value as AdminRoleType)
                          }
                          className="bg-slate-950/60 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                        >
                          <option value="SUPER_ADMIN">Super Administrator</option>
                          <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                          <option value="RECEPTIONIST">Receptionist</option>
                          <option value="CONTENT_EDITOR">Content Editor</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getRoleBadgeColor(
                            primaryRole
                          )}`}
                        >
                          {primaryRole.replace("_", " ")}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span
                        className={`inline-flex items-center gap-1.5 font-medium ${
                          u.isActive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            u.isActive ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-mono">
                      {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString("en-IN") : "Never"}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      {!isSelf && (
                        <>
                          <button
                            onClick={() => handleToggleActive(u.id, u.isActive)}
                            disabled={loading}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                              u.isActive
                                ? "bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20"
                            }`}
                          >
                            <Power className="w-3.5 h-3.5 inline mr-1" />
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>

                          <button
                            onClick={() => handleRevokeSessions(u.id)}
                            disabled={loading}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                            title="Revoke active sessions"
                          >
                            <KeyRound className="w-3.5 h-3.5 inline mr-1" />
                            Revoke
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Create Staff Account
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Priya Singh"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Staff Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@subisonneuro.com"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Initial Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as AdminRoleType)}
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="RECEPTIONIST">Receptionist</option>
                  <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                  <option value="SUPER_ADMIN">Super Administrator</option>
                  <option value="CONTENT_EDITOR">Content Editor</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Staff User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
