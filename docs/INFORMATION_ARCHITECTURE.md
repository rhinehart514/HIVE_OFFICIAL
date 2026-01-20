# Information Architecture: Initial Launch

> **Status:** LOCKED
> **Finalized:** January 2026
> **Sprint:** 10
> **Context:** Launch-specific IA with proto-feed evolving into full feed

---

## The Core Model

**Home is not static. Home evolves.**

```
Launch: Proto-Feed (Dashboard)
    ↓
Drop: Feed (Replaces proto-feed)
```

Same location. Same content types. Same mental model. Just better.

Users don't learn a new model. The page gets better. And we tell them it's coming.

---

## The Launch Reality

**What's ready:**
- Spaces: 96% complete
- HiveLab: 100% complete
- Events: Built within spaces
- Onboarding: 90% complete
- Discovery: 80% complete (400+ pre-seeded orgs)

**What's evolving:**
- Home: Proto-feed at launch → Full feed at drop
- Rituals: Feature-gated, seeded through anticipation

---

## The Mental Model

```
Campus (the universe)
  └── Home (what's happening)
        └── Your Spaces (where you live)
              └── Activity (chat, events, creations)
                    └── You (identity, connections)
```

**Home answers:** "What's happening? What's on my plate?"

**Spaces answer:** "Where do I belong? Where's my community?"

**HiveLab answers:** "What can I make? What have I built?"

---

## Navigation Architecture

### Desktop

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo/Home]              [Search ⌘K]               [Profile]│
├────────────┬────────────────────────────────────────────────┤
│            │                                                │
│  SPACES    │              MAIN CONTENT                      │
│  ────────  │                                                │
│  ★ Faves   │   (Home / Space / HiveLab / Browse / etc.)     │
│  ─────────│                                                │
│  Pre-Med   │                                                │
│  Photo     │                                                │
│  BSU       │                                                │
│            │                                                │
│  ─────────│                                                │
│  [Browse]  │                                                │
│            │                                                │
│  ─────────│                                                │
│  HIVELAB   │                                                │
│  [Create]  │                                                │
│  [My Stuff]│                                                │
│            │                                                │
└────────────┴────────────────────────────────────────────────┘
```

**Left rail has two sections:**
1. **Spaces** — Your communities + browse
2. **HiveLab** — Create + your creations

Both always visible. Both primary.

### Mobile

```
┌─────────────────────────────────────────┐
│ [Logo]         [Search]      [Profile]  │
├─────────────────────────────────────────┤
│                                         │
│           MAIN CONTENT                  │
│                                         │
├─────────────────────────────────────────┤
│ [Home] [Spaces] [+Create] [Lab] [Me]    │
└─────────────────────────────────────────┘
```

**Five tabs:**
- **Home:** Proto-feed (→ Feed when ready)
- **Spaces:** Your communities + browse
- **+Create:** Quick create
- **Lab:** Your creations, templates
- **Me:** Profile

---

## Home: The Proto-Feed

At launch, Home is a dashboard. Structured sections because we don't have feed density yet.

```
┌─────────────────────────────────────────────────────────────┐
│ What's Happening                                 [Search ⌘K]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TODAY                                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 Study Session at 7pm                             │   │
│  │    Pre-Med Society • You're going • 12 others       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💬 12 new messages in Pre-Med Society               │   │
│  │    Jump back in →                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  YOUR SPACES                                                │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                   │
│  │Pre-Med│ │ Photo │ │  BSU  │ │Browse │                   │
│  │ 🔴 12 │ │ 🔴 3  │ │   ·   │ │  +    │                   │
│  └───────┘ └───────┘ └───────┘ └───────┘                   │
│                                                             │
│  THIS WEEK                                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📸 Photography Walk • Sat 2pm • 18 going            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎤 Guest Speaker • Fri 5pm • Trending               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  YOUR CREATIONS                                             │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                   │
│  │ Poll  │ │Signup │ │ RSVP  │ │Create │                   │
│  │ 47 ↑5 │ │ 23 ↑2 │ │ 12    │ │  +    │                   │
│  └───────┘ └───────┘ └───────┘ └───────┘                   │
│                                                             │
│  DISCOVER                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✨ Hiking Club just launched • 12 members           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  🔮 This page is evolving.                            ║ │
│  ║                                                       ║ │
│  ║  Soon: A feed of everything happening across your     ║ │
│  ║  spaces. Activity. Events. What friends are doing.    ║ │
│  ║  All in one stream.                                   ║ │
│  ║                                                       ║ │
│  ║  You'll know when it drops.                           ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Proto-Feed Sections

| Section | Content | Purpose |
|---------|---------|---------|
| **Today** | Events today + unread activity | Immediate relevance |
| **Your Spaces** | Navigation tiles with activity | Quick jump + life signals |
| **This Week** | Upcoming events | Anticipation |
| **Your Creations** | HiveLab stuff + response counts | Personal investment |
| **Discover** | 1-2 items (new spaces, trending) | Light discovery |
| **Evolving Box** | Anticipation for feed | Sets expectation |

