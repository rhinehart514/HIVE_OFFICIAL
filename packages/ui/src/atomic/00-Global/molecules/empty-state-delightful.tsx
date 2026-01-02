'use client';

/**
 * EmptyStateDelightful - 2026 Design System Empty States
 *
 * Philosophy: Empty is an opportunity, not an error.
 * Every empty state has warmth, personality, and clear action.
 *
 * Variants:
 * - canvas: HiveLab empty canvas ("Your canvas awaits")
 * - list: Empty list/collection ("No members yet")
 * - search: No search results
 * - error: Error state with recovery action
 *
 * Features:
 * - Animated honeycomb texture (optional)
 * - Warm, actionable copy
 * - Clear next action
 * - Respects reduced motion
 */

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon,
  UsersIcon,
  LayoutGridIcon,
  AlertCircleIcon,
  SparklesIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { HoneycombTexture } from '../atoms/honeycomb-texture';
import { Button } from '../atoms/button';

// ===== VARIANT CONFIGURATIONS =====

const variantConfig = {
  canvas: {
    icon: LayoutGridIcon,
    defaultTitle: 'Your canvas awaits',
    defaultDescription:
      'Drag elements from the palette or let AI help you get started',
    defaultActionLabel: 'Start with a template',
    iconBackground: 'bg-white/[0.04]',
    showHoneycomb: true,
  },
  list: {
    icon: UsersIcon,
    defaultTitle: 'Nothing here yet',
    defaultDescription: 'This list is waiting to be filled',
    defaultActionLabel: 'Add first item',
    iconBackground: 'bg-white/[0.04]',
    showHoneycomb: false,
  },
  search: {
    icon: SearchIcon,
    defaultTitle: 'No results found',
    defaultDescription: 'Try a different search term',
    defaultActionLabel: 'Clear search',
    iconBackground: 'bg-white/[0.04]',
    showHoneycomb: false,
  },
  error: {
    icon: AlertCircleIcon,
    defaultTitle: 'Something went wrong',
    defaultDescription: "We couldn't load this content",
    defaultActionLabel: 'Try again',
    iconBackground: 'bg-red-500/10',
    showHoneycomb: false,
  },
} as const;

// ===== ANIMATION VARIANTS =====

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};

