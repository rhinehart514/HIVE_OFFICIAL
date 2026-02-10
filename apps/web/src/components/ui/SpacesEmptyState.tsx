'use client';

/**
 * SpacesEmptyState - Contextual empty states for spaces lists
 *
 * Three states per DESIGN_GAPS.md:
 * 1. No joined spaces - "Your spaces appear here"
 * 2. Filtered (search yielded no results) - "No matches"
 * 3. No spaces in category - "Nothing here yet"
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Home, Search, FolderOpen, Compass, Users } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { cn } from '@/lib/utils';

export type SpacesEmptyVariant = 'no_spaces' | 'search_empty' | 'category_empty' | 'browse';

interface SpacesEmptyStateProps {
  variant: SpacesEmptyVariant;
  searchQuery?: string;
  categoryName?: string;
  onBrowse?: () => void;
  onClearSearch?: () => void;
  className?: string;
}

const VARIANT_CONFIG: Record<
  SpacesEmptyVariant,
  {
    icon: React.ElementType;
    title: string;
    subtitle: string;
    primaryCta?: { label: string; href: string };
    secondaryCta?: { label: string; action: 'browse' | 'clear' };
  }
> = {
  no_spaces: {
    icon: Home,
    title: 'Your spaces appear here',
    subtitle: 'Join communities that match your interests and connect with your campus.',
    primaryCta: { label: 'Browse Spaces', href: '/spaces' },
  },
  search_empty: {
    icon: Search,
    title: 'No spaces found',
    subtitle: 'Try a different search term or browse all spaces.',
    secondaryCta: { label: 'Clear search', action: 'clear' },
  },
  category_empty: {
    icon: FolderOpen,
    title: 'Nothing here yet',
    subtitle: 'No spaces in this category. Be the first to create one.',
    primaryCta: { label: 'Create Space', href: '/spaces/new' },
    secondaryCta: { label: 'Browse all', action: 'browse' },
  },
  browse: {
    icon: Compass,
    title: 'Ready to explore?',
    subtitle: 'Find spaces that match your interests and join the conversation.',
    primaryCta: { label: 'Browse Spaces', href: '/spaces' },
  },
};

export function SpacesEmptyState({
  variant,
  searchQuery,
  categoryName,
  onBrowse,
  onClearSearch,
  className,
}: SpacesEmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  // Dynamic subtitle based on context
  let subtitle = config.subtitle;
  if (variant === 'search_empty' && searchQuery) {
    subtitle = `No spaces match "${searchQuery}". Try a different search.`;
  } else if (variant === 'category_empty' && categoryName) {
    subtitle = `No ${categoryName.toLowerCase()} spaces yet. Be the first to create one.`;
  }

  const handleSecondaryClick = () => {
    if (config.secondaryCta?.action === 'browse') {
      onBrowse?.();
    } else if (config.secondaryCta?.action === 'clear') {
      onClearSearch?.();
    }
  };

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Icon */}
      <motion.div
        className="w-14 h-14 rounded-lg bg-white/[0.06] border border-white/[0.06] flex items-center justify-center mb-5"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <Icon className="w-6 h-6 text-white/50" />
      </motion.div>

      {/* Title */}
      <motion.h3
        className="text-body font-medium text-white/50 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        {config.title}
      </motion.h3>

      {/* Subtitle */}
      <motion.p
        className="text-body-sm text-white/50 max-w-xs mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        {subtitle}
      </motion.p>

      {/* CTAs */}
      <motion.div
        className="flex items-center gap-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.25 }}
      >
        {config.primaryCta && (
          <Button
            variant="solid"
            size="sm"
            asChild
          >
            <Link href={config.primaryCta.href}>{config.primaryCta.label}</Link>
          </Button>
        )}
        {config.secondaryCta && (
          <Button variant="ghost" size="sm" onClick={handleSecondaryClick}>
            {config.secondaryCta.label}
          </Button>
        )}
      </motion.div>

      {/* Helpful hint for new users */}
      {variant === 'no_spaces' && (
        <motion.div
          className="mt-8 flex items-center gap-2 text-label text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Your campus has active communities waiting for you</span>
        </motion.div>
      )}
    </motion.div>
  );
}

SpacesEmptyState.displayName = 'SpacesEmptyState';
