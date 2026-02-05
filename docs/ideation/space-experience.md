# Space Experience

> **Dimension:** What it feels like inside a community. The room itself.
> **Decision Filter:** Does this help a student find their people, join something real, and come back tomorrow?
> **North Star:** Weekly Active Spaces (spaces with 10+ messages/week)
> **Primary Persona:** Club Leaders

---

## Current State

**What exists today:**

A space is a Linear-style split-panel view. 200px sidebar (boards, tools, members), flexible main area (chat feed + input). There is a header with name, avatar, online count, member count, energy level indicator, and social links. Members see a chat feed with messages, reactions, replies, mentions, and a "since you left" unread divider. Leaders get a settings panel (1,950 lines, monolithic), moderation tools, member management, and board CRUD.

**What it actually feels like:**

Every space looks the same. Same dark background (`#050504`), same layout, same sidebar, same chat. A robotics club and a dance team have identical rooms. The only identity signals are name, avatar, and description. The chat is the space — there is no concept of a space being more than its conversation stream. Boards exist but are mostly unused because messages route to one main channel. Events exist as data but don't shape the room. Presence shows campus-wide counts, not who's actually in this space right now.

**The gap between "chat room" and "community room":**

Right now a HIVE space is a group chat with a sidebar. Discord figured out years ago that a community is not a single stream — it's a collection of contexts (channels, voice, stages, forums). HIVE has boards (the equivalent of channels) but they're underdeveloped — no board-level chat, no per-board unread tracking that works in real-time, no visual differentiation between board types.

**Technical state:**
- `page.tsx`: ~1,200 lines, needs component extraction
- `space-settings.tsx`: 1,950 lines, needs splitting into tab components
- `use-space-residence-state.ts`: 950 lines, monolithic state hook
- Chat avatar bug: only renders `AvatarFallback`, never `AvatarImage`
- Unread count hardcoded to 0
- No space-specific presence (only campus-wide)
- Typing indicator cleanup job missing (stale "typing..." forever)
- Join request race condition (no transaction)

---

## The Opportunity

**The insight:** A space should feel like walking into a room that has a personality — not opening another chat window. The moment a student enters a space, the room itself should communicate: this place is alive, these people are here, this is what we're about, this is what's happening next.

Club leaders at UB manage wildly different organizations. The Society of Automotive Engineers needs a space that feels like a workshop — project boards, resource links, build logs. UB Dance Marathon needs a space that feels like a party — countdowns, photo galleries, fundraising trackers. UB Hacking needs a space that feels like a terminal — code snippets, event schedules, team formations.

The opportunity is not "more features in the sidebar." The opportunity is that the room itself adapts to what the community is. When a robotics team opens their space, the first thing they see isn't a chat stream — it's their next competition deadline, their current project status, and who's in the shop right now. When a social fraternity opens their space, they see this week's events, the vibe check, and who's online.

**Why this matters for the north star:**

Weekly Active Spaces requires two things: leaders who configure and maintain, and members who return daily. Right now, a member returns to check messages. That's it. If the space itself communicated "here's why you should be here right now," the return rate changes. A space that shows "3 people are working on the autonomous vehicle right now" is more magnetic than one that shows "47 unread messages."

**The wedge:**

Club leaders are drowning in platform fatigue. If HIVE spaces can replace the three things they currently spread across Discord, Instagram, and GroupMe — real-time chat, event coordination, and member engagement — they'll consolidate. The room has to do all three without feeling like three separate tools.

---

## Feature Ideas

### 1. Space Modes — Adaptive Room Layouts

**Problem:** Every space looks identical regardless of what the community is doing. A study group in exam week needs a different room than a club hosting a social event. The one-size-fits-all layout means the room never matches the moment.

**Shape:** Leaders choose or the system auto-detects a "mode" for the space. Modes change the layout, prominence of elements, and information hierarchy — not the underlying data.

- **Hangout Mode** (default): Chat-forward. The feed is 70% of the screen. Presence is prominent. Feels like a group chat with context.
- **Event Mode**: Triggers when an event is <24 hours away. Event details + RSVP are hero. Chat becomes a side panel. Countdown timer visible. Attendance tracker prominent.
- **Work Mode**: Board-forward. Sidebar expands. Active boards show previews. Chat collapses to a slim panel. Good for orgs with multiple active projects.
- **Broadcast Mode**: For announcements. Single-column, announcement-first. Only admins post. Members react and comment. Instagram stories energy but for org communication.

Leaders can pin a mode or let the system auto-switch based on context (upcoming event, time of day, board activity).

**Wedge:** Leaders currently switch between Discord (chat), Instagram (broadcast), and email (announcements). Modes let one room do all three.

**Impact:** High. Directly addresses "same room for everything" problem. Makes spaces feel purpose-built.

**Effort:** Medium. Layout variants are CSS/component swaps on existing data. Auto-detection needs event/activity signals.

**Tradeoffs:**
- Complexity for leaders if too many modes. Cap at 4-5 built-in modes.
- Auto-switching could be disorienting. Needs clear visual transition and leader override.
- Mode state needs to be per-space, not per-user (everyone sees the same room).

---

### 2. Space Personality — Visual Identity Beyond Avatar

**Problem:** The only visual identity a space has is its name and avatar. The Anime Club and the Pre-Law Society feel like the same place. There's no visual language for community type, energy, or culture.

