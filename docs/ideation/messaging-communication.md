# Messaging & Communication

> **Dimension:** Beyond space chat. DMs, group messages, cross-space threads, announcements, async vs real-time, rich media, voice, reactions. The whole communication layer.
> **Decision filter:** Does this help a student find their people, join something real, and come back tomorrow?
> **North star:** Weekly Active Spaces

---

## Current State

### What Exists

**Space Chat (DDD Service Layer)**
- Board-scoped messaging in `spaces/{id}/messages` via `SpaceChatService`
- Text messages, image attachments (max 5), reply-to threading
- Reactions (emoji toggle), pins (leader-only), message search
- Rate limiting: 20 messages/min, 4000 char max, 7-day edit window
- XSS scanning via `SecurityScanner`, @mention processing
- Real-time via Firestore `onSnapshot` listeners on the client
- SSE stream endpoint for chat at `/api/spaces/[spaceId]/chat/stream`
- Unread tracking via `lastReadAt` per member, "Since you left" divider

**DMs (Feature-Flagged, Behind `isDMsEnabled`)**
- 1:1 conversations with deterministic IDs (`dm_{userId1}_{userId2}`)
- Full CRUD: create/get conversation, send/list messages
- Real-time via SSE stream per conversation
- `DMProvider` context with panel open/close, conversation list, send
- `dm_conversations` collection in Firestore with `readState` per participant
- Unread count tracking, message pagination with cursors
- Text-only (`type: 'text'`), no attachments, no reactions, no threads

**Presence**
- Campus-wide: online/away/offline via 60s heartbeat, 5-min stale threshold
- No space-level presence (parameter accepted but ignored)
- Typing indicators with 3s client timeout, no server-side cleanup

**Notifications**
- SSE-based real-time notification stream with polling fallback (30s)
- Notification types include: mention, comment, like, event, space_join
- Space-grouped in bell popover, max 5 per group
- No push notification permission flow (code exists, no UI)
- SendGrid not configured for email delivery

### What Doesn't Exist

- Group DMs (3+ people outside a space)
- Cross-space threads or conversations
- Announcements as a distinct system (only "announcements" board type in spaces)
- Voice or video of any kind
- Rich media in DMs (images, links, files)
- Message formatting (bold, italic, code, links)
- Read receipts in DMs
- Typing indicators in DMs
- Message editing or deletion in DMs
- Reactions in DMs
- Message search in DMs
- Scheduled messages or announcements
- @channel / @everyone mention types
- Message bookmarking or saving
- Forwarding messages between contexts

### Architectural Reality

The communication layer is split across two independent systems that share no code:

1. **Space chat** -- DDD service layer with `SpaceChatService`, board-scoped, feature-rich, uses `withAuthAndErrors` middleware.
2. **DMs** -- Standalone API routes, feature-flagged off, minimal features, uses raw `getSession` (bypasses rate limiting and campus enforcement middleware).

These two systems store data in different Firestore collections, use different real-time patterns, and have different auth flows. Any "communication layer" strategy must decide: converge these, or let them diverge intentionally.

---

## The Opportunity

### Why Communication Matters for HIVE

Communication is the connective tissue between every other system. Spaces without conversation are bulletin boards. Events without coordination are flyers. Connections without messages are contact cards. The communication layer is what makes HIVE feel alive versus feeling like a directory.

But here is the trap: **HIVE is not a messaging app.** GroupMe is a messaging app. Discord is a messaging app. iMessage is a messaging app. HIVE is a community platform where communication happens *in service of belonging and doing*. Every messaging feature must pass this filter: does it pull students deeper into their spaces, or does it pull them into a parallel chat experience that competes with the spaces themselves?

### The Campus Communication Problem

Students at UB currently spread their communication across:
- **GroupMe** -- Default for club/org group chats. Leaders blast, members mute.
- **iMessage/SMS** -- Close friends, small groups, logistics.
- **Discord** -- Gaming, CS, some academic groups. High engagement, niche.
- **Instagram DMs** -- Social, event coordination, one-on-one.
- **Email** -- Institutional, ignored, newsletter-tier.
- **Slack** -- Academic projects, TA communication. Used reluctantly.

No student wants another inbox. Every student wants to find their people and know what is happening. The opportunity is not "better chat" -- it is **communication that is embedded in action**. Messages that are attached to spaces, events, and tools. Not floating in a void.

### The Strategic Tension

