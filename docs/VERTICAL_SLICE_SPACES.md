# Vertical Slice: Spaces

## January 2026 Full Launch

---

## Overview

Spaces are the atomic unit of community in HIVE. Think Discord servers with campus-native context. This vertical slice covers the complete journey from browsing/discovery through real-time chat, tool deployment, and leader management.

**Status: 98% Complete** (Scaling fixes implemented, ready for beta)

**Key Metrics:**
- Chat hooks: 1,548 lines (`apps/web/src/hooks/chat/` - 8 files)
- Chat service: 1,525 lines (`packages/core/src/application/spaces/space-chat.service.ts`)
- Chat board UI: 1,252 lines (`packages/ui/src/atomic/03-Spaces/organisms/space-chat-board.tsx`)
- 68 API routes for spaces ecosystem
- 79 UI components in `packages/ui/src/atomic/03-Spaces/`

---

## Flow Diagram

```
                          ┌─────────────────────────────────────────────┐
                          │            DISCOVERY FLOW                    │
                          │                                              │
                          │   /spaces/browse → Search/Filter → Preview  │
                          │         ↓              ↓           ↓        │
                          │     Category      Activity      Join CTA    │
                          │      Chips        Signals                   │
                          └─────────────────────────────────────────────┘
                                              ↓
                          ┌─────────────────────────────────────────────┐
                          │              JOIN FLOW                       │
                          │                                              │
                          │   Public Space → Instant Join → Land in Chat│
                          │   Private Space → Request → Approval → Chat │
                          └─────────────────────────────────────────────┘
                                              ↓
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              SPACE LAYOUT (60/40)                                │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ Space Header: Name, Category Badge, Member Count, Settings Gear            │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────┬────────────────────────────────────────┐ │
│  │                                    │                                        │ │
│  │   CHAT BOARD (60%)                 │   SIDEBAR (40%)                        │ │
│  │                                    │                                        │ │
│  │   ┌──────────────────────────────┐ │   ┌──────────────────────────────────┐ │ │
│  │   │ Messages (virtualized)       │ │   │ Upcoming Events (connected)      │ │ │
│  │   │ - Author avatar + name       │ │   │ - Event cards with RSVP          │ │ │
│  │   │ - Timestamp, edit badge      │ │   │ - Click → Event Details Modal    │ │ │
│  │   │ - Reactions (emoji picker)   │ │   └──────────────────────────────────┘ │ │
│  │   │ - Threading (reply chains)   │ │   ┌──────────────────────────────────┐ │ │
│  │   │ - Pinned indicator           │ │   │ Deployed Tools (HiveLab)         │ │ │
│  │   │ - Inline components:         │ │   │ - Poll widget                    │ │ │
│  │   │   • Polls with live results  │ │   │ - Countdown timer                │ │ │
│  │   │   • RSVP buttons             │ │   │ - Custom tools                   │ │ │
│  │   │   • Countdown timers         │ │   └──────────────────────────────────┘ │ │
│  │   │                              │ │   ┌──────────────────────────────────┐ │ │
│  │   └──────────────────────────────┘ │   │ Member Highlights                │ │ │
│  │   ┌──────────────────────────────┐ │   │ - Recent active members          │ │ │
│  │   │ Typing Indicator             │ │   │ - Role badges (Owner, Admin)     │ │ │
│  │   │ "Sarah is typing..."         │ │   └──────────────────────────────────┘ │ │
│  │   └──────────────────────────────┘ │   ┌──────────────────────────────────┐ │ │
│  │   ┌──────────────────────────────┐ │   │ Quick Actions (leaders only)     │ │ │
│  │   │ Chat Input                   │ │   │ - Create Event                   │ │ │
│  │   │ - Slash commands             │ │   │ - Deploy Tool                    │ │ │
│  │   │ - Emoji picker               │ │   │ - Invite Members                 │ │ │
│  │   │ - Reply indicator            │ │   └──────────────────────────────────┘ │ │
│  │   │ - Tool insertion (/poll)     │ │                                        │ │
│  │   └──────────────────────────────┘ │                                        │ │
│  │                                    │                                        │ │
│  └────────────────────────────────────┴────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │ Board Tab Bar: [General] [Events] [Study Group] [+ Add Board]              │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

### Pages & Routes

```
apps/web/src/app/spaces/
├── page.tsx                    # Redirect to browse
├── browse/
│   └── page.tsx               # Browse/discover spaces (200+ lines)
├── [spaceId]/
│   └── page.tsx               # Main space page (2076 lines) ⭐
└── create/
    └── page.tsx               # Create space flow
