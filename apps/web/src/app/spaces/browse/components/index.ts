/**
 * Browse Page Components
 *
 * Extracted components for the spaces browse page.
 * Supports dual-mode: discover (new user) vs dashboard (returning user).
 */

// Card components for space discovery
export { HeroSpaceCard, NeighborhoodCard, JoinButton } from './browse-cards';

// Section components for browse layout
export {
  TerritoryAtmosphere,
  SearchInput,
  CategoryPills,
  LoadingSkeleton,
  SearchResults,
  DiscoveryContent,
  JoinCelebration,
  DiscoverHero,
  FirstTimeWelcome,
  RecommendationsSection,
  RecommendationsBlock,
} from './browse-sections';

// Dashboard components for returning users
export {
  SpaceDashboardCard,
  SpaceDashboardCardSkeleton,
} from './space-dashboard-card';

// Dashboard sections (Your Spaces view)
export {
  YourSpacesSection,
  FriendsSpacesSection,
  DashboardContent,
} from './browse-dashboard';
