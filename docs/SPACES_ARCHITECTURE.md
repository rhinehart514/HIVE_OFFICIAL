# HIVE Spaces Vertical Slice - Comprehensive Architecture Map

> Generated: January 2026
> Status: 96% Complete | Scaling Grade: A-

---

## 1. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FIRESTORE COLLECTIONS                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  spaces/{spaceId}                                                           │
│  ├── name, slug, description, category, visibility, createdBy              │
│  ├── spaceType: 'uni' | 'student' | 'greek' | 'residential'               │
│  ├── governance: 'flat' | 'emergent' | 'hybrid' | 'hierarchical'          │
│  ├── status: 'unclaimed' | 'active' | 'claimed' | 'verified'              │
│  ├── memberCount (shardable), bannerUrl, settings                          │
│  └── metrics: { memberCount, activeMembers, postCount, eventCount }        │
│                                                                              │
│  spaces/{spaceId}/boards/{boardId}                                          │
│  ├── name, type: 'general' | 'topic' | 'event'                            │
│  ├── order, isDefault, linkedEventId, canPost, canReact                    │
│  ├── messageCount, participantCount, isLocked, isArchived                  │
│  └── pinnedMessageIds: string[] (max 10)                                   │
│                                                                              │
│  spaces/{spaceId}/boards/{boardId}/messages/{messageId}                    │
│  ├── type: 'text' | 'inline_component' | 'system'                         │
│  ├── authorId, authorName, authorAvatarUrl, authorRole                     │
│  ├── content (XSS-scanned), timestamp, editedAt, isDeleted                │
│  ├── reactions: [{emoji, count, userIds: string[]}]                        │
│  ├── componentData: { elementType, deploymentId, toolId, state, isActive } │
│  ├── replyToId?, threadCount                                               │
│  └── isPinned, boardId (for queries)                                       │
│                                                                              │
│  spaceMembers/{spaceId}_{userId}                                            │
│  ├── spaceId, userId, role: 'owner' | 'admin' | 'moderator' | 'member'   │
│  ├── joinedAt, isActive, joinMethod: 'direct' | 'invite' | 'approval'     │
│  └── campusId (required for isolation)                                     │
│                                                                              │
│  events/{eventId}                                                           │
│  ├── spaceId, title, description, startAt, endTime, location, isVirtual   │
│  ├── status: 'draft' | 'published' | 'cancelled'                          │
│  ├── rsvps: { going: [], maybe: [], notGoing: [] }                         │
│  └── linkedBoardId, createdBy                                              │
│                                                                              │
│  /typing/{spaceId}/{boardId}/{userId}  [Realtime DB]                       │
│  ├── isTyping, timestamp, userId                                           │
│  └── Auto-cleared after 5s                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DDD DOMAIN LAYER (@hive/core)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  AGGREGATE ROOT: EnhancedSpace                                              │
│  ├── spaceId: SpaceId (value object)                                       │
│  ├── name: SpaceName (value object)                                        │
│  ├── slug: SpaceSlug (value object, unique within campus)                  │
│  ├── description: SpaceDescription (value object)                          │
│  ├── category: SpaceCategory (value object)                                │
│  ├── spaceType: SpaceType → determines governance & templates              │
│  ├── governance: GovernanceModel → controls role system                    │
│  ├── status: SpaceStatus → ownership lifecycle                             │
│  ├── members: SpaceMember[] { profileId, role, joinedAt }                  │
│  ├── leaderRequests: LeaderRequest[] (with verification proof)             │
│  ├── tabs: Tab[] (boards)                                                  │
│  ├── widgets: Widget[] (sidebar)                                           │
│  ├── placedTools: PlacedTool[] (HiveLab deployments)                       │
│  ├── settings: SpaceSettings { allowInvites, requireApproval, ... }        │
│  └── rushMode?: RushMode { isActive, startDate, endDate }                  │
│                                                                              │
│  ENTITIES:                                                                  │
│  - Board: Channels with name, type, permissions, messageCount              │
│  - ChatMessage: Messages with reactions, threading, inline components      │
│  - InlineComponent: Rendered HiveLab elements (polls, signup, RSVP)        │
│  - PlacedTool: Tool deployed to space sidebar                              │
│                                                                              │
│  VALUE OBJECTS:                                                             │
│  - SpaceId, SpaceName, SpaceSlug, SpaceDescription, SpaceCategory         │
│  - ProfileId, CampusId                                                     │
│                                                                              │
│  DOMAIN EVENTS:                                                             │
│  - SpaceUpdatedEvent, TabCreatedEvent, MessageSentEvent                    │
│  - ReactionAddedEvent, ToolPlacedEvent, ToolRemovedEvent                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER (Services & DTOs)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SpaceChatService (1,484 lines)                                             │
│  ├── createBoard, sendMessage, editMessage, deleteMessage                  │
│  ├── addReaction, removeReaction, pinMessage, unpinMessage                 │
│  ├── listMessages (paginated), searchMessages                              │
│  ├── getThreadReplies, createInlineComponent                               │
│  └── participateInComponent (polls, RSVP)                                  │
│                                                                              │
│  SpaceManagementService                                                     │
│  ├── createSpace, updateSpace, deleteSpace                                 │
│  ├── claimSpace, requestLeadership                                         │
│  ├── addMember, changeMemberRole, removeMember                             │
│  └── transferOwnership                                                     │
│                                                                              │
│  SpaceDiscoveryService                                                      │
│  ├── getRecommended, getPopular, getTrending                               │
│  └── search (full-text)                                                    │
│                                                                              │
│  DTOs: SpaceBaseDTO, SpaceDetailDTO, SpaceBrowseDTO, MessageDTO            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Pages + Components + Hooks)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Pages:                                                                     │
│  - /spaces/browse → Space discovery with cold start signals                │
│  - /spaces/[spaceId] → Space theater mode (60/40 chat + sidebar)           │
│  - /spaces/create → Create space flow                                      │
│  - /spaces/claim → Claim pre-seeded space                                  │
│                                                                              │
│  React Hooks (1,548 lines total):                                           │
│  - useChatMessages: Main hook, composes all others                         │
│  - useChatSSE: EventSource connection & Firestore stream                   │
│  - useChatMutations: Send/edit/delete/react mutations                      │
│  - useChatTyping: Typing indicators via Realtime DB                        │
│  - useChatThreads: Thread replies management                               │
│                                                                              │
│  UI Components (79 total):                                                  │
│  - SpaceChatBoard (1,252 lines): Main chat with virtualization             │
│  - SpaceSidebarConfigurable: Events, tools, members widgets               │
│  - SpaceDiscoveryCard: Browse card with cold start signals                 │
│  - PremiumComposer: Rich message input with slash commands                 │
│  - PremiumMessage: Message display with reactions & threading              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. API Routes (68 endpoints)

