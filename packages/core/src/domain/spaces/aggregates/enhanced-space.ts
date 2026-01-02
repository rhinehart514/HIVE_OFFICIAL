/**
 * EnhancedSpace Aggregate
 * Represents a community space with enhanced features
 */

import { AggregateRoot } from '../../shared/base/AggregateRoot.base';
import { Result } from '../../shared/base/Result';
import { SpaceId } from '../value-objects/space-id.value';
import { SpaceName } from '../value-objects/space-name.value';
import { SpaceSlug } from '../value-objects/space-slug.value';
import { SpaceDescription } from '../value-objects/space-description.value';
import { SpaceCategory } from '../value-objects/space-category.value';
import { CampusId } from '../../profile/value-objects/campus-id.value';
import { ProfileId } from '../../profile/value-objects/profile-id.value';
import { Tab } from '../entities/tab';
import { Widget } from '../entities/widget';
import { PlacedTool, PlacementLocation, PlacementVisibility } from '../entities/placed-tool';
import { getSystemToolsForType } from '../system-tool-registry';
import {
  SpaceUpdatedEvent,
  TabCreatedEvent,
  TabUpdatedEvent,
  TabRemovedEvent,
  TabsReorderedEvent,
  WidgetCreatedEvent,
  WidgetUpdatedEvent,
  WidgetRemovedEvent,
  WidgetAttachedToTabEvent,
  WidgetDetachedFromTabEvent,
  ToolPlacedEvent,
  PlacedToolUpdatedEvent,
  ToolRemovedEvent,
  PlacedToolActivatedEvent,
  PlacedToolDeactivatedEvent,
  PlacedToolsReorderedEvent,
  SpaceStatusChangedEvent,
  SpaceWentLiveEvent,
  type SpacePublishStatus,
} from '../events';

/**
 * Space member roles in order of permission level (highest to lowest)
 * - owner: Full control, cannot be demoted, only one per space
 * - admin: Full management permissions, can manage moderators and members
 * - moderator: Can moderate content and manage members
 * - member: Basic participation rights
 * - guest: Read-only access (for private spaces)
 */
export type SpaceMemberRole = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

/**
 * Space types - determines templates, suggestions, and AI context
 * - uni: Official university entities (departments, programs, student gov)
 * - student: Student-run organizations (clubs, orgs, interest groups)
 * - greek: Fraternities & sororities (chapters, councils)
 * - residential: Dorms, floors, housing communities
 */
export type SpaceType = 'uni' | 'student' | 'greek' | 'residential';

/**
 * Governance models - determines how roles and permissions work
 * - flat: Everyone equal, no designated roles
 * - emergent: Roles form from activity/contribution
 * - hybrid: Some designated roles + earned roles
 * - hierarchical: Clear chain of command (owner → admin → mod → member)
 */
export type GovernanceModel = 'flat' | 'emergent' | 'hybrid' | 'hierarchical';

/**
 * Space lifecycle status - ownership/claiming lifecycle
 * - unclaimed: Pre-seeded from UBLinked, no owner yet
 * - active: Has activity but still unclaimed
 * - claimed: Owner has claimed the space
 * - verified: Official verification granted
 */
export type SpaceStatus = 'unclaimed' | 'active' | 'claimed' | 'verified';

/**
 * Space source - where the space came from
 * - ublinked: Pre-seeded from UBLinked/CampusLabs data
 * - user-created: Created by a student
 */
export type SpaceSource = 'ublinked' | 'user-created';

/**
 * Get default governance model based on space type
 */
function getDefaultGovernance(spaceType: SpaceType): GovernanceModel {
  switch (spaceType) {
    case 'uni':
      return 'hierarchical';
    case 'greek':
      return 'hierarchical';
    case 'student':
      return 'hybrid';
    case 'residential':
      return 'flat';
    default:
      return 'hybrid';
  }
}

interface SpaceMember {
  profileId: ProfileId;
  role: SpaceMemberRole;
  joinedAt: Date;
}

/**
 * Leader request status tracking
 */
export type LeaderRequestStatus = 'pending' | 'approved' | 'rejected';

/**
 * Proof type for leader verification
 */
export type LeaderProofType = 'email' | 'document' | 'social' | 'referral' | 'none';

/**
 * Leader/claim request with verification info
 */
export interface LeaderRequest {
  profileId: ProfileId;
  status: LeaderRequestStatus;
  requestedAt: Date;
  /** Role in the organization (President, VP, etc.) */
  role?: string;
  /** Type of proof provided */
  proofType?: LeaderProofType;
  /** URL to proof document/link */
  proofUrl?: string;
  /** Legacy reason field */
  reason?: string;
  reviewedBy?: ProfileId;
  reviewedAt?: Date;
  rejectionReason?: string;
  /** Whether provisional access was granted before full verification */
  provisionalAccessGranted?: boolean;
  provisionalAccessAt?: Date;
}

/**
 * Setup progress tracking for leaders
 * Tracks onboarding completion for newly claimed spaces
 */
export interface SetupProgress {
  /** Has leader posted a welcome message */
  welcomeMessagePosted: boolean;
  welcomeMessageAt?: Date;
  /** Has leader deployed at least one tool */
  firstToolDeployed: boolean;
  firstToolAt?: Date;
  /** Has leader invited a co-leader */
  coLeaderInvited: boolean;
  coLeaderAt?: Date;
  /** Target number of members for setup completion */
  minimumMembersTarget: number;
  /** Is setup considered complete */
  isComplete: boolean;
  completedAt?: Date;
}

interface SpaceSettings {
  allowInvites: boolean;
  requireApproval: boolean;
  allowRSS: boolean;
  maxMembers?: number;
  isPublic: boolean;
}

interface RushMode {
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
  requirements?: string[];
}

interface EnhancedSpaceProps {
  spaceId: SpaceId;
  name: SpaceName;
  slug?: SpaceSlug;
  description: SpaceDescription;
  category: SpaceCategory;
  campusId: CampusId;
  /** Creator - optional for pre-seeded unclaimed spaces */
  createdBy?: ProfileId;
  members: SpaceMember[];
  leaderRequests: LeaderRequest[];
  tabs: Tab[];
  widgets: Widget[];
  placedTools: PlacedTool[];
  settings: SpaceSettings;
  rssUrl?: string;
  visibility: 'public' | 'private';
  /**
   * Space type - determines templates, suggestions, AI context
   */
  spaceType: SpaceType;
  /**
   * Governance model - determines how roles work
   */
  governance: GovernanceModel;
  /**
   * Lifecycle status - ownership/claiming lifecycle
   */
  status: SpaceStatus;
  /**
   * Source - where the space came from
   */
  source: SpaceSource;
  /**
   * External ID - for pre-seeded spaces (e.g., UBLinked org ID)
   */
  externalId?: string;
  /**
   * When the space was claimed (if applicable)
   */
  claimedAt?: Date;
  /**
   * Publishing status for stealth mode
   * - stealth: Space is being set up, only visible to leaders
   * - live: Space is publicly visible and active
   * - rejected: Leader request was rejected
   */
  publishStatus: SpacePublishStatus;
  /** When the space went live (stealth → live) */
  wentLiveAt?: Date;
  isActive: boolean;
  isVerified: boolean;
  trendingScore: number;
  rushMode?: RushMode;
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
  postCount: number;
  /**
   * Setup progress tracking for claimed spaces
   * Tracks leader onboarding completion
   */
  setupProgress?: SetupProgress;
}

