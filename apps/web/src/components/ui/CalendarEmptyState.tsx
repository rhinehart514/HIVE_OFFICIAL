'use client';

/**
 * CalendarEmptyState - Contextual empty states for calendar views
 *
 * Three states per DESIGN_GAPS.md:
 * 1. No events for timeframe - "No events this week"
 * 2. No events of type - "No [type] events"
 * 3. New user - "Your schedule starts here"
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CalendarPlus, Filter, Sparkles } from 'lucide-react';
import { Button, Text } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export type CalendarEmptyVariant = 'day' | 'week' | 'month' | 'filtered' | 'new_user';

interface CalendarEmptyStateProps {
  variant: CalendarEmptyVariant;
  filterType?: string;
  onCreateEvent?: () => void;
  className?: string;
}

const VARIANT_CONFIG: Record<
  CalendarEmptyVariant,
  {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    showCreateCta: boolean;
  }
> = {
  day: {
    icon: Calendar,
    title: 'Nothing scheduled today',
    subtitle: 'Your day is wide open. Add an event or browse what\'s happening on campus.',
    showCreateCta: true,
  },
  week: {
    icon: Calendar,
    title: 'No events this week',
    subtitle: 'Your week looks clear. Create something or explore campus events.',
    showCreateCta: true,
  },
  month: {
    icon: Calendar,
    title: 'No events this month',
    subtitle: 'A blank slate. Start planning by adding your first event.',
    showCreateCta: true,
  },
  filtered: {
    icon: Filter,
    title: 'No matching events',
    subtitle: 'Try adjusting your filter to see more events.',
    showCreateCta: false,
  },
  new_user: {
    icon: CalendarPlus,
    title: 'Your schedule starts here',
    subtitle: 'Add events, sync your campus calendar, and never miss what matters.',
    showCreateCta: true,
  },
};

export function CalendarEmptyState({
  variant,
  filterType,
  onCreateEvent,
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

      {/* CTAs */}
      {config.showCreateCta && onCreateEvent && (
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.25 }}
        >
          <Button
            onClick={onCreateEvent}
            className="bg-[var(--life-gold)] text-[var(--bg-ground)] hover:bg-[var(--life-gold)]/90"
          >
            <CalendarPlus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </motion.div>
      )}

      {/* New user decoration */}
      {variant === 'new_user' && (
        <motion.div
          className="mt-8 flex items-center gap-2 text-label text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Calendar sync coming soon</span>
        </motion.div>
      )}
    </motion.div>
  );
}

CalendarEmptyState.displayName = 'CalendarEmptyState';
