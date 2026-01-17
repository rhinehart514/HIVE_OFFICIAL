"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@hive/ui";

export interface HealthScoreProps {
  score: number;
}

export function HealthScore({ score }: HealthScoreProps) {
  const getScoreColor = () => {
    if (score >= 70) return "text-green-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = () => {
    if (score >= 70) return "Thriving";
    if (score >= 40) return "Growing";
    return "Needs attention";
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 transform -rotate-90">
          <circle
            cx="40"
            cy="40"
            r="35"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-neutral-800"
          />
          <motion.circle
            cx="40"
            cy="40"
            r="35"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            className={getScoreColor()}
            initial={{ strokeDasharray: "0 220" }}
            animate={{ strokeDasharray: `${score * 2.2} 220` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("text-xl font-bold", getScoreColor())}>
            {score}
          </span>
        </div>
      </div>
      <div>
        <div className={cn("text-lg font-semibold", getScoreColor())}>
          {getScoreLabel()}
        </div>
        <div className="text-xs text-neutral-500">Community health score</div>
      </div>
    </div>
  );
}
