/**
 * HiveLab Elements - Modular Element Components
 *
 * This directory contains split versions of the element renderers for better maintainability.
 * The original element-renderers.tsx (2530 lines) has been partially extracted here.
 *
 * Structure:
 * - error-boundary.tsx: Error boundary for safe element rendering
 * - universal.tsx: Basic UI elements (SearchInput, Filter, ResultList, DatePicker, TagCloud, MapView, Chart, Form, Notifications)
 * - interactive.tsx: Engagement elements (Poll, Timer, Counter, Leaderboard, Countdown) ✅ EXTRACTED
 * - connected.tsx: Data-bound elements (EventPicker, SpacePicker, UserSelector, ConnectionList, RSVP) [TODO: extract]
 * - space.tsx: Space-specific elements (MemberList, MemberSelector, SpaceEvents, SpaceFeed, SpaceStats, Announcement, RoleGate) [TODO: extract]
 *
 * Migration Strategy:
 * 1. New code should import from these split files
 * 2. The original element-renderers.tsx remains the source of truth for the ELEMENT_RENDERERS map
 * 3. Gradually move elements here as they need updates
 *
 * @see element-renderers.tsx for the complete element registry
 */

// Export error boundary
export { ElementErrorBoundary, ElementErrorFallback } from './error-boundary';

// Export universal elements (basic UI)
export {
  SearchInputElement,
  FilterSelectorElement,
  ResultListElement,
  DatePickerElement,
  TagCloudElement,
  MapViewElement,
  ChartDisplayElement,
  FormBuilderElement,
  NotificationCenterElement,
} from './universal';

// Export interactive elements (engagement)
export {
  PollElement,
  CountdownTimerElement,
  TimerElement,
  CounterElement,
  LeaderboardElement,
} from './interactive';

// Re-export everything from the main file for backward compatibility
export {
  // Core utilities
  renderElement,
  renderElementSafe,
  isElementSupported,
  getSupportedElementTypes,
  // Connected elements (still in main file)
  UserSelectorElement,
  EventPickerElement,
  SpacePickerElement,
  ConnectionListElement,
  RsvpButtonElement,
  // Space elements (still in main file)
  MemberListElement,
  MemberSelectorElement,
  SpaceEventsElement,
  SpaceFeedElement,
  SpaceStatsElement,
  AnnouncementElement,
  RoleGateElement,
} from '../element-renderers';
