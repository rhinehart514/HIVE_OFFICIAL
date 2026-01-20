# HIVE Entity Relationship Diagram (ERD)

> Complete database schema documentation for HIVE platform
> Last updated: January 2026

## Overview

- **Database**: Firebase Firestore (NoSQL document store)
- **Collections**: 50+ (core + auxiliary + subcollections)
- **Multi-tenancy**: Campus isolation via `campusId`
- **Document limit**: 1MB per document
- **Naming convention**: Mixed (`spaceMembers`, `user_follows`, `contentReports`) — no strict convention

---

## ERD Diagrams

### 1. Core Domain (Users, Spaces, Posts)

```mermaid
erDiagram
    USERS ||--o{ PROFILES : has
    USERS ||--o{ SPACE_MEMBERS : joins
    USERS ||--o{ POSTS : creates
    USERS ||--o{ CONNECTIONS : has
    USERS ||--o{ HANDLES : reserves

    SPACES ||--o{ SPACE_MEMBERS : contains
    SPACES ||--o{ POSTS : contains
    SPACES ||--o{ EVENTS : hosts
    SPACES ||--o{ BOARDS : has

    POSTS ||--o{ COMMENTS : has
    POSTS ||--o{ POST_LIKES : receives

    USERS {
        string uid PK
        string email UK
        string handle UK
        string displayName
        string photoURL
        boolean isBuilder
        boolean onboardingComplete
        boolean emailVerified
        array fcmTokens
        string campusId FK
        timestamp createdAt
        timestamp updatedAt
        timestamp lastActiveAt
    }

    PROFILES {
        string id PK
        string userId FK
        string displayName
        string handle
        string avatarUrl
        string bio
        string userType
        string major
        string academicYear
        number graduationYear
        array interests
        number followerCount
        number followingCount
        number spaceCount
        object privacy
        string campusId FK
        timestamp createdAt
        timestamp updatedAt
    }

    SPACES {
        string id PK
        string name
        string handle UK
        string slug UK
        string description
        string type
        string subType
        array tags
        string category
        string coverImageURL
        string iconURL
        array leaderIds
        array moderatorIds
        string visibility
        boolean requiresApproval
        boolean isActive
        boolean hasTools
        boolean hasEvents
        number memberCount
        number postCount
        number eventCount
        number toolCount
        string campusId FK
        timestamp createdAt
        timestamp updatedAt
    }

    SPACE_MEMBERS {
        string id PK
        string spaceId FK
        string userId FK
        string role
        string userName
        string userHandle
        string userPhotoURL
        boolean canPost
        boolean canModerate
        boolean canManageTools
        number postCount
        timestamp joinedAt
        timestamp lastActiveAt
        string campusId FK
    }

    POSTS {
        string id PK
        string content
        string title
        array mediaUrls
        string contentType
        string toolId FK
        string spaceId FK
        string authorId FK
        string authorName
        string authorHandle
        string authorAvatar
        string authorRole
        string spaceName
        object engagement
        string visibility
        boolean isHidden
        boolean isDeleted
        boolean isPinned
        string campusId FK
        timestamp createdAt
        timestamp updatedAt
    }

    COMMENTS {
        string id PK
        string postId FK
        string content
        string authorId FK
        string authorName
        string authorAvatar
        string authorRole
        string parentCommentId
        number likeCount
        boolean isHidden
        boolean isDeleted
        timestamp createdAt
        timestamp updatedAt
    }

    POST_LIKES {
        string id PK
        string postId FK
        string userId FK
        timestamp createdAt
    }

    CONNECTIONS {
        string id PK
        string userId FK
        string connectedUserId FK
        string type
        string status
        timestamp createdAt
    }

    HANDLES {
        string handle PK
        string userId FK
        string type
        timestamp reservedAt
    }
```

### 2. Events & RSVPs