**Shape:** Leaders customize a lightweight visual personality for their space:

- **Accent Color**: One color from a curated palette (not arbitrary hex — prevents ugly spaces). Tints the header, link highlights, button accents, and the sidebar active state.
- **Header Banner**: Optional hero image or gradient behind the header. Think Spotify playlist headers — atmospheric, not busy.
- **Space Emoji**: A single emoji that appears next to the space name everywhere (in nav, in notifications, in mentions). Cheap identity signal. `robotics-club` becomes `[robot emoji] Robotics Club`.
- **Vibe Tag**: A short descriptor under the name — "Workshop" or "Social" or "Academic" or a custom one-liner. Not a description, a vibe.

**Wedge:** GroupMe and basic Discord servers have zero visual identity. Instagram is visual but not a community tool. This is the intersection: a community room that actually looks like it belongs to someone.

**Impact:** Medium-high. Low-effort high-signal feature for leaders. Every screenshot and share carries visual identity.

**Effort:** Low-medium. Accent color is a CSS variable swap. Banner is an image upload to Firebase Storage (already exists). Emoji and vibe tag are string fields on the space document.

**Tradeoffs:**
- Curated palette prevents ugly spaces but limits expression. Allow 12-16 palette options, not arbitrary colors.
- Banner images need moderation (inappropriate content). Use existing moderation pipeline.
- Risk of "MySpace syndrome" — too much customization makes the platform feel inconsistent. Keep the skeleton identical, only change the skin.

---

### 3. Living Space Header — The Heartbeat

**Problem:** The space header shows static info: name, avatar, member count, online count. It doesn't communicate "what's happening right now" or "why you should care today." It's a nameplate, not a pulse.

**Shape:** Replace the static header with a living header that changes based on what's actually happening in the space:

- **Active Now Strip**: Instead of just "12 online," show avatar chips of 3-5 members currently active. Faces are more magnetic than numbers. Tap to see full online list.
- **Next Up**: If an event is coming, the header shows a compact event card: "Workshop @ Capen 202 — 3:00 PM — 14 going." It replaces the description area contextually.
- **Hot Thread**: If a conversation thread has 5+ replies in the last hour, surface it: "Hot: Who's going to the career fair?" Tap to jump.
- **Milestone Pulse**: When the space hits a growth milestone (50 members, 100th event, 1-year anniversary), the header shows a celebration state for 24 hours.

The header adapts to the most relevant signal. Priority: active event > hot thread > active members > static description.

**Wedge:** No competing platform has a header that tells you what's happening right now. Discord has a static channel topic. GroupMe has nothing. This is ambient awareness — you glance and know.

**Impact:** High. Directly drives return visits. "I saw 3 friends were active" or "there's an event in 2 hours" are concrete reasons to engage.

**Effort:** Medium. Active members needs space-specific presence (P1 gap already identified). Event data exists. Thread detection is a query on message replies.

**Tradeoffs:**
- Information density risk. Header must stay compact — one signal at a time, not a dashboard.
- Requires space-specific presence (not yet shipped). Dependent on P1 presence work.
- "Hot thread" detection could surface arguments or drama. Needs content quality signal, not just volume.

---

### 4. Boards That Breathe — Channel Evolution

**Problem:** Boards exist as metadata but aren't used as separate conversation spaces. All messages go to one main feed. This means spaces with diverse activity (events, resources, general chat, project updates) collapse into one undifferentiated stream.

**Shape:** Make boards into real rooms:

- **Board-Level Chat**: Each board has its own message feed. Switch boards, switch conversations. The main feed becomes the "General" board.
- **Board Types with Purpose**: Different board types have different behaviors:
  - `chat`: Standard message feed (current behavior)
  - `announcements`: Only admins post, everyone reacts/replies
  - `resources`: Link-forward. Posts display as cards with title, link, description. Think Notion bookmarks.
  - `events`: Event cards with RSVP inline. No free-form messages — just events.
  - `projects`: Kanban-style cards with status (to-do, in progress, done)
- **Per-Board Unread**: Each board has its own unread count. The sidebar shows which boards have new activity.
- **Board Ordering**: Leaders drag to reorder. New members see boards in leader-defined priority order.

**Wedge:** Discord has channels but they're all the same type (text or voice). Slack has channels. Neither has typed boards that change behavior based on purpose. A `resources` board that renders links as cards is genuinely different from a chat channel with links pasted in.

**Impact:** Very high. This is the "chat room to community room" transition. Multiple contexts under one roof.

**Effort:** High. Board-level chat requires `boardId` on messages, updated queries, per-board unread tracking. Board types require different renderers per type.

**Tradeoffs:**
- Fragmentation risk. Too many boards and activity spreads thin. Default to 3 boards max for new spaces, unlock more as the space grows.
- Complexity for leaders who just want a simple group chat. "Simple mode" stays one-channel. Boards are opt-in.
- Migration: existing messages need to be attributed to a "General" board.

---

### 5. Pinned Context — The Space's Memory

**Problem:** Important information gets buried in the chat stream. A link shared 3 days ago is effectively lost. The "pinned messages" concept exists in Discord but is underused because it's just a list of messages with no organization.

**Shape:** A persistent, organized layer above the chat:

