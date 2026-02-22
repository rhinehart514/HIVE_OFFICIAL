"use client";

import { useEffect, useState } from "react";
import { useAdminAuth } from "@/lib/auth";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  EyeIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "https://hive.college";

interface User {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  spaces?: { handle: string; name: string }[];
  createdAt?: string;
}

export default function ImpersonatePage() {
  const { admin, loading, isAuthenticated } = useAdminAuth();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [impersonating, setImpersonating] = useState(false);
  const [impersonateUrl, setImpersonateUrl] = useState<string | null>(null);
  const searchUsers = async (query: string) => {
    if (!query.trim()) { setUsers([]); return; }
    setSearching(true);
    try {
      const res = await fetchWithAuth(`/api/admin/users?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setUsers(data.users || data.data?.users || []);
    } catch {
      setUsers([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => searchUsers(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleImpersonate = async (user: User) => {
    setImpersonating(true);
    try {
      const res = await fetchWithAuth("/api/admin/toolbar/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.token || data.url) {
        const url = data.url || `${WEB_URL}?impersonate=${data.token}`;
        setImpersonateUrl(url);
      }
    } catch {
      // handle error
    } finally {
      setImpersonating(false);
    }
  };

  if (loading || !admin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
      </div>
    );
  }

  return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 h-14 px-6 border-b border-white/10 bg-[#0A0A0A]">
          <Link href="/preview" className="text-white/50 hover:text-white transition-colors">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Impersonate User</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {impersonateUrl ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-medium">Viewing as {selectedUser?.name || selectedUser?.email}</h2>
                  <p className="text-sm text-white/40">Impersonation session active</p>
                </div>
                <button
                  onClick={() => { setImpersonateUrl(null); setSelectedUser(null); }}
                  className="px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  End Session
                </button>
              </div>
              <div className="rounded-xl border border-white/10 overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
                <iframe
                  src={impersonateUrl}
                  className="w-full h-full"
                  style={{ border: "none" }}
                  allow="clipboard-read; clipboard-write"
                  title="Impersonate Preview"
                />
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-white/50"
                />
              </div>

              {searching && (
                <div className="text-center py-8 text-white/40">Searching...</div>
              )}

              {selectedUser && !impersonateUrl && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <UserCircleIcon className="h-12 w-12 text-white/30" />
                      <div>
                        <h3 className="text-white font-semibold text-lg">{selectedUser.name || "Unnamed"}</h3>
                        <p className="text-sm text-white/50">{selectedUser.email}</p>
                        {selectedUser.role && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">
                            {selectedUser.role}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-sm text-white/40 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  {selectedUser.spaces && selectedUser.spaces.length > 0 && (
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Spaces</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.spaces.map((s) => (
                          <span key={s.handle} className="px-2 py-1 text-xs bg-white/5 border border-white/10 rounded-md text-white/60">
                            {s.name || s.handle}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => handleImpersonate(selectedUser)}
                    disabled={impersonating}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 rounded-lg hover:bg-[#FFD700]/20 transition-colors disabled:opacity-50"
                  >
                    <EyeIcon className="h-5 w-5" />
                    {impersonating ? "Starting session..." : "View as this user"}
                  </button>
                </div>
              )}

              {!selectedUser && users.length > 0 && (
                <div className="space-y-2">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="w-full flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-left"
                    >
                      <UserCircleIcon className="h-10 w-10 text-white/30 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{user.name || "Unnamed"}</p>
                        <p className="text-sm text-white/40 truncate">{user.email}</p>
                      </div>
                      {user.role && (
                        <span className="text-xs text-white/30">{user.role}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!selectedUser && !searching && search && users.length === 0 && (
                <div className="text-center py-12 text-white/30">No users found</div>
              )}

              {!search && !selectedUser && (
                <div className="text-center py-12 text-white/30">
                  <EyeIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Search for a user to view the app as them</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
  );
}
