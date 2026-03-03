# Connective Tissue Spec

The hallways between surfaces. This spec defines every transition, CTA, notification, and data flow that turns Feed, Spaces, Build, and Profile into a single product loop instead of four separate screens.

---

## The Problem

HIVE has four surfaces that don't talk to each other:

- **Build** creates apps but doesn't push placement or distribution
- **Spaces** show apps but don't pull creation
- **Feed** shows spaces but not what's inside them
- **Profile** shows what you built but not whether anyone cared

A leader creates a poll. Then what? Where does it go? How do members find it? Does the leader know when someone votes? Today, these questions have no answers -- every transition is a dead end or a manual copy-paste of a URL.

---

## 1. The Core Loop

```
CREATE ──────> PLACE ──────> SHARE ──────> ENGAGE ──────> SEE IMPACT ──────> CREATE AGAIN
  |              |              |              |               |                  |
 Build        Build→Space    Space/Link     Space           Profile            Build
 /build       placement      notification   /s/[handle]     /u/[handle]        /build
              sheet          + copy link    member interacts stats update       "My Apps"
```

### Step-by-step data flow

| Step | Surface | Action | Data Created | Transition |
|------|---------|--------|-------------|------------|
| **Create** | Build `/build` | Leader types prompt, gets app | `tools/{toolId}` doc created | Auto-advance to placement |
| **Place** | Build (sheet) | Leader picks a space | `spaces/{spaceId}/deployments/{toolId}` created, `tools/{toolId}.placedIn[]` updated | Navigate to `/s/[handle]?tab=apps` |
| **Share** | Space + external | Push notification sent to members, leader copies link | `notifications` doc per member, link in clipboard | Members tap notification -> `/s/[handle]?app={toolId}` |
| **Engage** | Space `/s/[handle]` | Member votes/RSVPs/submits | `shell_states/{toolId}` updated (RTDB), `tool_analytics/{toolId}.views` incremented | Real-time update visible to all |
| **See Impact** | Profile `/u/[handle]` | Creator checks profile | `creatorStats` computed from tool data | Participation count + per-app impact lines visible |
| **Create Again** | Build `/build` | Creator sees My Apps, taps prompt | New `tools/{toolId}` doc | Loop restarts |

### The 60-second test

The entire loop from "I have an idea" to "my members are voting" must be completable in under 60 seconds:

- Classify prompt: ~500ms
- Shell match + config: ~3s (user edits options)
- Accept + create tool: ~1s
- Place in space (one tap if `?spaceId` present): ~500ms
- Notification delivery: ~2s (FCM)
- Member taps notification + loads app: ~2s

Total: ~10s of system time + ~50s of user decision time. The system is never the bottleneck.

---

## 2. Cross-Surface CTAs

Every surface must have at least one outbound link to every other surface. No surface is a dead end.

### Feed -> Space

**Where:** Every event card, every activity row, every space discovery card, every app card.

| Component | CTA | Target |
|-----------|-----|--------|
| Event card (Live Now, Today, This Week) | Tap card -> EventDetailDrawer -> "View space" | `/s/[handle]` |
| Space activity row | Tap row | `/s/[handle]` |
| App card ("Made by [Space]") | Tap attribution | `/s/[handle]` |
| Discover space card | Tap card | `/s/[handle]` |
| Discover space card | Join button | Join mutation + `/s/[handle]` on success |

**Implementation:** All existing. The `spaceHandle` field on `FeedEvent`, `FeedApp`, and `ActivityItem` provides the link target.

### Feed -> Build

**Where:** New Apps section footer.

| Component | CTA | Target |
|-----------|-----|--------|
| NewAppsSection | "Make your own" link at section bottom | `/build` |

**Implementation:** New. Add a footer link in `NewAppsSection` component.

### Feed -> Profile

**Where:** Future -- not launch. Creator attribution on app cards could link to profiles.

### Space -> Build

**Where:** Empty states, leader FAB, SparkleCreateSheet, dashboard.

| Component | CTA | Target | Context passed |
|-----------|-----|--------|---------------|
| Apps tab empty state (leader) | "Make an app" | `/build?spaceId={spaceId}` | `spaceId` pre-fills placement |
| SparkleCreateSheet (custom prompt) | Submit | `/build?spaceId={spaceId}&prompt={encoded}` | `spaceId` + `prompt` |
| LeaderCreateFAB > "Add App" | Tap | `/build?spaceId={spaceId}` | `spaceId` |
| LeaderDashboard > "Add Tool" | Tap | `/build?spaceId={spaceId}` | `spaceId` |
| LeaderReactivationCard | "Create a poll" / "Create an event" | `/build?spaceId={spaceId}` or CreateEventForm | `spaceId` |