Communication features create the strongest retention loops but also the strongest competitive exposure. Every DM HIVE handles is a DM that could have happened on iMessage. Every group chat competes with GroupMe. HIVE wins not by being a better chat app, but by making communication *contextual* -- tied to spaces, events, and the campus graph in ways no general-purpose messenger can replicate.

---

## Feature Ideas

### 1. Space Announcements Channel

**Problem:** Leaders blast important info into general chat. It gets buried under memes and casual conversation within minutes. Members miss RSVPs, meeting changes, deadlines. Leaders get frustrated. Members mute the space entirely.

**Shape:** Every space gets a default `#announcements` board (read-only for members, post-only for admins). Announcements appear as a distinct card type in the message feed -- visually differentiated, pinned to top until acknowledged. Members can "mark as seen" which clears the badge. Leaders see read rates: "23 of 45 members have seen this."

**Wedge:** Club presidents. The person who just sent the same message on GroupMe, Instagram, and email and still had 8 people show up to the wrong room.

**Impact:** High. Solves the #1 complaint from student org leaders. Drives Weekly Active Spaces because leaders have a reason to use HIVE over GroupMe for official communication.

**Effort:** Medium. Board infrastructure exists. Need: admin-only posting permission (exists as concept), acknowledgement tracking (new), visual differentiation in feed (new), read-rate dashboard for leaders (new).

**Tradeoffs:**
- If too prominent, casual members feel nagged and mute the space entirely.
- If not prominent enough, leaders keep using GroupMe and HIVE becomes redundant.
- Read-rate tracking could create social pressure ("why haven't you acknowledged this?").

---

### 2. Event-Attached Threads

**Problem:** Communication about a specific event lives in general chat, scattered across timestamps. "Who's driving?" "What should I bring?" "Is this cancelled?" -- all mixed with unrelated conversation. After the event, the logistics are lost.

**Shape:** Every event automatically gets a discussion thread. Visible from the event card in the calendar, the space feed, and the RSVP list. Thread is scoped to RSVP'd members by default (configurable). Thread persists after event for post-event discussion ("that was awesome, when's the next one?"). Auto-archives after 7 days of inactivity post-event.

**Wedge:** The event organizer who is tired of answering "where is this?" five times in the group chat an hour before the event.

**Impact:** High. Creates a natural communication context that no general-purpose messenger replicates. Directly tied to "come back tomorrow" because event threads create anticipation before and belonging after.

**Effort:** Medium. Thread UI exists (reply-to). Need: event-linked thread creation (new), RSVP-scoped visibility (new), auto-archive (new), event card integration (new).

**Tradeoffs:**
- Could fragment conversation -- members now check both general chat AND event threads.
- If events are low-frequency, threads feel empty and reinforce the "dead space" vibe.
- RSVP-scoping excludes lurkers who might attend but haven't committed.

---

### 3. Quick Replies / Reaction Responses

**Problem:** Most communication on campus is low-bandwidth. "Are you going?" "Yes." "Who's in?" "Me." Students respond to announcements and logistics with one-word answers, but sending a full message feels like too much effort. So they don't respond at all.

**Shape:** Structured quick-reply buttons attached to specific message types. Announcements get "Got it" / "Question" buttons. Event posts get "Going" / "Maybe" / "Can't" (maps to RSVP). Poll-type messages get custom options. Quick replies are one-tap, no keyboard required, and aggregate visually: "23 Going, 5 Maybe."

**Wedge:** The moment a leader posts "Meeting tomorrow at 5 in Capen 210 -- reply if you're coming" and gets 3 responses out of 40 members.

**Impact:** High. Reduces friction to near-zero for the most common communication patterns. Leaders get signal without nagging. Members participate without the cognitive overhead of composing a message.

**Effort:** Low-Medium. Reactions exist. Need: structured reply types on messages (new), aggregate display (new), RSVP mapping (new), one-tap mobile interaction (new).

**Tradeoffs:**
- Could reduce depth of conversation -- members quick-reply instead of engaging.
- If overused, every message becomes a poll and chat feels like a survey.
- Custom quick-reply options require leader configuration (adds complexity to posting).

---

### 4. Contextual DMs (Space-Scoped Private Messages)

**Problem:** A student sees someone interesting in a space -- maybe they posted a great resource, maybe they share an obscure interest. The student wants to reach out privately but the current DM system is disconnected from space context. The resulting message is cold: "Hey, I saw you in the CS space..." There is no warm introduction, no shared context surfaced.

**Shape:** DMs initiated from within a space carry the space context. The conversation header shows "Met in CS 370 Study Group." Shared spaces and interests are surfaced in the conversation sidebar. First-message templates suggest openers based on shared context: "You mentioned [topic] in [space] -- I'm also interested in..." Privacy controls: users can disable DMs entirely, allow only from shared-space members, or allow from anyone on campus.

