# HIVE Unified Enhancement Plan

> ⚠️ **Stale — Feb 22 2026.** Live numbers: spaces: 1,174 | events: 2,772 | routes: 268+ | users: 4 | posts: 0 | campuses: 0.
> System grades and cross-dependency map are directionally accurate. Phase 1 status updated below — see each item.
> For current blockers: `docs/KNOWN_STATE.md` → Launch Blockers.

> Synthesis of 8 deep system audits. Every recommendation connects to one outcome: **a student signs up, finds their people, builds something, and comes back tomorrow.**

---

## System Health Snapshot

| System | Grade | Completeness | Verdict |
|--------|-------|-------------|---------|
| Auth + Identity | B+ | 85% | Solid foundation, hardcoded to UB, no returning-user login |
| Profile + Social Graph | A- | 90% | Ship-ready, DMs built but hidden behind flag |
| Feed + Discovery | C+ | 60% | Hollow — activity feed only tracks member joins, all counters show 0 |
| Navigation + Routing | B | 75% | 60+ routes work, but "Spaces" nav is dead, 3 overlapping profile URLs |
| Moderation + Security | B+ | 80% | Strong auth/RBAC, but content moderation not wired into APIs |
| Design System + Motion | A- | 90% | 91 primitives, 177 stories, ~20 files with hardcoded colors |
| Admin Dashboard | B+ | 85% | 21 pages, 59 API routes, missing email service |
| HiveLab (IDE) | B | 75% | Canvas works, AI generation exists, dashboard prompt broken |
| Spaces | B | 70% | Core works, 7-day gate blocks new users, deploy dead-end |

---

## Cross-System Dependencies (Why Fixing One Unlocks Others)

```
Remove 7-day gate ──────────────────────────────────────► User creates space
        │                                                       │
        │                                                       ▼
        │                                         Space → HiveLab link (Fix 9)
        │                                                       │
        │                                                       ▼
Fix dashboard prompt (Fix 2) ──────────────────────► AI generates tool
        │                                                       │
        │                                                       ▼
        │                                         Deploy to profile/space (Fix 4)
        │                                                       │
        │                                                       ▼
Enable notifications (Fix 6) ◄────────── Activity feed writes real events
        │                                           │
        │                                           ▼
        │                              Online presence + unread counts work
        │                                           │
        ▼                                           ▼
Enable DMs (flag flip) ◄──────────── Social proof in recommendations works
        │
        ▼
User comes back tomorrow
```

**Key insight:** The activity feed, online presence, and notification systems are all *built* but not *connected*. Fixing the connective tissue between systems has outsized impact.

---

## Phase 1: Unblock the Flow (Days 1-2)

These are the P0 blockers from the single-user spec. Nothing else matters until a new user can complete the core loop.

### 1.1 Remove 7-Day Space Creation Gate — **🔴 STILL OPEN**
**Effort:** 15 min | **Impact:** Unblocks entire flow

**File:** `apps/web/src/app/api/spaces/route.ts:160-168` (confirmed still there Feb 22)

Remove the 7-day account age check. Keep email verification (already exists on next line) and daily limit of 3.

**Why this is safe:** User-created spaces already bypass quorum via `createdBy` check in `enhanced-space.ts:1057-1071`. The email verification requirement is sufficient fraud prevention.

---

### 1.2 Dashboard Prompt → AI Generation
**Effort:** 2-4 hrs | **Impact:** Makes HiveLab magic moment work

**Files:**
- `apps/web/src/app/lab/page.tsx` — `handleSubmit`
- `apps/web/src/app/lab/[toolId]/page.tsx` — IDE initialization

**Change:** When user types prompt on `/lab` dashboard:
1. Create tool via `POST /api/tools` (as now)
2. Navigate to `/lab/${toolId}?prompt=${encodedPrompt}`
3. IDE auto-fires generation when `?prompt` is present on mount

The IDE already accepts `initialPrompt` prop. The fix is ensuring `HiveLabIDE` auto-triggers `/api/tools/generate` when `initialPrompt` is non-empty.

---

### 1.3 Fix "Spaces" Nav — **✅ FIXED**
**Effort:** 1-2 hrs | **Impact:** Second nav pillar works