**Context passing contract:** When Build receives `?spaceId`, it:
1. Fetches space metadata via `GET /api/spaces/{spaceId}` (name, handle, memberCount)
2. Displays "Building for [Space Name]" context pill above the prompt
3. After creation, auto-selects that space in the placement sheet (one-tap deploy)
4. After placement, navigates back to `/s/[handle]?tab=apps`

**Implementation:** The `spaceId` query param is already read in `build/page.tsx`. The context pill and auto-select in placement sheet are new.

### Build -> Space

**Where:** Post-creation placement flow, My Apps cards.

| Component | CTA | Target |
|-----------|-----|--------|
| Complete phase (created from space) | "Add to [Space Name]" (primary) | `POST /api/tools/{toolId}/deploy` then navigate to `/s/[handle]?tab=apps` |
| Complete phase (created from /build) | "Place in a Space" | Opens SpacePlacementSheet, then navigate to `/s/[handle]?tab=apps` |
| My Apps card (placed) | Tap space name | `/s/[handle]` |
| My Apps card ("Not placed yet") | "Place in a Space" | Opens SpacePlacementSheet |

**Return navigation:** After placement, `router.push(/s/${handle}?tab=apps)`. The space page reads the `tab` query param and sets `SpaceTabs` to the Apps tab. `SpaceAppsTab` calls `refreshTools()` to show the newly placed app.

### Build -> Profile

**Where:** Post-creation confirmation, My Apps section.

| Component | CTA | Target |
|-----------|-----|--------|
| Complete phase | "View your apps" (tertiary) | `/me` (redirects to `/u/[handle]`) |
| My Apps section header | "See all on profile" | `/me` |

**Implementation:** Simple links. No context passing needed.

### Profile -> Build

**Where:** Builder Showcase empty state, Stats Row.

| Component | CTA | Target |
|-----------|-----|--------|
| Builder Showcase empty state (own profile) | "Build your first app" | `/build` |
| After viewing own apps | "Create your next app" | `/build` |

**Implementation:** Existing links in `ProfilePageContent.tsx`. Verify they point to `/build` (not `/lab`).

### Profile -> Space

**Where:** Campus Identity zone (space cards).

| Component | CTA | Target |
|-----------|-----|--------|
| BelongingSpaceCard | Tap card | `/s/[handle]` |

**Implementation:** Existing. `router.push(/s/${spaceHandle})` in `ProfileBelongingSpaceCard`.

### Space -> Profile

**Where:** Member cards, message author names, event organizer names.

| Component | CTA | Target |
|-----------|-----|--------|
| MembersList > member row | Tap | `/u/[handle]` |
| Chat message > author name | Tap | `/u/[handle]` |
| Event organizer name | Tap | `/u/[handle]` |

**Implementation:** Member list links exist. Chat message author links may need to be added -- verify `ChatMessageBubble` has a tappable author name that navigates to `/u/[handle]`.

---

## 3. Notification-Driven Transitions

Notifications are the invisible hallways -- they pull users back into the product and land them on the right surface.

### Notification Triggers

| Trigger | When | Who receives | Notification text | Lands on |
|---------|------|-------------|-------------------|----------|
| **App placed in space** | After `POST /api/tools/{toolId}/deploy` | All space members (except creator) | "[Creator] added [App Name] to [Space]" | `/s/[handle]?app={toolId}` |
| **Someone used your app** | On first interaction with a tool (vote, RSVP, submit) by a unique user | Tool creator only | "[User] used your [App Name]" | `/t/{toolId}` or `/build/{toolId}` (own app) |
| **Usage milestone** | When app reaches 10, 25, 50, 100 uses | Tool creator only | "Your [App Name] just hit [N] [votes/RSVPs/uses]!" | `/build/{toolId}` |
| **New event in space** | After event creation in a space | All space members (except creator) | "[Space] has a new event: [Title]" | `/s/[handle]?tab=events` |
| **Event starting soon** | 30 min before event start | Users who RSVP'd "Going" | "[Event Title] starts in 30 minutes" | `/e/{eventId}` (event detail page) or EventDetailDrawer |
| **Someone joined your space** | After join mutation | Space leader only | "[User] joined [Space]" | `/s/[handle]` |
| **Space claimed** | After `POST /api/spaces/claim` | Users who expressed interest | "[Space] was just claimed! Check it out." | `/s/[handle]` |
| **New chat message** (existing) | After message sent in space | All space members (except sender) | "[Sender] in [Space]: [preview]" | `/s/[handle]` |

