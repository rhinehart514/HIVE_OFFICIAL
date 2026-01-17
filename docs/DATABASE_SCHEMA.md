# HIVE Database Schema

**Last Updated:** January 2026

## Overview
HIVE uses Firebase Firestore as its primary database. All collections follow a consistent structure with campus isolation for multi-tenancy support.

## Base Document Pattern
All documents inherit these fields:
```typescript
interface BaseDocument {
  id: string;                // Auto-generated document ID
  campusId: string;          // 'ub-buffalo' for vBETA
  createdAt: Timestamp;      // Creation timestamp
  updatedAt: Timestamp;      // Last update timestamp
  createdBy?: string;        // User UID who created
}
```

---

## Primary Collections

### users
Firebase Auth accounts with basic metadata.
```typescript
interface User extends BaseDocument {
  uid: string;               // Firebase Auth UID
  email: string;             // University email
  handle: string;            // Unique @handle
  displayName: string;       // Full name
  photoURL?: string;         // Avatar URL

  // Status
  onboardingComplete: boolean;
  emailVerified: boolean;
  isBuilder: boolean;

  // FCM
  fcmTokens?: string[];      // Push notification tokens
}
```

### profiles
Extended user profile data (separate from auth).
```typescript
interface Profile extends BaseDocument {
  userId: string;            // Links to users.uid

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
  role?: string;             // 'member', 'leader', 'admin'
}
```

### spaces
Communities, organizations, and groups.
```typescript
interface Space extends BaseDocument {
  // Identity
  name: string;
  handle: string;            // Unique @space-handle
  slug: string;              // URL-friendly slug
  description: string;

  // Classification
  type: SpaceType;
  subType?: string;
  tags: string[];
  category?: string;

  // Visuals
  coverImageURL?: string;
  iconURL?: string;

  // Leadership
  leaderIds: string[];       // Primary leaders
  moderatorIds: string[];    // Moderators

  // Settings
  visibility: 'public' | 'private' | 'members_only';
  requiresApproval: boolean;
  isActive: boolean;

  // Features
  hasTools: boolean;
  hasEvents: boolean;
  hasRSS: boolean;
  rssUrl?: string;

  // Counts
  memberCount: number;
  postCount: number;
  eventCount: number;
  toolCount: number;
}

enum SpaceType {
  STUDENT_ORGANIZATIONS = 'student_organizations',
  UNIVERSITY_ORGANIZATIONS = 'university_organizations',
  GREEK_LIFE = 'greek_life',
  CAMPUS_LIVING = 'campus_living',
  HIVE_EXCLUSIVE = 'hive_exclusive'
}
```

### spaceMembers
Top-level membership collection (NOT a subcollection).
```typescript
interface SpaceMember extends BaseDocument {
  spaceId: string;
  userId: string;

  // User snapshot
  userName: string;
  userHandle: string;
  userPhotoURL?: string;

  // Role
  role: 'owner' | 'leader' | 'moderator' | 'member';
  joinedAt: Timestamp;

  // Activity
  lastActiveAt?: Timestamp;
  postCount: number;

  // Permissions
  canPost: boolean;
  canModerate: boolean;
  canManageTools: boolean;
}
```

### posts
Top-level posts collection (NOT a subcollection under spaces).
```typescript
interface Post extends BaseDocument {
  // Content
  content: string;
  title?: string;
  mediaUrls?: string[];

  // Type
  contentType: 'user_post' | 'tool_generated' | 'tool_enhanced' | 'space_event' | 'builder_announcement' | 'rss_import';
  toolId?: string;

  // Author
  authorId: string;
  authorName: string;
  authorHandle?: string;
  authorAvatar?: string;
  authorRole?: string;

  // Location
  spaceId?: string;          // Optional - can be global
  spaceName?: string;

  // Engagement
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
  };

  // Legacy (some posts use this)
  reactions?: {
    likes: number;
    comments: number;
  };

  // Visibility
  visibility: 'public' | 'private' | 'members_only';
  isHidden: boolean;
  isDeleted: boolean;
  isPinned: boolean;
}
```

### posts/[postId]/comments
Comments subcollection under posts.
```typescript
interface Comment extends BaseDocument {
  postId: string;

  // Content
  content: string;

  // Author
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: string;

  // Threading
  parentCommentId?: string;  // For nested replies

  // Engagement
  likeCount: number;

  // Moderation
  isHidden: boolean;
  isDeleted: boolean;
}
```

