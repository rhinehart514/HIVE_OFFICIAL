'use client';

/**
 * FeedEmptyState - Unified empty state component for feed sections
 *
 * Consistent messaging and actions across all feed sections.
 * Includes subtle animation for engagement without distraction.
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Users, Sparkles, Wrench, Compass } from 'lucide-react';
import { GlassSurface, Button, MOTION } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================

export type EmptyStateVariant =
  | 'today'
  | 'spaces'
  | 'events'
  | 'creations'
  | 'discover'
  | 'page';

interface EmptyStateConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  message: string;
  action: { label: string; href: string } | null;
}

// ============================================
// COPY & CONFIG
// ============================================

const EMPTY_CONFIG: Record<EmptyStateVariant, EmptyStateConfig> = {
  today: {
    icon: Calendar,
    title: 'Your day is open',
    message: 'Find something happening on campus.',
    action: { label: 'Browse events', href: '/explore?tab=events' },
  },
  spaces: {
    icon: Users,
    title: 'No spaces yet',
    message: 'Join communities that match your interests.',
    action: { label: 'Explore spaces', href: '/explore?tab=spaces' },
  },
  events: {
    icon: Calendar,
    title: 'Nothing this week',
    message: 'Check back soon or explore what\'s happening.',
    action: { label: 'All events', href: '/explore?tab=events' },
  },
  creations: {
    icon: Wrench,
    title: 'Start building',
    message: 'Create tools for your campus.',
    action: { label: 'Open HiveLab', href: '/lab' },
  },
  discover: {
    icon: Sparkles,
    title: 'All caught up',
    message: 'You\'ve seen all recommendations.',
    action: null,
  },
  page: {
    icon: Compass,
    title: 'Your campus is quiet',
    message: 'Be the first to start something.',
    action: { label: 'Create a space', href: '/spaces/create' },
  },
};

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.duration.base,
      ease: MOTION.ease.premium,
    },
  },
};

const iconPulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.7, 0.5],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

const buttonVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION.duration.base,
      ease: MOTION.ease.premium,
      delay: 0.2,
    },
  },
};

// ============================================
// COMPONENT
// ============================================

interface FeedEmptyStateProps {
  variant: EmptyStateVariant;
  /** Override the default action */
  action?: { label: string; href: string } | null;
  /** Additional CSS classes */
  className?: string;
  /** Use compact layout (inline) */
  compact?: boolean;
}

export function FeedEmptyState({
  variant,
  action: actionOverride,
  className,
  compact = false,
}: FeedEmptyStateProps) {
  const config = EMPTY_CONFIG[variant];
  const Icon = config.icon;
  const action = actionOverride !== undefined ? actionOverride : config.action;

  // Page-level empty state is always full
  const isPageLevel = variant === 'page';

  if (compact && !isPageLevel) {
    // Compact inline variant
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: MOTION.duration.fast }}
        className={cn(
          'flex items-center justify-between py-2',
          className
        )}
      >
        <span className="text-body-sm text-white/40">{config.message}</span>
        {action && (
          <Link
            href={action.href}
            className="text-body-sm text-white/50 hover:text-white transition-colors"
          >
            {action.label} →
          </Link>
        )}
      </motion.div>
    );
  }

  // Full empty state card
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      <GlassSurface
        intensity="subtle"
        className={cn(
          'rounded-xl text-center',
          isPageLevel ? 'p-12' : 'p-6'
        )}
      >
        {/* Icon with subtle pulse */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-4"
        >
          <motion.div
            variants={iconPulseVariants}
            animate="pulse"
            className={cn(
              'rounded-full flex items-center justify-center',
              isPageLevel
                ? 'w-16 h-16 bg-white/[0.06]'
                : 'w-12 h-12 bg-white/[0.04]'
            )}
          >
            <Icon
              className={cn(
                'text-white/30',
                isPageLevel ? 'w-8 h-8' : 'w-6 h-6'
              )}
            />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h3
          variants={itemVariants}
          className={cn(
            'font-medium text-white/80',
            isPageLevel ? 'text-title' : 'text-body-lg'
          )}
        >
          {config.title}
        </motion.h3>

        {/* Message */}
        <motion.p
          variants={itemVariants}
          className={cn(
            'text-white/50 mt-1',
            isPageLevel ? 'text-body' : 'text-body-sm'
          )}
        >
          {config.message}
        </motion.p>

        {/* Action button */}
        {action && (
          <motion.div variants={buttonVariants} className="mt-4">
            <Button
              variant={isPageLevel ? 'cta' : 'default'}
              size={isPageLevel ? 'default' : 'sm'}
              asChild
            >
              <Link href={action.href}>{action.label}</Link>
            </Button>
          </motion.div>
        )}
      </GlassSurface>
    </motion.div>
  );
}

FeedEmptyState.displayName = 'FeedEmptyState';
