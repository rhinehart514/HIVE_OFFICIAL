/**
 * ContentVisibility Value Object
 *
 * Represents the visibility/moderation status of any content in the system.
 * This is the single source of truth for determining if content should be shown.
 *
 * Usage:
 * - Posts, comments, events, spaces all use this for consistent visibility checks
 * - Encapsulates all moderation-related fields (isHidden, isDeleted, status, moderationStatus)
 * - Provides factory methods for common states
 */

import { Result } from '../base/Result';
import { ValueObject } from '../base/ValueObject.base';

/**
 * Possible visibility statuses for content
 */
export enum VisibilityStatus {
  VISIBLE = 'visible',
  HIDDEN = 'hidden',
  DELETED = 'deleted',
  PENDING_REVIEW = 'pending_review',
  FLAGGED = 'flagged'
}

interface ContentVisibilityProps {
  status: VisibilityStatus;
  reason?: string;
  moderatedAt?: Date;
  moderatedBy?: string;
}

export class ContentVisibility extends ValueObject<ContentVisibilityProps> {
  get status(): VisibilityStatus {
    return this.props.status;
  }

  get reason(): string | undefined {
    return this.props.reason;
  }

  get moderatedAt(): Date | undefined {
    return this.props.moderatedAt;
  }

  get moderatedBy(): string | undefined {
    return this.props.moderatedBy;
  }

  private constructor(props: ContentVisibilityProps) {
    super(props);
  }

  /**
   * Create a ContentVisibility from raw data
   */
  public static create(props: Partial<ContentVisibilityProps>): Result<ContentVisibility> {
    const status = props.status ?? VisibilityStatus.VISIBLE;

    // Validate status
    if (!Object.values(VisibilityStatus).includes(status)) {
      return Result.fail<ContentVisibility>(`Invalid visibility status: ${status}`);
    }

    return Result.ok<ContentVisibility>(new ContentVisibility({
      status,
      reason: props.reason,
      moderatedAt: props.moderatedAt,
      moderatedBy: props.moderatedBy
    }));
  }

  /**
   * Create a visible content state
   */
  public static visible(): ContentVisibility {
    return new ContentVisibility({ status: VisibilityStatus.VISIBLE });
  }

  /**
   * Create a hidden content state
   */
  public static hidden(reason: string, moderatedBy: string): ContentVisibility {
    return new ContentVisibility({
      status: VisibilityStatus.HIDDEN,
      reason,
      moderatedBy,
      moderatedAt: new Date()
    });
  }

  /**
   * Create a deleted content state
   */
  public static deleted(moderatedBy?: string): ContentVisibility {
    return new ContentVisibility({
      status: VisibilityStatus.DELETED,
      moderatedBy,
      moderatedAt: new Date()
    });
  }

  /**
   * Create a pending review state
   */
  public static pendingReview(reason?: string): ContentVisibility {
    return new ContentVisibility({
      status: VisibilityStatus.PENDING_REVIEW,
      reason,
      moderatedAt: new Date()
    });
  }

  /**
   * Create a flagged state
   */
  public static flagged(reason: string, flaggedBy: string): ContentVisibility {
    return new ContentVisibility({
      status: VisibilityStatus.FLAGGED,
      reason,
      moderatedBy: flaggedBy,
      moderatedAt: new Date()
    });
  }

