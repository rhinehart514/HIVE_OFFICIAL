# Spaces: Product Strategy

**The surface that answers: "What's happening in my world?"**

Spaces are where creations live and where campus becomes responsive. They are not storefronts waiting for a leader to open shop. They are living containers of shared context — an org, a dorm, a topic, a community — where creations appear, people engage, and the space gets smarter over time.

**Spaces are not the product. Creations are the product. Spaces are where creations find their audience.**

Route: `/s/[handle]`

See `spaces.md` for the full technical implementation spec. This document covers product strategy, value framing, and design decisions.

---

## The Core Insight: Spaces Work Without Leaders

The old model: unclaimed → leader claims → leader creates → members engage. Every space blocked on one human showing up. 650 spaces = 650 bottlenecks.

The new model: **spaces are alive from day one.** HIVE generates contextually relevant creations for every space. Students discover these through the feed, engage, join. When a leader eventually claims, they inherit an active space — not a dead page.

```
OLD:  Space waits → Leader claims → Leader creates → Members engage
NEW:  HIVE creates → Feed distributes → Members engage → Leader claims (optional upgrade)
```

This is the "generative" in "generative campus infrastructure." HIVE doesn't just help humans create — HIVE itself creates.

---

## Role in the System

```
HiveLab (human creation) ──→ Spaces (distribution + engagement) ──→ Profile (impact)
                                      ↑                    ↑
                              Feed (discovery) ──→ Spaces
                                      ↑
                          HIVE AI (auto-creation) ──→ Spaces ──→ Feed
```

Spaces sit at the center. They receive creations from HiveLab (human) and from HIVE's AI (automated). They receive members from the Feed. They produce engagement that flows to Profile. They generate the content that makes the Feed alive.

**If HiveLab is the engine, Spaces are the stage. And HIVE AI is the opening act.**

---

## Five Space Types

Every space on HIVE falls into one of five types. The first four are pre-seeded from CampusLabs. The fifth is native to HIVE.

### 1. Student Org
**Source:** CampusLabs (pre-seeded, 400+ at UB)
**Examples:** UB Chess Club, Dance Marathon, Undergraduate Student Association
**Governance:** Hybrid — anyone can create, leader can moderate
**Claim model:** Any member can claim. Claim grants moderation + analytics + branding. Space works without a claim.
**Default AI creations:** Based on org name + description. "Best part of Chess Club?" poll, "Next meeting when?" RSVP.

### 2. University Organization
**Source:** CampusLabs (pre-seeded)
**Examples:** Career Services, Student Health, UB Libraries
**Governance:** Hierarchical — official entity, leader verification required
**Claim model:** Requires email or document proof. Higher verification bar.
**Default AI creations:** Contextual to the org's function. "Rate your Career Services experience" poll, upcoming workshop RSVP.

### 3. Residential
**Source:** CampusLabs (pre-seeded)
**Examples:** Ellicott Complex, Governors Complex, Greiner Hall
**Governance:** Flat — no single leader, community-driven
**Claim model:** Auto-join based on housing assignment (when available). No single leader. RA or resident can claim for moderation.
**Default AI creations:** Location-specific. "Rate your floor's bathroom" ranker, "Best study spot in the building" poll, "Noise complaint or overreacting?" hot take.

### 4. Greek Life
**Source:** CampusLabs (pre-seeded)
**Examples:** Alpha Phi, Sigma Chi, Delta Sigma Theta
**Governance:** Hierarchical — chapter leadership
**Claim model:** Requires proof of membership. One-space-only rule (can only be in one Greek org).
**Default AI creations:** Rush/recruitment focused when in season, social otherwise. "Rate rush events" bracket, "Best formal theme?" poll.

### 5. HIVE Exclusive
**Source:** User-created on HIVE (not pre-seeded)
**Examples:** "UB Bathroom Rankings", "Best Late Night Food", friend groups, project teams, study groups, clubs that don't exist on CampusLabs yet
**Governance:** Creator sets the rules — open (anyone creates) or managed (creator moderates)
**Claim model:** Creator IS the leader from day one. No claim flow needed.
**Default AI creations:** None — the creator made it, they seed it.

### Why This Matters

| Type | Activation path | Leader needed? | AI creates? |
|------|----------------|----------------|-------------|
| Student Org | AI seeds → feed distributes → members engage → leader claims (optional) | No | Yes |
| Uni Org | AI seeds → students discover → verified leader claims | No (but preferred) | Yes |
| Residential | Auto-join by housing → AI seeds → community engages | No | Yes |
| Greek Life | AI seeds → chapter claims → members join | No (but expected) | Yes |
| HIVE Exclusive | User creates space → user creates content → shares | Yes (creator) | No |

