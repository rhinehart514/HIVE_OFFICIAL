# Spaces Complete Specification

**Last Updated:** December 2025
**Status:** Winter 2025-26 Launch Ready
**Completion:** 85% → Target 95%

---

## Executive Summary

Spaces are the heart of HIVE—Discord-quality community hubs native to campus life. Every student organization, club, and community gets a Space where members can chat in real-time, discover events, and use tools created in HiveLab.

**Core Promise:** Enter a space → immediately see active conversation → context always visible → everything flows through chat.

---

## Table of Contents

1. [Philosophy & Vision](#philosophy--vision)
2. [Architecture Overview](#architecture-overview)
3. [The 60/40 Layout](#the-6040-layout)
4. [Chat System](#chat-system)
5. [Board System](#board-system)
6. [Member Management](#member-management)
7. [Sidebar & Widgets](#sidebar--widgets)
8. [Tool Integration](#tool-integration)
9. [Events & Calendar](#events--calendar)
10. [Discovery & Joining](#discovery--joining)
11. [Leadership & Moderation](#leadership--moderation)
12. [Real-time Infrastructure](#real-time-infrastructure)
13. [Integration Points](#integration-points)
14. [Butterfly Effects at Scale](#butterfly-effects-at-scale)
15. [Winter Launch Checklist](#winter-launch-checklist)

---

## Philosophy & Vision

### Why Spaces Exist

**Community Autonomy:** Any student can create a space. No approval process. No paperwork. Student leaders have full control.

The old way:
```
Want to start a club → Fill out forms → Wait for approval → Get placed in clunky portal
```

The HIVE way:
```
Want to start a community → Create a space → You're live in seconds
```

### The Experience

A first-year student opens HIVE:
- **Discovers** 400+ spaces already seeded (clubs, orgs, communities)
- **Joins** spaces around interests, not credentials
- **Explores** AI, climate, startups, art—without declaring anything
- **Meets** people who are doing, not just studying
- **Figures out** their path through action, not course catalogs

### Success Metrics

**Space Vitality:** Not "how many spaces exist"—"how many are alive."

```
Alive = >10 messages in 7 days OR >1 event created OR >1 tool actively used
Target: 100+ vital spaces after semester 1
```

---

## Architecture Overview

### System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SPACE PAGE                                        │
│                                                                               │
│  ┌────────────────────────────────────────┐  ┌────────────────────────────┐ │
│  │                                        │  │                            │ │
│  │           CHAT BOARD (60%)             │  │      SIDEBAR (40%)         │ │
│  │                                        │  │                            │ │
│  │  ┌──────────────────────────────────┐  │  │  ┌──────────────────────┐  │ │
│  │  │ Message Stream                   │  │  │  │ Upcoming Events      │  │ │
│  │  │                                  │  │  │  │ ┌─────────────────┐  │  │ │
│  │  │ @alice: Hey everyone!            │  │  │  │ │ Study Session   │  │  │ │
│  │  │ @bob: Who's coming tonight?      │  │  │  │ │ Dec 28, 7pm     │  │  │ │
│  │  │ [POLL: Best time for meeting?]   │  │  │  │ └─────────────────┘  │  │ │
│  │  │ @carol: I voted!                 │  │  │  └──────────────────────┘  │ │
│  │  │                                  │  │  │                            │ │
│  │  └──────────────────────────────────┘  │  │  ┌──────────────────────┐  │ │
│  │                                        │  │  │ HiveLab Tools       │  │ │
│  │  ┌──────────────────────────────────┐  │  │  │ ┌─────────────────┐  │  │ │
│  │  │ Thread Panel (when active)       │  │  │  │ │ Weekly Poll    │  │  │ │
│  │  │ └─ 5 replies                     │  │  │  │ │ [Vote Now]     │  │  │ │
│  │  └──────────────────────────────────┘  │  │  │ └─────────────────┘  │  │ │
│  │                                        │  │  │ ┌─────────────────┐  │  │ │
│  │  ┌──────────────────────────────────┐  │  │  │ │ Member Leaderboard│ │  │ │
│  │  │ [ Type a message... ] [Send]     │  │  │  │ └─────────────────┘  │  │ │
│  │  └──────────────────────────────────┘  │  │  └──────────────────────┘  │ │
│  │                                        │  │                            │ │
│  └────────────────────────────────────────┘  │  ┌──────────────────────┐  │ │
│                                              │  │ Members (245)        │  │ │
│  ┌────────────────────────────────────────┐  │  │ @alice (Leader)     │  │ │
│  │ [General] [Events] [Study] [Announce] +│  │  │ @bob @carol +242    │  │ │
│  └────────────────────────────────────────┘  │  └──────────────────────┘  │ │
│                                              └────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Architecture

```
packages/core/src/domain/spaces/
├── aggregates/
│   └── enhanced-space.ts           # Core aggregate (1,564 lines)
├── entities/
│   ├── board.ts                    # Chat channels (362 lines)
│   ├── placed-tool.ts              # Deployed HiveLab tools
│   ├── inline-component.ts         # Embedded components in chat
│   ├── tab.ts                      # Custom space tabs
│   └── widget.ts                   # Sidebar widgets
├── events/                         # Domain events
├── value-objects/                  # SpaceId, SpaceName, SpaceSlug, etc.
└── templates/                      # Space templates

packages/core/src/application/spaces/
├── space-chat.service.ts           # Chat operations (1,484 lines)
├── space-deployment.service.ts     # Tool deployment
├── space-management.service.ts     # CRUD operations
├── space-discovery.service.ts      # Browse, search, recommend
└── space.dto.ts                    # Response DTOs

packages/ui/src/atomic/03-Spaces/
├── organisms/
│   └── space-chat-board.tsx        # Main chat component (1,131 lines)
├── molecules/
│   ├── message-item.tsx
│   ├── message-composer.tsx
│   └── thread-panel.tsx
└── atoms/
    ├── reaction-picker.tsx
    └── typing-indicator.tsx

apps/web/src/
├── app/spaces/
│   ├── page.tsx                    # Space listing
│   ├── browse/page.tsx             # Discovery
│   └── [spaceId]/
│       └── page.tsx                # Space view (1,796 lines)
├── hooks/
│   ├── use-chat-messages.ts        # Chat hook (1,185 lines)
│   └── use-pinned-messages.ts      # Pinned messages (173 lines)
└── app/api/spaces/
    ├── route.ts                    # List/create
    ├── [spaceId]/
    │   ├── route.ts                # CRUD
    │   ├── chat/route.ts           # Messages
    │   ├── chat/stream/route.ts    # SSE real-time
    │   ├── boards/route.ts         # Board management
    │   ├── members/route.ts        # Membership
    │   ├── tools/route.ts          # Deployed tools
    │   ├── events/route.ts         # Space events
    │   └── analytics/route.ts      # Metrics
    ├── browse-v2/route.ts          # Discovery
    └── search/route.ts             # Search
```

---

## The 60/40 Layout

### Layout Philosophy

The 60/40 split prioritizes **conversation** while keeping **context** always visible.

**Left (60%):** Chat is the center of gravity. Everything flows through conversation.

**Right (40%):** Persistent context—events, tools, members—without leaving chat.

### Responsive Behavior

| Screen | Layout |
|--------|--------|
| Desktop (>1200px) | Full 60/40 split |
| Tablet (768-1200px) | 70/30 split |
| Mobile (<768px) | Chat fullscreen, sidebar as drawer |

### Mobile Navigation

```
┌──────────────────────────────┐
│  Space Name                ≡ │  ◄── Hamburger opens sidebar drawer
├──────────────────────────────┤
│                              │
│      CHAT (100%)             │
│                              │
│  ┌────────────────────────┐  │
│  │ Messages...            │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │ [ Type message... ]   │  │
│  └────────────────────────┘  │
│                              │
├──────────────────────────────┤
│ [General] [Events] [+]       │  ◄── Board tabs
└──────────────────────────────┘
```

---

## Chat System

### Message Model

```typescript
interface SpaceMessage {
  id: string;
  spaceId: string;
  boardId: string;
  authorId: string;

  // Content
  content: string;              // Plain text or markdown
  attachments: Attachment[];    // Images, files
  mentions: Mention[];          // @user mentions
  inlineComponents: InlineComponent[]; // Embedded tools

  // Threading
  threadId: string | null;      // Parent thread (null = root)
  replyCount: number;
  lastReplyAt: Date | null;

  // Engagement
  reactions: Reaction[];
  isPinned: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date | null;
  editedAt: Date | null;
  isDeleted: boolean;
}
```

### Real-time Chat Flow

```
User Types          Local             Server            Other Users
────────────────────────────────────────────────────────────────────

Keystrokes    ──▶   Optimistic   ──▶   Firestore    ──▶   SSE Stream
                    Update             Write              Broadcast

                         │                                    │
                         ▼                                    ▼
                    Show message                         Receive &
                    immediately                          display
```

### Chat Features

| Feature | Status | Implementation |
|---------|--------|----------------|
| Real-time streaming | Done | SSE via `/chat/stream` |
| Optimistic updates | Done | Local state + rollback |
| Threading | Done | Reply to any message |
| Reactions | Done | Emoji picker + quick reactions |
| @ mentions | Done | Autocomplete users |
| Link previews | Done | OG metadata fetch |
| Image attachments | Done | Firebase Storage |
| File attachments | Done | Firebase Storage |
| Message editing | Done | Edit history tracked |
| Message deletion | Done | Soft delete |
| Pinned messages | Done | Per-board pins |
| Message search | Partial | Basic text search |
| Typing indicators | Buggy | 2s polling (needs fix) |

### useChatMessages Hook

```typescript
// apps/web/src/hooks/use-chat-messages.ts (1,185 lines)

interface UseChatMessagesReturn {
  // State
  messages: SpaceMessage[];
  isLoading: boolean;
  error: Error | null;
  hasMore: boolean;

  // Actions
  sendMessage: (content: string, options?: SendOptions) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  pinMessage: (messageId: string) => Promise<void>;

  // Pagination
  loadMore: () => Promise<void>;

  // Real-time
  isConnected: boolean;
  typingUsers: string[];
}

const {
  messages,
  sendMessage,
  addReaction,
  isConnected
} = useChatMessages({
  spaceId: 'space_xyz',
  boardId: 'general',
  limit: 50,
});
```

### Rate Limiting

```
Message sending: 20 messages/minute per user
Reaction adding: 30 reactions/minute per user
Editing: 10 edits/minute per user
```

### Content Safety

- XSS protection via sanitization
- Content moderation (ML-based flagging)
- Link scanning (malicious URL detection)
- Image moderation (Vertex AI)

---

## Board System

### Board Model

```typescript
interface Board {
  id: string;
  spaceId: string;
  name: string;
  slug: string;
  description?: string;

  // Type
  type: 'general' | 'topic' | 'event' | 'announcement';

  // Permissions
  permissions: {
    canPost: Role[];      // Who can send messages
    canView: Role[];      // Who can read
    canModerate: Role[];  // Who can pin/delete
  };

  // State
  isArchived: boolean;
  isPinned: boolean;
  order: number;

  // Stats
  messageCount: number;
  lastMessageAt: Date | null;

  // Metadata
  createdAt: Date;
  createdBy: string;
}
```

### Default Boards

Every space is created with:
1. **General** (auto-created, non-deletable)

Leaders can create additional boards:
- **Events** — Event-specific discussions
- **Announcements** — Leader-only posting
- **Study Groups** — Topic-focused
- **Custom** — Any purpose

### Board Operations

| Operation | Permission | API |
|-----------|------------|-----|
| Create board | Admin+ | POST `/spaces/{id}/boards` |
| Edit board | Admin+ | PATCH `/spaces/{id}/boards/{boardId}` |
| Delete board | Admin+ | DELETE `/spaces/{id}/boards/{boardId}` |
| Archive board | Admin+ | PATCH with `isArchived: true` |
| Reorder boards | Admin+ | PATCH with `order` updates |
| Switch board | Member | Client-side navigation |

---

## Member Management

### Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                         OWNER                                    │
│  Full control, transfer ownership, delete space                 │
├─────────────────────────────────────────────────────────────────┤
│                         ADMIN                                    │
│  Manage members, settings, deploy tools, moderate               │
├─────────────────────────────────────────────────────────────────┤
│                       MODERATOR                                  │
│  Moderate content, pin messages, manage boards                  │
├─────────────────────────────────────────────────────────────────┤
│                        MEMBER                                    │
│  Chat, react, use tools, view content                           │
├─────────────────────────────────────────────────────────────────┤
│                         GUEST                                    │
│  Read-only access (private spaces only)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Member Model

```typescript
interface SpaceMember {
  id: string;
  spaceId: string;
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

  // Profile Cache
  displayName: string;
  handle: string;
  photoUrl?: string;

  // Activity
  joinedAt: Date;
  lastActiveAt: Date;
  messageCount: number;

  // Permissions
  canPost: boolean;
  canModerate: boolean;
  canManageTools: boolean;

  // Settings
  notificationPreference: 'all' | 'mentions' | 'none';
  isMuted: boolean;
}
```

### Leadership Request Flow

```
Member requests     ──▶  Request stored   ──▶  Admin reviews   ──▶  Approved/
to lead                  in space              in dashboard         Rejected

                                                                       │
                                                                       ▼
                                                               Role updated
                                                               Notification sent
```

### Member Operations

| Operation | Permission | API |
|-----------|------------|-----|
| Join space | Self | POST `/spaces/{id}/join-v2` |
| Leave space | Self | POST `/spaces/{id}/leave` |
| Invite member | Admin+ | POST `/spaces/{id}/members` |
| Remove member | Admin+ | DELETE `/spaces/{id}/members/{userId}` |
| Change role | Admin+ | PATCH `/spaces/{id}/members/{userId}` |
| Transfer ownership | Owner | POST `/spaces/{id}/transfer` |
| Request to lead | Member | POST `/spaces/{id}/request-to-lead` |

---

## Sidebar & Widgets

### Widget Types

| Widget | Description | Data Source |
|--------|-------------|-------------|
| **Events** | Upcoming space events | Space events API |
| **HiveLab Tools** | Deployed tools | PlacedTools |
| **Members** | Member list with search | Space members |
| **About** | Space description, links | Space metadata |
| **Quick Actions** | Join, share, settings | N/A |

### Widget Model

```typescript
interface SidebarWidget {
  id: string;
  spaceId: string;
  type: WidgetType;

  // Display
  title: string;
  isExpanded: boolean;
  order: number;

  // Config
  config: Record<string, unknown>;

  // State
  isActive: boolean;
}
```

### Sidebar Layout

```
┌────────────────────────────┐
│ Upcoming Events        [−] │  ◄── Collapsible section
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ Study Session         │ │
│ │ Dec 28, 7pm           │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ Weekly Meeting        │ │
│ │ Dec 30, 3pm           │ │
│ └────────────────────────┘ │
├────────────────────────────┤
│ HiveLab Tools          [−] │
├────────────────────────────┤
│ ┌────────────────────────┐ │
│ │ 📊 Weekly Poll        │ │  ◄── Deployed HiveLab tool
│ │ [Vote Now]            │ │
│ └────────────────────────┘ │
│ ┌────────────────────────┐ │
│ │ 🏆 Leaderboard        │ │
│ │ 1. @alice (150pts)    │ │
│ └────────────────────────┘ │
├────────────────────────────┤
│ Members (245)          [−] │
├────────────────────────────┤
│ 🔍 Search members...      │
│ ┌────────────────────────┐ │
│ │ 👑 @alice (Owner)     │ │
│ │ ⭐ @bob (Admin)       │ │
│ │    @carol             │ │
│ │    @dave              │ │
│ │    +241 more          │ │
│ └────────────────────────┘ │
└────────────────────────────┘
```

---

## Tool Integration

### PlacedTool in Spaces

HiveLab tools are deployed to spaces via the `PlacedTool` entity:

```typescript
// On space load
const space = await getSpace(spaceId, { loadPlacedTools: true });

// Tools available in:
space.sidebarTools;   // Tools displayed in sidebar
space.inlineTools;    // Tools that can be embedded in chat
space.tabTools;       // Tools as full tabs
```

### Deployment Locations

| Location | Visibility | Interaction |
|----------|------------|-------------|
| **Sidebar** | Persistent, always visible | Click to expand |
| **Inline** | Embedded in messages | In-place interaction |
| **Tab** | Full-page tool experience | Tab navigation |
| **Modal** | Popup overlay | Button trigger |

### Tool Rendering

```tsx
// Sidebar tool rendering
<SidebarToolList>
  {space.sidebarTools.map(tool => (
    <InlineElementRenderer
      key={tool.id}
      toolId={tool.toolId}
      placementId={tool.id}
      config={tool.configOverrides}
      state={tool.state}
      onStateChange={handleStateUpdate}
    />
  ))}
</SidebarToolList>
```

### State Per Placement

Each deployment has its own state:

```
Tool: "Weekly Poll"
├── Deployed to Space A → State: { votes: { option1: ['user1'] } }
├── Deployed to Space B → State: { votes: { option2: ['user3', 'user4'] } }
└── Deployed to Space C → State: { votes: {} }
```

---

## Events & Calendar

### Event Model

```typescript
interface SpaceEvent {
  id: string;
  spaceId: string;
  title: string;
  description: string;

  // Timing
  startTime: Date;
  endTime: Date;
  timezone: string;
  isAllDay: boolean;

  // Location
  location: string;
  locationDetails?: string;
  isVirtual: boolean;
  virtualLink?: string;

  // Attendance
  rsvpCount: number;
  attendeeLimit?: number;
  rsvpRequired: boolean;

  // Metadata
  tags: string[];
  imageUrl?: string;
  createdBy: string;
  createdAt: Date;
}
```

### Calendar Integration

```
Space Events         ──▶  User Calendar      ──▶  Conflict Detection
(per space)               (aggregated)            (overlap check)
```

### Event Operations

| Operation | Permission | API |
|-----------|------------|-----|
| Create event | Admin+ | POST `/spaces/{id}/events` |
| Edit event | Admin+ | PATCH `/spaces/{id}/events/{eventId}` |
| Delete event | Admin+ | DELETE `/spaces/{id}/events/{eventId}` |
| RSVP | Member | POST `/spaces/{id}/events/{eventId}/rsvp` |
| View events | Member | GET `/spaces/{id}/events` |

---

## Discovery & Joining

### Discovery Flow

```
User Opens Browse    ──▶  Categories      ──▶  Search/Filter   ──▶  Space Detail
                          - Organizations
                          - Greek Life
                          - Campus Living
                          - HIVE Exclusive
```

### Browse Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Browse Spaces                                                   │
├─────────────────────────────────────────────────────────────────┤
│  🔍 Search spaces...                                            │
│                                                                  │
│  Categories: [All] [Orgs] [Greek] [Academic] [Sports] [More ▾] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ CS Club     │  │ Dance Team  │  │ Pre-Med Soc │              │
│  │ 245 members │  │ 89 members  │  │ 156 members │              │
│  │ [Join]      │  │ [Join]      │  │ [Request]   │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                  │
│  Trending This Week                                              │
│  ┌─────────────┐  ┌─────────────┐                               │
│  │ AI Study    │  │ Startup     │                               │
│  │ 🔥 +45 new  │  │ 🔥 +32 new  │                               │
│  └─────────────┘  └─────────────┘                               │
│                                                                  │
│  Your Friends Are In                                             │
│  ┌─────────────┐                                                │
│  │ Photo Club  │  @alice, @bob are members                      │
│  └─────────────┘                                                │
└─────────────────────────────────────────────────────────────────┘
```

### Join Flow

| Space Type | Join Action | Process |
|------------|-------------|---------|
| Public | Instant join | Click → Member |
| Private | Request access | Click → Pending → Admin approves → Member |
| Invite-only | Invite link | Link → Member |

### Space Categories

```typescript
enum SpaceType {
  STUDENT_ORGANIZATIONS = 'student_organizations',
  UNIVERSITY_ORGANIZATIONS = 'university_organizations',
  GREEK_LIFE = 'greek_life',
  CAMPUS_LIVING = 'campus_living',
  HIVE_EXCLUSIVE = 'hive_exclusive'
}
```

---

## Leadership & Moderation

### Leader Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Space Settings                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [General] [Members] [Moderation] [Analytics] [Tools] [Danger]  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Analytics (Last 7 Days)                                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Messages: 342  │  Active Members: 89  │  New Joins: 12     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Messages Over Time                       ││
│  │    📈 [chart showing daily message counts]                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Top Contributors                                                │
│  1. @alice (45 messages)                                        │
│  2. @bob (38 messages)                                          │
│  3. @carol (29 messages)                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Moderation Queue

```
┌─────────────────────────────────────────────────────────────────┐
│  Moderation Queue                              [Settings]        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Flagged Messages (3)                                           │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ @user123: [flagged content preview]                         ││
│  │ Reason: Automated - Potential harassment                    ││
│  │ [Approve] [Delete] [Ban User]                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  Pending Join Requests (5)                                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ @newuser wants to join                                      ││
│  │ "I'm interested in your club!"                              ││
│  │ [Approve] [Deny]                                            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Leader Actions

| Action | Permission | Impact |
|--------|------------|--------|
| Delete message | Mod+ | Removes message |
| Ban user | Admin+ | Prevents access |
| Mute user | Mod+ | Prevents posting |
| Pin message | Mod+ | Highlights message |
| Create announcement | Admin+ | Notifies all members |
| Deploy tool | Admin+ | Adds to sidebar |
| Change settings | Admin+ | Updates space config |
| Delete space | Owner | Permanently removes |

---

## Real-time Infrastructure

### SSE Architecture

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────┐
│  Client  │ ◀── │ SSE Stream   │ ◀── │ Firestore      │ ◀── │  Writer  │
│          │     │ /chat/stream │     │ onSnapshot     │     │          │
└──────────┘     └──────────────┘     └────────────────┘     └──────────┘
```

### Event Types

| Event | Payload | Trigger |
|-------|---------|---------|
| `message:new` | SpaceMessage | New message created |
| `message:update` | SpaceMessage | Message edited |
| `message:delete` | { messageId } | Message deleted |
| `reaction:add` | { messageId, emoji, userId } | Reaction added |
| `typing:start` | { userId } | User starts typing |
| `member:join` | SpaceMember | New member |
| `member:leave` | { userId } | Member left |

### Presence System

```typescript
interface UserPresence {
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastActiveAt: Date;
  currentSpaceId?: string;
  currentBoardId?: string;
}
```

### Connection Management

```
Page Load           ──▶  Open SSE         ──▶  Listen for      ──▶  Update UI
                         Connection            Events

                              │
                              ▼
                         Heartbeat every 30s
                         Reconnect on disconnect
                         Exponential backoff
```

---

## Integration Points

### Spaces ↔ Profiles

```
Profile joins       ──▶  SpaceMember       ──▶  Profile.spaces[]
space                    created                updated

                              │
                              ▼
                         Activity tracked
                         (messageCount, lastActive)
```

### Spaces ↔ HiveLab

```
Leader deploys      ──▶  PlacedTool        ──▶  Tool appears
tool                     created                in sidebar

                              │
                              ▼
                         Members interact
                         State persists per-placement
```

### Spaces ↔ Feed

```
Space post          ──▶  Feed item         ──▶  Appears in
created                  generated              member feeds

                              │
                              ▼
                         Engagement syncs
                         back to space
```

---

## Butterfly Effects at Scale

### At 100 Spaces

**Positive Effects:**
- Campus coverage begins
- Discovery becomes useful
- Cross-space members emerge

**Challenges:**
- Category organization needed
- Quality variance
- Dead space cleanup

**Mitigations:**
- Smart categorization
- Vitality scoring
- Auto-archive dormant spaces

### At 500 Spaces

**Positive Effects:**
- Network effects visible
- Multi-space engagement common
- Template spaces emerge

**Challenges:**
- Discovery overwhelm
- Real-time scale
- Storage costs

**Mitigations:**
- Personalized recommendations
- SSE connection pooling
- Tiered storage

### At 1,000+ Spaces

**Positive Effects:**
- Platform is default
- Self-sustaining ecosystem
- Student-driven growth

**Challenges:**
- Moderation at scale
- Data partitioning needed
- Support burden

**Mitigations:**
- Community moderators
- Sharded Firestore
- Self-service help

### Multi-Campus Effects

```
Space template      ──▶  Shared to         ──▶  Other campuses
created at UB            template library       adopt

                                                     │
                                                     ▼
                                              Best practices
                                              spread organically
```

---

## Winter Launch Checklist

### Must Have (P0)

- [x] Real-time chat working flawlessly
- [x] Board creation and management
- [x] Member management (invite, remove, roles)
- [x] Sidebar with deployed tools
- [ ] Fix typing indicator (switch to presence-based)
- [ ] Real analytics (not mock data)
- [ ] Mobile navigation polish

### Should Have (P1)

- [ ] Unread message indicator
- [ ] Board reordering
- [ ] Per-space notification settings
- [ ] Announcement system
- [ ] Export member list

### Nice to Have (P2)

- [ ] Push notifications
- [ ] Email digests
- [ ] Voice messages
- [ ] Advanced moderation
- [ ] Scheduled messages

### Feature Flags

```typescript
const SPACES_FLAGS = {
  // Core (always on)
  'spaces.real_time_chat': { default: true },
  'spaces.threading': { default: true },
  'spaces.reactions': { default: true },
  'spaces.inline_components': { default: true },

  // Winter Launch
  'spaces.premium_ui': { default: false, targets: ['beta_users'] },
  'spaces.analytics_v2': { default: false, targets: ['space_leaders'] },

  // Flagged Off
  'spaces.voice_messages': { default: false },
  'spaces.scheduled_messages': { default: false },
  'spaces.email_digests': { default: false },
  'spaces.push_notifications': { default: false },
};
```

### Success Criteria

1. Leader can create space, add boards, invite members in **<2 minutes**
2. Chat feels instant (no perceptible lag on send)
3. **100 concurrent messages** in a space doesn't break
4. Mobile experience is **usable** (not just functional)
5. Analytics show **real data** that leaders find valuable

---

## API Reference

### Space CRUD

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces` | GET | List spaces |
| `/api/spaces` | POST | Create space |
| `/api/spaces/{spaceId}` | GET | Get space details |
| `/api/spaces/{spaceId}` | PATCH | Update space |
| `/api/spaces/{spaceId}` | DELETE | Delete space |

### Chat

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/{id}/chat` | GET | Get messages |
| `/api/spaces/{id}/chat` | POST | Send message |
| `/api/spaces/{id}/chat/stream` | GET | SSE real-time |
| `/api/spaces/{id}/chat/{msgId}` | PATCH | Edit message |
| `/api/spaces/{id}/chat/{msgId}` | DELETE | Delete message |
| `/api/spaces/{id}/chat/{msgId}/react` | POST | Add reaction |
| `/api/spaces/{id}/chat/pinned` | GET | Get pinned |

### Members

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/{id}/members` | GET | List members |
| `/api/spaces/{id}/members` | POST | Add member |
| `/api/spaces/{id}/members/{userId}` | PATCH | Update role |
| `/api/spaces/{id}/members/{userId}` | DELETE | Remove member |
| `/api/spaces/{id}/membership` | GET | Current user's membership |

### Discovery

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/spaces/browse-v2` | GET | Browse spaces |
| `/api/spaces/search` | GET | Search spaces |
| `/api/spaces/recommended` | GET | Recommendations |
| `/api/spaces/join-v2` | POST | Join space |
| `/api/spaces/leave` | POST | Leave space |

---

*This document is the source of truth for Spaces specifications. Update when features ship.*