**Wedge:** The sophomore who wants to message the junior in their entrepreneurship space about a project idea but doesn't want to post publicly.

**Impact:** Medium-High. This is the "find your people" mechanism operating at the individual level. Spaces are where you discover people; DMs are where relationships form.

**Effort:** Medium. DM infrastructure exists. Need: space context attachment (new), shared-context sidebar (new), privacy controls (new, partially exists as ghost mode), first-message templates (new).

**Tradeoffs:**
- DMs can siphon energy away from space conversations. If people DM instead of posting, the space looks dead.
- Privacy concerns are real -- students (especially women) may not want DMs from strangers.
- "Met in [space]" context could feel creepy if the space is large and they never interacted.
- Moderation is harder in private channels.

---

### 5. Announcement Digest (Leader Broadcast)

**Problem:** Leaders need to reach all members, but notifications are broken (no push flow, SendGrid not configured) and in-app notifications are ignored. The result: leaders revert to GroupMe for important announcements, and HIVE becomes the secondary communication channel.

**Shape:** Leaders compose an announcement with type: `urgent` / `informational` / `action-required`. The system delivers it through the highest-fidelity channel available for each member. If push is enabled, push. If not, email. If neither, prominent in-app card that persists until acknowledged. Urgent announcements bypass mute settings. Leaders see delivery analytics: "Pushed to 30, emailed to 10, in-app only for 5."

**Wedge:** The club president who just discovered that 80% of their members have the space muted.

**Impact:** High. Fixes the foundational problem: leaders cannot reliably reach their members. Without this, every other feature is built on a broken foundation.

**Effort:** High. Requires: push notification permission flow (partially built), SendGrid configuration (env vars), delivery orchestration logic (new), announcement persistence UI (new), delivery analytics (new).

**Tradeoffs:**
- Urgent bypass of mute settings will cause backlash if abused. Need rate limits on urgent announcements.
- Email delivery means HIVE becomes yet another email sender. Students already ignore institutional email.
- Delivery analytics could discourage leaders ("only 30% read my announcement").
- Multi-channel delivery is operationally complex and has failure modes per channel.

---

### 6. Lightweight Voice Rooms (Drop-In Audio)

**Problem:** Students are co-located on campus. They don't need Zoom for a club meeting. They don't need FaceTime for a study session. They need the equivalent of "hey, a few of us are on a call if you want to join." A casual, always-available voice room that mirrors the physical experience of an open door.

**Shape:** Each space can have one active voice room at a time. Leaders can "open the room" -- it shows as a green indicator in the space header. Members can drop in and out without ringing, inviting, or scheduling. No video. Minimal UI: avatar bubbles of who's in, mute toggle, leave button. Auto-closes when empty for 5 minutes.

**Wedge:** Study groups during finals week. "We're all working on the same problem set, let's just be on a call together."

**Impact:** Medium. Creates a unique ambient presence that no competitor in the campus space offers. GroupMe doesn't have it. CampusLabs doesn't have it. It makes spaces feel like physical rooms with open doors.

**Effort:** Very High. Requires: WebRTC or third-party audio API (Livekit, Agora, Daily), STUN/TURN servers, audio quality management, mobile browser compatibility, moderation controls for voice. This is essentially building a new product surface.

**Tradeoffs:**
- Massive technical investment for potentially niche usage. Most spaces won't use voice regularly.
- Mobile Safari WebRTC is unreliable. Bad audio quality would be worse than no feature.
- Moderation is nearly impossible in real-time audio. Recording raises legal issues.
- Could fragment attention -- members in voice room don't check chat.
- Competing with Discord's core competency.

---

### 7. Smart Message Threading

**Problem:** Space chat is currently flat (with basic reply-to). In active spaces, conversations overlap. Three people are talking about the upcoming event while two others are sharing memes while someone is asking a homework question. The result is noise. Members who check in after a few hours see a wall of interleaved conversation and give up trying to catch up.

**Shape:** Reply-to messages collapse into threads (Discord/Slack-style). Threads show inline preview in main feed: "Sarah and 3 others replied to 'Who's going Friday?'" Click to expand thread in side panel. Active threads surface in a "Threads" tab in the space sidebar. Threads auto-close after 48 hours of inactivity but remain searchable. Main chat stays clean -- only thread starters and summaries appear in the primary feed.