### tools
HiveLab tools and utilities.
```typescript
interface Tool extends BaseDocument {
  // Identity
  name: string;
  description: string;
  icon: string;

  // Ownership
  creatorId: string;
  creatorName?: string;

  // Configuration
  type: 'template' | 'custom';
  templateId?: string;
  configuration: Record<string, unknown>;

  // Code
  code?: string;             // Tool source code
  elements?: ToolElement[];  // Visual elements

  // Status
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  isTemplate: boolean;

  // Usage
  usageCount: number;
  lastUsedAt?: Timestamp;

  // Analytics
  analytics: {
    views: number;
    uniqueUsers: number;
    avgSessionTime: number;
  };
}
```

### placed_tools
Deployed tools in spaces or profiles.
```typescript
interface PlacedTool extends BaseDocument {
  toolId: string;
  toolName: string;

  // Placement
  placementType: 'space' | 'profile';
  spaceId?: string;
  profileId?: string;

  // Position
  position: 'sidebar' | 'main' | 'header';
  order: number;

  // Status
  isActive: boolean;
  placedAt: Timestamp;
  placedBy: string;

  // Config override
  configOverride?: Record<string, unknown>;
}
```

### events
Campus and space events.
```typescript
interface Event extends BaseDocument {
  // Identity
  title: string;
  description: string;

  // Timing
  startTime: Timestamp;
  endTime: Timestamp;
  timezone: string;
  allDay?: boolean;

  // Location
  location: string;
  locationDetails?: string;
  isVirtual: boolean;
  virtualLink?: string;

  // Organization
  spaceId?: string;
  spaceName?: string;
  organizerId: string;
  organizerName?: string;

  // Attendance
  rsvpCount: number;
  attendeeLimit?: number;

  // Metadata
  tags: string[];
  imageURL?: string;

  // Source
  source: 'user' | 'rss' | 'admin';
  rssSourceId?: string;
}
```

### rsvps
Event RSVP records.
```typescript
interface RSVP extends BaseDocument {
  eventId: string;
  userId: string;

  // User snapshot
  userName: string;
  userAvatar?: string;

  // Status
  status: 'going' | 'maybe' | 'not_going';
  respondedAt: Timestamp;

  // Calendar
  addedToCalendar?: boolean;
}
```

### handles
Unique handle registry.
```typescript
interface Handle {
  handle: string;            // The @handle (doc ID)
  userId: string;            // Owner's UID
  type: 'user' | 'space';    // Handle type
  reservedAt: Timestamp;
}
```

### notifications
User notifications.
```typescript
interface Notification extends BaseDocument {
  userId: string;            // Recipient

  // Content
  type: NotificationType;
  title: string;
  body: string;

  // Reference
  referenceType?: 'space' | 'post' | 'event' | 'user' | 'tool';
  referenceId?: string;

  // Status
  read: boolean;
  readAt?: Timestamp;

  // Actor
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
}

type NotificationType =
  | 'space_invite'
  | 'space_join'
  | 'post_like'
  | 'post_comment'
  | 'mention'
  | 'event_reminder'
  | 'follow'
  | 'system';
```

---

## Chat Collections

### chatChannels
Space chat channels (boards).
```typescript
interface ChatChannel extends BaseDocument {
  spaceId: string;

  // Identity
  name: string;
  description?: string;

  // Type
  type: 'general' | 'announcements' | 'custom';
  isDefault: boolean;

  // Settings
  allowReplies: boolean;
  slowMode?: number;         // Seconds between messages

  // Stats
  messageCount: number;
  lastMessageAt?: Timestamp;
}
```

### channelMemberships
User channel membership state.
```typescript
interface ChannelMembership {
  id: string;                // `${channelId}_${userId}`
  channelId: string;
  userId: string;

  // State
  lastReadAt: Timestamp;
  unreadCount: number;
  muted: boolean;

  joinedAt: Timestamp;
}
```

### chatMessages
Chat messages.
```typescript
interface ChatMessage extends BaseDocument {
  channelId: string;
  spaceId: string;

  // Content
  content: string;
  type: 'text' | 'system' | 'tool_output';

  // Author
  authorId: string;
  authorName: string;
  authorAvatar?: string;

  // Threading
  replyToId?: string;
  replyCount: number;

  // Reactions
  reactions: Record<string, string[]>; // emoji -> userIds

  // Status
  isPinned: boolean;
  isEdited: boolean;
  editedAt?: Timestamp;
  isDeleted: boolean;
}
```

---

## Analytics Collections

