'use client';

/**
 * NotificationsEmptyState - Contextual empty states for notifications
 *
 * Three states per DESIGN_GAPS.md:
 * 1. New user (never had notifications) - "Stay in the loop"
 * 2. Filtered (has notifications but filter excludes) - "Nothing here"
 * 3. Caught up (had notifications, all read/cleared) - "You're all caught up"
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Inbox, Sparkles } from 'lucide-react';
import { Button, Text } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export type NotificationsEmptyVariant = 'new_user' | 'filtered' | 'caught_up';

interface NotificationsEmptyStateProps {
  variant: NotificationsEmptyVariant;
  filterName?: string;
  className?: string;
}

const VARIANT_CONFIG: Record<
  NotificationsEmptyVariant,
  {
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    title: string;
    subtitle: string;
    showCta: boolean;
    ctaLabel?: string;
    ctaHref?: string;
  }
> = {
  new_user: {
    icon: Bell,
    iconColor: 'text-white/30',
    iconBg: 'bg-white/[0.04]',
    title: 'Stay in the loop',
    subtitle: 'Join spaces and participate to start receiving updates about activity that matters to you.',
    showCta: true,
    ctaLabel: 'Browse Spaces',
    ctaHref: '/spaces',
  },
  filtered: {
    icon: Inbox,
    iconColor: 'text-white/30',
    iconBg: 'bg-white/[0.04]',
    title: 'Nothing here',
    subtitle: 'No notifications match this filter. Try checking a different category.',
    showCta: false,
  },
  caught_up: {
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    title: "You're all caught up",
    subtitle: "Nice work! We'll let you know when there's something new.",
    showCta: false,
  },
};

export function NotificationsEmptyState({
  variant,
  filterName,
  className,
}: NotificationsEmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  const subtitle = variant === 'filtered' && filterName
    ? `No ${filterName.toLowerCase()} notifications. Try checking a different category.`
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
        className={cn(
          'w-14 h-14 rounded-xl flex items-center justify-center mb-5',
          config.iconBg
        )}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Icon className={cn('w-6 h-6', config.iconColor)} />
      </motion.div>

      {/* Title */}
      <motion.h3
        className="text-body font-medium text-white/80 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        {config.title}
      </motion.h3>

      {/* Subtitle */}
      <motion.p
        className="text-body-sm text-white/40 max-w-xs mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        {subtitle}
      </motion.p>

      {/* CTA */}
      {config.showCta && config.ctaHref && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.25 }}
        >
          <Button variant="default" size="sm" asChild>
            <Link href={config.ctaHref}>{config.ctaLabel}</Link>
          </Button>
        </motion.div>
      )}

      {/* Celebration animation for caught_up */}
      {variant === 'caught_up' && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Sparkles className="absolute top-1/4 left-1/4 w-4 h-4 text-emerald-400/20 animate-pulse" />
          <Sparkles className="absolute top-1/3 right-1/3 w-3 h-3 text-emerald-400/15 animate-pulse" style={{ animationDelay: '0.3s' }} />
        </motion.div>
      )}
    </motion.div>
  );
}

NotificationsEmptyState.displayName = 'NotificationsEmptyState';