```mermaid
erDiagram
    SPACES ||--o{ EVENTS : hosts
    EVENTS ||--o{ RSVPS : has
    USERS ||--o{ RSVPS : makes
    USERS ||--o{ PERSONAL_EVENTS : owns
    SCHOOLS ||--o{ CAMPUS_EVENTS : aggregates

    EVENTS {
        string id PK
        string title
        string description
        string spaceId FK
        string spaceName
        string organizerId FK
        string organizerName
        string location
        string locationDetails
        boolean isVirtual
        string virtualLink
        string type
        array tags
        string imageURL
        timestamp startTime
        timestamp endTime
        string timezone
        boolean allDay
        number rsvpCount
        number attendeeLimit
        string status
        string source
        string rssSourceId
        string campusId FK
        timestamp createdAt
        timestamp updatedAt
    }

    RSVPS {
        string id PK
        string eventId FK
        string userId FK
        string userName
        string userAvatar
        string status
        boolean addedToCalendar
        timestamp respondedAt
        string campusId FK
    }

    PERSONAL_EVENTS {
        string id PK
        string userId FK
        string title
        timestamp startTime
        timestamp endTime
        string source
        string externalId
    }

    CAMPUS_EVENTS {
        string id PK
        string title
        string description
        timestamp startTime
        timestamp endTime
        string location
        string source
        string campusId FK
        timestamp createdAt
    }
```

### 3. Chat & Messaging

```mermaid
erDiagram
    SPACES ||--o{ BOARDS : contains
    BOARDS ||--o{ MESSAGES : contains
    MESSAGES ||--o{ INLINE_COMPONENTS : embeds
    INLINE_COMPONENTS ||--o{ PARTICIPANTS : tracks

    BOARDS {
        string id PK
        string spaceId FK
        string name
        string description
        string type
        boolean isDefault
        boolean allowReplies
        number slowMode
        number messageCount
        boolean isLocked
        number position
        timestamp lastMessageAt
        timestamp createdAt
    }

    MESSAGES {
        string id PK
        string boardId FK
        string spaceId FK
        string content
        string type
        string authorId FK
        string authorName
        string authorAvatarUrl
        string authorRole
        object reactions
        string replyToId
        number replyCount
        boolean isPinned
        boolean isEdited
        boolean isDeleted
        number threadCount
        timestamp createdAt
        timestamp editedAt
    }

    INLINE_COMPONENTS {
        string id PK
        string messageId FK
        string spaceId FK
        string elementType
        string deploymentId
        object state
        boolean isActive
        timestamp createdAt
    }

    PARTICIPANTS {
        string id PK
        string componentId FK
        string userId FK
        object response
        timestamp participatedAt
    }

    CHANNEL_MEMBERSHIPS {
        string id PK
        string channelId FK
        string userId FK
        timestamp lastReadAt
        number unreadCount
        boolean muted
        timestamp joinedAt
    }
```

**Note:** `reactions` in MESSAGES is an embedded object `Record<string, string[]>` mapping emoji to userIds, not a separate collection.

### 4. Tools & HiveLab

```mermaid
erDiagram
    USERS ||--o{ TOOLS : creates
    TOOLS ||--o{ DEPLOYED_TOOLS : deploys
    TOOLS ||--o{ TOOL_STATES : has
    TOOLS ||--o{ TOOL_REVIEWS : receives
    SPACES ||--o{ DEPLOYED_TOOLS : contains
    DEPLOYED_TOOLS ||--o{ TOOL_STATES : tracks

    TOOLS {
        string id PK
        string name
        string description
        string icon
        string creatorId FK
        string creatorName
        string type
        string templateId
        object configuration
        string code
        array elements
        string status
        boolean isPublic
        boolean isTemplate
        number usageCount
        object analytics
        timestamp lastUsedAt
        string campusId FK
        timestamp createdAt
        timestamp updatedAt
    }

    DEPLOYED_TOOLS {
        string id PK
        string toolId FK
        string toolName
        string spaceId FK
        string profileId
        string placementType
        string position
        number order
        boolean isActive
        boolean isFeatured
        object configOverride
        string placedBy FK
        timestamp placedAt
        string campusId FK
    }

    TOOL_STATES {
        string id PK
        string toolId FK
        string deploymentId FK
        string spaceId FK
        object state
        timestamp updatedAt
    }

    TOOL_REVIEWS {
        string id PK
        string toolId FK
        string userId FK
        number rating
        string content
        timestamp createdAt
    }
```

**Note:** The codebase uses both `placed_tools` and `deployedTools` collection names. `deployedTools` is the active collection name.

### 5. Notifications & Activity

