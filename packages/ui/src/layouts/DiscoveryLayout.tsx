'use client';

import * as React from 'react';
import { LayoutProvider } from './LayoutContext';

/**
 * DiscoveryLayout
 *
 * Archetype: Discovery
 * Purpose: browsing lists/collections
 * Behavior: filters/search on top, uniform list/grid, vertical scroll
 * Shell: ON
 *
 * Rules:
 * - Filter/search ALWAYS at top
 * - Uniform list or grid (no hero items)
 * - No editorial emphasis
 * - Vertical scroll only
 *
 * Use for: Campus, Space Lists, Events, Members, Tools Library, Notifications
 */

interface DiscoveryLayoutProps {
  children: React.ReactNode;
  /** Header content (filters, search, tabs) - sticky at top */
  header?: React.ReactNode;
  /** Whether header should be sticky */
  stickyHeader?: boolean;
}

export function DiscoveryLayout({
  children,
  header,
  stickyHeader = true,
}: DiscoveryLayoutProps) {
  return (
    <LayoutProvider archetype="discovery">
      <div className="min-h-screen bg-[var(--bg-ground,#0A0A09)] flex flex-col">
        {/* Header zone (filters, search, tabs) */}
        {header && (
          <div
            className={`
              w-full
              bg-[var(--bg-ground,#0A0A09)]
              border-b border-white/[0.06]
              ${stickyHeader ? 'sticky top-0 z-10' : ''}
            `.trim()}
          >
            <div className="w-full px-6 py-4">
              {header}
            </div>
          </div>
        )}

        {/* Content zone (list/grid) */}
        <div className="flex-1 w-full px-6 py-6">
          {children}
        </div>
      </div>
    </LayoutProvider>
  );
}

/**
 * DiscoveryGrid
 *
 * Uniform grid for discovery content.
 * No hero items, no editorial emphasis.
 */
interface DiscoveryGridProps {
  children: React.ReactNode;
  /** Grid columns */
  columns?: 1 | 2 | 3 | 4;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
}

const GAP_MAP = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
} as const;

export function DiscoveryGrid({
  children,
  columns = 3,
  gap = 'md',
}: DiscoveryGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} ${GAP_MAP[gap]}`}>
      {children}
    </div>
  );
}

/**
 * DiscoveryList
 *
 * Uniform list for discovery content.
 */
interface DiscoveryListProps {
  children: React.ReactNode;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
}

export function DiscoveryList({
  children,
  gap = 'sm',
}: DiscoveryListProps) {
  return (
    <div className={`flex flex-col ${GAP_MAP[gap]}`}>
      {children}
    </div>
  );
}

/**
 * DiscoveryEmpty
 *
 * Honest, quiet empty state.
 */
interface DiscoveryEmptyProps {
  /** Brief explanation */
  message: string;
  /** Optional action */
  action?: React.ReactNode;
}

export function DiscoveryEmpty({ message, action }: DiscoveryEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-[var(--text-secondary,#888)] text-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
