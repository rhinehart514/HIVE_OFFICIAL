'use client';

/**
 * Breadcrumbs - YC/SF Minimal Navigation Path
 *
 * Design Token Compliance:
 * - Typography: text-sm for items, neutral colors
 * - Separators: ChevronRight icon, 40% opacity
 * - Current page: White text (no link)
 * - Links: neutral-400 hover:white transition
 * - Accessible: aria-label, aria-current
 *
 * Usage:
 * <Breadcrumbs
 *   items={[
 *     { label: 'Spaces', href: '/spaces' },
 *     { label: 'CS Club' }
 *   ]}
 * />
 */

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easingArrays } from '@hive/tokens';
import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';

import { cn } from '../../../lib/utils';

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Link href - if omitted, item is current page (no link) */
  href?: string;
  /** Optional icon to show before label */
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  /** Breadcrumb items (last item is current page) */
  items: BreadcrumbItem[];
  /** Show home icon at start */
  showHome?: boolean;
  /** Home href */
  homeHref?: string;
  /** Custom separator */
  separator?: React.ReactNode;
  /** Optional className */
  className?: string;
  /** Max items to show (collapses middle if exceeded) */
  maxItems?: number;
}

const defaultSeparator = (
  <ChevronRight className="w-3.5 h-3.5 text-white/40 flex-shrink-0" aria-hidden="true" />
);

export function Breadcrumbs({
  items,
  showHome = false,
  homeHref = '/feed',
  separator = defaultSeparator,
  className,
  maxItems = 4,
}: BreadcrumbsProps) {
  const shouldReduceMotion = useReducedMotion();

  // Handle collapsed state for long breadcrumb trails
  const shouldCollapse = items.length > maxItems;
  const visibleItems = shouldCollapse
    ? [...items.slice(0, 1), { label: '...', href: undefined }, ...items.slice(-2)]
    : items;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -4 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.15,
        ease: easingArrays.default,
      },
    },
  };

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <motion.ol
        className="flex items-center gap-1.5 text-sm"
        variants={shouldReduceMotion ? {} : containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Home link */}
        {showHome && (
          <motion.li
            className="flex items-center gap-1.5"
            variants={shouldReduceMotion ? {} : itemVariants}
          >
            <Link
              href={homeHref}
              className="flex items-center text-white/50 hover:text-white transition-colors duration-100"
              aria-label="Home"
            >
              <Home className="w-4 h-4" />
            </Link>
            {separator}
          </motion.li>
        )}

        {/* Breadcrumb items */}
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isEllipsis = item.label === '...';

          return (
            <motion.li
              key={`${item.label}-${index}`}
              className="flex items-center gap-1.5"
              variants={shouldReduceMotion ? {} : itemVariants}
            >
              {isEllipsis ? (
                <span className="text-white/40 px-1">...</span>
              ) : isLast || !item.href ? (
                // Current page (no link)
                <span
                  className="text-white font-medium truncate max-w-[200px]"
                  aria-current="page"
                >
                  {item.icon && <span className="mr-1.5 inline-flex">{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                // Link
                <Link
                  href={item.href}
                  className="text-white/50 hover:text-white transition-colors duration-100 truncate max-w-[150px]"
                >
                  {item.icon && <span className="mr-1.5 inline-flex">{item.icon}</span>}
                  {item.label}
                </Link>
              )}

              {/* Separator (not after last item) */}
              {!isLast && separator}
            </motion.li>
          );
        })}
      </motion.ol>
    </nav>
  );
}

/**
 * Compact variant for tight spaces
 */
export function BreadcrumbsCompact({
  items,
  className,
}: Pick<BreadcrumbsProps, 'items' | 'className'>) {
  const lastTwo = items.slice(-2);

  if (lastTwo.length === 0) return null;

  if (lastTwo.length === 1) {
    return (
      <nav aria-label="Breadcrumb" className={cn('flex items-center text-sm', className)}>
        <span className="text-white font-medium" aria-current="page">
          {lastTwo[0].label}
        </span>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5 text-sm', className)}>
      {lastTwo[0].href ? (
        <Link
          href={lastTwo[0].href}
          className="text-white/50 hover:text-white transition-colors duration-100"
        >
          {lastTwo[0].label}
        </Link>
      ) : (
        <span className="text-white/50">{lastTwo[0].label}</span>
      )}
      <ChevronRight className="w-3.5 h-3.5 text-white/40 flex-shrink-0" aria-hidden="true" />
      <span className="text-white font-medium" aria-current="page">
        {lastTwo[1].label}
      </span>
    </nav>
  );
}

export default Breadcrumbs;
