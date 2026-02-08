# Notifications, Real-Time, and Engagement System

Comprehensive ideation document based on deep codebase audit. Every recommendation references actual files, actual patterns, and actual gaps.

---

## Current State Summary

**What exists and works:**
- Notification service with 17 typed notification creators (`apps/web/src/lib/notification-service.ts`)
- Delivery service with SendGrid email + FCM push paths (`apps/web/src/lib/notification-delivery-service.ts`)
- SSE streaming endpoint for real-time notification delivery (`apps/web/src/app/api/notifications/stream/route.ts`)
- Notification bell component with space-grouped dropdown (`apps/web/src/components/notifications/hive-notification-bell.tsx`)
- Full notifications page at `/me/notifications` with filter tabs
- Push notification permission flow with 7-day cooldown (`apps/web/src/hooks/use-push-notifications.ts`)
- FCM token registration API (`/api/profile/fcm-token`)
- Firebase Cloud Functions for message/event/invitation push (`infrastructure/firebase/functions/src/notifications.ts`)
- Presence hook with heartbeat, visibility change, beforeunload (`apps/web/src/hooks/use-presence.ts`)
- Presence service class with ghost mode (`packages/core/src/services/presence-service.ts`)
- PresenceDot and ActivityPresence UI components (`packages/ui/src/identity/presence.tsx`)
- Unread count hooks for boards (`apps/web/src/hooks/use-unread-count.ts`)
- Typing indicators via both Firestore and Firebase RTDB (`apps/web/src/lib/firebase-realtime.ts`)
- Notification settings UI with email/push/in-app/quiet hours/per-space mute (`apps/web/src/app/settings/components/notification-sections.tsx`)
- Behavioral notification type system (`packages/ui/src/types/notifications.ts`)
- Notification sound playback

**What is broken or hollow:**
- Notification bell is NOT in the AppShell -- built but not mounted (`apps/web/src/components/layout/AppShell.tsx` has no bell import)
- Email delivery requires `SENDGRID_API_KEY` env var -- not configured (logs warning)
- `useTotalUnreadCount()` returns hardcoded 0 ("would ideally use a Cloud Function")
- Online presence counts show 0 because presence writes use Firestore (no `onDisconnect` support) and cleanup relies on TTL that is never enforced
- Activity feed (`unified-activity-feed.tsx`) is functional but only shows data if space boards have messages -- no cross-space activity generation
- Two conflicting notification hooks: `use-notifications.ts` (Firestore subcollection `notifications/{uid}/userNotifications`) vs `use-realtime-notifications.ts` (SSE + API polling against root `notifications` collection) -- different data models
- Notification API route lacks campusId filtering on queries (violates the campus isolation constraint)
- `useNotificationStream` SSE fallback polling calls `/api/notifications?limit=50` without auth header

---

## 1. Notification Types and Priority

### What matters for a campus platform

College students have radically different notification tolerances than general consumers. They are hyper-social but also juggling classes, deadlines, and sleep deprivation. The notification types that matter:

**Tier 1 -- Time-Sensitive (push + in-app, always)**
- Event starting in 15 min (existing type: `event_reminder`)
- Direct message from a friend (existing Cloud Function: `onNewMessage`)
- Mention in a space you are active in (existing type: `mention`)
- Emergency/campus safety alerts (setting exists: `push.emergencyAlerts`)

**Tier 2 -- Action Required (push during active hours, always in-app)**
- Space invite from someone you know (existing type: `space_invite`)
- Builder request approved/rejected (existing types: `builder_approved`, `builder_rejected`)
- Role change in your space (existing type: `space_role_change`)
- RSVP confirmation for event you signed up for

**Tier 3 -- Social Signal (in-app only, batched push)**
- Someone liked your post (existing type: `like`)
- Comment on your post (existing type: `comment`)
- Reply to your comment (existing type: `comment_reply`)
- New connection (existing type: `connection_new`)
- Someone joined your space (existing type: `space_join`)

**Tier 4 -- Ambient Awareness (in-app only, never push)**
- New event in a space (existing type: `space_event_created`)
- New tool deployed (existing type: `tool_deployed`)
- Ritual check-in reminder (existing type: `ritual_checkin`)
- System announcements

### Options

