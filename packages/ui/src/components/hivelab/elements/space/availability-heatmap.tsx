'use client';

/**
 * AvailabilityHeatmap Element (Space Tier)
 *
 * Display member availability as a visual heatmap with best time suggestions.
 * Requires: spaceId context (leaders only).
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../design-system/primitives';
import { Button } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

interface HeatmapCell {
  hour: number;
  dayOfWeek: number;
  available: number;
  total: number;
  score: number;
}

interface Suggestion {
  dayOfWeek: number;
  hour: number;
  duration: number;
  score: number;
  label: string;
}

export function AvailabilityHeatmapElement({ config, context, onChange, onAction }: ElementProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [memberCount, setMemberCount] = useState(0);
  const [connectedCount, setConnectedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: number; hour: number } | null>(null);

  const startHour = config.startHour || 8;
  const endHour = config.endHour || 22;
  const timeFormat = config.timeFormat || '12h';
  const highlightThreshold = config.highlightThreshold || 0.7;
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    if (!context?.spaceId) return;

    const fetchAvailability = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/spaces/${context.spaceId}/availability`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setHeatmapData(data.heatmap || []);
          setSuggestions(data.suggestions || []);
          setMemberCount(data.memberCount || 0);
          setConnectedCount(data.connectedCount || 0);
          onChange?.({
            heatmap: data.heatmap,
            suggestions: data.suggestions,
            connectedMemberCount: data.connectedCount,
          });
        }
      } catch (err) {
        console.error('Failed to fetch availability:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [context?.spaceId]);

  const formatHour = (hour: number) => {
    if (timeFormat === '24h') return `${hour}:00`;
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h}${ampm}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= highlightThreshold) return 'bg-emerald-500/60';
    if (score >= 0.5) return 'bg-emerald-500/30';
    if (score >= 0.3) return 'bg-amber-500/30';
    return 'bg-neutral-800/50';
  };

  const handleSlotClick = (day: number, hour: number) => {
    setSelectedSlot({ day, hour });
    onAction?.('select_slot', { dayOfWeek: day, hour });
  };

  if (!context?.spaceId) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-sm text-muted-foreground">
          <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Connect to a space to see member availability</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">Member Availability</CardTitle>
          </div>
          <Button
            onClick={() => onAction?.('refresh', {})}
            variant="ghost"
            size="sm"
            disabled={isLoading}
          >
            <ArrowPathIcon className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription className="text-xs">
          {connectedCount} of {memberCount} members sharing calendars
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading ? (
          <div className="py-6 text-center">
            <ArrowPathIcon className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : connectedCount === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <ClockIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>No members have connected their calendars yet</p>
          </div>
        ) : (
          <>
            {/* Heatmap grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[300px]">
                {/* Day headers */}
                <div className="flex gap-0.5 mb-1 pl-10">
                  {dayNames.map((day, i) => (
                    <div key={i} className="flex-1 text-center text-label-xs text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Hour rows */}
                {Array.from({ length: endHour - startHour }, (_, i) => startHour + i).map(hour => (
                  <div key={hour} className="flex gap-0.5 mb-0.5">
                    <div className="w-10 text-right text-label-xs text-muted-foreground pr-1">
                      {formatHour(hour)}
                    </div>
                    {dayNames.map((_, day) => {
                      const cell = heatmapData.find(h => h.dayOfWeek === day && h.hour === hour);
                      const score = cell?.score || 0;
                      const isSelected = selectedSlot?.day === day && selectedSlot?.hour === hour;
                      return (
                        <div
                          key={day}
                          onClick={() => handleSlotClick(day, hour)}
                          className={`flex-1 h-4 rounded-sm cursor-pointer transition-all ${getScoreColor(score)} ${
                            isSelected ? 'ring-2 ring-white' : 'hover:ring-1 hover:ring-white/50'
                          }`}
                          title={`${dayNames[day]} ${formatHour(hour)}: ${Math.round(score * 100)}% available`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-4 mt-3 text-label-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-neutral-800/50" />
                <span>Busy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-sm bg-emerald-500/60" />
                <span>Available</span>
              </div>
            </div>

            {/* Suggestions */}
            {config.showSuggestions && suggestions.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border">
                <p className="text-xs font-medium mb-2">Best Times</p>
                <div className="space-y-1">
                  {suggestions.slice(0, 3).map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs p-2 rounded bg-emerald-500/10 cursor-pointer hover:bg-emerald-500/20"
                      onClick={() => handleSlotClick(s.dayOfWeek, s.hour)}
                    >
                      <span>{s.label}</span>
                      <span className="text-emerald-400">{Math.round(s.score * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
