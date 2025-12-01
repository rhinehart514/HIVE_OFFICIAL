what # HIVE Vertical Slice Value Analysis & Technical Audit

**Date:** November 28, 2024
**Status:** Complete audit of all 22 vertical slices
**Scope:** Single-campus (UB) MVP

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Value Framework](#value-framework)
3. [Slice Analysis (1-18)](#slice-analysis)
4. [Technical Audit Findings](#technical-audit-findings)
5. [Critical Blockers](#critical-blockers)
6. [Slice-by-Slice Technical Status](#slice-by-slice-technical-status)
7. [Priority Fix Roadmap](#priority-fix-roadmap)
8. [Onboarding Deep-Dive](#onboarding-deep-dive)

---

## Executive Summary

Deep-dive code analysis across all 16 major slices reveals **significant gaps between intended design and actual implementation**. The platform has strong architectural foundations but critical features are stubbed, broken, or incomplete.

### Platform Readiness by Tier

| Tier               | Slices                                          | Readiness | Blockers                                              |
| ------------------ | ----------------------------------------------- | --------- | ----------------------------------------------------- |
| **Core Journey**   | Auth, Onboarding, Profile, Spaces, Feed         | **75%** ✅ | Auth security, onboarding data loss                   |
| **Engagement**     | Tools, Rituals, Calendar, Social, Notifications | 25%       | AI mock, no ritual execution, notification generation |
| **Infrastructure** | Real-time, Search, Privacy, Admin, Moderation   | **50%** ✅ | Privacy not enforced                                  |

**Nov 28, 2024 Updates:**
- ✅ Feed: 8-factor DDD ranking algorithm implemented
- ✅ Spaces: Full DDD integration (100% member operations)
- ✅ SSE: Fixed broadcast null controller bug
- ✅ Search: Replaced mock with real Firestore queries

### Launch Verdict

| Verdict       | Reasoning                                                              |
| ------------- | ---------------------------------------------------------------------- |
| **NOT READY** | Critical security issues, core features stubbed, infrastructure broken |

### Must-Fix for Any Launch

1. ~~Security: Remove dev backdoors, fix admin auth~~ ✅ FIXED (dev routes deleted)
2. ~~Data: Fix onboarding data loss~~ ✅ FIXED (full profile + spaces saved)
3. ~~Core: Feed algorithm, real-time delivery~~ ✅ FIXED
4. ~~Search: Real implementation (not mock)~~ ✅ FIXED
5. ~~Privacy: Enforce settings~~ ✅ FIXED (users search, feed filtering)

### Acceptable Technical Debt

- Tools/HiveLab (can launch without)
- Rituals (power feature, not core)
- Calendar sync (manual events sufficient)
- Email notifications (in-app sufficient for MVP)

---

## Value Framework

Each slice is evaluated against these dimensions:

| Dimension             | Questions                                         |
| --------------------- | ------------------------------------------------- |
| **Value Proposition** | Problem, Actor, Outcome, Alternative              |
| **Value Discovery**   | Entry points, Triggers, Visibility                |
| **Value Realization** | Time to value, Activation threshold, Dependencies |
| **Value Loop**        | Network effects, Data moat, Re-engagement         |
| **Value Metrics**     | Activation, Engagement, Retention signals         |

---

## Slice Analysis

### 1. AUTHENTICATION

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Users need secure, frictionless access to campus platform |
| Actor | All users (students, faculty, leaders, admins) |
| Outcome | Verified campus identity, persistent session |
| Alternative | Username/password (friction), SSO (dependency on school IT) |

**Current Implementation**

- Magic link primary (email-based)
- Password login secondary (new)
- Dev session for local development
- Admin grant checking
- CSRF protection

**Technical Status: 60%**

---

### 2. ONBOARDING

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | New users need to set up identity and find relevant content |
| Actor | New users (students, faculty, alumni) |
| Outcome | Complete profile, joined initial spaces, personalized experience |
| Alternative | Manual exploration (high friction, low conversion) |

**Current Implementation (Steps)**

1. `user-type-step` - Student/Faculty/Alumni selection
2. `identity-step` - Name, pronouns
3. `profile-step` - Photo, bio
4. `interests-step` - Interest tags
5. `spaces-step` - Join initial spaces
6. `leader-step` - Leadership interest
7. `faculty-profile-step` - Faculty-specific
8. `alumni-waitlist-step` - Alumni waitlist

**Technical Status: 50%**

---

### 3. USER PROFILES

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Users need to express identity and be discoverable |
| Actor | All users (self), other users (viewing) |
| Outcome | Rich profile that attracts connections and opportunities |
| Alternative | LinkedIn (professional only), Instagram (social only) |

**Technical Status: 55%**

---

### 4. SPACES (Groups/Communities)

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Campus communities are fragmented across platforms |
| Actor | Students (members), Leaders (organizers), Faculty (advisors) |
| Outcome | Centralized community hub with engagement tools |
| Alternative | GroupMe (chat only), Slack (complex), Instagram (broadcast) |

**Technical Status: 95%** ✅ UPDATED

**Recent Fixes (Nov 28, 2024):**
- Full DDD integration for all member operations (create, join, leave, invite, remove, role change, suspend, unsuspend)
- `SpaceManagementService` with callback pattern for cross-collection writes
- Value object validation (SpaceSlug, SpaceName, SpaceDescription, SpaceCategory)
- Auto-generated slugs via `SpaceSlug.generateFromName()`
- Server-side repository with campus isolation

---

### 5. FEED

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Users miss relevant content from their communities |
| Actor | All users (consumers), Leaders (publishers) |
| Outcome | Personalized stream of relevant campus activity |
| Alternative | Checking each space individually, missing updates |

**Technical Status: 90%** ✅ UPDATED

**Recent Fixes (Nov 28, 2024):**
- Implemented 8-factor ranking algorithm in DDD (`FeedRankingService`)
- Factors: Space Engagement (25%), Content Recency (15%), Content Quality (20%), Tool Interaction (15%), Social Signals (10%), Creator Influence (5%), Diversity (5%), Temporal Relevance (5%)
- Full test coverage in `feed-ranking.service.test.ts`
- Integrated into `/api/feed` route with fallback to chronological

---

### 6. TOOLS / HIVELAB

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Communities need custom functionality beyond posts |
| Actor | Leaders (builders), Members (users), Admins (curators) |
| Outcome | Custom tools that serve specific community needs |
| Alternative | External tools (fragmentation), custom development (expensive) |

**Technical Status: 30%**

---

### 7. CALENDAR / EVENTS

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Campus events are scattered, hard to discover |
| Actor | Members (attendees), Leaders (organizers) |
| Outcome | Unified event discovery and RSVP |
| Alternative | Google Calendar (no discovery), Instagram stories (ephemeral) |

**Technical Status: 50%**

---

### 8. NOTIFICATIONS

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Users miss important updates and interactions |
| Actor | All users |
| Outcome | Timely awareness of relevant activity |
| Alternative | Checking manually, email (delayed) |

**Technical Status: 20%**

---

### 9. REAL-TIME INFRASTRUCTURE

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Stale content feels dead, users want live interaction |
| Actor | All users (implicitly) |
| Outcome | Instant updates, presence awareness, live collaboration |
| Alternative | Polling (laggy), manual refresh (friction) |

**Technical Status: 60%** ✅ UPDATED

**Recent Fixes (Nov 28, 2024):**
- Fixed SSE broadcast null controller bug - broadcasts now actually send to connected clients
- Stored controller reference in SSEConnection for proper broadcasting
- Added cleanup of controller on connection close

---

### 10. SOCIAL / CONNECTIONS

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Meeting people on campus is hard |
| Actor | All users |
| Outcome | Network of campus connections |
| Alternative | Following on Instagram (passive), exchanging numbers (manual) |

**Technical Status: 40%**

---

### 11. PRIVACY CONTROLS

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Users want control over their visibility |
| Actor | All users |
| Outcome | Confidence that privacy preferences are respected |
| Alternative | Separate accounts, not participating |

**Technical Status: 10%**

---

### 12. SEARCH

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Finding specific content/people/spaces is hard |
| Actor | All users |
| Outcome | Quick access to specific items |
| Alternative | Browsing (slow), asking someone (friction) |

**Technical Status: 70%** ✅ UPDATED

**Recent Fixes (Nov 28, 2024):**
- Replaced mock data with real Firestore queries
- Searches spaces, profiles, posts, tools with campus isolation
- Uses prefix matching on `name_lowercase`, `handle`, `displayName_lowercase`
- Respects privacy settings (skips private profiles)
- Filters moderated content (isHidden)
- Parallel query execution for performance
- Note: For full-text search, consider Algolia/Typesense integration

---

### 13. ACTIVITY / ANALYTICS

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Users and leaders need insight into engagement |
| Actor | Users (self), Leaders (community), Admins (platform) |
| Outcome | Actionable insights on activity |
| Alternative | Manual observation, no data |

---

### 14. RITUALS

**Value Proposition**
| Dimension | Analysis |
|-----------|----------|
| Problem | Communities need structured engagement beyond posts |
| Actor | Leaders (creators), Members (participants), Admins (curators) |
| Outcome | Time-bound, gamified engagement experiences |
| Alternative | Manual challenges, external tools |

**9 Archetypes (Design Only)**

1. FOUNDING_CLASS - Limited-time founding member badge
2. LAUNCH_COUNTDOWN - Countdown with daily unlocks
3. BETA_LOTTERY - Random selection
4. UNLOCK_CHALLENGE - Challenge-based unlocking
5. SURVIVAL - Elimination/attrition
6. LEAK - Anonymous content with accountability
7. TOURNAMENT - Competitive voting/bracket
8. FEATURE_DROP - Feature usage tracking
9. RULE_INVERSION - Inverted behavior rules

**Technical Status: 10%**

---

### 15. ADMIN DASHBOARD

**Technical Status: 40%**

---

### 16. CAMPUS / SCHOOLS

**Technical Status: 15%**

---

### 17. CONTENT MODERATION

**Technical Status: 35%**

---

### 18. FEATURE FLAGS

**Technical Status: Functional**

---

## Cross-Slice Analysis

### Dependency Map

```
Auth ─────► Onboarding ─────► Profile
                │                │
                ▼                ▼
            Spaces ◄────────► Feed
                │                │
                ▼                ▼
         Events/Calendar     Tools
                │                │
                └───► Rituals ◄──┘
                         │
              Real-time ─┴─ Notifications
```

### Cold Start Problems

| Slice       | Severity | Mitigation                             |
| ----------- | -------- | -------------------------------------- |
| Feed        | High     | Seed with space content, trending      |
| Spaces      | High     | Pre-created spaces, leader recruitment |
| Events      | Medium   | Admin-seeded campus events             |
| Tools       | Medium   | Curated marketplace                    |
| Connections | Medium   | Suggested from shared spaces           |

### Value Multipliers

| Combination               | Effect                              |
| ------------------------- | ----------------------------------- |
| Spaces + Feed             | Content flows to right audience     |
| Notifications + Real-time | Immediate awareness drives return   |
| Rituals + Spaces          | Gamification boosts engagement      |
| Tools + Spaces            | Custom functionality differentiates |
| Events + Calendar         | Discovery + personal planning       |

---

## Critical Blockers

### Tier 1: Security & Data Loss

| Issue                                        | Slice      | Impact                             | Severity |
| -------------------------------------------- | ---------- | ---------------------------------- | -------- |
| **Dev password `hive123` visible in UI**     | Auth       | Anyone can see hint                | CRITICAL |
| **Admin auth uses hardcoded test token**     | Admin      | Anyone with test token is admin    | CRITICAL |
| **Non-leader students lose onboarding data** | Onboarding | Data loss when redirected to /feed | CRITICAL |
| **Campus ID hardcoded `'ub-buffalo'`**       | Social     | Multi-tenant broken                | CRITICAL |
| **CURRENT_CAMPUS_ID is static constant**     | Campus     | No multi-campus support            | CRITICAL |

### Tier 2: Core Features Broken

| Issue                                           | Slice      | Impact                        | Severity |
| ----------------------------------------------- | ---------- | ----------------------------- | -------- |
| **Feed algorithm is stub (chronological only)** | Feed       | No personalization            | CRITICAL |
| **SSE broadcast passes null controller**        | Real-time  | Messages don't reach clients  | CRITICAL |
| **Search returns hardcoded mock data**          | Search     | Users can't find content      | CRITICAL |
| **Privacy/Ghost mode not enforced**             | Privacy    | Settings exist but ignored    | CRITICAL |
| **Hidden content still visible in queries**     | Moderation | Moderation actions don't work | CRITICAL |
| **AI analysis returns random mock data**        | Moderation | Can't trust automated actions | CRITICAL |

### Tier 3: Features Stubbed

| Issue                                            | Slice         | Impact                            | Severity |
| ------------------------------------------------ | ------------- | --------------------------------- | -------- |
| **Tool AI generator not implemented**            | Tools         | Can't create tools without code   | HIGH     |
| **No visual tool builder**                       | Tools         | Requires engineering skill        | HIGH     |
| **Ritual archetypes: design only, no execution** | Rituals       | Rituals don't actually work       | HIGH     |
| **Notification generation missing**              | Notifications | Notifications never sent          | HIGH     |
| **Permission model inconsistent**                | Spaces        | createdBy vs admin role confusion | HIGH     |

---

## Slice-by-Slice Technical Status

### 1. AUTHENTICATION - 60%

**What Works:**

- Magic link flow (send → verify → session)
- JWT cookie session (30-day expiry)
- Password login (dev mode)
- Handle availability checking

**What's Broken:**

- Dev password `hive123` visible in login page hint
- Password login always redirects to /onboarding (ignores completion)
- No session refresh mechanism
- Admin email detection is case-sensitive (fragile)

**Critical Files:**

- `apps/web/src/app/api/auth/send-magic-link/route.ts`
- `apps/web/src/app/api/auth/verify-magic-link/route.ts`
- `apps/web/src/app/auth/login/page.tsx` (has password hint)

---

### 2. ONBOARDING - 50%

**What Works:**

- Multi-step form with user type branching
- Handle reservation with Firestore transaction
- Progress tracking via step state
- Data validation with Zod

**What's Broken:**

- Non-leader students ejected to /feed, **data not saved**
- No progress persistence (refresh = start over)
- Leader step completion not gated
- Alumni flow just joins waitlist (inconsistent)

**Business Logic Flow:**

```
Student: userType → identity → profile → interests → leader
         ├─ "No, not a leader" → REDIRECT TO /FEED (DATA LOST!)
         └─ "Yes, leader" → spaces → complete

Faculty: userType → facultyProfile → spaces → complete

Alumni: userType → alumniWaitlist → redirect (no real profile)
```

**Critical Files:**

- `apps/web/src/components/onboarding/hooks/use-onboarding.ts`
- `apps/web/src/app/api/auth/complete-onboarding/route.ts`
- `apps/web/src/components/onboarding/steps/leader-step.tsx`

---

### 3. USER PROFILES - 55%

**What Works:**

- Profile CRUD via API
- Privacy settings schema
- Completion tracking (handle + fullName)
- Photo upload endpoint exists

**What's Broken:**

- EnhancedProfile DDD model exists but **not used** by API
- Handle change doesn't clean up old reserved doc
- Profile stats calculated inline (expensive)
- No soft-delete (orphaned data on account deletion)

**Schema:**

```typescript
{
  id, email, emailVerified, campusId, schoolId,
  fullName, firstName, lastName, handle, major, graduationYear,
  bio, avatarUrl, academicLevel, dorm, housing, pronouns,
  interests[], connections[],
  onboardingCompleted, isPublic, isAdmin, isBuilder,
  createdAt, updatedAt
}
```

**Critical Files:**

- `apps/web/src/app/api/profile/route.ts`
- `packages/core/src/domain/profile/aggregates/enhanced-profile.ts` (unused)

---

### 4. SPACES - 55%

**What Works:**

- Space CRUD with campus isolation
- Membership join/leave
- Posts/comments/reactions
- Events with RSVP
- RSS seeding

**What's Broken:**

- Permission model inconsistent (`createdBy` vs `admin` role)
- Request-to-lead workflow undefined
- Slug uniqueness not enforced
- Approval flow exists but no pending queue tracking
- Tab/widget configuration not validated

**Permission Model (Actual):**

```
ADMIN: createdBy === userId OR role === 'admin'
       (inconsistent checks across endpoints)

MEMBER: Can view, post, comment, react
        (role checks vary by endpoint)
```

**Critical Files:**

- `apps/web/src/app/api/spaces/[spaceId]/route.ts`
- `apps/web/src/app/api/spaces/[spaceId]/members/route.ts`
- `packages/core/src/domain/spaces/aggregates/enhanced-space.ts`

---

### 5. FEED - 30%

**What Works:**

- Basic timeline (chronological order)
- Cursor-based pagination
- Campus isolation
- Item type schema (post, event, tool, system)

**What's Broken:**

- **Algorithm is completely stub** - just reverse chronological
- No personalization (all users see same feed)
- No engagement tracking (views, clicks)
- Cold start unhandled (new users see empty/irrelevant feed)
- Trending score calculated but never used
- Real-time updates not implemented

**Algorithm (Actual):**

```typescript
// This is ALL the feed does:
posts = await query.orderBy("createdAt", "desc").limit(limit);
return posts;
// No ranking, no personalization, no engagement weighting
```

**Critical Files:**

- `apps/web/src/app/api/feed/route.ts`
- `apps/web/src/app/api/feed/algorithm/route.ts` (exists but not called)

---

### 6. TOOLS / HIVELAB - 30%

**What Works:**

- Tool schema with types (template, visual, code, wizard)
- Deployment model (profile/space targets)
- State management per user per deployment
- Rate limiting (10/hour)

**What's Broken:**

- **AI generator not implemented** - mock only
- **No visual builder UI** - can't create tools
- Tool execution handlers are stubs (return fixed data)
- Marketplace returns empty array
- Deployment management UI incomplete

**Tool Execution Actions:**

```
initialize → stub
submit_form → stub
update_counter → stub (doesn't aggregate across users)
start_timer → stub (doesn't track elapsed time)
submit_poll → stub (single response only)
```

**Critical Files:**

- `apps/web/src/app/api/tools/execute/route.ts`
- `apps/web/src/app/api/tools/browse/route.ts` (returns empty)
- `apps/web/src/app/hivelab/*`

---

### 7. RITUALS - 10%

**What Works:**

- 9 archetype schemas fully designed (100+ lines each)
- Phase machine defined (draft → announced → active → cooldown → ended)
- Admin listing by phase
- EnhancedRitual aggregate with methods

**What's Broken:**

- **No execution logic** - schemas only, no runtime
- No ritual API endpoints (create, update, join, participate)
- No phase transition automation
- No participation tracking API
- Admin can list but not create/edit

**Critical Files:**

- `packages/core/src/domain/rituals/archetypes.ts`
- `apps/admin/src/app/rituals/page.tsx`

---

### 8. CALENDAR / EVENTS - 50%

**What Works:**

- Personal + space event model
- Event CRUD
- RSVP tracking
- Date range filtering
- Role-based creation (leaders only)

**What's Broken:**

- No event creation UI (backend ready)
- Recurring events defined but not implemented
- Calendar sync not implemented (no Google Calendar)
- Dev mode returns mocks for `test-user` (security)

**Critical Files:**

- `apps/web/src/app/api/calendar/route.ts`
- `apps/web/src/app/api/spaces/[spaceId]/events/route.ts`

---

### 9. SOCIAL / CONNECTIONS - 40%

**What Works:**

- Auto-connection based on shared attributes
- Strength scoring (major: +30, dorm: +40, year: +10, space: +20)
- Bidirectional connections
- Like/comment/share/bookmark interactions

**What's Broken:**

- **Campus hardcoded to `'ub-buffalo'`** - multi-tenant broken
- Connection detection requires manual POST trigger
- Friends system separate and not wired
- No mention/tag parsing (@user, #space)
- No blocking mechanism
- `engagement` vs `reactions` objects redundant

**Critical Files:**

- `apps/web/src/app/api/connections/route.ts` (hardcoded campus)
- `apps/web/src/app/api/social/interactions/route.ts`

---

### 10. NOTIFICATIONS - 20%

**What Works:**

- Notification storage (Firestore)
- Mark read/unread
- Real-time listener via Firebase
- Browser notification API + sound

**What's Broken:**

- **No notification generation** - nothing creates notifications
- Dual storage path (API vs hook use different collections)
- `category` vs `type` field naming inconsistent
- No email/push notifications
- No notification grouping (10 likes = 10 notifications)

**Critical Files:**

- `apps/web/src/app/api/notifications/route.ts`
- `apps/web/src/hooks/use-notifications.ts`

---

### 11. REAL-TIME - 20%

**What Works:**

- Connection tracking (Firestore)
- Channel model (`type:id:subtype`)
- Message queueing for offline users
- Presence storage

**What's Broken:**

- **SSE broadcast passes null controller** - messages never reach clients
- WebSocket endpoint is REST API (not actual WebSocket)
- Three competing systems (SSE, "WebSocket", Firebase Realtime)
- Typing indicators stored but never delivered
- No cleanup for stale connections

**Code Evidence:**

```typescript
// SSE Service - BROKEN
private broadcastMessage(message: RealtimeMessage): void {
  for (const connection of targetConnections) {
    this.sendSSEMessage(null, { // NULL = no delivery
      type: 'message',
      data: message
    });
  }
}
```

**Critical Files:**

- `apps/web/src/lib/sse-realtime-service.ts`
- `apps/web/src/app/api/realtime/sse/route.ts`

---

### 12. SEARCH - 0%

**What Works:**

- Endpoint exists
- Scoring algorithm defined
- Category filtering

**What's Broken:**

- **Returns hardcoded mock data** - no database queries
- 4 spaces, 4 tools, 3 people, 3 events, 3 posts (all fake)
- No full-text search implementation
- No privacy filtering (ghost users still searchable)

**Critical Files:**

- `apps/web/src/app/api/search/route.ts`

---

### 13. PRIVACY CONTROLS - 10%

**What Works:**

- Settings schema (ghost mode, visibility, data retention)
- Settings CRUD API
- Settings stored in Firestore

**What's Broken:**

- **Settings not enforced anywhere**
- Ghost mode users still appear in queries
- Activity still shown regardless of hideActivity
- Presence still broadcasts regardless of settings
- Profile visible to all regardless of showToPublic

**Critical Files:**

- `apps/web/src/app/api/privacy/route.ts`

---

### 14. ADMIN DASHBOARD - 40%

**What Works:**

- Admin app structure
- Activity logging (in-memory + Firestore)
- Builder queue view
- Content moderation dashboard shell
- User lookup/search

**What's Broken:**

- **Auth uses hardcoded test token** in development
- Falls back to `test-user` if `ADMIN_USER_IDS` not set
- Admin actions not logged to audit trail
- User suspend/ban endpoints missing
- Space deletion endpoint missing

**Critical Files:**

- `apps/admin/src/lib/admin-auth.ts`
- `apps/admin/src/components/comprehensive-admin-dashboard.tsx`

---

### 15. CONTENT MODERATION - 35%

**What Works:**

- Report submission with rate limiting (10/hour)
- 11 report categories, 4 severity levels
- Moderation service structure
- Automated rules engine (structure)

**What's Broken:**

- **AI analysis returns random mock data**
- Content snapshot doesn't capture original (only current state)
- `isHidden` set but **not filtered in queries** (content still visible)
- Automated rules match but don't execute actions
- No appeal process (field exists, no implementation)
- Reporter trust score captured but not used

**Critical Files:**

- `apps/web/src/lib/content-moderation-service.ts`
- `apps/web/src/lib/automated-moderation-workflows.ts`

---

### 16. CAMPUS / SCHOOLS - 15%

**What Works:**

- Schools collection query
- Campus detection endpoint structure
- `campusId` field used in queries

**What's Broken:**

- **Campus detection returns mock/null in production**
- `CURRENT_CAMPUS_ID` is static constant (`'default_campus'`)
- No runtime tenant context
- Schools collection may be empty in production
- No campus switcher UI
- Cross-campus access not prevented (just returns nothing)

**Critical Files:**

- `apps/web/src/app/api/campus/detect/route.ts`
- `apps/web/src/lib/secure-firebase-queries.ts` (CURRENT_CAMPUS_ID)

---

## Priority Fix Roadmap

### Phase 1: Security Fixes (Week 1)

1. Remove dev password from login UI
2. Fix admin auth (proper JWT, remove test token)
3. Fix campus hardcoding in connections
4. Remove test-user bypasses from production paths

### Phase 2: Data Integrity (Week 1-2)

1. Fix onboarding data loss (save before leader step)
2. Add progress persistence to onboarding
3. Validate handle reservation before completion

### Phase 3: Core Feature Fixes (Week 2-3)

1. Implement feed ranking algorithm
2. Fix SSE broadcast (or switch to Socket.io)
3. Implement real search (Algolia or Firestore full-text)
4. Enforce privacy settings in queries

### Phase 4: Feature Completion (Week 3-4)

1. Implement notification generation triggers
2. Fix content moderation (filter isHidden in queries)
3. Clarify space permission model
4. Implement ritual participation API

### Phase 5: Nice-to-Have (Post-Launch)

1. Visual tool builder
2. AI tool generation
3. Ritual execution logic per archetype
4. Calendar sync
5. Email notifications

---

## Systemic Issues

### Architecture Problems

| Issue                               | Impact              | Affected Slices               |
| ----------------------------------- | ------------------- | ----------------------------- |
| DDD models exist but not integrated | Wasted abstraction  | Profile, Spaces               |
| Inconsistent error handling         | Poor UX             | All                           |
| Permission model fragmented         | Security risk       | Auth, Spaces                  |
| No transaction rollback             | Data corruption     | Onboarding, Spaces            |
| Campus isolation inconsistent       | Multi-tenant broken | Auth, Profile, Spaces, Social |

### Data Quality Issues

| Issue                 | Impact                                     |
| --------------------- | ------------------------------------------ |
| Orphaned handles      | Deleted users leave reserved handles       |
| Orphaned spaces       | Deleted leaders leave spaces without admin |
| Incomplete profiles   | Users marked complete with null fields     |
| Stale trending scores | Never recalculated                         |

### Performance Issues

| Bottleneck                           | Impact                       |
| ------------------------------------ | ---------------------------- |
| Profile fetch = 3+ reads per request | Slow, expensive              |
| No Firestore indexes                 | Full scans on cursor queries |
| In-memory feed sorting               | Can't scale                  |
| No query caching                     | Repeated queries per session |

---

## Onboarding Deep-Dive

### Issues to Fix

#### 1. CRITICAL: Non-leader students lose data

**Problem:** When students select "No, I'm not a leader" on the leader step, they're redirected to /feed and all onboarding data is lost.

**Root Cause:** `use-onboarding.ts` calls `submitOnboarding()` only after spaces step, but non-leaders skip spaces and redirect directly.

**Fix:** Call `submitOnboarding()` BEFORE the leader step redirect

#### 2. HIGH: No progress persistence

**Problem:** If user refreshes page mid-onboarding, all data is lost.

**Fix:** Add localStorage persistence for form data

#### 3. MEDIUM: Leader step completion not gated

**Problem:** Users can click "Yes, I'm a leader" but skip the spaces step and still be marked complete.

**Fix:** Require at least one space selection before completion

### Files to Modify

- `apps/web/src/components/onboarding/hooks/use-onboarding.ts`
- `apps/web/src/components/onboarding/steps/leader-step.tsx`
- `apps/web/src/components/onboarding/steps/spaces-step.tsx`
- `apps/web/src/app/api/auth/complete-onboarding/route.ts`

### Estimated Effort

| Task                         | Time        |
| ---------------------------- | ----------- |
| Fix data loss (critical)     | 2 hours     |
| Add localStorage persistence | 2 hours     |
| Gate leader completion       | 1 hour      |
| Testing                      | 2 hours     |
| **Total**                    | **7 hours** |

---

## Key Metrics Dashboard (Proposed)

| Metric                 | Slice         | Target |
| ---------------------- | ------------- | ------ |
| Onboarding completion  | Onboarding    | >80%   |
| Profile completion     | Profiles      | >70%   |
| Spaces joined (avg)    | Spaces        | ≥3     |
| Weekly active in feed  | Feed          | >50%   |
| Events RSVP'd (weekly) | Events        | >20%   |
| Connections (avg)      | Social        | ≥5     |
| Notification CTR       | Notifications | >30%   |
