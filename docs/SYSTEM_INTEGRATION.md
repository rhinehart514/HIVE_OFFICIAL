# System Integration Architecture

**Last Updated:** December 2025
**Purpose:** How Profiles, Spaces, and HiveLab Work Together

---

## Executive Summary

HIVE's power comes from the integration of three systems: **Profiles** (who you are), **Spaces** (where you belong), and **HiveLab** (what you create). This document maps every integration point, data flow, and butterfly effect at the system boundaries.

---

## Table of Contents

1. [The Big Picture](#the-big-picture)
2. [Integration Triangle](#integration-triangle)
3. [Profile ↔ Spaces Integration](#profile--spaces-integration)
4. [Spaces ↔ HiveLab Integration](#spaces--hivelab-integration)
5. [Profile ↔ HiveLab Integration](#profile--hivelab-integration)
6. [Data Flow Diagrams](#data-flow-diagrams)
7. [Shared Entities](#shared-entities)
8. [Campus Isolation Layer](#campus-isolation-layer)
9. [Real-time Integration](#real-time-integration)
10. [Event-Driven Architecture](#event-driven-architecture)
11. [Integration Edge Cases](#integration-edge-cases)
12. [Scale Implications](#scale-implications)
13. [API Integration Map](#api-integration-map)

---

## The Big Picture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│                              HIVE PLATFORM                                    │
│                                                                               │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│   │                 │     │                 │     │                 │       │
│   │    PROFILES     │◀───▶│     SPACES      │◀───▶│    HIVELAB      │       │
│   │                 │     │                 │     │                 │       │
│   │  Who you are    │     │  Where you      │     │  What you       │       │
│   │  Interests      │     │  belong         │     │  create         │       │
│   │  Connections    │     │  Communities    │     │  Tools          │       │
│   │                 │     │                 │     │                 │       │
│   └────────┬────────┘     └────────┬────────┘     └────────┬────────┘       │
│            │                       │                       │                 │
│            │         ┌─────────────┴─────────────┐         │                 │
│            │         │                           │         │                 │
│            └─────────▶  Campus Isolation Layer   ◀─────────┘                 │
│                      │     (campusId: ub-buffalo) │                          │
│                      └─────────────┬─────────────┘                           │
│                                    │                                         │
│                      ┌─────────────▼─────────────┐                           │
│                      │                           │                           │
│                      │        FIRESTORE          │                           │
│                      │                           │                           │
│                      └───────────────────────────┘                           │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Triangle

Each pair of systems has specific integration responsibilities:

```
                        PROFILES
                           │
                           │ Membership, Activity
                           │ Recommendations
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           │               ▼               │
    Tool Ownership    ┌─────────┐    Tool Deployment
    Analytics         │         │    State per Space
                      │  DATA   │
           │          │  FLOWS  │          │
           │          │         │          │
           ▼          └─────────┘          ▼
       HIVELAB ◀─────────────────────▶ SPACES
                    PlacedTool Entity
                    Sidebar Tools
                    Inline Components
```

### Integration Responsibilities

| Integration | Responsible Entity | Key Operations |
|-------------|-------------------|----------------|
| Profile ↔ Spaces | `SpaceMember` | Join, Leave, Role changes, Activity |
| Spaces ↔ HiveLab | `PlacedTool` | Deploy, State sync, Render |
| Profile ↔ HiveLab | `Tool.createdBy` | Ownership, Portfolio, Analytics |

---

## Profile ↔ Spaces Integration

### Membership Flow

```
USER ACTION              PROFILE                    SPACE
───────────────────────────────────────────────────────────────

User joins           ──▶ profile.spaces[]     ──▶ space.members[]
space                    += spaceId               += member record

User leaves          ──▶ profile.spaces[]     ──▶ space.members[]
space                    -= spaceId               -= member record

Role changes         ──▶ (no change)          ──▶ member.role
                                                   updated

Activity             ──▶ profile.activityScore ◀── message/reaction
happens                  updated                   recorded
```

### Data Entities

**SpaceMember (stored in space.members subcollection)**
```typescript
interface SpaceMember {
  id: string;
  spaceId: string;
  userId: string;               // References Profile
  role: Role;
  joinedAt: Date;
  lastActiveAt: Date;
  messageCount: number;
  // Cached profile data
  displayName: string;
  handle: string;
  photoUrl?: string;
}
```

**Profile.spaces array**
```typescript
interface EnhancedProfile {
  // ...
  spaces: string[];             // Array of spaceIds
  // ...
}
```

### Sync Operations

| Operation | Profile Update | Space Update | Trigger |
|-----------|---------------|--------------|---------|
| Join Space | `spaces.push(spaceId)` | Create `SpaceMember` | User action |
| Leave Space | `spaces.filter(id)` | Delete `SpaceMember` | User action |
| Role Change | None | Update `member.role` | Leader action |
| Name Change | Update `personalInfo` | Update cached `displayName` | Profile edit |
| Photo Change | Update `photoUrl` | Update cached `photoUrl` | Profile edit |

### Cache Invalidation

Profile changes must propagate to cached member data:

```
Profile.displayName changes
         │
         ▼
For each spaceId in profile.spaces:
    Update space.members[profileId].displayName
```

**Strategy:** Event-driven updates via Cloud Functions (not implemented yet)

### Activity Aggregation

```
Space Activity                    Profile Metrics
───────────────────────────────────────────────────

message sent         ──▶         profile.activityScore += 1
reaction added       ──▶         profile.activityScore += 0.2
event RSVP           ──▶         profile.activityScore += 2
tool interaction     ──▶         profile.activityScore += 0.5
```

### Recommendations

Profile interests feed into space recommendations:

```
profile.interests = ['AI', 'Startups', 'Photography']
         │
         ▼
Space Discovery Algorithm:
  1. Find spaces with matching tags
  2. Weight by friend membership
  3. Weight by activity level
  4. Return ranked list
```

---

## Spaces ↔ HiveLab Integration

### PlacedTool: The Bridge Entity

`PlacedTool` is the core integration entity between HiveLab and Spaces.

```
┌─────────────────────────────────────────────────────────────┐
│                        HIVELAB                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                        TOOL                              ││
│  │  id: 'tool_abc123'                                       ││
│  │  name: 'Weekly Poll'                                     ││
│  │  composition: { elements: [...] }                        ││
│  │  createdBy: 'user_xyz'                                   ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ DEPLOY
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      PLACED_TOOL                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  id: 'placement_123'                                     ││
│  │  toolId: 'tool_abc123'    ◀── Reference to tool         ││
│  │  spaceId: 'space_xyz'     ◀── Reference to space        ││
│  │  placement: 'sidebar'                                    ││
│  │  configOverrides: {}                                     ││
│  │  state: { votes: {...} }  ◀── Per-placement state       ││
│  └─────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ RENDER
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        SPACE                                 │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Sidebar                                                 ││
│  │  ┌─────────────────────────────────────────┐            ││
│  │  │ 📊 Weekly Poll                          │            ││
│  │  │ Option A: ████░░ 4 votes                │            ││
│  │  │ Option B: ██░░░░ 2 votes                │            ││
│  │  │ [Vote]                                  │            ││
│  │  └─────────────────────────────────────────┘            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### Deployment Flow

```
1. Leader opens tool deployment modal
         │
         ▼
2. Selects target space, placement, visibility
         │
         ▼
3. POST /api/tools/{toolId}/deploy
   Body: { spaceId, placement, visibility, configOverrides }
         │
         ▼
4. SpaceDeploymentService.placeTool()
   - Creates PlacedTool entity
   - Adds to Space.placedTools[]
         │
         ▼
5. Tool appears in space sidebar/inline/tab
```

### State Management

Each PlacedTool has independent state:

```
Tool: 'Weekly Poll'
├── Placement in Space A
│   └── state: { votes: { 'option1': ['user1', 'user2'] } }
│
├── Placement in Space B
│   └── state: { votes: { 'option2': ['user3'] } }
│
└── Placement in Space C
    └── state: { votes: {} }
```

### Rendering Pipeline

```typescript
// Space loads with tools
const space = await getSpace(spaceId, { loadPlacedTools: true });

// Filter by placement
const sidebarTools = space.placedTools.filter(t => t.placement === 'sidebar');

// Render each tool
sidebarTools.forEach(placedTool => {
  <InlineElementRenderer
    toolId={placedTool.toolId}
    placementId={placedTool.id}
    config={{ ...tool.composition, ...placedTool.configOverrides }}
    state={placedTool.state}
    onStateChange={(newState) => updatePlacedToolState(placedTool.id, newState)}
  />
});
```

### Inline Components in Chat

Tools can be embedded in chat messages:

```
┌─────────────────────────────────────────────────────────────┐
│  @alice: Hey everyone, let's vote on where to meet!         │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 📊 Meeting Location Poll                              │  │
│  │                                                       │  │
│  │ ○ Student Union                                       │  │
│  │ ○ Library                                             │  │
│  │ ○ Coffee Shop                                         │  │
│  │                                                       │  │
│  │ [Vote]                              3 votes so far    │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  @bob: I voted!                                              │
└─────────────────────────────────────────────────────────────┘
```

**Data Model:**
```typescript
interface InlineComponent {
  id: string;
  messageId: string;
  toolId: string;               // Reference to HiveLab tool
  state: Record<string, any>;   // Independent state
  createdBy: string;
}
```

---

## Profile ↔ HiveLab Integration

### Tool Ownership

```
Profile creates tool     ──▶     tool.createdBy = profile.id
                                        │
                                        ▼
                                 Profile's tool portfolio
                                 (visible on profile page)
```

### Portfolio Display

```
┌─────────────────────────────────────────────────────────────┐
│  @alice's Profile                                            │
│                                                              │
│  [Activity] [Spaces] [Tools ←]                              │
│                                                              │
│  Tools Created (5)                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📊 Weekly Poll                                         │ │
│  │ Deployed in 3 spaces • 245 interactions                │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⏱️ Study Timer                                         │ │
│  │ Deployed in 1 space • 89 interactions                  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 📝 Event Signup Form                                   │ │
│  │ Published as template • 12 uses                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Profile Widgets

Users can deploy HiveLab tools as profile widgets:

```
┌─────────────────────────────────────────────────────────────┐
│  @alice's Profile                                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 📚 Currently Reading                                    ││
│  │ "Thinking Fast and Slow"                                ││
│  │ ████████░░ 80% complete                                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  This is a HiveLab tool deployed to profile                 │
└─────────────────────────────────────────────────────────────┘
```

### Context Passing

When rendering HiveLab tools, profile context is passed:

```typescript
interface ToolRenderContext {
  // Who is viewing
  viewerId: string;
  viewerRole: Role;

  // Owner context
  ownerId: string;          // Profile who created tool
  ownerHandle: string;

  // Space context (if in space)
  spaceId?: string;
  spaceMembership?: SpaceMember;

  // Permissions
  canEdit: boolean;
  canInteract: boolean;
}
```

---

## Data Flow Diagrams

### User Joins Space

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PROFILE   │     │    API      │     │   SPACE     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │  POST /join-v2    │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │                   │ Check permissions │
       │                   │───────────────────│
       │                   │                   │
       │                   │ Create SpaceMember│
       │                   │──────────────────▶│
       │                   │                   │
       │ Update profile.spaces[]               │
       │◀──────────────────│                   │
       │                   │                   │
       │                   │ Emit event        │
       │                   │──────────────────▶│
       │                   │ MemberJoinedEvent │
       │                   │                   │
```

### Tool Deployment

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   LEADER    │     │  HIVELAB    │     │    API      │     │   SPACE     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ Click Deploy      │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │ POST /deploy      │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │                   │ Create PlacedTool │
       │                   │                   │──────────────────▶│
       │                   │                   │                   │
       │                   │                   │ Update space      │
       │                   │                   │  .placedTools[]   │
       │                   │                   │──────────────────▶│
       │                   │                   │                   │
       │                   │ Return placement  │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │ Show success      │                   │                   │
       │◀──────────────────│                   │                   │
```

### Tool State Update

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   MEMBER    │     │   SPACE     │     │    API      │     │  FIRESTORE  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ Vote on poll      │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │ Optimistic update │                   │
       │                   │─────────────┐     │                   │
       │                   │             │     │                   │
       │                   │◀────────────┘     │                   │
       │                   │                   │                   │
       │                   │ POST /state       │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │                   │ Write state       │
       │                   │                   │──────────────────▶│
       │                   │                   │                   │
       │                   │                   │     SSE broadcast │
       │                   │                   │◀──────────────────│
       │                   │                   │                   │
       │                   │ Other members     │                   │
       │                   │ receive update    │                   │
       │                   │◀──────────────────│                   │
```

---

## Shared Entities

### CampusId

Every entity has a `campusId` field for multi-tenancy:

```typescript
// All queries include campus filter
.where("campusId", "==", "ub-buffalo")
```

### UserId / ProfileId

References between systems use consistent user IDs:

```typescript
// Profile
profile.id = 'user_abc123'

// In Space Member
member.userId = 'user_abc123'

// In Tool
tool.createdBy = 'user_abc123'

// In Placed Tool
placedTool.placedBy = 'user_abc123'
```

### Timestamps

All entities use consistent timestamp fields:

```typescript
interface BaseEntity {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;  // userId
}
```

---

## Campus Isolation Layer

### Enforcement Points

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMPUS ISOLATION                          │
│                                                              │
│  API Layer:                                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Every API route extracts campusId from session          ││
│  │ Passes to service layer                                 ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Service Layer:                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ All queries include .where("campusId", "==", campusId)  ││
│  │ All writes include campusId field                       ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Security Rules:                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ allow read: if resource.data.campusId == 'ub-buffalo'   ││
│  │ allow write: if request.resource.data.campusId == ...   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Cross-Campus Considerations

When HIVE expands to multiple campuses:

| Scenario | Policy |
|----------|--------|
| Browse spaces | Campus-only (no cross-campus) |
| View profiles | Campus-only by default, configurable |
| Deploy tools | Own campus only |
| Connections | Campus-only initially |
| Templates | Can be cross-campus (marketplace) |

---

## Real-time Integration

### SSE Channels

```
┌─────────────────────────────────────────────────────────────┐
│                    SSE CHANNELS                              │
│                                                              │
│  /api/spaces/{spaceId}/chat/stream                          │
│  ├── message:new                                            │
│  ├── message:update                                         │
│  ├── message:delete                                         │
│  ├── reaction:add                                           │
│  ├── typing:start                                           │
│  ├── member:join                                            │
│  └── member:leave                                           │
│                                                              │
│  /api/realtime/tool-updates                                 │
│  ├── tool:state_changed                                     │
│  └── tool:deployed                                          │
│                                                              │
│  /api/realtime/notifications                                │
│  ├── notification:new                                       │
│  └── notification:read                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Multi-System Real-time

```
User votes on poll in Space A
         │
         ▼
PlacedTool.state updated
         │
         ├──────────────────────────────────────┐
         │                                      │
         ▼                                      ▼
SSE to all Space A members              Analytics updated
(immediate UI update)                   (tool engagement++)
```

---

## Event-Driven Architecture

### Domain Events

```typescript
// Space Events
type SpaceEvent =
  | { type: 'MemberJoined'; spaceId: string; userId: string }
  | { type: 'MemberLeft'; spaceId: string; userId: string }
  | { type: 'RoleChanged'; spaceId: string; userId: string; newRole: Role }
  | { type: 'ToolPlaced'; spaceId: string; toolId: string; placementId: string }
  | { type: 'ToolRemoved'; spaceId: string; placementId: string };

// Profile Events
type ProfileEvent =
  | { type: 'ProfileUpdated'; userId: string; fields: string[] }
  | { type: 'InterestsChanged'; userId: string; interests: string[] }
  | { type: 'ConnectionMade'; fromUserId: string; toUserId: string };

// HiveLab Events
type HiveLabEvent =
  | { type: 'ToolCreated'; toolId: string; creatorId: string }
  | { type: 'ToolDeployed'; toolId: string; spaceId: string }
  | { type: 'ToolStateChanged'; placementId: string; state: any };
```

### Event Handlers (Future)

```typescript
// When profile updates, sync to space members
on('ProfileUpdated', async (event) => {
  const profile = await getProfile(event.userId);
  const spaces = profile.spaces;

  for (const spaceId of spaces) {
    await updateMemberCache(spaceId, event.userId, {
      displayName: profile.displayName,
      photoUrl: profile.photoUrl,
    });
  }
});

// When tool state changes, broadcast to space
on('ToolStateChanged', async (event) => {
  const placement = await getPlacement(event.placementId);
  await broadcastToSpace(placement.spaceId, {
    type: 'tool:state_changed',
    placementId: event.placementId,
    state: event.state,
  });
});
```

---

## Integration Edge Cases

### Profile Deleted

```
User requests account deletion
         │
         ▼
1. Leave all spaces
   ├── For each space: Remove SpaceMember
   └── Clear profile.spaces[]
         │
         ▼
2. Remove tool ownership
   ├── Option A: Transfer tools to HIVE system account
   └── Option B: Mark tools as "orphaned"
         │
         ▼
3. Remove placed tools
   └── Remove all PlacedTools where placedBy = userId
         │
         ▼
4. Anonymize profile
   └── Replace with "[Deleted User]"
```

### Space Deleted

```
Owner deletes space
         │
         ▼
1. Remove all PlacedTools
   └── Unlink from HiveLab tools
         │
         ▼
2. Update all member profiles
   └── Remove spaceId from profile.spaces[]
         │
         ▼
3. Archive messages and posts
   └── Soft delete, retain for 30 days
         │
         ▼
4. Clear member cache
```

### Tool Deleted

```
Creator deletes tool
         │
         ▼
1. Find all PlacedTools referencing this tool
         │
         ▼
2. For each PlacedTool:
   ├── Option A: Remove from space
   └── Option B: Mark as "tool unavailable"
         │
         ▼
3. Notify space leaders
   └── "A tool deployed in your space was deleted"
```

### Ownership Transfer

```
Space ownership transfer
         │
         ▼
1. Update space.ownerId
         │
         ▼
2. Update member roles
   ├── Old owner → admin (or leaves)
   └── New owner → owner
         │
         ▼
3. Tool placements remain
   └── PlacedTools still reference original creator
```

---

## Scale Implications

### At 1,000 Users

| Concern | Impact | Mitigation |
|---------|--------|------------|
| Profile ↔ Space sync | Low | Direct writes |
| Member cache | Low | Inline updates |
| Tool state | Low | Per-document |

### At 10,000 Users

| Concern | Impact | Mitigation |
|---------|--------|------------|
| Profile updates | Medium | Batch cache updates |
| Real-time | Medium | Connection pooling |
| Tool state sync | Medium | Debounced writes |

### At 100,000 Users (Multi-Campus)

| Concern | Impact | Mitigation |
|---------|--------|------------|
| Profile ↔ Space sync | High | Event-driven, async |
| Member cache | High | Separate cache service |
| Tool state | High | Sharded by campus |
| Real-time | High | Regional SSE servers |

### Data Sharding Strategy

```
Campus A (UB)                   Campus B (Future)
─────────────────────────────────────────────────

users_ub/                       users_xyz/
spaces_ub/                      spaces_xyz/
tools_ub/                       tools_xyz/

                    │
                    ▼
            Shared Templates
            (cross-campus marketplace)
```

---

## API Integration Map

### Profile APIs That Touch Spaces

| API | Space Integration |
|-----|-------------------|
| `GET /api/profile/{userId}` | Returns `spaces[]` with space names |
| `GET /api/profile/spaces` | Returns full space objects |
| `GET /api/profile/dashboard` | Aggregates space activity |

### Space APIs That Touch Profiles

| API | Profile Integration |
|-----|---------------------|
| `GET /api/spaces/{id}/members` | Returns profile data for each member |
| `POST /api/spaces/{id}/members` | Creates member from profile |
| `GET /api/spaces/{id}/analytics` | Aggregates by profile |

### Space APIs That Touch HiveLab

| API | HiveLab Integration |
|-----|---------------------|
| `GET /api/spaces/{id}` | Returns `placedTools[]` |
| `GET /api/spaces/{id}/tools` | Returns deployed tools |
| `POST /api/spaces/{id}/tools` | Creates PlacedTool |

### HiveLab APIs That Touch Spaces

| API | Space Integration |
|-----|-------------------|
| `POST /api/tools/{id}/deploy` | Creates PlacedTool in space |
| `GET /api/tools/{id}/analytics` | Aggregates by space deployment |

### HiveLab APIs That Touch Profiles

| API | Profile Integration |
|-----|---------------------|
| `GET /api/tools` | Filters by `createdBy` |
| `GET /api/tools/browse` | Returns creator profile data |

---

## Integration Health Checks

### Automated Checks

```typescript
// Check Profile ↔ Space consistency
async function checkProfileSpaceConsistency(userId: string) {
  const profile = await getProfile(userId);
  const actualMemberships = await getSpaceMemberships(userId);

  const profileSpaceIds = new Set(profile.spaces);
  const actualSpaceIds = new Set(actualMemberships.map(m => m.spaceId));

  const orphaned = [...profileSpaceIds].filter(id => !actualSpaceIds.has(id));
  const missing = [...actualSpaceIds].filter(id => !profileSpaceIds.has(id));

  return { orphaned, missing, consistent: orphaned.length === 0 && missing.length === 0 };
}

// Check PlacedTool ↔ Tool consistency
async function checkPlacedToolConsistency(spaceId: string) {
  const space = await getSpace(spaceId, { loadPlacedTools: true });

  const orphanedPlacements = [];
  for (const placement of space.placedTools) {
    const tool = await getTool(placement.toolId);
    if (!tool) {
      orphanedPlacements.push(placement.id);
    }
  }

  return { orphanedPlacements, consistent: orphanedPlacements.length === 0 };
}
```

### Monitoring Dashboards (Future)

```
┌─────────────────────────────────────────────────────────────┐
│  Integration Health                                          │
│                                                              │
│  Profile ↔ Space Sync:     ████████████████████░░  96%      │
│  PlacedTool Consistency:   ████████████████████░░  98%      │
│  Member Cache Freshness:   ██████████████████░░░░  90%      │
│                                                              │
│  Alerts:                                                     │
│  • 42 orphaned space references (auto-cleaning scheduled)   │
│  • 3 missing tool references (notified space leaders)       │
└─────────────────────────────────────────────────────────────┘
```

---

*This document is the source of truth for system integration. Update when new integrations are added.*
