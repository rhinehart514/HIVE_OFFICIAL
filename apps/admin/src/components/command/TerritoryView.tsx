"use client";

/**
 * Territory View
 *
 * Space ecosystem visualization for Command Center.
 * Shows bubble chart of spaces with category clustering.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  useCommandStore,
  selectTerritoryNodes,
  type TerritoryNode,
} from "@/lib/stores";
import { HiveCard, CardContent, CardHeader, CardTitle, Badge } from "@hive/ui";
import {
  BuildingOffice2Icon,
  UsersIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

interface BubbleProps {
  node: TerritoryNode;
  onClick?: (node: TerritoryNode) => void;
}

function SpaceBubble({ node, onClick }: BubbleProps) {
  const size = Math.max(40, Math.min(120, node.size * 1.5));

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onClick?.(node)}
      className="relative cursor-pointer"
      style={{
        width: size,
        height: size,
      }}
    >
      <div
        className="absolute inset-0 rounded-full flex items-center justify-center border-2 transition-all"
        style={{
          backgroundColor: `${node.color}20`,
          borderColor: node.status === "at_risk" ? "#f59e0b" : node.color,
        }}
      >
        <span
          className="text-xs font-medium text-center px-1 truncate"
          style={{ color: node.color, maxWidth: size - 10 }}
        >
          {node.name.length > 12 ? node.name.slice(0, 10) + "..." : node.name}
        </span>
      </div>

      {/* Status indicators */}
      {node.isVerified && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <CheckBadgeIcon className="h-3 w-3 text-white" />
        </div>
      )}
      {node.isFeatured && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#FFD700] rounded-full flex items-center justify-center">
          <StarIcon className="h-3 w-3 text-black" />
        </div>
      )}
      {node.status === "at_risk" && (
        <div className="absolute -top-1 -left-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
          <ExclamationTriangleIcon className="h-3 w-3 text-white" />
        </div>
      )}
    </motion.div>
  );
}

function SpaceDetail({ node, onClose }: { node: TerritoryNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-4 w-72 bg-[#111] border border-white/10 rounded-xl p-4 shadow-xl z-10"
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-white/50 hover:text-white"
      >
        &times;
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${node.color}20` }}
        >
          <BuildingOffice2Icon className="h-6 w-6" style={{ color: node.color }} />
        </div>
        <div>
          <h3 className="font-semibold text-white">{node.name}</h3>
          <p className="text-sm text-white/50">@{node.handle}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Members</span>
          <span className="text-sm text-white">{node.memberCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Posts</span>
          <span className="text-sm text-white">{node.postCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Events</span>
          <span className="text-sm text-white">{node.eventCount.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/50">Status</span>
          <Badge
            variant={node.status === "at_risk" ? "destructive" : "outline"}
            className={
              node.status === "at_risk"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                : "text-green-400"
            }
          >
            {node.status}
          </Badge>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        {node.isVerified && (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Verified</Badge>
        )}
        {node.isFeatured && (
          <Badge className="bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700]/30">Featured</Badge>
        )}
      </div>
    </motion.div>
  );
}

export function TerritoryView() {
  const nodes = useCommandStore(selectTerritoryNodes);
  const clusters = useCommandStore((state) => state.territoryClusters);
  const fetchTerritory = useCommandStore((state) => state.fetchTerritory);
  const loading = useCommandStore((state) => state.territoryLoading);
  const error = useCommandStore((state) => state.territoryError);

  const [selectedNode, setSelectedNode] = useState<TerritoryNode | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchTerritory();
  }, [fetchTerritory]);

  // Filter nodes by category
  const filteredNodes = filterCategory
    ? nodes.filter((n) => n.category === filterCategory)
    : nodes;

  // Group nodes by category for layout
  const nodesByCategory = filteredNodes.reduce((acc, node) => {
    const category = node.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push(node);
    return acc;
  }, {} as Record<string, TerritoryNode[]>);

  if (loading && nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-white/50">Loading territory data...</div>
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
      {/* Stats bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <BuildingOffice2Icon className="h-5 w-5 text-[#FFD700]" />
          <span className="text-xl font-bold text-white">{nodes.length}</span>
          <span className="text-white/50">spaces</span>
        </div>
        <div className="flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-blue-400" />
          <span className="text-xl font-bold text-white">
            {nodes.reduce((sum, n) => sum + n.memberCount, 0).toLocaleString()}
          </span>
          <span className="text-white/50">total members</span>
        </div>
        <div className="flex items-center gap-2 text-amber-400">
          <ExclamationTriangleIcon className="h-5 w-5" />
          <span className="text-xl font-bold">
            {nodes.filter((n) => n.status === "at_risk").length}
          </span>
          <span>at risk</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Category filters */}
        <HiveCard className="bg-[#111] border-white/10 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-white text-sm">Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button
              onClick={() => setFilterCategory(null)}
              className={`w-full text-left py-2 px-3 rounded-lg text-sm transition ${
                filterCategory === null
                  ? "bg-[#FFD700]/10 text-[#FFD700]"
                  : "text-white/50 hover:bg-white/5"
              }`}
            >
              All Categories ({nodes.length})
            </button>
            {clusters.map((cluster) => (
              <button
                key={cluster.category}
                onClick={() => setFilterCategory(cluster.category)}
                className={`w-full text-left py-2 px-3 rounded-lg text-sm transition ${
                  filterCategory === cluster.category
                    ? "bg-[#FFD700]/10 text-[#FFD700]"
                    : "text-white/50 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cluster.color }}
                  />
                  <span>{cluster.label}</span>
                </div>
                <span className="text-xs text-white/40 ml-4">
                  {cluster.spaceCount} spaces
                </span>
              </button>
            ))}
          </CardContent>
        </HiveCard>

        {/* Bubble visualization */}
        <HiveCard className="bg-[#111] border-white/10 lg:col-span-3 relative min-h-[500px]">
          <CardHeader>
            <CardTitle className="text-white">Space Ecosystem</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            {/* Bubble grid */}
            <div className="flex flex-wrap gap-4 justify-center items-center p-4">
              {Object.entries(nodesByCategory).map(([category, categoryNodes]) => (
                <div
                  key={category}
                  className="flex flex-wrap gap-2 p-3 rounded-xl bg-white/5 justify-center items-center"
                >
                  {categoryNodes.map((node) => (
                    <SpaceBubble
                      key={node.id}
                      node={node}
                      onClick={setSelectedNode}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Selected node detail */}
            {selectedNode && (
              <SpaceDetail
                node={selectedNode}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </CardContent>
        </HiveCard>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-white/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#FFD700]" />
          <span>Bubble size = member count</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <CheckBadgeIcon className="h-3 w-3 text-white" />
          </div>
          <span>Verified</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#FFD700] flex items-center justify-center">
            <StarIcon className="h-3 w-3 text-black" />
          </div>
          <span>Featured</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
            <ExclamationTriangleIcon className="h-3 w-3 text-white" />
          </div>
          <span>At Risk</span>
        </div>
      </div>
    </div>
  );
}