The first four types work without any human creating anything. HIVE Exclusive is the only type that requires a human to start — because it's a human's idea.

---

## AI-Generated Creations (The Cold Start Solution)

HIVE has rich metadata for 650+ spaces from CampusLabs: name, description, category, org type, even social links. This is enough context to generate relevant creations.

### How It Works

For every pre-seeded space without a leader:
1. HIVE reads the space metadata (name, description, category, org type)
2. Generates 1-3 contextually relevant creations (polls, brackets, rankers)
3. Places them in the space and publishes to the campus feed
4. Students discover them through the feed, engage, join the space

### Generation Rules

- **Contextual, not random.** "Best chess opening?" for Chess Club, not "What's your favorite color?"
- **Low-stakes, high-engagement.** Polls and brackets that anyone can answer. No insider knowledge required.
- **Refreshed over time.** If a creation gets stale (low engagement for 7+ days), HIVE generates a new one.
- **Clearly labeled.** AI-generated creations show "Created by HIVE" not a fake persona. Honest about the source.
- **Fade when humans arrive.** Once a leader claims or members start creating, AI creations move to the background. Human creations always take priority in the feed and ContextBar.

### The Graduation Path

```
HIVE creates → members engage → members create → leader claims → leader creates
     ↑                                                                    ↓
     └──────── AI steps back as human creation velocity increases ────────┘
```

The AI bootstraps the loop until humans take over. A space that started with HIVE-generated polls might end up with a leader running weekly brackets, RSVP events, and custom apps. The AI was the spark — humans are the fire.

### What AI Creates vs. What Humans Create

| AI creates | Humans create |
|-----------|--------------|
| Generic but relevant polls ("Best dining hall?") | Specific, timely polls ("What day for our fundraiser?") |
| Fun brackets ("UB buildings ranked") | Org-specific brackets ("Best performance this semester") |
| Discovery-friendly (anyone can engage) | Community-specific (you need context to care) |
| Seeded on space creation | Created on demand |
| Shows "Created by HIVE" | Shows creator's name |

AI creations get people in the door. Human creations keep them there.

---

## Spaces Operate Without Leaders

This is a fundamental shift from the current model. Here's what it means concretely:

### What Works Without a Leader

- Space is visible and discoverable in feed
- AI-generated creations are live and engaging
- Students can join the space
- Members can chat in the space
- Members can engage with creations (vote, RSVP, etc.)
- Pre-seeded CampusLabs events show up
- Anyone can create via slash commands in chat (`/poll`, `/bracket`, `/rsvp`)

### What a Leader Unlocks (The Upgrade)

- **Moderation** — remove messages, ban members, set join rules
- **Branding** — custom icon, cover image, description edits
- **Analytics** — see engagement metrics, member growth
- **Space settings** — visibility, join policy, automations
- **Verification badge** — proves this is the "real" org
- **Priority in feed** — claimed spaces rank higher than unclaimed in discovery

### The Reframe

Instead of: "This space needs a leader to function."
Now: **"This space is already working. Claim it to take the wheel."**

The claim CTA changes from "Be the first to build here" to "47 students are already engaging. Make it yours."

---

## How Students Find Spaces (Feed-Driven Membership)

Students don't browse an org directory. They encounter creations in the feed and follow the trail to spaces.

### The TikTok Model

TikTok doesn't ask you to follow creators during onboarding. It shows you content. You engage. Then you follow. The content earns the follow.

For HIVE: **the creation earns the space membership.**

### The Flow

```
1. Student opens HIVE → campus feed shows live creations
2. Sees "Best dining hall?" poll (from UB Dining space) → votes
3. Sees "47 votes · From UB Dining" → taps space name
4. Lands on space → sees more creations, chat, events → joins
5. Gets notifications for new creations → comes back
6. Eventually creates their own → the loop closes
```

### Membership Triggers (Ranked by Conversion Likelihood)

1. **Engaged with a creation from this space** — highest intent signal. They already participated.
2. **Followed a standalone link** — someone shared a creation URL, they voted, saw the space.
3. **Discovered in feed** — browsing, saw the space card, tapped in.
4. **Onboarding selection** — "Pick your orgs" during signup. Familiar orgs.
5. **Auto-join** — residential spaces based on housing assignment.
6. **Invite link** — leader or member shared a join link.

### Post-Engagement Join Prompt

After a non-member engages with a creation from a space (votes on a poll in the feed), show:

