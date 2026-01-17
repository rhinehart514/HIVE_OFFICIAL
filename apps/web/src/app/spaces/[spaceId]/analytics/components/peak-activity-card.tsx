"use client";

import * as React from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { Card } from "@hive/ui";

export interface PeakActivityTimes {
  hour: { hour: number; count: number } | null;
  day: { day: string; dayIndex: number; count: number } | null;
  hourlyBreakdown: Record<number, number>;
  dailyBreakdown: Record<number, number>;
}

export interface PeakActivityCardProps {
  peakTimes?: PeakActivityTimes;
}

export function PeakActivityCard({ peakTimes }: PeakActivityCardProps) {
  if (!peakTimes) {
    return (
      <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <ClockIcon className="h-5 w-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">
            Peak Activity Times
          </h3>
        </div>
        <p className="text-sm text-neutral-500 text-center py-4">
          Not enough data yet
        </p>
      </Card>
    );
  }

  const formatHour = (hour: number) => {
    if (hour === 0) return "12 AM";
    if (hour === 12) return "12 PM";
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  };

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    count: peakTimes.hourlyBreakdown?.[i] || 0,
  }));
  const maxHourly = Math.max(...hourlyData.map((h) => h.count), 1);

  return (
    <Card className="p-5 bg-neutral-900/60 backdrop-blur-sm border-white/[0.06]">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-cyan-400/20 flex items-center justify-center">
          <ClockIcon className="h-4 w-4 text-cyan-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">Peak Activity Times</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {peakTimes.day && (
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="text-xs text-neutral-400 mb-1">Best Day</div>
            <div className="text-lg font-bold text-white">
              {peakTimes.day.day}
            </div>
            <div className="text-xs text-neutral-500">
              {peakTimes.day.count} actions
            </div>
          </div>
        )}
        {peakTimes.hour && (
          <div className="p-3 bg-white/5 rounded-lg">
            <div className="text-xs text-neutral-400 mb-1">Best Time</div>
            <div className="text-lg font-bold text-white">
              {formatHour(peakTimes.hour.hour)}
            </div>
            <div className="text-xs text-neutral-500">
              {peakTimes.hour.count} actions
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="text-xs text-neutral-400 mb-2">Activity by Hour</div>
        <div className="flex items-end gap-0.5 h-12">
          {hourlyData.map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-cyan-400/40 rounded-t-sm transition-all hover:bg-cyan-400"
              style={{
                height: `${Math.max((h.count / maxHourly) * 100, 4)}%`,
              }}
              title={`${formatHour(h.hour)}: ${h.count} actions`}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-neutral-500 mt-1">
          <span>12a</span>
          <span>6a</span>
          <span>12p</span>
          <span>6p</span>
          <span>12a</span>
        </div>
      </div>
    </Card>
  );
}
