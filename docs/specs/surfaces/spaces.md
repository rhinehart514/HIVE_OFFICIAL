# Spaces Surface Spec

The storefront where creation meets consumption. `/s/[handle]` is where leaders build, members engage, and strangers decide whether to step in.

---

## The Problem This Spec Solves

650+ UB spaces are pre-seeded from CampusLabs. At launch, most are unclaimed. The ones that DO get claimed will have 0 apps, 0 events, and 0 messages. A claimed space with nothing in it is a dead screen — and a dead screen kills the "I need to reach my people" promise.

This spec defines what every space state renders, how the empty-to-alive transition works, and how creation flows back into the storefront.

---

## 1. Space States

A space exists in one of four states. The state determines what renders and what actions are available.

### State Machine

```
UNCLAIMED ──claim──> FRESHLY_CLAIMED ──first_app_or_event──> ACTIVE
    │                       │                                    │
    │                       │ (no activity for 7d)               │ (no activity for 14d)
    │                       ▼                                    ▼
    │                  LOW_ACTIVITY <────────────────────── LOW_ACTIVITY
    │
    └──interest_signal──> (stays UNCLAIMED, but demand accrues)
```

**State derivation** (computed, not stored):

```typescript
function deriveSpaceState(space: SpaceResidenceData): SpaceState {
  if (!space.isClaimed) return 'unclaimed';
  const hasContent = space.appCount > 0 || space.eventCount > 0 || space.messageCount > 5;
  if (!hasContent) return 'freshly_claimed';
  const daysSinceActivity = daysSince(space.lastActivityAt);
  if (daysSinceActivity > 14) return 'low_activity';
  return 'active';
}
```

---

## 2. State: Unclaimed

**Who sees this:** Any student browsing to an unclaimed space (650+ at launch).

**What it renders:** `UnclaimedSpace` component (exists at `apps/web/src/app/s/[handle]/components/unclaimed-space.tsx`).

### Current Implementation (Ships)

- Space name, handle, avatar (from CampusLabs data)
- Description from CampusLabs (if available)
- `orgTypeName` category badge
- Member count ("X interested")
- Upcoming events (if any exist from CampusLabs import)
- Two CTAs: "I'm Interested" (demand signal) + "Claim This Space" (leader action)

### What Changes

**Add social proof to make claiming feel valuable:**

Below the description, before the CTAs:

```
┌────────────────────────────────────────┐
│  👤 12 students interested             │
│  "Last interest signal 2 hours ago"    │
│                                        │
│  Similar spaces on HIVE:               │
│  UB Photography Club · 34 members      │
│  UB Film Society · 22 members          │
└────────────────────────────────────────┘
```

- **Interest count** already tracked via `onInterested` handler. Display as "X students interested" instead of "X interested" (more human).
- **Recency signal**: Show when the last interest was expressed. "2 hours ago" creates urgency for potential claimers.
- **Similar active spaces**: If 2+ similar spaces exist and are active, show them. This proves HIVE is alive and makes the unclaimed space feel like an opportunity, not an abandoned page.

**Data dependencies:**
- Interest count: `spaces/{spaceId}/interestCount` (existing)
- Last interest timestamp: `spaces/{spaceId}/lastInterestAt` (new field, set on interest signal)
- Similar spaces: `GET /api/spaces/${spaceId}/similar?limit=2` (new endpoint, uses tag/category matching)

### Claiming Flow

When a student taps "Claim This Space":

1. Verify they are authenticated (redirect to `/enter` if not)
2. Show confirmation bottom sheet: "You're claiming [Space Name]. As the leader, you can create apps, post events, and manage members."
3. On confirm: `POST /api/spaces/claim` (existing endpoint)
4. On success: Transition to Freshly Claimed state with onboarding overlay

**Who can claim:** Any authenticated student on the same campus. First-come, first-served. Dispute resolution is manual (admin intervention) — not building governance for launch.

---

## 3. State: Freshly Claimed (The Critical 30 Seconds)

**Who sees this:** The leader who just claimed, or any leader whose space has 0 apps and 0 events.

**The #1 problem:** A leader claims their space, sees an empty chat feed, and has no idea what to do next. They close the app. They never come back.

### What Renders

Instead of an empty chat, show the **SparkleCreateSheet** (exists at `apps/web/src/app/s/[handle]/components/sparkle-create-sheet.tsx`) auto-opened on first entry, plus a guided empty state behind it.

