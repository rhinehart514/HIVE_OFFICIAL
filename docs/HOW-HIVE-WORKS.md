# How HIVE Works

**Last updated:** March 4, 2026
**Status:** Single source of truth for Claude Code. Read this before writing any code.

---

## What HIVE Is

HIVE is a generative campus app where students create functional digital experiences (polls, brackets, RSVPs, custom apps) by typing a sentence. Creations deploy into community Spaces and reach members instantly via notifications and shareable links.

**One-liner:** "Say something. Your campus responds."

**Target:** University at Buffalo. 600+ Spaces pre-seeded. Goal: 50 weekly active creators within 2 weeks of launch.

**Stage:** Pre-launch. Built, not yet shipped.

---

## The Core Loop

```
CREATE ──> PLACE ──> SHARE ──> ENGAGE ──> SEE IMPACT ──> CREATE AGAIN
Build     Build→    Space/     Space      Profile        Build
/build    Space     Link       /s/[h]     /u/[h]         /build
          sheet     + push                               "My Apps"
```

Every feature must make one step faster, more reliable, or more obvious. If a feature doesn't touch this loop, question whether it's launch-critical.

**The 60-second test:** The entire loop from "I have an idea" to "my members are voting" must complete in under 60 seconds. System time is ~10s. The rest is user decision time.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm + Turborepo |
| App | Next.js 15 (App Router), React 19 |
| Styling | Tailwind CSS + design tokens (`@hive/tokens`) |
| Database | Firebase Firestore (documents) + RTDB (realtime state) |
| Auth | Firebase Auth (email code, `.edu` required) |
| Storage | Firebase Cloud Storage (avatars, banners, images) |
| AI | Groq `llama-3.3-70b-versatile` (classification + generation) |
| Deploy | Vercel (auto on push to main) |

### Monorepo Structure

```
apps/
  web/                    # Next.js app (the product)
  admin/                  # Admin dashboard
packages/
  core/                   # DDD domain layer (entities, aggregates, services)
  ui/                     # Shared React components
  tokens/                 # Design tokens (colors, typography, spacing)
  firebase/               # Firebase client initialization
  hooks/                  # Shared React hooks
  auth-logic/             # Auth utilities
  validation/             # Shared validation schemas
  config/                 # Shared config
```

### Key Guardrails

- `campusId` comes from server session ONLY (never from client)
- Every API route uses `withAuthAndErrors` wrapper
- No `undefined` in Firestore writes (use `?? null`)
- User-facing copy says "apps" not "tools"

---

## The Four Surfaces

### 1. Feed (`/discover`) — "What's happening?"

The campus pulse. Sectioned by time, never fully empty.

**Sections:**
- **Live Now** — Events happening or starting within 1 hour (red pulse badges)
- **Today's Events** — Time-sorted with inline RSVP
- **New Apps** — Recently created shell tools on campus
- **Your Spaces** — Activity from spaces user belongs to
- **Discover** — 650+ unjoined spaces, cursor-paginated

**Data sources:**
- Events: `GET /api/events/personalized`
- Spaces: `GET /api/spaces/browse-v2`
- Activity: `GET /api/activity/route`

**Cold start:** Pre-seeded spaces with CampusLabs event data + AI-generated creations ensure the feed is never empty on day one.

**Key file:** `apps/web/src/app/(shell)/discover/page.tsx`

### 2. Spaces (`/s/[handle]`) — "Where creation meets consumption"

Dedicated hub for a student org, dorm, Greek chapter, etc. This is where creations live and members engage.

**Layout:** Split panel on desktop (sidebar + main content), stacked on mobile.

**Tabs:**
| Tab | Content |
|-----|---------|
| Chat | Real-time messages with inline polls/RSVPs via slash commands |
| Events | Upcoming events (Today/Tomorrow/This Week) |
| Apps | Deployed tools in this space |
| Posts | Long-form announcements from leaders |

**Space lifecycle:**
```
UNCLAIMED (650+ pre-seeded from CampusLabs)
  → FRESHLY CLAIMED (leader claims, SparkleCreateSheet auto-opens)
  → ACTIVE (has content, recent activity)
  → LOW ACTIVITY (no activity >14 days)
```

