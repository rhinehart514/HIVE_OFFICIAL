/**
 * Campus Navigation Components
 *
 * Apple-inspired navigation system with:
 * - CommandBar (top) - search, create, notifications, user
 * - CampusDock (bottom) - spaces and tools as orbs
 * - CampusDrawer (mobile) - pull-up drawer with gesture support
 */

// Context
export {
  CampusProvider,
  useCampus,
  useCampusOptional,
  type CampusContextValue,
  type CampusProviderProps,
  type DrawerState,
} from './CampusProvider';

// Command Bar
export {
  CommandBar,
  type CommandBarProps,
  type CommandBarUser,
  type CommandBarNotification,
} from './CommandBar';

// CampusDock, DockOrb, DockPreviewCard removed (unused)