### The Anticipation Box

The bottom section explicitly says:
1. This page is temporary
2. Something better is coming
3. It will replace this
4. You'll know when it drops

**This is Rituals philosophy in IA.** The platform tells you what's coming.

---

## Home: When Feed Drops

Same location. Same URL. Evolved experience.

```
┌─────────────────────────────────────────────────────────────┐
│ What's Happening                                 [Search ⌘K]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📅 Study Session • Starting in 2 hours              │   │
│  │    Pre-Med Society • You're going • 14 going        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💬 Sarah posted in Pre-Med Society                  │   │
│  │    "Anyone want to study together before the..."    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📊 Your poll is getting responses                   │   │
│  │    "Best study spot?" • 52 responses (+5 today)     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔥 Trending: Photography Walk                       │   │
│  │    Saturday 2pm • 34 going • 3 friends going        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 👋 Jake joined BSU                                  │   │
│  │    You're both in Pre-Med Society                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✨ New space: Hiking Club                           │   │
│  │    Matches your interests • 18 members              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Load more]                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### The Continuity

| Proto-Feed Section | Becomes in Feed |
|-------------------|-----------------|
| Today (events) | Event cards in stream |
| Unread messages | Activity cards |
| This Week (events) | Event cards |
| Your Creations | Creation activity cards |
| Discover | Discovery cards interleaved |

**Same content types. Interleaved. Scrollable. Alive.**

### The Drop Announcement

When feed goes live, first-time modal:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🎉 Feed just dropped.                                      │
│                                                             │
│  Everything happening across your spaces. Events coming     │
│  up. What friends are doing. Your creations getting         │
│  traction. All in one stream.                               │
│                                                             │
│  This is what you've been waiting for.                      │
│                                                             │
│  [Explore your feed]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Entry Point Flows

### Flow 1: Space Invite Link

```
hive.app/join/[code]
  → Space preview (public: name, description, members)
    → "Join" prominent
      → If not logged in: Quick signup
        → Join space
          → Land in space chat
```

### Flow 2: Event Link

```
hive.app/e/[code]
  → Event detail (public: info, attendees, RSVP)
    → RSVP clicked
      → If not logged in: Quick signup
        → RSVP confirmed
          → "This event is from [Space]. Join?"
            → Land in space or stay on event
```

### Flow 3: Creation Link

```
hive.app/c/[shortcode]
  → Creation view (works without login)
    → User responds
      → "Made with HIVE" + "Create your own"
        → Optional signup → HiveLab
```

### Flow 4: Cold Landing

```
hive.app
  → Landing page
    → Sign up (email → OTP)
      → Campus + interests
        → Recommended spaces
          → Join at least one
            → Land on Home (proto-feed)
```

### Flow 5: Return Visit

```
Open app
  → Land on Home (proto-feed / feed)
  → Left rail shows spaces and HiveLab
```

---

## Space Navigation

### Tabs

```
[Chat] [Events] [Creations] [Members] [Settings*]

* Settings for leaders only
```

**Chat is default.** Enter space → land in chat.

### Chat View

- Messages with avatars
- Typing indicators
- Reactions
- Timestamps grouped by day
- Composer at bottom

### Events View

- **This Week** (temporal)
- **Upcoming** (future)
- **Past** (archive)
- Create button for leaders

### Creations View

- Active creations with response counts
- Add to Space button

### Members View

- Leaders section
- Members section
- Invite button

---

## HiveLab

### Entry

```
┌─────────────────────────────────────────────────────────────┐
│ HiveLab                                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │    What do you want to make?                        │   │
│  │    ____________________________________________     │   │
│  │                                                     │   │
│  │    [Start with AI]  [Browse Templates]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  YOUR CREATIONS                                             │
│  ┌───────┐ ┌───────┐ ┌───────┐                             │
│  │ Poll  │ │ Form  │ │ RSVP  │                             │
│  │ 47    │ │ 23    │ │ 12    │                             │
│  └───────┘ └───────┘ └───────┘                             │
│                                                             │
│  TEMPLATES                                                  │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐                   │
│  │Signup │ │ Poll  │ │ RSVP  │ │Tracker│                   │
│  └───────┘ └───────┘ └───────┘ └───────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**AI input primary.** Your creations visible. Templates available.

---

## Browse (Discovery)