**Option A: Priority field on the notification document.**
Add a `priority: 'critical' | 'high' | 'medium' | 'low'` field to the `CreateNotificationParams` in `notification-service.ts`. The delivery service checks priority to decide push vs in-app only. The `HiveNotification` type in `packages/ui/src/types/notifications.ts` already has a `priority` field -- unify it with the server-side type.
- What breaks: Need to backfill priority for existing notifications. Need to update `createNotification()` and all 17+ convenience functions.

**Option B: Derive priority from type + context at delivery time.**
Build a `getDeliveryChannels(type, category, metadata)` function in `notification-delivery-service.ts` that returns `{ push: boolean, email: boolean, inApp: boolean }`. No schema changes needed. Logic is centralized.
- What breaks: Priority logic is invisible to the client -- the bell cannot sort by priority without the data.

**Option C: Both -- store priority AND derive channels.**
Priority is set at creation time based on type mapping. Delivery channels are derived from priority + user preferences. Bell UI can sort/filter by priority. This is the cleanest long-term path.
- What breaks: More code upfront. But every notification type already has a natural priority tier, so the mapping is mechanical.

**Recommendation:** Option C. The type-to-priority mapping is a simple lookup table. The delivery service already has the plumbing for conditional email/push/in-app. Wire them together.

---

## 2. The Notification Bell

### Current State

`HiveNotificationBell` exists at `apps/web/src/components/notifications/hive-notification-bell.tsx`. It is a fully built Popover with:
- Space-grouped collapsible sections
- Unread count badge (spring animation)
- Mark all read button
- "View all notifications" footer linking to `/me/notifications`
- 5 notifications per group before "+N more"
- Relative timestamps (now, 5m, 3h, 2d)

But it is NOT mounted anywhere. `AppShell.tsx` does not import or render it. The sidebar has Home/Spaces/Lab/You nav items and a DM button, but no bell.

### Where should it go?

**Option A: Top of sidebar, next to logo.**
Put the bell icon in the header row of the sidebar (line 82 area of `AppShell.tsx`), right-aligned next to the HIVE logo. The popover drops down from there on desktop. On mobile, it goes in the sticky header bar (line 444).
- What breaks: Sidebar header is currently just the logo with a breathing animation. Adding a bell changes the visual rhythm. On mobile, the header is centered on the logo mark -- adding a bell makes it asymmetric.

**Option B: Dedicated nav item.**
Add a 5th nav item to `NAV_ITEMS` in `apps/web/src/lib/navigation.ts`: `{ id: 'notifications', label: 'Alerts', href: '/me/notifications', icon: BellIcon }`. Badge count rendered inline. No popover -- clicking always goes to the full page.
- What breaks: The 4-pillar IA (Home/Spaces/Lab/You) was intentional. Adding a 5th breaks the symmetry of the bottom nav on mobile. Also, full-page navigation for every notification check is friction that kills engagement.

**Option C: Floating action in the sidebar footer, between DMs and profile.**
Put the bell in the utilities section where DMs already live (line 150 area). Bell gets the same treatment as the Messages button -- icon + label + unread badge. Popover opens on click for quick glance; "View all" goes to full page.
- What breaks: The DMs section is feature-flagged. If DMs are disabled, the bell would sit alone in that section, which looks odd. Also, the popover would open from the bottom-left of the screen, which is unusual.

**Recommendation:** Option A. The bell belongs in the header. It is the global status indicator. The sidebar header has room for it. The mobile header already has a centered logo -- put the bell to the right of it, matching the standard mobile pattern (logo center, bell right). The popover implementation is already built with `align="end"` which works perfectly from a top-right position.

### Dropdown improvements needed

The current bell groups by space, which is correct for a campus platform. Specific enhancements:

1. **Actionable notifications.** Space invites should have "Accept / Decline" buttons inline. Event notifications should have "RSVP" inline. The `actionUrl` field already exists but is used only for navigation -- add `actions?: Array<{ label: string, action: string }>` to the notification metadata.

2. **Actor avatars.** The current bell shows no avatars. The `metadata.actorId` exists on every notification but the avatar URL is not stored. Either store `actorAvatarUrl` at notification creation time (denormalize) or fetch it client-side (N+1 problem). Denormalize -- avatar URLs rarely change.

