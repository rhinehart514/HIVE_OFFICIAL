'use client';

/**
 * Pagination Component
 * Source: docs/design-system/COMPONENTS.md
 *
 * Navigation controls for paginated content.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * VISUAL DESCRIPTION (for AI reference - no Playwright needed)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * BASIC PAGINATION:
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  ◀ Prev   [1]  2   3   4   5  ...  20   Next ▶                           │
 * └───────────────────────────────────────────────────────────────────────────┘
 *              │
 *              └── Current page (white bg, dark text)
 *
 * WITH ELLIPSIS:
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  ◀ Prev   1  ...  4   [5]  6  ...  20   Next ▶                           │
 * └───────────────────────────────────────────────────────────────────────────┘
 *                          │
 *                          └── Ellipsis indicates hidden pages
 *
 * FIRST PAGE:
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  ◀ Prev   [1]  2   3   4   5  ...  20   Next ▶                           │
 * └───────────────────────────────────────────────────────────────────────────┘
 *     │
 *     └── Prev button disabled (muted)
 *
 * LAST PAGE:
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  ◀ Prev   1  ...  16  17  18  19  [20]   Next ▶                          │
 * └───────────────────────────────────────────────────────────────────────────┘
 *                                             │
 *                                             └── Next button disabled
 *
 * PAGINATION VARIANTS:
 *
 * Default (numbers):
 *   ◀  1  2  [3]  4  5  ▶
 *   Numbers with prev/next arrows
 *
 * Simple (prev/next only):
 *   ◀ Previous     Next ▶
 *   Text buttons only, no page numbers
 *
 * Compact (short):
 *   ◀  [3/20]  ▶
 *   Current/total only
 *
 * Outline:
 *   [◀] [1] [2] [3] [4] [5] [▶]
 *   All items have borders
 *
 * SIZES:
 *
 * Small (sm):
 *   ◀ 1 2 3 ▶
 *   text-xs, h-7, w-7
 *
 * Medium (md - default):
 *   ◀ 1 2 3 ▶
 *   text-sm, h-9, w-9
 *
 * Large (lg):
 *   ◀ 1 2 3 ▶
 *   text-base, h-11, w-11
 *
 * WITH BOUNDARIES:
 *   ◀  [1]  ...  4  5  6  ...  [20]  ▶
 *   First/last always visible (boundaryCount=1)
 *
 * STATES:
 * - Default: bg-transparent, text-muted
 * - Hover: bg-white/10, text-white
 * - Active/Current: bg-white, text-black
 * - Disabled: opacity-50, cursor-not-allowed
 * - Focus: White focus ring
 *
 * COLORS:
 * - Page number: var(--color-text-muted)
 * - Active page: White bg, black text
 * - Hover: white/10 bg
 * - Arrows: var(--color-text-muted), white on hover
 * - Ellipsis: var(--color-text-muted)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const paginationItemVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'hover:bg-white/10 hover:text-white',
        outline: 'border border-[var(--color-border)] hover:bg-white/10',
      },
      size: {
        sm: 'h-7 min-w-7 px-2 text-xs',
        md: 'h-9 min-w-9 px-3 text-sm',
        lg: 'h-11 min-w-11 px-4 text-base',
      },
      active: {
        true: 'bg-white text-black hover:bg-white hover:text-black',
        false: 'text-[var(--color-text-muted)]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      active: false,
    },
  }
);

export interface PaginationProps extends VariantProps<typeof paginationItemVariants> {
  /** Total number of pages */
  totalPages: number;
  /** Current page (1-indexed) */
  currentPage: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Number of siblings to show around current page */
  siblingCount?: number;
  /** Number of items at boundaries (first/last) */
  boundaryCount?: number;
  /** Show previous/next buttons */
  showPrevNext?: boolean;
  /** Show first/last buttons */
  showFirstLast?: boolean;
  /** Previous button text */
  prevText?: React.ReactNode;
  /** Next button text */
  nextText?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Generate pagination range with ellipsis
 */
function generatePaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number,
  boundaryCount: number
): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 3 + boundaryCount * 2;

  if (totalNumbers >= totalPages) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, boundaryCount + 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages - boundaryCount);

  const showLeftEllipsis = leftSiblingIndex > boundaryCount + 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - boundaryCount - 1;

  const result: (number | 'ellipsis')[] = [];

  // Add boundary pages at start
  for (let i = 1; i <= boundaryCount; i++) {
    result.push(i);
  }

  // Add left ellipsis
  if (showLeftEllipsis) {
    result.push('ellipsis');
  } else {
    for (let i = boundaryCount + 1; i < leftSiblingIndex; i++) {
      result.push(i);
    }
  }

  // Add sibling pages
  for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
    result.push(i);
  }

  // Add right ellipsis
  if (showRightEllipsis) {
    result.push('ellipsis');
  } else {
    for (let i = rightSiblingIndex + 1; i <= totalPages - boundaryCount; i++) {
      result.push(i);
    }
  }

  // Add boundary pages at end
  for (let i = totalPages - boundaryCount + 1; i <= totalPages; i++) {
    result.push(i);
  }

  return result;
}

