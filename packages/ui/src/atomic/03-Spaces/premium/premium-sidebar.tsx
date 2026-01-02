'use client';

/**
 * PremiumSidebar - Apple-style glass morphism sidebar
 *
 * Design Philosophy:
 * - Translucent glass cards with backdrop blur
 * - Generous padding and spacing
 * - Subtle borders and shadows
 * - Smooth collapse/expand animations
 * - Gold accents for interactive elements
 *
 * Inspired by: Apple, macOS, iOS
 *
 * @author HIVE Frontend Team
 * @version 1.0.0 - Premium redesign
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ChevronDown,
  Users,
  Calendar,
  Wrench,
  Info,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { premium } from '../../../lib/premium-design';
import { Avatar, AvatarFallback, AvatarImage } from '../../00-Global/atoms/avatar';

// ============================================================
// Types
// ============================================================

export interface SidebarSection {
  id: string;
  title: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  content: React.ReactNode;
}

export interface PremiumSidebarProps {
  /** Sections to render */
  sections: SidebarSection[];
  /** Additional header content */
  headerContent?: React.ReactNode;
  /** Footer actions */
  footerActions?: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }>;
  /** Additional className */
  className?: string;
}

// ============================================================
// Motion Variants
// ============================================================

const sectionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.3, ease: [0.23, 1, 0.32, 1] },
  },
};

const chevronVariants = {
  collapsed: { rotate: -90 },
  expanded: { rotate: 0 },
};

// ============================================================
// Glass Card Component
// ============================================================

