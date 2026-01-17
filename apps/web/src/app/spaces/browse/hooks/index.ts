/**
 * Browse Page Hooks
 *
 * Extracted hooks for the spaces browse page.
 * Supports dual-mode: new user (discover) vs returning user (dashboard).
 */

// Main browse state
export {
  useBrowsePageState,
  formatActivityTime,
  isSpaceLive,
  getActivityLevel,
  getSnapSpring,
  getSnapVariants,
  getStaggerContainer,
  type UseBrowsePageStateReturn,
  type SpaceSearchResult,
  type JoinCelebration,
  type BrowseMode,
} from './use-browse-page-state';

// User's joined spaces (for returning user dashboard)
export {
  useMySpaces,
  type MySpace,
  type SpaceMembership,
  type MySpacesStats,
  type UseMySpacesReturn,
} from './use-my-spaces';

// Spaces where user's friends are (for discovery)
export {
  useFriendsSpaces,
  type FriendsSpace,
  type UseFriendsSpacesReturn,
} from './use-friends-spaces';

// Campus-wide upcoming events (for "Happening Soon")
export {
  useUpcomingEvents,
  type UpcomingEvent,
  type UseUpcomingEventsReturn,
} from './use-upcoming-events';

// Personalized recommendations (behavioral psychology algorithm)
export {
  useRecommendations,
  type RecommendedSpace,
  type RecommendationsResponse,
  type UseRecommendationsReturn,
} from './use-recommendations';