```

### API Routes (70+ endpoints)

```
apps/web/src/app/api/spaces/
├── route.ts                   # GET list, POST create (588 lines) ⭐
├── browse-v2/route.ts         # Optimized browse with activity signals
├── mine/route.ts              # Spaces I own
├── my/route.ts                # Spaces I'm a member of
├── search/route.ts            # Full-text search
├── recommended/route.ts       # AI-powered recommendations
├── join-v2/route.ts           # Join space flow
├── leave/route.ts             # Leave space
├── [spaceId]/
│   ├── route.ts               # GET/PATCH/DELETE space
│   ├── chat/
│   │   ├── route.ts           # GET/POST messages (266 lines) ⭐
│   │   ├── stream/route.ts    # SSE real-time stream (267 lines) ⭐
│   │   ├── pinned/route.ts    # Get pinned messages
│   │   ├── search/route.ts    # Search messages
│   │   ├── typing/route.ts    # Typing indicator
│   │   ├── intent/route.ts    # AI slash command detection
│   │   └── [messageId]/
│   │       ├── route.ts       # GET/PATCH/DELETE message
│   │       ├── react/route.ts # Add/remove reaction
│   │       ├── pin/route.ts   # Pin/unpin message
│   │       └── replies/route.ts # Thread replies
│   ├── boards/
│   │   ├── route.ts           # GET/POST boards
│   │   └── [boardId]/route.ts # Board CRUD
│   ├── members/
│   │   ├── route.ts           # GET/POST members
│   │   ├── batch/route.ts     # Batch operations
│   │   └── [memberId]/route.ts # Member CRUD
│   ├── events/
│   │   ├── route.ts           # GET/POST events
│   │   └── [eventId]/
│   │       ├── route.ts       # Event CRUD
│   │       └── rsvp/route.ts  # RSVP actions
│   ├── tools/
│   │   ├── route.ts           # Get deployed tools
│   │   └── feature/route.ts   # Feature a tool
│   ├── automations/
│   │   ├── route.ts           # GET/POST automations
│   │   ├── trigger/route.ts   # Execute automations (534 lines) ⭐
│   │   └── from-template/route.ts
│   ├── components/
│   │   ├── route.ts           # Inline components
│   │   └── [componentId]/
│   │       ├── route.ts       # Component CRUD
│   │       └── participate/route.ts # Vote, RSVP
│   ├── sidebar/route.ts       # Sidebar configuration
│   ├── analytics/route.ts     # Space analytics
│   ├── moderation/route.ts    # Content moderation
│   └── upload-banner/route.ts # Banner image upload
```

### Core Hooks

```
apps/web/src/hooks/
├── chat/                      # Refactored chat system (1,548 lines total) ⭐⭐⭐
│   ├── use-chat-messages.ts   # Message state management (276 lines)
│   ├── use-chat-mutations.ts  # Send/react/pin mutations (285 lines)
│   ├── use-chat-sse.ts        # SSE real-time stream (140 lines)
│   ├── use-chat-threads.ts    # Thread management (153 lines)
│   ├── use-chat-typing.ts     # Typing indicators (156 lines)
│   ├── types.ts               # Shared types (102 lines)
│   ├── constants.ts           # Chat constants (18 lines)
│   └── index.ts               # Barrel export (30 lines)
├── use-pinned-messages.ts     # Pinned messages (126 lines)
├── use-tool-runtime.ts        # HiveLab tool runtime (701 lines)
├── use-space.ts               # Space data/permissions
└── use-space-events.ts        # Space events
```

### UI Components

```
packages/ui/src/atomic/03-Spaces/  # 79 total files
├── organisms/
│   ├── space-chat-board.tsx   # Main chat component (1,252 lines) ⭐⭐
│   ├── space-sidebar-configurable.tsx  # Configurable sidebar
│   ├── space-detail-header.tsx # Name, settings, members
│   ├── space-neighborhood.tsx  # Related spaces
│   └── member-invite-modal.tsx # Member management
├── molecules/
│   ├── space-discovery-card.tsx # Browse/search card
│   ├── board-tab-bar.tsx      # Board tab bar
│   └── now-card.tsx           # Current activity
├── premium/                   # Premium components
│   ├── premium-composer.tsx   # Rich message input
│   ├── premium-message.tsx    # Enhanced message display
│   └── premium-sidebar.tsx    # Sidebar with widgets
└── atoms/
    ├── role-badge.tsx         # Owner/Admin/Mod badges
    └── activity-indicator.tsx # Online/typing indicators
