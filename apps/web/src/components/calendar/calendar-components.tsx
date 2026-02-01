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

/**
 * CalendarLoadingSkeleton - Premium skeleton for calendar page
 *
 * Matches the calendar page layout:
 * - Header with title, subtitle, and action buttons
 * - View mode toggle (day/week/month)
 * - Navigation controls with month title
 * - Event cards grid
 *
 * Uses staggered wave animation (0.15s delay between elements)
 * Base color: white/[0.08] per design tokens
 */
export function CalendarLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <motion.div
            className="h-7 w-24 bg-white/[0.08] rounded mb-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: MOTION.ease.premium }}
          />
          <motion.div
            className="h-4 w-56 bg-white/[0.08] rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1, ease: MOTION.ease.premium }}
          />
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <motion.div
            className="h-9 w-20 bg-white/[0.08] rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.15, ease: MOTION.ease.premium }}
          />
          <motion.div
            className="h-9 w-24 bg-white/[0.08] rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: MOTION.ease.premium }}
          />
          <motion.div
            className="h-9 w-28 bg-[var(--life-gold)]/20 rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.25, ease: MOTION.ease.premium }}
          />
        </div>
      </div>

      {/* View mode toggle + Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Prev/Next + Month */}
          <div className="flex items-center gap-2">
            <motion.div
              className="h-9 w-9 bg-white/[0.08] rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3, ease: MOTION.ease.premium }}
            />
            <motion.div
              className="h-7 w-44 bg-white/[0.08] rounded"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.35, ease: MOTION.ease.premium }}
            />
            <motion.div
              className="h-9 w-9 bg-white/[0.08] rounded-lg"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4, ease: MOTION.ease.premium }}
            />
          </div>
          <motion.div
            className="h-9 w-16 bg-white/[0.08] rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.45, ease: MOTION.ease.premium }}
          />
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2">
          <motion.div
            className="h-4 w-4 bg-white/[0.08] rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5, ease: MOTION.ease.premium }}
          />
          <motion.div
            className="h-8 w-32 bg-white/[0.08] rounded-lg"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.55, ease: MOTION.ease.premium }}
          />
        </div>
      </div>

      {/* Event cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.div
            key={i}
            className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.6 + i * 0.1,
              ease: MOTION.ease.premium,
            }}
          >
            {/* Event type indicator */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full bg-white/[0.08]"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.65 + i * 0.1, ease: MOTION.ease.premium }}
                />
                <motion.div
                  className="w-5 h-5 bg-white/[0.08] rounded"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.7 + i * 0.1, ease: MOTION.ease.premium }}
                />
              </div>
            </div>

            {/* Event title */}
            <motion.div
              className="h-5 w-3/4 bg-white/[0.08] rounded mb-3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 + i * 0.1, ease: MOTION.ease.premium }}
            />

            {/* Event details */}
            <div className="space-y-2">
              <motion.div
                className="h-3 w-full bg-white/[0.06] rounded"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 + i * 0.1, ease: MOTION.ease.premium }}
              />
              <motion.div
                className="h-3 w-2/3 bg-white/[0.06] rounded"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.85 + i * 0.1, ease: MOTION.ease.premium }}
              />
            </div>

            {/* Footer badges */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.06]">
              <motion.div
                className="h-5 w-16 bg-white/[0.08] rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.9 + i * 0.1, ease: MOTION.ease.premium }}
              />
              <motion.div
                className="h-5 w-14 bg-white/[0.08] rounded-full"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.95 + i * 0.1, ease: MOTION.ease.premium }}
              />
            </div>
          </motion.div>
        ))}
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