```mermaid
erDiagram
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ NOTIFICATION_PREFS : configures
    USERS ||--o{ PRESENCE : tracks
    USERS ||--o{ ACTIVITY_LOGS : generates

    NOTIFICATIONS {
        string id PK
        string userId FK
        string type
        string title
        string body
        string referenceType
        string referenceId
        string actorId FK
        string actorName
        string actorAvatar
        boolean read
        timestamp readAt
        timestamp createdAt
    }

    NOTIFICATION_PREFS {
        string id PK
        string userId FK
        boolean emailEnabled
        boolean pushEnabled
        object channelSettings
    }

    PRESENCE {
        string id PK
        string userId FK
        string status
        timestamp lastActiveAt
        string currentSpaceId
    }

    ACTIVITY_LOGS {
        string id PK
        string action
        string actorId FK
        string targetType
        string targetId
        object metadata
        string campusId FK
        timestamp createdAt
    }
```

### 6. Rituals & Gamification

```mermaid
erDiagram
    RITUALS ||--o{ RITUAL_PARTICIPATION : has
    RITUALS ||--o{ RITUAL_ACTIONS : tracks
    USERS ||--o{ RITUAL_PARTICIPATION : joins
    USERS ||--o{ USER_ACHIEVEMENTS : earns

    RITUALS {
        string id PK
        string slug UK
        string name
        string title
        string description
        string tagline
        string type
        string category
        array tags
        string status
        string participationType
        number maxParticipants
        array universities
        boolean isGlobal
        array actions
        array milestones
        array rewards
        timestamp startTime
        timestamp endTime
        string campusId FK
        timestamp createdAt
    }

    RITUAL_PARTICIPATION {
        string id PK
        string ritualId FK
        string userId FK
        string status
        number progressPercentage
        number timeSpent
        number interactionCount
        array actionsCompleted
        array completedMilestones
        object rewards
        timestamp joinedAt
        timestamp completedAt
    }

    RITUAL_ACTIONS {
        string id PK
        string ritualId FK
        string userId FK
        string actionType
        object metadata
        timestamp createdAt
    }

    USER_ACHIEVEMENTS {
        string id PK
        string userId FK
        string achievementType
        string title
        string description
        object metadata
        timestamp earnedAt
    }
```

### 7. Social Graph

```mermaid
erDiagram
    USERS ||--o{ USER_FOLLOWS : follows
    USERS ||--o{ USER_SOCIAL_GRAPHS : has
    USERS ||--o{ USER_SOCIAL_INSIGHTS : receives
    USERS ||--o{ MUTUAL_CONNECTIONS : shares

    USER_FOLLOWS {
        string id PK
        string followerId FK
        string followedId FK
        timestamp createdAt
    }

    USER_SOCIAL_GRAPHS {
        string id PK
        string userId FK
        array followers
        array following
        array mutualConnections
        number influenceScore
        object engagementMetrics
        timestamp lastUpdated
    }

    MUTUAL_CONNECTIONS {
        string id PK
        string user1Id FK
        string user2Id FK
        array mutualIds
        number count
        timestamp createdAt
    }

    USER_SOCIAL_INSIGHTS {
        string id PK
        string userId FK
        object insights
        array recommendations
        timestamp generatedAt
    }

    USER_ACTIVITIES {
        string id PK
        string userId FK
        string activityType
        string targetType
        string targetId
        object metadata
        timestamp createdAt
    }
```

### 8. Moderation System

