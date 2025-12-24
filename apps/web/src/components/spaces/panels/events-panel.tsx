/**
 * Events Panel - Full event listing with filtering
 *
 * Features:
 * - Event list (upcoming first, then past)
 * - Filter tabs: "Upcoming" | "Past" | "My RSVPs"
 * - Type filter chips (academic, social, etc.)
 * - Search by title
 * - Empty state with "Create Event" CTA (leaders)
 * - Click event → opens EventDetailsModal
 * - Floating "Create Event" button (leaders)
 *
 * @version 1.0.0 - Dec 2025
 */

"use client";

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Search,
  Plus,
  Video,
  GraduationCap,
  PartyPopper,
  Gamepad2,
  Music,
  Briefcase,
  Monitor,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@hive/ui';

// ============================================================
// Types
// ============================================================

export type EventType = 'academic' | 'social' | 'recreational' | 'cultural' | 'meeting' | 'virtual';
export type RSVPStatus = 'going' | 'maybe' | 'not_going' | null;
export type FilterTab = 'upcoming' | 'past' | 'my-rsvps';

export interface SpaceEvent {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  startDate: string;
  endDate?: string;
  location?: string;
  virtualLink?: string;
  currentAttendees: number;
  maxAttendees?: number;
  userRSVP?: RSVPStatus;
  organizerId?: string;
  organizerName?: string;
}

export interface EventsPanelProps {
  spaceId: string;
  events: SpaceEvent[];
  isLoading?: boolean;
  userRole?: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  currentUserId?: string;
  onEventClick: (event: SpaceEvent) => void;
  onCreateEvent?: () => void;
  className?: string;
}

// ============================================================
// Constants
// ============================================================

const EVENT_TYPE_CONFIG: Record<EventType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  academic: { label: 'Academic', icon: GraduationCap, color: 'text-blue-400 bg-blue-500/10' },
  social: { label: 'Social', icon: PartyPopper, color: 'text-pink-400 bg-pink-500/10' },
  recreational: { label: 'Rec', icon: Gamepad2, color: 'text-green-400 bg-green-500/10' },
  cultural: { label: 'Cultural', icon: Music, color: 'text-purple-400 bg-purple-500/10' },
  meeting: { label: 'Meeting', icon: Briefcase, color: 'text-orange-400 bg-orange-500/10' },
  virtual: { label: 'Virtual', icon: Monitor, color: 'text-cyan-400 bg-cyan-500/10' },
};

