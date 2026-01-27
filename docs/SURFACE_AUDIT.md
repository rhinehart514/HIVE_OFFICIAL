# HIVE Surface Lab

> **Purpose:** Ideation and brainstorming canvas for every HIVE surface. Each section is a thinking space — what exists, what's possible, what it could become.
>
> **How to use:** Pick a surface. Read the context. Use the prompts. Capture ideas. Revisit often.
>
> **Last Updated:** 2025-01-26

---

## Surface Template

Each surface follows this structure:

```
## [Surface Name]

### The Job
What is this surface trying to accomplish? What user need does it serve?

### Current State
Brief description of what exists today. Status indicator.

### Inspirations
What do the best products do here? What patterns exist in the wild?

### Opportunity Space
Where can we innovate? What's underexplored? What would 10x look like?

### Brainstorm Prompts
Questions to spark thinking. Constraints to design around.

### Ideas Captured
Running list of ideas from sessions. Date-stamped.

### Open Questions
Unresolved tensions. Things we need to decide.

### Technical Reality
What's actually built. What's stubbed. What's blocking.
```

---

# 1. ENTRY & FIRST CONTACT

## 1.1 `/` — The Gate

### The Job
Control access to HIVE. First impression. Set expectations for what's inside.

A 6-digit code separates "outside" from "inside." This is the membrane.

### Current State
🚧 **Partially Built**

- Beautiful glass UI with code input
- Lockout after failed attempts
- But: API endpoint doesn't exist — door is locked from the inside

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Clubhouse (early)** | Invite-only created mystique | Scarcity breeds desire |
| **Superhuman** | Waitlist + onboarding call | Qualification feels premium |
| **Linear** | Just works, no gate | Friction is a choice |
| **Discord servers** | Invite links, not codes | Social distribution |
| **Notion workspaces** | Email domain = auto-access | Campus could work this way |

### Opportunity Space

**The tension:** Gates create exclusivity but also friction. What's the right balance for campus infrastructure?

**Underexplored:**
- Could the gate be *alive*? Show activity happening inside?
- What if the code reveals something about who invited you?
- Could entering feel like a ritual, not a chore?
- What happens when someone doesn't have a code? Dead end or path forward?

**10x version:** The gate teaches you about HIVE before you enter. It's not a wall — it's a preview.

### Brainstorm Prompts

1. **If there was no code at all**, how would we ensure quality/trust?
2. **If the code was a person's name** instead of digits, what changes?
3. **What should someone feel** in the 5 seconds before they enter?
4. **What's the "wrong" way** to do this that might actually be right?
5. **If this page had to work for 10 years**, what would we keep?

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| 2025-01-26 | **Show life inside the gate** — Display a pulse: "47 people active now" / "3 spaces launched this week" / subtle activity indicators. The code unlocks something alive, not a wall. | 💡 Proposed |
| 2025-01-26 | **Social codes** — Codes tied to inviters: entering reveals "Invited by @sarah from Design Club". Makes entry a moment of connection, not just access control. | 💡 Proposed |
| 2025-01-26 | **The "no code" path** — Add waitlist signup for the curious. Collect email + school, notify when their campus launches. Dead ends kill interest. | ✅ SHIPPED (API + Modal) |
| 2025-01-26 | **Observe mode** — Limited view without code: see HIVE exists, see some public activity cards, but can't interact. Creates desire through glimpse. | 💡 Proposed |

### Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01-26 | **Keep 6-digit code** | Right balance of friction (ensures quality) and simplicity (anyone can type 6 digits). Codes are per-campus for now. |
| 2025-01-26 | **Add "no code" path** | Dead ends hurt. Waitlist captures interest and builds launch momentum. |
| 2025-01-26 | **Show activity pulse** | The gate should make you WANT to enter. Mystery without substance feels hollow. |

### Open Questions

- [x] ~~Is the 6-digit code the right mechanic?~~ → YES, keep it
- [ ] Should codes be per-campus, per-person, or per-invite? → Per-campus for MVP
- [x] ~~What's the "no code" path?~~ → Waitlist signup
- [ ] Do we want mystery or clarity? → CLARITY with intrigue (show activity, hide details)

### Technical Reality

```
Status: ✅ FUNCTIONAL
File: apps/web/src/app/page.tsx (~480 lines)
API: /api/auth/verify-access-code EXISTS (279 lines, full implementation)
UI: Complete and polished

Enhancements needed:
- [ ] Add activity pulse component (fetch from /api/realtime/metrics)
- [x] "Don't have a code?" → waitlist modal (2026-01-26)
- [ ] Consider social code reveal ("Invited by @name")
```

---

## 1.2 `/enter` — Becoming a Member

### The Job
Transform a stranger into a HIVE member. Collect what we need. Establish identity. Make them feel arrived.

Progressive disclosure: email → verify → role → identity → welcome.