### Notification Delivery

All notifications use the existing `notification-delivery-service.ts` and `notification-service.ts`:

1. **In-app:** Stored in Firestore `notifications/{userId}/items/{notificationId}`. Read by `useUnreadNotifications` hook. Displayed in notifications panel at `/me/notifications`.
2. **Push (FCM):** Sent via `fcm-client.ts` for users with push enabled. Service worker at `firebase-messaging-sw.js` handles background delivery.

### Notification-to-Surface Routing

When a user taps a notification (in-app or push), the `targetUrl` field determines where they land:

```typescript
interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  targetUrl: string;        // The deep link
  imageUrl?: string;        // Space/app/user avatar
  createdAt: Timestamp;
  read: boolean;
}

// targetUrl patterns:
// App placed:        /s/{handle}?app={toolId}
// App used:          /build/{toolId}
// Usage milestone:   /build/{toolId}
// New event:         /s/{handle}?tab=events
// Event starting:    /e/{eventId}
// Someone joined:    /s/{handle}
// Space claimed:     /s/{handle}
// Chat message:      /s/{handle}
```

### What We're NOT Building (Notifications)

- Notification preferences per type (post-launch)
- Digest/batch notifications ("3 new things in your spaces")
- Email notifications
- SMS notifications
- "Someone viewed your profile" notifications (privacy anti-pattern)
- Cross-space activity aggregation ("5 spaces had activity today")

---

## 4. Context Passing

When a user transitions between surfaces, context must travel with them. No surface should feel like a fresh start.

### Space -> Build (`?spaceId`)

Already described in Section 2. The contract:

```typescript
// URL: /build?spaceId={spaceId}&prompt={encodedPrompt}

// Build page reads on mount:
const searchParams = useSearchParams();
const spaceId = searchParams.get('spaceId');
const prompt = searchParams.get('prompt');

// If spaceId present:
// 1. Fetch space metadata (name, handle, memberCount)
// 2. Show "Building for [Space Name]" pill
// 3. Pre-select space in placement sheet after creation
// 4. After placement: router.push(`/s/${spaceHandle}?tab=apps`)

// If prompt present:
// 1. Pre-fill the prompt textarea
// 2. Auto-submit after a 500ms delay (user sees the prompt before it fires)
```

### Feed -> Space (app context)

When a user taps an app card in the feed, they should see the app within its space context:

```typescript
// URL: /s/{handle}?app={toolId}

// Space page reads on mount:
const appId = searchParams.get('app');

// If appId present:
// 1. Switch to Apps tab
// 2. Scroll to the specific app card
// 3. Auto-open the app in inline mode (or navigate to /s/{handle}/tools/{toolId})
```

**Implementation:** Add `app` query param handling to `SpacePage`. When present, set active tab to "Apps" and highlight/scroll to the specified tool.

### Space -> Space (tab context)

When navigating to a space with a specific tab:

```typescript
// URL: /s/{handle}?tab=events|apps|posts|chat

// Space page reads on mount:
const tab = searchParams.get('tab');
// If tab present, set initial active tab. Default is 'chat'.
```

**Implementation:** Already partially implemented. Verify `SpaceTabs` reads the `tab` query param.

### Profile viewing context

When viewing another user's profile, the viewer's context enriches the display:

```typescript
// Computed in useProfileByHandle:
const sharedSpaces = viewerSpaces.filter(s => profileSpaces.includes(s));
const mutualConnections = viewerConnections.filter(c => profileConnections.includes(c));
const isBothBuilder = viewerToolCount > 0 && profileToolCount > 0;

// Rendered in ContextBanner:
// "2 shared spaces, 3 mutual friends"
// "You're both builders" badge
```

**Implementation:** Existing in `ContextBanner` and `useProfileByHandle`.

### Build -> Profile (app created context)

After creating an app, the Profile surface should reflect it immediately:

