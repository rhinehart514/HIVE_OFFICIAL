# Profile: Product Strategy

**The surface that answers: "Did it matter? Should I do it again?"**

The profile is the creator's receipt. It's where a student who built a poll, a bracket, or a custom app goes to see proof that it worked. 47 people voted. 12 people RSVP'd. 3 spaces are using it. The profile converts effort into evidence and evidence into motivation.

For non-creators, the profile is campus identity — who you are, what you're in, what you care about. But the profile's strategic job is to close the creation loop: **build → reach people → see proof → build again.**

Route: `/u/[handle]` (canonical), `/me` (redirects to own)

See `profile.md` for the full technical spec. This document covers product strategy.

---

## Role in the System

```
Build (create) → Space (distribute) → Feed (reach) → Profile (proof)
                                                          ↓
                                                    "It worked. Build again."
                                                          ↓
                                                    Build (create again)
```

The profile is the loop-closer. Without it, a creator builds something, people engage, but the creator never sees the impact in one place. They'd have to check each creation individually. The profile aggregates all their impact into a single glance: **"You reached 52 people across 3 creations."**

This is what makes a one-time creator into a repeat creator.

---

## The Core Insight: Profile is for Creators, Identity is for Everyone

Two distinct jobs, one surface:

### Job 1: Creator Feedback (The Strategic Job)

The profile proves that creating on HIVE works. This is the most important job because **creator retention is the bottleneck.** If a leader creates a poll, 47 people vote, but the leader never sees "47 votes" on their profile — they don't feel the impact. They don't create again. The loop dies.

The profile must answer three questions for creators:
1. **"Did anyone use my stuff?"** → Participation count: "47 people participated in your creations"
2. **"Which creation worked best?"** → Builder Showcase: apps sorted by engagement, with contextual numbers
3. **"Is it worth making more?"** → Reach stat: total unique people across all creations

### Job 2: Campus Identity (The Universal Job)

