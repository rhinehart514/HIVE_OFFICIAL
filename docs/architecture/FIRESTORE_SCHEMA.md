# Firestore Schema - HIVE Platform

This document defines the authoritative Firestore collection structure for HIVE.

## Design Principles

1. **Flat collections for cross-space queries** - Feed, calendar, user memberships
2. **Nested subcollections for space-local data** - Chat, tabs, widgets, tools
3. **CampusId on every document** - Multi-tenant isolation
4. **Consistent naming** - camelCase for collection names

## Collection Structure

### Top-Level Collections (Flat)

These collections use flat structure because they need cross-space queries.

```
/users/{userId}
  - Firebase Auth user data
  - Minimal data, links to profile
  - Fields: email, uid, createdAt

/profiles/{profileId}
  - Extended user profile data
  - Fields: displayName, bio, major, interests, avatarUrl, campusId, etc.

/handles/{handle}
  - Handle → userId lookup
  - Ensures unique handles
  - Fields: userId, createdAt

/admins/{adminId}
  - Platform admin users
  - Fields: userId, role, grantedAt

/schools/{schoolId}
  - Campus/school configurations
  - Public read access
  - Fields: name, domain, config, features

/spaces/{spaceId}
  - Core space document
  - Fields: name, slug, description, category, campusId, createdBy, memberCount, etc.

/spaceMembers/{memberId}
  - User membership in a space (FLAT for cross-space queries)
  - Fields: userId, spaceId, campusId, role, status, joinedAt
  - Queries: by userId (my spaces), by spaceId (space members)

/posts/{postId}
  - Posts across all spaces (for feed aggregation)
  - Fields: authorId, spaceId, campusId, content, type, createdAt, isHidden
  - Queries: by campusId + createdAt (feed), by spaceId (space posts)

/events/{eventId}
  - Events across all spaces (for calendar)
  - Fields: spaceId, campusId, title, startTime, endTime, createdBy, etc.
  - Queries: by campusId + startTime (calendar), by spaceId (space events)

/rsvps/{rsvpId}
  - Event RSVPs
  - Fields: eventId, userId, spaceId, campusId, status
  - Queries: by eventId, by userId

/connections/{connectionId}
  - User-to-user connections
  - Fields: fromUserId, toUserId, status, campusId, createdAt

/notifications/{notificationId}
  - User notifications
  - Fields: userId, type, content, read, createdAt

/tools/{toolId}
  - HiveLab tool definitions (shareable)
  - Fields: name, elements, config, createdBy, campusId, category, useCount

/deployedTools/{deploymentId}
  - Global deployment registry
  - Fields: toolId, targetType, targetId, deployedBy, campusId, settings

/toolStates/{stateId}
  - Runtime state for deployed tools
  - Fields: deploymentId, state, campusId, updatedAt

/builderRequests/{requestId}
  - Space builder permission requests
  - Fields: userId, status, reason, reviewedBy, createdAt

/contentReports/{reportId}
  - User-submitted content reports
  - Fields: reporterId, contentType, contentId, reason, status, campusId

/activityEvents/{eventId}
  - Platform-wide activity log (append-only)
  - Fields: type, userId, metadata, campusId, timestamp

/presence/{userId}
  - User online/offline presence
  - Fields: status, lastSeen, device

/realtimeMessages/{messageId}
  - SSE real-time message queue
  - Fields: type, channel, senderId, content, targetUsers, metadata

/chatChannels/{channelId}
  - DM/group chat channels (legacy)
  - Fields: type, participants, createdAt

/typingIndicators/{indicatorId}
  - Ephemeral typing indicators (auto-expires)
  - Fields: userId, channelId, spaceId, expiresAt

/featureFlags/{flagId}
  - Feature flag configurations
  - Fields: enabled, rolloutPercentage, conditions

/featureFlagAnalytics/{analyticsId}
  - Feature flag usage analytics
  - Admin-only access
```

### Nested Subcollections (Under Spaces)

These are scoped to a single space and don't need cross-space queries.

