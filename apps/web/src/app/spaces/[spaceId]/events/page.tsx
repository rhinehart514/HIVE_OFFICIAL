"use client";

/**
 * Space Events Page - Full events listing for a space
 *
 * Features:
 * - Full EventsPanel with filtering
 * - EventDetailsModal for viewing event details
 * - EventCreateModal for leaders
 * - Uses SpaceContext for events data
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@hive/auth-logic";
import {
  EventDetailsModal,
  EventCreateModal,
  type SpaceEventDetails,
  type RSVPStatus,
  type EventCreateInput,
  toast,
} from "@hive/ui";
import { ArrowLeft } from "lucide-react";
import { EventsPanel, type SpaceEvent } from "@/components/spaces/panels/events-panel";
import {
  SpaceContextProvider,
  useSpaceMetadata,
  useSpaceEvents,
} from "@/contexts/space";
import { secureApiFetch } from "@/lib/secure-auth-utils";

// ============================================================
// Inner Content (uses SpaceContext)
// ============================================================

function SpaceEventsContent() {
  const router = useRouter();
  const { user } = useAuth();

  const { space, spaceId, membership } = useSpaceMetadata();
  const { events, isEventsLoading, refreshEvents } = useSpaceEvents();

  const isLeader = ['owner', 'admin', 'moderator'].includes(membership?.role || '');
  const userRole = membership?.role as 'owner' | 'admin' | 'moderator' | 'member' | 'guest' | undefined;

  // Modal state
  const [selectedEventId, setSelectedEventId] = React.useState<string | null>(null);
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = React.useState(false);
  const [createEventModalOpen, setCreateEventModalOpen] = React.useState(false);

  // Get boards for event creation
  const [boards, setBoards] = React.useState<Array<{ id: string; name: string }>>([]);

  // Load boards for event creation modal
  React.useEffect(() => {
    const loadBoards = async () => {
      if (!spaceId) return;
      try {
        const res = await secureApiFetch(`/api/spaces/${spaceId}/boards`);
        if (res.ok) {
          const data = await res.json();
          setBoards((data.boards || []).map((b: { id: string; name: string }) => ({
            id: b.id,
            name: b.name,
          })));
        }
      } catch {
        // Ignore errors
      }
    };
    void loadBoards();
  }, [spaceId]);

  // Convert context events to panel format
  const panelEvents: SpaceEvent[] = React.useMemo(() => {
    return events.map((e) => ({
      id: e.id,
      title: e.title,
      description: (e as { description?: string }).description,
      type: (e.type as SpaceEvent['type']) || 'meeting',
      startDate: e.startDate,
      endDate: (e as { endDate?: string }).endDate,
      location: e.location,
      virtualLink: e.virtualLink,
      currentAttendees: e.currentAttendees,
      maxAttendees: (e as { maxAttendees?: number }).maxAttendees,
      userRSVP: (e as { userRSVP?: RSVPStatus }).userRSVP,
      organizerId: (e as { organizerId?: string }).organizerId,
      organizerName: (e as { organizerName?: string }).organizerName,
    }));
  }, [events]);

  // Find selected event and convert to modal format
  const selectedEventDetails = React.useMemo((): SpaceEventDetails | null => {
    if (!selectedEventId) return null;
    const event = events.find((e) => e.id === selectedEventId);
    if (!event) return null;

    const e = event as {
      id: string;
      title: string;
      description?: string;
      type: string;
      startDate: string;
      endDate?: string;
      location?: string;
      virtualLink?: string;
      currentAttendees: number;
      maxAttendees?: number;
      organizerId?: string;
      organizerName?: string;
      organizerAvatarUrl?: string;
      userRSVP?: RSVPStatus;
      linkedBoardId?: string;
    };

    const eventType = (['academic', 'social', 'recreational', 'cultural', 'meeting', 'virtual'] as const).includes(
      e.type as SpaceEventDetails['type']
    ) ? e.type as SpaceEventDetails['type'] : 'meeting';

    return {
      id: e.id,
      title: e.title,
      description: e.description,
      type: eventType,
      startDate: e.startDate,
      endDate: e.endDate,
      location: e.location,
      virtualLink: e.virtualLink,
      currentAttendees: e.currentAttendees || 0,
      maxAttendees: e.maxAttendees,
      organizer: e.organizerId ? {
        id: e.organizerId,
        fullName: e.organizerName || 'Organizer',
        photoURL: e.organizerAvatarUrl,
      } : undefined,
      userRSVP: e.userRSVP || null,
      linkedBoardId: e.linkedBoardId,
    };
  }, [selectedEventId, events]);

  // Handle event click
  const handleEventClick = React.useCallback((event: SpaceEvent) => {
    setSelectedEventId(event.id);
    setEventDetailsModalOpen(true);
  }, []);

  // Handle RSVP
  const handleEventRSVP = React.useCallback(async (eventId: string, status: RSVPStatus) => {
    if (!spaceId) throw new Error("Space not found");
    const response = await secureApiFetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update RSVP');
    }
    refreshEvents();
    toast.success('RSVP updated', status === 'going' ? "You're going!" : status === 'maybe' ? "Marked as maybe" : "RSVP removed");
  }, [spaceId, refreshEvents]);

  // Handle create event
  const handleCreateEvent = React.useCallback(async (input: EventCreateInput) => {
    if (!spaceId) throw new Error("Space not found");
    const response = await secureApiFetch(`/api/spaces/${spaceId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        type: input.type,
        startDate: input.startDate,
        endDate: input.endDate,
        location: input.location,
        virtualLink: input.virtualLink,
        maxAttendees: input.maxAttendees,
        requiresRSVP: input.requiredRSVP,
        announceToSpace: input.announceToSpace,
        linkedBoardId: input.linkedBoardId,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create event');
    }
    refreshEvents();
    toast.success('Event created', 'Your event is now visible to members.');
    setCreateEventModalOpen(false);
  }, [spaceId, refreshEvents]);

  if (!space) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#A1A1A6]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="border-b border-white/[0.06] bg-[#0A0A0A]/95 backdrop-blur-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/spaces/${spaceId}`)}
              className="p-2 rounded-lg hover:bg-white/5 text-[#A1A1A6] hover:text-[#FAFAFA] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-[#FAFAFA]">{space.name}</h1>
              <p className="text-sm text-[#818187]">Events</p>
            </div>
          </div>
        </div>
      </div>

      {/* Events Panel */}
      <div className="max-w-4xl mx-auto">
        <EventsPanel
          spaceId={spaceId ?? ''}
          events={panelEvents}
          isLoading={isEventsLoading}
          userRole={userRole}
          currentUserId={user?.uid}
          onEventClick={handleEventClick}
          onCreateEvent={isLeader ? () => setCreateEventModalOpen(true) : undefined}
          className="min-h-[calc(100vh-80px)]"
        />
      </div>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEventDetails}
        open={eventDetailsModalOpen}
        onOpenChange={(open) => {
          setEventDetailsModalOpen(open);
          if (!open) setSelectedEventId(null);
        }}
        onRSVP={handleEventRSVP}
        onViewBoard={selectedEventDetails?.linkedBoardId ? (boardId) => {
          router.push(`/spaces/${spaceId}?board=${boardId}`);
        } : undefined}
        currentUserId={user?.uid}
        spaceId={spaceId ?? ''}
      />

      {/* Event Create Modal */}
      <EventCreateModal
        open={createEventModalOpen}
        onOpenChange={setCreateEventModalOpen}
        onSubmit={handleCreateEvent}
        boards={boards}
      />
    </div>
  );
}

// ============================================================
// Page Component with Provider
// ============================================================

export default function SpaceEventsPage() {
  const params = useParams<{ spaceId: string }>();
  const spaceId = params?.spaceId;

  if (!spaceId) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-[#A1A1A6]">Space not found</div>
      </div>
    );
  }

  return (
    <SpaceContextProvider spaceId={spaceId}>
      <SpaceEventsContent />
    </SpaceContextProvider>
  );
}