**Key features:**
- Leaders create from within a space via SparkleCreateSheet or slash commands (`/poll "question?"`)
- When `?spaceId` is passed to Build, the space auto-selects for placement after creation
- Members interact with deployed apps directly in the Chat or Apps tab

**Key file:** `apps/web/src/app/s/[handle]/page.tsx`

### 3. Build (`/build`) — "Make something"

The creation engine. Prompt in, live app out.

**Build machine state flow:**
```
idle → classifying → shell-matched → complete
                  → generating → complete
```

**How classification works:**
1. User types prompt (e.g., "Best dining hall on campus")
2. `POST /api/tools/classify` sends to Groq (`llama-3.3-70b`, temperature 0.1)
3. Returns `{ format: 'poll'|'bracket'|'rsvp'|'custom', confidence: 0-1, config }`
4. If confidence > 0.5 for a native format → shell match (instant, editable config)
5. If custom → streaming code generation (~15s)

**Native shell formats (instant, ~500ms):**

| Shell | Config | Realtime State (RTDB) |
|-------|--------|----------------------|
| **Poll** | question, options[], multiSelect?, timer?, anonymous? | votes per user, voteCounts[], closed flag |
| **Bracket** | topic, entries[], roundDuration? | matchups[], currentRound, winner |
| **RSVP** | title, dateTime?, location?, capacity?, deadline? | attendees map, count |

**Post-creation flow:**
1. "Place in a Space" sheet opens (auto-selects if `?spaceId` present)
2. Placement creates deployment doc + notifies space members via push
3. Navigates to `/s/[handle]?tab=apps`

**Other sections on Build:**
- **My Apps** — Dashboard of user's created tools
- **Browse** — Trending campus apps by category

**Key files:**
- Build page: `apps/web/src/app/(shell)/build/page.tsx`
- Build machine hook: `apps/web/src/hooks/use-build-machine.ts`
- Classification API: `apps/web/src/app/api/tools/classify/route.ts`
- Generation API: `apps/web/src/app/api/tools/generate/route.ts`

### 4. Profile (`/u/[handle]`) — "Proof that building works"

The creator feedback loop. Shows that your creations had impact.

**Four zones:**
1. **Identity Hero** — Avatar, name, bio, academic info + "47 people participated in your creations"
2. **Builder Showcase** — Featured app (most engagement) + grid of secondary apps with per-app impact stats
3. **Campus Identity** — Spaces you belong to, interests
4. **Momentum** — Activity heatmap (365 days), connections

**Key metric:** Reach stat = total unique users who engaged with any of your apps.

**The loop closure:** Creator builds a poll → checks profile → sees "47 votes" → builds again.

**Key file:** `apps/web/src/app/(shell)/u/[handle]/ProfilePageContent.tsx`

---

## Data Model

### Firestore Collections

| Collection | Key Fields | Purpose |
|-----------|-----------|---------|
| `users/{userId}` | email, handle, displayName, photoURL, bio, campusId | Identity |
| `profiles/{userId}` | connections, badges, stats, interests | Enhanced profile |
| `spaces/{spaceId}` | name, handle, description, isClaimed, claimedBy, category, members | Space metadata |
| `spaces/{sid}/members/{uid}` | role (leader/moderator/member), joinedAt | Membership |
| `spaces/{sid}/tools/{deployId}` | toolId, config, visibility | Placed tools |
| `spaces/{sid}/chat/{msgId}` | content, author, createdAt, reactions | Chat messages |
| `spaces/{sid}/posts/{postId}` | content, author, createdAt | Long-form posts |
| `spaces/{sid}/events/{eventId}` | title, startDate, location, capacity, rsvpCount | Events |
| `tools/{toolId}` | name, description, ownerId, format, config, status | Tool documents |
| `tools/{tid}/versions/{vid}` | composition/code, createdAt, message | Version history |
| `feedItems/{id}` | type, source, spaceId, createdAt | Feed rankings |

### Firebase RTDB (Realtime)

```
shell_states/{shellId}/
  poll:     { votes: {userId: {optionIndex, votedAt}}, voteCounts: [], closed }
  bracket:  { matchups: [], currentRound, totalRounds, winner }
  rsvp:     { attendees: {userId: {displayName, rsvpAt}}, count }

presence/{userId}
  { online, lastSeen, spaceId }

typing_indicators/{spaceId}/{userId}
  timestamp
```

