# Notifications & Attention

How HIVE reaches you when you're not looking. The comeback mechanism.

---

## Current State

### What Exists

**In-app notification pipeline** is the only channel that actually works end-to-end:

1. **Notification Service** (`notification-service.ts`) — Creates notification documents in Firestore when platform events occur. Supports 18 notification types across 7 categories. Has preference checking, quiet hours logic, per-space mute with expiration, and duplicate prevention (1-hour window). Calls `deliverNotification()` asynchronously after Firestore write.

2. **Delivery Service** (`notification-delivery-service.ts`) — Accepts a notification document and attempts delivery via three channels: in-app (Firestore write, always works), email (SendGrid, requires `SENDGRID_API_KEY` env var that is not configured), and push (FCM, requires tokens that no UI collects). Has branded HTML email templates, FCM multicast with invalid token cleanup, and delivery status tracking.

3. **SSE Stream** (`use-notification-stream.ts`) — Client-side EventSource connection to `/api/notifications/stream`. Handles 6 message types: `connected`, `notification`, `notification_update`, `notification_delete`, `unread_count`, `ping`. Exponential backoff reconnection (max 5 attempts), then falls back to 30-second polling.

4. **Notification Bell** (`hive-notification-bell.tsx`) — Popover with space-grouped notifications, collapsible sections, max 5 per group, "+X more" overflow, unread count badge (gold, max "99+"), mark-all-read.

5. **Notifications Page** (`/me/notifications`) — Full page with filter tabs (All, Mentions, Likes, Follows, Events), mark-all-read, delete individual. Hard limit 50 notifications, no pagination.

6. **Settings** (`/me/settings`) — Notification toggle section exists. Category-level on/off. No per-channel matrix. No push permission flow.

### What Does Not Work

| Component | Status | Why It's Broken |
|-----------|--------|-----------------|
| Email delivery | Dead | `SENDGRID_API_KEY` not set. Code exists, env vars missing. Zero emails go out. |
| Push notifications | Dead | No UI to request browser notification permission. No FCM token collection flow. FCM code exists but tokens array is always empty. |
| Notification batching | Not built | Every single message in a busy space = individual notification. 50 messages = 50 notifications. |
| Event reminders | Not built | No scheduled job to query upcoming events and fire reminder notifications. Data model supports it, execution doesn't exist. |
| Weekly digest | Not built | No cron/scheduled function for digest emails. |
| Push permission prompt | Not built | No bottom sheet, no modal, no context-aware ask. Browser `Notification.requestPermission()` is never called. |
| Quiet hours UI | Partial | Server logic exists for quiet hours checking. No settings UI to configure start/end times. |
| Notification preferences matrix | Not built | Simple category toggles only. No per-channel (push/email/in-app) granularity. |

### The Damage

**Zero re-engagement capability outside the browser tab.** If a student closes the tab, HIVE cannot reach them. No email. No push. No digest. The only way a student sees new activity is by voluntarily opening the app. For a platform where Weekly Active Spaces is the north star metric, this is an existential gap.

Every competitor — GroupMe, Discord, Instagram, iMessage — can tap a student on the shoulder. HIVE cannot.

---

## The Opportunity

Students receive 100+ notifications per day across their phone. Most are noise. HIVE has an unusual advantage: it knows things those other apps don't.

**HIVE knows your campus context.** What spaces you belong to. What events you RSVP'd to. What your major is. Who your people are. When your events are. What's trending on your campus right now.

The opportunity is not "send more notifications." It's "send the only notifications that matter."

If HIVE can become the one notification source a student trusts — the one they don't mute — it wins. Every other campus app becomes noise. HIVE becomes signal.

**The wedge:** Event reminders. "Your meeting starts in 15 minutes" is the notification no student will turn off. It's immediately useful, time-sensitive, and requires zero behavior change. Once push is enabled for events, the door is open for everything else.

**The moat:** Notification intelligence improves with data. The more HIVE knows about which notifications a student acts on, the better it gets at filtering. This compounds. Discord can't know your class schedule. Instagram doesn't know your org's event calendar. GroupMe doesn't know what spaces are trending on your campus.

---

## Feature Ideas

### 1. Push Permission Flow ("The Ask")

**Problem:** FCM code exists but no student has ever been prompted to allow push notifications. The permission request is never triggered. Zero tokens are collected.

**Shape:** Context-aware permission prompt that appears after a student takes their first high-intent action (RSVP to an event, send a message in chat). Not on first load. Not during onboarding. After they've done something they'd want to be notified about.

- Bottom sheet (mobile) or inline card (desktop): "Want to know when [event name] starts?"
- Two buttons: "Yes, notify me" / "Not now"
- "Not now" suppresses the prompt for 7 days
- If granted: FCM token saved to user document, toast "You'll get notified"
- If denied (browser-level block): Show instructions to re-enable in browser settings
- Settings page shows push status toggle with real state