export interface GlassCardProps {
  title: string;
  icon?: React.ReactNode;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({
  title,
  icon,
  defaultCollapsed = false,
  children,
  className,
}: GlassCardProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={premium.motion.spring.default}
      className={cn(
        // Glass morphism
        'bg-[rgba(255,255,255,0.03)]',
        'backdrop-blur-[20px]',
        'border border-white/[0.06]',
        'rounded-2xl',
        'overflow-hidden',
        className
      )}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          'w-full flex items-center justify-between',
          'px-5 py-4',
          'text-left',
          'hover:bg-white/[0.02]',
          'transition-colors duration-150'
        )}
      >
        <div className="flex items-center gap-3">
          {icon && (
            <div className="text-[#9A9A9F]">{icon}</div>
          )}
          <span className="text-[14px] font-semibold text-[#FAFAFA]">
            {title}
          </span>
        </div>

        <motion.div
          variants={chevronVariants}
          animate={isCollapsed ? 'collapsed' : 'expanded'}
          transition={premium.motion.spring.snappy}
        >
          <ChevronDown className="w-4 h-4 text-[#6B6B70]" />
        </motion.div>
      </button>

      {/* Content - Collapsible */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            variants={shouldReduceMotion ? {} : sectionVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// Pre-built Section Components
// ============================================================

// About Section
export interface AboutSectionData {
  description?: string;
  memberCount: number;
  onlineCount?: number;
  category?: string;
}

export function AboutSection({ data }: { data: AboutSectionData }) {
  return (
    <GlassCard title="About" icon={<Info className="w-4 h-4" />}>
      <div className="space-y-4">
        {data.description && (
          <p className="text-[14px] leading-[1.6] text-[#9A9A9F]">
            {data.description}
          </p>
        )}

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#6B6B70]" />
            <span className="text-[14px] font-medium text-[#FAFAFA]">
              {data.memberCount.toLocaleString()}
            </span>
            <span className="text-[14px] text-[#6B6B70]">members</span>
          </div>

          {data.onlineCount !== undefined && data.onlineCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
              <span className="text-[14px] font-medium text-[#FFD700]">
                {data.onlineCount}
              </span>
              <span className="text-[14px] text-[#6B6B70]">online</span>
            </div>
          )}
        </div>

        {data.category && (
          <div className="inline-flex px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <span className="text-[12px] text-[#9A9A9F]">{data.category}</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// Events Section
export interface EventItem {
  id: string;
  title: string;
  date: Date;
  attendees?: number;
  isUrgent?: boolean;
}

export function EventsSection({
  events,
  onEventClick,
  onViewAll,
}: {
  events: EventItem[];
  onEventClick?: (id: string) => void;
  onViewAll?: () => void;
}) {
  const formatEventDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <GlassCard title="Upcoming Events" icon={<Calendar className="w-4 h-4" />}>
      {events.length === 0 ? (
        <div className="py-4 text-center">
          <Calendar className="w-8 h-8 mx-auto text-[#4A4A4F] mb-2" />
          <p className="text-[14px] text-[#6B6B70]">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.slice(0, 3).map((event) => (
            <motion.button
              key={event.id}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onEventClick?.(event.id)}
              className={cn(
                'w-full flex items-center gap-3',
                'p-3 -mx-3 rounded-xl',
                'text-left',
                'hover:bg-white/[0.04]',
                'transition-colors duration-150'
              )}
            >
              {/* Date indicator */}
              <div
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-xl',
                  'flex items-center justify-center',
                  event.isUrgent
                    ? 'bg-[#FFD700]/15 text-[#FFD700]'
                    : 'bg-white/[0.04] text-[#9A9A9F]'
                )}
              >
                <Calendar className="w-4 h-4" />
              </div>

              {/* Event info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#FAFAFA] truncate">
                  {event.title}
                </p>
                <p className="text-[12px] text-[#6B6B70]">
                  {formatEventDate(event.date)}
                  {event.attendees !== undefined && ` • ${event.attendees} going`}
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-[#4A4A4F]" />
            </motion.button>
          ))}

          {events.length > 3 && onViewAll && (
            <button
              onClick={onViewAll}
              className="w-full py-2 text-[13px] text-[#9A9A9F] hover:text-white transition-colors"
            >
              View all {events.length} events
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// Members Section
export interface MemberItem {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
  isOnline?: boolean;
}

export function MembersSection({
  members,
  totalCount,
  onMemberClick,
  onViewAll,
}: {
  members: MemberItem[];
  totalCount?: number;
  onMemberClick?: (id: string) => void;
  onViewAll?: () => void;
}) {
  return (
    <GlassCard title="Members" icon={<Users className="w-4 h-4" />}>
      <div className="space-y-3">
        {/* Avatar stack */}
        <div className="flex flex-wrap gap-2">
          {members.slice(0, 8).map((member) => (
            <motion.button
              key={member.id}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMemberClick?.(member.id)}
              className="relative group"
              title={member.name}
            >
              <Avatar className="w-9 h-9 ring-2 ring-[#111111] group-hover:ring-white/30 transition-all">
                {member.avatarUrl ? (
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                ) : (
                  <AvatarFallback className="bg-[#1A1A1A] text-[#9A9A9F] text-xs font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              {/* Online indicator */}
              {member.isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#22C55E] ring-2 ring-[#111111]" />
              )}

              {/* Role indicator (owner) */}
              {member.role === 'owner' && (
                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FFD700] ring-2 ring-[#111111]" />
              )}
            </motion.button>
          ))}

          {totalCount && totalCount > 8 && (
            <div className="w-9 h-9 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
              <span className="text-[11px] font-medium text-[#6B6B70]">
                +{totalCount - 8}
              </span>
            </div>
          )}
        </div>

        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-[13px] text-[#9A9A9F] hover:text-white transition-colors"
          >
            View all members
          </button>
        )}
      </div>
    </GlassCard>
  );
}

// Tools Section
export interface ToolItem {
  id: string;
  name: string;
  icon?: string;
  isActive?: boolean;
}

export function ToolsSection({
  tools,
  onToolClick,
  onViewAll,
}: {
  tools: ToolItem[];
  onToolClick?: (id: string) => void;
  onViewAll?: () => void;
}) {
  return (
    <GlassCard title="Tools" icon={<Wrench className="w-4 h-4" />}>
      {tools.length === 0 ? (
        <div className="py-4 text-center">
          <Wrench className="w-8 h-8 mx-auto text-[#4A4A4F] mb-2" />
          <p className="text-[14px] text-[#6B6B70]">No tools deployed</p>
        </div>
      ) : (
        <div className="space-y-1">
          {tools.slice(0, 5).map((tool) => (
            <motion.button
              key={tool.id}
              whileHover={{ scale: 1.01, x: 2 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onToolClick?.(tool.id)}
              className={cn(
                'w-full flex items-center gap-3',
                'p-2.5 -mx-2.5 rounded-xl',
                'text-left',
                'hover:bg-white/[0.04]',
                'transition-colors duration-150'
              )}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                {tool.icon ? (
                  <span className="text-sm">{tool.icon}</span>
                ) : (
                  <Wrench className="w-4 h-4 text-[#9A9A9F]" />
                )}
              </div>

              <span className="flex-1 text-[14px] text-[#FAFAFA] truncate">
                {tool.name}
              </span>

              {tool.isActive && (
                <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              )}
            </motion.button>
          ))}

          {tools.length > 5 && onViewAll && (
            <button
              onClick={onViewAll}
              className="w-full py-2 text-[13px] text-[#9A9A9F] hover:text-white transition-colors"
            >
              View all {tools.length} tools
            </button>
          )}
        </div>
      )}
    </GlassCard>
  );
}

// ============================================================
// Main Sidebar Component
// ============================================================

export function PremiumSidebar({
  sections,
  headerContent,
  footerActions,
  className,
}: PremiumSidebarProps) {
  return (
    <aside
      className={cn(
        'h-full flex flex-col',
        'bg-[#0A0A0A]/50',
        'border-l border-white/[0.06]',
        className
      )}
    >
      {/* Header */}
      {headerContent && (
        <div className="flex-shrink-0 p-5 border-b border-white/[0.06]">
          {headerContent}
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
        {sections.map((section) => (
          <GlassCard
            key={section.id}
            title={section.title}
            icon={section.icon}
            defaultCollapsed={section.defaultCollapsed}
          >
            {section.content}
          </GlassCard>
        ))}
      </div>

      {/* Footer actions */}
      {footerActions && footerActions.length > 0 && (
        <div className="flex-shrink-0 p-5 border-t border-white/[0.06]">
          <div className="space-y-2">
            {footerActions.map((action) => (
              <motion.button
                key={action.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={action.onClick}
                className={cn(
                  'w-full flex items-center justify-center gap-2',
                  'px-4 py-3 rounded-xl',
                  'bg-white/[0.04] hover:bg-white/[0.06]',
                  'border border-white/[0.06] hover:border-white/[0.10]',
                  'text-[14px] font-medium text-[#9A9A9F] hover:text-white',
                  'transition-all duration-150'
                )}
              >
                {action.icon}
                <span>{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

export default PremiumSidebar;
