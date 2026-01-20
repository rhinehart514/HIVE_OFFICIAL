# HIVE Entity Relationship Diagram (ERD)

> Complete database schema documentation for HIVE platform
> Last updated: January 2026

## Overview

- **Database**: Firebase Firestore (NoSQL document store)
- **Collections**: 150+ (21 core + auxiliary)
- **Multi-tenancy**: Campus isolation via `campusId`
- **Document limit**: 1MB per document

---

## ERD Diagrams

### 1. Core Domain (Users, Spaces, Posts)

```mermaid
erDiagram
    USERS ||--o{ PROFILES : has
    USERS ||--o{ SPACE_MEMBERS : joins
    USERS ||--o{ POSTS : creates
    USERS ||--o{ CONNECTIONS : has

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
        string campusId FK
        timestamp createdAt
        timestamp lastActiveAt
    }

    PROFILES {
        string id PK
        string userId FK
        string userType
        string major
        string academicYear
        array interests
        object privacy
        string bio
        string campusId FK
    }

    SPACES {
        string id PK
        string name
        string handle UK
        string slug UK
        string type
        string visibility
        string status
        number memberCount
        number postCount
        string campusId FK
        timestamp createdAt
    }

    SPACE_MEMBERS {
        string id PK
        string spaceId FK
        string userId FK
        string role
        string userName
        string userHandle
        string userPhotoURL
        timestamp joinedAt
        string campusId FK
    }

    POSTS {
        string id PK
        string content
        string type
        string visibility
        string spaceId FK
        string authorId FK
        string authorName
        string authorHandle
        object engagement
        boolean isDeleted
        string campusId FK
        timestamp createdAt
    }

    COMMENTS {
        string id PK
        string postId FK
        string content
        string authorId FK
        string authorName
        string parentCommentId
        number likeCount
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
```

### 2. Events & RSVPs

```mermaid
erDiagram
    SPACES ||--o{ EVENTS : hosts
    EVENTS ||--o{ RSVPS : has
    USERS ||--o{ RSVPS : makes
    USERS ||--o{ PERSONAL_EVENTS : owns

    EVENTS {
        string id PK
        string title
        string description
        string spaceId FK
        string organizerId FK
        string organizerName
        string spaceName
        string location
        string virtualLink
        string type
        timestamp startTime
        timestamp endTime
        number rsvpCount
        number maxAttendees
        string status
        string campusId FK
        timestamp createdAt
    }

    RSVPS {
        string id PK
        string eventId FK
        string userId FK
        string userName
        string userAvatar
        string status
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
        string type
        string description
        number messageCount
        boolean isDefault
        boolean isLocked
        number position
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
        array reactions
        string replyToId
        boolean isPinned
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
        string oderId FK
        object response
        timestamp participatedAt
    }

    REACTIONS {
        string emoji
        array userIds
        number count
    }
```

### 4. Tools & HiveLab

```mermaid
erDiagram
    USERS ||--o{ TOOLS : creates
    TOOLS ||--o{ PLACED_TOOLS : deploys
    TOOLS ||--o{ TOOL_STATES : has
    TOOLS ||--o{ TOOL_REVIEWS : receives
    SPACES ||--o{ PLACED_TOOLS : contains

    TOOLS {
        string id PK
        string name
        string description
        string prompt
        string ownerId FK
        string status
        string visibility
        array variants
        object config
        number useCount
        number deployCount
        string campusId FK
        timestamp createdAt
        timestamp updatedAt
    }

    PLACED_TOOLS {
        string id PK
        string toolId FK
        string spaceId FK
        string targetType
        string targetId
        object position
        number order
        boolean isActive
        boolean isFeatured
        timestamp placedAt
        string placedBy FK
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

    TOOL_DEPLOYMENTS {
        string id PK
        string toolId FK
        string spaceId FK
        string deployedBy FK
        string status
        timestamp deployedAt
    }
```

### 5. Notifications & Activity

```mermaid
erDiagram
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ NOTIFICATION_PREFS : configures
    USERS ||--o{ PRESENCE : tracks

    NOTIFICATIONS {
        string id PK
        string userId FK
        string type
        string title
        string body
        string referenceType
        string referenceId
        string actorId
        string actorName
        string actorAvatar
        boolean read
        timestamp readAt
        timestamp createdAt
    }

    NOTIFICATION_PREFS {
        string id PK
        string oderId FK
        boolean emailEnabled
        boolean pushEnabled
        object channelSettings
    }

    PRESENCE {
        string id PK
        string oderId FK
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

    RITUALS {
        string id PK
        string slug UK
        string name
        string description
        string type
        string status
        string participationType
        array universities
        array milestones
        array rewards
        timestamp startDate
        timestamp endDate
        string campusId FK
    }

    RITUAL_PARTICIPATION {
        string id PK
        string ritualId FK
        string userId FK
        string status
        number progressPercentage
        number timeSpent
        array completedMilestones
        object rewards
        timestamp joinedAt
        timestamp completedAt
    }

    RITUAL_ACTIONS {
        string id PK
        string ritualId FK
        string oderId FK
        string actionType
        object metadata
        timestamp createdAt
    }
```

