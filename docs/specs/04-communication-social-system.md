# 04 - Communication & Social System

How students talk to each other and form connections. Chat within spaces, direct messaging, social graph, presence/social proof, and safety/moderation.

**Decision filter**: Does this help a student find their people, join something real, and come back tomorrow?

**Who this serves**: A shy freshman too scared to post in a 200-person GroupMe. A leader broadcasting announcements. Two students who met at an event. An international student who communicates better in writing. A commuter who has 45 minutes between classes. Students who just want to feel campus is alive.

---

## Table of Contents

1. [Space Chat & Boards](#1-space-chat--boards)
2. [Direct Messaging](#2-direct-messaging)
3. [Social Graph & Connections](#3-social-graph--connections)
4. [Presence & Social Proof](#4-presence--social-proof)
5. [Safety & Moderation](#5-safety--moderation)
6. [Cross-System Dependencies](#6-cross-system-dependencies)

---

## 1. Space Chat & Boards

### Strategic Position

HIVE chat complements GroupMe and Discord. It does not compete. GroupMe is where students coordinate plans at midnight. Discord is where gamers build sprawling servers. HIVE chat is where organized communities have structured conversations attached to the thing they're actually doing.

The differentiator: every chat message lives inside a space that has events, posts, tools, and members. Context is never lost. A poll in chat links to an event RSVP. A question in the announcements board links to a thread. GroupMe is a river of text with no memory. HIVE chat has memory, structure, and purpose.

### Existing Code Assessment

The codebase has a solid foundation:

- **Board entity** (`packages/core/src/domain/spaces/entities/board.ts`): Discord-like channel model with types (`general`, `topic`, `event`), permissions (`all`, `members`, `leaders`), locking, archiving, pinning (max 10). Well-structured DDD entity.
- **ChatMessage entity** (`packages/core/src/domain/spaces/entities/chat-message.ts`): Three message types (`text`, `inline_component`, `system`), reactions with user tracking, threading via `replyToId`/`threadCount`, edit/delete/pin support. 4000-char limit. Solid.
- **InlineComponent entity** (`packages/core/src/domain/spaces/entities/inline-component.ts`): Polls, countdowns, RSVPs, and custom HiveLab components embedded in chat. Hybrid state model with participant subcollections and atomic aggregations. This is HIVE's chat superpower.
- **SpaceChatBoard** (`packages/ui/src/design-system/components/spaces/SpaceChatBoard.tsx`): Full-featured UI with drag-drop board tabs, slash commands (`/poll`, `/event`, `/countdown`, `/welcome`, `/remind`, `/automate`), tool insertion toolbar. Uses TheaterChatBoard internally.
- **TheaterChatBoard** (`packages/ui/src/design-system/components/spaces/TheaterChatBoard.tsx`): Virtualized message list via `@tanstack/react-virtual`, date separators, author grouping (5-min window), inline component rendering, typing indicator, scroll-to-bottom button, skeleton loading. Production-ready.
- **ChatRowMessage** (`packages/ui/src/design-system/components/spaces/ChatRowMessage.tsx`): Full-width rows (not bubbles), gold left border for threads/reactions, hover action bar (quick react, reply, more), role badges, deleted state. Clean Discord-inspired design.
- **ChatSearchModal** (`packages/ui/src/design-system/components/spaces/ChatSearchModal.tsx`): Board-filtered search, highlight matches, jump-to-message, keyboard hints. Complete.
- **API routes**: Full CRUD (`apps/web/src/app/api/spaces/[spaceId]/chat/`): message list/send, SSE real-time stream, typing indicators, search, pinned messages, per-message operations (edit, delete, pin, react, replies). Rate limiting (20/min), XSS scanning, @mention notifications, keyword automations.
- **Unread tracking** (`apps/web/src/hooks/use-unread-count.ts`): Per-board real-time unread counts via Firestore `onSnapshot`, cross-device sync via `userBoardReads` collection, mark-as-read. Supports space-level aggregation.

**Gaps identified**:
- No `announcements` board type (leaders-only posting is supported via permissions but not surfaced as a first-class type)
- No ephemeral/temporary boards
- Threading is flat (reply-to, not nested threads)
- No AI features in chat (summarization, translation, smart compose)
- No read receipts for individual messages
- No message formatting (markdown, links, embeds)
- No file/image attachments in the UI (schema supports attachments)
- No "since you left" catch-up experience beyond unread count

### User Stories

**The shy freshman** joins a 20-person photography club. The general board feels small and safe. They react with an emoji to someone's photo. They never post, but they vote in a poll about meeting times. They feel included without performing.

**The club president** manages a 200-person engineering org. They create an announcements board with leader-only posting. They use `/poll` to vote on a guest speaker. They pin the event details. The general board stays social. The announcements board stays clean.

**The international student** reads messages in a philosophy club. AI offers to translate a discussion thread. They respond in English with smart compose helping with idioms. They feel confident contributing.

**The commuter** checks the board during their 45-minute gap between classes. "Since you left" shows them the 8 messages they missed, with an AI summary: "3 people confirmed for Thursday, Sarah shared the agenda." They're caught up in 10 seconds.

### Board Types

| Type | Post Permission | Use Case | Auto-created |
|------|----------------|----------|--------------|
| `general` | All members | Default conversation. Every space gets one. | Yes (on space creation) |
| `announcements` | Leaders only | Broadcasts. Members can react and thread-reply but not top-level post. | Yes (spaces > 50 members) |
| `topic` | All members | Topic-specific channels created by leaders. | No |
| `event` | All members | Auto-created for events, archived when event ends. | Yes (on event creation) |
| `ephemeral` | All members | Temporary boards that auto-archive after a set duration (e.g., "exam week study group"). | No |

**Board limits**: Max 15 boards per space. Leaders can reorder via drag-drop (existing). Default board cannot be deleted.

### Message Features

**Text messages** (existing, extend):
- Markdown subset: bold, italic, strikethrough, inline code, links. No headers, no blockquotes (chat is not a document).
- @mentions with autocomplete from space member list (existing: regex parsing; extend: live autocomplete UI)
- Link previews: unfurl URLs into title + description + image card. Lazy-load, cache aggressively.
- Max 4000 chars (existing)

**Rich media** (new):
- Image attachments: up to 5 per message, compressed on upload, AVIF/WebP, blur placeholder, lightbox view
- File attachments: PDFs, docs, up to 10MB. Virus scan on upload.
- No video or audio attachments. Students can share links to YouTube/TikTok which unfurl.

**Reactions** (existing, extend):
- Quick-react bar: first 3 most-used emoji for this board (replace static `['thumbs up', 'heart', 'laugh']`)
- Full emoji picker behind "+" button
- Reaction summary: "Sarah, Alex, and 4 others reacted with thumbs up"

**Threading** (existing, extend):
- Reply-to creates a thread indicator (existing gold border + count)
- Thread view: slide-over panel showing the parent message and all replies
- Thread replies also appear inline with a "replied to [name]" context line
- No nested threads. Flat is fine for campus chat.

**Pinned messages** (existing):
- Max 10 per board (existing)
- Pinned messages sidebar/drawer accessible from board header

### Inline Components (The HIVE Superpower)

This is what makes HIVE chat different from everything else. Polls, RSVPs, countdowns, and custom HiveLab tools live directly in the message flow.

**Existing inline components** (all functional):
- Quick Poll: question + options, single/multi-select, results visibility, close date
- RSVP: linked to events, yes/no/maybe, capacity limits
- Countdown: target date timer
- Custom: any deployed HiveLab tool

**Extend with**:
- **Question box**: Leader posts a question, members submit answers, leader selects best answer. Good for Q&A before guest speakers.
- **Availability grid**: "When can you meet?" with time slots. Replaces when2meet for small groups.
- **Link collection**: "Share your favorite resources on [topic]" - each member adds one link, deduped, sorted by votes.

All inline components use the existing hybrid state model: individual votes in participant subcollection, aggregated counts updated atomically, real-time sync via SSE + version increment.

### AI in Chat

AI is ambient. Students should not feel like they're "using AI" - they should feel like the chat is smart.

**Catch-up summary** (new):
When a student opens a board with 10+ unread messages, offer a 2-sentence summary above the unread divider. "The team discussed logo options and narrowed to 3 finalists. Meeting moved to Thursday 4pm." Generated server-side, cached per board per time window, streaming.

- Trigger: 10+ unread messages in a board
- Latency: < 2s (cached) or streaming (first generate)
- UI: Collapsible card above the "X new messages" divider. "What you missed" header. Dismiss permanently or expand to see messages.
- No hallucinations: summary only references actual message content. If uncertain, say "Members discussed several topics."

**Smart compose** (new):
Subtle inline suggestions as the student types. Not autocomplete - tone assistance.
- Grammar correction (non-intrusive, gray underline)
- Tone check: if a message reads as aggressive, offer a softer alternative. "Did you mean: 'Could you clarify?' instead of 'That makes no sense'"
- Emoji suggestion: after "that's great" suggest relevant emoji
- Opt-in per user. Off by default.
- Latency: < 500ms for inline suggestions

**Translation** (new):
- Auto-detect non-English messages and offer "View in English" inline toggle
- Student's compose can offer "Translate to English" before sending
- No automatic translation - always student-initiated
- Use language model, not translation API, for more natural results

### Real-Time Architecture

**Existing**: SSE endpoint (`/api/spaces/[spaceId]/chat/stream`) with Firestore `onSnapshot` for messages and inline component updates. Heartbeat every 30s. Rate-limited SSE connections.

**Extend**:
- Typing indicators: existing endpoint, extend to SSE stream (currently polled). Include typing user info in SSE events.
- Read receipts: OFF by default (privacy standards). Opt-in per user. When enabled, show "Seen by 3" on own messages. Never show names unless < 5 viewers and all opted in.
- Presence: "X online" count at board level (existing UI element). Backed by lightweight heartbeat doc per user per space.

**Performance targets**:
- Message delivery: < 200ms from send to appear on other clients (SSE)
- Typing indicator: < 300ms latency
- History load: < 300ms for 50 messages (p95)
- Search: < 500ms for results

### Data Model

**Board** (existing Firestore subcollection: `spaces/{spaceId}/boards/{boardId}`):
```
{
  name: string
  type: 'general' | 'announcements' | 'topic' | 'event' | 'ephemeral'
  description?: string
  order: number
  isDefault: boolean
  linkedEventId?: string
  canPost: 'all' | 'members' | 'leaders'
  canReact: 'all' | 'members' | 'leaders'
  messageCount: number
  participantCount: number
  createdBy: string
  createdAt: Timestamp
  lastActivityAt?: Timestamp
  isArchived: boolean
  isLocked: boolean
  pinnedMessageIds: string[] (max 10)
  // NEW
  ephemeralExpiresAt?: Timestamp
  aiSummaryCache?: { text: string, generatedAt: Timestamp, messageRange: [string, string] }
}
```

**ChatMessage** (existing subcollection: `spaces/{spaceId}/boards/{boardId}/messages/{messageId}`):
```
{
  boardId: string
  spaceId: string
  authorId: string
  authorName: string
  authorAvatarUrl?: string
  authorRole?: string
  type: 'text' | 'inline_component' | 'system'
  content: string
  componentData?: InlineComponentData
  systemAction?: string
  systemMeta?: Record<string, unknown>
  timestamp: number
  editedAt?: number
  reactions: [{ emoji: string, count: number, userIds: string[] }]
  replyToId?: string
  replyToPreview?: string
  threadCount: number
  isDeleted: boolean
  isPinned: boolean
  // NEW
  attachments?: [{ url: string, filename: string, mimeType: string, size: number, thumbnailUrl?: string }]
  mentions?: string[] // user IDs for indexed querying
  linkPreviews?: [{ url: string, title: string, description?: string, imageUrl?: string }]
  language?: string // detected language for translation
}
```

### API Contracts

All existing routes remain. New additions:

```
GET  /api/spaces/[spaceId]/chat/summary?boardId=xxx&since=timestamp
  → { summary: string, messageCount: number, topContributors: string[] }

POST /api/spaces/[spaceId]/chat/translate
  → { messageId: string, targetLang: string }
  ← { translation: string }

GET  /api/spaces/[spaceId]/chat/pinned?boardId=xxx
  → { messages: ChatMessage[] } (existing)

POST /api/spaces/[spaceId]/boards
  → { name: string, type: BoardType, description?: string }
  ← { board: Board } (existing)
```

### Acceptance Criteria

- [ ] All existing chat functionality works (messages, reactions, threads, pins, search, inline components, typing, SSE stream)
- [ ] Announcements board type: leaders can post, members can react/thread-reply only
- [ ] Ephemeral boards auto-archive after expiry
- [ ] AI catch-up summary appears for 10+ unread messages, < 2s latency
- [ ] @mention autocomplete from space member list
- [ ] Image attachments render inline with blur placeholder
- [ ] Link previews unfurl asynchronously
- [ ] Smart compose suggestions (opt-in, off by default)
- [ ] Translation offered for non-English messages
- [ ] Works for a 20-person club and a 200-person org without performance degradation

---

## 2. Direct Messaging

### The Case for DMs

HIVE needs DMs. Without them, students complete their connection loop off-platform. Two students meet at a space event, want to talk one-on-one, and open Instagram DMs. Once they're on Instagram, they don't come back to HIVE. The connection was made on HIVE, but the relationship lives elsewhere.

DMs are the bridge between group participation (spaces) and personal connection. They complete the social loop: discover a space, join, participate, connect with someone, message them directly, form a friendship, come back to the space together.

**But DMs are dangerous.** They're the #1 vector for harassment on every platform. Anonymous DMs are a nightmare. Unsolicited DMs from strangers are a nightmare. HIVE's DM system must be safe-by-default.

### Existing Code Assessment

DMs are partially implemented behind the `enable_dms` feature flag:

- **Feature flag**: `ENABLE_DMS` in `use-feature-flags.ts`, server-side check via `isDMsEnabled()`. Currently gated.
- **Conversations API** (`/api/dm/conversations/`): List conversations, create/get conversation with deterministic ID (`dm_${sorted_ids}`). Participant data embedded. Campus-scoped.
- **Messages API** (`/api/dm/conversations/[conversationId]/messages/`): Send/list messages, cursor pagination, mark-as-read (resets unread count). 4000 char limit. Text only.
- **SSE stream**: `/api/dm/conversations/[conversationId]/stream/` exists (found via glob).
- **Data model**: `dm_conversations` collection with `participantIds`, `participants` (embedded), `lastMessage` preview, `readState` per participant (lastReadAt, unreadCount).

**What's missing**:
- No block check before creating conversations (critical safety gap)
- No message moderation/scanning
- No typing indicators for DMs
- No media support
- No conversation deletion/muting
- No connection-gating (anyone on campus can DM anyone)
- No UI components in the design system

### DM Safety Model

The fundamental rule: **DMs should feel like exchanging numbers, not getting a cold call.**

**Who can message whom**:

| Relationship | Can initiate DM? | Notes |
|---|---|---|
| Friends (mutual connection) | Yes | No restrictions |
| Share a space (both members) | Yes | Only while both are members |
| No connection, no shared space | No | Must connect first |
| Blocked | No | Cannot even see each other exists |

This means a student must either be friends with someone OR share a space to send a DM. This eliminates cold-message harassment while enabling natural connections.

**Message requests** (for non-friend, shared-space DMs):
When a non-friend space member initiates a DM, the recipient gets a "message request" - they see the message preview and the shared space context, and can accept or decline. Declining does not notify the sender (no retaliation risk). Accepted requests create a normal conversation.

### User Stories

**Two students who met at an event**: After a coding workshop, Alex wants to ask Jamie about a project. They share the engineering space. Alex opens Jamie's profile, taps "Message." Jamie gets a message request: "Alex from UB Engineering wants to message you." Jamie accepts. They plan a study session.

**The shy freshman**: Gets a message request from someone in their bio club. Sees the shared space context. Decides not to respond. Nothing happens. No guilt, no notification to the sender, no trace.

**The leader**: Sends a DM to a new member who seems lost. "Hey, saw you joined the art club - the next open studio is Thursday, come check it out!" Personal touch, not broadcast.

**Safety scenario**: A student gets an unwanted DM. One tap to block. The conversation disappears from both sides. The blocked user cannot see the blocker's profile, spaces, or activity. No trace they exist.

### Data Model

**dm_conversations** (existing, extend):
```
{
  id: string (deterministic: dm_{sorted_ids})
  participantIds: string[] (sorted, for indexing)
  participants: Record<userId, { name, handle, avatarUrl }>
  lastMessage?: { content: string (100 char preview), senderId: string, timestamp: Timestamp }
  readState: Record<userId, { lastReadAt: Timestamp, unreadCount: number }>
  campusId: string
  createdAt: Timestamp
  updatedAt: Timestamp
  // NEW
  status: 'active' | 'request_pending' | 'declined' | 'blocked'
  requestedBy?: string // who initiated (for message request flow)
  acceptedAt?: Timestamp
  mutedBy?: string[] // users who muted this conversation
  isArchived?: Record<userId, boolean> // per-user archive state
}
```

**dm_messages** (existing subcollection: `dm_conversations/{conversationId}/messages/{messageId}`):
```
{
  senderId: string
  senderName: string
  senderHandle: string
  senderAvatarUrl?: string
  content: string (max 4000)
  type: 'text'
  timestamp: Timestamp
  isDeleted: boolean
  // NEW
  moderationFlags?: { autoFlagged: boolean, reason?: string, severity?: string }
}
```

### API Contracts

**Existing routes** (extend with safety):

```
GET  /api/dm/conversations
  → Add: filter by status (active, requests)
  → Add: block check on listed conversations

POST /api/dm/conversations
  → Add: block check before creation
  → Add: shared-space or friend verification
  → Add: message request flow for non-friends
  → Body: { recipientId: string, message?: string }

GET  /api/dm/conversations/[conversationId]/messages
  → Existing (works)

POST /api/dm/conversations/[conversationId]/messages
  → Add: content moderation scan before delivery
  → Add: block check before send
```

**New routes**:

```
POST /api/dm/conversations/[conversationId]/accept
  → Accept a message request. Changes status to 'active'.

POST /api/dm/conversations/[conversationId]/decline
  → Decline a message request. Changes status to 'declined'. Silent.

POST /api/dm/conversations/[conversationId]/mute
  → Mute/unmute notifications for this conversation.

POST /api/dm/conversations/[conversationId]/archive
  → Archive conversation (hides from list, keeps data).

DELETE /api/dm/conversations/[conversationId]
  → Delete conversation for requesting user only (other user keeps their copy).
```

### Rollout Strategy

1. **Phase 1**: Friends-only DMs. Feature flag `enable_dms` stays on, but only mutual friends can DM. Smallest blast radius.
2. **Phase 2**: Space-member DMs with message requests. Expand to shared-space members with the request flow.
3. **Phase 3**: Full DMs with connection-gating. Any connected user can DM.

Each phase runs for 2 weeks minimum with safety metrics monitored: block rate, report rate, message request decline rate.

### Acceptance Criteria

- [ ] Feature flag `enable_dms` controls access (existing)
- [ ] Block check prevents conversation creation and message sending
- [ ] Message request flow for non-friend space members
- [ ] One-tap block from conversation view
- [ ] Mute and archive per conversation
- [ ] Content moderation scan on all DM messages
- [ ] Typing indicator in DM conversations
- [ ] Unread count badge on DM icon in navigation
- [ ] Delete conversation for self (other user retains their copy)
- [ ] No DM to strangers (must share space or be friends)

---

## 3. Social Graph & Connections

### Model: Hybrid Follow + Friend

HIVE uses a hybrid model. Not pure follow (too parasocial for campus), not pure friend (too high-friction for discovery).

**Follow**: One-directional. Low commitment. "I want to see what this person does." No notification beyond "X followed you." Public by default but hideable.

**Friend**: Bidirectional. Requires acceptance. "We know each other." Unlocks DMs, shared activity visibility, and "people you might know" signals. Private by default.

**Space-based connection**: Implicit. Sharing a space creates ambient connection. No action required. Fuels "people in your orbit" suggestions.

### Existing Code Assessment

Connections are implemented:

- **Connections API** (`/api/connections`): Full CRUD. Connection types: `friend`, `following`, `follower`, `pending`, `blocked`. Bidirectional query (both `profileId1` and `profileId2`). Stats (total, friends, following, followers, pending). Mutual spaces tracked.
- **Friends API** (`/api/friends`): Friend-specific operations. Send request, accept/reject, unfriend. Pending request management (received + sent). Connection count updates on accept/unfriend.
- **Follow API** (`/api/profile/[userId]/follow`): Follow/unfollow (found via grep).
- **Feature flag**: `ENABLE_CONNECTIONS` exists but not currently gated in the connections API.
- **Data model**: `connections` collection with deterministic IDs (`conn_{sorted_ids}`), `isActive` flag, `source` tracking, `mutualSpaces`, `interactionCount`.

**What's missing**:
- No "people you might know" suggestions
- No connection strength scoring
- No privacy controls (who can see connections)
- No connection import/discovery from class rosters
- No "people in this space" browsable list with connection status
- Connection count is on `users` collection, not `profiles` (inconsistency)

### Connection Signals

What signals that two students should connect?

| Signal | Weight | Source |
|---|---|---|
| Shared spaces (>= 2) | High | Space membership data |
| Co-attended events (>= 1) | High | RSVP + check-in data |
| Same major | Medium | Profile data |
| Same graduation year | Medium | Profile data |
| Mutual friends (>= 2) | High | Connection graph |
| Same event time patterns | Low | Event attendance timestamps |
| Reacted to each other's messages | Medium | Chat reaction data |

### "People You Might Know"

Algorithm:
1. Get student's spaces, friends, major, year
2. Find other students who share >= 2 spaces with them
3. Score by: shared spaces (3 pts each), mutual friends (2 pts each), same major (2 pts), same year (1 pt), co-events (3 pts each)
4. Filter out: existing connections, blocked users, users they've dismissed
5. Return top 10, refreshed daily

UI: Card carousel on home feed. Each card shows name, photo, shared context ("3 shared spaces, same major"), and a "Connect" button. Dismissable. Never shows "X people viewed your profile" (anti-pattern).

### The Introvert Angle

Not every student wants to actively connect. HIVE must support ambient belonging without forced socialization.

- **Lurk mode**: A student can be in 5 spaces, attend events, read every message, and never follow or friend anyone. That's valid. The product never guilt-trips this behavior.
- **Implicit connection visibility**: "12 students in your major are in this space" doesn't require follow/friend - it's aggregate social proof.
- **No follower counts on profiles**: Connection count exists in the data model but is never shown as a vanity metric. Instead: "Connected" badge, shared spaces list, mutual friends (if > 0).
- **Connection requests are never urgent**: No push notification for friend requests. Appear in a "Requests" tab, never a red badge.

### Privacy Controls

- **Connection visibility**: Default OFF. Students opt-in to showing their connections on their profile.
- **Space membership visibility**: Default to space members only (existing from privacy standards).
- **Activity visibility**: "Last active" never shown by default. Opt-in.
- **Block behavior**: Blocked user cannot see blocker's profile, spaces, events, messages, or activity. Complete invisibility. Block list is private. No "X blocked you" notification.
- **Ghost mode**: Feature flag `ghost_mode` (existing). When enabled, student appears offline everywhere, activity is hidden, no presence signals. Still can use the app normally.

### Data Model

**connections** (existing, extend):
```
{
  connectionId: string (deterministic: conn_{sorted_ids})
  profileId1: string
  profileId2: string
  type: 'friend' | 'following' | 'blocked' | 'pending'
  source: 'friend_request' | 'follow' | 'event_coattendee' | 'space_member' | 'suggested'
  requestedBy?: string
  requestMessage?: string
  acceptedBy?: string
  acceptedAt?: Timestamp
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
  mutualSpaces?: string[]
  interactionCount?: number
  // NEW
  connectionStrength?: number // 0-100 computed score
  lastInteractionAt?: Timestamp
  dismissedSuggestion?: boolean // for "people you might know"
}
```

**blocks** (new dedicated collection for fast lookups):
```
{
  blockerId: string
  blockedId: string
  createdAt: Timestamp
  reason?: string
}
```

Indexed: `blockerId` + `blockedId` composite, `blockedId` for "am I blocked by this person" checks.

### API Contracts

**Existing** (no changes needed):
```
GET    /api/connections?type=all|friends|following|followers|pending
POST   /api/friends (send request)
PATCH  /api/friends (accept/reject)
DELETE /api/friends?friendId=xxx (unfriend)
POST   /api/profile/[userId]/follow (follow/unfollow)
```

**New**:
```
GET  /api/suggestions/people
  → { suggestions: [{ userId, name, avatarUrl, reason: string, score: number, sharedSpaces: string[], mutualFriends: number }] }

POST /api/suggestions/people/dismiss
  → { userId: string }

POST /api/users/[userId]/block
  → Blocks user. Removes all connections. Hides from all surfaces.

DELETE /api/users/[userId]/block
  → Unblocks user. Does not restore connections.

GET  /api/users/[userId]/connection-status
  → { status: 'friend' | 'following' | 'follower' | 'pending_sent' | 'pending_received' | 'blocked' | 'none', mutualFriends: number, sharedSpaces: string[] }
```

### Acceptance Criteria

- [ ] Follow is one-tap, no confirmation dialog (anti-pattern per standards)
- [ ] Friend request flow: send, accept, reject, unfriend (existing, works)
- [ ] Block: one-tap, no confirmation, instant effect across platform
- [ ] "People you might know" suggestions with shared context
- [ ] Connection visibility defaults to OFF
- [ ] Ghost mode hides all presence (existing feature flag)
- [ ] No follower counts displayed on profiles
- [ ] Block check on all social interactions (DMs, space visibility, profile views)

---

## 4. Presence & Social Proof

### Philosophy

Presence makes HIVE feel alive. When a student opens HIVE and sees "23 students active in your spaces right now," the campus feels connected. When they see "3 people from your major going to tonight's event," they feel pulled in. When they see the warmth dots on a space card glowing gold, they want to check what's happening.

Presence is NOT surveillance. It's the digital equivalent of seeing lights on in the student center. You know people are there. You don't know who, unless they want you to.

### Existing Components

Strong foundation of presence primitives:

- **PresenceDot** (`packages/ui/src/design-system/primitives/PresenceDot.tsx`): LOCKED January 2026. Gold for online, 50% gold for away, gray for offline, red for DND. Sizes xs-lg. Ring variant for avatar overlay. Clean, simple, correct.
- **PresenceIndicator** (`packages/ui/src/design-system/components/PresenceIndicator.tsx`): Dot and badge variants. Group variant showing online count. Inline variant for member lists. Pulse animation for online. Invisible status support.
- **LiveCounter** (`packages/ui/src/design-system/primitives/LiveCounter.tsx`): Gold number when > 0, gray when 0. Compact formatting (1K, 1.5M). Dot indicator option. Group variant for multiple counters. Mono font for tabular nums.
- **WarmthDots** (`packages/ui/src/design-system/primitives/WarmthDots.tsx`): 5-dot activity indicator. Hot (50+, 5 gold), Warm (15-50, 4 gold), Cool (5-15, 2 gray), Quiet (1-5, 1 gray), Waiting (0, all dim). Simplified mode option.

**What's missing**:
- No backend presence system (no heartbeat, no online tracking)
- No presence data flowing to these UI components
- No "campus pulse" aggregate view
- No "who's at this event" real-time view
- No privacy controls for presence (ghost mode feature flag exists but no implementation)

### Presence Architecture

**Approach: Lightweight heartbeat with aggregation.**

Students should NOT have individual real-time presence tracked. That's surveillance. Instead:

1. **Space-level presence**: When a student has a space open (foreground tab/app), they send a heartbeat every 60s. The space's online count increments/decrements. Individual users are NOT tracked - only the count.

2. **Event-level presence**: When a student checks into an event or has the event page open, they're counted. "12 people here right now." Individual names shown only for friends/connections.

3. **Campus pulse**: Aggregate of all space activity across the campus. "234 students active on HIVE right now." Updates every 5 minutes. Never shows individual names.

4. **Profile presence**: Shows on user's avatar/profile card ONLY if they've opted in. Default: OFF. Options: Show to everyone, Show to friends only, Show to nobody (ghost mode).

### Presence Data Flow

```
Client (foreground) → heartbeat POST /api/presence/heartbeat (every 60s)
  → { spaceId?: string, eventId?: string }
  → Server writes to Firestore: presence/{campusId}/spaces/{spaceId}/users/{userId} (TTL: 90s)
  → Cloud Function: on write/delete, increment/decrement space online count
  → SSE pushes updated count to connected clients
```

**Privacy safeguards**:
- Individual presence docs have 90s TTL (auto-delete if no heartbeat)
- Only aggregate counts are sent to clients (never user lists, unless opted-in friends)
- Ghost mode: heartbeat is not sent. Student is invisible but can still use the platform normally.
- No "last seen" timestamp. Ever. Unless the student explicitly sets their profile to show it.

### Social Proof Signals

These are the "nudges" that make campus feel alive without being manipulative.

| Signal | Where it appears | Data source |
|---|---|---|
| "X online" | Space card, board header | Space presence count |
| "X going" | Event card | RSVP count |
| "X from your major" | Event card, space card | Cross-reference major + membership/RSVP |
| WarmthDots | Space cards in browse/feed | Space presence count |
| "Active right now" | Space card badge | Presence count > 0 |
| "Trending this week" | Discovery feed | Message count + join rate |
| "Y friends going" | Event card | Cross-reference friends + RSVP |

**Anti-patterns** (from standards, enforced):
- NEVER "X people are viewing this right now" pressure indicators
- NEVER fake activity ("A student just joined!" when it was 3 days ago)
- NEVER show individual names without their consent
- NEVER "you're missing out" framing

### Data Model

**presence/{campusId}/spaces/{spaceId}/users/{userId}** (ephemeral, TTL 90s):
```
{
  userId: string
  timestamp: number
  expiresAt: Timestamp (for Firestore TTL)
}
```

**presence/{campusId}/aggregate** (updated every 5 min by Cloud Function):
```
{
  activeUsers: number
  activeSpaces: number
  updatedAt: Timestamp
}
```

**Space document** (extend existing):
```
{
  // ... existing fields
  onlineCount: number // updated by Cloud Function on presence write/delete
  lastActivityAt: Timestamp
}
```

### API Contracts

```
POST /api/presence/heartbeat
  → { spaceId?: string, eventId?: string }
  ← { ok: true }
  (Rate limited: 1 per 30s per user)

GET  /api/presence/campus
  → { activeUsers: number, activeSpaces: number, topSpaces: [{ id, name, onlineCount }] }

GET  /api/spaces/[spaceId]/presence
  → { onlineCount: number, friendsOnline?: [{ id, name, avatarUrl }] (only opted-in friends) }
```

### Acceptance Criteria

- [ ] Space online count updates in real-time via SSE
- [ ] WarmthDots on space cards reflect actual online counts
- [ ] LiveCounter displays accurate online counts
- [ ] Campus pulse shows aggregate platform activity
- [ ] Presence is opt-in for individual visibility (default OFF)
- [ ] Ghost mode hides student from all presence counts
- [ ] "X from your major" on space/event cards
- [ ] "X friends going" on event cards
- [ ] No individual "last seen" timestamps
- [ ] Heartbeat auto-stops when app is backgrounded

---

## 5. Safety & Moderation

### Philosophy

Safety is not a feature. It's the foundation. Every communication feature described above only works if students feel safe. One unchecked harassment incident can poison a space. One viral toxic message can make students leave.

HIVE's moderation operates on three layers:
1. **Prevention**: Make it hard to be harmful (identity verification, connection-gating for DMs, rate limiting)
2. **Detection**: Catch harmful content quickly (AI scanning, community reporting, behavioral signals)
3. **Response**: Act decisively and transparently (automated actions, human review, clear appeals)

### Existing Code Assessment

Robust moderation infrastructure:

- **Moderation types** (`apps/web/src/lib/moderation/types.ts`): Comprehensive type system. Content types (post, comment, message, tool, space, profile, event). 11 report categories. 4 severity levels. 7 moderation actions. AI analysis result type with toxicity, threat, profanity, identity_attack scores. Moderation queue with auto-assignment.
- **ReportContentModal** (`packages/ui/src/design-system/components/moderation/ReportContentModal.tsx`): Full reporting UI. Category selection, description (min 10 chars), content preview, success state. Uses Modal, Select, Textarea primitives.
- **Space moderation API** (`/api/spaces/[spaceId]/moderation`): Queue view (flagged/hidden content), single + bulk actions (hide, unhide, remove, restore, flag, unflag, approve), moderation logging, permission checks (owner/admin/moderator only).
- **Admin moderation** (`/api/admin/moderation/`): Platform-wide queue, reports, violations, appeals, feedback. Full moderation dashboard in admin app.
- **Content moderation service**: AI analysis with confidence scores, suggested actions, contextual factors, processing time tracking.
- **Security scanning**: XSS/injection detection on chat messages via `SecurityScanner.scanInput()`.
- **Rate limiting**: 20 messages/min per user for chat, SSE connection limits.

**What's missing**:
- No real-time content scanning before delivery (AI analysis happens on report, not on send)
- No block implementation across the platform (type exists but no enforcement)
- No user trust scores (type exists but not computed)
- No escalation from space moderator to platform admin
- No automated action triggers (rules exist in types but not implemented)
- No DM-specific moderation
- No harassment pattern detection (repeated targeting of same user)

### Moderation Pipeline

```
Message sent
  │
  ├── Layer 1: Input validation (existing)
  │   ├── XSS/injection scan (SecurityScanner)
  │   ├── Rate limiting (20/min)
  │   └── Content length check (4000 chars)
  │
  ├── Layer 2: AI pre-scan (NEW - async, non-blocking)
  │   ├── Toxicity check (< 200ms)
  │   ├── Severity classification (low/medium/high/critical)
  │   ├── If critical: hold message, notify moderators immediately
  │   ├── If high: deliver message, auto-flag for review
  │   ├── If medium: deliver message, add to review queue
  │   └── If low: deliver message, no action
  │
  ├── Layer 3: Community reporting (existing, extend)
  │   ├── Report button on every message (existing)
  │   ├── Report categories (existing 11 categories)
  │   ├── Multiple reports on same content escalate severity
  │   └── Reporter trust score adjusts weight
  │
  └── Layer 4: Human review (existing, extend)
      ├── Space moderators: handle medium/high severity in their space
      ├── Platform moderators: handle critical severity, appeals, cross-space patterns
      └── Moderation log: every action recorded with reason
```

### Real-Time AI Scanning

New capability: scan messages before delivery for critical content.

**Implementation**:
- On message POST, run lightweight toxicity classifier (< 200ms)
- Use a fast model (not full LLM) for initial classification: hate speech, threats, self-harm indicators
- Critical content (threats of violence, self-harm) is held and surfaced to moderators immediately
- High-severity content is delivered but auto-flagged
- This is NOT content censorship. It's safety-critical detection. Most messages pass through untouched.

**False positive handling**:
- Students are never told their message was "flagged by AI"
- If a message is held (critical only), the student sees "Message is being reviewed" with an ETA
- If cleared, the message is delivered normally
- If not cleared within 5 minutes, the student is notified and can appeal
- False positive rate must stay below 1%. If it exceeds this, loosen the classifier.

### Block Behavior

When Student A blocks Student B:

| Surface | Effect |
|---|---|
| Profile | B cannot view A's profile. A's profile does not appear in B's search results. |
| Spaces | B can still see A's messages in shared spaces (necessary for context), but A's profile link is anonymized for B. |
| Events | B cannot see that A is attending an event. |
| DMs | Existing conversation is hidden for both. New conversation cannot be created. |
| Connections | All connections between A and B are severed. |
| Suggestions | Neither appears in the other's "people you might know." |
| Notifications | B receives no notifications about A's activity. |

Block is instant, one-tap, no confirmation dialog. Unblock is available in settings but does NOT restore any connections.

### Reporting Flow

1. Student taps "Report" on any content (message, profile, event, space)
2. ReportContentModal opens (existing)
3. Student selects category and provides description (existing)
4. Report is created with content snapshot, reporter history, AI pre-analysis
5. Report enters moderation queue:
   - Space-level queue for space moderators (posts, comments, messages in their space)
   - Platform-level queue for platform moderators (profiles, cross-space patterns, critical severity)
6. Moderator reviews and takes action
7. Action is logged. Reporter receives notification of outcome (without revealing moderator identity).
8. If student disagrees: appeal available within 14 days

### Leader Moderation Tools

Space leaders (owner, admin, moderator roles) need tools to keep their community healthy:

**Existing**:
- Moderation queue view (flagged/hidden content)
- Single and bulk moderation actions (hide, remove, restore, approve)
- Moderation log with audit trail

**New**:
- **Slow mode**: Rate limit messages in a board (e.g., 1 message per 30s per user). For heated discussions.
- **Keyword alerts**: Get notified when specific keywords appear in chat (existing keyword automation system). Extend to trigger moderation flags.
- **Member timeout**: Temporarily mute a member for a set duration (1 hour, 24 hours, 7 days). They can still read but not post.
- **Auto-moderation rules**: Configure per-space rules (e.g., "auto-flag messages with links from new members"). Uses existing `ModerationRule` type from moderation types.

### Data Model

**content_reports** (existing concept, formalize):
```
{
  id: string
  reporterId: string
  reporterTrustScore: number
  contentId: string
  contentType: 'post' | 'comment' | 'message' | 'profile' | 'event' | 'space' | 'tool'
  contentOwnerId: string
  spaceId?: string
  category: ReportCategory (11 types)
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  contentSnapshot: Record<string, unknown>
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed' | 'escalated'
  aiAnalysis?: AIAnalysisResult
  resolution?: { action, reason, moderator, timestamp, appealable }
  moderationHistory: ModerationEvent[]
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

**blocks** (new):
```
{
  blockerId: string
  blockedId: string
  campusId: string
  createdAt: Timestamp
}
```

Indexes: `blockerId`, `blockedId`, composite `blockerId+blockedId`.

**member_timeouts** (new, space subcollection):
```
{
  userId: string
  spaceId: string
  duration: number (seconds)
  reason?: string
  issuedBy: string
  expiresAt: Timestamp
  createdAt: Timestamp
}
```

### API Contracts

**Existing**:
```
POST /api/content/report (general content reporting)
GET  /api/spaces/[spaceId]/moderation (queue view)
POST /api/spaces/[spaceId]/moderation (take action)
PUT  /api/spaces/[spaceId]/moderation (bulk actions)
```

**New**:
```
POST /api/users/[userId]/block
  → { reason?: string }
  ← { success: true }

DELETE /api/users/[userId]/block
  → ← { success: true }

GET  /api/users/me/blocked
  → { blockedUsers: [{ id, name, blockedAt }] }

POST /api/spaces/[spaceId]/moderation/timeout
  → { userId: string, duration: number, reason?: string }
  ← { timeout: MemberTimeout }

DELETE /api/spaces/[spaceId]/moderation/timeout/[userId]
  → ← { success: true }

POST /api/spaces/[spaceId]/moderation/slow-mode
  → { boardId: string, intervalSeconds: number }
  ← { success: true }

POST /api/content/scan
  → { content: string, contentType: string }
  ← { severity: string, flags: string[], safe: boolean }
  (Internal use only - called by message send pipeline)
```

### Acceptance Criteria

- [ ] AI pre-scan on all chat messages (< 200ms, non-blocking for low/medium)
- [ ] Critical content (threats, self-harm) held for review before delivery
- [ ] Block: instant, one-tap, complete platform-wide invisibility
- [ ] Report flow: category + description, content snapshot, AI pre-analysis
- [ ] Space leaders can timeout members (1h, 24h, 7d)
- [ ] Slow mode per board (configurable interval)
- [ ] Auto-moderation rules per space
- [ ] Reporter notified of outcome (without moderator identity)
- [ ] Appeals process within 14 days
- [ ] All moderation actions logged with audit trail
- [ ] False positive rate for AI scanning < 1%

---

## 6. Cross-System Dependencies

### Dependencies on Other Systems

| This system needs | From system | Details |
|---|---|---|
| User identity & verification | Identity & Home (spec 02) | Real identity required for all communication. Campus email verification. |
| Space membership & roles | Spaces & Events (spec 03) | Chat boards live inside spaces. Permissions come from space roles. |
| Event RSVP data | Spaces & Events (spec 03) | RSVP inline components, "X going" social proof, event-linked boards. |
| Profile data | Identity & Home (spec 02) | Author info on messages, connection profiles, mention resolution. |
| Search indexing | Discovery & Intelligence (spec 04) | Chat search, people search for connections. |
| AI infrastructure | Discovery & Intelligence (spec 04) | Summarization, translation, smart compose, content scanning models. |
| Notification system | Identity & Home (spec 02) | @mention notifications, DM notifications, moderation notifications. |
| Feature flags | Platform infrastructure | `enable_dms`, `enable_connections`, `ghost_mode`, `chat_board`. |

### What This System Provides to Others

| Other system gets | From this system | Details |
|---|---|---|
| Social signals for feed ranking | Discovery & Intelligence | Connection strength, interaction count, shared spaces inform content ranking. |
| Engagement data for space health | Spaces & Events | Message count, active participants, board activity for space health scores. |
| Connection graph for suggestions | Discovery & Intelligence | Friend/follow graph, mutual connections for "similar students" recommendations. |
| Presence data for campus pulse | Identity & Home | Aggregate online counts for the home feed "campus is alive" signal. |
| Moderation data for trust scores | Platform infrastructure | Report accuracy, moderation history feed into user trust scoring. |

### Key Decisions for Team Lead

1. **DMs: gated rollout** - Friends-only first, then space-members with requests, then full connections. Safety over speed.
2. **Chat position: complement, not compete** - HIVE chat is structured group communication inside spaces. It will never replace GroupMe for midnight hangout coordination or Discord for gaming servers. That's intentional.
3. **Presence: aggregate by default, individual opt-in** - No individual tracking without explicit consent. Campus feels alive without feeling surveilled.
4. **AI scanning: async for most, sync for critical** - Only threats and self-harm trigger message holds. Everything else is flagged post-delivery. False positive rate must stay < 1%.
5. **Connections: hybrid follow + friend** - Follow for low-commitment discovery, friend for DM access and deeper features. Space membership is implicit connection.
6. **Block: nuclear option, always available** - One tap, no confirmation, complete invisibility. The cost of over-blocking is low. The cost of under-blocking is someone leaving the platform.
