'use client';

/**
 * CalendarEmptyState - Contextual empty states for calendar views
 *
 * Shows events from user's spaces. Guides users to join spaces or explore
 * if they don't have events yet.
 *
 * @version 2.0.0 - Spaces-first calendar (Feb 2026)
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Filter, Users } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export type CalendarEmptyVariant = 'day' | 'week' | 'month' | 'filtered';

interface CalendarEmptyStateProps {
  variant: CalendarEmptyVariant;
  filterType?: string;
  className?: string;
}

const VARIANT_CONFIG: Record<
  CalendarEmptyVariant,
  {
    icon: React.ElementType;
    title: string;
    subtitle: string;
  }
> = {
  day: {
    icon: Calendar,
    title: 'Nothing scheduled today',
    subtitle: 'Your day is open. Events from your spaces will appear here.',
  },
  week: {
    icon: Calendar,
    title: 'No events this week',
    subtitle: 'Your week is clear. Join spaces to see their upcoming events.',
  },
  month: {
    icon: Calendar,
    title: 'No events this month',
    subtitle: 'No upcoming events. Explore spaces to find what\'s happening.',
  },
  filtered: {
    icon: Filter,
    title: 'No matching events',
    subtitle: 'Try adjusting your filter to see more events.',
  },
};

export function CalendarEmptyState({
  variant,
  filterType,
  className,
}: CalendarEmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const subtitle = variant === 'filtered' && filterType
    ? `No ${filterType.toLowerCase()} events found. Try adjusting your filter.`
    : config.subtitle;

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Icon */}
      <motion.div
        className="w-16 h-16 rounded-xl bg-white/[0.04] flex items-center justify-center mb-5"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Icon className="w-7 h-7 text-white/30" />
      </motion.div>

      {/* Title */}
      <motion.h3
        className="text-heading-sm font-medium text-white/80 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        {config.title}
      </motion.h3>

      {/* Subtitle */}
      <motion.p
        className="text-body text-white/40 max-w-sm mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        {subtitle}
      </motion.p>

      {/* CTA - Explore spaces */}
      {variant !== 'filtered' && (
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.25 }}
        >
          <Button asChild variant="secondary">
            <Link href="/explore?tab=events">
              <Calendar className="w-4 h-4 mr-2" />
              Browse Events
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/explore">
              <Users className="w-4 h-4 mr-2" />
              Find Spaces
            </Link>
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

CalendarEmptyState.displayName = 'CalendarEmptyState';