```mermaid
erDiagram
    USERS ||--o{ CONTENT_REPORTS : submits
    USERS ||--o{ USER_WARNINGS : receives
    USERS ||--o{ USER_SUSPENSIONS : receives
    USERS ||--o{ USER_BANS : receives
    CONTENT_REPORTS ||--o{ MODERATION_QUEUE : populates
    MODERATION_QUEUE ||--o{ MODERATION_FEEDBACK : receives
    MODERATION_QUEUE ||--o{ DELETED_CONTENT : archives

    CONTENT_REPORTS {
        string id PK
        string reporterId FK
        string contentType
        string contentId
        string reason
        string description
        string status
        string priority
        string assignedTo
        timestamp createdAt
        timestamp resolvedAt
        string campusId FK
    }

    MODERATION_QUEUE {
        string id PK
        string contentType
        string contentId
        string reportCount
        string status
        string priority
        string action
        string moderatorId FK
        object metadata
        timestamp createdAt
        timestamp actionTakenAt
    }

    DELETED_CONTENT {
        string id PK
        string contentType
        string contentId
        object originalContent
        string deletedBy FK
        string reason
        timestamp deletedAt
    }

    USER_WARNINGS {
        string id PK
        string userId FK
        string reason
        string contentId
        string issuedBy FK
        timestamp createdAt
        timestamp expiresAt
    }

    USER_SUSPENSIONS {
        string id PK
        string userId FK
        string reason
        string issuedBy FK
        timestamp startedAt
        timestamp endsAt
    }

    USER_BANS {
        string id PK
        string userId FK
        string reason
        string issuedBy FK
        boolean isPermanent
        timestamp createdAt
    }

    MODERATION_RULES {
        string id PK
        string name
        string pattern
        string action
        boolean isActive
        timestamp createdAt
    }

    MODERATION_FEEDBACK {
        string id PK
        string moderationId FK
        string moderatorId FK
        string feedback
        string outcome
        timestamp createdAt
    }
```

### 9. Admin & Auth

```mermaid
erDiagram
    USERS ||--o{ ADMINS : elevates
    ADMINS ||--o{ ADMIN_ACTIVITY_LOGS : generates
    USERS ||--o{ MAGIC_LINKS : requests
    SCHOOLS ||--o{ WAITLIST_ENTRIES : collects

    ADMINS {
        string id PK
        string userId FK
        string email
        string role
        array permissions
        boolean isActive
        timestamp createdAt
        timestamp lastLoginAt
    }

    ADMIN_ACTIVITY_LOGS {
        string id PK
        string adminId FK
        string action
        string targetType
        string targetId
        object metadata
        string ipAddress
        timestamp createdAt
    }

    PENDING_ADMIN_GRANTS {
        string email PK
        string role
        array permissions
        string grantedBy FK
        timestamp createdAt
    }

    MAGIC_LINKS {
        string id PK
        string email
        string token
        boolean used
        timestamp createdAt
        timestamp expiresAt
    }

    SCHOOLS {
        string id PK
        string name
        string shortName
        string emailDomain
        string campusId UK
        boolean isActive
        object brandColors
        number totalUsers
        number activeUsers
        timestamp launchDate
        timestamp createdAt
    }

    WAITLIST_ENTRIES {
        string id PK
        string schoolId FK
        string email
        string name
        string referralSource
        timestamp createdAt
    }

    WAITLIST {
        string id PK
        string email
        string source
        timestamp createdAt
    }
```

### 10. Analytics

```mermaid
erDiagram
    ANALYTICS_METRICS ||--o{ ANALYTICS_AGGREGATES : rolls_up
    PLATFORM_METRICS ||--o{ TRENDING : informs
    CONTENT_METRICS ||--o{ TRENDING : contributes

    ANALYTICS_METRICS {
        string id PK
        string eventType
        string eventName
        string userId FK
        string spaceId FK
        string toolId FK
        number value
        object metadata
        string campusId FK
        timestamp timestamp
    }

    ANALYTICS_AGGREGATES {
        string id PK
        string metricType
        string period
        string entityType
        string entityId
        number count
        number sum
        number avg
        number min
        number max
        timestamp periodStart
        timestamp periodEnd
    }

    USER_ENGAGEMENT_METRICS {
        string id PK
        string userId FK
        string metricType
        number value
        object breakdown
        timestamp periodStart
        timestamp periodEnd
    }

    PLATFORM_METRICS {
        string id PK
        number totalUsers
        number activeUsers
        number totalSpaces
        number totalPosts
        number totalMessages
        number totalEvents
        timestamp timestamp
    }

    CONTENT_METRICS {
        string id PK
        string contentType
        string contentId
        number views
        number interactions
        number shares
        timestamp createdAt
    }

    TRENDING {
        string id PK
        string type
        array items
        timestamp generatedAt
    }
```

### 11. Automation & Real-time

