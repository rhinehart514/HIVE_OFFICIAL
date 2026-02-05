# SPACES SYSTEM - Comprehensive Feature Specification

> **Document Type:** System Deep-Dive
> **Last Updated:** February 4, 2026
> **Status:** Analysis Complete - Ready for Implementation Prioritization

---

## Executive Summary

The Spaces System is HIVE's core community layer - where students find their people, participate in conversations, attend events, and build belonging. This document provides a 14-perspective analysis covering current state, ideation, strategy, and detailed specifications for the next phase of development.

**Key Finding:** The Spaces system has solid bones but critical gaps in lifecycle management, cross-space discovery, and leader empowerment that limit organic growth.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Gap Analysis & Refinements](#2-gap-analysis--refinements)
3. [Feature Ideation](#3-feature-ideation)
4. [Strategic Considerations](#4-strategic-considerations)
5. [Feature Specifications (Top 15)](#5-feature-specifications-top-15)
6. [Integration Points](#6-integration-points)
7. [Technical Appendix](#7-technical-appendix)

---

## 1. Current State Analysis

### 1.1 Codebase Archaeologist

**Architecture Overview:**

The Spaces system follows a split-panel architecture inspired by Linear, with DDD (Domain-Driven Design) services backing the API layer.

```
apps/web/src/app/s/[handle]/
├── page.tsx                    # Main space page (~1200 lines)
├── layout.tsx                  # Simple metadata wrapper
├── components/
│   ├── space-header.tsx        # Identity + actions (~450 lines)
│   ├── space-threshold.tsx     # Join gate for non-members
│   ├── space-settings.tsx      # Full settings panel (~1950 lines)
│   ├── moderation-panel.tsx    # Content moderation (~525 lines)
│   ├── members-list.tsx        # Member browser
│   ├── chat-messages.tsx       # Chat display
│   ├── residence/
│   │   └── residence-view.tsx  # Member experience view
│   ├── feed/
│   │   ├── message-feed.tsx    # Scrollable messages (~325 lines)
│   │   ├── message-item.tsx    # Individual message
│   │   └── unread-divider.tsx  # "Since you left" marker
│   └── threshold/
│       └── gathering-threshold.tsx  # Quorum-based activation
└── hooks/
    └── use-space-residence-state.ts  # Main state hook (~950 lines)
```

**API Layer:**

```
apps/web/src/app/api/spaces/
├── route.ts                    # List/create spaces
├── browse-v2/route.ts          # Discovery feed
├── [spaceId]/
│   ├── route.ts               # CRUD operations
│   ├── chat/route.ts          # DDD chat service (~600 lines)
│   ├── members/route.ts       # Member management (~900 lines)
│   ├── events/route.ts        # Event CRUD + RSVP
│   └── boards/route.ts        # Board CRUD
```

**Service Layer (DDD):**

- `SpaceChatService` - Message operations, unread tracking
- `SpaceManagementService` - Space lifecycle, membership
- `SpaceEventsService` - Event creation, RSVP management

**Data Model:**

```typescript
// Core Space document
interface Space {
  id: string;
  name: string;
  slug: string;           // URL handle
  description?: string;
  avatarUrl?: string;
  campusId: string;       // Campus isolation
  ownerId: string;

  // Status
  status: 'open' | 'gathering' | 'ghost';
  claimStatus: 'claimed' | 'unclaimed';
  activationThreshold?: number;

  // Settings
  visibility: 'public' | 'private' | 'hidden';
  membershipType: 'open' | 'approval' | 'invite';

  // Metrics
  memberCount: number;
  memberCountShards?: Record<string, number>;
  onlineCount: number;
  recentMessageCount?: number;
  lastActivityAt?: Timestamp;
  newMembers7d?: number;

  // Social
  socialLinks?: {
    website?: string;
    instagram?: string;
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
  };

  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Membership (subcollection: spaces/{id}/members/{userId})
interface SpaceMember {
  userId: string;
  role: 'owner' | 'admin' | 'moderator' | 'member';
  joinedAt: Timestamp;
  lastReadAt?: Timestamp;
  isMuted?: boolean;
  muteUntil?: Timestamp;
  ghostMode?: boolean;
  status: 'active' | 'suspended';
}

// Message (subcollection: spaces/{id}/messages/{id})
interface SpaceMessage {
  id: string;
  authorId: string;
  content: string;
  contentType: 'text' | 'image' | 'event' | 'system';
  createdAt: Timestamp;
  editedAt?: Timestamp;
  replyTo?: string;
  reactions?: Record<string, string[]>;
  mentions?: string[];
  isHidden?: boolean;
  isFlagged?: boolean;
}

// Event (subcollection: spaces/{id}/events/{id})
interface SpaceEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  location?: string;
  locationName?: string;
  createdBy: string;
  rsvps: Record<string, 'going' | 'maybe' | 'not_going'>;
  goingCount: number;
  maybeCount: number;
  capacity?: number;
}

// Board (subcollection: spaces/{id}/boards/{id})
interface SpaceBoard {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  type: 'chat' | 'announcements' | 'resources' | 'custom';
  createdBy: string;
  order: number;
}
```

**Key Implementation Details:**

1. **Split Panel Layout** (`page.tsx` line 180-350):
   - 200px sidebar (boards, tools, members)
   - Flexible main content (chat, events, settings)
   - Responsive collapse on mobile

2. **Quorum Activation** (`gathering-threshold.tsx`):
   - `ghost` → `gathering` → `open` state machine
   - Progress ring visualization
   - "What unlocks at N members" section

3. **Chat with DDD** (`/api/spaces/[spaceId]/chat/route.ts`):
   - Rate limiting: 20 messages/minute per user
   - XSS scanning via `SecurityScanner`
   - @mention processing with notification triggers
   - Keyword automation support

4. **Presence** (`use-presence.ts`):
   - 60-second heartbeat
   - 5-minute stale threshold
   - Tab visibility handling (online → away)
   - Batch user fetching (30 per query)

5. **Unread Tracking** (`use-space-residence-state.ts` line 450-520):
   - `lastReadAt` stored per member
   - Unread count computed on fetch
   - "Since you left" divider in feed

### 1.2 Data Model Mapper

**Collection Structure:**

```
firestore/
├── spaces/
│   └── {spaceId}/
│       ├── members/
│       │   └── {userId}
│       ├── messages/
│       │   └── {messageId}
│       ├── events/
│       │   └── {eventId}
│       ├── boards/
│       │   └── {boardId}
│       ├── automations/
│       │   └── {automationId}
│       └── joinRequests/
│           └── {requestId}
├── presence/
│   └── {userId}
├── typing/
│   └── {contextId}/
│       └── users/
│           └── {userId}
└── users/
    └── {userId}
```

**Index Requirements:**

| Collection | Fields | Purpose |
|-----------|--------|---------|
| spaces | campusId, status | Browse by campus |
| spaces | campusId, claimStatus | Ghost space discovery |
| spaces/{id}/messages | createdAt desc | Chat pagination |
| spaces/{id}/members | role, status | Role filtering |
| spaces/{id}/events | startTime | Upcoming events |
| presence | campusId, status | Online users |

**Sharded Counters:**

Member counts use sharded counters to avoid write contention:

```typescript
// Increment distributed across 10 shards
const shardId = Math.floor(Math.random() * 10);
await updateDoc(spaceRef, {
  [`memberCountShards.shard_${shardId}`]: increment(1)
});
```

---

### Audit Findings (2026-02-05 — 17-Agent Cross-System Audit)

**Scale:**
- 87 API routes total (largest system by route count)
- 50+ frontend components
- 18 hooks
- `space-settings.tsx` is 1,950 lines (needs splitting)

**Auth Inconsistencies:**
- `join-request` and `waitlist` routes use manual JWT parsing, bypassing `withAuthAndErrors` middleware
- This means these routes skip rate limiting and campus enforcement
- 3 routes need migration to `withAuthAndErrors`

**Critical Bugs Found:**
1. **Chat avatar broken** — `chat-messages.tsx:207-209` only renders `AvatarFallback`, never `AvatarImage` despite avatar URLs in data
2. **Join request race condition** — `join-request/route.ts:111-129` uses check-then-create without transaction. Use deterministic doc ID `${spaceId}_${userId}` or wrap in transaction
3. **3 real-time lifecycle bugs:**
   - `usePresence`: ghost presence persists 90min after tab close (TTL too high)
   - `useTypingIndicator`: unmount race — cleanup fires after component destroyed
   - `useChatSSE`: reconnect race — multiple SSE connections on rapid tab switching

**Additional Findings:**
- ~40KB dead DDD code in services layer (unreachable code paths)
- Unread count hardcoded to 0 — `useTotalUnreadCount()` line 284 returns literal 0
- `useSpaceUnreadCounts()` uses one-time fetch, not `onSnapshot` (no real-time)
- Private space join request UI missing — no visual flow for private spaces
- Accessibility score: 4/10 — minimal aria attributes, no keyboard navigation in modals
- Chat rate limit: 20 messages/min, 4000 char max, 7-day age for edits — all hardcoded

---

## 2. Gap Analysis & Refinements

### 2.1 Gap Finder

| Priority | Gap | Current State | Impact | Fix Complexity |
|----------|-----|---------------|--------|----------------|
| P0 | Dual chat implementations | `/api/spaces/.../chat` (DDD) vs `/api/realtime/chat` (legacy) | Confusion, maintenance burden | Medium - deprecate legacy |
| P0 | Automation execution engine | Automations stored, not executed | Leaders can't automate | High - needs worker |
| P1 | Space-specific presence | Campus-wide only | Can't see who's in space | Medium |
| P1 | No board-level chat | Messages only in main channel | Limited organization | Medium |
| P1 | Typing cleanup job | Typing indicators not cleaned | Stale "typing..." states | Low |
| P2 | Simple search | `.includes()` matching | Poor discovery | Medium - needs Algolia |
| P2 | No cross-space activity | Each space isolated | No network effects | High |
| P2 | Ghost mode incomplete | UI exists, filtering partial | Privacy leaks | Medium |
| P3 | No space templates | Each space starts blank | Slower activation | Medium |
| P3 | No space analytics | Basic metrics only | Leaders can't optimize | Medium |

### 2.2 Quality Auditor

**What's Working Well:**

1. **Campus Isolation** - Every query filters by `campusId` from session. No client bypass possible.
2. **Rate Limiting** - Multi-layer: IP, user, action-specific limits.
3. **XSS Protection** - `SecurityScanner` validates all message content.
4. **Role Permissions** - Clear owner > admin > moderator > member hierarchy.
5. **Premium Motion** - Consistent use of `@hive/tokens` motion variants.
6. **Unread Tracking** - "Since you left" feature creates retention hook.
7. **Moderation Tools** - Flag, hide, remove with audit trail.

**What Needs Attention:**

1. **Test Coverage** - No unit tests for space hooks or services.
2. **Error Boundaries** - Missing at component level.
3. **Optimistic Updates** - Not implemented for chat (flicker on send).
4. **Offline Support** - No service worker, messages lost offline.
5. **Accessibility** - Missing ARIA labels on interactive elements.
6. **Memory Leaks** - Firebase listeners not always cleaned up.

**Code Quality Metrics:**

| File | Lines | Complexity | Recommendation |
|------|-------|------------|----------------|
| `page.tsx` | 1200 | High | Split into smaller components |
| `space-settings.tsx` | 1950 | Very High | Extract tab components |
| `use-space-residence-state.ts` | 950 | High | Extract sub-hooks |
| `members/route.ts` | 900 | High | Extract permission middleware |

---

## 3. Feature Ideation

### 3.1 Belonging Designer

**Core Insight:** Belonging happens through recognition, participation, and shared memory.

**Feature Ideas:**

1. **Arrival Moments**
   - First message gets special animation + emoji celebration
   - "Welcome to [Space]" system message tags new members
   - Member count milestone celebrations (10, 50, 100, 500)

2. **Contribution Recognition**
   - "Top contributor this week" badge in header
   - Member spotlight in sidebar ("Active this week")
   - Reaction leaderboard for fun engagement

3. **Shared Memory**
   - "On this day" - resurface posts from same date last year
   - Pinned memories section in space info
   - Event photo albums that persist

4. **Identity Expression**
   - Member bios visible on hover
   - Custom member tags set by leaders
   - "Why I joined" prompts for new members

### 3.2 Activity Architect

**Core Insight:** Activity creates gravity. Dead spaces repel.

**Feature Ideas:**

1. **Activity Seeding**
   - Daily prompt suggestions for leaders
   - "Conversation starters" template library
   - Auto-post space updates (new tool, new event)

2. **Activity Amplification**
   - Hot topic detection (cluster similar messages)
   - "Trending in [Space]" notification for members
   - Cross-post to other spaces user belongs to

3. **Activity Rescue**
   - 7-day inactivity alert to owner
   - "Revive this space" prompts with action items
   - Auto-archive after 30 days dead (with warning)

4. **Activity Timing**
   - "Best time to post" analytics for leaders
   - Schedule messages for peak hours
   - Time zone aware notifications

### 3.3 Leader Empowerment

**Core Insight:** Great communities have great leaders. Empower them.

**Feature Ideas:**

1. **Leader Dashboard**
   - Member growth chart
   - Engagement metrics (messages/member, retention)
   - Health score with actionable recommendations

2. **Automation Builder**
   - Welcome sequence (Day 1, Day 3, Day 7 messages)
   - Keyword triggers ("job" → pin to board)
   - Role-based announcements

3. **Event Tools**
   - Recurring event templates
   - RSVP reminders and follow-ups
   - Post-event feedback collection

4. **Moderation Assist**
   - AI-suggested moderation actions
   - Bulk message actions
   - Temporary mute with expiration

5. **Growth Tools**
   - Shareable invite links with tracking
   - Member referral program
   - Cross-promotion with similar spaces

### 3.4 Lifecycle Designer

**Core Insight:** Spaces have seasons. Support the full lifecycle.

**State Machine:**

```
[Ghost] --claim--> [Gathering] --threshold--> [Active] --decline--> [Hibernating] --revival--> [Active]
                                                  |                        |
                                                  +--archive--> [Archived] <---sunset---+
```

**Feature Ideas:**

1. **Ghost → Gathering**
   - "Claim this space" flow for leaders
   - Waitlist notification when claimed
   - Founder benefits (special badge, early tools)

2. **Gathering → Active**
   - Progress visualization (5/10 members)
   - "Invite friends" prompt with easy share
   - Feature unlock reveals (boards at 5, events at 10)

3. **Active → Hibernating**
   - Graceful degradation (read-only chat)
   - "This space needs a leader" prompt
   - Ownership transfer flow

4. **Hibernating → Revival**
   - "Reactivate" button for former members
   - New leader nomination
   - Clean slate option (archive old messages)

### 3.5 Cross-Space Connector

**Core Insight:** Users belong to multiple spaces. Connect them.

**Feature Ideas:**

1. **Activity Feed**
   - Unified feed of all joined spaces
   - Priority by engagement level
   - "You might have missed" digest

2. **Cross-Space Discovery**
   - "Members also in" section
   - Related spaces by topic/interest
   - "Spaces like this one" recommendations

3. **Cross-Post**
   - Share event to multiple spaces
   - Cross-space announcements (with permission)
   - Tool sharing between spaces

4. **Inter-Space Connections**
   - Co-hosted events
   - Alliance/partnership badges
   - Merged member directories (opt-in)

---

## 4. Strategic Considerations

### 4.1 Cold Start Physicist

**The Cold Start Problem:**

Empty spaces repel users. Users create activity. This creates a chicken-and-egg problem.

**Current Mitigation:**

1. **Ghost Spaces** - Pre-seeded from CampusLabs. Users see "Claim" not "Create".
2. **Gathering Threshold** - Collective action unlocks features. Social proof in progress.
3. **Interest Matching** - Auto-join spaces during onboarding based on interests.

**Additional Strategies:**

1. **Bot Seeding** (Careful)
   - Welcome bot that responds to first message
   - Daily prompt bot for quiet spaces
   - NOT fake members - transparency required

2. **Cross-Campus Content**
   - "Popular at [similar campus]" section
   - Template spaces from successful examples
   - Shared event templates

3. **Leader Incentives**
   - Gamification for space growth
   - Early access to features for top leaders
   - Campus-wide leaderboard

4. **Critical Mass Events**
   - "Launch party" event for new spaces
   - Required attendance threshold to open
   - Co-hosted with campus activities office

### 4.2 Moat Auditor

**Moat Assessment:**

| Moat Type | Strength | Evidence |
|-----------|----------|----------|
| Network Effects | Medium | Spaces grow with members, but no cross-space amplification yet |
| Switching Costs | Low | Easy to replicate on Discord/Slack |
| Data Flywheel | Low | User data not improving product experience |
| Brand | Low | No strong brand association yet |
| Campus Lock-in | High | CampusLabs integration, .edu verification |

**Moat Deepening Opportunities:**

1. **Social Graph Lock-in**
   - Export-resistant connections
   - "People you might know" unique to HIVE
   - Campus-specific context (major, year)

2. **Content Lock-in**
   - Historical conversations
   - Event memories and photos
   - Tool configurations

3. **Leader Lock-in**
   - Automation investments
   - Member relationship data
   - Analytics history

4. **Integration Lock-in**
   - Campus calendar sync
   - CampusLabs event import
   - University SSO

### 4.3 Network Effects Analyst

**Current Network Effects:**

1. **Direct (Same-side)**
   - More members → more conversations → more value
   - Currently linear, not exponential

2. **Indirect (Cross-side)**
   - More leaders → more spaces → more members
   - Weak - no leader marketplace

**Amplification Opportunities:**

1. **Viral Mechanics**
   - "Invite 3 friends to unlock" feature gates
   - Event RSVPs visible to non-members
   - Shareable space highlights

2. **Cross-Space Effects**
   - Activity in one space visible in related spaces
   - "Trending across campus" section
   - Multi-space membership bonuses

3. **Campus Effects**
   - Campus leaderboard creates competition
   - Inter-campus events (same org, different schools)
   - Campus-wide achievements

---

## 5. Feature Specifications (Top 15)

### 5.1 [P0] Deprecate Legacy Chat Implementation

**Problem:** Two parallel chat systems create confusion and maintenance burden.

**Current State:**
- DDD chat: `/api/spaces/[spaceId]/chat/route.ts` (600 lines)
- Legacy chat: `/api/realtime/chat/route.ts` (870 lines)
- Different data models, different collections

**Solution:** Migrate all chat to DDD implementation, deprecate legacy.

**Acceptance Criteria:**

```gherkin
Feature: Unified Chat System

Scenario: All chat uses DDD service
  Given I am in a space
  When I send a message
  Then the message is stored in spaces/{id}/messages
  And the legacy chatMessages collection is not used

Scenario: Legacy routes return deprecation warning
  Given I call /api/realtime/chat
  When the request is processed
  Then I receive a 410 Gone response
  And the response body includes migration instructions

Scenario: Existing legacy messages are migrated
  Given a space has messages in legacy format
  When an admin runs the migration script
  Then all messages appear in DDD format
  And timestamps and reactions are preserved
```

**Technical Notes:**
- Create migration script: `scripts/migrate-legacy-chat.ts`
- Add deprecation header for 2 weeks before removing
- Update any client code still calling legacy endpoints

---

### 5.2 [P0] Automation Execution Engine

**Problem:** Automations are stored but never executed.

**Current State:**
- Automations defined in `space-settings.tsx` (line 1200-1400)
- Stored in `spaces/{id}/automations`
- No execution worker

**Solution:** Implement Cloud Function worker for automation triggers.

**Acceptance Criteria:**

```gherkin
Feature: Automation Execution

Scenario: Welcome message automation
  Given a space has a welcome automation enabled
  When a new member joins the space
  Then the welcome message is sent within 5 seconds
  And the message appears in the chat feed
  And the message is marked as system message

Scenario: Keyword trigger automation
  Given a space has a keyword trigger for "job"
  When a member posts a message containing "job"
  Then the configured action is executed
  And the action is logged in automation history

Scenario: Scheduled automation
  Given a space has a daily digest automation
  When the scheduled time arrives
  Then the digest is compiled and posted
  And inactive spaces skip the automation

Scenario: Automation rate limiting
  Given an automation has triggered 100 times today
  When another trigger event occurs
  Then the automation is paused
  And the leader is notified of the limit
```

**Technical Notes:**
- Use Firebase Cloud Functions with Firestore triggers
- Implement backoff for high-frequency triggers
- Add automation analytics (triggers, success rate)

---

### 5.3 [P0] Space-Specific Presence

**Problem:** Can only see campus-wide presence, not who's in a specific space.

**Current State:**
- `useOnlineUsers(spaceId?)` accepts spaceId but doesn't use it
- Only `campusId` filter applied

**Solution:** Track space-level presence with entry/exit events.

**Acceptance Criteria:**

```gherkin
Feature: Space-Specific Presence

Scenario: Entering a space updates presence
  Given I am a member of a space
  When I navigate to the space page
  Then my presence is recorded for that space
  And the space's online count increments

Scenario: Leaving a space updates presence
  Given I am viewing a space
  When I navigate away from the space
  Then my presence is removed from that space
  And the space's online count decrements

Scenario: Online members show in header
  Given a space has 5 members currently viewing
  When I view the space header
  Then I see "5 online" with green indicator
  And I can click to see who's online

Scenario: Stale presence is cleaned up
  Given a member's last heartbeat was 5+ minutes ago
  When presence is recalculated
  Then that member is not counted as online
```

**Technical Notes:**
- Add `spaces/{id}/presence/{userId}` subcollection
- Heartbeat on scroll/message to indicate active engagement
- Consider using Firebase RTDB for lower latency

---

### 5.4 [P1] Board-Level Chat

**Problem:** All messages go to one channel, limiting organization.

**Current State:**
- Boards exist but are mostly metadata
- Messages have no board association

**Solution:** Enable boards as separate chat channels.

**Acceptance Criteria:**

```gherkin
Feature: Board-Level Chat

Scenario: Creating a chat board
  Given I am a space admin
  When I create a new board with type "chat"
  Then the board appears in the sidebar
  And members can send messages to that board

Scenario: Switching between boards
  Given a space has multiple chat boards
  When I click a different board
  Then the message feed updates to show that board's messages
  And unread counts show per-board

Scenario: Board-specific notifications
  Given I have a board muted
  When a message is posted to that board
  Then I do not receive a notification
  But I see the unread indicator when I visit

Scenario: Announcements board
  Given a board is type "announcements"
  When a non-admin tries to post
  Then they see "Only admins can post here"
  But they can react and reply
```

**Technical Notes:**
- Add `boardId` field to messages
- Update message queries to filter by board
- Create board-specific unread tracking

---

### 5.5 [P1] Member Spotlight & Recognition

**Problem:** No way to recognize active contributors, reducing belonging.

**Solution:** Add member recognition features.

**Acceptance Criteria:**

```gherkin
Feature: Member Recognition

Scenario: Top contributors display
  Given a space has active members
  When I view the space sidebar
  Then I see "Active this week" section
  And top 3 contributors are shown with message counts

Scenario: Milestone celebrations
  Given a space reaches 50 members
  When the 50th member joins
  Then a celebration message is posted
  And confetti animation plays for all online members

Scenario: New member welcome
  Given a new member joins the space
  When they are added to members
  Then a system message welcomes them
  And existing members see their name highlighted

Scenario: Leader can spotlight members
  Given I am a space admin
  When I click "Spotlight" on a member
  Then they are featured in the space header for 24 hours
```

**Technical Notes:**
- Compute contributors weekly via Cloud Function
- Store milestones in space metadata to avoid re-triggering
- Use ephemeral confetti (client-side only)

---

### 5.6 [P1] Activity Health Dashboard for Leaders

**Problem:** Leaders can't see if their space is healthy or declining.

**Solution:** Add leader-only analytics dashboard.

**Acceptance Criteria:**

```gherkin
Feature: Leader Analytics

Scenario: Viewing health score
  Given I am a space owner
  When I open space settings > Analytics
  Then I see overall health score (0-100)
  And breakdown by: Activity, Growth, Engagement, Retention

Scenario: Trend visualization
  Given I view analytics
  Then I see 30-day charts for:
    - Messages per day
    - Active members per day
    - New members per week
    - Event attendance rate

Scenario: Actionable recommendations
  Given my space has low engagement
  When I view the health dashboard
  Then I see specific recommendations like:
    - "Post a conversation starter"
    - "Create an event this week"
    - "Welcome your 3 new members"

Scenario: Comparative benchmarks
  Given I view analytics
  Then I see "Spaces like yours" comparison
  And understand if I'm above or below average
```

**Technical Notes:**
- Compute metrics daily via Cloud Function
- Store 90 days of history
- Use sparklines for compact visualization

---

### 5.7 [P1] Welcome Sequence Automation

**Problem:** New members don't get onboarded, leading to churn.

**Solution:** Enable leaders to create welcome sequences.

**Acceptance Criteria:**

```gherkin
Feature: Welcome Sequence

Scenario: Setting up welcome sequence
  Given I am a space owner
  When I open Automations > Welcome Sequence
  Then I can configure messages for Day 1, Day 3, Day 7
  And preview how new members will receive them

Scenario: New member receives sequence
  Given a space has a welcome sequence enabled
  When I join the space
  Then I receive Day 1 message immediately via DM
  And Day 3 message arrives 72 hours later
  And Day 7 message arrives 168 hours later

Scenario: Sequence respects engagement
  Given I joined a space and posted 10 messages
  When Day 7 arrives
  Then the "inactive nudge" message is skipped
  And I receive the "engaged member" variant instead

Scenario: Member can opt out
  Given I received a welcome message
  When I click "Stop these messages"
  Then the sequence is cancelled for me
  And I don't receive further automated DMs
```

**Technical Notes:**
- Store sequence state in `spaces/{id}/members/{userId}`
- Use Cloud Scheduler for delayed delivery
- Track delivery and open rates

---

### 5.8 [P1] Event Recurring Templates

**Problem:** Leaders recreate similar events repeatedly.

**Solution:** Enable recurring events and templates.

**Acceptance Criteria:**

```gherkin
Feature: Recurring Events

Scenario: Creating a recurring event
  Given I am creating an event
  When I toggle "Repeat" and select "Weekly"
  Then I can set: Every [1-4] weeks on [day]
  And set an end condition (after N occurrences / on date / never)

Scenario: Editing recurring event
  Given a recurring event exists
  When I edit it
  Then I'm asked: "This event only" or "All future events"
  And changes apply accordingly

Scenario: RSVP to recurring event
  Given I RSVP "Going" to a recurring event
  When the next occurrence is created
  Then my RSVP does NOT auto-carry over
  But I receive a "RSVP for next week?" notification

Scenario: Canceling one occurrence
  Given I cancel one occurrence of a recurring event
  Then that date shows as "Cancelled"
  But future occurrences are unaffected
```

**Technical Notes:**
- Store recurrence rule (RRULE) in event metadata
- Generate instances 30 days ahead
- Use Cloud Function to create future instances

---

### 5.9 [P2] Cross-Space Activity Feed

**Problem:** Users check spaces individually, missing activity.

**Solution:** Unified feed of all joined spaces.

**Acceptance Criteria:**

```gherkin
Feature: Unified Activity Feed

Scenario: Viewing unified feed
  Given I belong to 5 spaces
  When I visit /home
  Then I see recent activity from all 5 spaces
  And items are sorted by timestamp (newest first)
  And each item shows which space it's from

Scenario: Filtering feed
  Given I'm viewing the unified feed
  When I filter by "Events only"
  Then I see only events from my spaces
  And can also filter by: Messages, Announcements, Tools

Scenario: Notification badge accuracy
  Given I have unread messages in 2 spaces
  When I view the bottom nav
  Then the Spaces icon shows "2"
  And the feed highlights those spaces

Scenario: Digest email
  Given I've been inactive for 3 days
  When the daily digest runs
  Then I receive email summarizing activity I missed
  And can click to go directly to any item
```

**Technical Notes:**
- Aggregate via API endpoint, not client-side
- Cache aggregated feed with 1-minute TTL
- Implement fan-out on write for high-activity spaces

---

### 5.10 [P2] Space Templates

**Problem:** New spaces start blank, requiring leader effort.

**Solution:** Pre-configured templates for common space types.

**Acceptance Criteria:**

```gherkin
Feature: Space Templates

Scenario: Creating from template
  Given I'm claiming a ghost space or creating new
  When I select "Academic Club" template
  Then the space is pre-configured with:
    - Boards: General, Announcements, Resources
    - Welcome message template
    - Suggested automation rules
    - Description placeholder text

Scenario: Template gallery
  Given I'm creating a space
  When I click "Choose template"
  Then I see: Academic Club, Sports Team, Professional Org, Social Group, Study Group
  And each shows preview of what's included

Scenario: Custom template creation
  Given I'm a space owner with successful setup
  When I click "Save as template"
  Then my configuration is saved
  And I can share with other leaders

Scenario: Template usage analytics
  Given I created a template
  When others use it
  Then I see "Used by 15 spaces" in template settings
```

**Technical Notes:**
- Store templates in `spaceTemplates` collection
- Include: boards, automations, settings, sample content
- Allow campus admins to feature templates

---

### 5.11 [P2] Ghost Mode Completion

**Problem:** Ghost mode partially implemented, privacy leaks possible.

**Current State:**
- Toggle exists in settings
- Filtering in members list
- Missing from: message author display, @mentions, search

**Solution:** Complete ghost mode across all surfaces.

**Acceptance Criteria:**

```gherkin
Feature: Complete Ghost Mode

Scenario: Ghost in members list
  Given I have ghost mode enabled
  When another member views the members list
  Then I do not appear in the list
  But admins can see me (with ghost indicator)

Scenario: Ghost in @mentions
  Given I have ghost mode enabled
  When someone types "@" in chat
  Then my name does not appear in autocomplete
  And I cannot be mentioned

Scenario: Ghost in search
  Given I have ghost mode enabled
  When someone searches for my name
  Then I do not appear in results
  Unless they are my friend or space admin

Scenario: Ghost activity
  Given I have ghost mode enabled
  When I send a message
  Then it displays "Anonymous" as author to others
  But admins see my name with ghost indicator
  And I see my own name

Scenario: Ghost consistency
  Given I enable ghost mode
  Then the setting syncs across all my spaces
  And I can override per-space if desired
```

**Technical Notes:**
- Add `isGhost` check to all member-fetching queries
- Create "anonymous" display name handler
- Add admin override flag

---

### 5.12 [P2] Improved Search (Algolia)

**Problem:** Simple `.includes()` search provides poor results.

**Solution:** Implement Algolia for full-text search.

**Acceptance Criteria:**

```gherkin
Feature: Full-Text Search

Scenario: Searching spaces
  Given I search "computer science"
  Then results include:
    - Spaces with "CS" in name
    - Spaces with "programming" in description
    - Spaces tagged with related interests
  And results are ranked by relevance

Scenario: Searching messages
  Given I search within a space
  When I type "meeting notes"
  Then I see messages containing those words
  And can jump to that message in context

Scenario: Typo tolerance
  Given I search "basketbal" (typo)
  Then results still include "Basketball" spaces
  And "Did you mean: basketball" appears

Scenario: Filters work with search
  Given I search "club"
  When I filter by "Joined spaces only"
  Then results narrow to my spaces matching "club"
```

**Technical Notes:**
- Use Algolia with Firebase sync
- Index: spaces, messages (last 30 days), events, users
- Implement search analytics for query improvement

---

### 5.13 [P2] Space Health Indicators

**Problem:** Users can't tell if a space is active before joining.

**Current State:**
- `SpaceHealthBadge` component exists
- Only shown when online count is 0

**Solution:** Surface health indicators prominently in discovery.

**Acceptance Criteria:**

```gherkin
Feature: Space Health Visibility

Scenario: Health in explore cards
  Given I'm browsing spaces
  Then each space card shows health indicator:
    - Thriving (green): Active in last 24h, 5+ messages
    - Warm (yellow): Active in last 3 days
    - Quiet (gray): Active in last 7 days
    - Hibernating (dim): No activity 7+ days

Scenario: Health details on hover
  Given I hover on a space card
  Then I see tooltip with:
    - Last message: "2 hours ago"
    - Messages this week: 45
    - Active members: 12

Scenario: Health in join decision
  Given I'm on a space threshold page
  Then I see "This space is [Thriving/Warm/Quiet]"
  And recent activity preview (blurred messages)

Scenario: Health alerts for members
  Given I'm a member of a space that went quiet
  Then I receive notification: "[Space] could use some love"
  With action: "Send a message"
```

**Technical Notes:**
- Compute health score in API response
- Cache for 5 minutes
- Include in browse-v2 endpoint

---

### 5.14 [P2] Typing Indicator Cleanup

**Problem:** Typing indicators become stale, showing "typing..." forever.

**Current State:**
- `useTypingIndicator` has 3-second timeout
- No server-side cleanup for abandoned sessions

**Solution:** Implement cleanup job.

**Acceptance Criteria:**

```gherkin
Feature: Typing Indicator Cleanup

Scenario: Auto-clear stale typing
  Given a user's typing indicator is 10+ seconds old
  When the cleanup job runs
  Then their typing indicator is removed
  And other users no longer see "typing..."

Scenario: Clear on send
  Given I am typing a message
  When I send the message
  Then my typing indicator is immediately cleared
  Before the message appears in feed

Scenario: Clear on blur
  Given I am typing but switch tabs
  When 5 seconds pass
  Then my typing indicator is cleared
  And I'm shown as "away" not "typing"

Scenario: Batch cleanup efficiency
  Given 100 stale typing indicators exist
  When cleanup runs
  Then all 100 are cleared in single batch operation
  Not 100 individual writes
```

**Technical Notes:**
- Cloud Function runs every 30 seconds
- Batch delete indicators older than 10 seconds
- Use TTL index if Firestore supports

---

### 5.15 [P3] Co-Hosted Events

**Problem:** Related spaces can't collaborate on events.

**Solution:** Enable multi-space event hosting.

**Acceptance Criteria:**

```gherkin
Feature: Co-Hosted Events

Scenario: Creating co-hosted event
  Given I am admin of "CS Club" space
  When I create an event and add "Engineering Society" as co-host
  Then "Engineering Society" admin receives co-host request
  And event is pending until approved

Scenario: Co-host approval
  Given I received a co-host request
  When I approve it
  Then the event appears in both spaces
  And both spaces' members can RSVP

Scenario: RSVP tracking
  Given a co-hosted event has RSVPs
  Then both spaces see combined RSVP count
  And each space sees breakdown: "15 from CS Club, 10 from Engineering Society"

Scenario: Co-host permissions
  Given I am co-host admin
  Then I can: Edit event details, View RSVPs, Send reminders
  But cannot: Delete event, Remove primary host
```

**Technical Notes:**
- Store event in primary space
- Create reference documents in co-host spaces
- Aggregate RSVPs across spaces

---

## 6. Integration Points

### 6.1 Identity System

**Current Integration:**
- User profile displayed in member list, messages
- Handle used for @mentions
- Avatar from user profile

**Planned Enhancements:**
- Ghost mode syncs with profile privacy settings
- Academic info (major, year) shown in member tooltips
- Interest matching for space recommendations

**Files:**
- `/apps/web/src/app/u/[handle]/ProfilePageContent.tsx` - Profile display
- `/packages/core/src/domain/user/` - User entity

### 6.2 Tools System (HiveLab)

**Current Integration:**
- Tools appear in space sidebar
- Build tool button for leaders
- Tool updates in space feed

**Planned Enhancements:**
- Space-specific tool permissions
- Tool usage analytics per space
- Tool recommendations based on space type

**Files:**
- `/apps/web/src/app/s/[handle]/tools/[toolId]/page.tsx` - Tool within space
- `/apps/web/src/components/hivelab/` - Tool components

### 6.3 Awareness System (Notifications)

**Current Integration:**
- Message notifications via SSE
- Event reminders
- @mention alerts

**Planned Enhancements:**
- Space muting per-board
- Digest preferences per-space
- Smart notification bundling

**Files:**
- `/apps/web/src/lib/notification-service.ts` - Notification delivery
- `/apps/web/src/components/notifications/` - Notification UI

### 6.4 Discovery System (Explore)

**Current Integration:**
- Browse spaces via `/explore`
- Search with basic matching
- Interest-based recommendations

**Planned Enhancements:**
- Cross-space activity in explore
- "Trending" based on engagement metrics
- Personalized rankings from behavior

**Files:**
- `/apps/web/src/app/explore/page.tsx` - Explore feed
- `/apps/web/src/app/api/spaces/browse-v2/route.ts` - Browse API

---

## 7. Technical Appendix

### 7.1 Performance Considerations

**Current Bottlenecks:**
1. `use-space-residence-state.ts` fetches everything on mount
2. Message feed re-renders on every new message
3. Member list not virtualized

**Recommendations:**
1. Implement message pagination with cursor
2. Use `react-window` for long member lists
3. Add `React.memo` to message items
4. Consider WebSocket for real-time vs polling

### 7.2 Security Checklist

| Area | Status | Notes |
|------|--------|-------|
| Campus isolation | ✅ | Every query filters by campusId |
| Input validation | ✅ | Zod schemas on all inputs |
| XSS prevention | ✅ | SecurityScanner on messages |
| Rate limiting | ✅ | Multi-layer limits |
| Permission checks | ✅ | Role-based with middleware |
| CSRF protection | ✅ | Origin + token validation |
| Audit logging | ⚠️ | Partial - moderation only |

### 7.3 Migration Scripts Needed

1. **Legacy Chat Migration**
   - Source: `chatMessages`, `chatChannels`
   - Target: `spaces/{id}/messages`, `spaces/{id}/boards`
   - Script: `scripts/migrate-legacy-chat.ts`

2. **Presence Data Cleanup**
   - Remove stale presence docs (>24h old)
   - Add missing `expiresAt` field
   - Script: `scripts/cleanup-presence.ts`

3. **Sharded Counter Rollup**
   - Aggregate shard values to `memberCount`
   - Run nightly to ensure consistency
   - Script: `scripts/rollup-member-counts.ts`

### 7.4 Monitoring & Observability

**Key Metrics to Track:**
- Space creation rate (per campus, per day)
- Message send rate (per space, per hour)
- Join/leave ratio (per space)
- Time to first message (new members)
- Daily active spaces (messages in last 24h)

**Recommended Alerts:**
- Space with 100+ members goes inactive
- Message rate drops 50% week-over-week
- Error rate on chat API exceeds 1%
- Automation failure rate exceeds 5%

---

## Appendix A: Files Referenced

| File | Lines | Purpose |
|------|-------|---------|
| `apps/web/src/app/s/[handle]/page.tsx` | ~1200 | Main space page |
| `apps/web/src/app/s/[handle]/components/space-header.tsx` | ~450 | Space header |
| `apps/web/src/app/s/[handle]/components/space-settings.tsx` | ~1950 | Settings panel |
| `apps/web/src/app/s/[handle]/components/space-threshold.tsx` | ~325 | Join gate |
| `apps/web/src/app/s/[handle]/components/threshold/gathering-threshold.tsx` | ~470 | Quorum UI |
| `apps/web/src/app/s/[handle]/components/moderation-panel.tsx` | ~525 | Moderation |
| `apps/web/src/app/s/[handle]/components/feed/message-feed.tsx` | ~325 | Message list |
| `apps/web/src/app/s/[handle]/hooks/use-space-residence-state.ts` | ~950 | State management |
| `apps/web/src/app/api/spaces/[spaceId]/chat/route.ts` | ~600 | DDD chat API |
| `apps/web/src/app/api/spaces/[spaceId]/members/route.ts` | ~900 | Members API |
| `apps/web/src/app/api/spaces/[spaceId]/events/route.ts` | ~400 | Events API |
| `apps/web/src/app/api/spaces/[spaceId]/boards/route.ts` | ~300 | Boards API |
| `apps/web/src/app/api/realtime/chat/route.ts` | ~870 | Legacy chat (deprecate) |
| `apps/web/src/hooks/use-presence.ts` | ~460 | Presence system |
| `apps/web/src/app/explore/page.tsx` | ~1135 | Discovery feed |

---

*Document generated February 4, 2026. Next review: After P0 items shipped.*
