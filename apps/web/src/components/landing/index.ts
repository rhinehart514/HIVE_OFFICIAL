/**
 * Landing Page Components
 *
 * Two versions available:
 * - LandingPage: Traditional SaaS landing (sections, scroll, explanations)
 * - WindowLanding: Rap video energy (fragments, rhythm, no explanation)
 */

// The new experience
export { WindowLanding } from './window-landing';

// World background (shared with auth/onboarding)
export { WorldBackground } from './world-background';

// Content system
export {
  MESSAGE_FRAGMENTS,
  SPACE_FRAGMENTS,
  TOOL_FRAGMENTS,
  ACTIVITY_FRAGMENTS,
  FRAGMENT_SEQUENCE,
  getMessageById,
  getSpaceById,
  getToolById,
  getActivityById,
} from './content-library';

// Motion system
export {
  BEAT,
  fragmentVariants,
  messageVariants,
  spaceVariants,
  toolVariants,
  activityVariants,
  entranceVariants,
  pulseVariants,
  getFragmentPosition,
} from './motion-rhythm';

// Legacy landing (keep for A/B testing or fallback)
export { LandingPage } from './landing-page';
