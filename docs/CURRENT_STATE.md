# HIVE Platform — Current State by Vertical Slice

**Last Updated:** January 21, 2026

---

## Overview

HIVE is student autonomy infrastructure for the AI era. This document is the single source of truth for what exists, what works, and what's connected.

**60 routes | 275+ API endpoints | 224 components | 10 domain contexts**

---

## Slice 1: Entry & Auth

**Purpose:** Get students in. Fast. No friction.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/` | Done | Landing page with access gate |
| `/enter` | Done | Unified sign-in/sign-up |
| `/about` | Done | About HIVE (target aesthetic) |
| `/schools` | Done | Campus selection |
| `/login` | Done | Legacy redirect |

### APIs
- `POST /api/auth/request-otp` — Email OTP request
- `POST /api/auth/verify-otp` — OTP verification
- `GET /api/profile` — Current user profile
- `POST /api/users/search` — User lookup

### Key Components
- `AuthShell` — Auth layout (vertical variant)
- `EmailInput` — Domain-restricted email input
- `OTPInput` — 6-digit code entry

### Data Flow
```
Landing (/) → Enter (/enter) → OTP → Profile check
                                    ↓
                           New user → /welcome
                           Existing → /feed
```

### Status: **95% Complete**
- [x] OTP authentication
- [x] Campus email validation
- [x] Profile creation
- [ ] Social auth (Google, Apple) — flagged off

---

## Slice 2: Onboarding

**Purpose:** First 60 seconds. Create ownership and anticipation.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/welcome` | Done | "You're in" hero |
| `/welcome/identity` | Done | Avatar + display name |
| `/welcome/territory` | Done | Find your space (real API) |
| `/welcome/claimed` | Done | Celebration |

### APIs
- `PUT /api/profile` — Update profile
- `GET /api/spaces/browse-v2` — Space discovery
- `POST /api/spaces/join-v2` — Join space

### Key Components
- `WelcomeShell` — Onboarding layout
- `TerritoryMap` — Visual space discovery
- `WelcomeHeading`, `WelcomeAction` — Styled primitives

### Data Flow
```
/welcome → /welcome/identity → /welcome/territory → /welcome/claimed → /feed
              (profile API)      (spaces API)         (celebration)
```

### Status: **100% Complete** (Jan 21, 2026)
- [x] Profile update connected to API
- [x] Space discovery from real data
- [x] Join space functional
- [x] Skip flows work

---

## Slice 3: Feed

**Purpose:** The pulse. What's happening on campus.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/feed` | Done | Main dashboard |
| `/feed/settings` | Done | Feed preferences |

### APIs
- `GET /api/feed` — Personalized feed
- `GET /api/events` — Upcoming events
- `GET /api/spaces/my-spaces` — User's spaces

### Key Components
- `FeedCard` — Content card
- `EventPreview` — Compact event display
- `SpaceQuickAccess` — Space shortcuts

### Status: **85% Complete**
- [x] Feed layout
- [x] Event integration
- [ ] Real-time updates (SSE planned)
- [ ] Unread indicators per space

---

## Slice 4: Discovery (/explore)

**Purpose:** Find where you belong. Search-first.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/explore` | Done | Unified discovery hub |
| `/explore?tab=spaces` | Done | Space discovery |
| `/explore?tab=people` | Done | People discovery |
| `/explore?tab=events` | Done | Event discovery |
| `/explore?tab=tools` | Done | Tool gallery |
| `/people` | Redirect | → `/explore?tab=people` |
| `/events` | Done | Event list (standalone) |

### APIs
- `GET /api/spaces/browse-v2` — Spaces with search
- `POST /api/users/search` — People search
- `GET /api/events` — Campus events
- `GET /api/tools/browse` — Tool gallery

### Key Components
- `ExploreSearch` — ChatGPT-style search bar
- `TabNav` — Horizontal tabs
- `SpaceGrid`, `SpaceCard` — Space cards
- `GhostSpaceCard` — Unclaimed spaces
- `PeopleGrid`, `PersonCard` — People cards
- `EventList`, `EventCard` — Event cards
- `ToolGallery`, `ToolCard` — Tool cards

### Data Flow
```
/explore → Search/Filter → API call → Transform to UI types
              ↓
         Tab selection updates URL (?tab=X&q=Y)
```

### Status: **100% Complete** (Jan 21, 2026)
- [x] All tabs connected to real APIs
- [x] Search works across all tabs
- [x] Ghost spaces visible with "Claim" CTA
- [x] URL state synced

---

## Slice 5: Spaces

**Purpose:** Where communities live. Discord-quality, campus-native.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/spaces` | Done | Territory overview |
| `/spaces/new` | Done | Builder: template selection |
| `/spaces/new/identity` | Done | Builder: name + handle |
| `/spaces/new/access` | Done | Builder: privacy settings |
| `/spaces/new/launch` | Done | Builder: celebration |
| `/spaces/claim` | Done | Claim institutional space |
| `/spaces/join/[code]` | Done | Join via invite code |
| `/spaces/create` | Redirect | → `/spaces/new` |
| `/s/[handle]` | Done | Space residence |

