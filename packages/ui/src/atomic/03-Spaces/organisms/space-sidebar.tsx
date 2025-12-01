'use client';

/**
 * SpaceSidebar - Unified sidebar organism for Space pages
 *
 * REDESIGNED for Phase 2: Single glass container with internal dividers
 * Composes all sidebar widgets into a cohesive unit with:
 * - ONE glass morphism container (not per-widget)
 * - Dividers between sections (not borders)
 * - Sticky positioning with proper offset
 * - Staggered reveal animation (T3)
 * - Mobile-ready (content can be extracted for inline sections)
 *
 * @version 2.0.0 - Unified glass container approach
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '../../../lib/utils';
import { SpaceAboutWidget, type SpaceAboutData, type SpaceAboutWidgetCallbacks } from '../molecules/space-about-widget';
import { SpaceToolsWidget, type SpaceToolsWidgetData, type SpaceToolsWidgetCallbacks } from '../molecules/space-tools-widget';
import { RailWidget, type RailWidgetProps } from '../molecules/rail-widget';
import { NowCard, type NowCardProps } from '../molecules/now-card';
import { listStaggerVariants, staggerFadeItemVariants, railWidgetVariants } from '../../../lib/motion-variants-spaces';
import { GlassWidget } from '../atoms/glass-surface';

// Types for sidebar data
export interface SpaceSidebarAbout extends SpaceAboutData {}

export interface SpaceSidebarTools {
  spaceId: string;
  tools: SpaceToolsWidgetData['tools'];
  hasMore: boolean;
}

export interface SpaceSidebarEvent {
  id: string;
  title: string;
  subtitle?: string;
  when?: string;
  where?: string;
  isUrgent?: boolean;
}

export interface SpaceSidebarData {
  spaceId: string;
  about?: SpaceSidebarAbout;
  tools?: SpaceSidebarTools;
  upcomingEvents?: SpaceSidebarEvent[];
  quickActions?: Array<{
    id: string;
    variant: RailWidgetProps['variant'];
    title?: string;
    description?: string;
    progress?: number;
    ctaLabel?: string;
  }>;
}

export interface SpaceSidebarCallbacks extends SpaceAboutWidgetCallbacks, SpaceToolsWidgetCallbacks {
  onEventClick?: (eventId: string) => void;
  onQuickActionClick?: (actionId: string) => void;
}

export interface SpaceSidebarProps {
  /** Sidebar data */
  data: SpaceSidebarData;
  /** Callbacks for user interactions */
  callbacks?: SpaceSidebarCallbacks;
  /** Gap between widgets (used when not unified) */
  gap?: 'sm' | 'md' | 'lg';
  /** Whether to animate on mount */
  animate?: boolean;
  /** Whether widgets are collapsible */
  collapsible?: boolean;
  /** Default collapsed state for widgets */
  defaultCollapsed?: boolean;
  /**
   * Unified mode: single glass container with dividers between sections
   * When true, all widgets are rendered in one container
   * When false, each widget has its own glass container (legacy)
   */
  unified?: boolean;
  /**
   * Sticky positioning for desktop scroll
   * Applies sticky top positioning with proper offset
   */
  sticky?: boolean;
  /**
   * Top offset for sticky positioning (e.g., '80px' for header height)
   */
  stickyTop?: string;
  /** Additional className */
  className?: string;
}

const GAP_CLASSES = {
  sm: 'gap-3',
  md: 'gap-4',
  lg: 'gap-6',
};

/**
 * Divider component for unified sidebar sections
 */
function SidebarDivider() {
  return <div className="border-t border-white/[0.06] mx-4" />;
}

/**
 * Section wrapper for unified mode - no glass, just content
 */
interface UnifiedSectionProps {
  children: React.ReactNode;
  animate?: boolean;
  shouldReduceMotion?: boolean;
}

function UnifiedSection({ children, animate, shouldReduceMotion }: UnifiedSectionProps) {
  if (animate && !shouldReduceMotion) {
    return (
      <motion.div variants={staggerFadeItemVariants} className="py-3">
        {children}
      </motion.div>
    );
  }
  return <div className="py-3">{children}</div>;
}

