'use client';

import * as React from 'react';
import { LayoutProvider } from './LayoutContext';

/**
 * OrientationLayout
 *
 * Archetype: Orientation
 * Purpose: identity + navigation + capability
 * Behavior: calm, structured, no inline "work"
 * Shell: ON
 *
 * Rules:
 * - No dashboards
 * - No grids
 * - No content previews
 * - Vertical stacked blocks only
 * - Max-width constrained for readability
 *
 * Use for: Space Hub, Profile, Settings, Tool Overview, About pages
 */

interface OrientationLayoutProps {
  children: React.ReactNode;
  /** Optional max-width override. Default: max-w-3xl */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  /** Optional padding override */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const MAX_WIDTH_MAP = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
} as const;

const PADDING_MAP = {
  none: '',
  sm: 'px-4 py-8',
  md: 'px-6 py-12',
  lg: 'px-6 py-16 md:py-20',
} as const;

export function OrientationLayout({
  children,
  maxWidth = '3xl',
  padding = 'lg',
}: OrientationLayoutProps) {
  return (
    <LayoutProvider archetype="orientation">
      <div className="min-h-screen bg-[var(--bg-ground,#0A0A09)]">
        <div
          className={`
            mx-auto
            ${MAX_WIDTH_MAP[maxWidth]}
            ${PADDING_MAP[padding]}
          `.trim()}
        >
          {/* Vertical stacked blocks container */}
          <div className="flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </LayoutProvider>
  );
}

/**
 * OrientationBlock
 *
 * A semantic section within an Orientation page.
 * Controls spacing between blocks.
 */
interface OrientationBlockProps {
  children: React.ReactNode;
  /** Spacing after this block */
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
}

const SPACING_MAP = {
  sm: 'mb-8',
  md: 'mb-12',
  lg: 'mb-16',
  xl: 'mb-20',
} as const;

export function OrientationBlock({
  children,
  spacing = 'lg',
}: OrientationBlockProps) {
  return (
    <section className={SPACING_MAP[spacing]}>
      {children}
    </section>
  );
}
