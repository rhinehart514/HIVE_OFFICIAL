/**
 * SpaceManagementService
 *
 * Application service for space administration, permission management,
 * and leader request handling. Complements SpaceDiscoveryService.
 */

import { BaseApplicationService, ApplicationServiceContext, ServiceResult } from './base.service';
import { Result } from '../domain/shared/base/Result';
import { EnhancedSpace, SpaceMemberRole } from '../domain/spaces/aggregates/enhanced-space';
import { SpaceId } from '../domain/spaces/value-objects/space-id.value';
import { SpaceName } from '../domain/spaces/value-objects/space-name.value';
import { SpaceSlug } from '../domain/spaces/value-objects/space-slug.value';
import { SpaceDescription } from '../domain/spaces/value-objects/space-description.value';
import { SpaceCategory } from '../domain/spaces/value-objects/space-category.value';
import { CampusId } from '../domain/profile/value-objects/campus-id.value';
import { ProfileId } from '../domain/profile/value-objects/profile-id.value';
import { ISpaceRepository } from '../infrastructure/repositories/interfaces';
import { DomainEventPublisher, getDomainEventPublisher, createLoggingEventHandler } from '../infrastructure/events';
import {
  SpaceCreatedEvent,
  SpaceMemberJoinedEvent,
  SpaceMemberLeftEvent
} from '../domain/spaces/events';

/**
 * Interface for space member persistence (for cross-collection writes)
 */
export interface SpaceMemberData {
  spaceId: string;
  userId: string;
  campusId: string;
  role: SpaceMemberRole;
  joinedAt: Date;
  isActive: boolean;
  permissions: string[];
  joinMethod: 'created' | 'manual' | 'invite' | 'approval' | 'auto';
}

/**
 * Callback for persisting space members (injected by caller)
 */
export type SaveSpaceMemberFn = (member: SpaceMemberData) => Promise<Result<void>>;

/**
 * Callback for updating space members
 */
export type UpdateSpaceMemberFn = (
  spaceId: string,
  userId: string,
  updates: Partial<SpaceMemberData> & { isActive?: boolean; leftAt?: Date; removedAt?: Date; removedBy?: string }
) => Promise<Result<void>>;

/**
 * Callback for finding existing membership
 */
export type FindSpaceMemberFn = (
  spaceId: string,
  userId: string
) => Promise<Result<SpaceMemberData | null>>;

/**
 * Callback for updating space metrics
 */
export type UpdateSpaceMetricsFn = (
  spaceId: string,
  metrics: { memberCountDelta?: number; activeCountDelta?: number }
) => Promise<Result<void>>;

/**
 * Input for joining a space
 */
export interface JoinSpaceInput {
  spaceId: string;
  joinMethod: 'manual' | 'invite' | 'approval' | 'auto';
  inviteCode?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Result of joining a space
 */
export interface JoinSpaceResult {
  spaceId: string;
  spaceName: string;
  role: SpaceMemberRole;
  isReactivation: boolean;
}

/**
 * Input for leaving a space
 */
export interface LeaveSpaceInput {
  spaceId: string;
}

/**
 * Result of leaving a space
 */
export interface LeaveSpaceResult {
  spaceId: string;
  spaceName: string;
  previousRole: SpaceMemberRole;
}

/**
 * Input for inviting a member
 */
export interface InviteMemberInput {
  spaceId: string;
  targetUserId: string;
  role: SpaceMemberRole;
}

/**
 * Input for removing a member
 */
export interface RemoveMemberInput {
  spaceId: string;
  targetUserId: string;
  reason?: string;
}

/**
 * Data for creating a new space with slug enforcement
 */
export interface CreateSpaceInput {
  name: string;
  description: string;
  category: string;
  visibility: 'public' | 'private';
  settings?: {
    allowInvites?: boolean;
    requireApproval?: boolean;
    allowRSS?: boolean;
    maxMembers?: number;
  };
  rssUrl?: string;
}

/**
 * Result of space creation including generated slug
 */
export interface CreateSpaceResult {
  space: EnhancedSpace;
  slug: string;
}

/**
 * Data for submitting a leader request
 */
export interface LeaderRequestInput {
  spaceId: string;
  reason?: string;
}

/**
 * Result of leader request submission
 */
export interface LeaderRequestResult {
  requestId: string;
  status: 'pending';
  spaceId: string;
  spaceName: string;
  submittedAt: Date;
}

/**
 * Data for leader request decision
 */
export interface LeaderRequestDecision {
  requestId: string;
  spaceId: string;
  requesterUserId: string;
  decision: 'approve' | 'reject';
  reason?: string;
}

/**
 * Result of leader request decision
 */
export interface LeaderRequestDecisionResult {
  requestId: string;
  spaceId: string;
  requesterUserId: string;
  decision: 'approved' | 'rejected';
  newRole?: SpaceMemberRole;
  reason?: string;
}

/**
 * Role change request
 */
export interface RoleChangeInput {
  spaceId: string;
  targetUserId: string;
  newRole: SpaceMemberRole;
}

/**
 * Ownership transfer request
 */
export interface OwnershipTransferInput {
  spaceId: string;
  newOwnerId: string;
}

// ============================================================
// Tab & Widget Management Input Types (Phase 2 - DDD Foundation)
// ============================================================

/**
 * Input for adding a tab to a space
 */
export interface AddTabInput {
  spaceId: string;
  name: string;
  type: 'feed' | 'widget' | 'resource' | 'custom';
  order?: number;
  isVisible?: boolean;
}

/**
 * Input for updating a tab
 */
export interface UpdateTabInput {
  spaceId: string;
  tabId: string;
  name?: string;
  order?: number;
  isVisible?: boolean;
}

/**
 * Input for removing a tab
 */
export interface RemoveTabInput {
  spaceId: string;
  tabId: string;
}

/**
 * Input for reordering tabs
 */
export interface ReorderTabsInput {
  spaceId: string;
  orderedTabIds: string[];
}

/**
 * Input for adding a widget to a space
 */
export interface AddWidgetInput {
  spaceId: string;
  type: 'calendar' | 'poll' | 'links' | 'files' | 'rss' | 'custom';
  title: string;
  config?: Record<string, any>;
  order?: number;
  position?: { x: number; y: number; width: number; height: number };
}

/**
 * Input for updating a widget
 */
export interface UpdateWidgetInput {
  spaceId: string;
  widgetId: string;
  title?: string;
  config?: Record<string, any>;
  order?: number;
  isVisible?: boolean;
  isEnabled?: boolean;
}

/**
 * Input for removing a widget
 */
export interface RemoveWidgetInput {
  spaceId: string;
  widgetId: string;
}

/**
 * Input for attaching/detaching widget to/from tab
 */
export interface WidgetTabInput {
  spaceId: string;
  widgetId: string;
  tabId: string;
}

/**
 * Input for updating space basic info (for PATCH refactor)
 */
export interface UpdateSpaceInput {
  spaceId: string;
  name?: string;
  description?: string;
  visibility?: 'public' | 'private';
  settings?: {
    allowInvites?: boolean;
    requireApproval?: boolean;
    allowRSS?: boolean;
    maxMembers?: number;
  };
}

/**
 * Result of tab operations
 */
export interface TabOperationResult {
  tabId: string;
  name: string;
  type: string;
}

/**
 * Result of widget operations
 */
export interface WidgetOperationResult {
  widgetId: string;
  title: string;
  type: string;
}

/**
 * Suspend member input
 */
export interface SuspendMemberInput {
  spaceId: string;
  targetUserId: string;
  reason?: string;
}

/**
 * Suspend member result
 */
export interface SuspendMemberResult {
  spaceId: string;
  userId: string;
  action: 'suspended' | 'unsuspended';
  reason?: string;
}

export class SpaceManagementService extends BaseApplicationService {
  private spaceRepo: ISpaceRepository;
  private saveSpaceMember?: SaveSpaceMemberFn;
  private updateSpaceMember?: UpdateSpaceMemberFn;
  private findSpaceMember?: FindSpaceMemberFn;
  private updateSpaceMetrics?: UpdateSpaceMetricsFn;
  private eventPublisher: DomainEventPublisher;