```mermaid
erDiagram
    SPACES ||--o{ AUTOMATIONS : configures
    AUTOMATIONS ||--o{ SENT_REMINDERS : tracks

    AUTOMATIONS {
        string id PK
        string spaceId FK
        string type
        object config
        boolean isActive
        timestamp createdAt
    }

    SENT_REMINDERS {
        string id PK
        string automationId FK
        string eventId FK
        string type
        timestamp sentAt
    }

    REALTIME_MESSAGES {
        string id PK
        string type
        object payload
        array targetUsers
        array targetSpaces
        timestamp timestamp
        timestamp ttl
    }

    CAMPUS_DATA {
        string id PK
        string campusId FK
        string dataType
        object data
        timestamp lastUpdated
    }
```

---

## Collection Reference

### Core Collections (Top-Level)

| Collection | Primary Key | Foreign Keys | Description |
|------------|-------------|--------------|-------------|
| `users` | `uid` | `campusId` | Firebase Auth accounts |
| `profiles` | `id` | `userId`, `campusId` | Extended user profiles |
| `spaces` | `id` | `campusId` | Communities/organizations |
| `spaceMembers` | `id` | `spaceId`, `userId`, `campusId` | Membership junction |
| `posts` | `id` | `spaceId`, `authorId`, `campusId` | Feed content |
| `events` | `id` | `spaceId`, `organizerId`, `campusId` | Calendar events |
| `rsvps` | `id` | `eventId`, `userId`, `campusId` | Event responses |
| `tools` | `id` | `creatorId`, `campusId` | HiveLab tools |
| `deployedTools` | `id` | `toolId`, `spaceId`, `placedBy` | Tool placements |
| `notifications` | `id` | `userId`, `actorId` | User notifications |
| `handles` | `handle` | `userId` | Unique handle registry |
| `schools` | `id` | — | Campus configurations |

### Chat Collections

| Collection | Primary Key | Foreign Keys | Description |
|------------|-------------|--------------|-------------|
| `chatChannels` | `id` | `spaceId` | Space chat boards |
| `chatMessages` | `id` | `channelId`, `spaceId`, `authorId` | Chat messages |
| `channelMemberships` | `id` | `channelId`, `userId` | Channel read state |

### Social Collections

| Collection | Primary Key | Foreign Keys | Description |
|------------|-------------|--------------|-------------|
| `user_follows` | `id` | `followerId`, `followedId` | Follow relationships |
| `user_social_graphs` | `userId` | — | Computed social data |
| `mutual_connections` | `id` | `user1Id`, `user2Id` | Mutual friend cache |
| `user_activities` | `id` | `userId` | Activity stream |
| `connections` | `id` | `userId`, `connectedUserId` | Legacy connections |

### Moderation Collections

| Collection | Primary Key | Foreign Keys | Description |
|------------|-------------|--------------|-------------|
| `contentReports` | `id` | `reporterId`, `contentId` | User reports |
| `moderation_queue` | `id` | `contentId`, `moderatorId` | Pending reviews |
| `deletedContent` | `id` | `contentId`, `deletedBy` | Archived deletions |
| `userWarnings` | `id` | `userId`, `issuedBy` | User warnings |
| `userSuspensions` | `id` | `userId`, `issuedBy` | Temp bans |
| `userBans` | `id` | `userId`, `issuedBy` | Permanent bans |
| `moderationRules` | `id` | — | Auto-mod rules |

### Admin Collections

| Collection | Primary Key | Foreign Keys | Description |
|------------|-------------|--------------|-------------|
| `admins` | `userId` | — | Admin accounts |
| `adminActivityLogs` | `id` | `adminId` | Admin audit trail |
| `pendingAdminGrants` | `email` | `grantedBy` | Pending invites |
| `magic_links` | `id` | — | Passwordless auth |

### Analytics Collections

| Collection | Primary Key | Foreign Keys | Description |
|------------|-------------|--------------|-------------|
| `analytics_metrics` | `id` | `userId`, `spaceId`, `toolId` | Raw events |
| `analytics_aggregates` | `id` | `entityId` | Rolled up stats |
| `user_engagement_metrics` | `id` | `userId` | Per-user engagement |
| `platform_metrics` | `id` | — | Platform-wide stats |
| `content_metrics` | `id` | `contentId` | Content performance |
| `trending` | `type` | — | Trending algorithms |

### Subcollections

