# HIVE TODO — Complete Platform Build

**Status:** Active Sprint
**Updated:** January 21, 2026
**Goal:** Infrastructure-grade platform, every page to /about quality standard

---

## Governing Principle

**HIVE doesn't fight chaos. HIVE fights erasure.**

Students aren't lonely because they lack people. They're lonely because they lack stable contexts where contribution matters.

Every page, every feature, every interaction must pass through the four invariants:

| Invariant | The Shift | Enforcement |
|-----------|-----------|-------------|
| **1. Witnessed** | Unwitnessed → Witnessed | Recaps, not feeds. "Here's what happened." |
| **2. Steward** | Perform → Steward | Weight, not celebration. "It's yours." |
| **3. Action** | Define yourself → Just act | Low narrative burden. "What are you building?" |
| **4. Memory** | Visibility → Memory | Artifacts, not applause. "Will this work?" |

**Full framework:** `docs/design-system/DRAMA.md`

---

## Workflow: How We Build

**Never build without approval.** Every slice follows this process:

### Step 1: Audit
I read the current implementation, map what exists, identify gaps.
*You receive:* Current state summary

### Step 2: Options (One at a Time)
For each decision point in the slice, I present:
- **The decision** (what needs to be chosen)
- **Option A** (recommended) — what it is, why it's right
- **Option B** — alternative approach
- **Option C** (if relevant) — different tradeoff
- **What failure looks like** for each

*You choose:* A, B, C, or "something else"

### Step 3: Spec
After all decisions are made, I write a complete spec:
- Exact changes
- Copy (word for word)
- Motion/timing
- Primitives to use

*You approve:* "Build it" or "Change X"

### Step 4: Build
Only after spec approval do I write code.

### Step 5: Review
You see the result. We iterate if needed.

---

### Decision Types Per Slice

| Type | Example | Options Format |
|------|---------|----------------|
| **Layout** | "How should the feed be structured?" | Wireframe descriptions |
| **Copy** | "What do we say when they claim a space?" | Exact word choices |
| **Motion** | "How does the claimed state reveal?" | Timing + effect descriptions |
| **Flow** | "Where do they go after onboarding?" | Route sequences |
| **State** | "What does empty look like?" | State descriptions |
| **Component** | "Card or list for spaces?" | Visual approaches |

### What I Won't Do Without Asking

- Choose layout structure
- Write copy
- Decide flow sequences
- Pick animation approaches
- Make architectural decisions
- Add features not in spec

### What I Will Do Autonomously

- Fix bugs in approved code
- Apply consistent spacing (4/8/12/16/24/32)
- Use correct design system tokens
- Follow established patterns
- Fix TypeScript errors

---

## Quality Bar

Before any page ships:

### Invariant Check
- [ ] **Witnessed:** Creates persistent memory, doesn't vanish into feed
- [ ] **Steward:** Ownership feels like responsibility, not playground
- [ ] **Action:** Asks for action, not identity
- [ ] **Memory:** Users ask "Will this work?" not "Will this look good?"

### Motion
- [ ] Premium easing (`MOTION.ease.premium`)
- [ ] Scroll-triggered reveals with proper viewport margins
- [ ] Parallax for depth (speeds 0.05-0.15)
- [ ] State transitions feel weighted, not instant

### Layout
- [ ] Generous spacing (py-32 between major sections)
- [ ] Clamp-based responsive typography
- [ ] Clear visual hierarchy
- [ ] Max-width containers for readability

### States
- [ ] Empty state with clear next action
- [ ] Loading state (structure, not spinner)
- [ ] Error state with recovery path
- [ ] Success state (confirmation, not celebration)
- [ ] Partial data state

### Interaction
- [ ] Hover feedback on all interactive elements
- [ ] Active states (button press feel)
- [ ] Disabled states (clear why)
- [ ] Optimistic updates where appropriate

### The Test
> "Would this page make an institution trust us with their students?"

---

## Platform Map (10 Slices, 60+ Routes)

