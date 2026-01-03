/**
 * MinimalSidebar Type Definitions
 * Resend/YC/SF-inspired navigation sidebar
 */

export interface SidebarSpace {
  id: string;
  name: string;
  slug?: string;
  avatar?: string;
  unreadCount?: number;
  isActive?: boolean;
}

export interface SidebarUser {
  name: string;
  handle?: string;
  avatarUrl?: string;
}

export interface MinimalSidebarProps {
  /** User's spaces for dropdown */
  spaces?: SidebarSpace[];
  /** Currently active space ID */
  activeSpaceId?: string;
  /** Space selection handler */
  onSpaceSelect?: (spaceId: string) => void;
  /** Navigate to browse spaces */
  onBrowseClick?: () => void;
  /** Navigate to feed (even if disabled) */
  onFeedClick?: () => void;
  /** Navigate to HiveLab/Build */
  onBuildClick?: () => void;
  /** Navigate to profile */
  onProfileClick?: () => void;
  /** User profile data */
  user?: SidebarUser;
  /** Whether user has builder access */
  isBuilder?: boolean;
  /** Current pathname for active state */
  pathname?: string;
  /** Controlled expanded state (optional - uses internal state if not provided) */
  isExpanded?: boolean;
  /** Callback when expanded state changes */
  onExpandChange?: (expanded: boolean) => void;
}

export interface NavItemProps {
  /** Icon element */
  icon: React.ReactNode;
  /** Label text */
  label: string;
  /** Is sidebar expanded */
  isExpanded: boolean;
  /** Is this item active */
  isActive?: boolean;
  /** Badge text (e.g., "Soon") */
  badge?: string;
  /** Is item disabled */
  disabled?: boolean;
  /** Visual variant */
  variant?: 'default' | 'gold';
  /** Has dropdown */
  hasDropdown?: boolean;
  /** Is dropdown open */
  isDropdownOpen?: boolean;
  /** Click handler */
  onClick?: () => void;
}

export interface SpacesDropdownProps {
  /** Spaces to display */
  spaces: SidebarSpace[];
  /** Active space ID */
  activeSpaceId?: string;
  /** Space selection handler */
  onSpaceSelect?: (spaceId: string) => void;
  /** Browse all spaces handler */
  onBrowseClick?: () => void;
  /** Is dropdown open */
  isOpen: boolean;
  /** Is sidebar expanded */
  isExpanded: boolean;
}

export interface ProfileAvatarProps {
  /** User data */
  user?: SidebarUser;
  /** Is sidebar expanded */
  isExpanded: boolean;
  /** Click handler */
  onClick?: () => void;
}