3. **Smart grouping.** "Alex and 4 others liked your post" instead of 5 separate notifications. This requires notification batching at creation time in `notification-service.ts`. Check for recent notifications of the same type/target and increment a counter instead of creating new documents. The 1-hour dedup check (line 214 of `notification-service.ts`) is already doing something similar but it blocks instead of merging.

---

## 3. Real-Time Architecture

HIVE currently uses four different real-time mechanisms. This is the right number -- each serves a different use case.

### Current landscape

| Feature | Mechanism | File | Status |
|---------|-----------|------|--------|
| Notifications | SSE (Server-Sent Events) via `/api/notifications/stream` | `use-notification-stream.ts` | Working but not mounted |
| Space membership | Firestore `onSnapshot` on `spaceMembers` collection | `use-space-realtime.ts` | Working |
| Presence | Firestore `onSnapshot` on `presence` collection | `use-presence.ts` | Writes work, reads are stale |
| Typing indicators | Firebase RTDB `onValue` on `typing/{space}/{board}` | `firebase-realtime.ts` | Working |
| Tool state (polls, votes) | Firebase RTDB `onValue` on `tool_state/{deployment}` | `use-tool-state-realtime.ts` | Working |
| Chat messages | Firestore `onSnapshot` on `spaces/{id}/boards/{id}/messages` | Board components | Working |
| Unread counts | Firestore `onSnapshot` + one-time reads | `use-unread-count.ts` | Per-board works, total is hardcoded 0 |
| DM unread | DM context with its own subscription | `dm-context.tsx` | Working |

### What should change

**Option A: Consolidate everything onto SSE.**
One SSE connection per user that multiplexes all real-time data: notifications, presence, typing, unread counts. Server maintains per-user state and pushes diffs. Client demuxes into the right hooks.
- What breaks: SSE is unidirectional (server to client). Typing indicators need bidirectional communication. SSE also runs through your Next.js server, adding load. The current Firestore/RTDB listeners connect directly to Firebase, bypassing your server entirely. You would be adding a bottleneck.

**Option B: Keep the current hybrid, fix what is broken.**
Notifications stay on SSE (already built). Presence moves to Firebase RTDB (has `onDisconnect` support that Firestore lacks). Typing stays on RTDB. Chat/membership stay on Firestore listeners. Unread counts get a dedicated aggregation strategy.
- What breaks: More client-side complexity -- multiple connection types. But this is the trade-off for using Firebase's strengths. The alternative is running your own WebSocket infrastructure.

**Option C: Add a WebSocket layer via Vercel Functions.**
Deploy a WebSocket endpoint for bidirectional communication. Consolidate presence + typing + notifications onto it.
- What breaks: Vercel serverless functions have a 10-second timeout (or 300s on Pro). WebSockets need long-lived connections. You would need Vercel's Edge Functions or a separate infrastructure. This is an architecture change, not a feature change.

**Recommendation:** Option B. The hybrid is actually well-designed -- you are using each Firebase product for what it is best at. The only problem is presence, which should never have been on Firestore. Move it to RTDB and the `onDisconnect` handler fixes the stale-presence problem that is making online counts show 0.

### Specific migration: Presence to RTDB

The `firebase-realtime.ts` file already initializes a Realtime Database connection with `getDatabase()`. The `NEXT_PUBLIC_FIREBASE_DATABASE_URL` env var controls it. Currently used only for typing indicators. Add presence paths:

```
rtdb/
  typing/{spaceId}/{boardId}/{userId}     -- (already exists)
  tool_state/{deploymentId}                -- (already exists)
  presence/{campusId}/{userId}             -- (NEW: move from Firestore)
    status: 'online' | 'away' | 'offline'
    lastSeen: timestamp
    spaceId?: string                       -- (for rich presence)
```

The critical fix: Firebase RTDB has `onDisconnect()` which automatically sets `status: 'offline'` when the client drops. Firestore does not have this. This is why presence is broken -- users close their tab and their Firestore document stays `online` until the 5-minute stale threshold expires. With RTDB's `onDisconnect`, the status update is atomic and server-guaranteed.

---

## 4. Online Presence System

### Why it is broken

The `usePresence` hook in `apps/web/src/hooks/use-presence.ts` writes to Firestore `presence/{userId}`. It has:
- `beforeunload` handler to set offline (may not complete)
- `pagehide` handler for mobile (may not complete)
- 60-second heartbeat interval
- 5-minute stale threshold in readers

