"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { Card, cn } from "@hive/ui";

export interface TopContributor {
  userId: string;
  activityCount: number;
  fullName: string;
  handle?: string;
  photoURL?: string;
}

export interface TopContributorsProps {
  contributors?: TopContributor[];
}

export function TopContributors({ contributors }: TopContributorsProps) {
  if (!contributors || contributors.length === 0) {
    return (
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <TrophyIcon className="h-5 w-5 text-life-gold" />
          <h3 className="text-sm font-semibold text-white">Top Contributors</h3>
        </div>
        <p className="text-sm text-neutral-500 text-center py-4">
          No activity data yet
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-life-gold/20 flex items-center justify-center">
          <TrophyIcon className="h-4 w-4 text-life-gold" />
        </div>
        <h3 className="text-sm font-semibold text-white">Top Contributors</h3>
      </div>
      <div className="space-y-3">
        {contributors.slice(0, 5).map((contributor, index) => (
          <motion.div
            key={contributor.userId}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3"
          >
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                index === 0
                  ? "bg-life-gold text-black"
                  : index === 1
                    ? "bg-neutral-300 text-black"
                    : index === 2
                      ? "bg-orange-600 text-white"
                      : "bg-neutral-700 text-neutral-300"
              )}
            >
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {contributor.photoURL ? (
                  <img
                    src={contributor.photoURL}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-xs text-neutral-400">
                    {contributor.fullName.charAt(0)}
                  </div>
                )}
                <span className="text-sm text-white truncate">
                  {contributor.fullName}
                </span>
                {contributor.handle && (
                  <span className="text-xs text-neutral-500">
                    @{contributor.handle}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm font-medium text-neutral-400">
              {contributor.activityCount} actions
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
