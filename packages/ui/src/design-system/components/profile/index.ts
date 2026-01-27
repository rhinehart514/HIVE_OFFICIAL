/**
 * Profile Components
 *
 * Components for user profile display and tool management.
 */

// ============================================
// MODAL COMPONENTS (New - Phase 2)
// ============================================

export {
  ProfileToolModal,
  type ProfileToolModalData,
  type ProfileToolModalProps,
} from './ProfileToolModal';

// ============================================
// 3-ZONE PROFILE LAYOUT (New - Design Sprint)
// ============================================

// Zone 1: Identity Hero
export {
  ProfileIdentityHero,
  type ProfileIdentityHeroUser,
  type ProfileIdentityHeroProps,
} from './ProfileIdentityHero';

// Zone 2: Activity Cards (Building, Leading, Organizing)
export {
  ProfileActivityCard,
  type ProfileActivityTool,
  type ProfileActivityCardProps,
} from './ProfileActivityCard';

export {
  ProfileLeadershipCard,
  type ProfileLeadershipSpace,
  type ProfileLeadershipCardProps,
} from './ProfileLeadershipCard';

export {
  ProfileEventCard,
  type ProfileEvent,
  type ProfileEventCardProps,
} from './ProfileEventCard';

// Zone 3: Campus Presence
export {
  ProfileSpacePill,
  type ProfileSpacePillSpace,
  type ProfileSpacePillProps,
} from './ProfileSpacePill';

export {
  ProfileConnectionFooter,
  type ProfileConnectionFooterProps,
} from './ProfileConnectionFooter';

// Shared
export {
  ProfileOverflowChip,
  type ProfileOverflowChipProps,
} from './ProfileOverflowChip';

// ============================================
// PROFILE DISPLAY COMPONENTS (Legacy - Bento)
// ============================================

// ProfileBentoCard - Apple-style widget card for bento grid
export {
  ProfileBentoCard,
  // Legacy alias (deprecated)
  ProfileCard,
  type ProfileBentoCardProps,
  type ProfileCardProps,
} from './ProfileCard';

export {
  ProfileHero,
  type ProfileHeroProps,
  type ProfileHeroUser,
  type ProfileHeroPresence,
  type ProfileHeroBadges,
} from './ProfileHero';

export {
  ProfileStatsRow,
  type ProfileStatsRowProps,
} from './ProfileStatsRow';

export {
  ContextBanner,
  type ContextBannerProps,
} from './ContextBanner';

export {
  ProfileSpacesCard,
  type ProfileSpacesCardProps,
  type ProfileSpace,
} from './ProfileSpacesCard';

export {
  ProfileToolsCard,
  type ProfileToolsCardProps,
  type ProfileTool,
} from './ProfileToolsCard';

export {
  ProfileConnectionsCard,
  type ProfileConnectionsCardProps,
  type ProfileConnection,
} from './ProfileConnectionsCard';

export {
  ProfileInterestsCard,
  type ProfileInterestsCardProps,
} from './ProfileInterestsCard';

export {
  ProfileActivityHeatmap,
  type ProfileActivityHeatmapProps,
  type ActivityContribution,
} from './ProfileActivityHeatmap';

// ============================================
// BENTO GRID WIDGETS (New - Phase 2)
// ============================================

export {
  ProfileStatsWidget,
  type ProfileStatsWidgetProps,
} from './ProfileStatsWidget';

export {
  ProfileFeaturedToolCard,
  type ProfileFeaturedToolCardProps,
  type FeaturedTool,
} from './ProfileFeaturedToolCard';
