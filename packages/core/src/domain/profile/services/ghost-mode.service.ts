/**
 * GhostModeService
 *
 * Domain service for ghost mode (privacy stealth) operations.
 * Enforces ghost mode settings across the platform.
 *
 * Ghost mode levels:
 * - invisible: Hidden from everyone
 * - minimal: Only visible to space members
 * - selective: Visible to close community members (2+ shared spaces)
 * - normal: Full visibility
 *
 * Ghost mode settings:
 * - hideFromDirectory: Don't show in member lists, search results
 * - hideActivity: Don't show in activity feeds
 * - hideSpaceMemberships: Don't show which spaces user belongs to
 * - hideLastSeen: Don't show last active timestamp
 * - hideOnlineStatus: Don't show online/offline status
 */

import { ViewerContext } from '../../shared/value-objects/viewer-context.value';

/**
 * Ghost mode configuration
 */
export interface GhostModeSettings {
  enabled: boolean;
  level: 'invisible' | 'minimal' | 'selective' | 'normal';
  hideFromDirectory: boolean;
  hideActivity: boolean;
  hideSpaceMemberships: boolean;
  hideLastSeen: boolean;
  hideOnlineStatus: boolean;
  hideFromSearch?: boolean;
}

/**
 * Default ghost mode (all visible)
 */
export const DEFAULT_GHOST_MODE: GhostModeSettings = {
  enabled: false,
  level: 'normal',
  hideFromDirectory: false,
  hideActivity: false,
  hideSpaceMemberships: false,
  hideLastSeen: false,
  hideOnlineStatus: false,
  hideFromSearch: false
};

/**
 * User data structure for ghost mode checks
 */
export interface GhostModeUser {
  id: string;
  ghostMode?: GhostModeSettings;
  visibility?: {
    showInDirectory?: boolean;
    showActivity?: boolean;
    showOnlineStatus?: boolean;
    showLastSeen?: boolean;
  };
}

export class GhostModeService {
  /**
   * Get ghost mode settings from user data
   *
   * Handles missing or partial ghost mode data
   */
  public static getSettings(userData: Record<string, unknown>): GhostModeSettings {
    const ghostMode = userData.ghostMode as Partial<GhostModeSettings> | undefined;
    const visibility = userData.visibility as { showInDirectory?: boolean; showActivity?: boolean } | undefined;

    if (!ghostMode?.enabled) {
      return DEFAULT_GHOST_MODE;
    }

    return {
      enabled: ghostMode.enabled,
      level: ghostMode.level ?? 'normal',
      hideFromDirectory: ghostMode.hideFromDirectory ?? (visibility?.showInDirectory === false),
      hideActivity: ghostMode.hideActivity ?? (visibility?.showActivity === false),
      hideSpaceMemberships: ghostMode.hideSpaceMemberships ?? false,
      hideLastSeen: ghostMode.hideLastSeen ?? false,
      hideOnlineStatus: ghostMode.hideOnlineStatus ?? false,
      hideFromSearch: ghostMode.hideFromSearch ?? ghostMode.hideFromDirectory ?? false
    };
  }

  /**
   * Check if a user should be hidden from directory/member lists
   *
   * @param user - The user being viewed
   * @param viewer - The viewer's context
   * @param sharedSpaceIds - Space IDs that both users are members of
   */
  public static shouldHideFromDirectory(
    user: GhostModeUser,
    viewer: ViewerContext,
    sharedSpaceIds?: string[]
  ): boolean {
    const settings = this.getSettingsFromUser(user);

    // Not in ghost mode or directory hiding disabled
    if (!settings.enabled || !settings.hideFromDirectory) {
      return false;
    }

    return this.applyVisibilityRules(settings, user.id, viewer, sharedSpaceIds);
  }

  /**
   * Check if a user's activity should be hidden from feeds
   *
   * @param user - The user whose activity is being viewed
   * @param viewer - The viewer's context
   * @param sharedSpaceIds - Space IDs that both users are members of
   */
  public static shouldHideActivity(
    user: GhostModeUser,
    viewer: ViewerContext,
    sharedSpaceIds?: string[]
  ): boolean {
    const settings = this.getSettingsFromUser(user);

    if (!settings.enabled || !settings.hideActivity) {
      return false;
    }

    return this.applyVisibilityRules(settings, user.id, viewer, sharedSpaceIds);
  }

  /**
   * Check if a user should be hidden from search results
   *
   * @param user - The user being searched
   * @param viewer - The viewer's context
   * @param sharedSpaceIds - Space IDs that both users are members of
   */
  public static shouldHideFromSearch(
    user: GhostModeUser,
    viewer: ViewerContext,
    sharedSpaceIds?: string[]
  ): boolean {
    const settings = this.getSettingsFromUser(user);

    // Use hideFromDirectory as fallback if hideFromSearch not set
    if (!settings.enabled || (!settings.hideFromSearch && !settings.hideFromDirectory)) {
      return false;
    }

    return this.applyVisibilityRules(settings, user.id, viewer, sharedSpaceIds);
  }

  /**
   * Check if a user's space memberships should be hidden
   *
   * @param user - The user whose memberships are being viewed
   * @param viewer - The viewer's context
   */
  public static shouldHideSpaceMemberships(
    user: GhostModeUser,
    viewer: ViewerContext
  ): boolean {
    const settings = this.getSettingsFromUser(user);

    if (!settings.enabled || !settings.hideSpaceMemberships) {
      return false;
    }

    // Always show to self
    if (viewer.userId === user.id) {
      return false;
    }

    // Admins can always see
    if (viewer.isAdmin) {
      return false;
    }

    return true;
  }

