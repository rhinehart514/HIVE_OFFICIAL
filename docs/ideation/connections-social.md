# Connections & Social

> The people layer. Who you know, mutual context, lightweight social signals — without becoming a social network.

**Decision filter:** Does this help a student find their people, join something real, and come back tomorrow?

**Anti-pattern:** Anything that creates a popularity contest, follower count anxiety, or parasocial dynamics. HIVE is a belonging platform. Identity is defined by what you're part of, not who follows you.

---

## Current State

### What Exists

**Connections infrastructure is built but gated behind a feature flag (`connectionsEnabled`).**

| Layer | Status | Files |
|-------|--------|-------|
| **Connections API** | Built | `/api/connections` — GET with type filter, pagination, profile enrichment |
| **Friends API** | Built | `/api/friends` — Full CRUD: send request, accept/reject, unfriend |
| **Suggestions API** | Built | `/api/users/suggestions` — Scored candidates from shared spaces, major, mutual connections, campus |
| **Connections Hook** | Built | `use-connections.ts` — State management, friend actions, connection strength |
| **Connections Page** | Built | `/me/connections` — Tabs (all/friends/following/followers/requests), search, stats, PeopleYouMayKnow |
| **ConnectButton** | Built | 4-state machine: none / pending_outgoing / pending_incoming / friends |
| **PeopleYouMayKnow** | Built | Horizontal scroll cards with connect, dismiss, view profile |
| **ProfileConnectionsCard** | Built | Avatar stack of mutual connections, total count |
| **ProfileSharedBanner** | Built | "You're both in Design Club and 2 others" |
| **Presence System** | Built | Firebase real-time: online/away/offline, heartbeat, TTL |
| **Members List** | Built | Space members with search, role badges, online indicators, activity timestamps |

**Data Model:**
- `connections` collection in Firestore with ordered ID (`conn_{id1}_{id2}`)
- Types: `friend`, `following`, `follower`, `pending`, `blocked`
- Tracks: `mutualSpaces`, `interactionCount`, `requestedBy`, `acceptedBy`
- User doc has `connectionCount` counter

**Suggestion Algorithm:**
- Shared spaces: +10 per space (highest signal)
- Mutual connections (friends-of-friends): +8 per mutual
- Same major: +5
- Same campus: +2 (baseline)
- Minimum threshold: score >= 2
- Ghost mode users excluded

### What Works Well

1. **Belonging-first profile** — Profile shows shared spaces before follower counts. The `ProfileSharedBanner` immediately answers "what do we have in common?"
2. **Suggestion scoring** — Multi-signal algorithm with space overlap as primary signal. This is the right priority for a belonging platform.
3. **Full friend request lifecycle** — Send, accept, reject, unfriend all wired end-to-end with Firestore transactions and count updates.
4. **Privacy integration** — Ghost mode respected in suggestions. Visibility controls exist for connections, activity, online status.

### What's Missing or Broken

1. **Feature-flagged off** — The entire connections system is gated. Students can't actually use it yet.
2. **No implicit connection signals** — The only way to "connect" is explicit friend requests. No passive signals like "you were both in the same space chat today."
3. **No connection strength decay** — `interactionCount` exists but never increments. `strength` field exists in the hook but not computed.
4. **Following/follower model exists but shouldn't** — The connections page has Following/Followers tabs. This is Instagram's model, not a belonging model. On HIVE, connection should come from shared context, not one-directional following.
5. **No DMs** — There's no way to message a connection directly. Friend status unlocks nothing beyond a badge.
6. **Stale mutual spaces** — `mutualSpaces` is set at connection creation but never updated. If both users join a new space later, the connection doesn't reflect it.
7. **Sent requests show no profile data** — The sent requests UI just says "Request sent to user" with no name or context.
8. **Connection strength is hollow** — The hook exposes `getConnectionStrength()` but it always returns 0.
9. **No notification on friend request** — When someone sends you a friend request, there's no push/in-app notification. You'd have to manually check `/me/connections`.
10. **Members list doesn't show connection status** — In a space's member list, you can't tell who you're already connected with.

---

## The Opportunity

Campus platforms have a structural advantage that no general social network can replicate: **physical proximity + shared institutional context + time-bounded membership**.