- **Pinned Cards**: Leaders pin not just messages but structured cards. A pinned card has a title, body, optional link, and expiration date. "Meeting Notes — Feb 3" or "Competition Rules" or "Weekly Schedule."
- **Pin Categories**: Resources, Announcements, Links, Rules. Each category shows as a collapsible section in a "Space Info" panel accessible from the header.
- **Auto-Expire Pins**: Pins can have an expiration ("Pin until Feb 14"). After expiry, they auto-archive. Prevents stale pins that no one maintains.
- **Pin from Chat**: Highlight a message, click "Pin as card," and it promotes to a structured pin. Add title and category, done.

**Wedge:** GroupMe has no pinning. Discord's pinning is a flat list. Instagram has highlights but no interactivity. Structured, categorized pins with expiration is a genuinely new pattern for community spaces.

**Impact:** Medium-high. Addresses information retrieval — the thing that makes group chats useless after 48 hours.

**Effort:** Medium. New subcollection `spaces/{id}/pins/{id}` with type, title, body, expiresAt. Pin-from-chat is a UI flow promoting a message doc.

**Tradeoffs:**
- Leaders must actually maintain pins. Default templates help ("Your space has no pinned resources — add your first").
- Too many pins and it becomes another feed to scroll. Cap at 15-20 active pins per category.
- Expiration needs a cleanup job (Cloud Function, nightly).

---

### 6. Presence That Matters — "Who's Here Right Now"

**Problem:** Presence currently shows campus-wide online count, not who's in this specific space. "12 online" means nothing when you don't know if it's your friends or strangers. And presence updates are based on a 60-second heartbeat with 5-minute stale threshold, meaning the data is often 2-5 minutes stale.

**Shape:**

- **Space-Scoped Presence**: Track who is currently viewing this space. Not campus-wide — this room.
- **Active vs. Lurking**: Differentiate "has the tab open" from "sent a message in the last 5 minutes." Active users get a solid green dot, lurking users get a hollow one.
- **Presence Clusters**: Group online members by role or affinity. "3 board members online" or "5 people from your major online." Makes presence meaningful, not just a number.
- **"Come Back" Signal**: If a space had 8 active members 10 minutes ago and now has 2, show former-active members: "Sarah, Mike, and 4 others were here recently." This creates FOMO — the good kind.

**Wedge:** Discord shows who's online in a server but not who's in a specific channel. GroupMe shows nothing. Space-scoped presence with recency signals is unique.

**Impact:** High. Presence is the primary "is this space alive?" signal. Better presence directly drives engagement and return visits.

**Effort:** Medium. Requires new `spaces/{id}/presence/{userId}` subcollection, heartbeat on space page mount, cleanup on unmount/tab close. Already identified as P1 gap.

**Tradeoffs:**
- Privacy: some users don't want to broadcast presence. Ghost mode already exists — needs to be respected here.
- Performance: per-space presence listeners add Firestore reads. Batch with existing presence heartbeat.
- "Come back" signal could feel surveillance-y. Frame as "recent activity" not "we tracked who left."

---

### 7. The Space Threshold — Earning Your Way In

**Problem:** The join experience is binary: you're outside or inside. The threshold page (pre-join) shows name, description, member count, and a join button. It doesn't give prospective members a reason to commit or a taste of what's inside.

**Shape:** Make the threshold a selling page for the space:

- **Activity Preview**: Show blurred/anonymized recent messages. "23 messages today" with a ghost of the conversation visible. Enough to feel alive, not enough to read.
- **Upcoming Events**: Show the next 2-3 events publicly. "Workshop: Intro to PCB Design — Feb 8, 3 PM — 11 going." Events are the best hook because they have deadlines and social proof.
- **Member Mosaic**: A grid of member avatars (first 20-30) without names. Social proof: "these people are here." Familiar faces trigger joining.
- **Leader Welcome**: A short video or text from the space leader. "Hey, we're the UB Robotics Club. We build autonomous vehicles and compete nationally. Come hang out." Personalized invitation > generic description.
- **Gathering Progress**: Already exists. Keep and enhance the quorum visualization for spaces in gathering state.

**Wedge:** No platform has a "storefront" for communities. Discord shows a server description and member count. GroupMe shows nothing — you need an invite link. A rich threshold that sells the space before you commit is a competitive advantage for organic growth.

**Impact:** Medium-high. Directly affects join conversion rate. Better threshold = more members = more active spaces = north star.

**Effort:** Medium. Activity preview needs a public-safe aggregation endpoint. Events data exists. Member mosaic is a query on the members subcollection with avatar URLs.

**Tradeoffs:**
- Privacy: blurred messages must not be readable. Aggregate metrics are safer than blurred content.
- Leader welcome video adds upload complexity. Start with text-only, add video later.
- Rich threshold adds load time for non-members. Lazy-load below the fold.

---

### 8. Conversation Starters — Breaking the Silence

**Problem:** The hardest moment in a space is the first silence. After the initial join burst, activity drops because no one wants to be the first to talk. Leaders don't know what to post. The empty chat feed feels like a dead room.

**Shape:**

- **Daily Prompts**: Surface a conversation starter at the top of the chat when the space has been quiet for 12+ hours. Contextual to the space type: "What project are you working on this week?" for academic clubs, "What's everyone doing this weekend?" for social groups. Leaders can customize or disable.
- **Ice Breaker Posts**: When a new member joins, auto-generate an ice breaker: "[Name] just joined! They're interested in [interests]. Welcome them!" This gives existing members a low-friction reason to say hello and gives the new member immediate acknowledgment.
- **Reaction Polls**: Quick-tap polls embedded in the prompt. "What should our next event be? [Workshop emoji] [Social emoji] [Competition emoji]." One tap to participate. Zero-effort engagement.
- **"This or That"**: A lightweight game format. Two options, members tap one. Results show live. "Morning meetings or evening meetings?" "Build night this week: Thursday or Friday?" Generates data leaders actually need.

