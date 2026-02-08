# 01 - Identity & Home System

The system that answers: "Who am I on HIVE, and what should I do right now?"

Covers onboarding, profile, home dashboard, schedule integration, and the personalization engine that ties them together.

---

## Existing Code Assessment

### What Ships (Ready or Near-Ready)

| Component | Location | Status |
|-----------|----------|--------|
| 4-phase entry flow (Gate/Naming/Field/Crossing) | `apps/web/src/components/entry/` | **Ships.** Solid state machine, real API calls, analytics tracking, handle generation, waitlist flow. |
| Entry hook with full state management | `apps/web/src/components/entry/hooks/useEntry.ts` | **Ships.** Proper abort handling, debounced handle checks, phase transitions. |
| Home dashboard (Activity Stream v2) | `apps/web/src/app/home/page.tsx` | **Ships with changes.** Functional but needs schedule integration and personalization layer. |
| Profile aggregate (DDD) | `packages/core/src/domain/identity/aggregates/profile.aggregate.ts` | **Ships.** Clean aggregate with onboarding, interests, connections. |
| Enhanced profile with value objects | `packages/core/src/domain/profile/aggregates/enhanced-profile.ts` | **Ships.** Interest similarity, academic standing, major classification. |
| Completion config (single source of truth) | `packages/core/src/domain/profile/completion-config.ts` | **Ships.** Weighted completion scoring, field-level tracking. |
| Profile context provider | `apps/web/src/components/profile/ProfileContextProvider.tsx` | **Ships.** API-driven, ghost mode toggle, refresh. |
| Settings page (4 sections) | `apps/web/src/app/me/settings/page.tsx` | **Ships.** Profile/notifications/privacy/account with calendar connect. |
| Ghost mode service | `packages/core/src/domain/profile/services/ghost-mode.service.ts` | **Ships.** 4 visibility levels, directory/search/activity filtering. |
| Calendar hook (read-only, space events) | `apps/web/src/hooks/use-calendar.ts` | **Ships.** View modes, RSVP, conflict detection. |
| Feed ranking service | `packages/core/src/domain/feed/services/feed-ranking.service.ts` | **Ships.** 8-factor ranking with diversity enforcement. |
| Privacy settings hook | `apps/web/src/hooks/use-privacy-settings.ts` | **Ships.** |
| Profile completion hook | `apps/web/src/hooks/use-profile-completion.ts` | **Ships.** API-driven with dismissal cooldown. |
| 25+ profile API routes | `apps/web/src/app/api/profile/` | **Ships.** Dashboard, completion, privacy, identity, upload, notifications, connections. |

### What Changes

| Component | Change Required |
|-----------|----------------|
| Home dashboard | Add "Your Day" schedule section, AI-powered "For You" section, student-type adaptation |
| Entry flow | Add conversational interest gathering (AI), living situation question, "what are you looking for" |
| Profile view | Consolidate `/profile/[id]` and `/u/[handle]` — one canonical profile page |
| Feed ranking | Integrate schedule awareness (surface events during free periods) |
| Completion config | Add `lookingFor` and `livingContext` fields |

---

## 1. Onboarding (First 5 Minutes)

### Design Principle

The entry flow is not a registration form. It is the first experience of HIVE's culture: exclusive, intentional, real. A student should feel like they earned access and arrived somewhere that already knows them.

### Current Flow (Ships)

The existing 4-phase flow at `/enter` is well-built and ships:

```
Phase 1: GATE     → Email + 6-digit code verification
Phase 2: NAMING   → First/last name (handle auto-generated)
Phase 3: FIELD    → Graduation year (required) + major (optional)
Phase 4: CROSSING → 2-5 interest selection from 150+ options
```

**Narrative arc:** Outsider → Proven → Named → Claimed → Arrived

### Enhanced Flow (What Changes)

Insert a brief context-gathering step between FIELD and CROSSING. This replaces the static interest grid with a smarter flow that feeds the personalization engine from minute 1.

#### Phase 3.5: CONTEXT (New — 30 seconds)

**Screen: "Tell us about your life at [School]"**

Two quick questions, each a single-tap selection:

**Question 1: Living situation**
```
Options:
- "I live on campus" → residenceType: 'on_campus'
- "I commute"        → residenceType: 'commuter'
- "I live nearby"    → residenceType: 'off_campus'
```