```
┌─────────────────────────────────────────┐
│  You voted in UB Dining's poll          │
│  47 others voted too                    │
│                                         │
│  [Join UB Dining]  [Not now]            │
└─────────────────────────────────────────┘
```

This is the lowest-friction join path. They already demonstrated interest by engaging.

---

## The Business Logic

### Why Spaces Must Exist (Not Just Standalone Links)

If leaders just drop HIVE links into GroupMe, HIVE is Typeform with AI. GroupMe owns the audience. HIVE has no retention. Three things change with Spaces:

1. **Audience ownership.** If 60 members are in the space, the leader doesn't need GroupMe to reach them. HIVE becomes the distribution channel.
2. **The discovery loop.** Members need to be ON HIVE to discover other creations, other spaces, and become creators themselves. Without Spaces, the member → creator conversion never happens.
3. **Retention.** The leader comes back because their people are here. Members come back because there's new stuff. Without Spaces, there's no "come back" trigger.

**Standalone links = acquisition** (top of funnel, virality, reach non-users).
**Spaces = retention** (why you stay, why you come back, why HIVE is a platform not a tool).

### What Makes a Space Worth More Than a GroupMe Group

GroupMe can only message. **A Space can do things.**

Every time a leader creates, the space gains a new capability. Poll. Bracket. RSVP. Ranker. Quiz. The space gets smarter. GroupMe never gets smarter. It's the same text box forever.

A Space is not "a better group." A Space is **"your org becomes capable."**

---

## Space States (Product Lens)

The state model shifts from leader-dependent to activity-dependent.

### Active (Has Engagement)
**Trigger:** At least one creation with engagement in the last 14 days.
**Vibe:** Things are happening. People are engaging.
**Could be leaderless:** Yes — AI creations with student engagement count.
**Key metric:** Engagement rate per creation, return rate.

### Seeded (Pre-Seeded, Waiting for Life)
**Trigger:** Space exists from CampusLabs import. Has AI-generated creations but minimal engagement.
**Vibe:** This org exists. HIVE made something for it. Be the first to engage.
**Always leaderless initially:** Yes.
**Key metric:** First engagement rate, time to first member join.

### Claimed (Leader Took the Wheel)
**Trigger:** A student claimed this space and was verified.
**Vibe:** Someone is running this. It's official.
**Changes from seeded/active:** Leader branding, verification badge, moderation active, AI creations deprioritized.
**Key metric:** Time-to-first-human-creation, claim-to-active conversion rate.

### Low Activity (Needs a Spark)
**Trigger:** No creation engagement in 14+ days.
**Vibe:** It's been quiet. A new creation can bring it back.
**What HIVE does:** Generates a new AI creation to re-seed the feed. If claimed, nudges the leader.
**Key metric:** Re-activation rate after AI re-seed or leader nudge.

### HIVE Exclusive (User-Created)
**Trigger:** Created by a user on HIVE.
**Vibe:** This is someone's idea — a topic, a project, a community.
**Always has a leader:** Yes — the creator.
**Key metric:** Creation rate, member growth from feed discovery.

---

## Creations in Spaces

### How Creations Appear

Creations enter a space through four paths:

1. **AI-generated** — HIVE creates contextual content for pre-seeded spaces. Appears in the space and the campus feed.
2. **Inline (slash commands)** — Any member types `/poll Best study spot?` in chat. Poll appears as a card in the chat feed.
3. **Placed from HiveLab** — User creates in HiveLab with `?spaceId` context. After creation, auto-places in the space.
4. **Added later** — User creates in HiveLab without space context. Later places it in a space from My Apps.

### Priority Order

When multiple creations exist, surfaces (ContextBar, feed ranking) prioritize:
1. Human creations with engagement (highest)
2. Human creations without engagement
3. AI creations with engagement
4. AI creations without engagement (lowest)

Human creations always outrank AI creations. AI creations step back as humans step up.

### Where Creations Live

| Location | How | When |
|----------|-----|------|
| **ContextBar** | Most active creation (most engagement in last 24h) | When creation has engagement |
| **Chat feed** | Inline via slash command | At creation time |
| **Apps tab** | `CreationCard` in grid | Always (permanent home) |
| **Campus feed** | Card with engagement count + space attribution | When published |
| **Standalone URL** | Full creation page at `/t/[toolId]` | Always (shareable) |
| **Push notification** | "[Creator/HIVE] added [Name] to [Space]" | On placement |

### Engagement Visibility

