import { dbAdmin } from '@/lib/firebase-admin';
import {
  canUserJoinSpace,
  getContentVisibility,
  getSpaceTypeRules,
  isToolAllowedInSpaceType,
  type SpaceType,
} from '@/lib/space-type-rules';
import {
  canUseToolInSpace,
  getToolPermissions,
  resolveUserPermissions,
  type Permission,
  type ToolPermissions,
  type UserPermissions,
  type UserRole,
} from '@/lib/permission-system';

type JoinMethod = 'instant' | 'approval' | 'invitation_only' | 'automatic';

const VALID_SPACE_TYPES: SpaceType[] = [
  'student_organizations',
  'university_organizations',
  'greek_life',
  'campus_living',
  'hive_exclusive',
];

const ROLE_FALLBACK: UserRole = 'member';

function isValidSpaceType(value: string): value is SpaceType {
  return VALID_SPACE_TYPES.includes(value as SpaceType);
}

function toUserRole(value: unknown): UserRole {
  if (value === 'owner' || value === 'admin' || value === 'moderator' || value === 'member' || value === 'guest') {
    return value;
  }
  return ROLE_FALLBACK;
}

function toPermissionList(value: unknown): Permission[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const permissions = value.filter((entry): entry is Permission => typeof entry === 'string');
  return permissions.length > 0 ? permissions : undefined;
}

function normalizeJoinMethod(joinMethod?: string): JoinMethod | 'invitation' | undefined {
  if (!joinMethod) return undefined;
  const normalized = joinMethod.toLowerCase();
  if (normalized === 'manual' || normalized === 'instant') return 'instant';
  if (normalized === 'approval') return 'approval';
  if (normalized === 'invite' || normalized === 'invitation') return 'invitation';
  if (normalized === 'auto' || normalized === 'automatic') return 'automatic';
  if (normalized === 'invitation_only') return 'invitation_only';
  return undefined;
}

export function normalizeSpaceType(category: unknown): SpaceType {
  const raw = typeof category === 'string' ? category.toLowerCase().trim() : '';
  if (isValidSpaceType(raw)) return raw;

  if (raw.includes('student_org') || raw.includes('student-organization') || raw.includes('student organization')) {
    return 'student_organizations';
  }
  if (raw.includes('university_org') || raw.includes('university organization') || raw.includes('official')) {
    return 'university_organizations';
  }
  if (raw.includes('greek') || raw.includes('fraternity') || raw.includes('sorority') || raw.includes('rush')) {
    return 'greek_life';
  }
  if (raw.includes('campus_living') || raw.includes('residential') || raw.includes('housing') || raw.includes('dorm')) {
    return 'campus_living';
  }

  return 'hive_exclusive';
}

export interface EnforcedSpaceContext {
  id: string;
  name: string;
  campusId?: string;
  isPublic: boolean;
  type: SpaceType;
  category: string;
}

export interface EnforcedMembership {
  userId: string;
  role: UserRole;
  isActive: boolean;
  isSuspended: boolean;
  joinedAt: Date;
  customPermissions?: Permission[];
  restrictions?: Permission[];
}

export interface SpaceRulesResult {
  allowed: boolean;
  reason?: string;
  space: EnforcedSpaceContext | null;
  membership: EnforcedMembership | null;
  effectivePermissions: Permission[];
}

export interface JoinRulesResult {
  allowed: boolean;
  joinMethod: JoinMethod;
  reason?: string;
  approvalProcess?: 'simple' | 'rush_system' | 'faculty_approval';
  leaveRestriction?: 'housing_change_only' | 'semester_end' | 'none';
  requiresApproval: boolean;
}

export interface ToolRulesResult {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
  maxTools?: number;
  currentTools: number;
}

export interface VisibilityRulesResult {
  allowed: boolean;
  reason?: string;
  isMember: boolean;
  space: EnforcedSpaceContext | null;
  membership: EnforcedMembership | null;
  visibility: {
    posts: ReturnType<typeof getContentVisibility>;
    events: ReturnType<typeof getContentVisibility>;
    members: ReturnType<typeof getContentVisibility>;
    spaceDiscoverable: boolean;
  };
}