**Wedge:** GroupMe and Discord have bot-based conversation starters but they feel robotic and spammy. These are native, contextual, and designed to generate real decisions — not engagement theater.

**Impact:** Medium-high. Directly attacks the cold space problem. If even 1 in 5 prompts generates a thread, that's +1 active day per week per space.

**Effort:** Low-medium. Prompts are system messages with a template engine. Reaction polls reuse existing reaction infrastructure. Ice breaker uses onboarding interest data.

**Tradeoffs:**
- Prompts can feel corporate or cringe if poorly written. Tone must be casual, student-native. Let leaders edit/approve before posting.
- Frequency matters. Daily is fine for active spaces. For quiet spaces, even weekly might feel desperate. Tie frequency to existing activity level.
- "This or That" could degrade into trivia noise. Limit to 1 per week unless leader configures more.

---

### 9. Space Timeline — Events as Architecture

**Problem:** Events exist as a subcollection and show up in the feed as event cards, but they don't shape the space's temporal experience. A club with 3 events this week feels the same as one with no events. Events are content in the stream, not structure around the stream.

**Shape:**

- **Timeline Sidebar**: A vertical timeline in the sidebar showing past and future events. Current week is expanded, showing day-by-day. Upcoming events have RSVP counts. Past events have attendance and photo links.
- **Event Horizon**: At the top of the chat, a horizontal scroller of the next 3 events. Each is a compact card: title, date, RSVP count, location. Tap to expand or RSVP. Always visible, not buried in the feed.
- **Post-Event Moments**: After an event ends, auto-generate a "How was [Event]?" prompt in chat. Collect reactions and one-line reviews. This creates the shared memory that turns attendees into community members.
- **Event-Linked Chat**: When an event is <2 hours away, a temporary chat context appears: "Event Chat: [event name]." Messages sent here are tagged to the event. After the event, this becomes the event's memory — "what happened at the workshop."

**Wedge:** No platform treats events as structural elements of the community experience. Discord has event scheduling but it's disconnected from channels. Facebook Groups has events but they live on separate pages. Events as part of the room's architecture is new.

**Impact:** High. Events are the primary retention driver for campus orgs. If events feel native to the space (not bolted on), leaders use them more, and members engage with them more.

**Effort:** High. Timeline sidebar is a new component. Event horizon is a new layout element. Event-linked chat requires message tagging and temporary context creation.

**Tradeoffs:**
- Event-heavy spaces benefit. Spaces with no events see an empty timeline — needs graceful degradation.
- Event-linked chat fragments conversation. Must be clearly temporary and merge back into general after event ends.
- Timeline sidebar competes for space with boards sidebar on narrow screens. Needs responsive collapse.

---

### 10. The Quiet Room — Async Communication Layer

**Problem:** Real-time chat privileges people who are online at the same time. A member who checks their space at midnight misses the 3 PM conversation. "47 unread messages" is not a feature — it's a burden. The "since you left" divider helps but doesn't solve the fundamental problem: synchronous chat doesn't work for asynchronous communities.

**Shape:**

- **Digest View**: A toggle in the header — "Live" vs "Digest." Digest view collapses the chat stream into a summary: key announcements, hot threads (5+ replies), event updates, and new pins. Everything else is collapsed behind "See 23 more messages." This is for the once-a-day checker.
- **Thread-First Mode**: Push conversations into threads instead of the main feed. Main feed shows thread titles and reply counts, like a forum. Tap to enter the thread. This reduces noise and makes the main feed scannable.
- **Catch-Up Summary**: When opening a space with 20+ unread messages, show a 3-line AI summary before the full feed: "Discussion about competition prep. 4 new members joined. Social event moved to Friday." Then the user decides whether to scroll or skip.
- **Smart Muting**: Instead of binary mute/unmute, let members set interest keywords. "Notify me when someone mentions 'competition' or 'deadline' but not everything." Reduces notification fatigue without full silence.

**Wedge:** Discord and Slack are built for always-on teams. GroupMe has no async features at all. College students are not always-on — they're in class, at work, sleeping. A community tool that respects async is structurally different.

**Impact:** High. This is the single biggest lever for retention. The #1 reason people leave group chats is notification overwhelm. A space that respects async attention gets checked daily instead of muted permanently.

**Effort:** High. Digest view requires aggregation logic. Thread-first mode is a new layout. Catch-up summary requires either heuristic extraction or LLM summarization. Smart muting requires keyword matching on notification delivery.

**Tradeoffs:**
- AI summary accuracy. Bad summaries are worse than no summary. Start with heuristic (event mentions, pin changes, reply count) before LLM.
- Thread-first mode changes the social dynamic. Some spaces thrive on stream-of-consciousness chat. This should be a mode, not the default.
- Smart muting complexity. Start with simple keyword matching, not NLP.

---

### 11. Space Rituals — Automated Community Rhythms

**Problem:** Active communities have rituals — weekly meetings, Monday check-ins, Friday shoutouts. But these rituals depend entirely on one leader remembering to post. When the leader is busy, the ritual breaks, and with it the community's rhythm.

