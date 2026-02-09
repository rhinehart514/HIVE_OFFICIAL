# HIVE — Product Spec

> Students build the infrastructure their campus doesn't have.
> The ed tech cycle is too slow. HIVE lets students build it themselves.

---

## What HIVE Is

HIVE is a campus operating system built by students. Not a social network. Not a chat app. An OS.

The core primitives are **Spaces** and **Tools**. Everything else is built from these two things.

---

## The Two Primitives

### Spaces

A Space is a persistent place for a group. It could be:
- A club (CompSci Club)
- A dorm floor (Governors 7th Floor)
- A class section (CSE 442 Spring '26)
- A friend group (The House)
- A campus org (Student Association)
- A project team (Hackathon Team 12)

A Space has:
- **Chat** — the primary interface. This is where people talk.
- **Tools** — built inline via slash commands in chat, or in the Lab. Tools live inside messages.
- **Members** — people who've joined.
- **Settings** — name, handle, description, who can join.

A Space does NOT have:
- A feed
- Posts
- A "board" separate from chat
- Tabs (chat IS the space)
- Follower counts
- Activity scores

### Tools

A Tool is a lightweight interactive thing. Built in seconds. Shared anywhere.

Current tool types:
- **Poll** — vote on options, see results live
- **Signup Sheet** — limited slots, sign up / remove yourself
- **Countdown** — timer to an event
- **RSVP** — going / maybe / not going

Tools can exist in two places:
1. **Inside a Space** — created via `/poll`, `/signup`, `/countdown`, `/rsvp` in chat. The tool renders inline in the message stream.
2. **Standalone** — accessible at `/t/[toolId]`. Shareable link. No account required to interact. This is the growth engine.

A Tool has:
- A creator (the person who made it)
- Live state (votes, signups, etc.)
- A shareable URL
- Usage count

A Tool does NOT have:
- Comments
- Likes
- A social layer
- Analytics dashboards

### How They Connect

Chat is the glue. You're in a Space, you're chatting, someone types `/poll "Best day for practice?" Mon Tue Wed` → a poll appears inline in the chat. People vote. The tool is alive inside the conversation.

That same poll has a standalone URL. Someone copies it, drops it in GroupMe. People outside HIVE can vote. They see HIVE branding. Some sign up. Growth loop.

---

## Campus Mode

When campus data exists for a user's school, an additional layer activates:

### Discover (`/discover`)
The campus dashboard. What's happening right now:
- **Dining** — what's open, what's closing soon (campus data)
- **Events** — what's happening today/tonight (campus data + space events)
- **Spaces** — active spaces at this campus
- **Tools** — trending tools (most votes, most signups)

Discover is NOT:
- A feed
- A social timeline
- A recommendation engine

It's a dashboard. Information-dense. Utility-first.

### Campus Data Sources
- Dining hours and locations
- Building info (study spots, hours)
- Campus events calendar

This data is seeded per campus. UB is first. Adding a campus = adding its data layer. The core product (spaces + tools) works without any campus data.

---

## Non-Campus Mode

If no campus data exists (or user isn't at a supported campus), the app is:
- **Spaces** — your spaces list
- **Create** — build tools
- **You** — your profile

No Discover page (nothing to discover without campus data). The product still works — it's just spaces + tools without the campus layer.

---

## Navigation

### Campus Mode
- **Discover** — campus dashboard
- **Spaces** — your spaces list
- **You** — profile + settings
- **Create** (FAB/button) — build a tool or create a space

### Non-Campus Mode
- **Spaces** — your spaces list
- **Create** — build a tool or create a space
- **You** — profile + settings

---

## User Journey

### Entry
1. Email → verification code → first + last name → done.
2. Handle auto-generated from name.
3. No year, major, interests, role selection. None.

### First Open (Campus Mode)
User lands on Discover. They see what's happening at their campus. Dining, events, active spaces. They tap a space, join, start chatting.

### First Open (Non-Campus Mode)
User lands on Spaces. It's empty. They either:
- Create a space (for their club, group, class)
- Join a space via invite link someone shared

### The Loop
1. Person creates a space → invites people
2. People chat → someone creates a tool in chat
3. Tool gets shared outside HIVE (GroupMe, text, etc.)
4. New people interact with tool → some sign up
5. They join spaces → create more tools → share more links

---

## Surfaces (exhaustive list)

| Surface | Route | Purpose |
|---------|-------|---------|
| Landing | `/` | Convert visitors. One screen. |
| Entry | `/enter` | Email → code → name → in. |
| Discover | `/discover` | Campus dashboard (campus mode only) |
| Spaces Hub | `/spaces` | List of your spaces |
| Space | `/s/[handle]` | Chat + inline tools |
| Lab | `/lab` | Build tools (IDE-like) |
| Standalone Tool | `/t/[toolId]` | Shared tool link, no auth required |
| Profile | `/u/[handle]` | Name, spaces, tools built |
| Me | `/me` | Your own profile + settings |
| About | `/about` | The story |

### What's NOT a surface anymore:
- `/feed` — no feed. Redirects to Discover or Spaces.
- `/home` — no home. Redirects to Discover or Spaces.
- `/explore` — merged into Discover.
- `/notifications` — TBD. Not a priority for launch.
- `/calendar` — not a surface. Events show in Discover + Space.
- `/leaders` — no leaderboards.
- `/connections`, `/friends` — no social graph.
- `/rituals` — dead.
- `/resources` — dead.

---

## Profile

A profile shows:
- Name + handle
- Avatar (optional)
- Spaces they're in
- Tools they've built (with usage counts)

That's it. No bio, no year, no major, no interests, no follower count, no activity score. The profile IS their contribution — what spaces they're in and what they've built.

Year/major/bio can be optional fields added later via progressive profiling. Not at launch.

---

## What HIVE Is NOT

- **Not a social network.** No feed, no posts, no likes, no followers, no DMs (for now).
- **Not a messaging app.** Chat exists inside Spaces as the interface for tools + coordination. It's not the product — it's the surface.
- **Not another ed-tech tool.** There's no LMS, no gradebook, no assignments. Students build what they need.
- **Not a platform for universities.** Universities don't buy HIVE. Students use HIVE. The institution is irrelevant.

---

## What Exists in Codebase That Shouldn't

Based on API routes and pages that exist but don't fit this spec:

- `/api/rituals` — dead concept
- `/api/friends`, `/api/connections` — no social graph
- `/api/social/*` — no social layer
- `/api/dm/*` — no DMs at launch
- `/api/feed/*` — no feed
- `/api/posts/*` — no posts
- `/api/activity-feed` — no activity feed
- `/api/waitlist/*` — reconsider for launch
- `/api/placements/*` — unclear purpose
- `/api/onboarding/*` — entry flow replaces this
- `/api/comments/*` — no comments
- `/api/privacy/ghost-mode` — overengineered for launch

This dead code should be flagged but not necessarily deleted yet — it's not hurting anything if it's not routed to.

---

*This is the source of truth for what HIVE is. Every design decision, every feature question, every "should we add X" gets checked against this document.*
