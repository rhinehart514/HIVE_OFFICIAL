'use client';

/**
 * MobileDrawer - Premium slide-up drawer with snap points
 *
 * A gesture-driven bottom sheet drawer with dynamic snap points:
 * - 40vh (peek): Shows header + preview content
 * - 60vh (half): Comfortable reading height
 * - 90vh (full): Maximum content area
 *
 * Features:
 * - Framer Motion drag gestures with velocity-based snapping
 * - Swipe-to-dismiss with velocity threshold
 * - Smooth spring animations (T2 motion tier)
 * - Backdrop blur with progressive opacity
 * - Haptic feedback ready (via callbacks)
 *
 * @author HIVE Frontend Team
 * @version 2.0.0 - Redesigned with snap points
 */

import * as React from 'react';
import { motion, AnimatePresence, PanInfo, useReducedMotion } from 'framer-motion';
import { Info, Calendar, Wrench, Users, X, ChevronUp, ChevronDown, Zap } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { tinderSprings } from '@hive/tokens';

import type { MobileDrawerType } from './mobile-action-bar';

// ============================================================
// Constants
// ============================================================

// Snap points as viewport height percentages
const SNAP_POINTS = {
  PEEK: 40,   // 40vh - header + preview
  HALF: 60,   // 60vh - comfortable reading
  FULL: 90,   // 90vh - maximum content
} as const;

// Velocity threshold for snap decisions (px/s)
const VELOCITY_THRESHOLD = 500;

// Distance threshold for dismiss (% of drawer height)
const DISMISS_THRESHOLD = 0.3;

// ============================================================
// Types
// ============================================================

export type SnapPoint = 'peek' | 'half' | 'full';

export interface MobileDrawerProps {
  /** Type of drawer to display */
  type: MobileDrawerType;
  /** Whether the drawer is open */
  open: boolean;
  /** Callback when drawer should close */
  onOpenChange: (open: boolean) => void;
  /** Initial snap point when opening */
  initialSnap?: SnapPoint;
  /** Space data for rendering */
  spaceData?: {
    name?: string;
    description?: string;
    memberCount?: number;
    onlineCount?: number;
    category?: string;
  };
  /** Events to display in events drawer */
  events?: Array<{
    id: string;
    title: string;
    date: string;
    attendees?: number;
  }>;
  /** Tools to display in tools drawer */
  tools?: Array<{
    id: string;
    name: string;
    description?: string;
    onClick?: () => void;
  }>;
  /** Members to display in members drawer */
  members?: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    role?: string;
    isOnline?: boolean;
  }>;
  /** Automations to display in automations drawer */
  automations?: Array<{
    id: string;
    name: string;
    trigger: string;
    enabled: boolean;
    runCount?: number;
    onToggle?: (id: string) => void;
  }>;
  /** Callback to open templates from automations drawer */
  onOpenTemplates?: () => void;
  /** Callback when snap point changes (for haptic feedback) */
  onSnapChange?: (snap: SnapPoint) => void;
  /** Additional className for the drawer content */
  className?: string;
  /** Custom render function for drawer content */
  children?: React.ReactNode;
}

// ============================================================
// Drawer Configuration
// ============================================================

const DRAWER_CONFIG: Record<
  MobileDrawerType,
  {
    icon: typeof Info;
    title: string;
    description: string;
  }
> = {
  info: {
    icon: Info,
    title: 'About',
    description: 'Space information and details',
  },
  events: {
    icon: Calendar,
    title: 'Upcoming Events',
    description: 'Events happening in this space',
  },
  tools: {
    icon: Wrench,
    title: 'Tools',
    description: 'Interactive tools deployed to this space',
  },
  members: {
    icon: Users,
    title: 'Members',
    description: 'People in this space',
  },
  automations: {
    icon: Zap,
    title: 'Automations',
    description: 'Automated workflows for this space',
  },
};

// ============================================================
// Snap Point Helpers
// ============================================================

function getSnapPointPx(snap: SnapPoint): number {
  if (typeof window === 'undefined') return 0;
  const vh = window.innerHeight / 100;
  return SNAP_POINTS[snap.toUpperCase() as keyof typeof SNAP_POINTS] * vh;
}

function getAllSnapPointsPx(): number[] {
  if (typeof window === 'undefined') return [0, 0, 0];
  const vh = window.innerHeight / 100;
  return [
    SNAP_POINTS.PEEK * vh,
    SNAP_POINTS.HALF * vh,
    SNAP_POINTS.FULL * vh,
  ];
}