**Wedge:** This is the unlock for everything else. Without tokens, nothing works. The ask must feel natural, not desperate. Tie it to a specific event they care about — not "enable notifications" in the abstract.

**Impact:** HIGH — Unlocks the entire push channel. Directly affects retention by enabling re-engagement outside the browser.

**Effort:** Medium (3-5 days). FCM infrastructure exists. Need: permission UI component, token save endpoint, settings integration, 7-day suppression logic.

**Tradeoffs:**
- Ask too early = denied permanently (browser remembers "Block")
- Ask too late = miss the window
- iOS Safari has no push support in PWA (until iOS 16.4+, and even then requires Add to Home Screen)
- Some students use notification blockers — need to detect and adapt

---

### 2. SendGrid Activation ("The Wire")

**Problem:** Email delivery code is complete. Branded HTML templates exist. The delivery service calls SendGrid. But `SENDGRID_API_KEY` is not set in the environment. Zero emails go out.

**Shape:** Configure SendGrid account, verify sender domain (`hive.college`), set environment variables, test delivery end-to-end. Add email delivery monitoring to admin dashboard.

- Configure `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL` in Vercel env vars
- Verify `hive.college` domain with SPF/DKIM records
- Test email delivery for each notification category
- Add email preference toggles to settings UI
- Add unsubscribe endpoint (`/api/notifications/unsubscribe`) with one-click token
- Monitor delivery rates, bounce rates, spam complaints

**Wedge:** Email is the universal fallback. Every student has a `.edu` email they check. This is the only channel that works on every device without app installs or permission flows.

**Impact:** HIGH — Enables re-engagement for 100% of users on day one. Event reminders via email alone would meaningfully improve return rates.

**Effort:** Low (1-2 days). Code is written. This is infrastructure configuration + testing.

