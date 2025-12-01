/**
 * SpaceEmptyState - Standardized empty states for Space components
 *
 * ENHANCED for Phase 3: Premium empty states with gold CTAs
 * Provides consistent empty state messaging across all Space widgets
 * and pages with appropriate icons, messaging, and optional actions.
 *
 * Features:
 * - Subtle glow behind icons for premium feel
 * - Gold primary CTA buttons
 * - Default action labels per variant
 * - T3 motion tier animation
 *
 * @example
 * <SpaceEmptyState
 *   variant="no-posts"
 *   action={{ label: "Create Post", onClick: handleCreate }}
 * />
 *
 * @version 2.0.0 - Enhanced visuals
 */
'use client';

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  MessageSquare,
  Users,
  Calendar,
  Wrench,
  Sparkles,
  Search,
  FolderOpen,
  Plus,
  LogIn,
  Trash2,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { sectionRevealVariants } from '../../../lib/motion-variants-spaces';
import { Button } from '../../00-Global/atoms/button';

// Empty state variants with predefined content
type EmptyVariant =
  | 'no-posts'
  | 'no-members'
  | 'no-events'
  | 'no-tools'
  | 'no-spaces'
  | 'no-results'
  | 'no-content'
  | 'custom';

export interface SpaceEmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface SpaceEmptyStateProps {
  /** Predefined empty state variant */
  variant: EmptyVariant;
  /** Custom title (overrides variant default) */
  title?: string;
  /** Custom description (overrides variant default) */
  description?: string;
  /** Custom icon (overrides variant default) */
  icon?: React.ReactNode;
  /** Optional action button */
  action?: SpaceEmptyStateAction;
  /**
   * Secondary action (shown as ghost button)
   * Use for less prominent actions like "Clear filters"
   */
  secondaryAction?: SpaceEmptyStateAction;
  /**
   * Primary variant uses prominent gold styling
   * Default is subtle; primary is for main conversion CTAs (Join, Create)
   */
  primary?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to animate on mount */
  animate?: boolean;
  /** Additional className */
  className?: string;
}

// Default content for each variant
interface VariantContent {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** Default action label for this variant */
  defaultActionLabel?: string;
  /** Whether this variant should default to primary (gold) CTA */
  defaultPrimary?: boolean;
}

const VARIANT_CONTENT: Record<Exclude<EmptyVariant, 'custom'>, VariantContent> = {
  'no-posts': {
    icon: <MessageSquare className="h-8 w-8" />,
    title: 'No posts yet',
    description: 'Be the first to start a conversation',
    defaultActionLabel: 'Create Post',
    defaultPrimary: true,
  },
  'no-members': {
    icon: <Users className="h-8 w-8" />,
    title: 'Be the first to join',
    description: 'This space is waiting for its first members',
    defaultActionLabel: 'Join Space',
    defaultPrimary: true,
  },
  'no-events': {
    icon: <Calendar className="h-8 w-8" />,
    title: 'No upcoming events',
    description: 'Events will appear here when scheduled',
    defaultActionLabel: 'Create Event',
    defaultPrimary: false,
  },
  'no-tools': {
    icon: <Wrench className="h-8 w-8" />,
    title: 'No active tools',
    description: 'Tools can be added to enhance this space',
    defaultActionLabel: 'Browse Tools',
    defaultPrimary: false,
  },
  'no-spaces': {
    icon: <Sparkles className="h-8 w-8" />,
    title: 'No spaces found',
    description: 'Discover spaces that match your interests',
    defaultActionLabel: 'Browse Spaces',
    defaultPrimary: false,
  },
  'no-results': {
    icon: <Search className="h-8 w-8" />,
    title: 'No results found',
    description: 'Try adjusting your search or filters',
    defaultActionLabel: 'Clear Filters',
    defaultPrimary: false,
  },
  'no-content': {
    icon: <FolderOpen className="h-8 w-8" />,
    title: 'Nothing here yet',
    description: 'Content will appear here when available',
    defaultPrimary: false,
  },
};

const SIZE_CLASSES: Record<string, { wrapper: string; icon: string; title: string; desc: string }> = {
  sm: {
    wrapper: 'py-6 px-4',
    icon: 'h-6 w-6',
    title: 'text-sm',
    desc: 'text-xs',
  },
  md: {
    wrapper: 'py-10 px-6',
    icon: 'h-8 w-8',
    title: 'text-base',
    desc: 'text-sm',
  },
  lg: {
    wrapper: 'py-16 px-8',
    icon: 'h-12 w-12',
    title: 'text-lg',
    desc: 'text-base',
  },
};