function findNearestSnap(y: number, velocity: number): SnapPoint {
  const snapPoints = getAllSnapPointsPx();
  const [peek, half, full] = snapPoints;

  // If velocity is high, snap in direction of velocity
  if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
    if (velocity > 0) {
      // Swiping down - go to lower snap or dismiss
      if (y < half) return 'peek';
      return 'peek'; // Will trigger dismiss in parent
    } else {
      // Swiping up - go to higher snap
      if (y < half) return 'full';
      if (y < full) return 'half';
      return 'full';
    }
  }

  // Otherwise snap to nearest
  const distances = [
    { snap: 'peek' as SnapPoint, dist: Math.abs(y - peek) },
    { snap: 'half' as SnapPoint, dist: Math.abs(y - half) },
    { snap: 'full' as SnapPoint, dist: Math.abs(y - full) },
  ];

  distances.sort((a, b) => a.dist - b.dist);
  return distances[0].snap;
}

// ============================================================
// Content Renderers
// ============================================================

function InfoContent({
  spaceData,
}: {
  spaceData?: MobileDrawerProps['spaceData'];
}) {
  return (
    <div className="space-y-4">
      {spaceData?.description && (
        <p className="text-neutral-300 text-sm leading-relaxed">
          {spaceData.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">
            {spaceData?.memberCount ?? 0}
          </div>
          <div className="text-xs text-neutral-400">Members</div>
        </div>
        <div className="bg-neutral-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-emerald-400">
            {spaceData?.onlineCount ?? 0}
          </div>
          <div className="text-xs text-neutral-400">Online now</div>
        </div>
      </div>

      {spaceData?.category && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">Category:</span>
          <span className="text-xs px-2 py-0.5 bg-neutral-800 rounded-full text-neutral-300 capitalize">
            {spaceData.category}
          </span>
        </div>
      )}
    </div>
  );
}

function EventsContent({
  events = [],
}: {
  events?: MobileDrawerProps['events'];
}) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center">
        <Calendar className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
        <p className="text-neutral-400 text-sm">No upcoming events</p>
        <p className="text-neutral-500 text-xs mt-1">
          Check back later for new events
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-neutral-800/50 rounded-lg p-3 flex items-center gap-3"
        >
          <div className="w-10 h-10 bg-neutral-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-neutral-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {event.title}
            </div>
            <div className="text-xs text-neutral-400">{event.date}</div>
          </div>
          {event.attendees !== undefined && (
            <div className="text-xs text-neutral-500">
              {event.attendees} going
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ToolsContent({ tools = [] }: { tools?: MobileDrawerProps['tools'] }) {
  if (tools.length === 0) {
    return (
      <div className="py-8 text-center">
        <Wrench className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
        <p className="text-neutral-400 text-sm">No tools deployed</p>
        <p className="text-neutral-500 text-xs mt-1">
          Leaders can add tools from HiveLab
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={tool.onClick}
          className={cn(
            'w-full bg-neutral-800/50 rounded-lg p-3 flex items-center gap-3',
            'text-left transition-colors hover:bg-neutral-800 active:bg-neutral-700'
          )}
          aria-label={`Open ${tool.name} tool`}
        >
          <div className="w-10 h-10 bg-neutral-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-neutral-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {tool.name}
            </div>
            {tool.description && (
              <div className="text-xs text-neutral-400 truncate">
                {tool.description}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function MembersContent({
  members = [],
}: {
  members?: MobileDrawerProps['members'];
}) {
  // Sort: online first, then by name
  const sortedMembers = [...members].sort((a, b) => {
    if (a.isOnline && !b.isOnline) return -1;
    if (!a.isOnline && b.isOnline) return 1;
    return a.name.localeCompare(b.name);
  });

  if (sortedMembers.length === 0) {
    return (
      <div className="py-8 text-center">
        <Users className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
        <p className="text-neutral-400 text-sm">No members yet</p>
        <p className="text-neutral-500 text-xs mt-1">
          Be the first to join this space
        </p>
      </div>
    );
  }

  const onlineMembers = sortedMembers.filter((m) => m.isOnline);
  const offlineMembers = sortedMembers.filter((m) => !m.isOnline);

  return (
    <div className="space-y-4">
      {/* Online section */}
      {onlineMembers.length > 0 && (
        <div>
          <div className="text-xs text-emerald-400 font-medium mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Online — {onlineMembers.length}
          </div>
          <div className="space-y-1">
            {onlineMembers.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Offline section */}
      {offlineMembers.length > 0 && (
        <div>
          <div className="text-xs text-neutral-500 font-medium mb-2">
            Offline — {offlineMembers.length}
          </div>
          <div className="space-y-1">
            {offlineMembers.slice(0, 20).map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
            {offlineMembers.length > 20 && (
              <div className="text-xs text-neutral-500 text-center py-2">
                +{offlineMembers.length - 20} more members
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MemberRow({
  member,
}: {
  member: NonNullable<MobileDrawerProps['members']>[number];
}) {
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      {/* Avatar */}
      <div className="relative">
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center text-xs font-medium text-neutral-300">
            {member.name.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Online indicator */}
        {member.isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-neutral-900 rounded-full" />
        )}
      </div>

      {/* Name & role */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white truncate">{member.name}</div>
        {member.role && (
          <div className="text-xs text-neutral-500 capitalize">{member.role}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Automations Content
// ============================================================

const TRIGGER_LABELS: Record<string, string> = {
  member_join: 'When member joins',
  event_reminder: 'Before events',
  schedule: 'On schedule',
  keyword: 'Keyword trigger',
  reaction_threshold: 'Reaction milestone',
};

function AutomationsContent({
  automations = [],
  onOpenTemplates,
}: {
  automations?: MobileDrawerProps['automations'];
  onOpenTemplates?: () => void;
}) {
  if (automations.length === 0) {
    return (
      <div className="py-8 text-center">
        <Zap className="w-10 h-10 mx-auto text-neutral-600 mb-3" />
        <p className="text-neutral-400 text-sm">No automations yet</p>
        <p className="text-neutral-500 text-xs mt-1 mb-4">
          Set up automated workflows for your space
        </p>
        {onOpenTemplates && (
          <button
            onClick={onOpenTemplates}
            className="px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-lg hover:bg-white/15 transition-colors"
          >
            Browse Templates
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {automations.map((automation) => (
        <div
          key={automation.id}
          className="bg-neutral-800/50 rounded-lg p-3 flex items-center gap-3"
        >
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            automation.enabled ? 'bg-emerald-500/10' : 'bg-neutral-700/50'
          )}>
            <Zap className={cn('w-5 h-5', automation.enabled ? 'text-emerald-400' : 'text-neutral-500')} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {automation.name}
            </div>
            <div className="text-xs text-neutral-400">
              {TRIGGER_LABELS[automation.trigger] || automation.trigger}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {automation.runCount !== undefined && (
              <span className="text-xs text-neutral-500">
                {automation.runCount} runs
              </span>
            )}
            <button
              onClick={() => automation.onToggle?.(automation.id)}
              className={cn(
                'w-10 h-6 rounded-full transition-colors relative',
                automation.enabled ? 'bg-emerald-500' : 'bg-neutral-700'
              )}
              aria-label={automation.enabled ? 'Disable automation' : 'Enable automation'}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 rounded-full bg-white transition-transform',
                  automation.enabled ? 'left-5' : 'left-1'
                )}
              />
            </button>
          </div>
        </div>
      ))}

      {/* Browse templates button */}
      {onOpenTemplates && (
        <button
          onClick={onOpenTemplates}
          className="w-full py-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          + Add from templates
        </button>
      )}
    </div>
  );
}

// ============================================================
// Snap Indicator
// ============================================================

interface SnapIndicatorProps {
  currentSnap: SnapPoint;
  onSnapTo: (snap: SnapPoint) => void;
}

function SnapIndicator({ currentSnap, onSnapTo }: SnapIndicatorProps) {
  const snaps: SnapPoint[] = ['peek', 'half', 'full'];

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <button
        onClick={() => {
          const currentIdx = snaps.indexOf(currentSnap);
          if (currentIdx < snaps.length - 1) {
            onSnapTo(snaps[currentIdx + 1]);
          }
        }}
        disabled={currentSnap === 'full'}
        className={cn(
          'p-1 rounded transition-colors',
          currentSnap === 'full'
            ? 'text-neutral-700'
            : 'text-neutral-500 hover:text-white active:scale-95'
        )}
        aria-label="Expand drawer"
      >
        <ChevronUp className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="flex gap-1.5">
        {snaps.map((snap) => (
          <button
            key={snap}
            onClick={() => onSnapTo(snap)}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all',
              currentSnap === snap
                ? 'bg-white scale-125'
                : 'bg-neutral-600 hover:bg-neutral-500'
            )}
            aria-label={`Snap to ${snap}`}
          />
        ))}
      </div>

      <button
        onClick={() => {
          const currentIdx = snaps.indexOf(currentSnap);
          if (currentIdx > 0) {
            onSnapTo(snaps[currentIdx - 1]);
          }
        }}
        disabled={currentSnap === 'peek'}
        className={cn(
          'p-1 rounded transition-colors',
          currentSnap === 'peek'
            ? 'text-neutral-700'
            : 'text-neutral-500 hover:text-white active:scale-95'
        )}
        aria-label="Collapse drawer"
      >
        <ChevronDown className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function MobileDrawer({
  type,
  open,
  onOpenChange,
  initialSnap = 'half',
  spaceData,
  events,
  tools,
  members,
  automations,
  onOpenTemplates,
  onSnapChange,
  className,
  children,
}: MobileDrawerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [currentSnap, setCurrentSnap] = React.useState<SnapPoint>(initialSnap);
  const [isDragging, setIsDragging] = React.useState(false);
  const constraintsRef = React.useRef<HTMLDivElement>(null);

  const config = DRAWER_CONFIG[type];
  const Icon = config.icon;

  // Reset snap when opening
  React.useEffect(() => {
    if (open) {
      setCurrentSnap(initialSnap);
    }
  }, [open, initialSnap]);

  // Handle snap changes
  const handleSnapTo = React.useCallback((snap: SnapPoint) => {
    setCurrentSnap(snap);
    onSnapChange?.(snap);
  }, [onSnapChange]);

  // Handle drag end
  const handleDragEnd = React.useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      setIsDragging(false);

      const currentHeight = getSnapPointPx(currentSnap);
      const newY = currentHeight - info.offset.y;
      const velocity = -info.velocity.y; // Negative because y increases downward

      // Check for dismiss
      const peekHeight = getSnapPointPx('peek');
      if (newY < peekHeight * DISMISS_THRESHOLD && velocity > 0) {
        onOpenChange(false);
        return;
      }

      // Find and apply nearest snap
      const nearestSnap = findNearestSnap(newY, velocity);
      handleSnapTo(nearestSnap);
    },
    [currentSnap, handleSnapTo, onOpenChange]
  );

  // Render content based on type or use custom children
  const renderContent = () => {
    if (children) return children;

    switch (type) {
      case 'info':
        return <InfoContent spaceData={spaceData} />;
      case 'events':
        return <EventsContent events={events} />;
      case 'tools':
        return <ToolsContent tools={tools} />;
      case 'members':
        return <MembersContent members={members} />;
      case 'automations':
        return <AutomationsContent automations={automations} onOpenTemplates={onOpenTemplates} />;
      default:
        return null;
    }
  };

  // Calculate drawer height
  const drawerHeight = getSnapPointPx(currentSnap);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
            aria-hidden="true"
          />

          {/* Drawer constraints container */}
          <div
            ref={constraintsRef}
            className="fixed inset-0 z-50 pointer-events-none"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{
              y: `calc(100vh - ${drawerHeight}px)`,
            }}
            exit={{ y: '100%' }}
            transition={
              shouldReduceMotion
                ? { duration: 0.1 }
                : isDragging
                ? { type: 'tween', duration: 0 }
                : tinderSprings.settle
            }
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed left-0 right-0 bottom-0 z-50',
              'bg-neutral-900 border-t border-white/10',
              'rounded-t-2xl shadow-2xl shadow-black/50',
              'overflow-hidden',
              'touch-none',
              className
            )}
            style={{
              height: '100vh', // Full height, position controlled by y
            }}
            role="dialog"
            aria-modal="true"
            aria-label={config.title}
          >
            {/* Grab handle */}
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div
                className={cn(
                  'w-12 h-1.5 rounded-full transition-colors',
                  isDragging ? 'bg-white' : 'bg-neutral-700'
                )}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-neutral-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {config.title}
                  </h2>
                  <p className="text-xs text-neutral-500">
                    {config.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Snap indicator */}
                <SnapIndicator
                  currentSnap={currentSnap}
                  onSnapTo={handleSnapTo}
                />

                {/* Close button */}
                <button
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    'w-11 h-11 rounded-lg flex items-center justify-center',
                    'text-neutral-400 hover:text-white hover:bg-neutral-800',
                    'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                  )}
                  aria-label="Close drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              className="overflow-y-auto overscroll-contain px-4 py-4"
              style={{
                height: `calc(${drawerHeight}px - 100px)`, // Subtract header height
                touchAction: 'pan-y',
              }}
            >
              {renderContent()}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default MobileDrawer;