export class EnhancedSpace extends AggregateRoot<EnhancedSpaceProps> {
  get spaceId(): SpaceId {
    return this.props.spaceId;
  }

  get name(): SpaceName {
    return this.props.name;
  }

  get slug(): SpaceSlug | undefined {
    return this.props.slug;
  }

  /**
   * Get the owner ProfileId, if one exists.
   * Unclaimed spaces have no owner.
   */
  get owner(): ProfileId | undefined {
    const ownerMember = this.props.members.find(m => m.role === 'owner');
    // Fall back to createdBy if no explicit owner (legacy data)
    return ownerMember?.profileId || this.props.createdBy;
  }

  /**
   * Whether this space has an owner (is claimed)
   */
  get hasOwner(): boolean {
    return this.owner !== undefined;
  }

  /**
   * Space type (uni, student, greek, residential)
   */
  get spaceType(): SpaceType {
    return this.props.spaceType;
  }

  /**
   * Governance model (flat, emergent, hybrid, hierarchical)
   */
  get governance(): GovernanceModel {
    return this.props.governance;
  }

  /**
   * Lifecycle status (unclaimed, active, claimed, verified)
   */
  get status(): SpaceStatus {
    return this.props.status;
  }

  /**
   * Source (ublinked, user-created)
   */
  get source(): SpaceSource {
    return this.props.source;
  }

  /**
   * External ID for pre-seeded spaces
   */
  get externalId(): string | undefined {
    return this.props.externalId;
  }

  /**
   * When the space was claimed
   */
  get claimedAt(): Date | undefined {
    return this.props.claimedAt;
  }

  /**
   * Whether this space is unclaimed (pre-seeded, no owner)
   */
  get isUnclaimed(): boolean {
    return this.props.status === 'unclaimed' || this.props.status === 'active';
  }

  /**
   * Whether this space is claimed (has owner)
   */
  get isClaimed(): boolean {
    return this.props.status === 'claimed' || this.props.status === 'verified';
  }

  get leaderRequests(): LeaderRequest[] {
    return this.props.leaderRequests;
  }

  get pendingLeaderRequests(): LeaderRequest[] {
    return this.props.leaderRequests.filter(r => r.status === 'pending');
  }

  get description(): SpaceDescription {
    return this.props.description;
  }

  get category(): SpaceCategory {
    return this.props.category;
  }

  get campusId(): CampusId {
    return this.props.campusId;
  }

  get memberCount(): number {
    return this.props.members.length;
  }

  get isPublic(): boolean {
    return this.props.visibility === 'public';
  }

  get tabs(): Tab[] {
    return this.props.tabs;
  }

  get widgets(): Widget[] {
    return this.props.widgets;
  }

  get placedTools(): PlacedTool[] {
    return this.props.placedTools;
  }

  /**
   * Get placed tools filtered by location
   */
  get sidebarTools(): PlacedTool[] {
    return this.props.placedTools
      .filter(t => t.placement === 'sidebar' && t.isActive)
      .sort((a, b) => a.order - b.order);
  }

  get inlineTools(): PlacedTool[] {
    return this.props.placedTools
      .filter(t => t.placement === 'inline' && t.isActive)
      .sort((a, b) => a.order - b.order);
  }

  get tabTools(): PlacedTool[] {
    return this.props.placedTools
      .filter(t => t.placement === 'tab' && t.isActive)
      .sort((a, b) => a.order - b.order);
  }

  get isVerified(): boolean {
    return this.props.isVerified;
  }

  get trendingScore(): number {
    return this.props.trendingScore;
  }

  get rushMode(): RushMode | undefined {
    return this.props.rushMode;
  }

  get postCount(): number {
    return this.props.postCount;
  }

  /**
   * Setup progress for claimed spaces
   * Returns undefined for unclaimed spaces
   */
  get setupProgress(): SetupProgress | undefined {
    return this.props.setupProgress;
  }

  /**
   * Whether the leader has completed all setup tasks
   */
  get isSetupComplete(): boolean {
    return this.props.setupProgress?.isComplete ?? false;
  }

  get members(): SpaceMember[] {
    return this.props.members;
  }

  get adminCount(): number {
    return this.getAdminCount();
  }

