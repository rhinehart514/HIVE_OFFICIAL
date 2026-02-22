# Known State — HIVE (Feb 2026)

---

## Ground Truth — Feb 22 2026
_Verified against live Firestore + local dev server. This is what actually exists._

### Live Data
| Collection | Count | Reality |
|---|---|---|
| events | ~2,772 | All real CampusLabs imports. 100 demo-seed docs deleted Feb 22. 76% have images. 100% have location + description. All `campusId: ub-buffalo`. |
| spaces | 1,174 | 199 live, 0 claimed, 0 with members (except 1). ~975 `org-*` with handles, ~199 `campuslabs-*` without. |
| users | 4 | Jacob + test accounts only. No real students. |
| tools | 19 | All created by Jacob. 0 use count, 0 fork count. |
| posts | 0 | Zero user-generated content. Feed is events-only. |
| campuses | 0 | Campus docs never created. `useCampusMode()` returns false everywhere. |

### System Status (PMF features)

**Feed (`/discover`)**
- Page renders ✓
- Events API (`/api/events/personalized`) — **BROKEN, 500** (see Broken section)
- Real events exist and are good quality once API is fixed — 371 in next 7 days, 76% have images
- Tool cards and space discovery cards render in feed body ✓
- Right panel: Next Up, Active Spaces, On Campus sections exist ✓

**Spaces (`/spaces` + `/s/[handle]`)**
- Browse page renders, returns real spaces with live event enrichment ✓
- Space URLs: `org-*` spaces resolve via handle. `campuslabs-*` spaces resolve via legacy ID fallback (URL is `/s/campuslabs-103556` — functional but ugly)
- Space events tab (`/api/events?spaceId=...`) — **BROKEN, returns 0** (same date type issue as personalized API)
- Join flow (`/api/spaces/join-v2`) — works ✓. Threshold doesn't block joining, only sets activationStatus.
- Space chat — wired ✓ but no messages yet
- Space posts tab — renders ✓ but 0 posts exist

**Auth (`/enter`)**
- OTP → JWT cookie flow exists ✓
- Dev bypass: `HIVE_DEV_BYPASS=true` in `.env.local`, user `dev-user-001` / `rhinehart514@gmail.com` ✓
- **Status: Not validated end-to-end as new user on Feb 22.** Last known good: ~Feb 14.

**Profile (`/u/[handle]` + `/me`)**
- **Black screen on load** — known bug, cause not yet diagnosed
- Profile page exists (731 lines in ProfilePageContent.tsx)
- Mutual spaces query missing

**HiveLab (`/lab`)**
- 33 elements registered, ~8 work standalone
- AI generation: Groq (`llama-3.3-70b-versatile`) is primary. Rules-based regex is fallback.
- `/api/tools/execute` — built Feb 19, handles 8 self-contained element types ✓
- Connection resolver built Feb 19 ✓

**Onboarding (5-screen flow)**
- Backend shipped Feb 13 ✓ — analytics wired, interest matching, reveal API, year/housing weighting
- Screen 5 (space recommendations) partially solves cold start
- **Frontend: not validated end-to-end Feb 22**

**Push Notifications**
- 18 types defined, FCM wired ✓
- **Not active** — needs env var flip (`NEXT_PUBLIC_FCM_VAPID_KEY` or similar). One-line enablement.

### TODO-LAUNCH.md is stale
That doc targets Feb 14 launch. Most checklist items are still relevant but treat it as a backlog, not a current plan. The design violation items (703 opacity instances, 359 radius instances) are real debt but not launch blockers. The functional items in section 5 are still valid.

### Launch Blockers (Feb 22 assessment)
1. **Events API 500** — fix the date type mismatch (see Broken section)
2. **Auth flow** — needs end-to-end validation as a new user
3. **Profile black screen** — blocks identity layer
4. **Space events returning 0** — same fix as #1
5. **7-day account age gate on space creation** — `apps/web/src/app/api/spaces/route.ts:167`. New users cannot create a space until their account is 7 days old. Kills first-session activation. Remove or reduce to 0 for first space only.

