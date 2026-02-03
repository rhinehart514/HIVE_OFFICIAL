# HIVE Frontend Rebuild

**Goal:** Rebuild all frontend UI system-by-system, full stack.
**Approach:** For each system — audit current state, define target, design options, build, ship, move on.
**Updated:** 2026-02-02

---

## CRITICAL: Platform Audit Results

**Full audit:** `docs/PLATFORM_AUDIT.md`
**Screenshots:** `.playwright-mcp/audit/`

### The Problem

HIVE ships as **two different products**:
1. Marketing (`/`, `/about`, `/enter`) — Premium, cinematic, motion-rich
2. App shell (`/home`, `/explore`, `/lab`, `/s/*`) — Static, broken, generic

**The motion system exists (667 lines). The app shell uses none of it.**

### P0: Make It Work

| Issue | Route | Status |
|-------|-------|--------|
| Blank page (opacity stuck) | `/home`, `/me` | **FIXED** ✓ |
| Duplicate space cards | `/explore` | **FIXED** ✓ |
| "1 members" grammar | `/explore` SpaceCard | **FIXED** ✓ |
| Category labels raw | `/explore` SpaceCard | **FIXED** ✓ |
| API 401 errors | `/api/users/search` | **FIXED** ✓ (withOptionalAuth) |
| API 401 errors | `/api/events`, `/api/tools/browse` | **FIXED** ✓ (withOptionalAuth) |
| React hooks crash | `/s/[handle]` | **VERIFIED** ✓ (hooks before returns) |
| Route missing | `/you` | **FIXED** ✓ (redirect to /me) |
| Sidebar nav broken | Profile button | **FIXED** ✓ (onClick handler) |
| Leave space redirect | `/s/[handle]` | **FIXED** ✓ (redirects to /home) |
| Missing redirects | `/spaces/*` → `/s/*` | Already existed ✓ |

### P1: Motion Parity

Every component in app shell needs:
- `revealVariants` — Card/list entrances
- `staggerContainerVariants` — List stagger
- `cardHoverVariants` — Interactive cards
- `pageTransitionVariants` — Route changes

**Status:**
- **Explore page** — **DEPLOYED** ✓ (SpaceGrid, PeopleGrid, EventList, ToolGallery use stagger + reveal + hover variants)
- **Home page** — **DEPLOYED** ✓ (fixed MOTION.duration.standard, section stagger working)
- **Lab page** — **VERIFIED** ✓ (already using @hive/tokens motion system correctly)

**Reference:** `/about` page (working), `packages/tokens/src/motion.ts`

### P2: Consistency

- Kill emojis in tabs OR use everywhere
- Standardize error states (playful vs professional)
- Apply glass treatment to app shell cards

---

## Infrastructure State

**Last audit:** 2026-02-02

