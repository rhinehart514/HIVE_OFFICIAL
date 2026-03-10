import type { Tool as DomainTool } from '../../domain/creation/tool';
import type { ElementInstance as DomainElementInstance } from '../../domain/creation/elements';

/**
 * Temporary type exports for backward compatibility
 * These re-export from proper domain models
 * This file will be deleted once all references are updated
 */

// Re-export from proper domain models
export { ProfileId } from '../../domain/profile/value-objects/profile-id.value';
export { SpaceId } from '../../domain/spaces/value-objects/space-id.value';
export { SpaceName } from '../../domain/spaces/value-objects/space-name.value';
export { RitualId } from '../../domain/rituals/value-objects/ritual-id.value';
export { CampusId } from '../../domain/profile/value-objects/campus-id.value';
export { ConnectionId } from '../../domain/profile/value-objects/connection-id.value';

// Re-export aggregates
export { EnhancedRitual } from '../../domain/rituals/aggregates/enhanced-ritual';
export { EnhancedSpace } from '../../domain/spaces/aggregates/enhanced-space';
export { EnhancedProfile } from '../../domain/profile/aggregates/enhanced-profile';
export { Connection } from '../../domain/profile/aggregates/connection';

// Re-export entities and types
export { FeedItem } from '../../domain/feed/feed-item';
export type { Milestone, Reward } from '../../domain/rituals/aggregates/enhanced-ritual';

// Profile utility functions
export function getProfileCompleteness(profile: Record<string, unknown>): number {
  if (!profile) return 0;

  const requiredFields = ['displayName', 'email', 'handle'];
  const optionalFields = ['bio', 'photoURL', 'major', 'year', 'interests'];

  let completed = 0;
  const totalFields = requiredFields.length + optionalFields.length;

  requiredFields.forEach(field => {
    if (profile[field]) completed++;
  });

  optionalFields.forEach(field => {
    if (profile[field]) completed++;
  });

  return Math.round((completed / totalFields) * 100);
}

// Authentication utilities
export function getDefaultActionCodeSettings(continueUrl?: string) {
  return {
    url: continueUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://hive-official.vercel.app',
    handleCodeInApp: true,
    dynamicLinkDomain: undefined
  };
}

export function validateEmailDomain(email: string, allowedDomains: string[] = ['buffalo.edu']): boolean {
  const domain = email.split('@')[1];
  if (!domain) return false;
  return allowedDomains.includes(domain);
}

// Legacy types that need migration (kept temporarily)
export interface Feed {
  userId: string;
  lastUpdated: Date;
  toData?: () => Record<string, unknown>;
}

export interface PostContent {
  text: string;
  mediaUrls: string[];
}

// These classes provide backward compatibility wrappers
export class FeedFilter {
  constructor(public type: string, public value: string | null) {}

  static create(type: string) {
    return {
      isSuccess: true,
      isFailure: false,
      getValue: () => new FeedFilter(type, null),
      error: null
    };
  }
}

export class Ritual {
  public participants: number = 0;
  public isActive: boolean = true;
  public settings: { isVisible: boolean } = { isVisible: true };
  public startDate?: Date;
  public endDate?: Date;

  constructor(
    public id: string,
    public name: string,
    public description: string,
    public milestones: Array<{ id: string; name: string; description: string; targetValue: number }>
  ) {}

  static create(data: {
    id: string;
    name: string;
    description: string;
    milestones?: Array<{ id: string; name: string; description: string; targetValue: number }>;
    participants?: number;
    isActive?: boolean;
    settings?: { isVisible: boolean };
    startDate?: Date;
    endDate?: Date;
  }) {
    return {
      isSuccess: true,
      isFailure: false,
      getValue: () => {
        const ritual = new Ritual(data.id, data.name, data.description, data.milestones || []);
        ritual.participants = data.participants || 0;
        ritual.isActive = data.isActive !== undefined ? data.isActive : true;
        ritual.settings = data.settings || { isVisible: true };
        ritual.startDate = data.startDate;
        ritual.endDate = data.endDate;
        return ritual;
      },
      error: null
    };
  }

  addParticipant(profileId: string) {
    this.participants++;
    return { isSuccess: true, isFailure: false };
  }

  updateMilestoneProgress(milestoneId: string, progress: number) {
    return { isSuccess: true, isFailure: false };
  }

  toData() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      milestones: this.milestones,
      participants: this.participants,
      isActive: this.isActive,
      settings: this.settings,
      startDate: this.startDate,
      endDate: this.endDate
    };
  }
}

export class Participation {
  public streak: number = 0;
  public achievements: string[] = [];
  public totalPoints: number = 0;

  constructor(
    public id: string,
    public profileId: string,
    public ritualId: string,
    public completedMilestones: string[] = [],
    public progress: number = 0
  ) {}

