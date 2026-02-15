"use client";

import { useEffect, useRef, useState } from "react";

interface LiveCounterProps {
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  duration?: number;
  size?: "sm" | "md" | "lg";
  color?: "default" | "gold" | "green" | "red";
}

export function LiveCounter({
  value,
  previousValue,
  prefix = "",
  suffix = "",
  label,
  duration = 1000,
  size = "md",
  color = "default",
}: LiveCounterProps) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = display;
    const to = value;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // Only re-animate when value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  const trend =
    previousValue !== undefined && previousValue !== 0
      ? ((value - previousValue) / previousValue) * 100
      : null;

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`font-bold tabular-nums ${
          { sm: "text-xl", md: "text-3xl", lg: "text-5xl" }[size]
        } ${
          { default: "text-white", gold: "text-[#FFD700]", green: "text-green-400", red: "text-red-400" }[color]
        }`}
        style={{ fontFamily: "var(--font-mono, monospace)" }}
      >
        {prefix}
        {display.toLocaleString()}
        {suffix}
      </span>
      <div className="flex items-center gap-2">
        {label && <span className="text-sm text-white/40">{label}</span>}
        {trend !== null && (
          <span
            className={`text-xs font-medium ${
              trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-white/40"
            }`}
          >
            {trend > 0 ? "↑" : trend < 0 ? "↓" : ""}
            {Math.abs(trend).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
