"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  StarIcon,
  ArchiveBoxIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface Space {
  id: string;
  name: string;
  handle?: string;
  category: string;
  memberCount: number;
  eventCount?: number;
  status: string;
  activationStatus?: string;
  isFeatured?: boolean;
  healthScore?: number;
}

interface HealthMap {
  [spaceId: string]: number;
}

type SortField = "name" | "handle" | "category" | "memberCount" | "eventCount" | "status";
type SortDir = "asc" | "desc";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "student_org", label: "Student Org" },
  { value: "university_org", label: "University Org" },
  { value: "greek_life", label: "Greek Life" },
  { value: "campus_living", label: "Campus Living" },
  { value: "hive_exclusive", label: "HIVE Exclusive" },
];

function CategoryBadge({ category }: { category: string }) {
  const colors: Record<string, string> = {
    student_org: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    university_org: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    greek_life: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    campus_living: "bg-green-500/20 text-green-400 border-green-500/30",
    hive_exclusive: "bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[category] || "bg-white/10 text-white/50 border-white/20"}`}>
      {category?.replace(/_/g, " ")}
    </span>
  );
}

function HealthDot({ score }: { score?: number }) {
  if (score == null) return <span className="w-2 h-2 rounded-full bg-white/20 inline-block" />;
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-white/40">{score}</span>
    </span>
  );
}

export default function SpacesPage() {
  const router = useRouter();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [health, setHealth] = useState<HealthMap>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category !== "all") params.set("category", category);
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      params.set("sort", sortField);
      params.set("dir", sortDir);

      const res = await fetchWithAuth(`/api/admin/spaces?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch spaces");
      const data = await res.json();
      setSpaces(data.data?.spaces || data.spaces || []);
      setTotal(data.data?.total || data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load spaces");
    } finally {
      setLoading(false);
    }
  }, [search, category, page, pageSize, sortField, sortDir]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/admin/spaces/health");
      if (res.ok) {
        const data = await res.json();
        const map: HealthMap = {};
        const items = data.data?.spaces || data.spaces || data.data || [];
        if (Array.isArray(items)) {
          items.forEach((s: { id: string; healthScore: number }) => {
            map[s.id] = s.healthScore;
          });
        }
        setHealth(map);
      }
    } catch {
      // Health endpoint optional
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const totalPages = Math.ceil(total / pageSize);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
    setPage(1);
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
    setSelected(selected.size === spaces.length ? new Set() : new Set(spaces.map((s) => s.id)));
  };

  const handleBulk = async (action: "feature" | "unfeature" | "archive") => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      for (const id of selected) {
        await fetchWithAuth(`/api/admin/spaces/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
      }
      setSelected(new Set());
      await fetchSpaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk action failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: { field: SortField; label: string; className?: string }[] = [
    { field: "name", label: "Name" },
    { field: "handle", label: "Handle" },
    { field: "category", label: "Category" },
    { field: "memberCount", label: "Members", className: "text-right" },
    { field: "eventCount", label: "Events", className: "text-right" },
    { field: "status", label: "Status" },
  ];

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <input
            type="text"
            placeholder="Search spaces..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FFD700]/50"
          />
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white text-sm focus:outline-none focus:border-[#FFD700]/50 appearance-none cursor-pointer"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-white/50">{selected.size} selected</span>
            <button
              onClick={() => handleBulk("feature")}
              disabled={bulkLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-[#FFD700]/20 text-[#FFD700] rounded-lg hover:bg-[#FFD700]/30 disabled:opacity-50"
            >
              <StarIcon className="h-3.5 w-3.5" />
              Feature
            </button>
            <button
              onClick={() => handleBulk("unfeature")}
              disabled={bulkLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white/10 text-white/60 rounded-lg hover:bg-white/15 disabled:opacity-50"
            >
              Unfeature
            </button>
            <button
              onClick={() => handleBulk("archive")}
              disabled={bulkLoading}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 disabled:opacity-50"
            >
              <ArchiveBoxIcon className="h-3.5 w-3.5" />
              Archive
            </button>
          </div>
        )}
      </div>

      {error && <ErrorState message={error} onRetry={fetchSpaces} />}

      {loading ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
          <TableSkeleton rows={10} columns={7} />
        </div>
      ) : spaces.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#141414] p-4">
          <EmptyState
            variant={search || category !== "all" ? "no-results" : "no-data"}
            title={search ? "No spaces match your search" : "No spaces yet"}
            action={
              search || category !== "all"
                ? { label: "Clear filters", onClick: () => { setSearch(""); setCategory("all"); setPage(1); } }
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
                      checked={selected.size === spaces.length && spaces.length > 0}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Health
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {spaces.map((space) => (
                  <tr
                    key={space.id}
                    onClick={() => router.push(`/spaces/${space.id}`)}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(space.id)}
                        onChange={() => toggleSelect(space.id)}
                        className="rounded border-white/20 bg-transparent accent-[#FFD700]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium truncate">{space.name}</span>
                        {space.isFeatured && (
                          <StarIconSolid className="h-3.5 w-3.5 text-[#FFD700] shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/60">
                      {space.handle ? `@${space.handle}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge category={space.category} />
                    </td>
                    <td className="px-4 py-3 text-right text-white/60">
                      {space.memberCount ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-white/60">
                      {space.eventCount ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                        space.status === "activated" || space.activationStatus === "open"
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : space.status === "frozen"
                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                          : "bg-white/10 text-white/50 border-white/20"
                      }`}>
                        {space.activationStatus || space.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <HealthDot score={space.healthScore ?? health[space.id]} />
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
                {total > 0
                  ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`
                  : "No results"}
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white/[0.04] border border-white/[0.06] rounded text-white text-xs focus:outline-none"
              >
                {[10, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>{s} per page</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded hover:bg-white/[0.06] disabled:opacity-30 text-white/60"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <span className="px-3 py-1 text-sm text-white/50">
                {page} / {totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 rounded hover:bg-white/[0.06] disabled:opacity-30 text-white/60"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
