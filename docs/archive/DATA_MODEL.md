# Data Model

Firebase Firestore collections and document shapes for the HIVE platform.

**Source of truth:** `packages/core/src/infrastructure/firestore-collections.ts` defines all collection paths centrally. Type definitions live in `packages/core/src/types/` and `packages/validation/src/`.

---

## Collection Map

### Top-Level Collections

| Collection | Document ID | Description |
|---|---|---|
| `users` | Firebase Auth UID | User accounts and profile data |
| `profiles` | User ID | Extended profile data (profile system) |
| `handles` | Handle string | Handle uniqueness enforcement |
| `schools` | School ID | Campus/university configuration |
| `spaces` | Auto-generated | Student organizations and groups |
| `spaceMembers` | Auto-generated | Space membership records (flat, legacy) |
| `spaceWaitlists` | `{spaceId}_{userId}` | Major space unlock waitlist |
| `events` | Auto-generated | Events (flat, legacy) |
| `rsvps` | Auto-generated | Event RSVPs (flat, legacy) |
| `posts` | Auto-generated | Feed posts (flat, legacy) |
| `feed` | Auto-generated | Feed cards for the home feed |
| `tools` | Auto-generated | HiveLab tools (templates) |
| `deployedTools` | Auto-generated | Tool deployments in spaces |
| `toolStates` | Auto-generated | Tool runtime state |
| `connections` | Auto-generated | User-to-user connections |
| `notifications` | Auto-generated | Push/in-app notifications |
| `activityEvents` | Auto-generated | Activity tracking events |
| `dm_conversations` | `dm_{sortedId1}_{sortedId2}` | Direct message conversations |
| `waitlist` | Auto-generated | School launch waitlist |
| `access_codes` | Auto-generated | Gated access codes (SHA256 hashed) |
| `featureFlags` | Flag ID | Feature flag configuration |
| `admins` | User ID | Admin user records |
| `adminActivityLogs` | Auto-generated | Admin audit trail |
| `reports` | Auto-generated | Content moderation reports |
| `user_follows` | Auto-generated | Follow relationships (social graph) |
| `user_social_graphs` | User ID | Computed social graph metrics |
| `user_social_insights` | User ID | Weekly social insights |
| `mutual_connections` | `{user1Id}_{user2Id}` | Mutual connection cache |
| `user_engagement_metrics` | User ID | Engagement scoring |
| `user_achievements` | Auto-generated | Gamification achievements |
| `user_activities` | Auto-generated | Activity log for analytics |
| `user_profiles` | User ID | Legacy profile collection (Cloud Functions) |
| `platform_metrics` | Auto-generated / `latest` | Platform-wide analytics |
| `content_metrics` | Auto-generated | Content performance metrics |
| `sentReminders` | Reminder key | Deduplication for automation reminders |
| `metadata` | Key string | System metadata (e.g., `rss_sync`) |
| `invitations` | Auto-generated | Space/club invitations |
| `builderRequests` | Auto-generated | Builder role requests |
| `contentReports` | Auto-generated | Content report records |

### Subcollections (Nested Under Parent Documents)

| Path | Description |
|---|---|
| `spaces/{spaceId}/boards` | Chat boards within a space |
| `spaces/{spaceId}/boards/{boardId}/messages` | Chat messages |
| `spaces/{spaceId}/boards/{boardId}/typing` | Typing indicators |
| `spaces/{spaceId}/boards/{boardId}/read_receipts` | Per-user read state |
| `spaces/{spaceId}/tabs` | Custom tabs for a space |
| `spaces/{spaceId}/widgets` | Dashboard widgets |
| `spaces/{spaceId}/placed_tools` | Tools deployed to a space |
| `spaces/{spaceId}/placed_tools/{toolId}/state` | Per-tool runtime state |
| `spaces/{spaceId}/posts` | Posts within a space (nested path) |
| `spaces/{spaceId}/events` | Events within a space (nested path) |
| `spaces/{spaceId}/members` | Members (nested path, used by some Cloud Functions) |
| `tools/{toolId}/versions` | Tool version history |
| `feed/{cardId}/likes` | Per-card like records |
| `users/{userId}/follows` | Users this user follows |
| `dm_conversations/{conversationId}/messages` | DM messages |
| `deployedTools/{deploymentId}/automationRuns` | Automation execution history |
| `deployedTools/{deploymentId}/automations` | Automation configurations |
| `deployedTools/{deploymentId}/sharedState` | Shared tool state |
| `deployedTools/{deploymentId}/events` | Tool event log |

