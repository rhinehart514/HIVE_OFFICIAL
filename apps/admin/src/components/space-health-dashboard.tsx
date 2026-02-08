"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Button,
  HiveCard as Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Progress,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@hive/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  WrenchIcon,
  TrophyIcon,
  StarIcon,
  StarIcon as StarOffIcon,
  ChartBarIcon,
  EyeIcon,
  ArrowTopRightOnSquareIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronRightIcon,
  BoltIcon,
  ClockIcon,
  HashtagIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const Rocket = RocketLaunchIcon;
const AlertTriangle = ExclamationTriangleIcon;
const CheckCircle = CheckCircleIcon;
const Users = UsersIcon;
const MessageSquare = ChatBubbleLeftIcon;
const Wrench = WrenchIcon;
const Crown = TrophyIcon;
const Star = StarIcon;
const StarOff = StarOffIcon;
const Activity = ChartBarIcon;
const Eye = EyeIcon;
const ExternalLink = ArrowTopRightOnSquareIcon;
const RefreshCw = ArrowPathIcon;
const Search = MagnifyingGlassIcon;
const ChevronRight = ChevronRightIcon;
const Zap = BoltIcon;
const Clock = ClockIcon;
const Hash = HashtagIcon;
import { BarChart, PieChart } from "./charts";

interface SpaceHealth {
  id: string;
  name: string;
  handle: string;
  category: string;
  imageUrl?: string;
  isVerified: boolean;
  isActive: boolean;
  isFeatured: boolean;
  memberCount: number;
  messageCount: number;
  toolCount: number;
  boardCount: number;
  messagesLast7d: number;
  activeMembers7d: number;
  newMembers7d: number;
  leaderId?: string;
  leaderName?: string;
  leaderHandle?: string;
  leaderLastActive?: string;
  readinessScore: number;
  readinessBreakdown: {
    hasLeader: boolean;
    hasDescription: boolean;
    hasImage: boolean;
    hasTools: boolean;
    hasMembers: boolean;
    hasRecentActivity: boolean;
  };
  needsAttention: boolean;
  attentionReasons: string[];
  createdAt: string;
  lastActivityAt?: string;
}

interface HealthStats {
  total: number;
  launchReady: number;
  almostReady: number;
  needsWork: number;
  needsAttention: number;
  withLeaders: number;
  verified: number;
  avgReadiness: number;
  totalMembers: number;
  totalMessages7d: number;
}

type SortBy = "readiness" | "activity" | "members" | "messages" | "name";
type ReadinessFilter = "all" | "ready" | "almost" | "needsWork";