### Core Space Management
```
GET     /api/spaces                          List spaces (paginated)
POST    /api/spaces                          Create space
GET     /api/spaces/[spaceId]                Get space details
PATCH   /api/spaces/[spaceId]                Update space (owner/admin)
DELETE  /api/spaces/[spaceId]                Delete space (owner only)
GET     /api/spaces/mine                     Spaces I own
GET     /api/spaces/my                       Spaces I'm a member of
```

### Discovery & Search
```
GET     /api/spaces/browse-v2                Browse with cold start signals
GET     /api/spaces/search                   Full-text search
GET     /api/spaces/recommended              AI-powered recommendations
GET     /api/spaces/[spaceId]/preview        Preview before joining
POST    /api/spaces/join-v2                  Join space
POST    /api/spaces/leave                    Leave space
POST    /api/spaces/claim                    Claim pre-seeded space
```

### Chat System
```
GET     /api/spaces/[spaceId]/chat           List messages (paginated)
POST    /api/spaces/[spaceId]/chat           Send message
GET     /api/spaces/[spaceId]/chat/stream    SSE real-time stream
GET     /api/spaces/[spaceId]/chat/pinned    Get pinned messages
GET     /api/spaces/[spaceId]/chat/search    Search messages
POST    /api/spaces/[spaceId]/chat/typing    Publish typing indicator

GET     /api/spaces/[spaceId]/chat/[messageId]        Get message
PATCH   /api/spaces/[spaceId]/chat/[messageId]        Edit message
DELETE  /api/spaces/[spaceId]/chat/[messageId]        Delete message

POST    /api/spaces/[spaceId]/chat/[messageId]/react  Add/remove reaction
POST    /api/spaces/[spaceId]/chat/[messageId]/pin    Pin message
GET     /api/spaces/[spaceId]/chat/[messageId]/replies Get thread replies
```