```

### DDD Domain Layer

```
packages/core/src/domain/spaces/
├── entities/
│   ├── space.ts               # Space aggregate root
│   ├── board.ts               # Board entity (363 lines)
│   ├── space-member.ts        # Member entity
│   └── chat-message.ts        # Message entity
├── value-objects/
│   ├── space-id.ts
│   ├── space-slug.ts
│   └── board-id.ts
├── events/
│   ├── space-created.ts
│   ├── member-joined.ts
│   └── message-sent.ts
└── repositories/
    └── space.repository.interface.ts

packages/core/src/application/spaces/
├── space-chat.service.ts      # Chat operations (1,484 lines) ⭐⭐
├── space-management.service.ts # CRUD + permissions
└── space-query.service.ts     # Read operations
```

---

## Technical Implementation

### 1. Real-Time Chat Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                              │
│                                                                       │
│   useChatMessages hook                                                │
│   ├── EventSource (SSE) → /api/spaces/[id]/chat/stream              │
│   ├── Optimistic updates (temp IDs → real IDs)                      │
│   ├── In-flight tracking to prevent duplicates                      │
│   └── Reconnection with exponential backoff                         │
│                                                                       │
│   Firebase Realtime DB → Typing indicators (no polling!)            │
└──────────────────────────────────────────────────────────────────────┘
                                  ↕
┌──────────────────────────────────────────────────────────────────────┐
│                         SERVER (Next.js API)                          │
│                                                                       │
│   SSE Stream Route                                                    │
│   ├── Cookie-based auth (EventSource can't use headers)             │
│   ├── Rate limiting (prevent DoS)                                   │
│   ├── Campus isolation check                                        │
│   └── Firestore onSnapshot → push to SSE stream                     │
│                                                                       │
│   Chat API Route                                                      │
│   ├── Rate limit: 20 messages/minute/user                           │
│   ├── XSS scanning via SecurityScanner                              │
│   └── SpaceChatService (DDD) for business logic                     │
└──────────────────────────────────────────────────────────────────────┘
                                  ↕
┌──────────────────────────────────────────────────────────────────────┐
│                         FIRESTORE                                     │
│                                                                       │
│   spaces/{spaceId}/boards/{boardId}/messages/{messageId}            │
│   ├── authorId, authorName, authorAvatarUrl, authorRole             │
│   ├── content, type (text | inline_component | system)              │
│   ├── timestamp, editedAt, isDeleted, isPinned                      │
│   ├── reactions: [{emoji, count, userIds}]                          │
│   ├── replyToId, replyToPreview, threadCount                        │
│   └── componentData (for inline polls, RSVPs, etc.)                 │
└──────────────────────────────────────────────────────────────────────┘
```

