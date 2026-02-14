'use client';

/**
 * Breadcrumb - Navigation breadcrumb component
 *
 * Provides visual path indication for deep pages in HIVE.
 * Uses semantic HTML (nav, ol) for accessibility.
 *
 * @example
 * <Breadcrumb>
 *   <BreadcrumbItem href="/spaces">Spaces</BreadcrumbItem>
 *   <BreadcrumbSeparator />
 *   <BreadcrumbItem href="/s/consulting">@consulting</BreadcrumbItem>
 *   <BreadcrumbSeparator />
 *   <BreadcrumbCurrent>Budget Tool</BreadcrumbCurrent>
 * </Breadcrumb>
 */

import * as React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

// ============================================================
// Context
// ============================================================

const BreadcrumbContext = React.createContext<{ separator?: React.ReactNode }>({});

// ============================================================
// Breadcrumb (Root)
// ============================================================

export interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  /** Custom separator (defaults to ChevronRight) */
  separator?: React.ReactNode;
  children: React.ReactNode;
}

export function Breadcrumb({
  separator = <ChevronRight className="h-3.5 w-3.5 text-white/20 flex-shrink-0" />,
  children,
  className,
  ...props
}: BreadcrumbProps) {
  return (
    <BreadcrumbContext.Provider value={{ separator }}>
      <nav
        aria-label="Breadcrumb"
        className={cn('flex items-center', className)}
        {...props}
      >
        <ol className="flex items-center gap-1.5 text-sm">
          {children}
        </ol>
      </nav>
    </BreadcrumbContext.Provider>
  );
}

// ============================================================
// BreadcrumbItem (Link)
// ============================================================

export interface BreadcrumbItemProps {
  /** Link destination */
  href: string;
  /** Whether this is the home link (shows home icon) */
  isHome?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function BreadcrumbItem({
  href,
  isHome = false,
  children,
  className,
}: BreadcrumbItemProps) {
  return (
    <li className="inline-flex items-center">
      <Link
        href={href}
        className={cn(
          'inline-flex items-center gap-1.5',
          'text-white/50 hover:text-white/80',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#000000]',
          'rounded',
          className
        )}
      >
        {isHome ? (
          <Home className="h-3.5 w-3.5" />
        ) : (
          <span className="truncate max-w-[120px]">{children}</span>
        )}
      </Link>
    </li>
  );
}

// ============================================================
// BreadcrumbSeparator
// ============================================================

export interface BreadcrumbSeparatorProps {
  children?: React.ReactNode;
  className?: string;
}

export function BreadcrumbSeparator({
  children,
  className,
}: BreadcrumbSeparatorProps) {
  const { separator } = React.useContext(BreadcrumbContext);

  return (
    <li
      role="presentation"
      aria-hidden="true"
      className={cn('inline-flex items-center', className)}
    >
      {children ?? separator}
    </li>
  );
}

// ============================================================
// BreadcrumbCurrent (Active/Last item)
// ============================================================

export interface BreadcrumbCurrentProps {
  children: React.ReactNode;
  className?: string;
}

export function BreadcrumbCurrent({ children, className }: BreadcrumbCurrentProps) {
  return (
    <li className="inline-flex items-center">
      <span
        aria-current="page"
        className={cn(
          'text-white font-medium',
          'truncate max-w-[200px]',
          className
        )}
      >
        {children}
      </span>
    </li>
  );
}

// ============================================================
// BreadcrumbEllipsis (For collapsed items)
// ============================================================

export interface BreadcrumbEllipsisProps {
  className?: string;
}

export function BreadcrumbEllipsis({ className }: BreadcrumbEllipsisProps) {
  return (
    <li className="inline-flex items-center">
      <span
        className={cn('text-white/30 select-none', className)}
        aria-hidden="true"
      >
        ...
      </span>
    </li>
  );
}

// ============================================================
// Compound Export
// ============================================================

Breadcrumb.Item = BreadcrumbItem;
Breadcrumb.Separator = BreadcrumbSeparator;
Breadcrumb.Current = BreadcrumbCurrent;
Breadcrumb.Ellipsis = BreadcrumbEllipsis;

export default Breadcrumb;