The problem: Firestore has no server-side disconnect guarantee. When a user closes their laptop, the `beforeunload` event may or may not fire. The heartbeat stops. The document sits at `status: 'online'` for 5 minutes until the reader-side stale check catches it. Meanwhile, the `useOnlineUsers` hook shows that user as online.

Additionally, the `presenceService` in `packages/core/src/services/presence-service.ts` has a comment on line 74: "Note: onDisconnect is only available with Realtime Database, not Firestore."

### Options

**Option A: Simple online/offline via RTDB.**
Move presence writes to Firebase RTDB. Use `onDisconnect()` to guarantee offline status. Keep the same interface (`usePresence`, `useOnlineUsers`, `useUserStatus`). This is the minimal fix.
- What breaks: Need to update all presence reads from Firestore `onSnapshot` to RTDB `onValue`. The `useOnlineUsers` hook does a Firestore query with `where('status', 'in', ['online', 'away'])` -- RTDB queries are structured differently (you would query by campusId path). Need to restructure the RTDB schema to support campus-scoped queries.

**Option B: Rich presence ("In Chess Club space", "Building a tool").**
Same as Option A but add contextual data: which space the user is viewing, what they are doing. Update presence on route change. Show "Sarah is in Chess Club" in the space member list.
- What breaks: Route tracking adds writes on every navigation. At 200 daily active users navigating 20 times each, that is 4,000 presence writes per day. RTDB charges per connection and per read/write -- but this volume is well within free tier. The privacy question is bigger: do users want others to see which space they are in? The ghost mode in `presenceService` already handles "appear offline" but not "appear online but hide location."

**Option C: Presence as a derived signal only.**
Do not track real-time presence at all. Instead, show "Active N minutes ago" based on the last Firestore write the user made (post, message, reaction, etc.). This is how most campus apps actually work -- real-time presence is a social media pattern, not a campus pattern.
- What breaks: The PresenceDot component becomes a "last active" indicator. Online member counts in spaces would show "active today" instead of "online now." The FOMO-generating "see who is online" feature goes away. But this removes an entire infrastructure concern and several hundred lines of code.

**Recommendation:** Option A first, then evaluate Option B. Moving to RTDB with `onDisconnect` is a targeted fix for a real bug (online counts showing 0). Rich presence is a separate product decision. Ghost mode already exists in the service layer, so privacy controls are ready.

The PresenceDot component at `packages/ui/src/identity/presence.tsx` has a 4-tier activity presence model (live/present/recent/away) with the gold-breathing-pulse design. This maps naturally to RTDB data:
- `live`: RTDB heartbeat < 30 seconds ago
- `present`: heartbeat < 2 minutes ago
- `recent`: heartbeat < 5 minutes ago
- `away`: heartbeat > 5 minutes ago OR `onDisconnect` fired

---

## 5. Unread Counts and Badges

### Where badges should appear

Based on the current IA and navigation:

| Location | What it shows | Current state |
|----------|--------------|---------------|
| Notification bell (header) | Total unread notifications | Built, not mounted |
| DMs button (sidebar) | Total unread DM conversations | Working (`useDM().totalUnread`) |
| Spaces nav item | Aggregate unread across all user spaces | Not implemented |
| Individual space card | Unread messages in that space | `useSpaceUnreadCounts` exists but N+1 |
| Board tabs within a space | Per-board unread | `useUnreadCount(spaceId, boardId)` works |

### The aggregation problem

The `useTotalUnreadCount` hook in `apps/web/src/hooks/use-unread-count.ts` (line 271) has this comment: "This would ideally use a Cloud Function to aggregate counts. For now, we'll just return 0."

This is the right instinct. Client-side aggregation of unread counts across N spaces and M boards per space creates N*M Firestore queries. At 10 spaces with 3 boards each, that is 30 queries on every page load.

### Options

**Option A: Server-side aggregation counter.**
Maintain a `userUnreadCounts/{userId}` document in Firestore with a structure like `{ total: number, bySpace: { [spaceId]: number }, lastUpdated: timestamp }`. Increment/decrement via Cloud Functions when messages are created or boards are marked as read. Client subscribes to this single document.
- What breaks: Cloud Function latency (cold starts can be 1-3 seconds). Counter accuracy during race conditions (two messages arrive simultaneously). Need to handle the "mark board as read" flow updating the aggregate. But this is a well-known pattern (Firestore distributed counters).