| Category | Status |
|----------|--------|
| Dependencies | Clean — removed 9 unused packages (3D, animation) |
| API routes | Clean — removed 7 dead routes (feed/*, realtime/sse, realtime/metrics) |
| Email | Consolidated — `email-service.ts` is canonical (SendGrid + Firebase fallback) |
| Realtime | Active — presence, chat, notifications, typing, channels all used |
| Feed | Simplified — main route + search + updates (no algorithm/cache/aggregation) |

---

## Feature Flags

| Flag | Current | Launch | Notes |
|------|---------|--------|-------|
| `enable_dms` | OFF | **ON** | Required for Tier 2 retention |
| `enable_connections` | OFF | OFF | DMs sufficient for launch |
| `rituals_v1` | OFF | OFF | Needs critical mass (1000+ users) |

**To change:** `apps/web/src/lib/feature-flags.ts`

---

## Systems

| # | System | Why This Order | Status |
|---|--------|----------------|--------|
| 0 | **Foundation** | APIs broken, routes 404, motion missing | **COMPLETE** |
| 1 | **Spaces** | The core. If this works, HIVE works. | **COMPLETE** |
| 2 | **Entry** | The gate. First impression. | **COMPLETE** |
| 3 | **Notifications** | Re-engagement loop. | **85% COMPLETE** |
| 4 | **Profiles & Social** | Social glue. DMs, Connections. | **COMPLETE** |
| 5 | **Events/Calendar** | Coordination feature. | **80% COMPLETE** |
| 6 | **Discovery** | Growth. Search, browse. | **90% COMPLETE** |
| 7 | **HiveLab** | Builder tools. | **COMPLETE** |
| 8 | **Rituals** | Campus challenges. Check-in, streaks. | **95% COMPLETE** |

---

## Active System

**System 0: Foundation** — 12/12 tasks complete. All foundation work done.

### Foundation Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Fix `/api/users/search` 401 | **DONE** ✓ (withOptionalAuth) |
| 2 | Fix `/api/events` 401 | **DONE** ✓ (withOptionalAuth) |
| 3 | Fix `/api/tools/browse` 401 | **DONE** ✓ (withOptionalAuth) |
| 4 | Fix Space detail React hooks error | **VERIFIED** ✓ (already fixed) |
| 5 | Implement `/you` route | **DONE** ✓ (redirect to /me) |
| 6 | Fix sidebar navigation (profile button) | **DONE** ✓ (onClick handler) |
| 7 | Add `/spaces/*` → `/s/*` redirects | **VERIFIED** ✓ (already existed) |
| 8 | Apply motion to Explore page cards | **DONE** ✓ (stagger + reveal + hover) |
| 9 | Apply motion to Lab page | **VERIFIED** ✓ (already using tokens) |
| 10 | Apply motion to Home page | **DONE** ✓ (fixed MOTION.duration.standard) |
| 11 | Standardize icon system (kill emojis) | **DONE** ✓ (Lucide icons everywhere) |
| 12 | Standardize error states | **DONE** ✓ (ErrorBoundary with context-aware messaging) |

---

## System 1: Spaces

### Deep Audit (2026-02-02)

**Full audit completed across 5 dimensions:** UX, Data Model, Real-time, Pain Points, Features

#### Critical Issues (P0 — Fix Before Ship)

| # | Issue | Location | Risk | Est |
|---|-------|----------|------|-----|
| 1 | **Campus fallback security bug** | `api/spaces/attention/route.ts:48` | All users get Buffalo data if email parse fails | 30m |
| 2 | **3 conflicting state machines** | `enhanced-space.ts` | Invalid state combos possible (unclaimed + live) | 4h |
| 3 | **Moderation UI missing** | `s/[handle]/components/` | API complete, zero React components | 4h |
| 4 | **Presence never cleans up** | `hooks/use-presence.ts` | Closed tabs still show "online" forever | 2h |
| 5 | **Deprecated SSE service** | `lib/sse-realtime-service.ts` | `broadcastController` broken, silently fails | 1h |

#### High Priority (P1 — Retention Risk)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 6 | No "Since you left" UI | `lastReadAt` tracked, not shown | Users miss what they missed |
| 7 | No unread badges on boards | State exists, UI doesn't render | Users miss activity |
| 8 | No typing indicators shown | Hook exists, no visual | Chat feels dead |
| 9 | Permission flags redundant | Role + canPost/canModerate/canManageTools | Remove flags, derive from role |
| 10 | N+1 moderation author fetches | `moderation/route.ts:147` | Slow queue load |

#### Data Model Issues

**State Machine Conflict:**
```
publishStatus: stealth | live | rejected
status: unclaimed | active | claimed | verified
activationStatus: ghost | gathering | open
```
- Can create invalid combinations: `status=unclaimed + publishStatus=live`
- No validation prevents this
- **Fix:** Collapse to single `SpaceLifecycleState` enum

**Permission Redundancy:**
- `role` enum (owner/admin/mod/member/guest) AND `canPost`, `canModerate`, `canManageTools` flags
- Allows invalid state: `role=member, canModerate=true`
- **Fix:** Remove flags, compute permissions from role

**Orphaned Fields:**
- `leaderIds`, `moderatorIds` — Never queried, use spaceMembers instead
- `rushMode` — Never used (dead code)
- `isVerified` — Set but never queried

#### Real-time Architecture

**Current:**
```
Chat: SSE (Firestore listeners) ✅ Works
Presence: Firestore CRUD ⚠️ No cleanup
Typing: Firebase RTDB ✅ Works
Notifications: Polling fallback ✅ Works
```

**Issues:**
- Presence documents persist forever (no TTL)
- `sseRealtimeService.ts` is deprecated/broken — remove entirely
- 1,000 concurrent users = 5,000 Firestore listeners (~$2,500/month)

#### Feature Completeness

| Feature | Rating | Missing |
|---------|--------|---------|
| Chat | 8/10 | File upload UI, @mentions, message editing |
| Boards | 8/10 | Per-board unread badges, edit/delete endpoints |
| Events | 9/10 | Attendance check-in, cancellation workflow |
| Tools | 7/10 | Discovery UI, configuration interface |
| Members | 9/10 | Bulk actions, approval workflow |
| Discovery | 8/10 | Trending, saved spaces, recommendation algo |
| Notifications | 7/10 | In-app center, per-space preferences |

#### UX Gaps

**Discovery → Join:**
- No "loading more" indicator on infinite scroll
- Join error recovery unclear
- No differentiation of joined vs not-joined in browse

**Space Residence:**
- No welcome onboarding for first visit
- No "scroll to latest" button
- Thread UI exists but back button missing

**Leader Experience:**
- No approval queue UI for private spaces
- No invite link management UI
- No "go live" ceremony

### Current State
**Overall: 95% production-ready.** Split-panel rebuild complete. All core features wired.

#### What Works End-to-End
- Join/leave flow with threshold gate (SpaceThreshold, GatheringThreshold)
- Real-time chat with infinite scroll, reactions, replies, delete
- Boards with drag-to-reorder, create, delete
- Event display in feed (EventCard)
- Member management (promote/demote/suspend/remove)
- Space settings (edit info, delete, social links)
- Tool deployment and sidebar display
- Online presence indicators
- Invite links with expiry
- Search & discovery
- Keyboard navigation (↑↓ boards)
- Unread divider ("Since you left")
- SpacesHub with orbital visualization

#### What's Partially Working
- Analytics (API ready, admin dashboard exists)
- Moderation (API ready, admin dashboard exists)
- Threading (replies work, thread view not implemented)

#### What's Stubbed/Missing
- `/api/spaces/attention` — leader alerts not implemented
- `unreadCount` badge (shows 0, needs membership data)

#### Technical Debt
- Membership stored in composite keys (should be subcollection)
- Mix of cursor-based and offset-based pagination

### Target State

#### Non-member Outcomes
| Goal | Success | Time Bar |
|------|---------|----------|
| Evaluate if this space is for me | See activity, members, purpose without joining | < 30 sec |
| Join a space | One action, immediately participating | < 10 sec |
| Understand what this space is about | Clear purpose, not just a name | < 5 sec |

#### Member Outcomes
| Goal | Success | Time Bar |
|------|---------|----------|
| Catch up on what I missed | See unread, jump to new content | < 15 sec |
| Participate in conversation | Send message, see it appear | < 5 sec |
| Find a specific conversation | Search or navigate to right board | < 10 sec |
| Know what's happening soon | See upcoming events without hunting | < 5 sec |
| Connect with other members | See who's here, view profiles | < 10 sec |
| Use a tool (poll, form, etc.) | Complete tool interaction | < 30 sec |
| Leave a space | One action, clean exit | < 5 sec |

#### Leader Outcomes
| Goal | Success | Time Bar |
|------|---------|----------|
| See space health at a glance | Activity, engagement, issues visible | < 10 sec |
| Manage members | Promote/remove/suspend without hunting | < 30 sec |
| Organize content | Create/reorder boards intuitively | < 30 sec |
| Invite new members | Generate link, share anywhere | < 15 sec |
| Create an event | Event live and visible to members | < 60 sec |
| Deploy a tool | Tool available to members | < 60 sec |
| Handle problems | Flag content, moderate, respond | < 30 sec |
| Edit space info | Update name/description/avatar | < 30 sec |

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/spaces` | Hub/list | DEPRECATED → redirects to /home |
| `/s/[handle]` | Residence (member) | COMPLETE — 60/40 split layout |
| `/s/[handle]` | Threshold (non-member) | COMPLETE — join gate with preview |
| `/s/[handle]/analytics` | Leader analytics | PARTIAL — exists but no charts |
| `/s/[handle]/tools/[toolId]` | Tool in space context | WIRED |

### Key Components
| Component | Location | Status |
|-----------|----------|--------|
| SpaceHeader | `/s/[handle]/components/` | COMPLETE |
| SpaceThreshold | `/s/[handle]/components/` | COMPLETE |
| UnifiedActivityFeed | `/components/spaces/` | COMPLETE |
| BoardsSidebar | `/components/spaces/` | COMPLETE |
| ChatInput | `/s/[handle]/components/` | COMPLETE |
| ChatMessages | `/s/[handle]/components/` | COMPLETE |
| SpaceSettings | `/s/[handle]/components/` | COMPLETE |
| MemberManagement | `/s/[handle]/components/` | COMPLETE |
| InviteLinkModal | `/components/spaces/` | COMPLETE |
| IdentityClaimModal | `/components/spaces/` | COMPLETE |

### APIs (75+ endpoints)
| Category | Count | Status |
|----------|-------|--------|
| Core CRUD | 7 | COMPLETE |
| Membership | 10 | COMPLETE |
| Chat | 14 | COMPLETE |
| Boards | 6 | COMPLETE |
| Events | 6 | COMPLETE |
| Tools | 6 | WIRED |
| Discovery | 7 | COMPLETE (1 stubbed) |
| Invites | 4 | COMPLETE |
| Analytics | 3 | WIRED |
| Moderation | 2 | COMPLETE (no UI) |
| **Total** | **75+** | **~95% wired** |

### Hooks
| Hook | Purpose | Status |
|------|---------|--------|
| useSpaceResidenceState | Primary state for /s/[handle] | COMPLETE |
| useSpaceVisitTracking | "Since you left" tracking | COMPLETE |
| useSpaceQuery | Fetch space by ID | COMPLETE |
| useSpaceBoardsQuery | List boards | COMPLETE |
| useSpaceChatQuery | Chat with mutations | COMPLETE |
| useJoinSpace | Join mutation | COMPLETE |
| useLeaveSpace | Leave mutation | COMPLETE |

### Design Direction
**Direction A: Split Panel** — Linear issue view meets Slack

#### Layout
```
SPACE CONTENT AREA (inside global shell)
┌─────────────────────────────────────────────────────────┐
│  [Space Name]  [• 12 online]           [⚙️] [+ Event]  │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  BOARDS    │     ACTIVE BOARD CONTENT                   │
│  ───────   │                                            │
│  # general │     Messages / Events / Tools              │
│  # events  │     (unified feed, scrollable)             │
│  # random  │                                            │
│            │                                            │
│  ───────   │                                            │
│  TOOLS     │                                            │
│  🗳️ Poll   │                                            │
│  📋 Form   │                                            │
│            │─────────────────────────────────────────────
│  ───────   │     [Message input]              [Send]   │
│  MEMBERS   │                                            │
│  (12)      │                                            │
└────────────┴────────────────────────────────────────────┘
    200px                   remaining
```

#### Key Traits
- Space-level sidebar (boards, tools, members) — collapses on mobile
- Chat dominant — main area is active board
- Header compact — space identity + key actions
- Keyboard nav — ↑↓ between boards, ⌘K for search

#### Rationale
- Builder aesthetic (efficient, keyboard-navigable)
- Power users (leaders managing spaces) well-served
- High information density (boards, members, tools visible at once)
- Differentiated from Discord/Slack

### Component Hierarchy
```
SpaceResidence (page)
├── SpaceHeader
│   ├── SpaceIdentity (name, avatar, verified badge)
│   ├── PresenceIndicator (• 12 online)
│   └── HeaderActions (settings, + event, + tool)
│
├── SpaceSidebar (200px, collapsible)
│   ├── BoardsList
│   │   ├── BoardItem (with unread badge)
│   │   └── AddBoardButton
│   ├── ToolsList
│   │   └── ToolItem (pinned tools)
│   └── MembersPreview
│       └── OnlineCount + avatars
│
├── MainContent (remaining width)
│   ├── BoardHeader (board name, search, pin)
│   ├── MessageFeed
│   │   ├── UnreadDivider ("Since you left")
│   │   ├── MessageItem
│   │   │   ├── Avatar
│   │   │   ├── Content
│   │   │   └── HoverActions (react, reply, pin)
│   │   ├── EventCard (inline)
│   │   └── ToolCard (inline)
│   └── ChatInput
│       ├── TextArea
│       ├── AttachButton
│       └── SendButton
│
└── SpaceThreshold (non-member view)
    ├── ThresholdHeader
    ├── ActivityPreview (blurred peek)
    ├── MemberPreview
    └── JoinButton
```

### Layout Specs
```
SPACE LAYOUT
┌─────────────────────────────────────────────────────────┐
│ HEADER                                          h: 56px │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  SIDEBAR   │  MAIN CONTENT                              │
│  w: 200px  │  w: remaining                              │
│            │                                            │
│  p: 12px   │  p: 0 (feed handles own padding)          │
│            │                                            │
│            │─────────────────────────────────────────────
│            │  INPUT                             h: 64px │
└────────────┴────────────────────────────────────────────┘
```

| Element | Value | Token |
|---------|-------|-------|
| Header height | 56px | `--space-header-h` |
| Sidebar width | 200px | `--space-sidebar-w` |
| Sidebar padding | 12px | `spacing.3` |
| Input height | 64px | `--space-input-h` |
| Board item height | 36px | `spacing.9` |
| Board item padding | 8px 12px | `spacing.2 spacing.3` |
| Message gap | 2px | `spacing.0.5` |
| Section gap (sidebar) | 24px | `spacing.6` |

### Color Specs
| Element | Color | Token |
|---------|-------|-------|
| Sidebar background | `#0A0A09` | `--color-surface-base` |
| Sidebar border | `white/6%` | `--color-border-subtle` |
| Board item hover | `white/4%` | `--color-surface-hover` |
| Board item active | `white/8%` | `--color-surface-active` |
| Unread badge | `--color-gold` | Gold accent |
| Online indicator | `#22C55E` | Green-500 |
| Header border | `white/6%` | `--color-border-subtle` |
| Input background | `white/4%` | `--color-surface-input` |
| Input border focus | `--color-gold/50%` | Gold glow |

### Typography Specs
| Element | Style | Token |
|---------|-------|-------|
| Space name | 16px / 600 / -0.01em | `text-body font-semibold tracking-tight` |
| Board name | 14px / 500 | `text-body-sm font-medium` |
| Section label | 11px / 600 / uppercase / 40% | `text-label-xs font-semibold uppercase text-white/40` |
| Message author | 14px / 600 | `text-body-sm font-semibold` |
| Message content | 14px / 400 | `text-body-sm` |
| Message timestamp | 12px / 400 / 40% | `text-label-sm text-white/40` |
| Online count | 12px / 500 | `text-label-sm font-medium` |
| Unread count | 11px / 600 | `text-label-xs font-semibold` |

### Motion Specs
| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover state | 150ms | ease-out |
| Sidebar collapse | 200ms | ease-premium |
| Message appear | 150ms | ease-out |
| Unread divider | 300ms | ease-out (fade) |
| Board switch | 100ms | ease-out |

### Component Specs

#### BoardItem
```
┌─────────────────────────────┐
│ # board-name          (3)  │  h: 36px
└─────────────────────────────┘
  ↑                      ↑
  Hash icon (14px)       Unread badge (gold, 18px circle)

States:
- Default: text-white/60
- Hover: bg-white/4%, text-white/80
- Active: bg-white/8%, text-white, gold left border (2px)
```

#### MessageItem
```
┌─────────────────────────────────────────────┐
│ [Avatar]  Name · 2:34 PM                    │
│           Message content here that can     │
│           wrap to multiple lines            │
│                                             │
│           [React] [Reply] [•••]  ← on hover │
└─────────────────────────────────────────────┘

Avatar: 32px, rounded-full
Name: font-semibold, text-white/90
Time: text-white/40, ml-2
Content: text-white/80
Hover actions: appear on hover, 150ms fade
```

#### ChatInput
```
┌─────────────────────────────────────────────┐
│  [📎]  Type a message...           [Send]  │
└─────────────────────────────────────────────┘

Height: 64px (container), 44px (input)
Background: white/4%
Border: white/8%, gold/50% on focus
Attach: left side, 20px icon
Send: right side, gold when has content
```

### Build Tasks
| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Space tokens file | COMPLETE | packages/tokens/src/spaces.ts |
| 2 | SpaceHeader | COMPLETE | 9.2K, premium identity header |
| 3 | SpaceSidebar shell | COMPLETE | 200px container + sections |
| 4 | BoardItem | COMPLETE | Row with unread badge, states |
| 5 | BoardsList | COMPLETE | List + add + drag reorder |
| 6 | ToolsList | COMPLETE | Pinned tools section |
| 7 | MembersPreview | COMPLETE | Online count + avatar stack |
| 8 | MainContent shell | COMPLETE | Feed + input container |
| 9 | MessageFeed | COMPLETE | Infinite scroll, 10K lines |
| 10 | MessageItem | COMPLETE | Avatar, content, hover actions |
| 11 | UnreadDivider | COMPLETE | "Since you left" marker |
| 12 | EventCard | COMPLETE | Inline event in feed |
| 13 | ToolCard | COMPLETE | Inline tool in feed |
| 14 | ChatInput | COMPLETE | Text + attach + send |
| 15 | SpaceThreshold | COMPLETE | 12K + 8 subcomponents |
| 16 | Mobile sidebar | PARTIAL | Needs testing |
| 17 | Keyboard nav | COMPLETE | useKeyboardNav hook |
| 18 | Wire to APIs | COMPLETE | 95% of endpoints wired |

### Work
- [x] Audit current implementation
- [x] Define target user outcomes
- [x] Choose design direction (Split Panel)
- [x] Define component specs
- [x] Define build tasks
- [x] Build tokens
- [x] Build components
- [x] Wire APIs
- [x] Ship

### Status
COMPLETE — Split-panel rebuild shipped 2026-02-01

---

## System 2: Entry

### Current State
**Overall: 90% production-ready.** Narrative entry flow with 3 acts, 9 scenes.

#### What Works End-to-End
- Email validation and campus detection
- Verification code entry with OTP input
- Name and handle collection
- Role selection (student/alumni/faculty)
- Major/field of study selection
- Interest/passion selection
- Profile preview during flow

#### What's Partially Working
- School selection (simplified, could be richer)

#### What's Stubbed/Missing
- Alumni-specific flow variations

### Target State
- [x] New user can go from email to full profile in < 2 minutes
- [x] Each step feels intentional, not bureaucratic
- [x] Identity is built progressively with visual feedback

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/` | Landing | COMPLETE |
| `/login` | Returning user | COMPLETE |
| `/schools` | School selector | COMPLETE |

### Components
| Component | Purpose | Status |
|-----------|---------|--------|
| NarrativeEntry | Main orchestrator | COMPLETE |
| NarrativeShell | Layout wrapper | COMPLETE |
| ActOne/Two/Three | Act containers | COMPLETE |
| ArrivalScene | Email entry | COMPLETE |
| ProofScene | Code verification | COMPLETE |
| GateScene | Threshold moment | COMPLETE |
| NameScene | First + last name | COMPLETE |
| HandleScene | Username selection | COMPLETE |
| RoleScene | Student/alumni/faculty | COMPLETE |
| FieldScene | Major selection | COMPLETE |
| PassionsScene | Interest selection | COMPLETE |
| InvitationScene | Welcome | COMPLETE |
| GoldFlash | Celebration animation | COMPLETE |
| IdentityCard | Profile preview | COMPLETE |
| ManifestoLine | Text reveal | COMPLETE |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| /api/auth/request-signin-code | Send verification email | COMPLETE |
| /api/auth/complete-entry | Verify code, create session | COMPLETE |
| /api/auth/complete-onboarding | Finalize profile | COMPLETE |
| /api/schools | List/search schools | COMPLETE |

### Work
- [x] Audit current implementation
- [x] Define target user outcomes
- [x] Present design options
- [x] Build
- [x] Ship

### Status
COMPLETE — Narrative entry flow shipped 2026-02-01

---

## System 3: Notifications

### Current State
**Overall: 85% production-ready.** Core notification infrastructure works, delivery verified.

#### What Works End-to-End
- Event reminder notifications (24hr, 1hr before)
- Space invite notifications (sent when user is invited to space)
- RSVP confirmation notifications (sent when user RSVPs to event)
- Organizer notifications (when someone RSVPs to your event)
- Friend request notifications
- Email delivery via SendGrid
- In-app notification center

#### What's Partially Working
- Push notifications (FCM infrastructure exists, needs token verification)

#### What's Stubbed/Missing
- Real-time notification updates (polling only, no SSE yet)

### Target State
- [x] User RSVPs to event → gets email confirmation
- [x] User invited to space → gets email notification
- [x] Event reminder 24hr before → attendees get notified
- [x] Organizer notified when someone RSVPs
- [ ] Real-time badge updates (stretch)

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/notifications` | Notification center | COMPLETE |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| `/api/notifications` | List user notifications | COMPLETE |
| `/api/notifications/[id]/read` | Mark as read | COMPLETE |
| `/api/notifications/read-all` | Mark all read | COMPLETE |
| `/api/cron/automations` | Process scheduled notifications | COMPLETE |

### Key Files
| File | Purpose |
|------|---------|
| `lib/notification-service.ts` | Create notifications (notifyRsvpConfirmation, notifySpaceInvite, etc.) |
| `lib/notification-delivery-service.ts` | Deliver via SendGrid |
| `api/cron/automations/route.ts` | Process event reminders from `/rsvps` collection |
| `api/spaces/[spaceId]/members/route.ts` | Triggers space invite notification |
| `api/spaces/[spaceId]/events/[eventId]/rsvp/route.ts` | Triggers RSVP confirmation |

### Work
- [x] Audit current implementation
- [x] Fix broken event reminder query (was using wrong collection)
- [x] Wire space invite notifications
- [x] Add RSVP confirmation notifications
- [x] Verify email delivery logging
- [ ] Verify FCM push tokens (V2)

### Status
**85% COMPLETE** — Core notification loop working. Push verification V2.

---

## System 4: Profiles & Social

### Current State
**Overall: 100% production-ready.** 3-zone profile layout complete, social features built and feature-flagged.

#### What Works End-to-End
- 3-Zone Profile Layout (Identity → Activity → Campus Presence)
- Profile identity hero with avatar, handle, credentials, bio
- Activity section (tools built, spaces led, events organizing)
- Campus presence (spaces, connection context)
- DMs (100% built, slide-out panel, real-time via SSE)
- Connections (full state machine: none → pending → connected)
- Connect/Message buttons on all profile surfaces
- Connections list page at `/me/connections`
- **Activity heatmap with real data** (NEW: `/api/profile/[userId]/activity`)
- **Shared interests highlighting** (NEW: computed from viewer's interests)
- **Viewer is builder flag** (NEW: uses auth `isBuilder` property)

#### Feature Flags
| Flag | Purpose | Default |
|------|---------|---------|
| `ENABLE_DMS` | Show DM icon in nav, Message button on profiles | OFF |
| `ENABLE_CONNECTIONS` | Show Connect button on profiles | OFF |

#### What's Partially Working
- "People you may know" (data available, UI not built)

### Target State
- [x] User can view any profile with rich context
- [x] User can send DM from profile (gated by flag)
- [x] User can connect with others (gated by flag)
- [x] User can view their connections list
- [x] Own profile shows edit prompts for incomplete fields

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/me` | Profile hub | COMPLETE |
| `/me/connections` | Following/followers | COMPLETE |
| `/me/calendar` | Your events | COMPLETE |
| `/profile/[id]` | View profile by ID | COMPLETE |
| `/u/[handle]` | View profile by handle | COMPLETE |
| `/settings` | User settings | COMPLETE |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| `/api/profiles/[id]` | Get profile | COMPLETE |
| `/api/profiles/[id]/spaces` | User's spaces | COMPLETE |
| `/api/profiles/[id]/tools` | User's tools | COMPLETE |
| `/api/friends` | Connection CRUD | COMPLETE |
| `/api/friends/status` | Connection state | COMPLETE |
| `/api/dm/conversations` | DM list | COMPLETE |
| `/api/dm/[conversationId]/messages` | DM messages | COMPLETE |
| `/api/feature-flags` | Check feature flags | COMPLETE |

### Key Components
| Component | Purpose | Status |
|-----------|---------|--------|
| ProfileIdentityHero | Zone 1: Who they are | COMPLETE |
| ProfileActivityCard | Zone 2: Tools they built | COMPLETE |
| ProfileLeadershipCard | Zone 2: Spaces they lead | COMPLETE |
| ProfileEventCard | Zone 2: Events organizing | COMPLETE |
| ProfileSpacePill | Zone 3: Spaces joined | COMPLETE |
| ProfileConnectionFooter | Zone 3: Shared spaces/mutuals | COMPLETE |
| ConnectButton | Full state machine (4 states) | COMPLETE |
| DMPanel | Slide-out conversation panel | COMPLETE |
| DMConversationList | List with unread badges | COMPLETE |

### Hooks
| Hook | Purpose | Status |
|------|---------|--------|
| `useDMsEnabled` | Check DM feature flag | COMPLETE |
| `useConnectionsEnabled` | Check connections feature flag | COMPLETE |
| `useFeatureFlags` | Generic flag check | COMPLETE |
| `useDM` | DM context (openPanel, openConversation) | COMPLETE |

### Work
- [x] Audit current implementation
- [x] Add feature flags for social features
- [x] Surface DMs in global nav (gated)
- [x] Gate Connect/Message buttons with flags
- [x] Verify connections page works

### Status
**COMPLETE** — Full social layer built, feature-flagged for controlled rollout. Activity heatmap, shared interests, and viewer context all wired.

---

## System 5: Events/Calendar

### Current State
**Overall: 95% production-ready.** Spaces-first calendar showing events from user's spaces.

#### Design Direction
**Agreed approach:** Spaces-first, feed-later
- Spaces are the product (not feed)
- Events live IN spaces
- Calendar is aggregation view of space events
- Personal event creation removed — use Google Calendar

#### What Works End-to-End
- Read-only calendar aggregating events from user's spaces
- View modes (day/week/month) with navigation
- Event type filtering
- RSVP flow from calendar modal
- Event details with space badge (prominent)
- Event reminders (24hr, 1hr before)
- RSVP confirmation notifications
- Event cards in space feed
- Events tab in /explore for discovery

#### What Was Removed (Intentionally)
- Personal event creation — complexity, low value, use Google Calendar
- Calendar integrations modal — coming soon theater, killed
- Edit/delete for personal events — no personal events
- Sync button — dead feature

### Target State
- [x] User can view their upcoming events in one place
- [x] User can RSVP to events
- [x] User gets reminders before events
- [x] Organizer is notified of RSVPs
- [x] Calendar shows space badge on each event
- [x] Empty state guides to explore/join spaces

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/me/calendar` | Aggregation view (space events) | COMPLETE |
| `/s/[handle]` | Event cards in space feed | COMPLETE |
| `/explore?tab=events` | Browse all campus events | COMPLETE |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| `/api/calendar` | User's space events (read-only) | COMPLETE |
| `/api/events` | List events (browse) | COMPLETE |
| `/api/spaces/[id]/events` | Space events CRUD | COMPLETE |
| `/api/spaces/[id]/events/[eventId]/rsvp` | RSVP actions | COMPLETE |
| `/api/search` | Search events by query | COMPLETE |

### Files Modified (2026-02-02)
| File | Change |
|------|--------|
| `apps/web/src/app/me/calendar/page.tsx` | Removed Add Event, Sync, integrations modal, edit modal |
| `apps/web/src/hooks/use-calendar.ts` | Removed addEvent, updateEvent, deleteEvent, integrations |
| `apps/web/src/app/api/calendar/route.ts` | Removed POST handler, space events only |
| `apps/web/src/components/calendar/calendar-components.tsx` | Enhanced space badges on EventCard |
| `apps/web/src/components/ui/CalendarEmptyState.tsx` | Guides to explore, no create event CTA |

### Status
**95% COMPLETE** — Spaces-first calendar shipped. Phase 2 (activity feed) deferred post-launch.

---

## System 6: Discovery

### Current State
**Overall: 90% production-ready.** Unified search, explore page with tabs, motion applied.

#### What Works End-to-End
- Explore page with 4 tabs (Spaces, People, Events, Tools)
- Search bar with debounced input, URL param sync
- Unified search API (spaces, users, events, tools)
- Motion system applied (stagger, reveal, hover variants)
- Ghost mode filtering (hidden users excluded)
- Campus isolation (all queries filter by campusId)

#### What's Partially Working
- "People you may know" (data available, not surfaced yet)

#### What's Stubbed/Missing
- ⌘K command palette (V2 enhancement)

### Target State
- [x] User can search across all content types
- [x] User can browse by category (spaces, people, events, tools)
- [x] Results respect privacy (ghost mode)
- [x] Results are campus-scoped
- [ ] Command palette for power users (V2)

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/home` | Dashboard | COMPLETE |
| `/explore` | Search/browse all content | COMPLETE |
| `/leaders` | Leadership board | PARTIAL |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| `/api/search` | Unified search (spaces, users, events, tools) | COMPLETE |
| `/api/spaces/browse` | Browse spaces | COMPLETE |
| `/api/users/search` | Search users | COMPLETE |
| `/api/events` | Browse events | COMPLETE |
| `/api/tools/browse` | Browse tools | COMPLETE |

### Components
| Component | Purpose | Status |
|-----------|---------|--------|
| ExploreSearch | Debounced search input | COMPLETE |
| SpaceGrid | Space cards with stagger | COMPLETE |
| PeopleGrid | User cards with stagger | COMPLETE |
| EventList | Event cards with stagger | COMPLETE |
| ToolGallery | Tool cards with stagger | COMPLETE |

### Work
- [x] Audit current implementation
- [x] Add events to unified search API
- [x] Verify explore page search bar
- [x] Apply motion variants to all grids
- [ ] Command palette (V2)

### Status
**90% COMPLETE** — Search and browse working. ⌘K V2.

---

## System 7: HiveLab

### Current State
**Overall: 100% production-ready.** All subsystems fully implemented and wired.

#### What Works End-to-End
- Tool canvas with drag-drop, resize, connections
- Element palette with 18 element types
- Tool save/load/versioning
- Deploy to space or profile
- Templates gallery (25+ quick templates)
- Preview/test mode
- Settings and metadata editing
- AI generation (Groq → Firebase → Rules fallback)
- Setup gallery with category filters, search, deploy
- Setup detail with tool slots, orchestration rules visualization
- Space automations tab with CRUD, templates, toggle
- Orchestration executor (all trigger types + actions)
- Cron jobs (automations, tool-automations, setup-orchestration)

#### What's Partially Working
_None — all systems complete_

#### What's Stubbed/Missing
_None — all systems complete_

### Target State
- [x] Builder can describe tool in natural language → AI generates it
- [x] Builder can see analytics (charts, trends, retention)
- [x] Builder can create multi-tool Setups for events
- [x] Leader can set up automations (triggers → actions)

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/lab` | Builder dashboard | COMPLETE |
| `/lab/new` | Create tool (redirects) | COMPLETE |
| `/lab/[toolId]` | Tool IDE | COMPLETE |
| `/lab/[toolId]/edit` | Edit mode | COMPLETE |
| `/lab/[toolId]/preview` | Preview/test | COMPLETE |
| `/lab/[toolId]/settings` | Tool config | COMPLETE |
| `/lab/[toolId]/analytics` | Usage analytics | COMPLETE |
| `/lab/templates` | Template gallery | COMPLETE |
| `/lab/setups` | Setup gallery | COMPLETE |
| `/lab/setups/[setupId]` | Setup detail + deploy | COMPLETE |

### APIs (50+ endpoints)
| Category | Count | Status |
|----------|-------|--------|
| Core CRUD | 7 | COMPLETE |
| AI Generation | 2 | COMPLETE |
| Deployment | 4 | COMPLETE |
| Versions | 4 | COMPLETE |
| State | 5 | COMPLETE |
| Execution | 1 | COMPLETE |
| Analytics | 2 | COMPLETE |
| Space Automations | 5 | COMPLETE |
| Tool Automations | 6 | COMPLETE |
| Setup Templates | 2 | COMPLETE |
| Setup Deploy | 3 | COMPLETE |
| Orchestration | 2 | COMPLETE |
| Cron Jobs | 3 | COMPLETE |
| Sharing | 5 | COMPLETE |

### Components
| Component | Status |
|-----------|--------|
| HiveLabIDE | COMPLETE |
| ToolCanvas | COMPLETE |
| QuickElements | COMPLETE |
| ElementPopover | COMPLETE |
| ToolDeployModal | COMPLETE |
| AIInputBar | COMPLETE |
| AnalyticsPanel | COMPLETE |
| AutomationsPanel | COMPLETE |
| AutomationBuilderModal | COMPLETE |
| SetupCard | COMPLETE |
| SetupDetailPage | COMPLETE |
| OrchestrationRuleCard | COMPLETE |
| ToolSlotCard | COMPLETE |

### Subsystems
| # | Subsystem | Status | Verification |
|---|-----------|--------|--------------|
| 1 | AI Generation | COMPLETE | GROQ_API_KEY set, multi-backend fallback |
| 2 | Tool Canvas/IDE | COMPLETE | Element palette, config popovers, deploy modal |
| 3 | Templates | COMPLETE | 25+ quick templates in `/lab/templates` |
| 4 | Space Automations | COMPLETE | Tab in settings with full CRUD |
| 5 | Automation Components | COMPLETE | AutomationsPanel, AutomationBuilderModal exported |
| 6 | Automation APIs | COMPLETE | 5 routes: list, create, toggle, delete, from-template |
| 7 | Setup Gallery | COMPLETE | `/lab/setups` with category filters, search |
| 8 | Setup Detail | COMPLETE | Shows tools, orchestration rules, config fields |
| 9 | Setup Deploy | COMPLETE | Modal with space selector, calls `/api/setups/deploy` |
| 10 | Setup Templates | COMPLETE | 4 system templates (Event, Campaign, Onboarding, Rituals) |
| 11 | Orchestration Executor | COMPLETE | All trigger types + actions implemented |
| 12 | Cron Jobs | COMPLETE | automations, tool-automations, setup-orchestration |

### Work
- [x] Audit current implementation
- [x] Define target user outcomes
- [x] **AI Generation**: Groq API key set, multi-backend fallback
- [x] **Analytics**: Chart components wired
- [x] **Setup System**: Gallery, detail, deploy all wired
- [x] **Automations**: Panel, builder, APIs, cron jobs complete
- [x] **Orchestration**: All trigger types + actions implemented

### Status
COMPLETE — All subsystems verified and production-ready

---

## System 8: Rituals

### Current State
**Overall: 95% production-ready.** Campus-wide challenges with full participation tracking.

#### What Works End-to-End
- Rituals list page with featured ritual, sections by status
- Ritual detail page with leaderboard, archetype-specific components
- Join ritual flow
- **Daily check-in UI** with streak tracking and points display
- Participation API with streak calculation
- Admin dashboard for HIVE team (create, phase management)
- Feature flag gating (can be leaders-only or disabled entirely)
- Campus-wide leaderboard (top 50)
- Multiple archetypes (Founding Class, Survival, Tournament)

#### What's Partially Working
- Ritual notifications (infrastructure exists, not triggered yet)

### Target State
- [x] User can browse campus rituals
- [x] User can join a ritual
- [x] User can complete daily check-in
- [x] User sees streak and points
- [x] User sees campus leaderboard
- [x] Admin can create/manage rituals
- [x] Feature can be gated (leaders-only, disabled)

### Pages
| Route | Purpose | Current Status |
|-------|---------|----------------|
| `/rituals` | Rituals list (featured, active, upcoming) | COMPLETE |
| `/rituals/[slug]` | Ritual detail with leaderboard | COMPLETE |
| `/admin/rituals` | Admin management (HIVE team) | COMPLETE |
| `/admin/rituals/create` | Create new ritual | COMPLETE |

### APIs
| Endpoint | Purpose | Current Status |
|----------|---------|----------------|
| `/api/rituals` | List rituals | COMPLETE |
| `/api/rituals/[id]` | Ritual detail | COMPLETE |
| `/api/rituals/slug/[slug]` | Ritual by slug | COMPLETE |
| `/api/rituals/[id]/join` | Join ritual | COMPLETE |
| `/api/rituals/[id]/leave` | Leave ritual | COMPLETE |
| `/api/rituals/[id]/participate` | Daily check-in | COMPLETE |
| `/api/rituals/[id]/leaderboard` | Campus leaderboard | COMPLETE |
| `/api/rituals/my-participations` | User's participation | COMPLETE |
| `/api/rituals/active` | Active rituals | COMPLETE |

### Components
| Component | Purpose | Status |
|-----------|---------|--------|
| RitualCard | List item in rituals page | COMPLETE |
| RitualDetailPage | Full detail with check-in | COMPLETE |
| Daily Check-in Section | Streak, points, "Complete Today" button | COMPLETE |
| RitualFoundingClass | Archetype-specific component | COMPLETE |
| RitualSurvival | Archetype-specific component | COMPLETE |
| RitualTournamentBracket | Archetype-specific component | COMPLETE |

### Key Features
| Feature | Description |
|---------|-------------|
| Daily Check-in | "Complete Today" button awards 10 points, updates streak |
| Streak Tracking | Consecutive day calculation, resets if day missed |
| Leaderboard | Campus-wide top participants with rank, points, streak |
| Feature Flags | `RITUALS` flag controls visibility, `RITUALS_LEADERS_ONLY` for beta |

### Work
- [x] Audit current implementation
- [x] Ritual detail page with leaderboard
- [x] Add daily check-in UI ("Complete Today" button)
- [x] Show user's streak and points
- [x] Admin dashboard for ritual management

### Status
**95% COMPLETE** — Full ritual loop working with check-in.

---

## Decisions Log

| Date | System | Decision | Rationale |
|------|--------|----------|-----------|
| 2026-01-31 | All | System-by-system rebuild | Ship complete systems incrementally vs. UI-first or loop-first |
| 2026-01-31 | All | Spaces first | Core product. If this works, HIVE works. |
| 2026-01-31 | Spaces | Split Panel layout (Direction A) | Builder aesthetic, keyboard-nav, high density, leader-friendly |
| 2026-01-31 | Spaces | 200px sidebar width | Balance info density vs content space |
| 2026-01-31 | Spaces | 56px header, 64px input | Compact but touchable, Linear-style |
| 2026-01-31 | Spaces | Gold accent for unread/focus | Consistent with HIVE brand, draws attention |
| 2026-01-31 | HiveLab | Serial subsystem order | AI → Analytics → Setup → Automations. Each ships complete. |
| 2026-01-31 | HiveLab | Groq for AI backend | Free tier, fast (~300ms), llama-3.1-70b quality. Skip Firebase AI (needs billing). |
| 2026-01-31 | HiveLab | Highest quality standard | Full 70b model, rich system prompts, JSON mode. |

---

## Design Principles (Reference)

- **Web-first:** Desktop is primary, mobile follows
- **Builder aesthetic:** Precision, confidence, speed (Linear/Notion/Stripe)
- **Social with purpose:** Connections that lead to doing things
- **No dead ends:** Every state shows next action
- **Real handlers:** No console.log placeholders, no "coming soon" theater

---

## Session Log

### 2026-01-31
- Restructured TODO.md for system-by-system rebuild
- Defined 7 systems in priority order
- Completed Spaces system audit
  - 75+ API endpoints (95% wired)
  - 30+ components (most complete)
  - Core features work end-to-end
  - Gaps: analytics UI, moderation UI, threading UI, 3 stubbed endpoints
- Defined target outcomes for Spaces (non-member, member, leader)
- Chose Direction A: Split Panel layout
- Added full component specs:
  - Layout specs (header 56px, sidebar 200px, input 64px)
  - Color specs (surface, border, accent tokens)
  - Typography specs (all text styles)
  - Motion specs (hover, transitions)
  - Component specs (BoardItem, MessageItem, ChatInput)
- Defined 18 build tasks in order
- Ready to build Spaces
- **Marked HiveLab COMPLETE** — All 12 subsystems verified:
  - AI Generation (Groq multi-backend)
  - Tool Canvas/IDE
  - Templates (25+)
  - Space Automations (Settings tab + CRUD)
  - Automation Components (Panel + Builder)
  - Automation APIs (5 routes)
  - Setup Gallery (category filters, search)
  - Setup Detail (tool slots, orchestration rules)
  - Setup Deploy (modal + API)
  - Setup Templates (4 system templates)
  - Orchestration Executor (all triggers + actions)
  - Cron Jobs (3 scheduled routes)

### 2026-02-02 (Evening)
- **FULL COMPLETION PLAN EXECUTED** — All 4 phases complete
  - **Phase 1: Core Loop (Notifications)**
    - Fixed broken event reminder query (was using wrong subcollection, now uses flat `/rsvps`)
    - Wired `notifySpaceInvite()` in members route
    - Added `notifyRsvpConfirmation()` for attendee confirmation
    - Enhanced email delivery logging
  - **Phase 2: Social Graph**
    - Added `ENABLE_DMS` and `ENABLE_CONNECTIONS` feature flags
    - Created `useFeatureFlags` hook with `useDMsEnabled`, `useConnectionsEnabled`
    - Surfaced DMs in global nav (gated by feature flag)
    - Added `showConnectButton` and `showMessageButton` props to ProfileIdentityHero
    - Gated Connections page with feature flag
  - **Phase 3: Time Layer**
    - Calendar view already complete at `/me/calendar`
    - Search API enhanced with event search
    - Explore page already had full search functionality
  - **Phase 4: Power Layer**
    - Rituals detail page already complete with leaderboard
    - **Added "Complete Today" check-in button** with streak/points display
    - Rituals admin already complete in admin dashboard
    - HiveLab analytics already complete with full dashboard
- **Status updates:**
  - Notifications: NOT STARTED → 85% COMPLETE
  - Profiles & Social: NOT STARTED → 95% COMPLETE
  - Events/Calendar: NOT STARTED → 80% COMPLETE
  - Discovery: NOT STARTED → 90% COMPLETE
  - Rituals: Added as System 8, 95% COMPLETE

### 2026-02-02 (Evening)
- **FULL PLATFORM AUDIT & REFACTOR** — Comprehensive cleanup and documentation
  - **Created:** `docs/PLATFORM_AUDIT.md` — 500+ line comprehensive audit
    - Executive summary (92% production ready)
    - Orphaned code report (what was deleted and why)
    - System-by-system feature audit (8 systems with file paths)
    - Strategic value assessment (Ship now / Ready / Defer / Dead)
    - Design/UX gap analysis (motion, empty states, error states)
    - Navigation map (64 pages documented)
    - API health check (75+ routes categorized)
    - Database schema notes (21 collections)
    - Recommendations (immediate, short-term, medium-term)
  - **Deleted:** `docs/DESIGN_AUDIT.md` — Superseded by PLATFORM_AUDIT.md
  - **Deleted duplicate files (7 files):**
    - HiveLab " 2" duplicates (6 files)
    - `molecules/countdown.tsx` (unused)
  - **Added route redirects:**
    - `/calendar` → `/me/calendar`
    - `/notifications` → `/me/notifications`
    - `/settings` → `/me/settings`
    - `/hivelab` → `/lab`
  - **Applied motion tokens:**
    - `/me/connections` — Added staggerContainerVariants, revealVariants, cardHoverVariants
    - `/me/calendar` — Already had proper motion in EventCard
  - **Verified feature flag gating:**
    - AppShell: DM button gated by `dmsEnabled`
    - ProfileIdentityHero: Connect/Message buttons gated by props
    - /me/connections: Redirects when `connectionsEnabled` is OFF

### 2026-02-02 (Latest)
- **CLAUDE.MD RESTRUCTURE — Optimized for Claude**
  - Reduced from 600 lines to ~80 lines
  - Kept: Decision filter, Constraints, Patterns, File Map, Commands, Index
  - Moved: Systems → `docs/SYSTEMS.md`, Quality Standards → `docs/QUALITY_STANDARDS.md`
  - Deleted: ASCII diagrams, duplication, motivation prose
  - Added: Concrete file paths, code examples, pattern templates
  - Feature flags moved to `TODO.md` (runtime state)

- **CLAUDE.MD REWRITE — Startup Launch Standards** (earlier)
  - Shifted from "project completeness" to "startup launch" mindset
  - Background agents mapped: 64 pages, ~330+ API routes

### 2026-02-02 (Profile Completion)
- **PROFILE SYSTEM FULL COMPLETION** — All gaps closed
  - **Created:** `/api/profile/[userId]/activity` — Activity contributions API for heatmap
    - Fetches from `activitySummaries` collection (posts, comments, reactions, toolsUsed, messages)
    - Campus isolation enforced
    - Mock data for test users
    - Graceful degradation if collection unavailable
  - **Updated:** `use-profile-by-handle.ts` and `use-profile-page-state.ts`
    - Activity contributions now fetched from real API (was empty array stub)
    - Shared interests computed by comparing viewer interests with profile interests
    - `viewerIsBuilder` now uses `currentUser.isBuilder` from auth (was hardcoded `false`)
  - **Status:** Profiles & Social marked COMPLETE (was 95%)

### 2026-02-02
- **INFRASTRUCTURE CLEANUP** — Full audit and removal of unused code
  - **Dependencies removed (9 packages, 63 from lockfile):**
    - 3D stack: `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`, `@react-spring/three`
    - Animation: `gsap`, `@gsap/react`, `lenis`, `split-type`
  - **Dead API routes deleted (7 routes):**
    - `/api/feed/aggregation`, `/api/feed/algorithm`, `/api/feed/cache`
    - `/api/feed/space-filtering`, `/api/feed/content-validation`
    - `/api/realtime/sse`, `/api/realtime/metrics`
  - **Dead code deleted:**
    - `lib/email.ts` — Superseded by `email-service.ts`
    - `lib/platform-integration.ts` — Used dead feed APIs
    - `lib/cross-platform-notifications.ts` — Depended on platform-integration
    - `hooks/use-platform-integration.ts` — Wrapper for deleted code
    - `types/split-type.d.ts` — Type for removed package
  - **Tests removed:**
    - `performance.test.ts` — Depended on deleted infrastructure
    - `platform-integration.test.ts` — Tested deleted code
  - **Kept (actually used):**
    - `@sendgrid/mail` — Used by `email-service.ts` for moderation emails
    - Realtime routes: `/presence`, `/chat`, `/notifications`, `/typing`, `/channels`
    - Feed routes: `/route.ts`, `/search`, `/updates`
  - **Build verified:** Typecheck passes, build succeeds

### 2026-02-01
- **Audited Spaces system** — Found 95% complete, not 70% as documented
  - All 18 build tasks already implemented
  - 78 components across feed/, sidebar/, threshold/, residence/
  - useSpaceResidenceState (30K lines) orchestrates all data
  - APIs 95% wired with React Query + optimistic updates
- **Committed work in 7 logical commits:**
  1. feat(spaces): Split-panel residence layout (78 files, +12K lines)
  2. feat(entry): Narrative entry flow with acts (33 files, +4.7K lines)
  3. feat(admin): Spaces management dashboard (26 files, +4.8K lines)
  4. chore: Remove deprecated routes/hooks/tokens (53 files, -9.7K lines)
  5. fix(api): Improve validation, add endpoints (30 files, +3.3K lines)
  6. feat: Update design system tokens and UI (143 files, +18K lines)
  7. docs: Update TODO.md to reflect actual state
- **Marked COMPLETE:**
  - Spaces (was "IN PROGRESS")
  - Entry (was "NOT STARTED")
- **DESIGN AUDIT (evening)** — External design review via Playwright
  - **Screenshots captured:** 13 pages documented in `.playwright-mcp/audit/`
  - **Critical finding:** Marketing vs app shell are two different products
  - **Motion system:** 667 lines of tokens exist, 0 used in app shell
  - **Broken routes:** `/you` (404), `/s/*` (hooks crash), sidebar nav (broken)
  - **API failures:** People (401), Events (500), Tools (500)
  - **Documentation created:** `docs/DESIGN_AUDIT.md`
  - **Priority changed:** Foundation fixes before new features
  - **Status updates:**
    - Spaces: COMPLETE → BLOCKED (API errors prevent Space pages)
    - Discovery: NOT STARTED → BLOCKED (API errors)
    - Added System 0: Foundation (12 tasks)