**File:** `apps/web/src/app/spaces/page.tsx` — currently `router.replace('/home')`

**Simplest fix:** Change nav href from `/spaces` to `/explore` in `apps/web/src/lib/navigation.ts`. The `/explore` page already works as a discovery hub.

**Better fix:** Make `/spaces` a real page with My Spaces (top) + Discover (bottom). If 0 spaces, show discovery prominently with Create CTA.

---

### 1.4 Dynamic campusId in IDE
**Effort:** 15 min | **Impact:** Multi-campus correctness

**File:** `apps/web/src/app/lab/[toolId]/page.tsx:302`

Replace `campusId: 'ub-buffalo'` with `campusId` from session. This is one of 710 hardcoded `ub-buffalo` references across 166 files, but this one directly breaks tool creation for non-UB campuses.

---

### 1.5 Deploy Page → Profile Fallback
**Effort:** 1-2 hrs | **Impact:** Unblocks deployment for users with 0 spaces

**File:** `apps/web/src/app/lab/[toolId]/deploy/page.tsx`

Add "Deploy to My Profile" as always-available option + "Create a Space" CTA with return-to-deploy flow.

---

## Phase 2: Connect the Systems (Days 3-5)

These fixes wire existing infrastructure together. Most of this code is *built* but not *connected*.

### 2.1 Activity Feed: Write Real Events
**Effort:** 4-6 hrs | **Impact:** Feed stops being hollow

**Current state:** Only member joins write to `activities` collection. Events, tool deployments, space messages, and tool runs don't generate activity.

**Files to modify:**
- `apps/web/src/app/api/spaces/[spaceId]/events/route.ts` — write activity on event create
- `apps/web/src/app/api/tools/[toolId]/deploy/route.ts` — write activity on tool deploy
- `apps/web/src/app/api/spaces/[spaceId]/chat/route.ts` — write activity on first message
- `apps/web/src/app/api/tools/[toolId]/execute/route.ts` — write activity on tool run

**Pattern:** Each API route adds a Firestore write to `activities` collection after the primary operation succeeds. The activity feed rendering already handles multiple activity types — it just needs data.

---

### 2.2 Online Presence + Unread Counts
**Effort:** 3-4 hrs | **Impact:** Spaces feel alive instead of dead

**Current state:** Online counts always show 0, unread badges always show 0.

**Online presence:** Firebase RTDB path `/presence/{userId}` needs to be written on page load and cleaned up on disconnect. The rendering logic exists but no client writes presence.

**Unread counts:** Space unread badge needs a `lastRead` timestamp per user per space, compared against latest message timestamp. The badge component exists but the comparison logic returns 0.

---

### 2.3 Notification Bell + Real Events
**Effort:** 4-6 hrs | **Impact:** Social signal loop starts

**File:** `apps/web/src/components/layout/AppShell.tsx`

**Build:**
1. Bell icon in header (desktop: top-right, mobile: in header bar)
2. Dropdown panel with recent notifications
3. Unread count badge
4. Graceful empty state

**Wire to events:**
- New space member → notification to space leaders
- Event RSVP → notification to event creator
- Tool deployment → notification to space leaders
- DM received → notification to recipient (when DMs enabled)

**Infrastructure:** Firestore `notifications` collection already exists in security rules. Need to write to it from API routes and read from it in the bell component.

---

### 2.4 Enable DMs (Feature Flag Flip) — **🟡 DEFERRED**
**Effort:** 2-4 hrs | **Impact:** Users can actually communicate

**Current state (Feb 22):** DMs intentionally OFF at launch. `enable_connections` flag IS on (social graph live). DMs deferred to post-launch.

**What's needed:**
1. Flip `enable_dms` flag ON
2. Wire DM panel component into AppShell (the `DMContext` provider is already global)
3. Ensure Message button appears on profile pages
4. Add DM notifications to the bell (Fix 2.3)

---

### 2.5 Space → HiveLab Link
**Effort:** 1 hr | **Impact:** Connects the two flagship features

**Files:**
- `apps/web/src/app/s/[handle]/components/sidebar/tools-list.tsx`
- Space settings → Tools tab