**Wedge:** The 50+ member space where 3 conversations happen simultaneously and new members feel overwhelmed.

**Impact:** Medium-High. Directly addresses the "come back tomorrow" problem -- threaded conversations are catch-up-friendly. Members can skim the main feed and dive into threads that interest them.

**Effort:** Medium-High. Reply-to infrastructure exists. Need: thread collapse/expand UI (new), side panel thread view (new), thread notification logic (new), "Threads" tab (new), thread-aware unread counts (new).

**Tradeoffs:**
- Threads can fragment conversation -- some members only read main chat, missing thread discussions.
- Low-activity spaces would look deader with threading (one message per thread starter in main feed).
- Mobile threading is notoriously bad UX. Slack and Discord both struggle with this on small screens.
- Learning curve: students accustomed to flat chat (GroupMe, iMessage) may find threading confusing.

---

### 8. @Roles Mentions

**Problem:** Leaders need to notify specific groups within a space. "@all, meeting tomorrow" goes to everyone (including the inactive members who muted). There's no way to say "officers only" or "freshmen" or "going to Friday's event." The result: over-notification of some, under-notification of others.

**Shape:** Space admins can create custom roles (beyond the existing owner/admin/moderator/member hierarchy). Roles are mentionable in chat: `@officers`, `@event-committee`, `@class-of-2028`. Members assigned to roles get notified when their role is mentioned. Role assignment is leader-controlled. Roles appear as colored badges in the member list.

**Wedge:** The exec board president who needs to coordinate with 5 officers without pinging 200 members.

**Impact:** Medium. Solves a real coordination problem for leaders. Reduces notification fatigue for members. Increases the precision of communication.

**Effort:** Medium. Member roles exist (owner/admin/mod/member). Need: custom role creation (new), role assignment UI (new), role mention parsing in chat (extension of existing @mention system), role-scoped notifications (new).

**Tradeoffs:**
- Role management adds complexity for leaders who just want simple chat.
- Too many roles creates its own noise ("which role am I in again?").
- Role mentions could be abused for spam/attention-seeking by admins.
- "Why am I in this role?" moments when someone doesn't remember being assigned.

---

### 9. Message Scheduling

**Problem:** Leaders know when their members are most active (evenings and weekends) but they compose announcements during the day. Posting at 2pm on Tuesday means the message is buried by 8pm when members actually check in. Leaders either forget to post later or post at suboptimal times.

**Shape:** When composing a message or announcement, leaders can tap "Schedule" and pick a date/time. Scheduled messages appear in a "Scheduled" tab visible only to the sender. Message sends at the chosen time with the leader's name and avatar (not "system"). If the leader edits or deletes before send time, it updates/cancels. Simple: no AI suggestion, no analytics-based timing. Just "send this at 8pm tonight."

**Wedge:** The club leader who writes the weekly update on Monday morning but knows nobody checks until Monday night.

**Impact:** Low-Medium. Quality-of-life for leaders. Marginal impact on Weekly Active Spaces but contributes to the "leaders choose HIVE over GroupMe" narrative.

**Effort:** Low-Medium. Need: scheduled message storage (new collection or field), cron job to process scheduled sends (cron infrastructure exists), scheduled message management UI (new), send-as-user logic (new).

**Tradeoffs:**
- Scheduled messages feel impersonal compared to live communication.
- If the context changes (event cancelled) and the leader forgets to cancel the scheduled message, it causes confusion.
- Adds complexity to the posting flow for what is a niche use case.

---

### 10. Shared Media Gallery

**Problem:** Photos from events, meeting notes, and shared files get lost in the chat scroll. A student who missed last week's meeting can't find the slide deck someone shared. Event photos are on someone's phone but nowhere accessible to the group. The chat becomes a write-only medium for non-text content.

**Shape:** Every space has a "Media" tab that auto-aggregates images, files, and links shared in chat. Organized by date with the context of who shared it. Members can also upload directly to the gallery without posting to chat. Event photos auto-group by event. Leaders can pin important files to the top. Simple grid view for images, list view for files/links.

**Wedge:** The first-year looking for the slide deck from last week's club meeting that was shared somewhere in a 200-message chat history.

**Impact:** Medium. Makes spaces more useful beyond real-time conversation. Creates a persistent, browsable knowledge base for the community. Contributes to "come back tomorrow" by giving members something to come back to even when chat is quiet.

**Effort:** Medium. Image attachments exist in space chat. Need: media aggregation query (new), gallery UI component (new), direct upload to gallery (new), event-grouping logic (new), file type support beyond images (new).