---

## Document Shapes

### users

The primary user document, created on Firebase Auth signup.

```typescript
// Collection: users
// Document ID: Firebase Auth UID
{
  uid: string;                    // Same as document ID
  email: string | null;           // .edu email address
  schoolId: string | null;        // Campus ID (e.g., 'ub-buffalo')
  fullName: string | null;        // Set during onboarding
  preferredName?: string;         // Optional display name
  handle: string | null;          // Unique lowercase alphanumeric, 4-15 chars
  bio: string | null;
  major: string | null;
  graduationYear: number | null;
  avatarUrl: string | null;

  // Builder system
  builderOptIn: boolean;
  isBuilder: boolean;

  // Onboarding
  onboardingCompleted: boolean;
  onboardingCompletedAt: Timestamp | null;
  consentGiven: boolean;
  consentGivenAt: Timestamp | null;

  // Identity system fields
  residenceType?: 'on-campus' | 'off-campus' | 'commuter';
  residentialSpaceId?: string;
  interests: string[];            // Max 20
  communityIdentities?: {
    international?: boolean;
    transfer?: boolean;
    firstGen?: boolean;
    commuter?: boolean;
    graduate?: boolean;
    veteran?: boolean;
  };

  // Auto-join space associations
  majorSpaceId?: string;
  homeSpaceId?: string;
  communitySpaceIds: string[];

  // Social counters (denormalized)
  followingCount: number;
  followersCount: number;

  // FCM push tokens
  fcmTokens?: Record<string, string>;

  // Legal
  legal?: {
    termsOfServiceAcceptedVersion: string;
    privacyPolicyAcceptedVersion: string;
    acceptedAt: Timestamp;
  };

  // Metadata
  campusId?: string;              // Campus isolation field
  status: 'active' | 'suspended' | 'deleted';
  roles: string[];                // Default: ['student']
  reputation: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSeen: Timestamp;
}
```

**Campus isolation:** Every user query filters by `campusId`. The `schoolId` field maps to the campus domain.

### profiles (Profile System)

Extended profile data implementing the modular profile system.