Add "Build a Tool" button in space sidebar (tools section). Links to `/lab?spaceId=${spaceId}` which pre-selects deploy target.

---

### 2.6 Mobile Nav Hamburger
**Effort:** 30 min | **Impact:** Settings/sign-out reachable on mobile

**File:** `apps/web/src/components/layout/AppShell.tsx`

Add hamburger icon to mobile header that opens existing `MobileNav` drawer. The drawer component already has Settings and Sign Out.

---

## Phase 3: Social Proof & Recommendations (Days 6-8)

The recommendation engine uses behavioral psychology scoring but social proof is broken because connections data doesn't exist in production.

### 3.1 Fix Social Proof in Recommendations
**Effort:** 2-3 hrs | **Impact:** "Where your friends are" actually works

**File:** `apps/web/src/app/api/spaces/recommended/route.ts`

**Current state:** `whereYourFriendsAre` always returns empty array. Social proof score (30% of recommendation weight) is always near-zero.

**Fix:** Query user's connections from `connections` collection, find their space memberships, boost those spaces in recommendations. The connections system is production-ready (`enable_connections` flag is ON).

---

### 3.2 Preview State in IDE
**Effort:** 2-4 hrs | **Impact:** Users can test tools before deploying

**File:** `apps/web/src/app/lab/[toolId]/page.tsx` — Use mode

**Change:** When in Use/Preview mode, use client-side state for interactive elements (poll votes, counters). State resets on refresh. Show clear "Preview Mode — deploy to make it live" indicator.

---

### 3.3 Profile URL Consolidation
**Effort:** 2 hrs | **Impact:** Eliminates confusion from 3 overlapping profile patterns

**Current state:**
- `/u/[handle]` — public profile (canonical)
- `/profile/[id]` — legacy profile by ID
- `/me` — own profile redirect

**Fix:** Make `/profile/[id]` redirect to `/u/[handle]` (look up handle from user doc). Keep `/me` as convenience redirect. Single canonical URL.

---

## Phase 4: Security Hardening (Days 9-10)

From the security audit. These don't block users but protect the platform.

### 4.1 Protect Waitlist Endpoints (P0 Security)
**Effort:** 30 min

**File:** `apps/web/src/app/api/waitlist/join/route.ts`

Add rate limiting (5 req/5min), input validation (Zod schema), CSRF protection. Currently has NO middleware at all.

### 4.2 Replace Regex XSS with DOMPurify (P0 Security)
**Effort:** 2 hrs

**File:** `apps/web/src/lib/security-middleware.ts`

Current regex-based XSS protection is easily bypassed (`<img onerror=alert(1)>`). Replace with DOMPurify or similar proper HTML sanitizer.

### 4.3 Wire Content Moderation into Post APIs (P1 Security)
**Effort:** 4 hrs

Content moderation service exists (`content-moderation-service.ts`) with AI/ML analysis, but is NOT called in any post/comment/message API route. Content enters DB without scanning.

Add pre-publish scanning calls in:
- Space chat POST
- Event creation POST
- Tool description updates
- Profile bio updates

### 4.4 Tighten CSP Headers (P1 Security)
**Effort:** 1 hr

Current CSP allows `unsafe-inline` and `unsafe-eval`. Remove these and use nonce-based inline scripts.

---

## Phase 5: Polish & Depth (Days 11-15)

### 5.1 Design Token Compliance Sweep
**Effort:** 3-4 hrs

~20 component files have hardcoded color values instead of using design tokens. Run automated scan, replace with token imports or CSS variables. Priority files:
- `Textarea.tsx` — hardcoded gradient `rgba(48,48,48,1)`
- `Separator.tsx` — hardcoded shadow `rgba(0,0,0,0.4)`
- `Switch.tsx` — hardcoded thumb `#0a0a09`
- Various landing components

### 5.2 Clean Up Redirect Chains
**Effort:** 1 hr

**Current chains:**
- `/browse` → `/spaces` → `/home` (2 hops)
- `/spaces` → `/home` (will be fixed in Phase 1)

Replace all multi-hop redirects with single-hop.