export function SpaceSidebar({
  data,
  callbacks = {},
  gap = 'md',
  animate = true,
  collapsible = true,
  defaultCollapsed = false,
  unified = true, // Default to new unified mode
  sticky = true,
  stickyTop = '88px', // Header height + padding
  className,
}: SpaceSidebarProps) {
  const shouldReduceMotion = useReducedMotion();
  const {
    onJoin,
    onLeave,
    onLeaderClick,
    onToolClick,
    onViewAll,
    onEventClick,
    onQuickActionClick,
  } = callbacks;

  // Count how many sections we have for rendering dividers
  const sections: React.ReactNode[] = [];

  // About section content
  if (data.about) {
    sections.push(
      <SpaceAboutWidget
        key="about"
        data={data.about}
        collapsible={false} // In unified mode, use built-in expand/collapse
        defaultCollapsed={defaultCollapsed}
        onJoin={onJoin}
        onLeave={onLeave}
        onLeaderClick={onLeaderClick}
      />
    );
  }

  // Tools section content
  if (data.tools && data.tools.tools.length > 0) {
    sections.push(
      <SpaceToolsWidget
        key="tools"
        data={{
          spaceId: data.tools.spaceId,
          tools: data.tools.tools,
          hasMore: data.tools.hasMore,
        }}
        collapsible={false} // In unified mode, use built-in expand/collapse
        defaultCollapsed={defaultCollapsed}
        onToolClick={onToolClick}
        onViewAll={onViewAll}
      />
    );
  }

  // UNIFIED MODE: Single glass container with dividers
  if (unified) {
    const Container = animate && !shouldReduceMotion ? motion.aside : 'aside';
    const containerProps = animate && !shouldReduceMotion
      ? {
          variants: railWidgetVariants,
          initial: 'initial',
          animate: 'animate',
        }
      : {};

    return (
      <Container
        className={cn(
          // Glass morphism - single container
          'bg-neutral-900/80 backdrop-blur-[8px] border border-white/[0.06] rounded-2xl',
          // Shadow
          'shadow-xl shadow-black/20',
          // Sticky positioning
          sticky && 'lg:sticky',
          className
        )}
        style={sticky ? { top: stickyTop } : undefined}
        {...containerProps}
      >
        <motion.div
          variants={animate && !shouldReduceMotion ? listStaggerVariants : undefined}
          initial={animate && !shouldReduceMotion ? 'hidden' : undefined}
          animate={animate && !shouldReduceMotion ? 'visible' : undefined}
          className="flex flex-col"
        >
          {sections.map((section, index) => (
            <React.Fragment key={index}>
              {index > 0 && <SidebarDivider />}
              <UnifiedSection animate={animate} shouldReduceMotion={shouldReduceMotion ?? false}>
                {section}
              </UnifiedSection>
            </React.Fragment>
          ))}

          {/* Upcoming Events - rendered as NowCards within unified container */}
          {data.upcomingEvents && data.upcomingEvents.length > 0 && (
            <>
              {sections.length > 0 && <SidebarDivider />}
              <UnifiedSection animate={animate} shouldReduceMotion={shouldReduceMotion ?? false}>
                <div className="flex flex-col gap-3 px-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Upcoming Events
                  </h3>
                  {data.upcomingEvents.map((event) => (
                    <NowCard
                      key={event.id}
                      title={event.title}
                      subtitle={event.subtitle}
                      when={event.when}
                      where={event.where}
                      isUrgent={event.isUrgent}
                      ctaLabel="View"
                      onCta={() => onEventClick?.(event.id)}
                    />
                  ))}
                </div>
              </UnifiedSection>
            </>
          )}
        </motion.div>
      </Container>
    );
  }

  // LEGACY MODE: Separate containers per widget
  const Container = animate && !shouldReduceMotion ? motion.div : 'div';
  const containerProps = animate && !shouldReduceMotion
    ? {
        variants: listStaggerVariants,
        initial: 'hidden',
        animate: 'visible',
      }
    : {};

  const ItemWrapper = animate && !shouldReduceMotion ? motion.div : 'div';
  const itemProps = animate && !shouldReduceMotion
    ? { variants: staggerFadeItemVariants }
    : {};

  return (
    <Container
      className={cn(
        'flex flex-col',
        GAP_CLASSES[gap],
        sticky && 'lg:sticky',
        className
      )}
      style={sticky ? { top: stickyTop } : undefined}
      {...containerProps}
    >
      {/* About Widget */}
      {data.about && (
        <ItemWrapper {...itemProps}>
          <SpaceAboutWidget
            data={data.about}
            collapsible={collapsible}
            defaultCollapsed={defaultCollapsed}
            onJoin={onJoin}
            onLeave={onLeave}
            onLeaderClick={onLeaderClick}
          />
        </ItemWrapper>
      )}

      {/* Tools Widget */}
      {data.tools && (
        <ItemWrapper {...itemProps}>
          <SpaceToolsWidget
            data={{
              spaceId: data.tools.spaceId,
              tools: data.tools.tools,
              hasMore: data.tools.hasMore,
            }}
            collapsible={collapsible}
            defaultCollapsed={defaultCollapsed}
            onToolClick={onToolClick}
            onViewAll={onViewAll}
          />
        </ItemWrapper>
      )}

      {/* Upcoming Events */}
      {data.upcomingEvents && data.upcomingEvents.length > 0 && (
        <>
          {data.upcomingEvents.map((event) => (
            <ItemWrapper key={event.id} {...itemProps}>
              <NowCard
                title={event.title}
                subtitle={event.subtitle}
                when={event.when}
                where={event.where}
                isUrgent={event.isUrgent}
                ctaLabel="View Event"
                onCta={() => onEventClick?.(event.id)}
              />
            </ItemWrapper>
          ))}
        </>
      )}

      {/* Quick Actions */}
      {data.quickActions && data.quickActions.length > 0 && (
        <>
          {data.quickActions.map((action) => (
            <ItemWrapper key={action.id} {...itemProps}>
              <RailWidget
                variant={action.variant}
                title={action.title}
                description={action.description}
                progress={action.progress}
                ctaLabel={action.ctaLabel}
                onCta={() => onQuickActionClick?.(action.id)}
              />
            </ItemWrapper>
          ))}
        </>
      )}
    </Container>
  );
}

// Preset for minimal sidebar (just about + tools)
export interface SpaceSidebarMinimalProps {
  about: SpaceSidebarAbout;
  tools?: SpaceSidebarTools;
  callbacks?: SpaceSidebarCallbacks;
  className?: string;
}

export function SpaceSidebarMinimal({
  about,
  tools,
  callbacks,
  className,
}: SpaceSidebarMinimalProps) {
  return (
    <SpaceSidebar
      data={{
        spaceId: about.spaceId,
        about,
        tools,
      }}
      callbacks={callbacks}
      className={className}
    />
  );
}
