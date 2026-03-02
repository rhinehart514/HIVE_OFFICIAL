/* Shared types for feed components */

export interface FeedEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  isOnline?: boolean;
  rsvpCount: number;
  isUserRsvped?: boolean;
  userRsvp?: 'going' | 'maybe' | 'not_going' | null;
  spaceName?: string;
  spaceHandle?: string;
  spaceId?: string;
  spaceAvatarUrl?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  eventType?: string;
  category?: string;
  friendsAttending?: number;
  friendsAttendingNames?: string[];
  matchReasons?: string[];
  relevanceScore?: number;
  organizerName?: string;
}

export interface FeedSpace {
  id: string;
  handle?: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  isVerified?: boolean;
  isJoined?: boolean;
  category?: string;
  mutualCount?: number;
  upcomingEventCount?: number;
  nextEventTitle?: string;
  recentActivityAt?: string;
  memberVelocity?: number;
}

export interface CampusStats {
  campusName: string;
  spaces: number;
  eventsToday: number;
}