**Shape:**

- **Recurring Posts**: Leaders schedule recurring messages. "Every Monday at 9 AM: What's your focus this week?" "Every Friday at 5 PM: Weekend plans?" The system posts them automatically with the leader's identity (not a bot).
- **Weekly Digest Post**: Auto-generated summary posted Sunday night: "This week in [Space]: 145 messages, 3 events, 7 new members. Top thread: [title]." Creates a rhythm even when the leader doesn't.
- **Celebration Automations**: When a member hits 100 messages, when the space hits a milestone, when an event fills to capacity — auto-post a celebration. Small dopamine hits that reinforce participation.
- **Seasonal Templates**: Pre-built ritual packs for common campus cycles. "Rush Week" for Greek life (daily schedule, ice breaker rotation). "Finals Season" for academic clubs (study room scheduling, stress check-ins). "Competition Prep" for competitive orgs (deadline trackers, task assignments).

**Wedge:** Discord has bots that do this (MEE6, Carl-bot) but they require configuration and feel robotic. HIVE rituals are native, branded as the space's voice, and contextual to campus life. No bot to install, no commands to learn.

**Impact:** Medium-high. Rituals create the cadence that turns a group chat into a community. Automated rituals mean the cadence doesn't break when leaders are overwhelmed.

**Effort:** Medium. Recurring posts use Cloud Scheduler (same infrastructure as automation execution engine, which is a P0 gap). Digests require a weekly aggregation function. Celebration triggers use existing event hooks.

**Tradeoffs:**
- Auto-posts can feel spammy if the space is quiet. Don't post a "weekly digest" to a space with 3 messages that week. Minimum activity threshold.
- Leader identity on auto-posts could be confusing. "Did I post this?" Clear "Scheduled by [leader]" label.
- Seasonal templates require campus calendar awareness. Start with manual triggers, add auto-detection later.

---

### 12. Quick Actions Bar — The Space Command Line

**Problem:** Leaders currently manage their space through a 1,950-line settings panel. Creating an event, pinning a message, making an announcement — each requires navigating into a settings submenu. The distance between "I want to do something" and "it's done" is too far.

**Shape:**

- **Command Bar**: `Cmd+K` (or tap the `+` button on mobile) opens a command palette within the space context. Type to filter:
  - "Create event" — opens event creation inline
  - "Pin message" — shows recent messages to pin
  - "Announce" — opens announcement composer
  - "Invite" — generates invite link
  - "Mute for 1 hour" — quick mute
  - "Switch to event mode" — changes space mode
- **Quick Actions Strip**: A horizontal strip below the header (leader-only) showing the 3-4 most common actions as icon buttons. Customizable per space. Reduces common actions to one tap.
- **Message Actions**: Long-press/right-click a message shows contextual actions: reply, react, pin, report, delete (if admin), create thread, copy link. Currently exists partially — extend with pin and thread creation.

**Wedge:** Discord has slash commands but they're text-based and require memorization. Slack has shortcuts but they're buried. A visual command bar that surfaces the right actions at the right time is the Notion/Linear pattern applied to community management.

**Impact:** Medium. Primarily benefits leaders, but leader efficiency directly affects space quality. A leader who can create an event in 5 seconds does it 3x more often than one who takes 30 seconds.

**Effort:** Low-medium. Command palette component already exists in the design system (`CommandPalette.tsx`). Space-context actions need to be wired to it.

**Tradeoffs:**
- Discoverability: new leaders won't know `Cmd+K` exists. Needs onboarding tooltip on first space visit.
- Mobile experience needs a different trigger than keyboard shortcut. The `+` button or a swipe gesture.
- Action list can get long. Prioritize by frequency and role. Members see fewer options than admins.

---

### 13. Member Tags & Roles — Identity Within the Space

**Problem:** Members are flat. Everyone is "member" unless they're "admin" or "moderator." But real clubs have roles: treasurer, VP of events, social chair, project lead. These roles create accountability and identity within the community. Currently, the only way to signal role is through a display name change.

**Shape:**

- **Custom Tags**: Leaders create custom tags and assign them to members. "Project Lead: Autonomous Vehicle," "Events Chair," "Competition Team." Tags show as colored badges next to names in chat and member list.
- **Tag Colors**: Each tag gets a color from the accent palette. Visual differentiation in the chat feed — you can see at a glance who's leadership, who's on a project team, who's a new member.
- **Self-Select Tags**: Leaders can create tags that members assign to themselves. "Interested in: Hardware / Software / Design." This creates natural subgroups without leader overhead.
- **Tag-Based Permissions**: Tags can carry permissions. "Events Chair" can create events. "Project Lead" can create boards. More granular than the 4-tier role hierarchy (owner > admin > moderator > member).

**Wedge:** Discord has roles with colors but they're server-wide and require admin configuration for each. GroupMe has no roles. HIVE tags are contextual to the space and can be self-selected, which is more natural for student orgs where structure is fluid and roles change every semester.

**Impact:** Medium. Creates richer identity within spaces, which drives belonging. Practical utility for orgs with real structure (Greek life chapters, student government, engineering teams).

**Effort:** Medium. New `tags` subcollection on spaces, `tags` array on member documents. Tag display needs to be added to chat messages and member list. Permission extension requires updating the role check middleware.