  constructor(
    context?: Partial<ApplicationServiceContext>,
    spaceRepo?: ISpaceRepository,
    callbacks?: {
      saveSpaceMember?: SaveSpaceMemberFn;
      updateSpaceMember?: UpdateSpaceMemberFn;
      findSpaceMember?: FindSpaceMemberFn;
      updateSpaceMetrics?: UpdateSpaceMetricsFn;
    },
    eventPublisher?: DomainEventPublisher
  ) {
    super(context);
    this.spaceRepo = spaceRepo || {} as ISpaceRepository;
    this.saveSpaceMember = callbacks?.saveSpaceMember;
    this.updateSpaceMember = callbacks?.updateSpaceMember;
    this.findSpaceMember = callbacks?.findSpaceMember;
    this.updateSpaceMetrics = callbacks?.updateSpaceMetrics;
    this.eventPublisher = eventPublisher || getDomainEventPublisher();

    // Register logging handler for audit trail (only once per publisher instance)
    const loggingHandler = createLoggingEventHandler();
    this.eventPublisher.registerHandler(loggingHandler);
  }

  /**
   * Publish domain events from a space aggregate after successful save
   * This should be called after every successful spaceRepo.save()
   */
  private async publishEvents(space: EnhancedSpace): Promise<void> {
    try {
      await this.eventPublisher.publishEventsFromAggregate(space);
    } catch (_error) {
      // Event publishing is non-critical - don't fail the main operation
    }
  }

  /**
   * Set the space member callbacks (for dependency injection)
   */
  setCallbacks(callbacks: {
    saveSpaceMember?: SaveSpaceMemberFn;
    updateSpaceMember?: UpdateSpaceMemberFn;
    findSpaceMember?: FindSpaceMemberFn;
    updateSpaceMetrics?: UpdateSpaceMetricsFn;
  }): void {
    if (callbacks.saveSpaceMember) this.saveSpaceMember = callbacks.saveSpaceMember;
    if (callbacks.updateSpaceMember) this.updateSpaceMember = callbacks.updateSpaceMember;
    if (callbacks.findSpaceMember) this.findSpaceMember = callbacks.findSpaceMember;
    if (callbacks.updateSpaceMetrics) this.updateSpaceMetrics = callbacks.updateSpaceMetrics;
  }

  /**
   * Set the space member save function (for dependency injection) - legacy
   */
  setSaveSpaceMemberFn(fn: SaveSpaceMemberFn): void {
    this.saveSpaceMember = fn;
  }