/**
 * Pagination - Full pagination component
 */
const Pagination = React.forwardRef<HTMLElement, PaginationProps>(
  (
    {
      totalPages,
      currentPage,
      onPageChange,
      siblingCount = 1,
      boundaryCount = 1,
      showPrevNext = true,
      showFirstLast = false,
      prevText,
      nextText,
      variant,
      size,
      className,
    },
    ref
  ) => {
    const pages = generatePaginationRange(currentPage, totalPages, siblingCount, boundaryCount);

    const PrevIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
    );

    const NextIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    );

    const FirstIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
      </svg>
    );

    const LastIcon = (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 4.5l7.5 7.5-7.5 7.5m-6-15l7.5 7.5-7.5 7.5" />
      </svg>
    );

    return (
      <nav ref={ref} className={cn('flex items-center gap-1', className)} aria-label="Pagination">
        {showFirstLast && (
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={cn(paginationItemVariants({ variant, size, active: false }))}
            aria-label="First page"
          >
            {FirstIcon}
          </button>
        )}

        {showPrevNext && (
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(paginationItemVariants({ variant, size, active: false }))}
            aria-label="Previous page"
          >
            {prevText || PrevIcon}
          </button>
        )}

        {pages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className={cn(paginationItemVariants({ variant, size, active: false }), 'cursor-default hover:bg-transparent')}
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(paginationItemVariants({ variant, size, active: page === currentPage }))}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {showPrevNext && (
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(paginationItemVariants({ variant, size, active: false }))}
            aria-label="Next page"
          >
            {nextText || NextIcon}
          </button>
        )}

        {showFirstLast && (
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={cn(paginationItemVariants({ variant, size, active: false }))}
            aria-label="Last page"
          >
            {LastIcon}
          </button>
        )}
      </nav>
    );
  }
);
Pagination.displayName = 'Pagination';

/**
 * SimplePagination - Prev/Next only
 */
export interface SimplePaginationProps extends VariantProps<typeof paginationItemVariants> {
  /** Has previous page */
  hasPrev: boolean;
  /** Has next page */
  hasNext: boolean;
  /** Previous handler */
  onPrev: () => void;
  /** Next handler */
  onNext: () => void;
  /** Previous text */
  prevText?: string;
  /** Next text */
  nextText?: string;
  /** Additional class names */
  className?: string;
}

const SimplePagination = React.forwardRef<HTMLElement, SimplePaginationProps>(
  (
    {
      hasPrev,
      hasNext,
      onPrev,
      onNext,
      prevText = 'Previous',
      nextText = 'Next',
      variant,
      size,
      className,
    },
    ref
  ) => (
    <nav ref={ref} className={cn('flex items-center justify-between gap-4', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        className={cn(paginationItemVariants({ variant, size, active: false }), 'gap-2')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {prevText}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        className={cn(paginationItemVariants({ variant, size, active: false }), 'gap-2')}
      >
        {nextText}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </nav>
  )
);
SimplePagination.displayName = 'SimplePagination';

/**
 * CompactPagination - Shows current/total only
 */
export interface CompactPaginationProps extends VariantProps<typeof paginationItemVariants> {
  /** Current page */
  currentPage: number;
  /** Total pages */
  totalPages: number;
  /** Page change handler */
  onPageChange: (page: number) => void;
  /** Additional class names */
  className?: string;
}

const CompactPagination = React.forwardRef<HTMLElement, CompactPaginationProps>(
  ({ currentPage, totalPages, onPageChange, variant, size, className }, ref) => (
    <nav ref={ref} className={cn('flex items-center gap-1', className)} aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(paginationItemVariants({ variant, size, active: false }))}
        aria-label="Previous page"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <span className={cn(paginationItemVariants({ variant, size, active: false }), 'cursor-default')}>
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(paginationItemVariants({ variant, size, active: false }))}
        aria-label="Next page"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </nav>
  )
);
CompactPagination.displayName = 'CompactPagination';

export {
  Pagination,
  SimplePagination,
  CompactPagination,
  paginationItemVariants,
};