**Question 2: What are you looking for?** (multi-select, pick 1-3)
```
Options:
- "Friends & social life"    → goal: 'social'
- "Career & skills"          → goal: 'career'
- "Study groups"             → goal: 'academic'
- "Leadership experience"    → goal: 'leadership'
- "Something to do"          → goal: 'activity'
```

**Why these two questions matter:**
- `residenceType` immediately segments the home dashboard: commuters see schedule gaps with nearby events, residents see proximity-based activity, everyone gets relevant content.
- `lookingFor` seeds the recommendation engine before the student has any behavioral data. A student looking for "career & skills" sees professional spaces first; a student looking for "friends" sees social spaces.

#### Phase 4: CROSSING (Enhanced)

Replace the static 150-interest grid with a hybrid approach:

**Screen 1:** Show 12-15 AI-curated interests based on the student's major and goals from the CONTEXT step. Example: a Computer Science student who selected "career & skills" sees `["Software Engineering", "Startups", "AI/ML", "Data Science", "Hackathons", "Internships"]` before the full grid. This eliminates the "wall of 150 options" anti-pattern.

**Screen 2:** After selecting 2+ from curated suggestions, show "See all interests" as a secondary action that expands to the full categorized grid (existing `INTEREST_CATEGORIES` from `CrossingScreen.tsx`).

**AI integration point:** The curated interests come from a server-side endpoint that takes `{ major, graduationYear, goals, residenceType }` and returns ranked interests. This endpoint uses the same similarity model that powers space recommendations. Latency target: < 500ms (falls back to static popular interests if slow).

#### Data Model Changes

Add to `UserData` in `packages/core/src/domain/profile/completion-config.ts`:

```typescript
// New fields (optional, collected in CONTEXT phase)
residenceType?: 'on_campus' | 'commuter' | 'off_campus' | null;
lookingFor?: string[] | null;  // ['social', 'career', 'academic', 'leadership', 'activity']
```

Add to Firestore user document (no migration needed — additive fields):

```
users/{userId}
  residenceType: string | null
  lookingFor: string[]
  onboardingSignals: {
    completedAt: Timestamp
    majorAtOnboarding: string | null
    interestsAtOnboarding: string[]
    goalsAtOnboarding: string[]
    residenceAtOnboarding: string | null
  }
```

#### API Contract

**New endpoint: `POST /api/onboarding/curated-interests`**

```typescript
// Request
{
  major: string | null;
  graduationYear: number | null;
  goals: string[];         // from CONTEXT step
  residenceType: string;   // from CONTEXT step
}

// Response (< 500ms)
{
  success: true;
  interests: string[];     // 12-15 curated interests, ranked by relevance
  categories: string[];    // which categories they come from (for display)
}
```

**Modified endpoint: `POST /api/auth/complete-entry`**

Add fields to the existing request body:

```typescript
{
  // existing
  firstName: string;
  lastName: string;
  role: string;
  major: string | null;
  graduationYear: number | null;
  interests: string[];
  handle?: string;
  // new
  residenceType: string;
  lookingFor: string[];
}
```

#### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Returning user (already has account) | Gate phase detects existing session via cookie. Redirects to `/home`. No re-onboarding. |
| Mid-semester join | Same flow. "Class of..." shows current + future years. No special treatment — the product works for everyone regardless of when they join. |
| No schedule entered | Product works fully without schedule. Home dashboard omits "Your Day" section and shows activity-only view. |
| Switching devices | Auth state persists via Firebase session cookie. If student starts on phone and continues on laptop, they resume from the last completed phase (Gate verifies email, so naming/field/crossing data is server-side after code verification). |
| Student switches between schools | Gate phase: email domain determines school. If student enters a non-matching domain, waitlist flow activates. |
| Grad student | Same flow. "Class of..." range extended. Major step accommodates graduate programs. Home dashboard adapts — grad students see fewer "freshman orientation" style suggestions. |
| Student who closes browser mid-flow | Phase state is stored in React state (not persisted). Reopening `/enter` restarts from Gate. This is intentional — the flow takes < 3 minutes, and re-entry verifies the email again. |

#### Acceptance Criteria

