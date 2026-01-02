'use client';

/**
 * ContextPanel - Slide-in Space Context (The Hub - Phase 6)
 *
 * Replaces permanent sidebar with on-demand context panel:
 * - Desktop: Slides in from right (360px), content dimmed behind
 * - Mobile: Bottom sheet with drag gestures and snap points:
 *   - Peek mode: 40vh (quick glance at About)
 *   - Full mode: 90vh (all sections visible)
 *   - Swipe down to dismiss, swipe up to expand
 * - Collapsible sections for About, Events, Members, Tools
 * - Close on outside click, Escape, or swipe
 * - Triggered by ⓘ icon or ⌘I keyboard shortcut
 *
 * Part of "The Hub" layout - full-width chat, context on demand.
 *
 * @version 3.0.0 - Added mobile snap points and drag gestures
 */

import * as React from 'react';
import { motion, AnimatePresence, useReducedMotion, PanInfo } from 'framer-motion';
import {
  X,
  Info,
  Calendar,
  Users,
  Wrench,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

// Premium easing
const EASE_PREMIUM = [0.22, 1, 0.36, 1] as const;

// Buttery spring
const SPRING_BUTTER = {
  type: 'spring' as const,
  stiffness: 200,
  damping: 28,
  mass: 1,
};

// Mobile bottom sheet snap points (vh)
const SNAP_PEEK = 40;  // 40% for quick glance
const SNAP_FULL = 90;  // 90% for full view

// ============================================================
// Types
// ============================================================

export interface SpaceContextData {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  category?: string;
  memberCount: number;
  onlineCount?: number;
  createdAt?: Date | string;
}

export interface SpaceEventItem {
  id: string;
  title: string;
  date: Date | string;
  attendeeCount?: number;
}

export interface SpaceMemberItem {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: 'owner' | 'admin' | 'moderator' | 'member';
  isOnline?: boolean;
}

export interface SpaceToolItem {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
}

export interface ContextPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback to close the panel */
  onClose: () => void;
  /** Space data for About section */
  space: SpaceContextData;
  /** Upcoming events */
  events?: SpaceEventItem[];
  /** Members (first few + count) */
  members?: SpaceMemberItem[];
  /** Total member count if different from space.memberCount */
  totalMemberCount?: number;
  /** Available tools */
  tools?: SpaceToolItem[];
  /** Which sections are expanded by default */
  defaultExpanded?: ('about' | 'events' | 'members' | 'tools')[];
  /** Callback when "View all" for events is clicked */
  onViewAllEvents?: () => void;
  /** Callback when "View all" for members is clicked */
  onViewAllMembers?: () => void;
  /** Callback when a tool is clicked */
  onToolClick?: (toolId: string) => void;
  /** Callback when event is clicked */
  onEventClick?: (eventId: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================
// Section Component
// ============================================================

interface SectionProps {
  title: string;
  icon: LucideIcon;
  defaultExpanded?: boolean;
  count?: number;
  onViewAll?: () => void;
  children: React.ReactNode;
}

function Section({
  title,
  icon: Icon,
  defaultExpanded = true,
  count,
  onViewAll,
  children,
}: SectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  return (
    <div className="border-b border-white/[0.04] last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors duration-150"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-3.5 h-3.5 text-white/30" />
          <span className="text-[12px] font-medium text-white/50 uppercase tracking-[0.04em]">{title}</span>
          {count !== undefined && (
            <span className="text-[11px] text-white/20">{count}</span>
          )}
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronDown className="w-3.5 h-3.5 text-white/20" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={SPRING_BUTTER}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="w-full px-4 py-2 text-[12px] text-white/40 hover:text-white/60 transition-colors flex items-center justify-center gap-1"
              >
                View all
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function ContextPanel({
  isOpen,
  onClose,
  space,
  events = [],
  members = [],
  totalMemberCount,
  tools = [],
  defaultExpanded = ['about', 'events'],
  onViewAllEvents,
  onViewAllMembers,
  onToolClick,
  onEventClick,
  className,
}: ContextPanelProps) {
  const shouldReduceMotion = useReducedMotion();
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [snapLevel, setSnapLevel] = React.useState<'peek' | 'full'>('peek');

  // Reset snap level when opening
  React.useEffect(() => {
    if (isOpen) {
      setSnapLevel('peek');
    }
  }, [isOpen]);

  // Close on Escape
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle drag end for snap points or dismiss
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const { velocity, offset } = info;
    const swipeThreshold = 50;
    const velocityThreshold = 300;

    // Fast swipe down = dismiss
    if (velocity.y > velocityThreshold) {
      onClose();
      return;
    }

    // Slow drag - snap based on position
    if (offset.y > swipeThreshold) {
      // Dragged down
      if (snapLevel === 'peek') {
        onClose();
      } else {
        setSnapLevel('peek');
      }
    } else if (offset.y < -swipeThreshold) {
      // Dragged up
      setSnapLevel('full');
    }
  };

  // Close on outside click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const memberCount = totalMemberCount ?? space.memberCount;
  const hasEvents = events.length > 0;
  const hasTools = tools.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:bg-black/30"
          />

          {/* Panel - Desktop: slide from right, Mobile: bottom sheet */}
          <motion.div
            ref={panelRef}
            initial={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: '100%' }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { opacity: 1, x: 0 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: '100%' }
            }
            transition={SPRING_BUTTER}
            className={cn(
              'fixed z-50 bg-[#0A0A0A] border-l border-white/[0.06]',
              // Desktop: right side panel (360px per design spec)
              'hidden lg:block lg:right-0 lg:top-0 lg:bottom-0 lg:w-[360px]',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <span className="text-[11px] font-medium text-white/40 uppercase tracking-[0.05em]">
                Space Info
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/40 hover:text-white/60 transition-colors"
                aria-label="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto h-[calc(100%-52px)]">
              {/* About Section */}
              <Section
                title="About"
                icon={Info}
                defaultExpanded={defaultExpanded.includes('about')}
              >
                <div className="space-y-3">
                  <p className="text-[13px] text-white/50 leading-relaxed">
                    {space.description || 'No description available.'}
                  </p>
                  <div className="flex items-center gap-4 text-[12px]">
                    <span className="text-white/40">
                      {memberCount.toLocaleString()} members
                    </span>
                    {space.onlineCount !== undefined && space.onlineCount > 0 && (
                      <span className="flex items-center gap-1.5 text-[#FFD700]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                        {space.onlineCount} online
                      </span>
                    )}
                  </div>
                </div>
              </Section>

              {/* Events Section */}
              {hasEvents && (
                <Section
                  title="Upcoming Events"
                  icon={Calendar}
                  count={events.length}
                  defaultExpanded={defaultExpanded.includes('events')}
                  onViewAll={onViewAllEvents}
                >
                  <div className="space-y-2">
                    {events.slice(0, 3).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick?.(event.id)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors"
                      >
                        <p className="text-[13px] text-white/70 truncate">
                          {event.title}
                        </p>
                        <p className="text-[11px] text-white/30 mt-0.5">
                          {typeof event.date === 'string'
                            ? new Date(event.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })
                            : event.date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                        </p>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {/* Members Section */}
              <Section
                title="Members"
                icon={Users}
                count={memberCount}
                defaultExpanded={defaultExpanded.includes('members')}
                onViewAll={onViewAllMembers}
              >
                <div className="space-y-2">
                  {members.slice(0, 5).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-2.5"
                    >
                      <div className="relative">
                        <div className="w-7 h-7 rounded-full bg-white/[0.08] flex items-center justify-center overflow-hidden">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[11px] font-medium text-white/60">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        {member.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#0A0A0A]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'text-[13px] truncate',
                          member.role === 'owner' && 'text-[#FFD700]',
                          member.role !== 'owner' && 'text-white/70'
                        )}>
                          {member.name}
                        </p>
                      </div>
                      {member.role && member.role !== 'member' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/30 uppercase">
                          {member.role}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </Section>

              {/* Tools Section */}
              {hasTools && (
                <Section
                  title="Tools"
                  icon={Wrench}
                  count={tools.length}
                  defaultExpanded={defaultExpanded.includes('tools')}
                >
                  <div className="space-y-2">
                    {tools.slice(0, 4).map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => onToolClick?.(tool.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] transition-colors text-left"
                      >
                        <div className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                          {tool.iconUrl ? (
                            <img
                              src={tool.iconUrl}
                              alt=""
                              className="w-4 h-4 object-contain"
                            />
                          ) : (
                            <Wrench className="w-3 h-3 text-white/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-white/70 truncate">
                            {tool.name}
                          </p>
                        </div>
                        <ExternalLink className="w-3 h-3 text-white/20" />
                      </button>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>

          {/* Mobile: Bottom sheet with snap points */}
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={
              shouldReduceMotion
                ? { opacity: 1 }
                : { y: 0, height: `${snapLevel === 'full' ? SNAP_FULL : SNAP_PEEK}vh` }
            }
            exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={SPRING_BUTTER}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed z-50 lg:hidden inset-x-0 bottom-0 bg-[#0A0A0A] rounded-t-2xl border-t border-white/[0.08]',
              'overflow-hidden touch-pan-y'
            )}
            style={{ touchAction: 'pan-y' }}
          >
            {/* Drag handle - visual indicator */}
            <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1 rounded-full bg-white/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-white">{space.name}</span>
                <span className="text-[11px] text-white/30">
                  {snapLevel === 'peek' ? 'Swipe up for more' : ''}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/[0.04] text-white/40 active:bg-white/[0.08]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content - scrollable */}
            <div
              className="overflow-y-auto"
              style={{ maxHeight: `calc(${snapLevel === 'full' ? SNAP_FULL : SNAP_PEEK}vh - 80px)` }}
            >
              {/* About */}
              <Section
                title="About"
                icon={Info}
                defaultExpanded={defaultExpanded.includes('about')}
              >
                <p className="text-[13px] text-white/50 leading-relaxed">
                  {space.description || 'No description available.'}
                </p>
              </Section>

              {/* Events - show more in full mode */}
              {hasEvents && (
                <Section
                  title="Events"
                  icon={Calendar}
                  count={events.length}
                  defaultExpanded={snapLevel === 'full'}
                  onViewAll={onViewAllEvents}
                >
                  <div className="space-y-2">
                    {events.slice(0, snapLevel === 'full' ? 3 : 2).map((event) => (
                      <button
                        key={event.id}
                        onClick={() => onEventClick?.(event.id)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] active:bg-white/[0.06]"
                      >
                        <p className="text-[13px] text-white/70">{event.title}</p>
                      </button>
                    ))}
                  </div>
                </Section>
              )}

              {/* Members preview */}
              <Section
                title="Members"
                icon={Users}
                count={memberCount}
                defaultExpanded={snapLevel === 'full'}
                onViewAll={onViewAllMembers}
              >
                <div className="flex -space-x-2">
                  {members.slice(0, 6).map((member) => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full bg-white/[0.08] border-2 border-[#0A0A0A] flex items-center justify-center overflow-hidden"
                    >
                      {member.avatarUrl ? (
                        <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[11px] text-white/60">
                          {member.name.charAt(0)}
                        </span>
                      )}
                    </div>
                  ))}
                  {memberCount > 6 && (
                    <div className="w-8 h-8 rounded-full bg-white/[0.08] border-2 border-[#0A0A0A] flex items-center justify-center">
                      <span className="text-[10px] text-white/40">+{memberCount - 6}</span>
                    </div>
                  )}
                </div>
              </Section>

              {/* Tools - only in full mode */}
              {snapLevel === 'full' && hasTools && (
                <Section
                  title="Tools"
                  icon={Wrench}
                  count={tools.length}
                  defaultExpanded={true}
                >
                  <div className="space-y-2">
                    {tools.slice(0, 3).map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => onToolClick?.(tool.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] active:bg-white/[0.06] text-left"
                      >
                        <Wrench className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                        <span className="text-[13px] text-white/70 truncate">{tool.name}</span>
                      </button>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ContextPanel;