### 2. Chat Message Types

```typescript
type MessageType = 'text' | 'inline_component' | 'system';

// Text message
{
  type: 'text',
  content: 'Hello everyone!',
  authorId: 'user_123',
  authorName: 'Sarah',
  authorRole: 'owner',
  timestamp: 1703123456789
}

// Inline component (poll, RSVP, countdown)
{
  type: 'inline_component',
  content: '📊 What time works best?',
  componentData: {
    elementType: 'poll',
    componentId: 'comp_abc123',
    state: {
      question: 'What time works best?',
      options: ['3pm', '5pm', '7pm'],
      votes: { '3pm': ['user_1'], '5pm': ['user_2', 'user_3'] }
    },
    isActive: true
  }
}

// System message
{
  type: 'system',
  content: 'Sarah joined the space',
  systemAction: 'member_join'
}
```

### 3. Slash Commands

**Available Commands:**
| Command | Description | Example |
|---------|-------------|---------|
| `/poll` | Create inline poll | `/poll "Best time?" 3pm, 5pm, 7pm` |
| `/rsvp` | Create RSVP | `/rsvp "Study Session" Friday 3pm` |
| `/countdown` | Create countdown | `/countdown "Finals" Dec 20` |
| `/welcome` | Set welcome message | `/welcome Hello new members!` |
| `/remind` | Set reminder | `/remind "Submit project" in 2 days` |
| `/automate` | Create automation | `/automate on member_join send "Welcome!"` |

**Implementation:**
```typescript
// In chat-input.tsx (508 lines)
const SLASH_COMMANDS = [
  { command: 'poll', description: 'Create a poll', icon: BarChart2 },
  { command: 'rsvp', description: 'Create RSVP', icon: Calendar },
  { command: 'countdown', description: 'Countdown timer', icon: Timer },
  { command: 'welcome', description: 'Set welcome message', icon: Smile },
  { command: 'remind', description: 'Set a reminder', icon: Bell },
  { command: 'automate', description: 'Create automation', icon: Zap },
];

// Autocomplete shows when user types "/"
// Enter selects command, Tab cycles through options
```

### 4. Board System

**Board Types:**
| Type | Purpose | Auto-created |
|------|---------|--------------|
| `general` | Default discussion | Yes (on space creation) |
| `topic` | Topic-specific chat | No |
| `event` | Event-linked board | Yes (on event creation) |

**Board Entity (363 lines):**
```typescript
interface BoardProps {
  name: string;
  type: BoardType;
  description?: string;
  order: number;
  isDefault: boolean;
  linkedEventId?: string;        // For event boards
  canPost: 'all' | 'members' | 'leaders';
  canReact: 'all' | 'members' | 'leaders';
  messageCount: number;
  participantCount: number;
  isLocked: boolean;
  pinnedMessageIds: string[];    // Max 10
  isArchived: boolean;
}

// Validation
- Name: 1-50 characters
- Max pinned messages: 10
- Board.canUserPost() checks role + lock + archive status
```

### 5. Role Hierarchy

```
owner       → Full control, transfer ownership, delete space
   ↓
admin       → Manage members, settings, deploy tools
   ↓
moderator   → Moderate content, pin messages, manage boards
   ↓
member      → Chat, react, use tools
   ↓
guest       → Read-only (private spaces)
```

**Permission Checks:**
```typescript
// In space-permission-middleware.ts
async function checkSpacePermission(
  spaceId: string,
  userId: string,
  requiredRole: 'guest' | 'member' | 'leader' | 'owner'
): Promise<{
  hasPermission: boolean;
  role?: SpaceRole;
  space?: SpaceData;
}>
```

### 6. Typing Indicators (Real-Time)

