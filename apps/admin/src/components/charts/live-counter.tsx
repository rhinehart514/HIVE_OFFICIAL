"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

// Aliases for lucide compatibility
const TrendingUp = ArrowTrendingUpIcon;
const TrendingDown = ArrowTrendingDownIcon;
const Minus = MinusIcon;

interface LiveCounterProps {
  value: number;
  previousValue?: number;
  label: string;
  format?: "number" | "percent" | "currency";
  prefix?: string;
  suffix?: string;
  showTrend?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "default" | "gold" | "green" | "red";
  pulseOnChange?: boolean;
}

export function LiveCounter({
  value,
  previousValue,
  label,
  format = "number",
  prefix = "",
  suffix = "",
  showTrend = true,
  size = "md",
  color = "default",
  pulseOnChange = true,
}: LiveCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);

  const formatValue = (val: number) => {
    switch (format) {
      case "percent":
        return `${val.toFixed(1)}%`;
      case "currency":
        return `$${val.toLocaleString()}`;
      default:
        return val.toLocaleString();
    }
  };

  const trend = previousValue !== undefined ? value - previousValue : 0;
  const trendPercent =
    previousValue !== undefined && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : 0;

  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  const colorClasses = {
    default: "text-white",
    gold: "text-[#FFD700]",
    green: "text-green-400",
    red: "text-red-400",
  };

  const TrendIcon =
    trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-white/50";

  return (
    <div className="flex flex-col gap-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={displayValue}
          initial={pulseOnChange ? { scale: 1.05, opacity: 0.7 } : false}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0.7 }}
          transition={{ duration: 0.15 }}
          className={`font-bold ${sizeClasses[size]} ${colorClasses[color]} ${
            isAnimating && pulseOnChange ? "animate-pulse" : ""
          }`}
        >
          {prefix}
          {formatValue(displayValue)}
          {suffix}
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <span className="text-sm text-white/50">{label}</span>
        {showTrend && previousValue !== undefined && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            <span>
              {trendPercent > 0 ? "+" : ""}
              {trendPercent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