```
┌─────────────────────────────────────────────────────────────┐
│ Browse Spaces                                    [Search]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RECOMMENDED FOR YOU                                        │
│  Based on your interests                                    │
│  [Space] [Space] [Space] [Space]                           │
│                                                             │
│  POPULAR AT UB                                              │
│  [Space] [Space] [Space] [Space]                           │
│                                                             │
│  CATEGORIES                                                 │
│  [Academic] [Social] [Professional] [Cultural] [Sports]    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Search (Cmd+K)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search HIVE...                                      [⌘K] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  RECENT                                                     │
│  → Pre-Med Society (space)                                  │
│  → Study Session Tomorrow (event)                           │
│  → Sarah Chen (person)                                      │
│                                                             │
│  SPACES                                                     │
│  → Photography Club                                         │
│                                                             │
│  EVENTS                                                     │
│  → Photography Walk Saturday                                │
│                                                             │
│  PEOPLE                                                     │
│  → Sarah Chen (in 3 spaces with you)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Requirements:**
- < 200ms response
- Fuzzy matching
- Grouped by type
- Keyboard navigable
- Recent first

---

## Empty States

### Empty Home (No Spaces)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              🌱 Find Your People                            │
│                                                             │
│    HIVE is where your campus communities live.              │
│    Join a few spaces to get started.                        │
│                                                             │
│    [Browse Spaces]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Empty Space

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    👋 It's quiet here                       │
│                                                             │
│    [Invite Members]  [Create First Event]                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### No Events This Week

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│              📅 Nothing scheduled yet                       │
│                                                             │
│    [Create an Event]  [Browse Campus Events]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Context Persistence

| Context | Storage | Behavior |
|---------|---------|----------|
| Scroll position per space | LocalStorage | Resume exact position |
| Active tab per space | LocalStorage | Return to same tab |
| Draft messages | LocalStorage | Preserved until sent |
| Search history | LocalStorage | Recent searches shown |
| Unread indicators | Firestore | Sync across devices |

---

## URL Structure

```
/                           → Home (proto-feed / feed)
/browse                     → Browse spaces
/spaces/[id]                → Space (→ /spaces/[id]/chat)
/spaces/[id]/chat           → Space chat
/spaces/[id]/events         → Space events
/spaces/[id]/creations      → Space creations
/spaces/[id]/members        → Space members
/spaces/[id]/settings       → Space settings (leader)

/events                     → Campus events calendar
/events/[id]                → Event detail

/create                     → HiveLab
/create/[id]                → Edit creation

/profile                    → Your profile
/u/[username]               → Someone's profile
/settings                   → Account settings

/join/[code]                → Space invite
/e/[code]                   → Event share
/c/[shortcode]              → Creation share
```

---

## Mobile Specifics

### Bottom Tab Bar

```
[Home] [Spaces] [+] [Lab] [Me]
```

### Gestures

- Swipe right: Back
- Pull down: Refresh
- Long press on space: Quick actions
- Swipe on message: React, reply

### Deep Links

- `hive.app/join/[code]` → App → Space preview
- `hive.app/e/[code]` → App → Event detail
- `hive.app/c/[code]` → Browser (no app required)

---

## Rituals Anticipation (Seeded)

Throughout the product, subtle hints:

- "You're a founding member. That'll mean something soon."
- "Your creations have been used 47 times. We're keeping track."
- "This space is growing fast. History is being made."

**These are promises.** They seed anticipation for when Rituals activates.

---

## The Principles

### 1. Home Evolves
Proto-feed → Feed. Same location. Better experience. Users are told it's coming.

### 2. Spaces and HiveLab Are Co-Anchors
Left rail shows both. Both always visible. Both primary.

### 3. Entry Routes By Intent
Event link → event. Space link → space. Cold → home.

### 4. Empty States Guide Forward
Every empty state has a clear next action.

### 5. Search Rescues
Cmd+K finds everything fast.

### 6. Anticipation Is Built In
The evolving box. The Rituals hints. The platform tells you what's coming.

---

## Launch IA Summary

```
HIVE at Launch
├── Home = Proto-Feed
│   ├── Today (events + activity)
│   ├── Your Spaces (navigation tiles)
│   ├── This Week (upcoming events)
│   ├── Your Creations (HiveLab)
│   ├── Discover (1-2 items)
│   └── "This page is evolving" box
│
├── Left Rail
│   ├── Spaces (communities)
│   └── HiveLab (create + creations)
│
├── Spaces = Chat + Events + Creations + Members
├── HiveLab = AI Create + Templates + My Creations
├── Browse = Discover spaces
├── Profile = Identity + connections
└── Search = Cmd+K

─────────────────────────────────────────────

HIVE at Feed Drop
├── Home = Feed (replaces proto-feed)
│   └── Interleaved activity stream
└── Everything else unchanged
```

---

## The Feeling

**At launch:**
- Oriented: I know where things are
- Connected: I see my spaces and what's happening
- Anticipated: Something better is coming

**At feed drop:**
- Alive: Everything is in one stream
- Discovered: I'm finding things I didn't know about
- Complete: This is what it was building toward

---

*Home evolves. That's the architecture. That's the anticipation.*
