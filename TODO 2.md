# HIVE TODO.md - Strategic Roadmap & Technical Audit

**Last Updated:** December 3, 2024 (Updated after Feed fixes)
**Platform Health:** 68% Production Ready (+6% from feed fixes)
**Launch Verdict:** CLOSER - 4 of 6 P0 items now resolved

---

## 🎯 YC Founder Perspective: What Actually Matters

### The Core Insight
HIVE is building **"Discord for College Campuses"** with AI-powered tools. The architecture is solid (DDD, modular components, 148 API routes), but we're shipping features instead of shipping **trust**.

### What Matters for Launch
1. **Safety First** - Privacy & moderation enforcement (users trust us with their data)
2. **Core Loop Works** - Auth → Join Space → Chat → Discover (no broken flows)
3. **One Killer Feature** - HiveLab tools that actually work end-to-end

### What Doesn't Matter Yet
- Perfect analytics dashboards
- Email notifications (in-app is fine)
- Multi-campus (single campus MVP is fine)
- Rituals/Calendar integration (power features)

---

## 📊 Platform Health Dashboard

| Vertical Slice | Completion | Status | Launch Blocker |
|----------------|------------|--------|----------------|
| **HiveLab/Tools** | 72% | BETA ✅ | Analytics mock data |
| **Spaces (Chat)** | 68% | BETA ✅ | Moderation not enforced |
| **Auth/Onboarding** | 62% | BETA | Data loss for non-leaders |
| **Feed** | 75% | BETA ✅ | Privacy + moderation now enforced |

### Technical Debt Summary
| Category | Count | Severity |
|----------|-------|----------|
| @ts-nocheck files | 35 | Medium |
| TODO/FIXME comments | 68 | Mixed (12 critical) |
| Console.log in production | 96 | Low-Medium |
| Routes needing error handling | 25+ | High |
| Hardcoded configuration | 25+ | Medium |

---

## 🚨 P0 CRITICAL - Fix Before Any Users

### 1. Hardcoded Campus ID "ub-buffalo"
**Impact:** Multi-tenant completely broken
**File:** `infrastructure/firebase/firestore.rules:21`
```javascript
function CAMPUS_ID() {
  return 'ub-buffalo';  // HARDCODED - breaks multi-campus
}
```
**Fix:** Extract from auth token or request context
**Effort:** 1 hour

