/**
 * HIVE Shell System
 *
 * January 2026: Redesigned with Top + Sidebar pattern
 *
 * The shell system provides:
 * - SpaceMobileNav: Mobile navigation for space pages
 */

// Space Mobile Navigation
export { SpaceMobileNav } from './SpaceMobileNav';
export type { SpaceMobileNavProps, SpaceTab } from './SpaceMobileNav';

// Motion Utilities
export {
  MotionDiv,
  MotionSpan,
  MotionButton,
  MotionLink,
  MotionNav,
  MotionAside,
  AnimatePresence,
} from './motion-safe';
