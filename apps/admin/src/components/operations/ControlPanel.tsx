"use client";

/**
 * Control Panel
 *
 * Quick access to feature flags and system controls.
 * Designed for rapid admin actions without full page navigation.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useOperationsStore, selectFeatureFlags } from "@/lib/stores";
import {
  HiveCard,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Switch,
  Input,
} from "@hive/ui";
import {
  FlagIcon,
  Cog6ToothIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  BeakerIcon,
  ServerIcon,
  PaintBrushIcon,
  WrenchIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const categoryConfigs: CategoryConfig[] = [
  { id: "core", label: "Core", icon: BoltIcon, color: "text-blue-400", bgColor: "bg-blue-500/10" },
  { id: "experimental", label: "Experimental", icon: BeakerIcon, color: "text-purple-400", bgColor: "bg-purple-500/10" },
  { id: "infrastructure", label: "Infrastructure", icon: ServerIcon, color: "text-white/50", bgColor: "bg-white/[0.20]/10" },
  { id: "ui_ux", label: "UI/UX", icon: PaintBrushIcon, color: "text-pink-400", bgColor: "bg-pink-500/10" },
  { id: "tools", label: "Tools", icon: WrenchIcon, color: "text-orange-400", bgColor: "bg-orange-500/10" },
  { id: "spaces", label: "Spaces", icon: BuildingOffice2Icon, color: "text-cyan-400", bgColor: "bg-cyan-500/10" },
  { id: "admin", label: "Admin", icon: ShieldCheckIcon, color: "text-red-400", bgColor: "bg-red-500/10" },
  { id: "profile", label: "Profile", icon: UserIcon, color: "text-amber-400", bgColor: "bg-amber-500/10" },
];

function FlagToggle({
  flag,
  onToggle,
  saving,
}: {
  flag: { id: string; name: string; enabled: boolean; category: string };
  onToggle: (id: string, enabled: boolean) => void;
  saving: boolean;
}) {
  const category = categoryConfigs.find((c) => c.id === flag.category);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {category && (
          <div className={`w-8 h-8 rounded-lg ${category.bgColor} flex items-center justify-center flex-shrink-0`}>
            <category.icon className={`h-4 w-4 ${category.color}`} />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-medium text-white text-sm truncate">{flag.name}</div>
          <div className="text-xs text-white/40 font-mono truncate">{flag.id}</div>
        </div>
      </div>
      <div className="ml-4">
        {saving ? (
          <ArrowPathIcon className="h-4 w-4 text-amber-400 animate-spin" />
        ) : (
          <Switch
            checked={flag.enabled}
            onCheckedChange={(checked) => onToggle(flag.id, checked)}
            className="data-[state=checked]:bg-green-500"
          />
        )}
      </div>
    </motion.div>
  );
}

function CategorySection({
  category,
  flags,
  onToggle,
  savingFlags,
}: {
  category: CategoryConfig;
  flags: { id: string; name: string; enabled: boolean; category: string }[];
  onToggle: (id: string, enabled: boolean) => void;
  savingFlags: Set<string>;
}) {
  const Icon = category.icon;
  const enabledCount = flags.filter((f) => f.enabled).length;

  return (
    <HiveCard className={`${category.bgColor} border-white/10`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${category.color}`} />
            {category.label}
          </div>
          <Badge variant="outline" className="text-xs">
            {enabledCount}/{flags.length} on
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {flags.map((flag) => (
          <FlagToggle
            key={flag.id}
            flag={flag}
            onToggle={onToggle}
            saving={savingFlags.has(flag.id)}
          />
        ))}
      </CardContent>
    </HiveCard>
  );
}

export function ControlPanel() {
  const flags = useOperationsStore(selectFeatureFlags);
  const fetchFeatureFlags = useOperationsStore((state) => state.fetchFeatureFlags);
  const toggleFlagAction = useOperationsStore((state) => state.toggleFlag);
  const loading = useOperationsStore((state) => state.flagsLoading);
  const error = useOperationsStore((state) => state.flagsError);

  const [searchQuery, setSearchQuery] = useState("");
  const [savingFlags, setSavingFlags] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  const handleToggle = async (flagId: string, _enabled: boolean) => {
    setSavingFlags((prev) => new Set(prev).add(flagId));
    try {
      // Store's toggleFlag handles the toggle internally
      await toggleFlagAction(flagId);
    } finally {
      setSavingFlags((prev) => {
        const next = new Set(prev);
        next.delete(flagId);
        return next;
      });
    }
  };

  // Filter flags based on search and category
  const filteredFlags = flags.filter((flag) => {
    const matchesSearch =
      searchQuery === "" ||
      flag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flag.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === null || flag.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Group flags by category
  const flagsByCategory = categoryConfigs.reduce((acc, category) => {
    const categoryFlags = filteredFlags.filter((f) => f.category === category.id);
    if (categoryFlags.length > 0) {
      acc[category.id] = categoryFlags;
    }
    return acc;
  }, {} as Record<string, typeof flags>);

  // Stats
  const totalFlags = flags.length;
  const enabledFlags = flags.filter((f) => f.enabled).length;
  const experimentalEnabled = flags.filter((f) => f.category === "experimental" && f.enabled).length;

  if (loading && flags.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-white/50">
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
          Loading feature flags...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
            <Cog6ToothIcon className="h-5 w-5 text-[#FFD700]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Control Panel</h2>
            <p className="text-sm text-white/50">
              Feature flags and system controls
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchFeatureFlags()}
          disabled={loading}
          className="gap-2"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <HiveCard className="bg-[#111] border-white/10">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-white">{totalFlags}</div>
            <div className="text-sm text-white/50">Total Flags</div>
          </CardContent>
        </HiveCard>
        <HiveCard className="bg-[#111] border-white/10">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-400">{enabledFlags}</div>
            <div className="text-sm text-white/50">Enabled</div>
          </CardContent>
        </HiveCard>
        <HiveCard className="bg-[#111] border-white/10">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-white/50">{totalFlags - enabledFlags}</div>
            <div className="text-sm text-white/50">Disabled</div>
          </CardContent>
        </HiveCard>
        <HiveCard className="bg-[#111] border-white/10">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-400">{experimentalEnabled}</div>
            <div className="text-sm text-white/50">Experimental</div>
          </CardContent>
        </HiveCard>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            placeholder="Search flags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#111] border-white/10 text-white"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className={selectedCategory === null ? "bg-[#FFD700] text-black" : ""}
          >
            All
          </Button>
          {categoryConfigs.map((category) => {
            const count = flags.filter((f) => f.category === category.id).length;
            if (count === 0) return null;

            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`gap-1 ${selectedCategory === category.id ? `${category.bgColor} ${category.color}` : ""}`}
              >
                <category.icon className="h-3 w-3" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Flags by category */}
      {Object.keys(flagsByCategory).length === 0 ? (
        <HiveCard className="bg-[#111] border-white/10">
          <CardContent className="py-12 text-center">
            <FlagIcon className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <p className="text-white/50">No flags match your search</p>
          </CardContent>
        </HiveCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categoryConfigs.map((category) => {
            const categoryFlags = flagsByCategory[category.id];
            if (!categoryFlags) return null;

            return (
              <CategorySection
                key={category.id}
                category={category}
                flags={categoryFlags}
                onToggle={handleToggle}
                savingFlags={savingFlags}
              />
            );
          })}
        </div>
      )}

      {/* Warning for experimental flags */}
      {experimentalEnabled > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <HiveCard className="bg-amber-500/5 border-amber-500/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">
                    {experimentalEnabled} experimental feature{experimentalEnabled !== 1 ? "s" : ""} enabled
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Experimental features may be unstable. Monitor for issues.
                  </p>
                </div>
              </div>
            </CardContent>
          </HiveCard>
        </motion.div>
      )}
    </div>
  );
}