**Auto-open behavior:** When `isLeader && appCount === 0 && eventCount === 0 && !hasSeenOnboarding`, the SparkleCreateSheet opens automatically. `hasSeenOnboarding` is stored in `localStorage` as `hive:space:${spaceId}:onboarded`.

**The guided empty state (behind the sheet):**

```
┌─────────────────────────────────────────────┐
│  [SpaceHeader]                              │
│  ─────────────────────────────────────────  │
│                                             │
│  Welcome to your space                      │
│                                             │
│  This is where your members will find       │
│  everything — apps, events, chat.           │
│                                             │
│  Start by creating something:               │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ 📊 Poll  │  │ 📅 Event │  │ ✨ App   │  │
│  │          │  │          │  │          │  │
│  │ Ask your │  │ Set up a │  │ Build    │  │
│  │ members  │  │ meeting  │  │ anything │  │
│  │ anything │  │ or event │  │ with AI  │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  Or just start chatting — type below.       │
│                                             │
└─────────────────────────────────────────────┘
```

**The three cards:**
1. **Poll** — Taps open SparkleCreateSheet with `/poll` pre-filled. Fastest path to first creation.
2. **Event** — Opens CreateEventForm modal (existing at `apps/web/src/components/events/CreateEventForm.tsx`).
3. **App** — Navigates to `/build?spaceId=${spaceId}`. Full Build surface with space context pre-loaded.

**After first creation:** The guided empty state disappears permanently (localStorage flag). The space transitions to showing whatever content exists — even if it's just one poll in the chat feed.

### Component Hierarchy

```
SpacePage (page.tsx)
  ├── SpaceHeader
  ├── [if freshly_claimed && isLeader]
  │     ├── FreshlyClaimedGuide (new component)
  │     │     ├── WelcomeMessage
  │     │     └── QuickCreateCards (poll / event / app)
  │     └── SparkleCreateSheet (auto-opened)
  ├── [else]
  │     └── SpaceTabs → active tab content
  └── ChatInput (always visible at bottom)
```

---

## 4. State: Active

**Who sees this:** Members of a space that has content.

### Layout Architecture

The active space uses a split-panel layout (exists in `page.tsx`):

```
┌──────────┬────────────────────────────────┐
│ Sidebar  │  Main Content                  │  Desktop (>768px)
│ 200px    │  remaining width               │
│          │                                │
│ Apps     │  [ContextBar]                  │
│ Events   │  [SpaceTabs: Chat|Events|Apps] │
│ Members  │  [Tab Content]                 │
│          │  [ChatInput]                   │
└──────────┴────────────────────────────────┘

┌────────────────────────────────────────────┐
│ [SpaceHeader]                              │  Mobile (<768px)
│ [ContextBar]                               │
│ [SpaceTabs: Chat | Events | Apps]          │
│ [Tab Content — full width]                 │
│ [ChatInput — bottom-pinned]                │
│                              [+ FAB]       │
└────────────────────────────────────────────┘
```

### Tabs

Four tabs (exists in `SpaceTabs` component):

| Tab | What It Shows | Badge |
|-----|--------------|-------|
| **Chat** | Real-time message feed with inline components (polls, RSVPs, countdowns). Default tab. | Unread count |
| **Events** | Upcoming events grouped by Today/Tomorrow/This Week/Later. RSVP inline. | Event count |
| **Posts** | Longer-form posts from leaders (announcements, updates). | Post count |
| **Apps** | Grid of placed apps (CreationCards). "Try it" runs inline, "Full view" navigates. | App count |

### Context Bar (Ships)

Persistent bar above tab content (`ContextBar` component exists). Shows ONE item by priority:

1. Next upcoming event with live countdown
2. Active poll with response count
3. Pinned announcement

Hides when nothing is active. This ensures even the Chat tab surfaces event/poll awareness without tab-switching.

### Chat Feed (Ships)

Real-time messaging with SSE streaming (`useChatStream`). Key features already implemented:

- Optimistic message send with rollback
- Inline components (polls, RSVPs, countdowns) via slash commands
- "Since you left" unread divider
- Cursor-based pagination (load older messages)
- Typing indicators
- Message reactions, pinning, reply threads

### Apps Tab