**Why two databases:** Firestore for documents (spaces, tools, users — read-heavy, complex queries). RTDB for live state (votes, presence, typing — high-frequency writes, realtime listeners).

---

## Auth Flow

1. User enters `.edu` email at `/enter`
2. Receives 6-digit code via email
3. Enters code + name (if new user)
4. Session created as `hive_session` cookie (httpOnly, secure)
5. Server validates session on every API call via `withAuthAndErrors`
6. `campusId` extracted from session server-side (never trusted from client)

---

## Navigation

**4-tab structure:**

| Tab | Label | Route | Match Pattern |
|-----|-------|-------|--------------|
| Home | Home | `/discover` | `/discover`, `/feed`, `/events` |
| Spaces | Spaces | `/discover` (dynamic) | `/s/` |
| Make | Make | `/build` | `/build` |
| You | You | `/me` | `/me`, `/profile`, `/u/` |

**Desktop:** Left sidebar (56px rail, expandable) with nav items + spaces quick-access list.
**Mobile:** Bottom tab bar with icons.

### Cross-Surface CTAs (Connective Tissue)

Every surface links to every other surface. No dead ends.

| From → To | Trigger | URL |
|-----------|---------|-----|
| Feed → Space | Tap event/space card | `/s/[handle]` |
| Feed → Build | "Make your own" in New Apps section | `/build` |
| Space → Build | SparkleCreateSheet, FAB, empty state | `/build?spaceId={id}` |
| Build → Space | Post-creation placement | `/s/[handle]?tab=apps` |
| Build → Profile | "View your apps" | `/me` |
| Profile → Build | Empty showcase CTA | `/build` |
| Profile → Space | Tap belonging space card | `/s/[handle]` |
| Space → Profile | Tap member/author name | `/u/[handle]` |

---

## Sharing & Virality

### The Viral URL: `/t/{toolId}`

The most important URL in HIVE. Public, no auth required to view.

1. Student creates poll → copies `/t/{toolId}` link
2. Pastes in GroupMe/iMessage
3. Friend opens → sees poll → votes (no HIVE account needed for viewing)
4. Sees "Made with HIVE" branding
5. Downloads app → creates own poll → loop continues

**OG meta tags:** Server-side metadata at `/api/og/tool/{toolId}` generates rich link previews for group chats.

### Notifications

| Trigger | Who Receives | Lands On |
|---------|-------------|----------|
| App placed in space | All space members | `/s/[handle]?app={toolId}` |
| Someone used your app | Tool creator | `/build/{toolId}` |
| Usage milestone (10, 25, 50, 100) | Tool creator | `/build/{toolId}` |
| New event in space | All space members | `/s/[handle]?tab=events` |
| Event starting soon (30min) | RSVP'd users | Event detail |
| Someone joined your space | Space leader | `/s/[handle]` |

Delivered via Firebase Cloud Messaging (push) + in-app notification list at `/me/notifications`.

---

## AI Integration

**Provider:** Groq (Vercel AI SDK `@ai-sdk/groq`)
**Model:** `llama-3.3-70b-versatile`

**Two AI touchpoints:**

1. **Classification** (`/api/tools/classify`) — Structured output with Zod schema. Determines if prompt maps to poll/bracket/rsvp/custom. Temperature 0.1, ~500ms.

2. **Generation** (`/api/tools/generate`) — Streaming NDJSON for custom app code. Falls back to rules-based element composition (Goose engine in `@hive/core`) if Groq unavailable.

**Rate limits:** 5 generations/day per authenticated user. 1/hour per IP for unauthenticated.

---

## Value Mechanisms

| Mechanism | Definition | How It Works |
|-----------|-----------|-------------|
| **Reach** | Creator's app gets to their people | Push notification on placement, feed visibility |
| **Engagement** | Members interact with apps | Poll votes, RSVP responses, bracket matchups |
| **Speed** | Idea to live app instantly | Shell classification in ~500ms, full creation <60s |
| **Aliveness** | Surfaces feel like people are here | Presence indicators, typing indicators, live event badges |
| **Loop Closure** | One action leads to the next | "Place in Space" CTA, profile impact stats, My Apps |

---