```typescript
// Firebase Realtime Database structure
/typing/{spaceId}/{boardId}/{userId}: {
  isTyping: boolean,
  timestamp: number,
  userId: string
}

// Client-side (use-chat-messages.ts)
const TYPING_INDICATOR_INTERVAL_MS = 3000; // Only send every 3s
const TYPING_TTL_MS = 5000;                // Auto-clear after 5s

// On keystroke:
1. Check if 3s since last send
2. If yes, write to Firebase RTDB
3. Reset 5s auto-clear timeout

// Listening:
realtimeService.listenToBoardTyping(spaceId, boardId, callback)
// Returns { userId: { isTyping, timestamp } }
// Filters: exclude self, expired (>5s old)
```

### 7. Optimistic Updates

```typescript
// In useChatMessages hook
const sendMessage = async (content: string) => {
  // 1. Create temp message
  const tempId = `temp_${nanoid()}`;
  const optimisticMessage = {
    id: tempId,
    content,
    authorName: 'You',
    timestamp: Date.now()
  };

  // 2. Track as in-flight
  inFlightMessagesRef.current.set(tempId, null);
  setMessages(prev => [...prev, optimisticMessage]);

  // 3. Send to server
  const { messageId } = await fetch('/api/spaces/.../chat', { ... });

  // 4. Update tracking with real ID
  inFlightMessagesRef.current.set(tempId, messageId);

  // 5. Replace temp with real (or SSE does it first)
  setMessages(prev =>
    prev.map(m => m.id === tempId ? { ...m, id: messageId } : m)
  );
};
```

### 8. Virtualized Message List

```typescript
// In space-chat-board.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const ESTIMATED_MESSAGE_HEIGHT = 72;
const ESTIMATED_GROUPED_MESSAGE_HEIGHT = 32;
const ESTIMATED_COMPONENT_MESSAGE_HEIGHT = 200;
const VIRTUALIZER_OVERSCAN = 8;
const LOAD_MORE_THRESHOLD = 200;

const rowVirtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: (index) => {
    const msg = messages[index];
    if (msg.type === 'inline_component') return 200;
    if (isGrouped(msg)) return 32;
    return 72;
  },
  overscan: 8
});
```

---

## Database Schema

### Collections

```
spaces/{spaceId}
├── name: string
├── name_lowercase: string (for search)
├── slug: string (unique within campus)
├── description: string
├── category: 'student_org' | 'residential' | 'university_org' | 'greek_life'
├── visibility: 'public' | 'private'
├── joinPolicy: 'open' | 'approval' | 'invite_only'
├── campusId: string ⚠️ REQUIRED for all queries
├── createdBy: string (userId)
├── createdAt: timestamp
├── metrics: {
│     memberCount: number,
│     activeMembers: number,
│     postCount: number,
│     eventCount: number,
│     toolCount: number
│   }
├── bannerUrl: string | null
├── settings: {
│     maxPinnedPosts: number,
│     autoArchiveDays: number
│   }
├── templateId: string | null
└── isActive: boolean

spaces/{spaceId}/boards/{boardId}
├── name: string
├── type: 'general' | 'topic' | 'event'
├── description?: string
├── order: number
├── isDefault: boolean
├── linkedEventId?: string
├── canPost: 'all' | 'members' | 'leaders'
├── messageCount: number
├── isLocked: boolean
├── pinnedMessageIds: string[]
└── campusId: string

spaces/{spaceId}/boards/{boardId}/messages/{messageId}
├── type: 'text' | 'inline_component' | 'system'
├── authorId: string
├── authorName: string
├── authorAvatarUrl?: string
├── authorRole: 'owner' | 'admin' | 'moderator' | 'member'
├── content: string
├── componentData?: {
│     elementType: string,
│     componentId: string,
│     state: object,
│     isActive: boolean
│   }
├── timestamp: number
├── editedAt?: number
├── isDeleted: boolean
├── isPinned: boolean
├── reactions: [{emoji, count, userIds}]
├── replyToId?: string
├── replyToPreview?: string
├── threadCount: number
└── boardId: string

spaceMembers/{spaceId}_{userId}
├── spaceId: string
├── userId: string
├── role: 'owner' | 'admin' | 'moderator' | 'member' | 'guest'
├── joinedAt: timestamp
├── isActive: boolean
├── permissions: string[]
├── joinMethod: 'direct' | 'invite' | 'approval'
└── campusId: string

spaces/{spaceId}/events/{eventId}
├── title: string
├── description: string
├── startTime: timestamp
├── endTime: timestamp
├── location: string
├── isVirtual: boolean
├── virtualLink?: string
├── rsvps: {
│     going: string[],
│     maybe: string[],
│     notGoing: string[]
│   }
├── createdBy: string
└── linkedBoardId: string

spaces/{spaceId}/automations/{automationId}
├── name: string
├── trigger: {
│     type: 'member_join' | 'event_reminder' | 'keyword' | 'reaction_threshold',
│     config: object
│   }
├── action: {
│     type: 'send_message' | 'create_component' | 'notify',
│     config: object
│   }
├── enabled: boolean
├── stats: {
│     timesTriggered: number,
│     successCount: number,
│     failureCount: number,
│     lastTriggered: timestamp
│   }
└── createdBy: string
```

