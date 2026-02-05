# Mobile & Ambient

The phone experience. Quick actions, location-aware nudges, offline access, the "pull out your phone for 15 seconds" use cases. The physical-digital bridge -- campus is a real place where 32,000 students walk past each other.

---

## Current State

### What Exists

**PWA Foundation:**
- `manifest.json` configured with `display: standalone`, portrait orientation, HIVE branding (gold #D4AF37 theme)
- Service worker (`sw.js`) with cache-first static assets, network-first API calls, push notification handler, background sync skeleton
- `appleWebApp` metadata with `black-translucent` status bar
- `viewportFit: 'cover'` for edge-to-edge rendering
- iOS safe area padding (`pb-safe`) on BottomNav

**Mobile Navigation:**
- 4-tab BottomNav: Home | Spaces | Lab | You
- Haptic feedback on nav taps (`navigator.vibrate(10)`)
- Hidden on desktop (`lg:hidden`)
- Active indicator with gold bar + glow animation

**Offline Infrastructure:**
- IndexedDB via `useOfflineStorage` hook: caches spaces, feed items, profiles
- Pending mutation queue for offline writes (join space, send message, RSVP)
- `useOfflineSync` auto-syncs when coming online with retry logic (max 3)
- `useOfflineData` pattern: serve stale cache immediately, fetch fresh when online
- `useOnlineStatus` hook for connection awareness

**Push Notifications:**
- Service worker handles `push` events and `notificationclick` (opens URL)
- FCM infrastructure exists in notification delivery service
- **Missing:** No permission request flow in UI. No prompt. No opt-in. Dead capability.

**Presence:**
- Firebase real-time presence: online/away/offline
- 60-second heartbeat, 90-min TTL, 5-min stale threshold
- `beforeunload` unreliable on mobile browsers (known gap)

### What Doesn't Exist

- No PWA install prompt UI
- No push notification permission flow
- No location awareness of any kind
- No widgets (iOS/Android widget APIs not utilized)
- No lock screen actions or shortcuts
- No background fetch beyond service worker cache
- No share target (Web Share Target API)
- No deep links from external surfaces (QR codes, SMS, email)
- No haptic patterns beyond basic nav vibrate
- No "between classes" optimized views
- No campus map or location integration
- No event check-in (physical presence verification)
- No NFC/QR scanning
- No app shortcuts (PWA shortcuts manifest)
- No badge API for unread counts on home screen icon
- No offline page (sw.js references `/offline` but no page exists)
- No Geolocation API usage
- No Web Bluetooth or Web NFC
- Background sync handler exists but `syncMessages()` is empty

### Mobile Performance Reality

- `/s/[handle]` (space page): 51.7 kB first load, 1.04 MB total with shared JS -- heavy for mobile
- Home page: 3 parallel fetches on mount, ~2s load time
- No route prefetching for likely next pages
- No skeleton/placeholder for above-the-fold content priority
- SSE notification stream: no reconnection handling on mobile network switches (wifi to cellular)

---

## The Opportunity

### The "Between Classes" Window

UB students have 10-15 minutes between classes. They walk. They wait. They pull out their phones. This is the single most valuable interaction window for HIVE:

- 32,000 students x ~4 class transitions/day = 128,000 micro-sessions
- Each session: 2-5 minutes, standing, one-handed, spotty wifi
- Mental state: transitional, slightly bored, socially available
- Current behavior: Instagram scroll, text a friend, check email

HIVE captures zero of these moments today. The home page takes 2 seconds to load and shows you the same thing whether you're walking past the Student Union or sitting in your dorm.

### The Commuter Problem

60% of UB students commute. They don't live on campus. They don't bump into people in dorms. They arrive, go to class, and leave. Their campus social life is structurally disadvantaged.

For commuters, HIVE's value proposition breaks down: "find your people" requires being in the same physical space. A phone that whispers "there's a study group happening in Capen right now, 3 people from your CS 370 space are there" turns HIVE from a chat app they check at home into a reason to stay on campus.

### The Physical-Digital Bridge

Campus is a 1,350-acre physical space with named buildings, quads, dining halls, libraries. Every student has a mental map. But HIVE treats campus as a flat namespace -- a space called "CS 370" could be meeting in any building and the platform doesn't know or care.

Location turns HIVE from a digital layer into a campus layer. Not mapping every step. Just knowing: "you're near North Campus" vs. "you're near South Campus" vs. "you're off campus." Three zones, massive value.

### The Install Moment

PWA install is the highest-leverage action a student can take. It moves HIVE from "a tab I sometimes open" to "an app on my phone." Every mobile feature downstream depends on this. Current state: no install prompt anywhere.

---

## Feature Ideas

### F1. The 15-Second Home Screen

**Problem:** Home page takes 2s to load, shows information in priority order that doesn't account for time, location, or urgency. A student between classes needs to see "what's happening right now near me" -- not a greeting.

**Shape:**
- Cached shell renders instantly (skeleton is pre-painted by service worker)
- Above-the-fold shows exactly 3 things: (1) countdown to next event you RSVP'd to, (2) unread message count per space, (3) one "happening now" card
- Below-the-fold loads async: activity feed, recommendations, suggestions
- Time-aware: morning shows today's schedule, afternoon shows "happening now," evening shows tomorrow preview
- Total interaction: glance, tap one thing, pocket phone. Under 15 seconds.

**Wedge:** The moment a student opens HIVE and sees "CS 370 study session starting in 12 minutes, Capen 101" -- that's the moment they stay on campus instead of going home. That's retention.

**Impact:** Reduces time-to-value from ~5 seconds (current) to <1 second. Increases daily opens by making each open immediately useful. Enables the "check HIVE between classes" habit.

**Effort:** Medium. Requires consolidating 3 home API calls into 1 pre-ranked endpoint, implementing priority sections with time-awareness, and aggressive service worker pre-caching of the home shell.

**Tradeoffs:**
- Opinionated feed means less discovery surface on home
- Pre-caching increases storage footprint on device
- Time-awareness adds complexity to a currently simple page
- Must get ranking right or users see irrelevant content at the top

---

### F2. PWA Install Flow

**Problem:** No UI prompts install. Students use HIVE as a browser tab that competes with 30 other tabs. PWA install converts a tab into an app icon, enables push notifications, and unlocks home screen badge API.

**Shape:**
- Trigger: After first meaningful action (join a space or RSVP to an event)
- Bottom sheet: "Add HIVE to your home screen" with one-line value prop: "Get notified when your events start"
- If dismissed: Don't ask again for 7 days
- If installed: Celebration animation + "You're all set" toast
- Track: Install conversion rate, time from signup to install
- Add PWA `shortcuts` to manifest: "My Spaces," "Explore," "Notifications"
- Add `screenshots` to manifest for richer install UI on Android

**Wedge:** Install is the gatekeeper for push notifications, home screen badges, and app-like experience. Every downstream mobile feature depends on this conversion.

**Impact:** High. PWA install users have 3-5x higher retention than browser-tab users across industry benchmarks. Unlocks push, badges, and shortcuts.

**Effort:** Low. The `beforeinstallprompt` event is already available. Need UI component + timing logic + manifest enhancements. 2-3 days.

**Tradeoffs:**
- Prompting too early feels pushy (user hasn't seen value yet)
- iOS install flow is worse than Android (manual "Add to Home Screen" in share sheet)
- Must handle iOS separately with instructions overlay
- Some students will feel nagged -- "Not now" must be respected

---

### F3. Push Notification Permission Flow

**Problem:** FCM infrastructure exists. Service worker handles push events. But there's no UI to request permission. Zero students receive push notifications.

**Shape:**
- Never prompt on first visit. Wait for demonstrated investment.
- Trigger 1: User RSVPs to an event. Bottom sheet: "Want a reminder before it starts?"
- Trigger 2: User receives a mention in chat (but they can't see it because they're not in the app). Next visit: "You missed a mention. Enable notifications?"
- Permission request uses the contextual value prop, not generic "Allow notifications"
- If granted: Store FCM token, enable event reminders + mention alerts by default
- If denied: Respect permanently. Show note in settings: "Notifications blocked -- change in browser settings"
- Settings page: Per-category toggles (events, mentions, space activity, system)

**Wedge:** "Want to know when your event starts?" is a concrete, immediate value prop. Not "HIVE wants to send you notifications." Context matters.

**Impact:** Critical. Push notifications are the #1 re-engagement lever. 40%+ opt-in rate is achievable with contextual prompts vs. <20% for generic prompts.

**Effort:** Medium. FCM token management exists. Need: UI prompt component, timing logic, per-trigger prompt variants, settings UI. ~1 week.

**Tradeoffs:**
- Browser notification fatigue is real -- students get prompted by every site
- iOS Safari push requires PWA install first (additional friction)
- Over-notification kills retention faster than no notification
- Must ship with conservative defaults (quiet hours, batching) from day 1

---

### F4. Campus Zone Awareness

**Problem:** HIVE doesn't know where you are. A student standing outside the Student Union has the same experience as a student in their dorm 5 miles away. Location is the richest contextual signal on a physical campus.

**Shape:**
- Three zones, not GPS tracking: "North Campus," "South Campus," "Off Campus"
- Implementation: Geolocation API, coarse accuracy only (~1km)
- Permission: Opt-in, triggered by campus-specific feature ("See what's happening near you")
- Features unlocked:
  - "Near you" section on home page: events in buildings within walking distance
  - Space activity weighted by proximity: CS 370 meeting in Capen matters more when you're on North Campus
  - "X people from your spaces are nearby" ambient awareness
- Privacy: Location never stored server-side. Zone computed client-side only. No tracking history.
- Fallback: If location denied, everything works -- just no proximity features

**Wedge:** "3 events happening within a 5-minute walk" is the sentence that makes a commuter stay on campus. This is HIVE's unique data -- no other platform knows which campus events are near you right now.

**Impact:** High for commuter retention. Transforms HIVE from "digital chat platform" to "campus awareness layer." Creates moat -- Instagram can't do this.

**Effort:** High. Geolocation permission flow, zone mapping per campus, proximity calculations, UI sections for "near you" content, privacy architecture. ~3-4 weeks.

**Tradeoffs:**
- Location permission fatigue (another prompt)
- Battery drain if polling location (must use sparingly -- check on app open only, not continuous)
- Accuracy on campus is inconsistent (buildings block GPS)
- Privacy perception: "HIVE tracks my location" is a reputation risk even if we don't store it
- Must work perfectly without location -- it's an enhancement, not a requirement

---

### F5. Event Check-In

**Problem:** Events happen in physical space, but HIVE only knows about RSVPs (intent), not attendance (reality). A student RSVPs to 5 events and attends 1. HIVE can't tell the difference. This makes activity signals noisy and attendance data useless.

**Shape:**
- QR code displayed at event (organizer generates from HIVE)
- Attendee scans QR with phone camera or HIVE's built-in scanner
- Check-in confirms: "You're at [Event Name]" with timestamp
- Post-check-in: unlock event-specific features (event chat thread, photo sharing, attendee list)
- For organizer: real-time attendance dashboard
- Alternative: proximity check-in using BLE beacon or WiFi SSID detection (future)
- Badge: "Attended X events this semester" on profile

**Wedge:** Event organizers desperately want attendance data. CampusLabs tracks RSVPs but not check-ins. HIVE offering real attendance counts makes space leaders evangelize the platform.

**Impact:** Medium-high. Creates verified social proof ("23 people checked in"), improves recommendation accuracy (actual attendance > RSVP), gives organizers data they can't get anywhere else.

**Effort:** Medium. QR generation (server), QR scanning (client -- Web API or camera library), check-in API, organizer dashboard view. ~2 weeks.

**Tradeoffs:**
- QR scanning requires camera permission (another prompt)
- Friction at event: "everyone take out your phones and scan this" feels forced
- Some events are informal -- check-in feels corporate
- Gaming risk: share QR code photo and "check in" remotely
- Must be optional per event -- not forced on every gathering

---

### F6. Quick Actions from Lock Screen / Shortcuts

**Problem:** Getting into HIVE requires: unlock phone, find app/tab, wait for load, navigate. 4 steps, 5+ seconds. Competing apps (iMessage, Instagram) are 1-2 taps away.

**Shape:**
- PWA Shortcuts (manifest): "My Spaces" opens directly to spaces list, "Explore" opens explore, "Notifications" opens notification page
- Action notifications: "CS 370 meeting in 15 min" push notification with inline "I'm coming" button (notification actions API)
- Share Target: Register HIVE as a share target so students can share links/images directly to a space from any app
- Deep links: `hive.campus/s/cs-370` opens directly to space, `hive.campus/e/event-id` opens event with RSVP button

**Wedge:** The notification that says "Study session in 15 min -- [I'm coming] [Skip]" is a 1-tap interaction from lock screen. That's the behavior pattern that competes with iMessage.

**Impact:** Medium. Reduces friction for high-frequency actions. Share Target creates viral loop (sharing external content into HIVE spaces).

**Effort:** Low-Medium. Manifest shortcuts: 1 day. Notification actions: 2 days. Share Target API: 2 days. Deep links: already partially work via Next.js routing.

**Tradeoffs:**
- PWA shortcuts limited to 4 items (must choose carefully)
- Notification actions not supported on iOS Safari (Android only)
- Share Target requires PWA to be installed
- Deep links need OG metadata for previews when shared externally

---

### F7. Offline-First Space View

**Problem:** Campus wifi (UB_Secure, eduroam) is unreliable in transitions -- walking between buildings, in elevators, in lecture halls with 300 students on the same AP. The app shows loading spinners or errors during the most common mobile usage moments.

**Shape:**
- Cache the last-viewed state of every joined space: member list, last 50 messages, upcoming events
- When offline or slow: render cached state immediately with subtle "Offline" indicator
- Messages composed offline are queued (already supported by pending mutation system)
- Optimistic UI: sent message appears instantly in chat, syncs when connected
- Space list always available from IndexedDB cache
- Event details cached so users can see location/time even without connectivity
- Auto-refresh in background when connection restored

**Wedge:** "I can check where my meeting is even when wifi drops" solves a daily frustration. Students walking between buildings lose connection in the 2-minute window when they most need event details.

**Impact:** Medium. Removes a class of failures (loading errors on spotty wifi) that currently make HIVE feel unreliable. Offline mutation queue already exists but needs the read-side cache to match.

**Effort:** Medium. Offline storage hooks exist but need integration into space page, message list, and event detail views. ~2 weeks to wire through the main flows.

**Tradeoffs:**
- Stale data risk: cached messages may not show latest context
- Storage limits: IndexedDB has quotas, especially on iOS Safari (~50MB eviction threshold)
- Sync conflicts: two offline edits to same resource (edge case but possible)
- Must clearly indicate "showing cached data" vs "live data"

---

### F8. "Happening Now" Ambient Widget

**Problem:** Students don't open HIVE to browse. They open it because something triggered them. The trigger needs to exist outside the app -- on their home screen, in their notification shade, or in their peripheral awareness.

**Shape:**
- PWA Badge API: unread count shown on app icon (Android Chrome supports this)
- Periodic Background Sync: fetch "happening now" data every 15 minutes when app isn't open
- Rich push notifications for "happening now" moments:
  - "Study session starting in your building (Capen 101) -- 8 people from CS 370"
  - "3 events on campus right now" (daily 12pm digest push)
  - "Your space [Club Name] just posted: [preview]"
- Widget-like behavior via notification channels (Android): group HIVE notifications into "Events," "Messages," "Activity"

**Wedge:** The 12pm push -- "3 things happening on campus right now" -- is HIVE's daily touchpoint. It says: "campus is alive, and you can be part of it." This is especially powerful for commuters deciding whether to stay on campus or go home.

**Impact:** High for daily active users. The "daily digest push" alone could drive 20-30% of daily opens based on industry benchmarks for contextual push.

**Effort:** Medium. Badge API: 1 day. Periodic sync: 2 days. Digest push: needs scheduled Cloud Function + notification content pipeline. ~2 weeks total.

**Tradeoffs:**
- Periodic Background Sync support is limited (Chrome only, not Safari)
- Badge API only works on Android PWA
- Over-notifying kills the app -- digest must feel curated, not spammy
- "Happening now" requires real-time event data to be accurate (stale data = broken trust)
- iOS has no equivalent to notification channels

---

### F9. One-Handed Mode

**Problem:** Students use their phones one-handed while walking, holding coffee, or carrying a backpack strap. Current UI has interaction targets across the full screen height. Top-of-screen actions are unreachable with thumb.

**Shape:**
- Bottom-sheet-first interaction pattern: all modals, confirmations, and action menus anchor to bottom of screen
- Swipe gestures on space cards: swipe right to join/open, swipe left to mute
- Pull-to-refresh on all scrollable views
- Long-press on space in spaces list: quick action menu (mute, leave, pin)
- FAB (floating action button) for primary actions: compose message, RSVP, check-in
- Reachability zone audit: ensure all tap targets in bottom 60% of screen during primary flows
- Increase touch targets to minimum 48px (some current buttons are 40px)

**Wedge:** The student walking across campus with one hand on their phone and one on their bag. If they can RSVP with a thumb swipe, they will. If they have to reach the top of the screen, they won't.

**Impact:** Medium. Quality-of-life improvement that accumulates. Each interaction saved is small; the aggregate effect on daily usage is significant.

**Effort:** Medium. Bottom-sheet refactor for modals: 1 week. Swipe gestures: 3-4 days per surface. Touch target audit: 2 days.

**Tradeoffs:**
- Swipe gestures have discoverability problems (no visual affordance)
- Bottom-sheet-heavy UI can feel cramped on smaller phones
- FAB obscures content and competes with BottomNav
- Swipe conflicts with iOS back gesture
- Must maintain desktop usability while optimizing for mobile

---

### F10. Smart Deep Links & QR Sharing

**Problem:** HIVE has no way to enter from the physical world. Flyers on bulletin boards, posters in dorms, table tents at events -- all physical surfaces where students encounter campus organizations. None of them can link to HIVE.

**Shape:**
- Every space gets a shareable QR code: `hive.campus/s/[handle]`
- Every event gets a QR code: `hive.campus/e/[eventId]`
- QR codes downloadable as PNG from space settings (for printing on flyers)
- Scan-to-join flow: scan QR, lands on space page, "Join" button prominent, auth if needed
- OG metadata on all shareable pages (title, description, image) for link previews in iMessage/GroupMe
- Short links: `hive.ub/cs370` for easy verbal sharing ("join us on hive dot ub slash cs370")
- UTM tracking on QR links to measure physical-to-digital conversion

**Wedge:** A club president prints 50 flyers with a QR code. 50 people at the involvement fair scan it and land in the space. This is the physical-to-digital acquisition loop that no competitor can match because no competitor is campus-specific.

**Impact:** High for organic growth. Physical distribution is free and campus-native. Club leaders already print flyers -- this just adds a QR code.

**Effort:** Low-Medium. QR generation: 1 day (server-side SVG/PNG). OG metadata: 2 days. Short link service: 2-3 days. UTM tracking: 1 day.

**Tradeoffs:**
- QR fatigue: students scan QR codes grudgingly, not enthusiastically
- Short links need a custom domain (hive.ub or similar)
- Auth wall after QR scan is a conversion killer -- must show content first, prompt auth for actions
- Flyers get torn down -- physical distribution is ephemeral
- Link rot: if a space is deleted, QR codes become dead links

---

### F11. Commuter Daily Briefing

**Problem:** Commuter students (60% of UB) make a daily decision: "Is it worth staying on campus today?" HIVE has the data to answer this but doesn't surface it at the decision moment (morning, before leaving home).

**Shape:**
- Morning push notification (8am, configurable): "Your campus today"
  - X events happening on campus
  - Y people from your spaces are online
  - Your next event: [Name] at [Time] in [Building]
  - "Worth the trip" score (0-3 icons based on activity level)
- Tappable: opens daily briefing card on home page
- Personalized: only shows events and spaces the student is part of
- Skippable: "Don't show on weekends" / "Don't show on [days with no classes]"

**Wedge:** "3 things worth staying for today" is the sentence that keeps commuters on campus. This is HIVE's unfair advantage -- no other app can aggregate campus-specific, personalized activity into a morning nudge.

**Impact:** Very high for commuter engagement. If even 5% of commuters stay on campus 1 extra hour per week because of this, that's thousands of hours of increased campus presence feeding back into HIVE activity.

**Effort:** Medium. Morning push: requires scheduled Cloud Function. Briefing content aggregation: extends existing dashboard API. Settings UI for schedule. ~2 weeks.

**Tradeoffs:**
- Daily notifications risk becoming noise (must stay genuinely useful)
- "Worth the trip" scoring is subjective and wrong predictions break trust
- Morning timing is tricky (8am for 9am class, but what about 11am class?)
- Requires push notifications to be enabled first (F3 dependency)
- Must gracefully handle days with nothing: "Quiet day on campus -- enjoy the downtime" vs. just not sending

---

### F12. Tap-to-Share Presence

**Problem:** Students can see who's online in a space, but "online" means "has the tab open," not "is physically nearby and available to meet up." The presence system has no physical dimension.

**Shape:**
- Optional status: "On campus" / "In [Building]" / "Off campus"
- Set manually with one tap, or inferred from campus zone (F4)
- Shows in space member list: "Sarah -- in Capen Library"
- "Ping" action: tap someone's presence to send a lightweight nudge: "I'm in Capen too -- want to study?"
- Auto-expires after 2 hours (no stale "in library" from yesterday)
- Privacy: fully opt-in, can be turned off per space or globally
- Not GPS coordinates -- building-level granularity max

**Wedge:** "I can see that 3 people from my study group are in the library right now" turns HIVE into the thing you check before deciding where to study. That's a daily habit.

**Impact:** Medium-high. Creates a unique social signal that no other platform provides. Directly addresses the "where are my people" question that campus students have daily.

**Effort:** High. Location detection (extends F4), building-level mapping, presence UI updates, ping notification system, privacy controls, expiration logic. ~3-4 weeks.

**Tradeoffs:**
- Privacy is the #1 concern: some students will not want to broadcast location, ever
- "Ping" can feel intrusive if misused (stalking risk)
- Building-level accuracy requires WiFi fingerprinting or manual selection
- Ghost mode must override all presence sharing
- Stale presence is worse than no presence

---

### F13. Haptic Language

**Problem:** HIVE uses a single vibration pattern (`navigator.vibrate(10)`) for all interactions. Haptics are a communication channel that's currently wasted.

**Shape:**
- Define 3-4 haptic patterns:
  - `tap`: 10ms pulse -- button press, nav tap (current)
  - `success`: 10ms-pause-30ms -- joined space, RSVP confirmed, check-in complete
  - `notification`: 20ms-pause-20ms-pause-20ms -- new mention, event reminder
  - `error`: 50ms buzz -- failed action, network error
- Apply consistently across all interactions
- Respect system haptic settings (some users disable vibration)
- Progressive enhancement: no-op on devices without vibration API

**Wedge:** Small. But apps that "feel right" get used more. The subtle buzz when you RSVP is the physical confirmation that the action registered. It's the difference between "did that work?" and knowing it did.

**Impact:** Low individually, but contributes to the "this feels like a real app, not a website" perception that drives PWA install and retention.

**Effort:** Very low. Define patterns in a `haptics.ts` utility, apply to existing interactions. 1-2 days.

**Tradeoffs:**
- Vibration API not available on all devices/browsers
- Annoying if overused
- No iOS Safari vibration support (iPhone users get nothing)
- Must not vibrate during quiet hours

---

### F14. Swipe-Through Event Cards

**Problem:** Events are the highest-urgency content on HIVE but they're buried in lists. A student between classes wants to flip through "what's happening today" like swiping through stories -- fast, visual, swipeable.

**Shape:**
- Full-width card stack on home page: today's events, one per card
- Swipe right: "I'm going" (RSVP)
- Swipe left: "Not for me" (dismiss, trains recommendations)
- Swipe up: see details (expands to full event view)
- Card shows: event name, time, location, space name, attendee count, 1-line description
- Stack shows remaining count: "3 more events today"
- Empty state: "Nothing happening right now -- check back tonight"
- Tinder-for-events energy but for campus activities, not dating

**Wedge:** The swipe mechanic is the fastest possible RSVP flow: see event, decide, swipe. 2 seconds per event. A student can triage 5 events in 10 seconds between classes.

**Impact:** Medium. Makes event discovery feel effortless. Creates signal data (swipe left = negative signal) that improves recommendations. Drives RSVPs through reduced friction.

**Effort:** Medium. Gesture-based card stack component, RSVP API integration, dismiss tracking, animation work. ~2 weeks.

**Tradeoffs:**
- "Tinder for events" association could feel trivializing
- Swipe UI is opinionated -- some users prefer lists
- Requires enough events to justify the mechanic (cold start: need 3+ events/day minimum)
- Swipe gestures conflict with other navigation patterns
- Must handle "already RSVP'd" state gracefully

---

### F15. Campus Heartbeat Notification

**Problem:** Campus has a rhythm: 8am arrivals, 10am class changes, noon lunch rush, 5pm exodus, 8pm evening events. HIVE doesn't reflect this rhythm. A static platform on a dynamic campus.

**Shape:**
- Ambient, opt-in notification once per day at a meaningful moment:
  - Monday 9am: "Welcome back. 47 people from your spaces are on campus."
  - Wednesday 12pm: "Lunch hour. 3 spaces have people gathering in the Student Union."
  - Friday 5pm: "Weekend starts. 2 events tonight."
- Contextual, not scheduled: only fires when there's something worth saying
- "Campus pulse" card on home page: live counter of active users, active events, active spaces
- Weekly rhythm visualization: sparkline showing campus activity Mon-Sun

**Wedge:** The feeling that campus is alive and you're part of it. For commuters especially, knowing "47 people from your spaces are on campus right now" creates FOMO that drives physical presence.

**Impact:** Medium. Emotional impact is high but hard to measure. Contributes to "HIVE is where campus lives" positioning.

**Effort:** Low-Medium. Activity aggregation extends existing presence/activity APIs. Push scheduling via Cloud Function. Campus pulse UI component. ~1.5 weeks.

**Tradeoffs:**
- "Campus heartbeat" could feel performative or manufactured
- Low-activity periods expose the metric: "2 people online" is depressing
- Must set minimum thresholds before surfacing counts
- Notification fatigue risk if sent daily
- Hard to A/B test emotional impact

---

## Quick Wins (Ship in Days)

| Feature | Effort | Why Now |
|---------|--------|---------|
| **PWA Install Prompt** (F2) | 2-3 days | Gatekeeper for push, badges, shortcuts. Every day without it is lost installs. |
| **Haptic Patterns** (F13) | 1-2 days | Tiny code change, immediate "feels like a real app" improvement. |
| **Manifest Shortcuts** (F6 partial) | 1 day | Add `shortcuts` array to `manifest.json` -- instant quick-launch actions. |
| **PWA Badge API** (F8 partial) | 1 day | Show unread count on home screen icon. Android Chrome only. |
| **Missing Offline Page** | 1 day | `sw.js` references `/offline` but no page exists. Create it. |
| **OG Metadata on Space/Event Pages** (F10 partial) | 2 days | Link previews in iMessage/GroupMe when sharing HIVE URLs. Zero effort, high distribution impact. |
| **Touch Target Audit** (F9 partial) | 2 days | Ensure all buttons are 48px minimum. Accessibility + usability win. |

---

## Medium Bets (Ship in Weeks)

| Feature | Effort | Why Now |
|---------|--------|---------|
| **Push Notification Permission Flow** (F3) | 1 week | #1 re-engagement lever. Every week without push is lost retention. |
| **15-Second Home Screen** (F1) | 2 weeks | Consolidate 3 API calls, add time-aware priority ranking, pre-cache shell. |
| **Offline-First Space View** (F7) | 2 weeks | Hooks exist, need wiring. Eliminates loading failures on spotty wifi. |
| **QR Code Generation for Spaces** (F10) | 1 week | Physical-to-digital bridge. Club leaders want this for flyers. |
| **Event Check-In via QR** (F5) | 2 weeks | Verified attendance data. Organizers become evangelists. |
| **Commuter Daily Briefing** (F11) | 2 weeks | High-impact for 60% of users. Depends on push (F3). |
| **Swipe-Through Event Cards** (F14) | 2 weeks | Fast RSVP, event discovery. Fun, tactile, differentiated. |
| **One-Handed Mode Refactors** (F9) | 2-3 weeks | Bottom-sheet modals, swipe gestures, reachability. Quality of life. |

---

## Moonshots (Ship in Months+)

| Feature | Effort | Why Worth It |
|---------|--------|-------------|
| **Campus Zone Awareness** (F4) | 3-4 weeks | Location transforms HIVE from chat app to campus awareness layer. Moat. |
| **Tap-to-Share Presence** (F12) | 3-4 weeks | "Where are my people" is the killer campus question. Requires F4. |
| **Native App (React Native / Capacitor)** | 3-6 months | True background processing, widgets, better notifications, App Store presence. See competitive analysis. |
| **Campus Heartbeat + Rhythm Engine** (F15 + Awareness F13-F16) | 2-3 months | Academic calendar integration, time-of-day awareness, semester transitions. Makes HIVE feel alive. |
| **BLE Beacon Check-In** | 2-3 months | Hardware deployment at event venues. Frictionless check-in without QR scanning. |
| **Apple Watch / Wear OS Companion** | 4-6 months | Glanceable: "CS 370 in 15 min, Capen 101." Event countdown on wrist. |
| **Spatial Audio / AirDrop-style Discovery** | Experimental | "People near you who share 3 spaces" using BLE proximity. Privacy nightmare if done wrong, magical if done right. |

---

## Competitive Analysis

### Instagram Mobile
**What they do well:** Instant load (heavy pre-caching), stories are the swipe-through pattern students already know, share-to-story creates external visibility, push notifications are well-tuned.
**What they can't do:** Campus-specific anything. No event RSVPs. No space-based communities. No campus location awareness. They optimize for global attention; HIVE optimizes for local action.
**Steal:** Pre-caching strategy, story-like card swipe pattern for events, share sheet integration.

### Discord Mobile
**What they do well:** Real-time messaging feels instant, rich notification controls per server/channel, voice channels as ambient presence ("5 people in General"), offline message queue.
**What they can't do:** Campus identity verification. No physical events. No location. No academic calendar awareness. Servers are generic containers, not campus-rooted communities.
**Steal:** Per-channel notification controls (HIVE should have per-space mute granularity), voice-channel-as-presence concept (show "5 people chatting in CS 370" without needing voice).

### GroupMe Mobile
**What they do well:** Fastest group creation on any platform. SMS bridge means non-app users can still participate. Dead simple -- no complexity.
**What they can't do:** Events. Discovery. Presence. Identity beyond phone number. GroupMe is a messaging app; HIVE is a campus operating system. GroupMe can't show "what's happening on campus" because it has no campus awareness.
**Steal:** Group creation speed (joining a HIVE space should be 1-tap, not a flow). SMS integration would be huge for the GroupMe crowd but is likely out of scope.

### Slack Mobile
**What they do well:** Notification batching, threaded conversations, keyboard shortcuts, search across workspaces, status/presence ("In a meeting until 3pm").
**What they can't do:** Consumer UX. Slack mobile feels like work. Students won't use a tool that feels like their internship. Also: no events, no discovery, no campus identity.
**Steal:** Custom status (HIVE's manual presence in F12 mirrors this). Notification batching (batch "5 messages in CS 370" instead of 5 individual pings).

### Native App Advantages HIVE Currently Lacks
| Capability | Native | PWA (HIVE today) |
|-----------|--------|-------------------|
| Push notifications | Full control, badges, actions, grouping | Limited. No iOS Safari push without install. No notification grouping. |
| Background processing | Unlimited | Very limited. Periodic Sync is Chrome-only, unreliable. |
| Widgets | iOS WidgetKit, Android App Widgets | None. No standard. |
| Location services | Geofencing, background location, significant location change | Foreground only. No geofencing. Requires active page. |
| Camera / QR | Native camera API, fast | Web camera API, slower, permissions per session |
| Haptics | Full Taptic Engine (iOS), fine-grained | Basic `navigator.vibrate()`, no iOS support |
| App Store presence | Discoverable, installable | Invisible. No store listing. |
| Deep links | Universal Links / App Links | Works via URL routing but no app link verification |
| Offline | Full control | Service worker only, storage limits, iOS eviction |

---

## Wedge Opportunities

### Wedge 1: "The Event Flyer QR Code"
**Who:** Club presidents printing flyers for the involvement fair
**Pain:** They already print flyers. They already have Instagram QR codes. HIVE's QR code replaces Instagram's, and the scan leads to an actionable space (join, RSVP, chat) instead of a passive profile.
**Entry:** Offer QR code generation in space settings. One-click download as PNG. Print-ready.
**Expansion:** QR scans become first-time user acquisition. Those users discover the rest of HIVE.

### Wedge 2: "The 15-Minute Walk"
**Who:** Students walking between classes
**Pain:** 10-15 minutes of dead time. Too short to do anything meaningful. Too long to do nothing.
**Entry:** The 15-second home screen (F1) -- one glance, one tap, one piece of information.
**Expansion:** That glance becomes a habit. The habit becomes "I check HIVE between every class." 4x daily usage.

### Wedge 3: "Should I Stay on Campus?"
**Who:** Commuter students (60% of UB)
**Pain:** They drive 20-40 minutes to campus. Once classes end, they go home. They miss events, study groups, spontaneous hangouts.
**Entry:** The morning briefing (F11) -- "3 things worth staying for today."
**Expansion:** Commuters who stay on campus use HIVE more, attend events, join spaces. Retention loop.

### Wedge 4: "The Event Organizer Who Needs Numbers"
**Who:** Space leaders who run events
**Pain:** They need attendance data for funding applications, SGA reports, space reservations. Currently: manual head counts or sign-in sheets.
**Entry:** Event check-in (F5) -- real-time attendance dashboard.
**Expansion:** Organizers push all event promotion through HIVE because it's where the check-in happens. Distribution loop.

### Wedge 5: "My Phone Told Me to Go"
**Who:** Any student who has HIVE with push enabled
**Pain:** They want to be involved but forget, get busy, or don't know what's happening.
**Entry:** Contextual push at the right moment: "Study session in 15 min in your building."
**Expansion:** Push becomes the trigger for physical campus activity. HIVE becomes the reason students show up.

---

## Open Questions

### PWA vs. Native: When Do We Cross?

The PWA gets HIVE to 80% of native capabilities. The remaining 20% -- widgets, background location, notification grouping, App Store presence, iOS haptics -- requires native.

**Decision criteria for going native:**
- PWA install rate plateaus below 30% of active users
- Push notification opt-in hits iOS ceiling (Safari push too unreliable)
- Location features (F4, F12) prove high-value but are limited by foreground-only constraint
- Competitor launches a native campus app with widget/widget differentiation

**Bridge option:** Capacitor or TWA (Trusted Web Activity) wraps the PWA in a native shell. Gets App Store presence, some native APIs, without a full rewrite. 2-4 weeks instead of 3-6 months.

### Location: How Much Is Too Much?

Three levels of location ambition:

**Level 1 (Low risk):** Campus zone only -- North Campus, South Campus, Off Campus. Client-side only, never stored. Minimal privacy concern. Moderate value.

**Level 2 (Medium risk):** Building-level -- "Sarah is in Capen Library." Requires WiFi fingerprinting or manual input. Stored temporarily (2hr expiry). High value but privacy-sensitive.

**Level 3 (High risk):** Continuous location + geofencing -- "You just walked past the Student Union where 3 events are happening." Background location access, battery drain, maximum privacy concern. Maximum value if trusted. Maximum damage if misused.

Recommendation: Start with Level 1, measure adoption. If >40% opt in, explore Level 2. Level 3 only in native app, only with explicit consent flow, only after trust is established.

### Notification Volume: What's the Right Amount?

Students get 50-100 push notifications per day across all apps. HIVE must not become noise.

**Proposed caps:**
- Max 5 push notifications per day per user (excluding direct mentions)
- Max 1 "ambient" notification per day (campus heartbeat, daily briefing)
- Quiet hours: 11pm-7am default
- "Catching up" mode: if user hasn't opened app in 24h, send 1 summary, not backlog

**Unanswered:** Do students actually want campus-specific push? Or is HIVE inherently a "check when I want to" tool? Need to A/B test push-enabled vs. push-disabled cohorts in first 2 weeks of launch.

### The iOS Problem

iOS Safari PWA has significant limitations:
- No push notifications without PWA installed to home screen
- PWA install requires manual "Add to Home Screen" from share sheet (no `beforeinstallprompt`)
- No Badge API
- No Periodic Background Sync
- No `navigator.vibrate()`
- Storage eviction after ~7 days of non-use (IndexedDB wiped)
- No notification actions (buttons in push)

~50% of college students use iPhones. This means half of HIVE's users get a degraded mobile experience.

**Options:**
A. Accept the limitation. Focus on what PWA can do on iOS (basic push after install, offline cache, share sheet).
B. Build iOS native app (3-6 months, solves everything, expensive).
C. Ship Capacitor wrapper (2-4 weeks, gets App Store listing, basic native APIs).
D. Focus Android-first for mobile features. iOS users get web experience.

### Battery and Data Budget

Mobile features that poll, track location, or maintain persistent connections drain battery and consume cellular data.

**Budget per feature:**
- Presence heartbeat (60s): ~0.1% battery/hour -- acceptable
- Location check on app open: negligible
- Continuous location: ~2-5% battery/hour -- unacceptable
- SSE notification stream: ~0.5% battery/hour -- acceptable while app is open
- Background sync every 15 min: ~0.2% battery/hour -- acceptable

Rule: HIVE must never be visible in the "battery drain" list. If a student notices HIVE in their battery settings, we've failed.

### The "Not Another App" Resistance

Students already have Instagram, Snapchat, GroupMe, Discord, iMessage, email, LMS (Blackboard/Canvas), and campus apps. "Download another thing" is a real barrier.

**Counter-arguments to test:**
- "This replaces GroupMe for your clubs" (substitution, not addition)
- "Your club already uses it" (social proof)
- "You're missing events" (FOMO)
- "Scan this QR code" (no download decision, just scan)

Which framing drives the highest install conversion? Unknown. Need to test at involvement fair / first week of classes.