  /**
   * Create a new space with unique slug generation
   */
  async createSpace(
    creatorId: string,
    input: CreateSpaceInput
  ): Promise<Result<ServiceResult<CreateSpaceResult>>> {
    return this.execute(async () => {
      // Validate creator ID
      const creatorProfileIdResult = ProfileId.create(creatorId);
      if (creatorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<CreateSpaceResult>>(creatorProfileIdResult.error!);
      }
      const creatorProfileId = creatorProfileIdResult.getValue();

      // Create value objects
      const nameResult = SpaceName.create(input.name);
      if (nameResult.isFailure) {
        return Result.fail<ServiceResult<CreateSpaceResult>>(nameResult.error!);
      }

      const descriptionResult = SpaceDescription.create(input.description);
      if (descriptionResult.isFailure) {
        return Result.fail<ServiceResult<CreateSpaceResult>>(descriptionResult.error!);
      }

      const categoryResult = SpaceCategory.create(input.category);
      if (categoryResult.isFailure) {
        return Result.fail<ServiceResult<CreateSpaceResult>>(categoryResult.error!);
      }

      const campusIdResult = CampusId.create(this.context.campusId);
      if (campusIdResult.isFailure) {
        return Result.fail<ServiceResult<CreateSpaceResult>>(campusIdResult.error!);
      }

      // Generate unique slug
      const slugResult = await this.generateUniqueSlug(input.name);
      if (slugResult.isFailure) {
        return Result.fail<ServiceResult<CreateSpaceResult>>(slugResult.error!);
      }
      const slug = slugResult.getValue();

      // Generate space ID
      const spaceIdResult = SpaceId.create(
        `space_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      );
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<CreateSpaceResult>>(spaceIdResult.error!);
      }

      // Create space with slug
      const spaceResult = EnhancedSpace.create({
        spaceId: spaceIdResult.getValue(),
        name: nameResult.getValue(),
        slug,
        description: descriptionResult.getValue(),
        category: categoryResult.getValue(),
        campusId: campusIdResult.getValue(),
        createdBy: creatorProfileId,
        visibility: input.visibility,
        settings: {
          allowInvites: input.settings?.allowInvites ?? true,
          requireApproval: input.settings?.requireApproval ?? false,
          allowRSS: input.settings?.allowRSS ?? false,
          maxMembers: input.settings?.maxMembers
        },
        rssUrl: input.rssUrl
      });

      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<CreateSpaceResult>>(spaceResult.error!);
      }

      const space = spaceResult.getValue();

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<CreateSpaceResult>>(saveResult.error!);
      }

      // Emit SpaceCreated event
      const spaceCreatedEvent = new SpaceCreatedEvent(
        space.spaceId.value,
        space.name.value,
        slug.value,
        categoryResult.getValue().value,
        creatorId,
        this.context.campusId
      );
      await this.eventPublisher.publish(spaceCreatedEvent);

      // Publish domain events from aggregate
      await this.publishEvents(space);

      // Save creator as owner in spaceMembers collection (if callback provided)
      if (this.saveSpaceMember) {
        const memberResult = await this.saveSpaceMember({
          spaceId: space.spaceId.value,
          userId: creatorId,
          campusId: this.context.campusId,
          role: 'owner',
          joinedAt: new Date(),
          isActive: true,
          permissions: ['admin', 'moderate', 'post', 'invite'],
          joinMethod: 'created'
        });

        if (memberResult.isFailure) {
          // Non-critical - space was created, member can be fixed via reconciliation
        }
      }

      return Result.ok<ServiceResult<CreateSpaceResult>>({
        data: {
          space,
          slug: slug.value
        }
      });
    }, 'SpaceManagement.createSpace');
  }

  /**
   * Join a space as a member
   * Handles both new joins and reactivation of inactive memberships
   */
  async joinSpace(
    userId: string,
    input: JoinSpaceInput
  ): Promise<Result<ServiceResult<JoinSpaceResult>>> {
    return this.execute(async () => {
      // Validate user
      const userProfileIdResult = ProfileId.create(userId);
      if (userProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<JoinSpaceResult>>(userProfileIdResult.error!);
      }
      const userProfileId = userProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<JoinSpaceResult>>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<JoinSpaceResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check for existing membership
      let isReactivation = false;
      if (this.findSpaceMember) {
        const existingResult = await this.findSpaceMember(input.spaceId, userId);
        if (existingResult.isSuccess) {
          const existing = existingResult.getValue();
          if (existing) {
            if (existing.isActive) {
              return Result.fail<ServiceResult<JoinSpaceResult>>('Already a member of this space');
            }
            // Reactivate existing membership
            isReactivation = true;
            if (this.updateSpaceMember) {
              const updateResult = await this.updateSpaceMember(input.spaceId, userId, {
                isActive: true,
                joinedAt: new Date(),
                joinMethod: input.joinMethod,
                permissions: ['post']
              });
              if (updateResult.isFailure) {
                return Result.fail<ServiceResult<JoinSpaceResult>>(`Failed to reactivate membership: ${updateResult.error}`);
              }
            }
          }
        }
      }

      // If not reactivation, add as new member
      if (!isReactivation) {
        // Use aggregate to add member (validates business rules)
        const addResult = space.addMember(userProfileId, 'member');
        if (addResult.isFailure) {
          return Result.fail<ServiceResult<JoinSpaceResult>>(addResult.error!);
        }

        // Save to spaceMembers collection
        if (this.saveSpaceMember) {
          const memberResult = await this.saveSpaceMember({
            spaceId: input.spaceId,
            userId,
            campusId: this.context.campusId,
            role: 'member',
            joinedAt: new Date(),
            isActive: true,
            permissions: ['post'],
            joinMethod: input.joinMethod
          });

          if (memberResult.isFailure) {
            return Result.fail<ServiceResult<JoinSpaceResult>>(`Failed to save membership: ${memberResult.error}`);
          }
        }

        // Save aggregate (updates member count, etc.)
        const saveResult = await this.spaceRepo.save(space);
        if (saveResult.isFailure) {
          // Non-critical - member was saved, aggregate update can be reconciled
        }
      }

      // Update space metrics
      if (this.updateSpaceMetrics) {
        await this.updateSpaceMetrics(input.spaceId, {
          memberCountDelta: 1,
          activeCountDelta: 1
        });
      }

      // Emit SpaceMemberJoined event
      const memberJoinedEvent = new SpaceMemberJoinedEvent(
        input.spaceId,
        userId,
        space.name.value,
        'member',
        input.joinMethod,
        isReactivation
      );
      await this.eventPublisher.publish(memberJoinedEvent);

      return Result.ok<ServiceResult<JoinSpaceResult>>({
        data: {
          spaceId: input.spaceId,
          spaceName: space.name.value,
          role: 'member',
          isReactivation
        }
      });
    }, 'SpaceManagement.joinSpace');
  }

  /**
   * Leave a space
   * Soft-deletes membership (marks as inactive)
   */
  async leaveSpace(
    userId: string,
    input: LeaveSpaceInput
  ): Promise<Result<ServiceResult<LeaveSpaceResult>>> {
    return this.execute(async () => {
      // Validate user
      const userProfileIdResult = ProfileId.create(userId);
      if (userProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>(userProfileIdResult.error!);
      }
      const userProfileId = userProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Get current role before leaving
      const currentRoleValue = space.getMemberRole(userProfileId);
      if (!currentRoleValue) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>('Not a member of this space');
      }
      const currentRole: SpaceMemberRole = currentRoleValue as SpaceMemberRole;

      // Check if owner trying to leave without transferring
      if (currentRole === 'owner') {
        // Check for other owners
        const owners = space.members.filter(m => m.role === 'owner');
        if (owners.length <= 1) {
          return Result.fail<ServiceResult<LeaveSpaceResult>>(
            'Cannot leave space: You are the only owner. Transfer ownership first.'
          );
        }
      }

      // Use aggregate to remove member
      const removeResult = space.removeMember(userProfileId);
      if (removeResult.isFailure) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>(removeResult.error!);
      }

      // Update spaceMembers collection
      if (this.updateSpaceMember) {
        const updateResult = await this.updateSpaceMember(input.spaceId, userId, {
          isActive: false,
          leftAt: new Date()
        });
        if (updateResult.isFailure) {
          // Non-critical - aggregate updated, membership update can be reconciled
        }
      }

      // Save aggregate
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        // Non-critical - member was updated, aggregate update can be reconciled
      }

      // Update space metrics
      if (this.updateSpaceMetrics) {
        await this.updateSpaceMetrics(input.spaceId, {
          memberCountDelta: -1,
          activeCountDelta: -1
        });
      }

      // Emit SpaceMemberLeft event
      const memberLeftEvent = new SpaceMemberLeftEvent(
        input.spaceId,
        userId,
        space.name.value,
        currentRole
      );
      await this.eventPublisher.publish(memberLeftEvent);

      return Result.ok<ServiceResult<LeaveSpaceResult>>({
        data: {
          spaceId: input.spaceId,
          spaceName: space.name.value,
          previousRole: currentRole
        }
      });
    }, 'SpaceManagement.leaveSpace');
  }

  /**
   * Invite a user to join a space with a specific role
   */
  async inviteMember(
    inviterId: string,
    input: InviteMemberInput
  ): Promise<Result<ServiceResult<JoinSpaceResult>>> {
    return this.execute(async () => {
      // Validate inviter
      const inviterProfileIdResult = ProfileId.create(inviterId);
      if (inviterProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<JoinSpaceResult>>(inviterProfileIdResult.error!);
      }
      const inviterProfileId = inviterProfileIdResult.getValue();

      // Validate target
      const targetProfileIdResult = ProfileId.create(input.targetUserId);
      if (targetProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<JoinSpaceResult>>(targetProfileIdResult.error!);
      }
      const targetProfileId = targetProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<JoinSpaceResult>>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<JoinSpaceResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check inviter has permission (must be owner, admin, or moderator)
      if (!space.canManage(inviterProfileId)) {
        return Result.fail<ServiceResult<JoinSpaceResult>>('Insufficient permissions to invite members');
      }

      // Cannot invite as owner
      if (input.role === 'owner') {
        return Result.fail<ServiceResult<JoinSpaceResult>>('Cannot invite as owner. Use transfer ownership instead.');
      }

      // Cannot invite as guest (guest access is automatic for public spaces)
      if (input.role === 'guest') {
        return Result.fail<ServiceResult<JoinSpaceResult>>('Cannot invite as guest. Guests have automatic read access to public spaces.');
      }

      // Determine the role for aggregate (addMember only accepts 'member' or 'moderator')
      // Admin invites: add as member first, then promote
      const aggregateRole: 'member' | 'moderator' = input.role === 'admin' ? 'member' :
        (input.role === 'moderator' ? 'moderator' : 'member');

      // Check for existing membership
      let isReactivation = false;
      if (this.findSpaceMember) {
        const existingResult = await this.findSpaceMember(input.spaceId, input.targetUserId);
        if (existingResult.isSuccess) {
          const existing = existingResult.getValue();
          if (existing) {
            if (existing.isActive) {
              return Result.fail<ServiceResult<JoinSpaceResult>>('User is already a member');
            }
            // Reactivate with new role
            isReactivation = true;
            if (this.updateSpaceMember) {
              await this.updateSpaceMember(input.spaceId, input.targetUserId, {
                isActive: true,
                role: input.role,
                joinedAt: new Date(),
                joinMethod: 'invite',
                permissions: this.getPermissionsForRole(input.role)
              });
            }
          }
        }
      }

      if (!isReactivation) {
        // Add via aggregate with allowed role
        const addResult = space.addMember(targetProfileId, aggregateRole);
        if (addResult.isFailure) {
          return Result.fail<ServiceResult<JoinSpaceResult>>(addResult.error!);
        }

        // If inviting as admin, promote after adding as member
        if (input.role === 'admin') {
          const promoteResult = space.updateMemberRole(targetProfileId, 'admin');
          if (promoteResult.isFailure) {
            // Non-critical - member added, role can be updated separately
          }
        }

        // Save to spaceMembers collection with the actual target role
        if (this.saveSpaceMember) {
          await this.saveSpaceMember({
            spaceId: input.spaceId,
            userId: input.targetUserId,
            campusId: this.context.campusId,
            role: input.role,
            joinedAt: new Date(),
            isActive: true,
            permissions: this.getPermissionsForRole(input.role),
            joinMethod: 'invite'
          });
        }

        // Save aggregate
        await this.spaceRepo.save(space);
      }

      // Update metrics
      if (this.updateSpaceMetrics) {
        await this.updateSpaceMetrics(input.spaceId, {
          memberCountDelta: 1,
          activeCountDelta: 1
        });
      }

      return Result.ok<ServiceResult<JoinSpaceResult>>({
        data: {
          spaceId: input.spaceId,
          spaceName: space.name.value,
          role: input.role,
          isReactivation
        }
      });
    }, 'SpaceManagement.inviteMember');
  }

  /**
   * Remove a member from a space
   */
  async removeMember(
    actorId: string,
    input: RemoveMemberInput
  ): Promise<Result<ServiceResult<LeaveSpaceResult>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>(actorProfileIdResult.error!);
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Validate target
      const targetProfileIdResult = ProfileId.create(input.targetUserId);
      if (targetProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>(targetProfileIdResult.error!);
      }
      const targetProfileId = targetProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check actor has permission
      const actorRole = space.getMemberRole(actorProfileId);
      if (!actorRole || !['owner', 'admin'].includes(actorRole)) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>('Insufficient permissions to remove members');
      }

      // Get target role
      const targetRoleValue = space.getMemberRole(targetProfileId);
      if (!targetRoleValue) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>('Target user is not a member');
      }
      const targetRole: SpaceMemberRole = targetRoleValue as SpaceMemberRole;

      // Cannot remove owner
      if (targetRole === 'owner') {
        return Result.fail<ServiceResult<LeaveSpaceResult>>('Cannot remove space owner');
      }

      // Only owner can remove admins
      if (targetRole === 'admin' && actorRole !== 'owner') {
        return Result.fail<ServiceResult<LeaveSpaceResult>>('Only owners can remove admins');
      }

      // Remove via aggregate
      const removeResult = space.removeMember(targetProfileId);
      if (removeResult.isFailure) {
        return Result.fail<ServiceResult<LeaveSpaceResult>>(removeResult.error!);
      }

      // Update spaceMembers collection
      if (this.updateSpaceMember) {
        await this.updateSpaceMember(input.spaceId, input.targetUserId, {
          isActive: false,
          removedAt: new Date(),
          removedBy: actorId
        });
      }

      // Save aggregate
      await this.spaceRepo.save(space);

      // Update metrics
      if (this.updateSpaceMetrics) {
        await this.updateSpaceMetrics(input.spaceId, {
          memberCountDelta: -1,
          activeCountDelta: -1
        });
      }

      return Result.ok<ServiceResult<LeaveSpaceResult>>({
        data: {
          spaceId: input.spaceId,
          spaceName: space.name.value,
          previousRole: targetRole
        }
      });
    }, 'SpaceManagement.removeMember');
  }

  /**
   * Suspend a member (soft ban - prevents posting but keeps membership)
   */
  async suspendMember(
    actorId: string,
    input: SuspendMemberInput
  ): Promise<Result<ServiceResult<SuspendMemberResult>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<SuspendMemberResult>>(actorProfileIdResult.error!);
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Validate target
      const targetProfileIdResult = ProfileId.create(input.targetUserId);
      if (targetProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<SuspendMemberResult>>(targetProfileIdResult.error!);
      }

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<SuspendMemberResult>>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<SuspendMemberResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check actor has permission (must be owner, admin, or moderator)
      if (!space.canManage(actorProfileId)) {
        return Result.fail<ServiceResult<SuspendMemberResult>>('Insufficient permissions to suspend members');
      }

      // Update spaceMembers collection with suspend fields
      if (this.updateSpaceMember) {
        const updateResult = await this.updateSpaceMember(input.spaceId, input.targetUserId, {
          isActive: true, // Still a member, just suspended
          isSuspended: true,
          suspendedAt: new Date(),
          suspendedBy: actorId,
          suspensionReason: input.reason
        } as Partial<SpaceMemberData> & Record<string, unknown>);
        if (updateResult.isFailure) {
          return Result.fail<ServiceResult<SuspendMemberResult>>(`Failed to suspend member: ${updateResult.error}`);
        }
      }

      return Result.ok<ServiceResult<SuspendMemberResult>>({
        data: {
          spaceId: input.spaceId,
          userId: input.targetUserId,
          action: 'suspended',
          reason: input.reason
        }
      });
    }, 'SpaceManagement.suspendMember');
  }

  /**
   * Unsuspend a member (restore posting privileges)
   */
  async unsuspendMember(
    actorId: string,
    input: SuspendMemberInput
  ): Promise<Result<ServiceResult<SuspendMemberResult>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<SuspendMemberResult>>(actorProfileIdResult.error!);
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Validate target
      const targetProfileIdResult = ProfileId.create(input.targetUserId);
      if (targetProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<SuspendMemberResult>>(targetProfileIdResult.error!);
      }

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<SuspendMemberResult>>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<SuspendMemberResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check actor has permission
      if (!space.canManage(actorProfileId)) {
        return Result.fail<ServiceResult<SuspendMemberResult>>('Insufficient permissions to unsuspend members');
      }

      // Update spaceMembers collection with unsuspend fields
      if (this.updateSpaceMember) {
        const updateResult = await this.updateSpaceMember(input.spaceId, input.targetUserId, {
          isActive: true,
          isSuspended: false,
          unsuspendedAt: new Date(),
          unsuspendedBy: actorId
        } as Partial<SpaceMemberData> & Record<string, unknown>);
        if (updateResult.isFailure) {
          return Result.fail<ServiceResult<SuspendMemberResult>>(`Failed to unsuspend member: ${updateResult.error}`);
        }
      }

      return Result.ok<ServiceResult<SuspendMemberResult>>({
        data: {
          spaceId: input.spaceId,
          userId: input.targetUserId,
          action: 'unsuspended',
          reason: input.reason
        }
      });
    }, 'SpaceManagement.unsuspendMember');
  }

  /**
   * Get permissions array for a given role
   */
  private getPermissionsForRole(role: SpaceMemberRole): string[] {
    switch (role) {
      case 'owner':
        return ['admin', 'moderate', 'post', 'invite'];
      case 'admin':
        return ['admin', 'moderate', 'post', 'invite'];
      case 'moderator':
        return ['moderate', 'post', 'invite'];
      case 'member':
        return ['post'];
      case 'guest':
        return [];
      default:
        return ['post'];
    }
  }

  /**
   * Submit a request to become a leader (admin) of a space
   */
  async requestToLead(
    userId: string,
    input: LeaderRequestInput
  ): Promise<Result<ServiceResult<LeaderRequestResult>>> {
    return this.execute(async () => {
      // Validate user
      const userProfileIdResult = ProfileId.create(userId);
      if (userProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestResult>>(userProfileIdResult.error!);
      }
      const userProfileId = userProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestResult>>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Submit request via aggregate
      const requestResult = space.requestToLead(userProfileId, input.reason);
      if (requestResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestResult>>(requestResult.error!);
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestResult>>(saveResult.error!);
      }

      // Generate request ID
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return Result.ok<ServiceResult<LeaderRequestResult>>({
        data: {
          requestId,
          status: 'pending',
          spaceId: input.spaceId,
          spaceName: space.name.value,
          submittedAt: new Date()
        }
      });
    }, 'SpaceManagement.requestToLead');
  }

  /**
   * Approve or reject a leader request
   */
  async decideLeaderRequest(
    deciderId: string,
    decision: LeaderRequestDecision
  ): Promise<Result<ServiceResult<LeaderRequestDecisionResult>>> {
    return this.execute(async () => {
      // Validate decider
      const deciderProfileIdResult = ProfileId.create(deciderId);
      if (deciderProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestDecisionResult>>(deciderProfileIdResult.error!);
      }
      const deciderProfileId = deciderProfileIdResult.getValue();

      // Validate requester
      const requesterProfileIdResult = ProfileId.create(decision.requesterUserId);
      if (requesterProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestDecisionResult>>(requesterProfileIdResult.error!);
      }
      const requesterProfileId = requesterProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(decision.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestDecisionResult>>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestDecisionResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Process decision
      let resultDecision: 'approved' | 'rejected';
      let newRole: SpaceMemberRole | undefined;

      if (decision.decision === 'approve') {
        const approveResult = space.approveLeaderRequest(requesterProfileId, deciderProfileId);
        if (approveResult.isFailure) {
          return Result.fail<ServiceResult<LeaderRequestDecisionResult>>(approveResult.error!);
        }
        resultDecision = 'approved';
        newRole = 'admin';
      } else {
        const rejectResult = space.rejectLeaderRequest(
          requesterProfileId,
          deciderProfileId,
          decision.reason
        );
        if (rejectResult.isFailure) {
          return Result.fail<ServiceResult<LeaderRequestDecisionResult>>(rejectResult.error!);
        }
        resultDecision = 'rejected';
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<LeaderRequestDecisionResult>>(saveResult.error!);
      }

      return Result.ok<ServiceResult<LeaderRequestDecisionResult>>({
        data: {
          requestId: decision.requestId,
          spaceId: decision.spaceId,
          requesterUserId: decision.requesterUserId,
          decision: resultDecision,
          newRole,
          reason: decision.reason
        }
      });
    }, 'SpaceManagement.decideLeaderRequest');
  }

  /**
   * Change a member's role
   */
  async changeMemberRole(
    actorId: string,
    input: RoleChangeInput
  ): Promise<Result<void>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<void>(actorProfileIdResult.error!);
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Validate target
      const targetProfileIdResult = ProfileId.create(input.targetUserId);
      if (targetProfileIdResult.isFailure) {
        return Result.fail<void>(targetProfileIdResult.error!);
      }
      const targetProfileId = targetProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<void>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<void>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check actor permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<void>('Only leaders can change member roles');
      }

      // Update role
      const updateResult = space.updateMemberRole(targetProfileId, input.newRole);
      if (updateResult.isFailure) {
        return Result.fail<void>(updateResult.error!);
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.error!);
      }

      return Result.ok<void>();
    }, 'SpaceManagement.changeMemberRole');
  }

  /**
   * Transfer space ownership to another member
   */
  async transferOwnership(
    currentOwnerId: string,
    input: OwnershipTransferInput
  ): Promise<Result<void>> {
    return this.execute(async () => {
      // Validate current owner
      const ownerProfileIdResult = ProfileId.create(currentOwnerId);
      if (ownerProfileIdResult.isFailure) {
        return Result.fail<void>(ownerProfileIdResult.error!);
      }
      const ownerProfileId = ownerProfileIdResult.getValue();

      // Validate new owner
      const newOwnerProfileIdResult = ProfileId.create(input.newOwnerId);
      if (newOwnerProfileIdResult.isFailure) {
        return Result.fail<void>(newOwnerProfileIdResult.error!);
      }
      const newOwnerProfileId = newOwnerProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<void>(spaceIdResult.error!);
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<void>('Space not found');
      }

      const space = spaceResult.getValue();

      // Verify current owner
      if (!space.owner || space.owner.value !== ownerProfileId.value) {
        return Result.fail<void>('Only the owner can transfer ownership');
      }

      // Transfer ownership
      const transferResult = space.transferOwnership(newOwnerProfileId);
      if (transferResult.isFailure) {
        return Result.fail<void>(transferResult.error!);
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<void>(saveResult.error!);
      }

      return Result.ok<void>();
    }, 'SpaceManagement.transferOwnership');
  }

  /**
   * Get pending leader requests for spaces the user manages
   */
  async getPendingLeaderRequests(
    managerId: string
  ): Promise<Result<ServiceResult<Array<{
    spaceId: string;
    spaceName: string;
    requests: Array<{
      profileId: string;
      requestedAt: Date;
      reason?: string;
    }>;
  }>>>> {
    type PendingRequestsResult = ServiceResult<Array<{
      spaceId: string;
      spaceName: string;
      requests: Array<{
        profileId: string;
        requestedAt: Date;
        reason?: string;
      }>;
    }>>;

    return this.execute(async () => {
      // Validate manager
      const managerProfileIdResult = ProfileId.create(managerId);
      if (managerProfileIdResult.isFailure) {
        return Result.fail<PendingRequestsResult>(managerProfileIdResult.error!);
      }
      const managerProfileId = managerProfileIdResult.getValue();

      // Get spaces where user is a leader
      const spacesResult = await this.spaceRepo.findByMember(managerId);
      if (spacesResult.isFailure) {
        return Result.fail<PendingRequestsResult>(spacesResult.error!);
      }

      const spaces = spacesResult.getValue();
      const results: Array<{
        spaceId: string;
        spaceName: string;
        requests: Array<{
          profileId: string;
          requestedAt: Date;
          reason?: string;
        }>;
      }> = [];

      for (const space of spaces) {
        // Only include spaces where user is leader
        if (!space.isLeader(managerProfileId)) {
          continue;
        }

        const pendingRequests = space.pendingLeaderRequests;
        if (pendingRequests.length > 0) {
          results.push({
            spaceId: space.spaceId.value,
            spaceName: space.name.value,
            requests: pendingRequests.map(r => ({
              profileId: r.profileId.value,
              requestedAt: r.requestedAt,
              reason: r.reason
            }))
          });
        }
      }

      return Result.ok<PendingRequestsResult>({
        data: results,
        metadata: {
          totalCount: results.reduce((sum, r) => sum + r.requests.length, 0)
        }
      });
    }, 'SpaceManagement.getPendingLeaderRequests');
  }

  // ============================================================
  // Tab Management Methods (Phase 2 - DDD Foundation)
  // ============================================================

  /**
   * Add a new tab to a space
   */
  async addTab(
    actorId: string,
    input: AddTabInput
  ): Promise<Result<ServiceResult<TabOperationResult>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<TabOperationResult>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<TabOperationResult>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<TabOperationResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission (must be leader)
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<TabOperationResult>>('Only space leaders can add tabs');
      }

      // Create tab via aggregate
      const tabResult = space.createTab({
        name: input.name,
        type: input.type,
        order: input.order,
        isVisible: input.isVisible
      });

      if (tabResult.isFailure) {
        return Result.fail<ServiceResult<TabOperationResult>>(tabResult.error ?? 'Failed to create tab');
      }

      const tab = tabResult.getValue();

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<TabOperationResult>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (TabCreated)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<TabOperationResult>>({
        data: {
          tabId: tab.id,
          name: tab.name,
          type: tab.type
        }
      });
    }, 'SpaceManagement.addTab');
  }

  /**
   * Update a tab's properties
   */
  async updateTab(
    actorId: string,
    input: UpdateTabInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<void>>('Only space leaders can update tabs');
      }

      // Update tab via aggregate
      const updateResult = space.updateTab(input.tabId, {
        name: input.name,
        order: input.order,
        isVisible: input.isVisible
      });

      if (updateResult.isFailure) {
        return Result.fail<ServiceResult<void>>(updateResult.error ?? 'Failed to update tab');
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (TabUpdated)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceManagement.updateTab');
  }

  /**
   * Remove a tab from a space
   */
  async removeTab(
    actorId: string,
    input: RemoveTabInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<void>>('Only space leaders can remove tabs');
      }

      // Remove tab via aggregate
      const removeResult = space.removeTab(input.tabId);
      if (removeResult.isFailure) {
        return Result.fail<ServiceResult<void>>(removeResult.error ?? 'Failed to remove tab');
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (TabRemoved, WidgetDetachedFromTab)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceManagement.removeTab');
  }

  /**
   * Reorder tabs in a space
   */
  async reorderTabs(
    actorId: string,
    input: ReorderTabsInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<void>>('Only space leaders can reorder tabs');
      }

      // Reorder tabs via aggregate
      const reorderResult = space.reorderTabs(input.orderedTabIds);
      if (reorderResult.isFailure) {
        return Result.fail<ServiceResult<void>>(reorderResult.error ?? 'Failed to reorder tabs');
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (TabsReordered)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceManagement.reorderTabs');
  }

  // ============================================================
  // Widget Management Methods (Phase 2 - DDD Foundation)
  // ============================================================

  /**
   * Add a new widget to a space
   */
  async addWidget(
    actorId: string,
    input: AddWidgetInput
  ): Promise<Result<ServiceResult<WidgetOperationResult>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<WidgetOperationResult>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<WidgetOperationResult>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<WidgetOperationResult>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<WidgetOperationResult>>('Only space leaders can add widgets');
      }

      // Create widget via aggregate
      const widgetResult = space.createWidget({
        type: input.type,
        title: input.title,
        config: input.config,
        order: input.order,
        position: input.position
      });

      if (widgetResult.isFailure) {
        return Result.fail<ServiceResult<WidgetOperationResult>>(widgetResult.error ?? 'Failed to create widget');
      }

      const widget = widgetResult.getValue();

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<WidgetOperationResult>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (WidgetCreated)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<WidgetOperationResult>>({
        data: {
          widgetId: widget.id,
          title: widget.title,
          type: widget.type
        }
      });
    }, 'SpaceManagement.addWidget');
  }

  /**
   * Update a widget's properties
   */
  async updateWidget(
    actorId: string,
    input: UpdateWidgetInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<void>>('Only space leaders can update widgets');
      }

      // Update widget via aggregate
      const updateResult = space.updateWidget(input.widgetId, {
        title: input.title,
        config: input.config,
        order: input.order,
        isVisible: input.isVisible,
        isEnabled: input.isEnabled
      });

      if (updateResult.isFailure) {
        return Result.fail<ServiceResult<void>>(updateResult.error ?? 'Failed to update widget');
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (WidgetUpdated)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceManagement.updateWidget');
  }

  /**
   * Remove a widget from a space
   */
  async removeWidget(
    actorId: string,
    input: RemoveWidgetInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<void>>('Only space leaders can remove widgets');
      }

      // Remove widget via aggregate
      const removeResult = space.removeWidget(input.widgetId);
      if (removeResult.isFailure) {
        return Result.fail<ServiceResult<void>>(removeResult.error ?? 'Failed to remove widget');
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (WidgetRemoved, WidgetDetachedFromTab)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceManagement.removeWidget');
  }

  /**
   * Attach a widget to a tab
   */
  async attachWidgetToTab(
    actorId: string,
    input: WidgetTabInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<void>>('Only space leaders can attach widgets');
      }

      // Attach widget via aggregate
      const attachResult = space.attachWidgetToTab(input.widgetId, input.tabId);
      if (attachResult.isFailure) {
        return Result.fail<ServiceResult<void>>(attachResult.error ?? 'Failed to attach widget');
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (WidgetAttachedToTab)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceManagement.attachWidgetToTab');
  }

  /**
   * Detach a widget from a tab
   */
  async detachWidgetFromTab(
    actorId: string,
    input: WidgetTabInput
  ): Promise<Result<ServiceResult<void>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<void>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<void>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<void>>('Only space leaders can detach widgets');
      }

      // Detach widget via aggregate
      const detachResult = space.detachWidgetFromTab(input.widgetId, input.tabId);
      if (detachResult.isFailure) {
        return Result.fail<ServiceResult<void>>(detachResult.error ?? 'Failed to detach widget');
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<void>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (WidgetDetachedFromTab)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<void>>({ data: undefined });
    }, 'SpaceManagement.detachWidgetFromTab');
  }

  // ============================================================
  // Space Basic Info Update (Phase 2 - DDD Foundation)
  // ============================================================

  /**
   * Update space basic info (name, description, visibility, settings)
   * This is the DDD-compliant replacement for raw Firestore PATCH
   */
  async updateSpace(
    actorId: string,
    input: UpdateSpaceInput
  ): Promise<Result<ServiceResult<EnhancedSpace>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<EnhancedSpace>>(actorProfileIdResult.error ?? 'Invalid actor ID');
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(input.spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<EnhancedSpace>>(spaceIdResult.error ?? 'Invalid space ID');
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<EnhancedSpace>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Check permission
      if (!space.isLeader(actorProfileId)) {
        return Result.fail<ServiceResult<EnhancedSpace>>('Only space leaders can update space info');
      }

      // Create value objects for updates
      let nameValue: SpaceName | undefined;
      if (input.name) {
        const nameResult = SpaceName.create(input.name);
        if (nameResult.isFailure) {
          return Result.fail<ServiceResult<EnhancedSpace>>(nameResult.error ?? 'Invalid space name');
        }
        nameValue = nameResult.getValue();
      }

      let descriptionValue: SpaceDescription | undefined;
      if (input.description) {
        const descResult = SpaceDescription.create(input.description);
        if (descResult.isFailure) {
          return Result.fail<ServiceResult<EnhancedSpace>>(descResult.error ?? 'Invalid space description');
        }
        descriptionValue = descResult.getValue();
      }

      // Update via aggregate
      const updateResult = space.updateBasicInfo(
        {
          name: nameValue,
          description: descriptionValue,
          visibility: input.visibility,
          settings: input.settings
        },
        actorId
      );

      if (updateResult.isFailure) {
        return Result.fail<ServiceResult<EnhancedSpace>>(updateResult.error ?? 'Failed to update space');
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<EnhancedSpace>>(saveResult.error ?? 'Failed to save space');
      }

      // Publish domain events (SpaceUpdated)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<EnhancedSpace>>({
        data: space
      });
    }, 'SpaceManagement.updateSpace');
  }

  /**
   * Generate a unique slug for a space within the campus
   */
  private async generateUniqueSlug(name: string): Promise<Result<SpaceSlug>> {
    // Generate base slug from name
    const baseSlugResult = SpaceSlug.generateFromName(name);
    if (baseSlugResult.isFailure) {
      return Result.fail<SpaceSlug>(baseSlugResult.error!);
    }

    const baseSlug = baseSlugResult.getValue();

    // Check if base slug is available
    const existingSpace = await this.findSpaceBySlug(baseSlug.value);
    if (!existingSpace) {
      return Result.ok(baseSlug);
    }

    // Try with numeric suffixes
    for (let suffix = 1; suffix <= 100; suffix++) {
      const suffixedSlugResult = SpaceSlug.withSuffix(baseSlug, suffix);
      if (suffixedSlugResult.isFailure) {
        continue;
      }

      const suffixedSlug = suffixedSlugResult.getValue();
      const existing = await this.findSpaceBySlug(suffixedSlug.value);
      if (!existing) {
        return Result.ok(suffixedSlug);
      }
    }

    return Result.fail<SpaceSlug>('Unable to generate unique slug after 100 attempts');
  }

  /**
   * Find a space by slug within the current campus
   */
  private async findSpaceBySlug(slug: string): Promise<EnhancedSpace | null> {
    try {
      // Search for space with matching slug
      const result = await this.spaceRepo.searchSpaces(slug, this.context.campusId);
      if (result.isSuccess) {
        const spaces = result.getValue();
        // Find exact slug match
        return spaces.find(s => s.slug?.value === slug) || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  // ============================================================
  // Stealth Mode / Publishing Methods
  // ============================================================

  /**
   * Verify a space leader and take the space live (admin action)
   *
   * This is called when a platform admin verifies a leader's claim to a space.
   * While in stealth mode, leaders can fully use the space - they get instant
   * value. Once verified, the space becomes publicly discoverable.
   *
   * @param adminId - Platform admin performing the verification
   * @param spaceId - Space to take live
   * @param leaderId - Optional: specific leader being verified (defaults to owner)
   */
  async verifyAndGoLive(
    adminId: string,
    spaceId: string,
    leaderId?: string
  ): Promise<Result<ServiceResult<{ spaceId: string; spaceName: string; wentLiveAt: Date; verifiedLeaderId: string }>>> {
    return this.execute(async () => {
      // Validate admin
      const adminProfileIdResult = ProfileId.create(adminId);
      if (adminProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; spaceName: string; wentLiveAt: Date; verifiedLeaderId: string }>>(
          adminProfileIdResult.error ?? 'Invalid admin ID'
        );
      }
      const adminProfileId = adminProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; spaceName: string; wentLiveAt: Date; verifiedLeaderId: string }>>(
          spaceIdResult.error ?? 'Invalid space ID'
        );
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; spaceName: string; wentLiveAt: Date; verifiedLeaderId: string }>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Determine which leader to verify (default to owner)
      const verifiedLeaderId = leaderId || space.owner?.value;
      if (!verifiedLeaderId) {
        return Result.fail<ServiceResult<{ spaceId: string; spaceName: string; wentLiveAt: Date; verifiedLeaderId: string }>>(
          'No leader ID provided and space has no owner'
        );
      }

      // Call domain method to verify and go live
      const leaderProfileIdResult = ProfileId.create(verifiedLeaderId);
      if (leaderProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; spaceName: string; wentLiveAt: Date; verifiedLeaderId: string }>>(
          'Invalid leader ID'
        );
      }

      const goLiveResult = space.verifyLeaderAndGoLive(
        leaderProfileIdResult.getValue(),
        adminProfileId
      );
      if (goLiveResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; spaceName: string; wentLiveAt: Date; verifiedLeaderId: string }>>(
          goLiveResult.error ?? 'Failed to verify and go live'
        );
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; spaceName: string; wentLiveAt: Date; verifiedLeaderId: string }>>(
          saveResult.error ?? 'Failed to save space'
        );
      }

      // Publish domain events (SpaceWentLive, SpaceStatusChanged)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<{ spaceId: string; spaceName: string; wentLiveAt: Date; verifiedLeaderId: string }>>({
        data: {
          spaceId,
          spaceName: space.name.value,
          wentLiveAt: space.wentLiveAt!,
          verifiedLeaderId
        }
      });
    }, 'SpaceManagement.verifyAndGoLive');
  }

  /**
   * Reset a space back to stealth mode (only leaders)
   * Useful if space needs more work before launch
   */
  async resetToStealth(
    actorId: string,
    spaceId: string,
    reason?: string
  ): Promise<Result<ServiceResult<{ spaceId: string; action: 'reset_to_stealth' }>>> {
    return this.execute(async () => {
      // Validate actor
      const actorProfileIdResult = ProfileId.create(actorId);
      if (actorProfileIdResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'reset_to_stealth' }>>(
          actorProfileIdResult.error ?? 'Invalid actor ID'
        );
      }
      const actorProfileId = actorProfileIdResult.getValue();

      // Get space
      const spaceIdResult = SpaceId.create(spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'reset_to_stealth' }>>(
          spaceIdResult.error ?? 'Invalid space ID'
        );
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'reset_to_stealth' }>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Call domain method
      const resetResult = space.resetToStealth(actorProfileId, reason);
      if (resetResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'reset_to_stealth' }>>(
          resetResult.error ?? 'Failed to reset to stealth'
        );
      }

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'reset_to_stealth' }>>(
          saveResult.error ?? 'Failed to save space'
        );
      }

      // Publish domain events (SpaceStatusChanged)
      await this.publishEvents(space);

      return Result.ok<ServiceResult<{ spaceId: string; action: 'reset_to_stealth' }>>({
        data: { spaceId, action: 'reset_to_stealth' }
      });
    }, 'SpaceManagement.resetToStealth');
  }

  // ============================================================
  // Admin Moderation Methods (Platform-Level Operations)
  // ============================================================

  /**
   * Admin action to disable a space (soft delete)
   * Disabled spaces are hidden from browse/search but data is preserved
   */
  async adminDisableSpace(
    adminId: string,
    spaceId: string,
    reason?: string
  ): Promise<Result<ServiceResult<{ spaceId: string; action: 'disabled' }>>> {
    return this.execute(async () => {
      // Get space
      const spaceIdResult = SpaceId.create(spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'disabled' }>>(
          spaceIdResult.error ?? 'Invalid space ID'
        );
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'disabled' }>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Set space as inactive via aggregate setter
      space.setIsActive(false);
      space.setModerationInfo({
        disabledAt: new Date(),
        disabledBy: adminId,
        disableReason: reason
      });

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'disabled' }>>(
          saveResult.error ?? 'Failed to save space'
        );
      }

      return Result.ok<ServiceResult<{ spaceId: string; action: 'disabled' }>>({
        data: { spaceId, action: 'disabled' }
      });
    }, 'SpaceManagement.adminDisableSpace');
  }

  /**
   * Admin action to enable a previously disabled space
   */
  async adminEnableSpace(
    adminId: string,
    spaceId: string
  ): Promise<Result<ServiceResult<{ spaceId: string; action: 'enabled' }>>> {
    return this.execute(async () => {
      // Get space
      const spaceIdResult = SpaceId.create(spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'enabled' }>>(
          spaceIdResult.error ?? 'Invalid space ID'
        );
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'enabled' }>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Set space as active
      space.setIsActive(true);
      space.setModerationInfo({
        enabledAt: new Date(),
        enabledBy: adminId
      });

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'enabled' }>>(
          saveResult.error ?? 'Failed to save space'
        );
      }

      return Result.ok<ServiceResult<{ spaceId: string; action: 'enabled' }>>({
        data: { spaceId, action: 'enabled' }
      });
    }, 'SpaceManagement.adminEnableSpace');
  }

  /**
   * Admin action to verify a space (official/trusted status)
   */
  async adminVerifySpace(
    adminId: string,
    spaceId: string
  ): Promise<Result<ServiceResult<{ spaceId: string; action: 'verified' }>>> {
    return this.execute(async () => {
      // Get space
      const spaceIdResult = SpaceId.create(spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'verified' }>>(
          spaceIdResult.error ?? 'Invalid space ID'
        );
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'verified' }>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Set space as verified
      space.setIsVerified(true);
      space.setModerationInfo({
        verifiedAt: new Date(),
        verifiedBy: adminId
      });

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'verified' }>>(
          saveResult.error ?? 'Failed to save space'
        );
      }

      return Result.ok<ServiceResult<{ spaceId: string; action: 'verified' }>>({
        data: { spaceId, action: 'verified' }
      });
    }, 'SpaceManagement.adminVerifySpace');
  }

  /**
   * Admin action to unverify a space
   */
  async adminUnverifySpace(
    adminId: string,
    spaceId: string,
    reason?: string
  ): Promise<Result<ServiceResult<{ spaceId: string; action: 'unverified' }>>> {
    return this.execute(async () => {
      // Get space
      const spaceIdResult = SpaceId.create(spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'unverified' }>>(
          spaceIdResult.error ?? 'Invalid space ID'
        );
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'unverified' }>>('Space not found');
      }

      const space = spaceResult.getValue();

      // Remove verified status
      space.setIsVerified(false);
      space.setModerationInfo({
        unverifiedAt: new Date(),
        unverifiedBy: adminId,
        unverifyReason: reason
      });

      // Save space
      const saveResult = await this.spaceRepo.save(space);
      if (saveResult.isFailure) {
        return Result.fail<ServiceResult<{ spaceId: string; action: 'unverified' }>>(
          saveResult.error ?? 'Failed to save space'
        );
      }

      return Result.ok<ServiceResult<{ spaceId: string; action: 'unverified' }>>({
        data: { spaceId, action: 'unverified' }
      });
    }, 'SpaceManagement.adminUnverifySpace');
  }

  /**
   * Admin action to get any space with full details (bypasses normal permissions)
   */
  async adminGetSpace(
    spaceId: string
  ): Promise<Result<ServiceResult<EnhancedSpace>>> {
    return this.execute(async () => {
      // Get space
      const spaceIdResult = SpaceId.create(spaceId);
      if (spaceIdResult.isFailure) {
        return Result.fail<ServiceResult<EnhancedSpace>>(
          spaceIdResult.error ?? 'Invalid space ID'
        );
      }

      const spaceResult = await this.spaceRepo.findById(spaceIdResult.getValue());
      if (spaceResult.isFailure) {
        return Result.fail<ServiceResult<EnhancedSpace>>('Space not found');
      }

      return Result.ok<ServiceResult<EnhancedSpace>>({
        data: spaceResult.getValue()
      });
    }, 'SpaceManagement.adminGetSpace');
  }

  /**
   * Admin action to list spaces with filtering (includes disabled spaces)
   */
  async adminListSpaces(
    options: {
      includeDisabled?: boolean;
      onlyUnverified?: boolean;
      category?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Result<ServiceResult<EnhancedSpace[]>>> {
    return this.execute(async () => {
      // Get all spaces for campus
      const spacesResult = await this.spaceRepo.findByCampus(this.context.campusId);
      if (spacesResult.isFailure) {
        return Result.fail<ServiceResult<EnhancedSpace[]>>(spacesResult.error ?? 'Failed to fetch spaces');
      }

      let spaces = spacesResult.getValue();

      // Apply filters
      if (!options.includeDisabled) {
        spaces = spaces.filter(s => s.isActive);
      }

      if (options.onlyUnverified) {
        spaces = spaces.filter(s => !s.isVerified);
      }

      if (options.category) {
        spaces = spaces.filter(s => s.category.value === options.category);
      }

      // Apply pagination
      const offset = options.offset ?? 0;
      const limit = options.limit ?? 50;
      spaces = spaces.slice(offset, offset + limit);

      return Result.ok<ServiceResult<EnhancedSpace[]>>({
        data: spaces,
        metadata: {
          totalCount: spaces.length,
          pageSize: limit,
          pageNumber: Math.floor(offset / limit) + 1,
          hasMore: offset + spaces.length < spaces.length
        }
      });
    }, 'SpaceManagement.adminListSpaces');
  }
}