When a student connects with someone on HIVE, there's a high probability they will:
- Sit in the same lecture hall
- Walk past each other in the student union
- Attend the same campus events
- Graduate in the same year

This changes everything about how connections should work.

**Instagram/LinkedIn model:** I follow you. You might follow me back. Our connection is parasocial by default.

**Discord model:** We're in the same server. We might interact in chat. There's no explicit "friendship" — just co-presence.

**HIVE's opportunity:** Connection is *earned through shared context*. You don't follow someone — you *belong to the same things*. The platform knows you share 3 spaces, the same major, and you both RSVP'd to the same event. The question isn't "do you want to connect?" It's "you're already connected — do you want to make it visible?"

The core insight: **Mutual membership IS the social graph.** Explicit friending is the cherry on top, not the foundation.

---

## Feature Ideas

### 1. Constellation Map (Your People)

**Problem:** Students don't have a mental model of their social fabric on campus. Who do they actually overlap with? Current connections page is a flat list — no spatial sense of closeness.

**Shape:** A visual map showing the student at the center, with connected people arranged by closeness. Closeness = number of shared spaces + interaction frequency + time overlap. People you share 4 spaces with are closer than people you share 1 space with. Clusters emerge naturally: "your CS people," "your club people," "your dorm people."

**Wedge:** This is the "aha" moment. A student opens this and sees their campus life mapped out. They see someone they recognize from class who they haven't connected with yet. They see clusters they didn't realize existed. It's a mirror of belonging, not a leaderboard.

**Impact:** High retention (something to check), high connection formation (visual prompts), high differentiation (no competitor has this).

**Effort:** Large — requires computing connection strength from multiple signals, rendering a force-directed graph on mobile, and updating in near-real-time.

**Tradeoffs:**
- Beautiful but potentially overwhelming on mobile screens
- Requires enough connections to look meaningful (cold start problem)
- Force-directed layouts can feel random without careful tuning
- Performance cost of computing multi-signal strength scores

### 2. Shared Context Nudges

**Problem:** Students sit next to someone in every lecture but never connect because there's no prompt. The platform knows both users are in the CS 370 space, both RSVP'd to the study session, and both were online in the space at the same time — but does nothing with this information.

**Shape:** Lightweight, non-intrusive nudges surfaced in context:
- In a space member list: "Sarah was also active here today"
- After an event: "You and 3 others attended CS Review — say hi"
- On Home: "You and Alex share 4 spaces but haven't connected"
- On a profile: "You've been in 3 of the same space chats this week"

No "Add Friend" button slapped onto everything. Just context that says "hey, you have something in common with this person."

**Wedge:** Reduces the social anxiety of sending a cold friend request. "We share 4 spaces" is a reason. "We were both at the hackathon" is a reason. The nudge provides the pretext.

**Impact:** Medium — increases connection formation without feeling aggressive. Makes the friend request feel warm instead of cold.

**Effort:** Medium — requires tracking co-presence events (same space activity within a time window), computing overlap scores, and surfacing them in the right contexts.

**Tradeoffs:**
- Can feel creepy if overdone ("we noticed you and Sarah were both online at 2am")
- Need to respect ghost mode and activity visibility settings rigorously
- Computing co-presence in real-time is expensive; batch processing introduces lag

### 3. "People in This Space" Enhancement

**Problem:** The space member list is a flat directory. You can search by name and see roles, but there's no social signal. You can't tell who you already know, who shares your other spaces, or who's the most active.

**Shape:** Upgrade the members list with connection-aware layers:
- **Your People First** — Members you're connected with sorted to the top
- **Mutual Spaces Badge** — "Also in Design Club, UB Hacking" next to names
- **Connection Status Indicator** — Small icon showing friend / pending / none
- **"Friends Here" Counter** — "3 of your friends are members" at the top of the list
- **Activity Tier** — Subtle indicator: active today / this week / this month / dormant

**Wedge:** When a student opens a space and immediately sees "3 friends here," they feel belonging before they even read a message.

**Impact:** High — transforms a utilitarian directory into a social proof surface. Directly answers "do I know anyone here?"

**Effort:** Small to Medium — data already exists in connections and spaceMembers collections. Mostly frontend work to sort, badge, and display.

