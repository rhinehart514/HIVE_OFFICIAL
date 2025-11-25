'use client';

import * as React from 'react';
import { cn } from '../../../lib/utils';

/**
 * Shell sizes based on Vercel/Linear patterns
 * Single source of truth for content max-widths
 */
const shellSizes = {
  xs: 'max-w-[480px]',   // Modals, auth forms
  sm: 'max-w-[640px]',   // Single column, chat
  md: 'max-w-[768px]',   // Feed, articles
  lg: 'max-w-[1024px]',  // Dashboards
  xl: 'max-w-[1200px]',  // Full-width grids
  full: 'max-w-full',    // Edge-to-edge
} as const;

type ShellSize = keyof typeof shellSizes;

export interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Content max-width constraint
   * @default 'lg'
   */
  size?: ShellSize;

  /**
   * Remove horizontal padding (for nested shells or custom layouts)
   * @default false
   */
  noPadding?: boolean;

  /**
   * Remove vertical padding
   * @default false
   */
  noVerticalPadding?: boolean;

  /**
   * Center content horizontally
   * @default true
   */
  centered?: boolean;

  /**
   * HTML element to render as
   * @default 'div'
   */
  as?: 'div' | 'main' | 'section' | 'article';
}

/**
 * Shell - Core layout primitive for consistent page structure
 *
 * Based on Vercel design patterns:
 * - Single max-width per context
 * - Responsive padding (16px → 24px → 32px)
 * - Browser-native sizing (flex/grid over JS measurement)
 *
 * @example
 * // Feed page
 * <Shell size="md">
 *   <PageHeader title="Feed" />
 *   <FeedList />
 * </Shell>
 *
 * @example
 * // Dashboard with sidebar
 * <Shell size="xl">
 *   <div className="grid grid-cols-[280px_1fr] gap-6">
 *     <Sidebar />
 *     <Content />
 *   </div>
 * </Shell>
 *
 * @example
 * // Auth modal
 * <Shell size="xs" as="main">
 *   <LoginForm />
 * </Shell>
 */
export const Shell = React.forwardRef<HTMLDivElement, ShellProps>(
  (
    {
      size = 'lg',
      noPadding = false,
      noVerticalPadding = false,
      centered = true,
      as: Component = 'div',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          // Max-width constraint
          shellSizes[size],

          // Centering
          centered && 'mx-auto',

          // Responsive horizontal padding: 16px → 24px → 32px
          !noPadding && 'px-4 sm:px-6 lg:px-8',

          // Responsive vertical padding: 16px → 24px → 32px
          !noVerticalPadding && 'py-4 sm:py-6 lg:py-8',

          // Full width container
          'w-full',

          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Shell.displayName = 'Shell';

// Export size type for external use
export type { ShellSize };
export { shellSizes };