const iconPulseVariants = {
  initial: { scale: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ===== COMPONENT =====

export interface EmptyStateDelightfulProps {
  /** Preset variant determining icon, defaults, and style */
  variant: 'canvas' | 'list' | 'search' | 'error';

  /** Override the default title */
  title?: string;

  /** Override the default description */
  description?: string;

  /** Override the default action label */
  actionLabel?: string;

  /** Handler for the primary action */
  onAction?: () => void;

  /** Show secondary action */
  secondaryActionLabel?: string;

  /** Handler for secondary action */
  onSecondaryAction?: () => void;

  /** Custom icon (overrides variant default) */
  icon?: React.ReactNode;

  /** Whether to show honeycomb texture (overrides variant default) */
  showHoneycomb?: boolean;

  /** Search query to display (for search variant) */
  searchQuery?: string;

  /** Additional className */
  className?: string;

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';

  /** Whether to animate the icon with a subtle pulse */
  animateIcon?: boolean;
}

export function EmptyStateDelightful({
  variant,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon,
  showHoneycomb,
  searchQuery,
  className,
  size = 'md',
  animateIcon = true,
}: EmptyStateDelightfulProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  // Determine what to show
  const displayTitle = title || config.defaultTitle;
  const displayDescription =
    variant === 'search' && searchQuery
      ? `No results for "${searchQuery}"`
      : description || config.defaultDescription;
  const displayActionLabel = actionLabel || config.defaultActionLabel;
  const shouldShowHoneycomb = showHoneycomb ?? config.showHoneycomb;

  // Size classes
  const sizeClasses = {
    sm: {
      container: 'py-8',
      icon: 'w-10 h-10',
      iconWrapper: 'w-14 h-14',
      title: 'text-[15px]',
      description: 'text-[13px]',
    },
    md: {
      container: 'py-12',
      icon: 'w-6 h-6',
      iconWrapper: 'w-12 h-12',
      title: 'text-[16px]',
      description: 'text-[14px]',
    },
    lg: {
      container: 'h-64 py-16',
      icon: 'w-8 h-8',
      iconWrapper: 'w-16 h-16',
      title: 'text-[18px]',
      description: 'text-[15px]',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'relative flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      {/* Honeycomb background */}
      <AnimatePresence>
        {shouldShowHoneycomb && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HoneycombTexture opacity={0.02} animated className="rounded-xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div
        variants={itemVariants}
        className={cn(
          'mx-auto mb-4 rounded-full flex items-center justify-center',
          config.iconBackground,
          sizes.iconWrapper
        )}
      >
        <motion.div
          variants={animateIcon ? iconPulseVariants : undefined}
          initial="initial"
          animate={animateIcon ? 'pulse' : undefined}
        >
          {icon || (
            <IconComponent
              className={cn('text-white/30', sizes.icon)}
              strokeWidth={1.5}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className={cn('font-medium text-white/80 mb-1', sizes.title)}
      >
        {displayTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        variants={itemVariants}
        className={cn('text-white/40 max-w-xs', sizes.description)}
      >
        {displayDescription}
      </motion.p>

      {/* Actions */}
      {(onAction || onSecondaryAction) && (
        <motion.div
          variants={itemVariants}
          className="mt-5 flex items-center gap-3"
        >
          {onAction && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onAction}
              className="group"
            >
              {variant === 'canvas' && (
                <SparklesIcon className="w-4 h-4 mr-1.5 text-white/50 group-hover:text-white/70 transition-colors" />
              )}
              {displayActionLabel}
              <ArrowRightIcon className="w-3.5 h-3.5 ml-1.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Button>
          )}
          {onSecondaryAction && secondaryActionLabel && (
            <Button variant="ghost" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ===== SPECIALIZED EMPTY STATES =====

/**
 * Canvas empty state for HiveLab
 */
export function CanvasEmptyState({
  onStartWithTemplate,
  onAskAI,
  className,
}: {
  onStartWithTemplate?: () => void;
  onAskAI?: () => void;
  className?: string;
}) {
  return (
    <EmptyStateDelightful
      variant="canvas"
      size="lg"
      onAction={onStartWithTemplate}
      secondaryActionLabel="Ask AI"
      onSecondaryAction={onAskAI}
      className={className}
    />
  );
}

/**
 * Members list empty state
 */
export function MembersEmptyState({
  onInvite,
  className,
}: {
  onInvite?: () => void;
  className?: string;
}) {
  return (
    <EmptyStateDelightful
      variant="list"
      title="No members yet"
      description="Invite people to grow your space"
      actionLabel="Invite members"
      onAction={onInvite}
      className={className}
    />
  );
}

/**
 * Search results empty state
 */
export function SearchEmptyState({
  query,
  onClearSearch,
  className,
}: {
  query: string;
  onClearSearch?: () => void;
  className?: string;
}) {
  return (
    <EmptyStateDelightful
      variant="search"
      searchQuery={query}
      description="Try a different search term"
      actionLabel="Clear search"
      onAction={onClearSearch}
      size="sm"
      animateIcon={false}
      className={className}
    />
  );
}

/**
 * Error state with retry
 */
export function ErrorEmptyState({
  onRetry,
  message,
  className,
}: {
  onRetry?: () => void;
  message?: string;
  className?: string;
}) {
  return (
    <EmptyStateDelightful
      variant="error"
      description={message || "We couldn't load this content"}
      actionLabel="Try again"
      onAction={onRetry}
      animateIcon={false}
      className={className}
    />
  );
}

/**
 * Spaces list empty state
 */
export function SpacesEmptyState({
  onBrowseSpaces,
  className,
}: {
  onBrowseSpaces?: () => void;
  className?: string;
}) {
  return (
    <EmptyStateDelightful
      variant="list"
      icon={<LayoutGridIcon className="w-6 h-6 text-white/30" strokeWidth={1.5} />}
      title="No spaces yet"
      description="Join spaces to connect with your campus community"
      actionLabel="Browse spaces"
      onAction={onBrowseSpaces}
      className={className}
    />
  );
}

/**
 * Tools empty state for HiveLab gallery
 */
export function ToolsEmptyState({
  onCreateTool,
  className,
}: {
  onCreateTool?: () => void;
  className?: string;
}) {
  return (
    <EmptyStateDelightful
      variant="canvas"
      icon={<SparklesIcon className="w-6 h-6 text-white/30" strokeWidth={1.5} />}
      title="No tools yet"
      description="Create your first tool to automate your space"
      actionLabel="Create a tool"
      onAction={onCreateTool}
      className={className}
    />
  );
}

export default EmptyStateDelightful;
