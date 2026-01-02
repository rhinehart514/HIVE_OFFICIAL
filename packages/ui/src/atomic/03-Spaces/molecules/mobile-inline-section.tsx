/**
 * MobileInlineSection - Mobile collapsible sections for sidebar content
 *
 * On mobile, sidebar widgets become inline collapsible sections placed
 * within the main content flow. This component provides that pattern
 * with appropriate styling for mobile viewports.
 *
 * Desktop: Hidden (content goes to sidebar)
 * Mobile: Visible as collapsible card
 *
 * @example
 * <MobileInlineSection
 *   title="About this Space"
 *   icon={<InfoIcon />}
 *   defaultExpanded
 * >
 *   <SpaceDescription />
 * </MobileInlineSection>
 */
'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { GlassSurface } from '../atoms/glass-surface';
import {
  collapsibleVariants,
  chevronRotateVariants,
  sectionRevealVariants,
} from '../../../lib/motion-variants-spaces';

export interface MobileInlineSectionProps {
  /** Section title */
  title: string;
  /** Optional icon */
  icon?: React.ReactNode;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Whether expanded by default */
  defaultExpanded?: boolean;
  /** Priority level affects visual weight (1 = highest) */
  priority?: 1 | 2 | 3;
  /** Badge content (e.g., count, status) */
  badge?: React.ReactNode;
  /** Section content */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Whether to show on tablet as well (default: mobile only) */
  showOnTablet?: boolean;
}

const PRIORITY_STYLES: Record<number, { header: string; icon: string }> = {
  1: {
    header: 'text-neutral-50',
    icon: 'text-white',
  },
  2: {
    header: 'text-neutral-100',
    icon: 'text-neutral-400',
  },
  3: {
    header: 'text-neutral-200',
    icon: 'text-neutral-500',
  },
};

export function MobileInlineSection({
  title,
  icon,
  subtitle,
  defaultExpanded = false,
  priority = 2,
  badge,
  children,
  className,
  showOnTablet = false,
}: MobileInlineSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const styles = PRIORITY_STYLES[priority];

  return (
    <motion.div
      variants={sectionRevealVariants}
      initial="initial"
      animate="animate"
      className={cn(
        // Mobile only by default
        'block',
        showOnTablet ? 'lg:hidden' : 'md:hidden',
        className
      )}
    >
      <GlassSurface
        variant="panel"
        panelType="light"
        rounded="xl"
        className="overflow-hidden"
      >
        {/* Header */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex w-full items-center justify-between',
            'px-4 py-3',
            'text-left',
            'hover:bg-white/[0.02] transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-inset'
          )}
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <span className={cn('flex-shrink-0', styles.icon)}>
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <div className={cn('font-medium text-sm truncate', styles.header)}>
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-neutral-500 truncate">
                  {subtitle}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {badge && (
              <span className="text-xs text-neutral-400 bg-neutral-800/60 px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
            <motion.span
              variants={chevronRotateVariants}
              animate={isExpanded ? 'expanded' : 'collapsed'}
              className="text-neutral-500"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </div>
        </button>

        {/* Content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              variants={collapsibleVariants}
              initial="collapsed"
              animate="expanded"
              exit="collapsed"
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1 border-t border-white/[0.04]">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassSurface>
    </motion.div>
  );
}

// Preset for About section
export function MobileAboutSection({
  description,
  memberCount,
  isPublic,
  ...props
}: Omit<MobileInlineSectionProps, 'children' | 'title'> & {
  description?: string;
  memberCount?: number;
  isPublic?: boolean;
}) {
  return (
    <MobileInlineSection
      title="About"
      priority={1}
      defaultExpanded
      badge={memberCount ? `${memberCount} members` : undefined}
      {...props}
    >
      {description ? (
        <p className="text-sm text-neutral-300 leading-relaxed">
          {description}
        </p>
      ) : (
        <p className="text-sm text-neutral-500 italic">
          No description yet
        </p>
      )}
    </MobileInlineSection>
  );
}

// Preset for Tools section
export function MobileToolsSection({
  tools,
  onToolClick,
  ...props
}: Omit<MobileInlineSectionProps, 'children' | 'title'> & {
  tools: Array<{ id: string; name: string; icon?: React.ReactNode }>;
  onToolClick?: (toolId: string) => void;
}) {
  return (
    <MobileInlineSection
      title="Tools"
      priority={2}
      badge={tools.length > 0 ? tools.length : undefined}
      {...props}
    >
      {tools.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolClick?.(tool.id)}
              className={cn(
                'inline-flex items-center gap-1.5',
                'px-3 py-1.5 rounded-lg',
                'bg-neutral-800/50 hover:bg-neutral-700/50',
                'text-xs text-neutral-200',
                'transition-colors duration-150'
              )}
            >
              {tool.icon && <span className="text-neutral-400">{tool.icon}</span>}
              {tool.name}
              <ChevronRight className="h-3 w-3 text-neutral-500" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-neutral-500 italic">
          No tools available
        </p>
      )}
    </MobileInlineSection>
  );
}