**Tradeoffs:**
- Sorting friends to top creates a two-tier experience (friends vs strangers)
- Could discourage interaction with non-connected members
- More data to fetch per member (connection status requires cross-reference)

### 4. Passive Connection Strength Score

**Problem:** `interactionCount` and `strength` exist in the data model but are never computed. All connections feel equal — your best friend and someone you added once have the same visual weight.

**Shape:** Background computation that builds connection strength from behavioral signals:
- **Co-space membership:** +2 per shared space
- **Chat co-presence:** +1 per day you're both active in the same space chat
- **Event co-attendance:** +3 per event both RSVP'd and attended
- **Direct messages:** +2 per DM exchange (when DMs exist)
- **Profile views:** +0.5 per view (capped)
- **Decay:** 10% per week of no interaction (strength fades if you stop engaging)

Strength score (0-100) drives:
- Sort order in connections list
- Closeness in constellation map
- Priority in "People You May Know"
- Notification priority (friend request from high-strength connection = higher priority)

**Wedge:** Makes the connections list feel alive. Your closest people naturally rise to the top. Connections that go cold fade to the bottom. No manual curation needed.

**Impact:** Medium — improves relevance of every surface that shows people. Foundation for better suggestions, notifications, and eventually DMs.

**Effort:** Medium — requires a scheduled job (daily or hourly) that computes strength from multiple signals. Writes back to the connection document.

**Tradeoffs:**
- Feels invisible to users unless surfaced (need a UI signal like "close friend" badge)
- Decay means connections can feel "lost" if you stop engaging
- Computing across all connections at scale (thousands of users) requires batch efficiency
- Privacy concern: users might not want the platform tracking interaction patterns this granularly

### 5. "We're Both Here" Real-Time Presence in Spaces

**Problem:** Presence shows who's online globally, but doesn't tell you if your friends are currently active in the same space you're browsing. You might be in the CS 370 space at the same time as your friend but never know.

**Shape:** When you're viewing a space, show a small "Friends active now" indicator:
- "Alex and 2 friends are here now" at the top of the space
- Friend avatars pulse subtly with online status
- Tapping shows the friend's last message or activity in that space
- If no friends are online: "Sarah was here 20 min ago"

**Wedge:** Creates serendipitous co-presence. "Oh, Alex is in this space right now — let me say something." This is the digital equivalent of seeing a friend across the library.

**Impact:** High — drives real-time engagement and makes spaces feel alive. Strongest retention signal.

**Effort:** Small — presence data already exists via Firebase listeners. Need to cross-reference online users with friend list and surface in space UI.

**Tradeoffs:**
- Can feel surveillance-y ("why does HIVE know I'm here right now?")
- Must respect "show online status" privacy toggle
- Adds another real-time listener per space view (performance)
- Could create pressure to engage ("Sarah sees I'm here, I should say something")

### 6. Connection Reason Memory

**Problem:** Three months from now, you look at your connections list and see "Alex Johnson." You can't remember how you know them. Current connections have no memory of how or why you connected.

**Shape:** Automatically tag connections with their origin story:
- "Connected through CS 370" (shared space)
- "Met at UB Hackathon" (co-attended event)
- "Mutual friend: Jordan" (friends-of-friends suggestion)
- "Both in your major: Computer Science" (major match)
- "They sent you a request" / "You sent them a request"

Show this as a subtle line on the connection card: `Connected 3 months ago through CS 370`

**Wedge:** Solves a real-world problem — "how do I know this person?" — that every student has when managing acquaintances across dorms, clubs, classes, and events.

**Impact:** Medium — reduces connection list confusion, adds warmth, and contextualizes relationships. Also useful data for the constellation map.

**Effort:** Small — capture the `source` field more precisely at connection time. Already partially stored (`source: 'friend_request'`), just needs enrichment.

**Tradeoffs:**
- Requires tracking the specific trigger (which suggestion card, which space, which event) — more attribution work
- Origin story becomes stale as the relationship deepens ("connected through CS 370" matters less after you share 8 spaces)
- Edge case: what if the connecting space or event is deleted?

### 7. Introvert Mode (Belong Without Being Visible)