```typescript
// Collection: profiles
// Document ID: User ID
// Defined in: packages/core/src/types/profile-system.ts
{
  userId: string;
  campusId: string;               // 'ub-buffalo' for vBETA
  handle: string;

  // Backward compatibility top-level fields
  fullName?: string;
  avatarUrl?: string;

  // Module 1: Identity
  identity?: {
    fullName?: string;
    avatarUrl?: string;
    academic?: {
      name: string;
      year: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate';
      majors: string[];
      minors: string[];
      pronouns?: string;
      graduationYear: number;
    };
    photoCarousel?: {
      photos: Array<{
        id: string;
        url: string;
        thumbnailUrl?: string;
        order: number;
        tags: string[];
        uploadedAt: Timestamp;
        context?: 'academic' | 'social' | 'residential' | 'activities';
      }>;
      currentIndex: number;
      rotationInterval: 30000;
      lastUpdated: Timestamp;
      freshnessThreshold: number;
    };
    badges?: Array<{
      id: string;
      type: 'builder' | 'student_leader' | 'contributor' | 'early_adopter'
            | 'founding_leader' | 'founding_member' | 'verified_leader';
      name: string;
      description: string;
      earnedAt: Timestamp;
      displayOrder: number;
    }>;
  };

  // Module 2: Connections
  connections?: {
    friends: Array<{ userId: string; type: 'friend'; sharedSpaces: string[];
                     connectedAt: Timestamp; friendsSince: Timestamp; mutualFriends: number }>;
    connections: Array<{ userId: string; type: 'connection'; sharedSpaces: string[];
                         connectedAt: Timestamp; lastInteraction?: Timestamp }>;
    pendingRequests: string[];
    blockedUsers: string[];
  };

  // Module 3: Presence
  presence?: {
    vibe: string;                 // Status emoji + text, max 30 chars
    vibeUpdatedAt: Timestamp;
    beacon?: {
      active: boolean;
      duration: 1 | 2 | 4;       // Hours
      message?: string;           // 20 chars max
      expiresAt: Timestamp;
      visibilityRules: { friends: 'always'; connections: 'sharedSpacesOnly'; campus?: 'never' };
    };
    lastActive: Timestamp;
    isOnline: boolean;
    currentActivity?: { type: 'studying' | 'in_space' | 'at_event' | 'available'; context?: string };
  };

  // Module 4: Bento Grid
  grid?: {
    cards: Array<{
      id: string;
      type: 'identity' | 'heatmap' | 'spaces' | 'tools' | 'connections'
            | 'interests' | 'stats' | 'featuredTool' | 'custom';
      position: { x: number; y: number };
      size: '1x1' | '2x1' | '2x2' | '1x2' | '4x1';
      visible: boolean;
      config?: Record<string, unknown>;
    }>;
    mobileLayout: BentoCard[];
    lastModified: Timestamp;
  };

  // Module 5: Privacy
  privacy?: {
    ghostMode: boolean;
    visibilityLevel: 'ghost' | 'friends' | 'connections' | 'campus';
    scheduleSharing: { friends: boolean; connections: boolean };
    availabilityBroadcast: { friends: boolean; connections: boolean; campus: boolean };
    discoveryParticipation: boolean;
    spaceActivityVisibility: Map<string, boolean>;
  };

  // Module 6: Intelligence
  intelligence?: {
    schedule: ScheduleBlock[];
    overlaps: ScheduleOverlap[];
    suggestions: DiscoverySuggestion[];
    lastCalculated: Timestamp;
  };

  // Metadata
  completeness: number;           // 0-100
  isSetupComplete: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### spaces

Student organizations, clubs, groups, and campus communities.

```typescript
// Collection: spaces
// Document ID: Auto-generated
// Validation: packages/validation/src/schemas/space.schema.ts
{
  id: string;
  name: string;                   // 3-50 chars
  description: string;            // 10-500 chars
  handle?: string;                // URL slug, 3-30 chars, lowercase + hyphens
  slug?: string;                  // Legacy alias for handle
  imageUrl?: string;
  coverImageUrl?: string;
  iconUrl?: string;

  // Classification
  category: 'major' | 'residential' | 'greek_life' | 'student_organizations'
            | 'university_organizations' | 'campus_living' | 'hive_exclusive'
            | 'interest' | 'community' | 'academic' | 'cultural' | 'sports'
            | 'arts' | 'service' | 'professional';
  spaceType: 'student_organizations' | 'university_organizations' | 'greek_life'
             | 'campus_living' | 'hive_exclusive';
  tags?: string[];                // Max 10, each max 30 chars

  // Governance & lifecycle
  governance: 'flat' | 'emergent' | 'hybrid' | 'hierarchical';
  status: 'unclaimed' | 'active' | 'claimed' | 'verified';
  source: 'ublinked' | 'user-created';
  externalId?: string;            // For imported spaces
  publishStatus: 'stealth' | 'live' | 'rejected';

  // Ownership
  ownerId?: string;
  createdBy?: string;

  // Visibility & access
  visibility: 'public' | 'private';
  isPublic: boolean;
  isActive: boolean;

  // Metrics
  memberCount: number;
  metrics?: {
    memberCount: number;
    activeMembers: number;
  };

  // Settings
  settings?: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    showMemberCount: boolean;
    enableChat: boolean;
    enableEvents: boolean;
    enableResources: boolean;
  };

  // Campus isolation
  campusId: string;               // REQUIRED - every query filters on this

  // Timestamps
  claimedAt?: Timestamp;
  wentLiveAt?: Timestamp;
  lastActivityAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Campus isolation:** All space queries include `.where('campusId', '==', campusId)`. The `secure-firebase-queries.ts` module enforces this server-side.

