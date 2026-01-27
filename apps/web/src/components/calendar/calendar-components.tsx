"use client";

/**
 * Calendar Page Components
 * Extracted to reduce calendar/page.tsx line count
 */

import React from "react";
import { Card, Badge, MOTION } from "@hive/ui";
import { motion } from "@hive/ui/design-system/primitives";
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
          <h1 className="text-heading-lg text-[var(--text-primary)]">{title}</h1>
          {subtitle && <p className="text-body-sm text-[var(--text-secondary)] mt-1">{subtitle}</p>}
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
        <div className="h-6 w-48 bg-[var(--surface-elevated)] rounded" />
        <div className="h-4 w-64 bg-[var(--surface-subtle)] rounded" />
        <div className="h-64 w-full bg-[var(--bg-ground)] rounded" />
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
  index?: number;
}

export function EventCard({ event, onClick, index = 0 }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
        ease: MOTION.ease.premium,
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className={`p-4 cursor-pointer transition-all duration-200 ${
          event.isConflict
            ? 'bg-[var(--hive-status-error)]/10 border-[var(--hive-status-error)]/30 hover:bg-[var(--hive-status-error)]/20'
            : 'bg-[var(--surface-elevated)] border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]'
        }`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getTypeColor(event.type)}`} />
            <span className="text-lg">{getTypeIcon(event.type)}</span>
          </div>
          {event.isConflict && <ExclamationTriangleIcon className="h-4 w-4 text-[var(--hive-status-error)]" />}
        </div>

        <h3 className="text-label font-semibold text-[var(--text-primary)] mb-2 leading-tight">{event.title}</h3>

        <div className="space-y-2 text-body-sm text-[var(--text-secondary)]">
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

          {event.space && <div className="text-life-gold text-label">{event.space.name}</div>}
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <Badge variant="secondary" className="text-label capitalize">{event.source}</Badge>
          {event.rsvpStatus && (
            <Badge
              variant={event.rsvpStatus === 'going' ? 'success' : 'secondary'}
              className="text-label capitalize"
            >
              {event.rsvpStatus}
            </Badge>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