**Problem:** Some students want to be part of communities but don't want social pressure. They join spaces to read, not to perform. Current ghost mode hides you entirely, but there's no middle ground between "fully visible" and "invisible."

**Shape:** A spectrum of social visibility:
- **Full Presence** (default): Online status visible, appear in member lists, show in suggestions
- **Quiet Mode**: Appear in member lists but never show online status. Never appear in "People You May Know." Never surface in real-time nudges.
- **Observe Mode**: Don't appear in member lists at all. Can read everything, post when ready. Spaces show your membership only if you've posted.
- **Ghost Mode** (existing): Complete invisibility.

Each mode has a clear one-line description. Toggling is instant. No judgment copy ("ghost mode" sounds antisocial; "quiet mode" sounds healthy).

**Wedge:** Directly addresses the introvert problem. "I can belong here without performing." This is especially important for:
- First-gen students who feel out of place
- International students still finding their footing
- Students with social anxiety
- Anyone who just wants to lurk before engaging

**Impact:** Medium — doesn't increase connections directly, but increases retention among students who might otherwise leave because the platform feels too "loud." Increases the total addressable population.

**Effort:** Medium — requires extending the privacy model from binary (ghost/not ghost) to a spectrum. Each surface (member list, suggestions, presence, search) needs to check the mode.

