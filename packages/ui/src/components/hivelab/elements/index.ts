/**
 * HiveLab Elements - Modular Element Components
 *
 * All elements have been fully extracted from the legacy monolithic file.
 *
 * Structure:
 * - error-boundary.tsx: Error boundary for safe element rendering
 * - universal.tsx: Basic UI elements (SearchInput, Filter, ResultList, DatePicker, TagCloud, MapView, Chart, Form, Notifications, UserSelector)
 * - interactive.tsx: Engagement elements (Poll, Timer, Counter, Leaderboard, Countdown, RSVP)
 * - connected/: Data-bound elements (EventPicker, SpacePicker, ConnectionList, DiningPicker, StudySpotFinder)
 * - space/: Space-specific elements (MemberList, MemberSelector, SpaceEvents, SpaceFeed, SpaceStats, Announcement, RoleGate)
 *
 * @see registry.tsx for the complete element registry
 */

// Export error boundary
export { ElementErrorBoundary, ElementErrorFallback } from './error-boundary';

// Export universal elements (basic UI)
export {
  SearchInputElement,
  FilterSelectorElement,
  ResultListElement,
  DatePickerElement,
  UserSelectorElement,
  TagCloudElement,
  MapViewElement,
  ChartDisplayElement,
  FormBuilderElement,
  NotificationCenterElement,
  PhotoGalleryElement,
} from './universal';

// Export interactive elements (engagement)
export {
  PollElement,
  CountdownTimerElement,
  TimerElement,
  CounterElement,
  LeaderboardElement,
  RsvpButtonElement,
} from './interactive';

// Export connected elements (data-bound)
export {
  EventPickerElement,
  SpacePickerElement,
  ConnectionListElement,
  DiningPickerElement,
  StudySpotFinderElement,
} from './connected';
export { PersonalizedEventFeedElement } from './connected/personalized-event-feed';

// Export space elements
export {
  MemberListElement,
  MemberSelectorElement,
  SpaceEventsElement,
  SpaceFeedElement,
  SpaceStatsElement,
  AnnouncementElement,
  RoleGateElement,
  AvailabilityHeatmapElement,
} from './space';

// Re-export core utilities from the registry
export {
  renderElement,
  renderElementSafe,
  isElementSupported,
  getSupportedElementTypes,
  getElementsByCategory,
} from './registry';