## Anti-Patterns (Never Do These)

- Build features that require >500 users to feel good (design for 50)
- Build consumption before creation (creators are the bottleneck)
- Create screens without outbound links to other surfaces (no dead ends)
- Use "tools" in user-facing copy (say "apps")
- Build features the returning-skeptic wouldn't notice on second visit
- Ship empty states without a clear next action
- Trust `campusId` from the client (always from server session)
- Write `undefined` to Firestore (use `?? null`)

---

## Launch Constraints

**What exists:** Full creation pipeline, 650+ pre-seeded spaces, 4 connected surfaces, auth, notifications, sharing.

**What's explicitly not being built this month:**
- DMs (chat is space-level only)
- Scaling infrastructure
- Analytics dashboards
- Following/followers (distribution is space-based)
- More than 3 shell formats (poll, bracket, RSVP)
- Cross-campus support (UB only)

---

## Key File Paths

### App Routes
- Shell layout: `apps/web/src/app/(shell)/layout.tsx`
- Feed: `apps/web/src/app/(shell)/discover/page.tsx`
- Build: `apps/web/src/app/(shell)/build/page.tsx`
- Space: `apps/web/src/app/s/[handle]/page.tsx`
- Profile: `apps/web/src/app/(shell)/u/[handle]/ProfilePageContent.tsx`
- Standalone tool: `apps/web/src/app/t/[toolId]/page.tsx`
- Auth entry: `apps/web/src/app/enter/page.tsx`

### Core Logic
- Build machine: `apps/web/src/hooks/use-build-machine.ts`
- Navigation: `apps/web/src/lib/navigation.ts`
- Middleware: `apps/web/src/middleware.ts`
- Shell types: `apps/web/src/lib/shells/types.ts`
- Shell registry: `apps/web/src/lib/shells/index.ts`

### API Routes (in `apps/web/src/app/api/`)
- Auth: `auth/send-code`, `auth/verify-code`, `auth/complete-entry`
- Tools: `tools/classify`, `tools/generate`, `tools/[toolId]/deploy`
- Spaces: `spaces/browse-v2`, `spaces/claim`, `spaces/join-v2`, `spaces/[spaceId]/*`
- Events: `events/personalized`, `events/[eventId]/rsvp`
- Profile: `profile/`, `profile/handle/[handle]`, `profile/tools`
- Feed: `feed/`, `feed/global`

### Domain Layer (`packages/core/src/domain/`)
- All entity definitions, aggregates, and domain services

### Components (`packages/ui/src/`)
- Shared UI components used across the app

---

## Documentation Map

After cleanup (March 4, 2026), here's what's current:

### Read These (Current)
| File | What It Covers |
|------|---------------|
| `docs/HOW-HIVE-WORKS.md` | This file. Complete system reference. |
| `docs/specs/surfaces/feed.md` | Feed surface spec |
| `docs/specs/surfaces/spaces.md` | Spaces surface spec |
| `docs/specs/surfaces/build.md` | Build/creation surface spec |
| `docs/specs/surfaces/profile.md` | Profile surface spec |
| `docs/specs/surfaces/connective-tissue.md` | Cross-surface CTAs, notifications, data flows |
| `docs/PRODUCT-STRATEGY.md` | Product thesis (locked Feb 22) |
| `docs/PERSPECTIVES.md` | 8 user personas for feature stress-testing |
| `product/value-props.md` | Value propositions by user segment |
| `product/workflows.md` | Core workflows with eval criteria |
| `product/rubrics/` | Workflow and value proxy rubrics |
| `docs/FIRESTORE_SCHEMA.md` | Firestore collection reference |
| `docs/API_ROUTES.md` | API route reference |
| `docs/architecture/` | Platform overview, API map, auth, permissions, realtime |
| `docs/design-system/DESIGN-2026.md` | Current design tokens and system |
| `docs/DESIGN_RULES.md` | Design anti-patterns and component rules |

### Ignore These (Archived)
Everything in `docs/archive/` is historical. Don't reference for building. Don't carry forward.

### Context Only (Not Spec)
- `docs/strategy/` — Product strategy evolution (6 docs, why decisions were made)
- `docs/research/` — User research and ideation (15 docs)
- `docs/ideation/` — Feature ideation (not final decisions)
