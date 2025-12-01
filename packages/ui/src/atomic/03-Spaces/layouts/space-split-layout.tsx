/**
 * SpaceSplitLayout - 60/40 responsive layout primitive for Spaces
 *
 * Provides the core layout structure for Space pages with true proportional
 * flex split (60% main / 40% sidebar) instead of fixed pixel widths.
 *
 * Features:
 * - Desktop (lg+): 60/40 side-by-side layout
 * - Tablet (md): Full width with optional sidebar
 * - Mobile: Single column, sidebar content becomes inline sections
 * - Main content area with proper min-width constraints
 * - Sidebar with sticky positioning and bounded width
 *
 * @example
 * <SpaceSplitLayout
 *   sidebar={<SpaceSidebar data={sidebarData} />}
 * >
 *   <SpaceHeader />
 *   <SpaceFeed />
 * </SpaceSplitLayout>
 */
'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { StickyRail } from '../atoms/sticky-rail';
import { sectionRevealVariants, gridStaggerVariants } from '../../../lib/motion-variants-spaces';

// Container width presets matching route requirements
type ContainerWidth = 'xl' | '5xl' | '6xl' | '7xl' | 'full';

export interface SpaceSplitLayoutProps {
  /** Main content area */
  children: React.ReactNode;
  /** Sidebar content (hidden on mobile, goes to StickyRail on desktop) */
  sidebar?: React.ReactNode;
  /** Mobile inline sections (shown only on mobile) */
  mobileInlineSections?: React.ReactNode;
  /** Container max-width preset */
  containerWidth?: ContainerWidth;
  /** Whether to reverse layout (sidebar on left) */
  reversed?: boolean;
  /** Whether sidebar should be sticky */
  stickySidebar?: boolean;
  /** Top offset for sticky sidebar */
  sidebarTopOffset?: number;
  /** Whether to animate layout on mount */
  animate?: boolean;
  /** Gap between main and sidebar */
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional className for container */
  className?: string;
  /** Additional className for main content area */
  mainClassName?: string;
  /** Additional className for sidebar area */
  sidebarClassName?: string;
}

const CONTAINER_CLASSES: Record<ContainerWidth, string> = {
  xl: 'max-w-xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

const GAP_CLASSES: Record<string, string> = {
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-8',
  xl: 'gap-10',
};

export function SpaceSplitLayout({
  children,
  sidebar,
  mobileInlineSections,
  containerWidth = '7xl',
  reversed = false,
  stickySidebar = true,
  sidebarTopOffset = 120,
  animate = true,
  gap = 'lg',
  className,
  mainClassName,
  sidebarClassName,
}: SpaceSplitLayoutProps) {
  const Container = animate ? motion.div : 'div';
  const containerProps = animate
    ? { variants: gridStaggerVariants, initial: 'hidden', animate: 'visible' }
    : {};

  const MainWrapper = animate ? motion.main : 'main';
  const mainProps = animate
    ? { variants: sectionRevealVariants }
    : {};

  return (
    <Container
      {...containerProps}
      className={cn(
        'mx-auto px-4 sm:px-6',
        CONTAINER_CLASSES[containerWidth],
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col lg:flex-row',
          GAP_CLASSES[gap],
          reversed && 'lg:flex-row-reverse'
        )}
      >
        {/* Main Content Area - 60% on desktop */}
        <MainWrapper
          {...mainProps}
          className={cn(
            // Flex ratio: 3 parts of 5 total = 60%
            'flex-[3] min-w-0',
            // Ensure content doesn't overflow
            'overflow-hidden',
            mainClassName
          )}
        >
          {/* Mobile inline sections (shown only on mobile/tablet) */}
          {mobileInlineSections && (
            <div className="lg:hidden mb-4 space-y-3">
              {mobileInlineSections}
            </div>
          )}

          {/* Main content */}
          {children}
        </MainWrapper>

        {/* Sidebar Area - 40% on desktop, hidden on mobile */}
        {sidebar && (
          <aside
            className={cn(
              // Hidden on mobile, visible on desktop
              'hidden lg:block',
              // Flex ratio: 2 parts of 5 total = 40%
              'flex-[2]',
              // Bounded width constraints
              'min-w-[280px] max-w-[400px]',
              // Self-align for sticky positioning
              'self-start',
              sidebarClassName
            )}
          >
            {stickySidebar ? (
              <StickyRail topOffset={sidebarTopOffset} animate={animate}>
                {sidebar}
              </StickyRail>
            ) : (
              sidebar
            )}
          </aside>
        )}
      </div>
    </Container>
  );
}

// Full-width variant (no sidebar)
export interface SpaceFullWidthLayoutProps {
  children: React.ReactNode;
  containerWidth?: ContainerWidth;
  animate?: boolean;
  className?: string;
}

export function SpaceFullWidthLayout({
  children,
  containerWidth = '7xl',
  animate = true,
  className,
}: SpaceFullWidthLayoutProps) {
  const Wrapper = animate ? motion.div : 'div';
  const wrapperProps = animate
    ? { variants: sectionRevealVariants, initial: 'initial', animate: 'animate' }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'mx-auto px-4 sm:px-6',
        CONTAINER_CLASSES[containerWidth],
        className
      )}
    >
      {children}
    </Wrapper>
  );
}

// Centered content variant (forms, settings)
export interface SpaceCenteredLayoutProps {
  children: React.ReactNode;
  containerWidth?: ContainerWidth;
  animate?: boolean;
  className?: string;
}

export function SpaceCenteredLayout({
  children,
  containerWidth = '5xl',
  animate = true,
  className,
}: SpaceCenteredLayoutProps) {
  return (
    <SpaceFullWidthLayout
      containerWidth={containerWidth}
      animate={animate}
      className={cn('flex flex-col items-center', className)}
    >
      <div className="w-full max-w-2xl">
        {children}
      </div>
    </SpaceFullWidthLayout>
  );
}

// Page wrapper with standard padding
export interface SpacePageLayoutProps {
  children: React.ReactNode;
  /** Vertical padding preset */
  paddingY?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const PADDING_Y_CLASSES: Record<string, string> = {
  none: '',
  sm: 'py-4',
  md: 'py-6',
  lg: 'py-8',
};

export function SpacePageLayout({
  children,
  paddingY = 'md',
  className,
}: SpacePageLayoutProps) {
  return (
    <div className={cn(PADDING_Y_CLASSES[paddingY], className)}>
      {children}
    </div>
  );
}
