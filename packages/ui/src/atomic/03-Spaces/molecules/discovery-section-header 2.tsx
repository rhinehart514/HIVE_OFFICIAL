'use client';

/**
 * DiscoverySectionHeader - Section title + icon + "View all" link
 *
 * Design Token Compliance:
 * - Typography: text-lg font-semibold for title
 * - Colors: Gold icon background, neutral text
 * - Motion: Arrow slide on hover
 *
 * Usage: Headers for discovery sections (Featured, Trending, New)
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { springPresets } from '@hive/tokens';

export interface DiscoverySectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Section icon (React node) */
  icon?: React.ReactNode;
  /** "View all" link href */
  viewAllHref?: string;
  /** Callback for "View all" click */
  onViewAll?: () => void;
  /** "View all" label text */
  viewAllLabel?: string;
  /** Optional className */
  className?: string;
}

export function DiscoverySectionHeader({
  title,
  subtitle,
  icon,
  viewAllHref,
  onViewAll,
  viewAllLabel = 'View all',
  className,
}: DiscoverySectionHeaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const hasViewAll = viewAllHref || onViewAll;

  const ViewAllContent = () => (
    <motion.span
      className="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-gold-500 transition-colors group/link"
      whileHover={shouldReduceMotion ? {} : { x: 2 }}
      transition={springPresets.snappy}
    >
      {viewAllLabel}
      <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
    </motion.span>
  );

  return (
    <div className={cn('flex items-center justify-between mb-5', className)}>
      <div className="flex items-center gap-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
            <span className="text-gold-500">{icon}</span>
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </div>
      </div>

      {hasViewAll && (
        <>
          {viewAllHref ? (
            <a
              href={viewAllHref}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 rounded"
            >
              <ViewAllContent />
            </a>
          ) : (
            <button
              onClick={onViewAll}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50 rounded"
            >
              <ViewAllContent />
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default DiscoverySectionHeader;