```
/spaces/{spaceId}/boards/{boardId}
  - Chat boards/channels within a space
  - Fields: name, type, order, isDefault, canPost, linkedEventId

/spaces/{spaceId}/boards/{boardId}/messages/{messageId}
  - Chat messages within a board
  - Fields: authorId, content, type, timestamp, componentData, isPinned

/spaces/{spaceId}/boards/{boardId}/typing/{userId}
  - Active typing indicators (TTL: 5 seconds)
  - Fields: name, avatarUrl, timestamp

/spaces/{spaceId}/tabs/{tabId}
  - Custom tabs for space navigation
  - Fields: label, icon, order, isDefault

/spaces/{spaceId}/widgets/{widgetId}
  - Sidebar widgets
  - Fields: type, config, order, tabId

/spaces/{spaceId}/placed_tools/{placementId}
  - HiveLab tools deployed to this space
  - Fields: toolId, surface, position, settings, isActive

/spaces/{spaceId}/placed_tools/{placementId}/state/{userId}
  - Per-user state for a placed tool
  - Fields: state, updatedAt

/spaces/{spaceId}/placed_tools/{placementId}/responses/{userId}
  - User submissions/responses to a tool
  - Fields: payload, submittedAt

/spaces/{spaceId}/activity/{activityId}
  - Space-specific activity log (append-only)
  - Fields: type, userId, metadata, timestamp

/spaces/{spaceId}/members/{memberId}
  - DEPRECATED: Use flat /spaceMembers collection
  - Kept for backwards compatibility

/spaces/{spaceId}/posts/{postId}
  - DEPRECATED: Use flat /posts collection
  - Some legacy code still writes here
```

### Nested Subcollections (Under Tools)

```
/tools/{toolId}/versions/{versionId}
  - Version history for tools
  - Fields: elements, publishedAt, changelog
```

### Nested Subcollections (Under Posts)

```
/posts/{postId}/comments/{commentId}
  - Comments on posts
  - Fields: authorId, content, createdAt, campusId
```

### Rituals Collections (Flat - Platform-managed)

```
/rituals/{ritualId}
  - Ritual configurations
  - Admin-only write
  - Fields: type, name, config, phases, campusId, status

/ritual_participation/{partId}
  - User participation in rituals
  - Fields: ritualId, userId, campusId, progress, joinedAt

/ritual_participants/{participantId}
  - Leaderboard/score data
  - Admin-only write
  - Fields: ritualId, userId, campusId, score, rank

/ritual_events/{eventId}
  - Ritual phase transitions/milestones
  - Admin-only create
  - Fields: ritualId, type, metadata, campusId, timestamp

/ritual_templates/{templateId}
  - Reusable ritual templates
  - Admin-only write
  - Fields: name, type, config, isPublic

/ritual_votes/{voteId}
  - Tournament archetype votes (immutable)
  - Fields: ritualId, matchupId, userId, campusId, vote

/ritual_matchups/{matchupId}
  - Tournament brackets
  - Admin-only write
  - Fields: ritualId, round, participants, campusId

/ritual_usage/{usageId}
  - Feature Drop archetype tracking
  - Fields: ritualId, userId, campusId, action, count

/ritual_feedback/{feedbackId}
  - Post-ritual surveys (immutable)
  - Fields: ritualId, userId, campusId, ratings, comments

/anonymous_content_accountability/{accountabilityId}
  - Leak archetype accountability records
  - Admin-only read
  - Fields: contentId, hashedUserId, campusId, timestamp
```

## Required Indexes

### Composite Indexes

```json
[
  {
    "collectionGroup": "posts",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "campusId", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "posts",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "spaceId", "order": "ASCENDING" },
      { "fieldPath": "campusId", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "events",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "campusId", "order": "ASCENDING" },
      { "fieldPath": "startTime", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "events",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "spaceId", "order": "ASCENDING" },
      { "fieldPath": "campusId", "order": "ASCENDING" },
      { "fieldPath": "startTime", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "spaceMembers",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "userId", "order": "ASCENDING" },
      { "fieldPath": "campusId", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "spaceMembers",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "spaceId", "order": "ASCENDING" },
      { "fieldPath": "campusId", "order": "ASCENDING" },
      { "fieldPath": "status", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "spaces",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "campusId", "order": "ASCENDING" },
      { "fieldPath": "category", "order": "ASCENDING" },
      { "fieldPath": "memberCount", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "connections",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "fromUserId", "order": "ASCENDING" },
      { "fieldPath": "campusId", "order": "ASCENDING" },
      { "fieldPath": "status", "order": "ASCENDING" }
    ]
  }
]
```

## Centralized Collection Paths

All collection paths are defined in `@hive/core`:

```typescript
import {
  COLLECTIONS,
  getSpacesCollection,
  getPostsCollection,
  getEventsCollection,
  getMembersCollection,
  getBoardsCollection,
  getMessagesCollection,
  // ... more
} from '@hive/core/server';
```

See: `packages/core/src/infrastructure/firestore-collections.ts`

## Security Rules Reference

Complete rules in: `infrastructure/firebase/firestore.rules`

Key patterns:
- `sameCampus()` - Reads documents matching user's campusId
- `sameCampusWrite()` - Writes documents with user's campusId
- `isOwner(userId)` - Checks document ownership
- `isAdmin()` - Checks platform admin status

## Migration Notes

### Resolved Inconsistencies

1. ~~`space_members` vs `spaceMembers`~~ → **Use `spaceMembers`**
   - All Firebase Functions updated
   - All API routes updated

