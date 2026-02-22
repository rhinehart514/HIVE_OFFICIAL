# Known State — HIVE (Feb 2026)

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