**Tradeoffs:**
- Storage costs scale with usage. Need limits (per-space, per-member, file size).
- Moderation of uploaded media is harder than text moderation.
- Gallery could become a dumping ground if not curated. Need leader curation tools.
- Competes with Google Drive, Notion, and other document-sharing tools students already use.

---

### 11. Cross-Space Inbox

**Problem:** A student belongs to 7 spaces. Each has its own chat, its own unread count, its own notification stream. There is no unified view of "what did I miss across all my communities?" The student must open each space individually to catch up, which takes time and creates the feeling of obligation rather than excitement.

**Shape:** A single "Inbox" view accessible from the bottom nav that shows all unread messages, mentions, and announcements across all joined spaces. Grouped by space with the most recent activity first. Inline reply without leaving the inbox. Mark individual items or entire spaces as read. Filter by: mentions, announcements, all activity. This is NOT a merged timeline -- it is a triage view.

**Wedge:** The student who belongs to 10+ spaces and has stopped checking most of them because the cognitive overhead of opening each one is too high.

**Impact:** High. Directly addresses the "come back tomorrow" problem at scale. The more spaces a student joins, the more valuable the inbox becomes. Creates a retention loop: inbox shows activity across spaces, student engages, more activity generates, inbox shows more.

**Effort:** High. Need: cross-space message aggregation API (new), inbox UI (new), inline reply from inbox (new), per-space read state management (partially exists), bottom nav modification (new tab or overlay).

**Tradeoffs:**
- Could reduce time spent *in* spaces. If students triage from inbox, they never enter the space itself. The space loses ambient activity.
- Inbox creates an obligation: "I have 47 unread messages" is anxiety, not excitement.
- Engineering complexity of aggregating real-time data across N spaces per user.
- Competes with notification bell for attention. Two "what did I miss" surfaces is confusing.

---

### 12. Whisper Replies (Anonymous Questions in Spaces)

**Problem:** Students don't ask questions in group spaces because they're afraid of looking dumb. "Does anyone know when the assignment is due?" feels risky in a 200-person space. The result: spaces have low engagement because participation feels high-stakes. Lurking is safe. Posting is scary.

**Shape:** A "Whisper" mode for posting in spaces. Message appears in the feed attributed to "A member of [Space]" with no identifying information. Only space admins can see the true author (for moderation). Whisper posts are visually distinct (muted styling, different avatar). Replies to whispers are non-anonymous by default. Whisper is a per-message toggle, not a persistent mode. Rate-limited: 3 whispers per day per member per space.

**Wedge:** The first-year in a 300-person engineering space who has a question but doesn't want to be the one who asks it.

**Impact:** Medium. Lowers the barrier to first participation, which is the hardest moment for community building. A lurker who whispers is one step closer to becoming a regular participant.

**Effort:** Low-Medium. Need: anonymous posting flag on messages (new), admin-only reveal (extension of moderation tools), visual differentiation (new CSS), rate limiting (extends existing per-user rate limit).

**Tradeoffs:**
- Anonymity enables abuse. Even with moderation, anonymous messages can be toxic.
- Could undermine the "real identity" constraint that is non-negotiable in CLAUDE.md.
- If overused, spaces feel less personal. "A member" is not someone you connect with.
- Rate limiting whispers feels arbitrary. Why 3? What if you have 4 genuine questions?
- The admin-reveal creates a trust issue: "is my whisper really anonymous?"

---

### 13. Space Activity Recap (AI-Generated Catch-Up)

**Problem:** A student hasn't opened a space in 3 days. There are now 150 unread messages. The student's options: scroll through all 150 (nobody does this), or mark as read and lose context (everyone does this). The result: students who miss a few days of activity permanently disconnect from the conversation.

**Shape:** When a student opens a space with 20+ unread messages, show a one-paragraph AI-generated recap at the top of the chat. "While you were away: The group decided to move Friday's meeting to 6pm. Sarah shared the study guide for the midterm. 3 people are interested in carpooling to the conference." Recap is collapsed by default -- tap to expand. Recap covers key decisions, events, and popular messages. Powered by summarization of messages with high engagement (reactions, replies).

**Wedge:** The student who opens a space, sees "142 unread," and immediately hits "mark all as read."

**Impact:** Medium-High. Directly addresses "come back tomorrow" by making catch-up effortless. The student who comes back after 3 days should feel welcomed, not overwhelmed.

**Effort:** High. Requires: message summarization pipeline (new, needs LLM integration), importance scoring for messages (new), recap generation and caching (new), recap UI component (new), privacy considerations (summarizing private conversations).

