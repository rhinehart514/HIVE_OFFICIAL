# API Route Map — HIVE

~268 API routes. All authenticated routes use `withAuthAndErrors`. Always use `respond.*` not `NextResponse.json()`.

## Auth Routes (14 routes)

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/auth/send-code` | POST | None | Complete |
| `/api/auth/verify-code` | POST | None | Complete |
| `/api/auth/refresh` | POST | None | Complete |
| `/api/auth/me` | GET | Session cookie | Complete |
| `/api/auth/complete-entry` | POST | withAuth | Complete |
| `/api/auth/csrf` | GET | withAuth | Complete |
| `/api/auth/logout` | POST | withAuth | Complete |
| `/api/auth/check-admin-grant` | POST | withAuth | Complete |
| `/api/auth/check-handle` | GET, POST | None | Complete |
| `/api/auth/health` | GET | None | Complete |
| `/api/auth/sessions` | DELETE, GET | withAuth | Complete |
| `/api/auth/sessions/[sessionId]` | DELETE | withAuth | Complete |
| `/api/auth/alumni-waitlist` | POST | None | **Stub** |
| `/api/auth/verify-access-code` | POST | None | **Stub** |

## Space Routes (~60 routes)

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/spaces` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/spaces/[spaceId]/members` | DELETE, GET, PATCH, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/members/[memberId]` | DELETE, PATCH | withAuth | Complete |
| `/api/spaces/[spaceId]/members/batch` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/membership` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/membership/me` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/invite` | DELETE, GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/join-request` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/join-requests` | GET, PATCH | withAuth | Complete |
| `/api/spaces/invite/[code]/validate` | GET | None | Complete |
| `/api/spaces/invite/[code]/redeem` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/posts` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/posts/[postId]` | DELETE, GET, PATCH, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/posts/[postId]/comments` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/posts/[postId]/reactions` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/[messageId]` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/[messageId]/replies` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/[messageId]/react` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/[messageId]/pin` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/pinned` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/read` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/search` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/typing` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/intent` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/chat/stream` | POST | withAuth | Complete (SSE) |
| `/api/spaces/[spaceId]/events` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/events/[eventId]` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/spaces/[spaceId]/events/[eventId]/rsvp` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/tools` | DELETE, GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/tools/feature` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/feed` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/activity` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/analytics` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/data` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/go-live` | POST | None | Complete |
| `/api/spaces/[spaceId]/moderation` | GET, POST, PUT | withAuth | Complete |
| `/api/spaces/[spaceId]/preview` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/transfer-ownership` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/upload-avatar` | DELETE, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/upload-banner` | DELETE, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/upload` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/builder-permission` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/builder-status` | GET | withAuth | Complete |
| `/api/spaces/[spaceId]/apply-template` | POST | withAuth | Complete |
| `/api/spaces/[spaceId]/promote-post` | GET, POST | withAuth | Complete |
| `/api/spaces/[spaceId]/apps/[deploymentId]` | GET | withAuth | Complete |
| `/api/spaces/browse-v2` | GET | None | Complete |
| `/api/spaces/live` | GET | withAuth | Complete |
| `/api/spaces/mine` | GET | withAuth | Complete |
| `/api/spaces/recommended` | GET, POST | withAuth | Complete |
| `/api/spaces/residential` | GET | None | Complete |
| `/api/spaces/search` | POST | withAuth | Complete |
| `/api/spaces/templates` | GET | withAuth | Complete |
| `/api/spaces/check-create-permission` | GET | withAuth | Complete |
| `/api/spaces/check-handle` | GET | withAuth | Complete |
| `/api/spaces/claim` | GET, POST | withAuth | Complete |
| `/api/spaces/identity` | DELETE, GET, POST | withAuth | Complete |
| `/api/spaces/request-to-lead` | GET, POST | withAuth | Complete |
| `/api/spaces/waitlist` | GET, POST | withAuth | Complete |
| `/api/spaces/join-v2` | POST | withAuth | Complete |
| `/api/spaces/leave` | POST | withAuth | Complete |
| `/api/spaces/activity/recent` | GET | withAuth | Complete |
| `/api/spaces/transfer` | GET, POST | withAuth | Complete |
| `/api/spaces/route/[slug]` | GET, POST | None | Complete |