### Current State
🚧 **Mostly Built**

- Beautiful evolving sections that collapse to chips
- Role selection (student/builder/staff)
- Handle generation with AI
- But: depends on gate working first

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Stripe Atlas** | Progressive disclosure, never overwhelming | Complex → simple |
| **Duolingo** | Onboarding IS the product | Teach by doing |
| **Notion** | Template selection = intent declaration | Know what they want |
| **Slack** | Workspace context immediately | Belonging from step 1 |
| **BeReal** | One-tap setup, details later | Speed to value |

### Opportunity Space

**The tension:** We need information, but every field is friction. What's truly essential at entry vs. can come later?

**Underexplored:**
- What if onboarding was non-linear? Start anywhere?
- Could we infer school from email domain always?
- What if the handle wasn't chosen but earned?
- How do we make verification feel instant, not waiting?
- What's the first thing they should DO, not configure?

**10x version:** Onboarding feels like being welcomed by a host, not filling out forms. You're doing things, not declaring things.

### Brainstorm Prompts

1. **What if there were only 2 steps?** What survives?
2. **What's the first moment of delight** they should experience?
3. **If we could only ask ONE question**, what would it be?
4. **What should they know about HIVE** before they're "inside"?
5. **What's the worst onboarding you've experienced?** Avoid that.

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| 2025-01-26 | **Reduce identity to essentials** — Current: firstName, lastName, handle, major, graduationYear, residenceType, residentialSpaceId, interests, communityIdentities. That's 9+ fields! Essentials: name + handle. Everything else is progressive. | ✅ Decided |
| 2025-01-26 | **Make arrival actionable** — Don't end with "Enter HIVE". End with "Here are 3 spaces for you" based on interests/major. First action is joining, not navigating. | ✅ SHIPPED |
| 2025-01-26 | **Skip school selection** — Auto-detect from email domain. One less step. Only show school selector if domain is ambiguous or multi-campus. | 💡 Proposed |
| 2025-01-26 | **Handle as earned moment** — The handle reveal after email verification is the "you're becoming someone" moment. Keep this, it's good. | ✅ Keep |
| 2025-01-26 | **Role from behavior** — Instead of explicit selection, infer: .edu email = student, specific domains = faculty, graduated years = alumni. Ask only when ambiguous. | 💡 Proposed |

### Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01-26 | **Essential identity = name + handle only** | Major, graduation year, residence, interests are nice-to-have. Collect them later when contextually relevant (joining a major space, etc.). Every field is friction. |
| 2025-01-26 | **Keep email verification** | Even with .edu domain, verification proves ownership. Non-negotiable for trust. |
| 2025-01-26 | **Deprecate `/welcome` flow** | The EvolvingEntry arrival is superior. `/welcome/*` is redundant. Remove it. |

### Open Questions

- [x] ~~Is email verification necessary?~~ → YES, always
- [ ] Should role selection happen here or emerge? → Hybrid: infer when possible, ask when unclear
- [x] ~~What's minimum viable identity?~~ → Name + handle
- [ ] How do we handle abandonment? → Session persists partially-completed state

### Technical Reality

```
Status: ✅ FUNCTIONAL
Files:
- apps/web/src/app/enter/page.tsx (93 lines, clean)
- apps/web/src/components/entry/EvolvingEntry.tsx (331 lines, orchestrator)
- apps/web/src/components/entry/hooks/useEvolvingEntry.ts (937 lines, state machine)
- apps/web/src/components/entry/sections/*.tsx (8 sections)

Current flow: School → Email → Code → Role → Identity → Arrival
Proposed flow: Email → Code → Identity (name+handle only) → Arrival (with space recs)

Recent changes (2026-01-26):
- [x] ArrivalSection now shows 3 recommended spaces with quick-join
- [x] Redirect changed from /spaces to /feed
- [x] Removed hardcoded "+400" teaser text

APIs: All exist and work
- /api/auth/send-code ✅
- /api/auth/verify-code ✅
- /api/auth/complete-entry ✅
- /api/auth/check-handle ✅
- /api/spaces/recommended ✅ (used by ArrivalSection)

Motion: Premium quality (word-by-word reveals, section collapse to chips, emotional state glow)
```

---

## 1.3 `/welcome` — The Arrival Moment

### The Job
Confirm they're in. Celebrate. Point them toward what's next.

The transition from "becoming" to "being" a member.

### Current State
⚠️ **DEPRECATED — Consolidate into `/enter` arrival**

### Analysis (2025-01-26)

**The `/welcome` flow is redundant.** Here's what exists:

```
/welcome                → "Welcome, [name]. You're in." + CTA
/welcome/identity       → Avatar + display name setup
/welcome/territory      → Find/join spaces (TerritoryMap)
/welcome/claimed        → Final celebration + "Go to feed"
```