- [ ] Gate → Naming → Field → Context → Crossing flow completes in under 3 minutes
- [ ] Handle is auto-generated from name and checked for availability in < 400ms
- [ ] Curated interests appear within 500ms of reaching Crossing phase
- [ ] `residenceType` and `lookingFor` are persisted to Firestore on completion
- [ ] Completion redirects to first auto-joined space (if AI matched one) or `/home`
- [ ] Browser back button navigates between phases (existing, ships)
- [ ] All inputs have visible focus rings, 44px+ touch targets
- [ ] Reduced motion: fade transitions only, no blur animations
- [ ] Screen reader: phase progress announced on transition

---

## 2. Profile System

### What Represents a Student

A HIVE profile is not a social media profile. It exists to serve two functions:

1. **Discovery** — Other students finding this person (search, space member lists, recommendations)
2. **Personalization** — HIVE understanding this person (feed ranking, event suggestions, space recommendations)

#### Profile Data Architecture

The profile spans three layers that already exist in the codebase:

```
Layer 1: Identity (required, set during onboarding)
  - firstName, lastName, handle, email, campusId
  - Source: entry flow → Firestore users/{userId}

Layer 2: Context (collected progressively)
  - major, graduationYear, bio, avatarUrl, pronouns
  - residenceType, lookingFor, interests
  - Source: settings, progressive profiling prompts

Layer 3: Behavioral (computed, never directly edited)
  - activityScore, spacesJoined, eventsAttended
  - connectionCount, followerCount
  - interestSimilarity signals, engagement patterns
  - Source: computed from activity → stored as denormalized fields
```

#### Profile Fields Specification

| Field | Type | Required | Set During | Visibility Default | Editable |
|-------|------|----------|------------|-------------------|----------|
| `handle` | string | Yes | Onboarding | Public (campus) | Yes (once) |
| `firstName` | string | Yes | Onboarding | Public (campus) | Yes |
| `lastName` | string | Yes | Onboarding | Public (campus) | Yes |
| `email` | string | Yes | Onboarding | Hidden | No |
| `campusId` | string | Yes | Auto (email domain) | Hidden | No |
| `avatarUrl` | string | No | Settings | Public (campus) | Yes |
| `bio` | string | No | Settings | Public (campus) | Yes |
| `major` | string | No | Onboarding/Settings | Public (campus) | Yes |
| `graduationYear` | number | No | Onboarding | Public (campus) | Yes |
| `pronouns` | string | No | Settings | Public (campus) | Yes |
| `residenceType` | string | No | Onboarding/Settings | Hidden | Yes |
| `lookingFor` | string[] | No | Onboarding/Settings | Hidden | Yes |
| `interests` | string[] | Yes (2+) | Onboarding | Public (campus) | Yes |
| `statusMessage` | string | No | Settings | Public (campus) | Yes |

#### Privacy Controls (Per 2026 Standards)

The existing `ProfilePrivacy`, `GhostModeService`, and privacy settings in `SettingsPage` already implement the required controls. Key defaults:

```typescript
// From spec-compliant-profile.ts — these are correct
privacy: {
  profileVisibility: 'campus',     // NOT public, NOT private
  showEmail: false,                 // Hidden by default
  showSchedule: true,              // Visible to space members only
  allowMessages: 'connections'     // Not open to everyone
}
```

**What needs to ship (additions to existing privacy settings):**

| Control | Default | Location |
|---------|---------|----------|
| Profile visible to | Campus only | Settings > Privacy (exists) |
| Show what spaces I'm in | Space members only | Settings > Privacy (exists) |
| Show online status | Off | Settings > Privacy (exists via Ghost Mode) |
| Show interests on profile | On | Settings > Privacy (new) |
| Show graduation year | On | Settings > Privacy (new) |
| Allow connection requests from | Everyone on campus | Settings > Privacy (new) |
| AI personalization data | Viewable + resettable | Settings > Account (new) |

#### Profile View Page

Currently there are two profile view routes that need consolidation:

- `/u/[handle]` — handle-based (canonical)
- `/profile/[id]` — ID-based (legacy, has rich bento grid)

**Decision: Ship `/u/[handle]` as canonical.** The `/profile/[id]` route redirects to `/u/[handle]`. The bento grid components from `/profile/[id]/components/` (ProfileHeader, BentoProfileGrid, ProfileInterests, SpacesLedSection) are reused in the handle-based page.

**Profile view sections (in order):**

