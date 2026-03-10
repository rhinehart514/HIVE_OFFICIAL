/**
 * Shared Space Types
 *
 * Extracted to break circular dependency between enhanced-space.ts and system-tool-registry.ts.
 * Both files import from here instead of from each other.
 */

/**
 * Space types - determines templates, suggestions, and AI context
 * - uni: Official university entities (departments, programs, student gov)
 * - student: Student-run organizations (clubs, orgs, interest groups)
 * - greek: Fraternities & sororities (chapters, councils)
 * - residential: Dorms, floors, housing communities
 */
export type SpaceType = 'uni' | 'student' | 'greek' | 'residential';

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
 * Governance models - determines how roles and permissions work
 * - flat: Everyone equal, no designated roles
 * - emergent: Roles form from activity/contribution
 * - hybrid: Some designated roles + earned roles
 * - hierarchical: Clear chain of command (owner -> admin -> mod -> member)
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
 * Activation status - quorum-based community activation
 * Orthogonal to claim status (a space can be open but unclaimed)
 * - ghost: 0 members, space exists but no community yet
 * - gathering: 1 to threshold-1 members, building toward activation
 * - open: threshold+ members, full community features unlocked
 */
export type ActivationStatus = 'ghost' | 'gathering' | 'open';
