# Firestore Collections — HIVE ERD

## Core Collections

```
campuses/{campusId}
  └─ id, name, domain (e.g. buffalo.edu)

users/{userId}
  └─ uid, email, campusId, displayName, createdAt

profiles/{userId}
  └─ interests[], yearOfStudy, housing, builderLevel, xp, avatarUrl

spaces/{spaceId}
  └─ name, handle, campusId, category, visibility, isLeader(userId),
     memberCount, description, iconURL, bannerImage

spaceMembers/{spaceId_userId}   ← composite key
  └─ spaceId, userId, role (member|leader|admin|moderator), joinedAt

events/{eventId}
  └─ spaceId, campusId, title, startDate|startAt|startTime (use all 3 in queries),
     location, rsvpCount, createdAt

rsvps/{rsvpId}                  ← canonical
  └─ eventId, userId, status (going|maybe|not_going), createdAt
eventRsvps/{id}                 ← legacy, check both in queries

tools/{toolId}
  └─ campusId, createdBy, name, description, status (draft|published|archived),
     composition (elements[], connections[]), remixedFrom, remixCount

placedTools/{placementId}       ← canonical deployment record
  └─ spaceId, toolId, placement, order, isActive, visibility, titleOverride, placedAt
deployedTools/{id}              ← legacy overlap, prefer placedTools

tool_states/{toolId}_{deploymentId}_shared    ← shared state doc ID format
  └─ counters{}, collections{}, timeline[], version, lastModified, metadata{}
  └─ deploymentId = spaceId (SSE stream) or "standalone" (standalone tools)
tool_states/{toolId}_{deploymentId}_{userId}  ← personal state doc ID format
  └─ selections{}, participation{}, userId, scope, metadata{}

posts/{postId}
  └─ spaceId, authorId, content, createdAt, likes, comments

boards/{boardId}
  └─ spaceId, title, linkedEventId (optional)

messages / spaceMessages        ← both exist, prefer spaceMessages for new queries
  └─ spaceId, authorId, content, createdAt, reactions{}

notifications/{notifId}
  └─ userId, type, category, title, body, read, createdAt

analytics_events/{id}           ← feeds global feed, NOT Firestore analytics
  └─ eventType (tool_created|tool_deployed|event_created|...), userId, spaceId,
     campusId, timestamp, metadata{}

fcmTokens/{userId}
  └─ token, platform, updatedAt

connections/{connectionId}
  └─ userId, connectedUserId, status, createdAt

friends/{id}
  └─ userId, friendId, status

featureFlags/{flagId}
  └─ key, enabled, description

campusData/{campusId}/dining/{id}   ← subcollection
  └─ hall, menu, hours
```

## Additional Collections

These exist in the codebase but are secondary — encountered in admin, moderation, and analytics routes:

```
# Access control
access_codes, access_code_lockouts, access_whitelist, verification_codes,
verification_lockouts, emailVerifications, pendingAdminGrants

# Admin & moderation
admins, adminActivityLogs, adminAlertRules, adminAnnouncements,
contentReports, reports, appeals, violations, moderationLog,
moderationQueues, moderation_feedback, flaggedContent, deletedContent

# Space management
spaceAuditLog, spaceBans, spaceInvites, spaceJoinRequests,
spaceMemberships, spacePresence, spaceRequests, spaceWaitlists

# User data
handles, userBans, userFcmTokens, userPresence, userSessions,
userSuspensions, userWarnings, user_achievements, user_follows,
user_engagement_metrics, privacySettings, notificationPreferences

# HiveLab
toolInstallations, toolPlacements, toolPublishRequests,
tool_analytics, tool_states_archived, tool_templates,
inline_components, inline_component_state, automations, setupDeployments

# Social
follows, likes, reactions, mutes, saved_events, say_hello

# Analytics
analytics_aggregates, analytics_metrics, ai_generations, ai_edits,
platform_metrics, budget_usage

# Other
schools, schoolAdminInvitations, waitlist, waitlist_entries,
builderRequests, claims, tabs, presence, typing, readMarkers
```

## Key Relationships