**But `/enter` already has:**
- ArrivalSection with "You're in, [name]!" celebration
- Gold checkmark with glow
- Handle badge reveal ("@handle is yours")
- "Enter HIVE" CTA → redirects to `/spaces`

**The duplication:**
| Feature | `/enter` Arrival | `/welcome` Flow |
|---------|------------------|-----------------|
| Celebration | ✅ Gold checkmark, word reveal | ✅ GradientText, confetti |
| Name display | ✅ "You're in, [name]" | ✅ "Welcome, [name]" |
| Identity setup | ✅ IdentitySection (before arrival) | ✅ /welcome/identity |
| Space discovery | ❌ Missing | ✅ /welcome/territory |
| Handle reveal | ✅ "@handle is yours" badge | ❌ Missing |

### Decision: Consolidate

**Kill `/welcome/*` and enhance `/enter` arrival instead.**

**What to port from `/welcome` into `/enter` arrival:**
1. **Space recommendations** — The TerritoryMap concept, but inline. "3 spaces for you" based on interests/major.
2. **Quick-join** — Join a space directly from arrival, don't make them navigate.

**What `/enter` already does better:**
1. Handle reveal moment (earned identity)
2. Gold checkmark celebration (more premium than confetti)
3. Single-page flow (no navigation during onboarding)

### Implementation Plan

```
1. Add space recommendations to ArrivalSection
   - Fetch /api/spaces/recommendations (based on interests/major)
   - Show 3 space cards with quick-join
   - "Explore more" link to /spaces/browse

2. Change arrival CTA
   - FROM: "Enter HIVE" → /spaces
   - TO: "Go to your feed" → /feed (or go to joined space)

3. Delete /welcome/* routes
   - /welcome/page.tsx
   - /welcome/identity/page.tsx
   - /welcome/territory/page.tsx
   - /welcome/claimed/page.tsx

4. Keep /welcome components for reuse
   - WelcomeShell (good shell pattern)
   - TerritoryMap (useful for space discovery elsewhere)
```

### Technical Reality

```
Status: ⚠️ DEPRECATED
Files to delete:
- apps/web/src/app/welcome/page.tsx
- apps/web/src/app/welcome/identity/page.tsx
- apps/web/src/app/welcome/territory/page.tsx
- apps/web/src/app/welcome/claimed/page.tsx

Files to keep (reusable):
- apps/web/src/components/onboarding/WelcomeShell.tsx
- apps/web/src/components/onboarding/TerritoryMap.tsx
```

---

# 2. THE PULSE (Feed)

## 2.1 `/feed` — Campus Heartbeat

### The Job
Show what's happening right now. Surface what matters. Make the campus feel alive.

Not a social feed — an awareness layer.

### Current State
🚧 **Core Built, Needs Life**

- Unified feed component exists
- Activity types render
- But: feels static, not alive
- Live events feature broken (isLive never set)

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Twitter/X** | Real-time pulse of now | Immediacy |
| **Discord activity** | Shows what's happening in servers | Contextual activity |
| **Linear inbox** | Actionable items, not just noise | Signal > noise |
| **Are.na** | Connections, not just posts | Meaning over volume |
| **Strava feed** | Celebration of others | Positive-sum |

### Opportunity Space

**The tension:** Feeds become addictive or useless. How do we make one that's healthy and valuable?

**Underexplored:**
- What if the feed had "modes" — catch up, deep dive, just vibes?
- Could AI summarize what you missed?
- What if activity grouped by energy, not time?
- How do we surface serendipity without noise?
- What belongs in feed vs. notifications vs. search?

**10x version:** The feed is a weather system for campus — you can read it in 10 seconds or explore for an hour. It makes you smarter about what's happening.

### Brainstorm Prompts

1. **If someone had 30 seconds**, what should they see?
2. **What makes a campus feel "alive"?** How do we show that?
3. **What should NEVER appear in the feed?**
4. **How do we avoid the "scroll forever" trap?**
5. **What's the difference between our feed and Instagram/Twitter?**

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Open Questions

- [ ] Is chronological or algorithmic right for campus?
- [ ] How do we balance spaces you're in vs. broader campus?
- [ ] What's the role of AI in curating/summarizing?
- [ ] Should there be different feeds for different contexts?

### Technical Reality

```
Status: 🚧 Core built
Files:
- apps/web/src/app/feed/page.tsx
- apps/web/src/components/feed/UnifiedActivityFeed.tsx
- apps/web/src/components/feed/FeedCard.tsx

Issues:
- isLive never gets set (live events broken)
- SSE real-time is architecturally broken
- Feels static, needs life
```

---

## 2.2 `/explore` — Discovery Engine

### The Job
Help people find what they didn't know to look for. Surface possibilities. Enable serendipity.

