"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card } from "@hive/ui";

export interface SimpleBarChartProps {
  data: Array<{ label: string; value: number }>;
  title: string;
  emptyMessage?: string;
}

export function SimpleBarChart({
  data,
  title,
  emptyMessage = "No data yet",
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      {data.length === 0 ? (
        <div className="py-8 text-center text-neutral-500 text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {data.slice(0, 7).map((item, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400 truncate max-w-[60%]">
                  {item.label}
                </span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-gradient-to-r from-life-gold to-life-gold/70 h-1.5 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
