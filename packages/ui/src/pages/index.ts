// NOTE: Most page components are legacy prototypes with type mismatches
// They have been disabled pending migration to the new design system
// See tsconfig.json exclude list for the full list of excluded files

// ============================================
// PAGE SKELETONS
// Premium loading states with staggered wave animations
// Base color: white/[0.08], stagger delay: 0.15s
// ============================================

// Feed
export { FeedLoadingSkeleton } from "./feed/FeedLoadingSkeleton";

// Profile
export { ProfileViewLoadingSkeleton } from "./profile/ProfileViewLoadingSkeleton";

// Spaces
export {
  SpacesDiscoverySkeleton,
  SpaceDetailSkeleton,
  SpaceCreationSkeleton,
} from "./spaces/SpacesSkeletons";

// HiveLab pages — REMOVED (deleted)