  static create(data: {
    id: string;
    profileId: string;
    ritualId: string;
    completedMilestones?: string[];
    progress?: number;
    streak?: number;
    achievements?: string[];
    totalPoints?: number;
  }) {
    return {
      isSuccess: true,
      isFailure: false,
      getValue: () => {
        const participation = new Participation(
          data.id,
          data.profileId,
          data.ritualId,
          data.completedMilestones || [],
          data.progress || 0
        );
        participation.streak = data.streak || 0;
        participation.achievements = data.achievements || [];
        participation.totalPoints = data.totalPoints || 0;
        return participation;
      },
      error: null
    };
  }

  toData() {
    return {
      id: this.id,
      profileId: this.profileId,
      ritualId: this.ritualId,
      completedMilestones: this.completedMilestones,
      progress: this.progress,
      streak: this.streak,
      achievements: this.achievements,
      totalPoints: this.totalPoints
    };
  }

  updateMilestoneProgress(milestoneId: string, progress: number) {
    this.progress = progress;
    return { isSuccess: true, isFailure: false };
  }

  completeMilestone(milestoneId: string) {
    if (!this.completedMilestones.includes(milestoneId)) {
      this.completedMilestones.push(milestoneId);
    }
    return { isSuccess: true, isFailure: false };
  }
}

// SpaceType enum for categorization
export enum SpaceType {
  GENERAL = 'general',
  ACADEMIC = 'academic',
  SOCIAL = 'social',
  PROFESSIONAL = 'professional',
  MARKETPLACE = 'marketplace',
  EVENT = 'event'
}

export class Space {
  public visibility: string = 'public';
  public memberCount: number = 0;
  public lastActivityAt: Date = new Date();
  public createdAt: Date = new Date();
  public spaceType: string = 'general';
  public posts: Array<Record<string, unknown>> = [];
  public settings: Record<string, unknown> = {};
  public members: Array<{ profileId: string | { id?: string; value?: string }; role: string }> = [];
  private memberSet: Set<string> = new Set();

  constructor(
    public id: string,
    public name: string,
    public description: string,
    public category: string,
    public campusId: string,
    public createdBy?: string
  ) {}

  static create(data: {
    id: string;
    name: string;
    description: string;
    category?: string;
    spaceType?: string;
    campusId: string;
    createdBy?: string;
    visibility?: string;
    memberCount?: number;
    lastActivityAt?: Date;
    createdAt?: Date;
    posts?: Array<Record<string, unknown>>;
    settings?: Record<string, unknown>;
    members?: Array<{ profileId: string | { id?: string; value?: string }; role: string }>;
  }) {
    return {
      isSuccess: true,
      isFailure: false,
      getValue: () => {
        const space = new Space(
          data.id,
          data.name,
          data.description,
          data.category || data.spaceType || 'general',
          data.campusId,
          data.createdBy
        );
        space.visibility = data.visibility || 'public';
        space.memberCount = data.memberCount || 0;
        space.lastActivityAt = data.lastActivityAt || new Date();
        space.createdAt = data.createdAt || new Date();
        space.spaceType = data.spaceType || 'general';
        space.posts = data.posts || [];
        space.settings = data.settings || {};
        space.members = data.members || [];
        return space;
      },
      error: null
    };
  }

  addMember(profileId: string | { id?: string; value?: string }) {
    const id = typeof profileId === 'string' ? profileId : (profileId.id || profileId.value || '');
    this.memberSet.add(id);
    if (!this.members.find(m => {
      const memberId = typeof m.profileId === 'string' ? m.profileId : (m.profileId.id || m.profileId.value || '');
      return memberId === id;
    })) {
      this.members.push({
        profileId: typeof profileId === 'string' ? profileId : profileId,
        role: 'member'
      });
    }
    this.memberCount = this.memberSet.size;
    return { isSuccess: true, isFailure: false };
  }

  removeMember(profileId: string | { id?: string; value?: string }) {
    const id = typeof profileId === 'string' ? profileId : (profileId.id || profileId.value || '');
    this.memberSet.delete(id);
    this.members = this.members.filter(m => {
      const memberId = typeof m.profileId === 'string' ? m.profileId : (m.profileId.id || m.profileId.value || '');
      return memberId !== id;
    });
    this.memberCount = this.memberSet.size;
    return { isSuccess: true, isFailure: false };
  }

  isMember(profileId: string | { id?: string; value?: string }): boolean {
    const id = typeof profileId === 'string' ? profileId : (profileId.id || profileId.value || '');
    return this.memberSet.has(id);
  }

  getAdminCount(): number {
    return this.members.filter(m => m.role === 'admin').length;
  }

  getMemberCount(): number {
    return this.memberCount;
  }

  toData() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      campusId: this.campusId,
      visibility: this.visibility,
      memberCount: this.memberCount,
      lastActivityAt: this.lastActivityAt,
      createdAt: this.createdAt,
      spaceType: this.spaceType,
      posts: this.posts,
      settings: this.settings,
      members: this.members
    };
  }
}

// Post type discriminator
export type PostType = 'text' | 'poll' | 'image' | 'tool_share' | 'event' | 'toolshare';

// Author metadata
export interface PostAuthor {
  id: string;
  name?: string;
  handle?: string;
  role?: string;
  photoURL?: string;
}

// Rich content with mentions
export interface RichContent {
  text?: string;
  mentions?: Array<{ handle: string; userId?: string }>;
  hashtags?: string[];
}

