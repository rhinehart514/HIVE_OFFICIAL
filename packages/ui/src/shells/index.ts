/**
 * HIVE Shell System
 *
 * January 2026: Redesigned with Top + Sidebar pattern
 *
 * The shell system provides:
 * - UniversalShell: Main app shell with top bar + sidebar + mobile nav
 * - SpaceMobileNav: Mobile navigation for space pages
 */

// Main Shell
export { UniversalShell, SHELL_TOKENS } from './UniversalShell';
export type {
  UniversalShellProps,
  SpaceData,
  ToolData,
  ShellMode,
} from './UniversalShell';

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