Not search — discovery.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Spotify Discover** | Personalized, novel, trustworthy | Algorithmic taste |
| **Pinterest** | Visual browsing, endless possibility | Exploration mode |
| **Are.na** | Connections reveal meaning | Curation as discovery |
| **Product Hunt** | Daily drops, ranked | Temporal rhythm |
| **Hinge prompts** | Structured serendipity | Guided discovery |

### Opportunity Space

**The tension:** Discovery requires showing things you don't know you want. How without being creepy or irrelevant?

**Underexplored:**
- What if discovery was question-based? "Find people who..."
- Could we show paths, not just destinations?
- What's the role of curation vs. algorithm?
- How do we surface hidden gems without popular bias?

**10x version:** Explore feels like a well-stocked library with a genius librarian. You always leave with something you didn't expect.

### Brainstorm Prompts

1. **What's the most surprising thing** someone could discover on campus?
2. **How do we avoid filter bubbles?**
3. **What makes discovery feel magical vs. overwhelming?**
4. **Should explore be personalized or universal?**

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Open Questions

- [ ] Is /explore separate from /feed or part of it?
- [ ] What are the primary discovery vectors? (spaces, people, events, content?)
- [ ] How much personalization is right?

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/explore/page.tsx (if exists)
```

---

# 3. SPACES

## 3.1 `/spaces` — The Spaces Hub

### The Job
Show your spaces. Help you find new ones. Make the concept of "spaces" legible.

The home of all spaces.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Discord server list** | Visual, organized, quick access | Efficiency |
| **Slack sidebar** | Hierarchy, sections, unread counts | Organization |
| **Notion sidebar** | Nested, flexible, collapsible | Power user |
| **Are.na channels** | Flat, equal, content-forward | Egalitarian |
| **Figma home** | Recents + organized | Usage patterns |

### Opportunity Space

**The tension:** Spaces are the core unit, but how do you show 50 of them meaningfully?

**Underexplored:**
- What if spaces had "activity weather" showing vibe at a glance?
- Could we group by energy/mode, not just category?
- What's the role of pinning, archiving, muting?
- How do we handle someone in 100 spaces?

**10x version:** Your spaces feel like a neighborhood you know. You can navigate by feel.

### Brainstorm Prompts

1. **If someone had 10 spaces**, how should this look?
2. **If someone had 100 spaces**, how should this look?
3. **What makes you want to click into a space?**
4. **What should we show WITHOUT clicking in?**

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Open Questions

- [ ] Grid vs. list vs. something else?
- [ ] How do we show space "health" or activity?
- [ ] What's the relationship to sidebar navigation?

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/spaces/page.tsx
```

---

## 3.2 `/spaces/browse` — Space Discovery

### The Job
Help people find spaces to join. Make the possibility space visible.

The "app store" for spaces.

### Current State
🚧 **Built, Needs Polish**

- Categories and search exist
- Featured spaces surface
- But: recommendation logic unclear

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **App Store** | Categories, featured, charts | Discovery structure |
| **Eventbrite** | Location-aware, time-aware | Context |
| **Reddit** | Popular, trending, niche | Multiple entry points |
| **Meetup** | Social proof, member counts | Trust signals |
| **Discord Discover** | Server templates, previews | Try before you buy |

### Opportunity Space

**The tension:** Too many spaces overwhelms. Too few disappoints. How do we guide without constraining?

**Underexplored:**
- What if you could "preview" a space before joining?
- Could we show who you know in each space?
- What's the role of "trending" on a campus?
- How do we surface brand-new spaces fairly?

**10x version:** Browsing spaces feels like exploring a city. You can wander, get recommendations, or go straight to what you need.

### Brainstorm Prompts

1. **What makes you join a space?** Is it FOMO, curiosity, utility?
2. **How do we prevent ghost spaces** (created but dead)?
3. **What's the first thing you want to know** about a space?
4. **Should we show spaces you explicitly DON'T belong to?**

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Open Questions

- [ ] What signals indicate a "good" space?
- [ ] How do we handle invite-only spaces in browse?
- [ ] What's the role of the space creator's reputation?

### Technical Reality

```
Status: 🚧 Built
File: apps/web/src/app/spaces/browse/page.tsx

Components: CategoryFilter, SpaceCard, SearchInput
API: /api/spaces (working)
```

---

## 3.3 `/spaces/new` — Space Creation

### The Job
Turn an idea into a space. Make creation feel powerful but not overwhelming.

The birthplace of spaces.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Notion** | Template gallery, or blank page | Choice |
| **Figma** | Start from templates | Quick start |
| **Slack** | Simple channel creation | Minimal friction |
| **Discord** | Server templates with presets | Structure options |
| **Circle** | Guided setup wizard | Hand-holding |

### Opportunity Space

**The tension:** Powerful features need configuration. But configuration kills creation rate. How do we offer power with sensible defaults?