export function SpaceHealthDashboard() {
  const [spaces, setSpaces] = useState<SpaceHealth[]>([]);
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("readiness");
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [hasLeaderFilter, setHasLeaderFilter] = useState<"all" | "true" | "false">("all");

  const [selectedSpace, setSelectedSpace] = useState<SpaceHealth | null>(null);
  const [_detailLoading, _setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSpaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        sortBy,
        sortOrder: "desc",
        hasLeader: hasLeaderFilter,
        limit: "100",
      });

      if (readinessFilter === "ready") {
        params.set("minReadiness", "80");
      } else if (readinessFilter === "almost") {
        params.set("minReadiness", "50");
        params.set("maxReadiness", "79");
      } else if (readinessFilter === "needsWork") {
        params.set("maxReadiness", "49");
      }

      if (categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }

      const response = await fetch(`/api/admin/spaces/health?${params}`);
      const data = await response.json();

      if (data.success) {
        setSpaces(data.data.spaces);
        setStats(data.data.stats);
      } else {
        setError(data.error?.message || "Failed to fetch space health");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [sortBy, readinessFilter, categoryFilter, hasLeaderFilter]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const handleFeatureSpace = async (spaceId: string, featured: boolean) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/spaces/${spaceId}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });

      const data = await response.json();
      if (data.success) {
        fetchSpaces();
        if (selectedSpace?.id === spaceId) {
          setSelectedSpace({ ...selectedSpace, isFeatured: featured });
        }
      }
    } catch {
      console.error("Failed to update feature status");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredSpaces = spaces.filter((space) =>
    space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    space.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getReadinessColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return "Launch Ready";
    if (score >= 50) return "Almost Ready";
    return "Needs Work";
  };

  const categories = [...new Set(spaces.map((s) => s.category))].filter(Boolean);

  // Chart data
  const readinessDistribution = stats
    ? [
        { name: "Launch Ready", value: stats.launchReady, color: "#22C55E" },
        { name: "Almost Ready", value: stats.almostReady, color: "#EAB308" },
        { name: "Needs Work", value: stats.needsWork, color: "#EF4444" },
      ]
    : [];

  const topCategories = spaces
    .reduce((acc, space) => {
      const cat = space.category || "uncategorized";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(topCategories)
    .map(([name, count]) => ({ name, value: count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">
            Space Health Dashboard
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Launch readiness and cross-slice space metrics
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSpaces}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Rocket className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {stats.launchReady}
                  </p>
                  <p className="text-xs text-zinc-500">Launch Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Zap className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {stats.almostReady}
                  </p>
                  <p className="text-xs text-zinc-500">Almost Ready</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {stats.needsAttention}
                  </p>
                  <p className="text-xs text-zinc-500">Needs Attention</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Crown className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {stats.withLeaders}
                  </p>
                  <p className="text-xs text-zinc-500">With Leaders</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {stats.totalMembers.toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500">Total Members</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800">
                  <Activity className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-zinc-100">
                    {stats.avgReadiness}%
                  </p>
                  <p className="text-xs text-zinc-500">Avg Readiness</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Readiness Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readinessDistribution.length > 0 ? (
              <PieChart data={readinessDistribution} height={200} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-zinc-500">
                No data
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Spaces by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <BarChart data={categoryData} height={200} />
            ) : (
              <div className="h-[200px] flex items-center justify-center text-zinc-500">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-zinc-900/50 border-zinc-700"
          />
        </div>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
          <SelectTrigger className="w-[140px] bg-zinc-900/50 border-zinc-700">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="readiness">Readiness</SelectItem>
            <SelectItem value="activity">Activity</SelectItem>
            <SelectItem value="members">Members</SelectItem>
            <SelectItem value="messages">Messages</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={readinessFilter}
          onValueChange={(v) => setReadinessFilter(v as ReadinessFilter)}
        >
          <SelectTrigger className="w-[140px] bg-zinc-900/50 border-zinc-700">
            <SelectValue placeholder="Readiness" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="ready">Launch Ready</SelectItem>
            <SelectItem value="almost">Almost Ready</SelectItem>
            <SelectItem value="needsWork">Needs Work</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={hasLeaderFilter}
          onValueChange={(v) =>
            setHasLeaderFilter(v as "all" | "true" | "false")
          }
        >
          <SelectTrigger className="w-[140px] bg-zinc-900/50 border-zinc-700">
            <SelectValue placeholder="Leader" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Has Leader</SelectItem>
            <SelectItem value="false">No Leader</SelectItem>
          </SelectContent>
        </Select>

        {categories.length > 0 && (
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v)}
          >
            <SelectTrigger className="w-[160px] bg-zinc-900/50 border-zinc-700">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {/* Spaces Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredSpaces.map((space) => (
            <motion.div
              key={space.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card
                className={`bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer ${
                  space.needsAttention ? "border-l-2 border-l-red-500" : ""
                }`}
                onClick={() => setSelectedSpace(space)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {space.imageUrl ? (
                        <img
                          src={space.imageUrl}
                          alt={space.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center">
                          <Hash className="h-5 w-5 text-zinc-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-zinc-100 flex items-center gap-2">
                          {space.name}
                          {space.isVerified && (
                            <CheckCircle className="h-4 w-4 text-blue-400" />
                          )}
                          {space.isFeatured && (
                            <Star className="h-4 w-4 text-amber-400" />
                          )}
                        </h3>
                        <p className="text-sm text-zinc-500">@{space.handle}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getReadinessColor(space.readinessScore)}`}
                    >
                      {space.readinessScore}%
                    </Badge>
                  </div>

                  {/* Readiness Progress */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-zinc-500">Launch Readiness</span>
                      <span className={getReadinessColor(space.readinessScore)}>
                        {getReadinessLabel(space.readinessScore)}
                      </span>
                    </div>
                    <Progress
                      value={space.readinessScore}
                      className="h-2"
                    />
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                    <div>
                      <p className="text-lg font-semibold text-zinc-100">
                        {space.memberCount}
                      </p>
                      <p className="text-xs text-zinc-500">Members</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-zinc-100">
                        {space.messagesLast7d}
                      </p>
                      <p className="text-xs text-zinc-500">Msgs/7d</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-zinc-100">
                        {space.toolCount}
                      </p>
                      <p className="text-xs text-zinc-500">Tools</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-zinc-100">
                        {space.boardCount}
                      </p>
                      <p className="text-xs text-zinc-500">Boards</p>
                    </div>
                  </div>

                  {/* Leader Info */}
                  {space.leaderName && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-3">
                      <Crown className="h-4 w-4 text-amber-400" />
                      <span>{space.leaderName}</span>
                      <span className="text-zinc-600">@{space.leaderHandle}</span>
                    </div>
                  )}

                  {/* Attention Reasons */}
                  {space.needsAttention && space.attentionReasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {space.attentionReasons.map((reason, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs border-red-500/30 text-red-400"
                        >
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-800">
                    <Badge variant="outline" className="text-xs text-zinc-500">
                      {space.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeatureSpace(space.id, !space.isFeatured);
                        }}
                        disabled={actionLoading}
                        className="h-8 w-8 p-0"
                      >
                        {space.isFeatured ? (
                          <StarOff className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Star className="h-4 w-4 text-zinc-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSpace(space);
                        }}
                      >
                        <ChevronRight className="h-4 w-4 text-zinc-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {!loading && filteredSpaces.length === 0 && (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-400 mb-2">
            No spaces found
          </h3>
          <p className="text-sm text-zinc-500">
            Try adjusting your filters
          </p>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet
        open={!!selectedSpace}
        onOpenChange={(open) => !open && setSelectedSpace(null)}
      >
        <SheetContent className="w-full sm:max-w-lg bg-zinc-900 border-zinc-800 overflow-y-auto">
          {selectedSpace && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-zinc-100">
                  {selectedSpace.imageUrl ? (
                    <img
                      src={selectedSpace.imageUrl}
                      alt={selectedSpace.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Hash className="h-6 w-6 text-zinc-500" />
                    </div>
                  )}
                  <div>
                    <span className="flex items-center gap-2">
                      {selectedSpace.name}
                      {selectedSpace.isVerified && (
                        <CheckCircle className="h-4 w-4 text-blue-400" />
                      )}
                    </span>
                    <span className="text-sm text-zinc-500 font-normal">
                      @{selectedSpace.handle}
                    </span>
                  </div>
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Space health details
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 mt-6">
                {/* Readiness Score */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-3">
                    Launch Readiness
                  </h4>
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`text-4xl font-bold ${getReadinessColor(
                        selectedSpace.readinessScore
                      )}`}
                    >
                      {selectedSpace.readinessScore}%
                    </div>
                    <div>
                      <p
                        className={`font-medium ${getReadinessColor(
                          selectedSpace.readinessScore
                        )}`}
                      >
                        {getReadinessLabel(selectedSpace.readinessScore)}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {selectedSpace.readinessScore >= 80
                          ? "Ready for soft launch"
                          : selectedSpace.readinessScore >= 50
                          ? "Almost there"
                          : "Needs attention"}
                      </p>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-2">
                    {Object.entries(selectedSpace.readinessBreakdown).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-2 rounded bg-zinc-800/50"
                        >
                          <span className="text-sm text-zinc-400 capitalize">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace("has", "Has")
                              .trim()}
                          </span>
                          {value ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Attention Reasons */}
                {selectedSpace.needsAttention &&
                  selectedSpace.attentionReasons.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-zinc-400 mb-3">
                        Attention Required
                      </h4>
                      <div className="space-y-2">
                        {selectedSpace.attentionReasons.map((reason, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20"
                          >
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                            <span className="text-sm text-red-400">
                              {reason}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Metrics */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-3">
                    Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded bg-zinc-800/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-zinc-500">Members</span>
                      </div>
                      <p className="text-xl font-semibold text-zinc-100">
                        {selectedSpace.memberCount}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-zinc-800/50">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare className="h-4 w-4 text-green-400" />
                        <span className="text-sm text-zinc-500">Messages</span>
                      </div>
                      <p className="text-xl font-semibold text-zinc-100">
                        {selectedSpace.messageCount}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-zinc-800/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Wrench className="h-4 w-4 text-purple-400" />
                        <span className="text-sm text-zinc-500">Tools</span>
                      </div>
                      <p className="text-xl font-semibold text-zinc-100">
                        {selectedSpace.toolCount}
                      </p>
                    </div>
                    <div className="p-3 rounded bg-zinc-800/50">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity className="h-4 w-4 text-amber-400" />
                        <span className="text-sm text-zinc-500">7d Activity</span>
                      </div>
                      <p className="text-xl font-semibold text-zinc-100">
                        {selectedSpace.messagesLast7d}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Leader Info */}
                {selectedSpace.leaderId && (
                  <div>
                    <h4 className="text-sm font-medium text-zinc-400 mb-3">
                      Space Leader
                    </h4>
                    <div className="p-3 rounded bg-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <Crown className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="font-medium text-zinc-100">
                            {selectedSpace.leaderName}
                          </p>
                          <p className="text-sm text-zinc-500">
                            @{selectedSpace.leaderHandle}
                          </p>
                        </div>
                      </div>
                      {selectedSpace.leaderLastActive && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-zinc-500">
                          <Clock className="h-4 w-4" />
                          <span>
                            Last active:{" "}
                            {new Date(
                              selectedSpace.leaderLastActive
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-3">
                    Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() =>
                        handleFeatureSpace(
                          selectedSpace.id,
                          !selectedSpace.isFeatured
                        )
                      }
                      disabled={actionLoading}
                    >
                      {selectedSpace.isFeatured ? (
                        <>
                          <StarOff className="h-4 w-4" />
                          Remove from Featured
                        </>
                      ) : (
                        <>
                          <Star className="h-4 w-4" />
                          Feature Space
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      asChild
                    >
                      <a
                        href={`/spaces/${selectedSpace.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Space
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                      asChild
                    >
                      <a
                        href={`/admin/dashboard?tab=moderation&spaceId=${selectedSpace.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Eye className="h-4 w-4" />
                        View Moderation Queue
                      </a>
                    </Button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>Created: {new Date(selectedSpace.createdAt).toLocaleDateString()}</p>
                  {selectedSpace.lastActivityAt && (
                    <p>
                      Last Activity:{" "}
                      {new Date(selectedSpace.lastActivityAt).toLocaleDateString()}
                    </p>
                  )}
                  <p>Category: {selectedSpace.category}</p>
                  <p>Space ID: {selectedSpace.id}</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