### Slice 1: Entry & Auth
**Routes:** `/`, `/enter`, `/about`, `/schools`
**Drives:** Epic Meaning, Scarcity, Ownership
**Peak Moment:** "You're in."

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/` | Polish | Witnessed — show territory, not empty platform |
| `/enter` | Polish | Action — ask for email, not "tell us about yourself" |
| `/about` | Done | *(reference standard)* |
| `/schools` | Rebuild | Memory — show history ("847 students since Sept") |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 1.1 | Landing hero: inline email vs separate CTA | Layout | `[ ]` |
| 1.2 | Landing: what stats/proof to show | Copy | `[ ]` |
| 1.3 | Enter: single page vs multi-step states | Flow | `[ ]` |
| 1.4 | Enter: OTP input style (6 boxes vs single field) | Component | `[ ]` |
| 1.5 | "You're in" moment: copy + motion | Copy/Motion | `[ ]` |
| 1.6 | Schools: card layout vs list | Layout | `[ ]` |
| 1.7 | Schools: what data per campus | Copy | `[ ]` |

**Copy Rules:**
- Never: "Sign up", "Create account", "Get started"
- Always: "Enter", "You're in", "Welcome back"

---

### Slice 2: Onboarding
**Routes:** `/welcome`, `/welcome/identity`, `/welcome/territory`, `/welcome/claimed`
**Drives:** Ownership, Accomplishment, Epic Meaning
**Peak Moment:** "It's yours." (space claimed)

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/welcome` | Done | Witnessed — "We remember you" |
| `/welcome/identity` | Polish | Action — name + handle only, no bio |
| `/welcome/territory` | Polish | Steward — show weight of claiming |
| `/welcome/claimed` | Rebuild | Steward — seriousness, not confetti |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 2.1 | Welcome hero: copy + visual treatment | Copy/Layout | `[ ]` |
| 2.2 | Identity: what fields required vs optional | Flow | `[ ]` |
| 2.3 | Identity: handle input UX (suggestions, availability) | Component | `[ ]` |
| 2.4 | Territory: map visual vs list vs cards | Layout | `[ ]` |
| 2.5 | Territory: ghost space presentation | Component | `[ ]` |
| 2.6 | Claim flow: confirmation step or direct? | Flow | `[ ]` |
| 2.7 | Claimed: the reveal moment (copy + motion) | Copy/Motion | `[ ]` |
| 2.8 | Skip flow: what if they don't claim? | Flow | `[ ]` |

**Copy Rules:**
- Never: "Great job!", "You're crushing it!", "Congrats!"
- Always: "It's yours.", "Trusted to you.", "Your responsibility."

**Failure Modes:**
- RIGHT: Brief pause → "It's yours." in gold → weight of responsibility
- WRONG: Confetti → "Congrats! You unlocked your space!" → gamification energy

---

### Slice 3: Spaces
**Routes:** `/spaces`, `/spaces/new/*`, `/spaces/claim`, `/spaces/join/[code]`, `/s/[handle]`
**Drives:** Social Influence, Ownership, Creativity
**Peak Moment:** First entry to a space — "People are here"

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/spaces` | Polish | Memory — show history of each space |
| `/spaces/new` | Done | Steward — building, not launching |
| `/spaces/new/identity` | Done | Action — handle first, description optional |
| `/spaces/new/access` | Done | Steward — who can enter |
| `/spaces/new/launch` | Rebuild | Steward — "Your space exists." not "Space created!" |
| `/spaces/claim` | Done | Steward — verification = trust |
| `/spaces/join/[code]` | Done | Witnessed — "X people are here" |
| `/s/[handle]` | Polish | Memory — persistent chat, not ephemeral |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 3.1 | Space residence layout (split, tabs, panels) | Layout | `[ ]` |
| 3.2 | Chat: message grouping + timestamps | Component | `[ ]` |
| 3.3 | Chat: composer position + behavior | Component | `[ ]` |
| 3.4 | Presence: how to show "X online" | Component | `[ ]` |
| 3.5 | First message in empty space: copy + state | Copy/State | `[ ]` |
| 3.6 | Space header: what info, what hierarchy | Layout | `[ ]` |
| 3.7 | Member milestone (10, 50, 100): how to mark | Motion/Copy | `[ ]` |
| 3.8 | New launch celebration: copy + motion | Copy/Motion | `[ ]` |
| 3.9 | Join confirmation: inline vs modal | Component | `[ ]` |

**Copy Rules:**
- Never: "Admin", "Unlock", "Your playground"
- Always: "Steward", "Trusted", "Your responsibility"

**Infrastructure Needed:**
- [ ] Online presence system (Firebase RTDB)
- [ ] Typing indicators
- [ ] Milestone detection (10 members, 100 messages)

---

### Slice 4: Discovery
**Routes:** `/explore`, `/explore?tab=spaces`, `/explore?tab=people`, `/explore?tab=events`, `/explore?tab=tools`
**Drives:** Scarcity, Social Influence, Unpredictability
**Peak Moment:** Ghost space discovery — "14 waiting. Claim it."

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/explore` | Done | Memory — show what persists, not what trends |
| `/explore?tab=spaces` | Done | Witnessed — "400+ orgs, yours waiting" |
| `/explore?tab=people` | Done | Action — connection by shared context |
| `/explore?tab=events` | Done | Memory — "This happened. This is happening." |
| `/explore?tab=tools` | Done | Memory — tools that solved problems |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 4.1 | Explore hero: what headline + stats | Copy | `[ ]` |
| 4.2 | Search: ChatGPT-style vs traditional | Component | `[ ]` |
| 4.3 | Tab order: spaces first or events first? | Flow | `[ ]` |
| 4.4 | Ghost spaces: how prominent, what CTA | Component/Copy | `[ ]` |
| 4.5 | Space cards: what info to show | Layout | `[ ]` |
| 4.6 | People cards: what info, mutual context | Layout | `[ ]` |
| 4.7 | Empty search: what to show | State | `[ ]` |
| 4.8 | Join space from explore: inline or redirect | Flow | `[ ]` |

