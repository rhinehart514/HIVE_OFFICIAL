"use client";

import { useState, useCallback } from "react";
import { Button } from "@hive/ui";
import { useAdminFetch } from "@/hooks/use-admin-api";

interface User {
  id: string;
  email: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  campusId: string;
  createdAt: string;
  lastActive: string | null;
  onboardingCompleted: boolean;
  spaceMemberships: string[];
}

interface UsersResponse {
  users: User[];
  summary: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
    builders: number;
    admins: number;
  };
  pagination: {
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

export function UserLookup() {
  const { adminFetch } = useAdminFetch();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const searchUsers = useCallback(async () => {
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const params = new URLSearchParams({ search: searchTerm.trim() });
      const response = await adminFetch(`/api/admin/users?${params}`);

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data: { success: boolean; data: UsersResponse } = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, adminFetch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      searchUsers();
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "suspended":
        return "bg-red-500/20 text-red-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-purple-500/20 text-purple-400";
      case "admin":
        return "bg-blue-500/20 text-blue-400";
      case "builder":
        return "bg-amber-500/20 text-amber-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by email, handle, or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-md border border-gray-600 bg-gray-800 px-3 py-2 text-white placeholder-gray-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <Button
          variant="default"
          size="sm"
          disabled={loading || !searchTerm.trim()}
          onClick={searchUsers}
        >
          {loading ? "..." : "Search"}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-400">{error}</div>
      )}

      {!hasSearched && !loading && (
        <div className="text-sm text-gray-400">
          Enter a search term to find users
        </div>
      )}

      {hasSearched && users.length === 0 && !loading && (
        <div className="text-sm text-gray-400">
          No users found matching "{searchTerm}"
        </div>
      )}

      {users.length > 0 && (
        <div className="space-y-2">
          {users.map((user) => (
            <div
              key={user.id}
              className="cursor-pointer rounded-md border border-gray-600 bg-gray-800/50 p-3 transition-colors hover:border-gray-500"
              onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-gray-300">
                      {user.displayName?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">
                        {user.displayName || "Unnamed"}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-xs ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                      {user.role !== "user" && (
                        <span className={`rounded px-1.5 py-0.5 text-xs ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">
                      {user.handle && <span>@{user.handle}</span>}
                      {user.handle && user.email && <span className="mx-1">•</span>}
                      {user.email && <span>{user.email}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {selectedUser?.id === user.id && (
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">User ID:</span>
                      <span className="ml-2 font-mono text-xs text-gray-300">{user.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Campus:</span>
                      <span className="ml-2 text-gray-300">{user.campusId}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-300">{formatDate(user.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Last active:</span>
                      <span className="ml-2 text-gray-300">{formatDate(user.lastActive)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Onboarded:</span>
                      <span className="ml-2 text-gray-300">
                        {user.onboardingCompleted ? "Yes" : "No"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Spaces:</span>
                      <span className="ml-2 text-gray-300">
                        {user.spaceMemberships?.length || 0} memberships
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`/u/${user.handle || user.id}`, "_blank");
                      }}
                    >
                      View Profile
                    </Button>
                    {user.status === "active" && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Suspend action would go here
                        }}
                      >
                        Suspend
                      </Button>
                    )}
                    {user.status === "suspended" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Unsuspend action would go here
                        }}
                      >
                        Unsuspend
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