### Boards (Channels)
```
GET     /api/spaces/[spaceId]/boards                  List boards
POST    /api/spaces/[spaceId]/boards                  Create board
GET     /api/spaces/[spaceId]/boards/[boardId]        Get board
PATCH   /api/spaces/[spaceId]/boards/[boardId]        Update board
DELETE  /api/spaces/[spaceId]/boards/[boardId]        Delete board
```

### Members & Roles
```
GET     /api/spaces/[spaceId]/members                 List members
POST    /api/spaces/[spaceId]/members                 Add member
GET     /api/spaces/[spaceId]/members/[memberId]      Get member
PATCH   /api/spaces/[spaceId]/members/[memberId]      Update role
DELETE  /api/spaces/[spaceId]/members/[memberId]      Remove member
```

### Inline Components
```
GET     /api/spaces/[spaceId]/components                    List components
POST    /api/spaces/[spaceId]/components                    Create component
GET     /api/spaces/[spaceId]/components/[componentId]      Get component
POST    /api/spaces/[spaceId]/components/[componentId]/participate  Vote/RSVP
```

### Events
```
GET     /api/spaces/[spaceId]/events                        List events
POST    /api/spaces/[spaceId]/events                        Create event
GET     /api/spaces/[spaceId]/events/[eventId]              Get event
PATCH   /api/spaces/[spaceId]/events/[eventId]              Update event
DELETE  /api/spaces/[spaceId]/events/[eventId]              Delete event
POST    /api/spaces/[spaceId]/events/[eventId]/rsvp         RSVP
```

### Tools (HiveLab Integration)
```
GET     /api/spaces/[spaceId]/tools                    List deployed tools
POST    /api/spaces/[spaceId]/tools/feature            Feature tool
GET     /api/spaces/[spaceId]/apps/[deploymentId]      Get deployed instance
```

---

## 3. Cold Start Signals (Jan 2026)

### Problem
Empty spaces show no activity → users don't join → death spiral.

### Solution
Show value upfront without requiring chat activity:

```typescript
interface SpaceBrowseDTO {
  // Standard fields
  id: string;
  name: string;
  memberCount: number;

  // Cold start signals
  upcomingEventCount: number;    // "5 upcoming events"
  nextEventAt: Date | null;      // "Friday 3pm"
  nextEventTitle: string | null; // "Tournament"
  mutualCount: number;           // "2 friends are members"
  mutualAvatars: string[];       // Avatar stack (max 3)
  toolCount: number;             // "8 tools deployed"
  isVerified: boolean;           // Official UB org badge
}
```

### Implementation

**API (`browse-v2/route.ts`):**
```typescript
// Fetch event enrichment
const { eventCounts, nextEvents } = await fetchEventEnrichment(spaceIds);

// Fetch mutual friends
const mutuals = await fetchMutualEnrichment(userId, spaceIds);

// Build enrichment object
const enrichment: SpaceBrowseEnrichment = {
  eventCounts,
  nextEvents,
  mutuals,
  toolCounts: new Map(),
};

// Transform with enrichment
const transformedSpaces = toSpaceBrowseDTOList(spaces, userSpaceIds, enrichment);
```

**Frontend (`browse-cards.tsx`):**
- HeroSpaceCard: Shows verified badge, next event, mutual friends
- NeighborhoodCard: Shows event count, mutual avatars, tool count