1. **Header** — Avatar, name, handle, bio, pronouns, academic standing (from `getAcademicStanding()`)
2. **Actions** — Connect / Message / Follow (visibility depends on privacy settings)
3. **Interests** — Tag chips, clickable to discover spaces with similar interests
4. **Spaces** — Spaces this student is in (respects `showSpaces` privacy setting)
5. **Activity** — Recent activity in shared spaces (respects `hideActivity` ghost mode setting)

**Viewer context determines what shows:**
- **Self viewing:** Full profile + edit buttons + completion nudges
- **Same campus, connected:** Full visible fields
- **Same campus, not connected:** Respects all privacy settings
- **Different campus:** Never visible (campus isolation)

#### API Contracts

**Existing (ships):**
- `GET /api/profile/v2` — Own profile
- `PATCH /api/profile/v2` — Update own profile
- `GET /api/profile/[userId]` — View other profile
- `GET /api/profile/handle/[handle]` — Resolve handle to profile
- `GET /api/profile/completion` — Completion state
- `POST /api/profile/upload-photo` — Avatar upload
- `GET /api/profile/privacy` — Privacy settings

**New:**
- `GET /api/profile/personalization-data` — Returns what HIVE "knows" about the student (for transparency)
- `DELETE /api/profile/personalization-data` — Resets personalization signals (fresh start)

```typescript
// GET /api/profile/personalization-data
// Response:
{
  success: true;
  data: {
    onboardingSignals: {
      interests: string[];
      goals: string[];
      residenceType: string;
    };
    behavioralSignals: {
      topSpaces: { id: string; name: string; engagementScore: number }[];
      activeHours: number[];         // hours of day with most activity
      contentPreferences: string[];   // content types engaged with most
      lastReset: string | null;
    };
    derivedTraits: {
      studentType: string;           // 'commuter' | 'resident' | 'leader' | 'explorer' | etc
      engagementLevel: string;       // 'new' | 'active' | 'power_user'
      connectionDensity: string;     // 'solo' | 'connected' | 'hub'
    };
  }
}
```

#### Acceptance Criteria

- [ ] Profile edit saves optimistically with rollback on failure
- [ ] Avatar upload shows inline preview before save, max 5MB, auto-crop to square
- [ ] Handle change: one-time only, with availability check, 72-hour redirect from old handle
- [ ] Privacy changes take effect immediately (no "processing" delay)
- [ ] Personalization data page shows all signals with "Reset" action
- [ ] Profile renders full skeleton while loading (existing, ships)
- [ ] Bio field: 300 char limit, plain text only, no links
- [ ] Interests: edit inline on profile (tap to add/remove), max 10
- [ ] Ghost mode: instant toggle, affects all visibility surfaces immediately

---

## 3. Home Dashboard

### Design Principle

The home dashboard answers one question: **"What should I do right now?"**

It is not a feed. It is not a social timeline. It is a personalized action surface that adapts to who the student is, what time it is, and what is happening around them.

### Current State (Ships with Changes)

The existing `HomePage` at `/home` already implements:
- Greeting header with time-of-day awareness
- "Happening Now" (active users across spaces)
- "Up Next" (next event within 24 hours)
- "Your Spaces" grid with unread badges and online counts
- "Recent Activity" stream (last 10 items)
- "Suggested for You" (one space recommendation)
- New user empty state with join-from-home

This structure is solid. The changes add schedule awareness, student-type adaptation, and AI-powered personalization.

### Section Architecture

```
┌─────────────────────────────────────┐
│ Greeting Header                     │  Always visible. "{greeting}, {name}"
│ "{day}, {date}"                     │  with today's date.
├─────────────────────────────────────┤
│ [Your Day] ← NEW                   │  Schedule-aware section.
│ Schedule gaps + events in gaps.     │  Only shows if schedule data exists.
│ "Free 2-4pm · Robotics Club at 3"  │  Hidden for students without schedule.
├─────────────────────────────────────┤
│ Happening Now                       │  Existing. Shows active user count
│ "12 people active across 3 spaces"  │  across spaces. Hides if zero.
├─────────────────────────────────────┤
│ Up Next                             │  Existing. Next event within 24h.
│ Event card with RSVP action.        │  Hides if no upcoming events.
├─────────────────────────────────────┤
│ Your Spaces                         │  Existing. 2-column grid.
│ Space cards with unread + online.   │
├─────────────────────────────────────┤
│ [For You] ← NEW                    │  AI-personalized section.
│ 1-3 items: events, spaces, people. │  Context-aware recommendations.
│ Changes daily.                      │
├─────────────────────────────────────┤
│ Recent Activity                     │  Existing. Last 10 activities.
│                                     │
└─────────────────────────────────────┘
```