async function loadMembership(spaceId: string, userId: string, spaceData: FirebaseFirestore.DocumentData): Promise<EnforcedMembership | null> {
  const compositeDoc = await dbAdmin.collection('spaceMembers').doc(`${spaceId}_${userId}`).get();
  if (compositeDoc.exists) {
    const data = compositeDoc.data() ?? {};
    return {
      userId,
      role: toUserRole(data.role),
      isActive: data.isActive !== false,
      isSuspended: data.isSuspended === true,
      joinedAt: data.joinedAt?.toDate?.() || new Date(),
      customPermissions: toPermissionList(data.customPermissions),
      restrictions: toPermissionList(data.restrictions),
    };
  }

  const querySnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('spaceId', '==', spaceId)
    .where('userId', '==', userId)
    .limit(1)
    .get();

  if (!querySnapshot.empty) {
    const data = querySnapshot.docs[0].data();
    return {
      userId,
      role: toUserRole(data.role),
      isActive: data.isActive !== false,
      isSuspended: data.isSuspended === true,
      joinedAt: data.joinedAt?.toDate?.() || new Date(),
      customPermissions: toPermissionList(data.customPermissions),
      restrictions: toPermissionList(data.restrictions),
    };
  }

  if (spaceData.createdBy === userId) {
    return {
      userId,
      role: 'owner',
      isActive: true,
      isSuspended: false,
      joinedAt: new Date(),
    };
  }

  if (Array.isArray(spaceData.leaders) && spaceData.leaders.includes(userId)) {
    return {
      userId,
      role: 'admin',
      isActive: true,
      isSuspended: false,
      joinedAt: new Date(),
    };
  }

  return null;
}

async function loadSpaceContext(spaceId: string, userId?: string | null): Promise<{
  space: EnforcedSpaceContext | null;
  membership: EnforcedMembership | null;
}> {
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  if (!spaceDoc.exists) {
    return { space: null, membership: null };
  }

  const data = spaceDoc.data() ?? {};
  const category = (data.category || data.type || 'hive_exclusive') as string;
  const space: EnforcedSpaceContext = {
    id: spaceId,
    name: (data.name as string) || 'Unnamed Space',
    campusId: (data.campusId || data.schoolId) as string | undefined,
    isPublic: !data.isPrivate && data.visibility !== 'private',
    category,
    type: normalizeSpaceType(category),
  };

  if (!userId) {
    return { space, membership: null };
  }

  const membership = await loadMembership(spaceId, userId, data);
  return { space, membership };
}

function buildUserPermissions(
  userId: string,
  spaceId: string,
  membership: EnforcedMembership | null,
): UserPermissions {
  return {
    userId,
    spaceId,
    role: membership?.role || 'guest',
    customPermissions: membership?.customPermissions,
    restrictions: membership?.restrictions,
  };
}

export async function enforceSpaceRules(
  spaceId: string,
  userId: string | null | undefined,
  requiredPermission: Permission,
): Promise<SpaceRulesResult> {
  const context = await loadSpaceContext(spaceId, userId);
  if (!context.space) {
    return {
      allowed: false,
      reason: 'Space not found',
      space: null,
      membership: null,
      effectivePermissions: [],
    };
  }

  if (!userId) {
    return {
      allowed: false,
      reason: 'Authentication required',
      space: context.space,
      membership: null,
      effectivePermissions: [],
    };
  }

  if (context.membership?.isSuspended) {
    return {
      allowed: false,
      reason: 'Your membership has been suspended',
      space: context.space,
      membership: context.membership,
      effectivePermissions: [],
    };
  }

  if (context.membership && !context.membership.isActive) {
    return {
      allowed: false,
      reason: 'Your membership is inactive',
      space: context.space,
      membership: context.membership,
      effectivePermissions: [],
    };
  }

  if (!context.membership && !context.space.isPublic) {
    return {
      allowed: false,
      reason: 'You are not a member of this space',
      space: context.space,
      membership: null,
      effectivePermissions: [],
    };
  }

  const spaceRules = getSpaceTypeRules(context.space.type);
  const userPermissions = buildUserPermissions(userId, spaceId, context.membership);
  const effectivePermissions = resolveUserPermissions(userPermissions, context.space.type, spaceRules);
  const allowed = effectivePermissions.includes(requiredPermission);

  return {
    allowed,
    reason: allowed ? undefined : `Missing permission: ${requiredPermission}`,
    space: context.space,
    membership: context.membership,
    effectivePermissions,
  };
}