### 5.3 Admin Email Service
**Effort:** 4-6 hrs

No email service exists. `sendSuspensionEmail` is a stub. Need:
- SendGrid or SES integration
- Templates for: suspension notice, waitlist notification, warning, welcome
- Email queue (Firestore-backed)

### 5.4 Admin Session Timeout
**Effort:** 2 hrs

Admin sessions last 24h with no idle timeout. Add 1h idle timeout with "extend session" prompt.

### 5.5 Hardcoded ub-buffalo Sweep (Systematic)
**Effort:** 4-8 hrs

710 occurrences of `ub-buffalo` across 166 files. Most are in seed scripts and test data (acceptable), but some are in:
- IDE page (Fix 1.4 handles this one)
- Campus context fallbacks
- Firestore security rules fallback
- Development defaults

For multi-campus launch, systematically audit and replace production-path hardcodes with dynamic campus resolution.

---

## The Connected Journey (After All Phases)

```
1. Student lands on hive → "Enter HIVE" → email verify → name → interests
2. Home: see recommended spaces WITH social proof ("3 friends here")
3. Notification: "Welcome to HIVE! Create your first space"
4. Create space (no gate) → immediately in their space
5. Space sidebar: "Build a tool" → /lab with space context
6. Type "poll for meeting time" → AI generates poll with elements
7. Preview mode: vote on poll, see it work client-side
8. Deploy → space pre-selected → one click → tool in space sidebar
9. Share invite link → first member joins → notification bell lights up
10. Online presence shows "1 member online" → space feels alive
11. Member votes on poll → activity feed shows "Alex voted on your poll"
12. DM from member → "hey this poll is cool" → social loop starts
13. Home feed: real activity from spaces, not just "X joined"
14. Recommendation: "Join Chess Club — 2 of your connections are members"
15. Come back tomorrow → unread badge on space → new messages waiting
```

**Total time from signup to working tool: under 5 minutes.**
**Time to first social interaction: under 10 minutes.**

---

## Priority Matrix

| Phase | Fixes | Effort | Impact | Unlocks |
|-------|-------|--------|--------|---------|
| **1** | Remove gate, AI prompt, fix nav, campusId, deploy fallback | 1-2 days | Critical | Core loop works |
| **2** | Activity feed, presence, notifications, DMs, Space→Lab, mobile nav | 3-5 days | High | Platform feels alive |
| **3** | Social proof, preview state, profile URLs | 2-3 days | Medium | Engagement deepens |
| **4** | Waitlist security, XSS, content moderation, CSP | 1-2 days | Security | Platform is safe |
| **5** | Token compliance, redirects, admin email, ub-buffalo sweep | 3-5 days | Polish | Multi-campus ready |

**Total: ~15 days of focused work to transform HIVE from a demo to a living platform.**

---

## What NOT to Touch (Deferred)

- Design system redesign (separate track, after features ship)
- Cross-campus federation
- Tool marketplace
- Gamification / leaderboards
- Voice / audio rooms
- Alumni features
- `canChat` dead code cleanup (cosmetic)
- Advanced connection features (tagging, grouping, circles)
- Distributed rate limiting (Redis/Upstash — needed at scale, not at launch)
- MFA for admins (needed post-launch)
- Mobile admin app

---

## System Grades After Enhancement

| System | Before | After | Change |
|--------|--------|-------|--------|
| Auth + Identity | B+ | A- | Dynamic campusId, session hardening |
| Profile + Social Graph | A- | A | DMs live, connection stats refresh |
| Feed + Discovery | C+ | B+ | Real activity events, working presence/unread |
| Navigation + Routing | B | A- | Fixed Spaces nav, cleaned redirects, single profile URL |
| Moderation + Security | B+ | A | Content scanning wired in, XSS fixed, waitlist protected |
| Design System + Motion | A- | A | Token compliance sweep |
| Admin Dashboard | B+ | A- | Email service, session timeout |
| HiveLab (IDE) | B | A- | AI prompt works, preview state, dynamic campusId |
| Spaces | B | A- | No gate, deploy works, linked to Lab, activity flows |

**Overall platform: B → A-**
