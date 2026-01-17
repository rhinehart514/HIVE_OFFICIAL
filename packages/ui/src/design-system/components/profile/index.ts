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
// PROFILE DISPLAY COMPONENTS (Existing)
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