**Tradeoffs:**
- AI summarization costs money per invocation. At 32K students, cost scales fast.
- Summaries can miss nuance, misrepresent tone, or omit important messages.
- Privacy: are members okay with their messages being processed by an LLM?
- If summaries are bad, they're worse than no summary. Trust erosion.
- Could reduce message reading: "I'll just read the recap" means less engagement with individual posts.

---

### 14. Huddle Rooms (Temporary Group Chat)

**Problem:** Not every conversation belongs in a space. Three people from different spaces want to coordinate a road trip to a conference. A study group needs a temporary chat for the week before finals. Currently the only options are: create a whole space (overkill), use DMs (limited to 1:1), or go to GroupMe (leaves HIVE).

**Shape:** Lightweight group conversations for 3-20 people. Created in 2 taps: name + invite members. No boards, no settings, no events -- just chat. Huddles auto-archive after 7 days of inactivity. Members can re-activate a huddle. Huddles appear in the DM panel alongside 1:1 conversations. They don't appear in the Spaces list. Think: iMessage group chat, not Discord server.

**Wedge:** The 4 students from 3 different spaces who need to plan something together without creating infrastructure.

**Impact:** Medium. Fills the gap between 1:1 DMs and full spaces. Keeps coordination inside HIVE rather than pushing it to GroupMe. Doesn't directly increase Weekly Active Spaces, but increases time-in-app.

**Effort:** Medium. DM infrastructure generalizes to groups. Need: multi-participant conversation support (extends `dm_conversations` to N participants), group creation UI (new), invite/add/remove members (new), auto-archive logic (new).