---

## 4. Real-Time Features

### SSE Architecture

```
Client                          Server              Firestore
  │                              │                     │
  ├──GET /api/spaces/[id]/chat/stream (cookie auth)   │
  │◄─────────────── 200 OK ──────┤                     │
  │◄──data: {"id":"m1"} ─────────┤◄── Message created ─┤
  │◄──data: {"id":"m2"} ─────────┤◄── Message created ─┤
```

**Rate Limits:**
- SSE connections: 100/min/user
- Message sends: 20/min/user

### Typing Indicators (Realtime DB)

```
/typing/{spaceId}/{boardId}/{userId}: { isTyping: boolean, timestamp: number }
```

**Constants:**
- `TYPING_INDICATOR_INTERVAL_MS = 3000` (only send every 3s)
- `TYPING_TTL_MS = 5000` (auto-clear after 5s)

### Optimistic Updates

1. Create temp message with `tempId`
2. Add to state immediately
3. Send to server
4. Track mapping: `tempId → messageId`
5. Replace temp with real on SSE confirmation

**Perceived latency:** 0ms (vs ~300ms actual)

---

## 5. Key Files by Layer

### Domain Layer
| File | Lines | Purpose |
|------|-------|---------|
| `core/src/domain/spaces/aggregates/enhanced-space.ts` | 400+ | Aggregate root |
| `core/src/domain/spaces/entities/chat-message.ts` | 200+ | Message entity |
| `core/src/domain/spaces/entities/board.ts` | 180+ | Board entity |
| `core/src/domain/spaces/entities/inline-component.ts` | 250+ | Poll/RSVP entity |

### Application Layer
| File | Lines | Purpose |
|------|-------|---------|
| `core/src/application/spaces/space-chat.service.ts` | 1,484 | Chat operations |
| `core/src/application/spaces/space.dto.ts` | 200+ | Response DTOs |
| `core/src/application/spaces/space.presenter.ts` | 150+ | DTO transformation |

### API Routes
| File | Lines | Purpose |
|------|-------|---------|
| `web/src/app/api/spaces/browse-v2/route.ts` | 368 | Browse with cold start |
| `web/src/app/api/spaces/[spaceId]/chat/route.ts` | 266 | Message CRUD |
| `web/src/app/api/spaces/[spaceId]/chat/stream/route.ts` | 267 | SSE stream |

### Frontend Hooks
| File | Lines | Purpose |
|------|-------|---------|
| `hooks/chat/use-chat-messages.ts` | 276 | Main hook |
| `hooks/chat/use-chat-sse.ts` | 140 | SSE connection |
| `hooks/chat/use-chat-mutations.ts` | 285 | Mutations |
| `hooks/chat/use-chat-typing.ts` | 156 | Typing |

### Frontend Pages
| File | Lines | Purpose |
|------|-------|---------|
| `app/spaces/[spaceId]/page.tsx` | 2,076 | Space theater |
| `app/spaces/browse/page.tsx` | 1,186 | Discovery |

---

## 6. Scaling Status

### Completed (Jan 2026)
- Typing throttle: 3s interval, 5s TTL
- SSE rate limit: 100/min
- Message reactions: Atomic transactions
- Browse pagination: Cursor-based
- Cache headers: 60s/5m stale

### Architecture Limits
| Resource | Limit | Solution |
|----------|-------|----------|
| SSE connections | 100/min/user | Rate limiting |
| Message sends | 20/min/user | Rate limiting |
| Concurrent users/space | 500+ | Virtualization + SSE |
| Space joins/min | 600 (with sharding) | memberCount sharding |

---

## 7. Security

### Campus Isolation
Every query includes `campusId`:
```typescript
.where('campusId', '==', user.campusId)
```

### XSS Prevention
All content scanned via SecurityScanner before storage.

### Permission Hierarchy
- owner: Full control
- admin: Manage members & settings
- moderator: Moderate content
- member: Chat & react
- guest: Read-only

---

*Last updated: January 2026*