Every creation shows its engagement count everywhere it appears:
- Poll: "23 votes"
- RSVP: "14 attending"
- Bracket: "89 matchup votes"
- Quiz: "31 completed"
- Ranker: "56 rankings"

These counts are live (RTDB-backed). Numbers going up in real-time is the dopamine hit that drives the loop.

### The "No Apps" Problem (Solved)

With AI-generated creations, no pre-seeded space should have 0 apps. But for HIVE Exclusive spaces (user-created), the empty state still matters.

**For the creator (empty HIVE Exclusive space):**
> "Your space is live. Give people a reason to join."
> [Create a Poll] [Create an Event] [Build something →]

**For members (any space with 0 apps):**
Hide the Apps tab entirely. Members shouldn't see emptiness.

---

## The Space ↔ HiveLab Relationship

### From Space to HiveLab
**Context travels:** When any member navigates from a space to HiveLab, `?spaceId` in URL means HiveLab knows which space they came from. Context pill shows "Making for [Space Name]." After creation, auto-places in that space.

**Speed target:** Space → HiveLab → create → place → back to space in < 30 seconds for shell formats.

### From HiveLab to Space
**Visible arrival:** Creation appearing in the space should feel like an event, not a silent write. ContextBar updates, Apps tab shows new card, notification goes out.

### Inline Creation (The Shortcut)
Slash commands skip the HiveLab round-trip entirely. `/poll`, `/bracket`, `/rsvp` create in-chat instantly. **Any member can use these, not just leaders.**

As the shell system expands, so do slash commands:
- `/poll Best study spot?`
- `/rsvp Who's coming Saturday?`
- `/quiz How well do you know UB?`
- `/signup Volunteer slots`
- `/hottake Pineapple on pizza`
- `/countdown Days until Spring Fest`
- `/rank Best bathrooms in this building`

Each new shell = new inline capability for the space. The chat becomes a creation surface.

---

## The Member Experience

### What a Member Sees (Active Space)

```
┌─────────────────────────────────────────┐
│ [SpaceHeader] UB Engineering · 47 members│
│                                          │
│ ┌── ContextBar ───────────────────────┐  │
│ │ Best Project Topic — 23 votes       │  │
│ └─────────────────────────────────────┘  │
│                                          │
│ [Chat] [Events] [Apps]                   │
│                                          │
│ ┌── Chat Feed ────────────────────────┐  │
│ │ ── 3 new since you left ──         │  │
│ │                                    │  │
│ │ Maya: Don't forget to vote!        │  │
│ │                                    │  │
│ │ ┌────────────────────────────┐     │  │
│ │ │ Best Project Topic         │     │  │
│ │ │ ○ Robotics arm  (12)      │     │  │
│ │ │ ○ Solar car     (7)       │     │  │
│ │ │ ○ Bridge design (4)       │     │  │
│ │ │ [Vote]                    │     │  │
│ │ └────────────────────────────┘     │  │
│ │                                    │  │
│ │ Alex: I voted robotics arm         │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [Message input... /poll /rsvp]   [+ FAB] │
└─────────────────────────────────────────┘
```

### What a Non-Member Sees (AI-Active, No Leader)

```
┌─────────────────────────────────────────┐
│ [SpaceHeader] UB Chess Club · 12 members│
│                                          │
│ ┌── Preview ──────────────────────────┐  │
│ │                                    │  │
│ │  Best chess opening?               │  │
│ │  Created by HIVE · 34 votes       │  │
│ │  [Vote now]                        │  │
│ │                                    │  │
│ │  Next event: Chess Night, Friday   │  │
│ │  8 attending                       │  │
│ │                                    │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ 12 students already here           │  │
│ │ [Join Space]     [Claim this space]│  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

The non-member sees activity — AI-created poll with votes, upcoming event with RSVPs. The space feels alive without a leader.

### What a Non-Member Sees (Sparse / Just Seeded)

```
┌─────────────────────────────────────────┐
│ [SpaceHeader] UB Photography · 0 members│
│                                          │
│ ┌── Preview ──────────────────────────┐  │
│ │                                    │  │
│ │  Best photo spot on campus?        │  │
│ │  Created by HIVE · Be first to vote│  │
│ │  [Vote now]                        │  │
│ │                                    │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ [Join Space]     [Claim this space]│  │
│ └────────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

Even with 0 members, there's something to do. "Be first to vote" creates urgency instead of emptiness.

---

## Spaces and the Value Props

### Zero-to-Audience
A student votes on a poll in a space. 47 others voted. The creator (or HIVE) reached 47 people through this space. **The space is the audience.**

