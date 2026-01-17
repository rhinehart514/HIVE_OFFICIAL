"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { Card, cn } from "@hive/ui";
import { springPresets } from "@hive/tokens";

export const cardVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springPresets.snappy,
  },
};

export interface MetricCardProps {
  title: string;
  value: number;
  previousValue?: number;
  icon: React.ReactNode;
  format?: "number" | "percentage" | "decimal";
  colorClass?: string;
}

export function MetricCard({
  title,
  value,
  previousValue,
  icon,
  format = "number",
  colorClass = "text-life-gold",
}: MetricCardProps) {
  const formatValue = (val: number) => {
    switch (format) {
      case "percentage":
        return `${val}%`;
      case "decimal":
        return val.toFixed(1);
      default:
        return val.toLocaleString();
    }
  };

  const change =
    previousValue !== undefined && previousValue > 0
      ? Math.round(((value - previousValue) / previousValue) * 100)
      : undefined;

  return (
    <motion.div variants={cardVariants}>
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06] hover:bg-neutral-900/80 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 border border-white/10",
              colorClass
            )}
          >
            {icon}
          </div>
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs font-medium",
                change >= 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {change >= 0 ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3" />
              )}
              {change >= 0 ? "+" : ""}
              {change}%
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white mb-1">
          {formatValue(value)}
        </div>
        <div className="text-sm text-neutral-400">{title}</div>
      </Card>
    </motion.div>
  );
}