**Underexplored:**
- What if AI helped you create based on describing what you want?
- Could spaces start "provisional" and solidify over time?
- What's the minimum viable space? Just a name?
- How do we avoid template paralysis?

**10x version:** Creating a space is as easy as naming a group chat, but grows into something powerful.

### Brainstorm Prompts

1. **What's the simplest possible space creation?** Name only?
2. **What decisions should be made NOW vs. later?**
3. **How do we inspire without overwhelming** with templates?
4. **What makes someone abandon space creation midway?**

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Open Questions

- [ ] Templates: essential or overwhelming?
- [ ] What's the default privacy setting?
- [ ] Should creation require approval or be instant?

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/spaces/new/page.tsx
```

---

## 3.4 `/spaces/join/[code]` — Joining Flow

### The Job
Turn an invite into membership. Handle the edge cases. Confirm arrival.

The transition from outsider to insider.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Slack invite** | Click, confirm, you're in | Frictionless |
| **Discord invite** | Preview before join | Informed consent |
| **Zoom waiting room** | Acknowledgment of pending | Clarity |
| **Google Docs share** | Just works | Invisible |

### Opportunity Space

**Underexplored:**
- What if the invite page showed you who else is there?
- Could we preview recent activity before committing?
- What happens with invalid/expired invites?

### Brainstorm Prompts

1. **What would make you NOT join** after clicking an invite?
2. **What information builds confidence** to join?
3. **How should this feel different** from entering HIVE itself?

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/spaces/join/[code]/page.tsx
```

---

# 4. SPACE RESIDENCE

## 4.1 `/s/[handle]` — The Space

### The Job
The space itself. Where everything happens. The place members call home.

This is THE core surface.

### Current State
🚧 **Core Built, Complex Surface**

- Hero header with space info
- Tabbed navigation (activity, boards, members, events)
- Settings for leaders
- But: many sub-surfaces need work

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Discord server** | Channels, voice, organized chaos | Rich but navigable |
| **Notion workspace** | Calm, structured, flexible | Composability |
| **Slack channel** | Focused conversation | Simplicity |
| **Are.na channel** | Visual collection | Curation |
| **Figma project** | Active collaboration | Real-time |
| **GitHub repo** | README, code, issues, wiki | Multi-surface |

### Opportunity Space

**The tension:** Spaces need to support 100 different use cases (clubs, classes, projects, communities) without being bloated.

**Underexplored:**
- What if spaces could change "mode" (active session, async, archive)?
- Could the space layout adapt to what's happening NOW?
- What's the role of AI in a space?
- How do we handle 5 people vs. 500 people?
- What does a "thriving" vs. "dying" space look like?

**10x version:** A space feels like a place — with atmosphere, rhythm, and memory. Not a container of features.

### Brainstorm Prompts

1. **If a space had ONE feature**, what would it be?
2. **What makes a space feel alive** even when no one's there?
3. **How do we handle the transition** from creator alone → first members → thriving community?
4. **What should a space remember** vs. let go?
5. **How does a space die gracefully?**

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Open Questions

- [ ] Tabs vs. panels vs. something else for navigation?
- [ ] What's the default view for a space?
- [ ] How do permissions scale without complexity?
- [ ] What's the role of the space "leader"?

### Technical Reality

```
Status: 🚧 Core built
File: apps/web/src/app/s/[handle]/page.tsx

Sub-surfaces:
├── SpacePageHeader (hero, stats, actions)
├── SpacePageContent (tabs container)
├── ActivityTab (UnifiedActivityFeed)
├── BoardsTab (boards sidebar + view)
├── MembersTab (member list + roles)
├── EventsTab (space events)
├── SettingsModal (leader config)
└── InviteModal (invite generation)

Known Issues:
- Role management stubbed
- Activity feed lacks SSE real-time
- Boards need attention
```

---

### 4.1.1 Space Header

**The Job:** First impression of the space. Identity, key stats, primary actions.

**Current:** Hero image, name, handle, member count, join/leave button.

**Opportunity:**
- What if the header showed "energy" — busy right now vs. quiet?
- Could we show who you know here?
- What's the right density of information?

---

### 4.1.2 Activity Tab

**The Job:** Stream of what's happening. The space's pulse.

**Current:** UnifiedActivityFeed showing posts, announcements, events.

**Opportunity:**
- Thread vs. flat — what's right?
- How do we handle high-volume spaces?
- What about pinned/important items?

---

### 4.1.3 Boards Tab

**The Job:** Structured content. Persistent, organized, beyond the stream.

**Current:** Sidebar with board list, main view for selected board.

**Opportunity:**
- What's a "board"? Is that the right metaphor?
- Notion-like blocks? Trello-like cards? Something else?
- How do boards relate to activity stream?

---

### 4.1.4 Members Tab

