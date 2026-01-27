"use client";

import { useState, useEffect, useCallback } from "react";
import {
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Switch,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@hive/ui";
import { useAdminAuth } from "@/lib/auth";
import {
  FlagIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  UsersIcon,
  PercentBadgeIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const Flag = FlagIcon;
const Search = MagnifyingGlassIcon;
const Plus = PlusIcon;
const Loader2 = ArrowPathIcon;
const AlertCircle = ExclamationCircleIcon;
const CheckCircle = CheckCircleIcon;
const Settings = Cog6ToothIcon;
const Users = UsersIcon;
const Percent = PercentBadgeIcon;
const School = AcademicCapIcon;

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  category: "core" | "experimental" | "infrastructure" | "ui_ux" | "tools" | "spaces" | "admin" | "profile";
  enabled: boolean;
  rollout: {
    type: "all" | "percentage" | "users" | "schools" | "ab_test";
    percentage?: number;
    targetUsers?: string[];
    targetSchools?: string[];
  };
  metadata?: {
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  core: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  experimental: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  infrastructure: "bg-white/[0.20]/20 text-white/50 border-white/[0.12]/30",
  ui_ux: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  tools: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  spaces: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  profile: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const ROLLOUT_ICONS: Record<string, typeof Users> = {
  all: CheckCircle,
  percentage: Percent,
  users: Users,
  schools: School,
  ab_test: Settings,
};

export function FeatureFlagManagement() {
  const { admin } = useAdminAuth();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [savingFlags, setSavingFlags] = useState<Set<string>>(new Set());

  const fetchFlags = useCallback(async () => {
    if (!admin) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/admin/feature-flags", {
        headers: { Authorization: `Bearer ${admin.id}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch feature flags");
      }

      const data = await response.json();
      setFlags(data.flags || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [admin]);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const toggleFlag = async (flagId: string, enabled: boolean) => {
    if (!admin) return;

    setSavingFlags((prev) => new Set(prev).add(flagId));

    try {
      const response = await fetch(`/api/admin/feature-flags/${flagId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.id}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update flag");
      }

      // Update local state
      setFlags((prev) =>
        prev.map((flag) => (flag.id === flagId ? { ...flag, enabled } : flag))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update flag");
    } finally {
      setSavingFlags((prev) => {
        const next = new Set(prev);
        next.delete(flagId);
        return next;
      });
    }
  };

  const filteredFlags = flags.filter((flag) => {
    const matchesSearch =
      searchQuery === "" ||
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || flag.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(flags.map((f) => f.category)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-amber-500" />
            Feature Flags
          </h2>
          <p className="text-sm text-white/50 mt-1">
            Control feature rollouts and A/B tests
          </p>
        </div>
        <Button
          variant="secondary"
          className="gap-2"
          onClick={() => fetchFlags()}
        >
          <Plus className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-white/[0.08] bg-[var(--bg-void)]/50">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                placeholder="Search flags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[var(--bg-ground)] border-white/[0.08] text-white"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-[var(--bg-ground)] border-white/[0.08] text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-ground)] border-white/[0.08]">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="border-white/[0.08] bg-[var(--bg-void)]/50">
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-white">{flags.length}</div>
            <div className="text-sm text-white/50">Total Flags</div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[var(--bg-void)]/50">
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-green-400">
              {flags.filter((f) => f.enabled).length}
            </div>
            <div className="text-sm text-white/50">Enabled</div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[var(--bg-void)]/50">
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-red-400">
              {flags.filter((f) => !f.enabled).length}
            </div>
            <div className="text-sm text-white/50">Disabled</div>
          </CardContent>
        </Card>
        <Card className="border-white/[0.08] bg-[var(--bg-void)]/50">
          <CardContent className="py-4">
            <div className="text-2xl font-bold text-purple-400">
              {flags.filter((f) => f.category === "experimental").length}
            </div>
            <div className="text-sm text-white/50">Experimental</div>
          </CardContent>
        </Card>
      </div>

      {/* Flags List */}
      <Card className="border-white/[0.08] bg-[var(--bg-void)]/50">
        <CardHeader>
          <CardTitle className="text-white">
            {filteredFlags.length} Feature Flag{filteredFlags.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFlags.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/50">No feature flags found</p>
              <p className="text-sm text-white/40 mt-1">
                {searchQuery || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first feature flag to get started"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFlags.map((flag) => {
                const RolloutIcon = ROLLOUT_ICONS[flag.rollout.type] || Settings;
                const isSaving = savingFlags.has(flag.id);

                return (
                  <div
                    key={flag.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-ground)]/50 border border-white/[0.08] hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-white truncate">
                          {flag.name}
                        </h3>
                        <Badge
                          className={`text-xs border ${CATEGORY_COLORS[flag.category] || CATEGORY_COLORS.core}`}
                        >
                          {flag.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-white/40">
                          <RolloutIcon className="w-3 h-3" />
                          <span className="capitalize">{flag.rollout.type.replace("_", " ")}</span>
                          {flag.rollout.type === "percentage" && flag.rollout.percentage !== undefined && (
                            <span className="text-white/50">({flag.rollout.percentage}%)</span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-white/50 truncate">
                        {flag.description}
                      </p>
                      <p className="text-xs text-white/30 mt-1 font-mono">
                        {flag.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                      ) : (
                        <Switch
                          checked={flag.enabled}
                          onCheckedChange={(checked) => toggleFlag(flag.id, checked)}
                          className="data-[state=checked]:bg-green-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profile Flags Quick Access */}
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="text-amber-400 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Profile Feature Flags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/50 mb-4">
            Quick access to profile-related feature flags for controlling user experience.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {flags
              .filter((f) => f.category === "profile")
              .map((flag) => (
                <div
                  key={flag.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-ground)]/30 border border-white/[0.08]"
                >
                  <div>
                    <div className="font-medium text-white text-sm">{flag.name}</div>
                    <div className="text-xs text-white/40">{flag.id}</div>
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(checked) => toggleFlag(flag.id, checked)}
                    className="data-[state=checked]:bg-amber-500"
                    disabled={savingFlags.has(flag.id)}
                  />
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