`SpaceAppsTab` component (exists). Renders `CreationCard` grid.

**Empty state (leader):** "No apps in this space yet. Be the first to make one." + "Make an app" button linking to `/build?spaceId=${spaceId}`.

**Empty state (member):** "No apps in this space yet." (No create CTA — members browse, leaders build.)

**With apps:** 2-column grid of `CreationCard`s. Each card shows:
- Name, description, category gradient header
- Usage count badge (hot indicator at 10+ uses)
- "Try it" (inline run) + "Full view" (navigate to `/s/[handle]/tools/[toolId]`)

### Events Tab

`SpaceEventsTab` component (exists). Full event management with RSVP.

**Key behaviors:**
- Grouped by temporal proximity (Today, Tomorrow, This Week, Later)
- Inline RSVP (Going / Interested) with optimistic updates
- Leader sees "Create Event" CTA
- Toggle to show past events
- Event click opens `EventDetailDrawer`

### Leader-Only Features

**LeaderCreateFAB** (exists): Floating action button, bottom-right on mobile. Context-aware:
- Default: Opens menu with Create Event / Add App / Dashboard
- On Events tab: Direct "Create Event" action
- On Apps tab: Direct "Add App" action

**LeaderDashboard** (exists): Slide-over panel with metrics, pending items, quick actions.

**SpaceSettings** (exists): Full settings panel with General, Contact, Members, Moderation, Requests, Analytics, Danger Zone tabs.

---

## 5. State: Low Activity

**Who sees this:** Anyone visiting a space with no activity in 14+ days.

**The problem:** A space that was active but went quiet feels dead. The chat feed shows messages from 3 weeks ago. No events upcoming. It signals "nobody's here."

### What Renders

Same layout as Active, but with an ambient nudge:

**For leaders:** A dismissable card at the top of the chat feed:

```
┌─────────────────────────────────────────┐
│  It's been quiet here                   │
│                                         │
│  Your 23 members haven't heard from     │
│  you in 16 days. A quick poll or event  │
│  can re-activate the space.             │
│                                         │
│  [Create a poll]  [Create an event]     │
└─────────────────────────────────────────┘
```

**For members:** No special treatment. They see the existing content (stale messages, past events). No "this space is dead" messaging — that's a self-fulfilling prophecy. The Context Bar still surfaces any upcoming events or active polls.

**Implementation:** The nudge card is a new component `LeaderReactivationCard`. It renders when:
- `isLeader === true`
- `daysSince(space.lastActivityAt) > 14`
- User hasn't dismissed it (localStorage: `hive:space:${spaceId}:reactivation-dismissed`)

The card dismisses for 7 days, then re-appears if still inactive.

---

## 6. Non-Member View (Join Gate)

**Who sees this:** Any student who navigates to a claimed space they haven't joined.

**What renders:** `SpaceThreshold` (exists) or `ClaimedStorefront` (exists), depending on space state.

### Decision Logic

```typescript
if (!space.isClaimed) {
  return <UnclaimedSpace />;         // Unclaimed: interest + claim CTAs
}
if (!space.isMember) {
  return <ClaimedStorefront />;      // Claimed, not joined: preview + join
}
return <SpaceResidence />;           // Member: full experience
```

### ClaimedStorefront (Ships)

Centered card with:
- Space name, handle, avatar, member count
- Description
- Upcoming events (max 3)
- Deployed apps (max 4, shown as chips)
- "Join Space" CTA

**What changes:** Add online count indicator when > 0. "3 members online right now" creates urgency. Already available in `SpaceResidenceData.onlineCount`.

### After Joining

Optimistic update: `isMember` flips to `true`, member count increments, UI transitions from ClaimedStorefront to full SpaceResidence. No page reload. The chat feed loads via `useSpaceResidenceState` effect triggered by `space.id` becoming available.

---

## 7. The "Create for This Space" Flow

The bridge between the Space surface and the Build surface.

### Entry Points

| Where | CTA | Behavior |
|-------|-----|----------|
| SparkleCreateSheet | Format chips (Poll / Bracket / RSVP) | Pre-fills chat input with slash command, drops inline component into chat |
| SparkleCreateSheet | Custom prompt | Opens Build surface at `/build?spaceId=${spaceId}&prompt=${encoded}` |
| Apps tab empty state | "Make an app" button | Navigates to `/build?spaceId=${spaceId}` |
| LeaderCreateFAB | "Add App" action | Navigates to `/build?spaceId=${spaceId}` |
| LeaderDashboard | "Add Tool" quick action | Navigates to `/build?spaceId=${spaceId}` |

