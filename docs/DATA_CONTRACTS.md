# HIVE Data Contracts

**Generated:** February 4, 2026
**Sources:** DATABASE_SCHEMA.md, firestore.indexes.json, packages/core/src/domain/, packages/validation/src/, API route handlers

---

## Table of Contents

1. [User](#1-user)
2. [Profile](#2-profile)
3. [Space](#3-space)
4. [SpaceMember](#4-spacemember)
5. [Message (ChatMessage)](#5-message-chatmessage)
6. [Board](#6-board)
7. [Tool](#7-tool)
8. [Event](#8-event)
9. [Notification](#9-notification)
10. [Handle](#10-handle)
11. [JoinRequest](#11-joinrequest)
12. [RSVP](#12-rsvp)
13. [FeatureFlag](#13-featureflag)
14. [Cross-Cutting Issues](#14-cross-cutting-issues)
15. [Discrepancy Audit](#15-discrepancy-audit)

---

## 1. User

**Collection:** `users`
**Document ID:** Firebase Auth UID

### Schema

```typescript
interface User {
  // Identity (required)
  id: string;                    // Firebase Auth UID (doc ID)
  email: string;                 // University .edu email
  handle: string;                // Unique @handle
  fullName: string;              // "FirstName LastName"
  firstName: string;             // From entry flow
  lastName: string;              // From entry flow

  // Optional identity
  avatarUrl?: string;            // Gravatar or uploaded
  photoURL?: string;             // Legacy alias for avatarUrl

  // Academic
  userType: 'student' | 'faculty' | 'alumni';
  major?: string;
  graduationYear?: number | null;
  residenceType?: 'on-campus' | 'off-campus' | 'commuter';

  // Social
  interests: string[];           // 2-5 from entry, up to 20 later
  communityIdentities?: {
    international?: boolean;
    transfer?: boolean;
    firstGen?: boolean;
    commuter?: boolean;
    graduate?: boolean;
    veteran?: boolean;
  };

  // Space associations (set during entry auto-join)
  majorSpaceId?: string;
  homeSpaceId?: string;          // Residential space
  residentialSpaceId?: string | null;
  communitySpaceIds?: string[];

  // Status
  isActive: boolean;
  entryCompletedAt?: string;     // ISO timestamp, single source of truth
  onboardingComplete?: boolean;  // DEPRECATED - derived from entryCompletedAt
  emailVerified?: boolean;
  isBuilder?: boolean;

  // Auth
  fcmTokens?: string[];         // Push notification tokens

  // Campus isolation (REQUIRED)
  campusId: string;              // 'ub-buffalo' for vBETA
  schoolId: string;              // Same as campusId currently

  // Timestamps
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

### Creation Contract

| Field | Set By | Required | Validation |
|-------|--------|----------|------------|
| `email` | Session (from auth) | YES | .edu domain, verified |
| `handle` | User or auto-generated | YES | 3-24 chars, lowercase alphanumeric, unique via `handles` collection |
| `fullName` | User input | YES | min 1, max combined ~100 |
| `firstName` | User input | YES | min 1, max 50 |
| `lastName` | User input | YES | min 1, max 50 |
| `interests` | User input | YES | 2-5 items at entry |
| `userType` | User input (role field) | YES | enum: student/faculty/alumni |
| `campusId` | Session (server-derived) | YES | Never from client |
| `schoolId` | Server (copied from campusId) | YES | Server-set |
| `isActive` | Server | YES | Always `true` on creation |
| `entryCompletedAt` | Server | YES | ISO timestamp at creation |
| `createdAt` | Server | YES | ISO timestamp or preserved from existing |
| `updatedAt` | Server | YES | ISO timestamp |

**Creator:** `/api/auth/complete-entry` route handler, inside a Firestore transaction with `{ merge: true }`.

**Validation:** Inline Zod schema in route handler. Uses `SecureSchemas.handle` for handle format. Does NOT use `packages/validation/src/schemas/user.schema.ts` (different schema shape).

### Update Contract

| Field | Mutable | Who Can Update | Constraints |
|-------|---------|----------------|-------------|
| `handle` | NO (after entry) | Nobody | Immutable after reservation |
| `displayName`/`fullName` | YES | Owner | max 40/100 chars |
| `avatarUrl` | YES | Owner, Server (Gravatar) | Valid URL |
| `major` | YES | Owner | Via settings |
| `interests` | YES | Owner | max 20 items via progressive profiling |
| `userType` | NO | System only | Set at entry |
| `campusId` | NEVER | Nobody | Immutable, set from session |
| `isActive` | YES | Admin only | For suspension |

### Deletion Contract

- **Type:** Soft delete (set `isActive: false`)
- **No hard delete path exists in code**
- **Cascade:** Does NOT cascade to spaceMembers, posts, messages
- **Orphan risk:** SpaceMember `userName`/`userHandle` denormalized copies become stale
- **Handle:** Not released on soft delete -- handle document in `handles` collection persists

### Audit Fields

| Field | Present | Notes |
|-------|---------|-------|
| `createdAt` | YES | ISO string, not Firestore Timestamp |
| `updatedAt` | YES | ISO string |
| `createdBy` | NO | Missing -- `id` serves as creator identity |
| `campusId` | YES | Always present |

### Denormalized Fields

| Field | Source | Staleness Risk |
|-------|--------|----------------|
| `schoolId` | Copied from `campusId` | LOW -- same value currently |
| `majorSpaceId` | Set from spaces query at entry | MEDIUM -- if space deleted |
| `homeSpaceId` | Set from residential space at entry | MEDIUM -- if space deleted |

### Lifecycle

```
Email verified -> /api/auth/complete-entry -> Active user -> (settings updates) -> (admin suspend) -> (no deletion path)
```

### Indexes

**Defined in firestore.indexes.json:**
- `users: campusId + createdAt DESC`
- `users: campusId + handle ASC`
- `users: campusId + isActive + lastActive DESC`
- `users: campusId + lastActive DESC`
- `users: campusId + university + lastActive DESC`

**Field overrides:**
- `users.campusId` -- single field ASC override
- `users.lastActive` -- ASC + DESC overrides

**MISSING indexes:**
- `users: campusId + email` -- needed for duplicate email checks
- `users: campusId + entryCompletedAt` -- for entry funnel analytics

---

## 2. Profile

**Collection:** `profiles`
**Document ID:** Same as user UID

### Schema

```typescript
interface Profile extends BaseDocument {
  userId: string;

  // Identity
  displayName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;

  // Academic
  userType: 'student' | 'faculty' | 'alumni';
  major?: string;
  academicYear?: 'freshman' | 'sophomore' | 'junior' | 'senior';
  graduationYear?: number;

  // Social
  interests: string[];
  followerCount: number;
  followingCount: number;
  spaceCount: number;

  // Privacy
  privacy: {
    profileVisibility: 'public' | 'campus' | 'private';
    showEmail: boolean;
    showAcademicInfo: boolean;
  };

  // Status
  role?: string;

  // Base
  campusId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Creation Contract

**Created:** Implicitly -- no dedicated "create profile" endpoint found. Profile document is read in chat route (`createProfileGetter()`) but creation path is unclear. The `complete-entry` route writes to `users` collection, NOT `profiles`.

**CRITICAL GAP:** Profiles collection appears to be read but never explicitly populated by the entry flow. Chat service reads from `profiles` for display names. Either:
- Profiles are created by a Cloud Function trigger on user creation (not visible in web app code)
- Profile reads gracefully fall back: `data.displayName || data.name || 'Member'`

### Denormalized Fields

| Field | Source | Staleness Risk |
|-------|--------|----------------|
| `displayName` | Copy of `users.fullName` | HIGH -- updated independently |
| `handle` | Copy of `users.handle` | LOW -- handles are immutable |
| `followerCount` | Computed from `user_follows` | MEDIUM -- counter may drift |
| `followingCount` | Computed from `user_follows` | MEDIUM -- counter may drift |
| `spaceCount` | Computed from `spaceMembers` | MEDIUM -- counter may drift |

### Indexes

**From firestore.indexes.json:**
- `user_profiles: interests CONTAINS + lastActive DESC`
- `user_profiles: university + lastActive DESC`

**NOTE:** Index collection name is `user_profiles` but DATABASE_SCHEMA.md calls the collection `profiles`. This is either a naming mismatch or two separate collections.

---

## 3. Space

**Collection:** `spaces`
**Document ID:** Auto-generated or imported external ID

### Schema

```typescript
interface Space extends BaseDocument {
  // Identity
  name: string;
  handle: string;
  slug: string;
  description: string;
  name_lowercase?: string;       // Used for search, from indexes

  // Classification
  type: SpaceType;               // student_organizations | university_organizations | greek_life | campus_living | hive_exclusive
  subType?: string;
  tags: string[];
  category?: string;

  // Visuals
  coverImageURL?: string;
  iconURL?: string;
  imageUrl?: string;             // Alternate field name in validation

  // Leadership
  leaderIds: string[];
  moderatorIds: string[];
  ownerId?: string;              // From validation schema, not in DATABASE_SCHEMA

  // Settings
  visibility: 'public' | 'private' | 'members_only';
  isPublic?: boolean;            // Legacy, conflicts with visibility
  isPrivate?: boolean;           // Legacy, conflicts with visibility
  requiresApproval: boolean;
  isActive: boolean;

  // Features
  hasTools: boolean;
  hasEvents: boolean;
  hasRSS: boolean;
  rssUrl?: string;

  // Counts (denormalized)
  memberCount: number;
  postCount: number;
  eventCount: number;
  toolCount: number;

  // Governance
  governance: 'flat' | 'emergent' | 'hybrid' | 'hierarchical';
  source: 'ublinked' | 'user-created';
  status: 'unclaimed' | 'claimed' | 'active' | 'verified';
  publishStatus: 'stealth' | 'live' | 'rejected';

  // Import
  externalId?: string;
  claimedAt?: Timestamp;
  wentLiveAt?: Timestamp;

  // Identity spaces (from complete-entry auto-join logic)
  identityType?: 'major' | 'community' | 'residential';
  majorName?: string;
  communityType?: string;
  isUniversal?: boolean;
  isUnlocked?: boolean;

  // Metrics (from indexes)
  metrics?: {
    memberCount: number;
    engagementScore: number;
    isTrending: boolean;
  };
  trendingScore?: number;
  lastActivityAt?: Timestamp;
  members?: string[];            // Array of member IDs (from indexes)

  // Stats (from indexes)
  stats?: {
    memberCount: number;
    activeToday: number;
  };
  featured?: boolean;
  joinPolicy?: string;

  // Base
  campusId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy?: string;
}
```

### Creation Contract

Two creation paths:

**1. User-created spaces:** Schema from `packages/validation/src/schemas/space.schema.ts`
- Required: `name` (3-50 chars), `description` (10-500 chars), `category`
- Optional: `spaceType`, `governance`, `visibility`
- Server-set: `campusId`, `createdBy`, `createdAt`, `status: 'claimed'`, `source: 'user-created'`

**2. Imported (UBLinked) spaces:** Seeded data
- `source: 'ublinked'`, `status: 'unclaimed'`, `externalId` set

### Update Contract

| Field | Mutable | Who Can Update | Constraints |
|-------|---------|----------------|-------------|
| `name` | YES | Owner/Admin | 2-100 chars |
| `description` | YES | Owner/Admin | max 500 chars |
| `visibility` | YES | Owner/Admin | enum |
| `memberCount` | YES | Server only | `FieldValue.increment()` |
| `metrics.memberCount` | YES | Server only | Kept in sync with `memberCount` |
| `campusId` | NEVER | Nobody | Immutable |
| `status` | YES | Owner/Admin | Lifecycle transitions |
| `publishStatus` | YES | Owner/Admin/System | stealth -> live -> rejected |

### Deletion Contract

- **No delete path in code.** Spaces use status/publishStatus for lifecycle.
- **Cascade concern:** No cascade to spaceMembers, boards, messages, events, placed_tools
- **Orphan risk:** SpaceMember records, board subcollections, messages all orphaned

### Audit Fields

| Field | Present | Notes |
|-------|---------|-------|
| `createdAt` | YES | Firestore Timestamp |
| `updatedAt` | YES | Firestore Timestamp |
| `createdBy` | OPTIONAL | Not consistently set |
| `campusId` | YES | Always present |

### Denormalized Fields

| Field | Source | Staleness Risk |
|-------|--------|----------------|
| `memberCount` | Count of spaceMembers where isActive=true | MEDIUM -- increment-only, no decrement on leave observed in entry flow |
| `metrics.memberCount` | Duplicate of memberCount | HIGH -- two counters updated in parallel, can drift |
| `name_lowercase` | Computed from name | MEDIUM -- must be updated on rename |

### Indexes

**Extensive -- 30+ composite indexes defined.** Key ones:
- `spaces: campusId + category + memberCount DESC`
- `spaces: campusId + isActive + createdAt DESC`
- `spaces: campusId + visibility + memberCount DESC`
- `spaces: campusId + status + lastActivityAt DESC`
- `spaces: campusId + slug ASC`
- `spaces: campusId + name_lowercase ASC`
- `spaces: campusId + type + name_lowercase ASC`
- `spaces: campusId + isActive + trendingScore DESC`

**Field overrides:** `campusId`, `id`, `isPrivate`, `memberCount`, `metrics.memberCount`, `name` all have custom scope overrides.

**VISIBILITY CONFUSION:** Indexes reference `isPublic`, `isPrivate`, AND `visibility`. Three different representations of the same concept.

---

## 4. SpaceMember

**Collection:** `spaceMembers` (top-level, NOT subcollection)
**Document ID:** `${spaceId}_${userId}` (composite)

### Schema

```typescript
interface SpaceMember extends BaseDocument {
  spaceId: string;
  userId: string;

  // User snapshot (denormalized)
  userName: string;
  userHandle: string;
  userPhotoURL?: string;

  // Role
  role: 'owner' | 'admin' | 'leader' | 'moderator' | 'member' | 'guest';
  joinedAt: string;              // ISO timestamp (from complete-entry) or Timestamp

  // Activity
  lastActiveAt?: Timestamp;
  postCount?: number;

  // Permissions
  canPost?: boolean;
  canModerate?: boolean;
  canManageTools?: boolean;

  // Status
  isActive: boolean;

  // Campus isolation
  campusId: string;
}
```

### Creation Contract

**Created in:** `/api/auth/complete-entry` (auto-join), space join flows

| Field | Set By | Required | Notes |
|-------|--------|----------|-------|
| `spaceId` | Server | YES | From space being joined |
| `userId` | Server (from session) | YES | From authenticated user |
| `role` | Server | YES | 'member' for auto-join, 'owner' for space creation |
| `joinedAt` | Server | YES | ISO timestamp |
| `campusId` | Server (from session) | YES | Never from client |
| `isActive` | Server | YES | Always `true` on creation |
| `userName` | Server | YES | From user's fullName |
| `userHandle` | Server | YES | From user's handle |

**Doc ID format:** `${spaceId}_${userId}` -- ensures one membership per user per space.

### Update Contract

| Field | Mutable | Who Can | Notes |
|-------|---------|---------|-------|
| `role` | YES | Space owner/admin | Promotion/demotion |
| `isActive` | YES | User (leave), Admin (remove) | Soft leave |
| `lastActiveAt` | YES | Server | On activity |
| `postCount` | YES | Server | Increment on post |
| `userName` / `userHandle` | YES (should be) | Never updated | STALE -- no sync mechanism |

### Deletion Contract

- **Soft delete:** `isActive: false`
- **Hard delete:** JoinRequest DELETE handler does hard-delete on `spaceJoinRequests` but NOT on `spaceMembers`
- **No cascade:** Does not decrement `spaces.memberCount`
- **Orphan risk:** Active memberships for deleted/suspended users

### Denormalized Fields

| Field | Source | Staleness Risk |
|-------|--------|----------------|
| `userName` | `users.fullName` | HIGH -- no update propagation |
| `userHandle` | `users.handle` | LOW -- handles are immutable |
| `userPhotoURL` | `users.avatarUrl` | HIGH -- no update propagation |

### Indexes

- `spaceMembers: campusId + spaceId + role`
- `spaceMembers: campusId + userId + joinedAt DESC`
- `spaceMembers: spaceId + role + lastActiveAt DESC`
- `spaceMembers: spaceId + status ASC` (references `status` field not in schema)
- `spaceMembers: userId + status + joinedAt DESC` (references `status` field not in schema)
- `spaceMembers: userId + campusId + isActive`
- `spaceMembers: spaceId + campusId + isActive + joinedAt DESC`
- `spaceMembers: spaceId + userId + isActive + campusId`
- `spaceMembers: campusId + isActive + role + spaceId + joinedAt DESC`

**NOTE:** Some indexes reference a `status` field that does not exist in DATABASE_SCHEMA.md. This field appears to be distinct from `isActive`. These indexes may be dead or indicate an undocumented field.

---

## 5. Message (ChatMessage)

**Collection:** `spaces/{spaceId}/boards/{boardId}/messages` (subcollection)
**Document ID:** Auto-generated or `msg_{uuid}`

### Schema

```typescript
// From DDD entity: packages/core/src/domain/spaces/entities/chat-message.ts
interface ChatMessageProps {
  boardId: string;
  spaceId: string;

  // Author
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  authorRole?: string;

  // Content
  type: 'text' | 'inline_component' | 'system';
  content: string;

  // Inline components
  componentData?: {
    elementType: string;
    deploymentId?: string;
    toolId?: string;
    componentId?: string;
    state?: Record<string, unknown>;
    isActive: boolean;
  };

  // System messages
  systemAction?: 'user_joined' | 'user_left' | 'board_created' | 'settings_changed' | 'event_started';
  systemMeta?: Record<string, unknown>;

  // Metadata
  timestamp: number;             // Unix ms in persistence
  editedAt?: number;

  // Reactions
  reactions: Array<{
    emoji: string;
    count: number;
    userIds: string[];
  }>;

  // Threading
  replyToId?: string;
  replyToPreview?: string;       // In automation-created messages only
  threadCount: number;

  // Status
  isDeleted: boolean;
  isPinned: boolean;

  // Automation metadata (on system messages)
  metadata?: {
    automationId: string;
    automationName: string;
    triggeredBy: string;
    matchedKeyword: string;
  };
}
```

### Creation Contract

**Created via:** `SpaceChatService.sendMessage()` (DDD service), automation triggers

| Field | Set By | Required | Notes |
|-------|--------|----------|-------|
| `boardId` | Client (validated) | YES | Must exist in space |
| `content` | Client | YES | max 4000 chars, XSS scanned |
| `authorId` | Server (from session) | YES | Never from client |
| `authorName` | Server (from profile lookup) | YES | Fetched from `profiles` collection |
| `timestamp` | Server | YES | `Date.now()` |
| `type` | Server/Client | YES | 'text' for user messages |
| `reactions` | Server | YES | Empty array `[]` |
| `threadCount` | Server | YES | `0` |
| `isDeleted` | Server | YES | `false` |
| `isPinned` | Server | YES | `false` |

**Validation:** Inline Zod schema in route handler (`SendMessageSchema`). Separate from `packages/validation/src/chat.schema.ts`.

### Update Contract

| Field | Mutable | Who Can | Notes |
|-------|---------|---------|-------|
| `content` | YES | Author only | Text messages only, sets `editedAt` |
| `reactions` | YES | Any member | Add/remove per user |
| `isPinned` | YES | Moderator+ | Pin/unpin |
| `isDeleted` | YES | Author or Moderator+ | Soft delete, content replaced |
| `threadCount` | YES | Server | Increment on reply |

### Deletion Contract

- **Type:** Soft delete (`isDeleted: true`, content replaced with `'[Message deleted]'`)
- **No cascade:** Reactions, thread replies remain
- **No hard delete path**

### Audit Fields

| Field | Present | Notes |
|-------|---------|-------|
| `createdAt` | NO | Uses `timestamp` (numeric) instead |
| `updatedAt` | NO | Uses `editedAt` (numeric) instead |
| `createdBy` | NO | Uses `authorId` instead |
| `campusId` | NO | Campus isolation via parent `spaces/{spaceId}` path |

**CONCERN:** Messages lack direct `campusId` field. Campus isolation depends entirely on the parent space document's `campusId`. If a message is queried via collection group query, campus isolation is not enforceable at the message level.

### Denormalized Fields

| Field | Source | Staleness Risk |
|-------|--------|----------------|
| `authorName` | `profiles.displayName` | HIGH -- no sync |
| `authorAvatarUrl` | `profiles.avatarUrl` | HIGH -- no sync |
| `authorRole` | `spaceMembers.role` | MEDIUM -- no sync on role change |
| `replyToPreview` | Content of replied-to message | LOW -- set once at creation |

### Indexes

- `messages: isArchived + timestamp DESC`
- `messages: isDeleted + isPinned + timestamp DESC` (COLLECTION_GROUP)

**DISCREPANCY:** DATABASE_SCHEMA.md describes a top-level `chatMessages` collection with `channelId` field. The actual code uses subcollection path `spaces/{spaceId}/boards/{boardId}/messages`. These are TWO DIFFERENT data models -- the schema doc is outdated.

---

## 6. Board

**Collection:** `spaces/{spaceId}/boards` (subcollection)
**Document ID:** `board_{uuid}` or `general`

### Schema

```typescript
// From DDD entity: packages/core/src/domain/spaces/entities/board.ts
interface BoardProps {
  name: string;
  type: 'general' | 'topic' | 'event';
  description?: string;
  order: number;
  isDefault: boolean;

  // Event-linked
  linkedEventId?: string;

  // Permissions
  canPost: 'all' | 'members' | 'leaders';
  canReact: 'all' | 'members' | 'leaders';

  // Stats
  messageCount: number;
  participantCount: number;

  // Metadata
  createdBy: string;
  createdAt: Date;
  lastActivityAt?: Date;

  // Archival
  isArchived: boolean;
  archivedAt?: Date;

  // Moderation
  isLocked: boolean;
  pinnedMessageIds: string[];
}
```

### Creation Contract

**Created via:** `Board.create()` or `Board.createGeneral()` factory methods

| Field | Set By | Required | Default |
|-------|--------|----------|---------|
| `name` | Creator | YES | 'General' for default board |
| `type` | Creator | YES | 'general' for default |
| `createdBy` | Server | YES | User ID |
| `order` | Server | NO | 0 |
| `isDefault` | Server | NO | false (true for general) |
| `canPost` | Server | NO | 'members' |
| `canReact` | Server | NO | 'all' |
| `messageCount` | Server | YES | 0 |
| `isArchived` | Server | YES | false |
| `isLocked` | Server | YES | false |
| `pinnedMessageIds` | Server | YES | [] |

### Audit Fields

| Field | Present | Notes |
|-------|---------|-------|
| `createdAt` | YES | Date, serialized to ISO string |
| `updatedAt` | NO | Missing |
| `createdBy` | YES | User ID |
| `campusId` | NO | Via parent space path |

### Indexes

- `boards: isArchived + order ASC`

**DISCREPANCY:** DATABASE_SCHEMA.md describes `chatChannels` as a top-level collection. Code uses `spaces/{spaceId}/boards` subcollection. Different collection, different field names (`name`/`description` match but `type` values differ).

---

## 7. Tool

**Collection:** `tools`
**Document ID:** Auto-generated

### Schema

```typescript
// Composite from DATABASE_SCHEMA.md + validation + indexes
interface Tool extends BaseDocument {
  // Identity
  name: string;
  description: string;
  icon?: string;
  iconEmoji?: string;           // From validation

  // Ownership
  creatorId: string;            // DATABASE_SCHEMA
  createdBy?: string;           // Indexes use this field name
  ownerId?: string;             // Validation uses this field name
  creatorName?: string;

  // Configuration
  type: 'template' | 'custom';
  templateId?: string;
  configuration: Record<string, unknown>;
  prompt?: string;              // From validation
  inputSchema?: ToolInputSchema;
  variants?: ToolVariant[];

  // Code
  code?: string;
  elements?: ToolElement[];

  // Status
  status: 'draft' | 'published' | 'archived' | 'suspended';
  visibility?: 'private' | 'unlisted' | 'public';
  isPublic: boolean;
  isTemplate: boolean;
  category?: string;

  // Usage
  usageCount: number;
  deploymentCount?: number;
  lastUsedAt?: Timestamp;
  limitedRunEndsAt?: Timestamp;  // From indexes

  // Analytics
  analytics?: {
    views: number;
    uniqueUsers: number;
    avgSessionTime: number;
  };
  stats?: {
    rating: number;             // From indexes
    installs: number;           // From indexes
  };

  // Base
  campusId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Creation Contract

**Validation:** `packages/validation/src/tool.schema.ts` (`CreateToolInputSchema`)

| Field | Required | Validation |
|-------|----------|------------|
| `name` | YES | 2-60 chars |
| `description` | YES | 10-500 chars |
| `prompt` | YES | 20-2000 chars |
| `category` | NO | Default 'other' |
| `visibility` | NO | Default 'private' |
| `campusId` | YES | From session |

### Owner Field Confusion

Three different field names for the same concept:
- `creatorId` -- DATABASE_SCHEMA.md
- `createdBy` -- firestore.indexes.json
- `ownerId` -- packages/validation schema

**This is a data integrity risk.** Queries may miss documents if the wrong field is used.

### Indexes

- `tools: campusId + isPublic + usageCount DESC`
- `tools: campusId + ownerId + updatedAt DESC`
- `tools: campusId + visibility`
- `tools: createdBy + isPublic + createdAt DESC`
- `tools: createdBy + status + updatedAt DESC`
- `tools: createdBy + visibility + createdAt DESC`
- `tools: campusId + isPublic + status + createdAt DESC`
- `tools: status + limitedRunEndsAt ASC`
- `tools: status + stats.rating DESC`
- `tools: visibility + category + stats.installs DESC`

---

## 8. Event

**Collection:** `events`
**Document ID:** Auto-generated

### Schema

```typescript
interface Event extends BaseDocument {
  title: string;
  description: string;

  // Timing -- INCONSISTENT field names
  startTime?: Timestamp;        // DATABASE_SCHEMA
  endTime?: Timestamp;          // DATABASE_SCHEMA
  startDate?: string;           // Indexes reference this
  endDate?: string;             // Indexes reference this
  startAt?: Date;               // Validation schema
  endAt?: Date;                 // Validation schema
  timezone: string;
  allDay?: boolean;

  // Location
  location: string | EventLocation;  // String in schema doc, object in validation
  locationDetails?: string;
  isVirtual: boolean;
  virtualLink?: string;

  // Organization
  spaceId?: string;
  spaceName?: string;
  organizerId: string;
  organizerName?: string;
  hostType?: string;            // From indexes
  hostId?: string;              // From indexes

  // Attendance
  rsvpCount: number;
  attendeeCount?: number;       // Validation uses this name
  attendeeLimit?: number;
  maxAttendees?: number;        // Validation uses this name

  // Metadata
  tags: string[];
  imageURL?: string;
  coverImageUrl?: string;       // Validation uses this name
  category?: string;
  type?: EventType;             // From validation
  status?: EventStatus;         // From validation
  visibility?: EventVisibility;

  // Source
  source: 'user' | 'rss' | 'admin';
  rssSourceId?: string;

  // Flags
  isPublic?: boolean;           // From indexes
  isDeleted?: boolean;          // From indexes
  requireApproval?: boolean;

  // Base
  campusId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

### Field Name Chaos

| Concept | DATABASE_SCHEMA.md | Validation | Indexes |
|---------|-------------------|------------|---------|
| Start time | `startTime` | `startAt` | `startTime`, `startDate` |
| End time | `endTime` | `endAt` | `endDate` |
| Max capacity | `attendeeLimit` | `maxAttendees` | N/A |
| RSVP count | `rsvpCount` | `attendeeCount` | N/A |
| Image | `imageURL` | `coverImageUrl` | N/A |

**This is the worst field consistency of any entity.** At least 3 different naming conventions for the same temporal concept.

### Indexes

Extensive -- 25+ composite indexes. Mix of COLLECTION and COLLECTION_GROUP scopes. Key:
- `events: campusId + startDate ASC`
- `events: campusId + isDeleted + startTime DESC`
- `events: spaceId + startTime ASC`
- `events: spaceId + status + startAt ASC`
- `events: hostType + hostId + startTime ASC`
- `events: visibility + startTime ASC`
- `events: campusId + category + startDate ASC`

Also `calendar_events` indexes exist as a separate collection.

---

## 9. Notification

**Collection:** `notifications`
**Document ID:** Auto-generated

### Schema

```typescript
interface Notification extends BaseDocument {
  userId: string;               // Recipient

  // Content
  type: NotificationType;       // 'space_invite' | 'space_join' | 'mention' | 'system' | etc.
  category?: string;            // 'social' | 'spaces' -- from createNotification calls
  title: string;
  body: string;

  // Reference
  referenceType?: 'space' | 'post' | 'event' | 'user' | 'tool';
  referenceId?: string;
  actionUrl?: string;           // Not in schema doc, used in code

  // Status
  read?: boolean;               // DATABASE_SCHEMA
  isRead?: boolean;             // Indexes use this field name
  readAt?: Timestamp;

  // Actor
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;

  // Metadata (from code)
  metadata?: {
    actorId?: string;
    actorName?: string;
    spaceId?: string;
    spaceName?: string;
    messageId?: string;
    boardId?: string;
    automationId?: string;
    matchedKeyword?: string;
    requestId?: string;
  };

  // Timestamps
  timestamp?: Timestamp;        // Some indexes use this instead of createdAt
  createdAt: Timestamp;
  campusId: string;
}
```

### Read Status Field Confusion

- DATABASE_SCHEMA.md uses `read: boolean`
- Indexes use `isRead`
- Some indexes use `timestamp`, others use `createdAt`

### Indexes

- `notifications: userId + isRead + createdAt DESC`
- `notifications: userId + isRead + timestamp DESC`
- `notifications: userId + type + createdAt DESC`
- `notifications: userId + type + timestamp DESC`
- `notifications: metadata.actorId + type + userId + timestamp ASC`

---

## 10. Handle

**Collection:** `handles`
**Document ID:** The handle string itself (e.g., `johnsmith`)

### Schema

```typescript
interface Handle {
  handle: string;
  userId: string;
  type: 'user' | 'space';
  reservedAt: Timestamp;
  email?: string;               // Set in code via reserveHandleInTransaction
}
```

### Creation Contract

**Created via:** `reserveHandleInTransaction()` inside Firestore transaction in `/api/auth/complete-entry`

| Field | Set By | Required |
|-------|--------|----------|
| `handle` | Derived from user input or auto-generated | YES |
| `userId` | Server (from session) | YES |
| `type` | Server | YES |
| `reservedAt` | Server | YES |
| `email` | Server (from session) | Set in code |

### Deletion Contract

- **No delete path exists.** Handles are permanent.
- **No release mechanism** for suspended/deleted users.
- **Namespace exhaustion risk** for common names.

### Audit Fields

| Field | Present | Notes |
|-------|---------|-------|
| `createdAt` | NO | Uses `reservedAt` instead |
| `updatedAt` | NO | Handles are immutable |
| `createdBy` | NO | Uses `userId` instead |
| `campusId` | NO | MISSING -- handles are globally unique, not campus-scoped |

**CONCERN:** Handles are not campus-scoped. When HIVE expands to multiple campuses, handle conflicts will arise between campuses.

---

## 11. JoinRequest

**Collection:** `spaceJoinRequests`
**Document ID:** Auto-generated

### Schema

```typescript
interface JoinRequest {
  id: string;
  spaceId: string;
  userId: string;
  campusId: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string | null;
  createdAt: admin.firestore.Timestamp;  // Server timestamp
  updatedAt: admin.firestore.Timestamp;  // Server timestamp
  reviewedAt?: admin.firestore.Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
}
```

### Creation Contract

**Created via:** `POST /api/spaces/[spaceId]/join-request`

| Field | Set By | Required |
|-------|--------|----------|
| `spaceId` | From URL param | YES |
| `userId` | From session | YES |
| `campusId` | Added via `addSecureCampusMetadata()` | YES |
| `status` | Server | YES, always 'pending' |
| `message` | Client (optional) | NO, max 500 chars |
| `createdAt` | Server (FieldValue.serverTimestamp) | YES |
| `updatedAt` | Server (FieldValue.serverTimestamp) | YES |

### Deletion Contract

- **DELETE endpoint:** Hard deletes pending requests (user cancellation)
- **No cascade** on approval/rejection
- **Approval flow:** Not visible in scanned code -- may create a SpaceMember document

### Indexes

- `spaceJoinRequests: spaceId + userId + campusId + createdAt DESC`
- `spaceJoinRequests: spaceId + userId + status + campusId`
- `spaceJoinRequests: spaceId + campusId + status + createdAt DESC`
- `spaceJoinRequests: spaceId + campusId + createdAt DESC`

Also indexes exist for `joinRequests` (camelCase, different collection name): `joinRequests: status + requestedAt DESC`

---

## 12. RSVP

**Collection:** `rsvps` (DATABASE_SCHEMA) or `eventRSVPs` (indexes)
**Document ID:** Unclear -- possibly composite

### Schema

```typescript
interface RSVP extends BaseDocument {
  eventId: string;
  userId: string;

  // User snapshot
  userName: string;
  userAvatar?: string;

  // Status
  status: 'going' | 'maybe' | 'not_going' | 'waitlist';  // 'waitlist' only in validation
  respondedAt: Timestamp;

  // Calendar
  addedToCalendar?: boolean;

  // Note (from validation)
  note?: string;

  // Base
  campusId: string;
  createdAt: Timestamp;
}
```

### Collection Name Confusion

- DATABASE_SCHEMA.md: `rsvps`
- Indexes: `eventRSVPs`

These are likely the SAME data with different collection names across docs vs. code.

### Indexes

- `eventRSVPs: eventId + status`
- `eventRSVPs: userId + status`

---

## 13. FeatureFlag

**Collection:** `featureFlags`
**Document ID:** Flag key string (e.g., `spaces_v2`)

### Schema

```typescript
interface FeatureFlag {
  id: string;                   // Flag key
  enabled: boolean;
  category?: string;
  config?: Record<string, unknown>;
  variant?: string;             // Default 'default'

  // Targeting (inferred from evaluateFlag function)
  // Exact shape depends on implementation
}
```

### Creation Contract

**Created via:** Admin API `POST /api/admin/feature-flags`

### Audit Fields

- No `createdAt`, `updatedAt`, `campusId` documented
- No audit trail for flag changes

---

## 14. Cross-Cutting Issues

### 14.1. Timestamp Format Inconsistency

| Entity | Format |
|--------|--------|
| User | ISO string (`new Date().toISOString()`) |
| SpaceMember | ISO string (from complete-entry) |
| JoinRequest | Firestore ServerTimestamp |
| Message | Unix milliseconds (`Date.now()`) |
| Board | JavaScript Date, serialized to ISO |
| Handle | Firestore Timestamp |
| Space (schema doc) | Firestore Timestamp |

**Three different timestamp formats** across entities makes cross-entity temporal queries fragile.

### 14.2. Campus Isolation Gaps

| Entity | Has campusId | Enforcement |
|--------|-------------|-------------|
| User | YES | Session-derived |
| Profile | YES | Session-derived |
| Space | YES | Session-derived |
| SpaceMember | YES | Session-derived |
| Message | NO | Via parent path only |
| Board | NO | Via parent path only |
| Handle | NO | GLOBALLY UNIQUE |
| RSVP | YES | From base document |
| JoinRequest | YES | addSecureCampusMetadata |
| FeatureFlag | NO | Global by design |

### 14.3. Denormalized Counter Drift Risk

| Counter | Location | Incremented | Decremented | Drift Risk |
|---------|----------|-------------|-------------|------------|
| `space.memberCount` | spaces doc | On join (entry, direct join) | NOT OBSERVED | HIGH -- grows only |
| `space.metrics.memberCount` | spaces doc | On join (parallel) | NOT OBSERVED | HIGH -- parallel counter |
| `board.messageCount` | board doc | DDD entity method | NOT OBSERVED | MEDIUM |
| `profile.followerCount` | profiles doc | Unknown | Unknown | HIGH |
| `profile.spaceCount` | profiles doc | Unknown | Unknown | HIGH |
| `post.engagement.*` | posts doc | Unknown | Unknown | MEDIUM |

---

## 15. Discrepancy Audit

### 15.1. Fields in DATABASE_SCHEMA.md but NOT in Code

| Entity | Field | Status |
|--------|-------|--------|
| User | `onboardingComplete` | DEPRECATED -- replaced by `entryCompletedAt` |
| User | `uid` | `id` used instead |
| Space | `slug` | May still exist on imported spaces, `handle` preferred |
| Post | `reactions.likes`/`reactions.comments` | Marked as "legacy" in schema |
| ChatChannel (schema) | entire collection | REPLACED by `spaces/{id}/boards` subcollection |
| ChatMessage (schema) | `channelId` | REPLACED by `boardId` in subcollection path |
| ChannelMembership | entire collection | REPLACED by read_receipts subcollection |

### 15.2. Fields in Code but NOT in DATABASE_SCHEMA.md

| Entity | Field | Where Used |
|--------|-------|------------|
| User | `firstName`, `lastName` | complete-entry route |
| User | `entryCompletedAt` | complete-entry route |
| User | `residenceType`, `residentialSpaceId` | complete-entry route |
| User | `communityIdentities` | complete-entry route |
| User | `majorSpaceId`, `homeSpaceId`, `communitySpaceIds` | complete-entry route |
| Space | `identityType`, `majorName`, `communityType` | complete-entry auto-join |
| Space | `isUnlocked`, `isUniversal` | complete-entry auto-join |
| Space | `name_lowercase`, `trendingScore` | indexes |
| Space | `metrics.*`, `stats.*`, `featured` | indexes |
| Space | `joinPolicy`, `members` (array) | indexes |
| SpaceMember | `isActive` | All queries |
| SpaceMember | `status` | Indexes (undocumented field) |
| Message | `replyToPreview` | Automation-created messages |
| Message | `metadata` | Automation-created messages |
| Message | `componentData` | Inline HiveLab components |
| Notification | `category`, `actionUrl`, `metadata` | createNotification calls |
| Notification | `isRead` (vs `read`) | Index field name |
| Board | entire entity | DDD entity, not in DATABASE_SCHEMA.md |

### 15.3. Zod Schemas in packages/validation Never Imported

**Only 2 files import from `@hive/validation`:**
1. `infrastructure/firebase/functions/src/feed/getFeed.ts` -- uses `FeedCard`
2. `infrastructure/firebase/functions/src/profile/updateUserProfile.ts` -- uses `UserProfileSchema`

**NEVER imported (dead validation code):**
- `packages/validation/src/space.schema.ts` (top-level) -- `CreateSpaceInputSchema`, `UpdateSpaceInputSchema`, `SpaceSchema`
- `packages/validation/src/chat.schema.ts` -- `SendMessageInputSchema`, `MessageSchema`, `SearchMessagesInputSchema`
- `packages/validation/src/event.schema.ts` -- `CreateEventInputSchema`, `EventSchema`
- `packages/validation/src/tool.schema.ts` -- `CreateToolInputSchema`, `ToolSchema`
- `packages/validation/src/settings.schema.ts` -- All notification/privacy/account schemas
- `packages/validation/src/schemas/waitlist.schema.ts` -- `waitlistEntrySchema`

**Root cause:** API routes define their own inline Zod schemas instead of importing from the shared validation package.

### 15.4. Type Definitions That Conflict Across Packages

| Type | packages/core/src/types | packages/validation | DATABASE_SCHEMA.md |
|------|------------------------|--------------------|--------------------|
| `User.role` | `'student' \| 'alumni' \| 'faculty' \| 'staff' \| 'admin'` | N/A (`roles: string[]`) | N/A |
| `User.handle` | N/A | min 4, max 15 | Just `string` |
| `Space.category` | `'academic' \| 'social' \| 'professional' \| 'hobby' \| 'other'` | 15+ values including 'major', 'residential' | Not enumerated |
| `Space` interface | `leaderId: string` (singular) | `ownerId?: string` | `leaderIds: string[]` (array) |
| `SpaceSettings` | `allowPosts`, `requireApproval`, `allowEvents`, `allowTools` | `allowMemberInvites`, `requireApproval`, `showMemberCount`, `enableChat`, `enableEvents`, `enableResources` | Not defined |
| `Member.role` | `'leader' \| 'moderator' \| 'member'` | `'owner' \| 'admin' \| 'moderator' \| 'member' \| 'guest'` | `'owner' \| 'admin' \| 'leader' \| 'moderator' \| 'member' \| 'guest'` |
| `Tool` owner field | `creatorId` | `ownerId` | `creatorId` |
| `Event` time fields | `startTime`/`endTime` | `startAt`/`endAt` | `startTime`/`endTime` |
| `SpaceStatus` | N/A | `'draft' \| 'live' \| 'archived' \| 'suspended'` (top-level) vs `'unclaimed' \| 'active' \| 'claimed' \| 'verified'` (schemas/) | `'unclaimed' \| 'claimed' \| 'active' \| 'verified'` |
| `SpaceVisibility` | N/A | `'public' \| 'private' \| 'unlisted'` (top-level) vs `'public' \| 'private'` (schemas/) | `'public' \| 'private' \| 'members_only'` |
| `Profile` | Duplicated interface -- defined twice in types/index.ts | `MotionEntrySchema`, `PersonalToolSchema` (unrelated) | Separate collection |

### 15.5. Undocumented Collections Found in Indexes

Collections that have indexes but no schema documentation:
- `activityFeed`
- `connections`
- `content_metrics`
- `content_reports`
- `dm_conversations`
- `feed`
- `friend_requests`
- `friendships`
- `inlineComponents`
- `interactions`
- `moderation_queue`
- `moderation_feedback`
- `presence`
- `resources`
- `ritual_action_completions`
- `ritual_events`
- `ritual_matchups`
- `ritual_participants`
- `ritual_templates`
- `ritual_votes`
- `spaceWaitlists`
- `toolInstalls`
- `trending`
- `typing`
- `user_activities`
- `user_engagement_metrics`
- `user_follows`
- `user_recommendations`
- `user_social_graphs`
- `automations` (subcollection)
- `automationRuns`
- `auditLog`
- `ai_generations`
- `analytics_events`
- `calendar_events`
- `participants` (subcollection)
- `participations` (subcollection)

**That is 30+ undocumented collections** with defined indexes but no schema in DATABASE_SCHEMA.md.

---

## Summary of Critical Findings

1. **DATABASE_SCHEMA.md is significantly outdated.** The chat system was refactored from top-level `chatMessages`/`chatChannels` to subcollection-based `spaces/{id}/boards/{id}/messages` but the schema doc was never updated.

2. **30+ Firestore collections have no schema documentation.** They have indexes deployed but no documented contract.

3. **The entire `packages/validation` package is effectively dead code.** Only 2 files in a legacy Cloud Functions directory import from it. All API routes define inline Zod schemas.

4. **Three different type systems conflict:** `packages/core/src/types`, `packages/validation/src`, and `DATABASE_SCHEMA.md` define overlapping but incompatible types for the same entities.

5. **Timestamp formats are inconsistent** across entities (ISO strings, Firestore Timestamps, Unix milliseconds).

6. **Denormalized counters only increment, never decrement.** `memberCount`, `metrics.memberCount` will drift upward over time.

7. **Denormalized user snapshots in SpaceMember and Message have no update propagation.** `userName`, `userHandle`, `authorName` go stale when users update their profiles.

8. **The Handle entity is not campus-scoped.** Multi-campus expansion will cause namespace collisions.

9. **Tool owner field uses three different names** (`creatorId`, `createdBy`, `ownerId`) across schema doc, indexes, and validation -- queries will miss documents depending on which field was written.

10. **Event time fields use three different names** (`startTime`/`endTime`, `startAt`/`endAt`, `startDate`/`endDate`) creating query confusion and potential data fragmentation.