  /**
   * Check if a user's online status should be hidden
   */
  public static shouldHideOnlineStatus(user: GhostModeUser, viewer: ViewerContext): boolean {
    const settings = this.getSettingsFromUser(user);

    if (!settings.enabled || !settings.hideOnlineStatus) {
      return false;
    }

    // Always show to self
    if (viewer.userId === user.id) {
      return false;
    }

    return true;
  }

  /**
   * Check if a user's last seen timestamp should be hidden
   */
  public static shouldHideLastSeen(user: GhostModeUser, viewer: ViewerContext): boolean {
    const settings = this.getSettingsFromUser(user);

    if (!settings.enabled || !settings.hideLastSeen) {
      return false;
    }

    // Always show to self
    if (viewer.userId === user.id) {
      return false;
    }

    return true;
  }

  /**
   * Filter a list of users based on ghost mode settings
   *
   * @param users - Array of users to filter
   * @param viewer - The viewer's context
   * @param context - 'directory' | 'search' | 'activity'
   * @param getSharedSpaces - Optional function to get shared spaces for a user
   */
  public static filterUsers<T extends GhostModeUser>(
    users: T[],
    viewer: ViewerContext,
    context: 'directory' | 'search' | 'activity',
    getSharedSpaces?: (userId: string) => string[]
  ): T[] {
    return users.filter(user => {
      const sharedSpaces = getSharedSpaces?.(user.id);

      switch (context) {
        case 'directory':
          return !this.shouldHideFromDirectory(user, viewer, sharedSpaces);
        case 'search':
          return !this.shouldHideFromSearch(user, viewer, sharedSpaces);
        case 'activity':
          return !this.shouldHideActivity(user, viewer, sharedSpaces);
        default:
          return true;
      }
    });
  }

  /**
   * Get preset settings for a ghost mode level
   */
  public static getLevelPreset(level: GhostModeSettings['level']): Omit<GhostModeSettings, 'enabled' | 'level'> {
    switch (level) {
      case 'invisible':
        return {
          hideFromDirectory: true,
          hideActivity: true,
          hideSpaceMemberships: true,
          hideLastSeen: true,
          hideOnlineStatus: true,
          hideFromSearch: true
        };
      case 'minimal':
        return {
          hideFromDirectory: false,
          hideActivity: true,
          hideSpaceMemberships: false,
          hideLastSeen: true,
          hideOnlineStatus: true,
          hideFromSearch: false
        };
      case 'selective':
        return {
          hideFromDirectory: false,
          hideActivity: false,
          hideSpaceMemberships: false,
          hideLastSeen: true,
          hideOnlineStatus: false,
          hideFromSearch: false
        };
      case 'normal':
      default:
        return {
          hideFromDirectory: false,
          hideActivity: false,
          hideSpaceMemberships: false,
          hideLastSeen: false,
          hideOnlineStatus: false,
          hideFromSearch: false
        };
    }
  }

  /**
   * Helper to get settings from user object
   */
  private static getSettingsFromUser(user: GhostModeUser): GhostModeSettings {
    if (!user.ghostMode?.enabled) {
      return DEFAULT_GHOST_MODE;
    }

    return {
      enabled: user.ghostMode.enabled,
      level: user.ghostMode.level ?? 'normal',
      hideFromDirectory: user.ghostMode.hideFromDirectory ?? false,
      hideActivity: user.ghostMode.hideActivity ?? false,
      hideSpaceMemberships: user.ghostMode.hideSpaceMemberships ?? false,
      hideLastSeen: user.ghostMode.hideLastSeen ?? false,
      hideOnlineStatus: user.ghostMode.hideOnlineStatus ?? false,
      hideFromSearch: user.ghostMode.hideFromSearch ?? user.ghostMode.hideFromDirectory ?? false
    };
  }

  /**
   * Apply visibility rules based on ghost mode level
   *
   * @param settings - The ghost mode settings
   * @param targetUserId - The user being viewed
   * @param viewer - The viewer's context
   * @param sharedSpaceIds - Shared space IDs (if known)
   * @returns true if user should be hidden
   */
  private static applyVisibilityRules(
    settings: GhostModeSettings,
    targetUserId: string,
    viewer: ViewerContext,
    sharedSpaceIds?: string[]
  ): boolean {
    // Always visible to self
    if (viewer.userId === targetUserId) {
      return false;
    }

    // Admins can always see
    if (viewer.isAdmin) {
      return false;
    }

    // Apply level-based rules
    switch (settings.level) {
      case 'invisible':
        // Hidden from everyone except self and admins
        return true;

      case 'minimal':
        // Only visible to space members
        if (sharedSpaceIds && sharedSpaceIds.length > 0) {
          return false;
        }
        // Check if viewer is member of any same spaces
        return !viewer.memberOfSpaceIds.some(spaceId =>
          viewer.memberOfSpaceIds.includes(spaceId)
        );

      case 'selective':
        // Visible to close community members (2+ shared spaces)
        if (sharedSpaceIds && sharedSpaceIds.length >= 2) {
          return false;
        }
        return true;

      case 'normal':
      default:
        // Normal visibility (shouldn't reach here if hideX is true)
        return false;
    }
  }
}