### Context Passing

When navigating to Build with `spaceId`, the Build surface:
1. Pre-loads space metadata (name, member count) for context display
2. After app creation, offers "Place in [Space Name]" as the deployment target
3. On placement, navigates back to `/s/[handle]` with the Apps tab active

**Return flow:** After placing an app, `router.push(/s/${handle}?tab=apps)`. The `SpaceAppsTab` refreshes via `refreshTools()` from `useSpaceResidenceState`.

### Inline Creation (Slash Commands)

For quick formats, creation happens WITHOUT leaving the space:

1. Leader taps format chip in SparkleCreateSheet (or types `/poll`, `/bracket`, `/rsvp` in chat)
2. Chat input pre-fills with the slash command
3. On send, `sendMessage` detects the slash command via `isSlashCommand()`
4. Calls `/api/spaces/${spaceId}/chat/intent` to create the inline component
5. Component renders as a card in the chat feed (poll with vote buttons, RSVP with response buttons)
6. Members interact directly in the feed — no navigation required

This is the fastest path from "I want to do something" to "my members are engaging."

---

## 8. Member Presence and Social Proof

### Online Indicators

**In SpaceHeader:** Member count pill always visible. Online count shown when > 0:
```
[47 members]  [● 3 online]
```

**In sidebar (desktop):** Online members list with avatars. Derived from campus-wide presence data crossed with space member list (existing logic in `useSpaceResidenceState`).

### Presence Data Flow

```
usePresence() → heartbeat to RTDB (campus-wide)
useOnlineUsers() → reads campus-wide presence
allMembers (from API) × campusOnlineUsers → onlineMembers for THIS space
```

This is already implemented. The `onlineCount` updates reactively as members come and go.

### Social Proof at Low Density

At 50 total campus users, most spaces will have 0-2 online at any time. Showing "0 online" is worse than showing nothing.

**Rules:**
- Show online count only when > 0
- Show member count always (even "1 member" after leader claims)
- In ClaimedStorefront, show "X members" (not online count — the space needs to feel established, not empty)
- Never fake activity. Never show "X people viewing" pressure indicators (per 2026 Standards anti-patterns)

### "Since You Left" Feature

Already implemented in `useSpaceResidenceState`:
- On load, API returns `lastReadAt` and `unreadCount`
- Chat feed shows a divider: "X new messages since you left"
- After 3 seconds, marks as read (fire-and-forget POST)
- This makes returning feel like something happened — the space was alive while you were away

---

## 9. Component Hierarchy (Full)

```
/s/[handle]/page.tsx (SpacePage)
│
├── Loading state → SpaceLoadingSkeleton
├── Error state → SpaceErrorState
├── Not found → 404
│
├── [if !isClaimed]
│     └── UnclaimedSpace
│           ├── Avatar + Name + Handle + Category
│           ├── Description
│           ├── Interest count + recency
│           ├── Similar spaces (new)
│           └── CTAs: "I'm Interested" / "Claim This Space"
│
├── [if isClaimed && !isMember]
│     └── ClaimedStorefront
│           ├── Avatar + Name + Handle
│           ├── Member count + online count
│           ├── Description
│           ├── Upcoming events (max 3)
│           ├── Deployed apps (max 4)
│           └── CTA: "Join Space"
│
└── [if isMember] → SpaceResidence
      ├── SpaceHeader
      │     ├── Back link (desktop)
      │     ├── Space name (tappable → SpaceInfoDrawer)
      │     ├── Claim CTA (if unclaimed)
      │     ├── Member count pill (→ MembersList)
      │     └── Settings gear (if member)
      │
      ├── [if freshly_claimed && isLeader]
      │     ├── FreshlyClaimedGuide (new)
      │     └── SparkleCreateSheet (auto-open)
      │
      ├── ContextBar
      │     └── Next event / Active poll / Pinned announcement
      │
      ├── SpaceTabs
      │     ├── Chat tab → MessageFeed + TypingIndicator
      │     ├── Events tab → SpaceEventsTab
      │     ├── Posts tab → SpacePostsTab
      │     └── Apps tab → SpaceAppsTab
      │
      ├── ChatInput (bottom-pinned)
      │
      ├── [if isLeader] LeaderCreateFAB
      │
      ├── HeaderMenu (mobile hamburger)
      ├── SpaceInfoDrawer (slide-over)
      ├── SpaceSettings (slide-over)
      ├── LeaderDashboard (slide-over)
      ├── MembersList (slide-over)
      └── EventDetailDrawer (slide-over)
```

