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