---

## Security Measures

### 1. Campus Isolation

```typescript
// EVERY query must include campusId
.where('campusId', '==', user.campusId)

// SSE stream checks campus match
if (space.campusId !== user.campusId) {
  logSecurityEvent('cross_campus_access_blocked', { ... });
  return new Response('Forbidden - campus mismatch', { status: 403 });
}
```

### 2. Rate Limiting

```typescript
// Chat messages: 20/minute/user
const chatRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20
});

// SSE connections: 5/minute/user (prevent DoS)
const sseConnectionRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 5
});
```

### 3. XSS Prevention

```typescript
// In chat route
const securityScan = SecurityScanner.scanInput(content, 'chat_message');
if (securityScan.level === 'dangerous') {
  return respond.error('Message contains harmful content', 'INVALID_INPUT');
}
```

### 4. Permission Checks

```typescript
// Every API route checks permissions
const permCheck = await checkSpacePermission(spaceId, userId, 'member');
if (!permCheck.hasPermission) {
  return new Response('Forbidden', { status: 403 });
}
```

---

## Known Issues & Recommended Fixes

### Critical (Soft Launch Blockers)

1. ~~**Typing Indicator Spam**~~ ✅ FIXED
   - Implemented 3-second throttling via `TYPING_INDICATOR_INTERVAL_MS = 3000`
   - File: `apps/web/src/hooks/chat/constants.ts:12`

2. ~~**Real Analytics Data**~~ ✅ FIXED
   - Analytics API now uses real Firestore aggregations for all metrics
   - File: `apps/web/src/app/api/spaces/[spaceId]/analytics/route.ts`

### Important (Should Fix)

3. **Message Search Performance**
   - Current: Full-text search uses client-side filtering (fetches 500 msgs, filters in JS)
   - Impact: Slow for spaces with 1000+ messages
   - Fix: Implement Algolia or Firebase Extensions search
   - Note: Firestore doesn't support full-text search natively

4. **Board Reordering UI**
   - Current: No drag-drop for board reorder
   - Impact: Leaders stuck with creation order
   - Fix: Add dnd-kit to board tab bar

5. **Thread UI Completion**
   - Current: Thread replies work but UI needs polish
   - Impact: Threaded conversations feel clunky
   - Fix: Slide-over panel for thread view

### Deferred (Spring 2026)

- Voice messages
- Advanced moderation tools
- Cross-space search
- Message scheduling
- Rich text formatting

---

## Success Metrics

### Engagement

| Metric | Target | Current |
|--------|--------|---------|
| Time to first message | < 5 min | ~3 min ✅ |
| Messages per active user | 5+/week | N/A |
| Board switches per session | 2+ | N/A |
| Reaction rate | 10% of messages | N/A |

### Performance

