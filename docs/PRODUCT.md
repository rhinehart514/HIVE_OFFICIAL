# HIVE — Product Spec

> Students build the infrastructure their campus doesn't have.
> The ed tech cycle is too slow. HIVE lets students build it themselves.

---

> ⚠️ **IMPLEMENTATION NOTE — Feb 22 2026**
> This doc describes the product vision. The built codebase diverges in these specific ways:
>
> - **Spaces have tabs (posts, events, tools)** — not chat-only as described below. `space-posts-tab.tsx`, `space-events-tab.tsx` exist and are wired.
> - **Onboarding has 5 screens including interests** — not "email → code → name → done". Interests selection + space recommendations are live.
> - **Discover is a personalized event feed** — not a campus dashboard. Scoring engine is real. Dining data not yet wired. Events feed is the primary surface.
> - **Non-campus mode is current reality** — `campuses` collection is empty (0 docs), so `useCampusMode()` returns false for all users. The app runs in this mode today. Discover still shows events.
>
> Use `docs/KNOWN_STATE.md` for what actually exists. Use this doc for product intent.

---

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
The campus feed. Events + space activity + tools, personalized by relevance.

Reality (Feb 22 2026): a ranked events feed is the primary surface. A personalized scoring engine ranks events by interest match, friend attendance, space membership, and time proximity. Dining data not yet wired. Three card types: EventCard, SpaceCard, ToolCard.

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

**Current (Feb 22 2026) — 4-tab layout:**
- **Feed** (`/discover`) — personalized campus stream
- **Spaces** (`/spaces`) — browse + your communities
- **Lab** (`/lab`) — creation engine (conversation-first)
- **Profile** (`/me`) — identity, tools portfolio

Events are NOT a nav tab. They are content inside Feed. See `docs/LAUNCH-IA.md` → Locked Decisions.

---

## User Journey

### Entry
5-screen onboarding (built Feb 13 2026): email → OTP verify → name → interests selection → space recommendations.
Handle auto-generated from name. Interests feed the personalization scoring engine.

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

### What's NOT a nav tab at launch:
- `/events` — Events are Feed content, not a destination. `/events` page exists but not in nav.
- `/notifications` — Page exists but not a nav tab.
- `/calendar` — "Coming soon" placeholder in settings.
- `/leaders` — dead.
- `/rituals` — dead.
- `/resources` — dead.

### Still live (routes exist + are functional):
- `/me/connections` — social graph IS built and on (`enable_connections` flag is live).
- `/notifications` — notification infrastructure exists, page accessible at `/notifications`.

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

- **Not a posts-first social network.** The feed is events, not status updates. Creation (tools, events, signups) is the content — not text posts. Zero posts in production today.
- **Not a messaging app.** Chat exists inside Spaces as the coordination surface. The product is the tools and the community, not the chat.
- **Not another ed-tech tool.** No LMS, no gradebook, no assignments. Students build what they need.
- **Not a platform for universities.** Universities don't buy HIVE. Students use HIVE. The institution is irrelevant.

> **Clarification (Feb 22 2026):** A social graph IS built (connections collection, `enable_connections` flag is ON). A personalized feed IS built (scoring engine ranking events by interest + social signals). A 5-screen onboarding with interests collection IS built. These were "future" in earlier docs — they exist now.

---

## What Exists in Codebase That Is Dead / Deferred

- `/api/rituals` — dead concept, stub routes
- `/api/dm/*` — DMs built but behind `enable_dms` flag (intentionally off at launch)
- `/api/posts/*` — posts infrastructure exists, 0 posts in production
- `/api/activity-feed` — wired but hollow (only member joins write to it)

> **Was on this list, now real:** `/api/connections`, `/api/social/*` — social graph IS live. `/api/feed/*` — events feed IS live.
- `/api/waitlist/*` — reconsider for launch
- `/api/placements/*` — unclear purpose
- `/api/onboarding/*` — entry flow replaces this
- `/api/comments/*` — no comments
- `/api/privacy/ghost-mode` — overengineered for launch

This dead code should be flagged but not necessarily deleted yet — it's not hurting anything if it's not routed to.

---

*This is the source of truth for what HIVE is. Every design decision, every feature question, every "should we add X" gets checked against this document.*
