"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { LightBulbIcon } from "@heroicons/react/24/outline";
import { Card } from "@hive/ui";

export interface InsightCardProps {
  insights: string[];
}

export function InsightCard({ insights }: InsightCardProps) {
  if (insights.length === 0) {
    return (
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <div className="flex items-center gap-3 mb-3">
          <LightBulbIcon className="h-5 w-5 text-life-gold" />
          <h3 className="text-sm font-semibold text-white">Insights</h3>
        </div>
        <p className="text-sm text-neutral-500">
          Keep growing your space to unlock insights!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-life-gold/20 flex items-center justify-center">
          <LightBulbIcon className="h-4 w-4 text-life-gold" />
        </div>
        <h3 className="text-sm font-semibold text-white">
          Insights & Recommendations
        </h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5"
          >
            <div className="w-5 h-5 rounded-full bg-life-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-bold text-life-gold">
                {index + 1}
              </span>
            </div>
            <p className="text-sm text-neutral-300">{insight}</p>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