### spaceMembers (Flat, Legacy)

Membership records linking users to spaces. Currently flat; migration path exists to nest under `spaces/{id}/members`.

```typescript
// Collection: spaceMembers
// Document ID: Auto-generated
{
  userId: string;
  spaceId: string;
  campusId: string;               // Campus isolation
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';
  isActive: boolean;
  joinedAt: Timestamp;
  lastActiveAt?: Timestamp;
  contributions?: number;
}
```

**Indexes required:**
- `spaceId + campusId + isActive + joinedAt` (composite)
- `userId + campusId + isActive + spaceId` (composite)

### spaces/{spaceId}/members (Nested)

Some Cloud Functions use the nested path. Same shape as `spaceMembers` but without `spaceId` (implied by path).

```typescript
// Subcollection: spaces/{spaceId}/members
// Document ID: User ID
{
  role: 'member' | 'admin' | 'moderator' | 'owner';
  joinedAt: Timestamp;
}
```

### events

Events associated with spaces.

> ⚠️ **Schema diverges for CampusLabs imports.** The schema below is the ideal/user-created shape.
> The 2,772 real events in production (CampusLabs imports) use `startDate: string` (ISO 8601),
> `imageUrl` (not `coverImageUrl`), flat `location: string`, and have no `spaceHandle` field.
> See `docs/FIRESTORE_SCHEMA.md` → Critical Data Gotchas before writing any event queries.