```typescript
// No special context passing needed.
// Profile fetches tools via GET /api/tools?userId={userId}
// React Query cache invalidation:
// After tool creation in Build, invalidate the 'user-tools' query key.
// queryClient.invalidateQueries({ queryKey: ['user-tools', userId] });
```

---

## 5. Bottom Navigation Behavior

Four tabs: **Home** | **Spaces** | **Make** | **You**

### Tab Definitions (from `navigation.ts`)

| Tab | Label | Href | Match Pattern | Active Color |
|-----|-------|------|--------------|--------------|
| Home | Home | `/discover` | `/discover`, `/feed`, `/events` | White |
| Spaces | Spaces | `/discover` | `/s/` | White |
| Make | Make | `/build` | `/build`, `/lab` | Green (#10B981) |
| You | You | `/me` | `/me`, `/profile`, `/settings`, `/u/` | White |

### The Spaces Tab Problem

Both Home and Spaces currently point to `/discover`. This means tapping Spaces does the same thing as tapping Home -- a confusing no-op.

**Resolution:** The Spaces tab should behave differently based on context:

| State | Spaces tab behavior |
|-------|-------------------|
| User has 0 spaces | Navigate to `/discover` (same as Home -- space discovery IS the right action) |
| User has 1+ spaces | Navigate to the most recently active space: `/s/[mostRecentHandle]` |
| User is currently in `/s/[handle]` | Spaces tab shows as active (match pattern `/s/`), tapping navigates to next most recent space or `/discover` |

**Implementation change in `navigation.ts`:**

```typescript
// Spaces tab href becomes dynamic:
{
  id: 'spaces',
  label: 'Spaces',
  href: '/discover',  // Default fallback
  getHref: (context: { mySpaces: MySpace[] }) => {
    if (context.mySpaces.length === 0) return '/discover';
    // Sort by lastActivityAt, return most recent
    const sorted = [...context.mySpaces].sort(
      (a, b) => (b.lastActivityAt ?? 0) - (a.lastActivityAt ?? 0)
    );
    return `/s/${sorted[0].handle}`;
  },
  icon: SpacesIcon,
  matchPattern: /^\/s\//,
}
```

**Alternative (simpler, recommended for launch):** Keep Spaces pointing to `/discover` but add a "Your Spaces" section at the top of the discover page when the user has joined spaces. This avoids the complexity of dynamic tab hrefs and gives the Spaces tab a clear identity: "find and browse your communities."

### Tab Badges

| Tab | Badge type | Source | When visible |
|-----|-----------|--------|-------------|
| Home | Activity dot (gold, 7px) | New events since last visit | When unseen events exist in feed (tracked via localStorage `hive:feed:lastSeen`) |
| Spaces | Unread count (gold pill) | Sum of unread messages across all joined spaces | When `mySpaces.reduce((sum, s) => sum + s.unreadCount, 0) > 0` |
| Make | None | -- | -- |
| You | Unread notifications count (gold pill) | `useUnreadNotifications` | When `unreadCount > 0` |

**Current implementation:**
- **You tab** already shows notification badge via `useUnreadNotifications` in `MobileBottomBar`
- **Spaces tab** badge is new -- requires passing `mySpaces` unread sum to `MobileNavItem`
- **Home tab** badge is new -- requires tracking feed "last seen" timestamp
- **Make tab** stays clean -- creation is pull, not push

**Implementation for Spaces badge:**

In `MobileBottomBar`, compute and pass the unread count:

```typescript
const spacesUnread = mySpaces.reduce((sum, s) => sum + (s.unreadCount || 0), 0);

// In the nav items map:
badge={item.id === 'you' ? unreadCount : item.id === 'spaces' ? spacesUnread : undefined}
```

**Implementation for Home badge:**

Deferred to post-launch. The feed changes daily (time-based content), so "new since last visit" is hard to define meaningfully. A simple activity dot on first daily visit could work but risks becoming noise.

### Desktop Sidebar

The `LeftSidebar` already shows:
- Nav items with active indicator (2px gold bar)
- Spaces quick-access list with unread counts (gold pills) and online indicators (green dots)
- Search and Notifications at the bottom

**What changes:**
- Add the Spaces tab badge (unread sum) to the sidebar nav item when collapsed (rail mode)
- The expanded sidebar already shows per-space unread counts, which is better than a single badge

---

## 6. Deep Linking

Every important object in HIVE must have a shareable URL that works when pasted into a group chat, social media, or messaging app.

### URL Patterns

| Object | URL pattern | Auth required | Works without account |
|--------|------------|---------------|----------------------|
| Space | `/s/{handle}` | Yes (campus member) | No -- redirects to `/enter?redirect=/s/{handle}` |
| App (in space) | `/s/{handle}/tools/{toolId}` | Yes (space member or public) | No |
| App (standalone) | `/t/{toolId}` | No (public tools) | Yes -- this is the viral URL |
| Event | `/e/{eventId}` | Yes (campus member) | No |
| Event (in space) | `/s/{handle}?tab=events&event={eventId}` | Yes | No |
| Profile | `/u/{handle}` | Yes (campus member) | No |
| Build (with prompt) | `/build?prompt={encoded}` | Yes | No |
| Build (for space) | `/build?spaceId={spaceId}` | Yes | No |

### The Viral URL: `/t/{toolId}`

This is the most important URL in HIVE. When a student shares a poll link in their GroupMe, the recipient must be able to:

1. Open the URL without logging in
2. See the poll and vote
3. See "Made with HIVE" branding at the bottom
4. Tap "Make your own" to download/open HIVE

**Current implementation:** `/t/[toolId]` is in the `PUBLIC_ROUTES` array in middleware -- no auth required. The `StandaloneToolClient` component renders the tool with HIVE branding.

**What to verify:**
- Shell tools (poll, bracket, RSVP) render and are interactive without auth
- Voting/submitting writes to RTDB `shell_states/{toolId}` without requiring a user session (anonymous interaction)
- "Made with HIVE" footer links to the app store / landing page
- OG meta tags are set correctly for link previews (title, description, image)

### OG Meta Tags for Link Previews

When a HIVE link is pasted into iMessage, GroupMe, Instagram, or Slack, it must render a rich preview.

| URL | OG Title | OG Description | OG Image |
|-----|----------|---------------|----------|
| `/t/{toolId}` | "{App Name}" | "{Description}" or "Made by {Space}" | `/api/og/tool/{toolId}` (already exists) |
| `/s/{handle}` | "{Space Name}" | "{Description}" or "{N} members" | Space avatar or generated OG image |
| `/e/{eventId}` | "{Event Title}" | "{Date} at {Location}" | Event cover image or generated OG |
| `/u/{handle}` | "{Name} on HIVE" | "{Bio}" or "Student at UB" | Profile avatar |

**Implementation:** `/api/og/tool/[toolId]/route.tsx` already generates OG images for tools. Add similar routes for spaces, events, and profiles.

### Deep Link Registration

For the PWA to handle deep links when installed:

```json
// manifest.json - already exists
{
  "share_target": {
    "action": "/build",
    "method": "GET",
    "params": {
      "text": "prompt"
    }
  }
}
```

This means when a user shares text TO HIVE from another app, it opens Build with the shared text as a prompt. Verify this works in the existing `manifest.json`.

---

## 7. Flow Diagram: The Overwhelmed Org Leader

Tracing the full loop for the primary persona:

```
Maya (org leader, 60-person engineering club) opens HIVE on her phone.

                                    +-----------+
                                    |  OPEN APP |
                                    +-----------+
                                         |
                                         v
                              +-------------------+
                              | HOME (Feed)       |
                              | Sees campus events|
                              | Sees her space in |
                              | "Your Spaces"     |
                              +-------------------+
                                    |
                            [Taps her space]
                                    |
                                    v
                              +-------------------+
                              | SPACE /s/ub-eng   |
                              | Chat tab active   |
                              | Context Bar shows |
                              | "Meeting tomorrow"|
                              +-------------------+
                                    |
                       [Taps SparkleCreateSheet]
                       [Types "Best project topic for next semester"]
                                    |
                                    v
                              +-------------------+
                              | Detected: POLL    |
                              | Shows config:     |
                              | Q: Best project   |
                              | Options extracted  |
                              +-------------------+
                                    |
                            [Taps "Create"]
                                    |
                                    v
                              +-------------------+
                              | COMPLETE           |
                              | "Add to UB Eng"   | <-- auto-selected (spaceId in context)
                              | [Place] (primary)  |
                              +-------------------+
                                    |
                              [Taps "Place"]
                                    |
                                    v
                              +-------------------+
                              | SHARE SHEET        |
                              | [x] Notify members |
                              | [Copy link]        |
                              +-------------------+
                                    |
                           [Taps "Share"]
                                    |
                    +---------------------------------+
                    |                                 |
                    v                                 v
          +------------------+              +-----------------+
          | 60 members get   |              | Maya sees toast |
          | push: "Maya      |              | "Added to UB    |
          | added Best       |              | Engineering"    |
          | Project Poll"    |              | Navigated to    |
          |                  |              | /s/ub-eng?tab=  |
          +------------------+              | apps            |
                    |                       +-----------------+
                    v
          +------------------+
          | Member taps      |
          | notification     |
          | -> /s/ub-eng?    |
          |    app={pollId}  |
          | Votes on poll    |
          +------------------+
                    |
                    v
          +------------------+              +-----------------+
          | RTDB updated     |  -------->   | Maya gets notif |
          | shell_states/    |              | "Alex used your |
          | {pollId}         |              | Best Project    |
          | .voteCounts++    |              | Poll"           |
          +------------------+              +-----------------+
                                                    |
                                            [Opens profile]
                                                    |
                                                    v
                                            +-----------------+
                                            | PROFILE /u/maya |
                                            | "47 people      |
                                            | participated"   |
                                            | Featured: Poll  |
                                            | 47 votes        |
                                            +-----------------+
                                                    |
                                            [Thinks: "That worked.
                                             I should make an RSVP
                                             for the meeting."]
                                                    |
                                                    v
                                            +-----------------+
                                            | BUILD /build    |
                                            | My Apps: 1 app  |
                                            | (the poll)      |
                                            | Types new prompt|
                                            +-----------------+
                                                    |
                                              LOOP RESTARTS
```

---

## 8. Graceful Degradation at Cold Start

At launch, many connections will be empty. The system must feel intentional, not broken.

### What's empty and how it degrades

| Connection | Empty when | Degradation |
|-----------|-----------|-------------|
| Feed -> Space activity | User hasn't joined any spaces | "Your Spaces" section hidden. Discover section always visible (650+ pre-seeded spaces). |
| Feed -> New Apps | No apps exist on campus | "New Apps" section hidden entirely. No empty state -- absence is better than "No apps yet." |
| Space -> Build (creation CTAs) | Non-leader viewing space | No "Make an app" CTAs shown to members. Members see content, not creation prompts. |
| Space -> apps tab | Space has 0 apps | Leader: "No apps in this space yet. Be the first to make one." + CTA. Member: "No apps in this space yet." (no CTA). |
| Build -> My Apps | Creator has built 0 apps | "Apps you make show up here. Try typing what you need above." |
| Build -> Browse | 0 published apps on campus | Section hidden. Returns when first app is published. |
| Profile -> Builder Showcase | User has built 0 apps | Own profile: "Build your first app to unlock your portfolio" + CTA to `/build`. Other profiles: Zone 2 hidden entirely. |
| Profile -> Reach stat | User has 0 apps | Reach stat hidden from Stats Row. Shows 3 stats (Spaces, Friends, Apps) instead of 4. |
| Notifications | No activity | Empty state at `/me/notifications`: "No notifications yet. Things will show up here as your spaces come alive." |
| Spaces tab badge | User has 0 spaces or 0 unread | Badge hidden. Clean tab. |

### The floor

Even at absolute zero (brand new campus, 0 user-generated content):

1. **Feed** always has Discover section (650+ pre-seeded spaces with real events)
2. **Spaces** has 650+ browsable spaces with CampusLabs data
3. **Build** has the prompt input and quick-start chips (creation works without any prior content)
4. **Profile** has the identity hero with name, handle, academic info (exists from onboarding)

No screen is ever fully empty. Every screen has a next action.

---

## 9. Navigation Invariants

Rules that must hold across all surface transitions.

### Back navigation

| From | Back goes to | Method |
|------|-------------|--------|
| Space (from Feed tap) | Feed | Browser back / router.back() |
| Space (from notification) | Home (Feed) | Browser back goes to notification source, which may be external. Default to `/discover`. |
| Build (from Space CTA) | Space | Browser back / router.back() |
| Build studio (`/build/{toolId}`) | Build home | Browser back |
| Profile (from Space member list) | Space | Browser back / router.back() |
| Event detail (`/e/{eventId}`) | Previous surface | Browser back |

**Rule:** Never trap users. Every navigation must be reversible via the system back gesture (swipe right on iOS, back button on Android, browser back on desktop).

### URL state preservation

When a user navigates away from a surface and returns:

| Surface | State preserved | How |
|---------|----------------|-----|
| Feed | Scroll position | React Query cache + scroll restoration (Next.js default) |
| Space | Active tab, scroll position within tab | Query param (`?tab=`) + scroll restoration |
| Build | Prompt text (if not submitted), My Apps list | React state (lost on hard refresh, acceptable) |
| Build studio | Current iteration, code state | Persisted to Firestore (auto-save) |
| Profile | Scroll position | Scroll restoration |

### Tab state independence

Each bottom nav tab maintains independent navigation stacks:

- Tapping an already-active tab scrolls to top (standard mobile behavior)
- Tapping a different tab switches to it, preserving the previous tab's state
- Long-pressing a tab could show recent destinations (post-launch, not now)

---

## 10. Notification Delivery Implementation

### Trigger Points (where to add notification calls)

| Trigger | Code location | Function to call |
|---------|--------------|-----------------|
| App placed in space | `space-deployment.service.ts` > `placeTool()` | `notifySpaceMembers('tool_placed', { toolId, spaceName, creatorName })` |
| First interaction with app | Shell state handlers (poll vote, RSVP submit, etc.) | `notifyToolCreator('tool_used', { toolId, userName })` after checking `isFirstInteractionByUser` |
| Usage milestone | Shell state handlers (after incrementing count) | `notifyToolCreator('tool_milestone', { toolId, count })` when count crosses threshold |
| New event in space | Event creation endpoint | `notifySpaceMembers('event_created', { eventId, spaceName, title })` |
| Event starting soon | Cron job or Cloud Function scheduled 30min before | `notifyEventAttendees('event_starting', { eventId, title })` |
| Someone joined space | Join endpoint | `notifySpaceLeader('member_joined', { spaceName, userName })` |
| Space claimed | Claim endpoint | `notifyInterestedUsers('space_claimed', { spaceName })` |

### Notification Templates

```typescript
const NOTIFICATION_TEMPLATES = {
  tool_placed: {
    title: (data) => data.spaceName,
    body: (data) => `${data.creatorName} added ${data.toolName}`,
    targetUrl: (data) => `/s/${data.spaceHandle}?app=${data.toolId}`,
  },
  tool_used: {
    title: (data) => data.toolName,
    body: (data) => `${data.userName} used your app`,
    targetUrl: (data) => `/build/${data.toolId}`,
  },
  tool_milestone: {
    title: (data) => data.toolName,
    body: (data) => `Your app just hit ${data.count} ${data.metricLabel}!`,
    targetUrl: (data) => `/build/${data.toolId}`,
  },
  event_created: {
    title: (data) => data.spaceName,
    body: (data) => `New event: ${data.title}`,
    targetUrl: (data) => `/s/${data.spaceHandle}?tab=events`,
  },
  event_starting: {
    title: (data) => data.title,
    body: () => 'Starting in 30 minutes',
    targetUrl: (data) => `/e/${data.eventId}`,
  },
  member_joined: {
    title: (data) => data.spaceName,
    body: (data) => `${data.userName} joined your space`,
    targetUrl: (data) => `/s/${data.spaceHandle}`,
  },
  space_claimed: {
    title: (data) => data.spaceName,
    body: () => 'This space was just claimed! Check it out.',
    targetUrl: (data) => `/s/${data.spaceHandle}`,
  },
};
```

### Rate Limiting Notifications

To avoid notification fatigue:

| Notification type | Rate limit |
|------------------|------------|
| `tool_used` | Max 1 per tool per hour (batch: "3 people used your poll") |
| `tool_milestone` | Once per threshold (10, 25, 50, 100) |
| `event_starting` | Once per event |
| `member_joined` | Max 5 per day per space (batch: "3 new members joined") |
| `tool_placed` | Once per placement |
| `event_created` | Once per event |
| `space_claimed` | Once per space |
| Chat messages | Existing rate limiting in notification service |

---

## 11. What We're NOT Building

| Feature | Why not |
|---------|---------|
| Universal activity feed (all-campus activity stream) | Creates noise, not signal. The sectioned feed with temporal structure is better. |
| Notification preferences UI | Ship all notifications on by default. Per-type toggles are a post-launch refinement when we know which ones users actually disable. |
| Cross-space activity aggregation | "5 spaces had activity" is meaningless. Per-space unread counts in the sidebar are more actionable. |
| Smart notification batching | Simple rate limits are sufficient at launch volume. ML-based batching requires usage data we don't have. |
| In-app notification center (beyond list) | A simple list at `/me/notifications` is enough. No categories, no filters, no mark-all-as-read-by-type. |
| Transition animations between surfaces | Page transitions use Next.js default (instant swap with skeleton). Custom page-to-page animations add complexity for minimal value. The existing `PageTransition` component in the shell layout handles basic fades. |
| Breadcrumb navigation | The bottom nav + browser back is sufficient. Breadcrumbs add visual clutter for a 4-surface app. |
| Activity indicators on bottom nav (animated) | A simple badge count or dot is sufficient. Animated badges are attention-grabbing dark patterns. |

---

## 12. Implementation Priority

### P0 -- Launch blockers (the loop must close)

| Task | Where | What |
|------|-------|------|
| Space context pill in Build | `build/page.tsx` | Show "Building for [Space]" when `?spaceId` present |
| Auto-select space in placement sheet | `SpacePlacementSheet` (new) | Pre-select the originating space |
| Post-placement navigation to space | Build complete phase | `router.push(/s/${handle}?tab=apps)` |
| `?tab=` param handling in Space | `space/page.tsx` | Read tab param, set initial active tab |
| `?app=` param handling in Space | `space/page.tsx` | Switch to Apps tab, highlight tool |
| Push notification on app placement | `space-deployment.service.ts` | Call notification service after `placeTool()` |
| "Not placed yet" indicator on My Apps | `MyAppCard` (new) | Amber badge linking to placement sheet |
| Spaces tab badge (unread sum) | `MobileBottomBar`, `LeftSidebar` | Sum unread across mySpaces, pass as badge |

### P1 -- Creator feedback loop

| Task | Where | What |
|------|-------|------|
| "Someone used your app" notification | Shell state handlers | Notify creator on first unique interaction |
| Usage milestone notifications | Shell state handlers | Notify at 10, 25, 50, 100 |
| Profile Reach stat | `ProfileStatsRow` | Replace "activity count" with unique user reach |
| Per-app impact lines | `ProfileFeaturedToolCard`, `ProfileToolsCard` | "47 votes" instead of "47 runs" |

### P2 -- Polish

| Task | Where | What |
|------|-------|------|
| OG images for spaces, events, profiles | New API routes | Rich link previews in group chats |
| Home tab activity dot | `MobileBottomBar` | Track feed "last seen" |
| Chat author name links to profile | `ChatMessageBubble` | Tappable author -> `/u/[handle]` |
| Event starting soon notification | Cloud Function | Scheduled 30min before event start |

---

## Evals

### Value prop
The connective tissue turns four separate screens into a product loop. A creator's work flows from Build to Space to Feed to Profile and back. Every transition is intentional, every notification drives a return visit, and no surface is a dead end.

### Scenario
Maya, an org leader, creates a poll from her space. Where does it go? She shares it. How do members find it? Someone votes. Does Maya know? She checks her impact. Does she create again?

### Perspectives to run
- `overwhelmed-org-leader` -- Can she complete the full loop (create -> place -> share -> see impact) without getting lost?
- `lonely-freshman` -- When they tap a notification, do they land somewhere that makes sense? Do they ever hit a dead end?
- `returning-skeptic` -- Are there enough pull mechanisms (notifications, badges, fresh content) to bring them back?
- `thursday-night-sophomore` -- Can they share a poll link in their group chat and have it work for friends who aren't on HIVE?

### Implementation files
- `apps/web/src/lib/navigation.ts`
- `apps/web/src/components/shell/AppSidebar.tsx`
- `apps/web/src/app/(shell)/layout.tsx`
- `apps/web/src/middleware.ts`
- `apps/web/src/lib/notification-service.ts`
- `apps/web/src/lib/notification-delivery-service.ts`
- `apps/web/src/app/(shell)/build/page.tsx`
- `apps/web/src/app/s/[handle]/page.tsx`
- `apps/web/src/app/(shell)/u/[handle]/ProfilePageContent.tsx`
- `apps/web/src/app/(shell)/discover/page.tsx`
