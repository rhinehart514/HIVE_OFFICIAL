"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchWithAuth } from "@/hooks/use-admin-api";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import {
  MagnifyingGlassIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  NoSymbolIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface User {
  id: string;
  displayName: string;
  email?: string;
  handle: string;
  role: string;
  status: "active" | "suspended" | "pending" | "deleted";
  createdAt: string;
  spaceCount: number;
}

type SortField = "displayName" | "email" | "handle" | "createdAt" | "spaceCount" | "status";
type SortDir = "asc" | "desc";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    suspended: "bg-red-500/20 text-red-400 border-red-500/30",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    deleted: "bg-white/10 text-white/40 border-white/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const search = searchParams.get("q") || "";
  const status = searchParams.get("status") || "all";
  const page = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("size")) || 25;
  const sortField = (searchParams.get("sort") || "createdAt") as SortField;
  const sortDir = (searchParams.get("dir") || "desc") as SortDir;

  const updateParams = useCallback(
    (updates: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === "" || value === "all") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      });
      router.push(`/users?${params.toString()}`);
    },
    [searchParams, router]
  );

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      params.set("sort", sortField);
      params.set("dir", sortDir);

      const res = await fetchWithAuth(`/api/admin/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.data?.users || data.users || []);
      setTotal(data.data?.total || data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, status, page, pageSize, sortField, sortDir]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      updateParams({ sort: field, dir: sortDir === "asc" ? "desc" : "asc", page: 1 });
    } else {
      updateParams({ sort: field, dir: "asc", page: 1 });
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDir === "asc" ? (
      <ChevronUpIcon className="h-3 w-3 inline ml-1" />
    ) : (
      <ChevronDownIcon className="h-3 w-3 inline ml-1" />
    );
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(selected.size === users.length ? new Set() : new Set(users.map((u) => u.id)));
  };

  const handleBulkAction = async (action: "suspend" | "unsuspend") => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error(`Bulk ${action} failed`);
      setSelected(new Set());
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (selected.size > 0) {
        params.set("ids", Array.from(selected).join(","));
      }
      const res = await fetchWithAuth(`/api/admin/users/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  };

  const columns: { field: SortField; label: string; className?: string }[] = [
    { field: "displayName", label: "Name" },
    { field: "email", label: "Email" },
    { field: "handle", label: "Handle" },
    { field: "createdAt", label: "Joined" },
    { field: "spaceCount", label: "Spaces", className: "text-right" },
    { field: "status", label: "Status" },
  ];

  return (
    <div>
      <header className="flex items-center h-14 px-6 border-b border-white/[0.06] bg-[#0A0A0A] sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-white">Users</h1>
        <span className="ml-3 text-sm text-white/40">
          {total.toLocaleString()} total
        </span>
      </header>

      <div className="p-6 space-y-4">
        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search by name, email, or handle..."
              defaultValue={search}
              onChange={(e) => {
                const value = e.target.value;
                const t = setTimeout(() => updateParams({ q: value || null, page: 1 }), 400);
                return () => clearTimeout(t);
              }}
              className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FFD700]/50"
            />
          </div>

          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value, page: 1 })}
            className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700]/50 appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending">Pending</option>
          </select>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-white/50">{selected.size} selected</span>
              <button
                onClick={() => handleBulkAction("suspend")}
                disabled={bulkLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
              >
                <NoSymbolIcon className="h-3.5 w-3.5" />
                Suspend
              </button>
              <button
                onClick={() => handleBulkAction("unsuspend")}
                disabled={bulkLoading}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Unsuspend
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white/10 text-white/70 rounded-lg hover:bg-white/15"
              >
                <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                Export
              </button>
            </div>
          )}

          {selected.size === 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-lg hover:bg-white/[0.08] ml-auto"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>

        {error && <ErrorState message={error} onRetry={fetchUsers} />}

        {loading ? (
          <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
            <TableSkeleton rows={pageSize > 10 ? 10 : pageSize} columns={7} />
          </div>
        ) : users.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
            <EmptyState
              variant={search || status !== "all" ? "no-results" : "no-data"}
              title={search ? "No users match your search" : "No users yet"}
              action={
                search || status !== "all"
                  ? { label: "Clear filters", onClick: () => updateParams({ q: null, status: null, page: null }) }
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-[#141414] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.size === users.length && users.length > 0}
                        onChange={toggleAll}
                        className="rounded border-white/20 bg-transparent accent-[#FFD700]"
                      />
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col.field}
                        onClick={() => toggleSort(col.field)}
                        className={`px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider cursor-pointer hover:text-white/80 select-none ${col.className || ""}`}
                      >
                        {col.label}
                        <SortIcon field={col.field} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      onClick={() => router.push(`/users/${user.id}`)}
                      className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(user.id)}
                          onChange={() => toggleSelect(user.id)}
                          className="rounded border-white/20 bg-transparent accent-[#FFD700]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-amber-600/20 flex items-center justify-center text-white text-xs font-medium shrink-0">
                            {user.displayName?.[0]?.toUpperCase() || "?"}
                          </div>
                          <span className="text-white font-medium truncate">
                            {user.displayName || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-white/60 truncate max-w-[200px]">
                        {user.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-white/60">
                        @{user.handle || "—"}
                      </td>
                      <td className="px-4 py-3 text-white/50">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right text-white/60">
                        {user.spaceCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/40">
                  Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => updateParams({ size: Number(e.target.value), page: 1 })}
                  className="px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded text-white text-xs focus:outline-none"
                >
                  {[10, 25, 50, 100].map((s) => (
                    <option key={s} value={s}>{s} per page</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => updateParams({ page: page - 1 })}
                  disabled={page <= 1}
                  className="p-1.5 rounded hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed text-white/60"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let p: number;
                  if (totalPages <= 5) {
                    p = i + 1;
                  } else if (page <= 3) {
                    p = i + 1;
                  } else if (page >= totalPages - 2) {
                    p = totalPages - 4 + i;
                  } else {
                    p = page - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => updateParams({ page: p })}
                      className={`px-3 py-1 rounded text-sm ${
                        p === page
                          ? "bg-[#FFD700]/20 text-[#FFD700] font-medium"
                          : "text-white/50 hover:bg-white/[0.06]"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => updateParams({ page: page + 1 })}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed text-white/60"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/20 border-t-[#FFD700]" />
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