**The Job:** Who's here. Connection opportunities. Trust building.

**Current:** Member list with roles, search/filter.

**Opportunity:**
- What makes you want to connect with someone?
- Role display: prominent or hidden?
- How do we surface interesting people, not just recent joiners?

---

### 4.1.5 Events Tab

**The Job:** What's coming up. Temporal organization.

**Current:** Event list for the space.

**Opportunity:**
- Calendar view vs. list?
- How do events integrate with personal calendar?
- What about recurring events (rituals)?

---

### 4.1.6 Settings (Leaders)

**The Job:** Configure the space. Manage membership. Set policies.

**Current:** Modal with settings sections.

**Opportunity:**
- What settings are actually used?
- How do we avoid settings bloat?
- What should be automatic vs. configurable?

**Technical Issue:**
```
Status: 🚧 Role management stubbed
File: space settings component
Issue: Role CRUD is TODO, returns mock
```

---

# 5. PROFILE & IDENTITY

## 5.1 `/profile/[id]` — Public Profile

### The Job
Show who someone is. Build trust. Enable connection.

The face you show to others.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **LinkedIn** | Professional identity, structured | Completeness |
| **Twitter/X** | Personality forward, simple | Voice |
| **GitHub** | Activity-based, earned | Proof of work |
| **Are.na** | Collections reveal taste | Curation as identity |
| **Polywork** | Highlights over history | What matters |

### Opportunity Space

**The tension:** Profiles can be performative or authentic. How do we encourage authenticity?

**Underexplored:**
- What if profiles were mostly auto-generated from activity?
- Could we show compatibility/overlap with the viewer?
- What's the role of privacy in profiles?
- How do we handle people who don't want profiles?

**10x version:** Your profile tells your story without you having to write it. It's alive with your activity.

### Brainstorm Prompts

1. **What makes you want to connect** with someone from their profile?
2. **What information is NEVER useful** on a profile?
3. **How do we prevent profile abandonment** (set up once, never updated)?
4. **Should profiles look different** to friends vs. strangers?

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Open Questions

- [ ] What's required vs. optional on a profile?
- [ ] How do we handle verification (student, staff)?
- [ ] What activity should auto-surface?

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/profile/[id]/page.tsx
```

---

## 5.2 `/profile` — Personal Dashboard

### The Job
Your home base. Stats, settings, activity. Self-reflection.

The view only you see.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Spotify for Artists** | Your stats, actionable | Data you care about |
| **GitHub dashboard** | Contribution graph, activity | Visual history |
| **Strava profile** | Personal bests, trends | Progress |
| **Notion home** | Quick access to everything | Navigation hub |

### Opportunity Space

**Underexplored:**
- What if your dashboard showed you insights about yourself?
- Could we suggest actions based on your patterns?
- What's the relationship between dashboard and feed?

### Brainstorm Prompts

1. **What do you want to know about yourself** in 30 seconds?
2. **What actions do you take** from your dashboard?
3. **How do we make this useful** daily vs. weekly?

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/profile/page.tsx
```

---

# 6. TIME & EVENTS

## 6.1 `/calendar` — Personal Calendar

### The Job
Your time. What's coming. Manage commitments.

The temporal layer.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Calendly** | Availability-first | Outward facing |
| **Notion calendar** | Integrated with work | Context |
| **Cron** | Beautiful, fast | Craft |
| **Google Calendar** | Standard, reliable | Interop |

### Opportunity Space

**Underexplored:**
- How does personal calendar relate to space events?
- What if we showed "energy budget" not just time slots?
- Could calendar help with focus, not just scheduling?

### Brainstorm Prompts

1. **What's wrong with Google Calendar** that we could fix?
2. **How does calendar connect to HIVE activity?**
3. **Should we try to BE a calendar or INTEGRATE with one?**

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Technical Reality

```
Status: 📋 Needs audit
Issues: Calendar integrations may be mock data
```

---

## 6.2 `/events` — Events Discovery

### The Job
What's happening on campus. Discovery for time-bound activities.

The event layer.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Eventbrite** | Discovery + ticketing | Scale |
| **Luma** | Beautiful, curated | Taste |
| **Partiful** | Social, fun | Energy |
| **Facebook Events** | Social proof, RSVPs | Context |

### Opportunity Space

**Underexplored:**
- What makes campus events different from general events?
- How do we handle the "too many events" problem?
- What about spontaneous / flash events?

### Brainstorm Prompts