**Tradeoffs:**
- Tag proliferation: 30 tags and none mean anything. Suggest limits (10 active tags per space).
- Self-select tags need moderation. Leader approves the tag options, members choose from the approved list.
- Tag-based permissions add complexity to the already-working role system. Keep permissions optional — tags default to cosmetic.

---

### 14. Space Reactions & Vibe Check — Ambient Sentiment

**Problem:** The only way to gauge community sentiment is reading every message. Leaders don't know if morale is high or low, if members are excited or anxious about the next event, if the recent policy change landed well. There's no ambient sentiment layer.

**Shape:**

- **Vibe Check**: A periodic (weekly) one-tap prompt: "How's the vibe? [fire emoji] [thumbs up emoji] [neutral emoji] [thumbs down emoji]." Anonymous. Results visible to leaders in analytics. Creates a longitudinal sentiment graph.
- **Event Sentiment**: After every event, a lightweight feedback: "How was [Event]? [star ratings 1-5]." One tap. Results visible on the event card. Helps leaders iterate on programming.
- **Space Reactions**: A persistent reaction bar at the top of the space (think Twitch chat emotes but slower). When multiple people react with the same emoji in a short window, it aggregates: "[fire emoji] x 12 in the last hour." Shows collective energy without reading messages.
- **Anonymous Feedback Box**: A board type where members can submit anonymous feedback to leaders. "What should we do differently?" "What event do you want?" Structured, not free-form — pick from categories or answer a specific prompt.

**Wedge:** No campus platform has a sentiment layer. Discord polls exist but require setup. Instagram polls are ephemeral. A native, low-friction sentiment system that gives leaders data is uniquely valuable for student org leadership transitions and university reporting.

**Impact:** Medium. Indirect north star impact — better leader decisions lead to better spaces lead to retention. Direct value for university partnership pitch ("we can show you which orgs are thriving").

**Effort:** Low-medium. Vibe check is a system message with emoji reactions (existing infrastructure). Event sentiment is a new field on event documents. Aggregated reactions require a short-window counter.

**Tradeoffs:**
- Anonymous feedback can enable toxicity. Moderation on anonymous submissions is mandatory. Rate limit to 1 submission per member per week.
- Vibe check fatigue. Once a week max. Skip if the space was inactive that week.
- Aggregated reactions could be gamed (spam emoji to inflate). Rate limit reactions per user per hour.

---

### 15. Space Connections — The Network Between Rooms

**Problem:** Spaces are islands. A member of both "UB Robotics" and "UB Engineering Council" sees no connection between them. Events that would benefit both audiences live in one space. Members who would click in both contexts never meet.

**Shape:**