  get lastActivityAt(): Date {
    return this.props.lastActivityAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Compatibility getters for Space interface
  get spaceIdValue(): SpaceId {
    return this.props.spaceId;
  }

  get visibility(): 'public' | 'private' {
    return this.props.visibility;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  /**
   * Current publishing status
   * - stealth: Being set up, only visible to leaders
   * - live: Publicly visible
   * - rejected: Leader request rejected
   */
  get publishStatus(): SpacePublishStatus {
    return this.props.publishStatus;
  }

  /**
   * Whether the space is in stealth mode (not yet publicly visible)
   */
  get isStealth(): boolean {
    return this.props.publishStatus === 'stealth';
  }

  /**
   * Whether the space is live and publicly visible
   */
  get isLive(): boolean {
    return this.props.publishStatus === 'live';
  }

  /**
   * When the space went live (if applicable)
   */
  get wentLiveAt(): Date | undefined {
    return this.props.wentLiveAt;
  }

  get settings(): SpaceSettings {
    return this.props.settings;
  }

  get posts(): any[] {
    // Posts are managed separately - return empty array for interface compatibility
    return [];
  }

  public getMemberCount(): number {
    return this.props.members.length;
  }


  private constructor(props: EnhancedSpaceProps, id?: string) {
    // SECURITY FIX: Use crypto.randomUUID() for cryptographically secure IDs
    super(props, id || `space_${crypto.randomUUID()}`);
  }

  public static create(
    props: {
      spaceId: SpaceId;
      name: SpaceName;
      slug?: SpaceSlug;
      description: SpaceDescription;
      category: SpaceCategory;
      campusId: CampusId;
      /** Creator - optional for pre-seeded unclaimed spaces */
      createdBy?: ProfileId;
      settings?: Partial<SpaceSettings>;
      visibility?: 'public' | 'private';
      rssUrl?: string;
      /**
       * Space type - determines templates and AI context
       * Defaults to 'student' for user-created spaces
       */
      spaceType?: SpaceType;
      /**
       * Governance model - defaults based on space type
       */
      governance?: GovernanceModel;
      /**
       * Source - 'ublinked' for pre-seeded, 'user-created' for new
       */
      source?: SpaceSource;
      /**
       * External ID for pre-seeded spaces
       */
      externalId?: string;
      /**
       * Initial publish status
       * - 'stealth' (default): Space starts hidden, leader sets up before going live
       * - 'live': Space is immediately visible (for pre-seeded/imported spaces)
       */
      publishStatus?: SpacePublishStatus;
    },
    id?: string
  ): Result<EnhancedSpace> {
    const defaultSettings: SpaceSettings = {
      allowInvites: true,
      requireApproval: false,
      allowRSS: false,
      isPublic: props.visibility === 'public',
      ...props.settings
    };

    // Determine source
    const source = props.source ?? 'user-created';

    // Determine space type - default to 'student'
    const spaceType = props.spaceType ?? 'student';

    // Determine governance based on space type if not provided
    const governance = props.governance ?? getDefaultGovernance(spaceType);

    // Determine initial status
    const isUnclaimed = source === 'ublinked' && !props.createdBy;
    const status: SpaceStatus = isUnclaimed ? 'unclaimed' : 'claimed';

    // Members array - empty for unclaimed, has owner for claimed
    const members: SpaceMember[] = [];
    if (props.createdBy) {
      members.push({
        profileId: props.createdBy,
        role: 'owner',
        joinedAt: new Date()
      });
    }

    // Default to 'stealth' for new claimed spaces
    // Pre-seeded unclaimed spaces should be 'live' (visible in directory)
    const publishStatus = props.publishStatus ?? (isUnclaimed ? 'live' : 'stealth');

    const spaceProps: EnhancedSpaceProps = {
      spaceId: props.spaceId,
      name: props.name,
      slug: props.slug,
      description: props.description,
      category: props.category,
      campusId: props.campusId,
      createdBy: props.createdBy,
      members,
      leaderRequests: [],
      tabs: [],
      widgets: [],
      placedTools: [],
      settings: defaultSettings,
      rssUrl: props.rssUrl,
      visibility: props.visibility || 'public',
      spaceType,
      governance,
      status,
      source,
      externalId: props.externalId,
      claimedAt: props.createdBy ? new Date() : undefined,
      publishStatus,
      wentLiveAt: publishStatus === 'live' ? new Date() : undefined,
      isActive: true,
      isVerified: false,
      trendingScore: 0,
      rushMode: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastActivityAt: new Date(),
      postCount: 0
    };

    const space = new EnhancedSpace(spaceProps, id);

    // Create default tabs
    space.createDefaultTabs();

    // Auto-deploy system tools for pre-seeded (ublinked) spaces
    // These spaces should be useful from day one, before a leader claims them
    if (source === 'ublinked') {
      space.autoDeploySystemTools();
    }

    return Result.ok<EnhancedSpace>(space);
  }

  public addMember(profileId: ProfileId, role: 'member' | 'moderator' = 'member'): Result<void> {
    if (this.isMember(profileId)) {
      return Result.fail<void>('User is already a member');
    }

    if (this.props.settings.maxMembers && this.memberCount >= this.props.settings.maxMembers) {
      return Result.fail<void>('Space has reached maximum member capacity');
    }

    this.props.members.push({
      profileId,
      role,
      joinedAt: new Date()
    });

    this.updateLastActivity();
    return Result.ok<void>();
  }

  public removeMember(profileId: ProfileId): Result<void> {
    const memberIndex = this.props.members.findIndex(
      m => m.profileId.value === profileId.value
    );

    if (memberIndex === -1) {
      return Result.fail<void>('User is not a member');
    }

    const member = this.props.members[memberIndex];
    if (!member) {
      return Result.fail<void>('Member not found');
    }

    // Can't remove last admin
    if (member.role === 'admin' && this.getAdminCount() === 1) {
      return Result.fail<void>('Cannot remove the last admin');
    }

    this.props.members.splice(memberIndex, 1);
    this.updateLastActivity();
    return Result.ok<void>();
  }

  public isMember(profileId: ProfileId): boolean {
    return this.props.members.some(m => m.profileId.value === profileId.value);
  }

  public getMemberRole(profileId: ProfileId): string | null {
    const member = this.props.members.find(m => m.profileId.value === profileId.value);
    return member ? member.role : null;
  }

  public updateMemberRole(
    profileId: ProfileId,
    newRole: SpaceMemberRole
  ): Result<void> {
    const member = this.props.members.find(m => m.profileId.value === profileId.value);

    if (!member) {
      return Result.fail<void>('User is not a member');
    }

    // Cannot change owner role - use transferOwnership instead
    if (member.role === 'owner') {
      return Result.fail<void>('Cannot change owner role. Use transferOwnership instead.');
    }

    // Cannot promote to owner through this method
    if (newRole === 'owner') {
      return Result.fail<void>('Cannot promote to owner. Use transferOwnership instead.');
    }

    // Can't demote last admin (owner doesn't count, they're always there)
    if (member.role === 'admin' && newRole !== 'admin' && this.getAdminCount() === 1) {
      return Result.fail<void>('Cannot demote the last admin');
    }

    member.role = newRole;
    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Transfer ownership of the space to another member
   * The current owner becomes an admin
   */
  public transferOwnership(newOwnerProfileId: ProfileId): Result<void> {
    const currentOwner = this.props.members.find(m => m.role === 'owner');
    const newOwner = this.props.members.find(m => m.profileId.value === newOwnerProfileId.value);

    if (!newOwner) {
      return Result.fail<void>('New owner must be a member of the space');
    }

    if (newOwner.role === 'owner') {
      return Result.fail<void>('User is already the owner');
    }

    // Demote current owner to admin
    if (currentOwner) {
      currentOwner.role = 'admin';
    }

    // Promote new owner
    newOwner.role = 'owner';
    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Request to become a leader (admin) of this space
   */
  public requestToLead(profileId: ProfileId, reason?: string): Result<void> {
    // Check if user is already a member with admin+ role
    const existingMember = this.props.members.find(m => m.profileId.value === profileId.value);
    if (existingMember && (existingMember.role === 'owner' || existingMember.role === 'admin')) {
      return Result.fail<void>('User is already a leader of this space');
    }

    // Check for existing pending request
    const existingRequest = this.props.leaderRequests.find(
      r => r.profileId.value === profileId.value && r.status === 'pending'
    );
    if (existingRequest) {
      return Result.fail<void>('A request is already pending for this user');
    }

    const request: LeaderRequest = {
      profileId,
      status: 'pending',
      requestedAt: new Date(),
      reason
    };

    this.props.leaderRequests.push(request);
    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Approve a leader request, promoting the user to admin
   */
  public approveLeaderRequest(
    requestProfileId: ProfileId,
    approvedBy: ProfileId
  ): Result<void> {
    // Check if approver has permission (must be owner or admin)
    const approverMember = this.props.members.find(m => m.profileId.value === approvedBy.value);
    if (!approverMember || (approverMember.role !== 'owner' && approverMember.role !== 'admin')) {
      return Result.fail<void>('Only owners and admins can approve leader requests');
    }

    // Find the pending request
    const request = this.props.leaderRequests.find(
      r => r.profileId.value === requestProfileId.value && r.status === 'pending'
    );
    if (!request) {
      return Result.fail<void>('No pending request found for this user');
    }

    // Update request status
    request.status = 'approved';
    request.reviewedBy = approvedBy;
    request.reviewedAt = new Date();

    // Add or promote the user
    const existingMember = this.props.members.find(m => m.profileId.value === requestProfileId.value);
    if (existingMember) {
      existingMember.role = 'admin';
    } else {
      this.props.members.push({
        profileId: requestProfileId,
        role: 'admin',
        joinedAt: new Date()
      });
    }

    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Reject a leader request
   */
  public rejectLeaderRequest(
    requestProfileId: ProfileId,
    rejectedBy: ProfileId,
    rejectionReason?: string
  ): Result<void> {
    // Check if rejector has permission
    const rejectorMember = this.props.members.find(m => m.profileId.value === rejectedBy.value);
    if (!rejectorMember || (rejectorMember.role !== 'owner' && rejectorMember.role !== 'admin')) {
      return Result.fail<void>('Only owners and admins can reject leader requests');
    }

    // Find the pending request
    const request = this.props.leaderRequests.find(
      r => r.profileId.value === requestProfileId.value && r.status === 'pending'
    );
    if (!request) {
      return Result.fail<void>('No pending request found for this user');
    }

    // Update request status
    request.status = 'rejected';
    request.reviewedBy = rejectedBy;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason;

    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Check if a user has admin-level permissions (owner or admin)
   */
  public isLeader(profileId: ProfileId): boolean {
    const member = this.props.members.find(m => m.profileId.value === profileId.value);
    return !!member && (member.role === 'owner' || member.role === 'admin');
  }

  /**
   * Check if a user can manage the space (owner, admin, or moderator)
   */
  public canManage(profileId: ProfileId): boolean {
    const member = this.props.members.find(m => m.profileId.value === profileId.value);
    return !!member && (member.role === 'owner' || member.role === 'admin' || member.role === 'moderator');
  }

  public addTab(tab: Tab): Result<void> {
    if (this.props.tabs.find(t => t.name === tab.name)) {
      return Result.fail<void>('Tab with this name already exists');
    }

    this.props.tabs.push(tab);
    this.updateLastActivity();
    return Result.ok<void>();
  }

  public addWidget(widget: Widget): Result<void> {
    this.props.widgets.push(widget);
    this.updateLastActivity();
    return Result.ok<void>();
  }

  public incrementPostCount(): void {
    this.props.postCount++;
    this.updateLastActivity();
  }

  public updateSettings(settings: Partial<SpaceSettings>): void {
    this.props.settings = { ...this.props.settings, ...settings };
    this.props.updatedAt = new Date();
  }

  private getAdminCount(): number {
    return this.props.members.filter(m => m.role === 'admin').length;
  }

  private updateLastActivity(): void {
    this.props.lastActivityAt = new Date();
    this.props.updatedAt = new Date();
  }

  private createDefaultTabs(): void {
    const feedTab = Tab.create({
      name: 'Feed',
      type: 'feed',
      isDefault: true,
      order: 0,
      widgets: [],
      isVisible: true
    });

    if (feedTab.isSuccess) {
      this.props.tabs.push(feedTab.getValue());
    }
  }

  // Temporary setters for repository layer - should be removed once proper construction is implemented
  public setIsVerified(isVerified: boolean): void {
    (this.props as any).isVerified = isVerified;
  }

  public setIsActive(isActive: boolean): void {
    (this.props as any).isActive = isActive;
    this.props.updatedAt = new Date();
  }

  /**
   * Set moderation metadata (for audit trail)
   */
  public setModerationInfo(info: {
    disabledAt?: Date;
    disabledBy?: string;
    disableReason?: string;
    enabledAt?: Date;
    enabledBy?: string;
    verifiedAt?: Date;
    verifiedBy?: string;
    unverifiedAt?: Date;
    unverifiedBy?: string;
    unverifyReason?: string;
  }): void {
    // Store moderation info in props (will be persisted by mapper)
    (this.props as any).moderationInfo = {
      ...(this.props as any).moderationInfo,
      ...info
    };
    this.props.updatedAt = new Date();
  }

  public setPostCount(count: number): void {
    (this.props as any).postCount = count;
  }

  public setMemberCount(count: number): void {
    // Note: This is for setting cached count from database
    // The actual count should be calculated from members.length
    (this.props as any).memberCount = count;
  }

  public setTrendingScore(score: number): void {
    (this.props as any).trendingScore = score;
  }

  public setLastActivityAt(date: Date): void {
    (this.props as any).lastActivityAt = date;
  }

  public setCreatedAt(date: Date): void {
    (this.props as any).createdAt = date;
  }

  public setUpdatedAt(date: Date): void {
    (this.props as any).updatedAt = date;
  }

  public setTabs(tabs: Tab[]): void {
    (this.props as any).tabs = tabs;
  }

  public setWidgets(widgets: Widget[]): void {
    (this.props as any).widgets = widgets;
  }

  public setSlug(slug: SpaceSlug): void {
    (this.props as any).slug = slug;
  }

  public setLeaderRequests(requests: LeaderRequest[]): void {
    (this.props as any).leaderRequests = requests;
  }

  /**
   * Set members from external data (e.g., loaded from spaceMembers collection)
   * Used by repository layer to populate members after loading space document
   */
  public setMembers(members: Array<{ profileId: ProfileId; role: SpaceMemberRole; joinedAt: Date }>): void {
    (this.props as any).members = members.map(m => ({
      profileId: m.profileId,
      role: m.role,
      joinedAt: m.joinedAt
    }));
  }

  // ============================================================
  // Tab Management Methods (Phase 1 - DDD Foundation)
  // ============================================================

  /**
   * Get a tab by its ID
   */
  public getTabById(tabId: string): Tab | undefined {
    return this.props.tabs.find(t => t.id === tabId);
  }

  /**
   * Update a tab's properties
   */
  public updateTab(
    tabId: string,
    updates: { name?: string; order?: number; isVisible?: boolean }
  ): Result<void> {
    const tab = this.getTabById(tabId);
    if (!tab) {
      return Result.fail<void>(`Tab with ID "${tabId}" not found`);
    }

    // Can't hide the default tab
    if (updates.isVisible === false && tab.isDefault) {
      return Result.fail<void>('Cannot hide the default tab');
    }

    const updateResult = tab.update(updates);
    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.error ?? 'Tab update failed');
    }

    const { changedFields } = updateResult.getValue();
    if (changedFields.length > 0) {
      this.addDomainEvent(new TabUpdatedEvent(this.id, tabId, changedFields));
      this.updateLastActivity();
    }

    return Result.ok<void>();
  }

  /**
   * Remove a tab from the space
   * Cannot remove the default tab
   */
  public removeTab(tabId: string): Result<void> {
    const tabIndex = this.props.tabs.findIndex(t => t.id === tabId);
    if (tabIndex === -1) {
      return Result.fail<void>(`Tab with ID "${tabId}" not found`);
    }

    const tab = this.props.tabs[tabIndex];
    if (!tab) {
      return Result.fail<void>('Tab not found');
    }

    // Cannot remove the default tab
    if (tab.isDefault) {
      return Result.fail<void>('Cannot remove the default tab');
    }

    // Remove any widget associations from this tab
    const widgetIds = tab.widgets;

    // Remove the tab
    const removedTab = this.props.tabs.splice(tabIndex, 1)[0];
    if (removedTab) {
      this.addDomainEvent(new TabRemovedEvent(this.id, tabId, removedTab.name));
    }

    // Emit events for detached widgets
    for (const widgetId of widgetIds) {
      this.addDomainEvent(new WidgetDetachedFromTabEvent(this.id, widgetId, tabId));
    }

    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Reorder tabs by providing ordered list of tab IDs
   */
  public reorderTabs(orderedIds: string[]): Result<void> {
    // Validate all IDs exist
    const existingIds = new Set(this.props.tabs.map(t => t.id));
    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        return Result.fail<void>(`Tab with ID "${id}" not found`);
      }
    }

    // Ensure all tabs are included
    if (orderedIds.length !== this.props.tabs.length) {
      return Result.fail<void>('All tab IDs must be included in the reorder');
    }

    // Apply new order
    for (let i = 0; i < orderedIds.length; i++) {
      const tab = this.getTabById(orderedIds[i] as string);
      if (tab) {
        tab.setOrder(i);
      }
    }

    // Sort tabs array by order
    this.props.tabs.sort((a, b) => a.order - b.order);

    this.addDomainEvent(new TabsReorderedEvent(this.id, orderedIds));
    this.updateLastActivity();
    return Result.ok<void>();
  }

  // ============================================================
  // Widget Management Methods (Phase 1 - DDD Foundation)
  // ============================================================

  /**
   * Get a widget by its ID
   */
  public getWidgetById(widgetId: string): Widget | undefined {
    return this.props.widgets.find(w => w.id === widgetId);
  }

  /**
   * Update a widget's properties
   */
  public updateWidget(
    widgetId: string,
    updates: {
      title?: string;
      config?: Record<string, any>;
      order?: number;
      isVisible?: boolean;
      isEnabled?: boolean;
    }
  ): Result<void> {
    const widget = this.getWidgetById(widgetId);
    if (!widget) {
      return Result.fail<void>(`Widget with ID "${widgetId}" not found`);
    }

    const updateResult = widget.update(updates);
    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.error ?? 'Widget update failed');
    }

    const { changedFields } = updateResult.getValue();
    if (changedFields.length > 0) {
      this.addDomainEvent(new WidgetUpdatedEvent(this.id, widgetId, changedFields));
      this.updateLastActivity();
    }

    return Result.ok<void>();
  }

  /**
   * Remove a widget from the space
   * Also removes it from any tabs it's attached to
   */
  public removeWidget(widgetId: string): Result<void> {
    const widgetIndex = this.props.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) {
      return Result.fail<void>(`Widget with ID "${widgetId}" not found`);
    }

    const widget = this.props.widgets[widgetIndex];
    if (!widget) {
      return Result.fail<void>('Widget not found');
    }

    // Remove widget from all tabs that contain it
    for (const tab of this.props.tabs) {
      if (tab.widgets.includes(widgetId)) {
        tab.removeWidget(widgetId);
        this.addDomainEvent(new WidgetDetachedFromTabEvent(this.id, widgetId, tab.id));
      }
    }

    // Remove the widget
    this.props.widgets.splice(widgetIndex, 1);
    this.addDomainEvent(new WidgetRemovedEvent(this.id, widgetId, widget.title));
    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Attach a widget to a tab
   */
  public attachWidgetToTab(widgetId: string, tabId: string): Result<void> {
    const widget = this.getWidgetById(widgetId);
    if (!widget) {
      return Result.fail<void>(`Widget with ID "${widgetId}" not found`);
    }

    const tab = this.getTabById(tabId);
    if (!tab) {
      return Result.fail<void>(`Tab with ID "${tabId}" not found`);
    }

    // Check if already attached
    if (tab.widgets.includes(widgetId)) {
      return Result.ok<void>(); // Already attached, no-op
    }

    tab.addWidget(widgetId);
    this.addDomainEvent(new WidgetAttachedToTabEvent(this.id, widgetId, tabId));
    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Detach a widget from a tab
   */
  public detachWidgetFromTab(widgetId: string, tabId: string): Result<void> {
    const tab = this.getTabById(tabId);
    if (!tab) {
      return Result.fail<void>(`Tab with ID "${tabId}" not found`);
    }

    if (!tab.widgets.includes(widgetId)) {
      return Result.ok<void>(); // Not attached, no-op
    }

    tab.removeWidget(widgetId);
    this.addDomainEvent(new WidgetDetachedFromTabEvent(this.id, widgetId, tabId));
    this.updateLastActivity();
    return Result.ok<void>();
  }

  // ============================================================
  // PlacedTool Management Methods (HiveLab Integration)
  // ============================================================

  /**
   * Get a placed tool by its ID
   */
  public getPlacedToolById(placementId: string): PlacedTool | undefined {
    return this.props.placedTools.find(t => t.id === placementId);
  }

  /**
   * Get a placed tool by the tool ID it references
   */
  public getPlacedToolByToolId(toolId: string): PlacedTool | undefined {
    return this.props.placedTools.find(t => t.toolId === toolId);
  }

  /**
   * Get all placed tools for a specific location
   */
  public getPlacedToolsByLocation(location: PlacementLocation): PlacedTool[] {
    return this.props.placedTools
      .filter(t => t.placement === location)
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Place a new tool in the space
   */
  public placeTool(props: {
    toolId: string;
    placement: PlacementLocation;
    order?: number;
    placedBy: string | null;
    source?: 'system' | 'leader' | 'member';
    configOverrides?: Record<string, unknown>;
    visibility?: PlacementVisibility;
    titleOverride?: string | null;
    isEditable?: boolean;
  }): Result<PlacedTool> {
    // Check if tool is already placed (prevent duplicates)
    const existing = this.getPlacedToolByToolId(props.toolId);
    if (existing) {
      return Result.fail<PlacedTool>(`Tool "${props.toolId}" is already placed in this space`);
    }

    // Calculate order if not provided
    const locationTools = this.getPlacedToolsByLocation(props.placement);
    const order = props.order ?? locationTools.length;

    const toolResult = PlacedTool.create({
      toolId: props.toolId,
      spaceId: this.id,
      placement: props.placement,
      order,
      placedBy: props.placedBy,
      source: props.source ?? (props.placedBy ? 'leader' : 'system'),
      configOverrides: props.configOverrides ?? {},
      visibility: props.visibility ?? 'all',
      titleOverride: props.titleOverride ?? null,
      isEditable: props.isEditable ?? true,
    });

    if (toolResult.isFailure) {
      return Result.fail<PlacedTool>(toolResult.error ?? 'Failed to create placed tool');
    }

    const placedTool = toolResult.getValue();
    this.props.placedTools.push(placedTool);
    this.addDomainEvent(new ToolPlacedEvent(
      this.id,
      placedTool.id,
      placedTool.toolId,
      placedTool.placement,
      placedTool.placedBy,
      placedTool.source
    ));
    this.updateLastActivity();

    return Result.ok<PlacedTool>(placedTool);
  }

  /**
   * Place a system tool from a template
   */
  public placeSystemTool(
    toolId: string,
    placement: PlacementLocation,
    options?: {
      order?: number;
      configOverrides?: Record<string, unknown>;
      visibility?: PlacementVisibility;
      isEditable?: boolean;
    }
  ): Result<PlacedTool> {
    return this.placeTool({
      toolId,
      placement,
      order: options?.order,
      placedBy: null,
      source: 'system',
      configOverrides: options?.configOverrides,
      visibility: options?.visibility,
      isEditable: options?.isEditable ?? true,
    });
  }

  /**
   * Auto-deploy default system tools based on space type.
   * Called automatically for pre-seeded spaces or when a space goes live.
   *
   * @returns Array of successfully placed tools
   */
  public autoDeploySystemTools(): PlacedTool[] {
    const systemTools = getSystemToolsForType(this.spaceType);
    const placedTools: PlacedTool[] = [];

    for (const toolDef of systemTools) {
      // Skip if tool already placed
      if (this.hasToolPlaced(toolDef.toolId)) {
        continue;
      }

      const result = this.placeSystemTool(toolDef.toolId, toolDef.placement, {
        order: toolDef.order,
        visibility: toolDef.visibility,
        isEditable: toolDef.isEditable,
      });

      if (result.isSuccess) {
        placedTools.push(result.getValue());
      }
    }

    return placedTools;
  }

  /**
   * Check if a tool is already placed in this space
   */
  public hasToolPlaced(toolId: string): boolean {
    return this.props.placedTools.some(pt => pt.toolId === toolId);
  }

  /**
   * Update a placed tool's properties
   */
  public updatePlacedTool(
    placementId: string,
    updates: {
      order?: number;
      isActive?: boolean;
      placement?: PlacementLocation;
      configOverrides?: Record<string, unknown>;
      visibility?: PlacementVisibility;
      titleOverride?: string | null;
    }
  ): Result<void> {
    const placedTool = this.getPlacedToolById(placementId);
    if (!placedTool) {
      return Result.fail<void>(`Placed tool with ID "${placementId}" not found`);
    }

    // Check if editable
    if (!placedTool.canBeModified) {
      return Result.fail<void>('This tool placement is locked and cannot be modified');
    }

    const updateResult = placedTool.update(updates);
    if (updateResult.isFailure) {
      return Result.fail<void>(updateResult.error ?? 'Update failed');
    }

    const { changedFields } = updateResult.getValue();
    if (changedFields.length > 0) {
      this.addDomainEvent(new PlacedToolUpdatedEvent(this.id, placementId, changedFields));
      this.updateLastActivity();
    }

    return Result.ok<void>();
  }

  /**
   * Remove a placed tool from the space
   */
  public removePlacedTool(placementId: string): Result<void> {
    const toolIndex = this.props.placedTools.findIndex(t => t.id === placementId);
    if (toolIndex === -1) {
      return Result.fail<void>(`Placed tool with ID "${placementId}" not found`);
    }

    const placedTool = this.props.placedTools[toolIndex];
    if (!placedTool) {
      return Result.fail<void>('Placed tool not found');
    }

    // Check if editable (system tools can be removed if isEditable is true)
    if (!placedTool.canBeModified) {
      return Result.fail<void>('This tool placement is locked and cannot be removed');
    }

    this.props.placedTools.splice(toolIndex, 1);
    this.addDomainEvent(new ToolRemovedEvent(this.id, placementId, placedTool.toolId));
    this.updateLastActivity();

    return Result.ok<void>();
  }

  /**
   * Activate a placed tool
   */
  public activatePlacedTool(placementId: string): Result<void> {
    const placedTool = this.getPlacedToolById(placementId);
    if (!placedTool) {
      return Result.fail<void>(`Placed tool with ID "${placementId}" not found`);
    }

    if (placedTool.isActive) {
      return Result.ok<void>(); // Already active
    }

    placedTool.activate();
    this.addDomainEvent(new PlacedToolActivatedEvent(this.id, placementId, placedTool.toolId));
    this.updateLastActivity();

    return Result.ok<void>();
  }

  /**
   * Deactivate a placed tool (hide without removing)
   */
  public deactivatePlacedTool(placementId: string): Result<void> {
    const placedTool = this.getPlacedToolById(placementId);
    if (!placedTool) {
      return Result.fail<void>(`Placed tool with ID "${placementId}" not found`);
    }

    if (!placedTool.isActive) {
      return Result.ok<void>(); // Already inactive
    }

    placedTool.deactivate();
    this.addDomainEvent(new PlacedToolDeactivatedEvent(this.id, placementId, placedTool.toolId));
    this.updateLastActivity();

    return Result.ok<void>();
  }

  /**
   * Reorder placed tools within a placement location
   */
  public reorderPlacedTools(placement: PlacementLocation, orderedIds: string[]): Result<void> {
    const locationTools = this.getPlacedToolsByLocation(placement);
    const existingIds = new Set(locationTools.map(t => t.id));

    // Validate all IDs exist in this location
    for (const id of orderedIds) {
      if (!existingIds.has(id)) {
        return Result.fail<void>(`Placed tool "${id}" not found in ${placement} location`);
      }
    }

    // Ensure all tools are included
    if (orderedIds.length !== locationTools.length) {
      return Result.fail<void>('All tool IDs in the location must be included');
    }

    // Apply new order
    for (let i = 0; i < orderedIds.length; i++) {
      const tool = this.getPlacedToolById(orderedIds[i] as string);
      if (tool) {
        tool.reorder(i);
      }
    }

    this.addDomainEvent(new PlacedToolsReorderedEvent(this.id, placement, orderedIds));
    this.updateLastActivity();

    return Result.ok<void>();
  }

  /**
   * Update the runtime state of a placed tool
   */
  public updatePlacedToolState(
    placementId: string,
    state: Record<string, unknown>,
    replace: boolean = false
  ): Result<void> {
    const placedTool = this.getPlacedToolById(placementId);
    if (!placedTool) {
      return Result.fail<void>(`Placed tool with ID "${placementId}" not found`);
    }

    if (replace) {
      placedTool.replaceState(state);
    } else {
      placedTool.updateState(state);
    }

    // Don't emit event for state updates (too noisy) but update activity
    this.updateLastActivity();

    return Result.ok<void>();
  }

  /**
   * Set placed tools from external data (repository layer)
   */
  public setPlacedTools(tools: PlacedTool[]): void {
    (this.props as any).placedTools = tools;
  }

  // ============================================================
  // Stealth Mode / Publishing Status Methods
  // ============================================================

  /**
   * Transition space from stealth to live.
   *
   * This is typically called when a platform admin verifies the space leader.
   * While in stealth mode, the leader can fully use the space (post, events,
   * invite specific people) - they get instant value. Once verified, the space
   * becomes publicly discoverable.
   *
   * @param verifiedBy - The admin or system that verified the leader
   */
  public goLive(verifiedBy: ProfileId): Result<void> {
    // Must be in stealth mode
    if (this.props.publishStatus !== 'stealth') {
      return Result.fail<void>(`Cannot go live from ${this.props.publishStatus} status`);
    }

    const previousStatus = this.props.publishStatus;
    this.props.publishStatus = 'live';
    this.props.wentLiveAt = new Date();
    this.props.isVerified = true; // Mark as verified when going live
    this.updateLastActivity();

    this.addDomainEvent(new SpaceStatusChangedEvent(
      this.id,
      previousStatus,
      'live',
      verifiedBy.value
    ));

    this.addDomainEvent(new SpaceWentLiveEvent(
      this.id,
      this.props.name.name,
      verifiedBy.value
    ));

    return Result.ok<void>();
  }

  /**
   * Admin verifies a leader and takes the space live in one action.
   * This is the typical flow: admin reviews leader request → approves → space goes live.
   */
  public verifyLeaderAndGoLive(
    leaderProfileId: ProfileId,
    verifiedBy: ProfileId
  ): Result<void> {
    // Verify the leader exists as owner/admin
    const leader = this.props.members.find(
      m => m.profileId.value === leaderProfileId.value &&
           (m.role === 'owner' || m.role === 'admin')
    );

    if (!leader) {
      return Result.fail<void>('Leader not found in space');
    }

    // Take the space live
    return this.goLive(verifiedBy);
  }

  /**
   * Reject the space (stealth → rejected)
   * Used when admin rejects a leader request
   */
  public reject(rejectedBy: ProfileId, reason?: string): Result<void> {
    if (this.props.publishStatus === 'rejected') {
      return Result.fail<void>('Space is already rejected');
    }

    const previousStatus = this.props.publishStatus;
    this.props.publishStatus = 'rejected';
    this.updateLastActivity();

    this.addDomainEvent(new SpaceStatusChangedEvent(
      this.id,
      previousStatus,
      'rejected',
      rejectedBy.value,
      reason
    ));

    return Result.ok<void>();
  }

  /**
   * Reset to stealth mode (admin action)
   */
  public resetToStealth(resetBy: ProfileId, reason?: string): Result<void> {
    if (this.props.publishStatus === 'stealth') {
      return Result.fail<void>('Space is already in stealth mode');
    }

    const previousStatus = this.props.publishStatus;
    this.props.publishStatus = 'stealth';
    this.props.wentLiveAt = undefined;
    this.updateLastActivity();

    this.addDomainEvent(new SpaceStatusChangedEvent(
      this.id,
      previousStatus,
      'stealth',
      resetBy.value,
      reason
    ));

    return Result.ok<void>();
  }

  /**
   * Set publish status from external data (repository layer)
   */
  public setPublishStatus(status: SpacePublishStatus): void {
    (this.props as any).publishStatus = status;
  }

  /**
   * Set wentLiveAt from external data (repository layer)
   */
  public setWentLiveAt(date: Date | undefined): void {
    (this.props as any).wentLiveAt = date;
  }

  // ============================================================
  // Space Claiming Methods
  // ============================================================

  /**
   * Claim an unclaimed space.
   * This sets the claimer as owner and transitions status to 'claimed'.
   * Initializes setup progress tracking for leader onboarding.
   */
  public claim(claimedBy: ProfileId): Result<void> {
    if (this.isClaimed) {
      return Result.fail<void>('Space is already claimed');
    }

    // Add the claimer as owner
    this.props.members.push({
      profileId: claimedBy,
      role: 'owner',
      joinedAt: new Date()
    });

    // Update status
    this.props.status = 'claimed';
    this.props.claimedAt = new Date();
    this.props.createdBy = claimedBy;

    // Transition to stealth for setup
    this.props.publishStatus = 'stealth';

    // Initialize setup progress for leader onboarding
    this.props.setupProgress = {
      welcomeMessagePosted: false,
      firstToolDeployed: false,
      coLeaderInvited: false,
      minimumMembersTarget: 5,
      isComplete: false,
    };

    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Submit a claim request with enhanced verification info.
   * This creates a pending claim request that can be verified by admins.
   * Grants provisional access immediately so leaders can start setting up.
   */
  public submitClaimRequest(props: {
    profileId: ProfileId;
    role: string;
    proofType: LeaderProofType;
    proofUrl?: string;
  }): Result<void> {
    if (this.isClaimed) {
      return Result.fail<void>('Space is already claimed');
    }

    // Check for existing pending request from this user
    const existingRequest = this.props.leaderRequests.find(
      r => r.profileId.value === props.profileId.value && r.status === 'pending'
    );
    if (existingRequest) {
      return Result.fail<void>('A claim request is already pending for this user');
    }

    const request: LeaderRequest = {
      profileId: props.profileId,
      status: 'pending',
      requestedAt: new Date(),
      role: props.role,
      proofType: props.proofType,
      proofUrl: props.proofUrl,
      provisionalAccessGranted: true,
      provisionalAccessAt: new Date(),
    };

    this.props.leaderRequests.push(request);

    // Grant provisional access immediately - add as owner but with pending verification
    this.props.members.push({
      profileId: props.profileId,
      role: 'owner',
      joinedAt: new Date()
    });

    // Update status to show claim in progress
    this.props.status = 'claimed';
    this.props.claimedAt = new Date();
    this.props.createdBy = props.profileId;
    this.props.publishStatus = 'stealth';

    // Initialize setup progress
    this.props.setupProgress = {
      welcomeMessagePosted: false,
      firstToolDeployed: false,
      coLeaderInvited: false,
      minimumMembersTarget: 5,
      isComplete: false,
    };

    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Check if a user has provisional access (pending verification)
   */
  public hasProvisionalAccess(profileId: ProfileId): boolean {
    const request = this.props.leaderRequests.find(
      r => r.profileId.value === profileId.value && r.status === 'pending'
    );
    return !!request?.provisionalAccessGranted;
  }

  /**
   * Verify a pending claim request (admin action)
   */
  public verifyClaimRequest(
    profileId: ProfileId,
    verifiedBy: ProfileId
  ): Result<void> {
    const request = this.props.leaderRequests.find(
      r => r.profileId.value === profileId.value && r.status === 'pending'
    );

    if (!request) {
      return Result.fail<void>('No pending claim request found');
    }

    request.status = 'approved';
    request.reviewedBy = verifiedBy;
    request.reviewedAt = new Date();

    // Update space status to verified
    this.props.status = 'verified';

    this.updateLastActivity();
    return Result.ok<void>();
  }

  // ============================================================
  // Setup Progress Tracking Methods
  // ============================================================

  /**
   * Mark that the leader has posted a welcome message
   */
  public markWelcomeMessagePosted(): Result<void> {
    if (!this.props.setupProgress) {
      return Result.fail<void>('Setup progress not initialized (space not claimed)');
    }

    if (this.props.setupProgress.welcomeMessagePosted) {
      return Result.ok<void>(); // Already marked
    }

    this.props.setupProgress.welcomeMessagePosted = true;
    this.props.setupProgress.welcomeMessageAt = new Date();
    this.checkAndUpdateSetupCompletion();
    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Mark that the leader has deployed their first tool
   */
  public markFirstToolDeployed(): Result<void> {
    if (!this.props.setupProgress) {
      return Result.fail<void>('Setup progress not initialized (space not claimed)');
    }

    if (this.props.setupProgress.firstToolDeployed) {
      return Result.ok<void>(); // Already marked
    }

    this.props.setupProgress.firstToolDeployed = true;
    this.props.setupProgress.firstToolAt = new Date();
    this.checkAndUpdateSetupCompletion();
    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Mark that the leader has invited a co-leader
   */
  public markCoLeaderInvited(): Result<void> {
    if (!this.props.setupProgress) {
      return Result.fail<void>('Setup progress not initialized (space not claimed)');
    }

    if (this.props.setupProgress.coLeaderInvited) {
      return Result.ok<void>(); // Already marked
    }

    this.props.setupProgress.coLeaderInvited = true;
    this.props.setupProgress.coLeaderAt = new Date();
    this.checkAndUpdateSetupCompletion();
    this.updateLastActivity();
    return Result.ok<void>();
  }

  /**
   * Check if setup is complete and update the flag
   * Called automatically when any progress is made
   */
  private checkAndUpdateSetupCompletion(): void {
    if (!this.props.setupProgress) return;

    const { welcomeMessagePosted, firstToolDeployed, coLeaderInvited, minimumMembersTarget } = this.props.setupProgress;
    const hasEnoughMembers = this.memberCount >= minimumMembersTarget;

    // Setup is complete when all criteria are met
    const isComplete = welcomeMessagePosted && firstToolDeployed && coLeaderInvited && hasEnoughMembers;

    if (isComplete && !this.props.setupProgress.isComplete) {
      this.props.setupProgress.isComplete = true;
      this.props.setupProgress.completedAt = new Date();
    }
  }

  /**
   * Get setup progress as a percentage (0-100)
   */
  public getSetupProgressPercentage(): number {
    if (!this.props.setupProgress) return 0;

    const { welcomeMessagePosted, firstToolDeployed, coLeaderInvited, minimumMembersTarget } = this.props.setupProgress;
    const hasEnoughMembers = this.memberCount >= minimumMembersTarget;

    const criteria = [welcomeMessagePosted, firstToolDeployed, coLeaderInvited, hasEnoughMembers];
    const completed = criteria.filter(Boolean).length;
    return Math.round((completed / criteria.length) * 100);
  }

  /**
   * Set setup progress from external data (repository layer)
   */
  public setSetupProgress(progress: SetupProgress | undefined): void {
    (this.props as any).setupProgress = progress;
  }

  /**
   * Set space type from external data (repository layer)
   */
  public setSpaceType(spaceType: SpaceType): void {
    (this.props as any).spaceType = spaceType;
  }

  /**
   * Set governance from external data (repository layer)
   */
  public setGovernance(governance: GovernanceModel): void {
    (this.props as any).governance = governance;
  }

  /**
   * Set status from external data (repository layer)
   */
  public setStatus(status: SpaceStatus): void {
    (this.props as any).status = status;
  }

  /**
   * Set source from external data (repository layer)
   */
  public setSource(source: SpaceSource): void {
    (this.props as any).source = source;
  }

  /**
   * Set external ID from external data (repository layer)
   */
  public setExternalId(externalId: string | undefined): void {
    (this.props as any).externalId = externalId;
  }

  /**
   * Set claimedAt from external data (repository layer)
   */
  public setClaimedAt(date: Date | undefined): void {
    (this.props as any).claimedAt = date;
  }

  // ============================================================
  // Basic Info Update (Phase 1 - DDD Foundation)
  // ============================================================

  /**
   * Update basic space info (name, description, visibility, settings)
   * This is for the PATCH /api/spaces/[spaceId] refactor
   */
  public updateBasicInfo(
    updates: {
      name?: SpaceName;
      description?: SpaceDescription;
      visibility?: 'public' | 'private';
      settings?: Partial<SpaceSettings>;
    },
    updatedBy: string
  ): Result<void> {
    const changedFields: string[] = [];

    if (updates.name !== undefined && updates.name.value !== this.props.name.value) {
      this.props.name = updates.name;
      changedFields.push('name');
    }

    if (updates.description !== undefined && updates.description.value !== this.props.description.value) {
      this.props.description = updates.description;
      changedFields.push('description');
    }

    if (updates.visibility !== undefined && updates.visibility !== this.props.visibility) {
      this.props.visibility = updates.visibility;
      // Keep settings.isPublic in sync
      this.props.settings.isPublic = updates.visibility === 'public';
      changedFields.push('visibility');
    }

    if (updates.settings !== undefined) {
      this.props.settings = { ...this.props.settings, ...updates.settings };
      changedFields.push('settings');
    }

    if (changedFields.length > 0) {
      this.addDomainEvent(new SpaceUpdatedEvent(this.id, changedFields, updatedBy));
      this.updateLastActivity();
    }

    return Result.ok<void>();
  }

  // ============================================================
  // Enhanced addTab and addWidget with events
  // ============================================================

  /**
   * Create and add a new tab to the space
   * Emits TabCreatedEvent
   */
  public createTab(props: {
    name: string;
    type: 'feed' | 'widget' | 'resource' | 'custom';
    order?: number;
    isVisible?: boolean;
  }): Result<Tab> {
    // Check for duplicate name
    if (this.props.tabs.find(t => t.name.toLowerCase() === props.name.toLowerCase())) {
      return Result.fail<Tab>('Tab with this name already exists');
    }

    // Determine order if not provided
    const order = props.order ?? this.props.tabs.length;

    const tabResult = Tab.create({
      name: props.name,
      type: props.type,
      isDefault: false,
      order,
      widgets: [],
      isVisible: props.isVisible ?? true,
    });

    if (tabResult.isFailure) {
      return Result.fail<Tab>(tabResult.error ?? 'Tab creation failed');
    }

    const tab = tabResult.getValue();
    this.props.tabs.push(tab);
    this.addDomainEvent(new TabCreatedEvent(this.id, tab.id, tab.name, tab.type));
    this.updateLastActivity();

    return Result.ok<Tab>(tab);
  }

  /**
   * Create and add a new widget to the space
   * Emits WidgetCreatedEvent
   */
  public createWidget(props: {
    type: 'calendar' | 'poll' | 'links' | 'files' | 'rss' | 'custom';
    title: string;
    config?: Record<string, any>;
    order?: number;
    position?: { x: number; y: number; width: number; height: number };
  }): Result<Widget> {
    const order = props.order ?? this.props.widgets.length;

    const widgetResult = Widget.create({
      type: props.type,
      title: props.title,
      config: props.config ?? {},
      order,
      position: props.position,
      isVisible: true,
      isEnabled: true,
    });

    if (widgetResult.isFailure) {
      return Result.fail<Widget>(widgetResult.error ?? 'Widget creation failed');
    }

    const widget = widgetResult.getValue();
    this.props.widgets.push(widget);
    this.addDomainEvent(new WidgetCreatedEvent(this.id, widget.id, widget.type, widget.title));
    this.updateLastActivity();

    return Result.ok<Widget>(widget);
  }

  public toData(): any {
    return {
      id: this.id,
      spaceId: this.props.spaceId,
      name: this.props.name,
      slug: this.props.slug?.value,
      description: this.props.description,
      category: this.props.category,
      campusId: this.props.campusId,
      createdBy: this.props.createdBy?.value,
      ownerId: this.owner?.value,
      members: this.props.members.map(m => ({
        profileId: m.profileId.value,
        role: m.role,
        joinedAt: m.joinedAt
      })),
      leaderRequests: this.props.leaderRequests.map(r => ({
        profileId: r.profileId.value,
        status: r.status,
        requestedAt: r.requestedAt,
        role: r.role,
        proofType: r.proofType,
        proofUrl: r.proofUrl,
        reason: r.reason,
        reviewedBy: r.reviewedBy?.value,
        reviewedAt: r.reviewedAt,
        rejectionReason: r.rejectionReason,
        provisionalAccessGranted: r.provisionalAccessGranted,
        provisionalAccessAt: r.provisionalAccessAt,
      })),
      tabs: this.props.tabs,
      widgets: this.props.widgets,
      placedTools: this.props.placedTools.map(t => ({
        id: t.id,
        toolId: t.toolId,
        spaceId: t.spaceId,
        placement: t.placement,
        order: t.order,
        isActive: t.isActive,
        source: t.source,
        placedBy: t.placedBy,
        placedAt: t.placedAt,
        configOverrides: t.configOverrides,
        visibility: t.visibility,
        titleOverride: t.titleOverride,
        isEditable: t.isEditable,
        state: t.state,
        stateUpdatedAt: t.stateUpdatedAt,
      })),
      settings: this.props.settings,
      visibility: this.props.visibility,
      // New fields
      spaceType: this.props.spaceType,
      governance: this.props.governance,
      status: this.props.status,
      source: this.props.source,
      externalId: this.props.externalId,
      claimedAt: this.props.claimedAt,
      // Existing fields
      publishStatus: this.props.publishStatus,
      wentLiveAt: this.props.wentLiveAt,
      isStealth: this.isStealth,
      isLive: this.isLive,
      isUnclaimed: this.isUnclaimed,
      isClaimed: this.isClaimed,
      hasOwner: this.hasOwner,
      setupProgress: this.props.setupProgress,
      setupProgressPercentage: this.getSetupProgressPercentage(),
      isSetupComplete: this.isSetupComplete,
      isActive: this.props.isActive,
      isVerified: this.props.isVerified,
      memberCount: this.memberCount,
      postCount: this.props.postCount,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      lastActivityAt: this.props.lastActivityAt
    };
  }
}