---

## 10. Data Dependencies

### Primary Data (loaded on mount)

```typescript
// useSpaceResidenceState(handle) loads:
1. GET /api/spaces/resolve-slug/${handle}     → spaceId
2. GET /api/spaces/${spaceId}                 → space metadata, membership, activation
3. GET /api/events?spaceId=${spaceId}&upcoming=true&limit=20  → upcoming events
4. GET /api/spaces/${spaceId}/tools?placement=sidebar&status=active → placed apps
5. GET /api/spaces/${spaceId}/chat?limit=20   → initial messages (after member check)
```

### Lazy Data (loaded on interaction)

```typescript
6. GET /api/spaces/${spaceId}/members         → full member list (on panel open)
7. GET /api/spaces/${spaceId}/events?upcoming=false → past events (on toggle)
8. GET /api/spaces/${spaceId}/chat?limit=30&before=${cursor} → older messages (on scroll)
```

### Real-Time Streams

```typescript
9. SSE /api/spaces/${spaceId}/chat/stream     → new messages, edits, deletes, component updates
10. RTDB /presence/${campusId}/               → campus-wide online status
```

### State Management

| Data | Source | Cache Strategy |
|------|--------|---------------|
| Space metadata | React state in `useSpaceResidenceState` | Stale after navigation, refresh on return |
| Messages | React state + SSE stream | Live updates, cursor pagination |
| Events | React Query | `staleTime: 60s` |
| Apps/tools | React state | Manual refresh via `refreshTools()` |
| Online members | Derived (members x presence) | Reactive via `useEffect` |
| Member list | React state, lazy loaded | Loaded once per session, reset on space change |

---

## 11. What We Are NOT Building

| Feature | Why Not |
|---------|---------|
| Governance roles beyond owner | Only owner (claimer) role at launch. Admin/moderator tiers add complexity with 0 proven need. Settings page has the UI but backend enforces owner-only. |
| Space types (housing, course, Greek) | All spaces are `student` type at launch. CampusLabs `orgTypeName` is display-only metadata, not a functional differentiator. |
| Advanced moderation (auto-mod, word filters) | Manual moderation by owner only. Report → admin review. No AI moderation at launch. |
| Space-to-space connections | No federation, no cross-space feeds, no "related spaces" beyond the similar-spaces suggestion on unclaimed pages. |
| Paid features / premium spaces | Everything is free. No tiers, no paywalls, no feature gating by plan. |
| Nested channels / boards | Single chat feed per space. Multi-board was deprecated. If a space needs segmentation, they create multiple spaces. |
| Space analytics dashboard (member-facing) | LeaderDashboard exists but metrics are basic (member count, message count, event count). No engagement graphs, no retention curves. |
| Space templates | No pre-built space configurations. Every space starts the same way: empty, ready to be shaped by the leader. |

---

## 12. Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Space load (slug resolve + metadata) | < 800ms | Two sequential fetches, server-side. Could optimize with a single `/api/spaces/by-handle/${handle}` endpoint. |
| Initial chat render | < 500ms after space load | 20 messages limit, no hydration. Client-side fetch + render. |
| Tab switch | < 100ms | Content pre-fetched on mount (events, apps). Tab switch is local state change. |
| Message send → visible | < 200ms | Optimistic UI. Real ID backfilled via SSE. |
| RSVP tap → visual feedback | < 100ms | Optimistic update, server reconciliation async. |
| Join space → full residence | < 500ms | Optimistic `isMember` flip, lazy chat load. |

### Skeleton Strategy

- SpaceHeader: renders immediately (name from URL resolution)
- Tab content: skeleton grids matching actual card dimensions
- Chat: skeleton message bubbles (3-4 items)
- Events: skeleton event cards (4 items)
- Apps: skeleton creation cards (4 items, 2-column grid)

---

## 13. Perspective Signals