**Option B: RTDB counter tree.**
Store unread counts in Firebase RTDB at `unread_counts/{userId}/{spaceId}/{boardId}`. Single `onValue` listener at the `unread_counts/{userId}` path gives you the entire tree. Increment on message creation, decrement on read.
- What breaks: Same race condition concerns. But RTDB transactions are simpler than Firestore transactions for numeric increments. Read is a single listener vs N Firestore queries. The counter updates need to happen server-side (Cloud Functions) to prevent client manipulation.

**Option C: Polling with a single API endpoint.**
Add `/api/unread-counts` that returns `{ total, bySpace: {...} }` computed server-side. Poll every 30 seconds. No real-time subscription needed because unread counts change infrequently.
- What breaks: 30-second stale window. But unread counts are not time-critical -- you do not need sub-second accuracy. The SSE notification stream already pushes `unread_count` for notifications specifically. Extend it to include space unread counts.

**Recommendation:** Option B (RTDB counter tree). You already have RTDB infrastructure for tool state and typing. Adding a `unread_counts` path is minimal. The single listener pattern is exactly what RTDB was built for. Use Cloud Functions to update counts when messages are written to Firestore boards.

### Badge rendering

The Spaces nav item in `navigation.ts` (line 29) currently has no badge. Add a badge by modifying the `NavItem` interface to support a `badge?: React.ReactNode` field, or (better) have the `AppShell` Sidebar component directly read from the unread counts hook and render a badge conditionally next to the Spaces icon. This matches the DM button pattern which already has a badge at line 169 of `AppShell.tsx`.

---

## 6. Email Notifications

### Current state

`notification-delivery-service.ts` has a fully built SendGrid integration (line 133-190). It generates branded HTML emails with:
- Dark theme matching HIVE's aesthetic (#0A0A0B background, #FFD700 gold accents)
- Category badge
- CTA button linking to `hive.college/{actionUrl}`
- Notification settings link
- Unsubscribe link

But `SENDGRID_API_KEY` is not set. The service logs a warning and returns `{ success: false, error: 'SendGrid not configured' }`.

### What emails should HIVE send to college students?

College students check email less than any other demographic. The emails that actually get opened:

1. **Transactional (always send):** Email verification, password reset, security alerts. These exist outside the notification system.

2. **Event reminders (high open rate).** "Chess Club tournament tomorrow at 7pm in SU 210." College students live and die by their schedule. Send 24 hours before and 1 hour before. These are the highest-value emails.

3. **Weekly digest (moderate open rate).** "This week on HIVE: 3 new events, 12 new members joined your spaces, your tool got 8 responses." Send Sunday evening or Monday morning. Batch all the Tier 3/4 notifications that happened during the week.

4. **Direct message notification (conditional).** Only if the user has not been active in 24 hours. If they are using the app daily, they do not need email for DMs.

5. **Space milestone (rare, high impact).** "Computer Science Club just hit 100 members!" These are rare enough to be special.

Do NOT email: likes, comments, follows, tool deployments, ritual reminders. These are in-app/push territory.

### Provider options

**Option A: SendGrid (already integrated).**
The code is written. Add the API key, verify the sender domain (`hive.college`), and it works. Free tier: 100 emails/day. Essentials plan: $20/month for 50K emails.
- What breaks: Nothing. The HTML template exists. The delivery service exists. This is pure config.

**Option B: Resend.**
Modern email API, better DX, built for transactional email. React Email for templates (you already have React). Free tier: 3,000 emails/month. Pro: $20/month for 50K.
- What breaks: Need to rewrite `sendEmailNotification()` to use Resend's API instead of `@sendgrid/mail`. Maybe 30 lines of code. But you also get React Email, which means your email templates can use the same component patterns as your UI.

**Option C: AWS SES.**
Cheapest at scale ($0.10 per 1,000 emails). But more setup: verify domain, manage bounce handling, build your own templates.
- What breaks: More infrastructure work. SES is a raw SMTP/API service -- no template management, no analytics dashboard. For a startup, the ops burden is not worth the cost savings.