**Tradeoffs:**
- More modes = more complexity in every query that touches visibility
- "Observe Mode" in member lists creates inconsistency (you're a member but invisible)
- Students might default to quiet mode and never form connections (need good defaults)
- Naming matters enormously — "introvert mode" could feel clinical; "quiet mode" is better

### 8. "Same Class" Auto-Connections

**Problem:** The strongest student bonds form in classes, but HIVE has no course integration. Two students in the same CS 370 section see each other three times a week but have no digital bridge unless they both happen to join the same HIVE space.

**Shape:** Integration with the university course catalog (or manual class declaration):
- During or after onboarding: "What classes are you taking this semester?"
- Auto-create or auto-suggest spaces for each class section
- Students in the same class automatically appear in each other's "People You May Know" with "Both in CS 370" as the reason
- Optional: "Study Group" one-tap space creation for a class subset

**Wedge:** "I need a study partner for CS 370" is an acute, time-sensitive pain. HIVE is the only place that knows who else is in your section. This is the killer wedge for connection formation.

**Impact:** Very high — class-based connections are the strongest driver of campus social graphs. This is how students actually make friends (shared suffering, shared schedule, shared assignments).

**Effort:** Large — requires course data integration (UB's SIS/HUB API or manual entry), semester-based data model, and a compelling class-selection UX.

**Tradeoffs:**
- University API access is notoriously difficult to get (politics, security concerns)
- Manual class entry is friction-heavy (students won't type 5 course codes)
- Class data is semester-scoped (needs refresh every term)
- Creates a massive cold-start dependency (doesn't work unless critical mass of students enter their schedule)
- Competitor risk: if the university builds their own class social tool, this advantage evaporates

### 9. IRL Bridge: QR Connect

**Problem:** Students meet people at events, club fairs, dorm move-in — but the conversion from "nice meeting you" to "connected on HIVE" requires both people to search for each other later. Most never do.

**Shape:** Each student gets a personal QR code on their profile:
- Tapping "Connect" in person opens a QR scanner
- Scanning someone's code sends an instant friend request
- Both get a notification: "Connected at UB Activities Fair" (if location context is available)
- Post-event nudge: "You scanned 4 QR codes at the Activities Fair — view your new connections"

**Wedge:** Club Fair day. Every org is handing out flyers. HIVE says: "Skip the flyer, scan the code." One scan = connected + joined the space. Friction is near zero for IRL moments.

**Impact:** High for events, low for daily use. Extremely high conversion at specific moments (orientations, club fairs, networking events).

**Effort:** Small — QR generation is trivial (encode profile URL), scanner is a standard camera integration. The hard part is making the flow feel magical, not utilitarian.

**Tradeoffs:**
- Only useful in person (adds no value for remote/commuter students)
- QR scanning has "remember the QR code fad of 2020?" energy — needs to feel fresh
- Requires both students to have the app open (not a given at a club fair)
- Adds a camera permission prompt on first use (friction)

### 10. Ambient Social Signals (Without Follower Counts)

**Problem:** Profiles need to communicate social context without creating a popularity hierarchy. "500 followers" is Instagram. "12 connections" is LinkedIn. What's HIVE?

**Shape:** Replace connection counts with belonging signals:
- **Instead of "142 followers"**: "Active in 8 spaces"
- **Instead of "500 connections"**: "3 spaces in common with you"
- **Instead of follower/following ratio**: "Member since September 2025" (tenure signal)
- **Warmth signals**: "Usually active in evenings" (temporal affinity), "Organizes events" (contribution role)

On your own profile, show:
- "Your campus reach: You share spaces with 247 students" (not followers, but overlap)
- "Your tightest crew: 8 people you share 3+ spaces with"
- "New this week: 12 new people joined your spaces"

**Wedge:** A student checks their profile and sees "you share spaces with 247 students." That's not a vanity metric — it's a measure of belonging. It answers "am I part of this campus?" without "am I popular enough?"

**Impact:** High — fundamentally different positioning than every social platform. The absence of follower counts is a feature, not a bug.

**Effort:** Medium — requires computing overlap metrics (users who share at least one space with you), caching them, and displaying in profile components.

**Tradeoffs:**
- Some students WANT follower counts (social capital is a real motivator)
- "Campus reach: 247" is still a number that can create comparison anxiety
- Harder to explain to users who expect traditional social metrics
- Org leaders may want traditional metrics for "how big is my reach?" reporting

### 11. Connection-Aware Notifications

**Problem:** Notifications currently treat all senders equally. A message from your best friend in a space carries the same weight as a message from a stranger. No connection context in notification prioritization.

**Shape:** Use connection strength to adjust notification behavior:
- **From friends**: Always notify (unless quiet hours)
- **From people in 3+ shared spaces**: Notify with context ("Alex from CS 370, UB Hacking...")
- **From acquaintances (1 shared space)**: Bundle into digest
- **From strangers**: Silent unless @mentioned
- **Friend request from high-overlap person**: Priority notification with shared context

Also: "Alex just joined [space you're in]" — notify when a friend joins a space you're already in.

**Wedge:** Reduces notification fatigue while increasing signal. The friend request notification alone could drive connection formation — "Jordan wants to connect — you share CS 370, AI Club, and 2 mutual friends."

**Impact:** Medium — improves notification relevance, which improves retention. Notifications are the #1 driver of daily return.

**Effort:** Medium — requires integrating connection strength into the notification service. The notification service itself (`notification-service.ts`) needs to become connection-aware.

**Tradeoffs:**
- Risks creating an in-group/out-group dynamic in spaces (friends' messages prioritized)
- Requires connection strength to be computed first (dependency on Feature 4)
- Notification prioritization logic gets complex fast
- Users may not understand why some notifications are louder than others

### 12. "Your People" Home Section

**Problem:** The Home page shows space activity and recommendations, but doesn't surface what your actual friends are doing. You have to navigate to each space to see if your connections are active.

**Shape:** A dedicated section on Home:
- **"Your People" card**: Avatar row of friends who were active today
- Tapping a friend shows their recent activity: "Posted in CS 370," "Joined UB Hacking," "RSVP'd to Study Session"
- "3 friends are online right now" with space context
- Weekly: "This week, your connections joined 4 new spaces" (social FOMO, but gentle)

**Wedge:** The Home page becomes the reason you open HIVE. Not "what's happening" abstractly, but "what are my people doing." This is the college equivalent of walking through the student union and seeing who's around.

**Impact:** High — directly increases daily opens. "Your People" section is the emotional anchor of the Home page.

**Effort:** Medium — requires aggregating friend activity across spaces. New API endpoint or extension of dashboard API.

**Tradeoffs:**
- Activity feed of friends can feel like a social media timeline (anti-pattern for HIVE)
- "3 friends are online" creates pressure to engage
- Privacy: friends might not want their activity broadcast ("Sarah is browsing Greek Life spaces")
- Cold start: empty for users with 0 friends (need graceful fallback to suggestions)

### 13. Micro-Interactions: Reactions Without Content

**Problem:** Sometimes you want to acknowledge someone without posting. You see a friend in a space chat, you agree with their point, but you don't want to type "yeah I agree." There's no low-effort social signal.

**Shape:** Lightweight interactions that communicate presence without content:
- **Wave**: One-tap "wave" to a friend — "hey, I see you." No text, no thread, no reply expected.
- **Bump**: Mutual wave becomes a "bump" — acknowledges you both noticed each other.
- **Props**: In a space chat, tap a message from a friend to give "props" — visible only to them.

None of these create public content. They're private, ephemeral, and low-pressure. Think: nodding at someone across the library.

**Wedge:** Solves the "I want to acknowledge this person but I have nothing to say" problem. This is how IRL acquaintance maintenance works — you nod, smile, maybe say "hey." Digital platforms force you to either post something or do nothing.

**Impact:** Medium — increases engagement frequency (lower barrier to interaction), strengthens connections passively.

**Effort:** Small — wave/bump is a simple state mutation on the connection document. Props is a lightweight reaction on a message. No new UI paradigm needed.

**Tradeoffs:**
- Could feel gimmicky (Facebook poke vibes)
- Naming matters: "wave" feels warm, "poke" feels invasive
- Can be spammed or misused (rate limiting needed)
- If nobody uses it, it clutters the UI for nothing

### 14. Connection-Based Space Recommendations

**Problem:** The existing recommendation algorithm uses interests and categories. But the strongest signal for "should I join this space?" is "are my people already there?"

**Shape:** Upgrade space recommendations to be connection-first:
- **Primary signal**: "3 of your friends are in this space" (highest weight)
- **Secondary**: "15 people from your major are here"
- **Tertiary**: Interest/category match (existing algorithm)
- **On space cards**: Always show friend avatars who are members
- **Sort by friend density**: Spaces with more of your friends rank higher

The explore page's "For You" section becomes "Where Your People Are."

**Wedge:** A new student with 5 friends immediately sees where those friends are. The recommendation isn't "we think you'd like AI Club" — it's "Alex, Jordan, and Sarah are in AI Club."

**Impact:** High — friend-driven recommendations have the highest join conversion rate of any signal.

**Effort:** Small — the data exists. Suggestions API already computes shared spaces. Need to pipe friend data into the browse/recommended API response and prioritize it in UI.

**Tradeoffs:**
- Creates reinforcement loops (you join where friends are, friends join where you are — echo chamber)
- New users with 0 friends get no benefit (cold start)
- Could reduce serendipity / filter bubble problem (everyone ends up in the same spaces)
- Friend data leaks space membership implicitly ("why does HIVE know Alex is in Greek Life?")

### 15. "Who Else Is Going?" Event Social Layer

**Problem:** Students RSVP to events but can't see who else from their network is going. "Who's going?" is the most-asked question before any campus event.

**Shape:** Every event card and event page shows:
- **Friend avatars**: "Alex, Sarah, and 3 other friends are going"
- **Major peers**: "12 CS students are going"
- **Space context**: "Most attendees are from UB Hacking"
- **Post-event**: "You and 8 friends attended — connect with the others?"

On the event page itself:
- Attendee list sorted by connection proximity
- "Invite a friend" button that sends a HIVE notification
- "Going with Alex" — tag who you're going with for accountability

**Wedge:** "My friend is going, so I'll go too." This is how real-world event attendance works. HIVE makes the invisible ("who's going?") visible.

**Impact:** High — directly increases event attendance, which increases real-world connection, which increases platform retention.

**Effort:** Medium — RSVP data exists. Need to cross-reference attendees with friend list. "Invite a friend" requires friend-to-notification pipeline.

**Tradeoffs:**
- Shows who's NOT going (implicit social pressure)
- Privacy: some events are sensitive (therapy group, AA meeting — attendee lists shouldn't be visible)
- "Invite a friend" can feel spammy if overused
- Event organizers might not want attendee social data visible

---

## Quick Wins (Ship in Days)

| Feature | Effort | Impact | Why Now |
|---------|--------|--------|---------|
| **Turn on the feature flag** | 1 day | High | The connections system is built and gated. Ship it. |
| **Friend notification on request** | 1 day | High | Without this, friend requests are invisible. Table stakes. |
| **Show connection status in member lists** | 1-2 days | Medium | Data exists, just needs UI badge on member cards. |
| **Enrich sent request cards with profile data** | 0.5 days | Small | Currently shows "Request sent to user" with no name. |
| **Connection reason memory** | 1-2 days | Medium | Capture specific source at connection time (which space, which suggestion). Small API change. |
| **Friend count on space cards** | 1 day | High | "3 friends here" on browse cards. Data available in browse-v2 cold start signals. |

---

## Medium Bets (Ship in Weeks)

| Feature | Effort | Impact | Why |
|---------|--------|--------|-----|
| **Shared Context Nudges** | 2 weeks | High | Reduces cold-friend-request anxiety. Context-aware prompts in spaces and profiles. |
| **Passive Connection Strength** | 1-2 weeks | Medium | Foundation for everything else. Background job computing strength from co-presence signals. |
| **"Your People" Home Section** | 1-2 weeks | High | Makes Home the emotional anchor. Friend activity aggregation. |
| **Connection-Based Space Recs** | 1 week | High | Upgrade recommendations to be friend-first. Data already exists. |
| **Introvert Mode (Quiet Mode)** | 2 weeks | Medium | Privacy spectrum between visible and ghost. Retains students who'd otherwise leave. |
| **"Who Else Is Going?" Event Layer** | 1-2 weeks | High | Friend context on events drives attendance. RSVP cross-reference. |
| **QR Connect** | 1 week | High (event-specific) | Zero-friction IRL connection. QR code on profile + scanner. |

---

## Moonshots (Ship in Months+)

| Feature | Effort | Impact | Why |
|---------|--------|--------|-----|
| **Constellation Map** | 2-3 months | Very High | Visual social graph. Differentiation play. Requires mature connection strength. |
| **Same Class Auto-Connections** | 2-3 months | Very High | Course integration is the killer wedge but requires university API access. |
| **Ambient Social Signals** | 1-2 months | High | Replace follower counts with belonging metrics. Requires rethinking the profile data model. |
| **Connection-Aware Notifications** | 1-2 months | Medium | Priority routing by connection strength. Requires notification system overhaul. |
| **DMs** | 2-3 months | High | Friends can message each other directly. Requires new messaging infrastructure, moderation, abuse prevention. |

---

## Competitive Analysis

### Instagram (Following Model)
- **Graph type:** Directional. You follow; they may follow back.
- **Social signal:** Follower count is the primary status metric.
- **Strength:** Visual identity (grid, stories, reels).
- **Weakness for campus:** Parasocial by design. Following someone doesn't mean you know them. No shared-context signals. No campus isolation.
- **What HIVE steals:** Nothing. This is the anti-pattern.
- **What HIVE avoids:** Follower counts, public likes, algorithmic feed of strangers.

### LinkedIn (Professional Connection Model)
- **Graph type:** Bidirectional. Connection requires mutual acceptance.
- **Social signal:** "500+ connections" badge. Endorsements.
- **Strength:** Professional context (company, role, education).
- **Weakness for campus:** Too formal. Students don't "connect" in LinkedIn's sense. No real-time presence, no spaces, no events.
- **What HIVE steals:** Mutual-acceptance connection model (friend requests). "People You May Know" with shared context.
- **What HIVE avoids:** Connection count as status. "Endorsements" as social currency.

### Discord (Server Co-Presence Model)
- **Graph type:** None, really. You're in servers together. Friend requests exist but are ancillary.
- **Social signal:** Server membership. Roles within servers.
- **Strength:** Real-time presence. "Who's online in this server."
- **Weakness for campus:** No identity verification. No campus isolation. No belonging metrics. Servers are anonymous.
- **What HIVE steals:** Server-as-context for connection. Real-time presence. Role system.
- **What HIVE avoids:** Anonymous culture. No institutional identity.

### Facebook (Legacy Social Graph)
- **Graph type:** Bidirectional friends, plus pages/groups.
- **Social signal:** Mutual friends, group membership.
- **Strength:** "23 mutual friends" is powerful social proof. Event RSVPs with friend context.
- **Weakness for campus:** Students don't use Facebook for campus social life. Cluttered with family, politics, ads. Groups are unfindable.
- **What HIVE steals:** Mutual friend signals. Event social layer ("3 friends are going"). Group-as-belonging.
- **What HIVE avoids:** Algorithmic feed, ad model, bloated feature set.

### GroupMe (Campus Chat Default)
- **Graph type:** Chat group membership. No explicit connections.
- **Social signal:** Who's in the group chat.
- **Strength:** Ubiquitous on campuses. Simple. Low friction.
- **Weakness for campus:** No profiles, no discovery, no events, no persistence beyond the chat. No way to see "who do I know across all my groups?"
- **What HIVE steals:** Chat-group-as-social-context. The campus ubiquity aspiration.
- **What HIVE avoids:** Feature-barren simplicity (HIVE adds identity, discovery, tools on top).

### The Structural Gap

Every competitor either:
1. Has a general social graph that doesn't understand campus context (Instagram, LinkedIn, Facebook)
2. Has server/group co-presence but no identity layer (Discord, GroupMe)

None of them have: **verified campus identity + space-based belonging + connection strength from shared institutional context + real-time presence + event integration.**

HIVE is the only platform that can say: "You and Sarah are both verified UB students, you share CS 370, AI Club, and your dorm floor space, you were both at the hackathon last week, and she's online in CS 370 right now."

---

## Wedge Opportunities

### Wedge 1: Club Fair Day
- Every org scans HIVE QR codes instead of collecting emails on paper
- Students scan to connect + join in one tap
- Post-fair: "You connected with 12 people at the Activities Fair"
- **Why it works:** Replaces a broken process (email signups that never convert) with an instant, digital one

### Wedge 2: First Week of Classes
- "Add your classes" flow during syllabus week
- Instant connection suggestions for classmates on HIVE
- "14 people in your CS 370 section are on HIVE"
- **Why it works:** Acute pain (who's in my class?), high urgency (first week), existing behavior (checking classmates)

### Wedge 3: "Who's Going?" Before Major Events
- Homecoming, major concerts, career fairs, football games
- "27 of your friends are going to Homecoming"
- Share your RSVP status — friends see you're going
- **Why it works:** Social coordination is the #1 driver of event attendance among college students

### Wedge 4: Study Group Formation
- "Find study partners in your spaces"
- Match by class + schedule availability + shared connections
- One-tap "Start Study Group" that creates a mini-space
- **Why it works:** Recurring, high-urgency need (midterms, finals). Small group formation is where deep connections form.

---

## Open Questions

1. **Should HIVE have a follower model at all?** The current codebase has `following` and `follower` types on connections. Is this the right primitive for a belonging platform? Or should all connections be mutual (friend-only)?

2. **How do we handle connection requests across campuses?** When HIVE expands beyond UB, can students connect cross-campus? Or does campus isolation apply to the social graph too?

3. **What unlocks for friends that doesn't exist for non-friends?** Right now, friendship is a label with no functional difference. Should friends get: DMs? Priority in feeds? Shared space auto-suggestions? What makes "friend" status worth earning?

4. **How much connection data should be visible to space admins?** If a space leader can see that two members are friends, is that useful for community building or a privacy violation?

5. **Is "connection strength" a number the user should see?** Or should it only power internal algorithms? Showing "Connection strength: 72" feels clinical. But showing "Close friend" vs "Acquaintance" communicates something useful.

6. **What's the right cold-start for connections?** Day 1 user has 0 friends. Do we auto-connect them with people from their major? Auto-suggest based on onboarding interests? Or let it develop organically through spaces?

7. **Should connections ever be automatically created?** When two people are in 5+ shared spaces, should the platform suggest "You're basically already connected — make it official?" Or is explicit opt-in always required?

8. **How do we prevent the popular-kid problem?** Some students will have 200 connections, others will have 2. How does the platform feel equitable for both? Does the constellation map make the 2-connection student feel bad?

9. **What happens to connections after graduation?** Do alumni connections persist? Can a graduating senior stay connected with underclassmen? Or does the social graph expire with campus membership?

10. **Should there be a cap on connections?** Dunbar's number suggests meaningful relationships cap around 150. Should HIVE enforce or suggest limits to keep connections meaningful? Or is unlimited connections fine because the strength score handles prioritization?