## Tools/HiveLab Routes (14 routes)

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/tools` | GET, POST, PUT | withAuth | Complete |
| `/api/tools/[toolId]` | DELETE, GET, PUT | withAuth | Complete |
| `/api/tools/[toolId]/deploy` | DELETE, GET, POST | withAuth | Complete |
| `/api/tools/[toolId]/clone` | POST | withAuth | Complete |
| `/api/tools/[toolId]/state` | DELETE, GET, POST | withAuth | Complete |
| `/api/tools/[toolId]/state/stream` | POST | withAuth | Complete (SSE) |
| `/api/tools/[toolId]/with-state` | GET | withAuth | Complete |
| `/api/tools/execute` | POST | withAuth | Complete |
| `/api/tools/generate` | POST | validateApiAuth | Complete (streaming) |
| `/api/tools/publish` | GET, POST | withAuth | Complete |
| `/api/tools/install` | POST | withAuth | Complete |
| `/api/tools/discover` | GET | withAuth | Complete |
| `/api/tools/browse` | GET | None | **Stub** |
| `/api/tools/recommendations` | GET | None | **Stub** |

## Profile Routes (14 routes)

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/profile` | GET, PATCH, POST, PUT | withAuth | Complete |
| `/api/profile/[userId]` | GET | None | Complete |
| `/api/profile/[userId]/activity` | GET | withAuth | Complete |
| `/api/profile/[userId]/events` | GET | withAuth | Complete |
| `/api/profile/[userId]/connections` | GET | None | Complete |
| `/api/profile/[userId]/follow` | DELETE, GET, POST | withAuth | Complete |
| `/api/profile/my-spaces` | GET | withAuth | Complete |
| `/api/profile/spaces` | GET | withAuth | Complete |
| `/api/profile/tools` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/profile/delete` | DELETE, POST | withAuth | Complete |
| `/api/profile/upload-photo` | POST | withAuth | Complete |
| `/api/profile/fcm-token` | DELETE, POST | withAuth | Complete |
| `/api/profile/notifications/preferences` | GET, PUT | withAuth | Complete |
| `/api/profile/privacy` | GET, PATCH | withAuth | Complete |

## Events, Feed, Templates, Placements

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/events` | GET, POST | withAuth | Complete |
| `/api/events/personalized` | GET | withAuth | Complete |
| `/api/feed/global` | GET | None | Complete |
| `/api/feed/search` | POST | withAuth | Complete |
| `/api/templates` | GET, POST | withAuth | Complete |
| `/api/templates/[templateId]` | DELETE, GET, PATCH | withAuth | Complete |
| `/api/templates/[templateId]/use` | POST | withAuth | Complete |
| `/api/placements` | GET | withAuth | Complete |
| `/api/placements/[placementId]` | DELETE, GET, PATCH | withAuth | Complete |

## Campus Routes

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/campus/detect` | GET | None | **Stub** |
| `/api/campus/buildings` | GET | None | Complete |
| `/api/campus/buildings/study-spots` | GET | None | Complete |
| `/api/campus/catalogs` | GET | None | Complete |
| `/api/campus/dining` | GET | None | **Stub** |
| `/api/campus/dining/[id]` | GET | None | **Stub** |
| `/api/campus/dining/recommend` | POST | None | **Stub** |

## Notifications, Content, Search, Users

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/notifications` | GET, POST, PUT | withAuth | Complete |
| `/api/notifications/stream` | POST | None | **Stub** |
| `/api/content/check` | POST | withAuth | Complete |
| `/api/content/check-image` | POST | withAuth | Complete |
| `/api/content/reports` | GET | None | Complete |
| `/api/comments/[commentId]/like` | POST | withAuth | Complete |
| `/api/search` | GET | None | Complete |
| `/api/users/search` | POST | None | Complete |
| `/api/users/suggestions` | GET | withAuth | Complete |

## Cron Routes (secured by CRON_SECRET)

| Route | Methods | Status |
|-------|---------|--------|
| `/api/cron/event-reminders` | GET | Complete |
| `/api/cron/automations` | GET | Complete |
| `/api/cron/sync-events` | GET | Complete |
| `/api/cron/tool-lifecycle` | GET | Complete |
| `/api/cron/setup-orchestration` | GET | Complete |

All crons run daily (Vercel Hobby plan).

## Utility & Other Routes

| Route | Methods | Auth | Status |
|-------|---------|------|--------|
| `/api/health` | GET | None | Complete |
| `/api/schools` | GET | None | Complete |
| `/api/feature-flags` | GET | None | Complete |
| `/api/analytics/track` | POST | withAuthValidation | Complete |
| `/api/analytics/metrics` | GET | None | Complete |
| `/api/activity` | GET | getCurrentUser | Complete |
| `/api/onboarding/catalog` | GET | None | Complete |
| `/api/onboarding/matched-spaces` | GET | None | **Stub** |
| `/api/automations/templates` | GET | None | Complete |
| `/api/errors/report` | POST | withAuth | Complete |
| `/api/feedback` | POST | None | **Stub** |
| `/api/verify/[slug]` | GET | None | Complete |
| `/api/privacy` | GET | None | Complete |
| `/api/privacy/visibility` | GET | None | Complete |
| `/api/privacy/ghost-mode` | GET | None | Complete |
| `/api/qr` | GET | None | **Stub** |

## Admin Routes (~60 routes under `/api/admin/`)

All admin routes require admin role verification. Categories:
- **Analytics:** `/admin/analytics/{comprehensive,growth,onboarding-funnel,realtime,retention}`
- **Users:** `/admin/users`, `/admin/users/[userId]`, `/admin/users/[userId]/{suspend,unsuspend}`, `/admin/users/{bulk,export}`
- **Spaces:** `/admin/spaces`, `/admin/spaces/[spaceId]`, `/admin/spaces/[spaceId]/{activity,feature,members,moderation}`, `/admin/spaces/{analytics,health}`
- **Tools:** `/admin/tools/{pending,review-stats}`, `/admin/tools/[toolId]/{approve,reject}`
- **Moderation:** `/admin/moderation/{reports,appeals,feedback,queue,violations}`, `/admin/content-moderation`
- **Command Center:** `/admin/command/{pulse,momentum,impact,health,territory}`
- **Schools:** `/admin/schools`, `/admin/schools/[schoolId]`, `/admin/school-admins`
- **Config:** `/admin/config`, `/admin/feature-flags`
- **AI Quality:** `/admin/ai-quality/{metrics,generations,edits,failures}`
- **Other:** `/admin/{activity-logs,alerts,announcements,builder-requests,claims,logs}`, `/admin/toolbar/{data-factory,impersonate}`