export function SpaceEmptyState({
  variant,
  title,
  description,
  icon,
  action,
  secondaryAction,
  primary,
  size = 'md',
  animate = true,
  className,
}: SpaceEmptyStateProps) {
  const shouldReduceMotion = useReducedMotion();

  // Get content from variant or use custom
  const content = variant === 'custom'
    ? { icon, title, description, defaultPrimary: false }
    : VARIANT_CONTENT[variant];

  const sizeClasses = SIZE_CLASSES[size];

  // Determine if CTA should be primary (gold) style
  const isPrimary = primary ?? content.defaultPrimary ?? false;

  const Wrapper = animate && !shouldReduceMotion ? motion.div : 'div';
  const wrapperProps = animate && !shouldReduceMotion
    ? { variants: sectionRevealVariants, initial: 'initial', animate: 'animate' }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeClasses.wrapper,
        className
      )}
    >
      {/* Icon with subtle glow background */}
      {(icon || content.icon) && (
        <div className="relative mb-5">
          {/* Glow effect - only for md and lg sizes */}
          {size !== 'sm' && (
            <div
              className={cn(
                'absolute inset-0 rounded-full blur-xl opacity-20',
                isPrimary ? 'bg-[#FFD700]' : 'bg-neutral-500'
              )}
              style={{ transform: 'scale(2)' }}
            />
          )}
          {/* Icon container */}
          <div
            className={cn(
              'relative flex items-center justify-center rounded-2xl',
              size === 'sm' && 'w-12 h-12',
              size === 'md' && 'w-16 h-16',
              size === 'lg' && 'w-20 h-20',
              isPrimary
                ? 'bg-[#FFD700]/10 text-[#FFD700]/70'
                : 'bg-neutral-800/50 text-neutral-500'
            )}
          >
            <div className={sizeClasses.icon}>
              {icon || content.icon}
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      {(title || content.title) && (
        <h3 className={cn('font-semibold text-neutral-200 mb-1.5', sizeClasses.title)}>
          {title || content.title}
        </h3>
      )}

      {/* Description */}
      {(description || content.description) && (
        <p className={cn('text-neutral-500 max-w-xs leading-relaxed', sizeClasses.desc)}>
          {description || content.description}
        </p>
      )}

      {/* Action buttons */}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center gap-2 mt-5">
          {/* Primary action */}
          {action && (
            isPrimary ? (
              // Gold prominent button for primary CTAs
              <Button
                variant="brand"
                size={size === 'sm' ? 'sm' : 'default'}
                onClick={action.onClick}
                className="min-w-[140px] shadow-[0_0_20px_rgba(255,215,0,0.15)]"
              >
                {action.icon || <Plus className="h-4 w-4 mr-1.5" />}
                {action.label}
              </Button>
            ) : (
              // Subtle gold button for secondary CTAs
              <button
                onClick={action.onClick}
                className={cn(
                  'inline-flex items-center gap-2',
                  'px-4 py-2 rounded-lg',
                  'bg-[#FFD700]/10 hover:bg-[#FFD700]/20',
                  'text-[#FFD700]/80 hover:text-[#FFD700]',
                  size === 'sm' ? 'text-xs' : 'text-sm',
                  'font-medium',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD700]/50'
                )}
              >
                {action.icon || <Plus className="h-4 w-4" />}
                {action.label}
              </button>
            )
          )}

          {/* Secondary action - always ghost style */}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={size === 'sm' ? 'sm' : 'default'}
              onClick={secondaryAction.onClick}
              className="text-neutral-400 hover:text-neutral-200"
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </Wrapper>
  );
}

// Convenience presets
export function PostsEmptyState(props: Omit<SpaceEmptyStateProps, 'variant'>) {
  return <SpaceEmptyState variant="no-posts" {...props} />;
}

export function MembersEmptyState(props: Omit<SpaceEmptyStateProps, 'variant'>) {
  return <SpaceEmptyState variant="no-members" {...props} />;
}

export function EventsEmptyState(props: Omit<SpaceEmptyStateProps, 'variant'>) {
  return <SpaceEmptyState variant="no-events" {...props} />;
}

export function ToolsEmptyState(props: Omit<SpaceEmptyStateProps, 'variant'>) {
  return <SpaceEmptyState variant="no-tools" {...props} />;
}

export function SpacesEmptyState(props: Omit<SpaceEmptyStateProps, 'variant'>) {
  return <SpaceEmptyState variant="no-spaces" {...props} />;
}

export function SearchEmptyState(props: Omit<SpaceEmptyStateProps, 'variant'>) {
  return <SpaceEmptyState variant="no-results" {...props} />;
}