export async function enforceJoinRules(
  spaceId: string,
  userId: string,
  joinMethod?: string,
): Promise<JoinRulesResult> {
  const context = await loadSpaceContext(spaceId, userId);
  if (!context.space) {
    return {
      allowed: false,
      joinMethod: 'approval',
      reason: 'Space not found',
      requiresApproval: false,
    };
  }

  const spaceRules = getSpaceTypeRules(context.space.type);
  const requiredJoinMethod = spaceRules.membership.joinMethod;

  if (context.membership && context.membership.isActive && !context.membership.isSuspended) {
    return {
      allowed: false,
      joinMethod: requiredJoinMethod,
      reason: 'You are already a member of this space',
      approvalProcess: spaceRules.membership.approvalProcess,
      leaveRestriction: spaceRules.membership.leaveRestriction,
      requiresApproval: requiredJoinMethod === 'approval',
    };
  }

  const membershipsSnapshot = await dbAdmin
    .collection('spaceMembers')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .limit(200)
    .get();

  const activeSpaceIds = Array.from(
    new Set(
      membershipsSnapshot.docs
        .map((doc) => doc.data().spaceId as string | undefined)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  );

  const activeSpaceTypes: Array<{ type: SpaceType }> = [];
  if (activeSpaceIds.length > 0) {
    const refs = activeSpaceIds.map((id) => dbAdmin.collection('spaces').doc(id));
    const docs = await dbAdmin.getAll(...refs);
    for (const doc of docs) {
      if (!doc.exists) continue;
      const data = doc.data() ?? {};
      activeSpaceTypes.push({ type: normalizeSpaceType(data.category || data.type) });
    }
  }

  const normalizedJoinMethod = normalizeJoinMethod(joinMethod);
  const joinValidation = canUserJoinSpace(context.space.type, activeSpaceTypes, normalizedJoinMethod);
  if (!joinValidation.canJoin) {
    return {
      allowed: false,
      joinMethod: requiredJoinMethod,
      reason: joinValidation.reason || 'Join rules were not met',
      approvalProcess: spaceRules.membership.approvalProcess,
      leaveRestriction: spaceRules.membership.leaveRestriction,
      requiresApproval: requiredJoinMethod === 'approval',
    };
  }

  if (requiredJoinMethod === 'automatic' && normalizedJoinMethod && normalizedJoinMethod !== 'automatic') {
    return {
      allowed: false,
      joinMethod: requiredJoinMethod,
      reason: 'This space can only be joined automatically',
      approvalProcess: spaceRules.membership.approvalProcess,
      leaveRestriction: spaceRules.membership.leaveRestriction,
      requiresApproval: false,
    };
  }

  if (requiredJoinMethod === 'approval' && normalizedJoinMethod && normalizedJoinMethod !== 'approval' && normalizedJoinMethod !== 'invitation') {
    return {
      allowed: false,
      joinMethod: requiredJoinMethod,
      reason: 'This space requires an approval request before joining',
      approvalProcess: spaceRules.membership.approvalProcess,
      leaveRestriction: spaceRules.membership.leaveRestriction,
      requiresApproval: true,
    };
  }

  if (requiredJoinMethod === 'invitation_only' && normalizedJoinMethod !== 'invitation') {
    return {
      allowed: false,
      joinMethod: requiredJoinMethod,
      reason: 'This space is invitation only',
      approvalProcess: spaceRules.membership.approvalProcess,
      leaveRestriction: spaceRules.membership.leaveRestriction,
      requiresApproval: false,
    };
  }

  return {
    allowed: true,
    joinMethod: requiredJoinMethod,
    approvalProcess: spaceRules.membership.approvalProcess,
    leaveRestriction: spaceRules.membership.leaveRestriction,
    requiresApproval: requiredJoinMethod === 'approval',
  };
}

export async function enforceToolRules(
  spaceId: string,
  userId: string,
  toolType: string,
  customToolPermissions?: Partial<ToolPermissions>,
): Promise<ToolRulesResult> {
  const context = await loadSpaceContext(spaceId, userId);
  if (!context.space) {
    return {
      allowed: false,
      reason: 'Space not found',
      requiresApproval: false,
      currentTools: 0,
    };
  }

  if (!context.membership || !context.membership.isActive || context.membership.isSuspended) {
    return {
      allowed: false,
      reason: 'Active membership required',
      requiresApproval: false,
      currentTools: 0,
    };
  }

  const rules = getSpaceTypeRules(context.space.type);
  if (!isToolAllowedInSpaceType(toolType, context.space.type)) {
    return {
      allowed: false,
      reason: `Tool type "${toolType}" is not allowed in this space type`,
      requiresApproval: Boolean(rules.tools.requireApproval),
      currentTools: 0,
      maxTools: rules.tools.maxTools,
    };
  }

  const toolsSnapshot = await dbAdmin
    .collection('spaces')
    .doc(spaceId)
    .collection('placed_tools')
    .get();

  const currentTools = toolsSnapshot.docs.filter((doc) => doc.data().isActive !== false).length;
  if (typeof rules.tools.maxTools === 'number' && currentTools >= rules.tools.maxTools) {
    return {
      allowed: false,
      reason: `Maximum tool limit reached (${rules.tools.maxTools})`,
      requiresApproval: Boolean(rules.tools.requireApproval),
      currentTools,
      maxTools: rules.tools.maxTools,
    };
  }

  const userPermissions = buildUserPermissions(userId, spaceId, context.membership);
  const toolPermissions = getToolPermissions(toolType, customToolPermissions);
  const toolPermissionResult = canUseToolInSpace(userPermissions, context.space.type, rules, toolPermissions);

  if (!toolPermissionResult.canUse) {
    return {
      allowed: false,
      reason: toolPermissionResult.reason || 'Tool permissions check failed',
      requiresApproval: Boolean(rules.tools.requireApproval),
      currentTools,
      maxTools: rules.tools.maxTools,
    };
  }

  return {
    allowed: true,
    requiresApproval: Boolean(rules.tools.requireApproval),
    currentTools,
    maxTools: rules.tools.maxTools,
  };
}

export async function enforceVisibilityRules(
  spaceId: string,
  userId?: string | null,
): Promise<VisibilityRulesResult> {
  const context = await loadSpaceContext(spaceId, userId);
  if (!context.space) {
    return {
      allowed: false,
      reason: 'Space not found',
      isMember: false,
      space: null,
      membership: null,
      visibility: {
        posts: 'members_only',
        events: 'members_only',
        members: 'members_only',
        spaceDiscoverable: false,
      },
    };
  }

  const rules = getSpaceTypeRules(context.space.type);
  const isMember = Boolean(context.membership?.isActive && !context.membership?.isSuspended);

  return {
    allowed: true,
    isMember,
    space: context.space,
    membership: context.membership,
    visibility: {
      posts: getContentVisibility(context.space.type, 'posts'),
      events: getContentVisibility(context.space.type, 'events'),
      members: getContentVisibility(context.space.type, 'members'),
      spaceDiscoverable: rules.visibility.spaceDiscoverable,
    },
  };
}

export function canViewPosts(visibility: ReturnType<typeof getContentVisibility>, isMember: boolean): boolean {
  if (visibility === 'public' || visibility === 'campus_visible') return true;
  return isMember;
}

export function canViewEvents(visibility: ReturnType<typeof getContentVisibility>, isMember: boolean): boolean {
  if (visibility === 'public_calendar' || visibility === 'campus_calendar') return true;
  return isMember;
}

export function canViewMembers(visibility: ReturnType<typeof getContentVisibility>, isMember: boolean): boolean {
  if (visibility === 'public' || visibility === 'limited_external') return true;
  return isMember;
}
