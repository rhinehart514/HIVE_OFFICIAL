'use client';

/**
 * SpaceAboutWidget - About section for space sidebar
 *
 * Refactored to use CollapsibleWidget pattern and glass morphism.
 * Now leverages centralized motion variants for consistent animation.
 */

import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Users, Shield, Info } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { CollapsibleWidget } from './collapsible-widget';
import { SpaceEmptyState } from './space-empty-state';
import { railWidgetVariants } from '../../../lib/motion-variants-spaces';
import {
  Badge,
  Button,
} from '../../00-Global/atoms';

export interface SpaceLeader {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
}

export interface SpaceAboutData {
  spaceId: string;
  description: string;
  memberCount: number;
  leaders: SpaceLeader[];
  category?: string;
  createdDate?: string;
  isPublic: boolean;
  isMember?: boolean;
}

export interface SpaceAboutWidgetCallbacks {
  onJoin?: (spaceId: string) => void;
  onLeave?: (spaceId: string) => void;
  onLeaderClick?: (leaderId: string) => void;
}

export interface SpaceAboutWidgetProps
  extends SpaceAboutWidgetCallbacks,
    React.HTMLAttributes<HTMLDivElement> {
  data: SpaceAboutData;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  /** Compact mode for mobile inline sections */
  compact?: boolean;
  /**
   * Inline mode: renders content without any wrapper styling
   * Used when widget is rendered inside a unified container (SpaceSidebar unified mode)
   */
  inline?: boolean;
}

export const SpaceAboutWidget = React.forwardRef<HTMLDivElement, SpaceAboutWidgetProps>(
  (
    {
      data,
      collapsible = true,
      defaultCollapsed = false,
      compact = false,
      inline = false,
      onJoin,
      onLeave,
      onLeaderClick,
      className,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion();
    const { memberCount, leaders, category, createdDate, isPublic, isMember } = data;

    const handleJoinLeave = () => {
      if (isMember) {
        onLeave?.(data.spaceId);
      } else {
        onJoin?.(data.spaceId);
      }
    };

    const content = (
      <div className={cn('flex flex-col', compact ? 'gap-3' : 'gap-5')}>
        {/* Description */}
        {data.description ? (
          <p className="text-sm leading-relaxed text-neutral-300">
            {data.description}
          </p>
        ) : (
          <SpaceEmptyState
            variant="custom"
            title="No description"
            description="This space hasn't added a description yet."
            size="sm"
            animate={false}
          />
        )}

        {/* Stats Grid */}
        {!compact && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 rounded-xl border border-neutral-800/50 bg-neutral-900/50 p-3">
              <div className="flex items-center gap-2 text-neutral-500">
                <Users className="h-4 w-4" />
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  Members
                </span>
              </div>
              <span className="text-2xl font-bold text-neutral-100">
                {memberCount.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-neutral-800/50 bg-neutral-900/50 p-3">
              <div className="flex items-center gap-2 text-neutral-500">
                <Shield className="h-4 w-4" />
                <span className="text-[10px] font-medium uppercase tracking-wider">
                  Leaders
                </span>
              </div>
              <span className="text-2xl font-bold text-neutral-100">
                {leaders.length}
              </span>
            </div>
          </div>
        )}

        {/* Leaders */}
        {leaders.length > 0 && (
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Space Leaders
            </h4>
            <div className="flex flex-col gap-2">
              {leaders.slice(0, compact ? 2 : leaders.length).map((leader) => (
                <motion.button
                  key={leader.id}
                  onClick={() => onLeaderClick?.(leader.id)}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg border border-transparent p-2',
                    'transition-colors duration-150',
                    'hover:border-neutral-800/50 hover:bg-neutral-900/50',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/50'
                  )}
                  whileHover={shouldReduceMotion ? undefined : { x: 4 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500/10 text-xs font-bold text-gold-400">
                    {leader.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-neutral-100 truncate w-full text-left">
                      {leader.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      {leader.role}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Meta Info */}
        {!compact && (
          <div className="flex flex-wrap gap-2 border-t border-neutral-800/50 pt-4">
            {category && (
              <Badge variant="outline" className="text-neutral-400 border-neutral-700">
                {category}
              </Badge>
            )}
            <Badge variant="outline" className="text-neutral-400 border-neutral-700">
              {isPublic ? 'Public' : 'Private'}
            </Badge>
            {createdDate && (
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                Est. {createdDate}
              </span>
            )}
          </div>
        )}

        {/* NOTE: Join/Leave buttons removed - header has the primary CTA */}
      </div>
    );

    // INLINE MODE: No wrapper, just content with horizontal padding
    // Used when rendered inside a unified sidebar container
    if (inline || !collapsible) {
      return (
        <div ref={ref} className={cn('px-4', className)} {...props}>
          {/* Section header for inline mode */}
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-neutral-400" />
            <span className="font-medium text-sm text-neutral-100">About</span>
          </div>
          {content}
        </div>
      );
    }

    // STANDALONE MODE: Use CollapsibleWidget for collapsible version
    // NOTE: No badge - member count is already shown inside the widget
    return (
      <div ref={ref} className={className} {...props}>
        <CollapsibleWidget
          title="About"
          icon={<Info className="h-4 w-4" />}
          defaultCollapsed={defaultCollapsed}
          persistKey={`space-about-${data.spaceId}`}
          glass
        >
          {content}
        </CollapsibleWidget>
      </div>
    );
  }
);

SpaceAboutWidget.displayName = 'SpaceAboutWidget';