**Tradeoffs:**
- Email can feel spammy if volume is too high — must default to conservative settings
- `.edu` emails often have aggressive spam filters — sender reputation matters from day one
- Students ignore email more than push — but some email beats zero email
- CAN-SPAM compliance: need working unsubscribe link (currently points to `/unsubscribe` which doesn't exist)

---

### 3. Urgency Tiers ("Not All Notifications Are Equal")

**Problem:** Every notification is treated identically. A "someone liked your post" has the same weight as "your event starts in 10 minutes." The system has no concept of urgency.

**Shape:** Add an `urgency` field to every notification. Route delivery based on urgency level.

| Tier | Examples | Delivery |
|------|----------|----------|
| **Critical** | Event starts in <30min, space leader action needed | Push immediately + sound + in-app |
| **High** | Mentioned in chat, direct message, invite accepted | Push + in-app |
| **Medium** | New event in your space, someone RSVP'd | In-app + daily digest |
| **Low** | Someone joined your space, new tool deployed | In-app only, batchable |
| **Ambient** | Weekly trends, "you haven't visited Space X in 2 weeks" | Digest only |

Add urgency to `CreateNotificationParams`. Delivery service routes based on tier. Critical bypasses quiet hours. Low gets batched. Ambient only appears in digest.

**Wedge:** This is how HIVE becomes the notification source students trust. If every notification from HIVE is relevant, students never mute it. If one irrelevant notification breaks trust, they mute everything.

**Impact:** HIGH — Prevents notification fatigue before it starts. Protects push permission (students who feel spammed revoke push access).

**Effort:** Medium (3-4 days). Schema change, delivery routing logic, update all `createNotification` callsites to include urgency.

**Tradeoffs:**
- Misjudging urgency erodes trust faster than having no tiers at all
- Edge cases: "someone mentioned you" could be casual or urgent depending on context
- Overly aggressive critical tier = notification fatigue. Overly conservative = missed moments
- Need telemetry to measure click-through by tier and adjust

---

### 4. Smart Batching ("5 New Messages in CS 370")

**Problem:** A busy space chat generates one notification per message. If 20 people are chatting, you get 20 individual notifications. This is the fastest path to being muted.

**Shape:** Server-side batching service that groups notifications by space + type within a configurable window.

- Batch key: `{userId}:{spaceId}:{type}` (e.g., `user123:cs370:message`)
- Batch window: 5 minutes (configurable per user)
- First notification in batch: delivered immediately
- Subsequent notifications within window: absorbed into batch
- At window close: update notification to "5 new messages in CS 370"
- Clicking batch opens the space, not an individual message
- Individual notifications still stored in Firestore for the full notifications page

Implementation: Batch service runs on a 1-minute cron (Cloud Function or Vercel cron). Queries pending batch-eligible notifications. Groups, aggregates, updates or creates batch notification.

**Wedge:** This is table stakes for any chat-capable platform. Discord does it. Slack does it. Without it, HIVE becomes a noise machine the moment spaces get active.

**Impact:** HIGH — Directly prevents the "too many notifications" complaint that kills push permission retention.

**Effort:** Medium (4-5 days). New batch service, batch key logic, cron job setup, notification update flow, UI for batch display.

**Tradeoffs:**
- Batching delays information — a 5-minute window means you might miss something urgent in chat
- Mentions within a batch should break through (override the batch, deliver immediately)
- Batch window too short = still noisy. Too long = feels stale.
- Need to handle edge case: user reads the space during batch window (cancel remaining batch)

---

### 5. Event Reminder Engine ("Your Meeting Starts in 15 Minutes")

**Problem:** Students RSVP to events but get no reminder. They forget. They don't show up. Organizers see low attendance despite high RSVP counts. This is the highest-value notification HIVE could send and it doesn't exist.

**Shape:** Scheduled function that queries upcoming events, matches against RSVPs, and fires reminder notifications at configurable intervals.

- Default reminders: 1 hour before (push + in-app), 10 minutes before (push only, critical urgency)
- User can configure: 10min / 30min / 1h / 2h / day before / none
- Reminder preference stored with RSVP document
- Cloud Function runs every minute, queries events starting within reminder windows
- Deduplication: mark reminder as sent to prevent re-fires
- "Starting now" notification when event begins (critical urgency)
- "How was it?" follow-up notification 1 hour after event ends (low urgency, optional)

**Wedge:** This is the single most valuable notification for a campus platform. It's useful from day one for every student who RSVPs to anything. It requires push to be enabled — creating a natural funnel from "I want event reminders" to "I need to allow push notifications."

**Impact:** VERY HIGH — Directly increases event attendance (the core loop for active spaces). Creates the strongest possible reason to enable push.

**Effort:** Medium (4-5 days). Cron function, RSVP reminder preferences, push delivery integration, "starting now" trigger.

**Tradeoffs:**
- Clock drift: "10 minutes before" needs to be precise. A reminder at T-11 or T-9 is fine. A reminder at T-2 feels like a failure.
- Multiple events at the same time: need to handle gracefully (batch into "2 events starting soon")
- User timezone: all event times stored UTC, reminders must fire in user's local time
- Server cost: minute-by-minute cron querying all upcoming events could be expensive at scale — need efficient indexing

---

### 6. Class Schedule Awareness ("Don't Buzz Me During Chem 101")

**Problem:** Students are in class 15-25 hours per week. Notifications during lecture are disruptive. Students who get buzzed during class mute the app entirely. A blunt mute kills re-engagement for the entire day.

**Shape:** Integrate class schedule data to suppress non-critical notifications during class hours.

- Option A: Manual schedule input — student sets recurring "busy" blocks (e.g., MWF 10-10:50, TR 2-3:15)
- Option B: Import from university calendar system (Banner/PeopleSoft export, .ics file upload)
- Option C: Google Calendar sync (OAuth, read-only import of "busy" blocks)
- During class hours: only Critical tier notifications delivered via push. Everything else queued.
- After class ends: one consolidated "catch-up" notification: "3 things happened while you were in class"

Start with Option A (manual). Low effort, high signal. Students already know their schedule.

**Wedge:** This is the feature that makes students say "HIVE gets it." No other campus app respects your class schedule. It's a subtle but powerful signal that HIVE is built for students, not adapted from a general-purpose tool.

**Impact:** MEDIUM-HIGH — Prevents the "muted during class, forgot to unmute" failure mode. Preserves push permission.

**Effort:** Medium (5-7 days for manual input). High for calendar sync (OAuth, parsing, recurring events).

**Tradeoffs:**
- Manual entry is tedious — most students won't do it unless the UX is extremely fast (3-tap schedule entry)
- Class schedule changes per semester — need semester transition reminders
- Some students have irregular schedules (labs, studio classes) — need flexibility beyond MWF patterns
- False positives: blocking notifications for a "class" that got cancelled

---

### 7. Notification Digest ("Your Day on HIVE")

**Problem:** Low-urgency notifications accumulate. Students who don't check HIVE daily miss context. There's no "catch up" mechanism except scrolling through the notifications page.

**Shape:** Automated digest email/push sent at a user-configured time summarizing recent activity.

**Daily Digest (default: 8am):**
- "2 events today in your spaces"
- "15 new messages across 3 spaces"
- "1 new member joined [Space]"
- "Trending on campus: [Space] had 40 active members yesterday"
- Single CTA: "Open HIVE"

**Weekly Digest (default: Sunday 6pm):**
- "Your week: active in 4 spaces, attended 2 events"
- "You missed: 3 events you might have liked"
- "Your spaces grew: +12 new members across your spaces"
- "Coming up: 5 events next week"
- Unsubscribe link

**Quiet Week variant:**
- If user had minimal activity: "Quiet week? Here's what you might have missed"
- Focus on what happened in their spaces, not guilt-trip

**Wedge:** Digests are the lowest-friction re-engagement mechanism. They work even if push is denied. They work on `.edu` email. They're the "pull" version of notifications — opt-in summaries rather than interruptions.

**Impact:** MEDIUM-HIGH — Creates a recurring touchpoint that brings students back. Especially valuable for students who check HIVE 2-3 times per week, not daily.

**Effort:** Medium-High (5-7 days). Template design, scheduled Cloud Function, user timezone handling, digest preference UI, unsubscribe flow.

**Tradeoffs:**
- Digest at the wrong time = ignored. 8am on a Saturday = deleted unread.
- Content generation: computing "what happened" across all spaces requires aggregation queries
- Digest must have real content — a digest that says "nothing happened" trains users to ignore it
- Email render testing across Gmail, Outlook, Apple Mail — each renders HTML differently

---

### 8. Social Proof Notifications ("3 of Your Friends Just Joined Photography Club")

**Problem:** The current notification system is individual-action focused ("Alex liked your post"). It doesn't leverage the social graph. Students are influenced by what their friends do more than what strangers do.

**Shape:** Generate notifications when people in a student's social orbit take notable actions.

- "3 people you know joined [Space] this week" (connection activity)
- "Maya and 2 others RSVP'd to [Event]" (friend attendance)
- "[Space] is trending — 15 of your classmates are there right now" (FOMO signal)
- "Your friend Alex just created a new space: [Name]" (creator spotlight)

Rules:
- Only trigger for students in user's connection graph or shared spaces
- Minimum threshold: 2+ connections required (no "1 person you know..." notifications)
- Maximum 1 social proof notification per day (prevent FOMO overload)
- Urgency: Low (digest-eligible, never push)
- Suppressed during quiet hours and class times

**Wedge:** Social proof is the most powerful acquisition and retention lever for campus communities. "My friends are there" beats every feature comparison. This is why GroupMe won campuses — group membership was visible.

**Impact:** MEDIUM-HIGH — Drives space joins and event RSVPs through social influence. Compounds with network size.

**Effort:** Medium (4-6 days). Connection graph queries, threshold logic, throttling, notification template.

**Tradeoffs:**
- Can feel manipulative if overdone (the Instagram "3 friends liked this" effect)
- Privacy: some students may not want their activity broadcast to connections
- Must be opt-out-able without affecting other notification categories
- Computing connection overlap at scale requires efficient graph queries
- Thin networks early on: if students have 0-2 connections, this feature is useless

---

### 9. Notification Sound & Haptics ("The HIVE Buzz")

**Problem:** In-app notifications are silent. No audio cue, no haptic feedback. The browser tab title doesn't change. If the student isn't looking at the screen, they miss it.

**Shape:** Add configurable notification sounds and browser-level attention signals.

- **Tab title flash:** `HIVE | (3) New notifications` — cycle between normal title and unread count
- **Notification sound:** Short, distinctive tone for Critical/High urgency notifications. Think iMessage "ding" — recognizable, not annoying.
- **Browser notification API:** For Critical-tier notifications, use the browser's native `Notification` API (separate from push — works even when tab is open but not focused)
- **Haptic feedback:** On mobile browsers that support it (`navigator.vibrate()`), subtle vibration for notifications
- **Favicon badge:** Update favicon to show unread count dot (like Slack)

User controls:
- Sound: On / Off / Only Critical
- Browser notifications: On / Off
- Haptic: On / Off (mobile only)
- All default to Off except tab title (default On)

**Wedge:** Small touches that signal quality. These are the details that make a product feel native vs. "just a website." Slack pioneered the favicon badge. iMessage's sound is iconic. HIVE needs its own sonic signature.

**Impact:** LOW-MEDIUM — Small incremental improvement to awareness. Tab title change alone is high value for minimal effort.

**Effort:** Low-Medium (2-4 days). Tab title is trivial. Sound requires audio asset design. Browser notifications need permission. Favicon badge is a few lines.

**Tradeoffs:**
- Sound on a website feels unexpected — must be opt-in, never default-on
- Audio autoplay restrictions in browsers mean sound only works after user interaction
- Favicon badge support varies across browsers
- Multiple HIVE tabs open: need to deduplicate sounds

---

### 10. Notification Actions ("Reply Without Leaving")

**Problem:** Every notification requires navigation. Click notification, navigate to space, find the message, then reply. The round-trip breaks flow.

**Shape:** Inline actions directly on notification items.

**Notification type-specific actions:**
- **Mention:** "Reply" button opens inline text field right in the notification popover
- **Event created:** "RSVP" button with going/interested/skip options
- **Space invite:** "Accept" / "Decline" buttons
- **Join request:** "Approve" / "Deny" buttons (for leaders)
- **Event reminder:** "On my way" / "Can't make it" quick status

Quick actions appear on hover (desktop) or swipe (mobile). Tapping the action fires the API call inline — no navigation required. Success state replaces the action button with a checkmark.

**Wedge:** This is the difference between a notification center and an inbox. Linear, Superhuman, and Notion all have actionable notifications. They reduce the cost of engagement to zero friction.

**Impact:** MEDIUM — Reduces time-to-action significantly. Especially valuable for space leaders processing join requests and RSVPs.

**Effort:** Medium-High (5-7 days). Action component system, API integration per notification type, inline response UI, optimistic updates.

**Tradeoffs:**
- Adds complexity to the notification bell popover (already 400 lines)
- Reply-in-notification risks becoming a mini-chat (scope creep)
- Error handling: what if the action fails? Need clear rollback UI
- Not all notification types have natural actions — some are purely informational

---

### 11. The "Comeback" Notification ("We Miss You")

**Problem:** Students who go inactive for 3+ days are at high risk of never returning. There's no re-engagement mechanism beyond hoping they open the app.

**Shape:** Automated win-back notifications for students who show declining engagement.

**Triggers and messages:**

| Days Inactive | Channel | Message |
|---------------|---------|---------|
| 3 days | Push | "12 new messages in [most active space] since you left" |
| 7 days | Email | "This week on HIVE: [summary of activity in their spaces]" |
| 14 days | Email | "Your spaces miss you — [Space] had [N] events this week" |
| 30 days | Email | "Still part of [Space]? Here's what's been happening" |

Rules:
- Maximum 1 comeback notification per week
- Stop after 3 unanswered (don't become spam)
- If user returns and engages, reset the counter
- Include unsubscribe link in every email
- Never guilt-trip ("we miss you" is borderline — "here's what happened" is better)
- Only send if there IS real activity to report (don't say "things are happening" when they're not)

**Wedge:** This is the retention mechanic every consumer product needs. It's the difference between passive churn and active re-engagement. The key is content quality — a comeback notification with real, relevant content converts. A generic one gets blocked.

**Impact:** HIGH — Directly addresses churn. Even 10% win-back rate on 3-day-inactive students meaningfully improves WAU.

**Effort:** Medium (4-5 days). Inactivity tracking, scheduled function, content generation, throttling logic.

**Tradeoffs:**
- Walking the line between helpful and annoying is hard
- "We miss you" tone can feel desperate — content-first framing is better
- Students who left intentionally (graduated, dropped out) should be excluded
- Privacy: tracking inactivity and sending emails about it needs to feel transparent
- Must respect unsubscribe immediately (CAN-SPAM, plus trust)

---

### 12. Space-Level Notification Controls ("Mute CS 370 for 2 Hours")

**Problem:** Space mute exists server-side but the UI for it is buried. Students can't quickly mute a noisy space from the notification bell or space header. The only option is nuclear: leave the space.

**Shape:** Granular, accessible mute controls at the space level.

- **From notification bell:** Long-press (mobile) or right-click (desktop) on space group header reveals mute options
- **From space header:** Bell icon with slash-through when muted
- **Mute options:** 1 hour / Until tomorrow / Until I turn it back on / Custom
- **Mute scope:** "Mute everything" / "Mute chat, keep events" / "Only mentions"
- **Visual indicator:** Muted spaces show muted icon in home page space grid
- **Auto-unmute:** Timed mutes expire automatically. "Until tomorrow" unmutes at 8am.

**Wedge:** Discord's channel mute is one of its most-used features. Students want to be in a space but not hear from it constantly. Mute-without-leaving preserves membership while reducing noise.

**Impact:** MEDIUM — Prevents the "I left the space because it was too noisy" failure mode. Preserves space membership counts.

**Effort:** Low-Medium (3-4 days). Mute UI components, integration with existing server-side mute logic, visual indicators.

**Tradeoffs:**
- Too many mute options = decision paralysis. Start with 3 options (1h / Tomorrow / Forever)
- Muted spaces still need to show unread badges (just no push/sound)
- Mute-all-except-mentions is the power-user setting — should exist but not be default
- Students who mute everything defeat the purpose — might indicate a deeper UX problem

---

### 13. Notification Intelligence ("Learn What I Care About")

**Problem:** Static notification preferences don't adapt. A student who never clicks "someone joined your space" notifications should stop getting them. A student who always clicks event notifications should get those first.

**Shape:** ML-lite notification ranking based on engagement signals.

- Track: notification delivered, opened, clicked, dismissed, time-to-action
- Per-user engagement score per notification type
- After 2 weeks of data: auto-adjust delivery
  - Types with <5% open rate: downgrade to digest-only
  - Types with >50% open rate: ensure push delivery
  - Types opened within 2 minutes: mark as high-interest
- Monthly "notification report" to user: "We noticed you never open [type] notifications. Want to turn them off?"
- Never auto-disable without user confirmation
- Reset on new semester (preferences might change)

**Wedge:** This is the moat. If HIVE's notifications get smarter over time while Discord's stay static, HIVE becomes the notification source students trust. This is a data flywheel — the longer a student uses HIVE, the better their notifications get.

**Impact:** HIGH (long-term) — Compounds over time. Initial impact is low (need data). After 1 semester of data, becomes a genuine differentiator.

**Effort:** High (2-3 weeks). Engagement tracking pipeline, scoring model, preference adjustment logic, user-facing report.

**Tradeoffs:**
- Cold start: no data for new users = generic notifications for the first 2 weeks
- False negatives: student didn't click because they were busy, not because they don't care
- Transparency: students should understand why they're getting (or not getting) certain notifications
- Privacy: engagement tracking needs to be disclosed
- Overfitting: small sample sizes per user make individual models noisy. Better to use cohort-level signals initially

---

### 14. Notification Threads ("Conversation, Not Interruption")

**Problem:** Notifications are individual items with no threading. A conversation in chat generates 10 separate notifications. When you open the notifications page, you see 10 lines about the same conversation.

**Shape:** Thread notifications by conversation context.

- Chat messages from the same space within 30 minutes: one thread
- Event with multiple RSVPs: one thread showing latest + count
- Post with multiple comments: one thread
- Thread shows: latest message + count + participants
- Expanding a thread shows individual items with timestamps
- Thread-level mark-as-read: mark the whole thread read in one action
- Notification bell groups by thread, not individual notification

Similar to how Gmail threads emails. The notification page becomes a list of conversations, not a list of individual items.

**Wedge:** This transforms the notification page from a dump of items into a meaningful activity log. It's the difference between a Twitter-style notification list and a Gmail-style inbox.

**Impact:** MEDIUM — Improves notification page usability significantly. Less impact on the bell popover (already grouped by space).

**Effort:** Medium-High (5-7 days). Thread detection logic, thread grouping in query, thread expansion UI, thread-level actions.

**Tradeoffs:**
- Threading logic is hard to get right — what constitutes "the same conversation"?
- Threads can get very long — need truncation and "see all" expansion
- Mixed-type threads (comments + likes on the same post) need careful design
- Performance: grouping in queries adds complexity vs. simple timestamp sort

---

### 15. The Dead Zone Detector ("Are Your Notifications Even Working?")

**Problem:** Students don't know if their notifications are broken. Push denied? They'll never know they're missing things. SSE disconnected? No indicator. Email bouncing? Silent failure.

**Shape:** Proactive notification health checks visible to the user.

- **Settings page health card:**
  - Push: Enabled / Denied / Not Set Up (with fix-it CTA for each state)
  - Email: Verified / Bouncing / Unsubscribed
  - In-app: Connected (SSE) / Degraded (polling) / Offline
- **One-time setup wizard:** After entry flow, brief "Set up your notifications" step
  - "How do you want to hear from HIVE?" — Push / Email / Both / Just in-app
  - Pre-fills recommended settings based on their answer
- **Periodic health check notification:** Monthly in-app: "Your notification health: Push ON, Email ON, 0 issues"
- **SSE reconnection indicator:** Toast when connection drops and reconnects: "Reconnected" (subtle, auto-dismiss)

**Wedge:** No other campus app tells you when your notifications are broken. Students assume everything works and don't realize they're missing things. Making notification health visible builds trust and encourages optimal configuration.

**Impact:** LOW-MEDIUM — Indirect retention impact through better notification configuration rates.

**Effort:** Low-Medium (3-4 days). Health status component, permission state detection, SSE status toast.

**Tradeoffs:**
- "Your notifications are broken" can feel alarming — framing matters
- Health checks that nag ("Set up push!") get dismissed
- Need to detect browser notification permission state without re-prompting (Notification.permission API)
- Monthly health notification is low-value if nothing changed — only show when there IS an issue

---

## Quick Wins (Ship in Days)

| Feature | Effort | Impact | Why It's Quick |
|---------|--------|--------|----------------|
| **SendGrid activation** | 1-2 days | HIGH | Code exists. Just env vars + domain verification. |
| **Tab title unread count** | 0.5 days | MEDIUM | `document.title = \`(${count}) HIVE\`` — 10 lines of code |
| **Favicon unread dot** | 0.5 days | LOW | Canvas-drawn favicon with dot overlay |
| **Polling fallback 30s -> 10s** | 0.5 days | LOW | Change one constant in `use-notification-stream.ts` |
| **Notification badge color fix** | 0.5 days | LOW | TopBar badge RED -> GOLD per brand tokens |
| **BottomNav notification badge** | 1 day | MEDIUM | Add unread count badge to home icon in BottomNav |
| **SSE reconnection toast** | 1 day | LOW | Show subtle toast on reconnect |

**Total quick wins: ~5-6 days of work, HIGH cumulative impact.**

---

## Medium Bets (Ship in Weeks)

| Feature | Effort | Impact | Dependencies |
|---------|--------|--------|--------------|
| **Push permission flow** | 3-5 days | HIGH | None (FCM infra exists) |
| **Urgency tiers** | 3-4 days | HIGH | None |
| **Smart batching** | 4-5 days | HIGH | Urgency tiers (for mentions breaking through batches) |
| **Event reminder engine** | 4-5 days | VERY HIGH | Push permission flow, SendGrid |
| **Space-level mute UI** | 3-4 days | MEDIUM | None (server logic exists) |
| **Quiet hours settings UI** | 2-3 days | MEDIUM | None (server logic exists) |
| **Notification preferences matrix** | 3-4 days | MEDIUM | SendGrid, Push permission flow |
| **Comeback notifications** | 4-5 days | HIGH | SendGrid, Push permission flow |

**Recommended sequence:** SendGrid -> Push Permission -> Urgency Tiers -> Event Reminders -> Batching -> Mute UI -> Quiet Hours -> Preferences Matrix -> Comeback

---

## Moonshots (Ship in Months+)

| Feature | Effort | Impact | Why It's a Moonshot |
|---------|--------|--------|---------------------|
| **Notification intelligence (ML)** | 2-3 weeks | HIGH | Needs data pipeline, engagement tracking, scoring model |
| **Class schedule integration** | 1-2 weeks | MEDIUM-HIGH | Calendar import, recurring event parsing, timezone handling |
| **Daily/weekly digest emails** | 5-7 days | MEDIUM-HIGH | Template design, aggregation queries, timezone-aware scheduling |
| **Social proof notifications** | 4-6 days | MEDIUM-HIGH | Connection graph queries, threshold logic, privacy controls |
| **Notification threading** | 5-7 days | MEDIUM | Thread detection logic, query changes, expansion UI |
| **Notification actions (inline)** | 5-7 days | MEDIUM | Per-type action components, API integration, optimistic updates |
| **Dead zone detector** | 3-4 days | LOW-MEDIUM | Permission state detection, health UI |

---

## Competitive Analysis

### iMessage / SMS
**How they handle notifications:**
- Every message = immediate push notification. No batching, no intelligence.
- Badge count on app icon persists until opened.
- "Do Not Disturb" is system-level, not app-level.
- Muting is per-conversation (indefinite or 1 hour / 1 day / 1 week).
- No digest. No summary. No intelligence.

**What HIVE can learn:** The simplicity of per-conversation mute. The persistence of badge counts. The immediacy of delivery.

**Where HIVE can beat it:** iMessage has zero context awareness. It doesn't know your class schedule, your events, or what's trending. HIVE can be smarter without sacrificing speed.

---

### Discord
**How they handle notifications:**
- Per-server and per-channel notification settings.
- Three levels: All messages / Only @mentions / Nothing.
- Notification stacking: multiple messages from same channel = one notification with count.
- Mobile push for @mentions by default (not all messages — crucial design decision).
- "Streamer Mode" suppresses all notifications.
- "Do Not Disturb" status suppresses push but not in-app.
- Rich notification content (shows message preview, avatar).
- Desktop notification with sound (configurable).

**What HIVE can learn:** Default to @mentions-only for push is brilliant. It's conservative enough that students don't mute, but engaged enough that they stay connected. Channel-level granularity prevents nuclear mute. Notification stacking is essential.

**Where HIVE can beat it:** Discord doesn't know campus context. It can't do event reminders (no event system). It can't do social proof across a campus graph. It can't adapt to academic rhythms.

---

### Slack
**How they handle notifications:**
- Per-workspace notification schedule (e.g., M-F 8am-6pm only).
- Keyword notifications (get notified when someone says "deploy" or your name).
- Thread-level mute (mute a conversation, not the whole channel).
- "Pause notifications" quick action with timer.
- Notification grouping: "2 new messages in #general" on mobile.
- Do Not Disturb with visible status ("Notifications paused until 5pm").
- Catch-up: "While you were away" summary in sidebar.

**What HIVE can learn:** Notification schedule (M-F 8am-6pm) maps perfectly to class schedule awareness. Keyword notifications for power users. "While you were away" summary is the digest concept done well. "Pause notifications" with visible timer is elegant mute UX.

**Where HIVE can beat it:** Slack is enterprise-shaped. Its notification mental model assumes professional work hours. HIVE can be student-shaped — aware of class times, finals week, campus rhythms that Slack was never designed for.

---

### Instagram
**How they handle notifications:**
- Aggressive by default (likes, comments, follows, stories, reels, suggestions, "you might know" — everything pushes).
- Social proof: "user1 and 23 others liked your photo."
- Follow chain: "user1 started following you" → "People you might know" follow-up.
- Comeback: "You have unseen notifications" push after hours of inactivity.
- Activity tab groups by time (Today, This Week, This Month).
- "Quiet Mode" (teen safety feature): suppresses all notifications, auto-replies "I'm in quiet mode."
- Notification sound is iconic (the "pop").

**What HIVE can learn:** Social proof formatting ("Maya and 5 others..."). Time-grouped activity feed (Today / This Week / This Month). Quiet Mode concept maps to class-time suppression. Instagram's aggressive defaults work because the content is compelling — a lesson in making notification content good enough to warrant interruption.

**Where HIVE can beat it:** Instagram's notifications are optimized for engagement metrics, not user wellbeing. HIVE can be opinionated about what's worth interrupting for. "We didn't send you 40 notifications today because we only send what matters" is a positioning advantage.

---

### GroupMe
**How they handle notifications:**
- Dead simple: all messages push by default.
- Mute: per-group toggle. On or off.
- No granularity. No intelligence. No batching.
- "Liked" messages generate notifications.
- Works via SMS fallback (huge for campus adoption — no app required).

**What HIVE can learn:** SMS fallback is powerful for campus. GroupMe won colleges because it worked on dumb phones and without an app. The simplicity is a feature — zero configuration required.

**Where HIVE can beat it:** GroupMe is a blunt instrument. No batching means busy groups are unbearable. No event integration means separate coordination tools needed. No intelligence means every group feels the same regardless of importance.

---

## Wedge Opportunities

### Wedge 1: "Never Miss an Event" (Highest Conviction)
**Entry point:** Event reminders via push notification.
**Why this wins:** Every student has events they don't want to miss. "Your meeting starts in 15 minutes" is the notification no one mutes. It's immediately useful, time-sensitive, and requires zero behavior change. It naturally requires enabling push, opening the door for all other notifications.

**Sequence:** SendGrid -> Push Permission (tied to RSVP) -> Event Reminders -> Urgency Tiers -> Everything else.

### Wedge 2: "The Quiet Notification App" (Counter-Positioning)
**Entry point:** Opinionated notification defaults that are deliberately conservative.
**Why this wins:** Position HIVE against the notification noise of Discord/Instagram. "HIVE only tells you what matters." Default to in-app for most things. Push only for events and mentions. This builds trust. Students who trust their notifications don't mute them.

**Sequence:** Urgency Tiers -> Smart Batching -> Class Schedule Awareness -> "Only N notifications today" transparency.

### Wedge 3: "Your Campus in One Digest" (Email-First)
**Entry point:** Daily or weekly email digest summarizing campus activity.
**Why this wins:** Works with zero app opens. Works on every device. Works with denied push permissions. The digest IS the product for 2-3x/week users. If the digest is good enough, it drives app opens. If it's not, it's still better than zero touchpoints.

**Sequence:** SendGrid -> Digest template -> Daily/weekly cron -> Personalization -> Social proof in digest.

---

## Open Questions

1. **What's the push permission opt-in rate on college campuses?** Industry average is ~50% for apps, but HIVE is a website (lower). PWA push support on iOS is new and adoption is unclear. If push opt-in is <20%, should we invest more heavily in email and SMS?

2. **Should HIVE support SMS notifications?** GroupMe won campuses on SMS. Twilio integration would give HIVE a channel that works on every phone without push permission. But SMS costs money per message ($0.0079/segment) and 32K students * 5 SMS/week = $1,264/week. Is it worth it?

3. **How do we handle the semester boundary?** Notification preferences, space memberships, and digest content all change between semesters. Should there be a "start of semester" reset flow? What happens to muted spaces?

4. **What's the right batch window?** 5 minutes feels right for chat messages, but could be too long for active discussions. Should the batch window be dynamic based on message velocity?

5. **Should notification preferences be portable across campuses?** If HIVE expands beyond UB, should a student transferring to another school keep their notification settings?

6. **How do we measure notification quality?** Open rate is a proxy. But what's the target? >30% click-through? <3 mutes per user per month? What signals indicate "we're sending the right notifications"?

7. **Should space leaders have notification analytics?** "Your announcement reached 85% of members. 42% opened it." This could make HIVE valuable to org leaders beyond just communication.

8. **What about notification permission on native mobile vs. mobile web?** If HIVE ever becomes a native app, the permission model changes entirely. Should we build the notification system in a way that abstracts the delivery channel?

9. **Do we need a notification API for third-party tools?** If HiveLab tools can deploy to spaces, should tools be able to send notifications? What are the abuse vectors?

10. **When does "helpful" become "creepy"?** Social proof notifications ("3 friends joined X") reveal user activity. Class schedule awareness means HIVE knows when you're in class. At what point does context-awareness cross the line into surveillance-feeling?

---

*Dimension: Notifications & Attention*
*Decision filter: Does this help a student find their people, join something real, and come back tomorrow?*
*North star: Weekly Active Spaces*
*Status: Ideation complete. Ready for prioritization.*