// ============================================================
// Helper Functions
// ============================================================

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) {
    // Past event
    const absDays = Math.abs(diffDays);
    if (absDays === 0) return 'Earlier today';
    if (absDays === 1) return 'Yesterday';
    if (absDays < 7) return `${absDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Future event
  if (diffMins < 60) return `In ${diffMins}m`;
  if (diffHours < 24) return `In ${diffHours}h`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatEventTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function isUpcoming(event: SpaceEvent): boolean {
  return new Date(event.startDate).getTime() > Date.now();
}

function isPast(event: SpaceEvent): boolean {
  return new Date(event.startDate).getTime() <= Date.now();
}

// ============================================================
// Sub-Components
// ============================================================

function EventTypeBadge({ type }: { type: EventType }) {
  const config = EVENT_TYPE_CONFIG[type] || EVENT_TYPE_CONFIG.meeting;
  const Icon = config.icon;

  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      config.color
    )}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function RSVPBadge({ status }: { status: RSVPStatus }) {
  if (!status || status === 'not_going') return null;

  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
      status === 'going'
        ? 'text-[#FFD700] bg-[#FFD700]/10 ring-1 ring-[#FFD700]/20'
        : 'text-[#A1A1A6] bg-white/5'
    )}>
      {status === 'going' ? "You're going" : 'Maybe'}
    </span>
  );
}

function EventCard({
  event,
  onClick
}: {
  event: SpaceEvent;
  onClick: () => void;
}) {
  const isEventUpcoming = isUpcoming(event);
  const isUrgent = isEventUpcoming && new Date(event.startDate).getTime() - Date.now() < 24 * 60 * 60 * 1000;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl transition-all',
        'bg-white/[0.02] hover:bg-white/[0.05]',
        'border border-white/[0.06] hover:border-white/[0.1]',
        'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20',
        isUrgent && 'ring-1 ring-[#FFD700]/30'
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-start gap-3">
        {/* Date Column */}
        <div className={cn(
          'flex flex-col items-center justify-center min-w-[48px] p-2 rounded-lg',
          isEventUpcoming ? 'bg-[#FFD700]/10' : 'bg-white/5'
        )}>
          <span className={cn(
            'text-xs font-medium uppercase',
            isEventUpcoming ? 'text-[#FFD700]' : 'text-[#818187]'
          )}>
            {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short' })}
          </span>
          <span className={cn(
            'text-xl font-bold',
            isEventUpcoming ? 'text-[#FAFAFA]' : 'text-[#A1A1A6]'
          )}>
            {new Date(event.startDate).getDate()}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={cn(
              'font-medium truncate',
              isEventUpcoming ? 'text-[#FAFAFA]' : 'text-[#A1A1A6]'
            )}>
              {event.title}
            </h3>
            <EventTypeBadge type={event.type} />
          </div>

          {/* Time */}
          <div className="flex items-center gap-4 text-sm text-[#818187] mb-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatEventTime(event.startDate)}
            </span>
            <span className={cn(
              'text-xs',
              isUrgent ? 'text-[#FFD700]' : ''
            )}>
              {getRelativeTime(event.startDate)}
            </span>
          </div>

          {/* Location / Link */}
          {(event.location || event.virtualLink) && (
            <div className="flex items-center gap-1 text-sm text-[#A1A1A6] mb-2">
              {event.virtualLink ? (
                <>
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate">Online Event</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{event.location}</span>
                </>
              )}
            </div>
          )}

          {/* Footer: Attendees + RSVP */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-[#818187]">
              <Users className="w-3.5 h-3.5" />
              <span>
                {event.currentAttendees}
                {event.maxAttendees && ` / ${event.maxAttendees}`}
              </span>
            </div>
            <RSVPBadge status={event.userRSVP || null} />
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function EmptyState({
  type,
  isLeader,
  onCreateEvent
}: {
  type: FilterTab;
  isLeader: boolean;
  onCreateEvent?: () => void;
}) {
  const messages = {
    upcoming: {
      title: 'No upcoming events',
      description: isLeader
        ? 'Create your first event to bring your community together.'
        : 'Check back later for new events.',
    },
    past: {
      title: 'No past events',
      description: 'Events you attend will appear here.',
    },
    'my-rsvps': {
      title: "You haven't RSVP'd to any events",
      description: 'Browse upcoming events and mark your attendance.',
    },
  };

  const { title, description } = messages[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-[#818187]" />
      </div>
      <h3 className="text-lg font-medium text-[#FAFAFA] mb-1">{title}</h3>
      <p className="text-sm text-[#818187] text-center max-w-xs mb-4">{description}</p>
      {isLeader && type === 'upcoming' && onCreateEvent && (
        <Button onClick={onCreateEvent} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export function EventsPanel({
  events,
  isLoading,
  userRole,
  onEventClick,
  onCreateEvent,
  className,
}: EventsPanelProps) {
  const isLeader = ['owner', 'admin', 'moderator'].includes(userRole || '');

  // Filter state
  const [activeTab, setActiveTab] = React.useState<FilterTab>('upcoming');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedTypes, setSelectedTypes] = React.useState<Set<EventType>>(new Set());
  const [showFilters, setShowFilters] = React.useState(false);

  // Filter events
  const filteredEvents = React.useMemo(() => {
    let result = [...events];

    // Tab filter
    switch (activeTab) {
      case 'upcoming':
        result = result.filter(isUpcoming);
        break;
      case 'past':
        result = result.filter(isPast);
        break;
      case 'my-rsvps':
        result = result.filter(e => e.userRSVP === 'going' || e.userRSVP === 'maybe');
        break;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query) ||
        e.location?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (selectedTypes.size > 0) {
      result = result.filter(e => selectedTypes.has(e.type));
    }

    // Sort: upcoming events by date ascending, past events by date descending
    result.sort((a, b) => {
      const aTime = new Date(a.startDate).getTime();
      const bTime = new Date(b.startDate).getTime();
      return activeTab === 'past' ? bTime - aTime : aTime - bTime;
    });

    return result;
  }, [events, activeTab, searchQuery, selectedTypes]);

  // Toggle type filter
  const toggleType = (type: EventType) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTypes(new Set());
  };

  const hasActiveFilters = searchQuery.trim() || selectedTypes.size > 0;

  return (
    <div className={cn('flex flex-col h-full bg-[#0A0A0A]', className)}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#FAFAFA]">Events</h2>
          {isLeader && onCreateEvent && (
            <Button
              size="sm"
              onClick={onCreateEvent}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Create
            </Button>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03]">
          {(['upcoming', 'past', 'my-rsvps'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all',
                activeTab === tab
                  ? 'bg-white/10 text-[#FAFAFA]'
                  : 'text-[#818187] hover:text-[#A1A1A6]'
              )}
            >
              {tab === 'upcoming' && 'Upcoming'}
              {tab === 'past' && 'Past'}
              {tab === 'my-rsvps' && 'My RSVPs'}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="px-4 py-2 space-y-2">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#818187]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events..."
            className={cn(
              'w-full pl-9 pr-10 py-2 rounded-lg',
              'bg-white/[0.03] border border-white/[0.06]',
              'text-[#FAFAFA] placeholder:text-[#818187]',
              'focus:outline-none focus:ring-2 focus:ring-[#FFD700]/20 focus:border-transparent',
              'text-sm'
            )}
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-colors',
              showFilters || selectedTypes.size > 0
                ? 'bg-[#FFD700]/10 text-[#FFD700]'
                : 'text-[#818187] hover:text-[#A1A1A6]'
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Type Filter Chips */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 py-2">
                {(Object.keys(EVENT_TYPE_CONFIG) as EventType[]).map((type) => {
                  const config = EVENT_TYPE_CONFIG[type];
                  const isSelected = selectedTypes.has(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleType(type)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                        isSelected
                          ? config.color
                          : 'text-[#818187] bg-white/[0.03] hover:bg-white/[0.06]'
                      )}
                    >
                      <config.icon className="w-3 h-3" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Active Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1A6]">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-[#FFD700] hover:text-[#FFD700]/80"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-white/[0.02] animate-pulse"
              />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            type={activeTab}
            isLeader={isLeader}
            onCreateEvent={onCreateEvent}
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <EventCard
                    event={event}
                    onClick={() => onEventClick(event)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventsPanel;
