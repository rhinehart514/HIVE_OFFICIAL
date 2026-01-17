/**
 * Space Handlers - Core space operations
 *
 * Handles: add tab, add widget, invite member, create event, RSVP, search users
 */

import { toast } from '@hive/ui';
import { secureApiFetch } from '@/lib/secure-auth-utils';
import type {
  SpaceHandlerDeps,
  AddTabInput,
  AddWidgetInputUI,
  MemberInviteInput,
  EventCreateInput,
  RSVPStatus,
  InviteableUser,
} from './types';

/**
 * Create space-related handlers with the given dependencies
 */
export function createSpaceHandlers(deps: SpaceHandlerDeps) {
  const { spaceId, leaderActions, refresh } = deps;

  // Handle add tab
  const handleAddTab = async (input: AddTabInput): Promise<void> => {
    if (!leaderActions) throw new Error('Not authorized');
    const result = await leaderActions.addTab({
      name: input.name,
      type: input.type,
    });
    if (!result) throw new Error('Failed to create tab');
  };

  // Handle add widget
  const handleAddWidget = async (input: AddWidgetInputUI): Promise<void> => {
    if (!leaderActions) throw new Error('Not authorized');
    const result = await leaderActions.addWidget({
      type: input.type as 'custom' | 'poll' | 'calendar' | 'links' | 'files' | 'rss',
      title: input.title ?? 'Untitled Widget',
      config: input.config,
    });
    if (!result) throw new Error('Failed to create widget');
  };

  // Handle invite member
  const handleInviteMember = async (input: MemberInviteInput): Promise<void> => {
    if (!spaceId) throw new Error('Space not found');
    const response = await secureApiFetch(`/api/spaces/${spaceId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: input.userId,
        role: input.role,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to invite member');
    }
    refresh();
  };

  // Handle search users for invite modal
  const handleSearchUsers = async (query: string): Promise<InviteableUser[]> => {
    if (!query || query.length < 2) return [];
    try {
      const response = await secureApiFetch(
        `/api/search?q=${encodeURIComponent(query)}&type=users&limit=10`
      );
      if (!response.ok) return [];
      const data = await response.json();
      return (data.users || []).map((u: Record<string, unknown>) => ({
        id: u.id as string,
        name: (u.displayName as string) || (u.name as string) || 'Unknown',
        handle: (u.handle as string) || (u.id as string),
        email: u.email as string | undefined,
        avatarUrl: (u.photoURL as string) || (u.avatarUrl as string) || undefined,
      }));
    } catch {
      return [];
    }
  };

  // Handle create event
  const handleCreateEvent = async (input: EventCreateInput): Promise<void> => {
    if (!spaceId) throw new Error('Space not found');
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
    refresh();
  };

  // Handle event RSVP
  const handleEventRSVP = async (eventId: string, status: RSVPStatus): Promise<void> => {
    if (!spaceId) throw new Error('Space not found');
    const response = await secureApiFetch(`/api/spaces/${spaceId}/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update RSVP');
    }
    refresh();
    toast.success(
      'RSVP updated',
      status === 'going'
        ? "You're going!"
        : status === 'maybe'
          ? 'Marked as maybe'
          : 'RSVP removed'
    );
  };

  return {
    handleAddTab,
    handleAddWidget,
    handleInviteMember,
    handleSearchUsers,
    handleCreateEvent,
    handleEventRSVP,
  };
}