- **Related Spaces**: Surface "Members also in" on the space info panel. If 40% of Robotics members are also in Engineering Council, show that connection. This creates organic cross-pollination.
- **Cross-Post**: Leaders share an event or announcement to another space they admin. The post appears as "[shared from UB Robotics]" in the destination space. Requires admin permission in both spaces.
- **Alliance Badge**: Two spaces can formally ally. Both spaces show the alliance badge. Members of one see a "join our ally" prompt in the other's threshold. Good for umbrella orgs (College of Engineering → all engineering clubs).
- **Shared Events**: Co-hosted events (already spec'd in SPACES.md as P3). Two spaces host one event. RSVP tracked per source space.

**Wedge:** Facebook Groups has "Related Groups" but it's algorithmic and often irrelevant. Discord has no cross-server features. The campus context makes relatedness meaningful — "Members also in" based on actual campus affiliation data is a signal no general-purpose platform can replicate.

**Impact:** Medium. Cross-space connections amplify network effects. One active space can seed members into adjacent spaces. This is the "more than one space" retention lever.

**Effort:** Medium-high. "Members also in" requires a query across membership subcollections (computationally expensive — precompute nightly). Cross-post requires a reference document system. Alliance needs a new relationship model.

**Tradeoffs:**
- Privacy: "Members also in" reveals membership data. Only show for public spaces, and only if >5 shared members (prevents de-anonymization).
- Cross-post spam. Require destination space admin approval. Rate limit to 3 cross-posts per week per source.
- Alliance feature could create political dynamics (who allies with whom). Keep it lightweight — cosmetic badge, not structural dependency.

---

## Quick Wins (ship in days)

**1. Space Emoji** — Add an `emoji` string field to the space document. Display next to the space name in header, sidebar nav, and notifications. One database field, one UI addition per surface. Leaders set it in existing settings panel.

**2. Vibe Tag** — Add a `vibeTag` string field. Display under the space name in the header. "Workshop" / "Social" / "Academic" / custom. 30-character max.

**3. Fix Chat Avatars** — The `AvatarImage` is never rendered in `chat-messages.tsx` (line 207-209). Fix to show actual user avatars. This is a bug, not a feature, but it dramatically changes how the chat feels.

**4. Ice Breaker on Join** — When a new member joins, post a system message: "[Name] just joined! They're a [year] in [major] interested in [interests]." Uses existing onboarding data. No new infrastructure — system message posted on join.

**5. Active Members Strip** — Replace the "12 online" number in the header with 3-5 avatar chips of the most recently active members. Uses existing presence data. Pure frontend change.

**6. Pin Expiration** — Add optional `expiresAt` field to existing pinned messages. UI: date picker in pin dialog. Cleanup: nightly Cloud Function.

---

## Medium Bets (ship in weeks)

**1. Accent Colors** — 12-16 curated palette options per space. CSS variable swap in the space layout. Affects header tint, link color, active board indicator. Requires: one field on space document, theme provider per space, palette design.

**2. Board-Level Chat** — Add `boardId` to message documents. Update message queries to filter by board. Add per-board unread tracking. Update sidebar to show board unread counts. This is the single most impactful structural change.

**3. Space-Specific Presence** — New subcollection `spaces/{id}/presence/{userId}`. Heartbeat on page mount, cleanup on unmount. Replace campus-wide online count with space-scoped count. Already identified as P1.

**4. Event Horizon Strip** — Horizontal scroller of next 3 events at the top of the chat area. Compact cards: title, date, RSVP count. Tap to RSVP or expand. Uses existing event data.

**5. Conversation Starters** — Template library of prompts. System posts one when space is quiet for 12+ hours. Leader can customize or disable. Contextual to space type (auto-detected from categories).

**6. Quick Actions Bar** — Wire existing `CommandPalette.tsx` to space context. Leader actions: create event, pin, announce, invite. Member actions: RSVP, react, report. `Cmd+K` trigger.

**7. Custom Tags** — New `tags` subcollection on spaces. Leader creates tags, assigns to members. Tag badge renders in chat messages and member list. Self-select tags as a follow-up.

---

## Moonshots (ship in months+)

**1. Space Modes** — Adaptive layouts (Hangout, Event, Work, Broadcast) with auto-detection and leader override. Requires multiple layout variants, mode state management, and the judgment to know when auto-switching helps vs. annoys.

**2. AI Catch-Up Summary** — LLM-powered summary when opening a space with 20+ unread messages. "Here's what happened." Requires LLM integration, prompt engineering for accuracy, and fallback for when summaries are wrong.

**3. Thread-First Mode** — Forum-style layout where the main feed shows thread titles + reply counts. Tap to enter. Fundamentally changes the communication model of a space. Needs A/B testing to validate whether students prefer this to stream.

**4. Space Templates Marketplace** — Leaders save successful space configurations as templates. Other leaders browse and use. Ratings, usage counts, featured templates. Needs a templates collection, gallery UI, and copy-on-use logic.

**5. Smart Muting with Keywords** — Members set interest keywords. Notifications only fire when keywords match. Requires keyword matching in the notification delivery pipeline, which itself needs to be built (notification delivery is currently stubbed).

**6. Cross-Space Activity Feed** — Unified feed of all joined spaces on the home page. Aggregated, sorted, filterable. Requires fan-out or aggregation architecture — either expensive on write or on read.

---

## Competitive Analysis

### Discord Servers

**Strengths:** Channel system (text, voice, stage, forum), rich bot ecosystem, granular roles and permissions, custom emoji, server boosting for perks, thread support, voice chat.

**Weaknesses:** Not campus-aware (no .edu, no CampusLabs, no campus isolation). Generic — the same tool for gaming and student orgs. Setup is complex (channel creation, role configuration, bot setup requires technical knowledge). No event system (built-in events are minimal and rarely used). No mobile-first design for the use case. Overwhelming for casual users — 30-channel servers scare off new members.

**Where HIVE wins:** Pre-seeded communities (no cold start), campus-native identity (.edu verification, year/major), HiveLab tools that don't require bot configuration, event system integrated into the space. HIVE wins on "works on day one without setup."

**Where Discord wins:** Voice chat (HIVE has none), rich bot ecosystem, custom emoji, forum channels, mature thread system, desktop app stability.

**Structural gap Discord can't close:** Discord can't add campus isolation without fundamentally changing their identity model. They can't pre-seed 400 orgs from CampusLabs. They can't make .edu verification feel native because they serve gamers, developers, and every other community type.

### Slack Workspaces

**Strengths:** Channel-based messaging, thread-first culture, integrations marketplace (2000+ apps), search, workflow builder, huddles (voice).

**Weaknesses:** Designed for work, not community. Pricing model is per-seat (student orgs can't afford it). Free tier is neutered (90-day message history limit). No events, no discovery, no social features. Feels corporate — students don't want their club to feel like their internship.

**Where HIVE wins:** Free, social-first, event-native, community discovery, HiveLab tools, campus-aware identity.

**Where Slack wins:** Search (Slack's search is industry-best), workflow automation maturity, thread culture, enterprise integrations.

**Structural gap Slack can't close:** Their pricing model ($7.25/user/month) makes them untenable for student orgs. Their free tier's 90-day message history limit destroys institutional memory. They'd have to build an entirely separate product for campus communities.

### GroupMe (Microsoft)

**Strengths:** Simple, ubiquitous on campuses, low friction (phone number join), image/GIF sharing, polls, basic events, calendar sync.

**Weaknesses:** No organization. One chat stream per group, no channels, no threads. No moderation tools. No customization. No discovery — you need an invite link. No presence. No identity beyond name and photo. Stale UI that hasn't meaningfully changed in years. No desktop experience.

**Where HIVE wins:** Every single feature beyond basic chat. Boards, events, tools, discovery, moderation, presence, customization, analytics.

**Where GroupMe wins:** Ubiquity and simplicity. Every freshman already has it. The switching cost is social, not technical — convincing 50 members to install a new app.

**Structural gap GroupMe can't close:** GroupMe is architecturally a group text message platform. Adding channels, boards, moderation, tools, and events would make it a different product. Microsoft has no strategic incentive to invest in student community tooling.

### Facebook Groups

**Strengths:** Massive reach, event system (the best on any platform), photo albums, files section, polls, Q&A, badges, moderation tools, discovery (search, suggestions).

**Weaknesses:** Students increasingly don't use Facebook. The platform carries "parent's social network" stigma. Groups are buried in the Facebook app — there's no standalone community experience. No real-time chat (Messenger is separate). Algorithm-driven feed that buries content. Heavy ad load. Privacy concerns.

**Where HIVE wins:** Student generation fit, real-time chat native to the space, HiveLab tools, campus-native identity, no ads, no algorithm manipulation.

**Where Facebook Groups wins:** Events (deeply integrated with RSVPs, reminders, photos, discussion — the best implementation anywhere), discovery and reach (2B+ users), file sharing, mature moderation.

**Structural gap Facebook can't close:** They can't escape their brand perception with 18-22 year olds. They can't make Facebook feel like a campus-native tool. They can't remove ads without destroying their business model. They can't offer real-time chat in Groups without cannibalizing Messenger.

---

## Wedge Opportunities

### Wedge 1: "The Event That Sells Itself"

**Target moment:** A club leader creates an event. Currently they also post on Instagram, share in GroupMe, email the listserv, and put up flyers. Five channels for one event.

**HIVE wedge:** Create the event in HIVE. It appears in the space, on the campus calendar, in the explore feed, and in related spaces' "upcoming nearby" section. The event page has a public share link that works as a threshold — non-members see the event and can RSVP, which counts as "interested" and auto-prompts them to join the space. One creation, five surfaces. The event distributes itself.

**Why this is the wedge:** It solves the most urgent and repetitive pain (event promotion) with immediate relief (create once, reach everywhere). The leader has authority to adopt (they own the club's communication). The pain is acute (every event, every week).

### Wedge 2: "The Room That's Never Empty"

**Target moment:** A student opens their club's GroupMe and sees 47 unread messages from a conversation they missed at 2 AM. They don't read them. They mute the group. They're effectively gone.

**HIVE wedge:** Open the space. See a 3-line summary of what happened. See the next event (in 2 days). See that 3 friends are online right now. See that a thread about the topic you care about has 12 replies. The room tells you what matters without requiring you to scroll. You engage with one thing — a reaction, an RSVP, a thread reply — and leave. 15 seconds, not 15 minutes.

**Why this is the wedge:** The pain is chronic (every group chat, every day). The relief is immediate (glance and know). The behavior change is minimal (open the same app, see better information).

### Wedge 3: "The Leader's Dashboard"

**Target moment:** It's the end of semester. The club president needs to report to student government about engagement. They have no data. They count Instagram followers and guess.

**HIVE wedge:** Open space analytics. See member growth (up 40%), message activity (200/week avg), event attendance (85% RSVP-to-attendance rate), new member retention (60% still active after 30 days). Export a one-page summary. Bring it to the budget meeting.

**Why this is the wedge:** Club leaders need this data for real institutional processes (funding requests, awards, recruitment). No existing platform provides it. The authority to adopt is clear (the leader controls their own tools). The urgency is seasonal (budget season, end of semester) but the data only exists if they've been using HIVE all along — which creates adoption incentive now.

---

## Open Questions

1. **How opinionated should modes be?** Should HIVE auto-switch to Event Mode when an event is near, or should leaders always control the mode? Auto-switching risks disorientation but reduces leader burden.

2. **What's the right default for new spaces?** Should a newly claimed space start as one channel (GroupMe simple) or three boards (General, Announcements, Resources — Discord structured)? More structure helps organization but intimidates leaders who just want a group chat.

3. **How do we handle voice?** Discord's biggest advantage is voice channels. HIVE has no voice capability. Is voice a must-have for launch, a fast-follow, or never? Student study groups and hangouts use Discord voice heavily.

4. **Should boards be visible to non-members?** Currently the threshold shows limited info. If a space has a public "Resources" board, should non-members see it? It could drive joins, but it also gives away value before commitment.

5. **How much AI is too much?** Catch-up summaries, auto-generated prompts, sentiment analysis — each adds value but also adds a layer of abstraction between members. Does the space start feeling like "AI runs our club" instead of "we run our club"?

6. **What's the right density?** A living header + event horizon + boards sidebar + chat feed + quick actions bar = a lot of UI. How do we keep information density high without overwhelming? Mobile is the constraint — most students will be on phones.

7. **Thread culture vs. stream culture?** Should HIVE push toward threads (Slack model — organized, slower, async-friendly) or stay with stream (GroupMe model — fast, casual, ephemeral)? The answer probably varies by space type, but the default matters.

8. **What happens when the leader graduates?** Every spring, club leadership turns over. Automations, tags, settings, pins — all configured by someone who's gone. How does HIVE handle institutional handoff? Is there a "transfer space" flow that's more than changing the owner ID?

9. **How do we measure "alive"?** The north star is Weekly Active Spaces (10+ messages/week). But is a space with 10 messages from 2 people "alive"? Should the metric weight unique participants, not just message count? "5+ unique members posting per week" might be a truer signal.

10. **What's the role of the space in the HIVE ecosystem vs. the home feed?** If we build a great unified feed on the home page, do people stop visiting individual spaces? The space needs to offer something the feed can't — presence, context, community identity. Otherwise it becomes the backend that feeds the frontend.