| Parent Path | Subcollection | Description |
|-------------|---------------|-------------|
| `spaces/{spaceId}` | `boards` | Chat channels |
| `spaces/{spaceId}` | `members` | Legacy member records |
| `spaces/{spaceId}` | `automations` | Event reminder config |
| `spaces/{spaceId}` | `posts` | Space posts (some legacy) |
| `spaces/{spaceId}` | `announcements` | Announcements |
| `boards/{boardId}` | `messages` | Chat messages |
| `posts/{postId}` | `comments` | Post comments |
| `posts/{postId}` | `likes` | Post likes |
| `users/{userId}` | `follows` | User follows |
| `users/{userId}` | `mutes` | Muted users |
| `schools/{schoolId}` | `waitlist_entries` | School waitlist |
| `feed/{cardId}` | `likes` | Feed likes |
| `inline_component_state/{id}` | `participants` | Poll/RSVP responses |
| `tools/{toolId}/state/{deployId}` | `shards` | Sharded counters |

---

## Relationship Types

### One-to-Many (1:N)

```
users (1) ─────────> profiles (N)              via userId
users (1) ─────────> notifications (N)         via userId
spaces (1) ────────> spaceMembers (N)          via spaceId
spaces (1) ────────> events (N)                via spaceId
spaces (1) ────────> posts (N)                 via spaceId
spaces (1) ────────> chatChannels (N)          via spaceId
chatChannels (1) ──> chatMessages (N)          via channelId
posts (1) ─────────> comments (N)              via postId [subcollection]
events (1) ────────> rsvps (N)                 via eventId
tools (1) ─────────> deployedTools (N)         via toolId
schools (1) ───────> users (N)                 via campusId
```

### Many-to-Many (M:N)

```
users ←───────────> spaces         via spaceMembers (role-based)
users ←───────────> events         via rsvps (status-based)
users ←───────────> users          via user_follows (directional)
users ←───────────> users          via connections (bidirectional)
users ←───────────> rituals        via ritual_participation
spaces ←──────────> tools          via deployedTools
```

---

## Denormalization Map

| Collection | Denormalized Field | Source Collection | Source Field |
|------------|-------------------|-------------------|--------------|
| `spaceMembers` | `userName` | `users` | `displayName` |
| `spaceMembers` | `userHandle` | `users` | `handle` |
| `spaceMembers` | `userPhotoURL` | `users` | `photoURL` |
| `posts` | `authorName` | `profiles` | `displayName` |
| `posts` | `authorHandle` | `users` | `handle` |
| `posts` | `authorAvatar` | `users` | `photoURL` |
| `posts` | `spaceName` | `spaces` | `name` |
| `comments` | `authorName` | `profiles` | `displayName` |
| `chatMessages` | `authorName` | `users` | `displayName` |
| `chatMessages` | `authorAvatarUrl` | `users` | `photoURL` |
| `events` | `spaceName` | `spaces` | `name` |
| `events` | `organizerName` | `profiles` | `displayName` |
| `rsvps` | `userName` | `users` | `displayName` |
| `rsvps` | `userAvatar` | `users` | `photoURL` |
| `notifications` | `actorName` | `profiles` | `displayName` |
| `notifications` | `actorAvatar` | `users` | `photoURL` |
| `deployedTools` | `toolName` | `tools` | `name` |

---

## Status Enums

### User Status
```typescript
type UserStatus = 'active' | 'suspended' | 'banned' | 'deleted' | 'onboarding';
```

### Space Status
```typescript
type SpaceStatus = 'draft' | 'live' | 'archived' | 'suspended';
```

### Space Type
```typescript
type SpaceType =
  | 'student_organizations'
  | 'university_organizations'
  | 'greek_life'
  | 'campus_living'
  | 'hive_exclusive';
```

### Space Visibility
```typescript
type SpaceVisibility = 'public' | 'private' | 'unlisted' | 'members_only';
```

### Event Status
```typescript
type EventStatus = 'draft' | 'published' | 'live' | 'completed' | 'cancelled' | 'archived';
```

### RSVP Status
```typescript
type RSVPStatus = 'going' | 'maybe' | 'not_going' | 'waitlist';
```

### Tool Status
```typescript
type ToolStatus = 'draft' | 'published' | 'archived' | 'suspended';
```

### Connection Type
```typescript
type ConnectionType = 'friend' | 'follower' | 'following' | 'blocked' | 'pending';
```

### Member Role
```typescript
type MemberRole = 'owner' | 'leader' | 'moderator' | 'member';
```

