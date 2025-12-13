/**
 * ViewerContext Value Object
 *
 * Represents the context of who is viewing content, used for permission checks.
 * Encapsulates viewer identity, permissions, and relationships.
 *
 * Usage:
 * - Pass to visibility checks: contentVisibility.canView(viewerContext)
 * - Pass to privacy checks: profilePrivacy.canViewField(viewerContext)
 * - Pass to ghost mode checks: GhostModeService.shouldHide(user, viewerContext)
 */

import { ValueObject } from '../base/ValueObject.base';

export type ViewerType = 'anonymous' | 'authenticated' | 'connection' | 'admin' | 'moderator';

interface ViewerContextProps {
  userId: string | null;
  campusId: string;
  type: ViewerType;
  isAdmin: boolean;
  isModerator: boolean;
  connectionIds: string[];
  memberOfSpaceIds: string[];
}

export class ViewerContext extends ValueObject<ViewerContextProps> {
  get userId(): string | null {
    return this.props.userId;
  }

  get campusId(): string {
    return this.props.campusId;
  }

  get type(): ViewerType {
    return this.props.type;
  }

  get isAdmin(): boolean {
    return this.props.isAdmin;
  }

  get isModerator(): boolean {
    return this.props.isModerator;
  }

  get connectionIds(): string[] {
    return this.props.connectionIds;
  }

  get memberOfSpaceIds(): string[] {
    return this.props.memberOfSpaceIds;
  }

  get isAuthenticated(): boolean {
    return this.props.userId !== null;
  }

  private constructor(props: ViewerContextProps) {
    super(props);
  }

  /**
   * Create an anonymous viewer context (not logged in)
   */
  public static anonymous(campusId: string): ViewerContext {
    return new ViewerContext({
      userId: null,
      campusId,
      type: 'anonymous',
      isAdmin: false,
      isModerator: false,
      connectionIds: [],
      memberOfSpaceIds: []
    });
  }

  /**
   * Create an authenticated viewer context
   */
  public static authenticated(params: {
    userId: string;
    campusId: string;
    isAdmin?: boolean;
    isModerator?: boolean;
    connectionIds?: string[];
    memberOfSpaceIds?: string[];
  }): ViewerContext {
    const isAdmin = params.isAdmin ?? false;
    const isModerator = params.isModerator ?? false;

    let type: ViewerType = 'authenticated';
    if (isAdmin) {
      type = 'admin';
    } else if (isModerator) {
      type = 'moderator';
    }

    return new ViewerContext({
      userId: params.userId,
      campusId: params.campusId,
      type,
      isAdmin,
      isModerator,
      connectionIds: params.connectionIds ?? [],
      memberOfSpaceIds: params.memberOfSpaceIds ?? []
    });
  }

  /**
   * Create from API request auth context
   *
   * This is the common factory for API routes
   */
  public static fromAuthContext(authContext: {
    userId: string;
    campusId?: string;
    isAdmin?: boolean;
  }, options?: {
    connectionIds?: string[];
    memberOfSpaceIds?: string[];
  }): ViewerContext {
    return ViewerContext.authenticated({
      userId: authContext.userId,
      campusId: authContext.campusId ?? 'ub-buffalo', // Default campus
      isAdmin: authContext.isAdmin,
      connectionIds: options?.connectionIds,
      memberOfSpaceIds: options?.memberOfSpaceIds
    });
  }

  /**
   * Check if this viewer is connected to a specific user
   */
  public isConnectedTo(userId: string): boolean {
    return this.props.connectionIds.includes(userId);
  }

  /**
   * Check if this viewer is a member of a specific space
   */
  public isMemberOf(spaceId: string): boolean {
    return this.props.memberOfSpaceIds.includes(spaceId);
  }

  /**
   * Check if this viewer can see content from a specific user based on privacy
   *
   * @param contentOwnerId - The user who owns the content
   * @param privacyLevel - The content's privacy setting
   */
  public canViewUserContent(
    contentOwnerId: string,
    privacyLevel: 'public' | 'campus_only' | 'connections_only' | 'private'
  ): boolean {
    // Admin can see everything
    if (this.props.isAdmin) {
      return true;
    }

    // Owner can always see their own content
    if (this.props.userId === contentOwnerId) {
      return true;
    }

    switch (privacyLevel) {
      case 'public':
        return true;

      case 'campus_only':
        // Must be authenticated (campus isolation is handled separately)
        return this.isAuthenticated;

      case 'connections_only':
        return this.isConnectedTo(contentOwnerId);

      case 'private':
        return false;

      default:
        return false;
    }
  }

  /**
   * Check if this viewer can view private space content
   */
  public canViewPrivateSpace(spaceId: string): boolean {
    if (this.props.isAdmin) {
      return true;
    }
    return this.isMemberOf(spaceId);
  }

  /**
   * Check if this viewer can moderate content
   */
  public canModerateContent(): boolean {
    return this.props.isAdmin || this.props.isModerator;
  }

  /**
   * Check if this viewer can view moderated (hidden) content
   */
  public canViewHiddenContent(): boolean {
    return this.props.isAdmin || this.props.isModerator;
  }

  /**
   * Check if this viewer can view deleted content
   */
  public canViewDeletedContent(): boolean {
    return this.props.isAdmin;
  }

  /**
   * Get the effective viewer type for a specific content owner
   *
   * Used with ProfilePrivacy.canViewProfile()
   */
  public getRelationshipTo(contentOwnerId: string): 'public' | 'campus' | 'connection' {
    if (!this.isAuthenticated) {
      return 'public';
    }

    if (this.isConnectedTo(contentOwnerId)) {
      return 'connection';
    }

    // If authenticated, they're at least campus level
    return 'campus';
  }

  /**
   * Create a new context with additional connections
   */
  public withConnections(connectionIds: string[]): ViewerContext {
    return new ViewerContext({
      ...this.props,
      connectionIds: [...new Set([...this.props.connectionIds, ...connectionIds])]
    });
  }

  /**
   * Create a new context with additional space memberships
   */
  public withSpaceMemberships(spaceIds: string[]): ViewerContext {
    return new ViewerContext({
      ...this.props,
      memberOfSpaceIds: [...new Set([...this.props.memberOfSpaceIds, ...spaceIds])]
    });
  }
}