### Student-Type Adaptation

The home dashboard renders the same sections for everyone but **orders and weights them differently** based on `residenceType`, `lookingFor`, time-of-day, and behavioral signals.

| Student Type | Adaptation |
|-------------|------------|
| **Commuter** | "Your Day" section is prominent — shows schedule gaps with nearby events. "For You" emphasizes events during on-campus hours. |
| **Resident** | "Happening Now" is prominent — who's active nearby. "For You" emphasizes spontaneous activities. |
| **New student (< 7 days)** | Extra emphasis on "Your Spaces" with join CTAs. "For You" shows popular-with-freshmen spaces. Warm, guiding tone. |
| **Leader (admin of 2+ spaces)** | "Your Spaces" shows admin summary: pending join requests, unread count. Quick links to manage. |
| **Power user (daily active, 5+ spaces)** | Dense layout. More items per section. Less guidance copy. Faster to scan. |
| **Introvert (browses but rarely joins)** | "For You" emphasizes low-commitment actions: "Browse this space", "Read this discussion". Never pushes joining. |
| **Inactive (hasn't opened in 3+ days)** | NO guilt. No "you missed this." Just shows current state: what's happening now, what's coming up. As if they never left. |

### "Your Day" Section (New)

Shows only when the student has schedule data (from calendar integration or manual entry).

**Layout:**

```
YOUR DAY
─────────────────────────────
9:00 AM  │ CS 101 - Lecture
         │ Norton Hall 112
─────────────────────────────
10:30 AM │ ⏸ Free until 1:00 PM
         │ → Photography Club meetup at 11 AM (Student Union)
         │ → 3 people from your spaces are free too
─────────────────────────────
1:00 PM  │ ENG 200 - Lab
         │ Bell Hall 304
─────────────────────────────
3:00 PM  │ ⏸ Done for today
         │ → Hackathon info session at 4 PM (Capen Hall)
─────────────────────────────
```

**Rules:**
- Only shows classes/events for today
- Free periods show 1-2 relevant events happening during that gap
- "X people from your spaces are free too" requires schedule overlap analysis (only shown if student has opted in to `showSchedule`)
- Past times collapse to a single line
- If no schedule data: section does not render (no empty state for this — the rest of the dashboard is the fallback)

**Data source:** `GET /api/calendar` (existing) merged with `GET /api/profile/dashboard` events

### "For You" Section (New)

AI-personalized recommendations that change daily. Shows 1-3 cards based on context.

**Card types:**

| Type | When Shown | Example |
|------|-----------|---------|
| Event match | Event in next 48h matches interests | "Intro to Machine Learning Workshop — tomorrow at 3 PM. 8 students with similar interests are going." |
| Space discovery | Space the student hasn't seen that matches profile | "Students in your major also joined UB Robotics Club — 47 members, active daily" |
| Warm intro | Person with high interest overlap in a shared space | "You and Alex both picked AI/ML and Startups — they're in 2 of your spaces" (only if both have `showConnections` enabled) |
| Trending | Something unusually active on campus | "UB Esports just hit 100 members — fastest growing space this week" |

**Rules:**
- Never show the same recommendation twice in 48 hours
- Never recommend spaces the student already joined
- Never recommend people the student already connected with
- Maximum 3 cards. Less is better than more.
- Each card has a "Not interested" dismiss action (feeds back into personalization)
- "Why am I seeing this?" link on each card → shows the signal that triggered it

**API Contract:**

```typescript
// GET /api/home/for-you
// Response:
{
  success: true;
  cards: Array<{
    id: string;
    type: 'event_match' | 'space_discovery' | 'warm_intro' | 'trending';
    title: string;
    subtitle: string;
    reason: string;          // human-readable "why" — always shown
    actionLabel: string;     // "View Event" | "Browse Space" | "See Profile"
    actionUrl: string;
    imageUrl?: string;
    metadata: {
      matchScore: number;    // 0-100
      signals: string[];     // what triggered this recommendation
    };
    dismissable: true;
  }>;
}

// POST /api/home/for-you/dismiss
{
  cardId: string;
  reason?: 'not_interested' | 'already_know' | 'irrelevant';
}
```

### New User State (Existing — Enhanced)

The existing `NewUserState` in `HomePage` ships. Enhancement: after the student joins their first space from the home page, the page live-updates (existing behavior via `joinedSpaceIds` state) and the "Find your first space" header transitions to the normal dashboard layout without a full page reload.

**Additional new-user behavior:**
- First 3 visits: show a subtle "tip" above the greeting: "Tip: Spaces are where everything happens. Join 2-3 to see your dashboard come alive." Dismissable, never returns after dismissal.
- Recommendations sorted by `matchScore` (from `lookingFor` + `interests` + `major` signals collected during onboarding)

### Performance

| What | Target | Strategy |
|------|--------|----------|
| Shell render (header + skeleton) | < 200ms | SSR the shell, client-side data fetch |
| Spaces data (React Query) | < 500ms | `staleTime: 2min`, cached |
| Dashboard data (events + recs) | < 500ms | Single API call, server-side aggregation |
| Activity feed | < 800ms | Separate query, loads after spaces |
| "For You" cards | < 1s | Separate query, loads last, non-blocking |
| "Your Day" schedule | < 500ms | Uses cached calendar data from `useCalendar` |

**Skeleton strategy (existing, ships):** Header skeleton + 4 card skeletons in the spaces grid + 3 activity item skeletons. Skeletons match actual content layout dimensions.

### Acceptance Criteria

- [ ] Home dashboard renders useful content within 1.5s on 4G
- [ ] "Your Day" section shows schedule + event suggestions when schedule data exists
- [ ] "Your Day" section does not render when no schedule data (no empty state)
- [ ] "For You" shows 1-3 contextual recommendations with visible "why" on each
- [ ] Dismiss action on "For You" cards prevents re-showing for 48 hours
- [ ] New user state shows recommendations sorted by match quality
- [ ] RSVP from home page works with optimistic update (existing, ships)
- [ ] Pull-to-refresh on mobile refreshes all data
- [ ] "Happening Now" hides when zero users active (existing, ships)
- [ ] All sections use skeleton loading (existing, ships)
- [ ] Keyboard navigable: Tab through all interactive elements
- [ ] Cmd/Ctrl+K opens command palette from home (handled by global handler, not home-specific)

---

## 4. Schedule Integration

### Design Principle

Schedule is ONE input among many. The product works fully without it. When present, it makes everything smarter — but never depends on it.

### Current State

- `useCalendar` hook exists, fetches from `/api/calendar`, supports RSVP
- Calendar page at `/me/calendar` with day/week/month views, conflict detection, keyboard shortcuts
- Google Calendar connect flow in Settings (OAuth via `/api/calendar/connect`)
- Calendar status check via `/api/calendar/status`

### Input Methods

| Method | Status | How It Works |
|--------|--------|-------------|
| **Google Calendar sync** | Exists | OAuth flow, server-side token exchange, periodic sync. Student connects once in Settings > Account. |
| **Manual entry** | New | Simple form: class name, days of week, start/end time. Stored in Firestore `users/{userId}/schedule/manual`. |
| **Paste from student portal** | Future | Parse pasted text from university schedule page. Not in initial scope. |

### Manual Schedule Entry (New)

For students who don't use Google Calendar or don't want to connect it.

**Location:** Settings > Account > Schedule section (below calendar connect)

**UI:** "Add your classes" button opens a bottom sheet (mobile) or inline form (desktop):

```
Class Name:     [____________]
Days:           [M] [T] [W] [Th] [F]  (toggle chips)
Start Time:     [10:00 AM ▼]
End Time:       [11:20 AM ▼]
Location:       [____________]  (optional)
                [+ Add Another Class]
                [Save Schedule]
```

**Data Model:**

```
users/{userId}/schedule/
  manual: {
    classes: Array<{
      id: string
      name: string
      days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[]
      startTime: string   // "10:00" (24h)
      endTime: string     // "11:20" (24h)
      location?: string
    }>
    updatedAt: Timestamp
  }
```

**API Contract:**

```typescript
// GET /api/schedule
// Returns merged schedule from all sources
{
  success: true;
  schedule: {
    source: 'google' | 'manual' | 'none';
    classes: Array<{
      id: string;
      name: string;
      days: string[];
      startTime: string;
      endTime: string;
      location?: string;
      source: 'google' | 'manual';
    }>;
    lastSynced?: string;
  }
}

// PUT /api/schedule/manual
// Save manually entered schedule
{
  classes: Array<{
    name: string;
    days: string[];
    startTime: string;
    endTime: string;
    location?: string;
  }>
}
```

### How Schedule Informs the Product

| Feature | Without Schedule | With Schedule |
|---------|-----------------|---------------|
| Home dashboard | Activity-only view | "Your Day" section with free periods |
| Event recommendations | Based on interests only | Based on interests + free periods |
| Notifications | Standard timing | Suppressed during classes |
| "People free now" | Not shown | Shows students with overlapping free time |
| Space suggestions | Interest-based | Interest-based + "popular with your schedule pattern" |

### What Happens Without Schedule

Everything works. The home dashboard omits "Your Day." Event recommendations use interests and time-of-day only. Notifications use quiet hours (if set) but no class-awareness.

The product never nags about connecting a schedule. A subtle "Connect your schedule for smarter suggestions" link appears once in Settings and once as a "For You" card after 7 days. If dismissed, never returns.

### Acceptance Criteria

- [ ] Google Calendar connect flow works end-to-end (existing, ships)
- [ ] Manual class entry saves and shows in calendar view
- [ ] Schedule data feeds into "Your Day" section on home dashboard
- [ ] Event suggestions respect free periods when schedule is available
- [ ] Product works identically for students without schedule data (no empty states, no nags)
- [ ] Class schedule respects semester boundaries (auto-expire at semester end)
- [ ] Schedule data is never visible to other students by default

---

## 5. Personalization Engine

### Architecture

Personalization happens in three phases, each building on the previous:

```
MINUTE 1      WEEK 1         MONTH 1
(signals)     (behavior)     (deep patterns)
───────────── ────────────── ──────────────
email domain  tap patterns   sustained engagement
interests     join/leave     social graph proximity
year/major    time-of-day    content creation
goals         notification   schedule patterns
residence       engagement   interest evolution
              space dwell    connection density
                time
```

### Minute-1 Personalization (Onboarding Signals)

Available immediately after completing entry flow. No behavioral data needed.

**Signals collected:**
- `campusId` (from email domain — auto-detected, not dropdown)
- `interests` (2-5 selected during Crossing)
- `graduationYear` (from Field)
- `major` (from Field, optional)
- `residenceType` (from Context)
- `lookingFor` (from Context)

**What these signals power:**
1. **Space recommendations** — Ranked by interest overlap with space tags + goal match
2. **Home dashboard ordering** — Commuter vs resident layout
3. **Event surfacing** — Events matching interests appear in "Up Next" and "For You"
4. **New user "For You"** — Immediate personalized content, never an empty dashboard

**Implementation:** The existing `FeedRankingService` gets a new `onboardingSignals` input in `UserRankingContext`:

```typescript
// Enhancement to UserRankingContext in feed-ranking.service.ts
export interface UserRankingContext {
  userId: string;
  spaceEngagementScores: Map<string, number>;
  preferredSpaceIds: string[];
  preferredContentTypes: string[];
  optimalPostingHours: number[];
  // New
  onboardingSignals?: {
    interests: string[];
    goals: string[];
    residenceType: string;
    major: string | null;
    graduationYear: number | null;
  };
}
```

### Week-1 Personalization (Behavioral Signals)

After 3-7 days of usage, behavioral data starts to outweigh onboarding signals.

**Signals tracked (in-app behavior only, per 2026 Standards):**
- Which spaces the student taps into (and how long they stay)
- Which events they RSVP to
- Which recommendations they dismiss vs act on
- Time-of-day usage patterns
- Which notification types they open vs ignore

**What these signals power:**
1. **Feed reordering** — Existing `FeedRankingService` already handles this via `spaceEngagementScores`
2. **Notification calibration** — If student ignores event reminders but opens new-member alerts, shift the mix
3. **"Suggested for You"** — Gets sharper: not just category matches but behavioral similarity

**Storage:**

```
users/{userId}/personalization/
  behavioral: {
    spaceEngagement: Map<spaceId, number>    // 0-100 engagement score
    activeHours: number[]                     // hours of day with activity
    contentPreferences: string[]              // content types engaged with
    notificationEngagement: {
      opened: Map<notificationType, number>
      ignored: Map<notificationType, number>
    }
    lastUpdated: Timestamp
  }
```

### Month-1 Personalization (Deep Patterns)

After 30+ days, the personalization becomes anticipatory.

**Signals:**
- Sustained engagement patterns (not just what they tapped once, but what they keep coming back to)
- Social graph proximity (who they interact with, who those people interact with)
- Interest evolution (interests they've added/removed since onboarding)
- Schedule patterns (if schedule connected — when they're free, when they're active)

**What these signals power:**
1. **Anticipatory surfacing** — Surface relevant events before the student searches
2. **"Students like you"** — Collaborative filtering: students with similar engagement patterns get similar recommendations
3. **Proactive nudges** — For students who haven't found their fit: "Hey, students with your interests loved this space" (genuine, not guilt-trip)

### AI Integration Points

| Surface | AI Role | Visibility |
|---------|---------|------------|
| Curated interests (onboarding) | Rank interests by relevance to major + goals | Invisible — just better defaults |
| "For You" cards | Select and rank recommendations | Each card shows "why" reason |
| Space recommendations | Match student to spaces via interest + behavioral similarity | "Students like you also joined..." |
| Search | Natural language understanding ("camera stuff" → photography spaces) | Invisible — just better results |
| Notification intelligence | Learn which notifications this student engages with | Invisible — fewer irrelevant pings |

### Privacy: What Students Can See and Control

Per 2026 Standards, students can always see what data informs their experience and reset it.

**Location:** Settings > Account > "Your HIVE Data"

**What's shown:**
1. **Onboarding signals** — Interests, goals, residence type (editable)
2. **Behavioral signals** — Top spaces by engagement, active hours, content preferences (read-only)
3. **Derived traits** — Student type classification, engagement level (read-only, human-readable)

**Controls:**
- "Reset personalization" button — Clears behavioral signals, keeps onboarding data. Feed returns to interest-based only.
- "Download my data" — Exports all profile + personalization data as JSON (existing, in AccountSection)

**Rules:**
- Personalization signals come from in-app behavior only. Never location, never device sensors, never cross-app data.
- Default to less personalization — earn the right to personalize more through value delivered.
- No dark patterns: the most private option is always the easiest to select.

### Acceptance Criteria

- [ ] New user sees personalized space recommendations within 1 minute of completing onboarding
- [ ] "For You" cards show relevant recommendations by day 3 of usage
- [ ] Student can view all personalization data in Settings > Account
- [ ] "Reset personalization" clears behavioral data and returns to interest-only recommendations
- [ ] Personalization never uses data from outside the app
- [ ] No "you haven't opened the app" guilt notifications
- [ ] Recommendations include visible "why" text on every card
- [ ] Dismiss actions feed back into the model within the same session

---

## Cross-System Dependencies

### This system provides to other specs:

| Dependency | Consumer | What's Provided |
|-----------|----------|-----------------|
| `userId`, `campusId`, `handle` | Spaces & Events | Identity for membership, authorship, RSVP |
| `interests`, `residenceType`, `lookingFor` | Discovery & Intelligence | Signals for search ranking and recommendations |
| `spaceEngagementScores` | Discovery & Intelligence | Behavioral data for collaborative filtering |
| `privacySettings`, `ghostMode` | Communication & Social | Controls for DM permissions, visibility |
| `onboardingComplete` flag | All systems | Gate check — no feature access until onboarding is done |
| Profile completion percentage | App Shell | Completion card in settings/profile |
| Schedule data | Spaces & Events | Event conflict detection, free-period awareness |

### This system depends on:

| Dependency | Provider | What's Needed |
|-----------|----------|---------------|
| Space membership data | Spaces & Events | "Your Spaces" section, space engagement scoring |
| Event data | Spaces & Events | "Up Next" section, calendar, "Your Day" |
| Space recommendations engine | Discovery & Intelligence | "Suggested for You", "For You" cards |
| Connection/follow graph | Communication & Social | Profile actions, "warm intro" recommendations |
| Activity feed items | Spaces & Events | "Recent Activity" section on home |
| Search index updates | Discovery & Intelligence | Profile appears in search after onboarding |