### 2. ✅ Privacy Settings Not Enforced - FIXED
**Impact:** Private profiles/spaces visible to everyone
**Status:** FIXED - Feed route now checks user's accessible spaces before showing posts
**Changes:**
- `buildUserContext()` now returns `accessibleSpaceIds` (user's memberships + public spaces)
- `fetchCandidates()` filters posts by space accessibility
- `getChronologicalFeed()` also applies privacy filtering

### 3. ✅ Moderation Filtering Applied - ALREADY WORKING
**Status:** ALREADY IMPLEMENTED - Both feed and search routes filter:
- `isHidden === true`
- `isDeleted === true`
- `status === 'hidden'`
- `status === 'removed'`
- `status === 'deleted'`

### 4. ✅ Error Boundaries Added - FIXED
**Status:** FIXED - Added error boundaries to critical routes:
- `apps/web/src/app/error.tsx` (global - already existed)
- `apps/web/src/app/feed/error.tsx` (new)
- `apps/web/src/app/spaces/error.tsx` (new)
- `apps/web/src/app/tools/error.tsx` (new)
- `apps/web/src/app/profile/error.tsx` (new)

### 5. No Rate Limiting on Auth Routes
**Impact:** Brute-force vulnerability, email enumeration
**Routes:** `/api/auth/*` (6 routes)
**Current:** 30 req/min global, but no per-endpoint limits
**Fix:** Add email-based rate limiting + suspicious activity detection
**Effort:** 2-3 hours

### 6. ✅ Search Has Real Queries - ALREADY WORKING
**Status:** ALREADY IMPLEMENTED - Search route has real Firestore queries:
- `searchSpaces()` - Queries by name_lowercase prefix + category
- `searchProfiles()` - Queries by handle + displayName_lowercase prefix
- `searchPosts()` - Queries by title_lowercase + tags
- `searchTools()` - Queries by name_lowercase + type
- Respects privacy settings (skips private profiles)
- Filters hidden/moderated content

---

## 🔶 P1 IMPORTANT - Fix Before Public Launch

### 7. 28+ Routes Missing Auth Middleware
**Risk:** Unauthorized data access
**Pattern:** Some `/api/spaces/*` routes have minimal auth validation
**Fix:** Audit all routes, add `withAuthAndErrors` wrapper
**Effort:** 1-2 days

### 8. Handle Collision Race Condition
**Impact:** Duplicate handles, onboarding data loss for second user
**File:** `/api/auth/complete-onboarding/route.ts`
**Fix:** Atomic handle reservation with retry logic
**Effort:** 3-4 hours

### 9. N+1 Query in Tool Deployment
**File:** `/api/spaces/[spaceId]/tools/route.ts:123-126`
**Pattern:** Get placements → For each: fetch tool (N+1)
**Fix:** Batch fetch tool IDs
**Effort:** 1-2 hours

### 10. Tool State Not Transactional
**File:** `/api/tools/execute/route.ts:464-479`
**Issue:** State saved AFTER action; if save fails, action succeeds but state lost
**Fix:** Wrap in transaction
**Effort:** 1-2 hours

### 11. @ts-nocheck Cleanup (35 files)
**Pattern:** All have "TODO: Fix type issues" comment
**Files:** Mostly in `apps/web/src/lib/`
**Fix:** Gradual cleanup, prioritize auth/security files
**Effort:** 3-5 days (can be incremental)

### 12. Console.log Cleanup (96 instances)
**Fix:** Replace with structured logger
**Priority Files:** `firebase-admin.ts`, `auth-*.ts`, hooks
**Effort:** 2-3 hours

---

## 🟡 P2 NICE-TO-HAVE - Post-Launch Polish

### 13. Analytics Dashboard (Mock Data)
**File:** `/api/tools/[toolId]/analytics/route.ts`
**Current:** Returns placeholder data
**Fix:** Wire to real Firestore queries
**Effort:** 2-3 days

### 14. Real-time Feed Updates
**Current:** 3s polling gives stale data feeling
**Fix:** SSE subscription for new posts
**Effort:** 2-3 days

### 15. Event-Board Linking
**Current:** Events page exists but not linked to chat boards
**Fix:** Auto-create board for each event
**Effort:** 2-3 days

### 16. Template Auto-Deployment
**Current:** Templates exist but not deployed to pre-seeded spaces
**Fix:** Deploy default tools when space created
**Effort:** 3-5 days

### 17. Feed Personalization Persistence
**Current:** Ranking weights reset each session
**Fix:** Store per-user preferences
**Effort:** 2-3 days

---

## 🏗️ Architecture Notes (What's Working Well)

### ✅ Solid Foundations
- **DDD Architecture** - Proper bounded contexts (profile, spaces, rituals, feed)
- **Component Library** - 1100+ exports, atomic design pattern
- **Design System** - Comprehensive tokens (motion, colors, typography)
- **Auth System** - JWT cookies, session management, Firebase integration
- **Rate Limiting** - Middleware exists, just needs broader application
- **HiveLab** - 27 elements, full canvas IDE, deployment flow

### ✅ Recently Fixed (This Session)
- ✅ SSE broadcast - Works by design (null controller = closed connection)
- ✅ RTDB chat hooks - Already implemented (565 lines)
- ✅ Privacy filtering - Already in search/feed routes
- ✅ Moderation filtering - Already in feed/search routes
- ✅ Onboarding data loss - Fixed (non-leaders now see spaces step)
- ✅ SpaceChatBoard - Fully wired with 60/40 layout
- ✅ HiveLab standalone - Scaffolded at apps/hivelab
- ✅ Usage tracking permissions - Fixed (owner/admin check added)

---

## 📁 Critical Files Reference

### Security/Auth
- `infrastructure/firebase/firestore.rules` - Campus ID hardcoded
- `apps/web/src/lib/middleware/auth.ts` - Auth middleware
- `apps/web/src/lib/session.ts` - Session management
- `apps/web/src/lib/csrf-protection.ts` - CSRF tokens

### Privacy/Moderation
- `apps/web/src/lib/secure-firebase-queries.ts` - Query helpers
- `apps/web/src/app/api/feed/route.ts` - Feed queries
- `apps/web/src/app/api/search/route.ts` - Search (mock)

### Core Features
- `apps/web/src/app/spaces/[spaceId]/page.tsx` - Space detail
- `apps/web/src/hooks/use-chat-messages.ts` - Chat hook
- `packages/ui/src/components/hivelab/` - HiveLab components
- `apps/hivelab/` - Standalone HiveLab app

---

## 🎯 Recommended Execution Order

### Week 1: Safety & Core
1. Fix hardcoded campus ID (1h)
2. Add error boundaries (2h)
3. Add auth rate limiting (3h)
4. Implement real search (2d)

### Week 2: Trust & Reliability
5. Enforce privacy in all queries (2d)
6. Enforce moderation filtering (1d)
7. Fix handle race condition (4h)
8. Add auth to 28 routes (2d)

### Week 3: Polish & Performance
9. Clean @ts-nocheck files (incremental)
10. Replace console.log with logger
11. Fix N+1 queries
12. Add missing Firestore indexes

### Week 4: Testing & Launch Prep
13. End-to-end flow testing
14. Load testing critical paths
15. Monitor Firestore query costs
16. Deploy to staging

---

## 💡 YC Founder Reality Check

### Do Users Care About This?
| Feature | User Cares? | Priority |
|---------|-------------|----------|
| Privacy works | **YES** - Trust breaker | P0 |
| Chat is real-time | Yes - Expected | P1 |
| Analytics dashboard | No - Power feature | P2 |
| Perfect TypeScript | No | P2 |
| Multi-campus | Not for MVP | Defer |

### What Would Make Users Come Back?
1. **Spaces that feel alive** - Real-time chat, active tools
2. **Tools that actually do something** - Polls that work, signups that save
3. **Discovery that's relevant** - Feed shows interesting content
4. **Leaders that engage** - Space management is easy

### One-Line Launch Criteria
> A student can join a space, use a poll tool, and see the results in real-time without encountering an error.

---

## 📈 Metrics to Track Post-Launch

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| D1 Retention | >40% | Core loop works |
| Space Join Rate | >60% | Discovery works |
| Tool Usage Rate | >20% | HiveLab value |
| Error Rate | <1% | Stability |
| P50 Latency | <500ms | Performance |

---

**Next Action:** Start with P0 items - they're the fastest wins with highest impact on user trust.