**Recommendation:** Option A (SendGrid). The code is literally already written. Set the env var, verify the domain, ship it. If you want to modernize later, Resend is a clean swap since the delivery service is already abstracted. But do not block email notifications on a provider decision when SendGrid is 1 env var away from working.

---

## 7. Push Notifications

### Current state

The FCM infrastructure is complete:
- `push-notifications.ts` handles permission flow, FCM token management, foreground message display
- `use-push-notifications.ts` hook with permission state, 7-day prompt cooldown
- `notification-delivery-service.ts` sends via `admin.messaging().sendEachForMulticast()`
- `notifications.ts` Cloud Functions trigger push on new messages, events, invitations
- Service worker registration for background push
- FCM token cleanup for invalid/expired tokens
- Settings UI for push categories (space activity, tool launches, event reminders, DMs, emergency alerts)

### Strategy for college students

**Option A: Conservative -- time-sensitive only.**
Push only for Tier 1 notifications: event reminders, DMs, mentions, emergency alerts. Everything else is in-app only. This respects the user's attention and avoids the "mute all" reaction.
- What breaks: Lower engagement numbers. Users who do not open the app miss Tier 2-3 notifications entirely. But the users who keep push enabled will trust it more.

**Option B: Smart push with decay.**
Push for Tier 1 always. Push for Tier 2-3 during the first 2 weeks (honeymoon period). After that, only push for Tier 1 unless the user has been inactive for 48+ hours, in which case send a single "You have 5 unread notifications" digest push.
- What breaks: Requires tracking user tenure and last-active time in the push decision logic. Adds complexity to `deliverNotification()`. But it matches how students actually adopt apps -- initial enthusiasm followed by routine.

**Option C: Full push with granular controls.**
Push for everything by default. Rely on the settings UI (which already has per-category toggles + quiet hours) to let users self-tune.
- What breaks: Default-on push for likes and comments will drive immediate opt-out. College students are ruthless about notification noise. Once they tap "Block" in the browser prompt, you lose push forever.

**Recommendation:** Option A for launch, evolve to Option B. The quiet hours feature is already built (line 126 of `notification-service.ts`). Default quiet hours to 10pm-8am for new users. Push only time-sensitive content. This builds trust, which is the scarcest resource for a new platform.

### Rich push enhancements

The FCM message payload in `notification-delivery-service.ts` (line 207) is basic: title, body, data. Enhance with:

1. **Action buttons.** FCM supports `webpush.notification.actions` for up to 2 action buttons. "RSVP Going" / "View Event" on event notifications. "Reply" / "View" on DM notifications. These need to be handled in the service worker (`firebase-messaging-sw.js`).

2. **Deep links.** The `data.actionUrl` field exists. The service worker `notificationclick` handler should use it to open the specific page. Currently `push-notifications.ts` line 215 does `window.location.href = payload.actionUrl` for foreground notifications, but background clicks need the same treatment in the SW.

3. **Notification image.** The `notification.image` field in FCM supports rich media. For event notifications, show the event cover image. For space notifications, show the space avatar. This increases open rates significantly.

---

## 8. Engagement Hooks

### What is ethical for a campus platform

HIVE is not a feed-based attention trap. The decision filter is: "Does this help a student find their people, join something real, and come back tomorrow?" Engagement hooks should reinforce belonging, not manufacture anxiety.

### Hooks that align with the mission

**Streak notifications (already partially built).**
The `notifyRitualCheckIn` function (line 777 of `notification-service.ts`) sends daily ritual check-in reminders with streak text. Extend this pattern to space engagement: "You've checked into Chess Club 7 days in a row."
- Implementation: Track `space_visit_streak` in the user's space membership document. Increment daily when they visit the space homebase. Send notification at milestone thresholds (7, 14, 30 days). Do NOT send "your streak is about to break" -- that is anxiety-manufacturing.

**Milestone celebrations.**
"Computer Science Club just hit 50 members -- and you were one of the first 10!" Celebration of collective growth, not individual metrics. The `notifySpaceEventCreated` pattern (bulk notification to members) can be reused for milestones.
- Milestones: 10, 25, 50, 100, 250, 500 members. First event hosted. First tool deployed. 100 messages in a week. These are real markers of community health.

