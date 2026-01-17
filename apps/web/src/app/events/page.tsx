"use client";

// Force dynamic rendering to avoid SSG issues
export const dynamic = 'force-dynamic';

import { Button, Card, Badge } from "@hive/ui";
import {
  CalendarIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  UsersIcon,
  ClockIcon,
  BoltIcon,
  StarIcon,
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";
import { EventsLoadingSkeleton } from "../../components/events/events-loading-skeleton";
import { CreateEventModal, type CreateEventData } from "../../components/events/create-event-modal";
import { EventDetailsModal } from "../../components/events/event-details-modal";
import {
  useEvents,
  formatEventTime,
  getEventTypeColor,
  getEventTypeIcon,
  type EventData,
  type TimeFilter,
} from "@/hooks/use-events";

// Icon aliases
const Calendar = CalendarIcon;
const Plus = PlusIcon;
const Search = MagnifyingGlassIcon;
const MapPin = MapPinIcon;
const Users = UsersIcon;
const Clock = ClockIcon;
const Zap = BoltIcon;
const Star = StarIcon;
const Heart = HeartIcon;
const MessageCircle = ChatBubbleOvalLeftIcon;
const Share2 = ShareIcon;

export default function EventsPage() {
  const {
    mounted,
    isLoading,
    filter,
    eventType,
    searchQuery,
    showCreateModal,
    showEventDetails,
    user,
    filteredEvents,
    selectedEvent,
    setFilter,
    setEventType,
    setSearchQuery,
    setShowCreateModal,
    setShowEventDetails,
    handleRSVP,
    handleBookmark,
    addEvent,
  } = useEvents();

  // Prevent SSR hydration issues or show loading state
  if (!mounted || isLoading) {
    return <EventsLoadingSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Campus Events</h1>
          <p className="text-white/40 mt-1">Discover, coordinate, and participate in campus activities</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative" role="search">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search events..."
              aria-label="Search events"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-white/50 w-full sm:w-64"
            />
          </div>

          {/* Time Filters */}
          <div className="flex items-center bg-white/[0.04] rounded-lg p-1 overflow-x-auto" role="group" aria-label="Filter events by time">
            {(['all', 'today', 'week', 'my_events'] as TimeFilter[]).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'brand' : 'ghost'}
                size="sm"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className="text-xs whitespace-nowrap"
              >
                {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'My Events'}
              </Button>
            ))}
          </div>

          {/* Create Event */}
          <Button
            onClick={() => setShowCreateModal(true)}
            aria-label="Create new event"
            className="bg-life-gold text-ground hover:bg-life-gold/90"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Create Event
          </Button>
        </div>
      </div>

      {/* Event Type Filter */}
      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filter events by type">
        <Button
          variant={eventType === 'all' ? 'brand' : 'outline'}
          size="sm"
          onClick={() => setEventType('all')}
          aria-pressed={eventType === 'all'}
        >
          All Types
        </Button>
        {(['academic', 'social', 'professional', 'recreational', 'official'] as const).map((type) => (
          <Button
            key={type}
            variant={eventType === type ? 'brand' : 'outline'}
            size="sm"
            onClick={() => setEventType(type)}
            aria-pressed={eventType === type}
            className="capitalize"
          >
            <span aria-hidden="true">{getEventTypeIcon(type)}</span> {type}
          </Button>
        ))}
      </div>

      {/* Events Grid */}
      {filteredEvents.length > 0 ? (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          role="feed"
          aria-label={`${filteredEvents.length} events`}
        >
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => setShowEventDetails(event.id)}
              onBookmark={handleBookmark}
              onRSVP={handleRSVP}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          searchQuery={searchQuery}
          eventType={eventType}
          filter={filter}
          onCreateEvent={() => setShowCreateModal(true)}
        />
      )}

      {/* Create Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateEvent={(eventData: CreateEventData) => {
          const newEvent: EventData = {
            id: `event-${Date.now()}`,
            title: eventData.title,
            description: eventData.description,
            type: eventData.type as EventData['type'],
            organizer: {
              id: user?.id || 'current-user',
              name: user?.fullName || 'You',
              handle: user?.handle || 'you',
              verified: false
            },
            datetime: {
              start: eventData.datetime.start,
              end: eventData.datetime.end,
              timezone: eventData.datetime.timezone || 'America/New_York'
            },
            location: { ...eventData.location, type: 'physical' as const },
            capacity: { max: 100, current: 0, waitlist: 0 },
            tools: [],
            tags: [],
            visibility: 'public' as const,
            rsvpStatus: null,
            isBookmarked: false,
            engagement: { going: 0, interested: 0, comments: 0, shares: 0 },
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          addEvent(newEvent);
        }}
      />

      {/* Event Details Modal */}
      <EventDetailsModal
        isOpen={!!showEventDetails}
        onClose={() => setShowEventDetails(null)}
        event={selectedEvent}
        currentUserId={user?.id}
        onRSVP={handleRSVP}
        onBookmark={handleBookmark}
      />
    </div>
  );
}