1. **What makes you RSVP** to an event?
2. **How do we prevent event spam?**
3. **What's the role of social proof** (who's going)?

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/events/page.tsx
```

---

## 6.3 `/rituals` — Recurring Events

### The Job
Things that happen regularly. Building habit and community rhythm.

The heartbeat.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Strava clubs** | Weekly challenges | Gamification |
| **Peloton** | Scheduled classes | Appointment viewing |
| **Church** | Weekly gathering | Ritual power |
| **Standup meetings** | Recurring cadence | Predictability |

### Opportunity Space

**The tension:** Rituals need consistency but can become stale. How do we keep them fresh?

**Underexplored:**
- What makes something a "ritual" vs. just a recurring event?
- Could we help create rituals, not just host them?
- What's the failure mode of a ritual?

### Brainstorm Prompts

1. **What rituals do you actually maintain?** What makes them stick?
2. **How do we help rituals survive** leadership turnover?
3. **What's a campus ritual that doesn't exist but should?**

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/rituals/page.tsx
```

---

# 7. HIVELAB — Builder Tools

## 7.1 `/lab` — HiveLab Dashboard

### The Job
Where builders build. Tool management. Creation space.

The workshop.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Retool** | Internal tool builder | Power + speed |
| **Notion formulas** | Simple → complex | Progressive disclosure |
| **Zapier** | Connect anything | Integration mental model |
| **GitHub Actions** | Automation definition | Declarative |
| **Figma plugins** | Extension ecosystem | Platform |

### Opportunity Space

**The tension:** Powerful tools are complex. Simple tools are limited. How do we offer both?

**Underexplored:**
- What if tools could learn from usage?
- Could we have AI-assisted tool creation?
- What's the right abstraction level for student builders?
- How do tools get shared/discovered?

**10x version:** HiveLab feels like having superpowers. You think it, you build it, it works.

### Brainstorm Prompts

1. **What's the simplest tool** someone should be able to make?
2. **What's the most powerful tool** we should enable?
3. **How do we teach building** through the act of building?
4. **What's the killer tool** that every campus would want?

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Open Questions

- [ ] What's the tool execution model?
- [ ] How do we handle security for user-created tools?
- [ ] What's the review/approval flow?

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/lab/page.tsx
See also: docs/HIVELAB_ARCHITECTURE.md

Security concerns:
- Tool sandbox allows HTTP requests to any domain
- Storage implementation stubbed
```

---

# 8. NOTIFICATIONS & SETTINGS

## 8.1 `/notifications` — Notification Center

### The Job
Everything that wants your attention. Triage and act.

The inbox.

### Current State
📋 **Needs Audit**

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Linear inbox** | Actionable, triaged | Not just a list |
| **GitHub notifications** | Filters, done states | Management |
| **Slack threads** | Context preserved | Continuity |
| **Superhuman** | Aggressive inbox zero | Efficiency |

### Opportunity Space

**The tension:** Notifications are both essential and annoying. How do we be useful without being noisy?

**Underexplored:**
- What if we bundled intelligently instead of listing chronologically?
- Could we learn what you care about and suppress the rest?
- What's the role of push vs. pull notifications?

### Brainstorm Prompts

1. **What notification would you NEVER want to miss?**
2. **What notification are you sick of seeing?**
3. **How do we respect attention** while keeping people informed?

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Technical Reality

```
Status: 📋 Needs audit
Issue: Notification sending may be stubbed in some APIs
```

---

## 8.2 `/settings` — Account Settings

### The Job
Control panel. Preferences. Account management.

The configuration layer.

### Current State
📋 **Needs Audit**

### Opportunity Space

**Principle:** Settings are an admission of failure. Every setting should have a sensible default.

**Underexplored:**
- What settings do people actually change?
- Could we eliminate half of them?
- What's the relationship between account settings and space settings?

### Brainstorm Prompts

1. **What setting should NEVER exist?**
2. **What setting are you grateful exists?**
3. **How do we organize** without overwhelming?

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Technical Reality

```
Status: 📋 Needs audit
File: apps/web/src/app/settings/page.tsx
```

---

# 9. ADMIN

## 9.1 Admin Dashboard

### The Job
Platform operators managing HIVE. Campus admins managing their campus.

The control plane.

### Current State
🚧 **Multiple Admin Surfaces**

- Comprehensive admin dashboard exists
- Space management exists
- User management exists
- But: some endpoints missing, some data mock

### Inspirations

| Product | What They Do | What We Can Learn |
|---------|--------------|-------------------|
| **Vercel dashboard** | Clean, operational | Clarity |
| **Stripe dashboard** | Deep but navigable | Information architecture |
| **Linear admin** | Workspace settings | Simplicity |
| **Notion admin** | Member management | Scale |

### Opportunity Space

**The tension:** Admins need power, but power creates danger. How do we enable without risking damage?

**Underexplored:**
- What actions should require confirmation/2FA?
- How do we audit admin actions?
- What's the difference between HIVE admin and campus admin?

### Brainstorm Prompts

1. **What's the worst thing an admin could do?** How do we prevent it?
2. **What do admins check daily?** Make that instant.
3. **What admin task is most annoying?** Automate it.

### Ideas Captured

| Date | Idea | Status |
|------|------|--------|
| | | |

### Technical Reality

```
Status: 🚧 Functional but gaps