**Social triggers (use carefully).**
"Your friend Alex just joined Computer Science Club." This is the most effective engagement hook for campus platforms -- peer FOMO is real and it is the healthy kind when it leads to joining a real community.
- Implementation: When a user joins a space, query their connections. For each connection who is NOT in that space, create a `connection_new` type notification. Gate this behind a frequency cap -- max 1 "friend joined" notification per space per day.

**Weekly recap (in-app, not push).**
Show a "Your week on HIVE" card on the home page every Monday. Events attended, messages sent, new connections, tools used. Make it shareable as a story/screenshot (optional). This reinforces the value of the platform without being pushy.

### Hooks to avoid

- **Loss aversion.** "You're about to lose your streak!" -- No. This creates anxiety.
- **Vanity metrics.** "You're in the top 5% of contributors!" -- No. The `NOTIFICATION_TEMPLATES` in `packages/ui/src/types/notifications.ts` has `exclusivityTemplate` with percentile placeholders. Do not ship this.
- **Artificial scarcity.** "Only 3 spots left for this event!" -- Only if it is actually true (physical venue capacity).
- **Dark patterns.** Notification sounds that cannot be disabled (they already can be via `localStorage.getItem('muteSounds')`).

---

## 9. Notification Intelligence

### The notification fatigue problem

A student in 8 spaces, with active tools, events, and rituals, could receive 50+ notifications per day. That is unsustainable. Intelligence means knowing when NOT to notify.

### Frequency capping

**Option A: Hard cap per category per hour.**
Max 5 social notifications per hour. Max 3 space notifications per hour. System and event notifications uncapped. Implement as a counter in the notification service before `createNotification`.
- What breaks: If someone gets 6 likes in an hour, the 6th is silently dropped. The user never sees it in-app either. This is aggressive.

**Option B: Aggregate after threshold.**
After 3 notifications of the same type from the same space within 1 hour, merge them into a single notification: "5 new comments in Chess Club." The 1-hour dedup check at line 214 of `notification-service.ts` already does same-actor dedup -- extend it to same-type aggregation.
- What breaks: More complex notification creation logic. The merged notification needs a different UI treatment in the bell (grouped sub-items). But this is what Discord, Slack, and every successful notification system does.

**Option C: Client-side batching.**
Store all notifications individually. The bell component batches them at render time. No server-side changes. The `groupNotificationsBySpace` function in the bell component (line 35) already groups by space -- add type-based grouping within each space group.
- What breaks: Notifications still appear individually in push and email. The badge count is inflated. But it is the simplest to implement.

**Recommendation:** Option B. The server-side aggregation is the right place. Modify `createNotification` to check for recent same-type notifications and merge instead of creating new documents. The 1-hour dedup window is already there -- expand it from "block duplicate" to "merge into aggregate."

### Relevance scoring

**Space engagement decay.** Track when a user last visited each space. If they have not visited a space in 30 days, stop sending Tier 3-4 notifications for that space. The per-space mute feature (`isSpaceMutedForUser` in notification-service.ts) already checks mute status -- add an auto-mute for inactive spaces.

Implementation: Add a `lastVisitedAt` field to the space membership document. On notification creation, check `lastVisitedAt` against a 30-day threshold. If stale, skip the notification and log it as "suppressed due to inactivity." The user can always re-engage by visiting the space.

**Time-of-day sensitivity.** The quiet hours feature exists (line 126 of `notification-service.ts`) but is opt-in. Consider smart defaults based on the campus timezone. Most college students are asleep from midnight to 8am. Default quiet hours to 11pm-8am and let them adjust.

**Channel preference learning.** Track which notifications users tap vs ignore. After 30 days, if a user has never tapped a `tool_deployed` notification, downgrade that type from push to in-app only for that user. Store learned preferences separately from explicit settings so the user always has override control.
- What breaks: Requires analytics infrastructure (notification_tapped event, notification_dismissed event). You are already logging notification navigation in the bell component (line 271). Extend this to track interaction rates per notification type per user.

### Summary: The intelligence stack

1. **Creation-time:** Priority assignment + same-type aggregation + space engagement check + mute check
2. **Delivery-time:** Quiet hours + channel selection (push/email/in-app) based on priority + user preferences
3. **Render-time:** Space grouping + time grouping + priority sorting in the bell
4. **Learning-time:** Interaction tracking, decay scoring, channel preference learning (Phase 2)

---

## Implementation Priority

If shipping fast, here is the order that maximizes user impact with minimum code:

