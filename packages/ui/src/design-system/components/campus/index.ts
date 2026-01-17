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

// Campus Dock
export {
  CampusDock,
  type CampusDockProps,
  type DockSpaceItem,
  type DockToolItem,
} from './CampusDock';

// Dock Orb
export {
  DockOrb,
  type DockOrbProps,
  type WarmthLevel,
} from './DockOrb';

// Preview Card
export {
  DockPreviewCard,
  type DockPreviewCardProps,
  type SpacePreviewData,
  type ToolPreviewData,
} from './DockPreviewCard';