### overwhelmed-org-leader (just claimed their space)

**Scenario:** Junior running a 60-person engineering club. They heard about HIVE, found their org, tapped "Claim." Now what?

**What works:** SparkleCreateSheet auto-opens with format chips (Poll / Bracket / RSVP). The leader can drop a poll in 15 seconds without learning anything. The guided empty state behind it shows three clear paths. No tutorial, no onboarding carousel.

**What could break:** If the leader's first creation fails (AI generation error, network issue), they have zero tolerance. The optimistic UI + rollback in `sendMessage` handles this, but the error toast needs to be actionable: "Poll failed to create. Tap to try again." not "Something went wrong."

**Signal (gain):** The fastest path from "I claimed this" to "my members can interact with something" is a single slash command. This is the lever — measure time-to-first-creation obsessively.

### lonely-freshman (found a space)

**Scenario:** First-year from out of state. Found "UB Photography Club" in Discover. Tapped in. They've never been to a meeting.

**What works:** ClaimedStorefront shows member count, upcoming events, and deployed apps before joining. The student can see what this space is about without committing. After joining, the chat feed with "Since you left" divider makes it feel like a living room they just walked into.

**What could break:** If the space has 0 events, 0 apps, and 3 stale messages from 2 weeks ago, the freshman joins and immediately sees a dead room. The Context Bar shows nothing. The sidebar shows no one online.

**Signal (pain):** The freshman's experience is entirely determined by whether the leader has created anything. HIVE's job is to make creation so easy that leaders do it before the freshman arrives. The SparkleCreateSheet is the lever, but it only works if leaders see it.

### returning-skeptic (opened the space a week ago, back to check)

**What works:** "Since you left" divider shows new messages. Context Bar surfaces the upcoming event. The space feels different from last time.

**What could break:** If nothing changed since last visit, there's no reason to stay. The unread count in the shell tab helps (draws them in), but the content has to be fresh.

**Signal (pivot):** Retention in spaces is a creation problem, not a consumption problem. If leaders create, members return. The spec should optimize for leader creation velocity above all else.

---

## Evals

### space-first-impression: A stranger decides to join in 10 seconds or leave forever

**Value prop:** A student who navigates to `/s/[handle]` from Discover makes a join/leave decision in under 10 seconds. The ClaimedStorefront must convey "this is alive and worth joining" without requiring the student to read anything.
**Scenario:** A UB sophomore sees "UB Robotics Club" in their feed. They tap the space card. What do they see? What makes them tap "Join"?
**Perspectives:** lonely-freshman, thursday-night-sophomore, returning-skeptic
**Files:**
- `apps/web/src/app/s/[handle]/components/claimed-storefront.tsx`
- `apps/web/src/app/s/[handle]/components/space-threshold.tsx`
- `apps/web/src/app/s/[handle]/components/unclaimed-space.tsx`

### leader-first-creation: A leader creates something within 60 seconds of claiming

**Value prop:** The time between claiming a space and having live content in it is under 60 seconds. No tutorials, no configuration, no "set up your space" multi-step wizard.
**Scenario:** An org leader claims "UB Dance Team." The SparkleCreateSheet opens. They tap "Poll," type "What day should we practice?", and it's live in the chat feed. Members can vote immediately.
**Perspectives:** overwhelmed-org-leader
**Files:**
- `apps/web/src/app/s/[handle]/components/sparkle-create-sheet.tsx`
- `apps/web/src/app/s/[handle]/components/leader-create-fab.tsx`
- `apps/web/src/app/s/[handle]/page.tsx`

### space-alive-at-50: A space with 5 members feels alive, not empty

**Value prop:** At launch scale (50 campus users, 3-5 members per active space), a space must not feel dead. Presence indicators, the Context Bar, and "Since you left" dividers create the illusion of activity even with low throughput.
**Scenario:** UB Hiking Club has 5 members. One leader, four members. Leader posted a poll yesterday, created an event for Saturday. A member opens the space on Wednesday afternoon. What do they see?
**Perspectives:** lonely-freshman, commuter-student, returning-skeptic
**Files:**
- `apps/web/src/app/s/[handle]/components/context-bar.tsx`
- `apps/web/src/app/s/[handle]/hooks/use-space-residence-state.ts`
- `apps/web/src/app/s/[handle]/page.tsx`