### Campus Becomes Responsive
A member opens a space, sees "Best dining hall?" with 89 votes. Their campus responded. **The space is where the campus speaks.**

### Ideas Become Real
Any member types `/poll What day should we practice?` in chat. Working poll in 2 seconds. Members voting in minutes. **The space is where ideas land and instantly work.**

### Participation Without Social Cost
A freshman joins "UB Photography Club" from the feed. They vote on a poll. They RSVP to a photo walk. They haven't introduced themselves, but they've participated. **The space is where low-stakes action happens before high-stakes commitment.**

---

## What Changes from Current Implementation

| Area | Current | New |
|------|---------|-----|
| **Activation model** | Space dead until leader claims | Space alive from day one via AI creations |
| **Who creates** | Leader only (via SparkleCreateSheet, FAB) | Anyone (slash commands open to all members) |
| **Space types** | All treated the same (category is metadata) | 5 distinct types with different governance + AI behavior |
| **Cold start** | Empty spaces, hope leaders show up | AI-generated creations seed every pre-seeded space |
| **Claim framing** | "Be the first to build here" | "47 students already engaging. Make it yours." |
| **Leader role** | Required for space to function | Optional upgrade for moderation + branding + analytics |
| **Member acquisition** | Leader recruits via GroupMe/word of mouth | Feed-driven: creation engagement → space discovery → join |
| **Empty state** | "No apps yet" | Should never happen for pre-seeded spaces |
| **Join prompt** | Browse directory → join | Engage with creation → prompted to join source space |

---

## Key Metrics

| Metric | What it measures | Target |
|--------|-----------------|--------|
| **Space activation rate** | % of pre-seeded spaces with >0 engagement (AI or human) | >80% within 2 weeks |
| **Feed-to-join rate** | % of feed creation engagements → space joins | >15% |
| **Member creation rate** | % of space members who create something (not just engage) | >10% |
| **Claim rate** | % of active spaces that get claimed by a leader | >10% in month 1 |
| **Human takeover rate** | % of spaces where human creations outnumber AI creations | >20% in month 1 |
| **Return rate** | % of members who open the space again within 7 days | >40% |
| **Creation per space per week** | Average creations (human + AI) per active space | >3 |
| **Engagement rate** | % of space members who interact with a creation | >30% |

---

## What We Are NOT Building

| Feature | Why not |
|---------|---------|
| AI personas (fake students creating) | AI creations are clearly labeled "Created by HIVE." No deception. |
| Space customization (themes, layouts) | Every space looks the same. Consistency > customization at 50 users. |
| Sub-spaces or channels | One chat, one space. Simplicity is the feature. |
| Space-to-space messaging | Cross-pollination happens through campus feed, not bridges. |
| Advanced governance (voting, proposals) | Owner/moderator/member is enough. No committee features. |
| Space monetization | Everything free. No gates. |
| Space analytics for members | Leaders get basic metrics. Members see engagement counts on creations. That's the analytic. |
| Continuous CampusLabs sync | Semester-based import. Not real-time federation. |

---

## Perspective Signals

### Overwhelmed Org Leader
**Test:** Maya finds her org already active on HIVE with AI-generated content and 12 members engaging. She claims it. Does she feel empowered or threatened?
**What works:** "47 students already here. You're now in charge." She inherits momentum. Her first creation gets instant engagement because the audience is already there.
**What breaks:** If AI creations feel better than what she can make. The transition from AI to human must feel like an upgrade, not a downgrade.

### Lonely Freshman
**Test:** They scroll the feed. See "Best dining hall?" from a space they're not in. Vote. See "Join UB Dining?" prompt. Join. Come back tomorrow. See new content.
**What works:** Zero-commitment entry. They never had to walk into a room or introduce themselves. They belong through action.
**What breaks:** If the space they join has nothing new after the AI creation they voted on. The AI must keep generating until humans take over.

### Returning Skeptic
**Test:** They opened HIVE last week. Come back. Is anything different?
**What works:** New AI creations in spaces they joined. New human creations from spaces getting active. "Since you left" dividers. The feed has fresh content.
**What breaks:** If the same AI polls are sitting there with the same vote counts. Staleness kills the skeptic. AI creations must rotate.

### Commuter Student
**Test:** They're on campus 3 days a week. Do spaces serve them on the days they're not there?
**What works:** Push notifications for new creations. Standalone links they can engage with from anywhere. Spaces aren't location-dependent.
**What breaks:** If spaces feel like "you had to be there" — chat messages they missed, events they couldn't attend. Creations (polls, brackets) are the equalizer because they're asynchronous.