Every student has a profile, not just creators. The profile shows:
- Who you are (name, major, year, bio)
- Where you belong (spaces you've joined)
- What you care about (interests)
- Who you know (connections)

This matters for the social layer — when you view someone's profile from a space member list or a feed creation, the shared context (same spaces, same interests) makes the campus feel smaller and more connected.

### Why Both Jobs, One Surface

Separating them (a "creator dashboard" and a "profile page") would split attention and add navigation. The profile IS the dashboard. The participation count sits right below the name. The builder showcase is zone 2. A creator doesn't need to go anywhere special to see their impact — it's part of their identity.

---

## What the Profile Shows (Four Zones)

### Zone 1: Identity Hero

```
┌─────────────────────────────────────────┐
│  [Avatar]  Maya Johnson                  │
│            @maya                          │
│            "Building things for UB eng"   │
│            CS '27 · University at Buffalo │
│                                           │
│  [Edit Profile]                           │
│                                           │
│  "52 people participated in your apps"    │
│                                           │
│  Spaces: 5 · Friends: 12 · Apps: 3       │
│  Reach: 52                                │
└─────────────────────────────────────────┘
```

**The participation count is the most important line on the profile.** It sits right below the hero, above the stats. It's the first number a creator sees when they check their profile. At 50 users, "52 people participated" means the creator reached the majority of the active user base. That's powerful.

**Reach replaces generic activity count.** Reach = total unique people who interacted with any of your creations. For non-creators (0 apps), this stat is hidden. The stats row adapts: creators see Spaces / Friends / Apps / Reach. Non-creators see Spaces / Friends / Activity.

### Zone 2: Builder Showcase

The creator's portfolio. Apps sorted by engagement, most popular first.

```
Featured:
┌─────────────────────────────────────────┐
│  "Friday Night Poll"                     │
│  Quick poll for the group                │
│  47 votes · in 2 spaces                  │
└─────────────────────────────────────────┘

Secondary:
┌──────────────────┐ ┌──────────────────┐
│ "Meeting RSVP"   │ │ "UB Quiz"        │
│ 12 RSVPs         │ │ 31 completions   │
└──────────────────┘ └──────────────────┘
```

**Per-app impact lines use contextual language.** Not "47 uses" — "47 votes." Not "12 interactions" — "12 RSVPs." The language matches the creation type. This makes the numbers feel real, not abstract.

**Only human creations appear here.** AI-generated creations in spaces are NOT on anyone's profile. The profile is proof of human effort. This distinction matters — it ensures that the "Builder" identity is earned, not algorithmically assigned.

**Empty state (own profile):** "Build your first app to unlock your portfolio" → link to `/build`. Inviting, not demanding.

**Empty state (viewing someone else with 0 apps):** Zone 2 is hidden entirely. No "this person hasn't built anything" messaging. Absence is neutral.

### Zone 3: Campus Identity

Spaces grid + interests pills.

**Spaces show role:** Owner, leader, member. When viewing someone else's profile, shared spaces are highlighted. This is the "small campus" feeling — "oh, we're both in UB Engineering."

**Interests show overlap:** When viewing another profile, a "3 shared" pill appears if you have overlapping interests. Low-effort social signal that creates connection.

### Zone 4: Momentum

Activity heatmap (GitHub-style) + connections + organizing events.

**The heatmap is aspirational at launch.** With 50 users and a few days of activity, most heatmaps will be nearly empty. This is fine — the heatmap rewards consistency over time. It's a long-term retention tool, not a launch feature. It should render gracefully with minimal data (a few green squares look like the beginning of something, not an empty chart).

**Connections card shows mutual connections** when viewing someone else's profile. At 50 users, this is powerful — "you and Alex have 3 mutual friends" in a 50-person community means you probably know each other.

---

## The Creator Conversion Path

The profile isn't just for existing creators. It's how consumers become creators.

### The "I Could Do That" Moment

A student scrolls the feed. Sees a poll with 47 votes. Taps the creator's name. Lands on their profile:

```
Maya Johnson · @maya
"52 people participated in your apps"
Apps: 3 · Reach: 52

Featured: "Friday Night Poll" — 47 votes
```

The student thinks: "She just... made a poll and 47 people voted? I could do that."

This is Moment 4 from the value props. The profile is where it happens. The profile makes creation feel achievable, not exclusive.

### What Makes This Work

1. **Creator names on feed cards.** Every creation in the feed shows "Created by Maya" — tappable to profile.
2. **Participation count is visible to everyone.** Not hidden. Not private. When you view Maya's profile, you see her impact. This is social proof that creation = reach.
3. **The Builder Showcase is inviting, not intimidating.** A profile with 1 app and 12 votes looks like "someone just getting started" — not "someone who's been here forever." The bar feels low enough to clear.

### What Doesn't Appear on Profile

- **AI-generated creations.** Only human creations. The profile is proof of human effort.
- **Engagement with other people's creations.** Voting on a poll doesn't show on your profile. Only creating does.
- **Failed or deleted creations.** Only live, deployed creations appear.

This ensures the profile rewards creation, not consumption. The signal is clear: build things → your profile grows.

---

## Profile in the Leaderless Model

With spaces operating without leaders, the profile's role evolves:

### Before (Leader-Dependent Model)
- Only org leaders create → only leaders have interesting profiles
- Profile is an org-leader feature
- Most student profiles are empty (no apps)

### Now (Leaderless Model)
- Anyone can create via slash commands in any space
- A freshman who types `/poll Best study spot?` in UB Engineering's chat now has a creation on their profile
- More creators = more interesting profiles = more "I could do that" moments
- The profile becomes relevant to every student, not just org leaders

### The Implication
The barrier to having a "good profile" drops dramatically. You don't need to be a club president. You need to type one slash command. This democratizes the creator identity and makes the profile relevant earlier in the student lifecycle.

---

## Viewing Someone Else's Profile

When you tap on a creator's name from the feed, a space, or a creation:

### Context Banner
Shows shared context between you and the person:
- "2 shared spaces" — you're both in UB Engineering and UB Chess
- "3 mutual friends" — social proof
- "Both builders" — if you've both created apps

This banner only appears when viewing someone else. It creates the "small campus" feeling.

### What You See vs. What They See

| Element | Own Profile | Someone Else's |
|---------|------------|----------------|
| Participation count | "52 people participated in **your** apps" | "52 people participated in **Maya's** apps" |
| Builder Showcase | All apps with visibility controls | Public/campus-visible apps only |
| Action buttons | Edit Profile | Connect / Share |
| Empty states | CTAs to Build/Discover | Hidden (no judgment) |
| Activity heatmap | Full detail | Respects privacy settings |
| Next event card | Shown | Hidden |

### Privacy
Default privacy is `CAMPUS_ONLY` — profiles are visible to students on the same campus. Cross-campus access returns 404. Private profiles also return 404 (no information leak about existence).

---

## Spaces and the Value Props

### Zero-to-Audience
The profile proves it happened. "52 people participated" is the evidence that you went from zero to audience.

### Campus Becomes Responsive
Your profile shows which creations got the most responses. The campus responded to your ideas, and the profile quantifies it.

### Ideas Become Real
The Builder Showcase IS your ideas made real. A list of live, functional apps that people are using. Not mockups. Not plans. Working things.

### Participation Without Social Cost
Viewing someone's profile — seeing shared spaces, shared interests — reduces the social cost of connecting. You already know you have things in common before you ever meet.

---

## Key Metrics

| Metric | What it measures | Target |
|--------|-----------------|--------|
| **Profile view → build rate** | % of profile views (own) that lead to a creation within 24h | >20% |
| **Profile view → connect rate** | % of profile views (others) that lead to a connect action | >10% |
| **Creator profile revisit rate** | % of creators who check their profile within 48h of creating | >60% |
| **"I could do that" rate** | % of non-creator profile views → viewer creates within 7 days | >5% |
| **Profile completion rate** | % of users who complete recommended profile fields | >50% |

---

## What We Are NOT Building

| Feature | Why not |
|---------|---------|
| Badges / achievements / gamification | Punishes absence. The participation count IS the achievement. |
| Profile themes / customization | Vanity feature, zero impact on retention. |
| Public profiles (outside campus) | Campus isolation is a hard security rule. |
| "Who viewed my profile" | Privacy anti-pattern. |
| Profile analytics dashboard | The profile itself IS the dashboard. Numbers are right there. |
| Portfolio export | Not relevant at launch. |
| Creator rankings / leaderboards | Creates competition anxiety. HIVE is collaborative, not competitive. |
| Skill tags / endorsements | LinkedIn pattern, wrong for campus. Interests are enough. |

---

## Perspective Signals

### Overwhelmed Org Leader (Maya)
**Test:** She built 2 apps this week. Opens her profile on the bus ride home. Does she feel validated?
**What works:** "47 people participated in your apps" is visible in 2 seconds. Each app shows its own number. She knows it's working.
**What breaks:** If the numbers don't update in real-time. If she has to refresh. If the participation count says "0" because of a data lag. The feedback must be instant and accurate.

### Lonely Freshman
**Test:** They just joined 2 spaces and set up their profile. Does it feel like theirs?
**What works:** Name, handle, major, 2 spaces visible. Profile feels like a starting point. "Build your first app" CTA is inviting, not pressuring.
**What breaks:** If the profile feels empty and the heatmap is a grid of gray squares. If the empty state language implies they're behind ("No apps yet" → shame). Keep it inviting: "Build your first app to unlock your portfolio."

### Returning Skeptic
**Test:** They opened HIVE twice. They've voted on 2 polls but haven't created anything. Is their profile interesting enough to come back to?
**What works:** Spaces they joined show activity. Interests show overlap with others. Profile feels like campus identity even without creations.
**What breaks:** If the profile is just "name + empty zones." The campus identity zones (spaces, interests, connections) need to carry the profile for non-creators. Most users at launch will be non-creators — their profiles must still feel worth having.

### The Future Creator
**Test:** A student views a creator's profile from the feed. Do they think "I could do that"?
**What works:** The creator's profile shows 1 app with 23 votes. Not intimidating. Not exclusive. Just someone who typed a sentence and 23 people responded. The student opens `/build`.
**What breaks:** If creator profiles look like power-user dashboards with complex stats and dozens of apps. The profile must feel approachable. One app with 23 votes should look like success, not like a bare minimum.