### Notification Type
```typescript
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

### Moderation Status
```typescript
type ModerationStatus = 'pending' | 'reviewing' | 'resolved' | 'dismissed';
```

### Report Priority
```typescript
type ReportPriority = 'low' | 'medium' | 'high' | 'critical';
```

---

## Index Recommendations

### Composite Indexes (Firestore)

```javascript
// Posts feed query
posts: [campusId, isDeleted, isHidden, createdAt DESC]
posts: [spaceId, isDeleted, createdAt DESC]

// Space members lookup
spaceMembers: [spaceId, campusId, role]
spaceMembers: [userId, campusId]

// Upcoming events
events: [campusId, status, startTime ASC]
events: [spaceId, startTime ASC]

// User notifications
notifications: [userId, read, createdAt DESC]

// Tool deployments
deployedTools: [spaceId, isActive, placedAt DESC]
deployedTools: [profileId, isActive, placedAt DESC]

// User connections
connections: [userId, type, status, createdAt DESC]

// Social graph
user_follows: [followerId, createdAt DESC]
user_follows: [followedId, createdAt DESC]

// Moderation
contentReports: [campusId, status, createdAt DESC]
moderation_queue: [status, priority, createdAt ASC]

// Analytics
analytics_metrics: [campusId, eventType, timestamp DESC]
user_activities: [userId, activityType, createdAt DESC]
```

---

## Volume Classification

### High Volume (millions/month)
- `chatMessages` - Real-time chat
- `analytics_metrics` - Raw analytics events
- `presence` - Real-time presence updates
- `user_activities` - Activity stream

### Medium Volume (thousands-hundreds of thousands)
- `posts` - Feed content
- `comments` - Post comments
- `notifications` - User notifications
- `spaceMembers` - Membership records
- `user_follows` - Follow relationships
- `rsvps` - Event responses

### Low Volume (hundreds-thousands)
- `spaces` - Community definitions
- `events` - Calendar events
- `tools` - HiveLab tools
- `users` - User accounts
- `schools` - Campus configurations
- `admins` - Admin accounts
- `contentReports` - User reports

### TTL Collections (auto-expire)
- `magic_links` - 15 min TTL
- `presence` - 5 min TTL
- `realtimeMessages` - 1 hour TTL
- `sentReminders` - 30 day TTL

---

## Security Model

### Campus Isolation
All queries MUST include `campusId` filter for multi-tenancy:
```javascript
db.collection('posts')
  .where('campusId', '==', 'ub-buffalo')
  .where('isDeleted', '==', false)
```

### Role-Based Access
```typescript
// Space membership roles (descending privilege)
owner    → Full admin (transfer, delete space)
leader   → Admin (manage members, settings, tools)
moderator → Moderate content, manage events
member   → Basic access (post, comment, RSVP)
```

### Admin Roles
```typescript
// Platform admin roles
super_admin → Full platform access
admin       → Most admin functions
moderator   → Content moderation only
support     → Read-only + user support
```

### Privacy Tiers
```typescript
// Profile visibility
public  → Visible to all authenticated users
campus  → Visible to same campus only
private → Visible to connections only
```

### Content Visibility
```typescript
// Post/space visibility
public       → Anyone on campus
private      → Members only
members_only → Space members only
unlisted     → Anyone with link
```

---

## Base Document Pattern

All documents inherit these fields:
```typescript
interface BaseDocument {
  id: string;                // Auto-generated document ID
  campusId: string;          // Campus isolation key
  createdAt: Timestamp;      // Creation timestamp
  updatedAt: Timestamp;      // Last update timestamp
  createdBy?: string;        // User UID who created
}
```

---

## Legacy Collections (Dead Code)

The following collections have references in the codebase but are **not actively used**:

| Collection | Location | Notes |
|------------|----------|-------|
| `clubs` | `analytics.ts`, `notifications.ts` | Predates "spaces" unification. Count returns 0. |
| `reports` | `feed/report.ts` | Superseded by `contentReports` in moderation service |

These should be cleaned up in a future refactor.

---

## Related Documentation

- [Database Schema Details](./DATABASE_SCHEMA.md) - TypeScript interfaces
- [Firestore Security Rules](../infrastructure/firebase/firestore.rules)
- [Firestore Indexes](../infrastructure/firebase/firestore.indexes.json)