### APIs
- `GET /api/spaces/browse-v2` — Browse spaces
- `POST /api/spaces` — Create space
- `GET /api/spaces/[spaceId]` — Space details
- `GET /api/spaces/[spaceId]/boards` — Space boards
- `GET /api/spaces/[spaceId]/members` — Members list
- `POST /api/spaces/[spaceId]/chat` — Send message
- `GET /api/spaces/[spaceId]/chat` — Get messages
- `POST /api/spaces/[spaceId]/chat/read` — Mark as read
- `POST /api/spaces/join-v2` — Join space
- `POST /api/spaces/leave` — Leave space
- `GET /api/spaces/resolve-slug/[handle]` — Handle → ID

### Key Components
- `SpaceShell` — Space layout (60/40 split)
- `SpaceHeader` — Name, handle, online count
- `BoardTabs` — Channel navigation
- `ChatBoard` — Message list + input
- `SpacePanel` — Sidebar (events, members, tools)

### Key Hook
- `useSpaceResidenceState` — All space state management

### Data Flow
```
/s/[handle] → resolve-slug → spaceId → load space + boards + messages
                                         ↓
                                    Subscribe to SSE for real-time
                                         ↓
                                    Mark messages read on view
```

### Status: **95% Complete**
- [x] Real-time chat (SSE)
- [x] Board system
- [x] Member management
- [x] Read receipts (mark as read)
- [x] Join/leave functional
- [x] Space builder flow
- [ ] Typing indicators (needs presence system)
- [ ] Online presence counts (Firebase RTDB planned)

---

## Slice 6: Events & Calendar

**Purpose:** Coordination. When things happen.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/events` | Done | Campus events list |
| `/events/[eventId]` | Done | Event detail |
| `/events/[eventId]/attendees` | Done | Attendee list |
| `/calendar` | Done | Personal calendar |
| `/profile/calendar` | Done | Calendar settings |

### APIs
- `GET /api/events` — Events with filters
- `GET /api/events/[eventId]` — Event details
- `POST /api/events/[eventId]/rsvp` — RSVP
- `GET /api/profile/calendar/events` — User's events

### Key Components
- `EventCard` — Event preview
- `EventDetail` — Full event page
- `RSVPButton` — One-click RSVP
- `CalendarGrid` — Month/week views

### Status: **90% Complete**
- [x] Event listing
- [x] RSVP functionality
- [x] User calendar
- [x] Space events panel
- [ ] Recurring events
- [ ] Calendar export (ICS)

---

## Slice 7: Profiles

**Purpose:** Identity. Who you are on campus.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/profile` | Done | Own profile |
| `/profile/[id]` | Done | View profile |
| `/profile/edit` | Done | Edit profile |
| `/profile/connections` | Done | Connections list |
| `/profile/settings` | Done | Profile settings |

### APIs
- `GET /api/profile` — Current user
- `PUT /api/profile` — Update profile
- `POST /api/profile/identity` — Update identity fields
- `GET /api/profile/[userId]` — View other profile

### Key Components
- `ProfileShell` — Profile layout
- `ProfileHeader` — Avatar, name, handle
- `ProfileBento` — Grid layout sections
- `SimpleAvatar` — User avatar (rounded square)

### Status: **90% Complete**
- [x] Profile view/edit
- [x] Avatar upload
- [x] Connection display
- [ ] Ghost mode (privacy)
- [ ] Profile analytics

---

## Slice 8: HiveLab (Tools)

**Purpose:** Creation. Build what you need.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/hivelab` | Done | HiveLab landing |
| `/tools` | Done | Tool library |
| `/tools/new` | Done | Create tool |
| `/tools/create` | Done | Legacy create |
| `/tools/templates` | Done | Template gallery |
| `/tools/[toolId]` | Done | Tool view |
| `/tools/[toolId]/edit` | Done | Tool IDE |
| `/tools/[toolId]/preview` | Done | Preview mode |
| `/tools/[toolId]/deploy` | Done | Deploy modal |
| `/tools/[toolId]/settings` | Done | Tool settings |
| `/tools/[toolId]/analytics` | Done | Tool analytics |
| `/tools/[toolId]/run` | Done | Run tool |
| `/tools/[toolId]/runs` | Done | Execution history |

### APIs
- `GET /api/tools` — List tools
- `POST /api/tools` — Create tool
- `GET /api/tools/browse` — Public gallery
- `POST /api/tools/generate` — AI generation
- `GET /api/tools/[toolId]` — Tool details
- `PATCH /api/tools/[toolId]` — Update tool
- `POST /api/tools/[toolId]/deploy` — Deploy
- `POST /api/tools/[toolId]/execute` — Run tool
- `GET /api/tools/[toolId]/state` — State persistence

### Key Components
- `HiveLabIDE` — Visual canvas
- `ElementPalette` — 24 draggable elements
- `PropertiesPanel` — Element config
- `InlineElementRenderer` — Runtime rendering

### Element Library (24 total)
**Universal (12):** search-input, filter-selector, result-list, date-picker, tag-cloud, map-view, chart-display, form-builder, countdown-timer, poll-element, leaderboard, notification-display

**Connected (5):** event-picker, space-picker, user-selector, rsvp-button, connection-list

**Space (7):** member-list, member-selector, space-events, space-feed, space-stats, announcement, role-gate

### Status: **80% Complete**
- [x] AI generation
- [x] Visual canvas
- [x] 24 element library
- [x] Deployment system
- [x] State persistence
- [ ] Undo/redo
- [ ] Real analytics (currently mock)
- [ ] Collaboration

---

## Slice 9: Settings & Admin

**Purpose:** Control. Your rules.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/settings` | Done | Settings hub |
| `/notifications` | Done | Notification center |
| `/notifications/settings` | Done | Notification prefs |