**Copy Rules:**
- Never: "Trending", "Popular", "Hot"
- Always: "Active", "Your campus", "Waiting for you"

---

### Slice 5: Feed
**Routes:** `/feed`, `/feed/settings`
**Drives:** Unpredictability, Social Influence, Epic Meaning
**Peak Moment:** "What's happening now" — life in motion

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/feed` | Rebuild | Memory — recap style, not infinite scroll |
| `/feed/settings` | Done | Steward — control what you see |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 5.1 | Feed structure: stream vs recap vs grouped | Layout | `[ ]` |
| 5.2 | Card types: what kinds of content, how styled | Component | `[ ]` |
| 5.3 | Empty feed (new user): what to show | State/Copy | `[ ]` |
| 5.4 | "Since you left" header: how to present | Copy/Layout | `[ ]` |
| 5.5 | Real-time: how new content appears | Motion | `[ ]` |
| 5.6 | Space grouping: collapsed vs expanded | Layout | `[ ]` |
| 5.7 | Filters: what options, where placed | Component | `[ ]` |

**Copy Rules:**
- Never: "You missed X", "Catch up", "Trending now"
- Always: "Here's what happened", "Your spaces", "Since you left"

**Structural Decision:**
Feed should feel like a **recap**, not a stream. Group by space, show what matters.

**Infrastructure Needed:**
- [ ] Real-time updates (SSE)
- [ ] Unread indicators per space
- [ ] Recap summarization

---

### Slice 6: HiveLab (Tools)
**Routes:** `/hivelab`, `/tools`, `/tools/new`, `/tools/templates`, `/tools/[toolId]/*`
**Drives:** Creativity, Accomplishment, Ownership
**Peak Moment:** "Your tool is live." — creation meets world

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/hivelab` | Polish | Action — "What do you want to make?" |
| `/tools` | Done | Memory — your creations persist |
| `/tools/new` | Done | Action — start building immediately |
| `/tools/templates` | Done | Action — templates as starting points |
| `/tools/[toolId]` | Done | Memory — tool as artifact |
| `/tools/[toolId]/edit` | Done | Witnessed — canvas that reflects |
| `/tools/[toolId]/deploy` | Rebuild | Steward — "Live. 47 members can use this." |
| `/tools/[toolId]/analytics` | Rebuild | Memory — "Here's what happened" not vanity metrics |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 6.1 | HiveLab landing: hero copy + CTA | Copy/Layout | `[ ]` |
| 6.2 | AI input: how it looks, what placeholder | Component/Copy | `[ ]` |
| 6.3 | AI generation: reveal animation | Motion | `[ ]` |
| 6.4 | Tool cards: what info, how styled | Component | `[ ]` |
| 6.5 | Deploy flow: confirm step or direct? | Flow | `[ ]` |
| 6.6 | Deploy success: copy + motion | Copy/Motion | `[ ]` |
| 6.7 | Analytics: what metrics, how presented | Layout/Copy | `[ ]` |
| 6.8 | First response notification: copy | Copy | `[ ]` |
| 6.9 | Empty tools state: what to show | State/Copy | `[ ]` |

**Copy Rules:**
- Never: "Amazing tool!", "You're a creator!"
- Always: "Live.", "47 responses.", "Here's what happened."

**Infrastructure Needed:**
- [ ] Real analytics (replace mock data)
- [ ] First-use notifications
- [ ] Usage milestones

---

### Slice 7: Events & Calendar
**Routes:** `/events`, `/events/[eventId]`, `/events/[eventId]/attendees`, `/calendar`
**Drives:** Social Influence, Scarcity, Accomplishment
**Peak Moment:** RSVP — "You're going"

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/events` | Done | Memory — "This happened. This is happening." |
| `/events/[eventId]` | Done | Witnessed — attendees visible |
| `/events/[eventId]/attendees` | Done | Memory — who was there |
| `/calendar` | Done | Memory — your time, mapped |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 7.1 | Events list: chronological vs grouped | Layout | `[ ]` |
| 7.2 | Event cards: what info, how compact | Component | `[ ]` |
| 7.3 | RSVP button: states + feedback | Component/Motion | `[ ]` |
| 7.4 | "X going" display: face piles or count | Component | `[ ]` |
| 7.5 | Event detail: hero layout | Layout | `[ ]` |
| 7.6 | Post-event recap: what to show | Layout/Copy | `[ ]` |
| 7.7 | Calendar: month vs week vs list default | Layout | `[ ]` |
| 7.8 | "Happening now" treatment | Component/Copy | `[ ]` |

**Copy Rules:**
- Never: "Don't miss out!", "Limited spots!"
- Always: "12 going", "Happens Tuesday", "Your schedule"

**Post-Event:**
- [ ] Recap screen: "Here's what happened."
- [ ] Factual summary: 12 attended, 3 new connections
- [ ] Never: "Great event! You're crushing it!"

---

### Slice 8: Profiles
**Routes:** `/profile`, `/profile/[id]`, `/profile/edit`, `/profile/connections`, `/u/[handle]`
**Drives:** Ownership, Creativity, Social Influence
**Peak Moment:** "This is you" — identity reflected

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/profile` | Done | Memory — what you've done, not who you claim to be |
| `/profile/[id]` | Done | Witnessed — mutual context |
| `/profile/edit` | Polish | Action — minimal required fields |
| `/profile/connections` | Done | Memory — shared history |
| `/u/[handle]` | Rebuild | Memory — actions over bio |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 8.1 | Profile layout: hero vs compact header | Layout | `[ ]` |
| 8.2 | What sections: spaces, creations, events attended | Layout | `[ ]` |
| 8.3 | Bio: where placed, how prominent | Layout/Copy | `[ ]` |
| 8.4 | Stats: what to show ("Since Sept", "X spaces") | Copy | `[ ]` |
| 8.5 | Mutual context: "X spaces in common" treatment | Component | `[ ]` |
| 8.6 | Edit: what fields required vs optional | Flow | `[ ]` |
| 8.7 | Avatar: upload UX, cropping | Component | `[ ]` |
| 8.8 | Public profile `/u/[handle]`: what visible to others | Layout | `[ ]` |

**Copy Rules:**
- Never: "Tell us about yourself", "Add a bio", "Complete your profile"
- Always: "Your spaces", "Your creations", "Since September"

**Structural Decision:**
Profiles show **what you've done**, not what you claim. Bio optional. Action record primary.

---

### Slice 9: Settings & Admin
**Routes:** `/settings`, `/notifications`, `/notifications/settings`
**Drives:** Ownership, Loss Avoidance (minimal)
**Peak Moment:** "You control this."

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/settings` | Done | Steward — your rules |
| `/notifications` | Done | Memory — not "you missed", but "here's what happened" |
| `/notifications/settings` | Done | Steward — your boundaries |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 9.1 | Settings layout: sections vs single page | Layout | `[ ]` |
| 9.2 | Notification center: list vs grouped by type | Layout | `[ ]` |
| 9.3 | Notification cards: what info, how compact | Component | `[ ]` |
| 9.4 | "Mark all read" behavior | Flow | `[ ]` |
| 9.5 | Dangerous actions (delete account): confirmation | Flow/Copy | `[ ]` |
| 9.6 | Privacy controls: what options | Layout | `[ ]` |
| 9.7 | Save confirmation: toast vs inline | Component | `[ ]` |

**Copy Rules:**
- Never: "You missed 5 messages", "Don't miss out"
- Always: "5 new messages", "Since yesterday", "Your preferences"

---

### Slice 10: Support & Legal
**Routes:** `/legal/terms`, `/legal/privacy`, `/legal/community-guidelines`, `/resources`, `/offline`
**Drives:** Epic Meaning (trust)

| Route | Status | Invariant Focus |
|-------|--------|-----------------|
| `/legal/terms` | Polish | Witnessed — plain language |
| `/legal/privacy` | Polish | Steward — "Your data, your control" |
| `/legal/community-guidelines` | Polish | Memory — examples of good/bad |
| `/resources` | Done | Action — what to do |
| `/offline` | Done | Memory — "We're still here" |

**Decisions to Make:**

| # | Decision | Type | Status |
|---|----------|------|--------|
| 10.1 | Legal page layout: sticky nav vs single scroll | Layout | `[ ]` |
| 10.2 | Terms: plain language summary at top? | Copy | `[ ]` |
| 10.3 | Privacy: data export link placement | Layout | `[ ]` |
| 10.4 | Guidelines: examples format (do/don't) | Copy/Layout | `[ ]` |
| 10.5 | Resources: categories vs search-first | Layout | `[ ]` |

---

---

## Decision Summary

**Total decisions across all slices: 72**

| Slice | Decisions | Priority |
|-------|-----------|----------|
| 1. Entry & Auth | 7 | P0 |
| 2. Onboarding | 8 | P0 |
| 3. Spaces | 9 | P0 |
| 4. Discovery | 8 | P1 |
| 5. Feed | 7 | P1 |
| 6. HiveLab | 9 | P1 |
| 7. Events | 8 | P2 |
| 8. Profiles | 8 | P2 |
| 9. Settings | 7 | P2 |
| 10. Support | 5 | P3 |

### How We Work

When starting a slice:

1. **I audit** — read current code, show you what exists
2. **You pick first decision** — or I recommend starting point
3. **I present options** — 2-3 choices with tradeoffs
4. **You decide** — A, B, C, or "show me something else"
5. **We move to next decision** — repeat until slice is specced
6. **I write full spec** — you approve
7. **I build** — only after approval
8. **You review** — we iterate

**No building without your explicit "Build it."**

---

## Implementation Phases

### Phase 1: Entry Flow (Critical Path)
**Routes:** `/`, `/enter`, `/welcome/*`
**Goal:** First 60 seconds set expectations for everything

- [ ] `/enter` — Action-first, no identity pressure
- [ ] `/welcome/claimed` — Steward energy, not celebration
- [ ] `/` landing — Epic Meaning + Memory (show what persists)

**Invariant Check:**
- Does entry ask for action or demand identity?
- Does claiming feel like responsibility or reward?

---

### Phase 2: Core Platform
**Routes:** `/s/[handle]`, `/feed`, `/explore`
**Goal:** Daily experience feels like home

- [ ] `/s/[handle]` — Space entry with arrival feeling
- [ ] `/feed` — Recap style, not infinite scroll
- [ ] `/explore` — Discovery of persistent communities

**Infrastructure:**
- [ ] Presence system
- [ ] Typing indicators
- [ ] Unread counts

---

### Phase 3: Creation & Events
**Routes:** `/hivelab`, `/tools/*`, `/events/*`
**Goal:** Making and gathering

- [ ] `/tools/[toolId]/deploy` — Steward moment, not celebration
- [ ] `/tools/[toolId]/analytics` — "Here's what happened"
- [ ] `/events/[eventId]` — Post-event recap

---

### Phase 4: Identity & Settings
**Routes:** `/profile/*`, `/u/[handle]`, `/settings/*`
**Goal:** Identity through action, not declaration

- [ ] `/profile` — Actions over bio
- [ ] `/u/[handle]` — Public view shows contribution
- [ ] `/notifications` — Recap, not guilt

---

### Phase 5: Polish Pass
**Goal:** Every page to /about standard

- [ ] Motion audit (all pages)
- [ ] State audit (empty, loading, error)
- [ ] Copy audit (against invariant rules)
- [ ] Spacing audit (4/8/12/16/24/32 scale)

---

## Routes Inventory (60 total)

### Entry & Auth (5)
- `/` — Landing
- `/enter` — Sign in/up
- `/about` — About HIVE
- `/schools` — Campus selection
- `/login` — Legacy redirect

### Onboarding (4)
- `/welcome` — You're in
- `/welcome/identity` — Name + handle
- `/welcome/territory` — Find your space
- `/welcome/claimed` — Celebration

### Spaces (8)
- `/spaces` — Territory overview
- `/spaces/new` — Template selection
- `/spaces/new/identity` — Name + handle
- `/spaces/new/access` — Privacy settings
- `/spaces/new/launch` — Celebration
- `/spaces/claim` — Claim institutional space
- `/spaces/join/[code]` — Join via invite
- `/s/[handle]` — Space residence

### Discovery (5)
- `/explore` — Unified discovery
- `/explore?tab=spaces` — Space discovery
- `/explore?tab=people` — People discovery
- `/explore?tab=events` — Event discovery
- `/explore?tab=tools` — Tool gallery

### Feed (2)
- `/feed` — Main dashboard
- `/feed/settings` — Feed preferences

### HiveLab (13)
- `/hivelab` — HiveLab landing
- `/tools` — Tool library
- `/tools/new` — Create tool
- `/tools/create` — Legacy create
- `/tools/templates` — Template gallery
- `/tools/[toolId]` — Tool view
- `/tools/[toolId]/edit` — Tool IDE
- `/tools/[toolId]/preview` — Preview mode
- `/tools/[toolId]/deploy` — Deploy modal
- `/tools/[toolId]/settings` — Tool settings
- `/tools/[toolId]/analytics` — Tool analytics
- `/tools/[toolId]/run` — Run tool
- `/tools/[toolId]/runs` — Execution history

### Events (4)
- `/events` — Campus events
- `/events/[eventId]` — Event detail
- `/events/[eventId]/attendees` — Attendee list
- `/calendar` — Personal calendar

### Profiles (7)
- `/profile` — Own profile
- `/profile/[id]` — View profile
- `/profile/edit` — Edit profile
- `/profile/connections` — Connections list
- `/profile/settings` — Profile settings
- `/profile/calendar` — Calendar settings
- `/u/[handle]` — Public profile

### Settings (3)
- `/settings` — Settings hub
- `/notifications` — Notification center
- `/notifications/settings` — Notification prefs

### Support (5)
- `/legal/terms` — Terms of service
- `/legal/privacy` — Privacy policy
- `/legal/community-guidelines` — Guidelines
- `/resources` — Help resources
- `/offline` — Offline fallback

### Admin (4)
- `/admin` — Admin dashboard
- `/admin/moderation` — Moderation queue
- `/admin/spaces` — Space approvals
- `/admin/users` — User management

---

## Infrastructure Gaps (P0)

| Feature | Slice | Status |
|---------|-------|--------|
| Online presence system | Spaces | Needs Firebase RTDB |
| Typing indicators | Spaces | Needs presence system |
| Real unread counts | Feed, Spaces | Needs `userBoardReads` collection |
| Tool analytics (real) | HiveLab | Replace mock data |
| Recap system | Feed | SSE + summarization |
| Post-event recaps | Events | New component |

---

## Design System Reference

### Motion Tokens
```typescript
transition={{ ease: MOTION.ease.premium }}
transition={{ duration: MOTION.duration.base }}
transition={{ delay: index * MOTION.stagger.base }}
```

### Layout Standards
```typescript
py-32  // Major sections
py-24  // Minor sections
py-16  // Compact sections
gap-4  // Internal spacing
```

### Key Primitives
```typescript
import {
  RevealSection,
  NarrativeReveal,
  AnimatedBorder,
  ParallaxText,
  Button,
  Card,
  Input,
  Avatar,
  Badge,
  Text,
} from '@hive/ui/design-system/primitives';
```

---

## Success Criteria

The platform is ready when:

- [ ] Every page meets /about quality bar
- [ ] Every page passes invariant check
- [ ] Entry completion rate >90%
- [ ] First space view <2 min
- [ ] All pages score >90 Lighthouse
- [ ] No celebration copy anywhere (confirm, don't applaud)
- [ ] No identity pressure anywhere (action, not bio)
- [ ] Dean walkthrough passes

---

## The Test

> "Could a burned student open this and exhale?"

They don't have to curate identity.
They don't have to maintain presence.
They don't have to compete for attention.

They can show up, act, and trust the system not to distort it.

That's the bar.

---

*This document supersedes all other TODOs. Every change must pass the invariant check.*
