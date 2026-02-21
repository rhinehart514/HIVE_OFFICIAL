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