// Poll metadata
export interface PollMetadata {
  question: string;
  options: Array<{
    id: string;
    text: string;
    votes: number;
    voters?: string[];
  }>;
  totalVotes: number;
  expiresAt?: Date;
  allowMultiple?: boolean;
}

// Image metadata
export interface ImageMetadata {
  url: string;
  width?: number;
  height?: number;
  caption?: string;
  altText?: string;
}

// Tool share metadata
export interface ToolShareMetadata {
  toolId?: string;
  toolName?: string;
  shareType?: string;
  toolDescription?: string;
  toolCategory?: string;
}

// Reaction data
export interface PostReactions {
  heart?: number;
  thumbsUp?: number;
  fire?: number;
  celebrate?: number;
  [key: string]: number | undefined;
}

// Reacted users data
export interface ReactedUsers {
  heart?: string[];
  thumbsUp?: string[];
  fire?: string[];
  celebrate?: string[];
  [key: string]: string[] | undefined;
}

// Post type definition
export interface Post {
  id: string;
  spaceId: string;
  authorId: string;

  // Content variants
  content: string | {
    text: string;
    mediaUrls?: string[];
    mentions?: string[];
  };

  // Post type and metadata
  type?: PostType;
  author?: PostAuthor;
  richContent?: RichContent;
  pollMetadata?: PollMetadata;
  imageMetadata?: ImageMetadata;
  toolShareMetadata?: ToolShareMetadata;

  // Engagement metrics
  metadata?: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };
  reactions?: PostReactions;
  reactedUsers?: ReactedUsers;

  // Timestamps
  createdAt: Date | { toDate?: () => Date };
  updatedAt?: Date | { toDate?: () => Date };

  // Flags and visibility
  isPromoted?: boolean;
  isPinned?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  isFlagged?: boolean;
  visibility?: 'public' | 'members' | 'private';

  // Campus context
  campusId: string;

  // Allow additional properties for flexibility
  [key: string]: unknown;
}

// Event source configuration for RSS/Atom feeds
export interface EventSource {
  type: 'campuslabs' | 'presence' | 'generic_rss' | 'atom';
  url: string;
  enabled: boolean;
  lastSyncAt?: Date | { toDate?: () => Date };
  syncFrequency: 'daily' | 'weekly';
  hostMatchField?: string; // Field in RSS that maps to org names
}

// School type definition
export interface School {
  id: string;
  name: string;
  shortName?: string;
  domain: string; // Primary domain (kept for backwards compatibility)
  logo?: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  stats: {
    studentCount: number;
    facultyCount: number;
  };
  campusId: string;
  isActive: boolean; // Kept for backwards compatibility
  status: 'waitlist' | 'beta' | 'active' | 'suspended';
  createdAt: Date | { toDate?: () => Date };
  updatedAt?: Date | { toDate?: () => Date };

  // Email domain validation (multi-domain support)
  emailDomains: {
    student: string[];
    faculty: string[];
    staff: string[];
    alumni: string[];
  };

  // RSS/Atom event feed configuration
  eventSources: EventSource[];

  // Branding
  brandColors?: {
    primary: string;
    secondary: string;
  };

  // Capacity limits (for beta)
  maxUsers?: number;

  // Onboarding customization
  welcomeMessage?: string;
  setupGuideUrl?: string;
}

// User type definition
export interface User {
  id: string;
  email: string;
  displayName?: string;
  handle?: string;
  profileId?: string;
  photoURL?: string;
  emailVerified: boolean;
  campusId: string;
  role?: 'student' | 'faculty' | 'alumni' | 'staff' | 'admin';
  createdAt: Date | { toDate?: () => Date };
  lastActive?: Date | { toDate?: () => Date };
  metadata?: {
    school?: string;
    major?: string;
    graduationYear?: number;
    interests?: string[];
  };
}

// Tool type definitions (legacy alias)
export type Tool = DomainTool;

export type ElementInstance = DomainElementInstance;

export interface Element {
  id: string;
  type: string;
  category: string;
  name: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

export {
  ElementType,
  ElementInstanceSchema,
  validateElementConfig,
} from '../../domain/creation/elements';

export {
  ToolSchema,
  CreateToolSchema,
  UpdateToolSchema,
  ShareToolSchema,
  ToolStatus,
  ToolConfigSchema,
  ToolMetadataSchema,
  ToolVersionSchema,
  RemixedFromSchema,
  type RemixedFrom,
  createToolDefaults,
  generateShareToken,
  canUserEditTool,
  canUserViewTool,
  getNextVersion,
  determineChangeType,
  validateToolStructure,
} from '../../domain/creation/tool';

export {
  PlacedToolSchema,
  PlacementTargetType,
  PlacementPermissionsSchema,
  PlacementSettingsSchema,
  getPlacementCollectionPath,
  getPlacementDocPath,
  encodePlacementCompositeId,
  decodePlacementCompositeId,
  tryDecodePlacementCompositeId,
  PLACED_TOOL_COLLECTION_NAME,
} from '../../domain/creation/placement';
