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
- Events API (`/api/events/personalized`) — returns events but **images + space links missing** (field mapping bugs, see Broken section)
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

### Launch Blockers (Feb 22 — updated, most RESOLVED)
1. ~~**Events feed missing images + space links**~~ — **RESOLVED.** `coverImageUrl` now reads `event.imageUrl || event.coverImageUrl`. `spaceHandle` resolved via batch space lookup.
2. ~~**Space events returning 0**~~ — **RESOLVED.** `fetchDocsForTimeField` now uses `toISOString()` for `startDate` fields. campusId removed from Firestore queries.
3. **Auth flow** — needs end-to-end validation as a new user. Last validated ~Feb 14.
4. **Profile page** — params access updated for Next.js 15 safety. Needs live validation.
5. ~~**7-day account age gate on space creation**~~ — **RESOLVED.** Gate removed from both `POST /api/spaces` and `GET /api/spaces/check-create-permission`.
6. ~~**Events nav tab in sidebar**~~ — **RESOLVED.** Already absent from `navigation.ts`. No Events tab exists.
7. ~~**Gathering threshold set to 10**~~ — **RESOLVED.** `DEFAULT_ACTIVATION_THRESHOLD = 1`.
8. ~~**campusId FAILED_PRECONDITION across all routes**~~ — **RESOLVED.** Removed `where('campusId', '==', ...)` from 60+ Firestore queries across all spaces, events, feed, auth, profile, privacy, and user routes. App-code filters added where campus isolation is needed.

---

## Stubs / Not Implemented
- `/api/tools/browse` — no export
- `/api/campus/dining/*` — no exports (3 routes)
- `/api/auth/alumni-waitlist` — no export
- `/api/auth/verify-access-code` — no export
- `/api/onboarding/matched-spaces` — no export
- `/api/notifications/stream` — SSE, no export
- `/api/qr` — no export

---

## Broken — Feb 22 2026 (mostly resolved)
_Updated after systemic campusId fix pass._

### `/api/events/personalized` — RESOLVED
Both field mapping bugs fixed: `coverImageUrl` reads `imageUrl || coverImageUrl`, `spaceHandle` resolved via batch space lookup. campusId removed from primary query — events fetch directly without fallback now.

### `/api/events` (space-scoped) — RESOLVED
`fetchDocsForTimeField` uses `toISOString()` for `startDate` fields. campusId removed from queries.

### `/events` nav tab — RESOLVED (was already clean)
`navigation.ts` never had an Events tab. 4-tab model: Feed · Spaces · Lab · Profile.

### `campuses` collection is empty
**Root cause:** Campus documents were never created.
**Impact:** `useCampusMode()` returns `false` everywhere. Any UI gated on `hasCampus`
is invisible to all users. `getCampusId(request)` falls back to hardcoded `'ub-buffalo'`.
**Status:** Intentional for now — hardcoded campus works for UB single-tenant launch.

### Remaining campusId queries (non-critical)
Admin routes (`/api/admin/*`) still have ~15 `where('campusId', ...)` calls. These are not user-facing and can be fixed when admin tooling is prioritized.