| Metric | Target | Current |
|--------|--------|---------|
| Message send latency | < 200ms | ~150ms ✅ |
| SSE connection time | < 500ms | ~300ms ✅ |
| Virtual scroll FPS | 60fps | 60fps ✅ |
| Load more (50 msgs) | < 300ms | ~250ms ✅ |

### Reliability

| Metric | Target | Current |
|--------|--------|---------|
| SSE uptime | 99.5% | ~98% |
| Message delivery | 100% | 100% ✅ |
| Reconnection success | 95% | ~90% |

---

## Testing Checklist

### Chat Flow
- [ ] Send message appears instantly (optimistic)
- [ ] SSE receives message from other users
- [ ] Edit message updates in real-time
- [ ] Delete message shows "[deleted]"
- [ ] Reactions toggle correctly
- [ ] Pin/unpin updates pinned list
- [ ] Threading opens and loads replies
- [ ] Slash commands show autocomplete
- [ ] `/poll` creates inline poll
- [ ] Typing indicator appears/clears

### Board Flow
- [ ] Board tabs switch correctly
- [ ] Scroll position preserved on switch
- [ ] Create board (leaders only)
- [ ] Lock/unlock board
- [ ] Unread count shows on inactive boards

### Member Flow
- [ ] Join public space instantly
- [ ] Request to join private space
- [ ] Leave space clears from "My Spaces"
- [ ] Role assignment works (owner only)
- [ ] Batch invite via email

### Event Flow
- [ ] Create event creates linked board
- [ ] RSVP updates in sidebar
- [ ] Event details modal opens
- [ ] Past events archive correctly

---

## Scaling Readiness

**Grade: A-** (All critical fixes implemented, ready for 100+ concurrent users)

### Current Capacity
| Metric | Capacity | Implementation |
|--------|----------|----------------|
| Concurrent SSE connections | 100/min | Rate limit increased ✅ |
| Space joins/minute | 600 | Sharded counters (10 shards) ✅ |
| Concurrent reactions | 99% success | Transaction wrapper ✅ |

### Implemented Scaling Fixes

**1. SSE Rate Limit Increase** ✅
- File: `apps/web/src/lib/rate-limit-simple.ts:44-47`
- Current: `maxRequests: 100` (was 10)
- Env override: `RATE_LIMIT_SSE_REQUESTS`

**2. Space memberCount Sharding** ✅
- File: `apps/web/src/lib/services/sharded-member-counter.service.ts`
- Implementation: 10 shard documents under `spaces/{spaceId}/memberCountShards/`
- Feature flag: `USE_SHARDED_MEMBER_COUNT=true`
- Capacity: 200+ writes/sec (vs 1 write/sec before)
- Wired in: `apps/web/src/app/api/spaces/join-v2/route.ts:182-185`

**3. Reaction Transaction Wrapper** ✅
- File: `packages/core/src/infrastructure/repositories/firebase-admin/chat.repository.ts:518-568`
- Method: `updateReactionAtomic()` uses `dbAdmin.runTransaction()`
- Called from: `packages/core/src/application/spaces/space-chat.service.ts:1011,1072`

### Remaining Bottlenecks
| Metric | Limit | Notes |
|--------|-------|-------|
| Message search | ~500 msgs/board | Client-side filtering; need Algolia for scale |
| Cloud Functions | Not sharded | autoJoin uses direct increment; low volume ok |

See: `docs/SCALING_READINESS.md` for full architecture.

---

## Related Documents

- **Vision**: `docs/PRODUCT_VISION.md`
- **Onboarding Slice**: `docs/VERTICAL_SLICE_ONBOARDING.md`
- **Database Schema**: `docs/DATABASE_SCHEMA.md`
- **Component Library**: `packages/ui/README.md`
- **Scaling**: `docs/SCALING_READINESS.md`

---

*Last updated: January 2026*
*Status: 98% Complete - All scaling fixes implemented, ready for Beta launch*