---

## Recently Fixed
- Vercel build errors and warnings (dead imports, stale exports)
- Crons downgraded to daily for Hobby plan
- getFeedRepository null assertion stub
- Calendar sync 404 — replaced with "coming soon" placeholder in settings
- FeedTease "coming soon" promises removed from discover feed
- `enable_connections` flag enabled — social graph API now live
- `/api/feedback` — now persists to Firestore `feedback` collection
- `/api/tools/recommendations` — real scoring engine (usage + space overlap + interests + recency)

## Working Well
- All 10 interactive HiveLab elements with execute handlers
- Real-time state sync via SSE
- 30 quick templates with quick deploy
- Full space management (CRUD, members, chat, events, tools)
- Auth flow (OTP -> JWT cookies)
- ~248/268 API routes fully implemented
- Connections / social graph (follow, mutual friends, friend counts in feed)
- Tool recommendations with personalized scoring

## Stubs / Not Implemented
- `/api/tools/browse` — no export
- `/api/campus/dining/*` — no exports (3 routes)
- `/api/auth/alumni-waitlist` — no export
- `/api/auth/verify-access-code` — no export
- `/api/onboarding/matched-spaces` — no export
- `/api/notifications/stream` — SSE, no export
- `/api/qr` — no export

## Architectural Gaps
- Element-to-element connections don't flow data (only custom-block supports it)
- Computed fields in tool_states mentioned but no handlers
- Automations UI exists but backend logic is minimal
- Some admin routes use raw dbAdmin queries instead of repositories
- Mix of `NextResponse.json()` and `respond.*` in older routes
- Calendar sync routes not yet built (UI shows "coming soon" placeholder)
- DMs: feature flag only, zero routes, zero UI (intentionally deferred)
- Rituals: domain model exists, no UI (intentionally deferred)

---

## Broken — Feb 22 2026
_Confirmed broken via live testing. Read before touching these routes._

### `/api/events/personalized` — 500 on every request
**Root cause:** Fallback query uses `where('campusId', '==', campusId)` which throws
`FAILED_PRECONDITION` because the `campusId` single-field index is exempted.
The indexed queries (`startDate`/`startAt`) return 0 results because real CampusLabs
events store `startDate` as ISO string but the query passes a `Date` object (type mismatch).
**Fix:** Replace fallback with `where('startDate', '>=', start.toISOString()).orderBy('startDate')`.
See FIRESTORE_SCHEMA.md → Critical Data Gotchas for the correct query pattern.

### `/api/events` (space-scoped) — returns 0 events
**Root cause:** Same type mismatch — passes `new Date()` to `where('startDate', '>=', now)`
but `startDate` is an ISO string. Firestore type comparison returns 0 results.
**Fix:** Use `now.toISOString()` when filtering on `startDate` field specifically.
The `startAt` Timestamp field can continue using a `Date` object.

### `coverImageUrl` missing from personalized events response
**Root cause:** API maps `event.coverImageUrl` but Firestore stores it as `event.imageUrl`.
**Fix:** `coverImageUrl: (event.imageUrl || event.coverImageUrl) as string | undefined`

### `spaceHandle` missing from personalized events response
**Root cause:** `spaceHandle` doesn't exist on event documents. API was passing through
`event.spaceHandle` which is always `undefined`.
**Fix:** Batch-fetch space handles from spaces collection using `spaceId` as doc ID.
Use `Promise.allSettled` with individual `.doc(id).get()` calls — `getAll()` and
`where('__name__', 'in', batch)` both have issues in this route's context.

### `campuses` collection is empty
**Root cause:** Campus documents were never created.
**Impact:** `useCampusMode()` returns `false` everywhere. Any UI gated on `hasCampus`
is invisible to all users. `getCampusId(request)` falls back to hardcoded `'ub-buffalo'`.
**Status:** Intentional for now — hardcoded campus works for UB single-tenant launch.
