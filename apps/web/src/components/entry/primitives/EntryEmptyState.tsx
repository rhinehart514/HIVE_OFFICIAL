'use client';

/**
 * EntryEmptyState - Empty state guidance for entry flow
 *
 * Provides helpful context when searches yield no results
 * during the onboarding process. Never leaves users stuck.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DURATION, EASE_PREMIUM } from '../motion/entry-motion';

export type EntryEmptyVariant = 'interests' | 'majors' | 'schools';

interface EntryEmptyStateConfig {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  suggestion?: string;
  actionLabel?: string;
}

const VARIANT_CONFIG: Record<EntryEmptyVariant, EntryEmptyStateConfig> = {
  interests: {
    icon: Sparkles,
    title: 'No matches found',
    subtitle: 'Try a broader search or explore categories above',
    suggestion: 'Popular searches: AI, Design, Startups, Music',
    actionLabel: 'Clear search',
  },
  majors: {
    icon: Search,
    title: 'Major not found',
    subtitle: "Can't find your major? Try a shorter search or skip for now",
    suggestion: 'You can always update this later in settings',
    actionLabel: 'Skip this step',
  },
  schools: {
    icon: Search,
    title: 'School not found',
    subtitle: 'Make sure you entered your .edu email correctly',
    suggestion: 'If your school is new to HIVE, join the waitlist',
  },
};

interface EntryEmptyStateProps {
  variant: EntryEmptyVariant;
  searchQuery?: string;
  onClearSearch?: () => void;
  onAction?: () => void;
  className?: string;
}

export function EntryEmptyState({
  variant,
  searchQuery,
  onClearSearch,
  onAction,
  className,
}: EntryEmptyStateProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center py-10 px-4 text-center',
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.quick, ease: EASE_PREMIUM }}
    >
      {/* Icon */}
      <motion.div
        className="w-12 h-12 rounded-xl bg-white/[0.04] flex items-center justify-center mb-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: DURATION.snap, delay: 0.05 }}
      >
        <Icon className="w-5 h-5 text-white/30" />
      </motion.div>

      {/* Title */}
      <motion.p
        className="text-[15px] text-white/60 mb-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.snap, delay: 0.1 }}
      >
        {searchQuery ? (
          <>No results for "<span className="text-white/80">{searchQuery}</span>"</>
        ) : (
          config.title
        )}
      </motion.p>

      {/* Subtitle */}
      <motion.p
        className="text-[13px] text-white/40 max-w-[280px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.snap, delay: 0.15 }}
      >
        {config.subtitle}
      </motion.p>

      {/* Suggestion */}
      {config.suggestion && (
        <motion.p
          className="text-[12px] text-white/25 mt-3 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: DURATION.snap, delay: 0.2 }}
        >
          {config.suggestion}
        </motion.p>
      )}

      {/* Actions */}
      {(onClearSearch || onAction) && (
        <motion.div
          className="flex items-center gap-3 mt-5"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.snap, delay: 0.25 }}
        >
          {onClearSearch && searchQuery && (
            <button
              onClick={onClearSearch}
              className="px-4 py-2 text-[13px] text-white/50 hover:text-white/70 bg-white/[0.04] hover:bg-white/[0.06] rounded-lg transition-all"
            >
              Clear search
            </button>
          )}
          {onAction && config.actionLabel && (
            <button
              onClick={onAction}
              className="px-4 py-2 text-[13px] text-white/60 hover:text-white/80 flex items-center gap-1.5 transition-colors"
            >
              {config.actionLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

EntryEmptyState.displayName = 'EntryEmptyState';