  /**
   * Create from Firestore document data
   *
   * This handles the various field names used across the codebase:
   * - isHidden, isDeleted (boolean flags)
   * - status (string: 'hidden', 'removed', 'flagged')
   * - moderationStatus (string: 'visible', 'hidden', 'removed', 'pending_review')
   */
  public static fromFirestoreData(data: Record<string, unknown>): ContentVisibility {
    // Check boolean flags first (most direct indication)
    if (data.isDeleted === true) {
      return ContentVisibility.deleted(data.deletedBy as string | undefined);
    }

    if (data.isHidden === true) {
      return new ContentVisibility({
        status: VisibilityStatus.HIDDEN,
        reason: data.hiddenReason as string | undefined ?? data.moderationReason as string | undefined,
        moderatedBy: data.hiddenBy as string | undefined,
        moderatedAt: data.hiddenAt ? new Date(data.hiddenAt as string) : undefined
      });
    }

    // Check string status fields
    const status = data.status as string | undefined;
    const moderationStatus = data.moderationStatus as string | undefined;

    if (status === 'removed' || moderationStatus === 'removed') {
      return ContentVisibility.deleted(data.deletedBy as string | undefined);
    }

    if (status === 'hidden' || moderationStatus === 'hidden') {
      return new ContentVisibility({
        status: VisibilityStatus.HIDDEN,
        reason: data.moderationReason as string | undefined,
        moderatedBy: data.lastModeratedBy as string | undefined,
        moderatedAt: data.lastModeratedAt ? new Date(data.lastModeratedAt as string) : undefined
      });
    }

    if (status === 'flagged' || moderationStatus === 'flagged') {
      return new ContentVisibility({
        status: VisibilityStatus.FLAGGED,
        reason: data.moderationReason as string | undefined,
        moderatedBy: data.flaggedBy as string | undefined,
        moderatedAt: data.flaggedAt ? new Date(data.flaggedAt as string) : undefined
      });
    }

    if (moderationStatus === 'pending_review') {
      return ContentVisibility.pendingReview(data.moderationReason as string | undefined);
    }

    // Default to visible
    return ContentVisibility.visible();
  }

  /**
   * Check if content is visible to general users
   */
  public isVisible(): boolean {
    return this.props.status === VisibilityStatus.VISIBLE;
  }

  /**
   * Check if content is hidden (but not deleted)
   */
  public isHidden(): boolean {
    return this.props.status === VisibilityStatus.HIDDEN;
  }

  /**
   * Check if content is deleted
   */
  public isDeleted(): boolean {
    return this.props.status === VisibilityStatus.DELETED;
  }

  /**
   * Check if content is flagged for review
   */
  public isFlagged(): boolean {
    return this.props.status === VisibilityStatus.FLAGGED;
  }

  /**
   * Check if content is pending moderation review
   */
  public isPendingReview(): boolean {
    return this.props.status === VisibilityStatus.PENDING_REVIEW;
  }

  /**
   * Check if content should be hidden from public view
   * This is the primary check used across API routes
   */
  public shouldHideFromPublic(): boolean {
    return this.props.status !== VisibilityStatus.VISIBLE;
  }

  /**
   * Check if a moderator can see this content
   * Moderators can see hidden/flagged content but not deleted
   */
  public canModeratorView(): boolean {
    return this.props.status !== VisibilityStatus.DELETED;
  }

  /**
   * Check if an admin can see this content
   * Admins can see everything including deleted content
   */
  public canAdminView(): boolean {
    return true;
  }

  /**
   * Convert to Firestore-compatible object for updates
   */
  public toFirestoreUpdate(moderatorId: string): Record<string, unknown> {
    const timestamp = new Date().toISOString();
    const base: Record<string, unknown> = {
      updatedAt: new Date(),
      lastModeratedAt: timestamp,
      lastModeratedBy: moderatorId
    };

    if (this.props.reason) {
      base.moderationReason = this.props.reason;
    }

    switch (this.props.status) {
      case VisibilityStatus.VISIBLE:
        return {
          ...base,
          isHidden: false,
          isDeleted: false,
          moderationStatus: 'visible'
        };
      case VisibilityStatus.HIDDEN:
        return {
          ...base,
          isHidden: true,
          moderationStatus: 'hidden',
          hiddenAt: timestamp,
          hiddenBy: moderatorId
        };
      case VisibilityStatus.DELETED:
        return {
          ...base,
          isDeleted: true,
          moderationStatus: 'removed',
          deletedAt: timestamp,
          deletedBy: moderatorId
        };
      case VisibilityStatus.FLAGGED:
        return {
          ...base,
          moderationStatus: 'flagged',
          flaggedAt: timestamp,
          flaggedBy: moderatorId
        };
      case VisibilityStatus.PENDING_REVIEW:
        return {
          ...base,
          moderationStatus: 'pending_review'
        };
      default:
        return base;
    }
  }
}
