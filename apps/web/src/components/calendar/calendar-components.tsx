"use client";

/**
 * Calendar Page Components
 * Extracted to reduce calendar/page.tsx line count
 */

import React from "react";
import { Card, Badge } from "@hive/ui";
import { ClockIcon, MapPinIcon, UsersIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import type { CalendarEvent } from "@/hooks/use-calendar";
import { getTypeColor, getTypeIcon, formatTime, formatDate } from "@/hooks/use-calendar";

// ============================================
// PAGE CONTAINER
// ============================================

interface PageContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  maxWidth?: string;
}

export function PageContainer({
  title,
  subtitle,
  children,
  actions,
  maxWidth = "6xl"
}: PageContainerProps) {
  return (
    <div className={`max-w-${maxWidth} mx-auto px-4 py-8`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-zinc-400 mt-1">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

export function CalendarLoadingSkeleton() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-6 w-48 bg-zinc-700 rounded" />
        <div className="h-4 w-64 bg-zinc-800 rounded" />
        <div className="h-64 w-full bg-zinc-900 rounded" />
      </div>
    </div>
  );
}

// ============================================
// EVENT CARD
// ============================================

interface EventCardProps {
  event: CalendarEvent;
  onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all duration-200 ${
        event.isConflict
          ? 'bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
          : 'bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getTypeColor(event.type)}`} />
          <span className="text-lg">{getTypeIcon(event.type)}</span>
        </div>
        {event.isConflict && <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />}
      </div>

      <h3 className="font-semibold text-white mb-2 leading-tight">{event.title}</h3>

      <div className="space-y-2 text-sm text-zinc-400">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-3 w-3" />
          <span>
            {formatDate(event.startTime)} • {formatTime(event.startTime)} - {formatTime(event.endTime)}
          </span>
        </div>

        {event.location && (
          <div className="flex items-center space-x-2">
            <MapPinIcon className="h-3 w-3" />
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-center space-x-2">
            <UsersIcon className="h-3 w-3" />
            <span>{event.attendees.length} attendees</span>
          </div>
        )}

        {event.space && <div className="text-life-gold text-xs">{event.space.name}</div>}
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-700">
        <Badge variant="secondary" className="text-xs capitalize">{event.source}</Badge>
        {event.rsvpStatus && (
          <Badge
            variant={event.rsvpStatus === 'going' ? 'success' : 'secondary'}
            className="text-xs capitalize"
          >
            {event.rsvpStatus}
          </Badge>
        )}
      </div>
    </Card>
  );
}