```typescript
// Collection: events (flat) or spaces/{spaceId}/events (nested)
// Validation: packages/validation/src/event.schema.ts
{
  id: string;
  spaceId: string;
  title: string;                  // 3-100 chars
  description?: string;           // Max 2000 chars
  type: 'meeting' | 'workshop' | 'social' | 'academic' | 'sports'
        | 'cultural' | 'professional' | 'other';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  visibility: 'public' | 'members' | 'private';

  // Timing — USER-CREATED events only. CampusLabs imports use startDate: string instead.
  startAt: Timestamp;
  endAt: Timestamp;

  // Location
  location?: {
    type: 'in_person' | 'virtual' | 'hybrid';
    name?: string;
    address?: string;
    virtualLink?: string;
    coordinates?: { lat: number; lng: number };
  };

  coverImageUrl?: string;
  maxAttendees?: number;
  requireApproval: boolean;
  tags?: string[];

  // Ownership
  organizerId: string;
  campusId: string;

  // Counters
  attendeeCount: number;

  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

### rsvps

Event RSVP records.

```typescript
// Collection: rsvps (flat) or spaces/{spaceId}/events/{eventId}/rsvps (nested)
{
  eventId: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  status: 'going' | 'maybe' | 'not_going' | 'waitlist';
  respondedAt: Timestamp;
  note?: string;                  // Max 200 chars
}
```

### posts

User posts within spaces.

```typescript
// Collection: posts (flat) or spaces/{spaceId}/posts (nested)
{
  id: string;
  authorId: string;
  author: {
    name: string;
    avatarUrl: string | null;
  };
  spaceId: string;
  content: string;
  campusId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### feed

Feed cards for the home feed experience.

```typescript
// Collection: feed
// Validation: packages/validation/src/feed.schema.ts
{
  id: string;
  type: 'featured_spaces' | 'tool_buzz' | 'upcoming_event' | 'app_news'
        | 'new_content' | 'builder_spotlight' | 'campus_tip';
  sourceId: string;               // ID of the original document
  sourceType: string;             // e.g., 'event', 'post', 'tool'
  timestamp: Timestamp;
  expiresAt?: Timestamp;          // TTL
  pinned: boolean;
  content: Record<string, any>;   // Card-specific payload
  interactionData: {
    likes: number;
    comments: number;
  };
}
```

**Subcollection: `feed/{cardId}/likes`**

```typescript
{
  userId: string;
  likedAt: Timestamp;
}
```

### tools

HiveLab tool templates created by users.

```typescript
// Collection: tools
// Validation: packages/validation/src/tool.schema.ts
{
  id: string;
  name: string;                   // 2-60 chars
  description: string;            // 10-500 chars
  prompt: string;                 // 20-2000 chars (AI prompt)
  category: 'productivity' | 'social' | 'academic' | 'creative' | 'utility' | 'fun' | 'other';
  status: 'draft' | 'published' | 'archived' | 'suspended';
  visibility: 'private' | 'unlisted' | 'public';
  iconEmoji?: string;

  // Input configuration
  inputSchema?: {
    fields: Array<{
      id: string;
      name: string;
      type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date';
      label: string;
      placeholder?: string;
      required: boolean;
      options?: string[];
      validation?: { min?: number; max?: number; pattern?: string };
    }>;
    submitLabel: string;
  };

  // A/B testing
  variants?: Array<{
    id: string;
    name: string;
    prompt: string;
    isActive: boolean;
    weight: number;               // 0-100
  }>;

  // Ownership
  ownerId: string;
  campusId: string;

  // Counters
  usageCount: number;
  deploymentCount: number;

  createdAt: Timestamp;
  updatedAt?: Timestamp;
  publishedAt?: Timestamp;
}
```

**Subcollection: `tools/{toolId}/versions`** - Version history for tool revisions.

### deployedTools

Tool instances deployed into specific spaces.

```typescript
// Collection: deployedTools
{
  id: string;
  toolId: string;                 // Reference to tools collection
  spaceId: string;
  deployedBy: string;
  position?: { x?: number; y?: number; order?: number };
  createdAt: Timestamp;
}
```

**Subcollections:**
- `deployedTools/{id}/automationRuns` - Execution history
- `deployedTools/{id}/automations` - Automation configurations
- `deployedTools/{id}/sharedState` - Shared runtime state
- `deployedTools/{id}/events` - Tool event log

### spaces/{spaceId}/boards

Chat boards (channels) within a space.

```typescript
// Subcollection: spaces/{spaceId}/boards
{
  id: string;
  name: string;
  type: string;
  createdAt: Timestamp;
}
```

### spaces/{spaceId}/boards/{boardId}/messages

Chat messages within a board.

```typescript
// Subcollection: spaces/{spaceId}/boards/{boardId}/messages
// Validation: packages/validation/src/chat.schema.ts
{
  id: string;
  spaceId: string;
  content: string;                // 1-4000 chars, HTML stripped
  type: 'text' | 'image' | 'file' | 'system' | 'announcement';
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    handle?: string;
  };
  replyTo?: string;               // Message ID
  attachments?: Array<{
    id: string;
    type: 'image' | 'file' | 'link';
    url: string;
    name?: string;
    mimeType?: string;
    size?: number;                // Max 50MB
    thumbnailUrl?: string;
  }>;
  mentions?: string[];            // User IDs
  reactions?: Array<{
    emoji: string;
    userIds: string[];
    count: number;
  }>;
  isPinned: boolean;
  pinnedBy?: string;
  pinnedAt?: Timestamp;
  isEdited: boolean;
  editedAt?: Timestamp;
  isDeleted: boolean;
  deletedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
```

### dm_conversations

Direct message conversations between two users.

```typescript
// Collection: dm_conversations
// Document ID: dm_{sortedUserId1}_{sortedUserId2} (deterministic)
{
  participantIds: string[];       // Sorted array of two user IDs
  participants: Record<string, {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  }>;
  lastMessage: {
    content: string;              // First 100 chars
    senderId: string;
    timestamp: Timestamp;
  } | null;
  readState: Record<string, {     // Keyed by userId
    lastReadAt: Timestamp | null;
    unreadCount: number;
  }>;
  campusId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Subcollection: `dm_conversations/{conversationId}/messages`**

```typescript
{
  senderId: string;
  senderName: string;
  senderHandle: string;
  senderAvatarUrl: string | null;
  content: string;                // Max 4000 chars
  type: 'text';
  timestamp: Timestamp;
  isDeleted: boolean;
}
```

**Feature flag gated:** DMs require the `dms` feature flag to be enabled.

### spaceWaitlists

Waitlist entries for locked major spaces (spaces that need 10 members to unlock).

```typescript
// Collection: spaceWaitlists
// Document ID: {spaceId}_{userId}
// Validation: packages/validation/src/schemas/waitlist.schema.ts
{
  id: string;                     // Same as document ID
  spaceId: string;
  userId: string;
  majorName?: string;
  joinedAt: string;               // ISO timestamp
  notified: boolean;
  notifiedAt?: string;
  campusId: string;
}
```

**Indexes required:**
- `spaceId + notified + joinedAt ASC`
- `userId + campusId`

### waitlist

School launch waitlist for pre-launch signups.

```typescript
// Collection: waitlist
{
  schoolId: string;
  email: string;
  joinedAt: Timestamp;
  status: 'pending';
}
```

### access_codes

Gated access codes for platform entry. Codes are SHA256 hashed before storage.

```typescript
// Collection: access_codes
{
  codeHash: string;               // SHA256 hash of the 6-digit code
  active: boolean;
  createdAt: Timestamp;
  createdBy: string;
  notes: string;
  useCount: number;
  lastUsed: Timestamp | null;
}
```

### schools

Campus/university configuration.

```typescript
// Collection: schools
{
  id: string;                     // e.g., 'ub-buffalo'
  domain: string;                 // e.g., 'buffalo.edu'
  name: string;
  // Additional school config fields
}
```

### handles

Handle uniqueness enforcement. Each document ID is the handle string itself.

```typescript
// Collection: handles
// Document ID: the handle string (lowercase)
{
  userId: string;
  createdAt: Timestamp;
}
```

### featureFlags

Feature flag configuration for gradual rollouts.

```typescript
// Collection: featureFlags
{
  id: string;
  name: string;
  description: string;
  category: 'core' | 'experimental' | 'infrastructure' | 'ui_ux' | 'tools'
            | 'spaces' | 'admin' | 'profile';
  enabled: boolean;
  rollout: {
    type: 'all' | 'percentage' | 'users' | 'schools' | 'ab_test';
    percentage?: number;
    targetUsers?: string[];
    targetSchools?: string[];
    abTestGroups?: Record<string, { percentage: number; config?: Record<string, unknown> }>;
  };
  config?: Record<string, unknown>;
  conditions?: {
    userRole?: string[];
    spaceType?: string[];
    userCount?: { min?: number; max?: number };
    timeWindow?: { start: string; end: string };
  };
  metadata: {
    createdAt: string;
    createdBy: string;
    updatedAt: string;
  };
}
```

### admins

Admin user records for the admin panel.

```typescript
// Collection: admins
// Document ID: User ID
{
  userId: string;
  role: string;
  permissions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### reports

Content moderation reports.

```typescript
// Collection: reports
{
  reportId: string;
  reporter: {
    uid: string;
    email: string;
  };
  content: {
    id: string;
    type: string;                 // Collection name of reported content
    ownerId: string;
  };
  reason: string;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt: Timestamp;
}
```

### notifications

User notifications.

```typescript
// Collection: notifications
{
  userId: string;
  title: string;
  body: string;
  type: string;                   // 'message', 'event', 'invitation', 'achievement', etc.
  data: Record<string, string>;
  read: boolean;
  createdAt: Timestamp;
}
```

### user_follows

Follow relationships for the social graph.

```typescript
// Collection: user_follows
{
  followerId: string;
  followedId: string;
  followedAt: Timestamp;
}
```

**Triggers:** Creating/deleting documents triggers `analyzeSocialGraph` / `processSocialGraphChange` Cloud Functions that update `user_social_graphs`.

### users/{userId}/follows

Per-user follow subcollection (used by some Cloud Functions alongside the flat `user_follows`).

```typescript
// Subcollection: users/{userId}/follows
// Document ID: followed user's ID
{
  userId: string;                 // The followed user
  followedAt: Timestamp;
}
```

### user_social_graphs

Computed social graph metrics, updated by Cloud Functions.

```typescript
// Collection: user_social_graphs
// Document ID: User ID
{
  userId: string;
  followerCount: number;
  followingCount: number;
  mutualConnectionsMap: Record<string, number>;
  influenceScore: number;
  strongConnections: string[];    // Top 10 user IDs
  clusters: string[];             // Top 5 interest clusters
  lastUpdated: Timestamp;
}
```

### invitations

Space/club invitations.

```typescript
// Collection: invitations
{
  invitedUserId: string;
  inviterUserId: string;
  inviterName?: string;
  spaceId?: string;
  clubId?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Timestamp;
}
```

---

## Migration Status

The codebase is migrating from flat top-level collections to nested subcollections. Migration flags are defined in `packages/core/src/infrastructure/firestore-collections.ts`:

| Flag | Current | From | To |
|---|---|---|---|
| `USE_NESTED_POSTS` | `false` | `/posts` | `/spaces/{id}/posts` |
| `USE_NESTED_EVENTS` | `false` | `/events` | `/spaces/{id}/events` |
| `USE_NESTED_MEMBERS` | `false` | `/spaceMembers` | `/spaces/{id}/members` |
| `USE_NESTED_RSVPS` | `false` | `/rsvps` | `/spaces/{id}/events/{id}/rsvps` |
| `USE_NESTED_TYPING` | `true` | `/typingIndicators` | Board-level subcollection |

When using nested collections, cross-space queries use `collectionGroup()` instead of `collection()`.

### Naming Inconsistencies

- `spaceMembers` (124 refs) vs `space_members` (10 refs) -- canonical: **`spaceMembers`**
- `users` (107 refs) vs `profiles` (7 refs) -- `users` is auth data, `profiles` is extended profile system data
- `user_profiles` (Cloud Functions legacy) vs `users` (web app) -- both refer to user data

---

## Campus Isolation

Every query that returns user-facing data filters by `campusId`. This is enforced at:

1. **API routes** -- `getCampusId(request)` extracts campus from session
2. **Secure queries** -- `apps/web/src/lib/secure-firebase-queries.ts` wraps all space/member queries with campus filter
3. **Document creation** -- `addSecureCampusMetadata()` stamps every new document
4. **Security rules** -- Firestore rules enforce campus matching

The `campusId` is never accepted from the client. It is always derived from the authenticated user's session.

---

## Indexes

Composite indexes required (from code analysis):

| Collection | Fields | Order |
|---|---|---|
| `spaceMembers` | `spaceId`, `campusId`, `isActive`, `joinedAt` | `joinedAt` DESC |
| `spaceMembers` | `userId`, `campusId`, `isActive`, `spaceId` | -- |
| `spaceWaitlists` | `spaceId`, `notified`, `joinedAt` | `joinedAt` ASC |
| `spaceWaitlists` | `userId`, `campusId` | -- |
| `dm_conversations` | `participantIds` (array-contains), `updatedAt` | `updatedAt` DESC |
| `user_follows` | `followerId` | -- |
| `user_follows` | `followedId` | -- |
| `user_social_graphs` | `influenceScore` | DESC |
| `user_activities` | `userId`, `action`, `timestamp` | `timestamp` DESC |
| `user_activities` | `targetId`, `targetType`, `timestamp` | `timestamp` DESC |
| `spaces` | `campusId`, `isActive` | -- |