**Tradeoffs:**
- Directly competes with GroupMe and iMessage group chats on their home turf.
- Could cannibalize space creation. "Why start a space when I can just make a huddle?"
- More conversations = more notification fatigue.
- Auto-archive at 7 days may delete conversations people still want.
- No moderation infrastructure for huddles (spaces have it, huddles wouldn't).

---

### 15. Rich Link Previews & Embeds

**Problem:** Students share links to Google Docs, YouTube videos, Spotify playlists, Instagram posts, and campus resources constantly. Currently these render as plain text URLs. The recipient has to leave HIVE to see what the link is about. Every outbound click is a risk that the student doesn't come back.

**Shape:** When a URL is posted in chat (space or DM), the system fetches OpenGraph metadata and renders a rich preview card: title, description, thumbnail image. YouTube links embed a playable video. Spotify embeds a playable preview. Google Docs show the document title and last editor. Campus-specific URLs (UB course catalog, library) get custom formatting. All previews are cached and rendered server-side for performance.

**Wedge:** The student who posts a YouTube link to a project demo and gets zero engagement because it's just a URL string.

**Impact:** Low-Medium. Quality-of-life improvement that makes chat feel modern. Reduces outbound navigation. Small but real contribution to "come back tomorrow" through better content richness in the feed.

**Effort:** Low-Medium. Need: OpenGraph fetching service (new), preview card component (new), embed rendering for YouTube/Spotify (new), caching layer for fetched metadata (new), XSS-safe rendering of third-party content (critical).

**Tradeoffs:**
- Fetching arbitrary URLs server-side creates SSRF risk. Must validate and sanitize aggressively.
- Slow or failed fetches degrade the messaging experience (preview shows after delay).
- Cached previews can become stale (link target changes, preview doesn't).
- Some links are behind auth (Google Docs, Notion) and won't have useful metadata.
- Storage cost for cached thumbnails/metadata.

---

## Quick Wins (Ship in Days)

**1. Fix DM auth middleware** -- DM routes use raw `getSession()`, bypassing `withAuthAndErrors`. Migrate to standard middleware. Zero user-visible change. Fixes a real security gap.

**2. Enable reactions in DMs** -- Reaction infrastructure exists in space chat. Add emoji reactions to DM messages. Same data model (`reactions: Record<string, string[]>`). High-signal, low-effort.

**3. Typing indicators in DMs** -- `useTypingIndicator` hook exists for space chat. Wire it into DM conversations. Small Firestore subcollection (`dm_conversations/{id}/typing`).

**4. Image sharing in DMs** -- Space chat supports image attachments. DM messages are text-only. Extend DM message type to support images using the same attachment schema.

**5. Announcement board auto-creation** -- When a space reaches "active" status, auto-create an `#announcements` board with `type: 'announcements'`. Board infrastructure exists. Just needs the auto-creation trigger.

**6. Typing indicator cleanup job** -- Server-side cron that batch-deletes typing indicators older than 10 seconds. Cron infrastructure exists (`/api/cron/`). Fixes the "permanently typing" ghost bug.

---

## Medium Bets (Ship in Weeks)

**1. Space Announcements with Acknowledgements** -- Announcements board with admin-only posting, "Got it" acknowledgement tracking, read-rate analytics for leaders. 1-2 week build.

**2. Event-Attached Threads** -- Auto-create discussion threads for events. RSVP-scoped. Visible from event card and calendar. 1-2 week build.

**3. Quick Replies on Structured Messages** -- "Going/Maybe/Can't" buttons on event posts, "Got it/Question" on announcements. One-tap interaction with aggregate display. 1-2 week build.

**4. Contextual DMs with Privacy Controls** -- Space context on DM conversations. Privacy settings: anyone / shared-space only / nobody. Shared spaces and interests in sidebar. 2-3 week build.

**5. Smart Message Threading** -- Collapse replies into threads. Inline preview in main feed. Side-panel thread expansion. "Threads" tab in sidebar. 2-3 week build.

**6. Shared Media Gallery** -- Auto-aggregate images and files from chat into browsable gallery tab. Event-grouped photos. Leader pinning. 2 week build.

---

## Moonshots (Ship in Months+)

**1. Drop-In Voice Rooms** -- Ambient audio for spaces. No scheduling, no ringing. Drop in, hang out, leave. Requires WebRTC/third-party audio infrastructure. 2-3 months minimum.

**2. AI Catch-Up Recaps** -- LLM-generated summaries of missed conversations. "While you were away" cards. Requires summarization pipeline, privacy framework, cost management. 1-2 months.

**3. Cross-Space Unified Inbox** -- Single triage view for all communication across spaces. Inline reply, per-space mark-as-read, smart filtering. 1-2 months.

**4. Huddle Rooms (Temp Group Chat)** -- Lightweight 3-20 person group conversations. Auto-archive. No space overhead. Extends DM infrastructure. 1-2 months.

**5. Campus-Wide Broadcast System** -- Institution-level announcements from campus administrators. Delivery orchestration across push, email, and in-app. Integration with university comms office. 3+ months.

---

## Competitive Analysis

### GroupMe
**What it does well:** Universal adoption on campus. Zero setup -- text a phone number to join. Works without a smartphone (SMS fallback). Dead simple: group name, members, messages. Everyone already has it.

**Where it structurally fails:** No concept of "community" -- just message lists. No events, no tools, no shared context. No threading. No organization. Notifications are all-or-nothing. No rich media. No analytics for leaders. Owned by Microsoft, development is stagnant.

**HIVE's opportunity:** GroupMe has no spatial awareness. It doesn't know what a "space" is, what an "event" is, or what a "member" is beyond a phone number. HIVE's communication is contextual: messages attached to spaces, threads attached to events, announcements with delivery tracking. GroupMe is a pipe; HIVE is an environment.

**HIVE's risk:** GroupMe's strength is that it's already there. Every student already has it. Migration cost is enormous. HIVE should not try to replace GroupMe for casual chatting -- it should make GroupMe irrelevant for *organized* communication.

### Discord
**What it does well:** Rich communication (voice, video, threads, forums, bots). Deep customization. Excellent real-time performance. Strong community features. Voice channels are the gold standard for ambient audio.

**Where it structurally fails:** Not campus-scoped. No real identity verification. Complex setup (channels, permissions, roles) intimidates non-technical users. Gaming aesthetic alienates non-gamers. No campus graph, no academic context, no event RSVP system.

**HIVE's opportunity:** Discord is generic. HIVE is campus-native. Discord doesn't know your major, your year, your campus events, or which orgs you're in. HIVE's communication is embedded in the campus context.

**HIVE's risk:** CS and gaming students already have Discord servers and won't switch. Don't compete on feature depth. Compete on context and integration.

### Slack
**What it does well:** Threading, search, integrations, channels. Professional communication standard. Good mobile app.

**Where it structurally fails:** Professional aesthetic feels wrong for college social life. Per-workspace silos (can't see across workspaces). Paid features gate important functionality. No campus awareness.

**HIVE's opportunity:** Slack is for work. HIVE is for belonging. The communication style is fundamentally different: Slack optimizes for productivity, HIVE optimizes for connection.

**HIVE's risk:** Academic project groups may prefer Slack (or already use it). Don't try to be Slack for schoolwork.

### iMessage / WhatsApp
**What they do well:** Universal. Instant. Rich media. Group chats just work. End-to-end encrypted. Deeply integrated into the phone.

**Where they structurally fail:** No community features. No events. No shared context beyond the chat itself. Group chats have no moderation, no roles, no persistence. They're conversations, not communities.

**HIVE's opportunity:** Private messaging should flow from community context. A DM that says "Met in Entrepreneurship Club" is warmer than a cold text. HIVE knows the social graph.

**HIVE's risk:** Nobody will abandon iMessage for DMs with close friends. Don't try. Focus on community-contextual messaging where iMessage has no advantage.

---

## Wedge Opportunities

### Wedge 1: Leader Communication Tools
**Who:** Student org presidents, club exec boards, team captains.
**Pain:** They cannot reliably reach their members. They send the same announcement on 4 platforms. They have no idea who read it.
**Entry point:** Announcements with delivery tracking and acknowledgement.
**Expansion path:** Announcements -> scheduled messages -> event coordination -> full space communication.
**Why today:** Clubs are organizing for spring semester right now. Leaders are actively frustrated.

### Wedge 2: Event Coordination
**Who:** Event organizers, social chairs, students attending events.
**Pain:** "Where is this?" "Is this still happening?" "Who's driving?" -- all happening in fragmented group chats.
**Entry point:** Event-attached threads with RSVP-scoped membership.
**Expansion path:** Event threads -> event recaps -> event media galleries -> event-driven community formation.
**Why today:** Spring event season is starting. Every event that coordinates through HIVE is a retention hook.

### Wedge 3: First-Week Orientation Communication
**Who:** New students, orientation leaders, residential advisors.
**Pain:** New students are bombarded with information from 20 sources. They miss the one message that matters. They don't know anyone and are too shy to ask questions publicly.
**Entry point:** Whisper replies (anonymous questions) + welcome sequences (automated DMs from space leaders).
**Expansion path:** Anonymous questions -> first post -> first connection -> first DM -> active member.
**Why today:** Fall orientation planning starts in spring. Partner with Student Life now.

---

## Open Questions

**1. Should DMs and Space Chat converge architecturally?**
Currently they're two separate systems with different auth, different collections, different real-time mechanisms. Converging them means shared infrastructure but higher coupling. Diverging means duplicated effort but independent evolution. What's the right answer for a team of this size?

**2. How aggressive should HIVE be about notification delivery?**
The push notification permission flow doesn't exist. Email delivery isn't configured. If HIVE can't reach students, communication features are academic. But aggressive notification delivery risks being perceived as spam. Where is the line?

**3. Is voice/video worth the investment at launch?**
Drop-in voice rooms are a differentiator, but the build cost is enormous and the usage pattern is unproven for campus communities. Should HIVE ship text-first and add voice later, or would voice be the wedge that makes spaces feel alive?

**4. How should HIVE handle the GroupMe migration problem?**
Students won't use two group chats for the same organization. HIVE either replaces GroupMe for a space's communication or it doesn't. What's the migration playbook? Should HIVE offer GroupMe import? Should there be a "bridge" that mirrors messages between platforms during transition?

**5. What is the moderation model for DMs?**
Space chat has moderation tools (flag, hide, remove, audit trail). DMs are private by design. If a student reports harassment via DM, what does the moderation flow look like? How does HIVE balance privacy with safety?

**6. Should cross-space communication exist at all?**
A cross-space inbox increases convenience but reduces time spent *inside* individual spaces. If the north star is Weekly Active Spaces, should every communication feature push people INTO spaces rather than giving them a way to interact from outside?

**7. What's the right threading model for a campus audience?**
Discord's threading works for tech-literate gamers. Slack's threading works for professionals. GroupMe has no threading. What works for a general college student population? Is threading a power-user feature that should be optional, or is it essential for spaces above a certain size?

**8. How does HIVE's communication layer respect academic integrity?**
Students sharing homework answers, exam questions, and assignment solutions in space chats creates institutional liability. Should HIVE have content policies for academic integrity? Should leaders be able to flag academic content? Should the university have visibility?

**9. When does "better communication" become "more noise"?**
Every new communication channel (announcements, event threads, DMs, huddles, voice) adds cognitive load. At what point does the communication layer become so rich that students feel overwhelmed rather than connected? What's the editing principle?

**10. Should HIVE own the full messaging stack or integrate with existing tools?**
Building a full messaging layer means competing with iMessage, GroupMe, and Discord simultaneously. Integrating (e.g., deep linking into GroupMe, surfacing iMessage contacts) means dependency on platforms that could change their APIs. Which risk is worse?
