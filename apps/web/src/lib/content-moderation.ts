/**
 * Content Moderation Utilities
 *
 * Shared utilities for filtering moderated/hidden/removed content
 * across all API endpoints.
 */

/**
 * Content moderation status fields that indicate content should be hidden
 */
export type ModerationStatus = 'visible' | 'hidden' | 'removed' | 'flagged' | 'pending_review';

/**
 * Check if content should be hidden from public view
 *
 * This checks all common moderation fields:
 * - isHidden: boolean flag
 * - isDeleted: soft delete flag
 * - status: string status field
 * - moderationStatus: explicit moderation status
 *
 * @param data - The document data to check
 * @returns true if content should be hidden from public view
 */
export function isContentHidden(data: Record<string, unknown>): boolean {
  // Boolean flags
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
export function isContentFlagged(data: Record<string, unknown>): boolean {
  const status = data.status as string | undefined;
  const moderationStatus = data.moderationStatus as string | undefined;

  if (status === 'flagged' || moderationStatus === 'flagged' || moderationStatus === 'pending_review') {
    // Only flagged if not already hidden
    return !isContentHidden(data);
  }

  // Check for flag count
  const flagCount = data.flagCount as number | undefined;
  if (flagCount && flagCount > 0) {
    return !isContentHidden(data);
  }

  return false;
}

/**
 * Check if content is pending review
 *
 * @param data - The document data to check
 * @returns true if content needs moderation review
 */
export function isContentPendingReview(data: Record<string, unknown>): boolean {
  const moderationStatus = data.moderationStatus as string | undefined;
  return moderationStatus === 'pending_review';
}

/**
 * Filter an array of documents to exclude hidden content
 *
 * @param items - Array of document data
 * @returns Filtered array with hidden content removed
 */
export function filterHiddenContent<T extends Record<string, unknown>>(items: T[]): T[] {
  return items.filter(item => !isContentHidden(item));
}

/**
 * Get moderation status for display
 *
 * @param data - The document data
 * @returns Human-readable moderation status
 */
export function getModerationStatus(data: Record<string, unknown>): ModerationStatus {
  if (data.isDeleted === true) return 'removed';
  if (data.isHidden === true) return 'hidden';

  const status = data.status as string | undefined;
  if (status === 'removed') return 'removed';
  if (status === 'hidden') return 'hidden';
  if (status === 'flagged') return 'flagged';

  const moderationStatus = data.moderationStatus as string | undefined;
  if (moderationStatus === 'removed') return 'removed';
  if (moderationStatus === 'hidden') return 'hidden';
  if (moderationStatus === 'flagged') return 'flagged';
  if (moderationStatus === 'pending_review') return 'pending_review';

  return 'visible';
}

/**
 * Content types that can be moderated
 */
export type ModerableContentType = 'post' | 'comment' | 'event' | 'space' | 'user';

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
  previousStatus: ModerationStatus;
  newStatus: ModerationStatus;
  moderatorId: string;
  timestamp: string;
  reason?: string;
}

/**
 * Build moderation update data for Firestore
 *
 * @param action - The moderation action to perform
 * @param moderatorId - ID of the user performing the action
 * @param reason - Optional reason for the action
 * @returns Object to merge into Firestore update
 */
export function buildModerationUpdate(
  action: ModerationAction,
  moderatorId: string,
  reason?: string
): Record<string, unknown> {
  const timestamp = new Date().toISOString();
  const base: Record<string, unknown> = {
    updatedAt: new Date(),
    lastModeratedAt: timestamp,
    lastModeratedBy: moderatorId,
  };

  if (reason) {
    base.moderationReason = reason;
  }

  switch (action) {
    case 'hide':
      return {
        ...base,
        isHidden: true,
        moderationStatus: 'hidden',
        hiddenAt: timestamp,
        hiddenBy: moderatorId,
      };
    case 'unhide':
      return {
        ...base,
        isHidden: false,
        moderationStatus: 'visible',
        unhiddenAt: timestamp,
        unhiddenBy: moderatorId,
      };
    case 'remove':
      return {
        ...base,
        isDeleted: true,
        moderationStatus: 'removed',
        deletedAt: timestamp,
        deletedBy: moderatorId,
      };
    case 'restore':
      return {
        ...base,
        isDeleted: false,
        isHidden: false,
        moderationStatus: 'visible',
        restoredAt: timestamp,
        restoredBy: moderatorId,
      };
    case 'flag':
      return {
        ...base,
        moderationStatus: 'flagged',
        flaggedAt: timestamp,
        flaggedBy: moderatorId,
      };
    case 'unflag':
      return {
        ...base,
        moderationStatus: 'visible',
        unflaggedAt: timestamp,
        unflaggedBy: moderatorId,
      };
    case 'approve':
      return {
        ...base,
        moderationStatus: 'visible',
        approvedAt: timestamp,
        approvedBy: moderatorId,
      };
    default:
      return base;
  }
}