1. **Mount the bell.** Import `HiveNotificationBell` into `AppShell.tsx`. 5 lines of code. Instant visibility.

2. **Fix notification data model conflict.** The `use-notifications.ts` hook reads from `notifications/{uid}/userNotifications` (subcollection pattern). The `use-realtime-notifications.ts` hook reads from the root `notifications` collection via SSE/API. The server-side `notification-service.ts` writes to the root `notifications` collection. The subcollection hook is dead code -- the bell uses the SSE hook. Remove `use-notifications.ts` or align it.

3. **Move presence to RTDB.** Fixes online counts showing 0. Uses `onDisconnect` for reliable cleanup. The RTDB infrastructure exists in `firebase-realtime.ts`.

4. **Set `SENDGRID_API_KEY`.** Enables email delivery with zero code changes. Start with event reminders only.

5. **Build RTDB unread count tree.** Cloud Function on message creation increments `unread_counts/{userId}/{spaceId}/{boardId}`. Client subscribes to `unread_counts/{userId}` for aggregate badge.

6. **Add campusId filter to notification API route.** The `/api/notifications` route at `apps/web/src/app/api/notifications/route.ts` queries notifications by `userId` but does not filter by `campusId`. Add `.where('campusId', '==', campusId)` to comply with the campus isolation constraint.

7. **Notification priority + smart delivery channels.** Type-to-priority mapping, conditional push/email/in-app based on priority and preferences.

8. **Engagement hooks.** Milestones, "friend joined" notifications, weekly recap.

9. **Notification intelligence.** Frequency capping, relevance decay, channel preference learning.

---

## File Reference

| File | Role |
|------|------|
| `apps/web/src/lib/notification-service.ts` | Server-side notification creation, 17 typed convenience functions |
| `apps/web/src/lib/notification-delivery-service.ts` | Email (SendGrid) + push (FCM) delivery |
| `apps/web/src/components/notifications/hive-notification-bell.tsx` | Bell dropdown UI (built, not mounted) |
| `apps/web/src/hooks/use-realtime-notifications.ts` | Client hook for bell -- wraps SSE stream |
| `apps/web/src/hooks/use-notification-stream.ts` | SSE EventSource connection with reconnection |
| `apps/web/src/hooks/use-notifications.ts` | Legacy Firestore subcollection hook (unused by bell) |
| `apps/web/src/hooks/use-push-notifications.ts` | Push permission flow + FCM token management |
| `apps/web/src/lib/push-notifications.ts` | Push service: FCM token, foreground messages |
| `apps/web/src/app/api/notifications/route.ts` | REST API for notifications (GET/POST/PUT) |
| `apps/web/src/app/api/notifications/stream/route.ts` | SSE streaming endpoint |
| `apps/web/src/app/me/notifications/page.tsx` | Full notifications page |
| `apps/web/src/hooks/use-presence.ts` | Presence tracking (Firestore, needs RTDB migration) |
| `packages/core/src/services/presence-service.ts` | Presence service class with ghost mode |
| `packages/ui/src/identity/presence.tsx` | PresenceDot + ActivityPresence UI components |
| `apps/web/src/lib/firebase-realtime.ts` | Firebase RTDB client (typing, tool state) |
| `apps/web/src/hooks/use-unread-count.ts` | Per-board and per-space unread counts |
| `apps/web/src/hooks/queries/use-unread-count.ts` | TanStack Query polling for notification unread count |
| `apps/web/src/hooks/use-space-realtime.ts` | Firestore listeners for space membership + activity |
| `apps/web/src/hooks/use-tool-state-realtime.ts` | RTDB listeners for tool counters/timeline |
| `apps/web/src/components/spaces/unified-activity-feed.tsx` | Combined feed (messages, posts, events, tools) |
| `apps/web/src/app/settings/components/notification-sections.tsx` | Settings UI for notification preferences |
| `apps/web/src/components/layout/AppShell.tsx` | Main layout shell (where bell needs to be mounted) |
| `apps/web/src/lib/navigation.ts` | 4-pillar nav config (Home/Spaces/Lab/You) |
| `packages/ui/src/types/notifications.ts` | Behavioral notification type system |
| `infrastructure/firebase/functions/src/notifications.ts` | Cloud Functions: onNewMessage, onNewEvent, onNewInvitation |
