'use client';

import * as React from 'react';
import { cn } from '../../../lib/utils';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Page title
   */
  title: string;

  /**
   * Optional description below title
   */
  description?: string;

  /**
   * Action element (button, dropdown, etc.) aligned right
   */
  action?: React.ReactNode;

  /**
   * Secondary actions or breadcrumbs above the title
   */
  eyebrow?: React.ReactNode;

  /**
   * Make header sticky with backdrop blur
   * @default false
   */
  sticky?: boolean;

  /**
   * Add bottom border
   * @default false
   */
  bordered?: boolean;
}

/**
 * PageHeader - Consistent page header primitive
 *
 * Premium patterns from Vercel/Linear:
 * - Title + optional description
 * - Right-aligned action
 * - Optional sticky behavior with backdrop blur
 * - Consistent spacing
 *
 * @example
 * // Simple header
 * <PageHeader title="Feed" />
 *
 * @example
 * // With action
 * <PageHeader
 *   title="Spaces"
 *   description="Discover campus communities"
 *   action={<Button>Create Space</Button>}
 * />
 *
 * @example
 * // Sticky with border
 * <PageHeader
 *   title="Settings"
 *   sticky
 *   bordered
 *   eyebrow={<Breadcrumb />}
 * />
 */
export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  (
    {
      title,
      description,
      action,
      eyebrow,
      sticky = false,
      bordered = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <header
        ref={ref}
        className={cn(
          // Base styles
          'flex flex-col gap-1',

          // Sticky behavior
          sticky && [
            'sticky top-0 z-20',
            'bg-background-primary/95 backdrop-blur-md',
            '-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8', // Extend to shell edges
            'py-4',
          ],

          // Border
          bordered && 'border-b border-border-default pb-4',

          // Default spacing when not sticky
          !sticky && 'pb-6',

          className
        )}
        {...props}
      >
        {/* Eyebrow (breadcrumbs, back link, etc.) */}
        {eyebrow && (
          <div className="mb-2 text-sm text-text-tertiary">
            {eyebrow}
          </div>
        )}

        {/* Main header row */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold text-text-primary sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-text-secondary sm:text-base">
                {description}
              </p>
            )}
          </div>

          {/* Action */}
          {action && (
            <div className="shrink-0">
              {action}
            </div>
          )}
        </div>
      </header>
    );
  }
);

PageHeader.displayName = 'PageHeader';