// ============================================
// EXTRACTED COMPONENTS
// ============================================

interface EventCardProps {
  event: EventData;
  onClick: () => void;
  onBookmark: (id: string) => void;
  onRSVP: (id: string, status: 'going' | 'interested' | 'not_going') => void;
}

function EventCard({ event, onClick, onBookmark, onRSVP }: EventCardProps) {
  return (
    <Card
      className="p-6 bg-surface border-white/[0.04] hover:bg-surface-hover transition-all duration-200 cursor-pointer"
      onClick={onClick}
      role="article"
      aria-label={`${event.title} - ${formatEventTime(event.datetime.start, event.datetime.end)}`}
    >
      {/* Event Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3">
          <div className={`w-12 h-12 ${getEventTypeColor(event.type)} rounded-xl flex items-center justify-center text-xl flex-shrink-0`} aria-hidden="true">
            {getEventTypeIcon(event.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg leading-tight mb-1">{event.title}</h3>
            <div className="flex items-center space-x-2 text-sm text-white/40">
              <span>{event.organizer.name}</span>
              {event.organizer.verified && <Star className="h-3 w-3 text-life-gold fill-current" aria-label="Verified organizer" />}
              {event.space && (
                <>
                  <span aria-hidden="true">•</span>
                  <span className="text-life-gold">{event.space.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); onBookmark(event.id); }}
          aria-label={event.isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
          aria-pressed={event.isBookmarked}
          className={event.isBookmarked ? 'text-life-gold' : 'text-white/40'}
        >
          <Heart className={`h-4 w-4 ${event.isBookmarked ? 'fill-current' : ''}`} aria-hidden="true" />
        </Button>
      </div>

      {/* Event Details */}
      <div className="space-y-3 mb-4">
        <p className="text-white/70 text-sm leading-relaxed line-clamp-2">{event.description}</p>

        <div className="flex items-center space-x-4 text-sm text-white/40">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{formatEventTime(event.datetime.start, event.datetime.end)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">{event.location.name}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-white/40">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>{event.capacity.current}/{event.capacity.max} attending</span>
          </div>
          {event.tools.length > 0 && (
            <div className="flex items-center space-x-1">
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span>{event.tools.length} tools available</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {event.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4" aria-label="Event tags">
          {event.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
          ))}
          {event.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">+{event.tags.length - 3} more</Badge>
          )}
        </div>
      )}

      {/* RSVP Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/[0.04]">
        <div className="flex items-center space-x-4" role="group" aria-label="RSVP options">
          <Button
            variant={event.rsvpStatus === 'going' ? 'brand' : 'ghost'}
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRSVP(event.id, event.rsvpStatus === 'going' ? 'not_going' : 'going');
            }}
            aria-pressed={event.rsvpStatus === 'going'}
            aria-label={`Mark as going. ${event.engagement.going} people going`}
            className="text-xs"
          >
            <Users className="h-3 w-3 mr-1" aria-hidden="true" />
            Going ({event.engagement.going})
          </Button>
          <Button
            variant={event.rsvpStatus === 'interested' ? 'brand' : 'ghost'}
            size="sm"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onRSVP(event.id, event.rsvpStatus === 'interested' ? 'not_going' : 'interested');
            }}
            aria-pressed={event.rsvpStatus === 'interested'}
            aria-label={`Mark as interested. ${event.engagement.interested} people interested`}
            className="text-xs"
          >
            <Star className="h-3 w-3 mr-1" aria-hidden="true" />
            Interested ({event.engagement.interested})
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${event.engagement.comments} comments`}
            className="text-xs text-white/40"
          >
            <MessageCircle className="h-3 w-3 mr-1" aria-hidden="true" />
            {event.engagement.comments}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-white/40"
            aria-label="Share event link"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              navigator.clipboard.writeText(`${window.location.origin}/events/${event.id}`);
            }}
          >
            <Share2 className="h-3 w-3" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

interface EmptyStateProps {
  searchQuery: string;
  eventType: string;
  filter: string;
  onCreateEvent: () => void;
}

function EmptyState({ searchQuery, eventType, filter, onCreateEvent }: EmptyStateProps) {
  return (
    <div className="text-center py-12" role="status" aria-live="polite">
      <Calendar className="h-16 w-16 text-white/20 mx-auto mb-4" aria-hidden="true" />
      <h3 className="text-xl font-semibold text-white mb-2">No events found</h3>
      <p className="text-white/40 mb-6">
        {searchQuery || eventType !== 'all' || filter !== 'all'
          ? 'Try adjusting your filters or search terms'
          : 'Be the first to create an event for your campus community!'}
      </p>
      <Button
        onClick={onCreateEvent}
        aria-label="Create new event"
        className="bg-life-gold text-ground hover:bg-life-gold/90"
      >
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Create Event
      </Button>
    </div>
  );
}