2. ~~Nested `/spaces/{id}/members` vs flat `/spaceMembers`~~ → **Use flat**
   - Flat required for "my spaces" query
   - Nested kept for backwards compatibility but deprecated

3. ~~Posts dual-write~~ → **Use flat `/posts`**
   - Flat required for feed aggregation
   - Nested `/spaces/{id}/posts` deprecated

4. ~~Events dual-write~~ → **Use flat `/events`**
   - Flat required for calendar
   - Nested `/spaces/{id}/events` deprecated

### Why Flat Collections?

| Collection | Reason for Flat |
|------------|-----------------|
| `posts` | Feed aggregation across all spaces |
| `events` | Calendar queries across all spaces |
| `spaceMembers` | "My spaces" query for a user |
| `rsvps` | "My events" query for a user |
| `connections` | Social graph queries |
| `notifications` | User's notification feed |

### When to Use Nested

| Subcollection | Why Nested |
|---------------|------------|
| `boards` | Only accessed within space context |
| `messages` | Only accessed within board context |
| `tabs` | Space-specific configuration |
| `widgets` | Space-specific configuration |
| `placed_tools` | Space-specific tool placements |
| `tool/versions` | Tool-specific history |

### Best Practices

1. **Always include `campusId`** on document writes
2. **Always filter by `campusId`** on reads
3. **Check `isHidden` and `status`** for moderated content
4. **Use centralized path helpers** from `firestore-collections.ts`
5. **Prefer flat collections** when cross-parent queries are needed
6. **Use nested subcollections** for parent-scoped data only

---

## CampusId Immutability

### Critical Invariant

**`campusId` is IMMUTABLE after creation.** Once a document is created with a campusId, that field must never be changed.

### Why This Matters

1. **Security Boundary** - CampusId is the primary multi-tenant isolation mechanism
2. **Query Integrity** - All queries filter by campusId; changing it would orphan data from expected result sets
3. **Audit Trail** - Campus affiliation is part of the data lineage
4. **Cross-Reference Integrity** - Related documents (memberships, posts, events) all share the same campusId

### Protected Collections

All documents with `campusId` field must treat it as immutable:

| Collection | Immutable Fields |
|------------|------------------|
| `spaces` | `campusId`, `id`, `createdBy` |
| `spaceMembers` | `campusId`, `userId`, `spaceId` |
| `posts` | `campusId`, `authorId` |
| `events` | `campusId`, `organizerId` |
| `profiles` | `campusId` (set on email verification) |
| `tools` | `campusId`, `creatorId` |
| `deployedTools` | `campusId` |
| All ritual collections | `campusId` |

### Enforcement Layers

1. **Firestore Security Rules** (`firestore.rules`)
   - `sameCampusWrite()` helper validates write campusId matches auth token
   - Update operations cannot change `campusId` field

2. **API Middleware** (`lib/middleware/auth.ts`)
   - `getCampusId(request)` extracts from validated JWT
   - Never reads campusId from request body for existing documents

3. **Domain Model** (`@hive/core`)
   - Value objects like `CampusId` are immutable by design
   - Entity constructors set campusId once, no setter exposed

### What Happens If CampusId Changes?

If campusId were ever changed on a document:

1. **Security Breach** - User from Campus A could see data from Campus B
2. **Data Orphaning** - Cross-campus queries would return incomplete results
3. **Feed Corruption** - Posts would appear/disappear unexpectedly
4. **Membership Chaos** - Space member lists would be inconsistent

### Migration Scenarios

If a user legitimately needs to change campuses (rare):

1. **Create new profile** - Don't update existing
2. **Copy user-controlled data** - Content stays with original campus
3. **Maintain audit record** - Link old/new profiles for support

### Code Examples

```typescript
// CORRECT: CampusId from auth token, never from request body
const campusId = getCampusId(request as AuthenticatedRequest);
const newSpace = { ...body, campusId }; // campusId from token

// WRONG: Never trust campusId from client for existing documents
const { campusId, ...updateData } = body;
await db.collection('spaces').doc(spaceId).update(body); // campusId could be changed!

// CORRECT: Strip campusId from updates
const { campusId: _ignored, ...safeUpdate } = body;
await db.collection('spaces').doc(spaceId).update(safeUpdate);
```

### Validation in Firestore Rules

```javascript
// In firestore.rules
function campusIdUnchanged() {
  return !request.resource.data.diff(resource.data).affectedKeys().hasAny(['campusId']);
}

match /spaces/{spaceId} {
  allow update: if isAuthenticated()
                && sameCampus()
                && campusIdUnchanged()
                && isSpaceLeader(spaceId);
}
```

### Related Documentation

- `infrastructure/firebase/firestore.rules` - Security rule implementation
- `apps/web/src/lib/middleware/auth.ts` - API middleware
- `packages/core/src/domain/shared/value-objects/campus-id.value.ts` - Domain model