```
Campus → Spaces (1:many, via spaces.campusId)
Space → SpaceMembers (1:many, composite key spaceId_userId)
Space → Events (1:many, via events.spaceId)
Space → PlacedTools (1:many, via placedTools.spaceId)
Tool → PlacedTools (1:many, a tool can be deployed to multiple spaces)
Tool → tool_states (1:many, keyed by {toolId}_{deploymentId}_shared)
Event → RSVPs (1:many, via rsvps.eventId)
User → Profiles (1:1, same userId)
User → Connections (many:many, via connections collection)
```

---

## Critical Data Gotchas
_Discovered Feb 22 2026 — read before writing any Firestore query_

### events collection — field reality vs. assumptions

**`startDate` is an ISO string, NOT a Firestore Timestamp.**
CampusLabs-imported events store `startDate` as `"2026-02-24T14:00:00.000Z"` (string).
Older/demo events may use `startAt` (Timestamp). Always handle both.

```ts
// ✅ CORRECT — string comparison for startDate
.where('startDate', '>=', now.toISOString())

// ❌ WRONG — Date object compared to string field returns 0 results
.where('startDate', '>=', new Date())
```

**Cover image is `imageUrl`, not `coverImageUrl`.**
The Firestore field is `event.imageUrl`. The personalized API historically mapped it
to `coverImageUrl` in responses — the field mismatch silently dropped all images.
When reading raw event docs, use `event.imageUrl || event.coverImageUrl`.

**`spaceHandle` does NOT exist on event documents.**
Events only store `spaceId` (which IS the Firestore doc ID of the space).
To get a space's handle for linking, batch-fetch from the `spaces` collection:
`db.collection('spaces').doc(event.spaceId).get()` → `data.handle || data.slug`

**`upcomingEventCount` on space docs is stale.**
It's a denormalized counter that isn't being updated. Don't trust it.
Always do a live query: `where('spaceId', '==', id).where('startDate', '>=', now.toISOString())`

### spaces collection — two ID formats

**`org-*` spaces** (e.g. `org-swim-club`): have `handle` and `slug` fields. Full data.

**`campuslabs-*` spaces** (e.g. `campuslabs-103556`): imported directly from CampusLabs.
`handle` and `slug` are `undefined`. The `resolve-slug` API handles these via legacy ID
fallback — `/s/campuslabs-103556` works but is an ugly URL.

**0 members on almost all spaces.** `memberCount` is 0 for ~1173/1174 spaces.
This is correct — no real users yet. Don't filter by memberCount > 0 for discovery.

**Category schema inconsistency.** Old import used `student_org`; new schema uses
`student_organizations`. Both exist in production. Handle both in category filters.

### campusId — INDEX IS EXEMPTED

**`campusId` single-field index has been explicitly exempted in Firestore.**
This means `where('campusId', '==', 'ub-buffalo')` WILL throw `FAILED_PRECONDITION`.

```ts
// ❌ NEVER — will throw FAILED_PRECONDITION
db.collection('events').where('campusId', '==', campusId).limit(n)

// ❌ NEVER — compound query with campusId also fails
db.collection('events').where('campusId', '==', campusId).where('spaceId', '==', id)

// ✅ CORRECT fallback — filter by date string instead
db.collection('events').where('startDate', '>=', now.toISOString()).orderBy('startDate').limit(n)

// ✅ CORRECT for space-scoped events
db.collection('events').where('spaceId', '==', spaceId).where('startDate', '>=', now.toISOString()).orderBy('startDate').limit(n)
```

### Live data counts (as of Feb 22 2026)

| Collection | Count | Notes |
|---|---|---|
| events | ~2,772 | All real CampusLabs imports. 100 demo-seed docs deleted. |
| spaces | 1,174 | 199 live, 0 claimed, ~975 org-* with handles, ~199 campuslabs-* without |
| users | 4 | Jacob + test accounts only |
| tools | 19 | All created by Jacob |
| posts | 0 | No user-generated content yet |
| campuses | 0 | Campus documents not created — `useCampusMode()` returns false everywhere |
