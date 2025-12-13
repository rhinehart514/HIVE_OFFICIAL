/**
 * ContentModerationService
 *
 * Domain service for content moderation operations.
 * This is the single source of truth for moderation checks across the codebase.
 *
 * Replaces duplicate implementations in:
 * - apps/web/src/lib/content-moderation.ts
 * - apps/web/src/lib/automated-moderation-workflows.ts
 * - Various inline checks in API routes
 */

import { ContentVisibility, VisibilityStatus } from '../value-objects/content-visibility.value';
import { ViewerContext } from '../value-objects/viewer-context.value';

/**
 * Content types that can be moderated
 */
export type ModerableContentType = 'post' | 'comment' | 'event' | 'space' | 'user' | 'message';

/**
 * Moderation action types
 */
export type ModerationAction = 'hide' | 'unhide' | 'remove' | 'restore' | 'flag' | 'unflag' | 'approve';

/**
 * Moderation action result
 */
export interface ModerationActionResult {
  success: boolean;
  contentId: string;
  contentType: ModerableContentType;
  action: ModerationAction;
  previousStatus: VisibilityStatus;
  newStatus: VisibilityStatus;
  moderatorId: string;
  timestamp: Date;
  reason?: string;
}

export class ContentModerationService {
  /**
   * Check if content should be hidden from public view
   *
   * This is the canonical implementation that should replace all other
   * `isContentHidden()` functions throughout the codebase.
   *
   * Checks for:
   * - isHidden: boolean flag
   * - isDeleted: soft delete flag
   * - status: string status field ('hidden', 'removed', 'flagged')
   * - moderationStatus: explicit moderation status
   *
   * @param data - The document data to check
   * @returns true if content should be hidden from public view
   */
  public static isHidden(data: Record<string, unknown>): boolean {
    // Boolean flags - most direct indication
    if (data.isHidden === true) return true;
    if (data.isDeleted === true) return true;

    // Status string fields
    const status = data.status as string | undefined;
    if (status === 'hidden' || status === 'removed' || status === 'flagged') return true;

    // Explicit moderation status
    const moderationStatus = data.moderationStatus as string | undefined;
    if (moderationStatus === 'removed' || moderationStatus === 'hidden') return true;

    return false;
  }

  /**
   * Check if content is flagged for review (but not yet hidden)
   *
   * @param data - The document data to check
   * @returns true if content is flagged but still visible
   */
  public static isFlagged(data: Record<string, unknown>): boolean {
    const status = data.status as string | undefined;
    const moderationStatus = data.moderationStatus as string | undefined;

    if (status === 'flagged' || moderationStatus === 'flagged' || moderationStatus === 'pending_review') {
      // Only flagged if not already hidden
      return !ContentModerationService.isHidden(data);
    }

    // Check for flag count
    const flagCount = data.flagCount as number | undefined;
    if (flagCount && flagCount > 0) {
      return !ContentModerationService.isHidden(data);
    }

    return false;
  }

  /**
   * Check if content is pending review
   *
   * @param data - The document data to check
   * @returns true if content needs moderation review
   */
  public static isPendingReview(data: Record<string, unknown>): boolean {
    const moderationStatus = data.moderationStatus as string | undefined;
    return moderationStatus === 'pending_review';
  }

  /**
   * Filter an array of documents to exclude hidden content
   *
   * @param items - Array of document data
   * @param viewerContext - Optional viewer context for permission-based filtering
   * @returns Filtered array with hidden content removed (unless viewer has permission)
   */
  public static filter<T extends Record<string, unknown>>(
    items: T[],
    viewerContext?: ViewerContext
  ): T[] {
    return items.filter(item => {
      const visibility = ContentVisibility.fromFirestoreData(item);

      // Admins see everything
      if (viewerContext?.isAdmin) {
        return true;
      }

      // Moderators see hidden but not deleted
      if (viewerContext?.isModerator && !visibility.isDeleted()) {
        return true;
      }

      // Regular users only see visible content
      return visibility.isVisible();
    });
  }

  /**
   * Check if a viewer can see specific content
   *
   * @param data - The content document data
   * @param viewerContext - The viewer's context
   * @returns true if the viewer can see this content
   */
  public static canView(
    data: Record<string, unknown>,
    viewerContext: ViewerContext
  ): boolean {
    const visibility = ContentVisibility.fromFirestoreData(data);

    // Visible content is always viewable
    if (visibility.isVisible()) {
      return true;
    }

    // Admins see everything
    if (viewerContext.isAdmin) {
      return true;
    }

    // Moderators see hidden and flagged, not deleted
    if (viewerContext.isModerator) {
      return !visibility.isDeleted();
    }

    // Content owners can see their own hidden content
    const authorId = data.authorId as string | undefined ?? data.userId as string | undefined;
    if (authorId && viewerContext.userId === authorId) {
      return !visibility.isDeleted();
    }

    return false;
  }

  /**
   * Get visibility status for display
   *
   * @param data - The document data
   * @returns Human-readable visibility status
   */
  public static getStatus(data: Record<string, unknown>): VisibilityStatus {
    return ContentVisibility.fromFirestoreData(data).status;
  }

  /**
   * Build moderation update data for Firestore
   *
   * @param action - The moderation action to perform
   * @param moderatorId - ID of the user performing the action
   * @param reason - Optional reason for the action
   * @returns Object to merge into Firestore update
   */
  public static buildUpdate(
    action: ModerationAction,
    moderatorId: string,
    reason?: string
  ): Record<string, unknown> {
    let visibility: ContentVisibility;

    switch (action) {
      case 'hide':
        visibility = ContentVisibility.hidden(reason ?? 'Moderation action', moderatorId);
        break;
      case 'unhide':
      case 'restore':
      case 'approve':
      case 'unflag':
        visibility = ContentVisibility.visible();
        break;
      case 'remove':
        visibility = ContentVisibility.deleted(moderatorId);
        break;
      case 'flag':
        visibility = ContentVisibility.flagged(reason ?? 'Flagged for review', moderatorId);
        break;
      default:
        visibility = ContentVisibility.visible();
    }

    return visibility.toFirestoreUpdate(moderatorId);
  }

  /**
   * Get a summary of content visibility for a batch of items
   *
   * Useful for admin dashboards and moderation queues
   */
  public static getSummary(items: Record<string, unknown>[]): {
    total: number;
    visible: number;
    hidden: number;
    deleted: number;
    flagged: number;
    pendingReview: number;
  } {
    const summary = {
      total: items.length,
      visible: 0,
      hidden: 0,
      deleted: 0,
      flagged: 0,
      pendingReview: 0
    };

    for (const item of items) {
      const visibility = ContentVisibility.fromFirestoreData(item);

      switch (visibility.status) {
        case VisibilityStatus.VISIBLE:
          summary.visible++;
          break;
        case VisibilityStatus.HIDDEN:
          summary.hidden++;
          break;
        case VisibilityStatus.DELETED:
          summary.deleted++;
          break;
        case VisibilityStatus.FLAGGED:
          summary.flagged++;
          break;
        case VisibilityStatus.PENDING_REVIEW:
          summary.pendingReview++;
          break;
      }
    }

    return summary;
  }
}