### analytics_metrics
Raw analytics events.
```typescript
interface AnalyticsMetric extends BaseDocument {
  // Event
  eventType: string;
  eventName: string;

  // Context
  userId?: string;
  spaceId?: string;
  toolId?: string;

  // Data
  value: number;
  metadata: Record<string, unknown>;

  timestamp: Timestamp;
}
```

### analytics_aggregates
Aggregated analytics.
```typescript
interface AnalyticsAggregate {
  id: string;                // `${metricType}_${period}_${entityId}`

  metricType: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  entityType: 'space' | 'tool' | 'user' | 'campus';
  entityId: string;

  // Values
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;

  periodStart: Timestamp;
  periodEnd: Timestamp;
}
```

---

## Ritual Collections

### rituals
Platform-wide collective experiences.
```typescript
interface Ritual extends BaseDocument {
  name: string;
  title: string;
  description: string;
  tagline: string;

  // Classification
  type: 'onboarding' | 'seasonal' | 'community' | 'emergency';
  category: string;
  tags: string[];

  // Timing
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  startTime: Timestamp;
  endTime?: Timestamp;

  // Scope
  universities: string[];
  isGlobal: boolean;

  // Participation
  participationType: 'individual' | 'team' | 'space';
  maxParticipants?: number;

  // Mechanics
  actions: RitualAction[];
  milestones: RitualMilestone[];
  rewards: RitualReward[];
}
```

### ritual_participation
User participation in rituals.
```typescript
interface RitualParticipation extends BaseDocument {
  ritualId: string;
  userId: string;

  // Status
  status: 'invited' | 'joined' | 'active' | 'completed' | 'dropped';
  joinedAt: Timestamp;
  completedAt?: Timestamp;

  // Progress
  actionsCompleted: string[];
  progressPercentage: number;

  // Engagement
  timeSpent: number;
  interactionCount: number;
}
```

---

## Support Collections

### schools
University configuration.
```typescript
interface School extends BaseDocument {
  name: string;
  shortName: string;
  emailDomain: string;
  campusId: string;

  isActive: boolean;
  launchDate?: Timestamp;

  brandColors: {
    primary: string;
    secondary: string;
  };

  totalUsers: number;
  activeUsers: number;
}
```

### realtimeMessages
Real-time update queue for SSE.
```typescript
interface RealtimeMessage {
  type: string;
  payload: unknown;
  targetUsers?: string[];
  targetSpaces?: string[];
  timestamp: Timestamp;
  ttl: Timestamp;            // Auto-delete after
}
```

---

## Collection Summary

| Collection | Type | Purpose |
|------------|------|---------|
| `users` | Top-level | Auth accounts |
| `profiles` | Top-level | Extended user data |
| `spaces` | Top-level | Communities |
| `spaceMembers` | Top-level | Space memberships |
| `posts` | Top-level | Feed posts |
| `posts/*/comments` | Subcollection | Post comments |
| `tools` | Top-level | HiveLab tools |
| `placed_tools` | Top-level | Deployed tools |
| `events` | Top-level | Calendar events |
| `rsvps` | Top-level | Event RSVPs |
| `handles` | Top-level | Handle registry |
| `notifications` | Top-level | User notifications |
| `chatChannels` | Top-level | Space chat channels |
| `channelMemberships` | Top-level | Channel state |
| `chatMessages` | Top-level | Chat messages |
| `analytics_metrics` | Top-level | Raw analytics |
| `analytics_aggregates` | Top-level | Aggregated stats |
| `rituals` | Top-level | Ritual definitions |
| `ritual_participation` | Top-level | User participation |
| `schools` | Top-level | University config |
| `realtimeMessages` | Top-level | SSE queue |

---

## Indexes

Critical composite indexes are defined in `infrastructure/firebase/firestore.indexes.json`.

Key indexes:
```
// Posts - feed queries
posts: campusId + isDeleted + isHidden + createdAt (DESC)
posts: spaceId + isDeleted + createdAt (DESC)

// Space members
spaceMembers: spaceId + campusId + role
spaceMembers: userId + campusId

// Events
events: campusId + startTime (ASC)
events: spaceId + startTime (ASC)

// Placed tools
placed_tools: spaceId + isActive + placedAt (DESC)
placed_tools: profileId + isActive + placedAt (DESC)

// Notifications
notifications: userId + read + createdAt (DESC)
```

---

## Security Rules

All collections enforce campus isolation and authentication:

```javascript
// Base pattern
allow read: if request.auth != null &&
  resource.data.campusId == 'ub-buffalo';

allow create: if request.auth != null &&
  request.resource.data.campusId == 'ub-buffalo';
```

Full rules in `infrastructure/firebase/firestore.rules`.