---

## Collection Reference

### Core Collections

| Collection | Primary Key | Foreign Keys | Description |
|------------|-------------|--------------|-------------|
| `users` | `uid` | `campusId` | User accounts |
| `profiles` | `id` | `userId`, `campusId` | Extended profiles |
| `spaces` | `id` | `campusId` | Communities |
| `spaceMembers` | `id` | `spaceId`, `userId`, `campusId` | Membership junction |
| `posts` | `id` | `spaceId`, `authorId`, `campusId` | Feed content |
| `events` | `id` | `spaceId`, `organizerId`, `campusId` | Calendar events |
| `rsvps` | `id` | `eventId`, `userId`, `campusId` | Event responses |
| `tools` | `id` | `ownerId`, `campusId` | HiveLab tools |

### Subcollections

| Parent | Subcollection | Description |
|--------|---------------|-------------|
| `spaces/{spaceId}` | `boards` | Chat channels |
| `boards/{boardId}` | `messages` | Chat messages |
| `posts/{postId}` | `comments` | Post comments |
| `inline_component_state/{componentId}` | `participants` | Poll/RSVP participants |

---

## Relationship Types

### One-to-Many (1:N)

```
users (1) ─────────> profiles (N)              via userId
spaces (1) ────────> spaceMembers (N)          via spaceId
spaces (1) ────────> events (N)                via spaceId
spaces (1) ────────> posts (N)                 via spaceId
spaces (1) ────────> boards (N)                via spaceId [subcollection]
posts (1) ─────────> comments (N)              via postId [subcollection]
events (1) ────────> rsvps (N)                 via eventId
tools (1) ─────────> placed_tools (N)          via toolId
boards (1) ────────> messages (N)              via boardId [subcollection]
```

### Many-to-Many (M:N)

```
users ←───────────> spaces         via spaceMembers (role-based)
users ←───────────> events         via rsvps (status-based)
users ←───────────> users          via connections (type-based)
users ←───────────> rituals        via ritual_participation
spaces ←──────────> tools          via placed_tools
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
| `comments` | `authorName` | `profiles` | `displayName` |
| `messages` | `authorName` | `users` | `displayName` |
| `messages` | `authorAvatarUrl` | `users` | `photoURL` |
| `events` | `spaceName` | `spaces` | `name` |
| `events` | `organizerName` | `profiles` | `displayName` |
| `rsvps` | `userName` | `users` | `displayName` |
| `notifications` | `actorName` | `profiles` | `displayName` |

---

## Status Enums

### User Status
```typescript
type UserStatus = 'active' | 'suspended' | 'deleted' | 'onboarding';
```

### Space Status
```typescript
type SpaceStatus = 'draft' | 'live' | 'archived' | 'suspended';
```

### Space Visibility
```typescript
type SpaceVisibility = 'public' | 'private' | 'unlisted' | 'members_only';
```

### Event Status
```typescript
type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';
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

---

## Index Recommendations

### Composite Indexes (Firestore)

```javascript
// Posts feed query
posts: [campusId, isDeleted, isHidden, createdAt DESC]

// Space members lookup
spaceMembers: [spaceId, campusId, role]

// Upcoming events
events: [campusId, status, startTime ASC]

// User notifications
notifications: [userId, read, createdAt DESC]

// Tool deployments
placed_tools: [spaceId, isActive, placedAt DESC]

// User connections
connections: [userId, type, status, createdAt DESC]
```

---

## Volume Classification

### High Volume (millions/month)
- `messages` - Chat messages
- `analytics_metrics` - Raw analytics events
- `presence` - Real-time presence updates
- `typing` - Typing indicators (TTL)

### Medium Volume (thousands-hundreds of thousands)
- `posts` - Feed content
- `comments` - Post comments
- `notifications` - User notifications
- `spaceMembers` - Membership records
- `connections` - User relationships

### Low Volume (hundreds-thousands)
- `spaces` - Community definitions
- `events` - Calendar events
- `tools` - HiveLab tools
- `users` - User accounts
- `schools` - Campus configurations

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
// Space membership roles
owner    → Full admin (transfer, delete space)
leader   → Admin (manage members, settings)
moderator → Moderate content, manage events
member   → Basic access (post, comment, RSVP)
```

### Privacy Tiers
```typescript
// Profile visibility
public  → Visible to all authenticated users
campus  → Visible to same campus only
private → Visible to connections only
```

---

## Related Documentation

- [Database Schema Details](./DATABASE_SCHEMA.md)
- [API Routes](./API_ROUTES.md)
- [Firestore Security Rules](../apps/web/firestore.rules)