### APIs
- `GET /api/profile/settings` — User settings
- `PUT /api/profile/settings` — Update settings
- `GET /api/notifications` — User notifications
- `PATCH /api/notifications/[id]` — Mark read

### Status: **85% Complete**
- [x] Settings UI
- [x] Notification center
- [x] Notification preferences
- [ ] Push notifications (flagged off)
- [ ] Email preferences

---

## Slice 10: Support Pages

**Purpose:** Trust. Legal. Help.

### Routes
| Route | Status | Description |
|-------|--------|-------------|
| `/legal/terms` | Done | Terms of service |
| `/legal/privacy` | Done | Privacy policy |
| `/legal/community-guidelines` | Done | Community guidelines |
| `/resources` | Done | Help resources |
| `/offline` | Done | Offline fallback |

### Status: **100% Complete**

---

## Infrastructure Status

### Design System
- **93 primitives** in `packages/ui/src/design-system/primitives/`
- **138 components** in `packages/ui/src/components/`
- **Tokens:** `packages/ui/src/design-system/tokens.css`
- **Motion:** `packages/ui/src/design-system/primitives/motion/`

### Core Domain (DDD)
```
packages/core/src/
├── domain/          # Entities, value objects
├── application/     # Use cases, services
├── infrastructure/  # Firebase, external services
└── bounded-contexts/
    ├── spaces/
    ├── events/
    ├── tools/
    ├── profiles/
    ├── notifications/
    └── ...
```

### API Layer
- **275+ endpoints** in `apps/web/src/app/api/`
- Rate limiting on all POST/PUT/DELETE
- Campus isolation via `campusId` filter
- Zod validation at boundaries

### Security
- [x] SVG XSS protection (DOMPurify)
- [x] Campus isolation middleware
- [x] Rate limiting (20/min default)
- [x] Input sanitization
- [x] Auth token validation

---

## What's Missing (P0)

| Feature | Slice | Blocker |
|---------|-------|---------|
| Online presence system | Spaces | Firebase RTDB setup |
| Real unread counts | Feed, Spaces | Need `userBoardReads` collection |
| Tool analytics (real) | HiveLab | Replace mock data |
| Push notifications | Notifications | Service worker setup |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          NEXT.JS APP                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Entry/Auth  │  Onboarding  │  Feed  │  Discovery           │ │
│  ├──────────────┴──────────────┴────────┴──────────────────────┤ │
│  │  Spaces  │  Events  │  Profiles  │  HiveLab  │  Settings    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              ↓                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                      API ROUTES                              │ │
│  │  /api/auth  /api/spaces  /api/events  /api/tools  /api/...  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        @hive/core                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Domain     │  │ Application  │  │Infrastructure│          │
│  │  Entities    │  │  Services    │  │  Firebase    │          │
│  │  Value Objs  │  │  Use Cases   │  │  Resend      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        FIREBASE                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Firestore   │  │   Storage    │  │   Auth       │          │
│  │  (all data)  │  │   (files)    │  │   (session)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference

### Key Files by Slice

| Slice | Key File | Lines |
|-------|----------|-------|
| Auth | `apps/web/src/app/enter/page.tsx` | ~300 |
| Onboarding | `apps/web/src/components/onboarding/` | ~800 |
| Feed | `apps/web/src/app/feed/page.tsx` | ~400 |
| Discovery | `apps/web/src/app/explore/page.tsx` | ~450 |
| Spaces | `apps/web/src/app/s/[handle]/page.tsx` | ~600 |
| Spaces Hook | `use-space-residence-state.ts` | ~525 |
| Events | `apps/web/src/app/events/page.tsx` | ~300 |
| Profiles | `apps/web/src/app/profile/edit/page.tsx` | ~400 |
| HiveLab | `apps/web/src/app/tools/[toolId]/edit/page.tsx` | ~800 |
| Settings | `apps/web/src/app/settings/page.tsx` | ~350 |

### Commands

```bash
pnpm dev                      # All servers
pnpm --filter=@hive/web dev   # Web only (port 3000)
pnpm build && pnpm typecheck  # Quality gate
```

---

*This document replaces all other state/audit docs. Update when features ship.*