Missing endpoints:
- /api/admin/activity-logs
- /api/admin/content-moderation
- /api/admin/dashboard

Mock data:
- Some analytics hardcoded
- Builder queue stubbed
- Flag queue stubbed

Issues:
- Notification sending stubbed (notify flags ignored)
```

---

# 10. STATIC PAGES

## 10.1 `/about` — About HIVE

### The Job
Explain what HIVE is. Build trust. Inspire.

The story.

### Current State
✅ **This is the quality bar**

### Notes
This page sets the standard for all others.

---

## 10.2 `/legal/*` — Legal Pages

### The Job
Terms, privacy, compliance.

### Current State
📋 **Needs Audit**

---

## 10.3 `/not-found` — 404 Page

### The Job
Lost user. Guide them back.

### Current State
⚠️ **Exists but copy is wrong**

```
Issue: Mentions "looking for a space" — not always true
Fix: Generic copy, clear path back
```

---

# 11. DESIGN SYSTEM

## 11.1 Component Health

### The Job
The building blocks. Consistent, tested, documented.

### Current State
🚧 **93 primitives, 138 components, but gaps**

### Known Issues

**Stub Components (12):**
- RitualStrip, NotificationBell, WelcomeMat, HiveModal
- FeedLoadingSkeleton, Shell, ProfileBentoGrid
- RitualFoundingClass, RitualSurvival, RitualTournamentBracket
- SpaceChatBoard, AILandingPageChat

**Components with TODOs (12):**
- Checkbox, Tabs, Separator, Label, Toast, Modal
- TypingIndicator, TooltipRich, SwitchField
- SkeletonButton, NotificationBadge, SimpleSelect

**Token Violations:**
- Some hardcoded colors in Button, Input, Card

### Opportunity Space

**Underexplored:**
- What components are we missing?
- What components are over-engineered?
- How do we ensure consistency as we grow?

---

# 12. INFRASTRUCTURE

## 12.1 Critical Issues

### SSE Real-time
```
Status: ❌ Broken
File: apps/web/src/lib/sse-realtime-service.ts
Issue: broadcastMessage() fails silently
Impact: Real-time features don't work
```

### Hook Bugs
```
5 critical bugs in hooks package:
- useOptimisticUpdate: never passes config
- useHiveQuery.loadMore: ignores cursor
- useHiveQuery realtime: subscription leak
- useFeedAnalytics: stale closure + interval leak
```

### Missing APIs
```
- /api/auth/verify-access-code (blocks entry)
- /api/admin/activity-logs
- /api/admin/content-moderation
- /api/admin/dashboard
```

---

# Appendix A: Idea Backlog

Collect ideas that don't fit a specific surface here.

| Date | Surface | Idea | Notes |
|------|---------|------|-------|
| | | | |

---

# Appendix B: Session Log

Track brainstorming sessions here.

| Date | Surfaces Covered | Participants | Key Decisions |
|------|-----------------|--------------|---------------|
| | | | |

---

# Appendix C: Technical Blockers

Quick reference for what's actually broken.

| Blocker | Impact | Surface | Priority | Status |
|---------|--------|---------|----------|--------|
| ~~Missing `/api/auth/verify-access-code`~~ | ~~Can't enter app~~ | Landing | P0 | ✅ EXISTS (279 lines) |
| SSE real-time broken | No live updates | Feed, Spaces | P0 | ❌ Still broken |
| ~~5 hook bugs~~ | ~~Various breakages~~ | Multiple | P0 | ✅ 5/6 Fixed |
| Missing admin endpoints | Admin incomplete | Admin | P1 | ❌ 3 endpoints missing |
| Role management stubbed | Can't manage roles | Spaces | P1 | ❌ Still stubbed |
| Notification sending stubbed | Silent failures | Admin | P1 | ❌ Still stubbed |

### Entry & First Contact Status (Updated 2025-01-26)

| Component | Status | Notes |
|-----------|--------|-------|
| Gate (`/`) | ✅ Functional | API exists, UI polished |
| Enter (`/enter`) | ✅ Functional | Full flow works |
| Welcome (`/welcome/*`) | ⚠️ Deprecated | Consolidate into Enter arrival |
| Auth APIs | ✅ Complete | All endpoints exist and work |

### Remaining P0 Work

1. **SSE Real-time** — `apps/web/src/lib/sse-realtime-service.ts` needs fix or replacement
2. **useHiveQuery realtime subscription leak** — One hook bug remains

---

# Appendix D: Change Log

| Date | Author | Changes |
|------|--------|---------|
| 2025-01-26 | Claude | Restructured as ideation/brainstorming canvas |
| 2025-01-26 | Claude | Initial comprehensive audit |
